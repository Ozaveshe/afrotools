(function(root,factory){
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.ForexProfitStatementEngine=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";
  function number(value,min,max){
    if(value===""||value===null||typeof value==="undefined")throw new Error("VALUE_REQUIRED");
    var parsed=Number(value);
    if(!Number.isFinite(parsed)||parsed<min||parsed>max)throw new Error("INVALID_NUMBER");
    return parsed;
  }
  function label(value,code){
    var text=String(value||"").trim();
    if(!text||text.length>12||/[\r\n<>=+@]/.test(text))throw new Error(code);
    return text.toUpperCase();
  }
  function calculate(input){
    if(!input||typeof input!=="object")throw new Error("INPUT_REQUIRED");
    var base=label(input.baseCurrency,"BASE_REQUIRED");
    var quote=label(input.quoteCurrency,"QUOTE_REQUIRED");
    var reporting=label(input.reportingCurrencyUnit,"REPORTING_REQUIRED");
    var direction=input.direction;
    if(direction!=="buy"&&direction!=="sell")throw new Error("INVALID_DIRECTION");
    var entry=number(input.entryPrice,1e-12,1e12);
    var exit=number(input.exitPrice,1e-12,1e12);
    var units=number(input.baseUnits,1e-12,1e15);
    var pipSize=number(input.pipSize,1e-12,1e9);
    var conversion=number(input.quoteToReportingRate,1e-12,1e12);
    var costs=number(input.transactionCostsQuote,0,1e15);
    var signedMove=direction==="buy"?exit-entry:entry-exit;
    var grossQuote=signedMove*units;
    var netQuote=grossQuote-costs;
    var result={
      baseCurrency:base,quoteCurrency:quote,reportingCurrencyUnit:reporting,direction:direction,
      entryPrice:entry,exitPrice:exit,baseUnits:units,pipSize:pipSize,
      quoteToReportingRate:conversion,transactionCostsQuote:costs,
      signedPriceMoveQuotePerBase:signedMove,signedPips:signedMove/pipSize,
      pipValueQuote:pipSize*units,grossPnlQuote:grossQuote,netPnlQuote:netQuote,
      grossPnlReporting:grossQuote*conversion,netPnlReporting:netQuote*conversion,
      transactionCostsReporting:costs*conversion,openingNotionalQuote:entry*units
    };
    Object.keys(result).forEach(function(key){
      if(typeof result[key]==="number"&&!Number.isFinite(result[key]))throw new Error("UNBOUNDED_RESULT");
    });
    return result;
  }
  return {calculate:calculate};
});
