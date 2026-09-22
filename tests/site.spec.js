const { test: base, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Keep the regression suite independent of Google Fonts/network availability.
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({
      contentType: 'text/css', body: '',
    }));
    await use(page);
    expect(errors, 'No uncaught browser errors').toEqual([]);
  },
});

const pageLinks = ['#home', '#services', '#segments', '#process', '#about', '#coverage', '#projects', '#reviews', '#faq', '#quote', '#contact'];

// Flat corporate palette only: navy #003B95, red #F20D16, white — plus
// tints/shades of those same two hues. Nothing else is allowed in the CSS.
const PALETTE = [
  '#fff', '#ffffff', '#000',
  '#003b95', '#1e57b8', '#002a6e', '#001b47', '#8fb2e8', '#c7daf5', '#e8effb', '#f5f8fd', '#d8e4f5', '#2a3a55', '#60718c', '#93a5c4',
  '#f20d16', '#c60a11',
];
const RGBA = ['0,27,71', '0,59,149', '143,178,232', '242,13,22', '255,255,255'];

const read = (...p) => fs.readFileSync(path.join(__dirname, '..', ...p), 'utf8');

async function scrollTo(page, selector) {
  await page.locator(selector).evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'center' }));
}

async function openDashboard(page) {
  await page.locator('#dashboardToggle').click();
  await expect(page.getByRole('dialog', { name: 'Dashboard' })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#preloader')).toBeHidden();
});

test('solar brand, slogan, statistics and stars replace the drilling site', async ({ page }) => {
  await expect(page.locator('#header .navbar__tagline')).toHaveText('ONE ROOF. THIRTY YEARS OF SUN. YOUR POWER BILL, ENGINEERED DOWN.');
  await expect(page.locator('#header a[href="#contact"]')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText("Kenya's Trusted Solar PV Company");
  await expect(page.locator('.brand__logo')).toHaveAttribute('src', 'assets/img/logo-mark.png');
  expect(await page.locator('.stat__num').evaluateAll(elements => elements.map(el => [el.dataset.count, el.dataset.suffix]))).toEqual([
    ['920', '+'], ['5200', ' kWp'], ['47', ''], ['12', '+'], ['99', '%'],
  ]);
  await expect(page.locator('.hero__proof .stars use')).toHaveCount(5);
  await expect(page.locator('.hero__proof .stars')).toHaveAttribute('aria-label', 'Rated 4.9 out of 5');
  await expect(page.locator('.rev-score .stars use')).toHaveCount(5);
  await expect(page.locator('.rev-score__num')).toHaveText('4.9');
  expect(await page.evaluate(() => window.SWEKAM_REVIEWS.length)).toBe(33);
  expect(await page.evaluate(() => document.title)).toContain('SWEKAM Technologies Limited | Solar PV');

  const bounds = await page.locator('.navbar__tagline').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
});

test('the site sells solar PV, not boreholes', async ({ page }) => {
  const html = read('index.html');
  expect(html).toMatch(/SWEKAM Technologies Limited/);
  expect(html).toMatch(/Solar PV systems for homes, businesses, institutions, factories and farms/);
  expect(html).not.toMatch(/Waterwall|borehole drilling|hydrogeolog|test pump|drilling rig|\bWRA\b|\bNCA\b/i);
  expect(html).toContain('assets/img/hero-solar.jpg');
  expect(html).not.toContain('hero-rig.jpg');
  // Supplied artwork is used as-is in the about section and the footer.
  await expect(page.locator('.logo-plaque img')).toHaveAttribute('src', 'assets/img/logo-swekam.png');
  await expect(page.locator('.footer__brand .logo-tile img')).toBeVisible();
  // Every image the page loads actually exists.
  const sources = await page.evaluate(() => [...new Set(Array.from(document.querySelectorAll('img'), img => img.currentSrc || img.src))]);
  expect(sources.length).toBeGreaterThan(8);
  for (const src of sources) expect(await (await page.request.get(src)).status(), src).toBe(200);
});

test('stylesheet stays flat and inside the three-colour palette', () => {
  const stylesheet = read('assets/css/style.css');
  expect(stylesheet).not.toContain('#fff6f6');
  expect(stylesheet).not.toMatch(/gradient\(/);
  expect(stylesheet).toMatch(/--brand:\s*#003B95/);
  expect(stylesheet).toMatch(/--accent:\s*#F20D16/);
  const hexes = stylesheet.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  const offPalette = [...new Set(hexes.map(h => h.toLowerCase()))].filter(h => !PALETTE.includes(h));
  expect(offPalette, `colours outside the navy/red/white palette: ${offPalette.join(', ')}`).toEqual([]);
  const rgba = [...new Set((stylesheet.match(/rgba\(\s*\d+,\s*\d+,\s*\d+/g) || []).map(m => m.replace(/rgba\(\s*/, '')))];
  expect(rgba.filter(t => !RGBA.includes(t))).toEqual([]);
});

test('removed sections leave the intended order and keep footer contacts', async ({ page }) => {
  await expect(page.locator('#trust, .trust, .cta-banner, section.contact, #mobilebar')).toHaveCount(0);
  await expect(page.locator('#home + #stats')).toHaveCount(1);
  await expect(page.locator('#reviews + #faq')).toHaveCount(1);
  await expect(page.locator('main > section:last-child')).toHaveAttribute('id', 'quote');
  await expect(page.locator('main + footer')).toHaveCount(1);
  await expect(page.locator('footer #contact a[href="tel:+254729611386"]')).toHaveCount(1);
  await expect(page.locator('footer #contact a[href="mailto:swekamtechnologies@gmai.com"]')).toHaveCount(1);
  await expect(page.locator('footer #contact')).toContainText('3rd Floor, Highway Mall, Uhuru Highway');
  await expect(page.locator('footer #contact')).toContainText('P.O. Box 5079');
});

test('no link is left without a text label', async ({ page }) => {
  const empty = await page.locator('main a, footer a').evaluateAll(els => els
    .filter(el => !/^#/.test(el.getAttribute('href') || '') || true)
    .filter(el => !el.textContent.trim() && !el.closest('.hero__scroll'))
    .map(el => el.outerHTML.slice(0, 80)));
  expect(empty, 'every anchor needs visible text or an aria-label').toEqual([]);
});

test('every in-page link has a unique destination after section removal', async ({ page }) => {
  const problems = await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[id]'), el => el.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    const brokenLinks = Array.from(document.querySelectorAll('a[href^="#"]'), el => el.getAttribute('href'))
      .filter(href => href !== '#' && !document.getElementById(href.slice(1)));
    return { duplicates, brokenLinks };
  });
  expect(problems).toEqual({ duplicates: [], brokenLinks: [] });
});

test('only the three requested actions float, with Dashboard above WhatsApp', async ({ page }) => {
  await expect(page.locator('.fab')).toHaveCount(3);
  await expect(page.locator('#burger, .mobilebar')).toHaveCount(0);
  await expect(page.locator('#toTop')).toBeHidden();
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
  await expect(page.locator('#toTop')).toBeVisible();

  const dashboard = await page.locator('#dashboardToggle').boundingBox();
  const whatsapp = await page.locator('.fab--wa').boundingBox();
  const top = await page.locator('#toTop').boundingBox();
  expect(dashboard.y + dashboard.height).toBeLessThan(whatsapp.y);
  expect(whatsapp.y + whatsapp.height).toBeLessThan(top.y);
  expect(Math.abs(dashboard.x + dashboard.width - whatsapp.x - whatsapp.width)).toBeLessThan(1);
  expect(top.y + top.height).toBeLessThan(page.viewportSize().height);
  expect(await page.locator('body').evaluate(el => getComputedStyle(el).paddingBottom)).toBe('0px');
  expect(await page.locator('.fab').evaluateAll(elements => elements.map(el => getComputedStyle(el).position))).toEqual(['fixed', 'fixed', 'fixed']);

  const whatsappURL = new URL(await page.locator('.fab--wa').getAttribute('href'));
  expect(whatsappURL.origin + whatsappURL.pathname).toBe('https://wa.me/254729611386');
  await expect(page.locator('.fab--wa')).toHaveAttribute('target', '_blank');
  await expect(page.locator('.fab--wa')).toHaveAttribute('rel', 'noopener');
  await page.locator('#toTop').click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('#toTop')).toBeHidden();
});

test('Dashboard fills the viewport and shows all pages even when the header is hidden', async ({ page }) => {
  await page.evaluate(() => window.scrollTo({ top: 1000, behavior: 'instant' }));
  await expect(page.locator('#header')).toHaveClass(/is-hidden/);
  await openDashboard(page);
  await expect(page.locator('#dashboardToggle')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#dashboardClose')).toBeFocused();
  await expect(page.locator('body')).toHaveClass(/is-locked/);
  expect(await page.locator('.nav__link').evaluateAll(elements => elements.map(el => el.getAttribute('href')))).toEqual(pageLinks);

  const bounds = await page.locator('#dashboard').boundingBox();
  expect(bounds.y).toBe(0);
  expect(bounds.height).toBe(page.viewportSize().height);
  const overflow = await page.locator('#dashboard').evaluate(el => el.scrollHeight - el.clientHeight);
  expect(overflow, 'All pages fit without an inner scroller').toBeLessThanOrEqual(1);
  for (const href of pageLinks) {
    await expect(page.locator(`.nav__link[href="${href}"]`)).toBeInViewport({ ratio: 1 });
  }

  await page.keyboard.press('Escape');
  await expect(page.locator('#dashboard')).toBeHidden();
  await expect(page.locator('#dashboardToggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#dashboardToggle')).toBeFocused();
  await expect(page.locator('body')).not.toHaveClass(/is-locked/);
});

test('Dashboard keeps focus off the background and closes by button or backdrop', async ({ page }) => {
  await page.locator('#dashboardToggle').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#dashboard')).toBeVisible();
  // A native modal makes background controls inert, including programmatic focus.
  await page.locator('.hero__actions a').first().evaluate(el => el.focus());
  await expect(page.locator('#dashboardClose')).toBeFocused();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    // Native dialogs may let Tab visit browser chrome, but never the page behind them.
    expect(await page.evaluate(() => !document.hasFocus() || document.querySelector('#dashboard').contains(document.activeElement))).toBe(true);
  }
  await page.locator('#dashboardClose').click();
  await expect(page.locator('#dashboard')).toBeHidden();

  for (let i = 0; i < 3; i++) {
    await openDashboard(page);
    const bounds = await page.locator('#dashboard').boundingBox();
    if (bounds.x > 10) await page.mouse.click(5, page.viewportSize().height / 2);
    else await page.locator('#dashboardClose').click();
    await expect(page.locator('#dashboard')).toBeHidden();
    await expect(page.locator('#dashboardToggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('body')).not.toHaveClass(/is-locked/);
  }
});

test('every Dashboard page link navigates and closes the menu', async ({ page }) => {
  for (const href of pageLinks) {
    await openDashboard(page);
    await page.locator(`.nav__link[href="${href}"]`).click();
    await expect(page.locator('#dashboard')).toBeHidden();
    await expect(page.locator('body')).not.toHaveClass(/is-locked/);
    expect(new URL(page.url()).hash).toBe(href);
    await expect(page.locator(href)).toBeInViewport();
  }
});

test('callback starts collapsed and toggles by mouse and keyboard without losing input', async ({ page }) => {
  const callback = page.locator('#callback');
  const summary = callback.locator('summary');
  await expect(callback).toHaveJSProperty('open', false);
  await expect(page.locator('#quickForm')).toBeHidden();
  await summary.click();
  await expect(callback).toHaveJSProperty('open', true);
  await page.locator('#qf-name').fill('Test Customer');
  await summary.press('Enter');
  await expect(page.locator('#quickForm')).toBeHidden();
  await summary.press('Space');
  await expect(page.locator('#quickForm')).toBeVisible();
  await expect(page.locator('#qf-name')).toHaveValue('Test Customer');
  await summary.click();
  await expect(callback).toHaveJSProperty('open', false);
});

test('expanded callback still validates and prepares the WhatsApp handoff', async ({ page }) => {
  await page.evaluate(() => {
    window.openedURLs = [];
    window.open = url => { window.openedURLs.push(url); return null; };
  });
  await page.locator('#callback summary').click();
  await page.locator('#quickForm button[type="submit"]').click();
  await expect(page.locator('#quickForm .field.has-error')).toHaveCount(4);
  await page.locator('#qf-name').fill('Test Customer');
  await page.locator('#qf-phone').fill('0700000000');
  await page.locator('#qf-service').selectOption('Home Solar System');
  await page.locator('#qf-location').fill('Thika, Kiambu');
  await page.locator('#quickForm button[type="submit"]').click();
  const urls = await page.evaluate(() => window.openedURLs);
  expect(urls).toHaveLength(1);
  const url = new URL(urls[0]);
  expect(url.origin + url.pathname).toBe('https://wa.me/254729611386');
  expect(url.searchParams.get('text')).toContain('Name: Test Customer');
  expect(url.searchParams.get('text')).toContain('Service: Home Solar System');
  expect(url.searchParams.get('text')).toContain('Location: Thika, Kiambu');
  await expect(page.locator('#qf-name')).toHaveValue('');
});

test('the five market segments each carry their own quote link', async ({ page }) => {
  await expect(page.locator('#segments .seg')).toHaveCount(5);
  expect(await page.locator('#segments .seg h3').allTextContents()).toEqual(['Homes', 'Businesses', 'Institutions', 'Factories', 'Farms']);
  const prefills = await page.locator('#segments .seg a[data-prefill]').evaluateAll(els => els.map(el => el.dataset.prefill));
  expect(prefills).toEqual([
    'Home Solar System',
    'Business & Commercial Solar',
    'Institution / School Solar',
    'Factory & Industrial Solar',
    'Farm & Solar Water Pumping',
  ]);
  for (const seg of await page.locator('#segments .seg img').all()) {
    expect(await seg.getAttribute('alt')).not.toBe('');
  }
});

test('the bill slider sizes an indicative system as you drag it', async ({ page }) => {
  const slider = page.locator('#q-bill');
  await expect(page.locator('#estBill')).toHaveText('KSh 25,000');
  const small = await page.locator('#estOut .est__pill').first().innerText();
  await slider.fill('180000');
  await expect(page.locator('#estBill')).toHaveText('KSh 180,000');
  const large = await page.locator('#estOut .est__pill').first().innerText();
  expect(parseFloat(large)).toBeGreaterThan(parseFloat(small));
  expect(await page.locator('#estOut .est__pill')).not.toHaveCount(0);
  // The slider choice travels with the enquiry into the WhatsApp message.
  expect(await page.locator('#estOut').innerText()).toContain('kWp');
});

test('all FAQs start closed and retain single-open and show-more behavior', async ({ page }) => {
  await expect(page.locator('.acc')).toHaveCount(10);
  await expect(page.locator('.acc[open]')).toHaveCount(0);
  const first = page.locator('.acc').nth(0);
  const second = page.locator('.acc').nth(1);
  await first.locator('summary').click();
  await expect(first).toHaveJSProperty('open', true);
  await second.locator('summary').click();
  await expect(first).toHaveJSProperty('open', false);
  await expect(page.locator('.acc[open]')).toHaveCount(1);
  await second.locator('summary').click();
  await expect(page.locator('.acc[open]')).toHaveCount(0);

  if (page.viewportSize().width <= 820) {
    await expect(page.locator('.acc:visible')).toHaveCount(3);
    await page.locator('#faqToggle').click();
    await expect(page.locator('.acc:visible')).toHaveCount(10);
    await expect(page.locator('.acc[open]')).toHaveCount(0);
    await page.locator('.acc').last().locator('summary').click();
    await expect(page.locator('.acc[open]')).toHaveCount(1);
    await page.locator('#faqToggle').click();
    await expect(page.locator('.acc:visible')).toHaveCount(3);
    await expect(page.locator('.acc[open]')).toHaveCount(0);
  } else {
    await expect(page.locator('.acc:visible')).toHaveCount(10);
    await expect(page.locator('#faqToggle')).toBeHidden();
  }
});

test('every region is visible without horizontal scrolling and selects its counties', async ({ page }) => {
  await scrollTo(page, '.coverage__tabs');
  const tabs = page.getByRole('tablist', { name: 'Regions served' });
  await expect(tabs.getByRole('tab')).toHaveCount(7);
  expect(await tabs.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  const bounds = await tabs.boundingBox();
  const regions = { nairobi: 'Nairobi (our base)', central: 'Nyeri', rift: 'Nakuru', eastern: 'Machakos', coast: 'Mombasa', western: 'Kisumu', north: 'Garissa' };
  for (const [region, place] of Object.entries(regions)) {
    const tab = page.locator(`#region-${region}`);
    const box = await tab.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
    expect(Math.round(box.height * 100) / 100).toBeGreaterThanOrEqual(44);
    await tab.click();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#coveragePanel')).toHaveAttribute('aria-labelledby', `region-${region}`);
    await expect(page.locator('#coveragePanel .cpin').first()).toHaveText(place);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('region tabs support arrow keys, Home and End with correct focus', async ({ page }) => {
  await scrollTo(page, '.coverage__tabs');
  await page.locator('#region-nairobi').focus();
  for (const [key, region] of [['End', 'north'], ['ArrowRight', 'nairobi'], ['ArrowLeft', 'north'], ['Home', 'nairobi'], ['ArrowRight', 'central']]) {
    await page.keyboard.press(key);
    await expect(page.locator(`#region-${region}`)).toBeFocused();
    await expect(page.locator(`#region-${region}`)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.ctab[tabindex="0"]')).toHaveCount(1);
  }
});

test('reviews, gallery and quote wizard still work after navigation changes', async ({ page }) => {
  await expect(page.locator('#revGrid .rcard')).toHaveCount(5);
  await page.locator('#revMore').click();
  await expect(page.locator('#revGrid .rcard')).toHaveCount(10);
  await page.locator('#revLess').click();
  await expect(page.locator('#revGrid .rcard')).toHaveCount(5);

  await page.locator('.gitem').first().click();
  await expect(page.locator('#lightbox')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/is-locked/);

  // A "Quote the farm" link arrives with the matching sector already chosen.
  await scrollTo(page, '#segments');
  await page.locator('#segments .seg a[data-prefill="Farm & Solar Water Pumping"]').click();
  await expect(page.locator('input[name="service"][value="Farm & Solar Water Pumping"]')).toBeChecked();

  await page.locator('.opt').filter({ hasText: 'Shops, offices, hotels' }).click();
  await expect(page.locator('input[name="service"][value="Business & Commercial Solar"]')).toBeChecked();
  await page.locator('[data-step="1"] [data-next]').click();
  await page.locator('#q-county').fill('Kiambu');
  await page.locator('#q-area').fill('Thika');
  await page.locator('[data-step="2"] [data-next]').click();
  await page.locator('#q-name').fill('Test Customer');
  await page.locator('#q-phone').fill('0700000000');
  await page.locator('#quoteForm button[type="submit"]').click();
  await expect(page.locator('.msform__done')).toBeVisible();
  const url = new URL(await page.locator('#waSend').getAttribute('href'));
  expect(url.searchParams.get('text')).toContain('Need: Business & Commercial Solar');
  expect(url.searchParams.get('text')).toContain('County: Kiambu');
  expect(url.searchParams.get('text')).toContain('Indicative size:');
});
