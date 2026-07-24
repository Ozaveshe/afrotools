(function(root,factory){
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.PaystackFeePlanner=api}
})(typeof window!=="undefined"?window:null,function(){
  "use strict";

  var VERSION="paystack-fee-planner-2026-07-23";
  var SOURCE_UPDATED_AT="2026-05-20";
  var REVIEWED_AT="2026-07-23";
  var REVIEW_DUE_AT="2026-10-21";
  var MAX_AMOUNT=1000000000000;
  var MAX_COUNT=1000000;
  var SOURCE_URL="https://support.paystack.com/en/articles/2130306";
  var COUNTRIES={
    NG:{currency:"NGN",name:"Nigeria",pricingUrl:"https://paystack.com/pricing",channels:{
      local:{rate:.015,fixed:100,waiveFixedBelow:2500,cap:2000,label:"Local channels"},
      international:{rate:.039,fixed:100,label:"International Visa, Mastercard or Verve"},
      amex:{rate:.045,fixed:0,label:"International American Express"}
    }},
    GH:{currency:"GHS",name:"Ghana",pricingUrl:"https://paystack.com/gh/pricing",channels:{
      local:{rate:.0195,fixed:0,label:"Local card, mobile money or bank transfer"},
      international:{rate:.0195,fixed:0,label:"International card"}
    }},
    KE:{currency:"KES",name:"Kenya",pricingUrl:"https://paystack.com/ke/pricing",channels:{
      local:{rate:.029,fixed:0,label:"Local card"},
      mpesa:{rate:.015,fixed:0,label:"M-PESA"},
      international:{rate:.038,fixed:0,label:"International card or Apple Pay"}
    }},
    ZA:{currency:"ZAR",name:"South Africa",pricingUrl:"https://paystack.com/za/pricing",taxRate:.15,channels:{
      local:{rate:.029,fixed:1,label:"Local card"},
      eft:{rate:.02,fixed:0,label:"EFT"},
      international:{rate:.031,fixed:1,label:"International card"}
    }}
  };

  function finite(value){var n=Number(value);return Number.isFinite(n)?n:null}
  function round(value){return Math.round((value+Number.EPSILON)*100)/100}
  function isCurrencyAmount(value){return Math.abs(value*100-Math.round(value*100))<1e-7}
  function freshness(now){
    var date=now instanceof Date?now:new Date(now||Date.now());
    var due=new Date(REVIEW_DUE_AT+"T23:59:59Z");
    return {fresh:date.getTime()<=due.getTime(),reviewedAt:REVIEWED_AT,sourceUpdatedAt:SOURCE_UPDATED_AT,reviewDueAt:REVIEW_DUE_AT,effectiveDate:null};
  }
  function validate(input,now){
    if(!freshness(now).fresh)return {valid:false,code:"stale"};
    var country=COUNTRIES[input&&input.country];
    if(!country)return {valid:false,code:"country"};
    var rule=country.channels[input&&input.channel];
    if(!rule)return {valid:false,code:"channel"};
    var amount=finite(input.amount),count=input.count===""||input.count==null?1:finite(input.count),target=input.targetNet===""||input.targetNet==null?0:finite(input.targetNet);
    if(amount==null||amount<=0||amount>MAX_AMOUNT||!isCurrencyAmount(amount))return {valid:false,code:"amount"};
    if(count==null||count<1||count>MAX_COUNT||Math.floor(count)!==count)return {valid:false,code:"count"};
    if(target==null||target<0||target>MAX_AMOUNT||!isCurrencyAmount(target))return {valid:false,code:"target"};
    return {valid:true,country:country,rule:rule,amount:amount,count:count,targetNet:target};
  }
  function feeFor(amount,country,rule){
    var fixed=rule.fixed||0;
    var fixedWaived=Boolean(rule.waiveFixedBelow&&amount<rule.waiveFixedBelow);
    if(fixedWaived)fixed=0;
    var uncapped=amount*rule.rate+fixed;
    var baseFee=rule.cap?Math.min(uncapped,rule.cap):uncapped;
    var capped=Boolean(rule.cap&&uncapped>rule.cap);
    var tax=baseFee*(country.taxRate||0);
    return {percentageFee:round(amount*rule.rate),fixedFee:round(fixed),fixedWaived:fixedWaived,uncappedFee:round(uncapped),baseFee:round(baseFee),tax:round(tax),totalFee:round(baseFee+tax),capped:capped};
  }
  function grossUp(target,country,rule){
    if(!target)return null;
    var targetCents=Math.round(target*100),maxCents=Math.floor(MAX_AMOUNT*100);
    function netCents(chargeCents){var fees=feeFor(chargeCents/100,country,rule);return chargeCents-Math.round(fees.totalFee*100)}
    var first=Math.max(1,targetCents),segments=[];
    if(rule.waiveFixedBelow){
      var boundary=Math.round(rule.waiveFixedBelow*100);
      if(first<=boundary-1)segments.push([first,boundary-1]);
      segments.push([Math.max(first,boundary),maxCents]);
    }else segments.push([first,maxCents]);
    var candidate=null;
    segments.forEach(function(segment){
      var low=segment[0],high=segment[1];
      if(low>high||netCents(high)<targetCents)return;
      while(low<high){var mid=Math.floor((low+high)/2);if(netCents(mid)>=targetCents)high=mid;else low=mid+1}
      if(candidate==null||low<candidate)candidate=low;
    });
    if(candidate==null)return null;
    var charge=candidate/100,fees=feeFor(charge,country,rule);
    return {charge:charge,fee:fees.totalFee,net:round(charge-fees.totalFee),previousCentNet:candidate>1?round((candidate-1)/100-feeFor((candidate-1)/100,country,rule).totalFee):null,method:"minimum-currency-cent"};
  }
  function calculate(input,now){
    var valid=validate(input,now);
    if(!valid.valid)return {ok:false,error:valid.code,freshness:freshness(now)};
    var fee=feeFor(valid.amount,valid.country,valid.rule);
    var per={gross:round(valid.amount),fee:fee.totalFee,tax:fee.tax,net:round(valid.amount-fee.totalFee),effectiveRate:round(fee.totalFee/valid.amount*100)};
    return {ok:true,version:VERSION,country:input.country,currency:valid.country.currency,channel:input.channel,rule:{
      rate:valid.rule.rate,fixed:valid.rule.fixed||0,waiveFixedBelow:valid.rule.waiveFixedBelow||null,cap:valid.rule.cap||null,taxRate:valid.country.taxRate||0
    },breakdown:fee,perTransaction:per,monthly:{count:valid.count,gross:round(per.gross*valid.count),fee:round(per.fee*valid.count),tax:round(per.tax*valid.count),net:round(per.net*valid.count)},grossUp:grossUp(valid.targetNet,valid.country,valid.rule),freshness:freshness(now),source:{url:SOURCE_URL,pricingUrl:valid.country.pricingUrl}};
  }
  return {VERSION:VERSION,SOURCE_URL:SOURCE_URL,SOURCE_UPDATED_AT:SOURCE_UPDATED_AT,REVIEWED_AT:REVIEWED_AT,REVIEW_DUE_AT:REVIEW_DUE_AT,MAX_AMOUNT:MAX_AMOUNT,MAX_COUNT:MAX_COUNT,COUNTRIES:COUNTRIES,freshness:freshness,validate:validate,feeFor:feeFor,calculate:calculate};
});
