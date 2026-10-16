import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';

export const PROJECT_URL = 'https://zpclagtgczsygrgztlts.supabase.co';
export const COUNTRIES = 'DZ AO BJ BW BF BI CV CM CF TD KM CD CG CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW'.split(' ');
export const TYPES = ['minimum-wage', 'paye-bands', 'pension-rate', 'social-security', 'new-levy', 'tax-threshold', 'cit-rate', 'filing-deadline'];
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const BODY_LIMIT = 16384;
const encoder = new TextEncoder();

export function validateReport(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input.consent !== true || !UUID.test(input.request_id || '')) throw new Error('Confirm consent and use a valid report request.');
  const keys = ['request_id', 'consent', 'country_code', 'change_type', 'title', 'details', 'source_url', 'effective_date'];
  if (Object.keys(input).some(key => !keys.includes(key))) throw new Error('Unexpected report field.');
  const text = (key, min, max) => {
    if (typeof input[key] !== 'string') throw new Error('Invalid ' + key + '.');
    const value = input[key].trim();
    if (value.length < min || encoder.encode(value).length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) throw new Error('Invalid ' + key + '.');
    return value;
  };
  const country = text('country_code', 2, 2), type = text('change_type', 1, 32);
  if (!COUNTRIES.includes(country) || !TYPES.includes(type)) throw new Error('Choose a supported country and change type.');
  const title = text('title', 5, 560), details = text('details', 20, 8000);
  if (title.length > 140 || details.length > 2000) throw new Error('Report text is too long.');
  let source = input.source_url == null ? '' : text('source_url', 0, 2048);
  if (source) {
    let url;
    try { url = new URL(source); } catch { throw new Error('Use a valid HTTP or HTTPS source URL.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || /[\s<>"'\\]/.test(source)) throw new Error('Use a valid HTTP or HTTPS source URL without credentials.');
    source = url.href;
    if (encoder.encode(source).length > 2048) throw new Error('Source URL is too long.');
  }
  const date = input.effective_date == null || input.effective_date === '' ? null : input.effective_date;
  if (date !== null && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '1900-01-01' || date > '2200-12-31' || new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date)) throw new Error('Use a valid effective date.');
  return { request_id: input.request_id.toLowerCase(), payload: { country_code: country, change_type: type, title, details, source_url: source || null, effective_date: date } };
}

// The trusted Netlify Context API supplies ip. Do not accept request IP headers.
export function quotaKey(ip, day, secret) {
  if (!isIP(ip || '') || typeof secret !== 'string' || secret.length < 32) throw new Error('Report service configuration unavailable.');
  const canonicalIP = ip.includes(':') ? new URL('http://[' + ip + ']/').hostname : ip;
  return createHmac('sha256', secret).update('regulatory-report\0' + day + '\0' + canonicalIP).digest('hex');
}

export async function readBoundedJSON(body, limit = BODY_LIMIT, signal) {
  if (!body) throw new Error('Missing body.');
  const reader = body.getReader();
  const abort = () => { void reader.cancel().catch(() => {}); };
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  let bytes = 0, chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) throw new Error('Body too large.');
      chunks.push(value);
    }
    const all = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) { all.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(all));
  } finally {
    signal?.removeEventListener('abort', abort);
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export function validReceipt(value) {
  return value && value.status === 'pending_review' && UUID.test(value.receipt_id || '') && typeof value.received_at === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value.received_at) && Number.isFinite(Date.parse(value.received_at));
}
