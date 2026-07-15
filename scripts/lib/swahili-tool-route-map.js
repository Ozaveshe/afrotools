"use strict";

const COVERAGE_WAVE = require("../../data/localization/coverage-wave-2026-07.json");

const SWAHILI_TOOL_SLUG_TO_ENGLISH_TOOL = Object.freeze(
  Object.fromEntries(COVERAGE_WAVE.swahili.map((entry) => [`zana/${entry.swSlug}`, `tools/${entry.enSlug}`]))
);

const ENGLISH_TOOL_TO_SWAHILI_SLUG = Object.freeze(
  Object.fromEntries(Object.entries(SWAHILI_TOOL_SLUG_TO_ENGLISH_TOOL).map(([swSlug, enSlug]) => [enSlug, swSlug]))
);

function swahiliToolSlugToEnglishSource(swSlug) {
  return SWAHILI_TOOL_SLUG_TO_ENGLISH_TOOL[String(swSlug || "").replace(/^\/+|\/+$/g, "")] || null;
}

function swahiliRouteForEnglishToolSource(source) {
  const clean = String(source || "").replace(/^\/+|\/+$/g, "");
  const swSlug = ENGLISH_TOOL_TO_SWAHILI_SLUG[clean];
  return swSlug ? `/sw/${swSlug}` : null;
}

module.exports = {
  ENGLISH_TOOL_TO_SWAHILI_SLUG,
  SWAHILI_TOOL_SLUG_TO_ENGLISH_TOOL,
  swahiliRouteForEnglishToolSource,
  swahiliToolSlugToEnglishSource,
};
