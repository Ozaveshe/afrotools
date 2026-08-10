const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/css/navbar-language-switcher.css'), 'utf8');
const navbar = fs.readFileSync(path.join(root, 'assets/js/components/navbar.js'), 'utf8');

assert.match(css, /@media \(max-width: 940px\)[\s\S]*?\.right\s*\{[\s\S]*?flex:\s*0 0 44px;[\s\S]*?width:\s*44px;[\s\S]*?min-width:\s*44px;/);
assert.match(css, /@media \(max-width: 940px\)[\s\S]*?\.right\s*>\s*:not\(\.burger\)\s*\{\s*display:\s*none\s*!important;/);
assert.match(css, /@media \(max-width: 940px\)[\s\S]*?\.logo-name\s*\{\s*display:\s*inline;[\s\S]*?white-space:\s*nowrap;/);
assert.doesNotMatch(css, /@media \(max-width: 940px\)[\s\S]*?\.right\s*\{[\s\S]*?min-width:\s*120px;/);
assert.match(navbar, /navbar-language-switcher\.css\?v=2/);

console.log('Mobile navbar logo and menu alignment source contract passed.');
