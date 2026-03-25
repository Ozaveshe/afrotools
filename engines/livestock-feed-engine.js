// /engines/livestock-feed-engine.js
// AfroTools — Livestock Feed Calculator Engine
// Formulates balanced rations for cattle, goats and sheep using locally available African feeds.
// Implements NRC-based nutrient requirements with simplified Pearson's Square allocation.
!function(){"use strict";
var E={};

// ── Main calculation function ─────────────────────────────────────────────────
// inputs: { animalType, animalClass, bodyWeight, numAnimals, selectedFeeds[], maxBudget, countryCode }
// data:   window.AfroTools.LivestockFeedData
E.calculate=function(inputs,data){
  var animalData=data[inputs.animalType];
  if(!animalData)return{error:true,msg:"Unknown animal type."};
  var cls=animalData.classes[inputs.animalClass];
  if(!cls)return{error:true,msg:"Unknown animal class."};

  var bw=parseFloat(inputs.bodyWeight)||300;
  var num=parseInt(inputs.numAnimals)||1;
  var prices=data.prices[inputs.countryCode]||{};
  var sym=prices.symbol||'';
  var ing=data.ingredients;

  // ── Step 1: Daily Dry Matter Intake (DMI) ──
  var dmi=bw*cls.dmi_pct/100; // kg DM / day / animal

  // ── Step 2: Nutrient requirements ──
  var cp_req=dmi*cls.cp_pct/100*1000;  // g CP / day
  var tdn_req=dmi*cls.tdn_pct/100*1000;// g TDN / day
  var me_req=dmi*(cls.me_mj||9.0);     // MJ ME / day

  // ── Step 3: Classify selected feeds ──
  var selected=inputs.selectedFeeds||[];
  if(!selected.length)return{error:true,msg:"Please select at least one feed ingredient."};

  var roughages=[],energyFeeds=[],proteinFeeds=[],minerals=[],additives=[];
  selected.forEach(function(id){
    var f=ing[id]; if(!f)return;
    if(f.cat==="roughage")roughages.push(id);
    else if(f.cat==="energy")energyFeeds.push(id);
    else if(f.cat==="protein")proteinFeeds.push(id);
    else if(f.cat==="mineral")minerals.push(id);
    else if(f.cat==="additive")additives.push(id);
  });

  // ── Step 4: Allocate DM across feed groups ──
  var roughPct=cls.roughagePct||0.60;
  // Reserve 1.5% for minerals, 0.5% for additives
  var minPct=Math.min(0.015*minerals.length,0.03);
  var addPct=Math.min(0.005*additives.length,0.01);
  var concPct=1-roughPct-minPct-addPct;

  // If no roughage selected, shift all to concentrate
  if(!roughages.length){concPct+=roughPct;roughPct=0;}
  // If no concentrate, shift all to roughage
  if(!energyFeeds.length&&!proteinFeeds.length){roughPct+=concPct;concPct=0;}

  // Concentrate split: 65% energy / 35% protein (by DM)
  var energyPct=concPct*0.65;
  var proteinPct=concPct*0.35;
  if(!energyFeeds.length){proteinPct+=energyPct;energyPct=0;}
  if(!proteinFeeds.length){energyPct+=proteinPct;proteinPct=0;}

  var dmRoughage =roughPct*dmi;
  var dmEnergy   =energyPct*dmi;
  var dmProtein  =proteinPct*dmi;
  var dmMinerals =minPct*dmi;
  var dmAdditives=addPct*dmi;

  // ── Step 5: Build ration ──
  var ration=[];
  var cp_prov=0,tdn_prov=0,totalCost=0;

  function addFeed(id,dmKg){
    var f=ing[id]; if(!f||dmKg<=0)return;
    var freshKg=dmKg/(f.dm/100);
    var cp_g=(f.cp||0)*dmKg/100*1000;
    var tdn_g=(f.tdn||0)*dmKg/100*1000;
    var price=prices[id]||0;
    // Price is per kg fresh (as-purchased). For nearly-dry feeds (dm≥85), cost is nearly same as per kg DM.
    var cost=freshKg*price;
    cp_prov+=cp_g; tdn_prov+=tdn_g; totalCost+=cost;
    ration.push({id:id,name:f.name,cat:f.cat,freshKg:R(freshKg,2),dmKg:R(dmKg,2),cp_g:R(cp_g,0),tdn_g:R(tdn_g,0),cost:R(cost,2),pricePerKg:price,dm:f.dm,notes:f.notes||""});
  }

  // Distribute evenly within each group
  if(roughages.length&&dmRoughage>0){var d=dmRoughage/roughages.length;roughages.forEach(function(id){addFeed(id,d);});}
  if(energyFeeds.length&&dmEnergy>0){var d=dmEnergy/energyFeeds.length;energyFeeds.forEach(function(id){addFeed(id,d);});}
  if(proteinFeeds.length&&dmProtein>0){var d=dmProtein/proteinFeeds.length;proteinFeeds.forEach(function(id){addFeed(id,d);});}
  // Minerals: fixed small allocations
  minerals.forEach(function(id){addFeed(id,dmMinerals/Math.max(minerals.length,1));});
  additives.forEach(function(id){addFeed(id,dmAdditives/Math.max(additives.length,1));});

  // ── Step 6: Nutritional balance check ──
  var cp_ok=cp_prov>=cp_req*0.90;
  var tdn_ok=tdn_prov>=tdn_req*0.90;
  var cp_pct_diet=R(cp_prov/(dmi*10),1); // % on DM basis
  var tdn_pct_diet=R(tdn_prov/(dmi*10),1);

  // ── Step 7: Cost summary ──
  var dailyPerAnimal=R(totalCost,2);
  var dailyTotal=R(totalCost*num,2);
  var monthlyPerAnimal=R(totalCost*30,2);
  var monthlyTotal=R(totalCost*num*30,2);
  var annualTotal=R(totalCost*num*365,0);

  var overBudget=!!(inputs.maxBudget&&parseFloat(inputs.maxBudget)>0&&dailyPerAnimal>parseFloat(inputs.maxBudget));

  // ── Step 8: Alternative ration (cheaper using more low-cost roughage) ──
  var alt=E._altRation(inputs,data,dmi,cls,roughages,energyFeeds,proteinFeeds,minerals,additives,prices,ing);

  // ── Step 9: Feeding schedule ──
  var schedule=E._schedule(ration);

  return{
    ok:true,
    animalType:inputs.animalType,
    animalClass:cls.label||inputs.animalClass,
    bodyWeight:bw,numAnimals:num,
    dmi:R(dmi,2),
    req:{cp_g:R(cp_req,0),tdn_g:R(tdn_req,0),me_mj:R(me_req,1)},
    prov:{cp_g:R(cp_prov,0),tdn_g:R(tdn_prov,0),cp_pct_diet:cp_pct_diet,tdn_pct_diet:tdn_pct_diet},
    balance:{cp_ok:cp_ok,tdn_ok:tdn_ok},
    ration:ration,
    costs:{dailyPerAnimal:dailyPerAnimal,dailyTotal:dailyTotal,monthlyPerAnimal:monthlyPerAnimal,monthlyTotal:monthlyTotal,annualTotal:annualTotal},
    currency:prices.currency||'',
    symbol:sym,
    alt:alt,
    schedule:schedule,
    overBudget:overBudget,
    countryNote:prices.note||""
  };
};

// ── Alternative ration: more roughage, cheapest feeds ────────────────────────
E._altRation=function(inputs,data,dmi,cls,roughages,energyFeeds,proteinFeeds,minerals,additives,prices,ing){
  // Use 70% roughage if possible, else current roughage level
  var rPct=Math.min(0.70,Math.max(cls.roughagePct,0.55));
  if(!roughages.length)rPct=0;
  var cPct=1-rPct-0.02;
  var ePct=cPct*0.65,pPct=cPct*0.35;
  if(!energyFeeds.length){pPct+=ePct;ePct=0;}
  if(!proteinFeeds.length){ePct+=pPct;pPct=0;}

  var items=[];
  var totalCost=0,cp_prov=0,tdn_prov=0;

  // Cheapest roughage(s)
  var sortedR=roughages.slice().sort(function(a,b){return (prices[a]||0)-(prices[b]||0);});
  var useR=sortedR.slice(0,Math.min(2,sortedR.length));
  if(useR.length){
    var d=rPct*dmi/useR.length;
    useR.forEach(function(id){
      var f=ing[id];var freshKg=d/(f.dm/100);var cost=freshKg*(prices[id]||0);
      var cp_g=(f.cp||0)*d/100*1000;var tdn_g=(f.tdn||0)*d/100*1000;
      cp_prov+=cp_g;tdn_prov+=tdn_g;totalCost+=cost;
      items.push({name:f.name,freshKg:R(freshKg,2),dmKg:R(d,2),cost:R(cost,2)});
    });
  }
  // Cheapest energy
  var sortedE=energyFeeds.slice().sort(function(a,b){return (prices[a]||0)-(prices[b]||0);});
  var useE=sortedE.slice(0,Math.min(2,sortedE.length));
  if(useE.length&&ePct>0){
    var d=ePct*dmi/useE.length;
    useE.forEach(function(id){
      var f=ing[id];var freshKg=d/(f.dm/100);var cost=freshKg*(prices[id]||0);
      var cp_g=(f.cp||0)*d/100*1000;var tdn_g=(f.tdn||0)*d/100*1000;
      cp_prov+=cp_g;tdn_prov+=tdn_g;totalCost+=cost;
      items.push({name:f.name,freshKg:R(freshKg,2),dmKg:R(d,2),cost:R(cost,2)});
    });
  }
  // Cheapest protein
  var sortedP=proteinFeeds.slice().sort(function(a,b){return (prices[a]||0)-(prices[b]||0);});
  var useP=sortedP.slice(0,Math.min(2,sortedP.length));
  if(useP.length&&pPct>0){
    var d=pPct*dmi/useP.length;
    useP.forEach(function(id){
      var f=ing[id];var freshKg=d/(f.dm/100);var cost=freshKg*(prices[id]||0);
      var cp_g=(f.cp||0)*d/100*1000;var tdn_g=(f.tdn||0)*d/100*1000;
      cp_prov+=cp_g;tdn_prov+=tdn_g;totalCost+=cost;
      items.push({name:f.name,freshKg:R(freshKg,2),dmKg:R(d,2),cost:R(cost,2)});
    });
  }
  // Salt always
  if(ing["salt"]){
    var saltDM=dmi*0.005;var saltFresh=saltDM;var saltCost=saltFresh*(prices["salt"]||0);
    totalCost+=saltCost;items.push({name:"Common salt",freshKg:R(saltFresh,3),dmKg:R(saltDM,3),cost:R(saltCost,2)});
  }
  return{items:items,dailyCost:R(totalCost,2),cp_g:R(cp_prov,0),tdn_g:R(tdn_prov,0)};
};

// ── Feeding schedule ──────────────────────────────────────────────────────────
E._schedule=function(ration){
  var roughage=ration.filter(function(r){return r.cat==="roughage";});
  var concentrate=ration.filter(function(r){return r.cat==="energy"||r.cat==="protein";});
  var minerals=ration.filter(function(r){return r.cat==="mineral"||r.cat==="additive";});

  var morning=[],evening=[];
  concentrate.forEach(function(r,i){if(i%2===0)morning.push(r);else evening.push(r);});
  roughage.forEach(function(r,i){if(i%2===0)morning.push(r);else evening.push(r);});
  minerals.forEach(function(r){morning.push(r);}); // minerals with morning feed

  return[
    {period:"Morning (6–7 am)",items:morning,note:"Mix concentrates and minerals. Offer fresh roughage after concentrates."},
    {period:"Midday",items:[],note:"Ensure clean fresh water is always available. Provide salt lick free-choice."},
    {period:"Evening (5–6 pm)",items:evening,note:"Remaining concentrates + ad-lib roughage overnight."}
  ];
};

// ── Utility ──────────────────────────────────────────────────────────────────
function R(n,d){if(typeof n!=="number"||isNaN(n))return 0;return Math.round(n*Math.pow(10,d||0))/Math.pow(10,d||0);}
E.fmt=function(n,d){if(typeof n!=="number"||isNaN(n))return "0";return n.toLocaleString(undefined,{minimumFractionDigits:d||0,maximumFractionDigits:d||2});};
E.fmtCurrency=function(n,sym){return(sym||"")+" "+E.fmt(n,2);};

window.AfroTools=window.AfroTools||{};
window.AfroTools.LivestockFeedEngine=E;
}();
