(function () {
  'use strict';

  var TOOLS = [{"id":"zakat-calculator","category":"religious-cultural","parent":"/religious-cultural/","title":"Zakat Calculator","shortTitle":"Zakat Calculator","type":"zakat","summary":"A practical zakat planner for African households and businesses. It separates liquid assets, trade goods, debts owed to you and liabilities, then checks the nisab threshold before estimating 2.5 percent zakat.","tags":["Nisab threshold","Gold and silver","Business stock","Debt netting"],"inputs":{"currency":"NGN","cash":2500000,"goldGrams":20,"goldPrice":95000,"silverGrams":0,"silverPrice":1400,"inventory":800000,"receivables":150000,"liabilities":300000,"nisab":"silver"},"checklist":["Separate personal assets from business inventory before calculating.","Use a current local gold or silver quote for the nisab basis.","Deduct only due liabilities, not long-term debts that are not currently payable.","Ask a local scholar for edge cases such as pensions, crypto, shared assets or disputed receivables."],"sources":[{"label":"Zakat Foundation calculator categories","href":"https://www.zakat.org/resource-center/zakat-calculator"},{"label":"Zakat Foundation nisab explainer","href":"https://www.zakat.org/nisab-and-zakat-calculation-in-a-nutshell"}]},{"id":"prayer-times","category":"religious-cultural","parent":"/religious-cultural/","title":"Prayer Times and Qibla Planner","shortTitle":"Prayer Times Calculator","type":"prayer","summary":"A city-based salah planning assistant that compares calculation methods and shows Qibla direction. It is designed for daily planning and should be checked against the local mosque timetable.","tags":["Qibla bearing","MWL and Egypt methods","Asr school","City presets"],"inputs":{"city":"Lagos","method":"MWL","school":"standard","date":"2026-04-27"},"checklist":["Pick the closest city or enter coordinates in a future data pass.","Compare MWL, Egyptian and local mosque settings when Fajr or Isha differs.","Use Hanafi Asr where your community follows that school.","For Ramadan, publish the local mosque timetable as the final authority."],"sources":[{"label":"IslamicFinder Qibla settings","href":"https://www.islamicfinder.org/Qibla-Direction/"},{"label":"Prayer calculation methods","href":"https://praycalc.org/science/calculation-methods"}]},{"id":"ramadan-timetable","category":"religious-cultural","parent":"/religious-cultural/","title":"Ramadan Timetable Generator","shortTitle":"Ramadan Timetable","type":"ramadan","summary":"Creates a working Ramadan timetable for family, mosque or WhatsApp group planning. It includes city presets, suhoor buffer, iftar buffer and milestone reminders.","tags":["Suhoor and iftar","Last ten nights","Shareable plan","City presets"],"inputs":{"city":"Lagos","startDate":"2026-02-19","days":30,"suhoorBuffer":10,"iftarBuffer":0},"checklist":["Confirm the first day by local moon sighting or the official council.","Publish a short correction note if the start date moves by one day.","Add mosque-specific taraweeh and iftar distribution notes.","Keep a separate printable timetable for elders and community boards."],"sources":[{"label":"IslamicFinder Islamic events","href":"https://www.islamicfinder.org/locale/?language=en"},{"label":"Prayer app timetable features","href":"https://apps.apple.com/us/app/qibla-compass-kaaba-finder/id1231722856"}]},{"id":"halal-compliance","category":"religious-cultural","parent":"/religious-cultural/","title":"Halal Compliance Action Plan","shortTitle":"Halal Compliance","type":"scorecard","summary":"Adds an operator-focused action plan to the existing halal checker, turning the score into certification steps, evidence gaps and next audits.","tags":["Certification pathway","Supplier screening","Riba exposure","Audit evidence"],"inputs":{"revenueRisk":10,"financeRisk":25,"supplierEvidence":70,"documentation":50,"staffTraining":40},"checklist":["List every product, ingredient, supplier and financing facility.","Separate non-halal revenue before applying for certification.","Keep purchase orders, labels, cleaning logs and staff training records.","Ask the certifier for a pre-audit before packaging or restaurant launch."],"sources":[{"label":"SANHA background","href":"https://en.wikipedia.org/wiki/SANHA"}]},{"id":"faraid-inheritance","category":"religious-cultural","parent":"/religious-cultural/","title":"Islamic Inheritance Faraid Calculator","shortTitle":"Faraid Calculator","type":"faraid","summary":"A guided Faraid planner for common household cases. It deducts funeral debts and estate costs, allocates fixed shares where applicable, and splits the residue between children.","tags":["Fixed shares","Residue split","Estate debts","Scholar review"],"inputs":{"estate":12000000,"debts":1500000,"spouse":"wife","sons":2,"daughters":1,"father":1,"mother":1},"checklist":["Deduct funeral costs, debts and valid bequests before distribution.","Confirm whether there are excluded heirs or special local court requirements.","Use this for planning, then have a qualified scholar or Sharia court review the final distribution.","Record all heirs and obtain written family acknowledgment before payment."],"sources":[{"label":"Online Faraid feature reference","href":"https://www.zakat.org/resource-center/zakat-calculator"}]},{"id":"hajj-budget","category":"religious-cultural","parent":"/religious-cultural/","title":"Hajj and Umrah Budget Calculator","shortTitle":"Hajj Budget","type":"travelBudget","summary":"A pilgrimage budget planner that separates package, flight, visa, food, local transport, ihram and contingency so families can save month by month.","tags":["Hajj or Umrah","Savings target","Family plan","Contingency"],"inputs":{"origin":"NG","trip":"hajj","travelers":1,"package":"standard","days":21,"buffer":12},"checklist":["Confirm official operator packages and visa rules before paying deposits.","Add a family emergency buffer for medicine, laundry and extra transport.","Keep a separate Saudi riyal cash plan and card plan.","Save documents and payment receipts in one folder for the traveling group."],"sources":[{"label":"Prayer and Ramadan app feature reference","href":"https://apps.apple.com/us/app/qibla-compass-kaaba-finder/id1231722856"}]},{"id":"islamic-finance","category":"religious-cultural","parent":"/religious-cultural/","title":"Islamic Finance Profit Rate Calculator","shortTitle":"Islamic Finance","type":"islamicFinance","summary":"A halal finance comparison tool for asset purchase, business equipment or vehicle finance. It shows the cash deposit, financed amount and monthly obligation under common structures.","tags":["Murabaha","Ijarah","Musharakah","Deposit planning"],"inputs":{"currency":"NGN","assetCost":8000000,"deposit":20,"margin":12,"months":36,"partnerShare":30},"checklist":["Confirm the bank owns or constructively possesses the asset before Murabaha sale.","Check late payment clauses and insurance treatment.","Compare total obligation, not just monthly installment.","Keep Sharia board or product disclosure documents with the contract."],"sources":[{"label":"Zakat Finance calculator feature reference","href":"https://zakatfinance.com/zakat-calculator"}]},{"id":"islamic-calendar","category":"religious-cultural","parent":"/religious-cultural/","title":"Islamic Calendar Planning Layer","shortTitle":"Islamic Calendar","type":"culturePicker","summary":"Adds planning context to the existing Hijri converter: event windows, moon-sighting caveats and community calendar reminders.","tags":["Hijri adjustment","Event reminders","Moon sighting","Community calendar"],"inputs":{"culture":"islamic","purpose":"events","date":"2026-04-27"},"checklist":["Treat calculated Hijri dates as planning dates until local moon sighting is confirmed.","Publish both Gregorian and Hijri dates on flyers.","Add a one-day flexibility note for Eid and Ramadan events.","Share calendar exports with mosque admin and family groups."],"sources":[{"label":"IslamicFinder calendar events","href":"https://www.islamicfinder.org/locale/?language=en"}]},{"id":"tithe-calculator","category":"religious-cultural","parent":"/religious-cultural/","title":"Tithe and Offering Planning Workbench","shortTitle":"Tithe Calculator","type":"giving","summary":"Adds a giving plan that helps users separate tithe, freewill offering, first fruits and benevolence support without losing household budget visibility.","tags":["Gross or net","Monthly giving","First fruits","Charity buffer"],"inputs":{"currency":"NGN","income":650000,"basis":"gross","titheRate":10,"offering":3,"firstFruits":0,"frequency":"monthly"},"checklist":["Choose gross or net basis consistently with your church teaching.","Separate recurring tithe from one-off pledges.","Keep charity and family support visible in the same plan.","Review the plan when income changes, not only at year end."],"sources":[{"label":"Giving calculator feature reference","href":"https://zakatfinance.com/zakat-calculator"}]},{"id":"wedding-budget","category":"religious-cultural","parent":"/religious-cultural/","title":"African Wedding Budget Calculator","shortTitle":"Wedding Budget","type":"ceremonyBudget","summary":"A ceremony budget planner for African weddings with guest pressure, attire, food, family contribution and contingency built in.","tags":["Guest count","Family contribution","Venue and food","Contingency"],"inputs":{"country":"NG","guests":350,"style":"traditional","tier":"standard","buffer":12},"checklist":["Set a hard guest count before venue negotiation.","Separate family ceremony costs from couple reception costs.","Get vendor quotes in writing with payment milestones.","Protect a contingency line for fuel, power, rain plan and last-minute family requests."],"sources":[{"label":"Event budget planner feature reference","href":"https://www.eventbrite.com/blog/event-budget-template-ds00/"}]},{"id":"naming-ceremony","category":"religious-cultural","parent":"/religious-cultural/","title":"Naming Ceremony Budget Calculator","shortTitle":"Naming Ceremony","type":"ceremonyBudget","summary":"A compact budget planner for baby naming ceremonies that handles food, gifts, officiant support, photography and family hospitality.","tags":["Aqiqah or naming","Food and gifts","Officiant support","Family hosting"],"inputs":{"country":"NG","guests":80,"style":"naming","tier":"modest","buffer":10},"checklist":["Confirm the ceremony tradition and required items before shopping.","Separate baby gifts from food and family hosting.","Book photo or video only if it fits the household budget.","Keep a small emergency line for transport and extra chairs."],"sources":[{"label":"Event budget planner feature reference","href":"https://www.eventbrite.com/blog/event-budget-template-ds00/"}]},{"id":"funeral-cost","category":"religious-cultural","parent":"/religious-cultural/","title":"Funeral Cost Calculator","shortTitle":"Funeral Cost","type":"ceremonyBudget","summary":"A respectful planning tool for funeral cost decisions under pressure. It separates unavoidable costs from family hospitality and remembrance spending.","tags":["Burial essentials","Family hosting","Transport","Remembrance"],"inputs":{"country":"ZA","guests":180,"style":"funeral","tier":"standard","buffer":15},"checklist":["Identify legally required documents and burial permits first.","Separate mortuary, casket and burial costs from reception costs.","Assign one family member to approve spending changes.","Record contributions and expenses transparently to prevent conflict."],"sources":[{"label":"Event budget planner feature reference","href":"https://www.eventbrite.com/blog/event-budget-template-ds00/"}]},{"id":"african-proverbs","category":"religious-cultural","parent":"/religious-cultural/","title":"African Proverb Teaching Planner","shortTitle":"African Proverbs","type":"culturePicker","summary":"Adds a practical use layer to the existing proverb generator: pick a use case and receive a proverb, context note and discussion prompt.","tags":["Origin context","Lesson prompt","Speech line","Family discussion"],"inputs":{"culture":"Yoruba","purpose":"lesson","date":"2026-04-27"},"checklist":["Use the original language where you can verify it.","Do not flatten ethnic context into generic Africa copy.","Add a short explanation before using a proverb in teaching or speeches.","Credit the source community when publishing."],"sources":[{"label":"African proverb feature reference","href":"https://en.wikipedia.org/wiki/Proverb"}]},{"id":"baby-name-generator","category":"religious-cultural","parent":"/religious-cultural/","title":"African Baby Name Generator","shortTitle":"Baby Name Generator","type":"culturePicker","summary":"A name discovery tool that explains meaning, cultural origin and naming context instead of returning a random list.","tags":["Meaning filter","Culture context","Gender options","Family shortlist"],"inputs":{"culture":"Akan","purpose":"name","gender":"female","date":"2026-04-27"},"checklist":["Ask elders or fluent speakers to confirm spelling and pronunciation.","Keep both official-document spelling and home-language spelling if they differ.","Check meaning across dialects before final registration.","Create a shortlist with family story notes, not only aesthetics."],"sources":[{"label":"Naming tradition feature reference","href":"https://en.wikipedia.org/wiki/Akan_names"}]},{"id":"traditional-calendar","category":"religious-cultural","parent":"/religious-cultural/","title":"Traditional Calendar Converter","shortTitle":"Traditional Calendar","type":"traditionalCalendar","summary":"A cultural calendar helper for market-day planning and community event context. It gives calculated estimates and clearly marks where local confirmation is needed.","tags":["Market days","Ethiopian estimate","Event notes","Local confirmation"],"inputs":{"system":"igbo","date":"2026-04-27","purpose":"market"},"checklist":["Confirm market-day calculations with the local town calendar.","Use official Ethiopian conversion for legal or church dates.","Publish Gregorian and local calendar names side by side.","Record the village, dialect or church authority used for the calendar."],"sources":[{"label":"Calendar conversion feature reference","href":"https://www.islamicfinder.org/locale/?language=en"}]},{"id":"age-calculator-african","category":"religious-cultural","parent":"/religious-cultural/","title":"Age Calculator with African Name Day","shortTitle":"Age and Name Day","type":"ageNameDay","summary":"A warm age calculator that pairs precise age with day-name context, milestone reminders and culturally sensitive naming notes.","tags":["Exact age","Day name","Milestones","Family note"],"inputs":{"birthDate":"2000-01-01","gender":"female","culture":"Akan"},"checklist":["Use birth certificate date for legal calculations.","Treat day names as cultural suggestions, not universal rules.","Add local birthday or outdooring traditions where relevant.","Check leap-day birthdays and time-zone edge cases for official forms."],"sources":[{"label":"Akan naming reference","href":"https://en.wikipedia.org/wiki/Akan_names"}]},{"id":"festival-calendar","category":"religious-cultural","parent":"/religious-cultural/","title":"Cultural Festival Calendar","shortTitle":"Festival Calendar","type":"festival","summary":"A festival planning assistant for travelers, creators and families. It highlights timing, likely preparation windows and respectful participation notes.","tags":["Country filter","Month filter","Travel prep","Respect notes"],"inputs":{"country":"NG","month":"August","purpose":"travel"},"checklist":["Confirm dates from the official state, palace, church, mosque or festival committee.","Book transport and accommodation before announcing a group trip.","Respect dress, photography and sacred-space rules.","For content creators, ask permission before filming rituals or private family moments."],"sources":[{"label":"Festival planning reference","href":"https://en.wikipedia.org/wiki/List_of_festivals_in_Africa"}]},{"id":"lobola-calculator","category":"religious-cultural","parent":"/religious-cultural/","title":"Lobola Negotiation Planner","shortTitle":"Lobola Guide","type":"lobola","summary":"Adds a negotiation planner to the existing lobola calculator: cattle equivalent, cash envelope, family contribution split and meeting notes.","tags":["Cattle equivalent","Family envelope","Negotiation notes","Respect checklist"],"inputs":{"country":"ZA","cattle":8,"cattleValue":12000,"cashGifts":15000,"familySupport":25,"buffer":10},"checklist":["Agree who speaks for each family before discussing money.","Separate symbolic cattle value from actual cash flow.","Record what has been agreed and what remains ceremonial.","Keep the process respectful and avoid treating the bride as a transaction."],"sources":[{"label":"Lobola cultural background","href":"https://en.wikipedia.org/wiki/Lobolo"}]},{"id":"aso-ebi-cost","category":"religious-cultural","parent":"/religious-cultural/","title":"Aso-Ebi Group Outfit Cost Calculator","shortTitle":"Aso-Ebi Cost","type":"attireBudget","summary":"A group outfit calculator for weddings and ceremonies. It estimates fabric bundles, tailoring, accessories, delivery and the organizer cash gap.","tags":["Bulk fabric","Tailoring","Payment tracking","Delivery buffer"],"inputs":{"country":"NG","people":25,"fabricYards":6,"fabricPrice":4500,"tailoring":18000,"accessories":5000,"discount":8},"checklist":["Collect deposits before buying fabric.","Confirm measurements and pickup dates in writing.","Separate fabric cost from tailoring cost so late payments are clear.","Keep extra fabric for corrections and children sizes."],"sources":[{"label":"Event budget planner feature reference","href":"https://www.eventbrite.com/blog/event-budget-template-ds00/"}]},{"id":"traditional-attire","category":"religious-cultural","parent":"/religious-cultural/","title":"Traditional Attire Cost Calculator","shortTitle":"Traditional Attire","type":"attireBudget","summary":"An attire planner for ceremonial outfits. It separates fabric, tailoring complexity, beadwork, shoes, gele or headwrap and rush fees.","tags":["Fabric choice","Tailoring complexity","Accessories","Rush fee"],"inputs":{"country":"GH","people":1,"fabricYards":8,"fabricPrice":6500,"tailoring":42000,"accessories":12000,"discount":0},"checklist":["Choose outfit type before buying fabric length.","Ask tailor for fitting dates, not only delivery date.","Include accessories, shoes, headwrap and pressing in the budget.","Avoid rush tailoring unless the premium is explicit."],"sources":[{"label":"Event budget planner feature reference","href":"https://www.eventbrite.com/blog/event-budget-template-ds00/"}]}];
  var TOOL_MAP = TOOLS.reduce(function (acc, tool) {
    acc[tool.id] = tool;
    return acc;
  }, {});

  var CITY_TIMES = {
    Lagos: { lat: 6.5244, lon: 3.3792, fajr: '05:10', sunrise: '06:28', dhuhr: '12:45', asr: '15:58', maghrib: '18:52', isha: '20:03' },
    Nairobi: { lat: -1.2921, lon: 36.8219, fajr: '05:18', sunrise: '06:30', dhuhr: '12:32', asr: '15:51', maghrib: '18:35', isha: '19:42' },
    Cairo: { lat: 30.0444, lon: 31.2357, fajr: '04:02', sunrise: '05:25', dhuhr: '11:53', asr: '15:29', maghrib: '18:21', isha: '19:41' },
    Accra: { lat: 5.6037, lon: -0.1870, fajr: '04:48', sunrise: '05:58', dhuhr: '12:02', asr: '15:17', maghrib: '18:06', isha: '19:14' },
    Johannesburg: { lat: -26.2041, lon: 28.0473, fajr: '05:04', sunrise: '06:24', dhuhr: '12:05', asr: '15:14', maghrib: '17:47', isha: '19:01' },
    Casablanca: { lat: 33.5731, lon: -7.5898, fajr: '04:47', sunrise: '06:21', dhuhr: '13:28', asr: '17:11', maghrib: '20:28', isha: '21:52' }
  };

  var COUNTRY = {"NG":{"label":"Nigeria","multiplier":1,"currency":"NGN"},"KE":{"label":"Kenya","multiplier":0.92,"currency":"KES"},"ZA":{"label":"South Africa","multiplier":1.18,"currency":"ZAR"},"GH":{"label":"Ghana","multiplier":0.88,"currency":"GHS"},"EG":{"label":"Egypt","multiplier":0.72,"currency":"EGP"},"ET":{"label":"Ethiopia","multiplier":0.58,"currency":"ETB"},"TZ":{"label":"Tanzania","multiplier":0.66,"currency":"TZS"},"UG":{"label":"Uganda","multiplier":0.62,"currency":"UGX"},"RW":{"label":"Rwanda","multiplier":0.74,"currency":"RWF"},"CI":{"label":"Cote d'Ivoire","multiplier":0.82,"currency":"XOF"},"SN":{"label":"Senegal","multiplier":0.8,"currency":"XOF"},"MA":{"label":"Morocco","multiplier":0.86,"currency":"MAD"},"TN":{"label":"Tunisia","multiplier":0.78,"currency":"TND"},"AO":{"label":"Angola","multiplier":0.84,"currency":"AOA"},"CM":{"label":"Cameroon","multiplier":0.76,"currency":"XAF"}};
  var DAY_NAMES = {
    male: ['Kwasi', 'Kwadwo', 'Kwabena', 'Kwaku', 'Yaw', 'Kofi', 'Kwame'],
    female: ['Akosua', 'Adwoa', 'Abena', 'Akua', 'Yaa', 'Afia', 'Ama']
  };
  var CULTURE_ITEMS = {
    Yoruba: { text: 'A child carried on the back does not know how far the road is.', use: 'Use it for gratitude, leadership and unseen labor.' },
    Akan: { text: 'The one who climbs the good tree gets a push.', use: 'Use it for mentorship, school speeches and community support.' },
    Swahili: { text: 'Haraka haraka haina baraka.', use: 'Use it when teaching patience, craft and careful planning.' },
    Zulu: { text: 'A person is a person through other people.', use: 'Use it for teamwork, family and community care.' },
    Igbo: { text: 'When the moon is shining, the cripple becomes hungry for a walk.', use: 'Use it for opportunity, timing and courage.' },
    Islamic: { text: 'Calculated calendars help planning, but local sighting confirms sacred dates.', use: 'Use this as a caveat on mosque and family calendars.' }
  };
  var FESTIVALS = {
    NG: ['Osun-Osogbo in August', 'Durbar around Eid seasons', 'New Yam festivals across many Igbo communities'],
    GH: ['Homowo around August', 'Aboakyer around May', 'Hogbetsotso around November'],
    ZA: ['National Arts Festival around June or July', 'Zulu Reed Dance around late winter', 'Cape Town Carnival around March'],
    KE: ['Lamu Cultural Festival often late year', 'Mombasa Carnival season', 'Maralal Camel Derby season'],
    ET: ['Timkat in January', 'Meskel in September', 'Genna in January']
  };
  var DASHBOARD_STORAGE_KEY = 'afro_religious_cultural_workspace';
  var LEAD_EMAIL_KEY = 'afrotools_lead_email';
  var CATEGORY_LEAD_KEY = 'afro_rc_pdf_email';

  var ENHANCEMENTS = {
    'zakat-calculator': {
      workflow: 'Islamic giving and wealth plan',
      competitor: 'Zakat.org and NZF-style calculators separate cash, metals, business stock, receivables, liabilities and nisab basis.',
      upgrade: 'AfroTools now adds African currencies, business-asset caveats, saved dashboard reports, a PDF zakat pack, and handoffs into Islamic finance and Hajj savings.',
      reportTitle: 'Zakat obligation pack',
      nextTools: [
        { label: 'Check halal finance', href: '/tools/islamic-finance/', reason: 'test debt, markup and asset-purchase structure before the next zakat year' },
        { label: 'Plan Hajj savings', href: '/tools/hajj-budget/', reason: 'turn giving and savings capacity into a pilgrimage target' }
      ]
    },
    'prayer-times': {
      workflow: 'Daily worship planning',
      competitor: 'IslamicFinder, Muslim Pro and Aladhan expose city lookup, Qibla, methods, Asr school and timetable adjustments.',
      upgrade: 'AfroTools adds method comparison notes, mosque timetable caveats, saved prayer setup, and a Ramadan timetable handoff.',
      reportTitle: 'Prayer times setup',
      nextTools: [
        { label: 'Build Ramadan timetable', href: '/tools/ramadan-timetable/', reason: 'reuse the city and method choices for suhoor and iftar planning' },
        { label: 'Open Islamic calendar', href: '/tools/islamic-calendar/', reason: 'pair daily prayers with Hijri event planning' }
      ]
    },
    'ramadan-timetable': {
      workflow: 'Ramadan family and mosque timetable',
      competitor: 'Prayer timetable apps focus on daily prayer rows, monthly calendars and shareable Ramadan schedules.',
      upgrade: 'AfroTools adds buffer controls, last-ten-night markers, dashboard saves, PDF handouts and caveats for local moon sighting.',
      reportTitle: 'Ramadan timetable pack',
      nextTools: [
        { label: 'Confirm prayer settings', href: '/tools/prayer-times/', reason: 'review Fajr, Isha and Asr method assumptions' },
        { label: 'Plan Eid and festivals', href: '/tools/festival-calendar/', reason: 'prepare travel, family visits and community events' }
      ]
    },
    'halal-compliance': {
      workflow: 'Halal certification readiness',
      competitor: 'Halal certifiers emphasize applications, ingredient review, supplier proof, audit visits, corrective actions and ongoing monitoring.',
      upgrade: 'AfroTools turns the score into an evidence checklist, supplier and finance gaps, dashboard audit records and a PDF pre-audit pack.',
      reportTitle: 'Halal compliance action plan',
      nextTools: [
        { label: 'Check Islamic finance', href: '/tools/islamic-finance/', reason: 'review riba exposure before certification conversations' },
        { label: 'Estimate zakat', href: '/tools/zakat-calculator/', reason: 'keep business inventory and receivables visible for annual giving' }
      ]
    },
    'faraid-inheritance': {
      workflow: 'Estate and family distribution plan',
      competitor: 'Faraid calculators usually collect heirs, estate value, debts and fixed-share rules before showing residue splits.',
      upgrade: 'AfroTools adds funeral-cost handoff, family acknowledgment checklist, saved dashboard plans and a review-ready PDF summary.',
      reportTitle: 'Faraid estate planning pack',
      nextTools: [
        { label: 'Estimate funeral cost', href: '/tools/funeral-cost/', reason: 'separate funeral obligations before distribution' },
        { label: 'Review zakat assets', href: '/tools/zakat-calculator/', reason: 'classify cash, inventory and receivables before estate conversations' }
      ]
    },
    'hajj-budget': {
      workflow: 'Pilgrimage savings plan',
      competitor: 'Travel planners usually split package, flight, visa, hotel, food, transport and contingency costs.',
      upgrade: 'AfroTools adds African-origin multipliers, family traveler planning, dashboard savings records, PDF packs and giving/finance handoffs.',
      reportTitle: 'Hajj and Umrah budget pack',
      nextTools: [
        { label: 'Calculate zakat first', href: '/tools/zakat-calculator/', reason: 'keep annual giving clear before pilgrimage savings' },
        { label: 'Compare halal financing', href: '/tools/islamic-finance/', reason: 'avoid risky borrowing or unclear payment structures' }
      ]
    },
    'islamic-finance': {
      workflow: 'Halal asset purchase plan',
      competitor: 'Murabaha and Islamic finance calculators emphasize asset cost, deposit, markup, tenor, ownership and lease structures.',
      upgrade: 'AfroTools compares Murabaha, Ijarah and Musharakah side by side, then saves a PDF decision pack for bank or family review.',
      reportTitle: 'Islamic finance comparison pack',
      nextTools: [
        { label: 'Run halal compliance', href: '/tools/halal-compliance/', reason: 'check business certification risks around finance and suppliers' },
        { label: 'Review zakat effect', href: '/tools/zakat-calculator/', reason: 'understand asset and liability treatment before year end' }
      ]
    },
    'islamic-calendar': {
      workflow: 'Hijri event planning',
      competitor: 'Hijri converters expose date conversion, Islamic events and local date-adjustment caveats.',
      upgrade: 'AfroTools adds community event reminders, moon-sighting flexibility notes, dashboard saves, and Ramadan/prayer handoffs.',
      reportTitle: 'Islamic calendar planning pack',
      nextTools: [
        { label: 'Build Ramadan timetable', href: '/tools/ramadan-timetable/', reason: 'turn Hijri planning into a family or mosque schedule' },
        { label: 'Check prayer times', href: '/tools/prayer-times/', reason: 'pair dates with city prayer settings' }
      ]
    },
    'tithe-calculator': {
      workflow: 'Giving and pledge plan',
      competitor: 'Tithe calculators usually support income basis, percentage giving, recurring frequency and annual totals.',
      upgrade: 'AfroTools adds offering, first fruits, charity buffer, dashboard saves and a PDF giving plan without hiding household income remaining.',
      reportTitle: 'Tithe and offering plan',
      nextTools: [
        { label: 'Plan a ceremony budget', href: '/tools/wedding-budget/', reason: 'keep pledges visible beside upcoming family obligations' },
        { label: 'Estimate funeral support', href: '/tools/funeral-cost/', reason: 'prepare benevolence or family-support envelopes' }
      ]
    },
    'wedding-budget': {
      workflow: 'Ceremony budget control',
      competitor: 'Wedding and event budget tools emphasize guest count, vendor categories, deposits, contingency and printable checklists.',
      upgrade: 'AfroTools adds African ceremony types, family-pressure buffers, outfit handoffs, dashboard packs and PDF vendor summaries.',
      reportTitle: 'African wedding budget pack',
      nextTools: [
        { label: 'Price Aso-Ebi', href: '/tools/aso-ebi-cost/', reason: 'turn the outfit line into a group payment plan' },
        { label: 'Plan traditional attire', href: '/tools/traditional-attire/', reason: 'separate fabric, tailoring and accessories' },
        { label: 'Prepare lobola notes', href: '/tools/lobola-calculator/', reason: 'align ceremony budget with family negotiation commitments' }
      ]
    },
    'naming-ceremony': {
      workflow: 'Baby naming and family hosting',
      competitor: 'Event planners focus on guest list, food, gifts, photography, officiant support and contingency.',
      upgrade: 'AfroTools ties aqiqah, church and local naming costs into baby-name meaning, dashboard saves and a PDF family brief.',
      reportTitle: 'Naming ceremony plan',
      nextTools: [
        { label: 'Choose baby names', href: '/tools/baby-name-generator/', reason: 'shortlist names with meaning and family notes' },
        { label: 'Check age and name day', href: '/tools/age-calculator-african/', reason: 'add day-name context to the program' }
      ]
    },
    'funeral-cost': {
      workflow: 'Funeral and family support plan',
      competitor: 'Funeral calculators split service, burial, transport, casket, hospitality and remembrance costs.',
      upgrade: 'AfroTools adds tradition-sensitive cost buckets, family transparency notes, dashboard saves and a PDF handoff for contributors.',
      reportTitle: 'Funeral cost and family support pack',
      nextTools: [
        { label: 'Review Faraid estate', href: '/tools/faraid-inheritance/', reason: 'separate estate distribution from immediate funeral obligations' },
        { label: 'Plan giving support', href: '/tools/tithe-calculator/', reason: 'record church or family benevolence envelopes' }
      ]
    },
    'african-proverbs': {
      workflow: 'Heritage teaching and speech notes',
      competitor: 'Proverb sites usually list sayings, origins, translations and broad categories.',
      upgrade: 'AfroTools adds use cases, context cautions, dashboard saves, PDF teaching notes and handoffs into names and festivals.',
      reportTitle: 'African proverb teaching pack',
      nextTools: [
        { label: 'Find names with meaning', href: '/tools/baby-name-generator/', reason: 'carry heritage language into family naming notes' },
        { label: 'Plan festival context', href: '/tools/festival-calendar/', reason: 'connect teaching material to living cultural events' }
      ]
    },
    'baby-name-generator': {
      workflow: 'Name meaning shortlist',
      competitor: 'Name databases focus on meaning, origin, gender, usage and sometimes pronunciation.',
      upgrade: 'AfroTools adds elder-confirmation prompts, family story notes, dashboard shortlists and a PDF naming brief.',
      reportTitle: 'African baby name shortlist',
      nextTools: [
        { label: 'Budget naming ceremony', href: '/tools/naming-ceremony/', reason: 'move from shortlist to event plan' },
        { label: 'Check name day', href: '/tools/age-calculator-african/', reason: 'pair the name with weekday context where relevant' }
      ]
    },
    'traditional-calendar': {
      workflow: 'Traditional date and market-day plan',
      competitor: 'Calendar converters focus on date conversion, local cycles and official caveats.',
      upgrade: 'AfroTools adds market-day context, Ethiopian and Coptic caveats, dashboard saves and event-planning handoffs.',
      reportTitle: 'Traditional calendar planning pack',
      nextTools: [
        { label: 'Open festival calendar', href: '/tools/festival-calendar/', reason: 'turn date context into travel and community planning' },
        { label: 'Check age and name day', href: '/tools/age-calculator-african/', reason: 'add family milestone context' }
      ]
    },
    'age-calculator-african': {
      workflow: 'Age, milestone and name-day note',
      competitor: 'Age calculators usually return exact age, next birthday, weekday and date differences.',
      upgrade: 'AfroTools adds Akan day-name context, cultural cautions, milestone notes, dashboard saves and PDF family records.',
      reportTitle: 'Age and name-day pack',
      nextTools: [
        { label: 'Find baby names', href: '/tools/baby-name-generator/', reason: 'build a meaning shortlist from the birth context' },
        { label: 'Check calendar context', href: '/tools/traditional-calendar/', reason: 'compare local calendar and market-day notes' }
      ]
    },
    'festival-calendar': {
      workflow: 'Festival travel and respect plan',
      competitor: 'Festival calendars usually filter by destination, month, event type, travel timing and participation notes.',
      upgrade: 'AfroTools adds country/month planning, respect rules, dashboard saves, PDF travel briefs and ceremony handoffs.',
      reportTitle: 'African festival planning pack',
      nextTools: [
        { label: 'Check traditional date', href: '/tools/traditional-calendar/', reason: 'confirm local calendar timing before travel' },
        { label: 'Plan attire budget', href: '/tools/traditional-attire/', reason: 'prepare respectful clothing and accessories' }
      ]
    },
    'lobola-calculator': {
      workflow: 'Family negotiation plan',
      competitor: 'Lobola tools usually estimate cattle equivalent, cash value and negotiation context.',
      upgrade: 'AfroTools adds speakers, meeting notes, symbolic-vs-cash separation, dashboard saves and a PDF family summary.',
      reportTitle: 'Lobola negotiation pack',
      nextTools: [
        { label: 'Build wedding budget', href: '/tools/wedding-budget/', reason: 'connect family commitments to reception cash flow' },
        { label: 'Plan attire', href: '/tools/traditional-attire/', reason: 'separate ceremonial clothing from negotiation envelopes' }
      ]
    },
    'aso-ebi-cost': {
      workflow: 'Group outfit payment plan',
      competitor: 'Sewing and event budget tools split fabric, labor, notions, accessories, deposits and delivery timing.',
      upgrade: 'AfroTools adds group quantities, deposit discipline, dashboard saves, PDF payment trackers and wedding handoffs.',
      reportTitle: 'Aso-Ebi group outfit pack',
      nextTools: [
        { label: 'Open wedding budget', href: '/tools/wedding-budget/', reason: 'roll outfit costs back into the ceremony budget' },
        { label: 'Price individual attire', href: '/tools/traditional-attire/', reason: 'compare group and individual tailoring costs' }
      ]
    },
    'traditional-attire': {
      workflow: 'Ceremonial outfit cost plan',
      competitor: 'Tailoring calculators usually include fabric, labor, accessories, rush fees and fitting timelines.',
      upgrade: 'AfroTools adds African garment context, fitting reminders, dashboard saves, PDF tailor briefs and festival/wedding handoffs.',
      reportTitle: 'Traditional attire cost pack',
      nextTools: [
        { label: 'Compare Aso-Ebi', href: '/tools/aso-ebi-cost/', reason: 'see whether group buying changes the budget' },
        { label: 'Open festival calendar', href: '/tools/festival-calendar/', reason: 'match outfit timing to the event calendar' }
      ]
    }
  };

  var HUB_WORKFLOWS = [
    {
      title: 'Islamic year pack',
      copy: 'Start with prayer settings, generate Ramadan dates, calculate zakat, then save a PDF-ready giving and family calendar.',
      steps: [
        { label: 'Prayer Times', href: '/tools/prayer-times/' },
        { label: 'Ramadan Timetable', href: '/tools/ramadan-timetable/' },
        { label: 'Zakat Calculator', href: '/tools/zakat-calculator/' },
        { label: 'Islamic Calendar', href: '/tools/islamic-calendar/' }
      ]
    },
    {
      title: 'Ceremony budget pack',
      copy: 'Move from guest count to clothing, family contribution and printable vendor notes without losing the dashboard trail.',
      steps: [
        { label: 'Wedding Budget', href: '/tools/wedding-budget/' },
        { label: 'Aso-Ebi Cost', href: '/tools/aso-ebi-cost/' },
        { label: 'Traditional Attire', href: '/tools/traditional-attire/' },
        { label: 'Lobola Guide', href: '/tools/lobola-calculator/' }
      ]
    },
    {
      title: 'Family heritage pack',
      copy: 'Build names, proverbs, dates and festival notes into a respectful family brief that can be saved or exported.',
      steps: [
        { label: 'Baby Names', href: '/tools/baby-name-generator/' },
        { label: 'Age and Name Day', href: '/tools/age-calculator-african/' },
        { label: 'African Proverbs', href: '/tools/african-proverbs/' },
        { label: 'Festival Calendar', href: '/tools/festival-calendar/' }
      ]
    }
  ];

  function injectCss() {
    if (document.querySelector('link[href="/assets/css/religious-cultural-apps.css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/css/religious-cultural-apps.css';
    document.head.appendChild(link);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function cleanText(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function safeHref(href) {
    var text = cleanText(href);
    if (!text) return '/religious-cultural/';
    if (text.charAt(0) === '/' || text.charAt(0) === '#') return text.replace(/"/g, '%22');
    return '/religious-cultural/';
  }

  function safeFileName(value) {
    return cleanText(value || 'religious-cultural-pack').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'religious-cultural-pack';
  }

  function getEnhancement(tool) {
    return ENHANCEMENTS[tool.id] || {
      workflow: 'Religious and cultural planning',
      competitor: 'Comparable tools usually solve only one calculation.',
      upgrade: 'AfroTools connects the result to dashboard saves, PDF exports and the next practical step.',
      reportTitle: tool.shortTitle + ' pack',
      nextTools: []
    };
  }

  function readDashboardItems() {
    try {
      var items = JSON.parse(localStorage.getItem(DASHBOARD_STORAGE_KEY) || '[]');
      return Array.isArray(items) ? items.filter(function (item) { return item && item.id; }) : [];
    } catch (err) {
      return [];
    }
  }

  function writeDashboardItems(items) {
    try {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(items.slice(0, 30)));
      return true;
    } catch (err) {
      return false;
    }
  }

  function getStoredLeadEmail() {
    try {
      return localStorage.getItem(CATEGORY_LEAD_KEY) || localStorage.getItem(LEAD_EMAIL_KEY) || localStorage.getItem('afrotools-email-gate') || '';
    } catch (err) {
      return '';
    }
  }

  function rememberLead(data) {
    try {
      localStorage.setItem(CATEGORY_LEAD_KEY, data.email);
      localStorage.setItem(LEAD_EMAIL_KEY, data.email);
      localStorage.setItem('afrotools-email-gate', data.email);
    } catch (err) {}
  }

  function getAuthEmail() {
    try {
      if (window.AfroAuth && typeof AfroAuth.getUser === 'function') {
        var user = AfroAuth.getUser();
        if (user && user.email) return user.email;
      }
    } catch (err) {}
    return '';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanText(email));
  }

  function captureLead(tool, data) {
    var payload = {
      email: data.email,
      source: 'religious-cultural-pdf-gate',
      toolSlug: tool.id,
      optInDigest: true,
      name: data.name || null,
      industry: 'Other',
      pageUrl: window.location.href,
      referrerUrl: document.referrer || null,
      conversionValue: 0
    };
    try {
      if (window.AfroTools && typeof AfroTools.captureLeadEnriched === 'function') {
        AfroTools.captureLeadEnriched(payload);
      } else if (window.fetch) {
        fetch('/api/capture-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(function () {});
      }
      if (window.fetch) {
        fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            'form-name': 'pdf-leads',
            email: data.email,
            name: data.name || '',
            source: 'religious-cultural-pdf-gate',
            tool: tool.id,
            page: window.location.pathname
          }).toString()
        }).catch(function () {});
      }
    } catch (err) {}
  }

  function flashButton(button, text, keepDisabled) {
    if (!button) return;
    var original = button.getAttribute('data-original-label') || button.textContent;
    button.setAttribute('data-original-label', original);
    button.textContent = text;
    button.disabled = !!keepDisabled;
    window.setTimeout(function () {
      button.textContent = original;
      button.disabled = false;
    }, 1600);
  }

  function money(value, currency) {
    var amount = Number(value) || 0;
    var code = currency || 'USD';
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(amount);
    } catch (err) {
      return code + ' ' + Math.round(amount).toLocaleString();
    }
  }

  function pct(value) {
    return (Number(value) || 0).toFixed(1) + '%';
  }

  function num(value) {
    return Math.round(Number(value) || 0).toLocaleString();
  }

  function minutesToTime(base, shift) {
    var parts = String(base).split(':').map(Number);
    var total = (parts[0] * 60 + parts[1] + (shift || 0) + 1440) % 1440;
    var h = Math.floor(total / 60);
    var m = total % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function bearingToKaaba(lat, lon) {
    var kaabaLat = 21.4225 * Math.PI / 180;
    var kaabaLon = 39.8262 * Math.PI / 180;
    var phi = lat * Math.PI / 180;
    var lambda = lon * Math.PI / 180;
    var y = Math.sin(kaabaLon - lambda);
    var x = Math.cos(phi) * Math.tan(kaabaLat) - Math.sin(phi) * Math.cos(kaabaLon - lambda);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }

  function calc(tool, v) {
    var cur = v.currency || (COUNTRY[v.country] && COUNTRY[v.country].currency) || 'USD';
    switch (tool.type) {
      case 'zakat': {
        var assets = v.cash + v.goldGrams * v.goldPrice + v.silverGrams * v.silverPrice + v.inventory + v.receivables;
        var net = Math.max(0, assets - v.liabilities);
        var nisab = v.nisab === 'gold' ? 85 * v.goldPrice : 595 * v.silverPrice;
        var due = net >= nisab ? net * 0.025 : 0;
        return {
          metrics: [['Zakatable assets', money(assets, cur)], ['Net after liabilities', money(net, cur)], ['Selected nisab', money(nisab, cur)], ['Estimated zakat', money(due, cur)]],
          verdict: due > 0 ? 'Your net zakatable assets meet the selected nisab. Estimate zakat at 2.5 percent, then confirm edge cases locally.' : 'The current inputs do not meet the selected nisab threshold.',
          rows: [['Gold value', money(v.goldGrams * v.goldPrice, cur)], ['Silver value', money(v.silverGrams * v.silverPrice, cur)], ['Business and receivables', money(v.inventory + v.receivables, cur)]]
        };
      }
      case 'prayer': {
        var city = CITY_TIMES[v.city] || CITY_TIMES.Lagos;
        var methodShift = { MWL: 0, Egypt: -4, ISNA: 8, UmmQura: 5 }[v.method] || 0;
        var asrShift = v.school === 'hanafi' ? 35 : 0;
        var qibla = bearingToKaaba(city.lat, city.lon);
        return {
          metrics: [['Fajr', minutesToTime(city.fajr, methodShift)], ['Dhuhr', city.dhuhr], ['Asr', minutesToTime(city.asr, asrShift)], ['Qibla bearing', qibla.toFixed(1) + ' deg']],
          verdict: 'Planning estimate for ' + v.city + '. Confirm with your local mosque, especially for Fajr, Isha and Ramadan.',
          rows: [['Sunrise', city.sunrise], ['Maghrib', city.maghrib], ['Isha', minutesToTime(city.isha, methodShift)], ['Method', v.method + ', ' + v.school + ' Asr']]
        };
      }
      case 'ramadan': {
        var base = CITY_TIMES[v.city] || CITY_TIMES.Lagos;
        var days = Math.min(30, Math.max(1, v.days || 30));
        var sample = [];
        for (var i = 0; i < Math.min(days, 7); i++) {
          sample.push(['Day ' + (i + 1), 'Suhoor stop ' + minutesToTime(base.fajr, -Math.abs(v.suhoorBuffer || 0) + i), 'Iftar ' + minutesToTime(base.maghrib, (v.iftarBuffer || 0) + i)]);
        }
        return {
          metrics: [['City', v.city], ['Ramadan days', days], ['Last ten nights start', 'Day ' + Math.max(1, days - 9)], ['Eid planning', 'Day ' + (days + 1)]],
          verdict: 'Generated a working timetable from ' + v.startDate + '. Adjust by local moon sighting before publishing.',
          rows: sample
        };
      }
      case 'scorecard': {
        var score = 100 - v.revenueRisk - v.financeRisk + v.supplierEvidence * 0.12 + v.documentation * 0.10 + v.staffTraining * 0.08;
        score = Math.max(0, Math.min(100, score));
        return {
          metrics: [['Readiness score', Math.round(score) + '/100'], ['Supplier evidence', pct(v.supplierEvidence)], ['Documentation', pct(v.documentation)], ['Training', pct(v.staffTraining)]],
          verdict: score >= 75 ? 'Strong certification readiness. Book a pre-audit and close remaining evidence gaps.' : score >= 50 ? 'Moderate readiness. Fix supplier evidence and finance exposure before applying.' : 'High compliance risk. Build documentation and remove major non-halal exposure first.',
          rows: [['Revenue risk deduction', pct(v.revenueRisk)], ['Finance risk deduction', pct(v.financeRisk)], ['Fastest improvement', 'Supplier certificates plus written SOPs']]
        };
      }
      case 'faraid': {
        var estate = Math.max(0, v.estate - v.debts);
        var fixed = 0;
        var spouseShare = v.spouse === 'husband' ? (v.sons + v.daughters > 0 ? 0.25 : 0.5) : v.spouse === 'wife' ? (v.sons + v.daughters > 0 ? 0.125 : 0.25) : 0;
        var motherShare = v.mother ? (v.sons + v.daughters > 0 ? 1 / 6 : 1 / 3) : 0;
        var fatherShare = v.father && (v.sons + v.daughters > 0) ? 1 / 6 : 0;
        fixed = spouseShare + motherShare + fatherShare;
        var residue = Math.max(0, estate * (1 - fixed));
        var childUnits = v.sons * 2 + v.daughters;
        var sonShare = childUnits ? residue * 2 / childUnits : 0;
        var daughterShare = childUnits ? residue / childUnits : 0;
        return {
          metrics: [['Net estate', money(estate, 'USD')], ['Spouse share', money(estate * spouseShare, 'USD')], ['Mother share', money(estate * motherShare, 'USD')], ['Residue', money(residue, 'USD')]],
          verdict: 'Simplified common-case estimate. Faraid can change with siblings, grandparents, multiple wives, bequests and local court procedure.',
          rows: [['Father share', money(estate * fatherShare, 'USD')], ['Each son estimate', money(sonShare, 'USD')], ['Each daughter estimate', money(daughterShare, 'USD')]]
        };
      }
      case 'travelBudget': {
        var origin = COUNTRY[v.origin] || COUNTRY.NG;
        var packageBase = { economy: 4200, standard: 6200, premium: 9800 }[v.package] || 6200;
        var tripFactor = v.trip === 'umrah' ? 0.42 : 1;
        var daily = v.days * 45;
        var subtotal = (packageBase * tripFactor + daily) * v.travelers * origin.multiplier;
        var total = subtotal * (1 + v.buffer / 100);
        return {
          metrics: [['Estimated total', money(total, 'USD')], ['Per traveler', money(total / Math.max(1, v.travelers), 'USD')], ['Buffer', pct(v.buffer)], ['Origin', origin.label]],
          verdict: 'Use this as a savings target. Official operator packages, exchange rates and visa rules can move materially.',
          rows: [['Base package', money(packageBase * tripFactor * origin.multiplier, 'USD')], ['Food and local spend', money(daily * v.travelers, 'USD')], ['Contingency value', money(total - subtotal, 'USD')]]
        };
      }
      case 'islamicFinance': {
        var financed = Math.max(0, v.assetCost * (1 - v.deposit / 100));
        var murabahaTotal = financed * (1 + v.margin / 100);
        var monthly = murabahaTotal / Math.max(1, v.months);
        var partner = v.assetCost * v.partnerShare / 100;
        return {
          metrics: [['Financed amount', money(financed, cur)], ['Murabaha monthly', money(monthly, cur)], ['Total markup', money(murabahaTotal - financed, cur)], ['Partner equity', money(partner, cur)]],
          verdict: 'Compare structure, ownership, late clauses and total obligation before choosing the lowest monthly number.',
          rows: [['Deposit', money(v.assetCost * v.deposit / 100, cur)], ['Ijarah planning rent', money(financed / v.months * 1.08, cur)], ['Musharakah bank share', pct(100 - v.partnerShare)]]
        };
      }
      case 'giving': {
        var tithe = v.income * v.titheRate / 100;
        var offering = v.income * v.offering / 100;
        var first = v.income * v.firstFruits / 100;
        var total = tithe + offering + first;
        return {
          metrics: [['Tithe', money(tithe, cur)], ['Offering', money(offering, cur)], ['First fruits', money(first, cur)], ['Total giving', money(total, cur)]],
          verdict: 'This plan uses ' + v.basis + ' income and a ' + v.frequency + ' rhythm. Keep pledges separate from recurring giving.',
          rows: [['Annualized giving', money(v.frequency === 'monthly' ? total * 12 : total, cur)], ['Giving as income share', pct(total / Math.max(1, v.income) * 100)], ['Remaining income', money(v.income - total, cur)]]
        };
      }
      case 'ceremonyBudget': {
        var country = COUNTRY[v.country] || COUNTRY.NG;
        var styleBase = { traditional: 48, white: 55, nikah: 42, naming: 18, funeral: 35, church: 45 }[v.style] || 40;
        var tier = { modest: 0.7, standard: 1, premium: 1.65 }[v.tier] || 1;
        var guestCost = v.guests * styleBase * tier * country.multiplier;
        var fixed = (v.style === 'funeral' ? 1800 : v.style === 'naming' ? 650 : 4200) * tier * country.multiplier;
        var total = (guestCost + fixed) * (1 + v.buffer / 100);
        return {
          metrics: [['Estimated budget', money(total, 'USD')], ['Per guest', money(total / Math.max(1, v.guests), 'USD')], ['Guest count', num(v.guests)], ['Buffer', pct(v.buffer)]],
          verdict: 'The guest list drives the budget. Lock guest count and fixed family obligations before paying vendors.',
          rows: [['Food and hospitality', money(guestCost * 0.48, 'USD')], ['Venue, logistics and rentals', money(guestCost * 0.25 + fixed * 0.35, 'USD')], ['Attire, media and ceremony items', money(total * 0.22, 'USD')]]
        };
      }
      case 'culturePicker': {
        var item = CULTURE_ITEMS[v.culture] || CULTURE_ITEMS.Yoruba;
        return {
          metrics: [['Selected culture', v.culture], ['Use case', v.purpose || 'planning'], ['Date note', v.date || 'Today'], ['Confidence', 'Context needed']],
          verdict: item.text + ' ' + item.use,
          rows: [['Context action', 'Verify spelling, dialect and community context.'], ['Best use', 'Teaching, family discussion, captions or ceremony program.'], ['Avoid', 'Publishing sacred or private context without permission.']]
        };
      }
      case 'traditionalCalendar': {
        var d = new Date(v.date || Date.now());
        var marketDays = ['Eke', 'Orie', 'Afo', 'Nkwo'];
        var market = marketDays[Math.abs(Math.floor(d.getTime() / 86400000)) % 4];
        var ethYear = d.getFullYear() - (d.getMonth() < 8 || (d.getMonth() === 8 && d.getDate() < 11) ? 8 : 7);
        return {
          metrics: [['System', v.system], ['Estimated market day', market], ['Ethiopian year estimate', ethYear], ['Purpose', v.purpose]],
          verdict: 'Use this as an estimate. Traditional calendars often require town, church or palace confirmation.',
          rows: [['Igbo cycle', 'Eke, Orie, Afo, Nkwo'], ['Ethiopian caveat', 'Legal conversion needs an official converter.'], ['Publishing note', 'Show Gregorian date beside local date.']]
        };
      }
      case 'ageNameDay': {
        var b = new Date(v.birthDate || Date.now());
        var today = new Date();
        var age = today.getFullYear() - b.getFullYear();
        if (today.getMonth() < b.getMonth() || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age -= 1;
        var names = DAY_NAMES[v.gender] || DAY_NAMES.female;
        var dayName = names[b.getDay()];
        return {
          metrics: [['Exact age', age + ' years'], ['Birth weekday', b.toLocaleDateString('en', { weekday: 'long' })], ['Akan day name', dayName], ['Culture', v.culture]],
          verdict: 'Day-name suggestion only. Confirm family, language and spelling preferences before registration.',
          rows: [['Next birthday', new Date(today.getFullYear() + (today > new Date(today.getFullYear(), b.getMonth(), b.getDate()) ? 1 : 0), b.getMonth(), b.getDate()).toDateString()], ['Milestone note', age < 18 ? 'Child and school planning' : 'Adult records and family milestones'], ['Document note', 'Use legal birth date for forms.']]
        };
      }
      case 'festival': {
        var list = FESTIVALS[v.country] || FESTIVALS.NG;
        return {
          metrics: [['Country', (COUNTRY[v.country] && COUNTRY[v.country].label) || v.country], ['Month filter', v.month], ['Matches', list.length], ['Use', v.purpose]],
          verdict: list.join('; ') + '. Confirm exact dates locally before booking travel.',
          rows: [['Planning lead', '6 to 12 weeks for travel events'], ['Respect note', 'Ask before filming rituals or private ceremonies.'], ['Budget note', 'Add transport, lodging, attire and guide costs.']]
        };
      }
      case 'lobola': {
        var gross = v.cattle * v.cattleValue + v.cashGifts;
        var family = gross * v.familySupport / 100;
        var total = (gross - family) * (1 + v.buffer / 100);
        return {
          metrics: [['Cattle equivalent', money(v.cattle * v.cattleValue, 'ZAR')], ['Cash gifts', money(v.cashGifts, 'ZAR')], ['Family support', money(family, 'ZAR')], ['Planning envelope', money(total, 'ZAR')]],
          verdict: 'Use this as a respectful planning envelope, not a price tag. The family process matters as much as the amount.',
          rows: [['Buffer value', money(total - (gross - family), 'ZAR')], ['Meeting note', 'Agree speakers and minutes.'], ['Payment note', 'Record what is symbolic and what is paid.']]
        };
      }
      case 'attireBudget': {
        var fabric = v.people * v.fabricYards * v.fabricPrice;
        var tailoring = v.people * v.tailoring;
        var accessories = v.people * v.accessories;
        var subtotal = fabric + tailoring + accessories;
        var total = subtotal * (1 - v.discount / 100);
        var currency = (COUNTRY[v.country] && COUNTRY[v.country].currency) || 'NGN';
        return {
          metrics: [['Total outfit budget', money(total, currency)], ['Fabric', money(fabric, currency)], ['Tailoring', money(tailoring, currency)], ['Savings', money(subtotal - total, currency)]],
          verdict: 'Deposits and measurement discipline protect the organizer more than bulk discount alone.',
          rows: [['Per person', money(total / Math.max(1, v.people), currency)], ['Accessories', money(accessories, currency)], ['Discount applied', pct(v.discount)]]
        };
      }
      default:
        return { metrics: [['Status', 'Ready']], verdict: tool.summary, rows: [] };
    }
  }

  function fieldHtml(name, value) {
    var label = name.replace(/([A-Z])/g, ' $1').replace(/^./, function (c) { return c.toUpperCase(); });
    var selectOptions = {
      currency: ['NGN', 'KES', 'ZAR', 'GHS', 'USD', 'XOF', 'EGP'],
      country: Object.keys(COUNTRY),
      origin: Object.keys(COUNTRY),
      city: Object.keys(CITY_TIMES),
      method: ['MWL', 'Egypt', 'ISNA', 'UmmQura'],
      school: ['standard', 'hanafi'],
      nisab: ['silver', 'gold'],
      trip: ['hajj', 'umrah'],
      package: ['economy', 'standard', 'premium'],
      spouse: ['wife', 'husband', 'none'],
      basis: ['gross', 'net'],
      frequency: ['monthly', 'annual'],
      style: ['traditional', 'white', 'nikah', 'naming', 'funeral', 'church'],
      tier: ['modest', 'standard', 'premium'],
      culture: ['Yoruba', 'Akan', 'Swahili', 'Zulu', 'Igbo', 'Islamic'],
      purpose: ['planning', 'lesson', 'name', 'events', 'travel', 'market'],
      gender: ['female', 'male'],
      system: ['igbo', 'ethiopian', 'coptic', 'yoruba'],
      month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    if (selectOptions[name]) {
      return '<label class="rs-field"><span>' + label + '</span><select name="' + name + '">' + selectOptions[name].map(function (option) {
        return '<option value="' + option + '"' + (String(option) === String(value) ? ' selected' : '') + '>' + option + '</option>';
      }).join('') + '</select></label>';
    }
    var type = String(value).match(/^\d{4}-\d{2}-\d{2}$/) ? 'date' : 'number';
    var numberAttrs = type === 'number' ? ' min="0" step="any" inputmode="decimal"' : '';
    return '<label class="rs-field"><span>' + label + '</span><input name="' + name + '" type="' + type + '"' + numberAttrs + ' value="' + String(value).replace(/"/g, '&quot;') + '"></label>';
  }

  function readValues(form, tool) {
    var values = {};
    Object.keys(tool.inputs).forEach(function (key) {
      var field = form.elements[key];
      if (!field) return;
      var raw = field.value;
      values[key] = field.type === 'number' ? Number(raw || 0) : raw;
    });
    return values;
  }

  function renderResult(el, tool, result) {
    el.innerHTML = '<div class="rs-result-hero"><div><span>Result</span><strong>' + escapeHtml(result.metrics[0][1]) + '</strong></div><p>' + escapeHtml(result.verdict) + '</p></div>' +
      '<div class="rs-metrics">' + result.metrics.map(function (item) {
        return '<div class="rs-metric"><span>' + escapeHtml(item[0]) + '</span><strong>' + escapeHtml(item[1]) + '</strong></div>';
      }).join('') + '</div>' +
      '<div class="rs-table">' + result.rows.map(function (row) {
        return '<div><span>' + escapeHtml(row[0]) + '</span><strong>' + escapeHtml(row.slice(1).join(' - ')) + '</strong></div>';
      }).join('') + '</div>';
  }

  function buildReport(tool, result, values) {
    var enhancement = getEnhancement(tool);
    var lines = [
      enhancement.reportTitle || tool.title,
      'AfroTools Religious & Cultural pack',
      '',
      'Result',
      result.metrics.map(function (item) { return item[0] + ': ' + item[1]; }).join('\n'),
      '',
      'Interpretation',
      result.verdict,
      '',
      'Inputs',
      Object.keys(values || {}).map(function (key) { return key + ': ' + values[key]; }).join('\n'),
      '',
      'Action checklist',
      (tool.checklist || []).map(function (item) { return '- ' + item; }).join('\n'),
      '',
      'Next apps',
      (enhancement.nextTools || []).map(function (item) { return '- ' + item.label + ': ' + item.reason + ' (' + item.href + ')'; }).join('\n'),
      '',
      'Competitor check',
      enhancement.competitor,
      '',
      'AfroTools upgrade',
      enhancement.upgrade
    ];
    return lines.join('\n');
  }

  function copyReport(text, button) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        flashButton(button, 'Copied', false);
      }).catch(function () {
        window.prompt('Copy your report', text);
      });
      return;
    }
    window.prompt('Copy your report', text);
  }

  function ensureJsPdf() {
    return new Promise(function (resolve, reject) {
      if (window.jspdf && window.jspdf.jsPDF) {
        resolve(window.jspdf.jsPDF);
        return;
      }
      var existing = document.getElementById('afro-rc-jspdf');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.jspdf && window.jspdf.jsPDF); });
        existing.addEventListener('error', reject);
        return;
      }
      var script = document.createElement('script');
      script.id = 'afro-rc-jspdf';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = function () {
        if (window.jspdf && window.jspdf.jsPDF) resolve(window.jspdf.jsPDF);
        else reject(new Error('jsPDF unavailable'));
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function generatePdf(tool, result, values, button) {
    var text = buildReport(tool, result, values);
    flashButton(button, 'Preparing PDF', true);
    ensureJsPdf().then(function (JsPDF) {
      var doc = new JsPDF({ unit: 'pt', format: 'a4' });
      var margin = 42;
      var y = 48;
      var title = getEnhancement(tool).reportTitle || tool.title;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(17);
      doc.text(title, margin, y);
      y += 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('AfroTools Religious & Cultural pack | ' + new Date().toLocaleDateString('en'), margin, y);
      y += 24;
      doc.setFontSize(10);
      text.split('\n').forEach(function (line) {
        var chunks = doc.splitTextToSize(line || ' ', 512);
        chunks.forEach(function (chunk) {
          if (y > 760) {
            doc.addPage();
            y = 48;
          }
          doc.text(chunk, margin, y);
          y += 13;
        });
        y += 3;
      });
      doc.save(safeFileName(title) + '.pdf');
      flashButton(button, 'PDF ready', true);
    }).catch(function () {
      copyReport(text, button);
      window.setTimeout(function () { window.print(); }, 160);
    });
  }

  function showPdfGate(tool, callback) {
    var existing = document.querySelector('.rs-gate-overlay');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.className = 'rs-gate-overlay';
    overlay.innerHTML = '<div class="rs-gate-card" role="dialog" aria-modal="true" aria-labelledby="rs-gate-title">' +
      '<button type="button" class="rs-gate-close" aria-label="Close">x</button>' +
      '<div class="rs-kicker">PDF pack</div>' +
      '<h2 id="rs-gate-title">Email this ' + escapeHtml(tool.shortTitle) + ' pack</h2>' +
      '<p>Get a clean PDF for family, mosque, church, vendor, elder or adviser handoff. Email is required, name is optional.</p>' +
      '<form class="rs-gate-form">' +
        '<label>Email<input type="email" name="email" required autocomplete="email" placeholder="you@example.com"></label>' +
        '<label>Name <span>(optional)</span><input type="text" name="name" autocomplete="name" placeholder="Your name"></label>' +
        '<label class="rs-gate-check"><input type="checkbox" name="optin" checked><span>Send me practical AfroTools cultural and family planning updates.</span></label>' +
        '<div class="rs-gate-error" role="alert"></div>' +
        '<button type="submit">Email and create PDF</button>' +
      '</form>' +
      '<p class="rs-gate-fine">No spam. You can unsubscribe anytime.</p>' +
      '</div>';
    document.body.appendChild(overlay);
    var close = overlay.querySelector('.rs-gate-close');
    var form = overlay.querySelector('form');
    var email = overlay.querySelector('input[name="email"]');
    var error = overlay.querySelector('.rs-gate-error');
    function remove() {
      overlay.remove();
      document.removeEventListener('keydown', esc);
    }
    function esc(evt) {
      if (evt.key === 'Escape') remove();
    }
    close.addEventListener('click', remove);
    overlay.addEventListener('click', function (evt) {
      if (evt.target === overlay) remove();
    });
    document.addEventListener('keydown', esc);
    window.setTimeout(function () { if (email) email.focus(); }, 60);
    form.addEventListener('submit', function (evt) {
      evt.preventDefault();
      var data = {
        email: cleanText(email.value),
        name: cleanText((form.querySelector('[name="name"]') || {}).value)
      };
      if (!isValidEmail(data.email)) {
        error.textContent = 'Enter a valid email address.';
        email.focus();
        return;
      }
      rememberLead(data);
      captureLead(tool, data);
      remove();
      callback();
    });
  }

  function downloadPdf(tool, result, values, button) {
    if (getStoredLeadEmail() || getAuthEmail()) {
      generatePdf(tool, result, values, button);
      return;
    }
    showPdfGate(tool, function () {
      generatePdf(tool, result, values, button);
    });
  }

  function savePlan(tool, result, values, button) {
    var enhancement = getEnhancement(tool);
    var now = new Date().toISOString();
    var id = 'rc-' + tool.id + '-' + Date.now();
    var record = {
      id: id,
      itemType: 'religious-cultural-plan',
      toolSlug: tool.id,
      toolTitle: tool.shortTitle || tool.title,
      title: enhancement.reportTitle || tool.title,
      summary: result.verdict,
      resultLabel: result.metrics[0][0],
      resultValue: result.metrics[0][1],
      workflowLabel: enhancement.workflow,
      href: window.location.pathname || tool.parent,
      savedAt: now,
      createdAt: now,
      nextTools: enhancement.nextTools || [],
      payload: { values: values, metrics: result.metrics, rows: result.rows }
    };
    var items = readDashboardItems().filter(function (item) {
      return !(item.toolSlug === tool.id && item.resultValue === record.resultValue);
    });
    items.unshift(record);
    writeDashboardItems(items);
    if (window.AfroWorkspace && AfroWorkspace.isSignedIn && AfroWorkspace.isSignedIn() && AfroWorkspace.upsert) {
      AfroWorkspace.upsert({
        itemType: 'religious-cultural-plan',
        itemKey: id,
        toolSlug: tool.id,
        title: record.title,
        summary: record.summary,
        href: record.href,
        payload: record.payload,
        meta: { workflowLabel: record.workflowLabel, resultValue: record.resultValue }
      }).catch(function (err) {
        console.warn('[ReligiousCultural] workspace sync failed:', err.message || err);
      });
    }
    try {
      window.dispatchEvent(new CustomEvent('afro-workspace-change', {
        detail: { action: 'upsert', itemType: 'religious-cultural-plan', itemKey: id, item: record }
      }));
    } catch (err) {}
    flashButton(button, 'Saved to dashboard', true);
  }

  function renderTool(host, tool) {
    var isFull = host.classList.contains('rs-full-app');
    var enhancement = getEnhancement(tool);
    var fieldMarkup = Object.keys(tool.inputs).map(function (key) { return fieldHtml(key, tool.inputs[key]); }).join('');
    var nextMarkup = (enhancement.nextTools || []).map(function (item) {
      return '<a href="' + escapeHtml(safeHref(item.href)) + '"><strong>' + escapeHtml(item.label) + '</strong><span>' + escapeHtml(item.reason) + '</span></a>';
    }).join('');
    host.innerHTML = '<div class="rs-wrap rs-faith">' +
      '<div class="rs-header"><div><span class="rs-kicker">' + (isFull ? 'Interactive app' : 'Deep improvement') + '</span><h2>' + escapeHtml(tool.title) + '</h2><p>' + escapeHtml(tool.summary) + '</p></div><a class="rs-parent-link" href="' + escapeHtml(tool.parent) + '">Category</a></div>' +
      '<div class="rs-tags">' + tool.tags.map(function (tag) { return '<span>' + escapeHtml(tag) + '</span>'; }).join('') + '</div>' +
      '<div class="rs-insights">' +
        '<article><span>Competitor check</span><p>' + escapeHtml(enhancement.competitor) + '</p></article>' +
        '<article><span>AfroTools upgrade</span><p>' + escapeHtml(enhancement.upgrade) + '</p></article>' +
        '<article><span>Workflow</span><p>' + escapeHtml(enhancement.workflow) + '</p></article>' +
      '</div>' +
      '<div class="rs-main"><form class="rs-form">' + fieldMarkup + '<button type="submit">Update plan</button></form><div><div class="rs-output" aria-live="polite"></div><div class="rs-actions"><button type="button" data-rs-action="save">Save to dashboard</button><button type="button" data-rs-action="pdf">Create PDF pack</button><button type="button" data-rs-action="copy">Copy summary</button><button type="button" data-rs-action="print">Print</button></div></div></div>' +
      '<div class="rs-next"><div><h3>Next connected apps</h3><p>Carry this result into the next practical decision instead of starting over.</p></div><div class="rs-next-links">' + nextMarkup + '</div></div>' +
      '<div class="rs-bottom"><div><h3>Action checklist</h3><ul>' + tool.checklist.map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul></div><div><h3>Feature sources</h3><ul>' + tool.sources.map(function (src) { return '<li><a href="' + escapeHtml(src.href) + '" target="_blank" rel="noopener">' + escapeHtml(src.label) + '</a></li>'; }).join('') + '</ul></div></div>' +
      '</div>';
    var form = host.querySelector('form');
    var output = host.querySelector('.rs-output');
    var currentResult = null;
    var currentValues = null;
    function update() {
      currentValues = readValues(form, tool);
      currentResult = calc(tool, currentValues);
      renderResult(output, tool, currentResult);
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      update();
    });
    Array.prototype.forEach.call(form.elements, function (field) {
      field.addEventListener('input', update);
      field.addEventListener('change', update);
    });
    Array.prototype.forEach.call(host.querySelectorAll('[data-rs-action]'), function (button) {
      button.addEventListener('click', function () {
        if (!currentResult || !currentValues) update();
        var action = button.getAttribute('data-rs-action');
        if (action === 'save') savePlan(tool, currentResult, currentValues, button);
        if (action === 'pdf') downloadPdf(tool, currentResult, currentValues, button);
        if (action === 'copy') copyReport(buildReport(tool, currentResult, currentValues), button);
        if (action === 'print') window.print();
      });
    });
    update();
  }

  function renderHub(host) {
    var saved = readDashboardItems();
    var savedPreview = saved.slice(0, 3).map(function (item) {
      return '<article><strong>' + escapeHtml(item.title || item.toolTitle || 'Saved plan') + '</strong><span>' + escapeHtml(item.resultValue || item.summary || 'Saved to dashboard') + '</span><a href="' + escapeHtml(safeHref(item.href)) + '">Open</a></article>';
    }).join('');
    var workflowMarkup = HUB_WORKFLOWS.map(function (workflow) {
      return '<article class="rs-hub-flow"><h3>' + escapeHtml(workflow.title) + '</h3><p>' + escapeHtml(workflow.copy) + '</p><div>' + workflow.steps.map(function (step) {
        return '<a href="' + escapeHtml(safeHref(step.href)) + '">' + escapeHtml(step.label) + '</a>';
      }).join('') + '</div></article>';
    }).join('');
    host.innerHTML = '<section class="rs-hub-command" aria-labelledby="rs-hub-command-title">' +
      '<div class="rs-hub-command-head"><div><span class="rs-kicker">Complete package</span><h2 id="rs-hub-command-title">Build a saved faith, family, or heritage pack</h2><p>Every Religious & Cultural app now carries results into the dashboard, PDF handoffs, and the next related app. Start with a workflow below or open an individual tool.</p></div><a href="/dashboard/">Open dashboard</a></div>' +
      '<div class="rs-hub-stats"><div><strong>20</strong><span>apps reviewed</span></div><div><strong>' + saved.length + '</strong><span>saved packs on this device</span></div><div><strong>PDF</strong><span>email-gated exports</span></div></div>' +
      '<div class="rs-hub-flows">' + workflowMarkup + '</div>' +
      '<div class="rs-hub-saved"><div><h3>Dashboard trail</h3><p>Saved plans appear in My Workspace as Religious & Cultural packs. Signed-in users also push eligible records through AfroWorkspace.</p></div><div class="rs-hub-saved-list">' + (savedPreview || '<p>No Religious & Cultural packs saved yet. Open any app, update the plan, then save it.</p>') + '</div></div>' +
      '</section>';
  }

  function init() {
    injectCss();
    Array.prototype.forEach.call(document.querySelectorAll('[data-rs-hub]'), function (host) {
      renderHub(host);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-rs-tool-id]'), function (host) {
      var id = host.getAttribute('data-rs-tool-id');
      var tool = TOOL_MAP[id];
      if (tool) renderTool(host, tool);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
