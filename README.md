# SWEKAM Technologies Limited — Website

A high-conversion marketing website for **SWEKAM Technologies Limited**, a Kenyan solar PV
company. It sells the design, supply, installation and maintenance of Solar PV systems for
homes, businesses, institutions, factories and farms. Built with **HTML, CSS and vanilla
JavaScript only** — no frameworks, no build step, no runtime dependencies.

## Business details

| | |
|---|---|
| **Name** | SWEKAM Technologies Limited |
| **Address** | Sawai Apartments, OAU Road, Sec. 9 · P.O. Box 5079, 01002, Thika |
| **Phone / WhatsApp** | 0729 611 356 (`+254 729 611 356`) |
| **Email** | swekamtechnologies@gmai.com |
| **Service area** | Kenya — all 47 counties, mobilising from Thika |
| **Services** | Solar PV Design · Supply · Installation · Maintenance |
| **Segments** | Homes · Businesses · Institutions · Factories · Farms |
| **Logo artwork** | `assets/logoswekam.jpeg` (supplied original, never redrawn) |

Everything above is repeated in `index.html` (topbar, hero, quote section, footer, JSON-LD) and
in `site.webmanifest`, `robots.txt` and `sitemap.xml`. Search for the phone number to move it.

## Colour system

The whole site is driven by the flat corporate palette below. There are **no gradients, no
shadows of a third hue, no pastels** anywhere in the CSS — `tests/site.spec.js` fails the build
if a gradient or an off-palette colour is introduced.

| Role | Colour | Used for |
|---|---|---|
| `--brand` | `#003B95` | Dominant: headings, typography, buttons, dark sections, logo |
| `--brand-400/700/900` | `#1E57B8` `#002A6E` `#001B47` | Hover, focus rings, footer/topbar band |
| `--brand-300/200/100/050` | `#8FB2E8` `#C7DAF5` `#E8EFFB` `#F5F8FD` | Tints for secondary text, borders, section backgrounds |
| `--accent` | `#F20D16` | Red, used selectively: primary CTA, rules, badges, active states, rating stars |
| `--accent-700` | `#C60A11` | Hover on red elements |
| `--white` | `#FFFFFF` | Background and negative space |

Rules applied throughout: blue dominates type and surfaces, red only marks the element you are
meant to click or the emphasis you are meant to remember. On navy surfaces red text is replaced
by white text with a **red underline** (`.hl`) because red-on-navy fails contrast. The WhatsApp
bubble is brand red, not green, so no fourth colour enters the page. Rating stars are red — the
red sunburst in the SWEKAM logo is the reference.

The only graphic texture is `--pv-grid`, a flat white SVG module grid (no gradient) laid over
navy sections at 12% opacity to read as solar panels.

## Running it

It is a static site — just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
# then visit http://localhost:8080
```

To deploy, upload the whole folder to any static host (Netlify, Vercel, GitHub Pages, cPanel).
Nothing needs compiling.

## Conversion features

- **Three floating actions** — a labelled Dashboard button above the WhatsApp bubble, plus Back
  to Top. Dashboard opens a full-height, keyboard-accessible page menu outside the fixed header.
- **Two capture forms** — a collapsed "Request a Callback" form in the hero (native `<details>`
  disclosure) and a 3-step quote wizard (Need → Site → Contact) to reduce abandonment.
- **Indicative bill sizer** — a slider in step 1 turns a monthly power bill into an approximate
  kWp array, panel count, yearly generation, roof area and backup storage. It is deliberately
  labelled as an estimate; the real number comes from the survey. The value travels into the
  WhatsApp message and the confirmation text.
- **Sector self-selection** — five "Who We Power" cards (Homes, Businesses, Institutions,
  Factories, Farms), each with a typical kWp spec and a `data-prefill` link that lands in the
  wizard with the right service already ticked.
- **Forms hand off to WhatsApp** — on submit, details are formatted into a pre-filled message so
  no lead is lost to an unmonitored inbox.
- **Trust stack** — animated counters (systems, kWp commissioned, counties, years, uptime),
  25-year panel / 5-year workmanship warranty figures, 30 reviews averaging 4.9.
- **Objection handling** — a 10-question FAQ covering cost, real savings, batteries, net
  metering, DB boards, lifespans, roof suitability, motor loads, cloudy days and payment terms.
- **Contact plate** — physical address, P.O. Box, opening hours and a "Get directions" link in
  both the quote section and the footer.

## Sections

Hero (collapsible callback + warranty meters) · Stats · Services (capability band, two feature
blocks, three service cards, equipment grid) · Who We Power (5 segments) · Process timeline ·
About/Why us (with the supplied logo plaque) · Coverage (region tabs) · Projects gallery
(filterable + lightbox) · Reviews (30, filterable, paginated) · FAQ · Quote wizard · Footer with
contacts.

The header displays **ONE ROOF. THIRTY YEARS OF SUN. YOUR POWER BILL, ENGINEERED DOWN.**
Page navigation lives in the floating Dashboard. `#contact` links lead to the footer contact column.

## Technical notes

- **Responsive** from 320px up, with layout breakpoints at 1180 / 1024 / 900 / 820 / 560px, plus
  short-viewport rules so all 11 Dashboard pages fit without an inner scroller.
- **SEO** — semantic HTML, Open Graph + Twitter cards, `robots.txt`, `sitemap.xml` and two
  JSON-LD blocks (`LocalBusiness` with the full postal address, opening hours, offer catalogue
  and `aggregateRating`, plus `FAQPage`) so rich results can show stars and expandable questions.
- **Accessibility** — skip link, single `<h1>`, every image has alt text, every field has a
  matching `<label>`, native modal Dashboard with focus trapping, Escape/backdrop dismissal and
  focus restoration, keyboard-operable region tabs, visible focus rings and
  `prefers-reduced-motion` support.
- **Performance** — no libraries, hero image preloaded, all other images lazy-loaded (the header
  logo is eager because it is above the fold), animations driven by `IntersectionObserver`, and
  an inline SVG icon sprite instead of an icon font.
- **Form validation** — Kenyan phone formats (`07…`, `01…`, `+254…`) and email validated
  client-side with inline messages; errors show on blur or submit, never while typing.

## File structure

```
index.html              markup, SVG icon sprite, JSON-LD
assets/css/style.css    flat palette tokens + all styling and responsive rules
assets/js/main.js       nav, reveals, counters, tabs, gallery, lightbox, reviews, sizer, forms
assets/js/reviews.js    the 30 review records (edit here to change reviews)
assets/logoswekam.jpeg  supplied logo artwork
assets/img/             logo exports, photography, favicon
robots.txt · sitemap.xml · site.webmanifest
playwright.config.js    optional browser-test configuration (no runtime dependency)
tests/site.spec.js      responsive navigation, disclosures, regions, forms and palette checks
```

## Browser regression tests (optional)

The website runs without Node.js or a build step. For development checks, install Node.js 20+
and Python 3, then run:

```bash
npm ci
npx playwright install --with-deps chromium
npm test
```

The suite starts the static server automatically (or reuses an existing one on port 8080) and
checks desktop, small desktop, tablet, phone, 320px and short landscape layouts. It covers the
three floating actions, the full-height Dashboard and keyboard navigation, the solar statistics
and stars, the five market segments and their prefill links, the bill sizer, the WhatsApp
handoff text, collapsed callback and FAQs, all region tabs, reviews/gallery pagination — and it
asserts that the stylesheet stays flat (no `gradient(` anywhere) and that every colour used is
inside the navy/red/white palette, so the brand rules cannot drift.

Set `CHROMIUM_EXECUTABLE_PATH` to reuse an installed Chromium. Reports, traces and screenshots
are git-ignored.

## Editing common things

- **Reviews** — edit `assets/js/reviews.js`. Each record is
  `{ n: name, l: location, s: stars, v: service, d: date, t: text }`. `v` must match a
  `data-rev` value on a filter chip in `index.html`, or the chip will show zero results. The
  summary bars in `.rev-bars` are hardcoded, so update those counts if ratings change.
- **Phone / WhatsApp** — the number appears several times in `index.html` and as `WA_NUMBER` at
  the top of `main.js`.
- **Gallery** — edit the `GALLERY` array in `main.js`; `cat` must match a filter chip.
- **Service areas** — edit the `REGIONS` object in `main.js`.
- **Estimator constants** — `TARIFF_KSH`, `KWH_PER_KWP_MONTH` and `PANEL_W` at the top of the
  sizer block in `main.js`.

## Before you publish — please confirm

1. **Email** is reproduced exactly as supplied: `swekamtechnologies@gmai.com`. If that should be
   `@gmail.com`, search-and-replace the string in `index.html`, `site.webmanifest` is unaffected.
2. **Domain** is a placeholder (`https://swekamtechnologies.co.ke`) in the canonical, Open Graph,
   JSON-LD, `robots.txt` and `sitemap.xml` URLs. Replace with the real domain before launch, or
   remove the canonical/OG URL lines.
3. **Opening hours** (Mon–Fri 8:00–18:00, Sat 9:00–13:00) and the **WhatsApp** availability on
   0729 611 356 were assumed — adjust in the topbar, footer and JSON-LD.
4. **Trust numbers are illustrative**: 920+ systems, 5,200 kWp, 47 counties, 12+ years, 99%
   still-running, the 25-year/5-year warranty wording, the 48-hour quote turnaround and the
   4.9/30 review score. Swap them for figures you can evidence, and replace the 30 reviews with
   real client feedback — publishing invented testimonials is a legal risk, not just a poor look.
5. **Photography** in `assets/img/` is AI-generated placeholder imagery. Replace with real photos
   of SWEKAM's own crews, panels and completed sites (same filenames, roughly 1400×770 for the
   hero, 1400×770 or 800×600 elsewhere); project photos convert markedly better than stock.
6 **Certifications**: no licence numbers are claimed anywhere. If you are EPRA-licensed, EBK-
   registered or an authorised dealer for a specific panel/inverter brand, that is worth adding
   to the hero pill and the footer badges — it is the single strongest trust signal for C&I work.
