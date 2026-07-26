(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroToolsDrugDose = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var MASS_TO_MG = Object.freeze({ mcg: 0.001, mg: 1, g: 1000 });
  var LB_TO_KG = 0.45359237;

  function finitePositive(value) {
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function normalizeMass(value, unit) {
    var number = finitePositive(value);
    if (number === null || !Object.prototype.hasOwnProperty.call(MASS_TO_MG, unit)) return null;
    return number * MASS_TO_MG[unit];
  }

  function formatNumber(value, maximumFractionDigits) {
    return new Intl.NumberFormat('en', {
      maximumFractionDigits: maximumFractionDigits == null ? 6 : maximumFractionDigits,
      useGrouping: true
    }).format(value);
  }

  function calculate(input) {
    input = input || {};
    var errors = [];
    if (input.instructionConfirmed !== true) {
      errors.push({ field: 'instruction-confirmed', message: 'Confirm that the dose instruction came from a qualified clinician or pharmacist.' });
    }

    var prescribedDose = finitePositive(input.prescribedDose);
    if (prescribedDose === null) {
      errors.push({ field: 'prescribed-dose', message: 'Enter an instructed amount greater than zero.' });
    }
    if (!Object.prototype.hasOwnProperty.call(MASS_TO_MG, input.doseUnit)) {
      errors.push({ field: 'dose-unit', message: 'Choose a supported mass unit: mcg, mg, or g.' });
    }
    if (prescribedDose !== null && prescribedDose > 1000000) {
      errors.push({ field: 'prescribed-dose', message: 'This amount is too large for the arithmetic guardrail. Recheck the decimal point and unit with a pharmacist.' });
    }

    var weightKg = null;
    if (input.basis !== 'fixed' && input.basis !== 'weight') {
      errors.push({ field: 'dose-basis', message: 'Choose fixed amount or amount per kilogram.' });
    } else if (input.basis === 'weight') {
      var weight = finitePositive(input.weight);
      if (weight === null) {
        errors.push({ field: 'body-weight', message: 'Enter a body weight greater than zero.' });
      } else if (input.weightUnit !== 'kg' && input.weightUnit !== 'lb') {
        errors.push({ field: 'weight-unit', message: 'Choose kilograms or pounds.' });
      } else {
        weightKg = input.weightUnit === 'lb' ? weight * LB_TO_KG : weight;
        if (weightKg < 0.1 || weightKg > 500) {
          errors.push({ field: 'body-weight', message: 'The converted weight falls outside this checker’s entry guardrail. Recheck the value and unit.' });
        }
      }
    }

    if (errors.length) return { ok: false, errors: errors };

    var prescribedMg = normalizeMass(prescribedDose, input.doseUnit);
    var totalMg = input.basis === 'weight' ? prescribedMg * weightKg : prescribedMg;
    if (!Number.isFinite(totalMg) || totalMg <= 0 || totalMg > 1000000000) {
      return { ok: false, errors: [{ field: 'prescribed-dose', message: 'The calculated mass is outside this checker’s arithmetic guardrail. Recheck every value and unit.' }] };
    }

    var base = {
      ok: true,
      mode: input.mode,
      totalMg: totalMg,
      weightKg: weightKg,
      medicationName: String(input.medicationName || '').trim().slice(0, 100),
      basis: input.basis,
      prescribedDose: prescribedDose,
      doseUnit: input.doseUnit,
      inputSummary: [
        { label: 'Instruction source', value: 'Clinician/pharmacist instruction confirmed' },
        { label: 'Medication label name', value: String(input.medicationName || '').trim().slice(0, 100) || 'Not entered' },
        { label: 'Instructed amount', value: formatNumber(prescribedDose) + ' ' + input.doseUnit + (input.basis === 'weight' ? ' per kg' : '') }
      ],
      warnings: []
    };
    if (input.basis === 'weight') {
      base.inputSummary.push({
        label: 'Weight entered',
        value: formatNumber(finitePositive(input.weight), 6) + ' ' + input.weightUnit + ' (' + formatNumber(weightKg, 4) + ' kg)'
      });
    }

    if (input.mode === 'mass') {
      base.value = totalMg;
      base.unit = 'mg';
      base.display = formatNumber(totalMg) + ' mg';
      base.formula = input.basis === 'weight'
        ? formatNumber(prescribedDose) + ' ' + input.doseUnit + '/kg × ' + formatNumber(weightKg, 4) + ' kg = ' + formatNumber(totalMg) + ' mg'
        : formatNumber(prescribedDose) + ' ' + input.doseUnit + ' = ' + formatNumber(totalMg) + ' mg';
      base.warnings.push('Confirm the written instruction, route, timing, frequency, medicine, and patient with a clinician or pharmacist before use.');
      return base;
    }

    if (input.mode === 'liquid') {
      var concentrationMg = normalizeMass(input.concentrationMass, input.concentrationUnit);
      var concentrationVolume = finitePositive(input.concentrationVolume);
      if (concentrationMg === null) errors.push({ field: 'concentration-mass', message: 'Enter a positive label mass and a supported mass unit.' });
      if (concentrationVolume === null) errors.push({ field: 'concentration-volume', message: 'Enter the positive mL volume printed in the same concentration statement.' });
      if (errors.length) return { ok: false, errors: errors };
      var mgPerMl = concentrationMg / concentrationVolume;
      var volumeMl = totalMg / mgPerMl;
      if (!Number.isFinite(volumeMl) || volumeMl <= 0 || volumeMl > 10000) {
        return { ok: false, errors: [{ field: 'concentration-volume', message: 'The liquid result is outside this checker’s arithmetic guardrail. Recheck the dose, decimal points, and label concentration.' }] };
      }
      base.value = volumeMl;
      base.unit = 'mL';
      base.display = formatNumber(volumeMl, 4) + ' mL';
      base.formula = formatNumber(totalMg) + ' mg ÷ (' + formatNumber(concentrationMg) + ' mg ÷ ' + formatNumber(concentrationVolume) + ' mL) = ' + formatNumber(volumeMl, 4) + ' mL';
      base.concentrationMgPerMl = mgPerMl;
      base.inputSummary.push({
        label: 'Label concentration',
        value: formatNumber(finitePositive(input.concentrationMass)) + ' ' + input.concentrationUnit + ' per ' + formatNumber(concentrationVolume) + ' mL'
      });
      base.warnings.push('Copy the concentration from the exact product label and measure only with its calibrated oral syringe, cup, or other supplied device.');
      base.warnings.push('This arithmetic does not confirm that the entered dose, formulation, route, or timing is safe.');
      return base;
    }

    if (input.mode === 'solid') {
      var strengthMg = normalizeMass(input.unitStrength, input.strengthUnit);
      if (strengthMg === null) {
        return { ok: false, errors: [{ field: 'unit-strength', message: 'Enter a positive strength per whole tablet or capsule and a supported mass unit.' }] };
      }
      var count = totalMg / strengthMg;
      if (!Number.isFinite(count) || count <= 0 || count > 1000) {
        return { ok: false, errors: [{ field: 'unit-strength', message: 'The unit count is outside this checker’s arithmetic guardrail. Recheck the dose, decimal points, and label strength.' }] };
      }
      var whole = Math.abs(count - Math.round(count)) < 1e-10;
      base.value = count;
      base.unit = 'whole unit(s)';
      base.display = formatNumber(count, 6) + ' whole tablet/capsule unit(s)';
      base.formula = formatNumber(totalMg) + ' mg ÷ ' + formatNumber(strengthMg) + ' mg per whole unit = ' + formatNumber(count, 6) + ' unit(s)';
      base.isWholeUnit = whole;
      base.inputSummary.push({
        label: 'Strength per whole unit',
        value: formatNumber(finitePositive(input.unitStrength)) + ' ' + input.strengthUnit
      });
      if (!whole) {
        base.warnings.push('This is not a whole-unit result. The product cannot exactly deliver the entered amount as whole units. Do not split, crush, open, or substitute it unless a pharmacist or clinician confirms that for the exact product.');
      }
      base.warnings.push('This arithmetic does not confirm that the entered dose, formulation, route, or timing is safe.');
      return base;
    }

    return { ok: false, errors: [{ field: 'output-mode', message: 'Choose mass, liquid, or tablet/capsule arithmetic.' }] };
  }

  return Object.freeze({
    calculate: calculate,
    normalizeMass: normalizeMass,
    LB_TO_KG: LB_TO_KG
  });
});
