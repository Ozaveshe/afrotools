# Adding a New Country to AfroTools

## What You Need

1. A PAYE calculation engine
2. A country hub page
3. A PAYE calculator page
4. Registry entries
5. AI advisor context (for Tier 1)

---

## Step 1: Create the PAYE Engine

File: `/assets/js/engines/{cc}-paye.js`

Where `{cc}` is the ISO 3166-1 alpha-2 country code (lowercase).

**Required exports:**
- `calculate(grossIncome, opts)` — pure function returning tax breakdown
- `validate(grossIncome)` — input validation
- `reverseCalc(desiredNet, opts)` — net-to-gross calculation
- Tax band constants (e.g., `TAX_BANDS`)
- Social security rate constants

**See existing engines for patterns:**
- `ng-paye.js` — annual gross, dual regime support
- `ke-paye.js` — monthly gross, multiple social security deductions
- `tz-paye.js` — monthly gross, private/public sector

---

## Step 2: Create the Country Hub Page

File: `/{country-slug}/index.html`

The country hub shows:
- Country overview (flag, key facts)
- Quick tax reference table
- Tool listing via `renderToolGrid('tool-grid', 'XX')` or `<afro-country-tools country="XX">`
- "What Changed" section for current tax year

Use the registry-ready pattern:
```js
function _initXxHub() {
  if (typeof renderToolGrid === 'function') {
    renderToolGrid('tool-grid', 'XX');
  }
  if (typeof getToolsFor === 'function') {
    var tools = getToolsFor('XX', 'live').concat(getToolsFor('XX', 'new'));
    var el = document.getElementById('tool-count');
    if (el) el.textContent = tools.length + ' live tools';
  }
}
if (typeof onRegistryReady === 'function') { onRegistryReady(_initXxHub); }
else { document.addEventListener('DOMContentLoaded', function() { ... }); }
```

---

## Step 3: Create the PAYE Calculator Page

File: `/{country-slug}/xx-paye.html`

Include:
- Salary input (with `AfroTools.ux.formatOnBlur()`)
- Toggle switches for deductions (pension, social security, etc.)
- Results section with breakdown table
- Chart visualization (Chart.js)
- AI advisor panel (for Tier 1 tools)
- PDF download button
- FAQ section with `<afro-faq>`

---

## Step 4: Add Registry Entries

In `/assets/js/components/tool-registry.js`:

```js
// PAYE Calculator
{ id: 'xx-paye', name: '{Country} PAYE Calculator', icon: '🇽🇽',
  desc: '{Authority} tax bands, social security. AI advisor + PDF.',
  href: '/{country-slug}/xx-paye',
  category: 'financial', tier: 'T1', status: 'live', phase: 'LIVE',
  countries: ['XX'], revenue: 'Premium PDF',
  estTraffic: 3000, estRevenue: 90, priority: 80 },
```

Also add any country-specific VAT calculators, withholding tax tools, etc.

---

## Step 5: Add AI Advisor Context (Tier 1 only)

In `/netlify/functions/ai-advisor.js`, add to the `TOOL_CONTEXT` object:

```js
"xx-paye": "{Country} PAYE expert. {Authority} {N}-band tax: {rate details}. {Social security details}. {Key deduction rules}.",
```

Keep context under 300 words — specific tax rates and rules.

---

## Step 6: Add Tests

File: `/tests/engines/xx-paye.test.js`

Test cases:
- Zero salary → 0 tax
- Below tax-free threshold → 0 tax
- Median salary → verify exact deductions and tax
- High earner → verify top bracket
- Social security caps
- Reverse calc round-trip
- Edge cases (bracket boundaries)
- Input validation

---

## Step 7: Update Supporting Files

```bash
# Regenerate sitemap
node scripts/generate-sitemap.js

# Validate registry
node scripts/validate-registry.js

# Run all tests
node tests/run.js
```

Add the country's tax authority to `/docs/tax-sources.md`.

---

## Checklist

- [ ] PAYE engine created with calculate/validate/reverseCalc
- [ ] Tax bands documented with legislation reference
- [ ] Country hub page created
- [ ] PAYE calculator page created
- [ ] Registry entries added
- [ ] AI advisor context added (Tier 1)
- [ ] Tests written and all passing
- [ ] Sitemap regenerated
- [ ] Tax sources documented
