# Education indexing follow-up — 2026-09-25

This observation concerns production commit `77dcc293275ed6e91e09e08f2bc60922f760a3a7`, deployed on 2026-09-25. It does not establish indexing or student use for subsequent content batches.

Google Search Console URL Inspection for the `afrotools.com` domain reported `/jamb/english/2024/`, `/jamb/mathematics/2024/` and `/jamb/mathematics/2025/` as unknown to Google, with no last crawl, on 2026-09-25. Each live page had a self canonical, `index, follow`, and an entry in `jamb/sitemap.xml`. The submitted sitemap index was last read on 2026-09-24, before the release. An indexing request was accepted for each URL, and Search Console said each was added to a priority crawl queue. The request is **not** evidence that a page is indexed.

The same inspection found `/tools/ssce-practice/` indexed, with a successful Googlebot smartphone fetch and the inspected URL selected as Google's canonical after a 2026-09-24 crawl. The earlier zero-impression performance window ended before that crawl and cannot be used to diagnose a current indexing defect.

Next check: revisit URL Inspection after Google has processed the crawl queue. Compare page and query impressions, clicks, CTR and position over a complete post-release window, preserving the previous window as a dated baseline. Separately verify actual GA4 receipt for consented JAMB and SSCE start/resume/complete events. Only then compute an opt-in same-browser D+1 through D+7 practice-return cohort with seven full follow-up days; pageviews and same-day repeats do not establish return use.
