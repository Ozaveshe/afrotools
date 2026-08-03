(function initialiseFarmLoanEngine(root) {
  'use strict';

  function rateNum(value) {
    if (value == null) return 0;
    if (typeof value === 'object') return (Number(value.min) + Number(value.max)) / 2;
    return Number(value) || 0;
  }

  function rateAssumption(value) {
    if (value == null) return null;
    if (typeof value === 'object') {
      var min = Number(value.min);
      var max = Number(value.max);
      return {
        method: 'midpoint-of-published-range',
        min: min,
        max: max,
        used: (min + max) / 2,
        disclosure: 'Repayment uses the midpoint of the stored annual rate range.'
      };
    }
    return {
      method: 'stored-single-rate',
      min: Number(value),
      max: Number(value),
      used: Number(value),
      disclosure: 'Repayment uses the stored single annual planning rate.'
    };
  }

  function calcRepayment(principal, annualRatePercent, months) {
    if (principal <= 0 || months <= 0) {
      return { monthly: 0, totalInterest: 0, totalCost: 0, totalPayable: 0 };
    }
    var monthlyRate = annualRatePercent / 100 / 12;
    var monthly;
    if (monthlyRate === 0) {
      monthly = principal / months;
    } else {
      var compound = Math.pow(1 + monthlyRate, months);
      monthly = principal * monthlyRate * compound / (compound - 1);
    }
    var total = monthly * months;
    return {
      monthly: monthly,
      totalInterest: total - principal,
      totalCost: total,
      totalPayable: total
    };
  }

  function nonLoanBlocker(mode) {
    var messages = {
      'directory-only': 'Record is a regulated directory, not a verified direct loan product',
      'referral-only': 'Record is a referral or guarantee channel, not a direct loan product',
      'support-only': 'Record provides grants, incentives, or support rather than a direct loan',
      'input-credit': 'Record provides in-kind input credit or services rather than a cash loan',
      insurance: 'Record is agricultural insurance, not a loan product'
    };
    return messages[mode] || null;
  }

  function checkEligibility(profile, program) {
    var rules = program.eligibility || {};
    var blockers = [];
    var warnings = [];
    var roleBlocker = nonLoanBlocker(program.programMode);
    if (roleBlocker) blockers.push(roleBlocker);
    if (rules.minAge && profile.age < rules.minAge) blockers.push('Minimum age: ' + rules.minAge + ' years (you are ' + profile.age + ')');
    if (rules.maxAge && profile.age > rules.maxAge) blockers.push('Maximum age: ' + rules.maxAge + ' years (you are ' + profile.age + ')');
    if (rules.cooperative_required === true && !profile.isCoop) blockers.push('Must be a cooperative or farmer group member');
    if (rules.cooperative_required === 'Recommended' && !profile.isCoop) warnings.push('Joining a cooperative improves your chances');
    if (rules.bankAccount_required && !profile.hasBankAccount) blockers.push('Requires a bank account');
    if (rules.collateral_required && !profile.hasCollateral) blockers.push('Requires collateral (land title, property, or equipment)');
    if (rules.farmSize_min_ha && profile.farmSize_ha < rules.farmSize_min_ha) blockers.push('Minimum farm size: ' + rules.farmSize_min_ha + ' ha (your farm: ' + profile.farmSize_ha + ' ha)');
    if (rules.farmSize_max_ha && profile.farmSize_ha > rules.farmSize_max_ha) blockers.push('Maximum farm size: ' + rules.farmSize_max_ha + ' ha - designed for smallholders only');
    if (rules.training_required && profile.hasRequiredTraining !== true) blockers.push('Mandatory entrepreneurship training required before application');
    if (program.maxAmount && profile.requestedAmount > program.maxAmount) blockers.push('Your requested amount exceeds the maximum (' + program.maxAmount.toLocaleString() + ')');
    if (program.minAmount && profile.requestedAmount > 0 && profile.requestedAmount < program.minAmount) blockers.push('Minimum loan: ' + program.minAmount.toLocaleString() + ' (you requested less)');
    if (program.tenor_months && program.tenor_months.min > 0 && profile.tenorMonths < program.tenor_months.min) {
      blockers.push('Minimum tenor: ' + program.tenor_months.min + ' months (you selected ' + profile.tenorMonths + ')');
    }
    if (program.tenor_months && program.tenor_months.max > 0 && profile.tenorMonths > program.tenor_months.max) {
      blockers.push('Maximum tenor: ' + program.tenor_months.max + ' months (you selected ' + profile.tenorMonths + ')');
    }
    var hasEvidenceContract = Boolean(
      program.evidenceStatus || program.programMode || program.officialUrl
      || program.checkedDate || program.effectiveDate
    );
    if (hasEvidenceContract && (!program.officialUrl || !program.checkedDate || !program.effectiveDate)) {
      blockers.push('Record is missing dated official-source evidence');
    }
    return { eligible: blockers.length === 0, blockers: blockers, warnings: warnings };
  }

  function evaluatePrograms(profile, country) {
    var results = [];
    (country.programs || []).forEach(function (program) {
      var eligibility = checkEligibility(profile, program);
      var assumption = rateAssumption(program.interestRate_pct);
      var rate = assumption ? assumption.used : 0;
      var repayment = null;
      if (eligibility.eligible && profile.requestedAmount > 0 && profile.tenorMonths > 0 && rate > 0) {
        var principal = profile.requestedAmount;
        if (program.maxAmount && principal > program.maxAmount) principal = program.maxAmount;
        repayment = calcRepayment(principal, rate, profile.tenorMonths);
        repayment.loanUsed = principal;
      }
      results.push({
        program: program,
        eligible: eligibility.eligible,
        blockers: eligibility.blockers,
        warnings: eligibility.warnings,
        repayment: repayment,
        rate: rate,
        rateAssumption: assumption
      });
    });
    return results.sort(function (first, second) {
      if (first.eligible && !second.eligible) return -1;
      if (!first.eligible && second.eligible) return 1;
      if (first.eligible && second.eligible) return first.rate - second.rate;
      return 0;
    });
  }

  function rateDisplay(value) {
    if (value == null) return 'N/A';
    if (typeof value === 'object') return value.min + '% - ' + value.max + '% p.a.';
    return value + '% p.a.';
  }

  function fmt(value, symbol) {
    if (value == null || isNaN(value)) return symbol + '0';
    var absolute = Math.abs(value);
    if (absolute >= 1e9) return symbol + (value / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (absolute >= 1e6) return symbol + (value / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (absolute >= 1e3) return symbol + Math.round(value).toLocaleString();
    return symbol + value.toFixed(2);
  }

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.FarmLoanEngine = {
    checkEligibility: checkEligibility,
    calcRepayment: calcRepayment,
    evaluatePrograms: evaluatePrograms,
    rateDisplay: rateDisplay,
    rateNum: rateNum,
    rateAssumption: rateAssumption,
    fmt: fmt,
    fmtFull: function (value, symbol) {
      return value == null || isNaN(value) ? symbol + '0' : symbol + Math.round(value).toLocaleString();
    }
  };
})(window);
