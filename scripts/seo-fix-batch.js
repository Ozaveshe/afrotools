#!/usr/bin/env node
/**
 * SEO Fix Batch Script
 * Priority 1: Static HTML country grids on hub pages
 * Priority 2: Add cross-tool-nav.js to agriculture country pages
 * Priority 5: Add BreadcrumbList schema to agriculture country pages
 * Priority 6: Add GA4 to agriculture pages missing it
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const AGRI = path.join(ROOT, 'agriculture');

// ═══════════════════════════════════════
// COUNTRY DATA (from country-index.js)
// ═══════════════════════════════════════
const COUNTRIES = [
  {code:"NG",name:"Nigeria",slug:"nigeria",region:"west_africa",flag:"&#127475;&#127468;"},
  {code:"GH",name:"Ghana",slug:"ghana",region:"west_africa",flag:"&#127468;&#127469;"},
  {code:"CI",name:"C&ocirc;te d&rsquo;Ivoire",slug:"cote-d-ivoire",region:"west_africa",flag:"&#127464;&#127470;"},
  {code:"SN",name:"Senegal",slug:"senegal",region:"west_africa",flag:"&#127480;&#127475;"},
  {code:"ML",name:"Mali",slug:"mali",region:"west_africa",flag:"&#127474;&#127473;"},
  {code:"BF",name:"Burkina Faso",slug:"burkina-faso",region:"west_africa",flag:"&#127463;&#127467;"},
  {code:"NE",name:"Niger",slug:"niger",region:"west_africa",flag:"&#127475;&#127466;"},
  {code:"GN",name:"Guinea",slug:"guinea",region:"west_africa",flag:"&#127468;&#127475;"},
  {code:"BJ",name:"Benin",slug:"benin",region:"west_africa",flag:"&#127463;&#127471;"},
  {code:"TG",name:"Togo",slug:"togo",region:"west_africa",flag:"&#127481;&#127468;"},
  {code:"SL",name:"Sierra Leone",slug:"sierra-leone",region:"west_africa",flag:"&#127480;&#127473;"},
  {code:"LR",name:"Liberia",slug:"liberia",region:"west_africa",flag:"&#127473;&#127479;"},
  {code:"MR",name:"Mauritania",slug:"mauritania",region:"west_africa",flag:"&#127474;&#127479;"},
  {code:"GM",name:"Gambia",slug:"gambia",region:"west_africa",flag:"&#127468;&#127474;"},
  {code:"GW",name:"Guinea-Bissau",slug:"guinea-bissau",region:"west_africa",flag:"&#127468;&#127484;"},
  {code:"CV",name:"Cabo Verde",slug:"cabo-verde",region:"west_africa",flag:"&#127464;&#127483;"},
  {code:"KE",name:"Kenya",slug:"kenya",region:"east_africa",flag:"&#127472;&#127466;"},
  {code:"ET",name:"Ethiopia",slug:"ethiopia",region:"east_africa",flag:"&#127466;&#127481;"},
  {code:"TZ",name:"Tanzania",slug:"tanzania",region:"east_africa",flag:"&#127481;&#127487;"},
  {code:"UG",name:"Uganda",slug:"uganda",region:"east_africa",flag:"&#127482;&#127468;"},
  {code:"RW",name:"Rwanda",slug:"rwanda",region:"east_africa",flag:"&#127479;&#127484;"},
  {code:"BI",name:"Burundi",slug:"burundi",region:"east_africa",flag:"&#127463;&#127470;"},
  {code:"SO",name:"Somalia",slug:"somalia",region:"east_africa",flag:"&#127480;&#127476;"},
  {code:"DJ",name:"Djibouti",slug:"djibouti",region:"east_africa",flag:"&#127465;&#127471;"},
  {code:"ER",name:"Eritrea",slug:"eritrea",region:"east_africa",flag:"&#127466;&#127479;"},
  {code:"SS",name:"South Sudan",slug:"south-sudan",region:"east_africa",flag:"&#127480;&#127480;"},
  {code:"CD",name:"DR Congo",slug:"dr-congo",region:"central_africa",flag:"&#127464;&#127465;"},
  {code:"CM",name:"Cameroon",slug:"cameroon",region:"central_africa",flag:"&#127464;&#127474;"},
  {code:"CG",name:"Congo (Brazzaville)",slug:"congo-brazzaville",region:"central_africa",flag:"&#127464;&#127468;"},
  {code:"GA",name:"Gabon",slug:"gabon",region:"central_africa",flag:"&#127468;&#127462;"},
  {code:"GQ",name:"Equatorial Guinea",slug:"equatorial-guinea",region:"central_africa",flag:"&#127468;&#127478;"},
  {code:"CF",name:"Central African Republic",slug:"central-african-republic",region:"central_africa",flag:"&#127464;&#127467;"},
  {code:"TD",name:"Chad",slug:"chad",region:"central_africa",flag:"&#127481;&#127465;"},
  {code:"ST",name:"Sao Tome and Principe",slug:"sao-tome-and-principe",region:"central_africa",flag:"&#127480;&#127481;"},
  {code:"ZA",name:"South Africa",slug:"south-africa",region:"southern_africa",flag:"&#127487;&#127462;"},
  {code:"MZ",name:"Mozambique",slug:"mozambique",region:"southern_africa",flag:"&#127474;&#127487;"},
  {code:"ZM",name:"Zambia",slug:"zambia",region:"southern_africa",flag:"&#127487;&#127474;"},
  {code:"ZW",name:"Zimbabwe",slug:"zimbabwe",region:"southern_africa",flag:"&#127487;&#127484;"},
  {code:"MW",name:"Malawi",slug:"malawi",region:"southern_africa",flag:"&#127474;&#127484;"},
  {code:"AO",name:"Angola",slug:"angola",region:"southern_africa",flag:"&#127462;&#127476;"},
  {code:"NA",name:"Namibia",slug:"namibia",region:"southern_africa",flag:"&#127475;&#127462;"},
  {code:"BW",name:"Botswana",slug:"botswana",region:"southern_africa",flag:"&#127463;&#127484;"},
  {code:"LS",name:"Lesotho",slug:"lesotho",region:"southern_africa",flag:"&#127473;&#127480;"},
  {code:"SZ",name:"Eswatini",slug:"eswatini",region:"southern_africa",flag:"&#127480;&#127487;"},
  {code:"EG",name:"Egypt",slug:"egypt",region:"north_africa",flag:"&#127466;&#127468;"},
  {code:"MA",name:"Morocco",slug:"morocco",region:"north_africa",flag:"&#127474;&#127462;"},
  {code:"DZ",name:"Algeria",slug:"algeria",region:"north_africa",flag:"&#127465;&#127487;"},
  {code:"TN",name:"Tunisia",slug:"tunisia",region:"north_africa",flag:"&#127481;&#127475;"},
  {code:"LY",name:"Libya",slug:"libya",region:"north_africa",flag:"&#127473;&#127486;"},
  {code:"SD",name:"Sudan",slug:"sudan",region:"north_africa",flag:"&#127480;&#127465;"},
  {code:"MG",name:"Madagascar",slug:"madagascar",region:"island_nations",flag:"&#127474;&#127468;"},
  {code:"MU",name:"Mauritius",slug:"mauritius",region:"island_nations",flag:"&#127474;&#127482;"},
  {code:"SC",name:"Seychelles",slug:"seychelles",region:"island_nations",flag:"&#127480;&#127464;"},
  {code:"KM",name:"Comoros",slug:"comoros",region:"island_nations",flag:"&#127472;&#127474;"}
];

const REGIONS = [
  {key: 'west_africa', name: 'West Africa'},
  {key: 'east_africa', name: 'East Africa'},
  {key: 'central_africa', name: 'Central Africa'},
  {key: 'southern_africa', name: 'Southern Africa'},
  {key: 'north_africa', name: 'North Africa'},
  {key: 'island_nations', name: 'Island Nations'}
];

// Tool name mappings for BreadcrumbList and display
const TOOL_NAMES = {
  'crop-yield': 'Crop Yield Estimators',
  'export-docs': 'Export Documentation',
  'farm-payroll': 'Farm Worker Payroll',
  'farm-profit': 'Farm Profit Calculator',
  'fertilizer': 'Fertilizer Calculator',
  'harvest-date': 'Harvest Date Estimator',
  'irrigation': 'Irrigation Calculator',
  'seed-rate': 'Seed Rate Calculator',
  'vaccination-schedule': 'Vaccination Schedule',
  'cassava-processing': 'Cassava Processing',
  'crop-insurance': 'Crop Insurance',
  'farm-loans': 'Farm Loans',
  'fish-farming': 'Fish Farming Calculator',
  'greenhouse': 'Greenhouse Calculator',
  'input-prices': 'Input Prices',
  'livestock-feed': 'Livestock Feed Calculator',
  'poultry-roi': 'Poultry ROI Calculator'
};

const GA4_SNIPPET = '<script async src="https://www.googletagmanager.com/gtag/js?id=G-D859CGF391"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\'js\',new Date());gtag(\'config\',\'G-D859CGF391\');</script>';
const CROSS_TOOL_SCRIPT = '<script src="/assets/js/lib/cross-tool-nav.js" defer></script>';

let stats = { hubsFixed: 0, crossToolAdded: 0, breadcrumbAdded: 0, ga4Added: 0 };

// ═══════════════════════════════════════
// PRIORITY 1: Static HTML country grids
// ═══════════════════════════════════════

function generateStaticGrid(toolSlug, availableSlugs) {
  let html = '\n';
  for (const region of REGIONS) {
    const group = COUNTRIES.filter(c => c.region === region.key && availableSlugs.includes(c.slug));
    if (!group.length) continue;
    html += `  <div class="region-section">\n`;
    html += `    <div class="region-label">${region.name} (${group.length})</div>\n`;
    html += `    <div class="country-grid">\n`;
    for (const c of group) {
      html += `      <a class="country-card" href="/agriculture/${toolSlug}/${c.slug}"><span class="flag">${c.flag}</span><span class="name">${c.name}</span><span class="arrow">&rsaquo;</span></a>\n`;
    }
    html += `    </div>\n`;
    html += `  </div>\n`;
  }
  return html;
}

function fixHubPage(toolSlug) {
  const hubFile = path.join(AGRI, toolSlug, 'index.html');
  if (!fs.existsSync(hubFile)) return;

  let html = fs.readFileSync(hubFile, 'utf8');

  // Get available country slugs for this tool
  const dir = path.join(AGRI, toolSlug);
  const availableSlugs = fs.readdirSync(dir)
    .filter(f => f.endsWith('.html') && f !== 'index.html' && f !== '_template.html')
    .map(f => f.replace('.html', ''));

  if (!availableSlugs.length) return;

  // Check if hub uses JS-only rendering (empty hubMain div with country-index.js)
  const hasCountryIndex = html.includes('country-index.js');
  const hasEmptyHubMain = /<div\s+class="hub-main"\s+id="hubMain"\s*>\s*<\/div>/i.test(html);

  // Also check for countryHub pattern (fish-farming, greenhouse)
  const hasCountryHub = /id="countryHub"\s*>\s*<\/div>/i.test(html);

  if (hasEmptyHubMain && hasCountryIndex) {
    // 54-country tools: Replace empty hubMain with static HTML
    const staticGrid = generateStaticGrid(toolSlug, availableSlugs);
    html = html.replace(
      /<div\s+class="hub-main"\s+id="hubMain"\s*>\s*<\/div>/i,
      `<div class="hub-main" id="hubMain">\n${staticGrid}</div>`
    );
    stats.hubsFixed++;
    console.log(`  [P1] Fixed hub: ${toolSlug} (${availableSlugs.length} countries, static HTML added)`);
  } else if (hasCountryHub) {
    // fish-farming, greenhouse pattern
    const staticGrid = generateStaticGrid(toolSlug, availableSlugs);
    html = html.replace(
      /id="countryHub"\s*>\s*<\/div>/i,
      `id="countryHub">\n${staticGrid}</div>`
    );
    stats.hubsFixed++;
    console.log(`  [P1] Fixed hub: ${toolSlug} (${availableSlugs.length} countries, countryHub pattern)`);
  }

  // Also add GA4 to hub pages if missing
  if (!html.includes('G-D859CGF391')) {
    html = html.replace('</head>', GA4_SNIPPET + '\n</head>');
    stats.ga4Added++;
  }

  fs.writeFileSync(hubFile, html, 'utf8');
}

// ═══════════════════════════════════════
// PRIORITIES 2, 5, 6: Country pages
// ═══════════════════════════════════════

function getCountryName(slug) {
  const c = COUNTRIES.find(x => x.slug === slug);
  return c ? c.name : slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}

function fixCountryPage(toolSlug, countrySlug) {
  const filePath = path.join(AGRI, toolSlug, countrySlug + '.html');
  if (!fs.existsSync(filePath)) return;

  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const toolName = TOOL_NAMES[toolSlug] || toolSlug;
  const countryName = getCountryName(countrySlug);

  // Priority 2: Add cross-tool-nav.js if missing
  if (!html.includes('cross-tool-nav.js')) {
    // Insert before </body> or before the twemoji script
    if (html.includes('twemoji')) {
      html = html.replace(
        /(<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@twemoji)/,
        CROSS_TOOL_SCRIPT + '\n$1'
      );
    } else {
      html = html.replace('</body>', CROSS_TOOL_SCRIPT + '\n</body>');
    }
    stats.crossToolAdded++;
    changed = true;
  }

  // Priority 5: Add BreadcrumbList schema if missing
  if (!html.includes('BreadcrumbList')) {
    const breadcrumbSchema = `\n<script type="application/ld+json">
{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"AfroTools","item":"https://afrotools.com/"},{"@type":"ListItem","position":2,"name":"Agriculture","item":"https://afrotools.com/agriculture/"},{"@type":"ListItem","position":3,"name":"${toolName}","item":"https://afrotools.com/agriculture/${toolSlug}/"},{"@type":"ListItem","position":4,"name":"${countryName}","item":"https://afrotools.com/agriculture/${toolSlug}/${countrySlug}"}]}
</script>`;
    // Insert after the WebApplication schema
    const webAppEnd = html.indexOf('</script>', html.indexOf('"WebApplication"'));
    if (webAppEnd !== -1) {
      html = html.slice(0, webAppEnd + 9) + breadcrumbSchema + html.slice(webAppEnd + 9);
    } else {
      // Fallback: insert before </head>
      html = html.replace('</head>', breadcrumbSchema + '\n</head>');
    }
    stats.breadcrumbAdded++;
    changed = true;
  }

  // Priority 6: Add GA4 if missing
  if (!html.includes('G-D859CGF391')) {
    html = html.replace('</head>', GA4_SNIPPET + '\n</head>');
    stats.ga4Added++;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
  }
}

// ═══════════════════════════════════════
// MAIN
// ═══════════════════════════════════════

console.log('Starting SEO batch fixes...\n');

// Get all agriculture tool directories with country pages
const toolDirs = fs.readdirSync(AGRI, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const toolSlug of toolDirs) {
  const dir = path.join(AGRI, toolSlug);
  const countryFiles = fs.readdirSync(dir)
    .filter(f => f.endsWith('.html') && f !== 'index.html' && f !== '_template.html');

  if (!countryFiles.length) continue;

  console.log(`Processing ${toolSlug}/ (${countryFiles.length} country pages)...`);

  // Priority 1: Fix hub page
  fixHubPage(toolSlug);

  // Priorities 2, 5, 6: Fix each country page
  for (const file of countryFiles) {
    const countrySlug = file.replace('.html', '');
    fixCountryPage(toolSlug, countrySlug);
  }
}

console.log('\n═══ RESULTS ═══');
console.log(`Hub pages with static HTML added: ${stats.hubsFixed}`);
console.log(`Cross-tool-nav.js added to: ${stats.crossToolAdded} pages`);
console.log(`BreadcrumbList schema added to: ${stats.breadcrumbAdded} pages`);
console.log(`GA4 tracking added to: ${stats.ga4Added} pages`);
console.log('Done!');
