(function (root, factory) {
  const engine = typeof module === 'object' && module.exports
    ? require('../../../tools/malaria-risk/malaria-urgency-engine.js')
    : root.MalariaUrgencyEngine;
  const api = factory(engine);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MalariaUrgencyFr = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine) {
  'use strict';

  if (!engine || typeof engine.assess !== 'function') {
    throw new Error('Le moteur de vérification du paludisme est indisponible.');
  }

  const OUTCOMES = Object.freeze({
    'Emergency care now': Object.freeze({
      level: 'Urgences maintenant',
      action: 'Allez immédiatement au service d’urgence le plus proche ou suivez les consignes locales d’urgence et de santé publique. Signalez toute exposition possible au paludisme et tout test récent. N’attendez pas un autre questionnaire, un téléchargement ou une automédication.',
      warning: 'Ce questionnaire ne diagnostique pas le paludisme. Un signe d’urgence exige des soins en personne, même après un test négatif ou en attente.'
    }),
    'Qualified malaria care today': Object.freeze({
      level: 'Prise en charge qualifiée aujourd’hui',
      action: 'Contactez aujourd’hui le service qui a réalisé le test ou une structure de santé qualifiée pour confirmer le résultat et organiser la prise en charge. Ne choisissez pas et ne modifiez pas un médicament antipaludique ou sa dose à partir de ce questionnaire.',
      warning: 'Un professionnel doit interpréter le résultat et organiser les soins. Une aggravation ou tout signe d’urgence exige des soins d’urgence.'
    }),
    'Same-day clinical reassessment': Object.freeze({
      level: 'Réévaluation clinique aujourd’hui',
      action: 'Contactez aujourd’hui un service de santé qualifié. Un test négatif doit conduire à rechercher d’autres causes; des symptômes persistants ou qui s’aggravent peuvent nécessiter une nouvelle évaluation ou un nouveau test selon les consignes cliniques locales.',
      warning: 'Ne considérez pas un test négatif ou en attente comme rassurant. Ne commencez pas seul un antipaludique et ne retardez pas les soins.'
    }),
    'Prompt same-day malaria testing': Object.freeze({
      level: 'Dépistage du paludisme aujourd’hui',
      action: 'Demandez dès que possible aujourd’hui un test parasitologique du paludisme auprès d’un service de santé qualifié. Si le test n’est pas rapidement accessible, contactez un service de soins urgents au lieu d’attendre ou de vous automédiquer.',
      warning: 'Ne posez pas vous-même un diagnostic à partir des symptômes et ne retardez pas le test parce que les symptômes semblent légers.'
    }),
    'Same-day clinical assessment': Object.freeze({
      level: 'Évaluation clinique aujourd’hui',
      action: 'Contactez aujourd’hui un service de santé qualifié pour évaluer le paludisme et les autres causes possibles. L’exposition peut être incertaine.',
      warning: 'L’absence d’exposition connue n’exclut ni le paludisme ni une autre maladie grave.'
    }),
    'No symptom-based malaria conclusion': Object.freeze({
      level: 'Aucune conclusion sans symptômes',
      action: 'Ce questionnaire ne peut pas déterminer une infection avant l’apparition de symptômes. Suivez les consignes locales actuelles de voyage et de santé publique, puis demandez rapidement un test si une fièvre ou d’autres symptômes apparaissent.',
      warning: 'L’absence de symptômes sélectionnés ne prouve pas l’absence de paludisme et ne remplace pas un conseil professionnel de prévention.'
    }),
    'No malaria conclusion from this checklist': Object.freeze({
      level: 'Aucune conclusion sur le paludisme',
      action: 'N’utilisez pas ce résultat pour exclure le paludisme. Si des symptômes apparaissent ou si les informations d’exposition changent, demandez rapidement une évaluation qualifiée.',
      warning: 'Ce résultat ne garantit pas l’absence de paludisme et ne remplace pas un test.'
    })
  });

  const REASONS = Object.freeze({
    'symptoms started today': 'les symptômes ont commencé aujourd’hui',
    'symptoms started 1–2 days ago': 'les symptômes ont commencé il y a 1 à 2 jours',
    'symptoms started 3 or more days ago': 'les symptômes ont commencé il y a au moins 3 jours',
    'symptom timing is uncertain': 'le début des symptômes est incertain',
    'symptoms are worsening': 'les symptômes s’aggravent',
    'higher-risk context': 'contexte de vulnérabilité accrue',
    'one or more emergency warning signs': 'au moins un signe d’urgence',
    'a reported positive malaria test': 'un test de paludisme déclaré positif',
    'current symptoms despite a negative or pending test': 'des symptômes actuels malgré un test négatif ou en attente',
    'malaria-compatible symptom(s)': 'un ou plusieurs symptômes compatibles avec le paludisme',
    'possible malaria exposure': 'une exposition possible au paludisme',
    'malaria-compatible symptom(s) without a known exposure': 'un ou plusieurs symptômes compatibles sans exposition connue',
    'possible exposure without selected symptoms': 'une exposition possible sans symptôme sélectionné',
    'higher-risk context without selected symptoms': 'un contexte de vulnérabilité accrue sans symptôme sélectionné',
    'no selected compatible or emergency symptoms and no known exposure': 'aucun symptôme compatible ou urgent sélectionné et aucune exposition connue'
  });

  const TEST_STATUS = Object.freeze({
    none: 'aucun',
    pending: 'en attente',
    negative: 'négatif déclaré',
    positive: 'positif déclaré'
  });

  const ERRORS = Object.freeze({
    'Choose an exposure answer.': 'Choisissez une réponse concernant l’exposition.',
    'Choose when symptoms started.': 'Indiquez quand les symptômes ont commencé.',
    'Choose the recent test status.': 'Choisissez le statut du test récent.',
    'Choose when the current symptoms started.': 'Indiquez quand les symptômes actuels ont commencé.'
  });

  function translateReason(reason) {
    if (REASONS[reason]) return REASONS[reason];
    const testMatch = /^recent malaria test: (none|pending|negative|positive)$/.exec(reason);
    if (testMatch) return `test de paludisme récent : ${TEST_STATUS[testMatch[1]]}`;
    throw new Error(`Motif de sécurité non traduit : ${reason}`);
  }

  function assess(input) {
    let source;
    try {
      source = engine.assess(input);
    } catch (error) {
      throw new Error(ERRORS[error.message] || 'Vérifiez les réponses du questionnaire.');
    }
    const translated = OUTCOMES[source.level];
    if (!translated) throw new Error('Résultat de sécurité non traduit.');
    return Object.freeze({
      level: translated.level,
      action: translated.action,
      reasons: Object.freeze(source.reasons.map(translateReason)),
      warning: translated.warning,
      source
    });
  }

  return Object.freeze({ assess });
});
