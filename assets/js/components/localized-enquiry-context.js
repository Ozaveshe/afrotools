(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../lib/b2b-choice-contract.js'));
  } else {
    var api = factory(root.AfroTools && root.AfroTools.B2BChoiceContract);
    root.document.querySelectorAll('[data-localized-enquiry-context]').forEach(function (form) {
      api.apply(form, root.location.search);
    });
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (contract) {
  'use strict';

  function context(search) {
    var params = new URLSearchParams(search);
    var tool = params.get('tool') || '';
    var source = params.get('source_route') || params.get('source') || '';
    var offer = contract ? contract.normalizeOffer(params.get('offer'), '__unknown__') : '__unknown__';
    var prospect = contract ? contract.normalizeProspect(params.get('prospect_segment') || params.get('prospect'), '__unknown__') : '__unknown__';
    return {
      requested_offer: offer === '__unknown__' ? '' : offer,
      prospect_segment: prospect === '__unknown__' ? '' : prospect,
      cta_type: params.get('cta_type') === 'business-cta' ? 'business-cta' : '',
      relevant_tool: /^[a-z0-9][a-z0-9-]{0,95}$/.test(tool) ? tool : '',
      // Keep only a local route. Never forward query strings, fragments or external URLs.
      source_route: /^\/(?!\/)[a-z0-9/_-]{0,190}(?:\.html)?\/?$/.test(source) ? source : ''
    };
  }

  function apply(form, search) {
    var values = context(search);
    Object.keys(values).forEach(function (name) {
      var field = form.elements[name];
      if (field && values[name] && !field.value) field.value = values[name];
    });
  }

  return { context: context, apply: apply };
}));
