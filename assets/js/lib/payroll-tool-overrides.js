(function (window) {
  "use strict";

  var kePayroll = window.AfroTools && window.AfroTools.payroll && window.AfroTools.payroll.ke;
  var GH_MAX_PENSIONABLE_SALARY = 69000;
  var ZA_UIF_MONTHLY_CEILING = 17712;
  var ZA_UIF_MONTHLY_MAX = 177.12;

  function sumPayslipGross(input) {
    return (+input.basic || 0)
      + (+input.housing || 0)
      + (+input.transport || 0)
      + (+input.other || 0)
      + (+input.overtime || 0)
      + (+input.bonus || 0);
  }

  function progressiveTax(amount, bands) {
    var remaining = Math.max(0, amount);
    var tax = 0;
    var idx;

    for (idx = 0; idx < bands.length && remaining > 0; idx += 1) {
      var width = bands[idx][0];
      var rate = bands[idx][1];
      var taxable = Math.min(remaining, width);
      tax += taxable * rate;
      remaining -= taxable;
    }

    return tax;
  }

  function calculateSouthAfricaPAYE2027(monthlyTaxable) {
    var annualTaxable = Math.max(0, monthlyTaxable) * 12;
    var annualTax = progressiveTax(annualTaxable, [
      [245100, 0.18],
      [138000, 0.26],
      [147100, 0.31],
      [165600, 0.36],
      [191200, 0.39],
      [991600, 0.41],
      [Infinity, 0.45]
    ]);

    return Math.max(0, annualTax - 17820) / 12;
  }

  function calculateGhanaPAYE(monthlyTaxable) {
    return progressiveTax(Math.max(0, monthlyTaxable), [
      [490, 0],
      [110, 0.05],
      [130, 0.10],
      [3000, 0.175],
      [16270, 0.25],
      [30000, 0.30],
      [Infinity, 0.35]
    ]);
  }

  function formatPayslipResult(input, symbol, currency, deductions) {
    var gross = sumPayslipGross(input);
    var totalDeductions = deductions.reduce(function (sum, item) {
      return sum + item.amount;
    }, 0);
    var earnings = [
      { name: "Basic Salary", amount: +input.basic || 0 },
      { name: "Housing Allowance", amount: +input.housing || 0 },
      { name: "Transport Allowance", amount: +input.transport || 0 }
    ];

    if ((+input.other || 0) > 0) {
      earnings.push({ name: "Other Allowances", amount: +input.other || 0 });
    }
    if ((+input.overtime || 0) > 0) {
      earnings.push({ name: "Overtime", amount: +input.overtime || 0 });
    }
    if ((+input.bonus || 0) > 0) {
      earnings.push({ name: "Bonus", amount: +input.bonus || 0 });
    }

    return {
      country: input.country,
      currency: currency,
      symbol: symbol,
      fmt: function (value) {
        return symbol + " " + Math.round(value).toLocaleString("en-US");
      },
      company: input.company || "",
      address: input.address || "",
      empName: input.empName || "",
      empId: input.empId || "",
      period: input.period || "",
      dept: input.dept || "",
      jobTitle: input.jobTitle || "",
      taxId: input.taxId || "",
      earnings: earnings.filter(function (item) { return item.amount > 0; }),
      deductions: deductions,
      gross: gross,
      totalDeductions: totalDeductions,
      net: gross - totalDeductions,
      fxEnabled: input.fxEnabled || false,
      fxBase: input.fxBase || "USD",
      fxRate: +input.fxRate || 1,
      leaveEnabled: input.leaveEnabled || false,
      leaveDays: input.leaveDays || 0,
      style: input.style || "corporate"
    };
  }

  if (!kePayroll) {
    return;
  }

  function overridePayslipEngine() {
    var payslipEngine = window.AfroTools && window.AfroTools.PayslipEngine;

    if (!payslipEngine || !payslipEngine.TAX || !payslipEngine.TAX.KE) {
      return;
    }

    var originalCalculate = payslipEngine.calculate;

    payslipEngine.TAX.KE.calcPAYE = function (gross) {
      return kePayroll.calculateMonthlyPayroll(gross, {
        nssf: true,
        shif: true,
        ahl: true,
        personalRelief: true
      }).paye;
    };

    payslipEngine.TAX.KE.deductions = function (gross) {
      var result = kePayroll.calculateMonthlyPayroll(gross, {
        nssf: true,
        shif: true,
        ahl: true,
        personalRelief: true
      });

      return [
        { name: "PAYE Tax", amount: result.paye, type: "tax" },
        { name: "NSSF (6%)", amount: result.nssf, type: "pension" },
        { name: "SHIF (2.75%)", amount: result.shif, type: "health" },
        { name: "AHL (1.5%)", amount: result.ahl, type: "other" }
      ];
    };

    payslipEngine.calculate = function (input) {
      if (input.country === "GH") {
        var basicSalary = Math.min(+input.basic || 0, GH_MAX_PENSIONABLE_SALARY);
        var grossSalary = sumPayslipGross(input);
        var ssnit = basicSalary * 0.055;
        var paye = calculateGhanaPAYE(grossSalary - ssnit);

        return formatPayslipResult(input, "GH₵", "GHS", [
          { name: "PAYE Tax", amount: paye, type: "tax" },
          { name: "SSNIT Tier 1 (5.5% of basic)", amount: ssnit, type: "pension" }
        ]);
      }

      if (input.country === "ZA") {
        var zaGross = sumPayslipGross(input);
        var uif = Math.min(zaGross * 0.01, ZA_UIF_MONTHLY_MAX);
        var zaPaye = calculateSouthAfricaPAYE2027(zaGross);

        return formatPayslipResult(input, "R", "ZAR", [
          { name: "PAYE Tax", amount: zaPaye, type: "tax" },
          { name: "UIF (1%)", amount: uif, type: "other" }
        ]);
      }

      return originalCalculate.apply(this, arguments);
    };
  }

  function overrideStaffCostEngine() {
    var staffCostEngine = window.StaffCostEngine;

    if (!staffCostEngine) {
      return;
    }

    var originalCalcCustom = staffCostEngine.calcCustom;
    var originalCalcEmployerBurden = staffCostEngine.calcEmployerBurden;
    var originalGetSidebar = staffCostEngine.getSidebar;

    staffCostEngine.calcCustom = function (country, gross, basic, housing, transport) {
      if (country !== "KE") {
        if (country === "GH") {
          var ghPensionableSalary = Math.min(+basic || 0, GH_MAX_PENSIONABLE_SALARY);
          var ghEmployeeSSNIT = ghPensionableSalary * 0.055;
          var ghEmployerFirstTier = ghPensionableSalary * 0.08;
          var ghEmployerTier2 = ghPensionableSalary * 0.05;
          var ghEmployerTotal = ghEmployerFirstTier + ghEmployerTier2;
          var ghPaye = calculateGhanaPAYE(Math.max(0, gross - ghEmployeeSSNIT));

          return {
            rows: [
              { item: "Gross Salary", amount: gross, type: "base" },
              { item: "SSNIT First Tier Employer (8%)", amount: ghEmployerFirstTier, type: "employer" },
              { item: "Tier 2 Occupational Pension (5%)", amount: ghEmployerTier2, type: "employer" },
              { item: "SSNIT Employee (5.5% of basic)", amount: ghEmployeeSSNIT, type: "employee" },
              { item: "PAYE Tax", amount: ghPaye, type: "employee" }
            ],
            employerCosts: ghEmployerTotal,
            employeeDeductions: ghEmployeeSSNIT + ghPaye
          };
        }

        if (country === "ZA") {
          var zaEmployerUIF = Math.min(gross * 0.01, ZA_UIF_MONTHLY_MAX);
          var zaEmployerSDL = gross * 0.01;
          var zaEmployeeUIF = Math.min(gross * 0.01, ZA_UIF_MONTHLY_MAX);
          var zaEmployeePAYE = calculateSouthAfricaPAYE2027(gross);

          return {
            rows: [
              { item: "Gross Salary", amount: gross, type: "base" },
              { item: "UIF Employer (1%)", amount: zaEmployerUIF, type: "employer" },
              { item: "SDL (1%)", amount: zaEmployerSDL, type: "employer" },
              { item: "UIF Employee (1%)", amount: zaEmployeeUIF, type: "employee" },
              { item: "PAYE Tax", amount: zaEmployeePAYE, type: "employee" }
            ],
            employerCosts: zaEmployerUIF + zaEmployerSDL,
            employeeDeductions: zaEmployeeUIF + zaEmployeePAYE
          };
        }

        return originalCalcCustom.apply(this, arguments);
      }

      var result = kePayroll.calculateMonthlyPayroll(gross, {
        nssf: true,
        shif: true,
        ahl: true,
        personalRelief: true
      });

      return {
        rows: [
          { item: "Gross Salary", amount: gross, type: "base" },
          { item: "NSSF Employer (6%, max 6,480)", amount: result.employerNSSF, type: "employer" },
          { item: "Housing Levy Employer (1.5%)", amount: result.employerAHL, type: "employer" },
          { item: "NSSF Employee (6%, max 6,480)", amount: result.nssf, type: "employee" },
          { item: "SHIF (2.75%)", amount: result.shif, type: "employee" },
          { item: "Housing Levy Employee (1.5%)", amount: result.ahl, type: "employee" },
          { item: "PAYE Tax", amount: result.paye, type: "employee" }
        ],
        employerCosts: result.employerNSSF + result.employerAHL,
        employeeDeductions: result.nssf + result.shif + result.ahl + result.paye
      };
    };

    staffCostEngine.calcEmployerBurden = function (country, gross) {
      if (country !== "KE") {
        if (country === "GH") {
          var ghBurdenBase = Math.min(gross, GH_MAX_PENSIONABLE_SALARY);
          var ghEmployerBurden = ghBurdenBase * 0.13;

          return {
            er: ghEmployerBurden,
            total: gross + ghEmployerBurden
          };
        }

        if (country === "ZA") {
          var zaBurden = Math.min(gross * 0.01, ZA_UIF_MONTHLY_MAX) + (gross * 0.01);

          return {
            er: zaBurden,
            total: gross + zaBurden
          };
        }

        return originalCalcEmployerBurden.apply(this, arguments);
      }

      var result = kePayroll.calculateMonthlyPayroll(gross, {
        nssf: true,
        shif: true,
        ahl: true,
        personalRelief: true
      });
      var employerCost = result.employerNSSF + result.employerAHL;

      return {
        er: employerCost,
        total: gross + employerCost
      };
    };

    staffCostEngine.getSidebar = function (country) {
      if (country !== "KE") {
        if (country === "GH") {
          return '<p><strong>SSNIT First Tier:</strong> 13.5% remitted on pensionable basic salary, made up of 5.5% employee + 8% employer</p>'
            + '<p><strong>NHIA:</strong> 2.5% is carved out of the 13.5% first-tier remittance by SSNIT, not added on top</p>'
            + '<p><strong>Tier 2 Pension:</strong> 5% of pensionable basic salary (employer-funded)</p>'
            + '<p><strong>Contribution Ceiling:</strong> GHS 69,000/month from January 1, 2026</p>'
            + '<p><strong>PAYE:</strong> 0%-35% progressive after employee SSNIT deduction</p>'
            + '<p class="sc-info-note">Employer mandatory pension cost is 13% of capped basic salary, not 15.5%.</p>';
        }

        if (country === "ZA") {
          return '<p><strong>UIF (Employer):</strong> 1% capped at R17,712/month</p>'
            + '<p><strong>UIF (Employee):</strong> 1% capped at R17,712/month</p>'
            + '<p><strong>SDL:</strong> 1% of payroll (employer only)</p>'
            + '<p><strong>PAYE:</strong> 2027 tax year brackets from 18% to 45%</p>'
            + '<p><strong>Primary Rebate:</strong> R17,820/year from March 1, 2026</p>'
            + '<p class="sc-info-note">The 2027 South African tax year started on March 1, 2026, with new brackets and rebates published by SARS.</p>';
        }

        return originalGetSidebar.apply(this, arguments);
      }

      return '<p><strong>NSSF (Year 4, Feb 2026):</strong> 6% each, Tier I cap KES 9,000, Tier II cap KES 108,000</p>'
        + '<p><strong>SHIF:</strong> 2.75% of gross (employee only, minimum KES 300)</p>'
        + '<p><strong>Housing Levy:</strong> 1.5% each (employer + employee)</p>'
        + '<p><strong>PAYE:</strong> 10%-35% progressive (5 bands)</p>'
        + '<p><strong>Personal Relief:</strong> KES 2,400/month</p>'
        + '<p class="sc-info-note">Year 4 NSSF rates took effect on February 1, 2026. NSSF, SHIF, and AHL reduce chargeable pay for PAYE.</p>';
    };
  }

  overridePayslipEngine();
  overrideStaffCostEngine();
}(window));
