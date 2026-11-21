'use strict';
function input(name, label, attrs = 'min="0" step="0.01"') {
  return '<label class="fr-hr-field">' + label + '<input type="number" name="' + name + '" ' + attrs + '></label>';
}
function render(id, slug, english) {
  const cost = id === 'book-publishing-cost';
  const title = cost ? 'Budget de publication d’un livre' : 'Revenus d’autoédition par exemplaire';
  const description = cost ? 'Additionnez vos devis de révision, de fabrication et d’impression, puis estimez les ventes nécessaires pour les couvrir.' : 'Comparez les revenus d’un livre numérique, broché ou relié selon le prix, le tirage et les ventes mensuelles estimées.';
  const url = 'https://afrotools.com/fr/tools/' + slug + '/';
  const languages = english.match(/<link rel="alternate" hreflang="[^"]+" href="[^"]+">/g) || [];
  const related = cost ? ['calculateur-de-droits-d-autoedition','Comparer les revenus d’autoédition'] : ['cout-publication-livre','Calculer le budget de publication'];
  const common = input('price','Prix de vente par exemplaire (USD)','min="0.01" step="0.01" required') + input('monthly','Ventes mensuelles estimées (exemplaires)','min="1" step="1" required');
  const options = cost ? [['devEdit','Révision du manuscrit'],['copyEdit','Correction éditoriale'],['proofread','Relecture finale'],['coverDesign','Création de la couverture'],['layout','Mise en page'],['isbn','ISBN et enregistrement']].map(([key,label])=>input(key,label+' (USD)')).join('') + input('printQty','Tirage (exemplaires)','min="0" step="1"') + input('printCost','Impression par exemplaire (USD)') :
    '<label class="fr-hr-field">Format<select name="format"><option value="ebook">Numérique</option><option value="paperback">Broché</option><option value="hardcover">Relié</option></select></label>' + input('pages','Nombre de pages du livre imprimé','min="1" step="1"');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | AfroTools</title>
<meta name="description" content="${description}"><meta name="afrotools-content-id" content="fr-tool-gap:${slug}"><meta name="afrotools-source-owner" content="scripts/build-fr-creative-simple-native.js"><link rel="canonical" href="${url}">${languages.join('\n')}
<link rel="stylesheet" href="/assets/css/design-system.min.css"><link rel="stylesheet" href="/assets/css/fr-hr-payroll-parity.css"><style>.fr-hr-shell [hidden]{display:none!important}.fr-hr-shell{overflow-wrap:anywhere}.fr-hr-field{min-width:0}.fr-hr-shell dd{margin:0 0 .8rem;font-weight:bold}</style>
<script src="/assets/js/analytics-bootstrap.js" async></script></head><body><afro-navbar></afro-navbar><main class="fr-hr-shell"><nav><a href="/fr/">Accueil</a> › <a href="/fr/tools/">Outils</a></nav><h1>${title}</h1><p>${description}</p>
<form class="fr-hr-card" id="tool-mount" data-fr-creative-native="${id}"><h2>Hypothèses de calcul</h2><div class="fr-hr-grid">${common}
<label class="fr-hr-field">Devise de comparaison<select name="country"><option value="NG">Naira nigérian (NGN)</option><option value="KE">Shilling kényan (KES)</option><option value="ZA">Rand sud-africain (ZAR)</option><option value="GH">Cedi ghanéen (GHS)</option>${cost?'<option value="EG">Livre égyptienne (EGP)</option>':''}</select></label>${options}</div>
<p>${cost?'Les devis laissés vides comptent pour zéro. Le seuil de rentabilité utilise les droits numériques simulés par exemplaire.':'Les scénarios utilisent des taux et des coûts d’impression fixes pour comparer des hypothèses de vente.'} La conversion utilise le taux indicatif du modèle. Vérifiez vos frais et votre contrat avant de fixer un prix. <a href="https://kdp.amazon.com/fr_FR/help/topic/G201723080">Ressources tarifaires de KDP</a></p>
<button type="submit">${cost?'Calculer mon budget':'Comparer mes revenus'}</button></form>
<section class="fr-hr-card" id="results" aria-live="polite" hidden><h2>Votre estimation</h2><dl></dl><h3>${cost?'Projection sur trois ans':'Comparaison des hypothèses'}</h3><ul></ul><button type="button" id="copy">Copier le résultat</button> <span role="status" id="copied"></span></section>
<p><a href="/fr/tools/${related[0]}/">${related[1]}</a></p></main><afro-footer></afro-footer>
<script src="/engines/${id}-engine.js"></script><script src="/assets/js/pages/creative/fr-publishing-planner.js"></script><script src="/assets/js/components/navbar.js" defer></script><script src="/assets/js/components/footer.js" defer></script></body></html>\n`;
}
module.exports = {render};
