"use strict";

const FRENCH_TELECOM_SLUG_TO_ENGLISH_SOURCE = Object.freeze({
  "valeur-credit-telephonique": "telecom/airtime-value",
  "portabilite-numero-mobile": "telecom/number-portability",
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
