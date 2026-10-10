(function soilPhEngineModule(root,factory){'use strict';var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.SoilPhEngine=api;}}(typeof window!=='undefined'?window:globalThis,function createSoilPhEngine(){'use strict';
function finite(value){var number=Number(value);return Number.isFinite(number)?number:NaN;}
function baseLimeRange(currentPH,targetPH){if(currentPH>=targetPH)return[0,0];var delta=targetPH-currentPH,low,high;if(currentPH<4.5){low=1.8;high=2.5;}else if(currentPH<5){low=1.5;high=2;}else if(currentPH<5.5){low=1;high=1.6;}else if(currentPH<6){low=.8;high=1.3;}else{low=.7;high=1;}return[Math.max(0,parseFloat((delta*low).toFixed(2))),Math.max(0,parseFloat((delta*high).toFixed(2)))];}
function phLabel(ph){if(ph<4.5)return{label:'Extremely Acidic',code:'ext-acid'};if(ph<5.5)return{label:'Strongly Acidic',code:'str-acid'};if(ph<6.5)return{label:'Moderately Acidic',code:'mod-acid'};if(ph<7)return{label:'Slightly Acidic',code:'sl-acid'};if(ph<7.5)return{label:'Neutral',code:'neutral'};if(ph<8.5)return{label:'Slightly Alkaline',code:'alkaline'};return{label:'Strongly Alkaline',code:'str-alk'};}
function descriptionCode(ph){if(ph<4)return'extreme-below-4';if(ph<4.5)return'very-strong-acid';if(ph<5)return'strong-acid';if(ph<5.5)return'moderate-acid';if(ph<6)return'slight-acid';if(ph<6.5)return'mild-acid';if(ph<7)return'near-neutral';if(ph<7.5)return'neutral';if(ph<8)return'mild-alkaline';if(ph<8.5)return'moderate-alkaline';return'strong-alkaline';}
function phToPercent(ph){return Math.min(100,Math.max(0,((ph-3)/7)*100));}
function suitability(ph,crop){if(!crop)return null;var margin=.3;if(ph>=crop.optLow&&ph<=crop.optHigh)return{code:'excellent',color:'#22C55E'};if(ph>=crop.optLow-margin&&ph<=crop.optHigh+margin)return{code:'marginal',color:'#F59E0B'};return{code:ph<crop.optLow?'too-acidic':'too-alkaline',color:'#EF4444'};}
function targetPH(ph,crop){return crop?(ph>=crop.optLow?ph:crop.optLow):null;}
function limeName(quality){if(quality>=95)return'Pure CaCO₃';if(quality>=88)return'Dolomitic lime';if(quality>=80)return'Agricultural limestone';return'Wood ash';}
function adjustedRange(ph,target,textureMultiplier,depth,quality,data){var base=baseLimeRange(ph,target),factor=textureMultiplier*(depth/15)*(data.baseLimeCcePct/quality),low=base[0]*factor,high=base[1]*factor;return{baseLow:base[0],baseHigh:base[1],low:low,high:high,mid:(low+high)/2};}
function calculate(input,data){
var invalid={ok:false,status:'invalid-input'},own=function(object,key){return Object.prototype.hasOwnProperty.call(object,key);};
if(!input||typeof input!=='object'||Array.isArray(input)||!data||!data.crops||!data.textures||!Array.isArray(data.scenarioTargets)||typeof data.baseLimeCcePct!=='number'||!Number.isFinite(data.baseLimeCcePct)||data.baseLimeCcePct<=0)return invalid;
var ph=input.ph,cropKey=input.cropKey===undefined?'':input.cropKey,texture=input.texture===undefined?'loam':input.texture;
var depth=input.depth===undefined?15:input.depth,quality=input.limeQuality===undefined?100:input.limeQuality,farmHa=input.farmHa===undefined?1:input.farmHa,limePrice=input.limePrice===undefined?0:input.limePrice;
if(typeof ph!=='number'||!Number.isFinite(ph)||ph<3||ph>10||typeof cropKey!=='string'||(cropKey!==''&&!own(data.crops,cropKey))||typeof texture!=='string'||!own(data.textures,texture))return invalid;
if([depth,quality,farmHa].some(function(value){return typeof value!=='number'||!Number.isFinite(value)||value<=0;})||typeof limePrice!=='number'||!Number.isFinite(limePrice)||limePrice<0)return invalid;
var crop=cropKey?data.crops[cropKey]:null,textureMultiplier=data.textures[texture];
if(typeof textureMultiplier!=='number'||!Number.isFinite(textureMultiplier)||textureMultiplier<=0)return invalid;
var target=targetPH(ph,crop),lime;
if(ph>7.5){lime={kind:'alkaline',status:'soil-testing-required',gypsumRate:null,sulphurRate:null,requiredTests:['salinity','exchangeable-sodium-or-SAR','carbonate-content','laboratory-amendment-recommendation'],rateBasis:'not-determined-from-ph'};}
else{lime={kind:'testing-required',status:'laboratory-recommendation-required',targetPH:target,rateBasis:'not-determined-from-ph'};}
var ashRate=null,suitable=[],marginal=[];Object.keys(data.crops).forEach(function(key){var item=data.crops[key];if(ph>=item.optLow&&ph<=item.optHigh)suitable.push(key);else if(ph>=item.optLow-.3&&ph<=item.optHigh+.3)marginal.push(key);});
var result={ok:true,status:'calculated',input:{ph:ph,cropKey:cropKey},crop:crop,phInfo:phLabel(ph),descriptionCode:descriptionCode(ph),suitability:suitability(ph,crop),targetPH:target,currentPercent:phToPercent(ph),targetPercent:target==null?null:phToPercent(target),optimalRange:crop?{low:crop.optLow,high:crop.optHigh,lowPercent:phToPercent(crop.optLow),highPercent:phToPercent(crop.optHigh)}:null,lime:lime,woodAshRate:ashRate,timingCode:ph<=7.5?'acid-neutral':'alkaline',suitableCropKeys:suitable,marginalCropKeys:marginal};function finiteTree(value){if(typeof value==='number')return Number.isFinite(value);if(value&&typeof value==='object')return Object.keys(value).every(function(key){return finiteTree(value[key]);});return true;}return finiteTree(result)?result:invalid;}

function planLaboratoryLime(input){
var invalid={ok:false,status:'invalid-laboratory-input'};
if(!input||typeof input!=='object'||Array.isArray(input))return invalid;
var number=function(value){return typeof value==='number'&&Number.isFinite(value);};
if(!number(input.recommendedTonnesPerHa)||input.recommendedTonnesPerHa<0||!number(input.farmHa)||input.farmHa<=0||!number(input.laboratoryDepthCm)||input.laboratoryDepthCm<=0||input.sameTreatmentDepthConfirmed!==true)return invalid;
if(input.basis!=='specified-product'&&input.basis!=='effective-neutralizing-value')return invalid;
var ratio=1,reference=null,product=null;
if(input.basis==='specified-product'){if(input.sameProductConfirmed!==true)return{ok:false,status:'laboratory-product-confirmation-required'};}
else{
reference=input.referenceEffectivePercent;product=input.productEffectivePercent;
if(!number(reference)||reference<=0||!number(product)||product<=0)return invalid;
if(input.comparableEffectiveBasisConfirmed!==true)return{ok:false,status:'comparable-effective-basis-required'};
ratio=reference/product;
}
var price=input.pricePerTonne===undefined?null:input.pricePerTonne;
if(price!==null&&(!number(price)||price<0))return invalid;
var currency=input.currency===undefined?'':input.currency;
if(typeof currency!=='string'||(price!==null&&!/^[A-Z]{3}$/.test(currency)))return invalid;
var rate=input.recommendedTonnesPerHa*ratio,total=rate*input.farmHa,cost=price===null?null:total*price;
if(!Number.isFinite(ratio)||!Number.isFinite(rate)||!Number.isFinite(total)||(cost!==null&&!Number.isFinite(cost)))return invalid;
return{ok:true,status:'laboratory-input-plan',input:{basis:input.basis,recommendedTonnesPerHa:input.recommendedTonnesPerHa,farmHa:input.farmHa,laboratoryDepthCm:input.laboratoryDepthCm,sameTreatmentDepthConfirmed:true,sameProductConfirmed:input.basis==='specified-product',referenceEffectivePercent:reference,productEffectivePercent:product,comparableEffectiveBasisConfirmed:input.basis==='effective-neutralizing-value',pricePerTonne:price,currency:currency},productTonnesPerHa:rate,totalProductTonnes:total,totalCost:cost,currency:currency,depthScalingApplied:false,textureScalingApplied:false,recommendationSource:'user-entered-laboratory-recommendation',recommendationIndependentlyVerified:false,scope:'Quantity and cost arithmetic only. Follow the laboratory recommendation for the sampled soil, crop, product, treatment depth, timing and application method. Effective-value adjustment requires matching units, moisture basis and testing methodology; CCE alone is not an effective-value rating.'};
}
return{planLaboratoryLime:planLaboratoryLime,baseLimeRange:baseLimeRange,phLabel:phLabel,phToPercent:phToPercent,suitability:suitability,targetPH:targetPH,limeName:limeName,adjustedRange:adjustedRange,calculate:calculate};}));
