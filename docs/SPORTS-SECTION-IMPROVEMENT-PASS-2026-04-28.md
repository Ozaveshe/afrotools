# Sports Section Improvement Pass - 2026-04-28

## Scope

Sports and Entertainment category at `/sports/`, plus all 15 category apps under `/tools/`.

## Source Of Truth

- Registry: `assets/js/components/tool-registry.js`
- Page generator: `scripts/build-sports-tool-pages.js`
- Shared runtime: `assets/js/sports-toolkit.js`
- Shared styling: `assets/css/sports-tools.css`
- Dashboard hook: `dashboard/index.html`

## Product Pattern

Every Sports app should:

- Render through `assets/js/sports-toolkit.js`.
- Show app-specific inputs, metrics, table rows, insights, and source cards where relevant.
- Offer a post-result PDF-ready report gate, not a pre-calculation blocker.
- Capture email through `/api/capture-lead` with source `sports-pdf-gate`.
- Save a local dashboard item in `afro_sports_reports_v1`.
- Try account sync through `AfroWorkspace.upsert` when the user is signed in.
- Suggest the next app in the related workflow.

## Workflows

- Betting decision path: `betting-odds` -> `betting-tax` -> `match-tickets`
- Creator money path: `streaming-royalties` -> `photo-video-pricing` -> `dj-booking-rate`
- Event operator path: `concert-budget` -> `event-ticket-revenue` -> `dj-booking-rate` -> `photo-video-pricing`
- Athlete pathway: `sports-scholarship` -> `athlete-earnings` -> `fantasy-football`
- Sports business path: `gym-roi-business` -> `gaming-pc-build` -> `athlete-earnings`

## App-Specific Upgrade Notes

- Betting odds: no-vig two-way market margin, opposite-side odds, parlay stress test.
- AFCON predictor: upset volatility, likely final path, CAF source context.
- Fantasy football: 2025/26 defensive contributions, start probability, fixture difficulty, points per million.
- Betting tax: actual-slip payout audit against modeled net payout.
- Streaming royalties: collaborator split, recoupable advance, charged marketing spend.
- Nollywood box office: distribution expenses and investor recoup waterfall.
- DJ booking rate: setup time and MC/host scope lines.
- Concert budget: permits, insurance, vendor revenue, 50 percent and 75 percent attendance stress tests.
- Gym ROI: non-dues revenue, owner/operator salary, LTV/CAC.
- Event ticket revenue: early-bird inventory, sponsor revenue, affiliate payout.
- Match tickets: transport, food, and parking included in total outing cost.
- Sports scholarship: coach outreach engine, target schools, reply rate.
- Athlete earnings: signing bonus, relocation support, retirement reserve.
- Gaming PC build: resolution target, verified used-parts discount, PSU guidance.
- Photo/video pricing: revisions, albums, drone add-on, business overhead.

## Validation

Use these focused checks after touching the Sports category:

```bash
node -c assets/js/sports-toolkit.js
node -c scripts/build-sports-tool-pages.js
node scripts/build-sports-tool-pages.js
npm run audit
npm run check-links
```

When browser automation is available, smoke:

- `/sports/`
- `/tools/betting-tax/`
- `/tools/streaming-royalties/`
- `/dashboard/`

Expected markers:

- Hub contains `Choose a sports workflow`.
- Tool pages contain `sports-report-gate`.
- Betting tax contains `Actual received from slip`.
- Streaming royalties contains `Unrecouped advance`.
- Dashboard contains `Sports Reports`.
