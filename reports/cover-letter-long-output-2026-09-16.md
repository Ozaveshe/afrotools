# Cover-letter long output and native scoring

## Repair
The shared runtime now recognizes native French and Swahili professional salutations/closings, preserves accented and combining-mark words when matching keywords, and matches complete words rather than substrings. Scoring bands, check labels and guidance are native in French and Swahili. User text remains untouched. This is a heuristic writing checklist, not factual verification or a hiring prediction.

## Actual output evidence
EN/FR/SW were exercised at 390px with 36 synthetic paragraphs, a 1,400-character unbroken accented token, and final signature markers. Each downloaded PDF had four A4 pages; parsed full content and every text item's physical page bounds passed. Each HTML-based Word .doc preserved exact paragraph content. Microsoft Word 16 opened all three actual downloads and exported six Letter pages per language. Parsed full text and bounds passed across all 18 Word pages. All 12 PDF pages and 18 Word pages were rendered with Poppler and visually reviewed in six contact sheets: no blank/clipped pages or lost final signature. Word and PDF use different paper defaults and do not have identical pagination.

The Word input bytes match the final browser downloads. Artifact hashes and explicitly LF-normalized source hash are in the companion proof JSON. Artifacts remain in sibling cover-letter-long-pdf-proof and cover-letter-long-word-proof directories, outside the product tree.

## Validation
- `node --test tests/cover-letter-score-locale.test.js tests/cover-letter-native-drafts.test.js`: 8 passed, including 300 native draft configurations.
- `PORT=4226 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 node node_modules/@playwright/test/cli.js test tests/e2e/cover-letter-long-output.spec.js tests/e2e/cover-letter-native-drafts.spec.js tests/e2e/cover-letter-backup-parity.spec.js --workers=1`: 10 passed (27.9s), own source tree.
- `git diff --check`: passed.

## Limits and scope
No export layout engine change was necessary for this fixture. Word proof is Microsoft Word 16 on this machine, not every Word/LibreOffice version. The advertised Word export is HTML-based .doc, not DOCX. This does not accept every possible letter length, Unicode script, font, template or print setting. Existing font glyph preflight and unsupported-script fallback still apply. Semantic keyword matching, inflection and the factual accuracy of achievements are not verified. No full release build, production verification or search-performance claim is made. Sensitive synthetic content stayed local; no routes, SEO, analytics or account gates changed. The coordinator's newer normal-cookie-decline test setup must be preserved during integration.
