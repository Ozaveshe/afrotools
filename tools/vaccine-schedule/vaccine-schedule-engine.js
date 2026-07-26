(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroToolsVaccineHandoff = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var WHO_PORTAL = 'https://immunizationdata.who.int/global?location=&topic=Vaccination-schedule';
  var PROGRAMMES = Object.freeze({
    NG: Object.freeze({
      country: 'Nigeria',
      programme: 'NPHCDA National Emergency Routine Immunization Coordination Centre',
      url: 'https://nphcda.gov.ng/nericc/',
      sourceNote: 'Official routine-immunization programme page. It is a programme handoff, not an embedded current dose table.'
    }),
    KE: Object.freeze({
      country: 'Kenya',
      programme: 'Ministry of Health clinical guidance for community health services',
      url: 'https://www.health.go.ke/sites/default/files/2025-04/Clinical%20Guidelines%20for%20Level%201%20Community%20Health%20Services.pdf',
      sourceNote: 'Official 2024 clinical guidance published online in 2025. Confirm later revisions and the live programme with the Ministry or clinic.'
    }),
    GH: Object.freeze({
      country: 'Ghana',
      programme: 'Ghana Health Service national childhood immunisation schedule page',
      url: 'https://ghs.gov.gh/?a=index&g=portal&id=187&m=article',
      sourceNote: 'Official schedule page indexed by Ghana Health Service; the live page timed out during the 26 July 2026 check, so confirm directly with GHS or a clinic.'
    }),
    ZA: Object.freeze({
      country: 'South Africa',
      programme: 'National Department of Health immunization programme',
      url: 'https://www.health.gov.za/immunization/',
      sourceNote: 'Official programme page. Its linked schedule material includes older dated documents, so use it as a handoff and confirm the current programme at a clinic.'
    }),
    ET: Object.freeze({
      country: 'Ethiopia',
      programme: 'No current country schedule page safely verified',
      url: '',
      sourceNote: 'Fail-closed: use the WHO country-reported schedule portal and confirm with the Ministry of Health or an authorised local provider.'
    }),
    OTHER: Object.freeze({
      country: 'Selected country',
      programme: 'No country programme page configured',
      url: '',
      sourceNote: 'Fail-closed: use the WHO country-reported schedule portal and confirm with the relevant ministry or an authorised local provider.'
    })
  });
  var AGE_BANDS = Object.freeze({
    newborn: 'Newborn / under 6 weeks',
    infant: '6 weeks to under 1 year',
    'early-childhood': '1 to 4 years',
    'school-age': '5 to 9 years',
    adolescent: '10 to 17 years',
    adult: '18 years or older'
  });
  var RECORD_STATUS = Object.freeze({
    routine: 'Checking the next routine programme step',
    missed: 'A dose may have been missed or delayed',
    unclear: 'The card or product entry is unclear',
    'no-record': 'The record is unavailable',
    reaction: 'A non-emergency post-vaccination concern'
  });

  function cleanRecordText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  }

  function prepare(input) {
    input = input || {};
    var errors = [];
    if (!PROGRAMMES[input.country]) errors.push({ field: 'country', message: 'Select a country or “Another country”.' });
    if (!AGE_BANDS[input.ageBand]) errors.push({ field: 'age-band', message: 'Select the age band shown on the record.' });
    if (!RECORD_STATUS[input.recordStatus]) errors.push({ field: 'record-status', message: 'Select what needs clarification.' });
    if (errors.length) return { ok: false, errors: errors };

    var programme = PROGRAMMES[input.country];
    var product = cleanRecordText(input.recordProduct);
    var questions = [
      'What does the current ' + programme.country + ' programme recommend for the ' + AGE_BANDS[input.ageBand].toLowerCase() + ' age band?',
      'Can you reconcile every available official record and explain which entries count in the current programme?',
      'Are any product, minimum-age, interval, campaign, school-programme, travel, pregnancy, immune-condition or health-history rules relevant?'
    ];
    if (input.recordStatus === 'missed') {
      questions.push('Please create the catch-up plan from the exact record; which dose, product and interval apply now?');
    } else if (input.recordStatus === 'unclear') {
      questions.push('What does the unclear record entry mean, and does it need confirmation from the administering facility?');
    } else if (input.recordStatus === 'no-record') {
      questions.push('How can the official record be recovered or safely reconciled without inventing dates or doses?');
    } else if (input.recordStatus === 'reaction') {
      questions.push('How should the non-emergency concern be clinically assessed and documented before any future vaccination decision?');
    } else {
      questions.push('What is the next documented programme step, and where should it be recorded after administration?');
    }
    if (product) questions.push('The record says “' + product + '”. What exact product and dose does that entry represent?');
    questions.push('Which symptoms after vaccination require routine follow-up, urgent review, or immediate emergency care locally?');

    return {
      ok: true,
      countryCode: input.country,
      country: programme.country,
      programme: programme.programme,
      officialUrl: programme.url,
      whoUrl: WHO_PORTAL,
      sourceNote: programme.sourceNote,
      sourceStatus: programme.url ? 'official-programme-handoff' : 'no-verified-country-page',
      checkedDate: '2026-07-26',
      ageBand: AGE_BANDS[input.ageBand],
      recordStatus: RECORD_STATUS[input.recordStatus],
      recordProduct: product,
      questions: questions,
      scheduleItems: [],
      completionStatus: null,
      dueDates: []
    };
  }

  return Object.freeze({
    prepare: prepare,
    cleanRecordText: cleanRecordText,
    programmes: PROGRAMMES,
    ageBands: AGE_BANDS,
    recordStatuses: RECORD_STATUS,
    whoPortal: WHO_PORTAL
  });
});
