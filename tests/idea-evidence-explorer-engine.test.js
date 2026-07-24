const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/engines/idea-evidence-explorer.js");

function record(overrides = {}) {
  return Object.assign({
    id:"idea-1", name:"Solar cold storage", country_code:"KE", country_name:"Kenya", sector:"energy", risk:"medium", currency:"KES",
    description:"Cold storage for produce.", startup_cost_min:100000, startup_cost_max:200000, monthly_revenue_min:30000,
    monthly_revenue_max:50000, breakeven_months_min:8, breakeven_months_max:14
  }, overrides);
}

test("normalizes submitted evidence and keeps missing provenance explicit", () => {
  const row = engine.normalizeRow(record({ startup_cost_min:200000, startup_cost_max:100000 }));
  assert.equal(row.name, "Solar cold storage");
  assert.deepEqual(row.startupCost, { min:100000, max:200000 });
  assert.deepEqual(row.source, { name:"", url:"", asOf:"", confidence:"" });
});

test("rejects invalid records and strips executable markup", () => {
  assert.equal(engine.normalizeRow(record({ country_code:"KEN" })), null);
  assert.equal(engine.normalizeRow(record({ sector:"<img src=x onerror=alert(1)>" })), null);
  const row = engine.normalizeRow(record({ name:"<svg onload=alert(1)>Safe name", description:"<script>alert(1)</script>Evidence" }));
  assert.equal(row.name, "Safe name");
  assert.equal(row.description, "alert(1)Evidence");
});

test("constrains URLs, numbers, confidence and arrays", () => {
  const row = engine.normalizeRow(record({
    source_url:"javascript:alert(1)", source_confidence:"certain", startup_cost_min:-1,
    risks:["<img src=x>Supply delay"], best_cities:["Nairobi"], updated_at:"bad"
  }));
  assert.equal(row.source.url, "");
  assert.equal(row.source.confidence, "");
  assert.equal(row.startupCost.min, null);
  assert.deepEqual(row.risks, ["Supply delay"]);
  assert.equal(row.updatedAt, "");
});

test("builds a bounded read-only query", () => {
  const url = engine.buildUrl({ country:"KE", sector:"energy", risk:"low", maxBudget:500000, search:"solar&x=1", sort:"cost", page:2 });
  assert.match(url, /idea-evidence\?/);
  assert.match(url, /country=KE/);
  assert.match(url, /page=2/);
  assert.doesNotMatch(url, /community_ideas|insert|delete/);
  assert.doesNotMatch(url, /solar&x=1/);
});

test("normalizes mocked search results and derives totals from response headers", async () => {
  const result = await engine.search({ country:"KE" }, { fetcher:async () => ({
    ok:true,
    json:async () => ({ rows:[record(), record({id:"idea-2"}), record({id:"bad",country_code:"KEN"})], reportedTotal:3 })
  }) });
  assert.equal(result.state, "ready");
  assert.equal(result.total, 3, "raw dataset-reported total remains separate");
  assert.equal(result.rows.length, 2, "only normalized rows are displayable");
});

test("returns fail-closed timeout, error and empty states", async () => {
  const timeout = await engine.search({}, { timeoutMs:100, fetcher:(_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name:"AbortError" })), { once:true });
  }) });
  assert.equal(timeout.state, "timeout");
  const error = await engine.search({}, { fetcher:async () => ({ ok:false, status:503 }) });
  assert.equal(error.state, "error");
  const empty = await engine.search({}, { fetcher:async () => ({ ok:true, json:async () => ({ rows:[], reportedTotal:0 }) }) });
  assert.equal(empty.state, "empty");
});

test("validates a versioned shortlist backup and rejects malformed payloads", () => {
  const envelope = engine.shortlistEnvelope([record()], "en");
  const restored = engine.validateEnvelope(envelope);
  assert.equal(restored.items.length, 1);
  assert.equal(restored.items[0].id, "idea-1");
  assert.equal(engine.validateEnvelope({ schemaVersion:99, tool:"idea-board", items:[] }), null);
  assert.equal(engine.validateEnvelope({ schemaVersion:1, tool:"idea-board", items:new Array(7).fill(record()) }), null);
});
