#!/usr/bin/env node
"use strict";
const assert = require("assert");
const engine = require("../assets/js/engines/crypto-scam-evidence.js");

const result = engine.summarize({
  incidentLabel: "Unexpected support message",
  incidentDate: "2026-07-20",
  platform: "Example platform",
  contactReference: "@example",
  currency: "ngn",
  redFlags: ["Urgency", "Secret requested", "Urgency"],
  evidenceNotes: "screenshot-1.png\ntransaction receipt",
  timelineNotes: "09:15 message\n10:05 official support contacted",
  losses: [{ label: "Transfer", amount: "1200" }, { label: "Fee", amount: 300 }]
});
assert.strictEqual(result.completedSections, 6);
assert.strictEqual(result.status, "organized");
assert.strictEqual(result.redFlagCount, 2);
assert.strictEqual(result.evidenceCount, 2);
assert.strictEqual(result.timelineCount, 2);
assert.strictEqual(result.lossCount, 2);
assert.strictEqual(result.record.totalLoss, 1500);
assert.strictEqual(result.record.currency, "NGN");
assert.match(result.boundary, /does not determine/i);

assert.strictEqual(engine.summarize({ currency:"USD" }).status, "started");
assert.strictEqual(engine.summarize({ currency:"USD", evidenceNotes:"a\n\nb" }).evidenceCount, 2);
assert.throws(() => engine.summarize({ currency:"US" }), /three-letter/);
assert.throws(() => engine.summarize({ currency:"USD", incidentDate:"2026-02-30" }), /not valid/);
assert.throws(() => engine.summarize({ currency:"USD", incidentDate:"2999-01-01" }), /future/);
assert.throws(() => engine.summarize({ currency:"USD", losses:[{ amount:-1 }] }), /non-negative/);
assert.throws(() => engine.summarize({ currency:"USD", losses:[{ amount:Infinity }] }), /bounded/);
assert.strictEqual(engine.summarize({ currency:"USD", incidentLabel:"x".repeat(200) }).record.incidentLabel.length, 80);
console.log("crypto scam evidence engine: ok");
