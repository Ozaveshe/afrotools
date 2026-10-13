'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { before, after, test } = require('node:test');
const esbuild = require('esbuild');
const manifestApi = require('../assets/js/ai/tool-manifest.js');

const root = path.resolve(__dirname, '..');
const source = require('../netlify/functions/ai-route-intent.js');
const directory = require('../data/tool-directory.json');
const manifest = manifestApi.getToolManifestForRouter(manifestApi.buildToolManifest(directory));
const originalFetch = global.fetch;
const originalProvider = process.env.AFROTOOLS_AI_PROVIDER;
let scratch, packaged, graph, fetchCalls = 0;

before(async () => {
  scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-ai-router-'));
  const output = path.join(scratch, 'router.cjs');
  graph = await esbuild.build({
    entryPoints: [path.join(root, 'netlify/functions/ai-route-intent.js')],
    bundle: true, platform: 'node', format: 'cjs', target: 'node22',
    outfile: output, metafile: true, logLevel: 'silent'
  });
  process.env.AFROTOOLS_AI_PROVIDER = 'disabled';
  global.fetch = async () => { fetchCalls += 1; throw new Error('No-consent routing must not call a provider'); };
  packaged = require(output);
});

after(() => {
  global.fetch = originalFetch;
  if (originalProvider === undefined) delete process.env.AFROTOOLS_AI_PROVIDER;
  else process.env.AFROTOOLS_AI_PROVIDER = originalProvider;
  const target = path.resolve(scratch || '');
  const allowedRoot = path.resolve(os.tmpdir()) + path.sep;
  assert.ok(target.startsWith(allowedRoot) && path.basename(target).startsWith('afrotools-ai-router-'));
  fs.rmSync(target, {recursive: true, force: true});
});

function event(query, index = 0, locale = 'en') {
  return {httpMethod: 'POST', headers: {origin: 'https://afrotools.com', 'x-forwarded-for': '203.0.113.' + (80 + index)},
    body: JSON.stringify({query, locale, consentToModel: false})};
}

test('relocated bundle contains the entire current canonical directory', () => {
  const directoryInput = Object.entries(graph.metafile.inputs).find(([file]) => file.replace(/\\/g, '/').endsWith('/data/tool-directory.json') || file === 'data/tool-directory.json');
  assert.ok(directoryInput, 'The deployable module graph must contain canonical directory JSON');
  assert.equal(directoryInput[1].bytes, fs.statSync(path.join(root, 'data/tool-directory.json')).size);
  assert.ok(directory.length >= 1000);
  assert.equal(manifest.length, directory.length, 'Preserve the original full-catalog contract, including unique routes');
  assert.ok(!fs.existsSync(path.join(scratch, 'data/tool-directory.json')), 'No repository file accompanies the isolated package');
});

test('packaged no-consent free-tool routing retains names, routes, aliases, countries and locale behavior', async () => {
  const cases = [
    ['Find a Nigeria VAT calculator', 'en'],
    ['passport application checklist for Ghana', 'en'],
    ['generate an NDA for a client in Ghana', 'en'],
    ['compare mobile money fees in Kenya', 'en'],
    ['Calculer la TVA Nigeria', 'fr'],
    ['Kikokotoo cha VAT Nigeria', 'sw']
  ];
  for (let index = 0; index < cases.length; index += 1) {
    const [query, locale] = cases[index];
    const expected = await source.handler(event(query, index, locale));
    const actual = await packaged.handler(event(query, index + 20, locale));
    assert.equal(expected.statusCode, 200);
    assert.equal(actual.statusCode, 200, 'A relocated package must route without runtime filesystem data');
    const expectedBody = JSON.parse(expected.body), body = JSON.parse(actual.body);
    assert.deepEqual(body.decision, expectedBody.decision);
    assert.deepEqual(body.toolCall, expectedBody.toolCall);
    assert.deepEqual(body.toolCandidates, expectedBody.toolCandidates);
    assert.equal(body.telemetry.modelCalled, false);
    assert.equal(body.telemetry.providerUsed, false);
    const entry = manifest.find(tool => tool.id === body.decision.selectedToolId);
    if (entry) {
      assert.equal(body.toolCall.title, entry.title);
      assert.equal(body.toolCall.route, entry.route);
      assert.equal(body.toolCall.privacyMode, entry.privacyMode);
      assert.equal(body.toolCall.safetyDomain, entry.highStakesDomain);
    }
  }
  assert.equal(fetchCalls, 0);
});

test('packaged method and malformed-input guards stay intact', async () => {
  assert.equal((await packaged.handler({...event('synthetic'), httpMethod: 'GET'})).statusCode, 405);
  assert.equal((await packaged.handler({...event('synthetic'), body: '{'})).statusCode, 400);
  assert.equal((await packaged.handler(event('x'.repeat(2000), 49))).statusCode, 413);
  assert.equal(fetchCalls, 0);
});

