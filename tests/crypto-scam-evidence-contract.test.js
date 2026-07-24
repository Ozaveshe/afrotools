#!/usr/bin/env node
"use strict";
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const en = read("crypto/scam-checker/index.html");
const fr = read("fr/crypto/scam-checker/index.html");
const controller = read("assets/js/pages/crypto-scam-evidence.js");
const fn = read("netlify/functions/crypto-scam.js");
const smoke = read("scripts/crypto-ui-smoke.js");
const registry = read("assets/js/components/tool-registry.js");
const ai = read("assets/js/ai/tool-manifest.js");
const context = JSON.parse(read("data/ai/tool-context/crypto-scam.json"));

for (const html of [en, fr]) {
  assert.match(html, /crypto-scam-evidence\.js/);
  assert.match(html, /data-scam-export="json"/);
  assert.match(html, /data-scam-export="txt"/);
  assert.match(html, /data-scam-export="pdf"/);
  assert.match(html, /private key|clé privée/i);
  assert.match(html, /"@type"\s*:\s*"WebApplication"/);
  assert.match(html, /"@type":"FAQPage"/);
  assert.match(html, /class="scam-card scam-faq"/);
  assert.strictEqual((html.match(/"@type":"Question"/g) || []).length, 3);
  assert.strictEqual((html.match(/<details><summary>/g) || []).length, 3);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
  const faq = schemas.find(schema => schema["@type"] === "FAQPage");
  for (const item of faq.mainEntity) {
    assert.ok(html.includes(`<details><summary>${item.name}</summary><p>${item.acceptedAnswer.text}</p></details>`));
  }
  assert.doesNotMatch(html, /iframe|database lookup|community reports|total lost|search verified|submit report/i);
}
assert.match(fr, /<html\b[^>]*\blang="fr"/);
assert.doesNotMatch(fr, /traduction .*venir|available in English|Ã|â€”|â€™/i);
assert.match(controller, /textContent/);
assert.match(controller, /replaceChildren/);
assert.match(controller, /window\.jspdf\.jsPDF/);
assert.match(controller, /window\.print/);
assert.doesNotMatch(controller, /fetch\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML/);
assert.match(fn, /statusCode:\s*410/);
assert.match(fn, /crypto_scam_endpoint_retired/);
assert.doesNotMatch(fn, /SUPABASE|fetch\(|crypto_scam_reports|verified|reported_by/);
assert.match(smoke, /scamEvidenceResults\[data-result-settled="true"\]/);
assert.doesNotMatch(smoke, /handleCryptoScam|totalLostNGN|check-query|smoke-report/);
assert.match(registry, /id: 'crypto-scam'.*Private browser-local organizer/);
assert.match(ai, /MAJOR_TOOL_OVERRIDES\['crypto-scam'\]/);
assert.match(ai, /crypto-incident-evidence-organization/);
assert.strictEqual(context.status, "unverified-static");
assert.ok(!context.sourceBindings);
assert.match(context.staticText, /without requesting, prefilling, repeating or transmitting/);
assert.match(context.staticText, /Never ask for or echo/);
const css = read("assets/css/crypto-scam-evidence.css");
assert.match(css, /html\[data-theme='dark'\] \.scam-warning/);
assert.match(css, /html:not\(\[data-theme='light'\]\) \.scam-warning/);
console.log("crypto scam evidence contract: ok");
