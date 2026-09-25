# Education indexing follow-up — 2026-09-25

This observation concerns production commit `77dcc293275ed6e91e09e08f2bc60922f760a3a7`, deployed on 2026-09-25. It does not establish indexing or student use for subsequent content batches.

Google Search Console URL Inspection for the `afrotools.com` domain reported `/jamb/english/2024/`, `/jamb/mathematics/2024/` and `/jamb/mathematics/2025/` as unknown to Google, with no last crawl, on 2026-09-25. Each live page had a self canonical, `index, follow`, and an entry in `jamb/sitemap.xml`. The submitted sitemap index was last read on 2026-09-24, before the release. An indexing request was accepted for each URL, and Search Console said each was added to a priority crawl queue. The request is **not** evidence that a page is indexed.

The same inspection found `/tools/ssce-practice/` indexed, with a successful Googlebot smartphone fetch and the inspected URL selected as Google's canonical after a 2026-09-24 crawl. The earlier zero-impression performance window ended before that crawl and cannot be used to diagnose a current indexing defect.

GA4 Realtime in the AfroTools property received all six consented education events on 2026-09-25: JAMB and SSCE start, resume and complete, one of each. These came from synthetic QA sessions, not real students. Standard event reports had not processed them at inspection time. Exclude 2026-09-25 from a real-use cohort.

The property had no BigQuery link on 2026-09-25. The existing AfroTools Cloud project had the BigQuery API enabled but no linked billing account. Raw GA4 events are therefore not currently exported for an exact, cross-exam, deduplicated D+1 through D+7 practice-return query. A native GA4 cohort using a single named return event would omit some practice flows, and summing daily return cells would count repeat returners more than once. Configure a privacy-reviewed measurement path before reporting that rate; do not substitute generic returning users or pageviews.

Next check: revisit URL Inspection after Google has processed the crawl queue. Compare page and query impressions, clicks, CTR and position over a complete post-release window, preserving the previous window as a dated baseline. Establish a deduplicated, consented, same-browser practice-return measure, then observe seven full follow-up days. Search requests and synthetic event receipts are not evidence of indexing or student retention.
