(function (root, factory) {
  'use strict';

  var contract = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = contract;
  }

  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.B2BChoiceContract = contract;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var OFFER_LABELS = Object.freeze({
    widget_demo: 'Widget demo request',
    widget_pro: 'Widget Pro enquiry',
    sponsored_tool: 'Sponsored tool enquiry',
    custom_calculator: 'Custom calculator request',
    api_pilot: 'API pilot request',
    media_kit: 'Media kit request',
    white_label: 'White-label request',
    business_subscription: 'Business subscription enquiry',
    other: 'Other B2B enquiry'
  });

  var OFFER_ALIASES = Object.freeze({
    'widget-demo': 'widget_demo',
    'demo-widget': 'widget_demo',
    'widget-request': 'widget_demo',
    widget: 'widget_demo',
    widgets: 'widget_demo',
    'widget-pro': 'widget_pro',
    'sponsored-tool': 'sponsored_tool',
    'sponsored-tools': 'sponsored_tool',
    sponsorship: 'sponsored_tool',
    'custom-calculator': 'custom_calculator',
    'custom-calculators': 'custom_calculator',
    calculator: 'custom_calculator',
    'api-growth': 'api_pilot',
    'api-growth-pilot': 'api_pilot',
    'api-pro': 'api_pilot',
    'api-pro-pilot': 'api_pilot',
    'api-enterprise': 'api_pilot',
    'api-pilot': 'api_pilot',
    api: 'api_pilot',
    'media-kit': 'media_kit',
    media: 'media_kit',
    'white-label': 'white_label',
    whitelabel: 'white_label',
    'business-subscription': 'business_subscription',
    'pro-workspace': 'business_subscription',
    'team-rollout': 'business_subscription'
  });

  var PROSPECT_LABELS = Object.freeze({
    accounting_firm: 'Accounting firm',
    hr_payroll: 'HR or payroll company',
    fintech: 'Fintech',
    school_edtech: 'School or edtech',
    business_media: 'Business media or publisher',
    immigration: 'Immigration or relocation advisor',
    association_blog: 'Association, community, or blog',
    developer_api: 'Developer or API buyer',
    other: 'Other business buyer'
  });

  var PROSPECT_ALIASES = Object.freeze({
    accounting: 'accounting_firm',
    accountant: 'accounting_firm',
    'accounting-firm': 'accounting_firm',
    'hr-payroll': 'hr_payroll',
    payroll: 'hr_payroll',
    hr: 'hr_payroll',
    fintech: 'fintech',
    school: 'school_edtech',
    schools: 'school_edtech',
    edtech: 'school_edtech',
    'school-edtech': 'school_edtech',
    media: 'business_media',
    publisher: 'business_media',
    'business-media': 'business_media',
    immigration: 'immigration',
    relocation: 'immigration',
    blog: 'association_blog',
    blogger: 'association_blog',
    association: 'association_blog',
    community: 'association_blog',
    'developer-api': 'developer_api',
    developer: 'developer_api',
    api: 'developer_api',
    other: 'other'
  });

  function normalizeKey(value) {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function normalizeChoice(value, aliases, labels, fallback) {
    var key = normalizeKey(value);
    if (!key) return fallback;
    var mapped = aliases[key] || key.replace(/-/g, '_');
    return labels[mapped] ? mapped : fallback;
  }

  function normalizeOffer(value, fallback) {
    return normalizeChoice(value, OFFER_ALIASES, OFFER_LABELS, fallback || 'other');
  }

  function normalizeProspect(value, fallback) {
    return normalizeChoice(value, PROSPECT_ALIASES, PROSPECT_LABELS, fallback || 'other');
  }

  return Object.freeze({
    OFFER_LABELS: OFFER_LABELS,
    OFFER_ALIASES: OFFER_ALIASES,
    PROSPECT_LABELS: PROSPECT_LABELS,
    PROSPECT_ALIASES: PROSPECT_ALIASES,
    normalizeChoice: normalizeChoice,
    normalizeOffer: normalizeOffer,
    normalizeProspect: normalizeProspect
  });
}));
