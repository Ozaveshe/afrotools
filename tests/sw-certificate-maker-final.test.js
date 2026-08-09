"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const contract = JSON.parse(fs.readFileSync(path.join(root, "data/localization/sw-certificate-maker-final.json"), "utf8"));
assert.deepEqual(contract.templates, ["school-award", "bootcamp", "church-service", "community"]);
assert.deepEqual(contract.dimensions, { width: 1400, height: 990 }); assert.deepEqual(contract.exports, ["png", "pdf"]); assert.deepEqual(contract.assetControls, []); assert.deepEqual(contract.persistence, []);
const controller = fs.readFileSync(path.join(root, contract.controllerOwner), "utf8");
assert.match(controller, /CHETI CHA UBORA/); assert.match(controller, /CHETI CHA KUKAMILISHA/); assert.match(controller, /CHETI CHA HUDUMA/); assert.match(controller, /CHETI CHA SHUKRANI/);
assert.match(controller, /canvas\.toBlob/); assert.match(controller, /pdf\.addPage\(\[1400, 990\]\)/); assert.match(controller, /embedPng/); assert.match(controller, /Weka /); assert.match(controller, /data-reset/);
const html = fs.readFileSync(path.join(root, contract.swahiliFile), "utf8");
assert.equal((html.match(/data-template=/g) || []).length, 4); assert.match(html, /canvas width="1400" height="990"/); assert.doesNotMatch(html, /type="file"/); assert.doesNotMatch(html, /Fungua zana kamili ya Kiingereza/);
assert.match(html, /Hayatumwi kwa seva au AI/); assert.match(html, /certificate-maker\.webp/);
console.log("Swahili certificate-maker final: 19 assertions passed");
