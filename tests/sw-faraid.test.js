"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const engine = require("../assets/js/engines/sw-faraid.js");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/localization/sw-faraid.json"), "utf8"));
const routeFile = path.join(root, "sw/zana/urithi-wa-faraid/index.html");
const baseInput = { currency: "KES", estate: 12000000, debts: 1500000, funeral: 500000, bequest: 0, spouse: "wife", wives: 1, sons: 2, daughters: 1, brothers: 0, sisters: 0, father: true, mother: true, limitedCase: true };
const close = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);

test("manifest owns exactly one native Swahili Faraid route", () => {
  assert.equal(manifest.id, "faraid-inheritance");
  assert.equal(manifest.route, "/sw/zana/urithi-wa-faraid/");
  assert.equal(manifest.sourceRoute, "/tools/faraid-inheritance/");
  assert.equal(manifest.sources.length, 4);
});

test("calculator preserves deductions, fixed shares and child residue oracle", () => {
  const result = engine.calculate(baseInput);
  assert.equal(result.ok, true);
  assert.equal(result.netEstate, 10000000);
  const byKey = Object.fromEntries(result.rows.map(row => [row.key, row]));
  close(byKey.wives.share, 1 / 8);
  close(byKey.mother.share, 1 / 6);
  close(byKey["father-fixed"].share, 1 / 6);
  close(byKey.sons.share, 13 / 30);
  close(byKey.sons.perShare, 13 / 60);
  close(byKey["daughters-residue"].share, 13 / 120);
  close(result.allocatedAmount, result.netEstate);
});

test("bequest is capped at one third after debts and funeral costs", () => {
  const result = engine.calculate({ ...baseInput, estate: 900, debts: 150, funeral: 150, bequest: 500, spouse: "none", sons: 1, daughters: 0, father: false, mother: false });
  assert.equal(result.ok, true);
  assert.equal(result.distributableBeforeBequest, 600);
  assert.equal(result.bequestCap, 200);
  assert.equal(result.bequestUsed, 200);
  assert.equal(result.netEstate, 400);
  assert.ok(result.warnings.some(item => item.includes("theluthi moja")));
});

test("blocked siblings and sibling-only 2:1 residue stay distinct", () => {
  const blocked = engine.calculate({ ...baseInput, brothers: 1, sisters: 1 });
  assert.ok(blocked.warnings.some(item => item.includes("wamezuiwa")));
  assert.equal(blocked.rows.some(row => row.key === "brothers"), false);
  const residue = engine.calculate({ ...baseInput, spouse: "none", sons: 0, daughters: 0, father: false, mother: false, brothers: 2, sisters: 1 });
  const byKey = Object.fromEntries(residue.rows.map(row => [row.key, row]));
  close(byKey.brothers.share, 4 / 5);
  close(byKey.brothers.perShare, 2 / 5);
  close(byKey["sisters-residue"].share, 1 / 5);
});

test("Umariyyat spouse-plus-parents remainder method is explicit", () => {
  const result = engine.calculate({ ...baseInput, spouse: "husband", sons: 0, daughters: 0, brothers: 0, sisters: 0, father: true, mother: true });
  const byKey = Object.fromEntries(result.rows.map(row => [row.key, row]));
  close(byKey.husband.share, 1 / 2);
  close(byKey["mother-umariyyat"].share, 1 / 6);
  close(byKey["father-umariyyat"].share, 1 / 3);
  assert.ok(result.warnings.some(item => item.includes("Umariyyat")));
});

test("awl-style over-allocation scales fixed shares proportionally", () => {
  const result = engine.calculate({ ...baseInput, spouse: "husband", sons: 0, daughters: 2, brothers: 0, sisters: 0, father: true, mother: true });
  close(result.rows.reduce((sum, row) => sum + row.share, 0), 1);
  assert.ok(result.warnings.some(item => item.includes("awl")));
  close(result.rows.find(row => row.key === "husband").share, (1 / 4) / 1.25);
});

test("invalid and out-of-bound values fail closed", () => {
  for (const input of [
    { ...baseInput, estate: -1 },
    { ...baseInput, sons: 1.5 },
    { ...baseInput, wives: 5 },
    { ...baseInput, daughters: 101 },
    { ...baseInput, currency: "" }
  ]) assert.equal(engine.calculate(input).ok, false);
});

test("generated route is native, source-labelled, reciprocal, private and hub-linked", () => {
  const html = fs.readFileSync(routeFile, "utf8");
  const english = fs.readFileSync(path.join(root, "tools/faraid-inheritance/index.html"), "utf8");
  const hub = fs.readFileSync(path.join(root, "sw/dini-na-utamaduni/index.html"), "utf8");
  assert.match(html, /assets\/js\/engines\/sw-faraid\.js/);
  assert.match(html, /assets\/js\/pages\/sw-faraid\.js/);
  assert.doesNotMatch(html, /religious-cultural-apps\.js|sw-rc-runtime-localizer/);
  assert.match(html, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/faraid-inheritance\/"/);
  assert.match(html, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/urithi-wa-faraid\/"/);
  assert.match(english, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/urithi-wa-faraid\/"/);
  assert.match(hub, /href="\/sw\/zana\/urithi-wa-faraid\/"/);
  assert.match(html, /assets\/img\/tools\/faraid-inheritance\.webp/);
  assert.match(html, /Ilipitiwa mara ya mwisho: 2026-05-16/);
  assert.match(html, /localStorage/);
  assert.match(html, /hakitumi majina, mali au matokeo kwa seva/);
  assert.equal((html.match(/<label for="/g) || []).length, 14);
});
