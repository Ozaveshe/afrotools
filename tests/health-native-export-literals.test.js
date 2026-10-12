"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { collectEnglishLiteralText } = require("../scripts/lib/health-native-export-literals");

test("native report copy cannot enter English translation input", () => {
  const source = `
    const frenchItems = { plannedCare: 'Soins prévus' };
    function frenchText(value) { return { 'English reference': 'Référence française' }[value]; }
    const frenchReport = () => 'Rapport privé';
    const label = isFrench ? 'Date du devis' : 'Quote date';
    if (isFrench) { show('Créé localement'); } else { show('Created locally'); }
    const report = () => document.documentElement.lang === 'fr' ? frenchReport() : 'Private report';
    show('New English copy still requires translation');
    show('<tr><td data-no-fr-health-translate>');
    const escaped = 'Provider\\\'s quote';
    const match = /"fake code between quotes"/;
  `;
  const actual = collectEnglishLiteralText(source);
  for (const text of ["Quote date", "Created locally", "Private report", "New English copy still requires translation", "Provider's quote"]) assert.ok(actual.has(text), text);
  for (const text of ["Soins prévus", "English reference", "Référence française", "Rapport privé", "Date du devis", "Créé localement", "fake code between quotes", "<tr><td data-no-fr-health-translate>"]) assert.ok(!actual.has(text), text);
});

test("malformed JavaScript fails collection instead of hiding missing translations", () => {
  assert.throws(() => collectEnglishLiteralText("const broken = 'unterminated"), SyntaxError);
});

test("native report functions and locale predicates preserve English collection", () => {
  const source = `
    function frenchBriefText() { return 'Questions pour la clinique'; }
    function frenchPlanText() { return 'Contacts prénatals'; }
    function frenchWorksheetText() { return 'Fiche de calcul'; }
    function frenchExportText() { return 'Mesures de pression'; }
    function frenchWaterCopy() { return { 'Engine wording': 'Texte français' }; }
    const title = isFrench() ? 'Calendrier français' : 'English calendar';
    const summary = isFrenchReport() ? 'Rapport français' : 'English report';
    if (isFrenchReport()) { show('Préparé localement'); } else { show('Prepared locally'); }
    show('New English control still needs translation');
  `;
  const strings = collectEnglishLiteralText(source);
  assert.deepEqual([...strings].sort(), [
    "English calendar", "English report", "New English control still needs translation", "Prepared locally"
  ].sort());
});

test("explicit bilingual quote labels stay native without hiding unrelated copy", () => {
  const source = `
    function t(en, french) { return fr() ? french : en; }
    show(t('Quote date', 'Date du devis'));
    show(t('Dynamic English copy', lookup('Dynamic source')));
    show(other('Untranslated control', 'Untranslated hint'));
    show('New English control still needs translation');
  `;
  assert.deepEqual([...collectEnglishLiteralText(source)].sort(), [
    "Dynamic English copy", "Dynamic source", "Untranslated control", "Untranslated hint",
    "New English control still needs translation"
  ].sort());
  assert.deepEqual([...collectEnglishLiteralText("t('Unknown English', 'Unknown second argument')")].sort(), [
    "Unknown English", "Unknown second argument"
  ]);
});
