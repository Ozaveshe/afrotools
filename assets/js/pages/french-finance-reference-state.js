(function () {
  'use strict';
  var ROUTES = {
    '/fr/crypto/prices': ['État de référence des prix crypto', 'Actif à contrôler', [
      ['btc', 'Bitcoin (BTC)', 'BTC sélectionné — prix live indisponible dans ce reçu local. Vérifiez une source de marché datée avant toute décision.'],
      ['eth', 'Ethereum (ETH)', 'ETH sélectionné — prix live indisponible dans ce reçu local. Vérifiez une source de marché datée avant toute décision.']]],
    '/fr/crypto/stablecoins': ['Fiche de référence stablecoin', 'Stablecoin à examiner', [
      ['usdt', 'USDT', 'USDT — catégorie : stablecoin indexé sur le dollar ; statut live : indisponible. Réserves et liquidité restent à vérifier.'],
      ['usdc', 'USDC', 'USDC — catégorie : stablecoin indexé sur le dollar ; statut live : indisponible. Réserves et liquidité restent à vérifier.']]],
    '/fr/tools/afrotaux': ['Référence de taux à vérifier', 'Famille de taux', [
      ['policy', 'Taux directeur', 'Taux directeur — valeur indisponible sans ligne officielle datée. Consultez la banque centrale sélectionnée.'],
      ['lending', 'Taux de prêt', 'Taux de prêt — valeur indicative indisponible. Demandez une offre écrite datée au prêteur.']]],
    '/fr/tools/guide-de-la-cnps-en-cote-d-ivoire': ['Parcours de référence CNPS', 'Étape à préparer', [
      ['register', 'Immatriculation', 'Immatriculation — étape 1 : vérifier les pièces et le canal CNPS en vigueur avant dépôt.'],
      ['declare', 'Déclaration', 'Déclaration — étape 2 : vérifier période, assiette et échéance sur le portail CNPS avant envoi.']]],
    '/fr/tools/guide-d-etims-de-la-kra': ['Parcours de référence eTIMS', 'Besoin eTIMS', [
      ['onboard', 'Préparer l’inscription', 'Inscription eTIMS — étape 1 : vérifier le profil contribuable et la solution autorisée auprès de la KRA.'],
      ['invoice', 'Préparer une facture', 'Facture eTIMS — étape 2 : vérifier les champs fiscaux et la transmission avant émission.']]],
    '/fr/tools/reference-taux-interet': ['Filtre de référence des taux', 'Référence recherchée', [
      ['central', 'Banque centrale', 'Banque centrale — valeur indisponible tant que source, date et unité ne franchissent pas le contrôle de fraîcheur.'],
      ['loan', 'Offre de crédit', 'Offre de crédit — taux indisponible sans offre écrite, date, frais et méthode de calcul vérifiés.']]],
    '/fr/tools/guide-d-itax-de-la-kra': ['Parcours de référence iTax', 'Tâche iTax', [
      ['return', 'Préparer une déclaration', 'Déclaration iTax — étape 1 : vérifier période, obligations et justificatifs avant soumission.'],
      ['payment', 'Préparer un paiement', 'Paiement iTax — étape 2 : vérifier référence, montant et échéance sur le portail KRA.']]],
    '/fr/tools/guide-de-sars-efiling': ['Parcours de référence SARS eFiling', 'Tâche eFiling', [
      ['return', 'Préparer une déclaration', 'Déclaration SARS eFiling — étape 1 : vérifier année fiscale, préremplissage et justificatifs avant validation.'],
      ['notice', 'Contrôler un avis', 'Avis SARS — étape 2 : vérifier date, statut et délai de réponse dans le compte eFiling.']]]
  };
  function route() { return location.pathname.replace(/\/index\.html$/i, '').replace(/\/+$/, '') || '/'; }
  function init() {
    var config = ROUTES[route()];
    var main = document.querySelector('main');
    if (!config || !main || main.querySelector('[data-fr-reference-state]')) return;
    var section = document.createElement('section');
    section.className = 'fr-reference-state';
    section.dataset.frReferenceState = 'true';
    section.innerHTML = '<style>.fr-reference-state{max-width:900px;margin:22px auto;padding:18px;border:1px solid #cbd5e1;border-radius:12px;background:var(--color-bg-card,#fff);color:var(--color-text,#0f172a)}.fr-reference-state h2{margin:0 0 7px}.fr-reference-state p{line-height:1.55;color:var(--color-text-muted,#475569)}.fr-reference-state label{display:grid;gap:7px;font-weight:800;max-width:520px}.fr-reference-state select{min-height:44px;padding:9px 11px;border:1px solid #94a3b8;border-radius:8px;background:var(--color-bg-card,#fff);color:inherit;font:inherit}.fr-reference-state output{display:block;margin-top:14px;padding:13px;border-left:4px solid #0062cc;background:var(--color-bg-subtle,#f8fafc);line-height:1.6;font-weight:700}</style>'
      + '<h2>' + config[0] + '</h2><p>Ce filtre change uniquement la fiche locale affichée. Il ne fabrique ni taux, ni prix, ni statut officiel.</p>'
      + '<label>' + config[1] + '<select data-reference-select>'
      + config[2].map(function (option) { return '<option value="' + option[0] + '">' + option[1] + '</option>'; }).join('')
      + '</select></label><output data-results data-reference-output aria-live="polite"></output>'
      + '<p>Traitement local, sans compte ni envoi des choix.</p>';
    main.insertBefore(section, main.firstChild);
    var select = section.querySelector('[data-reference-select]');
    var output = section.querySelector('[data-reference-output]');
    function render() {
      var selected = config[2].filter(function (option) { return option[0] === select.value; })[0] || config[2][0];
      output.textContent = selected[2];
    }
    select.addEventListener('change', render);
    render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
}());
