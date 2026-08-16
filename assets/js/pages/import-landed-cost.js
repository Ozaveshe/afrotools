(function () {
  'use strict';

  var engine = window.AfroImportLandedCostEngine;
  var form = document.getElementById('importLandedCostForm');
  var resultNode = document.getElementById('importResult');
  var statusNode = document.getElementById('importStatus');
  if (!engine || !form || !resultNode || !statusNode) return;

  var rules = null;
  var fxSnapshot = null;
  var currentInput = null;
  var currentResult = null;
  var optionalKeys = ['clearingAgent', 'portTerminal', 'storage', 'inlandHaulage', 'inspection', 'documentation', 'bankRemittance', 'miscellaneous'];

  function el(id) { return document.getElementById(id); }
  function value(id) { var node = el(id); return node ? node.value : ''; }
  function esc(text) { return String(text == null ? '' : text).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function analytics(eventName, detail) {
    var safe = detail || {};
    if (typeof window.afroTrack === 'function') window.afroTrack(eventName, safe);
    else window.dispatchEvent(new CustomEvent('afrotools:analytics', { detail: { event: eventName, properties: safe } }));
  }
  function market() { return rules && rules.markets ? rules.markets[value('destination')] : null; }
  function currencyFormat(amount, currency) {
    try { return new Intl.NumberFormat('en', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(amount); }
    catch (error) { return currency + ' ' + Number(amount).toFixed(2); }
  }
  function money(amount) { return currencyFormat(amount, currentResult ? currentResult.destinationCurrency : (market() ? market().currency : 'USD')); }
  function dateLabel(date) {
    var day = String(date || '').slice(0, 10);
    var parsed = new Date(day + 'T00:00:00Z');
    return Number.isNaN(parsed.getTime()) ? String(date || 'not recorded') : parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  function line(label, amount, note) {
    return '<div class="ilc-line"><span>' + esc(label) + (note ? '<small>' + esc(note) + '</small>' : '') + '</span><strong>' + esc(money(amount)) + '</strong></div>';
  }
  function getInput() {
    var duty = value('dutyRate') === 'custom' ? value('customDutyRate') : value('dutyRate');
    var input = {
      destination: value('destination'), origin: value('origin'), goodsType: value('goodsType'),
      sourceCurrency: value('sourceCurrency'), purchaseValue: value('purchaseValue'), freight: value('freight'), insurance: value('insurance'),
      quantity: value('quantity'), fxRate: value('fxRate'), dutyRate: duty,
      customsValueOverrideLocal: value('customsValueOverrideLocal'), exciseRate: value('exciseRate'), exciseFixedLocal: value('exciseFixedLocal'),
      otherStatutoryLocal: value('otherStatutoryLocal'), classificationConfirmed: el('classificationConfirmed').checked
    };
    optionalKeys.forEach(function (key) { input[key] = value(key); });
    return input;
  }
  function optionCostsUsed(input) {
    return optionalKeys.some(function (key) { return Number(input[key]) > 0; });
  }
  function updateDutyBands() {
    var select = el('dutyRate');
    var currentMarket = market();
    var bands = currentMarket && currentMarket.duty ? currentMarket.duty.commonBands : [];
    select.innerHTML = '<option value="">Choose confirmed rate</option>' + bands.map(function (rate) { return '<option value="' + rate + '">' + rate + '%</option>'; }).join('') + '<option value="custom">Custom confirmed rate</option>';
    el('customDutyField').hidden = true;
  }
  function updateFxHelp() {
    var currentMarket = market();
    if (!currentMarket || !fxSnapshot) return;
    var source = value('sourceCurrency');
    var rate = engine.calculateFxRate(fxSnapshot, source, currentMarket.currency);
    var stale = engine.isFxStale(fxSnapshot, rules, new Date().toISOString().slice(0, 10));
    el('fxUnit').textContent = currentMarket.currency + ' per ' + source;
    el('fxHelp').textContent = rate ? 'Reference ' + Number(rate).toLocaleString('en', { maximumFractionDigits: 6 }) + ' · ' + fxSnapshot.source + ' · ' + dateLabel(fxSnapshot.timestamp) + ' · ' + (stale ? 'stale—verify or override' : 'fresh') : 'No maintained reference pair. Enter a custom rate.';
  }
  function showUnsupported(message, route) {
    resultNode.innerHTML = '<div class="ilc-result-body"><div class="ilc-notice ilc-notice--error"><strong>That workflow is not supported here.</strong><p>' + esc(message) + '</p>' + (route ? '<a class="idv-button idv-button-primary" href="' + esc(route) + '">Open vehicle import calculator</a>' : '') + '</div></div>';
    resultNode.hidden = false;
  }
  function render(result) {
    currentResult = result;
    var levyLines = result.levyItems.map(function (levy) { return line(levy.name + ' · ' + levy.rate + '%', levy.amount, 'Base ' + money(levy.base)); }).join('');
    var optionalLines = optionalKeys.filter(function (key) { return result.optionalCosts[key] > 0; }).map(function (key) {
      var labels = { clearingAgent: 'Clearing agent', portTerminal: 'Port / terminal', storage: 'Storage', inlandHaulage: 'Inland haulage', inspection: 'Inspection', documentation: 'Documentation', bankRemittance: 'Bank / remittance', miscellaneous: 'Miscellaneous' };
      return line(labels[key], result.optionalCosts[key]);
    }).join('') || '<div class="ilc-line"><span>No optional local costs entered</span><strong>' + esc(money(0)) + '</strong></div>';
    var sourceLinks = result.sources.map(function (source) { return '<li><a href="' + esc(source.url) + '" target="_blank" rel="noopener">' + esc(source.title) + '</a></li>'; }).join('');
    var warnings = result.warnings.map(function (warning) {
      var labels = { 'classification-unconfirmed': 'Duty classification is not confirmed.', 'other-charges-may-apply': 'Product-specific or declaration charges may still apply.', 'customs-value-override': 'The entered assessed customs value replaced CIF.', 'vat-uplift-applied': 'South Africa\'s 10% import-VAT uplift is included.', 'vat-uplift-origin-exception': 'The South Africa VAT uplift exception was applied for this origin.', 'stale-rule': 'This rule is outside its maintenance window—verify before use.', 'stale-fx': 'The bundled FX snapshot is outside its maintenance window—use a verified override.' };
      return labels[warning] || warning;
    });
    resultNode.innerHTML = '<div class="ilc-result-summary"><div class="idv-eyebrow">Estimated landed cost</div><h2 id="resultHeading">' + esc(result.country) + ' · ' + esc(result.destinationCurrency) + '</h2><strong class="ilc-total">' + esc(money(result.landedCostLocal)) + '</strong><span class="ilc-per-unit">' + esc(money(result.landedCostPerUnit)) + ' per unit · ' + result.quantity + ' unit' + (result.quantity === 1 ? '' : 's') + '</span></div>' +
      '<div class="ilc-result-body"><section class="ilc-group"><h3>Supplier and customs base</h3>' + line('Supplier cost', result.purchaseValueLocal) + line('Freight', result.freightLocal) + line('Insurance', result.insuranceLocal) + line('CIF', result.cifLocal) + line('Customs value used', result.customsValue, result.customsValueSource === 'cif' ? 'CIF basis' : 'User-assessed override') + '</section>' +
      '<section class="ilc-group"><h3>Government charges</h3>' + line('Customs duty · ' + result.dutyRate + '%', result.duty) + line('Excise', result.excise) + levyLines + line('Other assessed statutory charges', result.otherStatutory) + line('VAT · ' + result.vatRate + '%', result.vat, 'Tax base ' + money(result.vatBase)) + line('Government charges total', result.governmentCharges) + '</section>' +
      '<section class="ilc-group"><h3>Optional local and logistics costs</h3>' + optionalLines + '</section>' +
      '<div class="ilc-metrics"><div class="ilc-metric"><span>Effective import burden</span><strong>' + result.effectiveImportBurden.toFixed(2) + '%</strong></div><div class="ilc-metric"><span>Taxes / purchase price</span><strong>' + result.taxesAsPurchasePercent.toFixed(2) + '%</strong></div><div class="ilc-metric"><span>FX rate used</span><strong>' + Number(result.fxRate).toLocaleString('en', { maximumFractionDigits: 6 }) + '</strong></div><div class="ilc-metric"><span>FX impact vs reference</span><strong>' + esc(money(result.fxImpactLocal || 0)) + '</strong></div></div>' +
      (warnings.length ? '<div class="ilc-notice"><strong>Check before relying on this estimate</strong><ul><li>' + warnings.map(esc).join('</li><li>') + '</li></ul></div>' : '') +
      '<div class="ilc-source-meta"><strong>' + esc(result.authority) + '</strong><br>Rule ' + esc(result.ruleVersion) + ' · effective ' + esc(dateLabel(result.effectiveDate)) + ' · verified ' + esc(dateLabel(result.lastVerified)) + ' · confidence ' + esc(result.confidence) + '<br>FX: ' + esc(result.fxSource === 'user-override' ? 'your override; reference ' : 'reference ') + esc(result.fxReferenceSource) + ' snapshot · ' + esc(dateLabel(result.fxReferenceTimestamp)) + ' · ' + esc(result.fxFreshness) + '<ul>' + sourceLinks + '</ul><p>Planning estimate only. Confirm classification, current rates, valuation, exemptions and declaration charges with the authority or a licensed customs professional.</p></div></div>';
    resultNode.hidden = false;
    el('scenarioSection').hidden = false;
    el('exportActions').hidden = false;
    statusNode.textContent = 'Estimate calculated locally. No shipment amounts were sent or stored.';
  }
  function calculate() {
    if (!rules || !fxSnapshot) { statusNode.textContent = 'Rules or FX data are not ready. Try again.'; return; }
    var input = getInput();
    if (input.destination === 'unsupported') {
      analytics('import_unsupported_market', { market: 'other' });
      showUnsupported('Choose Nigeria, Kenya, Ghana or South Africa. Other destinations need maintained country-specific rules.');
      statusNode.textContent = 'Unsupported destination shown.';
      return;
    }
    var output = engine.calculate(input, rules, { fxSnapshot: fxSnapshot });
    if (!output.valid) {
      if (output.unsupported) showUnsupported(output.reason || 'This category needs a separate verified workflow.', output.route);
      else statusNode.textContent = 'Review these inputs: ' + output.errors.join(', ') + '.';
      return;
    }
    currentInput = input;
    render(output);
    analytics('import_estimate_completed', { destination: input.destination, origin: input.origin, goods_type: input.goodsType, fx_override: Number(input.fxRate) > 0, optional_costs: optionCostsUsed(input) });
    if (Number(input.fxRate) > 0) analytics('import_fx_override_used', { destination: input.destination, source_currency: input.sourceCurrency });
    if (optionCostsUsed(input)) analytics('import_optional_cost_added', { destination: input.destination });
    if (output.stale) analytics('import_stale_rule_shown', { destination: input.destination, rule_version: output.ruleVersion });
  }
  function summary() {
    if (!currentResult) return '';
    var r = currentResult;
    var sourceLines = r.sources.map(function (source) { return 'Official source: ' + source.title + ' — ' + source.url; });
    return ['AfroTools Import & Landed Cost Estimate', 'Destination: ' + r.country, 'Origin: ' + r.origin, 'Supplier cost: ' + money(r.purchaseValueLocal), 'Freight: ' + money(r.freightLocal), 'Insurance: ' + money(r.insuranceLocal), 'Customs value: ' + money(r.customsValue), 'Duty: ' + money(r.duty), 'Excise: ' + money(r.excise), 'Levies: ' + money(r.totalLevies), 'VAT: ' + money(r.vat), 'Other government charges: ' + money(r.otherStatutory), 'Optional local costs: ' + money(r.optionalCostsTotal), 'Estimated landed cost: ' + money(r.landedCostLocal), 'Per unit: ' + money(r.landedCostPerUnit), 'FX rate: ' + r.fxRate + ' ' + r.destinationCurrency + ' per ' + r.sourceCurrency, 'FX reference: ' + r.fxReferenceSource + ', snapshot ' + r.fxReferenceTimestamp + ', ' + r.fxFreshness, 'Customs authority: ' + r.authority, 'Rule: ' + r.ruleVersion + ', effective ' + r.effectiveDate + ', verified ' + r.lastVerified].concat(sourceLines, ['Planning estimate only; confirm the declaration with the destination authority.']).join('\n');
  }

  form.addEventListener('submit', function (event) { event.preventDefault(); if (form.reportValidity()) calculate(); });
  el('destination').addEventListener('change', function () {
    var destination = value('destination');
    analytics('import_destination_selected', { destination: destination });
    updateDutyBands(); updateFxHelp();
    if (destination === 'unsupported') {
      analytics('import_unsupported_market', { market: 'other' });
      showUnsupported('Choose Nigeria, Kenya, Ghana or South Africa. Other destinations need maintained country-specific rules.');
      statusNode.textContent = 'Unsupported destination shown.';
    }
  });
  el('origin').addEventListener('change', function () { analytics('import_origin_selected', { origin: value('origin') }); });
  el('goodsType').addEventListener('change', function () { analytics('import_goods_type_selected', { goods_type: value('goodsType') }); if (value('goodsType') === 'vehicle') showUnsupported(rules.goodsTypes.vehicle.notes, rules.goodsTypes.vehicle.route); });
  el('sourceCurrency').addEventListener('change', updateFxHelp);
  el('dutyRate').addEventListener('change', function () { el('customDutyField').hidden = value('dutyRate') !== 'custom'; if (!el('customDutyField').hidden) el('customDutyRate').focus(); });
  el('resetImport').addEventListener('click', function () { form.reset(); updateDutyBands(); updateFxHelp(); currentInput = null; currentResult = null; resultNode.hidden = true; el('scenarioSection').hidden = true; el('exportActions').hidden = true; statusNode.textContent = 'Reset. Nothing was stored or sent.'; });
  el('compareScenario').addEventListener('click', function () {
    if (!currentInput || !currentResult) return;
    var other = Object.assign({}, currentInput, { purchaseValue: value('scenarioPurchase') || currentInput.purchaseValue, freight: value('scenarioFreight') || currentInput.freight, fxRate: value('scenarioFx') || currentInput.fxRate });
    var comparison = engine.compare(currentInput, other, rules, { fxSnapshot: fxSnapshot });
    if (!comparison.valid) { el('scenarioResult').textContent = 'Review scenario B inputs.'; return; }
    el('scenarioResult').innerHTML = '<div class="ilc-compare"><article><span>Scenario A</span><strong>' + esc(currencyFormat(comparison.left.landedCostLocal, comparison.left.destinationCurrency)) + '</strong></article><div class="ilc-compare-delta">' + (comparison.compatible ? (comparison.differenceLocal >= 0 ? '+' : '') + esc(currencyFormat(comparison.differenceLocal, comparison.left.destinationCurrency)) + '<br>(' + comparison.differencePercent.toFixed(2) + '%)' : 'Different rules and currencies') + '</div><article><span>Scenario B</span><strong>' + esc(currencyFormat(comparison.right.landedCostLocal, comparison.right.destinationCurrency)) + '</strong></article></div>';
    analytics('import_scenario_compared', { destination: currentInput.destination, compatible: comparison.compatible, fx_override: Number(other.fxRate) > 0 });
  });
  el('printImport').addEventListener('click', function () { if (!currentResult) return; window.print(); analytics('import_export_completed', { format: 'print', destination: currentResult.destination }); });
  el('copyImport').addEventListener('click', function () { if (!currentResult) return; navigator.clipboard.writeText(summary()).then(function () { statusNode.textContent = 'Summary copied.'; analytics('import_export_completed', { format: 'copy', destination: currentResult.destination }); }); });
  el('pdfImport').addEventListener('click', function () {
    if (!currentResult || !window.jspdf || !window.jspdf.jsPDF) { statusNode.textContent = 'PDF support is unavailable; use Print instead.'; return; }
    var doc = new window.jspdf.jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('Import & Landed Cost Estimate', 48, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(doc.splitTextToSize(summary(), 500), 48, 85, { lineHeightFactor: 1.45 });
    doc.save('afrotools-import-landed-cost-estimate.pdf');
    statusNode.textContent = 'Private PDF downloaded locally.';
    analytics('import_export_completed', { format: 'pdf', destination: currentResult.destination });
  });

  Promise.all([
    fetch('/data/trade/import-rules.json').then(function (response) { if (!response.ok) throw new Error('rules'); return response.json(); }),
    fetch('/data/forex/latest.json').then(function (response) { if (!response.ok) throw new Error('fx'); return response.json(); })
  ]).then(function (payload) {
    rules = payload[0]; fxSnapshot = payload[1]; updateDutyBands(); updateFxHelp(); statusNode.textContent = 'Ready. Choose a confirmed duty rate to calculate.';
  }).catch(function () { statusNode.textContent = 'The maintained rules or FX snapshot could not be loaded. Please retry later.'; });
}());
