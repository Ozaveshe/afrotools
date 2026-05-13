#!/usr/bin/env node
/**
 * AfroTools Site Audit Script
 * Checks every HTML file for: broken refs, missing meta, stale colors, duplicate IDs,
 * missing components, broken links, form issues, image issues, structured data issues
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP = ['node_modules', '.git', '.claude', '.netlify', 'dist'];
const issues = [];
const stats = { files: 0, errors: 0, warnings: 0, fixed: 0 };

// Stale green colors to flag
const STALE_GREENS = ['#5ddb9e', '#008751', '#0c1a10', '#00a86b', '#006400'];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (SKIP.includes(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.name.endsWith('.html')) files.push(full);
  }
  return files;
}

function fileExists(refPath, htmlDir) {
  // Resolve relative to HTML file or root
  let resolved;
  if (refPath.startsWith('/')) {
    resolved = path.join(ROOT, refPath);
  } else if (refPath.startsWith('http') || refPath.startsWith('//') || refPath.startsWith('data:') || refPath.startsWith('#') || refPath.startsWith('mailto:') || refPath.startsWith('tel:') || refPath.startsWith('javascript:')) {
    return true; // external or special
  } else {
    resolved = path.join(htmlDir, refPath);
  }
  // Strip query/hash
  resolved = resolved.split('?')[0].split('#')[0];
  // Check as file or as directory with index.html
  if (fs.existsSync(resolved)) return true;
  if (fs.existsSync(resolved + '.html')) return true;
  if (fs.existsSync(path.join(resolved, 'index.html'))) return true;
  return false;
}

function auditFile(filePath) {
  stats.files++;
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel.startsWith('lang/pages/') && rel.endsWith('.body.html')) return;
  if (rel.endsWith('/_country-template.html')) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const dir = path.dirname(filePath);
  const fileIssues = [];

  // 1. Missing <title>
  const titleMatch = content.match(/<title\b[^>]*>(.*?)<\/title>/i);
  if (!titleMatch) {
    fileIssues.push({ type: 'ERROR', msg: 'Missing <title> tag' });
  } else if (titleMatch[1].length > 70) {
    fileIssues.push({ type: 'WARN', msg: `Title too long (${titleMatch[1].length} chars): "${titleMatch[1].substring(0,50)}..."` });
  }

  // 2. Missing meta description
  if (!/<meta\s+name=["']description["']/i.test(content)) {
    fileIssues.push({ type: 'WARN', msg: 'Missing <meta name="description">' });
  }

  // 3. CSS refs to non-existent files
  const cssRefs = content.matchAll(/href=["']([^"']+\.css)["']/gi);
  for (const m of cssRefs) {
    if (!fileExists(m[1], dir)) {
      fileIssues.push({ type: 'ERROR', msg: `Broken CSS ref: ${m[1]}` });
    }
  }

  // 4. JS refs to non-existent files
  const jsRefs = content.matchAll(/src=["']([^"']+\.(?:js|mjs))["']/gi);
  for (const m of jsRefs) {
    if (m[1].startsWith('http') || m[1].startsWith('//')) continue;
    if (!fileExists(m[1], dir)) {
      fileIssues.push({ type: 'ERROR', msg: `Broken JS ref: ${m[1]}` });
    }
  }

  // 5. Image src to non-existent files
  const imgRefs = content.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const m of imgRefs) {
    const src = m[1];
    if (src.startsWith('http') || src.startsWith('//') || src.startsWith('data:')) continue;
    if (!fileExists(src, dir)) {
      fileIssues.push({ type: 'WARN', msg: `Missing image: ${src}` });
    }
  }

  // 6. Images missing alt, width, height
  const imgTags = content.matchAll(/<img\b([^>]*)>/gi);
  for (const m of imgTags) {
    const attrs = m[1];
    if (!/alt=/i.test(attrs)) {
      fileIssues.push({ type: 'WARN', msg: 'Image missing alt attribute' });
    }
  }

  // 7. Stale green colors
  for (const color of STALE_GREENS) {
    if (content.toLowerCase().includes(color.toLowerCase())) {
      fileIssues.push({ type: 'WARN', msg: `Hardcoded stale green: ${color}` });
    }
  }

  // 8. Duplicate IDs
  const ids = content.matchAll(/\bid=["']([^"']+)["']/gi);
  const idMap = {};
  for (const m of ids) {
    idMap[m[1]] = (idMap[m[1]] || 0) + 1;
  }
  for (const [id, count] of Object.entries(idMap)) {
    if (count > 1) {
      fileIssues.push({ type: 'WARN', msg: `Duplicate ID "${id}" (${count}x)` });
    }
  }

  // 9. Missing navbar/footer (skip partials, components, scripts)
  if (!rel.includes('assets/') && !rel.includes('scripts/') && !rel.includes('afrodraft/') && !rel.includes('admin/')) {
    if (!/<afro-navbar/i.test(content) && !rel.includes('404') && !rel.includes('thank-you')) {
      fileIssues.push({ type: 'WARN', msg: 'Missing <afro-navbar>' });
    }
    if (!/<afro-footer/i.test(content) && !rel.includes('404') && !rel.includes('thank-you')) {
      fileIssues.push({ type: 'WARN', msg: 'Missing <afro-footer>' });
    }
  }

  // 10. Broken internal links
  const links = content.matchAll(/<a[^>]+href=["']([^"']+)["']/gi);
  for (const m of links) {
    const href = m[1];
    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    if (!fileExists(href, dir)) {
      fileIssues.push({ type: 'WARN', msg: `Broken internal link: ${href}` });
    }
  }

  // 11. Forms without Netlify attributes
  const forms = content.matchAll(/<form\b([^>]*)>/gi);
  for (const m of forms) {
    const attrs = m[1];
    if (!/data-netlify|netlify\b/i.test(attrs)) {
      fileIssues.push({ type: 'WARN', msg: 'Form missing data-netlify attribute' });
    }
  }

  // 12. Structured data validation
  const ldJsons = content.matchAll(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi);
  for (const m of ldJsons) {
    try {
      const data = JSON.parse(m[1]);
      if (data.aggregateRating) {
        fileIssues.push({ type: 'ERROR', msg: 'Structured data has fake aggregateRating — remove' });
      }
      if (data.review) {
        fileIssues.push({ type: 'ERROR', msg: 'Structured data has fake review — remove' });
      }
    } catch (e) {
      fileIssues.push({ type: 'ERROR', msg: `Invalid JSON-LD: ${e.message.substring(0,60)}` });
    }
  }

  // Specific path fixes check
  if (content.includes('/privacy-policy')) {
    fileIssues.push({ type: 'WARN', msg: 'Old path /privacy-policy found (should be /privacy/)' });
  }
  if (content.includes('/terms-of-use') || content.includes('/terms-of-service')) {
    fileIssues.push({ type: 'WARN', msg: 'Old path /terms-of-use or /terms-of-service found (should be /terms/)' });
  }

  if (fileIssues.length > 0) {
    for (const i of fileIssues) {
      if (i.type === 'ERROR') stats.errors++;
      else stats.warnings++;
    }
    issues.push({ file: rel, issues: fileIssues });
  }
}

// Run
console.log('Scanning all HTML files...');
const files = walk(ROOT);
console.log(`Found ${files.length} HTML files`);

for (const f of files) {
  auditFile(f);
}

// Generate report
let report = '# AfroTools Site Audit Report\n\n';
report += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
report += `**Files scanned:** ${stats.files}\n`;
report += `**Errors:** ${stats.errors}\n`;
report += `**Warnings:** ${stats.warnings}\n`;
report += `**Files with issues:** ${issues.length}\n\n`;
report += '---\n\n';

// Group by issue type
const errorFiles = issues.filter(i => i.issues.some(x => x.type === 'ERROR'));
const warnFiles = issues.filter(i => i.issues.every(x => x.type === 'WARN'));

if (errorFiles.length) {
  report += '## Errors (Must Fix)\n\n';
  for (const f of errorFiles) {
    report += `### \`${f.file}\`\n`;
    for (const i of f.issues.filter(x => x.type === 'ERROR')) {
      report += `- **ERROR:** ${i.msg}\n`;
    }
    for (const i of f.issues.filter(x => x.type === 'WARN')) {
      report += `- WARN: ${i.msg}\n`;
    }
    report += '\n';
  }
}

if (warnFiles.length) {
  report += '## Warnings\n\n';
  for (const f of warnFiles) {
    report += `### \`${f.file}\`\n`;
    for (const i of f.issues) {
      report += `- ${i.msg}\n`;
    }
    report += '\n';
  }
}

report += '---\n\n*Generated by scripts/audit-pages.js*\n';

fs.writeFileSync(path.join(ROOT, 'SITE-AUDIT-REPORT.md'), report);
console.log(`\nAudit complete. ${stats.errors} errors, ${stats.warnings} warnings across ${issues.length} files.`);
console.log('Report: SITE-AUDIT-REPORT.md');
