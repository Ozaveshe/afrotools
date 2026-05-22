const assert = require('assert');
const path = require('path');

const {
  saveScholarshipForUser,
  updateReminderForUser
} = require(path.join(__dirname, '..', 'netlify/functions/_shared/scholarship-platform.js'));

function createMockClient(settings) {
  const options = settings || {};
  const calls = [];
  const scholarship = Object.assign({
    id: 'sch-1',
    title: 'Verified scholarship',
    provider: 'Official provider',
    official_url: 'https://example.edu/scholarship',
    source_url: 'https://example.edu/scholarship',
    deadline_date: '2026-06-05',
    deadline_text: 'June 5, 2026',
    confidence_mode: 'live',
    status: 'open',
    is_active: true,
    raw_snapshot: {}
  }, options.scholarship || {});

  function chain(table, state) {
    const local = state || { table: table, filters: [] };
    const api = {
      select: function (columns) {
        calls.push({ table: table, op: 'select', columns: columns });
        local.select = columns;
        return api;
      },
      eq: function (column, value) {
        calls.push({ table: table, op: 'eq', column: column, value: value });
        local.filters.push([column, value]);
        return api;
      },
      order: function (column, orderOptions) {
        calls.push({ table: table, op: 'order', column: column, options: orderOptions });
        if (table === 'user_saved_scholarships') {
          return Promise.resolve({ data: options.savedRowsForList || [], error: null });
        }
        return Promise.resolve({ data: [], error: null });
      },
      maybeSingle: function () {
        calls.push({ table: table, op: 'maybeSingle' });
        if (table === 'scholarships') return Promise.resolve({ data: scholarship, error: null });
        if (table === 'user_saved_scholarships') {
          return Promise.resolve({ data: options.hasActiveSave ? { id: 'save-1' } : null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      },
      upsert: function (payload, upsertOptions) {
        calls.push({ table: table, op: 'upsert', payload: payload, options: upsertOptions });
        if (table === 'user_scholarship_reminders') {
          return {
            select: function () {
              return Promise.resolve({
                data: [{
                  id: 'reminder-1',
                  scholarship_id: payload.scholarship_id,
                  reminder_type: payload.reminder_type,
                  offsets: payload.offsets,
                  enabled: payload.enabled,
                  last_sent_at: null
                }],
                error: null
              });
            }
          };
        }
        return Promise.resolve({ data: null, error: null });
      },
      update: function (payload) {
        calls.push({ table: table, op: 'update', payload: payload });
        return {
          eq: function () {
            return {
              eq: function () {
                return Promise.resolve({ data: [], error: null });
              }
            };
          }
        };
      }
    };
    return api;
  }

  return {
    calls: calls,
    from: function (table) {
      calls.push({ table: table, op: 'from' });
      return chain(table);
    }
  };
}

(async function run() {
  const saveClient = createMockClient();
  await saveScholarshipForUser(saveClient, 'user-1', {
    scholarship_id: 'sch-1',
    priority: 'normal'
  });

  const reminderUpsert = saveClient.calls.find(function (call) {
    return call.table === 'user_scholarship_reminders' && call.op === 'upsert';
  });
  assert(reminderUpsert, 'saving a scholarship should upsert a reminder preference row');
  assert.strictEqual(reminderUpsert.payload.enabled, false, 'saving must not enable reminders by default');

  const orphanClient = createMockClient({ hasActiveSave: false });
  await assert.rejects(
    function () {
      return updateReminderForUser(orphanClient, 'user-1', {
        scholarship_id: 'sch-1',
        enabled: true
      });
    },
    /Save the scholarship before enabling reminders/,
    'reminders should require an active saved scholarship'
  );

  const orphanReminderUpsert = orphanClient.calls.find(function (call) {
    return call.table === 'user_scholarship_reminders' && call.op === 'upsert';
  });
  assert.strictEqual(orphanReminderUpsert, undefined, 'orphan reminder requests must not create reminder rows');

  const savedClient = createMockClient({
    hasActiveSave: true,
    savedRowsForList: []
  });
  await updateReminderForUser(savedClient, 'user-1', {
    scholarship_id: 'sch-1',
    enabled: true,
    offsets: [7, 1]
  });

  const enabledReminderUpsert = savedClient.calls.find(function (call) {
    return call.table === 'user_scholarship_reminders' && call.op === 'upsert';
  });
  assert(enabledReminderUpsert, 'saved scholarships should allow reminder updates');
  assert.strictEqual(enabledReminderUpsert.payload.enabled, true, 'explicit reminder opt-in should be preserved');

  console.log('Scholarship save/reminder contract verified.');
})().catch(function (error) {
  console.error(error.stack || error.message);
  process.exit(1);
});
