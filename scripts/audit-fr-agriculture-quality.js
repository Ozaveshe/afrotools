const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dir = path.join(root, 'fr', 'agriculture');
const mojibakeTokens = ['Ã', 'Â', 'â€', '�', 'fran?ais', 'pr?'];

function walk(current) {
  const out = [];
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    const full = path.join(current, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function get(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1].trim() : '';
}

function routeFor(file) {
  return `/${path.relative(root, file).replace(/\\/g, '/').replace(/index\.html$/, '').replace(/\.html$/, '')}`;
}

const files = walk(dir);
const canonicalCounts = new Map();
const rows = files.map((file) => {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const route = routeFor(file).replace(/\/+/g, '/');
  const title = get(html, /<title>([\s\S]*?)<\/title>/i);
  const description = get(html, /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']/i);
  const canonical = get(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i);
  const frAlt = get(html, /<link\s+rel=["']alternate["']\s+hreflang=["']fr["']\s+href=["']([^"']+)/i);
  const enAlt = get(html, /<link\s+rel=["']alternate["']\s+hreflang=["']en["']\s+href=["']([^"']+)/i);
  if (canonical) canonicalCounts.set(canonical, (canonicalCounts.get(canonical) || 0) + 1);

  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');
  const issues = [];
  if (mojibakeTokens.some((token) => html.includes(token))) issues.push('visible-mojibake');
  if (/\b(Calculator|Estimator|Tracker|Tools|Browse|Crop|Farm|Yield|Search|Open|Loading|Results|Home|Start Here|Sort by|Load more)\b/i.test(`${title} ${description}`)) issues.push('english-title-or-meta');
  const englishUiCount = (visible.match(/\b(Home|Start Here|Open flagship tools|Search all tools|Mapped Tools|Workflow Buckets|Unmapped Tools|Loading tools|Load more tools|Farm|Crop|Yield|Calculator|Estimator|Tracker|Download|Calculate|Results)\b/g) || []).length;
  if (englishUiCount) issues.push(`english-ui:${englishUiCount}`);
  const englishAgricultureLinks = new Set([...html.matchAll(/href=["']\/(agriculture\/[^"'#?]+)/g)].map((match) => `/${match[1]}`));
  if (englishAgricultureLinks.size) issues.push(`english-agriculture-links:${englishAgricultureLinks.size}`);
  if (canonical && !canonical.includes(`https://afrotools.com${route}`)) issues.push('canonical-not-self');
  if (!frAlt) issues.push('missing-fr-self');
  if (!enAlt) issues.push('missing-en-alt');
  if (frAlt && !frAlt.includes(`https://afrotools.com${route}`)) issues.push('fr-alt-not-self');
  if (/<iframe\b/i.test(html)) issues.push('iframe-wrapper');

  return { rel, route, title, canonical, enAlt, frAlt, issues };
});

const duplicateCanonicals = [...canonicalCounts.entries()]
  .filter(([, count]) => count > 1)
  .map(([canonical, count]) => ({ canonical, count }));

const report = JSON.stringify({
  audited: files.length,
  issueCounts: rows.reduce((counts, row) => {
    row.issues.forEach((issue) => {
      const key = issue.split(':')[0];
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, {}),
  duplicateCanonicals,
  top: rows
    .filter((row) => row.issues.length)
    .sort((a, b) => b.issues.length - a.issues.length || a.rel.localeCompare(b.rel))
    .slice(0, 80),
}, null, 2);

const outIndex = process.argv.indexOf('--out');
if (outIndex !== -1 && process.argv[outIndex + 1]) {
  fs.writeFileSync(path.join(root, process.argv[outIndex + 1]), `${report}\n`, 'utf8');
} else {
  console.log(report);
}
