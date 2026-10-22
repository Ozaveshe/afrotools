const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/js/components/footer.js'), 'utf8');
function render(locale) {
  let Footer;
  const sandbox = {
    HTMLElement: class { attachShadow() { this.shadowRoot = {}; } },
    customElements: { get() { return undefined; }, define(name, implementation) { if (name === 'afro-footer') Footer = implementation; } },
    window: { addEventListener() {}, AfroDisableAssistant: true },
    document: { addEventListener() {} },
    setTimeout() { throw new Error('Unexpected timer execution'); },
    fetch() { throw new Error('Unexpected network call'); }
  };
  vm.runInNewContext(source, sandbox, { timeout: 1000, filename: 'footer.js' });
  const footer = new Footer();
  footer._lang = locale;
  footer._render();
  return footer.shadowRoot.innerHTML;
}
test('Swahili footer links to the actual localized cookie policy', () => {
  const html = render('sw');
  assert.match(html, /<a href="\/sw\/vidakuzi\/" class="col-link">Vidakuki<\/a>/);
  assert.doesNotMatch(html, /href="\/sw\/cookies\/"/);
  const page = fs.readFileSync(path.join(root, 'sw/vidakuzi/index.html'), 'utf8');
  assert.match(page, /<html\b[^>]*lang="sw"/);
  assert.match(page, /<button\b[^>]*data-afro-cookie-consent-open/);
});
test('English, French, Hausa and Yoruba cookie targets remain unchanged', () => {
  for (const [locale, href, label] of [['en','/cookies/','Cookie Policy'],['fr','/fr/cookies/','Cookies'],['ha','/cookies/','Manufar Kuki'],['yo','/cookies/','Ìlànà Cookie']]) {
    assert.ok(render(locale).includes(`<a href="${href}" class="col-link">${label}</a>`), locale);
  }
});
test('Swahili privacy and terms destinations remain available', () => {
  const html = render('sw');
  assert.match(html, /href="\/sw\/faragha\/"/);
  assert.match(html, /href="\/sw\/masharti\/"/);
});
