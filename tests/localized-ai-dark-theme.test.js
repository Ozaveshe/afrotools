'use strict';
// Source-level palette and selector checks. Browser cascade/layout/focus still need browser review.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(process.env.AFROTOOLS_THEME_SOURCE || path.join(root, 'assets/css/theme-dark.css'), 'utf8');
const fixtures = process.env.AFROTOOLS_THEME_FIXTURES || root;
const topLevel = fs.readFileSync(process.env.AFROTOOLS_THEME_TOP_LEVEL || path.join(root, 'assets/css/top-level-page-ui-refresh.css'), 'utf8');
const context = process.env.AFROTOOLS_THEME_CONTEXT || root;
const rules = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selectors, body]) => ({
  selectors: selectors.split(',').map(s => s.trim()),
  declarations: Object.fromEntries(body.split(';').filter(s => s.includes(':')).map(s => {
    const colon = s.indexOf(':');
    return [s.slice(0, colon).trim(), s.slice(colon + 1).replace(/\s*!important\s*$/, '').trim()];
  }))
}));
const tokens = Object.assign({}, ...rules.filter(r => r.selectors.includes(':root[data-theme="dark"]')).map(r => r.declarations));
const scoped = selector => ':root[data-theme="dark"] body ' + selector;
function declarations(selector) {
  const found = rules.filter(r => r.selectors.includes(scoped(selector)));
  assert.ok(found.length, 'Missing dark surface/foreground rule: ' + selector);
  return Object.assign({}, ...found.map(r => r.declarations));
}
function color(value) {
  const variable = value && value.match(/^var\((--[^)]+)\)$/);
  if (variable) return color(tokens[variable[1]]);
  assert.match(value || '', /^#[\da-f]{3}(?:[\da-f]{3})?$/i, 'Expected resolvable opaque palette color');
  let hex = value.slice(1);
  if (hex.length === 3) hex = [...hex].map(c => c + c).join('');
  return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
}
function luminance(value) {
  const c = color(value).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
}
function contrast(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function readable(foreground, background, minimum = 4.5) {
  const ratio = contrast(foreground, background);
  assert.ok(ratio >= minimum, `${foreground} against ${background}: ${ratio.toFixed(2)} < ${minimum}`);
  return ratio;
}

for (const locale of ['fr', 'sw']) {
  test(locale + ' rendered shell has the affected reading and input surfaces', () => {
    const html = fs.readFileSync(path.join(fixtures, locale, 'ai/index.html'), 'utf8');
    assert.match(html, /<body class="[^"]*\btop-level-page-ui-refresh\b/);
    for (const cls of ['ai-local-main', 'ai-local-title', 'ai-local-copy', 'ai-local-panel', 'ai-local-form', 'ai-local-input-row', 'ai-local-card', 'ai-local-link', 'ai-local-faq', 'ai-local-note', 'ai-local-button']) {
      assert.match(html, new RegExp('class="[^"]*\\b' + cls + '\\b'), locale + ' lacks ' + cls);
    }
    assert.match(html, /<input\b/);
    assert.match(html, /<textarea\b/);
    assert.match(html, /<select\b/);
  });
}

test('always-loaded local headings beat the generic white hero fallback in light mode', () => {
  const globalCss = fs.readFileSync(path.join(context, 'assets/css/global.css'), 'utf8');
  const design = fs.readFileSync(path.join(context, 'assets/css/design-system.css'), 'utf8');
  // The existing hero selector is 0,1,1; this localized selector is 0,2,1.
  // This checks source specificity and palette, not browser computed cascade.
  assert.match(globalCss, /\[class\*="-hero"\]:where\(:not\(body\)\) h1/);
  const rule = topLevel.match(/\.top-level-page-ui-refresh\s+\.ai-local-main\s+:is\(h1,\s*h2,\s*h3\)\s*\{([^}]+)\}/);
  assert.ok(rule, 'A light-safe localized heading rule must be in the always-loaded stylesheet');
  assert.match(rule[1], /color:\s*var\(--color-text,\s*#0f172a\)/);
  const lightText = design.match(/--color-text:\s*(#[\da-f]{6})/i);
  assert.ok(lightText, 'Existing light design-system token');
  readable(lightText[1], '#f8fbff');
  readable(lightText[1], '#ffffff');
  assert.ok(contrast('#ffffff', '#f8fbff') < 1.1, 'Original white-on-light hero regression fixture');
});

test('main, cards, links, panels and FAQ pair readable dark foregrounds and backgrounds', () => {
  const bg = declarations('.ai-local-main').background;
  readable(declarations('.ai-local-title').color, bg);
  readable(declarations('.ai-local-copy').color, bg);
  for (const selector of ['.ai-local-panel', '.ai-local-card', '.ai-local-link', '.ai-local-faq']) {
    const rule = declarations(selector);
    readable(rule.color, rule.background);
    readable('var(--dm-muted)', rule.background);
    assert.notDeepEqual(color(rule.background), color('#fff'), selector + ' cannot remain a white surface');
  }
  assert.ok(contrast('#eef5ff', '#ffffff') < 1.2, 'Original heading/white-card regression fixture');
});

test('secondary text, card titles, labels, summaries and links remain readable', () => {
  const surfaces = [declarations('.ai-local-main').background, declarations('.ai-local-panel').background];
  for (const selector of ['.ai-local-card strong', '.ai-local-link strong', '.ai-local-form label', '.ai-local-faq summary', '.ai-local-note', '.ai-local-card span', '.ai-local-link span', '.ai-local-faq p', '.ai-local-main a:not(.ai-local-button)']) {
    for (const bg of surfaces) readable(declarations(selector).color, bg);
  }
});

test('field text, placeholders and input boundaries have adequate palette contrast', () => {
  for (const selector of ['.ai-local-form input', '.ai-local-form select', '.ai-local-form textarea', '.ai-local-input-row']) {
    const rule = declarations(selector);
    readable(rule.color, rule.background);
    readable(rule['border-color'], rule.background, 3);
  }
  const bg = declarations('.ai-local-form input').background;
  readable(declarations('.ai-local-form input::placeholder').color, bg);
  readable(declarations('.ai-local-form textarea::placeholder').color, bg);
});

test('primary button label stays readable in default, hover and keyboard-focus states', () => {
  for (const selector of ['.ai-local-button', '.ai-local-button:hover', '.ai-local-button:focus-visible']) {
    const rule = declarations(selector);
    readable(rule.color, rule.background);
  }
});

test('every native interactive element has a visible scoped keyboard focus indicator', () => {
  for (const tag of ['a', 'button', 'input', 'select', 'textarea', 'summary']) {
    const rule = declarations('.ai-local-main ' + tag + ':focus-visible');
    assert.match(rule.outline, /^3px solid /);
    assert.equal(rule['outline-offset'], '3px');
    const outlineColor = rule.outline.replace(/^3px solid /, '');
    for (const bg of ['var(--dm-bg)', 'var(--dm-surface)', 'var(--dm-inset)']) readable(outlineColor, bg, 3);
  }
});

test('localized AI additions apply only to explicit dark theme and localized selectors', () => {
  const localRules = rules.filter(r => r.selectors.some(s => /\.ai-local-(?:main|panel|card|link|faq|title|section|form|copy|note|input-row|button|kicker)\b/.test(s)));
  assert.ok(localRules.length >= 8);
  for (const rule of localRules) for (const selector of rule.selectors) {
    assert.ok(selector.startsWith(':root[data-theme="dark"] body .ai-local-'), selector);
    assert.ok(!/\.ai-(?:main|title|workflow-card)\b/.test(selector), selector);
  }
});
