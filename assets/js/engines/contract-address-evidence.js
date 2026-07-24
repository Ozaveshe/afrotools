(function(root,factory){'use strict';var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.AfroTools=root.AfroTools||{};root.AfroTools.ContractAddressEvidence=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
  var CHAINS={ethereum:{label:'Ethereum',explorer:'https://etherscan.io/address/'},bsc:{label:'BNB Smart Chain',explorer:'https://bscscan.com/address/'},polygon:{label:'Polygon',explorer:'https://polygonscan.com/address/'}};
  var EVIDENCE_STATUSES=['reviewed-record'];
  var CONFIDENCE_LEVELS=['limited','corroborated'];
  function clean(value,max){return String(value||'').trim().slice(0,max);}
  function validAddress(value){return /^0x[0-9a-fA-F]{40}$/.test(clean(value,80));}
  function safeHttps(value){try{var u=new URL(clean(value,500));return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch(_){return '';}}
  function dateValid(value,asOf){
    var text=clean(value,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(text))return false;
    var p=text.split('-').map(Number),stamp=Date.UTC(p[0],p[1]-1,p[2]),parsed=new Date(stamp);
    if(parsed.getUTCFullYear()!==p[0]||parsed.getUTCMonth()!==p[1]-1||parsed.getUTCDate()!==p[2])return false;
    var limit=new Date((asOf||new Date().toISOString().slice(0,10))+'T00:00:00Z');return !Number.isNaN(limit.getTime())&&stamp<=limit.getTime();
  }
  function invalidRegistry(reason){return {ok:false,records:[],reviewedAt:'',provenance:'',error:reason};}
  function normalizeRegistry(raw,options){
    var asOf=options&&options.asOf;
    if(!raw||typeof raw!=='object'||raw.schemaVersion!==2||raw.registryType!=='curated-contract-address-evidence'||!Array.isArray(raw.records))return invalidRegistry('schema');
    var reviewedAt=clean(raw.reviewedAt,10),provenance=clean(raw.provenance,300);
    if(!dateValid(reviewedAt,asOf)||!provenance)return invalidRegistry('provenance');
    if(raw.records.length>200)return invalidRegistry('record-limit');
    var records=raw.records.map(function(item){
      var chain=clean(item&&item.chain,20),address=clean(item&&item.address,80),sourceUrl=safeHttps(item&&item.sourceUrl);
      var title=clean(item&&item.title,120),summary=clean(item&&item.summary,500),sourceLabel=clean(item&&item.sourceLabel,120),sourcePublisher=clean(item&&item.sourcePublisher,120),recordReviewedAt=clean(item&&item.reviewedAt,10),evidenceStatus=clean(item&&item.evidenceStatus,40),confidence=clean(item&&item.confidence,40);
      if(!CHAINS[chain]||!validAddress(address)||!sourceUrl||!title||!summary||!sourceLabel||!sourcePublisher||!dateValid(recordReviewedAt,asOf)||EVIDENCE_STATUSES.indexOf(evidenceStatus)<0||CONFIDENCE_LEVELS.indexOf(confidence)<0)return null;
      return {chain:chain,address:address.toLowerCase(),title:title,summary:summary,sourceUrl:sourceUrl,sourceLabel:sourceLabel,sourcePublisher:sourcePublisher,reviewedAt:recordReviewedAt,evidenceStatus:evidenceStatus,confidence:confidence};
    }).filter(Boolean);
    if(records.length!==raw.records.length)return invalidRegistry('invalid-record');
    var keys={};
    for(var i=0;i<records.length;i++){var key=records[i].chain+'|'+records[i].address;if(keys[key])return invalidRegistry('duplicate-record');keys[key]=true;}
    return {ok:true,records:records,reviewedAt:reviewedAt,provenance:provenance};
  }
  function check(address,chain,registry){
    var input=clean(address,80),config=CHAINS[chain];
    if(!config)return {status:'invalid-chain',valid:false,address:input,chain:'',record:null,explorerUrl:''};
    if(!validAddress(input))return {status:'invalid-address',valid:false,address:input,chain:chain,chainLabel:config.label,record:null,explorerUrl:''};
    var normalized=input.toLowerCase(),state=registry&&registry.ok===true?registry:null;
    var record=state?state.records.find(function(row){return row.chain===chain&&row.address===normalized;}):null;
    return {status:!state?'registry-unavailable':record?'reviewed-record':'no-reviewed-record',valid:true,address:input,normalizedAddress:normalized,chain:chain,chainLabel:config.label,record:record||null,registryReviewedAt:state?state.reviewedAt:'',explorerUrl:config.explorer+encodeURIComponent(input)};
  }
  function text(result,fr){
    var lines=[fr?'Relevé local de preuve d’adresse de contrat':'Local contract address evidence record',(fr?'Chaîne : ':'Chain: ')+result.chainLabel,(fr?'Adresse : ':'Address: ')+result.address];
    if(result.status==='no-reviewed-record')lines.push(fr?'Résultat : aucun enregistrement exact révisé dans ce petit registre. Ceci ne prouve pas la sécurité.':'Result: no exact reviewed record in this small registry. This does not prove safety.');
    if(result.status==='registry-unavailable')lines.push(fr?'Résultat : registre indisponible. Aucune recherche d’enregistrement n’a été effectuée.':'Result: registry unavailable. No record lookup was completed.');
    if(result.status==='reviewed-record'){lines.push(fr?'Résultat : un enregistrement révisé exact existe. Ce n’est pas un verdict.':'Result: an exact reviewed record exists. This is not a verdict.');lines.push((fr?'Titre : ':'Title: ')+result.record.title);lines.push((fr?'Éditeur : ':'Publisher: ')+result.record.sourcePublisher);lines.push((fr?'Révisé le : ':'Reviewed: ')+result.record.reviewedAt);lines.push((fr?'Statut de preuve : ':'Evidence status: ')+result.record.evidenceStatus);lines.push((fr?'Confiance : ':'Confidence: ')+result.record.confidence);lines.push((fr?'Source : ':'Source: ')+result.record.sourceUrl);}
    lines.push(fr?'Limites : syntaxe EVM seulement; aucune preuve d’existence, checksum, jeton, code source, permissions, détenteurs, liquidité, vente, honeypot ou sécurité.':'Limits: EVM syntax only; no existence, checksum, token, source, permission, holder, liquidity, sellability, honeypot or safety proof.');
    return lines.join('\n');
  }
  return {CHAINS:CHAINS,EVIDENCE_STATUSES:EVIDENCE_STATUSES,CONFIDENCE_LEVELS:CONFIDENCE_LEVELS,validAddress:validAddress,safeHttps:safeHttps,dateValid:dateValid,normalizeRegistry:normalizeRegistry,check:check,text:text};
});
