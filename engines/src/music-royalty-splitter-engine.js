(function (global) {
  "use strict";
  var FX = Object.freeze({ NG:1660, KE:130, ZA:18.5, GH:15.5, EG:48, TZ:2600, UG:3750, RW:1300, CM:615, SN:615, CI:615, MA:10, ET:57, TN:3.1, AO:835 });
  var SYMBOLS = Object.freeze({ NG:"â‚¦", KE:"KES ", ZA:"R", GH:"GHS ", EG:"EGP ", TZ:"TZS ", UG:"UGX ", RW:"RWF ", CM:"XAF ", SN:"XOF ", CI:"XOF ", MA:"MAD ", ET:"ETB ", TN:"TND ", AO:"AOA " });
  function roundedPercent(collaborators) {
    return Math.round(collaborators.reduce(function (sum, item) {
      return sum + (parseFloat(item.pct) || 0);
    }, 0) * 100) / 100;
  }
  function calculate(input) {
    var totalUSD = parseFloat(input.totalRoyalties) || 0;
    var period = parseInt(input.period, 10);
    var collaborators = (input.collaborators || []).map(function (item) {
      return {
        id: item.id,
        name: item.name || "Collaborator",
        role: item.role,
        pct: parseFloat(item.pct) || 0,
      };
    });
    var splitTotal = roundedPercent(collaborators);
    if (totalUSD <= 0) return { ok: false, error: "missing_total", splitTotal: splitTotal };
    if (!collaborators.length) return { ok: false, error: "missing_collaborator", splitTotal: splitTotal };
    if (splitTotal !== 100) return { ok: false, error: "invalid_split", splitTotal: splitTotal };
    var rate = FX[input.country];
    var symbol = SYMBOLS[input.country];
    var quarterFactor = period === 1 ? 3 : period === 3 ? 1 : 0.25;
    var shares = collaborators.map(function (item) {
      var shareUSD = totalUSD * item.pct / 100;
      return {
        id: item.id,
        name: item.name,
        role: item.role,
        pct: item.pct,
        shareUSD: shareUSD,
        shareLocal: shareUSD * rate,
        quarterly: shareUSD * quarterFactor,
        annual: shareUSD * quarterFactor * 4,
      };
    });
    return {
      ok: true,
      title: input.title || "Untitled",
      country: input.country,
      rate: rate,
      symbol: symbol,
      totalUSD: totalUSD,
      totalLocal: totalUSD * rate,
      period: period,
      periodLabel: { 1:"Monthly", 3:"Quarterly", 12:"Annual" }[period],
      splitTotal: splitTotal,
      shares: shares,
    };
  }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.MusicRoyaltySplitterEngine = Object.freeze({
    calculate: calculate,
    roundedPercent: roundedPercent,
  });
})(typeof window !== "undefined" ? window : globalThis);
