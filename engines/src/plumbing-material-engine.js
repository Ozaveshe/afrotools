(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.PlumbingMaterialEngine = engine;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var RATES={
    NG:{sym:'₦',upvc:450,ppr:850,copper:2200,galv:700,fitting_mult:0.35,tank_1000:45000,labour_day:15000},
    KE:{sym:'KES',upvc:180,ppr:320,copper:900,galv:280,fitting_mult:0.35,tank_1000:18000,labour_day:3000},
    ZA:{sym:'ZAR',upvc:55,ppr:110,copper:350,galv:95,fitting_mult:0.40,tank_1000:5500,labour_day:800},
    GH:{sym:'GHS',upvc:35,ppr:65,copper:200,galv:55,fitting_mult:0.35,tank_1000:3500,labour_day:600},
    EG:{sym:'EGP',upvc:40,ppr:75,copper:250,galv:65,fitting_mult:0.35,tank_1000:4000,labour_day:700},
    ET:{sym:'ETB',upvc:90,ppr:160,copper:500,galv:130,fitting_mult:0.35,tank_1000:9000,labour_day:1500},
    TZ:{sym:'TZS',upvc:3500,ppr:6500,copper:20000,galv:5500,fitting_mult:0.35,tank_1000:350000,labour_day:60000},
    UG:{sym:'UGX',upvc:5000,ppr:9000,copper:28000,galv:7500,fitting_mult:0.35,tank_1000:480000,labour_day:80000},
    RW:{sym:'RWF',upvc:800,ppr:1500,copper:4800,galv:1200,fitting_mult:0.35,tank_1000:80000,labour_day:15000},
    MA:{sym:'MAD',upvc:20,ppr:38,copper:120,galv:32,fitting_mult:0.40,tank_1000:2200,labour_day:400}
  };
  var BUILDINGS={'1bed':{pipeM:80,joints:40},'2bed':{pipeM:130,joints:65},'3bed':{pipeM:180,joints:90},'4bed':{pipeM:240,joints:120},duplex:{pipeM:350,joints:175},commercial:{pipeM:200,joints:100}};
  function positive(value){value=Number(value);return Number.isFinite(value)&&value>0?value:null;}
  function calculate(input){
    input=input||{};
    var rate=RATES[input.country],building=BUILDINGS[input.buildingType],bathrooms=positive(input.bathrooms),tankSize=positive(input.tankSize);
    if(!rate||!building||bathrooms===null||tankSize===null||!Object.prototype.hasOwnProperty.call(rate,input.pipeType)) return {ok:false,error:'invalid-input'};
    var pipeMetres=building.pipeM+bathrooms*20,joints=building.joints+bathrooms*10,pipeRate=rate[input.pipeType];
    var pipeCost=pipeMetres*pipeRate,fittingCost=pipeCost*rate.fitting_mult,sanitarywareCost=bathrooms*pipeRate*80;
    var tankCost=input.includeTank?rate.tank_1000*(tankSize/1000):0,boreholeConnectionCost=pipeRate*30;
    var materialTotal=pipeCost+fittingCost+sanitarywareCost+tankCost+boreholeConnectionCost;
    var labourDays=bathrooms*3+(input.buildingType==='duplex'?8:input.buildingType==='commercial'?10:4);
    var labourCost=input.includeLabour?labourDays*rate.labour_day:0;
    var bom=[
      {kind:'pipe',pipeType:input.pipeType,qty:pipeMetres,unit:'metres',unitCost:pipeRate,total:pipeCost},
      {kind:'fittings',qty:joints,unit:'pcs',unitCost:Math.round(fittingCost/joints),total:fittingCost},
      {kind:'sanitaryware',qty:bathrooms,unit:'sets',unitCost:Math.round(sanitarywareCost/bathrooms),total:sanitarywareCost},
      {kind:'connection',qty:30,unit:'metres',unitCost:pipeRate,total:boreholeConnectionCost}
    ];
    if(input.includeTank) bom.push({kind:'tank',tankSize:tankSize,qty:1,unit:'unit',unitCost:tankCost,total:tankCost});
    if(input.includeLabour) bom.push({kind:'labour',labourDays:labourDays,qty:labourDays,unit:'days',unitCost:rate.labour_day,total:labourCost});
    return {ok:true,country:input.country,symbol:rate.sym,pipeType:input.pipeType,bathrooms:bathrooms,tankSize:tankSize,
      includeTank:!!input.includeTank,includeLabour:!!input.includeLabour,pipeMetres:pipeMetres,joints:joints,pipeRate:pipeRate,
      pipeCost:pipeCost,fittingCost:fittingCost,sanitarywareCost:sanitarywareCost,tankCost:tankCost,
      boreholeConnectionCost:boreholeConnectionCost,materialTotal:materialTotal,labourDays:labourDays,
      labourCost:labourCost,total:materialTotal+labourCost,perBathroom:(materialTotal+labourCost)/bathrooms,bom:bom};
  }
  return {rates:RATES,buildingSizes:BUILDINGS,calculate:calculate};
}));
