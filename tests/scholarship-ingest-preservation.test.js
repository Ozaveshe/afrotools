const assert = require('assert');
const path = require('path');

const {
  buildScholarshipSourceSnapshot,
  fetchMirrorRows,
  importSourceItems,
  preserveAuthoritativeAwardValueCoverage
} = require(path.join(__dirname, '..', 'netlify/functions/_shared/scholarship-platform.js'));

function authoritativeAward(overrides) {
  return Object.assign({
    award_value_min: 2300,
    award_value_max: 2300,
    award_value_amount: 2300,
    award_value_currency: 'CAD',
    award_value_period: 'monthly',
    award_value_text: 'CAD 2,300 monthly living stipend plus tuition and fees.',
    award_components: [{ label: 'Tuition and fees' }, { label: 'Monthly stipend', amount: 2300, currency: 'CAD' }],
    award_value_confidence: 'official',
    award_value_source_url: 'https://provider.example/program',
    award_value_last_checked_at: '2026-08-15T00:00:00.000Z',
    award_value_usd: null
  }, overrides || {});
}

function createImportClient(existingRow) {
  const calls = [];
  return {
    calls: calls,
    from: function (table) {
      if (table === 'scholarship_raw_items') {
        return {
          upsert: function (payload, options) {
            calls.push({ table: table, op: 'upsert', payload: payload, options: options });
            return Promise.resolve({ error: null });
          }
        };
      }

      assert.strictEqual(table, 'scholarships');
      return {
        select: function (columns) {
          calls.push({ table: table, op: 'select', columns: columns });
          return {
            in: function (column, slugs) {
              calls.push({ table: table, op: 'in', column: column, slugs: slugs, columns: columns });
              if (columns === 'id, slug') {
                return Promise.resolve({ data: [{ id: 'sch-1', slug: existingRow.slug }], error: null });
              }
              return Promise.resolve({ data: [existingRow], error: null });
            }
          };
        },
        upsert: function (payload, options) {
          calls.push({ table: table, op: 'upsert', payload: payload, options: options });
          return Promise.resolve({ error: null });
        }
      };
    }
  };
}

function createMirrorClient() {
  const calls = [];
  return {
    calls: calls,
    from: function (table) {
      assert.strictEqual(table, 'scholarships', 'empty mirror result should not need a source lookup');
      const api = {
        select: function (columns) {
          calls.push({ op: 'select', columns: columns });
          return api;
        },
        eq: function (column, value) {
          calls.push({ op: 'eq', column: column, value: value });
          return api;
        },
        order: function (column, options) {
          calls.push({ op: 'order', column: column, options: options });
          return api;
        },
        limit: function (value) {
          calls.push({ op: 'limit', value: value });
          return Promise.resolve({ data: [], error: null });
        }
      };
      return api;
    }
  };
}

(async function run() {
  const snapshot = buildScholarshipSourceSnapshot({
    title: 'Current title',
    cycle: '2027',
    raw_snapshot: {
      prior_verified_note: 'Keep this one-level source fact.',
      cycle: '2026',
      raw_snapshot: {
        deepest_verified_note: 'Retain evidence from the oldest snapshot layer.',
        raw_snapshot: { recursive: true },
        stale: true
      }
    }
  }, {
    id: 'source-1',
    source_key: 'official-provider',
    source_type: 'official_page',
    name: 'Official provider',
    parser_key: 'provider_api',
    trust_level: 'official'
  });

  assert.strictEqual(snapshot.prior_verified_note, 'Keep this one-level source fact.', 'one-level snapshot facts should survive normalization');
  assert.strictEqual(snapshot.deepest_verified_note, 'Retain evidence from the oldest snapshot layer.', 'deep snapshot evidence should survive bounded flattening');
  assert.strictEqual(snapshot.cycle, '2027', 'current source fields should override older snapshot fields');
  assert.strictEqual(snapshot.source_key, 'official-provider', 'current source provenance should be attached');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(snapshot, 'raw_snapshot'), false, 'normalized snapshots must not contain another raw_snapshot');
  assert.strictEqual(JSON.stringify(snapshot).includes('"raw_snapshot"'), false, 'recursive raw_snapshot payloads must be removed');

  const incomingWithoutAward = {
    slug: 'official-scholarship',
    award_value_min: null,
    award_value_max: null,
    award_value_amount: null,
    award_value_currency: null,
    award_value_period: null,
    award_value_text: null,
    award_components: [],
    award_value_confidence: null,
    award_value_source_url: 'https://mirror.example/record',
    award_value_last_checked_at: null,
    raw_snapshot: { source_key: 'mirror' }
  };
  const existingOfficialAward = authoritativeAward({ slug: 'official-scholarship' });
  const preserved = preserveAuthoritativeAwardValueCoverage(incomingWithoutAward, existingOfficialAward);

  assert.notStrictEqual(preserved, incomingWithoutAward, 'preservation should return a new normalized record');
  assert.strictEqual(preserved.award_value_text, existingOfficialAward.award_value_text, 'blank mirror data must not erase official award text');
  assert.deepStrictEqual(preserved.award_components, existingOfficialAward.award_components, 'blank mirror data must not erase official award components');
  assert.strictEqual(preserved.award_value_confidence, 'official', 'official award confidence should be retained');
  assert.strictEqual(preserved.raw_snapshot.award_value_preservation.reason, 'preserved_existing_authoritative_award_coverage', 'snapshot should record why award fields were retained');
  assert.strictEqual(incomingWithoutAward.award_value_text, null, 'the helper must not mutate its input record');

  const incomingProviderAward = authoritativeAward({
    award_value_text: 'Updated provider-published coverage.',
    award_value_confidence: 'provider',
    award_value_source_url: 'https://provider.example/updated'
  });
  const incomingWinner = preserveAuthoritativeAwardValueCoverage(incomingProviderAward, existingOfficialAward);
  assert.strictEqual(incomingWinner, incomingProviderAward, 'equally authoritative incoming coverage should win unchanged');
  assert.strictEqual(incomingWinner.award_value_text, 'Updated provider-published coverage.');

  const unverifiedExisting = authoritativeAward({ award_value_confidence: 'curated' });
  assert.strictEqual(
    preserveAuthoritativeAwardValueCoverage(incomingWithoutAward, unverifiedExisting),
    incomingWithoutAward,
    'non-authoritative existing coverage should not override incoming data'
  );

  const importClient = createImportClient(existingOfficialAward);
  await importSourceItems(importClient, {
    id: 'source-1',
    source_key: 'mirror-source',
    source_type: 'api',
    name: 'Mirror source',
    parser_key: 'mirror_api',
    trust_level: 'platform'
  }, [{
    slug: 'official-scholarship',
    title: 'Official Scholarship',
    provider: 'Official Provider',
    source_url: 'https://mirror.example/record',
    official_url: 'https://provider.example/program',
    raw_snapshot: {
      prior_verified_note: 'Retain without nesting.',
      raw_snapshot: { stale: true }
    }
  }]);

  const existingSelect = importClient.calls.find(function (call) {
    return call.table === 'scholarships' && call.op === 'select' && call.columns !== 'id, slug';
  });
  assert(existingSelect.columns.includes('award_value_confidence'), 'import should fetch existing award confidence before upsert');
  assert(existingSelect.columns.includes('award_components'), 'import should fetch existing award components before upsert');

  const scholarshipUpsert = importClient.calls.find(function (call) {
    return call.table === 'scholarships' && call.op === 'upsert';
  });
  assert(scholarshipUpsert, 'normalized scholarships should be upserted');
  assert.strictEqual(scholarshipUpsert.payload[0].award_value_text, existingOfficialAward.award_value_text, 'import should preserve existing official award text');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(scholarshipUpsert.payload[0].raw_snapshot, 'raw_snapshot'), false, 'persisted scholarship snapshot must remain flat');
  assert.strictEqual(scholarshipUpsert.payload[0].raw_snapshot.award_value_preservation.confidence, 'official', 'import snapshot should retain non-PII preservation provenance');

  const mirrorClient = createMirrorClient();
  await fetchMirrorRows(mirrorClient);
  assert(mirrorClient.calls.some(function (call) {
    return call.op === 'eq' && call.column === 'is_active' && call.value === true;
  }), 'mirror should continue to require active rows');
  assert(mirrorClient.calls.some(function (call) {
    return call.op === 'eq' && call.column === 'is_archived' && call.value === false;
  }), 'mirror must exclude archived rows');

  console.log('Scholarship ingest snapshot and award preservation verified.');
})().catch(function (error) {
  console.error(error.stack || error.message);
  process.exit(1);
});
