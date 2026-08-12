"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { ROUTES } = require("../scripts/lib/localized-category-standard");
const root = path.resolve(__dirname, "..");
for (const locale of ["fr", "sw"]) {
  for (const file of ROUTES[locale]) {
    if (!fs.existsSync(path.join(root, file))) continue;
    const html = fs.readFileSync(path.join(root, file), "utf8");
    assert.equal((html.match(/LOCALIZED-CATEGORY-STANDARD:START/g) || []).length, 1, `${file}: one source-owned standard block`);
    assert.match(html, /localized-category-standard\.css/);
    assert.match(html, /id="localizedCategorySearch"/);
    assert.match(html, /<form\b[^>]*localized-category-standard__search/);
    assert.match(html, /"@type":"FAQPage"/);
    assert.ok((html.match(/localized-category-standard__grid/g) || []).length >= 1, `${file}: method grid`);
    assert.ok((html.match(/localized-category-standard__links/g) || []).length >= 1, `${file}: discovery links`);
  }
}
console.log(`Localized category standard passed for ${ROUTES.fr.length + ROUTES.sw.length} configured routes.`);
