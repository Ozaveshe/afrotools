(function (root) {
  "use strict";

  var kePayroll = root.AfroTools && root.AfroTools.payroll && root.AfroTools.payroll.ke;

  if (!kePayroll) {
    return;
  }

  var engine = {
    LEL: kePayroll.NSSF_LOWER_LIMIT,
    UEL: kePayroll.NSSF_UPPER_LIMIT,
    RATE: kePayroll.NSSF_RATE,
    OLD_FLAT: kePayroll.LEGACY_NSSF_FLAT,
    SHIF_RATE: kePayroll.SHIF_RATE,
    SHIF_MIN: kePayroll.SHIF_MINIMUM,
    AHL_RATE: kePayroll.AHL_RATE,

    calculateNSSF: function (gross, regime) {
      return kePayroll.calculateNssf(gross, regime || "new");
    },

    calculateSHIF: function (gross) {
      return kePayroll.calculateShif(gross);
    },

    calculateAHL: function (gross) {
      return kePayroll.calculateAhl(gross);
    },

    getAllDeductions: function (gross, regime) {
      var burden = kePayroll.calculateStatutoryBurden(gross, regime || "new");

      return {
        nssf: burden.nssf,
        employee: {
          nssf: burden.employee.nssf,
          shif: burden.employee.shif,
          ahl: burden.employee.ahl,
          total: burden.employee.total,
          pctOfGross: burden.gross > 0 ? burden.employee.total / burden.gross * 100 : 0
        },
        employer: {
          nssf: burden.employer.nssf,
          shif: burden.employer.shif,
          ahl: burden.employer.ahl,
          total: burden.employer.total,
          pctOfGross: burden.gross > 0 ? burden.employer.total / burden.gross * 100 : 0
        }
      };
    },

    compareActs: function (gross) {
      var current = kePayroll.calculateNssf(gross, "new");
      var legacy = kePayroll.calculateNssf(gross, "old");
      var monthlyDifference = current.totalEmployee - legacy.totalEmployee;

      return {
        oldActEmployee: legacy.totalEmployee,
        newActEmployee: current.totalEmployee,
        monthlyDifference: monthlyDifference,
        annualDifference: monthlyDifference * 12,
        multiplier: legacy.totalEmployee > 0 ? current.totalEmployee / legacy.totalEmployee : 0
      };
    },

    projectRetirement: function (monthlyContribution, years, annualReturnPercent) {
      var monthlyRate = (annualReturnPercent || 0) / 12;
      var months = 12 * years;

      return monthlyRate > 0 && months > 0
        ? monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
        : monthlyContribution * months;
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = engine;
  } else {
    root.KE_NSSF = engine;
  }
}(typeof globalThis !== "undefined" ? globalThis : this));
