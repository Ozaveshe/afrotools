'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(ROOT, relative), 'utf8');
const manifest = JSON.parse(read('data/localization/sw-finance-native-four-review.json'));
const byId = new Map(manifest.rows.map(row => [row.englishId, row]));

assert.strictEqual(manifest.baselineSha, '4f74dee35e5fed17140cd98d12bf6b71ea646875');
assert.deepStrictEqual([...byId.keys()], ['cbk-rates', 'salary-intelligence', 'crypto-prices', 'paye-calculator']);
assert.strictEqual(manifest.rows.filter(row => row.laneDisposition === 'accepted-for-coordinator').length, 1);
assert.strictEqual(manifest.rows.filter(row => row.laneDisposition === 'blocked').length, 3);

const cbkEnglish = read('tools/cbk-rates/index.html');
const cbkSwahili = read('sw/zana/viwango-vya-cbk/index.html');
const cbkRuntime = read('assets/js/pages/cbk-manual-converter.js');

assert.match(cbkSwahili, /<html[^>]+lang="sw"/);
assert.match(cbkSwahili, /<meta name="tool-id" content="cbk-rates">/);
assert.match(cbkSwahili, /data-cbk-manual[^>]+data-locale="sw-KE"/);
assert.match(cbkSwahili, /src="\/assets\/js\/pages\/cbk-manual-converter\.js/);
assert.match(cbkSwahili, /rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/viwango-vya-cbk\/"/);
assert.match(cbkSwahili, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/cbk-rates\/"/);
assert.match(cbkEnglish, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/viwango-vya-cbk\/"/);
assert.match(cbkSwahili, /"@type":"WebApplication"/);
assert.match(cbkSwahili, /"inLanguage":"sw"/);
assert.match(cbkSwahili, /Kiasi, kiwango, sarafu na tarehe hubaki hapa/);
assert.match(cbkSwahili, /Hakuna hifadhi, URL, PDF au upakuaji/);
assert.doesNotMatch(cbkSwahili, /Calculate locally|Foreign-currency amount|Currency code|CBK source date|Official source|Privacy and output/);
assert.doesNotMatch(cbkRuntime, /fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/);
assert.ok(fs.existsSync(path.join(ROOT, byId.get('cbk-rates').artwork.path)));
const registry = read('assets/js/components/tool-registry.js');
assert.match(registry, /id:\s*"cbk-rates-sw-coverage-cbk-rates"[\s\S]*?href:\s*"\/sw\/zana\/viwango-vya-cbk\/"[\s\S]*?sourceId:\s*"cbk-rates"/);

const salaryEnglish = read('tools/salary-intelligence/index.html');
const salarySwahili = read('sw/mshahara-na-kodi/index.html');
assert.match(salaryEnglish, /data-salary-evidence-app/);
assert.match(salaryEnglish, /salary-evidence-notebook\.js/);
assert.match(salaryEnglish, /salary-intelligence-vip\.js/);
assert.match(salaryEnglish, /JSON, CSV and PDF/);
assert.doesNotMatch(salarySwahili, /data-salary-evidence-app|salary-evidence-notebook\.js|salary-intelligence-vip\.js/);
assert.match(salarySwahili, /hreflang="en" href="https:\/\/afrotools\.com\/salary-tax\/"/);

const cryptoEnglish = read('crypto/prices/index.html');
const cryptoSwahili = read('sw/mshahara-na-kodi/crypto/index.html');
assert.match(cryptoEnglish, /data-crypto-prices/);
assert.match(cryptoEnglish, /crypto-prices-vip\.js/);
assert.match(cryptoEnglish, /data-export-csv/);
assert.match(cryptoEnglish, /data-export-json/);
assert.doesNotMatch(cryptoSwahili, /data-crypto-prices|crypto-prices-vip\.js|data-export-csv|data-export-json/);
assert.match(cryptoSwahili, /hreflang="en" href="https:\/\/afrotools\.com\/salary-tax\/crypto\/"/);

const payeEnglish = read('tools/paye-calculator/index.html');
const payeSwahili = read('sw/mshahara-na-kodi/paye/index.html');
assert.match(payeEnglish, /paye-country-directory\.js/);
assert.match(payeEnglish, /<select id="paye-country"/);
assert.doesNotMatch(payeSwahili, /paye-country-directory\.js|<select id="paye-country"/);
assert.match(payeSwahili, /hreflang="en" href="https:\/\/afrotools\.com\/salary-tax\/paye\/"/);

console.log('sw-finance-native-four-review: 1 accepted candidate, 3 route-identity blockers');
