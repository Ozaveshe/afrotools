const assert = require('assert');
const path = require('path');

const {
  discoverScholarshipCandidateLeads,
  parseSitemapLocs
} = require(path.join(__dirname, '..', 'netlify/functions/_shared/scholarship-platform.js'));

function createMockClient(existingUrls) {
  const calls = [];
  return {
    calls: calls,
    from: function (table) {
      assert.strictEqual(table, 'scholarship_source_suggestions', 'discovery leads should go to source suggestions only');
      return {
        select: function () {
          return {
            in: function (column, urls) {
              calls.push({ op: 'selectExisting', column: column, urls: urls });
              return Promise.resolve({
                data: urls
                  .filter(function (url) { return existingUrls.indexOf(url) !== -1; })
                  .map(function (url) { return { source_url: url }; }),
                error: null
              });
            }
          };
        },
        insert: function (payload) {
          calls.push({ op: 'insert', payload: payload });
          return Promise.resolve({ error: null });
        }
      };
    }
  };
}

(async function run() {
  const xml = '<urlset><url><loc>https://portal.example/scholarships/alpha</loc></url><url><loc>https://portal.example/about</loc></url></urlset>';
  assert.deepStrictEqual(
    parseSitemapLocs(xml),
    ['https://portal.example/scholarships/alpha', 'https://portal.example/about'],
    'sitemap parser should extract URL locs'
  );

  const existingUrl = 'https://portal.example/scholarships/existing';
  const client = createMockClient([existingUrl]);
  const originalFetch = global.fetch;

  global.fetch = async function (url) {
    const value = String(url);
    if (value.endsWith('/robots.txt')) {
      return {
        ok: true,
        status: 200,
        text: async function () {
          return 'User-agent: *\nAllow: /';
        }
      };
    }
    return {
      ok: true,
      status: 200,
      text: async function () {
        return [
          '<urlset>',
          '<url><loc>https://portal.example/scholarships/fresh</loc></url>',
          '<url><loc>' + existingUrl + '</loc></url>',
          '<url><loc>https://portal.example/static/logo.png</loc></url>',
          '</urlset>'
        ].join('');
      }
    };
  };

  try {
    const result = await discoverScholarshipCandidateLeads({
      client: client,
      candidates: [{
        source_key: 'mock-scholarship-sitemap',
        name: 'Mock scholarship sitemap',
        base_url: 'https://portal.example/sitemap.xml',
        parser_key: 'bachelorsportal_sitemap_discovery',
        status: 'discovery_only',
        allowed_use: 'Discovery leads only',
        degree_scope: ['bachelor', 'master']
      }],
      maxLeadsPerCandidate: 10
    });

    assert.strictEqual(result.lead_count, 2, 'discovery should retain likely scholarship URLs only');
    assert.strictEqual(result.suggestions_existing_count, 1, 'existing source suggestions should be deduplicated');
    assert.strictEqual(result.suggestions_created_count, 1, 'new discovery leads should be inserted for review');

    const insertCall = client.calls.find(function (call) { return call.op === 'insert'; });
    assert(insertCall, 'new discovery leads should be inserted');
    assert.strictEqual(insertCall.payload[0].review_status, 'pending', 'discovered leads must wait for review');
    assert(/canonical official provider page/.test(insertCall.payload[0].submitter_note), 'discovery lead should require official-source verification');
  } finally {
    global.fetch = originalFetch;
  }

  console.log('Scholarship discovery lead collector verified.');
})().catch(function (error) {
  console.error(error.stack || error.message);
  process.exit(1);
});
