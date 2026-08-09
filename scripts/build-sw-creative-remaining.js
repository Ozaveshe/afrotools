const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const rows = [
  ['sw/zana/maktaba-ya-stock-media/index.html', '/engines/creator-stock-engine.js', 'creator-stock'],
  ['sw/zana/thumbnail-ya-mtayarishi/index.html', '/engines/creator-final-wave-engine.js', 'creator-thumb'],
  ['sw/zana/vichwa-vya-maudhui/index.html', '/engines/creator-titles-engine.js', 'creator-titles'],
  ['sw/zana/kalenda-ya-mitandao-ya-kijamii/index.html', '/engines/social-media-calendar-engine.js', 'social-media-calendar'],
];
const controller = '/assets/js/pages/creative/sw-creative-remaining.js';
const write = process.argv.includes('--write');
let stale = 0;

for (const [relative, engine, imageId] of rows) {
  const file = path.join(root, relative);
  const current = fs.readFileSync(file, 'utf8');
  const required = [engine, controller];
  const missing = required.filter((item) => !current.includes(`src="${item}"`));
  const artwork = `https://afrotools.com/assets/img/tools/${imageId}.webp`;
  const artworkCurrent = current.includes(`<meta property="og:image" content="${artwork}">`)
    && current.includes(`<meta name="twitter:image" content="${artwork}">`);
  if (!missing.length && artworkCurrent) continue;
  stale += 1;
  if (!write) {
    console.error(`${relative}: missing ${missing.join(', ')}`);
    continue;
  }
  const analytics = '<script src="/assets/js/lazy-analytics.js?v=d378a891" defer></script>';
  let output = current;
  if (missing.length) {
    if (!output.includes(analytics)) throw new Error(`${relative}: analytics anchor missing`);
    const tags = missing.map((item) => `<script src="${item}"></script>`).join('\n');
    output = output.replace(analytics, `${tags}\n${analytics}`);
  }
  output = output
    .replace(/<meta property="og:image" content="[^"]+">/, `<meta property="og:image" content="${artwork}">`)
    .replace(/<meta name="twitter:image" content="[^"]+">/, `<meta name="twitter:image" content="${artwork}">`);
  fs.writeFileSync(file, output);
}

if (stale && !write) process.exitCode = 1;
else console.log(`Swahili Creative remaining source owner: ${rows.length}/${rows.length} routes current.`);
