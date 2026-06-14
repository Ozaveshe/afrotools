# Public Claim Rules

AfroTools should sound useful and confident without implying proof, authority, coverage, or live operation that the repo cannot support. Use this guide when editing public copy, tool descriptions, article metadata, AI workflow text, data payloads, sponsor copy, or generated indexes.

## Safe Wording Patterns

| Claim category | Avoid unless independently verified | Safer pattern |
| --- | --- | --- |
| Traffic or usage scale | thousands of users, millions served, hundreds of thousands helped | many users, common scenarios, high-volume examples, large communities |
| Market leadership | Africa's #1, best in Africa, most trusted | Africa-focused, practical, widely used, designed for African workflows |
| Official or verified data | official, verified, government-approved, regulator-approved | source-linked, reviewed, estimated, user-entered, confirm with the official source |
| AI capability | AI advisor, fully automated, guaranteed answer | AI-assisted when enabled, deterministic fallback, workflow launcher, planning support |
| Country coverage | all 54 countries, every African country | supported African countries, country-by-country, across African markets |
| Privacy or security | secure, private, protected, encrypted | runs in your browser, no upload unless you choose, AI sends only after consent |
| API or data freshness | real-time, live data, instant updates | regularly updated, cached snapshot, latest reviewed, last checked date |
| Sponsor or business | trusted partner, recommended provider | sponsored, partner option, user opt-in lead handoff |
| Performance or speed | instant, fastest, zero delay | fast-loading, lightweight, designed for low-bandwidth use |
| Superlatives | best, biggest, most reliable, number one | strong, practical, established, useful for the workflow |

## Source And Confidence Rules

- Use `official` only for government, regulator, tax authority, central bank, university, or provider sources that are directly linked and current enough for the claim.
- Use `reviewed` when AfroTools has checked a source, dataset, or rule but cannot claim official verification.
- Use `estimated` for calculators, assumptions, forecasts, market prices, import-duty scenarios, salary ranges, and AI-generated summaries.
- Use `user-entered` for values supplied by the user.
- Use `unknown` or cautious copy when the source is missing, stale, blocked, or not yet reviewed.

## AI And Privacy Copy

- Do not describe a deterministic tool as AI-powered unless model-assisted functionality is implemented and behind consent where needed.
- Do not imply CVs, PDFs, invoices, salary data, profiles, or documents are sent to AI by default.
- Prefer: "Some workflows run in your browser. AI-assisted workflows ask before sending private content."
- Keep "continue without AI" paths visible wherever AI can receive user content.

## Government, Legal, Tax, And Immigration Copy

- Do not imply government endorsement, official filing, legal advice, tax advice, immigration advice, or guaranteed acceptance.
- Prefer: "planning estimate," "preparation guide," "confirm with the official portal," or "speak to a qualified professional."
- If a workflow references a government-approved external process, make clear AfroTools is only preparing or calculating, not replacing that official path.

## Audit Expectations

- Run `npm run audit:public-claims` after changing public copy, data payloads, AI copy, or generated tool descriptions.
- Register true measurable product claims in `data/audits/public-claim-registry.json` only when there is a named owner, truth source, current truth, and validation command.
- Rewrite unsupported claims instead of suppressing them.
- Raw educational datasets can be ignored by the audit, but user-facing article/tool copy should still avoid unsupported scale and superlative language.

## Automation Registry Warnings

Automation registry warnings should be fixed only with real run evidence. Do not edit registry or report files to make stale automation evidence look healthy. If an automation ran outside the repo report window, document that as an evidence gap and let the next scheduled report or a real validation run close it.
