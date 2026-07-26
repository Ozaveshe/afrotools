(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.bloodPressureCheckEngine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var CONTEXTS = {
    adult: 'Adult, not pregnant or recently postpartum',
    pregnant: 'Pregnant',
    postpartum: 'Within 6 weeks after birth'
  };

  function wholeNumber(value, label, minimum, maximum) {
    var text = String(value === undefined || value === null ? '' : value).trim();
    if (!/^\d+$/.test(text)) return { valid: false, error: label + ' must be a whole number.' };
    var number = Number(text);
    if (number < minimum || number > maximum) {
      return { valid: false, error: label + ' must be between ' + minimum + ' and ' + maximum + ' mmHg.' };
    }
    return { valid: true, value: number };
  }

  function parseReading(systolic, diastolic, index) {
    var top = wholeNumber(systolic, 'Systolic reading ' + index, 40, 260);
    if (!top.valid) return top;
    var bottom = wholeNumber(diastolic, 'Diastolic reading ' + index, 30, 160);
    if (!bottom.valid) return bottom;
    if (top.value <= bottom.value) {
      return { valid: false, error: 'Systolic reading ' + index + ' must be higher than its diastolic reading.' };
    }
    return { valid: true, systolic: top.value, diastolic: bottom.value };
  }

  function evaluate(input) {
    input = input || {};
    if (!Object.prototype.hasOwnProperty.call(CONTEXTS, input.context)) {
      return { valid: false, error: 'Choose a supported adult measurement context.' };
    }
    var first = parseReading(input.systolic1, input.diastolic1, 1);
    if (!first.valid) return first;
    var second = parseReading(input.systolic2, input.diastolic2, 2);
    if (!second.valid) return second;

    var technique = ['rested', 'positioned', 'cuff', 'quiet'].filter(function (key) {
      return input[key] === true;
    });
    var techniqueComplete = technique.length === 4;
    var average = {
      systolic: Math.round((first.systolic + second.systolic) / 2),
      diastolic: Math.round((first.diastolic + second.diastolic) / 2)
    };
    var highest = {
      systolic: Math.max(first.systolic, second.systolic),
      diastolic: Math.max(first.diastolic, second.diastolic)
    };
    var pregnancyContext = input.context === 'pregnant' || input.context === 'postpartum';
    var band;
    var priority;
    var title;
    var action;

    if (input.urgentSymptoms === true) {
      band = 'emergency-symptoms';
      priority = 'Emergency symptoms';
      title = 'Seek local emergency help now';
      action = 'Do not wait for another reading or use this result to decide whether symptoms are serious. If pregnant or recently postpartum, also contact the maternity team while emergency help is being arranged when possible.';
    } else if (pregnancyContext && (highest.systolic >= 160 || highest.diastolic >= 110)) {
      band = 'pregnancy-severe';
      priority = 'Urgent maternity assessment';
      title = 'Contact maternity emergency care now';
      action = 'At least one reading reaches the 160 systolic or 110 diastolic severe pregnancy boundary. Seek urgent maternity assessment now; use local emergency help if the maternity team cannot be reached promptly.';
    } else if (pregnancyContext && (highest.systolic >= 140 || highest.diastolic >= 90)) {
      band = 'pregnancy-review';
      priority = 'Same-day maternity contact';
      title = 'Contact your maternity team today';
      action = 'At least one reading reaches the 140 systolic or 90 diastolic pregnancy boundary. This does not diagnose pre-eclampsia or hypertension, but it needs prompt review under your local maternity plan.';
    } else if (!pregnancyContext && (second.systolic > 180 || second.diastolic > 120)) {
      band = 'adult-very-high-repeat';
      priority = 'Immediate clinical contact';
      title = 'The repeat reading remains very high';
      action = 'The second reading is still over 180 systolic or over 120 diastolic. Contact a qualified clinician immediately. If any emergency symptom develops, seek local emergency help now.';
    } else if (!pregnancyContext && (first.systolic > 180 || first.diastolic > 120)) {
      band = 'adult-very-high-first';
      priority = 'Prompt clinical contact';
      title = 'One reading was over the very-high boundary';
      action = 'The first reading was over 180 systolic or over 120 diastolic even though the repeat was lower. Contact a qualified clinician promptly for device, technique and clinical review; seek emergency help for any emergency symptom.';
    } else if (!pregnancyContext && (highest.systolic >= 140 || highest.diastolic >= 90)) {
      band = 'adult-review';
      priority = 'Clinical review';
      title = 'Arrange a blood-pressure review';
      action = 'At least one reading reaches the WHO 140 systolic or 90 diastolic clinic threshold. A diagnosis requires professional assessment and qualifying measurements on two different days.';
    } else if (!techniqueComplete) {
      band = 'repeat-technique';
      priority = 'Repeat with full setup';
      title = 'Repeat with a complete measurement setup';
      action = 'The readings are below the context threshold used by this card, but one or more technique checks were not confirmed. Repeat correctly and follow any monitoring plan from your clinician.';
    } else if (pregnancyContext) {
      band = 'pregnancy-below-boundary';
      priority = 'Below card boundary';
      title = 'These two readings are below the pregnancy prompt boundary';
      action = 'That does not rule out pre-eclampsia or another problem. Contact the maternity team for warning symptoms, a concerning change, reduced fetal movement, or any instruction in your care plan.';
    } else {
      band = 'adult-below-threshold';
      priority = 'Below WHO clinic threshold';
      title = 'These two readings are below 140/90';
      action = 'This is not a diagnosis, treatment target or reassurance about symptoms. Keep following any clinician-directed monitoring plan and seek review for concerns or repeated changes.';
    }

    return {
      valid: true,
      context: input.context,
      contextLabel: CONTEXTS[input.context],
      first: first,
      second: second,
      average: average,
      highest: highest,
      techniqueCount: technique.length,
      techniqueComplete: techniqueComplete,
      urgentSymptoms: input.urgentSymptoms === true,
      band: band,
      priority: priority,
      title: title,
      action: action,
      boundary: 'Two home readings cannot confirm or exclude hypertension, pre-eclampsia, treatment need or another condition.'
    };
  }

  return {
    CONTEXTS: CONTEXTS,
    evaluate: evaluate
  };
});
