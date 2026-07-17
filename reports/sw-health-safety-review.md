# Swahili Medical And Health Safety Review - 2026-05-16

Prompt: 90

Scope was limited to the existing Swahili health, health-insurance, insurance, and medical-report routes named in the prompt. No French, Hausa, cars, generated output, or registry files were touched.

## Verdict

The scoped health surface is beta-safe as an educational and planning aid. The calculators and health tools already avoid diagnostic or treatment language in the visible body copy. This pass tightened first-impression metadata and one misleading bridge label so users see the same safety posture before opening a page.

## Files Changed

- `sw/afya/index.html` - tightened meta, Open Graph, Twitter, and JSON-LD descriptions to state education/planning only, not diagnosis or medical advice.
- `sw/afya-na-bima/index.html` - tightened Twitter description to say not medical advice or an official insurance price.
- `sw/bima/index.html` - tightened meta, Open Graph, Twitter, and JSON-LD descriptions to say estimates only, not final price, claims approval, or insurance advice.
- `sw/zana/tafsiri-ripoti-daktari/index.html` - added no-diagnosis wording to social descriptions and corrected a misleading notice that pointed to a Swahili page while calling it English.
- `sw/zana/tafsiri-ya-ripoti-ya-matibabu/index.html` - tightened meta, Open Graph, Twitter, and JSON-LD descriptions to say no diagnosis and verify with doctor, clinic, or lab.

## Reviewed Pages

- `sw/afya/index.html`
- `sw/afya-na-bima/index.html`
- `sw/bima/index.html`
- `sw/zana/kikokotoo-bmi/index.html`
- `sw/zana/kikokotoo-dozi-ya-dawa/index.html`
- `sw/zana/kikokotoo-maji-ya-kunywa/index.html`
- `sw/zana/shinikizo-la-damu/index.html`
- `sw/zana/hatari-ya-kisukari/index.html`
- `sw/zana/hatari-ya-malaria/index.html`
- `sw/zana/ratiba-ya-chanjo/index.html`
- `sw/zana/tafsiri-ripoti-daktari/index.html`
- `sw/zana/tafsiri-ya-ripoti-ya-matibabu/index.html`
- `sw/zana/kilinganisha-bima-ya-afya/index.html`
- `sw/zana/kikokotoo-mchango-wa-afya/index.html`

## Safety Classification

Ready as planning/education aids:

- BMI, water intake, blood pressure, diabetes risk, malaria risk, vaccine schedule, medical-report interpretation, health-insurance comparison, health contribution, and health/insurance hubs.

Needs continued conservative handling:

- `sw/zana/kikokotoo-dozi-ya-dawa/index.html` - remains safe only because it requires a clinician/pharmacist-provided mg/kg or medicine instruction and says not to choose medicine or dose.
- `sw/zana/tafsiri-ripoti-daktari/index.html` and `sw/zana/tafsiri-ya-ripoti-ya-matibabu/index.html` - remain education aids and should never claim diagnostic accuracy.
- Insurance pages remain planning estimates only and should not imply insurer approval, claims approval, or final premium.

## Terminology Choices

- `utambuzi` for diagnosis, always negated where the tool could be mistaken for medical interpretation.
- `ushauri wa matibabu` for medical advice, always negated on medical pages.
- `mhudumu wa afya`, `daktari`, `kliniki`, `maabara`, and `mfamasia` for verification points.
- `makadirio ya kupanga` for insurance and cost outputs.
- `idhini ya madai` and `bei ya mwisho` are explicitly not promised on insurance surfaces.

## Validation

- `npm run check-links` - passed, 8400 HTML files scanned, no broken internal links.
- `npm run build:i18n:validate` - passed for fr, sw, yo, and ha key parity.
- `npm run validate:hreflang` - passed, 7768 pages scanned, 7766 pages with hreflang tags, 19715 pairs, 0 errors.
- `npm run seo:report` - clean, no auto-fixes needed.
