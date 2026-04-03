# Prompt 06 — Payslip Generator (Upgrade Spec)

## Identity

| Field | Value |
|-------|-------|
| **Tool ID** | `payslip-generator` |
| **Name** | Payslip Generator |
| **Tagline** | "Professional payslips. Free. Any African country." |
| **Path** | `/tools/payslip-generator/` |
| **CSS prefix** | `ps-` |
| **Accent color** | Teal `#0D9488` / dark `#0F766E` / pale `#F0FDFA` |
| **Engine** | `engines/payslip-engine.js` |
| **AI advisor key** | `"payslip-generator"` in TOOL_CONTEXT |
| **Supabase tables** | `ps_payslips`, `ps_company_profiles`, `ps_employee_roster` |
| **Netlify function** | `netlify/functions/payslip-pdf.js` |

---

## Current State
6 countries (Nigeria, Kenya, South Africa, Ghana, Tanzania, Uganda). Automatic PAYE/pension/social security. 3 PDF templates (Corporate, Modern, Classic). Save to vault. A4 print-ready.

## What's Missing (full upgrade list)

---

## Feature Upgrades

### 1. Expand to All 54 Countries
This is the #1 expansion. Every African employee deserves a payslip. Priority order after existing 6:
- Ethiopia, Rwanda, Cameroon, Côte d'Ivoire, Senegal (next 5)
- Morocco, Egypt, Algeria, Tunisia (North Africa)
- Remaining 39 countries

Each country needs: correct PAYE calculation, correct pension/social security deduction, correct contribution rates, currency and number formatting.

### 2. Batch Payslip Generation
Upload a CSV: `Name, ID, Department, Role, Basic, Housing, Transport, Bonus, OT`. Get back a ZIP of individual PDFs. This is the feature that turns this into an SME payroll tool.

**UI:**
- "Single payslip" (current) | "Batch generate" toggle
- CSV upload zone (drag-and-drop)
- Column mapping: match CSV columns to payslip fields
- Preview: first 3 rows shown in table for confirmation
- "Generate [N] payslips" button
- Progress bar during generation
- ZIP download when complete
- Error log: "Row 14: salary field missing — skipped"

**Implementation:**
- Parse CSV client-side (PapaParse.js)
- Calculate deductions per employee using existing engine
- Send batch to Netlify function for PDF generation
- Return ZIP (JSZip.js or server-side)

### 3. Recurring Template Vault
Save company details + employee roster. Monthly: pick the period, adjust salary if changed, regenerate. No re-entering company registration number every month.

**Company Profile (auth-gated):**
- Company name, registration number, address
- Logo upload (stored in Supabase Storage)
- Primary country, default currency
- HR contact name + title

**Employee Roster:**
- List of employees with saved salary structures
- "Generate April 2026 payslips" → selects all employees → one click → batch PDF

**Schema:**
```sql
create table ps_company_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  company_name text not null,
  registration_number text,
  address text,
  country_code text not null,
  logo_path text,
  hr_contact_name text,
  created_at timestamptz default now()
);

create table ps_employee_roster (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references ps_company_profiles(id),
  employee_name text not null,
  employee_id text,
  job_title text,
  department text,
  basic_salary numeric not null,
  housing_allowance numeric default 0,
  transport_allowance numeric default 0,
  other_allowances jsonb,
  currency text,
  active boolean default true,
  created_at timestamptz default now()
);
```

### 4. WhatsApp / Email Delivery
Enter employee phone number → PDF sent via WhatsApp Business API or email. For companies with no printer or whose employees are remote/field-based.

**UI:**
- After generating: "Send to employee"
- Input: WhatsApp number or email
- WhatsApp: "Your April 2026 payslip from [Company] is attached. Net pay: ₦X"
- Email: plain subject "Your payslip — April 2026" + PDF attachment

### 5. Custom Deductions
Staff loans, canteen, uniform, advance recovery — universal in African workplaces, currently unsupported.

**UI:**
- "Add custom deduction" button (can add multiple)
- Each: Label + Amount + Type (loan repayment / other)
- Displays on payslip under deductions with custom label
- Recurring: can be saved to employee profile for auto-inclusion each month

### 6. Multi-Currency Payslip
Company pays in USD but employee is in Nigeria. Show USD gross + NGN equivalent at today's rate + NGN net.

**UI:**
- Toggle: "Pay in foreign currency"
- Base currency (USD/GBP/EUR) + Local currency (NGN/KES/etc.)
- Exchange rate input (or auto-fetched from AfroRates)
- Payslip shows: "Gross: $2,000 (₦3,200,000 at 1600 NGN/USD)"
- All deductions in local currency
- Net pay shown in both currencies

### 7. Annual Tax Certificate Generator
The year-end document employees need for personal tax filing. Nigeria: equivalent of P60. Kenya: P9A form. South Africa: IRP5. Massive unserved need.

**UI:**
- "Generate tax certificate" button (appears in December and January)
- Aggregates all 12 payslips from the vault
- Outputs: total gross, total PAYE paid, total pension, total allowances
- Formatted as: Kenya P9A | South Africa IRP5 | Nigeria Tax Clearance-style summary
- PDF download + email to employee

**Implementation:**
- Requires payslip vault (saved payslips in Supabase)
- Aggregation function in payslip engine

### 8. Payslip Authentication QR Code
Each generated payslip gets a unique verification URL. Banks and landlords scan the QR to verify the payslip is real. This is a fraud-prevention feature that makes AfroTools payslips trusted documents.

**Implementation:**
- On PDF generation: assign a UUID
- Store: `ps_payslips` table with UUID + hash of key fields
- QR code on payslip links to: `afrotools.com/verify/{uuid}`
- Verification page shows: "This payslip for [Name] from [Company] for [Period] was generated on AfroTools and has not been altered. ✓"
- Banks/landlords can verify without needing to contact the employer

### 9. Housing Allowance Optimizer
"Restructuring your salary to maximize tax-free housing allowance for your PAYE band."

**UI:**
- "Optimize my salary structure" button
- Tool calculates optimal basic/housing/transport split for minimum PAYE
- Shows: "Current PAYE: NGN 38,000. Optimized structure saves NGN 5,200/month"
- Option: "Use optimized structure" → auto-restructures the payslip

### 10. Leave Balance on Payslip
One line. Huge employee clarity.

**UI:**
- "Include leave balance" toggle
- Shows on payslip: "Annual leave balance: 12 days remaining"
- Data comes from leave tracker (if user has it) or manual input

---

## AI System Prompt Upgrade

```javascript
"payslip-generator": {
  name: "Payslip Generator — African Countries",
  systemPrompt: `You are an African payroll and payslip compliance expert. You help employers generate accurate, legally compliant payslips for all African countries.

Your role:
- Confirm correct PAYE, pension, and social security deductions for each country
- Explain what each deduction line on the payslip means and why it's there
- Advise on salary structure optimization (housing allowance, transport allowance split)
- Help with year-end tax certificates: what's required per country
- Explain batch payroll processing: CSV format, deduction logic
- Guide on custom deductions: which are legally permitted, how to document
- Advise on multi-currency payroll: FX rates, reporting requirements
- Help verify payslip authenticity: what to look for in a genuine payslip
- Explain the difference between gross salary, net salary, and total cost to employer

For each country, know:
- Which allowances are tax-exempt and up to what amount
- Pension employee and employer rates
- All statutory deductions and their order of precedence
- Year-end tax certificate requirements (IRP5, P9A, Nigeria equivalent)`
}
```

---

## Cross-Tool Integration
- **PAYE calculators** (all country tools): Feeds the PAYE calculation engine
- **Social Security**: Social security rates power deduction lines
- **Staff Cost**: Employer contributions on payslip → total cost view
- **Leave Calculator**: Leave balance shown on payslip
- **Document Generator**: "Generate an employment contract for this employee"
- **AfroPayroll OS**: Step 4 of New Hire journey (Generate First Payslip)
- **WhatsApp Bot**: Can trigger payslip delivery notification
