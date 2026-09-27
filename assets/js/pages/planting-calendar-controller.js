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
      html += '<div class="calendar-note calendar-note--bimodal">Bimodal rainfall: two planting seasons shown (e.g. Early/Late or Long/Short Rain)</div>';
    } else if (result.note === 'forest-unimodal-warning') {
      html += '<div class="calendar-note calendar-note--warning">Unimodal selected: forest zones often have two seasons. Consider switching to Bimodal for your area.</div>';
    }
    result.months.forEach(function monthHeader(month) { html += '<div class="month-header">' + month + '</div>'; });
    result.crops.forEach(function cropRow(crop) {
      html += '<div class="crop-name">' + crop.id + '</div>';
      crop.months.forEach(function monthCell(month, index) {
        var label = month.value === 1 ? 'Sow' : month.value === 3 ? 'Harv' : month.value === 2 ? 'Grow' : '';
        var description = month.status === 'plant' ? 'Plant or sow' : month.status === 'grow' ? 'Growing' : month.status === 'harvest' ? 'Harvest' : 'Off-season';
        html += '<div class="cell ' + month.status + '" role="img" aria-label="' + crop.id + ', ' + result.months[index] + ': ' + description + '"><span class="cell-month" aria-hidden="true">' + result.months[index] + '</span><span class="cell-status" aria-hidden="true">' + label + '</span></div>';
      });
    });
    id('calendarGrid').innerHTML = html;
    id('calendarStatus').textContent = 'Planting calendar updated: ' + result.crops.length + ' crops for ' + id('zone').selectedOptions[0].textContent + ', ' + id('rainfall').selectedOptions[0].textContent + '.';
    root.PLANTING_CALENDAR_LAST_RESULT = result;
    return result;
  }
  root.pickCountry = pickCountry;
  root.generate = generate;
  root.AfroTools.PlantingCalendarController = { pickCountry: pickCountry, generate: generate };
  generate();
})(typeof window !== 'undefined' ? window : globalThis);
