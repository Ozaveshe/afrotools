const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const script = fs.readFileSync('assets/js/health-workflow.js', 'utf8');

function makeElement() {
  return {
    className: '',
    textContent: '',
    classList: {
      add() {},
      remove() {},
      contains() {
        return false;
      },
    },
    setAttribute() {},
    appendChild() {},
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener() {},
    remove() {},
  };
}

function createHarness() {
  const storage = new Map();
  const sectionAttrs = {
    'data-health-tool-id': 'fake-health',
    'data-health-tool-name': 'Fake Health',
    'data-health-href': '/health/fake-health/',
    'data-health-bucket': 'vitals',
    'data-health-source-name': 'Fake source',
    'data-health-source-url': 'https://example.test/source',
  };
  const section = {
    getAttribute(name) {
      return sectionAttrs[name] || '';
    },
  };
  const rawField = {
    id: 'raw-health-notes',
    type: 'textarea',
    tagName: 'TEXTAREA',
    value: 'PRIVATE_HEALTH_SMOKE patient name and pasted notes',
    closest() {
      return null;
    },
  };
  const main = {
    querySelectorAll() {
      return [rawField];
    },
    querySelector() {
      return null;
    },
  };
  const document = {
    readyState: 'loading',
    referrer: '',
    title: 'Fake Health | AfroTools',
    head: {
      appendChild() {},
    },
    body: {
      appendChild() {},
    },
    addEventListener() {},
    getElementById(id) {
      if (id === 'health-app-root') return main;
      return null;
    },
    querySelector(selector) {
      if (selector === 'main') return main;
      if (selector === 'h1') return { textContent: 'Fake Health' };
      if (selector.includes('[data-health-tool-id')) return section;
      return null;
    },
    createElement() {
      return makeElement();
    },
  };
  const localStorage = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
  };
  const window = {
    document,
    localStorage,
    location: {
      href: 'https://example.test/health/fake-health/',
      pathname: '/health/fake-health/',
    },
    clearTimeout() {},
    setTimeout() {
      return 1;
    },
    dispatchEvent() {},
    CustomEvent: function CustomEvent(type, init) {
      this.type = type;
      this.detail = init && init.detail;
    },
    innerWidth: 1024,
    AfroWorkspace: {
      upsert() {
        return Promise.resolve();
      },
      isSignedIn() {
        return false;
      },
    },
  };
  window.window = window;

  const context = {
    window,
    document,
    localStorage,
    location: window.location,
    CustomEvent: window.CustomEvent,
    setTimeout: window.setTimeout,
    clearTimeout: window.clearTimeout,
    console,
  };
  vm.createContext(context);
  vm.runInContext(script, context, { filename: 'health-workflow.js' });

  const button = {
    getAttribute(name) {
      return name === 'data-health-tool-id' ? 'fake-health' : '';
    },
    closest(selector) {
      if (selector.includes('.health-action-kit') || selector.includes('section[data-health-tool-id]')) {
        return section;
      }
      return null;
    },
  };

  return { window, button, storage };
}

{
  const { window, button } = createHarness();
  const plan = window.AfroHealthWorkflow.savePlan(button);
  const serialized = JSON.stringify(plan);

  assert.strictEqual(plan.snapshot.snapshotSource, 'workflow-shell');
  assert.strictEqual(plan.inputs[0].value, 'Workflow shell only; no form fields captured');
  assert(!serialized.includes('PRIVATE_HEALTH_SMOKE'), 'save without tool snapshot must not scrape page fields');
}

{
  const { window, button } = createHarness();
  window.AfroHealthWorkflow.recordSnapshot({
    toolId: 'fake-health',
    headline: 'Review-ready summary',
    resultText: 'Use this as visit preparation, not a diagnosis.',
    fields: [{ label: 'Status', value: 'Review with clinician' }],
    rawText: 'PRIVATE_HEALTH_SMOKE raw pasted report',
    reportText: 'PRIVATE_HEALTH_SMOKE full report',
  });
  const plan = window.AfroHealthWorkflow.savePlan(button);
  const serialized = JSON.stringify(plan);

  assert.strictEqual(plan.snapshot.snapshotSource, 'tool-owned');
  assert.strictEqual(plan.summary, 'Review-ready summary');
  assert.strictEqual(plan.inputs[0].label, 'Status');
  assert(!serialized.includes('rawText'), 'rawText key must not be persisted');
  assert(!serialized.includes('reportText'), 'reportText key must not be persisted');
  assert(!serialized.includes('PRIVATE_HEALTH_SMOKE'), 'raw pasted report text must not be persisted');
}

{
  const { window, button } = createHarness();
  window.AfroHealthWorkflow.recordSnapshot({
    toolId: 'other-health',
    headline: 'Stale snapshot from another tool',
    fields: [{ label: 'Other', value: 'Other value' }],
  });
  const plan = window.AfroHealthWorkflow.savePlan(button);
  const serialized = JSON.stringify(plan);

  assert.strictEqual(plan.snapshot.snapshotSource, 'workflow-shell');
  assert(!serialized.includes('Stale snapshot from another tool'), 'mismatched tool snapshots must not be reused');
}

console.log('health-workflow snapshot tests passed');
