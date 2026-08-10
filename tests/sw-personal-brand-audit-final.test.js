"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const context = { globalThis: {} }; vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "engines/src/personal-brand-audit-engine.js"), "utf8"), context);
const engine = context.globalThis.AfroTools.PersonalBrandAuditEngine;
const mid = engine.calculate({ industry: "tech", yearsExp: 7, liConnections: 13, liPosting: 8, twFollowers: 9, igFollowers: 7, website: 12, googleResult: 7, articles: 7, book: 5, podcast: 6, speaking: 7, awards: 5, education: 9, certs: 5 });
assert.equal(mid.total, 88); assert.equal(mid.grade, "A"); assert.equal(mid.gradeClass, "grade-A"); assert.equal(mid.weakest.name, "Social Media"); assert.equal(mid.monetizationScore, "High");
assert.deepEqual(JSON.parse(JSON.stringify(mid.categories.map(({ name, score, max }) => ({ name, score, max })))), [
  { name: "LinkedIn", score: 20, max: 20 }, { name: "Social Media", score: 9, max: 15 }, { name: "Digital / SEO", score: 15, max: 15 },
  { name: "Content Creation", score: 18, max: 20 }, { name: "Offline Reputation", score: 12, max: 15 }, { name: "Credentials", score: 14, max: 15 }
]);
const max = engine.calculate({ liConnections: 20, liPosting: 10, twFollowers: 15, igFollowers: 10, website: 15, googleResult: 10, articles: 15, book: 15, podcast: 10, speaking: 12, awards: 8, education: 12, certs: 8 });
assert.equal(max.total, 100); assert.equal(max.grade, "A+");
const floor = engine.calculate({ education: 2 }); assert.equal(floor.total, 2); assert.equal(floor.grade, "F"); assert.equal(floor.weakest.name, "LinkedIn");
const controller = fs.readFileSync(path.join(root, "assets/js/pages/creative/personal-brand-audit-sw-controller.js"), "utf8");
assert.match(controller, /Siku 1–7/); assert.match(controller, /Siku 61–90/); assert.match(controller, /WEAKEST_ACTIONS/); assert.match(controller, /ukaguzi-wa-chapa-binafsi\.txt/);
const html = fs.readFileSync(path.join(root, "sw/zana/ukaguzi-wa-personal-brand/index.html"), "utf8");
assert.equal((html.match(/<select class="en-select" id=/g) || []).length, 14); assert.match(html, /id="yearsExp"/); assert.doesNotMatch(html, /careerCalc\('personalBrand'\)/);
assert.match(html, /hayatumwi kwa seva au AI/i); assert.match(html, /personal-brand-audit\.webp/);
console.log("Swahili personal-brand-audit final: 18 assertions passed");
