#!/usr/bin/env node
/*
 * Builds the Religious & Cultural tool pass.
 *
 * The category hubs already link these routes. This script makes the linked
 * app surfaces real, attaches a tailored workbench to existing pages, and keeps
 * the registry aligned with the user-facing category page.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const now = '2026-04-28';

const countryRates = {
  NG: { label: 'Nigeria', multiplier: 1.0, currency: 'NGN' },
  KE: { label: 'Kenya', multiplier: 0.92, currency: 'KES' },
  ZA: { label: 'South Africa', multiplier: 1.18, currency: 'ZAR' },
  GH: { label: 'Ghana', multiplier: 0.88, currency: 'GHS' },
  EG: { label: 'Egypt', multiplier: 0.72, currency: 'EGP' },
  ET: { label: 'Ethiopia', multiplier: 0.58, currency: 'ETB' },
  TZ: { label: 'Tanzania', multiplier: 0.66, currency: 'TZS' },
  UG: { label: 'Uganda', multiplier: 0.62, currency: 'UGX' },
  RW: { label: 'Rwanda', multiplier: 0.74, currency: 'RWF' },
  CI: { label: "Cote d'Ivoire", multiplier: 0.82, currency: 'XOF' },
  SN: { label: 'Senegal', multiplier: 0.80, currency: 'XOF' },
  MA: { label: 'Morocco', multiplier: 0.86, currency: 'MAD' },
  TN: { label: 'Tunisia', multiplier: 0.78, currency: 'TND' },
  AO: { label: 'Angola', multiplier: 0.84, currency: 'AOA' },
  CM: { label: 'Cameroon', multiplier: 0.76, currency: 'XAF' },
};

const tools = [
  {
    id: 'zakat-calculator',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Zakat Calculator',
    shortTitle: 'Zakat Calculator',
    icon: 'ZK',
    type: 'zakat',
    route: '/tools/zakat-calculator/',
    status: 'live',
    countries: ['ALL'],
    priority: 84,
    desc: 'Calculate zakat on cash, gold, silver, business inventory, receivables and liabilities with gold or silver nisab planning.',
    summary: 'A practical zakat planner for African households and businesses. It separates liquid assets, trade goods, debts owed to you and liabilities, then checks the nisab threshold before estimating 2.5 percent zakat.',
    tags: ['Nisab threshold', 'Gold and silver', 'Business stock', 'Debt netting'],
    inputs: { currency: 'NGN', cash: 2500000, goldGrams: 20, goldPrice: 95000, silverGrams: 0, silverPrice: 1400, inventory: 800000, receivables: 150000, liabilities: 300000, nisab: 'silver' },
    checklist: ['Separate personal assets from business inventory before calculating.', 'Use a current local gold or silver quote for the nisab basis.', 'Deduct only due liabilities, not long-term debts that are not currently payable.', 'Ask a local scholar for edge cases such as pensions, crypto, shared assets or disputed receivables.'],
    sources: [{ label: 'Zakat Foundation calculator categories', href: 'https://www.zakat.org/resource-center/zakat-calculator' }, { label: 'Zakat Foundation nisab explainer', href: 'https://www.zakat.org/nisab-and-zakat-calculation-in-a-nutshell' }],
  },
  {
    id: 'prayer-times',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Prayer Times and Qibla Planner',
    shortTitle: 'Prayer Times Calculator',
    icon: 'PT',
    type: 'prayer',
    route: '/tools/prayer-times/',
    status: 'live',
    countries: ['ALL'],
    priority: 83,
    desc: 'Plan daily salah times with African city presets, prayer method adjustments, Asr school choice and Qibla bearing.',
    summary: 'A city-based salah planning assistant that compares calculation methods and shows Qibla direction. It is designed for daily planning and should be checked against the local mosque timetable.',
    tags: ['Qibla bearing', 'MWL and Egypt methods', 'Asr school', 'City presets'],
    inputs: { city: 'Lagos', method: 'MWL', school: 'standard', date: '2026-04-27' },
    checklist: ['Pick the closest city or enter coordinates in a future data pass.', 'Compare MWL, Egyptian and local mosque settings when Fajr or Isha differs.', 'Use Hanafi Asr where your community follows that school.', 'For Ramadan, publish the local mosque timetable as the final authority.'],
    sources: [{ label: 'IslamicFinder Qibla settings', href: 'https://www.islamicfinder.org/Qibla-Direction/' }, { label: 'Prayer calculation methods', href: 'https://praycalc.org/science/calculation-methods' }],
  },
  {
    id: 'ramadan-timetable',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Ramadan Timetable Generator',
    shortTitle: 'Ramadan Timetable',
    icon: 'RT',
    type: 'ramadan',
    route: '/tools/ramadan-timetable/',
    status: 'live',
    countries: ['ALL'],
    priority: 82,
    desc: 'Generate a Ramadan planning timetable with suhoor, iftar, taraweeh, last ten nights and Eid preparation markers.',
    summary: 'Creates a working Ramadan timetable for family, mosque or WhatsApp group planning. It includes city presets, suhoor buffer, iftar buffer and milestone reminders.',
    tags: ['Suhoor and iftar', 'Last ten nights', 'Shareable plan', 'City presets'],
    inputs: { city: 'Lagos', startDate: '2026-02-19', days: 30, suhoorBuffer: 10, iftarBuffer: 0 },
    checklist: ['Confirm the first day by local moon sighting or the official council.', 'Publish a short correction note if the start date moves by one day.', 'Add mosque-specific taraweeh and iftar distribution notes.', 'Keep a separate printable timetable for elders and community boards.'],
    sources: [{ label: 'IslamicFinder Islamic events', href: 'https://www.islamicfinder.org/locale/?language=en' }, { label: 'Prayer app timetable features', href: 'https://apps.apple.com/us/app/qibla-compass-kaaba-finder/id1231722856' }],
  },
  {
    id: 'halal-compliance',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Halal Compliance Action Plan',
    shortTitle: 'Halal Compliance',
    icon: 'HC',
    type: 'scorecard',
    route: '/tools/halal-compliance/',
    existing: true,
    status: 'live',
    countries: ['ALL'],
    priority: 79,
    desc: 'Score halal risk across revenue, finance, suppliers, documentation and audit readiness with a certification action plan.',
    summary: 'Adds an operator-focused action plan to the existing halal checker, turning the score into certification steps, evidence gaps and next audits.',
    tags: ['Certification pathway', 'Supplier screening', 'Riba exposure', 'Audit evidence'],
    inputs: { revenueRisk: 10, financeRisk: 25, supplierEvidence: 70, documentation: 50, staffTraining: 40 },
    checklist: ['List every product, ingredient, supplier and financing facility.', 'Separate non-halal revenue before applying for certification.', 'Keep purchase orders, labels, cleaning logs and staff training records.', 'Ask the certifier for a pre-audit before packaging or restaurant launch.'],
    sources: [{ label: 'SANHA background', href: 'https://en.wikipedia.org/wiki/SANHA' }],
  },
  {
    id: 'faraid-inheritance',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Islamic Inheritance Faraid Calculator',
    shortTitle: 'Faraid Calculator',
    icon: 'FI',
    type: 'faraid',
    route: '/tools/faraid-inheritance/',
    status: 'live',
    countries: ['ALL'],
    priority: 82,
    desc: 'Model common Faraid inheritance shares for spouse, parents, sons and daughters with estate deductions and scholar review notes.',
    summary: 'A guided Faraid planner for common household cases. It deducts funeral debts and estate costs, allocates fixed shares where applicable, and splits the residue between children.',
    tags: ['Fixed shares', 'Residue split', 'Estate debts', 'Scholar review'],
    inputs: { estate: 12000000, debts: 1500000, spouse: 'wife', sons: 2, daughters: 1, father: 1, mother: 1 },
    checklist: ['Deduct funeral costs, debts and valid bequests before distribution.', 'Confirm whether there are excluded heirs or special local court requirements.', 'Use this for planning, then have a qualified scholar or Sharia court review the final distribution.', 'Record all heirs and obtain written family acknowledgment before payment.'],
    sources: [{ label: 'Online Faraid feature reference', href: 'https://www.zakat.org/resource-center/zakat-calculator' }],
  },
  {
    id: 'hajj-budget',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Hajj and Umrah Budget Calculator',
    shortTitle: 'Hajj Budget',
    icon: 'HU',
    type: 'travelBudget',
    route: '/tools/hajj-budget/',
    status: 'live',
    countries: ['NG', 'KE', 'ZA', 'GH', 'EG', 'ET', 'TZ', 'UG', 'SN', 'MA', 'TN', 'AO', 'CI', 'CM', 'RW'],
    priority: 80,
    desc: 'Estimate Hajj or Umrah costs by origin, package level, travelers, days, visa, food, transport and contingency.',
    summary: 'A pilgrimage budget planner that separates package, flight, visa, food, local transport, ihram and contingency so families can save month by month.',
    tags: ['Hajj or Umrah', 'Savings target', 'Family plan', 'Contingency'],
    inputs: { origin: 'NG', trip: 'hajj', travelers: 1, package: 'standard', days: 21, buffer: 12 },
    checklist: ['Confirm official operator packages and visa rules before paying deposits.', 'Add a family emergency buffer for medicine, laundry and extra transport.', 'Keep a separate Saudi riyal cash plan and card plan.', 'Save documents and payment receipts in one folder for the traveling group.'],
    sources: [{ label: 'Prayer and Ramadan app feature reference', href: 'https://apps.apple.com/us/app/qibla-compass-kaaba-finder/id1231722856' }],
  },
  {
    id: 'islamic-finance',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Islamic Finance Profit Rate Calculator',
    shortTitle: 'Islamic Finance',
    icon: 'IF',
    type: 'islamicFinance',
    route: '/tools/islamic-finance/',
    status: 'live',
    countries: ['NG', 'KE', 'ZA', 'GH', 'EG', 'TZ', 'UG', 'SN', 'MA', 'TN', 'AO', 'CI', 'CM', 'RW', 'ET'],
    priority: 79,
    desc: 'Compare Murabaha markup, Ijarah lease payments and Musharakah equity contribution for halal financing planning.',
    summary: 'A halal finance comparison tool for asset purchase, business equipment or vehicle finance. It shows the cash deposit, financed amount and monthly obligation under common structures.',
    tags: ['Murabaha', 'Ijarah', 'Musharakah', 'Deposit planning'],
    inputs: { currency: 'NGN', assetCost: 8000000, deposit: 20, margin: 12, months: 36, partnerShare: 30 },
    checklist: ['Confirm the bank owns or constructively possesses the asset before Murabaha sale.', 'Check late payment clauses and insurance treatment.', 'Compare total obligation, not just monthly installment.', 'Keep Sharia board or product disclosure documents with the contract.'],
    sources: [{ label: 'Zakat Finance calculator feature reference', href: 'https://zakatfinance.com/zakat-calculator' }],
  },
  {
    id: 'islamic-calendar',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Islamic Calendar Planning Layer',
    shortTitle: 'Islamic Calendar',
    icon: 'IC',
    type: 'culturePicker',
    route: '/tools/islamic-calendar/',
    existing: true,
    status: 'live',
    countries: ['ALL'],
    priority: 75,
    desc: 'Add Islamic event planning, Hijri adjustment notes, Ramadan countdown and community calendar actions to the existing converter.',
    summary: 'Adds planning context to the existing Hijri converter: event windows, moon-sighting caveats and community calendar reminders.',
    tags: ['Hijri adjustment', 'Event reminders', 'Moon sighting', 'Community calendar'],
    inputs: { culture: 'islamic', purpose: 'events', date: '2026-04-27' },
    checklist: ['Treat calculated Hijri dates as planning dates until local moon sighting is confirmed.', 'Publish both Gregorian and Hijri dates on flyers.', 'Add a one-day flexibility note for Eid and Ramadan events.', 'Share calendar exports with mosque admin and family groups.'],
    sources: [{ label: 'IslamicFinder calendar events', href: 'https://www.islamicfinder.org/locale/?language=en' }],
  },
  {
    id: 'tithe-calculator',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Tithe and Offering Planning Workbench',
    shortTitle: 'Tithe Calculator',
    icon: 'TC',
    type: 'giving',
    route: '/tools/tithe-calculator/',
    existing: true,
    status: 'live',
    countries: ['ALL'],
    priority: 78,
    desc: 'Plan tithe, offering, first fruits and charity from gross or net income with monthly and annual giving goals.',
    summary: 'Adds a giving plan that helps users separate tithe, freewill offering, first fruits and benevolence support without losing household budget visibility.',
    tags: ['Gross or net', 'Monthly giving', 'First fruits', 'Charity buffer'],
    inputs: { currency: 'NGN', income: 650000, basis: 'gross', titheRate: 10, offering: 3, firstFruits: 0, frequency: 'monthly' },
    checklist: ['Choose gross or net basis consistently with your church teaching.', 'Separate recurring tithe from one-off pledges.', 'Keep charity and family support visible in the same plan.', 'Review the plan when income changes, not only at year end.'],
    sources: [{ label: 'Giving calculator feature reference', href: 'https://zakatfinance.com/zakat-calculator' }],
  },
  {
    id: 'wedding-budget',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'African Wedding Budget Calculator',
    shortTitle: 'Wedding Budget',
    icon: 'WB',
    type: 'ceremonyBudget',
    route: '/tools/wedding-budget/',
    status: 'live',
    countries: ['NG', 'KE', 'ZA', 'GH', 'EG', 'TZ', 'UG', 'SN', 'MA', 'TN', 'AO', 'CI', 'CM', 'RW', 'ET'],
    priority: 78,
    desc: 'Build a wedding budget for church, nikah, traditional or white wedding with guest, venue, food, attire and vendor buffers.',
    summary: 'A ceremony budget planner for African weddings with guest pressure, attire, food, family contribution and contingency built in.',
    tags: ['Guest count', 'Family contribution', 'Venue and food', 'Contingency'],
    inputs: { country: 'NG', guests: 350, style: 'traditional', tier: 'standard', buffer: 12 },
    checklist: ['Set a hard guest count before venue negotiation.', 'Separate family ceremony costs from couple reception costs.', 'Get vendor quotes in writing with payment milestones.', 'Protect a contingency line for fuel, power, rain plan and last-minute family requests.'],
    sources: [{ label: 'Event budget planner feature reference', href: 'https://www.eventbrite.com/blog/event-budget-template-ds00/' }],
  },
  {
    id: 'naming-ceremony',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Naming Ceremony Budget Calculator',
    shortTitle: 'Naming Ceremony',
    icon: 'NC',
    type: 'ceremonyBudget',
    route: '/tools/naming-ceremony/',
    status: 'live',
    countries: ['NG', 'GH', 'KE', 'ZA', 'TZ', 'UG', 'SN', 'CI', 'CM', 'RW', 'ET', 'MA', 'TN', 'EG', 'AO'],
    priority: 72,
    desc: 'Plan aqiqah, Yoruba, Igbo, Akan or church naming ceremony costs with food, gifts, officiant and family logistics.',
    summary: 'A compact budget planner for baby naming ceremonies that handles food, gifts, officiant support, photography and family hospitality.',
    tags: ['Aqiqah or naming', 'Food and gifts', 'Officiant support', 'Family hosting'],
    inputs: { country: 'NG', guests: 80, style: 'naming', tier: 'modest', buffer: 10 },
    checklist: ['Confirm the ceremony tradition and required items before shopping.', 'Separate baby gifts from food and family hosting.', 'Book photo or video only if it fits the household budget.', 'Keep a small emergency line for transport and extra chairs.'],
    sources: [{ label: 'Event budget planner feature reference', href: 'https://www.eventbrite.com/blog/event-budget-template-ds00/' }],
  },
  {
    id: 'funeral-cost',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Funeral Cost Calculator',
    shortTitle: 'Funeral Cost',
    icon: 'FC',
    type: 'ceremonyBudget',
    route: '/tools/funeral-cost/',
    status: 'live',
    countries: ['NG', 'GH', 'ZA', 'KE', 'TZ', 'UG', 'SN', 'CI', 'CM', 'RW', 'ET', 'MA', 'TN', 'EG', 'AO'],
    priority: 77,
    desc: 'Estimate funeral and burial costs by tradition, guest count, transport, mortuary, casket, food and remembrance events.',
    summary: 'A respectful planning tool for funeral cost decisions under pressure. It separates unavoidable costs from family hospitality and remembrance spending.',
    tags: ['Burial essentials', 'Family hosting', 'Transport', 'Remembrance'],
    inputs: { country: 'ZA', guests: 180, style: 'funeral', tier: 'standard', buffer: 15 },
    checklist: ['Identify legally required documents and burial permits first.', 'Separate mortuary, casket and burial costs from reception costs.', 'Assign one family member to approve spending changes.', 'Record contributions and expenses transparently to prevent conflict.'],
    sources: [{ label: 'Event budget planner feature reference', href: 'https://www.eventbrite.com/blog/event-budget-template-ds00/' }],
  },
  {
    id: 'african-proverbs',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'African Proverb Teaching Planner',
    shortTitle: 'African Proverbs',
    icon: 'AP',
    type: 'culturePicker',
    route: '/tools/african-proverbs/',
    existing: true,
    status: 'live',
    countries: ['ALL'],
    priority: 74,
    desc: 'Turn proverbs into lesson, speech, caption or family discussion prompts with origin, meaning and context.',
    summary: 'Adds a practical use layer to the existing proverb generator: pick a use case and receive a proverb, context note and discussion prompt.',
    tags: ['Origin context', 'Lesson prompt', 'Speech line', 'Family discussion'],
    inputs: { culture: 'Yoruba', purpose: 'lesson', date: '2026-04-27' },
    checklist: ['Use the original language where you can verify it.', 'Do not flatten ethnic context into generic Africa copy.', 'Add a short explanation before using a proverb in teaching or speeches.', 'Credit the source community when publishing.'],
    sources: [{ label: 'African proverb feature reference', href: 'https://en.wikipedia.org/wiki/Proverb' }],
  },
  {
    id: 'baby-name-generator',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'African Baby Name Generator',
    shortTitle: 'Baby Name Generator',
    icon: 'BN',
    type: 'culturePicker',
    route: '/tools/baby-name-generator/',
    status: 'live',
    countries: ['ALL'],
    priority: 75,
    desc: 'Find African baby names by culture, gender, meaning, birth circumstance and family naming notes.',
    summary: 'A name discovery tool that explains meaning, cultural origin and naming context instead of returning a random list.',
    tags: ['Meaning filter', 'Culture context', 'Gender options', 'Family shortlist'],
    inputs: { culture: 'Akan', purpose: 'name', gender: 'female', date: '2026-04-27' },
    checklist: ['Ask elders or fluent speakers to confirm spelling and pronunciation.', 'Keep both official-document spelling and home-language spelling if they differ.', 'Check meaning across dialects before final registration.', 'Create a shortlist with family story notes, not only aesthetics.'],
    sources: [{ label: 'Naming tradition feature reference', href: 'https://en.wikipedia.org/wiki/Akan_names' }],
  },
  {
    id: 'traditional-calendar',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Traditional Calendar Converter',
    shortTitle: 'Traditional Calendar',
    icon: 'CC',
    type: 'traditionalCalendar',
    route: '/tools/traditional-calendar/',
    status: 'live',
    countries: ['NG', 'ET', 'EG', 'TZ', 'KE', 'GH', 'ZA'],
    priority: 72,
    desc: 'Convert dates into traditional planning references such as Igbo market days, Ethiopian date estimate and cultural event notes.',
    summary: 'A cultural calendar helper for market-day planning and community event context. It gives calculated estimates and clearly marks where local confirmation is needed.',
    tags: ['Market days', 'Ethiopian estimate', 'Event notes', 'Local confirmation'],
    inputs: { system: 'igbo', date: '2026-04-27', purpose: 'market' },
    checklist: ['Confirm market-day calculations with the local town calendar.', 'Use official Ethiopian conversion for legal or church dates.', 'Publish Gregorian and local calendar names side by side.', 'Record the village, dialect or church authority used for the calendar.'],
    sources: [{ label: 'Calendar conversion feature reference', href: 'https://www.islamicfinder.org/locale/?language=en' }],
  },
  {
    id: 'age-calculator-african',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Age Calculator with African Name Day',
    shortTitle: 'Age and Name Day',
    icon: 'AD',
    type: 'ageNameDay',
    route: '/tools/age-calculator-african/',
    status: 'live',
    countries: ['ALL'],
    priority: 70,
    desc: 'Calculate exact age and show Akan day-name suggestions plus family milestone planning notes.',
    summary: 'A warm age calculator that pairs precise age with day-name context, milestone reminders and culturally sensitive naming notes.',
    tags: ['Exact age', 'Day name', 'Milestones', 'Family note'],
    inputs: { birthDate: '2000-01-01', gender: 'female', culture: 'Akan' },
    checklist: ['Use birth certificate date for legal calculations.', 'Treat day names as cultural suggestions, not universal rules.', 'Add local birthday or outdooring traditions where relevant.', 'Check leap-day birthdays and time-zone edge cases for official forms.'],
    sources: [{ label: 'Akan naming reference', href: 'https://en.wikipedia.org/wiki/Akan_names' }],
  },
  {
    id: 'festival-calendar',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Cultural Festival Calendar',
    shortTitle: 'Festival Calendar',
    icon: 'FE',
    type: 'festival',
    route: '/tools/festival-calendar/',
    status: 'live',
    countries: ['ALL'],
    priority: 74,
    desc: 'Discover cultural and religious festivals by country, month, planning lead time and travel readiness.',
    summary: 'A festival planning assistant for travelers, creators and families. It highlights timing, likely preparation windows and respectful participation notes.',
    tags: ['Country filter', 'Month filter', 'Travel prep', 'Respect notes'],
    inputs: { country: 'NG', month: 'August', purpose: 'travel' },
    checklist: ['Confirm dates from the official state, palace, church, mosque or festival committee.', 'Book transport and accommodation before announcing a group trip.', 'Respect dress, photography and sacred-space rules.', 'For content creators, ask permission before filming rituals or private family moments.'],
    sources: [{ label: 'Festival planning reference', href: 'https://en.wikipedia.org/wiki/List_of_festivals_in_Africa' }],
  },
  {
    id: 'lobola-calculator',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Lobola Negotiation Planner',
    shortTitle: 'Lobola Guide',
    icon: 'LO',
    type: 'lobola',
    route: '/tools/lobola-calculator/',
    existing: true,
    status: 'live',
    countries: ['ZA', 'ZW', 'BW', 'LS', 'SZ'],
    priority: 81,
    desc: 'Plan lobola in cattle and cash equivalents with family contribution, negotiation envelope and respectful meeting checklist.',
    summary: 'Adds a negotiation planner to the existing lobola calculator: cattle equivalent, cash envelope, family contribution split and meeting notes.',
    tags: ['Cattle equivalent', 'Family envelope', 'Negotiation notes', 'Respect checklist'],
    inputs: { country: 'ZA', cattle: 8, cattleValue: 12000, cashGifts: 15000, familySupport: 25, buffer: 10 },
    checklist: ['Agree who speaks for each family before discussing money.', 'Separate symbolic cattle value from actual cash flow.', 'Record what has been agreed and what remains ceremonial.', 'Keep the process respectful and avoid treating the bride as a transaction.'],
    sources: [{ label: 'Lobola cultural background', href: 'https://en.wikipedia.org/wiki/Lobolo' }],
  },
  {
    id: 'aso-ebi-cost',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Aso-Ebi Group Outfit Cost Calculator',
    shortTitle: 'Aso-Ebi Cost',
    icon: 'AE',
    type: 'attireBudget',
    route: '/tools/aso-ebi-cost/',
    status: 'live',
    countries: ['NG', 'GH', 'CI', 'SN', 'CM', 'KE', 'ZA'],
    priority: 72,
    desc: 'Calculate fabric, sewing, accessories, delivery, bulk discount and payment collection for group outfits.',
    summary: 'A group outfit calculator for weddings and ceremonies. It estimates fabric bundles, tailoring, accessories, delivery and the organizer cash gap.',
    tags: ['Bulk fabric', 'Tailoring', 'Payment tracking', 'Delivery buffer'],
    inputs: { country: 'NG', people: 25, fabricYards: 6, fabricPrice: 4500, tailoring: 18000, accessories: 5000, discount: 8 },
    checklist: ['Collect deposits before buying fabric.', 'Confirm measurements and pickup dates in writing.', 'Separate fabric cost from tailoring cost so late payments are clear.', 'Keep extra fabric for corrections and children sizes.'],
    sources: [{ label: 'Event budget planner feature reference', href: 'https://www.eventbrite.com/blog/event-budget-template-ds00/' }],
  },
  {
    id: 'traditional-attire',
    category: 'religious-cultural',
    parent: '/religious-cultural/',
    title: 'Traditional Attire Cost Calculator',
    shortTitle: 'Traditional Attire',
    icon: 'TA',
    type: 'attireBudget',
    route: '/tools/traditional-attire/',
    status: 'live',
    countries: ['NG', 'GH', 'KE', 'TZ', 'ZA', 'SN', 'CI', 'CM', 'MA', 'ET', 'EG', 'UG', 'RW', 'AO', 'TN'],
    priority: 72,
    desc: 'Budget agbada, kente, kitenge, kaftan and ceremonial outfits with fabric, tailoring and accessory lines.',
    summary: 'An attire planner for ceremonial outfits. It separates fabric, tailoring complexity, beadwork, shoes, gele or headwrap and rush fees.',
    tags: ['Fabric choice', 'Tailoring complexity', 'Accessories', 'Rush fee'],
    inputs: { country: 'GH', people: 1, fabricYards: 8, fabricPrice: 6500, tailoring: 42000, accessories: 12000, discount: 0 },
    checklist: ['Choose outfit type before buying fabric length.', 'Ask tailor for fitting dates, not only delivery date.', 'Include accessories, shoes, headwrap and pressing in the budget.', 'Avoid rush tailoring unless the premium is explicit.'],
    sources: [{ label: 'Event budget planner feature reference', href: 'https://www.eventbrite.com/blog/event-budget-template-ds00/' }],
  },
];


const existingIds = new Set(tools.filter((tool) => tool.existing).map((tool) => tool.id));
const registryIdsToAdd = new Set(tools.filter((tool) => !tool.existing).map((tool) => tool.id));

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, content, 'utf8');
}

function routeToFile(route) {
  return path.join(ROOT, route.replace(/^\//, ''), 'index.html');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pageTemplate(tool) {
  const accent = '#D97706';
  const dark = '#3b2800';
  const active = 'religious-cultural';
  const categoryLabel = 'Religious & Cultural';
  const tags = tool.tags.map((tag) => `<span class="en-tool-hero-pill">${escapeHtml(tag)}</span>`).join('\n');
  const appCategory = 'LifestyleApplication';
  return `<!DOCTYPE html>
<html data-chat-bundle="/assets/js/bundles/chat.e57fe38a.min.js" lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(tool.title)} | AfroTools</title>
<meta name="description" content="${escapeHtml(tool.desc)}">
<link rel="canonical" href="https://afrotools.com${tool.route}">
<meta property="og:title" content="${escapeHtml(tool.title)} | AfroTools">
<meta property="og:description" content="${escapeHtml(tool.desc)}">
<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://afrotools.com${tool.route}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: tool.title,
  description: tool.desc,
  url: `https://afrotools.com${tool.route}`,
  applicationCategory: appCategory,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  provider: { '@type': 'Organization', name: 'AfroTools', url: 'https://afrotools.com/' },
})}</script>
<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://afrotools.com/' },
    { '@type': 'ListItem', position: 2, name: categoryLabel, item: `https://afrotools.com${tool.parent}` },
    { '@type': 'ListItem', position: 3, name: tool.shortTitle, item: `https://afrotools.com${tool.route}` },
  ],
})}</script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f"><link rel="stylesheet" href="/assets/css/global.min.css?v=c94dde91"><link rel="stylesheet" href="/assets/css/energy.css?v=f8aae7a5">
<script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer></script><script src="/assets/js/components/footer.min.js?v=d0d64671" defer></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}
:root{--en-accent:${accent};--en-accent-dark:${accent};--en-accent-light:#FEF3C7;--en-accent-pale:#FFFBEB;--en-shadow-hover:0 4px 16px rgba(15,23,42,.14),0 1px 4px rgba(0,0,0,.08)}
.en-hero,.en-tool-hero,.en-results-hero,.en-tool-hub-hero{background:linear-gradient(135deg,#0A1628 0%,#1a0a0a 45%,${dark} 100%)!important}
.container{max-width:1080px;margin:0 auto;padding:0 24px}
</style>
</head>
<body>
<afro-navbar theme="dark" active="${active}"></afro-navbar>
<section class="en-tool-hero">
<div class="container">
<nav class="en-breadcrumb" aria-label="Breadcrumb">
<a href="/">Home</a><span class="en-breadcrumb-sep">&gt;</span>
<a href="${tool.parent}">${escapeHtml(categoryLabel)}</a><span class="en-breadcrumb-sep">&gt;</span>
<span class="en-breadcrumb-current">${escapeHtml(tool.shortTitle)}</span>
</nav>
<h1>${escapeHtml(tool.title)}</h1>
<p>${escapeHtml(tool.summary)}</p>
<div class="en-tool-hero-meta">
${tags}
</div>
</div>
</section>
<main>
<section class="rs-upgrade-shell rs-full-app" data-rs-tool-id="${tool.id}"></section>
</main>
<afro-footer></afro-footer>
<script src="/assets/js/religious-cultural-apps.js" defer></script>
</body>
</html>
`;
}

function jsString(value) {
  return JSON.stringify(value);
}

function runtimeTemplate() {
  const runtimePath = path.join(ROOT, 'assets/js/religious-cultural-apps.js');
  if (fs.existsSync(runtimePath)) return fs.readFileSync(runtimePath, 'utf8');
  const publicTools = tools.map((tool) => ({
    id: tool.id,
    category: tool.category,
    parent: tool.parent,
    title: tool.title,
    shortTitle: tool.shortTitle,
    type: tool.type,
    summary: tool.summary,
    tags: tool.tags,
    inputs: tool.inputs,
    checklist: tool.checklist,
    sources: tool.sources,
  }));
  return `(function () {
  'use strict';

  var TOOLS = ${jsString(publicTools)};
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

  var COUNTRY = ${jsString(countryRates)};
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

  function injectCss() {
    if (document.querySelector('link[href="/assets/css/religious-cultural-apps.css"]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/assets/css/religious-cultural-apps.css';
    document.head.appendChild(link);
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
      event: ['club', 'wedding', 'festival', 'corporate'],
      gear: ['none', 'controller', 'full'],
      rush: ['no', 'yes'],
      host: ['no', 'yes'],
      position: ['goalkeeper', 'defender', 'midfielder', 'forward'],
      cleanSheet: ['yes', 'no'],
      captain: ['yes', 'no'],
      taxBasis: ['net', 'gross', 'stake'],
      platform: ['spotify', 'apple', 'boomplay', 'audiomack', 'youtube', 'deezer'],
      destination: ['USA', 'UK', 'Canada', 'Germany'],
      level: ['school', 'regional', 'national', 'international'],
      video: ['yes', 'no'],
      english: ['done', 'pending', 'not-started'],
      amateur: ['yes', 'uncertain', 'no'],
      target: ['1080p competitive', '1440p balanced', 'creator plus gaming'],
      usedParts: ['none', 'some', 'mostly'],
      usage: ['wedding', 'portrait', 'corporate', 'commercial'],
      month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      team: ['Nigeria', 'Morocco', 'Senegal', 'Egypt', "Cote d'Ivoire", 'Ghana', 'South Africa']
    };
    if (selectOptions[name]) {
      return '<label class="rs-field"><span>' + label + '</span><select name="' + name + '">' + selectOptions[name].map(function (option) {
        return '<option value="' + option + '"' + (String(option) === String(value) ? ' selected' : '') + '>' + option + '</option>';
      }).join('') + '</select></label>';
    }
    var type = String(value).match(/^\\d{4}-\\d{2}-\\d{2}$/) ? 'date' : 'number';
    return '<label class="rs-field"><span>' + label + '</span><input name="' + name + '" type="' + type + '" value="' + String(value).replace(/"/g, '&quot;') + '"></label>';
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
    el.innerHTML = '<div class="rs-result-hero"><div><span>Result</span><strong>' + result.metrics[0][1] + '</strong></div><p>' + result.verdict + '</p></div>' +
      '<div class="rs-metrics">' + result.metrics.map(function (item) {
        return '<div class="rs-metric"><span>' + item[0] + '</span><strong>' + item[1] + '</strong></div>';
      }).join('') + '</div>' +
      '<div class="rs-table">' + result.rows.map(function (row) {
        return '<div><span>' + row[0] + '</span><strong>' + row.slice(1).join(' - ') + '</strong></div>';
      }).join('') + '</div>';
  }

  function renderTool(host, tool) {
    var isFull = host.classList.contains('rs-full-app');
    var fieldMarkup = Object.keys(tool.inputs).map(function (key) { return fieldHtml(key, tool.inputs[key]); }).join('');
    host.innerHTML = '<div class="rs-wrap rs-faith">' +
      '<div class="rs-header"><div><span class="rs-kicker">' + (isFull ? 'Interactive app' : 'Deep improvement') + '</span><h2>' + tool.title + '</h2><p>' + tool.summary + '</p></div><a class="rs-parent-link" href="' + tool.parent + '">Category</a></div>' +
      '<div class="rs-tags">' + tool.tags.map(function (tag) { return '<span>' + tag + '</span>'; }).join('') + '</div>' +
      '<div class="rs-main"><form class="rs-form">' + fieldMarkup + '<button type="submit">Update plan</button></form><div class="rs-output" aria-live="polite"></div></div>' +
      '<div class="rs-bottom"><div><h3>Action checklist</h3><ul>' + tool.checklist.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul></div><div><h3>Feature sources</h3><ul>' + tool.sources.map(function (src) { return '<li><a href="' + src.href + '">' + src.label + '</a></li>'; }).join('') + '</ul></div></div>' +
      '</div>';
    var form = host.querySelector('form');
    var output = host.querySelector('.rs-output');
    function update() {
      renderResult(output, tool, calc(tool, readValues(form, tool)));
    }
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      update();
    });
    Array.prototype.forEach.call(form.elements, function (field) {
      field.addEventListener('input', update);
      field.addEventListener('change', update);
    });
    update();
  }

  function init() {
    injectCss();
    Array.prototype.forEach.call(document.querySelectorAll('[data-rs-tool-id]'), function (host) {
      var id = host.getAttribute('data-rs-tool-id');
      var tool = TOOL_MAP[id];
      if (tool) renderTool(host, tool);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();`;
}

function cssTemplate() {
  const cssPath = path.join(ROOT, 'assets/css/religious-cultural-apps.css');
  if (fs.existsSync(cssPath)) return fs.readFileSync(cssPath, 'utf8');
  return `.rs-upgrade-shell{max-width:1120px;margin:36px auto;padding:0 24px 36px}
.rs-full-app{margin-top:0;padding-top:36px}
.rs-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 14px 40px rgba(15,23,42,.08);overflow:hidden}
.rs-header{display:flex;gap:20px;align-items:flex-start;justify-content:space-between;padding:26px 28px 16px;background:#f8fafd;border-bottom:1px solid #e2e8f0}
.rs-header h2{font-family:"Instrument Serif",Georgia,serif;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:400;line-height:1.1;margin:4px 0 8px;color:#0f172a}
.rs-header p{max-width:760px;color:#475569;line-height:1.6;margin:0;font-size:.98rem}
.rs-kicker{font-size:.74rem;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:#92400e}
.rs-parent-link{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 14px;border-radius:8px;background:#0f172a;color:#fff;font-weight:700;font-size:.82rem;white-space:nowrap}
.rs-tags{display:flex;flex-wrap:wrap;gap:8px;padding:16px 28px 0}
.rs-tags span{display:inline-flex;border:1px solid #fbbf24;background:#fffbeb;color:#92400e;border-radius:999px;padding:5px 10px;font-size:.78rem;font-weight:700}
.rs-main{display:grid;grid-template-columns:minmax(280px,420px) 1fr;gap:22px;padding:24px 28px 28px}
.rs-form{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-content:start}
.rs-field{display:flex;flex-direction:column;gap:6px}
.rs-field span{font-size:.76rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
.rs-field input,.rs-field select{width:100%;min-height:42px;border:1.5px solid #cbd5e1;border-radius:8px;padding:0 11px;background:#fff;color:#0f172a;font:inherit;font-size:.92rem}
.rs-field input:focus,.rs-field select:focus{outline:3px solid rgba(217,119,6,.18);border-color:#d97706}
.rs-form button{grid-column:1/-1;min-height:44px;border:0;border-radius:8px;background:#d97706;color:#fff;font-weight:800;font:inherit;cursor:pointer}
.rs-output{min-width:0}
.rs-result-hero{display:grid;grid-template-columns:minmax(180px,280px) 1fr;gap:16px;align-items:center;background:linear-gradient(135deg,#0f172a,#3b2800);color:#fff;border-radius:14px;padding:20px;margin-bottom:14px}
.rs-result-hero span{display:block;font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.6);font-weight:800;margin-bottom:4px}
.rs-result-hero strong{font-size:clamp(1.4rem,3vw,2rem);line-height:1.1}
.rs-result-hero p{margin:0;color:rgba(255,255,255,.78);line-height:1.55}
.rs-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px}
.rs-metric{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px}
.rs-metric span{display:block;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#64748b;margin-bottom:5px}
.rs-metric strong{display:block;font-size:1rem;color:#0f172a;word-break:break-word}
.rs-table{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff}
.rs-table div{display:grid;grid-template-columns:minmax(130px,220px) 1fr;gap:12px;padding:10px 12px;border-bottom:1px solid #edf2f7}
.rs-table div:last-child{border-bottom:0}
.rs-table span{font-size:.82rem;color:#64748b;font-weight:700}
.rs-table strong{font-size:.9rem;color:#0f172a}
.rs-bottom{display:grid;grid-template-columns:1.25fr .75fr;gap:18px;padding:0 28px 28px}
.rs-bottom>div{border:1px solid #e2e8f0;border-radius:12px;padding:18px;background:#fff}
.rs-bottom h3{font-size:.9rem;text-transform:uppercase;letter-spacing:.06em;color:#0f172a;margin:0 0 10px}
.rs-bottom ul{margin:0;padding-left:18px;color:#475569;line-height:1.6;font-size:.9rem}
.rs-bottom a{color:#b45309;font-weight:700}
@media(max-width:860px){.rs-main,.rs-bottom,.rs-result-hero{grid-template-columns:1fr}.rs-metrics{grid-template-columns:1fr 1fr}.rs-header{flex-direction:column}.rs-parent-link{align-self:flex-start}}
@media(max-width:560px){.rs-upgrade-shell{padding-left:16px;padding-right:16px}.rs-header,.rs-main,.rs-bottom{padding-left:18px;padding-right:18px}.rs-form,.rs-metrics,.rs-table div{grid-template-columns:1fr}.rs-tags{padding-left:18px;padding-right:18px}}`;
}

function attachExistingPages() {
  for (const tool of tools.filter((entry) => entry.existing)) {
    const filePath = routeToFile(tool.route);
    if (!fs.existsSync(filePath)) continue;
    let html = fs.readFileSync(filePath, 'utf8');
    if (!html.includes(`data-rs-tool-id="${tool.id}"`)) {
      const section = `\n<section class="rs-upgrade-shell" data-rs-tool-id="${tool.id}"></section>\n<script src="/assets/js/religious-cultural-apps.js" defer></script>\n`;
      if (html.includes('<afro-footer')) {
        html = html.replace(/<afro-footer/i, section + '<afro-footer');
      } else {
        html = html.replace(/<\/body>/i, section + '</body>');
      }
    }
    html = html.replace(/\/assets\/js\/religious-sports-apps\.js/g, '/assets/js/religious-cultural-apps.js');
    fs.writeFileSync(filePath, html, 'utf8');
  }
}

function writeMissingPages() {
  for (const tool of tools.filter((entry) => !entry.existing)) {
    const filePath = routeToFile(tool.route);
    writeFile(filePath, pageTemplate(tool));
  }
}

function registryEntry(tool) {
  const countries = JSON.stringify(tool.countries);
  const revenue = tool.category === 'sports' ? 'Freemium' : 'Free';
  return `  { id: '${tool.id}', name: '${tool.title.replace(/'/g, "\\'")}', icon: '${tool.icon}', desc: '${tool.desc.replace(/'/g, "\\'")}', href: '${tool.route}', category: '${tool.category}', tier: 'T3', status: '${tool.status}', phase: 'LIVE', countries: ${countries}, revenue: '${revenue}', estTraffic: 1000, estRevenue: 15, priority: ${tool.priority}, tags: ${JSON.stringify(tool.tags)} },`;
}

function stripBlock(text, start, end) {
  const pattern = new RegExp(`\\n?  // ${start}[\\s\\S]*?  // ${end}\\n?`, 'm');
  return text.replace(pattern, '\n');
}

function updateCategoryForExisting(text, id, category) {
  const pattern = new RegExp(`(\\{ id: '${id}'[\\s\\S]*?category: ')[^']+(')`);
  return text.replace(pattern, `$1${category}$2`);
}

function updateRegistry() {
  const registryPath = path.join(ROOT, 'assets/js/components/tool-registry.js');
  let text = fs.readFileSync(registryPath, 'utf8');

  text = stripBlock(text, 'BEGIN RELIGIOUS CULTURAL EXPANSION 2026-04-27', 'END RELIGIOUS CULTURAL EXPANSION 2026-04-27');
  ['tithe-offering', 'lobola-calculator', 'african-proverbs'].forEach((id) => {
    text = updateCategoryForExisting(text, id, 'religious-cultural');
  });

  const religiousEntries = tools
    .filter((tool) => registryIdsToAdd.has(tool.id) && tool.category === 'religious-cultural')
    .map(registryEntry)
    .join('\n');

  const religiousBlock = `\n  // BEGIN RELIGIOUS CULTURAL EXPANSION 2026-04-27\n${religiousEntries}\n  // END RELIGIOUS CULTURAL EXPANSION 2026-04-27\n`;

  if (!text.includes("{ id: 'zakat-calculator'")) {
    const religiousAnchor = "  { id: 'halal-compliance'";
    const idx = text.indexOf(religiousAnchor);
    if (idx === -1) throw new Error('Could not find religious-cultural registry anchor.');
    text = text.slice(0, idx) + religiousBlock + text.slice(idx);
  }

  text = text.replace(/religious-cultural \(\d+ tools\)/, 'religious-cultural (20 tools)');
  text = text.replace(/desc: 'Zakat, tithe, halal compliance, Islamic calendar, prayer times, naming ceremony.'/,
    "desc: '20 tools for Zakat, prayer times, Ramadan, halal compliance, Faraid, giving, ceremonies, proverbs, names and attire.'");

  fs.writeFileSync(registryPath, text, 'utf8');
}

function writeSummaryDoc() {
  const docPath = path.join(ROOT, 'docs', 'RELIGIOUS-CULTURAL-IMPROVEMENT-PASS-2026-04-28.md');
  const missing = tools.filter((tool) => !tool.existing);
  const existing = tools.filter((tool) => tool.existing);
  const lines = [
    '# Religious & Cultural Improvement Pass - 2026-04-28',
    '',
    '## Scope',
    '',
    '- Category hub checked: `/religious-cultural/`.',
    '- User-facing scope: 20 linked apps from that category page.',
    `- Existing app pages upgraded: ${existing.length}.`,
    `- Missing linked app routes created: ${missing.length}.`,
    '',
    '## Product Issue Found',
    '',
    'The Religious & Cultural hub linked many tools that did not exist as local `tools/<slug>/index.html` routes. The pass therefore prioritized turning every linked card into a usable app surface before polishing individual calculators.',
    '',
    '## What Changed',
    '',
    '- Added `assets/js/religious-cultural-apps.js`, a shared renderer with tool-specific calculator logic for all 20 Religious & Cultural apps.',
    '- Added `assets/css/religious-cultural-apps.css` for the category workbench UI.',
    '- Created missing app routes for the category cards rather than redirecting users to unrelated tools.',
    '- Attached deep workbench sections to existing apps so their current calculators stay intact and gain a second planning layer.',
    '- Updated `assets/js/components/tool-registry.js` so the category inventory reflects the expanded live tool set.',
    '',
    '## Online Feature Checks Used',
    '',
    '- Zakat tools should separate cash, precious metals, business inventory, receivables, liabilities and nisab basis.',
    '- Prayer and Ramadan tools should expose method, Asr school, Qibla direction, city/date planning and local timetable caveats.',
    '',
    '## Per-App Upgrade Inventory',
    '',
    ...tools.map((tool) => `- \`${tool.route}\` - ${tool.summary}`),
    '',
    '## Validation Notes',
    '',
    'Run after this script:',
    '',
    '```bash',
    'node scripts/enhance-religious-cultural-section.js',
    'node --check assets/js/religious-cultural-apps.js',
    'npm run check-links',
    'npm run audit',
    '```',
    '',
    'If validation reports broad baseline debt, separate it from net-new failures on the 20 touched Religious & Cultural routes.',
  ];
  writeFile(docPath, lines.join('\n') + '\n');
}

function main() {
  writeFile(path.join(ROOT, 'assets/js/religious-cultural-apps.js'), runtimeTemplate());
  writeFile(path.join(ROOT, 'assets/css/religious-cultural-apps.css'), cssTemplate());
  writeMissingPages();
  attachExistingPages();
  updateRegistry();
  writeSummaryDoc();
  console.log(`Religious-cultural pass complete for ${tools.length} tools on ${now}.`);
}

main();
