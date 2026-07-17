# Prompt 02 — Compliance Calendar: Statutory Deadlines Tracker

## Identity

| Field | Value |
|-------|-------|
| **Name** | Compliance Calendar |
| **Tagline** | "Miss a deadline. Pay the penalty. Never again." |
| **Path** | `/tools/compliance-calendar/` |
| **CSS prefix** | `ccal-` |
| **Accent color** | Orange `#EA580C` / dark `#9A3412` / pale `#FFF7ED` |
| **Engine** | `engines/compliance-calendar-engine.js` |
| **AI advisor key** | `"compliance-calendar"` in TOOL_CONTEXT |
| **Supabase tables** | `afrowork_compliance_events`, `afrowork_alert_subscriptions` |
| **Netlify function** | `netlify/functions/afrowork-compliance.js` |

---

## Why This Exists

Every African employer lives in fear of PAYE filing deadlines. The consequences are severe:
- **Nigeria**: PAYE late filing = 5% penalty per month on outstanding amount
- **South Africa**: PAYE late submission = 10% penalty + 10% interest per year (SARS)
- **Kenya**: PAYE late filing = 5% of tax due or KES 10,000 minimum
- **Ghana**: PAYE late filing = 10% penalty + 2% interest per month (GRA)

51% of African companies run payroll on spreadsheets. Almost none have a compliance calendar. No one has built this for Africa. This is an employer's most underserved need.

---

## Compliance Event Data

Each entry in `afrowork_compliance_events` covers one filing obligation:

```
Fields:
- country_code (text)        — 'NG', 'KE', 'ZA', 'GH', etc.
- event_type (text)          — 'paye' | 'pension' | 'social-security' | 'levy' | 'annual-return' | 'vat' | 'cit'
- event_name (text)          — "Monthly PAYE Remittance"
- description (text)         — what must be filed/paid
- frequency (text)           — 'monthly' | 'quarterly' | 'annual' | 'bi-annual'
- due_day (integer)          — day of month (e.g., 31 = last day, 10 = 10th)
- due_month (integer/null)   — for annual events (1=Jan, 4=Apr, etc.)
- grace_days (integer)       — grace period before penalty kicks in
- penalty_rate (text)        — "5% per month" or "KES 10,000 minimum"
- authority (text)           — "FIRS", "SARS", "KRA", "GRA"
- authority_url (text)       — link to filing portal
- notes (text)               — any nuance (e.g., "electronic filing mandatory above NGN 25M turnover")
- effective_from (date)      — when this rule came into force
- last_verified (date)       — when AfroTools last verified this data
```

### Core Events by Country (seed data)

**Nigeria:**
- PAYE: due on last working day of each month → LIRS/SIRS (state-level)
- Pension (PenCom): due by 7th of following month
- NHF: due by 1st of following month
- NSITF: due by 15th of following month
- ITF (1% of payroll): due annually by January 31
- FIRS Annual Returns: due March 31
- WHT remittance: due 21st of following month

**Kenya:**
- PAYE: due by 9th of following month → KRA
- NSSF: due by 9th of following month
- SHIF (Social Health Insurance Fund): due by 9th
- AHL (Affordable Housing Levy): due by 9th
- NITA (training levy): due quarterly by 15th
- KRA Annual Returns: due June 30

**South Africa:**
- PAYE: due by 7th of following month (or 25th if electronic) → SARS
- UIF: due with PAYE by 7th
- SDL (Skills Development Levy): due with PAYE by 7th
- SARS EMP201: monthly declaration
- SARS EMP501: bi-annual reconciliation (August + February)
- VAT (if registered): due 25th or last business day of month

**Ghana:**
- PAYE: due 15th of following month → GRA
- SSNIT Tier 1: due 14th of following month
- SSNIT Tier 2: due 14th of following month (to fund manager)
- SSNIT Tier 3 (if applicable): due 14th
- CIT (Corporate Income Tax): provisional payments quarterly

---

## Pages & Views

### Landing Page (`index.html`)

- Hero: orange accent, headline "Never miss a PAYE deadline again"
- Sub: "Statutory filing deadlines for all 54 African countries — with email and WhatsApp alerts"
- "Set Up My Calendar" CTA (orange button)
- Penalty showcase: animated ticker showing "Nigerian companies paid ₦4.2B in PAYE penalties in 2024" style stat
- Country quick-select: flag chips for top 10 countries
- Features: Monthly digest | WhatsApp alerts | iCal export | SMS reminders | Multi-country support
- FAQ: 5 questions on accuracy, update frequency, multi-country, alert timing

### Calendar App (`calendar.html`)

**Header controls:**
- Country selector (multi-select, up to 5 countries)
- Month/Year picker (defaults to current month)
- View toggle: Calendar | Timeline | Table
- Filter pills: All | PAYE | Pension | Social Security | Levies | Annual Returns

**Calendar View:**
- Month grid (7 columns, Mon–Sun)
- Each deadline shown as a colored dot on its due date
- Color coding by event type: PAYE (orange), Pension (blue), Social Security (green), Levy (purple), Annual (red)
- Click date → detail drawer slides up with: event name, what to file, where to file, penalty for missing, official portal link
- "Add Reminder" button on each event → triggers alert subscription flow

**Timeline View:**
- Vertical timeline of upcoming 90 days
- Each event is a card: flag emoji + event name + days until due + penalty rate
- Overdue events shown in red at top with "OVERDUE" badge
- Sort by: Due Date | Country | Event Type

**Table View:**
- Sortable table: Country | Event | Frequency | Next Due | Authority | Penalty
- Export as CSV button (for HR/finance teams)
- Print view for posting in office

**Multi-Country Mode:**
- When 2+ countries selected, events interleaved chronologically
- Country flag shown on each event card
- "Heaviest week" indicator — week with most overlapping deadlines highlighted

### Alert Subscription Flow

After clicking "Add Reminder" on any event:
1. **When to notify?** — Chips: "1 week before" | "3 days before" | "Day of" | "All of the above"
2. **How?** — Chips: "Email" | "WhatsApp" | "Both"
3. **Contact:** — Email input OR WhatsApp number input
4. **Confirm:** → stored in `afrowork_alert_subscriptions`
5. Success: "You'll be reminded about [event] on [date]. Add more reminders?"

Alert subscription data:
```sql
create table afrowork_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,          -- null for anonymous
  email text,
  whatsapp text,
  country_code text not null,
  event_type text,                              -- null = all events for country
  lead_days integer[] default '{7,3,1}',        -- days before due to notify
  active boolean default true,
  created_at timestamptz default now()
);
```

**Netlify function sends alerts:**
```javascript
// netlify/functions/afrowork-compliance.js
// Scheduled via Netlify Scheduled Functions — runs daily at 06:00 UTC
// Queries afrowork_compliance_events for events due in 7, 3, 1 days
// Queries afrowork_alert_subscriptions for matching subscribers
// Dispatches: email via Resend API, WhatsApp via Cloud API
```

---

## AI Integration

```javascript
"compliance-calendar": {
  name: "Compliance Calendar — African Statutory Deadlines",
  systemPrompt: `You are an African payroll compliance expert. You know every statutory filing deadline, penalty rate, and grace period for all 54 African countries.

Your role:
- Answer specific questions about filing deadlines ("When is PAYE due in Kenya?")
- Explain what happens if a deadline is missed — exact penalty rates, not vague warnings
- Guide users through what to file and where ("SARS EMP201 is submitted via eFiling at efiling.sars.gov.za")
- Explain the difference between remittance (paying money) and filing (submitting a form) — many confuse these
- Help multi-country employers understand their combined compliance burden
- Explain grace periods: "Nigeria technically allows until the last business day, but FIRS has been strict since 2024"
- Know recent changes: e.g., Kenya replaced NHIF with SHIF in October 2024 — the rates and filing procedures changed
- Help users prioritize: if resources are tight, which penalties are most severe?

Always cite the specific regulatory body and act. Give exact penalty rates when known.`,
  exampleQueries: [
    "When is PAYE due in Nigeria?",
    "What happens if I miss the SSNIT deadline in Ghana?",
    "I operate in Kenya and Nigeria — what are my filing deadlines this month?",
    "What is the SARS EMP501 reconciliation and when is it due?",
    "How do I file PAYE returns online in South Africa?"
  ]
}
```

---

## Netlify Scheduled Function

```javascript
// netlify/functions/afrowork-compliance.js
// Schedule: daily at 06:00 UTC
// Also handles: GET /api/compliance?country=NG&month=4&year=2026

exports.handler = async (event) => {
  // GET: return compliance events for country/month
  if (event.httpMethod === 'GET') {
    const { country, month, year } = event.queryStringParameters;
    // Query afrowork_compliance_events
    // Return array of events with computed next_due dates
  }

  // Scheduled: send alerts
  if (event.httpMethod === 'POST' && event.headers['x-netlify-event'] === 'schedule') {
    // 1. Get today + 1, 3, 7 days ahead
    // 2. Find compliance events due on those dates
    // 3. Find subscriptions matching those events
    // 4. Send emails via Resend, WhatsApp via Meta Cloud API
    // 5. Log dispatches to afrowork_alert_log table
  }
};
```

---

## iCal Export

Each country's compliance calendar exportable as `.ics` file — imports into Google Calendar, Outlook, Apple Calendar:

```
/tools/compliance-calendar/export.ics?country=NG&year=2026
```

Returns standard iCal format with:
- Event title: "[NG] Monthly PAYE Remittance — Due"
- Date: due date
- Alarm: 7 days before (VALARM)
- Description: penalty rate + authority portal URL

---

## Cross-Tool Integration

- **AfroPayroll OS**: Final step of New Hire and Expansion journeys
- **Regulatory Alerts**: When a compliance event date changes (e.g., law amendment), triggers a regulatory alert automatically
- **Document Generator**: "Filing complete" can trigger generation of a compliance confirmation memo
- **Payroll API**: B2B API clients can query compliance calendar as an endpoint

---

## Mobile UX

- Default to Timeline view on mobile (calendar grid is hard to read on small screens)
- Swipe left/right to advance months
- Pull-to-refresh to check for updated deadlines
- Alert subscription is a bottom sheet — slides up, 3 taps to subscribe
- "Share this deadline" → WhatsApp share with pre-written message: "⚠️ Reminder: PAYE due in 3 days. File at firs.gov.ng"
- Offline mode: last-fetched calendar cached in localStorage (7-day TTL)

---

## Performance

- Compliance event data cached client-side — few API calls needed
- Calendar renders in CSS grid — no JS charting library
- iCal export is a pure server-side text response
- Target: < 50KB JS on calendar page
