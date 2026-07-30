'use strict';

const CALCULATION_STRATEGY = 'synthetic-calculation';
const REFERENCE_STRATEGY = 'synthetic-reference-state';
const INPUT_STRATEGY = 'synthetic-input-workflow';
const ACCEPTED_STRATEGIES = new Set([
  CALCULATION_STRATEGY,
  REFERENCE_STRATEGY,
  INPUT_STRATEGY
]);

const FORBIDDEN_CONTROL_PATTERN = /\b(?:m['’]?inscrire|s['’]?inscrire|inscription|register|sign\s*up|subscribe|connexion|login|ouvrir\s+l['’]outil|en\s+savoir\s+plus|commander|acheter|contacter|demander\s+un\s+devis|pdf|csv|json|txt|texte|copier|copy|imprimer|print|t[ée]l[ée]charger|download|partager|share|r[ée]initialiser|reset|importer?)\b/i;
const CALCULATION_CONTROL_PATTERN = /(?:\b(?:calculer|estimer|comparer|projeter|v[ée]rifier|valider|r[ée]sumer|analyser|[ée]valuer|simuler|convertir|g[ée]n[ée]rer|reconstituer|organiser|ajouter|cr[ée]er|calculate|estimate|compare|project|check|validate|summarize|analy[sz]e|evaluate|simulate|convert|generate)\b|voir\s+le\s+r[ée]sultat)/i;
const FORBIDDEN_RESULT_SELECTOR_PATTERN = /(?:^|[\s>+~,.#:[\]"'=_-])(?:h1|h2|hero|banner|breadcrumb|nav|footer|header|source|method|m[ée]thod|privacy|confidential|safety|s[ée]curit[ée]|verification|v[ée]rification|disclaimer|limitation|assumption|hypoth[èe]se|cta|signup|subscribe|marketing|description|intro)(?:$|[\s>+~,.#:[\]"'=_-])/i;
const CLASSIFIED_VALUE_PATTERN = /\b(?:admissible|inadmissible|[ée]ligible|non\s+[ée]ligible|valide|invalide|conforme|non\s+conforme|positif|n[ée]gatif|faible|moyen|[ée]lev[ée]|indisponibles?|disponibles?|bloqu[ée]|accept[ée]|refus[ée]|r[ée]ussi|[ée]chec|complet|incomplet|rentable|non\s+rentable|exc[ée]dent|d[ée]ficit|alerte|risque|aucune\s+estimation|sous\s+la\s+plage|dans\s+la\s+plage|au-dessus\s+de\s+la\s+plage)\b/i;

function normalizeText(value) {
  return String(value == null ? '' : value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactText(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function isForbiddenWorkflowControl(label) {
  const normalized = normalizeText(label);
  return !normalized || FORBIDDEN_CONTROL_PATTERN.test(normalized);
}

function isCalculationWorkflowControl(label) {
  const normalized = normalizeText(label);
  return Boolean(
    normalized
    && !isForbiddenWorkflowControl(normalized)
    && CALCULATION_CONTROL_PATTERN.test(normalized)
  );
}

function isForbiddenResultSelector(selector, sourceKind) {
  const signal = `${selector || ''} ${sourceKind || ''}`;
  return !selector || FORBIDDEN_RESULT_SELECTOR_PATTERN.test(signal);
}

function isMeaningfulResultValue(value) {
  const normalized = normalizeText(value);
  if (!normalized || normalized.length > 2000) return false;
  return /\d/.test(normalized) || CLASSIFIED_VALUE_PATTERN.test(normalized);
}

function resultKey(item) {
  return `${item.selector || ''}\u0000${compactText(item.value)}`;
}

function validateWorkflowReceipt(receipt, options = {}) {
  const errors = [];
  const fixture = receipt && receipt.fixture ? receipt.fixture : receipt;
  const englishRoute = normalizeText(options.englishRoute || receipt && receipt.englishRoute);
  const strategy = fixture && fixture.strategy;
  if (!fixture || !ACCEPTED_STRATEGIES.has(strategy)) {
    return { passed: false, errors: ['missing accepted workflow strategy'] };
  }

  const beforeResults = Array.isArray(fixture.beforeResults) ? fixture.beforeResults : [];
  const afterResults = Array.isArray(fixture.afterResults) ? fixture.afterResults : [];
  const expectedResults = Array.isArray(fixture.expectedResults) ? fixture.expectedResults : [];
  const changedSelectors = fixture.resultMutation && Array.isArray(fixture.resultMutation.changedSelectors)
    ? fixture.resultMutation.changedSelectors
    : [];
  const beforeKeys = new Set(beforeResults.map(resultKey));
  const staticValues = new Set(beforeResults.map((item) => compactText(item.value)).filter(Boolean));
  const pageTitle = compactText(fixture.pageTitle);
  const pageHeading = compactText(fixture.pageHeading);

  if (!Array.isArray(fixture.inputs) || fixture.inputs.length === 0) errors.push('missing fixture inputs');
  if (!beforeResults.length && !fixture.resultMutation?.baselineCaptured) errors.push('missing before-result snapshot');
  if (!afterResults.length) errors.push('missing after-result snapshot');
  if (!fixture.resultMutation || fixture.resultMutation.passed !== true || changedSelectors.length === 0) {
    errors.push('missing input-dependent result-region mutation');
  }
  if (!expectedResults.length) errors.push('missing expected result fields/values');

  for (const item of expectedResults) {
    if (!item || isForbiddenResultSelector(item.selector, item.sourceKind)) {
      errors.push(`forbidden result selector: ${item && item.selector || 'missing'}`);
      continue;
    }
    const value = compactText(item.value);
    if (!value || !isMeaningfulResultValue(item.value)) {
      errors.push(`non-meaningful result value at ${item.selector}`);
      continue;
    }
    if (value === pageTitle || value === pageHeading) {
      errors.push(`page title or heading used as result at ${item.selector}`);
    }
    if (staticValues.has(value) || beforeKeys.has(resultKey(item))) {
      errors.push(`static pre-interaction copy used as result at ${item.selector}`);
    }
    if (!changedSelectors.includes(item.selector)) {
      errors.push(`result selector did not mutate: ${item.selector}`);
    }
  }

  if (strategy === CALCULATION_STRATEGY) {
    if (isForbiddenWorkflowControl(fixture.workflowControl)) {
      errors.push('missing or forbidden calculation workflow control');
    } else if (!isCalculationWorkflowControl(fixture.workflowControl)) {
      errors.push(`non-calculation workflow control: ${fixture.workflowControl}`);
    }
    if (!fixture.workflowControlSelector) errors.push('missing calculation control selector');
    if (!fixture.workflowOwnerSelector) errors.push('missing calculator owner selector');
    if (fixture.workflowControlOwnedByCalculator !== true) {
      errors.push('calculation control is not owned by the calculator form/region');
    }
    if (fixture.interactionType !== 'click') errors.push('calculation workflow did not use a click action');
  } else {
    if (/paye|salary[\s/-]*tax/i.test(englishRoute)) {
      errors.push('PAYE calculator cannot be reference/input-only');
    }
    if (!/^(?:input|change|selection|query-filter)$/.test(fixture.interactionType || '')) {
      errors.push(`${strategy} requires an input, selection, or query/filter interaction`);
    }
    if (!fixture.interactionSelector) errors.push(`${strategy} requires an explicit interaction selector`);
  }

  return {
    passed: errors.length === 0,
    errors: [...new Set(errors)]
  };
}

module.exports = {
  ACCEPTED_STRATEGIES,
  CALCULATION_STRATEGY,
  REFERENCE_STRATEGY,
  INPUT_STRATEGY,
  normalizeText,
  compactText,
  isForbiddenWorkflowControl,
  isCalculationWorkflowControl,
  isForbiddenResultSelector,
  isMeaningfulResultValue,
  validateWorkflowReceipt
};
