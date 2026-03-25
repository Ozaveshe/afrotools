// /engines/crop-rotation-engine.js
// AfroTools — Crop Rotation Planner Engine
// Pan-African, based on documented agronomic research from African field trials
!function(){"use strict";

var ROTATION_DATA = {
  cropProperties: {
    // Cereals
    "maize":    { group:"cereal",  family:"Poaceae",      rootDepth:"medium",  nutrientDemand:"heavy",  nFixer:false, diseaseGroup:"cereal_A", residueQuality:"low",    marketValue:"medium" },
    "rice":     { group:"cereal",  family:"Poaceae",      rootDepth:"shallow", nutrientDemand:"heavy",  nFixer:false, diseaseGroup:"cereal_B", residueQuality:"low",    marketValue:"medium" },
    "sorghum":  { group:"cereal",  family:"Poaceae",      rootDepth:"deep",    nutrientDemand:"medium", nFixer:false, diseaseGroup:"cereal_A", residueQuality:"low",    marketValue:"low" },
    "millet":   { group:"cereal",  family:"Poaceae",      rootDepth:"deep",    nutrientDemand:"low",    nFixer:false, diseaseGroup:"cereal_A", residueQuality:"low",    marketValue:"low" },
    "wheat":    { group:"cereal",  family:"Poaceae",      rootDepth:"medium",  nutrientDemand:"heavy",  nFixer:false, diseaseGroup:"cereal_C", residueQuality:"low",    marketValue:"high" },
    "teff":     { group:"cereal",  family:"Poaceae",      rootDepth:"shallow", nutrientDemand:"medium", nFixer:false, diseaseGroup:"cereal_C", residueQuality:"low",    marketValue:"high" },
    "barley":   { group:"cereal",  family:"Poaceae",      rootDepth:"medium",  nutrientDemand:"medium", nFixer:false, diseaseGroup:"cereal_C", residueQuality:"low",    marketValue:"medium" },
    "fonio":    { group:"cereal",  family:"Poaceae",      rootDepth:"shallow", nutrientDemand:"low",    nFixer:false, diseaseGroup:"cereal_A", residueQuality:"low",    marketValue:"medium" },
    // Legumes
    "cowpea":          { group:"legume", family:"Fabaceae", rootDepth:"medium",  nutrientDemand:"low",    nFixer:true, nFixed:32,  diseaseGroup:"legume_A", residueQuality:"high",   marketValue:"medium" },
    "groundnut":       { group:"legume", family:"Fabaceae", rootDepth:"medium",  nutrientDemand:"low",    nFixer:true, nFixed:67,  diseaseGroup:"legume_B", residueQuality:"high",   marketValue:"high" },
    "soybean":         { group:"legume", family:"Fabaceae", rootDepth:"medium",  nutrientDemand:"medium", nFixer:true, nFixed:80,  diseaseGroup:"legume_C", residueQuality:"high",   marketValue:"high" },
    "common_bean":     { group:"legume", family:"Fabaceae", rootDepth:"shallow", nutrientDemand:"medium", nFixer:true, nFixed:30,  diseaseGroup:"legume_A", residueQuality:"high",   marketValue:"medium" },
    "pigeon_pea":      { group:"legume", family:"Fabaceae", rootDepth:"deep",    nutrientDemand:"low",    nFixer:true, nFixed:40,  diseaseGroup:"legume_D", residueQuality:"high",   marketValue:"medium" },
    "chickpea":        { group:"legume", family:"Fabaceae", rootDepth:"deep",    nutrientDemand:"low",    nFixer:true, nFixed:45,  diseaseGroup:"legume_E", residueQuality:"high",   marketValue:"high" },
    "lentils":         { group:"legume", family:"Fabaceae", rootDepth:"shallow", nutrientDemand:"low",    nFixer:true, nFixed:35,  diseaseGroup:"legume_E", residueQuality:"high",   marketValue:"high" },
    "bambara_groundnut":{ group:"legume",family:"Fabaceae", rootDepth:"medium",  nutrientDemand:"low",    nFixer:true, nFixed:83,  diseaseGroup:"legume_B", residueQuality:"high",   marketValue:"medium" },
    // Roots & Tubers
    "cassava":      { group:"root", family:"Euphorbiaceae",  rootDepth:"deep",    nutrientDemand:"medium", nFixer:false, diseaseGroup:"root_A",     residueQuality:"low",    marketValue:"medium" },
    "yam":          { group:"root", family:"Dioscoreaceae",  rootDepth:"deep",    nutrientDemand:"heavy",  nFixer:false, diseaseGroup:"root_B",     residueQuality:"low",    marketValue:"high" },
    "sweet_potato": { group:"root", family:"Convolvulaceae", rootDepth:"medium",  nutrientDemand:"medium", nFixer:false, diseaseGroup:"root_C",     residueQuality:"medium", marketValue:"medium" },
    "potato":       { group:"root", family:"Solanaceae",     rootDepth:"shallow", nutrientDemand:"heavy",  nFixer:false, diseaseGroup:"solanaceae", residueQuality:"low",    marketValue:"high" },
    // Vegetables
    "tomato":  { group:"vegetable", family:"Solanaceae",  rootDepth:"medium",  nutrientDemand:"heavy", nFixer:false, diseaseGroup:"solanaceae", residueQuality:"medium", marketValue:"high" },
    "onion":   { group:"vegetable", family:"Alliaceae",   rootDepth:"shallow", nutrientDemand:"medium",nFixer:false, diseaseGroup:"allium",     residueQuality:"low",    marketValue:"high" },
    "pepper":  { group:"vegetable", family:"Solanaceae",  rootDepth:"medium",  nutrientDemand:"heavy", nFixer:false, diseaseGroup:"solanaceae", residueQuality:"medium", marketValue:"high" },
    "cabbage": { group:"vegetable", family:"Brassicaceae",rootDepth:"shallow", nutrientDemand:"heavy", nFixer:false, diseaseGroup:"brassica",   residueQuality:"medium", marketValue:"medium" },
    // Cash crops
    "cotton":    { group:"cash", family:"Malvaceae",   rootDepth:"deep",   nutrientDemand:"heavy",  nFixer:false, diseaseGroup:"cotton",    residueQuality:"low", marketValue:"high" },
    "sesame":    { group:"cash", family:"Pedaliaceae", rootDepth:"deep",   nutrientDemand:"low",    nFixer:false, diseaseGroup:"sesame",    residueQuality:"low", marketValue:"high" },
    "sunflower": { group:"cash", family:"Asteraceae",  rootDepth:"deep",   nutrientDemand:"medium", nFixer:false, diseaseGroup:"sunflower", residueQuality:"low", marketValue:"medium" },
    "tobacco":   { group:"cash", family:"Solanaceae",  rootDepth:"medium", nutrientDemand:"heavy",  nFixer:false, diseaseGroup:"solanaceae",residueQuality:"low", marketValue:"high" },
    // Additional crops in country-index topCrops
    "sugar_cane":    { group:"cash", family:"Poaceae",       rootDepth:"deep",   nutrientDemand:"heavy",  nFixer:false, diseaseGroup:"cereal_A", residueQuality:"low", marketValue:"medium" },
    "oil_palm":      { group:"cash", family:"Arecaceae",     rootDepth:"deep",   nutrientDemand:"medium", nFixer:false, diseaseGroup:"palm",     residueQuality:"low", marketValue:"high" },
    "cocoa":         { group:"cash", family:"Malvaceae",     rootDepth:"deep",   nutrientDemand:"medium", nFixer:false, diseaseGroup:"cocoa",    residueQuality:"low", marketValue:"high" },
    "coffee_arabica":{ group:"cash", family:"Rubiaceae",     rootDepth:"deep",   nutrientDemand:"medium", nFixer:false, diseaseGroup:"coffee",   residueQuality:"low", marketValue:"high" },
    "coffee_robusta":{ group:"cash", family:"Rubiaceae",     rootDepth:"deep",   nutrientDemand:"medium", nFixer:false, diseaseGroup:"coffee",   residueQuality:"low", marketValue:"high" },
    "plantain":      { group:"root", family:"Musaceae",      rootDepth:"medium", nutrientDemand:"heavy",  nFixer:false, diseaseGroup:"banana",   residueQuality:"medium", marketValue:"medium" },
    "banana":        { group:"root", family:"Musaceae",      rootDepth:"medium", nutrientDemand:"heavy",  nFixer:false, diseaseGroup:"banana",   residueQuality:"medium", marketValue:"medium" },
    "cashew":        { group:"cash", family:"Anacardiaceae", rootDepth:"deep",   nutrientDemand:"low",    nFixer:false, diseaseGroup:"cashew",   residueQuality:"low", marketValue:"high" }
  },

  // Score: 10=excellent, 7=good, 5=neutral, 3=poor, 1=very bad
  rotationScore: {
    after_cereal:    { legume:10, root:8, vegetable:6, cash:5, cereal:2 },
    after_legume:    { cereal:10, root:7, vegetable:8, cash:7, legume:3 },
    after_root:      { cereal:8,  legume:9, vegetable:6, cash:6, root:2 },
    after_vegetable: { cereal:7,  legume:8, root:7,  cash:6, vegetable:3 },
    after_cash:      { legume:10, cereal:7, root:6,  vegetable:5, cash:2 }
  },

  avoidSequences: [
    { crop1:"tomato",   crop2:"potato",   reason:"Same family (Solanaceae). Shares late blight, bacterial wilt, nematodes." },
    { crop1:"tomato",   crop2:"pepper",   reason:"Same family (Solanaceae). Shares bacterial wilt, viruses." },
    { crop1:"tomato",   crop2:"tobacco",  reason:"Same family (Solanaceae). Tobacco mosaic virus persists in soil." },
    { crop1:"potato",   crop2:"pepper",   reason:"Same family (Solanaceae). Shares late blight pathogens." },
    { crop1:"potato",   crop2:"tobacco",  reason:"Same family (Solanaceae). Shared Solanaceae diseases." },
    { crop1:"maize",    crop2:"maize",    reason:"Stalk borer, fall armyworm, Striga buildup. Soil N depletion." },
    { crop1:"maize",    crop2:"sorghum",  reason:"Same grass family (Poaceae). Shares stem borers and Striga." },
    { crop1:"sorghum",  crop2:"millet",   reason:"Same grass tribe. Shares stem borers and head smut." },
    { crop1:"rice",     crop2:"rice",     reason:"Blast disease buildup. Iron toxicity in continuously flooded paddies." },
    { crop1:"wheat",    crop2:"wheat",    reason:"Rust disease buildup (Puccinia). Hessian fly. Reduces yields 30%+." },
    { crop1:"cassava",  crop2:"cassava",  reason:"Cassava mosaic virus, mealybug buildup. Severe K depletion." },
    { crop1:"yam",      crop2:"yam",      reason:"Nematode and rot disease buildup. Yam requires fresh fertile soil." },
    { crop1:"cotton",   crop2:"cotton",   reason:"Bollworm, Fusarium wilt, nematode buildup." },
    { crop1:"groundnut",crop2:"groundnut",reason:"Aflatoxin risk increases. Rosette virus, leaf spot disease." },
    { crop1:"onion",    crop2:"onion",    reason:"Onion white rot persists in soil 15+ years. Purple blotch." },
    { crop1:"cabbage",  crop2:"cabbage",  reason:"Clubroot, black rot. All brassicas share soil diseases." }
  ],

  intercrops: {
    "maize":    [{ crop:"cowpea",       note:"Classic West Africa intercrop. Cowpea fixes N, shades weeds." },
                 { crop:"common_bean",  note:"Classic East Africa intercrop. Beans climb maize stalks." },
                 { crop:"groundnut",    note:"Groundnut fixes N, provides ground cover." },
                 { crop:"cassava",      note:"Cassava takes over after maize is harvested (Central Africa)." }],
    "sorghum":  [{ crop:"cowpea",       note:"Sahel classic. Cowpea fixes N; both are drought-tolerant." },
                 { crop:"groundnut",    note:"Common in West Africa drylands." }],
    "millet":   [{ crop:"cowpea",       note:"Sahel classic. Millet-cowpea is the most resilient intercrop in semi-arid zones." },
                 { crop:"groundnut",    note:"Dual benefit: N fixation + ground cover." }],
    "rice":     [],  // Rice is typically monocropped (paddy conditions)
    "cassava":  [{ crop:"maize",        note:"Maize harvested early, cassava continues. Very common in Central/West Africa." },
                 { crop:"cowpea",       note:"Cowpea acts as ground cover under cassava canopy." }],
    "wheat":    [],  // Wheat usually monocropped
    "teff":     []   // Teff monocropped
  },

  soilHealthImpact: {
    cereal:    -6,
    legume:    +10,
    root:      -5,
    vegetable: -4,
    cash:      -5
  },

  // Yield boost of following cereal after legume (% vs monoculture)
  yieldBoostAfterLegume: {
    "maize_after_groundnut":  47,
    "maize_after_bambara_groundnut": 46,
    "maize_after_cowpea":     37,
    "maize_after_soybean":    52,
    "maize_after_common_bean":30,
    "wheat_after_chickpea":   30,
    "wheat_after_lentils":    22,
    "sorghum_after_cowpea":   30,
    "millet_after_cowpea":    25,
    "rice_after_cowpea":      20
  },

  provenRotations: [
    { name:"West Africa Savanna Classic",   zones:["sub_humid","semi_arid"],   countries:["NG","GH","BF","ML","NE","SN","BJ","TG"], sequence:["maize","cowpea","sorghum","groundnut"],  yieldBoost:35, desc:"Cowpea+Groundnut fix 99 kg N/ha total. Alternating cereals reduces Striga. Cuts fertilizer need 41–46%." },
    { name:"Sahel Millet-Cowpea",           zones:["semi_arid","arid"],        countries:["NE","ML","BF","SN","TD","MR","GM"],      sequence:["millet","cowpea","millet","groundnut"],  yieldBoost:47, desc:"Cowpea and groundnut restore N depleted by millet. Drought-resilient sequence." },
    { name:"East Africa Highland",          zones:["highland"],                countries:["KE","ET","RW","BI","UG"],                sequence:["maize","common_bean","potato","common_bean"], yieldBoost:30, desc:"Beans fix N for maize. Potato breaks cereal pest cycle. Standard Kenya/Rwanda smallholder rotation." },
    { name:"Ethiopian Teff Rotation",       zones:["highland"],                countries:["ET","ER"],                              sequence:["teff","wheat","chickpea","teff"],          yieldBoost:35, desc:"Chickpea fixes 45 kg N/ha and breaks cereal disease cycle. Classic Ethiopian highlands." },
    { name:"Cotton Belt Rotation",          zones:["sub_humid"],               countries:["BF","ML","BJ","TG","CM","TZ","CI"],     sequence:["cotton","sorghum","groundnut","maize"],    yieldBoost:25, desc:"Groundnut restores N after cotton. Sorghum and maize alternate cereal types." },
    { name:"Nigerian Middle Belt",          zones:["sub_humid"],               countries:["NG"],                                  sequence:["yam","maize","cowpea","cassava"],          yieldBoost:40, desc:"Yam first (most demanding). Cowpea restores N. Cassava tolerates depleted soil. Classic Benue/Kogi." },
    { name:"Southern Africa Maize-Soy",     zones:["sub_humid","humid_tropical"],countries:["ZA","ZM","ZW","MW","MZ"],            sequence:["maize","soybean"],                         yieldBoost:52, desc:"Soybean fixes 80 kg N/ha. Reduces maize N fertilizer by 40–60 kg/ha. Most profitable Southern Africa rotation." },
    { name:"Rice Paddy Rotation",           zones:["humid_tropical","sub_humid"],countries:["SN","ML","GN","NG","TZ","MG","EG"],  sequence:["rice","cowpea","rice"],                    yieldBoost:25, desc:"Cowpea in dry season between rice crops. Breaks rice blast cycle. Fixes 32 kg N/ha." },
    { name:"East Africa Semi-Arid",         zones:["semi_arid"],               countries:["KE","TZ"],                             sequence:["sorghum","pigeon_pea","maize","cowpea"],   yieldBoost:30, desc:"Pigeon pea deep roots break hardpan. Both legumes fix N for subsequent cereals." },
    { name:"North Africa Dryland",          zones:["semi_arid"],               countries:["MA","TN","DZ","LY"],                   sequence:["wheat","chickpea","barley","lentils"],     yieldBoost:30, desc:"Alternating cereals and legumes. Chickpea/lentils fix 35–45 kg N/ha in drylands." },
    { name:"Egypt Irrigated",               zones:["arid"],                    countries:["EG"],                                  sequence:["wheat","maize","rice","cowpea"],            yieldBoost:25, desc:"Double cropping under irrigation. Cowpea as restorative break crop." }
  ]
};

// ─────────────────────────────────────────────────────────────
// CROP DISPLAY NAMES
// ─────────────────────────────────────────────────────────────
var CROP_NAMES = {
  maize:"Maize (Corn)", rice:"Rice", sorghum:"Sorghum", millet:"Pearl Millet",
  wheat:"Wheat", teff:"Teff", barley:"Barley", fonio:"Fonio",
  cowpea:"Cowpea", groundnut:"Groundnut (Peanut)", soybean:"Soybean",
  common_bean:"Common Bean", pigeon_pea:"Pigeon Pea", chickpea:"Chickpea",
  lentils:"Lentils", bambara_groundnut:"Bambara Groundnut",
  cassava:"Cassava", yam:"Yam", sweet_potato:"Sweet Potato", potato:"Potato",
  tomato:"Tomato", onion:"Onion", pepper:"Pepper", cabbage:"Cabbage",
  cotton:"Cotton", sesame:"Sesame", sunflower:"Sunflower", tobacco:"Tobacco",
  sugar_cane:"Sugar Cane", oil_palm:"Oil Palm", cocoa:"Cocoa",
  coffee_arabica:"Coffee (Arabica)", coffee_robusta:"Coffee (Robusta)",
  plantain:"Plantain", banana:"Banana", cashew:"Cashew"
};

var CROP_ICONS = {
  maize:"🌽", rice:"🌾", sorghum:"🌾", millet:"🌾", wheat:"🌾", teff:"🌾",
  barley:"🌾", fonio:"🌾", cowpea:"🫘", groundnut:"🥜", soybean:"🫘",
  common_bean:"🫘", pigeon_pea:"🫘", chickpea:"🫘", lentils:"🫘",
  bambara_groundnut:"🥜", cassava:"🟤", yam:"🟤", sweet_potato:"🟠",
  potato:"🥔", tomato:"🍅", onion:"🧅", pepper:"🫑", cabbage:"🥬",
  cotton:"⬜", sesame:"🌱", sunflower:"🌻", tobacco:"🌿",
  sugar_cane:"🎋", oil_palm:"🌴", cocoa:"🍫", coffee_arabica:"☕",
  coffee_robusta:"☕", plantain:"🍌", banana:"🍌", cashew:"🥜"
};

var GROUP_COLORS = {
  cereal:   { bg:"#FFF7ED", border:"#FED7AA", text:"#C2410C", label:"Cereal" },
  legume:   { bg:"#F0FDF4", border:"#BBF7D0", text:"#15803D", label:"Legume (N-Fixer)" },
  root:     { bg:"#FEF9C3", border:"#FDE68A", text:"#A16207", label:"Root / Tuber" },
  vegetable:{ bg:"#EFF6FF", border:"#BFDBFE", text:"#1D4ED8", label:"Vegetable" },
  cash:     { bg:"#FDF4FF", border:"#E9D5FF", text:"#7E22CE", label:"Cash Crop" }
};

// ─────────────────────────────────────────────────────────────
// MAIN ENGINE
// ─────────────────────────────────────────────────────────────
var CropRotationEngine = {

  getCropName: function(id) { return CROP_NAMES[id] || id.replace(/_/g," "); },
  getCropIcon: function(id) { return CROP_ICONS[id] || "🌱"; },
  getGroupColor: function(group) { return GROUP_COLORS[group] || GROUP_COLORS.cereal; },

  // Filter country topCrops to only those we have rotation data for
  getAvailableCrops: function(topCrops) {
    if (!topCrops || !topCrops.length) return Object.keys(ROTATION_DATA.cropProperties);
    return topCrops.filter(function(c) { return !!ROTATION_DATA.cropProperties[c]; });
  },

  // Find best proven rotation for this country
  findProvenRotation: function(countryCode, prevCrop) {
    var matches = [];
    ROTATION_DATA.provenRotations.forEach(function(r) {
      if (r.countries.indexOf(countryCode) !== -1) matches.push(r);
    });
    if (!matches.length) return null;
    // Prefer one that starts with prevCrop or contains it
    var exact = matches.filter(function(r) { return r.sequence[0] === prevCrop || r.sequence.indexOf(prevCrop) !== -1; });
    return exact.length ? exact[0] : matches[0];
  },

  // Check if sequence is a known bad combination
  checkAvoid: function(crop1, crop2) {
    if (!crop1 || !crop2) return null;
    return ROTATION_DATA.avoidSequences.find(function(s) {
      return (s.crop1 === crop1 && s.crop2 === crop2) ||
             (s.crop1 === crop2 && s.crop2 === crop1);
    }) || null;
  },

  // Score a candidate crop given the previous crop and goal
  scoreCrop: function(candidateId, prevCropId, goal, soilCondition, usedRecently) {
    var props = ROTATION_DATA.cropProperties[candidateId];
    var prevProps = ROTATION_DATA.cropProperties[prevCropId];
    if (!props || !prevProps) return 0;

    var prevGroup = prevProps.group;
    var candGroup = props.group;
    var scoreMap = ROTATION_DATA.rotationScore["after_" + prevGroup] || {};
    var base = scoreMap[candGroup] || 5;

    // Penalty for same crop
    if (candidateId === prevCropId) base = 0;

    // Penalty for known bad sequence
    var avoid = this.checkAvoid(prevCropId, candidateId);
    if (avoid) base = Math.max(0, base - 5);

    // Penalty for recently used (last 2 seasons)
    if (usedRecently && usedRecently.indexOf(candidateId) !== -1) base = Math.max(0, base - 3);

    // Goal bonuses
    if (goal === "restore_soil" && props.nFixer) base += 3;
    if (goal === "restore_soil" && candGroup === "legume") base += 2;
    if (goal === "maximize_yield" && props.nFixer) base += 2;
    if (goal === "maximize_yield" && props.marketValue === "high") base += 1;
    if (goal === "minimize_pests" && candGroup !== prevGroup) base += 2;
    if (goal === "minimize_pests" && props.rootDepth !== prevProps.rootDepth) base += 1;
    if (goal === "maximize_profit" && props.marketValue === "high") base += 3;
    if (goal === "maximize_profit" && props.nFixer) base += 1; // reduces input cost

    // Soil condition bonus: depleted soil really needs legumes
    if (soilCondition === "depleted" && props.nFixer) base += 4;
    if (soilCondition === "depleted" && props.nutrientDemand === "heavy") base -= 2;

    return base;
  },

  // Generate WHY text for a rotation step
  generateReason: function(cropId, prevCropId, goal) {
    var props = ROTATION_DATA.cropProperties[cropId];
    var prevProps = ROTATION_DATA.cropProperties[prevCropId];
    if (!props || !prevProps) return "";

    var reasons = [];
    if (props.nFixer) {
      reasons.push("Fixes " + props.nFixed + " kg N/ha — replenishes nitrogen depleted by previous crop");
    }
    if (prevProps.group === "cereal" && props.group === "legume") {
      reasons.push("Legume after cereal is the #1 rotation rule: restores soil N, breaks grass pest cycles");
    }
    if (prevProps.group === "legume" && props.group === "cereal") {
      // Check yield boost
      var boostKey = cropId + "_after_" + prevCropId;
      var boost = ROTATION_DATA.yieldBoostAfterLegume[boostKey];
      if (boost) reasons.push("Yield can be " + boost + "% higher than continuous " + this.getCropName(cropId) + " (African field trial data)");
    }
    if (props.rootDepth === "deep" && prevProps.rootDepth === "shallow") {
      reasons.push("Deep roots access nutrients and water in lower soil horizons, breaking surface compaction");
    }
    if (props.diseaseGroup !== prevProps.diseaseGroup) {
      reasons.push("Different crop family breaks pest and disease cycles specific to " + this.getCropName(prevCropId));
    }
    if (goal === "restore_soil" && props.residueQuality === "high") {
      reasons.push("High-quality residue improves organic matter when incorporated");
    }
    // Default if none match
    if (!reasons.length) {
      reasons.push("Good rotation partner — different plant family breaks soil pest cycles");
    }
    return reasons.slice(0, 2).join(". ");
  },

  // Get intercrops for a crop
  getIntercrops: function(cropId) {
    return (ROTATION_DATA.intercrops[cropId] || []).slice(0, 2);
  },

  // Calculate soil health trajectory
  calcSoilHealth: function(sequence, startCondition) {
    var baseScores = { depleted:20, average:50, good:70, excellent:90 };
    var score = baseScores[startCondition] || 50;
    var trajectory = [score];
    for (var i = 0; i < sequence.length; i++) {
      var props = ROTATION_DATA.cropProperties[sequence[i]];
      var impact = props ? (ROTATION_DATA.soilHealthImpact[props.group] || -3) : -3;
      score = Math.min(100, Math.max(0, score + impact));
      trajectory.push(Math.round(score));
    }
    return { start: trajectory[0], end: trajectory[trajectory.length - 1], trajectory: trajectory };
  },

  // Estimate overall yield boost vs monoculture
  estimateYieldBoost: function(sequence) {
    var totalBoost = 0;
    var comparisons = 0;
    for (var i = 1; i < sequence.length; i++) {
      var prev = sequence[i-1];
      var curr = sequence[i];
      var prevProps = ROTATION_DATA.cropProperties[prev];
      if (prevProps && prevProps.nFixer) {
        var key = curr + "_after_" + prev;
        var boost = ROTATION_DATA.yieldBoostAfterLegume[key];
        if (boost) { totalBoost += boost; comparisons++; }
        else { totalBoost += 20; comparisons++; } // conservative default after legume
      }
    }
    return comparisons > 0 ? Math.round(totalBoost / comparisons) : 15;
  },

  // ─── MAIN CALCULATE FUNCTION ───────────────────────────────
  calculate: function(inputs) {
    var countryCode = inputs.countryCode || "";
    var prevCrop    = inputs.prevCrop;
    var seasons     = parseInt(inputs.seasons) || 4;
    var goal        = inputs.goal || "maximize_yield";
    var soilCondition = inputs.soilCondition || "average";
    var availCrops  = inputs.availableCrops || Object.keys(ROTATION_DATA.cropProperties);

    // Filter to crops we have data for
    var crops = availCrops.filter(function(c) { return !!ROTATION_DATA.cropProperties[c]; });
    if (!crops.length) crops = Object.keys(ROTATION_DATA.cropProperties);

    // Ensure prevCrop is in our database
    if (!ROTATION_DATA.cropProperties[prevCrop]) {
      return { error: true, message: "Crop '" + prevCrop + "' not found in rotation database." };
    }

    // Check for a proven rotation match first
    var proven = this.findProvenRotation(countryCode, prevCrop);

    // Build rotation sequence
    var self = this;
    var sequence = [];
    var currentCrop = prevCrop;
    var recentCrops = [prevCrop];

    for (var s = 0; s < seasons; s++) {
      // Score all available crops except current
      var candidates = crops.filter(function(c) { return c !== currentCrop; });

      // Build scored list
      var scored = candidates.map(function(c) {
        return { cropId: c, score: self.scoreCrop(c, currentCrop, goal, soilCondition, recentCrops) };
      });
      scored.sort(function(a, b) { return b.score - a.score; });

      var best = scored[0];
      var nextCrop = best ? best.cropId : crops[0];

      // Get warnings for this step
      var warning = this.checkAvoid(currentCrop, nextCrop);

      sequence.push({
        season: s + 1,
        prevCrop: currentCrop,
        crop: nextCrop,
        cropName: this.getCropName(nextCrop),
        cropIcon: this.getCropIcon(nextCrop),
        group: ROTATION_DATA.cropProperties[nextCrop].group,
        groupColor: this.getGroupColor(ROTATION_DATA.cropProperties[nextCrop].group),
        score: best ? best.score : 0,
        reason: this.generateReason(nextCrop, currentCrop, goal),
        intercrops: this.getIntercrops(nextCrop),
        warning: warning ? null : null, // only warn if forced into bad sequence
        nFixer: ROTATION_DATA.cropProperties[nextCrop].nFixer,
        nFixed: ROTATION_DATA.cropProperties[nextCrop].nFixed || 0,
        alternatives: scored.slice(1, 3).map(function(s) {
          return { id: s.cropId, name: self.getCropName(s.cropId), icon: self.getCropIcon(s.cropId) };
        })
      });

      recentCrops.push(nextCrop);
      if (recentCrops.length > 3) recentCrops.shift();
      currentCrop = nextCrop;
    }

    // Soil health projection
    var cropIds = sequence.map(function(s) { return s.crop; });
    var soilHealth = this.calcSoilHealth(cropIds, soilCondition);

    // Yield boost estimate
    var yieldBoost = this.estimateYieldBoost([prevCrop].concat(cropIds));

    // N fixation total
    var totalN = sequence.reduce(function(sum, s) { return sum + (s.nFixed || 0); }, 0);

    // Fertilizer savings estimate (40 kg urea = ~$40-60/ha saved per legume season in Africa)
    var legumeSeasonsCount = sequence.filter(function(s) { return s.nFixer; }).length;

    // Compile warnings (from avoided sequences in the generated plan)
    var warnings = [];
    for (var i = 0; i < sequence.length; i++) {
      var seq = sequence[i];
      var avd = this.checkAvoid(seq.prevCrop, seq.crop);
      // Only warn if score was low
      if (avd && seq.score < 4) {
        warnings.push({ season: seq.season, message: avd.reason, crop1: seq.prevCrop, crop2: seq.crop });
      }
    }

    return {
      success:     true,
      sequence:    sequence,
      prevCrop:    prevCrop,
      prevCropName:this.getCropName(prevCrop),
      soilHealth:  soilHealth,
      yieldBoost:  yieldBoost,
      totalNFixed: Math.round(totalN),
      legumeSeasonsCount: legumeSeasonsCount,
      warnings:    warnings,
      provenRotation: proven,
      summary: {
        totalSeasons: seasons,
        goal: goal,
        soilCondition: soilCondition,
        soilHealthChange: soilHealth.end - soilHealth.start,
        rotationDiversity: new Set(cropIds).size
      }
    };
  },

  getAllCrops: function() {
    return Object.keys(ROTATION_DATA.cropProperties).map(function(id) {
      return { id: id, name: CROP_NAMES[id] || id, group: ROTATION_DATA.cropProperties[id].group };
    }).sort(function(a, b) { return a.name.localeCompare(b.name); });
  },

  getCropGroups: function() { return ROTATION_DATA.cropProperties; },
  getGroupColors: function() { return GROUP_COLORS; }
};

window.AfroTools = window.AfroTools || {};
window.AfroTools.CropRotationEngine = CropRotationEngine;
}();
