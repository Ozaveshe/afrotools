# AfroTools Implementation Prompts

## How to Use These Prompts

Each `.md` file in this directory is a **self-contained implementation prompt** you can paste directly into Claude Code. They are designed to be run independently and in any order, though some have logical dependencies noted at the top.

### Run Pattern

```bash
# 1. Open Claude Code in the afrotools directory
cd ~/Documents/afrotools

# 2. Start a new session for each prompt
# Copy the full contents of the prompt file and paste it

# 3. Recommended execution order (by priority):
#
#    PHASE 1 — Foundation (run these first, they enable everything else)
#    ├── 01-enhanced-analytics-events.md        (data collection backbone)
#    ├── 02-email-leads-schema-upgrade.md       (enriched lead data)
#    └── 03-failed-search-capture.md            (user intent signals)
#
#    PHASE 2 — Codebase Health (architectural improvements)
#    ├── 04-js-bundle-strategy.md               (performance)
#    ├── 05-auth-consolidation.md               (remove dual-auth complexity)
#    ├── 06-api-caching-layer.md                (reduce Supabase load)
#    └── 07-supabase-consolidation.md           (single DB instance)
#
#    PHASE 3 — Workflow Engine (connects tools into journeys)
#    ├── 08-next-step-engine.md                 (post-calculation suggestions)
#    ├── 09-shareable-result-urls.md            (linkable calculations)
#    └── 10-cross-tool-data-prefill.md          (carry data between tools)
#
#    PHASE 4 — Monetization (revenue features)
#    ├── 11-comparison-reports.md               (pro-tier country comparisons)
#    ├── 12-bulk-payroll-calculator.md           (pro-tier batch PAYE)
#    ├── 13-embeddable-widgets.md               (distribution + backlinks)
#    └── 14-tax-calendar-reminders.md           (pro-tier email notifications)
#
#    PHASE 5 — Growth & Distribution
#    ├── 15-referral-program.md                 (viral growth)
#    ├── 16-blog-inline-calculators.md          (content → tool conversion)
#    ├── 17-whatsapp-bot.md                     (Africa's #1 channel)
#    └── 18-partnerships-page.md                (B2B distribution)
#
#    PHASE 6 — Data Engine (the moat)
#    ├── 19-salary-crowdsource.md               (user-submitted salary data)
#    ├── 20-insight-engine.md                   (aggregated intelligence)
#    └── 21-predictive-alerts.md                (rate change predictions)
```

### Rules for All Prompts

Every prompt is written to respect:
- **ARCHITECTURE.md** — IIFE + `window.AfroTools.*` pattern, no frameworks, no build tools
- **PLATFORM_STANDARDS.md** — Canonical naming, form schemas, URL structure
- **Design System** — `tokens.min.css`, `design-system.css` variables and classes
- **Netlify deployment** — Static files + serverless functions, `_redirects` routing
- **Supabase** — RLS policies, existing table schemas
- **Analytics** — GA4 event tracking via `AfroTools.analytics`

### Prompt Structure

Each prompt follows this pattern:
1. **Context** — What exists today, what files to read first
2. **Objective** — What to build, with acceptance criteria
3. **Constraints** — Architecture rules, naming conventions, what NOT to do
4. **Implementation Steps** — Ordered tasks with file paths
5. **Verification** — How to confirm it works
