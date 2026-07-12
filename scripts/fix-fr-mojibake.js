#!/usr/bin/env node
// Batch 3: repair '?'-for-accent mojibake in French pages. Each '?' replaced a single
// accented char (or apostrophe) during a lossy encoding step. We only map full French
// words that NEVER occur in code, and apply with word boundaries so JS ternaries and
// ?v= query strings are never touched. Ambiguous fragments are deliberately skipped.
const fs = require('fs');
const path = require('path');

// corrupted -> correct  (only unambiguous whole French words)
const MAP = {
  'M?thodologie': 'Méthodologie', 'm?thodologie': 'méthodologie',
  'M?thode': 'Méthode', 'm?thode': 'méthode', 'm?thodes': 'méthodes',
  'v?rifier': 'vérifier', 'v?rifie': 'vérifie', 'v?rifiez': 'vérifiez', 'V?rifiez': 'Vérifiez',
  'v?rification': 'vérification', 'V?rification': 'Vérification',
  'op?rateur': 'opérateur', 'op?rateurs': 'opérateurs', 'op?ration': 'opération', 'op?rations': 'opérations',
  'pr?pare': 'prépare', 'pr?parer': 'préparer', 'Pr?parer': 'Préparer', 'pr?paration': 'préparation',
  "l?outil": "l'outil", "L?outil": "L'outil", "l?employeur": "l'employeur", "l?estimation": "l'estimation",
  't?l?travail': 'télétravail', 'T?l?charger': 'Télécharger', 'T?l?chargement': 'Téléchargement', 't?l?versez': 'téléversez',
  'r?sultat': 'résultat', 'r?sultats': 'résultats', 'R?sultat': 'Résultat',
  'd?p?t': 'dépôt', 'd?p?ts': 'dépôts',
  'n?gociation': 'négociation', 'n?gocier': 'négocier',
  'Contr?le': 'Contrôle', 'contr?le': 'contrôle', 'contr?ler': 'contrôler',
  "n?est": "n'est", 'Donn?es': 'Données', 'donn?es': 'données',
  'r?sum?': 'résumé', 'R?sum?': 'Résumé', 'r?mun?ration': 'rémunération', 'R?mun?ration': 'Rémunération',
  'cach?s': 'cachés', 'Co?t': 'Coût', 'co?t': 'coût', 'co?ts': 'coûts',
  'r?cup?rer': 'récupérer', 'g?n?re': 'génère', 'g?n?rer': 'générer', 'exp?rience': 'expérience',
  'd?cision': 'décision', 'd?cisions': 'décisions', 'd?claration': 'déclaration', 'd?cide': 'décide',
  'cr?dit': 'crédit', 'comp?tences': 'compétences', 'p?riode': 'période', 'minist?re': 'ministère',
  'hypoth?ses': 'hypothèses', 'esp?ces': 'espèces', 'dat?e': 'datée', 'fran?ais': 'français', 'Fran?ais': 'Français',
  'Dipl?me': 'Diplôme', 'dipl?me': 'diplôme', 't?ches': 'tâches', 's?pare': 'sépare',
  'r?gles': 'règles', 'r?els': 'réels', 'r?elle': 'réelle', 'premi?re': 'première', 'pr?t': 'prêt',
  'fr?quentes': 'fréquentes', 'carri?re': 'carrière', 'Ing?nieur': 'Ingénieur', 'D?veloppeur': 'Développeur',
  'D?tail': 'Détail', 'd?tail': 'détail', 'C?te': 'Côte',
  "d?un": "d'un", "d?achat": "d'achat", 'd?j?': 'déjà', 'r?f?rence': 'référence', 'r?f?rences': 'références',
  's?curit?': 'sécurité', 'r?duction': 'réduction', 'int?r?t': 'intérêt', 'int?r?ts': 'intérêts',
  // second pass
  'sp?cialis?': 'spécialisé', 'sp?cialis?e': 'spécialisée', 'rep?res': 'repères', 'rep?rer': 'repérer',
  'relev?s': 'relevés', 'refl?te': 'reflète', "qu?un": "qu'un", "qu?environ": "qu'environ",
  'pr?teuse': 'prêteuse', 'pr?parez': 'préparez', 'pr?cise': 'précise', 'pr?cis': 'précis',
  'op?rationnelles': 'opérationnelles', 'op?rationnelle': 'opérationnelle', 'op?rationnel': 'opérationnel',
  'march?s': 'marchés', 'march?': 'marché', 'sp?cifique': 'spécifique', 'sp?cifiques': 'spécifiques',
  'compl?te': 'complète', 'compl?ter': 'compléter', 'proc?dure': 'procédure', 'enregistr?': 'enregistré',
  'param?tres': 'paramètres', 'derni?re': 'dernière', 'derni?res': 'dernières', 'probl?me': 'problème',
  'syst?me': 'système', 'r?seau': 'réseau', 'entr?e': 'entrée', 'entr?es': 'entrées', 'activit?': 'activité',
  'caract?res': 'caractères', 'r?el': 'réel', 'imm?diat': 'immédiat', 'n?cessaire': 'nécessaire',
  'g?n?ral': 'général', 'g?n?rale': 'générale', 'sp?cial': 'spécial', 'mod?le': 'modèle', 'mod?les': 'modèles',
  // third pass
  's?lection': 'sélection', 'S?lection': 'Sélection', 's?lectionner': 'sélectionner',
  'r?seaux': 'réseaux', 'r?currents': 'récurrents', 'r?current': 'récurrent', 'r?currente': 'récurrente',
  'r?alistes': 'réalistes', 'r?aliste': 'réaliste', 'r?alisation': 'réalisation', 'r?alis?': 'réalisé',
  "d?ouvrir": "d'ouvrir", 'cr?dible': 'crédible', 'cr?er': 'créer', 'cr?ez': 'créez', 'cr?ation': 'création',
  'd?tecter': 'détecter', 'd?tect?': 'détecté', 'acc?der': 'accéder', 'acc?s': 'accès', 'compl?tez': 'complétez',
  'g?rer': 'gérer', 'g?r?': 'géré', 'imm?diatement': 'immédiatement', 'n?cessaires': 'nécessaires',
  'pr?voir': 'prévoir', 'pr?vu': 'prévu', 'pr?vue': 'prévue', 's?curis?': 'sécurisé', 's?curis?e': 'sécurisée',
  'strat?gie': 'stratégie', 'strat?gies': 'stratégies', 'cat?gorie': 'catégorie', 'cat?gories': 'catégories',
  // fourth pass
  'n?gociez': 'négociez', 'n?gociations': 'négociations', 'n?gociant': 'négociant', 'n?gociable': 'négociable',
  'p?ces': 'pièces', 'pi?ce': 'pièce', 'pi?ces': 'pièces', 'proc?der': 'procéder', 'proc?d?': 'procédé',
  'gr?ce': 'grâce', 'ma?trise': 'maîtrise', 'ma?triser': 'maîtriser', 'cong?': 'congé', 'cong?s': 'congés',
};

function boundary(tok) {
  // \? escaped; whole-word: not preceded/followed by a French letter or another '?'
  const esc = tok.replace(/[.*+^${}()|[\]\\]/g, '\\$&').replace(/\?/g, '\\?');
  return new RegExp('(?<![A-Za-zÀ-ÿ?])' + esc + '(?![A-Za-zÀ-ÿ])', 'g');
}
const RULES = Object.entries(MAP).map(([from, to]) => [boundary(from), to, from]);

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

const files = [];
walk(path.join(__dirname, '..', 'fr'), files);
let filesChanged = 0, totalRepl = 0; const perToken = {};
for (const file of files) {
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  for (const [re, to, from] of RULES) {
    const m = html.match(re);
    if (m) { perToken[from] = (perToken[from] || 0) + m.length; totalRepl += m.length; html = html.replace(re, to); }
  }
  if (html !== before) { writeRetry(file, html); filesChanged++; }
}
console.log(`Mojibake repair: ${totalRepl} replacements across ${filesChanged} files.`);
console.log('Top tokens:', Object.entries(perToken).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k}=${v}`).join(', '));
