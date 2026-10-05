'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const owner = fs.readFileSync(path.join(__dirname, '../assets/js/components/src/ai-consent.js'), 'utf8');
const fixture = 'Synthetic Ɗ É CV input, not an analytics field';

function context(locale = 'en', decisions = [false], savedPromptConsent = true) {
  const storage = new Map(savedPromptConsent ? [['afrotools_ai_advisor_consent', 'accepted']] : []);
  const session = new Map(), dialogs = [], sent = [], events = [];
  const win = {
    document: { readyState: 'loading', documentElement: { lang: locale }, addEventListener() {}, getElementById: () => ({}) },
    AfroTools: { analytics: { track: (name, metadata) => events.push({ name, metadata }) } },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    sessionStorage: { getItem: key => session.get(key) || null, setItem: (key, value) => session.set(key, value) },
    confirm: text => { dialogs.push(text); return decisions.shift() ?? false; },
    fetch: async (url, options) => { sent.push({ url, options }); return new Response('{}', { status: 200 }); }
  };
  vm.runInNewContext(owner, { window: win, Headers, Response, Request, Date });
  return { win, dialogs, sent, events, storage, session };
}

function send(ctx, payload) {
  return ctx.win.fetch('/.netlify/functions/ai-advisor', {
    method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' }
  });
}

const labels = { en: 'Optional AI help for your CV', fr: 'Aide facultative par IA pour votre CV',
  sw: 'Msaada wa AI kwa CV yako (hiari)', ha: 'Taimakon AI na zaɓi don CV ɗinka' };

for (const locale of Object.keys(labels)) test(`${locale}: old general consent cannot send CV messages; decline stays local`, async () => {
  const ctx = context(locale + '-ZZ');
  const response = await send(ctx, { tool: 'cv-builder', messages: [{ role: 'user', content: fixture }] });
  assert.equal(response.status, 428);
  assert.equal((await response.json()).error, 'ai_content_consent_required');
  assert.equal(ctx.sent.length, 0);
  assert.equal(ctx.dialogs.length, 1);
  assert.ok(ctx.dialogs[0].startsWith(labels[locale]));
  assert.equal(ctx.events[0].name, 'ai_consent_declined');
  assert.equal(ctx.events[0].metadata.mode, 'ai_optional_content_included');
  assert.equal(ctx.events[0].metadata.content_included, true);
  assert.equal(ctx.events[0].metadata.action, 'ai-advisor');
  assert.equal(JSON.stringify(ctx.events).includes(fixture), false);
  assert.equal(JSON.stringify([...ctx.session]).includes(fixture), false);
  assert.equal(JSON.stringify([...ctx.storage]).includes(fixture), false);
});

test('CV consent authorizes the exact request and asks again before another action', async () => {
  const ctx = context('fr', [true, false]);
  const payload = { tool: 'cv-builder', messages: [{ role: 'user', content: fixture }] };
  assert.equal((await send(ctx, payload)).status, 200);
  assert.equal(ctx.sent[0].options.headers.get('x-afrotools-ai-content-consent'), 'accepted');
  assert.equal(ctx.sent[0].options.headers.get('x-afrotools-ai-consent'), 'accepted');
  assert.deepEqual(JSON.parse(ctx.sent[0].options.body), payload);
  assert.equal((await send(ctx, { ...payload, cvText: 'Second synthetic input' })).status, 428);
  assert.equal(ctx.dialogs.length, 2);
  assert.equal(ctx.sent.length, 1);
});

test('CV message and named-field payloads require content consent without scanning or logging their text', async () => {
  for (const payload of [{ tool: 'cv-builder', message: fixture }, { tool: 'cv-builder', cvText: fixture },
    { tool: 'cv-builder', context: { jobDescription: fixture } }]) {
    const ctx = context();
    assert.equal(ctx.win.AfroTools.AIConsent.containsSensitivePayload(payload), true);
    assert.equal((await send(ctx, payload)).status, 428);
    assert.equal(ctx.sent.length, 0);
  }
});

test('non-CV prompt and document consent contracts remain distinct', async () => {
  const general = context();
  assert.equal((await send(general, { tool: 'pdf-workspace', message: 'Explain the tool' })).status, 200);
  assert.equal(general.dialogs.length, 0);
  assert.equal(general.sent[0].options.headers.get('x-afrotools-ai-content-consent'), null);
  const document = context();
  assert.equal((await send(document, { tool: 'pdf-workspace', documentContent: fixture })).status, 428);
  assert.equal(document.sent.length, 0);
});

test('CV notice and recovery copy remain native even when the page supplies old English notice attributes', async () => {
  for (const locale of ['fr', 'sw', 'ha']) {
    const ctx = context(locale), attrs = { 'data-consent-mode': 'ai_optional_content_included',
      'data-tool-id': 'cv-builder', 'data-consent-title': 'AI help is optional for CV content',
      'data-consent-copy': 'Old English description', 'data-consent-action-button': 'true' };
    const node = { classList: { add() {} }, getAttribute: key => attrs[key] || null,
      setAttribute: (key, value) => { attrs[key] = value; }, querySelector: () => null };
    ctx.win.AfroTools.AIConsent.renderNotice(node, {});
    assert.ok(node.innerHTML.includes(labels[locale]));
    assert.doesNotMatch(node.innerHTML, /Old English description|What may be sent|Continue without AI|Allow AI with this content/);
    const response = await send(ctx, { tool: 'cv-builder', message: fixture });
    assert.equal((await response.json()).reply.startsWith('AI Advisor was not contacted'), false);
  }
});

test('unavailable confirmation fails closed for CV requests', async () => {
  const ctx = context();
  delete ctx.win.confirm;
  assert.equal((await send(ctx, { tool: 'cv-builder', message: fixture })).status, 428);
  assert.equal(ctx.sent.length, 0);
});
