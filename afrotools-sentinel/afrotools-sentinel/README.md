# AfroTools Sentinel + DataPipe

**QA Testing Agent + Data Collection Engine for AfroTools.com**

## What This Is

A complete infrastructure layer for AfroTools that ensures every tool works correctly, every data point stays fresh, and every page meets platform standards.

Three systems, one repository:

| System | Purpose | Runs |
|--------|---------|------|
| **Sentinel** | QA test runner — validates calculation accuracy, PDF export, share, AI advisor, SEO, mobile, accessibility, performance | On every push to `main` + manual |
| **DataPipe** | Data freshness monitor — watches government websites for tax rate changes, currency shifts, fuel price updates | Daily at 06:00 UTC via cron |
| **Scripts** | Sitemap generator, feedback widget, service worker, error reporter | On deploy |

## Quick Start

```bash
# Install
npm install

# Run all QA tests
npm test

# Test a specific tool
npm run test:tool -- ng-paye

# Test all Tier 1 tools only
npm run test:tier1

# Dry run (see what would be tested)
npm run test:dry-run

# Run data monitor
npm run monitor

# Generate sitemap
npm run sitemap

# View the HTML report
npm run report
```

## Directory Structure

```
afrotools-sentinel/
├── sentinel/
│   ├── sentinel.js           # Main QA test runner
│   ├── tool-registry.json    # Master list of all tools (THE source of truth)
│   ├── fixtures/             # Known-good reference values per tool
│   │   ├── ng-paye-2026.json
│   │   ├── ng-vat-2026.json
│   │   └── ...
│   └── reports/              # Generated test reports (JSON + HTML)
├── datapipe/
│   ├── monitor.js            # Passive data change monitor
│   ├── sources.json          # Monitored source definitions
│   └── changes.log           # Historical change log
├── scripts/
│   ├── generate-sitemap.js   # Auto sitemap from tool registry
│   ├── afrotools-reporter.js # Error reporter + feedback widget (embed in all pages)
│   ├── service-worker.js     # PWA offline support
│   └── manifest.json         # PWA manifest
├── .github/workflows/
│   └── sentinel.yml          # GitHub Actions CI/CD
└── package.json
```

## Test Coverage

Sentinel tests every tool across 9 categories:

| Category | Tests | Required For |
|----------|-------|-------------|
| SEO | Title, meta desc, canonical, OG tags, Schema.org, H1, internal links | All tools |
| Mobile | Horizontal scroll, touch targets, viewport meta, font sizes | All tools |
| Accessibility | Alt text, form labels, color contrast, focus styles, lang attr | All tools |
| Performance | Page weight, load time, resource count | All tools |
| PDF Export | Button exists, @media print CSS | Tools with `pdf` feature |
| Share/Copy | Button exists, clipboard API | Tools with `share` feature |
| AI Advisor | UI exists, input field | Tools with `ai` feature |
| Email Capture | Form exists, localStorage integration | Tools with `email` feature |
| Calculation | Input → output against reference fixtures | Tools with fixtures |

## Adding a New Tool

1. **Register it** in `sentinel/tool-registry.json`
2. **Create a fixture** (if it has calculations) in `sentinel/fixtures/`
3. **Add data sources** (if applicable) in `datapipe/sources.json`
4. **Run Sentinel** to verify: `npm run test:tool -- your-tool-slug`

## Data Collection Channels

### Channel 1: Passive Monitoring (Automated)
DataPipe checks official sources daily. If keywords disappear from a revenue authority page (suggesting a rate change), it creates a GitHub Issue for human review.

### Channel 2: Incentivized Contribution (Community)
The feedback widget (`afrotools-reporter.js`) includes a "Report Incorrect Data" link on every tool. Users submit corrections via Google Forms.

### Channel 3: Scraping Pipelines (Automated)
For high-frequency data (exchange rates, fuel prices), dedicated scraping scripts run on schedule. Not included in this repo — run separately on VPS or Netlify Functions.

## Deploying to Production

1. Copy `scripts/afrotools-reporter.js` → your AfroTools `/assets/js/` directory
2. Copy `scripts/service-worker.js` → your AfroTools root (`/`)
3. Copy `scripts/manifest.json` → your AfroTools root (`/`)
4. Add to every page's `<head>`:
   ```html
   <link rel="manifest" href="/manifest.json">
   <script src="/assets/js/afrotools-reporter.js" defer></script>
   ```
5. Add to your site's main JS:
   ```javascript
   if ('serviceWorker' in navigator) {
     navigator.serviceWorker.register('/service-worker.js');
   }
   ```
6. Replace `YOUR_ERROR_FORM_ID`, `YOUR_FEEDBACK_FORM_ID`, and `YOUR_DATA_REPORT_FORM_ID` in `afrotools-reporter.js` with your actual Google Form IDs
7. Push `.github/workflows/sentinel.yml` to your repo
8. Set `SLACK_WEBHOOK_URL` in GitHub Secrets (optional, for alerts)

## Configuration

Environment variables:
- `AFROTOOLS_BASE_URL` — Override the base URL for testing (default: `https://afrotools.com`)
- `GITHUB_TOKEN` — For creating issues from DataPipe (auto-set in GitHub Actions)
- `SLACK_WEBHOOK_URL` — For failure notifications (optional)

---

*Built for Africa. By Africa. With Africa.*
