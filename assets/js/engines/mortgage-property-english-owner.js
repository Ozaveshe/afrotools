(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.MortgagePropertyEnglishOwnerEngine = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var USD_RATE = 1620;
  var TENANCY_CURRENCIES = Object.freeze({ ng: 'NGN', ke: 'KES', za: 'ZAR', gh: 'GHS' });
  var CIPC_FEES = {
    pty: { online: 125, manual: 175, label: 'Private Company (Pty) Ltd' },
    inc: { online: 125, manual: 175, label: 'Personal Liability Co (Inc)' },
    npc: { online: 75, manual: 125, label: 'Non-Profit Company (NPC)' },
    coop: { online: 215, manual: 310, label: 'Co-operative' },
    ext: { online: 425, manual: 600, label: 'External Company' }
  };
  var NAME_FEE = { online: 50, manual: 75 };
  var FAMILY_MULTIPLIER = { magistrate: 0.5, high: 0.7, appeal: 0.8 };

  var POLICIES = {
    propertyTax: {
      NG: { currency: 'NGN', cities: { lagos: { residential: 0.000394, rental: 0.000789, commercial: 0.00132, industrial: 0.00132 }, abuja: { residential: 0.0005, rental: 0.001, commercial: 0.0015, industrial: 0.0015 }, rivers: { residential: 0.0004, rental: 0.0008, commercial: 0.0012, industrial: 0.0012 }, ogun: { residential: 0.0003, rental: 0.0007, commercial: 0.001, industrial: 0.001 } } },
      SN: { currency: 'XOF', cities: { dakar: { residential: 0.05, rental: 0.075, commercial: 0.075, industrial: 0.075 }, other: { residential: 0.05, rental: 0.06, commercial: 0.06, industrial: 0.06 } } },
      CI: { currency: 'XOF', cities: { abidjan: { residential: 0.015, rental: 0.015, commercial: 0.015, industrial: 0.015 }, other: { residential: 0.012, rental: 0.012, commercial: 0.012, industrial: 0.012 } } },
      ZA: { currency: 'ZAR', cities: { johannesburg: { residential: 0.008, rental: 0.01, commercial: 0.015, industrial: 0.012 }, capetown: { residential: 0.007, rental: 0.009, commercial: 0.013, industrial: 0.011 }, durban: { residential: 0.009, rental: 0.011, commercial: 0.014, industrial: 0.012 }, pretoria: { residential: 0.008, rental: 0.01, commercial: 0.013, industrial: 0.011 } } }
    },
    childSupport: {
      NG: { name: 'Nigeria', currency: '₦', law: 'Child Rights Act 2003' },
      SN: { name: 'Senegal', currency: 'FCFA', law: 'Code de la Famille' },
      CI: { name: 'Côte d’Ivoire', currency: 'FCFA', law: 'Code Civil, Family Law' },
      ZA: { name: 'South Africa', currency: 'R', law: 'Maintenance Act 99 of 1998 / Children’s Act 38 of 2005' }
    },
    courtFees: {
      NG: { name: 'Nigeria', currency: '₦', levels: { magistrate: { base: 5000, rate: 0.01, cap: 50000 }, high: { base: 20000, rate: 0.015, cap: 200000 }, appeal: { base: 50000, rate: 0.02, cap: 500000 } }, service: 3000 },
      SN: { name: 'Senegal', currency: 'FCFA', levels: { magistrate: { base: 20000, rate: 0.01, cap: 200000 }, high: { base: 75000, rate: 0.015, cap: 750000 }, appeal: { base: 150000, rate: 0.02, cap: 1500000 } }, service: 15000 },
      CI: { name: 'Côte d’Ivoire', currency: 'FCFA', levels: { magistrate: { base: 20000, rate: 0.01, cap: 200000 }, high: { base: 75000, rate: 0.015, cap: 750000 }, appeal: { base: 150000, rate: 0.02, cap: 1500000 } }, service: 15000 },
      ZA: { name: 'South Africa', currency: 'R', levels: { magistrate: { base: 250, rate: 0.005, cap: 2500 }, high: { base: 1500, rate: 0.01, cap: 15000 }, appeal: { base: 5000, rate: 0.015, cap: 50000 } }, service: 300 }
    },
    divorce: {
      NG: { name: 'Nigeria', currency: '₦', system: 'Equitable Distribution', law: 'Matrimonial Causes Act 1970' },
      SN: { name: 'Senegal', currency: 'FCFA', system: 'Separation of Property (default)', law: 'Code de la Famille' },
      CI: { name: 'Côte d’Ivoire', currency: 'FCFA', system: 'Separation of Property (default)', law: 'Code Civil (French-influenced)' },
      ZA: { name: 'South Africa', currency: 'R', system: 'Community of Property (default)', law: 'Divorce Act 70 of 1979' }
    },
    inheritance: {
      NG: { name: 'Nigeria', currency: '₦', taxRate: 0, hasTax: false, probateRate: 0.015 },
      SN: { name: 'Senegal', currency: 'FCFA', taxRate: 0.02, hasTax: true, probateRate: 0.01 },
      CI: { name: 'Côte d’Ivoire', currency: 'FCFA', taxRate: 0.025, hasTax: true, probateRate: 0.01 },
      ZA: { name: 'South Africa', currency: 'R', taxRate: 0.20, hasTax: true, threshold: 3500000, probateRate: 0.035 }
    },
    legalAid: {
      NG: { name: 'Nigeria', currency: '₦', incomeThreshold: 50000, assetThreshold: 1000000, authority: 'Legal Aid Council of Nigeria', coveredMatters: ['criminal', 'family', 'employment'] },
      SN: { name: 'Senegal', currency: 'FCFA', incomeThreshold: 150000, assetThreshold: 3000000, authority: 'Commission d’Aide Juridictionnelle', coveredMatters: ['criminal', 'family'] },
      CI: { name: 'Côte d’Ivoire', currency: 'FCFA', incomeThreshold: 200000, assetThreshold: 5000000, authority: 'Ministère de la Justice — Aide Juridictionnelle', coveredMatters: ['criminal', 'family', 'civil'] },
      ZA: { name: 'South Africa', currency: 'R', incomeThreshold: 7500, assetThreshold: 50000, authority: 'Legal Aid South Africa', coveredMatters: ['criminal', 'family', 'land', 'employment', 'civil', 'other'] }
    }
  };

  function finite(value) {
    var result = Number(value);
    return Number.isFinite(result) ? result : 0;
  }

  function policy(group, code, supplied) {
    return supplied || (POLICIES[group] && POLICIES[group][code]);
  }

  function cac(input) {
    var type = input.entityType || input.type;
    var shareCapital = Number(input.shareCapital);
    var directors = Number(input.directors);
    if (!Number.isFinite(shareCapital) || shareCapital < 10000) {
      return { ok: false, code: 'invalid-cac-share-capital' };
    }
    if (!Number.isFinite(directors) || !Number.isInteger(directors) || directors < 1 || directors > 20) {
      return { ok: false, code: 'invalid-cac-directors' };
    }
    var useAgent = input.useAgent;
    var express = input.express === true || input.express === 'yes';
    var items = [];
    if (type === 'bn') {
      items.push({ item: 'Business Name Registration Fee (CAC)', amount: 13500 });
      items.push({ item: 'Name Reservation Fee', amount: 500 });
      if (useAgent === 'agent') items.push({ item: 'Agent / Accredited Lawyer Fee', amount: 25000 });
      if (express) items.push({ item: 'Express Processing', amount: 5000 });
      if (input.addAnnualReturns) items.push({ item: 'Annual Returns Filing (Year 1)', amount: 3000 });
    } else if (type === 'llc') {
      var regFee = 25000;
      if (shareCapital > 1000000 && shareCapital <= 5000000) regFee = 35000;
      else if (shareCapital > 5000000 && shareCapital <= 25000000) regFee = 50000;
      else if (shareCapital > 25000000 && shareCapital <= 100000000) regFee = 100000;
      else if (shareCapital > 100000000) regFee = 200000;
      items.push({ item: 'Company Registration Fee (CAC)', amount: regFee });
      items.push({ item: 'Name Reservation Fee', amount: 500 });
      items.push({ item: 'Stamp Duty on Share Capital (0.75%)', amount: Math.round(shareCapital * 0.0075) });
      items.push({ item: 'CAC Filing Fee (MEMART)', amount: 5000 });
      items.push({ item: 'Certified True Copy (CTC) of Certificate', amount: 3000 });
      if (directors > 2) items.push({ item: 'Extra Director Forms (' + (directors - 2) + ' × ₦2,000)', amount: (directors - 2) * 2000 });
      if (useAgent === 'agent') items.push({ item: 'Lawyer Fee (MEMART drafting + filing)', amount: 55000 });
      if (express) items.push({ item: 'Express Processing', amount: 15000 });
      if (input.addStatusReport) items.push({ item: 'Company Status Report (for bank account)', amount: 5000 });
      if (input.addAnnualReturns) items.push({ item: 'Annual Returns Filing (Year 1)', amount: 5000 });
    } else if (type === 'llp') {
      var llpRegFee = shareCapital > 5000000 ? 50000 : shareCapital > 1000000 ? 35000 : 25000;
      items.push({ item: 'LLP Registration Fee (CAC)', amount: llpRegFee });
      items.push({ item: 'Name Reservation Fee', amount: 500 });
      items.push({ item: 'Partnership Deed Filing', amount: 5000 });
      if (useAgent === 'agent') items.push({ item: 'Lawyer Fee (Deed drafting + filing)', amount: 45000 });
      if (express) items.push({ item: 'Express Processing', amount: 10000 });
      if (input.addAnnualReturns) items.push({ item: 'Annual Returns Filing (Year 1)', amount: 5000 });
    } else if (type === 'ngo') {
      items.push({ item: 'Incorporated Trustee / NGO Registration (CAC)', amount: 20000 });
      items.push({ item: 'Name Reservation Fee', amount: 500 });
      items.push({ item: 'Trustees Declaration Filing', amount: 5000 });
      items.push({ item: 'Newspaper Publication (required by law)', amount: 15000 });
      if (input.addScuml) items.push({ item: 'SCUML Registration', amount: 0 });
      if (useAgent === 'agent') items.push({ item: 'Lawyer Fee (Constitution + filing)', amount: 50000 });
      if (express) items.push({ item: 'Express Processing', amount: 10000 });
      if (input.addAnnualReturns) items.push({ item: 'Annual Returns Filing (Year 1)', amount: 3000 });
    } else if (type === 'plc') {
      var plcRegFee = shareCapital > 500000000 ? 500000 : shareCapital > 100000000 ? 350000 : 200000;
      items.push({ item: 'PLC Registration Fee (CAC)', amount: plcRegFee });
      items.push({ item: 'Name Reservation Fee', amount: 500 });
      items.push({ item: 'Stamp Duty on Share Capital (0.75%)', amount: Math.round(shareCapital * 0.0075) });
      items.push({ item: 'CAC Filing Fee (MEMART)', amount: 15000 });
      items.push({ item: 'Certified True Copy (CTC)', amount: 5000 });
      if (directors > 2) items.push({ item: 'Extra Director Forms (' + (directors - 2) + ' × ₦2,000)', amount: (directors - 2) * 2000 });
      if (useAgent === 'agent') items.push({ item: 'Lawyer Fee (MEMART + SEC filing)', amount: 150000 });
      if (input.addStatusReport) items.push({ item: 'Company Status Report', amount: 5000 });
      if (input.addAnnualReturns) items.push({ item: 'Annual Returns Filing (Year 1)', amount: 10000 });
    }
    var total = items.reduce(function (sum, item) { return sum + item.amount; }, 0);
    return { ok: Boolean(items.length), kind: 'cac-cost', entityType: type, items: items, total: total, usdEquivalent: Math.round(total / USD_RATE), usdRate: USD_RATE };
  }

  function cipc(input) {
    var fee = CIPC_FEES[input.entityType];
    if (!fee || !NAME_FEE[input.method]) return { ok: false, code: 'invalid-cipc-selection' };
    var items = [];
    var regFee = fee[input.method];
    items.push({ name: fee.label + ' Registration', cost: regFee });
    if (input.nameRes) items.push({ name: 'Company Name Reservation', cost: NAME_FEE[input.method] });
    if (input.bbbee) items.push({ name: 'B-BBEE Affidavit (Commissioner of Oaths)', cost: 0, note: 'Free at police station' });
    if (input.useAgent) items.push({ name: 'Registration Agent Fee', cost: input.entityType === 'ext' ? 5000 : input.entityType === 'npc' ? 3000 : input.entityType === 'coop' ? 3500 : 2500 });
    if (input.taxReg) items.push({ name: 'SARS Tax Registration' + (input.useAgent ? ' (agent)' : ' (free DIY)'), cost: input.useAgent ? 1500 : 0 });
    if (input.uif) items.push({ name: 'UIF Registration' + (input.useAgent ? ' (agent)' : ' (free DIY)'), cost: input.useAgent ? 800 : 0 });
    if (input.coida) items.push({ name: 'COIDA Registration' + (input.useAgent ? ' (agent)' : ' (free DIY)'), cost: input.useAgent ? 800 : 0 });
    return { ok: true, kind: 'cipc-cost', entityType: input.entityType, method: input.method, items: items, registrationFee: regFee, total: items.reduce(function (sum, item) { return sum + item.cost; }, 0), processingTime: input.method === 'online' ? '1-3 days' : '7-21 days' };
  }

  function tenancy(input) {
    var rent = finite(input.rent);
    var advanceMonths = finite(input.advanceMonths);
    var depositMonths = finite(input.depositMonths);
    var agentPercent = finite(input.agentFee);
    var annualRent = rent * 12;
    var legalRate = ({ 'annual-five': 5, 'annual-ten': 10, none: 0 })[input.legalFee];
    var legalFee = input.legalFee === 'flat50000'
      ? (input.country === 'ng' ? 50000 : input.country === 'ke' ? 10000 : input.country === 'za' ? 5000 : 500)
      : annualRent * finite(legalRate === undefined ? input.legalFee : legalRate) / 100;
    var result = {
      ok: ['ng', 'ke', 'za', 'gh'].indexOf(input.country) !== -1 && rent > 0 && advanceMonths >= 0 && depositMonths >= 0,
      kind: 'tenancy-deposit',
      country: input.country,
      currency: input.currency || TENANCY_CURRENCIES[input.country],
      rent: rent,
      advanceMonths: advanceMonths,
      depositMonths: depositMonths,
      advanceRent: rent * advanceMonths,
      deposit: rent * depositMonths,
      agentPercent: agentPercent,
      agentFee: annualRent * agentPercent / 100,
      legalFee: legalFee,
      serviceTotal: finite(input.serviceCharge) * advanceMonths
    };
    result.total = result.advanceRent + result.deposit + result.agentFee + result.legalFee + result.serviceTotal;
    result.rentMultiple = result.total / rent;
    return result;
  }

  function propertyTax(input, suppliedPolicy) {
    var country = input.country || input['at-country'];
    var city = input.city || input['at-city'];
    var use = input.use || input['at-use'];
    var value = finite(input.propertyValue || input['at-value']);
    var data = policy('propertyTax', country, suppliedPolicy);
    var rates = data && data.cities && data.cities[city];
    var rate = rates && (rates.rates || rates)[use];
    if (!data || !Number.isFinite(rate) || value <= 0) return { ok: false, code: 'invalid-property-tax' };
    var annualTax = value * rate;
    return { ok: true, kind: 'property-tax', country: country, city: city, use: use, currency: data.currency, propertyValue: value, rate: rate, annualTax: annualTax, monthlyTax: annualTax / 12, effectiveRate: rate };
  }

  function nhf(input, suppliedPolicy) {
    var program = suppliedPolicy || { contributionRate: 0.025, loanRate: 0.06, maxLoan: 50000000, affordabilityLimit: 0.33 };
    var basic = finite(input.basic || input.inBasic);
    var yearsContributed = finite(input.yearsContributed || input.inYears);
    var loan = Math.min(finite(input.loan || input.inLoan), program.maxLoan);
    var tenure = finite(input.tenure || input.inTenure);
    var gross = finite(input.gross || input.inGross);
    if (basic <= 0 || loan <= 0 || tenure <= 0 || gross <= 0) return { ok: false, code: 'invalid-nhf' };
    var contributionMonthly = basic * program.contributionRate;
    var contributionAnnual = contributionMonthly * 12;
    var months = tenure * 12;
    var monthlyRate = program.loanRate / 12;
    var monthlyPayment = loan * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    var totalRepayment = monthlyPayment * months;
    var affordabilityLimit = gross * program.affordabilityLimit;
    return { ok: true, kind: 'ng-nhf', contributionMonthly: contributionMonthly, contributionAnnual: contributionAnnual, totalContribution: contributionAnnual * yearsContributed, yearsContributed: yearsContributed, loan: loan, tenure: tenure, monthlyPayment: monthlyPayment, totalInterest: totalRepayment - loan, totalRepayment: totalRepayment, affordabilityLimit: affordabilityLimit, affordable: monthlyPayment <= affordabilityLimit, rate: program.loanRate, maxLoan: program.maxLoan };
  }

  function childSupport(input, suppliedPolicy) {
    var country = input.country || input.selCountry;
    var data = policy('childSupport', country, suppliedPolicy);
    var income = finite(input.nonCustodialIncome || input.ncpIncome);
    var children = Math.trunc(finite(input.children || input.numChildren)) || 1;
    var custody = input.custody;
    var special = input.special;
    if (!data || income <= 0 || children <= 0) return { ok: false, code: 'invalid-child-support' };
    var rates = [0, 0.15, 0.25, 0.32, 0.38, 0.42];
    var rate = rates[Math.min(children, 5)];
    if (custody === 'joint') rate *= 0.7;
    else if (custody === 'shared') rate *= 0.4;
    if (special === 'medical') rate *= 1.2;
    else if (special === 'educational') rate *= 1.15;
    var monthly = income * rate;
    return { ok: true, kind: 'child-support', country: country, currency: data.currency, law: data.law, nonCustodialIncome: income, custodialIncome: finite(input.custodialIncome || input.cpIncome), children: children, custody: custody, special: special, rate: rate, monthly: monthly, annual: monthly * 12, perChild: monthly / children };
  }

  function courtFees(input, suppliedPolicy) {
    var country = input.country || input.selCountry;
    var level = input.courtLevel || input.level;
    var claimType = input.claimType;
    var amount = finite(input.claimAmount);
    var data = policy('courtFees', country, suppliedPolicy);
    var levelData = data && data.levels[level];
    if (!levelData || amount <= 0) return { ok: false, code: 'invalid-court-fees' };
    var filingFee = levelData.base + Math.min(amount * levelData.rate, levelData.cap - levelData.base);
    filingFee = Math.min(filingFee, levelData.cap);
    if (claimType === 'family') filingFee *= FAMILY_MULTIPLIER[level];
    return { ok: true, kind: 'court-fees', country: country, currency: data.currency, courtLevel: level, claimType: claimType, claimAmount: amount, filingFee: filingFee, serviceFee: data.service, total: filingFee + data.service, ratio: (filingFee + data.service) / amount };
  }

  function divorce(input, suppliedPolicy) {
    var country = input.country || input.selCountry;
    var data = policy('divorce', country, suppliedPolicy);
    var total = finite(input.totalAssets);
    var years = finite(input.marriageDuration);
    var children = Math.trunc(finite(input.children || input.numChildren));
    var custodian = input.custodian;
    var nameA = String(input.partyAName || 'Party A').trim() || 'Party A';
    var nameB = String(input.partyBName || 'Party B').trim() || 'Party B';
    var incomeA = finite(input.partyAIncome);
    var incomeB = finite(input.partyBIncome);
    if (!data || total <= 0 || years <= 0) return { ok: false, code: 'invalid-divorce' };
    var splitA = 50;
    var factors = [];
    if (data.system.indexOf('Community') !== -1 || data.system.indexOf('Equal') !== -1) {
      factors.push('Community of property system: base 50/50 split applies.');
    } else if (data.system.indexOf('Equitable') !== -1) {
      var totalIncome = incomeA + incomeB;
      if (totalIncome > 0 && incomeA / totalIncome < 0.35) {
        splitA += 5;
        factors.push(nameA + ' earns significantly less — small upward adjustment applied.');
      } else if (totalIncome > 0 && incomeA / totalIncome > 0.65) {
        splitA -= 5;
        factors.push(nameA + ' earns significantly more — small adjustment in favour of ' + nameB + '.');
      }
      factors.push('Equitable distribution: courts aim for fairness, not automatic equality.');
    } else {
      factors.push('Separation of property regime: only jointly held assets are divided equally.');
    }
    if (years < 5) {
      splitA -= 3;
      factors.push('Short marriage (under 5 years): modest reduction for lesser-earning party.');
    } else if (years >= 20) {
      factors.push('Long marriage (20+ years): full equal share strongly supported.');
    }
    if (children > 0 && custodian === 'A') {
      splitA += Math.min(5 + children * 2, 12);
      factors.push(nameA + ' is primary custodian of ' + children + ' child(ren) — upward adjustment applied.');
    } else if (children > 0 && custodian === 'B') {
      splitA -= Math.min(5 + children * 2, 12);
      factors.push(nameB + ' is primary custodian of ' + children + ' child(ren) — upward adjustment applied.');
    } else if (children > 0) {
      factors.push('Shared custody: no custody-based adjustment to asset split.');
    }
    splitA = Math.max(20, Math.min(80, Math.round(splitA)));
    var splitB = 100 - splitA;
    return { ok: true, kind: 'divorce-settlement', country: country, law: data.law, system: data.system, totalAssets: total, marriageDuration: years, children: children, custodian: custodian, partyAName: nameA, partyBName: nameB, splitA: splitA, splitB: splitB, valueA: total * splitA / 100, valueB: total * splitB / 100, factors: factors };
  }

  function inheritance(input, suppliedPolicy) {
    var country = input.country || input.selCountry;
    var data = policy('inheritance', country, suppliedPolicy);
    var gross = finite(input.estateValue);
    var debts = finite(input.debts);
    var funeral = finite(input.funeralExpenses || input.funeralExp);
    var relationship = input.relationship;
    if (!data || gross <= 0) return { ok: false, code: 'invalid-inheritance' };
    var netEstate = Math.max(0, gross - debts - funeral);
    var taxable = data.threshold ? Math.max(0, netEstate - data.threshold) : netEstate;
    var rate = data.taxRate;
    if (relationship === 'spouse') rate = 0;
    else if (relationship === 'child') rate *= 0.75;
    else if (relationship === 'nonrelative') rate *= 1.25;
    var tax = data.hasTax ? taxable * rate : 0;
    var probate = netEstate * data.probateRate;
    return { ok: true, kind: 'inheritance-tax', country: country, currency: data.currency, relationship: relationship, grossEstate: gross, debts: debts, funeralExpenses: funeral, netEstate: netEstate, taxableEstate: taxable, effectiveTaxRate: rate, tax: tax, probate: probate, netAfterAll: netEstate - tax - probate };
  }

  function legalAid(input, suppliedPolicy) {
    var country = input.country || input.selCountry;
    var data = policy('legalAid', country, suppliedPolicy);
    var income = finite(input.monthlyIncome);
    var assets = finite(input.totalAssets);
    var dependants = Math.trunc(finite(input.dependants));
    var matter = input.matter || input.matterType;
    if (!data || income <= 0 || dependants < 0) return { ok: false, code: 'invalid-legal-aid' };
    var adjustedThreshold = data.incomeThreshold * (1 + dependants * 0.15);
    var incomePass = income <= adjustedThreshold;
    var assetPass = assets <= data.assetThreshold;
    var matterCovered = data.coveredMatters.indexOf(matter) !== -1;
    return { ok: true, kind: 'legal-aid', country: country, currency: data.currency, authority: data.authority, monthlyIncome: income, totalAssets: assets, dependants: dependants, matter: matter, adjustedThreshold: adjustedThreshold, assetThreshold: data.assetThreshold, incomePass: incomePass, assetPass: assetPass, matterCovered: matterCovered, eligible: incomePass && assetPass && matterCovered, coveredMatters: data.coveredMatters.slice() };
  }

  var calculators = {
    'cac-cost': cac,
    'cipc-cost': cipc,
    'tenancy-deposit': tenancy,
    'property-tax': propertyTax,
    'ng-nhf': nhf,
    'child-support': childSupport,
    'court-fees': courtFees,
    'divorce-settlement': divorce,
    'inheritance-tax': inheritance,
    'legal-aid': legalAid
  };

  function calculate(id, input, suppliedPolicy) {
    if (!calculators[id]) return { ok: false, code: 'unsupported-owner' };
    return calculators[id](input || {}, suppliedPolicy);
  }

  return {
    calculate: calculate,
    calculatorIds: Object.keys(calculators),
    policies: POLICIES,
    tenancyCurrencies: TENANCY_CURRENCIES
  };
}));
