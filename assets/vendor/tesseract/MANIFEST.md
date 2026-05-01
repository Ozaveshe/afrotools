# Tesseract OCR Vendor Assets

Vendored for `tools/pdf-ocr/` so OCR can run without loading runtime code or language data from a CDN.

- `tesseract.js` version: 5.1.1
- `tesseract.js-core` version: 5.1.1
- language data packages: `@tesseract.js-data/{eng,fra,ara,swa,por}` version 1.0.0
- language data source directory: `4.0.0`

The PDF category verifier checks the required runtime files and language files. If a new language is exposed in the UI, add the matching `*.traineddata.gz` file and update `scripts/verify-pdf-category-gate.js`.
