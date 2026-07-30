(function initGovernmentParityEngine(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.governmentParityEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createGovernmentParityEngine() {
  'use strict';

  function number(value, minimum, maximum) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) return null;
    if (minimum !== undefined && parsed < minimum) return null;
    if (maximum !== undefined && parsed > maximum) return null;
    return parsed;
  }

  function integer(value, minimum, maximum) {
    var parsed = number(value, minimum, maximum);
    return parsed !== null && Number.isInteger(parsed) ? parsed : null;
  }

  function money(value, currency) {
    var code = /^[A-Z]{3}$/.test(String(currency || '').toUpperCase())
      ? String(currency).toUpperCase()
      : 'XOF';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  var DAY_MS = 24 * 60 * 60 * 1000;

  function ageDays(value, nowValue) {
    var checkedAt = new Date(value);
    var now = new Date(nowValue === undefined ? Date.now() : nowValue);
    if (!Number.isFinite(checkedAt.getTime()) || !Number.isFinite(now.getTime())) return null;
    return (now.getTime() - checkedAt.getTime()) / DAY_MS;
  }

  function evaluateSourceFreshness(state, cadenceDays, nowValue) {
    var cadence = integer(cadenceDays, 1, 365);
    if (!state || cadence === null) {
      return { available: false, mode: 'unavailable', reason: 'missing_evidence', ageDays: null, cadenceDays: cadence };
    }
    var age = ageDays(state.checkedAt, nowValue);
    if (state.status !== 'ok') {
      return { available: false, mode: 'manual', reason: 'status_' + String(state.status || 'missing'), ageDays: age, cadenceDays: cadence };
    }
    if (!Number.isInteger(state.httpStatus) || state.httpStatus < 200 || state.httpStatus >= 400) {
      return { available: false, mode: 'manual', reason: 'http_unverified', ageDays: age, cadenceDays: cadence };
    }
    if (state.changedSinceLastRun !== false || !state.contentHash) {
      return { available: false, mode: 'manual', reason: 'integrity_unverified', ageDays: age, cadenceDays: cadence };
    }
    if (age === null || age < 0) {
      return { available: false, mode: 'manual', reason: 'checked_at_invalid', ageDays: age, cadenceDays: cadence };
    }
    if (age > cadence) {
      return { available: false, mode: 'stale', reason: 'cadence_expired', ageDays: age, cadenceDays: cadence };
    }
    return { available: true, mode: 'fresh_verified', reason: 'evidence_current', ageDays: age, cadenceDays: cadence };
  }

  function evaluateElectionFreshness(record, datasetGeneratedAt, cadenceDays, nowValue) {
    var cadence = integer(cadenceDays, 1, 365);
    var datasetAge = ageDays(datasetGeneratedAt, nowValue);
    var officialDate = record && ['official', 'official-revised'].indexOf(record.dateStatus) !== -1;
    var officialRecord = record && record.sourceStatus === 'official';
    var officialSources = record && Array.isArray(record.sources)
      ? record.sources.filter(function (source) {
        return source && source.type === 'official' && /^https:\/\//i.test(String(source.url || ''));
      })
      : [];
    var sourceAges = officialSources.map(function (source) {
      return ageDays(source.checkedAt, nowValue);
    }).filter(function (age) {
      return age !== null && age >= 0;
    });
    var freshestSourceAge = sourceAges.length ? Math.min.apply(Math, sourceAges) : null;

    if (cadence === null || !officialDate || !officialRecord || !officialSources.length) {
      return {
        available: false,
        mode: 'manual',
        reason: 'authority_unverified',
        datasetAgeDays: datasetAge,
        sourceAgeDays: freshestSourceAge,
        cadenceDays: cadence
      };
    }
    if (datasetAge === null || datasetAge < 0 || freshestSourceAge === null) {
      return {
        available: false,
        mode: 'manual',
        reason: 'dated_evidence_missing',
        datasetAgeDays: datasetAge,
        sourceAgeDays: freshestSourceAge,
        cadenceDays: cadence
      };
    }
    if (datasetAge > cadence || freshestSourceAge > cadence) {
      return {
        available: false,
        mode: 'stale',
        reason: 'cadence_expired',
        datasetAgeDays: datasetAge,
        sourceAgeDays: freshestSourceAge,
        cadenceDays: cadence
      };
    }
    return {
      available: true,
      mode: 'fresh_verified',
      reason: 'dated_official_evidence_current',
      datasetAgeDays: datasetAge,
      sourceAgeDays: freshestSourceAge,
      cadenceDays: cadence
    };
  }

  function calculatePension(input) {
    var monthly = number(input.monthlyContribution, 0);
    var current = number(input.currentBalance, 0);
    var years = integer(input.years, 1, 70);
    var annualRate = number(input.annualRate, 0, 100);
    if ([monthly, current, years, annualRate].some(function (value) { return value === null; })) {
      return { ok: false, code: 'invalid_pension' };
    }
    var monthlyRate = annualRate / 100 / 12;
    var months = years * 12;
    var futureCurrent = monthlyRate === 0 ? current : current * Math.pow(1 + monthlyRate, months);
    var futureContributions = monthlyRate === 0
      ? monthly * months
      : monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    return {
      ok: true,
      currentGrowth: futureCurrent,
      contributionGrowth: futureContributions,
      total: futureCurrent + futureContributions,
      contributed: current + (monthly * months)
    };
  }

  function calculateLand(input) {
    var price = number(input.propertyValue, 0);
    var stampRate = number(input.stampRate, 0, 100);
    var registrationRate = number(input.registrationRate, 0, 100);
    var fixedCosts = number(input.fixedCosts, 0);
    var contingencyRate = number(input.contingencyRate, 0, 100);
    if ([price, stampRate, registrationRate, fixedCosts, contingencyRate].some(function (value) { return value === null; })) {
      return { ok: false, code: 'invalid_land' };
    }
    var stamp = price * stampRate / 100;
    var registration = price * registrationRate / 100;
    var subtotal = stamp + registration + fixedCosts;
    var contingency = subtotal * contingencyRate / 100;
    return {
      ok: true,
      stamp: stamp,
      registration: registration,
      fixedCosts: fixedCosts,
      contingency: contingency,
      total: subtotal + contingency
    };
  }

  function calculateBudget(input) {
    var previous = number(input.previousAmount, 0);
    var current = number(input.currentAmount, 0);
    var population = number(input.population, 1);
    if ([previous, current, population].some(function (value) { return value === null; })) {
      return { ok: false, code: 'invalid_budget' };
    }
    var change = current - previous;
    return {
      ok: true,
      change: change,
      changePercent: previous === 0 ? null : change / previous * 100,
      previousPerPerson: previous / population,
      currentPerPerson: current / population
    };
  }

  function calculatePermit(input) {
    var applicants = integer(input.mainApplicants, 1, 100);
    var dependants = integer(input.dependants, 0, 100);
    var mainFee = number(input.mainFee, 0);
    var dependantFee = number(input.dependantFee, 0);
    var supportingCosts = number(input.supportingCosts, 0);
    var professionalCosts = number(input.professionalCosts, 0);
    var travelCosts = number(input.travelCosts, 0);
    var otherCosts = number(input.otherCosts, 0);
    var contingencyRate = number(input.contingencyRate, 0, 100);
    if ([applicants, dependants, mainFee, dependantFee, supportingCosts, professionalCosts, travelCosts, otherCosts, contingencyRate]
      .some(function (value) { return value === null; })) {
      return { ok: false, code: 'invalid_permit' };
    }
    var mainTotal = applicants * mainFee;
    var dependantTotal = dependants * dependantFee;
    var otherTotal = supportingCosts + professionalCosts + travelCosts + otherCosts;
    var subtotal = mainTotal + dependantTotal + otherTotal;
    var contingency = subtotal * contingencyRate / 100;
    return {
      ok: true,
      mainTotal: mainTotal,
      dependantTotal: dependantTotal,
      otherTotal: otherTotal,
      contingency: contingency,
      total: subtotal + contingency
    };
  }

  function verificationGaps(checks, selectedIds) {
    var selected = new Set(Array.isArray(selectedIds) ? selectedIds : []);
    return (checks || []).filter(function (check) { return !selected.has(check.id); });
  }

  function createFoiDraft(input) {
    var authority = String(input.authority || '').trim();
    var subject = String(input.subject || '').trim();
    var records = String(input.records || '').trim();
    var format = String(input.format || '').trim();
    if (!authority || !subject || !records) return { ok: false, code: 'invalid_foi' };
    var lines = [
      'Objet : demande d’accès à l’information — ' + subject,
      '',
      'À l’attention de ' + authority + ',',
      '',
      'Je demande l’accès aux documents publics suivants :',
      records,
      '',
      format ? 'Format souhaité : ' + format + '.' : 'Merci de préciser les formats de communication disponibles.',
      'Merci de confirmer la procédure, les délais, les frais éventuels, les exemptions invoquées et la voie de recours sur le canal officiel.',
      '',
      'Ce brouillon ne contient volontairement aucune identité ni coordonnée. Ajoutez uniquement les informations exigées après vérification de la procédure officielle.'
    ];
    return { ok: true, text: lines.join('\n') };
  }

  return Object.freeze({
    number: number,
    integer: integer,
    money: money,
    ageDays: ageDays,
    evaluateSourceFreshness: evaluateSourceFreshness,
    evaluateElectionFreshness: evaluateElectionFreshness,
    calculatePension: calculatePension,
    calculateLand: calculateLand,
    calculateBudget: calculateBudget,
    calculatePermit: calculatePermit,
    verificationGaps: verificationGaps,
    createFoiDraft: createFoiDraft
  });
});
