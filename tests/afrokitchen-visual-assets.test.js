const { test } = require('node:test');
const assert = require('node:assert/strict');
const assets = require('../tools/afrokitchen/visual-assets');
test('ingredient art distinguishes foods and never interpolates ingredient input into SVG', () => {
  assert.notEqual(assets.kind('tomato paste'), assets.kind('Roma tomatoes'));
  assert.equal(assets.kind('beef'), 'meat');
  assert.equal(assets.kind('chicken stock'), 12);
  assert.equal(assets.kind('unknown regional ingredient'), 'generic');
  assert.equal(assets.ingredient('<img src=x onerror=alert(1)>'), assets.ingredient('unknown regional ingredient'));
});
test('equipment suggestions depend on the stored method', () => {
  assert.deepEqual(assets.equipmentFor([{ instruction: 'Serve chilled.' }]), []);
  const equipment = assets.equipmentFor([{ instruction: 'Blend tomatoes. Stir in a pot. Cover with foil and a lid.' }]);
  assert.deepEqual(equipment.map(item => item.name), ['Lidded pot', 'Blender', 'Wooden spoon', 'Kitchen foil']);
});
