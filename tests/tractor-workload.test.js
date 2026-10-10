'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const engine=require('../engines/src/tractor-calculator-engine.js'),ctx={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../data/agriculture/equipment-data.js'),'utf8'),ctx);
const data=ctx.EQUIPMENT_DATA;
const close=(a,b)=>assert(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-9);
let profiles=0,overReference=0;
for(const countryCode of Object.keys(data.countries))for(const equipmentKey of Object.keys(data.equipment))for(const passes of [1,2,3])for(const scale of [0.01,0.5,1,1.01,2,10])for(const doContract of [false,true]){
 const eq=data.equipment[equipmentKey],capacity=eq.areaCapacity_ha_per_day?.ploughing||2,reference=eq.operatingHours_per_year||600;
 const farmHa=reference*capacity/8/passes*scale;
 const input={countryCode,equipmentKey,price:1000000,farmHa,passes,years:5,contractHa:farmHa/2,contractRate:100,doContract,financeType:'loan',rate:12,term:7,downPct:20};
 const r=engine.calculate(input,data);assert(r.ok);
 const area=farmHa+(doContract?input.contractHa:0),cap=eq.areaCapacity_ha_per_day;
 const workload=equipmentKey==='combine_harvester'?area*passes/cap.harvesting*8:area*8/cap.ploughing+(passes>=2?area*8/cap.harrowing:0)+(passes>=3?area*8/cap.ridging:0);
 const billedHours=Math.max(50,workload),fuel=billedHours*eq.fuelConsumption_L_hr*data.hireRates[countryCode].diesel_per_litre;
 close(r.buy.workloadHoursPerYear,workload);close(r.buy.hoursPerYear,billedHours);close(r.buy.annualFuel,fuel);
 assert.equal(r.buy.exceedsReferenceAnnualHours,workload>reference);close(r.buy.excessWorkloadHours,Math.max(0,workload-reference));
 close(r.buy.annualOp,fuel+input.price*eq.annualMaintenance_pct/100);
 close(r.buy.totalCost,input.price+r.buy.annualOp*input.years-r.buy.residual);
 close(r.lease.totalCost,r.buy.totalCost+r.lease.interestWithinPeriod);
 close(r.buy.costPerHour,r.buy.totalCost/billedHours/input.years);
 if(workload>reference){overReference++;assert(r.buy.hoursPerYear>reference);}
 const doubled=engine.calculate({...input,farmHa:farmHa*2,contractHa:input.contractHa*2},data);assert(doubled.ok);
 if(workload>=50)close(doubled.buy.annualFuel,r.buy.annualFuel*2);
 profiles++;
}
console.log(JSON.stringify({profiles,overReference,fullWorkloadFuel:true,financeCostPropagation:true,disabledContractExcluded:true,referenceIsNotFuelCap:true,minimum50HourAssumptionRetained:true}));
