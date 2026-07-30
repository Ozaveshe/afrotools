'use strict';

const assert = require('node:assert/strict');

const scaffolding = require('../engines/src/scaffolding-engine.js');
const windowDoor = require('../engines/src/window-door-sizing-engine.js');
const plumbing = require('../engines/src/plumbing-material-engine.js');
const road = require('../engines/src/road-construction-cost-engine.js');
const site = require('../engines/src/site-clearing-engine.js');
const septic = require('../engines/src/septic-tank-engine.js');

assert.deepEqual(Object.keys(scaffolding.rates), ['NG','KE','ZA','GH','EG','ET','TZ','UG','RW','MA']);
assert.deepEqual(Object.keys(windowDoor.rates), ['NG','KE','ZA','GH','EG','ET','TZ','UG','RW','MA']);
assert.deepEqual(Object.keys(plumbing.rates), ['NG','KE','ZA','GH','EG','ET','TZ','UG','RW','MA']);
assert.deepEqual(Object.keys(road.rates), ['NG','KE','ZA','GH','EG','ET','TZ','UG','RW','MA']);
assert.deepEqual(Object.keys(site.rates), ['NG','KE','ZA','GH','EG','ET','TZ','UG','RW','MA']);
assert.deepEqual(Object.keys(septic.rates), ['NG','KE','ZA','GH','EG','ET','TZ','UG','RW','MA']);

assert.deepEqual(
  scaffolding.calculate({country:'NG',perimeter:60,height:9,type:'steel',mode:'rent',weeks:4,includeLabour:true}),
  {
    ok:true,country:'NG',symbol:'₦',perimeter:60,height:9,weeks:4,type:'steel',mode:'rent',includeLabour:true,
    area:540,tubes:360,boards:300,couplers:900,materialCost:2064000,labourCost:1890000,total:3954000,
    materialCostPerM2:955.5555555555555
  }
);
assert.equal(scaffolding.calculate({country:'NG',perimeter:0,height:9,weeks:4}).ok, false);

assert.deepEqual(
  windowDoor.calculate({
    country:'NG',buildingType:'bungalow',rooms:4,roomArea:16,externalDoors:2,internalDoors:4,
    windowMaterial:'aluminium',windowType:'casement',externalMaterial:'steel_security',internalMaterial:'flush_hdf'
  }),
  {
    ok:true,country:'NG',symbol:'₦',buildingType:'bungalow',rooms:4,roomArea:16,windowsPerRoom:2,totalWindows:8,
    totalGlazingArea:8.64,requiredVentilationArea:3.2,actualVentilationArea:4.32,ventilationMeetsTarget:true,
    windowCost:360000,externalDoorCost:240000,internalDoorCost:112000,hardwareCost:85440,total:797440,
    schedule:[
      {kind:'window',material:'aluminium',type:'casement',qty:8,size:'900×1200mm',unitCost:45000,total:360000},
      {kind:'external-door',material:'steel_security',qty:2,size:'900×2100mm',unitCost:120000,total:240000},
      {kind:'internal-door',material:'flush_hdf',qty:4,size:'820×2100mm',unitCost:28000,total:112000},
      {kind:'hardware',qty:1,size:'Lump sum',unitCost:85440,total:85440}
    ]
  }
);
assert.equal(windowDoor.calculate({country:'NG',rooms:0}).ok, false);
assert.equal(windowDoor.calculate({
  country:'NG',rooms:1,roomArea:10,externalDoors:1,internalDoors:1,
  windowMaterial:'unknown',windowType:'casement',externalMaterial:'steel_security',internalMaterial:'flush_hdf'
}).ok, false);

assert.deepEqual(
  plumbing.calculate({
    country:'NG',buildingType:'3bed',pipeType:'upvc',bathrooms:2,includeTank:true,tankSize:1000,includeLabour:true
  }),
  {
    ok:true,country:'NG',symbol:'₦',pipeType:'upvc',bathrooms:2,tankSize:1000,includeTank:true,includeLabour:true,
    pipeMetres:220,joints:110,pipeRate:450,pipeCost:99000,fittingCost:34650,sanitarywareCost:72000,
    tankCost:45000,boreholeConnectionCost:13500,materialTotal:264150,labourDays:10,labourCost:150000,
    total:414150,perBathroom:207075,
    bom:[
      {kind:'pipe',pipeType:'upvc',qty:220,unit:'metres',unitCost:450,total:99000},
      {kind:'fittings',qty:110,unit:'pcs',unitCost:315,total:34650},
      {kind:'sanitaryware',qty:2,unit:'sets',unitCost:36000,total:72000},
      {kind:'connection',qty:30,unit:'metres',unitCost:450,total:13500},
      {kind:'tank',tankSize:1000,qty:1,unit:'unit',unitCost:45000,total:45000},
      {kind:'labour',labourDays:10,qty:10,unit:'days',unitCost:15000,total:150000}
    ]
  }
);
assert.equal(plumbing.calculate({country:'NG',buildingType:'3bed',pipeType:'upvc',bathrooms:0,tankSize:1000}).ok, false);

assert.deepEqual(
  road.calculate({country:'NG',length:1.5,width:'7.3',surface:'asphalt',terrain:'rolling',location:'urban',includeDrainage:true,includeLighting:true}),
  {
    ok:true,country:'NG',symbol:'₦',length:1.5,width:'7.3',surface:'asphalt',terrain:'rolling',location:'urban',
    includeDrainage:true,includeLighting:true,baseCostPerKm:92643750,roadCost:138965625,drainageCost:27793125,
    lightingCost:7500000,total:174258750,
    comparison:[
      {surface:'gravel',costPerKm:16469999.999999998},
      {surface:'asphalt',costPerKm:92643750},
      {surface:'concrete',costPerKm:164700000},
      {surface:'interlocking',costPerKm:72056250}
    ]
  }
);
assert.equal(road.calculate({country:'NG',length:0,width:'7.3',surface:'asphalt',terrain:'flat',location:'rural'}).ok,false);

assert.deepEqual(
  site.calculate({country:'NG',area:1000,trees:10,vegetation:'medium',terrain:'gentle',removeTopsoil:true,demolition:'small',waste:'haul'}),
  {
    ok:true,country:'NG',symbol:'₦',area:1000,trees:10,vegetation:'medium',terrain:'gentle',removeTopsoil:true,
    demolition:'small',waste:'haul',vegetationCost:1500000,treeCost:80000,topsoilVolume:225,topsoilCost:787500,
    demolitionCost:240000,wasteVolume:50,wasteCost:125000,total:2732500,costPerM2:2732.5,days:7
  }
);
assert.equal(site.calculate({country:'NG',area:0,trees:0,vegetation:'light',terrain:'flat',demolition:'none',waste:'burn'}).ok,false);

assert.deepEqual(
  septic.calculate({country:'NG',people:8,toilets:2,buildingType:'residential',soil:'loam',material:'concrete',includeSoakaway:true}),
  {
    ok:true,country:'NG',symbol:'₦',people:8,toilets:2,buildingType:'residential',soil:'loam',material:'concrete',
    includeSoakaway:true,dailyWaste:960,retentionVolume:1.92,sludgeVolume:0.32,volume:2.3,length:1,width:1.2,
    depth:1.9,chambers:2,materialRate:85000,constructionCost:273699.99999999994,
    soakLength:14.399999999999999,soakCost:172799.99999999997,total:446499.9999999999,
    annualDesludgingEstimate:9774.999999999998
  }
);
assert.equal(septic.calculate({country:'NG',people:0,toilets:1,buildingType:'residential',soil:'loam',material:'concrete'}).ok,false);

console.log('French Engineering shared-engine frozen fixtures passed.');
