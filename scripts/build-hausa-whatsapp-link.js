#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const workflow = require('../assets/js/pages/ha-yo-whatsapp-link.js');

const ROOT = path.resolve(__dirname, '..');
const PAGES = { ha:'ha/kayan-aiki/whatsapp-link/index.html', yo:'yo/awon-ise/whatsapp-link/index.html' };
const START = '<!-- whatsapp-local-workflow:start -->';
const END = '<!-- whatsapp-local-workflow:end -->';

function build(source, locale = 'ha') {
  if (!PAGES[locale]) throw new RangeError('Unsupported WhatsApp locale');
  const form = START + '\n' + workflow.markup(locale) + '\n' + END + '\n';
  let html = source;
  if (html.includes(START)) {
    html = html.replace(/<!-- whatsapp-local-workflow:start -->[\s\S]*?<!-- whatsapp-local-workflow:end -->\s*/, form);
  } else if (locale === 'ha') {
    const pattern = /<div class="tabs">[\s\S]*?(?=<section style="max-width:900px)/;
    if (!pattern.test(html)) throw new Error('Hausa WhatsApp workflow boundary is missing');
    html = html.replace(pattern, form);
  } else {
    const pattern = /<main class="grid" id="main-content">[\s\S]*?(?=<section data-tool-verification-panel)/;
    if (!pattern.test(html)) throw new Error('Yoruba WhatsApp workflow boundary is missing');
    html = html.replace(pattern, '<main id="main-content">\n' + form);
  }
  html = html.replace(/<script>\s*let currentLink[\s\S]*?<\/script>/, '')
    .replace(/<script>\s*\(function\(\)\{\s*const templates=[\s\S]*?<\/script>/, '')
    .replace(/<div class="copy-toast" id="toast">[^<]*<\/div>\s*/, '');
  html = html.replace(/<div class="faq-item" onclick="this.classList.toggle\('open'\)">\s*<div class="faq-q">([\s\S]*?)<\/div>\s*<div class="faq-a">([\s\S]*?)<\/div>\s*<\/div>/g,
    '<details class="wa-editorial-faq"><summary>$1</summary><p>$2</p></details>');
  if (locale === 'yo') html = html.replace('Fun QR ati iṣẹ́ ọ̀pọ̀ ìjápọ̀, <a href="/tools/whatsapp-link/">ṣí ojú ìwé Gẹẹsi</a>.', 'O tún lè <a href="/tools/whatsapp-link/">ṣí ojú ìwé Gẹẹsi</a> fún àlàyé míì.');
  if (!html.includes('/assets/css/ha-yo-whatsapp-link.css')) html = html.replace('</head>', '<link rel="stylesheet" href="/assets/css/ha-yo-whatsapp-link.css">\n</head>');
  const scripts = [];
  if (!html.includes('/assets/vendor/qrcode/qrcode.min.js')) scripts.push('<script src="/assets/vendor/qrcode/qrcode.min.js"></script>');
  if (!html.includes('/engines/whatsapp-link-engine.js')) scripts.push('<script src="/engines/whatsapp-link-engine.js"></script>');
  if (!html.includes('/assets/js/pages/ha-yo-whatsapp-link.js')) scripts.push('<script src="/assets/js/pages/ha-yo-whatsapp-link.js" defer></script>');
  if (scripts.length) html = html.replace('</body>', scripts.join('\n') + '\n</body>');
  return html;
}

if (require.main === module) {
  const locales = process.argv.includes('--all') ? ['ha','yo'] : ['ha'];
  for (const locale of locales) {
    const file = path.join(ROOT, PAGES[locale]);
    const current = fs.readFileSync(file,'utf8'), next = build(current,locale);
    if (process.argv.includes('--check')) {
      if (next !== current) throw new Error(locale + ' WhatsApp page is stale; run node scripts/build-hausa-whatsapp-link.js --all');
      console.log(locale + ' WhatsApp owner is current.');
    } else {
      if (next !== current) fs.writeFileSync(file,next,'utf8');
      console.log(locale + (next === current ? ' WhatsApp page already current.' : ' WhatsApp page regenerated.'));
    }
  }
}
module.exports = { build };
