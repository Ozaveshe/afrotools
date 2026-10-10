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
