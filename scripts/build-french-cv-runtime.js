'use strict';

const fs = require('fs');
const path = require('path');
const acorn = require('acorn');

const ROOT = path.resolve(__dirname, '..');
const ENGLISH_PAGE = path.join(ROOT, 'tools', 'cv-builder', 'index.html');
const SOURCE_DIR = path.join(ROOT, 'tools', 'cv-builder', 'js');
const OUTPUT_DIR = path.join(ROOT, 'fr', 'tools', 'generateur-cv', 'js');
const OVERRIDES = require('../data/localization/fr-document-pdf-lexicon-overrides.json');

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
  ]
]);

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

function translateMarkup(value) {
  let output = String(value);
  output = output.replace(/>([^<>]+)</g, (match, text) => `>${exact(text)}<`);
  output = output.replace(
    /\b(placeholder|title|aria-label|aria-description)=("|')([\s\S]*?)\2/g,
    (match, name, quote, text) => `${name}=${quote}${exact(text)}${quote}`
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

function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  visit(node);
  Object.keys(node).forEach((key) => {
    if (key === 'start' || key === 'end' || key === 'loc') return;
    const child = node[key];
    if (Array.isArray(child)) child.forEach((entry) => walk(entry, visit));
    else if (child && typeof child === 'object' && typeof child.type === 'string') walk(child, visit);
  });
}

function localizeSource(source, filename) {
  const ast = acorn.parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'script',
    allowHashBang: true
  });
  const edits = [];
  walk(ast, (node) => {
    if (node.type === 'Literal' && typeof node.value === 'string') {
      const translated = translateValue(node.value);
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
  edits.sort((a, b) => b.start - a.start).forEach((edit) => {
    output = `${output.slice(0, edit.start)}${edit.value}${output.slice(edit.end)}`;
  });
  try {
    acorn.parse(output, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true });
  } catch (error) {
    throw new Error(`${filename}: localized JavaScript is invalid: ${error.message}`);
  }
  return { output, edits: edits.length };
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

module.exports = { build, localizeSource, translateValue };
