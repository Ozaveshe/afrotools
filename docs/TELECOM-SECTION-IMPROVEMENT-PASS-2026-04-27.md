# Telecom Section Improvement Pass - 2026-04-27

## Scope

Reviewed the `/telecom/` hub and every app linked from the Telecom & Mobile section:

- `/telecom/data-plan-compare/`
- `/telecom/ussd-directory/`
- `/telecom/airtime-value/`
- `/tools/mobile-money-fees/`
- `/telecom/data-usage-calc/`
- `/telecom/roaming-cost/`
- `/telecom/internet-compare/`
- `/telecom/fiber-lte-5g/`
- `/telecom/number-portability/`
- `/telecom/sim-registration/`
- `/telecom/tv-compare/`
- `/telecom/starlink-compare/`
- `/telecom/business-internet/`
- `/telecom/bulk-sms-pricing/`
- `/telecom/whatsapp-vs-sms/`

## Research Inputs

- GSMA Mobile Economy research for the mobile internet, 4G, 5G, affordability, and adoption lens: https://www.gsma.com/solutions-and-impact/connectivity-for-good/mobile-economy/sub-saharan-africa/
- Worldwide mobile data pricing research for the cost-per-GB framing: https://bestbroadbanddeals.co.uk/mobiles/worldwide-data-pricing/
- Starlink availability map for satellite availability thinking: https://www.starlink.com/map/
- WhatsApp Business Platform pricing for message-category comparison: https://business.whatsapp.com/products/platform-pricing
- DStv package comparison for pay-TV package UX: https://www.dstv.com/en-ng/buy/compare-packages
- ICASA numbering and portability reference: https://www.icasa.org.za/pages/numbering
- Kenya Communications Authority portability guide: https://repository.ca.go.ke/items/abf5f83d-a36c-47e1-9e13-a70f1aa52208/full
- Ghana NCA SIM registration reference: https://nca.org.gh/registration-process/

## Implemented Improvements

- Added `assets/js/telecom-toolkit.js`, a shared Telecom decision layer that injects app-specific guidance, quick scenarios, related next tools, and source links.
- Wired the toolkit into the Telecom hub, all 14 `/telecom/...` app pages, and the Mobile Money Fee Checker linked from the hub.
- Added four missing Telecom route entries to `assets/js/components/tool-registry.js` so discovery, sitemap generation, and audit flows can see:
  - Fiber vs LTE vs 5G
  - Business Internet Calculator
  - Bulk SMS Pricing Calculator
  - WhatsApp Business vs SMS
- Fixed Bulk SMS pricing to read `avgCostPerSMS` from `TELECOM_DATA`, and replaced random fallback provider rates with deterministic estimates.
- Fixed WhatsApp vs SMS pricing to read the shared `perConversation`/`perMessage` shape and `avgCostPerSMS`.
- Fixed Business Internet to derive usable monthly price and speed from ISP `speeds`/`prices` arrays.
- Fixed Starlink vs Local ISP to derive local ISP monthly price and speed from `speeds`/`prices`, and avoid double `Mbps` labels.

## Second Pass Package - 2026-04-28

- Reworked the `/telecom/` homepage position from a directory into a workflow command center.
- Added a homepage planner with six guided routes:
  - Cut mobile data spend
  - Travel connection plan
  - Home or office internet plan
  - Customer messaging plan
  - Family entertainment plan
  - Network switching plan
- Added query-string handoff between Telecom apps so country and workflow context can carry from the hub into the next app.
- Added app-level competitor benchmark panels for every Telecom app, based on current external feature patterns such as package comparison, per-message pricing, eSIM plan framing, SMS compliance, official availability maps, and regulator process pages.
- Added an email-gated PDF brief action to every Telecom app and the homepage workflow planner.
- Added local email capture plus `/api/capture-lead` submission for PDF gates and optional save events.
- Added dashboard saves for Telecom plans and briefs:
  - Local fallback key: `afro_telecom_workspace`
  - Signed-in sync path when available: `AfroWorkspace.upsert`
  - Dashboard lane: My Workspace > Telecom
- Added `dashboard/telecom-workspace.js` so Telecom workspace items still render after the synced dashboard layer overrides `renderMyWorkspace`.
- Added dashboard deletion support for local Telecom workspace items, with account sync deletion when `AfroWorkspace` is available.
- Updated the homepage FAQ to avoid stale claims about cheapest data markets and Starlink country availability.

## Additional Competitor and Source Inputs

- GSMA Mobile Economy Africa 2025 for the broader mobile-economy and usage-gap lens: https://www.gsma.com/mobileeconomy/sub-saharan-africa/
- Twilio SMS pricing and features for SMS/RCS, carrier fees, delivery, compliance, and volume-discount expectations: https://www.twilio.com/en-us/sms/pricing/us
- Airalo Africa eSIM plans for regional eSIM packaging, compatibility, top-up, and travel-data framing: https://www.airalo.com/africa-esim
- Africa's Talking SMS help for country-specific African sender ID and bulk SMS operational requirements: https://help.africastalking.com/en/collections/150764-sms
- WhatsApp Business Platform pricing for current per-message, market, and category-based cost modeling: https://business.whatsapp.com/products/platform-pricing

## Per-App Deepening

- Data Plan Comparator: added data-buying scenarios and a price-per-GB, expiry, and USSD workflow.
- USSD Directory: added a low-data field-kit workflow for balance, data, support, and mobile money tasks.
- Airtime Value: added a resale safety and recovery planner with conversion scenarios.
- Mobile Money Fees: added Telecom-section guidance and quick payment-route scenarios.
- Data Usage Calculator: added remote-work and streaming-heavy sizing scenarios.
- Roaming Cost: added travel SIM and local-SIM breakeven decision scenarios.
- Internet Speed vs Cost: added broadband value guidance around cost per Mbps, caps, and installation cost.
- Fiber vs LTE vs 5G: added access-technology selection guidance.
- Number Portability: added operational switching checklist guidance.
- SIM Registration: added travel and compliance checklist guidance.
- TV Comparator: added household entertainment budget guidance and quick package scenarios.
- Starlink Compare: added satellite TCO and availability decision guidance.
- Business Internet: added office bandwidth, SLA, and redundancy guidance.
- Bulk SMS: added campaign cost, delivery, sender ID, and WhatsApp comparison guidance.
- WhatsApp vs SMS: added message-category strategy and official pricing links.

## Validation Notes

Recommended checks after this pass:

```bash
node --check assets/js/telecom-toolkit.js
node --check dashboard/telecom-workspace.js
npm run audit
npm run check-links
```

Executed in this pass:

- `node --check assets/js/telecom-toolkit.js`
- `node --check dashboard/telecom-workspace.js`
- `node --check assets/js/components/tool-registry.js`
- Dashboard inline script parse check
- Headless Chrome smoke for `/telecom/`
- Headless Chrome smoke for `/telecom/bulk-sms-pricing/`
- Headless Chrome save and invalid-PDF-gate interaction check
- Headless Chrome dashboard Telecom workspace injection check
- `npm run audit`
- `npm run check-links`

If touching generated assets or deploying, run the normal build or deploy artifact check from the release checklist.
