/* Payroll-only browser handoff. Financial inputs never enter launch URLs. */
(function (root, factory) {
  'use strict';
  var api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.payrollPrivatePrefill = api;
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', api.boot, { once: true });
    else api.boot();
  }
})(typeof window !== 'undefined' ? window : globalThis, function (root) {
  'use strict';
  var KEY = 'apo_private_prefill_v1';
  var TTL = 20 * 60 * 1000;
  var COUNTRIES = 'KE TZ UG RW ET DJ SO ER NG GH CI SN BJ BF ML NE TG GN GW LR SL GM CV ZA BW NA ZM ZW MZ MW MU MG SC SZ LS EG MA DZ TN LY SD MR CM TD GA CG CD GQ CF AO BI ST SS KM'.split(' ');
  var DOC_TYPES = ['offer-letter', 'employment-contract', 'termination-letter'];
  var ROUTES = {
    'minimum-wage': { fields: [['country', 'country']], note: 'This is a wage reference. Your pay is not inserted into its salary-report submission form.' },
    'staff-cost': { fields: [['currency', 'scp-currency']], note: 'Monthly cash salary per person can differ from gross pay. Review the source amount before entering your checked cash-salary figure.' },
    'doc-generator': { fields: [['country', 'dg-hero-country'], ['docType', 'dg-hero-doctype']], note: 'Choose the document and country, then Generate. The private context can continue to that document form.' },
    'payslip-generator': { fields: [['role', 'role'], ['currency', 'currency']], note: 'Gross earnings are derived from separate earnings fields. Your gross amount is not copied into basic pay.' },
    'ng-pension': { country: 'NG', fields: [], note: 'Monthly pensionable emoluments are not necessarily gross pay. Enter the checked pensionable amount yourself.' },
    'ke-nssf': { country: 'KE', fields: [], note: 'Monthly pensionable earnings are not necessarily gross pay. Enter the checked pensionable amount yourself.' },
    'gh-ssnit': { country: 'GH', fields: [], note: 'Monthly basic salary and a historical best-36-month average are different from an unspecified gross-pay amount.' },
    'za-gepf': { country: 'ZA', fields: [], note: 'Final annual pensionable salary is a different basis. No annualisation or pensionable-pay conversion is applied.' },
    'pension-proj': { fields: [['currency', 'currency']], note: 'A gross-pay amount is not a pension contribution or fund balance. Enter contributions and assumptions from your checked records.' },
    'social-security': { fields: [['country', 'country']], note: 'This calculator needs monthly gross salary. The source pay period was not recorded: confirm the period and currency before entering an amount.' },
    'compliance-calendar': { fields: [], note: 'Pay and role do not configure calendar deadlines or reminders. Use the country context when you open the calendar.' },
    'job-offer-evaluator': { fields: [], note: 'Choose which offer and pay basis this amount describes. It is not inserted into either offer or used to calculate a comparison.' },
    'salary-compare': { fields: [['currency', 'sc-currency']], note: 'Base pay, total gross earnings and each offer’s pay period can differ. No offer or pay basis is selected for you.' },
    'leave-calculator': { fields: [['country', 'lc-country']], note: 'Only the primary country reference can be applied. No salary is inserted into a leave-payout calculation.' },
    'regulatory-alerts': { fields: [['countryFilter', '']], note: 'Only the public country filter can be applied. Subscription and change-report forms are not filled or submitted.' },
    'za-uif': { country: 'ZA', fields: [], note: 'UIF-liable remuneration and benefit bases can differ from gross pay. No amount is inserted or converted.' },
    'labour-law-advisor': { fields: [['country', 'lla-hero-country']], note: 'The country can be selected locally. Your pay and role are not added to a question or sent to an adviser.' }
  };
  var active = null;

  function routeFor(pathname) {
    var path = String(pathname || '').replace(/\/index\.html$/, '/').replace(/\/$/, '');
    if (path === '/tools/doc-generator/generate' || path === '/tools/doc-generator/generate.html') {
      return { path: '/tools/doc-generator/generate', id: 'doc-generator', fields: [['country', 'dg-country-sel'], ['role', 'dg-ee-title']], note: 'Apply country or role only when its form step is visible. Gross pay is not inserted: confirm the document’s currency and pay frequency yourself.' };
    }
    var match = /^\/tools\/([^/]+)$/.exec(path);
    return match && ROUTES[match[1]] ? Object.assign({ id: match[1], path: path + '/' }, ROUTES[match[1]]) : null;
  }

  function cleanUrl(value, origin) {
    var url;
    try { url = new URL(value, origin); } catch (_) { return null; }
    if (url.origin !== origin || !routeFor(url.pathname)) return null;
    var clean = new URL(url.pathname, origin);
    ['country', 'currency', 'docType', 'type'].forEach(function (key) {
      var item = url.searchParams.get(key);
      if (key === 'country' && COUNTRIES.indexOf(item) >= 0) clean.searchParams.set(key, item);
      if (key === 'currency' && /^[A-Z]{3}$/.test(item || '')) clean.searchParams.set(key, item);
      if ((key === 'docType' || key === 'type') && DOC_TYPES.indexOf(item) >= 0) clean.searchParams.set(key, item);
    });
    return clean;
  }

  function validValues(values) {
    return values && typeof values === 'object' && !Array.isArray(values) && COUNTRIES.indexOf(values.country) >= 0 &&
      typeof values.salary === 'string' && values.salary.length <= 64 && (values.salary === '' || (Number.isFinite(Number(values.salary)) && Number(values.salary) >= 0)) &&
      typeof values.role === 'string' && values.role.length <= 200 && typeof values.currency === 'string' &&
      (values.currency === '' || /^[A-Z]{3}$/.test(values.currency)) &&
      typeof values.docType === 'string' && (values.docType === '' || DOC_TYPES.indexOf(values.docType) >= 0);
  }

  function prepareLaunch(value, source, storage, now, origin) {
    origin = origin || (root.location && root.location.origin) || 'https://afrotools.com';
    var url = cleanUrl(value, origin);
    var safe = url ? url.pathname + url.search : '';
    var values = source && { country: source.country, salary: source.salary === undefined ? '' : source.salary,
      role: source.role === undefined ? '' : source.role, currency: source.currency === undefined ? '' : source.currency,
      docType: source.docType === undefined ? '' : source.docType };
    if (!url || !validValues(values)) return { ok: false, url: safe, reason: 'Private details are invalid. Review the country, pay and role, or open without details.' };
    var route = routeFor(url.pathname);
    if ((url.searchParams.get('country') && url.searchParams.get('country') !== values.country) || (route.country && route.country !== values.country)) {
      return { ok: false, url: safe, reason: 'The destination country does not match this checklist. No private details were sent.' };
    }
    now = now === undefined ? Date.now() : now;
    var payload = { version: 1, type: 'afropayroll_private_prefill', targetPath: route.path, createdAt: now, expiresAt: now + TTL, values: values };
    try { (storage || root.sessionStorage).setItem(KEY, JSON.stringify(payload)); }
    catch (_) { return { ok: false, url: safe, reason: 'Private browser handoff is unavailable. Your checklist remains saved; open without details and enter them manually.' }; }
    url.searchParams.set('payroll_prefill', '1');
    return { ok: true, url: url.pathname + url.search };
  }

  function consume(location, storage, now) {
    var url = new URL(location.href);
    if (url.searchParams.get('payroll_prefill') !== '1') return { ok: false, reason: '' };
    var target = routeFor(url.pathname), payload;
    try {
      storage = storage || root.sessionStorage;
      var raw = storage.getItem(KEY);
      storage.removeItem(KEY);
      payload = raw && raw.length <= 8192 ? JSON.parse(raw) : null;
    } catch (_) { payload = null; }
    now = now === undefined ? Date.now() : now;
    var allowedQuery = ['country', 'currency', 'docType', 'type', 'payroll_prefill'];
    var unexpectedQuery = Array.from(url.searchParams.keys()).some(function (key) { return allowedQuery.indexOf(key) < 0; });
    if (!payload || unexpectedQuery || payload.version !== 1 || payload.type !== 'afropayroll_private_prefill' || !target || payload.targetPath !== target.path ||
      !Number.isFinite(payload.createdAt) || !Number.isFinite(payload.expiresAt) || payload.expiresAt !== payload.createdAt + TTL ||
      payload.createdAt > now || payload.expiresAt <= now || !validValues(payload.values) ||
      (target.country && target.country !== payload.values.country) ||
      (url.searchParams.get('country') && url.searchParams.get('country') !== payload.values.country)) {
      return { ok: false, reason: 'Private details are missing, expired or do not match this page. Return to your checklist to open the tool again, or enter details manually.' };
    }
    return { ok: true, payload: payload, route: target };
  }

  function applyField(field, value, original, kind) {
    if (!field || field.disabled || !field.getClientRects().length) return { ok: false, reason: 'Open the relevant form step first, then apply this detail.' };
    if (field.value !== original) return { ok: false, reason: 'This field was edited after arrival. Your entry was kept; review or enter the source detail yourself.' };
    if (field.tagName === 'SELECT' && !Array.prototype.some.call(field.options, function (option) { return option.value === value; })) {
      return { ok: false, reason: 'This exact value is not an option in the destination. Your entry was kept.' };
    }
    field.value = value;
    field.dispatchEvent(new root.Event('input', { bubbles: true }));
    field.dispatchEvent(new root.Event('change', { bubbles: true }));
    return { ok: true, reason: 'Applied ' + kind + '. Review it before using the tool.' };
  }

  function boot() {
    if (!root.document || root.document.getElementById('apo-private-context')) return;
    var result = consume(root.location);
    if (!result.ok && !result.reason) return;
    var doc = root.document;
    var section = doc.createElement('section');
    section.id = 'apo-private-context';
    section.setAttribute('aria-label', 'Private Payroll checklist context');
    section.setAttribute('data-clarity-mask', 'true');
    section.style.cssText = 'max-width:960px;margin:16px auto;padding:16px;border:1px solid #bfdbfe;border-radius:12px;background:#f8fbff;color:#0f172a;font:14px/1.6 system-ui,sans-serif;overflow-wrap:anywhere';
    function add(tag, text) { var node = doc.createElement(tag); node.textContent = text; section.appendChild(node); return node; }
    add('h2', 'From your Payroll checklist');
    var status;
    if (!result.ok) { add('p', result.reason); }
    else {
      active = result.payload;
      var values = active.values;
      add('p', 'Private details arrived in this browser tab. They were not put in the link. Nothing is calculated or submitted by this handoff.');
      var context = add('p', 'Country: ' + values.country + '. Gross pay: ' + (values.salary || 'not entered') + ' (pay period not recorded). Currency: ' + (values.currency || 'not recorded') + '. Role: ' + (values.role || 'not entered') + (values.docType ? '. Document: ' + values.docType : '') + '.');
      context.setAttribute('data-clarity-mask', 'true');
      add('p', result.route.note);
      add('p', 'No amount is automatically copied to a different pay basis. Review these details and enter the appropriate checked figures.');
      status = add('p', ''); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
      result.route.fields.forEach(function (rule) {
        var kind = rule[0], value = kind === 'countryFilter' ? values.country : values[kind];
        if (!value) return;
        var field = kind === 'countryFilter' ? doc.querySelector('[data-country="' + value + '"]') : doc.getElementById(rule[1]);
        var original = field ? field.value : null;
        var button = add('button', 'Apply ' + (kind === 'countryFilter' ? 'country filter' : kind === 'docType' ? 'document type' : kind));
        button.type = 'button'; button.style.cssText = 'margin:4px 8px 4px 0;padding:10px 14px;border:1px solid #1d4ed8;border-radius:8px;background:white;color:#1d4ed8;cursor:pointer';
        button.addEventListener('click', function () {
          if (kind === 'countryFilter') {
            if (field) { field.click(); status.textContent = 'Applied the public country filter. No subscription was submitted.'; }
            else status.textContent = 'That country filter is not available on this page. Use the source context manually.';
          } else status.textContent = applyField(field, value, original, kind).reason;
        });
      });
      var copy = add('button', 'Copy source details'); copy.type = 'button';
      copy.style.cssText = 'margin:4px 8px 4px 0;padding:10px 14px;border:1px solid #64748b;border-radius:8px;background:white;color:#0f172a;cursor:pointer';
      copy.addEventListener('click', function () {
        if (!root.navigator.clipboard || !root.navigator.clipboard.writeText) { status.textContent = 'Copy is unavailable. Select the source details above to copy them manually.'; return; }
        root.navigator.clipboard.writeText(context.textContent).then(function () { status.textContent = 'Source details copied locally. Check the destination field’s period, currency and pay basis before pasting.'; }, function () { status.textContent = 'Copy was unavailable. Select the source details above to copy them manually.'; });
      });
      var clear = add('button', 'Dismiss private details'); clear.type = 'button';
      clear.addEventListener('click', function () { section.remove(); active = null; });
    }
    var main = doc.querySelector('main') || doc.body;
    main.insertBefore(section, main.firstChild);
  }

  function continueDocument(value) {
    if (!active || active.targetPath !== '/tools/doc-generator/') return { ok: false, url: value };
    if (Date.now() >= active.expiresAt) return { ok: false, url: value };
    var next = cleanUrl(new URL(value, root.location.href).href, root.location.origin);
    if (!next || routeFor(next.pathname).path !== '/tools/doc-generator/generate') return { ok: false, url: value };
    return prepareLaunch(next.href, active.values, undefined, active.createdAt);
  }

  return { KEY: KEY, TTL: TTL, ROUTES: ROUTES, COUNTRIES: COUNTRIES, routeFor: routeFor, prepareLaunch: prepareLaunch, consume: consume, applyField: applyField, continueDocument: continueDocument, boot: boot };
});
