# Insurance Workbench

The insurance section uses a shared browser-side workbench at `assets/js/insurance-workbench.js`.

## Scope

The workbench is loaded on `/insurance/` and every HTML page under these insurance app families:

- `tools/car-insurance/`
- `tools/health-insurance-compare/`
- `tools/life-insurance-calc/`
- `tools/funeral-insurance/`
- `tools/travel-insurance/`
- `tools/business-insurance/`
- `tools/crop-insurance-calc/`
- `tools/motor-third-party/`
- `tools/professional-indemnity/`
- `tools/fire-insurance/`
- `tools/marine-insurance/`
- `tools/microinsurance/`
- `tools/claim-tracker/`
- `tools/workers-comp/`
- `tools/health-contribution/`
- `tools/insurance-fraud-checker/`

## Behavior

- `/insurance/` gets a guided cover finder that recommends related tools by user situation.
- `/insurance/` also gets an insurance workflow planner. Users can choose driver, family, SME, farmer, travel/trade, or claims workflows, save them to the dashboard, and generate a PDF-ready workflow pack behind an email gate.
- `/insurance/` also gets an African insurance buyer desk based on competitor/product patterns: compare more than price, keep proof in your phone, fit the payment reality, and verify the seller.
- Country-list app hubs get a country search and quick links to common markets.
- Calculator pages get a pre-calculation quote pack with tool-specific checks, insurer questions, competitor-informed improvements, buyer-readiness checklist, red flags, local context, and documents to keep.
- Calculator pages get an app-specific workflow strip so users can move from one insurance app to the next in the recommended order.
- Quote-style tools get a three-offer comparison board so users can compare premium, excess, claim channel, and exclusions before shortlisting an insurer.
- Claim and fraud tools get a follow-up board for handler, reference number, missing item, and next follow-up date.
- After calculation, a next-step pack is generated with local regulator context, red flags, and source cues when country data is available.
- Required high-value numeric fields are validated before the existing calculator handler runs.
- A copy button exports the quote pack for comparison shopping or claim follow-up.
- Save buttons write insurance buyer packs to `localStorage`, feed `AfroData.save()` for the dashboard saved-calculation surface when available, and attempt `AfroWorkspace.upsert()` for signed-in account workspaces.
- PDF buttons use an email gate backed by `/api/capture-lead`, then open a print-ready report that users can save as PDF.
- Microinsurance country-page descriptions should describe local low-cost premium estimates, not promise a specific "as low as" figure unless the generator has a verified amount and currency.

## Source Cues

The workbench links to live source cues where they improve user decisions:

- EU Visa Code Article 15 for Schengen travel medical insurance minimum coverage.
- NAIC consumer claim guidance for file discipline and claim documentation.
- World Bank index insurance research for crop and weather-triggered cover.
- World Bank mobile money micro-insurance example for mobile-linked insurance.
- IAIS Insurance Core Principles for disclosure and policyholder-protection context.
- Competitor/product cues from Hippo, mTek/Money254, Naked, Pineapple, and Turaco for quote comparison, digital claims, mobile-money payments, and embedded microinsurance patterns.
- Business insurance cues from Hippo business insurance pages for public liability, professional indemnity and SME risk bundles.
- Institute Cargo Clauses cues for marine cargo coverage tiers A, B and C.

## Validation

Run:

```bash
npm test
```

For runtime smoke, serve the repo locally and verify:

- `/insurance/` renders `#ins-cover-finder`.
- `/insurance/` renders `#ins-workflow-planner` and can save or gate a workflow pack.
- `/tools/car-insurance/` renders `#ins-country-finder`.
- Each insurance app renders a `Competitor check` card and `#ins-app-workflow`.
- `/tools/car-insurance/nigeria.html` calculates and renders `#ins-result-pack`.
- `/tools/car-insurance/nigeria.html` renders `#ins-quote-board` and can produce a ranked quote summary.
- Quote, claim, buyer, workflow and result packs expose dashboard save and email-gated PDF actions.
- `/tools/travel-insurance/` renders the Schengen source cue after calculation.
- `/tools/insurance-fraud-checker/` renders the insurance workbench and post-score pack.
- `/tools/claim-tracker/` renders `#ins-claim-board`.
