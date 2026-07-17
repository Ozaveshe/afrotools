#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'data', 'automation', 'automation-registry.json');
const PUBLIC_CLAIM_REGISTRY_PATH = path.join(ROOT, 'data', 'audits', 'public-claim-registry.json');
const REPORTS_DIR = path.join(ROOT, 'reports');
const DEFAULT_CODEX_AUTOMATIONS_DIR = 'C:/Users/Oza/.codex/automations';
const CODEX_AUTOMATIONS_DIR = String(
  process.env.CODEX_AUTOMATIONS_DIR || DEFAULT_CODEX_AUTOMATIONS_DIR
).trim() || DEFAULT_CODEX_AUTOMATIONS_DIR;

const REQUIRED_FIELDS = [
  'id',
  'display_name',
  'runner',
  'production_required',
  'expected_schedule',
  'netlify_function',
  'github_workflow',
  'codex_automation_id',
  'sla_hours',
  'product_surface',
  'public_claims_supported',
  'live_data_tables_or_blobs',
  'health_endpoint',
  'owner_category',
  'severity_if_stale',
  'validation_commands',
];

const RUNNERS = new Set(['codex', 'netlify', 'github_actions', 'manual', 'mixed']);
const SEVERITIES = new Set(['p0', 'p1', 'p2', 'p3']);

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNetlifySchedules() {
  const text = readText(path.join(ROOT, 'netlify.toml'));
  const schedules = new Map();
  let currentFunction = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const section = rawLine.match(/^\s*\[functions\."([^"]+)"\]\s*$/);
    if (section) {
      currentFunction = section[1];
      continue;
    }

    if (/^\s*\[/.test(rawLine) && !section) {
      currentFunction = null;
      continue;
    }

    const schedule = rawLine.match(/^\s*schedule\s*=\s*"([^"]+)"\s*$/);
    if (currentFunction && schedule) {
      schedules.set(currentFunction, schedule[1]);
    }
  }

  return schedules;
}

function parsePackageScripts() {
  const packagePath = path.join(ROOT, 'package.json');
  if (!fs.existsSync(packagePath)) return new Set();
  const pkg = readJson(packagePath);
  return new Set(Object.keys(pkg.scripts || {}));
}

function parseGithubWorkflows() {
  const workflowsDir = path.join(ROOT, '.github', 'workflows');
  const workflows = new Map();
  if (!fs.existsSync(workflowsDir)) return workflows;

  for (const fileName of fs.readdirSync(workflowsDir)) {
    if (!/\.ya?ml$/i.test(fileName)) continue;
    const text = readText(path.join(workflowsDir, fileName));
    const crons = Array.from(text.matchAll(/cron:\s*['"]([^'"]+)['"]/g), (match) => match[1]);
    workflows.set(fileName, {
      path: path.join(workflowsDir, fileName),
      crons,
      hasSchedule: crons.length > 0,
    });
  }

  return workflows;
}

function parseCodexAutomationDefinitions() {
  const definitions = new Set();
  const statuses = new Map();
  const metadata = new Map();
  if (!fs.existsSync(CODEX_AUTOMATIONS_DIR)) {
    return { available: false, definitions, statuses, metadata };
  }

  for (const entry of fs.readdirSync(CODEX_AUTOMATIONS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const tomlPath = path.join(CODEX_AUTOMATIONS_DIR, entry.name, 'automation.toml');
    if (!fs.existsSync(tomlPath)) continue;
    const text = readText(tomlPath);
    const id = (text.match(/^id\s*=\s*"([^"]+)"/m) || [null, entry.name])[1];
    const status = (text.match(/^status\s*=\s*"([^"]+)"/m) || [null, 'UNKNOWN'])[1];
    const rrule = (text.match(/^rrule\s*=\s*"([^"]+)"/m) || [null, null])[1];
    const updatedAtRaw = (text.match(/^updated_at\s*=\s*(\d+)/m) || [null, null])[1];
    const updatedAt = updatedAtRaw ? new Date(Number(updatedAtRaw)) : null;
    definitions.add(id);
    statuses.set(id, status);
    metadata.set(id, {
      rrule,
      updatedAt: updatedAt && !Number.isNaN(updatedAt.valueOf()) ? updatedAt : null,
    });
  }

  return { available: true, definitions, statuses, metadata };
}

function findLatestAutomationReport() {
  if (!fs.existsSync(REPORTS_DIR)) return null;
  const reportNames = fs
    .readdirSync(REPORTS_DIR)
    .filter((fileName) => /^automation-run-report-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.md$/.test(fileName))
    .sort();

  if (reportNames.length === 0) return null;
  return path.join(REPORTS_DIR, reportNames[reportNames.length - 1]);
}

function parseAutomationRunReport() {
  const reportPath = findLatestAutomationReport();
  if (!reportPath) {
    return { available: false, path: null, seen: new Set(), noRun: new Set(), statuses: new Map(), latestRunAt: new Map(), generatedAt: null };
  }

  const jsonPath = reportPath.replace(/\.md$/, '.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const report = readJson(jsonPath);
      const seen = new Set();
      const noRun = new Set(report.no_run_active_automation_ids || []);
      const statuses = new Map();
      const latestRunAt = new Map();
      const generatedAt = report.generated_at ? new Date(report.generated_at) : null;

      for (const automation of report.automations || []) {
        if (!automation || !automation.id) continue;
        seen.add(automation.id);
        if (Number(automation.run_count || 0) === 0) noRun.add(automation.id);
        const latestRun = automation.latest_run || null;
        if (!latestRun) continue;
        const latestStatus = String(latestRun.status || '').trim().toLowerCase();
        const runAt = latestRun.timestamp ? new Date(latestRun.timestamp) : null;
        if (runAt && !Number.isNaN(runAt.valueOf())) latestRunAt.set(automation.id, runAt);
        if (/interrupted|in progress|incomplete|blocked|failed/i.test(latestStatus)) {
          statuses.set(automation.id, latestStatus);
        }
      }

      return {
        available: true,
        path: reportPath,
        jsonPath,
        seen,
        noRun,
        statuses,
        latestRunAt,
        generatedAt: generatedAt && !Number.isNaN(generatedAt.valueOf()) ? generatedAt : null,
      };
    } catch (error) {
      console.warn(`Warning: could not parse ${path.relative(ROOT, jsonPath)} as structured automation evidence: ${error.message}`);
    }
  }

  const text = readText(reportPath);
  const seen = new Set();
  const noRun = new Set();
  const statuses = new Map();
  const latestStatuses = new Map();
  const latestRunAt = new Map();
  const generatedMatch = text.match(/^Generated:\s+([^\n]+)$/m);
  const generatedAt = generatedMatch ? new Date(generatedMatch[1].trim()) : null;

  for (const match of text.matchAll(/^\d+\.\s+`([^`]+)`[^\n]*?-\s+(\d+)\s+run\(s\)(?::\s+\{([^}]+)\})?/gm)) {
    const id = match[1];
    const runCount = Number(match[2]);
    seen.add(id);
    if (runCount === 0) noRun.add(id);
  }

  const noRunSection = text.match(/## No-Run Active Automation IDs\s+([\s\S]*?)(?:\n## |\s*$)/);
  if (noRunSection) {
    for (const match of noRunSection[1].matchAll(/`([^`]+)`/g)) {
      noRun.add(match[1]);
      seen.add(match[1]);
    }
  }

  for (const match of text.matchAll(/^- (\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s+-\s+`([^`]+)` - ([^:]+):/gm)) {
    const runAt = new Date(`${match[1]}T${match[2]}:00Z`);
    const automationId = match[3];
    seen.add(automationId);
    latestStatuses.set(automationId, match[4].trim().toLowerCase());
    if (!Number.isNaN(runAt.valueOf())) latestRunAt.set(automationId, runAt);
  }

  for (const [id, status] of latestStatuses) {
    if (/interrupted|in progress|incomplete|blocked|failed/i.test(status)) {
      statuses.set(id, status);
    }
  }

  return { available: true, path: reportPath, seen, noRun, statuses, latestRunAt, generatedAt: generatedAt && !Number.isNaN(generatedAt.valueOf()) ? generatedAt : null };
}

function parseRRule(rrule) {
  if (!rrule) return null;
  const fields = Object.fromEntries(
    rrule.split(';').map((part) => {
      const [key, value] = part.split('=');
      return [key, value];
    }),
  );
  const hour = Number(fields.BYHOUR || 0);
  const minute = Number(fields.BYMINUTE || 0);
  const second = Number(fields.BYSECOND || 0);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || !Number.isFinite(second)) return null;
  return {
    freq: fields.FREQ || null,
    days: fields.BYDAY ? new Set(fields.BYDAY.split(',').filter(Boolean)) : null,
    hour,
    minute,
    second,
  };
}

function matchesRuleDay(date, rule) {
  if (rule.freq === 'DAILY' && !rule.days) return true;
  if (!rule.days || rule.days.size === 0) return true;
  const dayCode = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][date.getDay()];
  return rule.days.has(dayCode);
}

function scheduledCandidate(date, rule) {
  const candidate = new Date(date);
  candidate.setHours(rule.hour, rule.minute, rule.second, 0);
  return candidate;
}

function findScheduledAt(rrule, referenceDate, direction) {
  const rule = parseRRule(rrule);
  if (!rule || !referenceDate || Number.isNaN(referenceDate.valueOf())) return null;
  for (let offset = 0; offset <= 14; offset += 1) {
    const date = new Date(referenceDate);
    date.setDate(referenceDate.getDate() + (direction === 'next' ? offset : -offset));
    if (!matchesRuleDay(date, rule)) continue;
    const candidate = scheduledCandidate(date, rule);
    if (direction === 'next' && candidate > referenceDate) return candidate;
    if (direction !== 'next' && candidate <= referenceDate) return candidate;
  }
  return null;
}

function formatScheduleDate(date) {
  if (!date || Number.isNaN(date.valueOf())) return null;
  return date.toISOString().replace(/:\d{2}\.\d{3}Z$/, 'Z');
}

function waitingForPostUpdateRun(metadata, runReport) {
  if (!metadata || !metadata.updatedAt || !metadata.rrule || !runReport.generatedAt) return null;
  const latestScheduledAt = findScheduledAt(metadata.rrule, runReport.generatedAt, 'latest');
  if (!latestScheduledAt || metadata.updatedAt <= latestScheduledAt) return null;
  return {
    updatedAt: metadata.updatedAt,
    nextScheduledAt: findScheduledAt(metadata.rrule, metadata.updatedAt, 'next'),
  };
}

function postRunDefinitionUpdate(metadata, runReport, codexAutomationId) {
  if (!metadata || !metadata.updatedAt) return null;
  const latestRunAt = runReport.latestRunAt.get(codexAutomationId);
  if (!latestRunAt || metadata.updatedAt <= latestRunAt) return null;
  return {
    updatedAt: metadata.updatedAt,
    nextScheduledAt: metadata.rrule ? findScheduledAt(metadata.rrule, metadata.updatedAt, 'next') : null,
  };
}

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`Missing automation registry: ${path.relative(ROOT, REGISTRY_PATH)}`);
  }

  const registry = readJson(REGISTRY_PATH);
  const records = Array.isArray(registry) ? registry : registry.records;
  if (!Array.isArray(records)) {
    throw new Error('Automation registry must be an array or an object with a records array.');
  }

  return records;
}

function loadPublicClaimIds() {
  if (!fs.existsSync(PUBLIC_CLAIM_REGISTRY_PATH)) return new Set();
  const registry = readJson(PUBLIC_CLAIM_REGISTRY_PATH);
  const claims = Array.isArray(registry) ? registry : registry.claims || [];
  const ids = new Set();
  claims.forEach((claim) => {
    if (claim.key || claim.claim_id) ids.add(claim.key || claim.claim_id);
    normalizeList(claim.legacyKeys).forEach((legacyKey) => ids.add(legacyKey));
  });
  return ids;
}

function validateCommand(command, scripts, warnings, record) {
  const npmRun = command.match(/^npm run ([A-Za-z0-9:_-]+)/);
  if (npmRun && !scripts.has(npmRun[1])) {
    warnings.push(`${record.id}: validation command references missing package script "${npmRun[1]}".`);
    return;
  }

  const nodeFile = command.match(/^node(?: --check)? ([^\s]+\.js)$/);
  if (nodeFile && !fs.existsSync(path.join(ROOT, nodeFile[1]))) {
    warnings.push(`${record.id}: validation command references missing file ${nodeFile[1]}.`);
  }
}

function audit() {
  const records = loadRegistry();
  const netlifySchedules = parseNetlifySchedules();
  const packageScripts = parsePackageScripts();
  const workflows = parseGithubWorkflows();
  const codexDefinitions = parseCodexAutomationDefinitions();
  const runReport = parseAutomationRunReport();
  const publicClaimIds = loadPublicClaimIds();

  const failures = [];
  const warnings = [];
  const ids = new Set();
  const registeredNetlifyFunctions = new Set();
  const registeredCodexAutomationIds = new Set();

  if (!codexDefinitions.available) {
    warnings.push(
      `codex definitions unavailable at ${CODEX_AUTOMATIONS_DIR}; ` +
      'set CODEX_AUTOMATIONS_DIR to enable local definition checks.'
    );
  }

  for (const record of records) {
    for (const field of REQUIRED_FIELDS) {
      if (!(field in record)) {
        failures.push(`${record.id || '(missing id)'}: missing required field "${field}".`);
      }
    }

    if (record.id && ids.has(record.id)) failures.push(`${record.id}: duplicate registry id.`);
    if (record.id) ids.add(record.id);

    if (!RUNNERS.has(record.runner)) failures.push(`${record.id}: invalid runner "${record.runner}".`);
    if (!SEVERITIES.has(record.severity_if_stale)) {
      failures.push(`${record.id}: invalid severity_if_stale "${record.severity_if_stale}".`);
    }
    if (typeof record.production_required !== 'boolean') {
      failures.push(`${record.id}: production_required must be boolean.`);
    }
    if (typeof record.sla_hours !== 'number' || Number.isNaN(record.sla_hours)) {
      failures.push(`${record.id}: sla_hours must be numeric.`);
    }

    const netlifyFunctions = normalizeList(record.netlify_function);
    const githubWorkflows = normalizeList(record.github_workflow);
    const codexAutomationId = record.codex_automation_id || null;
    if (codexAutomationId) registeredCodexAutomationIds.add(codexAutomationId);

    if (record.production_required && record.runner === 'netlify' && netlifyFunctions.length === 0) {
      failures.push(`${record.id}: production Netlify automation must name netlify_function.`);
    }
    if (record.production_required && record.runner === 'github_actions' && githubWorkflows.length === 0) {
      failures.push(`${record.id}: production GitHub automation must name github_workflow.`);
    }
    if (record.production_required && record.runner === 'mixed' && netlifyFunctions.length === 0 && githubWorkflows.length === 0) {
      failures.push(`${record.id}: production mixed automation must name at least one production runner.`);
    }

    for (const functionName of netlifyFunctions) {
      registeredNetlifyFunctions.add(functionName);
      if (!netlifySchedules.has(functionName)) {
        const message = `${record.id}: Netlify schedule missing for "${functionName}".`;
        if (record.production_required) failures.push(message);
        else warnings.push(message);
      } else if (record.runner === 'netlify' && record.expected_schedule && record.expected_schedule !== netlifySchedules.get(functionName)) {
        const message = `${record.id}: registry expected_schedule "${record.expected_schedule}" does not match netlify.toml "${netlifySchedules.get(functionName)}".`;
        if (record.production_required) failures.push(message);
        else warnings.push(message);
      }
    }

    for (const workflowName of githubWorkflows) {
      if (!workflows.has(workflowName)) {
        const message = `${record.id}: GitHub workflow missing for "${workflowName}".`;
        if (record.production_required) failures.push(message);
        else warnings.push(message);
      }
    }

    if (codexAutomationId) {
      if (codexDefinitions.available && !codexDefinitions.definitions.has(codexAutomationId)) {
        warnings.push(`${record.id}: Codex automation id "${codexAutomationId}" is not present on disk.`);
      }
      const codexStatus = codexDefinitions.statuses.get(codexAutomationId);
      if (codexStatus !== 'PAUSED') {
        if (!runReport.available) {
          warnings.push(`${record.id}: no recent Codex run evidence report is available.`);
        } else if (!runReport.seen.has(codexAutomationId) || runReport.noRun.has(codexAutomationId)) {
          const waitState = waitingForPostUpdateRun(codexDefinitions.metadata.get(codexAutomationId), runReport);
          if (waitState) {
            const nextRun = formatScheduleDate(waitState.nextScheduledAt) || 'the next scheduled run';
            warnings.push(`${record.id}: no recent Codex run evidence in ${path.basename(runReport.path)}; definition was updated at ${formatScheduleDate(waitState.updatedAt)} after its last scheduled fire, so verify after ${nextRun}.`);
          } else {
            warnings.push(`${record.id}: no recent Codex run evidence in ${path.basename(runReport.path)}.`);
          }
        } else if (runReport.statuses.has(codexAutomationId)) {
          const updateState = postRunDefinitionUpdate(codexDefinitions.metadata.get(codexAutomationId), runReport, codexAutomationId);
          if (updateState) {
            const nextRun = formatScheduleDate(updateState.nextScheduledAt) || 'the next scheduled run';
            warnings.push(`${record.id}: latest report includes non-completed status "${runReport.statuses.get(codexAutomationId)}"; definition was updated at ${formatScheduleDate(updateState.updatedAt)} after that run, so verify after ${nextRun}.`);
          } else {
            warnings.push(`${record.id}: latest report includes non-completed status "${runReport.statuses.get(codexAutomationId)}".`);
          }
        }
      }
    }

    const supportedClaims = normalizeList(record.public_claims_supported);
    if (supportedClaims.length > 0) {
      const unknownClaims = supportedClaims.filter((claimId) => !publicClaimIds.has(claimId));
      if (publicClaimIds.size === 0) {
        warnings.push(`${record.id}: supports public claims, but public-claim registry is missing.`);
      } else if (unknownClaims.length > 0) {
        warnings.push(`${record.id}: public_claims_supported contains unregistered claim id(s): ${unknownClaims.join(', ')}.`);
      }
    }

    const validationCommands = normalizeList(record.validation_commands);
    if (validationCommands.length === 0) {
      warnings.push(`${record.id}: no validation_commands listed.`);
    } else {
      for (const command of validationCommands) {
        validateCommand(command, packageScripts, warnings, record);
      }
    }
  }

  for (const functionName of netlifySchedules.keys()) {
    if (!registeredNetlifyFunctions.has(functionName)) {
      warnings.push(`netlify:${functionName}: scheduled function is present in netlify.toml but not registered in automation-registry.json.`);
    }
  }

  if (codexDefinitions.available) {
    for (const codexId of codexDefinitions.definitions) {
      if (codexDefinitions.statuses.get(codexId) === 'ACTIVE' && !registeredCodexAutomationIds.has(codexId)) {
        warnings.push(`codex:${codexId}: active local Codex automation is present on disk but not registered in automation-registry.json.`);
      }
    }
  }

  const runnerCounts = records.reduce((counts, record) => {
    counts[record.runner] = (counts[record.runner] || 0) + 1;
    return counts;
  }, {});
  const productionCounts = records.reduce((counts, record) => {
    if (!record.production_required) return counts;
    counts[record.runner] = (counts[record.runner] || 0) + 1;
    return counts;
  }, {});

  console.log('Automation registry audit');
  console.log(`- Registry records: ${records.length}`);
  console.log(`- Netlify scheduled functions parsed: ${netlifySchedules.size}`);
  console.log(`- package.json scripts parsed: ${packageScripts.size}`);
  console.log(`- GitHub workflow files parsed: ${workflows.size}`);
  console.log(`- Codex definitions: ${codexDefinitions.available ? `${codexDefinitions.definitions.size} available` : 'unavailable'}`);
  console.log(`- Codex definitions directory: ${CODEX_AUTOMATIONS_DIR}`);
  console.log(`- Recent Codex run evidence: ${runReport.available ? path.relative(ROOT, runReport.path) : 'missing'}`);
  console.log(`- Records by runner: ${Object.entries(runnerCounts).map(([runner, count]) => `${runner}=${count}`).join(', ')}`);
  console.log(`- Production-required by runner: ${Object.entries(productionCounts).map(([runner, count]) => `${runner}=${count}`).join(', ') || 'none'}`);

  if (warnings.length) {
    console.warn('\nWarnings:');
    for (const warning of warnings) console.warn(`- ${warning}`);
  }

  if (failures.length) {
    console.error('\nFailures:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log('\nNo missing production runner schedules were found.');
  }
}

try {
  audit();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
