"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const target = "sw/zana/boresha-linkedin/index.html";
const english = read("tools/linkedin-optimizer/index.html");
const sw = read(target);
const controller = read("assets/js/pages/creative/linkedin-optimizer-controller.js");
const engine = read("engines/src/linkedin-optimizer-engine.js");
const family = read("scripts/build-sw-creative-parity.js");

for (const pattern of [
  /<html\b[^>]*lang="sw"/, /afrotools-sw-native-owner" content="linkedin-optimizer"/,
  /afrotools-sw-source-owner" content="scripts\/build-sw-linkedin-optimizer-final\.js"/,
  /canonical" href="https:\/\/afrotools\.com\/sw\/zana\/boresha-linkedin\/"/,
  /hreflang="en" href="https:\/\/afrotools\.com\/tools\/linkedin-optimizer\/"/,
  /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/optimiseur-linkedin\/"/,
  /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/boresha-linkedin\/"/,
  /assets\/img\/tools\/linkedin-optimizer\.webp/, /"@type":"FAQPage"/, /"inLanguage":"sw"/,
]) assert.match(sw, pattern);
assert.ok(fs.existsSync(path.join(ROOT, "assets/img/tools/linkedin-optimizer.webp")));
assert.doesNotMatch(sw, /<iframe\b|careerCalc\(|data-sw-preview|analytics-bootstrap|fonts\.googleapis|lazy-analytics|capture-lead|supabase/i);

const coreIds = [
  "industry", "country", "level", "connections", "chk_photo", "chk_headline", "chk_about",
  "chk_experience", "chk_education", "chk_skills", "chk_endorsements", "chk_recommendations",
  "chk_featured", "chk_creator", "chk_banner", "chk_location", "results", "profileScore",
  "allStarBadge", "profileSummary", "checklistStatus", "headlines", "keywords", "growthStrategy",
];
for (const id of coreIds) {
  assert.match(english, new RegExp(`id=["']${id}["']`), `English owner missing #${id}`);
  assert.match(sw, new RegExp(`id=["']${id}["']`), `Swahili parity missing #${id}`);
}
assert.equal((sw.match(/id="chk_/g) || []).length, 12);
assert.equal((sw.match(/<option value="(?:software|product|marketing|finance|hr|sales|data|consulting|healthcare|legal|creative|operations)"/g) || []).length, 12);
assert.equal((sw.match(/<option value="(?:student|junior|mid|senior|manager|exec)"/g) || []).length, 6);
for (const id of ["linkedinPlanForm", "planCountry", "planScore", "planGap", "planOutreach", "linkedinPlanResult", "copyLinkedInPlan", "resetLinkedIn", "linkedinPlanStatus"]) assert.match(sw, new RegExp(`id=["']${id}["']`));
assert.match(sw, /Mpango unatengenezwa ndani ya kivinjari/);
assert.match(sw, /hakuna taarifa inayotumwa LinkedIn, AI au seva/);
assert.doesNotMatch(sw, /copy or download|pakua mpango|download profile|export profile/i);

for (const pattern of [/LinkedInOptimizerEngine/, /engine\.calculate\(readInput\(\)\)/, /locale\.checks/, /locale\.headline/, /locale\.growthTips/, /locale\.postingStrategy/]) assert.match(controller, pattern);
for (const pattern of [/var CHECKS = \[/, /var HEADLINES = \{/, /var KEYWORDS = \{/, /score >= 90/, /pointsToAllStar/]) assert.match(engine, pattern);
assert.match(family, /"linkedin-optimizer": "scripts\/build-sw-linkedin-optimizer-final\.js"/);
assert.match(family, /row\.englishId === "linkedin-optimizer" \? "\/engines\/linkedin-optimizer-engine\.js"/);

const before = crypto.createHash("sha256").update(read(target)).digest("hex");
childProcess.execFileSync(process.execPath, [path.join(ROOT, "scripts/build-sw-linkedin-optimizer-final.js")], { cwd: ROOT, stdio: "pipe" });
const after = crypto.createHash("sha256").update(read(target)).digest("hex");
assert.equal(after, before, "Swahili LinkedIn generator must be idempotent");
console.log("Swahili LinkedIn Optimizer static parity passed: exact controls, shared engine/controller, native outputs, local clipboard plan and deterministic owner.");
