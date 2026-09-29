const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/african-workflow.js'), 'utf8');
const toolId = 'amount-words-gh';
const routeId = 'relocation';
const messages = {
  tool: { success: 'Saved to your African workflow on this device.', failure: 'This browser could not save your African workflow on this device.' },
  route: { success: 'Route saved on this device. Open the dashboard workspace to continue from the first tool.', failure: 'This browser could not save this route on this device.' },
};

function fixture(options = {}) {
  const stored = new Map();
  const writes = [], events = [], favorites = [], cloudCalls = [];
  const context = {
    document: { readyState: 'loading', addEventListener() {} },
    location: { pathname: '/tools/amount-words-gh/' },
    localStorage: {
      getItem(key) { return stored.get(key) ?? null; },
      setItem(key, value) {
        writes.push({ key, value });
        if (options.denied) throw new Error('Synthetic denied local write');
        stored.set(key, value);
      },
    },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    dispatchEvent(event) {
      if (options.eventFailure) throw new Error('Synthetic listener dispatch failure');
      events.push(event);
    },
    afroFavs: { save(id) { favorites.push(id); } },
    printCalls: 0,
    print() { this.printCalls++; },
  };
  if (options.cloud) context.AfroWorkspace = {
    isSignedIn: () => options.cloud !== 'signed-out',
    async upsert(payload) {
      cloudCalls.push(JSON.parse(JSON.stringify(payload)));
      if (options.cloud === 'reject') throw new Error('Synthetic unavailable cloud');
      return options.cloud === 'success' ? { id: 'synthetic-workflow-item' } : null;
    },
  };
  context.window = context;
  vm.runInNewContext(source, context, { filename: 'african-workflow.js' });
  return { context, stored, writes, events, favorites, cloudCalls };
}

async function save(state, kind, status = { textContent: '' }) {
  const api = state.context.AfroAfricanWorkflow;
  await (kind === 'tool' ? api.saveToDashboard(toolId, status) : api.saveRoutePlan(routeId, status));
  return status;
}

for (const kind of ['tool', 'route']) {
  test(`${kind} Save confirms only a completed device write`, async () => {
    const state = fixture(), status = await save(state, kind);
    assert.equal(status.textContent, messages[kind].success);
    const items = JSON.parse(state.stored.get('african_workflow_items'));
    assert.equal(items.length, 1);
    assert.equal(items[0].id, kind === 'tool' ? toolId : `route-${routeId}`);
    assert.deepEqual(state.events.map(event => ({ type: event.type, detail: JSON.parse(JSON.stringify(event.detail)) })),
      [{ type: 'afro-workspace-change', detail: { source: 'african-workflow' } }]);
    assert.equal(state.cloudCalls.length, 0);
    if (kind === 'tool') {
      assert.deepEqual(Object.keys(items[0]).sort(), ['id', 'name', 'href', 'group', 'next', 'nextTools', 'sourceName',
        'sourceUrl', 'competitor', 'gap', 'upgrade', 'checks', 'brief', 'savedAt'].sort());
      assert.equal(items[0].href, '/tools/amount-words-gh/');
      assert.deepEqual(state.favorites, [toolId]);
    } else {
      assert.deepEqual(Object.keys(items[0]).sort(), ['id', 'name', 'href', 'group', 'routeId', 'upgrade', 'nextTools', 'checks', 'savedAt'].sort());
      assert.equal(items[0].href, '/tools/japa-calculator/');
      assert.equal(items[0].routeId, routeId);
    }
  });

  test(`${kind} Save reports device denial without a saved item or change event`, async () => {
    const state = fixture({ denied: true }), status = await save(state, kind);
    assert.equal(status.textContent, messages[kind].failure);
    assert.equal(state.stored.has('african_workflow_items'), false);
    assert.equal(state.writes.length, 1);
    assert.equal(state.events.length, 0);
    if (kind === 'tool') assert.deepEqual(state.favorites, [toolId]);
  });

  test(`${kind} a failed notification cannot turn a persisted save into failure`, async () => {
    const state = fixture({ eventFailure: true }), status = await save(state, kind);
    assert.equal(status.textContent, messages[kind].success);
    assert.equal(JSON.parse(state.stored.get('african_workflow_items')).length, 1);
  });

  for (const cloud of ['null', 'reject', 'success']) for (const denied of [false, true]) {
    test(`${kind} device feedback stays truthful when cloud returns ${cloud}, local denied=${denied}`, async () => {
      const state = fixture({ cloud, denied }), status = await save(state, kind);
      assert.equal(status.textContent, messages[kind][denied ? 'failure' : 'success']);
      assert.equal(state.cloudCalls.length, 1, 'Keep the existing optional cloud attempt even after local denial');
      const payload = state.cloudCalls[0];
      assert.equal(payload.itemType, kind === 'tool' ? 'african_workflow' : 'african_workflow_route');
      assert.equal(payload.itemKey, kind === 'tool' ? toolId : `route-${routeId}`);
      assert.deepEqual(payload.payload, JSON.parse(state.writes[0].value)[0]);
      assert.doesNotMatch(status.textContent, /cloud|signed in/i, 'No blanket cloud success is claimed');
      assert.equal(state.stored.has('african_workflow_items'), !denied);
    });
  }
}

test('deduplication and the existing 80-item bound are preserved for both callers', async () => {
  for (const kind of ['tool', 'route']) {
    const state = fixture();
    const id = kind === 'tool' ? toolId : `route-${routeId}`;
    state.stored.set('african_workflow_items', JSON.stringify([{ id }, ...Array.from({ length: 90 }, (_, index) => ({ id: `old-${index}` }))]));
    await save(state, kind);
    const items = JSON.parse(state.stored.get('african_workflow_items'));
    assert.equal(items.length, 80); assert.equal(items[0].id, id);
    assert.equal(items.filter(item => item.id === id).length, 1);
    assert.equal(items.at(-1).id, 'old-78');
  }
});

test('signed-out accounts do not gain a cloud attempt and unknown IDs remain a no-op', async () => {
  const state = fixture({ cloud: 'signed-out' });
  await save(state, 'tool');
  assert.equal(state.cloudCalls.length, 0);
  const before = state.writes.length, status = { textContent: 'Existing feedback' };
  await state.context.AfroAfricanWorkflow.saveToDashboard('unknown-tool', status);
  await state.context.AfroAfricanWorkflow.saveRoutePlan('unknown-route', status);
  assert.equal(state.writes.length, before); assert.equal(status.textContent, 'Existing feedback');
});

test('printWorkflow retains its existing immediate local print without a status node', () => {
  const state = fixture({ denied: true });
  state.context.AfroAfricanWorkflow.printWorkflow(toolId);
  assert.equal(state.context.printCalls, 1);
  assert.equal(state.writes.length, 1);
  assert.deepEqual(state.favorites, [toolId]);
});
