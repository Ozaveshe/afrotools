'use strict';

// One deadline covers all attempts, backoff, response headers and body bytes.
// This bounds upstream reads; it is not a deadline for database persistence.
const DEFAULT_TIMEOUT_MS = 6000;
const MAX_TIMEOUT_MS = 10000;
function failure(code, status) {
  const messages = {UPSTREAM_TIMEOUT:'Upstream request deadline exceeded',
    UPSTREAM_ABORTED:'Upstream request cancelled',UPSTREAM_NETWORK_ERROR:'Upstream network request failed',
    UPSTREAM_HTTP_ERROR:'Upstream HTTP request failed',UPSTREAM_BODY_ERROR:'Upstream response decoding failed'};
  const error = new Error(messages[code]);
  error.code = code;
  if (Number.isInteger(status) && status >= 100 && status <= 599) error.status = status;
  return error;
}

async function fetchWithRetry(url, opts = {}) {
  const {retries = 3, backoffMs = 1000, timeoutMs = DEFAULT_TIMEOUT_MS, signal:callerSignal, ...fetchOpts} = opts;
  if (!Number.isInteger(retries) || retries < 1 || retries > 5 || !Number.isFinite(backoffMs) || backoffMs < 0 ||
      !Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > MAX_TIMEOUT_MS) throw new Error('Invalid upstream request policy');
  const controller = new AbortController();
  let timer, rejectAbort, abortedCode;
  const interrupted = new Promise((_, reject) => { rejectAbort = reject; });
  // Avoid an unhandled rejection if the caller was already cancelled.
  interrupted.catch(() => {});
  const abort = code => {
    if (abortedCode) return;
    abortedCode = code;
    controller.abort();
    rejectAbort(failure(code));
  };
  const onAbort = () => abort('UPSTREAM_ABORTED');
  if (callerSignal?.aborted) onAbort();
  else callerSignal?.addEventListener('abort',onAbort,{once:true});
  timer = setTimeout(() => abort('UPSTREAM_TIMEOUT'),timeoutMs);
  const bounded = work => {
    if (abortedCode) return Promise.reject(failure(abortedCode));
    return Promise.race([Promise.resolve().then(work),interrupted]);
  };
  try {
    for (let attempt = 1; attempt <= retries; attempt++) {
      let error;
      try {
        const response = await bounded(() => fetch(url,{...fetchOpts,signal:controller.signal}));
        if (!response.ok) {
          // Rejected bodies are never decoded/logged; cancellation is best effort.
          try { Promise.resolve(response.body?.cancel()).catch(() => {}); } catch (_) {}
          error = failure('UPSTREAM_HTTP_ERROR',response.status);
          if (response.status !== 429 && response.status < 500) throw error;
        } else {
          // Materialize under the same deadline before returning. Callers may
          // use any Response body method or clone without losing that bound.
          const bytes = await bounded(() => response.arrayBuffer());
          const result = new Response([204,205,304].includes(response.status) ? null : bytes,
            {status:response.status,statusText:response.statusText,headers:response.headers});
          for (const key of ['url','redirected','type']) Object.defineProperty(result,key,{value:response[key]});
          const json = result.json.bind(result);
          result.json = async () => { try { return await json(); } catch (_) { throw failure('UPSTREAM_BODY_ERROR'); } };
          return result;
        }
      } catch (caught) {
        if (abortedCode) throw failure(abortedCode);
        if (caught === error && error?.code === 'UPSTREAM_HTTP_ERROR') throw error;
        error = failure('UPSTREAM_NETWORK_ERROR');
      }
      if (attempt === retries) throw error;
      const delay = backoffMs * 2 ** (attempt-1);
      console.log('[scraper-base] Upstream retry', JSON.stringify({code:error.code,status:error.status || null,attempt,retries,delay_ms:delay}));
      let backoffTimer;
      try { await bounded(() => new Promise(resolve => { backoffTimer = setTimeout(resolve,delay); })); }
      finally { clearTimeout(backoffTimer); }
    }
  } finally {
    clearTimeout(timer);
    callerSignal?.removeEventListener('abort',onAbort);
  }
}
module.exports = {fetchWithRetry,DEFAULT_TIMEOUT_MS,MAX_TIMEOUT_MS};
