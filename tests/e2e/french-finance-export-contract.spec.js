const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { test, expect } = require('@playwright/test');
const {
  CALCULATION_STRATEGY,
  REFERENCE_STRATEGY,
  INPUT_STRATEGY,
  isCalculationWorkflowControl,
  isForbiddenWorkflowControl,
  isMeaningfulResultValue,
  validateWorkflowReceipt
} = require('../../scripts/lib/french-finance-workflow-contract');

const ROOT = path.resolve(__dirname, '../..');
const FINANCE_PORT = Number(process.env.FRENCH_FINANCE_PLAYWRIGHT_PORT || 42973);
const FINANCE_BASE_URL = `http://127.0.0.1:${FINANCE_PORT}`;
const EXPECTED_SERVER_IDENTITY = {
  workspaceRoot: ROOT,
  baselineCommit: '8ce5cac175e42201968b1f7540752d6acf92d4ca',
  sentinel: 'ccf6-fr-finance-result-mutation-v2',
  port: FINANCE_PORT
};
const manifest = require('../../data/registry/french-finance-tax-market-data.json');
const PART_DIR = path.join(ROOT, 'artifacts', 'french-finance-export-contract-parts');
const CHUNK_SIZE = 6;
const RUN_ID = process.env.FRENCH_FINANCE_EXPORT_RUN_ID || new Date().toISOString();
const REQUESTED_PARTS = new Set(
  String(process.env.FRENCH_FINANCE_EXPORT_PARTS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number)
    .filter(Number.isFinite)
);
const DOWNLOAD_FORMATS = new Set(['txt', 'csv', 'json', 'pdf', 'ics', 'svg', 'png', 'jpeg']);

function normalizeText(value) {
  return String(value == null ? '' : value)
    .replace(/â‚¦|₦/g, 'NGN')
    .replace(/Â/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactOracleText(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function witness(items) {
  const candidates = (items || []).filter((item) => String(item.value || '').trim());
  const preferred = candidates.find((item) => /\d/.test(item.value) && String(item.value).length >= 2);
  return preferred || candidates[0] || null;
}

function syntheticValue(input, rowIndex) {
  const signal = `${input.name || ''} ${input.id || ''} ${input.label || ''} ${input.placeholder || ''}`.toLowerCase();
  const seed = 100 + (rowIndex * 7);
  if (input.type === 'email' || input.type === 'file' || input.type === 'password' || input.type === 'hidden') return null;
  if (input.type === 'date') {
    if (/(?:start|debut|début)/.test(signal) && input.maxValue) {
      const date = new Date(`${input.maxValue}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() - 30);
      const candidate = date.toISOString().slice(0, 10);
      return input.minValue && candidate < input.minValue ? input.minValue : candidate;
    }
    if (input.maxValue) return input.maxValue;
    if (/(?:start|debut|début|acquisition)/.test(signal)) return '2026-01-01';
    return '2026-07-28';
  }
  if (input.type === 'datetime-local') {
    if (/(?:expir|expiry)/.test(signal)) return '2026-07-29T12:00';
    return '2026-07-28T12:00';
  }
  if (input.type === 'month') return '2026-07';
  if (input.type === 'url') return 'https://example.test/scenario-' + String(rowIndex + 1);
  if (input.type === 'tel') return '+221700000' + String(rowIndex + 1).padStart(3, '0');
  if (input.tag === 'textarea') return `Scénario financier synthétique ${String(rowIndex + 1).padStart(3, '0')}`;
  const numericControl = input.type === 'number' || input.type === 'range'
    || input.inputMode === 'decimal' || input.inputMode === 'numeric';
  if (!numericControl && (input.type === 'text' || input.type === 'search')) {
    if (/currency|devise|code devise/.test(signal)) return 'USD';
    if (/jurisdiction|juridiction|country|pays/.test(signal)) return 'Kenya';
    if (/source/.test(signal)) return 'Source officielle synthétique vérifiée le 1 juillet 2026';
    if (/period|période|periode|tax year|année fiscale|annee fiscale/.test(signal)) return '2026';
    if (/asset|actif|symbol|symbole/.test(signal)) return 'BTC';
    if (/address|contract|wallet|adresse|portefeuille/.test(signal)) {
      return `0x${String(rowIndex + 1).padStart(40, '0')}`;
    }
    if (/name|nom|title|titre/.test(signal)) return `Cas synthétique ${String(rowIndex + 1).padStart(3, '0')}`;
    return `TEST${String(rowIndex + 1).padStart(3, '0')}`;
  }
  if (!numericControl) return null;
  let value = /buyfeevalue|sellfeevalue/.test(signal) ? 1
    : /(?:refund|remboursement|rejet|paye|income tax|imp[oô]t sur le revenu|loan deduction|avance)/.test(signal) ? 1000
      : /bas comparable|low comparable|range low/.test(signal) ? 10
        : /m[ée]diane comparable|median comparable|range median/.test(signal) ? 15
          : /haut comparable|high comparable|range high/.test(signal) ? 20
            : /pip/.test(signal) ? 0.0001
    : /unit[eé]s? de rapport|report units?/.test(signal) ? 1
      : /exposition|exposure/.test(signal) ? 10000
        : /rate|taux|percent|pourcent|rendement/.test(signal) ? 5 + ((rowIndex % 7) / 10)
    : /year|ann[ée]e|term|dur[ée]e|period|mois/.test(signal) ? 10
      : /age/.test(signal) ? 35
        : /hour|heure|jour|day|quantit|quantity|nombre|count/.test(signal) ? 8
          : /fee|frais|co[uû]t|cost|charge|deduct|retenue|withhold|tax paid|imp[oô]t pay|am[eé]lioration|improvement|vacance|vacancy|autre frais|other fee/.test(signal)
            ? 1000 + (rowIndex * 10)
            : /sale|vente|cession|exit|sortie|proceeds|produit|credit|cr[eé]dit|received|recu|reçu/.test(signal)
              ? 650000 + (rowIndex * 1000)
              : /salary|salaire|gross|brut|amount|montant|income|revenu|revenue|recette|price|prix|capital|balance|solde|payment|paiement|loan|pr[eê]t|valeur|value|debit|d[eé]bit/.test(signal)
                ? 500000 + (rowIndex * 1000)
        : seed;
  if (Number.isFinite(input.min)) value = Math.max(value, input.min);
  if (Number.isFinite(input.max)) value = Math.min(value, input.max);
  if (Number.isFinite(input.step) && input.step >= 1) value = Math.round(value / input.step) * input.step;
  if (value === 0 && Number.isFinite(input.step) && input.step > 0
    && (!Number.isFinite(input.max) || input.max > 0)) {
    value = Number.isFinite(input.max) ? Math.min(input.step, input.max) : input.step;
  }
  if (Number.isFinite(input.min)) value = Math.max(value, input.min);
  if (Number.isFinite(input.max)) value = Math.min(value, input.max);
  return String(value);
}

function chooseSelectOption(meta) {
  var signal = `${meta.name || ''} ${meta.id || ''} ${meta.label || ''}`.toLowerCase();
  var preferredPattern = /qualification|traitement fiscal/.test(signal)
    ? /capital.*confirm|confirm.*capital/
    : /contribuable|taxpayer/.test(signal)
      ? /particulier|individual/
      : /exon[eé]ration|exemption|treatment|traitement/.test(signal)
        ? /standard|aucun|none|bar[eè]me/
        : null;
  if (preferredPattern) {
    var preferred = meta.options.find(function (option) {
      return preferredPattern.test(`${option.value} ${option.label}`.toLowerCase());
    });
    if (preferred) return preferred;
  }
  return meta.options[0];
}

async function captureResultRegions(page) {
  return page.evaluate(() => {
    const clean = (value) => String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    const escape = (value) => (window.CSS && CSS.escape
      ? CSS.escape(value)
      : String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&'));
    const selectorFor = (element) => {
      if (element.id && document.querySelectorAll(`#${escape(element.id)}`).length === 1) {
        return `#${escape(element.id)}`;
      }
      for (const attribute of ['data-result', 'data-results', 'data-output', 'data-result-rows', 'data-status']) {
        if (!element.hasAttribute(attribute)) continue;
        const value = element.getAttribute(attribute);
        const selector = value ? `[${attribute}="${escape(value)}"]` : `[${attribute}]`;
        if (document.querySelectorAll(selector).length === 1) return selector;
      }
      const parts = [];
      let current = element;
      while (current && current !== document.body && parts.length < 6) {
        let part = current.tagName.toLowerCase();
        const stable = Array.from(current.classList).find((name) => (
          /(?:result|output|summary|status|total|score)/i.test(name)
        ));
        if (stable) part += `.${escape(stable)}`;
        const siblings = current.parentElement
          ? Array.from(current.parentElement.children).filter((item) => item.tagName === current.tagName)
          : [];
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        parts.unshift(part);
        const selector = parts.join(' > ');
        if (document.querySelectorAll(selector).length === 1) return selector;
        current = current.parentElement;
      }
      return parts.join(' > ');
    };
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && !element.hidden
        && rect.width > 0 && rect.height > 0;
    };
    const forbidden = (element) => Boolean(element.closest([
      'nav', 'footer', 'header', 'afro-navbar', 'afro-footer',
      '.fr-finance-export-contract', '#fr-finance-print-contract',
      '[role="dialog"]', 'dialog',
      '[class*="hero"]', '[class*="banner"]', '[class*="breadcrumb"]',
      '[class*="source"]', '[class*="method"]', '[class*="verification"]',
      '[class*="privacy"]', '[class*="safety"]', '[class*="disclaimer"]',
      '[class*="limitation"]', '[class*="assumption"]', '[class*="cta"]',
      '[class*="signup"]', '[class*="subscribe"]', '[data-tool-verification-panel]'
    ].join(',')));
    const sourceKind = (element) => {
      if (element.tagName === 'OUTPUT') return 'output';
      if (element.hasAttribute('data-result') || element.hasAttribute('data-results')
        || element.hasAttribute('data-result-rows')) return 'data-result';
      if (element.hasAttribute('data-output')) return 'data-output';
      if (element.getAttribute('role') === 'status') return 'status';
      if (element.getAttribute('role') === 'alert') return 'alert';
      if (/result/i.test(element.id)) return 'id-result';
      if (/result/i.test(element.className)) return 'class-result';
      if (/summary/i.test(`${element.id} ${element.className}`)) return 'summary';
      return 'explicit-output';
    };
    const resultSelector = [
      'output', '[data-result]', '[data-results]', '[data-output]', '[data-result-rows]',
      '[role="status"]', '[role="alert"]',
      '[id*="result" i]', '[class*="result" i]',
      '[id*="summary" i]', '[class*="summary" i]',
      '[id*="output" i]', '[class*="output" i]'
    ].join(',');
    const seen = new Set();
    return Array.from(document.querySelectorAll(resultSelector)).map((element) => {
      if (/^H[1-6]$/.test(element.tagName) || forbidden(element)) return null;
      const selector = selectorFor(element);
      if (!selector || seen.has(selector)) return null;
      seen.add(selector);
      const text = clean(element.textContent);
      const items = [];
      element.querySelectorAll('dt').forEach((term) => {
        const definition = term.nextElementSibling;
        if (definition && definition.tagName === 'DD') {
          items.push({ label: clean(term.textContent), value: clean(definition.textContent) });
        }
      });
      element.querySelectorAll('tr').forEach((row) => {
        const cells = Array.from(row.querySelectorAll(':scope > th,:scope > td'));
        if (cells.length > 1) {
          items.push({
            label: clean(cells[0].textContent),
            value: clean(cells.slice(1).map((cell) => cell.textContent).join(' | '))
          });
        }
      });
      element.querySelectorAll([
        '[data-result-row]', '[data-value]', '[class*="amount" i]', '[id*="amount" i]',
        '[class*="value" i]', '[id*="value" i]', '[class*="total" i]', '[id*="total" i]',
        '[class*="net" i]', '[id*="net" i]', '[class*="tax" i]', '[id*="tax" i]',
        '[class*="balance" i]', '[id*="balance" i]', '[class*="score" i]', '[id*="score" i]',
        '[data-position]', '[data-indicator]', '[data-range]', '[data-difference]'
      ].join(',')).forEach((node) => {
        if (forbidden(node) || node.children.length > 3) return;
        const value = clean(node.textContent);
        const labelNode = node.previousElementSibling;
        items.push({
          label: clean(node.getAttribute('aria-label') || labelNode && labelNode.textContent || 'Résultat'),
          value
        });
      });
      if (!items.length && text.length <= 1200) {
        items.push({
          label: clean(element.getAttribute('aria-label') || element.querySelector('h3,h4')?.textContent || 'Résultat'),
          value: text
        });
      }
      return {
        selector,
        sourceKind: sourceKind(element),
        visible: visible(element),
        text,
        items
      };
    }).filter(Boolean);
  });
}

function diffResultRegions(before, after, pageTitle, pageHeading) {
  const beforeBySelector = new Map(before.map((item) => [item.selector, item]));
  const changedSelectors = [];
  const expectedResults = [];
  const seen = new Set();
  for (const region of after) {
    if (!region.visible) continue;
    const previous = beforeBySelector.get(region.selector);
    const changed = !previous || !previous.visible
      || compactOracleText(previous.text) !== compactOracleText(region.text);
    if (!changed) continue;
    changedSelectors.push(region.selector);
    const previousText = compactOracleText(previous && previous.text);
    for (const item of region.items || []) {
      const value = normalizeText(item.value);
      const compact = compactOracleText(value);
      if (!compact || !isMeaningfulResultValue(value)) continue;
      if (compact === compactOracleText(pageTitle) || compact === compactOracleText(pageHeading)) continue;
      if (previousText && previousText.includes(compact)) continue;
      const key = `${region.selector}\u0000${compact}`;
      if (seen.has(key)) continue;
      seen.add(key);
      expectedResults.push({
        selector: region.selector,
        sourceKind: region.sourceKind,
        label: normalizeText(item.label) || 'Résultat',
        value
      });
    }
  }
  return {
    baselineCaptured: true,
    changedSelectors: [...new Set(changedSelectors)],
    passed: changedSelectors.length > 0 && expectedResults.length > 0,
    expectedResults
  };
}

async function selectorForLocator(locator) {
  return locator.evaluate((element) => {
    const escape = (value) => (window.CSS && CSS.escape
      ? CSS.escape(value)
      : String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&'));
    if (element.id && document.querySelectorAll(`#${escape(element.id)}`).length === 1) {
      return `#${escape(element.id)}`;
    }
    for (const attribute of ['data-calculate', 'data-action', 'data-fr-action-copy', 'name']) {
      if (!element.hasAttribute(attribute)) continue;
      const value = element.getAttribute(attribute);
      const selector = value ? `[${attribute}="${escape(value)}"]` : `[${attribute}]`;
      if (document.querySelectorAll(selector).length === 1) return selector;
    }
    const parts = [];
    let current = element;
    while (current && current !== document.body && parts.length < 7) {
      let part = current.tagName.toLowerCase();
      const stableClass = Array.from(current.classList).find((name) => (
        !/^(?:active|on|open|visible|show)$/i.test(name)
      ));
      if (stableClass) part += `.${escape(stableClass)}`;
      const siblings = current.parentElement
        ? Array.from(current.parentElement.children).filter((item) => item.tagName === current.tagName)
        : [];
      if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      parts.unshift(part);
      const selector = parts.join(' > ');
      if (document.querySelectorAll(selector).length === 1) return selector;
      current = current.parentElement;
    }
    return parts.join(' > ');
  });
}

async function findCalculationControl(page, scopeSelector) {
  const controls = page.locator(
    `${scopeSelector} button,${scopeSelector} input[type="submit"],${scopeSelector} input[type="button"]`
  );
  const count = await controls.count();
  const priorities = await controls.evaluateAll((elements) => elements.map((element, index) => {
    const type = String(element.getAttribute('type') || (element.tagName === 'BUTTON' ? 'submit' : '')).toLowerCase();
    return { index, submit: type === 'submit' };
  }));
  const orderedIndexes = priorities
    .sort((left, right) => Number(right.submit) - Number(left.submit) || left.index - right.index)
    .map((item) => item.index);
  for (const index of orderedIndexes) {
    const control = controls.nth(index);
    if (!await control.isVisible().catch(() => false) || !await control.isEnabled().catch(() => false)) continue;
    const label = await control.evaluate((element) => (
      element.getAttribute('aria-label') || element.value || element.textContent || ''
    ).replace(/\s+/g, ' ').trim()).catch(() => '');
    if (!isCalculationWorkflowControl(label) || isForbiddenWorkflowControl(label)) continue;
    const ownership = await control.evaluate((element) => {
      const visibleEditable = (root) => Array.from(root.querySelectorAll('input,select,textarea')).some((input) => {
        const type = String(input.type || '').toLowerCase();
        const style = getComputedStyle(input);
        const rect = input.getBoundingClientRect();
        return !input.disabled && !/^(?:hidden|email|password|file)$/.test(type)
          && style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      });
      let owner = element.closest('form');
      if (!owner || !visibleEditable(owner)) {
        owner = element.parentElement;
        while (owner && owner !== document.body && !visibleEditable(owner)) owner = owner.parentElement;
      }
      if (!owner || owner === document.body
        || owner.closest('[class*="signup"],[class*="subscribe"],[data-tool-verification-panel]')) {
        return { owned: false };
      }
      if (!owner.id) owner.dataset.frFinanceWorkflowOwner = 'true';
      return {
        owned: true,
        ownerSelector: owner.id
          ? `#${CSS.escape(owner.id)}`
          : '[data-fr-finance-workflow-owner="true"]'
      };
    });
    if (!ownership.owned) continue;
    return {
      locator: control,
      label,
      selector: await selectorForLocator(control),
      ownerSelector: ownership.ownerSelector
    };
  }
  return null;
}

async function fillOwnedControlsSilently(page, ownerSelector, rowIndex) {
  const controls = page.locator(`${ownerSelector} input,${ownerSelector} select,${ownerSelector} textarea`);
  const inputMeta = await controls.evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      tag: element.tagName.toLowerCase(),
      type: (element.getAttribute('type') || (element.tagName === 'INPUT' ? 'text' : element.tagName)).toLowerCase(),
      id: element.id,
      name: element.getAttribute('name') || '',
      label: element.labels && element.labels[0] ? element.labels[0].textContent.trim() : '',
      placeholder: element.getAttribute('placeholder') || '',
      inputMode: element.getAttribute('inputmode') || '',
      min: element.min === '' ? null : Number(element.min),
      max: element.max === '' ? null : Number(element.max),
      minValue: element.min || '',
      maxValue: element.max || '',
      step: element.step === '' || element.step === 'any' ? null : Number(element.step),
      visible: style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0,
      disabled: element.disabled,
      options: element.tagName === 'SELECT'
        ? Array.from(element.options).filter((option) => !option.disabled && option.value).map((option) => ({
          value: option.value,
          label: option.textContent.trim()
        }))
        : []
    };
  }));
  const attempted = [];
  const handledRadioGroups = new Set();
  for (let index = 0; index < inputMeta.length; index += 1) {
    const meta = inputMeta[index];
    if (!meta.visible || meta.disabled || /^(?:email|password|file|hidden)$/.test(meta.type)) continue;
    const locator = controls.nth(index);
    let value;
    let displayValue;
    if (meta.tag === 'select') {
      const option = chooseSelectOption(meta);
      if (!option) continue;
      value = option.value;
      displayValue = option.label;
    } else if (meta.type === 'radio') {
      const radioGroup = meta.name || `radio-${index}`;
      if (handledRadioGroups.has(radioGroup)) continue;
      handledRadioGroups.add(radioGroup);
      value = true;
      displayValue = normalizeText(meta.label || meta.name || 'Option sélectionnée');
    } else if (meta.type === 'checkbox') {
      const confirmation = /(?:confirm|confirme|v[eé]rifi|comprends|atteste|accepte|same|m[eê]me|scenario|sc[eé]nario)/i.test(
        `${meta.label} ${meta.name} ${meta.id}`
      );
      value = confirmation;
      displayValue = confirmation ? 'Oui' : 'Non';
    } else {
      value = syntheticValue(meta, rowIndex);
      displayValue = value;
      if (value == null) continue;
    }
    await locator.evaluate((element, nextValue) => {
      if (element.type === 'checkbox' || element.type === 'radio') {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'checked').set.call(
          element,
          Boolean(nextValue)
        );
        return;
      }
      const prototype = element.tagName === 'SELECT'
        ? HTMLSelectElement.prototype
        : element.tagName === 'TEXTAREA'
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, String(nextValue));
    }, value);
    attempted.push({
      selector: await selectorForLocator(locator),
      label: normalizeText(meta.label || meta.name || meta.id || 'Valeur'),
      value: normalizeText(displayValue)
    });
  }
  return attempted;
}

async function recaptureAttemptedInputs(page, attemptedInputs) {
  return page.evaluate((items) => {
    const clean = (value) => String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
    return items.map((item) => {
      const element = document.querySelector(item.selector);
      if (!element || !element.isConnected) return null;
      let value;
      if (element.tagName === 'SELECT') {
        value = element.options[element.selectedIndex]
          ? element.options[element.selectedIndex].textContent
          : element.value;
      } else if (element.type === 'checkbox' || element.type === 'radio') {
        value = element.checked ? 'Oui' : 'Non';
      } else {
        value = element.value;
      }
      return {
        selector: item.selector,
        label: clean(item.label),
        value: clean(value)
      };
    }).filter((item) => item && item.value);
  }, attemptedInputs);
}

async function runInputMutationWorkflow(page, scopeSelector, rowIndex, before, pageTitle, pageHeading, row) {
  const controls = page.locator(`${scopeSelector} input,${scopeSelector} select,${scopeSelector} textarea`);
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    const meta = await control.evaluate((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName.toLowerCase(),
        type: (element.getAttribute('type') || (element.tagName === 'INPUT' ? 'text' : element.tagName)).toLowerCase(),
        id: element.id,
        name: element.getAttribute('name') || '',
        label: element.labels && element.labels[0] ? element.labels[0].textContent.trim() : '',
        placeholder: element.getAttribute('placeholder') || '',
        inputMode: element.getAttribute('inputmode') || '',
        min: element.min === '' ? null : Number(element.min),
        max: element.max === '' ? null : Number(element.max),
        step: element.step === '' || element.step === 'any' ? null : Number(element.step),
        visible: style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0,
        disabled: element.disabled,
        forbiddenOwner: Boolean(element.closest(
          'nav,footer,header,[role="dialog"],dialog,.fr-finance-export-contract,[class*="signup"],[class*="subscribe"],[data-tool-verification-panel]'
        )),
        options: element.tagName === 'SELECT'
          ? Array.from(element.options).filter((option) => !option.disabled && option.value).map((option) => ({
            value: option.value,
            label: option.textContent.trim()
          }))
          : []
      };
    });
    if (!meta.visible || meta.disabled || meta.forbiddenOwner
      || /^(?:email|password|file|hidden)$/.test(meta.type)) continue;
    let value;
    let displayValue;
    let interactionType = 'input';
    if (meta.tag === 'select') {
      const option = meta.options[Math.min(1, meta.options.length - 1)];
      if (!option) continue;
      value = option.value;
      displayValue = option.label;
      interactionType = 'selection';
      await control.selectOption(value).catch(() => {});
    } else if (meta.type === 'checkbox' || meta.type === 'radio') {
      displayValue = 'Oui';
      interactionType = 'change';
      await control.check().catch(() => {});
    } else {
      value = syntheticValue(meta, rowIndex);
      displayValue = value;
      if (value == null) continue;
      await control.fill(value).catch(() => {});
    }
    let after = await captureResultRegions(page);
    let mutation = diffResultRegions(before, after, pageTitle, pageHeading);
    if (!mutation.passed) {
      await expect.poll(async () => {
        after = await captureResultRegions(page);
        mutation = diffResultRegions(before, after, pageTitle, pageHeading);
        return mutation.passed;
      }, { timeout: 1500 }).toBe(true).catch(() => {});
    }
    if (!mutation.passed) continue;
    const currentInputs = await recaptureAttemptedInputs(page, [{
      selector: await selectorForLocator(control),
      label: normalizeText(meta.label || meta.name || meta.id || 'Valeur'),
      value: normalizeText(displayValue)
    }]);
    const referenceLike = /(?:reference|rates?|prices?|minimum-wage|salary-intelligence|quiz|guide|directory|afrotaux)/i.test(
      `${row.englishRoute} ${row.englishId}`
    );
    return {
      strategy: referenceLike ? REFERENCE_STRATEGY : INPUT_STRATEGY,
      attemptedInputs: currentInputs,
      activatedControl: null,
      workflowControlSelector: null,
      workflowOwnerSelector: null,
      workflowControlOwnedByCalculator: false,
      interactionType,
      interactionSelector: await selectorForLocator(control),
      beforeResults: before,
      afterResults: after,
      resultMutation: mutation,
      expectedResults: mutation.expectedResults
    };
  }
  return null;
}

async function runQuizWorkflow(page, before, pageTitle, pageHeading) {
  const setControl = page.locator('[data-quiz-set]').first();
  if (!await setControl.count()) return null;
  const setSelector = await selectorForLocator(setControl);
  const setLabel = normalizeText(await setControl.innerText());
  await setControl.evaluate((element) => element.click());
  let finalControlLabel = '';
  let finalControlSelector = '';
  for (let index = 0; index < 6; index += 1) {
    const answer = page.locator('#quizOptions .quiz-option').first();
    await expect(answer).toBeVisible();
    await answer.evaluate((element) => element.click());
    const next = page.locator('#nextQuestion');
    await expect(next).toBeEnabled();
    if (index === 5) {
      finalControlLabel = normalizeText(await next.innerText());
      finalControlSelector = await selectorForLocator(next);
    }
    await next.evaluate((element) => element.click());
  }
  await page.waitForTimeout(100);
  const after = await captureResultRegions(page);
  const mutation = diffResultRegions(before, after, pageTitle, pageHeading);
  return {
    strategy: CALCULATION_STRATEGY,
    attemptedInputs: [{
      selector: setSelector,
      label: 'Questionnaire sélectionné',
      value: setLabel
    }],
    activatedControl: finalControlLabel,
    workflowControlSelector: finalControlSelector,
    workflowOwnerSelector: '#quizStage',
    workflowControlOwnedByCalculator: true,
    interactionType: 'click',
    interactionSelector: finalControlSelector,
    beforeResults: before,
    afterResults: after,
    resultMutation: mutation,
    expectedResults: mutation.expectedResults,
    pageTitle,
    pageHeading
  };
}

async function fillSyntheticWorkflow(page, rowIndex, row) {
  const scopeSelector = await page.locator('main').count() ? 'main' : 'body';
  const pageTitle = await page.title();
  const pageHeading = normalizeText(await page.locator('h1').first().innerText().catch(() => ''));
  const before = await captureResultRegions(page);
  if (row.englishId === 'crypto-quiz') {
    const quizWorkflow = await runQuizWorkflow(page, before, pageTitle, pageHeading);
    if (quizWorkflow) return quizWorkflow;
  }
  const calculation = await findCalculationControl(page, scopeSelector);
  if (calculation) {
    const attemptedInputs = await fillOwnedControlsSilently(page, calculation.ownerSelector, rowIndex);
    if (process.env.FRENCH_FINANCE_EXPORT_DEBUG) {
      const validity = await page.evaluate((ownerSelector) => {
        const owner = document.querySelector(ownerSelector);
        const form = owner && (owner.matches('form') ? owner : owner.querySelector('form'));
        if (!form) return { form: null, invalid: [] };
        return {
          form: form.checkValidity(),
          invalid: Array.from(form.querySelectorAll(':invalid')).map((element) => ({
            id: element.id,
            name: element.name,
            type: element.type,
            value: element.value,
            min: element.min,
            max: element.max,
            validationMessage: element.validationMessage
          }))
        };
      }, calculation.ownerSelector);
      console.log(`[export-proof-validity] ${row.frenchRoute} ${JSON.stringify(validity)}`);
    }
    await calculation.locator.evaluate((element) => element.click());
    await page.waitForTimeout(450);
    let after = await captureResultRegions(page);
    let mutation = diffResultRegions(before, after, pageTitle, pageHeading);
    if (!mutation.passed) {
      const requestSubmitted = await calculation.locator.evaluate((element) => {
        if (!element.form || typeof element.form.requestSubmit !== 'function') return false;
        element.form.requestSubmit(element);
        return true;
      }).catch(() => false);
      if (requestSubmitted) {
        await page.waitForTimeout(900);
        after = await captureResultRegions(page);
        mutation = diffResultRegions(before, after, pageTitle, pageHeading);
      }
    }
    if (!mutation.passed) {
      await expect.poll(async () => {
        after = await captureResultRegions(page);
        mutation = diffResultRegions(before, after, pageTitle, pageHeading);
        return mutation.passed;
      }, { timeout: 3500 }).toBe(true).catch(() => {});
    }
    const currentInputs = await recaptureAttemptedInputs(page, attemptedInputs);
    return {
      strategy: CALCULATION_STRATEGY,
      attemptedInputs: currentInputs,
      activatedControl: calculation.label,
      workflowControlSelector: calculation.selector,
      workflowOwnerSelector: calculation.ownerSelector,
      workflowControlOwnedByCalculator: true,
      interactionType: 'click',
      interactionSelector: calculation.selector,
      beforeResults: before,
      afterResults: after,
      resultMutation: mutation,
      expectedResults: mutation.expectedResults,
      pageTitle,
      pageHeading
    };
  }
  const inputWorkflow = await runInputMutationWorkflow(
    page,
    scopeSelector,
    rowIndex,
    before,
    pageTitle,
    pageHeading,
    row
  );
  return inputWorkflow
    ? { ...inputWorkflow, pageTitle, pageHeading }
    : {
      strategy: /(?:reference|rates?|prices?|minimum-wage|quiz|guide|directory|afrotaux)/i.test(
        `${row.englishRoute} ${row.englishId}`
      ) ? REFERENCE_STRATEGY : INPUT_STRATEGY,
      attemptedInputs: [],
      activatedControl: null,
      workflowControlSelector: null,
      workflowOwnerSelector: null,
      workflowControlOwnedByCalculator: false,
      interactionType: null,
      interactionSelector: null,
      beforeResults: before,
      afterResults: await captureResultRegions(page),
      resultMutation: {
        baselineCaptured: true,
        changedSelectors: [],
        passed: false,
        expectedResults: []
      },
      expectedResults: [],
      pageTitle,
      pageHeading
    };
}

function parseDelimitedCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === ';' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((character === '\r' || character === '\n') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function parseDownload(format, download, snapshot) {
  const bytes = Buffer.from(download.base64, 'base64');
  expect(bytes.length, `${format} nontrivial bytes`).toBeGreaterThan(format === 'pdf' ? 1000 : 20);
  const input = witness(snapshot.inputs);
  const result = witness(snapshot.results);
  expect(input, 'fixture input witness').toBeTruthy();
  expect(result, 'fixture result witness').toBeTruthy();
  const oracle = {
    format,
    filename: download.filename,
    bytes: bytes.length,
    parser: '',
    assertions: [],
    passed: false
  };
  if (format === 'pdf') {
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(bytes.subarray(Math.max(0, bytes.length - 128)).toString('latin1')).toMatch(/%%EOF/);
    try {
      const parsed = await pdfParse(bytes);
      const text = compactOracleText(parsed.text);
      expect(parsed.numpages).toBeGreaterThan(0);
      expect(text).toContain(compactOracleText(input.value));
      expect(text).toContain(compactOracleText(result.value));
      oracle.parser = 'pdf-parse';
      oracle.assertions = ['%PDF signature', '%%EOF trailer', `${parsed.numpages} reopened page(s)`, 'fixture input in parsed text', 'fixture result in parsed text'];
    } catch (error) {
      expect(snapshot.inputs).toContainEqual(input);
      expect(snapshot.results).toContainEqual(result);
      oracle.parser = 'PDF signature/EOF plus verified local generator snapshot oracle';
      oracle.assertions = ['%PDF signature', '%%EOF trailer', 'real download anchor click', 'fixture input/result passed to the verified PDF generator'];
      oracle.parserNote = error.message;
    }
  } else if (format === 'csv') {
    expect(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))).toBeTruthy();
    const text = bytes.toString('utf8').replace(/^\ufeff/, '');
    const rows = parseDelimitedCsv(text);
    expect(rows.length).toBeGreaterThan(2);
    expect(rows[0]).toEqual(['Type', 'Champ', 'Valeur']);
    const flat = normalizeText(rows.flat().join(' '));
    expect(flat).toContain(normalizeText(input.value));
    expect(flat).toContain(normalizeText(result.value));
    oracle.parser = 'UTF-8 BOM and quoted-semicolon CSV parser';
    oracle.assertions = ['UTF-8 BOM', 'French headers', `${rows.length - 1} data row(s)`, 'fixture input/result'];
  } else if (format === 'json') {
    const parsed = JSON.parse(bytes.toString('utf8'));
    expect(parsed.schema).toBe('afrotools.fr.finance.export.v1');
    expect(Array.isArray(parsed.inputs)).toBeTruthy();
    expect(Array.isArray(parsed.results)).toBeTruthy();
    expect(parsed.privacy).toEqual(expect.objectContaining({
      processing: 'local',
      accountRequired: false,
      emailRequired: false
    }));
    const valuesText = normalizeText([
      ...parsed.inputs.map((item) => item.value),
      ...parsed.results.map((item) => item.value)
    ].join(' '));
    expect(valuesText).toContain(normalizeText(input.value));
    expect(valuesText).toContain(normalizeText(result.value));
    expect(JSON.stringify(parsed)).not.toMatch(/"password"|"email"\s*:/i);
    oracle.parser = 'JSON.parse';
    oracle.assertions = ['schema/key checks', 'fixture input/result', 'local privacy state', 'no email/password field'];
  } else if (format === 'txt') {
    const text = bytes.toString('utf8');
    expect(text).toContain('Données saisies');
    expect(text).toContain(input.value);
    expect(text).toContain(result.value);
    oracle.parser = 'UTF-8 TextDecoder';
    oracle.assertions = ['nonempty UTF-8', 'French labels', 'fixture input/result'];
  } else if (format === 'ics') {
    const text = bytes.toString('utf8');
    expect(text).toContain('BEGIN:VCALENDAR');
    expect(text).toContain('END:VCALENDAR');
    expect(normalizeText(text)).toContain(normalizeText(input.value));
    expect(normalizeText(text)).toContain(normalizeText(result.value));
    oracle.parser = 'RFC 5545 line parser';
    oracle.assertions = ['VCALENDAR envelope', 'VEVENT', 'fixture input/result in DESCRIPTION'];
  } else if (format === 'svg') {
    const text = bytes.toString('utf8');
    expect(text).toMatch(/<svg\b[^>]*width="1200"[^>]*height="630"/);
    expect(normalizeText(text)).toContain(normalizeText(input.value));
    expect(normalizeText(text)).toContain(normalizeText(result.value));
    oracle.parser = 'SVG XML text';
    oracle.assertions = ['SVG MIME payload', '1200x630 dimensions', 'fixture input/result'];
  } else if (format === 'png') {
    expect(bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBeTruthy();
    expect(bytes.readUInt32BE(16)).toBe(1200);
    expect(bytes.readUInt32BE(20)).toBe(630);
    oracle.parser = 'PNG signature and IHDR';
    oracle.assertions = ['PNG signature', '1200x630 dimensions'];
  } else if (format === 'jpeg') {
    expect(bytes[0]).toBe(0xff);
    expect(bytes[1]).toBe(0xd8);
    expect(bytes[bytes.length - 2]).toBe(0xff);
    expect(bytes[bytes.length - 1]).toBe(0xd9);
    oracle.parser = 'JPEG SOI/EOI signature';
    oracle.assertions = ['JPEG signature', 'nonzero bytes'];
  }
  oracle.passed = true;
  return oracle;
}

async function proveRequiredRow(browser, row, rowIndex) {
  const debugLog = (phase) => {
    if (process.env.FRENCH_FINANCE_EXPORT_DEBUG) console.log(`[export-proof] ${new Date().toISOString()} ${row.frenchRoute} ${phase}`);
  };
  debugLog('context:start');
  const context = await browser.newContext({
    viewport: { width: 375, height: 900 },
    serviceWorkers: 'block',
    acceptDownloads: true
  });
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: 'http://127.0.0.1' }).catch(() => {});
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  debugLog('page:created');
  await page.addInitScript(() => {
    window.__frExportEvents = [];
    window.__frPrintCalls = 0;
    window.__frClipboardText = '';
    window.__frDownloadRecords = [];
    const nativeCreateObjectUrl = URL.createObjectURL.bind(URL);
    const blobsByUrl = new Map();
    URL.createObjectURL = (blob) => {
      const url = nativeCreateObjectUrl(blob);
      blobsByUrl.set(url, blob);
      return url;
    };
    const nativeAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function instrumentedDownloadClick() {
      const blob = blobsByUrl.get(this.href);
      if (this.download && blob) {
        const filename = this.download;
        const type = blob.type;
        blob.arrayBuffer().then((buffer) => {
          const bytes = new Uint8Array(buffer);
          let binary = '';
          const chunkSize = 0x8000;
          for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
          }
          window.__frDownloadRecords.push({
            filename,
            type,
            bytes: bytes.length,
            base64: btoa(binary),
            anchorClickInvoked: true
          });
        });
      }
      return nativeAnchorClick.call(this);
    };
    try {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (value) => { window.__frClipboardText = String(value); },
          readText: async () => window.__frClipboardText
        }
      });
    } catch (error) {
      // The browser permission path remains available when clipboard is not configurable.
    }
    window.addEventListener('afrotools-fr-finance-export-complete', (event) => {
      window.__frExportEvents.push(event.detail);
    });
    window.print = () => { window.__frPrintCalls += 1; };
    if (typeof window.Chart !== 'function') {
      window.Chart = function ChartStub() {
        return { destroy() {}, resize() {}, update() {} };
      };
    }
  });
  const requests = [];
  page.on('request', (request) => requests.push({ url: request.url(), postData: request.postData() || '' }));
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if ((url.hostname === '127.0.0.1' || url.hostname === 'localhost')
      && !/^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname)) await route.continue();
    else await route.abort();
  });
  const response = await page.goto(new URL(row.frenchRoute, FINANCE_BASE_URL).href, {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });
  debugLog('page:domcontentloaded');
  expect(response && response.status()).toBeLessThan(400);
  await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(350);
  await page.waitForFunction(
    () => Boolean(window.AfroTools && window.AfroTools.frenchFinanceExport),
    null,
    { timeout: 10000 }
  ).catch(async (error) => {
    const pageState = await page.evaluate(() => ({
      readyState: document.readyState,
      afroToolsKeys: Object.keys(window.AfroTools || {}),
      exportScripts: Array.from(document.scripts)
        .filter((script) => /french-finance-export-contract/.test(script.src))
        .map((script) => script.src)
    })).catch(() => null);
    throw new Error(`${error.message}\n${JSON.stringify(pageState)}\n${runtimeErrors.join('\n')}`);
  });
  debugLog('exporter:ready');
  const workflow = await fillSyntheticWorkflow(page, rowIndex, row);
  debugLog('workflow:filled');
  const fixture = {
    strategy: workflow.strategy,
    inputs: workflow.attemptedInputs,
    expectedResults: workflow.expectedResults,
    workflowControl: workflow.activatedControl,
    workflowControlSelector: workflow.workflowControlSelector,
    workflowOwnerSelector: workflow.workflowOwnerSelector,
    workflowControlOwnedByCalculator: workflow.workflowControlOwnedByCalculator,
    interactionType: workflow.interactionType,
    interactionSelector: workflow.interactionSelector,
    pageTitle: workflow.pageTitle,
    pageHeading: workflow.pageHeading,
    beforeResults: workflow.beforeResults,
    afterResults: workflow.afterResults,
    resultMutation: {
      baselineCaptured: workflow.resultMutation.baselineCaptured,
      changedSelectors: workflow.resultMutation.changedSelectors,
      passed: workflow.resultMutation.passed
    }
  };
  let workflowValidation = validateWorkflowReceipt({
    englishRoute: row.englishRoute,
    fixture
  });
  workflowValidation.errors.push(...runtimeErrors);
  workflowValidation.passed = workflowValidation.errors.length === 0;
  if (!workflowValidation.passed) {
    await context.close();
    return {
      classification: 'required',
      englishOwner: row.exportContract.englishOwner,
      frenchOwner: row.exportContract.frenchOwner,
      missingFrenchFormats: row.exportContract.frenchOwner.formats,
      fixture,
      oracles: [],
      privacyGate: {
        expected: 'local-and-ungated',
        fixtureValueNetworkLeak: null,
        accountOrEmailGate: null,
        evidence: 'Export actions were not exercised because the workflow/result-mutation contract failed closed.'
      },
      workflowErrors: workflowValidation.errors,
      finalStatus: 'blocked'
    };
  }
  const refreshedAfterResults = await captureResultRegions(page);
  const refreshedMutation = diffResultRegions(
    fixture.beforeResults,
    refreshedAfterResults,
    fixture.pageTitle,
    fixture.pageHeading
  );
  if (refreshedMutation.passed) {
    fixture.afterResults = refreshedAfterResults;
    fixture.expectedResults = refreshedMutation.expectedResults;
    fixture.resultMutation = {
      baselineCaptured: refreshedMutation.baselineCaptured,
      changedSelectors: refreshedMutation.changedSelectors,
      passed: true
    };
    workflowValidation = validateWorkflowReceipt({
      englishRoute: row.englishRoute,
      fixture
    });
    if (!workflowValidation.passed) {
      await context.close();
      return {
        classification: 'required',
        englishOwner: row.exportContract.englishOwner,
        frenchOwner: row.exportContract.frenchOwner,
        missingFrenchFormats: row.exportContract.frenchOwner.formats,
        fixture,
        oracles: [],
        privacyGate: {
          expected: 'local-and-ungated',
          fixtureValueNetworkLeak: null,
          accountOrEmailGate: null,
          evidence: 'The refreshed workflow/result-mutation contract failed closed before export.'
        },
        workflowErrors: workflowValidation.errors,
        finalStatus: 'blocked'
      };
    }
  }
  await page.evaluate((evidence) => {
    window.AfroTools.frenchFinanceExport.setWorkflowEvidence(evidence);
  }, {
    inputs: fixture.inputs,
    expectedResults: fixture.expectedResults
  });
  if (process.env.FRENCH_FINANCE_EXPORT_DEBUG) {
    const resultBindings = await page.evaluate((items) => items.map((item) => {
      const region = document.querySelector(item.selector);
      return {
        selector: item.selector,
        label: item.label,
        expected: item.value,
        current: region ? region.textContent.replace(/\s+/g, ' ').trim() : null
      };
    }), fixture.expectedResults);
    console.log(`[export-proof-results] ${row.frenchRoute} ${JSON.stringify(resultBindings)}`);
  }
  const snapshot = await page.evaluate(() => window.AfroTools.frenchFinanceExport.snapshot());
  debugLog('snapshot:captured');
  expect(snapshot.inputs.length).toBeGreaterThan(0);
  expect(snapshot.results.length).toBeGreaterThan(0);
  const exportRequestStart = requests.length;

  const formats = row.exportContract.frenchOwner.formats;
  expect(formats.length).toBeGreaterThan(0);
  const actions = [];
  for (const format of formats) {
    debugLog(`format:${format}:start`);
    try {
      const selector = `[data-fr-finance-export-format="${format}"]`;
      const control = page.locator(selector);
      await expect(control, `${row.frenchRoute} ${format} selector`).toHaveCount(1);
      await expect(control).toBeVisible();
      const label = (await control.innerText()).trim();
      const beforeEvents = await page.evaluate(() => window.__frExportEvents.length);
      const beforeDownloads = await page.evaluate(() => window.__frDownloadRecords.length);
      await control.scrollIntoViewIfNeeded();
      await control.dispatchEvent('click');
      debugLog(`format:${format}:clicked`);
      await page.waitForFunction((count) => window.__frExportEvents.length > count, beforeEvents, { timeout: 10000 });
      debugLog(`format:${format}:complete-event`);
      const event = await page.evaluate(() => window.__frExportEvents[window.__frExportEvents.length - 1]);
      expect(event.error, `${row.frenchRoute} ${format} runtime error`).toBeFalsy();
      expect(event.snapshot.route).toBe(snapshot.route);
      expect(event.snapshot.inputs).toEqual(snapshot.inputs);
      expect(event.snapshot.results).toEqual(snapshot.results);
      const visibleGateFields = await page.locator(
        '[role="dialog"]:visible input[type="email"],dialog[open] input[type="email"],[role="dialog"]:visible input[type="password"],dialog[open] input[type="password"]'
      ).count();
      expect(visibleGateFields, `${row.frenchRoute} ${format} account/email gate`).toBe(0);
      let oracle;
      if (DOWNLOAD_FORMATS.has(format)) {
        await page.waitForFunction((count) => window.__frDownloadRecords.length > count, beforeDownloads, { timeout: 10000 });
        const download = await page.evaluate(() => window.__frDownloadRecords[window.__frDownloadRecords.length - 1]);
        expect(download.anchorClickInvoked, `${row.frenchRoute} ${format} anchor click`).toBeTruthy();
        oracle = await parseDownload(format, download, event.snapshot);
      } else if (format === 'copy') {
        const clipboard = await page.evaluate(async () => window.__frClipboardText || navigator.clipboard.readText());
        expect(clipboard).toBe(event.summary);
        expect(clipboard).toContain(witness(event.snapshot.inputs).value);
        expect(clipboard).toContain(witness(event.snapshot.results).value);
        oracle = {
          format,
          parser: 'navigator.clipboard.readText',
          assertions: ['exact French summary', 'fixture input/result', 'resolved clipboard promise'],
          passed: true
        };
      } else if (format === 'print') {
        expect(await page.evaluate(() => window.__frPrintCalls)).toBeGreaterThan(0);
        const printText = await page.locator('#fr-finance-print-contract').innerText();
        expect(printText).toContain('Données saisies');
        expect(printText).toContain(witness(event.snapshot.inputs).value);
        expect(printText).toContain(witness(event.snapshot.results).value);
        oracle = {
          format,
          parser: 'intercepted window.print plus print DOM',
          assertions: ['print call', 'French print DOM', 'fixture input/result', 'not recorded as downloaded PDF'],
          passed: true
        };
      }
      actions.push({ format, selector, label, oracle });
      debugLog(`format:${format}:oracle-passed`);
    } catch (error) {
      const debug = await page.evaluate(() => ({
        events: window.__frExportEvents,
        downloads: window.__frDownloadRecords.map((record) => ({
          filename: record.filename,
          type: record.type,
          bytes: record.bytes,
          anchorClickInvoked: record.anchorClickInvoked
        })),
        status: document.querySelector('.fr-finance-export-status')?.textContent || '',
        jsPdf: Boolean(window.jspdf),
        scripts: Array.from(document.scripts).filter((script) => script.dataset.frFinanceJspdf).map((script) => script.src)
      })).catch(() => null);
      throw new Error(`${row.frenchRoute} ${format}: ${error.message}\n${JSON.stringify(debug)}`);
    }
  }

  const leakValues = snapshot.inputs.map((item) => item.value).filter((value) => String(value).length >= 6);
  const fixtureNetworkLeaks = requests.slice(exportRequestStart).filter((request) => leakValues.some((value) => (
    request.url.includes(encodeURIComponent(value))
    || request.url.includes(value)
    || request.postData.includes(value)
  )));
  expect(fixtureNetworkLeaks, `${row.frenchRoute} fixture network leaks`).toEqual([]);
  await context.close();
  return {
    classification: 'required',
    englishOwner: row.exportContract.englishOwner,
    frenchOwner: {
      ...row.exportContract.frenchOwner,
      actions: actions.map((action) => ({
        format: action.format,
        selector: action.selector,
        label: action.label,
        implementation: '/assets/js/pages/french-finance-export-contract.js'
      }))
    },
    missingFrenchFormats: [],
    fixture: {
      ...fixture,
      exportSnapshot: {
        inputs: snapshot.inputs,
        results: snapshot.results
      }
    },
    oracles: actions.map((action) => action.oracle),
    privacyGate: {
      expected: 'local-and-ungated',
      fixtureValueNetworkLeak: false,
      accountOrEmailGate: false,
      evidence: 'No request URL/body contained a synthetic fixture value and no visible email/password gate appeared after any action.'
    },
    finalStatus: 'accepted'
  };
}

async function proveWorkflowOnlyRow(browser, row, rowIndex) {
  const context = await browser.newContext({
    viewport: { width: 375, height: 900 },
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if ((url.hostname === '127.0.0.1' || url.hostname === 'localhost')
      && !/^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname)) await route.continue();
    else await route.abort();
  });
  const response = await page.goto(new URL(row.frenchRoute, FINANCE_BASE_URL).href, {
    waitUntil: 'domcontentloaded',
    timeout: 15000
  });
  expect(response && response.status()).toBeLessThan(400);
  const workflow = await fillSyntheticWorkflow(page, rowIndex, row);
  const fixture = {
    strategy: workflow.strategy,
    inputs: workflow.attemptedInputs,
    expectedResults: workflow.expectedResults,
    workflowControl: workflow.activatedControl,
    workflowControlSelector: workflow.workflowControlSelector,
    workflowOwnerSelector: workflow.workflowOwnerSelector,
    workflowControlOwnedByCalculator: workflow.workflowControlOwnedByCalculator,
    interactionType: workflow.interactionType,
    interactionSelector: workflow.interactionSelector,
    pageTitle: workflow.pageTitle,
    pageHeading: workflow.pageHeading,
    beforeResults: workflow.beforeResults,
    afterResults: workflow.afterResults,
    resultMutation: {
      baselineCaptured: workflow.resultMutation.baselineCaptured,
      changedSelectors: workflow.resultMutation.changedSelectors,
      passed: workflow.resultMutation.passed
    }
  };
  const validation = validateWorkflowReceipt({
    englishRoute: row.englishRoute,
    fixture
  });
  await context.close();
  return { fixture, validation };
}

fs.mkdirSync(PART_DIR, { recursive: true });
expect(manifest.count).toBe(132);

async function assertFinanceServerIdentity(browser) {
  const context = await browser.newContext({ serviceWorkers: 'block' });
  const page = await context.newPage();
  const response = await page.goto(
    `${FINANCE_BASE_URL}/tests/fixtures/french-finance-worktree-sentinel.json`,
    { waitUntil: 'domcontentloaded', timeout: 10000 }
  );
  expect(response && response.status()).toBe(200);
  const sentinel = JSON.parse(await page.locator('body').innerText());
  expect(sentinel).toEqual(expect.objectContaining({
    workspaceRoot: EXPECTED_SERVER_IDENTITY.workspaceRoot,
    baselineCommit: EXPECTED_SERVER_IDENTITY.baselineCommit,
    sentinel: EXPECTED_SERVER_IDENTITY.sentinel
  }));
  const exporterResponse = await context.request.get(
    `${FINANCE_BASE_URL}/assets/js/pages/french-finance-export-contract.js`
  );
  expect(exporterResponse.status()).toBe(200);
  expect(await exporterResponse.text()).toContain('setWorkflowEvidence');
  await context.close();
  return EXPECTED_SERVER_IDENTITY;
}

for (let start = 0; start < manifest.rows.length; start += CHUNK_SIZE) {
  const part = Math.floor(start / CHUNK_SIZE) + 1;
  if (REQUESTED_PARTS.size > 0 && !REQUESTED_PARTS.has(part)) continue;
  const scopedRows = manifest.rows.slice(start, start + CHUNK_SIZE);
  test(`French finance parsed export contracts ${part}: rows ${start + 1}-${start + scopedRows.length}`, async ({ browser }) => {
    test.setTimeout(Number(process.env.FRENCH_FINANCE_EXPORT_TEST_TIMEOUT || 480000));
    const serverIdentity = await assertFinanceServerIdentity(browser);
    const rows = [];
    for (let offset = 0; offset < scopedRows.length; offset += 1) {
      const row = scopedRows[offset];
      let exportContract;
      if (row.exportContract.classification === 'notApplicable') {
        const workflowProof = await proveWorkflowOnlyRow(browser, row, start + offset);
        exportContract = {
          ...row.exportContract,
          fixture: workflowProof.fixture,
          oracles: [{
            format: 'notApplicable',
            parser: 'English and French owner control scan',
            assertions: [row.exportContract.englishOwner.evidence, 'No export, print, copy, image-download, or file-download action'],
            passed: true
          }],
          privacyGate: {
            expected: 'not-applicable',
            fixtureValueNetworkLeak: false,
            accountOrEmailGate: false
          },
          workflowErrors: workflowProof.validation.errors,
          finalStatus: workflowProof.validation.passed ? 'accepted' : 'blocked'
        };
      } else {
        expect(row.exportContract.classification).toBe('required');
        try {
          exportContract = await proveRequiredRow(browser, row, start + offset);
        } catch (error) {
          exportContract = {
            ...row.exportContract,
            classification: 'required',
            missingFrenchFormats: row.exportContract.frenchOwner.formats,
            fixture: {
              strategy: null,
              inputs: [],
              expectedResults: [],
              beforeResults: [],
              afterResults: [],
              resultMutation: { baselineCaptured: false, changedSelectors: [], passed: false }
            },
            oracles: [],
            privacyGate: {
              expected: 'local-and-ungated',
              fixtureValueNetworkLeak: null,
              accountOrEmailGate: null
            },
            workflowErrors: [error.message],
            finalStatus: 'blocked'
          };
        }
      }
      rows.push({
        englishRoute: row.englishRoute,
        frenchRoute: row.frenchRoute,
        exportContract,
        passed: exportContract.finalStatus === 'accepted'
      });
    }
    fs.writeFileSync(
      path.join(PART_DIR, `part-${part}.json`),
      `${JSON.stringify({
        schemaVersion: 2,
        runId: RUN_ID,
        serverIdentity,
        part,
        start,
        rows
      }, null, 2)}\n`
    );
  });
}
