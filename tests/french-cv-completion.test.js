'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const acorn = require('acorn');
const { localizeSource } = require('../scripts/build-french-cv-runtime');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function pack(source) {
  const context = { document: { readyState: 'loading', addEventListener() {} }, localStorage: { getItem: () => null } };
  context.window = context;
  vm.runInNewContext(source, context);
  return context.CVApplicationPack;
}

test('French pack composes all eight native assets and tones without translating authored values', () => {
  const runtime = pack(read('fr/tools/generateur-cv/js/cv-application-pack.js'));
  const data = { fn: 'Élodie Łukasz', title: 'Revenue', summary: 'Global Compact\nYear 1', skills: { h: 'Copy, Saved' }, exps: [{ t: 'Revenue', c: 'Global Compact', d: 'Year 1 — 20 % vérifiés.' }] };
  for (const tone of ['formal', 'confident', 'graduate', 'executive', 'diaspora']) {
    const output = runtime.generatePack(data, { role: 'Revenue', company: 'Global Compact', jd: 'qualité analyse coordination', tone });
    assert.equal(Object.keys(output).length, 8);
    assert.ok(output.coverLetter.startsWith('À l’équipe de recrutement de Global Compact,'));
    for (const id of ['coverLetter', 'emailMessage', 'recruiterMessage', 'followupApplication', 'followupInterview']) {
      assert.ok(output[id].includes('Revenue'));
      assert.ok(output[id].includes('Global Compact'));
      assert.ok(output[id].includes('Copy, Saved'));
      assert.doesNotMatch(output[id], /I am applying|Dear Hiring|Subject:|Kind regards|I hope you|Thank you/);
    }
    assert.ok(output.linkedinAbout.includes(data.summary));
    assert.ok(output.coverLetter.includes(data.exps[0].d));
    assert.ok(output.coverLetter.includes('qualité'));
    assert.match(output.interviewPrep, /^1\. Présentez/);
  }
  const empty = runtime.generatePack({}, { tone: 'formal' });
  assert.match(empty.coverLetter, /^Madame, Monsieur,/);
  assert.doesNotMatch(JSON.stringify(empty), /your name|target job title|company name|recent employer/);
  assert.doesNotMatch(empty.linkedinHeadline, /target job title/);
});

test('contextual pack translation preserves stored enums and localizes only CSV presentation', () => {
  const input = 'var lead={status:"Saved",tone:"formal",source:"Company website",id:"pack"}; var label="Saved"; var tone="Tone: "+lead.tone; var row=[lead.jobTitle,lead.company,lead.country,lead.cityRemote,lead.jobLink,lead.source,lead.deadline,lead.salaryRange,normalize(lead.status),lead.cvVersionLabel,lead.coverLetterUsed?"yes":"no",lead.applicationPack?"yes":"no",lead.notes,lead.followUpDate,lead.updatedAt];';
  const source = localizeSource(input, 'cv-job-tracker.js').output;
  const context = { normalize: () => 'applied' };
  vm.runInNewContext(source, context);
  assert.equal(context.lead.status, 'Saved');
  assert.equal(context.lead.tone, 'formal');
  assert.equal(context.lead.source, 'Company website');
  assert.equal(context.label, 'Enregistrée');
  assert.equal(context.row[5], 'Site de l’entreprise');
  assert.equal(context.row[8], 'Envoyée');
  assert.deepEqual(Array.from(context.row.slice(10, 12)), ['non', 'non']);
  const printed = localizeSource('var target={tone:"formal"}; var text="Tone: "+target.tone;', 'cv-application-pack.js').output;
  const printContext = {};
  vm.runInNewContext(printed, printContext);
  assert.equal(printContext.text, 'Ton : Formel');
  assert.equal(printContext.target.tone, 'formal');
});

test('CV language selector retains every original language table including English', () => {
  function table(source) {
    let initializer;
    function walk(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'VariableDeclarator' && node.id.name === 'UI_LANG') initializer = source.slice(node.init.start, node.init.end);
      Object.values(node).forEach(child => Array.isArray(child) ? child.forEach(walk) : child && typeof child === 'object' && walk(child));
    }
    walk(acorn.parse(source, { ecmaVersion: 'latest' }));
    assert.ok(initializer);
    return JSON.parse(JSON.stringify(vm.runInNewContext('(' + initializer + ')')));
  }
  assert.deepEqual(table(read('fr/tools/generateur-cv/js/cv-data.js')), table(read('tools/cv-builder/js/cv-data.js')));
});

test('French generated pack retains the shared resolved Unicode PDF path and current tracker refresh', () => {
  const source = read('tools/cv-builder/js/src/cv-application-pack.js');
  const generated = localizeSource(read('tools/cv-builder/js/cv-application-pack.js'), 'cv-application-pack.js').output;
  assert.equal(generated, read('fr/tools/generateur-cv/js/cv-application-pack.js'));
  assert.match(source, /await e\.CVExportAtsPlainPdf\.buildPdf\(n\)/);
  assert.doesNotMatch(generated, /splitTextToSize/);
  assert.match(generated, /CVJobTracker\.render\(\)/);
  assert.match(read('fr/tools/generateur-cv/js/cv-job-tracker.js'), /data-tracker-board translate=\\"no\\"/);
});
