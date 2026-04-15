#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const registryCode = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
const taxonomy = require(path.join(ROOT, 'assets/js/components/category-taxonomy.js'));

const window = {};
eval(registryCode);

const report = taxonomy.agriculture.getReport(AFRO_TOOLS);

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
