/* AfroTools — Export Docs Engine /engines/export-docs-engine.js */
var ExportDocsEngine = (function() {
  'use strict';

  function getDocList(countryCode, productCategory, destination) {
    var result = { universal: [], countrySpecific: [], destinationSpecific: [], prohibited: [], tips: [], countryInfo: null };

    result.universal = EXPORT_DOCS.universal.map(function(d) {
      return Object.assign({}, d, { checked: false, source: 'universal' });
    });

    var countryData = EXPORT_DOCS.countries[countryCode];
    if (countryData) {
      result.countryInfo = { name: countryData.name, flag: countryData.flag, exportAuthority: countryData.exportAuthority, customsAuthority: countryData.customsAuthority, currency: countryData.currency };
      result.countrySpecific = countryData.requiredDocs.map(function(d) { return Object.assign({}, d, { checked: false, source: 'country' }); });
      result.prohibited = countryData.prohibitedExports || [];
      result.tips = countryData.tips || [];
    }

    var destData = EXPORT_DOCS.destinationRequirements[destination];
    if (destData) {
      result.destinationSpecific = destData.requirements.map(function(req, i) {
        return { id: 'dest_' + i, name: req, description: '', mandatory: 'if_applicable', checked: false, source: 'destination' };
      });
    }

    var allDocs = result.universal.concat(result.countrySpecific).concat(result.destinationSpecific);
    result.totalDocs = allDocs.length;
    result.mandatoryCount = allDocs.filter(function(d){ return d.mandatory === true; }).length;
    result.productCategory = productCategory ? EXPORT_DOCS.productCategories.find(function(c){ return c.id === productCategory; }) : null;
    return result;
  }

  function getAllCountries() {
    return Object.keys(EXPORT_DOCS.countries).map(function(code) {
      var c = EXPORT_DOCS.countries[code];
      return { code: code, name: c.name, flag: c.flag };
    });
  }

  function getDestinations() {
    return Object.keys(EXPORT_DOCS.destinationRequirements).map(function(key) {
      return { code: key, name: EXPORT_DOCS.destinationRequirements[key].name };
    });
  }

  function getProductCategories() { return EXPORT_DOCS.productCategories; }

  function getObservations(countryCode, productCategory, destination) {
    var obs = [];
    var countryData = EXPORT_DOCS.countries[countryCode];
    if (!countryData) return obs;

    if (destination === 'AFRICA_AFCFTA' || destination === 'EAC' || destination === 'ECOWAS' || destination === 'SADC' || destination === 'COMESA') {
      obs.push({ type: 'info', text: 'For intra-African trade, obtain an AfCFTA Certificate of Origin from ' + (countryData.exportAuthority || 'your national export authority') + ' to claim preferential tariff rates and avoid paying MFN duties.' });
    }
    if (destination === 'EU') {
      obs.push({ type: 'tip', text: 'Check if your country has an Economic Partnership Agreement (EPA) with the EU. If so, use EUR.1 or REX self-certification to access GSP+/ACP preferential duty rates and avoid standard EU tariffs.' });
    }
    if (destination === 'US') {
      obs.push({ type: 'tip', text: 'Check AGOA eligibility for your country and product — African Growth and Opportunity Act (AGOA) provides duty-free access to the US for 6,500+ product lines from eligible African countries.' });
    }
    if (productCategory === 'cocoa' && countryCode === 'CI') obs.push({ type: 'warn', text: 'All cocoa exports from Côte d\'Ivoire MUST be licensed through Conseil Café-Cacao. No export without their authorization.' });
    if (productCategory === 'cocoa' && countryCode === 'GH') obs.push({ type: 'warn', text: 'All Ghanaian cocoa exports require COCOBOD authorization. Ghana is the world\'s 2nd largest cocoa producer — COCOBOD controls all exports.' });
    if (productCategory === 'coffee_tea' && countryCode === 'ET') obs.push({ type: 'warn', text: 'Ethiopian coffee MUST be graded and certified through the Ethiopia Commodity Exchange (ECX) before export. This is mandatory, not optional.' });
    obs.push({ type: 'tip', text: 'Start document preparation 3–4 weeks before your shipment date. Phytosanitary and health certificates have limited validity windows — time them carefully.' });
    return obs;
  }

  return { getDocList: getDocList, getAllCountries: getAllCountries, getDestinations: getDestinations, getProductCategories: getProductCategories, getObservations: getObservations };
})();

if (typeof module !== 'undefined') module.exports = { ExportDocsEngine: ExportDocsEngine };
