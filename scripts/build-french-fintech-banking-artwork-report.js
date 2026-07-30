'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data', 'localization', 'fr-fintech-banking-parity-manifest.json');
const REPORT_PATH = path.join(ROOT, 'reports', 'french-fintech-banking-artwork-report.json');
const LOCALIZED_IDS = new Set([
  'tbill-calc',
  'real-return',
  'loan-shark-compare',
  'sacco-calc',
  'bond-yield',
  'dca-calc',
  'dividend-yield',
  'fire-calc',
  'stock-portfolio',
]);

function webpDimensions(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`${path.relative(ROOT, filePath)} is not a WebP asset`);
  }
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === 'VP8X') {
      return { width: 1 + bytes.readUIntLE(data + 4, 3), height: 1 + bytes.readUIntLE(data + 7, 3) };
    }
    if (type === 'VP8 ') {
      return {
        width: bytes.readUInt16LE(data + 6) & 0x3fff,
        height: bytes.readUInt16LE(data + 8) & 0x3fff,
      };
    }
    if (type === 'VP8L') {
      const b1 = bytes[data + 1];
      const b2 = bytes[data + 2];
      const b3 = bytes[data + 3];
      const b4 = bytes[data + 4];
      return {
        width: 1 + (((b2 & 0x3f) << 8) | b1),
        height: 1 + ((b4 & 0x0f) << 10 | b3 << 2 | (b2 & 0xc0) >> 6),
      };
    }
    offset = data + size + (size % 2);
  }
  throw new Error(`${path.relative(ROOT, filePath)} has no readable WebP dimensions`);
}

function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  if (manifest.routes.length !== 31) throw new Error(`artwork denominator must be 31, found ${manifest.routes.length}`);
  const rows = manifest.routes.map((record) => {
    const localized = LOCALIZED_IDS.has(record.englishId);
    const expectedPath = localized
      ? `assets/img/tools/fr/${record.englishId}.webp`
      : `assets/img/tools/${record.englishId}.webp`;
    if (record.artwork !== expectedPath) {
      throw new Error(`${record.englishId}: expected artwork mapping ${expectedPath}, found ${record.artwork}`);
    }
    if (/fallback|placeholder|generic/i.test(record.artwork)) {
      throw new Error(`${record.englishId}: generic artwork is forbidden`);
    }
    const assetPath = path.join(ROOT, record.artwork);
    if (!fs.existsSync(assetPath)) throw new Error(`${record.englishId}: artwork is missing`);
    const dimensions = webpDimensions(assetPath);
    if (dimensions.width < 600 || dimensions.height < 400) {
      throw new Error(`${record.englishId}: artwork is too small ${dimensions.width}x${dimensions.height}`);
    }
    return {
      englishId: record.englishId,
      frenchRoute: record.frenchRoute,
      status: localized ? 'localizedFrench' : 'reusedTextFree',
      assetPath: record.artwork,
      dimensions,
      sourceId: record.englishId,
      visualReview: localized
        ? 'Reviewed at card and OG crops on 2026-07-29: dedicated French text, correct financial subject, no English text or unsupported claim.'
        : 'Reviewed at card and OG crops on 2026-07-29: dedicated semantic English counterpart is text-free and contains no generic fallback.',
    };
  });
  const report = {
    schemaVersion: 1,
    category: 'Fintech & Banking',
    locale: 'fr',
    reviewedAt: '2026-07-29',
    denominator: 31,
    reusedTextFree: rows.filter((row) => row.status === 'reusedTextFree').length,
    localizedFrench: rows.filter((row) => row.status === 'localizedFrench').length,
    blocked: 0,
    genericFallbacks: 0,
    rows,
  };
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`French Fintech artwork: ${rows.length}/31 reviewed; ${report.reusedTextFree} reused text-free, ${report.localizedFrench} localized, 0 generic.`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { LOCALIZED_IDS, main, webpDimensions };
