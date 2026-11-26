'use strict';

const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');

function pageTitle(owner) {
  const html = fs.readFileSync(path.join(root, owner), 'utf8');
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match && match[1].split('|')[0].trim();
}

// English workflows checked against the tool owners. A native/shell promotion
// in the route manifest always takes precedence over these directory links.
const englishAlternatives = {
  "/yo/awon-ise/agbon-oja/": "/tools/staple-basket/",
  "/yo/awon-ise/alawus-na-nysc/": "/tools/nysc-allowance/",
  "/yo/awon-ise/din-iwon-pdf/": "/tools/pdf-compress/",
  "/yo/awon-ise/duba-genotype/": "/tools/genotype-checker/",
  "/yo/awon-ise/ere-oko-eja/": "/agriculture/fish-farming/nigeria",
  "/yo/awon-ise/eso-irugbin/": "/agriculture/crop-yield/nigeria",
  "/yo/awon-ise/hada-ati-pin-pdf/": "/tools/pdf-merge-split/",
  "/yo/awon-ise/isuna-ogbin/": "/agriculture/farm-budget/",
  "/yo/awon-ise/iwon-ajile/": "/agriculture/fertilizer/nigeria",
  "/yo/awon-ise/kalkuletan-jamb/": "/tools/jamb-aggregate/",
  "/yo/awon-ise/kalkuletan-waec-neco/": "/tools/waec-calculator/",
  "/yo/awon-ise/kiriiro-invoice/": "/tools/invoice-generator/",
  "/yo/awon-ise/kiriiro-risiti/": "/tools/receipt-generator/",
  "/yo/awon-ise/ounje-eranko/": "/agriculture/livestock-feed/nigeria",
  "/yo/awon-ise/owo-ile-iwosan/": "/tools/hospital-cost/",
  "/yo/awon-ise/owo-oja-ogbin/": "/agriculture/commodity-prices/",
  "/yo/awon-ise/sise-rogo/": "/agriculture/cassava-processing/nigeria",
  "/yo/awon-ise/whatsapp-link/": "/tools/whatsapp-link/",
  "/yo/ibaraenisoro/": "/telecom/",
  "/yo/ilera/": "/health/"
};

function buildYorubaDirectoryData(tools, manifest) {
  const byRoute = new Map(tools.map(tool => [tool.route, tool]));
  const data = {};
  for (const row of manifest.routes) {
    const tool = byRoute.get(row.route);
    // The elections hub is an editorial index and has no tool registry entry.
    const electionHub = row.route === '/yo/idibo/';
    const name = row.catalogName || (tool && tool.title) || pageTitle(row.sourceOwner);
    if (!name) throw new Error('Missing Yoruba directory title for ' + row.route);
    data[row.route] = {
      name,
      description: row.catalogDescription || (tool && tool.description) || '',
      category: (tool && tool.categoryId) || (electionHub ? 'government' : 'african'),
    };
    if (englishAlternatives[row.route]) data[row.route].englishAlternative = englishAlternatives[row.route];
  }
  return 'window.AfroToolsYorubaDirectoryData=' + JSON.stringify(data) + ';\n';
}

module.exports = { buildYorubaDirectoryData };
