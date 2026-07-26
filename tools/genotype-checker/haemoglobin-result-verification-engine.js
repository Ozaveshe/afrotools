(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.HaemoglobinResultVerificationEngine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var SOURCE_REVIEW_DATE = '2026-07-26';
  var METHOD_LABELS = {
    electrophoresis: 'Haemoglobin electrophoresis',
    hplc: 'High-performance liquid chromatography (HPLC)',
    ief: 'Isoelectric focusing (IEF)',
    capillary: 'Capillary electrophoresis',
    genetic: 'Genetic test',
    other: 'Other method stated on the report',
    unknown: 'Method not stated or not known'
  };
  var STATUS_LABELS = {
    final: 'Final laboratory report',
    preliminary: 'Screening or preliminary result',
    unsure: 'Not sure whether the result is final'
  };
  var RESULT_GUIDANCE = {
    AA: {
      label: 'A / A notation',
      explanation: 'In this simplified notation, two A letters describe an HbA/HbA pattern. It does not rule out other health conditions or haemoglobin variants that the report did not test for.'
    },
    AS: {
      label: 'A / S notation',
      explanation: 'An HbA/HbS pattern is commonly described as sickle cell trait. Trait is different from sickle cell disease; the report and a qualified clinician must confirm the individual result.'
    },
    AC: {
      label: 'A / C notation',
      explanation: 'An HbA/HbC pattern is commonly described as haemoglobin C trait. Clinical interpretation still depends on the complete laboratory report.'
    },
    SS: {
      label: 'S / S notation',
      explanation: 'An HbS/HbS pattern is associated with sickle cell disease. This guide does not diagnose disease, interpret symptoms or predict severity.'
    },
    SC: {
      label: 'S / C notation',
      explanation: 'An HbS/HbC pattern is associated with sickle cell disease. This guide does not diagnose disease, interpret symptoms or predict severity.'
    },
    CC: {
      label: 'C / C notation',
      explanation: 'An HbC/HbC pattern is associated with haemoglobin C disease, which is not the same as sickle cell disease. A clinician should interpret the complete report.'
    }
  };

  function cleanNotation(value) {
    return String(value || '').trim().toUpperCase();
  }

  function canonicalNotation(value) {
    var cleaned = cleanNotation(value);
    var match = cleaned.match(/^(?:HB\s*)?([ASC])\s*\/?\s*([ASC])$/);
    if (!match) return null;
    var candidate = match[1] + match[2];
    return RESULT_GUIDANCE[candidate] ? candidate : null;
  }

  function validIsoDate(value) {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var date = new Date(value + 'T00:00:00Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function verify(input) {
    var reported = cleanNotation(input && input.reportedResult);
    var method = String(input && input.testMethod || 'unknown');
    var confirmation = String(input && input.confirmationStatus || 'unsure');
    var testDate = String(input && input.testDate || '');
    if (!reported) return { ok: false, error: 'Enter the result notation exactly as it appears on the report.' };
    if (!METHOD_LABELS[method]) return { ok: false, error: 'Choose the test method stated on the report, or choose method not known.' };
    if (!STATUS_LABELS[confirmation]) return { ok: false, error: 'Choose the report confirmation status.' };
    if (!validIsoDate(testDate)) return { ok: false, error: 'Enter a valid test date or leave it blank.' };
    if (testDate && testDate > new Date().toISOString().slice(0, 10)) {
      return { ok: false, error: 'The test date cannot be in the future.' };
    }

    var code = canonicalNotation(reported);
    var flags = [];
    var questions = [];
    if (!code) {
      flags.push('The notation is outside this guide’s narrow AA, AS, AC, SS, SC and CC set. Do not translate, reorder or guess it.');
      questions.push('What does every letter, number or symbol on this result mean?');
      questions.push('Does this result include a variant or beta-thalassaemia pattern that this guide does not cover?');
    }
    if (method === 'unknown') {
      flags.push('The testing method is not recorded here.');
      questions.push('Which laboratory method produced this result, and is confirmatory testing needed?');
    } else if (method === 'other') {
      flags.push('The report uses a method not interpreted by this guide.');
      questions.push('Is the stated method definitive for this result, and what are its limitations?');
    }
    if (confirmation !== 'final') {
      flags.push(confirmation === 'preliminary'
        ? 'A screening or preliminary result may need confirmatory follow-up.'
        : 'It is not clear whether this is a final, confirmed result.');
      questions.push('Is this a final laboratory-confirmed result or does it need confirmation?');
    }
    if (!testDate) {
      questions.push('When was this test performed, and can I obtain the dated report?');
    }
    questions.push('Does the complete report contain any additional haemoglobin fractions or comments I should understand?');
    questions.push('Would a clinician or genetic counsellor recommend any follow-up for my personal context?');
    questions.push('What newborn screening and confirmatory follow-up are available locally if this is relevant to family planning?');

    return {
      ok: true,
      reportedResult: reported,
      canonicalCode: code,
      notationStatus: code ? 'recognised-limited-notation' : 'unsupported-or-ambiguous-notation',
      notationLabel: code ? RESULT_GUIDANCE[code].label : 'Notation needs laboratory clarification',
      explanation: code
        ? RESULT_GUIDANCE[code].explanation
        : 'This guide cannot safely map the reported notation to its limited A/S/C set. Keep the original report unchanged and ask the laboratory or clinician to explain it.',
      testMethod: method,
      testMethodLabel: METHOD_LABELS[method],
      confirmationStatus: confirmation,
      confirmationStatusLabel: STATUS_LABELS[confirmation],
      testDate: testDate || 'Not recorded',
      flags: flags,
      questions: Array.from(new Set(questions)),
      sourceReviewDate: SOURCE_REVIEW_DATE,
      boundary: 'This checklist organises report-verification questions. It does not confirm a result, diagnose a condition, interpret symptoms, predict severity or calculate inheritance.'
    };
  }

  function toText(result) {
    if (!result || !result.ok) return '';
    var lines = [
      'AfroTools Haemoglobin Result Verification Checklist',
      'Reported notation: ' + result.reportedResult,
      'Guide status: ' + result.notationLabel,
      'Test method: ' + result.testMethodLabel,
      'Test date: ' + result.testDate,
      'Confirmation status: ' + result.confirmationStatusLabel,
      '',
      'Plain-language context:',
      result.explanation
    ];
    if (result.flags.length) {
      lines.push('', 'Items to verify:');
      result.flags.forEach(function (flag) { lines.push('- ' + flag); });
    }
    lines.push('', 'Questions to take to the laboratory, clinician or genetic counsellor:');
    result.questions.forEach(function (question) { lines.push('- ' + question); });
    lines.push('', result.boundary, 'Sources reviewed: ' + result.sourceReviewDate);
    return lines.join('\n');
  }

  return {
    SOURCE_REVIEW_DATE: SOURCE_REVIEW_DATE,
    canonicalNotation: canonicalNotation,
    verify: verify,
    toText: toText
  };
}));
