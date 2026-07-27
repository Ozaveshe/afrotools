const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const CATEGORY_IDS = ['african', 'religious-cultural', 'data-productivity'];
const HUBS = [
  {
    category: 'african',
    route: '/uniquely-african/',
    alternateRoutes: ['/african/'],
  },
  {
    category: 'religious-cultural',
    route: '/religious-cultural/',
    alternateRoutes: [],
  },
  {
    category: 'data-productivity',
    route: '/business-roi/',
    alternateRoutes: ['/data-productivity/'],
  },
];

function loadRegistry() {
  const registryPath = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
  const source = `${fs.readFileSync(registryPath, 'utf8')}
globalThis.__day10Tools = AFRO_TOOLS;
globalThis.__day10Categories = AFRO_CATEGORIES;`;
  const context = {};
  vm.createContext(context);
  vm.runInContext(source, context, { filename: registryPath });
  return {
    tools: context.__day10Tools,
    categories: context.__day10Categories,
  };
}

function normalizeRoute(route) {
  const normalized = String(route || '').replace(/\/index\.html$/, '').replace(/\/$/, '');
  return normalized || '/';
}

function getCanonicalEnglishApps() {
  const { tools } = loadRegistry();
  const seen = new Set();
  return tools.filter((tool) => {
    if (tool.lang && tool.lang !== 'en') return false;
    if (!CATEGORY_IDS.includes(tool.category)) return false;
    if (!['live', 'new'].includes(tool.status)) return false;
    const route = normalizeRoute(tool.href);
    if (seen.has(route)) return false;
    seen.add(route);
    return true;
  });
}

function routeToFile(route) {
  const clean = String(route || '').replace(/^\/+|\/+$/g, '');
  const directoryIndex = path.join(ROOT, clean, 'index.html');
  if (fs.existsSync(directoryIndex)) return directoryIndex;
  const htmlFile = path.join(ROOT, `${clean}.html`);
  if (fs.existsSync(htmlFile)) return htmlFile;
  const directFile = path.join(ROOT, clean);
  if (fs.existsSync(directFile) && fs.statSync(directFile).isFile()) return directFile;
  return directoryIndex;
}

module.exports = {
  CATEGORY_IDS,
  HUBS,
  ROOT,
  getCanonicalEnglishApps,
  loadRegistry,
  normalizeRoute,
  routeToFile,
};
