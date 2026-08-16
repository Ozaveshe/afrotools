#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_ROOT = 'C:/Users/Oza/.codex/automations';
const STATUSES = new Set(['ready', 'no_change', 'live_only', 'blocked', 'quarantined', 'consumed']);
const CHANGE_KINDS = new Set(['repository', 'live_data', 'report_only', 'none']);
const RISK_LEVELS = new Set(['low', 'medium', 'high', 'critical']);
const VALIDATION_STATUSES = new Set(['pass', 'fail', 'not_run']);
const HANDOFF_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const DEPENDENCY_SHARED_SOURCE_FILES = new Set([
  'blog/index.html',
  'data/content/blog-article-manifest.json',
]);
const DEPENDENCY_SHARED_CONFLICT_KEYS = new Set([
  'blog:hub',
  'blog:manifest',
  'blog:feed',
]);

function isIsoDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isSha(value) {
  return typeof value === 'string' && /^[0-9a-f]{7,40}$/i.test(value);
}

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim());
}

function validateHandoff(item) {
  const errors = [];
  const requiredStrings = ['handoff_id', 'automation_id', 'run_id', 'summary'];
  if (item.schema_version !== 1) errors.push('schema_version must be 1');
  for (const field of requiredStrings) {
    if (typeof item[field] !== 'string' || !item[field].trim()) errors.push(`${field} must be a non-empty string`);
  }
  if (!isIsoDate(item.created_at)) errors.push('created_at must be an ISO date-time');
  if (!isIsoDate(item.updated_at)) errors.push('updated_at must be an ISO date-time');
  if (isIsoDate(item.created_at) && isIsoDate(item.updated_at) && Date.parse(item.updated_at) < Date.parse(item.created_at)) {
    errors.push('updated_at must not be earlier than created_at');
  }
  if (typeof item.handoff_id === 'string' && !HANDOFF_ID_PATTERN.test(item.handoff_id)) {
    errors.push('handoff_id must use lowercase letters, numbers, and hyphens only');
  }
  if (typeof item.automation_id === 'string' && !HANDOFF_ID_PATTERN.test(item.automation_id)) {
    errors.push('automation_id must use lowercase letters, numbers, and hyphens only');
  }
  if (!STATUSES.has(item.status)) errors.push(`status must be one of ${Array.from(STATUSES).join(', ')}`);
  if (!CHANGE_KINDS.has(item.change_kind)) errors.push(`change_kind must be one of ${Array.from(CHANGE_KINDS).join(', ')}`);
  if (typeof item.merge_candidate !== 'boolean') errors.push('merge_candidate must be boolean');

  for (const field of ['changed_files', 'source_files', 'generated_files', 'conflict_keys', 'dependencies', 'live_mutations']) {
    if (!isStringArray(item[field])) errors.push(`${field} must be an array of non-empty strings`);
    else if (new Set(item[field]).size !== item[field].length) errors.push(`${field} must not contain duplicates`);
  }
  if (Array.isArray(item.dependencies)) {
    item.dependencies.forEach((dependency, index) => {
      if (typeof dependency === 'string' && dependency.trim() && !HANDOFF_ID_PATTERN.test(dependency)) {
        errors.push(`dependencies[${index}] must be a handoff id, not prose, a URL, a package, or a file path`);
      }
    });
  }

  if (!Array.isArray(item.validations)) errors.push('validations must be an array');
  else {
    item.validations.forEach((check, index) => {
      if (!check || typeof check.command !== 'string' || !check.command.trim()) errors.push(`validations[${index}].command is required`);
      if (!check || !VALIDATION_STATUSES.has(check.status)) errors.push(`validations[${index}].status is invalid`);
      if (!check || typeof check.summary !== 'string') errors.push(`validations[${index}].summary must be a string`);
    });
  }

  if (!item.risk || !RISK_LEVELS.has(item.risk.level)) errors.push('risk.level is invalid');
  else {
    if (!Array.isArray(item.risk.reasons)) errors.push('risk.reasons must be an array');
    for (const field of ['touches_routes', 'touches_auth', 'touches_database', 'touches_generated_output']) {
      if (typeof item.risk[field] !== 'boolean') errors.push(`risk.${field} must be boolean`);
    }
  }

  if (!item.publisher || !Array.isArray(item.publisher.live_proof)) errors.push('publisher.live_proof must be an array');
  if (item.merge_candidate || (item.status === 'ready' && item.change_kind === 'repository')) {
    if (item.status !== 'ready') errors.push('repository merge candidates must have status ready');
    if (item.change_kind !== 'repository') errors.push('merge candidates must have change_kind repository');
    if (!isSha(item.base_sha)) errors.push('repository merge candidates require base_sha');
    if (typeof item.branch !== 'string' || !item.branch.trim()) errors.push('repository merge candidates require branch');
    if (!isSha(item.commit)) errors.push('repository merge candidates require commit');
    if (!item.source_files || item.source_files.length === 0) errors.push('repository merge candidates require source_files');
    if (item.validations && item.validations.some((check) => check.status === 'fail')) errors.push('merge candidates cannot contain failed validations');
    if (!item.validations || !item.validations.some((check) => check.status === 'pass')) {
      errors.push('merge candidates require at least one passing validation');
    }
    if (typeof item.branch === 'string' && typeof item.automation_id === 'string' && !item.branch.startsWith(`automation/${item.automation_id}-`)) {
      errors.push(`repository merge candidate branch must start with automation/${item.automation_id}-`);
    }
    if (item.producer && typeof item.producer === 'object') {
      if (typeof item.producer.worktree_path !== 'string' || !item.producer.worktree_path.trim()) {
        errors.push('producer.worktree_path is required');
      }
      if (!isIsoDate(item.producer.base_fetched_at)) errors.push('producer.base_fetched_at must be an ISO date-time');
      if (typeof item.producer.remote_ref !== 'string' || item.producer.remote_ref !== `refs/heads/${item.branch}`) {
        errors.push('producer.remote_ref must exactly match refs/heads/<branch>');
      }
      if (!isIsoDate(item.producer.cleanup_after)) errors.push('producer.cleanup_after must be an ISO date-time');
    }
    if (Array.isArray(item.source_files) && Array.isArray(item.generated_files)) {
      const source = new Set(item.source_files);
      const generated = new Set(item.generated_files);
      const overlap = Array.from(source).filter((file) => generated.has(file));
      if (overlap.length) errors.push('source_files and generated_files must not overlap');
      if (Array.isArray(item.changed_files)) {
        const declared = new Set([...source, ...generated]);
        const changed = new Set(item.changed_files);
        if (declared.size !== changed.size || Array.from(declared).some((file) => !changed.has(file))) {
          errors.push('changed_files must exactly equal source_files plus generated_files');
        }
      }
    }
  } else if (item.merge_candidate === false && item.status === 'ready') {
    errors.push('ready handoffs must be repository merge candidates');
  }

  if (item.status === 'blocked' && (typeof item.blocker !== 'string' || !item.blocker.trim())) {
    errors.push('blocked handoffs require blocker');
  }
  if (item.status === 'consumed') {
    if (!item.publisher || !isIsoDate(item.publisher.consumed_at)) errors.push('consumed handoffs require publisher.consumed_at');
    if (!item.publisher || !isSha(item.publisher.release_commit)) errors.push('consumed handoffs require publisher.release_commit');
    if (!item.publisher || typeof item.publisher.deploy_id !== 'string' || !item.publisher.deploy_id.trim()) {
      errors.push('consumed handoffs require publisher.deploy_id');
    }
    if (!item.publisher || !Array.isArray(item.publisher.live_proof) || item.publisher.live_proof.length === 0) {
      errors.push('consumed handoffs require publisher.live_proof');
    }
  }
  return errors;
}

function readHandoff(filePath) {
  const item = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return { filePath, item, errors: validateHandoff(item) };
}

function listHandoffFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name, 'handoff.json'))
    .filter((filePath) => fs.existsSync(filePath));
}

function buildQueue(records) {
  const valid = records.filter((record) => record.errors.length === 0);
  const readyByAge = valid
    .filter((record) => record.item.status === 'ready' && record.item.merge_candidate)
    .sort((a, b) => Date.parse(a.item.created_at) - Date.parse(b.item.created_at));
  const duplicateIds = [];
  const seenIds = new Map();
  for (const record of valid) {
    const previous = seenIds.get(record.item.handoff_id);
    if (previous) duplicateIds.push({ handoff_id: record.item.handoff_id, files: [previous, record.filePath] });
    else seenIds.set(record.item.handoff_id, record.filePath);
  }

  const allById = new Map(valid.map((record) => [record.item.handoff_id, record]));
  const readyById = new Map(readyByAge.map((record) => [record.item.handoff_id, record]));
  const dependencyIssues = [];
  const visiting = new Set();
  const visited = new Set();
  const ready = [];
  function visit(record, chain = []) {
    const id = record.item.handoff_id;
    if (visited.has(id)) return;
    if (visiting.has(id)) {
      dependencyIssues.push({ handoff_id: id, issue: `dependency cycle: ${chain.concat(id).join(' -> ')}` });
      return;
    }
    visiting.add(id);
    for (const dependencyId of record.item.dependencies) {
      const dependency = allById.get(dependencyId);
      if (!dependency) {
        dependencyIssues.push({ handoff_id: id, issue: `missing dependency ${dependencyId}` });
        continue;
      }
      if (dependency.item.status === 'consumed') continue;
      if (!readyById.has(dependencyId)) {
        dependencyIssues.push({ handoff_id: id, issue: `dependency ${dependencyId} is ${dependency.item.status}` });
        continue;
      }
      visit(dependency, chain.concat(id));
    }
    visiting.delete(id);
    visited.add(id);
    ready.push(record);
  }
  readyByAge.forEach((record) => visit(record));

  const ownersByFile = new Map();
  const ownersByConflictKey = new Map();
  const conflicts = [];
  function dependsOn(record, possibleDependencyId, seen = new Set()) {
    if (seen.has(record.item.handoff_id)) return false;
    seen.add(record.item.handoff_id);
    for (const dependencyId of record.item.dependencies) {
      if (dependencyId === possibleDependencyId) return true;
      const dependency = readyById.get(dependencyId);
      if (dependency && dependsOn(dependency, possibleDependencyId, seen)) return true;
    }
    return false;
  }
  function isExpectedSharedSurface(ownerId, record, key, allowedKeys) {
    if (!allowedKeys.has(key)) return false;
    const owner = readyById.get(ownerId);
    return !!owner && (dependsOn(record, ownerId) || dependsOn(owner, record.item.handoff_id));
  }
  for (const record of ready) {
    for (const file of record.item.source_files) {
      if (ownersByFile.has(file)) {
        const ownerId = ownersByFile.get(file);
        if (!isExpectedSharedSurface(ownerId, record, file, DEPENDENCY_SHARED_SOURCE_FILES)) {
          conflicts.push({ type: 'source_file', key: file, handoffs: [ownerId, record.item.handoff_id] });
        }
      } else {
        ownersByFile.set(file, record.item.handoff_id);
      }
    }
    for (const key of record.item.conflict_keys) {
      if (ownersByConflictKey.has(key)) {
        const ownerId = ownersByConflictKey.get(key);
        if (!isExpectedSharedSurface(ownerId, record, key, DEPENDENCY_SHARED_CONFLICT_KEYS)) {
          conflicts.push({ type: 'conflict_key', key, handoffs: [ownerId, record.item.handoff_id] });
        }
      } else {
        ownersByConflictKey.set(key, record.item.handoff_id);
      }
    }
  }
  return {
    ready: ready.map((record) => record.item),
    informational: valid.filter((record) => ['no_change', 'live_only', 'consumed'].includes(record.item.status)).map((record) => record.item),
    blocked: valid.filter((record) => record.item.status === 'blocked').map((record) => record.item),
    quarantined: valid.filter((record) => record.item.status === 'quarantined').map((record) => record.item),
    invalid: records.filter((record) => record.errors.length).map((record) => ({ file: record.filePath, errors: record.errors })),
    conflicts,
    duplicate_ids: duplicateIds,
    dependency_issues: dependencyIssues,
  };
}

function printQueue(queue, json) {
  if (json) {
    process.stdout.write(`${JSON.stringify(queue, null, 2)}\n`);
    return;
  }
  console.log(`ready=${queue.ready.length} informational=${queue.informational.length} blocked=${queue.blocked.length} quarantined=${queue.quarantined.length} invalid=${queue.invalid.length} conflicts=${queue.conflicts.length} duplicates=${queue.duplicate_ids.length} dependency_issues=${queue.dependency_issues.length}`);
  queue.ready.forEach((item, index) => console.log(`${index + 1}. ${item.handoff_id} ${item.commit} ${item.summary}`));
}

function main(argv) {
  const [command, target] = argv;
  const json = argv.includes('--json');
  if (command === 'validate') {
    if (!target) throw new Error('Usage: automation-handoff validate <handoff.json>');
    const record = readHandoff(path.resolve(target));
    if (record.errors.length) {
      record.errors.forEach((error) => console.error(error));
      process.exitCode = 1;
    } else console.log(`valid ${record.item.handoff_id}`);
    return;
  }
  if (command === 'scan') {
    const root = target && target !== '--json' ? path.resolve(target) : path.resolve(process.env.CODEX_AUTOMATIONS_DIR || DEFAULT_ROOT);
    const records = listHandoffFiles(root).map((filePath) => {
      try {
        const record = readHandoff(filePath);
        const folderId = path.basename(path.dirname(filePath));
        if (record.item.automation_id !== folderId) {
          record.errors.push(`automation_id must match the automation folder ${folderId}`);
        }
        return record;
      }
      catch (error) { return { filePath, item: null, errors: [`invalid JSON: ${error.message}`] }; }
    });
    const queue = buildQueue(records);
    printQueue(queue, json);
    if (queue.invalid.length || queue.conflicts.length || queue.duplicate_ids.length || queue.dependency_issues.length) process.exitCode = 1;
    return;
  }
  throw new Error('Usage: automation-handoff <validate handoff.json|scan [automations-root] [--json]>');
}

if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { validateHandoff, readHandoff, listHandoffFiles, buildQueue };
