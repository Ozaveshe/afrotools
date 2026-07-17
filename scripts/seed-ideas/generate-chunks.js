#!/usr/bin/env node
/**
 * Split seed SQL into ~1MB chunks for Supabase SQL Editor.
 * Usage: node scripts/seed-ideas/generate-chunks.js
 * Creates: supabase/ideas-seed-01.sql, ideas-seed-02.sql, etc.
 */
var fs = require('fs');
var path = require('path');
var countries = require('./countries');
var concepts = require('./concepts');

var NGN_RATES = {
  NGN:1, KES:0.85, ZAR:0.011, GHS:0.0096, ETB:0.078, EGP:0.033,
  TZS:1.7, UGX:2.48, RWF:0.87, XOF:0.41, XAF:0.41, CDF:1.78,
  MZN:0.043, MAD:0.0067, AOA:0.57, MGA:3.02, MWK:1.17, ZMW:0.018,
  ZWL:1.7, GNF:5.81, SLE:0.015, LRD:0.13, MRU:0.027, ERN:0.01,
  GMD:0.047, BWP:0.009, NAD:0.012, LSL:0.012, CVE:0.069,
  MUR:0.031, SZL:0.012, DJF:0.12, KMF:0.31, STN:0.015, SCR:0.009,
  SDG:0.4, SSP:0.89, SOS:0.385, LYD:0.003, TND:0.002, DZD:0.091,
  BIF:1.95, USD:0.00067
};
var SYMBOLS = {
  NGN:'\u20A6', KES:'KSh', ZAR:'R', GHS:'GH\u20B5', ETB:'Br', EGP:'E\u00A3',
  TZS:'TSh', UGX:'USh', RWF:'RF', XOF:'CFA', XAF:'FCFA', CDF:'FC',
  MZN:'MT', MAD:'MAD', AOA:'Kz', MGA:'Ar', MWK:'MK', ZMW:'ZK',
  ZWL:'Z$', GNF:'FG', SLE:'Le', LRD:'L$', MRU:'UM', ERN:'Nfk',
  GMD:'D', BWP:'P', NAD:'N$', LSL:'M', CVE:'$', MUR:'Rs',
  SZL:'E', DJF:'Fdj', KMF:'CF', STN:'Db', SCR:'SR', SDG:'SDG',
  SSP:'SSP', SOS:'Sh', LYD:'LD', TND:'DT', DZD:'DA', BIF:'FBu', USD:'$'
};

function convertCost(a,c,m){return Math.round(a*m*(NGN_RATES[c]||1));}
function escSQL(s){return s?s.replace(/'/g,"''").replace(/\\/g,'\\\\'):'';}
function pgArray(a){if(!a||!a.length)return"'{}'";return"'{"+a.map(function(s){return'"'+escSQL(s)+'"'}).join(',')+"}'";}

function generateBreakdown(concept,country){
  var sym=SYMBOLS[country.currency]||country.currency;
  var m=country.costMult;var r=NGN_RATES[country.currency]||1;var cMin=concept[5];var tier=concept[3];
  var pcts=tier==='micro'?[.4,.3,.15,.15]:tier==='small'?[.35,.25,.15,.1,.1,.05]:tier==='medium'?[.4,.15,.15,.1,.05,.08,.07]:[.3,.2,.2,.08,.05,.07,.1];
  var labels=tier==='micro'?['Equipment & Tools','Initial Stock','Marketing','Working Capital']:
    tier==='small'?['Equipment & Setup','Inventory','Rent (3mo)','Staff (3mo)','Marketing','Working Capital']:
    tier==='medium'?['Major Equipment','Premises','Raw Materials','Staff (3mo)','Licenses','Marketing','Working Capital']:
    ['Land/Property','Construction','Equipment','Staff & Training','Licenses','Marketing','Working Capital (6mo)'];
  var items=[];for(var i=0;i<pcts.length;i++){items.push({item:labels[i],cost:sym+Math.round(cMin*pcts[i]*m*r).toLocaleString()});}
  return JSON.stringify(items);
}

function generateRegs(concept,country){
  var regs=['Business registration required','Tax ID (TIN) mandatory'];
  var s=concept[2];
  if(s==='food'){regs.push('Food safety certification required');regs.push('Health inspection needed');}
  else if(s==='health'){regs.push('Healthcare facility license required');regs.push('Practitioner registration needed');}
  else if(s==='fintech'){regs.push('Central bank approval may be needed');regs.push('AML/KYC compliance mandatory');}
  else if(s==='construction'){regs.push('Building permits required');}
  else if(s==='mining'){regs.push('Mining license required');regs.push('Environmental assessment mandatory');}
  return regs;
}

function makeRow(concept,country){
  var slug=concept[0]+'-'+country.code.toLowerCase();
  var costMin=convertCost(concept[5],country.currency,country.costMult);
  var costMax=convertCost(concept[6],country.currency,country.costMult);
  var revMin=convertCost(concept[7],country.currency,country.revMult);
  var revMax=convertCost(concept[8],country.currency,country.revMult);
  var tags=Array.isArray(concept[16])?concept[16].slice():concept[16]?[concept[16]]:[];
  tags.push(country.code.toLowerCase(),country.region);
  var risks=concept[14]?concept[14].split('|'):[];
  var regs=generateRegs(concept,country);
  var cities=country.cities.slice(0,5);
  var bd=generateBreakdown(concept,country);
  return "(gen_random_uuid(),'"+escSQL(slug)+"','"+escSQL(concept[1])+"','"+escSQL(concept[2])+"','"+
    country.code+"','"+escSQL(country.name)+"','"+concept[3]+"','"+concept[4]+"','"+
    escSQL(concept[11])+"','"+escSQL(concept[12])+"','"+escSQL(concept[13])+"',"+
    pgArray(risks)+",'"+escSQL(concept[15])+"',"+
    costMin+","+costMax+",'"+country.currency+"',"+revMin+","+revMax+","+
    Math.round(revMin*.45)+","+Math.round(revMax*.55)+","+concept[9]+","+concept[10]+","+
    pgArray(regs)+","+pgArray(cities)+",'"+escSQL(bd)+"'::jsonb,"+
    pgArray(tags)+",'seed',0,0,0,NOW(),NOW())";
}

var INSERT_HEAD="INSERT INTO business_ideas (id,slug,name,sector,country_code,country_name,cost_tier,risk,description,why_africa,revenue_model,risks,scale_path,startup_cost_min,startup_cost_max,currency,monthly_revenue_min,monthly_revenue_max,monthly_costs_min,monthly_costs_max,breakeven_months_min,breakeven_months_max,regulations,best_cities,breakdown,tags,source,vote_count,save_count,view_count,created_at,updated_at) VALUES\n";

var outDir=path.join(__dirname,'../../supabase');
var chunkSize=250; // rows per INSERT
var maxPerFile=900; // rows per file (~1MB safe for Supabase)
var fileNum=1;
var rowsInFile=0;
var buffer='';
var batchRows=[];
var totalRows=0;

function flushBatch(){
  if(!batchRows.length)return;
  buffer+=INSERT_HEAD+batchRows.join(',\n')+'\nON CONFLICT (slug) DO NOTHING;\n\n';
  batchRows=[];
}

function flushFile(){
  if(!buffer)return;
  var header='-- AfroIdeas seed chunk '+String(fileNum).padStart(2,'0')+'\n-- Run in Supabase SQL Editor in order\n';
  if(fileNum===1)header+="BEGIN;\nDELETE FROM business_ideas WHERE source = 'seed';\n\n";
  var footer='\n-- Chunk '+fileNum+' complete\n';
  var fname='ideas-seed-'+String(fileNum).padStart(2,'0')+'.sql';
  fs.writeFileSync(path.join(outDir,fname),header+buffer+footer);
  console.log('Wrote '+fname+' ('+rowsInFile+' rows)');
  fileNum++;rowsInFile=0;buffer='';
}

// Delete the single big file if it exists
try{fs.unlinkSync(path.join(outDir,'ideas-seed.sql'));}catch(e){}

for(var c=0;c<concepts.length;c++){
  for(var k=0;k<countries.length;k++){
    batchRows.push(makeRow(concepts[c],countries[k]));
    totalRows++;rowsInFile++;
    if(batchRows.length>=chunkSize){flushBatch();}
    if(rowsInFile>=maxPerFile){flushBatch();flushFile();}
  }
}
flushBatch();
flushFile();

// Write a final COMMIT file
fs.writeFileSync(path.join(outDir,'ideas-seed-'+String(fileNum).padStart(2,'0')+'.sql'),
  '-- Final commit\nCOMMIT;\n-- Total rows inserted: '+totalRows+'\n-- Verify: SELECT COUNT(*) FROM business_ideas;\n');
console.log('\nDone! '+totalRows+' ideas across '+fileNum+' SQL files');
console.log('Run each file in order in Supabase SQL Editor.');
