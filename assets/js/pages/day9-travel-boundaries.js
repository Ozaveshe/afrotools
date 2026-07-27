(function () {
  'use strict';

  var match = window.location.pathname.match(/^\/tools\/([^/]+)\/?$/);
  var toolId = match ? match[1] : '';
  var travelTools = [
    'africa-flight', 'airbnb-vs-hotel', 'airport-transfer',
    'beach-holiday-budget', 'festival-travel-budget', 'hotel-star-guide',
    'safari-cost', 'travel-packing-list', 'travel-vaccination-cost'
  ];
  if (travelTools.indexOf(toolId) === -1) return;

  function addReflowStyles() {
    if (document.getElementById('day9-travel-reflow')) return;
    var style = document.createElement('style');
    style.id = 'day9-travel-reflow';
    style.textContent =
      '.en-tool-layout,.en-tool-layout>*,' +
      '.en-card,.en-results,.en-results-hero,.en-results-hero-grid{' +
      'min-width:0;max-width:100%}' +
      '.en-results-table-wrap{display:block;width:100%;max-width:100%;min-width:0;overflow-x:auto;overscroll-behavior-inline:contain}' +
      '[data-day9-travel-boundary]{box-sizing:border-box;max-width:calc(100% - 24px)!important;overflow-wrap:anywhere}' +
      '@media(max-width:220px){.en-tool-layout,.en-form-grid,.en-form-grid-2,.en-results-hero-grid{display:block!important}' +
      '.en-field,.en-card,.en-results-hero-grid>*{min-width:0!important;max-width:100%!important}' +
      '.en-btn,.btn-calc{white-space:normal!important;overflow-wrap:anywhere}}';
    document.head.appendChild(style);
  }

  function addPlanningBoundary() {
    var layout = document.querySelector('.en-tool-layout') ||
      (toolId === 'africa-flight' ? document.querySelector('.tool-hero + .container') : null);
    if (!layout || document.querySelector('[data-day9-travel-boundary]')) return;
    var note = document.createElement('aside');
    note.setAttribute('data-day9-travel-boundary', '');
    note.setAttribute('role', 'note');
    note.style.cssText = 'max-width:1120px;margin:16px auto;padding:12px 16px;border:1px solid #bae6fd;border-radius:10px;background:#f0f9ff;color:#0c4a6e;line-height:1.55';
    note.innerHTML = toolId === 'travel-vaccination-cost'
      ? '<strong>Health boundary:</strong> this local worksheet does not determine vaccine requirements, recommend treatment, or quote clinic prices. Requirements change and depend on route, transit, health history, and timing. Verify with a qualified clinician and current official sources before travel.'
      : '<strong>Planning boundary:</strong> results use the values or static baseline assumptions shown on this page. They are not live prices, availability, entry rules, safety advice, or guarantees. Replace baseline figures with current quotes and confirm rules with the relevant operator or authority.';
    layout.parentNode.insertBefore(note, layout);
  }

  function improveResultStatus() {
    document.querySelectorAll('.en-results, .results, [data-df-result]').forEach(function (result) {
      result.setAttribute('aria-live', 'polite');
      result.setAttribute('aria-atomic', 'true');
    });
  }

  function addReset() {
    var actions = document.querySelector('.en-form-actions');
    if (!actions && toolId === 'africa-flight') {
      var run = document.querySelector('.btn-calc');
      actions = run && run.parentNode;
    }
    if (!actions || actions.querySelector('[data-day9-reset]')) return;
    var fields = Array.prototype.slice.call(document.querySelectorAll('.en-tool-layout input, .en-tool-layout select, .en-tool-layout textarea, #flightCountry, #flightRoute, #flightClass, #flightBooking'));
    var defaults = fields.map(function (field) {
      return { field: field, value: field.value, checked: field.checked };
    });
    var reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'en-btn en-btn-secondary';
    reset.setAttribute('data-day9-reset', '');
    reset.textContent = 'Reset';
    reset.addEventListener('click', function () {
      defaults.forEach(function (item) {
        item.field.value = item.value;
        item.field.checked = item.checked;
      });
      document.querySelectorAll('.en-results, .results').forEach(function (result) {
        result.classList.remove('on', 'show');
      });
      if (fields[0]) fields[0].focus();
    });
    actions.appendChild(reset);
  }

  function replaceHealthCalculator() {
    if (toolId !== 'travel-vaccination-cost') return;
    var run = document.querySelector('.en-form-actions .en-btn');
    if (run) run.textContent = 'Create appointment brief';

    window.calcVacc = function () {
      var departure = document.getElementById('depCountry');
      var destination = document.getElementById('destCountry');
      var days = Number(document.getElementById('tripDays').value);
      var travellers = Number(document.getElementById('travellers').value);
      var results = document.getElementById('results');
      var table = document.getElementById('vaccTable');
      var timeline = document.getElementById('timelineBody');

      results.classList.add('on');
      if (!Number.isFinite(days) || days < 1 || !Number.isFinite(travellers) || travellers < 1) {
        document.getElementById('totalCost').textContent = 'Check trip details';
        document.getElementById('perPersonLabel').textContent = 'Days and travellers must both be at least 1.';
        document.getElementById('weeksLabel').textContent = 'No plan created';
        table.innerHTML = '';
        timeline.innerHTML = '';
        return;
      }

      document.getElementById('totalCost').textContent = 'Clinician review needed';
      document.getElementById('perPersonLabel').textContent = travellers + ' traveller' + (travellers === 1 ? '' : 's') + ' · ' + days + ' day' + (days === 1 ? '' : 's');
      document.getElementById('weeksLabel').textContent = 'Verify current rules';
      table.innerHTML =
        '<div class="vacc-check"><div class="vacc-label">Route to discuss<small>' +
        departure.options[departure.selectedIndex].text + ' to ' +
        destination.options[destination.selectedIndex].text +
        ', including every transit point.</small></div></div>' +
        '<div class="vacc-check"><div class="vacc-label">Bring to the appointment<small>Travel dates, transit route, health history, current medicines, and any vaccination records.</small></div></div>' +
        '<div class="vacc-check"><div class="vacc-label">Verify independently<small><a href="https://www.who.int/travel-advice/vaccines">WHO travel vaccine guidance</a> and <a href="https://www.iata.org/en/travel-centre/">IATA Travel Centre requirements</a>. Recheck close to departure because rules can change.</small></div></div>';
      timeline.innerHTML =
        '<tr><td>Now</td><td>Book a qualified travel-health appointment. A clinician must personalize health advice.</td></tr>' +
        '<tr><td>Before booking</td><td>Ask the clinic for its current consultation, vaccine, certificate, and follow-up prices; enter those quotes in your own budget.</td></tr>' +
        '<tr><td>Before departure</td><td>Recheck official entry and transit requirements with the destination authority and carrier.</td></tr>';
    };
  }

  function init() {
    addReflowStyles();
    addPlanningBoundary();
    improveResultStatus();
    replaceHealthCalculator();
    addReset();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());
