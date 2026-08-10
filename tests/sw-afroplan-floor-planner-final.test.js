"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { normalizeReleaseOwnedHtml } = require("../scripts/lib/release-owned-html-normalizer");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const en = read("engineering/floor-planner/index.html");
const sw = read("sw/zana/mpangaji-ramani-ya-sakafu/index.html");
const releaseNormalizedSw = normalizeReleaseOwnedHtml(sw);
const registry = read("assets/js/components/tool-registry.js");
const localizer = read("engineering/floor-planner/js/fp-sw-localize.js");
const exporter = read("engineering/floor-planner/js/fp-sw-export.js");
const swUrl = "https://afrotools.com/sw/zana/mpangaji-ramani-ya-sakafu/";

assert(sw.length > 45000, "Sw owner must be the complete workspace, not the former thin shell");
assert(sw.includes('lang="sw"') && sw.includes(`rel="canonical" href="${swUrl}"`));
assert(sw.includes('meta name="generator" content="scripts/build-sw-afroplan-floor-planner.js"'));
assert(sw.includes('meta name="tool-id" content="afroplan-floor-planner-sw"'));
for (const page of [en, sw, read("fr/ingenierie/planificateur-etage/index.html")]) assert(page.includes(`hreflang="sw" href="${swUrl}"`));

const ids = ["fpCanvas", "fpRoomBuilder", "fpUndo", "fpRedo", "fpSave", "fpRestorePlan", "fpExportPackPdf", "fpExportPlanPng", "fpExportBoqData", "fpUnits", "fpOpen3D", "fpTemplatesModal", "fpFurniturePanel"];
for (const id of ids) assert(sw.includes(`id="${id}"`), `missing complete-workspace control ${id}`);
for (const tool of ["select", "wall", "door", "window", "furniture", "measure", "label", "erase"]) assert(sw.includes(`data-tool="${tool}"`), `missing ${tool} tool`);

const coreScripts = [...en.matchAll(/<script src="(\/engineering\/floor-planner\/js\/fp-[^"]+\.js)[^"]*"/g)].map(match => match[1]);
for (const script of coreScripts) assert(sw.includes(`src="${script}`), `Sw route dropped shared controller ${script}`);
assert(sw.includes("fp-sw-localize.js") && sw.includes("fp-sw-export.js"));
for (const id of ["fpExportPdf", "fpExportPng", "fpBoqPdf", "fpBoqCsv", "fpBoqXlsx", "fpBoqPrintHtml", "fpCostJson"]) assert(exporter.includes(`"${id}"`), `missing native export ${id}`);
assert(exporter.includes("afrotools-floor-plan-boq-sw-v1") && exporter.includes("XLSX.writeFile") && exporter.includes("jsPDF"));
assert(!/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/.test(exporter), "export adapter must remain local");
assert(localizer.includes("MutationObserver") && localizer.includes("Zana: Chagua"));

assert(registry.includes("id: 'zana-mpangaji-ramani-ya-sakafu-sw-finish'") && registry.includes("sourceId: 'afroplan-floor-planner'") && registry.includes("imageId: 'afroplan-floor-planner'"));
assert(!sw.includes("data-sw-build-form") && !sw.includes("Kokotoa makadirio"), "old reduced brief calculator must be gone");
assert(!/analytics-bootstrap|lazy-analytics|english-df-app-upgrades|data-df-upgrade/.test(releaseNormalizedSw), "Sw workspace must not load non-release analytics or generic decision rail");
const visible = sw.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
for (const blocker of ["Start planning", "Room name", "No rooms yet", "Construction estimate", "Floor planner questions", "Save local draft"]) assert(!visible.includes(blocker), `residual visible English: ${blocker}`);
console.log("PASS sw-afroplan-floor-planner-final: complete shared workspace, native owner/export layer, registry, SEO and privacy");
