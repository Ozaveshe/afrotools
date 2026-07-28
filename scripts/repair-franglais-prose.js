#!/usr/bin/env node
'use strict';

/**
 * Repair franglais left behind by a word-level find-and-replace.
 *
 * At some point a localisation pass swapped individual English words for
 * French ones across `fr/**`, including inside prose blocks that were never
 * translated. The result is sentences like:
 *
 *   "TRA PAYE calculateur Official TRA calculateur for mensuel income tax"
 *   "Landlord notice period: 1 month for mensuel tenancy; 3 months for annuel lease"
 *
 * Neither English nor French, and worse than either. This script puts the
 * English word back wherever the surrounding sentence is still English. It
 * does not attempt translation: a half-translated sentence is a defect, and
 * restoring it to consistent English is the fix that cannot introduce a new
 * factual error into tax or tenancy copy.
 *
 * Usage: node scripts/repair-franglais-prose.js [--write]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FR_ROOT = path.join(ROOT, 'fr');
const WRITE = process.argv.includes('--write');

// French token -> the English word it displaced. Only unambiguous pairs: a
// word is listed here when its English original is the sole sensible reading
// in an English sentence.
const RESTORE = {
  'calculateur': 'calculator',
  'calculatrice': 'calculator',
  'mensuel': 'monthly',
  'mensuelle': 'monthly',
  'annuel': 'annual',
  'annuelle': 'annual',
  'quotidien': 'daily',
  'hebdomadaire': 'weekly',
  'enregistrer': 'Save',
  'gratuit': 'free'
};

// The decision is made on the *immediately adjacent* words, not on a window.
// A window is unreliable here: "Plafond annuel" and "Économie mensuelle" are
// correct French, and a 45-character window around them catches English from a
// neighbouring cell. The word touching the token is the only honest evidence.

// English words that, sitting next to the token, prove the sentence was never
// translated. Deliberately excludes "a" and "an": French "a" (has) and "an"
// (year, as in "FCFA/an") collide with them.
const EN_NEIGHBOUR = new Set(
  ('the this that these those for and with our your its official free use uses used to of is are was were see also per from after before ' +
   'applies apply shows show month months year years income tax rent notice period tenancy lease bookmark salary bands deducts computes ' +
   'computation estimate spend bill basis increase leave rate rates cost costs calculator plan budget covers starts get quick provides ' +
   'completely export petrol diesel about or in on at by we you it as').split(' ')
);

// A neighbouring French word means the phrase is genuinely French.
const FR_NEIGHBOUR = new Set(
  ('le la les du des de d un une pour avec votre notre nos vos ce cette cet est sont dans sur par au aux et ou qui que ne pas plus ' +
   'plafond salaire salaires impot impots revenu revenus montant montants taux bareme calcul calculer estimation economie plafonds ' +
   'an ans mois annee annees jour jours semaine base cotisation net brut charge charges').split(' ')
);

/** Strip accents so "économie" tests as "economie". */
function fold(word) {
  return word.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** True when the word carries a French accent, which English prose does not. */
function isAccented(word) {
  return /[\u00C0-\u017F]/.test(word);
}

function walk(dir, acc = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

/**
 * Split HTML into alternating text and non-text segments. Only text segments
 * are eligible for rewriting, so attribute values, script bodies and style
 * bodies are never touched.
 */
function segment(html) {
  const parts = [];
  const re = /<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>/gi;
  let last = 0;
  let m;
  while ((m = re.exec(html))) {
    if (m.index > last) parts.push({ text: true, value: html.slice(last, m.index) });
    parts.push({ text: false, value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < html.length) parts.push({ text: true, value: html.slice(last) });
  return parts;
}

/** The word immediately before `offset`, skipping markup. Empty if none. */
function wordBefore(parts, partIndex, offset) {
  let buf = '';
  for (let i = partIndex; i >= 0 && buf.length < 60; i -= 1) {
    if (!parts[i].text) continue;
    buf = (i === partIndex ? parts[i].value.slice(0, offset) : parts[i].value) + ' ' + buf;
  }
  const m = buf.match(/([A-Za-z\u00C0-\u017F']+)[^A-Za-z\u00C0-\u017F']*$/);
  return m ? m[1] : '';
}

/** The word immediately after the token, skipping markup. Empty if none. */
function wordAfter(parts, partIndex, offset) {
  let buf = '';
  for (let i = partIndex; i < parts.length && buf.length < 60; i += 1) {
    if (!parts[i].text) continue;
    buf += ' ' + (i === partIndex ? parts[i].value.slice(offset) : parts[i].value);
  }
  const m = buf.match(/^[^A-Za-z\u00C0-\u017F']*([A-Za-z\u00C0-\u017F']+)/);
  return m ? m[1] : '';
}

const TOKEN = new RegExp(`\\b(${Object.keys(RESTORE).join('|')})\\b`, 'gi');

function matchCase(source, replacement) {
  if (source === source.toUpperCase() && source.length > 1) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
  return replacement[0].toLowerCase() + replacement.slice(1);
}

function repair(html) {
  const parts = segment(html);
  let changes = 0;
  for (let i = 0; i < parts.length; i += 1) {
    if (!parts[i].text) continue;
    parts[i].value = parts[i].value.replace(TOKEN, (token, _w, offset) => {
      const prev = wordBefore(parts, i, offset);
      const next = wordAfter(parts, i, offset + token.length);
      // Any accented neighbour, or a French function word, means French prose.
      if (isAccented(prev) || isAccented(next)) return token;
      if (FR_NEIGHBOUR.has(fold(prev)) || FR_NEIGHBOUR.has(fold(next))) return token;
      // Require positive English evidence on at least one side.
      if (!EN_NEIGHBOUR.has(fold(prev)) && !EN_NEIGHBOUR.has(fold(next))) return token;
      changes += 1;
      return matchCase(token, RESTORE[token.toLowerCase()]);
    });
  }
  return [parts.map((p) => p.value).join(''), changes];
}

function main() {
  const files = walk(FR_ROOT);
  let changedFiles = 0;
  let totalChanges = 0;
  const worst = [];
  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const [next, changes] = repair(original);
    if (!changes || next === original) continue;
    changedFiles += 1;
    totalChanges += changes;
    worst.push([path.relative(ROOT, file), changes]);
    if (WRITE) fs.writeFileSync(file, next, 'utf8');
  }
  worst.sort((a, b) => b[1] - a[1]);
  console.log(`Scanned ${files.length} French pages.`);
  console.log(`${WRITE ? 'Repaired' : 'Would repair'} ${totalChanges} franglais token(s) in ${changedFiles} file(s).`);
  worst.slice(0, 10).forEach(([f, n]) => console.log(`  ${String(n).padStart(3)}  ${f}`));
  if (!WRITE && changedFiles) console.log('Dry run. Pass --write to apply.');
}

main();
