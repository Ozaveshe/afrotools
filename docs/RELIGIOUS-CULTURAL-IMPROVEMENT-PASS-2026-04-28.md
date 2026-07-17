# Religious & Cultural Improvement Pass - 2026-04-28

## Scope

- Category hub checked: `/religious-cultural/`.
- User-facing scope: 20 linked apps from that category page.
- Existing app pages upgraded: 5.
- Missing linked app routes created: 15.

## Product Issue Found

The Religious & Cultural hub linked many tools that did not exist as local `tools/<slug>/index.html` routes. The pass therefore prioritized turning every linked card into a usable app surface before polishing individual calculators.

## What Changed

- Added `assets/js/religious-cultural-apps.js`, a shared renderer with tool-specific calculator logic for all 20 Religious & Cultural apps.
- Added `assets/css/religious-cultural-apps.css` for the category workbench UI.
- Created missing app routes for the category cards rather than redirecting users to unrelated tools.
- Attached deep workbench sections to existing apps so their current calculators stay intact and gain a second planning layer.
- Updated `assets/js/components/tool-registry.js` so the category inventory reflects the expanded live tool set.
- Upgraded the `/religious-cultural/` homepage with a workflow command center, dashboard trail, saved-pack count, and three practical paths: Islamic year pack, ceremony budget pack, and family heritage pack.
- Added per-app competitor notes, AfroTools upgrade notes, connected next-app handoffs, save-to-dashboard actions, copy/print actions, and email-gated PDF exports.
- Wired saved Religious & Cultural packs into `dashboard/index.html` so My Workspace and the dashboard action center can surface local and account-synced packs.

## Online Feature Checks Used

- Zakat tools should separate cash, precious metals, business inventory, receivables, liabilities and nisab basis.
- Prayer and Ramadan tools should expose method, Asr school, Qibla direction, city/date planning and local timetable caveats.
- Halal compliance tools should account for application, supplier/ingredient evidence, audit, corrective actions and ongoing certification monitoring.
- Event, wedding, funeral and attire planners should expose guest count, vendor buckets, deposits, contingency, printable summaries and clear family handoffs.
- Name, proverb, calendar and age tools should show meaning, origin/context, date caveats, pronunciation or family notes where possible rather than random-only output.

## Competitor-Informed Per-App Pass

- `/tools/zakat-calculator/` - compared with Zakat.org/NZF-style calculators; added dashboard save, PDF zakat pack, African currency planning and finance/Hajj handoffs.
- `/tools/prayer-times/` - compared with IslamicFinder, Muslim Pro and Aladhan-style features; added method context, Qibla setup, saved reports and Ramadan/Islamic calendar handoffs.
- `/tools/ramadan-timetable/` - compared with prayer timetable apps; added buffer controls, last-ten-night markers, saved PDF handouts and local moon-sighting caveats.
- `/tools/halal-compliance/` - compared with halal certifier process pages; added evidence gaps, supplier/documentation actions, dashboard audit records and pre-audit PDF pack.
- `/tools/faraid-inheritance/` - compared with Faraid calculators; added funeral-cost handoff, family acknowledgment checklist, saved plan and review-ready PDF.
- `/tools/hajj-budget/` - compared with travel budget planners; added African-origin package planning, family savings pack and finance/zakat handoffs.
- `/tools/islamic-finance/` - compared with Murabaha/Islamic finance calculators; added side-by-side structure framing, saved decision pack and halal/zakat handoffs.
- `/tools/islamic-calendar/` - compared with Hijri converters; added moon-sighting caveats, community reminders, dashboard save and Ramadan/prayer handoffs.
- `/tools/tithe-calculator/` - compared with tithe calculators; added offerings, first fruits, charity buffer, dashboard save and PDF giving plan.
- `/tools/wedding-budget/` - compared with wedding/event budget tools; added family-pressure buffers, outfit handoffs, dashboard packs and PDF vendor summaries.
- `/tools/naming-ceremony/` - compared with event-planning checklists; added naming/baby-name handoff, family hosting notes and PDF family brief.
- `/tools/funeral-cost/` - compared with funeral cost calculators; added family transparency notes, estate/giving handoffs and contributor-ready PDF.
- `/tools/african-proverbs/` - compared with proverb databases; added use-case context, cultural credit cautions, teaching packs and heritage handoffs.
- `/tools/baby-name-generator/` - compared with name databases; added elder-confirmation prompts, family story notes, dashboard shortlists and naming ceremony handoff.
- `/tools/traditional-calendar/` - compared with calendar converters; added market-day context, official-date caveats, saved plans and festival handoff.
- `/tools/age-calculator-african/` - compared with date/age calculators; added day-name context, milestone notes and PDF family record.
- `/tools/festival-calendar/` - compared with festival/travel calendars; added respect notes, travel preparation, dashboard save and attire/calendar handoffs.
- `/tools/lobola-calculator/` - compared with lobola calculators; added meeting notes, symbolic-vs-cash separation, saved family summary and wedding/attire handoffs.
- `/tools/aso-ebi-cost/` - compared with sewing/event cost tools; added deposits, group tracker framing, dashboard save and wedding/traditional-attire handoffs.
- `/tools/traditional-attire/` - compared with tailoring cost tools; added fitting timeline reminders, tailor PDF brief and Aso-Ebi/festival handoffs.

## Per-App Upgrade Inventory

- `/tools/zakat-calculator/` - A practical zakat planner for African households and businesses. It separates liquid assets, trade goods, debts owed to you and liabilities, then checks the nisab threshold before estimating 2.5 percent zakat.
- `/tools/prayer-times/` - A city-based salah planning assistant that compares calculation methods and shows Qibla direction. It is designed for daily planning and should be checked against the local mosque timetable.
- `/tools/ramadan-timetable/` - Creates a working Ramadan timetable for family, mosque or WhatsApp group planning. It includes city presets, suhoor buffer, iftar buffer and milestone reminders.
- `/tools/halal-compliance/` - Adds an operator-focused action plan to the existing halal checker, turning the score into certification steps, evidence gaps and next audits.
- `/tools/faraid-inheritance/` - A guided Faraid planner for common household cases. It deducts funeral debts and estate costs, allocates fixed shares where applicable, and splits the residue between children.
- `/tools/hajj-budget/` - A pilgrimage budget planner that separates package, flight, visa, food, local transport, ihram and contingency so families can save month by month.
- `/tools/islamic-finance/` - A halal finance comparison tool for asset purchase, business equipment or vehicle finance. It shows the cash deposit, financed amount and monthly obligation under common structures.
- `/tools/islamic-calendar/` - Adds planning context to the existing Hijri converter: event windows, moon-sighting caveats and community calendar reminders.
- `/tools/tithe-calculator/` - Adds a giving plan that helps users separate tithe, freewill offering, first fruits and benevolence support without losing household budget visibility.
- `/tools/wedding-budget/` - A ceremony budget planner for African weddings with guest pressure, attire, food, family contribution and contingency built in.
- `/tools/naming-ceremony/` - A compact budget planner for baby naming ceremonies that handles food, gifts, officiant support, photography and family hospitality.
- `/tools/funeral-cost/` - A respectful planning tool for funeral cost decisions under pressure. It separates unavoidable costs from family hospitality and remembrance spending.
- `/tools/african-proverbs/` - Adds a practical use layer to the existing proverb generator: pick a use case and receive a proverb, context note and discussion prompt.
- `/tools/baby-name-generator/` - A name discovery tool that explains meaning, cultural origin and naming context instead of returning a random list.
- `/tools/traditional-calendar/` - A cultural calendar helper for market-day planning and community event context. It gives calculated estimates and clearly marks where local confirmation is needed.
- `/tools/age-calculator-african/` - A warm age calculator that pairs precise age with day-name context, milestone reminders and culturally sensitive naming notes.
- `/tools/festival-calendar/` - A festival planning assistant for travelers, creators and families. It highlights timing, likely preparation windows and respectful participation notes.
- `/tools/lobola-calculator/` - Adds a negotiation planner to the existing lobola calculator: cattle equivalent, cash envelope, family contribution split and meeting notes.
- `/tools/aso-ebi-cost/` - A group outfit calculator for weddings and ceremonies. It estimates fabric bundles, tailoring, accessories, delivery and the organizer cash gap.
- `/tools/traditional-attire/` - An attire planner for ceremonial outfits. It separates fabric, tailoring complexity, beadwork, shoes, gele or headwrap and rush fees.

## Validation Notes

Run after this script:

```bash
node scripts/enhance-religious-cultural-section.js
node --check assets/js/religious-cultural-apps.js
npm run check-links
npm run audit
```

If validation reports broad baseline debt, separate it from net-new failures on the 20 touched Religious & Cultural routes.
