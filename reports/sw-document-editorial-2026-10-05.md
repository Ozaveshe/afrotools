# Swahili invoice and CV contextual repair

Baseline: `e9fed80dd64f54f84866f33ea849c9de8c99b1ce`. Isolated branch: `codex/sw-document-parity-20261005`; worktree: `C:/Users/Oza/.codex/worktrees/sw-document-parity-20261005/afrotools`. Integration and deployment remain with the coordinator.

## Changed files and ownership

- New `data/localization/sw-document-pdf-lexicon-overrides.json` owns complete contextual phrases for invoice and CV, including every name/description in the 30 promoted CV templates. Both lexicon and parity generators consume it; page payload overrides take precedence over generic mappings.
- `scripts/build-swahili-document-pdf-lexicon.js` supports scoped editorial synchronization without translating unrelated route families. `scripts/build-swahili-document-pdf-parity.js` applies contextual static text/privacy attributes and saved-template/client accessible action prefixes.
- `assets/js/pages/sw-document-pdf-localizer.js` and `sw-document-pdf-dom-stability.js` preserve authored preview text, saved names, and restored invoice field values, including content that exactly matches interface phrases. Legacy CV preview renderers receive the same protection.
- Generated output: `data/localization/sw-document-pdf-lexicon.json`, `assets/js/pages/sw-document-pdf-lexicon.js`, `sw/zana/kizalishaji-ankara/index.html`, `sw/zana/mjenzi-cv/index.html`.
- Tests: `tests/swahili-document-editorial.test.js`, `tests/sw-document-pdf-trie.test.js`, and `tests/e2e/swahili-document-editorial.spec.js`. Strategy documents the repeatable contextual ownership and scoped regeneration.

## User-facing changes

Invoice labels use contextual Kiswahili: `Jina la kampuni`, `Aina ya hati`, `Maelekezo ya benki au malipo`, `Violezo vilivyohifadhiwa`, and `Salio linalodaiwa`. CV headings, template names/descriptions, dialogs, editor/help/error states and cloud-backup consent copy avoid literal English fragments and wording that implies payment for the free template workflow. Currency codes, ATS, PDF/DOCX/JSON, statutory acronyms and user-authored strings remain protected.

## Tests run

- PASS: scoped lexicon synchronization and invoice/CV parity regeneration; `--apps=cv-builder,invoice-generator --check` reconciles 2/2 selected routes.
- PASS: `node --test tests/swahili-document-editorial.test.js tests/sw-document-pdf-trie.test.js` (11/11).
- PASS: new invoice browser flow: opened details, contextual labels, preserved preview text, template save/load, saved client/item labels, tax rate 9 retained when switching to KES, total/balance 109, JSON download/import, share checkbox default off, and reflow at 320/390.
- PASS: new CV editor browser flow: real entry/edit controls, legacy preview preservation, JSON download, reflow at 320/390, no page errors, no synthetic profile strings in request URL/body and no private-content Netlify POST.
- PASS: existing `tests/e2e/cv-json-backup.spec.js` scoped to `/sw/zana/mjenzi-cv/` (2/2): restore/reload, parsed ATS PDF and DOCX accented text, malformed/unsupported JSON, keyboard focus and Escape, 320px reflow.
- PASS: application-pack browser ZIP/PDF regression with the coordinator-owned shared generated fix from French commit `6f033488a241948dfbb4b190dda36e6b8acc7437` temporarily installed: PDF entries begin `%PDF-` and parse; ATS text and JSON backup preserve synthetic author content. The temporary English file is excluded from this commit. On the unmodified baseline, the ATS PDF ZIP entry starts `[obje` because an async PDF promise was wrapped without awaiting; the shared fix belongs to the French/coordinator commit.
- PASS: `npm run build:i18n:validate` and `npm run validate:hreflang` across the existing locale contract.
- PASS: changed JS syntax checks and `git diff --check`.

- PASS: all-30-template-dialog browser run (1/1, about 1.4 minutes): exact contextual descriptions, localized dialog actions, focus on the apply action, Escape/focus return, and 320/390px reflow.

## Risk notes and limitations

- Privacy: synthetic fixtures only; trace, video and screenshots disabled for document tests. Local-first behavior and primary downloads remain intact. No AI/content-send feature was added.
- Consent evidence: fixture is `localStorage['afrotools_cookie_consent']='declined'`. Observed metadata request paths include `/measurement/conversion` and `/g/collect`; no synthetic CV text was observed in URL/body. Current loaded owners `assets/js/components/analytics-consent-v2.js` and `assets/js/lazy-analytics.js` explicitly retain limited cookieless measurement after declining optional analytics cookies. This bounded check does not claim a complete analytics consent audit or establish a consent defect from those requests alone.
- Accessibility: saved authored suffixes retain their exact words while action prefixes are native. Dialog focus/Escape and small widths are covered; a full screen-reader audit was not performed.
- SEO/routes: current canonical routes and locale alternates retained; hreflang passes. No registry, sitemap, analytics event-name, calculation or tax-rule change.
- Generated output: coordinator must regenerate these two pages from final shared English owners after integrating the invoice sticky-cookie-layer and shared invoice PDF-copy/app-pack fixes. This child does not commit shared English owner changes.
- Baseline debt: the existing Swahili parity browser suite's count guard expects 24 ordinary and 7 sensitive entries, whereas baseline ownership is 23/8 with `pdf-redact` sensitive. Coordinator owns the count/name guard repair and reruns the existing invoice/CV suite after integration.
- Language review: contextual editorial repair and bounded tests; native-human review and broad Swahili parity are not claimed. `.claude/rules/i18n.md` is absent; other applicable strategy/PDF/agent guidance was used.
- Build/release/security checks and production proof are coordinator responsibilities; no deployment or live production claim is made here.

Rollback: revert this scoped commit, then regenerate the selected invoice/CV outputs from the retained source owners.
