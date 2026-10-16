(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else document.addEventListener('DOMContentLoaded', function () { factory({ document: document, fetch: root.fetch.bind(root), crypto: root.crypto, online: function () { return root.navigator.onLine; } }); });
}(typeof window === 'undefined' ? null : window, function (options) {
  'use strict';
  var doc = options.document, form = doc.getElementById('reportForm');
  if (!form) return;
  var button = doc.getElementById('repBtn'), success = doc.getElementById('reportSuccessMsg'), error = doc.getElementById('reportErrorMsg'), fresh = doc.getElementById('repNewRequest');
  var pending = null, busy = false;
  var uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // Only called after an explicit submit/new-report action. Keep feedback visible
  // above a long mobile form; instant movement also respects reduced motion.
  var message = function (element, text) {
    element.textContent = text; element.classList.add('visible');
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: 'center', behavior: 'instant' });
  };
  var value = function (id) { return doc.getElementById(id).value.trim(); };
  async function readReceipt(response, signal) {
    if (!response.body) throw new Error('Missing receipt');
    var reader = response.body.getReader(), chunks = [], length = 0;
    var abort = function () { void reader.cancel().catch(function () {}); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    try {
      for (;;) {
        var part = await reader.read();
        if (part.done) break;
        length += part.value.byteLength;
        if (length > 2048) throw new Error('Invalid receipt');
        chunks.push(part.value);
      }
      var bytes = new Uint8Array(length), offset = 0;
      chunks.forEach(function (chunk) { bytes.set(chunk, offset); offset += chunk.length; });
      return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    } finally { signal.removeEventListener('abort', abort); void reader.cancel().catch(function () {}); reader.releaseLock(); }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    success.classList.remove('visible'); error.classList.remove('visible');
    if (!form.reportValidity()) return;
    if (!doc.getElementById('repConsent').checked) { message(error, 'Confirm that you want to send these fields for review.'); return; }
    if (!options.online()) { message(error, 'You are offline. Nothing was sent. Keep this page open and retry when connected.'); return; }
    var fields = { consent: true, country_code: value('repCountry'), change_type: value('repType'), title: value('repTitle'), details: value('repDetails'), source_url: value('repSource'), effective_date: value('repEffDate') || null };
    var fingerprint = JSON.stringify(fields);
    if (pending && pending.fingerprint !== fingerprint) { message(error, 'Delivery of the previous report is unconfirmed. Restore its fields to retry, or start a different report.'); fresh.hidden = false; return; }
    if (!pending) {
      if (!options.crypto || typeof options.crypto.randomUUID !== 'function') { message(error, 'Secure submission is unavailable in this browser. Your report has not been sent.'); return; }
      pending = { request_id: options.crypto.randomUUID(), fingerprint: fingerprint };
    }
    busy = true; button.disabled = true; button.textContent = 'Sending report…'; form.setAttribute('aria-busy', 'true');
    var controller = new AbortController(), timer;
    var timeout = new Promise(function (_, reject) { timer = setTimeout(function () { controller.abort(); reject(new Error('Deadline')); }, options.budgetMs || 10000); });
    try {
      await Promise.race([timeout, (async function () {
        var response = await options.fetch('/.netlify/functions/regulatory-report', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify(Object.assign({ request_id: pending.request_id }, fields)) });
        var data = await readReceipt(response, controller.signal);
        if (!response.ok) {
          if (response.status === 429) throw new Error('Daily report limit reached. Keep your report and try tomorrow.');
          if (response.status === 400) throw new Error('Check the report length, country, type, source URL, date and consent.');
          if (response.status === 409) throw new Error('This request was used for different details. Start a different report to submit these fields.');
          throw new Error('Delivery is unconfirmed. Keep your report and retry the same submission.');
        }
        if (response.status !== 201 || !data || data.status !== 'pending_review' || !uuid.test(data.receipt_id || '') || typeof data.received_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(data.received_at) || !Number.isFinite(Date.parse(data.received_at))) throw new Error('Delivery is unconfirmed. Keep your report and retry the same submission.');
        if (controller.signal.aborted) return;
        message(success, 'Report received for review. Receipt: ' + data.receipt_id + ' · ' + new Date(data.received_at).toISOString() + '. This does not confirm the regulation or update a calculator.');
        form.reset(); pending = null; fresh.hidden = true;
      }())]);
    } catch (err) {
      message(error, controller.signal.aborted ? 'Delivery is unconfirmed. Keep your report and retry the same submission.' : err.message || 'Delivery is unconfirmed. Keep your report and retry the same submission.');
      fresh.hidden = false;
    } finally { clearTimeout(timer); controller.abort(); busy = false; button.disabled = false; button.textContent = '📣 Submit Report'; form.setAttribute('aria-busy', 'false'); }
  }
  form.addEventListener('submit', submit);
  fresh.addEventListener('click', function () { if (busy) return; pending = null; fresh.hidden = true; message(error, 'A new submission will use a new receipt request. Any previous unconfirmed report may already have been received.'); });
  return { submit: submit };
}));
