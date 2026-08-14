'use strict';

const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const { buildReport } = require('./build-french-free-app-parity-inventory');

const ROOT = path.resolve(__dirname, '..');
const CATEGORY_EVIDENCE_PATH = path.join(ROOT, 'data', 'audits', 'french-free-app-category-acceptance.json');
const ACCEPTANCE_PATH = path.join(ROOT, 'data', 'audits', 'french-free-app-acceptance.json');
const INVENTORY_SCRIPT = path.join(ROOT, 'scripts', 'build-french-free-app-parity-inventory.js');
const FINAL_RECEIPT_RELATIVE = 'reports/french-free-app-parity-final-acceptance-2026-07-30.md';
const FINAL_RECEIPT_PATH = path.join(ROOT, FINAL_RECEIPT_RELATIVE);
const LEDGER_PATH = path.join(ROOT, 'docs', 'FRENCH-FREE-APP-PARITY-LEDGER.md');
const LEDGER_START = '<!-- BEGIN GENERATED FINAL FRENCH ACCEPTANCE -->';
const LEDGER_END = '<!-- END GENERATED FINAL FRENCH ACCEPTANCE -->';
const EXPECTED_APPS = 1258;
const EXPECTED_CATEGORIES = 32;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function commandFiles(command) {
  return Array.from(String(command).matchAll(/(?:tests|scripts)\/[A-Za-z0-9_./-]+\.js/g), (match) => match[0]);
}

function validateCatalog(report, catalog) {
  if (report.totals.englishFreeApps !== EXPECTED_APPS) {
    throw new Error(`Expected ${EXPECTED_APPS} free apps; found ${report.totals.englishFreeApps}.`);
  }
  if (report.totals['native-candidate'] !== EXPECTED_APPS || report.totals.definiteBuildGaps !== 0) {
    throw new Error('Acceptance is blocked until all 1,258 primary French owners are native candidates.');
  }
  if (!Array.isArray(catalog.categories) || catalog.categories.length !== EXPECTED_CATEGORIES) {
    throw new Error(`Category evidence must contain exactly ${EXPECTED_CATEGORIES} records.`);
  }

  const reportByKey = new Map(report.categories.map((category) => [category.categoryKey, category]));
  const seen = new Set();
  for (const evidence of catalog.categories) {
    if (seen.has(evidence.categoryKey)) {
      throw new Error(`Duplicate category evidence: ${evidence.categoryKey}.`);
    }
    seen.add(evidence.categoryKey);
    const category = reportByKey.get(evidence.categoryKey);
    if (!category) throw new Error(`Unknown category evidence key: ${evidence.categoryKey}.`);
    if (category.englishFreeApps !== evidence.expectedApps) {
      throw new Error(
        `${evidence.categoryKey}: expected ${evidence.expectedApps} apps; inventory has ${category.englishFreeApps}.`
      );
    }
    if (!Array.isArray(evidence.tests) || evidence.tests.length === 0) {
      throw new Error(`${evidence.categoryKey}: at least one focused test command is required.`);
    }
    const referencedTestFiles = evidence.tests.flatMap(commandFiles);
    if (referencedTestFiles.length === 0) {
      throw new Error(`${evidence.categoryKey}: test commands must name repository test or script files.`);
    }
    for (const file of referencedTestFiles) {
      if (!fs.existsSync(path.join(ROOT, file))) {
        throw new Error(`${evidence.categoryKey}: referenced evidence file does not exist: ${file}.`);
      }
    }
    if (evidence.receipt && !fs.existsSync(path.join(ROOT, evidence.receipt))) {
      throw new Error(`${evidence.categoryKey}: receipt does not exist: ${evidence.receipt}.`);
    }
    if (!evidence.receipt) {
      const hasStatic = referencedTestFiles.some((file) => file.startsWith('tests/') && !file.startsWith('tests/e2e/'));
      const hasBrowser = referencedTestFiles.some((file) => file.startsWith('tests/e2e/'));
      if (!hasStatic || !hasBrowser) {
        throw new Error(`${evidence.categoryKey}: a tests-only acceptance needs static and browser contracts.`);
      }
    }
  }
  if (seen.size !== reportByKey.size) {
    const missing = Array.from(reportByKey.keys()).filter((key) => !seen.has(key));
    throw new Error(`Category evidence is incomplete: ${missing.join(', ')}.`);
  }
}

function buildAcceptance(report, catalog) {
  return {
    schemaVersion: 2,
    updatedAt: catalog.updatedAt,
    policy: 'Generated from the exact native 1,258-row inventory and the reviewed 32-category evidence catalog. Route shape alone cannot create an entry.',
    source: 'data/audits/french-free-app-category-acceptance.json',
    totals: {
      acceptedApps: EXPECTED_APPS,
      acceptedCategories: EXPECTED_CATEGORIES
    },
    entries: report.rows.map((row) => {
      return {
        englishId: row.englishId,
        frenchRoute: row.primaryFrenchRoute,
        categoryKey: row.categoryKey,
        status: 'accepted',
        evidenceKey: row.categoryKey
      };
    })
  };
}

function renderReceipt(report, catalog) {
  const categoryByKey = new Map(report.categories.map((category) => [category.categoryKey, category]));
  const lines = [
    '# French free-app parity final acceptance',
    '',
    `Evidence date: ${catalog.updatedAt}`,
    '',
    '## Verdict',
    '',
    `- Accepted categories: **${EXPECTED_CATEGORIES}/${EXPECTED_CATEGORIES}**.`,
    `- Accepted canonical free apps: **${EXPECTED_APPS}/${EXPECTED_APPS}**.`,
    `- Native primary French owners: **${report.totals['native-candidate']}/${EXPECTED_APPS}**.`,
    '- English iframe/transplant, bridge, alias-only and missing primary owners: **0**.',
    '',
    'Acceptance is generated from the exact inventory owner for every English ID.',
    'Every category below names its reviewed receipt, or its committed static and',
    'browser contracts where the final receipt is the durable aggregation point.',
    '',
    '## Category evidence',
    '',
    '| Category | Apps | Durable evidence | Focused contracts |',
    '|---|---:|---|---|'
  ];
  for (const evidence of catalog.categories) {
    const category = categoryByKey.get(evidence.categoryKey);
    const durable = evidence.receipt ? `\`${evidence.receipt}\`` : 'This final receipt';
    lines.push(
      `| ${category.category} | ${category.englishFreeApps} | ${durable} | `
      + evidence.tests.map((test) => `\`${test}\``).join('<br>') + ' |'
    );
  }
  lines.push(
    '',
    '## Generated ownership',
    '',
    '- Category evidence source: `data/audits/french-free-app-category-acceptance.json`.',
    '- App acceptance registry: `data/audits/french-free-app-acceptance.json`.',
    '- Full owner inventory: `reports/french-free-app-parity-inventory.json`.',
    '- Generator: `scripts/build-french-free-app-acceptance.js`.',
    '',
    'The generator fails closed on a changed denominator, a non-native primary',
    'owner, a category-count mismatch, duplicate or missing category evidence,',
    'a missing receipt, or a missing referenced test/script file.',
    '',
    'This receipt is repository acceptance evidence. Production deploy and live',
    'route proof remain separate release layers.'
  );
  return `${lines.join('\n')}\n`;
}

function renderLedgerSection() {
  return [
    LEDGER_START,
    '## Final release acceptance',
    '',
    `Evidence date: 2026-07-30`,
    '',
    `- **32/32 categories accepted.**`,
    `- **1,258/1,258 canonical English free apps have accepted native French owners.**`,
    '- Structural gaps: **0** iframe/transplants, bridges, alias-only owners or missing counterparts.',
    '- Expanded experiences, French registry rows and physical localized pages remain separate counts.',
    '',
    'The source-owned acceptance registry is generated by',
    '`scripts/build-french-free-app-acceptance.js` from the exact structural',
    'inventory and `data/audits/french-free-app-category-acceptance.json`.',
    'Per-category evidence is listed in',
    '`reports/french-free-app-parity-final-acceptance-2026-07-30.md`; the full',
    '1,258-row owner result remains in `reports/french-free-app-parity-inventory.*`.',
    '',
    'This is repository acceptance, not production deployment or live-route proof.',
    LEDGER_END
  ].join('\n');
}

function ledgerWithCurrentSection(current) {
  const withoutGenerated = current.replace(
    new RegExp(`${LEDGER_START}[\\s\\S]*?${LEDGER_END}\\n*`, 'g'),
    ''
  );
  const historical = withoutGenerated.replace(
    'Programme status: **0 of 32 categories accepted**',
    'Historical baseline programme status: **0 of 32 categories accepted**'
  );
  return historical.replace(
    '# French Free App Parity Ledger\n',
    `# French Free App Parity Ledger\n\n${renderLedgerSection()}\n\n`
  );
}

function checkFile(file, expected) {
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== expected) {
    throw new Error(`${path.relative(ROOT, file)} is stale. Run npm run fr:acceptance:build.`);
  }
}

function runInventory(mode) {
  childProcess.execFileSync(process.execPath, [INVENTORY_SCRIPT, mode], {
    cwd: ROOT,
    stdio: 'inherit'
  });
}

function main() {
  const write = process.argv.includes('--write');
  const check = process.argv.includes('--check');
  if (!write && !check) throw new Error('Use --write or --check.');

  const report = buildReport();
  const catalog = readJson(CATEGORY_EVIDENCE_PATH);
  validateCatalog(report, catalog);
  const acceptance = stableJson(buildAcceptance(report, catalog));
  const receipt = renderReceipt(report, catalog);
  const currentLedger = fs.readFileSync(LEDGER_PATH, 'utf8');
  const ledger = ledgerWithCurrentSection(currentLedger);

  if (write) {
    fs.writeFileSync(FINAL_RECEIPT_PATH, receipt, 'utf8');
    fs.writeFileSync(ACCEPTANCE_PATH, acceptance, 'utf8');
    fs.writeFileSync(LEDGER_PATH, ledger, 'utf8');
    runInventory('--write');
  } else {
    checkFile(FINAL_RECEIPT_PATH, receipt);
    checkFile(ACCEPTANCE_PATH, acceptance);
    checkFile(LEDGER_PATH, ledger);
    runInventory('--check');
  }

  console.log(`French free-app acceptance verified: ${EXPECTED_CATEGORIES} categories, ${EXPECTED_APPS} apps.`);
}

if (require.main === module) main();

module.exports = {
  buildAcceptance,
  ledgerWithCurrentSection,
  renderReceipt,
  validateCatalog
};
