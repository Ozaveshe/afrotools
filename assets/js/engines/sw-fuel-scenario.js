(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.swFuelScenario=api;}})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function calculate(input){
 const types={Petrol:'L',Diesel:'L',LPG:'kg'};if(!types[input.fuelType]||!/^[A-Z]{3}$/.test(input.currency||''))throw Error('selection');
 const values={};for(const key of ['currentPrice','previousPrice','litresMonth','officialLag']){const raw=input[key];if(raw===null||raw===undefined||String(raw).trim()===''||!Number.isFinite(Number(raw))||Number(raw)<0)throw Error(key);values[key]=Number(raw);}
 if(!Number.isInteger(values.officialLag))throw Error('officialLag');
 const total=values.currentPrice*values.litresMonth,change=(values.currentPrice-values.previousPrice)*values.litresMonth;if(!Number.isFinite(total)||!Number.isFinite(change))throw Error('overflow');
 return {inputs:Object.assign({},input,values),unit:types[input.fuelType],monthlyCost:total,unitChange:values.currentPrice-values.previousPrice,monthlyChange:change};
}
return {calculate};});
