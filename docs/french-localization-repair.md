# French Localization Repair Workflow

Repeatable workflow for keeping `/fr/` quality at parity with English. Established July 2026
after the "literal translation" cleanup (accents, elisions, English template leaks).

## The problem this solves

Generated French pages shipped as ASCII-only "literal" French (no diacritics: "Generateur",
"Cout", "Creez"), with dropped elisions ("l enregistrement"), English template bodies under
French shells (e.g. `fr/tools/roi-solaire/*`), and English runtime strings injected by inline
JS. This reads as machine-generated to francophone users and suppresses CTR/trust from SERPs.

## Repair scripts (idempotent, safe to re-run)

| Script | What it does |
|---|---|
| `node scripts/repair-fr-accents.js [--fix]` | Restores diacritics + elisions across `fr/**/*.html` using a strictly unambiguous dictionary. Text nodes, visible attributes, JSON-LD copy keys only. Never touches URLs, slugs, `<script>`, `<code>`, `<textarea>`. Dry-run by default. |
| `node scripts/repair-fr-solar-country-pages.js [--fix]` | Full FR translation of the 54 `fr/tools/roi-solaire/<country>/` pages (sentence tables + EN→FR country map with correct locative prepositions). |
| `node scripts/stabilize-french-route-aliases.js` | Converts sources of plain-`301` `/fr/ → /fr/` rules in `_redirects` into noindex redirect stubs (one canonical French URL per English source). |
| `node scripts/fix-fr-html-lang.js --fix` | `lang="fr"` + missing self/x-default hreflang. |
| `node scripts/fix-fr-internal-links.js --fix` | Rewrites `/tools/...`-style anchors in fr pages to `/fr/...`. |
| `node scripts/fix-hreflang-reciprocity.js` | Adds missing reciprocal hreflang on English pages. |

## Post-generation pipeline (run after any FR generation batch)

```
node scripts/generate-fr-tool-gap-pages.js        # or other generator
node scripts/repair-fr-accents.js --fix           # accent/elision pass on outputs
node scripts/fix-fr-html-lang.js --fix
node scripts/fix-fr-internal-links.js --fix
node scripts/fix-hreflang-reciprocity.js
node scripts/generate-sitemaps.js
npm run build:i18n:validate
npm run validate:hreflang
npm run fr:tools:verify-gap-pages
node scripts/build-french-localization-ledger.js  # re-gate completion numbers
```

## Dictionary maintenance rules (repair-fr-accents.js)

- Only add words that are **never valid French without the accent** and have **exactly one**
  accented form. Ambiguous stems stay out: `marche/marché`, `cote/côte`, `eleve/élève-élevé`,
  `general` (brand collision: "General Motors"), `mais/maïs` (phrases only), `the/thé`,
  `reel/reels` (Instagram Reels), `a`+infinitive is whitelisted per-verb only — a generic
  `-er` rule corrupted English leak sentences ("for a sharper estimate").
- Uppercase single-letter elisions only at sentence start ("C est" → "C'est", never
  "vitamine C est").

## Adding new French tool pages (the 3-place wiring)

Each `/fr/tools/<frSlug>/` page must be wired in all three or `fr:tools:verify-gap-pages` fails:
1. `PAGES` entry in `scripts/generate-fr-tool-gap-pages.js` (curated French copy — write it
   with accents from the start),
2. `FRENCH_TOOL_SLUG_TO_ENGLISH_TOOL` in `scripts/lib/french-tool-route-map.js`,
3. a `lang: 'fr'` row with `sourceId` in `assets/js/components/tool-registry.js`.

One preferred French URL per English source. Aliases go in `_redirects` (plain `301`) and get
stubbed by `stabilize-french-route-aliases.js`; never add registry rows for aliases.

## Known remaining gaps (July 2026)

- `tools` section FR coverage ≈ 40% (~1,560 English tool pages without a mapped French route).
  Close in small curated batches through the pipeline above — never with unaccented bulk copy.
- Per-country English "seed note" strings on solar pages (regulator names/context) are partly
  English; factual footnotes, low priority.
- `/fr/dashboard/*` must stay `noindex, nofollow` and out of sitemaps (`robots.txt` disallows
  `/fr/dashboard/`).
