(function () {
  'use strict';
  var root = document.querySelector('[data-fr-climate-tool]');
  var api = window.AfroClimateTools;
  if (!root || !api) return;
  var tool = root.getAttribute('data-fr-climate-tool');
  var form = root.querySelector('form');
  var status = root.querySelector('[data-status]');
  var results = root.querySelector('[data-results]');
  var current = null;
  var currentInputs = null;
  var config = {
    'drought-risk': { result: 'Score de risque de sécheresse', metrics: ['Perte attendue', 'Déficit hydrique indicatif', 'Surface exposée', 'Signal assurance'], actions: ['Comparez l’anomalie saisie à une station ou un service météo local.', 'Préparez une culture de secours et un seuil de déclenchement d’irrigation.', 'Conservez les relevés de pluie, rendement et pertes pour la prochaine saison.'] },
    'water-scarcity': { result: 'Score de pénurie d’eau', metrics: ['Demande quotidienne', 'Autonomie du stockage', 'Stockage recommandé', 'Réduction par réutilisation'], actions: ['Mesurez la consommation réelle pendant deux semaines.', 'Dimensionnez le stockage sur la plus longue interruption observée.', 'Confirmez les usages de réutilisation autorisés et sûrs localement.'] },
    'rainfall-tracker': { result: 'État pluviométrique', metrics: ['Pluie reçue', 'Pluie attendue', 'Besoin d’irrigation indicatif', 'Besoin saisonnier de la culture'], actions: ['Utilisez un pluviomètre ou une station locale avant de modifier les dates de semis.', 'Priorisez les parcelles au stade le plus sensible.', 'Archivez pluie et rendement chaque mois pour améliorer vos hypothèses.'] },
    'carbon-credit': { result: 'Revenu net indicatif des crédits', metrics: ['Crédits annuels modélisés', 'Période de crédit', 'Revenu brut', 'Réserve tampon'], actions: ['Prouvez l’additionnalité avant de payer une validation.', 'Documentez limites, consentement, référence et suivi MRV.', 'Testez un prix divisé par deux et des coûts de validation doublés.'] },
    'flood-risk': { result: 'Score de risque d’inondation', metrics: ['Perte annuelle attendue', 'Budget assurance indicatif', 'Probabilité sur cinq ans', 'Vulnérabilité du bâtiment'], actions: ['Vérifiez cartes locales, traces de crue et canaux de drainage.', 'Protégez ouvertures, prises, documents et stocks.', 'Définissez un seuil pluie ou niveau d’eau pour évacuer.'] },
    'air-quality': { result: 'Indice AQI estimé', metrics: ['PM2.5 estimées', 'Score d’exposition personnelle', 'Durée extérieure indicative', 'Coût sanitaire annuel indicatif'], actions: ['Confirmez avec un moniteur AQI ou PM2.5 actuel avant une activité extérieure.', 'Réduisez d’abord la principale source de fumée ou de trafic.', 'Mesurez matin, route et cuisson pendant sept jours si un capteur est disponible.'] },
    'deforestation': { result: 'Émissions de CO2 indicatives', metrics: ['Puits futur perdu', 'Budget de restauration', 'Surface concernée', 'Densité de biomasse'], actions: ['Confirmez statut foncier, règles forestières, permis et consentement.', 'Cartographiez zones riveraines, pentes, zones humides et forêts anciennes.', 'Intégrez le coût de restauration avant la décision de conversion.'] },
    'waste-management': { result: 'Score de circularité', metrics: ['Déchets mensuels', 'Coût de collecte', 'Valeur récupérable', 'Présence de déchets dangereux'], actions: ['Séparez organiques, recyclables secs et résiduels à la source.', 'Pesez ou estimez les volumes pendant sept jours.', 'Demandez bordereaux de poids et preuves de collecte.'] },
    'recycling-revenue': { result: 'Revenu net du recyclage', metrics: ['Masse de matières', 'CO2 évité indicatif', 'Score qualité', 'Perte par contamination'], actions: ['Gardez liquides et aliments hors des recyclables secs.', 'Regroupez les enlèvements pour réduire le coût par kg.', 'Notez acheteur, poids, prix et motifs de refus.'] },
    'charcoal-vs-clean': { result: 'Économie sur la période', metrics: ['Coût actuel du charbon', 'Coût de l’option propre', 'Réduction CO2 indicative', 'Score de risque fumée'], actions: ['Vérifiez prix et disponibilité des recharges près du domicile.', 'Améliorez immédiatement l’aération et éloignez les enfants de la fumée.', 'Comparez un financement de l’équipement au coût hebdomadaire du charbon.'] },
    'ewaste-value': { result: 'Valeur de reprise estimée', metrics: ['Masse totale', 'CO2 évité indicatif', 'Score de danger', 'Priorité d’effacement'], actions: ['Retirez comptes, SIM, cartes mémoire et accessoires personnels.', 'Ne brûlez ni câbles ni batteries et évitez le démontage sans protection.', 'Demandez reçu, poids et destination au collecteur.'] },
    'tree-planting-roi': { result: 'Valeur nette sur 25 ans', metrics: ['Arbres survivants', 'Revenu carbone', 'Valeur produits ou bois', 'Retour sur investissement'], actions: ['Budgétez eau, clôture, incendie et remplacement des plants.', 'Séparez le rendement agricole du revenu carbone non garanti.', 'Confirmez tenure foncière, essence adaptée et voie de vérification.'] },
    'sustainability-scorecard': { result: 'Note de durabilité', metrics: ['Énergie', 'Déchets', 'Eau', 'Préparation au reporting'], actions: ['Créez un dossier de preuves sur 90 jours.', 'Choisissez une cible mesurable et un responsable.', 'Faites correspondre les preuves à la réglementation ou norme réellement applicable.'] }
  }[tool];
  if (!config) return;

  function inputs() {
    var value = {};
    root.querySelectorAll('[data-cl-field]').forEach(function (field) {
      value[field.getAttribute('data-cl-field')] = field.type === 'number' ? Number(field.value) : field.value;
    });
    return value;
  }
  function translateValue(value) {
    var map = {
      Extreme: 'Extrême', High: 'Élevé', Medium: 'Moyen', Lower: 'Faible',
      Good: 'Bon', Moderate: 'Modéré', 'Unhealthy for sensitive groups': 'Mauvais pour les personnes sensibles',
      Unhealthy: 'Mauvais', 'Very unhealthy': 'Très mauvais', Hazardous: 'Dangereux',
      'Severe deficit': 'Déficit sévère', 'Below normal': 'Sous la normale',
      'Near normal': 'Près de la normale', 'Wet spell': 'Épisode humide',
      'Commercially plausible': 'Plausibilité commerciale à vérifier',
      'Needs aggregation': 'Agrégation nécessaire', 'Positive ROI': 'Rendement positif modélisé',
      'Needs redesign': 'Scénario à revoir', 'Worth collecting': 'Collecte potentiellement rentable',
      'Consolidate loads': 'Regrouper les volumes', 'Switch pays back': 'Basculement amorti dans le modèle',
      'Needs subsidy or finance': 'Financement ou subvention nécessaire',
      'Operationally useful': 'Base opérationnelle utile', 'Needs sorting': 'Tri à améliorer',
      'Investor-ready baseline': 'Base à documenter', Improving: 'En amélioration',
      'Needs a 90-day plan': 'Plan de 90 jours nécessaire'
    };
    return map[value] || String(value || '').replace(' impact', ' — impact').replace(' handling risk', ' — risque de manutention');
  }
  function setStatus(message, ok) {
    status.textContent = message;
    status.className = 'fr-climate-status' + (ok ? ' ok' : '');
  }
  function validate() {
    var fields = root.querySelectorAll('[data-cl-field]');
    for (var index = 0; index < fields.length; index += 1) {
      var field = fields[index];
      if (!field.checkValidity()) {
        field.focus();
        return false;
      }
    }
    return true;
  }
  function render(output) {
    root.querySelector('[data-result-label]').textContent = config.result;
    root.querySelector('[data-result-value]').textContent = translateValue(output.value);
    root.querySelector('[data-result-level]').textContent = translateValue(output.level);
    root.querySelector('[data-result-note]').textContent = 'Résultat du modèle partagé AfroTools à partir de vos hypothèses. Ce n’est ni une donnée en direct ni une décision officielle.';
    root.querySelector('[data-metrics]').innerHTML = (output.metrics || []).map(function (metric, index) {
      return '<div class="fr-climate-metric"><span>' + config.metrics[index] + '</span><strong>' +
        metric.value + (metric.unit ? ' ' + metric.unit : '') + '</strong></div>';
    }).join('');
    root.querySelector('[data-plan]').innerHTML = config.actions.map(function (action) { return '<li>' + action + '</li>'; }).join('');
    results.hidden = false;
    setStatus('Scénario calculé localement.', true);
  }
  function calculate(event) {
    event.preventDefault();
    if (!validate()) return setStatus('Vérifiez les valeurs et limites indiquées.', false);
    try {
      currentInputs = inputs();
      current = api.calculate(tool, currentInputs);
      render(current);
    } catch (error) {
      setStatus('Le scénario ne peut pas être calculé avec ces valeurs.', false);
    }
  }
  function summary() {
    if (!current) return '';
    return ['AFROTOOLS - RAPPORT CLIMAT', root.querySelector('h1').textContent,
      config.result + ' : ' + translateValue(current.value),
      'Niveau : ' + translateValue(current.level), '',
      'Indicateurs :'].concat((current.metrics || []).map(function (metric, index) {
      return '- ' + config.metrics[index] + ' : ' + metric.value + (metric.unit ? ' ' + metric.unit : '');
    }), ['', 'Actions :'].concat(config.actions.map(function (action, index) {
      return (index + 1) + '. ' + action;
    }), ['', 'Estimation de planification. Modèle révisé le 28 avril 2026 ; préréglages nationaux à confiance faible et non actualisés en direct.'])).join('\n');
  }
  function copy() {
    var text = summary();
    if (!text) return setStatus('Calculez d’abord un scénario.', false);
    var fallback = function () {
      var area = document.createElement('textarea');
      area.value = text; area.style.position = 'fixed'; area.style.opacity = '0';
      document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove();
      setStatus('Résumé copié.', true);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(function () { setStatus('Résumé copié.', true); }, fallback);
    else fallback();
  }
  function save() {
    if (!current) return setStatus('Calculez d’abord un scénario.', false);
    try {
      localStorage.setItem('afrotools-fr-climate-' + tool, JSON.stringify({
        savedAt: Date.now(), tool: tool, inputs: currentInputs,
        result: { value: current.value, level: current.level, metrics: current.metrics }
      }));
      setStatus('Scénario enregistré uniquement sur cet appareil.', true);
    } catch (error) {
      setStatus('Enregistrement local indisponible.', false);
    }
  }
  function pdf() {
    if (!current) return setStatus('Calculez d’abord un scénario.', false);
    var load = window.jspdf && window.jspdf.jsPDF ? Promise.resolve() : new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    load.then(function () {
      var PDF = window.jspdf.jsPDF;
      var doc = new PDF({ unit: 'mm', format: 'a4' });
      var lines = doc.splitTextToSize(summary(), 174);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(lines, 18, 18);
      doc.save('afrotools-fr-' + tool + '.pdf');
      setStatus('Rapport PDF généré localement.', true);
    }).catch(function () { setStatus('Le moteur PDF local est indisponible.', false); });
  }
  form.addEventListener('submit', calculate);
  root.querySelector('[data-copy]').addEventListener('click', copy);
  root.querySelector('[data-save]').addEventListener('click', save);
  root.querySelector('[data-pdf]').addEventListener('click', pdf);
}());
