(function (root) {
  'use strict';

  var afroTools = root.AfroTools = root.AfroTools || {};
  var seedData = afroTools.seedData = afroTools.seedData || {};

  // FAO AquaCrop gives a tomato management range of 15,000-80,000 plants/ha.
  // The example spacing below gives about 41,667 plants/ha. AGRIS records place common
  // tomato thousand-seed mass around 3 g. This is a planning basis only:
  // variety labels and measured seed-lot germination remain authoritative.
  seedData.tomato = {
    seedWeightPer1000: 3,
    propagation: 'seed',
    plantingMethod: ['transplanting'],
    defaultSpacing: { row_cm: 60, plant_cm: 40 },
    seedsPerHole: 1,
    daysToEmergence: [5, 10],
    notes: 'Planning basis: 60 cm by 40 cm gives about 41,667 plants/ha. FAO AquaCrop lists a management range of 15,000 to 80,000 tomato plants/ha. Seed mass varies by variety and lot; confirm packet germination and thousand-seed weight before buying.',
    sourceUrls: [
      'https://www.fao.org/fileadmin/user_upload/faowater/docs/AquaCropV40Annexes.pdf#page=37',
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
