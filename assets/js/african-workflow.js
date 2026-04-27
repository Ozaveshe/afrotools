(function () {
  'use strict';

  var STORAGE_KEY = 'african_workflow_items';
  var EMAIL_KEY = 'afrotools-email-gate';

  var TOOLS = {
    'japa-calculator': { name: 'Japa Cost Calculator', href: '/tools/japa-calculator/', group: 'Relocation', next: ['cost-of-living', 'diaspora-guide', 'remittance-compare'] },
    'generator-fuel-african': { name: 'Generator Fuel Calculator', href: '/tools/generator-fuel/', group: 'Household costs', next: ['electricity-estimator', 'fuel-cost', 'cost-of-living'] },
    'mobile-money-fees': { name: 'Mobile Money Fee Checker', href: '/tools/mobile-money-fees/', group: 'Money movement', next: ['fintech-fee-watch', 'remittance-compare', 'whatsapp-link'] },
    'fintech-fee-watch': { name: 'Fintech Fee Watch', href: '/tools/fintech-fee-watch/', group: 'Money movement', next: ['mobile-money-fees', 'informal-fx-watch', 'wholesale-retail-spread'] },
    'ajo-chama': { name: 'Ajo/Chama Savings Tracker', href: '/tools/ajo-tracker/', group: 'Community finance', next: ['ajo-interest', 'susu-tracker', 'ajo-chama-calc'] },
    'electricity-estimator': { name: 'Electricity Bill Estimator', href: '/tools/electricity-estimator/', group: 'Household costs', next: ['generator-fuel-african', 'fuel-cost', 'cost-of-living'] },
    'fuel-cost': { name: 'Fuel Cost Calculator', href: '/tools/fuel-cost/', group: 'Household costs', next: ['generator-fuel-african', 'okada-income', 'cost-of-living'] },
    'tithe-offering': { name: 'Tithe & Offering Calculator', href: '/tools/tithe-calculator/', group: 'Family planning', next: ['burial-cost', 'ajo-chama', 'cost-of-living'] },
    'lobola-calculator': { name: 'Lobola Calculator', href: '/tools/lobola-calculator/', group: 'Family planning', next: ['brideprice-advisor', 'burial-cost', 'whatsapp-link'] },
    'hawala-tracker': { name: 'Informal Remittance Cost Tracker', href: '/tools/hawala-tracker/', group: 'Money movement', next: ['remittance-compare', 'informal-fx-watch', 'diaspora-guide'] },
    'burial-cost': { name: 'Funeral Cost Estimator', href: '/tools/burial-cost/', group: 'Family planning', next: ['ajo-chama', 'tithe-offering', 'whatsapp-link'] },
    'staple-basket': { name: 'Staple Basket Tracker', href: '/tools/staple-basket/', group: 'Market intelligence', next: ['wholesale-retail-spread', 'afroprices', 'afropoints'] },
    'wholesale-retail-spread': { name: 'Wholesale Retail Spread', href: '/tools/wholesale-retail-spread/', group: 'Market intelligence', next: ['staple-basket', 'afroprices', 'afropoints'] },
    'land-size': { name: 'Land Size Converter', href: '/tools/land-size/', group: 'Property', next: ['cost-of-living', 'diaspora-guide', 'whatsapp-link'] },
    'naira-to-words': { name: 'Naira to Words', href: '/tools/naira-to-words/', group: 'Documents', next: ['amount-words-ke', 'amount-words-gh', 'whatsapp-link'] },
    'amount-words-ke': { name: 'Kenya Amount in Words', href: '/tools/amount-words-ke/', group: 'Documents', next: ['naira-to-words', 'amount-words-gh', 'mobile-money-fees'] },
    'amount-words-gh': { name: 'Ghana Cedi Amount in Words', href: '/tools/amount-words-gh/', group: 'Documents', next: ['naira-to-words', 'amount-words-ke', 'mobile-money-fees'] },
    'susu-tracker': { name: 'Susu Tracker', href: '/tools/susu-tracker/', group: 'Community finance', next: ['ajo-chama', 'ajo-interest', 'whatsapp-link'] },
    'whatsapp-link': { name: 'WhatsApp Link Generator', href: '/tools/whatsapp-link/', group: 'Communication', next: ['mobile-money-fees', 'afroprices', 'staple-basket'] },
    'remittance-compare': { name: 'Remittance Comparator', href: '/tools/remittance-compare/', group: 'Money movement', next: ['remittance-v2', 'informal-fx-watch', 'diaspora-guide'] },
    'informal-fx-watch': { name: 'Informal FX Watch', href: '/tools/informal-fx-watch/', group: 'Money movement', next: ['remittance-compare', 'hawala-tracker', 'afroprices'] },
    'remittance-v2': { name: 'Remittance V2', href: '/tools/remittance-v2/', group: 'Money movement', next: ['remittance-compare', 'informal-fx-watch', 'diaspora-guide'] },
    'cost-of-living': { name: 'Cost of Living Africa', href: '/tools/cost-of-living/', group: 'Relocation', next: ['japa-calculator', 'diaspora-guide', 'staple-basket'] },
    'afroatlas': { name: 'AfroAtlas', href: '/tools/afroatlas/', group: 'Research', next: ['africa-conflict', 'diaspora-guide', 'cost-of-living'] },
    'afropoints': { name: 'AfroPoints', href: '/tools/afropoints/', group: 'Contributor economy', next: ['staple-basket', 'wholesale-retail-spread', 'afroprices'] },
    'afrokitchen': { name: 'AfroKitchen', href: '/tools/afrokitchen/', group: 'Food planning', next: ['staple-basket', 'cost-of-living', 'afropoints'] },
    'africa-conflict': { name: 'Africa Conflict Monitor', href: '/tools/africa-conflict/', group: 'Research', next: ['afroatlas', 'diaspora-guide', 'whatsapp-link'] },
    'brideprice-advisor': { name: 'Brideprice Advisor', href: '/tools/brideprice-advisor/', group: 'Family planning', next: ['lobola-calculator', 'whatsapp-link', 'burial-cost'] },
    'ajo-interest': { name: 'Ajo Interest Calculator', href: '/tools/ajo-interest/', group: 'Community finance', next: ['ajo-chama', 'susu-tracker', 'mobile-money-fees'] },
    'diaspora-guide': { name: 'Diaspora Guide', href: '/tools/diaspora-guide/', group: 'Relocation', next: ['japa-calculator', 'cost-of-living', 'remittance-compare'] },
    'nollywood-pitch': { name: 'Nollywood Budget Estimator', href: '/tools/nollywood-pitch/', group: 'Creative economy', next: ['fabric-cost', 'ankara-kente-cost', 'whatsapp-link'] },
    'okada-income': { name: 'Okada / Boda Boda Income', href: '/tools/okada-income/', group: 'Informal work', next: ['fuel-cost', 'mobile-money-fees', 'cost-of-living'] },
    'market-days': { name: 'Igbo Market Day Finder', href: '/tools/market-days/', group: 'Culture', next: ['african-proverbs', 'whatsapp-link', 'staple-basket'] },
    'ajo-chama-calc': { name: 'Ajo / Chama Calculator', href: '/tools/ajo-chama/', group: 'Community finance', next: ['ajo-chama', 'ajo-interest', 'susu-tracker'] },
    'african-proverbs': { name: 'African Proverb Generator', href: '/tools/african-proverbs/', group: 'Culture', next: ['market-days', 'whatsapp-link', 'afrokitchen'] },
    'afroprices': { name: 'AfroPrices', href: '/tools/afroprices/', group: 'Market intelligence', next: ['staple-basket', 'wholesale-retail-spread', 'mobile-money-fees'] },
    'ankara-kente-cost': { name: 'Ankara / Kente Cost', href: '/tools/ankara-kente-cost/', group: 'Creative economy', next: ['fabric-cost', 'afroprices', 'whatsapp-link'] },
    'fabric-cost': { name: 'Fabric & Material Cost', href: '/tools/fabric-cost/', group: 'Creative economy', next: ['ankara-kente-cost', 'afroprices', 'nollywood-pitch'] }
  };

  var PATH_TO_ID = {
    '/tools/generator-fuel/': 'generator-fuel-african',
    '/tools/ajo-tracker/': 'ajo-chama',
    '/tools/tithe-calculator/': 'tithe-offering',
    '/tools/ajo-chama/': 'ajo-chama-calc'
  };

  var ROUTES = [
    { id: 'relocation', title: 'Relocation and diaspora money', copy: 'Plan japa costs, cost of living, tax obligations, and remittance choices.', start: 'japa-calculator' },
    { id: 'money', title: 'Mobile money and informal FX', copy: 'Compare wallet fees, remittance routes, cash-out choices, and street FX quotes.', start: 'mobile-money-fees' },
    { id: 'household', title: 'Household survival budget', copy: 'Connect fuel, power, food, transport, funeral, and monthly city costs.', start: 'generator-fuel-african' },
    { id: 'community', title: 'Family and savings groups', copy: 'Run Ajo, Susu, Chama, lobola, brideprice, tithe, and family planning workflows.', start: 'ajo-chama' },
    { id: 'market', title: 'Market intelligence loop', copy: 'Capture prices, compare spreads, earn AfroPoints, and turn market data into buying decisions.', start: 'staple-basket' },
    { id: 'creative', title: 'Culture and creative work', copy: 'Budget film, fabric, cultural planning, recipes, proverbs, and campaign messages.', start: 'nollywood-pitch' }
  ];

  var PLAYBOOKS = {
    'japa-calculator': { competitor: 'IRCC and GOV.UK official migration cost pages', sourceName: 'IRCC proof of funds', sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/proof-funds.html', gap: 'Official pages list fees, but they do not connect savings runway, first-month living costs, remittance setup, and family proof notes.', upgrade: 'Use this result as a relocation readiness pack with proof-of-funds, arrival cushion, remittance setup, and next city budget checks.', checks: ['Confirm official proof-of-funds and visa fee month', 'Add 90-day arrival cushion before booking', 'Open Cost of Living and Diaspora Guide next'], pdf: 'Relocation readiness PDF' },
    'generator-fuel-african': { competitor: 'Generic generator fuel calculators', sourceName: 'Energy use comparison pattern', sourceUrl: 'https://www.energy.gov/energysaver/estimating-appliance-and-home-electronic-energy-use', gap: 'Most calculators stop at litres per hour and ignore outage planning, tariff alternatives, and household load priority.', upgrade: 'Turn fuel spend into an outage budget with load priority, electricity estimator follow-up, and dashboard tracking.', checks: ['Record outage hours by day', 'Compare generator fuel against prepaid units', 'Save monthly fuel plan before price changes'], pdf: 'Outage budget PDF' },
    'mobile-money-fees': { competitor: 'Wise transfer comparison and mobile wallet fee tables', sourceName: 'Wise provider comparison', sourceUrl: 'https://wise.com/us/compare/', gap: 'Fee tables rarely explain cash-out, agent risk, wallet limits, and when WhatsApp ordering is the real next action.', upgrade: 'Use this as a transaction decision plan: fee, cash-out, urgency, channel, and customer message.', checks: ['Compare fee plus cash-out cost', 'Check transaction limit before promising payment', 'Generate a WhatsApp payment link next'], pdf: 'Mobile money decision PDF' },
    'fintech-fee-watch': { competitor: 'Bank fee and transfer comparison dashboards', sourceName: 'World Bank remittance methodology', sourceUrl: 'https://remittanceprices.worldbank.org/methodology', gap: 'Competitors benchmark corridors, but informal bank, POS, ATM, USSD, and wallet fees still need local evidence.', upgrade: 'Treat every fee report as evidence: source, date, channel, amount band, and action for traders or households.', checks: ['Capture fee type and amount band', 'Flag hidden FX or cash-out spread', 'Compare against Mobile Money Fees next'], pdf: 'Fee evidence PDF' },
    'ajo-chama': { competitor: 'Generic savings group spreadsheets', sourceName: 'World Bank financial inclusion overview', sourceUrl: 'https://www.worldbank.org/en/topic/financialinclusion', gap: 'Spreadsheets track contributions but rarely handle arrears, payout fairness, reminders, and group handoff.', upgrade: 'Use the tracker as a living group ledger with payout order, arrears watch, and dashboard continuation.', checks: ['Confirm member names and payout order', 'Set arrears rule before the first round', 'Open Ajo Interest for return fairness'], pdf: 'Ajo group ledger PDF' },
    'electricity-estimator': { competitor: 'Utility bill estimators and appliance calculators', sourceName: 'Energy.gov appliance use guide', sourceUrl: 'https://www.energy.gov/energysaver/estimating-appliance-and-home-electronic-energy-use', gap: 'Most estimators do not connect prepaid tokens, generator backup, and realistic appliance priority for African homes.', upgrade: 'Build a power plan that compares token spend, appliance load, and generator backup.', checks: ['List high-load appliances first', 'Compare prepaid units with generator backup', 'Save the monthly power target'], pdf: 'Electricity plan PDF' },
    'fuel-cost': { competitor: 'Route fuel cost calculators', sourceName: 'FuelEconomy.gov trip calculator', sourceUrl: 'https://www.fueleconomy.gov/trip/', gap: 'Trip calculators usually ignore informal work routes, generator fuel, fare recovery, and African city realities.', upgrade: 'Use fuel cost as a route decision desk for transport, delivery, generator backup, and okada income.', checks: ['Check price per litre before each trip', 'Add parking, toll, or loading fees', 'Open Okada Income for rider profit'], pdf: 'Fuel route PDF' },
    'tithe-offering': { competitor: 'Simple tithe calculators', sourceName: 'Stewardship workflow reference', sourceUrl: 'https://www.afrotools.com/tools/tithe-calculator/', gap: 'A bare 10 percent output does not help users balance household obligations, emergency reserve, and giving schedule.', upgrade: 'Make the result a stewardship note with income base, reserve guardrail, and monthly giving plan.', checks: ['Decide gross or net basis consistently', 'Protect rent, food, and emergency reserve', 'Save the plan with Cost of Living'], pdf: 'Giving plan PDF' },
    'lobola-calculator': { competitor: 'Bride price calculators and wedding budget tools', sourceName: 'Family negotiation workflow', sourceUrl: 'https://www.afrotools.com/tools/lobola-calculator/', gap: 'Competitors estimate an amount but rarely support respectful negotiation, staged payments, and family communication.', upgrade: 'Use the output as a family negotiation brief with payment stages, non-cash items, and WhatsApp handoff.', checks: ['Separate symbolic items from cash', 'Agree payment stages and witnesses', 'Open Brideprice Advisor for cultural guidance'], pdf: 'Lobola negotiation PDF' },
    'hawala-tracker': { competitor: 'Remittance fee comparison sites', sourceName: 'World Bank remittance methodology', sourceUrl: 'https://remittanceprices.worldbank.org/methodology', gap: 'Formal remittance tools miss trust, delivery proof, and informal FX spread checks.', upgrade: 'Turn the quote into a risk note: rate, fee, delivery proof, sender identity, and backup formal route.', checks: ['Compare effective exchange rate', 'Record delivery promise and proof', 'Open Remittance Comparator next'], pdf: 'Informal remittance PDF' },
    'burial-cost': { competitor: 'Funeral cost estimators', sourceName: 'Family cost planning workflow', sourceUrl: 'https://www.afrotools.com/tools/burial-cost/', gap: 'Cost estimators rarely address family contribution tracking, urgency, and culturally expected line items.', upgrade: 'Use the result as a family funding plan with contribution targets, dates, and WhatsApp coordination.', checks: ['Separate urgent burial items from memorial extras', 'Assign contribution owners', 'Save PDF before sharing with family'], pdf: 'Funeral funding PDF' },
    'staple-basket': { competitor: 'Inflation and grocery basket trackers', sourceName: 'Numbeo cost database', sourceUrl: 'https://www.numbeo.com/cost-of-living/', gap: 'Global price sites do not capture neighbourhood markets, informal basket substitutions, and contributor evidence.', upgrade: 'Turn basket prices into a household and market intelligence loop with AfroPoints contribution follow-up.', checks: ['Record market, date, and quantity', 'Compare basket to monthly food budget', 'Submit verified prices to AfroPoints'], pdf: 'Staple basket PDF' },
    'wholesale-retail-spread': { competitor: 'Retail margin calculators', sourceName: 'Google price insights pattern', sourceUrl: 'https://blog.google/products/shopping/save-money-price-insights-price-alerts/', gap: 'Margin calculators do not show market spread, spoilage risk, transport cost, and buyer-lead next steps.', upgrade: 'Use the spread as a trader action desk with buy price, sell price, risk, and next sourcing move.', checks: ['Include transport and spoilage', 'Compare against AfroPrices listings', 'Save trader margin plan'], pdf: 'Trader spread PDF' },
    'land-size': { competitor: 'Area unit converters', sourceName: 'Area conversion workflow', sourceUrl: 'https://www.calculator.net/area-calculator.html', gap: 'Area converters rarely explain local plot terms, survey handoff, or buyer due diligence.', upgrade: 'Use the conversion as a land handoff note with plot language, title questions, and buyer warning flags.', checks: ['Record local unit and exact square metres', 'Ask for survey plan and title document', 'Save handoff note before negotiation'], pdf: 'Land size handoff PDF' },
    'naira-to-words': { competitor: 'Cheque amount-to-words tools', sourceName: 'Document workflow reference', sourceUrl: 'https://www.afrotools.com/tools/naira-to-words/', gap: 'Converters often produce words without document line, kobo handling, copy format, or audit note.', upgrade: 'Use this as a document-ready output with cheque line, receipt line, and copyable payment memo.', checks: ['Confirm naira and kobo split', 'Copy the legal document line', 'Save before invoice or receipt generation'], pdf: 'Naira wording PDF' },
    'amount-words-ke': { competitor: 'Amount-to-words converters', sourceName: 'Document workflow reference', sourceUrl: 'https://www.afrotools.com/tools/amount-words-ke/', gap: 'Most tools do not tailor wording to Kenyan cheque and agreement contexts.', upgrade: 'Create a Kenya-ready wording pack with shillings, cents, cheque line, and agreement sentence.', checks: ['Confirm cents wording', 'Copy cheque line', 'Compare mobile money fee if payment follows'], pdf: 'KES wording PDF' },
    'amount-words-gh': { competitor: 'Amount-to-words converters', sourceName: 'Document workflow reference', sourceUrl: 'https://www.afrotools.com/tools/amount-words-gh/', gap: 'Generic converters do not handle Ghana cedi documents and payment memo context.', upgrade: 'Create a Ghana-ready wording pack with cedis, pesewas, receipt line, and agreement sentence.', checks: ['Confirm pesewa handling', 'Copy receipt line', 'Compare mobile money fee if payment follows'], pdf: 'GHS wording PDF' },
    'susu-tracker': { competitor: 'Savings group spreadsheets and collection apps', sourceName: 'Financial inclusion workflow', sourceUrl: 'https://www.worldbank.org/en/topic/financialinclusion', gap: 'Generic trackers miss arrears rules, collector responsibility, payout reminders, and Ghana susu naming.', upgrade: 'Use the tracker as a susu governance pack with member status, arrears handling, and payout calendar.', checks: ['Confirm collector and backup collector', 'Set arrears grace period', 'Open Ajo Interest for fairness check'], pdf: 'Susu governance PDF' },
    'whatsapp-link': { competitor: 'WhatsApp wa.me link generators', sourceName: 'WhatsApp click to chat', sourceUrl: 'https://faq.whatsapp.com/5913398998672934', gap: 'Link tools rarely connect product price, mobile money proof, and African business templates.', upgrade: 'Use the link as a commerce message pack with greeting, payment instruction, order proof, and follow-up.', checks: ['Remove plus signs and leading zeros from phone number', 'Add payment or delivery instruction', 'Open AfroPrices or Mobile Money next'], pdf: 'WhatsApp commerce PDF' },
    'remittance-compare': { competitor: 'Wise, World Bank, and remittance comparison sites', sourceName: 'World Bank remittance methodology', sourceUrl: 'https://remittanceprices.worldbank.org/methodology', gap: 'Comparison tables miss family urgency, pickup trust, wallet cash-out, and backup route planning.', upgrade: 'Use the result as a send-money decision brief with true cost, timing, proof, and recipient channel.', checks: ['Compare total cost, not fee alone', 'Check recipient cash-out method', 'Save route before sending'], pdf: 'Remittance decision PDF' },
    'informal-fx-watch': { competitor: 'FX boards and exchange calculators', sourceName: 'World Bank remittance methodology', sourceUrl: 'https://remittanceprices.worldbank.org/methodology', gap: 'Exchange calculators show rates but not quote age, spread, corridor risk, or street evidence.', upgrade: 'Use each quote as an evidence card with source, age, spread, and safer route suggestion.', checks: ['Record quote time and source', 'Calculate spread against reference route', 'Open Remittance Compare if spread is high'], pdf: 'FX quote evidence PDF' },
    'remittance-v2': { competitor: 'Advanced remittance comparison products', sourceName: 'Wise provider comparison', sourceUrl: 'https://wise.com/us/compare/', gap: 'Pro comparison tools still need African corridor notes, repeat-send rules, and dashboard route memory.', upgrade: 'Use the pro result as a corridor playbook with preferred provider, backup provider, and repeat-send reminders.', checks: ['Save provider and corridor', 'Check fee at send amount band', 'Set family proof and receipt habit'], pdf: 'Remittance corridor PDF' },
    'cost-of-living': { competitor: 'Numbeo and city comparison tools', sourceName: 'Numbeo city comparison', sourceUrl: 'https://www.numbeo.com/cost-of-living/compare_cities.jsp', gap: 'Global city comparisons do not convert into African relocation budgets, remittance plans, or staple basket checks.', upgrade: 'Use the comparison as a monthly survival budget with city rent, food basket, power, transport, and remittance assumptions.', checks: ['Set rent and food assumptions separately', 'Add power and transport reality check', 'Open Japa Calculator or Staple Basket next'], pdf: 'City budget PDF' },
    'afroatlas': { competitor: 'Country data portals and encyclopedias', sourceName: 'World Bank data portal', sourceUrl: 'https://data.worldbank.org/', gap: 'Static country profiles do not help users turn research into a shortlist, comparison, or next action.', upgrade: 'Use AfroAtlas as a research brief builder with comparison notes and next tool route.', checks: ['Compare at least two countries', 'Write opportunity and risk note', 'Open Conflict Monitor or Diaspora Guide next'], pdf: 'Country research PDF' },
    'afropoints': { competitor: 'Survey reward and crowdsourced data apps', sourceName: 'Google price insights pattern', sourceUrl: 'https://blog.google/products/shopping/save-money-price-insights-price-alerts/', gap: 'Reward apps collect data but rarely show how the contribution improves local market intelligence.', upgrade: 'Use AfroPoints as a contributor earning plan tied to staples, spreads, and verified price evidence.', checks: ['Choose a market beat', 'Submit date, market, and quantity proof', 'Track points target in dashboard'], pdf: 'Contributor earning PDF' },
    'afrokitchen': { competitor: 'Recipe scaling and meal planning apps', sourceName: 'Recipe workflow reference', sourceUrl: 'https://www.afrotools.com/tools/afrokitchen/', gap: 'Recipe apps rarely connect African ingredient substitutions, market prices, and household budget.', upgrade: 'Use the recipe result as a cooking plan with servings, market list, substitution, and basket follow-up.', checks: ['Scale servings before shopping', 'Check staple prices if cooking for group', 'Save recipe plan for dashboard'], pdf: 'Meal plan PDF' },
    'africa-conflict': { competitor: 'ACLED and ReliefWeb dashboards', sourceName: 'ACLED conflict data', sourceUrl: 'https://acleddata.com/data/', gap: 'Data dashboards can be hard to turn into a human-readable situation brief and practical next step.', upgrade: 'Use the monitor as a situation brief with confidence, source, humanitarian note, and follow-up route.', checks: ['Check data freshness and geography', 'Cross-check ReliefWeb for humanitarian context', 'Save brief before sharing'], pdf: 'Situation brief PDF' },
    'brideprice-advisor': { competitor: 'Wedding budget and bridewealth explainers', sourceName: 'Family negotiation workflow', sourceUrl: 'https://www.afrotools.com/tools/brideprice-advisor/', gap: 'Generic pages miss ethnic variation, respect language, staged expectations, and communication plan.', upgrade: 'Use the advisor as a respectful family plan with assumptions, questions, and WhatsApp handoff.', checks: ['Document assumptions instead of presenting as fixed price', 'Separate gifts, ceremony, and cash', 'Open Lobola Calculator for amount scenario'], pdf: 'Brideprice family PDF' },
    'ajo-interest': { competitor: 'Savings interest calculators', sourceName: 'Financial inclusion workflow', sourceUrl: 'https://www.worldbank.org/en/topic/financialinclusion', gap: 'Interest calculators do not account for group trust, payout order, penalties, and rotation fairness.', upgrade: 'Use the output as a group fairness note with yield, member risk, reserve, and constitution clause.', checks: ['Compare yield with risk and payout order', 'Set reserve or penalty rule', 'Open Ajo/Chama Tracker next'], pdf: 'Ajo fairness PDF' },
    'diaspora-guide': { competitor: 'Tax residency and expat checklist pages', sourceName: 'GOV.UK IHS guidance', sourceUrl: 'https://www.gov.uk/government/publications/immigration-health-surcharge-information-for-migrants', gap: 'Country pages rarely tie tax, health surcharge, remittance, local obligations, and document handoff together.', upgrade: 'Use the guide as a cross-border compliance checklist with source links and remittance follow-up.', checks: ['Confirm residency trigger and tax year', 'Check health or visa surcharge where relevant', 'Open Remittance Compare next'], pdf: 'Diaspora checklist PDF' },
    'nollywood-pitch': { competitor: 'StudioBinder and film budget templates', sourceName: 'StudioBinder film budget template', sourceUrl: 'https://support.studiobinder.com/en/articles/1979982-how-to-use-our-film-budget-template', gap: 'Templates list line items but do not localize for Nollywood, Ghollywood, shoot days, funding readiness, and pitch handoff.', upgrade: 'Use this as a pitch finance brief with topsheet, readiness score, funding gap, and buyer/channel target.', checks: ['Separate production, post, marketing, and contingency', 'Record funding secured percentage', 'Export pitch brief before investor outreach'], pdf: 'Film pitch PDF' },
    'okada-income': { competitor: 'Gig driver income calculators', sourceName: 'Fuel route planning pattern', sourceUrl: 'https://www.fueleconomy.gov/trip/', gap: 'Gig calculators do not model rainy days, permit costs, bike ownership goals, and emergency reserve.', upgrade: 'Use the tool as a rider operating plan with slow days, savings target, reserve, and bike payoff runway.', checks: ['Subtract rainy or slow days', 'Add daily permits and parking', 'Save bike goal and reserve target'], pdf: 'Rider operating PDF' },
    'market-days': { competitor: 'Calendar and market day lookup tools', sourceName: 'Market planning workflow', sourceUrl: 'https://www.afrotools.com/tools/market-days/', gap: 'Calendar lookups do not turn market cycles into trip, buying, vendor, or ceremony planning.', upgrade: 'Use the result as a trip brief with market purpose, buffer, next three dates, and WhatsApp share.', checks: ['Choose named market and purpose', 'Add travel buffer', 'Save trip note before sharing'], pdf: 'Market trip PDF' },
    'ajo-chama-calc': { competitor: 'ROSCA and rotating savings calculators', sourceName: 'Financial inclusion workflow', sourceUrl: 'https://www.worldbank.org/en/topic/financialinclusion', gap: 'Rotation calculators rarely include constitution rules, default handling, reminder channel, and reserve.', upgrade: 'Use the calculator as a group constitution draft with payout table and default policy.', checks: ['Set grace days and default action', 'Add reserve percentage if needed', 'Copy constitution plan'], pdf: 'Group constitution PDF' },
    'african-proverbs': { competitor: 'Quote and proverb generators', sourceName: 'African proverbs workflow', sourceUrl: 'https://www.afrotools.com/tools/african-proverbs/', gap: 'Quote tools often strip cultural context and give no guidance for respectful use.', upgrade: 'Use the selected proverb as a usage note for caption, toast, class, speech, or leadership message.', checks: ['Keep original culture visible', 'Use context note before sharing', 'Copy a tone-appropriate usage brief'], pdf: 'Proverb usage PDF' },
    'afroprices': { competitor: 'Google Shopping price insights and price alerts', sourceName: 'Google Shopping price insights', sourceUrl: 'https://blog.google/products/shopping/save-money-price-insights-price-alerts/', gap: 'Price comparison products rarely mix African online listings, local markets, warranty priority, and WhatsApp next step.', upgrade: 'Use the buyer desk as a purchase decision brief with price spread, budget, warranty, and channel risk.', checks: ['Compare median and cheapest price', 'Check warranty before market purchase', 'Set alert or copy buying brief'], pdf: 'Buying decision PDF' },
    'ankara-kente-cost': { competitor: 'Fabric costing and export pricing calculators', sourceName: 'Mood fabric estimator', sourceUrl: 'https://www.moodfabrics.com/pages/fabric-estimator', gap: 'Yardage estimators do not price African textile orders with labour, packaging, margin, export value, and client quote.', upgrade: 'Use the production quote builder to price units, gross profit, USD value, and client handoff.', checks: ['Confirm pattern direction and fabric origin', 'Add labour, packaging, and shipping allocation', 'Copy production quote'], pdf: 'Textile quote PDF' },
    'fabric-cost': { competitor: 'Fabric yardage estimators', sourceName: 'Mood fabric estimator', sourceUrl: 'https://www.moodfabrics.com/pages/fabric-estimator', gap: 'General yardage estimators do not connect width, garment type, wastage, labour, and African tailor pricing.', upgrade: 'Use this as a tailor quote planner with yardage estimate, notions, labour, target margin, and gross profit.', checks: ['Estimate yards by garment and fabric width', 'Add notions and labour', 'Copy tailor quote before taking deposit'], pdf: 'Tailor quote PDF' }
  };

  function readItems() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }

  function writeItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 80)));
      window.dispatchEvent(new CustomEvent('afro-workspace-change', { detail: { source: 'african-workflow' } }));
    } catch (e) {}
  }

  function getToolId() {
    var meta = document.querySelector('meta[name="tool-id"],meta[name="afrotools:tool-slug"]');
    if (meta && meta.content) return normalizeId(meta.content);
    var path = window.location.pathname;
    if (!/\/$/.test(path)) path += '/';
    if (PATH_TO_ID[path]) return PATH_TO_ID[path];
    var parts = path.replace(/\/$/, '').split('/').filter(Boolean);
    if (parts[0] === 'tools' && parts[1]) return normalizeId(parts[1]);
    return normalizeId(parts[parts.length - 1] || '');
  }

  function normalizeId(id) {
    if (id === 'generator-fuel') return 'generator-fuel-african';
    if (id === 'ajo-tracker') return 'ajo-chama';
    if (id === 'tithe-calculator') return 'tithe-offering';
    if (id === 'ajo-chama') return window.location.pathname.indexOf('/tools/ajo-chama/') === 0 ? 'ajo-chama-calc' : 'ajo-chama';
    return id;
  }

  function tool(id) {
    return TOOLS[id] || null;
  }

  function playbook(id) {
    return PLAYBOOKS[id] || {
      competitor: 'Comparable single-purpose web tools',
      sourceName: 'African tools workflow',
      sourceUrl: '/african/',
      gap: 'Most tools answer one question and then leave the user to work out the next action alone.',
      upgrade: 'Save the result, open the next suggested app, and export a brief when the result needs sharing.',
      checks: ['Save the step to dashboard', 'Open the next app', 'Export a PDF brief'],
      pdf: 'African workflow PDF'
    };
  }

  function findRoute(id) {
    for (var i = 0; i < ROUTES.length; i++) {
      if (ROUTES[i].id === id) return ROUTES[i];
    }
    return null;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(value) {
    var url = String(value || '');
    if (!url) return '#';
    if (url.charAt(0) === '/') return url;
    if (/^https?:\/\//i.test(url)) return url;
    return '#';
  }

  function buildBriefText(toolId) {
    var meta = tool(toolId);
    var pb = playbook(toolId);
    var next = meta && meta.next ? meta.next.map(function (id) {
      var item = tool(id);
      return item ? item.name + ' (' + item.href + ')' : id;
    }) : [];
    return [
      'AfroTools African workflow brief',
      'Tool: ' + (meta ? meta.name : toolId),
      'Competitor/source checked: ' + pb.competitor,
      'Source link: ' + pb.sourceUrl,
      'Observed gap: ' + pb.gap,
      'AfroTools upgrade: ' + pb.upgrade,
      'Checklist:',
      '- ' + (pb.checks || []).join('\n- '),
      'Next tools:',
      '- ' + (next.length ? next.join('\n- ') : 'Open the African category hub (/african/)'),
      'Saved at: ' + new Date().toISOString()
    ].join('\n');
  }

  function nextToolPayload(meta) {
    return (meta.next || []).map(function (id) {
      var item = tool(id);
      return item ? { id: id, name: item.name, href: item.href, group: item.group } : null;
    }).filter(Boolean);
  }

  function copyBrief(toolId, statusEl) {
    var text = buildBriefText(toolId);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        if (statusEl) statusEl.textContent = 'Action brief copied. You can paste it into WhatsApp, email, or a team note.';
      }).catch(function () {
        if (statusEl) statusEl.textContent = text;
      });
    } else if (statusEl) {
      statusEl.textContent = text;
    }
  }

  function captureLead(email, source, toolId) {
    try {
      localStorage.setItem(EMAIL_KEY, email);
      localStorage.setItem('afrotools_lead_email', email);
    } catch (e) {}
    try {
      fetch('/api/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: source || 'african-workflow-pdf',
          toolSlug: toolId || getToolId(),
          optInDigest: true,
          pageUrl: window.location.href,
          referrerUrl: document.referrer || null,
          deviceType: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop'
        })
      }).catch(function () {});
    } catch (e) {}
  }

  function hasEmail() {
    try {
      return !!(localStorage.getItem(EMAIL_KEY) || localStorage.getItem('afrotools_lead_email'));
    } catch (e) {
      return false;
    }
  }

  function showGate(callback, toolId, source) {
    if (hasEmail()) {
      callback();
      return;
    }
    var backdrop = document.createElement('div');
    backdrop.className = 'afw-modal-backdrop';
    backdrop.innerHTML = '<div class="afw-modal" role="dialog" aria-modal="true" aria-labelledby="afwGateTitle">' +
      '<h3 id="afwGateTitle">Send me the African workflow PDF</h3>' +
      '<p>Enter your email to unlock the printable plan. We will also save the workflow source so the dashboard can connect your next steps.</p>' +
      '<form id="afwGateForm">' +
      '<input type="email" id="afwGateEmail" placeholder="you@example.com" autocomplete="email" required>' +
      '<div class="afw-modal-actions">' +
      '<button class="afw-btn" type="button" id="afwGateCancel">Cancel</button>' +
      '<button class="afw-btn primary" type="submit">Unlock PDF</button>' +
      '</div>' +
      '</form>' +
      '</div>';
    document.body.appendChild(backdrop);
    var input = backdrop.querySelector('#afwGateEmail');
    setTimeout(function () { input.focus(); }, 40);
    backdrop.querySelector('#afwGateCancel').addEventListener('click', function () { backdrop.remove(); });
    backdrop.addEventListener('click', function (event) {
      if (event.target === backdrop) backdrop.remove();
    });
    backdrop.querySelector('#afwGateForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        input.focus();
        input.style.borderColor = '#dc2626';
        return;
      }
      captureLead(email, source || 'african-workflow-pdf', toolId);
      backdrop.remove();
      callback();
    });
  }

  async function saveToDashboard(toolId, statusEl) {
    var meta = tool(toolId);
    if (!meta) return;
    var pb = playbook(toolId);
    var items = readItems().filter(function (item) { return item.id !== toolId; });
    var item = {
      id: toolId,
      name: meta.name,
      href: meta.href,
      group: meta.group,
      next: meta.next || [],
      nextTools: nextToolPayload(meta),
      sourceName: pb.sourceName,
      sourceUrl: pb.sourceUrl,
      competitor: pb.competitor,
      gap: pb.gap,
      upgrade: pb.upgrade,
      checks: pb.checks || [],
      brief: buildBriefText(toolId),
      savedAt: new Date().toISOString()
    };
    items.unshift(item);
    writeItems(items);
    try {
      if (window.afroFavs && typeof window.afroFavs.save === 'function') window.afroFavs.save(toolId);
    } catch (e) {}
    try {
      if (window.AfroWorkspace && AfroWorkspace.upsert && AfroWorkspace.isSignedIn && AfroWorkspace.isSignedIn()) {
        await AfroWorkspace.upsert({
          itemType: 'african_workflow',
          itemKey: toolId,
          toolSlug: toolId,
          title: meta.name,
          summary: 'African workflow: ' + meta.group + '. ' + pb.upgrade + ' Next: ' + (meta.next || []).map(function (id) { return (tool(id) || {}).name || id; }).join(', '),
          href: meta.href,
          payload: item
        });
      }
    } catch (e) {}
    if (statusEl) statusEl.textContent = 'Saved to your African workflow. It will appear in the dashboard workspace on this device, and in cloud workspace when signed in.';
  }

  function printWorkflow(toolId) {
    saveToDashboard(toolId);
    showGate(function () {
      window.print();
    }, toolId, 'african-workflow-pdf');
  }

  async function saveRoutePlan(routeId, statusEl) {
    var route = findRoute(routeId);
    if (!route) return;
    var start = tool(route.start);
    var sequenceIds = start ? [route.start].concat(start.next || []) : [];
    var items = readItems().filter(function (item) { return item.id !== 'route-' + routeId; });
    var item = {
      id: 'route-' + routeId,
      name: route.title,
      href: start ? start.href : '/african/',
      group: 'African route',
      routeId: routeId,
      upgrade: route.copy,
      nextTools: sequenceIds.map(function (id) {
        var entry = tool(id);
        return entry ? { id: id, name: entry.name, href: entry.href, group: entry.group } : null;
      }).filter(Boolean),
      checks: ['Start with ' + (start ? start.name : 'the African hub'), 'Save each result to dashboard', 'Export a PDF when the plan needs a family, team, or client handoff'],
      savedAt: new Date().toISOString()
    };
    items.unshift(item);
    writeItems(items);
    try {
      if (window.AfroWorkspace && AfroWorkspace.upsert && AfroWorkspace.isSignedIn && AfroWorkspace.isSignedIn()) {
        await AfroWorkspace.upsert({
          itemType: 'african_workflow_route',
          itemKey: item.id,
          toolSlug: 'african-category',
          title: route.title,
          summary: route.copy,
          href: item.href,
          payload: item
        });
      }
    } catch (e) {}
    if (statusEl) statusEl.textContent = 'Route saved. Open the dashboard workspace to continue from the first tool and track follow-up steps.';
  }

  function attachFormLeadCapture(toolId) {
    var forms = Array.prototype.slice.call(document.querySelectorAll('form'));
    forms.forEach(function (form) {
      if (form.dataset.afwLeadBound === '1') return;
      var email = form.querySelector('input[type="email"], input[autocomplete="email"]');
      if (!email) return;
      form.dataset.afwLeadBound = '1';
      form.addEventListener('submit', function () {
        var value = (email.value || '').trim();
        if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          captureLead(value, 'african-tool-form', toolId);
        }
      });
    });
  }

  function renderToolPanel(toolId) {
    var meta = tool(toolId);
    if (!meta) return;
    if (document.querySelector('[data-african-workflow-mounted="' + toolId + '"]')) return;
    var next = (meta.next || []).map(tool).filter(Boolean);
    var pb = playbook(toolId);
    var savedCount = readItems().length;
    var shell = document.createElement('section');
    shell.className = 'afw-shell';
    shell.dataset.africanWorkflowMounted = toolId;
    shell.innerHTML = '<div class="afw-panel">' +
      '<div class="afw-panel-header">' +
      '<div><div class="afw-kicker">African workflow</div><h2 class="afw-title">Continue from ' + escapeHtml(meta.name) + '</h2>' +
      '<p class="afw-copy">This tool now sits inside a connected category journey. Save it to your dashboard, export a printable action plan, or jump to the next tool that naturally follows this result.</p></div>' +
      '<div class="afw-progress"><strong>' + savedCount + '</strong><span>Saved steps</span></div>' +
      '</div><div class="afw-body">' +
      '<div class="afw-playbook">' +
      '<div class="afw-playbook-head"><div><span>Competitor-informed pass</span><strong>' + escapeHtml(pb.competitor) + '</strong></div><a href="' + safeUrl(pb.sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(pb.sourceName || 'Source') + '</a></div>' +
      '<div class="afw-playbook-grid"><div><small>Gap found</small><p>' + escapeHtml(pb.gap) + '</p></div><div><small>AfroTools upgrade</small><p>' + escapeHtml(pb.upgrade) + '</p></div></div>' +
      '<ul class="afw-checks">' + (pb.checks || []).map(function (item) { return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>' +
      '</div>' +
      '<div class="afw-next-grid">' + next.map(function (item) {
        return '<a class="afw-tool-link" href="' + item.href + '"><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.group) + '</span><small>Open next</small></a>';
      }).join('') + '</div>' +
      '<div class="afw-actions"><button class="afw-btn primary" type="button" data-afw-save>Save to dashboard</button><button class="afw-btn" type="button" data-afw-brief>Copy action brief</button><button class="afw-btn" type="button" data-afw-pdf>' + escapeHtml(pb.pdf || 'Print / save PDF plan') + '</button><a class="afw-btn" href="/dashboard/#myWorkspace">Open dashboard</a></div>' +
      '<div class="afw-status" aria-live="polite"></div>' +
      '</div></div>';
    var anchor = document.querySelector('[data-african-workflow]') || document.querySelector('afro-related-tools') || document.querySelector('afro-newsletter-cta') || document.querySelector('afro-footer');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(shell, anchor);
    else document.body.appendChild(shell);
    var statusEl = shell.querySelector('.afw-status');
    shell.querySelector('[data-afw-save]').addEventListener('click', function () { saveToDashboard(toolId, statusEl); });
    shell.querySelector('[data-afw-brief]').addEventListener('click', function () { copyBrief(toolId, statusEl); });
    shell.querySelector('[data-afw-pdf]').addEventListener('click', function () { printWorkflow(toolId); });
  }

  function renderHub() {
    var placeholder = document.querySelector('[data-african-hub-workflows]');
    if (!placeholder) return;
    var savedCount = readItems().length;
    placeholder.classList.add('afw-shell');
    placeholder.innerHTML = '<div class="afw-panel">' +
      '<div class="afw-panel-header">' +
      '<div><div class="afw-kicker">Start with the outcome</div><h2 class="afw-title">Build an African workflow, not a one-off calculation</h2>' +
      '<p class="afw-copy">Competitor tools usually stop at a single calculator. This hub now starts from the user journey: relocation, money movement, household cost control, community finance, market intelligence, or creative work. Every app now carries a source-informed gap, checklist, dashboard save, and PDF handoff.</p></div>' +
      '<div class="afw-progress"><strong>' + savedCount + '</strong><span>Saved steps</span></div>' +
      '</div><div class="afw-body"><div class="afw-route-grid">' + ROUTES.map(function (route) {
        var start = tool(route.start);
        return '<article class="afw-route-card" data-route="' + route.id + '">' +
          '<strong>' + escapeHtml(route.title) + '</strong><span>' + escapeHtml(route.copy) + '</span>' +
          '<div class="afw-route-actions"><a href="' + (start ? start.href : '#tools') + '">Start with ' + escapeHtml(start ? start.name : 'tools') + '</a><button type="button" data-afw-save-route="' + route.id + '">Save route</button></div>' +
          '</article>';
      }).join('') + '</div>' +
      '<div class="afw-hub-proof"><strong>Second pass added:</strong> personalized competitor/source playbooks for every African app, form email capture where a tool already asks for email, and richer dashboard payloads with source, gap, upgrade, checklist, and next-tool data.</div>' +
      '<div class="afw-actions"><button class="afw-btn primary" type="button" data-afw-hub-pdf>Get printable category plan</button><a class="afw-btn" href="/dashboard/#myWorkspace">Open dashboard workspace</a></div>' +
      '<div class="afw-status" aria-live="polite"></div></div></div>';
    var statusEl = placeholder.querySelector('.afw-status');
    placeholder.querySelectorAll('[data-afw-save-route]').forEach(function (button) {
      button.addEventListener('click', function () {
        saveRoutePlan(button.getAttribute('data-afw-save-route'), statusEl);
      });
    });
    placeholder.querySelector('[data-afw-hub-pdf]').addEventListener('click', function () {
      showGate(function () { window.print(); }, 'african-category', 'african-category-pdf');
    });
  }

  function init() {
    renderHub();
    var path = window.location.pathname;
    if (path.indexOf('/african/') === 0 || path.indexOf('/uniquely-african/') === 0) return;
    var id = getToolId();
    if (tool(id)) {
      renderToolPanel(id);
      attachFormLeadCapture(id);
    }
  }

  window.AfroAfricanWorkflow = {
    tools: TOOLS,
    playbooks: PLAYBOOKS,
    readItems: readItems,
    saveToDashboard: saveToDashboard,
    saveRoutePlan: saveRoutePlan,
    showGate: showGate,
    printWorkflow: printWorkflow,
    buildBriefText: buildBriefText
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
