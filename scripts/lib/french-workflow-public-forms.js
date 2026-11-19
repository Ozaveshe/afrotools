'use strict';

// Only values needed to construct and run the visitor's form may cross the
// public build boundary. The editorial and verification registry stays private.
function publicField(field) {
  const result = { name: field.name, label: field.label, type: field.type };
  for (const key of ['min', 'max', 'step']) {
    if (field[key] !== undefined) result[key] = field[key];
  }
  if (field.options) result.options = field.options.map(([value, label]) => [value, label]);
  result.exampleValue = /^Synthetic\s/i.test(field.fixtureValue || '') ? '' : field.fixtureValue;
  return result;
}

function publicForms(rows) {
  return {
    schemaVersion: 1,
    forms: Object.fromEntries(rows.map(row => [row.englishId, {
      englishId: row.englishId,
      name: row.name,
      frenchRoute: row.frenchRoute,
      workflowControl: row.workflowControl,
      engineMode: row.engineMode,
      sharedEngine: row.sharedEngine,
      fields: row.fields.map(publicField)
    }]))
  };
}

module.exports = { publicForms };
