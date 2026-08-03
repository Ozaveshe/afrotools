(function initSwPersonalFinance(root) {
  'use strict';
  var engine = root && root.AfroToolsSwPersonalFinanceEngine;
  if (!root || !root.document || !engine) return;

  var STORAGE_PREFIX = 'afrotools:sw:personal-finance:';
  var CAPITAL_LABELS = ['Hakuna mtaji mpya', 'Mtaji mdogo', 'Mtaji wa kati', 'Mtaji mkubwa'];
  var APP_LABELS = {
    '50-30-20-budget': 'Bajeti ya 50/30/20',
    'album-budget': 'Bajeti ya albamu',
    'film-budget': 'Bajeti ya filamu',
    'security-emergency-fund': 'Mfuko wa dharura na usalama',
    'side-hustle-ranker': 'Kilinganisha kazi za ziada'
  };
  var PROJECT_LABELS = { single: 'Wimbo mmoja', ep: 'EP', album: 'Albamu' };
  var FILM_TYPE_LABELS = { short: 'Filamu fupi', feature: 'Filamu ndefu', series: 'Mfululizo wa televisheni', web: 'Mfululizo wa mtandaoni' };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function currencyFor(input) { return engine.CURRENCIES[input.country] || engine.CURRENCIES.NG; }
  function money(value, currency) { return currency.symbol + ' ' + Math.round(Number(value) || 0).toLocaleString('sw-KE'); }
  function number(value) { return Math.round(Number(value) || 0).toLocaleString('sw-KE'); }
  function metric(label, value, note) {
    return '<article class="swpf-metric"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(value) + '</strong><small>' + escapeHtml(note || '') + '</small></article>';
  }
  function collect(form) {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || field.type === 'file' || field.type === 'button' || field.type === 'submit') return;
      if (field.type === 'checkbox') {
        if (!data[field.name]) data[field.name] = [];
        if (field.checked) data[field.name].push(field.value);
      } else data[field.name] = field.value;
    });
    return data;
  }
  function applyInputs(form, inputs) {
    Array.prototype.forEach.call(form.elements, function (field) {
      if (!field.name || !Object.prototype.hasOwnProperty.call(inputs || {}, field.name)) return;
      if (field.type === 'checkbox') field.checked = Array.isArray(inputs[field.name]) && inputs[field.name].indexOf(field.value) >= 0;
      else field.value = inputs[field.name];
    });
  }
  function snapshot(form) { return JSON.stringify(collect(form)); }
  function setStatus(form, text, type) {
    var node = form.querySelector('[data-status]');
    if (!node) return;
    node.textContent = text;
    node.classList.toggle('is-error', type === 'error');
  }
  function renderBudget(result, input) {
    var cur = currencyFor(input);
    var rows = [
      ['Mahitaji', result.idealNeeds, result.currentNeeds, result.needsGap],
      ['Matakwa', result.idealWants, result.currentWants, result.wantsGap],
      ['Akiba na deni la ziada', result.idealSavings, result.currentSavings, result.savingsGap]
    ];
    return '<div class="swpf-result-hero"><span>Mapato halisi ya mwezi</span><strong>' + money(result.income, cur) + '</strong><small>' +
      (result.unallocated >= 0 ? money(result.unallocated, cur) + ' haijagawiwa' : 'Umezidi kwa ' + money(-result.unallocated, cur)) +
      '</small></div><div class="swpf-metrics">' + metric('Mahitaji 50%', money(result.idealNeeds, cur), 'Kiwango cha kupanga') +
      metric('Matakwa 30%', money(result.idealWants, cur), 'Kiwango cha kupanga') +
      metric('Akiba 20%', money(result.idealSavings, cur), 'Akiba au deni la ziada') +
      '</div><div class="swpf-table"><table><caption>Linganisha mpango na kiasi cha sasa</caption><thead><tr><th>Kundi</th><th>Lengo</th><th>Sasa</th><th>Tofauti</th></tr></thead><tbody>' +
      rows.map(function (row) { return '<tr><th scope="row">' + row[0] + '</th><td>' + money(row[1], cur) + '</td><td>' + money(row[2], cur) +
        '</td><td>' + (row[3] >= 0 ? '+' : '−') + money(Math.abs(row[3]), cur) + '</td></tr>'; }).join('') + '</tbody></table></div>';
  }
  function renderAlbum(result, input) {
    var cur = currencyFor(input);
    return '<div class="swpf-result-hero"><span>Bajeti ya mradi wa muziki</span><strong>' + money(result.total, cur) + '</strong><small>' +
      PROJECT_LABELS[input.projectType] + ' · hakuna ubadilishaji wa sarafu</small></div><div class="swpf-metrics">' +
      metric('Utayarishaji', money(result.production, cur), 'Kurekodi, midundo, uchanganyaji na ukamilishaji wa sauti') +
      metric('Maudhui ya kuona', money(result.visuals, cur), 'Jalada, picha na video') +
      metric('Utangazaji', money(result.marketing, cur), 'Usambazaji, orodha za nyimbo, matangazo na PR') +
      metric('Kwa wimbo', money(result.costPerTrack, cur), result.tracks + ' nyimbo') + '</div>' +
      '<div class="swpf-table"><table><caption>Akiba ya mabadiliko ya bei au wigo</caption><tbody>' +
      '<tr><th>Bajeti iliyoingizwa</th><td>' + money(result.total, cur) + '</td></tr>' +
      '<tr><th>Bajeti + akiba ya tahadhari 10%</th><td>' + money(result.total + result.contingency10, cur) + '</td></tr>' +
      '<tr><th>Bajeti + akiba ya tahadhari 20%</th><td>' + money(result.total + result.contingency20, cur) + '</td></tr>' +
      '<tr><th>Usikilizaji wa kufidia gharama</th><td>' + (result.breakEvenStreams == null ? 'Weka mapato halisi kwa usikilizaji' : number(result.breakEvenStreams)) + '</td></tr>' +
      '</tbody></table></div>';
  }
  function renderFilm(result, input) {
    var cur = currencyFor(input), names = ['Ubunifu na uongozi', 'Uzalishaji wa moja kwa moja', 'Uzalishaji baada ya kurekodi', 'Uuzaji na uwasilishaji'];
    var amounts = [result.aboveLine, result.production, result.post, result.marketing];
    return '<div class="swpf-result-hero"><span>Bajeti ya utayarishaji</span><strong>' + money(result.total, cur) + '</strong><small>' +
      FILM_TYPE_LABELS[input.prodType] + ' · ' + money(result.perDay, cur) + ' kwa siku ya kurekodi</small></div><div class="swpf-metrics">' +
      names.map(function (name, index) { return metric(name, money(amounts[index], cur), result.allocations[index] + '%'); }).join('') + '</div>' +
      '<div class="swpf-table"><table><caption>Mpango wa akiba ya tahadhari na fedha</caption><tbody>' +
      '<tr><th>Akiba ya tahadhari</th><td>' + money(result.contingency, cur) + '</td></tr><tr><th>Bajeti pamoja na akiba ya tahadhari</th><td>' + money(result.required, cur) +
      '</td></tr><tr><th>Fedha zilizothibitishwa</th><td>' + money(result.cashSecured, cur) + '</td></tr><tr><th>' +
      (result.gap > 0 ? 'Pengo la fedha' : 'Ziada baada ya akiba ya tahadhari') + '</th><td>' + money(result.gap > 0 ? result.gap : result.surplus, cur) + '</td></tr></tbody></table></div>';
  }
  function renderEmergency(result, input) {
    var cur = currencyFor(input);
    return '<div class="swpf-result-hero"><span>Lengo la mfuko wa dharura</span><strong>' + money(result.target, cur) + '</strong><small>' +
      input.targetMonths + ' miezi ya matumizi muhimu pamoja na gharama za mara moja</small></div><div class="swpf-metrics">' +
      metric('Hatua ya mwezi 1', money(result.tier1, cur), 'Mwezi mmoja + gharama za mara moja') +
      metric('Lengo ulilochagua', money(result.tier2, cur), input.targetMonths + ' miezi') +
      metric('Mfano wa miezi 6', money(result.tier3, cur), 'Miezi 6 + gharama za mara moja') +
      metric('Bado inahitajika', money(result.gap, cur), result.monthsToGoal == null ? 'Weka mchango wa mwezi' : result.monthsToGoal + ' miezi kufikia lengo') + '</div>';
  }
  function renderHustles(result) {
    return '<div class="swpf-result-hero"><span>Kazi ya ziada ya kwanza</span><strong>' + escapeHtml(result.top5[0].hustle.name) +
      '</strong><small>Ulinganisho wa ujuzi, muda na mtaji pekee; si utabiri wa mapato.</small></div><div class="swpf-hustles">' +
      result.top5.map(function (item, index) {
        return '<article class="swpf-hustle"><strong>#' + (index + 1) + ' ' + escapeHtml(item.hustle.name) + '</strong><span>' + item.fit.score +
          '/100 ulinganifu · ' + item.hustle.hoursMin + '+ saa kwa wiki · ' + CAPITAL_LABELS[item.fit.requiredCapital] +
          '</span><p><b>Kabla ya kutumia fedha:</b> ' + escapeHtml(item.hustle.check) + '</p></article>';
      }).join('') + '</div>';
  }
  function render(app, result, input) {
    if (app === '50-30-20-budget') return renderBudget(result, input);
    if (app === 'album-budget') return renderAlbum(result, input);
    if (app === 'film-budget') return renderFilm(result, input);
    if (app === 'security-emergency-fund') return renderEmergency(result, input);
    return renderHustles(result, input);
  }
  function summary(app, result, input) {
    var cur = currencyFor(input), lines = ['AfroTools · ' + APP_LABELS[app], 'Ilipitiwa: ' + engine.REVIEW_DATE, 'Sarafu: ' + cur.code, ''];
    if (app === '50-30-20-budget') lines.push('Mapato=' + result.income, 'Mahitaji50=' + result.idealNeeds, 'Matakwa30=' + result.idealWants, 'Akiba20=' + result.idealSavings, 'Haijagawiwa=' + result.unallocated);
    if (app === 'album-budget') lines.push('Nyimbo=' + result.tracks, 'Utayarishaji=' + result.production, 'MaudhuiYaKuona=' + result.visuals, 'Utangazaji=' + result.marketing, 'Jumla=' + result.total, 'AkibaYaTahadhari10=' + result.contingency10, 'UsikilizajiWaKufidiaGharama=' + (result.breakEvenStreams == null ? 'haitumiki' : result.breakEvenStreams));
    if (app === 'film-budget') lines.push('Jumla=' + result.total, 'KwaSiku=' + result.perDay, 'UbunifuNaUongozi=' + result.aboveLine, 'Uzalishaji=' + result.production, 'BaadaYaKurekodi=' + result.post, 'UuzajiNaUwasilishaji=' + result.marketing, 'Inayohitajika=' + result.required, 'Pengo=' + result.gap, 'Ziada=' + result.surplus);
    if (app === 'security-emergency-fund') lines.push('Lengo=' + result.target, 'Hatua1=' + result.tier1, 'Hatua2=' + result.tier2, 'Hatua3=' + result.tier3, 'Pengo=' + result.gap, 'MieziKufikiaLengo=' + (result.monthsToGoal == null ? 'haitumiki' : result.monthsToGoal));
    if (app === 'side-hustle-ranker') result.top5.forEach(function (item, index) { lines.push((index + 1) + '=' + item.hustle.id + '|' + item.fit.score); });
    lines.push('', 'Makadirio ya kupanga pekee. Thibitisha bei, sheria, mikataba, hatari na ushahidi wa sasa kabla ya kufanya uamuzi.');
    return lines.join('\n');
  }
  function download(name, content, type) {
    var url = URL.createObjectURL(new Blob([content], { type: type }));
    var link = document.createElement('a'); link.href = url; link.download = name; link.dataset.localExport = 'true';
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }
  function boot(container) {
    var app = container.dataset.app, form = container.querySelector('[data-form]'), resultNode = container.querySelector('[data-result]');
    var exportButtons = Array.prototype.slice.call(container.querySelectorAll('[data-export]'));
    var current = null, cleanSnapshot = null, storageKey = STORAGE_PREFIX + app;
    function clearResult(message) {
      current = null; cleanSnapshot = null; resultNode.innerHTML = ''; resultNode.hidden = true;
      exportButtons.forEach(function (button) { button.disabled = true; });
      if (message) setStatus(form, message, '');
    }
    form.addEventListener('input', function () { clearResult('Mabadiliko yamefuta matokeo. Kokotoa tena kabla ya kupakua faili.'); });
    form.addEventListener('change', function () { clearResult('Mabadiliko yamefuta matokeo. Kokotoa tena kabla ya kupakua faili.'); });
    var projectType = form.elements.projectType;
    if (app === 'album-budget' && projectType) projectType.addEventListener('change', function () {
      var defaults = { single: 1, ep: 5, album: 12 };
      if (defaults[projectType.value]) form.elements.tracks.value = defaults[projectType.value];
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var input = collect(form), result = engine.calculate(app, input);
      if (!result.ok) {
        clearResult(result.error); setStatus(form, result.error, 'error');
        var field = form.elements[result.field]; if (field && field.focus) field.focus(); return;
      }
      current = { appId: app, schemaVersion: 1, inputs: input, result: result };
      cleanSnapshot = snapshot(form); resultNode.innerHTML = render(app, result, input); resultNode.hidden = false;
      exportButtons.forEach(function (button) { button.disabled = false; });
      setStatus(form, 'Matokeo yametengenezwa ndani ya kifaa hiki.', '');
    });
    container.addEventListener('click', function (event) {
      var action = event.target.closest('[data-action]'); if (!action) return;
      var type = action.dataset.action;
      if (type === 'save') { try { localStorage.setItem(storageKey, JSON.stringify({ schemaVersion: 1, appId: app, inputs: collect(form) })); setStatus(form, 'Rasimu imehifadhiwa kwenye kifaa hiki.', ''); } catch (_) { setStatus(form, 'Kivinjari kimezuia hifadhi ya ndani.', 'error'); } return; }
      if (type === 'restore') { try { var saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (!saved || saved.appId !== app) throw new Error('missing'); applyInputs(form, saved.inputs); clearResult('Rasimu imefunguliwa. Kagua kisha kokotoa tena.'); } catch (_) { setStatus(form, 'Hakuna rasimu halali ya programu hii.', 'error'); } return; }
      if (type === 'reset') { form.reset(); try { localStorage.removeItem(storageKey); } catch (_) {} clearResult('Fomu na rasimu vimefutwa.'); return; }
      if (type === 'import') { form.querySelector('[data-import]').click(); return; }
      if (!current || cleanSnapshot !== snapshot(form)) { clearResult('Upakuaji umezuiwa kwa sababu taarifa zimebadilika. Kokotoa tena.'); return; }
      if (type === 'txt') download(app + '-afrotools.txt', summary(app, current.result, current.inputs), 'text/plain;charset=utf-8');
      if (type === 'json') download(app + '-afrotools.json', JSON.stringify({ schemaVersion: 1, appId: app, exportedAt: new Date().toISOString(), inputs: current.inputs, result: current.result }, null, 2), 'application/json;charset=utf-8');
      if (type === 'print') window.print();
      setStatus(form, (type === 'print' ? 'PDF ya kuchapisha' : type.toUpperCase()) + ' imeandaliwa ndani ya kifaa.', '');
    });
    var importer = form.querySelector('[data-import]');
    importer.addEventListener('change', function () {
      var file = importer.files && importer.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { try { var payload = JSON.parse(String(reader.result || '')); if (payload.appId !== app || !payload.inputs) throw new Error('mismatch'); applyInputs(form, payload.inputs); clearResult('JSON imefunguliwa ndani ya kifaa. Kagua kisha kokotoa tena.'); } catch (_) { setStatus(form, 'JSON hii si nakala rudufu halali ya programu hii.', 'error'); } };
      reader.readAsText(file); importer.value = '';
    });
  }
  function bootThemes() {
    var select = document.querySelector('[data-theme-select]'); if (!select) return;
    var stored = localStorage.getItem('aft_theme') || 'system'; select.value = stored;
    function apply(value) { var dark = root.matchMedia && root.matchMedia('(prefers-color-scheme: dark)').matches; document.documentElement.dataset.theme = value === 'system' ? (dark ? 'dark' : 'light') : value; }
    apply(stored); select.addEventListener('change', function () { localStorage.setItem('aft_theme', select.value); apply(select.value); });
  }
  function mount() { bootThemes(); Array.prototype.forEach.call(document.querySelectorAll('[data-sw-personal-finance]'), boot); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})(typeof globalThis !== 'undefined' ? globalThis : this);
