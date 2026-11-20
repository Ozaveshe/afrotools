const fs = require('node:fs');
const path = require('node:path');
const { SWAHILI_CATEGORIES } = require('./lib/swahili-category-directory');
const { rows } = require('../reports/swahili-free-app-parity-inventory.json');

const root = path.resolve(__dirname, '..');
const directory = path.join(root, 'sw/zana-zote/index.html');
const begin = '<!-- sw-app-catalog:start -->';
const end = '<!-- sw-app-catalog:end -->';
function escapeHtml(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderSwAppCatalog() {
  const groups = new Map(SWAHILI_CATEGORIES.map(category => [category.key, []]));
  const seen = new Set();

  for (const row of rows) {
    if (!row.primarySwahiliFile || !row.primarySwahiliRoute) continue;
    if (!['native-candidate', 'localized-shell-candidate'].includes(row.state)) continue;
    const page = fs.readFileSync(path.join(root, row.primarySwahiliFile), 'utf8');
    const canonical = /<link\b[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/afrotools\.com(\/sw\/[^"']*)["']/i.exec(page)?.[1];
    if (!canonical || canonical.replace(/\/$/, '') !== row.primarySwahiliRoute.replace(/\/$/, '')) continue;
    if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(page)) continue;
    if (seen.has(canonical)) continue;
    const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(page)?.[1]
      .replace(/\s*[|–—-]\s*AfroTools.*$/i, '').replace(/\s+/g, ' ').trim();
    if (!title || /[<>]/.test(title)) throw new Error('Invalid Swahili title in ' + row.primarySwahiliFile);
    // The source title is HTML text and can already contain character references.
    const name = title.replace(/&(?!#(?:x[\da-f]+|\d+);|[a-z][a-z\d]+;)/gi, '&amp;');
    // Conflicting English ownership does not invalidate a self-canonical Swahili destination.
    // List it by its own title without replacing an English search result.
    const id = row.ownerConflict ? canonical : row.englishId;
    groups.get(row.categoryKey).push({ name, id, canonical });
    seen.add(canonical);
  }

  const lines = [begin, '<section id="zana-kwa-kategoria" class="sec sw-app-catalog"><div class="wrap">',
    '<h2 class="sec-title">Zana kwa kategoria</h2>'];
  for (const category of SWAHILI_CATEGORIES) {
    const tools = groups.get(category.key);
    if (!tools.length) continue;
    lines.push('<details data-sw-category="' + escapeHtml(category.key) + '"><summary>' + escapeHtml(category.title) + '</summary><ul>');
    for (const tool of tools.sort((a, b) => a.name.localeCompare(b.name, 'sw') || a.id.localeCompare(b.id))) {
      lines.push('<li><a data-sw-tool="' + escapeHtml(tool.id) + '" href="' + escapeHtml(tool.canonical) + '">' + tool.name + '</a></li>');
    }
    lines.push('</ul></details>');
  }
  lines.push('</div></section>', end);
  return lines.join('\n');
}

function updateSwDirectory(html) {
  function replaceOnce(original, replacement, installed) {
    if (html.includes(installed)) return;
    const at = html.indexOf(original);
    if (at < 0 || html.indexOf(original, at + original.length) >= 0) {
      throw new Error('Missing or ambiguous Swahili directory anchor: ' + original.slice(0, 80));
    }
    html = html.slice(0, at) + replacement + html.slice(at + original.length);
  }
  replaceOnce(`</head>`,
    `<style>
.sw-app-catalog details{border-bottom:1px solid #cbd5e1}
.sw-app-catalog summary{padding:.85rem 0;font-weight:650;cursor:pointer}
.sw-app-catalog ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:.4rem 1.5rem;list-style:none;padding:0 0 1rem}
.sw-app-catalog li a{display:block;padding:.4rem 0;color:#234581;text-decoration:underline}
</style>
</head>`,
    `<style>
.sw-app-catalog details{border-bottom:1px solid #cbd5e1}
.sw-app-catalog summary{padding:.85rem 0;font-weight:650;cursor:pointer}
.sw-app-catalog ul{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr));gap:.4rem 1.5rem;list-style:none;padding:0 0 1rem}
.sw-app-catalog li a{display:block;padding:.4rem 0;color:#234581;text-decoration:underline}
</style>`);
  const previousHeading = /    <h1 class="hero-h1">PAYE, mishahara na rekodi [^\n]+\n    <p class="hero-sub">[^\n]+<\/p>/.exec(html)?.[0];
  replaceOnce(previousHeading || 'missing old Swahili directory heading',
    `    <h1 class="hero-h1">Zana zote za AfroTools kwa Kiswahili</h1>
    <p class="hero-sub">Tafuta zana kwa jina au chagua kategoria. Matokeo ya Kiingereza huwekwa alama kabla ya kufunguliwa, na nchi ya zana haibadilishi lugha ya ukurasa.</p>`,
    `    <h1 class="hero-h1">Zana zote za AfroTools kwa Kiswahili</h1>
    <p class="hero-sub">Tafuta zana kwa jina au chagua kategoria. Matokeo ya Kiingereza huwekwa alama kabla ya kufunguliwa, na nchi ya zana haibadilishi lugha ya ukurasa.</p>`);
  replaceOnce(`    <div class="hero-btns">`,
    `    <div class="hero-btns">
      <a href="#zana-kwa-kategoria" class="btn-blue">Chagua kategoria</a>`,
    `href="#zana-kwa-kategoria"`);
  replaceOnce(`        tool.desc,`,
    `        tool.desc,
        tool.keywords,`,
    `        tool.keywords,`);
  replaceOnce(`      if (!total) return 0;`,
    `      if (!total) return 0;
      if (tokens.length && tokens.every(function(token) { return name.split(' ').includes(token); })) total += 80;`,
    `total += 80;`);
  replaceOnce(`    var scoredEntries = window.AFRO_TOOLS`,
    `    var registeredById = new Map(window.AFRO_TOOLS.map(function(tool) { return [tool.id, tool]; }));
    var nativeById = new Map();
    document.querySelectorAll('#zana-kwa-kategoria a[data-sw-tool]').forEach(function(link) {
      var id = link.dataset.swTool;
      var owner = registeredById.get(id) || {};
      nativeById.set(id, Object.assign({}, owner, {
        id: id, name: link.textContent, href: link.getAttribute('href'), lang: 'sw', status: 'live',
        desc: '', keywords: owner.name || '', category: link.closest('details').dataset.swCategory
      }));
    });
    var scoredEntries = Array.from(nativeById.values()).concat(window.AFRO_TOOLS.filter(function(tool) { return !nativeById.has(tool.id); }))`,
    `    var registeredById = new Map(`);
  replaceOnce(`        tool = localizeTool(tool);`,
    `        if (!isPreferredLocale(tool)) tool = localizeTool(tool);`,
    `        if (!isPreferredLocale(tool)) tool = localizeTool(tool);`);

  if (!html.includes(begin) && !html.includes(end)) {
    const anchor = '<div class="grid-3" id="search-results-grid"></div>\n  </div>\n</section>';
    replaceOnce(anchor, anchor + '\n' + begin + '\n' + end + '\n', begin);
  }
  const start = html.indexOf(begin), finish = html.indexOf(end);
  if (start < 0 || finish < start || html.indexOf(begin, start + begin.length) >= 0 || html.indexOf(end, finish + end.length) >= 0) {
    throw new Error('Invalid Swahili directory catalog markers');
  }
  return html.slice(0, start) + renderSwAppCatalog() + html.slice(finish + end.length);
}

module.exports = { renderSwAppCatalog, updateSwDirectory };

if (require.main === module) {
  const html = fs.readFileSync(directory, 'utf8');
  const next = updateSwDirectory(html);
  if (next !== html) {
    if (process.argv.includes('--check')) throw new Error('Swahili directory catalog needs regeneration');
    fs.writeFileSync(directory, next);
  }
}
