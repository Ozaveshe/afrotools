const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const routes = [
  ["tools/market-stall-profit/index.html", "en"],
  ["fr/tools/profit-stand-marche/index.html", "fr"],
  ["sw/zana/faida-ya-kibanda-sokoni/index.html", "sw"]
];

test("all native routes share the reviewed local engine and controller", () => {
  routes.forEach(([file, lang]) => {
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.match(html, new RegExp(`<html lang="${lang}"`));
    assert.match(html, /data-market-stall-planner/);
    assert.match(html, /assets\/js\/engines\/market-stall-profit\.js/);
    assert.match(html, /assets\/js\/pages\/market-stall-profit\.js/);
    assert.match(html, /assets\/css\/market-stall-profit\.css/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="fr"/);
    assert.match(html, /hreflang="sw"/);
    assert.doesNotMatch(html, /cdn\.jsdelivr|chart\.js|food seller|mobile money fee/i);
  });
});

test("controller uses safe DOM rendering and explicit persistence", () => {
  const js = fs.readFileSync(path.join(root, "assets/js/pages/market-stall-profit.js"), "utf8");
  assert.doesNotMatch(js, /\.innerHTML|insertAdjacentHTML|document\.write/);
  assert.match(js, /Save locally|Enregistrer localement|Hifadhi kwenye kifaa/);
  assert.match(js, /schemaVersion/);
  assert.match(js, /safeCsv/);
  assert.match(js, /jspdf/);
});
