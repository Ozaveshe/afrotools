(function(root,factory){'use strict';var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.moroccoPaye=api;}})(typeof globalThis==='undefined'?this:globalThis,function(){
  'use strict';
  var bands=[[40000,0],[60000,.10],[80000,.20],[100000,.30],[180000,.34],[Infinity,.37]];
  var sources={code:'https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf',codeCopy:'https://apsf.ma/wp-content/uploads/2026/01/DGI_CODE-GENERAL-DES-IMPOTS-CGI-2026.pdf',cnss:'https://www.acaps.ma/fr/files/fichesynthetiquecnsspdf',amo:'https://www.acaps.ma/fr/grand-public/sante/couverture-medicale-de-base-amo'};
  function amount(value){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e10)throw new RangeError('Invalid salary');return value;}
  function tax(income){amount(income);var previous=0,total=0,rows=[];bands.forEach(function(band){var slice=Math.max(0,Math.min(income,band[0])-previous),due=slice*band[1];rows.push({from:previous,to:Number.isFinite(band[0])?band[0]:null,rate:band[1],income:slice,tax:due});total+=due;previous=band[0];});return {tax:total,bands:rows};}
  function calculate(gross,period,options){amount(gross);if(period!=='monthly'&&period!=='annual')throw new RangeError('Invalid period');var annualGross=gross*(period==='monthly'?12:1);amount(annualGross);options=options||{};var dependents=options.dependents===undefined?0:options.dependents;if(!Number.isInteger(dependents)||dependents<0||dependents>6)throw new RangeError('Invalid dependents');['cnss','amo'].forEach(function(k){if(options[k]!==undefined&&typeof options[k]!=='boolean')throw new RangeError('Invalid contribution option');});
    // Equal pay over twelve months only: cap the salary base, not the contribution.
    var cnss=options.cnss===false?0:Math.min(annualGross,72000)*.0448,amo=options.amo===false?0:annualGross*.0226,mandatory=cnss+amo;
    // Ordinary article59-I-A employment, with no cash or in-kind benefits.
    var professional=annualGross<=78000?annualGross*.35:Math.min(annualGross*.25,35000),taxable=Math.max(0,annualGross-mandatory-professional),ir=tax(taxable),familyRelief=Math.min(ir.tax,dependents*600),incomeTax=Math.max(0,ir.tax-familyRelief);
    var employerCNSS=options.cnss===false?0:Math.min(annualGross,72000)*.0898,employerFamily=annualGross*.064,employerAMO=options.amo===false?0:annualGross*.0411,employerTraining=annualGross*.016;
    return {version:1,regime:'ma-ordinary-private-2026',period:period,currency:'MAD',gross:gross,annualGross:annualGross,cnss:cnss,amo:amo,cnssIncluded:options.cnss!==false,amoIncluded:options.amo!==false,dependents:dependents,mandatory:mandatory,professional:professional,taxable:taxable,taxBeforeRelief:ir.tax,familyRelief:familyRelief,incomeTax:incomeTax,annualNet:annualGross-mandatory-incomeTax,employerCNSS:employerCNSS,employerFamily:employerFamily,employerAMO:employerAMO,employerTraining:employerTraining,employerSubtotal:annualGross+employerCNSS+employerFamily+employerAMO+employerTraining,bands:ir.bands,reviewed:'2026-09-15',contributionEvidence:'CNSS exact rates retained planning assumptions; 2026 amendment check unresolved',sources:sources};
  }
  // The expense-rate change above78,000 can reduce net pay. Search both sides
  // independently and choose the lowest cent meeting the target.
  function reverse(target,period,options){amount(target);if(period!=='monthly'&&period!=='annual')throw new RangeError('Invalid period');var factor=period==='monthly'?12:1,annualTarget=target*factor;amount(annualTarget);var threshold=78000/factor,peakTick=Math.floor(threshold*100);
    function net(tick){return calculate(tick/100,period,options).annualNet;}
    var first=annualTarget<=net(peakTick),low=first?0:peakTick+1,high=first?peakTick:Math.ceil(Math.max(target*3,100000/factor)*100);if(high/100*factor>1e10)high=Math.floor(1e10/factor*100);while(net(high)<annualTarget){high*=2;if(high/100*factor>1e10)throw new RangeError('Invalid target');}while(low<high){var mid=Math.floor((low+high)/2);if(net(mid)<annualTarget)low=mid+1;else high=mid;}return high/100;
  }
  return {calculate:calculate,reverse:reverse,tax:tax,bands:bands,sources:sources};
});
