const assert = require('node:assert/strict');
const engine = require('../tools/citation-generator/citation-engine.js');

const book = {
  sourceType: 'book',
  authors: 'Okafor, Ada',
  year: '2024',
  title: 'Research across borders',
  edition: '2nd',
  publisher: 'Coast Press'
};

assert.deepEqual(engine.parseAuthors('Okafor, Ada; Mensah, Kwame'), [
  { family: 'Okafor', given: 'Ada' },
  { family: 'Mensah', given: 'Kwame' }
]);

assert.equal(engine.normalizeDoi('https://doi.org/10.1000/xyz'), 'https://doi.org/10.1000/xyz');
assert.equal(engine.normalizeDoi('doi: 10.1000/xyz'), 'https://doi.org/10.1000/xyz');

const apaBook = engine.generate({ ...book, style: 'apa' });
assert.equal(apaBook.valid, true);
assert.equal(apaBook.reference, 'Okafor, A. (2024). Research across borders (2nd ed.). Coast Press.');
assert.match(apaBook.referenceHtml, /<cite>Research across borders<\/cite>/);
assert.equal(apaBook.inText, '(Okafor, 2024)');

const mlaBook = engine.generate({ ...book, style: 'mla' });
assert.equal(mlaBook.reference, 'Okafor, Ada. Research across borders. 2nd ed. Coast Press, 2024.');
assert.equal(mlaBook.inText, '(Okafor)');

const chicagoJournal = engine.generate({
  style: 'chicago',
  sourceType: 'journal',
  authors: 'Mensah, Kwame; Diallo, Awa',
  year: '2025',
  title: 'Regional evidence',
  containerTitle: 'African Research Review',
  volume: '12',
  issue: '2',
  pages: '24–39',
  doi: '10.1000/example'
});
assert.equal(chicagoJournal.reference, 'Mensah, Kwame, and Awa Diallo. 2025. “Regional evidence.” African Research Review 12, no. 2: 24–39. https://doi.org/10.1000/example.');
assert.equal(chicagoJournal.inText, '(Mensah 2025)');

const mlaWeb = engine.generate({
  style: 'mla',
  sourceType: 'webpage',
  organization: 'African Union',
  year: '2026',
  publicationDate: '2026-07-05',
  title: 'Education strategy',
  containerTitle: 'African Union',
  url: 'au.int/education',
  accessDate: '2026-07-26'
});
assert.equal(mlaWeb.reference, 'African Union. “Education strategy.” African Union. 5 Jul. 2026. au.int/education. Accessed 26 Jul. 2026.');

const apaCorporateWeb = engine.generate({
  style: 'apa',
  sourceType: 'webpage',
  organization: 'African Union',
  year: '2026',
  publicationDate: '2026-07-05',
  title: 'Education strategy',
  containerTitle: 'African Union',
  url: 'https://au.int/education'
});
assert.equal(apaCorporateWeb.reference, 'African Union. (2026, July 5). Education strategy. https://au.int/education');
assert.match(apaCorporateWeb.referenceHtml, /<cite>Education strategy<\/cite>/);

assert.match(mlaWeb.referenceHtml, /<cite>African Union<\/cite>/);
assert.doesNotMatch(mlaWeb.referenceHtml, /<cite>Education strategy<\/cite>/);

const twentyOneAuthors = Array.from({ length: 21 }, (_, index) => `Author${index + 1}, Ada`).join('; ');
const apaManyAuthors = engine.generate({ ...book, style: 'apa', authors: twentyOneAuthors });
assert.match(apaManyAuthors.reference, /^Author1, A\., Author2, A\.,/);
assert.match(apaManyAuthors.reference, /Author19, A\., … Author21, A\. \(2024\)/);
assert.doesNotMatch(apaManyAuthors.reference, /Author20/);

const harvard = engine.generate({
  style: 'harvard',
  sourceType: 'report',
  organization: 'Ministry of Education',
  year: '2025',
  title: 'Annual education report',
  publisher: 'Ministry of Education',
  reportNumber: 'Report 14',
  url: 'https://example.gov/report'
});
assert.equal(harvard.valid, true);
assert.match(harvard.note, /vary by institution/i);
assert.match(harvard.reference, /Available at: https:\/\/example\.gov\/report/);

const invalid = engine.generate({ style: 'apa', sourceType: 'journal', title: 'Only a title' });
assert.equal(invalid.valid, false);
assert.ok(invalid.errors.includes('Enter at least one author or an organisation.'));
assert.ok(invalid.errors.includes('Enter the journal name.'));

const escaped = engine.generate({ ...book, style: 'apa', title: '<img src=x onerror=alert(1)>' });
assert.doesNotMatch(escaped.referenceHtml, /<img/);
assert.match(escaped.referenceHtml, /&lt;img/);

console.log('citation-generator-vip: all assertions passed');
