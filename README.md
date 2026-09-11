# Waterwall Borehole Drilling — Website

A high-conversion marketing website for **Waterwall Borehole Drilling**, a Kenyan borehole
drilling company that also installs solar systems. Built with **HTML, CSS and vanilla
JavaScript only** — no frameworks, no build step, no dependencies.

## Business details

| | |
|---|---|
| **Name** | Waterwall Borehole Drilling *(one word — "Waterwall")* |
| **Phone / WhatsApp** | 0705 901 445 |
| **Email** | info@waterwallboreholedrilling.co.ke |
| **Service area** | Countrywide — all 47 counties of Kenya |
| **Core services** | Hydrogeological Survey · Borehole Drilling · Pump Installation · Test Pumping |
| **Secondary service** | Solar Panel Installation |

Borehole drilling is positioned as the flagship business throughout (hero, "Core Service"
badge, largest service blocks, 31 of the 50 reviews); solar is presented as a strong
supporting service rather than a co-headline.

## Running it

It is a static site — just open `index.html`, or serve the folder:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
# then visit http://localhost:8080
```

To deploy, upload the whole folder to any static host (Netlify, Vercel, GitHub Pages,
cPanel). Nothing needs compiling.

## Conversion features

- **Three floating actions** — a labelled Dashboard button above the existing WhatsApp
  bubble, plus Back to Top. Dashboard opens a full-height, keyboard-accessible page menu
  outside the fixed header; there is no bottom Call / WhatsApp / Free Quote bar.
- **Two capture forms** — a short "Request a Callback" form in the hero, collapsed by
  default and expandable/collapsible with a native disclosure, and a 3-step quote wizard
  (Service → Site → Contact) that reduces form abandonment.
- **Forms hand off to WhatsApp** — on submit, details are formatted into a pre-filled
  WhatsApp message so no lead is lost to an unmonitored inbox.
- **Trust stack** — NCA/WRA badges, animated counters, 15+ years, 98% strike rate,
  12-month warranty, and 50 verified reviews averaging 4.9.
- **Objection handling** — a 10-question FAQ covering cost, permits, timelines, depth,
  water safety and the "what if you don't strike water?" fear. All answers start collapsed;
  opening one closes the previous answer.
- **Visible region options** — the Where We Work tabs wrap on mobile so every region,
  including Eastern and Northern, is available without horizontal scrolling.
- **Transparent 6-step process timeline** so buyers know exactly what happens next.

## Sections

Hero (collapsible callback) · Stats · Services · Process timeline · About/Why us ·
Coverage (wrapped region tabs) · Projects gallery (filterable + lightbox) · Reviews
(50, filterable, paginated) · FAQ · Quote wizard · Footer with contacts

The header displays **ONE BOREHOLE. YEARS OF WATER. A PROPERTY TRANSFORMED.**
Page navigation lives in the floating Dashboard. Existing `#contact` links lead to the
footer contact details.

## Technical notes

- **Responsive** from 320px up, with layout breakpoints at 1180 / 1024 / 900 / 820 / 560px.
- **SEO** — semantic HTML, Open Graph + Twitter cards, `robots.txt`, `sitemap.xml`, and
  two JSON-LD blocks (`LocalBusiness` with `aggregateRating`, and `FAQPage`) so rich
  results can show the star rating and expandable questions.
- **Accessibility** — skip link, single `<h1>`, every image has alt text, every input has a
  matching `<label>`, native modal Dashboard with focus trapping, Escape/backdrop dismissal
  and focus restoration, keyboard-operable region tabs, visible focus rings, and
  `prefers-reduced-motion` support.
- **Performance** — no libraries, hero image preloaded, all other images lazy-loaded,
  animations driven by `IntersectionObserver`, SVG icon sprite instead of an icon font.
- **Form validation** — Kenyan phone format (`07…`, `01…`, `+254…`) and email are validated
  client-side with inline error messages.

## File structure

```
index.html              markup, SVG icon sprite, JSON-LD
assets/css/style.css    design tokens + all styling and responsive rules
assets/js/main.js       nav, reveals, counters, tabs, gallery, lightbox, reviews, forms
assets/js/reviews.js    the 50 review records (edit here to change reviews)
assets/img/             photography and favicon
robots.txt · sitemap.xml · site.webmanifest
playwright.config.js    optional browser-test configuration (no runtime dependency)
tests/site.spec.js      responsive navigation, disclosures, regions and form regressions
```

## Browser regression tests (optional)

The website still runs without Node.js or a build step. For development checks, install
Node.js 20+ and Python 3, then run:

```bash
npm ci
npx playwright install --with-deps chromium
npm test
```

The suite starts the static server automatically (or reuses an existing server on port
8080) and checks desktop, tablet, phone and short landscape layouts. It covers the three
floating actions, full-height Dashboard and keyboard navigation, retained statistics and
stars, removed sections and anchor destinations, collapsed callback/FAQs, all region
options, and existing review, gallery and form behavior. External Google Fonts requests
are stubbed so the tests do not require that service or send any enquiries.

To use an already installed Chromium binary, set `CHROMIUM_EXECUTABLE_PATH` when running
`npm test`. Generated reports, traces and screenshots are ignored by Git.

## Editing common things

- **Reviews** — edit `assets/js/reviews.js`. Each record is
  `{ n: name, l: location, s: stars, v: service, d: date, t: text }`. The summary bars in
  `index.html` (`.rev-bars`) are hardcoded, so update those counts if the ratings change.
- **Phone number** — it appears in `index.html` and as `WA_NUMBER` at the top of `main.js`.
- **Gallery** — edit the `GALLERY` array in `main.js`; `cat` must match a filter chip.
- **Service areas** — edit the `REGIONS` object in `main.js`.

## Note on imagery

The photographs are AI-generated placeholders used to build out the design. Replace the
files in `assets/img/` with real photos of Waterwall's own rigs, crew and completed sites
before going live — real project photos convert significantly better, and the review
names/locations should also be swapped for genuine client feedback before publishing.
