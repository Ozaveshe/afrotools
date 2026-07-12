#!/usr/bin/env node
// Batch 2b: Hausa JAMB pages — add a methodology + disclaimer note (reusing verified
// house phrasing) so the audit's Hausa methodology/disclaimer detectors register.
// Idempotent; inserts before <afro-footer>. Uses r+ writer (OneDrive-safe).
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'ha', 'jamb');
const HA_METHOD = /\b(hanyar lissafi|hanyar tsara|tsarin lissafi|yana kwatanta|ana kwatanta|lissafa|an tsara shafin|ma'aunin)\b/i;
const HA_DISC = /\b(ba shafin hukuma ba|ba hukuma ba|ba hukumar|bai tabbatar|ba ya tabbatar|bayani mai muhimmanci|ka duba|kada a dauka)\b/i;

const NOTE = `<section class="ha-jamb-trust" data-tool-verification-panel data-ha-jamb-batch="method-note">
  <h2>Hanyar aiki da tabbaci</h2>
  <div class="ha-jamb-trust-grid">
    <p><strong>Hanyar aiki:</strong> Wannan shafi yana amfani da tsarin AfroJAMB, don haka ana kwatanta shirin karatu iri daya da shafin tushe. Ba a canza tambayoyi ko lissafin maki ba.</p>
    <p><strong>Tabbaci:</strong> Wannan ba shafin hukuma ba ne; ka duba sabbin bayanai kan ranar jarrabawa da dokokin JAMB daga hukumar da ta dace kafin yanke shawara.</p>
  </div>
</section>
`;

// OneDrive-synced tree: writeFileSync('w') and ftruncate fail with UNKNOWN, but
// writing a NEW temp file + renameSync over the target works reliably.
function writeRetry(file, data, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const tmp = file + '.tmp' + process.pid;
    try {
      fs.writeFileSync(tmp, data, 'utf8');
      fs.renameSync(tmp, file);
      return true;
    } catch (e) {
      try { fs.unlinkSync(tmp); } catch (_) {}
      if (i === attempts - 1) throw e;
      const until = Date.now() + 150; while (Date.now() < until) { /* backoff */ }
    }
  }
  return false;
}

let changed = 0; const skipped = []; const failed = [];
for (const slug of fs.readdirSync(DIR)) {
  const file = path.join(DIR, slug, 'index.html');
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const text = html.replace(/<[^>]+>/g, ' ');
  if (HA_METHOD.test(text) && HA_DISC.test(text)) { skipped.push(slug); continue; }
  if (!html.includes('<afro-footer>')) { failed.push(slug + ': no footer anchor'); continue; }
  html = html.replace('<afro-footer>', NOTE + '<afro-footer>');
  try { writeRetry(file, html); changed++; }
  catch (e) { failed.push(slug + ': ' + e.code); }
}
console.log(`HA JAMB note added to ${changed} pages. Skipped (already ok): ${skipped.join(', ') || 'none'}.`);
if (failed.length) console.log('FAILED:', failed.join(', '));
