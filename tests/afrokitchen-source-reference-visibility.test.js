'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const cssTree = require('css-tree');
const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const cookbook = cssTree.toPlainObject(cssTree.parse(read('tools/afrokitchen/cookbook.css')));
const visual = cssTree.toPlainObject(cssTree.parse(read('tools/afrokitchen/visual-recipe.css')));

// A finite source-level contract for the cover-note rules. This is not a browser
// layout substitute: browser-47 still checks the actual visible, clickable link.
function screenRules(sheet, width) {
  const result = [];
  function visit(nodes) {
    for (const node of nodes) {
      if (node.type === 'Rule') result.push(node);
      else if (node.type === 'Atrule' && node.name === 'media') {
        const query = cssTree.generate(node.prelude);
        if (query === 'print') continue;
        const match = query.match(/^\((max|min)-width:(\d+)px\)$/);
        assert(match, 'Review new cover stylesheet media conditions explicitly: ' + query);
        if (match[1] === 'max' ? width <= Number(match[2]) : width >= Number(match[2])) visit(node.block.children);
      }
    }
  }
  visit(sheet.children);
  return result;
}
const parentSelectors = new Set([
  '.ak-cookbook-cover-note',
  '.ak-page.ak-static-page .ak-cookbook-cover-note',
  '.ak-page.ak-visual-recipe .ak-cookbook-cover-note'
]);
function parentDisplay(width) {
  let display = 'block', specificity = -1;
  for (const rule of [...screenRules(cookbook, width), ...screenRules(visual, width)]) {
    for (const selector of rule.prelude.children) {
      const text = cssTree.generate(selector);
      if (!parentSelectors.has(text)) continue;
      const weight = selector.children.filter(node => node.type === 'ClassSelector').length;
      for (const declaration of rule.block.children) {
        if (declaration.type === 'Declaration' && declaration.property === 'display' && weight >= specificity) {
          assert.equal(declaration.important, false, 'Review important cover-note overrides explicitly');
          display = cssTree.generate(declaration.value); specificity = weight;
        }
      }
    }
  }
  return display;
}
function hiddenChildClasses() {
  const rules = visual.children.filter(node => node.type === 'Rule'
    && cssTree.generate(node.prelude).startsWith('.ak-visual-recipe .ak-cookbook-cover-note>'));
  assert.equal(rules.length, 1, 'One compact-detail rule owns the cover-note children');
  const rule = rules[0], selector = rule.prelude.children[0];
  assert.equal(rule.prelude.children.length, 1);
  assert.equal(cssTree.generate(rule.block), '{display:none}');
  const prefix = selector.children.slice(0, 4);
  assert.equal(cssTree.generate({type:'Selector',children:prefix}), '.ak-visual-recipe .ak-cookbook-cover-note>');
  return selector.children.slice(4).map(node => {
    assert.equal(node.type, 'PseudoClassSelector'); assert.equal(node.name, 'not');
    assert.equal(node.children.length, 1);
    const selectors = node.children[0].children;
    assert.equal(selectors.length, 1); assert.equal(selectors[0].children.length, 1);
    const excluded = selectors[0].children[0];
    assert.equal(excluded.type, 'ClassSelector');
    return excluded.name;
  });
}
for (const width of [390, 600, 601, 640, 760, 761, 1280]) {
  test('attributed source and illustration credit escape compact-cover hiding at ' + width + 'px', () => {
    assert.notEqual(parentDisplay(width), 'none', 'The source must not inherit a hidden cover note');
    const exclusions = hiddenChildClasses();
    assert(exclusions.includes('ak-source-reference'), 'The actual source paragraph must remain visible');
    assert(exclusions.includes('ak-static-credit'), 'Illustration credit must remain visible');
  });
}
test('unrelated cover details remain compact and neither selector reveals all children', () => {
  assert.deepEqual(hiddenChildClasses().sort(), ['ak-source-reference', 'ak-static-credit'].sort());
  assert.equal(parentDisplay(601), 'block');
  const cookbookText = read('tools/afrokitchen/cookbook.css');
  assert(cookbookText.includes('.ak-page.ak-static-page .ak-cookbook-cover .ak-static-facts{display:none}'));
});
test('the genuine recipe shell applies cookbook then visual styles to its cover note before or after source refresh', () => {
  const html = read('tools/afrokitchen/recipes/mchemsho-tz/index.html');
  assert(html.includes('class="ak-page ak-static-page ak-visual-recipe"'));
  assert.equal((html.match(/<div class="ak-cookbook-cover-note">/g) || []).length, 1);
  const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)]
    .map(match => match[1].split('?')[0]);
  const cookbookPath = '/tools/afrokitchen/cookbook.css', visualPath = '/tools/afrokitchen/visual-recipe.css';
  assert.equal(styles.filter(href => href === cookbookPath).length, 1);
  assert.equal(styles.filter(href => href === visualPath).length, 1);
  assert(styles.indexOf(cookbookPath) < styles.indexOf(visualPath),
    'The visual cover-note policy must follow the compact cookbook media rules');
});
