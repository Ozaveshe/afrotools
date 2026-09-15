(function () {
  'use strict';
  var engine = window.AfroTools && window.AfroTools.PayeAuthorityRouterEngine;
  var authorities = [];
  var sw = document.documentElement.lang === 'sw';
  function text(english, swahili) { return sw ? swahili : english; }
  function calculatorRoute(item) {
    return sw ? (window.AfroToolsPayeAuthorityRoutes[item.calculator_url.replace(/\/$/, '') + '/'] || '/sw/mshahara-na-kodi/') : item.calculator_url;
  }
  function taxYear(value) {
    return sw ? value.replace('Current enacted schedule; status checked ', 'Ratiba iliyopitishwa; hali ilikaguliwa ').replace('Published schedule verified ', 'Ratiba iliyochapishwa ilihakikiwa ') : value;
  }
  function id(value) { return document.getElementById(value); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]; }); }
  function track(name, values) {
    var payload = Object.assign({ tool_id: 'paye-authority-finder' }, values || {});
    if (window.AfroTools && window.AfroTools.analytics && typeof window.AfroTools.analytics.track === 'function') window.AfroTools.analytics.track(name, payload);
    else if (typeof window.gtag === 'function') window.gtag('event', name, payload);
  }
  function status(message, warning) { id('authority-status').textContent = message; id('authority-status').classList.toggle('warn', Boolean(warning)); }
  function card(item) {
    return '<article class="authority-result"><h3>' + esc(item.acronym) + ' — ' + esc(item.authority_name) + '</h3><p>' + esc(item.country_name) + text(' PAYE routing result', ': kikokotoo cha PAYE') + '</p><div class="authority-meta"><div><span>' + text('Country', 'Nchi') + '</span><strong>' + esc(item.country_name) + '</strong></div><div><span>' + text('Currency', 'Sarafu') + '</span><strong>' + esc(item.currency) + '</strong></div><div><span>' + text('Tax year / status', 'Mwaka wa kodi / hali') + '</span><strong>' + esc(taxYear(item.tax_year)) + '</strong></div></div><div class="authority-actions"><a class="authority-choice" href="' + esc(calculatorRoute(item)) + '" data-open-calculator="' + esc(item.id) + '">' + (sw ? 'Fungua kikokotoo cha PAYE: ' + esc(item.country_name) : 'Open ' + esc(item.calculator_name)) + '</a><a class="authority-choice secondary" href="' + esc(item.official_source_url) + '" target="_blank" rel="noopener noreferrer">' + text('Open official authority', 'Fungua tovuti rasmi ya mamlaka') + '</a></div></article>';
  }
  function renderResolved(item) {
    status(sw ? item.acronym + ' inalingana na ' + item.country_name + '. Angalia mwaka wa kodi, kisha fungua kikokotoo.' : 'Matched ' + item.acronym + ' to ' + item.country_name + '. Review the tax-year label, then open the canonical calculator.', false);
    id('authority-results').innerHTML = card(item);
    track('paye_authority_resolved', { authority_id: item.id, authority_acronym: item.acronym, country_code: item.country_code, match_status: 'resolved' });
  }
  function find(event) {
    if (event) event.preventDefault();
    var result = engine.resolve(authorities, { query: id('authority-query').value, countryCode: id('authority-country').value });
    if (result.status === 'resolved') return renderResolved(result.match);
    if (result.status === 'ambiguous') {
      status(text('That acronym is used in more than one country. Choose the correct jurisdiction.', 'Kifupisho hicho kinatumika katika nchi zaidi ya moja. Chagua nchi sahihi.'), true);
      id('authority-results').innerHTML = '<div class="authority-choice-grid">' + result.matches.map(function (item) { return '<button class="authority-choice" type="button" data-authority-id="' + esc(item.id) + '"><strong>' + esc(item.country_name) + '</strong> ' + esc(item.authority_name) + '</button>'; }).join('') + '</div>';
      track('paye_authority_ambiguous', { match_count: result.matches.length });
      return;
    }
    status(text('No supported PAYE authority matched. Try a listed acronym or choose a supported country.', 'Hakuna mamlaka inayolingana. Jaribu kifupisho kilichoorodheshwa au chagua nchi inayopatikana.'), true);
    id('authority-results').innerHTML = '';
    track('paye_authority_unsupported', { query_length: String(id('authority-query').value || '').length, match_status: 'unsupported' });
  }
  function populate(payload) {
    var validation = engine.validateDataset(payload);
    if (!validation.valid) throw new Error(validation.errors[0]);
    authorities = payload.authorities;
    var countries = authorities.slice().sort(function (a, b) { return a.country_name.localeCompare(b.country_name); });
    id('authority-country').innerHTML = '<option value="">' + text('Choose only if needed', 'Chagua inapohitajika') + '</option>' + countries.map(function (item) { return '<option value="' + esc(item.country_code) + '">' + esc(item.country_name) + '</option>'; }).join('');
    id('authority-form').querySelector('button[type="submit"]').disabled = false;
  }
  document.addEventListener('DOMContentLoaded', function () {
    if (!engine || (sw && !window.AfroToolsPayeAuthorityRoutes)) return status(text('The authority matcher did not load.', 'Kitafutaji hakijapakia. Tumia viungo vya nchi hapa chini.'), true);
    id('authority-form').addEventListener('submit', find);
    id('authority-country').addEventListener('change', function () { track('paye_authority_country_selected', { country_code: this.value || 'none' }); if (this.value) find(); });
    id('authority-results').addEventListener('click', function (event) {
      var button = event.target.closest('[data-authority-id]');
      if (button) { var item = authorities.find(function (authority) { return authority.id === button.getAttribute('data-authority-id'); }); if (item) renderResolved(item); }
      var link = event.target.closest('[data-open-calculator]');
      if (link) track('paye_calculator_opened', { authority_id: link.getAttribute('data-open-calculator') });
    });
    fetch('/data/salary-tax/authority-router.json', { cache: 'no-store', credentials: 'same-origin' }).then(function (response) { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); }).then(populate).catch(function () { status(text('Authority routing data is unavailable. Use the supported authority links below.', 'Data ya mamlaka haipatikani. Tumia viungo vya nchi hapa chini.'), true); });
  });
}());
