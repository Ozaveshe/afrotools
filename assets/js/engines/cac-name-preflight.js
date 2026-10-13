(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.CacNamePreflight = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var types = ['bn', 'ltd', 'plc', 'ngo', 'llp'];
  var sectors = ['general', 'tech', 'finance', 'health', 'education', 'oil-gas', 'real-estate', 'agriculture'];
  var reviewWords = ['federal', 'national', 'government', 'municipal', 'bank', 'insurance', 'assurance', 'university', 'microfinance', 'pension'];
  function clean(value) { return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 200); }
  function evaluate(input) {
    input = input || {};
    var name = String(input.name == null ? '' : input.name).replace(/[\u0000-\u001f\u007f]/g, '').trim(), entity = types.indexOf(input.entityType) >= 0 ? input.entityType : 'bn';
    var industry = sectors.indexOf(input.industry) >= 0 ? input.industry : 'general';
    var items = [], words = name.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
    if (!name) items.push('Enter a proposed name to prepare a local preflight.');
    if (name.length > 200) items.push('This name is ' + name.length + ' characters. The local preflight accepts at most 200 characters. Shorten the name in the field; your original input has not been changed.');
    if (name && name.length < 3) items.push('This short name needs an official format check; the local length check is not a statutory approval rule.');
    if (name && /^\d+$/.test(name)) items.push('A numbers-only name needs an official naming-rule review.');
    reviewWords.forEach(function (word) { if (words.indexOf(word) >= 0) items.push('Possible regulated wording: ' + word + '. Check CAC consent and applicable sector rules.'); });
    if (entity === 'ltd' && !/\b(?:limited|ltd)\.?$/i.test(name)) items.push('The company-name suffix needs review: CAMA section 29 provides Limited/Ltd for a private company.');
    if (entity === 'plc' && !/\b(?:public limited company|plc)\.?$/i.test(name)) items.push('The company-name suffix needs review: CAMA section 29 provides Public Limited Company/PLC.');
    if (industry !== 'general' && industry !== 'tech' && industry !== 'agriculture') items.push('Check the selected industry’s current regulator and licensing requirements separately.');
    var base = name.replace(/\s+(?:limited|ltd|plc)\.?$/i, '').trim();
    var suffix = entity === 'ltd' ? ' Limited' : entity === 'plc' ? ' PLC' : entity === 'llp' ? ' LLP' : '';
    return { schemaVersion:1, country:'NG', name:name, entityType:entity, industry:industry,
      inputValid:Boolean(name) && name.length <= 200,
      guidelineState:!name ? 'input_required' : name.length > 200 ? 'input_invalid' : items.length ? 'review_items' : 'prepared_for_official_search',
      availability:'not_checked', reservation:'not_confirmed', currentFees:'not_verified', currentFeeTotal:null,
      registrationDuty:'not_assessed', VATStatus:'not_assessed', foreignCapital:'not_verified', processingTime:'not_verified',
      reviewItems:items, alternatives:base && name.length <= 200 ? ['Solutions', 'Ventures', 'Services'].map(function (tail) { return base + ' ' + tail + suffix; }) : [],
      officialSearchUrl:'https://icrp.cac.gov.ng/public-search/', officialPortalUrl:'https://icrp.cac.gov.ng/',
      scope:'Local naming preflight only. CAC must determine name availability, reservation, approval and current charges.' };
  }
  function evidence(payload) {
    var allowed = { 'cac-public-search':'https://icrp.cac.gov.ng/public-search/', 'cac-portal':'https://icrp.cac.gov.ng/',
      'cama-2020':'https://icrp.cac.gov.ng/assets/docs/CAMA-NOTE%20FINAL-FULL-VERSION.pdf',
      'cac-fees':'https://news.cac.gov.ng/wp-content/uploads/2025/06/New-Schedule-of-Fees-29th-May-2025.pdf',
      'ntaa-2025':'https://www.nrs.gov.ng/uploads/NIGERIA_TAX_ADMINISTRATION_ACT_2025_8c945071a7.pdf' };
    function validDate(value) { if (value === null) return true; if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false; var d = new Date(value + 'T00:00:00Z'); return Number.isFinite(d.getTime()) && d.toISOString().slice(0,10) === value; }
    if (!payload || payload.schemaVersion !== 1 || payload.country !== 'NG' || payload.scope !== 'name_preparation_and_source_reference' || payload.availability !== 'not_checked' || payload.currentPayableTotal !== null || payload.currentFeeApplicability !== 'unverified' || !Array.isArray(payload.sources) || payload.sources.length !== Object.keys(allowed).length) return null;
    var seen = Object.create(null), sources = [];
    for (var i = 0; i < payload.sources.length; i += 1) { var source = payload.sources[i];
      if (!source || !allowed[source.id] || source.url !== allowed[source.id] || seen[source.id] || !validDate(source.publicationDate) || !validDate(source.signatureDate) || !validDate(source.effectiveFrom) || (source.signatureDate && source.publicationDate && source.signatureDate > source.publicationDate)) return null;
      seen[source.id] = true; sources.push({id:source.id,title:clean(source.title),url:source.url,publicationDate:source.publicationDate,signatureDate:source.signatureDate,effectiveFrom:source.effectiveFrom});
    }
    return {country:'NG',observedAt:validDate(payload.observedAt) ? payload.observedAt : null,currentFeeApplicability:'unverified',currentPayableTotal:null,sources:sources};
  }
  function note(result) {
    return ['Nigeria CAC naming preflight', 'Proposed name: ' + result.name, 'Entity type: ' + result.entityType, 'Industry: ' + result.industry,
      'Official availability: not checked', 'Reservation: not confirmed', 'Current payable fee: not verified',
      'Registration duties and VAT status: not assessed', 'Current foreign-capital requirement and processing time: not verified',
      result.scope, 'Review items:', result.reviewItems.join('\n') || 'No local flag; official search is still required.',
      'Alternative drafts (not availability results):', result.alternatives.join('\n'),
      'Source references:', (result.sourceEvidence ? result.sourceEvidence.sources.map(function (s) { return s.title + ' | ' + s.url + ' | publication: ' + (s.publicationDate || 'not stated') + ' | signature: ' + (s.signatureDate || 'not stated') + ' | effective from: ' + (s.effectiveFrom || 'not established'); }).join('\n') : 'Source metadata unavailable; current amounts and official availability remain unverified.'),
      'Official search: ' + result.officialSearchUrl, 'Official reservation portal: ' + result.officialPortalUrl].join('\n');
  }
  return { evaluate:evaluate, note:note, evidence:evidence };
});
