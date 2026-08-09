(function(root,factory){"use strict";var api=factory();if(typeof module==="object"&&module.exports)module.exports=api;else root.SolarCalculatorEngine=api;})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  var DOD={lead:.5,gel:.55,lifepo4:.8},EFF={lead:.85,gel:.87,lifepo4:.97},BATTERY_WH=1200,BASE_FACTOR=.82;
  function n(value){value=Number(value);return Number.isFinite(value)?value:0;}
  function panelArea(watts){return watts>=520?2.6:watts>=430?2.25:watts>=380?2.05:watts>=300?1.75:1.55;}
  function calculate(input){
    input=input||{};var appliances=Array.isArray(input.appliances)?input.appliances:[],totalWh=0,peakW=0;
    appliances.forEach(function(item){var watts=n(item.watts),qty=n(item.qty),hours=n(item.hoursPerDay==null?item.hours:item.hoursPerDay);if(watts>0&&qty>0&&hours>=0){peakW+=watts*qty;totalWh+=watts*qty*hours;}});
    if(totalWh<=0||peakW<=0)return{error:"invalid-load"};
    var sunHours=n(input.sunHours),panelWatts=n(input.panelWatts),orientation=n(input.orientationFactor)||1,shade=Math.min(.6,Math.max(0,n(input.shadeLossPct)/100)),soiling=Math.min(.4,Math.max(0,n(input.soilingLossPct)/100));
    if(sunHours<=0||panelWatts<=0||orientation<.5)return{error:"invalid-site"};
    var factor=Math.max(.35,BASE_FACTOR*orientation*(1-shade)*(1-soiling)),effective=sunHours*factor;
    var panels=Math.ceil((totalWh/(effective*1000))*1000/panelWatts),arrayKwp=panels*panelWatts/1000;
    var type=String(input.batteryType||"lifepo4"),system=String(input.systemType||"hybrid"),needsBattery=system!=="ongrid",days=n(input.backupDays);
    if(needsBattery&&days<=0)return{error:"invalid-backup"};
    var batteryNeeded=needsBattery?(totalWh/1000)*days/((DOD[type]||DOD.lifepo4)*(EFF[type]||EFF.lifepo4)):0,batteries=needsBattery?Math.ceil(batteryNeeded*1000/BATTERY_WH):0,batteryKwh=batteries*BATTERY_WH/1000;
    var inverterKva=Math.ceil((peakW*1.2)/1000*2)/2,mpptA=Math.ceil(arrayKwp*1000/(panelWatts>400?24:12)*1.25/10)*10;
    var panelCost=panels*220,batteryCost=batteries*(type==="lifepo4"?280:90),inverterCost=inverterKva*180,totalUsd=(panelCost+batteryCost+inverterCost)*1.3,usdRate=n(input.usdRate)||1,systemCostLocal=totalUsd*usdRate,roofNeeded=panels*panelArea(panelWatts)*1.15,roofAvailable=Math.max(0,n(input.roofArea));
    var annualGeneratorCost=Math.max(0,n(input.monthlyGeneratorCost))*12,annualMaintenance=systemCostLocal*.02,roi=[];
    for(var year=1,solar=systemCostLocal,generator=0;year<=10;year++){generator+=annualGeneratorCost;solar+=annualMaintenance;roi.push({year:year,solarCost:solar,generatorCost:generator,saving:generator-solar});}
    return{totalWh:totalWh,peakW:peakW,systemType:system,panelWatts:panelWatts,panels:panels,arrayKwp:arrayKwp,batteries:batteries,batteryType:type,batteryKwh:batteryKwh,inverterKva:inverterKva,mpptA:mpptA,sunHours:sunHours,effectiveSunHours:effective,lossPercent:Math.round((1-factor)*100),roofNeeded:roofNeeded,roofAvailable:roofAvailable,roofOk:!roofAvailable||roofAvailable>=roofNeeded,systemCostUsd:totalUsd,systemCostLocal:systemCostLocal,monthlyGeneratorCost:Math.max(0,n(input.monthlyGeneratorCost)),annualGeneratorCost:annualGeneratorCost,roi:roi,assumptions:{baseSystemFactor:BASE_FACTOR,batteryUnitWh:BATTERY_WH,depthOfDischarge:DOD[type]||DOD.lifepo4,batteryEfficiency:EFF[type]||EFF.lifepo4,panelUsd:220,inverterUsdPerKva:180,installationMarkupPct:30,annualMaintenancePct:2}};
  }
  return{id:"solar-calculator-engine",calculate:calculate,panelAreaM2:panelArea};
});
