#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'data/image-generation');
const cohort=require('../data/image-generation/placement-review-cohort.json');
const library=require('../data/image-generation/image-library.json').images;
const creators=require('../data/image-generation/live-creator-image-references.json');
const sandbox={};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'assets/js/components/tool-registry.js'),'utf8'),sandbox);
const csvFiles=fs.readdirSync(path.join(ROOT,'data/cars')).filter(x=>/^(catalog-expansion|master-vehicle)/.test(x)&&x.endsWith('.csv')).map(x=>({file:'data/cars/'+x,text:fs.readFileSync(path.join(ROOT,'data/cars',x),'utf8')}));
const images=cohort.images.map(base=>{
 const asset=library.find(x=>x.path===base.path);if(!asset||asset.sha256!==base.sha256)throw new Error('Cohort changed '+base.path);
 const stem=path.basename(base.path).replace(/\.[^.]+$/,''),row={...base,decision:null,owner:null,reason:null,text_status:asset.text_status};
 const decide=(decision,owner,reason)=>Object.assign(row,{decision,owner,reason});
 if(asset.placements.length){const p=asset.placements[0];decide('active',p.path,'Verified '+p.kind+' binding. '+(base.family==='blog'?'Dedicated editorial image replaces generic tool art; English article only.':'Existing owner now detected by inventory.'));}
 else if(base.family==='cars'){
  const id=stem.replace(/-hero$/,'');const source=csvFiles.find(x=>x.text.split(/\r?\n/).some(line=>line.startsWith(id+',')));
  if(source)decide('reserved-catalogue',source.file+'#'+id,'Image belongs to this exact make/model/year candidate. Current published price catalogue has no binding for this asset. Keep in the car catalogue intake shelf; do not invent a vehicle price or launch a route to consume it. Vehicle appearance and source evidence must be checked when this candidate launches.');
  else decide('retired-alternative','cars/index.html',stem.endsWith('-banner')?'Unused car campaign banner. Retain in the car design archive; current directory has its own active artwork.':'Historical vehicle image '+id+' has no matching current published or expansion CSV row. Retain in the car media archive; do not substitute a different model year or invent catalogue facts.');
 }else if(base.family==='afrostream'){
  const slug=stem.replace(/-avatar$/,'');const creator=creators.rows.find(x=>x.slug===slug);
  decide('retired-alternative',creator?'public.as_creators:'+slug:'tools/afrostream/index.html#media-archive',creator?(creator.has_remote_avatar?'Live creator record selects a remote avatar.':'Live creator record does not select this file.')+' Retain the older local alternative; do not replace the selected portrait without identity and provenance evidence.':'No current creator/news binding for this file in the verified database snapshot. Retain in the AfroStream media archive; filename alone does not establish publication or identity.');
 }else if(base.family==='matchday')decide('archived-product','scripts/build-dist.js#BLOCKED_RELATIVE_DIRS','Flag belongs to archived Matchday assets, already excluded from production. Retain with that product; this image task does not relaunch Matchday.');
 else if(base.family==='tools'){
  const replacement=library.find(x=>x.path!==base.path&&x.path.replace(/\.[^.]+$/,'')===base.path.replace(/\.[^.]+$/,'')&&x.placements.length);
  const tool=sandbox.AFRO_TOOLS.find(x=>[x.id,x.imageId,x.sourceId].includes(stem));
  if(stem==='ip-calculator')decide('rejected-artwork','assets/js/components/tool-registry.js','Visual review shows a receipt, calculator and money. This does not illustrate Internet Protocol subnet calculation. Do not attach based on filename.');
  else decide('retired-alternative',replacement?.path||tool?.href||'assets/js/components/tool-registry.js#'+stem,base.path.endsWith('.svg')?'Legacy English text card. Retain as an old design variant; current shared registry owns discovery artwork. Do not share embedded English headings across translated pages.':stem==='transliterate-fr'?'Alternate transliteration illustration with embedded glyphs; current shared artwork remains canonical.':stem==='site-clearing'?'English heading embedded in artwork; retain as a locale-specific alternate instead of replacing shared canonical imagery.':'Unused alternate illustration. Existing tool/card artwork remains canonical; retain this variant under its original subject, without creating duplicate locale artwork bindings.');
 }else if(base.family==='brand-and-banners'||base.family==='og'){
  const legacy=/\.svg$/.test(base.path);
  decide(legacy?'retired-alternative':'rejected-artwork',base.family==='og'?'scripts/apply-og-fallbacks.js':'index.html',legacy?'Legacy logo/social design retained for history; current logo-mark and social metadata remain canonical.':'Visual review: promotional collage or mock interface, embedded copy, or unverified map/currency/UI details. Reject for automatic public placement and translated reuse; retain original in the design archive.');
  row.text_status=legacy?'contains-text':'embedded-text-or-unverified-details';
 }else if(base.family==='categories')decide('retired-alternative','assets/js/components/tool-registry.js#categories','Small legacy category icon (including text/logo variants). Current category discovery owns its visual treatment; retain as a legacy icon, not a hero or translated card.');
 else if(base.family==='crypto')decide('retired-alternative','crypto/p2p-rates/index.html','Legacy letter tile, not a verified exchange logo. Retain in exchange design archive; current comparator presentation remains canonical.');
 else if(base.family==='icons')decide('retired-alternative','index.html','Legacy white hero outline icon. Current home-page hero owns its icons; retain this alternate in the home design archive.');
 else if(base.family==='partners')decide('retired-alternative','assets/img/partners','Unused partner wordmark. Retain in partner brand assets; no new endorsement or placement is implied.');
 else throw new Error('Missing explicit decision '+base.path);
 return row;
});
if(images.length!==792||images.some(x=>!x.owner||!x.reason))throw new Error('Incomplete review');
const summary=images.reduce((o,x)=>(o[x.decision]=(o[x.decision]||0)+1,o),{});
fs.writeFileSync(path.join(OUT,'placement-decisions.json'),JSON.stringify({schema_version:1,reviewed_at:'2026-09-08',baseline_commit:cohort.baseline_commit,total:792,summary,note:'Placement decisions, not a claim that every asset is public or visually approved. Existing paths and bytes are preserved. Reserved catalogue art is assigned to exact candidate rows; retirement/rejection is a final placement decision, not approval for later publication.',images},null,2)+'\n');
console.log(JSON.stringify(summary));
