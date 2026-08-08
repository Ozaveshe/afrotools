"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,"..");
const engine=require("../assets/js/engines/engineering-materials-engine.js");
const {SW_ENGINEERING_MATERIALS_APPS}=require("../scripts/lib/sw-engineering-materials-contract.js");
const {page}=require("../scripts/build-sw-engineering-materials-parity.js");
function read(file){return fs.readFileSync(path.join(ROOT,file),"utf8");}

test("bounded owner contains the exact four deterministic Engineering apps",()=>{
 assert.deepEqual(SW_ENGINEERING_MATERIALS_APPS.map(a=>a.id),["concrete-calc","tiles-calc","water-tank","rebar-calc"]);
 for(const app of SW_ENGINEERING_MATERIALS_APPS){assert.equal(read(app.file),page(app));assert.ok(fs.existsSync(path.join(ROOT,app.image)));}
});

test("English and Swahili pages share the DOM-free engine owner",()=>{
 const english={"concrete-calc":"tools/concrete-mix/index.html","tiles-calc":"tools/tiles-calc/index.html","water-tank":"tools/water-tank/index.html","rebar-calc":"tools/rebar-calculator/index.html"};
 const controllers={"concrete-calc":"concrete-calc-1.js","tiles-calc":"tiles-calc-1.js","water-tank":"water-tank-1.js","rebar-calc":"rebar-calc-1.js"};
 for(const app of SW_ENGINEERING_MATERIALS_APPS){const en=read(english[app.id]),sw=read(app.file),controller=read(`assets/js/pages/engineering-parity/${controllers[app.id]}`);assert.ok(en.includes("/assets/js/engines/engineering-materials-engine.js"));assert.ok(sw.includes("/assets/js/engines/engineering-materials-engine.js"));assert.ok(controller.includes(`EngineeringMaterialsEngine.${app.id==="concrete-calc"?"concrete":app.id==="tiles-calc"?"tiles":app.id==="water-tank"?"waterTank":"rebar"}`));}
});

test("concrete oracle preserves English dry-volume, density, wastage and water boundaries",()=>{
 const out=engine.concrete({wetVolume:3,ratio:[1,2,4],bagSize:50,wastagePct:5,waterCementRatio:.5});
 assert.equal(out.dryVolume,4.62);assert.equal(out.cementBags,20);assert.equal(out.waterLitres,475);assert.ok(Math.abs(out.sandVolume-1.386)<1e-9);assert.equal(engine.concrete({wetVolume:0,ratio:[1,2,4]}).error,"invalid_volume");
});

test("tiles oracle preserves grout, openings, wastage, boxes and cost",()=>{
 const out=engine.tiles({roomLength:5,roomWidth:4,surface:"both",wallHeight:3,doors:1,windows:2,tileLengthCm:60,tileWidthCm:60,groutWidthMm:3,wastagePct:10,pricePerTile:100});
 assert.equal(out.floorArea,20);assert.equal(out.wallArea,49.44);assert.equal(out.totalTiles,211);assert.equal(out.boxesNeeded,27);assert.equal(out.cost,21100);assert.equal(engine.tiles({roomLength:0}).error,"invalid_dimension");
});

test("water tank oracle preserves daily-use extras, standard tank and rainfall assumptions",()=>{
 const out=engine.waterTank({people:4,propertyType:"bungalow",backupDays:3,garden:true,rainwater:true,roofArea:100});
 assert.equal(out.dailyTotal,650);assert.equal(out.totalNeeded,1950);assert.equal(out.recommendedTank,2000);assert.equal(out.annualRainCatchment,80000);assert.equal(engine.waterTank({people:0,backupDays:3}).error,"invalid_demand");
});

test("rebar oracle preserves kg-per-metre table, 12m ordering, laps, wastage and cost",()=>{
 const out=engine.rebar({rows:[{size:"Y16",description:"Main",length:5.8,quantity:8},{size:"R8",description:"Links",length:1.2,quantity:24}],wastagePct:5,pricePerTonne:1000000});
 assert.ok(Math.abs(out.totalWeight-(1.579*46.4+.395*28.8))<1e-9);assert.ok(Math.abs(out.totalLength-75.2)<1e-9);assert.equal(out.barsToOrder,7);assert.equal(out.schedule[0].lapLengthMm,640);assert.equal(engine.rebar({rows:[]}).error,"missing_rows");
});

test("native controller is local-only and provides reset plus parsed export/reopen paths",()=>{
 const js=read("assets/js/pages/sw-engineering-materials-parity.js");for(const token of ["root.AfroLocalOnly=true","form.checkValidity()","FileReader","readAsText","application/json","text/csv","AfroToolsEngineeringPdf","form.addEventListener(\"reset\"","dataset.theme"])assert.ok(js.includes(token),token);for(const forbidden of ["fetch(","XMLHttpRequest","sendBeacon","localStorage","sessionStorage"])assert.ok(!js.includes(forbidden),forbidden);
});
