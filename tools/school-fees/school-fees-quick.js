(function (window, document) {
  'use strict';

  var engine = window.AfroTools && window.AfroTools.schoolFeesEngine;
  var latest = null;

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function status(message, error) {
    var node = byId('sfQuickStatus');
    if (!node) return;
    node.textContent = message || '';
    node.classList.toggle('is-error', Boolean(error));
  }
  function read() {
    return {
      school: byId('sfSchoolName').value,
      currency: byId('sfCurrency').value,
      tuition: byId('sfTuition').value,
      extras: byId('sfExtras').value,
      monthlySupport: byId('sfMonthlySupport').value,
      rhythm: byId('sfTermMode').value
    };
  }
  function run() {
    latest = engine.calculate(read());
    var result = byId('sfQuickResult');
    var actions = byId('sfExportActions');
    if (!latest.ok) {
      result.classList.add('show', 'is-error');
      result.innerHTML = '<h3>Check the entries</h3><ul>' + latest.errors.map(function (error) {
        return '<li>' + escapeHtml(error) + '</li>';
      }).join('') + '</ul>';
      actions.hidden = true;
      status('The pressure check was not calculated.', true);
      return null;
    }
    var ratio = latest.ratio === null ? 'Add monthly support' : Math.round(latest.ratio * 100) + '% of support';
    result.classList.remove('is-error');
    result.classList.add('show');
    result.innerHTML =
      '<div class="fees-metrics">' +
      '<div class="fees-metric"><span>Annual total</span><strong>' + engine.formatMoney(latest.annual, latest.currency) + '</strong></div>' +
      '<div class="fees-metric"><span>Monthly reserve</span><strong>' + engine.formatMoney(latest.monthlyReserve, latest.currency) + '</strong></div>' +
      '<div class="fees-metric"><span>Reserve share</span><strong>' + escapeHtml(ratio) + '</strong></div>' +
      '</div><h3>' + escapeHtml(latest.verdict) + '</h3><p>' + escapeHtml(latest.guidance) + '</p>' +
      '<p class="fees-method-note">Method: annual tuition + annual extras, divided by 12. Payment amount uses the rhythm selected. Pressure bands are planning heuristics only.</p>';
    actions.hidden = false;
    status('Planning pack ready. Nothing is saved unless you choose Save on this device.');
    return latest;
  }
  function text() {
    var result = latest && latest.ok ? latest : run();
    return result ? engine.buildText(result) : '';
  }
  function fallbackCopy(value) {
    var field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('aria-hidden', 'true');
    document.body.appendChild(field);
    field.select();
    try {
      document.execCommand('copy');
      status('Planning pack copied.');
    } catch (error) {
      status('Copy failed. Select the visible result and copy it manually.', true);
    }
    field.remove();
  }
  function copy() {
    var value = text();
    if (!value) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(function () {
        status('Planning pack copied.');
      }).catch(function () { fallbackCopy(value); });
    } else fallbackCopy(value);
  }
  function download() {
    var value = text();
    if (!value) return;
    var url = URL.createObjectURL(new Blob([value], { type: 'text/plain;charset=utf-8' }));
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'school-fees-planning-pack.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    status('TXT planning pack downloaded.');
  }
  function save() {
    var value = text();
    if (!value) return;
    try {
      localStorage.setItem('afrotools_school_fees_pressure_pack', JSON.stringify({
        savedAt: new Date().toISOString(),
        pack: latest,
        text: value
      }));
      status('Planning pack saved on this device.');
    } catch (error) {
      status('This browser did not allow local saving.', true);
    }
  }
  function printPack() {
    if (!text()) return;
    document.body.classList.add('school-fees-printing');
    window.print();
    window.setTimeout(function () { document.body.classList.remove('school-fees-printing'); }, 300);
  }
  document.addEventListener('DOMContentLoaded', function () {
    byId('sfRunCheck').addEventListener('click', run);
    byId('sfCopyPack').addEventListener('click', copy);
    byId('sfDownloadPack').addEventListener('click', download);
    byId('sfSavePack').addEventListener('click', save);
    byId('sfPrintPack').addEventListener('click', printPack);
  });
})(window, document);
