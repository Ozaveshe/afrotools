// scripts/generate-export-docs-pages.js
// Generates all 54 country HTML pages for /agriculture/export-docs/
// Run: node scripts/generate-export-docs-pages.js
// ─────────────────────────────────────────────────────────────
'use strict';
var fs = require('fs');
var path = require('path');

var outDir = path.join(__dirname, '..', 'agriculture', 'export-docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Must match country-index.js exactly
var COUNTRIES = [
  // West Africa
  { code: 'NG', name: 'Nigeria',          slug: 'nigeria',                  flag: '🇳🇬', region: 'West Africa', topExports: 'cocoa, sesame, cashew, groundnut', tradeBloc: 'ECOWAS' },
  { code: 'GH', name: 'Ghana',            slug: 'ghana',                    flag: '🇬🇭', region: 'West Africa', topExports: 'cocoa, cashew, pineapple, yam', tradeBloc: 'ECOWAS' },
  { code: 'CI', name: "Cote d'Ivoire",    slug: 'cote-d-ivoire',            flag: '🇨🇮', region: 'West Africa', topExports: 'cocoa, cashew, rubber, coffee', tradeBloc: 'ECOWAS' },
  { code: 'SN', name: 'Senegal',          slug: 'senegal',                  flag: '🇸🇳', region: 'West Africa', topExports: 'groundnut, mango, tomato, sesame', tradeBloc: 'ECOWAS' },
  { code: 'ML', name: 'Mali',             slug: 'mali',                     flag: '🇲🇱', region: 'West Africa', topExports: 'cotton, sesame, mango, fonio', tradeBloc: 'ECOWAS' },
  { code: 'BF', name: 'Burkina Faso',     slug: 'burkina-faso',             flag: '🇧🇫', region: 'West Africa', topExports: 'cotton, sesame, cashew, groundnut', tradeBloc: 'ECOWAS' },
  { code: 'NE', name: 'Niger',            slug: 'niger',                    flag: '🇳🇪', region: 'West Africa', topExports: 'cowpea, sesame, onion, groundnut', tradeBloc: 'ECOWAS' },
  { code: 'GN', name: 'Guinea',           slug: 'guinea',                   flag: '🇬🇳', region: 'West Africa', topExports: 'coffee, cashew, mango, groundnut', tradeBloc: 'ECOWAS' },
  { code: 'BJ', name: 'Benin',            slug: 'benin',                    flag: '🇧🇯', region: 'West Africa', topExports: 'cotton, cashew, pineapple, maize', tradeBloc: 'ECOWAS' },
  { code: 'TG', name: 'Togo',             slug: 'togo',                     flag: '🇹🇬', region: 'West Africa', topExports: 'cotton, coffee, cocoa, sesame', tradeBloc: 'ECOWAS' },
  { code: 'SL', name: 'Sierra Leone',     slug: 'sierra-leone',             flag: '🇸🇱', region: 'West Africa', topExports: 'cocoa, coffee, palm oil, groundnut', tradeBloc: 'ECOWAS' },
  { code: 'LR', name: 'Liberia',          slug: 'liberia',                  flag: '🇱🇷', region: 'West Africa', topExports: 'rubber, cocoa, coffee, palm oil', tradeBloc: 'ECOWAS' },
  { code: 'MR', name: 'Mauritania',       slug: 'mauritania',               flag: '🇲🇷', region: 'West Africa', topExports: 'dates, millet, cowpea, sorghum', tradeBloc: 'ECOWAS' },
  { code: 'GM', name: 'Gambia',           slug: 'gambia',                   flag: '🇬🇲', region: 'West Africa', topExports: 'groundnut, sesame, cashew, millet', tradeBloc: 'ECOWAS' },
  { code: 'GW', name: 'Guinea-Bissau',    slug: 'guinea-bissau',            flag: '🇬🇼', region: 'West Africa', topExports: 'cashew, groundnut, rice, palm oil', tradeBloc: 'ECOWAS' },
  { code: 'CV', name: 'Cabo Verde',       slug: 'cabo-verde',               flag: '🇨🇻', region: 'West Africa', topExports: 'banana, coffee, maize, tomato', tradeBloc: 'ECOWAS' },
  // East Africa
  { code: 'KE', name: 'Kenya',            slug: 'kenya',                    flag: '🇰🇪', region: 'East Africa', topExports: 'tea, coffee, avocado, flowers, macadamia', tradeBloc: 'EAC' },
  { code: 'ET', name: 'Ethiopia',         slug: 'ethiopia',                 flag: '🇪🇹', region: 'East Africa', topExports: 'coffee, sesame, teff, chickpea, lentils', tradeBloc: 'IGAD' },
  { code: 'TZ', name: 'Tanzania',         slug: 'tanzania',                 flag: '🇹🇿', region: 'East Africa', topExports: 'coffee, cashew, tea, cotton, clove', tradeBloc: 'EAC' },
  { code: 'UG', name: 'Uganda',           slug: 'uganda',                   flag: '🇺🇬', region: 'East Africa', topExports: 'coffee, tea, cotton, maize, sesame', tradeBloc: 'EAC' },
  { code: 'RW', name: 'Rwanda',           slug: 'rwanda',                   flag: '🇷🇼', region: 'East Africa', topExports: 'coffee, tea, dried beans, sorghum', tradeBloc: 'EAC' },
  { code: 'BI', name: 'Burundi',          slug: 'burundi',                  flag: '🇧🇮', region: 'East Africa', topExports: 'coffee, tea, dried beans, rice', tradeBloc: 'EAC' },
  { code: 'SO', name: 'Somalia',          slug: 'somalia',                  flag: '🇸🇴', region: 'East Africa', topExports: 'sesame, maize, banana, sorghum', tradeBloc: 'IGAD' },
  { code: 'DJ', name: 'Djibouti',         slug: 'djibouti',                 flag: '🇩🇯', region: 'East Africa', topExports: 'tomato, onion, dates', tradeBloc: 'IGAD' },
  { code: 'ER', name: 'Eritrea',          slug: 'eritrea',                  flag: '🇪🇷', region: 'East Africa', topExports: 'sorghum, millet, sesame, teff', tradeBloc: 'IGAD' },
  { code: 'SS', name: 'South Sudan',      slug: 'south-sudan',              flag: '🇸🇸', region: 'East Africa', topExports: 'sesame, sorghum, groundnut, millet', tradeBloc: 'EAC' },
  // Central Africa
  { code: 'CD', name: 'DR Congo',         slug: 'dr-congo',                 flag: '🇨🇩', region: 'Central Africa', topExports: 'coffee, cassava, palm oil, groundnut', tradeBloc: 'SADC' },
  { code: 'CM', name: 'Cameroon',         slug: 'cameroon',                 flag: '🇨🇲', region: 'Central Africa', topExports: 'cocoa, coffee, banana, cotton, rubber', tradeBloc: 'CEMAC' },
  { code: 'CG', name: 'Congo (Brazzaville)', slug: 'congo-brazzaville',     flag: '🇨🇬', region: 'Central Africa', topExports: 'cocoa, rubber, palm oil, cassava', tradeBloc: 'CEMAC' },
  { code: 'GA', name: 'Gabon',            slug: 'gabon',                    flag: '🇬🇦', region: 'Central Africa', topExports: 'rubber, cocoa, coffee, palm oil', tradeBloc: 'CEMAC' },
  { code: 'GQ', name: 'Equatorial Guinea',slug: 'equatorial-guinea',        flag: '🇬🇶', region: 'Central Africa', topExports: 'cocoa, coffee, palm oil, cassava', tradeBloc: 'CEMAC' },
  { code: 'CF', name: 'Central African Republic', slug: 'central-african-republic', flag: '🇨🇫', region: 'Central Africa', topExports: 'cotton, coffee, sesame, groundnut', tradeBloc: 'CEMAC' },
  { code: 'TD', name: 'Chad',             slug: 'chad',                     flag: '🇹🇩', region: 'Central Africa', topExports: 'cotton, sesame, gum arabic, groundnut', tradeBloc: 'CEMAC' },
  { code: 'ST', name: 'Sao Tome and Principe', slug: 'sao-tome-and-principe', flag: '🇸🇹', region: 'Central Africa', topExports: 'cocoa, coconut, coffee, vanilla', tradeBloc: 'CEMAC' },
  // Southern Africa
  { code: 'ZA', name: 'South Africa',     slug: 'south-africa',             flag: '🇿🇦', region: 'Southern Africa', topExports: 'citrus, avocado, wine, maize, sugar', tradeBloc: 'SADC' },
  { code: 'MZ', name: 'Mozambique',       slug: 'mozambique',               flag: '🇲🇿', region: 'Southern Africa', topExports: 'cashew, tobacco, cotton, sesame', tradeBloc: 'SADC' },
  { code: 'ZM', name: 'Zambia',           slug: 'zambia',                   flag: '🇿🇲', region: 'Southern Africa', topExports: 'maize, soybean, tobacco, groundnut', tradeBloc: 'SADC' },
  { code: 'ZW', name: 'Zimbabwe',         slug: 'zimbabwe',                 flag: '🇿🇼', region: 'Southern Africa', topExports: 'tobacco, maize, cotton, soybean', tradeBloc: 'SADC' },
  { code: 'MW', name: 'Malawi',           slug: 'malawi',                   flag: '🇲🇼', region: 'Southern Africa', topExports: 'tobacco, tea, sugar, groundnut', tradeBloc: 'SADC' },
  { code: 'AO', name: 'Angola',           slug: 'angola',                   flag: '🇦🇴', region: 'Southern Africa', topExports: 'coffee, banana, cassava, palm oil', tradeBloc: 'SADC' },
  { code: 'NA', name: 'Namibia',          slug: 'namibia',                  flag: '🇳🇦', region: 'Southern Africa', topExports: 'grapes, dates, millet, groundnut', tradeBloc: 'SADC' },
  { code: 'BW', name: 'Botswana',         slug: 'botswana',                 flag: '🇧🇼', region: 'Southern Africa', topExports: 'sorghum, cowpea, groundnut, sunflower', tradeBloc: 'SADC' },
  { code: 'LS', name: 'Lesotho',          slug: 'lesotho',                  flag: '🇱🇸', region: 'Southern Africa', topExports: 'maize, sorghum, wheat, dried beans', tradeBloc: 'SADC' },
  { code: 'SZ', name: 'Eswatini',         slug: 'eswatini',                 flag: '🇸🇿', region: 'Southern Africa', topExports: 'sugar, citrus, cotton, pineapple', tradeBloc: 'SADC' },
  // North Africa
  { code: 'EG', name: 'Egypt',            slug: 'egypt',                    flag: '🇪🇬', region: 'North Africa', topExports: 'citrus, cotton, potatoes, tomatoes', tradeBloc: 'COMESA' },
  { code: 'MA', name: 'Morocco',          slug: 'morocco',                  flag: '🇲🇦', region: 'North Africa', topExports: 'citrus, tomatoes, olive oil, dates', tradeBloc: 'AFCFTA' },
  { code: 'DZ', name: 'Algeria',          slug: 'algeria',                  flag: '🇩🇿', region: 'North Africa', topExports: 'dates, olive oil, citrus, potatoes', tradeBloc: 'UMA' },
  { code: 'TN', name: 'Tunisia',          slug: 'tunisia',                  flag: '🇹🇳', region: 'North Africa', topExports: 'olive oil, dates, citrus, potatoes', tradeBloc: 'UMA' },
  { code: 'LY', name: 'Libya',            slug: 'libya',                    flag: '🇱🇾', region: 'North Africa', topExports: 'dates, wheat, barley, olive', tradeBloc: 'UMA' },
  { code: 'SD', name: 'Sudan',            slug: 'sudan',                    flag: '🇸🇩', region: 'North Africa', topExports: 'sesame, gum arabic, cotton, groundnut', tradeBloc: 'COMESA' },
  // Island Nations
  { code: 'MG', name: 'Madagascar',       slug: 'madagascar',               flag: '🇲🇬', region: 'Island Nations', topExports: 'vanilla, cloves, cocoa, coffee, rice', tradeBloc: 'SADC' },
  { code: 'MU', name: 'Mauritius',        slug: 'mauritius',                flag: '🇲🇺', region: 'Island Nations', topExports: 'sugar, tea, banana, pineapple', tradeBloc: 'SADC' },
  { code: 'SC', name: 'Seychelles',       slug: 'seychelles',               flag: '🇸🇨', region: 'Island Nations', topExports: 'coconut, cinnamon, vanilla, banana', tradeBloc: 'COMESA' },
  { code: 'KM', name: 'Comoros',          slug: 'comoros',                  flag: '🇰🇲', region: 'Island Nations', topExports: 'vanilla, cloves, ylang-ylang, coconut', tradeBloc: 'COMESA' },
];

function pageHtml(c) {
  var title  = 'Agricultural Export Documentation Checklist for ' + c.name + ' | AfroTools';
  var desc   = 'Complete checklist of all documents required to export agricultural products from ' + c.name + '. Includes phytosanitary certificates, export licences, AfCFTA certificates of origin, customs forms, and commodity-specific requirements.';
  var url    = 'https://afrotools.com/agriculture/export-docs/' + c.slug;
  var h1     = c.flag + ' ' + c.name + ' Agricultural Export Documentation Checklist';
  var heroSub = 'Select your product and destination to generate a complete, printable checklist of every document you need to export from ' + c.name + '. Covers ' + c.topExports + ' and more.';

  return '<!DOCTYPE html>\n' +
'<html data-chat-bundle="/assets/js/bundles/chat.bd27dfaf.min.js" lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<title>' + title + '</title>\n' +
'<meta name="description" content="' + desc + '">\n' +
'<link rel="canonical" href="' + url + '">\n' +
'\n' +
'<meta property="og:title" content="' + c.name + ' Agricultural Export Documentation Checklist &mdash; AfroTools">\n' +
'<meta property="og:description" content="' + desc + '">\n' +
'<meta property="og:url" content="' + url + '">\n' +
'<meta property="og:type" content="website">\n' +
'<meta property="og:image" content="https://afrotools.com/assets/img/og-default.png">\n' +
'<meta name="twitter:card" content="summary_large_image">\n' +
'<meta property="og:locale" content="en_US">\n' +
'<meta property="og:site_name" content="AfroTools">\n' +
'<meta name="twitter:title" content="' + c.name + ' Agricultural Export Documentation Checklist &mdash; AfroTools">\n' +
'<meta name="twitter:description" content="' + desc + '">\n' +
'<meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">\n' +
'\n' +
'<script type="application/ld+json">\n' +
'{\n' +
'  "@context": "https://schema.org",\n' +
'  "@type": "WebApplication",\n' +
'  "name": "' + c.name + ' Agricultural Export Documentation Checklist",\n' +
'  "url": "' + url + '",\n' +
'  "applicationCategory": "UtilityApplication",\n' +
'  "operatingSystem": "All",\n' +
'  "description": "' + desc + '",\n' +
'  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },\n' +
'  "author": { "@type": "Organization", "name": "AfroTools", "url": "https://afrotools.com" }\n' +
'}\n' +
'<\/script>\n' +
'<script type="application/ld+json">\n' +
'{\n' +
'  "@context": "https://schema.org",\n' +
'  "@type": "BreadcrumbList",\n' +
'  "itemListElement": [\n' +
'    { "@type": "ListItem", "position": 1, "name": "AfroTools", "item": "https://afrotools.com/" },\n' +
'    { "@type": "ListItem", "position": 2, "name": "Agriculture", "item": "https://afrotools.com/agriculture/" },\n' +
'    { "@type": "ListItem", "position": 3, "name": "Export Docs Checklist", "item": "https://afrotools.com/agriculture/export-docs/" },\n' +
'    { "@type": "ListItem", "position": 4, "name": "' + c.name + '", "item": "' + url + '" }\n' +
'  ]\n' +
'}\n' +
'<\/script>\n' +
'\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap">\n' +
'<link rel="stylesheet" href="/assets/css/tokens.min.css">\n' +
'<link rel="stylesheet" href="/assets/css/global.min.css">\n' +
'\n' +
'<script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer><\/script>\n' +
'<script src="/assets/js/components/footer.min.js" defer><\/script>\n' +
'\n' +
'<style>\n' +
':root {\n' +
'  --ed-blue: #0062CC;\n' +
'  --ed-blue-dark: #0063D1;\n' +
'  --ed-blue-light: #E8F2FF;\n' +
'  --ed-bg: #F8F9FA;\n' +
'  --ed-card: #FFFFFF;\n' +
'  --ed-text: #1A1A2E;\n' +
'  --ed-muted: #6B7280;\n' +
'  --ed-radius: 18px;\n' +
'  --ed-btn-radius: 980px;\n' +
'}\n' +
'*, *::before, *::after { box-sizing: border-box; }\n' +
'body { font-family: \'DM Sans\', sans-serif; background: var(--ed-bg); color: var(--ed-text); margin: 0; }\n' +
'\n' +
'/* Hero */\n' +
'.ed-hero {\n' +
'  background: linear-gradient(135deg, #001836 0%, var(--ed-blue-dark) 50%, var(--ed-blue) 100%);\n' +
'  color: #fff;\n' +
'  padding: 2.5rem 1rem 2rem;\n' +
'}\n' +
'.ed-hero-inner { max-width: 960px; margin: 0 auto; }\n' +
'.ed-breadcrumb { font-size: 0.85rem; opacity: 0.7; margin-bottom: 0.75rem; }\n' +
'.ed-breadcrumb a { color: #fff; text-decoration: none; }\n' +
'.ed-breadcrumb a:hover { text-decoration: underline; }\n' +
'.ed-hero h1 { color: #fff; font-size: clamp(1.3rem, 5vw, 2rem); font-weight: 800; margin: 0 0 0.5rem; letter-spacing: -0.02em; line-height: 1.2; }\n' +
'.ed-hero-sub { font-size: 0.98rem; opacity: 0.85; max-width: 620px; line-height: 1.55; }\n' +
'.ed-stats-bar { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1rem; font-size: 0.82rem; }\n' +
'.ed-stat-pill { background: rgba(255,255,255,0.15); padding: 0.3rem 0.7rem; border-radius: var(--ed-btn-radius); white-space: nowrap; font-weight: 500; }\n' +
'\n' +
'/* Main layout */\n' +
'.ed-main { max-width: 860px; margin: -1.5rem auto 3rem; padding: 0 1rem; }\n' +
'\n' +
'/* Card */\n' +
'.ed-card {\n' +
'  background: var(--ed-card);\n' +
'  border-radius: var(--ed-radius);\n' +
'  box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);\n' +
'  padding: 1.5rem;\n' +
'  margin-bottom: 1.5rem;\n' +
'}\n' +
'.ed-card-title { font-size: 1.1rem; font-weight: 700; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.4rem; }\n' +
'\n' +
'/* Form */\n' +
'.ed-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }\n' +
'@media (max-width: 820px) { .ed-form-grid { grid-template-columns: 1fr; } }\n' +
'.ed-field { display: flex; flex-direction: column; gap: 0.3rem; }\n' +
'.ed-label { font-size: 0.82rem; font-weight: 600; color: var(--ed-muted); text-transform: uppercase; letter-spacing: 0.04em; }\n' +
'.ed-select { font-family: inherit; font-size: 0.95rem; padding: 0.65rem 0.85rem; border: 1.5px solid #E5E7EB; border-radius: 10px; background: #fff; color: var(--ed-text); outline: none; transition: border-color 0.2s; width: 100%; }\n' +
'.ed-select:focus { border-color: var(--ed-blue); }\n' +
'\n' +
'/* Button */\n' +
'.ed-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; font-family: inherit; font-size: 1rem; font-weight: 700; padding: 0.85rem 2rem; border: none; border-radius: var(--ed-btn-radius); cursor: pointer; transition: background 0.2s, transform 0.1s; text-transform: uppercase; letter-spacing: 0.03em; }\n' +
'.ed-btn-primary { background: var(--ed-blue); color: #fff; width: 100%; margin-top: 0.75rem; }\n' +
'.ed-btn-primary:hover { background: var(--ed-blue-dark); }\n' +
'.ed-btn-primary:active { transform: scale(0.98); }\n' +
'.ed-btn-secondary { background: var(--ed-blue-light); color: var(--ed-blue); padding: 0.65rem 1.5rem; font-size: 0.9rem; font-weight: 700; border: none; border-radius: var(--ed-btn-radius); cursor: pointer; }\n' +
'.ed-btn-secondary:hover { background: #d4e9ff; }\n' +
'\n' +
'/* Results */\n' +
'.ed-results { display: none; }\n' +
'.ed-visible { display: block; animation: edFadeUp 0.4s ease; }\n' +
'@keyframes edFadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }\n' +
'\n' +
'/* Summary bar */\n' +
'.ed-summary-bar { display: flex; flex-wrap: wrap; gap: 0.75rem; padding: 1rem; background: var(--ed-blue-light); border-radius: 12px; margin-bottom: 1.25rem; font-size: 0.88rem; }\n' +
'.ed-summary-item { display: flex; align-items: center; gap: 0.4rem; font-weight: 600; }\n' +
'.ed-s-icon { font-size: 1.1rem; }\n' +
'\n' +
'.ed-section-title { font-size: 1.05rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.02em; margin: 0 0 0.4rem; }\n' +
'.ed-subtitle { font-size: 0.85rem; color: var(--ed-muted); margin: 0 0 1rem; }\n' +
'\n' +
'/* Checklist */\n' +
'.ed-checklist { margin-bottom: 1.5rem; }\n' +
'.ed-cat-section { margin-bottom: 1.5rem; }\n' +
'.ed-cat-label { font-size: 0.78rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ed-muted); padding: 0.4rem 0; border-bottom: 2px solid var(--ed-blue-light); margin-bottom: 0.5rem; }\n' +
'\n' +
'.ed-item { background: var(--ed-card); border: 1.5px solid #E5E7EB; border-radius: 12px; margin-bottom: 0.5rem; overflow: hidden; transition: border-color 0.2s; }\n' +
'.ed-item--highlight { border-color: var(--ed-blue); background: #FAFCFF; }\n' +
'.ed-item--done .ed-item-name { text-decoration: line-through; opacity: 0.5; }\n' +
'.ed-item--done { opacity: 0.7; }\n' +
'\n' +
'.ed-item-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1rem; }\n' +
'.ed-check-label { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; flex: 1; min-width: 0; }\n' +
'.ed-checkbox { position: absolute; opacity: 0; width: 0; height: 0; }\n' +
'.ed-check-box { width: 22px; height: 22px; border: 2px solid #D1D5DB; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.15s; background: #fff; }\n' +
'.ed-checkbox:checked + .ed-check-box { background: var(--ed-blue); border-color: var(--ed-blue); }\n' +
'.ed-checkbox:checked + .ed-check-box::after { content: "\\2713"; color: #fff; font-size: 14px; font-weight: 800; }\n' +
'.ed-item-name { font-size: 0.92rem; font-weight: 600; line-height: 1.4; }\n' +
'.ed-badge-afcfta { font-size: 0.72rem; background: #FFF3CD; color: #856404; padding: 0.15rem 0.5rem; border-radius: 980px; font-weight: 700; margin-left: 0.3rem; white-space: nowrap; }\n' +
'\n' +
'.ed-expand-btn { background: none; border: none; cursor: pointer; font-size: 1.2rem; color: var(--ed-muted); padding: 0.25rem 0.5rem; flex-shrink: 0; transition: color 0.15s; }\n' +
'.ed-expand-btn:hover { color: var(--ed-blue); }\n' +
'\n' +
'.ed-item-detail { display: none; padding: 0 1rem 1rem; border-top: 1px solid #F0F0F0; font-size: 0.88rem; }\n' +
'.ed-item-detail--open { display: block; }\n' +
'.ed-detail-desc { color: var(--ed-muted); line-height: 1.6; margin: 0.75rem 0 0.5rem; }\n' +
'.ed-detail-table { width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; }\n' +
'.ed-detail-table td { padding: 0.3rem 0; font-size: 0.82rem; vertical-align: top; }\n' +
'.ed-dt-label { color: var(--ed-muted); font-weight: 600; width: 130px; padding-right: 0.5rem; flex-shrink: 0; }\n' +
'.ed-tip { display: flex; gap: 0.5rem; background: #FFFBEB; border-left: 3px solid #F59E0B; border-radius: 0 8px 8px 0; padding: 0.6rem 0.75rem; font-size: 0.82rem; line-height: 1.5; color: #92400E; margin-top: 0.5rem; }\n' +
'.ed-tip-icon { font-size: 1rem; flex-shrink: 0; }\n' +
'\n' +
'/* Timeline */\n' +
'.ed-timeline-card { background: var(--ed-card); border-radius: 14px; border: 1.5px solid #E5E7EB; padding: 1.25rem; margin-bottom: 1.25rem; }\n' +
'.ed-tc-header { font-size: 1rem; margin-bottom: 1rem; color: var(--ed-text); }\n' +
'.ed-tc-icon { font-size: 1.1rem; margin-right: 0.3rem; }\n' +
'.ed-timeline-steps { display: flex; flex-direction: column; gap: 0.5rem; }\n' +
'.ed-ts-item { display: flex; gap: 0.75rem; font-size: 0.88rem; line-height: 1.5; }\n' +
'.ed-ts-num { width: 28px; height: 28px; background: var(--ed-blue-light); color: var(--ed-blue); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.82rem; flex-shrink: 0; margin-top: 0.1rem; }\n' +
'.ed-ts-ship .ed-ts-num { background: #DCFCE7; color: #16A34A; }\n' +
'.ed-tc-note { font-size: 0.78rem; color: var(--ed-muted); margin: 0.75rem 0 0; line-height: 1.5; }\n' +
'\n' +
'/* AfCFTA callout */\n' +
'.ed-afcfta-callout { display: flex; gap: 1rem; background: linear-gradient(135deg, #FFF7ED, #FEF3C7); border-left: 4px solid #F59E0B; border-radius: 0 12px 12px 0; padding: 1rem 1.25rem; margin-bottom: 1.25rem; font-size: 0.88rem; line-height: 1.6; }\n' +
'.ed-afcfta-icon { font-size: 1.5rem; flex-shrink: 0; }\n' +
'\n' +
'/* Progress bar */\n' +
'#edProgress { margin-bottom: 1rem; }\n' +
'.ed-prog-label { font-size: 0.85rem; font-weight: 600; color: var(--ed-blue); margin-bottom: 0.4rem; display: block; }\n' +
'.ed-prog-bar { height: 8px; background: #E5E7EB; border-radius: 4px; overflow: hidden; }\n' +
'.ed-prog-fill { height: 100%; background: var(--ed-blue); border-radius: 4px; transition: width 0.3s ease; }\n' +
'\n' +
'/* Print row */\n' +
'.ed-print-row { text-align: center; padding: 1rem 0; }\n' +
'\n' +
'/* Print styles */\n' +
'@media print {\n' +
'  .ed-hero, afro-navbar, afro-footer, .ed-btn, .ed-expand-btn { display: none !important; }\n' +
'  .ed-results { display: block !important; }\n' +
'  .ed-item-detail { display: block !important; }\n' +
'  .ed-card { box-shadow: none; border: 1px solid #ddd; break-inside: avoid; }\n' +
'  .ed-item { break-inside: avoid; }\n' +
'}\n' +
'</style>\n' +
'<link rel="alternate" hreflang="en" href="' + url + '" />\n' +
'<link rel="alternate" hreflang="x-default" href="' + url + '" />\n' +
'</head>\n' +
'\n' +
'<body>\n' +
'<afro-navbar theme="dark" active="tools"></afro-navbar>\n' +
'\n' +
'<!-- ─── HERO ─── -->\n' +
'<section class="ed-hero">\n' +
'  <div class="ed-hero-inner">\n' +
'    <nav class="ed-breadcrumb" aria-label="Breadcrumb">\n' +
'      <a href="/">AfroTools</a> &rsaquo;\n' +
'      <a href="/agriculture/export-docs/">Export Documentation Checklist</a> &rsaquo;\n' +
'      ' + c.name + '\n' +
'    </nav>\n' +
'    <h1>' + h1 + '</h1>\n' +
'    <p class="ed-hero-sub">' + heroSub + '</p>\n' +
'    <div class="ed-stats-bar" id="edStatsBar">\n' +
'      <span class="ed-stat-pill">&#127760; ' + c.region + '</span>\n' +
'      <span class="ed-stat-pill">&#128203; Export Docs Checklist</span>\n' +
'      <span class="ed-stat-pill">&#127775; AfCFTA Ready</span>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n' +
'\n' +
'<!-- ─── MAIN ─── -->\n' +
'<div class="ed-main">\n' +
'\n' +
'  <!-- Form Card -->\n' +
'  <div class="ed-card">\n' +
'    <h2 class="ed-card-title">&#128203; Generate Your Export Documentation Checklist</h2>\n' +
'    <div class="ed-form-grid">\n' +
'\n' +
'      <div class="ed-field">\n' +
'        <label class="ed-label" for="edSelProduct">Product / Commodity</label>\n' +
'        <select class="ed-select" id="edSelProduct">\n' +
'          <!-- Populated by engine from country\'s topCrops -->\n' +
'        </select>\n' +
'      </div>\n' +
'\n' +
'      <div class="ed-field">\n' +
'        <label class="ed-label" for="edSelDest">Export Destination</label>\n' +
'        <select class="ed-select" id="edSelDest">\n' +
'          <option value="africa">Within Africa (AfCFTA)</option>\n' +
'          <option value="eu">European Union</option>\n' +
'          <option value="us">United States</option>\n' +
'          <option value="middle_east">Middle East / GCC</option>\n' +
'          <option value="asia">Asia (China, Japan, India)</option>\n' +
'          <option value="other">Other / General</option>\n' +
'        </select>\n' +
'      </div>\n' +
'\n' +
'      <div class="ed-field">\n' +
'        <label class="ed-label" for="edSelShipment">Shipment Type</label>\n' +
'        <select class="ed-select" id="edSelShipment">\n' +
'          <option value="container">Full Container (FCL) — Ocean</option>\n' +
'          <option value="lcl">Partial Load (LCL) — Ocean</option>\n' +
'          <option value="air">Air Freight</option>\n' +
'          <option value="road">Road (cross-border)</option>\n' +
'        </select>\n' +
'      </div>\n' +
'\n' +
'    </div>\n' +
'    <button class="ed-btn ed-btn-primary" id="edBtnGenerate">&#9989; Generate My Checklist</button>\n' +
'  </div>\n' +
'\n' +
'  <!-- Progress tracker -->\n' +
'  <div id="edProgress" style="display:none"></div>\n' +
'\n' +
'  <!-- Results -->\n' +
'  <div class="ed-card ed-results" id="edResults"></div>\n' +
'\n' +
'</div>\n' +
'\n' +
'<afro-footer></afro-footer>\n' +
'\n' +
'<script>var COUNTRY_CODE = \'' + c.code + '\';<\/script>\n' +
'<script src="/data/agriculture/export-docs-data.js"><\/script>\n' +
'<script src="/data/agriculture/country-index.js"><\/script>\n' +
'<script src="/engines/export-docs-engine.js"><\/script>\n' +
'</body>\n' +
'</html>\n';
}

var count = 0;
COUNTRIES.forEach(function (c) {
  var html = pageHtml(c);
  var filePath = path.join(outDir, c.slug + '.html');
  fs.writeFileSync(filePath, html, 'utf8');
  count++;
  console.log('Written: ' + filePath);
});

console.log('\nDone. Generated ' + count + ' country pages.');
