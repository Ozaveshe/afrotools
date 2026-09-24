# Nigeria exam growth baseline — 24 September 2026

This is a measurement checkpoint, not a claim that a complete past-paper archive has been published. Search Console and Analytics were inspected in the signed-in AfroTools properties on 24 September 2026. The production release endpoint reported commit `146c5183006f23002d87ca1360f9285f4f3d6661` (built at 07:00 UTC); the JAMB archive, JAMB Mathematics 2023, SSCE practice, and Education Hub routes returned HTTP 200.

The combined local content candidate later in this batch has **8,059 eligible JAMB questions** (102 more than the live baseline), including 60 Mathematics items from a publisher-labelled 2023 collection and 31/19 English items from publisher-labelled 2022/2023 collections. The latest coverage audit still has 63 recent JAMB subject-year source gaps and **zero complete past papers**. The original UTME sitting and paper numbers of the new publisher-collection items are unconfirmed; the English publisher describes its 2023 set as modelled practice. These are pre-release counts until the exact combined artifact is deployed and verified.

## Search Console

Property: `sc-domain:afrotools.com`. Individual URL inspection reported:

| URL | 24 September status | Implication |
| --- | --- | --- |
| `/jamb/mathematics/2023/` | Indexed | The year landing page is discoverable; this does not establish complete-paper coverage or question-level search demand. |
| `/tools/education-hub/` | Indexed | The hub can be found through Google. |
| `/tools/ssce-practice/` | Discovered — currently not indexed; last crawl not available | Inspect again after the selected-paper content and page changes are published. The page is already listed in sitemaps and linked from localized practice pages. |

The Indexing overview showed 9,271 indexed and 18,722 not indexed URLs, last updated 21 September. These totals include intentional redirects, alternate canonicals, and noindex URLs; they are not a count of education failures. The 2,342 not-found URLs merit separate triage, not an education-specific diagnosis without a URL sample.

The Web Performance report for **22 June–21 September 2026** showed these sitewide query-contains filters. Search Console warns filtered totals can be partial, and these searches may land on calculators or unrelated pages rather than exam practice.

| Query contains | Clicks | Impressions | Leading observed intent |
| --- | ---: | ---: | --- |
| `jamb` | 5 | 116 | Aggregate-score calculator queries generated four of the five clicks; one was for Literature past questions. |
| `waec` | 10 | 1,950 | Grading-system and calculator queries led the visible rows. |
| `neco` | 0 | 4 | Only Hausa query variants appeared in the visible query table. |

These numbers describe **AfroTools search visibility**, not total market demand for the exams. They make it especially important to check practice-page indexing and query/page matching before using search traffic to choose new content.

A separate **URL contains `/jamb/`** filter for the same three-month period showed 53 clicks, 8,280 impressions, 0.6% CTR, and average position 21.1 across 247 rows in the Pages table. The highest-click visible year pages had only three clicks each, mostly older English, Chemistry, and Physics years. This is a large indexed footprint with very little search engagement; a new year route alone is not a distribution plan.

## Analytics

Property: AfroTools `afrotools.com`; Pages and screens report for **27 August–23 September 2026** (last 28 days). Page views and active users are different measures; these are not retained-student counts.

| Page filter | Views | Active users | Observation |
| --- | ---: | ---: | --- |
| JAMB paths combined | 58 | 19 | Twenty matching paths; the JAMB home had 19 views from five active users. |
| `/tools/ssce-practice/` | 7 | 2 | Too few users to infer return behavior. |
| `/tools/education-hub/` | 8 | 3 | Too few users to infer return behavior. |

Consent-based analytics can undercount use. The current page report cannot tell whether a student started a practice set, completed it, saved a revision, or returned to it. The accompanying JAMB CBT, WAEC/NECO practice, and study-day instrumentation uses the existing consent-aware analytics wrapper and sends only fixed exam/subject/source/mode enums and coarse count or score bands. It does not send questions, answers, names, task subjects, dates, IDs, or local drafts.

## Expansion decision gate

1. Release the verified JAMB Mathematics and English batches and source-complete WAEC/NECO companions together, then confirm the exact production commit and live routes.
2. Reinspect `/tools/ssce-practice/` in Search Console after publication and review its canonical, rendered content, and crawl result if it remains discovered-only. Compare **education URL impressions/clicks by query and country**, not sitewide totals.
3. Review opt-in `education_jamb_start`, `education_jamb_complete`, `education_jamb_resume`, `education_practice_start`, `education_practice_complete`, `education_revision_saved`, `education_revision_opened`, `education_practice_resume`, and `education_study_session_complete` events by week. Use repeat active users and starts-to-completions as directional evidence only once event counts are large enough to avoid a choice resting on two or three users. Do not classify page views as student retention.
4. Choose the next subject/exam using both a source-availability gate (authenticated, reusable questions with independently checked answers) and a demand/return-use gate. If observations remain sparse, keep Mathematics and English as the controlled pilot and mark the next expansion as provisional rather than inventing a winning subject.

The current evidence supports fixing the SSCE page's indexing and measuring practice completion; it does not yet support prioritizing a new subject from student return-use data.
