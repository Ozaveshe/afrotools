'use strict';
const crypto = require('node:crypto');
const schema = require('../../data/registry/free-app-families.schema.json');
const hash = (algorithm, bytes) => crypto.createHash(algorithm).update(bytes).digest('hex');
const fail = (code, detail) => { throw new Error(code + ': ' + detail); };
const requireThat = (condition, code, detail) => { if (!condition) fail(code, detail); };
// Identity retains query order/values and app subpages. Only the existing
// index.html/directory spelling equivalence is retained for membership identity.
function normalizeRoute(route) {
  const parts = /^([^?#]*)([?#].*)?$/.exec(route);
  return (parts[1].replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/') + (parts[2] || '');
}

// Match the maintained static server's literal index/file candidates, without
// merging the workflows represented by different routes or choosing ambiguous owners.
function routeOwnerCandidates(route) {
  if (typeof route !== 'string' || !route.startsWith('/') || route.startsWith('//')) return [];
  const pathname = route.split(/[?#]/)[0];
  if (/\\|%|\/{2}|(?:^|\/)\.{1,2}(?:\/|$)/.test(pathname)) return [];
  if (pathname === '/') return ['index.html'];
  const relative = pathname.slice(1);
  if (relative.endsWith('/')) return [relative + 'index.html'];
  if (/\.[^/]+$/.test(relative)) return [relative];
  return [relative + '/index.html', relative + '.html'];
}
function resolveRouteOwner(route, paths) {
  const candidates = routeOwnerCandidates(route), available = paths instanceof Set ? paths : new Set(paths);
  const existing = candidates.filter(candidate => available.has(candidate));
  return {status: existing.length === 1 ? 'resolved' : existing.length > 1 ? 'ambiguous' : 'unresolved',
    owner: existing.length === 1 ? existing[0] : null, candidates, existing,
    resolverPreferred: existing[0] || null};
}
// Read actual markup attributes; data-rel, data-href and quoted text are not
// canonical authority. This is a bounded source verifier, not an HTML renderer.
function canonicalLinkHrefs(html) {
  const links = [], space = ch => /[ \t\r\n\f]/.test(ch);
  let at = 0;
  while ((at = html.indexOf('<', at)) !== -1) {
    if (html.startsWith('<!--', at)) {
      const end = html.indexOf('-->', at + 4);
      if (end === -1) return null;
      at = end + 3; continue;
    }
    const opening = /^<\/?([a-z][a-z0-9:-]*)/i.exec(html.slice(at));
    if (!opening) { at += 1; continue; }
    const closing = html[at + 1] === '/', name = opening[1].toLowerCase();
    let end = at + opening[0].length, quote = null;
    for (; end < html.length; end += 1) {
      const ch = html[end];
      if (quote) { if (ch === quote) quote = null; }
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '>') break;
    }
    if (end === html.length) return null;
    const body = html.slice(at + opening[0].length, end);
    at = end + 1;
    if (closing) continue;
    if (['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes'].includes(name)) {
      const rawEnd = new RegExp('</' + name + '\\s*>', 'ig');
      rawEnd.lastIndex = at; const match = rawEnd.exec(html);
      if (!match) return null;
      at = rawEnd.lastIndex; continue;
    }
    if (name !== 'link') continue;
    const attrs = Object.create(null);
    let i = 0;
    while (i < body.length) {
      if (!space(body[i])) {
        if (body.slice(i).trim() === '/') break;
        return null;
      }
      while (i < body.length && space(body[i])) i += 1;
      if (i === body.length || body.slice(i).trim() === '/') break;
      const attr = /^[^\s"'<>/=]+/.exec(body.slice(i));
      if (!attr) return null;
      const key = attr[0].toLowerCase(); i += attr[0].length;
      const afterName = i;
      if (Object.hasOwn(attrs, key)) return null;
      while (i < body.length && space(body[i])) i += 1;
      let value = '';
      if (body[i] === '=') {
        i += 1; while (i < body.length && space(body[i])) i += 1;
        if (body[i] === '"' || body[i] === "'") {
          const delimiter = body[i++], valueStart = i, valueEnd = body.indexOf(delimiter, i);
          if (valueEnd === -1) return null;
          value = body.slice(valueStart, valueEnd); i = valueEnd + 1;
        } else {
          const unquoted = /^[^\s"'<=\x60>]+/.exec(body.slice(i));
          if (!unquoted) return null;
          value = unquoted[0]; i += value.length;
        }
      } else i = afterName;
      attrs[key] = value;
    }
    if ((attrs.rel || '').toLowerCase().split(/[ \t\r\n\f]+/).includes('canonical')) {
      if (!attrs.href) return null;
      links.push(attrs.href);
    }
  }
  return links;
}

function pageOwnerMatches(pin, route, context) {
  const pathname = route.split(/[?#]/)[0];
  const extensionless = pathname !== '/' && !pathname.endsWith('/') && !/\.[^/]+$/.test(pathname);
  if (extensionless || context.routeOwnerPaths) {
    if (!context.routeOwnerPaths) return false;
    const resolved = resolveRouteOwner(route, context.routeOwnerPaths);
    if (resolved.status !== 'resolved' || resolved.owner !== pin.path) return false;
  }
  if (normalizeRoute('/' + pin.path) === normalizeRoute(pathname)) return true;
  // A flat .html owner needs its own exact canonical declaration, not suffix guessing.
  if (!pin.path.endsWith('.html') || !routeOwnerCandidates(route).includes(pin.path)) return false;
  const canonicals = canonicalLinkHrefs(sourceBytes(pin, context).toString('utf8'));
  if (!canonicals || canonicals.length !== 1) return false;
  try {
    const canonical = new URL(canonicals[0], 'https://afrotools.com');
    return canonical.origin === 'https://afrotools.com' && normalizeRoute(canonical.pathname) === normalizeRoute(pathname);
  } catch (_) { return false; }
}
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

function catalogueInventory(registry) {
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
  return { byId, eligible, exclusions, english, counts };
}

function validateInventory(inventory, context) {
  checkShape(inventory, schema);
  requireThat(context && context.sourceFiles && context.commit === inventory.snapshot.commit && context.tree === inventory.snapshot.tree, 'SOURCE_BINDING', 'snapshot context differs');
  requireThat(inventory.snapshot.registry.path === 'data/registry/canonical-registry.json' && inventory.snapshot.rawRegistry.path === 'assets/js/components/tool-registry.js', 'SOURCE_BINDING', 'use genuine registry owners');
  const registry = JSON.parse(sourceBytes(inventory.snapshot.registry, context));
  sourceBytes(inventory.snapshot.rawRegistry, context);
  const { byId, eligible, exclusions, english, counts } = catalogueInventory(registry);
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
      if (row.role !== 'alias') requireThat(row.sourceEvidence.some(item => item.kind === 'page-owner' && pageOwnerMatches(item.pin, row.route, context)), 'MEMBER_OWNER', row.key);
      if (row.role === 'app') requireThat(eligible.includes(actual), 'PAID_OR_ALIAS_APP', row.key);
      if (row.role === 'alias') requireThat(actual.redirectTarget && actual.redirectTarget.route === row.targetRoute, 'ALIAS_TARGET', row.key);
      if (row.role === 'pro-only') requireThat(actual.canonicalRoute === '/pro/' || actual.availability === 'pro', 'PRO_ROLE', row.key);
      requireThat(same(row.countryIds.slice().sort(), actual.applicability.countryIds.slice().sort()), 'CONTEXT_DRIFT', row.key);
    } else {
      requireThat(row.variant === 'source-only' && !registry.tools.some(actual => normalizeRoute(actual.canonicalRoute) === route), 'SOURCE_ONLY_IDENTITY', row.key);
      requireThat(row.sourceEvidence.some(item => item.kind === 'page-owner' && pageOwnerMatches(item.pin, row.route, context)), 'SOURCE_ONLY_IDENTITY', 'route has no actual page owner');
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


function reviewedDocument(document) {
  requireThat(document && typeof document.payloadText === 'string', 'ROLE_SNAPSHOT', 'lossless payload text required');
  const bytes = Buffer.from(document.payloadText, 'utf8');
  requireThat(bytes.length === document.raw.bytes && hash('sha256', bytes) === document.raw.sha256, 'ROLE_PAYLOAD', document.name);
  return JSON.parse(document.payloadText);
}
function sourceRoleRows(snapshot) {
  checkShape(snapshot, schema.$defs.sourceRoleSnapshot);
  requireThat(snapshot.cohorts.length === snapshot.acceptance.cohortRows.length, 'ROLE_COVERAGE', 'cohort count differs');
  const rootReview = reviewedDocument({name:'root-acceptance', raw:snapshot.acceptance.pin, payloadText:snapshot.acceptance.recordText});
  requireThat(rootReview.rootActual.originalUnresolvedEnglishPool === snapshot.acceptance.expectedRows && rootReview.rootActual.sevenFrozenDispositionsVerified === snapshot.cohorts.length, 'ROLE_ACCEPTANCE', 'Root accepted coverage differs');
  const rows = [], ids = new Set(), roles = {}, requirements = {}, cohorts = [];
  for (const [position, cohort] of snapshot.cohorts.entries()) {
    const payload = reviewedDocument(cohort), indexes = {};
    for (const item of cohort.evidenceIndexes) {
      requireThat(!Object.hasOwn(indexes, item.name), 'ROLE_EVIDENCE', 'duplicate evidence index');
      indexes[item.name] = reviewedDocument(item);
    }
    requireThat(Array.isArray(payload.rows) && payload.rows.length === snapshot.acceptance.cohortRows[position], 'ROLE_COVERAGE', cohort.name);
    for (const row of payload.rows) {
      requireThat(typeof row.catalogueId === 'string' && typeof row.route === 'string' && !ids.has(row.catalogueId), 'ROLE_IDENTITY', 'missing or duplicate reviewed ID');
      ids.add(row.catalogueId);
      requireThat(typeof row.proposedRole === 'string', 'ROLE_IDENTITY', 'role missing');
      roles[row.proposedRole] = (roles[row.proposedRole] || 0) + 1;
      let required;
      if (row.requirementStates) required = Object.entries(row.requirementStates).map(([kind, state]) => ({kind, state}));
      else required = row.requirements;
      requireThat(Array.isArray(required) && same(required.map(item => item.kind).sort(), ['accessibility','error','export','happy','privacy','recovery']), 'ROLE_REQUIREMENTS', row.catalogueId);
      for (const item of required) {
        requireThat(item.state === 'unknown', 'ROLE_REQUIREMENTS', 'source evidence cannot certify a functional verdict');
        requirements[item.kind] = (requirements[item.kind] || 0) + 1;
      }
      const indexedRows = Array.isArray(indexes.sourceRows) ? indexes.sourceRows : indexes.sourceRows && indexes.sourceRows.rows;
      for (const field of ['evidenceOrdinal','controllerEvidenceOrdinal','allDirectSourcePinsOrdinal']) {
        if (!Object.hasOwn(row, field)) continue;
        const ordinal = row[field], linked = Number.isSafeInteger(ordinal) && ordinal >= 0 && indexedRows && indexedRows[ordinal];
        requireThat(linked && (linked.catalogueId || linked.catalogue && linked.catalogue.id) === row.catalogueId, 'ROLE_EVIDENCE', row.catalogueId + ' ' + field);
      }
      if (Object.hasOwn(row, 'inlineEvidenceOrdinals')) {
        const linked = indexedRows && indexedRows.find(item => item.catalogueId === row.catalogueId);
        requireThat(linked && Array.isArray(row.inlineEvidenceOrdinals) && row.inlineEvidenceOrdinals.every(ordinal => linked.inlineControllers.some(item => item.ordinal === ordinal)), 'ROLE_EVIDENCE', row.catalogueId + ' inline ordinals');
      }
      if (row.controllerEvidencePaths) {
        const pins = [].concat(indexes.sourceRows && indexes.sourceRows.externalOwners || [], indexes.controllerBoundaries && indexes.controllerBoundaries.records || []);
        requireThat(row.controllerEvidencePaths.every(path => pins.some(pin => pin.path === path)), 'ROLE_EVIDENCE', row.catalogueId + ' controller paths');
      }
      if (Object.hasOwn(row, 'allDirectSourcePinsOrdinal')) {
        const direct = indexes.directPins, paths = direct && direct.directLocalByCatalogueId[row.catalogueId];
        requireThat(Array.isArray(paths) && paths.every(path => direct.rows.some(pin => pin.path === path)), 'ROLE_EVIDENCE', row.catalogueId + ' direct source pins');
      }
      rows.push(row);
    }
    cohorts.push({name:cohort.name, reviewedRows:payload.rows.length, raw:cohort.raw, compressedSource:cohort.source});
  }
  requireThat(rows.length === snapshot.acceptance.expectedRows, 'ROLE_COVERAGE', 'accepted total differs');
  return { rows, cohorts, roles, requirements };
}
function reportInventory(inventory, registry, snapshot, currentRegistrySHA256) {
  checkShape(inventory, schema);
  const catalogue = catalogueInventory(registry), reviewed = sourceRoleRows(snapshot);
  const current = new Map(catalogue.english.map(row => [row.id, row])), missing = [], routeDrift = [];
  for (const row of reviewed.rows) {
    const actual = current.get(row.catalogueId);
    if (!actual) missing.push(row.catalogueId);
    else if (actual.canonicalRoute !== row.route) routeDrift.push({id:row.catalogueId, reviewed:row.route, current:actual.canonicalRoute});
  }
  return {
    catalogue: { ...catalogue.counts, explicitExcludedEntries:catalogue.exclusions.length, meaning:'Registered destinations and declared availability, not distinct apps.' },
    installedFamilyModel: { coverage:inventory.coverage, proposedFamilies:inventory.families.length, requirementStates:inventory.members.flatMap(row => row.requirements).reduce((counts,row) => { counts[row.state]=(counts[row.state]||0)+1;return counts; },{}), qualification:'Installed declarations only; source compatibility and functional behavior are not certified by this report.' },
    historicalRoleReview: { status:snapshot.status, reviewedRows:reviewed.rows.length, cohorts:reviewed.cohorts, roleLabels:reviewed.roles, unknownRequirementsByKind:reviewed.requirements, acceptance:snapshot.acceptance.pin, familyIdentityStatus:'proposed-not-adopted-equivalence', qualification:'Historical accepted source-role coverage; heterogeneous roles and requirement forms are preserved, never added to the catalogue population or counted as completed apps.' },
    currentCompatibility: { registryMatchesFamilySnapshot:currentRegistrySHA256 === inventory.snapshot.registry.sha256, currentRegistrySHA256, roleIdsAbsentFromCurrentEnglish:missing, roleRouteDrift:routeDrift, ownerContext:'not-assessed', qualification:'ID/route joins and registry digest only. Historical source-owner bindings have not been revalidated; changed registry/owners require explicit delta review.' },
    functional: {uniqueApps:null,completedApps:null,remainingApps:null,completionPercentage:null,reason:'No closed family job set or independent happy/error/export/recovery/accessibility/privacy acceptance.'}
  };
}
if (require.main === module) {
  const fs = require('node:fs'), path = require('node:path'), root = path.resolve(__dirname, '../..');
  requireThat(process.argv.length === 3 && process.argv[2] === '--report', 'REPORT_ARGUMENT', 'use --report');
  const registryBytes = fs.readFileSync(path.join(root, 'data/registry/canonical-registry.json'));
  const inventory = JSON.parse(fs.readFileSync(path.join(root, 'data/registry/free-app-families.json'), 'utf8'));
  const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'data/registry/free-app-source-role-review.json'), 'utf8'));
  console.log(JSON.stringify(reportInventory(inventory, JSON.parse(registryBytes), snapshot, hash('sha256', registryBytes)), null, 2));
}

module.exports = { validateInventory, normalizeRoute, routeOwnerCandidates, resolveRouteOwner, reportInventory, checkShape };
