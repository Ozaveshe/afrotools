'use strict';

const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const test = require('node:test');
const vm = require('vm');
const engine = require('../assets/js/engines/french-mortgage-property');
const propertyEngine = require('../assets/js/engines/property-assumption');
const englishOwnerEngine = require('../assets/js/engines/mortgage-property-english-owner');
const presentation = require('../assets/js/lib/french-mortgage-property-presentation');
const contracts = require('../scripts/lib/french-mortgage-property-contracts');
const englishOwners = require('../scripts/lib/french-mortgage-property-english-owners');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/registry/french-mortgage-property.json');
const inventory = require('../reports/french-free-app-parity-inventory.json');
const aiEval = require('../data/ai/french-mortgage-property-route-eval.json');
const generatedAiMap = require('../assets/js/ai/french-route-map.generated');
const localeCoverage = require('../data/registry/locale-page-coverage.json').records;
const englishOracles = require('../data/fixtures/french-mortgage-property-english-oracles.json');
const officialSources = require('../data/mortgage-property/official-sources.json');
const OWNER_SOURCE_ASSUMPTION_IDS = new Set([
  'cac-cost', 'cipc-cost', 'tenancy-deposit', 'property-tax', 'ng-nhf',
  'child-support', 'court-fees', 'divorce-settlement', 'inheritance-tax', 'legal-aid'
]);
const EXTERNAL_SOURCE_REQUIRED = new Set([
  'rental-yield', 'land-title-check', 'property-valuation', 'rent-affordability',
  'tenant-screening', 'rental-agreement', 'property-mgmt-fees', 'building-materials',
  'construction-budget', 'dev-feasibility', 'survey-cost', 'service-charge',
  'short-let-calc', 'agent-commission', 'plot-converter', 'building-permit',
  'diaspora-property', 'offplan-vs-ready'
]);
const ENGLISH_LEGAL_ENGINE_ORACLE = {
  getAnnualReturns: () => ({}),
  getBusinessReg: () => ({}),
  getTIN: () => ({}),
  getTrademark: () => ({})
};

function routeFile(route) {
  const relative = String(route).replace(/^\/+|\/+$/g, '');
  return [
    path.join(ROOT, `${relative}.html`),
    path.join(ROOT, relative, 'index.html'),
    path.join(ROOT, relative, 'app.html')
  ].find((file) => fs.existsSync(file));
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
}

function registry() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8'), context);
  return context.AFRO_TOOLS;
}

test('inventory denominator and native route count remain exact without public test-infrastructure metadata', () => {
  const scoped = inventory.rows.filter((row) => row.category === 'Mortgage & Property');
  assert.equal(scoped.length, 66);
  assert.deepEqual(Object.fromEntries(
    [...new Set(scoped.map((row) => row.state))]
      .map((state) => [state, scoped.filter((row) => row.state === state).length])
  ), {
    'native-candidate': 66
  });
  assert.deepEqual(manifest.currentCounts, { nativeRuntime: 66, iframe: 0, bridge: 0, missing: 0 });
  for (const key of ['foundation', 'worktreeRoot', 'worktreePort', 'worktreeSentinel', 'baselineCounts']) {
    assert.equal(Object.hasOwn(manifest, key), false, key);
  }
  assert.equal(new Set(manifest.rows.map((row) => row.englishRoute)).size, 66);
  assert.equal(new Set(manifest.rows.map((row) => row.frenchRoute)).size, 66);
});

test('all 66 physical owners are native French apps with route and SEO contracts', () => {
  for (const row of manifest.rows) {
    const file = routeFile(row.frenchRoute);
    assert(file, row.frenchRoute);
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /lang="fr"/i, row.frenchRoute);
    assert.doesNotMatch(html, /worktree|sentinel|coordinator|coordinateur|43083|8254041e/i, row.frenchRoute);
    assert.match(html, /data-fr-mortgage-property-app/, row.frenchRoute);
    assert.match(html, /assets\/js\/lib\/french-mortgage-property-presentation\.js/, row.frenchRoute);
    assert.match(html, /assets\/js\/engines\/french-mortgage-property\.js/, row.frenchRoute);
    assert.match(html, /assets\/js\/pages\/french-mortgage-property-app\.js/, row.frenchRoute);
    assert.doesNotMatch(html, /<iframe\b|source-launch|data-fr-prep|ouvrir le calculateur complet|continuer dans le calculateur/i, row.frenchRoute);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools\\.com${row.frenchRoute}/">`), row.frenchRoute);
    assert.match(html, new RegExp(`hreflang="en" href="https://afrotools\\.com${row.englishRoute}/"`), row.frenchRoute);
    assert.match(html, new RegExp(`hreflang="fr" href="https://afrotools\\.com${row.frenchRoute}/"`), row.frenchRoute);
    const counterparts = localeCoverage.filter((record) => (
      record.indexableEligible &&
      record.equivalentRoute === `${row.englishRoute}/` &&
      !['en', 'fr'].includes(record.locale) &&
      !['unavailable', 'deprecated', 'english-fallback'].includes(record.state)
    ));
    for (const counterpart of counterparts) {
      assert.match(
        html,
        new RegExp(`hreflang="${counterpart.locale}" href="https://afrotools\\.com${counterpart.route}"`),
        `${row.frenchRoute}:${counterpart.locale}`
      );
      const counterpartHtml = fs.readFileSync(routeFile(counterpart.route), 'utf8');
      assert.match(
        counterpartHtml,
        new RegExp(`hreflang=["']fr["'][^>]+https://afrotools\\.com${row.frenchRoute}/`),
        `${counterpart.route}:fr`
      );
    }
    assert.match(html, /property="og:locale" content="fr_FR"/, row.frenchRoute);
    assert.match(html, /"inLanguage":"fr"/, row.frenchRoute);
    assert.match(html, /Aucun compte, e-mail ou appel IA n’est requis/, row.frenchRoute);
    assert.equal(row.nativeRuntime, true, row.frenchRoute);
    assert.equal(row.artworkExists, true, row.frenchRoute);
    assert.match(html, new RegExp(`<img[^>]+src="${row.imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]+data-route-artwork`), row.frenchRoute);
    const artworkTag = (html.match(/<img\b[^>]*data-route-artwork[^>]*>/i) || [])[0];
    assert(artworkTag, row.frenchRoute);
    assert.equal(decodeHtml((artworkTag.match(/\balt="([^"]*)"/i) || [])[1]), row.artworkAlt, row.frenchRoute);
    assert(row.artworkAlt.includes(row.name), row.frenchRoute);
    assert.doesNotMatch(row.artworkAlt, /^(image|illustration|visuel)$/i, row.frenchRoute);
    assert.match(row.source.url, /^https?:\/\//, row.englishId);
    if (row.source.hardCodedValues) {
      assert.notEqual(new URL(row.source.url).hostname, 'afrotools.com', row.englishId);
      assert.notEqual(row.source.role, 'implémentation source, sans autorité externe liée', row.englishId);
    }
    if (EXTERNAL_SOURCE_REQUIRED.has(row.englishId)) {
      assert.notEqual(new URL(row.source.url).hostname, 'afrotools.com', row.englishId);
      assert.doesNotMatch(`${row.source.role} ${row.source.support}`, /sans autorit|aucune autorit/i, row.englishId);
    }
    assert(row.source.title.length > 8, row.englishId);
    assert(row.source.support.length > 40, row.englishId);
    assert.equal(row.source.checkedAt, '2026-07-29', row.englishId);
    assert(row.source.freshness.includes(row.name), row.englishId);
    assert(row.source.assumptions.includes(row.name) || OWNER_SOURCE_ASSUMPTION_IDS.has(row.englishId), row.englishId);
    assert.match(row.source.confidence.calculation, /Élevée/, row.englishId);
    assert(row.source.confidence.applicability.length > 30, row.englishId);
    assert.match(html, new RegExp(`data-source-url[^>]+href="${row.source.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), row.englishId);
    assert.match(html, /data-source-checked-at>2026-07-29</, row.englishId);
    assert.match(html, /data-source-freshness>/, row.englishId);
    assert.match(html, /data-source-support>/, row.englishId);
    assert.match(html, /data-source-assumptions>/, row.englishId);
    assert.match(html, /data-source-confidence-calculation>/, row.englishId);
  }

  const nipcUrl = 'https://nipc.gov.ng/assets/publications/investment-guide-nigeria-2025/investment-guide-nigeria-2025.pdf';
  const diaspora = manifest.rows.find((row) => row.englishId === 'diaspora-property');
  const diasporaOwner = officialSources.sources.find((source) => source.tools.includes('diaspora-property'));
  assert.equal(diasporaOwner.url, nipcUrl);
  assert.equal(diaspora.source.url, nipcUrl);
});

test('scoped French descriptions, dark actions and evidence harness retain exact rejection regressions', () => {
  const corruptedIds = new Set([
    'cipc-cost', 'land-title-check', 'tenant-screening', 'building-materials',
    'construction-budget', 'ng-nhf', 'cac-checker', 'ip-rights-africa'
  ]);
  for (const row of manifest.rows.filter((item) => corruptedIds.has(item.englishId))) {
    assert.doesNotMatch(row.description, /fran\?ais|d\?j\?|\?\s+relire|Surface:/i, row.englishId);
    assert.match(row.description, /[éèêàùîôç’]/i, row.englishId);
  }

  const css = fs.readFileSync(path.join(ROOT, 'assets/css/french-mortgage-property.css'), 'utf8');
  assert.match(css, /--mp-primary-bg:\s*#115e59/i);
  assert.match(css, /button\[type="submit"\][\s\S]+background:\s*var\(--mp-primary-bg\)/i);
  assert.doesNotMatch(
    css.match(/\.mp-actions button\[type="submit"\]\s*\{[\s\S]*?\}/i)?.[0] || '',
    /var\(--mp-accent-strong\)/
  );

  const config = fs.readFileSync(path.join(ROOT, 'tests/playwright.french-mortgage-property.config.js'), 'utf8');
  const browserSpec = fs.readFileSync(path.join(ROOT, 'tests/e2e/french-mortgage-property-parity.spec.js'), 'utf8');
  assert.doesNotMatch(`${config}\n${browserSpec}`, /43083|reports[\\/]+french-mortgage-property-browser-evidence/i);
  assert.doesNotMatch(browserSpec, /intentionallyClosed|excludedAsClosed/);
  assert.doesNotMatch(browserSpec, /download\.path\(/);
  assert.match(browserSpec, /download\.createReadStream\(/);
  for (const field of ['method', 'url', 'query', 'hash', 'body', 'headers']) {
    assert.match(browserSpec, new RegExp(`\\b${field}\\b`), field);
  }
  assert.match(browserSpec, /separateBrowserContexts:\s*true/);
  assert.match(browserSpec, /async function proveHub\(browser\)/);
  assert.match(browserSpec, /cardCount:\s*66/);
  assert.match(browserSpec, /const hub = await proveHub\(browser\)/);
  assert.match(browserSpec, /manualDarkPrimaryContrast/);
  assert.match(browserSpec, /systemDarkPrimaryContrast/);
});

test('contracts are app-level and no generic label-swapped fallback can satisfy a row', () => {
  const nonPropertySignatures = new Set();
  const expectedResultSignatures = new Set();
  const forbiddenControls = /inscrire|newsletter|ouvrir|continuer|export|copier|télécharger|imprimer|partager/i;
  const forbiddenGenericFields = new Set(['partyA,partyB,date,subject', 'country,option', 'check1,check2,check3,check4']);

  for (const row of manifest.rows) {
    const source = contracts.contractFor(row.englishId);
    assert.equal(row.engineMode, source.engineMode, row.englishId);
    assert.equal(row.workflowControl, source.workflowControl, row.englishId);
    assert(row.sourceBoundary.includes(row.name), row.englishId);
    assert.doesNotMatch(row.workflowControl, forbiddenControls, row.englishId);
    assert(row.fields.length >= (row.workflowKind === 'reference' ? 1 : 3), row.englishId);
    for (const field of row.fields.filter((item) => item.type === 'select')) {
      for (const option of field.options) {
        assert.equal(
          option[1],
          presentation.label(row.englishId, field.name, option[0], option[1]),
          `${row.englishId}:${field.name}:${option[0]}`
        );
      }
    }
    const fieldSignature = row.fields.map((field) => field.name).join(',');
    if (row.sharedEngine !== 'property-assumption') {
      assert(!forbiddenGenericFields.has(fieldSignature), `${row.englishId}: ${fieldSignature}`);
    } else if (row.workflowKind === 'checklist') {
      assert(row.fields.every((field) => !/^Point de contrôle \d+$/.test(field.label)), row.englishId);
    }
    if (row.sharedEngine !== 'property-assumption') {
      assert.equal(row.engineMode, row.englishId, row.englishId);
      assert(!nonPropertySignatures.has(fieldSignature), `${row.englishId}: duplicate generic fields ${fieldSignature}`);
      nonPropertySignatures.add(fieldSignature);
    }
    const resultSignature = row.exportContract.fixture.expectedResults.map((result) => result.label).join(',');
    assert(resultSignature, row.englishId);
    if (row.sharedEngine !== 'property-assumption') {
      assert(!expectedResultSignatures.has(resultSignature), `${row.englishId}: duplicate result semantics ${resultSignature}`);
      expectedResultSignatures.add(resultSignature);
    }
    for (const expected of row.exportContract.fixture.expectedResults) {
      assert.notEqual(expected.value, row.name, `${row.englishId}: title-only result`);
      assert.doesNotMatch(expected.selector, /^h[1-6]$|hero|title|description|source|privacy/i, row.englishId);
    }
  }
});

test('every route-specific fixture produces meaningful output and relevant invalid states fail closed', () => {
  for (const row of manifest.rows) {
    const values = Object.fromEntries(row.fields.map((field) => [
      field.name,
      field.type === 'checkbox' ? field.fixtureValue === 'true' : field.fixtureValue
    ]));
    const result = engine.run(row, values, { legalEngine: ENGLISH_LEGAL_ENGINE_ORACLE });
    assert.equal(result.ok, true, row.englishId);
    assert.equal(result.summary, row.exportContract.fixture.expectedSummary, row.englishId);
    assert(Object.keys(result.resultFields).length >= (row.sharedEngine === 'property-assumption' ? 2 : 3), row.englishId);
    assert(result.summary.length > 20, `${row.englishId}: nontrivial summary`);
    assert.notEqual(result.summary, row.name, `${row.englishId}: result must not be the page title`);
    for (const expected of row.exportContract.fixture.expectedResults) {
      assert(Object.hasOwn(result.resultFields, expected.label), `${row.englishId}: missing ${expected.label}`);
      assert.equal(String(result.resultFields[expected.label]), String(expected.value), `${row.englishId}: ${expected.label}`);
    }

    const requiredText = row.fields.find((field) => ['text', 'date'].includes(field.type));
    const requiredSelect = row.fields.find((field) => field.type === 'select');
    const requiredNumber = row.fields.find((field) => field.type === 'number');
    const invalidField = row.sharedEngine === 'mortgage-property-english-owner'
      ? requiredSelect || requiredNumber
      : row.sharedEngine === 'property-assumption'
        ? requiredNumber || requiredSelect
      : requiredText || requiredSelect || requiredNumber;
    if (invalidField) {
      const invalid = { ...values };
      invalid[invalidField.name] = '';
      const failed = engine.run(row, invalid, { legalEngine: ENGLISH_LEGAL_ENGINE_ORACLE });
      assert.equal(failed.ok, false, `${row.englishId}: invalid input must fail closed`);
      assert(failed.message, row.englishId);
    } else if (row.fields.length && row.fields.every((field) => field.type === 'checkbox')) {
      const invalid = Object.fromEntries(row.fields.map((field) => [field.name, false]));
      const failed = engine.run(row, invalid, { legalEngine: ENGLISH_LEGAL_ENGINE_ORACLE });
      if (['ndpa-checker', 'popia-checker'].includes(row.englishId)) {
        assert.equal(failed.ok, true, `${row.englishId}: zero checked is a valid English-owner score`);
        continue;
      }
      assert.equal(failed.ok, false, `${row.englishId}: empty selection must fail closed`);
      assert.equal(failed.code, 'required-selection', row.englishId);
    }
  }
});

test('the exact 46-route ownership matrix is backed by independent pre-extraction English DOM oracles', () => {
  assert.equal(englishOracles.status, 'pre-extraction-English-owner-oracles');
  assert.equal(englishOracles.count, 46);
  assert.equal(new Set(englishOracles.rows.map((row) => row.englishId)).size, 46);
  assert.deepEqual(
    Object.fromEntries([...new Set(englishOracles.rows.map((row) => row.ownershipKind))]
      .map((kind) => [kind, englishOracles.rows.filter((row) => row.ownershipKind === kind).length])),
    {
      'calculator-shared-engine': 10,
      'checklist-english-dom-oracle': 5,
      'document-english-dom-oracle': 15,
      'reference-english-dom-oracle': 16
    }
  );
  for (const oracle of englishOracles.rows) {
    const row = manifest.rows.find((item) => item.englishId === oracle.englishId);
    assert(row, oracle.englishId);
    assert.equal(englishOwners.ownershipKind(oracle.englishId), oracle.ownershipKind);
    assert.deepEqual(row.englishOracle, {
      ownershipKind: oracle.ownershipKind,
      sourceSha256BeforeExtraction: oracle.sourceSha256BeforeExtraction,
      actionSelector: oracle.actionSelector,
      outputSelector: oracle.outputSelector,
      inputFixture: oracle.inputFixture,
      outputSha256: oracle.outputSha256,
      semanticAnchors: [...new Set(Object.values(oracle.inputFixture)
        .filter((value) => typeof value === 'string' && value.trim().length >= 4)
        .map((value) => value.trim())
        .filter((value) => oracle.outputText.toLocaleLowerCase('en').includes(value.toLocaleLowerCase('en'))))]
        .slice(0, 12),
      outputExcerpt: oracle.outputText.slice(0, 320)
    }, oracle.englishId);
    assert(oracle.outputText.length > 40, oracle.englishId);
    assert.match(oracle.outputSha256, /^[a-f0-9]{64}$/);
    assert.equal(row.sharedEngine, englishOwnerEngine.calculatorIds.includes(row.englishId)
      ? 'mortgage-property-english-owner'
      : 'english-dom-oracle');
  }
});

test('document fixtures reuse independently observed English-owner facts instead of French-generated oracles', () => {
  let compared = 0;
  for (const row of manifest.rows.filter((item) => item.englishOracle && item.englishOracle.ownershipKind === 'document-english-dom-oracle')) {
    const values = Object.fromEntries(row.fields.map((field) => [
      field.name,
      field.type === 'checkbox' ? field.fixtureValue === 'true' : field.fixtureValue
    ]));
    const french = engine.run(row, values, { legalEngine: ENGLISH_LEGAL_ENGINE_ORACLE });
    assert.equal(french.ok, true, row.englishId);
    const frenchFixtureAndOutput = JSON.stringify({ values, summary: french.summary, fields: french.resultFields }).toLocaleLowerCase('en');
    const sharedFacts = row.englishOracle.semanticAnchors.filter((anchor) =>
      frenchFixtureAndOutput.includes(anchor.toLocaleLowerCase('en'))
    );
    if (row.englishId === 'contract-gen') {
      assert.equal(row.englishOracle.semanticAnchors.length, 0, 'static English template has no editable fixture');
      assert.match(row.englishOracle.outputExcerpt, /Contract Generator|TENANCY AGREEMENT/);
    } else {
      assert(sharedFacts.length >= 1, `${row.englishId}: no independently observed English fact reused`);
      compared += 1;
    }
  }
  assert.equal(compared, 14);
});

test('all 21 checklist and reference owners have route-specific English and French semantic fixtures', () => {
  const markers = {
    'data-compliance': [/COMPLIANCE SCORE 100%/, /100 %/],
    'leave-days': [/NIGERIA — STATUTORY LEAVE ENTITLEMENTS/, /congés légaux pour Nigeria/],
    'visa-cost': [/Nigeria → .*Kenya \$30 USD/, /Nigeria vers Kenya.*USD 30/],
    'rent-intelligence': [/VERIFIED RENT LISTINGS/, /loyers vérifiés/],
    'lease-risk-check': [/0 Published risk reports/, /aucun signal publié/],
    'cac-checker': [/Name Likely Available/, /aucun mot réglementé/],
    'ip-rights-africa': [/trademark search/, /Plan PI : marque/],
    'business-registration': [/Limited Liability Company \(LTD\)/, /Société à responsabilité limitée/],
    'company-type-selector': [/One-Person Private Limited Company/, /1 fondateur/],
    'ndpa-checker': [/Compliance Score.*0%/s, /Score NDPA : 0 %/],
    'popia-checker': [/POPIA Compliance Score.*0%/s, /Score POPIA : 0 %/],
    'annual-returns': [/Annual Returns Filing Guide/, /Déclaration annuelle Nigeria/],
    'bail-calculator': [/MINOR OFFENCE/, /Fiche de caution Nigeria/],
    'business-license': [/Business License Requirements/, /Plan de licence Nigeria/],
    'dpia-tool': [/Data Protection Impact Assessment \(DPIA\) Tool/, /DPIA .*3\/4 facteurs/],
    'foreign-company-reg': [/Obtain NIPC Registration/, /Implantation de France vers Nigeria/],
    'gdpr-vs-africa': [/GDPR \(EU\).*NDPA \(NIGERIA\)/s, /Comparaison RGPD.*NDPA/],
    'ip-protection': [/IP Protection Guide for Africa/, /Stratégie PI/],
    'tin-guide': [/TIN is auto-assigned upon CAC registration/, /Parcours NIF Nigeria/],
    'trademark-registration': [/Trademark Registration Guide/, /Plan de marque/],
    'winding-up': [/Board meeting: Pass resolution to wind up/, /Dissolution Nigeria/]
  };
  const scoped = manifest.rows.filter((row) => row.englishOracle && /checklist|reference/.test(row.englishOracle.ownershipKind));
  assert.equal(scoped.length, 21);
  assert.deepEqual(scoped.map((row) => row.englishId).sort(), Object.keys(markers).sort());
  for (const row of scoped) {
    const oracle = englishOracles.rows.find((item) => item.englishId === row.englishId);
    const values = Object.fromEntries(row.fields.map((field) => [
      field.name,
      field.type === 'checkbox' ? field.fixtureValue === 'true' : field.fixtureValue
    ]));
    const french = engine.run(row, values, { legalEngine: ENGLISH_LEGAL_ENGINE_ORACLE });
    assert.match(oracle.outputText, markers[row.englishId][0], `${row.englishId}: English owner semantic marker`);
    assert.match(french.summary, markers[row.englishId][1], `${row.englishId}: French semantic marker`);
  }
});

test('shared owner engines execute the exact French fixture and no French-derived English semantic claim remains', () => {
  function propertySemanticFromFrench(kind, fields, summary, fixture) {
    const projections = {
      checklist: () => ({ ok: true, kind, checked: fields.pointsConfirmes }),
      agreement: () => {
        assert.match(summary, new RegExp(fixture.address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
        return {
          ok: true,
          kind,
          landlord: fields.bailleur,
          tenant: fields.locataire,
          address: fixture.address,
          start: fields.dateDebut,
          duration: fields.dureeMois,
          rent: fields.loyer,
          deposit: fields.depot
        };
      },
      duty: () => ({ ok: true, kind, total: fields.total }),
      yield: () => ({ ok: true, kind, netAnnual: fields.revenuAnnuelNet, yieldPercent: fields.rendementNetPourcent }),
      cost: () => ({ ok: true, kind, total: fields.coutTotal }),
      valuation: () => ({ ok: true, kind, total: fields.valeurScenario }),
      affordability: () => ({ ok: true, kind, rent: fields.loyer, boundary: fields.plafond, upfront: fields.avance }),
      management: () => ({ ok: true, kind, total: fields.fraisGestion }),
      development: () => ({ ok: true, kind, margin: fields.margeScenario, totalCost: fields.coutTotal }),
      tax: () => ({ ok: true, kind, gain: fields.plusValue, tax: fields.impotScenario }),
      service: () => ({ ok: true, kind, perUnit: fields.chargeParUnite }),
      shortlet: () => ({ ok: true, kind, netAnnual: fields.resultatAnnuelNet }),
      commission: () => ({ ok: true, kind, total: fields.commissionTotale }),
      converter: () => ({
        ok: true,
        kind,
        input: fields.valeurSaisie,
        from: fields.uniteDepart,
        to: fields.uniteArrivee,
        converted: fields.valeurConvertie
      }),
      diaspora: () => ({
        ok: true,
        kind,
        localBudget: fields.budgetLocal,
        required: fields.besoin,
        difference: fields.difference
      }),
      offplan: () => ({
        ok: true,
        kind,
        ready: fields.coutPret,
        offplanTotal: fields.coutSurPlan,
        difference: fields.difference
      })
    };
    assert(projections[kind], `unsupported property semantic projection: ${kind}`);
    return projections[kind]();
  }

  function ownerCalculatorFrenchFields(id, semantic) {
    const projections = {
      'cac-cost': () => ({
        formeCAC: semantic.entityType,
        lignesDeFrais: semantic.items.length,
        coutTotalNGN: semantic.total,
        equivalentUSD: semantic.usdEquivalent
      }),
      'cipc-cost': () => ({
        formeCIPC: semantic.entityType,
        fraisCIPCZAR: semantic.registrationFee,
        coutTotalZAR: semantic.total,
        delai: semantic.processingTime
      }),
      'tenancy-deposit': () => ({
        avance: semantic.advanceRent,
        depot: semantic.deposit,
        honorairesAgent: semantic.agentFee,
        fraisJuridiques: semantic.legalFee,
        chargesService: semantic.serviceTotal,
        coutEntree: semantic.total,
        devise: semantic.currency
      }),
      'property-tax': () => ({
        valeurBien: semantic.propertyValue,
        tauxEffectifPourcent: semantic.effectiveRate * 100,
        taxeAnnuelle: semantic.annualTax,
        taxeMensuelle: semantic.monthlyTax,
        devise: semantic.currency
      }),
      'ng-nhf': () => ({
        contributionMensuelleNGN: semantic.contributionMonthly,
        contributionAnnuelleNGN: semantic.contributionAnnual,
        totalContribueNGN: semantic.totalContribution,
        mensualiteNGN: semantic.monthlyPayment,
        interetsTotauxNGN: semantic.totalInterest,
        abordable: semantic.affordable
      }),
      'child-support': () => ({
        pays: semantic.country,
        contributionMensuelle: semantic.monthly,
        totalAnnuel: semantic.annual,
        parEnfant: semantic.perChild,
        tauxPourcent: semantic.rate * 100,
        garde: semantic.custody
      }),
      'court-fees': () => ({
        pays: semantic.country,
        montantDemande: semantic.claimAmount,
        niveauJuridiction: semantic.courtLevel,
        typeDemande: semantic.claimType,
        fraisDepot: semantic.filingFee,
        fraisSignification: semantic.serviceFee,
        total: semantic.total
      }),
      'divorce-settlement': () => ({
        pays: semantic.country,
        partieA: semantic.partyAName,
        partAPourcent: semantic.splitA,
        valeurA: semantic.valueA,
        partieB: semantic.partyBName,
        partBPourcent: semantic.splitB,
        valeurB: semantic.valueB
      }),
      'inheritance-tax': () => ({
        pays: semantic.country,
        successionBrute: semantic.grossEstate,
        successionNette: semantic.netEstate,
        lien: semantic.relationship,
        droitsEstimes: semantic.tax,
        fraisSuccession: semantic.probate,
        netApresFrais: semantic.netAfterAll
      }),
      'legal-aid': () => ({
        pays: semantic.country,
        revenuSousSeuil: semantic.incomePass,
        actifsSousSeuil: semantic.assetPass,
        affaireCouverte: semantic.matterCovered,
        typeAffaire: semantic.matter,
        seuilRevenuAjuste: semantic.adjustedThreshold,
        eligible: semantic.eligible
      })
    };
    assert(projections[id], `unsupported English-owner calculator projection: ${id}`);
    return projections[id]();
  }

  let propertyCount = 0;
  let ownerCalculatorCount = 0;
  for (const row of manifest.rows) {
    const values = Object.fromEntries(row.fields.map((field) => [
      field.name,
      field.type === 'checkbox' ? field.fixtureValue === 'true' : field.fixtureValue
    ]));
    const rawFrenchResult = engine.runRaw(row, values, { legalEngine: ENGLISH_LEGAL_ENGINE_ORACLE });
    const frenchResult = engine.run(row, values, { legalEngine: ENGLISH_LEGAL_ENGINE_ORACLE });
    assert.equal(rawFrenchResult.ok, true, row.englishId);
    assert.equal(frenchResult.ok, true, row.englishId);
    assert.equal(Object.hasOwn(rawFrenchResult, 'englishSemanticResult'), false, row.englishId);
    assert.equal(Object.hasOwn(frenchResult, 'englishSemanticResult'), false, row.englishId);
    if (row.sharedEngine === 'property-assumption') {
      propertyCount += 1;
      values.checked = Object.keys(values).filter((key) => /^check/.test(key) && values[key]).length;
      const englishEngineResult = propertyEngine.calculate(row.englishId, values);
      assert.equal(englishEngineResult.ok, true, row.englishId);
      assert.deepEqual(
        propertySemanticFromFrench(englishEngineResult.kind, rawFrenchResult.resultFields, rawFrenchResult.summary, values),
        englishEngineResult,
        `${row.englishId}: exact same-fixture shared semantic result`
      );
    } else if (row.sharedEngine === 'mortgage-property-english-owner') {
      ownerCalculatorCount += 1;
      const englishEngineResult = englishOwnerEngine.calculate(row.englishId, values);
      assert.equal(englishEngineResult.ok, true, row.englishId);
      assert.deepEqual(
        rawFrenchResult.resultFields,
        ownerCalculatorFrenchFields(row.englishId, englishEngineResult),
        `${row.englishId}: every French calculator result field must equal the English-owner semantic result`
      );
    }
  }
  assert.equal(propertyCount, 20);
  assert.equal(ownerCalculatorCount, 10);
  assert.equal(englishOwnerEngine.calculate('cac-cost', {
    entityType: 'bn',
    shareCapital: 1000000,
    directors: 2,
    useAgent: 'self',
    express: 'no',
    addAnnualReturns: false,
    addStatusReport: false,
    addScuml: false
  }).total, 14000);
  for (const boundary of [
    { shareCapital: 0, directors: 2, code: 'invalid-cac-share-capital' },
    { shareCapital: 1000000, directors: 0, code: 'invalid-cac-directors' }
  ]) {
    const failed = englishOwnerEngine.calculate('cac-cost', {
      entityType: 'bn',
      shareCapital: boundary.shareCapital,
      directors: boundary.directors,
      useAgent: 'self',
      express: 'no'
    });
    assert.equal(failed.ok, false);
    assert.equal(failed.code, boundary.code);
  }
  const cacRow = manifest.rows.find((row) => row.englishId === 'cac-cost');
  assert.equal(cacRow.fields.find((field) => field.name === 'shareCapital').min, 10000);
  assert.equal(cacRow.fields.find((field) => field.name === 'directors').min, 1);
  assert.equal(cacRow.fields.find((field) => field.name === 'directors').max, 20);
});

test('central presentation map removes scoped raw enums from forms, results and exports', () => {
  for (const row of manifest.rows) {
    const values = Object.fromEntries(row.fields.map((field) => [
      field.name,
      field.type === 'checkbox' ? field.fixtureValue === 'true' : field.fixtureValue
    ]));
    const result = engine.run(row, values, { legalEngine: ENGLISH_LEGAL_ENGINE_ORACLE });
    const presentedInputs = presentation.presentInputs(row.englishId, row.fields, values);
    assert.deepEqual(presentation.residualTokens(row.englishId, result.summary), [], `${row.englishId}:summary`);
    for (const [fieldName, value] of Object.entries(result.resultFields)) {
      assert.deepEqual(
        presentation.residualTokens(row.englishId, value),
        [],
        `${row.englishId}:result:${fieldName}`
      );
    }
    for (const [fieldName, value] of Object.entries(presentedInputs)) {
      assert.deepEqual(
        presentation.residualTokens(row.englishId, value),
        [],
        `${row.englishId}:input:${fieldName}`
      );
    }
  }
});

test('every advertised export has an explicit parser oracle and no account gate', () => {
  for (const row of manifest.rows) {
    const contract = row.exportContract;
    assert.equal(contract.classification, 'required', row.englishId);
    assert(contract.englishOwner.actions.length > 0 || /no export, print, copy or download control/i.test(contract.englishOwner.evidence), `${row.englishId}: English export evidence`);
    assert.deepEqual(contract.frenchOwner.formats, ['copy', 'txt', 'json', 'pdf', 'print']);
    assert.equal(contract.privacyGate.localOnly, true, row.englishId);
    assert.equal(contract.privacyGate.accountOrEmailGate, false, row.englishId);
    assert([null, false].includes(contract.privacyGate.fixtureValueNetworkLeak), row.englishId);
    assert(['pending-browser-proof', 'accepted'].includes(contract.finalStatus), row.englishId);
    for (const format of contract.frenchOwner.formats) {
      assert(contract.oracles.some((oracle) =>
        oracle.format === format &&
        (contract.finalStatus === 'accepted'
          ? oracle.status === 'parsed-and-accepted' && oracle.evidence
          : oracle.status === 'pending')
      ), `${row.englishId}:${format}`);
    }
  }

  const first = manifest.rows[0];
  const pdf = engine.createPdf(first.name, [
    `Entrée ${first.fields[0].name} : ${first.fields[0].fixtureValue}`,
    `Résultat ${first.exportContract.fixture.expectedResults[0].label} : ${first.exportContract.fixture.expectedResults[0].value}`
  ]);
  const text = Buffer.from(pdf).toString('utf8');
  assert(text.startsWith('%PDF-1.4'));
  assert(text.endsWith('%%EOF\n'));
  assert.match(text, /xref\n0 6/);
  assert.match(text, /Entr/);
  assert(pdf.byteLength > 500);
});

test('registry, canonical generated AI map and French hub own the same exact 66 routes', () => {
  const tools = registry();
  for (const row of manifest.rows) {
    const owner = tools.find((tool) => tool.lang === 'fr' && (
      tool.sourceId === row.englishId || String(tool.href).replace(/\/$/, '') === row.frenchRoute
    ));
    assert(owner, `${row.englishId}: French registry owner`);
    assert.equal(generatedAiMap.routes[`${row.englishRoute}/`], `${row.frenchRoute}/`, row.englishId);
    assert(aiEval.cases.some((item) => item.englishId === row.englishId && item.expectedFrenchRoute === `${row.frenchRoute}/`), row.englishId);
    const englishHtml = fs.readFileSync(routeFile(row.englishRoute), 'utf8');
    assert.match(englishHtml, new RegExp(`hreflang=["']fr["'][^>]+https://afrotools\\.com${row.frenchRoute}/`), row.englishId);
  }
  assert.equal(aiEval.count, 66);
  assert.match(generatedAiMap.source, /data\/registry\/locale-page-coverage\.json/);
  assert.equal(fs.existsSync(path.join(ROOT, 'assets/js/ai/french-mortgage-property-route-map.js')), false);
  for (const file of ['index.html', 'ai/index.html', 'assets/js/ai/intent-router.js', 'assets/js/ai/guardrails.js']) {
    assert.doesNotMatch(fs.readFileSync(path.join(ROOT, file), 'utf8'), /french-mortgage-property-route-map/);
  }

  const hub = fs.readFileSync(path.join(ROOT, 'fr/mortgage-property/index.html'), 'utf8');
  assert.match(hub, /"numberOfItems":66/);
  assert.doesNotMatch(hub, /worktree|sentinel|coordinator|coordinateur|43083|8254041e/i);
  for (const row of manifest.rows) {
    assert.match(hub, new RegExp(`href="${row.frenchRoute}/"`), row.englishId);
  }
});
