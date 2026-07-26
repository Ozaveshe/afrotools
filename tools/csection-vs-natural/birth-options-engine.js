(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.birthOptionsEngine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var CONTEXTS = {
    'not-decided': 'No mode decided',
    'vaginal-discussion': 'Vaginal birth discussion',
    'caesarean-discussion': 'Planned caesarean discussion',
    'previous-caesarean': 'Discussion after previous caesarean'
  };

  var TOPICS = [
    {
      id: 'reason',
      questions: [
        'What is the clinical reason this mode of birth is being discussed, and what evidence or findings support it?',
        'How certain is that information, and when will it be reviewed again?'
      ]
    },
    {
      id: 'benefits-risks',
      questions: [
        'What benefits and risks of vaginal and caesarean birth matter in my individual circumstances?',
        'How might each option affect recovery, the baby and future pregnancies?'
      ]
    },
    {
      id: 'alternatives',
      questions: [
        'What alternatives are reasonable, and what are the benefits, risks and uncertainties of each?',
        'What findings before or during labour could change the plan, and how would that be explained?'
      ]
    },
    {
      id: 'experience',
      questions: [
        'How will my consent, privacy, communication needs, cultural needs and preferences be respected?',
        'What pain-relief, companion and emotional-support options are available for each possible pathway?'
      ]
    },
    {
      id: 'recovery',
      questions: [
        'What recovery, pain-relief, mobility, feeding and newborn support should I prepare for?',
        'Which parent or baby warning signs need urgent help after discharge, and where should we go?'
      ]
    },
    {
      id: 'facility',
      questions: [
        'What staff, theatre, anaesthesia, blood, newborn support and transfer capability are available here?',
        'Who should I contact if labour, bleeding, reduced movement or another urgent concern starts before the plan?'
      ]
    }
  ];

  var COST = {
    'need-quote': [
      'Can the provider give separate written, dated, line-item quotes for the planned pathway and possible unplanned surgery, extra stay, medicines, blood, newborn care and transfer?',
      'Can the insurer or payer confirm covered facilities, authorization, exclusions, limits and likely out-of-pocket amounts in writing?'
    ],
    'have-quote': [
      'Is the quote dated, provider-issued and clear about what is included or excluded?',
      'What could change the amount if the clinical plan changes, and can the provider or insurer confirm that in writing?'
    ],
    'not-included': []
  };

  function build(input) {
    input = input || {};
    if (!Object.prototype.hasOwnProperty.call(CONTEXTS, input.context)) {
      return { valid: false, error: 'Choose a supported discussion context.' };
    }
    if (!Object.prototype.hasOwnProperty.call(COST, input.costStatus)) {
      return { valid: false, error: 'Choose a supported cost-conversation option.' };
    }
    var selected = Array.from(new Set(Array.isArray(input.topics) ? input.topics : []));
    var known = TOPICS.filter(function (topic) { return selected.indexOf(topic.id) !== -1; });
    if (!known.length) {
      return { valid: false, error: 'Select at least one discussion topic.' };
    }
    var questions = [];
    known.forEach(function (topic) { questions = questions.concat(topic.questions); });
    if (input.context === 'previous-caesarean') {
      questions.push('How do the previous operation details, current pregnancy and this facility\'s capabilities affect the available birth options?');
    }
    return {
      valid: true,
      context: input.context,
      contextLabel: CONTEXTS[input.context],
      questions: questions,
      costQuestions: COST[input.costStatus].slice(),
      boundary: 'This card does not rank or recommend a mode of birth. Cost questions are separate from clinical suitability.'
    };
  }

  return {
    CONTEXTS: CONTEXTS,
    TOPICS: TOPICS,
    COST: COST,
    build: build
  };
});
