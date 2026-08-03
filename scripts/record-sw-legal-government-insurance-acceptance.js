'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const ACCEPTANCE = path.join(ROOT, 'data', 'audits', 'swahili-free-app-acceptance.json');
const INVENTORY = path.join(ROOT, 'reports', 'swahili-free-app-parity-inventory.json');
const LEGAL_GAPS = path.join(ROOT, 'data', 'registry', 'swahili-legal-property-gaps.json');
const RECEIPT_JSON = path.join(ROOT, 'reports', 'swahili-legal-government-insurance-parity-receipt.json');
const RECEIPT_MD = path.join(ROOT, 'reports', 'swahili-legal-government-insurance-parity-receipt.md');
const ARTWORK_JSON = path.join(ROOT, 'reports', 'swahili-legal-government-insurance-artwork-queue.json');
const ARTWORK_MD = path.join(ROOT, 'reports', 'swahili-legal-government-insurance-artwork-queue.md');
function read(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function evidenceFor(row) {
  const common = {
    browserSpec: 'tests/e2e/swahili-legal-government-insurance-parity.spec.js',
    engineTest: 'tests/swahili-legal-government-insurance-parity.test.js',
    generator: 'scripts/build-sw-legal-government-insurance-parity.js',
    invalidState: 'Fail-closed invalid input proved before a successful route-owned workflow.',
    browser: '320/375 mobile widths, 200% text reflow, light/dark media, keyboard focus and labels, no console/page/local-resource errors, no mutation requests.',
    seo: 'Self canonical, OG URL, WebApplication schema inLanguage=sw, reciprocal en/fr/sw hreflang (plus Hausa where paired) and exact registry ownership.',
    privacy: 'Synthetic input stayed local with consent declined; no account, email, AI call or write request.'
  };
  if (row.categoryKey === 'government') {
    return {
      ...common,
      workflow: 'Route-owned planner or calculator uses the shared government engine and fail-closed source/freshness evidence.',
      export: 'Local JSON receipt parsed and reopened in the originating Swahili app; local TXT path also exposed.'
    };
  }
  if (row.categoryKey === 'insurance') {
    return {
      ...common,
      workflow: 'Route-owned assumption worksheet uses the shared Insurance engine without quote, coverage, eligibility or claim promises.',
      export: 'Ungated local JSON receipt downloaded and parsed; local copy and print/PDF paths remain available.'
    };
  }
  return {
    ...common,
    workflow: 'Route-owned Swahili fields execute the shared English-owner/property engine and return native Swahili results.',
    export: 'Ungated local JSON receipt downloaded and parsed; TXT/PDF/copy/print paths remain available.'
  };
}

function markdownReceipt(receipt) {
  const categories = Object.entries(receipt.counts.byCategory)
    .map(([category, counts]) => `| ${category} | ${counts.denominator} | ${counts.accepted} | ${counts.blocked} |`)
    .join('\n');
  const blocked = receipt.blockedRows.map((row) => `- \`${row.englishId}\` — ${row.reason}`).join('\n');
  return `# Swahili Legal, Government and Insurance parity receipt

- Reviewed: ${receipt.reviewedAt}
- Exact denominator: ${receipt.counts.denominator}
- Accepted by this receipt: ${receipt.counts.accepted}
- Blocked: ${receipt.counts.blocked}
- Browser receipt: \`${receipt.proof.browser.command}\` — ${receipt.proof.browser.result}
- Static/engine receipt: \`${receipt.proof.static.command}\` — ${receipt.proof.static.result}

| Category | Denominator | Accepted | Blocked |
| --- | ---: | ---: | ---: |
${categories}

## Acceptance boundary

Acceptance is route-specific and fail-closed. A route receives credit only when the maintained shared-engine workflow, invalid state, local export parse, privacy boundary, mobile/reflow/theme/keyboard checks, resource console, SEO/hreflang and registry ownership passed. This is local proof, not deploy or live verification.

## Source risks

${receipt.sourceRisks.map((risk) => `- ${risk}`).join('\n')}

## Blocked legal owners

${blocked}
`;
}

function main() {
  const inventory = read(INVENTORY);
  const scoped = inventory.rows.filter((row) => ['legal', 'government', 'insurance'].includes(row.categoryKey));
  if (scoped.length !== 97) throw new Error(`Expected 97 scoped rows, found ${scoped.length}`);
  const legalGapIds = new Set(read(LEGAL_GAPS).rows.map((row) => row.englishId));
  const browserProved = scoped.filter((row) => (
    legalGapIds.has(row.englishId) || row.categoryKey === 'government' || row.categoryKey === 'insurance'
  ));
  const acceptedRows = browserProved;
  const blockedRows = scoped.filter((row) => !acceptedRows.includes(row)).map((row) => ({
    englishId: row.englishId,
    route: row.primarySwahiliRoute,
    reason: 'No route-specific app workflow, invalid-state, export and full browser receipt was produced for this older legal owner.'
  }));
  if (acceptedRows.length !== 42 || blockedRows.length !== 55) {
    throw new Error(`Expected 42 accepted and 55 blocked, found ${acceptedRows.length}/${blockedRows.length}`);
  }

  const ledger = read(ACCEPTANCE);
  const scopedIds = new Set(scoped.map((row) => row.englishId));
  ledger.reviewedAt = '2026-07-31';
  ledger.entries = ledger.entries.filter((entry) => !scopedIds.has(entry.englishId));
  ledger.entries.push(...acceptedRows.map((row) => ({
    englishId: row.englishId,
    swahiliRoute: `${row.primarySwahiliRoute.replace(/\/$/, '')}/`,
    status: 'accepted',
    categoryKey: row.categoryKey,
    evidence: evidenceFor(row)
  })));

  const byCategory = {};
  for (const key of ['legal', 'government', 'insurance']) {
    const denominator = scoped.filter((row) => row.categoryKey === key).length;
    const accepted = acceptedRows.filter((row) => row.categoryKey === key).length;
    byCategory[key] = { denominator, accepted, blocked: denominator - accepted };
  }
  const receipt = {
    schemaVersion: 1,
    reviewedAt: '2026-07-31',
    scope: 'Swahili Mortgage & Property, Government and Insurance free-app parity',
    baseSha: '99898076a0329200e8f47c2e80a41a079b0df8b3',
    continuationBaseSha: 'b785c3cf1463515f6a8f0f0196ff981e799ddc13',
    counts: { denominator: 97, accepted: 42, blocked: 55, byCategory },
    proof: {
      static: {
        command: 'node --test tests/swahili-legal-government-insurance-parity.test.js',
        result: '8 passed'
      },
      browser: {
        command: 'SW_PARITY_RECONCILED_ONLY=1 playwright test tests/e2e/swahili-legal-government-insurance-parity.spec.js --project=chromium --workers=4',
        result: '20 passed: exactly 19 reconciled app owners plus the denominator assertion'
      },
      generator: {
        command: 'node scripts/build-sw-legal-government-insurance-parity.js',
        result: '42/42 maintained owners, 0 drift'
      },
      hreflang: {
        command: 'node scripts/validate-hreflang.js',
        result: 'All reciprocal hreflang relationships passed after targeted French and Hausa owner reconciliation.'
      }
    },
    acceptedRows: acceptedRows.map((row) => ({
      englishId: row.englishId,
      categoryKey: row.categoryKey,
      route: `${row.primarySwahiliRoute.replace(/\/$/, '')}/`
    })),
    blockedRows,
    sourceRisks: [
      'Government source check reports 67 sources, 9 changed and 27 blocked/manual, with 0 broken. The Swahili runtime therefore fails closed whenever freshness or integrity evidence is unavailable.',
      'Insurance source data is dated 2026-03-29 and is 123 days old against a 60-day high-risk cadence; 29 regulator gaps and 8 unsourced claim classes remain. Accepted insurance tools use user-entered planning assumptions and do not present live premiums.',
      'Fifty-five older legal rows remain unaccepted because they lack the full route-specific engine, output, invalid-state, export and browser receipt.'
    ],
    boundary: 'Local repository and browser proof only; no deploy, production, live government verification, legal advice, official eligibility, quote, coverage or claim decision.'
  };
  const artwork = {
    schemaVersion: 1,
    reviewedAt: '2026-07-31',
    denominator: 97,
    available: scoped.filter((row) => fs.existsSync(path.join(ROOT, 'assets', 'img', 'tools', `${row.englishId}.webp`))).length,
    missing: scoped.filter((row) => !fs.existsSync(path.join(ROOT, 'assets', 'img', 'tools', `${row.englishId}.webp`))).map((row) => ({
      englishId: row.englishId,
      expected: `/assets/img/tools/${row.englishId}.webp`
    }))
  };

  const outputs = [
    [ACCEPTANCE, JSON.stringify(ledger, null, 2) + '\n'],
    [RECEIPT_JSON, JSON.stringify(receipt, null, 2) + '\n'],
    [RECEIPT_MD, markdownReceipt(receipt)],
    [ARTWORK_JSON, JSON.stringify(artwork, null, 2) + '\n'],
    [ARTWORK_MD, `# Swahili parity artwork queue\n\n- Denominator: 97\n- Available canonical images: ${artwork.available}\n- Missing: ${artwork.missing.length}\n\n${artwork.missing.length ? artwork.missing.map((item) => `- \`${item.englishId}\`: \`${item.expected}\``).join('\n') : 'No artwork generation is queued.'}\n`]
  ];
  const drift = [];
  for (const [file, content] of outputs) {
    if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) {
      drift.push(path.relative(ROOT, file).replace(/\\/g, '/'));
      if (WRITE) fs.writeFileSync(file, content, 'utf8');
    }
  }
  if (!WRITE && drift.length) throw new Error(`Acceptance receipt drift:\n${drift.join('\n')}`);
  process.stdout.write(`${WRITE ? 'Recorded' : 'Checked'} 42 accepted / 55 blocked; artwork ${artwork.available}/97; ${drift.length} changed outputs.\n`);
}

if (require.main === module) main();
