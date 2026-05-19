# SEO Priority CSV Inputs

Place local search-priority CSV exports in this folder before running:

```bash
npm run seo:priority:report
```

The reporter accepts Search Console or Bing-style CSV headers where available, including page/url, query, clicks, impressions, CTR, average position, citation count, and AI grounding query fields. Generated reports are written to `reports/seo-priority-report.json` by default.

Do not commit private raw exports unless they have been intentionally sanitized for the repo.
