'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INVENTORY = path.join(ROOT, 'reports', 'swahili-free-app-parity-inventory.json');
const ACCEPTANCE = path.join(ROOT, 'data', 'audits', 'swahili-free-app-acceptance.json');
const OUTPUT = path.join(
  ROOT,
  'data',
  'localization',
  'sw-business-fintech-trade-transport-no-overlap-manifest.json'
);

const BASE_COMMIT = '8354e321ff34caf60a33a3393cd0dcddfb00c023';
const CATEGORY_SCOPE = [
  { category: 'Small Business & SME', categoryKey: 'small-business', allocated: 28 },
  { category: 'Fintech & Banking', categoryKey: 'fintech', allocated: 31 },
  { category: 'Transport & Logistics', categoryKey: 'transport', allocated: 18 },
  { category: 'Trade & Import', categoryKey: 'trade', allocated: 22 }
];
const SELECTED_FAMILY_IDS = ['fixed-deposit', 'tbill-calc', 'real-return'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function comparable(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function buildManifest() {
  const inventory = readJson(INVENTORY);
  const acceptance = readJson(ACCEPTANCE);
  const acceptedById = new Map(acceptance.entries.map((entry) => [entry.englishId, entry]));
  const allocatedCategoryNames = new Set(CATEGORY_SCOPE.map((entry) => entry.category));
  const allocatedRows = inventory.rows.filter((row) => allocatedCategoryNames.has(row.category));

  for (const scope of CATEGORY_SCOPE) {
    const rows = allocatedRows.filter((row) => row.category === scope.category);
    if (rows.length !== scope.allocated) {
      throw new Error(`${scope.category}: expected ${scope.allocated} rows, found ${rows.length}`);
    }
    if (rows.some((row) => row.categoryKey !== scope.categoryKey)) {
      throw new Error(`${scope.category}: category key drift detected`);
    }
  }

  const duplicateIds = allocatedRows
    .map((row) => row.englishId)
    .filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicateIds.length) {
    throw new Error(`Allocated scope contains duplicate IDs: ${[...new Set(duplicateIds)].join(', ')}`);
  }

  const excludedAccepted = allocatedRows
    .filter((row) => acceptedById.has(row.englishId))
    .map((row) => {
      const accepted = acceptedById.get(row.englishId);
      return {
        englishId: row.englishId,
        categoryKey: row.categoryKey,
        englishRoute: row.englishRoute,
        swahiliRoute: accepted.swahiliRoute,
        reason: 'already-present-in-central-acceptance-ledger'
      };
    })
    .sort((a, b) => a.englishId.localeCompare(b.englishId));

  const remainingRows = allocatedRows
    .filter((row) => !acceptedById.has(row.englishId))
    .map((row) => ({
      englishId: row.englishId,
      englishName: row.englishName,
      category: row.category,
      categoryKey: row.categoryKey,
      englishRoute: row.englishRoute,
      swahiliRoute: row.primarySwahiliRoute || null,
      swahiliFile: row.primarySwahiliFile || null,
      inventoryState: row.state,
      sourceOwner: row.sourceOwner || null
    }));

  const selectedFamily = remainingRows.filter((row) => SELECTED_FAMILY_IDS.includes(row.englishId));
  if (selectedFamily.length !== SELECTED_FAMILY_IDS.length) {
    throw new Error(`Selected family is not wholly unaccepted: expected ${SELECTED_FAMILY_IDS.length}, found ${selectedFamily.length}`);
  }

  const selectedIds = new Set(selectedFamily.map((row) => row.englishId));
  const overlap = excludedAccepted.filter((row) => selectedIds.has(row.englishId));
  if (overlap.length) {
    throw new Error(`Selected family overlaps accepted IDs: ${overlap.map((row) => row.englishId).join(', ')}`);
  }

  const categorySummary = CATEGORY_SCOPE.map((scope) => {
    const excluded = excludedAccepted.filter((row) => row.categoryKey === scope.categoryKey).length;
    return {
      category: scope.category,
      categoryKey: scope.categoryKey,
      allocated: scope.allocated,
      excludedAccepted: excluded,
      remainingUnaccepted: scope.allocated - excluded
    };
  });

  return {
    schemaVersion: 1,
    coordinatorBase: BASE_COMMIT,
    sources: {
      inventory: 'reports/swahili-free-app-parity-inventory.json',
      centralAcceptanceLedger: 'data/audits/swahili-free-app-acceptance.json'
    },
    rules: {
      centralAcceptanceLedgerIsReadOnly: true,
      generatedAiMapIsReadOnly: true,
      masterLedgerIsReadOnly: true,
      sitemapAndDistAreOutOfScope: true,
      noAcceptedEnglishIdMayReenterRemainingScope: true
    },
    totals: {
      allocated: allocatedRows.length,
      excludedAccepted: excludedAccepted.length,
      remainingUnaccepted: remainingRows.length,
      selectedFamily: selectedFamily.length
    },
    categories: categorySummary,
    excludedAccepted,
    selectedFamily: {
      id: 'fintech-savings-and-real-returns',
      rationale: 'Smallest coherent unaccepted family with existing shared controller owners across English and French routes.',
      rows: SELECTED_FAMILY_IDS.map((id) => selectedFamily.find((row) => row.englishId === id))
    },
    remainingRows
  };
}

function main() {
  const manifest = buildManifest();
  const next = comparable(manifest);
  if (process.argv.includes('--write')) {
    fs.writeFileSync(OUTPUT, next, 'utf8');
    process.stdout.write(`Wrote ${path.relative(ROOT, OUTPUT)} (${manifest.totals.remainingUnaccepted} remaining rows)\n`);
    return;
  }
  if (!fs.existsSync(OUTPUT)) {
    throw new Error(`${path.relative(ROOT, OUTPUT)} is missing; run with --write`);
  }
  const current = fs.readFileSync(OUTPUT, 'utf8');
  if (current !== next) {
    throw new Error(`${path.relative(ROOT, OUTPUT)} is stale; run with --write`);
  }
  process.stdout.write(
    `Swahili Business/Fintech/Trade/Transport manifest: ${manifest.totals.allocated} allocated, ` +
    `${manifest.totals.excludedAccepted} excluded, ${manifest.totals.remainingUnaccepted} remaining, ` +
    `${manifest.totals.selectedFamily} selected\n`
  );
}

if (require.main === module) {
  main();
}

module.exports = { buildManifest };
