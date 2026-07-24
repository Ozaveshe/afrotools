(function (root) {
  'use strict';

  var RULES = Object.freeze({
    scheme: 'Ghana SSNIT / three-tier pension scheme (2026)',
    effectiveFrom: '2026-01-01',
    verifiedThrough: '2026-07-23',
    minimumInsurableMonthly: 587.80,
    maximumInsurableMonthly: 69000,
    employeeRate: 0.055,
    employerRate: 0.13,
    tier1Rate: 0.135,
    tier2Rate: 0.05,
    minimumPensionMonths: 180,
    maximumPensionMonths: 420,
    basePensionRight: 0.375,
    additionalMonthlyPensionRight: 0.0009375,
    maximumPensionRight: 0.60,
    source: 'SSNIT 2026 insurable-earnings notice, SSNIT employer guidance and old-age benefit guidance; National Pensions Act 2008 (Act 766)'
  });

  function number(value) {
    if (value === '' || value === null || typeof value === 'undefined') return NaN;
    return Number(value);
  }

  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function dateSupported(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      value >= RULES.effectiveFrom &&
      value <= RULES.verifiedThrough;
  }

  function pensionRight(months) {
    if (!Number.isInteger(months) || months < RULES.minimumPensionMonths) return 0;
    return Math.min(
      RULES.maximumPensionRight,
      RULES.basePensionRight +
        (months - RULES.minimumPensionMonths) * RULES.additionalMonthlyPensionRight
    );
  }

  function calculate(input) {
    input = input || {};
    var basicSalary = number(input.basicSalary);
    var employeeCount = number(input.employeeCount);
    var averageBest36Monthly = number(input.averageBest36Monthly);
    var contributionMonths = number(input.contributionMonths);
    var retirementAge = number(input.retirementAge);
    var contributionDate = String(input.contributionDate || '');

    if (!dateSupported(contributionDate)) return { ok: false, error: 'unsupported_date' };
    if (!Number.isFinite(basicSalary) || basicSalary <= 0) return { ok: false, error: 'invalid_salary' };
    if (!Number.isInteger(employeeCount) || employeeCount < 1 || employeeCount > 10000) {
      return { ok: false, error: 'invalid_employee_count' };
    }
    if (!Number.isFinite(averageBest36Monthly) || averageBest36Monthly < 0) {
      return { ok: false, error: 'invalid_average_salary' };
    }
    if (!Number.isInteger(contributionMonths) || contributionMonths < 0 || contributionMonths > 720) {
      return { ok: false, error: 'invalid_months' };
    }
    if (!Number.isInteger(retirementAge) || retirementAge < 55 || retirementAge > 60) {
      return { ok: false, error: 'invalid_age' };
    }

    var insurableSalary = Math.min(
      RULES.maximumInsurableMonthly,
      Math.max(RULES.minimumInsurableMonthly, basicSalary)
    );
    var perWorker = {
      employeeDeduction: roundMoney(insurableSalary * RULES.employeeRate),
      employerContribution: roundMoney(insurableSalary * RULES.employerRate),
      tier1Remittance: roundMoney(insurableSalary * RULES.tier1Rate),
      tier2Remittance: roundMoney(insurableSalary * RULES.tier2Rate)
    };
    perWorker.totalContribution = roundMoney(
      perWorker.employeeDeduction + perWorker.employerContribution
    );

    var right = pensionRight(contributionMonths);
    var qualifiesForOldAgePension =
      contributionMonths >= RULES.minimumPensionMonths && retirementAge >= 55;
    var baseMonthlyPension = qualifiesForOldAgePension && averageBest36Monthly > 0
      ? roundMoney(averageBest36Monthly * right)
      : null;
    var fullMonthlyPension = retirementAge === 60 ? baseMonthlyPension : null;
    var benefitStatus;
    if (contributionMonths < RULES.minimumPensionMonths) {
      benefitStatus = 'below_minimum_months';
    } else if (averageBest36Monthly <= 0) {
      benefitStatus = 'missing_best_36_average';
    } else if (retirementAge < 60) {
      benefitStatus = 'early_reduction_required';
    } else {
      benefitStatus = 'full_pension_estimate';
    }

    return {
      ok: true,
      scheme: RULES.scheme,
      contributionDate: contributionDate,
      basicSalary: basicSalary,
      employeeCount: employeeCount,
      insurableSalary: insurableSalary,
      salaryAdjustment: basicSalary < RULES.minimumInsurableMonthly
        ? 'minimum_applied'
        : basicSalary > RULES.maximumInsurableMonthly
          ? 'maximum_applied'
          : 'none',
      perWorker: perWorker,
      payroll: {
        employeeDeduction: roundMoney(perWorker.employeeDeduction * employeeCount),
        employerContribution: roundMoney(perWorker.employerContribution * employeeCount),
        totalContribution: roundMoney(perWorker.totalContribution * employeeCount),
        tier1Remittance: roundMoney(perWorker.tier1Remittance * employeeCount),
        tier2Remittance: roundMoney(perWorker.tier2Remittance * employeeCount)
      },
      benefit: {
        contributionMonths: contributionMonths,
        retirementAge: retirementAge,
        averageBest36Monthly: averageBest36Monthly,
        qualifiesForOldAgePension: qualifiesForOldAgePension,
        pensionRight: right,
        baseBeforeEarlyReduction: baseMonthlyPension,
        estimatedMonthlyPension: fullMonthlyPension,
        status: benefitStatus
      },
      boundary: 'Contribution estimate only for the verified 2026 period. A pension amount is shown only for age 60 with at least 180 contribution months and a user-supplied best-36-month average. SSNIT must confirm earnings history, contribution credits, early-retirement factors, survivor or invalidity benefits, Tier 2 value, arrears, interest and eligibility.'
    };
  }

  var api = {
    RULES: RULES,
    pensionRight: pensionRight,
    calculate: calculate
  };
  var legacyContributionApi = {
    RATES: {
      tier1Employee: RULES.employeeRate,
      tier1Employer: 0.08,
      nhia: 0.025,
      tier2: RULES.tier2Rate
    },
    MAX_INSURABLE_EARNINGS: RULES.maximumInsurableMonthly,
    calcContributions: function (basicSalary) {
      var salary = Math.min(
        RULES.maximumInsurableMonthly,
        Math.max(0, Number(basicSalary) || 0)
      );
      var employee = roundMoney(salary * RULES.employeeRate);
      var employerTier1 = roundMoney(salary * 0.08);
      // Compatibility field: `nhia` is a 2.5% sub-allocation within the
      // 13.5% Tier 1 remittance. It is not an additional contribution.
      var nhiaAllocation = roundMoney(salary * 0.025);
      var tier2 = roundMoney(salary * RULES.tier2Rate);
      var tier1Total = roundMoney(employee + employerTier1);
      var ssnitRetained = roundMoney(tier1Total - nhiaAllocation);
      return {
        t1Emp: employee,
        t1Er: employerTier1,
        nhia: nhiaAllocation,
        nhiaAllocation: nhiaAllocation,
        nhiaIncludedInTier1: true,
        ssnitRetained: ssnitRetained,
        t1Total: tier1Total,
        tier2: tier2,
        tier3: 0,
        totalEmployee: employee,
        totalEmployer: roundMoney(employerTier1 + tier2),
        grandTotal: roundMoney(tier1Total + tier2),
        allocationNote: 'NHIA is included within Tier 1 and must not be added to grandTotal.'
      };
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.GH_SSNIT = api;
  root.SSNITEngine = legacyContributionApi;
})(typeof window !== 'undefined' ? window : globalThis);
