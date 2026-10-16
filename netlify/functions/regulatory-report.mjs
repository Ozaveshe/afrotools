import { PROJECT_URL, BODY_LIMIT, validateReport, quotaKey, readBoundedJSON, validReceipt } from './_shared/regulatory-report.mjs';

// Modern Netlify Functions API: context.ip is platform supplied, unlike XFF.
// https://docs.netlify.com/build/functions/api/#ip
// Serves at /.netlify/functions/regulatory-report. No CORS grant is needed.
export function createHandler({ env, fetchImpl = fetch, now = () => new Date(), budgetMs = 8000 } = {}) {
  const getEnv = env || (name => globalThis.Netlify?.env.get(name));
  return async function handler(request, context) {
    const reply = (status, body, extra = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', ...extra } });
    if (request.method !== 'POST') return reply(405, { error: 'Use POST.' }, { Allow: 'POST' });
    const origin = new URL(request.url).origin;
    if (request.headers.get('origin') !== origin || (request.headers.has('sec-fetch-site') && request.headers.get('sec-fetch-site') !== 'same-origin')) return reply(403, { error: 'Submit this form from the same site.' });
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return reply(415, { error: 'Use JSON.' });
    const declared = request.headers.get('content-length');
    if (declared && (!/^\d+$/.test(declared) || Number(declared) > BODY_LIMIT)) return reply(413, { error: 'Report is too large.' });
    const secret = getEnv('REGULATORY_REPORT_HMAC_SECRET');
    const serviceKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_DATA_SERVICE_ROLE_KEY');
    if (!serviceKey || !secret || secret.length < 32) return reply(503, { error: 'Report service unavailable. Your report has not been confirmed.' });
    const controller = new AbortController();
    let timer;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); void request.body?.cancel().catch(() => {}); reject(new Error('Deadline')); }, budgetMs); });
    try {
      return await Promise.race([timeout, (async () => {
        let report;
        try { report = validateReport(await readBoundedJSON(request.body, BODY_LIMIT, controller.signal)); }
        catch { return reply(400, { error: 'Check the report fields, length, source URL, date and consent.' }); }
        if (controller.signal.aborted) throw new Error('Deadline');
        const day = now().toISOString().slice(0, 10);
        const key = quotaKey(context?.ip, day, secret);
        const response = await fetchImpl(PROJECT_URL + '/rest/v1/rpc/submit_regulatory_report', {
          method: 'POST', signal: controller.signal, headers: { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_request_id: report.request_id, p_payload: report.payload, p_quota_key: key, p_day: day })
        });
        try {
          const data = await readBoundedJSON(response.body, 4096, controller.signal);
          if (!response.ok) {
            if (data?.code === 'PT429') return reply(429, { error: 'Daily report limit reached. Try again tomorrow.' }, { 'Retry-After': '86400' });
            if (data?.code === 'PT409') return reply(409, { error: 'This request belongs to a different report. Keep the original report or start a new one.' });
            throw new Error('Persistence unavailable');
          }
          if (!validReceipt(data)) throw new Error('Invalid receipt');
          return reply(201, { status: data.status, receipt_id: data.receipt_id, received_at: data.received_at });
        } finally { void response.body?.cancel().catch(() => {}); }
      })()]);
    } catch {
      // No report content, IP, secrets or upstream response is logged or returned.
      return reply(503, { error: 'Delivery is unconfirmed. Keep your report and retry the same submission.' });
    } finally { clearTimeout(timer); controller.abort(); }
  };
}

export default createHandler();
