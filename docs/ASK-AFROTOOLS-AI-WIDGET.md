# Ask AfroTools AI Mini-Router Widget

The Ask AfroTools AI mini-router is a lightweight embeddable widget for partner pages, blogs, job boards, school websites, association portals, media articles, and intranets. It recommends an AfroTools workflow from a short prompt and category chips, then sends users to the relevant AfroTools AI vertical or tool page.

The widget runs deterministic routing in the browser. It does not send partner prompts to model providers or private AI endpoints. The linked AfroTools page may offer deeper AI assistance behind the normal consent and rate-limit protections.

## Script Embed

```html
<div
  data-afrotools="ask-ai-router"
  data-afrotools-default-country="Ghana"
  data-afrotools-default-category="career"
  data-afrotools-partner-id="example-job-board"
  data-afrotools-theme="light"
  data-afrotools-allowed-categories="career,business,education"
  data-afrotools-sponsor-label="In partnership with Example Job Board"></div>
<script src="https://afrotools.com/widgets/embed.js" async></script>
```

## Iframe Embed

```html
<iframe
  src="https://afrotools.com/widgets/iframe/ai-mini-router.html?defaultCountry=Kenya&defaultCategory=business&partnerId=school-portal&theme=minimal&allowedCategories=business,education,career"
  width="100%"
  height="420"
  frameborder="0"
  title="Ask AfroTools AI mini-router"
  loading="lazy"></iframe>
```

## Configuration

- `defaultCountry`: optional country context shown in the recommendation link.
- `defaultCategory`: initial category chip, such as `education`, `career`, `business`, `trade`, or `energy`.
- `partnerId`: partner attribution token. Use letters, numbers, underscores, or hyphens.
- `theme`: `light`, `dark`, or `minimal`.
- `allowedCategories`: comma-separated list that limits the visible chips and routing choices.
- `sponsorLabel`: optional visible sponsor or partner label. Keep it clear and non-misleading.

## Privacy And Safety

- The script widget routes locally and does not cache or transmit raw prompts.
- Recommended links include only category, country, partner, and source metadata.
- Do not use the widget to collect CVs, documents, legal facts, medical facts, private financial details, or identity data.
- The full AfroTools AI workflows keep their own consent, source-confidence, and high-stakes warning boundaries.
