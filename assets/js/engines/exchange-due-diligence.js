(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.ExchangeDueDiligence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var ITEMS = ['official-domain', 'country-availability', 'regulator-register', 'fee-schedule', 'fiat-deposit', 'fiat-withdrawal', 'custody-withdrawal', 'security-disclosure', 'support-incident', 'small-withdrawal-test'];
  var STATUSES = ['confirmed', 'unclear', 'not-checked', 'not-applicable'];
  var FRESH_DAYS = 90;

  function clean(value, max) { return String(value || '').trim().slice(0, max); }
  function validUrl(value) {
    try {
      var url = new URL(clean(value, 500));
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
    } catch (_) { return ''; }
  }
  function dateState(value, asOf) {
    var text = clean(value, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return { valid:false, future:false, stale:false, ageDays:null };
    var parts = text.split('-').map(Number);
    var checked = Date.UTC(parts[0], parts[1] - 1, parts[2]);
    var parsed = new Date(checked);
    if (parsed.getUTCFullYear() !== parts[0] || parsed.getUTCMonth() !== parts[1] - 1 || parsed.getUTCDate() !== parts[2]) return { valid:false, future:false, stale:false, ageDays:null };
    var now = asOf ? new Date(asOf + 'T00:00:00Z') : new Date();
    if (Number.isNaN(now.getTime())) now = new Date();
    var today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    var ageDays = Math.floor((today - checked) / 86400000);
    return { valid:true, future:ageDays < 0, stale:ageDays > FRESH_DAYS, ageDays:ageDays };
  }

  function buildProvider(raw, index, asOf) {
    raw = raw || {};
    var checkedDate = clean(raw.checkedDate, 10);
    var date = dateState(checkedDate, asOf);
    var items = ITEMS.map(function (code) {
      var input = raw.items && raw.items[code] ? raw.items[code] : {};
      var status = STATUSES.indexOf(input.status) >= 0 ? input.status : 'not-checked';
      var sourceInput = clean(input.sourceUrl, 500);
      var sourceUrl = validUrl(sourceInput);
      var sourceMissing = status === 'confirmed' && !sourceUrl;
      return {
        code: code,
        status: status,
        sourceUrl: sourceUrl,
        sourceMissing: sourceMissing,
        sourceInvalid: !!sourceInput && !sourceUrl,
        notes: clean(input.notes, 500),
        documented: status === 'confirmed' && !!sourceUrl && date.valid && !date.future && !date.stale
      };
    });
    var applicable = items.filter(function (item) { return item.status !== 'not-applicable'; });
    var documented = applicable.filter(function (item) { return item.documented; }).length;
    var unresolved = applicable.length - documented;
    return {
      slot: index + 1,
      name: clean(raw.name, 80),
      country: clean(raw.country, 80),
      checkedDate: checkedDate,
      dateValid: date.valid,
      dateInFuture: date.future,
      evidenceStale: date.stale,
      ageDays: date.ageDays,
      items: items,
      counts: { documented: documented, applicable: applicable.length, unresolved: unresolved, notApplicable: items.length - applicable.length }
    };
  }

  function build(raw, options) {
    raw = raw || {};
    var asOf = options && options.asOf ? clean(options.asOf, 10) : new Date().toISOString().slice(0, 10);
    var providers = [buildProvider((raw.providers || [])[0], 0, asOf), buildProvider((raw.providers || [])[1], 1, asOf)];
    var errors = [];
    providers.forEach(function (provider) {
      if (!provider.name) errors.push('provider-' + provider.slot + '-name');
      if (!provider.country) errors.push('provider-' + provider.slot + '-country');
      if (!provider.checkedDate || !provider.dateValid) errors.push('provider-' + provider.slot + '-date');
      if (provider.dateInFuture) errors.push('provider-' + provider.slot + '-future-date');
      provider.items.forEach(function (item) {
        if (item.sourceMissing || item.sourceInvalid) errors.push('provider-' + provider.slot + '-' + item.code + '-source');
      });
    });
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      asOfDate: asOf,
      providers: providers,
      errors: errors,
      boundary: 'Evidence coverage only. No trust score, ranking, recommendation, safety verdict, licensing verdict, or provider endorsement.'
    };
  }

  function text(report, locale, labels) {
    var fr = locale === 'fr';
    var lines = [fr ? 'Dossier local de vérification d’une plateforme crypto' : 'Local crypto exchange due-diligence record', fr ? 'Couverture des preuves uniquement. Aucun score de confiance, classement, conseil, verdict de sécurité, décision réglementaire ou recommandation.' : report.boundary, ''];
    report.providers.forEach(function (provider) {
      lines.push((fr ? 'Prestataire ' : 'Provider ') + provider.slot + ': ' + provider.name);
      lines.push((fr ? 'Pays prévu : ' : 'Intended country: ') + provider.country);
      lines.push((fr ? 'Date de vérification : ' : 'Checked date: ') + provider.checkedDate);
      lines.push((fr ? 'Éléments documentés : ' : 'Documented items: ') + provider.counts.documented + ' / ' + provider.counts.applicable);
      lines.push((fr ? 'Éléments non résolus : ' : 'Unresolved items: ') + provider.counts.unresolved);
      provider.items.forEach(function (item) {
        lines.push('- ' + labels.items[item.code] + ': ' + labels.statuses[item.status]);
        if (item.sourceUrl) lines.push('  ' + (fr ? 'Source : ' : 'Source: ') + item.sourceUrl);
        if (item.notes) lines.push('  ' + (fr ? 'Notes : ' : 'Notes: ') + item.notes);
      });
      lines.push('');
    });
    return lines.join('\n');
  }

  return { ITEMS: ITEMS, STATUSES: STATUSES, FRESH_DAYS: FRESH_DAYS, build: build, text: text, validUrl: validUrl, dateState: dateState };
});
