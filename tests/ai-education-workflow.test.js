#!/usr/bin/env node

const assert = require("assert");
const education = require("../assets/js/ai/education-workflow.js");

const cases = [
  {
    query: "I want to study in Canada from Nigeria with a budget of $8,000",
    originCountry: "Nigeria",
    targetCountry: "Canada",
    budgetAmount: 8000,
    expectedGap: 22000,
  },
  {
    query: "Ghana to UK masters in finance with GPA 3.4 for September 2027 intake",
    originCountry: "Ghana",
    targetCountry: "United Kingdom",
    studyLevel: "masters",
    field: "business",
  },
  {
    query: "Find scholarships for a Cameroonian student to study engineering in Germany with IELTS 6.5",
    originCountry: "Cameroon",
    targetCountry: "Germany",
    field: "STEM / engineering",
    ieltsScore: 6.5,
  },
  {
    query: "Kenya to Australia undergraduate nursing plan with 12000 USD budget and GPA 3.2",
    originCountry: "Kenya",
    targetCountry: "Australia",
    studyLevel: "undergraduate",
    field: "health",
    budgetAmount: 12000,
  },
];

for (const sample of cases) {
  const plan = education.buildEducationPlan({}, { query: sample.query });
  assert.strictEqual(plan.workflowType, "education_planner", sample.query);
  assert.strictEqual(plan.inputs.originCountry, sample.originCountry, sample.query);
  assert.strictEqual(plan.inputs.targetCountry, sample.targetCountry, sample.query);
  if (sample.studyLevel) assert.strictEqual(plan.inputs.studyLevel, sample.studyLevel, sample.query);
  if (sample.field) assert.strictEqual(plan.inputs.field, sample.field, sample.query);
  if (sample.budgetAmount) assert.strictEqual(plan.inputs.budgetAmount, sample.budgetAmount, sample.query);
  if (sample.expectedGap) assert.strictEqual(plan.costGap.gapAmount, sample.expectedGap, sample.query);
  if (sample.ieltsScore) assert.strictEqual(plan.inputs.ieltsScore, sample.ieltsScore, sample.query);
  assert.ok(plan.goalSummary.includes(sample.targetCountry), sample.query);
  assert.ok(plan.matchingTools.some((tool) => tool.id === "scholarship-finder"), sample.query);
  assert.ok(plan.matchingTools.some((tool) => tool.id === "study-abroad-cost"), sample.query);
  assert.ok(plan.checklist.length >= 6, sample.query);
  assert.ok(plan.sourceWarnings.join(" ").includes("planning estimates"), sample.query);
  assert.strictEqual(plan.scholarshipLaunchUrl, "/tools/scholarship-finder/?source=ask&prefill=1");
}

const missing = education.buildEducationPlan({}, { query: "I want scholarships abroad" });
assert.ok(missing.missingInputs.includes("originCountry"));
assert.ok(missing.missingInputs.includes("targetCountry"));
assert.ok(missing.missingInputs.includes("budgetAmount"));
assert.ok(missing.missingInputs.includes("studyLevel"));

const consentPlan = education.buildEducationPlan({ originCountry: "Nigeria", targetCountry: "Canada", budget: 8000 }, {
  query: "study in Canada from Nigeria",
  consentToModel: true,
});
assert.ok(consentPlan.aiBrief.includes("explicit consent"));

const rendered = education.renderEducationPanel(consentPlan);
assert.match(rendered, /Education plan/);
assert.match(rendered, /Open Scholarship Finder with profile/);
assert.match(rendered, /Source and freshness/);
assert.doesNotMatch(rendered, /guaranteed/i);

console.log("AI education workflow validated: " + cases.length + " route examples plus missing-input and consent checks.");
