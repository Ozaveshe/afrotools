# Prompt 09: Shareable Result URLs

## Context

Read these files first:
- `assets/js/lib/share-state.js` (existing share state utility)
- `assets/js/components/share-result-button.js` (share button component — check the minified source)
- Any PAYE calculator page (e.g., `nigeria/ng-salary-tax.html`) to see input fields and calculate flow
- `docs/PLATFORM_STANDARDS.md` (naming conventions, RESULT variable, calculate function)

Currently when users share a calculation result, they share the tool URL without any state. The recipient sees an empty calculator. Results are not linkable.

## Objective

Make every calculation result shareable via URL. When a user calculates, the URL updates with encoded input parameters. Anyone opening that URL sees the same result automatically.

### URL Format

```
https://afrotools.com/nigeria/ng-salary-tax?g=500000&p=monthly&e=employed&pen=8
                                            │        │         │          │
                                            │        │         │          └── pension %
                                            │        │         └── employment type
                                            │        └── period
                                            └── gross salary
```

Use SHORT parameter names to keep URLs shareable (especially on WhatsApp which truncates long URLs):
- `g` = gross salary / primary input
- `p` = period (monthly/annual)
- `e` = employment type
- `pen` = pension rate
- `nhf` = NHF opt-in (1/0)
- `r` = tax regime (if applicable)
- Tool-specific params use 1-3 letter codes

### Behavior

1. **On calculate**: Update URL via `history.replaceState()` (no page reload, no new history entry)
2. **On page load**: Check URL params → if present, populate inputs and auto-calculate
3. **On share**: Copy the current URL (which already contains state)
4. **Social preview**: When shared on WhatsApp/Twitter, the OG tags show generic tool info (URL params don't affect server-rendered meta tags)

## Constraints

- Use `history.replaceState()`, NOT `history.pushState()` — don't pollute browser history
- Keep URLs under 200 characters (WhatsApp truncation threshold)
- Only encode INPUT parameters, not output values (results are recalculated from inputs)
- URL params are the source of truth on load: if params exist, they override default values
- Encode numeric values as-is (no formatting): `g=500000` not `g=500,000`
- Boolean params: use `1`/`0` not `true`/`false`
- Follow IIFE pattern
- Must work with the existing `calculate()` function — hook into it, don't replace it
- The share button component must use `window.location.href` (which now includes state) when copying/sharing
- Do NOT break direct-linking to tools without params (empty calculator must still work)
- Sanitize all URL params on load: validate types, clamp ranges, reject injection attempts

## Implementation Steps

1. Create `assets/js/lib/url-state.js`:
   ```js
   AfroTools.urlState = {
     // Encode current inputs to URL params
     encode(params) {
       const url = new URL(window.location);
       Object.entries(params).forEach(([k, v]) => {
         if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v);
       });
       history.replaceState(null, '', url);
     },
     // Decode URL params to input values
     decode(schema) {
       const params = new URLSearchParams(window.location.search);
       const result = {};
       for (const [key, config] of Object.entries(schema)) {
         const raw = params.get(key);
         if (raw === null) continue;
         // Validate and cast based on schema type
         if (config.type === 'number') result[key] = clamp(Number(raw), config.min, config.max);
         if (config.type === 'enum') result[key] = config.values.includes(raw) ? raw : config.default;
         if (config.type === 'boolean') result[key] = raw === '1';
       }
       return result;
     },
     // Check if URL has state params
     hasState() {
       return window.location.search.length > 1;
     },
     // Clear state from URL
     clear() {
       history.replaceState(null, '', window.location.pathname);
     }
   };
   ```

2. Define param schemas per tool. Add to each tool's page JS:
   ```js
   const URL_SCHEMA = {
     g: { type: 'number', min: 0, max: 999999999, field: 'gross-salary' },
     p: { type: 'enum', values: ['monthly', 'annual'], default: 'monthly', field: 'period' },
     e: { type: 'enum', values: ['employed', 'self-employed'], default: 'employed', field: 'employment-type' },
     pen: { type: 'number', min: 0, max: 100, field: 'pension-rate' }
   };
   ```

3. Hook into `calculate()`:
   - After calculation completes, call `AfroTools.urlState.encode(currentInputs)`
   - Map input field values to short param names

4. Hook into page load:
   - In DOMContentLoaded, check `AfroTools.urlState.hasState()`
   - If true, decode params, populate input fields, auto-trigger `calculate()`
   - Show subtle toast: "Viewing shared calculation"

5. Update share button to use `window.location.href` directly (should already work if URL contains state)

6. Run `npm run minify`

## Verification

- Open PAYE calculator → enter ₦500,000 monthly → calculate
- URL should update to `?g=500000&p=monthly&e=employed`
- Copy URL → open in incognito window → calculator should auto-populate and show results
- Share via WhatsApp → recipient opens link → sees same calculation
- Test with invalid params (`?g=abc`) → should gracefully fallback to defaults
- Test with no params → empty calculator, no errors
- Browser back button should NOT create extra history entries
- URL should stay under 200 characters for typical calculations
