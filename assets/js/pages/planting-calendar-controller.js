(function plantingCalendarController(root) {
  'use strict';
  var engine = root.AfroTools && root.AfroTools.PlantingCalendarEngine;
  var data = root.AfroTools && root.AfroTools.PlantingCalendarData;
  function id(value) { return document.getElementById(value); }
  function pickCountry() {
    var selected = engine.selectCountryZone(id('country').value, data);
    if (!selected.zone) return;
    id('zone').value = selected.zone;
    id('rainfall').value = selected.rainfall;
    generate();
  }
  function generate() {
    var result = engine.calculate({ zone: id('zone').value, rainfall: id('rainfall').value }, data);
    if (!result.ok) return result;
    var html = '';
    if (result.note === 'bimodal-two-seasons') {
      html += '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:7px;padding:10px 14px;font-size:.78rem;color:#14532d;font-weight:600;margin-bottom:12px;">🌧️ Bimodal rainfall: two planting seasons shown (e.g. Early/Late or Long/Short Rain)</div>';
    } else if (result.note === 'forest-unimodal-warning') {
      html += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:7px;padding:10px 14px;font-size:.78rem;color:#92400e;font-weight:600;margin-bottom:12px;">☀️ Unimodal selected: forest zones often have two seasons. Consider switching to Bimodal for your area.</div>';
    }
    result.months.forEach(function monthHeader(month) { html += '<div class="month-header">' + month + '</div>'; });
    result.crops.forEach(function cropRow(crop) {
      html += '<div class="crop-name">' + crop.id + '</div>';
      crop.months.forEach(function monthCell(month) {
        var label = month.value === 1 ? 'Sow' : month.value === 3 ? 'Harv' : '';
        html += '<div class="cell ' + month.status + '">' + label + '</div>';
      });
    });
    id('calendarGrid').innerHTML = html;
    root.PLANTING_CALENDAR_LAST_RESULT = result;
    return result;
  }
  root.pickCountry = pickCountry;
  root.generate = generate;
  root.AfroTools.PlantingCalendarController = { pickCountry: pickCountry, generate: generate };
  generate();
})(typeof window !== 'undefined' ? window : globalThis);
