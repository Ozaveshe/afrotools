(function () {
  'use strict';

  var MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
  var locale = document.documentElement.lang === 'fr' ? 'fr' : 'sw';
  var copy = {
    fr: {
      locale: 'fr-FR', ready: 'Snapshot daté prêt', loading: 'Vérification de la date du taux…', stale: 'Snapshot trop ancien', error: 'Taux indisponibles', paused: 'Conversion par snapshot suspendue', staleDetail: 'Le jeu de données disponible date de plus de sept jours.', errorDetail: 'Aucun jeu de données daté et valide n’a été renvoyé.', rateDate: 'Date des taux : ', snapshotButton: 'Convertir avec le taux daté', manualButton: 'Convertir avec mon taux', manualEmpty: 'Saisissez le taux exact de votre prestataire pour cette paire.', snapshotEmpty: 'Saisissez un montant et utilisez le snapshot daté.', unavailableEmpty: 'Un snapshot daté valide est requis, ou choisissez « Mon taux prestataire ».', amountError: 'Saisissez un montant supérieur à zéro.', rateError: 'Saisissez un taux prestataire supérieur à zéro.', pairError: 'Cette paire n’est pas disponible dans le jeu de données accepté.', convertsTo: 'donne environ', providerQuote: 'Votre taux prestataire', dated: 'Daté du ', manualMode: 'Taux saisi par l’utilisateur', snapshotMode: 'Snapshot indicatif daté', checked: 'Vérifié par l’utilisateur', userSource: 'Taux fourni par l’utilisateur', copied: 'Résumé copié.', copyBlocked: 'La copie a été bloquée. Sélectionnez le texte du résultat.', downloaded: 'CSV téléchargé localement.', feeNote: 'Les frais et spreads du prestataire ne sont pas inclus.', currency: 'Devise', sharedSource: 'Jeu de taux partagé AfroTools', sourceVia: 'via AfroTools', csvHeaders: ['montant', 'devise_depart', 'devise_arrivee', 'taux', 'montant_converti', 'base_du_taux', 'date_du_taux', 'source', 'note_sur_les_frais'], csvFilename: 'afrotools-conversion-devises.csv'
    },
    sw: {
      locale: 'sw-KE', ready: 'Snapshot yenye tarehe iko tayari', loading: 'Inakagua tarehe ya kiwango…', stale: 'Snapshot ni ya zamani sana', error: 'Viwango havipatikani', paused: 'Ubadilishaji wa snapshot umesitishwa', staleDetail: 'Data inayopatikana ina zaidi ya siku saba.', errorDetail: 'Hakuna data halali yenye tarehe iliyopatikana.', rateDate: 'Tarehe ya viwango: ', snapshotButton: 'Badilisha kwa kiwango chenye tarehe', manualButton: 'Badilisha kwa kiwango changu', manualEmpty: 'Ingiza kiwango halisi cha mtoa huduma kwa jozi hii.', snapshotEmpty: 'Ingiza kiasi na utumie snapshot yenye tarehe.', unavailableEmpty: 'Snapshot halali yenye tarehe inahitajika, au chagua “Kiwango cha mtoa huduma”.', amountError: 'Ingiza kiasi kikubwa kuliko sifuri.', rateError: 'Ingiza kiwango cha mtoa huduma kikubwa kuliko sifuri.', pairError: 'Jozi hii haipatikani kwenye data iliyokubaliwa.', convertsTo: 'ni takriban', providerQuote: 'Kiwango chako cha mtoa huduma', dated: 'Tarehe ', manualMode: 'Kiwango kilichoingizwa na mtumiaji', snapshotMode: 'Snapshot ya makadirio yenye tarehe', checked: 'Imekaguliwa na mtumiaji', userSource: 'Kiwango kilichotolewa na mtumiaji', copied: 'Muhtasari umenakiliwa.', copyBlocked: 'Kunakili kumezuiwa. Chagua maandishi ya matokeo.', downloaded: 'CSV imepakuliwa kwenye kifaa.', feeNote: 'Ada na spread za mtoa huduma hazijajumuishwa.', currency: 'Sarafu', sharedSource: 'Data ya viwango vya AfroTools', sourceVia: 'kupitia AfroTools', csvHeaders: ['kiasi', 'sarafu_ya_mwanzo', 'sarafu_ya_mwisho', 'kiwango', 'kiasi_kilichobadilishwa', 'msingi_wa_kiwango', 'tarehe_ya_kiwango', 'chanzo', 'maelezo_ya_ada'], csvFilename: 'afrotools-ubadilishaji-sarafu.csv'
    }
  }[locale];
  var state = { rates: null, timestamp: null, source: null, usable: false, result: null };
  var FALLBACK_RATES = { NGN: 1, KES: 1, GHS: 1, ZAR: 1, XOF: 1, XAF: 1, CDF: 1, MAD: 1, TND: 1, EUR: 1, GBP: 1 };

  function byId(id) { return document.getElementById(id); }
  function mode() { var input = document.querySelector('input[name="rateMode"]:checked'); return input ? input.value : 'snapshot'; }
  function positive(value) { var number = Number(value); return Number.isFinite(number) && number > 0 ? number : null; }
  function timestamp(data) { var raw = data && (data.as_of || data.timestamp || data.updatedAt); var value = raw ? new Date(raw) : null; return value && Number.isFinite(value.getTime()) ? value : null; }
  function acceptable(data) { return !!acceptedSnapshot(data); }
  function acceptedSnapshot(data) {
    var providers = ['exchangerate-api', 'frankfurter', 'fawazahmed'];
    function observation(rate, date, source) {
      var stamp = typeof date === 'string' ? new Date(date) : null;
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || !stamp || !Number.isFinite(stamp.getTime()) || providers.indexOf(source) < 0) return null;
      var age = Date.now() - stamp.getTime();
      return age >= 0 && age <= MAX_AGE_MS ? { rate: rate, observed_at: stamp.toISOString(), source: source } : null;
    }
    if (!data || data.base !== 'USD' || !data.rates || typeof data.rates !== 'object' || Array.isArray(data.rates)) return null;
    var top = observation(1, data.as_of || data.timestamp, data.source);
    if (!top) return null;
    var qualified = data.qualification && typeof data.qualification === 'object';
    if (!qualified && (data.schemaVersion !== 1 || !Array.isArray(data.retained_rate_codes))) return null;
    var rates = {}, observations = { USD: top };
    Object.keys(data.rates).forEach(function (code) {
      if (!/^[A-Z]{3}$/.test(code) || code === 'USD') return;
      var rate = data.rates[code], item = null;
      if (qualified) {
        var q = data.qualification[code];
        if (!q || q.status !== 'available' || q.reason !== null || q.base?.status !== 'available' || q.target?.status !== 'available' || q.base.rate !== 1 || typeof q.target.rate !== 'number' || !Number.isFinite(q.target.rate) || Math.abs(q.target.rate - rate) > 0.0000005001) return;
        var base = observation(1, q.base.observed_at, q.base.source);
        item = observation(rate, q.target.observed_at, q.target.source);
        if (!base) return;
      } else if (data.retained_rate_codes.indexOf(code) >= 0) {
        var prior = data.rate_observations && data.rate_observations[code];
        if (prior && prior.rate === rate) item = observation(rate, prior.observed_at, prior.source);
      } else item = observation(rate, top.observed_at, top.source);
      if (item) { rates[code] = rate; observations[code] = item; }
    });
    if (!Object.keys(rates).length) return null;
    var oldest = Object.values(observations).map(function (item) { return item.observed_at; }).sort()[0];
    return { base: 'USD', rates: rates, timestamp: oldest, source: data.source, observations: observations };
  }
  function pairObservation(from, to) {
    var a = state.observations && state.observations[from], b = state.observations && state.observations[to];
    if (!a || !b) return null;
    var date = a.observed_at < b.observed_at ? a.observed_at : b.observed_at;
    if (Date.now() - new Date(date).getTime() > MAX_AGE_MS) return null;
    return { date: date, source: a.source === b.source ? sourceName(a.source) : sourceName(a.source) + ' + ' + sourceName(b.source) };
  }

  function sourceName(raw) { var source = String(raw || '').trim(); if (!source) return copy.sharedSource; if (source.toLowerCase().indexOf('fawaz') >= 0) source = 'fawazahmed currency-api'; else if (source.toLowerCase().indexOf('exchangerate') >= 0) source = 'exchangerate-api'; return source + ' ' + copy.sourceVia; }
  function setStatus(kind, text) { var element = byId('fxStatus'); element.className = 'fxv-status fxv-status--' + kind; element.textContent = text; }
  function formatMoney(value, code) { return new Intl.NumberFormat(copy.locale, { style: 'currency', currency: code, currencyDisplay: 'code', maximumFractionDigits: value >= 100 ? 2 : 6 }).format(value); }
  function formatRate(value) { return new Intl.NumberFormat(copy.locale, value >= 1000 ? { maximumFractionDigits: 4 } : { maximumSignificantDigits: 8 }).format(value); }
  function rateFor(from, to) { if (from === to) return 1; if (!state.rates) return null; var fromUsd = from === 'USD' ? 1 : positive(state.rates[from]); var toUsd = to === 'USD' ? 1 : positive(state.rates[to]); return fromUsd && toUsd ? toUsd / fromUsd : null; }
  function fillSelects(rates) {
    var preferred = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'];
    var codes = ['USD'].concat(Object.keys(rates || {})).filter(function (code, index, list) { return /^[A-Z]{3}$/.test(code) && positive(code === 'USD' ? 1 : rates[code]) && list.indexOf(code) === index; }).sort(function (a, b) { var ai = preferred.indexOf(a), bi = preferred.indexOf(b); if (ai >= 0 || bi >= 0) return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi); return a.localeCompare(b); });
    var names = null; try { names = new Intl.DisplayNames([copy.locale], { type: 'currency' }); } catch (_) {}
    var options = codes.map(function (code) { var name = names ? names.of(code) : null; return '<option value="' + code + '">' + code + ' — ' + (name && name !== code ? name : copy.currency) + '</option>'; }).join('');
    byId('fxFrom').innerHTML = options; byId('fxTo').innerHTML = options;
    var params = new URLSearchParams(location.search); var from = (params.get('from') || 'USD').toUpperCase(); var to = (params.get('to') || 'NGN').toUpperCase();
    byId('fxFrom').value = codes.indexOf(from) >= 0 ? from : 'USD'; byId('fxTo').value = codes.indexOf(to) >= 0 ? to : (codes.indexOf('NGN') >= 0 ? 'NGN' : codes[1] || 'USD');
  }
  function render(data) { state.rates = data.rates; state.observations = data.observations; state.timestamp = timestamp(data); state.source = sourceName(data.source); state.usable = true; fillSelects(state.rates); setStatus('ready', copy.ready); byId('fxSourceLabel').textContent = state.source; byId('fxSourceDate').textContent = copy.rateDate + new Intl.DateTimeFormat(copy.locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(state.timestamp) + ' UTC'; updateControls(); }
  function failClosed(reason) { state.rates = null; state.timestamp = null; state.source = null; state.usable = false; fillSelects(FALLBACK_RATES); setStatus(reason === 'stale' ? 'stale' : 'error', reason === 'stale' ? copy.stale : copy.error); byId('fxSourceLabel').textContent = copy.paused; byId('fxSourceDate').textContent = reason === 'stale' ? copy.staleDetail : copy.errorDetail; updateControls(); }
  async function load() { setStatus('loading', copy.loading); var sources = ['/api/forex?base=USD', '/data/forex/latest.json']; var sawStale = false; for (var i = 0; i < sources.length; i += 1) { try { var response = await fetch(sources[i], { cache: 'no-cache', credentials: 'same-origin' }); if (!response.ok) continue; var data = await response.json(); var accepted = acceptedSnapshot(data); if (accepted) { render(accepted); return; } var date = timestamp(data); if (String(data && data.base || '').toUpperCase() === 'USD' && date && data.rates && Date.now() - date.getTime() > MAX_AGE_MS) sawStale = true; } catch (_) {} } failClosed(sawStale ? 'stale' : 'error'); }
  function updateManualLabel() { byId('fxManualPair').textContent = '1 ' + byId('fxFrom').value + ' = ? ' + byId('fxTo').value; }
  function invalidateResult() { state.result = null; byId('fxResult').hidden = true; byId('fxEmpty').hidden = false; byId('fxActionStatus').textContent = ''; }
  function updateControls() { var manual = mode() === 'manual'; byId('fxManualGroup').hidden = !manual; byId('fxManualRate').required = manual; byId('fxConvert').disabled = !manual && !state.usable; byId('fxConvert').textContent = manual ? copy.manualButton : copy.snapshotButton; updateManualLabel(); byId('fxEmpty').textContent = manual ? copy.manualEmpty : (state.usable ? copy.snapshotEmpty : copy.unavailableEmpty); }
  function calculate(event) { event.preventDefault(); invalidateResult(); byId('fxAmountError').textContent = ''; byId('fxManualError').textContent = ''; var amount = positive(byId('fxAmount').value); if (!amount) { byId('fxAmountError').textContent = copy.amountError; byId('fxAmount').focus(); return; } var from = byId('fxFrom').value, to = byId('fxTo').value, manual = mode() === 'manual'; var rate = manual ? positive(byId('fxManualRate').value) : rateFor(from, to); if (manual && !rate) { byId('fxManualError').textContent = copy.rateError; byId('fxManualRate').focus(); return; } if (!rate) { byId('fxAmountError').textContent = copy.pairError; return; } var observed = manual ? null : pairObservation(from, to); if (!manual && !observed) { byId('fxAmountError').textContent = copy.pairError; return; } var converted = amount * rate; state.result = { amount: amount, from: from, to: to, rate: rate, converted: converted, mode: manual ? copy.manualMode : copy.snapshotMode, date: manual ? copy.checked : observed.date, source: manual ? copy.userSource : observed.source }; byId('fxEmpty').hidden = true; byId('fxResult').hidden = false; byId('fxResultEquation').textContent = formatMoney(amount, from) + ' ' + copy.convertsTo; byId('fxResultValue').textContent = formatMoney(converted, to); byId('fxRateUsed').textContent = '1 ' + from + ' = ' + formatRate(rate) + ' ' + to; byId('fxRateStatus').textContent = manual ? copy.providerQuote : copy.dated + new Intl.DateTimeFormat(copy.locale, { dateStyle: 'medium' }).format(new Date(observed.date)); byId('fxActionStatus').textContent = ''; }
  function summary() { var result = state.result; return result.amount + ' ' + result.from + ' = ' + result.converted.toFixed(6) + ' ' + result.to + '\n1 ' + result.from + ' = ' + result.rate.toFixed(8) + ' ' + result.to + '\n' + result.mode + '\n' + result.date + '\n' + result.source + '\n' + copy.feeNote; }
  async function copyResult() { if (!state.result) return; try { await navigator.clipboard.writeText(summary()); byId('fxActionStatus').textContent = copy.copied; } catch (_) { byId('fxActionStatus').textContent = copy.copyBlocked; } }
  function downloadCsv() { if (!state.result) return; var result = state.result; var rows = [copy.csvHeaders, [result.amount, result.from, result.to, result.rate, result.converted, result.mode, result.date, result.source, copy.feeNote]]; var body = rows.map(function (row) { return row.map(function (value) { return '"' + String(value).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n'); var url = URL.createObjectURL(new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8' })); var link = document.createElement('a'); link.href = url; link.download = copy.csvFilename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); byId('fxActionStatus').textContent = copy.downloaded; }
  function init() { byId('fxForm').addEventListener('submit', calculate); document.querySelectorAll('input[name="rateMode"]').forEach(function (input) { input.addEventListener('change', function () { invalidateResult(); updateControls(); }); }); ['fxFrom', 'fxTo'].forEach(function (id) { byId(id).addEventListener('change', function () { invalidateResult(); updateManualLabel(); }); }); ['fxAmount', 'fxManualRate'].forEach(function (id) { byId(id).addEventListener('input', invalidateResult); }); byId('fxSwap').addEventListener('click', function () { var from = byId('fxFrom').value; byId('fxFrom').value = byId('fxTo').value; byId('fxTo').value = from; invalidateResult(); updateManualLabel(); }); document.querySelectorAll('[data-fx-from][data-fx-to]').forEach(function (button) { button.addEventListener('click', function () { var from = button.getAttribute('data-fx-from'), to = button.getAttribute('data-fx-to'); if (byId('fxFrom').querySelector('option[value="' + from + '"]') && byId('fxTo').querySelector('option[value="' + to + '"]')) { byId('fxFrom').value = from; byId('fxTo').value = to; invalidateResult(); updateManualLabel(); byId('fxAmount').focus(); } }); }); byId('fxCopy').addEventListener('click', copyResult); byId('fxCsv').addEventListener('click', downloadCsv); fillSelects(FALLBACK_RATES); updateControls(); load(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
