(function initSwahiliLivestockFeed(root) {
  'use strict';

  var app = root.AfroTools = root.AfroTools || {};
  var config = root.__SW_AGRI_PAGE__ || {};
  var data = app.LivestockFeedData;
  var engine = app.LivestockFeedEngine;
  var prices = null;
  var latest = null;

  function byId(id) { return document.getElementById(id); }
  function number(value, digits) {
    return new Intl.NumberFormat('sw', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits == null ? 2 : digits
    }).format(Number(value) || 0);
  }
  function money(value) {
    return new Intl.NumberFormat('sw', {
      style: 'currency', currency: prices.currency, maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }
  function csvCell(value) {
    var text = String(value == null ? '' : value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }
  function option(value, label) {
    var node = document.createElement('option');
    node.value = value;
    node.textContent = label;
    return node;
  }
  function setStatus(message, error) {
    var node = byId('actionStatus');
    node.textContent = message || '';
    node.style.color = error ? 'var(--agri-danger)' : 'var(--agri-good)';
  }
  function setActionsEnabled(enabled) {
    document.querySelectorAll('[data-result-action]').forEach(function (button) {
      button.disabled = !enabled;
    });
  }
  function clearResult(options) {
    latest = null;
    root.__SW_AGRI_TEST__.latest = null;
    byId('resultPanel').hidden = true;
    byId('emptyState').hidden = false;
    setActionsEnabled(false);
    if (!options || !options.keepStatus) setStatus('');
  }
  function populateClasses() {
    var animal = data[byId('animal').value];
    var select = byId('animalClass');
    select.innerHTML = '';
    Object.keys(animal.classes).forEach(function (key) {
      select.appendChild(option(key, config.classes[key] || 'Kundi la mnyama'));
    });
  }
  function availableIngredients() {
    return Object.keys(data.ingredients).filter(function (key) {
      var ingredient = data.ingredients[key];
      return (ingredient.avail.indexOf(config.countryCode) >= 0 || ingredient.avail.indexOf('ALL') >= 0)
        && prices[key] !== undefined;
    });
  }
  function populateIngredients() {
    var container = byId('ingredients');
    container.innerHTML = '';
    availableIngredients().forEach(function (key) {
      var ingredient = data.ingredients[key];
      var wrapper = document.createElement('div');
      var input = document.createElement('input');
      var label = document.createElement('label');
      input.type = 'checkbox';
      input.id = 'ingredient-' + key;
      input.value = key;
      input.checked = true;
      input.className = 'ingredient';
      label.htmlFor = input.id;
      label.textContent = (config.ingredients[key] || key) + ' - ' + config.categories[ingredient.cat]
        + ' - ' + (prices[key] === 0 ? 'bila gharama ya ununuzi' : money(prices[key]) + '/kg');
      wrapper.className = 'field';
      wrapper.appendChild(input);
      wrapper.appendChild(label);
      container.appendChild(wrapper);
    });
  }
  function initialise() {
    if (!data || !engine || !data.prices || !data.prices[config.countryCode]) {
      throw new Error('Injini au data ya chakula cha mifugo haipatikani.');
    }
    prices = data.prices[config.countryCode];
    byId('animal').value = 'cattle';
    byId('weight').value = '300';
    byId('number').value = '1';
    byId('budget').value = '0';
    populateClasses();
    populateIngredients();
    byId('formError').textContent = '';
    clearResult();
  }
  function readInput() {
    return {
      animalType: byId('animal').value,
      animalClass: byId('animalClass').value,
      bodyWeight: Number(byId('weight').value),
      numAnimals: Number(byId('number').value),
      selectedFeeds: Array.from(document.querySelectorAll('.ingredient:checked')).map(function (node) { return node.value; }),
      maxBudget: Number(byId('budget').value),
      countryCode: config.countryCode
    };
  }
  function fail(message, field) {
    clearResult({ keepStatus: true });
    byId('formError').textContent = message;
    setStatus('Mgao haujapangwa. Sahihisha sehemu iliyoonyeshwa.', true);
    if (field) field.focus();
    return false;
  }
  function validate(input) {
    if (!data[input.animalType]) return fail('Chagua aina halali ya mnyama.', byId('animal'));
    if (!data[input.animalType].classes[input.animalClass]) {
      return fail('Chagua hatua au lengo halali la uzalishaji.', byId('animalClass'));
    }
    if (!Number.isFinite(input.bodyWeight) || input.bodyWeight < 1 || input.bodyWeight > 2000) {
      return fail('Weka uzito hai kati ya kg 1 na 2,000.', byId('weight'));
    }
    if (!Number.isInteger(input.numAnimals) || input.numAnimals < 1 || input.numAnimals > 10000) {
      return fail('Weka idadi kamili ya wanyama kati ya 1 na 10,000.', byId('number'));
    }
    if (!Number.isFinite(input.maxBudget) || input.maxBudget < 0) {
      return fail('Bajeti haiwezi kuwa chini ya sifuri.', byId('budget'));
    }
    if (!input.selectedFeeds.length) {
      return fail('Chagua angalau kiambato kimoja cha malisho.', document.querySelector('.ingredient'));
    }
    return true;
  }
  function localisedResult(result) {
    return {
      mnyama: config.animals[result.animalType],
      kundi: config.classes[latest.input.animalClass],
      uzitoKg: result.bodyWeight,
      idadi: result.numAnimals,
      malishoMakavuKg: result.dmi,
      mahitaji: { protiniG: result.req.cp_g, tdnG: result.req.tdn_g, nishatiMj: result.req.me_mj },
      kilichotolewa: { protiniG: result.prov.cp_g, tdnG: result.prov.tdn_g, protiniAsilimia: result.prov.cp_pct_diet, tdnAsilimia: result.prov.tdn_pct_diet },
      uwiano: { protiniImetimia: result.balance.cp_ok, tdnImetimia: result.balance.tdn_ok },
      gharama: result.costs,
      gharamaMbadalaKwaSiku: result.alt.dailyCost,
      imezidiBajeti: result.overBudget,
      sarafu: result.currency,
      mgao: result.ration.map(function (item) {
        return {
          kiambato: config.ingredients[item.id] || item.id,
          kiambatoId: item.id,
          kiloMbichi: item.freshKg,
          kiloKavu: item.dmKg,
          protiniG: item.cp_g,
          tdnG: item.tdn_g,
          gharama: item.cost
        };
      })
    };
  }
  function reportObject() {
    if (!latest) return null;
    return {
      schemaVersion: 1,
      zana: 'chakula-cha-mifugo',
      lugha: 'sw',
      nchi: { code: config.countryCode, jina: config.countryName },
      ingizo: latest.input,
      matokeo: localisedResult(latest.result),
      chanzo: { lebo: config.sourceLabel, mapitio: config.dataReviewed, dataMojaKwaMoja: false },
      faragha: 'Hesabu hufanyika kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.'
    };
  }
  function reportText() {
    if (!latest) return '';
    var result = localisedResult(latest.result);
    return [
      'AfroTools - Chakula cha mifugo',
      'Nchi: ' + config.countryName + ' (' + config.countryCode + ')',
      'Mnyama: ' + result.mnyama,
      'Kundi: ' + result.kundi,
      'Uzito: ' + number(result.uzitoKg) + ' kg',
      'Idadi: ' + result.idadi,
      'Malisho makavu: ' + number(result.malishoMakavuKg) + ' kg kwa mnyama kwa siku',
      'Protini: ' + number(result.kilichotolewa.protiniG, 0) + ' / ' + number(result.mahitaji.protiniG, 0) + ' g',
      'TDN: ' + number(result.kilichotolewa.tdnG, 0) + ' / ' + number(result.mahitaji.tdnG, 0) + ' g',
      'Gharama kwa mnyama kwa siku: ' + money(result.gharama.dailyPerAnimal),
      'Gharama ya kundi kwa mwezi: ' + money(result.gharama.monthlyTotal),
      'Gharama ya kundi kwa mwaka: ' + money(result.gharama.annualTotal),
      '',
      'Mgao:',
    ].concat(result.mgao.map(function (item) {
      return '- ' + item.kiambato + ': ' + number(item.kiloMbichi) + ' kg mbichi; ' + money(item.gharama);
    }), [
      '',
      'Chanzo: ' + config.sourceLabel,
      'Upya: ' + config.dataReviewed + '; si data ya moja kwa moja.',
      'Kiwango cha uhakika: makadirio ya kupanga; thibitisha mgao na mtaalamu wa lishe ya mifugo au daktari wa mifugo.',
      'Faragha: hesabu ya ndani ya kivinjari; hakuna ingizo linalotumwa kwa seva.'
    ]).join('\n');
  }
  function render(result) {
    byId('emptyState').hidden = true;
    byId('resultPanel').hidden = false;
    byId('dailyCost').textContent = money(result.costs.dailyPerAnimal);
    byId('dmi').textContent = number(result.dmi) + ' kg';
    byId('protein').textContent = number(result.prov.cp_g, 0) + ' / ' + number(result.req.cp_g, 0) + ' g';
    byId('tdn').textContent = number(result.prov.tdn_g, 0) + ' / ' + number(result.req.tdn_g, 0) + ' g';
    byId('monthly').textContent = money(result.costs.monthlyTotal);
    byId('annual').textContent = money(result.costs.annualTotal);
    byId('alternative').textContent = money(result.alt.dailyCost);
    byId('ration').innerHTML = result.ration.map(function (item) {
      return '<li>' + config.ingredients[item.id] + ': ' + number(item.freshKg) + ' kg mbichi, ' + money(item.cost) + '</li>';
    }).join('');
    byId('balance').textContent = 'Uwiano - protini: ' + (result.balance.cp_ok ? 'lengo limetimia' : 'upungufu')
      + '; TDN: ' + (result.balance.tdn_ok ? 'lengo limetimia' : 'upungufu') + '.';
    byId('schedule').textContent = 'Gawa malisho yaliyokolezwa na yenye nyuzinyuzi asubuhi na jioni; maji safi yawepo wakati wote.';
    setActionsEnabled(true);
    setStatus(result.overBudget ? 'Mgao umepangwa lakini umezidi bajeti uliyoweka.' : 'Mgao umepangwa kwenye kivinjari hiki.');
    byId('resultPanel').focus();
  }
  function calculate() {
    byId('formError').textContent = '';
    var input = readInput();
    if (!validate(input)) return null;
    var result = engine.calculate(input, data);
    if (!result || result.error) return fail('Mgao haukukamilika. Kagua ingizo na viambato.', byId('weight'));
    latest = { input: input, result: result };
    root.__SW_AGRI_TEST__.latest = latest;
    render(result);
    return result;
  }
  function download(content, type, filename) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function createCsv() {
    var result = localisedResult(latest.result);
    return '\ufeff' + [
      ['nchi', 'code_nchi', 'mnyama', 'kundi', 'uzito_kg', 'idadi', 'malisho_makavu_kg', 'protini_inayohitajika_g', 'protini_iliyotolewa_g', 'tdn_inayohitajika_g', 'tdn_iliyotolewa_g', 'gharama_siku_mnyama', 'gharama_mwaka_kundi', 'sarafu', 'data_moja_kwa_moja'],
      [config.countryName, config.countryCode, result.mnyama, result.kundi, result.uzitoKg, result.idadi, result.malishoMakavuKg, result.mahitaji.protiniG, result.kilichotolewa.protiniG, result.mahitaji.tdnG, result.kilichotolewa.tdnG, result.gharama.dailyPerAnimal, result.gharama.annualTotal, result.sarafu, 'hapana']
    ].map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
  }
  async function runAction(action) {
    if (!latest) return setStatus('Panga mgao mpya kabla ya kutumia kitendo hiki.', true);
    var object = reportObject();
    var text = reportText();
    var slug = 'afrotools-mgao-' + config.countryCode.toLowerCase();
    try {
      if (action === 'copy') {
        await navigator.clipboard.writeText(text);
        setStatus('Muhtasari umenakiliwa.');
      } else if (action === 'share') {
        var payload = { title: 'Chakula cha mifugo', text: text, url: location.href };
        if (navigator.share) {
          await navigator.share(payload);
          setStatus('Kidirisha cha kushiriki kimefunguliwa.');
        } else {
          await navigator.clipboard.writeText(payload.url + '\n\n' + payload.text);
          setStatus('Kushiriki kwa mfumo hakupatikani; kiungo na muhtasari vimenakiliwa.');
        }
      } else if (action === 'save') {
        localStorage.setItem(config.storageKey + ':' + config.countryCode, JSON.stringify(object));
        setStatus('Nakala imehifadhiwa kwenye kivinjari hiki.');
      } else if (action === 'json') {
        download(JSON.stringify(object, null, 2), 'application/json;charset=utf-8', slug + '.json');
        setStatus('Faili ya JSON imepakuliwa.');
      } else if (action === 'txt') {
        download('\ufeff' + text, 'text/plain;charset=utf-8', slug + '.txt');
        setStatus('Faili ya TXT imepakuliwa.');
      } else if (action === 'csv') {
        download(createCsv(), 'text/csv;charset=utf-8', slug + '.csv');
        setStatus('Faili ya CSV imepakuliwa.');
      } else if (action === 'pdf') {
        var JsPdf = root.jspdf && root.jspdf.jsPDF;
        if (!JsPdf) throw new Error('Maktaba ya PDF haipatikani.');
        var pdf = new JsPdf({ unit: 'pt', format: 'a4' });
        pdf.text(pdf.splitTextToSize(text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 500), 48, 58);
        pdf.save(slug + '.pdf');
        setStatus('Faili ya PDF imepakuliwa.');
      }
    } catch (error) {
      setStatus('Kitendo hakikukamilika: ' + (error && error.message ? error.message : 'jaribu tena.'), true);
    }
  }

  root.__SW_AGRI_TEST__ = {
    calculate: calculate, latest: null, reportObject: reportObject, reportText: reportText,
    engine: engine, data: data, invalidate: clearResult
  };

  document.addEventListener('DOMContentLoaded', function () {
    var form = byId('feedForm');
    try { initialise(); } catch (error) {
      byId('formError').textContent = error.message;
      console.error(error);
      return;
    }
    form.addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
    form.addEventListener('input', function () { clearResult(); byId('formError').textContent = ''; });
    form.addEventListener('change', function (event) {
      clearResult();
      byId('formError').textContent = '';
      if (event.target.id === 'animal') populateClasses();
    });
    form.addEventListener('reset', function () {
      setTimeout(function () { initialise(); byId('animal').focus(); }, 0);
    });
    document.addEventListener('click', function (event) {
      var button = event.target.closest('[data-result-action]');
      if (button) runAction(button.dataset.resultAction);
    });
  });
})(window);
