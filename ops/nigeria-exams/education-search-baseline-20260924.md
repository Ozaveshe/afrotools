# Education search and return-use baseline — 2026-09-24

This is a read-only observation of the AfroTools Google Search Console and GA4 properties, not a forecast. Search performance covers 2026-06-22 to 2026-09-21; GA4 pages/screens covers 2026-08-27 to 2026-09-23. These windows end before the new September 24 exam release.

| Surface | Search Console | GA4 pages/screens |
| --- | --- | --- |
| `/jamb/` page-path filter | 53 clicks, 8.28K impressions, 0.6% CTR, average position 21.1; 247 URL rows with impressions | 54 views, 16 active users, 2m47s average engagement |
| `/tools/ssce-practice/` | 0 clicks and 0 impressions in the window | 7 views, 2 active users, 47s average engagement |
| Education-named URLs | 0 clicks, 88 impressions; `/tools/education-hub/` has 29 impressions | 25 views, 8 active users, 1m59s average engagement; the hub alone has 8 views and 3 users |

URL Inspection on September 24 reports `/jamb/mathematics/2023/`, `/tools/ssce-practice/` and `/tools/education-hub/` indexed with successful smartphone fetches and correct canonicals. SSCE Practice was crawled September 24, after the performance window ended; zero impressions in that window is not evidence of a current indexing problem. Sitewide not-indexed counts include redirects, alternate canonicals and intentional noindex pages and should not be treated as a single repair queue.

The inspected GA4 Events report had no `education_jamb` events in the August 27–September 23 window. The JAMB and WAEC/NECO practice hooks were added September 24, after that window. The current pageview counts are small and may include internal QA. Views per user do not establish student retention.

After the consolidated release, verify the exact deployed commit and inspect the new recent-year URLs in Search Console. Run a consented synthetic practice event through the real analytics wrapper and confirm GA4 reception; verify declined consent sends no product event. Then define **opt-in same-browser seven-day practice return**: distinct consenting GA4 clients who first start JAMB or WAEC/NECO practice on day D and start, resume or open revision on a later calendar day D+1 through D+7. Deduplicate per client and include only cohorts with seven full days of follow-up. Exclude pageviews, same-day repeats and non-practice study events; do not infer behaviour for students who decline consent or switch devices.

Use source-verification capacity, new-page indexing, organic CTR and that return cohort together to choose the next exam expansion. The current evidence supports improving discovery and proving repeat practice before committing to another country or exam; it does not establish demand for a new full paper.
