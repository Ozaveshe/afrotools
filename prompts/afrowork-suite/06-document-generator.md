# Prompt 06 — Document Generator Suite

## Identity

| Field | Value |
|-------|-------|
| **Name** | Document Generator Suite |
| **Tagline** | "Legal documents. Your country. Five minutes." |
| **Path** | `/tools/doc-generator/` |
| **CSS prefix** | `dg-` |
| **Accent color** | Green `#059669` / dark `#065F46` / pale `#ECFDF5` |
| **Engine** | `engines/doc-generator-engine.js` |
| **AI advisor key** | `"doc-generator"` in TOOL_CONTEXT |
| **Supabase tables** | `dg_generated_docs`, `dg_doc_templates`, `dg_company_profiles` |
| **Netlify function** | `netlify/functions/afrowork-docs.js` |

---

## Why This Exists

Most African SMEs have no written employment contracts. A study by the ILO found that over 60% of African workers in the formal sector have never received a written employment contract. This creates:
- Disputes about notice periods
- Disputes about salary increments
- Disputes about leave entitlements
- Employers unable to discipline or terminate because there's no documented policy

The Document Generator creates legally compliant employment documents for any African country in under 5 minutes. Free for basic documents. Premium PDF with company branding for regular users.

---

## Document Types

| Document | Countries Covered | Key Legal Requirements Embedded |
|----------|-------------------|----------------------------------|
| Employment Contract | All 54 | Duration, pay, hours, notice, leave, pension, NDA |
| Offer Letter | All 54 | Salary, start date, role, contingencies |
| Termination Letter | All 54 | Notice period, reasons, final pay obligations |
| Retrenchment Letter | NG, KE, ZA, GH, TZ + 10 more | Consultation, severance, UIF notice |
| Warning Letter (Written) | All 54 | Progressive discipline compliance |
| Final Warning Letter | All 54 | Before dismissal — procedural fairness |
| Disciplinary Hearing Notice | ZA, KE, NG, GH + 15 more | Right to representation, charges, date |
| Leave Approval Form | All 54 | Leave type, dates, approver signature |
| Leave Policy Document | All 54 | Annual, sick, maternity, paternity, TOIL |
| Salary Review Letter | All 54 | New salary, effective date, sign-off |
| NDA / Confidentiality Agreement | All 54 | Mutual or one-way, duration, scope |
| Restraint of Trade | ZA, NG, KE | Area, duration, compensation |
| Payslip (cross-reference) | → links to Payslip Generator | |

---

## Country-Specific Legal Requirements Embedded

Each document template is aware of mandatory clauses per country:

**Nigeria (Labour Act Cap L1 + NMW Act 2019):**
- Employment contract must include: commencement date, nature of work, rate of wages, hours of work, notice period
- Minimum notice: 1 day (< 3 months), 1 week (3 months–2 years), 1 month (2–5 years), 2 months (5+ years)
- Termination must state reason if for cause
- Pension: 8% employee + 10% employer must be stated

**Kenya (Employment Act 2007):**
- Written contract required for all employment > 3 months
- Must include: job description, pay, working hours, overtime, leave entitlements, grievance procedure
- Max probation: 6 months (s.42)
- Disciplinary: must follow fair procedure (hearing, representation, appeal)
- Retrenchment: 1 month notice minimum + 15 days per year severance

**South Africa (BCEA 75/1997 + LRA 66/1995):**
- Particulars of employment (s.29 BCEA): employer name, address, job description, working hours, pay, overtime rate, leave entitlements, notice period
- Notice periods: < 6 months = 1 week; 6m–1yr = 2 weeks; 1yr+ = 4 weeks
- Retrenchment: s.189 consultation process mandatory (10+ employees: public consultation)
- Disciplinary: CCMA Code of Good Practice procedural requirements
- Probation: no statutory max, but 3-6 months typical; LRA applies after 3 months

**Ghana (Labour Act 2003 Act 651):**
- Contract must state: job title, duration if fixed-term, salary, hours, leave, notice
- Notice: < 3 years = 1 week; 3–5 years = 2 weeks; > 5 years = 1 month
- Termination without notice requires payment in lieu

---

## Pages & Views

### Landing Page (`index.html`)

- Hero: green accent
- Headline: "Employment documents for any African country — legally compliant, in minutes"
- Document type cards: 10 document types, each with icon + name + "who uses this" + "Generate free →"
- Trust indicators: "Aligned with [Employment Act / Labour Code] for each country"
- "How it works": Pick document → Fill in the blanks → Download PDF
- FAQ: accuracy, legal disclaimer, customization, signature support

### Document Selector (`index.html` — same page, below hero)

Grid of document type cards:
```
📋 Employment Contract    📨 Offer Letter
🚪 Termination Letter     📉 Retrenchment Letter
⚠️ Warning Letter         🔴 Final Warning
📣 Disciplinary Notice    🌴 Leave Approval
💰 Salary Review Letter   🤫 NDA / Confidentiality
```

Each card: icon + name + 1-line description + "Generate →" button

### Document Generation Flow (`generate.html?type={doctype}`)

Multi-step form, context-aware per document type:

**Step 1 — Country** (always first)
- Country selector — determines which legal clauses are embedded
- "This document will comply with [Kenya Employment Act 2007]" confirmation

**Step 2 — Parties** (always second)
- Employer: Company name, registration number (optional), address, represented by (name + title)
- Employee: Full name, ID number (optional), job title

**Step 3 — Document-Specific Fields**

For Employment Contract:
- Start date | Contract type (permanent / fixed-term / probationary)
- Department | Reporting to
- Monthly salary | Currency | Pay frequency
- Normal working hours | Days per week
- Probation period (auto-suggested based on country)
- Notice period (auto-populated from country law, editable to increase)
- Annual leave days (auto-populated from country minimum, editable to increase)
- Sick leave days (auto-populated)
- Pension: employee % + employer % (auto-populated)
- Additional clauses: remote work? Confidentiality? Restraint of trade?

For Termination Letter:
- Termination type: Resignation accepted | Dismissal (with cause) | Retrenchment | End of contract | Ill health
- Last day of employment
- Notice period / payment in lieu
- Outstanding leave to be paid: yes/no + days
- Final pay date
- Return of company property: list items
- Reference: yes/no (conditional on dismissal type)

For Warning Letter:
- Incident date | Description of misconduct
- Previous warnings? Yes/No (if yes: verbal/written/final)
- Required improvement: specific, measurable
- Consequence of non-improvement (next warning level or dismissal)
- Response deadline

**Step 4 — Preview**
- Full document preview (HTML render, formatted)
- "Edit" buttons inline for any section
- Estimated reading time: X minutes (for employee)
- Legal clause explanations: hover/tap any clause → plain-language explanation

**Step 5 — Download**
- Download as PDF button (free, watermarked with "Generated by AfroTools")
- Premium: Remove watermark, add company logo, save to vault → requires AfroTools account
- "Email to employee" option → enter email → Resend API sends PDF
- "Save to vault" → stored in `dg_generated_docs` Supabase table

---

## PDF Generation

PDF generated server-side via Netlify function using a headless approach:

```javascript
// netlify/functions/afrowork-docs.js
// POST /api/docs/generate
// Body: { docType, country, parties, fields, template }
// Returns: PDF binary (Content-Type: application/pdf)

// Implementation: use html-pdf-node or puppeteer (headless Chrome) to render
// HTML template → PDF with proper A4 formatting, margins, headers/footers

// Template variables: Handlebars-style {{employer_name}}, {{start_date}}, etc.
// Country-specific clauses injected as includes based on country_code + doc_type
```

---

## Company Profile (saved for repeat use)

For logged-in users, company profile is saved in `dg_company_profiles`:
- Company name, registration number, address
- Primary country, default currency
- Logo (uploaded, stored in Supabase Storage)
- HR contact name + title

On subsequent document generation, company fields auto-populate from profile. This is the "recurring template vault" feature — employers don't re-enter company details for every document.

---

## AI Integration

```javascript
"doc-generator": {
  name: "Document Generator Suite — African Employment Documents",
  systemPrompt: `You are an African employment law document specialist. You help users understand what employment documents are required, what clauses they must contain, and how to complete them correctly for each African country.

Your role:
- Explain what each document type is for and when to use it
- Tell users which fields are legally mandatory vs. optional for their country
- Explain specific clauses in plain language ("What does 'garden leave' mean in this contract?")
- Warn about common mistakes ("In South Africa, you cannot issue a final warning without a prior written warning — this makes dismissal procedurally unfair")
- Guide users on signature requirements: does it need to be witnessed? Notarized? Emailed is fine?
- Explain what happens if a document is missing required clauses (it may be unenforceable)
- Help users customize clauses beyond the defaults

For termination specifically:
- Walk through the legally required process step by step
- Warn about unfair dismissal traps (South Africa especially: CCMA procedure)
- Calculate what the employee is owed alongside the letter

For contracts:
- Explain which clauses protect the employer vs. the employee
- Help balance: "This non-compete is too broad — courts in Nigeria would not enforce a 5-year, nationwide restriction"

Always be specific to the country. What applies in South Africa (BCEA) does not apply in Nigeria (Labour Act).`,
  exampleQueries: [
    "What must be in an employment contract in Kenya?",
    "Can I terminate a Nigerian employee with 1 week notice after 6 years?",
    "What warnings must I give before dismissing someone in South Africa?",
    "Is an NDA enforceable in Ghana?",
    "How do I write a retrenchment letter that's legally compliant in Kenya?"
  ]
}
```

---

## Document Vault (Supabase)

```sql
create table dg_generated_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  doc_type text not null,
  country_code text not null,
  title text,                -- "Employment Contract — John Doe — March 2026"
  fields jsonb,              -- all inputs used to generate
  pdf_path text,             -- Supabase Storage path
  watermarked boolean default true,
  shared_with text[],        -- array of emails (if sent)
  signed boolean default false,
  signed_at timestamptz,
  created_at timestamptz default now()
);

create table dg_company_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  company_name text not null,
  registration_number text,
  address text,
  country_code text,
  currency text,
  logo_path text,            -- Supabase Storage
  hr_contact_name text,
  hr_contact_title text,
  created_at timestamptz default now()
);
```

---

## Cross-Tool Integration

- **AfroPayroll OS**: Generate offer letter (new hire journey) and termination letter (offboarding journey) directly from workflow
- **Leave Calculator**: Leave entitlements from Leave Calculator pre-fill the leave clauses in Employment Contract
- **Payslip Generator**: Salary from generated contract can pre-fill payslip generator
- **Labour Law Advisor**: "Should I add a restraint of trade?" → Labour Law Advisor answers, then links back to Document Generator
- **Regulatory Alerts**: When Employment Act is amended (e.g., Kenya new leave rules), alert generated documents in vault that may need updating

---

## Legal Disclaimer (required on every page and PDF)

> "Documents generated by AfroTools are templates based on statutory minimum requirements and general legal principles for the selected country. They do not constitute legal advice. For complex employment situations, mergers, executive contracts, or any dispute-related document, consult a qualified labour attorney in the relevant jurisdiction. AfroTools is not liable for the legal enforceability of generated documents in any specific situation."

---

## Mobile UX

- Document type selection: scrollable horizontal card row on mobile
- Form: one field per screen on mobile (wizard-style, like the creator tools)
- Preview: pinch-to-zoom on mobile, full-screen toggle
- Download: saves to Files/Downloads on mobile natively
- "Email to employee" is primary CTA on mobile (sharing PDF via email is easier than downloading on phones)
- Company profile: saved so employer never re-enters their details after first use
