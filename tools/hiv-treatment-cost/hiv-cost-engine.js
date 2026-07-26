(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.HivCostEngine=api})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
const PERIODS=Object.freeze({monthly:{label:'monthly',factor:12},quarterly:{label:'quarterly',factor:4},annual:{label:'annual',factor:1},once:{label:'once in the next 12 months',factor:1}});
const money=(v,name)=>{const x=Number(v);if(!Number.isFinite(x)||x<0||x>1e9)throw new Error(`${name} must be between 0 and 1,000,000,000.`);return x};
const period=(v,name)=>{const key=v||'monthly';if(!PERIODS[key])throw new Error(`Choose a supported cadence for ${name}.`);return key};
const rounded=(value,places)=>{const factor=10**places;return Math.round((value+Number.EPSILON)*factor)/factor};
function line(i,key,name,places){const amount=money(i[key],`${name} amount`),cadence=period(i[`${key}Period`],name),annual=rounded(amount*PERIODS[cadence].factor,places);return Object.freeze({key,name,amount,cadence,cadenceLabel:PERIODS[cadence].label,annual})}
function calculate(input){
const i=input||{},currency=String(i.currency||'').trim();if(!/^[A-Za-z0-9$€£¥₦₵₨₹R._ -]{1,8}$/u.test(currency))throw new Error('Use a short currency code, symbol or label without personal text.');
const decimalPlaces=i.decimalPlaces===undefined?2:Number(i.decimalPlaces);if(![0,2,3].includes(decimalPlaces))throw new Error('Choose 0, 2 or 3 decimal places.');
const breakdown=[line(i,'clinic','Clinic/consultation',decimalPlaces),line(i,'labs','Laboratory/monitoring',decimalPlaces),line(i,'transport','Transport/access',decimalPlaces),line(i,'other','Other care',decimalPlaces)];
const supportLine=line(i,'support','Confirmed assistance',decimalPlaces),grossAnnual=rounded(breakdown.reduce((sum,item)=>sum+item.annual,0),decimalPlaces),supportAnnual=supportLine.annual;
if(supportAnnual>grossAnnual)throw new Error('Annualised confirmed assistance cannot exceed the entered annualised gross costs.');
const netAnnual=rounded(grossAnnual-supportAnnual,decimalPlaces),grossMonthly=rounded(grossAnnual/12,decimalPlaces),supportMonthly=rounded(supportAnnual/12,decimalPlaces),netMonthly=rounded(netAnnual/12,decimalPlaces);
return Object.freeze({currency,decimalPlaces,breakdown:Object.freeze(breakdown),supportLine,grossAnnual,supportAnnual,netAnnual,grossMonthly,supportMonthly,netMonthly,clinic:breakdown[0].amount,labs:breakdown[1].amount,transport:breakdown[2].amount,other:breakdown[3].amount,support:supportLine.amount,warning:'Budgeting arithmetic only. Do not change, delay or interrupt HIV care or medicines because of this worksheet; contact the prescribing clinic or qualified health service for clinical or access support.'});
}
return Object.freeze({calculate,PERIODS})});
