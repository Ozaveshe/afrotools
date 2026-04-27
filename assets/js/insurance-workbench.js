(function () {
  'use strict';

  var SOURCE_LINKS = {
    claims: {
      label: 'NAIC consumer claim guidance',
      href: 'https://content.naic.org/index.php/article/what-you-need-know-when-filing-homeowners-claim'
    },
    schengen: {
      label: 'EU Visa Code Article 15',
      href: 'https://eur-lex.europa.eu/legal-content/AUTO/?uri=CELEX%3A02009R0810-20200202'
    },
    indexInsurance: {
      label: 'World Bank index insurance research',
      href: 'https://blogs.worldbank.org/en/developmenttalk/does-index-insurance-really-work-for-smallholder-farmers-'
    },
    mobileMoney: {
      label: 'World Bank mobile money micro-insurance example',
      href: 'https://blogs.worldbank.org/en/peoplemove/mobile-money-platforms-for-agricultural-micro-insurance'
    },
    disclosure: {
      label: 'IAIS Insurance Core Principles',
      href: 'https://www.iaisweb.org/icps/'
    },
    hippo: {
      label: 'Hippo insurance comparison flow',
      href: 'https://www.hippo.co.za/Insurance/'
    },
    mtek: {
      label: 'mTek digital insurance marketplace',
      href: 'https://www.mtek-services.org/'
    },
    money254: {
      label: 'Money254 and mTek comparison flow',
      href: 'https://www.money254.co.ke/insurance/insurance-home'
    },
    naked: {
      label: 'Naked app quote and claim flow',
      href: 'https://www.naked.insure/car-insurance/guide/tap-quote-insure-how-you-can-manage-your-car-insurance-via-the-naked-app'
    },
    pineapple: {
      label: 'Pineapple digital insurance model',
      href: 'https://pineapple.co.za/post/what-makes-pineapple-different/'
    },
    turaco: {
      label: 'Turaco embedded microinsurance model',
      href: 'https://turaco.insure/'
    },
    euPublication: {
      label: 'EU travel medical insurance report',
      href: 'https://op.europa.eu/en/publication-detail/-/publication/7a93fff4-7b7d-11eb-9ac9-01aa75ed71a1/language-en'
    },
    businessHippo: {
      label: 'Hippo business insurance guide',
      href: 'https://www.hippo.co.za/business-insurance-quote/business-insurance-guide/'
    },
    cargoClauses: {
      label: 'Institute Cargo Clauses comparison',
      href: 'https://www.charterhousemarine.com/marine-insurance/institute-cargo-clauses.html'
    }
  };

  var GUIDES = {
    'car-insurance': {
      title: 'Car insurance quote pack',
      requiredIds: ['vehicleValue'],
      checks: [
        'Third-party legal minimum and comprehensive premium range',
        'Vehicle age, driver age, license history and claim history',
        'Typical excess, no-claim discount signal and policy verification questions'
      ],
      questions: [
        'What is the third-party property damage limit?',
        'What excess applies to accidental damage, theft and flood?',
        'Can I verify the certificate on the national insurance database?',
        'Does a tracker, immobiliser or secure parking reduce the premium?'
      ],
      docs: ['Vehicle registration', 'Driver license', 'Proof of value or invoice', 'Photos of vehicle', 'Prior claim history'],
      actions: ['Compare third-party, comprehensive and excess side by side.', 'Ask for the policy wording before paying.', 'Keep the certificate and verification receipt together.'],
      sourceLinks: ['disclosure', 'claims']
    },
    'health-insurance-compare': {
      title: 'Health plan comparison desk',
      requiredIds: ['age'],
      checks: [
        'Private plan premium range and public scheme contribution context',
        'Dependents, age, pre-existing condition loading and budget tier',
        'Provider shortlist with network and exclusion questions'
      ],
      questions: [
        'Which hospitals are in-network near home and work?',
        'Are maternity, chronic illness, dental or optical benefits capped?',
        'What waiting period applies before major treatment?',
        'Is pre-authorisation required for admission or specialist care?'
      ],
      docs: ['Member ID', 'Dependent details', 'Medical history summary', 'Preferred hospital list', 'Claim reimbursement form'],
      actions: ['Choose on network fit first, then premium.', 'Check waiting periods before switching plans.', 'Keep receipts and diagnosis notes for reimbursement.'],
      sourceLinks: ['disclosure', 'claims']
    },
    'life-insurance-calc': {
      title: 'Life cover needs desk',
      requiredIds: ['annualIncome'],
      checks: [
        'Income replacement, debts, education reserve and funeral cost',
        'Existing cover gap and term length recommendation',
        'Group-life premium rate context where available'
      ],
      questions: [
        'Is the payout enough to clear debts and replace income?',
        'Does the policy exclude high-risk occupations or travel?',
        'Can beneficiaries claim with local ID and bank details?',
        'Is cover level or decreasing over the term?'
      ],
      docs: ['Policy schedule', 'Beneficiary IDs', 'Debt statement', 'School fee estimate', 'Medical disclosure record'],
      actions: ['Match cover to real obligations, not a round number.', 'Review beneficiaries after marriage, birth or relocation.', 'Store the policy where family can find it.'],
      sourceLinks: ['disclosure', 'claims']
    },
    'funeral-insurance': {
      title: 'Funeral cover planner',
      requiredIds: ['coverAmount'],
      checks: [
        'Monthly premium against chosen cover amount and family size',
        'Waiting period and accidental-death distinction',
        'Country funeral-cost range and family cover pressure'
      ],
      questions: [
        'Who is covered under the main member and extended family rules?',
        'What waiting period applies to natural death?',
        'Are groceries, transport or burial society costs included?',
        'Can claims be paid to a funeral home or only a beneficiary?'
      ],
      docs: ['Member ID', 'Covered family list', 'Beneficiary details', 'Death certificate process', 'Premium payment proof'],
      actions: ['Do not buy duplicate funeral cover without checking total payout caps.', 'Confirm waiting periods in writing.', 'Keep family member names exactly as shown on IDs.'],
      sourceLinks: ['claims', 'disclosure']
    },
    'travel-insurance': {
      title: 'Travel insurance visa desk',
      requiredIds: ['duration', 'travelers', 'age'],
      checks: [
        'Destination zone, trip duration, traveller count and age loading',
        'Medical, baggage and cancellation cover tiers',
        'Schengen readiness check for the EUR 30,000 medical minimum'
      ],
      questions: [
        'Does the certificate state the destination region and full trip dates?',
        'Is emergency medical and repatriation cover at least EUR 30,000 for Schengen?',
        'Are pre-existing conditions excluded or declared?',
        'Does the policy include visa refusal, delay or baggage benefits?'
      ],
      docs: ['Travel insurance certificate', 'Passport copy', 'Tickets or itinerary', 'Visa appointment checklist', 'Emergency assistance number'],
      actions: ['For Schengen, buy for the full stay plus transit days.', 'Print the certificate as a PDF, not a screenshot.', 'Save the emergency assistance number offline.'],
      sourceLinks: ['schengen', 'claims']
    },
    'business-insurance': {
      title: 'SME insurance pack',
      requiredIds: ['annualRevenue', 'propertyValue'],
      checks: [
        'Fire, burglary, public liability, professional indemnity and goods-in-transit ranges',
        'Business type risk loading and stock/property exposure',
        'Coverage gaps that can shut down a small business after a loss'
      ],
      questions: [
        'Does cover include stock away from premises or only at the shop?',
        'Is business interruption included or excluded?',
        'What public liability limit is required by landlord, mall or client?',
        'Are cash-in-transit, cyber, employee theft or goods-in-transit optional add-ons?'
      ],
      docs: ['Business registration', 'Asset list', 'Stock valuation', 'Lease agreement', 'Revenue estimate', 'Security/fire safety evidence'],
      actions: ['Insure replacement cost, not old book value.', 'Ask for a package quote and a claims excess table.', 'Keep stock photos and invoices monthly.'],
      sourceLinks: ['disclosure', 'claims']
    },
    'crop-insurance-calc': {
      title: 'Crop risk and index cover desk',
      requiredIds: ['farmSize', 'expectedYield', 'pricePerTonne'],
      checks: [
        'Sum insured from hectares, expected yield and crop price',
        'Premium rate, subsidy assumption and farmer-paid amount',
        'Index trigger and basis-risk warning for weather products'
      ],
      questions: [
        'Is payout based on farm inspection, rainfall index or area yield?',
        'Which weather station or satellite data source is used?',
        'What planting window and crop variety must be followed?',
        'How and when are farmers paid after a trigger?'
      ],
      docs: ['Farm coordinates', 'Planting date', 'Input receipts', 'Crop variety', 'Mobile money wallet', 'Photos before and after loss'],
      actions: ['Check the trigger rules before paying.', 'Do not assume every visible loss pays out under index cover.', 'Keep input receipts because some products insure inputs, not harvest value.'],
      sourceLinks: ['indexInsurance', 'mobileMoney']
    },
    'motor-third-party': {
      title: 'Mandatory motor cover desk',
      requiredIds: [],
      checks: [
        'Legal third-party premium range by vehicle type, engine size and usage',
        'Regulator, mandatory status and local provider shortlist',
        'Warning that third-party cover does not repair your own vehicle'
      ],
      questions: [
        'What bodily injury and property damage limits apply?',
        'Can police or road agencies verify the certificate digitally?',
        'Does the policy cover ECOWAS, COMESA or cross-border travel?',
        'Do I need comprehensive cover for theft, flood or own damage?'
      ],
      docs: ['Vehicle registration', 'Roadworthiness document', 'Driver license', 'Insurance certificate', 'Payment receipt'],
      actions: ['Buy third-party before driving, then decide if comprehensive is worth it.', 'Verify the certificate immediately.', 'Keep a copy in the vehicle and on your phone.'],
      sourceLinks: ['disclosure', 'claims']
    },
    'professional-indemnity': {
      title: 'Professional indemnity desk',
      requiredIds: ['annualRevenue'],
      checks: [
        'Profession risk loading, annual fees, cover limit and prior claims',
        'Typical excess and rate applied',
        'Contract-ready questions for consultants and regulated professionals'
      ],
      questions: [
        'Is the policy claims-made or occurrence-based?',
        'What retroactive date applies?',
        'Are defence costs inside or outside the limit?',
        'Do client contracts require a minimum cover limit?'
      ],
      docs: ['Professional license', 'Annual fee estimate', 'Client contract requirements', 'Prior claim declaration', 'Scope of services'],
      actions: ['Match cover limit to contract exposure, not just annual revenue.', 'Confirm retroactive date before switching insurers.', 'Keep engagement letters for each client.'],
      sourceLinks: ['disclosure', 'claims']
    },
    'fire-insurance': {
      title: 'Fire and property cover desk',
      requiredIds: ['propertyValue'],
      checks: [
        'Property value, construction class, use type and fire protection discount',
        'Rate range and monthly premium equivalent',
        'Underinsurance and replacement-cost reminders'
      ],
      questions: [
        'Is the building insured for replacement cost or market value?',
        'Are contents, stock and tenant improvements included?',
        'Does the insurer require extinguishers, alarms or sprinklers?',
        'Is business interruption included after a fire?'
      ],
      docs: ['Valuation report', 'Property title or lease', 'Fire safety evidence', 'Photos of building', 'Inventory list'],
      actions: ['Update the sum insured after renovations or inflation.', 'Photograph fire protection equipment.', 'Ask whether average clause applies to underinsurance.'],
      sourceLinks: ['disclosure', 'claims']
    },
    'marine-insurance': {
      title: 'Cargo insurance desk',
      requiredIds: ['cifValue'],
      checks: [
        'CIF value, cargo type, route and ICC cover level',
        'Sum insured at CIF plus 10 percent and war-risk surcharge',
        'Document pack for import and export claims'
      ],
      questions: [
        'Are Institute Cargo Clauses A, B or C being quoted?',
        'Does the policy cover war, strikes, piracy and delay?',
        'Is the insured value CIF plus 10 percent?',
        'Which documents are needed if cargo is damaged at port?'
      ],
      docs: ['Commercial invoice', 'Packing list', 'Bill of lading', 'Marine certificate', 'Survey report', 'Photos at delivery'],
      actions: ['Match cover type to cargo risk, not only price.', 'Insure before goods leave origin.', 'Keep port inspection records and delivery notes.'],
      sourceLinks: ['disclosure', 'claims']
    },
    'microinsurance': {
      title: 'Microinsurance fit checker',
      requiredIds: ['coverAmount'],
      checks: [
        'Daily, weekly, monthly and annual premium view',
        'Mobile-money payment readiness and provider shortlist',
        'Product fit for hospital cash, accident, funeral, crop or device cover'
      ],
      questions: [
        'Can claims be paid to mobile money?',
        'What daily waiting period or exclusion applies?',
        'Is premium deducted automatically from airtime or wallet?',
        'Can the policy be cancelled without losing earned benefits?'
      ],
      docs: ['Mobile money number', 'National ID', 'Next-of-kin contact', 'Premium SMS receipts', 'Claim form or USSD code'],
      actions: ['Choose simple cover with a fast claim path.', 'Keep SMS confirmations.', 'Avoid products where exclusions are longer than the benefit description.'],
      sourceLinks: ['mobileMoney', 'claims']
    },
    'claim-tracker': {
      title: 'Claim file builder',
      requiredIds: [],
      checks: [
        'Claim-type document checklist',
        'Reporting timeline and follow-up cadence',
        'A simple file discipline to reduce avoidable rejection'
      ],
      questions: [
        'What is the claim reference number?',
        'Which documents are still missing?',
        'When did the insurer acknowledge receipt?',
        'Who is the assigned claims handler or loss adjuster?'
      ],
      docs: ['Policy schedule', 'Completed claim form', 'Photos or evidence', 'Police or medical report', 'Receipts and estimates', 'Written acknowledgement'],
      actions: ['Report quickly and keep a dated communication log.', 'Submit copies, not originals, unless required.', 'Follow up weekly with reference number and missing item list.'],
      sourceLinks: ['claims', 'disclosure']
    },
    'workers-comp': {
      title: 'Workers compensation desk',
      requiredIds: ['annualPayroll', 'employees'],
      checks: [
        'Annual payroll, employee count, industry risk and claim history',
        'Rate range, monthly contribution and per-employee view',
        'Employer incident documentation pack'
      ],
      questions: [
        'Which employee classes are covered by this rate?',
        'Are casual, contract or field workers included?',
        'What incident reporting deadline applies?',
        'Does the policy require workplace safety documentation?'
      ],
      docs: ['Payroll summary', 'Employee register', 'Incident report template', 'Medical certificate process', 'Safety training records'],
      actions: ['Classify payroll by actual work risk.', 'Train supervisors to report incidents same day.', 'Keep medical and wage records together for claims.'],
      sourceLinks: ['claims', 'disclosure']
    },
    'health-contribution': {
      title: 'Statutory health contribution desk',
      requiredIds: ['grossSalary'],
      checks: [
        'Public health scheme, contribution basis and monthly total',
        'Employee and employer split where the country data supports it',
        'Mandatory or voluntary status and provider context'
      ],
      questions: [
        'Is contribution based on gross salary, basic salary or flat household fee?',
        'Is there a minimum, cap or family coverage rule?',
        'Does employer payroll need a separate remittance schedule?',
        'Which benefits require pre-authorisation?'
      ],
      docs: ['Payslip', 'National ID', 'Employer registration', 'Dependent list', 'Scheme membership number'],
      actions: ['Check whether salary basis is gross or basic.', 'Keep employer and employee remittance proof.', 'Update dependents when household changes.'],
      sourceLinks: ['disclosure', 'claims']
    },
    'insurance-fraud-checker': {
      title: 'Fraud review and evidence discipline',
      requiredIds: [],
      checks: [
        'Timing, value, behaviour and evidence red flags',
        'Claim-to-premium ratio and triggered flag count',
        'Country reporting channels and lawful-use warning'
      ],
      questions: [
        'Which facts are verified and which are only unknown?',
        'Has the claimant been given a fair chance to provide documents?',
        'Is an independent loss adjuster or medical review needed?',
        'Which channel receives suspected fraud reports in this country?'
      ],
      docs: ['Claim file', 'Policy schedule', 'Independent assessment', 'Communication log', 'Fraud referral note'],
      actions: ['Treat red flags as investigation prompts, not proof.', 'Document every evidence request.', 'Refer high-risk cases to the lawful fraud channel.'],
      sourceLinks: ['claims', 'disclosure']
    }
  };

  var PROFILE_TOOLS = [
    { id: 'driver', label: 'I drive or own a vehicle', tools: ['motor-third-party', 'car-insurance', 'claim-tracker', 'insurance-fraud-checker'] },
    { id: 'family', label: 'I protect my family or health', tools: ['health-contribution', 'health-insurance-compare', 'life-insurance-calc', 'funeral-insurance'] },
    { id: 'business', label: 'I run a business', tools: ['business-insurance', 'fire-insurance', 'professional-indemnity', 'workers-comp'] },
    { id: 'farmer', label: 'I farm or insure crops', tools: ['crop-insurance-calc', 'microinsurance', 'claim-tracker'] },
    { id: 'traveller', label: 'I travel or import goods', tools: ['travel-insurance', 'marine-insurance', 'claim-tracker'] },
    { id: 'claims', label: 'I am filing or reviewing a claim', tools: ['claim-tracker', 'insurance-fraud-checker'] }
  ];

  var HUB_LESSONS = [
    {
      title: 'Compare more than price',
      items: ['Annual premium', 'Excess or co-pay', 'Claim channel', 'Waiting period', 'What is excluded']
    },
    {
      title: 'Keep proof in your phone',
      items: ['Policy schedule', 'Payment receipt', 'Certificate or member number', 'Photos before a loss', 'Claim reference number']
    },
    {
      title: 'Fit the African payment reality',
      items: ['Ask about monthly or mobile-money payments', 'Check whether missed payments cancel cover', 'Avoid policies where the benefit is smaller than the likely emergency cost']
    },
    {
      title: 'Verify the seller',
      items: ['Regulator licence', 'Insurer name behind the broker', 'Official payment account', 'Digital certificate check where available', 'Written policy wording before payment']
    }
  ];

  var BUYER_RULES = {
    default: {
      checklist: [
        'Insurer or broker licence checked with the regulator',
        'Policy schedule and wording received before payment',
        'Excess, waiting period, exclusions and limits written down',
        'Claim channel, reference process and response time known',
        'Receipt, certificate or mobile-money confirmation saved offline'
      ],
      redFlags: [
        'A price is quoted without policy wording',
        'An agent asks for payment to a personal account or wallet',
        'The excess, waiting period or exclusions are only explained verbally',
        'The claim office, hotline or digital certificate check cannot be confirmed'
      ]
    },
    'car-insurance': {
      checklist: [
        'Certificate can be verified digitally or through the regulator-backed channel',
        'Own-damage, theft, flood and third-party limits are separate on the quote',
        'Tracker, parking and driver restrictions are written into the policy',
        'Excess for accident, theft, windscreen and flood is shown line by line'
      ],
      redFlags: [
        'Comprehensive quote is much cheaper but excludes flood, theft or riots',
        'Third-party cover is sold as if it will repair your own car',
        'Vehicle value is inflated or far below market value without explanation'
      ]
    },
    'motor-third-party': {
      checklist: [
        'Certificate number can be checked before driving',
        'Bodily injury and property damage limits are visible',
        'Cross-border cover is confirmed before regional travel',
        'Receipt and certificate are stored on the phone and in the vehicle'
      ],
      redFlags: [
        'Certificate cannot be verified',
        'Cover is backdated without a clear lawful reason',
        'You are told third-party cover protects your own vehicle'
      ]
    },
    'health-insurance-compare': {
      checklist: [
        'Nearest preferred hospitals are in-network',
        'Maternity, chronic, dental, optical and emergency benefits are capped clearly',
        'Waiting periods and pre-authorisation rules are shown',
        'Reimbursement documents and claim timelines are known'
      ],
      redFlags: [
        'Provider list is old or not specific to your city',
        'Low premium hides a very small annual limit',
        'Pre-existing conditions are accepted verbally but excluded in writing'
      ]
    },
    'health-contribution': {
      checklist: [
        'Contribution basis is clear: gross salary, basic salary or flat fee',
        'Employer and employee portions are separated',
        'Dependents are registered under the right household or payroll record',
        'Membership number and remittance proof are stored'
      ],
      redFlags: [
        'Payroll deduction appears but the scheme cannot confirm membership',
        'Dependents are assumed covered without registration',
        'Employer remittance proof is missing'
      ]
    },
    'life-insurance-calc': {
      checklist: [
        'Beneficiary names match official ID records',
        'Medical and occupation disclosures are complete',
        'Debt, school-fee and income-replacement needs are documented',
        'Family knows where the policy and claim documents are kept'
      ],
      redFlags: [
        'Policy is sold as savings when the main need is protection',
        'Beneficiary details are incomplete',
        'Exclusions for occupation, travel or health are skipped'
      ]
    },
    'funeral-insurance': {
      checklist: [
        'Covered family members are named exactly as IDs show',
        'Natural-death waiting period is confirmed',
        'Payout method and funeral-home payment rules are clear',
        'Duplicate policies are checked for total payout caps'
      ],
      redFlags: [
        'Extended family cover is promised but names are not listed',
        'Waiting period is hidden in small print',
        'Multiple policies cost more than the likely funeral gap'
      ]
    },
    'business-insurance': {
      checklist: [
        'Stock, equipment, cash and goods-in-transit are valued separately',
        'Business interruption is included or deliberately excluded',
        'Public liability limit meets landlord, mall or client contract requirements',
        'Monthly photo and invoice evidence is kept'
      ],
      redFlags: [
        'Only the building is covered while stock is the real exposure',
        'Revenue loss after fire or flood is not covered',
        'Client contract requires a higher liability limit than the quote'
      ]
    },
    'crop-insurance-calc': {
      checklist: [
        'Trigger type is clear: farm inspection, rainfall index or area yield',
        'Weather station, satellite source or area-yield zone is identified',
        'Planting window and required crop practice are written down',
        'Mobile-money payout route and farmer ID match'
      ],
      redFlags: [
        'Visible crop loss is assumed to pay even though cover is index-based',
        'Trigger station is far from the farm',
        'Seed or input receipt is missing'
      ]
    },
    'microinsurance': {
      checklist: [
        'Premium amount and deduction frequency are clear',
        'Claim can be started by USSD, app, agent or mobile money channel',
        'SMS confirmations are saved',
        'Benefit is large enough for the emergency it is meant to cover'
      ],
      redFlags: [
        'Daily premium is cheap but annual benefit is tiny',
        'Airtime or wallet deductions continue after cancellation',
        'Exclusions are longer than the benefit description'
      ]
    },
    'travel-insurance': {
      checklist: [
        'Certificate covers the full trip and transit dates',
        'Emergency medical and repatriation limit is shown',
        'Visa destination rules are met where applicable',
        'Emergency assistance number is saved offline'
      ],
      redFlags: [
        'Certificate dates do not cover the whole visa stay',
        'Medical limit is missing or below destination minimum',
        'Pre-existing conditions are not declared'
      ]
    },
    'marine-insurance': {
      checklist: [
        'Cargo clause level is stated',
        'War, strike, piracy and delay treatment is clear',
        'Insured value is tied to invoice, freight and expected margin',
        'Survey and delivery records are collected at port'
      ],
      redFlags: [
        'Cover starts after goods have already left origin',
        'Delay is assumed covered under a basic cargo policy',
        'No survey process exists for damaged cargo'
      ]
    },
    'claim-tracker': {
      checklist: [
        'Claim reference number is captured',
        'Missing documents are listed in writing',
        'Every call, email and WhatsApp message is dated',
        'Next follow-up date and handler name are recorded'
      ],
      redFlags: [
        'Original documents are handed over without copies',
        'Claim is delayed because the missing-item list keeps changing',
        'No written acknowledgement from the insurer'
      ]
    },
    'insurance-fraud-checker': {
      checklist: [
        'Unknown facts are separated from verified facts',
        'Claimant has a fair chance to provide missing evidence',
        'Independent assessment is used where value or cause is disputed',
        'Any fraud referral follows the lawful local channel'
      ],
      redFlags: [
        'Red flags are treated as proof instead of investigation prompts',
        'Evidence requests are not documented',
        'A fraud conclusion is made before policy coverage is checked'
      ]
    }
  };

  var APP_UPGRADES = {
    'car-insurance': {
      competitor: 'Naked and Hippo',
      sourceLinks: ['naked', 'hippo'],
      lesson: 'Fast quote journeys win when users can see cover, excess, certificate proof and the claim route before they pay.',
      improvements: [
        'Compare annual premium plus excess as first-year cash need.',
        'Prompt for app, branch, agent or hotline claim channel.',
        'Move drivers into mandatory cover, comprehensive cover, claim file and fraud-safety steps.'
      ]
    },
    'health-insurance-compare': {
      competitor: 'mTek and Money254',
      sourceLinks: ['mtek', 'money254'],
      lesson: 'Health buyers need network fit and waiting-period clarity as much as a monthly price.',
      improvements: [
        'Ask for hospitals near home and work before choosing a plan.',
        'Surface chronic, maternity, optical and dental caps.',
        'Tie private-plan comparison to the statutory contribution tool.'
      ]
    },
    'life-insurance-calc': {
      competitor: 'Hippo and Pineapple',
      sourceLinks: ['hippo', 'pineapple'],
      lesson: 'Digital cover feels safer when the buyer can explain the gap, beneficiaries and exclusions to family.',
      improvements: [
        'Turn income replacement into a beneficiary-ready document pack.',
        'Call out occupation, health and travel exclusions.',
        'Link life cover to funeral cover so families see both emergency and long-term protection.'
      ]
    },
    'funeral-insurance': {
      competitor: 'Hippo',
      sourceLinks: ['hippo'],
      lesson: 'Funeral cover is bought under family pressure, so the page must slow users down around waiting periods and duplicate cover.',
      improvements: [
        'Check named family members against IDs.',
        'Separate natural-death waiting period from accidental-death benefit.',
        'Warn when many small policies cost more than the likely payout gap.'
      ]
    },
    'travel-insurance': {
      competitor: 'Hippo and EU travel medical insurance rules',
      sourceLinks: ['hippo', 'euPublication', 'schengen'],
      lesson: 'Visa buyers need a certificate that consulates can read, not just a cheap travel policy.',
      improvements: [
        'Make destination, full dates, medical limit and repatriation visible.',
        'Remind Schengen applicants about the EUR 30,000 medical minimum.',
        'Generate a PDF-ready visa insurance checklist after email capture.'
      ]
    },
    'business-insurance': {
      competitor: 'Hippo business insurance',
      sourceLinks: ['businessHippo', 'hippo'],
      lesson: 'SMEs need a risk bundle, because fire, public liability, goods-in-transit and interruption are often bought separately.',
      improvements: [
        'Bundle property, stock, liability and business-interruption checks.',
        'Ask which contract, landlord or mall requires a liability limit.',
        'Save a dashboard-ready SME insurance pack for renewal review.'
      ]
    },
    'crop-insurance-calc': {
      competitor: 'World Bank index-insurance research',
      sourceLinks: ['indexInsurance', 'mobileMoney'],
      lesson: 'Farmers need to understand the trigger before paying, especially with rainfall or area-yield products.',
      improvements: [
        'Explain index trigger and basis risk in the buyer checklist.',
        'Ask for farm coordinates, planting window and payout route.',
        'Move crop users into microinsurance and claim follow-up when the risk is household cashflow.'
      ]
    },
    'motor-third-party': {
      competitor: 'mTek and digital certificate flows',
      sourceLinks: ['mtek', 'money254'],
      lesson: 'Mandatory motor insurance is only useful when the certificate can be verified quickly at the roadside.',
      improvements: [
        'Prioritise certificate number, receipt and phone copy.',
        'Separate mandatory third-party liability from own-damage cover.',
        'Route users to comprehensive car cover when theft, flood or own damage matters.'
      ]
    },
    'professional-indemnity': {
      competitor: 'Hippo business insurance',
      sourceLinks: ['businessHippo'],
      lesson: 'Professional buyers compare legal defence, retroactive date and contract limit, not only the annual premium.',
      improvements: [
        'Ask whether defence costs sit inside or outside the limit.',
        'Keep retroactive-date warnings visible before switching insurers.',
        'Link to SME insurance and workers compensation for a complete business pack.'
      ]
    },
    'fire-insurance': {
      competitor: 'NAIC claim discipline and business property cover',
      sourceLinks: ['claims', 'businessHippo'],
      lesson: 'Property buyers need proof of replacement value and inventory before a loss, not after the building burns.',
      improvements: [
        'Push users to photograph assets and fire-safety evidence.',
        'Warn about average clause and underinsurance.',
        'Link fire cover to SME and claims tools for post-loss recovery.'
      ]
    },
    'marine-insurance': {
      competitor: 'Institute Cargo Clauses market practice',
      sourceLinks: ['cargoClauses', 'claims'],
      lesson: 'Importers and exporters must know whether they bought broad ICC A cover or narrower named-peril cover.',
      improvements: [
        'Ask for cargo clause A, B or C before judging price.',
        'Keep CIF plus margin, bill of lading and survey records together.',
        'Route cargo users into claim follow-up if goods arrive damaged.'
      ]
    },
    'microinsurance': {
      competitor: 'Turaco and mobile-money microinsurance',
      sourceLinks: ['turaco', 'mobileMoney'],
      lesson: 'Mass-market insurance succeeds when the premium is tiny, terms are plain, and claims move through familiar channels.',
      improvements: [
        'Show daily, weekly, monthly and annual premium pressure.',
        'Ask whether claims can start by WhatsApp, USSD, agent or wallet.',
        'Save SMS and mobile-money proof inside the buyer pack.'
      ]
    },
    'claim-tracker': {
      competitor: 'NAIC claim checklist practice and app claim status flows',
      sourceLinks: ['claims', 'naked'],
      lesson: 'Claims improve when the next missing item, handler and follow-up date are visible.',
      improvements: [
        'Turn every claim row into a follow-up action.',
        'Keep photos, receipts and written acknowledgements together.',
        'Generate a PDF-ready claim handoff pack after email capture.'
      ]
    },
    'workers-comp': {
      competitor: 'Employer compliance workflows',
      sourceLinks: ['claims', 'businessHippo'],
      lesson: 'Employers need payroll classification and incident records before a workplace injury happens.',
      improvements: [
        'Separate payroll by actual work risk.',
        'Ask for safety training, wage records and medical certificate process.',
        'Route business users through workers, liability and claim follow-up steps.'
      ]
    },
    'health-contribution': {
      competitor: 'Public scheme payroll workflows',
      sourceLinks: ['money254', 'disclosure'],
      lesson: 'Statutory health contributions fail users when payroll deduction is not matched to membership proof.',
      improvements: [
        'Separate employee and employer remittance proof.',
        'Ask whether dependents are registered, not assumed.',
        'Route users into private health comparison when public cover has gaps.'
      ]
    },
    'insurance-fraud-checker': {
      competitor: 'Regulator and claim-review practice',
      sourceLinks: ['claims', 'disclosure'],
      lesson: 'Fraud tools should protect honest claimants by separating unknown facts from verified evidence.',
      improvements: [
        'Label red flags as investigation prompts.',
        'Keep evidence requests and claimant responses dated.',
        'Route reviewers back to the claim tracker before any referral.'
      ]
    }
  };

  var INSURANCE_WORKFLOWS = {
    driver: {
      label: 'Driver cover workflow',
      audience: 'Vehicle owner or driver',
      outcome: 'Drive legally, compare comprehensive cover, and keep a claim-ready file.',
      tools: ['motor-third-party', 'car-insurance', 'claim-tracker', 'insurance-fraud-checker']
    },
    family: {
      label: 'Family protection workflow',
      audience: 'Household or dependents',
      outcome: 'Balance public health, private medical, life and funeral protection.',
      tools: ['health-contribution', 'health-insurance-compare', 'life-insurance-calc', 'funeral-insurance']
    },
    sme: {
      label: 'SME risk workflow',
      audience: 'Shop, consultant, employer or contractor',
      outcome: 'Cover the business interruption, liability, professional and worker risks that can stop cashflow.',
      tools: ['business-insurance', 'fire-insurance', 'professional-indemnity', 'workers-comp', 'claim-tracker']
    },
    farmer: {
      label: 'Farmer resilience workflow',
      audience: 'Smallholder or agribusiness',
      outcome: 'Compare crop risk, basis-risk warnings, household cover and claim follow-up.',
      tools: ['crop-insurance-calc', 'microinsurance', 'claim-tracker']
    },
    traveller: {
      label: 'Travel and trade workflow',
      audience: 'Traveller, importer or exporter',
      outcome: 'Prepare visa/trip cover, cargo cover and a claim file before departure or shipment.',
      tools: ['travel-insurance', 'marine-insurance', 'claim-tracker']
    },
    claims: {
      label: 'Claim control workflow',
      audience: 'Policyholder, broker or reviewer',
      outcome: 'Track missing documents, follow-ups and fair fraud-review discipline.',
      tools: ['claim-tracker', 'insurance-fraud-checker']
    }
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  function addStyle() {
    if (document.getElementById('insurance-workbench-style')) return;
    var style = document.createElement('style');
    style.id = 'insurance-workbench-style';
    style.textContent = [
      '.ins-workbench{margin:1.5rem 0 2rem;padding:1.25rem 0;border-top:1px solid #dbe4ef;border-bottom:1px solid #dbe4ef}',
      '.ins-workbench h2{font-size:1.1rem;font-weight:800;margin:0 0 .35rem;color:#0f172a;letter-spacing:0}',
      '.ins-workbench p{font-size:.9rem;line-height:1.65;color:#475569;margin:.25rem 0 .9rem}',
      '.ins-wb-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:.85rem}',
      '.ins-wb-box{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:1rem}',
      '.ins-wb-box h3{font-size:.82rem;font-weight:800;margin:0 0 .55rem;color:#1e3a5f;letter-spacing:0;text-transform:uppercase}',
      '.ins-wb-box ul{list-style:none;margin:0;padding:0;display:grid;gap:.5rem}',
      '.ins-wb-box li{font-size:.84rem;line-height:1.45;color:#334155;padding-left:1rem;position:relative}',
      '.ins-wb-box li:before{content:"";position:absolute;left:0;top:.55em;width:5px;height:5px;border-radius:50%;background:#3b82f6}',
      '.ins-wb-row{display:flex;gap:.75rem;align-items:center;flex-wrap:wrap}',
      '.ins-wb-input,.ins-wb-select{min-height:42px;border:1.5px solid #cbd5e1;border-radius:9px;padding:.65rem .75rem;font:inherit;color:#0f172a;background:#fff;flex:1;min-width:220px}',
      '.ins-wb-btn{min-height:42px;border:0;border-radius:9px;background:#1e3a5f;color:#fff;font-weight:800;padding:.65rem .95rem;cursor:pointer}',
      '.ins-wb-btn.secondary{background:#e8f0f7;color:#1e3a5f}',
      '.ins-wb-pill{display:inline-flex;align-items:center;gap:.35rem;border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:.25rem .6rem;font-size:.76rem;font-weight:700;margin:.15rem .2rem .15rem 0}',
      '.ins-wb-links{display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.5rem}',
      '.ins-wb-links a{display:inline-flex;align-items:center;min-height:36px;border:1px solid #cbd5e1;border-radius:8px;padding:.45rem .7rem;color:#1e3a5f;background:#fff;font-size:.83rem;font-weight:700}',
      '.ins-wb-actions{display:flex;gap:.55rem;align-items:center;flex-wrap:wrap;margin-top:.85rem}',
      '.ins-wb-status{font-size:.78rem;line-height:1.45;color:#64748b;min-height:1.2em}',
      '.ins-wb-status.ok{color:#166534}.ins-wb-status.err{color:#991b1b}',
      '.ins-flow-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.65rem;margin:.8rem 0}',
      '.ins-flow-step{display:flex;gap:.6rem;align-items:flex-start;border:1px solid #dbeafe;background:#f8fbff;border-radius:10px;padding:.75rem;color:#334155;text-decoration:none}',
      '.ins-flow-step strong{display:block;color:#1e3a5f;font-size:.84rem;margin-bottom:.1rem}',
      '.ins-flow-num{display:inline-flex;align-items:center;justify-content:center;width:1.7rem;height:1.7rem;border-radius:999px;background:#1e3a5f;color:#fff;font-size:.75rem;font-weight:800;flex:0 0 auto}',
      '.ins-flow-step.current{border-color:#1e3a5f;background:#eef6ff}',
      '.ins-lead-modal{position:fixed;inset:0;background:rgba(15,23,42,.58);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem}',
      '.ins-lead-panel{background:#fff;border-radius:12px;box-shadow:0 18px 50px rgba(15,23,42,.25);width:min(460px,100%);padding:1.1rem;border:1px solid #dbe4ef}',
      '.ins-lead-panel h2{font-size:1.05rem;margin:0 0 .35rem;color:#0f172a;letter-spacing:0}',
      '.ins-lead-panel label{display:block;font-size:.76rem;font-weight:800;color:#475569;margin:.75rem 0 .25rem;text-transform:uppercase;letter-spacing:.03em}',
      '.ins-lead-panel input{width:100%;min-height:42px;border:1.5px solid #cbd5e1;border-radius:9px;padding:.65rem .75rem;font:inherit;color:#0f172a}',
      '.ins-lead-panel .ins-wb-row{margin-top:.9rem}',
      '.ins-wb-checks{display:grid;gap:.45rem}',
      '.ins-wb-check{display:flex;align-items:flex-start;gap:.55rem;font-size:.84rem;line-height:1.45;color:#334155}',
      '.ins-wb-check input{margin-top:.18rem;accent-color:#1e3a5f}',
      '.ins-wb-ready{display:inline-flex;margin-top:.65rem;border:1px solid #bbf7d0;background:#f0fdf4;color:#166534;border-radius:999px;padding:.25rem .6rem;font-size:.76rem;font-weight:800}',
      '.ins-wb-alert li:before{background:#ef4444}',
      '.ins-wb-error{display:none;margin-top:.75rem;border:1px solid #fecaca;background:#fef2f2;color:#991b1b;border-radius:9px;padding:.75rem;font-size:.85rem;line-height:1.45}',
      '.ins-wb-error.on{display:block}',
      '.ins-quote-board{background:#f8fbff;border-radius:0}',
      '.ins-qb-grid{display:grid;gap:.55rem;margin:.85rem 0}',
      '.ins-qb-row{display:grid;grid-template-columns:1.1fr .8fr .8fr 1fr 1fr;gap:.5rem;align-items:center}',
      '.ins-qb-row.head{font-size:.72rem;font-weight:800;text-transform:uppercase;color:#475569;letter-spacing:.04em}',
      '.ins-qb-row input{width:100%;min-height:38px;border:1.5px solid #cbd5e1;border-radius:8px;padding:.55rem .65rem;font:inherit;font-size:.82rem;background:#fff;color:#0f172a}',
      '.ins-qb-result{display:none;border:1px solid #bfdbfe;background:#eff6ff;color:#1e3a5f;border-radius:9px;padding:.85rem;margin-top:.75rem;font-size:.84rem;line-height:1.5}',
      '.ins-qb-result.on{display:block}',
      '.ins-result-pack{margin:1.25rem 0 2rem;padding:1rem 0;border-top:1px solid #dbe4ef;border-bottom:1px solid #dbe4ef}',
      '.ins-result-pack h2{font-size:1rem;font-weight:800;margin:0 0 .5rem;color:#0f172a;letter-spacing:0}',
      '.ins-wb-mini{font-size:.78rem;color:#64748b;line-height:1.5;margin-top:.5rem}',
      '.ins-wb-source a{color:#1d4ed8;font-weight:700}',
      '@media(max-width:780px){.ins-qb-row,.ins-qb-row.head{grid-template-columns:1fr}.ins-qb-row.head{display:none}}',
      '@media(max-width:640px){.ins-wb-grid{grid-template-columns:1fr}.ins-wb-row{align-items:stretch}.ins-wb-btn,.ins-wb-input,.ins-wb-select{width:100%;min-width:0}}'
    ].join('');
    document.head.appendChild(style);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function list(items) {
    var ul = document.createElement('ul');
    (items || []).forEach(function (item) {
      ul.appendChild(el('li', '', item));
    });
    return ul;
  }

  function box(title, items) {
    var wrap = el('div', 'ins-wb-box');
    wrap.appendChild(el('h3', '', title));
    wrap.appendChild(list(items));
    return wrap;
  }

  function buyerRulesFor(slug) {
    var base = BUYER_RULES.default;
    var specific = BUYER_RULES[slug] || {};
    return {
      checklist: specific.checklist || base.checklist,
      redFlags: specific.redFlags || base.redFlags
    };
  }

  function checklistBox(slug) {
    var rules = buyerRulesFor(slug);
    var wrap = el('div', 'ins-wb-box');
    wrap.appendChild(el('h3', '', 'Buyer readiness'));
    var checks = el('div', 'ins-wb-checks');
    var ready = el('div', 'ins-wb-ready', '0/' + rules.checklist.length + ' confirmed');

    function refresh() {
      var count = checks.querySelectorAll('input:checked').length;
      ready.textContent = count + '/' + rules.checklist.length + ' confirmed';
    }

    rules.checklist.forEach(function (item, index) {
      var label = el('label', 'ins-wb-check');
      var input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('aria-label', item);
      input.addEventListener('change', refresh);
      label.appendChild(input);
      label.appendChild(el('span', '', item));
      checks.appendChild(label);
      if (index === rules.checklist.length - 1) checks.appendChild(ready);
    });
    wrap.appendChild(checks);
    return wrap;
  }

  function compactList(items, limit) {
    if (!items || !items.length) return [];
    var sliced = items.slice(0, limit || 5);
    if (items.length > sliced.length) sliced.push('Plus ' + (items.length - sliced.length) + ' more local options.');
    return sliced;
  }

  function providerListForSlug(slug, country) {
    if (!country) return [];
    if ((slug === 'car-insurance' || slug === 'motor-third-party') && country.motor) return country.motor.providers || [];
    if ((slug === 'health-insurance-compare' || slug === 'health-contribution') && country.health) return country.health.hmos || [];
    if (slug === 'microinsurance' && country.micro) return country.micro.providers || [];
    return [];
  }

  function localContextItems(slug, country) {
    var items = [];
    if (!country) return items;
    if (country.regulator) items.push('Regulator: ' + country.regulator + '.');
    if (country.mandatory && country.mandatory.length) items.push('Mandatory checks: ' + country.mandatory.join(', ') + '.');
    var providers = compactList(providerListForSlug(slug, country), 4);
    if (providers.length) items.push('Local provider examples: ' + providers.join(', ') + '.');
    if ((slug === 'car-insurance' || slug === 'motor-third-party') && country.motor) {
      if (country.motor.verifyUrl) items.push('Certificate check: ' + country.motor.verifyUrl + '.');
      if (country.motor.verifyCode) items.push('USSD or short-code check: ' + country.motor.verifyCode + '.');
    }
    if (slug === 'microinsurance' && country.micro) {
      items.push(country.micro.mobileLinked ? 'Mobile-money fit: supported by this country data.' : 'Mobile-money fit: not confirmed in this country data.');
    }
    return items;
  }

  function createHubLessons() {
    var section = el('section', 'ins-workbench');
    section.id = 'ins-consumer-desk';
    section.appendChild(el('h2', '', 'African insurance buyer desk'));
    section.appendChild(el('p', '', 'The strongest digital insurers and marketplaces make quotes fast, claims trackable, and payment proof hard to lose. Use the same standard when judging any formal offer.'));
    var grid = el('div', 'ins-wb-grid');
    HUB_LESSONS.forEach(function (lesson) {
      grid.appendChild(box(lesson.title, lesson.items));
    });
    appendSources(grid, ['hippo', 'mtek', 'money254', 'naked', 'pineapple', 'turaco']);
    section.appendChild(grid);
    return section;
  }

  function getToolSlug() {
    var parts = location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    var idx = parts.indexOf('tools');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].replace(/\.html$/, '');
    if (parts[0] === 'insurance') return 'insurance-hub';
    return '';
  }

  function getGuide() {
    return GUIDES[getToolSlug()] || null;
  }

  function getData() {
    return window.AfroTools && window.AfroTools.insuranceData ? window.AfroTools.insuranceData : null;
  }

  function slugFromPath() {
    var parts = location.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    var last = parts[parts.length - 1] || '';
    return last.replace(/\.html$/, '');
  }

  function findCountryBySlug(slugOrCode) {
    var data = getData();
    if (!data || !data.countries) return null;
    var key = (slugOrCode || '').toUpperCase();
    if (data.countries[key]) return data.countries[key];
    var slug = (slugOrCode || '').toLowerCase();
    for (var code in data.countries) {
      if (Object.prototype.hasOwnProperty.call(data.countries, code) && data.countries[code].slug === slug) {
        return data.countries[code];
      }
    }
    return null;
  }

  function selectedCountry() {
    var select = document.getElementById('country') || document.getElementById('origin');
    if (select && select.value) return findCountryBySlug(select.value);
    return findCountryBySlug(slugFromPath());
  }

  function sourceList(keys) {
    var links = [];
    (keys || []).forEach(function (key) {
      if (SOURCE_LINKS[key]) links.push(SOURCE_LINKS[key]);
    });
    return links;
  }

  function appendSources(parent, keys) {
    var links = sourceList(keys);
    if (!links.length) return;
    var boxEl = el('div', 'ins-wb-box ins-wb-source');
    boxEl.appendChild(el('h3', '', 'Research cues'));
    links.forEach(function (item) {
      var p = document.createElement('p');
      var a = document.createElement('a');
      a.href = item.href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = item.label;
      p.appendChild(a);
      boxEl.appendChild(p);
    });
    parent.appendChild(boxEl);
  }

  function mergeSourceKeys() {
    var seen = {};
    var out = [];
    Array.prototype.forEach.call(arguments, function (items) {
      (items || []).forEach(function (key) {
        if (!key || seen[key]) return;
        seen[key] = true;
        out.push(key);
      });
    });
    return out;
  }

  function toolTitle(slug) {
    var guide = GUIDES[slug];
    if (guide) return guide.title.replace(' desk', '').replace(' pack', '').replace(' planner', '');
    if (slug === 'insurance-hub') return 'Insurance command center';
    return (slug || 'Insurance').replace(/-/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }

  function toolHref(slug) {
    return slug === 'insurance-hub' ? '/insurance/' : '/tools/' + slug + '/';
  }

  function appUpgradeFor(slug) {
    return APP_UPGRADES[slug] || null;
  }

  function workflowForSlug(slug) {
    for (var id in INSURANCE_WORKFLOWS) {
      if (Object.prototype.hasOwnProperty.call(INSURANCE_WORKFLOWS, id) && INSURANCE_WORKFLOWS[id].tools.indexOf(slug) >= 0) {
        return { id: id, data: INSURANCE_WORKFLOWS[id] };
      }
    }
    return null;
  }

  function createUpgradeBox(slug) {
    var upgrade = appUpgradeFor(slug);
    if (!upgrade) return null;
    var items = [upgrade.competitor + ': ' + upgrade.lesson].concat(upgrade.improvements || []);
    return box('Competitor check', items);
  }

  function createWorkflowSteps(slug, workflow) {
    var steps = el('div', 'ins-flow-steps');
    workflow.tools.forEach(function (tool, index) {
      var a = document.createElement('a');
      a.className = 'ins-flow-step' + (tool === slug ? ' current' : '');
      a.href = toolHref(tool);
      var num = el('span', 'ins-flow-num', String(index + 1));
      var label = el('span', '');
      label.appendChild(el('strong', '', toolTitle(tool)));
      label.appendChild(el('span', '', tool === slug ? 'Current app' : 'Open this step'));
      a.appendChild(num);
      a.appendChild(label);
      steps.appendChild(a);
    });
    return steps;
  }

  function createAppWorkflowSection(slug) {
    var flow = workflowForSlug(slug);
    if (!flow) return null;
    var section = el('section', 'ins-workbench');
    section.id = 'ins-app-workflow';
    section.appendChild(el('h2', '', flow.data.label));
    section.appendChild(el('p', '', flow.data.outcome));
    section.appendChild(createWorkflowSteps(slug, flow.data));
    appendActionButtons(section, function () {
      return {
        title: flow.data.label,
        summary: flow.data.outcome,
        toolSlug: slug,
        itemKey: 'workflow-' + flow.id,
        workflowId: flow.id,
        workflowTools: flow.data.tools.slice(),
        inputs: collectInputs(),
        country: selectedCountry() ? selectedCountry().name : ''
      };
    }, { pdfLabel: 'Unlock workflow PDF', saveLabel: 'Save workflow to dashboard' });
    return section;
  }

  function getKnownEmail() {
    try {
      var stored = localStorage.getItem('afrotools_lead_email') || localStorage.getItem('afro_insurance_email');
      if (stored && stored.indexOf('@') > 0) return stored;
      if (window.AfroAuth && window.AfroAuth.getUser) {
        var user = window.AfroAuth.getUser();
        if (user && user.email) return user.email;
      }
    } catch (e) {}
    return '';
  }

  function setKnownEmail(email) {
    try {
      localStorage.setItem('afrotools_lead_email', email);
      localStorage.setItem('afro_insurance_email', email);
    } catch (e) {}
  }

  function payloadTitle(payload) {
    return payload && payload.title ? payload.title : toolTitle(payload && payload.toolSlug ? payload.toolSlug : getToolSlug());
  }

  function payloadSummary(payload) {
    if (payload && payload.summary) return payload.summary;
    return 'Insurance buyer pack created on AfroTools.';
  }

  function insuranceWorkspaceStore() {
    try {
      return JSON.parse(localStorage.getItem('afro_insurance_workspace') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveInsuranceWorkspace(payload) {
    payload = payload || {};
    var slug = payload.toolSlug || getToolSlug() || 'insurance-hub';
    var record = Object.assign({}, payload, {
      category: 'insurance',
      toolSlug: slug,
      title: payloadTitle(payload),
      summary: payloadSummary(payload),
      href: payload.href || location.pathname,
      savedAt: new Date().toISOString()
    });
    try {
      var items = insuranceWorkspaceStore();
      items.unshift(record);
      localStorage.setItem('afro_insurance_workspace', JSON.stringify(items.slice(0, 30)));
    } catch (e) {}
    return loadAfroData().then(function () {
      try {
        if (window.AfroData && window.AfroData.save) window.AfroData.save(slug === 'insurance-hub' ? 'car-insurance' : slug, record);
        if (window.AfroData && window.AfroData.logToolUse) window.AfroData.logToolUse(slug === 'insurance-hub' ? 'car-insurance' : slug, record.title);
      } catch (e) {}
      return saveToCloudWorkspace(record);
    }).then(function (cloud) {
      return { local: true, cloud: !!cloud };
    });
  }

  function loadAfroData() {
    if (window.AfroData) return Promise.resolve(window.AfroData);
    return new Promise(function (resolve) {
      var existing = document.querySelector('script[data-ins-afro-auth]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.AfroData || null); }, { once: true });
        existing.addEventListener('error', function () { resolve(null); }, { once: true });
        return;
      }
      var script = document.createElement('script');
      script.src = '/assets/js/afro-auth.js';
      script.async = true;
      script.setAttribute('data-ins-afro-auth', 'true');
      script.onload = function () { resolve(window.AfroData || null); };
      script.onerror = function () { resolve(null); };
      document.head.appendChild(script);
    });
  }

  function loadWorkspaceSync() {
    if (window.AfroWorkspace) return Promise.resolve(window.AfroWorkspace);
    return new Promise(function (resolve) {
      var existing = document.querySelector('script[data-ins-workspace-sync]');
      if (existing) {
        existing.addEventListener('load', function () { resolve(window.AfroWorkspace || null); }, { once: true });
        existing.addEventListener('error', function () { resolve(null); }, { once: true });
        return;
      }
      var script = document.createElement('script');
      script.src = '/assets/js/lib/workspace-sync.js';
      script.async = true;
      script.setAttribute('data-ins-workspace-sync', 'true');
      script.onload = function () { resolve(window.AfroWorkspace || null); };
      script.onerror = function () { resolve(null); };
      document.head.appendChild(script);
    });
  }

  function saveToCloudWorkspace(record) {
    if (!(window.AfroAuth && window.AfroAuth.isLoggedIn && window.AfroAuth.isLoggedIn())) return Promise.resolve(false);
    return loadWorkspaceSync().then(function (workspace) {
      if (!workspace || !workspace.upsert) return false;
      return workspace.upsert({
        itemType: 'insurance-plan',
        itemKey: record.itemKey || (record.toolSlug + '-' + Date.now()),
        toolSlug: record.toolSlug,
        title: record.title,
        summary: record.summary,
        href: record.href,
        payload: record,
        meta: { category: 'insurance', workflowId: record.workflowId || '' }
      }).then(function (result) {
        return !!(result && result.ok);
      }).catch(function () {
        return false;
      });
    });
  }

  function captureInsuranceLead(email, payload) {
    payload = payload || {};
    setKnownEmail(email);
    if (!window.fetch) return Promise.resolve(false);
    return fetch('/api/capture-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        source: 'insurance-pdf-gate',
        toolSlug: payload.toolSlug || getToolSlug() || 'insurance-hub',
        countryCode: payload.countryCode || '',
        referrer: document.referrer || '',
        optInDigest: false,
        page: location.pathname,
        name: payload.name || '',
        company: payload.company || '',
        role: payload.workflowId || '',
        industry: 'insurance',
        conversionValue: payload.conversionValue || null
      })
    }).then(function (res) {
      return res.ok;
    }).catch(function () {
      return false;
    });
  }

  function requestLeadEmail(payload, callback) {
    var known = getKnownEmail();
    if (known) {
      captureInsuranceLead(known, payload).then(function () { callback(known); });
      return;
    }
    var modal = el('div', 'ins-lead-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    var panel = el('form', 'ins-lead-panel');
    panel.noValidate = true;
    panel.appendChild(el('h2', '', 'Unlock the PDF-ready insurance pack'));
    panel.appendChild(el('p', '', 'Enter an email to unlock the printable checklist and save this insurance pack for follow-up. No newsletter opt-in is added from this form.'));
    var emailLabel = el('label', '', 'Email');
    var email = document.createElement('input');
    email.type = 'email';
    email.required = true;
    email.placeholder = 'you@example.com';
    var nameLabel = el('label', '', 'Name or company');
    var name = document.createElement('input');
    name.type = 'text';
    name.placeholder = 'Optional';
    var error = el('div', 'ins-wb-status err');
    var row = el('div', 'ins-wb-row');
    var submit = el('button', 'ins-wb-btn', 'Generate PDF pack');
    submit.type = 'submit';
    var close = el('button', 'ins-wb-btn secondary', 'Cancel');
    close.type = 'button';
    close.addEventListener('click', function () { modal.remove(); });
    row.appendChild(submit);
    row.appendChild(close);
    panel.appendChild(emailLabel);
    panel.appendChild(email);
    panel.appendChild(nameLabel);
    panel.appendChild(name);
    panel.appendChild(error);
    panel.appendChild(row);
    panel.addEventListener('submit', function (event) {
      event.preventDefault();
      var value = email.value.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        error.textContent = 'Enter a valid email address.';
        return;
      }
      submit.disabled = true;
      submit.textContent = 'Preparing...';
      var enriched = Object.assign({}, payload, { name: name.value.trim() });
      captureInsuranceLead(value, enriched).then(function () {
        modal.remove();
        callback(value);
      });
    });
    modal.appendChild(panel);
    document.body.appendChild(modal);
    window.setTimeout(function () { email.focus(); }, 40);
  }

  function reportLines(payload, email) {
    payload = payload || {};
    var lines = [];
    lines.push(payloadTitle(payload));
    lines.push(payloadSummary(payload));
    lines.push('Email: ' + email);
    lines.push('Saved: ' + new Date().toLocaleString());
    if (payload.country) lines.push('Country: ' + payload.country);
    if (payload.workflowId) lines.push('Workflow: ' + payload.workflowId);
    if (payload.inputs && payload.inputs.length) {
      lines.push('');
      lines.push('Inputs');
      payload.inputs.forEach(function (item) { lines.push('- ' + item); });
    }
    if (payload.workflowTools && payload.workflowTools.length) {
      lines.push('');
      lines.push('Workflow apps');
      payload.workflowTools.forEach(function (tool, index) { lines.push((index + 1) + '. ' + toolTitle(tool)); });
    }
    if (payload.notes && payload.notes.length) {
      lines.push('');
      lines.push('Notes');
      payload.notes.forEach(function (item) { lines.push('- ' + item); });
    }
    lines.push('');
    lines.push('Policy wording from the licensed insurer controls the final policy. Use this pack as a buyer checklist.');
    return lines;
  }

  function openPdfWindow(payload, email) {
    var lines = reportLines(payload, email);
    var win = window.open('', '_blank');
    if (!win) {
      copyFallback(lines.join('\n'));
      return false;
    }
    var escaped = lines.map(function (line) {
      return line.replace(/[&<>]/g, function (char) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char];
      });
    });
    win.document.write('<!doctype html><html><head><title>' + escaped[0] + '</title><style>body{font-family:Arial,sans-serif;color:#111827;margin:32px;line-height:1.5}h1{font-size:24px;margin:0 0 12px}pre{white-space:pre-wrap;font:inherit;border-top:1px solid #d1d5db;padding-top:16px}.small{color:#6b7280;font-size:12px}@media print{button{display:none}}</style></head><body><button onclick="window.print()">Save as PDF</button><h1>' + escaped[0] + '</h1><pre>' + escaped.slice(1).join('\n') + '</pre><p class="small">Generated by AfroTools insurance workbench.</p></body></html>');
    win.document.close();
    window.setTimeout(function () {
      try { win.focus(); win.print(); } catch (e) {}
    }, 300);
    return true;
  }

  function appendActionButtons(parent, getPayload, options) {
    options = options || {};
    var row = el('div', 'ins-wb-actions');
    var save = el('button', 'ins-wb-btn secondary', options.saveLabel || 'Save to dashboard');
    var pdf = el('button', 'ins-wb-btn', options.pdfLabel || 'Unlock PDF pack');
    var status = el('span', 'ins-wb-status');
    save.type = 'button';
    pdf.type = 'button';
    save.addEventListener('click', function () {
      var payload = getPayload ? getPayload() : {};
      status.className = 'ins-wb-status';
      status.textContent = 'Saving...';
      saveInsuranceWorkspace(payload).then(function (result) {
        status.className = 'ins-wb-status ok';
        status.textContent = result.cloud ? 'Saved locally and to your account workspace.' : 'Saved locally for the dashboard. Sign in to sync across devices.';
      }).catch(function () {
        status.className = 'ins-wb-status err';
        status.textContent = 'Saved locally, but account sync was not available.';
      });
    });
    pdf.addEventListener('click', function () {
      var payload = getPayload ? getPayload() : {};
      requestLeadEmail(payload, function (email) {
        saveInsuranceWorkspace(payload).then(function () {
          var opened = openPdfWindow(payload, email);
          status.className = opened ? 'ins-wb-status ok' : 'ins-wb-status err';
          status.textContent = opened ? 'PDF-ready pack opened. Use Save as PDF in the print dialog.' : 'Popup blocked. The pack was copied instead.';
        });
      });
    });
    row.appendChild(save);
    row.appendChild(pdf);
    row.appendChild(status);
    parent.appendChild(row);
  }

  function createGuideSection(slug, guide) {
    var section = el('section', 'ins-workbench');
    section.appendChild(el('h2', '', guide.title));
    section.appendChild(el('p', '', 'Use this as a practical quote and decision pack. It turns the estimate into the questions, documents and next steps you need before paying or filing a claim.'));
    var grid = el('div', 'ins-wb-grid');
    grid.appendChild(box('What this checks', guide.checks));
    var context = localContextItems(slug, selectedCountry());
    if (context.length) grid.appendChild(box('Local context', context));
    var upgrade = createUpgradeBox(slug);
    if (upgrade) grid.appendChild(upgrade);
    grid.appendChild(checklistBox(slug));
    grid.appendChild(box('Ask before paying', guide.questions));
    grid.appendChild(box('Red flags', buyerRulesFor(slug).redFlags));
    grid.appendChild(box('Documents to keep', guide.docs));
    appendSources(grid, mergeSourceKeys(guide.sourceLinks, appUpgradeFor(slug) ? appUpgradeFor(slug).sourceLinks : []));
    section.appendChild(grid);
    appendActionButtons(section, function () {
      var country = selectedCountry();
      var flow = workflowForSlug(slug);
      return {
        title: guide.title,
        summary: 'Buyer checklist, documents, red flags and competitor-informed questions for ' + toolTitle(slug) + '.',
        toolSlug: slug,
        country: country ? country.name : '',
        countryCode: country && country.code ? country.code : '',
        workflowId: flow ? flow.id : '',
        workflowTools: flow ? flow.data.tools.slice() : [slug],
        inputs: collectInputs(),
        notes: guide.questions.concat(guide.docs).slice(0, 10)
      };
    }, { pdfLabel: 'Unlock buyer PDF', saveLabel: 'Save buyer pack' });
    return section;
  }

  function numberFromField(field) {
    var raw = (field && field.value ? field.value : '').replace(/,/g, '').replace(/[^\d.]/g, '');
    var value = parseFloat(raw);
    return isNaN(value) ? 0 : value;
  }

  function money(value, country) {
    var prefix = country && country.symbol ? country.symbol + ' ' : '';
    return prefix + Math.round(value).toLocaleString();
  }

  function quoteInput(name, placeholder, row) {
    var input = document.createElement('input');
    input.type = name === 'premium' || name === 'excess' ? 'number' : 'text';
    input.placeholder = placeholder;
    input.setAttribute('data-qb', name);
    input.setAttribute('data-row', row);
    return input;
  }

  function createQuoteBoard(slug, guide) {
    var section = el('section', 'ins-workbench ins-quote-board');
    section.id = 'ins-quote-board';
    section.appendChild(el('h2', '', 'Compare real quotes'));
    section.appendChild(el('p', '', 'Shortlist offers by the cash you may pay, the claim path, and the exclusions, not by premium alone.'));

    var grid = el('div', 'ins-qb-grid');
    var head = el('div', 'ins-qb-row head');
    ['Provider', 'Annual premium', 'Excess or co-pay', 'Claim channel', 'Key exclusion'].forEach(function (label) {
      head.appendChild(el('div', '', label));
    });
    grid.appendChild(head);

    for (var i = 0; i < 3; i += 1) {
      var row = el('div', 'ins-qb-row');
      row.appendChild(quoteInput('provider', 'Provider ' + (i + 1), i));
      row.appendChild(quoteInput('premium', 'Premium', i));
      row.appendChild(quoteInput('excess', 'Excess', i));
      row.appendChild(quoteInput('claim', 'App, branch, agent, hotline', i));
      row.appendChild(quoteInput('exclusion', 'Flood, waiting period, limit', i));
      grid.appendChild(row);
    }
    section.appendChild(grid);

    var rowWrap = el('div', 'ins-wb-row');
    var button = el('button', 'ins-wb-btn secondary', 'Compare quote details');
    button.type = 'button';
    var result = el('div', 'ins-qb-result');
    result.id = 'ins-qb-result';
    button.addEventListener('click', function () {
      renderQuoteComparison(section, result, selectedCountry(), guide);
    });
    rowWrap.appendChild(button);
    section.appendChild(rowWrap);
    section.appendChild(result);
    appendActionButtons(section, function () {
      var country = selectedCountry();
      var rows = collectQuoteEntries(section);
      return {
        title: guide.title + ' quote comparison',
        summary: 'Shortlisted offers compared by premium, excess, claim channel and exclusions.',
        toolSlug: slug,
        country: country ? country.name : '',
        countryCode: country && country.code ? country.code : '',
        workflowId: workflowForSlug(slug) ? workflowForSlug(slug).id : '',
        workflowTools: workflowForSlug(slug) ? workflowForSlug(slug).data.tools.slice() : [slug],
        inputs: collectInputs(),
        notes: rows.map(function (entry) {
          return entry.provider + ': premium ' + entry.annual + ', excess ' + entry.excess + ', claim channel ' + (entry.claim || 'not captured') + ', exclusion ' + (entry.exclusion || 'not captured');
        })
      };
    }, { pdfLabel: 'Unlock quote PDF', saveLabel: 'Save quote board' });
    return section;
  }

  function collectQuoteEntries(section) {
    var entries = [];
    for (var i = 0; i < 3; i += 1) {
      var provider = section.querySelector('[data-qb="provider"][data-row="' + i + '"]');
      var premium = section.querySelector('[data-qb="premium"][data-row="' + i + '"]');
      var excess = section.querySelector('[data-qb="excess"][data-row="' + i + '"]');
      var claim = section.querySelector('[data-qb="claim"][data-row="' + i + '"]');
      var exclusion = section.querySelector('[data-qb="exclusion"][data-row="' + i + '"]');
      var name = provider && provider.value ? provider.value.trim() : '';
      var annual = numberFromField(premium);
      var outOfPocket = numberFromField(excess);
      if (!name && !annual && !outOfPocket && !(claim && claim.value) && !(exclusion && exclusion.value)) continue;
      entries.push({
        provider: name || 'Quote ' + (i + 1),
        hasProvider: !!name,
        annual: annual,
        excess: outOfPocket,
        cashNeed: annual + outOfPocket,
        claim: claim && claim.value ? claim.value.trim() : '',
        exclusion: exclusion && exclusion.value ? exclusion.value.trim() : ''
      });
    }
    return entries;
  }

  function renderQuoteComparison(section, result, country) {
    var entries = collectQuoteEntries(section);
    result.innerHTML = '';
    result.classList.add('on');
    if (!entries.length) {
      result.textContent = 'Add at least one provider and annual premium to compare offers.';
      return;
    }
    var incomplete = entries.filter(function (entry) { return !entry.hasProvider || !entry.annual; });
    if (incomplete.length) {
      result.textContent = 'Each quote row needs at least a provider and annual premium before it can be ranked.';
      return;
    }
    entries.sort(function (a, b) { return a.cashNeed - b.cashNeed; });
    var lines = entries.map(function (entry, index) {
      var missing = [];
      if (!entry.claim) missing.push('claim channel');
      if (!entry.exclusion) missing.push('exclusions');
      if (!entry.excess) missing.push('excess');
      var verdict = missing.length ? 'Needs: ' + missing.join(', ') : 'Strong shortlist candidate';
      return (index + 1) + '. ' + entry.provider + ': first-year cash need about ' + money(entry.cashNeed, country) + ' (' + money(entry.annual, country) + ' premium + ' + money(entry.excess, country) + ' excess). ' + verdict + '.';
    });
    result.appendChild(list(lines));
  }

  function claimInput(name, placeholder, row) {
    var input = document.createElement('input');
    input.type = name === 'date' || name === 'next' ? 'date' : 'text';
    input.placeholder = placeholder;
    input.setAttribute('data-claim', name);
    input.setAttribute('data-row', row);
    return input;
  }

  function createClaimBoard() {
    var section = el('section', 'ins-workbench ins-quote-board');
    section.id = 'ins-claim-board';
    section.appendChild(el('h2', '', 'Claim follow-up board'));
    section.appendChild(el('p', '', 'A claim usually improves when the next missing document and follow-up date are visible.'));
    var grid = el('div', 'ins-qb-grid');
    var head = el('div', 'ins-qb-row head');
    ['Insurer or handler', 'Reference', 'Last update', 'Missing item', 'Next follow-up'].forEach(function (label) {
      head.appendChild(el('div', '', label));
    });
    grid.appendChild(head);
    for (var i = 0; i < 3; i += 1) {
      var row = el('div', 'ins-qb-row');
      row.appendChild(claimInput('handler', 'Handler or branch', i));
      row.appendChild(claimInput('ref', 'Reference', i));
      row.appendChild(claimInput('date', '', i));
      row.appendChild(claimInput('missing', 'Document or decision needed', i));
      row.appendChild(claimInput('next', '', i));
      grid.appendChild(row);
    }
    section.appendChild(grid);
    var button = el('button', 'ins-wb-btn secondary', 'Build follow-up list');
    button.type = 'button';
    var result = el('div', 'ins-qb-result');
    result.id = 'ins-claim-board-result';
    button.addEventListener('click', function () {
      renderClaimFollowUps(section, result);
    });
    section.appendChild(button);
    section.appendChild(result);
    appendActionButtons(section, function () {
      var slug = getToolSlug();
      return {
        title: 'Claim follow-up pack',
        summary: 'Claim handler, reference, missing document and next follow-up date saved for dashboard review.',
        toolSlug: slug,
        workflowId: workflowForSlug(slug) ? workflowForSlug(slug).id : 'claims',
        workflowTools: workflowForSlug(slug) ? workflowForSlug(slug).data.tools.slice() : ['claim-tracker', 'insurance-fraud-checker'],
        inputs: collectInputs(),
        notes: collectClaimEntries(section)
      };
    }, { pdfLabel: 'Unlock claim PDF', saveLabel: 'Save claim board' });
    return section;
  }

  function collectClaimEntries(section) {
    var lines = [];
    for (var i = 0; i < 3; i += 1) {
      var handler = section.querySelector('[data-claim="handler"][data-row="' + i + '"]');
      var ref = section.querySelector('[data-claim="ref"][data-row="' + i + '"]');
      var missing = section.querySelector('[data-claim="missing"][data-row="' + i + '"]');
      var next = section.querySelector('[data-claim="next"][data-row="' + i + '"]');
      if (!handler.value && !ref.value && !missing.value) continue;
      lines.push((handler.value || 'Insurer') + (ref.value ? ' ref ' + ref.value : '') + ': ask for ' + (missing.value || 'written claim status') + (next.value ? ' by ' + next.value : '') + '.');
    }
    return lines;
  }

  function renderClaimFollowUps(section, result) {
    var lines = collectClaimEntries(section);
    result.innerHTML = '';
    result.classList.add('on');
    result.appendChild(list(lines.length ? lines : ['Add one claim row to build a follow-up list.']));
  }

  function createDecisionBoard(slug, guide) {
    if (slug === 'claim-tracker' || slug === 'insurance-fraud-checker') return createClaimBoard();
    return createQuoteBoard(slug, guide);
  }

  function enhanceCalculatorPage() {
    var slug = getToolSlug();
    var guide = getGuide();
    if (!guide) return;
    var main = document.querySelector('.ins-main') || document.querySelector('.en-tool-layout') || document.querySelector('main');
    if (!main || document.getElementById('ins-tool-guide')) return;

    var guideSection = createGuideSection(slug, guide);
    guideSection.id = 'ins-tool-guide';
    var firstCard = main.querySelector('.ins-card, .en-card');
    if (firstCard) main.insertBefore(guideSection, firstCard);
    else main.insertBefore(guideSection, main.firstChild);

    if (!document.getElementById('ins-app-workflow')) {
      var workflowSection = createAppWorkflowSection(slug);
      if (workflowSection) guideSection.insertAdjacentElement('afterend', workflowSection);
    }

    if (firstCard && firstCard.parentNode && !document.getElementById('ins-quote-board') && !document.getElementById('ins-claim-board')) {
      firstCard.insertAdjacentElement('afterend', createDecisionBoard(slug, guide));
    }

    var btn = document.getElementById('calcBtn') || document.querySelector('button[onclick="calculate()"], .en-btn');
    if (btn) {
      btn.addEventListener('click', function (event) {
        var problem = validateRequiredFields(guide);
        if (problem) {
          event.preventDefault();
          event.stopImmediatePropagation();
          showValidationError(btn, problem);
          return false;
        }
        var existing = document.getElementById('ins-wb-error');
        if (existing) existing.classList.remove('on');
      }, true);
      btn.addEventListener('click', function () {
        window.setTimeout(function () {
          renderResultPack(guide);
        }, 80);
      });
    }
  }

  function validateRequiredFields(guide) {
    var required = guide.requiredIds || [];
    for (var i = 0; i < required.length; i += 1) {
      var input = document.getElementById(required[i]);
      if (!input) continue;
      var value = parseFloat(input.value);
      if (!input.value || isNaN(value) || value <= 0) {
        var label = document.querySelector('label[for="' + required[i] + '"]');
        return 'Enter a valid ' + (label ? label.textContent.toLowerCase() : required[i]) + ' before calculating.';
      }
    }
    return '';
  }

  function showValidationError(button, message) {
    var existing = document.getElementById('ins-wb-error');
    if (!existing) {
      existing = el('div', 'ins-wb-error');
      existing.id = 'ins-wb-error';
      button.insertAdjacentElement('afterend', existing);
    }
    existing.textContent = message;
    existing.classList.add('on');
  }

  function collectInputs() {
    var pairs = [];
    var fields = document.querySelectorAll('.ins-field, .en-field');
    fields.forEach(function (field) {
      var label = field.querySelector('label');
      var control = field.querySelector('input,select,textarea');
      if (!label || !control) return;
      var value = control.tagName === 'SELECT' && control.selectedOptions[0] ? control.selectedOptions[0].textContent : control.value;
      if (value) pairs.push(label.textContent.trim() + ': ' + value);
    });
    return pairs;
  }

  function renderResultPack(guide) {
    var slug = getToolSlug();
    var target = document.getElementById('results') || document.querySelector('.en-results') || document.querySelector('.ins-results');
    var main = document.querySelector('.ins-main') || document.querySelector('.en-tool-layout') || document.querySelector('main');
    if (!main) return;
    var pack = document.getElementById('ins-result-pack');
    if (!pack) {
      pack = el('section', 'ins-result-pack');
      pack.id = 'ins-result-pack';
      if (target && target.parentNode) target.insertAdjacentElement('afterend', pack);
      else main.appendChild(pack);
    }
    pack.innerHTML = '';
    pack.appendChild(el('h2', '', 'Next-step pack'));
    var country = selectedCountry();
    var grid = el('div', 'ins-wb-grid');
    var actions = guide.actions ? guide.actions.slice() : [];
    if (country && country.regulator) actions.unshift('Local regulator: ' + country.regulator + '.');
    if (country && country.mandatory && country.mandatory.length) actions.push('Mandatory checks in ' + country.name + ': ' + country.mandatory.join(', ') + '.');
    grid.appendChild(box('Do next', actions));
    var context = localContextItems(slug, country);
    if (context.length) grid.appendChild(box('Local context', context));
    grid.appendChild(box('Questions for insurer', guide.questions));
    grid.appendChild(box('Red flags', buyerRulesFor(slug).redFlags));
    var inputPairs = collectInputs();
    grid.appendChild(box('Your quote inputs', inputPairs.length ? inputPairs : ['No inputs captured yet. Run the calculator to create a quote pack.']));
    appendSources(grid, mergeSourceKeys(guide.sourceLinks, appUpgradeFor(slug) ? appUpgradeFor(slug).sourceLinks : []));
    pack.appendChild(grid);

    var flow = workflowForSlug(slug);
    if (flow) {
      pack.appendChild(el('h2', '', 'Continue the workflow'));
      pack.appendChild(createWorkflowSteps(slug, flow.data));
    }

    var row = el('div', 'ins-wb-row');
    var copy = el('button', 'ins-wb-btn secondary', 'Copy quote pack');
    copy.type = 'button';
    copy.addEventListener('click', function () {
      var text = buildCopyText(guide, country, inputPairs);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          copy.textContent = 'Copied';
          window.setTimeout(function () { copy.textContent = 'Copy quote pack'; }, 1500);
        }).catch(function () {
          copyFallback(text);
        });
      } else {
        copyFallback(text);
      }
    });
    row.appendChild(copy);
    var note = el('div', 'ins-wb-mini', 'Use this summary when comparing quotes. Formal terms from a licensed insurer still control the final policy.');
    row.appendChild(note);
    pack.appendChild(row);
    appendActionButtons(pack, function () {
      return {
        title: guide.title + ' next-step pack',
        summary: 'Calculator inputs, questions, red flags and next workflow steps saved after the estimate.',
        toolSlug: slug,
        country: country ? country.name : '',
        countryCode: country && country.code ? country.code : '',
        workflowId: flow ? flow.id : '',
        workflowTools: flow ? flow.data.tools.slice() : [slug],
        inputs: inputPairs,
        notes: actions.concat(guide.questions).slice(0, 12)
      };
    }, { pdfLabel: 'Unlock result PDF', saveLabel: 'Save result pack' });
  }

  function buildCopyText(guide, country, inputPairs) {
    var lines = [];
    lines.push(guide.title);
    if (country) lines.push('Country: ' + country.name + (country.regulator ? ' | Regulator: ' + country.regulator : ''));
    if (inputPairs && inputPairs.length) {
      lines.push('');
      lines.push('Inputs');
      inputPairs.forEach(function (item) { lines.push('- ' + item); });
    }
    lines.push('');
    lines.push('Questions to ask');
    guide.questions.forEach(function (item) { lines.push('- ' + item); });
    lines.push('');
    lines.push('Documents to keep');
    guide.docs.forEach(function (item) { lines.push('- ' + item); });
    return lines.join('\n');
  }

  function copyFallback(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(area);
  }

  function enhanceCountryGridPage() {
    var cards = Array.prototype.slice.call(document.querySelectorAll('.ins-country-card'));
    if (!cards.length || document.getElementById('ins-country-finder')) return;
    var firstRegion = document.querySelector('.ins-region');
    if (!firstRegion || !firstRegion.parentNode) return;

    var section = el('section', 'ins-workbench');
    section.id = 'ins-country-finder';
    section.appendChild(el('h2', '', 'Find your country faster'));
    section.appendChild(el('p', '', 'Start from the right country calculator, then use the quote pack to ask the same questions across insurers.'));

    var row = el('div', 'ins-wb-row');
    var input = el('input', 'ins-wb-input');
    input.type = 'search';
    input.placeholder = 'Search country, for example Nigeria, Kenya or Morocco';
    var count = el('span', 'ins-wb-pill', cards.length + ' country pages');
    row.appendChild(input);
    row.appendChild(count);
    section.appendChild(row);

    var links = el('div', 'ins-wb-links');
    ['Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Egypt', 'Morocco'].forEach(function (name) {
      var match = cards.find(function (card) { return card.textContent.toLowerCase().indexOf(name.toLowerCase()) >= 0; });
      if (!match) return;
      var a = document.createElement('a');
      a.href = match.getAttribute('href');
      a.textContent = name;
      links.appendChild(a);
    });
    if (links.children.length) section.appendChild(links);

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      var visible = 0;
      cards.forEach(function (card) {
        var ok = !q || card.textContent.toLowerCase().indexOf(q) >= 0;
        card.style.display = ok ? '' : 'none';
        if (ok) visible += 1;
      });
      count.textContent = visible + ' matching country pages';
    });

    firstRegion.parentNode.insertBefore(section, firstRegion);
  }

  function createHubWorkflowPlanner() {
    var section = el('section', 'ins-workbench');
    section.id = 'ins-workflow-planner';
    section.appendChild(el('h2', '', 'Build an insurance workflow'));
    section.appendChild(el('p', '', 'Choose the real-life job first, then move through the apps in the order that protects the buyer best.'));

    var controls = el('div', 'ins-wb-row');
    var select = el('select', 'ins-wb-select');
    Object.keys(INSURANCE_WORKFLOWS).forEach(function (id) {
      var option = document.createElement('option');
      option.value = id;
      option.textContent = INSURANCE_WORKFLOWS[id].label;
      select.appendChild(option);
    });
    var country = el('input', 'ins-wb-input');
    country.type = 'text';
    country.placeholder = 'Country or market, optional';
    controls.appendChild(select);
    controls.appendChild(country);
    section.appendChild(controls);

    var detail = el('div', '');
    section.appendChild(detail);

    function render() {
      var workflow = INSURANCE_WORKFLOWS[select.value] || INSURANCE_WORKFLOWS.driver;
      detail.innerHTML = '';
      detail.appendChild(el('p', '', workflow.outcome));
      detail.appendChild(createWorkflowSteps('', workflow));
    }

    select.addEventListener('change', render);
    render();

    appendActionButtons(section, function () {
      var workflow = INSURANCE_WORKFLOWS[select.value] || INSURANCE_WORKFLOWS.driver;
      return {
        title: workflow.label,
        summary: workflow.outcome,
        toolSlug: 'insurance-hub',
        itemKey: 'hub-workflow-' + select.value,
        workflowId: select.value,
        workflowTools: workflow.tools.slice(),
        country: country.value.trim(),
        inputs: country.value.trim() ? ['Country or market: ' + country.value.trim()] : [],
        notes: workflow.tools.map(function (tool, index) { return (index + 1) + '. ' + toolTitle(tool); })
      };
    }, { pdfLabel: 'Unlock workflow PDF', saveLabel: 'Save workflow to dashboard' });

    return section;
  }

  function enhanceInsuranceHub() {
    if (location.pathname.replace(/\/+$/, '') !== '/insurance' || document.getElementById('ins-cover-finder')) return;
    var tools = document.querySelector('.ins-tools');
    if (!tools || !tools.parentNode) return;
    var section = el('section', 'ins-workbench');
    section.id = 'ins-cover-finder';
    section.appendChild(el('h2', '', 'Choose the right insurance tool'));
    section.appendChild(el('p', '', 'Pick your situation and AfroTools will show the calculators and checklists that usually belong together.'));

    var row = el('div', 'ins-wb-row');
    var select = el('select', 'ins-wb-select');
    PROFILE_TOOLS.forEach(function (profile) {
      var option = document.createElement('option');
      option.value = profile.id;
      option.textContent = profile.label;
      select.appendChild(option);
    });
    var result = el('div', 'ins-wb-links');
    row.appendChild(select);
    section.appendChild(row);
    section.appendChild(result);

    function renderProfile() {
      var profile = PROFILE_TOOLS.find(function (item) { return item.id === select.value; }) || PROFILE_TOOLS[0];
      result.innerHTML = '';
      profile.tools.forEach(function (id) {
        var guide = GUIDES[id];
        if (!guide) return;
        var a = document.createElement('a');
        a.href = '/tools/' + id + '/';
        a.textContent = guide.title.replace(' desk', '').replace(' pack', '');
        result.appendChild(a);
      });
    }
    select.addEventListener('change', renderProfile);
    renderProfile();
    tools.parentNode.insertBefore(section, tools);
    if (!document.getElementById('ins-workflow-planner')) section.insertAdjacentElement('afterend', createHubWorkflowPlanner());
    var planner = document.getElementById('ins-workflow-planner') || section;
    if (!document.getElementById('ins-consumer-desk')) planner.insertAdjacentElement('afterend', createHubLessons());
  }

  ready(function () {
    addStyle();
    enhanceInsuranceHub();
    enhanceCountryGridPage();
    enhanceCalculatorPage();
  });
})();
