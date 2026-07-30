"use strict";

const assert = require("node:assert");
const fs = require("node:fs");
const vm = require("node:vm");

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync("engines/src/creator-kit-engine.js", "utf8"), context);
const engine = context.window.AfroTools.CreatorKitEngine;

const card = engine.buildLocalRateCard({
  name: "Studio Kora",
  tagline: "Images de marque",
  service: "Séance photo",
  price: "125000",
  currency: "xof",
  description: "10 images retouchées",
  contactEmail: "studio@example.test"
});
assert.equal(card.name, "Studio Kora");
assert.equal(card.currency, "XOF");
assert.equal(card.services.length, 1);
assert.equal(card.services[0].price, 125000);
assert.equal(card.services[0].description, "10 images retouchées");
assert.match(engine.generateWhatsAppText(card), /Studio Kora/);
assert.throws(() => engine.buildLocalRateCard({ service: "Photo", price: 1 }), /name/i);
assert.throws(() => engine.buildLocalRateCard({ name: "Studio", service: "Photo", price: -1 }), /non-negative/i);
console.log("creator-kit native engine: 8 assertions passed");
