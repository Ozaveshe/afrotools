(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./who-growth-lms.js"));
  } else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ChildGrowthEngine = factory(root.AfroTools.WhoGrowthLms);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (data) {
  "use strict";

  var DAY_MS = 86400000;
  var SEX_CODES = { male: "1", female: "2" };
  var FLAG_LIMITS = { lhfa: 6, wfa: 6, bmifa: 5 };

  function fail(code, message) {
    var error = new Error(message);
    error.code = code;
    throw error;
  }

  function parseDate(value, field) {
    var match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) fail("DATE_REQUIRED", "Enter a valid " + field + " in YYYY-MM-DD format.");
    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    var stamp = Date.UTC(year, month - 1, day);
    var date = new Date(stamp);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      fail("DATE_INVALID", "Enter a real calendar date for " + field + ".");
    }
    return stamp;
  }

  function exactAgeDays(birthDate, measurementDate) {
    var birth = parseDate(birthDate, "date of birth");
    var measured = parseDate(measurementDate, "measurement date");
    var days = (measured - birth) / DAY_MS;
    if (!Number.isInteger(days) || days < 0) fail("AGE_ORDER", "Measurement date must be on or after the date of birth.");
    if (!data || days < data.minAgeDays || days > data.maxAgeDays) {
      fail("AGE_UNSUPPORTED", "This local WHO standard supports birth through 1,826 completed days only. No result was calculated.");
    }
    return days;
  }

  function positiveNumber(value, label) {
    var number = Number(value);
    if (!Number.isFinite(number) || number <= 0) fail("MEASUREMENT_INVALID", "Enter a positive " + label + ".");
    return number;
  }

  function weightKg(value, unit) {
    var number = positiveNumber(value, "weight");
    if (unit === "kg") return number;
    if (unit === "lb") return number * 0.45359237;
    fail("WEIGHT_UNIT_UNSUPPORTED", "Choose kilograms or pounds for weight.");
  }

  function lengthCm(value, unit) {
    var number = positiveNumber(value, "length or height");
    if (unit === "cm") return number;
    if (unit === "in") return number * 2.54;
    fail("LENGTH_UNIT_UNSUPPORTED", "Choose centimetres or inches for length or height.");
  }

  function expectedMethod(ageDays) {
    return ageDays < 731 ? "recumbent" : "standing";
  }

  function validateMethod(ageDays, method) {
    var expected = expectedMethod(ageDays);
    if (method !== expected) {
      fail(
        "METHOD_MISMATCH",
        expected === "recumbent"
          ? "For a child up to 730 completed days, enter recumbent length measured lying down. No automatic 0.7 cm correction was applied."
          : "From 731 completed days, enter standing height. No automatic 0.7 cm correction was applied."
      );
    }
    return expected;
  }

  function lms(indicator, sexCode, ageDays) {
    var table = data && data.tables && data.tables[indicator] && data.tables[indicator][sexCode];
    var row = table && table[ageDays];
    if (!row || row[0] !== ageDays || !row.slice(1).every(Number.isFinite)) {
      fail("TABLE_UNSUPPORTED", "The required sex-specific WHO table row is unavailable. No result was calculated.");
    }
    return { l: row[1], m: row[2], s: row[3] };
  }

  function rawZ(value, params) {
    if (Math.abs(params.l) < 1e-12) return Math.log(value / params.m) / params.s;
    return (Math.pow(value / params.m, params.l) - 1) / (params.s * params.l);
  }

  function sdValue(sd, params) {
    return params.m * Math.pow(1 + params.l * params.s * sd, 1 / params.l);
  }

  function adjustedZ(value, params) {
    var score = rawZ(value, params);
    if (score > 3) {
      var sd3pos = sdValue(3, params);
      var sd2pos = sdValue(2, params);
      score = 3 + (value - sd3pos) / (sd3pos - sd2pos);
    } else if (score < -3) {
      var sd3neg = sdValue(-3, params);
      var sd2neg = sdValue(-2, params);
      score = -3 + (value - sd3neg) / (sd2neg - sd3neg);
    }
    return score;
  }

  function erf(value) {
    var sign = value < 0 ? -1 : 1;
    var x = Math.abs(value);
    var t = 1 / (1 + 0.3275911 * x);
    var result = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return sign * result;
  }

  function percentile(score) {
    return 50 * (1 + erf(score / Math.sqrt(2)));
  }

  function percentileLabel(value) {
    if (value < 0.1) return "<0.1";
    if (value > 99.9) return ">99.9";
    return value.toFixed(1);
  }

  function referenceBand(score) {
    if (score < -3) return "below −3 reference line";
    if (score < -2) return "between −3 and −2 reference lines";
    if (score <= 2) return "between −2 and +2 reference lines";
    if (score <= 3) return "between +2 and +3 reference lines";
    return "above +3 reference line";
  }

  function indicator(name, value, params) {
    var score = adjustedZ(value, params);
    if (!Number.isFinite(score)) fail("CALCULATION_UNSUPPORTED", "The WHO calculation could not be completed.");
    if (Math.abs(score) > FLAG_LIMITS[name]) {
      fail("PLAUSIBILITY_REVIEW", "At least one value is outside the WHO plausibility boundary. Recheck the date, sex, units, method and measurement with a health professional; no z-scores were shown.");
    }
    var pct = percentile(score);
    return {
      indicator: name,
      zScore: Math.round(score * 100) / 100,
      percentile: pct,
      percentileLabel: percentileLabel(pct),
      referenceBand: referenceBand(score)
    };
  }

  function assess(input) {
    input = input || {};
    var sexCode = SEX_CODES[input.sex];
    if (!sexCode) fail("SEX_UNSUPPORTED", "Choose the sex used by the WHO table: male or female.");
    var ageDays = exactAgeDays(input.birthDate, input.measurementDate);
    var method = validateMethod(ageDays, input.method);
    var kg = weightKg(input.weight, input.weightUnit);
    var cm = lengthCm(input.length, input.lengthUnit);
    var bmi = kg / Math.pow(cm / 100, 2);
    var result = {
      standard: data.standard,
      sexTable: input.sex,
      ageDays: ageDays,
      ageApproxMonths: Math.round(ageDays / 30.4375 * 10) / 10,
      method: method,
      measurements: {
        weightKg: Math.round(kg * 1000) / 1000,
        lengthCm: Math.round(cm * 100) / 100,
        bmi: Math.round(bmi * 100) / 100
      },
      indicators: {
        lengthHeightForAge: indicator("lhfa", cm, lms("lhfa", sexCode, ageDays)),
        weightForAge: indicator("wfa", kg, lms("wfa", sexCode, ageDays)),
        bmiForAge: indicator("bmifa", bmi, lms("bmifa", sexCode, ageDays))
      },
      boundary: "A z-score or percentile is a screening reference from one measurement, not a diagnosis or proof of normal growth or development."
    };
    return result;
  }

  function snapshot(result) {
    if (!result || !result.indicators) return null;
    return {
      title: "WHO child-growth screening reference",
      ageDays: result.ageDays,
      sexTable: result.sexTable,
      method: result.method,
      measurements: result.measurements,
      indicators: result.indicators,
      note: result.boundary
    };
  }

  return {
    exactAgeDays: exactAgeDays,
    expectedMethod: expectedMethod,
    adjustedZ: adjustedZ,
    percentile: percentile,
    assess: assess,
    snapshot: snapshot
  };
});
