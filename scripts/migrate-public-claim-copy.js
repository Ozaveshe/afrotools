#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const SKIP = new Set(['.git', '.claude', '.agents', '.codex', 'node_modules', 'dist', 'reports', 'audit-results', 'artifacts', 'test-results']);
const replacements = [
  [/<script\s+(?:async|defer)\s+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-D859CGF391["']><\/script>\s*<script>window\.dataLayer=window\.dataLayer\|\|\[\];function gtag\(\)\{dataLayer\.push\(arguments\);\}gtag\(["']js["'],new Date\(\)\);gtag\(["']config["'],["']G-D859CGF391["']\);<\/script>/giu, '<script defer src="/assets/js/lazy-analytics.js"></script>'],
  [/<script\s+(?:async|defer)\s+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-D859CGF391["']><\\?\/script>\s*<script>window\.dataLayer=window\.dataLayer\|\|\[\];function gtag\(\)\{dataLayer\.push\(arguments\);\}gtag\(["']js["'],new Date\(\)\);gtag\(["']config["'],["']G-D859CGF391["']\);<\\?\/script>/giu, '<script defer src="/assets/js/lazy-analytics.js"></script>'],
  [/<script\s+(?:async|defer)\s+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=G-D859CGF391["']><\\?\/script>/giu, '<script defer src="/assets/js/lazy-analytics.js"></script>'],
  [/\ball free tools remain free forever\b/giu, 'Core public calculators are available to guests without a paid subscription.'],
  [/\bfree forever\b/giu, 'Core use without a paid subscription'],
  [/\$0\s*(?:\/|per)\s*forever/giu, '$0 for core use'],
  [/\bgratuit(?:e)? pour toujours\b/giu, 'accès essentiel sans abonnement payant'],
  [/\bgratuit(?:e)? à jamais\b/giu, 'accès essentiel sans abonnement payant'],
  [/\btoujours gratuit(?:e)?\b/giu, 'accès essentiel sans abonnement payant'],
  [/\bbure daima\b/giu, 'matumizi ya msingi bila usajili wa kulipia'],
  [/\bbure milele\b/giu, 'matumizi ya msingi bila usajili wa kulipia'],
  [/\bkyauta har abada\b/giu, 'amfani na asali ba tare da biyan rajista ba'],
  [/\b(?:ọfẹ|ofe) lailai\b/giu, 'lilo pataki laisi isanwo iforukosile'],
  [/\bpowered by Claude(?: AI| Sonnet)?\b/giu, 'Optional AI · provider required'],
  [/\bpropuls[ée] par Claude(?: Sonnet)?\b/giu, 'IA facultative · fournisseur requis'],
  [/\bimeendeshwa na Claude\b/giu, 'AI ya hiari · mtoa huduma anahitajika'],
  [/\ball calculations run in your browser\b/giu, 'Core calculator operations run in your browser; labelled network features are disclosed separately'],
  [/\bmedical reports are processed with end[- ]to[- ]end encryption and never stored\b/giu, 'Local document operations run in the browser; labelled network document actions use their disclosed services and retention terms'],
  [/\bunlimited cloud(?:-synced)? (?:calculation )?history\b/giu, 'supported account-synced history'],
  [/\btax law email alerts\b/giu, 'labelled update features when available'],
  [/\bcancel anytime from your dashboard with one click\b/giu, 'Cancellation follows the active payment provider and account controls'],
  [/\blive market snapshot\b/giu, 'Market data snapshot'],
  [/\bwe do not sell, rent, or share your email with any third parties\. ever\b/giu, 'Email and contact details are used for the disclosed request and processed by the configured delivery service'],
  [/\bunsubscribes are processed immediately\b/giu, 'Unsubscribe requests are applied through the configured email service']
];

function walk(directory, output = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) walk(path.join(directory, entry.name), output);
      continue;
    }
    const extension = path.extname(entry.name).toLowerCase();
    const relative = path.relative(ROOT, path.join(directory, entry.name)).split(path.sep).join('/');
    const publicSourceJs = extension === '.js' && relative.startsWith('assets/js/') && !entry.name.endsWith('.min.js');
    if (entry.isFile() && (extension === '.html' || publicSourceJs)) output.push(path.join(directory, entry.name));
  }
  return output;
}

const changed = [];
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  for (const [pattern, replacement] of replacements) after = after.replace(pattern, replacement);
  if (after === before) continue;
  changed.push(path.relative(ROOT, file).split(path.sep).join('/'));
  if (WRITE) fs.writeFileSync(file, after.normalize('NFC'), 'utf8');
}

console.log(`${WRITE ? 'Updated' : 'Would update'} ${changed.length} public HTML files.`);
for (const file of changed) console.log(`- ${file}`);
if (!WRITE && changed.length) console.log('Run with --write to apply the migration.');
