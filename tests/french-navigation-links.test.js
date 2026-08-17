const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..");
const repair = require("../scripts/repair-french-navigation-links");

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

test("French public pages have no stale links to the safe English navigation set", () => {
  const result = repair.run({ write: false });
  assert.deepEqual(result.changedFiles, [], `${result.replacements} stale French navigation links remain:\n${result.changedFiles.slice(0, 40).join("\n")}`);
});

test("the repair covers French navigation without rewriting explicit English handoffs", () => {
  assert.equal(repair.SAFE_FRENCH_DESTINATIONS.get("/tools/"), "/fr/all-tools/");
  assert.equal(repair.SAFE_FRENCH_DESTINATIONS.get("/privacy/"), "/fr/privacy/");

  const input = '<a href="/tools/">Outils</a><a href="/education/">Ouvrir la source anglaise</a><a href="/contact/?topic=test">Signaler</a>';
  const output = repair.repairHtml(input);
  assert.equal(output.replacements, 2);
  assert.match(output.next, /href="\/fr\/all-tools\/">Outils/);
  assert.match(output.next, /href="\/education\/">Ouvrir la source anglaise/);
  assert.match(output.next, /href="\/fr\/contact\/\?topic=test">Signaler/);

  assert.match(read("fr/cars/afrique-du-sud/index.html"), /href="\/cars\/south-africa\/">Annuaire complet en anglais/);
});
