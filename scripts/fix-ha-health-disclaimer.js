#!/usr/bin/env node
// Batch 2c: Hausa health tools — add a disclaimer + sources note (verified house
// phrasing, health-appropriate). Idempotent; inserts before <afro-footer>.
const fs = require('fs');
const path = require('path');

const TARGETS = [
  'ha/kayan-aiki/kudin-haihuwa/index.html',
  'ha/kayan-aiki/abincin-afirka/index.html',
  'ha/kayan-aiki/kudin-asibiti/index.html',
  'ha/kayan-aiki/duba-genotype/index.html',
  'ha/kayan-aiki/sickle-cell/index.html',
];
const HA_DISC = /\b(ba shafin hukuma ba|ba hukuma ba|ba hukumar|bai tabbatar|ba ya tabbatar|bayani mai muhimmanci|ka duba|kada a dauka)\b/i;

const NOTE = `<section class="ha-jamb-trust" data-tool-verification-panel data-ha-batch="health-note" style="max-width:900px;margin:24px auto;padding:0 20px;">
  <h2 style="font-size:1.05rem;font-weight:800;color:#0f172a;margin:0 0 8px;">Bayani mai muhimmanci da tushe</h2>
  <div style="font-size:.9rem;color:#334155;line-height:1.6;padding:12px 14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
    <p style="margin:0;">Wannan kayan aiki na bayar da <strong>bayani mai muhimmanci</strong> ne kawai, ba shafin hukuma ba ne kuma ba shawarar likita ba ne. Ka duba tushen bayani daga asibiti, ma'aikatar lafiya ko hukumar da ta dace, kuma ka tuntubi kwararren likita kafin yanke wata shawara ta lafiya ko kudi. An sabunta 2026.</p>
  </div>
</section>
`;

function writeRetry(file, data, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const tmp = file + '.tmp' + process.pid;
    try { fs.writeFileSync(tmp, data, 'utf8'); fs.renameSync(tmp, file); return true; }
    catch (e) { try { fs.unlinkSync(tmp); } catch (_) {} if (i === attempts - 1) throw e;
      const until = Date.now() + 150; while (Date.now() < until) {} }
  }
}

let changed = 0; const failed = [];
for (const rel of TARGETS) {
  const file = path.join(__dirname, '..', rel);
  if (!fs.existsSync(file)) { failed.push(rel + ': missing'); continue; }
  let html = fs.readFileSync(file, 'utf8');
  if (HA_DISC.test(html.replace(/<[^>]+>/g, ' ')) && /tushen bayani|hukuma/i.test(html)) {
    // already has both — skip only if the dedicated note is present
  }
  if (html.includes('data-ha-batch="health-note"')) continue;
  if (!html.includes('<afro-footer>')) { failed.push(rel + ': no footer'); continue; }
  html = html.replace('<afro-footer>', NOTE + '<afro-footer>');
  try { writeRetry(file, html); changed++; } catch (e) { failed.push(rel + ': ' + e.code); }
}
console.log(`HA health note added to ${changed} pages.`);
if (failed.length) console.log('FAILED:', failed.join(', '));
