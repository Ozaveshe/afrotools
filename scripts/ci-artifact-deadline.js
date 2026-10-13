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
    catch (error) {
      if (error.permanentMetadataFailure) throw error;
      if (attempt === 3) throw new Error('Cannot bind exact native producer start after three bounded reads');
      await wait(1000);
    }
  }
}

function permanentFailure(message) {
  const error = new Error(message); error.permanentMetadataFailure = true; return error;
}

async function readNativeJobs(response, request, emit = value => console.log('[ci-native-start] ' + JSON.stringify(value))) {
  const base = {run_id: String(request.runId), run_attempt: String(request.attempt), expected_job_name: 'Artifact producer', http_status: response.status};
  if (!response.ok) {
    emit({...base, jobs_array: false, response_body_decoded: false});
    // Permissions/identity rejection cannot be repaired with a sleep. Never decode/log an error body.
    if ([400, 401, 403, 404].includes(response.status)) throw permanentFailure('Native metadata HTTP ' + response.status + ' rejected the exact read');
    throw new Error('Native metadata request temporarily unavailable');
  }
  let data;
  try { data = await response.json(); } catch (_) { emit({...base, jobs_array: false}); throw permanentFailure('Malformed native metadata response'); }
  const isArray = Array.isArray(data?.jobs), matches = isArray ? data.jobs.filter(job => job?.name === 'Artifact producer') : [];
  emit({...base, jobs_array: isArray, job_count: isArray ? data.jobs.length : null, matching_name_count: matches.length,
    matches: matches.map(job => ({name: 'Artifact producer', status: ['queued','in_progress','completed'].includes(job.status) ? job.status : 'other',
      native_started_at: typeof job.started_at === 'string' && Number.isFinite(Date.parse(job.started_at)) ? job.started_at : null,
      run_id_matches: String(job.run_id) === String(request.runId), run_attempt_matches: String(job.run_attempt) === String(request.attempt)}))});
  if (!isArray) throw permanentFailure('Native metadata jobs array missing');
  if (matches.some(job => String(job.run_id) !== String(request.runId) || String(job.run_attempt) !== String(request.attempt))) throw permanentFailure('Native job run/attempt identity mismatch');
  return data.jobs;
}

async function main() {
  const env = process.env;
  const url = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}/attempts/${env.GITHUB_RUN_ATTEMPT}/jobs?per_page=100`;
  const deadline = await bindNativeDeadline(async () => {
    const response = await fetch(url, {headers: {Authorization: `Bearer ${env.GH_TOKEN}`, Accept: 'application/vnd.github+json'}, signal: AbortSignal.timeout(10000)});
    return readNativeJobs(response, {runId: env.GITHUB_RUN_ID, attempt: env.GITHUB_RUN_ATTEMPT});
  }, delay => new Promise(resolve => setTimeout(resolve, delay)));
  fs.appendFileSync(env.GITHUB_OUTPUT, 'deadline=' + deadline + '\n');
}

module.exports = {selectNativeStart, bindNativeDeadline, readNativeJobs};
if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
