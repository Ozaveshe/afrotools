const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('assets/js/health-workflow.js', 'utf8');
const sentinel = 'PRIVATE_HEALTH_SENTINEL_9A7';

function createHarness(options = {}) {
  const storage = new Map();
  const requests = [];
  const scripts = [];
  const downloads = [];
  const upserts = [];
  const analytics = [];
  const appended = [];
  const sectionAttrs = {
    'data-health-tool-id': 'privacy-health',
    'data-health-tool-name': 'Privacy Health',
    'data-health-href': '/tools/privacy-health/',
    'data-health-bucket': 'vitals',
    'data-health-source-name': 'Local source',
    'data-health-source-url': 'https://example.test/source',
  };
  const section = {
    getAttribute(name) {
      return sectionAttrs[name] || '';
    },
  };

  function element(tagName = 'div') {
    const attrs = {};
    return {
      tagName: tagName.toUpperCase(),
      className: '',
      textContent: '',
      hidden: false,
      classList: { add() {}, remove() {}, contains() { return false; } },
      setAttribute(name, value) { attrs[name] = String(value); },
      getAttribute(name) { return attrs[name] || ''; },
      appendChild(child) { appended.push(child); },
      querySelector() { return null; },
      querySelectorAll() { return []; },
      addEventListener() {},
      remove() {},
      click() {
        if (this.tagName === 'A') {
          downloads.push({
            href: this.href,
            download: this.download,
            noPdfGate: attrs['data-no-pdf-gate'],
            noGate: attrs['data-no-gate'],
          });
        }
      },
      closest(selector) {
        return selector.includes('health-action-kit') || selector.includes('section[data-health-tool-id]')
          ? section
          : null;
      },
    };
  }

  const document = {
    readyState: 'loading',
    title: 'Privacy Health | AfroTools',
    referrer: `https://referrer.test/${sentinel}`,
    head: {
      appendChild(node) {
        appended.push(node);
        if (node.tagName === 'SCRIPT') {
          scripts.push(node.src);
          if (options.failPdfRuntime) {
            if (node.onerror) node.onerror(new Error('offline'));
            return;
          }
          window.jspdf = { jsPDF: FakeJsPdf };
          if (node.onload) node.onload();
        }
      },
    },
    body: { appendChild(node) { appended.push(node); } },
    addEventListener() {},
    getElementById() { return null; },
    querySelector(selector) {
      if (selector === 'h1') return { textContent: 'Privacy Health' };
      if (selector.includes('[data-health-tool-id')) return section;
      return null;
    },
    createElement(tagName) { return element(tagName); },
  };

  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); },
  };

  function FakeJsPdf() {}
  FakeJsPdf.prototype.setFont = function () {};
  FakeJsPdf.prototype.setFontSize = function () {};
  FakeJsPdf.prototype.setTextColor = function () {};
  FakeJsPdf.prototype.text = function () {};
  FakeJsPdf.prototype.splitTextToSize = function (text) { return [String(text)]; };
  FakeJsPdf.prototype.output = function (kind) {
    assert.strictEqual(kind, 'blob');
    return new Blob(['local pdf']);
  };

  const window = {
    document,
    localStorage,
    location: {
      href: `https://example.test/tools/privacy-health/?secret=${sentinel}`,
      origin: 'https://example.test',
      pathname: '/tools/privacy-health/',
    },
    innerWidth: 375,
    setTimeout(callback) { callback(); return 1; },
    clearTimeout() {},
    dispatchEvent() {},
    confirm() { return Boolean(options.confirmSync); },
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init && init.detail;
    },
    AfroWorkspace: {
      isSignedIn() { return Boolean(options.signedIn); },
      upsert(payload) {
        upserts.push(payload);
        return options.failSync ? Promise.reject(new Error('sync failed')) : Promise.resolve();
      },
    },
    AfroTools: {
      analytics: {
        track(name, payload) { analytics.push({ name, payload }); },
      },
    },
  };
  if (options.preloadedPdf !== false) window.jspdf = { jsPDF: FakeJsPdf };
  window.window = window;

  const URL = {
    createObjectURL() { return 'blob:local-health-pdf'; },
    revokeObjectURL() {},
  };

  const fetch = (url, init) => {
    requests.push({ url: String(url), init: init || {} });
    return options.failFetch ? Promise.reject(new Error('network failed')) : Promise.resolve({ ok: true });
  };

  const context = {
    window,
    document,
    localStorage,
    location: window.location,
    CustomEvent: window.CustomEvent,
    URL,
    Blob,
    fetch,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    console,
  };
  vm.createContext(context);
  vm.runInContext(source, context, { filename: 'health-workflow.js' });

  const trigger = element('button');
  trigger.setAttribute('data-health-tool-id', 'privacy-health');

  return { window, trigger, storage, requests, scripts, downloads, upserts, analytics, appended };
}

(async () => {
  for (const signedIn of [false, true]) {
    const harness = createHarness({ signedIn });
    harness.window.AfroHealthWorkflow.recordSnapshot({
      toolId: 'privacy-health',
      headline: 'Private result',
      fields: [{ label: 'Measurement', value: sentinel }],
    });
    const plan = harness.window.AfroHealthWorkflow.buildPlan(harness.trigger);
    const result = await harness.window.AfroHealthWorkflow.downloadPlanPdf(plan);

    assert.strictEqual(result.success, true);
    assert.strictEqual(harness.requests.length, 0, 'PDF must make no fetches');
    assert.strictEqual(harness.upserts.length, 0, 'PDF must make no workspace upserts');
    assert.strictEqual(harness.storage.has('afro_health_plans'), false, 'PDF must not save a plan');
    assert.strictEqual(harness.storage.has('afrotools_health_pdf_lead'), false, 'legacy lead cache must stay absent');
    assert.strictEqual(harness.scripts.length, 0, 'preloaded local runtime requires no script');
    assert.strictEqual(harness.downloads.length, 1);
    assert.strictEqual(harness.downloads[0].noPdfGate, 'true');
    assert.strictEqual(harness.downloads[0].noGate, 'true');
    assert.match(harness.downloads[0].download, /\.pdf$/);
  }

  {
    const harness = createHarness({ signedIn: true });
    const plan = harness.window.AfroHealthWorkflow.buildPlan(harness.trigger);
    assert.strictEqual(harness.window.AfroHealthWorkflow.savePlanToDevice(plan), true);
    assert.strictEqual(harness.upserts.length, 0, 'device save must remain local while signed in');
    assert.strictEqual(harness.requests.length, 0);
    assert(JSON.parse(harness.storage.get('afro_health_plans')).length === 1);
  }

  {
    const harness = createHarness({ preloadedPdf: false });
    const plan = harness.window.AfroHealthWorkflow.buildPlan(harness.trigger);
    const result = await harness.window.AfroHealthWorkflow.downloadPlanPdf(plan);
    assert.strictEqual(result.success, true);
    assert.deepStrictEqual(harness.scripts, ['/assets/vendor/jspdf/jspdf.umd.min.js']);
    assert.strictEqual(harness.requests.length, 0);
  }

  {
    const harness = createHarness({ preloadedPdf: false, failPdfRuntime: true });
    const plan = harness.window.AfroHealthWorkflow.buildPlan(harness.trigger);
    const result = await harness.window.AfroHealthWorkflow.downloadPlanPdf(plan);
    assert.strictEqual(result.success, false);
    assert.deepStrictEqual(harness.scripts, ['/assets/vendor/jspdf/jspdf.umd.min.js']);
    assert.strictEqual(harness.downloads.length, 0);
    assert.strictEqual(harness.requests.length, 0);
    assert.strictEqual(harness.upserts.length, 0);
    assert.strictEqual(harness.storage.has('afro_health_plans'), false);
  }

  {
    const harness = createHarness({ signedIn: true });
    const plan = harness.window.AfroHealthWorkflow.buildPlan(harness.trigger);
    const cancelled = await harness.window.AfroHealthWorkflow.syncPlanToAccount(plan, false);
    assert.strictEqual(cancelled.synced, false);
    assert.strictEqual(harness.upserts.length, 0);
    const synced = await harness.window.AfroHealthWorkflow.syncPlanToAccount(plan, true);
    assert.strictEqual(synced.synced, true);
    assert.strictEqual(harness.upserts.length, 1);
    const payload = JSON.stringify(harness.upserts[0]);
    assert(!payload.includes('snapshot'));
    assert(!payload.includes('inputs'));
    assert(!payload.includes(sentinel));
    assert.strictEqual(harness.upserts[0].summary, 'Health plan saved on this device.');
  }

  {
    const harness = createHarness();
    const cancelled = await harness.window.AfroHealthWorkflow.captureHealthEmailOptIn({
      email: 'person@example.test',
      consent: false,
    });
    assert.strictEqual(cancelled.captured, false);
    assert.strictEqual(harness.requests.length, 0);

    const accepted = await harness.window.AfroHealthWorkflow.captureHealthEmailOptIn({
      email: 'person@example.test',
      name: 'Synthetic Person',
      country: 'NG',
      toolSlug: 'privacy-health',
      consent: true,
      plan: sentinel,
    });
    assert.strictEqual(accepted.captured, true);
    assert.strictEqual(harness.requests.length, 1);
    assert.strictEqual(harness.requests[0].url, '/api/capture-lead');
    const body = JSON.parse(harness.requests[0].init.body);
    assert.strictEqual(body.optInDigest, true);
    assert.strictEqual(body.pageUrl, 'https://example.test/tools/privacy-health/');
    assert.strictEqual(body.referrerUrl, '');
    assert(!JSON.stringify(body).includes(sentinel));
  }

  {
    const harness = createHarness({ signedIn: true, failSync: true });
    const plan = harness.window.AfroHealthWorkflow.buildPlan(harness.trigger);
    harness.window.AfroHealthWorkflow.savePlanToDevice(plan);
    const before = harness.storage.get('afro_health_plans');
    const result = await harness.window.AfroHealthWorkflow.syncPlanToAccount(plan, true);
    assert.strictEqual(result.synced, false);
    assert.strictEqual(harness.storage.get('afro_health_plans'), before);
  }

  const staticSource = source;
  assert(!staticSource.includes('cdn.jsdelivr.net'));
  assert(!staticSource.includes('cdnjs'));
  assert(!staticSource.includes('afrotools_health_pdf_lead'));
  assert(!staticSource.includes('health-pdf-gate'));
  assert(staticSource.includes('/assets/vendor/jspdf/jspdf.umd.min.js'));

  console.log('health-workflow privacy tests passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
