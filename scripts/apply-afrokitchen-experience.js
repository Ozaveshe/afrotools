// Apply the shared AfroKitchen layout to already post-processed static pages.
// The page generator owns future output; this migration preserves release tags,
// image reviews, and SEO additions already present in committed HTML.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'tools', 'afrokitchen');
const STYLESHEET = '  <link rel="stylesheet" href="/tools/afrokitchen/experience.css?v=20260926a">';
const WRITE = process.argv.includes('--write');

function required(condition, message) {
  if (!condition) throw new Error(message);
}

function closingDivEnd(html, start) {
  const tags = /<\/?div\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;
  let tag;
  while ((tag = tags.exec(html))) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return tags.lastIndex;
  }
  throw new Error('Unclosed div in AfroKitchen page');
}

function addStylesheet(html) {
  if (html.includes('/tools/afrokitchen/experience.css?v=')) return html;
  required(html.includes('  </style>'), 'Missing page style block');
  return html.replace('  </style>', `  </style>\n${STYLESHEET}`);
}

function replaceHeroActions(html, actions) {
  const actionsPattern = /<div class="ak-hero-actions">[\s\S]*?<\/div>/;
  required(actionsPattern.test(html), 'Missing hero actions');
  return html.replace(actionsPattern, `<div class="ak-hero-actions">\n${actions}\n        </div>`);
}

function shortIntro(html, label) {
  const introPattern = /<p class="ak-hero-sub">([\s\S]*?)<\/p>/;
  const match = html.match(introPattern);
  required(match, 'Missing hero description');
  const intro = match[1];
  const lead = intro.match(/^.*?[.!?](?:\s|$)/)?.[0].trim() || intro;
  return html.replace(introPattern,
    `<p class="ak-hero-sub">${lead}</p>\n        <details class="ak-hero-more"><summary>About this ${label}</summary><p>${intro}</p></details>`);
}

function moveBefore(html, startMarker, endMarker) {
  const start = html.indexOf(startMarker);
  const next = html.indexOf(endMarker, start);
  required(start >= 0 && next > start, `Missing layout markers: ${startMarker}`);
  const end = closingDivEnd(html, next);
  const beforeBlock = html.slice(start, next);
  const movedBlock = html.slice(next, end);
  return html.slice(0, start) + movedBlock + '\n\n      ' + beforeBlock.trim() + html.slice(end);
}

function recipe(html) {
  html = addStylesheet(html);
  const country = html.match(/<a href="([^\"]+)" class="ak-btn ak-btn-secondary">[\s\S]*?<span>Explore ([^<]+) recipes<\/span><\/a>/);
  required(country, 'Missing country action');
  html = replaceHeroActions(html,
    '          <a href="#recipe-ingredients" class="ak-btn ak-btn-primary"><span>Start cooking</span></a>\n          ' + country[0]);
  html = html.replace('<div class="ak-cook-shell">', '<div class="ak-cook-shell" id="recipe-ingredients">');
  html = html.replace('<section class="ak-method-panel">', '<section class="ak-method-panel" id="recipe-method">');
  required(html.includes('id="recipe-ingredients"'), 'Missing recipe cook shell');
  html = moveBefore(html, '      <div class="ak-static-summary-shell rv visible">',
    '      <div class="ak-cook-shell" id="recipe-ingredients">');
  html = html.replace('Recipe overview</div>', 'Recipe context</div>')
    .replace('What to know before you cook</h2>', 'More about this dish</h2>')
    .replace('Use this overview to check the occasion, serving ideas, regional context, and cooking commitment before you begin.',
      'Serving ideas, regional context, and cooking cues for when you want more detail.');
  return html;
}

function country(html) {
  html = addStylesheet(html);
  html = shortIntro(html, 'cuisine');
  const countryName = html.match(/<h1>(.*?) Recipes<\/h1>/)?.[1];
  required(countryName, 'Missing country name');
  html = replaceHeroActions(html,
    `          <a href="#country-recipes" class="ak-btn ak-btn-primary">See ${countryName} recipes</a>\n          <a href="/tools/afrokitchen/#collections-grid" class="ak-btn ak-btn-outline">Browse collections</a>`);
  html = html.replace('<div class="ak-country-hub-shell rv visible">',
    '<div class="ak-country-hub-shell rv visible" id="country-recipes">');
  required(html.includes('id="country-recipes"'), 'Missing country archive');
  return html;
}

function collection(html) {
  html = addStylesheet(html);
  html = shortIntro(html, 'collection');
  html = replaceHeroActions(html,
    '          <a href="#collection-recipes" class="ak-btn ak-btn-primary">See recipes</a>\n          <a href="/tools/afrokitchen/#country-grid" class="ak-btn ak-btn-outline">Browse country hubs</a>');
  html = html.replace('<div class="ak-country-hub-shell rv visible">',
    '<div class="ak-country-hub-shell rv visible" id="collection-recipes">');
  required(html.includes('id="collection-recipes"'), 'Missing collection archive');
  return moveBefore(html, '      <section class="ak-intel-panel ak-collection-best-panel">',
    '      <div class="ak-country-hub-shell rv visible" id="collection-recipes">');
}

const routes = [
  ['recipes', recipe, 410],
  ['countries', country, 55],
  ['collections', collection, 17],
];
let changed = 0;
for (const [group, transform, expected] of routes) {
  const directory = path.join(ROOT, group);
  const files = fs.readdirSync(directory).map(slug => path.join(directory, slug, 'index.html'))
    .filter(file => fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes('ak-page ak-'));
  required(files.length === expected, `Expected ${expected} ${group} pages, found ${files.length}`);
  for (const file of files) {
    const before = fs.readFileSync(file, 'utf8');
    if (before.includes('/tools/afrokitchen/experience.css?v=')) continue;
    const after = transform(before);
    if (after !== before) {
      if (WRITE) fs.writeFileSync(file, after);
      changed++;
    }
  }
}
console.log(`${WRITE ? 'Updated' : 'Would update'} ${changed} AfroKitchen static pages.`);
