(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.engines = root.AfroTools.engines || {};
  root.AfroTools.engines.itaxGuide = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var VERSION = 'kra-itax-guide-2026-08-09-v1';
  var SOURCE_CHECKED_DATE = '2026-08-09';
  var MAX_SOURCE_AGE_DAYS = 90;
  var SOURCES = Object.freeze({
    portal: 'https://itax.kra.go.ke/KRA-Portal/',
    pinAbout: 'https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/about-pin',
    pinSteps: 'https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/how-to-register-for-a-kra-pin-individual',
    pinRequirements: 'https://www.kra.go.ke/individual/individual-pin-registration/learn-about-pin/requirements-for-kra-pin-registration',
    filingCurrent: 'https://www.kra.go.ke/file-my-returns',
    filingFaq: 'https://www.kra.go.ke/helping-tax-payers/faqs/filing-returns-on-itax'
  });
  var TASKS = Object.freeze({
    pin: ['Confirm whether the taxpayer is an individual or non-individual.', 'Read the current KRA requirements for the taxpayer status.', 'Open New PIN Registration only on the official iTax portal.', 'Complete the live KRA form and save its acknowledgement receipt.'],
    access: ['Confirm the address starts with https://itax.kra.go.ke/.', 'Use the password-recovery route on the official login page.', 'Use only the registered KRA email flow.', 'If account or email details are wrong, stop and contact KRA through official support.'],
    return: ['Inspect the active obligation and return period in the iTax profile.', 'Reconcile every applicable income source and supporting record.', 'Follow the current live KRA return instructions for that obligation.', 'Review the declaration, submit only on iTax, and save the official acknowledgement.'],
    nil: ['Inspect the active obligation and period in the iTax profile.', 'Confirm there was no income for the relevant active obligation and period.', 'Do not use NIL to bypass missing records, unresolved income, or an unknown obligation.', 'Submit only through the official NIL-return route and save the acknowledgement.'],
    history: ['Open the official iTax account.', 'Use Returns, then Consult Return.', 'Select the return type and period shown by KRA.', 'Save the official return or acknowledgement as the record.'],
    support: ['Open KRA guidance or official contact channels.', 'Describe the task without sharing a password or OTP.', 'Ask KRA to confirm the obligation, period, account correction, or missing-return path.', 'Keep KRA correspondence or an official reference number.']
  });

  function validDate(value, label) {
    var raw = String(value || '');
    var parsed = new Date(raw + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(parsed.getTime())) throw new Error(label + ' must be a valid date.');
    return parsed;
  }
  function calculate(input) {
    input = input || {};
    var task = String(input.task || '');
    if (!TASKS[task]) throw new Error('Choose a supported iTax task.');
    var context = String(input.context || '');
    if (!['resident-individual','non-citizen','non-individual','unsure'].includes(context)) throw new Error('Choose the taxpayer context.');
    var obligation = String(input.obligation || '');
    if (!['income-individual','paye-employer','vat','pwo-none','other','unknown'].includes(obligation)) throw new Error('Choose the obligation shown by iTax, or choose unknown.');
    var filingYear = Number(input.filingYear);
    if (!Number.isInteger(filingYear) || filingYear < 2000 || filingYear > 2100) throw new Error('Enter a valid four-digit return year.');
    if (input.factsConfirmed !== true) throw new Error('Confirm that the selected task and context match the official account or current KRA guidance.');
    if (input.privacyConfirmed !== true) throw new Error('Confirm that no PIN, password, OTP, identity document, or tax record was entered here.');
    if (input.receiptPlanConfirmed !== true) throw new Error('Confirm that you have a safe place for the official KRA acknowledgement.');
    var asOf = validDate(input.asOfDate, 'Plan date');
    var checked = validDate(SOURCE_CHECKED_DATE, 'Source checked date');
    var sourceAgeDays = Math.floor((asOf.getTime() - checked.getTime()) / 86400000);
    if (sourceAgeDays < 0) throw new Error('Plan date cannot be before the source review date.');
    var stale = sourceAgeDays > MAX_SOURCE_AGE_DAYS;
    if (stale && input.currentSourceConfirmed !== true) throw new Error('The reviewed source pack is older than 90 days. Recheck the official KRA pages before continuing.');
    var stopReasons = [];
    if ((task === 'return' || task === 'nil') && obligation === 'unknown') stopReasons.push('The active tax obligation is unknown. Confirm it in iTax or with KRA before choosing a return path.');
    if (task === 'nil' && obligation === 'pwo-none') stopReasons.push('KRA describes PIN Without Obligation as having no filing obligation. Do not create a NIL-return task unless KRA shows an active obligation.');
    if (task === 'nil' && input.noIncomeConfirmed !== true) stopReasons.push('No-income status for the relevant active obligation and period has not been confirmed.');
    return {
      version: VERSION,
      sourceCheckedDate: SOURCE_CHECKED_DATE,
      sourceAgeDays: sourceAgeDays,
      sourceStatus: stale ? 'user-reconfirmed-after-review-window' : 'reviewed-current',
      inputs: { task: task, context: context, obligation: obligation, filingYear: filingYear, asOfDate: String(input.asOfDate) },
      decision: stopReasons.length ? 'stop-and-confirm' : 'prepare-and-open-official-route',
      stopReasons: stopReasons,
      checklist: TASKS[task].slice(),
      officialUrl: task === 'pin' ? SOURCES.pinRequirements : (task === 'return' || task === 'nil' ? SOURCES.filingCurrent : SOURCES.portal),
      sources: Object.assign({}, SOURCES),
      privacy: 'No credentials, identity documents, tax records, filing data, or payment details are collected or transmitted.'
    };
  }
  return Object.freeze({ VERSION: VERSION, SOURCE_CHECKED_DATE: SOURCE_CHECKED_DATE, MAX_SOURCE_AGE_DAYS: MAX_SOURCE_AGE_DAYS, SOURCES: SOURCES, TASKS: TASKS, calculate: calculate });
});
