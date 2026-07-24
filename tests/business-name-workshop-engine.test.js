const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/engines/business-name-workshop.js");

function fixture(overrides = {}) {
  return Object.assign({
    industry: "technology",
    audience: "regional",
    tone: "modern",
    style: "mixed",
    maxLength: 20,
    batch: 0,
    keywords: "trust, payments, quick",
    localWord: ""
  }, overrides);
}

test("generates a deterministic bounded shortlist with transparent factors", () => {
  const first = engine.generate(fixture());
  const second = engine.generate(fixture());
  assert.equal(first.valid, true);
  assert.deepEqual(first, second);
  assert.ok(first.suggestions.length >= 16 && first.suggestions.length <= 20);
  assert.equal(new Set(first.suggestions.map((item) => item.name.toLowerCase())).size, first.suggestions.length);
  first.suggestions.forEach((item) => {
    assert.ok(item.name.length <= 20);
    assert.ok(item.score >= 0 && item.score <= 100);
    assert.deepEqual(Object.keys(item.factors), ["withinLengthTarget", "oneOrTwoWords", "keywordConnection", "noTripleCharacter", "simpleCharacters"]);
  });
});

test("batch changes are reproducible without random state", () => {
  const first = engine.generate(fixture({ batch: 1 }));
  const repeat = engine.generate(fixture({ batch: 1 }));
  const next = engine.generate(fixture({ batch: 2 }));
  assert.deepEqual(first, repeat);
  assert.notDeepEqual(first.suggestions.map((item) => item.name), next.suggestions.map((item) => item.name));
});

test("unsafe markup is normalized as plain input and never appears as markup", () => {
  const result = engine.generate(fixture({ keywords: '<img src=x onerror=alert(1)>, trust', localWord: "<script>boom</script>" }));
  assert.equal(result.valid, true);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /<img|<script|onerror=/i);
  assert.match(serialized, /Trust/);
});

test("local word is user-provided text and carries no invented gloss", () => {
  const result = engine.generate(fixture({ localWord: "Umoja" }));
  assert.equal(result.inputs.localWord, "Umoja");
  assert.ok(result.suggestions.some((item) => item.name.toLowerCase().includes("umoja")));
  assert.equal(Object.hasOwn(result.inputs, "meaning"), false);
  result.suggestions.forEach((item) => {
    assert.equal(Object.hasOwn(item, "meaning"), false);
    assert.equal(Object.hasOwn(item, "translation"), false);
    assert.equal(Object.hasOwn(item, "language"), false);
  });
});

test("invalid enums, missing keywords, excessive sizes and invalid batches fail closed", () => {
  [
    fixture({ industry: "unknown" }),
    fixture({ audience: "" }),
    fixture({ tone: "magic" }),
    fixture({ style: "ai" }),
    fixture({ maxLength: 8 }),
    fixture({ maxLength: 33 }),
    fixture({ batch: -1 }),
    fixture({ keywords: "<>" })
  ].forEach((input) => assert.equal(engine.generate(input).valid, false));
});
