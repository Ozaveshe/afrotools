const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/scholarship-finder/index.html'), 'utf8');
const vip = fs.readFileSync(path.join(root, 'tools/scholarship-finder/scholarship-finder-vip.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'tools/scholarship-finder/scholarship-finder-vip.css'), 'utf8');

assert(html.includes('/assets/fonts/typography.css'), 'page should use the self-hosted typography stack');
assert(!html.includes('fonts.googleapis.com'), 'page should not load a competing Google font stylesheet');
assert(html.includes('scholarship-finder-vip.css'), 'VIP stylesheet should be loaded');
assert(html.includes('scholarship-finder-vip.js'), 'VIP controller should be loaded');
assert(html.includes('Print / save PDF'), 'application pack should support print/PDF export');
assert(html.includes('Guest shortlists and saved packs stay in this browser'), 'privacy boundary should be visible');
assert(!/Apply to 5-10|most major scholarships have deadlines 9-12 months/i.test(html), 'unsupported universal application advice should be removed');
assert(html.includes('not an eligibility or award decision'), 'ranking must be distinguished from eligibility');
assert(vip.includes('Applicant-country rules are not consistently structured'), 'non-functional country filtering must be disclosed');
assert(vip.includes('Grade requirements are not consistently structured'), 'non-functional grade ranking must be disclosed');
assert(vip.includes('Curated fallback record'), 'fallback records must carry a current-cycle verification boundary');
assert(vip.includes('not an eligibility or award prediction'), 'result chips must not imply eligibility');
assert(css.includes('[data-theme="dark"] .sch-card'), 'VIP styling should explicitly support dark cards');
assert(css.includes('html.sch-pack-printing'), 'print styling should isolate the application pack');

console.log('Scholarship Finder VIP static contract verified.');
