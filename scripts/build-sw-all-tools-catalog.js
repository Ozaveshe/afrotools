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

module.exports = { renderSwAppCatalog };

if (require.main === module) {
  const html = fs.readFileSync(directory, 'utf8');
  const start = html.indexOf(begin), finish = html.indexOf(end, start);
  if (start < 0 || finish < start) throw new Error('Missing Swahili directory catalog markers');
  const next = html.slice(0, start) + renderSwAppCatalog() + html.slice(finish + end.length);
  if (next !== html) {
    if (process.argv.includes('--check')) throw new Error('Swahili directory catalog needs regeneration');
    fs.writeFileSync(directory, next);
  }
}
