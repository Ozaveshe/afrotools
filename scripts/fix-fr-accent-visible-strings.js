#!/usr/bin/env node
// Batch 4c: fix FR accent leaks in the two remaining USER-VISIBLE surfaces the text-node
// pass skipped, and ONLY those:
//   (1) pure-display attributes: placeholder=, title=, aria-label=, alt=   (never value= — that's a logic key)
//   (2) textContent = '...' / "..." / `...` display-string literals inside <script>
// Non-English words only, whole-word boundaries. Ambiguous participles excluded.
const fs = require('fs');
const path = require('path');

const MAP = {
  resultat: 'résultat', Resultat: 'Résultat', resultats: 'résultats', apercu: 'aperçu',
  verifier: 'vérifier', verifiez: 'vérifiez', Verifiez: 'Vérifiez', regles: 'règles', Regles: 'Règles',
  donnees: 'données', Donnees: 'Données', cout: 'coût', couts: 'coûts', reseau: 'réseau',
  telechargez: 'téléchargez', Telechargez: 'Téléchargez', selectionnez: 'sélectionnez', Selectionnez: 'Sélectionnez',
  confirmee: 'confirmée', confirmees: 'confirmées', penalite: 'pénalité', penalites: 'pénalités',
  numero: 'numéro', recu: 'reçu', recus: 'reçus', financiere: 'financière', societe: 'société',
  securite: 'sécurité', methode: 'méthode', numerique: 'numérique', etape: 'étape', etapes: 'étapes',
  entrees: 'entrées', eligibilite: 'éligibilité', fiscalite: 'fiscalité', mensualite: 'mensualité',
  systeme: 'système', modele: 'modèle', probleme: 'problème', generale: 'générale', strategie: 'stratégie',
  categorie: 'catégorie', activite: 'activité', qualite: 'qualité', reference: 'référence',
};
const RULES = Object.entries(MAP).map(([f, t]) => {
  const esc = f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [new RegExp('(?<![A-Za-zÀ-ÿ])' + esc + '(?![A-Za-zÀ-ÿ])', 'g'), t];
});
function fixStr(s, counter) {
  for (const [re, to] of RULES) { const m = s.match(re); if (m) { counter.n += m.length; s = s.replace(re, to); } }
  return s;
}

function writeRetry(file, data, attempts = 6) {
  for (let i = 0; i < attempts; i++) {
    const tmp = file + '.tmp' + process.pid;
    try { fs.writeFileSync(tmp, data, 'utf8'); fs.renameSync(tmp, file); return true; }
    catch (e) { try { fs.unlinkSync(tmp); } catch (_) {} if (i === attempts - 1) throw e;
      const until = Date.now() + 150; while (Date.now() < until) {} }
  }
}
function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
}

const DRY = process.argv.includes('--dry');
const files = []; walk(path.join(__dirname, '..', 'fr'), files);
const counter = { n: 0 }; let filesChanged = 0;
// (1) display attributes
const ATTR = /\b(placeholder|title|aria-label|alt)="([^"]*)"/g;
// (2) textContent assignments with a single-quoted, double-quoted, or backtick literal
const TC = /(textContent\s*=\s*)(['"`])((?:\\.|(?!\2)[^\\])*)\2/g;
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  let out = html.replace(ATTR, (m, name, val) => `${name}="${fixStr(val, counter)}"`);
  out = out.replace(TC, (m, lhs, q, body) => `${lhs}${q}${fixStr(body, counter)}${q}`);
  if (out !== html) { filesChanged++; if (!DRY) writeRetry(file, out); }
}
console.log(`${DRY ? '[DRY] ' : ''}FR visible-string repair: ${counter.n} replacements across ${filesChanged} files.`);
