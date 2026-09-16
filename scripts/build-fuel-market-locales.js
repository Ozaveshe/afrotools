'use strict';
const fs=require('fs'),path=require('path'),shell=require('./lib/fuel-market-shell');
const routes={en:'tools/fuel-tracker/index.html',fr:'fr/tools/suivi-carburant/index.html',sw:'sw/zana/ufuatiliaji-bei-za-mafuta/index.html'};
const start='<!-- FUEL_MARKET_START -->',end='<!-- FUEL_MARKET_END -->';
function build(html,locale){
 const block=start+'\n'+shell(locale)+'\n'+end;
 if(locale==='fr')html=html.replace(/<!-- FUEL_MARKET_START -->[\s\S]*?<!-- FUEL_MARKET_END -->\s*/, '');
 if(html.includes(start))html=html.replace(/<!-- FUEL_MARKET_START -->[\s\S]*?<!-- FUEL_MARKET_END -->/,block);
 else if(locale==='en')html=html.replace(/<section class="fuel-card fuel-finder"[\s\S]*?(?=<section class="fuel-card fuel-supported")/,block+'\n');
 else if(locale==='sw')html=html.replace(/(?=<section class="swt-card" aria-labelledby="snapshot-title")/,block+'\n');
 else html=html.replace(/(<section class="hero">[\s\S]*?<\/section>)/,'$1\n'+block);
 if(!html.includes(block))throw Error('Fuel finder insertion failed: '+locale);
 html=html.replace(/<script[^>]*src="\/assets\/js\/(?:pages\/(?:fuel-tracker-vip|fuel-market-finder)|lib\/fuel-market-copy|engines\/fuel-tracker-engine)\.js(?:\?[^"]*)?"[^>]*><\/script>\s*/g,'');
 html=html.replace(/<link[^>]*href="\/assets\/css\/fuel-tracker-vip\.css(?:\?[^"]*)?"[^>]*>\s*/g,'');
 html=html.replace('</head>','<script src="/assets/js/engines/fuel-tracker-engine.js" defer></script>\n<link rel="stylesheet" href="/assets/css/fuel-tracker-vip.css">\n</head>');
 return html.replace('</body>','<script src="/assets/js/lib/fuel-market-copy.js" defer></script>\n<script src="/assets/js/pages/fuel-tracker-vip.js" defer></script>\n</body>');
}
if(require.main===module){for(const [locale,route]of Object.entries(routes)){const file=path.resolve(__dirname,'..',route),before=fs.readFileSync(file,'utf8'),after=build(before,locale);if(process.argv.includes('--write'))fs.writeFileSync(file,after);else if(before!==after)throw Error('Fuel market owner drift: '+route);}console.log('Fuel market owner: 3 locales checked');}
module.exports={build,routes};
