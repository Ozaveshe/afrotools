const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const en = fs.readFileSync(path.join(root, "tools/idea-board/index.html"), "utf8");
const fr = fs.readFileSync(path.join(root, "fr/tools/tableau-idees/index.html"), "utf8");
const controller = fs.readFileSync(path.join(root, "assets/js/pages/idea-evidence-explorer.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "assets/js/engines/idea-evidence-explorer.js"), "utf8");
const registry = fs.readFileSync(path.join(root, "assets/js/components/tool-registry.js"), "utf8");

test("EN and FR are reciprocal native routes using one reviewed implementation", () => {
  for (const html of [en, fr]) {
    assert.match(html, /idea-evidence-explorer\.css/);
    assert.match(html, /idea-evidence-explorer\.js/);
    assert.doesNotMatch(html, /<iframe|cdn\.jsdelivr|fonts\.googleapis|english-df-app-upgrades/i);
    assert.match(html, /hreflang="en"[^>]+\/tools\/idea-board\//);
    assert.match(html, /hreflang="fr"[^>]+\/fr\/tools\/tableau-idees\//);
  }
  assert.match(en, /data-locale="en"/);
  assert.match(fr, /data-locale="fr"/);
});

test("public copy retires fabricated count, profitability, real-data and AI claims", () => {
  for (const html of [en, fr]) {
    assert.doesNotMatch(html, /11,?000|11,?016|profitable|AI Business Advisor|real costs|real data|auto(?:matic)? save|collaborat/i);
    assert.match(html, /submitted planning estimates|estimations de planification soumises/i);
  }
  assert.doesNotMatch(registry.match(/\{ id: 'idea-board'.*?\},/s)[0], /11,?000|profitable|real costs/i);
});

test("controller uses safe DOM and contains no community or generative-AI writes", () => {
  assert.doesNotMatch(controller, /\.innerHTML|insertAdjacentHTML|community_ideas|idea_votes|idea_saves|ai-advisor|AfroAuth/i);
  assert.match(controller, /textContent/);
  assert.match(controller, /aria-modal/);
  assert.match(controller, /Escape/);
  assert.match(controller, /formula-safe|safeCsv/i);
});

test("engine queries only read-only business evidence and normalizes every row", () => {
  assert.match(engine, /\.netlify\/functions\/idea-evidence/);
  assert.match(engine, /normalizeRows/);
  assert.match(engine, /AbortController/);
  assert.match(engine, /DEFAULT_TIMEOUT_MS/);
  assert.doesNotMatch(engine, /community_ideas|idea_votes|idea_saves|method:"POST"|method:"DELETE"/);
});

test("visible FAQ questions and answers exactly match FAQPage structured data", () => {
  for (const html of [en, fr]) {
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    const faq = schemas.find(value => value["@type"] === "FAQPage");
    const block = html.match(/<section class="iee-faq"[\s\S]*?<\/section>/)[0];
    const visible = [...block.matchAll(/<details><summary>(.*?)<\/summary><p>(.*?)<\/p><\/details>/g)].map(match => ({ question:match[1], answer:match[2] }));
    const structured = faq.mainEntity.map(item => ({ question:item.name, answer:item.acceptedAnswer.text }));
    assert.deepEqual(visible, structured);
  }
});
