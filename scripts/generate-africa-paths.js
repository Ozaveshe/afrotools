/**
 * Generate accurate SVG paths for African countries from Natural Earth data.
 * Uses world-atlas (110m for mainland, 50m for islands) + d3-geo for projection.
 * Output: JavaScript PATHS object for africa-map.js
 */
const path = require('path');
const rootDir = path.resolve(__dirname, '..');
const topojson = require(path.join(rootDir, 'node_modules', 'topojson-client'));
const d3 = require(path.join(rootDir, 'node_modules', 'd3-geo'));
const fs = require('fs');

// ISO 3166-1 numeric to ISO2 mapping for African countries
const numToISO2 = {
  '012': 'DZ', '024': 'AO', '204': 'BJ', '072': 'BW', '854': 'BF',
  '108': 'BI', '132': 'CV', '120': 'CM', '140': 'CF', '148': 'TD',
  '174': 'KM', '178': 'CG', '180': 'CD', '384': 'CI', '262': 'DJ',
  '818': 'EG', '226': 'GQ', '232': 'ER', '748': 'SZ', '231': 'ET',
  '266': 'GA', '270': 'GM', '288': 'GH', '324': 'GN', '624': 'GW',
  '404': 'KE', '426': 'LS', '430': 'LR', '434': 'LY', '450': 'MG',
  '454': 'MW', '466': 'ML', '478': 'MR', '480': 'MU', '504': 'MA',
  '508': 'MZ', '516': 'NA', '562': 'NE', '566': 'NG', '646': 'RW',
  '678': 'ST', '686': 'SN', '690': 'SC', '694': 'SL', '706': 'SO',
  '710': 'ZA', '728': 'SS', '729': 'SD', '834': 'TZ', '768': 'TG',
  '788': 'TN', '800': 'UG', '894': 'ZM', '716': 'ZW',
  '732': 'EH',
};

// Create a custom Mercator projection focused on Africa
const projection = d3.geoMercator()
  .center([20, 3])
  .scale(330)
  .translate([300, 340]);

const pathGenerator = d3.geoPath().projection(projection);

function roundPath(pathStr) {
  if (!pathStr) return '';
  return pathStr.replace(/-?\d+\.\d+/g, (m) => Math.round(parseFloat(m)).toString());
}

// Load 110m for mainland countries
const world110 = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'node_modules', 'world-atlas', 'countries-110m.json'), 'utf8')
);
const countries110 = topojson.feature(world110, world110.objects.countries);

// Load 50m for small island nations
const world50 = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'node_modules', 'world-atlas', 'countries-50m.json'), 'utf8')
);
const countries50 = topojson.feature(world50, world50.objects.countries);

const paths = {};

// First pass: 110m for mainland
for (const feature of countries110.features) {
  const iso2 = numToISO2[feature.id];
  if (!iso2 || iso2 === 'EH') continue;
  const d = pathGenerator(feature);
  if (d) paths[iso2] = roundPath(d);
}

// Second pass: 50m only for missing island nations
const islandCodes = ['CV', 'KM', 'MU', 'ST', 'SC'];
for (const feature of countries50.features) {
  const iso2 = numToISO2[feature.id];
  if (!iso2 || !islandCodes.includes(iso2)) continue;
  if (paths[iso2]) continue; // already have it
  const d = pathGenerator(feature);
  if (d) {
    // For tiny islands, round to 1 decimal for a bit more accuracy
    paths[iso2] = d.replace(/-?\d+\.\d+/g, (m) => parseFloat(m).toFixed(1));
  }
}

// Sort order
const keyOrder = [
  'MA','DZ','TN','LY','EG','MR','ML','NE','TD','SD','ER','DJ','ET','SO',
  'SN','GM','GW','GN','SL','LR','CI','BF','GH','TG','BJ','NG','CM',
  'GQ','GA','CG','CD','CF','SS','UG','KE','RW','BI','TZ','AO','ZM',
  'MW','MZ','NA','BW','ZW','ZA','LS','SZ','MG','KM','MU','SC','CV','ST'
];

// Output
console.log('  const PATHS = {');
const orderedEntries = keyOrder.filter(k => paths[k]).map(k => [k, paths[k]]);
for (const [k, v] of Object.entries(paths)) {
  if (!keyOrder.includes(k)) orderedEntries.push([k, v]);
}
for (let i = 0; i < orderedEntries.length; i++) {
  const [code, d] = orderedEntries[i];
  const comma = i < orderedEntries.length - 1 ? ',' : '';
  console.log(`    ${code}: '${d}'${comma}`);
}
console.log('  };');

const expected = new Set([
  'DZ','AO','BJ','BW','BF','BI','CV','CM','CF','TD','KM','CG','CD','CI',
  'DJ','EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR',
  'LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN',
  'SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW'
]);
const found = new Set(Object.keys(paths));
const missing = [...expected].filter(c => !found.has(c));
if (missing.length) console.error('MISSING countries:', missing.join(', '));
console.error('Total countries found:', found.size);
const totalSize = orderedEntries.reduce((sum, [, d]) => sum + d.length, 0);
console.error('Total path data size:', (totalSize / 1024).toFixed(1) + ' KB');
