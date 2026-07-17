"use strict";

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function toFiniteNumber(value, field) {
  if (!hasValue(value)) return null;

  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    throw new Error(`${field} must be a valid number`);
  }

  return amount;
}

function normalizeNigeriaRegime(regime) {
  if (!hasValue(regime)) return "NTA_2026";

  const normalized = String(regime).trim().toLowerCase();
  if (["nta", "nta_2026", "nta2026", "new"].includes(normalized)) {
    return "NTA_2026";
  }

  if (["pita", "pita_2025", "pita2025", "old"].includes(normalized)) {
    return "PITA_2025";
  }

  return String(regime).trim();
}

function normalizeTaxOptions(country, options) {
  const normalized = { ...(options || {}) };

  if (String(country || "").trim().toUpperCase() === "NG" && hasValue(normalized.regime)) {
    normalized.regime = normalizeNigeriaRegime(normalized.regime);
  }

  return normalized;
}

function resolveAnnualSalaryInputs(payload) {
  const fields = [
    { key: "grossAnnual", mode: "gross", multiplier: 1 },
    { key: "grossMonthly", mode: "gross", multiplier: 12 },
    { key: "netAnnual", mode: "net", multiplier: 1 },
    { key: "netMonthly", mode: "net", multiplier: 12 }
  ];

  const provided = [];

  for (const field of fields) {
    const amount = toFiniteNumber(payload[field.key], field.key);
    if (amount === null) continue;

    if (amount <= 0) {
      throw new Error(`${field.key} must be greater than 0`);
    }

    provided.push({
      field: field.key,
      mode: field.mode,
      annualAmount: amount * field.multiplier
    });
  }

  if (provided.length === 0) {
    return null;
  }

  if (provided.length > 1) {
    throw new Error("Provide exactly one of grossAnnual, grossMonthly, netAnnual, or netMonthly");
  }

  return provided[0];
}

module.exports = {
  normalizeTaxOptions,
  resolveAnnualSalaryInputs
};
