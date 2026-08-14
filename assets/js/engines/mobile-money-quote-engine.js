(function(root,factory){
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.MobileMoneyQuoteEngine=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  var MAX_AMOUNT=1e15,FUTURE_TOLERANCE_MS=5*60*1000,TYPES=["send","withdraw","merchant","bill","other"];
  function text(value,code,max,pattern){var v=String(value==null?"":value).trim();if(!v||v.length>max||/[\u0000-\u001f<>]/.test(v)||(pattern&&!pattern.test(v)))throw new Error(code);return v;}
  function number(value,code,allowZero){if(value===""||value===null||value===undefined)throw new Error(code);var v=Number(value);if(!Number.isFinite(v)||(allowZero?v<0:v<=0)||v>MAX_AMOUNT)throw new Error(code);return v;}
  function date(value,code,required){var raw=String(value==null?"":value).trim();if(!raw&&!required)return null;if(!raw)throw new Error(code);var v=Date.parse(raw);if(!Number.isFinite(v))throw new Error(code);return v;}
  function build(row,index,asOf){
    if(!row||typeof row!=="object")throw new Error("QUOTE_REQUIRED");
    var observed=date(row.observedAt,"OBSERVED_AT_REQUIRED",true);if(observed>asOf+FUTURE_TOLERANCE_MS)throw new Error("OBSERVED_AT_FUTURE");
    var expires=date(row.expiresAt,"INVALID_EXPIRY",false);if(expires!==null&&expires<observed)throw new Error("EXPIRY_BEFORE_OBSERVED");
    var amount=number(row.amount,"AMOUNT_REQUIRED",false),senderFee=number(row.senderFee,"SENDER_FEE_REQUIRED",true),recipientFee=number(row.recipientFee,"RECIPIENT_FEE_REQUIRED",true);
    var currency=text(row.currency,"CURRENCY_REQUIRED",8,/^[A-Za-z0-9]{2,8}$/).toUpperCase(),type=text(row.transactionType,"TRANSACTION_TYPE_REQUIRED",16);
    if(TYPES.indexOf(type)===-1)throw new Error("TRANSACTION_TYPE_REQUIRED");
    var totalFee=senderFee+recipientFee,expired=expires!==null&&expires<=asOf;
    return {index:index,label:text(row.label,"LABEL_REQUIRED",48),market:text(row.market,"MARKET_REQUIRED",48),currency:currency,transactionType:type,amount:amount,senderFee:senderFee,recipientFee:recipientFee,totalFee:totalFee,totalCost:amount+totalFee,feePercent:totalFee/amount*100,observedAt:new Date(observed).toISOString(),expiresAt:expires===null?null:new Date(expires).toISOString(),expiryState:expired?"expired":expires===null?"unknown":"not-expired",eligible:!expired,comparisonKey:[currency,type,amount].join("|")};
  }
  function calculate(input){
    if(!input||typeof input!=="object")throw new Error("INPUT_REQUIRED");if(!Array.isArray(input.quotes)||input.quotes.length<2||input.quotes.length>3)throw new Error("QUOTE_COUNT");
    var asOf=date(input.asOf||new Date().toISOString(),"INVALID_AS_OF",true),quotes=input.quotes.map(function(row,index){return build(row,index,asOf);}),buckets={};
    quotes.forEach(function(row){if(row.eligible){(buckets[row.comparisonKey]||(buckets[row.comparisonKey]=[])).push(row);}});
    var groups=Object.keys(buckets).filter(function(key){return buckets[key].length>=2;}).map(function(key){var rows=buckets[key],lowest=Math.min.apply(null,rows.map(function(row){return row.totalFee;}));return {comparisonKey:key,currency:rows[0].currency,transactionType:rows[0].transactionType,amount:rows[0].amount,lowestTotalFee:lowest,quoteIndexes:rows.map(function(row){return row.index;})};});
    quotes=quotes.map(function(row){var group=groups.find(function(item){return item.comparisonKey===row.comparisonKey;}),comparable=!!group&&row.eligible;return Object.assign({},row,{comparable:comparable,lowestAmongEligibleComparable:comparable&&Math.abs(row.totalFee-group.lowestTotalFee)<=1e-9,differenceFromLowest:comparable?row.totalFee-group.lowestTotalFee:null});});
    return {asOf:new Date(asOf).toISOString(),methodology:"user-entered-mobile-money-quotes",groups:groups,quotes:quotes,hasEligibleComparison:groups.length>0,excludedCount:quotes.filter(function(row){return !row.comparable;}).length};
  }
  function validateCatalog(catalog){
    if(!catalog||catalog.schemaVersion!==1||!Array.isArray(catalog.providers)||!catalog.providers.length)throw new Error("INVALID_TARIFF_CATALOG");
    var ids={};
    catalog.providers.forEach(function(provider){
      if(!provider||typeof provider!=="object"||!provider.id||ids[provider.id]||!provider.country||!provider.provider||!provider.currency||!provider.lastVerified||!provider.source||!/^https:\/\//.test(provider.source.url||"")||!provider.actions||typeof provider.actions!=="object")throw new Error("INVALID_TARIFF_PROVIDER");
      ids[provider.id]=true;
      Object.keys(provider.actions).forEach(function(action){
        var bands=provider.actions[action];if(!Array.isArray(bands)||!bands.length)throw new Error("INVALID_TARIFF_ACTION");
        var previousMax=null;
        bands.forEach(function(band){
          if(!band||!Number.isFinite(band.min)||!Number.isFinite(band.max)||!Number.isFinite(band.fee)||band.min<0||band.max<band.min||band.fee<0||(previousMax!==null&&band.min<=previousMax))throw new Error("INVALID_TARIFF_BAND");
          if(band.feeComponents){
            var componentTotal=Object.keys(band.feeComponents).reduce(function(sum,key){var value=band.feeComponents[key];if(!Number.isFinite(value)||value<0)throw new Error("INVALID_TARIFF_COMPONENT");return sum+value;},0);
            if(Math.abs(componentTotal-band.fee)>1e-9)throw new Error("INVALID_TARIFF_COMPONENT_TOTAL");
          }
          previousMax=band.max;
        });
      });
    });
    return true;
  }
  function unavailable(provider,action,amount,reason){
    return {available:false,reason:reason,providerId:provider?provider.id:null,country:provider?provider.country:null,countryCode:provider?provider.countryCode:null,provider:provider?provider.provider:null,action:action||null,amount:amount,currency:provider?provider.currency:null,effectiveDate:provider?provider.effectiveDate:null,lastVerified:provider?provider.lastVerified:null,source:provider?provider.source:null,confidence:provider?provider.confidence:null,caveats:provider&&Array.isArray(provider.caveats)?provider.caveats.slice():[]};
  }
  function quoteTariff(catalog,input){
    validateCatalog(catalog);
    if(!input||typeof input!=="object")throw new Error("INPUT_REQUIRED");
    var amount=number(input.amount,"AMOUNT_REQUIRED",false),providerId=String(input.providerId||"").trim(),action=String(input.action||"").trim().toLowerCase();
    var provider=catalog.providers.find(function(item){return item.id===providerId;});
    if(!provider)return unavailable(null,action,amount,"PROVIDER_NOT_VERIFIED");
    if(!Object.prototype.hasOwnProperty.call(provider.actions,action))return unavailable(provider,action,amount,"ACTION_NOT_VERIFIED");
    var band=provider.actions[action].find(function(item){return amount>=item.min&&amount<=item.max;});
    if(!band)return unavailable(provider,action,amount,"AMOUNT_OUTSIDE_VERIFIED_BANDS");
    return {available:true,reason:null,providerId:provider.id,country:provider.country,countryCode:provider.countryCode,provider:provider.provider,action:action,amount:amount,currency:provider.currency,fee:band.fee,recipientReceives:amount,totalDebited:amount+band.fee,band:{min:band.min,max:band.max,label:band.min+"-"+band.max+" "+provider.currency},rule:band.rule||("Published "+action+" fee for this amount band"),feeComponents:band.feeComponents?Object.assign({},band.feeComponents):null,effectiveDate:provider.effectiveDate,lastVerified:provider.lastVerified,source:Object.assign({},provider.source),confidence:provider.confidence,caveats:Array.isArray(provider.caveats)?provider.caveats.slice():[],methodology:catalog.methodology};
  }
  return {calculate:calculate,quoteTariff:quoteTariff,validateCatalog:validateCatalog,MAX_AMOUNT:MAX_AMOUNT,FUTURE_TOLERANCE_MS:FUTURE_TOLERANCE_MS};
});
