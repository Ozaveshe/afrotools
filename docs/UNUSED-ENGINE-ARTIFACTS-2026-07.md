# Why 21 engine artifacts are built, shipped, and loaded by nothing

Research note, July 2026. Written during the code audit after the sweep found
16 engines with no consumer; the real figure is 21.

## The count

The first pass said 16. Two things were wrong with it.

It matched only `<script src="/engines/…">`, so it missed `tools/eac-cet/index.html`,
which loads its engine by the **relative** path `../../engines/eac-cet-engine.js`.
And it did not know there are **two** engine directories:

| Directory | Files | Shipped to `dist` |
|---|---:|---|
| `engines/` | 140 | yes (`engines/src/` is excluded) |
| `assets/js/engines/` | 122 | yes |

Resolving every `<script src>` on all 10,837 pages to a repo-relative path, plus
every `import()` and `fetch()` of an engine, gives the true figure:

- **`engines/` — 18 of 140 never loaded by any page**
- **`assets/js/engines/` — 3 of 122 never loaded**: `eg-paye.js`, `remittance-v2.js`, `tz-paye.js`

**21 artifacts, 121.6 KB, shipped to production on every deploy for nothing.**
Their sources add a further 167.9 KB, which `scripts/build-dist.js:333` correctly
keeps out of `dist`.

## Why git cannot answer "when did this happen"

`cdf2f2e4b` is the repository's **root commit**: 20,692 files and 12,250,632
insertions on 2026-07-25, and the only commit with no parents. The whole
codebase was squash-imported. All 65 commits of history postdate it.

Every one of the 21 artifacts was added by that single commit and has never been
referenced by an HTML page in any commit since. They arrived already orphaned,
so the answer has to come from the code, not the history.

## Why they are unused: every one has an identifiable successor

| Dead engine | Superseded by | Evidence |
|---|---|---|
| `business-insurance`, `claim-tracker`, `crop-insurance-calc`, `health-contribution`, `insurance-fraud-checker`, `marine-insurance`, `microinsurance`, `motor-third-party`, `workers-comp` (**9**) | `assets/js/pages/insurance-assumption-workflow.js` | All 9 tool families' pages (322 pages) load that and nothing else |
| `afrorates` | `assets/js/engines/afrorates-verified.js` + `afrorates-vip.js` | Rewritten under a new name |
| `payslip` | `assets/js/engines/payslip-draft.js` + `payslip-draft-vip.js` | Renamed |
| `staff-cost` | `engines/staff-cost-planner.js` (3.4 KB) | `tools/staff-cost/` loads the *planner*; the *engine* is 28 KB of predecessor |
| `visa-checker` | `assets/js/pages/visa-family-verification.js` | Rebuilt |
| `creator-desk`, `creator-kit` | `assets/js/pages/day9-creative-*.js` | Rebuilt |
| `solar-roi` | `assets/js/engines/solar-roi-engine.js` | **Byte-identical duplicate** (md5 `d159370b…`) — the only filename present in both directories |
| `tva` | The 49 per-country VAT engines in `assets/js/engines/` | No `tools/tva/` exists; Benin uses `BJVatEngine` |
| `afroideas` | — | No tool, no page, no route anywhere in the repo. Product removed. |

The insurance cluster is the largest and the most defensible: those tools were
deliberately rebuilt as **user-entered-rate worksheets** ("Apply contribution
rates that you enter to a payroll basis you enter"). That is the strongest
possible fix for the premium-of-zero defect `.claude/rules/insurance.md`
documents — there is no bundled rate left to default to zero. The engines were
not abandoned; they were designed out.

No dynamic loader reaches them either. The only runtime engine loading is
`engineSrc` in the AI vertical demos, and all three of its values point into
`assets/js/engines/`.

## The part that actually costs something

Not the 121.6 KB. **14 of the 18 dead `engines/` artifacts carry a protected
entry in `data/calculation-quality/formula-registry.json`**, six of them at
`riskLevel: high`:

| Formula id | Risk | Domain |
|---|---|---|
| `formula-engines-health-contribution-engine` | high | pensions_benefits |
| `formula-engines-payslip-engine` | high | tax_payroll |
| `formula-engines-staff-cost-engine` | high | tax_payroll |
| `formula-engines-tva-engine` | high | tax_payroll |
| `formula-engines-visa-checker-engine` | high | legal_regulatory |
| `formula-engines-workers-comp-engine` | high | pensions_benefits |
| `formula-engines-afroideas-engine` | medium | loans_financial |
| `formula-engines-afrorates-engine` | medium | exchange_rates |
| `formula-engines-business-insurance-engine` | medium | health |
| `formula-engines-crop-insurance-calc-engine` | medium | health |
| `formula-engines-insurance-fraud-checker-engine` | medium | health |
| `formula-engines-marine-insurance-engine` | medium | health |
| `formula-engines-microinsurance-engine` | medium | health |
| `formula-engines-solar-roi-engine` | medium | utilities_meters |

Adding the three dead `assets/js/engines/` files — `eg-paye.js` (high),
`tz-paye.js` (high), `remittance-v2.js` (medium) — the total is **17 of 356
registry entries, 5%, protecting formulas that reach no user.** Three
consequences:

1. **The coverage number overstates what is guarded.** A registry that reports
   356 protected formulas is counting 14 that cannot affect anyone.
2. **It spends human review on dead code.** The protected-formula gate correctly
   refuses to re-digest silently. This audit tripped it twice on engines nobody
   loads (`tva`, `health-contribution`), each time requiring a written change
   record for a file with no consumer.
3. **`solar-roi` is registered twice for one calculator.**
   `formula-assets-js-engines-solar-roi-engine` and
   `formula-engines-solar-roi-engine` protect two byte-identical copies. Editing
   one and not the other would leave the registry asserting two different digests
   for the same maths, and nothing in the build would object.

Every one of the 14 carries `lastVerified: 2026-03-01`, so they also age into
freshness warnings that no amount of source-reading can usefully clear.

## The one risk worth checking, and its result

`assets/js/engines/eg-paye.js` and `tz-paye.js` being dead is the same shape as
the bug `.claude/rules/salary-tax.md` was written about:

> The shared `assets/js/engines/ke-paye.js` was already correct; the page had its
> own inline logic that was not. The lesson: read the Act, not the headline — and
> confirm the page's inline calculator matches the shared engine.

Egypt and Tanzania both compute PAYE inline on the page while a shared engine
sits unloaded beside them, so nothing in the build compares the two. They were
checked by hand.

**Tanzania — no divergence.** Page bands and `TRA_BANDS` agree exactly: 270,000
at 0%, 250,000 at 8%, 240,000 at 20%, 240,000 at 25%, remainder at 30%. Social
rates agree too (private employee 10%, private employer 10%), as does the
secondary-employment flat 30% and the `gross − social` taxable base.

**Egypt — no divergence.** Every constant matches: `PERSONAL_EXEMPTION` 20,000,
`DISABLED_PERSONAL_EXEMPTION` 30,000, `NOSI_RATE` 0.11, `NOSI_ANNUAL_CAP`
174,000.

So the latent risk did not materialise in either market. It remains latent for
as long as two implementations of the same tax exist with no test tying them
together — which is an argument for deleting the unused copy, not for keeping it
as a reference.

## Recommendation

Remove the 21 artifacts and their sources, and drop the 17 registry entries with
them. The evidence for each is a named, currently-loaded successor, and
`git` retains everything.

The one item worth a second look before deletion is `engines/staff-cost-engine.js`
(28 KB) versus `engines/staff-cost-planner.js` (3.4 KB): the live file is an
order of magnitude smaller, so confirm the planner covers what the page needs
rather than assuming the size difference is dead weight.

## How to re-check this

```
node scripts/audit-unused-engines.js
```

Resolves every script reference on every page — absolute, relative, and dynamic
— against both engine directories, and cross-references the formula registry.
