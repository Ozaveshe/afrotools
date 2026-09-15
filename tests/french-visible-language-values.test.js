'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { localizeVisibleLanguage } = require('../scripts/lib/french-visible-language');

test('visible translation preserves submitted values and code while translating labels', () => {
  const html = '<label title="Monthly">Monthly</label><select name="period"><option value="monthly">Monthly</option><option value="annual">Annual</option></select>'
    + '<input type="text" value="Save" placeholder="Enter"><input type="hidden" value="annual">'
    + '<input type="checkbox" value="monthly"><button value="save">Save</button>'
    + '<script>const period="monthly";</script><textarea>Monthly</textarea>';
  assert.equal(localizeVisibleLanguage(html),
    '<label title="mensuel">mensuel</label><select name="period"><option value="monthly">mensuel</option><option value="annual">annuel</option></select>'
    + '<input type="text" value="Save" placeholder="saisissez"><input type="hidden" value="annual">'
    + '<input type="checkbox" value="monthly"><button value="save">enregistrer</button>'
    + '<script>const period="monthly";</script><textarea>Monthly</textarea>');
});

test('input button values remain translatable visible labels', () => {
  assert.equal(localizeVisibleLanguage('<input value="Save" type="button"><input type="submit" value="Calculate"><input type="reset" value="Reset">'),
    '<input value="enregistrer" type="button"><input type="submit" value="calculer"><input type="reset" value="réinitialiser">');
});
