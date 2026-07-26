(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MaternalHealthGuide = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SOURCE_REVIEW_DATE = '2026-07-26';
  var COUNTRY_NAMES = Object.freeze({
    NG: 'Nigeria',
    KE: 'Kenya',
    ZA: 'South Africa',
    GH: 'Ghana',
    ET: 'Ethiopia',
    TZ: 'Tanzania',
    CD: 'DR Congo',
    UG: 'Uganda'
  });

  var FACTORS = Object.freeze([
    { id: 'age-context', label: 'Age under 18 or 35 and over', prompt: 'Ask how age changes the recommended monitoring or place of birth for this pregnancy.' },
    { id: 'first-pregnancy', label: 'First pregnancy', prompt: 'Ask what to expect, when to call and which local antenatal contacts are recommended.' },
    { id: 'previous-caesarean', label: 'Previous caesarean birth or uterine surgery', prompt: 'Ask where delivery should be planned and which symptoms require urgent review.' },
    { id: 'hypertension', label: 'Diagnosed high blood pressure or pre-eclampsia', prompt: 'Contact the maternity team promptly to confirm monitoring, medication and warning-sign instructions.' },
    { id: 'diabetes', label: 'Diabetes before pregnancy or gestational diabetes', prompt: 'Contact the maternity team promptly to confirm glucose, medicine, nutrition and growth-monitoring plans.' },
    { id: 'anaemia', label: 'Anaemia confirmed by a health professional', prompt: 'Ask how the confirmed result should be treated and when it will be rechecked.' },
    { id: 'hiv', label: 'HIV care during pregnancy', prompt: 'Contact the maternity or HIV care team promptly for an individual treatment and infant-care plan.' },
    { id: 'multiple-pregnancy', label: 'Twins or another multiple pregnancy confirmed by a professional', prompt: 'Ask whether contact timing, scans and place-of-birth planning should change.' },
    { id: 'distance-to-care', label: 'Long or unreliable journey to emergency maternity care', prompt: 'Make a transport, backup transport, contact and referral plan before labour.' },
    { id: 'limited-anc', label: 'Antenatal care has not started or contacts have been missed', prompt: 'Contact a local maternity service promptly to arrange care; do not wait for the next reference week.' }
  ]);

  var PROMPT_CONTACT_FACTOR_IDS = Object.freeze([
    'previous-caesarean',
    'hypertension',
    'diabetes',
    'anaemia',
    'hiv',
    'multiple-pregnancy',
    'limited-anc'
  ]);

  var ANC_REFERENCE = Object.freeze([
    { number: 1, week: 12, label: 'First contact', timing: 'Up to 12 weeks' },
    { number: 2, week: 20, label: 'Second contact', timing: 'Around 20 weeks' },
    { number: 3, week: 26, label: 'Third contact', timing: 'Around 26 weeks' },
    { number: 4, week: 30, label: 'Fourth contact', timing: 'Around 30 weeks' },
    { number: 5, week: 34, label: 'Fifth contact', timing: 'Around 34 weeks' },
    { number: 6, week: 36, label: 'Sixth contact', timing: 'Around 36 weeks' },
    { number: 7, week: 38, label: 'Seventh contact', timing: 'Around 38 weeks' },
    { number: 8, week: 40, label: 'Eighth contact', timing: 'Around 40 weeks' }
  ]);

  function normalizeWeek(value) {
    var week = Number(value);
    if (!Number.isInteger(week) || week < 1 || week > 42) {
      return { ok: false, error: 'Enter a whole pregnancy week from 1 to 42.' };
    }
    return { ok: true, value: week };
  }

  function normalizeCountry(value) {
    var code = String(value || '').toUpperCase();
    return COUNTRY_NAMES[code] ? code : 'OTHER';
  }

  function knownFactorIds(values) {
    var requested = Array.isArray(values) ? values : [];
    var allowed = {};
    FACTORS.forEach(function (factor) { allowed[factor.id] = true; });
    return requested.filter(function (id, index) {
      return allowed[id] && requested.indexOf(id) === index;
    });
  }

  function nextReferenceContacts(week) {
    var upcoming = ANC_REFERENCE.filter(function (contact) { return contact.week >= week; });
    if (upcoming.length) return upcoming.slice(0, 2);
    return [{
      number: null,
      week: week,
      label: 'Post-date or late-pregnancy review',
      timing: 'Contact the maternity service now for individual timing'
    }];
  }

  function buildGuide(input) {
    var weekResult = normalizeWeek(input && input.week);
    if (!weekResult.ok) return { ok: false, errors: [weekResult.error] };

    var week = weekResult.value;
    var countryCode = normalizeCountry(input && input.country);
    var factorIds = knownFactorIds(input && input.factorIds);
    var factors = FACTORS.filter(function (factor) { return factorIds.indexOf(factor.id) !== -1; });
    var promptContact = factorIds.some(function (id) {
      return PROMPT_CONTACT_FACTOR_IDS.indexOf(id) !== -1;
    });

    return {
      ok: true,
      week: week,
      countryCode: countryCode,
      countryName: COUNTRY_NAMES[countryCode] || 'your country',
      selectedFactors: factors.map(function (factor) {
        return { id: factor.id, label: factor.label, prompt: factor.prompt };
      }),
      conversationTiming: promptContact ? 'prompt-contact' : 'next-contact',
      headline: promptContact
        ? 'Contact your maternity team promptly to discuss the selected factors.'
        : 'Bring these questions to your next antenatal contact.',
      limit: 'This guide does not calculate maternal mortality, diagnose a condition, classify a pregnancy, or estimate an individual outcome.',
      nextContacts: nextReferenceContacts(week),
      scheduleLimit: 'WHO provides an eight-contact reference model. Your national programme and maternity team may use different timing or add contacts.',
      sourceReviewDate: SOURCE_REVIEW_DATE
    };
  }

  function toText(guide) {
    if (!guide || !guide.ok) return '';
    var lines = [
      'Maternal health conversation guide',
      'Created locally in this browser',
      '',
      'Country context: ' + guide.countryName,
      'Pregnancy week entered: ' + guide.week,
      '',
      guide.headline,
      guide.limit,
      ''
    ];

    if (guide.selectedFactors.length) {
      lines.push('Topics selected for discussion:');
      guide.selectedFactors.forEach(function (factor) {
        lines.push('- ' + factor.label + ': ' + factor.prompt);
      });
    } else {
      lines.push('No discussion factors were selected. This does not mean the pregnancy is low risk.');
    }

    lines.push('', 'WHO eight-contact reference:');
    guide.nextContacts.forEach(function (contact) {
      lines.push('- ' + contact.label + ': ' + contact.timing);
    });
    lines.push('', guide.scheduleLimit);
    lines.push('Sources reviewed: ' + guide.sourceReviewDate + '.');
    lines.push('Emergency warning signs override this guide: seek immediate local emergency maternity care.');
    return lines.join('\n');
  }

  return Object.freeze({
    SOURCE_REVIEW_DATE: SOURCE_REVIEW_DATE,
    COUNTRY_NAMES: COUNTRY_NAMES,
    FACTORS: FACTORS,
    ANC_REFERENCE: ANC_REFERENCE,
    normalizeWeek: normalizeWeek,
    buildGuide: buildGuide,
    toText: toText
  });
});
