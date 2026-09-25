# Education practice return measurement

Purpose: choose the next Nigeria exam content wave using real practice return use alongside Google Search Console indexing and query demand. This is an opt-in, same-browser metric for the JAMB CBT and WAEC/NECO quick-practice workflows. It does not cover year-page answer reveals or written-task reading.

## Event contract

- `education_practice_cohort_started` fires once on the first successful, consented practice start or resume on a browser after this instrumentation is installed. Its fields are `cohort_day_utc`, `cohort_exam`, `cohort_subject`, and `action`.
- `education_practice_returned` fires once if that same browser starts or resumes JAMB or WAEC/NECO practice on UTC day 1 through 7 after the cohort day. It carries the cohort fields plus `return_exam`, `return_subject`, and `return_day`. A same-day repeat, completion without a later action, or day 8+ does not qualify.
- Existing JAMB and SSCE start/resume/complete event names remain in place. This contract adds two events; it does not replace the workflow events.
- The browser stores only a local cohort day, bounded exam/subject labels, and a returned flag. No question, answer, score, name, account ID, or browser identifier is sent in these new event parameters. Analytics events require existing consent.

## Reporting gate

For each fully elapsed UTC cohort day, use GA4 event counts filtered by the same `cohort_day_utc`: returned / started. The client emits at most one of each per cohort browser. Break down the starting cohort by exam and subject; cross-exam returns count toward the originating cohort. Do not divide all returns in a date range by all starts in that range: those belong to different cohorts.

Register `cohort_day_utc`, `cohort_exam`, `cohort_subject`, and `return_exam` as event-scoped GA4 custom dimensions before relying on date or subject breakdowns. Confirm receipt in Realtime, then the processed report. Use a non-consented local QA session or clearly exclude any synthetic consented cohort from decision data. Wait seven complete follow-up days and GA4 processing before reading a cohort. Consent rejection, storage clearing, blockers, and cross-device use make this an observed opt-in browser rate, not an all-student retention rate. Event delivery and custom-dimension reporting must be checked live before a numerical rate is published.

Search Console's URL Inspection and performance data are a separate input. An indexing request is not an indexed page. Compare impressions, clicks, queries, and indexed status over a complete post-release window before deciding which subject/year page warrants the next expansion. Content source quality and answer verification remain release gates even if a query has demand.
