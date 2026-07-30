(function initFrenchReligiousCulturalPage() {
  'use strict';

  const engine = window.AfroTools && window.AfroTools.religiousCulturalParity;
  const configNode = document.getElementById('fr-rc-config');
  const form = document.getElementById('fr-rc-form');
  const output = document.getElementById('fr-rc-output');
  const status = document.getElementById('fr-rc-status');
  const calculateButton = document.getElementById('fr-rc-calculate');
  const resetButton = document.getElementById('fr-rc-reset');
  const copyButton = document.getElementById('fr-rc-copy');
  const downloadButton = document.getElementById('fr-rc-download');
  const printButton = document.getElementById('fr-rc-print');
  const useSavedPlanButton = document.getElementById('fr-rc-use-saved-plan');
  const lobolaPlanKey = 'afrotools_lobola_plan_v1';

  if (!engine || !configNode || !form || !output || !status) return;

  let config;
  let lastResult = null;
  try {
    config = JSON.parse(configNode.textContent);
  } catch (error) {
    status.textContent = 'La configuration locale est indisponible. Rechargez la page.';
    status.dataset.state = 'error';
    return;
  }

  const labels = Object.freeze({
    percentage: 'Montant du pourcentage choisi',
    offering: 'Offrande supplémentaire',
    pledgePerPeriod: 'Part de promesse par période',
    total: 'Total',
    remaining: 'Reste arithmétique',
    subtotal: 'Sous-total',
    bufferAmount: 'Marge',
    familyA: 'Première famille',
    familyB: 'Deuxième famille',
    pending: 'Question en attente',
    nextStep: 'Prochaine étape',
    items: 'Lignes saisies',
    culture: 'Langue ou communauté',
    purpose: 'Usage prévu',
    verification: 'Vérification prévue',
    text: 'Référence',
    context: 'Contexte prudent',
    netAssets: 'Actifs nets du modèle',
    nisab: 'Seuil de nisab calculé',
    eligible: 'Seuil atteint dans ce modèle',
    zakat: 'Estimation à 2,5 %',
    city: 'Ville d’exemple',
    method: 'Méthode à comparer',
    date: 'Date',
    fajr: 'Fajr',
    sunrise: 'Lever du soleil',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    qibla: 'Direction Qibla (degrés)',
    startDate: 'Date de départ provisoire',
    days: 'Nombre de jours',
    suhoor: 'Arrêt suhoor calculé',
    iftar: 'Iftar calculé',
    net: 'Succession nette du modèle',
    spouseShare: 'Part du conjoint dans le cas limité',
    residue: 'Résidu du cas limité',
    sonShare: 'Part par fils dans le cas limité',
    daughterShare: 'Part par fille dans le cas limité',
    financed: 'Montant financé',
    markup: 'Marge saisie',
    monthly: 'Mensualité arithmétique',
    hospitality: 'Accueil des proches',
    candidate: 'Prénom candidat',
    reportedMeaning: 'Signification rapportée',
    reviewer: 'Personne à consulter',
    status: 'État',
    referenceDate: 'Date de référence',
    marketDay: 'Jour de cycle estimé',
    localAuthority: 'Source locale à confirmer',
    years: 'Années révolues',
    months: 'Mois supplémentaires',
    totalDays: 'Jours écoulés',
    weekday: 'Jour de naissance',
    name: 'Suggestion de jour-nom',
    festival: 'Événement',
    country: 'Pays ou communauté',
    provisionalDate: 'Date provisoire',
    organizer: 'Organisateur à contacter',
    respectNote: 'Règle à confirmer',
    nextAction: 'Action suivante',
    discountAmount: 'Remise',
    quantity: 'Quantité',
    documented: 'Éléments documentés',
    missing: 'Éléments non documentés',
    followUps: 'Points à vérifier',
    totalChecks: 'Contrôles de la checklist',
    authority: 'Organisme à contacter',
    certification: 'Certification délivrée',
    gregorian: 'Date grégorienne',
    hijriDay: 'Jour Hijri estimé',
    hijriMonth: 'Numéro du mois Hijri',
    hijriMonthName: 'Mois Hijri estimé',
    hijriYear: 'Année Hijri estimée',
    adjustment: 'Ajustement appliqué',
    boundary: 'Nature du résultat'
  });

  const valueLabels = Object.freeze({
    true: 'Oui, pour ce modèle uniquement',
    false: 'Non',
    'family-review-needed': 'Révision familiale nécessaire',
    'confirm-exact-date': 'Confirmer la date exacte avec l’organisateur',
    'tabular-estimate': 'Estimation tabulaire'
  });

  function inputs() {
    const values = {};
    new FormData(form).forEach((value, key) => {
      values[key] = value;
    });
    return values;
  }

  function formatNumber(value) {
    const currencyControl = form.elements.currency;
    if (currencyControl && /(?:total|share|amount|assets|nisab|zakat|monthly|markup|financed|remaining|offering|percentage|hospitality|subtotal|discount)/i.test(String(this || ''))) {
      try {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currencyControl.value, maximumFractionDigits: 2 }).format(value);
      } catch (error) {
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
      }
    }
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value);
  }

  function displayValue(key, value) {
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (item && typeof item === 'object') {
          const name = item.item || item.name || 'Ligne';
          return `${name}: ${typeof item.value === 'number' ? formatNumber.call('total', item.value) : String(item.value || '')}`;
        }
        return String(item);
      }).join(' · ');
    }
    if (typeof value === 'number') return formatNumber.call(key, value);
    if (typeof value === 'boolean') return valueLabels[String(value)];
    return valueLabels[String(value)] || String(value);
  }

  function render(values) {
    output.replaceChildren();
    const list = document.createElement('dl');
    list.className = 'fr-rc-results-list';
    Object.entries(values).forEach(([key, value]) => {
      const group = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = labels[key] || key;
      description.textContent = displayValue(key, value);
      group.append(term, description);
      list.appendChild(group);
    });
    output.appendChild(list);
    output.hidden = false;
  }

  function localError(result) {
    const field = result.field ? form.elements[result.field] : null;
    const label = result.field && config.fields.find((item) => item.id === result.field);
    const name = label ? label.label : 'une valeur';
    const messages = {
      REQUIRED: `Renseignez ${name}.`,
      INVALID_NUMBER: `Saisissez un nombre valide pour ${name}.`,
      MIN: `${name} est inférieur au minimum autorisé.`,
      MAX: `${name} dépasse le maximum autorisé.`,
      INTEGER: `${name} doit être un nombre entier.`,
      INVALID_TIME: 'Saisissez une heure valide.',
      INVALID_DATE: `Saisissez une date valide pour ${name}.`,
      DATE_ORDER: 'La date de calcul doit être postérieure ou égale à la date de naissance.',
      ZERO_THRESHOLD: 'Saisissez un prix positif pour calculer le seuil choisi.',
      DEDUCTIONS_EXCEED_ESTATE: 'Les déductions ne peuvent pas dépasser la succession brute.',
      LIMITED_CASE_CHILD_REQUIRED: 'Ce modèle limité exige au moins un fils ou une fille.',
      DEPOSIT_EXCEEDS_PRICE: 'L’apport ne peut pas dépasser le prix de l’actif.',
      UNSUPPORTED: `La valeur choisie pour ${name} n’est pas prise en charge.`,
      UNKNOWN_ENGINE: 'Ce calcul local n’est pas disponible.',
      CALCULATION_ERROR: 'Le calcul local a rencontré une erreur déterministe.'
    };
    status.textContent = messages[result.code] || 'Vérifiez les valeurs saisies.';
    status.dataset.state = 'error';
    output.hidden = true;
    output.replaceChildren();
    lastResult = null;
    if (field && typeof field.focus === 'function') field.focus();
  }

  function calculate(event) {
    if (event) event.preventDefault();
    const result = engine.calculate(config.engine, inputs());
    if (!result.ok) {
      localError(result);
      return null;
    }
    lastResult = result.values;
    render(lastResult);
    if (config.sourceId === 'lobola-calculator') {
      try {
        localStorage.setItem(lobolaPlanKey, JSON.stringify({
          schemaVersion: 1,
          currency: form.elements.currency.value,
          familyExpectation: Number(form.elements.familyExpectation.value) || 0,
          giftValue: Number(form.elements.giftValue.value) || 0,
          ceremonyCost: Number(form.elements.ceremonyCost.value) || 0,
          buffer: Number(form.elements.buffer.value) || 0,
          total: Number(lastResult.total) || 0
        }));
      } catch (error) {
        // The calculator remains fully usable when storage is unavailable.
      }
    }
    status.textContent = 'Résultat calculé localement. Aucune saisie n’a été envoyée.';
    status.dataset.state = 'success';
    return lastResult;
  }

  function exportPayload() {
    const values = lastResult || calculate();
    if (!values) return null;
    return {
      schemaVersion: 1,
      locale: 'fr',
      tool: config.sourceId,
      route: config.route,
      generatedAt: new Date().toISOString(),
      inputs: inputs(),
      result: values,
      source: config.source,
      freshness: config.reviewedOn,
      confidence: config.confidence,
      boundary: config.boundary,
      privacy: 'Calcul et fichier produits localement; aucune saisie transmise.'
    };
  }

  function copyResult() {
    const payload = exportPayload();
    if (!payload) return;
    const text = JSON.stringify(payload, null, 2);
    const fallback = () => {
      status.textContent = 'La copie automatique est indisponible. Utilisez le téléchargement JSON.';
      status.dataset.state = 'error';
    };
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      fallback();
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      status.textContent = 'Résumé copié localement.';
      status.dataset.state = 'success';
    }).catch(fallback);
  }

  function downloadResult() {
    const payload = exportPayload();
    if (!payload) return;
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${config.sourceId}-fr-resultat.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Fichier JSON téléchargé localement.';
    status.dataset.state = 'success';
  }

  function useSavedPlan() {
    let plan;
    try {
      plan = JSON.parse(localStorage.getItem(lobolaPlanKey) || 'null');
    } catch (error) {
      plan = null;
    }
    if (!plan || plan.schemaVersion !== 1) {
      status.textContent = 'Aucun plan Lobola sauvegardé n’est disponible sur cet appareil.';
      status.dataset.state = 'error';
      return;
    }
    if (config.sourceId === 'lobola-negotiation-checklist') {
      form.elements.pending.value = `Confirmer le budget familial sauvegardé (${plan.currency} ${Number(plan.total || 0).toLocaleString('fr-FR')})`;
    } else if (config.sourceId === 'lobola-gift-list') {
      form.elements.currency.value = plan.currency || form.elements.currency.value;
      form.elements.item1.value = 'Cadeaux saisis dans le plan';
      form.elements.value1.value = Number(plan.giftValue) || 0;
      form.elements.item2.value = 'Frais de cérémonie saisis';
      form.elements.value2.value = Number(plan.ceremonyCost) || 0;
    }
    calculate();
    status.textContent = 'Dernier plan importé depuis cet appareil.';
    status.dataset.state = 'success';
  }

  form.addEventListener('submit', calculate);
  form.addEventListener('input', () => {
    if (!lastResult) return;
    lastResult = null;
    output.hidden = true;
    output.replaceChildren();
    status.textContent = 'Valeurs modifiées. Relancez le calcul.';
    status.dataset.state = 'changed';
  });
  resetButton.addEventListener('click', () => {
    window.setTimeout(() => {
      lastResult = null;
      output.hidden = true;
      output.replaceChildren();
      status.textContent = 'Exemple réinitialisé.';
      status.dataset.state = 'changed';
      calculate();
    });
  });
  calculateButton.addEventListener('click', calculate);
  copyButton.addEventListener('click', copyResult);
  downloadButton.addEventListener('click', downloadResult);
  printButton.addEventListener('click', () => {
    if (!lastResult) calculate();
    window.print();
  });
  if (useSavedPlanButton) useSavedPlanButton.addEventListener('click', useSavedPlan);

  calculate();
})();
