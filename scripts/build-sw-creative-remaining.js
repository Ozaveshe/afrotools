const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rows = [
  ['sw/zana/maktaba-ya-stock-media/index.html', '/engines/creator-stock-engine.js'],
  ['sw/zana/thumbnail-ya-mtayarishi/index.html', '/engines/creator-final-wave-engine.js'],
  ['sw/zana/vichwa-vya-maudhui/index.html', '/engines/creator-titles-engine.js'],
  ['sw/zana/kalenda-ya-mitandao-ya-kijamii/index.html', '/engines/social-media-calendar-engine.js'],
];
const controller = '/assets/js/pages/creative/sw-creative-remaining.js';
const write = process.argv.includes('--write');
let stale = 0;

for (const [relative, engine] of rows) {
  const file = path.join(root, relative);
  const current = fs.readFileSync(file, 'utf8');
  const required = [engine, controller];
  const missing = required.filter((item) => !current.includes(`src="${item}"`));
  if (!missing.length) continue;
  stale += 1;
  if (!write) {
    console.error(`${relative}: missing ${missing.join(', ')}`);
    continue;
  }
  const analytics = '<script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>';
  if (!current.includes(analytics)) throw new Error(`${relative}: analytics anchor missing`);
  const tags = required.map((item) => `<script src="${item}"></script>`).join('\n');
  fs.writeFileSync(file, current.replace(analytics, `${tags}\n${analytics}`));
}

if (stale && !write) process.exitCode = 1;
else console.log(`Swahili Creative remaining source owner: ${rows.length}/${rows.length} routes current.`);
