(function initAfroToolsAIUsageLimits(root, factory) {
  var limits = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = limits;
  } else {
    root.AfroToolsAIUsageLimits = limits;
  }
})(typeof window !== "undefined" ? window : globalThis, function createAfroToolsAIUsageLimits() {
  "use strict";

  var PLAN_ALIASES = Object.freeze({
    free: "free",
    pro: "pro",
    premium: "pro",
    admin: "pro",
    lifetime: "pro",
    trialing: "pro",
    team: "team",
    business: "team",
    b2b: "team",
    enterprise: "team"
  });

  // -1 means unlimited. This is the shared browser/server source of truth for
  // AI advisor and basic AI brief daily usage.
  //
  // Pro is a real 999/day ceiling rather than -1: an uncapped tier cannot be
  // costed, and "unlimited" is a promise the API bill has to keep. Team stays
  // uncapped because it is negotiated per account.
  var AI_BRIEFS_PER_DAY = Object.freeze({
    free: 99,
    pro: 999,
    team: -1
  });

  function normalizePlan(plan) {
    var clean = String(plan || "free").toLowerCase().trim();
    return PLAN_ALIASES[clean] || "free";
  }

  function getAiBriefsPerDay(plan) {
    return AI_BRIEFS_PER_DAY[normalizePlan(plan)];
  }

  return Object.freeze({
    PLAN_ALIASES: PLAN_ALIASES,
    AI_BRIEFS_PER_DAY: AI_BRIEFS_PER_DAY,
    normalizePlan: normalizePlan,
    getAiBriefsPerDay: getAiBriefsPerDay
  });
});
