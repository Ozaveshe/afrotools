#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const CODEX_HOME = process.env.CODEX_HOME || 'C:/Users/Oza/.codex';
const AUTOMATIONS_DIR = path.join(CODEX_HOME, 'automations');
const ARCHIVE_DIR = path.join(CODEX_HOME, 'archived_sessions');

function getArg(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
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
    .slice(0, 420);
}

function parseRollout(filePath) {
  const lines = readText(filePath).split(/\r?\n/).filter(Boolean);
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

  const allText = [];
  const runtimeText = [];

  for (const line of lines) {
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
        allText.push(event.payload.message || '');
      }
      if (event.payload.type === 'agent_message') {
        allText.push(event.payload.message || '');
        runtimeText.push(event.payload.message || '');
        result.summary = event.payload.message || result.summary;
      }
      if (event.payload.type === 'task_complete') {
        result.status = 'completed';
        if (event.payload.last_agent_message) result.summary = event.payload.last_agent_message;
      }
      continue;
    }

    if (event.type === 'response_item' && event.payload) {
      const payload = event.payload;
      if (payload.type === 'message') {
        const text = textFromContent(payload.content);
        allText.push(text);
        if (payload.role === 'user') {
          const automation = extractAutomation(text);
          if (automation) result.automation = automation;
        }
        if (payload.role === 'assistant') {
          runtimeText.push(text);
          result.summary = text || result.summary;
        }
      }
    }
  }

  const combined = allText.join('\n');
  const runtimeCombined = runtimeText.join('\n');
  if (result.status !== 'completed' && /interrupted/i.test(combined)) result.status = 'interrupted';
  if (result.status !== 'completed' && /in progress/i.test(combined)) result.status = 'in progress';
  result.flags = classifyFlags(runtimeCombined || result.summary);
  result.summary = summarize(result.summary || (result.status === 'completed' ? 'task_complete captured; no agent summary in archive' : runtimeCombined));
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

function writeReport() {
  const since = getArg('since', '2026-05-20');
  const until = getArg('until', new Date().toISOString().slice(0, 10));
  const start = new Date(`${since}T00:00:00.000Z`);
  const end = new Date(`${until}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + 1);

  const automations = parseAutomations();
  const activeIds = new Set(automations.filter((item) => item.status === 'ACTIVE').map((item) => item.id));
  const archivedFiles = fs.existsSync(ARCHIVE_DIR)
    ? fs.readdirSync(ARCHIVE_DIR).filter((fileName) => /^rollout-\d{4}-\d{2}-\d{2}T.*\.jsonl$/.test(fileName))
    : [];

  const runs = archivedFiles
    .map((fileName) => parseRollout(path.join(ARCHIVE_DIR, fileName)))
    .filter(Boolean)
    .filter((run) => inRange(run.timestamp, start, end))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const runsById = new Map();
  for (const run of runs) {
    const id = run.automation.id;
    if (!runsById.has(id)) runsById.set(id, []);
    runsById.get(id).push(run);
  }

  const activeNoRun = Array.from(activeIds).filter((id) => !runsById.has(id)).sort();
  const statusCounts = countBy(runs, (run) => run.status);
  const missingMemory = automations.filter((item) => item.status === 'ACTIVE' && !item.hasMemory).map((item) => item.id);

  const lines = [];
  lines.push(`# Automation Run Report - ${since} to ${until}`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Source archives: \`${ARCHIVE_DIR}\``);
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
      lines.push(`${index}. \`${automation.id}\` - ${automation.name} - 0 run(s).`);
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

  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const outputPath = path.join(REPORTS_DIR, `automation-run-report-${since}-to-${until}.md`);
  fs.writeFileSync(outputPath, `${lines.join('\n')}\n`);
  console.log(`Wrote ${path.relative(ROOT, outputPath)}`);
  console.log(`Runs found: ${runs.length}; active without run evidence: ${activeNoRun.length}; missing memory: ${missingMemory.length}`);
}

writeReport();
