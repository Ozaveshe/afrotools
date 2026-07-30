(function(root,factory){
  'use strict';
  var engine=factory();
  if(typeof module==='object'&&module.exports) module.exports=engine;
  root.AfroTools=root.AfroTools||{};
  root.AfroTools.RoadConstructionCostEngine=engine;
}(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var RATES={
    NG:{sym:'₦',gravel:8000000,asphalt:45000000,concrete:80000000,interlocking:35000000,drainage_pct:0.20,lighting_km:5000000,terrain_rolling:1.25,terrain_hilly:1.65,urban_mult:1.35},
    KE:{sym:'KES',gravel:3500000,asphalt:18000000,concrete:32000000,interlocking:14000000,drainage_pct:0.20,lighting_km:2000000,terrain_rolling:1.25,terrain_hilly:1.65,urban_mult:1.35},
    ZA:{sym:'ZAR',gravel:900000,asphalt:5000000,concrete:9000000,interlocking:4000000,drainage_pct:0.22,lighting_km:600000,terrain_rolling:1.25,terrain_hilly:1.65,urban_mult:1.40},
    GH:{sym:'GHS',gravel:700000,asphalt:3800000,concrete:6800000,interlocking:3000000,drainage_pct:0.20,lighting_km:450000,terrain_rolling:1.25,terrain_hilly:1.65,urban_mult:1.35},
    EG:{sym:'EGP',gravel:750000,asphalt:4200000,concrete:7500000,interlocking:3300000,drainage_pct:0.18,lighting_km:500000,terrain_rolling:1.20,terrain_hilly:1.55,urban_mult:1.30},
    ET:{sym:'ETB',gravel:1800000,asphalt:9500000,concrete:17000000,interlocking:7500000,drainage_pct:0.20,lighting_km:1200000,terrain_rolling:1.30,terrain_hilly:1.75,urban_mult:1.35},
    TZ:{sym:'TZS',gravel:65000000,asphalt:350000000,concrete:620000000,interlocking:280000000,drainage_pct:0.20,lighting_km:45000000,terrain_rolling:1.25,terrain_hilly:1.65,urban_mult:1.35},
    UG:{sym:'UGX',gravel:85000000,asphalt:450000000,concrete:800000000,interlocking:360000000,drainage_pct:0.20,lighting_km:58000000,terrain_rolling:1.25,terrain_hilly:1.65,urban_mult:1.35},
    RW:{sym:'RWF',gravel:13000000,asphalt:72000000,concrete:128000000,interlocking:57000000,drainage_pct:0.20,lighting_km:9000000,terrain_rolling:1.35,terrain_hilly:1.80,urban_mult:1.35},
    MA:{sym:'MAD',gravel:350000,asphalt:1900000,concrete:3400000,interlocking:1500000,drainage_pct:0.18,lighting_km:240000,terrain_rolling:1.20,terrain_hilly:1.55,urban_mult:1.30}
  };
  var WIDTH={'3.5':0.58,'6.0':1.0,'7.3':1.22,'10.0':1.67,'14.0':2.33};
  function calculate(input){
    input=input||{};
    var rate=RATES[input.country],length=Number(input.length),width=String(input.width);
    if(!rate||!Number.isFinite(length)||length<=0||!WIDTH[width]||!Number.isFinite(rate[input.surface])||
      !['flat','rolling','hilly'].includes(input.terrain)||!['urban','peri_urban','rural'].includes(input.location)) return {ok:false,error:'invalid-input'};
    var terrainFactor=input.terrain==='flat'?1:input.terrain==='rolling'?rate.terrain_rolling:rate.terrain_hilly;
    var locationFactor=input.location==='urban'?rate.urban_mult:input.location==='peri_urban'?1.1:1;
    var factor=WIDTH[width]*terrainFactor*locationFactor;
    var baseCostPerKm=rate[input.surface]*factor,roadCost=baseCostPerKm*length;
    var drainageCost=input.includeDrainage?roadCost*rate.drainage_pct:0;
    var lightingCost=input.includeLighting?rate.lighting_km*length:0;
    return {ok:true,country:input.country,symbol:rate.sym,length:length,width:width,surface:input.surface,
      terrain:input.terrain,location:input.location,includeDrainage:!!input.includeDrainage,includeLighting:!!input.includeLighting,
      baseCostPerKm:baseCostPerKm,roadCost:roadCost,drainageCost:drainageCost,lightingCost:lightingCost,
      total:roadCost+drainageCost+lightingCost,
      comparison:Object.keys({gravel:1,asphalt:1,concrete:1,interlocking:1}).map(function(surface){
        return {surface:surface,costPerKm:rate[surface]*factor};
      })};
  }
  return {rates:RATES,widthFactors:WIDTH,calculate:calculate};
}));
