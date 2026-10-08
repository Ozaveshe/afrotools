'use strict';
const assert = require('node:assert/strict');
const { context, apply } = require('../assets/js/components/localized-enquiry-context');

for (const [input, expected] of [['widget-demo','widget_demo'],['sponsored-tool','sponsored_tool'],['api-pilot','api_pilot'],['white-label','white_label']]) {
  assert.deepEqual(context('?offer='+input+'&tool=invoice-generator&source_route=%2Ffr%2Ftools%2Ffacture%2F'), {
    requested_offer: expected, prospect_segment: '', cta_type: '', relevant_tool: 'invoice-generator', source_route: '/fr/tools/facture/'
  });
}
for (const source of ['https://example.com/','//example.com/','/tools/x/?email=synthetic@example.test','/x/#private','/../secret','/x/%2e%2e/secret']) {
  assert.equal(context('?source='+encodeURIComponent(source)).source_route, '');
}
for (const tool of ['<img src=x>', 'synthetic@example.test', 'a'.repeat(97), 'private text']) {
  assert.equal(context('?tool='+encodeURIComponent(tool)).relevant_tool, '');
}
assert.equal(context('?offer=unknown').requested_offer, '');
assert.equal(context('?prospect_segment=hr-payroll&cta_type=business-cta').prospect_segment, 'hr_payroll');
assert.equal(context('?prospect_segment=unknown&cta_type=private').prospect_segment, '');
assert.equal(context('?cta_type=private').cta_type, '');
assert.deepEqual(Object.keys(context('?email=synthetic@example.test&utm_campaign=private&referrer=private')).sort(), ['cta_type','prospect_segment','relevant_tool','requested_offer','source_route']);
const form = {elements: {requested_offer:{value:''},relevant_tool:{value:'user-selected-tool'},source_route:{value:''}}};
apply(form, '?offer=api-pilot&tool=invoice-generator&source=%2Ftools%2Finvoice-generator%2F');
assert.equal(form.elements.requested_offer.value, 'api_pilot');
assert.equal(form.elements.relevant_tool.value, 'user-selected-tool');
assert.equal(form.elements.source_route.value, '/tools/invoice-generator/');
console.log('Localized enquiry context: four offers, bounded route/tool input and existing values verified.');
