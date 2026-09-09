'use strict';

// Classification describes observed evidence, never an inferred production outage.
function classifyRuntime(result) {
  if (!result) return { status: 'not-tested', categories: ['not-tested'], gate: 'unverified', scoreCap: null };
  const categories = [];
  const local = result.environment !== 'production';
  const errors = [...(result.sampleConsoleErrors || []), ...(result.samplePageErrors || [])].join('\n');
  if (!result.ok || result.status >= 400 || result.error) {
    categories.push(local && result.redirectProbe && result.redirectProbe.status === 200
      && result.redirectProbe.canonicalMatches ? 'local-redirect-emulation-gap'
      : result.status >= 400 ? (local ? 'local-http-failure' : 'production-http-failure') : 'navigation-failure');
  }
  if (/content.security.policy|violates.*(?:script-src|connect-src)|refused to load/i.test(errors)) categories.push('policy-conflict');
  if (result.pageErrors) categories.push('runtime-exception');
  if ((result.failedResponses || []).some(x => /\/(?:api\/|\.netlify\/functions\/)/.test(typeof x === 'string' ? x : x.url))) {
    categories.push(local ? 'local-api-unverified' : 'production-api-failure');
  }
  if (result.thirdPartyFailures && result.thirdPartyFailures.length) categories.push('third-party-unverified');
  if (result.intentionalFallback && result.intentionalFallback.assertionPassed === true && result.intentionalFallback.test) categories.push('verified-intentional-fallback');
  if ((result.failedResponseCount || result.consoleErrors) && !categories.length) categories.push('uncategorized-error');
  if (!categories.length) categories.push('load-smoke-passed');
  const failed = categories.some(x => /http-failure|navigation-failure|runtime-exception|production-api-failure/.test(x));
  const review = categories.some(x => !['load-smoke-passed', 'verified-intentional-fallback'].includes(x));
  return { status: categories[0], categories, gate: failed ? 'failed' : review ? 'review' : 'passed', scoreCap: failed ? 44 : review ? 84 : null };
}
function applyRuntimeGate(score, result) {
  const runtime = classifyRuntime(result);
  return { score: runtime.scoreCap === null ? score : Math.min(score, runtime.scoreCap), runtime };
}
module.exports = { classifyRuntime, applyRuntimeGate };
