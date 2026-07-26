(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.schoolFeesEngine = engine;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var PERIODS = { 2: '2 semesters', 3: '3 terms', 12: '12 monthly reserves' };

  function finiteNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function normalizeCurrency(value) {
    var currency = String(value || '').trim().toUpperCase();
    return /^[A-Z]{3}$/.test(currency) ? currency : null;
  }

  function calculate(input) {
    input = input || {};
    var tuition = finiteNumber(input.tuition);
    var extras = finiteNumber(input.extras);
    var support = finiteNumber(input.monthlySupport);
    var rhythm = Number(input.rhythm);
    var currency = normalizeCurrency(input.currency);
    var errors = [];

    if (!currency) errors.push('Use a three-letter currency code such as NGN, KES, GHS or ZAR.');
    if (tuition === null || tuition < 0) errors.push('Annual tuition must be zero or more.');
    if (extras === null || extras < 0) errors.push('Annual extras must be zero or more.');
    if (support === null || support < 0) errors.push('Monthly support must be zero or more.');
    if (!Object.prototype.hasOwnProperty.call(PERIODS, rhythm)) errors.push('Choose a supported payment rhythm.');
    if (!errors.length && tuition + extras <= 0) errors.push('Enter an annual tuition or extras amount above zero.');

    if (errors.length) return { ok: false, errors: errors };

    var annual = tuition + extras;
    var monthlyReserve = annual / 12;
    var paymentChunk = annual / rhythm;
    var ratio = support > 0 ? monthlyReserve / support : null;
    var band = ratio === null ? 'unknown' : ratio > 0.75 ? 'high' : ratio > 0.45 ? 'stretch' : 'lower';
    var verdict = {
      unknown: 'Monthly support needed',
      high: 'High reserve pressure',
      stretch: 'Stretch reserve pressure',
      lower: 'Lower reserve pressure'
    }[band];
    var guidance = {
      unknown: 'Add monthly support to compare the fee reserve with the money currently available.',
      high: 'The monthly fee reserve uses more than 75% of the support entered. Compare other options and verify payment plans before committing.',
      stretch: 'The monthly fee reserve uses 45% to 75% of the support entered. Pressure-test living costs and payment deadlines before committing.',
      lower: 'The monthly fee reserve uses at most 45% of the support entered. This is a planning signal, not proof that the full household budget is affordable.'
    }[band];

    return {
      ok: true,
      school: String(input.school || '').trim() || 'School option',
      currency: currency,
      tuition: tuition,
      extras: extras,
      annual: annual,
      monthlyReserve: monthlyReserve,
      paymentChunk: paymentChunk,
      rhythm: rhythm,
      rhythmLabel: PERIODS[rhythm],
      support: support,
      ratio: ratio,
      band: band,
      verdict: verdict,
      guidance: guidance
    };
  }

  function formatMoney(value, currency) {
    return currency + ' ' + Math.round(value).toLocaleString('en');
  }

  function buildText(result) {
    if (!result || !result.ok) return '';
    var coverage = result.ratio === null ? 'Not calculated' : Math.round(result.ratio * 100) + '% of entered monthly support';
    return [
      'AfroTools School Fees Planning Pack',
      'School or option: ' + result.school,
      'Annual tuition entered: ' + formatMoney(result.tuition, result.currency),
      'Annual extras entered: ' + formatMoney(result.extras, result.currency),
      'Annual total entered: ' + formatMoney(result.annual, result.currency),
      'Monthly reserve: ' + formatMoney(result.monthlyReserve, result.currency),
      'Payment amount: ' + formatMoney(result.paymentChunk, result.currency) + ' across ' + result.rhythmLabel,
      'Monthly support entered: ' + formatMoney(result.support, result.currency),
      'Reserve pressure: ' + result.verdict + ' — ' + coverage,
      'Guidance: ' + result.guidance,
      '',
      'Check before paying:',
      '- Confirm the current fee schedule directly with the school.',
      '- Check registration, books, uniforms, transport, meals and levies.',
      '- Confirm payment deadlines, instalment rules, refunds and mid-session changes.',
      '',
      'Planning estimate only. The pressure bands are AfroTools planning heuristics, not a school quote, affordability decision, loan decision or financial advice.'
    ].join('\n');
  }

  function trustState(row) {
    row = row || {};
    var verified = String(row.verification_state || '').toLowerCase() === 'verified';
    var approved = String(row.review_status || '').toLowerCase() === 'approved';
    var hasProof = safeProofUrl(row.proof_url) !== '';
    if (verified && approved) return { label: 'Verified and reviewed', tone: 'good', detail: 'The record reports both verified and approved states.' };
    if (hasProof) return { label: 'Published with proof link', tone: 'ok', detail: 'A supporting link is present, but the link alone does not prove the amount is current or correct.' };
    return { label: 'Published community record', tone: 'warn', detail: 'Use this as a comparison input and confirm the current amount with the school.' };
  }

  function safeProofUrl(value) {
    try {
      var url = new URL(String(value || ''));
      return url.protocol === 'https:' ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  function normalizeRow(row) {
    row = row || {};
    var tuition = finiteNumber(row.annual_tuition);
    var extras = finiteNumber(row.extras_total);
    tuition = tuition !== null && tuition >= 0 ? tuition : 0;
    extras = extras !== null && extras >= 0 ? extras : 0;
    var period = String(row.fee_period || '').trim() || 'Not stated';
    var isAnnual = period.toLowerCase() === 'annual';
    return {
      tuition: tuition,
      extras: extras,
      total: tuition + extras,
      period: period,
      isAnnual: isAnnual,
      currency: normalizeCurrency(row.currency_code || row.currency) || '',
      trust: trustState(row),
      proofUrl: safeProofUrl(row.proof_url)
    };
  }

  return {
    calculate: calculate,
    buildText: buildText,
    formatMoney: formatMoney,
    normalizeCurrency: normalizeCurrency,
    normalizeRow: normalizeRow,
    safeProofUrl: safeProofUrl,
    trustState: trustState
  };
});
