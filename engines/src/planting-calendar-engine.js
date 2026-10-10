(function plantingCalendarEngineModule(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.PlantingCalendarEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function plantingCalendarEngineFactory() {
  'use strict';

  function selectCountryZone(value, data) {
    var zone = String(value || '');
    return {
      zone: zone,
      rainfall: data.bimodalZones.indexOf(zone) >= 0 ? 'bimodal' : 'unimodal',
    };
  }

  function calculate(input, data) {
    input = input || {};
    if (!data || !data.zones) return { ok: false, status: 'missing-data' };
    var zone = typeof input.zone === 'string' ? input.zone : '';
    if (!Object.prototype.hasOwnProperty.call(data.zones, zone)) return { ok: false, status: 'unknown-zone', zone: zone };
    if (input.rainfall !== undefined && input.rainfall !== 'bimodal' && input.rainfall !== 'unimodal') return { ok: false, status: 'invalid-rainfall' };
    var rainfall = input.rainfall === 'bimodal' ? 'bimodal' : 'unimodal';
    var crops = data.zones[zone];
    var note = 'none';
    if (rainfall === 'bimodal' && data.bimodalZones.indexOf(zone) >= 0) note = 'bimodal-two-seasons';
    else if (rainfall === 'unimodal' && zone === 'forest') note = 'forest-unimodal-warning';
    return {
      ok: true,
      status: 'calculated',
      zone: zone,
      rainfall: rainfall,
      note: note,
      months: data.months.slice(),
      crops: Object.keys(crops).map(function mapCrop(crop) {
        return {
          id: crop,
          months: crops[crop].map(function mapMonth(value, index) {
            return { monthIndex: index, value: value, status: ['none', 'plant', 'grow', 'harvest'][value] };
          }),
        };
      }),
    };
  }

  return { calculate: calculate, selectCountryZone: selectCountryZone };
});
