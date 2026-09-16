# Automatic CV print resource readiness

The existing automatic print callback was tested with an actual local HTTP server delaying a stylesheet by 1.2 seconds and the bundled Noto Sans font by 1.8 seconds. The popup document uses that font. At the moment the product invoked window.print, the test observed all stylesheet sheets present, document.fonts.status loaded, and the requested font available.

`PORT=4216 AFROTOOLS_TEST_DISABLE_ANALYTICS=1 playwright test tests/e2e/cv-print-resource-readiness.spec.js --workers=1`: PASS, session63133, 9.5 seconds. An earlier font-only version also passed session81010.

This is Chromium/local source evidence; the print method is intercepted only to record callback-time readiness instead of displaying a system print dialog. It does not certify every browser or OS print driver. No readiness runtime change was made because the tested delayed-resource scenario did not reproduce premature printing. Actual PDF layout and full text proof remain covered separately by the print-family and mobile print tests.
