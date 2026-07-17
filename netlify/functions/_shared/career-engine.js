'use strict';

var PERIODS_PER_YEAR = {
  weekly: 52,
  monthly: 12,
  annual: 1,
  one_time: 1,
};

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function currency(value) {
  return String(value || '').trim().toUpperCase();
}

function finiteNonNegative(value, label) {
  var amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error(label + ' must be a non-negative number.');
  }
  return amount;
}

function periodsPerYear(value) {
  if (value.periodsPerYear !== undefined) {
    var periods = finiteNonNegative(value.periodsPerYear, 'periodsPerYear');
    if (periods <= 0) throw new Error('periodsPerYear must be greater than zero.');
    return periods;
  }
  if (value.payPeriod === 'hourly' || value.payPeriod === 'daily') {
    throw new Error(value.payPeriod + ' values require periodsPerYear.');
  }
  if (!PERIODS_PER_YEAR[value.payPeriod]) throw new Error('Unsupported pay period.');
  return PERIODS_PER_YEAR[value.payPeriod];
}

function amount(currencyCode, annual) {
  return {
    currency: currencyCode,
    monthly: roundMoney(annual / 12),
    annual: roundMoney(annual),
  };
}

function buildRateResolver(rates) {
  var map = new Map();
  (rates || []).forEach(function (rate) {
    var from = currency(rate.from);
    var to = currency(rate.to);
    var value = Number(rate.rate);
    if (!/^[A-Z]{3}$/.test(from) || !/^[A-Z]{3}$/.test(to) || !Number.isFinite(value) || value <= 0) {
      throw new Error('FX rates require three-letter currencies and a positive rate.');
    }
    map.set(from + ':' + to, value);
  });
  return function (fromValue, toValue) {
    var from = currency(fromValue);
    var to = currency(toValue);
    if (from === to) return 1;
    if (map.has(from + ':' + to)) return map.get(from + ':' + to);
    if (map.has(to + ':' + from)) return 1 / map.get(to + ':' + from);
    throw new Error('Enter an FX rate for ' + from + ' to ' + to + '.');
  };
}

function normalizeMoney(value, comparisonCurrency, resolveRate) {
  if (!value || !/^[A-Z]{3}$/.test(currency(value.currency))) {
    throw new Error('Every money item requires a three-letter currency code.');
  }
  var annual = finiteNonNegative(value.amount, 'Money amount') * periodsPerYear(value);
  return amount(
    comparisonCurrency,
    annual * resolveRate(currency(value.currency), comparisonCurrency),
  );
}

function add(currencyCode, values) {
  return amount(
    currencyCode,
    values.reduce(function (total, value) { return total + value.annual; }, 0),
  );
}

function subtract(currencyCode, left, values) {
  return amount(
    currencyCode,
    left.annual - values.reduce(function (total, value) { return total + value.annual; }, 0),
  );
}

function normalizeOffer(offer, comparisonCurrency, resolveRate) {
  if (!offer || !offer.basePay || !offer.terms) throw new Error('Each offer requires pay and terms.');
  var normalize = function (value) { return normalizeMoney(value, comparisonCurrency, resolveRate); };
  var basePay = normalize(offer.basePay);
  var variable = Array.isArray(offer.variablePay) ? offer.variablePay : [];
  var benefits = Array.isArray(offer.benefits) ? offer.benefits : [];
  var costs = Array.isArray(offer.personalCosts) ? offer.personalCosts : [];
  var guaranteed = variable.filter(function (item) { return item.guaranteed; }).map(function (item) { return normalize(item.value); });
  var nonGuaranteed = variable.filter(function (item) { return !item.guaranteed; }).map(function (item) { return normalize(item.value); });
  var guaranteedCash = add(comparisonCurrency, [basePay].concat(guaranteed));
  var nonGuaranteedCash = add(comparisonCurrency, nonGuaranteed);
  var totalCash = add(comparisonCurrency, [guaranteedCash, nonGuaranteedCash]);
  var benefitValue = add(comparisonCurrency, benefits.map(function (item) { return normalize(item.value); }));
  var workCosts = add(comparisonCurrency, costs.map(function (item) { return normalize(item.value); }));
  var deductionsWereExplicit = Array.isArray(offer.estimatedDeductions);
  var deductions = offer.payBasis === 'gross' && deductionsWereExplicit
    ? add(comparisonCurrency, offer.estimatedDeductions.map(function (item) { return normalize(item.value); }))
    : null;
  var cashTakeHome = offer.payBasis === 'net'
    ? totalCash
    : deductions ? subtract(comparisonCurrency, totalCash, [deductions]) : null;
  var totalCompensation = add(comparisonCurrency, [totalCash, benefitValue]);
  var effectiveValue = subtract(comparisonCurrency, totalCompensation, [workCosts]);
  var effectiveTakeHomeValue = cashTakeHome
    ? subtract(comparisonCurrency, add(comparisonCurrency, [cashTakeHome, benefitValue]), [workCosts])
    : null;
  var warnings = [];
  if (offer.payBasis === 'gross' && !deductionsWereExplicit) {
    warnings.push('Take-home value is unavailable because this gross offer has no user-supplied deduction estimate.');
  }
  if (deductions && deductions.annual > totalCash.annual) {
    warnings.push('The entered deductions exceed total cash compensation; check the deduction inputs.');
  }
  return {
    id: String(offer.id || '').slice(0, 80),
    label: String(offer.label || 'Offer').slice(0, 120),
    payBasis: offer.payBasis === 'net' ? 'net' : 'gross',
    comparisonCurrency: comparisonCurrency,
    basePay: basePay,
    guaranteedCashCompensation: guaranteedCash,
    nonGuaranteedCashCompensation: nonGuaranteedCash,
    totalCashCompensation: totalCash,
    estimatedBenefitValue: benefitValue,
    personalWorkCosts: workCosts,
    estimatedDeductions: deductions,
    estimatedCashTakeHome: cashTakeHome,
    totalCompensation: totalCompensation,
    effectiveValue: effectiveValue,
    effectiveTakeHomeValue: effectiveTakeHomeValue,
    terms: offer.terms,
    warnings: warnings,
  };
}

function difference(currencyCode, a, b, lowerIsBetter) {
  if (!a || !b) return { currency: currencyCode, monthly: null, annual: null, leader: 'unknown' };
  var annual = roundMoney(a.annual - b.annual);
  var monthly = roundMoney(a.monthly - b.monthly);
  var leader = annual === 0
    ? 'tie'
    : lowerIsBetter
      ? (annual < 0 ? 'offer_a' : 'offer_b')
      : (annual > 0 ? 'offer_a' : 'offer_b');
  return { currency: currencyCode, monthly: monthly, annual: annual, leader: leader };
}

function display(value) {
  return value === undefined ? 'Not entered' : String(value);
}

function nonFinancial(a, b) {
  var output = [];
  var definitions = [
    ['arrangement', 'arrangement', 'The contract arrangements differ; compare the written protections in each agreement.'],
    ['workMode', 'work_mode', 'The entered work modes differ.'],
    ['paidLeaveDays', 'paid_leave', 'The entered paid-leave allowances differ.'],
    ['commuteHoursPerWeek', 'commute_time', 'The entered weekly commute times differ.'],
    ['contractTermMonths', 'contract_term', 'The entered contract terms differ.'],
    ['noticePeriodDays', 'notice_period', 'The entered notice periods differ.'],
  ];
  definitions.forEach(function (definition) {
    var key = definition[0];
    if (a.terms[key] !== b.terms[key]) {
      output.push({
        kind: definition[1],
        offerA: display(a.terms[key]),
        offerB: display(b.terms[key]),
        summary: definition[2],
      });
    }
  });
  var equipmentA = (a.terms.equipmentProvided || []).join(', ') || 'None entered';
  var equipmentB = (b.terms.equipmentProvided || []).join(', ') || 'None entered';
  if (equipmentA !== equipmentB) {
    output.push({ kind: 'equipment', offerA: equipmentA, offerB: equipmentB, summary: 'The equipment listed as provided differs.' });
  }
  return output;
}

function talkingPoints(a, b, differences) {
  var output = [];
  if (differences.guaranteedCashCompensation.leader !== 'tie') {
    output.push({
      kind: 'guaranteed_cash_gap',
      title: 'Close the guaranteed cash gap',
      evidence: 'The entered guaranteed cash amounts are not equal after normalization.',
      suggestion: 'Ask whether base pay or a guaranteed allowance can be adjusted before relying on variable pay.',
    });
  }
  if (a.estimatedCashTakeHome === null || b.estimatedCashTakeHome === null) {
    output.push({
      kind: 'take_home_unknown',
      title: 'Confirm deductions in writing',
      evidence: 'At least one gross offer has no explicit deduction estimate.',
      suggestion: 'Request a sample payslip or a written list of statutory and employer deductions.',
    });
  }
  if (differences.estimatedBenefitValue.leader !== 'tie') {
    output.push({
      kind: 'benefit_gap',
      title: 'Clarify benefit value and eligibility',
      evidence: 'The user-entered benefit values differ between the two offers.',
      suggestion: 'Confirm start dates, dependants, caps and what happens when employment ends.',
    });
  }
  if (differences.personalWorkCosts.leader !== 'tie') {
    output.push({
      kind: 'work_cost_gap',
      title: 'Negotiate recurring work costs',
      evidence: 'The entered personal work costs differ between the offers.',
      suggestion: 'Ask for transport, power, data or remote-work support tied to the larger recurring cost.',
    });
  }
  return output;
}

function compareOffers(input) {
  if (!input || !input.offerA || !input.offerB) throw new Error('Two offers are required.');
  var comparisonCurrency = currency(input.comparisonCurrency);
  if (!/^[A-Z]{3}$/.test(comparisonCurrency)) throw new Error('comparisonCurrency must be a three-letter code.');
  var resolveRate = buildRateResolver(input.fxRates || []);
  var offerA = normalizeOffer(input.offerA, comparisonCurrency, resolveRate);
  var offerB = normalizeOffer(input.offerB, comparisonCurrency, resolveRate);
  var differences = {
    basePay: difference(comparisonCurrency, offerA.basePay, offerB.basePay),
    guaranteedCashCompensation: difference(comparisonCurrency, offerA.guaranteedCashCompensation, offerB.guaranteedCashCompensation),
    nonGuaranteedCashCompensation: difference(comparisonCurrency, offerA.nonGuaranteedCashCompensation, offerB.nonGuaranteedCashCompensation),
    totalCashCompensation: difference(comparisonCurrency, offerA.totalCashCompensation, offerB.totalCashCompensation),
    estimatedBenefitValue: difference(comparisonCurrency, offerA.estimatedBenefitValue, offerB.estimatedBenefitValue),
    personalWorkCosts: difference(comparisonCurrency, offerA.personalWorkCosts, offerB.personalWorkCosts, true),
    estimatedDeductions: difference(comparisonCurrency, offerA.estimatedDeductions, offerB.estimatedDeductions, true),
    estimatedCashTakeHome: difference(comparisonCurrency, offerA.estimatedCashTakeHome, offerB.estimatedCashTakeHome),
    totalCompensation: difference(comparisonCurrency, offerA.totalCompensation, offerB.totalCompensation),
    effectiveValue: difference(comparisonCurrency, offerA.effectiveValue, offerB.effectiveValue),
    effectiveTakeHomeValue: difference(comparisonCurrency, offerA.effectiveTakeHomeValue, offerB.effectiveTakeHomeValue),
  };
  var notes = ['Amounts are normalized to annual and monthly ' + comparisonCurrency + ' using only supplied FX rates.'];
  (input.fxRates || []).forEach(function (rate) {
    notes.push('FX: 1 ' + currency(rate.from) + ' = ' + rate.rate + ' ' + currency(rate.to) + (rate.asOf ? ' as of ' + String(rate.asOf).slice(0, 32) : '') + '.');
  });
  return {
    comparisonCurrency: comparisonCurrency,
    offerA: offerA,
    offerB: offerB,
    differences: differences,
    nonFinancialDifferences: nonFinancial(offerA, offerB),
    negotiationTalkingPoints: talkingPoints(offerA, offerB, differences),
    normalizationNotes: notes,
  };
}

var PERSONAL_EMAILS = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'proton.me', 'protonmail.com', 'icloud.com']);
var FLAG_DEFINITIONS = {
  upfront_payment: ['high', 'Upfront recruitment payment', 'Legitimate employers normally do not charge candidates to apply or begin work.', ['Do not pay. Verify the vacancy through an independently found employer contact.']],
  training_or_equipment_fee: ['high', 'Training or equipment payment', 'A required purchase or deposit before work begins is a common recruitment scam pattern.', ['Do not buy equipment from a recruiter-selected seller or send a deposit.']],
  personal_email_domain: ['caution', 'Personal email address', 'A personal mailbox can be legitimate, but it provides less employer-domain evidence.', ['Confirm the recruiter through the employer website and switch to an official channel.']],
  suspicious_domain: ['high', 'Lookalike or unusual domain', 'Small domain differences can redirect applicants to an impersonator.', ['Type the official employer website yourself and compare every character.']],
  messaging_only_interview: ['caution', 'Messaging-only interview', 'Text-only recruitment makes identity and employer verification harder.', ['Request a video, phone or independently verified employer-channel conversation.']],
  unrealistic_compensation: ['caution', 'Compensation marked unrealistic', 'Unusually attractive pay can be used to reduce scrutiny.', ['Compare the written role, experience requirements and pay with independent evidence.']],
  vague_employer_identity: ['caution', 'Employer identity is unclear', 'A candidate cannot independently verify an unnamed employer.', ['Ask for the legal employer name, website and verifiable contact.']],
  instant_offer: ['caution', 'Offer without assessment', 'An immediate offer without a credible selection process deserves extra verification.', ['Confirm the role and written offer with the employer directly.']],
  banking_credentials: ['high', 'Banking security information requested', 'Recruiters do not need passwords, PINs, OTPs, CVVs or banking login details.', ['Do not share credentials. Contact your bank immediately if you already did.']],
  unnecessary_identity_documents: ['high', 'Identity documents requested too early', 'Early document collection can enable identity theft.', ['Confirm necessity and use a verified secure employer channel only.']],
  cryptocurrency_request: ['high', 'Cryptocurrency payment or transfer', 'Crypto transfers are difficult to reverse and are not a normal recruitment requirement.', ['Do not transfer cryptocurrency or connect a wallet.']],
  urgency_pressure: ['caution', 'Unusual urgency or pressure', 'Pressure reduces the time available to verify the employer and request.', ['Pause and verify independently before acting.']],
  unrelated_application_link: ['high', 'Application link is unrelated to the employer', 'An unrelated destination may collect candidate credentials or documents.', ['Find the vacancy from the employer website instead of using the supplied link.']],
};

function statements(text) {
  return String(text || '').split(/(?:\r?\n|(?<=[.!?])\s+)/).map(function (item) { return item.trim(); }).filter(Boolean);
}

function snippet(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 220);
}

function negated(text) {
  return /\b(?:no|never|not|do not|don't|will not|won't|without)\b.{0,45}\b(?:fee|payment|pay|credentials|document|crypto|urgent)\b/i.test(text);
}

function domain(value) {
  var raw = String(value || '').trim().toLowerCase();
  if (!raw) return null;
  if (raw.includes('@')) raw = raw.split('@').pop();
  try {
    var url = new URL(raw.match(/^https?:\/\//) ? raw : 'https://' + raw.replace(/^www\./, ''));
    return url.hostname.replace(/^www\./, '').replace(/\.$/, '') || null;
  } catch (_) {
    return null;
  }
}

function sameOrSubdomain(candidate, official) {
  return candidate === official || candidate.endsWith('.' + official);
}

function editDistance(left, right) {
  var previous = Array.from({ length: right.length + 1 }, function (_, index) { return index; });
  for (var i = 1; i <= left.length; i += 1) {
    var current = [i];
    for (var j = 1; j <= right.length; j += 1) {
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[right.length];
}

function checkJobScam(input) {
  input = input || {};
  var text = String(input.vacancyText || '').trim().slice(0, 20000);
  var answers = input.answers || {};
  var items = statements(text);
  var flags = new Map();
  function add(code, source, evidence) {
    var definition = FLAG_DEFINITIONS[code];
    var existing = flags.get(code);
    if (existing) {
      if (existing.source !== source) existing.source = 'both';
      if (!existing.evidence.includes(snippet(evidence))) existing.evidence.push(snippet(evidence));
      return;
    }
    flags.set(code, {
      code: code,
      severity: definition[0],
      title: definition[1],
      whyItMatters: definition[2],
      evidence: [snippet(evidence)],
      source: source,
      verificationSteps: definition[3],
    });
  }
  function find(patterns) {
    return items.find(function (item) { return !negated(item) && patterns.some(function (pattern) { return pattern.test(item); }); });
  }

  var training = find([/\b(?:training|equipment|laptop|software|starter kit)\b.{0,50}\b(?:fee|deposit|payment|buy|purchase)\b/i, /\b(?:pay|buy|purchase)\b.{0,45}\b(?:training|equipment|laptop|software)\b/i]);
  if (training) add('training_or_equipment_fee', 'text', training);
  var fee = find([/\b(?:application|registration|processing|onboarding|administrative|security|upfront)\s+(?:fee|deposit|payment)\b/i, /\bpay\b.{0,35}\b(?:application|registration|processing|onboarding)\b/i]);
  if (fee && fee !== training) add('upfront_payment', 'text', fee);
  if (answers.feeRequested === true) add(answers.feePurpose === 'training' || answers.feePurpose === 'equipment' ? 'training_or_equipment_fee' : 'upfront_payment', 'answers', 'You answered that a recruitment payment was requested.');

  var emails = text.match(/[a-z\d.!#$%&'*+/=?^_`{|}~-]+@[a-z\d-]+(?:\.[a-z\d-]+)+/gi) || [];
  if (answers.recruiterEmail) emails.unshift(String(answers.recruiterEmail));
  emails.forEach(function (email) {
    var emailDomain = domain(email);
    if (PERSONAL_EMAILS.has(emailDomain)) add('personal_email_domain', email === answers.recruiterEmail ? 'answers' : 'text', 'The recruiter contact uses ' + emailDomain + '.');
  });

  var official = domain(answers.officialEmployerDomain);
  var application = domain(answers.applicationUrl);
  if (answers.domainAppearsMisspelled === true) add('suspicious_domain', 'answers', 'You marked a supplied domain as misspelled.');
  [application, domain(answers.recruiterEmail)].filter(Boolean).forEach(function (candidate) {
    if (candidate.includes('xn--') || (official && !sameOrSubdomain(candidate, official) && editDistance(candidate, official) <= (official.length > 12 ? 2 : 1))) {
      add('suspicious_domain', 'answers', candidate + ' is not the same as the entered official domain.');
    }
  });

  var messaging = find([/\b(?:interview|assessment)\b.{0,55}\b(?:whatsapp|telegram|signal|text|chat|messag\w*)\b.{0,25}\b(?:only|exclusively)\b/i, /\b(?:whatsapp|telegram|signal|text|chat)[- ]?only\b/i]);
  if (messaging) add('messaging_only_interview', 'text', messaging);
  if (answers.interviewChannel === 'messaging_only') add('messaging_only_interview', 'answers', 'You answered that the interview is messaging-only.');
  if (answers.compensationSeemsUnrealistic === true) add('unrealistic_compensation', 'answers', 'You marked the stated compensation as unrealistic.');

  var vague = find([/\b(?:confidential|unnamed|undisclosed)\s+(?:company|employer|client|organisation|organization)\b/i, /\b(?:cannot|can't|will not)\s+(?:name|disclose|identify)\s+(?:the\s+)?(?:company|employer|client)\b/i]);
  if (vague) add('vague_employer_identity', 'text', vague);
  if (answers.employerIdentityIsClear === false) add('vague_employer_identity', 'answers', 'You answered that the employer identity is unclear.');

  var instant = find([/\b(?:instant|immediate)\s+(?:job\s+)?offer\b/i, /\b(?:hired|selected|accepted)\b.{0,55}\b(?:without|no)\s+(?:an?\s+)?(?:interview|assessment|test)\b/i, /\bno\s+(?:interview|assessment|test)\s+(?:is\s+)?required\b/i]);
  if (instant) add('instant_offer', 'text', instant);
  if (answers.offerMadeWithoutAssessment === true) add('instant_offer', 'answers', 'You answered that an offer was made without assessment.');

  var banking = find([/\b(?:send|share|provide|enter|give|submit)\b.{0,55}\b(?:bank(?:ing)?\s+(?:login|password|credentials)|pin|otp|cvv|card\s+number|bvn)\b/i]);
  if (banking) add('banking_credentials', 'text', banking);
  if (answers.bankingCredentialsRequested === true) add('banking_credentials', 'answers', 'You answered that banking security information was requested.');
  var identity = find([/\b(?:send|share|provide|upload|submit)\b.{0,50}\b(?:passport|national id|identity document|nin|driver'?s licen[cs]e)\b.{0,35}\b(?:to apply|before (?:an?\s+)?interview|immediately)\b/i]);
  if (identity) add('unnecessary_identity_documents', 'text', identity);
  if (answers.unnecessaryIdentityDocumentsRequested === true) add('unnecessary_identity_documents', 'answers', 'You answered that identity documents were requested too early.');
  var crypto = find([/\b(?:salary|pay|payment|deposit|fee|purchase|send|receive)\b.{0,45}\b(?:bitcoin|btc|ethereum|eth|usdt|cryptocurrency|crypto|wallet)\b/i, /\b(?:bitcoin|btc|ethereum|eth|usdt|cryptocurrency|crypto|wallet)\b.{0,45}\b(?:pay|payment|send|receive)\b/i]);
  if (crypto) add('cryptocurrency_request', 'text', crypto);
  if (answers.cryptocurrencyRequested === true) add('cryptocurrency_request', 'answers', 'You answered that cryptocurrency was requested.');
  var urgent = find([/\b(?:act now|respond immediately|reply immediately|do not delay|limited slots?|offer expires today|last chance)\b/i, /\b(?:within|in the next)\s+\d{1,2}\s+hours?\b/i]);
  if (urgent) add('urgency_pressure', 'text', urgent);
  if (answers.pressureOrUrgency === true) add('urgency_pressure', 'answers', 'You answered that unusual urgency was used.');
  if (answers.applicationLinkRelatedToEmployer === false) add('unrelated_application_link', 'answers', 'You answered that the application link is unrelated to the employer.');
  if (application && official && !sameOrSubdomain(application, official) && !(answers.trustedApplicationDomains || []).map(domain).some(function (trusted) { return trusted && sameOrSubdomain(application, trusted); })) {
    add('unrelated_application_link', 'answers', application + ' is not the entered official employer domain ' + official + '.');
  }

  var resultFlags = Array.from(flags.values());
  var highCount = resultFlags.filter(function (flag) { return flag.severity === 'high'; }).length;
  var riskTier = highCount > 0 || resultFlags.length >= 4 ? 'high_caution' : resultFlags.length > 0 ? 'caution' : 'lower_indication';
  var labels = {
    high_caution: ['High caution', 'One or more serious warning signs need independent verification before you pay, share sensitive data, or continue. This automated result does not prove fraud.'],
    caution: ['Caution', 'Some details deserve independent verification before you continue. These signs can have legitimate explanations and do not prove fraud.'],
    lower_indication: ['Lower indication from supplied information', 'No listed warning sign was detected in the information supplied. This is not a safety guarantee or proof that the vacancy is legitimate.'],
  };
  var steps = Array.from(new Set([
    'Find the employer\'s official website independently instead of relying on supplied links.',
    'Confirm the vacancy and recruiter through an official employer contact before sharing money or sensitive data.',
  ].concat(resultFlags.flatMap(function (flag) { return flag.verificationSteps; }))));
  return {
    riskTier: riskTier,
    riskLabel: labels[riskTier][0],
    summary: labels[riskTier][1],
    flags: resultFlags,
    verificationSteps: steps,
    safeNextActions: [
      'Pause before paying, installing software, opening an account, or sharing sensitive documents.',
      'Use independently found contact details to verify the employer, role, recruiter and application destination.',
      'Keep the vacancy, messages, email headers, links, payment instructions and written offer as evidence.',
    ],
    limitations: [
      'This is an automated warning-sign check, not a determination that an employer is legitimate or fraudulent.',
      'The checker parses domains but does not open, fetch, follow or verify any URL.',
      'Missing or inaccurate answers can change the result.',
      'Compensation is flagged only when the user explicitly marks it as unrealistic.',
    ],
    inputCoverage: {
      textAnalyzed: text.length > 0,
      structuredAnswersProvided: Object.values(answers).filter(function (value) { return value !== undefined; }).length,
      urlFetchPerformed: false,
    },
  };
}

module.exports = {
  compareOffers: compareOffers,
  checkJobScam: checkJobScam,
};
