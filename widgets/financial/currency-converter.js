(function () {
  'use strict';
  window.AfroWidgets = window.AfroWidgets || {};
  const currencies = ['USD','EUR','GBP','NGN','KES','GHS','ZAR','EGP','TZS','UGX','RWF','MAD','XOF','XAF','ZMW','MWK','BWP','ZWG'];

  function acceptedSnapshot(data, maxAgeMs) {
    var providers = ['exchangerate-api', 'frankfurter', 'fawazahmed'];
    function observation(rate, date, source) {
      var stamp = typeof date === 'string' ? new Date(date) : null;
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || !stamp || !Number.isFinite(stamp.getTime()) || providers.indexOf(source) < 0) return null;
      var age = Date.now() - stamp.getTime();
      return age >= 0 && age <= maxAgeMs ? { rate: rate, observed_at: stamp.toISOString(), source: source } : null;
    }
    if (!data || data.base !== 'USD' || !data.rates || typeof data.rates !== 'object' || Array.isArray(data.rates)) return null;
    var top = observation(1, data.as_of || data.timestamp, data.source);
    if (!top) return null;
    var qualified = data.qualification && typeof data.qualification === 'object';
    if (!qualified && (data.schemaVersion !== 1 || !Array.isArray(data.retained_rate_codes))) return null;
    var rates = {}, observations = { USD: top };
    Object.keys(data.rates).forEach(function (code) {
      if (!/^[A-Z]{3}$/.test(code) || code === 'USD' || code === 'ZWL') return;
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
    return { base: 'USD', rates: rates, timestamp: oldest, source: data.source, observations: observations, maxAgeMs: maxAgeMs };
  }

  window.AfroWidgets.currency_converter = function (root, options) {
    const choices = currencies.map(code => '<option>' + code + '</option>').join('');
    root.innerHTML = '<div class="aw-title">Currency Converter</div>' +
      '<p class="aw-result-label" id="aw-status" role="status"></p>' +
      '<form><div class="aw-field"><label class="aw-label" for="aw-amt">Amount</label><input class="aw-input" id="aw-amt" type="number" step="any" inputmode="decimal" required value="1000"></div>' +
      '<div class="aw-row"><div class="aw-field"><label class="aw-label" for="aw-from">From</label><select class="aw-select" id="aw-from">' + choices + '</select></div>' +
      '<div class="aw-field"><label class="aw-label" for="aw-to">To</label><select class="aw-select" id="aw-to">' + choices + '</select></div></div>' +
      '<button type="submit" class="aw-btn aw-btn--primary" id="aw-calc">Convert</button></form>' +
      '<div class="aw-result-box" id="aw-res" hidden aria-live="polite"></div>' +
      '<a id="aw-full" target="_blank" rel="noopener noreferrer">Open full converter with these inputs</a>' + (options && options.footerHTML || '');
    const field = name => root.querySelector('#aw-' + name);
    const from = field('from'), to = field('to'), amount = field('amt'), result = field('res'), status = field('status');
    to.value = 'NGN';
    let snapshot = null;
    let loading = true;
    function selection() {
      const identical = from.value === to.value;
      const left = snapshot && snapshot.observations[from.value];
      const right = snapshot && snapshot.observations[to.value];
      const rate = left && right ? right.rate / left.rate : null;
      const observed = left && right ? new Date(left.observed_at < right.observed_at ? left.observed_at : right.observed_at) : null;
      return {identical, rate, observed};
    }
    function update() {
      const pair = selection();
      const usable = pair.identical || Boolean(pair.rate);
      field('calc').disabled = !usable;
      result.hidden = true;
      status.textContent = pair.identical ? 'Same currency: the amount stays the same.' :
        pair.rate ? 'Dated indicative snapshot: ' + pair.observed.toLocaleDateString('en') :
        loading ? 'Checking rate date…' : 'No recent rate for this pair. Enter your provider rate in the full converter.';
      const url = new URL('https://afrotools.com/tools/currency-converter/');
      url.searchParams.set('from', from.value);
      url.searchParams.set('to', to.value);
      const inputs = new URLSearchParams({widget:'currency', amount:amount.value, mode:pair.rate && !pair.identical ? 'snapshot' : 'manual'});
      url.hash = inputs.toString();
      field('full').href = url.href;
    }
    function calculate(event) {
      event.preventDefault();
      const pair = selection();
      const value = Number(amount.value);
      result.hidden = false;
      if (!(value > 0) || !Number.isFinite(value)) { result.textContent = 'Enter an amount greater than zero.'; return; }
      if (!pair.identical && !pair.rate) { result.textContent = 'Use the full converter to enter your provider rate.'; return; }
      const total = pair.identical ? value : value * pair.rate;
      if (!Number.isFinite(total)) { result.textContent = 'Enter a smaller amount.'; return; }
      const formatted = pair.identical ? amount.value : total.toLocaleString('en', {maximumFractionDigits:4});
      result.innerHTML = '<div class="aw-result-main"></div><p class="aw-result-label"></p>';
      result.firstElementChild.textContent = to.value + ' ' + formatted;
      result.lastElementChild.textContent = pair.identical ? 'Same currency. 1 ' + from.value + ' = 1 ' + to.value + '.' :
        '1 ' + from.value + ' = ' + pair.rate.toLocaleString('en', {maximumSignificantDigits:8}) + ' ' + to.value + '. Fees and provider spreads are not included.';
    }
    root.querySelector('form').addEventListener('submit', calculate);
    from.addEventListener('change', update);
    to.addEventListener('change', update);
    amount.addEventListener('input', update);
    update();
    (async function () {
      for (const endpoint of ['/api/forex?base=USD', '/data/forex/latest.json']) {
        try {
          const response = await fetch(endpoint, {cache:'no-cache', credentials:'same-origin'});
          if (!response.ok) continue;
          const accepted = acceptedSnapshot(await response.json(), endpoint.startsWith('/api/') ? 86400000 : 604800000);
          if (accepted) { snapshot = accepted; break; }
        } catch (_) { /* Try the local snapshot or retain manual recovery. */ }
      }
      loading = false;
      if (!selection().identical) update();
    })();
  };
})();
