(function(root,factory){'use strict';var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.tunisiaPaye=api;}})(typeof globalThis==='undefined'?this:globalThis,function(){
  'use strict';
  var bands=[[5000,0],[10000,.15],[20000,.25],[30000,.30],[40000,.33],[50000,.36],[70000,.38],[Infinity,.40]];
  var sources={code:'https://jibaya.tn/wp-content/uploads/2026/03/11.pdf',finance2025:'https://www.finances.gov.tn/sites/default/files/2024-12/LF2025.pdf',solidarity:'https://jibaya.tn/wp-content/uploads/2026/01/مذكرة-عامة-عدد-1.pdf',cnss:'https://www.cnss.tn/fr/web/employeur/emp_asset_services/-/asset_publisher/sYQ8/content/emp_secteur-non_agr6_assiette'};
  function amount(value){if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1e10)throw new RangeError('Invalid salary');return value;}
  function tax(income){amount(income);var previous=0,total=0,rows=[];bands.forEach(function(band){var slice=Math.max(0,Math.min(income,band[0])-previous),due=slice*band[1];rows.push({from:previous,to:Number.isFinite(band[0])?band[0]:null,rate:band[1],income:slice,tax:due});total+=due;previous=band[0];});return {tax:total,bands:rows};}
  function calculate(gross,period,options){amount(gross);if(period!=='monthly'&&period!=='annual')throw new RangeError('Invalid period');var annualGross=gross*(period==='monthly'?12:1);amount(annualGross);var deductible=!(options&&options.jobLossDeductible===false);
    var cnss=annualGross*.0918,jobLoss=annualGross*.005,mandatory=cnss+jobLoss,remainder=annualGross-cnss-(deductible?jobLoss:0),professional=Math.min(remainder*.10,2000),taxable=Math.max(0,remainder-professional);if(Math.abs(taxable-5000)<1e-8)taxable=5000;
    // No other deductions are modelled: article26 net salary is also the CSS
    // exemption basis. Future non-family relief must not reduce that threshold.
    var cssExemptionBasis=taxable,irpp=tax(taxable),css=cssExemptionBasis>5000?taxable*.005:0;
    return {version:1,regime:'tn-private-non-agricultural-2026',period:period,currency:'TND',gross:gross,annualGross:annualGross,cnss:cnss,jobLoss:jobLoss,mandatory:mandatory,professional:professional,taxable:taxable,cssExemptionBasis:cssExemptionBasis,jobLossDeductible:deductible,deductibilityStatus:'planning-interpretation-not-confirmed-by-tax-administration',irpp:irpp.tax,css:css,annualNet:annualGross-mandatory-irpp.tax-css,employerCNSS:annualGross*.1657,employerJobLoss:annualGross*.005,employerSubtotal:annualGross*1.1707,bands:irpp.bands,reviewed:'2026-09-15',sources:sources};
  }
  // CSS introduces a small downward jump above the exemption threshold. Find the
  // lowest gross satisfying the target, considering each side independently.
  function reverse(target,period,options){amount(target);if(period!=='monthly'&&period!=='annual')throw new RangeError('Invalid period');var factor=period==='monthly'?12:1,annualTarget=target*factor,deductible=!(options&&options.jobLossDeductible===false),threshold=5000/((deductible?.9032:.9082)*.9),peakTick=Math.floor(threshold/factor*1000);
    function net(tick){return calculate(tick/1000,period,options).annualNet;}
    var lowerBranch=annualTarget<=net(peakTick),low=lowerBranch?0:peakTick+1,high=lowerBranch?peakTick:Math.ceil(Math.max(target*3,10000/factor)*1000);
    while(net(high)<annualTarget){high*=2;if(high/1000*factor>1e10)throw new RangeError('Invalid target');}
    while(low<high){var mid=Math.floor((low+high)/2);if(net(mid)<annualTarget)low=mid+1;else high=mid;}return high/1000;
  }
  return {calculate:calculate,reverse:reverse,tax:tax,bands:bands,sources:sources};
});
