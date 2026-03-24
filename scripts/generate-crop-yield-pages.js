#!/usr/bin/env node
/**
 * Generates crop yield estimator HTML pages from the Nigeria template.
 * Usage: node scripts/generate-crop-yield-pages.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, 'agriculture/crop-yield/nigeria.html');
const OUTPUT_DIR = path.join(ROOT, 'agriculture/crop-yield');
const DATA_DIR = path.join(ROOT, 'data/agriculture');

// Country configurations
const countries = [
  // ── Batch 1 (already generated) ──
  { code: 'GH', slug: 'ghana', name: 'Ghana', dataFile: 'gh-agri-data.js', flag: '&#127468;&#127469;', topCrops: 'cocoa, cassava, maize, rice, yam', regionCount: 6, metaDesc: 'Estimate crop yields for cocoa, cassava, maize, rice, yam and more across Ghana\'s 6 agroecological zones. Free agricultural calculator with region-specific data.', dataSource: 'Ghana Statistical Service' },
  { code: 'KE', slug: 'kenya', name: 'Kenya', dataFile: 'ke-agri-data.js', flag: '&#127472;&#127466;', topCrops: 'tea, maize, wheat, coffee, avocado', regionCount: 7, metaDesc: 'Estimate crop yields for tea, maize, wheat, coffee, avocado and more across Kenya\'s 7 agroecological zones. Free agricultural calculator with region-specific data.', dataSource: 'Kenya National Bureau of Statistics' },
  { code: 'ZA', slug: 'south-africa', name: 'South Africa', dataFile: 'za-agri-data.js', flag: '&#127487;&#127462;', topCrops: 'maize, wheat, sugar cane, citrus, soybean', regionCount: 6, metaDesc: 'Estimate crop yields for maize, wheat, sugar cane, citrus, soybean and more across South Africa\'s 6 agricultural regions. Free calculator with region-specific data.', dataSource: 'Department of Agriculture, Land Reform and Rural Development' },
  { code: 'ET', slug: 'ethiopia', name: 'Ethiopia', dataFile: 'et-agri-data.js', flag: '&#127466;&#127481;', topCrops: 'teff, coffee, maize, wheat, sorghum', regionCount: 6, metaDesc: 'Estimate crop yields for teff, coffee, maize, wheat, sorghum and more across Ethiopia\'s 6 agroecological zones. Free agricultural calculator with region-specific data.', dataSource: 'Central Statistical Agency of Ethiopia' },
  { code: 'EG', slug: 'egypt', name: 'Egypt', dataFile: 'eg-agri-data.js', flag: '&#127466;&#127468;', topCrops: 'wheat, maize, rice, sugar cane, cotton', regionCount: 5, metaDesc: 'Estimate crop yields for wheat, maize, rice, sugar cane, cotton and more across Egypt\'s 5 agricultural zones. Free calculator with Nile Valley-specific data.', dataSource: 'Ministry of Agriculture and Land Reclamation' },

  // ── Batch 2 ──
  { code: 'TZ', slug: 'tanzania', name: 'Tanzania', dataFile: 'tz-agri-data.js', flag: '&#127481;&#127487;', topCrops: 'maize, cassava, rice, cashew, tea', regionCount: 6, metaDesc: 'Estimate crop yields for maize, cassava, rice, cashew, tea and more across Tanzania\'s 6 agroecological zones. Free agricultural calculator with region-specific data.', dataSource: 'Tanzania National Bureau of Statistics' },
  { code: 'UG', slug: 'uganda', name: 'Uganda', dataFile: 'ug-agri-data.js', flag: '&#127482;&#127468;', topCrops: 'coffee, banana, maize, cassava, beans', regionCount: 5, metaDesc: 'Estimate crop yields for coffee, banana (matooke), maize, cassava, beans and more across Uganda\'s 5 agroecological zones. Free agricultural calculator.', dataSource: 'Uganda Bureau of Statistics' },
  { code: 'CM', slug: 'cameroon', name: 'Cameroon', dataFile: 'cm-agri-data.js', flag: '&#127464;&#127474;', topCrops: 'cocoa, coffee, cassava, maize, plantain', regionCount: 5, metaDesc: 'Estimate crop yields for cocoa, coffee, cassava, maize, plantain and more across Cameroon\'s 5 agroecological zones. Free agricultural calculator.', dataSource: 'Institut National de la Statistique du Cameroun' },
  { code: 'SN', slug: 'senegal', name: 'Senegal', dataFile: 'sn-agri-data.js', flag: '&#127480;&#127475;', topCrops: 'groundnut, millet, rice, maize, cowpea', regionCount: 5, metaDesc: 'Estimate crop yields for groundnut, millet, rice, maize, cowpea and more across Senegal\'s 5 agroecological zones. Free agricultural calculator.', dataSource: 'Agence Nationale de la Statistique et de la Demographie' },
  { code: 'ML', slug: 'mali', name: 'Mali', dataFile: 'ml-agri-data.js', flag: '&#127474;&#127473;', topCrops: 'cotton, millet, sorghum, rice, fonio', regionCount: 4, metaDesc: 'Estimate crop yields for cotton, millet, sorghum, rice, fonio and more across Mali\'s 4 agroecological zones. Free agricultural calculator.', dataSource: 'Institut National de la Statistique du Mali' },
  { code: 'MZ', slug: 'mozambique', name: 'Mozambique', dataFile: 'mz-agri-data.js', flag: '&#127474;&#127487;', topCrops: 'cassava, maize, rice, cashew, sugar cane', regionCount: 4, metaDesc: 'Estimate crop yields for cassava, maize, rice, cashew, sugar cane and more across Mozambique\'s 4 agricultural regions. Free calculator.', dataSource: 'Instituto Nacional de Estatistica' },
  { code: 'ZM', slug: 'zambia', name: 'Zambia', dataFile: 'zm-agri-data.js', flag: '&#127487;&#127474;', topCrops: 'maize, cassava, soybean, groundnut, tobacco', regionCount: 3, metaDesc: 'Estimate crop yields for maize, cassava, soybean, groundnut, tobacco and more across Zambia\'s 3 agricultural zones. Free calculator.', dataSource: 'Zambia Statistics Agency' },
  { code: 'MA', slug: 'morocco', name: 'Morocco', dataFile: 'ma-agri-data.js', flag: '&#127474;&#127462;', topCrops: 'wheat, citrus, olive, tomato, dates', regionCount: 5, metaDesc: 'Estimate crop yields for wheat, citrus, olive, tomato, dates and more across Morocco\'s 5 agricultural regions. Free calculator.', dataSource: 'Haut-Commissariat au Plan' },
  { code: 'MG', slug: 'madagascar', name: 'Madagascar', dataFile: 'mg-agri-data.js', flag: '&#127474;&#127468;', topCrops: 'rice, cassava, vanilla, clove, coffee', regionCount: 4, metaDesc: 'Estimate crop yields for rice, cassava, vanilla, clove, coffee and more across Madagascar\'s 4 agroecological zones. Free agricultural calculator.', dataSource: 'Institut National de la Statistique' },
  { code: 'CD', slug: 'dr-congo', name: 'DR Congo', dataFile: 'cd-agri-data.js', flag: '&#127464;&#127465;', topCrops: 'cassava, maize, plantain, rice, coffee', regionCount: 5, metaDesc: 'Estimate crop yields for cassava, maize, plantain, rice, coffee and more across DR Congo\'s 5 agroecological zones. Free agricultural calculator.', dataSource: 'Institut National de la Statistique' },

  // ── Batch 3 ──
  { code: 'CI', slug: 'cote-d-ivoire', name: "Cote d'Ivoire", dataFile: 'ci-agri-data.js', flag: '&#127464;&#127470;', topCrops: 'cocoa, coffee, cashew, rubber, cassava', regionCount: 4, metaDesc: "Estimate crop yields for cocoa, coffee, cashew, rubber, cassava and more across Cote d'Ivoire's 4 agroecological zones. Free agricultural calculator.", dataSource: 'Institut National de la Statistique' },
  { code: 'BF', slug: 'burkina-faso', name: 'Burkina Faso', dataFile: 'bf-agri-data.js', flag: '&#127463;&#127467;', topCrops: 'cotton, sorghum, millet, maize, cowpea', regionCount: 3, metaDesc: "Estimate crop yields for cotton, sorghum, millet, maize, cowpea and more across Burkina Faso's 3 agroecological zones. Free agricultural calculator.", dataSource: 'Institut National de la Statistique et de la Demographie' },
  { code: 'NE', slug: 'niger', name: 'Niger', dataFile: 'ne-agri-data.js', flag: '&#127475;&#127466;', topCrops: 'millet, cowpea, sorghum, groundnut, onion', regionCount: 3, metaDesc: "Estimate crop yields for millet, cowpea, sorghum, groundnut, onion and more across Niger's 3 agroecological zones. Free agricultural calculator.", dataSource: 'Institut National de la Statistique' },
  { code: 'GN', slug: 'guinea', name: 'Guinea', dataFile: 'gn-agri-data.js', flag: '&#127468;&#127475;', topCrops: 'rice, cassava, fonio, groundnut, oil palm', regionCount: 4, metaDesc: "Estimate crop yields for rice, cassava, fonio, groundnut, oil palm and more across Guinea's 4 agroecological zones. Free agricultural calculator.", dataSource: 'Institut National de la Statistique' },
  { code: 'BJ', slug: 'benin', name: 'Benin', dataFile: 'bj-agri-data.js', flag: '&#127463;&#127471;', topCrops: 'cotton, maize, cassava, yam, rice', regionCount: 3, metaDesc: "Estimate crop yields for cotton, maize, cassava, yam, rice and more across Benin's 3 agroecological zones. Free agricultural calculator.", dataSource: 'Institut National de la Statistique et de l\'Analyse Economique' },
  { code: 'TG', slug: 'togo', name: 'Togo', dataFile: 'tg-agri-data.js', flag: '&#127481;&#127468;', topCrops: 'maize, cassava, yam, cotton, sorghum', regionCount: 3, metaDesc: "Estimate crop yields for maize, cassava, yam, cotton, sorghum and more across Togo's 3 agroecological zones. Free agricultural calculator.", dataSource: 'Institut National de la Statistique et des Etudes Economiques' },
  { code: 'SL', slug: 'sierra-leone', name: 'Sierra Leone', dataFile: 'sl-agri-data.js', flag: '&#127480;&#127473;', topCrops: 'rice, cassava, sweet potato, groundnut, cocoa', regionCount: 3, metaDesc: "Estimate crop yields for rice, cassava, sweet potato, groundnut, cocoa and more across Sierra Leone's 3 agricultural regions. Free calculator.", dataSource: 'Statistics Sierra Leone' },
  { code: 'LR', slug: 'liberia', name: 'Liberia', dataFile: 'lr-agri-data.js', flag: '&#127473;&#127479;', topCrops: 'rubber, rice, cassava, cocoa, oil palm', regionCount: 3, metaDesc: "Estimate crop yields for rubber, rice, cassava, cocoa, oil palm and more across Liberia's 3 agricultural regions. Free calculator.", dataSource: 'Liberia Institute of Statistics and Geo-Information Services' },
  { code: 'RW', slug: 'rwanda', name: 'Rwanda', dataFile: 'rw-agri-data.js', flag: '&#127479;&#127484;', topCrops: 'beans, banana, sweet potato, coffee, tea', regionCount: 4, metaDesc: "Estimate crop yields for beans, banana, sweet potato, coffee, tea and more across Rwanda's 4 agroecological zones. Free agricultural calculator.", dataSource: 'National Institute of Statistics of Rwanda' },
  { code: 'BI', slug: 'burundi', name: 'Burundi', dataFile: 'bi-agri-data.js', flag: '&#127463;&#127470;', topCrops: 'beans, banana, cassava, coffee, rice', regionCount: 3, metaDesc: "Estimate crop yields for beans, banana, cassava, coffee, rice and more across Burundi's 3 agroecological zones. Free agricultural calculator.", dataSource: 'Institut de Statistiques et d\'Etudes Economiques du Burundi' },

  // ── Batch 4 ──
  { code: 'SO', slug: 'somalia', name: 'Somalia', dataFile: 'so-agri-data.js', flag: '&#127480;&#127476;', topCrops: 'sorghum, maize, sesame, banana, cowpea', regionCount: 3, metaDesc: "Estimate crop yields for sorghum, maize, sesame, banana, cowpea and more across Somalia's 3 agricultural zones. Free calculator.", dataSource: 'Federal Government of Somalia' },
  { code: 'DJ', slug: 'djibouti', name: 'Djibouti', dataFile: 'dj-agri-data.js', flag: '&#127465;&#127471;', topCrops: 'tomato, onion, dates', regionCount: 2, metaDesc: "Estimate crop yields for tomato, onion, dates and more in Djibouti's agricultural zones. Free calculator.", dataSource: 'Direction de la Statistique et des Etudes Demographiques' },
  { code: 'ER', slug: 'eritrea', name: 'Eritrea', dataFile: 'er-agri-data.js', flag: '&#127466;&#127479;', topCrops: 'sorghum, millet, barley, teff, wheat', regionCount: 3, metaDesc: "Estimate crop yields for sorghum, millet, barley, teff, wheat and more across Eritrea's 3 agroecological zones. Free calculator.", dataSource: 'National Statistics Office of Eritrea' },
  { code: 'SS', slug: 'south-sudan', name: 'South Sudan', dataFile: 'ss-agri-data.js', flag: '&#127480;&#127480;', topCrops: 'sorghum, maize, groundnut, sesame, cassava', regionCount: 3, metaDesc: "Estimate crop yields for sorghum, maize, groundnut, sesame, cassava and more across South Sudan's 3 agricultural zones. Free calculator.", dataSource: 'National Bureau of Statistics' },
  { code: 'CG', slug: 'congo-brazzaville', name: 'Congo (Brazzaville)', dataFile: 'cg-agri-data.js', flag: '&#127464;&#127468;', topCrops: 'cassava, sugar cane, oil palm, plantain, maize', regionCount: 3, metaDesc: "Estimate crop yields for cassava, sugar cane, oil palm, plantain and more across Congo's 3 agricultural regions. Free calculator.", dataSource: 'Institut National de la Statistique' },
  { code: 'GA', slug: 'gabon', name: 'Gabon', dataFile: 'ga-agri-data.js', flag: '&#127468;&#127462;', topCrops: 'cassava, plantain, oil palm, cocoa, maize', regionCount: 2, metaDesc: "Estimate crop yields for cassava, plantain, oil palm, cocoa and more across Gabon's agricultural zones. Free calculator.", dataSource: 'Direction Generale de la Statistique' },
  { code: 'GQ', slug: 'equatorial-guinea', name: 'Equatorial Guinea', dataFile: 'gq-agri-data.js', flag: '&#127468;&#127478;', topCrops: 'cocoa, coffee, cassava, sweet potato, oil palm', regionCount: 2, metaDesc: "Estimate crop yields for cocoa, coffee, cassava, sweet potato and more in Equatorial Guinea. Free calculator.", dataSource: 'Instituto Nacional de Estadistica' },
  { code: 'CF', slug: 'central-african-republic', name: 'Central African Republic', dataFile: 'cf-agri-data.js', flag: '&#127464;&#127467;', topCrops: 'cassava, groundnut, maize, sorghum, cotton', regionCount: 3, metaDesc: "Estimate crop yields for cassava, groundnut, maize, sorghum, cotton and more across CAR's 3 agricultural zones. Free calculator.", dataSource: 'Institut Centrafricain des Statistiques' },
  { code: 'TD', slug: 'chad', name: 'Chad', dataFile: 'td-agri-data.js', flag: '&#127481;&#127465;', topCrops: 'sorghum, millet, groundnut, cotton, rice', regionCount: 3, metaDesc: "Estimate crop yields for sorghum, millet, groundnut, cotton, rice and more across Chad's 3 agroecological zones. Free calculator.", dataSource: 'Institut National de la Statistique' },
  { code: 'ST', slug: 'sao-tome-and-principe', name: 'Sao Tome and Principe', dataFile: 'st-agri-data.js', flag: '&#127480;&#127481;', topCrops: 'cocoa, coconut, coffee, banana, oil palm', regionCount: 2, metaDesc: "Estimate crop yields for cocoa, coconut, coffee, banana, oil palm and more in Sao Tome and Principe. Free calculator.", dataSource: 'Instituto Nacional de Estatistica' },

  // ── Batch 5 ──
  { code: 'ZW', slug: 'zimbabwe', name: 'Zimbabwe', dataFile: 'zw-agri-data.js', flag: '&#127487;&#127484;', topCrops: 'maize, tobacco, cotton, soybean, wheat', regionCount: 5, metaDesc: "Estimate crop yields for maize, tobacco, cotton, soybean, wheat and more across Zimbabwe's 5 natural regions. Free calculator.", dataSource: 'Zimbabwe National Statistics Agency' },
  { code: 'MW', slug: 'malawi', name: 'Malawi', dataFile: 'mw-agri-data.js', flag: '&#127474;&#127484;', topCrops: 'maize, tobacco, tea, sugar cane, cassava', regionCount: 3, metaDesc: "Estimate crop yields for maize, tobacco, tea, sugar cane, cassava and more across Malawi's 3 agricultural regions. Free calculator.", dataSource: 'National Statistical Office of Malawi' },
  { code: 'AO', slug: 'angola', name: 'Angola', dataFile: 'ao-agri-data.js', flag: '&#127462;&#127476;', topCrops: 'cassava, maize, banana, sweet potato, coffee', regionCount: 4, metaDesc: "Estimate crop yields for cassava, maize, banana, sweet potato, coffee and more across Angola's 4 agroecological zones. Free calculator.", dataSource: 'Instituto Nacional de Estatistica' },
  { code: 'NA', slug: 'namibia', name: 'Namibia', dataFile: 'na-agri-data.js', flag: '&#127475;&#127462;', topCrops: 'millet, sorghum, maize, wheat, groundnut', regionCount: 3, metaDesc: "Estimate crop yields for millet, sorghum, maize, wheat, groundnut and more across Namibia's 3 agricultural zones. Free calculator.", dataSource: 'Namibia Statistics Agency' },
  { code: 'BW', slug: 'botswana', name: 'Botswana', dataFile: 'bw-agri-data.js', flag: '&#127463;&#127484;', topCrops: 'sorghum, maize, millet, cowpea, sunflower', regionCount: 2, metaDesc: "Estimate crop yields for sorghum, maize, millet, cowpea, sunflower and more across Botswana's agricultural zones. Free calculator.", dataSource: 'Statistics Botswana' },
  { code: 'LS', slug: 'lesotho', name: 'Lesotho', dataFile: 'ls-agri-data.js', flag: '&#127473;&#127480;', topCrops: 'maize, sorghum, wheat, beans', regionCount: 3, metaDesc: "Estimate crop yields for maize, sorghum, wheat, beans and more across Lesotho's 3 agroecological zones. Free calculator.", dataSource: 'Bureau of Statistics Lesotho' },
  { code: 'SZ', slug: 'eswatini', name: 'Eswatini', dataFile: 'sz-agri-data.js', flag: '&#127480;&#127487;', topCrops: 'sugar cane, maize, cotton, citrus, pineapple', regionCount: 3, metaDesc: "Estimate crop yields for sugar cane, maize, cotton, citrus, pineapple and more across Eswatini's 3 ecological zones. Free calculator.", dataSource: 'Central Statistical Office of Eswatini' },
  { code: 'DZ', slug: 'algeria', name: 'Algeria', dataFile: 'dz-agri-data.js', flag: '&#127465;&#127487;', topCrops: 'wheat, barley, potato, citrus, olive, dates', regionCount: 4, metaDesc: "Estimate crop yields for wheat, barley, potato, citrus, olive, dates and more across Algeria's 4 agricultural regions. Free calculator.", dataSource: 'Office National des Statistiques' },
  { code: 'TN', slug: 'tunisia', name: 'Tunisia', dataFile: 'tn-agri-data.js', flag: '&#127481;&#127475;', topCrops: 'olive, wheat, barley, citrus, dates', regionCount: 3, metaDesc: "Estimate crop yields for olive, wheat, barley, citrus, dates and more across Tunisia's 3 agricultural regions. Free calculator.", dataSource: 'Institut National de la Statistique' },
  { code: 'LY', slug: 'libya', name: 'Libya', dataFile: 'ly-agri-data.js', flag: '&#127473;&#127486;', topCrops: 'wheat, barley, olive, dates, tomato', regionCount: 3, metaDesc: "Estimate crop yields for wheat, barley, olive, dates, tomato and more across Libya's 3 agricultural zones. Free calculator.", dataSource: 'Bureau of Statistics and Census' },

  // ── Batch 6 ──
  { code: 'SD', slug: 'sudan', name: 'Sudan', dataFile: 'sd-agri-data.js', flag: '&#127480;&#127465;', topCrops: 'sorghum, millet, sesame, groundnut, cotton', regionCount: 4, metaDesc: "Estimate crop yields for sorghum, millet, sesame, groundnut, cotton and more across Sudan's 4 agricultural regions. Free calculator.", dataSource: 'Central Bureau of Statistics' },
  { code: 'MU', slug: 'mauritius', name: 'Mauritius', dataFile: 'mu-agri-data.js', flag: '&#127474;&#127482;', topCrops: 'sugar cane, tea, banana, potato, tomato', regionCount: 2, metaDesc: "Estimate crop yields for sugar cane, tea, banana, potato, tomato and more across Mauritius. Free calculator.", dataSource: 'Statistics Mauritius' },
  { code: 'SC', slug: 'seychelles', name: 'Seychelles', dataFile: 'sc-agri-data.js', flag: '&#127480;&#127464;', topCrops: 'coconut, banana, sweet potato, cassava', regionCount: 2, metaDesc: "Estimate crop yields for coconut, banana, sweet potato, cassava and more in Seychelles. Free calculator.", dataSource: 'National Bureau of Statistics' },
  { code: 'KM', slug: 'comoros', name: 'Comoros', dataFile: 'km-agri-data.js', flag: '&#127472;&#127474;', topCrops: 'vanilla, clove, coconut, banana, cassava', regionCount: 2, metaDesc: "Estimate crop yields for vanilla, clove, coconut, banana, cassava and more in Comoros. Free calculator.", dataSource: 'Direction Nationale de la Statistique' },
  { code: 'MR', slug: 'mauritania', name: 'Mauritania', dataFile: 'mr-agri-data.js', flag: '&#127474;&#127479;', topCrops: 'millet, sorghum, rice, cowpea, dates', regionCount: 3, metaDesc: "Estimate crop yields for millet, sorghum, rice, cowpea, dates and more across Mauritania's 3 agricultural zones. Free calculator.", dataSource: 'Office National de la Statistique' },
  { code: 'GM', slug: 'gambia', name: 'Gambia', dataFile: 'gm-agri-data.js', flag: '&#127468;&#127474;', topCrops: 'groundnut, millet, rice, sorghum, maize', regionCount: 3, metaDesc: "Estimate crop yields for groundnut, millet, rice, sorghum, maize and more across Gambia's 3 agricultural regions. Free calculator.", dataSource: 'Gambia Bureau of Statistics' },
  { code: 'GW', slug: 'guinea-bissau', name: 'Guinea-Bissau', dataFile: 'gw-agri-data.js', flag: '&#127468;&#127484;', topCrops: 'cashew, rice, groundnut, millet, sorghum', regionCount: 3, metaDesc: "Estimate crop yields for cashew, rice, groundnut, millet, sorghum and more across Guinea-Bissau's agricultural zones. Free calculator.", dataSource: 'Instituto Nacional de Estatistica e Censos' },
  { code: 'CV', slug: 'cabo-verde', name: 'Cabo Verde', dataFile: 'cv-agri-data.js', flag: '&#127464;&#127483;', topCrops: 'maize, beans, banana, sugar cane, tomato', regionCount: 2, metaDesc: "Estimate crop yields for maize, beans, banana, sugar cane, tomato and more in Cabo Verde. Free calculator.", dataSource: 'Instituto Nacional de Estatistica' },
];

// Read template
const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

countries.forEach(c => {
  let html = template;

  // Title & meta
  html = html.replace(/Crop Yield Estimator for Nigeria/g, `Crop Yield Estimator for ${c.name}`);
  html = html.replace(/Nigeria Crop Yield Estimator/g, `${c.name} Crop Yield Estimator`);
  html = html.replace(
    /Estimate crop yields for cassava, maize, rice, yam and more across Nigeria's 6 agroecological zones\. Free agricultural calculator with region-specific data\./g,
    c.metaDesc
  );
  html = html.replace(
    /Estimate crop yields for cassava, maize, rice, yam and more across Nigeria's 6 agroecological zones\./g,
    c.metaDesc.split('. Free')[0] + '.'
  );

  // URLs
  html = html.replace(/\/agriculture\/crop-yield\/nigeria/g, `/agriculture/crop-yield/${c.slug}`);

  // Breadcrumb
  html = html.replace(/>[\s]*Nigeria[\s]*<\/nav>/g, `>${c.name}</nav>`);

  // Hero H1 flag
  html = html.replace(/&#127475;&#127468;/g, c.flag);

  // Hero description
  html = html.replace(
    /Estimate crop yields for cassava, maize, rice, yam and more across Nigeria&rsquo;s 6 agroecological zones/g,
    `Estimate crop yields for ${c.topCrops} and more across ${c.name}`
  );
  html = html.replace(
    /cassava, maize, rice, yam and more across Nigeria's 6 agroecological zones. Uses FAOSTAT &amp; national data\./g,
    `${c.topCrops} and more across ${c.name}'s ${c.regionCount} agricultural regions. Uses FAOSTAT &amp; national data.`
  );

  // Data file reference
  html = html.replace(/ng-agri-data\.js/g, c.dataFile);

  // Data sources footer
  html = html.replace(
    /Nigeria National Bureau of Statistics/g,
    c.dataSource
  );

  // Country name in info section
  html = html.replace(/&#127470;&#127468; Agriculture in Nigeria/g, `${c.flag} Agriculture in ${c.name}`);

  // Write output
  const outPath = path.join(OUTPUT_DIR, `${c.slug}.html`);
  fs.writeFileSync(outPath, html, 'utf8');
  console.log(`Created: ${outPath}`);
});

console.log(`\nDone! Generated ${countries.length} country pages.`);
