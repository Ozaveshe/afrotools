# Scientific Calculator — Upside-100 Audit

- **Tool:** Scientific Calculator
- **Live:** https://afrotools.com/tools/scientific-calc/
- **Source:** `C:/Users/Oza/Documents/afrotools/tools/scientific-calc/index.html`
- **Category:** Education
- **Audited:** 2026-07-13

## One-line
Browser-side scientific calculator (trig, log/ln, powers, roots, factorial, `pi`/`e`, DEG/RAD, memory M+/M-/MR/MC, session history, export) built as a self-contained inline HTML/JS page.

## CRITICAL: Does input actually work? YES — audit flag is a FALSE POSITIVE
The audit flag "weak input surface / no input path / missing formControls" is **wrong**. The calculator is fully functional:
- **Keypad:** ~45 buttons, each wired via `onclick` handlers (`addText`, `addFunc`, `calcEvaluate`, etc.). Confirmed present in rendered live HTML.
- **Physical keyboard:** global `keydown` listener (lines 794–810) handles `0-9 . + - * / ^ ( )`, Enter/`=`, Escape (clear), Backspace (delete), `p` (pi), `!`, `%`.
- The flag fires because the page uses **buttons + a global key listener, not `<form>`/`<input>` elements**, so any automated "formControls" heuristic sees zero inputs. Nothing is broken — no code change needed for input. Recommend: reclassify this flag as a scanner artifact for all keypad-style tools.

## Real functional bugs / red flags (from reading the JS)
1. **Nested parentheses inside trig break (real correctness bug).** Trig rewrites use `sin\(([^)]+)\)` (lines 602–607). `[^)]+` stops at the first `)`, so `sin(2*(3+1))` or `sin((30))` mis-parse or throw. Only flat single-paren arguments evaluate correctly. This is the single most important defect.
2. **`10^x` pow-rewrite is dead code (benign).** Line 587 converts `^`→`**` *before* line 596 tries to match literal `10^(`, so `Math.pow(10,` is never applied. Result is still correct because `10**(...)` is valid JS, but the rewrite line is unreachable.
3. **`mod` = JS `%` remainder, not percentage.** The `%` key/button is modulo; users pressing it expecting "percent" get remainder. Label is honest ("mod"), but worth a note.
4. **"Save in browser" writes but never restores.** `saveHistory()` sets `localStorage['afrotools-scientific-calculator-history']`, but nothing reads it on load — history is lost on reload despite the "saved" confirmation. Half-feature.
5. **Cosmetic:** hero `::after { content: '??'; }` (line 28) is mojibake from a corrupted emoji; decorative (opacity 0.06) so low impact.

## SEO audit
- **Title:** "Scientific Calculator - Trig, Memory, Parentheses, Constants" (~58 chars) — good length, keyword-rich. OK.
- **Meta description:** present, ~180 chars, feature-rich. Good. (WebFetch summarizer wrongly reported it missing; it is on line 8.)
- **H1:** single "Scientific Calculator". Good.
- **Canonical:** present (line 198). hreflang en/fr/x-default present. Good. (WebFetch wrongly said missing.)
- **JSON-LD:** strong — WebApplication, WebPage, FAQPage (5 Q&A), BreadcrumbList all present. Minor: `applicationCategory` is `"DeveloperApplication"` — better as `"EducationalApplication"` or `"UtilitiesApplication"` for this education tool.
- **Content depth:** healthy for a calculator — intro paragraph, "How it evaluates" method card, methodology/limitations/sources verification panel, 5-item FAQ, related-tools SSR block. Not thin.
- **Internal linking:** related education tools SSR + breadcrumb. Adequate.
- **Keyword targeting:** covers "scientific calculator", trig, log, memory, DEG/RAD. Missing common long-tails ("calculator with radians", "log calculator online", "factorial calculator") — could add to FAQ/body.

## UI/UX audit
- **Display:** expression line + large result, DEG/RAD chip, memory indicator, `aria-live="polite"`. Click-to-copy result. Good.
- **Accessibility:** DEG/RAD toggle has `role="button"` + `aria-pressed` + `aria-label`. Result/expr have aria labels. But **most keypad buttons are unlabelled beyond glyph text** — `|x|`, `x^y`, `n!`, `1/x` read literally to screen readers; add `aria-label`s. Buttons are real `<button type="button">` — keyboard-focusable. Reasonable.
- **Error handling:** div-by-zero / invalid → "Error" (Infinity/NaN guarded). Allow-list token validation before `Function()` eval — safe.
- **History:** session list (max 20), click-to-reuse, per-row copy, copy-all / download TXT / save. Rich. But no cross-reload persistence (see bug 4).
- **Mobile 375px:** 6-col keypad kept at 480px breakpoint with reduced padding/font (`min-height:36px`). Tight but usable; 6 columns at 375px makes function labels small. Consider 5-col or larger tap targets.

## Competitor gaps (Desmos Scientific, calculator.net, GeoGebra, web2.0calc)
Top 3 missing features vs competitors:
1. **Type-able function names.** web2.0calc/Desmos let you type `sin(`, `sqrt(` etc. directly; here you can only type digits/operators — function names require clicking. Add letter parsing to the keydown handler.
2. **Fraction / exact + decimal output.** web2.0calc renders results as both fraction and decimal; this tool is decimal-only (10 sig figs).
3. **Persistent history + scientific-notation (EE) input.** Competitors persist history and offer EE/×10ⁿ entry. This tool saves-but-doesn't-restore and has no EE key.
(Out-of-scope but noted: graphing — Desmos/GeoGebra core differentiator; unit converter / equation solver — web2.0calc.)

## Prioritized fixes
### (A) Quick wins
1. `tools/scientific-calc/index.html` (lines 602–607) → replace `[^)]+` trig regex with a balanced-paren evaluator (or a recursive/`\((?:[^()]|\([^()]*\))*\)` pattern) so **nested parens in trig work**. Highest-value fix.
2. `tools/scientific-calc/index.html` (JSON-LD, line 111) → change `applicationCategory` from `"DeveloperApplication"` to `"EducationalApplication"`.
3. `tools/scientific-calc/index.html` (keypad buttons) → add `aria-label`s to glyph-only buttons (`x^y`, `|x|`, `n!`, `1/x`, `10^x`, `e^x`, `+/-`).
4. `tools/scientific-calc/index.html` (`saveHistory`, ~line 773 + init) → on load, read `localStorage['afrotools-scientific-calculator-history']` and restore `history`/`renderHistory()` so "Save in browser" is real.
5. `tools/scientific-calc/index.html` (line 596) → remove dead `10\^\(`→`Math.pow` rewrite, or move it before the `^`→`**` replace.

### (B) Feature upgrades vs competitors
- Add function-name typing to the `keydown` handler (`s`→sin, etc., or a small text-buffer parser).
- Optional fraction/decimal dual output for rational results.
- Add EE / scientific-notation entry and a percent (`%` of) mode distinct from modulo.

### (C) Watch-outs (generated files)
- This page is a **self-contained inline HTML/JS tool** (no shared engine, no generator). Safe to edit directly. No AfroKitchen/cars/government/transport generator rules apply.
- `assets/js/bundles/*` and navbar/footer/related-tools are shared components — do not touch for calculator logic.
- If any site-wide minify/bundle step exists, edit the source `index.html` (inline `<script>` at line 450+), then re-run the standard build; do not hand-edit `.min` outputs.

## Fixes applied 2026-07-14
- **Nested-paren evaluator (correctness).** Replaced the `[^)]+` trig/function regexes with a recursive balanced-parenthesis converter (`convertMathFns` + `wrapMathFn`). Handles nesting and fixes a latent asin/acos/atan bug (partial `sin(` match inside `asin(`). Auto-close moved before conversion so args are always balanced. Dead `10^(`→Math.pow and `1/(`→`(1/(` rewrites removed (10^x works via `**`, 1/x via `/`). DEG/RAD preserved.
- **Node reproduction results:** sin(30)[deg]=0.49999999999999994; sin(2*(3+1))=0.13917310096006544 (=sin 8°); log(100)=2; sqrt(16)=4; 2^3=8; 5/0=Error. Extra: cos((60))=0.5, asin(0.5)=30°, sqrt(2*(4+4))=4.
- **History restore.** On load, reads `localStorage['afrotools-scientific-calculator-history']` and restores `history` (+ angle mode), so "Save in browser" now persists across reloads.
- **A11y.** Added aria-labels to glyph-only buttons: n!, x^y, mod, |x|, x^2, 10^x, e^x, +/-, cbrt, 1/x.
- **JSON-LD.** All 4 blocks parse valid; `applicationCategory` already `EducationalApplication` (no change needed). Single H1 confirmed.
