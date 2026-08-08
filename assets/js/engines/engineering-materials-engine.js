(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.EngineeringMaterialsEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var BAR_DATA = Object.freeze({
    R6:{dia:6,wt:0.222,type:"R"}, R8:{dia:8,wt:0.395,type:"R"}, R10:{dia:10,wt:0.617,type:"R"},
    Y8:{dia:8,wt:0.395,type:"Y"}, Y10:{dia:10,wt:0.617,type:"Y"}, Y12:{dia:12,wt:0.888,type:"Y"},
    Y16:{dia:16,wt:1.579,type:"Y"}, Y20:{dia:20,wt:2.466,type:"Y"}, Y25:{dia:25,wt:3.854,type:"Y"}, Y32:{dia:32,wt:6.313,type:"Y"}
  });
  var STANDARD_TANKS = Object.freeze([500,750,1000,1500,2000,3000,5000,10000]);
  var USAGE_BY_TYPE = Object.freeze({flat:120,bungalow:150,duplex:150,compound:130,office:50,school:30});

  function finitePositive(value) { return Number.isFinite(Number(value)) && Number(value) > 0; }
  function fail(code) { return { error: code }; }

  function concrete(input) {
    if (!input || !finitePositive(input.wetVolume)) return fail("invalid_volume");
    var ratio = Array.isArray(input.ratio) ? input.ratio.map(Number) : [];
    if (ratio.length < 2 || ratio.some(function (n) { return !finitePositive(n); })) return fail("invalid_ratio");
    var cement = ratio[0], sand = ratio[1], aggregate = ratio[2] || 0;
    var totalParts = cement + sand + aggregate;
    var bagSize = Number(input.bagSize || 50);
    var wastagePct = Number(input.wastagePct || 0);
    var waterCementRatio = Number(input.waterCementRatio || 0.5);
    if (!finitePositive(bagSize) || wastagePct < 0 || !finitePositive(waterCementRatio)) return fail("invalid_assumption");
    var wasteFactor = 1 + wastagePct / 100;
    var dryVolume = Number(input.wetVolume) * 1.54;
    var cementVolume = cement / totalParts * dryVolume;
    var cementKg = cementVolume * 1440;
    var cementBags = Math.ceil(cementKg / bagSize * wasteFactor);
    var sandVolume = sand / totalParts * dryVolume * wasteFactor;
    var aggregateVolume = aggregate / totalParts * dryVolume * wasteFactor;
    return {
      wetVolume:Number(input.wetVolume), dryVolume:dryVolume, cementVolume:cementVolume, cementKg:cementKg,
      cementBags:cementBags, sandVolume:sandVolume, sandTonnes:sandVolume*1.6,
      sandWheelbarrows:Math.ceil(sandVolume/0.065), aggregateVolume:aggregateVolume,
      aggregateTonnes:aggregateVolume*1.75, aggregateWheelbarrows:Math.ceil(aggregateVolume/0.065),
      waterLitres:Math.round(cementKg*waterCementRatio), waterCementRatio:waterCementRatio,
      bagSize:bagSize, wastagePct:wastagePct, ratio:ratio
    };
  }

  function tiles(input) {
    if (!input || !finitePositive(input.roomLength) || !finitePositive(input.roomWidth) || !finitePositive(input.tileLengthCm) || !finitePositive(input.tileWidthCm)) return fail("invalid_dimension");
    var surface = input.surface || "floor";
    var floorArea = (surface === "floor" || surface === "both") ? Number(input.roomLength)*Number(input.roomWidth) : 0;
    var wallArea = 0;
    if (surface === "wall" || surface === "both") {
      if (!finitePositive(input.wallHeight)) return fail("invalid_wall_height");
      wallArea = 2*(Number(input.roomLength)+Number(input.roomWidth))*Number(input.wallHeight);
      wallArea = Math.max(0, wallArea - Number(input.doors||0)*1.68 - Number(input.windows||0)*1.44);
    }
    var groutM = Number(input.groutWidthMm||0)/1000;
    var tileAreaWithGrout = (Number(input.tileLengthCm)/100+groutM)*(Number(input.tileWidthCm)/100+groutM);
    var totalArea = floorArea + wallArea;
    var tilesExact = totalArea/tileAreaWithGrout;
    var wastagePct = Number(input.wastagePct||0);
    if (wastagePct < 0) return fail("invalid_wastage");
    var wasteTiles = Math.ceil(tilesExact*wastagePct/100);
    var totalTiles = Math.ceil(tilesExact)+wasteTiles;
    return {floorArea:floorArea,wallArea:wallArea,totalArea:totalArea,tilesExact:tilesExact,wasteTiles:wasteTiles,totalTiles:totalTiles,boxesNeeded:Math.ceil(totalTiles/8),tilesPerSqm:1/((Number(input.tileLengthCm)/100)*(Number(input.tileWidthCm)/100)),cost:totalTiles*Number(input.pricePerTile||0),wastagePct:wastagePct};
  }

  function waterTank(input) {
    if (!input || !finitePositive(input.people) || !finitePositive(input.backupDays)) return fail("invalid_demand");
    var baseUsage = USAGE_BY_TYPE[input.propertyType] || 150;
    var extraDaily = (input.garden?50:0)+(input.carwash?30:0)+(input.laundry?40:0)+(input.cooking?20:0);
    var dailyTotal = Number(input.people)*baseUsage+extraDaily;
    var totalNeeded = dailyTotal*Number(input.backupDays);
    var recommended = STANDARD_TANKS[STANDARD_TANKS.length-1];
    STANDARD_TANKS.some(function (size) { if (size >= totalNeeded) { recommended=size; return true; } return false; });
    var nearTanks = STANDARD_TANKS.filter(function (size) { return size >= totalNeeded*0.6 && size <= totalNeeded*2.5; }).slice(0,4);
    if (!nearTanks.length) nearTanks=[recommended];
    var roofArea = Number(input.roofArea||0);
    var catchmentLitres = input.rainwater && roofArea>0 ? Math.round(roofArea*0.8*1000) : 0;
    return {baseUsage:baseUsage,extraDaily:extraDaily,dailyTotal:dailyTotal,totalNeeded:totalNeeded,recommendedTank:recommended,tankLastsDays:recommended/dailyTotal,fillPct:Math.min(totalNeeded/recommended*100,100),nearTanks:nearTanks,multipleTanks:totalNeeded>10000?Math.ceil(totalNeeded/5000):0,annualRainCatchment:catchmentLitres,monthlyRainCatchment:Math.round(catchmentLitres/12),rainCoveragePct:catchmentLitres?Math.min(100,Math.round((catchmentLitres/12)/(dailyTotal*30)*100)):0};
  }

  function rebar(input) {
    if (!input || !Array.isArray(input.rows) || !input.rows.length) return fail("missing_rows");
    var schedule=[]; var totalWeight=0,totalLength=0,totalBars=0;
    input.rows.forEach(function (row,index) {
      var bar=BAR_DATA[row.size], length=Number(row.length), quantity=Math.floor(Number(row.quantity));
      if (!bar || !finitePositive(length) || !finitePositive(quantity)) return;
      var totalLen=length*quantity, weight=bar.wt*totalLen;
      totalWeight+=weight; totalLength+=totalLen; totalBars+=quantity;
      schedule.push({mark:index+1,size:row.size,dia:bar.dia,description:row.description||("Bar "+(index+1)),length:length,quantity:quantity,totalLength:totalLen,weight:weight,fullBars:Math.ceil(totalLen/12),lapLengthMm:bar.dia*40,weightPerM:bar.wt});
    });
    if (!schedule.length) return fail("invalid_rows");
    var wastagePct=Number(input.wastagePct||0), weightWithWaste=totalWeight*(1+wastagePct/100), tonnes=weightWithWaste/1000, pricePerTonne=Number(input.pricePerTonne||0);
    return {schedule:schedule,totalWeight:totalWeight,weightWithWaste:weightWithWaste,tonnes:tonnes,totalLength:totalLength,totalBars:totalBars,barsToOrder:Math.ceil(totalLength/12),wastagePct:wastagePct,cost:Math.round(tonnes*pricePerTonne)};
  }

  return Object.freeze({ BAR_DATA:BAR_DATA, STANDARD_TANKS:STANDARD_TANKS, USAGE_BY_TYPE:USAGE_BY_TYPE, concrete:concrete, tiles:tiles, waterTank:waterTank, rebar:rebar });
});
