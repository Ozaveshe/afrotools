// IndexNow — notify search engines of new/changed pages after deploy
// Usage: node scripts/indexnow.js
// Or auto-run: node scripts/indexnow.js --git (reads changed URLs from git diff HEAD~1)

const https = require('https');
const { execSync } = require('child_process');

const API_KEY = 'c499a69c79fcd43137779bdbf6e0fcf5';
const HOST = 'afrotools.com';

// Paths that are never public pages — do not submit to IndexNow
const EXCLUDED_PREFIXES = [
  'admin/', 'netlify/', 'tests/', 'reports/', 'docs/', 'prompts/', 'scripts/',
  'dist/', 'widgets/iframe/', 'supabase/',
];
const EXCLUDED_FILES = ['404.html', 'afrotools-mission-control.html', 'mc-7a2f9x.html'];

// Auto-detect changed HTML files if --git flag passed.
// On Netlify, CACHED_COMMIT_REF..COMMIT_REF covers every commit since the last
// successful deploy (a multi-commit push would otherwise skip earlier commits).
function getUrlsFromGit() {
  try {
    const from = process.env.CACHED_COMMIT_REF;
    const to = process.env.COMMIT_REF || 'HEAD';
    let range = 'HEAD~1 HEAD';
    if (from && from !== to) {
      try {
        execSync(`git cat-file -e ${from}`, { stdio: 'ignore' });
        range = `${from} ${to}`;
      } catch (e) { /* cached ref not in shallow clone — fall back to last commit */ }
    }
    const diff = execSync(`git diff --name-only ${range}`, { encoding: 'utf8' });
    return diff
      .split('\n')
      .filter(f => f.endsWith('.html'))
      .filter(f => !EXCLUDED_PREFIXES.some(p => f.startsWith(p)) && !EXCLUDED_FILES.includes(f))
      .map(f => {
        // Match canonical URL forms: directory indexes keep a trailing slash
        // (/tools/itax-guide/), plain pages drop .html with no slash (/kenya/ke-paye).
        let url;
        if (f.endsWith('index.html')) {
          url = '/' + f.slice(0, -'index.html'.length);
          if (url === '//') url = '/';
        } else {
          url = '/' + f.replace(/\.html$/, '');
        }
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
// Dedupe and respect the IndexNow per-request cap of 10,000 URLs
const urls = [...new Set(useGit ? getUrlsFromGit() : MANUAL_URLS)].slice(0, 10000);

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
