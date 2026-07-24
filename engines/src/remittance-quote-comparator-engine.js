(function(root,factory){
  var api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  root.RemittanceQuoteComparatorEngine=api;
})(typeof window!=="undefined"?window:globalThis,function(){
  "use strict";

  var MAX_AMOUNT=1e15;
  var FUTURE_TOLERANCE_MS=5*60*1000;

  function requiredText(value,code,max,pattern){
    var result=String(value==null?"":value).trim();
    if(!result||result.length>max||/[\u0000-\u001f<>]/.test(result)||(pattern&&!pattern.test(result))){
      throw new Error(code);
    }
    return result;
  }

  function optionalText(value,code,max,allowed){
    var result=String(value==null?"":value).trim();
    if(!result)return "";
    if(result.length>max||/[\u0000-\u001f<>]/.test(result)||(allowed&&allowed.indexOf(result)===-1)){
      throw new Error(code);
    }
    return result;
  }

  function requiredNumber(value,code){
    if(value===""||value===null||typeof value==="undefined")throw new Error(code);
    var parsed=Number(value);
    if(!Number.isFinite(parsed)||parsed<=0||parsed>MAX_AMOUNT)throw new Error(code);
    return parsed;
  }

  function optionalNumber(value,code){
    if(value===""||value===null||typeof value==="undefined")return null;
    var parsed=Number(value);
    if(!Number.isFinite(parsed)||parsed<0||parsed>MAX_AMOUNT)throw new Error(code);
    return parsed;
  }

  function dateValue(value,code,required){
    var raw=String(value==null?"":value).trim();
    if(!raw&&!required)return null;
    if(!raw)throw new Error(code);
    var timestamp=Date.parse(raw);
    if(!Number.isFinite(timestamp))throw new Error(code);
    return timestamp;
  }

  function normalizeCurrency(value,code){
    return requiredText(value,code,8,/^[A-Za-z0-9]{2,8}$/).toUpperCase();
  }

  function comparisonKey(row){
    return row.sendCurrency+"|"+row.receiveCurrency+"|"+String(row.totalDebit);
  }

  function buildQuote(row,index,asOfMs){
    if(!row||typeof row!=="object")throw new Error("QUOTE_REQUIRED");
    var observedMs=dateValue(row.observedAt,"OBSERVED_AT_REQUIRED",true);
    if(observedMs>asOfMs+FUTURE_TOLERANCE_MS)throw new Error("OBSERVED_AT_FUTURE");
    var expiresMs=dateValue(row.expiresAt,"INVALID_EXPIRY",false);
    if(expiresMs!==null&&expiresMs<observedMs)throw new Error("EXPIRY_BEFORE_OBSERVED");
    var totalDebit=requiredNumber(row.totalDebit,"TOTAL_DEBIT_REQUIRED");
    var recipientAmount=requiredNumber(row.recipientAmount,"RECIPIENT_AMOUNT_REQUIRED");
    var statedFee=optionalNumber(row.statedFee,"INVALID_STATED_FEE");
    if(statedFee!==null&&statedFee>totalDebit)throw new Error("FEE_EXCEEDS_DEBIT");
    var deliveryMinutes=optionalNumber(row.deliveryMinutes,"INVALID_DELIVERY");
    var expired=expiresMs!==null&&expiresMs<=asOfMs;
    var quote={
      index:index,
      label:requiredText(row.label,"LABEL_REQUIRED",48),
      sendCurrency:normalizeCurrency(row.sendCurrency,"SEND_CURRENCY_REQUIRED"),
      receiveCurrency:normalizeCurrency(row.receiveCurrency,"RECEIVE_CURRENCY_REQUIRED"),
      totalDebit:totalDebit,
      recipientAmount:recipientAmount,
      statedFee:statedFee,
      payoutMethod:optionalText(row.payoutMethod,"INVALID_PAYOUT_METHOD",24,["bank","mobile-wallet","cash","crypto-wallet","other"]),
      deliveryMinutes:deliveryMinutes,
      observedAt:new Date(observedMs).toISOString(),
      expiresAt:expiresMs===null?null:new Date(expiresMs).toISOString(),
      expiryState:expired?"expired":expiresMs===null?"unknown":"not-expired",
      eligible:!expired,
      effectiveRate:recipientAmount/totalDebit
    };
    quote.comparisonKey=comparisonKey(quote);
    return quote;
  }

  function calculate(input){
    if(!input||typeof input!=="object")throw new Error("INPUT_REQUIRED");
    if(!Array.isArray(input.quotes)||input.quotes.length<2||input.quotes.length>3)throw new Error("QUOTE_COUNT");
    var asOfMs=dateValue(input.asOf||new Date().toISOString(),"INVALID_AS_OF",true);
    var quotes=input.quotes.map(function(row,index){return buildQuote(row,index,asOfMs);});
    var buckets={};
    quotes.forEach(function(row){
      if(!row.eligible)return;
      if(!buckets[row.comparisonKey])buckets[row.comparisonKey]=[];
      buckets[row.comparisonKey].push(row);
    });
    var groups=Object.keys(buckets).filter(function(key){return buckets[key].length>=2;}).map(function(key){
      var rows=buckets[key];
      var highest=Math.max.apply(null,rows.map(function(row){return row.recipientAmount;}));
      return {
        comparisonKey:key,
        sendCurrency:rows[0].sendCurrency,
        receiveCurrency:rows[0].receiveCurrency,
        totalDebit:rows[0].totalDebit,
        highestRecipientAmount:highest,
        quoteIndexes:rows.map(function(row){return row.index;})
      };
    });
    quotes=quotes.map(function(row){
      var group=groups.find(function(candidate){return candidate.comparisonKey===row.comparisonKey;});
      var comparable=!!group&&row.eligible;
      return Object.assign({},row,{
        comparable:comparable,
        highestAmongEligibleComparable:comparable&&Math.abs(row.recipientAmount-group.highestRecipientAmount)<=1e-9,
        differenceFromHighestRecipient:comparable?group.highestRecipientAmount-row.recipientAmount:null
      });
    });
    return {
      asOf:new Date(asOfMs).toISOString(),
      methodology:"user-entered-remittance-quotes",
      groups:groups,
      quotes:quotes,
      hasEligibleComparison:groups.length>0,
      excludedCount:quotes.filter(function(row){return !row.comparable;}).length
    };
  }

  return {calculate:calculate,MAX_AMOUNT:MAX_AMOUNT,FUTURE_TOLERANCE_MS:FUTURE_TOLERANCE_MS};
});
