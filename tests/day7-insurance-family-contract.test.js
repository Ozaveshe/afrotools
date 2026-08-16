const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const expected = {
  'car-insurance': 55,
  'health-insurance-compare': 16,
  'life-insurance-calc': 16,
  'funeral-insurance': 16,
  'motor-third-party': 55,
  'business-insurance': 16,
  'travel-insurance': 1,
  'workers-comp': 55,
  'health-contribution': 55,
  'claim-tracker': 1,
  'crop-insurance-calc': 16,
  'fire-insurance': 1,
  'insurance-fraud-checker': 1,
  'marine-insurance': 1,
  'microinsurance': 16,
  'professional-indemnity': 1
};

let total = 0;
for (const [tool, expectedCount] of Object.entries(expected)) {
  const directory = path.join(ROOT, 'tools', tool);
  const files = fs.readdirSync(directory).filter(file => file.endsWith('.html')).sort();
  assert.strictEqual(files.length, expectedCount, `${tool} route-family count drifted`);
  total += files.length;

  for (const file of files) {
    const slug = file === 'index.html' ? '' : file.slice(0, -5);
    const route = `/tools/${tool}/${slug}`;
    const canonicalPath = slug ? route : `/tools/${tool}/`;
    const html = fs.readFileSync(path.join(directory, file), 'utf8');
    const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
    const description = (html.match(/<meta name="description" content="([^"]+)">/) || [])[1] || '';
    assert.strictEqual(canonical, `https://afrotools.com${canonicalPath}`, `${route} canonical drifted`);
    assert.match(html, /<title>[^<]{20,}\| AfroTools<\/title>/, `${route} title is not useful`);
    assert.match(html, /<meta name="description" content="[^"]{80,}">/, `${route} description is not useful`);
    assert.ok(title.length <= 65, `${route} title must keep the task and country ahead of search truncation`);
    assert.ok(description.length <= 180, `${route} description must remain within the useful search-snippet range`);
    assert.match(html, /"@type"\s*:\s*"WebApplication"/, `${route} schema is missing`);
    assert.match(html, /data-insurance-workflow/, `${route} workflow is missing`);
    assert.match(html, /Empty inputs stay empty/, `${route} empty-state boundary is missing`);
    assert.match(html, /No form values are sent over the network or written to browser storage/, `${route} privacy boundary is missing`);
    assert.match(html, /Dataset floor:<\/strong> 29 March 2026/, `${route} source date is missing`);
    assert.match(html, /Confidence:<\/strong> high for the arithmetic/, `${route} confidence boundary is missing`);
    assert.match(html, /does not fetch insurer systems, issue quotes, determine eligibility/, `${route} insurance boundary is missing`);
    assert.doesNotMatch(
      html,
      /premium range|recommended cover|mandatory in|best insurer|AI-powered/i,
      `${route} contains an unsupported insurance claim`
    );
    assert.doesNotMatch(html, /localStorage|sessionStorage|fetch\(|XMLHttpRequest/, `${route} must stay local and storage-free`);
  }
}

assert.strictEqual(total, 322, 'Insurance expanded route total drifted');
console.log('Day 7 insurance family contract verified for 322 local-first routes.');
