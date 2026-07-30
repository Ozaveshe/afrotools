'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'registry', 'french-mortgage-property.json');
const EVIDENCE_DIR = process.env.MP66_EVIDENCE_DIR || path.join(
  ROOT,
  'artifacts',
  'french-mortgage-property'
);
const BROWSER_PATH = process.env.MP66_BROWSER_EVIDENCE || path.join(EVIDENCE_DIR, 'browser-evidence.json');
const JSON_PATH = path.join(EVIDENCE_DIR, 'evidence.json');
const MD_PATH = path.join(EVIDENCE_DIR, 'evidence.md');
const ARTWORK_PATH = path.join(EVIDENCE_DIR, 'missing-artwork.md');
const FORBIDDEN_CONTROL = /\b(inscrire|newsletter|register|sign\s*up|subscribe|email|télécharger|download|export|imprimer|print|copier|copy|partager|share)\b/i;
const STATIC_SELECTOR = /\b(h1|h2|hero|title|description|methodology|source|privacy|nav|footer|cta)\b/i;
const REQUIRED_PROOFS = [
  'seo',
  'artwork',
  'source',
  'resultMutation',
  'copy',
  'share',
  'txt',
  'json',
  'pdf',
  'print',
  'localState',
  'invalid',
  'responsive',
  'theme',
  'accessibility',
  'privacy',
  'runtime'
];
const EXTERNAL_SOURCE_REQUIRED = new Set([
  'rental-yield',
  'land-title-check',
  'property-valuation',
  'rent-affordability',
  'tenant-screening',
  'rental-agreement',
  'property-mgmt-fees',
  'building-materials',
  'construction-budget',
  'dev-feasibility',
  'survey-cost',
  'service-charge',
  'short-let-calc',
  'agent-commission',
  'plot-converter',
  'building-permit',
  'diaspora-property',
  'offplan-vs-ready'
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function stripTags(value) {
  return normalizeText(String(value || '').replace(/<[^>]+>/g, ' '));
}

function englishOwnerSourceContract(row) {
  const absolute = path.join(ROOT, row.englishFile);
  const html = fs.readFileSync(absolute, 'utf8');
  const title = stripTags((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]);
  const h1 = stripTags((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1]);
  const namedInputs = Array.from(
    html.matchAll(/<(?:input|select|textarea)\b[^>]*\bname=["']([^"']+)["'][^>]*>/gi),
    match => match[1]
  );
  const actionLabels = Array.from(
    html.matchAll(/<(?:button|a)\b[^>]*>([\s\S]*?)<\/(?:button|a)>/gi),
    match => stripTags(match[1])
  ).filter(Boolean);
  const scriptOwners = Array.from(
    html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi),
    match => match[1]
  );

  assert(title || h1, `${row.englishId}: English owner has no title/H1 source evidence`);
  return {
    file: row.englishFile,
    sha256: crypto.createHash('sha256').update(html).digest('hex'),
    title,
    h1,
    namedInputs: [...new Set(namedInputs)],
    actionLabels: [...new Set(actionLabels)].slice(0, 40),
    scriptOwners: [...new Set(scriptOwners)],
    fixtureBinding: {
      frenchEngineMode: row.engineMode,
      frenchFieldNames: row.fields.map(field => field.name),
      expectedResultFields: row.exportContract.fixture.expectedResults.map(result => result.label)
    }
  };
}

function validateResultMutation(row, browserRow) {
  const proof = browserRow.proofs.resultMutation;
  const expected = row.exportContract.fixture.expectedResults;
  assert(proof.controlOwnedByForm === true, `${row.englishId}: workflow action is not owned by its form`);
  assert(
    proof.workflowControl === row.workflowControl &&
      row.exportContract.fixture.workflowControl === row.workflowControl,
    `${row.englishId}: workflow control contract mismatch`
  );
  assert(!FORBIDDEN_CONTROL.test(proof.workflowControl), `${row.englishId}: forbidden non-workflow control`);
  assert(proof.after && proof.before, `${row.englishId}: missing before/after result snapshots`);
  assert(
    JSON.stringify(proof.before) !== JSON.stringify(proof.after),
    `${row.englishId}: result region did not mutate`
  );
  assert(!normalizeText(proof.before.text), `${row.englishId}: result evidence existed before interaction`);
  assert(normalizeText(proof.after.text), `${row.englishId}: empty post-interaction result`);
  assert(expected.length > 0, `${row.englishId}: no explicit result field oracle`);

  for (const result of expected) {
    assert(result.selector.startsWith('[data-result-field='), `${row.englishId}: non-result selector`);
    assert(!STATIC_SELECTOR.test(result.selector), `${row.englishId}: static selector accepted`);
    assert(
      String(proof.resultFields[result.label]) === String(result.value),
      `${row.englishId}: result mismatch for ${result.label}`
    );
    assert(
      normalizeText(proof.after.text).includes(normalizeText(result.value)),
      `${row.englishId}: expected result ${result.label} absent after interaction`
    );
    assert(
      normalizeText(result.value) !== normalizeText(row.name) &&
        normalizeText(result.value) !== normalizeText(row.englishName),
      `${row.englishId}: title/static-copy result oracle`
    );
  }
}

function validateExports(row, browserRow) {
  const proofs = browserRow.proofs;
  const formats = row.exportContract.frenchOwner.formats;
  const expected = row.exportContract.fixture.expectedResults;
  assert(row.exportContract.classification === 'required', `${row.englishId}: unexpected export classification`);
  assert(formats.join(',') === 'copy,txt,json,pdf,print', `${row.englishId}: advertised formats incomplete`);
  assert(proofs.copy.local && proofs.copy.bytes > 0, `${row.englishId}: copy oracle failed`);
  assert(proofs.txt.fixtureAndResult && proofs.txt.frenchLabels && proofs.txt.bytes > 3, `${row.englishId}: TXT oracle failed`);
  assert(proofs.json.fixtureAndResult && proofs.json.bytes > 2, `${row.englishId}: JSON oracle failed`);
  assert(Array.isArray(proofs.json.sensitiveKeys) && proofs.json.sensitiveKeys.length === 0, `${row.englishId}: sensitive JSON state`);
  assert(proofs.pdf.fixtureAndResult && proofs.pdf.bytes > 100 && proofs.pdf.pages >= 1, `${row.englishId}: PDF oracle failed`);
  assert(proofs.pdf.gate === 'none', `${row.englishId}: PDF is gated`);
  assert(proofs.print.downloadedPdf === false, `${row.englishId}: print mislabeled as downloaded PDF`);
  assert(proofs.privacy.fixtureNetworkLeaks.length === 0, `${row.englishId}: fixture leaked to network`);
  assert(proofs.privacy.accountGate === false && proofs.privacy.emailGate === false, `${row.englishId}: export gate`);
  assert(/^http:\/\/127\.0\.0\.1:\d+$/.test(proofs.privacy.exactOrigin), `${row.englishId}: non-portable origin`);
  assert(proofs.privacy.exactNavigation.startsWith(`${proofs.privacy.exactOrigin}/`), `${row.englishId}: relative navigation`);
  assert(proofs.privacy.location.search === '' && proofs.privacy.location.hash === '', `${row.englishId}: URL state leak`);
  assert(proofs.privacy.storage.separateBrowserContexts === true, `${row.englishId}: contexts were not isolated`);
  assert(Array.isArray(proofs.privacy.console), `${row.englishId}: console privacy surface missing`);
  assert(proofs.privacy.analytics && Array.isArray(proofs.privacy.analytics.captured), `${row.englishId}: analytics surface missing`);
  for (const request of proofs.privacy.network) {
    assert(
      JSON.stringify(Object.keys(request).sort()) === JSON.stringify(['body', 'hash', 'headers', 'method', 'query', 'url']),
      `${row.englishId}: inexact network receipt`
    );
  }
  for (const theme of ['manualDarkPrimaryContrast', 'systemDarkPrimaryContrast']) {
    for (const [state, proof] of Object.entries(proofs.theme[theme] || {})) {
      assert(proof.ratio >= 4.5, `${row.englishId}:${theme}:${state} contrast`);
    }
    assert(Object.keys(proofs.theme[theme] || {}).length === 5, `${row.englishId}:${theme} states missing`);
  }
  for (const state of ['initial', 'result', 'invalid']) {
    const reflow = proofs.responsive.textResize200[state];
    assert(reflow.visibleDescendantDiagnostics === 0, `${row.englishId}:${state} clipping`);
    assert(reflow.documentOverflow <= 1, `${row.englishId}:${state} document overflow`);
    assert(Math.abs(reflow.scale - 2) < 0.00001, `${row.englishId}:${state} inexact text scale`);
  }
  assert(expected.length > 0, `${row.englishId}: export inherited empty/static result`);

  return row.exportContract.oracles.map(oracle => {
    const proof = proofs[oracle.format];
    assert(proof, `${row.englishId}: missing ${oracle.format} proof`);
    return {
      ...oracle,
      status: 'parsed-and-accepted',
      evidence: proof
    };
  });
}

function validateArtworkAndSource(row, browserRow) {
  const artwork = browserRow.proofs.artwork;
  assert(artwork.complete === true, `${row.englishId}: artwork did not complete`);
  assert(artwork.currentSrc.includes(row.imageUrl), `${row.englishId}: rendered artwork source mismatch`);
  assert(artwork.naturalWidth > 0 && artwork.naturalHeight > 0, `${row.englishId}: artwork has no natural dimensions`);
  assert(artwork.renderedWidth > 0 && artwork.renderedHeight > 0, `${row.englishId}: artwork is not visible`);
  assert(Math.abs(artwork.naturalAspect - artwork.renderedAspect) < 0.02, `${row.englishId}: artwork aspect ratio changed`);
  assert(artwork.visibility === 'visible' && artwork.opacity > 0, `${row.englishId}: artwork is visually hidden`);
  assert(row.artworkAlt.includes(row.name), `${row.englishId}: artwork alt is not semantic`);

  const source = browserRow.proofs.source;
  assert(source.url === row.source.url, `${row.englishId}: rendered source URL mismatch`);
  assert(source.support === row.source.support, `${row.englishId}: rendered source support mismatch`);
  assert(source.checkedAt === row.source.checkedAt, `${row.englishId}: rendered source date mismatch`);
  assert(source.freshness === row.source.freshness, `${row.englishId}: rendered freshness mismatch`);
  assert(source.assumptions === row.source.assumptions, `${row.englishId}: rendered assumptions mismatch`);
  assert(
    JSON.stringify(source.confidence) === JSON.stringify(row.source.confidence),
    `${row.englishId}: rendered confidence mismatch`
  );
  if (row.source.hardCodedValues) {
    assert(new URL(row.source.url).hostname !== 'afrotools.com', `${row.englishId}: hard-coded values lack external source`);
  }
  if (EXTERNAL_SOURCE_REQUIRED.has(row.englishId)) {
    assert(new URL(row.source.url).hostname !== 'afrotools.com', `${row.englishId}: self-referential source`);
    assert(!/sans autorit|aucune autorit/i.test(`${row.source.role} ${row.source.support}`), `${row.englishId}: authority disclaimer`);
  }
}

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const browser = readJson(BROWSER_PATH);
  assert(manifest.count === 66 && manifest.rows.length === 66, 'manifest denominator is not 66');
  assert(browser.denominator === 66 && browser.rows.length === 66, 'browser denominator is not 66');
  assert(browser.accepted === 66 && browser.blocked === 0, 'browser receipt is not 66/66');
  assert(browser.hub && browser.hub.status === 'accepted', 'hub browser receipt is not accepted');
  assert(browser.hub.exactNavigation === `${browser.portableOrigin}/fr/mortgage-property/`, 'hub navigation is not exact');
  assert(browser.hub.cardCount === 66 && browser.hub.routes.length === 66, 'hub denominator is not 66');
  assert(browser.hub.artwork.length === 66, 'hub artwork denominator is not 66');
  assert(
    browser.hub.artwork.every(image => (
      image.currentSrc &&
      image.naturalWidth > 0 &&
      image.naturalHeight > 0 &&
      image.renderedWidth > 0 &&
      image.renderedHeight > 0 &&
      image.alt === ''
    )),
    'hub artwork is not rendered as decorative card artwork'
  );
  assert(browser.hub.responsive.textResize200.visibleDescendantDiagnostics === 0, 'hub has clipped visible descendants');
  assert(browser.hub.responsive.textResize200.documentOverflow <= 1, 'hub has document overflow');
  assert(Math.abs(browser.hub.responsive.textResize200.scale - 2) < 0.00001, 'hub text resize is not exact');
  for (const theme of ['manualDarkPrimaryContrast', 'systemDarkPrimaryContrast']) {
    const states = browser.hub.theme[theme] || {};
    assert(Object.keys(states).length === 4, `hub:${theme} states missing`);
    for (const [state, proof] of Object.entries(states)) {
      assert(proof.ratio >= 4.5, `hub:${theme}:${state} contrast`);
    }
  }
  assert(browser.hub.privacy.storage.separateBrowserContexts === true, 'hub contexts were not isolated');
  assert(browser.hub.privacy.location.search === '' && browser.hub.privacy.location.hash === '', 'hub URL state leak');
  assert(Array.isArray(browser.hub.privacy.console), 'hub console privacy surface missing');
  assert(browser.hub.privacy.analytics && Array.isArray(browser.hub.privacy.analytics.captured), 'hub analytics surface missing');
  for (const request of browser.hub.privacy.network) {
    assert(
      JSON.stringify(Object.keys(request).sort()) === JSON.stringify(['body', 'hash', 'headers', 'method', 'query', 'url']),
      'hub inexact network receipt'
    );
  }

  const byId = new Map(browser.rows.map(row => [row.englishId, row]));
  const rows = manifest.rows.map(row => {
    const browserRow = byId.get(row.englishId);
    assert(browserRow && browserRow.status === 'accepted', `${row.englishId}: browser row not accepted`);
    for (const proof of REQUIRED_PROOFS) {
      assert(browserRow.proofs[proof], `${row.englishId}: missing proof ${proof}`);
    }
    validateArtworkAndSource(row, browserRow);
    validateResultMutation(row, browserRow);
    const parsedOracles = validateExports(row, browserRow);
    const englishSourceContract = englishOwnerSourceContract(row);
    const exportContract = {
      ...row.exportContract,
      oracles: parsedOracles,
      privacyGate: {
        ...row.exportContract.privacyGate,
        fixtureValueNetworkLeak: false
      },
      finalStatus: 'accepted',
      browserEvidence: {
        path: path.relative(ROOT, BROWSER_PATH).replace(/\\/g, '/'),
        rowNumber: browserRow.rowNumber
      }
    };
    Object.assign(row.exportContract, exportContract);
    return {
      rowNumber: row.rowNumber,
      englishId: row.englishId,
      englishName: row.englishName,
      englishRoute: row.englishRoute,
      frenchRoute: row.frenchRoute,
      baselineState: row.baselineState,
      workflowKind: row.workflowKind,
      engineMode: row.engineMode,
      sharedEngine: row.sharedEngine,
      routeSpecificContract: {
        workflowControl: row.workflowControl,
        fields: row.fields,
        source: row.source,
        expectedResults: exportContract.fixture.expectedResults
      },
      englishOwnerSourceContract: englishSourceContract,
      exportContract,
      browserProofs: browserRow.proofs,
      artwork: {
        id: row.imageId,
        url: row.imageUrl,
        alt: row.artworkAlt,
        exists: row.artworkExists,
        rendered: browserRow.proofs.artwork
      },
      finalStatus: 'accepted'
    };
  });

  assert(new Set(rows.map(row => row.engineMode)).size === 66, 'generic/shared mode substituted for route contracts');
  assert(rows.every(row => row.artwork.exists), 'missing artwork remains');

  const receipt = {
    schemaVersion: 1,
    category: 'French Mortgage & Property parity',
    denominator: 66,
    accepted: 66,
    blocked: 0,
    counts: rows.reduce((counts, row) => {
      counts[row.workflowKind] = (counts[row.workflowKind] || 0) + 1;
      return counts;
    }, {}),
    acceptanceOracle: browser.acceptanceOracle,
    generatedAt: browser.generatedAt,
    paths: {
      manifest: 'data/registry/french-mortgage-property.json',
      browser: path.relative(ROOT, BROWSER_PATH).replace(/\\/g, '/'),
      missingArtwork: path.relative(ROOT, ARTWORK_PATH).replace(/\\/g, '/')
    },
    rows
  };
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  fs.writeFileSync(JSON_PATH, `${JSON.stringify(receipt, null, 2)}\n`);

  const md = [
    '# French Mortgage & Property parity evidence',
    '',
    `- Acceptance: **${receipt.accepted}/${receipt.denominator}**`,
    `- Blocked: **${receipt.blocked}**`,
    `- Workflow counts: calculation ${receipt.counts.calculation || 0}; document ${receipt.counts.document || 0}; checklist ${receipt.counts.checklist || 0}; reference ${receipt.counts.reference || 0}`,
    '| # | English owner | French physical app | Workflow | Export formats | Result mutation | Final |',
    '|---:|---|---|---|---|---|---|',
    ...rows.map(row =>
      `| ${row.rowNumber} | \`${row.englishRoute}\` | \`${row.frenchRoute}\` | ${row.workflowKind} / \`${row.engineMode}\` | ${row.exportContract.frenchOwner.formats.join(', ')} | explicit before/after + ${row.routeSpecificContract.expectedResults.length} field oracle(s) | ${row.finalStatus} |`
    ),
    '',
    'Every row binds a distinct route engine mode, English-owner source hash and UI contract, rendered route-specific artwork, rendered source/freshness/assumptions/confidence, synthetic fixture, explicit result selectors, parsed copy/TXT/JSON/PDF/print oracles, invalid-state proof, privacy/network proof, responsive/theme/a11y proof, and SEO/hreflang proof. Titles, hero/static copy, marketing CTAs, navigation, export controls and signup controls cannot satisfy the mutation oracle.',
    ''
  ];
  fs.writeFileSync(MD_PATH, md.join('\n'));
  fs.writeFileSync(
    ARTWORK_PATH,
    '# French Mortgage & Property missing artwork\n\nMissing: **0/66**. Every scoped row renders its dedicated tool artwork with a visible image, loaded current source, positive natural dimensions, preserved aspect ratio and semantic French alternative text.\n'
  );

  console.log(JSON.stringify({
    accepted: receipt.accepted,
    blocked: receipt.blocked,
    counts: receipt.counts,
    json: path.relative(ROOT, JSON_PATH),
    markdown: path.relative(ROOT, MD_PATH),
    artwork: path.relative(ROOT, ARTWORK_PATH)
  }, null, 2));
}

main();
