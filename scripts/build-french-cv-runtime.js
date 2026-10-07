'use strict';

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const crypto = require('node:crypto');

const ROOT = path.resolve(__dirname, '..');
const ENGLISH_PAGE = path.join(ROOT, 'tools', 'cv-builder', 'index.html');
const SOURCE_DIR = path.join(ROOT, 'tools', 'cv-builder', 'js');
const OUTPUT_DIR = path.join(ROOT, 'fr', 'tools', 'generateur-cv', 'js');
const OVERRIDES = require('../data/localization/fr-document-pdf-lexicon-overrides.json');
const PACK_COPY = require('../data/localization/fr-cv-application-pack-copy.json');
const COUNTRY_COPY = require('../data/localization/fr-cv-country-rules-copy.json');
const COUNTRY_DISPLAY_FIELDS = new Set(['length', 'originLabel', 'references', 'language', 'term', 'notes', 'warning']);
const STRUCTURED_VALUES = new Set(['id', 'status', 'tone', 'active', 'type', 'mode', 'action', 'source']);

const translations = {
  ...OVERRIDES.routes['cv-builder'],
  Save: 'Enregistrer',
  Print: 'Imprimer',
  Open: 'Ouvrir',
  Close: 'Fermer',
  Next: 'Suivant',
  Back: 'Retour',
  Copy: 'Copier',
  Delete: 'Supprimer',
  Cancel: 'Annuler',
  Download: 'Télécharger',
  Upload: 'Importer',
  Clear: 'Effacer',
  Reset: 'Réinitialiser'
};

const reviewedFragments = new Map([
  [
    'Fill your name, contact, and summary to open these private next steps. Readiness: ',
    'Renseignez votre nom, vos coordonnées et votre résumé pour ouvrir ces étapes privées. Progression : '
  ],
  ['Choose from ', 'Choisissez parmi '],
  [' export-ready templates. Use filters for role type, market, ATS safety, and application style.', ' modèles prêts à l’exportation. Filtrez-les par type de poste, marché, compatibilité ATS et style de candidature.'],
  [' templates shown', ' modèles affichés'],
  [' selected. Use ATS Plain or Global Compact for strict portals.', ' sélectionné. Utilisez ATS simple ou Compact international pour les portails aux exigences strictes.']
]);

const trackerHeaderLabels = {
  job_title: 'poste', company: 'entreprise', country: 'pays', city_remote: 'ville_ou_distanciel',
  job_link: 'lien_offre', source: 'source', deadline: 'échéance', salary_range: 'fourchette_salariale',
  status: 'statut', cv_version_used: 'version_cv_utilisée', cover_letter_attached: 'lettre_motivation_jointe',
  application_pack_attached: 'dossier_candidature_joint', notes: 'notes', follow_up_date: 'date_relance', updated_at: 'mis_à_jour_le'
};

function clean(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function exact(value) {
  const normalized = clean(value);
  if (!normalized || !Object.prototype.hasOwnProperty.call(translations, normalized)) return value;
  const leading = String(value).match(/^\s*/)[0];
  const trailing = String(value).match(/\s*$/)[0];
  return `${leading}${translations[normalized]}${trailing}`;
}

function translateMarkup(value, exactCopy = exact) {
  let output = String(value);
  output = output.replace(/>([^<>]+)</g, (match, text) => `>${exactCopy(text)}<`);
  output = output.replace(
    /\b(placeholder|title|aria-label|aria-description)=("|')([\s\S]*?)\2/g,
    (match, name, quote, text) => `${name}=${quote}${exactCopy(text)}${quote}`
  );
  return output;
}

function translateValue(value) {
  let output = exact(value);
  if (output === value && /[<>]/.test(value)) output = translateMarkup(value);
  reviewedFragments.forEach((translated, source) => {
    if (output.includes(source)) output = output.split(source).join(translated);
  });
  return output;
}

function walk(node, visit, parent, ancestors = []) {
  if (!node || typeof node !== 'object') return;
  visit(node, parent, ancestors);
  Object.keys(node).forEach((key) => {
    if (key === 'start' || key === 'end' || key === 'loc') return;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((entry) => walk(entry, visit, node, [...ancestors, node]));
    else if (child && typeof child === 'object' && typeof child.type === 'string') walk(child, visit, node, [...ancestors, node]);
  });
}

// Country guidance has policy enums beside display copy. Keep this module out
// of the generic exact-string translator, and require review on source drift.
function localizeCountryAdvice(source, filename, copy = COUNTRY_COPY) {
  const hash = crypto.createHash('sha256').update(source.replace(/\r\n/g, '\n')).digest('hex');
  if (copy.schemaVersion !== 1 || copy.locale !== 'fr' || copy.sourceHashes[filename] !== hash) {
    throw new Error(`${filename}: country-advice source fingerprint changed; review the maintained French copy`);
  }
  const ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'script' });
  const edits = [];
  const profiles = new Set();
  const rules = filename === 'cv-country-rules.js';
  const owns = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function nativeValue(table, value, context) {
    if (!table || !owns(table, value) || typeof table[value] !== 'string' || !table[value].trim()) {
      throw new Error(`${filename}: missing French ${context}`);
    }
    return table[value];
  }
  function ui(value) {
    return owns(copy.ui, clean(value)) ? exactUi(value) : value;
  }
  function exactUi(value) {
    return value.match(/^\s*/)[0] + nativeValue(copy.ui, clean(value), 'UI copy') + value.match(/\s*$/)[0];
  }
  walk(ast, (node, parent) => {
    if (rules && node.type === 'CallExpression' && node.arguments.length === 4
      && node.arguments.slice(0, 3).every(argument => argument.type === 'Literal' && typeof argument.value === 'string')
      && /^(?:[A-Z]{2}|INTL|OTHER)$/.test(node.arguments[0].value)) {
      const [code, name] = node.arguments.map(argument => argument.value);
      const profile = copy.profiles[code];
      if (!profile || profile[0] !== name || typeof profile[1] !== 'string' || !profile[1].trim() || profiles.has(code)) {
        throw new Error(`${filename}: missing or changed French country profile ${code}`);
      }
      profiles.add(code);
      const argument = node.arguments[1];
      if (profile[1] !== name) edits.push({ start: argument.start, end: argument.end, value: JSON.stringify(profile[1]) });
    }
    if (node.type !== 'Literal' || typeof node.value !== 'string') return;
    if (parent.type === 'Property' && parent.key === node && !parent.computed) return;
    // Only the name argument is display copy. Codes, dial strings and the
    // function's policy object keep their original representation.
    if (parent.type === 'CallExpression' && profiles.has(parent.arguments[0] && parent.arguments[0].value)
      && parent.arguments.slice(0, 3).includes(node)) return;
    let translated = node.value;
    const property = parent.type === 'Property' && parent.value === node ? parent.key.name || parent.key.value : null;
    if (rules && COUNTRY_DISPLAY_FIELDS.has(property)) {
      translated = nativeValue(copy.displayValues[property], node.value, `${property} copy`);
    } else if (rules && ['code', 'dial', 'photo', 'dob', 'marital', 'nationality', 'origin', 'nationalId', 'templates'].includes(property)) {
      return;
    } else if (rules && ['common', 'optional', 'discouraged', 'avoid', 'requested',
      'lagos', 'abuja', 'cape', 'cairo', 'franco', 'diaspora', 'global', 'panaf', 'slate', 'impact', 'accra', 'nairobi', 'kigali'].includes(property)) {
      translated = nativeValue(copy.ui, node.value, 'policy or template display label');
    } else if ((parent.type === 'CallExpression' && /[a-z]/i.test(node.value) && /\s/.test(node.value) && !/[<>]/.test(node.value))
      || (parent.type === 'AssignmentExpression' && parent.left.type === 'MemberExpression' && parent.left.property.name === 'textContent')) {
      translated = nativeValue(copy.ui, node.value, 'control or notification copy');
    } else {
      translated = ui(node.value);
      if (translated === node.value && /[<>]/.test(node.value)) translated = translateMarkup(node.value, exactUi);
    }
    if (translated !== node.value) edits.push({ start: node.start, end: node.end, value: JSON.stringify(translated) });
  });
  if (rules && (profiles.size !== 56 || Object.keys(copy.profiles).length !== 56
    || Object.keys(copy.profiles).some(code => !profiles.has(code)))) {
    throw new Error(`${filename}: French country profile coverage is incomplete`);
  }
  let output = source;
  edits.sort((a, b) => b.start - a.start).forEach(edit => {
    output = output.slice(0, edit.start) + edit.value + output.slice(edit.end);
  });
  acorn.parse(output, { ecmaVersion: 'latest', sourceType: 'script' });
  return { output, edits: edits.length };
}

function localizeSource(source, filename) {
  if (['cv-country-rules.js', 'cv-country-advisor-compact.js'].includes(filename)) {
    return localizeCountryAdvice(source, filename);
  }
  const ast = acorn.parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'script',
    allowHashBang: true
  });
  const edits = [];
  const isPackModule = PACK_COPY.modules.includes(filename);
  const sourceLabels = JSON.stringify(PACK_COPY.sourceLabels);
  const statusLabels = JSON.stringify(PACK_COPY.statusLabels);
  const toneLabels = JSON.stringify(PACK_COPY.toneLabels);
  const copy = value => Object.prototype.hasOwnProperty.call(PACK_COPY.literals, value)
    ? PACK_COPY.literals[value] : exact(value);
  function packValue(value) {
    let output = copy(value);
    if (output === value && /[<>]/.test(value)) output = translateMarkup(value, copy);
    // These literals are split around escaped user values, so normal HTML
    // translation cannot see a complete placeholder or dynamic status.
    output = output.replace('placeholder="Generate or write your ', 'placeholder="Générez ou rédigez votre ')
      .replace(' here."', ' ici."')
      .replace('data-pack-status>', 'data-pack-status role="status" aria-live="polite" translate="no" data-cv-user-text>')
      .replace('data-tracker-board>', 'data-tracker-board translate="no" data-cv-user-text>')
      .replace('data-import-review hidden>', 'data-import-review hidden translate="no" data-cv-user-text>')
      .replace(' parsed locally. Edit anything before importing.', ' analysé localement. Modifiez les éléments nécessaires avant de confirmer l’importation.')
      .replace('% confidence</b>', '% de confiance</b>');
    return output;
  }
  walk(ast, (node, parent, ancestors) => {
    // Preserve the existing selector's language lookup tables. Translating
    // UI_LANG.en destroys the English lookup even when the selector says English.
    if (filename === 'cv-data.js' && ancestors.some(entry => entry.type === 'VariableDeclarator' && entry.id.name === 'UI_LANG')) return;
    if (isPackModule && ancestors.some(entry => entry.type === 'Property'
      && STRUCTURED_VALUES.has(entry.key.name || entry.key.value) && entry.value.start <= node.start && entry.value.end >= node.end)) return;
    if (filename === 'cv-application-pack.js' && node.type === 'ObjectExpression'
      && ['and', 'the', 'experience'].every(key => node.properties.some(property => (property.key.name || property.key.value) === key))) {
      const stopwords = ['les', 'des', 'pour', 'avec', 'une', 'est', 'qui', 'dans', 'que', 'aux', 'sur', 'par', 'ces', 'nos', 'vous', 'votre', 'compétences', 'expérience'];
      edits.push({ start: node.start, end: node.end, value: source.slice(node.start, node.end - 1) + ',' + stopwords.map(word => JSON.stringify(word) + ':1').join(',') + '}' });
      return;
    }
    if (filename === 'cv-application-pack.js' && node.type === 'Literal' && node.regex
      && node.regex.pattern === '\\[target job title\\]') {
      edits.push({ start: node.start, end: node.end, value: '/\\[intitulé du poste visé\\]/' });
      return;
    }
    // These CSV cells and the printed tone are presentation, separate from the
    // persisted source/status/tone enums. Authored values remain literal.
    if (filename === 'cv-application-pack.js' && node.type === 'BinaryExpression'
      && node.left.value === 'Tone: ' && node.right.type === 'MemberExpression' && node.right.property.name === 'tone') {
      const value = source.slice(node.right.start, node.right.end);
      edits.push({ start: node.start, end: node.end, value: `${JSON.stringify(PACK_COPY.literals['Tone: '])}+(${toneLabels}[${value}]||${value})` });
      return;
    }
    if (filename === 'cv-job-tracker.js' && node.type === 'ArrayExpression' && node.elements.length === 15
      && node.elements[0].type === 'MemberExpression' && node.elements[0].property.name === 'jobTitle') {
      for (const [index, labels] of [[5, sourceLabels], [8, statusLabels]]) {
        const cell = node.elements[index], value = source.slice(cell.start, cell.end);
        edits.push({ start: cell.start, end: cell.end, value: `(${labels}[${value}]||${value})` });
      }
    }
    // Datalist suggestion values remain English for storage compatibility;
    // their visible labels use French. Freeform source text is never rewritten.
    if (filename === 'cv-job-tracker.js' && node.type === 'ReturnStatement' && node.argument
      && node.argument.type === 'BinaryExpression' && node.argument.right.value === '">'
      && node.argument.left.type === 'BinaryExpression' && node.argument.left.left.value === '<option value="') {
      const call = node.argument.left.right;
      if (call.type === 'CallExpression' && call.arguments[0].type === 'Identifier') {
        const escaped = source.slice(call.start, call.end), value = source.slice(call.arguments[0].start, call.arguments[0].end);
        const escapeName = source.slice(call.callee.start, call.callee.end);
        edits.push({ start: node.start, end: node.end, value: `return '<option value="'+${escaped}+'">'+${escapeName}(${sourceLabels}[${value}]||${value})+'</option>';` });
        return;
      }
    }
    if (node.type === 'Literal' && typeof node.value === 'string') {
      // Localize copy, never object keys, routing identifiers or data-field names.
      if (parent && parent.type === 'Property' && parent.key === node && !parent.computed) return;
      // CSV headings are presentation. The lead object's keys and values stay
      // unchanged; applying a blanket Blob rewrite could change user text.
      const isTrackerHeader = filename === 'cv-job-tracker.js' && parent && parent.type === 'ArrayExpression'
        && parent.elements[0] && parent.elements[0].value === 'job_title';
      const translated = isTrackerHeader ? trackerHeaderLabels[node.value] || node.value
        : filename === 'cv-job-tracker.js' && parent.type === 'ConditionalExpression' && ['yes', 'no'].includes(node.value)
          ? node.value === 'yes' ? 'oui' : 'non'
          : isPackModule ? packValue(node.value) : translateValue(node.value);
      if (translated !== node.value) {
        edits.push({ start: node.start, end: node.end, value: JSON.stringify(translated) });
      }
      return;
    }
    if (node.type === 'TemplateElement') {
      const sourceValue = node.value.cooked == null ? node.value.raw : node.value.cooked;
      const translated = translateValue(sourceValue);
      if (translated !== sourceValue) {
        edits.push({
          start: node.start,
          end: node.end,
          value: translated
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$\{/g, '\\${')
        });
      }
    }
  });
  let output = source;
  // Parent edits contain already localized text; discard child literal edits
  // instead of applying overlapping ranges to a modified source offset.
  const outerEdits = edits.filter(edit => !edits.some(other => other !== edit && other.start <= edit.start && other.end >= edit.end));
  outerEdits.sort((a, b) => b.start - a.start).forEach((edit) => {
    output = `${output.slice(0, edit.start)}${edit.value}${output.slice(edit.end)}`;
  });
  try {
    acorn.parse(output, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true });
  } catch (error) {
    throw new Error(`${filename}: localized JavaScript is invalid: ${error.message}`);
  }
  return { output, edits: outerEdits.length };
}

function referencedFiles() {
  const html = fs.readFileSync(ENGLISH_PAGE, 'utf8');
  return [...new Set(
    [...html.matchAll(/(?:\/tools\/cv-builder\/js\/|\.\/js\/)([^"'?]+\.js)/g)].map((match) => match[1])
  )].sort();
}

function build() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const results = [];
  referencedFiles().forEach((filename) => {
    const source = fs.readFileSync(path.join(SOURCE_DIR, filename), 'utf8');
    const localized = localizeSource(source, filename);
    const target = path.join(OUTPUT_DIR, filename);
    if (localized.edits > 0) fs.writeFileSync(target, localized.output, 'utf8');
    else if (fs.existsSync(target)) fs.rmSync(target);
    results.push({ filename, edits: localized.edits });
  });
  const changed = results.filter((entry) => entry.edits > 0);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    `${JSON.stringify({
      schemaVersion: 1,
      locale: 'fr',
      source: 'tools/cv-builder/js',
      generatedOn: '2026-07-28',
      files: changed
    }, null, 2)}\n`,
    'utf8'
  );
  console.log(`French CV runtime: ${changed.length} localized module(s), ${changed.reduce((sum, entry) => sum + entry.edits, 0)} reviewed literal edit(s).`);
}

if (require.main === module) build();

module.exports = { build, localizeSource, localizeCountryAdvice, translateValue };
