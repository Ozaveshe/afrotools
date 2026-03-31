# Prompt 02 — CreatorInvoice: Invoice & Quote Builder

## Identity

| Field | Value |
|-------|-------|
| **Name** | CreatorInvoice |
| **Tagline** | "Get paid. On time. Every time." |
| **Path** | `/tools/creator-invoice/` |
| **CSS prefix** | `ci-` |
| **Accent color** | Emerald `#10B981` / dark `#059669` / pale `rgba(16,185,129,0.08)` |
| **Engine** | `engines/creator-invoice-engine.js` |
| **AI advisor key** | `"creator-invoice"` in TOOL_CONTEXT |
| **Supabase tables** | `creator_invoices`, `creator_invoice_items`, `creator_clients`, `creator_quotes` |
| **Netlify function** | `netlify/functions/creator-invoice.js` |

---

## Design Philosophy

Invoicing is where creators feel most "business-like" — and most insecure. This tool should make them feel like a **professional agency**, not a freelancer fumbling with Word docs. The output (the PDF, the shared link) is the star. It should look so good that clients take the creator more seriously just by seeing it.

**Visual personality:**
- Clean, confident, money-green emerald accent — feels like prosperity
- The invoice preview is always visible — live-updating as you type (split-screen on desktop, bottom-peek on mobile)
- Beautiful PDF output with African-inspired geometric borders (subtle, not kitsch)
- Status badges that feel alive: "Paid" glows green, "Overdue" pulses red softly, "Sent" is calm blue
- Dashboard has a "money coming in" energy — totals are big, status is clear

**Mobile-first UX:**
- Invoice creation is a guided flow (not a giant form) — one section at a time
- Bottom sheet for adding line items — swipe up, fill, done
- Invoice preview is a tappable card that expands to full-screen
- Quick actions via FAB (floating action button): New Invoice, New Quote, Send Reminder
- Swipe actions on invoice list: swipe right = mark paid, swipe left = send reminder
- Share via WhatsApp is always one tap away — generates a clean message with invoice link

---

## Pages & Views

### 1. Landing Page (`index.html`)
Standard tool landing page:
- Hero: "Get Paid. On Time. Every Time." with emerald accent
- Preview mockup of a beautiful invoice on a phone screen
- Features: Multi-currency, VAT/Tax auto-calc, Payment tracking, WhatsApp sharing, AI follow-ups, PDF export
- Social proof: "Join 2,000+ African creators managing their invoices professionally"
- FAQ: covers currencies supported, is it legally valid, privacy of client data

### 2. Invoice Dashboard (`app.html`)
The command center for all invoicing activity:

**Top Stats Bar** (sticky on mobile, scrolls horizontally)
- Total Outstanding: ₦1,250,000 (large, bold)
- Paid This Month: ₦450,000
- Overdue: ₦200,000 (red accent if > 0)
- Average Payment Time: 12 days

**Quick Actions Row**
- [+ New Invoice] — emerald primary button
- [+ New Quote] — outlined button
- [Send Reminders (3)] — badge showing how many overdue

**Invoice List** (default view)
- Filter tabs: All | Draft | Sent | Paid | Overdue
- Each invoice card shows:
  - Client name + project name
  - Amount in local currency (large)
  - Status badge (color-coded: draft=gray, sent=blue, viewed=amber, paid=green, overdue=red)
  - Date sent / due date
  - Small "..." menu: Edit, Duplicate, Send Reminder, Mark Paid, Delete
- Swipe gestures on mobile:
  - Right swipe → green "Mark Paid" action
  - Left swipe → amber "Send Reminder" action
- Empty state: Friendly illustration + "Create your first invoice — it takes 30 seconds"

**Client List** (tab or toggle)
- Cards showing each client:
  - Client name, company (if any)
  - Total invoiced, total paid, total outstanding
  - Last invoice date
  - "New Invoice" quick-action button on each card

### 3. Invoice Creator (`create.html`)
A guided, step-by-step invoice builder:

**Step 1 — Who's this for?**
- Client selector (search existing clients or create new)
- New client form: Name, Company (optional), Email, Phone/WhatsApp, Country, Billing address (optional)
- "Save client for future invoices" toggle (on by default)

**Step 2 — What did you do?**
- Line items builder:
  - Each line: Description, Quantity, Unit price, Total (auto-calculated)
  - "Add line item" button
  - AI assist: "Describe the work" textarea → AI generates itemized line items
    - Example input: "Shot a 2-day wedding, delivered 300 edited photos, 1 highlight reel"
    - AI output: 3 line items with suggested prices based on creator's profile/rates
  - Reorder via drag handle (touch-friendly, 48px grip area)
  - Swipe to delete line items
- Subtotal auto-calculated at bottom of items list

**Step 3 — The details**
- Invoice number: auto-generated (INV-001, INV-002...) or custom
- Invoice date: defaults to today
- Due date: "On receipt" / "7 days" / "14 days" / "30 days" / Custom date
- Currency: from creator profile, changeable
- Tax/VAT section:
  - Toggle "Add VAT/Tax"
  - Rate field (pre-populated by country: Nigeria=7.5%, Kenya=16%, SA=15%, Ghana=15%)
  - VAT registration number (optional)
- Discount section:
  - Toggle "Add discount"
  - Percentage or fixed amount
- Notes field: payment instructions, bank details, thank you message
  - AI pre-fills with professional payment instructions based on country:
    - Nigeria: bank transfer details template
    - Kenya: M-Pesa paybill template
    - SA: EFT details template

**Step 4 — Preview & Send**
- Full invoice preview (matches the PDF output exactly)
- On mobile: full-screen scrollable preview with floating bottom bar
- Bottom bar actions:
  - [Save Draft] — gray
  - [Download PDF] — outlined
  - [Send via WhatsApp] — green, prominent (this is how African business works)
  - [Send via Email] — secondary
  - [Copy Payment Link] — if online payment is set up

### 4. Invoice View (`view.html?id=xxx`)
Public-facing invoice page (shareable link):
- Clean, branded invoice display
- Creator's logo/name at top
- Full invoice details
- "Pay Now" button (if payment gateway connected)
- "Download PDF" button
- Footer: "Invoice created with AfroTools CreatorInvoice"
- This page tracks views (creator can see when client opened it)

### 5. Quote Builder (`quote.html`)
Same flow as invoice creator but for quotes/estimates:
- Adds: Validity period ("This quote is valid for 14 days")
- Adds: Optional/conditional line items (client can choose packages)
- "Convert to Invoice" button when quote is accepted
- AI generates persuasive quote cover letter based on project description

---

## AI Integration

```javascript
"creator-invoice": {
  name: "CreatorInvoice — Invoice & Quote Builder",
  systemPrompt: `You are a billing and business communication assistant for African creative professionals.

Your capabilities:
1. LINE ITEM GENERATION: When given a plain-language project description, break it down into professional, itemized line items with suggested prices. Use the creator's saved rates if available, otherwise use market rates for their craft/country.

2. PAYMENT FOLLOW-UPS: Draft follow-up messages for overdue invoices. Calibrate tone based on:
   - 1-3 days overdue: Gentle reminder, assume they forgot
   - 4-14 days: Professional nudge, reference the invoice number
   - 15-30 days: Firm but respectful, mention the due date, ask for a payment date
   - 30+ days: Very direct, mention potential consequences professionally
   Output messages formatted for WhatsApp (short paragraphs, no formal headers).

3. SCOPE CREEP DETECTION: When given client messages/requests, identify if the work exceeds the original quote. Draft a professional "additional charges" response.

4. QUOTE COVER LETTERS: Write compelling, concise cover letters for quotes that emphasize value, not just cost.

5. CONTRACT CLAUSES: Suggest protective terms based on the project type (kill fees, revision limits, usage rights, payment terms).

Always be professional but warm — this is African business culture where relationships matter. Never be aggressive in follow-ups. Always give the creator the final say on tone.

Format all currency amounts in the creator's local currency.`,
  exampleQueries: [
    "Turn this into invoice line items: 3-day brand shoot for a fashion label, 200 photos, 2 outfit changes per look, studio rental included",
    "Write a payment reminder — this invoice is 2 weeks overdue",
    "The client wants 50 extra photos that weren't in the original quote. Help me respond.",
    "Write a cover letter for my wedding photography quote",
    "What payment terms should I use for a new client I've never worked with?"
  ]
}
```

---

## Data Model

```sql
-- Clients (shared across creator tools)
CREATE TABLE creator_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  country_code TEXT,
  billing_address TEXT,
  notes TEXT,
  total_invoiced BIGINT DEFAULT 0,
  total_paid BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE creator_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES creator_clients(id),
  invoice_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','paid','overdue','cancelled')),
  currency TEXT NOT NULL DEFAULT 'NGN',
  subtotal BIGINT NOT NULL DEFAULT 0,
  discount_type TEXT CHECK (discount_type IN ('percentage','fixed')),
  discount_value NUMERIC,
  tax_rate NUMERIC DEFAULT 0,
  tax_number TEXT,
  total BIGINT NOT NULL DEFAULT 0,
  amount_paid BIGINT DEFAULT 0,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  payment_instructions TEXT,
  client_name TEXT,
  client_email TEXT,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice line items
CREATE TABLE creator_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES creator_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit_price BIGINT NOT NULL,
  total BIGINT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Quotes (similar to invoices but with extra fields)
CREATE TABLE creator_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES creator_clients(id),
  quote_number TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','sent','accepted','declined','expired','converted')),
  currency TEXT NOT NULL DEFAULT 'NGN',
  subtotal BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL DEFAULT 0,
  valid_until DATE,
  cover_letter TEXT,
  converted_invoice_id UUID REFERENCES creator_invoices(id),
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies: all tables filtered by user_id
-- Public view: invoices accessible via share_token (read-only, increments view_count)
```

---

## Engine (`creator-invoice-engine.js`)

```javascript
(function() {
  'use strict';

  const CreatorInvoice = {
    id: 'creator-invoice',
    version: '1.0.0',

    // Tax rates by country (kept client-side for speed)
    TAX_RATES: {
      NG: { rate: 7.5, name: 'VAT', required: false },
      KE: { rate: 16, name: 'VAT', required: true },
      ZA: { rate: 15, name: 'VAT', required: false },
      GH: { rate: 15, name: 'VAT', required: false },
      TZ: { rate: 18, name: 'VAT', required: false },
      EG: { rate: 14, name: 'VAT', required: false },
      RW: { rate: 18, name: 'VAT', required: false },
      // ... all 54 countries
    },

    // Calculate invoice totals
    calculateTotals(items, options = {}) {
      // items: [{ description, quantity, unitPrice }]
      // options: { discountType, discountValue, taxRate }
      // Returns: { subtotal, discount, taxable, tax, total }
    },

    // Generate next invoice number for user
    getNextInvoiceNumber(existingInvoices) {
      // Returns: "INV-007" (incrementing)
    },

    // Format currency
    formatCurrency(amount, currencyCode) {
      // Returns: "₦85,000.00" or "KES 12,000.00"
    },

    // Generate PDF (client-side using jsPDF or html2canvas)
    async generatePDF(invoiceData) {
      // Returns: Blob of PDF
    },

    // Generate WhatsApp share message
    generateWhatsAppMessage(invoice) {
      // Returns: formatted text with invoice summary + payment link
      // "Hi [client], here's invoice INV-005 for [project] — ₦150,000 due by [date]. View: [link]"
    },

    // Check overdue invoices
    getOverdueInvoices(invoices) {
      // Returns: invoices where due_date < today && status !== 'paid'
    },

    // Payment instructions templates by country
    getPaymentTemplate(countryCode) {
      // Returns: pre-written payment instructions
      // NG: "Bank Transfer: [Bank Name] / [Account Number] / [Account Name]"
      // KE: "M-Pesa: Send to [Paybill/Till] / Account: [Reference]"
    },

    // Generate default notes
    getDefaultNotes(countryCode) {
      // Returns: professional thank-you note + payment instructions placeholder
    }
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.creatorInvoice = CreatorInvoice;
})();
```

---

## PDF Invoice Design

The PDF output is critical — it's what the client sees. It must be gorgeous:

```
┌──────────────────────────────────────────┐
│  [Creator Logo/Name]          INVOICE    │
│  Creator Name                            │
│  creator@email.com                       │
│  +234 801 234 5678                       │
│──────────────────────────────────────────│
│  Bill To:              Invoice #: INV-005│
│  Client Name           Date: Mar 15, 2026│
│  Client Company        Due: Mar 29, 2026 │
│  client@email.com                        │
│──────────────────────────────────────────│
│                                          │
│  DESCRIPTION          QTY  RATE   TOTAL  │
│  ─────────────────────────────────────── │
│  Full-day wedding       1  ₦200K  ₦200K  │
│  photography                             │
│                                          │
│  Photo editing &        1  ₦80K   ₦80K   │
│  retouching (300 imgs)                   │
│                                          │
│  Highlight reel         1  ₦120K  ₦120K  │
│  (3-5 min video)                         │
│  ─────────────────────────────────────── │
│                        Subtotal  ₦400,000│
│                        VAT (7.5%) ₦30,000│
│                        ─────────────────-│
│                        TOTAL    ₦430,000 │
│                                          │
│──────────────────────────────────────────│
│  Payment Details:                        │
│  Bank: First Bank | Acc: 1234567890      │
│  Name: Amara Okafor                      │
│                                          │
│  Thank you for your business!            │
│──────────────────────────────────────────│
│  ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔ │
│  Created with AfroTools CreatorInvoice   │
└──────────────────────────────────────────┘
```

- Subtle geometric African-inspired border (thin lines, not clip-art)
- Creator's accent color used for headers and lines
- Clean, modern typography (DM Sans for body, Instrument Serif for "INVOICE" header)
- QR code option for mobile payment (future)

---

## Cross-Tool Integration

- **CreatorPricing**: "Use these rates" button pre-fills line item prices
- **CreatorKit**: Invoice stats ("₦2.3M invoiced this year") appear in media kit
- **CreatorMoney**: All invoices auto-sync to finance tracker as income
- **CreatorDesk**: Invoices linked to projects; client data shared between both tools
- **CreatorSplit**: Collab invoices can auto-split payments between collaborators

---

## WhatsApp-First Workflow

This is the killer feature for Africa. The entire invoice lifecycle can happen via WhatsApp:

1. Creator generates invoice → taps "Share via WhatsApp"
2. Pre-formatted message sent to client:
   > "Hi Sarah, here's the invoice for the product shoot we discussed. Amount: ₦150,000 due by March 29. View here: [link]"
3. Client opens link → mobile-optimized invoice view → can pay or confirm
4. When payment received → creator taps "Mark Paid" → optional thank-you message auto-drafted
5. If overdue → creator taps "Send Reminder" → AI drafts contextual follow-up for WhatsApp

---

## Performance

- Invoice list uses virtual scrolling for 100+ invoices
- PDF generation: client-side via jsPDF (lazy-loaded, ~80KB)
- Invoice data cached in localStorage for offline viewing
- Share tokens are short and URL-friendly for WhatsApp
- Target: < 120KB total JS, LCP < 2s on 3G
- Skeleton loading for dashboard stats
