# Trade Section Improvement Pass - 2026-04-27

## Scope

Reviewed `/trade/` and every registry-backed English tool with `category: 'trade'`.

The hub previously surfaced 18 tools, while the registry had 22 trade tools. The pass makes the hub match the registry and adds a shared operator layer to all 22 tools.

## Second Thorough Pass - Competitor, Dashboard and Lead Workflow

The follow-up pass treated the trade category as one product package rather than a set of separate calculators.

Homepage improvements on `/trade/`:

- Reframed the hero from a directory into a trade-pack cockpit: quote, preference, documents and payment route.
- Added direct starts for import quote, export documents and saved dashboard packs.
- Replaced the broad "2026 Data" signal with a safer "Source Checked" signal.
- Added a proof strip explaining the new shared context, competitor-informed tool logic, PDF lead capture and dashboard handoff.
- Updated the CTA and feature copy so it reflects the new complete workflow without implying that email is required for the free core tools.

Per-app competitor pass:

- Added a `COMPETITOR_NOTES` layer in `assets/js/trade-toolkit.js` with a separate benchmark, observed competitor pattern, AfroTools improvement and practical operator moves for every trade tool.
- The benchmarks cover WCO Trade Tools, AfCFTA tariff and origin guidance, SimplyDuty-style landed-cost calculators, freight marketplace and carrier quote flows, ICC Incoterms and UCP workflows, IncoDocs-style trade documents, FIATA digital B/L direction, PAPSS payment flows, UN Comtrade commodity data, World Bank LPI customs-delay framing, ECOWAS ECOTIS, EAC CET and SADC origin guidance.
- Every trade tool now renders a "Competitor-informed upgrade" panel with source links and concrete next moves.
- Trade briefs and saved Trade Pack snapshots now include the competitor-informed upgrade so the user's handoff captures why that tool matters and what to verify next.

PDF and lead-capture pass:

- Added an email-first PDF gate to the Trade Pack. The calculator remains free and ungated; the gate appears only when the user requests the deeper PDF handoff.
- The gate stores the email locally, reuses existing lead keys where possible and posts to `/api/capture-lead` with trade context when available.
- The PDF export uses jsPDF when available and falls back to a text trade pack if the PDF library cannot load.

Dashboard workflow pass:

- Added a local trade-pack dashboard store at `afrotools:trade-dashboard-items`.
- Added a "Save to dashboard" action from every Trade Action Desk. It saves locally first and attempts `AfroWorkspace.upsert` only when account workspace sync is available.
- Updated `dashboard/index.html` so saved trade packs are counted in workspace totals, surfaced in the dashboard action center and rendered in a dedicated "Trade Packs" workspace tab.
- Dashboard messaging stays honest: local saves are described as local, while synced saves are only called synced after the workspace upsert succeeds.

## Shared Upgrade

Added `assets/js/trade-toolkit.js` and `assets/css/trade-toolkit.css`.

Every trade tool now gets a Trade Action Desk with:

- Tool-specific use cases.
- Before-acting checklist with local checkbox state.
- Readiness meter tied to the tool's checklist.
- Shared shipment or deal context fields for flow, origin, destination, product or HS code, value and deadline. These fields now carry across the trade tools in the browser, with backward compatibility for the first per-page context storage key.
- Risk signals for real import, export, finance, customs, document or logistics work.
- Related next-tool links so users can move through a real workflow.
- Reference lane with official or institutional sources.
- Data and logic status panel with the last source-review date and a plain-language guardrail for official, broker, bank, carrier or customs verification.
- Private local note field.
- Copyable trade brief that includes readiness, shipment context, current visible page inputs, checks, risks, note and source links.
- Local Trade Pack that lets users save snapshots from multiple trade tools into one shipment or deal handoff, then copy the whole pack.
- Local Trade Pack snapshots that let users save useful states from multiple tools into one shipment or deal pack.
- Copyable Trade Pack output for broker briefs, supplier comparisons, customs follow-up or team handoff.
- Workflow path panel that turns each tool into one step in a larger lane, with previous and next actions.
- Active workflow memory so tools that belong to more than one lane can stay in the user's chosen path.

## Cohesive Workflow Pass

Added six connected workflow lanes to the shared toolkit:

- Import quote to landed cost: HS code, Incoterms, chargeable weight, shipping, landed cost, customs time, demurrage and FX.
- Regional preference check: HS code, AfCFTA, ECOWAS/SADC/EAC rulebook choice, certificate of origin and export documents.
- Export document pack: proforma invoice, packing list, bill of lading, export documents and certificate of origin.
- Finance and payment route: Incoterms, LC fees, finance comparison, payment rail choice, cross-border data and FX.
- Market scan to quote: commodity signal, HS classification, route cost, payment friction and finance.
- Operations risk run: chargeable weight, freight assumptions, customs release path, demurrage and data-transfer controls.

The workflow lane is rendered on every trade tool that belongs to one of these paths. It shows where the user is, what came before, the recommended next tool and a direct continue action. Shared context and Trade Pack snapshots now include workflow state so a user can build one broker, bank or team handoff instead of disconnected exports.

## Data Freshness Pass

The trade toolkit now separates official-reference logic from live legal or customs facts:

- AfCFTA tracker uses a new guardrail that cites the AU 90 percent, 7 percent and 3 percent tariff-category framing, but tells users to verify the corridor schedule, concession line and rules of origin with the official tariff book, customs authority or AfCFTA Secretariat before quoting preference.
- EAC CET uses the official 2022 four-band base structure of 0, 10, 25 and 35 percent, with visible warnings that sensitive items, stays of application, remission schemes, specific duties and national levies require current gazette or customs confirmation.
- ECOWAS CET cites the official 0, 5, 10, 20 and 35 percent band structure, while warning that supplements, VAT, waivers, ETLS eligibility and trade-defence measures can change the payable amount.
- SADC origin logic is framed as a planning screen, since product-specific origin rules and certificate evidence control the final preference claim.
- PAPSS, bill of lading, data-transfer and shipping-weight tools now have tailored guardrails for participant coverage, draft-document status, national data rules and carrier-specific divisors.

Visible copy was tightened on `tools/afcfta-tracker/index.html` and `tools/eac-cet/index.html` to remove overconfident static claims such as fixed rules-of-origin completion, guaranteed corridor savings and broad "updated 2026" tariff certainty.

## Hub Fix

Updated `trade/index.html` from 18 surfaced tools to the full 22-tool registry inventory:

- Added HS Code Lookup to the core workflow.
- Added Cross-Border Data Transfer Checklist.
- Added Customs Clearance Time Estimator.
- Added Shipping Weight Calculator.
- Added workflow lanes for import quoting, regional preference checks, export document packs, finance and payment selection, market scans and operations risk.
- Added direct start actions for each workflow lane and connected the lanes to the new Trade Pack habit.
- Updated visible counts, metadata, schema item list and CTA copy.
- Switched hub social image to the trade category OG asset.
- Fixed a malformed ItemList name in JSON-LD.
- Tightened FAQ and feature copy so it does not overclaim exact AfCFTA, SADC or PAPSS outcomes.

## Per-Tool Review Summary

| Tool | Main improvement |
| --- | --- |
| HS Code Lookup | Added classification-first workflow, national tariff-line warning and links into landed cost, AfCFTA and ECOWAS checks. |
| AfCFTA Tariff Tracker | Added eligibility framing around tariff schedule, product basket and origin proof. |
| Landed Cost Calculator | Added FOB-to-warehouse decision framing, FX buffer and demurrage risk checks. |
| Shipping Cost Estimator | Added freight quote checklist for dimensions, routing, local charges and free days. |
| FX Import Cost Impact | Added currency-risk workflow across deposit, balance payment, customs valuation and resale price. |
| Incoterms 2020 Calculator | Added named-place, mode and insurance checks based on ICC Incoterms operating reality. |
| LC Fee Calculator | Added UCP, document mismatch, confirmation and usance-risk checks. |
| Export Documentation Checklist | Added consistency control across invoice, packing, origin, transport and product documents. |
| Certificate of Origin Generator | Added origin evidence trail for AfCFTA, ECOWAS, EAC, SADC and COMESA claims. |
| Port Demurrage Calculator | Added separate demurrage, storage, free-day and document-release checks. |
| Trade Finance Cost Comparator | Added risk-adjusted comparison across LC, CAD, T/T, open account, SBLC and structured terms. |
| Commodity Trade Tracker | Added market-scan workflow with data-lag, partner concentration and HS classification cautions. |
| B2B Payment Fee Comparator | Added PAPSS, SWIFT, fintech, FX spread, corridor support and compliance checks. |
| ECOWAS Trade Levy Calculator | Added CET band, national supplement and ETLS evidence checks. |
| SADC Rules of Origin Checker | Added origin test workflow for wholly obtained, value-added, process and tariff-heading-change logic. |
| EAC Common External Tariff | Added four-band CET, sensitive item, remission and country-level measure checks. |
| Proforma Invoice Generator | Added LC, import permit, Incoterm, validity and document consistency checks. |
| Packing List Generator | Added carton, CBM, marks, gross/net weight and document-matching controls. |
| Bill of Lading Template | Added draft-only guardrails, consignee wording, release type and title-control warnings. |
| Cross-Border Data Transfer Checklist | Added digital trade framing for customer, supplier, payment, logistics and vendor data flows. |
| Customs Clearance Time Estimator | Added critical-path clearance checks across manifest, entry, inspection, payment, release and truck gate-out. |
| Shipping Weight Calculator | Added carrier divisor, rounding, remeasurement and packaging optimisation checks. |

## Research References Used

- African Union AfCFTA operational instruments and tariff liberalisation.
- WCO Harmonized System and WCO Trade Tools, including the classification, origin and valuation source lane.
- WTO Trade Facilitation Agreement, especially release, clearance, transit and customs-cooperation framing.
- ICC Incoterms 2020 and ICC banking rules, including named-place wording, CIF/CIP insurance differences, UCP and digital standards.
- PAPSS local-currency cross-border payment documentation.
- ECOWAS CET and ETLS references.
- EAC Common External Tariff repository entry.
- SADC customs, protocol and rules-of-origin materials.
- UN Comtrade data tables and data explorer framing for trade balances, partners and commodities.
- FIATA digital bill of lading and ICC Digital Standards Initiative.
- DHL and FedEx dimensional-weight references, including the higher-of-actual-or-volumetric pricing logic and carrier remeasurement risk.
- AU Data Policy Framework and Malabo Convention references.

## Validation Notes

- The shared toolkit is intentionally source-first and loaded by the 22 English trade tool pages.
- The readiness and context fields are browser-local only, matching the privacy posture of the section.
- The copied brief and Trade Pack are designed for a broker, bank officer, forwarder, buyer or internal reviewer.

## Follow-Up Complete Package Pass - 2026-04-28

The follow-up pass tightened the category as a connected product package rather than a set of calculators.

- Improved the `/trade/` homepage hero into a trade-pack cockpit with import, preference, document and payment entry points.
- Added homepage proof points for competitor-informed tool upgrades, shared context, PDF lead capture and dashboard handoff.
- Added a competitor-informed upgrade panel to every Trade Action Desk, using a per-tool benchmark note and practical action moves.
- Added gated PDF brief and Trade Pack export paths so email capture happens at high-intent handoff moments without blocking the free calculators.
- Wrapped existing print/PDF buttons on trade document tools so proforma, packing list, B/L, COO and data-transfer PDF actions pass through the same trade lead gate.
- Added local dashboard handoff for Trade Packs via `afrotools:trade-dashboard-items`, with account workspace sync attempted only when `AfroWorkspace` confirms the user is signed in.
- Updated the dashboard workspace to surface saved Trade Packs as first-class workspace items with continue and remove actions.

Validation focus for this pass:

- Hub smoke: `/trade/` should show the cockpit, workflow lanes and all 22 tool cards.
- Per-tool smoke: every registry-backed English trade tool should render a Trade Action Desk, competitor-informed panel, workflow context, Trade Pack actions and source/status guardrails.
- Lead gate smoke: document print/PDF buttons should open the trade PDF gate for a new browser profile, then proceed to the export after a valid email is entered.
- Dashboard smoke: saving a Trade Pack should create a local dashboard workspace item, and signed-in users should get an account workspace sync attempt without implying sync when not signed in.
