const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "..");

function loadEngine(relativePath) {
  const window = {};
  const context = vm.createContext({ window, globalThis: window });
  vm.runInContext(fs.readFileSync(path.join(ROOT, relativePath), "utf8"), context, {
    filename: relativePath,
  });
  return window.AfroTools.LinkedInOptimizerEngine;
}

for (const relativePath of [
  "engines/src/linkedin-optimizer-engine.js",
  "engines/linkedin-optimizer-engine.js",
]) {
  test(`${relativePath} preserves the frozen English default oracle`, () => {
    const engine = loadEngine(relativePath);
    const result = engine.calculate({
      industry: "software",
      level: "student",
      connections: "0",
      checks: {},
    });

    assert.equal(result.score, 0);
    assert.equal(result.totalPoints, 0);
    assert.equal(result.maxPoints, 100);
    assert.equal(result.pointsToAllStar, 90);
    assert.equal(result.allStar, false);
    assert.equal(result.checklist.length, 12);
    assert.equal(result.headlines.length, 6);
    assert.equal(result.headlines[0].recommended, true);
    assert.equal(
      result.headlines[0].text,
      "Aspiring Software Developer | Building African Fintech Solutions | BSc Computer Science"
    );
    assert.equal(result.keywords.length, 13);
    assert.equal(result.keywords[0], "Software Engineer");
    assert.match(result.growthTip, /under 100 connections/);
  });

  test(`${relativePath} preserves weighted All-Star scoring`, () => {
    const engine = loadEngine(relativePath);
    const checks = {
      chk_photo: true,
      chk_headline: true,
      chk_about: true,
      chk_experience: true,
      chk_education: true,
      chk_skills: true,
      chk_endorsements: true,
      chk_recommendations: true,
      chk_featured: true,
      chk_creator: true,
      chk_banner: true,
    };
    const result = engine.calculate({
      industry: "data",
      level: "mid",
      connections: "2",
      checks,
    });

    assert.equal(result.score, 90);
    assert.equal(result.allStar, true);
    assert.equal(result.pointsToAllStar, 0);
    assert.equal(result.headlines.find((item) => item.recommended).level, "mid");
    assert.equal(result.keywords[0], "Data Analyst");
    assert.match(result.growthTip, /quality over quantity/);
  });

  test(`${relativePath} fails safely for empty and invalid input`, () => {
    const engine = loadEngine(relativePath);
    const empty = engine.calculate();
    const invalid = engine.calculate({
      industry: "__invalid__",
      level: "__invalid__",
      connections: "__invalid__",
      checks: { chk_photo: "yes", chk_headline: 1 },
    });

    assert.equal(empty.score, 0);
    assert.equal(invalid.score, 0);
    assert.equal(invalid.input.industry, "software");
    assert.equal(invalid.input.level, "student");
    assert.equal(invalid.input.connections, "0");
    assert.equal(invalid.checklist.every((item) => item.checked === false), true);
    assert.equal(invalid.growthTip.includes("undefined"), false);
  });
}
