'use strict';

// Static import ensures the compatibility contract is bundled with Netlify
// Functions and does not depend on the repository directory existing at runtime.
const contracts = require('../../../data/calculation-quality/external-data-contracts.json');
const PROTECTED_KEYS = new Set(['forex-latest', 'fuel-latest', 'rates-latest']);

function getPath(value, selector) {
  return String(selector).split('.').reduce(function (current, part) {
    return current == null ? undefined : current[part];
  }, value);
}

function loadContracts() {
  return contracts;
}

function findContract(key) {
  return loadContracts().datasets.find(function (contract) {
    return contract.storageKey === key;
  }) || null;
}

function validateAgainstContract(contract, payload, nowIso) {
  var errors = [];
  if (!payload || typeof payload !== 'object') errors.push('payload must be an object');
  (contract.requiredPaths || []).forEach(function (requiredPath) {
    var value = getPath(payload, requiredPath);
    if (value === undefined || value === null || value === '') errors.push('missing required path ' + requiredPath);
  });
  var sourceValue = payload ? getPath(payload, contract.sourcePath) : null;
  if (sourceValue === undefined || sourceValue === null || sourceValue === '') errors.push('missing source metadata at ' + contract.sourcePath);
  if (payload && payload.schemaVersion !== contract.schemaVersion) errors.push('schemaVersion must equal ' + contract.schemaVersion);
  var retrievedAt = payload ? getPath(payload, contract.retrievedAtPath) : null;
  var retrievedMs = new Date(retrievedAt).getTime();
  if (!retrievedAt || isNaN(retrievedMs)) errors.push('invalid retrieval timestamp at ' + contract.retrievedAtPath);
  if (errors.length) {
    return {
      valid: false,
      code: 'INCOMPATIBLE_EXTERNAL_DATA',
      publicState: 'unavailable',
      publicLabel: 'Data unavailable - retained last-known-good value',
      errors: errors,
      retrievedAt: retrievedAt || null,
      preserveLastKnownGood: true
    };
  }
  var ageHours = (new Date(nowIso || new Date().toISOString()).getTime() - retrievedMs) / 3600000;
  var stale = ageHours > contract.maxAgeHours;
  return {
    valid: true,
    code: stale ? 'STALE_EXTERNAL_DATA' : 'OK',
    publicState: stale ? 'stale' : 'fresh',
    publicLabel: stale ? contract.publicStaleLabel : 'Fresh data',
    errors: [],
    retrievedAt: retrievedAt,
    preserveLastKnownGood: false
  };
}

function validateDataForKey(key, payload, nowIso) {
  var contract = findContract(key);
  if (!contract) {
    return PROTECTED_KEYS.has(key)
      ? { valid: false, code: 'INCOMPATIBLE_EXTERNAL_DATA', publicState: 'unavailable', publicLabel: 'Data unavailable - retained last-known-good value', errors: ['protected key has no compatibility contract'], retrievedAt: null, preserveLastKnownGood: true }
      : { valid: true, code: 'OK', publicState: 'unknown', publicLabel: 'Unregistered data lane', errors: [], retrievedAt: null, preserveLastKnownGood: false };
  }
  return validateAgainstContract(contract, payload, nowIso);
}

module.exports = { PROTECTED_KEYS, loadContracts, findContract, validateAgainstContract, validateDataForKey };
