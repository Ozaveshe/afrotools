"use strict";

const FRENCH_TELECOM_SLUG_TO_ENGLISH_SOURCE = Object.freeze({
  "calculateur-consommation-data": "telecom/data-usage-calc",
  "calculateur-roaming": "telecom/roaming-cost",
  "comparateur-forfaits-data": "telecom/data-plan-compare",
  "comparateur-internet": "telecom/internet-compare",
  "fibre-lte-5g": "telecom/fiber-lte-5g",
  "internet-entreprise": "telecom/business-internet",
  "portabilite-numero-mobile": "telecom/number-portability",
  "prix-sms-pro": "telecom/bulk-sms-pricing",
  "valeur-credit-telephonique": "telecom/airtime-value",
});

const ENGLISH_SOURCE_TO_FRENCH_TELECOM_SLUG = Object.freeze(
  Object.fromEntries(
    Object.entries(FRENCH_TELECOM_SLUG_TO_ENGLISH_SOURCE).map(([frSlug, source]) => [source, frSlug])
  )
);

function frenchTelecomSlugToEnglishSource(frSlug) {
  return FRENCH_TELECOM_SLUG_TO_ENGLISH_SOURCE[frSlug] || null;
}

function frenchRouteForEnglishTelecomSource(source) {
  const clean = String(source || "").replace(/^\/+|\/+$/g, "");
  const frSlug = ENGLISH_SOURCE_TO_FRENCH_TELECOM_SLUG[clean];
  return frSlug ? `/fr/telecom/${frSlug}` : null;
}

module.exports = {
  FRENCH_TELECOM_SLUG_TO_ENGLISH_SOURCE,
  frenchRouteForEnglishTelecomSource,
  frenchTelecomSlugToEnglishSource,
};
