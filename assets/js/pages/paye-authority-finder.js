(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.PayeAuthorityRouterEngine;
  var authorities = [];
  function id(value) { return document.getElementById(value); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function track(name, values) {
    var payload = Object.assign({ tool_id: 'paye-authority-finder' }, values || {});
    if (window.AfroTools && window.AfroTools.analytics && typeof window.AfroTools.analytics.track === 'function') window.AfroTools.analytics.track(name, payload);
    else if (typeof window.gtag === 'function') window.gtag('event', name, payload);
  }
  function status(message, warning) { id('authority-status').textContent = message; id('authority-status').classList.toggle('warn', Boolean(warning)); }
  function card(item) {
    return '<article class="authority-result"><h3>' + esc(item.acronym) + ' — ' + esc(item.authority_name) + '</h3><p>' + esc(item.country_name) + ' PAYE routing result</p><div class="authority-meta"><div><span>Country</span><strong>' + esc(item.country_name) + '</strong></div><div><span>Currency</span><strong>' + esc(item.currency) + '</strong></div><div><span>Tax year / status</span><strong>' + esc(item.tax_year) + '</strong></div></div><div class="authority-actions"><a class="authority-choice" href="' + esc(item.calculator_url) + '" data-open-calculator="' + esc(item.id) + '">Open ' + esc(item.calculator_name) + '</a><a class="authority-choice secondary" href="' + esc(item.official_source_url) + '" target="_blank" rel="noopener noreferrer">Open official authority</a></div></article>';
  }
  function renderResolved(item) {
    status('Matched ' + item.acronym + ' to ' + item.country_name + '. Review the tax-year label, then open the canonical calculator.', false);
    id('authority-results').innerHTML = card(item);
    track('paye_authority_resolved', { authority_id: item.id, authority_acronym: item.acronym, country_code: item.country_code, match_status: 'resolved' });
  }
  function find(event) {
    if (event) event.preventDefault();
    var result = engine.resolve(authorities, { query: id('authority-query').value, countryCode: id('authority-country').value });
    if (result.status === 'resolved') return renderResolved(result.match);
    if (result.status === 'ambiguous') {
      status('That acronym is used in more than one country. Choose the correct jurisdiction.', true);
      id('authority-results').innerHTML = '<div class="authority-choice-grid">' + result.matches.map(function (item) { return '<button class="authority-choice" type="button" data-authority-id="' + esc(item.id) + '"><strong>' + esc(item.country_name) + '</strong> ' + esc(item.authority_name) + '</button>'; }).join('') + '</div>';
      track('paye_authority_ambiguous', { authority_acronym: id('authority-query').value.trim().toUpperCase(), match_count: result.matches.length });
      return;
    }
    status('No supported PAYE authority matched. Try a listed acronym or choose a supported country.', true);
    id('authority-results').innerHTML = '';
    track('paye_authority_unsupported', { query_length: String(id('authority-query').value || '').length, match_status: 'unsupported' });
  }
  function populate(payload) {
    var validation = engine.validateDataset(payload);
    if (!validation.valid) throw new Error(validation.errors[0]);
    authorities = payload.authorities;
    var countries = authorities.slice().sort(function (a, b) { return a.country_name.localeCompare(b.country_name); });
    id('authority-country').innerHTML = '<option value="">Choose only if needed</option>' + countries.map(function (item) { return '<option value="' + esc(item.country_code) + '">' + esc(item.country_name) + '</option>'; }).join('');
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (!engine) return status('The authority matcher did not load.', true);
    id('authority-form').addEventListener('submit', find);
    id('authority-country').addEventListener('change', function () { track('paye_authority_country_selected', { country_code: this.value || 'none' }); if (this.value) find(); });
    id('authority-results').addEventListener('click', function (event) {
      var button = event.target.closest('[data-authority-id]');
      if (button) { var item = authorities.find(function (authority) { return authority.id === button.getAttribute('data-authority-id'); }); if (item) renderResolved(item); }
      var link = event.target.closest('[data-open-calculator]');
      if (link) track('paye_calculator_opened', { authority_id: link.getAttribute('data-open-calculator') });
    });
    fetch('/data/salary-tax/authority-router.json', { cache: 'no-store', credentials: 'same-origin' }).then(function (response) { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); }).then(populate).catch(function () { status('Authority routing data is unavailable. Use the supported authority links below.', true); });
  });
}());
