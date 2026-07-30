(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.CareerPlanning = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var CURRENCY = {
    NG: '₦', KE: 'KES ', ZA: 'ZAR ', GH: 'GHS ', EG: 'EGP ', ET: 'ETB ',
    TZ: 'TZS ', UG: 'UGX ', RW: 'RWF ', CI: 'XOF ', CM: 'XAF ', SN: 'XOF ',
    MA: 'MAD ', TN: 'TND ', AO: 'AOA '
  };
  var LEVEL_MULT = [1, 1.5, 2.2, 3.2, 4.5, 6.5];
  var LEVEL_NAMES = ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead / Manager', 'Director / VP'];
  var INDUSTRY_MULT = {
    tech: 1.4, finance: 1.35, healthcare: 1.1, engineering: 1.2,
    marketing: 0.95, fmcg: 1.05, telecom: 1.25, energy: 1.5, ngo: 0.85, govt: 0.8
  };
  var COUNTRY_BASE = {
    NG: 120000, KE: 35000, ZA: 18000, GH: 2200, EG: 5000, ET: 8000,
    TZ: 800000, UG: 1200000, RW: 250000, CI: 180000, CM: 180000, SN: 200000,
    MA: 5000, TN: 1800, AO: 150000
  };
  var EDU_MULT = { diploma: 0.85, degree: 1, masters: 1.15, phd: 1.25 };
  var PROMO_INTERVAL = {
    ic: [0, 2, 3, 4, 5, 6], management: [0, 2, 2, 3, 3, 4],
    entrepreneur: [0, 1, 2, 2, 3, 4], consultant: [0, 2, 3, 3, 4, 5]
  };
  var RAISE_BASE = { ic: 0.05, management: 0.07, entrepreneur: 0.12, consultant: 0.09 };
  var HOP_PREM = { no: 0, sometimes: 0.15, yes: 0.2 };
  var LEARN_MULT = { '0': 1, '2': 1.02, '5': 1.04, '10': 1.07 };
  var NET_MULT = { low: 1, medium: 1.02, high: 1.05 };
  var COUNTRY_NAMES = {
    NG: 'Nigeria', KE: 'Kenya', ZA: 'Afrique du Sud', GH: 'Ghana', EG: 'Égypte',
    ET: 'Éthiopie', TZ: 'Tanzanie', UG: 'Ouganda', RW: 'Rwanda',
    CI: "Côte d'Ivoire", CM: 'Cameroun', SN: 'Sénégal', MA: 'Maroc',
    TN: 'Tunisie', AO: 'Angola'
  };

  function number(value, field, min, max, integer) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
      var error = new Error('invalid:' + field);
      error.field = field;
      throw error;
    }
    return parsed;
  }

  function careerGrowth(input) {
    var level = number(input.level, 'level', 0, 5, true);
    var salaryInput = number(input.salary, 'salary', 0, 1000000000000);
    number(input.experience, 'experience', 0, 40);
    if (!CURRENCY[input.country] || !INDUSTRY_MULT[input.industry] || !EDU_MULT[input.education] ||
        !PROMO_INTERVAL[input.path] || !LEARN_MULT[input.learning] || !NET_MULT[input.network] ||
        HOP_PREM[input.mobility] === undefined) throw new Error('invalid:selection');
    var salary = salaryInput > 0 ? salaryInput :
      COUNTRY_BASE[input.country] * LEVEL_MULT[level] * INDUSTRY_MULT[input.industry] * EDU_MULT[input.education];
    var startSalary = salary;
    var annualRaise = RAISE_BASE[input.path] +
      (LEARN_MULT[input.learning] - 1) * 2 + (NET_MULT[input.network] - 1) * 2;
    var intervals = PROMO_INTERVAL[input.path];
    var yearsToNextPromo = intervals[Math.min(level, intervals.length - 1)];
    if (yearsToNextPromo === 0 && level < intervals.length - 1) yearsToNextPromo = intervals[level + 1];
    var rows = [], milestones = [], cumulativeEarnings = 0, currentLevel = level, yearsInLevel = 0;
    for (var year = 0; year <= 10; year += 1) {
      var event = '';
      if (year > 0) {
        salary *= 1 + annualRaise;
        salary *= LEARN_MULT[input.learning] * NET_MULT[input.network];
        yearsInLevel += 1;
        var interval = intervals[Math.min(currentLevel, intervals.length - 1)];
        if (currentLevel < LEVEL_NAMES.length - 1 && interval > 0 && yearsInLevel >= interval) {
          currentLevel += 1;
          salary *= 1 + (((LEVEL_MULT[currentLevel] / LEVEL_MULT[currentLevel - 1]) - 1) * 0.5);
          yearsInLevel = 0;
          event = 'promotion';
          milestones.push({ year: year, type: 'promotion', level: currentLevel, salary: salary });
        }
        var hop = HOP_PREM[input.mobility];
        if (input.mobility === 'yes' && year % 2 === 0) {
          salary *= 1 + hop;
          event = event || 'move';
          milestones.push({ year: year, type: 'move', salary: salary });
        } else if (input.mobility === 'sometimes' && year % 4 === 0) {
          salary *= 1 + hop;
          event = event || 'move';
          milestones.push({ year: year, type: 'move', salary: salary });
        }
        cumulativeEarnings += salary * 12;
      }
      rows.push({ year: year, level: currentLevel, salary: salary, annual: salary * 12, event: event });
    }
    return {
      symbol: CURRENCY[input.country], startSalary: startSalary, annualRaise: annualRaise,
      hopGain: HOP_PREM[input.mobility], yearsToNextPromo: yearsToNextPromo || null,
      projectedLevel: currentLevel, fiveYearSalary: rows[5].salary,
      tenYearSalary: rows[10].salary, cumulativeEarnings: cumulativeEarnings,
      rows: rows, milestones: milestones
    };
  }

  function careerSwitch(input) {
    var current = number(input.currentSalary, 'currentSalary', 0.01, 1000000000000);
    var benefits = number(input.currentBenefits, 'currentBenefits', 0, 1000000000000);
    var nextSalary = number(input.newSalary, 'newSalary', 0.01, 1000000000000);
    var retrainingCost = number(input.retrainingCost, 'retrainingCost', 0, 1000000000000);
    var retrainingMonths = number(input.retrainingMonths, 'retrainingMonths', 0, 48, true);
    var searchMonths = number(input.searchMonths, 'searchMonths', 0, 18, true);
    var partTime = number(input.partTimeIncome, 'partTimeIncome', 0, 1);
    var growth = number(input.growthRate, 'growthRate', 0, 50) / 100;
    number(input.satisfaction, 'satisfaction', 1, 10, true);
    var symbols = { NGN: '₦', KES: 'KES ', ZAR: 'R', GHS: 'GHS ', USD: '$' };
    if (!symbols[input.currency]) throw new Error('invalid:currency');
    var currentPackage = current + benefits;
    var foregoneIncome = currentPackage * retrainingMonths * (1 - partTime);
    var searchGap = currentPackage * searchMonths;
    var totalCost = retrainingCost + foregoneIncome + searchGap;
    var monthlyGain = nextSalary - currentPackage;
    var breakEven = monthlyGain > 0 ? Math.ceil(totalCost / monthlyGain) : null;
    var projectionRows = [], cumulativeCurrent = 0, cumulativeNew = -retrainingCost;
    for (var year = 1; year <= 5; year += 1) {
      for (var month = (year - 1) * 12; month < year * 12; month += 1) {
        cumulativeCurrent += currentPackage;
        if (month < retrainingMonths) cumulativeNew += currentPackage * partTime;
        else if (month >= retrainingMonths + searchMonths) {
          cumulativeNew += nextSalary * Math.pow(1 + growth / 12, month - retrainingMonths - searchMonths);
        }
      }
      projectionRows.push({
        year: year, current: cumulativeCurrent, newCareer: cumulativeNew,
        difference: cumulativeNew - cumulativeCurrent
      });
    }
    return {
      symbol: symbols[input.currency], currentPackage: currentPackage,
      foregoneIncome: foregoneIncome, searchGap: searchGap, totalCost: totalCost,
      monthlyGain: monthlyGain, breakEven: breakEven, projectionRows: projectionRows
    };
  }

  function projectSavings(current, monthly, years, rate) {
    var monthlyRate = rate / 12;
    var months = years * 12;
    var future = current * Math.pow(1 + monthlyRate, months);
    return future + (monthlyRate > 0 ?
      monthly * (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate : monthly * months);
  }

  function retirement(input) {
    var age = number(input.age, 'age', 18, 65, true);
    var retirementAge = number(input.retirementAge, 'retirementAge', 40, 75, true);
    if (retirementAge <= age) throw Object.assign(new Error('invalid:retirementAge'), { field: 'retirementAge' });
    var savings = number(input.savings, 'savings', 0, 1000000000000000);
    var contribution = number(input.contribution, 'contribution', 0, 1000000000000);
    number(input.salary, 'salary', 0, 1000000000000);
    var pensionPayout = number(input.pensionPayout, 'pensionPayout', 0, 1000000000000);
    var expenses = number(input.expenses, 'expenses', 0.01, 1000000000000);
    if (!CURRENCY[input.country]) throw new Error('invalid:country');
    var years = retirementAge - age;
    var target = expenses * 12 * 25;
    var pessimistic = projectSavings(savings, contribution, years, 0);
    var projected = projectSavings(savings, contribution, years, 0.03);
    var optimistic = projectSavings(savings, contribution, years, 0.05);
    var score = Math.min(Math.round(projected / target * 100), 100);
    var gap = target - projected;
    var extraContribution = 0;
    if (gap > 0) {
      var rate = 0.03 / 12;
      var months = years * 12;
      extraContribution = gap / ((Math.pow(1 + rate, months) - 1) / rate);
    }
    var monthlyFromSavings = projected * 0.04 / 12;
    return {
      symbol: CURRENCY[input.country], countryName: COUNTRY_NAMES[input.country],
      years: years, target: target, pessimistic: pessimistic, projected: projected,
      optimistic: optimistic, score: score, extraContribution: extraContribution,
      monthlyFromSavings: monthlyFromSavings,
      monthlyIncome: monthlyFromSavings + pensionPayout,
      shortfall: monthlyFromSavings + pensionPayout - expenses
    };
  }

  function salaryNegotiation(input) {
    number(input.experience, 'experience', 0, 40, true);
    var benchmark = number(input.benchmark, 'benchmark', 1, 1000000000000);
    number(input.current, 'current', 0, 1000000000000);
    var offer = number(input.offer, 'offer', 0, 1000000000000);
    var symbols = { NG: '₦', KE: 'KES ', ZA: 'R', GH: 'GHS ', EG: 'EGP ', ET: 'ETB ', RW: 'RWF ', CI: 'XOF ', SN: 'XOF ' };
    if (!symbols[input.country]) throw new Error('invalid:country');
    var median = Math.round(benchmark);
    var comparison = 'not-entered';
    if (offer > 0) {
      var ratio = offer / median;
      comparison = ratio < 0.9 ? 'below-lower' : ratio < 0.98 ? 'below-midpoint' :
        ratio <= 1.02 ? 'near-midpoint' : ratio <= 1.1 ? 'above-midpoint' : 'above-upper';
    }
    return {
      symbol: symbols[input.country], lower: Math.round(median * 0.9), median: median,
      upper: Math.round(median * 1.1), counter: Math.round(median * 1.05),
      comparison: comparison
    };
  }

  return {
    constants: { LEVEL_NAMES: LEVEL_NAMES, COUNTRY_NAMES: COUNTRY_NAMES },
    careerGrowth: careerGrowth,
    careerSwitch: careerSwitch,
    retirement: retirement,
    salaryNegotiation: salaryNegotiation
  };
}));
