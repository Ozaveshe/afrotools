const assert = require("assert");

const previousAnthropicKey = process.env.ANTHROPIC_API_KEY;
delete process.env.ANTHROPIC_API_KEY;

delete require.cache[require.resolve("../netlify/functions/ai-advisor.js")];
const advisor = require("../netlify/functions/ai-advisor.js");
const guard = require("../netlify/functions/_shared/ai-consent-guard.js");

function event(body, headers) {
  return {
    httpMethod: "POST",
    headers: Object.assign({
      origin: "https://afrotools.com",
      "x-forwarded-for": "203.0.113.60",
    }, headers || {}),
    body: JSON.stringify(body || {}),
  };
}

async function run() {
  assert.strictEqual(guard.hasSensitivePayload({ documentContent: "Synthetic fixture" }), true);
  assert.strictEqual(guard.hasSensitivePayload({ message: "Explain this result" }), false);

  const noAdvisorConsent = await advisor.handler(event({
    tool: "cv-builder",
    message: "Improve this CV",
    documentContent: "Synthetic fixture",
  }));
  assert.strictEqual(noAdvisorConsent.statusCode, 428);
  assert.strictEqual(JSON.parse(noAdvisorConsent.body).error, "ai_consent_required");

  const noContentConsent = await advisor.handler(event({
    tool: "cv-builder",
    message: "Improve this CV",
    documentContent: "Synthetic fixture",
  }, {
    "x-afrotools-ai-consent": "accepted",
  }));
  assert.strictEqual(noContentConsent.statusCode, 428);
  assert.strictEqual(JSON.parse(noContentConsent.body).error, "ai_content_consent_required");

  const contentConsent = await advisor.handler(event({
    tool: "cv-builder",
    message: "Improve this CV",
    documentContent: "Synthetic fixture",
  }, {
    "x-afrotools-ai-consent": "accepted",
    "x-afrotools-ai-content-consent": "accepted",
  }));
  assert.strictEqual(contentConsent.statusCode, 200);
  assert.strictEqual(JSON.parse(contentConsent.body).error, "missing_key");
}

run()
  .then(() => {
    if (previousAnthropicKey) process.env.ANTHROPIC_API_KEY = previousAnthropicKey;
    console.log("ai-consent-server.test.js passed");
  })
  .catch((err) => {
    if (previousAnthropicKey) process.env.ANTHROPIC_API_KEY = previousAnthropicKey;
    console.error(err);
    process.exitCode = 1;
  });
