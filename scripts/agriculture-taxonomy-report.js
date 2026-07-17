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
