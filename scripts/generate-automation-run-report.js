#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { StringDecoder } = require('string_decoder');
const { readHandoffRecords, reconcileRecords } = require('./automation-handoff');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const CODEX_HOME = process.env.CODEX_HOME || 'C:/Users/Oza/.codex';
const AUTOMATIONS_DIR = path.join(CODEX_HOME, 'automations');
const ARCHIVE_DIR = path.join(CODEX_HOME, 'archived_sessions');
const SESSIONS_DIR = path.join(CODEX_HOME, 'sessions');

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function* readJsonlLines(filePath, chunkSize = 1024 * 1024) {
  if (!fs.existsSync(filePath)) return;

  const size = Math.max(1, Number(chunkSize) || 1024 * 1024);
  const buffer = Buffer.allocUnsafe(size);
  const decoder = new StringDecoder('utf8');
  const descriptor = fs.openSync(filePath, 'r');
  let carry = '';

  try {
    let bytesRead = 0;
    while ((bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, null)) > 0) {
      const text = carry + decoder.write(buffer.subarray(0, bytesRead));
      let lineStart = 0;
      let lineEnd = text.indexOf('\n', lineStart);

      while (lineEnd !== -1) {
        let line = text.slice(lineStart, lineEnd);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line) yield line;
        lineStart = lineEnd + 1;
        lineEnd = text.indexOf('\n', lineStart);
      }

      carry = text.slice(lineStart);
    }

    carry += decoder.end();
    if (carry.endsWith('\r')) carry = carry.slice(0, -1);
    if (carry) yield carry;
  } finally {
    fs.closeSync(descriptor);
  }
}

function parseTomlString(text, key) {
  const match = text.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, 'm'));
  return match ? match[1] : null;
}

function parseAutomations() {
  if (!fs.existsSync(AUTOMATIONS_DIR)) return [];
  return fs
    .readdirSync(AUTOMATIONS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const tomlPath = path.join(AUTOMATIONS_DIR, entry.name, 'automation.toml');
      const text = readText(tomlPath);
      if (!text) return null;
      return {
        id: parseTomlString(text, 'id') || entry.name,
        name: parseTomlString(text, 'name') || entry.name,
        status: parseTomlString(text, 'status') || 'UNKNOWN',
        kind: parseTomlString(text, 'kind') || 'cron',
        rrule: parseTomlString(text, 'rrule') || '',
        executionEnvironment: parseTomlString(text, 'execution_environment') || '',
        hasMemory: fs.existsSync(path.join(AUTOMATIONS_DIR, entry.name, 'memory.md')),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));
}

function textFromContent(content) {
  if (!Array.isArray(content)) return '';
  return content
    .map((part) => part && (part.text || part.input_text || part.output_text || ''))
    .filter(Boolean)
    .join('\n');
}

function extractAutomation(text) {
  const id = (text.match(/Automation ID:\s*([A-Za-z0-9_-]+)/) || [])[1];
  if (!id) return null;
  const name = (text.match(/Automation:\s*([^\r\n]+)/) || [])[1] || id;
  const lastRun = (text.match(/Last run:\s*([^\r\n]+)/) || [])[1] || null;
  return { id, name, lastRun };
}

function classifyFlags(text) {
  const flags = [];
  if (/failed|failure|error/i.test(text)) flags.push('failure mentioned');
  if (/blocked/i.test(text)) flags.push('blocked mentioned');
  if (/timeout/i.test(text)) flags.push('timeout mentioned');
  if (/Playwright/i.test(text)) flags.push('Playwright mentioned');
  if (/Supabase RLS|RLS disabled|spatial_ref_sys/i.test(text)) flags.push('Supabase RLS advisory');
  return Array.from(new Set(flags));
}

function summarize(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 420)
    .trim();
}

function parseRollout(filePath) {
  const result = {
    filePath,
    sessionId: null,
    timestamp: null,
    cwd: null,
    automation: null,
    status: 'incomplete',
    summary: '',
    flags: [],
  };

  const flags = new Set();

  for (const line of readJsonlLines(filePath)) {
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    if (event.type === 'session_meta') {
      result.sessionId = event.payload && event.payload.id;
      result.timestamp = event.payload && event.payload.timestamp;
      result.cwd = event.payload && event.payload.cwd;
      continue;
    }

    if (event.type === 'event_msg' && event.payload) {
      if (event.payload.type === 'user_message') {
        const automation = extractAutomation(event.payload.message || '');
        if (automation) result.automation = automation;
      }
      if (event.payload.type === 'agent_message') {
        classifyFlags(event.payload.message || '').forEach((flag) => flags.add(flag));
        result.summary = event.payload.message || result.summary;
      }
      if (event.payload.type === 'task_complete') {
        result.status = event.payload.error ? 'failed' : 'completed';
        if (event.payload.last_agent_message) result.summary = event.payload.last_agent_message;
      }
      if (event.payload.type === 'turn_aborted') result.status = 'interrupted';
      if (event.payload.type === 'task_started') result.status = 'in progress';
      continue;
    }

    if (event.type === 'response_item' && event.payload) {
      const payload = event.payload;
      if (payload.type === 'message') {
        const text = textFromContent(payload.content);
        if (payload.role === 'user') {
          const automation = extractAutomation(text);
          if (automation) result.automation = automation;
        }
        if (payload.role === 'assistant') {
          classifyFlags(text).forEach((flag) => flags.add(flag));
          result.summary = text || result.summary;
        }
      }
    }
  }

  result.flags = Array.from(flags);
  result.summary = summarize(result.summary || (result.status === 'completed' ? 'task_complete captured; outcome needs receipt verification' : 'No terminal outcome captured'));
  return result.automation ? result : null;
}

function inRange(dateString, start, end) {
  const date = new Date(dateString);
  return Number.isFinite(date.getTime()) && date >= start && date < end;
}

function countBy(items, keyFn) {
  return items.reduce((counts, item) => {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function formatCounts(counts) {
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(', ') || 'none';
}

function findRollouts(root, start, end) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...findRollouts(filePath, start, end));
    else {
      const date = (entry.name.match(/^rollout-(\d{4}-\d{2}-\d{2})T.*\.jsonl$/) || [])[1];
      if (date && inRange(date, start, end)) files.push(filePath);
    }
  }
  return files;
}

function collectRuns(roots, start, end) {
  const runs = new Map();
  for (const filePath of roots.flatMap((root) => findRollouts(root, start, end))) {
    const run = parseRollout(filePath);
    if (!run || !inRange(run.timestamp, start, end)) continue;
    const key = run.sessionId || filePath;
    const previous = runs.get(key);
    if (!previous || fs.statSync(filePath).mtimeMs > fs.statSync(previous.filePath).mtimeMs) runs.set(key, run);
  }
  return Array.from(runs.values()).sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));
}

function writeReport() {
  const since = getArg('since', new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10));
  const until = getArg('until', new Date().toISOString().slice(0, 10));
  const generatedAt = new Date().toISOString();
  const start = new Date(`${since}T00:00:00.000Z`);
  const end = new Date(`${until}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);

  const automations = parseAutomations();
  const activeIds = new Set(automations.filter((item) => item.status === 'ACTIVE').map((item) => item.id));
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) throw new Error('Invalid report date range');
  const runs = collectRuns([ARCHIVE_DIR, SESSIONS_DIR], start, end);
  const receiptRecords = reconcileRecords(readHandoffRecords(AUTOMATIONS_DIR));
  const receipts = receiptRecords.filter((r) => !r.errors.length && inRange(r.item.updated_at, start, end)).map((r) => r.item);
  const latestReceipts = new Map();
  for (const receipt of receipts) {
    const previous = latestReceipts.get(receipt.automation_id);
    if (!previous || Date.parse(receipt.updated_at) > Date.parse(previous.updated_at)) latestReceipts.set(receipt.automation_id, receipt);
  }

  const runsById = new Map();
  for (const run of runs) {
    const id = run.automation.id;
    if (!runsById.has(id)) runsById.set(id, []);
    runsById.get(id).push(run);
  }

  const activeNoRun = Array.from(activeIds).filter((id) => !runsById.has(id) && !latestReceipts.has(id)).sort();
  const statusCounts = countBy(runs, (run) => run.status);
  const missingMemory = automations.filter((item) => item.status === 'ACTIVE' && !item.hasMemory).map((item) => item.id);
  const automationSummaries = automations.map((automation) => {
    const entries = runsById.get(automation.id) || [];
    const latest = entries[entries.length - 1] || null;
    return {
      id: automation.id,
      name: automation.name,
      status: automation.status,
      kind: automation.kind,
      latest_receipt: latestReceipts.has(automation.id) ? {
        handoff_id: latestReceipts.get(automation.id).handoff_id,
        timestamp: latestReceipts.get(automation.id).updated_at,
        status: latestReceipts.get(automation.id).status,
      } : null,
      rrule: automation.rrule,
      execution_environment: automation.executionEnvironment,
      has_memory: automation.hasMemory,
      run_count: entries.length,
      status_counts: countBy(entries, (run) => run.status),
      latest_run: latest
        ? {
            timestamp: latest.timestamp,
            status: latest.status,
            summary: latest.summary || '',
            flags: latest.flags,
            session_id: latest.sessionId,
            cwd: latest.cwd,
            archive_file: path.relative(CODEX_HOME, latest.filePath),
          }
        : null,
    };
  });

  const lines = [];
  lines.push(`# Automation Run Report - ${since} to ${until}`);
  lines.push('');
  lines.push(`Generated: ${generatedAt}`);
  lines.push(`Source archives: \`${ARCHIVE_DIR}\``);
  lines.push(`Active sessions: \`${SESSIONS_DIR}\``);
  lines.push('Receipt observations are separate from task completion and do not prove production. Missing retained evidence does not prove a missed scheduler fire.');
  lines.push(`Definitions: \`${AUTOMATIONS_DIR}\``);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Automation definitions: ${automations.length}.`);
  lines.push(`- Active definitions: ${automations.filter((item) => item.status === 'ACTIVE').length}.`);
  lines.push(`- Paused definitions: ${automations.filter((item) => item.status === 'PAUSED').length}.`);
  lines.push(`- Runs found in range: ${runs.length}.`);
  lines.push(`- Active run status: ${formatCounts(statusCounts)}.`);
  lines.push(`- Active automations without run evidence in range: ${activeNoRun.length}.`);
  lines.push(`- Active automations missing memory files: ${missingMemory.length}.`);
  lines.push('');
  lines.push('## Automation Run Summary');
  lines.push('');

  let index = 1;
  for (const automation of automations) {
    const entries = runsById.get(automation.id) || [];
    if (entries.length === 0) {
      const receipt = latestReceipts.get(automation.id);
      lines.push(`${index}. \`${automation.id}\` - ${automation.name} - 0 retained session run(s).${receipt ? ` Receipt: ${receipt.status} at ${receipt.updated_at}.` : ' No receipt in range.'}`);
    } else {
      const latest = entries[entries.length - 1];
      const counts = countBy(entries, (run) => run.status);
      const flags = latest.flags.length ? ` Flags: ${latest.flags.join(', ')}.` : '';
      lines.push(
        `${index}. \`${automation.id}\` - ${automation.name} - ${entries.length} run(s): {${formatCounts(counts)}}. Latest ${latest.timestamp.slice(0, 16).replace('T', ' ')}: ${latest.summary || '(no agent summary captured)'}${flags}`
      );
    }
    index += 1;
  }

  lines.push('');
  lines.push('## Recent Runs');
  lines.push('');
  for (const run of runs) {
    const flags = run.flags.length ? ` Flags: ${run.flags.join(', ')}.` : '';
    lines.push(
      `- ${run.timestamp.slice(0, 16).replace('T', ' ')} - \`${run.automation.id}\` - ${run.status}: ${run.summary || '(no agent summary captured)'}${flags}`
    );
  }

  lines.push('');
  lines.push('## No-Run Active Automation IDs');
  lines.push('');
  if (activeNoRun.length === 0) {
    lines.push('- None.');
  } else {
    for (const id of activeNoRun) lines.push(`- \`${id}\``);
  }

  lines.push('');
  lines.push('## Active Automations Missing Memory');
  lines.push('');
  if (missingMemory.length === 0) {
    lines.push('- None.');
  } else {
    for (const id of missingMemory) lines.push(`- \`${id}\``);
  }
  lines.push('');

  const outputDir = path.resolve(getArg('output-dir', REPORTS_DIR));
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `automation-run-report-${since}-to-${until}.md`);
  const jsonPath = path.join(outputDir, `automation-run-report-${since}-to-${until}.json`);
  const reportJson = {
    schema_version: 1,
    since,
    until,
    generated_at: generatedAt,
    sources: {
      archive_dir: ARCHIVE_DIR,
      sessions_dir: SESSIONS_DIR,
      definitions_dir: AUTOMATIONS_DIR,
    },
    summary: {
      automation_definitions: automations.length,
      active_definitions: automations.filter((item) => item.status === 'ACTIVE').length,
      paused_definitions: automations.filter((item) => item.status === 'PAUSED').length,
      runs_found: runs.length,
      receipt_observations: receipts.length,
      invalid_receipt_copies: receiptRecords.filter((r) => r.errors.length).length,
      active_run_status: statusCounts,
      active_without_run_evidence: activeNoRun.length,
      active_missing_memory: missingMemory.length,
    },
    automations: automationSummaries,
    recent_runs: runs.map((run) => ({
      timestamp: run.timestamp,
      automation_id: run.automation.id,
      automation_name: run.automation.name,
      status: run.status,
      summary: run.summary || '',
      flags: run.flags,
      session_id: run.sessionId,
      cwd: run.cwd,
      archive_file: path.relative(CODEX_HOME, run.filePath),
    })),
    no_run_active_automation_ids: activeNoRun,
    active_automations_missing_memory: missingMemory,
  };
  fs.writeFileSync(outputPath, `${lines.join('\n').trimEnd()}\n`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(reportJson, null, 2)}\n`);
  console.log(`Wrote ${path.relative(ROOT, outputPath)}`);
  console.log(`Wrote ${path.relative(ROOT, jsonPath)}`);
  console.log(`Runs found: ${runs.length}; active without run evidence: ${activeNoRun.length}; missing memory: ${missingMemory.length}`);
}

if (require.main === module) writeReport();

module.exports = { readJsonlLines, parseRollout, findRollouts, collectRuns, writeReport };
