# Swahili parity pause checkpoint — 2026-08-03

## Coordinator truth

- English free-app denominator: 1,257
- Centrally accepted: 487 (38.7%)
- Centrally blocked: 3
- Remaining unaccepted: 770
- Coordinator base before this checkpoint: `8354e321ff34caf60a33a3393cd0dcddfb00c023`
- Deployment status: not pushed, merged, or deployed

Only rows recorded as `accepted` in `data/audits/swahili-free-app-acceptance.json` count as complete. Candidate routes, translated shells, local receipts, and family-level claims do not count by implication.

## Final independent verification results

| Candidate | Scope | Result at pause |
| --- | --- | --- |
| `bfae49d50d458a0c7504d32286fc9145076b6a75` | Document/PDF, 32 routes | 25 app-level accepts; branch blocked by 7 real export-flow failures |
| `6900474cab864b281a933daa559d69b65bf5bd79` | HR, 6 routes | 0 accepted; all six blocked by dark-mode link distinguishability |
| `db0da9db986ea36ebe9e2dce741703be64e8f0be` | Water, 2 routes | 0 accepted; contrast, calculated-state reflow, and septic owner-parity blockers |

Document/PDF blocked IDs: `pdf-redact`, `pdf-header-footer`, `pdf-to-audio`, `pdf-bates`, `invoice-generator`, `pdf-watermark`, `pdf-page-numbers`.

## Clean candidates preserved for a later review

These are not in the central accepted count.

| Candidate | Local result | Review state |
| --- | ---: | --- |
| `54eeaed209255367b91c221c0317823bd1c32b8b` | Farm Loans 16/16 | independent verification pending |
| `f7456a9ea5f3fcc97082b1c080d61d897b7599b0` | Farm Payroll 55/55 | independent verification pending |
| `4f317ac63ebeda6b8c7991360504280089be93ba` | Input Prices 16/16 | independent verification pending |
| `c3b232bb7f99ef677360a353d994d47e1a1fb7eb` | Fish Farming 16/16 | independent verification pending |
| `a83b504502e398cd3a8e992e4e2987df69033d00` | Livestock Feed 16/16 | independent verification pending |
| `00ede65e341420c287aad5df7f91a3a3aca2b10b` | Hajj Budget 1/1 | independent verification pending |
| `d963ee12ea533f6b53374aaf1fad2a1c2022d500` | Burundi and Uganda PAYE locally green; Rwanda pending | independent verification pending |
| `8072bb25aabdf1f037f0246afafca7b4dd34792e` | Course Load locally green | coordinator review pending |

The broader preserved candidate frontier remains recorded in `reports/swahili-coordinator-integration-pending.json`. Resume from that queue and re-check every candidate against the then-current coordinator tree before integration.

## Resume boundary

1. Start from this coordinator checkpoint branch.
2. Re-run the 1,257-row parity inventory before accepting any candidate.
3. Repair or split blocked candidates rather than accepting a whole branch by receipt.
4. Independently verify pending candidates with real 320/375px and doubled-root-font 200% reflow, all themes, keyboard/a11y, exact app oracles, privacy, sources, SEO, AI consent/routing, and parsed/reopened exports.
5. Regenerate the central acceptance ledger and Swahili AI route map only after independent acceptance.

All Swahili worker and audit tasks were archived after their current bounded operation completed. No further Swahili implementation run was started.
