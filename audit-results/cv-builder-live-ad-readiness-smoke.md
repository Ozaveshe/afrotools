# CV Builder Live Ad-Readiness Smoke

Tested route: `https://afrotools.com/tools/cv-builder/`
Test date: 2026-05-20 UTC
Viewports: desktop `1440x900`, mobile `390x844`, mobile `360x800`

## Final Verdict

**Not ready**

The core CV completion path works on the live domain, but production is not ready for controlled paid ads because the live page is not serving the ATS Plain PDF parser-fix script, strict repo `pdf-parse(fs.readFileSync(...))` still fails on the live ATS Plain PDF with `bad XRef entry`, and the browser console records production CSP/AI errors.

## Evidence Files

- Full smoke JSON: `audit-results/cv-builder-live-ad-readiness-smoke/live-smoke-result.json`
- Strict ATS parser check: `audit-results/cv-builder-live-ad-readiness-smoke/ats-plain-parser-check.json`
- Normal PDF download: `audit-results/cv-builder-live-ad-readiness-smoke/live-normal-pdf.pdf`
- ATS Plain PDF download: `audit-results/cv-builder-live-ad-readiness-smoke/live-ats-plain-pdf.pdf`

## Screenshots

- Desktop above fold: `audit-results/cv-builder-live-ad-readiness-smoke/desktop-1440-above-fold.png`
- Desktop filled editor: `audit-results/cv-builder-live-ad-readiness-smoke/desktop-1440-editor-filled.png`
- Desktop after reload: `audit-results/cv-builder-live-ad-readiness-smoke/desktop-1440-after-reload.png`
- Desktop template selected: `audit-results/cv-builder-live-ad-readiness-smoke/desktop-1440-template-selected.png`
- Desktop preview: `audit-results/cv-builder-live-ad-readiness-smoke/desktop-1440-preview.png`
- Desktop export panel state: `audit-results/cv-builder-live-ad-readiness-smoke/desktop-1440-export-panel.png`
- Desktop analyze state: `audit-results/cv-builder-live-ad-readiness-smoke/desktop-1440-analyze.png`
- Desktop template gallery: `audit-results/cv-builder-live-ad-readiness-smoke/desktop-1440-template-gallery.png`
- Mobile 390 above fold: `audit-results/cv-builder-live-ad-readiness-smoke/mobile-390x844-above-fold.png`
- Mobile 390 filled form: `audit-results/cv-builder-live-ad-readiness-smoke/mobile-390x844-form-filled.png`
- Mobile 390 preview: `audit-results/cv-builder-live-ad-readiness-smoke/mobile-390x844-preview.png`
- Mobile 390 export state: `audit-results/cv-builder-live-ad-readiness-smoke/mobile-390x844-export.png`
- Mobile 390 template state: `audit-results/cv-builder-live-ad-readiness-smoke/mobile-390x844-template.png`
- Mobile 360 above fold: `audit-results/cv-builder-live-ad-readiness-smoke/mobile-360x800-above-fold.png`
- Mobile 360 filled form: `audit-results/cv-builder-live-ad-readiness-smoke/mobile-360x800-form-filled.png`
- Mobile 360 preview: `audit-results/cv-builder-live-ad-readiness-smoke/mobile-360x800-preview.png`
- Mobile 360 export state: `audit-results/cv-builder-live-ad-readiness-smoke/mobile-360x800-export.png`
- Mobile 360 template state: `audit-results/cv-builder-live-ad-readiness-smoke/mobile-360x800-template.png`

## Flow Results

| Check | Result | Notes |
|---|---:|---|
| Live page opens | Pass | HTTP `200` on desktop and mobile contexts. |
| Start new CV | Pass | Builder started from a fresh browser context. |
| Fill minimal personal info | Pass | Desktop fields filled through visible inputs. |
| Add education | Pass | Desktop fields filled through visible inputs. Mobile wizard hides later sections, so the smoke used the app state setter after validating visible personal fields. |
| Add skills | Pass | Desktop fields filled through visible inputs. Mobile wizard state accepted the skills data. |
| Preview | Pass | Preview visible on desktop and mobile. |
| Change template | Pass | Switched to `lagos-corporate`; saved data remained intact. |
| Export normal PDF | Pass | Downloaded `Ada-Okafor-CV-Graduate-Data-Analyst.pdf`, `107927` bytes. |
| Export ATS Plain PDF | Partial | Downloaded `Ada-Okafor-CV-Graduate-Data-Analyst-ATS.pdf`, `3700` bytes, but strict parser check fails. |
| Save CV | Pass | Save button opened modal; reload restored `Ada Okafor` and saved title `Live Smoke Graduate CV`. |
| Open template drawer/gallery | Pass | Template gallery was visible and usable in the live DOM. |
| Open export drawer/panel | Partial | Export controls were visible, but the smoke could not confirm the polished drawer behavior from the top PDF button on live. Direct export functions worked. |
| Run Analyze | Partial | Analyze opened, but console logged `AI call failed: Error: API error`. |
| Sponsor zones | Pass | `sponsorsInActiveForm: 0`; sponsored zones are outside the active form. |
| Horizontal overflow | Pass | Desktop, 390px mobile, and 360px mobile all reported `overflowX: 0`. |
| Analytics | Pass with console caveat | CV events fired without captured PII, but GA requests caused CSP console errors. |

## Blockers

### Critical: Live ATS Plain PDF still fails the strict parser path

The production HTML does not include `cv-ats-plain-pdf-fix.js`.

Live script check:

```json
{
  "hasAtsFixScript": false
}
```

Strict parser check:

```json
{
  "file": "audit-results/cv-builder-live-ad-readiness-smoke/live-ats-plain-pdf.pdf",
  "bytes": 3700,
  "bufferByteOffset": 8,
  "defaultPdfParse": {
    "ok": false,
    "error": "bad XRef entry"
  },
  "copiedUint8ArrayParse": {
    "ok": true,
    "pages": 1,
    "textIncludesName": true,
    "textIncludesEmail": true,
    "textIncludesHeading": true
  }
}
```

Interpretation: the live ATS Plain PDF contains readable text, but it still has the parser-sensitivity issue for default Node Buffer parsing. This is the same risk class that can affect job boards, recruiter tools, or ATS ingestion.

### High: Production console has CSP errors for Google collection endpoint

Desktop and mobile runs logged CSP-blocked analytics requests to `https://www.google.com/g/collect`. The current CSP allows `www.google-analytics.com`, `region1.google-analytics.com`, and `analytics.google.com`, but the live runtime also attempts `www.google.com/g/collect`.

Impact: analytics events are pushed locally, but browser console is not clean and some GA transport calls are blocked.

### High: Analyze logs an API error

Running Analyze produced:

```text
AI call failed: Error: API error
```

Impact: not a CV completion blocker, but it weakens confidence before paid traffic because Analyze is a visible selling point.

### Medium: Mobile controls still include small visible targets/fonts

Measured mobile smoke:

```json
{
  "390x844": {
    "overflowX": 0,
    "minInputFontSize": 13,
    "touchTargetsTooSmall": 14
  },
  "360x800": {
    "overflowX": 0,
    "minInputFontSize": 13,
    "touchTargetsTooSmall": 14
  }
}
```

Impact: no horizontal overflow, but some live controls still fall below the target `16px` input text and touch-friendly sizing standard.

## Analytics Result

Captured CV events included:

- `page_view`
- `cv_template_selected`
- `cv_pdf_exported`
- `cv_plain_ats_exported`
- `cv_preview_opened`
- `cv_builder_started`
- `cv_section_completed`

PII scan of captured CV analytics payloads: **pass**. The fake candidate name, email, phone, and school were not present in captured CV event payloads.

Console caveat: GA network transport produced CSP errors, so analytics should be verified again after the CSP allowlist is corrected.

## Saved-State Result

Saved-state passed.

```json
{
  "beforeSavedCount": 1,
  "afterReload": {
    "fn": "Ada",
    "ln": "Okafor",
    "email": "ada.live.smoke@example.com",
    "savedCount": 1,
    "savedTitle": "Live Smoke Graduate CV"
  },
  "persisted": true
}
```

## Mobile Result

Mobile is usable for the smoke path, with no horizontal overflow at `390x844` or `360x800`. Preview and template switching worked. The remaining mobile issue is polish/accessibility: some visible controls still measure below the desired input font and touch-target thresholds.

## Recommended Next Steps Before Ads

1. Deploy the current ATS Plain PDF parser fix so live includes `cv-ats-plain-pdf-fix.js`.
2. Re-run the strict ATS parser check against the live downloaded ATS Plain PDF.
3. Fix production CSP for the GA endpoint actually used by the live tag, or configure GA to use an already-allowed endpoint.
4. Make Analyze fail gracefully without a console error when the AI/API path is unavailable.
5. Raise remaining mobile input/control sizes to the CV Builder mobile standard.
6. Re-run this same live smoke after deployment and only move to controlled ads when console errors and strict ATS parsing are green.
