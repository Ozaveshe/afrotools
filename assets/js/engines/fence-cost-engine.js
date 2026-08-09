(function(root,factory){"use strict";var api=factory();if(typeof module==="object"&&module.exports)module.exports=api;if(root){root.AfroTools=root.AfroTools||{};root.AfroTools.FenceCostEngine=api}})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
var KEYS=["block_render","block_plain","chain_link","barbed_wire","electric","wooden_palisade","metal_palisade"];
var GATES=["manual_single","manual_double","sliding","boom"],TOPPINGS=["none","barbed","razor"];
function country(sym,values,gates,toppings){var types={};KEYS.forEach(function(key,index){types[key]={material:values[index*2],labour:values[index*2+1]}});return{symbol:sym,types:types,gates:{manual_single:gates[0],manual_double:gates[1],sliding:gates[2],boom:gates[3]},toppings:{barbed:toppings[0],razor:toppings[1]}}}
var RATES={
NG:country("NGN",[18000,8000,13000,6000,5500,2000,1800,800,9000,4000,4500,2000,12000,5000],[120000,200000,650000,450000],[900,2500]),
KE:country("KES",[7500,3000,5500,2200,2200,800,700,300,3500,1500,1800,800,5000,2000],[50000,85000,280000,200000],[350,1000]),
ZA:country("ZAR",[2200,900,1600,700,650,250,200,90,1100,450,550,230,1500,600],[15000,25000,80000,55000],[100,280]),
GH:country("GHS",[1800,700,1300,500,500,200,160,70,900,350,450,180,1200,480],[12000,20000,65000,45000],[80,220]),
EG:country("EGP",[2000,800,1400,550,600,220,180,75,950,380,480,190,1300,520],[13000,22000,70000,48000],[90,240]),
ET:country("ETB",[5000,2000,3500,1400,1500,550,450,180,2400,950,1200,480,3200,1280],[32000,55000,175000,120000],[220,600]),
TZ:country("TZS",[180000,72000,130000,52000,55000,20000,17000,7000,90000,36000,45000,18000,120000,48000],[1200000,2000000,6500000,4500000],[8500,23000]),
UG:country("UGX",[240000,96000,170000,68000,72000,26000,22000,9000,115000,46000,58000,23000,155000,62000],[1600000,2700000,8500000,6000000],[11000,30000]),
RW:country("RWF",[40000,16000,28000,11000,12000,4500,3800,1500,19000,7600,9600,3800,26000,10400],[260000,450000,1400000,1000000],[1900,5200]),
MA:country("MAD",[1000,400,700,280,300,110,90,38,480,190,240,96,640,256],[6500,11000,35000,24000],[45,120])};
function number(value){if(value===""||value===null||typeof value==="undefined")return NaN;return Number(value)}
function calculate(input){input=input||{};var rate=RATES[input.country],length=number(input.length),height=number(input.height),gates=number(input.gates),type=input.type,gateType=input.gateType,topping=input.topping;if(!rate||!Number.isFinite(length)||length<=0||!Number.isFinite(height)||height<=0||!Number.isInteger(gates)||gates<0||gates>10||!KEYS.includes(type)||!GATES.includes(gateType)||!TOPPINGS.includes(topping))return{ok:false,code:"invalid-fence-input"};var factor=height/1.8,material=rate.types[type].material*length*factor,labour=rate.types[type].labour*length*factor,gate=gates*rate.gates[gateType],top=topping==="none"?0:rate.toppings[topping]*length,total=material+labour+gate+top;return{ok:true,currency:rate.symbol,length:length,height:height,type:type,gates:gates,gateType:gateType,topping:topping,heightFactor:factor,materialCost:material,labourCost:labour,gateCost:gate,toppingCost:top,total:total,costPerMetre:total/length,workDays:Math.ceil(length/10),snapshot:"legacy-undated",stale:true,confidence:"low",sourceStatus:"unverified-embedded-planning-rates"}}
return{calculate:calculate,rates:RATES,typeKeys:KEYS,gateKeys:GATES,toppingKeys:TOPPINGS};});
