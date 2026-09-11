const { test: base, expect } = require('@playwright/test');

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

const pageLinks = ['#home', '#services', '#process', '#about', '#coverage', '#projects', '#reviews', '#faq', '#quote', '#contact'];

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

test('header slogan replaces Contact without changing the hero, statistics or stars', async ({ page }) => {
  await expect(page.locator('#header .navbar__tagline')).toHaveText('ONE BOREHOLE. YEARS OF WATER. A PROPERTY TRANSFORMED.');
  await expect(page.locator('#header a[href="#contact"]')).toHaveCount(0);
  await expect(page.locator('h1')).toHaveText("Kenya's Trusted Borehole Drilling Company");
  expect(await page.locator('.stat__num').evaluateAll(elements => elements.map(el => [el.dataset.count, el.dataset.suffix]))).toEqual([
    ['1200', '+'], ['47', ''], ['98', '%'], ['15', '+'], ['380', '+'],
  ]);
  await expect(page.locator('.hero__proof .stars use')).toHaveCount(5);
  await expect(page.locator('.hero__proof .stars')).toHaveAttribute('aria-label', 'Rated 4.9 out of 5');
  await expect(page.locator('.rev-score .stars use')).toHaveCount(5);
  await expect(page.locator('.rev-score__num')).toHaveText('4.9');
  expect(await page.evaluate(() => window.WATERWALL_REVIEWS.length)).toBe(50);

  const bounds = await page.locator('.navbar__tagline').boundingBox();
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
});

test('removed sections leave the intended order and keep footer contacts', async ({ page }) => {
  await expect(page.locator('#trust, .trust, .cta-banner, section.contact, #mobilebar')).toHaveCount(0);
  await expect(page.locator('#home + #stats')).toHaveCount(1);
  await expect(page.locator('#reviews + #faq')).toHaveCount(1);
  await expect(page.locator('main > section:last-child')).toHaveAttribute('id', 'quote');
  await expect(page.locator('main + footer')).toHaveCount(1);
  await expect(page.locator('footer #contact a[href="tel:+254705901445"]')).toHaveCount(1);
  await expect(page.locator('footer #contact a[href="mailto:info@waterwallboreholedrilling.co.ke"]')).toHaveCount(1);
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
  expect(whatsappURL.origin + whatsappURL.pathname).toBe('https://wa.me/254705901445');
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
  await page.locator('#qf-service').selectOption('Borehole Drilling');
  await page.locator('#qf-location').fill('Thika, Kiambu');
  await page.locator('#quickForm button[type="submit"]').click();
  const urls = await page.evaluate(() => window.openedURLs);
  expect(urls).toHaveLength(1);
  const url = new URL(urls[0]);
  expect(url.origin + url.pathname).toBe('https://wa.me/254705901445');
  expect(url.searchParams.get('text')).toContain('Name: Test Customer');
  expect(url.searchParams.get('text')).toContain('Location: Thika, Kiambu');
  await expect(page.locator('#qf-name')).toHaveValue('');
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
  const regions = { nairobi: 'Nairobi', central: 'Nyeri', rift: 'Nakuru', eastern: 'Machakos', coast: 'Mombasa', western: 'Kisumu', north: 'Garissa' };
  for (const [region, county] of Object.entries(regions)) {
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
    await expect(page.locator('#coveragePanel .cpin').first()).toHaveText(county);
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

  await page.locator('.opt').filter({ hasText: 'Full package' }).click();
  await page.locator('[data-step="1"] [data-next]').click();
  await page.locator('#q-county').fill('Kiambu');
  await page.locator('#q-area').fill('Thika');
  await page.locator('[data-step="2"] [data-next]').click();
  await page.locator('#q-name').fill('Test Customer');
  await page.locator('#q-phone').fill('0700000000');
  await page.locator('#quoteForm button[type="submit"]').click();
  await expect(page.locator('.msform__done')).toBeVisible();
  const url = new URL(await page.locator('#waSend').getAttribute('href'));
  expect(url.searchParams.get('text')).toContain('Service: Borehole Drilling');
  expect(url.searchParams.get('text')).toContain('County: Kiambu');
});
