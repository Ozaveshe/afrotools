(function () {
  'use strict';

  var STORAGE_DRAFT = 'afrotools-business-plan-current-v2';
  var saveState = window.SaveState ? new window.SaveState('business-plan', { maxFree: 30 }) : null;
  var currentSection = 0;
  var currentSavedId = null;
  var saveTimer = null;
  var state;

  var CURRENCY_SYMBOLS = {
    NGN: '\u20a6',
    KES: 'KSh',
    GHS: 'GH\u20b5',
    ZAR: 'R',
    TZS: 'TSh',
    UGX: 'USh',
    RWF: 'FRw',
    ETB: 'Br',
    EGP: 'E\u00a3',
    MAD: 'MAD',
    XOF: 'CFA',
    XAF: 'FCFA',
    USD: '$'
  };

  var COUNTRY_CURRENCY = {
    Nigeria: 'NGN',
    Kenya: 'KES',
    Ghana: 'GHS',
    'South Africa': 'ZAR',
    Tanzania: 'TZS',
    Uganda: 'UGX',
    Rwanda: 'RWF',
    Ethiopia: 'ETB',
    Egypt: 'EGP',
    Morocco: 'MAD',
    Senegal: 'XOF',
    Cameroon: 'XAF',
    'Pan-African': 'USD'
  };

  var TEMPLATES = {
    blank: {
      label: 'Blank',
      sector: '',
      data: {}
    },
    restaurant: {
      label: 'Restaurant',
      sector: 'Food and hospitality',
      data: {
        meta: { industry: 'Restaurant', format: 'lender' },
        sections: {
          company: { name: 'New Restaurant Venture', concept: 'A neighborhood restaurant serving high-quality local meals with reliable takeaway and catering options.' },
          market: { targetCustomers: 'Office workers, families, students, event hosts, and nearby residents who want dependable meals at accessible prices.', competitors: 'Quick-service restaurants, informal food vendors, hotel restaurants, and delivery-only kitchens.', advantage: 'Consistent quality, clean service, delivery partnerships, menu discipline, and strong local sourcing.' },
          products: { offer: 'Dine-in meals, takeaway packs, catering trays, drinks, and weekend specials.', pricing: 'Mid-market pricing with bundle meals, event packages, and controlled food-cost margins.' },
          operations: { suppliers: 'Local farms, meat and poultry suppliers, beverage distributors, packaging suppliers, and delivery partners.', staffing: 'Chef, kitchen assistants, cashier, service attendants, cleaner, and part-time event support.' }
        },
        financials: { revenue: [48000000, 72000000, 98000000], cogs: [19200000, 27360000, 37240000], opex: [12000000, 15600000, 19800000], salaries: [9600000, 12600000, 16200000], marketing: [2400000, 3600000, 4900000] }
      }
    },
    tech: {
      label: 'Tech startup',
      sector: 'Technology',
      data: {
        meta: { industry: 'Technology startup', format: 'investor' },
        sections: {
          company: { name: 'New Technology Startup', concept: 'A software platform that helps African SMEs digitize operations, payments, and customer workflows.' },
          market: { targetCustomers: 'Small businesses, service providers, and growing teams that need affordable business software built around local payment and compliance realities.', competitors: 'Global SaaS tools, spreadsheets, WhatsApp-based operations, and local point solutions.', advantage: 'Africa-first workflows, mobile-first onboarding, local payment support, and lower total cost.' },
          products: { offer: 'Subscription software, setup support, integrations, analytics, and premium advisory services.', pricing: 'Monthly subscription tiers with setup fees for larger clients and optional managed support.' },
          marketing: { channels: 'Founder-led sales, partner accountants, LinkedIn, SME associations, webinars, SEO, referrals, and pilot programs.' }
        },
        financials: { revenue: [36000000, 108000000, 240000000], cogs: [5400000, 16200000, 36000000], opex: [18000000, 42000000, 84000000], salaries: [24000000, 54000000, 108000000], marketing: [6000000, 18000000, 36000000] }
      }
    },
    retail: {
      label: 'Retail',
      sector: 'Retail and commerce',
      data: {
        meta: { industry: 'Retail and e-commerce', format: 'lender' },
        sections: {
          company: { name: 'New Retail Business', concept: 'A retail business combining a physical outlet, social commerce, and reliable delivery for fast-moving consumer products.' },
          market: { targetCustomers: 'Urban households, young professionals, students, and small offices seeking convenience and fair pricing.', competitors: 'Open-market traders, supermarkets, social sellers, and delivery platforms.', advantage: 'Curated stock, transparent pricing, quick fulfillment, and customer retention through WhatsApp and loyalty offers.' },
          products: { offer: 'Consumer goods, curated bundles, seasonal offers, and delivery service.', pricing: 'Markup-based pricing with stock rotation controls and supplier-negotiated discounts.' }
        },
        financials: { revenue: [60000000, 90000000, 125000000], cogs: [42000000, 61200000, 83750000], opex: [7200000, 9900000, 13750000], salaries: [6000000, 8400000, 12000000], marketing: [1800000, 2700000, 3750000] }
      }
    },
    agriculture: {
      label: 'Agriculture',
      sector: 'Agriculture',
      data: {
        meta: { industry: 'Agriculture and processing', format: 'grant' },
        sections: {
          company: { name: 'New Agribusiness Venture', concept: 'An agribusiness that improves production, aggregation, processing, or distribution for local and regional markets.' },
          market: { targetCustomers: 'Food processors, wholesalers, retailers, restaurants, households, and institutional buyers.', competitors: 'Smallholder producers, middlemen, imported substitutes, and informal processors.', advantage: 'Reliable supply, better quality control, storage discipline, and stronger market access.' },
          operations: { suppliers: 'Smallholder farmers, input suppliers, storage providers, transporters, extension agents, and packaging vendors.', licenses: 'Business registration, food safety approvals where relevant, local permits, tax registration, and export documentation if applicable.' },
          milestones: { nextSteps: 'Secure land or aggregation contracts, validate buyer demand, finalize input supply, complete pilot cycle, and lock distribution partners.' }
        },
        financials: { revenue: [30000000, 54000000, 84000000], cogs: [16500000, 29160000, 44520000], opex: [5400000, 8100000, 11760000], salaries: [4200000, 6600000, 9600000], marketing: [900000, 1620000, 2520000] }
      }
    },
    manufacturing: {
      label: 'Manufacturing',
      sector: 'Manufacturing',
      data: {
        meta: { industry: 'Light manufacturing', format: 'lender' },
        sections: {
          company: { name: 'New Manufacturing Venture', concept: 'A local manufacturing business producing quality goods for domestic and regional buyers.' },
          products: { offer: 'Locally manufactured products, bulk supply, private-label production, and after-sales support.', pricing: 'Cost-plus pricing with volume discounts and long-term supply contracts.' },
          operations: { suppliers: 'Raw material suppliers, packaging providers, equipment maintenance partners, logistics providers, and utilities.', staffing: 'Production lead, machine operators, quality inspector, warehouse assistant, sales lead, and finance/admin support.' },
          risks: { risks: 'Power instability, raw material price volatility, equipment downtime, quality drift, and working-capital pressure.', mitigations: 'Backup power planning, supplier diversification, preventive maintenance, QC checklists, and phased inventory purchases.' }
        },
        financials: { revenue: [75000000, 125000000, 180000000], cogs: [41250000, 67500000, 95400000], opex: [11250000, 17500000, 25200000], salaries: [15000000, 24000000, 36000000], marketing: [2250000, 3750000, 5400000], capex: [25000000, 10000000, 15000000] }
      }
    },
    logistics: {
      label: 'Logistics',
      sector: 'Logistics',
      data: {
        meta: { industry: 'Logistics and delivery', format: 'lender' },
        sections: {
          company: { name: 'New Logistics Business', concept: 'A logistics company providing dependable delivery, warehousing, and route support for SMEs and e-commerce sellers.' },
          market: { targetCustomers: 'Online sellers, wholesalers, manufacturers, pharmacies, food businesses, and SMEs needing reliable deliveries.', competitors: 'Courier companies, informal dispatch riders, marketplace logistics, and in-house fleets.', advantage: 'Route discipline, proof-of-delivery controls, transparent pricing, and service-level reporting.' },
          operations: { suppliers: 'Rider partners, fleet maintenance providers, fuel partners, warehouse operators, insurance providers, and technology vendors.' }
        },
        financials: { revenue: [42000000, 78000000, 132000000], cogs: [12600000, 23400000, 39600000], opex: [9600000, 17160000, 29040000], salaries: [12000000, 21600000, 36000000], marketing: [2100000, 3900000, 6600000], capex: [12000000, 18000000, 24000000] }
      }
    },
    healthcare: {
      label: 'Healthcare',
      sector: 'Healthcare',
      data: {
        meta: { industry: 'Healthcare services', format: 'grant' },
        sections: {
          company: { name: 'New Healthcare Venture', concept: 'A healthcare service improving access, affordability, and continuity of care for underserved communities.' },
          market: { targetCustomers: 'Patients, clinics, pharmacies, employers, insurers, and community health partners.', competitors: 'Clinics, pharmacies, informal providers, digital health apps, and hospital networks.', advantage: 'Trust, clinical partnerships, compliance discipline, patient follow-up, and transparent pricing.' },
          operations: { licenses: 'Business registration, clinical approvals where applicable, data privacy compliance, pharmacy or lab permits if required, and insurance coverage.' }
        },
        financials: { revenue: [36000000, 66000000, 108000000], cogs: [10800000, 19800000, 32400000], opex: [10800000, 19800000, 32400000], salaries: [14400000, 24000000, 38400000], marketing: [1800000, 3300000, 5400000] }
      }
    },
    education: {
      label: 'Education',
      sector: 'Education',
      data: {
        meta: { industry: 'Education and training', format: 'grant' },
        sections: {
          company: { name: 'New Education Venture', concept: 'An education business delivering practical learning, tutoring, or skills development for learners and working adults.' },
          market: { targetCustomers: 'Students, parents, schools, professionals, SMEs, and corporate training teams.', competitors: 'Schools, tutoring centers, online course platforms, informal tutors, and training providers.', advantage: 'Outcome-focused curriculum, local relevance, hybrid delivery, and measurable learner progress.' },
          products: { offer: 'Courses, tutoring packages, certification programs, learning materials, and employer training.' }
        },
        financials: { revenue: [24000000, 48000000, 84000000], cogs: [4800000, 9600000, 16800000], opex: [7200000, 14400000, 25200000], salaries: [8400000, 16800000, 29400000], marketing: [1200000, 2400000, 4200000] }
      }
    },
    fintech: {
      label: 'Fintech',
      sector: 'Financial technology',
      data: {
        meta: { industry: 'Fintech', format: 'investor' },
        sections: {
          company: { name: 'New Fintech Venture', concept: 'A fintech product expanding access to payments, credit, savings, or financial operations for African users and businesses.' },
          market: { targetCustomers: 'SMEs, agents, gig workers, underbanked consumers, diaspora families, and digital merchants.', competitors: 'Banks, mobile money operators, payment processors, lending apps, and informal finance groups.', advantage: 'Lower friction, trust, local compliance, agent distribution, and better user education.' },
          operations: { licenses: 'Company registration, data protection, payment or lending approvals where applicable, AML/KYC controls, and partner bank agreements.' },
          risks: { risks: 'Regulatory changes, fraud, liquidity pressure, trust barriers, API downtime, and customer support complexity.', mitigations: 'Compliance counsel, transaction monitoring, staged rollout, capital buffers, redundancy, and clear escalation playbooks.' }
        },
        financials: { revenue: [48000000, 144000000, 360000000], cogs: [9600000, 28800000, 72000000], opex: [24000000, 72000000, 144000000], salaries: [36000000, 90000000, 180000000], marketing: [12000000, 36000000, 90000000], capex: [12000000, 24000000, 36000000] }
      }
    },
    realestate: {
      label: 'Real estate',
      sector: 'Real estate',
      data: {
        meta: { industry: 'Real estate and property', format: 'lender' },
        sections: {
          company: { name: 'New Real Estate Venture', concept: 'A real estate business developing, managing, or brokering property assets for growing urban markets.' },
          market: { targetCustomers: 'Young professionals, growing families, SMEs, diaspora buyers, and institutional tenants.', competitors: 'Property developers, brokers, informal agents, short-let operators, and housing cooperatives.', advantage: 'Transparent documentation, location discipline, reliable delivery, property management quality, and buyer trust.' },
          funding: { useOfFunds: 'Land acquisition, approvals, professional fees, construction, marketing, working capital, and contingency.' }
        },
        financials: { revenue: [90000000, 180000000, 300000000], cogs: [54000000, 108000000, 180000000], opex: [9000000, 18000000, 30000000], salaries: [12000000, 24000000, 36000000], marketing: [4500000, 9000000, 15000000], capex: [50000000, 80000000, 120000000] }
      }
    }
  };

  var SECTIONS = [
    {
      id: 'company',
      label: 'Company',
      help: 'Define the business clearly before writing the rest of the plan.',
      fields: [
        ['name', 'Business name', 'input', 'e.g. Kijiji Solar Services Ltd'],
        ['concept', 'Business concept', 'textarea', 'What does the business do, for whom, and why now?'],
        ['mission', 'Mission', 'textarea', 'What change does the business exist to make?'],
        ['legalStructure', 'Legal structure', 'input', 'Sole proprietorship, partnership, limited company, cooperative'],
        ['location', 'Location and coverage', 'input', 'City, country, and operating region'],
        ['team', 'Founder and team strengths', 'textarea', 'Relevant skills, experience, advisors, and execution capacity']
      ]
    },
    {
      id: 'market',
      label: 'Market',
      help: 'Show that the opportunity is real and that you understand the buyer.',
      fields: [
        ['problem', 'Problem', 'textarea', 'What customer pain or market gap are you solving?'],
        ['targetCustomers', 'Target customers', 'textarea', 'Who buys, who uses, and who influences the purchase?'],
        ['marketSize', 'Market size and trend', 'textarea', 'Estimate market size, growth drivers, and local demand signals.'],
        ['competitors', 'Competitors', 'textarea', 'List direct and indirect competitors.'],
        ['advantage', 'Competitive advantage', 'textarea', 'Why will customers choose you instead?']
      ]
    },
    {
      id: 'products',
      label: 'Offer',
      help: 'Explain exactly what you sell and how money comes in.',
      fields: [
        ['offer', 'Products or services', 'textarea', 'Describe the offer in plain language.'],
        ['pricing', 'Pricing and margins', 'textarea', 'How do you price? What margin logic do you use?'],
        ['salesModel', 'Sales model', 'textarea', 'Retail, subscription, contracts, agents, B2B, wholesale, marketplace, or other.'],
        ['customerProof', 'Customer proof', 'textarea', 'Pilots, waiting list, sales conversations, LOIs, repeat purchases, testimonials, or research.']
      ]
    },
    {
      id: 'marketing',
      label: 'Marketing',
      help: 'A good plan explains how customers will hear, trust, buy, and return.',
      fields: [
        ['positioning', 'Positioning', 'textarea', 'How should the market describe your business?'],
        ['channels', 'Acquisition channels', 'textarea', 'Referrals, social media, SEO, agents, partnerships, events, sales reps, or distributors.'],
        ['budget', 'Marketing budget', 'input', 'Monthly or annual spend'],
        ['retention', 'Retention plan', 'textarea', 'How will you keep customers coming back?']
      ]
    },
    {
      id: 'operations',
      label: 'Operations',
      help: 'Lenders and partners look for operational discipline, not only ambition.',
      fields: [
        ['process', 'Operating process', 'textarea', 'How is the product or service delivered from order to completion?'],
        ['suppliers', 'Suppliers and partners', 'textarea', 'Key suppliers, service providers, platforms, distributors, and dependencies.'],
        ['staffing', 'Staffing plan', 'textarea', 'Roles required now and roles needed as the business grows.'],
        ['licenses', 'Licenses, compliance, and records', 'textarea', 'Registrations, permits, tax records, insurance, data privacy, sector approvals.']
      ]
    },
    {
      id: 'milestones',
      label: 'Milestones',
      help: 'Convert the plan into a 12-month execution map.',
      fields: [
        ['nextSteps', 'Next 90 days', 'textarea', 'Immediate actions required to launch or improve traction.'],
        ['yearOne', 'Year 1 milestones', 'textarea', 'Revenue, customer, hiring, product, operating, and compliance milestones.'],
        ['kpis', 'KPIs to track', 'textarea', 'Revenue, gross margin, cash runway, repeat purchase, CAC, stock turn, utilization, churn, or other metrics.']
      ]
    },
    {
      id: 'financials',
      label: 'Financials',
      help: 'Build a simple 3 to 5 year model. Keep assumptions visible and believable.',
      financial: true
    },
    {
      id: 'funding',
      label: 'Funding',
      help: 'Explain how much capital is needed, where it goes, and how it will be repaid or returned.',
      fields: [
        ['amountNeeded', 'Funding required', 'input', 'Total capital needed'],
        ['useOfFunds', 'Use of funds', 'textarea', 'Break down setup costs, equipment, inventory, hiring, marketing, working capital, and contingency.'],
        ['sources', 'Funding sources', 'textarea', 'Owner equity, bank loan, angel investment, grant, supplier credit, revenue, or partners.'],
        ['repayment', 'Repayment or investor return plan', 'textarea', 'How will lenders be repaid or investors get a return?']
      ]
    },
    {
      id: 'risks',
      label: 'Risks',
      help: 'Strong plans admit risks and show practical mitigation.',
      fields: [
        ['risks', 'Top risks', 'textarea', 'Market, operations, finance, compliance, supplier, technology, hiring, or security risks.'],
        ['mitigations', 'Mitigation plan', 'textarea', 'Controls, backups, insurance, phased rollout, cash buffers, compliance checks, and monitoring.'],
        ['assumptions', 'Key assumptions to validate', 'textarea', 'What must prove true for the plan to work?']
      ]
    }
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function defaults() {
    return {
      meta: {
        format: 'lender',
        country: 'Nigeria',
        currency: 'NGN',
        forecastYears: 3,
        industry: '',
        template: 'blank'
      },
      sections: {
        company: {},
        market: {},
        products: {},
        marketing: {},
        operations: {},
        milestones: {},
        funding: {},
        risks: {}
      },
      financials: {
        revenue: [0, 0, 0, 0, 0],
        cogs: [0, 0, 0, 0, 0],
        opex: [0, 0, 0, 0, 0],
        salaries: [0, 0, 0, 0, 0],
        marketing: [0, 0, 0, 0, 0],
        capex: [0, 0, 0, 0, 0],
        startupCosts: 0,
        ownerEquity: 0,
        assumptions: 'List the logic behind your prices, volumes, costs, hiring, and growth.'
      }
    };
  }

  function deepMerge(base, extra) {
    if (!extra || typeof extra !== 'object') return base;
    Object.keys(extra).forEach(function (key) {
      if (Array.isArray(extra[key])) {
        base[key] = extra[key].slice();
      } else if (extra[key] && typeof extra[key] === 'object' && base[key] && typeof base[key] === 'object') {
        deepMerge(base[key], extra[key]);
      } else if (extra[key] !== undefined) {
        base[key] = extra[key];
      }
    });
    return base;
  }

  function normalize(data) {
    var next = deepMerge(defaults(), migrateOldData(data || {}));
    next.meta.forecastYears = Math.min(5, Math.max(3, Number(next.meta.forecastYears) || 3));
    if (!CURRENCY_SYMBOLS[next.meta.currency]) {
      next.meta.currency = COUNTRY_CURRENCY[next.meta.country] || 'NGN';
    }
    Object.keys(next.financials).forEach(function (key) {
      if (Array.isArray(next.financials[key])) {
        while (next.financials[key].length < 5) next.financials[key].push(0);
        next.financials[key] = next.financials[key].slice(0, 5).map(num);
      }
    });
    next.financials.startupCosts = num(next.financials.startupCosts);
    next.financials.ownerEquity = num(next.financials.ownerEquity);
    return next;
  }

  function migrateOldData(data) {
    if (data.meta || data.sections || data.financials) return data;
    var migrated = defaults();
    migrated.sections.company.name = data.legalName || data.businessName || '';
    migrated.sections.company.legalStructure = data.legalStructure || '';
    migrated.sections.company.location = data.location || '';
    migrated.sections.company.team = data.team || '';
    migrated.sections.company.mission = data.mission || '';
    migrated.sections.company.concept = data.overview || data.vision || '';
    migrated.sections.market.targetCustomers = data.targetMarket || '';
    migrated.sections.market.marketSize = data.marketSize || '';
    migrated.sections.market.competitors = data.competitors || '';
    migrated.sections.market.advantage = data.swot || '';
    migrated.sections.products.offer = data.offerings || '';
    migrated.sections.products.pricing = data.pricing || '';
    migrated.sections.products.customerProof = data.competitive || '';
    migrated.sections.marketing.channels = data.channels || '';
    migrated.sections.marketing.budget = data.budget || '';
    migrated.sections.marketing.positioning = data.gtm || '';
    migrated.sections.funding.amountNeeded = data.fundingNeeded || '';
    migrated.sections.funding.useOfFunds = data.fundingUse || '';
    migrated.sections.funding.sources = data.fundingSources || '';
    ['revenue', 'cogs', 'opex', 'marketing_cost', 'salaries'].forEach(function (oldKey) {
      var newKey = oldKey === 'marketing_cost' ? 'marketing' : oldKey;
      for (var year = 1; year <= 3; year += 1) {
        migrated.financials[newKey][year - 1] = num(data['fin_' + oldKey + '_y' + year]);
      }
    });
    return migrated;
  }

  function num(value) {
    var n = Number(String(value == null ? '' : value).replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function attr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function getPath(path) {
    return path.split('.').reduce(function (obj, part) {
      return obj && obj[part];
    }, state);
  }

  function setPath(path, value) {
    var parts = path.split('.');
    var obj = state;
    for (var i = 0; i < parts.length - 1; i += 1) obj = obj[parts[i]];
    obj[parts[parts.length - 1]] = value;
  }

  function money(value) {
    var symbol = CURRENCY_SYMBOLS[state.meta.currency] || state.meta.currency;
    var n = num(value);
    var sign = n < 0 ? '-' : '';
    return sign + symbol + ' ' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function plainMoney(value) {
    return state.meta.currency + ' ' + num(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function years() {
    var count = Number(state.meta.forecastYears) || 3;
    return Array.from({ length: count }, function (_, idx) { return idx + 1; });
  }

  function calculate() {
    var result = [];
    years().forEach(function (year) {
      var idx = year - 1;
      var revenue = num(state.financials.revenue[idx]);
      var cogs = num(state.financials.cogs[idx]);
      var opex = num(state.financials.opex[idx]);
      var salaries = num(state.financials.salaries[idx]);
      var marketing = num(state.financials.marketing[idx]);
      var capex = num(state.financials.capex[idx]);
      var grossProfit = revenue - cogs;
      var ebitda = grossProfit - opex - salaries - marketing;
      var netCash = ebitda - capex;
      var grossMargin = revenue ? grossProfit / revenue * 100 : 0;
      result.push({ year: year, revenue: revenue, cogs: cogs, grossProfit: grossProfit, grossMargin: grossMargin, opex: opex, salaries: salaries, marketing: marketing, capex: capex, ebitda: ebitda, netCash: netCash });
    });
    return result;
  }

  function fundingGap() {
    var yearOneCashNeed = Math.max(0, -calculate()[0].netCash);
    var requested = parseAmount(state.sections.funding.amountNeeded);
    var startup = num(state.financials.startupCosts);
    var equity = num(state.financials.ownerEquity);
    return Math.max(0, startup + yearOneCashNeed - equity - requested);
  }

  function parseAmount(value) {
    return num(String(value || '').replace(/[^\d.-]/g, ''));
  }

  function renderTemplateRow() {
    $('templateRow').innerHTML = Object.keys(TEMPLATES).map(function (id) {
      var active = state.meta.template === id ? ' active' : '';
      return '<button class="bp-template-btn' + active + '" type="button" data-template="' + attr(id) + '">' + escapeHtml(TEMPLATES[id].label) + '</button>';
    }).join('');
  }

  function renderSectionNav() {
    $('sectionNav').innerHTML = SECTIONS.map(function (section, idx) {
      var cls = 'bp-section-tab' + (idx === currentSection ? ' active' : '') + (sectionCompletion(section) >= 0.7 ? ' done' : '');
      return '<button class="' + cls + '" type="button" data-section-index="' + idx + '">' + escapeHtml(section.label) + '</button>';
    }).join('');
  }

  function sectionCompletion(section) {
    if (section.financial) {
      var required = ['revenue', 'cogs', 'opex'];
      var filled = 0;
      var total = required.length * 3 + 1;
      required.forEach(function (row) {
        for (var i = 0; i < 3; i += 1) if (num(state.financials[row][i]) > 0) filled += 1;
      });
      if (state.financials.assumptions && state.financials.assumptions.length > 20) filled += 1;
      return filled / total;
    }
    var fields = section.fields || [];
    if (!fields.length) return 0;
    var done = fields.filter(function (field) {
      return textValue(state.sections[section.id][field[0]]).length >= 12;
    }).length;
    return done / fields.length;
  }

  function textValue(value) {
    return String(value || '').trim();
  }

  function renderCurrentSection() {
    var section = SECTIONS[currentSection];
    $('sectionKicker').textContent = 'Section ' + (currentSection + 1) + ' of ' + SECTIONS.length;
    $('sectionTitle').textContent = section.label;
    $('sectionHelp').textContent = section.help;
    $('prevSectionBtn').disabled = currentSection === 0;
    $('nextSectionBtn').textContent = currentSection === SECTIONS.length - 1 ? 'Export PDF' : 'Next';

    if (section.financial) {
      $('sectionBody').innerHTML = renderFinancialSection();
      return;
    }

    $('sectionBody').innerHTML = '<div class="bp-grid two">' + section.fields.map(function (field) {
      var id = section.id + '.' + field[0];
      var value = state.sections[section.id][field[0]] || '';
      var input = field[2] === 'textarea'
        ? '<textarea data-section-field="' + attr(id) + '" placeholder="' + attr(field[3] || '') + '">' + escapeHtml(value) + '</textarea>'
        : '<input data-section-field="' + attr(id) + '" type="text" value="' + attr(value) + '" placeholder="' + attr(field[3] || '') + '">';
      return '<label>' + escapeHtml(field[1]) + input + (field[3] ? '<span class="bp-field-note">' + escapeHtml(field[3]) + '</span>' : '') + '</label>';
    }).join('') + '</div>';
  }

  function renderFinancialSection() {
    var rows = [
      ['revenue', 'Revenue'],
      ['cogs', 'Cost of goods or direct costs'],
      ['grossProfit', 'Gross profit', true],
      ['opex', 'Operating expenses'],
      ['salaries', 'Salaries and wages'],
      ['marketing', 'Marketing and sales'],
      ['capex', 'Capital expenditure'],
      ['ebitda', 'Operating profit', true],
      ['netCash', 'Net cash after capex', true]
    ];
    var calc = calculate();
    var html = '<div class="bp-grid three">' +
      '<label>Startup costs<input data-fin-single="startupCosts" type="number" min="0" step="1" value="' + attr(state.financials.startupCosts) + '"></label>' +
      '<label>Owner equity<input data-fin-single="ownerEquity" type="number" min="0" step="1" value="' + attr(state.financials.ownerEquity) + '"></label>' +
      '<label>Financial assumptions<input data-fin-single="assumptions" type="text" value="' + attr(state.financials.assumptions) + '"></label>' +
      '</div><div class="bp-fin-wrap"><table class="bp-fin-table"><thead><tr><th>Line item</th>';
    years().forEach(function (year) {
      html += '<th>Year ' + year + '</th>';
    });
    html += '</tr></thead><tbody>';
    rows.forEach(function (row) {
      html += '<tr><td>' + escapeHtml(row[1]) + '</td>';
      years().forEach(function (year, idx) {
        if (row[2]) {
          var value = calc[idx][row[0]];
          html += '<td class="bp-fin-calc ' + (value < 0 ? 'negative' : '') + '" data-fin-calc="' + attr(row[0]) + '" data-fin-year="' + idx + '">' + money(value) + '</td>';
        } else {
          html += '<td><input data-fin-row="' + attr(row[0]) + '" data-fin-year="' + idx + '" type="number" step="1" value="' + attr(state.financials[row[0]][idx]) + '"></td>';
        }
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  }

  function updateFinancialOutputs() {
    var calc = calculate();
    document.querySelectorAll('[data-fin-calc]').forEach(function (cell) {
      var key = cell.getAttribute('data-fin-calc');
      var idx = Number(cell.getAttribute('data-fin-year')) || 0;
      var value = calc[idx] ? calc[idx][key] : 0;
      cell.textContent = money(value);
      cell.classList.toggle('negative', value < 0);
    });
  }

  function renderPreview() {
    $('planTitle').textContent = planTitle();
    $('planPreview').innerHTML = buildPlanHtml(false);
  }

  function planTitle() {
    return state.sections.company.name || state.meta.industry || 'Untitled business plan';
  }

  function buildPlanHtml(onePage) {
    if (onePage) return buildOnePageHtml();
    var html = '<h1>' + escapeHtml(planTitle()) + '</h1>';
    html += '<p><strong>Plan type:</strong> ' + escapeHtml(labelForFormat(state.meta.format)) + ' | <strong>Country:</strong> ' + escapeHtml(state.meta.country) + ' | <strong>Currency:</strong> ' + escapeHtml(state.meta.currency) + '</p>';
    SECTIONS.forEach(function (section) {
      html += '<h2>' + escapeHtml(section.label) + '</h2>';
      if (section.financial) {
        html += financialTableHtml();
      } else {
        (section.fields || []).forEach(function (field) {
          var value = state.sections[section.id][field[0]];
          if (!textValue(value)) return;
          html += '<p><strong>' + escapeHtml(field[1]) + ':</strong><br>' + escapeHtml(value) + '</p>';
        });
      }
    });
    return html;
  }

  function buildOnePageHtml() {
    var company = state.sections.company;
    var market = state.sections.market;
    var products = state.sections.products;
    var funding = state.sections.funding;
    var risks = state.sections.risks;
    return '<h1>' + escapeHtml(planTitle()) + '</h1>' +
      '<h2>Business snapshot</h2><p>' + escapeHtml(company.concept || company.mission || 'Describe the business concept.') + '</p>' +
      '<h2>Customer and market</h2><p>' + escapeHtml(market.targetCustomers || 'Define the target customer.') + '</p>' +
      '<h2>Offer</h2><p>' + escapeHtml(products.offer || 'Describe products or services.') + '</p>' +
      '<h2>Advantage</h2><p>' + escapeHtml(market.advantage || products.customerProof || 'Explain why this business can win.') + '</p>' +
      '<h2>Financial snapshot</h2>' + financialTableHtml(true) +
      '<h2>Funding and risk</h2><p><strong>Funding:</strong> ' + escapeHtml(funding.amountNeeded || 'Not specified') + '</p><p><strong>Risk controls:</strong> ' + escapeHtml(risks.mitigations || 'Add risk mitigations.') + '</p>';
  }

  function financialTableHtml(short) {
    var calc = calculate();
    var rows = short
      ? [['revenue', 'Revenue'], ['grossProfit', 'Gross profit'], ['ebitda', 'Operating profit'], ['netCash', 'Net cash']]
      : [['revenue', 'Revenue'], ['cogs', 'Direct costs'], ['grossProfit', 'Gross profit'], ['opex', 'Operating expenses'], ['salaries', 'Salaries'], ['marketing', 'Marketing'], ['capex', 'Capex'], ['ebitda', 'Operating profit'], ['netCash', 'Net cash']];
    var html = '<table><thead><tr><th>Line item</th>';
    calc.forEach(function (row) { html += '<th>Year ' + row.year + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function (row) {
      html += '<tr><td>' + escapeHtml(row[1]) + '</td>';
      calc.forEach(function (year) {
        var value = row[0] in year ? year[row[0]] : num(state.financials[row[0]][year.year - 1]);
        html += '<td>' + escapeHtml(plainMoney(value)) + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    if (!short && state.financials.assumptions) {
      html += '<p><strong>Assumptions:</strong><br>' + escapeHtml(state.financials.assumptions) + '</p>';
    }
    return html;
  }

  function labelForFormat(format) {
    return {
      lender: 'Lender-ready plan',
      investor: 'Investor plan',
      lean: 'Lean one-page plan',
      grant: 'Grant or NGO plan',
      internal: 'Internal growth plan'
    }[format] || 'Business plan';
  }

  function renderReview() {
    var calc = calculate();
    var checks = [
      { label: 'Business concept is clear', ok: textValue(state.sections.company.concept).length >= 40, points: 10 },
      { label: 'Target customer is specific', ok: textValue(state.sections.market.targetCustomers).length >= 35, points: 10 },
      { label: 'Competitors and advantage included', ok: textValue(state.sections.market.competitors).length >= 20 && textValue(state.sections.market.advantage).length >= 25, points: 12 },
      { label: 'Offer and pricing are explained', ok: textValue(state.sections.products.offer).length >= 25 && textValue(state.sections.products.pricing).length >= 20, points: 10 },
      { label: 'Marketing channels and retention covered', ok: textValue(state.sections.marketing.channels).length >= 25 && textValue(state.sections.marketing.retention).length >= 20, points: 9 },
      { label: 'Operations, staffing, and compliance addressed', ok: textValue(state.sections.operations.process).length >= 25 && textValue(state.sections.operations.staffing).length >= 20 && textValue(state.sections.operations.licenses).length >= 20, points: 12 },
      { label: 'Milestones and KPIs included', ok: textValue(state.sections.milestones.nextSteps).length >= 20 && textValue(state.sections.milestones.kpis).length >= 20, points: 8 },
      { label: 'Financial forecast has revenue and costs', ok: calc[0].revenue > 0 && calc[0].cogs >= 0 && calc[0].opex >= 0 && calc[0].revenue >= calc[0].cogs, points: 12 },
      { label: 'Funding use and repayment logic included', ok: textValue(state.sections.funding.amountNeeded).length > 0 && textValue(state.sections.funding.useOfFunds).length >= 25 && textValue(state.sections.funding.repayment).length >= 20, points: 10 },
      { label: 'Risks and mitigations are realistic', ok: textValue(state.sections.risks.risks).length >= 25 && textValue(state.sections.risks.mitigations).length >= 25, points: 7 }
    ];
    var score = checks.reduce(function (sum, check) { return sum + (check.ok ? check.points : 0); }, 0);
    $('scoreValue').textContent = String(score);
    $('scoreMeter').style.width = score + '%';
    $('scoreLabel').textContent = score >= 90 ? 'Ready' : score >= 70 ? 'Review' : 'Draft';
    $('checkList').innerHTML = checks.map(function (check) {
      return '<div class="bp-check ' + (check.ok ? 'ok' : '') + '"><span class="bp-check-dot">' + (check.ok ? 'OK' : '!') + '</span><span><strong>' + escapeHtml(check.label) + '</strong></span></div>';
    }).join('');
  }

  function renderMetrics() {
    var calc = calculate();
    var first = calc[0];
    $('metricRevenue').textContent = money(first.revenue);
    $('metricProfit').textContent = money(first.ebitda);
    $('metricMargin').textContent = (first.grossMargin || 0).toFixed(1) + '%';
    $('metricFunding').textContent = money(fundingGap());
  }

  function renderSaved() {
    if (!saveState) return;
    var items = saveState.getAll();
    $('savedPanel').hidden = !items.length;
    $('savedPlans').innerHTML = items.map(function (item) {
      return '<article class="bp-saved-card">' +
        '<div class="bp-saved-title">' + escapeHtml(item.title || 'Business plan') + '</div>' +
        '<div class="bp-saved-date">' + escapeHtml(formatDate(item.updatedAt)) + '</div>' +
        '<div class="bp-saved-actions"><button type="button" data-open-saved="' + attr(item.id) + '">Open</button><button type="button" data-delete-saved="' + attr(item.id) + '">Delete</button></div>' +
      '</article>';
    }).join('');
  }

  function formatDate(ts) {
    try {
      return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return 'Saved';
    }
  }

  function renderAll() {
    renderTemplateRow();
    renderSectionNav();
    syncForm();
    renderCurrentSection();
    renderPreview();
    renderReview();
    renderMetrics();
    scheduleDraftSave();
  }

  function syncForm() {
    document.querySelectorAll('[data-bind]').forEach(function (input) {
      var value = getPath(input.getAttribute('data-bind'));
      input.value = value == null ? '' : value;
    });
  }

  function scheduleDraftSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        localStorage.setItem(STORAGE_DRAFT, JSON.stringify(state));
        $('draftStatus').textContent = 'Saved locally';
      } catch (err) {
        $('draftStatus').textContent = 'Draft only';
      }
    }, 250);
  }

  function bind() {
    document.body.addEventListener('input', function (event) {
      var field = event.target.closest('[data-section-field]');
      if (field) {
        var parts = field.getAttribute('data-section-field').split('.');
        state.sections[parts[0]][parts[1]] = field.value;
        renderSectionNav();
        renderPreview();
        renderReview();
        scheduleDraftSave();
        return;
      }
      var fin = event.target.closest('[data-fin-row]');
      if (fin) {
        state.financials[fin.getAttribute('data-fin-row')][Number(fin.getAttribute('data-fin-year'))] = num(fin.value);
        updateFinancialOutputs();
        renderSectionNav();
        renderPreview();
        renderReview();
        renderMetrics();
        scheduleDraftSave();
        return;
      }
      var single = event.target.closest('[data-fin-single]');
      if (single) {
        var key = single.getAttribute('data-fin-single');
        state.financials[key] = key === 'assumptions' ? single.value : num(single.value);
        updateFinancialOutputs();
        renderSectionNav();
        renderPreview();
        renderReview();
        renderMetrics();
        scheduleDraftSave();
      }
    });

    document.body.addEventListener('change', function (event) {
      var bindInput = event.target.closest('[data-bind]');
      if (!bindInput) return;
      var path = bindInput.getAttribute('data-bind');
      setPath(path, bindInput.value);
      if (path === 'meta.country') {
        state.meta.currency = COUNTRY_CURRENCY[state.meta.country] || state.meta.currency;
      }
      if (path === 'meta.forecastYears') {
        state.meta.forecastYears = Number(bindInput.value) || 3;
      }
      renderAll();
    });

    $('templateRow').addEventListener('click', function (event) {
      var btn = event.target.closest('[data-template]');
      if (btn) applyTemplate(btn.getAttribute('data-template'));
    });
    $('sectionNav').addEventListener('click', function (event) {
      var btn = event.target.closest('[data-section-index]');
      if (btn) {
        currentSection = Number(btn.getAttribute('data-section-index'));
        renderAll();
      }
    });
    $('prevSectionBtn').addEventListener('click', function () {
      if (currentSection > 0) {
        currentSection -= 1;
        renderAll();
      }
    });
    $('nextSectionBtn').addEventListener('click', function () {
      if (currentSection < SECTIONS.length - 1) {
        currentSection += 1;
        renderAll();
      } else {
        exportPdf();
      }
    });
    $('savePlanBtn').addEventListener('click', savePlan);
    $('savePlanSideBtn').addEventListener('click', savePlan);
    $('pdfBtn').addEventListener('click', exportPdf);
    $('docBtn').addEventListener('click', exportDoc);
    $('txtBtn').addEventListener('click', exportTxt);
    $('csvBtn').addEventListener('click', exportCsv);
    $('jsonBtn').addEventListener('click', exportJson);
    $('shareBtn').addEventListener('click', shareLink);
    $('copyBriefBtn').addEventListener('click', copyBrief);
    $('onePageBtn').addEventListener('click', function () {
      $('planPreview').innerHTML = buildOnePageHtml();
      toast('One-page brief previewed.');
    });
    $('importJson').addEventListener('change', importJson);
    $('savedPlans').addEventListener('click', function (event) {
      var open = event.target.closest('[data-open-saved]');
      var del = event.target.closest('[data-delete-saved]');
      if (open) openSaved(open.getAttribute('data-open-saved'));
      if (del) deleteSaved(del.getAttribute('data-delete-saved'));
    });
  }

  function applyTemplate(id) {
    var tpl = TEMPLATES[id] || TEMPLATES.blank;
    state = normalize(deepMerge(state, tpl.data || {}));
    state.meta.template = id;
    state.meta.industry = tpl.sector || state.meta.industry;
    renderAll();
    toast(tpl.label + ' template applied.');
  }

  function savePlan() {
    if (!saveState) {
      toast('Saved plans are unavailable in this browser.');
      return;
    }
    var entry = saveState.save({
      id: currentSavedId,
      title: planTitle(),
      data: JSON.parse(JSON.stringify(state))
    });
    currentSavedId = entry.id;
    renderSaved();
    toast('Plan saved in this browser.');
  }

  function openSaved(id) {
    var item = saveState && saveState.load(id);
    if (!item || !item.data) return;
    currentSavedId = item.id;
    state = normalize(item.data);
    currentSection = 0;
    renderAll();
    toast('Plan loaded.');
  }

  function deleteSaved(id) {
    var item = saveState && saveState.load(id);
    if (!window.confirm('Delete "' + (item ? item.title : 'this plan') + '" from this browser?')) return;
    saveState.delete(id);
    renderSaved();
  }

  function exportPdf() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      toast('PDF tools are still loading.');
      return;
    }
    var doc = new window.jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    var pageWidth = doc.internal.pageSize.getWidth();
    var pageHeight = doc.internal.pageSize.getHeight();
    var margin = 18;
    var y = 22;
    var maxWidth = pageWidth - margin * 2;

    doc.setProperties({ title: planTitle(), subject: 'Business plan generated with AfroTools', author: planTitle(), creator: 'AfroTools Business Plan Builder' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    y = writeLines(doc, planTitle(), margin, y, maxWidth, 8, pageHeight - 16) + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y = writeLines(doc, labelForFormat(state.meta.format) + ' | ' + state.meta.country + ' | ' + state.meta.currency, margin, y, maxWidth, 5.5, pageHeight - 16) + 3;

    SECTIONS.forEach(function (section) {
      if (y > pageHeight - 34) {
        doc.addPage();
        y = 22;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(15, 74, 162);
      y = writeLines(doc, section.label, margin, y, maxWidth, 7, pageHeight - 16) + 1;
      doc.setTextColor(0, 0, 0);
      doc.setFont('times', 'normal');
      doc.setFontSize(10.5);
      if (section.financial) {
        financialTextRows().forEach(function (line) {
          y = writeLines(doc, line, margin, y, maxWidth, 5.2, pageHeight - 16);
        });
        y += 3;
      } else {
        (section.fields || []).forEach(function (field) {
          var value = state.sections[section.id][field[0]];
          if (!textValue(value)) return;
          doc.setFont('helvetica', 'bold');
          y = writeLines(doc, field[1] + ':', margin, y, maxWidth, 5.5, pageHeight - 16);
          doc.setFont('times', 'normal');
          y = writeLines(doc, value, margin, y, maxWidth, 5.5, pageHeight - 16) + 2;
        });
      }
    });

    for (var p = 1; p <= doc.getNumberOfPages(); p += 1) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(140);
      doc.text('Generated with AfroTools.com', pageWidth / 2, pageHeight - 8, { align: 'center' });
      doc.text(String(p), pageWidth - margin, pageHeight - 8, { align: 'right' });
      doc.setTextColor(0);
    }

    doc.save(fileBase() + '.pdf');
    toast('PDF downloaded.');
  }

  function writeLines(doc, text, x, y, maxWidth, lineHeight, bottom) {
    var lines = doc.splitTextToSize(String(text || ''), maxWidth);
    lines.forEach(function (line) {
      if (y > bottom) {
        doc.addPage();
        y = 22;
      }
      doc.text(line, x, y);
      y += lineHeight;
    });
    return y;
  }

  function financialTextRows() {
    var calc = calculate();
    var rows = [];
    calc.forEach(function (year) {
      rows.push('Year ' + year.year + ': revenue ' + plainMoney(year.revenue) + ', gross profit ' + plainMoney(year.grossProfit) + ', operating profit ' + plainMoney(year.ebitda) + ', net cash ' + plainMoney(year.netCash) + ', gross margin ' + year.grossMargin.toFixed(1) + '%.');
    });
    if (state.financials.assumptions) rows.push('Assumptions: ' + state.financials.assumptions);
    return rows;
  }

  function exportDoc() {
    var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + escapeHtml(planTitle()) + '</title></head><body>' + buildPlanHtml(false) + '</body></html>';
    downloadBlob(html, fileBase() + '.doc', 'application/msword;charset=utf-8');
  }

  function exportTxt() {
    var parts = [planTitle(), labelForFormat(state.meta.format) + ' | ' + state.meta.country + ' | ' + state.meta.currency, ''];
    SECTIONS.forEach(function (section) {
      parts.push(section.label.toUpperCase());
      if (section.financial) {
        parts = parts.concat(financialTextRows());
      } else {
        (section.fields || []).forEach(function (field) {
          var value = state.sections[section.id][field[0]];
          if (textValue(value)) parts.push(field[1] + ': ' + value);
        });
      }
      parts.push('');
    });
    downloadBlob(parts.join('\n').trim() + '\n', fileBase() + '.txt', 'text/plain;charset=utf-8');
  }

  function exportCsv() {
    var rows = [['Line item'].concat(years().map(function (year) { return 'Year ' + year; }))];
    var calc = calculate();
    [
      ['revenue', 'Revenue'],
      ['cogs', 'Direct costs'],
      ['grossProfit', 'Gross profit'],
      ['opex', 'Operating expenses'],
      ['salaries', 'Salaries'],
      ['marketing', 'Marketing'],
      ['capex', 'Capex'],
      ['ebitda', 'Operating profit'],
      ['netCash', 'Net cash']
    ].forEach(function (row) {
      rows.push([row[1]].concat(calc.map(function (year) {
        return row[0] in year ? year[row[0]] : state.financials[row[0]][year.year - 1];
      })));
    });
    rows.push([], ['Startup costs', state.financials.startupCosts], ['Owner equity', state.financials.ownerEquity], ['Funding required', state.sections.funding.amountNeeded || '']);
    downloadBlob(rows.map(csvRow).join('\n'), fileBase() + '-forecast.csv', 'text/csv;charset=utf-8');
  }

  function exportJson() {
    downloadBlob(JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), data: state }, null, 2), fileBase() + '.json', 'application/json;charset=utf-8');
  }

  function importJson(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(String(reader.result || '{}'));
        state = normalize(parsed.data || parsed);
        currentSavedId = null;
        currentSection = 0;
        renderAll();
        toast('Plan imported.');
      } catch (err) {
        toast('Could not import that JSON file.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  }

  function shareLink() {
    try {
      var token = btoa(unescape(encodeURIComponent(JSON.stringify({ version: 2, data: state })))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      var url = window.location.origin + window.location.pathname + '?plan=' + token;
      if (url.length > 7800) {
        toast('Plan is too large for a share link. Export JSON instead.');
        return;
      }
      navigator.clipboard.writeText(url).then(function () {
        toast('Share link copied.');
      }).catch(function () {
        window.prompt('Copy business plan link', url);
      });
    } catch (err) {
      toast('Could not create a share link.');
    }
  }

  function copyBrief() {
    var brief = stripHtml(buildOnePageHtml());
    if (!navigator.clipboard) {
      toast('Copy is unavailable. Use TXT export instead.');
      return;
    }
    navigator.clipboard.writeText(brief).then(function () {
      toast('One-page brief copied.');
    }).catch(function () {
      toast('Copy failed. Use TXT export instead.');
    });
  }

  function stripHtml(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.innerText.replace(/\n{3,}/g, '\n\n').trim();
  }

  function csvRow(row) {
    return row.map(function (cell) {
      var value = String(cell == null ? '' : cell);
      return /[",\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
    }).join(',');
  }

  function downloadBlob(content, filename, type) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type || 'application/octet-stream' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(link.href); }, 500);
  }

  function fileBase() {
    return planTitle().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'business-plan';
  }

  function restoreInitialState() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('plan')) {
      try {
        var token = params.get('plan').replace(/-/g, '+').replace(/_/g, '/');
        while (token.length % 4) token += '=';
        var shared = JSON.parse(decodeURIComponent(escape(atob(token))));
        return normalize(shared.data || shared);
      } catch (err) {
        toast('The shared plan link could not be opened.');
      }
    }
    if (params.get('id') && saveState) {
      var saved = saveState.load(params.get('id'));
      if (saved && saved.data) {
        currentSavedId = saved.id;
        return normalize(saved.data);
      }
    }
    try {
      var draft = localStorage.getItem(STORAGE_DRAFT);
      if (draft) return normalize(JSON.parse(draft));
    } catch (err) {}
    return normalize(defaults());
  }

  function toast(message) {
    var el = document.querySelector('.bp-toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'bp-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }

  function init() {
    state = restoreInitialState();
    bind();
    renderAll();
    renderSaved();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
