#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),PAGE=path.join(ROOT,'agriculture/storage-loss/index.html');
const START='    var cropData   = STORAGE_DATA.lossRates[crop];',END='    // ── RENDER RESULTS';
const BLOCK=`    var model = window.AfroTools.StorageLossEngine.calculate({ crop: crop, countryCode: cc, methodKey: methodKey, quantityTonnes: qty, durationMonths: duration, pricePerTonne: price }, STORAGE_DATA);
    if (!model.ok) { alert('Please fill in all fields before calculating.'); return; }
    window.STORAGE_LOSS_LAST_RESULT = model;
    var cropData = model.cropData;
    var country = model.country;
    var symbol = model.symbol;
    var rate = model.rate;
    var picsKey = model.picsKey;
    var adjCurrentLoss = model.adjCurrentLoss;
    var adjPicsLoss = model.adjPicsLoss;
    var adjSiloLoss = model.adjSiloLoss;
    var currentLossTonnes = model.currentLossTonnes;
    var picsLossTonnes = model.picsLossTonnes;
    var siloLossTonnes = model.siloLossTonnes;
    var currentLossVal = model.currentLossVal;
    var picsLossVal = model.picsLossVal;
    var siloLossVal = model.siloLossVal;
    var picsGrainSaved = model.picsGrainSaved;
    var picsValSaved = model.picsValSaved;
    var bagsNeeded = model.bagsNeeded;
    var picsBagCost = model.picsBagCost;
    var picsTotalCost = model.picsTotalCost;
    var picsPerUseCost = model.picsPerUseCost;
    var siloCostLocal = model.siloCostLocal;
    var siloLabel = model.siloLabel;
    var siloAnnualCost = model.siloAnnualCost;
    var picsNetSave = model.picsNetSave;
    var siloNetSave = model.siloNetSave;
    var picsROI = model.picsROI;
    var siloROI = model.siloROI;
    var picsPaybackSeasons = model.picsPaybackSeasons;
    var siloPaybackSeasons = model.siloPaybackSeasons;
    var seasonal = model.seasonalPriceIncreasePct;
    var grainForSale = model.grainForSale;
    var timingGain = model.timingGain;
    var totalBenefit = model.totalBenefit;

`;
function migrate(input){let source=input;if(!source.includes('/engines/storage-loss-engine.js'))source=source.replace('<script>\n(function() {','<script src="/engines/storage-loss-engine.js"></script>\n<script>\n(function() {');const start=source.indexOf(START),end=source.indexOf(END,start);if(start<0||end<0)throw new Error('Missing Storage Loss inline calculation block.');return source.slice(0,start)+BLOCK+source.slice(end)}
function run(){const current=fs.readFileSync(PAGE,'utf8'),output=current.includes('STORAGE_LOSS_LAST_RESULT')?current:migrate(current);if(process.argv.includes('--check')){assert.equal(current,output);console.log('PASS Storage Loss English shared-engine migration')}else{fs.writeFileSync(PAGE,output,'utf8');console.log('Migrated Storage Loss English workflow to shared engine')}}
if(require.main===module)run();module.exports={migrate};
