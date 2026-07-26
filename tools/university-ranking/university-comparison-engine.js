(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.universityComparisonEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function optionalMoney(value, label) {
    if (value === "" || value === null || value === undefined) return { value: null };
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1000000000) {
      return { error: `${label} must be a finite amount from 0 to 1,000,000,000.` };
    }
    return { value: parsed };
  }

  function validUrl(value) {
    if (!value) return false;
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch (_error) {
      return false;
    }
  }

  function daysUntil(dateText, todayText) {
    if (!dateText) return null;
    const date = Date.parse(`${dateText}T00:00:00Z`);
    const today = Date.parse(`${todayText}T00:00:00Z`);
    if (!Number.isFinite(date) || !Number.isFinite(today)) return null;
    return Math.ceil((date - today) / 86400000);
  }

  function analyseCandidate(candidate, todayText) {
    const name = text(candidate.name);
    if (!name) return { valid: false, error: "Every candidate needs a university and programme name." };

    const tuition = optionalMoney(candidate.tuition, "Tuition");
    const living = optionalMoney(candidate.living, "Living cost");
    const other = optionalMoney(candidate.other, "Other first-year cost");
    const moneyError = tuition.error || living.error || other.error;
    if (moneyError) return { valid: false, error: `${name}: ${moneyError}` };
    if (candidate.url && !validUrl(candidate.url)) {
      return { valid: false, error: `${name}: enter a complete http or https programme URL.` };
    }

    const values = [tuition.value, living.value, other.value];
    const hasAnyCost = values.some(value => value !== null);
    const costComplete = values.every(value => value !== null);
    const firstYearCost = hasAnyCost ? values.reduce((sum, value) => sum + (value || 0), 0) : null;
    const accreditation = text(candidate.accreditation) || "not-checked";
    const gaps = [];
    if (!candidate.url) gaps.push("programme source");
    if (!costComplete) gaps.push("complete first-year costs");
    if (!candidate.deadline) gaps.push("application deadline");
    if (accreditation !== "confirmed") gaps.push("regulator confirmation");
    if (!text(candidate.notes)) gaps.push("decision notes");

    return {
      valid: true,
      name,
      country: text(candidate.country),
      url: text(candidate.url),
      tuition: tuition.value,
      living: living.value,
      other: other.value,
      firstYearCost,
      costComplete,
      deadline: text(candidate.deadline),
      deadlineDays: daysUntil(candidate.deadline, todayText),
      accreditation,
      notes: text(candidate.notes),
      gaps
    };
  }

  function compare(candidates, todayText) {
    const active = (candidates || []).filter(candidate =>
      Object.values(candidate || {}).some(value => text(value))
    );
    if (active.length < 2) {
      return { valid: false, error: "Enter at least two university candidates to compare." };
    }
    const analysed = [];
    for (const candidate of active) {
      const result = analyseCandidate(candidate, todayText);
      if (!result.valid) return result;
      analysed.push(result);
    }
    const completeCosts = analysed.filter(item => item.costComplete);
    const minimum = completeCosts.length
      ? Math.min(...completeCosts.map(item => item.firstYearCost))
      : null;
    analysed.forEach(item => {
      item.isLowestEnteredCost = minimum !== null && item.costComplete && item.firstYearCost === minimum;
    });
    return { valid: true, candidates: analysed, comparableCostCount: completeCosts.length };
  }

  return { validUrl, daysUntil, analyseCandidate, compare };
});
