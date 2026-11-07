(function (root) {
  'use strict';

  var afroTools = root.AfroTools = root.AfroTools || {};
  var seedData = afroTools.seedData = afroTools.seedData || {};

  // FAO (2012), Crop Yield Response to Water, p. 194, describes variable tomato
  // spacing. The editable 60 x 40 cm default is an AfroTools planning example,
  // not an FAO recommendation. AGRIS records place common thousand-seed mass
  // around 3 g; variety labels and measured seed-lot germination remain authoritative.
  seedData.tomato = {
    seedWeightPer1000: 3,
    propagation: 'seed',
    plantingMethod: ['transplanting'],
    defaultSpacing: { row_cm: 60, plant_cm: 40 },
    seedsPerHole: 1,
    daysToEmergence: [5, 10],
    notes: 'Planning example: editable 60 x 40 cm spacing, not an FAO recommendation. FAO (2012, p. 194) describes spacing that varies with cultivar and local practice. Seed mass varies by variety and lot; confirm packet germination and thousand-seed weight before buying.',
    sourceUrls: [
      'https://www.fao.org/4/i2800e/i2800e07.pdf#page=106',
      'https://agris.fao.org/search/en/providers/122436/records/675987e9c7a957febdfaf28a'
    ]
  };

  // The legacy engine assumes a 25 kg bag whenever a crop has no maintained
  // pack size. Tomato seed is sold in varying small packets, so suppress that
  // fallback instead of presenting an invented packet count.
  var engine = afroTools.SeedRateEngine;
  if (engine && !engine.__afroToolsPacketBoundaryApplied) {
    var calculate = engine.calculate;
    engine.calculate = function () {
      var result = calculate.apply(this, arguments);
      if (result && arguments[0] && arguments[0].cropId === 'tomato') {
        result.bagSize_kg = undefined;
        result.numBags = null;
      }
      return result;
    };
    engine.__afroToolsPacketBoundaryApplied = true;
  }
})(window);
