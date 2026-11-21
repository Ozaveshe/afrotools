'use strict';
const fs=require('node:fs');
const registry=require('../../data/registry/countries.json');
const sections={
 'afropayroll-os':['Préparer une démarche de paie','Choisissez un parcours et un pays. Cochez les étapes effectuées pour reprendre votre progression sur cet appareil.'],
 'compliance-calendar':['Calendrier des déclarations employeur','Préparez le rappel PAYE au Kenya ou EMP201 en Afrique du Sud. Pour un autre pays, enregistrez une échéance que vous avez confirmée.'],
 'regulatory-alerts':['Suivre une évolution réglementaire','Filtrez les avis officiels référencés ci-dessous et marquez ceux que vous avez lus. Cette sélection datée porte sur le Kenya et l’Afrique du Sud.']
};
function render(page) {
 const id=page.enSlug, [title,desc]=sections[id],slug=page.frSlug;
 const en=fs.readFileSync('tools/'+id+'/index.html','utf8');
 const countries=registry.slice().sort((a,b)=>a.displayNames.fr.localeCompare(b.displayNames.fr,'fr')).map(c=>'<option value="'+c.isoCode+'">'+c.displayNames.fr+'</option>').join('');
 const select=(key,label,opts)=>'<label class="fr-hr-field">'+label+'<select name="'+key+'">'+opts+'</select></label>';
 const field=(key,label,type)=>'<label class="fr-hr-field">'+label+'<input required type="'+type+'" name="'+key+'"></label>';
 const country=select('country','Pays',id==='regulatory-alerts'?'<option value="ALL">Tous les pays couverts</option><option value="KE">Kenya</option><option value="ZA">Afrique du Sud</option>':countries);
 const journey=select('journey','Parcours','<option value="new-hire">Première embauche</option><option value="new-job">Évaluer une offre</option><option value="expansion">Implantation dans un nouveau pays</option><option value="offboarding">Départ d’un salarié</option>');
 const types=select('type','Thème','<option value="ALL">Tous les thèmes</option><option value="tax">Impôt sur les salaires</option><option value="pension">Retraite</option>');
 const controls=id==='afropayroll-os'?country+journey:(id==='regulatory-alerts'?country+types:country+field('month','Mois de paie','month'));
 return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | AfroTools</title><meta name="description" content="${desc}"><link rel="canonical" href="https://afrotools.com/fr/tools/${slug}/">${(en.match(/<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g)||[]).join('\n')}<meta name="afrotools-content-id" content="fr-tool-gap:${slug}"><meta name="afrotools-source-owner" content="scripts/generate-fr-tool-gap-pages.js"><link rel="stylesheet" href="/assets/css/design-system.min.css"><link rel="stylesheet" href="/assets/css/fr-hr-payroll-parity.css"><style>.fr-hr-shell{overflow-wrap:anywhere}.fr-hr-field{min-width:0}.fr-hr-shell [hidden]{display:none!important}#items li{margin:.65rem 0}#items label{display:inline-flex;align-items:center;gap:.6rem}</style><script src="/assets/js/analytics-bootstrap.js" async></script></head><body><afro-navbar></afro-navbar><main class="fr-hr-shell" data-hr-workflow="${id}"><nav><a href="/fr/">Accueil</a> › <a href="/fr/hr-payroll/">RH et paie</a></nav><h1>${title}</h1><p>${desc}</p><form id="criteria" class="fr-hr-card"><div class="fr-hr-grid">${controls}</div></form>
<section class="fr-hr-card" aria-live="polite"><h2 id="heading"></h2><p id="summary"></p><ul id="items"></ul>${id==='compliance-calendar'?'<form id="reminder">'+field('title','Intitulé du rappel','text')+field('date','Date confirmée à inscrire dans votre agenda','date')+'<button type="submit">Télécharger le rappel (.ics)</button></form>':''}</section></main><afro-footer></afro-footer><script src="/engines/${id}-engine.js"></script><script src="/assets/js/pages/fr-employment-workflows.js"></script><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script></body></html>\n`;
}
module.exports={render};
