const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const routes = [
  ["tools/business-plan-builder/index.html", "en"],
  ["fr/tools/generateur-business-plan/index.html", "fr"],
  ["sw/zana/mjenzi-mpango-wa-biashara/index.html", "sw"]
];
test("native routes share one reviewed local implementation", () => {
  routes.forEach(([file,lang]) => {
    const html=fs.readFileSync(path.join(root,file),"utf8");
    assert.match(html,new RegExp(`<html lang="${lang}"`));
    assert.match(html,/data-business-plan-draft/);
    assert.match(html,/engines\/business-plan-draft\.js/);
    assert.match(html,/pages\/business-plan-draft\.js/);
    assert.match(html,/business-plan-draft\.css/);
    assert.match(html,/hreflang="en"/);assert.match(html,/hreflang="fr"/);assert.match(html,/hreflang="sw"/);
    assert.doesNotMatch(html,/<iframe|fonts\.googleapis|BOI|SEFA|YEDF|significantly increases your approval/i);
  });
});
test("controller avoids user-controlled HTML and keeps persistence explicit", () => {
  const js=fs.readFileSync(path.join(root,"assets/js/pages/business-plan-draft.js"),"utf8");
  assert.doesNotMatch(js,/\.innerHTML|insertAdjacentHTML|document\.write/);
  assert.match(js,/localStorage\.setItem\(STORE/);
  assert.match(js,/safeCsv/);assert.match(js,/jspdf/);assert.match(js,/data-import/);
});
