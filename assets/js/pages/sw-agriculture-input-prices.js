(function initSwahiliInputPrices(root) {
  'use strict';

  var config = root.__SW_AGRI_PAGE__ || {};
  var engine = root.AfroTools && root.AfroTools.InputPricesEngine;
  var data = root.INPUT_PRICES;
  var country = null;
  var latest = null;
  var validTypes = ['all', 'fertilizers', 'seeds', 'agrochemicals'];
  var validPriceModes = ['market', 'subsidized'];

  function byId(id) { return document.getElementById(id); }
  function option(value, label) { var node = document.createElement('option'); node.value = value; node.textContent = label; return node; }
  function number(value, digits) { return new Intl.NumberFormat('sw', { maximumFractionDigits: digits == null ? 1 : digits }).format(Number(value) || 0); }
  function money(value) { return new Intl.NumberFormat('sw', { style: 'currency', currency: country.currency, maximumFractionDigits: 0 }).format(Number(value) || 0); }
  function csvCell(value) { var text = String(value == null ? '' : value); return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text; }
  function setStatus(message, error) { var node = byId('actionStatus'); node.textContent = message || ''; node.style.color = error ? 'var(--agri-danger)' : 'var(--agri-good)'; }
  function setActionsEnabled(enabled) { document.querySelectorAll('[data-result-action]').forEach(function (button) { button.disabled = !enabled; }); }
  function clearResult(options) {
    latest = null; root.__SW_AGRI_TEST__.latest = null; byId('resultPanel').hidden = true; byId('emptyState').hidden = false;
    setActionsEnabled(false); if (!options || !options.keepStatus) setStatus('');
  }
  function supplier(value) {
    return String(value || '')
      .replace(/ANADER recommended/gi, 'Iliyopendekezwa na ANADER')
      .replace(/certified nurseries/gi, 'vitalu vilivyoidhinishwa')
      .replace(/Certified \(EU import\)/gi, 'Iliyoidhinishwa, imeagizwa kutoka EU')
      .replace(/Certified importers/gi, 'Waagizaji walioidhinishwa')
      .replace(/Multiple certified/gi, 'Wasambazaji kadhaa walioidhinishwa')
      .replace(/Imported \(OCP Morocco\)/gi, 'Imeagizwa kutoka OCP Moroko')
      .replace(/Imported via /gi, 'Imeagizwa kupitia ')
      .replace(/Various \(imported\)/gi, 'Wauzaji mbalimbali wa bidhaa zilizoagizwa')
      .replace(/NARO certified/gi, 'NARO iliyoidhinishwa')
      .replace(/ISRA certified/gi, 'ISRA iliyoidhinishwa')
      .replace(/RAB certified/gi, 'RAB iliyoidhinishwa')
      .replace(/\/certified/gi, '/iliyoidhinishwa')
      .replace(/Certified/gi, 'Iliyoidhinishwa')
      .replace(/Imported/gi, 'Imeagizwa')
      .replace(/Local quarries/gi, 'Machimbo ya ndani')
      .replace(/Pioneer\/Local/gi, 'Pioneer/ya ndani')
      .replace(/Various/gi, 'Wauzaji mbalimbali')
      .replace(/gov\./gi, 'serikali');
  }
  function brand(value) {
    return String(value || '')
      .replace(/^AGRA Rice$/i, 'Mpunga wa AGRA')
      .replace(/^Cocoa booster/i, 'Kiongeza cha kakao')
      .replace(/^Cocoa fertilizer/i, 'Mbolea ya kakao')
      .replace(/Cocoa Blend/gi, 'Mchanganyiko wa kakao')
      .replace(/^Hybrid cocoa pods$/i, 'Maganda ya kakao chotara')
      .replace(/^IIA cassava cutting$/i, 'Kipando cha muhogo cha IIA')
      .replace(/^Local OPV$/i, 'OPV ya ndani')
      .replace(/^Roundup Ready varieties$/i, 'Aina za Roundup Ready')
      .replace(/^TGX varieties$/i, 'Aina za TGX')
      .replace(/^TME 7 cutting$/i, 'Kipando cha TME 7')
      .replace(/^Gypsum/i, 'Jasi')
      .replace(/^Super triple phosphate/i, 'Superfosfati tatu')
      .replace(/^Super phosphate/i, 'Superfosfati')
      .replace(/\(hybrid\)/gi, '(chotara)')
      .replace(/\(durum\)/gi, '(ngano durum)')
      .replace(/\(local OCP\)/gi, '(OCP ya ndani)')
      .replace(/\(local\)/gi, '(ya ndani)')
      .replace(/\(with Boron\)/gi, '(yenye boroni)')
      .replace(/\(bread wheat\)/gi, '(ngano ya mkate)')
      .replace(/\(blended\)/gi, '(mchanganyiko)');
  }
  function unit(value) {
    return ({ bundle: 'fungu', 'per cutting bundle': 'kwa fungu la vipando', 'per seedling': 'kwa mche' })[value] || value || '—';
  }
  function crop(value) { return config.crops[value] || value || 'Mazao yote'; }
  function seedType(value) { return config.seedTypes[value] || value || '—'; }
  function seedNote(value) { return config.seedNotes[value] || value || ''; }
  function chemicalType(value) { return config.chemicalTypes[value] || value; }
  function tableHead(table, labels) {
    var head = document.createElement('thead'), row = document.createElement('tr');
    labels.forEach(function (label) { var cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = label; row.appendChild(cell); });
    head.appendChild(row); var body = document.createElement('tbody'); table.replaceChildren(head, body); return body;
  }
  function tableRow(values, cheapest) {
    var row = document.createElement('tr'); if (cheapest) row.className = 'cheapest';
    values.forEach(function (value) { var cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell); }); return row;
  }
  function resultCard(container, title, fields, cheapest) {
    var card = document.createElement('article'), heading = document.createElement('strong');
    card.className = 'input-price-card' + (cheapest ? ' cheapest' : ''); heading.textContent = title; card.appendChild(heading);
    fields.forEach(function (entry) { var line = document.createElement('span'); line.textContent = entry[0] + ': ' + entry[1]; card.appendChild(line); });
    container.appendChild(card);
  }
  function initialise() {
    if (!engine || !data || !data[config.countryCode]) throw new Error('Injini au data ya bei za pembejeo haipatikani.');
    country = data[config.countryCode]; byId('cropSel').replaceChildren(option('', 'Mazao yote'));
    country.crops.forEach(function (value) { byId('cropSel').appendChild(option(value, crop(value))); });
    byId('inputType').value = 'all'; byId('farmSize').value = '2'; byId('priceType').value = 'market'; byId('cropField').hidden = false;
    byId('formError').textContent = ''; clearResult();
  }
  function readInput() {
    return { countryCode: config.countryCode, inputType: byId('inputType').value, crop: byId('cropSel').value, farmSize: Number(byId('farmSize').value), priceMode: byId('priceType').value };
  }
  function fail(message, field) {
    clearResult({ keepStatus: true }); byId('formError').textContent = message;
    setStatus('Matokeo hayajakokotolewa. Sahihisha sehemu iliyoonyeshwa.', true); if (field) field.focus(); return false;
  }
  function validate(input) {
    if (validTypes.indexOf(input.inputType) < 0) return fail('Chagua kundi halali la pembejeo.', byId('inputType'));
    if (validPriceModes.indexOf(input.priceMode) < 0) return fail('Chagua aina halali ya bei.', byId('priceType'));
    if (!Number.isFinite(input.farmSize) || input.farmSize <= 0 || input.farmSize > 100000) return fail('Weka ukubwa wa shamba unaozidi 0 na usiozidi hekta 100,000.', byId('farmSize'));
    if (input.crop && country.crops.indexOf(input.crop) < 0) return fail('Chagua zao linalopatikana kwenye data ya nchi hii.', byId('cropSel'));
    return true;
  }
  function localisedRows(result) {
    return {
      mbolea: result.fertilizers.rows.map(function (row) { return { chapa: brand(row.brand), msambazaji: supplier(row.supplier), kiloKwaMfuko: row.bagKg, beiIliyotumika: row.selectedPrice, haliYaBei: row.selectedPriceMode === 'subsidized' ? 'ruzuku' : 'soko', beiKwaKilo: row.perKg, mifukoKwaHekta: row.bagsPerHa, gharamaKwaHekta: row.perHa, nafuuZaidi: row.isCheapest }; }),
      mbegu: result.seeds.rows.map(function (row) { return { zao: crop(row.crop), chapa: brand(row.brand), msambazaji: supplier(row.supplier), kiloKwaKifurushi: row.bagKg, kipimo: unit(row.unit), bei: row.price, aina: seedType(row.type), maelezo: seedNote(row.notes), kiasi: row.quantity, jumla: row.total, nafuuZaidi: row.isCheapest }; }),
      viuatilifu: result.agrochemicals.groups.map(function (group) { return { aina: chemicalType(group.type), bidhaa: group.rows.map(function (row) { return { chapa: brand(row.brand), ukubwa: row.size, bei: row.price, kiasi: row.quantity, jumla: row.total, nafuuZaidi: row.isCheapestInType }; }) }; })
    };
  }
  function reportObject() {
    if (!latest) return null; var result = latest.result, rows = localisedRows(result);
    return { schemaVersion: 1, zana: 'kilinganisha-bei-za-pembejeo', lugha: 'sw', nchi: { code: config.countryCode, jina: config.countryName },
      ingizo: { kundi: result.input.inputType, zao: crop(result.input.crop), ukubwaHekta: result.input.farmSize, haliYaBei: result.input.priceMode === 'subsidized' ? 'ruzuku' : 'soko' },
      matokeo: { mbolea: rows.mbolea, mbegu: rows.mbegu, viuatilifu: rows.viuatilifu, bajeti: result.budget, sarafu: country.currency },
      ruzuku: { jina: config.subsidyName, maelezo: config.subsidyCopy },
      chanzo: { lebo: config.sourceLabel, mapitio: config.dataReviewed, kiwangoChaUhakika: config.confidence, dataMojaKwaMoja: false },
      faragha: 'Hesabu hufanyika kwenye kivinjari hiki; hakuna ingizo linalotumwa kwa seva.' };
  }
  function reportText() {
    if (!latest) return ''; var result = latest.result, budget = result.budget;
    return ['AfroTools — bei za pembejeo za kilimo', 'Nchi: ' + config.countryName + ' (' + config.countryCode + ')',
      'Kundi: ' + result.input.inputType, 'Zao: ' + crop(result.input.crop), 'Ukubwa: ' + number(result.input.farmSize) + ' ha',
      'Aina ya bei: ' + (result.input.priceMode === 'subsidized' ? 'bei yenye ruzuku ikipatikana' : 'bei ya soko'),
      'Mbolea: ' + money(budget.fertilizerSubtotal), 'Mbegu: ' + money(budget.seedSubtotal), 'Viuatilifu: ' + money(budget.agrochemicalSubtotal),
      'Jumla: ' + money(budget.total), 'Rejea ya chapa za gharama kubwa: ' + money(budget.premium), 'Akiba ya makadirio: ' + money(budget.savings), '',
      'Vyanzo vilivyotajwa: ' + config.sourceLabel, 'Upya: ' + config.dataReviewed + '; si data ya moja kwa moja.',
      'Kiwango cha uhakika: ' + config.confidence, 'Faragha: hesabu ya ndani ya kivinjari; hakuna ingizo linalotumwa kwa seva.'].join('\n');
  }
  function render(result) {
    byId('fertCard').hidden = !result.visibility.fertilizers; byId('seedCard').hidden = !result.visibility.seeds; byId('chemCard').hidden = !result.visibility.agrochemicals;
    byId('fertMobile').replaceChildren(); byId('seedMobile').replaceChildren(); byId('chemMobile').replaceChildren();
    if (result.visibility.fertilizers) {
      var fertilizerBody = tableHead(byId('fertTable'), ['Bidhaa na msambazaji', 'Mfuko', 'Bei ya mfuko', 'Bei kwa kg', 'Gharama kwa ha']);
      result.fertilizers.rows.forEach(function (row) { var title = brand(row.brand) + ' — ' + supplier(row.supplier), bag = number(row.bagKg) + ' kg', price = money(row.selectedPrice), perKg = money(row.perKg) + '/kg', perHa = money(row.perHa); fertilizerBody.appendChild(tableRow([title, bag, price, perKg, perHa], row.isCheapest)); resultCard(byId('fertMobile'), title, [['Mfuko', bag], ['Bei ya mfuko', price], ['Bei kwa kg', perKg], ['Gharama kwa ha', perHa]], row.isCheapest); });
    }
    if (result.visibility.seeds) {
      var seedBody = tableHead(byId('seedTable'), ['Zao na aina', 'Kifurushi', 'Bei', 'Aina na maelezo']);
      result.seeds.rows.forEach(function (row) { var title = crop(row.crop) + ' — ' + brand(row.brand) + ' — ' + supplier(row.supplier), pack = row.bagKg ? number(row.bagKg) + ' kg' : unit(row.unit), price = money(row.price), note = seedType(row.type) + (row.notes ? ' — ' + seedNote(row.notes) : ''); seedBody.appendChild(tableRow([title, pack, price, note], row.isCheapest)); resultCard(byId('seedMobile'), title, [['Kifurushi', pack], ['Bei', price], ['Aina na maelezo', note]], row.isCheapest); });
      byId('seedStatus').textContent = result.seeds.usedFallback ? 'Zao hili halipo kwenye data ya nchi; mbegu zote zilizohifadhiwa zinaonyeshwa.' : '';
    }
    if (result.visibility.agrochemicals) {
      var chemicalBody = tableHead(byId('chemTable'), ['Aina na bidhaa', 'Kifurushi', 'Bei']);
      result.agrochemicals.groups.forEach(function (group) { group.rows.forEach(function (row) { var title = chemicalType(row.type) + ' — ' + brand(row.brand), price = money(row.price); chemicalBody.appendChild(tableRow([title, row.size, price], row.isCheapestInType)); resultCard(byId('chemMobile'), title, [['Kifurushi', row.size], ['Bei', price]], row.isCheapestInType); }); });
    }
    var budget = result.budget, items = [['Mbolea', budget.fertilizerSubtotal], ['Mbegu', budget.seedSubtotal], ['Viuatilifu', budget.agrochemicalSubtotal], ['Jumla kwa chaguo la gharama ndogo', budget.total]];
    byId('budgetGrid').replaceChildren(); items.forEach(function (item) { if (!item[1]) return; var container = document.createElement('div'), value = document.createElement('strong'), label = document.createElement('span'); container.className = 'metric'; value.textContent = money(item[1]); label.textContent = item[0]; container.append(value, label); byId('budgetGrid').appendChild(container); });
    byId('premiumSummary').textContent = budget.total ? 'Rejea ya chapa za gharama kubwa: ' + money(budget.premium) + '; akiba ya makadirio: ' + money(budget.savings) + ' (35%).' : '';
    var program = result.subsidyProgram, copy = config.subsidyCopy || []; byId('subsidyBox').textContent = program && config.subsidyName ? config.subsidyName + ' — ' + (program.subsidyPercent ? program.subsidyPercent + '% ya punguzo lililotajwa. ' : '') + (copy[0] || '') + ' ' + (copy[1] || '') : '';
    byId('emptyState').hidden = true; byId('resultPanel').hidden = false; setActionsEnabled(true); setStatus('Ulinganisho umekokotolewa kwenye kivinjari hiki.'); byId('resultPanel').focus();
  }
  function calculate() {
    byId('formError').textContent = ''; var input = readInput(); if (!validate(input)) return null;
    var result = engine.calculate(input, country, data.appRates, config.behavior);
    if (!result || !result.ok) return fail('Hesabu haikukamilika kwa nchi hii.', byId('inputType'));
    latest = { input: input, result: result }; root.__SW_AGRI_TEST__.latest = latest; render(result); return result;
  }
  function download(content, type, filename) { var url = URL.createObjectURL(new Blob([content], { type: type })), link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 0); }
  function createCsv() {
    var result = latest.result, budget = result.budget;
    return '\ufeff' + [['nchi', 'code_nchi', 'ukubwa_ha', 'hali_bei', 'jumla_mbolea', 'jumla_mbegu', 'jumla_viuatilifu', 'jumla', 'rejea_gharama_kubwa', 'akiba', 'sarafu', 'mapitio', 'data_moja_kwa_moja'], [config.countryName, config.countryCode, result.input.farmSize, result.input.priceMode === 'subsidized' ? 'ruzuku' : 'soko', budget.fertilizerSubtotal, budget.seedSubtotal, budget.agrochemicalSubtotal, budget.total, budget.premium, budget.savings, country.currency, config.dataReviewed, 'hapana']].map(function (row) { return row.map(csvCell).join(','); }).join('\r\n');
  }
  async function runAction(action) {
    if (!latest) return setStatus('Linganisha bei upya kabla ya kutumia kitendo hiki.', true);
    var object = reportObject(), text = reportText(), slug = 'afrotools-bei-pembejeo-' + config.countryCode.toLowerCase();
    try {
      if (action === 'copy') { await navigator.clipboard.writeText(text); setStatus('Muhtasari umenakiliwa.'); }
      else if (action === 'share') { var payload = { title: 'Bei za pembejeo za kilimo', text: text, url: location.href }; if (navigator.share) { await navigator.share(payload); setStatus('Kidirisha cha kushiriki kimefunguliwa.'); } else { await navigator.clipboard.writeText(payload.url + '\n\n' + payload.text); setStatus('Kushiriki kwa mfumo hakupatikani; kiungo na muhtasari vimenakiliwa.'); } }
      else if (action === 'save') { localStorage.setItem(config.storageKey + ':' + config.countryCode, JSON.stringify(object)); setStatus('Nakala imehifadhiwa kwenye kivinjari hiki.'); }
      else if (action === 'json') { download(JSON.stringify(object, null, 2), 'application/json;charset=utf-8', slug + '.json'); setStatus('Faili ya JSON imepakuliwa.'); }
      else if (action === 'txt') { download('\ufeff' + text, 'text/plain;charset=utf-8', slug + '.txt'); setStatus('Faili ya TXT imepakuliwa.'); }
      else if (action === 'csv') { download(createCsv(), 'text/csv;charset=utf-8', slug + '.csv'); setStatus('Faili ya CSV imepakuliwa.'); }
      else if (action === 'pdf') { var JsPdf = root.jspdf && root.jspdf.jsPDF; if (!JsPdf) throw new Error('Maktaba ya PDF haipatikani.'); var pdf = new JsPdf({ unit: 'pt', format: 'a4' }); pdf.text(pdf.splitTextToSize(text.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), 500), 48, 58); pdf.save(slug + '.pdf'); setStatus('Faili ya PDF imepakuliwa.'); }
    } catch (error) { setStatus('Kitendo hakikukamilika: ' + (error && error.message ? error.message : 'jaribu tena.'), true); }
  }

  root.__SW_AGRI_TEST__ = { calculate: calculate, latest: null, engine: engine, data: data, reportObject: reportObject, reportText: reportText, createCsv: createCsv, invalidate: clearResult };
  document.addEventListener('DOMContentLoaded', function () {
    var form = byId('inputPricesForm'); try { initialise(); } catch (error) { byId('formError').textContent = error.message; console.error(error); return; }
    byId('inputType').addEventListener('change', function () { byId('cropField').hidden = !(this.value === 'all' || this.value === 'seeds'); });
    form.addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
    form.addEventListener('input', function () { clearResult(); byId('formError').textContent = ''; });
    form.addEventListener('change', function () { clearResult(); byId('formError').textContent = ''; });
    form.addEventListener('reset', function () { setTimeout(function () { initialise(); byId('inputType').focus(); }, 0); });
    document.addEventListener('click', function (event) { var button = event.target.closest('[data-result-action]'); if (button) runAction(button.dataset.resultAction); });
  });
})(window);
