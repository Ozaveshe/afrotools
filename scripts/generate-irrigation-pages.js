#!/usr/bin/env node
/**
 * Generates irrigation water calculator HTML pages from the Nigeria template.
 * Usage: node scripts/generate-irrigation-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'agriculture/irrigation/nigeria.html');
const OUTPUT_DIR = path.join(ROOT, 'agriculture/irrigation');

// Country configurations (same as crop-yield generator, adapted for irrigation)
const countries = [
  { code: 'GH', slug: 'ghana', name: 'Ghana', dataFile: 'gh-agri-data.js', flag: '&#127468;&#127469;', topCrops: 'cocoa, cassava, maize, rice, yam', regionCount: 6, dataSource: 'Ghana Statistical Service' },
  { code: 'KE', slug: 'kenya', name: 'Kenya', dataFile: 'ke-agri-data.js', flag: '&#127472;&#127466;', topCrops: 'tea, maize, wheat, coffee, avocado', regionCount: 7, dataSource: 'Kenya National Bureau of Statistics' },
  { code: 'ZA', slug: 'south-africa', name: 'South Africa', dataFile: 'za-agri-data.js', flag: '&#127487;&#127462;', topCrops: 'maize, wheat, sugar cane, citrus, soybean', regionCount: 6, dataSource: 'Department of Agriculture, Land Reform and Rural Development' },
  { code: 'ET', slug: 'ethiopia', name: 'Ethiopia', dataFile: 'et-agri-data.js', flag: '&#127466;&#127481;', topCrops: 'teff, coffee, maize, wheat, sorghum', regionCount: 6, dataSource: 'Central Statistical Agency of Ethiopia' },
  { code: 'EG', slug: 'egypt', name: 'Egypt', dataFile: 'eg-agri-data.js', flag: '&#127466;&#127468;', topCrops: 'wheat, maize, rice, sugar cane, cotton', regionCount: 5, dataSource: 'Ministry of Agriculture and Land Reclamation' },
  { code: 'TZ', slug: 'tanzania', name: 'Tanzania', dataFile: 'tz-agri-data.js', flag: '&#127481;&#127487;', topCrops: 'maize, cassava, rice, cashew, tea', regionCount: 6, dataSource: 'Tanzania National Bureau of Statistics' },
  { code: 'UG', slug: 'uganda', name: 'Uganda', dataFile: 'ug-agri-data.js', flag: '&#127482;&#127468;', topCrops: 'coffee, banana, maize, cassava, beans', regionCount: 5, dataSource: 'Uganda Bureau of Statistics' },
  { code: 'CM', slug: 'cameroon', name: 'Cameroon', dataFile: 'cm-agri-data.js', flag: '&#127464;&#127474;', topCrops: 'cocoa, coffee, cassava, maize, plantain', regionCount: 5, dataSource: 'Institut National de la Statistique du Cameroun' },
  { code: 'SN', slug: 'senegal', name: 'Senegal', dataFile: 'sn-agri-data.js', flag: '&#127480;&#127475;', topCrops: 'groundnut, millet, rice, maize, cowpea', regionCount: 5, dataSource: 'Agence Nationale de la Statistique et de la Demographie' },
  { code: 'ML', slug: 'mali', name: 'Mali', dataFile: 'ml-agri-data.js', flag: '&#127474;&#127473;', topCrops: 'cotton, millet, sorghum, rice, fonio', regionCount: 4, dataSource: 'Institut National de la Statistique du Mali' },
  { code: 'MZ', slug: 'mozambique', name: 'Mozambique', dataFile: 'mz-agri-data.js', flag: '&#127474;&#127487;', topCrops: 'cassava, maize, rice, cashew, sugar cane', regionCount: 4, dataSource: 'Instituto Nacional de Estatistica' },
  { code: 'ZM', slug: 'zambia', name: 'Zambia', dataFile: 'zm-agri-data.js', flag: '&#127487;&#127474;', topCrops: 'maize, cassava, soybean, groundnut, tobacco', regionCount: 3, dataSource: 'Zambia Statistics Agency' },
  { code: 'MA', slug: 'morocco', name: 'Morocco', dataFile: 'ma-agri-data.js', flag: '&#127474;&#127462;', topCrops: 'wheat, citrus, olive, tomato, dates', regionCount: 5, dataSource: 'Haut-Commissariat au Plan' },
  { code: 'MG', slug: 'madagascar', name: 'Madagascar', dataFile: 'mg-agri-data.js', flag: '&#127474;&#127468;', topCrops: 'rice, cassava, vanilla, clove, coffee', regionCount: 4, dataSource: 'Institut National de la Statistique' },
  { code: 'CD', slug: 'dr-congo', name: 'DR Congo', dataFile: 'cd-agri-data.js', flag: '&#127464;&#127465;', topCrops: 'cassava, maize, plantain, rice, coffee', regionCount: 5, dataSource: 'Institut National de la Statistique' },
  { code: 'CI', slug: 'cote-d-ivoire', name: "Cote d'Ivoire", dataFile: 'ci-agri-data.js', flag: '&#127464;&#127470;', topCrops: 'cocoa, coffee, cashew, rubber, cassava', regionCount: 4, dataSource: 'Institut National de la Statistique' },
  { code: 'BF', slug: 'burkina-faso', name: 'Burkina Faso', dataFile: 'bf-agri-data.js', flag: '&#127463;&#127467;', topCrops: 'cotton, sorghum, millet, maize, cowpea', regionCount: 3, dataSource: 'Institut National de la Statistique et de la Demographie' },
  { code: 'NE', slug: 'niger', name: 'Niger', dataFile: 'ne-agri-data.js', flag: '&#127475;&#127466;', topCrops: 'millet, cowpea, sorghum, groundnut, onion', regionCount: 3, dataSource: 'Institut National de la Statistique' },
  { code: 'GN', slug: 'guinea', name: 'Guinea', dataFile: 'gn-agri-data.js', flag: '&#127468;&#127475;', topCrops: 'rice, cassava, fonio, groundnut, oil palm', regionCount: 4, dataSource: 'Institut National de la Statistique' },
  { code: 'BJ', slug: 'benin', name: 'Benin', dataFile: 'bj-agri-data.js', flag: '&#127463;&#127471;', topCrops: 'cotton, maize, cassava, yam, rice', regionCount: 3, dataSource: "Institut National de la Statistique et de l'Analyse Economique" },
  { code: 'TG', slug: 'togo', name: 'Togo', dataFile: 'tg-agri-data.js', flag: '&#127481;&#127468;', topCrops: 'maize, cassava, yam, cotton, sorghum', regionCount: 3, dataSource: 'Institut National de la Statistique et des Etudes Economiques' },
  { code: 'SL', slug: 'sierra-leone', name: 'Sierra Leone', dataFile: 'sl-agri-data.js', flag: '&#127480;&#127473;', topCrops: 'rice, cassava, sweet potato, groundnut, cocoa', regionCount: 3, dataSource: 'Statistics Sierra Leone' },
  { code: 'LR', slug: 'liberia', name: 'Liberia', dataFile: 'lr-agri-data.js', flag: '&#127473;&#127479;', topCrops: 'rubber, rice, cassava, cocoa, oil palm', regionCount: 3, dataSource: 'Liberia Institute of Statistics and Geo-Information Services' },
  { code: 'RW', slug: 'rwanda', name: 'Rwanda', dataFile: 'rw-agri-data.js', flag: '&#127479;&#127484;', topCrops: 'beans, banana, sweet potato, coffee, tea', regionCount: 4, dataSource: 'National Institute of Statistics of Rwanda' },
  { code: 'BI', slug: 'burundi', name: 'Burundi', dataFile: 'bi-agri-data.js', flag: '&#127463;&#127470;', topCrops: 'beans, banana, cassava, coffee, rice', regionCount: 3, dataSource: "Institut de Statistiques et d'Etudes Economiques du Burundi" },
  { code: 'SO', slug: 'somalia', name: 'Somalia', dataFile: 'so-agri-data.js', flag: '&#127480;&#127476;', topCrops: 'sorghum, maize, sesame, banana, cowpea', regionCount: 3, dataSource: 'Federal Government of Somalia' },
  { code: 'DJ', slug: 'djibouti', name: 'Djibouti', dataFile: 'dj-agri-data.js', flag: '&#127465;&#127471;', topCrops: 'tomato, onion, dates', regionCount: 2, dataSource: 'Direction de la Statistique et des Etudes Demographiques' },
  { code: 'ER', slug: 'eritrea', name: 'Eritrea', dataFile: 'er-agri-data.js', flag: '&#127466;&#127479;', topCrops: 'sorghum, millet, barley, teff, wheat', regionCount: 3, dataSource: 'National Statistics Office of Eritrea' },
  { code: 'SS', slug: 'south-sudan', name: 'South Sudan', dataFile: 'ss-agri-data.js', flag: '&#127480;&#127480;', topCrops: 'sorghum, maize, groundnut, sesame, cassava', regionCount: 3, dataSource: 'National Bureau of Statistics' },
  { code: 'CG', slug: 'congo-brazzaville', name: 'Congo (Brazzaville)', dataFile: 'cg-agri-data.js', flag: '&#127464;&#127468;', topCrops: 'cassava, sugar cane, oil palm, plantain, maize', regionCount: 3, dataSource: 'Institut National de la Statistique' },
  { code: 'GA', slug: 'gabon', name: 'Gabon', dataFile: 'ga-agri-data.js', flag: '&#127468;&#127462;', topCrops: 'cassava, plantain, oil palm, cocoa, maize', regionCount: 2, dataSource: 'Direction Generale de la Statistique' },
  { code: 'GQ', slug: 'equatorial-guinea', name: 'Equatorial Guinea', dataFile: 'gq-agri-data.js', flag: '&#127468;&#127478;', topCrops: 'cocoa, coffee, cassava, sweet potato, oil palm', regionCount: 2, dataSource: 'Instituto Nacional de Estadistica' },
  { code: 'CF', slug: 'central-african-republic', name: 'Central African Republic', dataFile: 'cf-agri-data.js', flag: '&#127464;&#127467;', topCrops: 'cassava, groundnut, maize, sorghum, cotton', regionCount: 3, dataSource: 'Institut Centrafricain des Statistiques' },
  { code: 'TD', slug: 'chad', name: 'Chad', dataFile: 'td-agri-data.js', flag: '&#127481;&#127465;', topCrops: 'sorghum, millet, groundnut, cotton, rice', regionCount: 3, dataSource: 'Institut National de la Statistique' },
  { code: 'ST', slug: 'sao-tome-and-principe', name: 'Sao Tome and Principe', dataFile: 'st-agri-data.js', flag: '&#127480;&#127481;', topCrops: 'cocoa, coconut, coffee, banana, oil palm', regionCount: 2, dataSource: 'Instituto Nacional de Estatistica' },
  { code: 'ZW', slug: 'zimbabwe', name: 'Zimbabwe', dataFile: 'zw-agri-data.js', flag: '&#127487;&#127484;', topCrops: 'maize, tobacco, cotton, soybean, wheat', regionCount: 5, dataSource: 'Zimbabwe National Statistics Agency' },
  { code: 'MW', slug: 'malawi', name: 'Malawi', dataFile: 'mw-agri-data.js', flag: '&#127474;&#127484;', topCrops: 'maize, tobacco, tea, sugar cane, cassava', regionCount: 3, dataSource: 'National Statistical Office of Malawi' },
  { code: 'AO', slug: 'angola', name: 'Angola', dataFile: 'ao-agri-data.js', flag: '&#127462;&#127476;', topCrops: 'cassava, maize, banana, sweet potato, coffee', regionCount: 4, dataSource: 'Instituto Nacional de Estatistica' },
  { code: 'NA', slug: 'namibia', name: 'Namibia', dataFile: 'na-agri-data.js', flag: '&#127475;&#127462;', topCrops: 'millet, sorghum, maize, wheat, groundnut', regionCount: 3, dataSource: 'Namibia Statistics Agency' },
  { code: 'BW', slug: 'botswana', name: 'Botswana', dataFile: 'bw-agri-data.js', flag: '&#127463;&#127484;', topCrops: 'sorghum, maize, millet, cowpea, sunflower', regionCount: 2, dataSource: 'Statistics Botswana' },
  { code: 'LS', slug: 'lesotho', name: 'Lesotho', dataFile: 'ls-agri-data.js', flag: '&#127473;&#127480;', topCrops: 'maize, sorghum, wheat, beans', regionCount: 3, dataSource: 'Bureau of Statistics Lesotho' },
  { code: 'SZ', slug: 'eswatini', name: 'Eswatini', dataFile: 'sz-agri-data.js', flag: '&#127480;&#127487;', topCrops: 'sugar cane, maize, cotton, citrus, pineapple', regionCount: 3, dataSource: 'Central Statistical Office of Eswatini' },
  { code: 'DZ', slug: 'algeria', name: 'Algeria', dataFile: 'dz-agri-data.js', flag: '&#127465;&#127487;', topCrops: 'wheat, barley, potato, citrus, olive, dates', regionCount: 4, dataSource: 'Office National des Statistiques' },
  { code: 'TN', slug: 'tunisia', name: 'Tunisia', dataFile: 'tn-agri-data.js', flag: '&#127481;&#127475;', topCrops: 'olive, wheat, barley, citrus, dates', regionCount: 3, dataSource: 'Institut National de la Statistique' },
  { code: 'LY', slug: 'libya', name: 'Libya', dataFile: 'ly-agri-data.js', flag: '&#127473;&#127486;', topCrops: 'wheat, barley, olive, dates, tomato', regionCount: 3, dataSource: 'Bureau of Statistics and Census' },
  { code: 'SD', slug: 'sudan', name: 'Sudan', dataFile: 'sd-agri-data.js', flag: '&#127480;&#127465;', topCrops: 'sorghum, millet, sesame, groundnut, cotton', regionCount: 4, dataSource: 'Central Bureau of Statistics' },
  { code: 'MU', slug: 'mauritius', name: 'Mauritius', dataFile: 'mu-agri-data.js', flag: '&#127474;&#127482;', topCrops: 'sugar cane, tea, banana, potato, tomato', regionCount: 2, dataSource: 'Statistics Mauritius' },
  { code: 'SC', slug: 'seychelles', name: 'Seychelles', dataFile: 'sc-agri-data.js', flag: '&#127480;&#127464;', topCrops: 'coconut, banana, sweet potato, cassava', regionCount: 2, dataSource: 'National Bureau of Statistics' },
  { code: 'KM', slug: 'comoros', name: 'Comoros', dataFile: 'km-agri-data.js', flag: '&#127472;&#127474;', topCrops: 'vanilla, clove, coconut, banana, cassava', regionCount: 2, dataSource: 'Direction Nationale de la Statistique' },
  { code: 'MR', slug: 'mauritania', name: 'Mauritania', dataFile: 'mr-agri-data.js', flag: '&#127474;&#127479;', topCrops: 'millet, sorghum, rice, cowpea, dates', regionCount: 3, dataSource: 'Office National de la Statistique' },
  { code: 'GM', slug: 'gambia', name: 'Gambia', dataFile: 'gm-agri-data.js', flag: '&#127468;&#127474;', topCrops: 'groundnut, millet, rice, sorghum, maize', regionCount: 3, dataSource: 'Gambia Bureau of Statistics' },
  { code: 'GW', slug: 'guinea-bissau', name: 'Guinea-Bissau', dataFile: 'gw-agri-data.js', flag: '&#127468;&#127484;', topCrops: 'cashew, rice, groundnut, millet, sorghum', regionCount: 3, dataSource: 'Instituto Nacional de Estatistica e Censos' },
  { code: 'CV', slug: 'cabo-verde', name: 'Cabo Verde', dataFile: 'cv-agri-data.js', flag: '&#127464;&#127483;', topCrops: 'maize, beans, banana, sugar cane, tomato', regionCount: 2, dataSource: 'Instituto Nacional de Estatistica' },
];

// Read template
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

countries.forEach(c => {
  let html = template;

  // ── Title & meta ──
  html = html.replace(/Irrigation Water Calculator for Nigeria/g, `Irrigation Water Calculator for ${c.name}`);
  html = html.replace(/Nigeria Irrigation Water Calculator/g, `${c.name} Irrigation Water Calculator`);

  // Meta description
  const metaDesc = `Calculate crop irrigation water needs in ${c.name}. Monthly water budget for ${c.topCrops} with rainfall data for ${c.regionCount} agricultural zones.`;
  html = html.replace(
    /Calculate crop irrigation water needs in Nigeria\. Monthly water budget for cassava, maize, rice, yam with rainfall data for 6 agricultural zones\./g,
    metaDesc
  );

  // ── URLs ──
  html = html.replace(/\/agriculture\/irrigation\/nigeria/g, `/agriculture/irrigation/${c.slug}`);

  // ── Breadcrumb ──
  html = html.replace(/Irrigation Calculators<\/a> &rsaquo;\s*\n\s*Nigeria/g, `Irrigation Calculators</a> &rsaquo;\n      ${c.name}`);

  // ── Hero H1 flag ──
  html = html.replace(/&#127475;&#127468;/g, c.flag);

  // ── Hero description ──
  html = html.replace(
    /Calculate crop irrigation water needs for cassava, maize, rice, yam and more across Nigeria&rsquo;s 6 agricultural zones/g,
    `Calculate crop irrigation water needs for ${c.topCrops} and more across ${c.name}\u2019s ${c.regionCount} agricultural zones`
  );

  // ── Data file reference ──
  html = html.replace(/ng-agri-data\.js/g, c.dataFile);

  // ── Data source in footer ──
  html = html.replace(
    /Nigeria National Bureau of Statistics/g,
    c.dataSource
  );

  // ── Country name in info section ──
  html = html.replace(/&#127470;&#127468; Irrigation in Nigeria/g, `${c.flag} Irrigation in ${c.name}`);

  // ── Country info paragraph (Nigeria-specific references) ──
  html = html.replace(/Nigeria's GDP/g, `${c.name}'s GDP`);
  html = html.replace(/Nigeria\\\'s GDP/g, `${c.name}'s GDP`);

  // Write output
  const outPath = path.join(OUTPUT_DIR, `${c.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Created: ${outPath}`);
});

console.log(`\nDone! Generated ${countries.length} country pages.`);
