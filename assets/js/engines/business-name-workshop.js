(function initBusinessNameWorkshop(root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.BusinessNameWorkshop = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createBusinessNameWorkshop() {
  "use strict";

  var VERSION = "business-name-workshop-2026-07-23";
  var LIMITS = { keywords: 5, tokenLength: 24, maxLengthMin: 12, maxLengthMax: 32, batchMax: 20 };
  var INDUSTRIES = {
    technology: ["Tech", "Digital", "Link", "Labs"],
    food: ["Foods", "Kitchen", "Fresh", "Table"],
    fashion: ["Style", "Wear", "Studio", "Cloth"],
    health: ["Health", "Care", "Well", "Life"],
    education: ["Learn", "Class", "Study", "Academy"],
    finance: ["Finance", "Capital", "Pay", "Fund"],
    logistics: ["Move", "Route", "Fleet", "Cargo"],
    agriculture: ["Farm", "Grow", "Harvest", "Field"],
    media: ["Media", "Studio", "Story", "Live"],
    property: ["Homes", "Land", "Space", "Build"],
    commerce: ["Market", "Trade", "Shop", "Goods"],
    energy: ["Energy", "Power", "Solar", "Grid"],
    general: ["Works", "Group", "Studio", "Collective"]
  };
  var TONES = {
    clear: ["Clear", "Direct", "Plain", "Open"],
    warm: ["Kind", "Welcome", "Bright", "Good"],
    bold: ["Bold", "Strong", "Rise", "Peak"],
    premium: ["Prime", "Select", "Fine", "Crown"],
    modern: ["Nova", "Flow", "Next", "Urban"]
  };
  var AUDIENCES = {
    local: ["Local", "Town", "Neighbour", "Home"],
    national: ["National", "Country", "One", "United"],
    regional: ["Africa", "Regional", "Border", "Bridge"],
    global: ["Global", "World", "Beyond", "Open"]
  };
  var SUFFIXES = ["Works", "Studio", "House", "Collective", "Co", "Lab", "Link", "Point", "Core", "Base", "Wave", "Bridge", "Nest", "Field", "Path", "One", "Circle", "Craft", "Spark", "Place"];

  function cleanToken(value) {
    return String(value == null ? "" : value)
      .normalize("NFKC")
      .replace(/[^\p{L}\p{N}\s'-]+/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, LIMITS.tokenLength);
  }

  function titleCase(value) {
    return cleanToken(value).split(" ").filter(Boolean).map(function (part) {
      return part.charAt(0).toLocaleUpperCase() + part.slice(1).toLocaleLowerCase();
    }).join(" ");
  }

  function parseKeywords(input) {
    var raw = Array.isArray(input) ? input : String(input || "").split(/[,;\n]+/);
    var seen = {};
    return raw.map(titleCase).filter(function (token) {
      var key = token.toLocaleLowerCase();
      if (token.length < 2 || seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, LIMITS.keywords);
  }

  function validate(input) {
    var industry = String(input && input.industry || "");
    var audience = String(input && input.audience || "");
    var tone = String(input && input.tone || "");
    var style = String(input && input.style || "");
    var maxLength = Number(input && input.maxLength);
    var batch = Number(input && input.batch || 0);
    var keywords = parseKeywords(input && input.keywords);
    var localWord = titleCase(input && input.localWord);
    var errors = [];
    if (!INDUSTRIES[industry]) errors.push("industry");
    if (!AUDIENCES[audience]) errors.push("audience");
    if (!TONES[tone]) errors.push("tone");
    if (!["mixed", "descriptive", "compound", "short", "evocative"].includes(style)) errors.push("style");
    if (!Number.isInteger(maxLength) || maxLength < LIMITS.maxLengthMin || maxLength > LIMITS.maxLengthMax) errors.push("maxLength");
    if (!Number.isInteger(batch) || batch < 0 || batch > LIMITS.batchMax) errors.push("batch");
    if (!keywords.length) errors.push("keywords");
    return {
      valid: errors.length === 0,
      errors: errors,
      values: { industry: industry, audience: audience, tone: tone, style: style, maxLength: maxLength, batch: batch, keywords: keywords, localWord: localWord }
    };
  }

  function rotate(array, offset) {
    return array.slice(offset % array.length).concat(array.slice(0, offset % array.length));
  }

  function compact(value) {
    return titleCase(value).replace(/[^\p{L}\p{N}]+/gu, "");
  }

  function fitPair(first, second, maxLength, separator) {
    var joiner = separator == null ? "" : separator;
    var right = compact(second);
    var available = Math.max(2, maxLength - right.length - joiner.length);
    var left = compact(first).slice(0, available);
    return (left + joiner + right).slice(0, maxLength);
  }

  function heuristic(name, keywords, maxLength) {
    var compactName = name.replace(/\s+/g, "");
    var lower = compactName.toLocaleLowerCase();
    var keywordConnection = keywords.some(function (keyword) {
      return lower.includes(compact(keyword).slice(0, Math.min(4, compact(keyword).length)).toLocaleLowerCase());
    });
    var factors = {
      withinLengthTarget: name.length >= 4 && name.length <= maxLength,
      oneOrTwoWords: name.trim().split(/\s+/).length <= 2,
      keywordConnection: keywordConnection,
      noTripleCharacter: !/(.)\1\1/iu.test(compactName),
      simpleCharacters: /^[\p{L}\p{N} '-]+$/u.test(name)
    };
    var score = (factors.withinLengthTarget ? 25 : 0) + (factors.oneOrTwoWords ? 20 : 0) +
      (factors.keywordConnection ? 25 : 0) + (factors.noTripleCharacter ? 20 : 0) + (factors.simpleCharacters ? 10 : 0);
    return { score: score, factors: factors };
  }

  function generate(input) {
    var validation = validate(input);
    if (!validation.valid) return validation;
    var v = validation.values;
    var industryWords = rotate(INDUSTRIES[v.industry], v.batch);
    var toneWords = rotate(TONES[v.tone], v.batch);
    var audienceWords = rotate(AUDIENCES[v.audience], v.batch);
    var suffixes = rotate(SUFFIXES, v.batch * 3);
    var bases = v.keywords.slice();
    if (v.localWord) bases.push(v.localWord);
    var candidates = [];
    for (var index = 0; index < 120; index += 1) {
      var base = bases[(index + Math.floor(index / 4)) % bases.length];
      var suffix = suffixes[index % suffixes.length];
      var cycle = Math.floor(index / bases.length);
      var industry = industryWords[cycle % industryWords.length];
      var tone = toneWords[(cycle + index) % toneWords.length];
      var audience = audienceWords[(cycle + index * 2) % audienceWords.length];
      var styles = v.style === "mixed" ? ["descriptive", "compound", "short", "evocative"] : [v.style];
      var selectedStyle = styles[index % styles.length];
      var name;
      if (selectedStyle === "descriptive") name = fitPair(base, industry, v.maxLength, " ");
      else if (selectedStyle === "compound") name = fitPair(base, suffix, v.maxLength, "");
      else if (selectedStyle === "short") name = fitPair(base.slice(0, 6), suffix.slice(0, 4), v.maxLength, "");
      else if (index % 3 === 0) name = fitPair(tone, audience, v.maxLength, "");
      else name = index % 2 ? fitPair(tone, base, v.maxLength, "") : fitPair(base, audience, v.maxLength, "");
      name = titleCase(name);
      if (!name || candidates.some(function (candidate) { return candidate.name.toLocaleLowerCase() === name.toLocaleLowerCase(); })) continue;
      var check = heuristic(name, v.keywords.concat(v.localWord ? [v.localWord] : []), v.maxLength);
      candidates.push({
        name: name,
        style: selectedStyle,
        score: check.score,
        factors: check.factors,
        rationale: selectedStyle + " pattern using the submitted brief; verify pronunciation, meaning, conflicts and availability independently."
      });
      if (candidates.length === 20) break;
    }
    if (candidates.length < 16) return { valid: false, errors: ["candidateRange"], values: v };
    return { valid: true, errors: [], version: VERSION, inputs: v, suggestions: candidates };
  }

  return {
    VERSION: VERSION,
    LIMITS: Object.assign({}, LIMITS),
    INDUSTRIES: Object.keys(INDUSTRIES),
    cleanToken: cleanToken,
    parseKeywords: parseKeywords,
    validate: validate,
    heuristic: heuristic,
    generate: generate
  };
});
