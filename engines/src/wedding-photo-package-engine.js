(function (global) {
  "use strict";
  var BASE = Object.freeze({
    NG: { base_4h: 100000, base_6h: 150000, base_8h: 200000, base_10h: 270000, base_12h: 350000, second_shooter: 80000, drone: 60000, sde: 150000, album_40: 120000, album_60: 180000, pre_wedding: 100000, prints: 50000, online_gallery: 0, extra_day: 80000 },
    KE: { base_4h: 10000, base_6h: 15000, base_8h: 20000, base_10h: 27000, base_12h: 35000, second_shooter: 8000, drone: 6000, sde: 15000, album_40: 12000, album_60: 18000, pre_wedding: 10000, prints: 5000, online_gallery: 0, extra_day: 8000 },
    ZA: { base_4h: 3000, base_6h: 4500, base_8h: 6000, base_10h: 8000, base_12h: 10500, second_shooter: 2500, drone: 1800, sde: 4500, album_40: 3500, album_60: 5500, pre_wedding: 3000, prints: 1500, online_gallery: 0, extra_day: 2500 },
    GH: { base_4h: 1800, base_6h: 2700, base_8h: 3600, base_10h: 4800, base_12h: 6300, second_shooter: 1500, drone: 1100, sde: 2700, album_40: 2100, album_60: 3300, pre_wedding: 1800, prints: 900, online_gallery: 0, extra_day: 1500 },
    EG: { base_4h: 5000, base_6h: 7500, base_8h: 10000, base_10h: 13500, base_12h: 17500, second_shooter: 4000, drone: 3000, sde: 8000, album_40: 6000, album_60: 9000, pre_wedding: 5000, prints: 2500, online_gallery: 0, extra_day: 4000 },
  });
  var MULTIPLIERS = Object.freeze({ new: 0.6, mid: 1, senior: 1.6, established: 2.5 });
  var SYMBOLS = Object.freeze({ NG: "₦", KE: "KES ", ZA: "R", GH: "GHS ", EG: "EGP " });
  var ADDONS = Object.freeze([
    { id: "second_shooter", label: "2nd Photographer", desc: "Covers different angles, candids" },
    { id: "drone", label: "Drone Coverage", desc: "Aerial shots and video" },
    { id: "sde", label: "Same-Day Edit (SDE)", desc: "Highlight reel played at reception" },
    { id: "album_40", label: "40-Page Wedding Album", desc: "Lay-flat premium print album" },
    { id: "album_60", label: "60-Page Wedding Album", desc: "Premium lay-flat, coffee table size" },
    { id: "pre_wedding", label: "Pre-Wedding Shoot", desc: "Engagement / pre-wedding session" },
    { id: "prints", label: "Print Package (40 prints)", desc: "Fine art prints, various sizes" },
    { id: "extra_day", label: "Additional Coverage Day", desc: "Traditional ceremony or after-party" },
  ]);
  function catalog(country, experience) {
    var prices = BASE[country] || BASE.NG, multiplier = MULTIPLIERS[experience] || 1;
    return ADDONS.map(function (addon) { return { id: addon.id, label: addon.label, desc: addon.desc, price: Math.round((prices[addon.id] || 0) * multiplier) }; });
  }
  function calculate(input) {
    var prices = BASE[input.country] || BASE.NG, multiplier = MULTIPLIERS[input.experience] || 1;
    var base = Math.round((prices["base_" + input.hours + "h"] || prices.base_8h) * multiplier);
    var items = [{ label: "Base Coverage (" + input.hours + " hours)", price: base, included: true }];
    catalog(input.country, input.experience).forEach(function (addon) { if ((input.addons || []).indexOf(addon.id) >= 0) items.push({ label: addon.label, price: addon.price, included: true }); });
    var total = items.reduce(function (sum, item) { return sum + item.price; }, 0);
    return {
      country: input.country, experience: input.experience, hours: input.hours,
      symbol: SYMBOLS[input.country], items: items, total: total, deposit: total * 0.5,
      comparisons: ["new", "mid", "senior", "established"].map(function (level) { return { level: level, price: Math.round((prices.base_8h || 0) * MULTIPLIERS[level]) }; }),
    };
  }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.WeddingPhotoPackageEngine = Object.freeze({ catalog: catalog, calculate: calculate });
})(typeof window !== "undefined" ? window : globalThis);
