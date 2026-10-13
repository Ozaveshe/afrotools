'use strict';
const fs = require('node:fs');

function selectNativeStart(jobs, now = Date.now()) {
  const matching = jobs.filter(job => job.name === 'Artifact producer');
  if (matching.length !== 1) throw new Error('Exact producer job not uniquely visible');
  const job = matching[0], start = Date.parse(job.started_at);
  if (!['queued', 'in_progress'].includes(job.status) || !Number.isFinite(start) || start > now) throw new Error('Native producer start not yet valid');
  const deadline = start + 75 * 60 * 1000;
  if (deadline <= now) throw new Error('Original shared deadline expired');
  return deadline;
}

async function bindNativeDeadline(readJobs, wait, now = () => Date.now()) {
  // The first REST observation can precede job-status propagation. Never invent a start or extend its deadline.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try { return selectNativeStart(await readJobs(), now()); }
    catch (_) {
      if (attempt === 3) throw new Error('Cannot bind exact native producer start after three bounded reads');
      await wait(1000);
    }
  }
}

async function main() {
  const env = process.env;
  const url = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}/attempts/${env.GITHUB_RUN_ATTEMPT}/jobs?per_page=100`;
  const deadline = await bindNativeDeadline(async () => {
    const response = await fetch(url, {headers: {Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json'}, signal: AbortSignal.timeout(10000)});
    if (!response.ok) throw new Error('Job metadata request rejected');
    return (await response.json()).jobs;
  }, delay => new Promise(resolve => setTimeout(resolve, delay)));
  fs.appendFileSync(env.GITHUB_OUTPUT, 'deadline=' + deadline + '\n');
}

module.exports = {selectNativeStart, bindNativeDeadline};
if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
