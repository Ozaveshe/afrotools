const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const contract = require('../assets/js/lib/b2b-choice-contract');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function businessEnquiryUrls(relativePath) {
  const html = read(relativePath);
  return Array.from(html.matchAll(/href="([^"]*\/business-enquiry\/\?[^"#]+)"/g), function (match) {
    return new URL(match[1].replace(/&amp;/g, '&'), 'https://afrotools.com');
  });
}

[
  'api-growth',
  'api-growth-pilot',
  'api-pro',
  'api-pro-pilot',
  'api-enterprise',
  'api-pilot'
].forEach(function (offer) {
  assert.strictEqual(contract.normalizeOffer(offer), 'api_pilot', offer + ' must normalize to api_pilot');
});

['pro-workspace', 'team-rollout', 'business-subscription'].forEach(function (offer) {
  assert.strictEqual(
    contract.normalizeOffer(offer),
    'business_subscription',
    offer + ' must normalize to business_subscription'
  );
});

assert.strictEqual(contract.normalizeProspect('developer-api'), 'developer_api');
assert.strictEqual(contract.normalizeProspect('hr-payroll'), 'hr_payroll');
assert.strictEqual(contract.normalizeOffer('unsupported-offer'), 'other');

const functionSource = read('netlify/functions/capture-b2b-lead.js');
assert.match(functionSource, /require\('\.\.\/\.\.\/assets\/js\/lib\/b2b-choice-contract'\)/);
assert.doesNotMatch(functionSource, /const OFFER_ALIASES\s*=/, 'server must not duplicate the offer alias map');
assert.doesNotMatch(functionSource, /const PROSPECT_ALIASES\s*=/, 'server must not duplicate the prospect alias map');

const formSource = read('assets/js/components/b2b-enquiry-form.js');
assert.match(formSource, /AfroTools\.B2BChoiceContract/);
['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (field) {
  assert.match(formSource, new RegExp(field), field + ' must be preserved by the browser form');
});

[
  'advertise/index.html',
  'business-enquiry/index.html',
  'custom-calculators/index.html',
  'media-kit/index.html',
  'matchday-os/sponsors/index.html',
  'sponsored-tools/index.html'
].forEach(function (relativePath) {
  const html = read(relativePath);
  const contractIndex = html.indexOf('/assets/js/lib/b2b-choice-contract.js');
  const formIndex = html.indexOf('/assets/js/components/b2b-enquiry-form.js');
  assert(contractIndex >= 0, relativePath + ' must load the shared B2B choice contract');
  assert(formIndex > contractIndex, relativePath + ' must load the contract before the form helper');
});

[
  'api/index.html',
  'api/pricing.html',
  'api/docs/index.html',
  'developers/index.html'
].forEach(function (relativePath) {
  const urls = businessEnquiryUrls(relativePath);
  assert(urls.length > 0, relativePath + ' must expose a qualified business enquiry CTA');
  urls.forEach(function (url) {
    ['offer', 'tool', 'prospect', 'source', 'source_route', 'cta_type'].forEach(function (field) {
      assert(url.searchParams.get(field), relativePath + ' CTA must preserve ' + field);
    });
    assert.strictEqual(url.searchParams.get('prospect'), 'developer-api');
    assert.strictEqual(contract.normalizeOffer(url.searchParams.get('offer')), 'api_pilot');
  });
});

const developers = read('developers/index.html');
assert.doesNotMatch(developers, /href="\/contact\/\?subject=api-(?:growth|pro)-pilot"/);
assert.doesNotMatch(developers, /mailto:api@afrotools\.com/);

[
  'pro/index.html',
  'pro/settings/billing/index.html'
].forEach(function (relativePath) {
  businessEnquiryUrls(relativePath).forEach(function (url) {
    ['offer', 'prospect', 'prospect_segment', 'source', 'source_route', 'cta_type'].forEach(function (field) {
      assert(url.searchParams.get(field), relativePath + ' CTA must preserve ' + field);
    });
    assert.strictEqual(contract.normalizeOffer(url.searchParams.get('offer')), 'business_subscription');
  });
});

console.log('commercial funnel integrity checks passed');
