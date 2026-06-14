#!/usr/bin/env node

const assert = require("assert");
const career = require("../assets/js/ai/career-workflow.js");

const ghana = career.buildCareerWorkflow({}, {
  query: "Write me a CV for an electrical engineer in Ghana",
});

assert.strictEqual(ghana.workflowType, "career_agent");
assert.strictEqual(ghana.inputs.country, "Ghana");
assert.strictEqual(ghana.inputs.targetRole, "electrical engineer");
assert.strictEqual(ghana.inputs.sector, "engineering");
assert.strictEqual(ghana.templateSuggestion.starterId, "trade");
assert.ok(["trade-skills", "construction-hse"].includes(ghana.templateSuggestion.templateId));
assert.ok(ghana.matchingTools.some((tool) => tool.id === "cv-builder"));
assert.ok(ghana.matchingTools.some((tool) => tool.id === "cover-letter"));
assert.ok(ghana.matchingTools.some((tool) => tool.id === "linkedin-optimizer"));
assert.ok(ghana.applicationPack.includes("ATS plain export"));
assert.ok(ghana.checklist.some((item) => /ATS/i.test(item)));
assert.ok(ghana.warnings.join(" ").includes("Do not fabricate degrees"));
assert.strictEqual(ghana.starterProfile.generatedWithConsent, false);
assert.strictEqual(ghana.cvPrefillInputs.templateId, ghana.templateSuggestion.templateId);
assert.strictEqual(ghana.cvLaunchUrl, "/tools/cv-builder/?source=ask&prefill=1");

const techGraduate = career.buildCareerWorkflow({}, {
  query: "Build a graduate resume for a Nigerian software developer in English",
});
assert.strictEqual(techGraduate.inputs.country, "Nigeria");
assert.strictEqual(techGraduate.inputs.targetRole, "software developer");
assert.strictEqual(techGraduate.inputs.sector, "technology");
assert.strictEqual(techGraduate.inputs.careerStage, "graduate");
assert.strictEqual(techGraduate.inputs.languagePreference, "English");
assert.strictEqual(techGraduate.templateSuggestion.templateId, "nairobi-tech");

const ngo = career.buildCareerWorkflow({
  country: "Kenya",
  targetRole: "program officer",
  sector: "NGO",
  experienceLevel: "mid",
  skills: ["grant reporting", "field coordination"],
}, {});
assert.strictEqual(ngo.inputs.country, "Kenya");
assert.strictEqual(ngo.inputs.sector, "NGO");
assert.strictEqual(ngo.templateSuggestion.templateId, "ngo-impact");
assert.ok(ngo.cvPrefillInputs.skills.includes("grant reporting"));

const missing = career.buildCareerWorkflow({}, { query: "Help me with a CV" });
assert.ok(missing.missingInputs.includes("targetRole"));
assert.ok(missing.missingInputs.includes("country"));
assert.ok(missing.rendered === undefined);

const rendered = career.renderCareerPanel(ghana);
assert.match(rendered, /Career agent plan/);
assert.match(rendered, /Open CV Builder with starter/);
assert.match(rendered, /Safe CV rules/);
assert.doesNotMatch(rendered, /guaranteed/i);

const consent = career.buildCareerWorkflow({ country: "Ghana", targetRole: "electrical engineer" }, {
  query: "CV for electrical engineer in Ghana",
  consentToModel: true,
});
assert.ok(consent.aiProfileStatus.includes("explicit consent"));

console.log("AI career workflow validated: routing, template suggestion, pack checklist, safety copy, and consent-gated profile status.");
