/**
 * fix-agriculture-pages.js
 * Fixes all agriculture HTML pages:
 * 1. Replace hardcoded "Nigeria" with correct country name (fertilizer + crop-yield)
 * 2. Replace green brand colors with blue (#007AFF) across all agriculture pages
 */

'use strict';
const fs = require('fs');
const path = require('path');

const BASE = 'C:/Users/Oza/Documents/afrotools';

// Build country map: iso2code -> country name (from data files)
const agriDataDir = path.join(BASE, 'data/agriculture');
const countryMap = {}; // code -> name
fs.readdirSync(agriDataDir).filter(f => /^[a-z]{2}-agri-data\.js$/.test(f)).forEach(f => {
  const code = f.replace('-agri-data.js', '').toUpperCase();
  const content = fs.readFileSync(path.join(agriDataDir, f), 'utf8');
  const m = content.match(/name:"([^"]+)"/);
  if (m) countryMap[code] = m[1];
});

// Green -> Blue replacements (CSS vars)
function fixColors(html) {
  return html
    // CSS vars
    .replace(/--calc-accent:#008751/g, '--calc-accent:#007AFF')
    .replace(/--calc-accent-rgb:0,135,81/g, '--calc-accent-rgb:0,122,255')
    .replace(/--calc-accent-dark:#006B3F/g, '--calc-accent-dark:#0063D1')
    .replace(/--calc-accent-light:#E6F5ED/g, '--calc-accent-light:#E8F2FF')
    .replace(/--calc-accent-pale:#F0FAF5/g, '--calc-accent-pale:#EBF4FF')
    // Irrigation uses different var names
    .replace(/--ir-green:#([0-9a-fA-F]{6})/g, '--ir-green:#007AFF')
    .replace(/--ir-green-pale:#([0-9a-fA-F]{6})/g, '--ir-green-pale:#E8F2FF')
    .replace(/--ir-green-light:#([0-9a-fA-F]{6})/g, '--ir-green-light:#E8F2FF')
    // index page green accent vars
    .replace(/--hub-accent:#008751/g, '--hub-accent:#007AFF')
    .replace(/--hub-accent:#22c55e/g, '--hub-accent:#007AFF')
    .replace(/--hub-accent:#16a34a/g, '--hub-accent:#007AFF')
    .replace(/--hub-green:#([0-9a-fA-F]{6})/g, '--hub-green:#007AFF')
    // Other green occurrences
    .replace(/#008751/g, '#007AFF')
    .replace(/#006B3F/g, '#0063D1')
    .replace(/#E6F5ED/g, '#E8F2FF')
    .replace(/#F0FAF5/g, '#EBF4FF')
    .replace(/#22c55e/g, '#007AFF')
    .replace(/#16a34a/g, '#0063D1')
    .replace(/#15803d/g, '#0052B4')
    .replace(/#bbf7d0/g, '#BFDBFE')
    .replace(/#dcfce7/g, '#DBEAFE')
    .replace(/#D1FAE5/g, '#DBEAFE');
}

// Fix Nigeria hardcoding in fertilizer/crop-yield pages
function fixNigeriaText(html, countryName, toolLabel) {
  // Breadcrumb
  html = html.replace(
    /<span aria-current="page">Nigeria<\/span>/g,
    `<span aria-current="page">${countryName}</span>`
  );
  // h1 (flag emoji varies per page - use regex that captures it)
  html = html.replace(
    /(<h1><span class="flag" aria-hidden="true">[\s\S]*?<\/span>\s*)Nigeria(\s*<em>)/g,
    `$1${countryName}$2`
  );
  // Twitter description - replace "Nigeria" with countryName
  html = html.replace(
    /(<meta name="twitter:description" content="[^"]*?)Nigeria([^"]*?")/g,
    `$1${countryName}$2`
  );
  // JS locale: en-NG -> en (generic, works for all)
  html = html.replace(/toLocaleString\('en-NG'/g, "toLocaleString('en'");
  // JS countryInfo text hardcoded "Nigeria's"
  html = html.replace(/"% to Nigeria's GDP/g, `"% to ${countryName}'s GDP`);
  // Any remaining "Nigeria" in href/src is intentional (like ng-agri-data.js) - skip
  return html;
}

let fixedCount = 0;

function processDir(toolDir, toolLabel, fixNigeria) {
  const dir = path.join(BASE, 'agriculture', toolDir);
  if (!fs.existsSync(dir)) { console.log('SKIP (missing):', dir); return; }

  fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html').forEach(filename => {
    const filepath = path.join(dir, filename);
    let html = fs.readFileSync(filepath, 'utf8');
    const original = html;

    // Fix colors on ALL pages
    html = fixColors(html);

    // Fix Nigeria hardcoding on non-nigeria pages
    if (fixNigeria && filename !== 'nigeria.html') {
      // Find the data file to get country code
      const dataMatch = html.match(/\/data\/agriculture\/([a-z]{2})-agri-data\.js/);
      if (dataMatch) {
        const code = dataMatch[1].toUpperCase();
        const countryName = countryMap[code];
        if (countryName) {
          html = fixNigeriaText(html, countryName, toolLabel);
        } else {
          console.warn('No country name for code:', code, filename);
        }
      } else {
        console.warn('No data file found in:', filename);
      }
    }

    if (html !== original) {
      fs.writeFileSync(filepath, html, 'utf8');
      fixedCount++;
      // console.log('Fixed:', toolDir + '/' + filename);
    }
  });

  // Also fix index.html colors
  const indexPath = path.join(dir, 'index.html');
  if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    const orig = html;
    html = fixColors(html);
    if (html !== orig) {
      fs.writeFileSync(indexPath, html, 'utf8');
      fixedCount++;
      console.log('Fixed index:', toolDir + '/index.html');
    }
  }
}

// Process all three tool directories
processDir('fertilizer', 'Fertilizer Calculator', true);
processDir('crop-yield', 'Crop Yield Estimator', true);
processDir('irrigation', 'Irrigation Water Calculator', false); // irrigation doesn't have Nigeria bug

console.log(`\nDone. Fixed ${fixedCount} files.`);
