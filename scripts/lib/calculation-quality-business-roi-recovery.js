'use strict';
const fs = require('fs');
const path = require('path');
const FORMULA_ID = 'formula-engines-business-roi-engine';

function fixtures(formulas, root) {
  const formula = formulas.find(row => row.id === FORMULA_ID);
  if (!formula) return [];
  const review = JSON.parse(fs.readFileSync(path.join(root,
    'data/calculation-quality/reviews/2026-10-13-business-roi-recovery.json'), 'utf8'));
  return review.boundaryFixtures.map(row => ({
    id: row.fixtureId, formulaId: FORMULA_ID, formulaVersion: formula.formulaVersion,
    operation: 'business-roi-recovery', caseClasses: ['date_boundary'],
    input: { method: row.method, parameters: row.input, fields: row.fields || [], projection: row.projection || 'fields' },
    expected: row.nextExpected, tolerance: 0,
    evidence: review.sourceUrl, changeNote: 'reviewed-recovery-2026-10-13'
  }));
}

function run(root, input) {
  if (!['age', 'timeZone', 'holidayEntry'].includes(input.method)) throw new Error('Unsupported Business ROI review method');
  const engine = require(path.join(root, 'engines/business-roi-engine.js'));
  try {
    const result = engine[input.method](input.parameters);
    if (input.projection === 'fields') return Object.fromEntries(input.fields.map(key => [key, result[key]]));
    if (input.projection !== 'calendar-properties') throw new Error('Unsupported Business ROI projection');
    const unfolded = result.ics.replace(/\r\n[ \t]/g, '');
    const property = key => {
      const line = unfolded.split('\r\n').find(value => value.startsWith(key + ':'));
      return line ? line.slice(key.length + 1) : null;
    };
    return {
      uid: property('UID'), stamp: property('DTSTAMP'),
      start: property('DTSTART;VALUE=DATE'), end: property('DTEND;VALUE=DATE'),
      foldedWithin75: result.ics.split('\r\n').every(line => Buffer.byteLength(line) <= 75),
      noBareNewlines: !(/\r(?!\n)|(?<!\r)\n/.test(result.ics)), summary: property('SUMMARY')
    };
  } catch (error) { return { error: error.message }; }
}

module.exports = { fixtures, run };
