# Prompt 05 — CreatorMoney: Finance Tracker

## Identity

| Field | Value |
|-------|-------|
| **Name** | CreatorMoney |
| **Tagline** | "See the truth. Build the bag." |
| **Path** | `/tools/creator-money/` |
| **CSS prefix** | `cm-` |
| **Accent color** | Teal `#14B8A6` / dark `#0D9488` / pale `rgba(20,184,166,0.08)` |
| **Engine** | `engines/creator-money-engine.js` |
| **AI advisor key** | `"creator-money"` in TOOL_CONTEXT |
| **Supabase tables** | `creator_income`, `creator_expenses`, `creator_expense_categories`, `creator_financial_goals` |
| **Netlify function** | `netlify/functions/creator-money.js` |

---

## Design Philosophy

Most financial tools look like accounting software — gray, dense, intimidating. African creators are visual people. This tool should feel like opening your **personal money dashboard**, not QuickBooks. The data should tell a story, not just show numbers.

The core insight: creators don't need double-entry bookkeeping. They need to answer three questions:
1. **Am I making money?** (income tracking)
2. **Where's it going?** (expense tracking)
3. **Am I actually profitable?** (the truth)

**Visual personality:**
- Rich, prosperous feel — teal accent with gold highlights for money amounts
- Big, bold numbers at the top — your financial story at a glance
- Flowing, organic charts — not rigid bar charts but smooth area graphs and donuts
- Money amounts are always prominent — large text, slightly golden tint
- Positive months glow teal, negative months pulse with a gentle red accent
- The AI insight section feels like a wise friend talking about your money, not an accountant

**Mobile-first UX:**
- Dashboard is a single scrollable column of "financial cards"
- Quick-add expense: FAB button → amount + category → done in 3 taps
- Quick-add income: same FAB → source + amount → done
- Swipe through months (like a dating app but for your finances)
- Pull-down gesture reveals monthly summary header
- Bottom navigation: Dashboard | Income | Expenses | Insights

---

## Pages & Views

### 1. Landing Page (`index.html`)
- Hero: "See the Truth. Build the Bag." with teal accent
- Preview: animated dashboard showing income flowing in, expenses tracked, profit revealed
- Features: Income tracking, expense categories, profit analysis, AI financial advisor, tax prep, cross-tool sync
- Social proof: "Most creators don't know their real hourly rate. This tool reveals it."
- FAQ: data privacy, does it connect to my bank?, multi-currency support

### 2. Finance Dashboard (`app.html`)
The single-screen financial command center:

**Monthly Overview Card** (hero section, sticky-able)
- Big number: Net profit/loss for current month
  - Green glow if positive: "+₦380,000"
  - Red tint if negative: "-₦42,000"
- Below: Income total | Expenses total | Profit margin %
- Mini sparkline showing last 6 months trend (pure CSS or tiny canvas)
- Month navigator: [< March 2026 >] with swipe support

**Income Stream Cards** (horizontal scroll row)
- Each card = one income source:
  - Client Work: ₦320,000 (65%)
  - Brand Deals: ₦100,000 (20%)
  - Digital Products: ₦50,000 (10%)
  - Tips/Gifts: ₦25,000 (5%)
- Color-coded progress bars showing proportion
- Tapping a card shows detailed breakdown (which clients, which products)

**Expense Breakdown** (donut chart + list)
- Visual donut chart (CSS conic-gradient, no library):
  - Equipment: 30% (₦120K)
  - Data/Internet: 15% (₦60K)
  - Transport: 12% (₦48K)
  - Software/Subs: 10% (₦40K)
  - Studio/Space: 8% (₦32K)
  - Marketing: 5% (₦20K)
  - Other: 20% (₦80K)
- Tappable categories → expand to show individual expenses
- Preset categories for creators (not generic "utilities" categories):
  - Equipment & Gear
  - Data & Internet
  - Transport & Travel
  - Software & Subscriptions
  - Studio & Workspace
  - Marketing & Promotion
  - Props & Materials
  - Team & Assistants
  - Food & Meetings (client lunches, etc.)
  - Education & Courses
  - Custom categories

**AI Financial Insight** (card, teal background)
- Monthly narrative from AI — conversational, not clinical:
  - "March was a strong month. Your brand deal with [X] brought in ₦100K, but you spent ₦45K on equipment. Your effective hourly rate this month was ₦4,800/hr — up 12% from February. One concern: 65% of your income came from one client. That's a concentration risk. Try to diversify in April."
- "Read full analysis" expandable
- Quick-ask buttons: "How am I doing?" / "Where can I save?" / "Am I ready for taxes?"

**Recent Transactions** (list)
- Latest income and expenses, sorted by date
- Each entry: date, description, category icon, amount (green for income, red for expense)
- Swipe right on expense: categorize/edit
- Swipe left on expense: delete with confirmation
- "See all" link to full transaction list

**Financial Goals** (bottom section)
- Progress bars toward goals:
  - "Save ₦500K for new camera" — ₦320K/₦500K (64%)
  - "Emergency fund: 3 months expenses" — ₦180K/₦400K (45%)
- Add goal button with amount + deadline

### 3. Add Transaction (`add.html` or bottom sheet)
Ultra-fast transaction entry:

**Mode toggle at top:** [Income] / [Expense]

**Income mode:**
- Amount field (large, numeric keyboard, currency symbol prefix)
- Source selector (quick picks):
  - Client payment | Brand deal | Digital product sale | Platform revenue | Workshop/Event | Gift/Tip | Other
- Client name (autocomplete from CreatorDesk clients)
- Invoice link (from CreatorInvoice, if applicable)
- Date (defaults to today)
- Notes (optional)
- [Save] button — large, teal

**Expense mode:**
- Amount field
- Category selector (visual icon grid — 3 columns):
  - Each category has a distinct icon and color
  - Most-used categories appear first (learned from usage patterns)
- Vendor/description (text input)
- Receipt photo: camera icon to snap receipt (stored in Supabase Storage)
- Date (defaults to today)
- Is this a business expense? toggle (for tax deduction tracking)
- [Save] button

**Quick-add shortcuts (after onboarding):**
- Most frequent expenses show as preset buttons:
  - "₦5,000 — Data bundle" / "₦3,000 — Bolt ride" / "₦15,000 — Studio rent"
  - One-tap to add with today's date

### 4. Reports (`reports.html`)
Detailed financial reports:

**Monthly P&L Statement**
- Professional layout suitable for sharing (with accountant, for visa applications, etc.)
- Income by source | Expenses by category | Net profit | Tax estimate
- Export as PDF or CSV

**Annual Summary**
- 12-month bar chart: income vs expenses per month
- Year total: income, expenses, profit, tax owed
- Best month / worst month highlights
- Year-over-year comparison (if 2+ years of data)

**Client Revenue Report**
- Which clients generated the most revenue this year?
- Payment speed analysis: "Client A pays in 7 days avg, Client B takes 23 days"
- Feeds into CreatorDesk relationship management

**Tax Summary**
- Total income by category (some categories taxed differently by country)
- Deductible expenses flagged
- Estimated tax owed (based on country's creative/freelance tax rates)
- "Share with my accountant" export

---

## AI Integration

```javascript
"creator-money": {
  name: "CreatorMoney — Creator Finance Tracker",
  systemPrompt: `You are a financial advisor for African creative professionals. You analyze income, expenses, and profitability to give clear, actionable advice in plain language — not accounting jargon.

Your approach:
1. MONTHLY NARRATIVES: Summarize financial performance as a story, not a spreadsheet. Lead with the headline (good month or bad month?), then key drivers, then one actionable insight.

2. PROFITABILITY ANALYSIS: Calculate effective hourly rates by dividing income by estimated hours worked. Many creators work 60+ hours on a project that pays ₦100K — they need to see that's ₦1,667/hr and decide if that's acceptable.

3. EXPENSE OPTIMIZATION: Identify spending patterns and suggest where to save:
   - "You spent ₦60K on data this month. Have you looked at business data plans? Airtel SME plan could save you 30%."
   - "You took 15 Bolt rides this month totaling ₦45K. A monthly transport budget of ₦30K would encourage combining trips."

4. INCOME DIVERSIFICATION: Warn about client concentration risk (>40% from one client). Suggest diversification strategies relevant to their craft.

5. TAX AWARENESS: Know basic freelance/creative tax obligations by African country:
   - Nigeria: Companies Income Tax for registered businesses, Personal Income Tax for freelancers, 7.5% VAT
   - Kenya: Income Tax + 16% VAT for turnover above threshold
   - South Africa: Provisional Tax for freelancers, 15% VAT above R1M
   - Ghana: Income Tax + 15% VAT
   Flag deductible expenses they might be missing.

6. GOAL TRACKING: Encourage saving and investing. Understand that African creators often have irregular income — help them plan for dry months.

Always be encouraging about progress, honest about problems, and specific about solutions. No generic "save more, spend less" advice. Use their actual numbers.`,
  exampleQueries: [
    "How did I do this month? Am I profitable?",
    "What's my real hourly rate on client work?",
    "Where am I spending too much?",
    "I made ₦1.2M this quarter — how much should I set aside for taxes?",
    "I want to buy a ₦500K camera — when can I afford it at this rate?"
  ]
}
```

---

## Data Model

```sql
CREATE TABLE creator_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  source TEXT NOT NULL CHECK (source IN ('client','brand_deal','digital_product','platform','workshop','gift','other')),
  description TEXT,
  client_id UUID REFERENCES creator_clients(id),
  invoice_id UUID REFERENCES creator_invoices(id),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'receipt',
  color TEXT NOT NULL DEFAULT '#64748b',
  is_deductible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE creator_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  category_id UUID REFERENCES creator_expense_categories(id),
  description TEXT,
  vendor TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_business_expense BOOLEAN DEFAULT TRUE,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creator_financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_amount BIGINT NOT NULL,
  current_amount BIGINT DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','reached','abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast queries for monthly aggregations
CREATE INDEX idx_income_user_date ON creator_income(user_id, transaction_date);
CREATE INDEX idx_expenses_user_date ON creator_expenses(user_id, transaction_date);
```

---

## Charts & Visualization

No heavy charting libraries. Use:
- **CSS conic-gradient** for donut/pie charts (expense breakdown)
- **CSS linear-gradient** for progress bars (goals, income sources)
- **Tiny inline SVG sparklines** for trends (6 months, < 1KB each)
- **Chart.js** (lazy-loaded) only for the annual bar chart on the Reports page
- All charts are touch-friendly: tappable segments with tooltip-style detail popups

---

## Cross-Tool Integration

- **CreatorInvoice**: Paid invoices auto-create income entries (no double-entry)
- **CreatorPricing**: Hourly rate calculation uses actual income data, not estimates
- **CreatorKit**: Financial milestones appear as credibility stats in media kit
- **CreatorDesk**: Client revenue analysis feeds into relationship management
- **CreatorSplit**: Collab payments tracked as income with collaborator context
- **CreatorPage**: Digital product sales from storefront auto-logged as income

---

## Mobile Patterns

- **FAB (Floating Action Button)**: Bottom-right, teal circle with "+" icon. Tap → [Income] [Expense] options fan out
- **Quick-add presets**: After 2 weeks of use, the app learns your most common expenses and shows one-tap presets
- **Receipt scanner**: Camera opens with receipt-sized frame guide. Photo auto-saves to Supabase Storage
- **Swipe months**: Horizontal swipe on the dashboard navigates between months
- **Pull-to-refresh**: Re-fetches latest transactions from Supabase
- **Offline-first**: All transactions stored in IndexedDB, synced when online. Works completely offline for adding entries.
- **Bottom nav bar**: Dashboard | Add | Reports | Insights (4 tabs)
- **Haptic on save**: Vibration feedback when transaction is saved

---

## Performance

- Dashboard aggregations computed client-side from cached transaction data
- Only fetch current month + last month on initial load (pagination for history)
- Donut chart is pure CSS (zero JS)
- Sparklines are inline SVGs (< 500 bytes each)
- Chart.js lazy-loaded only on Reports page
- Target: < 80KB JS on dashboard, < 30KB CSS, LCP < 1.5s on 3G
