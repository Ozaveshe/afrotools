(function initSwahiliFertilizerController(window, document) {
  'use strict';

  var cfg = window.__SW_AGRI_PAGE__;
  var data = window.AfroTools && window.AfroTools.countryData;
  var cropDatabase = window.AfroTools && window.AfroTools.cropDatabase;
  var engine = window.AfroTools && window.AfroTools.FertilizerEngine;
  var latest = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function number(value) {
    return new Intl.NumberFormat(cfg.locale || 'sw', {
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function currency(value) {
    return new Intl.NumberFormat(cfg.locale || 'sw', {
      style: 'currency',
      currency: data.currency,
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function option(value, label) {
    var node = document.createElement('option');
    node.value = value;
    node.textContent = label;
    return node;
  }

  function cropName(id, fallback) {
    return cfg.cropNames[id] || fallback || id;
  }

  function productName(value) {
    return String(value || '')
      .replace(/\bUrea\b/gi, 'Urea')
      .replace(/Ammonium Sulphate/gi, 'Salfa ya amonia')
      .replace(/Single Super Phosphate/gi, 'Superfosfati moja')
      .replace(/Muriate of Potash/gi, 'Kloridi ya potasiamu');
  }

  function organicName(value) {
    return {
      cattle_manure: 'Samadi ya ng’ombe',
      poultry_manure: 'Samadi ya kuku',
      compost: 'Mboji'
    }[value] || 'Mbolea hai';
  }

  function scheduleName(index) {
    return [
      'Mbolea ya msingi wakati wa kupanda',
      'Mbolea ya kwanza ya kukuzia',
      'Mbolea ya pili ya kukuzia'
    ][index] || 'Hatua ya ziada';
  }

  function scheduleTiming(index, item) {
    if (index === 0) return 'Wakati wa kupanda au muda mfupi kabla yake';
    var weeks = String(item.timing || '').match(/\d+/);
    return (weeks ? weeks[0] : 'Wiki chache') + ' baada ya kupanda';
  }

  function scheduleNote(index) {
    return [
      'Changanya fosforasi na potasiamu kwenye udongo; usiweke mbolea ikigusa mbegu moja kwa moja.',
      'Weka nitrojeni kando ya mistari ya mimea bila kugusa majani.',
      'Weka sehemu ya mwisho ya nitrojeni wakati wa maua au kujaza punje.'
    ][index] || 'Thibitisha muda na mtaalamu wa kilimo wa eneo lako.';
  }

  function status(message, isError) {
    var node = byId('actionStatus');
    node.textContent = message;
    node.style.color = isError ? 'var(--agri-danger)' : 'var(--agri-good)';
  }

  function download(content, type, fileName) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function revokeDownloadUrl() {
      URL.revokeObjectURL(url);
    }, 0);
  }

  function csvCell(value) {
    var text = String(value == null ? '' : value);
    return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    return Promise.resolve();
  }

  function localizedResult() {
    if (!latest) return null;
    var result = latest.result;
    return {
      zao: cropName(result.cropId, result.cropName),
      kanda: cfg.regionNames[latest.input.regionId] || result.regionName,
      ukubwaWaShambaHekta: result.farmSizeHa,
      mavunoLengwaTaniKwaHekta: result.targetYieldPerHa,
      mahitajiKwaHekta: result.perHa,
      mahitajiYote: result.totalNPK,
      bidhaa: result.products.map(function mapProduct(item) {
        return {
          jina: productName(item.name),
          mifuko: item.bags,
          uzitoKg: item.totalWeight_kg,
          gharamaElekezi: item.totalCostMarket
        };
      }),
      ratiba: result.schedule.map(function mapSchedule(item, index) {
        return {
          hatua: scheduleName(index),
          muda: scheduleTiming(index, item),
          ushauri: scheduleNote(index),
          virutubisho: item.nutrients
        };
      }),
      mbadalaHai: result.organic.map(function mapOrganic(item) {
        return { aina: organicName(item.type), tani: item.tonnes };
      }),
      gharamaSokoni: result.costMarket,
      gharamaBaadaYaRuzuku: result.costSubsidy,
      akiba: result.savings,
      sarafu: result.currency
    };
  }

  function reportObject() {
    return latest ? {
      schemaVersion: 1,
      tool: 'fertilizer-npk',
      language: 'sw',
      country: { code: cfg.countryCode, name: cfg.countryName },
      generatedAt: new Date().toISOString(),
      inputs: latest.input,
      result: latest.result,
      localizedResult: localizedResult(),
      sources: {
        label: cfg.sourceLabel,
        dataReviewed: cfg.dataReviewed,
        live: false
      },
      privacy: {
        localOnly: true,
        sentToServer: false,
        sentToAI: false,
        modelConsentRequiredForThisCalculator: false
      }
    } : null;
  }

  function reportText() {
    var result = localizedResult();
    if (!result) return '';
    var lines = [
      'AfroTools — makadirio ya mahitaji ya mbolea',
      cfg.countryName,
      'Zao: ' + result.zao,
      'Kanda: ' + result.kanda,
      'Ukubwa wa shamba: ' + number(result.ukubwaWaShambaHekta) + ' hekta',
      'N: ' + number(result.mahitajiKwaHekta.N) + ' kg/hekta',
      'P₂O₅: ' + number(result.mahitajiKwaHekta.P) + ' kg/hekta',
      'K₂O: ' + number(result.mahitajiKwaHekta.K) + ' kg/hekta',
      'Gharama elekezi: ' + currency(result.gharamaSokoni),
      ''
    ];
    result.bidhaa.forEach(function appendProduct(item) {
      lines.push(
        item.jina + ': ' + number(item.mifuko) + ' mifuko, '
        + number(item.uzitoKg) + ' kg, ' + currency(item.gharamaElekezi)
      );
    });
    lines.push(
      '',
      'Vyanzo: ' + cfg.sourceLabel,
      'Data: rejea tuli iliyopitiwa ' + cfg.dataReviewed + '; hakuna data ya moja kwa moja.',
      'Kikomo: thibitisha kwa kipimo cha udongo na mtaalamu wa kilimo wa eneo lako.',
      'Faragha: hesabu ya ndani ya kivinjari; hakuna ingizo lililotumwa kwa seva au AI.'
    );
    return lines.join('\n');
  }

  function updateSoils() {
    var region = data.regions.find(function findRegion(item) {
      return item.id === byId('region').value;
    });
    var soil = byId('soil');
    soil.innerHTML = '';
    (region && region.soilTypes || []).forEach(function appendSoil(id) {
      soil.appendChild(option(id, cfg.soilNames[id] || id));
    });
  }

  function updateTargetPlaceholder() {
    var crop = data.crops.find(function findCrop(item) {
      return item.id === byId('crop').value;
    });
    byId('targetYield').placeholder = crop
      ? number(crop.baseYieldPerHa * 1.3) + ' (chaguo msingi)'
      : 'Hukokotolewa kiotomatiki';
  }

  function initialize() {
    if (!cfg || !data || !cropDatabase || !engine || typeof engine.calculate !== 'function') {
      throw new Error('Injini au data ya mbolea haipatikani.');
    }
    data.crops.filter(function supportedCrop(item) {
      var shared = cropDatabase.crops && cropDatabase.crops[item.id];
      return Boolean(item.nutrientUptake || shared && shared.nutrientUptake);
    }).forEach(function appendCrop(item) {
      var local = item.localNames && item.localNames.length
        ? ' — ' + item.localNames.join(', ')
        : '';
      byId('crop').appendChild(option(item.id, cropName(item.id, item.name) + local));
    });
    if (!byId('crop').options.length) {
      throw new Error('Hakuna zao lenye mbinu ya NPK kwenye data hii.');
    }
    data.regions.forEach(function appendRegion(item) {
      byId('region').appendChild(option(item.id, cfg.regionNames[item.id] || item.name));
    });
    Object.keys(cfg.previousCrops).forEach(function appendPreviousCrop(id) {
      byId('previousCrop').appendChild(option(id, cfg.previousCrops[id]));
    });
    byId('region').addEventListener('change', updateSoils);
    byId('crop').addEventListener('change', updateTargetPlaceholder);
    updateSoils();
    updateTargetPlaceholder();
    byId('farmSize').value = data.agriStats.avgFarmSizeHa || 1;
  }

  function optionalNumber(id) {
    var value = byId(id).value.trim();
    return value === '' ? null : Number(value);
  }

  function fail(message, field) {
    latest = null;
    window.__SW_AGRI_TEST__.latest = null;
    byId('formError').textContent = message;
    byId('resultPanel').hidden = true;
    byId('emptyState').hidden = false;
    if (field) field.focus();
    return null;
  }

  function calculate() {
    byId('formError').textContent = '';
    var farmSize = Number(byId('farmSize').value);
    var targetYield = optionalNumber('targetYield');
    var soilPh = optionalNumber('soilPh');
    var organicMatter = optionalNumber('organicMatter');
    var availableN = optionalNumber('availableN');
    var phosphorus = optionalNumber('phosphorus');
    var potassium = optionalNumber('potassium');
    if (!Number.isFinite(farmSize) || farmSize < 0.1) {
      return fail('Weka ukubwa halali wa shamba wa angalau hekta 0.1.', byId('farmSize'));
    }
    if (targetYield !== null && (!Number.isFinite(targetYield) || targetYield < 0.1)) {
      return fail('Mavuno lengwa lazima yawe angalau tani 0.1 kwa hekta.', byId('targetYield'));
    }
    if (soilPh !== null && (!Number.isFinite(soilPh) || soilPh < 0 || soilPh > 14)) {
      return fail('pH ya udongo lazima iwe kati ya 0 na 14.', byId('soilPh'));
    }
    var nonNegativeFields = [
      [organicMatter, byId('organicMatter')],
      [availableN, byId('availableN')],
      [phosphorus, byId('phosphorus')],
      [potassium, byId('potassium')]
    ];
    for (var index = 0; index < nonNegativeFields.length; index += 1) {
      if (nonNegativeFields[index][0] !== null && (
        !Number.isFinite(nonNegativeFields[index][0]) || nonNegativeFields[index][0] < 0
      )) {
        return fail('Majibu ya kipimo cha udongo hayawezi kuwa hasi.', nonNegativeFields[index][1]);
      }
    }

    var input = {
      cropId: byId('crop').value,
      regionId: byId('region').value,
      farmSizeHa: farmSize,
      targetYieldPerHa: targetYield,
      soilType: byId('soil').value,
      previousCrop: byId('previousCrop').value,
      soilTest: byId('soilTestPanel').hidden ? null : {
        pH: soilPh,
        organicMatter: organicMatter,
        N_ppm: availableN,
        P_ppm: phosphorus,
        K_ppm: potassium
      }
    };
    var result = engine.calculate(input, data, cropDatabase);
    if (result.error) {
      return fail('Hesabu ya NPK haikuweza kufanyika kwa chaguo hili.', byId('crop'));
    }
    latest = { input: input, result: result };
    window.__SW_AGRI_TEST__.latest = latest;
    byId('emptyState').hidden = true;
    byId('resultPanel').hidden = false;
    byId('nitrogen').textContent = number(result.perHa.N);
    byId('phosphorusResult').textContent = number(result.perHa.P);
    byId('potassiumResult').textContent = number(result.perHa.K);

    var productRows = byId('productRows');
    var productCards = byId('productCards');
    productRows.innerHTML = '';
    productCards.innerHTML = '';
    result.products.forEach(function renderProduct(item) {
      var values = [
        productName(item.name),
        number(item.bags),
        number(item.totalWeight_kg) + ' kg',
        currency(item.totalCostMarket)
      ];
      var row = document.createElement('tr');
      values.forEach(function appendCell(value) {
        var cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });
      productRows.appendChild(row);

      var card = document.createElement('article');
      card.className = 'fertilizer-product-card';
      var heading = document.createElement('strong');
      heading.textContent = values[0];
      card.appendChild(heading);
      ['Mifuko: ' + values[1], 'Uzito: ' + values[2], 'Gharama elekezi: ' + values[3]]
        .forEach(function appendLine(value) {
          var line = document.createElement('span');
          line.textContent = value;
          card.appendChild(line);
        });
      productCards.appendChild(card);
    });
    byId('productEmpty').hidden = Boolean(result.products.length);
    byId('marketCost').textContent = currency(result.costMarket);
    byId('subsidyCost').textContent = result.costSubsidy == null
      ? 'Haijaonyeshwa'
      : currency(result.costSubsidy);
    byId('savings').textContent = result.costSubsidy == null
      ? 'Haijaonyeshwa'
      : currency(result.savings);

    var schedule = byId('schedule');
    schedule.innerHTML = '';
    result.schedule.forEach(function renderSchedule(item, scheduleIndex) {
      var line = document.createElement('li');
      line.textContent = scheduleName(scheduleIndex) + ' — '
        + scheduleTiming(scheduleIndex, item) + '. ' + scheduleNote(scheduleIndex);
      schedule.appendChild(line);
    });
    var organic = byId('organic');
    organic.innerHTML = '';
    result.organic.forEach(function renderOrganic(item) {
      var line = document.createElement('li');
      line.textContent = organicName(item.type) + ': takriban tani ' + number(item.tonnes);
      organic.appendChild(line);
    });
    byId('subsidyNote').textContent = result.subsidyInfo && result.subsidyInfo.active
      ? 'Data inaonyesha programu ya ruzuku (“' + result.subsidyInfo.programName
        + '”). Thibitisha ustahiki, bei na upatikanaji kwa taasisi ya eneo lako.'
      : 'Hakuna programu hai ya ruzuku iliyoonyeshwa kwenye data hii.';
    status('Makadirio ya NPK yamekokotolewa ndani ya kivinjari.');
    return result;
  }

  function reset() {
    latest = null;
    window.__SW_AGRI_TEST__.latest = null;
    byId('resultPanel').hidden = true;
    byId('emptyState').hidden = false;
    byId('formError').textContent = '';
    byId('farmSize').value = data.agriStats.avgFarmSizeHa || 1;
    byId('region').selectedIndex = 0;
    byId('soilTestPanel').hidden = true;
    byId('soilTestToggle').setAttribute('aria-expanded', 'false');
    updateSoils();
    updateTargetPlaceholder();
    status('Fomu imewekwa upya.');
  }

  byId('fertilizerForm').addEventListener('submit', function submit(event) {
    event.preventDefault();
    calculate();
  });
  byId('fertilizerForm').addEventListener('reset', function handleReset() {
    setTimeout(reset, 0);
  });
  byId('soilTestToggle').addEventListener('click', function toggleSoilTest() {
    var panel = byId('soilTestPanel');
    panel.hidden = !panel.hidden;
    byId('soilTestToggle').setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
    if (!panel.hidden) byId('soilPh').focus();
  });

  document.addEventListener('click', function handleAction(event) {
    var button = event.target.closest('[data-action]');
    if (!button) return;
    if (!latest) {
      status('Endesha hesabu kwanza.', true);
      return;
    }
    var action = button.getAttribute('data-action');
    var object = reportObject();
    var text = reportText();
    var slug = 'afrotools-mbolea-' + cfg.countryCode.toLowerCase();
    if (action === 'copy') {
      copyText(text)
        .then(function copied() { status('Matokeo yamenakiliwa.'); })
        .catch(function copyBlocked() { status('Kivinjari kimezuia kunakili.', true); });
    }
    if (action === 'share') {
      if (navigator.share) {
        navigator.share({
          title: 'Mahitaji ya mbolea — ' + cfg.countryName,
          text: text,
          url: location.href
        }).catch(function shareError(error) {
          if (error && error.name !== 'AbortError') status('Kushiriki hakupatikani.', true);
        });
      } else {
        copyText(location.href + '\n\n' + text)
          .then(function sharedByCopy() { status('Kiungo na matokeo vimenakiliwa.'); });
      }
    }
    if (action === 'save') {
      try {
        localStorage.setItem(cfg.storageKey, JSON.stringify(object));
        status('Matokeo yamehifadhiwa kwenye kivinjari hiki.');
      } catch (error) {
        status('Kivinjari kimezuia hifadhi ya ndani.', true);
      }
    }
    if (action === 'txt') {
      download('\ufeff' + text, 'text/plain;charset=utf-8', slug + '.txt');
      status('TXT imepakuliwa.');
    }
    if (action === 'json') {
      download(JSON.stringify(object, null, 2), 'application/json;charset=utf-8', slug + '.json');
      status('JSON imepakuliwa.');
    }
    if (action === 'csv') {
      var result = localizedResult();
      var rows = [[
        'nchi', 'msimbo_wa_nchi', 'zao', 'kanda', 'ukubwa_hekta',
        'n_kg_hekta', 'p2o5_kg_hekta', 'k2o_kg_hekta', 'sarafu',
        'gharama_elekezi', 'data_ya_moja_kwa_moja'
      ], [
        cfg.countryName, cfg.countryCode, result.zao, result.kanda,
        result.ukubwaWaShambaHekta, result.mahitajiKwaHekta.N,
        result.mahitajiKwaHekta.P, result.mahitajiKwaHekta.K,
        result.sarafu, result.gharamaSokoni, 'hapana'
      ]];
      download(
        '\ufeff' + rows.map(function renderCsv(row) {
          return row.map(csvCell).join(',');
        }).join('\r\n'),
        'text/csv;charset=utf-8',
        slug + '.csv'
      );
      status('CSV imepakuliwa.');
    }
    if (action === 'pdf') {
      var JsPdf = window.jspdf && window.jspdf.jsPDF;
      if (!JsPdf) {
        status('PDF haipatikani kwenye kivinjari hiki.', true);
        return;
      }
      var doc = new JsPdf({ unit: 'pt', format: 'a4' });
      var printable = text.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’‘]/g, "'")
        .replace(/[—–]/g, '-')
        .replace(/₂/g, '2');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(doc.splitTextToSize(printable, 500), 48, 58);
      doc.save(slug + '.pdf');
      status('PDF imepakuliwa.');
    }
  });

  window.__SW_AGRI_TEST__ = {
    calculate: calculate,
    latest: null,
    engine: engine,
    data: data,
    config: cfg,
    reportObject: reportObject,
    reportText: reportText
  };
  try {
    initialize();
  } catch (error) {
    byId('formError').textContent = error.message;
    console.error(error);
  }
})(window, document);
