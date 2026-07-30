(function(root,factory){
  'use strict';
  var engine=factory();
  if(typeof module==='object'&&module.exports) module.exports=engine;
  root.AfroTools=root.AfroTools||{};
  root.AfroTools.SiteClearingEngine=engine;
}(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var RATES={
    NG:{sym:'₦',veg_light:500,veg_medium:1200,veg_dense:2800,tree_each:8000,topsoil_m3:3500,demo_m2:8000,waste_haul_m3:2500,waste_chip_m3:800},
    KE:{sym:'KES',veg_light:200,veg_medium:500,veg_dense:1100,tree_each:3200,topsoil_m3:1400,demo_m2:3200,waste_haul_m3:1000,waste_chip_m3:320},
    ZA:{sym:'ZAR',veg_light:55,veg_medium:140,veg_dense:320,tree_each:950,topsoil_m3:420,demo_m2:950,waste_haul_m3:280,waste_chip_m3:90},
    GH:{sym:'GHS',veg_light:45,veg_medium:110,veg_dense:260,tree_each:750,topsoil_m3:320,demo_m2:750,waste_haul_m3:220,waste_chip_m3:70},
    EG:{sym:'EGP',veg_light:50,veg_medium:120,veg_dense:280,tree_each:800,topsoil_m3:350,demo_m2:800,waste_haul_m3:240,waste_chip_m3:75},
    ET:{sym:'ETB',veg_light:120,veg_medium:290,veg_dense:670,tree_each:2000,topsoil_m3:850,demo_m2:2000,waste_haul_m3:580,waste_chip_m3:185},
    TZ:{sym:'TZS',veg_light:4500,veg_medium:11000,veg_dense:25000,tree_each:75000,topsoil_m3:32000,demo_m2:75000,waste_haul_m3:22000,waste_chip_m3:7000},
    UG:{sym:'UGX',veg_light:5800,veg_medium:14000,veg_dense:32000,tree_each:95000,topsoil_m3:42000,demo_m2:95000,waste_haul_m3:28000,waste_chip_m3:9000},
    RW:{sym:'RWF',veg_light:950,veg_medium:2300,veg_dense:5400,tree_each:16000,topsoil_m3:6800,demo_m2:16000,waste_haul_m3:4700,waste_chip_m3:1500},
    MA:{sym:'MAD',veg_light:22,veg_medium:55,veg_dense:125,tree_each:380,topsoil_m3:165,demo_m2:380,waste_haul_m3:110,waste_chip_m3:35}
  };
  var TERRAIN={flat:1,gentle:1.25,steep:1.65},DEMOLITION={none:0,small:30,medium:150,large:350};
  function calculate(input){
    input=input||{};
    var rate=RATES[input.country],area=Number(input.area),trees=Number(input.trees);
    if(!rate||!Number.isFinite(area)||area<=0||!Number.isFinite(trees)||trees<0||!TERRAIN[input.terrain]||
      !['cleared','light','medium','dense'].includes(input.vegetation)||!Object.prototype.hasOwnProperty.call(DEMOLITION,input.demolition)||
      !['burn','haul','chip'].includes(input.waste)) return {ok:false,error:'invalid-input'};
    var vegetationCost=input.vegetation==='cleared'?0:area*rate['veg_'+input.vegetation]*TERRAIN[input.terrain];
    var treeCost=trees*rate.tree_each,topsoilVolume=area*0.225;
    var topsoilCost=input.removeTopsoil?topsoilVolume*rate.topsoil_m3:0;
    var demolitionCost=DEMOLITION[input.demolition]*rate.demo_m2;
    var wasteVolume=input.vegetation==='cleared'?0:area*0.05;
    var wasteCost=input.waste==='burn'?0:wasteVolume*(input.waste==='haul'?rate.waste_haul_m3:rate.waste_chip_m3);
    var total=vegetationCost+treeCost+topsoilCost+demolitionCost+wasteCost;
    return {ok:true,country:input.country,symbol:rate.sym,area:area,trees:trees,vegetation:input.vegetation,terrain:input.terrain,
      removeTopsoil:!!input.removeTopsoil,demolition:input.demolition,waste:input.waste,vegetationCost:vegetationCost,
      treeCost:treeCost,topsoilVolume:topsoilVolume,topsoilCost:topsoilCost,demolitionCost:demolitionCost,
      wasteVolume:wasteVolume,wasteCost:wasteCost,total:total,costPerM2:total/area,
      days:Math.ceil(area/500)+Math.ceil(trees/5)+(input.demolition!=='none'?3:0)};
  }
  return {rates:RATES,terrainMultipliers:TERRAIN,demolitionAreas:DEMOLITION,calculate:calculate};
}));
