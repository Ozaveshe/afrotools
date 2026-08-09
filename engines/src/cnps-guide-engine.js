(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.engines = root.AfroTools.engines || {};
  root.AfroTools.engines.cnpsGuide = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var VERSION = 'cnps-ci-guide-2026-08-09-v1';
  var SOURCE_CHECKED_DATE = '2026-08-09';
  var MAX_SOURCE_AGE_DAYS = 90;
  var SOURCES = Object.freeze({
    employer: 'https://www.cnps.ci/employeur/',
    ceilingNotice: 'https://www.cnps.ci/wp-content/uploads/2023/01/NOUVEAU-PLAFOND-DES-COTISATIONS-SOCIALES-DE-LA-CNPS.pdf',
    forms: 'https://www.cnps.ci/services-en-ligne/formulaires-telechargeables/',
    guides: 'https://www.cnps.ci/nos-guides/',
    legal: 'https://www.cnps.ci/services-en-ligne/textes-legaux-et-reglementaires/',
    disa: 'https://www.cnps.ci/services-en-ligne/e-disa/',
    independent: 'https://www.cnps.ci/independant/',
    portal: 'https://e.cnps.ci/connexion'
  });
  var TASKS = Object.freeze({
    employer: ['Confirm that the agency is CNPS Côte d’Ivoire, not a similarly named institution in another country.', 'Read the current employer-affiliation requirements and identify the responsible CNPS agency.', 'Prepare the current official documents outside AfroTools.', 'Submit only through the route CNPS specifies and retain the official acknowledgement.'],
    worker: ['Confirm the worker is in the Côte d’Ivoire salaried-worker regime.', 'Check whether the worker already has a unique, permanent CNPS number.', 'Use the current CNPS worker-declaration form and keep identity or family documents outside AfroTools.', 'Submit through CNPS and retain its official acknowledgement.'],
    branches: ['Separate retirement, family, maternity, and work-accident/occupational-disease branches.', 'Confirm the published worker and employer shares on the live employer page.', 'Obtain the employer’s sector-assigned work-accident rate from CNPS.', 'Use a source-bound payroll process only after the applicable base, ceiling, and assigned rate are confirmed.'],
    ceilings: ['Use the specific January 2023 CNPS notice rather than the legacy figures on the general employer page.', 'Confirm the 75,000 FCFA monthly floor and the branch-specific ceilings.', 'Check whether CNPS has issued a later or case-specific rule.', 'Record the official source date used by the payroll process.'],
    remit: ['Confirm the employer’s worker-count band and account schedule.', 'Reconcile the contribution period and official contribution call outside AfroTools.', 'Declare and pay only through the active e-CNPS account or route CNPS specifies.', 'Retain the CNPS declaration and payment receipts.'],
    disa: ['Open the current DISA guidance and form or e-DISA route from CNPS.', 'Reconcile annual salary records outside AfroTools.', 'Submit the annual regularisation only to CNPS using its current instructions.', 'Retain the official DISA acknowledgement and resolve CNPS exceptions directly.'],
    independent: ['Confirm the person is a self-employed worker under the Côte d’Ivoire RSTI scope.', 'Use the current RSTI legal and enrolment guidance.', 'Do not apply salaried-worker shares, ceilings, or employer workflows.', 'Enrol, declare income, and pay only through the official independent-worker route.']
  });

  function validDate(value, label) {
    var raw = String(value || '');
    var parsed = new Date(raw + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(parsed.getTime())) throw new Error(label + ' must be a valid date.');
    return parsed;
  }
  function calculate(input) {
    input = input || {};
    var agency = String(input.agency || '');
    if (!['ci-cnps','other-agency'].includes(agency)) throw new Error('Choose the country and social-security agency.');
    var task = String(input.task || '');
    if (!TASKS[task]) throw new Error('Choose a supported CNPS task.');
    var actor = String(input.actor || '');
    if (!['employer','worker','independent','adviser','unsure'].includes(actor)) throw new Error('Choose the person or organisation preparing the task.');
    var workerBand = String(input.workerBand || 'not-applicable');
    if (!['not-applicable','under-20','20-plus','unknown'].includes(workerBand)) throw new Error('Choose the employer worker-count band.');
    if (input.privacyConfirmed !== true) throw new Error('Confirm that no identity, payroll, account, password, contribution-call, or payment data was entered here.');
    if (input.officialSubmissionConfirmed !== true) throw new Error('Confirm that documents, declarations, and payments will be sent only to CNPS.');
    if (input.receiptPlanConfirmed !== true) throw new Error('Confirm that official acknowledgements will be stored safely.');
    var asOf = validDate(input.asOfDate, 'Plan date');
    var checked = validDate(SOURCE_CHECKED_DATE, 'Source checked date');
    var sourceAgeDays = Math.floor((asOf.getTime() - checked.getTime()) / 86400000);
    if (sourceAgeDays < 0) throw new Error('Plan date cannot be before the source review date.');
    var stale = sourceAgeDays > MAX_SOURCE_AGE_DAYS;
    if (stale && input.currentSourceConfirmed !== true) throw new Error('The reviewed CNPS source pack is older than 90 days. Recheck the official pages before continuing.');
    var stopReasons = [];
    if (agency !== 'ci-cnps') stopReasons.push('This guide covers only CNPS Côte d’Ivoire. Confirm the correct country and agency before continuing.');
    if (task === 'remit' && (workerBand === 'unknown' || workerBand === 'not-applicable')) stopReasons.push('The employer worker-count band is unresolved, so the monthly or quarterly schedule cannot be selected safely.');
    if ((task === 'branches' || task === 'ceilings' || task === 'remit') && input.riskRateConfirmed !== true) stopReasons.push('The employer’s sector-assigned work-accident rate has not been confirmed with CNPS.');
    if (task === 'independent' && actor !== 'independent') stopReasons.push('The independent-worker route must not be applied until RSTI status is confirmed.');
    var officialUrl = task === 'employer' || task === 'branches' ? SOURCES.employer : task === 'worker' ? SOURCES.forms : task === 'ceilings' ? SOURCES.ceilingNotice : task === 'remit' ? SOURCES.portal : task === 'disa' ? SOURCES.disa : SOURCES.independent;
    return {
      version: VERSION,
      sourceCheckedDate: SOURCE_CHECKED_DATE,
      sourceAgeDays: sourceAgeDays,
      sourceStatus: stale ? 'user-reconfirmed-after-review-window' : 'reviewed-current',
      inputs: { agency: agency, task: task, actor: actor, workerBand: workerBand, asOfDate: String(input.asOfDate) },
      decision: stopReasons.length ? 'stop-and-confirm' : 'prepare-and-open-official-route',
      stopReasons: stopReasons,
      checklist: TASKS[task].slice(),
      officialUrl: officialUrl,
      schedule: task === 'remit' ? (workerBand === '20-plus' ? 'monthly' : workerBand === 'under-20' ? 'quarterly' : 'unresolved') : 'not-applicable',
      sources: Object.assign({}, SOURCES),
      privacy: 'No identity, payroll, account, password, contribution-call, filing, or payment data is collected or transmitted.'
    };
  }
  return Object.freeze({ VERSION: VERSION, SOURCE_CHECKED_DATE: SOURCE_CHECKED_DATE, MAX_SOURCE_AGE_DAYS: MAX_SOURCE_AGE_DAYS, SOURCES: SOURCES, TASKS: TASKS, calculate: calculate });
});
