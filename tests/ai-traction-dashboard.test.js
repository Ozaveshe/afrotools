const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const adminDashboard = fs.readFileSync(path.join(root, "admin", "ai-traction.html"), "utf8");
const localReport = fs.readFileSync(path.join(root, "ai", "intent-report.html"), "utf8");
const analyticsSource = fs.readFileSync(path.join(root, "assets", "js", "ai", "intent-analytics.js"), "utf8");

[
  'meta name="robots" content="noindex,nofollow"',
  "/api/admin-session",
  "x-admin-key",
  "purpose: \"ai-traction-dashboard\"",
  "Raw prompt text is not displayed or exported by default",
  "metricPrompts",
  "metricIntents",
  "metricFallback",
  "metricToolOpen",
  "metricPrefill",
  "metricExports",
  "metricSaved",
  "metricSignup",
  "metricPro",
  "metricSponsor",
  "metricApiWidget",
  "metricClarification",
  "metricFeedback",
  "metricDrift",
  "workflowList",
  "categoryList",
  "countryList",
  "surfaceList",
  "safePromptList",
  "noMatchList",
  "feedbackList",
  "driftList",
  "interestList",
  "jsonOutput"
].forEach((needle) => {
  assert(adminDashboard.includes(needle), `admin AI traction dashboard should include ${needle}`);
});

[
  "promptCount",
  "intentCount",
  "apiWidgetCount",
  "topWorkflows",
  "topCategories",
  "topCountries",
  "topSurfaces",
  "safePromptExamples",
  "noMatchCategories",
  "interestSurfaces",
  "feedbackOutcomes",
  "driftSignals"
].forEach((needle) => {
  assert(localReport.includes(needle), `local AI intent report should include ${needle}`);
});

[
  "ai_prompt_submitted",
  "ai_intent_detected",
  "ai_clarification_shown",
  "ai_clarification_answered",
  "ai_tool_opened",
  "ai_prefill_success",
  "ai_prefill_failed",
  "ai_export_generated",
  "ai_project_saved",
  "ai_router_feedback_submitted",
  "ai_router_drift_signal",
  "ai_signup_prompt_shown",
  "ai_pro_upgrade_clicked",
  "sponsor_lead_optin_submitted",
  "ai_api_interest_clicked",
  "ai_widget_interest_clicked"
].forEach((eventName) => {
  assert(analyticsSource.includes(`"${eventName}"`), `${eventName} should be declared in the analytics helper`);
});

assert(analyticsSource.includes("safeExplicitPromptExample"), "analytics helper should sanitize explicit prompt examples");
assert(analyticsSource.includes("interestSurfaces"), "analytics helper should aggregate API/widget interest surfaces");
assert(analyticsSource.includes("surfaceBreakdown"), "analytics helper should aggregate sanitized product surfaces");
assert(analyticsSource.includes("normalizeSurface"), "analytics helper should normalize product surfaces");
assert(!adminDashboard.includes("originalQuery"), "admin dashboard should not render raw workflow queries");
assert(!adminDashboard.includes("raw_query"), "admin dashboard should not request raw query payloads");

console.log("ai-traction-dashboard tests passed");
