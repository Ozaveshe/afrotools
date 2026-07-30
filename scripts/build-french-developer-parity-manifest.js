#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const outputRel = 'data/localization/fr-developer-parity-manifest.json';
const rows = [
  ['json-formatter', 'tools/json-formatter/index.html', 'fr/tools/formateur-json/index.html'],
  ['data-converter', 'tools/data-converter/index.html', 'fr/tools/convertisseur-donnees/index.html'],
  ['hash-generator', 'tools/hash-generator/index.html', 'fr/tools/generateur-hash/index.html'],
  ['base64', 'tools/base64/index.html', 'fr/tools/encodeur-base64/index.html'],
  ['regex-tester', 'tools/regex-tester/index.html', 'fr/tools/testeur-regex/index.html'],
  ['cron-builder', 'tools/cron-builder/index.html', 'fr/tools/constructeur-cron/index.html'],
  ['jwt-decoder', 'tools/jwt-decoder/index.html', 'fr/tools/decodeur-jwt/index.html'],
  ['url-encoder', 'tools/url-encoder/index.html', 'fr/tools/encodeur-url/index.html'],
  ['uuid-generator', 'tools/uuid-generator/index.html', 'fr/tools/generateur-uuid/index.html'],
  ['html-entities', 'tools/html-entities/index.html', 'fr/tools/entites-html/index.html'],
  ['diff-checker', 'tools/diff-checker/index.html', 'fr/tools/comparateur-texte/index.html'],
  ['markdown-editor', 'tools/markdown-editor/index.html', 'fr/tools/editeur-markdown/index.html'],
  ['color-contrast', 'tools/color-contrast/index.html', 'fr/tools/contraste-couleurs/index.html'],
  ['ussd-simulator', 'tools/ussd-simulator/index.html', 'fr/tools/simulateur-ussd/index.html'],
  ['api-tester', 'tools/api-tester/index.html', 'fr/tools/testeur-api/index.html'],
  ['sql-playground', 'tools/sql-playground/index.html', 'fr/tools/bac-a-sable-sql/index.html'],
  ['css-gradient', 'tools/css-gradient/index.html', 'fr/tools/generateur-degrade-css/index.html'],
  ['meta-tag-gen', 'tools/meta-tag-gen/index.html', 'fr/tools/generateur-meta/index.html'],
  ['htaccess-gen', 'tools/htaccess-gen/index.html', 'fr/tools/generateur-htaccess/index.html'],
  ['robots-txt', 'tools/robots-txt/index.html', 'fr/tools/generateur-robots-txt/index.html'],
  ['sitemap-gen', 'tools/sitemap-gen/index.html', 'fr/tools/generateur-sitemap/index.html'],
  ['password-gen', 'tools/password-generator/index.html', 'fr/tools/generateur-mot-de-passe/index.html'],
  ['sql-formatter', 'tools/sql-formatter/index.html', 'fr/tools/formateur-sql/index.html'],
  ['meta-tag-generator', 'tools/meta-tag-generator/index.html', 'fr/tools/generateur-meta-tags/index.html'],
  ['african-api-directory', 'tools/african-api-directory/index.html', 'fr/tools/annuaire-api-africaines/index.html'],
  ['african-domains', 'tools/african-domains/index.html', 'fr/tools/verificateur-domaines-africains/index.html'],
  ['commit-message-gen', 'tools/commit-message-gen/index.html', 'fr/tools/generateur-message-commit/index.html'],
  ['dev-tools', 'tools/dev-tools/index.html', 'fr/tools/outils-dev/index.html'],
  ['docker-compose-gen', 'tools/docker-compose-gen/index.html', 'fr/tools/generateur-docker-compose/index.html'],
  ['hosting-compare', 'tools/hosting-compare/index.html', 'fr/tools/comparateur-hebergement/index.html'],
  ['pwa-manifest', 'tools/pwa-manifest/index.html', 'fr/tools/generateur-manifest-pwa/index.html'],
  ['ussd-flow-builder', 'tools/ussd-flow-builder/index.html', 'fr/tools/constructeur-flux-ussd/index.html']
];

const bridgeIds = new Set([
  'african-api-directory',
  'african-domains',
  'commit-message-gen',
  'docker-compose-gen',
  'hosting-compare',
  'pwa-manifest'
]);
const acceptedIds = new Set([
  'json-formatter',
  'data-converter',
  'hash-generator',
  'base64',
  'regex-tester',
  'cron-builder',
  'jwt-decoder',
  'url-encoder',
  'uuid-generator',
  'html-entities',
  'diff-checker',
  'markdown-editor',
  'color-contrast',
  'ussd-simulator',
  'api-tester',
  'sql-playground',
  'css-gradient',
  'meta-tag-gen',
  'htaccess-gen',
  'robots-txt',
  'sitemap-gen',
  'password-gen',
  'sql-formatter',
  'meta-tag-generator',
  'african-api-directory',
  'african-domains',
  'commit-message-gen',
  'dev-tools',
  'docker-compose-gen',
  'hosting-compare',
  'pwa-manifest',
  'ussd-flow-builder'
]);

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const manifestRows = rows.map(([id, englishOwner, frenchOwner]) => {
  const englishFile = path.join(root, englishOwner);
  const frenchFile = path.join(root, frenchOwner);
  const exists = fs.existsSync(frenchFile);
  const html = exists ? fs.readFileSync(frenchFile, 'utf8') : '';
  let baselineState = 'native-candidate';
  if (!exists) baselineState = 'missing';
  else if (/<iframe\b/i.test(html)) baselineState = 'iframe';
  else if (bridgeIds.has(id) && /data-download-prep|Brief telecharge/i.test(html)) baselineState = 'bridge';
  if (acceptedIds.has(id) && exists && !/<iframe\b/i.test(html)) baselineState = 'native-accepted';

  return {
    id,
    categoryKey: 'developer',
    englishOwner,
    frenchOwner,
    englishRoute: `/${englishOwner.replace(/index\.html$/, '')}`,
    frenchRoute: `/${frenchOwner.replace(/index\.html$/, '')}`,
    englishOwnerSha256: sha(englishFile),
    frenchOwnerSha256: exists ? sha(frenchFile) : null,
    artwork: `/assets/img/tools/${id}.webp`,
    artworkExists: fs.existsSync(path.join(root, 'assets/img/tools', `${id}.webp`)),
    baselineState,
    accepted: baselineState === 'native-accepted'
  };
});

const manifest = {
  schemaVersion: 1,
  categoryKey: 'developer',
  foundation: '8ce5cac175e42201968b1f7540752d6acf92d4ca',
  exactEnglishCanonicalApps: manifestRows.length,
  accepted: manifestRows.filter(row => row.accepted).length,
  left: manifestRows.filter(row => !row.accepted).length,
  counts: manifestRows.reduce((counts, row) => {
    counts[row.baselineState] = (counts[row.baselineState] || 0) + 1;
    return counts;
  }, {}),
  rows: manifestRows
};

if (manifest.exactEnglishCanonicalApps !== 32) throw new Error(`Expected 32 rows, found ${manifest.exactEnglishCanonicalApps}`);
if (manifestRows.some(row => !fs.existsSync(path.join(root, row.englishOwner)))) throw new Error('An English owner is missing');

const output = `${JSON.stringify(manifest, null, 2)}\n`;
const outputFile = path.join(root, outputRel);
const current = fs.existsSync(outputFile) ? fs.readFileSync(outputFile, 'utf8') : '';
if (process.argv.includes('--check')) {
  if (current !== output) {
    console.error(`${outputRel} is stale`);
    process.exitCode = 1;
  } else {
    console.log(`${outputRel} is current: ${manifest.accepted}/${manifest.exactEnglishCanonicalApps} accepted`);
  }
} else {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, output, 'utf8');
  console.log(`wrote ${outputRel}: ${manifest.accepted}/${manifest.exactEnglishCanonicalApps} accepted`);
}
