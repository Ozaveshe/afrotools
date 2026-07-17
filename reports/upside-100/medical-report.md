# Medical Report Interpreter — Audit

Tool: `tools/medical-report/index.html` · Live: https://afrotools.com/tools/medical-report/
Category: Health (HEALTH-CRITICAL & SENSITIVE)

## What it does

Client-side lab/blood-report explainer. Users paste text, upload an image (Tesseract OCR),
upload a PDF (pdf.js), or take a phone photo. It parses 80+ biomarkers across 11 panels
(CBC, Lipid, Liver, Kidney, Thyroid, Diabetes, Urinalysis, Iron, Vitamins, Cardiac, Other),
compares each value to a general reference range, flags Normal / Above / Below, and renders
a summary, per-marker range bars with plain-language explanations, and auto-generated
"questions to ask your doctor". A local-first interpretation is shown by default; optional
AI interpretation and follow-up chat run only after an explicit consent checkbox is ticked,
and only parsed marker names/values/units/status (not raw report text) are sent to
`/.netlify/functions/ai-advisor`.

## SAFETY finding — no dangerous overclaim

The tool is already strongly hardened (a prior "Deep Review - 27 April 2026" pass is visible).
- Does NOT diagnose. Explicitly disclaims diagnosis in banners, summary, and AI system prompt.
- Does NOT tell users to start/stop treatment. All abnormal-result copy is framed as
  "discuss with / ask your clinician"; chat prompts are clinician-prep only.
- Does NOT claim to confirm health. Summary and local interpretation explicitly state a
  within-range result "does not confirm overall health".
- AI guardrails present: system prompt forbids diagnosing, prescribing, medication changes,
  treatment instructions, or reassuring someone that they are healthy; caps length; pushes
  urgent care for critical values. Consent is gated and only sanitized markers are sent.
- No "know if you're healthy" style overclaim in badges, hero, or share copy.

No dangerous overclaim required removal. Remaining gaps were SEO/metadata and disclaimer
prominence only.

## Gaps found (and fixed)

- Title lacked keyword depth + African intent ("Medical Report Interpreter | AfroTools").
- Meta description had no African intent signal.
- Schema `applicationCategory` was the invalid value `"WebApplication"` instead of a real
  category — should be `HealthApplication` for a health tool.
- Disclaimer near the **results** appeared only at the very bottom of a long results block
  (after summary, markers, AI, questions, share, chat). A user reading the summary/markers
  could scroll far before seeing a caution. Added a prominent disclaimer at the top of the
  results container.
- Top disclaimer reworded to the required safety phrasing (educational only, not a diagnosis
  or medical advice, cannot confirm you are healthy, consult a doctor, call emergency
  services for urgent symptoms).

## SEO

- H1: single, unique keyword H1 ("Medical Report Interpreter") — OK.
- FAQPage JSON-LD mirrors the 5 visible FAQ items exactly — OK, no invented Q&A.
- WebApplication / WebPage / FAQPage / BreadcrumbList all present and valid.
- Canonical + hreflang (en/fr/sw/x-default) present.

## UX / a11y

- Input → explanation flow is clear (tabs, samples, progress bar, results scroll-into-view).
- Mobile CSS handles 375–680px (stacked stats/markers, wrapping chat input).
- File inputs and chat input carry aria-labels; added `role="note"` + `aria-hidden` icon on
  the new results disclaimer. Textarea aria-label contains escaped placeholder entities
  (cosmetic, left as-is).

## Deferred

- The AI advisor endpoint (`netlify/functions/ai-advisor.js`) is shared infrastructure — not
  edited here; guardrail note appended to `_shared-fixes.md`.
- Textarea aria-label still echoes raw `&#10;` entity text (cosmetic only).

## Fixes applied 2026-07-14

1. `<title>` → "Medical Report Interpreter — Understand Lab Results in Africa | AfroTools"
   (keyword + African intent, no overclaim).
2. Meta description → African-intent, non-diagnostic, ~152 chars (in 120–160 range).
3. JSON-LD `applicationCategory`: `WebApplication` → `HealthApplication`.
4. Top disclaimer reworded to required prominent safety text (educational only; not a
   diagnosis/medical advice; cannot confirm health; consult a doctor; call emergency
   services for urgent symptoms).
5. Added a prominent persistent disclaimer at the top of the results container
   (`role="note"`), so a caution is visible immediately when results render.
6. Verified all 4 JSON-LD blocks parse with `node`; FAQPage still mirrors visible FAQ.

Only `tools/medical-report/index.html` was modified (plus this report and a shared-fixes note).
