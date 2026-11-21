'use strict';
const fs = require('node:fs');
const countries = require('../../data/registry/countries.json');
const budgets = require('../../data/immigration/fr-permit-country-budgets.json');
function render(page) {
  const slug = page.enSlug.split('/')[1];
  const record = budgets[slug];
  if (!record) return null;
  const base = fs.readFileSync('tools/' + page.enSlug + '/index.html', 'utf8');
  const country = countries.find(c => c.routeSlug === slug) || countries.find(c => c.isoCode === (base.match(/var CC\s*=\s*['"]([A-Z]{2})/) || [])[1]);
  const currency = country.currency;
  const title = 'Budget du permis de travail — ' + country.displayNames.fr;
  const url = 'https://afrotools.com/fr/tools/' + page.frSlug + '/';
  const alternates = base.match(/<link rel="alternate" hreflang="[^"]+" href="https:\/\/afrotools\.com\/[^"]+">/g) || [];
  const field = (key, label, attrs) => '<label class="fr-hr-field">' + label + '<input type="number" name="' + key + '" min="' + (key === 'mainApplicants' ? 1 : 0) + '" ' + attrs + '></label>';
  const money = (key, label) => field(key,label + ' (' + currency + ')','step="any"');
  const options = record.fees.map(([label,iso,fee]) => '<option data-iso="' + iso + '" data-fee="' + fee + '">' + label + ' · ' + fee.toLocaleString('fr') + ' ' + iso + '</option>').join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} | AfroTools</title><meta name="description" content="Calculez les frais de permis, de dossier et de déplacement pour votre demande en ${currency}.">
<meta name="afrotools-content-id" content="fr-tool-gap:${page.frSlug}"><meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js">
<link rel="canonical" href="${url}">${alternates.join('\n')}
<link rel="stylesheet" href="/assets/css/design-system.min.css"><link rel="stylesheet" href="/assets/css/fr-hr-payroll-parity.css">
<style>.fr-hr-shell{overflow-wrap:anywhere}.fr-hr-shell select,.fr-hr-shell input{width:100%;min-width:0}.fr-hr-field{min-width:0}.fr-hr-shell [hidden]{display:none!important}</style>
<script src="/assets/js/analytics-bootstrap.js" async></script></head><body><afro-navbar></afro-navbar>
<main class="fr-hr-shell"><nav aria-label="Fil d’Ariane"><a href="/fr/">Accueil</a> › <a href="/fr/tools/cout-permis-travail/">Budget du permis de travail</a></nav><h1>${title}</h1>
<section class="fr-hr-card"><h2>Quel tarif utiliser ?</h2><p>${record.scope}</p><p><a href="${record.source}">${record.authority}</a> · Source consultée le 21 novembre 2026.</p></section>
<form id="permit-budget" class="fr-hr-card" data-currency="${currency}">
<h2>Demandeurs et frais de permis</h2><div class="fr-hr-grid">
<label class="fr-hr-field">Tarif individuel<select name="preset"><option value="">Saisir un montant confirmé</option>${options}</select></label>
${field('mainFee','Frais par demandeur','step="any" required')}
<label class="fr-hr-field">Devise des frais par demandeur<input name="feeCurrency" value="${currency}" required pattern="[A-Za-z]{3}" maxlength="3"></label>
<label class="fr-hr-field" hidden id="exchange"><span></span><input type="number" name="rate" step="any" min="0.000000001"></label>
${field('mainApplicants','Nombre de demandeurs','step="1" value="1" required max="100"')}
${field('dependants','Personnes à charge','step="1" value="0" required max="100"')}
${money('dependantFee','Frais par personne à charge')}</div>
<h2>Autres frais pour le groupe</h2><p>Saisissez vos devis dans la devise du budget. Un poste facultatif laissé vide est exclu du total. Vérifiez les frais de séjour, de visa et de dossier applicables à votre situation.</p><div class="fr-hr-grid">
${money('supportingCosts','Traductions, copies et certificats')}${money('professionalCosts','Accompagnement professionnel')}${money('travelCosts','Déplacements')}${money('otherCosts','Autres frais')}${field('contingencyRate','Marge pour imprévus (%)','step="any" max="100"')}</div>
<button type="submit">Calculer mon budget</button></form><section class="fr-hr-card" id="result" aria-live="polite" hidden><h2>Budget estimé en ${currency}</h2><dl>
${Object.entries({mainTotal:'Permis des demandeurs',dependantTotal:'Personnes à charge',otherTotal:'Autres frais du groupe',contingency:'Marge pour imprévus',total:'Total à prévoir'}).map(([key,label])=>'<dt>'+label+'</dt><dd data-value="'+key+'"></dd>').join('')}</dl></section></main>
<script src="/assets/js/engines/government-parity-engine.js"></script><script src="/assets/js/pages/fr-permit-country.js"></script><afro-footer></afro-footer><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script></body></html>\n`;
}
module.exports = {render};
