(function () {
  'use strict';

  var CD = window.AfroTools && window.AfroTools.countryData;
  var CDB = window.AfroTools && window.AfroTools.cropDatabase;
  var ENG = window.AfroTools && window.AfroTools.CropYieldEngine;
  var MONTHS = ['Jan', 'Fab', 'Mar', 'Afr', 'Mayu', 'Yuni', 'Yuli', 'Ag', 'Sat', 'Okt', 'Nuw', 'Dis'];
  var soilLabels = {
    loamy: 'Loamy',
    clay: 'Clay',
    sandy: 'Sandy',
    sandy_loam: 'Sandy loam',
    clay_loam: 'Clay loam',
    volcanic: 'Volcanic',
    laterite: 'Laterite',
    alluvial: 'Alluvial',
    black_cotton: 'Black cotton',
    red_soil: 'Red soil'
  };
  var multiplierLabels = {
    region: 'Yanki',
    soil: 'Ƙasa',
    irrigation: 'Ban ruwa',
    fertilizer: 'Taki',
    seed: 'Iri',
    season: 'Lokaci'
  };

  function $(id) { return document.getElementById(id); }
  function fmtN(n) {
    return typeof n === 'number' && !isNaN(n) ? n.toLocaleString('en-NG', { maximumFractionDigits: 2 }) : '0';
  }
  function fmtC(n) {
    return (CD.currencySymbol || '') + fmtN(n);
  }
  function cropName(c) {
    return c.name + (c.localNames && c.localNames.length ? ' (' + c.localNames.join(', ') + ')' : '');
  }
  function translateRecommendation(item) {
    var text = item.text || '';
    if (/fertilizer/i.test(text) && /organic/i.test(text)) {
      return 'Ka yi la’akari da ƙara taki. Ko manure ko compost na iya taimakawa idan ƙasa ta raunana.';
    }
    if (/inorganic fertilizer|NPK/i.test(text)) {
      return 'Haɗa organic inputs da matsakaicin NPK zai iya ƙara yield idan ƙasa da crop sun dace.';
    }
    if (/Improved seed/i.test(text)) {
      return 'Ka tambayi extension officer ko agro-dealer game da improved seed na wannan crop a Najeriya.';
    }
    if (/irrigation/i.test(text)) {
      return 'Ƙarin ban ruwa a muhimman lokutan girma na iya taimaka musamman a yankin da ruwa bai wadatar ba.';
    }
    if (/organic matter/i.test(text) || /soil type/i.test(text)) {
      return 'Ƙara mulch, compost ko manure zai taimaka wa ƙasa wajen riƙe ruwa da abinci.';
    }
    return text;
  }

  function updateDependents() {
    var region = CD.regions.find(function (r) { return r.id === $('selRegion').value; });
    var soilSel = $('selSoil');
    soilSel.innerHTML = '';
    if (region && region.soilTypes) {
      region.soilTypes.forEach(function (soil) {
        var option = document.createElement('option');
        option.value = soil;
        option.textContent = soilLabels[soil] || soil;
        soilSel.appendChild(option);
      });
    }
    var seasonSel = $('selSeason');
    seasonSel.innerHTML = '';
    CD.seasons.forEach(function (season) {
      if (!season.applicableRegions || season.applicableRegions.indexOf($('selRegion').value) !== -1) {
        var option = document.createElement('option');
        option.value = season.id;
        option.textContent = season.name;
        seasonSel.appendChild(option);
      }
    });
  }

  function init() {
    if (!CD || !CDB || !ENG) {
      window.calculate = function () { alert('Data bai gama lodawa ba. Sake bude shafin.'); };
      return;
    }

    $('statsBar').innerHTML = [
      'Noma: ' + CD.agriStats.gdpSharePercent + '% GDP',
      CD.agriStats.laborForcePercent + '% workforce',
      fmtN(CD.agriStats.arableLandHectares / 1000000) + 'M ha arable',
      CD.agriStats.irrigatedPercent + '% irrigated'
    ].map(function (text) { return '<span class="ha-pill">' + text + '</span>'; }).join('');

    CD.crops.forEach(function (crop) {
      var option = document.createElement('option');
      option.value = crop.id;
      option.textContent = cropName(crop);
      $('selCrop').appendChild(option);
    });
    CD.regions.forEach(function (region) {
      var option = document.createElement('option');
      option.value = region.id;
      option.textContent = region.name;
      $('selRegion').appendChild(option);
    });
    $('selRegion').addEventListener('change', updateDependents);
    updateDependents();
    $('inpFarm').value = CD.agriStats.avgFarmSizeHa || 0.5;

    CD.crops.forEach(function (crop) {
      var plant = (crop.plantingMonths || []).map(function (m) { return MONTHS[m - 1]; }).join('-');
      var harvest = (crop.harvestMonths || []).map(function (m) { return MONTHS[m - 1]; }).join('-');
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + cropName(crop) + '</td><td>' + crop.baseYieldPerHa + '</td><td>' + (crop.potentialYieldPerHa || '-') + '</td><td>' + (plant ? plant + ' zuwa ' + harvest : '-') + '</td>';
      document.querySelector('#cropTable tbody').appendChild(tr);
    });

    MONTHS.forEach(function (month, index) {
      var cell = document.createElement('div');
      cell.className = 'ha-season-month' + ((CD.agriStats.rainySeasonMonths || []).indexOf(index + 1) !== -1 ? ' rainy' : '');
      cell.textContent = month;
      $('seasonGrid').appendChild(cell);
    });

    var s = CD.agriStats;
    $('countryInfo').textContent = 'Nigeria source data ta nuna noma yana bada kusan ' + s.gdpSharePercent + '% na GDP kuma yana ɗaukar ' + s.laborForcePercent + '% na workforce. Babban abinci: ' + s.mainFoodCrops.join(', ') + '. Export crops: ' + s.mainExportCrops.join(', ') + '.';
  }

  window.calculate = function () {
    if (!CD || !CDB || !ENG) {
      alert('Data bai gama lodawa ba. Sake bude shafin.');
      return;
    }
    var result = ENG.calculate({
      countryCode: CD.countryCode,
      cropId: $('selCrop').value,
      regionId: $('selRegion').value,
      farmSizeHa: parseFloat($('inpFarm').value) || 1,
      soilType: $('selSoil').value,
      irrigationType: $('selIrrigation').value,
      fertilizerUsage: $('selFertilizer').value,
      seedType: $('selSeed').value,
      season: $('selSeason').value
    }, CD, CDB);
    if (result.error) {
      alert('Zaɓin crop ko yanki bai yi daidai ba. Duba ka sake gwadawa.');
      return;
    }
    $('resultsPanel').classList.add('on');
    $('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('rYieldPerHa').textContent = fmtN(result.estimatedYieldPerHa);
    $('rUnit').textContent = result.yieldUnit;
    $('rTotalYield').textContent = fmtN(result.totalEstimatedYield) + ' ' + result.yieldUnit;
    $('rYieldGap').textContent = result.yieldGapPercent + '%';
    $('rFarmSize').textContent = result.farmSizeHa + ' ha';
    var potentialShare = Math.min(100, 100 - result.yieldGapPercent);
    $('gapText').textContent = 'Kiyasinka yana kusan ' + potentialShare + '% na achievable potential (' + fmtN(result.potentialYield) + ' t/ha). Za a iya rage ratar ' + result.yieldGapPercent + '% da management mai kyau.';
    $('rRevLow').textContent = fmtC(result.revenueEstimate.low);
    $('rRevMid').textContent = fmtC(result.revenueEstimate.mid);
    $('rRevHigh').textContent = fmtC(result.revenueEstimate.high);
    $('rCurrency').textContent = result.revenueEstimate.currency;

    var recsCard = $('recsCard');
    var recs = $('recsContainer');
    if (result.recommendations && result.recommendations.length) {
      recsCard.style.display = 'block';
      recs.innerHTML = result.recommendations.map(function (item) {
        return '<li><strong>' + translateRecommendation(item) + '</strong><br><span class="ha-muted">Impact: ' + (item.impact || 'ya danganta da gona') + '</span></li>';
      }).join('');
    } else {
      recsCard.style.display = 'none';
    }

    $('multGrid').innerHTML = Object.keys(result.multipliers).map(function (key) {
      return '<div class="ha-metric"><div class="ha-metric-value">x' + result.multipliers[key] + '</div><div class="ha-metric-label">' + (multiplierLabels[key] || key) + '</div></div>';
    }).join('');
  };

  init();
})();
