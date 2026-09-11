'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

function loadAdvisor(modelText = 'Synthetic study guidance.') {
  const file = path.resolve(__dirname, '../netlify/functions/ai-advisor.js');
  const actual = createRequire(file); const requests = [];
  const sandbox = { exports: {}, process: { env: {} }, Buffer, URL, console: { log() {}, warn() {}, error() {} },
    fetch: async () => { throw new Error('Unexpected live request'); },
    require(id) {
      if (id === './_shared/ai-provider') return {
        getSmartGenerationModel: () => 'synthetic-model',
        getProviderInfo: () => ({ enabled: true }),
        createModelProvider: () => ({ explainResult: async request => { requests.push(request);
          const clean = actual('../../assets/js/ai/guardrails.js').sanitizeModelOutput(modelText, { domain: request.domain, allowedSourceUrls: request.allowedSourceUrls });
          return { ok: true, text: clean.text }; } })
      };
      return actual(id);
    } };
  vm.runInNewContext(fs.readFileSync(file, 'utf8') + '\ncheckRateLimit = async () => ({allowed:true,remaining:2,limit:3});\ncommitRateLimit = async () => {};\nfetchUserContext = async () => {throw new Error("Study requests must not fetch financial history");};', sandbox, { filename: file });
  const send = body => sandbox.exports.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify(body) });
  return { send, requests };
}

for (const [subject, expected] of [['mathematics', 'Mathematics'], ['english', 'Use of English'], ['accounts', 'principles of accounts']]) {
  test('freeform ' + subject + ' keeps its subject context in the actual provider payload', async () => {
    const advisor = loadAdvisor();
    const response = await advisor.send({ tool: 'jamb-study-tutor-' + subject, aiConsent: 'accepted', message: 'Explain this study concept with a simple example.' });
    assert.equal(response.statusCode, 200); assert.equal(advisor.requests.length, 1, response.body);
    const request = advisor.requests[0];
    assert.match(request.system, new RegExp(expected, 'i'));
    assert.doesNotMatch(request.system, /expert in African tax|100 questions in 60|calculator-friendly|Use the user's local currency/);
    assert.equal(request.domain, 'education');
  });
}

test('study-plan uses JSON schedule rules and does not fetch account history', async () => {
  const plan = { summary: 'Synthetic study schedule', days: [{ day: 1, date: '2027-01-01', focus: 'Mathematics', tasks: [{ time: '30 min', task: 'Revise multiplication.' }] }] };
  const advisor = loadAdvisor(JSON.stringify(plan));
  const response = await advisor.send({ tool: 'jamb-study-plan', aiConsent: 'accepted', message: 'Return a JSON study schedule within 60 minutes a day.', study_plan: { days: 1, hours_per_day: 1, start_date: '2027-01-01' } });
  assert.equal(response.statusCode, 200); assert.equal(advisor.requests.length, 1, response.body);
  assert.match(advisor.requests[0].system, /Return only valid JSON/);
  assert.doesNotMatch(advisor.requests[0].system, /expert in African tax|plain conversational sentences/);
  const data = JSON.parse(response.body);
  assert.deepEqual(JSON.parse(data.reply), plan);
  assert.match(data.study_notice, /AI schedule suggestion/);
});

test('consent, reviewed identity and known subject gates run before the model provider', async () => {
  const advisor = loadAdvisor();
  assert.equal((await advisor.send({ tool: 'jamb-study-tutor-mathematics', message: 'Explain multiplication.' })).statusCode, 428);
  assert.equal((await advisor.send({ tool: 'jamb-study-tutor-invented', message: 'Explain multiplication.', aiConsent: 'accepted' })).statusCode, 400);
  assert.equal((await advisor.send({ tool: 'jamb-tutor-mathematics', message: 'A legacy unreviewed bank prompt', aiConsent: 'accepted' })).statusCode, 409);
  assert.equal((await advisor.send(null)).statusCode, 400);
  assert.equal((await advisor.send({ tool: 'jamb-study-plan', aiConsent: 'accepted', message: 'Make a plan.' })).statusCode, 400);
  assert.equal(advisor.requests.length, 0);
});
