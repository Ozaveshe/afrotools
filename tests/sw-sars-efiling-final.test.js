"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const swPath = "sw/zana/mwongozo-wa-sars-efiling/index.html";
const sw = read(swPath);
const en = read("tools/sars-efiling/index.html");
const fr = read("fr/tools/guide-de-sars-efiling/index.html");
const controller = read("assets/js/lib/sars-efiling-guide.js");
const registry = read("assets/js/components/tool-registry.js");
const generator = read("scripts/build-sw-sars-efiling-final.js");
const route = "https://afrotools.com/sw/zana/mwongozo-wa-sars-efiling/";

assert(sw.includes('lang="sw"') && sw.includes(`<link rel="canonical" href="${route}">`));
for (const anchor of ["register", "season", "auto", "return", "payment", "help"]) {
  assert(sw.includes(`id="${anchor}"`), `missing guide section ${anchor}`);
  assert(sw.includes(`href="#${anchor}"`), `missing route link ${anchor}`);
}
for (const source of ["register-for-efiling/", "filing-season/", "how-does-auto-assessment-work/"]) {
  assert(sw.includes(source), `missing official source ${source}`);
}
assert(sw.includes("1–12 Julai 2026") && sw.includes("23 Oktoba 2026") && sw.includes("22 Januari 2027"));
assert(sw.includes("9 Agosti 2026") && sw.includes("2 Juni") && sw.includes("16 Julai 2026"));
assert(!/<(?:form|input|textarea|select)\b/i.test(sw), "guide must not collect tax or credential data");
assert(!/analytics-bootstrap|lazy-analytics|related-tools\.min/i.test(sw), "Sw route must not add analytics or unrelated runtime egress");
for (const page of [en, fr, sw]) assert(page.includes(`hreflang="sw" href="${route}"`), "hreflang group must be reciprocal");
assert(en.includes('id="sarsPreparationWorkspace"') && sw.includes('id="sarsPreparationWorkspace"'));
assert(sw.includes("sars-efiling.svg") && fs.existsSync(path.join(root, "assets/img/tools/sars-efiling.svg")));
assert(registry.includes("id: 'sars-efiling-sw'") && registry.includes("href: '/sw/zana/mwongozo-wa-sars-efiling/'") && registry.includes("sourceId: 'sars-efiling'"));
assert(generator.includes('meta name="generator" content="scripts/build-sw-sars-efiling-final.js"'));
for (const id of ["domain", "device", "records", "evidence", "payment", "support"]) assert(controller.includes(`"${id}"`));
for (const format of ["json", "txt", "pdf"]) assert(controller.includes(`format === "${format}"`));
assert(controller.includes("afro_sars_efiling_preparation_v1") && controller.includes("localStorage"));
assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/.test(controller), "controller must not send data");
console.log("PASS sw-sars-efiling-final: native route, owner, sources, privacy, exports, artwork and reciprocal metadata");
