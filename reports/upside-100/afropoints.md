# AfroPoints — Audit & Upside Plan

- **Tool:** AfroPoints — Earn Money Contributing Data
- **Live:** https://afrotools.com/tools/afropoints/
- **Source:** `C:/Users/Oza/Documents/afrotools/tools/afropoints/index.html`
- **Engine:** `C:/Users/Oza/Documents/afrotools/engines/afropoints-engine.js`
- **Category:** African / rewards-data program
- **Audited:** 2026-07-13

---

## 1. What it does (verified)

A crowdsourced data-rewards program: signed-in users submit local African market observations (14 categories — informal FX, remittance quotes, fuel, transport fares, staple prices, rent, lease-risk, salaries, fintech fees, backup power, school fees, clinic/pharmacy prices, wholesale-retail spread), earn 5–18 points per accepted report, and cash out at **2,000 pts = $20** via mobile money (M-Pesa, MTN MoMo, Airtel Money), bank transfer, or crypto (USDT/BTC/ETH). Alternate redemption: **500 pts → AfroTools Pro credit**.

The page is a logged-in "cockpit": account snapshot, an interactive **Earnings Planner** (client-side, works logged-out), How-It-Works, category showcase, guides, "gold-data apps" built on the network, dashboard stats, activity feed, badges, cashout progress, mini-leaderboard, rank ladder, payout methods. Netlify functions back it (`/afropoints-account`, `-submit`, `-profile`, `-leaderboard`, `-cashout`, `data-buyer-leads`). Confirmed loads cleanly; dynamic panels show graceful loading/empty states.

**Economics (from engine):** 100 pts = $1. `DAILY_LIMIT = 20` submissions/day. Ranks: Newcomer/Contributor(100)/Trusted(500,trust70)/Expert(2k,trust85)/Legend(10k,trust90). Per-category consensus counts + freshness windows drive confirmation.

---

## 2. Competitor / analogue landscape

Real analogues for "earn money contributing data": **Premise**, **Streetbees**, plus survey/data-reward apps (**Attapoll, Mobrog**) and crowdsourced field-data platforms. Sources:
- Streetbees — no minimum payout, cash out via PayPal anytime; conversational photo missions; ~$5/referral. https://www.swiftsalary.com/platform/streetbees/
- Premise — cash out from ~C$1.50 via PayPal/crypto/mobile top-up/Payoneer; pushes geo-targeted tasks & mystery-shop missions. https://apps.apple.com/us/app/premise-earn-money/id1390094962
- Premise vs Streetbees comparison. https://www.swiftsalary.com/compare-platforms/premise-vs-streetbees/

**Features users expect that AfroPoints lacks:**
1. **Low/instant cashout threshold** — Streetbees = no minimum, Premise ≈ $1.50. AfroPoints' **$20 / 2,000-pt gate is a very high barrier** (≈200+ submissions). Biggest gap.
2. **Tracked referral rewards** — competitors pay per referral. AfroPoints only has an untracked "Share on WhatsApp" link, no reward.
3. **Pushed, geo-targeted paid missions/bounties** — Premise/Streetbees send you tasks. AfroPoints is pull-only (user picks what to submit); no "wanted data" board or premium bounties.
4. **Social proof of real payouts** — competitors lean on Trustpilot/reviews + total-paid counters. AfroPoints leaderboard renders "No confirmed contribution volume yet" — reads as zero traction.
5. **Photo/receipt-first fast capture** — competitors use conversational/photo capture; AfroPoints is form-heavy per category.

---

## 3. SEO audit

- **Title** — `AfroPoints - Earn Money by Contributing African Data | AfroTools` (~62 chars). Strong, keyword-aligned. Keep.
- **Meta description** — 158 chars, keyword-rich, includes "mobile money", "54 countries". Good.
- **H1 problem (real miss):** H1 = **"AfroPoints Contributor Cockpit"** — internal jargon, zero search intent, and it **does not match the title's money keyword**. The primary keyword ("earn money / African market data") never appears in the H1. This is the single highest-ROI SEO fix.
- **JSON-LD:** only `WebApplication`. **Missing** `BreadcrumbList` (a visible breadcrumb already exists at line 63), `HowTo` (a literal 4-step "How It Works" section is begging for it), and `FAQPage` (content already exists on `how-it-works.html` / `verification.html`). Three rich-result opportunities unused.
- **Canonical + hreflang:** present and correct (`en`, `fr`, `x-default`). Good.
- **Internal linking:** strong — system-nav, guides grid, gold-data apps, generated SEO link block, related-tools SSR.
- **Content depth:** good, not thin. But `privacy-safety.html` is only in the generated SEO footer block, not in the visible nav — weak surfacing for a data-for-cash trust page.

---

## 4. UI/UX & trust audit

- **Value-prop clarity:** hurt by the two competing frames — title says "Earn Money", hero H1 says "Contributor Cockpit". A first-time visitor's "what/why/how much" is muddied by the jargon H1. Starting path (Submit Data CTA) is otherwise clear.
- **Empty/loading/error states:** present and graceful (offline note, "data unavailable" fallback, empty leaderboard/activity). Good engineering. But the empty leaderboard doubles as a **traction credibility problem**.
- **Accessibility nits:** planner inputs carry `aria-label="ApPlanCurrent"`, `"ApPlanCustom"`, `"ApPlanWeekly"` (lines ~135/148/156) — raw camelCase identifiers read aloud by screen readers. Should be human text. (Visible `<span class="ap-label">` labels exist but aren't `for`/`id` associated; the wrapping `<label>` saves it, so the junk aria-label is redundant *and* harmful.)
- **Contrast:** gold stat values (`.gold`) on white may fail AA — verify.
- **Mobile (375px):** planner grid and metrics collapse to 1fr (good); sticky CTA auto-dismisses at 12s (good). **Verify live:** the gold-data app grid and mini-leaderboard table for horizontal overflow at 375px.
- **Trust signals:** genuinely good and honest — "Review before publication", "request-based and reviewed before release", chip **"No payout volume claimed"**. No fake "earn $50/day" hype (see red flags — this is a positive). Privacy/safety page exists but is buried.

---

## A. Quick wins (safe in-repo edits, high ROI)

1. **`tools/afropoints/index.html` (line 65)** → change H1 from `AfroPoints Contributor Cockpit` to a keyword + intent H1, e.g. **"Earn Real Money Contributing African Market Data"**. Demote "Contributor cockpit" to the existing H2 at line 107 (already present). Aligns H1 with title and search intent.
2. **`tools/afropoints/index.html` (head, after line 45)** → add three additive JSON-LD blocks: `BreadcrumbList` (AfroTools → AfroPoints), `HowTo` (the 4 steps at lines 178–209), and `FAQPage` (3–5 Q&As on payout, threshold, safety, verification). Additive only; no layout risk. Per `.claude/rules/seo-pages.md`, validate with the narrowest SEO/schema command after.
3. **`tools/afropoints/index.html` (lines ~135, 148, 156)** → replace `aria-label="ApPlanCurrent/ApPlanCustom/ApPlanWeekly"` with human strings ("Current points balance", "Custom points target", "Reports per week"). Direct a11y win.
4. **`tools/afropoints/index.html` (system-nav ~line 90–99, and/or hero)** → surface **`privacy-safety.html`** ("Is it safe?") and a payout-proof link in the visible nav. Trust is the #1 objection for a data-for-cash product.
5. **`tools/afropoints/index.html` (hero proof strip ~line 82–86 / cockpit signed-out ~line 640)** → surface the **500-pt → Pro credit** path prominently as a low first-redemption. It already exists in the engine but is buried; it directly softens the "$20 is too far away" barrier that competitors beat.

## B. Feature upgrades (net-new value vs competitors)

1. **Tracked referral rewards** — points/cash per referral who completes N accepted reports (mirror Streetbees' ~$5). Replace the untracked WhatsApp share (line 391).
2. **Micro-cashout / airtime top-up** — a low-threshold redemption (e.g. 500 pts → airtime, very African-appropriate & low-friction) to beat the $20 gate that Premise/Streetbees crush AfroPoints on.
3. **Data bounty board ("Wanted data")** — buyers/AfroTools request specific city+category at premium points; converts the pull-only model into Premise-style pushed missions and monetizes the buyer side (`data-buyers.html` already exists).
4. **Real-payout proof wall + "total paid out" counter + reviews** — replace the empty-leaderboard credibility gap with social proof.
5. **Photo/receipt-first quick-capture + OCR** — cut form friction; boosts submission volume and proof quality (proof already lifts planner multiplier to 1.2×).

## C. Watch-outs — do NOT hand-edit (generated / SEO-managed)

- Sitemaps (`sitemap-*.xml`) — generated; treat as output per `seo-pages.md`.
- `*.min.*` referenced here: `tokens.min.css`, `global.min.css`, `design-system.min.css`, `navbar.min.js`, `footer.min.js`, `related-tools.min.js`, `chat.*.min.js` — build artifacts; edit source, not these.
- `data/tool-directory.json` and the canonical/alias registry — generated; don't retitle here.
- The **`<!-- seo-internal-links -->`** block (lines 447–451) and the **`RELATED_TOOLS_SSR`** block (lines 453–460) are generated — regenerate via scripts, don't hand-edit.
- `engines/afropoints-engine.js` **is** hand-editable source, but it holds live economics (points, `DAILY_LIMIT`, thresholds, cashout ratio). Changing values shifts real payouts — treat as a product/finance decision, not a copy edit.

---

## Correctness / data-trust red flags

- **No earnings overclaim (positive):** math is internally consistent — 100 pts = $1, hero "$20 per 2,000 pts", cashout button `bal/100`, `formatCash = value/100`, "of 2,000 pts ($20)" all agree. Honest chips ("No payout volume claimed", "reviewed before release"). This is a trust *strength* vs scammy competitors — preserve it.
- **Implied-scale risk:** hero "54 countries / 14 categories" are *capabilities*, not participation. Combined with an empty leaderboard ("No confirmed contribution volume yet"), the page implies a network that may not yet exist. Not dishonest, but low proof — the Feature-B proof wall matters.
- **High barrier vs promise:** at ~10 pts/report and a 20/day cap, $20 cashout = ~200 reports / many days. Fine as disclosed, but the friction is real and un-signposted; the 500-pt Pro-credit path (Quick win 5) should be the honest "you can redeem sooner" answer.
- **Crypto payout (USDT/BTC/ETH):** offered as a payout rail — flag for AML/compliance & regional legality review; not an on-page copy issue but worth product/legal awareness.

---

## Fixes applied 2026-07-14

Edited only `tools/afropoints/index.html`:

1. **H1** changed from "AfroPoints Contributor Cockpit" to "AfroPoints — Earn Real Money Contributing African Market Data" (matches title + search intent). Kept single unique H1; "Contributor cockpit" remains as the H2.
2. **JSON-LD added** (additive, all 4 blocks validated parse): `BreadcrumbList` (AfroTools → AfroPoints), `HowTo` (the 4 How-It-Works steps), `FAQPage` (4 Q&As). `WebApplication` untouched.
3. **Junk aria-labels** replaced: `ApPlanCurrent`→"Current points balance", `ApPlanCustom`→"Custom points target", `ApPlanWeekly`→"Reports per week".
4. **Privacy-safety ("Is it safe?") link surfaced** in a new hero trust line directly under the CTAs, and referenced again in the FAQ.
5. **Payout threshold signposted** at the CTA: new hero trust line states "Cash out at 2,000 points ($20)... or redeem 500 points for AfroTools Pro credit sooner." Honest messaging preserved — no earnings overclaims added.
6. **Visible FAQ section added** (`#faq`) to back the FAQPage schema (payout, 500-pt path, safety, verification). Scoped `<style>` rules added for `.ap-hero-trust` and `.ap-faq-*`.

**Deferred (not done, out of scope):** engine economics, referral tracking, micro-cashout/airtime, data-bounty board, proof wall, photo-capture (Feature B items); generated SEO/related-tools blocks untouched. No shared-JS changes were needed, so `_shared-fixes.md` not appended.
