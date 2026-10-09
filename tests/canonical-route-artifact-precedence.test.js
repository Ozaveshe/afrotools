'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { startCanonicalRouteArtifactServer } = require('./support/canonical-route-artifact-server');

async function fixture(t, redirects, files = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-route-order-'));
  for (const [file, content] of Object.entries({ 'index.html': 'root', '_redirects': redirects, ...files })) {
    const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content);
  }
  const server = await startCanonicalRouteArtifactServer(root);
  t.after(async () => {
    await server.close();
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved).toLowerCase(), fs.realpathSync(os.tmpdir()).toLowerCase());
    assert(path.basename(resolved).startsWith('afrotools-route-order-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  return url => fetch(server.baseURL + url, { redirect: 'manual' });
}

test('earlier non-forced placeholder beats a later forced alias when no static file shadows it', async t => {
  const request = await fixture(t, '/fr/:country/:page /:country/:page 301\n/fr/example/tax.html /fr/example/tax/ 301!\n', { 'fr/example/tax/index.html': 'French calculator' });
  const response = await request('/fr/example/tax.html');
  assert.equal(response.status, 301); assert.equal(response.headers.get('location'), '/example/tax.html');
});

test('static file shadows the first non-forced match without jumping to a later forced rule', async t => {
  const request = await fixture(t, '/fr/:country/:page /:country/:page 301\n/fr/example/tax.html /fr/example/tax/ 301!\n', { 'fr/example/tax.html': 'Existing French page' });
  const response = await request('/fr/example/tax.html');
  assert.equal(response.status, 200); assert.equal(await response.text(), 'Existing French page');
});

test('an earlier forced alias redirects even when its static source file exists', async t => {
  const request = await fixture(t, '/fr/example/tax.html /fr/example/tax/ 301!\n/fr/:country/:page /:country/:page 301\n', { 'fr/example/tax.html': 'Existing French page' });
  const response = await request('/fr/example/tax.html');
  assert.equal(response.status, 301); assert.equal(response.headers.get('location'), '/fr/example/tax/');
});

const aliases = {
  '/fr/cape-verde/cv-paye.html': '/fr/cape-verde/cv-paye/',
  '/fr/cape-verde/cv-vat.html': '/fr/cape-verde/cv-vat/',
  '/fr/eq-guinea/gq-paye.html': '/fr/eq-guinea/gq-paye/',
  '/fr/eq-guinea/gq-vat.html': '/fr/eq-guinea/gq-vat/',
  '/fr/cote-divoire/ci-paye.html': '/fr/cote-divoire/calculateur-salaire-net'
};
for (const [source, target] of Object.entries(aliases)) test('generated redirect order retains French for ' + source, async t => {
  const redirects = fs.readFileSync(path.join(__dirname, '../_redirects'), 'utf8');
  const files = source.includes('cote-divoire') ? { [source.slice(1)]: 'Existing native French control' } : { [target.slice(1) + 'index.html']: 'Native French calculator' };
  const request = await fixture(t, redirects, files);
  const response = await request(source);
  assert.equal(response.status, 301); assert.equal(response.headers.get('location'), target);
});
