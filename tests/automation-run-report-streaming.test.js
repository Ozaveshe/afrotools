const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  parseRollout,
  readJsonlLines,
} = require('../scripts/generate-automation-run-report');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-automation-report-'));
const rolloutPath = path.join(tempDir, 'rollout.jsonl');
const automationMessage = [
  'Automation: Streaming report fixture',
  'Automation ID: streaming-report-fixture',
  'Last run: 2026-08-15T00:00:00.000Z',
].join('\n');
const lines = [
  JSON.stringify({
    type: 'session_meta',
    payload: {
      id: 'streaming-session',
      timestamp: '2026-08-15T00:01:00.000Z',
      cwd: 'C:/fixture',
    },
  }),
  JSON.stringify({
    type: 'response_item',
    payload: {
      type: 'message',
      role: 'user',
      content: [{ text: automationMessage }],
    },
  }),
  JSON.stringify({
    type: 'response_item',
    payload: {
      type: 'message',
      role: 'assistant',
      content: [{ text: 'Processed a UTF-8 boundary safely: 🌍' }],
    },
  }),
  JSON.stringify({
    type: 'event_msg',
    payload: {
      type: 'task_complete',
      last_agent_message: 'Streaming parse completed successfully.',
    },
  }),
];

try {
  fs.writeFileSync(rolloutPath, `${lines.join('\r\n')}\r\n`, 'utf8');

  assert.deepStrictEqual(Array.from(readJsonlLines(rolloutPath, 7)), lines);

  const originalReadFileSync = fs.readFileSync;
  fs.readFileSync = function guardedRead(filePath, ...args) {
    if (path.resolve(filePath) === path.resolve(rolloutPath)) {
      throw new Error('parseRollout must not read the whole archive into one string');
    }
    return originalReadFileSync.call(fs, filePath, ...args);
  };

  let parsed;
  try {
    parsed = parseRollout(rolloutPath);
  } finally {
    fs.readFileSync = originalReadFileSync;
  }

  assert(parsed);
  assert.strictEqual(parsed.sessionId, 'streaming-session');
  assert.strictEqual(parsed.automation.id, 'streaming-report-fixture');
  assert.strictEqual(parsed.status, 'completed');
  assert.strictEqual(parsed.summary, 'Streaming parse completed successfully.');
  console.log('Automation report streaming parser test passed.');
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
