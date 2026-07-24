(function(root,factory){
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.P2PQuoteComparatorEngine=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  function number(value,min,max){
    if(value===""||value===null||typeof value==="undefined")throw new Error("VALUE_REQUIRED");
    var parsed=Number(value);
    if(!Number.isFinite(parsed)||parsed<min||parsed>max)throw new Error("INVALID_NUMBER");
    return parsed;
  }
  function text(value,code,max){
    var result=String(value||"").trim();
    if(!result||result.length>max||/[\u0000-\u001f<>]/.test(result))throw new Error(code);
    return result;
  }
  function optionalText(value,code,max){
    var result=String(value||"").trim();
    if(!result)return "";
    if(result.length>max||/[\u0000-\u001f<>]/.test(result))throw new Error(code);
    return result;
  }
  function quote(row,side,amount,fiat,index){
    if(!row||typeof row!=="object")throw new Error("QUOTE_REQUIRED");
    var label=text(row.label,"QUOTE_LABEL_REQUIRED",48);
    var checkedAt=text(row.checkedAt,"QUOTE_TIME_REQUIRED",40);
    if(Number.isNaN(Date.parse(checkedAt)))throw new Error("INVALID_QUOTE_TIME");
    var price=number(row.priceFiatPerAsset,1e-12,1e15);
    var percentCost=number(row.percentCost,0,100);
    var fixedCost=number(row.fixedCostFiat,0,1e15);
    var gross=amount*price;
    var variableCost=gross*(percentCost/100);
    var totalCosts=variableCost+fixedCost;
    var settlement=side==="buy"?gross+totalCosts:gross-totalCosts;
    if(side==="sell"&&settlement<0)throw new Error("COSTS_EXCEED_PROCEEDS");
    var effectivePrice=settlement/amount;
    [gross,variableCost,totalCosts,settlement,effectivePrice].forEach(function(value){
      if(!Number.isFinite(value))throw new Error("UNBOUNDED_RESULT");
    });
    return {
      index:index,label:label,reference:optionalText(row.reference,"INVALID_REFERENCE",120),
      checkedAt:new Date(checkedAt).toISOString(),priceFiatPerAsset:price,
      percentCost:percentCost,fixedCostFiat:fixedCost,grossFiat:gross,
      variableCostFiat:variableCost,totalCostsFiat:totalCosts,
      settlementFiat:settlement,effectivePriceFiatPerAsset:effectivePrice,fiat:fiat
    };
  }
  function calculate(input){
    if(!input||typeof input!=="object")throw new Error("INPUT_REQUIRED");
    var side=input.side;
    if(side!=="buy"&&side!=="sell")throw new Error("INVALID_SIDE");
    var asset=text(input.assetLabel,"ASSET_REQUIRED",16).toUpperCase();
    var fiat=text(input.fiatCode,"FIAT_REQUIRED",16).toUpperCase();
    var amount=number(input.assetAmount,1e-12,1e15);
    if(!Array.isArray(input.quotes)||input.quotes.length<2||input.quotes.length>3)throw new Error("QUOTE_COUNT");
    var quotes=input.quotes.map(function(row,index){return quote(row,side,amount,fiat,index);});
    var target=side==="buy"
      ?Math.min.apply(null,quotes.map(function(row){return row.settlementFiat;}))
      :Math.max.apply(null,quotes.map(function(row){return row.settlementFiat;}));
    var comparison=quotes.map(function(row){
      var gap=side==="buy"?row.settlementFiat-target:target-row.settlementFiat;
      return Object.assign({},row,{differenceFromObservedTargetFiat:gap,isObservedTarget:Math.abs(gap)<=1e-9});
    });
    return {
      side:side,assetLabel:asset,fiatCode:fiat,assetAmount:amount,
      observation:side==="buy"?"lowest-entered-total":"highest-entered-proceeds",
      observedTargetFiat:target,quotes:comparison
    };
  }
  return {calculate:calculate};
});
