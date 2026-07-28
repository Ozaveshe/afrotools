# French Wave 2 — Language & Translation Acceptance Receipt

Date: 2026-07-28

Integration baseline: `bdde135c9cdce085591da152ddb1097830667c77`

Branch: `codex/fr-wave2-language`

## Outcome

**Accepted: 11/11 canonical apps. Left: 0.**

The category moved from 9 native candidates plus 2 English iframe shells to 11
native French workflows. Acceptance is recorded in
`data/audits/french-free-app-acceptance.json`; the generated inventory remains
fail-closed for every app without equivalent evidence.

| English owner | French route | Product proof |
|---|---|---|
| `swahili-translator` | `/fr/tools/traducteur-swahili/` | French-to-Swahili and reverse phrase oracles, local TXT/save |
| `yoruba-translator` | `/fr/tools/traducteur-yoruba/` | Replaced English iframe with native French/Yoruba core, tonal spelling, reverse oracle, empty-input error, TXT/save |
| `hausa-translator` | `/fr/tools/traducteur-haoussa/` | French/Haoussa oracle, reverse mode, context, confidence, TXT/save |
| `igbo-translator` | `/fr/tools/traducteur-igbo/` | French/Igbo oracle with dot-below forms, reverse mode, TXT/save |
| `amharic-translator` | `/fr/tools/traducteur-amharique/` | French/Amharic Fidel oracle, transliteration note, reverse mode, TXT/save |
| `zulu-translator` | `/fr/tools/traducteur-zoulou/` | Search/category phrasebook, quiz, local TXT/save |
| `arabic-calc` | `/fr/tools/chiffres-arabes/` | Western/Arabic-Indic/extended digit conversion and separators, TXT/save |
| `transliterate` | `/fr/tools/translitteration/` | Arabic, Latin, Tifinagh and Ethiopic mapping modes, TXT/save |
| `pidgin-translator` | `/fr/tools/traducteur-pidgin/` | Corrected French-to-Pidgin direction and French tone guidance, reverse mode, TXT/save |
| `french-african` | `/fr/tools/francais-africain/` | Replaced English iframe with native 20-entry French lexicon, provenance filters, TXT/save |
| `african-name-meaning` | `/fr/tools/signification-prenoms-africains/` | Name/language/region/theme filters, cautious provenance notes, TXT/save |

## Corrections that affected acceptance

- Removed the two English iframe implementations and their generic handoff
  planners.
- Corrected the Swahili and Pidgin “French” direction, which previously only
  had English source fixtures and English lookup keys.
- Removed the false registry ownership that assigned the financial
  `/fr/salary-tax/francophone/` hub to the `french-african` language app.
- Added French `inLanguage` structured data where it was absent, self
  canonicals, reciprocal English hreflang checks, French internal links and AI
  route/context assertions.
- Kept all core processing local. Focused browser monitoring found no blocking
  console errors, failed script/style/font/image requests or app-level network
  dependency.

## Browser proof

`tests/e2e/french-language-wave2.spec.js` passed **12/12** in Chromium:

- one real workflow and known result oracle on every route;
- TXT download on every route;
- 320px and 375px app-surface overflow checks;
- 200% text reflow;
- manual and system dark-mode execution;
- keyboard submit and accessible input names;
- console and critical-asset failure monitoring;
- Yoruba empty-input alert, focus/`aria-invalid`, and reverse-direction oracle.

The 200% check allows four CSS pixels of subpixel rounding; 320px and 375px
checks allow one pixel and passed.

## Static, metadata and AI proof

`node tests/french-language-wave2.test.js` passed **11/11**. It checks:

- native French document language, one H1, useful title and description;
- no iframe, HTML transplant, generic bridge or core `fetch()` dependency;
- self canonical, English/French hreflang, `inLanguage: "fr"`;
- at least three French internal links;
- live status semantics;
- canonical preview artwork;
- English-owner AI context and generated French AI route mapping;
- focused French/Yoruba, French/Swahili and French/Pidgin oracles.

`npm run fr:parity:check` passed after regeneration.

## Privacy and limitations

- Inputs and outputs stay in the browser. Save actions use only local storage;
  exports use locally created text blobs.
- These are phrasebooks, script aids and provenance tools, not certified
  translations. Public, medical, legal, financial, ceremonial and safety
  wording still requires a qualified human reviewer.
- The native French Yoruba workflow deliberately exposes a reviewed 24-phrase
  French core rather than claiming the English draft’s 175-row breadth. The
  French-African lexicon exposes the 20 historically labelled African-French
  rows and marks absent country/register provenance instead of repeating 75
  general French-learning rows.
- Speech synthesis is not used as pronunciation authority.

## Generated-output boundary

Only the French parity inventory JSON/Markdown was regenerated. No sitemap,
localized site generation, directory/hub build, service-worker stamp, deploy
or merge was performed.
