# Prompt 10: Cross-Tool Data Prefill

## Context

Read these files first:
- `assets/js/lib/storage.js` (AfroTools.store — localStorage with TTL)
- `docs/PLATFORM_STANDARDS.md` (RESULT variable, calculate function)
- `assets/js/components/tool-registry.js` (tool catalog)
- Any two related tool pages to understand their input fields

After Prompt 09 (Shareable Result URLs), URL params enable prefill for shared links. This prompt builds on that to enable **cross-tool session memory** — when a user navigates between tools within a single session, their data carries forward automatically.

## Objective

Create a lightweight session context that remembers key financial data points across tool navigation. When a user enters their salary in the PAYE calculator, the loan calculator already knows their income. When they enter their country, every subsequent tool defaults to that country.

### Session Context Object

```js
AfroTools.context = {
  // User's financial profile (built up across tool interactions)
  country_code: 'NG',
  currency: 'NGN',
  gross_salary_annual: 6000000,
  net_salary_monthly: 380000,
  employment_type: 'employed',
  tax_rate_effective: 0.15,
  vat_rate: 7.5,
  pension_rate: 8,

  // Methods
  set(key, value),          // Update a context value
  get(key),                 // Get a context value
  getAll(),                 // Get full context object
  clear(),                  // Reset context
  applyToForm(fieldMap),    // Auto-populate form fields from context
};
```

### How It Works

1. **PAYE Calculator** → User enters gross salary ₦500K/month, Nigeria → After calculation:
   - Context stores: `country_code=NG`, `currency=NGN`, `gross_salary_annual=6000000`, `net_salary_monthly=380000`

2. **User navigates to Loan Calculator** → On page load:
   - Check context: `net_salary_monthly` exists → pre-fill "Monthly Income" field with ₦380,000
   - Show subtle note: "Income pre-filled from your salary calculation"

3. **User navigates to Budget Planner** → On page load:
   - Check context: `net_salary_monthly` exists → pre-fill income field
   - Check context: `country_code=NG` → auto-select Nigeria

### Field Mapping Per Tool

Each tool declares which context fields it can consume:

```js
// On Loan Calculator page:
const CONTEXT_MAP = {
  'monthly-income': 'net_salary_monthly',
  'country-select': 'country_code',
};
```

## Constraints

- Store context in `sessionStorage` (dies with tab close, not persistent across sessions)
- Max 15 key-value pairs in context (keep it lightweight)
- Context values are SUGGESTIONS, not mandates — user can always override
- Show a dismissible note when auto-populating: "Pre-filled from your [Tool Name] calculation" with "Clear" link
- Follow IIFE pattern, expose as `window.AfroTools.context`
- Do NOT auto-calculate on prefill from context — wait for user to click Calculate (unlike URL prefill which auto-calculates, since that's an explicit share)
- If user changes a pre-filled value, update the context with the new value
- Context writes happen in `calculate()` — after successful calculation, write relevant outputs to context
- Country and currency context should persist even across different tool categories
- Numeric values stored as raw numbers (no formatting)

## Implementation Steps

1. Create `assets/js/lib/session-context.js`:
   - IIFE exposing `AfroTools.context`
   - Reads/writes to `sessionStorage` key `afro_context`
   - `set(key, value)` — validates key against allowed keys list
   - `get(key)` — returns value or null
   - `applyToForm(fieldMap)` — takes `{ fieldId: contextKey }`, populates fields, shows note
   - `updateFromResult(toolSlug, result)` — extracts relevant data from RESULT based on tool type
2. Define standard context keys (keep this list tight):
   ```
   country_code, currency, gross_salary_annual, gross_salary_monthly,
   net_salary_annual, net_salary_monthly, employment_type, tax_rate_effective,
   pension_rate, vat_rate, business_revenue_monthly, loan_amount,
   investment_amount, exchange_rate_usd
   ```
3. Add context writes to each tool's `calculate()` function:
   - After RESULT is populated, call `AfroTools.context.updateFromResult(toolSlug, RESULT)`
4. Add context reads to each tool's page load:
   - Check if context has relevant data for this tool
   - If yes, call `AfroTools.context.applyToForm(CONTEXT_MAP)` to pre-fill inputs
   - Show note banner (reuse toast component or inline banner)
5. Run `npm run minify`

## Verification

- Open PAYE calculator → enter salary → calculate
- Navigate to Loan Calculator → income field should be pre-filled
- Change the income on Loan Calculator → context should update
- Navigate to Budget Planner → should show updated income
- Close tab → reopen → context should be empty (sessionStorage cleared)
- Pre-filled fields should show the note banner
- Click "Clear" on banner → fields should reset to defaults
- Verify no context data leaks to localStorage or cookies
