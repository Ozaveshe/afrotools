'use strict';
const fs=require('fs'),path=require('path'),shell=require('./lib/fuel-market-shell');
const routes={en:'tools/fuel-tracker/index.html',fr:'fr/tools/suivi-carburant/index.html',sw:'sw/zana/ufuatiliaji-bei-za-mafuta/index.html'};
const start='<!-- FUEL_MARKET_START -->',end='<!-- FUEL_MARKET_END -->';
function build(html,locale){
 const block=start+'\n'+shell(locale)+'\n'+end;
 html=html.replace(/The interface marks stale periods unavailable/g,'The interface labels historical prices for planning').replace(/with local browser matching and a 45-day freshness threshold/g,'with local browser matching, dated observations and explicit historical planning choices');
 html=html.replace(/A record is withheld when a required source field is missing, the published validity period has ended, or the effective date is older than 45 days\. You can still enter a price verified at your local station and use the fill-cost calculator\./g,'A price is unavailable only when required numeric values, sources or dates are invalid. Older and expired records remain visible as historical references: choose them explicitly for a labelled planning estimate, or enter a locally verified pump price.');
 html=html.replace(/<section class="fuel-card fuel-supported"[\s\S]*?<\/section>/,'<section class="fuel-card fuel-supported"><h2>Supported price coverage</h2><p>Choose a supported country above. The market selector distinguishes dated city references from country benchmarks. The coverage table lists the loaded source-backed observations; no city or station coverage is inferred from a country benchmark.</p></section>');

 html=html.replace(/and withhold stale prices/g,'and show dated prices for honest planning').replace(/Stale or incomplete prices are unavailable\./g,'Historical prices remain visible for explicitly labelled planning estimates; incomplete records remain unavailable.').replace(/Stale prices are unavailable/g,'Historical prices are labelled for planning');
 if(html.includes(start))html=html.replace(/<!-- FUEL_MARKET_START -->[\s\S]*?<!-- FUEL_MARKET_END -->/,block);
 else if(locale==='en')html=html.replace(/<section class="fuel-card fuel-finder"[\s\S]*?(?=<section class="fuel-card fuel-supported")/,block+'\n');
 else if(locale==='sw')html=html.replace(/(?=<section class="swt-card" aria-labelledby="snapshot-title")/,block+'\n');
 else html=html.replace(/(<section class="hero">[\s\S]*?<\/section>)/,'$1\n'+block);
 if(!html.includes(block))throw Error('Fuel finder insertion failed: '+locale);
 html=html.replace(/<script[^>]*src="\/assets\/js\/(?:pages\/(?:fuel-tracker-vip|fuel-market-finder)|lib\/(?:fuel-market-copy|fuel-market-observations)|engines\/fuel-tracker-engine)\.js(?:\?[^"]*)?"[^>]*><\/script>\s*/g,'');
 html=html.replace(/<link[^>]*href="\/assets\/css\/fuel-tracker-vip\.css(?:\?[^"]*)?"[^>]*>\s*/g,'');
 // The selected observation panel owns fuel freshness; a feed-fetch badge cannot certify its price.
 html=html.replace(/<script[^>]*src="\/assets\/js\/lib\/source-confidence\.js(?:\?[^"]*)?"[^>]*><\/script>\s*/g,'');
 html=html.replace('</head>','<script src="/assets/js/engines/fuel-tracker-engine.js" defer></script>\n<link rel="stylesheet" href="/assets/css/fuel-tracker-vip.css">\n</head>');
 return html.replace('</body>','<script src="/assets/js/lib/fuel-market-observations.js" defer></script>\n<script src="/assets/js/lib/fuel-market-copy.js" defer></script>\n<script src="/assets/js/pages/fuel-tracker-vip.js" defer></script>\n</body>');
}
if(require.main===module){for(const [locale,route]of Object.entries(routes)){const file=path.resolve(__dirname,'..',route),before=fs.readFileSync(file,'utf8'),after=build(before,locale);if(process.argv.includes('--write'))fs.writeFileSync(file,after);else if(before!==after)throw Error('Fuel market owner drift: '+route);}console.log('Fuel market owner: 3 locales checked');}
module.exports={build,routes};
