'use strict';
const crypto = require('node:crypto');
const schema = require('../../data/registry/free-app-families.schema.json');
const hash = (algorithm, bytes) => crypto.createHash(algorithm).update(bytes).digest('hex');
const fail = (code, detail) => { throw new Error(code + ': ' + detail); };
const requireThat = (condition, code, detail) => { if (!condition) fail(code, detail); };
const normalizeRoute = route => route.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
const same = require('node:util').isDeepStrictEqual;

// This dependency-free interpreter deliberately supports only the keywords used
// by this maintained schema. It is not a general JSON Schema implementation.
function checkShape(value, rule, at = '$', definitions = schema.$defs) {
  if (rule.$ref) {
    requireThat(rule.$ref.startsWith('#/$defs/'), 'SCHEMA', 'local definitions only');
    return checkShape(value, definitions[rule.$ref.slice(8)], at, definitions);
  }
  if (Object.hasOwn(rule, 'const')) requireThat(same(value, rule.const), 'SHAPE', at + ' constant');
  if (rule.enum) requireThat(rule.enum.some(item => same(item, value)), 'SHAPE', at + ' enum');
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  if (rule.type) requireThat([].concat(rule.type).some(want => want === type || want === 'integer' && Number.isSafeInteger(value)), 'SHAPE', at + ' type');
  if (typeof value === 'string') {
    if (rule.minLength !== undefined) requireThat(value.trim().length >= rule.minLength, 'SHAPE', at + ' empty string');
    if (rule.pattern) requireThat(new RegExp(rule.pattern).test(value), 'SHAPE', at + ' pattern');
  }
  if (typeof value === 'number' && rule.minimum !== undefined) requireThat(value >= rule.minimum, 'SHAPE', at + ' minimum');
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined) requireThat(value.length >= rule.minItems, 'SHAPE', at + ' minimum items');
    if (rule.uniqueItems) requireThat(new Set(value.map(item => JSON.stringify(item))).size === value.length, 'SHAPE', at + ' duplicate items');
    if (rule.items) value.forEach((item, index) => checkShape(item, rule.items, at + '/' + index, definitions));
  } else if (value && typeof value === 'object') {
    for (const key of rule.required || []) requireThat(Object.hasOwn(value, key), 'SHAPE', at + ' missing ' + key);
    for (const key of Object.keys(value)) {
      if (rule.additionalProperties === false) requireThat(Object.hasOwn(rule.properties || {}, key), 'SHAPE', at + ' unknown ' + key);
      if (rule.properties && rule.properties[key]) checkShape(value[key], rule.properties[key], at + '/' + key, definitions);
    }
  }
}

function sourceBytes(pin, context) {
  requireThat(!pin.path.split('/').includes('..') && !pin.path.includes('//'), 'SOURCE_PIN', pin.path);
  const bytes = context.sourceFiles[pin.path];
  requireThat(Buffer.isBuffer(bytes), 'SOURCE_MISSING', pin.path);
  const gitBlob = hash('sha1', Buffer.concat([Buffer.from('blob ' + bytes.length + '\0'), bytes]));
  requireThat(bytes.length === pin.bytes && hash('sha256', bytes) === pin.sha256 && gitBlob === pin.gitBlob, 'SOURCE_PIN', pin.path);
  return bytes;
}

function validateInventory(inventory, context) {
  checkShape(inventory, schema);
  requireThat(context && context.sourceFiles && context.commit === inventory.snapshot.commit && context.tree === inventory.snapshot.tree, 'SOURCE_BINDING', 'snapshot context differs');
  requireThat(inventory.snapshot.registry.path === 'data/registry/canonical-registry.json' && inventory.snapshot.rawRegistry.path === 'assets/js/components/tool-registry.js', 'SOURCE_BINDING', 'use genuine registry owners');
  const registry = JSON.parse(sourceBytes(inventory.snapshot.registry, context));
  sourceBytes(inventory.snapshot.rawRegistry, context);
  requireThat(Array.isArray(registry.tools) && Array.isArray(registry.proApps), 'CATALOGUE', 'expected genuine normalized arrays');
  const byId = new Map();
  for (const row of registry.tools) {
    requireThat(typeof row.id === 'string' && !byId.has(row.id), 'CATALOGUE', 'duplicate or missing source ID');
    requireThat(Array.isArray(row.localeCoverage) && typeof row.canonicalRoute === 'string', 'CATALOGUE', row.id);
    byId.set(row.id, row);
  }
  const eligible = [], exclusions = [];
  for (const row of registry.tools) {
    let reason = null;
    if (row.publicationStatus === 'redirect') reason = 'redirect';
    else if (row.publicationStatus === 'unpublished' && row.source && row.source.compatibilityTargetId) reason = 'unpublished-compatibility';
    else if (row.publicationStatus === 'published' && row.localeCoverage.includes('en') && row.canonicalRoute === '/pro/') reason = 'english-pro-landing';
    else requireThat(row.publicationStatus === 'published' && row.deprecated === false && ['free', 'free-and-pro'].includes(row.availability), 'CENSUS_SCOPE', 'new source disposition needs review: ' + row.id);
    if (reason) exclusions.push({ id: row.id, route: row.canonicalRoute, reason });
    else eligible.push(row);
  }
  const english = eligible.filter(row => row.localeCoverage.includes('en'));
  const counts = { raw: registry.tools.length, eligible: eligible.length, english: english.length, localized: eligible.length - english.length, freeEnglish: english.filter(row => row.availability === 'free').length, freeAndProEnglish: english.filter(row => row.availability === 'free-and-pro').length, separateProApps: registry.proApps.length };
  requireThat(same(counts, inventory.snapshot.expectedCounts), 'DENOMINATOR_DRIFT', JSON.stringify(counts));
  const sortExclusions = rows => rows.slice().sort((a, b) => a.id.localeCompare(b.id));
  requireThat(same(sortExclusions(exclusions), sortExclusions(inventory.snapshot.exclusions)), 'EXCLUSION_DRIFT', 'explicit source exclusions differ');
  requireThat(new Set(english.map(row => normalizeRoute(row.canonicalRoute))).size === english.length, 'CATALOGUE', 'duplicate English destination');

  function evidence(rows) {
    for (const row of rows) requireThat(sourceBytes(row.pin, context).toString('utf8').includes(row.literal), 'SOURCE_LITERAL', row.pin.path);
  }
  const families = new Map(), members = new Map(), routes = new Set(), ids = new Set(), ambiguities = new Map();
  for (const row of inventory.families) {
    requireThat(!families.has(row.appFamilyId), 'DUPLICATE_FAMILY', row.appFamilyId);
    evidence(row.sourceEvidence); families.set(row.appFamilyId, row);
  }
  for (const row of inventory.members) {
    const route = normalizeRoute(row.route);
    requireThat(!members.has(row.key), 'DUPLICATE_MEMBER', row.key);
    requireThat(!routes.has(route), 'AMBIGUOUS_MEMBERSHIP', row.route);
    members.set(row.key, row); routes.add(route); evidence(row.sourceEvidence);
    if (row.catalogueId !== null) {
      requireThat(!ids.has(row.catalogueId), 'AMBIGUOUS_MEMBERSHIP', row.catalogueId); ids.add(row.catalogueId);
      const actual = byId.get(row.catalogueId);
      requireThat(actual && normalizeRoute(row.role === 'alias' ? actual.route : actual.canonicalRoute) === route && actual.localeCoverage.includes(row.locale), 'CATALOGUE_JOIN', row.key);
      requireThat(row.variant !== 'source-only', 'CATALOGUE_JOIN', 'catalogued member cannot be source-only');
      if (row.role !== 'alias') requireThat(row.sourceEvidence.some(item => item.kind === 'page-owner' && normalizeRoute('/' + item.pin.path) === route), 'MEMBER_OWNER', row.key);
      if (row.role === 'app') requireThat(eligible.includes(actual), 'PAID_OR_ALIAS_APP', row.key);
      if (row.role === 'alias') requireThat(actual.redirectTarget && actual.redirectTarget.route === row.targetRoute, 'ALIAS_TARGET', row.key);
      if (row.role === 'pro-only') requireThat(actual.canonicalRoute === '/pro/' || actual.availability === 'pro', 'PRO_ROLE', row.key);
      requireThat(same(row.countryIds.slice().sort(), actual.applicability.countryIds.slice().sort()), 'CONTEXT_DRIFT', row.key);
    } else {
      requireThat(row.variant === 'source-only' && !registry.tools.some(actual => normalizeRoute(actual.canonicalRoute) === route), 'SOURCE_ONLY_IDENTITY', row.key);
      requireThat(row.sourceEvidence.some(item => item.kind === 'page-owner' && normalizeRoute('/' + item.pin.path) === route), 'SOURCE_ONLY_IDENTITY', 'route has no actual page owner');
      requireThat(row.role !== 'alias', 'ALIAS_TARGET', 'source-only alias needs separately admitted route authority');
      if (row.role === 'pro-only') requireThat(registry.proApps.some(app => normalizeRoute(app.route) === route), 'PRO_ROLE', row.key);
    }
    if (row.appFamilyId !== null) requireThat(families.has(row.appFamilyId), 'DANGLING_FAMILY', row.key);
    if (row.role === 'app') {
      requireThat(row.appFamilyId !== null, 'DANGLING_FAMILY', row.key);
      requireThat(families.get(row.appFamilyId).sourceEvidence.some(owner => owner.kind === 'page-owner' && row.sourceEvidence.some(member => member.kind === 'page-owner' && member.pin.gitBlob === owner.pin.gitBlob && member.pin.path === owner.pin.path)), 'FAMILY_AUTHORITY', 'shared helper/title/slug is not a workflow-family contract');
      requireThat(same(row.requirements.map(item => item.kind).sort(), ['accessibility', 'error', 'export', 'happy', 'privacy', 'recovery']), 'ACCEPTANCE_REQUIREMENTS', row.key);
    } else requireThat(row.requirements.length === 0, 'NON_APP_ACCEPTANCE', row.key);
    if (row.role === 'alias') requireThat(typeof row.targetRoute === 'string' && row.targetRoute !== row.route && row.appFamilyId !== null, 'ALIAS_TARGET', row.key);
    else requireThat(!Object.hasOwn(row, 'targetRoute'), 'ALIAS_TARGET', row.key);
    if (['hub', 'reference', 'collection', 'pro-only', 'discovery', 'unresolved'].includes(row.role)) requireThat(row.appFamilyId === null, 'NON_APP_FAMILY', row.key);
  }
  for (const row of inventory.ambiguities) {
    requireThat(!ambiguities.has(row.key), 'DUPLICATE_AMBIGUITY', row.key); ambiguities.set(row.key, row);
    for (const key of row.memberKeys) requireThat(members.has(key), 'DANGLING_AMBIGUITY', key);
  }
  for (const row of inventory.families) {
    requireThat(inventory.members.some(member => member.role === 'app' && member.appFamilyId === row.appFamilyId), 'EMPTY_FAMILY', row.appFamilyId);
    for (const key of row.ambiguityKeys) requireThat(ambiguities.has(key), 'DANGLING_AMBIGUITY', key);
  }
  for (const row of inventory.members) {
    if (row.role === 'unresolved') requireThat(inventory.ambiguities.some(item => item.memberKeys.includes(row.key)), 'DANGLING_AMBIGUITY', row.key);
    if (row.role === 'alias') {
      let actual = byId.get(row.catalogueId); const seen = new Set();
      while (actual && actual.redirectTarget) {
        requireThat(!seen.has(actual.id), 'ALIAS_TARGET', 'cycle'); seen.add(actual.id);
        actual = byId.get(actual.redirectTarget.toolId);
      }
      requireThat(actual && eligible.includes(actual) && inventory.members.some(member => member.role === 'app' && member.catalogueId === actual.id && member.appFamilyId === row.appFamilyId), 'ALIAS_TARGET', 'must resolve to an explicitly declared app member');
    }
  }
  // A source/role declaration and an owner pin cannot certify a workflow. V1
  // intentionally does not accept passing states or compute a completion ratio.
  return {
    coverage: 'partial', counts, proposedFamilyCount: families.size,
    memberRoles: Object.fromEntries([...new Set(inventory.members.map(row => row.role))].sort().map(role => [role, inventory.members.filter(row => row.role === role).length])),
    cataloguedSeedCount: ids.size, sourceOnlySeedCount: inventory.members.length - ids.size,
    eligibleEntriesWithoutSeedDisposition: eligible.filter(row => !ids.has(row.id)).length,
    requirementStates: { unknown: inventory.members.flatMap(row => row.requirements).filter(row => row.state === 'unknown').length, blocked: inventory.members.flatMap(row => row.requirements).filter(row => row.state === 'blocked').length },
    globalFamilyTotal: null, completedFamilies: null, remainingFamilies: null, completionPercentage: null,
    qualification: 'Proposed identities and acceptance requirements only; source pins do not establish functioning apps or a closed global denominator.'
  };
}

module.exports = { validateInventory, checkShape };
