# Crypto Knowledge Quiz — Audit

URL: https://afrotools.com/crypto/quiz/ · File: `crypto/quiz/index.html`

## What it does
Client-side multiple-choice crypto quiz with 3 difficulty levels (Beginner 10q/30s, Intermediate 15q/25s, Advanced 20q/20s). Per-question countdown timer, running score, animated answer feedback with explanations, personal-best via localStorage, and share buttons (Copy / X / WhatsApp). Africa-focused question bank (Nigeria/Kenya/SA regulation, USDT, P2P, scams). Pure vanilla JS IIFE, no backend.

## Quiz correctness (checked all 25 questions)
Verified every `ans` index against option arrays and real-world facts across the full bank:
- Beginner (10): all correct (Bitcoin=digital currency, wallet=stores keys, never share=seed phrase, P2P, USDT=stablecoin, Nigeria top adoption, seed-phrase TF, blockchain=all of above, Musk TF=False, cold wallet safest).
- Intermediate (10): all correct. Two data-dependent claims are defensible but time-sensitive: Nigeria 10% CGT on digital assets (Finance Act era) and "43% of Nigerian retail crypto is stablecoins" (Chainalysis). Kenya 3% DAT "repealed from 1 July 2025" matches Finance Act 2025.
- Advanced (5): all correct (SA R40,000 CGT exclusion, impermanent loss, 21M cap, honeypot, ETH=PoS).
- Scoring logic sound: `score++` on `selectedIdx===q.ans`; time-up passes `-1` (never matches, no false credit); pool builds cumulatively (intermediate = beginner+intermediate pool sliced to 15; advanced = all sliced to 20); grade thresholds 81/61/41 clean. No scoring bug found.

## Real analogues + gaps
Analogues: CoinMarketCap "Learn & Earn", Binance Academy quizzes, Coinbase Learning Rewards, Investopedia crypto quizzes, Blockworks/CoinGecko trivia. Gaps vs them: (1) no shareable OG result image; (2) advanced pool thin (only 5 unique advanced Qs so "20 advanced" is mostly beginner/intermediate); (3) no answer-review recap on results screen; (4) no category tagging (regulation vs security vs DeFi).

## SEO
- Title weak-ish ("Test Your IQ") — sharpened. Meta description ~185 chars — over the 160 limit, trimmed.
- Single unique H1 present ("Crypto Knowledge Quiz") — good.
- JSON-LD: WebApplication + WebPage + BreadcrumbList + FAQPage all valid. FAQPage mirrors the visible df-faq (kept as-is; df block).
- Good content depth (~600-word Africa crypto education section).

## UX / a11y
- Flow, retry ("Try Again"), and progressive "Try Harder Level" all work. Mobile: difficulty grid collapses to 1col at 600px, container maxed 720px — fine at 375px.
- Options are `<button>` (keyboard-activatable) but lacked a group label / semantic grouping for screen readers. Added `role="group"` + `aria-label`, and `aria-live` on the question so SR users hear question changes.

## Trust
Global "planning guidance only" strip present, but no crypto-specific "educational, not financial advice" note in the quiz surface. Added an explicit educational disclaimer under the start card.

## Fixes applied 2026-07-14
- Title → "Crypto Knowledge Quiz — Test Your Crypto IQ | AfroTools".
- Meta description trimmed to 152 chars, Africa keywords retained.
- Added visible educational / not-financial-advice note under the difficulty selector.
- A11y: `optionsGrid` given `role="group"` + dynamic `aria-label` per question; `questionText` set `aria-live="polite"`; option buttons get `aria-label` with letter + text.
- No answer or scoring changes needed — all 25 answers correct, scoring verified.
- JSON-LD unchanged (already valid); verified via node.
