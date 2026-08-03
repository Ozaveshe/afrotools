(function initSwCivilSiteWorksParity(root) {
  'use strict';

  var form = document.getElementById('civil-form');
  if (!form || !root.AfroTools) return;

  var toolId = document.body.getAttribute('data-civil-tool');
  var engines = {
    'site-clearance': root.AfroTools.SiteClearingEngine,
    'road-construction-cost': root.AfroTools.RoadConstructionCostEngine
  };
  var engine = engines[toolId];
  if (!engine) return;

  var resultPanel = document.getElementById('civil-result');
  var errorBox = document.getElementById('civil-error');
  var status = document.getElementById('civil-status');
  var breakdown = document.getElementById('civil-breakdown');
  var exportButtons = Array.prototype.slice.call(document.querySelectorAll('[data-civil-export]'));
  var latest = null;
  var restoring = false;

  var COUNTRY_NAMES = {
    NG: 'Nigeria', KE: 'Kenya', ZA: 'Afrika Kusini', GH: 'Ghana', EG: 'Misri',
    ET: 'Ethiopia', TZ: 'Tanzania', UG: 'Uganda', RW: 'Rwanda', MA: 'Moroko'
  };
  var SURFACE_NAMES = { gravel: 'Changarawe / laterite', asphalt: 'Lami / bitumen', concrete: 'Zege gumu', interlocking: 'Vigae vya kufungamana' };
  var VEGETATION_NAMES = { cleared: 'Limeshasafishwa', light: 'Uoto mwepesi', medium: 'Uoto wa wastani', dense: 'Uoto mnene' };

  function number(id) { return Number(document.getElementById(id).value); }
  function value(id) { return document.getElementById(id).value; }
  function yes(id) { return value(id) === 'yes'; }
  function finiteReport(report) {
    if (!report || !report.ok) return false;
    function finite(valueToCheck) {
      if (typeof valueToCheck === 'number') return Number.isFinite(valueToCheck);
      if (!valueToCheck || typeof valueToCheck !== 'object') return true;
      return Object.keys(valueToCheck).every(function (key) { return finite(valueToCheck[key]); });
    }
    return finite(report);
  }
  function inputs() {
    if (toolId === 'site-clearance') {
      return {
        country: value('country'), area: number('area'), trees: number('trees'),
        terrain: value('terrain'), vegetation: value('vegetation'),
        removeTopsoil: yes('removeTopsoil'), demolition: value('demolition'), waste: value('waste')
      };
    }
    return {
      country: value('country'), length: number('length'), width: value('width'),
      surface: value('surface'), terrain: value('terrain'), location: value('location'),
      includeDrainage: yes('includeDrainage'), includeLighting: yes('includeLighting')
    };
  }
  function setExports(enabled) {
    exportButtons.forEach(function (button) { button.disabled = !enabled; });
  }
  function clearResult(message) {
    latest = null;
    resultPanel.hidden = true;
    resultPanel.classList.remove('is-current');
    breakdown.innerHTML = '';
    Array.prototype.slice.call(resultPanel.querySelectorAll('[data-output]')).forEach(function (node) {
      node.textContent = '—';
      node.removeAttribute('data-raw');
    });
    setExports(false);
    errorBox.hidden = true;
    errorBox.textContent = '';
    status.textContent = message || 'Tayari. Hesabu hufanyika ndani ya kivinjari.';
  }
  function money(symbol, amount) {
    return symbol + ' ' + Math.round(amount).toLocaleString('sw-TZ');
  }
  function decimal(amount, digits) {
    return Number(amount).toLocaleString('sw-TZ', { maximumFractionDigits: digits == null ? 2 : digits });
  }
  function output(key, raw, display) {
    var node = resultPanel.querySelector('[data-output="' + key + '"]');
    if (!node) return;
    node.setAttribute('data-raw', String(raw));
    node.textContent = display;
  }
  function row(label, valueText) {
    var tr = document.createElement('tr');
    var th = document.createElement('th');
    var td = document.createElement('td');
    th.scope = 'row'; th.textContent = label; td.textContent = valueText;
    tr.appendChild(th); tr.appendChild(td); breakdown.appendChild(tr);
  }
  function renderSite(report) {
    output('total', report.total, money(report.symbol, report.total));
    output('costPerM2', report.costPerM2, money(report.symbol, report.costPerM2) + ' / m²');
    output('days', report.days, decimal(report.days, 0) + ' siku');
    output('topsoilVolume', report.topsoilVolume, decimal(report.topsoilVolume) + ' m³');
    row('Kusafisha uoto', money(report.symbol, report.vegetationCost));
    row('Kukata miti', money(report.symbol, report.treeCost));
    row('Kuondoa udongo wa juu', money(report.symbol, report.topsoilCost));
    row('Ubomoaji', money(report.symbol, report.demolitionCost));
    row('Kuondoa taka', money(report.symbol, report.wasteCost));
  }
  function renderRoad(report) {
    output('total', report.total, money(report.symbol, report.total));
    output('baseCostPerKm', report.baseCostPerKm, money(report.symbol, report.baseCostPerKm) + ' / km');
    output('roadCost', report.roadCost, money(report.symbol, report.roadCost));
    output('extras', report.drainageCost + report.lightingCost, money(report.symbol, report.drainageCost + report.lightingCost));
    row('Kazi kuu ya barabara', money(report.symbol, report.roadCost));
    row('Mifereji na makalavati', money(report.symbol, report.drainageCost));
    row('Taa za barabarani', money(report.symbol, report.lightingCost));
    report.comparison.forEach(function (item) { row(SURFACE_NAMES[item.surface] + ' kwa km', money(report.symbol, item.costPerKm)); });
  }
  function calculate(options) {
    options = options || {};
    clearResult('Inakokotoa…');
    if (!form.checkValidity()) {
      errorBox.textContent = 'Kamilisha sehemu zote kwa thamani zilizo ndani ya mipaka iliyoonyeshwa.';
      errorBox.hidden = false;
      status.textContent = 'Hakuna matokeo mapya. Kunakili na upakuaji wa faili vimezimwa.';
      if (!options.silentValidity) form.reportValidity();
      return null;
    }
    var currentInputs = inputs();
    var report = engine.calculate(currentInputs);
    if (!finiteReport(report)) {
      errorBox.textContent = 'Maingizo haya hayatoi makadirio halali. Kagua vipimo na ujaribu tena.';
      errorBox.hidden = false;
      status.textContent = 'Hesabu imeshindwa; matokeo ya zamani yameondolewa na kunakili pamoja na upakuaji wa faili vimezimwa.';
      return null;
    }
    if (toolId === 'site-clearance') renderSite(report); else renderRoad(report);
    latest = {
      schemaVersion: 1,
      toolId: toolId,
      locale: 'sw',
      generatedAt: new Date().toISOString(),
      planningOnly: true,
      source: {
        owner: toolId === 'site-clearance' ? 'engines/src/site-clearing-engine.js' : 'engines/src/road-construction-cost-engine.js',
        rateState: 'static-planning-assumptions',
        engineReviewedAt: '2026-07-30',
        confidence: 'low-for-procurement'
      },
      inputs: currentInputs,
      result: report
    };
    resultPanel.hidden = false;
    resultPanel.classList.add('is-current');
    setExports(true);
    status.textContent = 'Makadirio mapya yako tayari. Kunakili na faili zitatumia maingizo na matokeo haya pekee.';
    if (!options.noFocus) resultPanel.focus();
    return latest;
  }
  function safeName() { return toolId + '-makadirio'; }
  function download(name, mime, content) {
    var url = URL.createObjectURL(new Blob([content], { type: mime }));
    var link = document.createElement('a');
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function reportText() {
    var labels = toolId === 'site-clearance'
      ? [['Nchi', COUNTRY_NAMES[latest.inputs.country]], ['Eneo', latest.inputs.area + ' m²'], ['Uoto', VEGETATION_NAMES[latest.inputs.vegetation]], ['Jumla', money(latest.result.symbol, latest.result.total)], ['Kwa m²', money(latest.result.symbol, latest.result.costPerM2)], ['Muda', latest.result.days + ' siku']]
      : [['Nchi', COUNTRY_NAMES[latest.inputs.country]], ['Urefu', latest.inputs.length + ' km'], ['Upana', latest.inputs.width + ' m'], ['Uso', SURFACE_NAMES[latest.inputs.surface]], ['Kwa km', money(latest.result.symbol, latest.result.baseCostPerKm)], ['Jumla', money(latest.result.symbol, latest.result.total)]];
    return [
      'AfroTools — Makadirio ya kupanga',
      'Zana: ' + toolId,
      '',
      labels.map(function (item) { return item[0] + ': ' + item[1]; }).join('\n'),
      '',
      'Chanzo: injini ya Kiingereza inayodumishwa (' + latest.source.owner + ').',
      'Hali ya viwango: dhana tuli za kupanga; si bei hai wala rasmi.',
      'Tarehe ya mwisho ya mabadiliko ya injini: 2026-07-30; haithibitishi bei za soko.',
      'Uhakika: chini kwa ununuzi — pata uchunguzi wa eneo, BOQ na nukuu za sasa.',
      'Faragha: faili hii imetengenezwa ndani ya kivinjari.'
    ].join('\n');
  }
  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text; area.setAttribute('aria-hidden', 'true'); document.body.appendChild(area); area.select();
    try {
      if (!document.execCommand('copy')) throw new Error('copy-failed');
      status.textContent = 'Matokeo ya sasa yamenakiliwa.';
    } catch (error) {
      status.textContent = 'Kunakili kumeshindikana; tumia upakuaji wa TXT.';
    }
    area.remove();
  }
  function exportCurrent(kind) {
    if (!latest) return;
    if (kind === 'copy') {
      var text = reportText();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { status.textContent = 'Matokeo ya sasa yamenakiliwa.'; }).catch(function () { fallbackCopy(text); });
      } else fallbackCopy(text);
      return;
    }
    if (kind === 'json') download(safeName() + '.json', 'application/json;charset=utf-8', JSON.stringify(latest, null, 2));
    if (kind === 'txt') download(safeName() + '.txt', 'text/plain;charset=utf-8', reportText());
    status.textContent = kind.toUpperCase() + ' imepakuliwa kutoka kwenye matokeo ya sasa.';
  }
  function restore(payload) {
    if (!payload || payload.schemaVersion !== 1 || payload.toolId !== toolId || !payload.inputs) throw new Error('invalid-report');
    restoring = true;
    Object.keys(payload.inputs).forEach(function (key) {
      var node = document.getElementById(key);
      if (!node) return;
      var valueToSet = payload.inputs[key];
      if (typeof valueToSet === 'boolean') valueToSet = valueToSet ? 'yes' : 'no';
      node.value = String(valueToSet);
    });
    restoring = false;
    var restored = calculate({ noFocus: true, silentValidity: true });
    if (!restored) throw new Error('invalid-report-inputs');
    status.textContent = 'JSON imefunguliwa na matokeo yamekokotolewa upya kwa injini ya sasa.';
  }

  form.addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
  form.addEventListener('input', function () { if (!restoring) clearResult('Maingizo yamebadilika; kokotoa tena kabla ya kunakili au kupakua faili.'); });
  form.addEventListener('change', function () { if (!restoring) clearResult('Maingizo yamebadilika; kokotoa tena kabla ya kunakili au kupakua faili.'); });
  exportButtons.forEach(function (button) { button.addEventListener('click', function () { exportCurrent(button.getAttribute('data-civil-export')); }); });
  document.getElementById('civil-reset').addEventListener('click', function () { form.reset(); clearResult('Fomu imewekwa upya.'); });
  document.getElementById('import-json').addEventListener('change', function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    file.text().then(function (text) { restore(JSON.parse(text)); }).catch(function () {
      clearResult('JSON haikufunguka.'); errorBox.textContent = 'Chagua JSON halali ya zana hii.'; errorBox.hidden = false;
    });
    event.target.value = '';
  });
  var consent = document.getElementById('ai-consent');
  var aiLink = document.getElementById('ai-link');
  consent.addEventListener('change', function () {
    aiLink.setAttribute('aria-disabled', consent.checked ? 'false' : 'true');
    aiLink.tabIndex = consent.checked ? 0 : -1;
  });
  aiLink.addEventListener('click', function (event) { if (!consent.checked) event.preventDefault(); });
  clearResult();
}(window));
