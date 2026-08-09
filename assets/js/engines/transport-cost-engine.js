(function(root,factory){var api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.TransportCostEngine=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  function num(value){value=Number(value);return Number.isFinite(value)?value:NaN;}
  function positive(value){value=num(value);return value>0?value:NaN;}
  function fleetFuel(input){
    var count=positive(input.count),dailyKm=positive(input.dailyKm),consumption=positive(input.consumption),price=positive(input.price),opDays=positive(input.opDays);
    if(![count,dailyKm,consumption,price,opDays].every(Number.isFinite))return{error:"invalid-input"};
    var litresPerVehicleDay=dailyKm*consumption/100,costPerVehicleDay=litresPerVehicleDay*price,fleetDay=costPerVehicleDay*count,fleetMonth=fleetDay*opDays;
    return{count:count,dailyKm:dailyKm,consumption:consumption,price:price,opDays:opDays,litresPerVehicleDay:litresPerVehicleDay,costPerVehicleDay:costPerVehicleDay,fleetDay:fleetDay,fleetWeek:fleetDay*6,fleetMonth:fleetMonth,fleetAnnual:fleetMonth*12,saving10pct:fleetMonth*12*.10};
  }
  function operatingCost(input){
    var value=num(input.value),km=num(input.km),consumption=num(input.consumption),fuelPrice=num(input.fuelPrice),insurance=num(input.insurance),parkingMonth=num(input.parkingMonth),tolls=num(input.tolls),type=String(input.type||"sedan");
    if(![value,km,consumption,fuelPrice,insurance,parkingMonth,tolls].every(function(v){return Number.isFinite(v)&&v>=0;})||(value===0&&km===0))return{error:"invalid-input"};
    var fuel=(km/100)*consumption*fuelPrice,maintenance=value*(type==="motorcycle"?.04:.06),registration=value*.015,depreciation=value*(type==="suv"?.20:.22),parking=parkingMonth*12,total=fuel+insurance+maintenance+registration+parking+tolls+depreciation;
    return{fuel:fuel,insurance:insurance,maintenance:maintenance,registration:registration,parking:parking,tolls:tolls,depreciation:depreciation,total:total,monthly:total/12,perKm:km>0?total/km:0,assumptions:{maintenanceRate:type==="motorcycle"?.04:.06,registrationRate:.015,depreciationRate:type==="suv"?.20:.22}};
  }
  function truckLoad(input){
    var capacity=positive(input.capacity),load=positive(input.load),distance=positive(input.distance),cost=num(input.cost);
    if(![capacity,load,distance,cost].every(Number.isFinite)||cost<0)return{error:"invalid-input"};
    if(load>capacity)return{error:"load-exceeds-entered-capacity"};
    var efficiency=load/capacity*100,tonneKm=load*distance,costPerTonneKm=cost>0?cost/tonneKm:0,costPerTonne=cost>0?cost/load:0,emptyCapacity=capacity-load,potentialSaving=cost>0?emptyCapacity/capacity*cost:0;
    return{capacity:capacity,load:load,distance:distance,cost:cost,efficiency:efficiency,tonneKm:tonneKm,costPerTonneKm:costPerTonneKm,costPerTonne:costPerTonne,emptyCapacity:emptyCapacity,potentialSaving:potentialSaving,efficiencyBand:efficiency>=85?"high":efficiency>=65?"medium":"low"};
  }
  return{fleetFuel:fleetFuel,operatingCost:operatingCost,truckLoad:truckLoad};
});
