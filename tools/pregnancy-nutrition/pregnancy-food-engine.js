(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.pregnancyFoodEngine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var GROUPS = [
    { id: 'vegetables', label: 'Vegetables', question: 'Which affordable vegetables could add variety, if available and tolerated?' },
    { id: 'fruit', label: 'Fruit', question: 'Which washed local fruit could fit your food access and care plan?' },
    { id: 'staples', label: 'Staples or whole grains', question: 'Which staple or whole-grain foods could provide a practical meal base?' },
    { id: 'pulses', label: 'Beans, peas, nuts or seeds', question: 'Could beans, peas, nuts or seeds be used safely and affordably, or is another option better?' },
    { id: 'animal-protein', label: 'Eggs, meat, poultry or fish', question: 'If you eat animal foods, which well-cooked option is suitable? If not, what alternative does your clinician or dietitian suggest?' },
    { id: 'dairy', label: 'Pasteurized dairy or a suitable fortified alternative', question: 'Do you need advice on a pasteurized dairy food or suitable fortified alternative?' }
  ];

  var SAFETY = [
    { id: 'clean-water', question: 'Confirm access to safe water and clean hands, surfaces and utensils.' },
    { id: 'wash-produce', question: 'Confirm fruit and vegetables will be washed thoroughly.' },
    { id: 'cook-animal', question: 'Confirm animal foods will be cooked thoroughly and raw shellfish avoided.' },
    { id: 'pasteurized', question: 'Check whether dairy is pasteurized or must be cooked under current official guidance.' },
    { id: 'no-alcohol', question: 'Keep alcohol out of the pregnancy plan and ask for support if that is difficult.' }
  ];

  var SUPPLEMENT_COPY = {
    confirm: 'Confirm the supplement plan with a maternity clinician or pharmacist. Local policies, medicines and individual risks matter.',
    'provider-plan': 'Keep following the individualized plan from the maternity clinician. Do not change doses from this worksheet.',
    'not-recorded': 'No supplement status is included. Ask a maternity clinician or pharmacist if guidance is needed.'
  };

  function uniqueKnown(values, definitions) {
    var known = definitions.map(function (item) { return item.id; });
    return Array.from(new Set(Array.isArray(values) ? values : []))
      .filter(function (value) { return known.indexOf(value) !== -1; });
  }

  function build(input) {
    input = input || {};
    var selectedIds = uniqueKnown(input.groups, GROUPS);
    var safetyIds = uniqueKnown(input.safetyChecks, SAFETY);
    var supplementStatus = Object.prototype.hasOwnProperty.call(SUPPLEMENT_COPY, input.supplementStatus)
      ? input.supplementStatus
      : 'confirm';

    if (!selectedIds.length) {
      return {
        valid: false,
        error: 'Select at least one food group to build a discussion card.'
      };
    }

    return {
      valid: true,
      selectedGroups: GROUPS.filter(function (item) {
        return selectedIds.indexOf(item.id) !== -1;
      }).map(function (item) { return item.label; }),
      varietyQuestions: GROUPS.filter(function (item) {
        return selectedIds.indexOf(item.id) === -1;
      }).map(function (item) { return item.question; }),
      safetyQuestions: SAFETY.filter(function (item) {
        return safetyIds.indexOf(item.id) === -1;
      }).map(function (item) { return item.question; }),
      supplementStatus: supplementStatus,
      supplementCopy: SUPPLEMENT_COPY[supplementStatus],
      boundary: 'This card does not assess adequacy, prescribe food or supplements, or manage a pregnancy complication.'
    };
  }

  return {
    GROUPS: GROUPS,
    SAFETY: SAFETY,
    build: build
  };
});
