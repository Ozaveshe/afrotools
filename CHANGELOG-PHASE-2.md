# CHANGELOG - Phase 2: Shared JavaScript Architecture

**Date:** March 2026
**Goal:** Eliminate code duplication. Create a modular utility library that every tool imports.

---

## New Files Created

### `/assets/js/lib/currency.js`
Comprehensive currency formatting for all 54 African countries plus major international currencies:
- **`AfroTools.currency.format(code, amount, opts)`** - Format any currency: `format('NGN', 3500000)` -> `'₦3,500,000'`
- **`AfroTools.currency.symbol(code)`** - Get currency symbol
- **`AfroTools.currency.name(code)`** - Get currency full name
- **`AfroTools.currency.decimals(code)`** - Get decimal places
- **`AfroTools.currency.fromCountry(countryCode)`** - Resolve country to currency
- **`AfroTools.currency.list(region)`** - List all currencies, optionally filtered
- **`CURRENCIES` database** - 54 African + 11 international currencies with symbol, name, decimals, locale, spacing
- **`CFA_MAP`** - Maps CFA zone countries to XOF/XAF

### `/assets/js/lib/formatters.js`
Number, percentage, date, and utility formatting:
- **`AfroTools.fmt.number(n, decimals)`** - Thousand-separated numbers
- **`AfroTools.fmt.percent(n, decimals, isRatio)`** - Percentage formatting
- **`AfroTools.fmt.compact(n)`** - Compact notation (1.5M, 2.3K)
- **`AfroTools.fmt.date(date, locale, opts)`** - Locale-aware date formatting
- **`AfroTools.fmt.dateShort(date)`** - Short date: '15 Mar 2026'
- **`AfroTools.fmt.dateISO(date)`** - ISO format: '2026-03-15'
- **`AfroTools.fmt.timeAgo(date)`** - Relative time: '2 days ago'
- **`AfroTools.fmt.ordinal(n)`** - Ordinal numbers: '1st', '2nd'
- **`AfroTools.fmt.duration(seconds)`** - Human duration: '1h 30m'
- **`AfroTools.fmt.fileSize(bytes)`** - File sizes: '1.5 MB'
- **`AfroTools.fmt.parseNum(str)`** - Parse formatted strings back to numbers
- **`AfroTools.fmt.clamp(n, min, max)`** - Clamp value
- **`AfroTools.fmt.round(n, decimals)`** - Safe rounding

### `/assets/js/lib/validators.js`
Input validation for all calculator tools:
- **`AfroTools.validate.salary(value, currency)`** - Currency-aware salary validation with limits
- **`AfroTools.validate.range(value, min, max, fieldName)`** - Range validation with clamping
- **`AfroTools.validate.required(value, fieldName)`** - Required field check
- **`AfroTools.validate.email(email)`** - Email validation
- **`AfroTools.validate.phone(phone)`** - International phone validation
- **`AfroTools.validate.percentage(value)`** - 0-100 range check
- **`AfroTools.validate.date(date, opts)`** - Date validation with min/max
- **`AfroTools.validate.sanitize(str)`** - XSS-safe HTML escaping
- **`AfroTools.validate.showError(input, message)`** - Inline error display with ARIA
- **`AfroTools.validate.clearError(input)`** - Clear inline error

### `/assets/js/lib/analytics.js`
GA4 custom event tracking with event queuing:
- **`AfroTools.analytics.trackCalculation(toolId, country, value, currency)`** - With salary bucketing
- **`AfroTools.analytics.trackPDFDownload(toolId, country)`**
- **`AfroTools.analytics.trackAIQuery(toolId, question, turnNumber)`**
- **`AfroTools.analytics.trackAITriggered(toolId)`**
- **`AfroTools.analytics.trackToolView(toolId, country)`**
- **`AfroTools.analytics.trackShare(toolId, method)`**
- **`AfroTools.analytics.trackFeature(feature, toolId)`**
- **`AfroTools.analytics.trackError(toolId, errorType, errorMessage)`**
- **`AfroTools.analytics.trackNewsletter(source)`**
- **`AfroTools.analytics.trackRateLimit(toolId)`**
- **`AfroTools.analytics.track(eventName, params)`** - Generic events
- **Event queue** - Events are queued if gtag hasn't loaded, then flushed (max 5min old)

### `/assets/js/lib/storage.js`
localStorage wrapper with TTL (time-to-live) and namespace:
- **`AfroTools.store.set(key, value, { ttl })`** - Store with optional expiry ('30m', '24h', '7d')
- **`AfroTools.store.get(key, defaultValue)`** - Retrieve (auto-expired entries return null)
- **`AfroTools.store.remove(key)`** - Delete
- **`AfroTools.store.has(key)`** - Existence check
- **`AfroTools.store.keys()`** - List all AfroTools keys
- **`AfroTools.store.clear()`** - Clear all AfroTools data
- **`AfroTools.store.usage()`** - Storage usage info
- **`AfroTools.store.push(key, item, opts)`** - Append to stored array
- **`AfroTools.store.increment(key, by, opts)`** - Atomic increment
- **Namespace prefix** `aft_` prevents collisions
- **Auto-cleanup** of expired entries on page load
- **QuotaExceededError** handling with automatic garbage collection

### `/assets/js/lib/a11y.js`
Accessibility utilities for keyboard navigation and screen readers:
- **`AfroTools.a11y.trapFocus(element, opts)`** - Keyboard focus trap for modals/drawers
- **`AfroTools.a11y.releaseFocus()`** - Release trap and restore previous focus
- **`AfroTools.a11y.announce(message, priority)`** - Screen reader announcements via live region
- **`AfroTools.a11y.onEscape(callback)`** - Global Escape key handler (stack-based)
- **`AfroTools.a11y.prefersReducedMotion()`** - Motion preference check
- **`AfroTools.a11y.prefersDarkMode()`** - Dark mode preference check
- **`AfroTools.a11y.roving(container, selector, opts)`** - Roving tabindex for tab groups/menus
- **`AfroTools.a11y.skipLink(targetId, label)`** - Skip-to-content link
- **`AfroTools.a11y.FOCUSABLE`** - CSS selector for all focusable elements

### `/assets/js/engines/ng-paye.js`
Nigeria PAYE pure calculation engine:
- **`AfroTools.engines.ngPAYE.calculate(gross, opts)`** - Supports PITA 2025 & NTA 2026
- **`AfroTools.engines.ngPAYE.validate(gross)`**
- **`AfroTools.engines.ngPAYE.reverseCalc(desiredNet, opts)`** - Net-to-gross
- Exports `PITA_BANDS`, `NTA_BANDS`, `PITA_EXEMPT_THRESHOLD`
- Options: regime, pension, nhf, nhis, lifeInsurance, homeLoanInterest, annualRent

### `/assets/js/engines/ke-paye.js`
Kenya PAYE pure calculation engine:
- **`AfroTools.engines.kePAYE.calculate(monthlyGross, opts)`**
- NSSF Tier I & II, SHIF, AHL, voluntary pension, PRMF
- Personal relief, insurance relief, mortgage relief
- Disability exemption (KES 150,000/mo)
- Exports `KES_BANDS`, `BAND_LABELS`, NSSF constants

### `/assets/js/engines/gh-paye.js`
Ghana PAYE pure calculation engine:
- **`AfroTools.engines.ghPAYE.calculate(annualGross, opts)`**
- SSNIT Tier 1, Tier 3 voluntary, marriage/child/disability/old age reliefs
- **`AfroTools.engines.ghPAYE.calcBonusTax(amount, isResident)`**
- **`AfroTools.engines.ghPAYE.optimizeTier3(gross, opts)`** - Find optimal Tier 3 contribution
- Exports `GH_BANDS`, SSNIT constants

### `/assets/js/engines/za-paye.js`
South Africa PAYE pure calculation engine:
- **`AfroTools.engines.zaPAYE.calculate(annualGross, opts)`**
- SARS 2025/26 bands, age-based rebates & thresholds
- Retirement deduction (27.5%, max R350,000), Medical Tax Credits, UIF
- **`AfroTools.engines.zaPAYE.optimizeRetirement(gross, opts)`**
- Exports `SARS_BANDS`, `REBATES`, `THRESHOLDS`

### `/assets/js/engines/eg-paye.js`
Egypt PAYE pure calculation engine:
- **`AfroTools.engines.egPAYE.calculate(annualGross, opts)`**
- Implements bracket exclusion (tiering) rule correctly
- NOSI (11%, capped), personal exemption, disability exemption
- Exports `ETA_BANDS`, `EXCLUSION_RULES`

### `/assets/js/engines/tz-paye.js`
Tanzania PAYE pure calculation engine:
- **`AfroTools.engines.tzPAYE.calculate(monthlyGross, opts)`**
- Monthly tax bands (TRA), NSSF/PSSSF for private/public sector
- Secondary employment flat 30% rate
- Exports `TRA_BANDS`, social security rate constants

---

## Files Updated

### `/assets/js/utils.js`
Refactored from monolithic utility file to backward-compatible thin layer:
- Legacy `AfroTools.fmt.ngn()`, `.kes()`, `.ghs()`, etc. now delegate to `AfroTools.currency.format()`
- Legacy `AfroTools.analytics.trackCalc()` delegates to new `AfroTools.analytics.trackCalculation()`
- Legacy `AfroTools.toast` falls back to `lib/toast.js` if loaded
- `AfroTools.i18n`, `AfroTools.reveal`, `AfroTools.ai`, `AfroTools.share` preserved as-is
- Header comment updated to document new lib module mappings

---

## Architecture Decision

### Module Pattern
All lib modules use the IIFE + `window.AfroTools.*` pattern for consistency with the existing codebase:
- No import/export statements (no build step required)
- Load order tolerant: each module creates `window.AfroTools` if missing
- `utils.js` merges with lib modules using `Object.assign` for backward compat

### Engine Design
Calculation engines are **pure functions** — they accept options objects and return result objects:
- No DOM access (`document.getElementById`, `isOn()`, etc.)
- No side effects (no GA4 tracking, no UI updates)
- Exported tax tables enable rendering band references without re-calculating
- Each engine exports `calculate()`, `validate()`, and `reverseCalc()`
- Tool pages can gradually adopt engines while keeping existing inline calculations

### Existing lib modules preserved
- `toast.js` - Already production-quality, no changes needed
- `share-state.js` - Already production-quality, no changes needed
- `pdf-template.js` - Already production-quality, no changes needed
- `calculate-animation.js` - Already production-quality, no changes needed

---

## Module Dependency Map

```
utils.js (compatibility layer)
  ├── delegates to: lib/currency.js
  ├── delegates to: lib/formatters.js
  ├── delegates to: lib/analytics.js
  └── falls back to: lib/toast.js

lib/currency.js      → AfroTools.currency
lib/formatters.js    → AfroTools.fmt
lib/validators.js    → AfroTools.validate
lib/analytics.js     → AfroTools.analytics
lib/storage.js       → AfroTools.store
lib/a11y.js          → AfroTools.a11y
lib/toast.js         → AfroTools.toast     (existing)
lib/share-state.js   → AfroTools.shareState (existing)
lib/pdf-template.js  → AfroTools.pdf       (existing)
lib/calculate-animation.js → AfroTools.anim (existing)

engines/ng-paye.js   → AfroTools.engines.ngPAYE
engines/ke-paye.js   → AfroTools.engines.kePAYE
engines/gh-paye.js   → AfroTools.engines.ghPAYE
engines/za-paye.js   → AfroTools.engines.zaPAYE
engines/eg-paye.js   → AfroTools.engines.egPAYE
engines/tz-paye.js   → AfroTools.engines.tzPAYE
```
