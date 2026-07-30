const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const manifest = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'reports/fr-engineering-construction-parity-manifest.json'),
  'utf8'
));
const fixtures = JSON.parse(fs.readFileSync(
  path.join(ROOT, 'tests/fixtures/engineering-construction-owner-parity.json'),
  'utf8'
));
const fixturesById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
const missing = {
  afrodraft: '/fr/ingenierie/afrodraft/',
  'afroplan-floor-planner': '/fr/ingenierie/planificateur-etage/',
  'scaffolding-calc': '/fr/tools/calculateur-echafaudage/',
  'window-door-sizing': '/fr/tools/dimensionnement-fenetres-portes/',
  'plumbing-material': '/fr/tools/materiaux-plomberie/'
};
const rows = manifest.routes.map((row) => ({ ...row, french: row.french || missing[row.id] }));

async function runtimeLanguageBlockers(page) {
  return page.evaluate(() => {
    const english = /\b(?:the|your|you|with|from|into|and|are|will|can|should|must|need|enter|select|click|choose|uses|using|calculator|calculate|estimate|generate|copy|reset|building|buildings|materials|room|rooms|length|width|height|download|save|before|after|based|each|only|get|drawing|drawings|draw|launch|load|template|templates|start|view|popular|editable|fixture|works|browser|quick|open|home|shop|office|classroom|add|measured|adjust|waste|finish|when|ready|project|setup|name|city|market|optional|focus|draft|restore|summary|amount|count|create|reviewed|quality|checks|faq|what|verify|official|educational|workflow|filing|quote|legal|decision|guaranteed|outcome|homes|small|furniture|preview|drag|rotate|scroll|pinch|zoom|presets|refresh|fit|back|canvas|flat|family|grid|panel|watts|battery|backup|days|best|facing|poor|direction|shade|clean|dusty|season|appliance|remove|controller|beam|column|slab|footing|results|warning|required|recommended|sheets|boxes|bars|people|hours|rate|none|light|heavy|commands|themes|features|modify|annotate|layers|layout|see|really|free|offline|stored|files|students|architects|engineers|technical)\b/i;
    const malformed = /(?:\uFFFD|Ã.|Â.|â[€™“”–—])/;
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        Number.parseFloat(style.opacity || '1') > 0 &&
        rect.width > 0 &&
        rect.height > 0;
    };
    const pathFor = (element) => {
      const root = element.getRootNode();
      const host = root instanceof ShadowRoot ? `${root.host.tagName.toLowerCase()}::shadow ` : '';
      const id = element.id ? `#${element.id}` : '';
      const classes = element.classList.length
        ? `.${Array.from(element.classList).slice(0, 2).join('.')}`
        : '';
      return `${host}${element.tagName.toLowerCase()}${id}${classes}`;
    };
    const blockers = [];
    const sharedScaffolding = [
      'afro-navbar',
      'afro-footer',
      'afro-site-assistant'
    ].join(',');
    const inspect = (root) => {
      root.querySelectorAll('*').forEach((element) => {
        if (element.matches?.(sharedScaffolding)) return;
        if (element.shadowRoot) inspect(element.shadowRoot);
        if (
          !visible(element) ||
          element.closest('.fr-engineering-provenance,script,style,noscript,code,pre')
        ) return;
        Array.from(element.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE && /\S/.test(node.data || ''))
          .forEach((node) => {
            const text = node.data.replace(/\s+/g, ' ').trim();
            if (!text || /^https?:\/\/afrotools\.com\//i.test(text)) return;
            const matches = text.match(english);
            if (matches || malformed.test(text)) {
              blockers.push({
                path: pathFor(element),
                text: text.slice(0, 180),
                marker: matches ? matches[0] : 'malformed-encoding'
              });
            }
          });
      });
    };
    inspect(document.body);
    return blockers;
  });
}

for (const row of rows) {
  test(`${row.id} | ${row.french} initial and rendered runtime copy is French`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(row.french, { waitUntil: 'domcontentloaded' });
    const receipt = {
      initial: await runtimeLanguageBlockers(page),
      rendered: []
    };

    const fixture = fixturesById.get(row.id);
    if (fixture && fixture.frenchAction) {
      const action = page.getByRole('button', {
        name: new RegExp(fixture.frenchAction.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      }).first();
      await expect(action, `${row.french} primary result action`).toBeVisible();
      await action.click();
    }
    await page.evaluate(() =>
      new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );
    receipt.rendered = await runtimeLanguageBlockers(page);
    expect(receipt, `${row.french} initial and rendered runtime copy`).toEqual({
      initial: [],
      rendered: []
    });
  });
}
