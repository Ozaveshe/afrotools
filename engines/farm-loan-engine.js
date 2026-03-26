// ─────────────────────────────────────────────────────────────────────────────
// AfroTools — Farm Loan Eligibility Engine
// Tool 26: Farm Loan Eligibility Calculator
// Pure calculation and eligibility logic — no DOM manipulation
// ─────────────────────────────────────────────────────────────────────────────
!function () {
  'use strict';
  window.AfroTools = window.AfroTools || {};

  // ─── Formatting ─────────────────────────────────────────────────────────────
  function fmt(n, symbol) {
    if (n == null || isNaN(n)) return symbol + '0';
    var abs = Math.abs(n);
    var str;
    if (abs >= 1000000000) {
      str = (n / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    } else if (abs >= 1000000) {
      str = (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (abs >= 1000) {
      str = Math.round(n).toLocaleString();
    } else {
      str = n.toFixed(2);
    }
    return symbol + str;
  }

  function fmtFull(n, symbol) {
    if (n == null || isNaN(n)) return symbol + '0';
    return symbol + Math.round(n).toLocaleString();
  }

  function rateDisplay(rate) {
    if (rate == null) return 'N/A';
    if (typeof rate === 'object') return rate.min + '% – ' + rate.max + '% p.a.';
    return rate + '% p.a.';
  }

  function rateNum(rate) {
    // Returns a single number for PMT calculation
    if (rate == null) return 0;
    if (typeof rate === 'object') return (rate.min + rate.max) / 2;
    return rate;
  }

  // ─── Monthly PMT formula ──────────────────────────────────────────────────
  // P × r × (1+r)^n / ((1+r)^n − 1)
  function calcRepayment(principal, annualRate_pct, tenorMonths) {
    if (principal <= 0 || tenorMonths <= 0) {
      return { monthly: 0, totalInterest: 0, totalCost: 0, totalPayable: 0 };
    }
    var r = annualRate_pct / 100 / 12;
    var n = tenorMonths;
    var monthly;
    if (r === 0) {
      monthly = principal / n;
    } else {
      var factor = Math.pow(1 + r, n);
      monthly = principal * r * factor / (factor - 1);
    }
    var totalCost = monthly * n;
    var totalInterest = totalCost - principal;
    return {
      monthly: monthly,
      totalInterest: totalInterest,
      totalCost: totalCost,
      totalPayable: totalCost
    };
  }

  // ─── Eligibility Check ────────────────────────────────────────────────────
  // profile: { age, farmSize_ha, experience_years, isCoop, hasCollateral, hasBankAccount, requestedAmount }
  // program: from AgriLoansData
  function checkEligibility(profile, program) {
    var e = program.eligibility;
    var blockers = [];
    var warnings = [];

    if (!e) {
      return { eligible: true, blockers: [], warnings: [] };
    }

    // Age checks
    if (e.minAge && profile.age < e.minAge) {
      blockers.push('Minimum age: ' + e.minAge + ' years (you are ' + profile.age + ')');
    }
    if (e.maxAge && profile.age > e.maxAge) {
      blockers.push('Maximum age: ' + e.maxAge + ' years (you are ' + profile.age + ')');
    }

    // Cooperative membership
    if (e.cooperative_required === true && !profile.isCoop) {
      blockers.push('Must be a cooperative or farmer group member');
    }
    if (e.cooperative_required === 'Recommended' && !profile.isCoop) {
      warnings.push('Joining a cooperative improves your chances');
    }

    // Bank account
    if (e.bankAccount_required && !profile.hasBankAccount) {
      blockers.push('Requires a bank account');
    }

    // Collateral
    if (e.collateral_required && !profile.hasCollateral) {
      blockers.push('Requires collateral (land title, property, or equipment)');
    }

    // Farm size
    if (e.farmSize_min_ha && profile.farmSize_ha < e.farmSize_min_ha) {
      blockers.push('Minimum farm size: ' + e.farmSize_min_ha + ' ha (your farm: ' + profile.farmSize_ha + ' ha)');
    }
    if (e.farmSize_max_ha && profile.farmSize_ha > e.farmSize_max_ha) {
      blockers.push('Maximum farm size: ' + e.farmSize_max_ha + ' ha — designed for smallholders only');
    }

    // Training required
    if (e.training_required) {
      warnings.push('Mandatory entrepreneurship training required before application');
    }

    // Amount check against max
    if (program.maxAmount && profile.requestedAmount > program.maxAmount) {
      blockers.push('Your requested amount exceeds the maximum (' + program.maxAmount.toLocaleString() + ')');
    }
    if (program.minAmount && profile.requestedAmount > 0 && profile.requestedAmount < program.minAmount) {
      blockers.push('Minimum loan: ' + program.minAmount.toLocaleString() + ' (you requested less)');
    }

    return {
      eligible: blockers.length === 0,
      blockers: blockers,
      warnings: warnings
    };
  }

  // ─── Evaluate All Programs ─────────────────────────────────────────────────
  function evaluatePrograms(profile, countryData) {
    var results = [];
    (countryData.programs || []).forEach(function (prog) {
      var check = checkEligibility(profile, prog);
      var rate = rateNum(prog.interestRate_pct);
      var repayment = null;
      if (check.eligible && profile.requestedAmount > 0 && profile.tenorMonths > 0 && rate > 0) {
        var loanAmt = profile.requestedAmount;
        if (prog.maxAmount && loanAmt > prog.maxAmount) loanAmt = prog.maxAmount;
        repayment = calcRepayment(loanAmt, rate, profile.tenorMonths);
        repayment.loanUsed = loanAmt;
      }
      results.push({
        program: prog,
        eligible: check.eligible,
        blockers: check.blockers,
        warnings: check.warnings,
        repayment: repayment,
        rate: rate
      });
    });
    // Sort: eligible first, then by interest rate ascending
    results.sort(function (a, b) {
      if (a.eligible && !b.eligible) return -1;
      if (!a.eligible && b.eligible) return 1;
      if (a.eligible && b.eligible) return a.rate - b.rate;
      return 0;
    });
    return results;
  }

  // ─── Public API ───────────────────────────────────────────────────────────
  window.AfroTools.FarmLoanEngine = {
    checkEligibility: checkEligibility,
    calcRepayment: calcRepayment,
    evaluatePrograms: evaluatePrograms,
    rateDisplay: rateDisplay,
    rateNum: rateNum,
    fmt: fmt,
    fmtFull: fmtFull
  };

}();
