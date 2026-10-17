# Tesseract OCR Vendor Assets

Vendored for `tools/pdf-ocr/` so OCR can run without loading runtime code or language data from a CDN.

- `tesseract.js` version: 5.1.1
- `tesseract.js-core` version: 5.1.1
- language data packages: `@tesseract.js-data/{eng,fra,ara,swa,por,amh}` version 1.0.0
- language data source directory: `4.0.0`

The PDF category verifier checks the required runtime files and language files. If a new language is exposed in the UI, add the matching `*.traineddata.gz` file and update `scripts/verify-pdf-category-gate.js`.

## Amharic model provenance

- Package: `@tesseract.js-data/amh@1.0.0` from `https://registry.npmjs.org/@tesseract.js-data/amh/-/amh-1.0.0.tgz`.
- Package registry integrity (SHA-512): `buKCJA8g4FwpJ4eCO9L9W2j+I07DZJ7HR9/dFMtLL8rSQDZkUJ1ZJRQUdfKw7YKCjUt/nPNWkkPaNzRhNYEUuw==`.
- Member: `package/4.0.0/amh.traineddata.gz`, 3,463,888 bytes; SHA-256 `371bd62defb707d4bba71886011b4708e2b4831ff427a7e487b1acfbff264568`.
- The package metadata declares MIT for its wrapper. The underlying `4.0.0` language data comes from Tesseract tessdata under Apache-2.0; the accompanying license is retained in `licenses/tessdata-LICENSE` (source: `https://github.com/tesseract-ocr/tessdata/blob/main/LICENSE`).
- Model assets stay local to this site. No font is distributed with the model.
