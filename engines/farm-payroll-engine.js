/**
 * farm-payroll-engine.js
 * AfroTools Farm Worker Payroll Calculator Engine
 * Calculates farm worker wages, deductions, take-home pay, and employer costs
 */
!function () {
  'use strict';
  window.AfroTools = window.AfroTools || {};

  function fmt(n, sym) {
    if (!isFinite(n)) return sym + '0';
    return sym + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  function calculate(inputs, countryData) {
    // inputs:
    // {
    //   workerType: 'permanent' | 'casual' | 'seasonal' | 'piece_rate'
    //   grossPay: number (monthly if permanent, daily rate if casual/seasonal)
    //   daysWorked: number (for casual/seasonal)
    //   unitsCompleted: number (for piece_rate)
    //   ratePerUnit: number (for piece_rate)
    //   overtimeHours: number
    //   inKindHousing: number (monthly value)
    //   inKindFood: number (monthly value)
    //   numWorkers: number
    // }

    var CD = countryData;
    if (!CD) return { error: true, message: 'No country data' };

    var sym = CD.symbol || '';
    var numWorkers = Math.max(1, parseInt(inputs.numWorkers) || 1);

    // ─── GROSS PAY CALCULATION ───
    var baseGross = 0;
    if (inputs.workerType === 'permanent') {
      baseGross = parseFloat(inputs.grossPay) || 0;
    } else if (inputs.workerType === 'casual' || inputs.workerType === 'seasonal') {
      var dailyRate = parseFloat(inputs.grossPay) || 0;
      var days = parseFloat(inputs.daysWorked) || 26;
      baseGross = dailyRate * days;
    } else if (inputs.workerType === 'piece_rate') {
      var ratePerUnit = parseFloat(inputs.ratePerUnit) || 0;
      var units = parseFloat(inputs.unitsCompleted) || 0;
      baseGross = ratePerUnit * units;
    }

    // Overtime (hours beyond standard at overtimeRate multiplier)
    var overtimeHours = parseFloat(inputs.overtimeHours) || 0;
    var stdHourlyRate = baseGross / 173.33; // ~173 hrs/month
    var overtimePay = overtimeHours * stdHourlyRate * ((CD.laborLaw.overtimeRate || 1.5) - 1);

    // In-kind benefits (for tax/deduction purposes)
    var inKindValue = (parseFloat(inputs.inKindHousing) || 0) + (parseFloat(inputs.inKindFood) || 0);

    var grossForDeductions = baseGross + overtimePay + inKindValue;

    // ─── DEDUCTIONS ───
    var deductions = [];
    var totalDeductions = 0;

    var ded = CD.deductions || {};

    if (ded.pension && ded.pension.rate_pct) {
      var pensionAmt = grossForDeductions * ded.pension.rate_pct / 100;
      deductions.push({ name: ded.pension.name, rate: ded.pension.rate_pct, amount: pensionAmt, notes: ded.pension.notes });
      totalDeductions += pensionAmt;
    }
    if (ded.health && ded.health.rate_pct) {
      var healthAmt = grossForDeductions * ded.health.rate_pct / 100;
      deductions.push({ name: ded.health.name, rate: ded.health.rate_pct, amount: healthAmt, notes: ded.health.notes });
      totalDeductions += healthAmt;
    }
    if (ded.other && ded.other.rate_pct) {
      var otherAmt = grossForDeductions * ded.other.rate_pct / 100;
      deductions.push({ name: ded.other.name, rate: ded.other.rate_pct, amount: otherAmt, notes: ded.other.notes });
      totalDeductions += otherAmt;
    }

    // PAYE note (not calculated here — link to PAYE calculator)
    var estimatedPAYE = 0;
    // Most farm workers earn below tax threshold — flag if likely taxable
    var likelyTaxable = grossForDeductions > (CD.nationalMinWage_monthly || CD.agriMinWage_monthly || 0) * 2;

    var netPay = grossForDeductions - totalDeductions;

    // ─── EMPLOYER COST ───
    var employerContributions = [];
    var totalEmployerExtra = 0;
    if (ded.pension && ded.pension.employerRate_pct) {
      var empPension = grossForDeductions * ded.pension.employerRate_pct / 100;
      employerContributions.push({ name: 'Employer ' + ded.pension.name, amount: empPension });
      totalEmployerExtra += empPension;
    }
    if (ded.health && ded.health.employerRate_pct) {
      var empHealth = grossForDeductions * ded.health.employerRate_pct / 100;
      employerContributions.push({ name: 'Employer ' + ded.health.name, amount: empHealth });
      totalEmployerExtra += empHealth;
    }
    // Annual leave provision (accrual)
    var leaveDays = CD.laborLaw.annualLeave_days || 15;
    var dailyGross = grossForDeductions / 26;
    var leaveProvision = dailyGross * leaveDays / 12; // monthly accrual
    employerContributions.push({ name: 'Annual Leave Provision', amount: leaveProvision });
    totalEmployerExtra += leaveProvision;

    var totalEmployerCost = grossForDeductions + totalEmployerExtra;

    // ─── MINIMUM WAGE CHECK ───
    var minWage = CD.agriMinWage_monthly || CD.nationalMinWage_monthly;
    var minWageDaily = CD.agriMinWage_daily;
    var mwCheck = null;

    if (minWage && inputs.workerType === 'permanent') {
      var diff = grossForDeductions - minWage;
      mwCheck = {
        compliant: diff >= 0,
        minWage: minWage,
        gross: grossForDeductions,
        diff: Math.abs(diff),
        diffPct: Math.abs(diff / minWage * 100)
      };
    } else if (minWageDaily && (inputs.workerType === 'casual' || inputs.workerType === 'seasonal')) {
      var dailyUsed = parseFloat(inputs.grossPay) || 0;
      var dailyDiff = dailyUsed - minWageDaily;
      mwCheck = {
        compliant: dailyDiff >= 0,
        minWage: minWageDaily,
        gross: dailyUsed,
        diff: Math.abs(dailyDiff),
        diffPct: Math.abs(dailyDiff / minWageDaily * 100),
        isDaily: true
      };
    }

    // ─── FORMAT RESULTS ───
    return {
      sym: sym,
      currency: CD.currency,
      workerType: inputs.workerType,
      numWorkers: numWorkers,

      // Per worker
      baseGross: baseGross,
      overtimePay: overtimePay,
      inKindValue: inKindValue,
      grossForDeductions: grossForDeductions,
      deductions: deductions,
      totalDeductions: totalDeductions,
      netPay: netPay,

      // Employer
      employerContributions: employerContributions,
      totalEmployerExtra: totalEmployerExtra,
      totalEmployerCost: totalEmployerCost,

      // Farm total (multiple workers)
      farmMonthlyGross: grossForDeductions * numWorkers,
      farmMonthlyNet: netPay * numWorkers,
      farmMonthlyCost: totalEmployerCost * numWorkers,
      farmAnnualCost: totalEmployerCost * numWorkers * 12,

      // Minimum wage
      mwCheck: mwCheck,
      likelyTaxable: likelyTaxable,

      // Labor law summary
      laborLaw: CD.laborLaw,
      payeLink: CD.payeLink,
      payeCountryName: CD.payeCountryName,

      // Context
      typicalDailyRate: CD.typicalDailyRate,

      // Formatted strings for display
      fGross: fmt(grossForDeductions, sym),
      fNet: fmt(netPay, sym),
      fDeductions: fmt(totalDeductions, sym),
      fEmployerCost: fmt(totalEmployerCost, sym),
      fFarmMonthlyCost: fmt(totalEmployerCost * numWorkers, sym),
      fFarmAnnualCost: fmt(totalEmployerCost * numWorkers * 12, sym)
    };
  }

  window.AfroTools.FarmPayrollEngine = { calculate: calculate, fmt: fmt };
}();
