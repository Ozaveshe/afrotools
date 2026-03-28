// IndexNow — notify search engines of new/changed pages after deploy
// Usage: node scripts/indexnow.js
// Or auto-run: node scripts/indexnow.js --git (reads changed URLs from git diff HEAD~1)

const https = require('https');
const { execSync } = require('child_process');

const API_KEY = 'c499a69c79fcd43137779bdbf6e0fcf5';
const HOST = 'afrotools.com';

// Auto-detect changed HTML files from last commit if --git flag passed
function getUrlsFromGit() {
  try {
    const diff = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
    return diff
      .split('\n')
      .filter(f => f.endsWith('.html') || f.endsWith('index.html'))
      .map(f => {
        // Convert file path to URL path
        let url = '/' + f.replace(/index\.html$/, '').replace(/\.html$/, '');
        if (url === '//') url = '/';
        // Ensure trailing slash for consistency
        if (url !== '/' && !url.endsWith('/')) url += '/';
        return url;
      })
      .filter(u => u.length > 0);
  } catch (e) {
    return [];
  }
}

// Manually list recently changed URLs here (or pass --git to auto-detect)
const MANUAL_URLS = [
  // e.g. '/kenya/ke-paye', '/sw/tanzania/kikokotoo-kodi-mshahara'
];

const useGit = process.argv.includes('--git');
const urls = useGit ? getUrlsFromGit() : MANUAL_URLS;

if (urls.length === 0) {
  console.log('IndexNow: No URLs to submit. Pass --git to auto-detect from last commit.');
  process.exit(0);
}

console.log(`IndexNow: Submitting ${urls.length} URL(s) to api.indexnow.org`);
urls.forEach(u => console.log('  ' + u));

const payload = JSON.stringify({
  host: HOST,
  key: API_KEY,
  keyLocation: `https://${HOST}/${API_KEY}.txt`,
  urlList: urls.map(u => `https://${HOST}${u}`)
});

const req = https.request({
  hostname: 'api.indexnow.org',
  path: '/indexnow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  console.log(`IndexNow response: ${res.statusCode} ${res.statusMessage}`);
  // 200 = OK, 202 = Accepted for processing
});

req.on('error', (e) => console.error('IndexNow error:', e.message));
req.write(payload);
req.end();
