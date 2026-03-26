/* AfroTools — Certificate of Origin Engine /engines/coo-engine.js */
var CooEngine = (function() {
  'use strict';

  function getTemplate(templateId) {
    return COO_TEMPLATES.templates[templateId] || null;
  }

  function getAllTemplates() {
    return Object.keys(COO_TEMPLATES.templates).map(function(key) {
      var t = COO_TEMPLATES.templates[key];
      return { id: key, name: t.name, description: t.description, color: t.color, preferential: t.preferential, applicableFor: t.applicableFor };
    });
  }

  function getFieldLabel(fieldId) {
    return COO_TEMPLATES.fieldLabels[fieldId] || fieldId.replace(/_/g, ' ');
  }

  function getApplicableTemplates(exportCountry, importCountry) {
    var applicable = ['standard']; // Always applicable
    var tpls = COO_TEMPLATES.templates;

    if (tpls.afcfta) applicable.push('afcfta'); // Always show AfCFTA option

    if (exportCountry && importCountry) {
      if (tpls.ecowas && tpls.ecowas.memberStates) {
        if (tpls.ecowas.memberStates.indexOf(exportCountry) !== -1 && tpls.ecowas.memberStates.indexOf(importCountry) !== -1) applicable.push('ecowas');
      }
      if (tpls.eac && tpls.eac.memberStates) {
        if (tpls.eac.memberStates.indexOf(exportCountry) !== -1 && tpls.eac.memberStates.indexOf(importCountry) !== -1) applicable.push('eac');
      }
      if (tpls.sadc && tpls.sadc.memberStates) {
        if (tpls.sadc.memberStates.indexOf(exportCountry) !== -1 && tpls.sadc.memberStates.indexOf(importCountry) !== -1) applicable.push('sadc');
      }
      if (tpls.comesa && tpls.comesa.memberStates) {
        if (tpls.comesa.memberStates.indexOf(exportCountry) !== -1 && tpls.comesa.memberStates.indexOf(importCountry) !== -1) applicable.push('comesa');
      }
    }

    return applicable.map(function(id) { return getTemplate(id); }).filter(Boolean);
  }

  function checkOriginCriteria(params) {
    // params: { exWorksPrice, nonOriginatingMaterialsCost, hasWhollyObtained, hasCTH, processType }
    var results = [];
    var t = COO_TEMPLATES.templates.afcfta;
    if (!t) return results;

    if (params.hasWhollyObtained) {
      results.push({ criteria: 'WO', qualifies: true, label: t.originCriteria.WO.name, desc: t.originCriteria.WO.description });
    }
    if (params.hasCTH) {
      results.push({ criteria: 'CTH', qualifies: true, label: t.originCriteria.CTH.name, desc: t.originCriteria.CTH.description });
    }

    // VA check: 40% rule
    if (params.exWorksPrice && params.nonOriginatingMaterialsCost) {
      var va = ((params.exWorksPrice - params.nonOriginatingMaterialsCost) / params.exWorksPrice) * 100;
      results.push({
        criteria: 'VA', qualifies: va >= 40,
        label: t.originCriteria.VA.name,
        desc: 'Calculated value added: ' + va.toFixed(1) + '% (minimum 40% required)',
        percentage: va.toFixed(1)
      });
    }

    if (params.processType === 'SP') {
      results.push({ criteria: 'SP', qualifies: true, label: t.originCriteria.SP.name, desc: t.originCriteria.SP.description });
    }

    return results;
  }

  function generateFormData(templateId, formValues) {
    var template = getTemplate(templateId);
    if (!template) return null;

    var result = { templateId: templateId, templateName: template.name, fields: {}, generatedAt: new Date().toLocaleDateString('en-GB') };
    template.fields.forEach(function(fieldId) {
      result.fields[fieldId] = { label: getFieldLabel(fieldId), value: formValues[fieldId] || '', required: true };
    });

    // Auto-populate issuingAuthority based on country
    if (templateId === 'afcfta' && formValues.exporter_country) {
      var auth = template.issuingAuthorities[formValues.exporter_country];
      result.issuingAuthority = auth || template.issuingAuthority;
    } else {
      result.issuingAuthority = template.issuingAuthority;
    }

    return result;
  }

  function getObservations(templateId, exportCountry, productDesc) {
    var obs = [];
    var tpl = COO_TEMPLATES.templates[templateId];
    if (!tpl) return obs;

    if (templateId === 'afcfta') {
      obs.push({ type: 'info', text: 'AfCFTA COO enables preferential tariff rates across 54 African countries. Category A products get up to 90% tariff reduction by 2030.' });
      if (exportCountry) {
        var auth = tpl.issuingAuthorities[exportCountry];
        if (auth) obs.push({ type: 'tip', text: 'In ' + exportCountry + ', AfCFTA Certificates of Origin are issued by: ' + auth });
      }
    }
    if (templateId === 'ecowas') {
      obs.push({ type: 'tip', text: 'ECOWAS COO requires ETLS (Trade Liberalisation Scheme) approval for the manufacturer. Apply for ETLS approval before your first shipment.' });
    }
    obs.push({ type: 'tip', text: 'The COO must be presented to destination customs BEFORE import duties are calculated to claim preferential rates. A post-arrival application may be refused.' });
    return obs;
  }

  return { getTemplate: getTemplate, getAllTemplates: getAllTemplates, getApplicableTemplates: getApplicableTemplates, checkOriginCriteria: checkOriginCriteria, generateFormData: generateFormData, getObservations: getObservations, getFieldLabel: getFieldLabel };
})();

if (typeof module !== 'undefined') module.exports = { CooEngine: CooEngine };
