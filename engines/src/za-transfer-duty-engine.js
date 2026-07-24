(function(global){
  "use strict";
  var RULES=Object.freeze({
    scheme:"South Africa transfer duty 2027",
    effectiveFrom:"2026-04-01",
    verifiedThrough:"2026-07-23",
    source:"SARS Transfer Duty rates, 2027 (effective 1 April 2026)",
    brackets:Object.freeze([
      Object.freeze({upper:1210000,rate:0,base:0,offset:0}),
      Object.freeze({upper:1663800,rate:0.03,base:0,offset:1210000}),
      Object.freeze({upper:2329300,rate:0.06,base:13614,offset:1663800}),
      Object.freeze({upper:2994800,rate:0.08,base:53544,offset:2329300}),
      Object.freeze({upper:13310000,rate:0.11,base:106784,offset:2994800}),
      Object.freeze({upper:Infinity,rate:0.13,base:1241456,offset:13310000})
    ])
  });
  function number(value){if(value===""||value===null||value===undefined)return null;return Number(value)}
  function round(value){return Math.round((value+Number.EPSILON)*100)/100}
  function validMoney(value,allowZero){return Number.isFinite(value)&&(allowZero?value>=0:value>0)&&value<=1e15}
  function dutyFor(value){var bracket=RULES.brackets[RULES.brackets.length-1];for(var i=0;i<RULES.brackets.length;i++){if(value<=RULES.brackets[i].upper){bracket=RULES.brackets[i];break}}return{amount:round(bracket.base+Math.max(0,value-bracket.offset)*bracket.rate),bracket:bracket}}
  function calculate(raw){
    raw=raw||{};var consideration=number(raw.consideration),fairValue=number(raw.fairValue),otherConsideration=number(raw.otherConsideration),agreementDate=String(raw.agreementDate||""),vatStatus=String(raw.vatStatus||"not-vat");
    if(!validMoney(consideration,false))return{ok:false,error:"invalid_consideration"};
    if(fairValue===null)fairValue=consideration;if(!validMoney(fairValue,false))return{ok:false,error:"invalid_fair_value"};
    if(otherConsideration===null)otherConsideration=0;if(!validMoney(otherConsideration,true))return{ok:false,error:"invalid_other"};
    if(!/^\d{4}-\d{2}-\d{2}$/.test(agreementDate)||agreementDate<RULES.effectiveFrom||agreementDate>RULES.verifiedThrough)return{ok:false,error:"unsupported_date"};
    if(vatStatus!=="not-vat"&&vatStatus!=="vat")return{ok:false,error:"invalid_vat_status"};
    var totalConsideration=consideration+otherConsideration,taxableBasis=Math.max(totalConsideration,fairValue),calculation=dutyFor(taxableBasis),duty=vatStatus==="vat"?0:calculation.amount;
    return{ok:true,agreementDate:agreementDate,consideration:round(consideration),fairValue:round(fairValue),otherConsideration:round(otherConsideration),totalConsideration:round(totalConsideration),taxableBasis:round(taxableBasis),vatStatus:vatStatus,duty:round(duty),effectiveRate:taxableBasis?duty/taxableBasis:0,totalCashIncludingDuty:round(consideration+duty),bracket:{upper:Number.isFinite(calculation.bracket.upper)?calculation.bracket.upper:null,rate:calculation.bracket.rate,base:calculation.bracket.base,offset:calculation.bracket.offset},rules:RULES,boundary:vatStatus==="vat"?"No transfer duty shown because the user marked the acquisition as subject to VAT. VAT itself is not calculated.":"Transfer duty only. Conveyancing, deeds, bond, valuation, municipal, VAT and finance costs are excluded."}
  }
  var api={RULES:RULES,calculate:calculate,dutyFor:dutyFor};if(typeof module!=="undefined"&&module.exports)module.exports=api;global.ZA_TRANSFER_DUTY=api;
})(typeof globalThis!=="undefined"?globalThis:this);
