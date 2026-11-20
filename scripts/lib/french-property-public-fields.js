'use strict';

// These workflows describe a visitor's own parties, transactions or circumstances.
const personalWorkflows = new Set([
  'contract-gen',
  'rent-intelligence',
  'lease-risk-check',
  'rental-agreement',
  'tenancy-agreement',
  'employment-contract',
  'cac-checker',
  'nda-generator',
  'privacy-policy-gen',
  'will-generator',
  'affidavit-generator',
  'board-resolution',
  'breach-notification',
  'cookie-consent',
  'divorce-settlement',
  'dpa-generator',
  'dpia-tool',
  'partnership-agreement',
  'power-of-attorney',
  'shareholder-agreement',
  'statutory-declaration',
]);

module.exports = function publicFields(englishId, fields) {
  if (!personalWorkflows.has(englishId)) return fields;
  return fields.map(({fixtureValue, ...field}) => {
    if (field.name === 'currency' && fixtureValue === 'XOF') field.defaultValue = 'XOF';
    return field;
  });
};
