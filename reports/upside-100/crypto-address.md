# Crypto Wallet Address Validator — Audit

URL: https://afrotools.com/crypto/address-validator/
File: `crypto/address-validator/index.html`

## What it does
Paste a crypto wallet address; the tool auto-detects the network by regex, reports
the address type (e.g. BTC Legacy/P2SH/SegWit/Taproot), and cross-checks the address
against an AfroTools scam-report database via `/.netlify/functions/crypto-scam`.
Supports Bitcoin, Ethereum/BSC/Polygon, Tron (TRC-20), Solana, Litecoin, XRP,
Cardano, Dogecoin. Keeps recent checks in localStorage. Has share-result copy.

## Validation correctness — VERIFIED
Ran 17 node test cases (known-valid + known-invalid per chain). **17/17 correct.**
- BTC P2PKH/P2SH/bech32/taproot, ETH (checksummed + lowercase), TRON, XRP, DOGE,
  LTC, ADA Shelley, SOL (35 & 43 char) all detected to the right network.
- Rejected: `0xZZZ`, 39-hex ETH (too short), garbage string, empty.
- Priority order (bitcoin→ethereum→tron→cardano→litecoin→dogecoin→ripple→solana)
  correctly resolves the Base58 overlap so BTC/DOGE/LTC aren't swallowed by the
  broad Solana `{32,44}` pattern.

**No correctness bug** in network detection. The real limitation is scope: it is
**format-only**. It does NOT verify Base58Check or ETH EIP-55 mixed-case checksum
digits, so an address with a single mistyped char that still fits the length/charset
pattern reports "Valid". The UI's "Format: Valid ✓" overstated this. Fixed by
relabeling to "Valid pattern" and adding a format-vs-safety disclaimer (below).
Full Base58Check/bech32 checksum decoding is deferred (needs a decode lib; large add).

## Competitors + gaps
- **Chainabuse** (chainabuse.com) — large crowd scam-address DB; AfroTools' DB is
  Africa-focused/smaller but that's the differentiator.
- **Etherscan / BscScan** — ETH address lookup + on-chain activity; no scam label on
  arbitrary paste. Gap here: no balance/first-seen/activity lookup.
- **BitRef / blockchain.com explorer** — BTC address validity + balance.
- **MetaMask / Blockaid, Scam Sniffer** — real-time transaction scam signals.
Gaps vs field: (1) no checksum-level validation; (2) no on-chain activity/balance;
(3) ETH EIP-55 case-checksum not validated; (4) scam DB coverage depends on reports.

## SEO
- Title was weak/generic ("...| AfroTools"). Meta description ~200 chars (too long).
  Fixed: keyword title with BTC/ETH/USDT-TRC20; meta trimmed to ~150 chars.
- H1 "Crypto Wallet Address Validator" — unique, keyword-bearing. Kept.
- JSON-LD: WebApplication + WebPage + BreadcrumbList + FAQPage all valid (verified via
  node JSON.parse). FAQPage matches the visible df-faq block (generic df copy — df
  block, left untouched per rules).

## UX / a11y
- Clear input→button→result flow; result shows network, type, length, scam banner.
- Error state (invalid) lists all supported formats with hints — good.
- Input has aria-label; results use color banners with icon + text (not color-only). OK.
- Mobile: input-row stacks at 600px, details grid single-col at 500px. Fine at 375px.

## Trust
Original valid banner said "verify through multiple sources" but never stated that a
valid **format** ≠ safe/owned address. Added explicit disclaimer near the result:
valid format does not mean safe, active, or owned by the intended recipient — confirm
the recipient and send a small test amount first.

## Fixes applied 2026-07-14
- **Title**: → "Crypto Wallet Address Validator — BTC, ETH & USDT (TRC-20) Checker | AfroTools" (keyword-front, adds high-intent USDT-TRC20 term).
- **Meta description**: trimmed ~200→~150 chars, keyword-rich.
- **Trust disclaimer** added near result: valid format ≠ safe/active/owned; checks pattern not checksum/balance; confirm recipient + send test amount.
- **Honesty relabel**: "Format: Valid ✓" → "Valid pattern ✓" (accurate to format-only scope).
- **Validation tests**: 17/17 node cases passed (valid+invalid per chain, incl. BTC taproot, ETH lowercase, 39-hex reject, garbage reject).
- **JSON-LD**: all 4 blocks parse valid (node). Untouched.
- **Deferred**: real Base58Check/bech32/EIP-55 checksum verification (needs decode lib); on-chain balance/activity lookup. df blocks (df-upgrade/df-faq + FAQPage JSON-LD) untouched per rules.
- Edits confined to `crypto/address-validator/index.html`. H1 kept (already unique/keyword-bearing).
