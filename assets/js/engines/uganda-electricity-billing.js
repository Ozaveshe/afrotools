(function (root) {
  'use strict';
  function applies(record) {
    return !!record && record.country_code === 'UG' && record.provider_id === 'uedcl'
      && ['domestic_standard', 'domestic_lifeline'].indexOf(record.customer_class) !== -1;
  }
  function prepare(record, options) {
    if (!applies(record)) return { ok: true, record: record };
    options = options || {};
    var language = String(options.language || 'en').slice(0, 2);
    function message(en, fr, sw) { return language === 'fr' ? fr : language === 'sw' ? sw : en; }
    var prior = options.mode === 'money_to_units' ? Number(options.previousUnits) : 0;
    var months = Number(options.serviceMonths);
    if (options.mode === 'money_to_units' && (String(options.previousUnits).trim() === '' || !Number.isFinite(prior) || prior < 0)) {
      return { ok: false, field: 'previousUnits', error: message('Enter units already purchased this month, or 0 for the first purchase.', 'Saisissez les unités déjà achetées ce mois-ci, ou 0 pour le premier achat.', 'Weka uniti zilizonunuliwa tayari mwezi huu, au 0 kwa ununuzi wa kwanza.') };
    }
    if (String(options.serviceMonths).trim() === '' || !Number.isSafeInteger(months) || months < 0) {
      return { ok: false, field: 'serviceMonths', error: message('Enter unpaid monthly service charges as a non-negative whole number: 0 if already paid, 1 for this month only.', 'Saisissez un nombre entier positif ou nul de frais mensuels impayés : 0 si déjà payé, 1 pour ce mois uniquement.', 'Weka idadi kamili isiyo hasi ya ada za miezi isiyolipwa: 0 ikiwa imelipwa, 1 kwa mwezi huu pekee.') };
    }
    var adjusted = JSON.parse(JSON.stringify(record));
    adjusted.fixed_charge = record.fixed_charge * months;
    adjusted.tiers = record.tiers.filter(function (tier) { return tier.up_to == null || tier.up_to > prior; }).map(function (tier) {
      return Object.assign({}, tier, { from: Math.max(0, tier.from - prior), up_to: tier.up_to == null ? null : tier.up_to - prior });
    });
    adjusted.notes = message(record.notes + ' Scenario: ' + prior + ' kWh previously purchased this month; ' + months + ' unpaid monthly service charge(s). VAT is included once on energy plus service charges. Payment-channel fees and other account adjustments are not inferred.',
      'Scénario : ' + prior + ' kWh déjà achetés ce mois-ci ; ' + months + ' frais mensuels impayés de 3 360 UGX. TVA de 18 % incluse une seule fois sur énergie et service. Les paliers repartent à zéro chaque mois. Le tarif social exige une moyenne sur six mois ne dépassant pas 100 kWh ; l’admissibilité ne se déduit pas des unités achetées ce mois-ci. Autres frais non déduits automatiquement.',
      'Mfano: kWh ' + prior + ' zilizonunuliwa tayari mwezi huu; ada ' + months + ' za miezi isiyolipwa za UGX 3,360. VAT ya 18% imejumuishwa mara moja kwenye nishati na huduma. Madaraja huanza upya kila mwezi. Lifeline inahitaji wastani wa miezi sita usiozidi kWh 100; ustahiki hauamuliwi na uniti za mwezi huu. Ada nyingine hazikadiriwi.');
    return { ok: true, record: adjusted };
  }
  var api = { applies: applies, prepare: prepare };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.AfroTools = root.AfroTools || {}; root.AfroTools.engines = root.AfroTools.engines || {}; root.AfroTools.engines.ugandaElectricityBilling = api; }
})(typeof globalThis === 'undefined' ? this : globalThis);
