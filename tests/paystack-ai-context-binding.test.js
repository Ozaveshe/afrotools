const test=require("node:test");
const assert=require("node:assert/strict");
const builder=require("../scripts/build-ai-tool-context.js");
const engine=require("../assets/js/engines/paystack-fee-planner.js");

const binding={kind:"paystack-fee-planner",toolId:"paystack-calculator",route:"/tools/paystack-calculator/",artifactPath:"tools/paystack-calculator/index.html",enginePath:"assets/js/engines/paystack-fee-planner.js"};

test("Paystack AI source binding derives dates, rates and digests from exact owners",()=>{
  const record=builder.buildSourceRecord(binding);
  assert.equal(record.facts.version,engine.VERSION);
  assert.equal(record.facts.sourceUrl,engine.SOURCE_URL);
  assert.equal(record.facts.sourceUpdatedAt,engine.SOURCE_UPDATED_AT);
  assert.equal(record.facts.reviewedAt,engine.REVIEWED_AT);
  assert.equal(record.facts.reviewDueAt,engine.REVIEW_DUE_AT);
  assert.equal(record.facts.effectiveDate,null);
  assert.deepEqual(record.facts.countries.map(country=>country.countryCode),["GH","KE","NG","ZA"]);
  assert.equal(record.facts.countries.find(country=>country.countryCode==="NG").channels.find(channel=>channel.channel==="local").waiveFixedBelow,2500);
  assert.equal(record.facts.countries.find(country=>country.countryCode==="ZA").taxRate,.15);
  assert.match(record.facts.artifactDigest,/^sha256:[a-f0-9]{64}$/);
  assert.match(record.facts.engineDigest,/^sha256:[a-f0-9]{64}$/);
  assert.equal(Object.keys(record.facts.localeArtifactDigests).length,2);
  assert.match(record.text,/Effective date: not published/);
});

test("Paystack AI source binding rejects any owner substitution",()=>{
  assert.throws(()=>builder.buildSourceRecord({...binding,route:"/tools/other/"}),/unexpected route/);
  assert.throws(()=>builder.buildSourceRecord({...binding,enginePath:"assets/js/engines/other.js"}),/unexpected enginePath/);
});
