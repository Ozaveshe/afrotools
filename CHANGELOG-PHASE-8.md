# CHANGELOG - Phase 8: UX Polish & Interactions

**Date:** March 2026
**Goal:** Make every interaction feel premium — like a Stripe or Linear product.

---

## New Files Created

### `/assets/js/lib/interactions.js`
Premium UX interaction library (`AfroTools.ux`):

- **`animateNumber(el, start, end, opts)`** — Animated number counter using `requestAnimationFrame` with ease-out cubic easing. Duration 600ms default. Supports currency prefix, decimal places, comma formatting. Respects `prefers-reduced-motion`.

- **`debounce(fn, delay)`** — Standard debounce (300ms default). Use for auto-calculate on input.

- **`throttle(fn, limit)`** — Standard throttle (100ms default). Use for scroll/resize handlers.

- **`formatOnBlur(input, currencyCode)`** — Formats input value with commas on blur, strips formatting on focus + selects all text. Enables clean numeric input UX.

- **`syncSliderInput(slider, input, opts)`** — Two-way sync between range slider and text input. Debounced input → slider update (300ms). Respects slider min/max bounds.

- **`revealResults(container, childSelector)`** — Staggered slide-up + fade-in animation for result items. 50ms delay between items. Respects reduced motion.

- **`copyFeedback(button, text)`** — Copy to clipboard with visual checkmark feedback. Button shows green checkmark SVG for 1.5s then reverts. Fallback textarea method for older browsers. Triggers haptic.

- **`haptic(style)`** — Haptic feedback via `navigator.vibrate()`. Default light vibration (10ms), 'heavy' option (20-10-20ms pattern).

- **`pressEffect(selector)`** — Global button press effect (scale 0.98 on mousedown). Auto-initialized for all `button, .btn, [role="button"]` elements.

- **`announceResult(message)`** — Screen reader announcement for calculation results. Uses `AfroTools.a11y.announce()` if available, falls back to inline live region.

### `/assets/js/lib/dark-mode.js`
Manual dark mode toggle with localStorage persistence (`AfroTools.darkMode`):

- **`toggle()`** — Switch between dark and light
- **`set('dark' | 'light' | 'auto')`** — Set specific theme
- **`get()`** — Get current theme preference
- **`isDark()`** — Boolean check (considers stored + system preference)
- **CSS integration:** Sets `data-theme="dark|light"` on `<html>` element
- **System tracking:** Listens for `prefers-color-scheme` changes when in 'auto' mode
- **Event dispatch:** `afrotools:theme-change` custom event for components to react
- **Storage:** Uses `aft_theme` localStorage key

---

## Design Decisions

### Reduced Motion Support
All animations check `prefers-reduced-motion: reduce` and skip to final state:
- `animateNumber()` → sets value instantly
- `revealResults()` → shows content with no animation
- Skeleton shimmer → static background (via skeleton.css)

### Haptic Feedback
Used sparingly on copy actions and key interactions. Gracefully ignored on desktop browsers where `navigator.vibrate` is unavailable.

### Button Press Effect
Global press effect (scale 0.98) is auto-initialized and works on all buttons. This subtle micro-interaction gives tactile feedback without requiring per-button CSS.

### Dark Mode Architecture
Three-tier approach:
1. `prefers-color-scheme: dark` — automatic from OS (already in design-system.css)
2. `[data-theme="dark"]` — manual override via JS toggle (new)
3. Components listen for `afrotools:theme-change` event to adapt (new)

---

## Usage Examples

### Animated calculation results
```js
var resultEl = document.getElementById('net-salary');
AfroTools.ux.animateNumber(resultEl, 0, 3500000, {
  prefix: '₦', format: true, duration: 600
});
```

### Auto-calculating debounced input
```js
var input = document.getElementById('salary');
AfroTools.ux.formatOnBlur(input);
input.addEventListener('input', AfroTools.ux.debounce(function() {
  calculate();
}, 300));
```

### Staggered result reveal
```js
AfroTools.ux.revealResults(document.querySelector('.results-section'));
```

### Copy to clipboard with feedback
```js
copyBtn.addEventListener('click', function() {
  AfroTools.ux.copyFeedback(this, 'Net salary: ₦3,500,000');
});
```
