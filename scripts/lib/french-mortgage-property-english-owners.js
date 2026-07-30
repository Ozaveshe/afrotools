'use strict';

const CALCULATORS = new Set([
  'cac-cost',
  'cipc-cost',
  'tenancy-deposit',
  'property-tax',
  'ng-nhf',
  'child-support',
  'court-fees',
  'divorce-settlement',
  'inheritance-tax',
  'legal-aid'
]);

const CHECKLISTS = new Set([
  'data-compliance',
  'lease-risk-check',
  'ndpa-checker',
  'popia-checker',
  'dpia-tool'
]);

const DOCUMENTS = new Set([
  'contract-gen',
  'tenancy-agreement',
  'employment-contract',
  'nda-generator',
  'privacy-policy-gen',
  'will-generator',
  'affidavit-generator',
  'board-resolution',
  'breach-notification',
  'cookie-consent',
  'dpa-generator',
  'partnership-agreement',
  'power-of-attorney',
  'shareholder-agreement',
  'statutory-declaration'
]);

const ACTIONS = Object.freeze({
  'cac-cost': ['button[onclick="calculate()"]', '#resultCard'],
  'cipc-cost': ['button[onclick="calculate()"]', '#resultCard'],
  'tenancy-deposit': ['button[onclick="calculate()"]', '#resultCard'],
  'leave-days': ['button[onclick="showLeave()"]', '#results'],
  'property-tax': ['button[onclick="AT.calculate()"]', '#at-results'],
  'rent-intelligence': [null, 'body'],
  'ng-nhf': ['button[onclick="calculate()"]', '#resultCard'],
  'child-support': ['button[onclick="calcChildSupport()"]', '#csResults'],
  'court-fees': ['button[onclick="calcCourtFees()"]', '#courtResults'],
  'divorce-settlement': ['button[onclick="calcDivorce()"]', '#divorceResults'],
  'inheritance-tax': ['button[onclick="calcInheritance()"]', '#inhResults'],
  'legal-aid': ['button[onclick="checkEligibility()"]', '#aidResults'],
  'data-compliance': ['button[onclick="assess()"]', '#resultCard'],
  'contract-gen': [null, 'body'],
  'visa-cost': [null, '#result'],
  'lease-risk-check': [null, '#mdSummary'],
  'tenancy-agreement': ['button[onclick="generate()"]', '#output'],
  'employment-contract': ['button[onclick="generate()"]', '#output'],
  'cac-checker': ['button[onclick="checkName()"]', '#resultArea'],
  'ip-rights-africa': [null, '#tmSteps'],
  'business-registration': ['#buildFilingPack', '#planSteps'],
  'company-type-selector': ['#calcBtn', '#results'],
  'nda-generator': ['button[onclick="generateNDA()"]', '#ndaOutput'],
  'privacy-policy-gen': ['button[onclick="generatePolicy()"]', '#policyOutput'],
  'will-generator': ['button[onclick="generateWill()"]', '#willOutput'],
  'ndpa-checker': ['button[onclick="showResults()"]', '#resultsSection'],
  'popia-checker': ['button[onclick="showResults()"]', '#resultsSection'],
  'affidavit-generator': ['button[onclick="generateAffidavit()"]', '#affOutput'],
  'annual-returns': [null, 'body'],
  'bail-calculator': ['button[onclick="checkBail()"]', '#bailResults'],
  'board-resolution': ['button[onclick="generateResolution()"]', '#docOutput'],
  'breach-notification': ['button[onclick="generateNotices()"]', '#noticeOutput'],
  'business-license': [null, 'body'],
  'cookie-consent': ['button[onclick="generateCode()"]', '#codeOutput'],
  'dpa-generator': ['button[onclick="generateDPA()"]', '#dpaOutput'],
  'dpia-tool': ['button[onclick="completeStep1()"]', 'body'],
  'foreign-company-reg': [null, '#stepsList'],
  'gdpr-vs-africa': [null, '#mainTable'],
  'ip-protection': [null, 'body'],
  'partnership-agreement': ['button[onclick="generatePA()"]', '#docOutput'],
  'power-of-attorney': ['button[onclick="generatePOA()"]', '#poaOutput'],
  'shareholder-agreement': ['button[onclick="generateSHA()"]', '#docOutput'],
  'statutory-declaration': ['button[onclick="generateDeclaration()"]', '#declOutput'],
  'tin-guide': [null, '#stepsList'],
  'trademark-registration': [null, 'body'],
  'winding-up': [null, '#stepsList']
});

function ownershipKind(englishId) {
  if (CALCULATORS.has(englishId)) return 'calculator-shared-engine';
  if (CHECKLISTS.has(englishId)) return 'checklist-english-dom-oracle';
  if (DOCUMENTS.has(englishId)) return 'document-english-dom-oracle';
  return 'reference-english-dom-oracle';
}

function actionContract(englishId) {
  const entry = ACTIONS[englishId];
  if (!entry) throw new Error(`Missing English owner action contract: ${englishId}`);
  return { actionSelector: entry[0], outputSelector: entry[1] };
}

module.exports = {
  ACTIONS,
  CALCULATORS,
  CHECKLISTS,
  DOCUMENTS,
  actionContract,
  ownershipKind
};
