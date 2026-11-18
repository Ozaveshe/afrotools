#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const registryCode = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
const taxonomy = require(path.join(ROOT, 'assets/js/components/category-taxonomy.js'));
const AGRICULTURE_HUB_FILES = [
  'agriculture/index.html',
  ...taxonomy.agriculture.buckets.map((bucket) => `agriculture/${bucket.slug}/index.html`),
];

const window = {};
eval(registryCode);

const report = taxonomy.agriculture.getReport(AFRO_TOOLS);

// These initial links stay usable until the existing client renderer replaces them.
const writeLinks = process.argv.includes('--write-links');
const areaLinks = report.buckets.map(bucket => ({
  name: bucket.label,
  href: `/agriculture/${bucket.slug}/`,
}));

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function populateLinks(html, slot, links) {
  const marker = '<!-- registry-backed links -->';
  const container = new RegExp(`(<div[^>]* ${slot}>)([\\s\\S]*?)(</div>)`);
  const match = html.match(container);
  if (!match || (match[2].trim() && !match[2].trimStart().startsWith(marker))) {
    throw new Error(`Missing or unrecognized link container: ${slot}`);
  }
  const anchors = links.map(({ name, href }) =>
    `<a class="workflow-step" href="${escapeHtml(href)}">${escapeHtml(name)}</a>`
  );
  return html.replace(container, () => match[1] + '\n' + [marker, ...anchors].join('\n') + '\n' + match[3]);
}

for (const file of AGRICULTURE_HUB_FILES) {
  const filename = path.join(ROOT, file);
  const current = fs.readFileSync(filename, 'utf8');
  const bucket = report.buckets.find(row => file === `agriculture/${row.slug}/index.html`);
  const otherAreas = bucket ? areaLinks.filter(link => link.href !== `/agriculture/${bucket.slug}/`) : areaLinks;
  let expected = populateLinks(current, 'data-agri-buckets', otherAreas);
  expected = populateLinks(expected, bucket ? 'data-agri-bucket-featured' : 'data-agri-featured',
    bucket ? bucket.featuredTools : report.featuredTools);
  if (expected === current) continue;
  if (writeLinks) fs.writeFileSync(filename, expected);
  else {
    console.error(`Stale Agriculture navigation in ${file}. Run npm run agriculture:taxonomy -- --write-links.`);
    process.exitCode = 1;
  }
}

const missingRuntimeDeps = AGRICULTURE_HUB_FILES.filter((relativePath) => {
  const html = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
  return (
    html.includes('/assets/js/pages/agriculture-taxonomy-hub.js') &&
    !html.includes('/assets/js/components/tool-registry.min.js') &&
    !html.includes('/assets/js/components/tool-registry.js')
  );
});

console.log('=== AGRICULTURE TAXONOMY REPORT ===');
console.log(`Registry-backed tools: ${report.totalTools}`);
console.log(`Bucketed tools: ${report.bucketedCount}`);
console.log(`Duplicate assignments: ${report.duplicateAssignments.length}`);
console.log(`Missing assignments: ${report.missingAssignments.length}`);

console.log('\n=== BUCKET COUNTS ===');
report.buckets.forEach((bucket) => {
  const topFamilies = bucket.topFamilies.map((family) => `${family.key} (${family.count})`).join(', ');
  console.log(`- ${bucket.label}: ${bucket.count}`);
  if (topFamilies) {
    console.log(`  Families: ${topFamilies}`);
  }
});

if (report.duplicateAssignments.length) {
  console.log('\n=== DUPLICATE ASSIGNMENTS ===');
  report.duplicateAssignments.forEach((entry) => {
    console.log(`- ${entry.tool.id}: ${entry.bucketKeys.join(', ')}`);
  });
}

if (report.missingAssignments.length) {
  console.log('\n=== MISSING ASSIGNMENTS ===');
  report.missingAssignments.forEach((tool) => {
    console.log(`- ${tool.id}: ${tool.href}`);
  });
}

if (missingRuntimeDeps.length) {
  console.log('\n=== MISSING RUNTIME DEPENDENCIES ===');
  missingRuntimeDeps.forEach((relativePath) => {
    console.log(`- ${relativePath}: missing tool-registry include before agriculture taxonomy rendering`);
  });
}

if (missingRuntimeDeps.length) {
  process.exitCode = 1;
}
