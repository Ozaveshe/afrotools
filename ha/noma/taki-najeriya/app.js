(function () {
  'use strict';

  var CD = window.AfroTools && window.AfroTools.countryData;
  var CDB = window.AfroTools && window.AfroTools.cropDatabase;
  var ENG = window.AfroTools && window.AfroTools.FertilizerEngine;
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
  var organicLabels = {
    'Cattle Manure': 'Takin shanu',
    'Poultry Manure': 'Takin kaji',
    Compost: 'Compost'
  };

  function $(id) { return document.getElementById(id); }
  function fmtN(n) {
    return typeof n === 'number' && !isNaN(n) ? n.toLocaleString('en-NG', { maximumFractionDigits: 1 }) : '0';
  }
  function fmtC(n) {
    return (CD.currencySymbol || '') + fmtN(n);
  }
  function cropName(c) {
    return c.name + (c.localNames && c.localNames.length ? ' (' + c.localNames[0] + ')' : '');
  }
  function translateStage(stage) {
    if (/Basal/i.test(stage)) return 'Takin farko';
    if (/First Top-dress/i.test(stage)) return 'Top-dress na farko';
    if (/Second Top-dress/i.test(stage)) return 'Top-dress na biyu';
    return stage;
  }
  function translateTiming(timing) {
    return String(timing || '')
      .replace(/Apply at or just before planting/i, 'Sa a lokacin shuka ko kafin shuka')
      .replace(/weeks after planting \(vegetative stage\)/i, 'makonni bayan shuka (vegetative stage)')
      .replace(/weeks after planting \(flowering\/grain fill\)/i, 'makonni bayan shuka (flowering/grain fill)');
  }
  function translateNote(note) {
    return String(note || '')
      .replace(/Apply all phosphorus and potassium at planting. Mix into soil 5–10 cm deep./i, 'Sa duk phosphorus da potassium a lokacin shuka. Haɗa cikin ƙasa zurfin 5-10 cm.')
      .replace(/Apply nitrogen along the plant rows. Avoid contact with leaves./i, 'Sa nitrogen a layin shuka. Guji taɓa ganye kai tsaye.')
      .replace(/Final nitrogen application at flowering or tasseling stage./i, 'Sa nitrogen na ƙarshe lokacin flowering ko tasseling.');
  }

  window.toggleSoilTest = function () {
    var panel = $('soilTestPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  };

  function updateSoils() {
    var region = CD.regions.find(function (r) { return r.id === $('selRegion').value; });
    var soilSelect = $('selSoil');
    soilSelect.innerHTML = '';
    if (region && region.soilTypes) {
      region.soilTypes.forEach(function (soil) {
        var option = document.createElement('option');
        option.value = soil;
        option.textContent = soilLabels[soil] || soil;
        soilSelect.appendChild(option);
      });
    }
  }

  function updateTarget() {
    var crop = CD.crops.find(function (c) { return c.id === $('selCrop').value; });
    if (crop) $('inpTarget').placeholder = (crop.baseYieldPerHa * 1.3).toFixed(1) + ' default';
  }

  function init() {
    if (!CD || !CDB || !ENG) {
      window.calculate = function () { alert('Data bai gama lodawa ba. Sake bude shafin.'); };
      return;
    }
    $('statsBar').innerHTML = [
      'Noma: ' + CD.agriStats.gdpSharePercent + '% GDP',
      CD.agriStats.irrigatedPercent + '% irrigated',
      (CD.fertilizers || []).length + ' fertilizer products'
    ].map(function (text) { return '<span class="ha-pill">' + text + '</span>'; }).join('');

    CD.crops.forEach(function (crop) {
      var option = document.createElement('option');
      option.value = crop.id;
      option.textContent = cropName(crop);
      $('selCrop').appendChild(option);
    });
    $('selCrop').addEventListener('change', updateTarget);
    updateTarget();

    CD.regions.forEach(function (region) {
      var option = document.createElement('option');
      option.value = region.id;
      option.textContent = region.name;
      $('selRegion').appendChild(option);
    });
    $('selRegion').addEventListener('change', updateSoils);
    updateSoils();
    $('inpFarm').value = CD.agriStats.avgFarmSizeHa || 1;
  }

  window.calculate = function () {
    if (!CD || !CDB || !ENG) {
      alert('Data bai gama lodawa ba. Sake bude shafin.');
      return;
    }
    var soilTest = null;
    if ($('soilTestPanel').style.display !== 'none') {
      soilTest = {
        pH: parseFloat($('inpPH').value) || null,
        organicMatter: parseFloat($('inpOM').value) || null,
        N_ppm: parseFloat($('inpN').value) || null,
        P_ppm: parseFloat($('inpP').value) || null,
        K_ppm: parseFloat($('inpK').value) || null
      };
    }
    var result = ENG.calculate({
      cropId: $('selCrop').value,
      regionId: $('selRegion').value,
      farmSizeHa: parseFloat($('inpFarm').value) || 1,
      targetYieldPerHa: parseFloat($('inpTarget').value) || null,
      soilType: $('selSoil').value,
      previousCrop: $('selPrevCrop').value,
      soilTest: soilTest
    }, CD, CDB);
    if (result.error) {
      alert('Ba a samu nutrient data don wannan zaɓin ba. Gwada wani crop ko sake loda shafin.');
      return;
    }
    $('resultsPanel').classList.add('on');
    $('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('rN').textContent = fmtN(result.perHa.N);
    $('rP').textContent = fmtN(result.perHa.P);
    $('rK').textContent = fmtN(result.perHa.K);
    $('rCrop').textContent = result.cropName;
    $('rTarget').textContent = fmtN(result.targetYieldPerHa);
    $('rFarm').textContent = result.farmSizeHa;

    var tbody = document.querySelector('#shopTable tbody');
    tbody.innerHTML = '';
    result.products.forEach(function (product) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + product.name + ' <small>(' + product.bagSize_kg + 'kg)</small></td><td>' + product.bags + '</td><td>' + fmtC(product.pricePerBag) + '</td><td>' + fmtC(product.totalCostMarket) + '</td>';
      tbody.appendChild(tr);
    });
    var total = document.createElement('tr');
    total.className = 'ha-total-row';
    total.innerHTML = '<td colspan="3">Jimilla (market)</td><td>' + fmtC(result.costMarket) + '</td>';
    tbody.appendChild(total);
    if (result.costSubsidy !== null) {
      var subsidy = document.createElement('tr');
      subsidy.className = 'ha-total-row';
      subsidy.innerHTML = '<td colspan="3">Jimilla (subsidy)</td><td>' + fmtC(result.costSubsidy) + '</td>';
      tbody.appendChild(subsidy);
    }
    $('rCostMarket').textContent = fmtC(result.costMarket);
    if (result.costSubsidy !== null) {
      $('costSubsidyCard').style.display = 'block';
      $('rCostSubsidy').textContent = fmtC(result.costSubsidy);
    } else {
      $('costSubsidyCard').style.display = 'none';
    }
    $('rCostPerHa').textContent = 'Kudin hectare: ' + fmtC(result.costPerHaMarket) + (result.costPerHaSubsidy !== null ? ' ko ' + fmtC(result.costPerHaSubsidy) + ' idan subsidy ta dace' : '');

    $('scheduleContainer').innerHTML = result.schedule.map(function (item, index) {
      var nutrients = [];
      if (item.nutrients.N > 0) nutrients.push(fmtN(item.nutrients.N) + ' kg N');
      if (item.nutrients.P > 0) nutrients.push(fmtN(item.nutrients.P) + ' kg P2O5');
      if (item.nutrients.K > 0) nutrients.push(fmtN(item.nutrients.K) + ' kg K2O');
      return '<div class="ha-note-box" style="margin-bottom:10px;"><strong>' + (index + 1) + '. ' + translateStage(item.stage) + '</strong><br>' + translateTiming(item.timing) + '<br><strong>' + nutrients.join(' + ') + '</strong><br>' + translateNote(item.note) + '</div>';
    }).join('');

    $('organicGrid').innerHTML = result.organic.map(function (item) {
      return '<div class="ha-metric"><div class="ha-metric-value">' + fmtN(item.tonnes) + ' t</div><div class="ha-metric-label">' + (organicLabels[item.label] || item.label) + '<br>' + fmtN(item.kgNeeded) + ' kg</div></div>';
    }).join('');

    var card = $('subsidyCard');
    if (result.subsidyInfo && result.subsidyInfo.active) {
      card.style.display = 'block';
      $('subsidyBanner').innerHTML = '<strong>' + result.subsidyInfo.programName + '</strong><br>Eligibility: registered farmers/state ADP ko e-wallet, gwargwadon source data.<br>Subsidy: ' + (result.subsidyInfo.subsidyPercent || 0) + '% off' + (result.savings > 0 ? '<br>Yiwu savings: ' + fmtC(result.savings) : '') + '<br>Tabbatar da availability da ADP ko agro-dealer a jiharka.';
    } else {
      card.style.display = 'none';
    }
  };

  init();
})();
