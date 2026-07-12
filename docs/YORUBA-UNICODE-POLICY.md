# Yoruba Unicode and fallback policy

## Policy

All authored Yoruba user-facing text is UTF-8 and Unicode NFC. Route slugs, URLs, identifiers, filenames, technical acronyms, brand names, proper nouns, and user-entered data remain opaque unless a feature has an explicit field-level normalization contract.

Search may create a temporary NFD, diacritic-insensitive comparison key. It must never replace the displayed or exported source string. Clipboard, share, JSON, CSV, and document output must receive the NFC display value, while opaque user data and identifiers are not transliterated.

Editors use the repository .editorconfig setting charset = utf-8. Scripts read and write text with an explicit utf8 encoding. On Windows PowerShell, do not pipe Yoruba source through commands that inherit a legacy console encoding. If a pipe is unavoidable, set both values first:

    $utf8 = [System.Text.UTF8Encoding]::new($false)
    $OutputEncoding = $utf8
    [Console]::OutputEncoding = $utf8

Prefer the Node source/build scripts over Get-Content-to-Set-Content rewrites.

## Defect trace

| Stage | Evidence and contract |
|---|---|
| Source bytes | yo/**, lang/yo.json, and data/registry/yoruba-route-manifest.json are strict UTF-8. scripts/audit-yoruba-unicode.js decodes with a fatal UTF-8 decoder and rejects BOMs, U+FFFD, mojibake signatures, non-NFC text, detached combining marks, corrupted apostrophes, embedded question marks, and reviewed high-confidence ASCII transliterations. |
| Editor/import boundary | The affected verification panels first entered Git with literal U+003F question marks, so the loss occurred before parsing, templating, minification, or DOM insertion. Repository history does not identify the exact editor. A Windows PowerShell pipe with a non-UTF-8 output encoding reproduces the same destructive question-mark substitution, so all Unicode import paths must set UTF-8 explicitly or avoid the pipe. |
| Translation catalog | lang/yo.json is read as UTF-8 and parsed with JSON.parse. Catalog values are validated after parsing and must be NFC. |
| JSON/YAML | Yoruba product localization uses JSON; no YAML parser is in this path. JSON serialize/parse round trips are covered by tests/yoruba-unicode-roundtrip.test.js. |
| Database | Public Yoruba routes and catalogs are static repository content. No database collation participates in this rendering path. Any future Supabase-backed Yoruba field must use the AfroTools project and add a live database round-trip test before becoming a source of truth. |
| Templates and escaping | Shared localization applies text with textContent or attribute setters. Fallback banners are structurally generated and escape no user input. HTML escaping changes markup delimiters only, not Yoruba code points. |
| Minification and bundles | scripts/minify.js and scripts/bundle.js read and write UTF-8. Unicode round-trip tests verify the generated browser catalog retains the source values. |
| DOM insertion | assets/js/lib/localization.js normalizes authored display strings to NFC and inserts them with textContent. Search folding is comparison-only. |
| Response headers | Every HTML document declares a UTF-8 meta charset. The local production-like static server sends text/html; charset=utf-8, JavaScript and JSON with UTF-8 charsets, and the browser test asserts the response header. |
| Clipboard and export | Clipboard tests capture the actual copied string. toUnicodeCsv emits a UTF-8 BOM and NFC text. URL sharing uses URLSearchParams and percent encoding, and JSON/CSV tests assert exact recovery. |

## Route coverage and search signals

data/registry/yoruba-route-manifest.json inventories every committed /yo/ HTML route and every declared /yo/ redirect alias or wildcard. The only page states are:

- native
- localized-shell
- english-fallback
- unavailable

Redirect rules use redirect-alias and are never sitemap or hreflang equivalents.

Native and localized-shell routes must declare an English equivalent for reciprocal hreflang. English fallback routes must declare a fallback destination, use noindex, follow, omit alternate links, and show the accessible banner owned by scripts/sync-yoruba-fallbacks.js. Redirect aliases point directly to the destination language and must not appear in Yoruba sitemaps or hreflang.

## Reviewed exceptions

data/localization/yoruba-unicode-exceptions.json is the only exception mechanism. Each exception must identify the file, finding code, exact text where needed, and a human-readable reason. Empty or broad exceptions are rejected by review; URLs, identifiers, filenames, technical acronyms, and user data are excluded structurally rather than hidden by exceptions.

## Required checks

    npm run yoruba:unicode:audit
    npm run localization:check
    npm run test:localization
    npm run validate:hreflang
    npm run sitemap
