(function(root,factory){
  'use strict';
  var engine=factory();
  if(typeof module==='object'&&module.exports) module.exports=engine;
  root.AfroTools=root.AfroTools||{};
  root.AfroTools.SepticTankEngine=engine;
}(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var RATES={
    NG:{sym:'₦',conc_per_m3:85000,plastic_per_m3:60000,soak_per_m:12000,labour_pct:0.40},
    KE:{sym:'KES',conc_per_m3:35000,plastic_per_m3:25000,soak_per_m:5000,labour_pct:0.40},
    ZA:{sym:'ZAR',conc_per_m3:8000,plastic_per_m3:6000,soak_per_m:1500,labour_pct:0.45},
    GH:{sym:'GHS',conc_per_m3:6000,plastic_per_m3:4500,soak_per_m:800,labour_pct:0.40},
    EG:{sym:'EGP',conc_per_m3:7000,plastic_per_m3:5000,soak_per_m:1000,labour_pct:0.35},
    ET:{sym:'ETB',conc_per_m3:18000,plastic_per_m3:13000,soak_per_m:2500,labour_pct:0.40},
    TZ:{sym:'TZS',conc_per_m3:700000,plastic_per_m3:500000,soak_per_m:100000,labour_pct:0.40},
    UG:{sym:'UGX',conc_per_m3:900000,plastic_per_m3:650000,soak_per_m:130000,labour_pct:0.40},
    RW:{sym:'RWF',conc_per_m3:150000,plastic_per_m3:110000,soak_per_m:20000,labour_pct:0.40},
    MA:{sym:'MAD',conc_per_m3:4000,plastic_per_m3:3000,soak_per_m:600,labour_pct:0.40}
  };
  var DAILY={residential:150,office:60,school:50,clinic:200},SOIL={sandy:1,loam:1.5,clay:2.5,laterite:1.8};
  function calculate(input){
    input=input||{};
    var rate=RATES[input.country],people=Number(input.people),toilets=Number(input.toilets);
    if(!rate||!Number.isFinite(people)||people<=0||!Number.isFinite(toilets)||toilets<=0||!DAILY[input.buildingType]||
      !SOIL[input.soil]||!['concrete','plastic'].includes(input.material)) return {ok:false,error:'invalid-input'};
    var dailyWaste=people*DAILY[input.buildingType]*0.8,retentionVolume=dailyWaste*2/1000,sludgeVolume=people*0.04;
    var volume=Math.max(Math.ceil((retentionVolume+sludgeVolume)*10)/10,2);
    var length=+(Math.ceil(volume*0.4*10)/10).toFixed(1),width=+(Math.max(1.2,length*0.5)).toFixed(1);
    var depth=Math.min(+(volume/(length*width)).toFixed(1),2.5),chambers=people<=10?2:3;
    var materialRate=input.material==='plastic'?rate.plastic_per_m3:rate.conc_per_m3;
    var constructionCost=volume*materialRate*(1+rate.labour_pct);
    var soakLength=people*DAILY[input.buildingType]*0.8/1000*10*SOIL[input.soil];
    var soakCost=input.includeSoakaway?soakLength*rate.soak_per_m:0;
    return {ok:true,country:input.country,symbol:rate.sym,people:people,toilets:toilets,buildingType:input.buildingType,
      soil:input.soil,material:input.material,includeSoakaway:!!input.includeSoakaway,dailyWaste:dailyWaste,
      retentionVolume:retentionVolume,sludgeVolume:sludgeVolume,volume:volume,length:length,width:width,depth:depth,
      chambers:chambers,materialRate:materialRate,constructionCost:constructionCost,soakLength:soakLength,
      soakCost:soakCost,total:constructionCost+soakCost,annualDesludgingEstimate:volume*materialRate*0.05};
  }
  return {rates:RATES,dailyUse:DAILY,soilMultipliers:SOIL,calculate:calculate};
}));
