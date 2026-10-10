!function() {
  "use strict";
  function e(e, r) {
    return null == e || isNaN(e) ? "—" : Number(e).toLocaleString("en", {
      minimumFractionDigits: r || 0,
      maximumFractionDigits: void 0 !== r ? r : 0
    });
  }
  function r(e, r) {
    var n = COFFEE_DATA.gradingSystems[e];
    if (!n) {
      return null;
    }
    for (var i = 0; i < n.grades.length; i++) {
      if (n.grades[i].grade === r) {
        return n.grades[i];
      }
    }
    return null;
  }
  function countryIdentity(value){return {name:value.name,currency:value.currency,species:value.species.slice()};}
  function gradeIdentity(value){var output={};['grade','name','defects','cupScore','screenSize','price_premium_pct'].forEach(function(key){if(Object.prototype.hasOwnProperty.call(value,key))output[key]=value[key];});return output;}
  function processingBreakdown(cherryKg, greenKg, method, ratioInput) {
    var cost = COFFEE_DATA.processingCosts[method];
    // Four is an illustrative conversion inherited from the existing washed model,
    // not a measured yield. Callers may supply their own positive ratio.
    var ratio = ratioInput == null ? 4 : Number(ratioInput);
    var parchmentKg = method === 'natural' ? null : cherryKg / ratio;
    var preparationRate = method === 'washed' ? cost.wetMillPerKgCherry : method === 'honey' ? cost.pulpingPerKgCherry : cost.dryingBedsPerKgCherry;
    var dryingRate = method === 'washed' ? cost.parchmentDryingPerKgParch : method === 'honey' ? cost.dryingPerKgParch : 0;
    var dryingCost = parchmentKg === null ? 0 : parchmentKg * dryingRate;
    var stages = [{step:1,name:method==='washed'?'Wet Milling & Fermentation':method==='honey'?'Pulping':'Sun Drying on Raised Beds',costUSD:cherryKg*preparationRate,inputKg:cherryKg,unitNote:'per kg cherry'}];
    if(parchmentKg!==null)stages.push({step:stages.length+1,name:'Parchment Drying',costUSD:dryingCost,inputKg:parchmentKg,unitNote:'per kg parchment; assumed conversion'});
    [['Hulling / Milling',cost.hullingPerKgGreen||cost.hullingSkinPerKgGreen||0],['Grading & Sorting',cost.gradingPerKgGreen],['Transport to Export Port',cost.transportPerKgGreen]].forEach(function(row){stages.push({step:stages.length+1,name:row[0],costUSD:greenKg*row[1],inputKg:greenKg,unitNote:'per kg green'});});
    return {stages:stages,totalCostUSD:stages.reduce(function(total,stage){return total+stage.costUSD;},0),parchmentKg:parchmentKg,parchmentDryingCostUSD:dryingCost,cherryToParchmentRatio:parchmentKg===null?null:ratio,conversionBasis:parchmentKg===null?'not-applicable':ratioInput==null?'illustrative-default-4-to-1':'user-entered'};
  }
  window.AfroTools = window.AfroTools || {}, window.AfroTools.CoffeeEngine = {
    fmt: e,
    fmtUSD: function(r) {
      return r || 0 === r ? "$" + e(r, 2) : "—";
    },
    gradeInfo: function(e, n) {
      var i = COFFEE_DATA.gradingSystems[e];
      if (!i) {
        return null;
      }
      var t = r(e, n);
      return t ? {
        country: countryIdentity(i),
        grade: gradeIdentity(t),
        basePrice_arabica: COFFEE_DATA.prices.arabica_per_kg_USD,
        basePrice_robusta: COFFEE_DATA.prices.robusta_per_kg_USD,
        estimatedExportPrice: COFFEE_DATA.prices["arabica" === i.species[0] ? "arabica_per_kg_USD" : "robusta_per_kg_USD"] * (1 + (t.price_premium_pct || 0) / 100)
      } : null;
    },
    calcYield: function(e) {
      var n = COFFEE_DATA.agronomy[e.species];
      if (!n) {
        return null;
      }
      var i = n.yieldPerTree_kg_cherry[e.yieldLevel] || n.yieldPerTree_kg_cherry.average, t = parseFloat(e.treesPerHa) || n.treesPerHa.semi_intensive, a = parseFloat(e.farmHa) || 1, s = t * i, g = "natural" === e.processingMethod ? n.cherryToGreen_natural : n.cherryToGreen_ratio, o = s / g, c = s * a, p = o * a, u = e.basePricePerKgUSD == null ? COFFEE_DATA.prices["arabica" === e.species ? "arabica_per_kg_USD" : "robusta_per_kg_USD"] : Number(e.basePricePerKgUSD), l = r(e.countryCode, e.gradeId), _ = l && l.price_premium_pct || 0, D = COFFEE_DATA.gradingSystems[e.countryCode], m = 0, d = parseInt(e.regionIdx);
      D && D.regions && d >= 0 && d < D.regions.length && (m = D.regions[d].premium_pct || 0);
      var F = u * (1 + _ / 100) * (1 + m / 100), y = p * F, A = processingBreakdown(c,p,e.processingMethod,e.cherryToParchmentRatio), E = A.totalCostUSD, S = y - E, P = D ? D.grades[0] : null, h = u * (1 + (P ? P.price_premium_pct || 0 : _) / 100) * (1 + m / 100), C = p * h;
      return {
        treesPerHa: t,
        farmHa: a,
        species: e.species,
        processingMethod: e.processingMethod,
        cherryKgPerHa: s,
        totalCherryKg: c,
        conversionRatio: g,
        greenKgPerHa: o,
        totalGreenKg: p,
        basePrice: u,
        gradePremiumPct: _,
        regionPremiumPct: m,
        effectivePrice: F,
        grossRevenueUSD: y,
        processingCostUSD: E,
        processingStages: A.stages,
        parchmentKg: A.parchmentKg,
        parchmentDryingCostUSD: A.parchmentDryingCostUSD,
        cherryToParchmentRatio: A.cherryToParchmentRatio,
        conversionBasis: A.conversionBasis,
        revenueBasis: 'export-reference-less-processing-only',
        excludedCosts: ['farm-production-costs','taxes','financing','other-unentered-costs'],
        netRevenueUSD: S,
        revenuePerHaUSD: S / a,
        potentialPriceUSD: h,
        potentialRevenueUSD: C,
        revenueUpliftUSD: C - y
      };
    },
    qualityImprovement: function(e, n, i, t, options) {
      var a = COFFEE_DATA.gradingSystems[e];
      if (!a) {
        return null;
      }
      var s = r(e, n), g = r(e, i);
      if (!s || !g) {
        return null;
      }
      var o = (g.price_premium_pct || 0) - (s.price_premium_pct || 0), c = a.species[0], p = (COFFEE_DATA.agronomy[c],
      options && options.annualGreenKg != null ? Number(options.annualGreenKg) : (a.avgYield_kg_ha ? a.avgYield_kg_ha / 5 : 150) * t), u = options && options.basePricePerKgUSD != null ? Number(options.basePricePerKgUSD) : COFFEE_DATA.prices["arabica" === c ? "arabica_per_kg_USD" : "robusta_per_kg_USD"], l = u * (1 + (s.price_premium_pct || 0) / 100), _ = u * (1 + (g.price_premium_pct || 0) / 100);
      return {
        country: countryIdentity(a),
        currentGrade: gradeIdentity(s),
        targetGrade: gradeIdentity(g),
        isPossible: o > 0,
        premiumDiff: o,
        currentPriceUSD: l,
        targetPriceUSD: _,
        estimatedGreenKg: p,
        volumeBasis: options && options.annualGreenKg != null ? "user-entered-total-green-kg" : "illustrative-volume-from-static-reference",
        basePricePerKgUSD: u,
        annualUpliftUSD: p * (_ - l),
        steps: [
          {action:'Document the current lot',detail:'Record measured weight, processing method and independent sample assessment.'},
          {action:'Verify the target specification',detail:'Obtain the buyer or grading authority requirements before selecting changes.'},
          {action:'Plan a measured trial',detail:'Agree processing and storage controls with a qualified local adviser; record the trial results.'},
          {action:'Compare full costs and offers',detail:'Include extra labour, inputs, processing losses and assessment costs; obtain a written buyer offer.'}
        ],
        countryDefectNote: null,
        assumptionStatus: "static-unverified-premiums-and-volume",
        qualityOutcomeGuaranteed: false
      };
    },
    processingCost: function(quantity,method,species,options) {
      var cherryKg=Number(quantity),key=species||'arabica',agronomy=COFFEE_DATA.agronomy[key];
      var conversion=method==='natural'?agronomy.cherryToGreen_natural:agronomy.cherryToGreen_ratio;
      var greenKg=cherryKg/conversion,cost=processingBreakdown(cherryKg,greenKg,method,options&&options.cherryToParchmentRatio);
      var price=options&&options.basePricePerKgUSD!=null?Number(options.basePricePerKgUSD):COFFEE_DATA.prices[key==='arabica'?'arabica_per_kg_USD':'robusta_per_kg_USD'],gross=greenKg*price,margin=gross-cost.totalCostUSD;
      return {cherryKg:cherryKg,parchKg:cost.parchmentKg,greenKg:greenKg,conversionRatio:conversion,method:method,stages:cost.stages,totalCostUSD:cost.totalCostUSD,costPerGreenKgUSD:cost.totalCostUSD/greenKg,grossRevenueUSD:gross,marginUSD:margin,marginPct:gross>0?margin/gross*100:0,exportPriceUSD:price,parchmentDryingCostUSD:cost.parchmentDryingCostUSD,cherryToParchmentRatio:cost.cherryToParchmentRatio,conversionBasis:cost.conversionBasis,revenueBasis:'export-reference-less-processing-only',excludedCosts:['farm-production-costs','taxes','financing','other-unentered-costs']};
    }
  };

  // Validate public calculation boundaries before the legacy arithmetic runs.
  function own(o,k){return !!o&&Object.prototype.hasOwnProperty.call(o,k);}
  function finiteNumber(v){return (typeof v==='number'||typeof v==='string'&&v.trim()!=='')&&Number.isFinite(Number(v));}
  function nonnegative(v){return finiteNumber(v)&&Number(v)>=0;}
  function positive(v){return finiteNumber(v)&&Number(v)>0;}
  function country(code){return own(COFFEE_DATA.gradingSystems,code)?COFFEE_DATA.gradingSystems[code]:null;}
  function grade(code,id){var c=country(code);return !!c&&c.grades.some(function(g){return g.grade===id;});}
  function finiteOutput(v){if(typeof v==='number')return Number.isFinite(v);if(v&&typeof v==='object')return Object.keys(v).every(function(k){return finiteOutput(v[k]);});return true;}
  var api=window.AfroTools.CoffeeEngine;
  function guard(name,valid){var original=api[name];api[name]=function(){if(!valid.apply(null,arguments))return null;var args=Array.prototype.slice.call(arguments);if(name==='calcYield'){args[0]=Object.assign({},args[0]);['treesPerHa','farmHa','regionIdx'].forEach(function(k){args[0][k]=Number(args[0][k]);});}if(name==='qualityImprovement')args[3]=Number(args[3]);if(name==='processingCost')args[0]=Number(args[0]);var result=original.apply(null,args);if(result)result.referenceStatus='static-undated-planning-assumptions';return finiteOutput(result)?result:null;};}
  guard('gradeInfo',function(code,id){return grade(code,id);});
  guard('calcYield',function(v){if(!v||typeof v!=='object'||Array.isArray(v))return false;var c=country(v.countryCode),a=own(COFFEE_DATA.agronomy,v.species)?COFFEE_DATA.agronomy[v.species]:null;return !!c&&!!a&&c.species.indexOf(v.species)>=0&&grade(v.countryCode,v.gradeId)&&own(a.yieldPerTree_kg_cherry,v.yieldLevel)&&own(COFFEE_DATA.processingCosts,v.processingMethod)&&(v.basePricePerKgUSD==null||nonnegative(v.basePricePerKgUSD))&&(v.cherryToParchmentRatio==null||positive(v.cherryToParchmentRatio))&&positive(v.treesPerHa)&&positive(v.farmHa)&&finiteNumber(v.regionIdx)&&Number.isInteger(Number(v.regionIdx))&&Number(v.regionIdx)>=0&&Number(v.regionIdx)<c.regions.length;});
  guard('qualityImprovement',function(code,current,target,area,options){return grade(code,current)&&grade(code,target)&&positive(area)&&(options==null||typeof options==='object'&&!Array.isArray(options)&&(options.annualGreenKg==null||nonnegative(options.annualGreenKg))&&(options.basePricePerKgUSD==null||nonnegative(options.basePricePerKgUSD)));});
  guard('processingCost',function(quantity,method,species,options){return (options==null||typeof options==='object'&&!Array.isArray(options)&&(options.cherryToParchmentRatio==null||positive(options.cherryToParchmentRatio))&&(options.basePricePerKgUSD==null||nonnegative(options.basePricePerKgUSD)))&&positive(quantity)&&own(COFFEE_DATA.processingCosts,method)&&own(COFFEE_DATA.agronomy,species==null?'arabica':species);});
}();
