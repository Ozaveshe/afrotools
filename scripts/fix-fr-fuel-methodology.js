#!/usr/bin/env node
// Batch 2a: FR suivi-carburant pages — add French methodology keyword to the
// existing "Méthode et sources" note and repair three unaccented French leaks.
// Safe, in-place, idempotent string replacements.
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'fr', 'tools', 'suivi-carburant');
const repl = [
  [
    "Méthode et sources:</strong> estimation = litres par jour x jours par mois x prix instantane AfroFuel.",
    "Méthodologie et sources :</strong> l'estimation suit la formule : litres par jour × jours par mois × prix instantané AfroFuel.",
  ],
  ["dernière ligne affichee", "dernière ligne affichée"],
  ["décision financiere", "décision financière"],
];

// writeFileSync (flag 'w') fails with UNKNOWN on this OneDrive-synced path;
// opening the existing file 'r+' and truncating works reliably.
function writeRetry(file, data, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    try {
      const fd = fs.openSync(file, 'r+');
      try { fs.ftruncateSync(fd, 0); fs.writeSync(fd, Buffer.from(data, 'utf8'), 0); }
      finally { fs.closeSync(fd); }
      return true;
    } catch (e) {
      if (i === attempts - 1) throw e;
      const until = Date.now() + 150; while (Date.now() < until) { /* backoff */ }
    }
  }
  return false;
}

let changed = 0; let failed = [];
for (const slug of fs.readdirSync(DIR)) {
  const file = path.join(DIR, slug, 'index.html');
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  for (const [from, to] of repl) html = html.split(from).join(to);
  if (html !== before) {
    try { writeRetry(file, html); changed++; }
    catch (e) { failed.push(slug + ': ' + e.code); }
  }
}
console.log(`FR fuel methodology fix applied to ${changed} pages.`);
if (failed.length) console.log('FAILED:', failed.join(', '));
