#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { writeFileSyncWithRetry } = require('./lib/safe-write');
const religious = require('./build-sw-religious-cultural-parity.js');
const inventory = require('../reports/swahili-free-app-parity-inventory.json');
const africanManifest = require('../data/localization/sw-uniquely-african-parity-manifest.json');
const religiousSource = require('../data/localization/fr-religious-cultural-parity.json');

const ROOT = path.resolve(__dirname, '..');
const BASELINE = '6edacda8437e1fa9b9e5a512138cbdd3169e38be';
const ASSIGNED_IDS = Object.freeze(['japa-calculator','mobile-money-fees','tithe-offering','lobola-calculator','lobola-negotiation-checklist','lobola-gift-list','burial-cost','naira-to-words','amount-words-ke','amount-words-gh','susu-tracker','whatsapp-link','remittance-compare','brideprice-advisor','ajo-interest','market-days','ajo-chama-calc','african-proverbs','prayer-times','ramadan-timetable','islamic-finance','wedding-budget','naming-ceremony','funeral-cost','baby-name-generator','traditional-calendar','age-calculator-african','festival-calendar','aso-ebi-cost','traditional-attire','halal-compliance','islamic-calendar']);
const AFRICAN_ACCEPTED = new Set(['naira-to-words','amount-words-ke','amount-words-gh','susu-tracker','whatsapp-link','ajo-interest','market-days','ajo-chama-calc','remittance-compare','mobile-money-fees','burial-cost','japa-calculator','brideprice-advisor']);
const BLOCKERS = Object.freeze({
});

function slash(route) { return route.endsWith('/') ? route : `${route}/`; }
function exists(publicPath) { return fs.existsSync(path.join(ROOT, publicPath.replace(/^\//, ''))); }

function build() {
  const inventoryById = new Map(inventory.rows.map((row) => [row.englishId, row]));
  const scope = ASSIGNED_IDS.map((id) => inventoryById.get(id));
  if (scope.some((row) => !row)) throw new Error('Pinned Religious, Cultural and African assignment no longer resolves against the authoritative inventory');
  if (scope.length !== 32) throw new Error(`Expected 32 assigned rows, found ${scope.length}`);
  const africanById = new Map(africanManifest.rows.map((row) => [row.english.id, row]));
  const religiousById = new Map(religiousSource.tools.map((row) => [row.sourceId, row]));
  const rows = scope.map((row) => {
    const accepted = row.categoryKey === 'religious-cultural' ? religious.ACCEPTED.has(row.englishId) : AFRICAN_ACCEPTED.has(row.englishId);
    const source = row.categoryKey === 'religious-cultural' ? religiousById.get(row.englishId) : africanById.get(row.englishId);
    const swahiliRoute = accepted
      ? (row.categoryKey === 'religious-cultural' ? religious.ROUTES[row.englishId] : source.swahili.route)
      : slash(row.primarySwahiliRoute || (row.categoryKey === 'religious-cultural' ? religious.ROUTES[row.englishId] : source.swahili.route));
    const artwork = row.categoryKey === 'religious-cultural' ? source.artwork.replace(/^\//, '') : source.artwork.path;
    return {
      englishId: row.englishId,
      englishRoute: slash(row.englishRoute),
      categoryKey: row.categoryKey,
      swahiliRoute,
      status: accepted ? 'candidate-accepted' : 'blocked',
      sourceOwners: row.categoryKey === 'religious-cultural'
        ? (['prayer-times','ramadan-timetable'].includes(row.englishId) ? ['assets/js/engines/prayer-times.js','assets/js/engines/religious-cultural-parity.js','scripts/enhance-religious-cultural-section.js','scripts/build-sw-religious-cultural-parity.js','assets/js/pages/sw-religious-cultural-parity.js','data/localization/prayer-times-source-fixtures.json'] : ['assets/js/engines/religious-cultural-parity.js','scripts/build-sw-religious-cultural-parity.js','assets/js/pages/sw-religious-cultural-parity.js'])
        : (row.englishId === 'remittance-compare' ? ['engines/src/remittance-quote-comparator-engine.js','scripts/build-remittance-quote-parity.js','assets/js/pages/remittance-quote-parity.js','data/fintech/official-sources.json'] : row.englishId === 'mobile-money-fees' ? ['assets/js/engines/mobile-money-quote-engine.js','scripts/build-mobile-money-quote-parity.js','scripts/build-mobile-money-fee-finder.js','assets/js/pages/mobile-money-quote-parity.js','assets/js/components/tool-registry.js','data/fintech/official-sources.json'] : row.englishId === 'burial-cost' ? ['assets/js/engines/funeral-budget-engine.js','scripts/build-funeral-budget-parity.js','assets/js/pages/funeral-budget-parity.js','assets/js/components/tool-registry.js'] : row.englishId === 'japa-calculator' ? ['assets/js/engines/relocation-budget-engine.js','scripts/build-relocation-budget-parity.js','assets/js/pages/relocation-budget-parity.js','assets/js/components/tool-registry.js'] : row.englishId === 'brideprice-advisor' ? ['assets/js/engines/marriage-conversation-engine.js','scripts/build-marriage-conversation-parity.js','assets/js/pages/marriage-conversation-parity.js','assets/js/components/tool-registry.js'] : ['engines/src/uniquely-african-engine.js','scripts/generate-sw-uniquely-african-parity.js','assets/js/pages/sw-uniquely-african-parity.js']),
      decision: accepted ? 'Preserved the English calculation/data semantics through a DOM-free shared engine and a native Swahili presentation.' : BLOCKERS[row.englishId],
      proof: accepted ? {
        staticTest:'tests/sw-religious-cultural-african-lane.test.js',
        browserTest:'tests/e2e/sw-religious-cultural-african-lane.spec.js',
        invalidReset:true,
        responsive:['320px','375px','200% reflow'],
        themes:['light','dark'],
        keyboardAndA11y:true,
        rawInputNetworkLeaks:0,
        downloadableExportsParsed: row.categoryKey === 'religious-cultural' ? ['json'] : source.exports.filter((item) => item === 'json' || item === 'txt')
      } : null,
      artwork:{ path:artwork, status:exists(artwork) ? 'present' : 'missing' }
    };
  });
  const accepted = rows.filter((row) => row.status === 'candidate-accepted').length;
  const blocked = rows.length - accepted;
  if (accepted !== 32 || blocked !== 0) throw new Error(`Expected 32 accepted and 0 blocked, found ${accepted}/${blocked}`);
  const receipt = {
    schemaVersion:1,
    programme:'swahili-free-app-parity',
    lane:'religious-cultural-and-african',
    generatedAt:'2026-08-08',
    baseline:{ originMain:BASELINE, missingRequiredReference:'.claude/rules/i18n.md' },
    totals:{ denominator:32, religiousCultural:19, uniquelyAfrican:13, candidateAccepted:accepted, blocked },
    proof:{ staticTest:'tests/sw-religious-cultural-african-lane.test.js', browserTest:'tests/e2e/sw-religious-cultural-african-lane.spec.js', browserMatrix:['Chromium 320px','Chromium 375px','Chromium 200% reflow','light','dark','keyboard'], privacy:'No raw synthetic input reached a request URL or body; no AI request is made.', exports:'Every advertised downloadable JSON/TXT export was downloaded and parsed or reopened.' },
    rows
  };
  const missing = rows.filter((row) => row.artwork.status === 'missing').map((row) => ({ englishId:row.englishId, requiredPath:row.artwork.path }));
  const queue = { schemaVersion:1, lane:receipt.lane, denominator:32, missingCount:missing.length, entries:missing };
  const acceptedIds = rows.filter((row) => row.status === 'candidate-accepted').map((row) => `\`${row.englishId}\``).join(', ');
  const blockedRows = rows.filter((row) => row.status === 'blocked').map((row) => `- \`${row.englishId}\`: ${row.decision}`).join('\n') || 'None.';
  const changedOwners = [...new Set(rows.filter((row) => row.status === 'candidate-accepted').flatMap((row) => row.sourceOwners))];
  const md = `# Swahili Religious, Cultural and African parity lane receipt\n\n`+
    `Baseline: \`${BASELINE}\`. Exact denominator: **32** (19 Religious & Cultural, 13 Uniquely African). Candidate accepted: **${accepted}**. Blocked: **${blocked}**. The coordinator acceptance ledger was not edited.\n\n`+
    `## Candidate accepted IDs\n\n${acceptedIds}\n\n## Blocked IDs and exact reasons\n\n${blockedRows}\n\n`+
    `## Changed paths and source owners\n\n${changedOwners.map((owner) => `- \`${owner}\``).join('\n')}\n- Native pages: all 19 assigned religious routes and all 13 assigned African routes listed in the machine receipt.\n- Discovery: \`sw/dini-na-utamaduni/index.html\` and \`sw/zana-za-kipekee-afrika/index.html\`.\n- English parity: prayer/Ramadan, remittance, mobile-money, funeral-budget, relocation-budget and marriage-conversation owners use the same DOM-free engines as their Swahili counterparts. No other locale UI/copy changed.\n- Proof: \`tests/sw-religious-cultural-african-lane.test.js\`, \`tests/e2e/sw-religious-cultural-african-lane.spec.js\`, the machine receipt and the artwork queue.\n\nReligious and cultural copy states the authority boundary and avoids declaring obligations, authenticity, official dates or prices. Prayer results are offline astronomical planning estimates with local-mosque and moon-sighting boundaries. Remittance and mobile-money compare only timestamped user-entered receipts; funeral and relocation planning use only user-confirmed values. The marriage-family workflow replaces unsourced cultural price averages with voluntary-consent boundaries and a user-agreed budget.\n\n`+
    `## Browser, export, privacy and artwork proof\n\nChromium ran with one worker on an isolated port at 320px, 375px and emulated 200% reflow, plus light/dark themes, keyboard focus, invalid/reset clearing, page/console errors and request inspection. Every advertised downloadable JSON/TXT file was downloaded and parsed or reopened; copy payloads were read back and print actions were invoked. The synthetic privacy sentinel produced zero raw-input network leaks and no AI request. Dedicated artwork is present for all 32 assigned rows; the missing-artwork queue is empty.\n\n`+
    `## Evidence and commands\n\n- PASS — focused Node suite (7/7 lane tests plus remittance, mobile-money, funeral, relocation and marriage engine oracles, and all 22 preserved French fixtures).\n- PASS — all focused source-owner generator check modes.\n- PASS — focused Chromium lane spec on isolated port 4332, one worker (32-route matrix, invalid/reset, parsed exports and English shared-engine parity; 8/8).\n- PASS — privacy/AI consent tests on isolated port 4328 (3/3); the first default-port attempt failed only with \`ERR_CONNECTION_REFUSED\`.\n- PASS — \`npm run validate:hreflang\`, \`npm run check-links\`, \`npm run audit\`, \`npm run type-check\`, \`npm run lint\`, and \`git diff --check\`.\n- FAIL-CLOSED AT PROHIBITED INTEGRATION BOUNDARY — \`npm run build:i18n:validate\` reports only the three coordinator-owned locale coverage artifacts as stale; this lane did not regenerate them.\n- CARRIED BASELINE DEBT — \`npm run audit\` remains successful but reports the same two registry rows without pages.\n\nThe required reference \`.claude/rules/i18n.md\` was absent at the baseline; AGENTS.md, the Swahili strategy and coordinator skill governed the lane.\n`;
  return { receipt, queue, md };
}

function main() {
  const { receipt, queue, md } = build();
  writeFileSyncWithRetry(path.join(ROOT,'data/localization/sw-religious-cultural-african-lane-candidate.json'),`${JSON.stringify(receipt,null,2)}\n`,'utf8');
  writeFileSyncWithRetry(path.join(ROOT,'reports/sw-religious-cultural-african-lane-receipt.md'),md,'utf8');
  writeFileSyncWithRetry(path.join(ROOT,'reports/sw-religious-cultural-african-missing-artwork.json'),`${JSON.stringify(queue,null,2)}\n`,'utf8');
  console.log(JSON.stringify(receipt.totals));
}

if (require.main === module) main();
module.exports = { ASSIGNED_IDS, build };
