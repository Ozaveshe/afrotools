# CV Builder Analytics Events

Route: `/tools/cv-builder/`

This document defines dashboard-ready events for the AfroTools CV Builder. Events must be tracked through `window.CVAnalytics.track()`, which uses the existing `window.AfroTools.analytics.track()` wrapper when available and falls back to `gtag` or `dataLayer`.

## Privacy Rules

Do not send personally identifiable CV content to analytics.

Blocked analytics values include candidate names, email addresses, phone numbers, CV text, job descriptions, company names, job titles, notes, filenames, saved CV IDs, raw links, and uploaded file names. Use safe metadata only, such as section IDs, country codes, template IDs, scores, counts, source labels, and sponsor item IDs.

## Standard Parameters

| Parameter | Meaning |
| --- | --- |
| `tool_name` | Always `cv-builder`. |
| `page_path` | Current route path. |
| `country_code` | Selected target country or `INTL`. |
| `template_id` | Selected CV template ID. |
| `source` | UI surface where the action happened. |
| `score` | ATS readiness score from 0 to 100. |
| `match_score` | Job match score from 0 to 100. |
| `section_id` | Safe section key, for example `summary` or `experience`. |
| `completion_ratio` | Section completion percentage from 0 to 100. |
| `keywords_count` | Count of extracted or matched job terms, never the terms themselves. |
| `export_format` | `pdf`, `txt`, `json`, or another non-PII export type. |
| `output_type` | Application pack output type, for example `cover_letter`. |

## Event Catalog

| Event | Fires When | Required Safe Parameters | Dedupe Rule |
| --- | --- | --- | --- |
| `cv_builder_started` | User starts a new CV, selects a quick-start preset, clicks build, or begins import. | `source` | Once per page session. |
| `cv_country_selected` | User changes the country selector or import-review country. | `country_code`, `source` | Once per selected country value. |
| `cv_template_selected` | User selects a template from the gallery, preview picker, workspace top bar, or import review. | `template_id`, `source` | Once per selected template value. |
| `cv_section_completed` | A form section reaches useful completion. | `section_id`, `completion_ratio` | Once per section per page session. |
| `cv_preview_opened` | User opens or interacts with the mobile/full preview. | `source` | Dedupe within 1 second. |
| `cv_pdf_exported` | PDF export completes through the toolbar or export options. | `export_format`, `method` | Dedupe within 1 second. |
| `cv_plain_ats_exported` | User copies or downloads the ATS plain text version. | `export_format`, `method`, `source` | Dedupe within 1 second. |
| `cv_saved` | User confirms saving a named CV. | `source` | Dedupe within 1 second. |
| `cv_import_started` | Import modal opens. | `source` | Dedupe within 1 second. |
| `cv_import_completed` | User confirms extracted CV sections. | `source`, `section_count` | Dedupe within 1 second. |
| `cv_ats_score_generated` | User generates an ATS readiness report. | `score`, `template_id`, `country_code` | Dedupe within 1 second. |
| `cv_job_match_generated` | User generates a job-description match report. | `match_score`, `keywords_count`, `template_id`, `country_code` | Dedupe within 1 second. |
| `cv_cover_letter_generated` | User generates the cover letter output or full application pack. | `source`, `output_type` | Dedupe within 1 second. |
| `cv_linkedin_kit_generated` | User generates LinkedIn headline/About output or full application pack. | `source`, `output_type` | Dedupe within 1 second. |
| `cv_job_tracker_job_added` | User saves a manual job, saves current target, or saves an application pack with a job. | `source` | Dedupe within 1 second. |
| `cv_sponsor_clicked` | User clicks a clearly labeled sponsored item. | `sponsor_zone`, `sponsor_category`, `sponsor_item_id`, `destination_host` | Dedupe within 1 second. |
| `cv_email_capture_submitted` | User submits the PDF download gate email form. | `source` | Dedupe within 1 second. |

## Preserved Legacy Events

These existing events may still be emitted for older dashboards:

| Legacy Event | Notes |
| --- | --- |
| `template_selected` | Also mapped to `cv_template_selected`. |
| `cv_downloaded` | Also mapped to `cv_pdf_exported` for PDF and `cv_plain_ats_exported` for TXT. |
| `cv_ats_plain_version_generated` | Kept for export funnel history. |
| `cv_job_description_matched` | Kept alongside `cv_job_match_generated`. |
| `cv_suggestion_copied` | Kept for ATS suggestion engagement. |
| `cv_fix_applied` | Kept for ATS suggestion engagement. |

## Dashboard Views

Recommended dashboard groupings:

1. Entry funnel: `cv_builder_started` to `cv_section_completed` to `cv_saved` to `cv_pdf_exported`.
2. Market guidance: `cv_country_selected` by `country_code` and export completion.
3. Template performance: `cv_template_selected` by `template_id`, then save and PDF export rate.
4. ATS workflow: `cv_ats_score_generated`, `cv_job_match_generated`, copied suggestions, and applied fixes.
5. Application pack: cover letter, LinkedIn kit, and job tracker adds.
6. Monetization: sponsor clicks by `sponsor_zone`, `sponsor_category`, and `sponsor_item_id`.
