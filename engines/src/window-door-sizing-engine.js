(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.WindowDoorSizingEngine = engine;
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var RATES = {
    NG:{sym:'₦',win_alum:45000,win_upvc:65000,win_timber:38000,win_steel:55000,door_ext_steel:120000,door_ext_alum:95000,door_ext_timber:85000,door_ext_fibreglass:110000,door_int_flush:28000,door_int_panel:40000,door_int_solid:55000,hardware_pct:0.12},
    KE:{sym:'KES',win_alum:18000,win_upvc:26000,win_timber:15000,win_steel:22000,door_ext_steel:48000,door_ext_alum:38000,door_ext_timber:34000,door_ext_fibreglass:44000,door_int_flush:11000,door_int_panel:16000,door_int_solid:22000,hardware_pct:0.12},
    ZA:{sym:'ZAR',win_alum:5500,win_upvc:8000,win_timber:4600,win_steel:6700,door_ext_steel:14000,door_ext_alum:11500,door_ext_timber:10000,door_ext_fibreglass:13000,door_int_flush:3200,door_int_panel:4800,door_int_solid:6500,hardware_pct:0.15},
    GH:{sym:'GHS',win_alum:4200,win_upvc:6000,win_timber:3500,win_steel:5100,door_ext_steel:11000,door_ext_alum:8800,door_ext_timber:7800,door_ext_fibreglass:10000,door_int_flush:2400,door_int_panel:3600,door_int_solid:5000,hardware_pct:0.12},
    EG:{sym:'EGP',win_alum:4500,win_upvc:6500,win_timber:3800,win_steel:5500,door_ext_steel:12000,door_ext_alum:9500,door_ext_timber:8400,door_ext_fibreglass:11000,door_int_flush:2600,door_int_panel:3900,door_int_solid:5400,hardware_pct:0.12},
    ET:{sym:'ETB',win_alum:11000,win_upvc:16000,win_timber:9200,win_steel:13500,door_ext_steel:29000,door_ext_alum:23000,door_ext_timber:20000,door_ext_fibreglass:27000,door_int_flush:6300,door_int_panel:9500,door_int_solid:13000,hardware_pct:0.12},
    TZ:{sym:'TZS',win_alum:400000,win_upvc:580000,win_timber:335000,win_steel:490000,door_ext_steel:1050000,door_ext_alum:840000,door_ext_timber:740000,door_ext_fibreglass:980000,door_int_flush:230000,door_int_panel:345000,door_int_solid:480000,hardware_pct:0.12},
    UG:{sym:'UGX',win_alum:520000,win_upvc:750000,win_timber:435000,win_steel:635000,door_ext_steel:1370000,door_ext_alum:1090000,door_ext_timber:960000,door_ext_fibreglass:1270000,door_int_flush:300000,door_int_panel:450000,door_int_solid:620000,hardware_pct:0.12},
    RW:{sym:'RWF',win_alum:87000,win_upvc:125000,win_timber:73000,win_steel:106000,door_ext_steel:230000,door_ext_alum:183000,door_ext_timber:161000,door_ext_fibreglass:212000,door_int_flush:50000,door_int_panel:75000,door_int_solid:104000,hardware_pct:0.12},
    MA:{sym:'MAD',win_alum:2200,win_upvc:3200,win_timber:1850,win_steel:2700,door_ext_steel:5800,door_ext_alum:4600,door_ext_timber:4100,door_ext_fibreglass:5400,door_int_flush:1260,door_int_panel:1900,door_int_solid:2600,hardware_pct:0.13}
  };
  var WINDOW_SIZES={casement:'900×1200mm',louvre:'600×1200mm',sliding:'1200×1200mm',fixed:'1200×1500mm'};
  var WINDOW_AREAS={casement:1.08,louvre:0.72,sliding:1.44,fixed:1.80};
  var EXTERNAL={steel_security:'steel',aluminium_glass:'alum',timber_solid:'timber',fibreglass:'fibreglass'};
  var INTERNAL={flush_hdf:'flush',panel_timber:'panel',flush_solid:'solid'};

  function positive(value) { value=Number(value); return Number.isFinite(value)&&value>0?value:null; }
  function nonnegative(value) { value=Number(value); return Number.isFinite(value)&&value>=0?value:null; }
  function calculate(input) {
    input=input||{};
    var rate=RATES[input.country], rooms=positive(input.rooms), roomArea=positive(input.roomArea);
    var extDoors=nonnegative(input.externalDoors), intDoors=nonnegative(input.internalDoors);
    var windowArea=WINDOW_AREAS[input.windowType], windowKey={aluminium:'alum',upvc:'upvc',timber:'timber',steel:'steel'}[input.windowMaterial];
    var extKey=EXTERNAL[input.externalMaterial], intKey=INTERNAL[input.internalMaterial];
    if(!rate||rooms===null||roomArea===null||extDoors===null||intDoors===null||!windowArea||!windowKey||!extKey||!intKey) return {ok:false,error:'invalid-input'};
    var windowRate=rate['win_'+windowKey], externalRate=rate['door_ext_'+extKey], internalRate=rate['door_int_'+intKey];
    if(!Number.isFinite(windowRate)||!Number.isFinite(externalRate)||!Number.isFinite(internalRate)) return {ok:false,error:'unsupported-rate'};
    var requiredGlazingPerRoom=roomArea*0.10;
    var windowsPerRoom=Math.max(1,Math.ceil(requiredGlazingPerRoom/windowArea));
    var totalWindows=windowsPerRoom*rooms;
    var totalGlazingArea=totalWindows*windowArea;
    var requiredVentilationArea=rooms*roomArea*0.05;
    var actualVentilationArea=input.windowType==='fixed'?0:totalGlazingArea*0.5;
    var windowCost=totalWindows*windowRate, externalCost=extDoors*externalRate, internalCost=intDoors*internalRate;
    var subtotal=windowCost+externalCost+internalCost, hardwareCost=subtotal*rate.hardware_pct;
    return {
      ok:true,country:input.country,symbol:rate.sym,buildingType:input.buildingType,rooms:rooms,roomArea:roomArea,
      windowsPerRoom:windowsPerRoom,totalWindows:totalWindows,totalGlazingArea:totalGlazingArea,
      requiredVentilationArea:requiredVentilationArea,actualVentilationArea:actualVentilationArea,
      ventilationMeetsTarget:actualVentilationArea>=requiredVentilationArea,
      windowCost:windowCost,externalDoorCost:externalCost,internalDoorCost:internalCost,
      hardwareCost:hardwareCost,total:subtotal+hardwareCost,
      schedule:[
        {kind:'window',material:input.windowMaterial,type:input.windowType,qty:totalWindows,size:WINDOW_SIZES[input.windowType],unitCost:windowRate,total:windowCost},
        {kind:'external-door',material:input.externalMaterial,qty:extDoors,size:'900×2100mm',unitCost:externalRate,total:externalCost},
        {kind:'internal-door',material:input.internalMaterial,qty:intDoors,size:'820×2100mm',unitCost:internalRate,total:internalCost},
        {kind:'hardware',qty:1,size:'Lump sum',unitCost:hardwareCost,total:hardwareCost}
      ]
    };
  }
  return {rates:RATES,windowSizes:WINDOW_SIZES,windowAreas:WINDOW_AREAS,calculate:calculate};
}));
