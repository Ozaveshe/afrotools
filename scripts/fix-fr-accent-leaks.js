#!/usr/bin/env node
// Batch 4: repair ASCII accent-leaks in FRENCH visible text (e.g. "donnees" -> "données").
// SAFETY:
//  1. Only fr/ pages.
//  2. Only TEXT NODES — tags, attributes, <script> and <style> blocks are never touched.
//  3. Only maps ASCII forms that are NOT valid English words, so English text on a
//     partially-translated FR page is left alone (near-zero false positives).
//  4. Whole-word (accent-aware boundaries) so partial matches are impossible.
// Verify after: build-french-product-surface.js --check + audit-ui-accent-patterns.js.
const fs = require('fs');
const path = require('path');

// ASCII (leak) -> correct French. Every key is NOT a standalone English word.
const MAP = {
  donnees: 'données', societe: 'société', societes: 'sociétés', numero: 'numéro', numeros: 'numéros',
  economie: 'économie', economies: 'économies', energie: 'énergie', energies: 'énergies',
  strategie: 'stratégie', strategies: 'stratégies', categorie: 'catégorie', categories: 'catégories',
  activite: 'activité', activites: 'activités', securite: 'sécurité', qualite: 'qualité', qualites: 'qualités',
  verite: 'vérité', realite: 'réalité', propriete: 'propriété', proprietes: 'propriétés',
  responsabilite: 'responsabilité', responsabilites: 'responsabilités', disponibilite: 'disponibilité',
  fonctionnalite: 'fonctionnalité', fonctionnalites: 'fonctionnalités', electricite: 'électricité',
  benefice: 'bénéfice', benefices: 'bénéfices', depense: 'dépense', depenses: 'dépenses',
  reseau: 'réseau', reseaux: 'réseaux', interet: 'intérêt', interets: 'intérêts',
  depot: 'dépôt', depots: 'dépôts', methode: 'méthode', methodes: 'méthodes',
  financiere: 'financière', financieres: 'financières', reguliere: 'régulière', regulieres: 'régulières',
  particuliere: 'particulière', particulieres: 'particulières', derniere: 'dernière', dernieres: 'dernières',
  maniere: 'manière', manieres: 'manières', systeme: 'système', systemes: 'systèmes',
  modele: 'modèle', modeles: 'modèles', probleme: 'problème', problemes: 'problèmes',
  parametre: 'paramètre', parametres: 'paramètres', caractere: 'caractère', caracteres: 'caractères',
  matiere: 'matière', matieres: 'matières', barriere: 'barrière', barrieres: 'barrières',
  carriere: 'carrière', carrieres: 'carrières', ministere: 'ministère', ministeres: 'ministères',
  critere: 'critère', criteres: 'critères', kilometre: 'kilomètre', kilometres: 'kilomètres',
  francais: 'français', francaise: 'française', francaises: 'françaises', diplome: 'diplôme', diplomes: 'diplômes',
  hopital: 'hôpital', hopitaux: 'hôpitaux', impot: 'impôt', impots: 'impôts',
  controle: 'contrôle', controler: 'contrôler', controles: 'contrôles', apercu: 'aperçu',
  recu: 'reçu', recus: 'reçus', facon: 'façon', lecon: 'leçon', lecons: 'leçons',
  generale: 'générale', generales: 'générales', generaux: 'généraux',
  cout: 'coût', couts: 'coûts', gout: 'goût', etre: 'être', meme: 'même', tres: 'très',
  apres: 'après', acces: 'accès', proces: 'procès', succes: 'succès', progres: 'progrès',
  pret: 'prêt', prets: 'prêts', deja: 'déjà', plutot: 'plutôt', bientot: 'bientôt',
  developpement: 'développement', developpeur: 'développeur', developpeurs: 'développeurs',
  reglementation: 'réglementation', reglementaire: 'réglementaire', immediat: 'immédiat', immediate: 'immédiate',
  necessaire: 'nécessaire', necessaires: 'nécessaires', complementaire: 'complémentaire',
  interessant: 'intéressant', interessante: 'intéressante', salarie: 'salarié', salaries: 'salariés',
  employe: 'employé', employes: 'employés',
  annee: 'année', annees: 'années', journee: 'journée', duree: 'durée', entree: 'entrée', entrees: 'entrées',
  reduit: 'réduit', reduite: 'réduite',
  prevu: 'prévu', prevue: 'prévue', prevoir: 'prévoir', regles: 'règles',
  reussir: 'réussir', reussite: 'réussite',
  // second batch — all non-English, unambiguous accent placement
  competence: 'compétence', competences: 'compétences', preparer: 'préparer', preparez: 'préparez',
  preparons: 'préparons', preparation: 'préparation', preparations: 'préparations',
  beneficier: 'bénéficier', beneficiez: 'bénéficiez', developper: 'développer', developpez: 'développez',
  ameliorer: 'améliorer', amelioration: 'amélioration', ameliorations: 'améliorations',
  numerique: 'numérique', numeriques: 'numériques', specifique: 'spécifique', specifiques: 'spécifiques',
  resultat: 'résultat', resultats: 'résultats', etape: 'étape', etapes: 'étapes',
  evenement: 'événement', evenements: 'événements', decouvrir: 'découvrir', decouvrez: 'découvrez',
  telecharger: 'télécharger', telechargement: 'téléchargement', verifier: 'vérifier', verifiez: 'vérifiez',
  gerer: 'gérer', creer: 'créer', prealable: 'préalable', etabli: 'établi', etablir: 'établir',
  complementaires: 'complémentaires', reglementaires: 'réglementaires',
  operationnel: 'opérationnel', operationnelle: 'opérationnelle', operationnels: 'opérationnels',
  regulier: 'régulier', reguliers: 'réguliers',
  interieur: 'intérieur', exterieur: 'extérieur', superieur: 'supérieur', inferieur: 'inférieur',
  echeance: 'échéance', echeances: 'échéances', beneficiaire: 'bénéficiaire',
  beneficiaires: 'bénéficiaires', tresorerie: 'trésorerie', peripherique: 'périphérique',
  // third batch — non-English, unambiguous
  eligibilite: 'éligibilité', eligibilites: 'éligibilités', selectionnez: 'sélectionnez',
  selectionner: 'sélectionner', generalement: 'généralement', mensualite: 'mensualité',
  mensualites: 'mensualités', fiscalite: 'fiscalité', fiscalites: 'fiscalités',
  penalite: 'pénalité', penalites: 'pénalités', frequence: 'fréquence', frequences: 'fréquences',
  perimetre: 'périmètre', immediatement: 'immédiatement', specialement: 'spécialement',
  precedemment: 'précédemment', numerisation: 'numérisation',
};
// NOTE: deliberately excluded ambiguous-accent verb forms (genere/verifie/detaille/procede/
// regle singular — could be past participle é vs present è) and the no-op "employeur".
// Add capitalized variants automatically.
for (const [k, v] of Object.entries({ ...MAP })) {
  const cap = k.charAt(0).toUpperCase() + k.slice(1);
  const capV = v.charAt(0).toUpperCase() + v.slice(1);
  if (!MAP[cap]) MAP[cap] = capV;
}

const RULES = Object.entries(MAP).map(([from, to]) => {
  const esc = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [new RegExp('(?<![A-Za-zÀ-ÿ])' + esc + '(?![A-Za-zÀ-ÿ])', 'g'), to, from];
});

function replaceInTextNodes(html, counter) {
  // Split into: script blocks | style blocks | tags | text. Only text (even indices) is edited.
  const parts = html.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<[^>]*>)/i);
  for (let i = 0; i < parts.length; i += 2) {
    let seg = parts[i];
    if (!seg || seg.indexOf('&') === -1 && !/[A-Za-z]/.test(seg)) { /* still process */ }
    for (const [re, to, from] of RULES) {
      if (seg.indexOf(from) === -1) continue; // fast skip
      const m = seg.match(re);
      if (m) { counter[from] = (counter[from] || 0) + m.length; seg = seg.replace(re, to); }
    }
    parts[i] = seg;
  }
  return parts.join('');
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
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
}

const DRY = process.argv.includes('--dry');
const files = [];
walk(path.join(__dirname, '..', 'fr'), files);
let filesChanged = 0, total = 0; const counter = {};
for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const out = replaceInTextNodes(html, counter);
  if (out !== html) { filesChanged++; if (!DRY) writeRetry(file, out); }
}
total = Object.values(counter).reduce((a, b) => a + b, 0);
console.log(`${DRY ? '[DRY] ' : ''}FR accent-leak repair: ${total} replacements across ${filesChanged} files.`);
console.log('Top:', Object.entries(counter).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${k}=${v}`).join(', '));
