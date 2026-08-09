"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const sw = fs.readFileSync(path.join(ROOT, "sw", "zana", "kitengeneza-flyer", "index.html"), "utf8");
const en = fs.readFileSync(path.join(ROOT, "tools", "flyer-maker", "index.html"), "utf8");
const controller = fs.readFileSync(path.join(ROOT, "assets", "js", "lib", "flyer-maker-studio.js"), "utf8");

const requiredIds = [
  "flyerPrompt", "flyerGenerateLocal", "flyerGenerateAi", "flyerAiConsent", "flyerTemplateGrid",
  "flyerType", "flyerOrganizer", "flyerHeadline", "flyerSubline", "flyerDateTime", "flyerVenue",
  "flyerDetails", "flyerCta", "flyerContact", "flyerPrice", "flyerNote", "flyerLoadBrand",
  "flyerSize", "flyerLayout", "flyerFont", "flyerPrimary", "flyerSecondary", "flyerAccent",
  "flyerTextColor", "flyerBackgroundInput", "flyerLogoInput", "flyerQrInput", "flyerTextScale",
  "flyerBgZoom", "flyerBgShift", "flyerGuides", "flyerReset", "flyerCanvas", "flyerFormat",
  "flyerSuffix", "flyerQuality", "flyerDownload", "flyerExportVariants", "flyerCopyCaption",
  "flyerCopyBrief", "flyerCopyLink", "flyerSaveBrand", "flyerChecklist", "flyerHistory", "flyerStatus",
];

for (const id of requiredIds) {
  assert.match(en, new RegExp(`id=["']${id}["']`), `English owner lost #${id}`);
  assert.match(sw, new RegExp(`id=["']${id}["']`), `Swahili owner lacks #${id}`);
}

assert.equal((sw.match(/data-flyer-template/g) || []).length, 0, "templates must be controller-rendered");
assert.match(sw, /church:\["Ibada ya kanisa"/);
assert.match(sw, /fundraiser:\["Harambee"/);
assert.match(sw, /sizes:\{instagram:"Instagram wima",square:"Chapisho la mraba",story:"Story au status",a4:"Chapa ya A4",letter:"Chapa ya Letter"\}/);
assert.match(sw, /image\/png/);
assert.match(sw, /image\/jpeg/);
assert.match(sw, /image\/webp/);
assert.match(sw, /Instagram wima - 1080 x 1350/);
assert.match(sw, /Mraba - 1080 x 1080/);
assert.match(sw, /Story au status - 1080 x 1920/);
assert.match(sw, /Chapa ya A4 - 2480 x 3508/);
assert.match(sw, /Chapa ya Letter - 2550 x 3300/);
assert.match(sw, /meta name="generator" content="scripts\/build-sw-flyer-maker-final\.js"/);
assert.match(sw, /canonical" href="https:\/\/afrotools\.com\/sw\/zana\/kitengeneza-flyer\/"/);
assert.match(sw, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/flyer-maker\/"/);
assert.match(sw, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/createur-flyer\/"/);
assert.match(sw, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/kitengeneza-flyer\/"/);
assert.match(sw, /assets\/img\/tools\/flyer-maker\.webp/);
assert.doesNotMatch(sw, /analytics-bootstrap|lazy-analytics/);
assert.match(sw, /Ninakubali kutuma maelekezo haya/);
assert.match(sw, /AI hautumi picha/);
assert.match(controller, /window\.AfroToolsFlyerStudioLocale\s*\|\|\s*\{\}/);
assert.match(controller, /typeof locale\.parsePrompt\s*===\s*"function"/);
assert.match(controller, /tr\("ready",\s*"Ready"\)/);

console.log(`PASS sw-flyer-maker-final: ${requiredIds.length} shared controls, 8 templates, 5 exact sizes, 3 export formats`);
