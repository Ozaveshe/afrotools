(function initReligiousCulturalParity(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.religiousCulturalParity = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createReligiousCulturalParity() {
  'use strict';

  const PRAYER_PRESETS = Object.freeze({
    Nairobi: { fajr: '05:18', sunrise: '06:30', dhuhr: '12:32', asr: '15:51', maghrib: '18:35', isha: '19:42', qibla: 7 },
    Lagos: { fajr: '05:10', sunrise: '06:28', dhuhr: '12:45', asr: '15:58', maghrib: '18:52', isha: '20:03', qibla: 68 },
    Caire: { fajr: '04:02', sunrise: '05:25', dhuhr: '11:53', asr: '15:29', maghrib: '18:21', isha: '19:41', qibla: 136 },
    Accra: { fajr: '04:48', sunrise: '05:58', dhuhr: '12:02', asr: '15:17', maghrib: '18:06', isha: '19:14', qibla: 71 },
    Johannesburg: { fajr: '05:04', sunrise: '06:24', dhuhr: '12:05', asr: '15:14', maghrib: '17:47', isha: '19:01', qibla: 12 },
    Casablanca: { fajr: '04:47', sunrise: '06:21', dhuhr: '13:28', asr: '17:11', maghrib: '20:28', isha: '21:52', qibla: 93 }
  });

  const PROVERBS = Object.freeze({
    Swahili: { text: 'Haraka haraka haina baraka.', context: 'Référence souvent utilisée pour inviter à la patience; formulation et contexte à confirmer.' },
    Yoruba: { text: 'Ọmọ tí a bá gbé sẹ́yìn kò mọ̀ pé ọ̀nà jìn.', context: 'Référence sur le soutien invisible; orthographe, traduction et attribution à confirmer.' },
    Akan: { text: 'Obi nnim a, obi kyere.', context: 'Référence sur l’apprentissage partagé; orthographe, traduction et attribution à confirmer.' },
    Zulu: { text: 'Umuntu ngumuntu ngabantu.', context: 'Référence sur la communauté; formulation, portée et attribution à confirmer.' }
  });

  const AKAN_NAMES = Object.freeze({
    male: Object.freeze(['Kwasi', 'Kwadwo', 'Kwabena', 'Kwaku', 'Yaw', 'Kofi', 'Kwame']),
    female: Object.freeze(['Akosua', 'Adwoa', 'Abena', 'Akua', 'Yaa', 'Afia', 'Ama'])
  });

  const HIJRI_MONTHS = Object.freeze([
    'Mouharram', 'Safar', 'Rabi al-Awwal', 'Rabi ath-Thani', 'Joumada al-Oula', 'Joumada ath-Thania',
    'Rajab', 'Chaabane', 'Ramadan', 'Chawwal', 'Dhou al-Qi’da', 'Dhou al-Hijja'
  ]);

  function failure(code, field) {
    return Object.freeze({ ok: false, code, field: field || null });
  }

  function success(values) {
    return Object.freeze({ ok: true, values: Object.freeze(values) });
  }

  function number(input, field, options) {
    const raw = input[field];
    if (raw === '' || raw === null || typeof raw === 'undefined') throw failure('REQUIRED', field);
    const value = Number(raw);
    if (!Number.isFinite(value)) throw failure('INVALID_NUMBER', field);
    const limits = options || {};
    if (typeof limits.min === 'number' && value < limits.min) throw failure('MIN', field);
    if (typeof limits.max === 'number' && value > limits.max) throw failure('MAX', field);
    if (limits.integer && !Number.isInteger(value)) throw failure('INTEGER', field);
    return value;
  }

  function text(input, field) {
    const value = String(input[field] || '').trim();
    if (!value) throw failure('REQUIRED', field);
    return value;
  }

  function money(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function addMinutes(time, delta) {
    if (!/^\d{2}:\d{2}$/.test(String(time || ''))) throw failure('INVALID_TIME', 'time');
    const parts = time.split(':').map(Number);
    if (parts[0] > 23 || parts[1] > 59) throw failure('INVALID_TIME', 'time');
    const total = ((parts[0] * 60 + parts[1] + delta) % 1440 + 1440) % 1440;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  function parseDate(value, field) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) throw failure('INVALID_DATE', field);
    const date = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw failure('INVALID_DATE', field);
    return date;
  }

  function daysBetween(first, second) {
    return Math.round((second.getTime() - first.getTime()) / 86400000);
  }

  function ageParts(birth, asOf) {
    if (asOf < birth) throw failure('DATE_ORDER', 'asOfDate');
    let years = asOf.getUTCFullYear() - birth.getUTCFullYear();
    let months = asOf.getUTCMonth() - birth.getUTCMonth();
    let days = asOf.getUTCDate() - birth.getUTCDate();
    if (days < 0) {
      months -= 1;
      days += new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), 0)).getUTCDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days };
  }

  function gregorianToJulianDay(year, month, day) {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  function islamicToJulianDay(year, month, day) {
    return day + Math.ceil(29.5 * (month - 1)) + (year - 1) * 354 + Math.floor((3 + 11 * year) / 30) + 1948439 - 1;
  }

  function gregorianToHijri(date, adjustment) {
    const adjusted = new Date(date.getTime() + adjustment * 86400000);
    const jd = gregorianToJulianDay(adjusted.getUTCFullYear(), adjusted.getUTCMonth() + 1, adjusted.getUTCDate());
    const year = Math.floor((30 * (jd - 1948439) + 10646) / 10631);
    let month = Math.min(12, Math.ceil((jd - 29 - islamicToJulianDay(year, 1, 1)) / 29.5) + 1);
    if (month < 1) month = 1;
    const day = jd - islamicToJulianDay(year, month, 1) + 1;
    return { day, month, year, monthName: HIJRI_MONTHS[month - 1] };
  }

  const calculators = Object.freeze({
    giving(input) {
      const reference = number(input, 'reference', { min: 0 });
      const rate = number(input, 'rate', { min: 0, max: 100 });
      const offering = number(input, 'offering', { min: 0 });
      const pledge = number(input, 'pledge', { min: 0 });
      const periods = number(input, 'periods', { min: 1, max: 600, integer: true });
      const essentials = number(input, 'essentials', { min: 0 });
      const percentage = reference * rate / 100;
      const pledgePerPeriod = pledge / periods;
      const total = percentage + offering + pledgePerPeriod;
      return { percentage: money(percentage), offering: money(offering), pledgePerPeriod: money(pledgePerPeriod), total: money(total), remaining: money(reference - essentials - total) };
    },
    lobola(input) {
      const subtotal = number(input, 'familyExpectation', { min: 0 }) + number(input, 'giftValue', { min: 0 }) + number(input, 'ceremonyCost', { min: 0 });
      const buffer = number(input, 'buffer', { min: 0, max: 100 });
      return { subtotal: money(subtotal), bufferAmount: money(subtotal * buffer / 100), total: money(subtotal * (1 + buffer / 100)) };
    },
    meetingChecklist(input) {
      return { familyA: text(input, 'familyA'), familyB: text(input, 'familyB'), pending: text(input, 'pending'), nextStep: text(input, 'nextStep') };
    },
    giftList(input) {
      const items = [1, 2, 3].map((index) => ({ item: text(input, `item${index}`), value: number(input, `value${index}`, { min: 0 }) }));
      return { items, total: money(items.reduce((sum, item) => sum + item.value, 0)) };
    },
    proverb(input) {
      const culture = text(input, 'culture');
      const entry = PROVERBS[culture];
      if (!entry) throw failure('UNSUPPORTED', 'culture');
      return { culture, purpose: text(input, 'purpose'), verification: text(input, 'verification'), text: entry.text, context: entry.context };
    },
    zakat(input) {
      const cash = number(input, 'cash', { min: 0 });
      const goldValue = number(input, 'goldGrams', { min: 0 }) * number(input, 'goldPrice', { min: 0 });
      const silverValue = number(input, 'silverGrams', { min: 0 }) * number(input, 'silverPrice', { min: 0 });
      const netAssets = Math.max(0, cash + goldValue + silverValue + number(input, 'inventory', { min: 0 }) + number(input, 'investments', { min: 0 }) + number(input, 'receivables', { min: 0 }) - number(input, 'debts', { min: 0 }));
      const basis = text(input, 'nisabBasis');
      const nisab = basis === 'gold' ? 85 * number(input, 'goldPrice', { min: 0 }) : 595 * number(input, 'silverPrice', { min: 0 });
      if (!(nisab > 0)) throw failure('ZERO_THRESHOLD', basis === 'gold' ? 'goldPrice' : 'silverPrice');
      return { netAssets: money(netAssets), nisab: money(nisab), eligible: netAssets >= nisab, zakat: netAssets >= nisab ? money(netAssets * 0.025) : 0 };
    },
    prayer(input) {
      const city = text(input, 'city');
      const preset = PRAYER_PRESETS[city];
      if (!preset) throw failure('UNSUPPORTED', 'city');
      parseDate(input.date, 'date');
      return Object.assign({ city, method: text(input, 'method'), date: input.date }, preset);
    },
    ramadan(input) {
      parseDate(input.startDate, 'startDate');
      const days = number(input, 'days', { min: 1, max: 30, integer: true });
      const suhoorBuffer = number(input, 'suhoorBuffer', { min: 0, max: 120, integer: true });
      const iftarBuffer = number(input, 'iftarBuffer', { min: 0, max: 120, integer: true });
      return { startDate: input.startDate, days, suhoor: addMinutes(text(input, 'fajr'), -suhoorBuffer), iftar: addMinutes(text(input, 'maghrib'), iftarBuffer) };
    },
    faraid(input) {
      const estate = number(input, 'estate', { min: 0 });
      const deductions = number(input, 'debts', { min: 0 }) + number(input, 'funeral', { min: 0 }) + number(input, 'bequest', { min: 0 });
      if (deductions > estate) throw failure('DEDUCTIONS_EXCEED_ESTATE', 'debts');
      const net = estate - deductions;
      const sons = number(input, 'sons', { min: 0, max: 20, integer: true });
      const daughters = number(input, 'daughters', { min: 0, max: 20, integer: true });
      if (sons + daughters === 0) throw failure('LIMITED_CASE_CHILD_REQUIRED', 'sons');
      const spouse = text(input, 'spouse');
      const spouseFraction = spouse === 'wife' ? 1 / 8 : spouse === 'husband' ? 1 / 4 : 0;
      const spouseShare = net * spouseFraction;
      const residue = net - spouseShare;
      const units = sons * 2 + daughters;
      const unitShare = residue / units;
      return { net: money(net), spouseShare: money(spouseShare), residue: money(residue), sonShare: sons ? money(unitShare * 2) : 0, daughterShare: daughters ? money(unitShare) : 0 };
    },
    travelBudget(input) {
      const travelers = number(input, 'travelers', { min: 1, max: 20, integer: true });
      const days = number(input, 'days', { min: 1, max: 120, integer: true });
      const basePerTraveler = number(input, 'packageCost', { min: 0 }) + number(input, 'flightCost', { min: 0 }) + number(input, 'visaCost', { min: 0 }) + number(input, 'dailySpend', { min: 0 }) * days + number(input, 'localTransport', { min: 0 });
      const subtotal = basePerTraveler * travelers;
      const buffer = number(input, 'buffer', { min: 0, max: 100 });
      return { subtotal: money(subtotal), bufferAmount: money(subtotal * buffer / 100), total: money(subtotal * (1 + buffer / 100)) };
    },
    islamicFinance(input) {
      const assetPrice = number(input, 'assetPrice', { min: 0 });
      const deposit = number(input, 'deposit', { min: 0 });
      if (deposit > assetPrice) throw failure('DEPOSIT_EXCEEDS_PRICE', 'deposit');
      const financed = assetPrice - deposit;
      const markup = financed * number(input, 'margin', { min: 0, max: 100 }) / 100;
      const fees = number(input, 'fees', { min: 0 });
      const months = number(input, 'termMonths', { min: 1, max: 600, integer: true });
      return { financed: money(financed), markup: money(markup), monthly: money((financed + markup + fees) / months), total: money(deposit + financed + markup + fees) };
    },
    wedding(input) {
      const subtotal = number(input, 'guests', { min: 0, max: 100000, integer: true }) * number(input, 'foodPerGuest', { min: 0 }) + number(input, 'venue', { min: 0 }) + number(input, 'attire', { min: 0 }) + number(input, 'services', { min: 0 });
      const buffer = number(input, 'buffer', { min: 0, max: 100 });
      return { subtotal: money(subtotal), bufferAmount: money(subtotal * buffer / 100), total: money(subtotal * (1 + buffer / 100)) };
    },
    naming(input) {
      const subtotal = number(input, 'guests', { min: 0, max: 100000, integer: true }) * number(input, 'foodPerGuest', { min: 0 }) + number(input, 'venue', { min: 0 }) + number(input, 'gifts', { min: 0 }) + number(input, 'officiant', { min: 0 }) + number(input, 'logistics', { min: 0 });
      const buffer = number(input, 'buffer', { min: 0, max: 100 });
      return { subtotal: money(subtotal), bufferAmount: money(subtotal * buffer / 100), total: money(subtotal * (1 + buffer / 100)) };
    },
    funeral(input) {
      const subtotal = number(input, 'guests', { min: 0, max: 100000, integer: true }) * number(input, 'foodPerGuest', { min: 0 }) + number(input, 'mortuary', { min: 0 }) + number(input, 'burial', { min: 0 }) + number(input, 'transport', { min: 0 }) + number(input, 'remembrance', { min: 0 });
      const buffer = number(input, 'buffer', { min: 0, max: 100 });
      return { hospitality: money(number(input, 'guests', { min: 0 }) * number(input, 'foodPerGuest', { min: 0 })), subtotal: money(subtotal), total: money(subtotal * (1 + buffer / 100)) };
    },
    nameReview(input) {
      return { candidate: text(input, 'candidate'), culture: text(input, 'culture'), reportedMeaning: text(input, 'meaning'), reviewer: text(input, 'reviewer'), status: 'family-review-needed' };
    },
    traditionalCalendar(input) {
      const date = parseDate(input.date, 'date');
      const referenceDate = parseDate(input.referenceDate, 'referenceDate');
      const referenceIndex = number(input, 'referenceIndex', { min: 0, max: 3, integer: true });
      const cycle = ['Eke', 'Orie', 'Afo', 'Nkwo'];
      const offset = ((daysBetween(referenceDate, date) + referenceIndex) % 4 + 4) % 4;
      return { date: input.date, referenceDate: input.referenceDate, marketDay: cycle[offset], localAuthority: text(input, 'localAuthority') };
    },
    ageNameDay(input) {
      const birth = parseDate(input.birthDate, 'birthDate');
      const asOf = parseDate(input.asOfDate, 'asOfDate');
      const parts = ageParts(birth, asOf);
      const weekdayIndex = birth.getUTCDay();
      const weekdays = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const gender = text(input, 'gender');
      if (!AKAN_NAMES[gender]) throw failure('UNSUPPORTED', 'gender');
      return Object.assign(parts, { weekday: weekdays[weekdayIndex], name: AKAN_NAMES[gender][weekdayIndex], totalDays: daysBetween(birth, asOf) });
    },
    festival(input) {
      parseDate(input.provisionalDate, 'provisionalDate');
      return { festival: text(input, 'festival'), country: text(input, 'country'), provisionalDate: input.provisionalDate, organizer: text(input, 'organizer'), respectNote: text(input, 'respectNote'), nextAction: 'confirm-exact-date' };
    },
    asoEbi(input) {
      const people = number(input, 'people', { min: 1, max: 100000, integer: true });
      const subtotal = people * (number(input, 'fabricYards', { min: 0 }) * number(input, 'fabricPrice', { min: 0 }) + number(input, 'tailoring', { min: 0 }) + number(input, 'accessories', { min: 0 })) + number(input, 'delivery', { min: 0 });
      const discount = number(input, 'discount', { min: 0, max: 100 });
      return { subtotal: money(subtotal), discountAmount: money(subtotal * discount / 100), total: money(subtotal * (1 - discount / 100)) };
    },
    attire(input) {
      const quantity = number(input, 'quantity', { min: 1, max: 100000, integer: true });
      const total = quantity * (number(input, 'fabricCost', { min: 0 }) + number(input, 'tailoringCost', { min: 0 }) + number(input, 'accessories', { min: 0 })) + number(input, 'rushFee', { min: 0 });
      return { quantity, total: money(total) };
    },
    halalReadiness(input) {
      const fields = ['ingredients', 'suppliers', 'storage', 'cleaning', 'labels'];
      const answers = fields.map((field) => text(input, field));
      if (answers.some((answer) => !['yes', 'no', 'unknown'].includes(answer))) throw failure('UNSUPPORTED', 'ingredients');
      return { documented: answers.filter((answer) => answer === 'yes').length, missing: answers.filter((answer) => answer === 'no').length, followUps: answers.filter((answer) => answer !== 'yes').length, totalChecks: fields.length, authority: text(input, 'authority'), certification: false };
    },
    islamicCalendar(input) {
      const date = parseDate(input.date, 'date');
      const adjustment = number(input, 'adjustment', { min: -2, max: 2, integer: true });
      const hijri = gregorianToHijri(date, adjustment);
      const gregorian = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
      return { gregorian, hijriDay: hijri.day, hijriMonth: hijri.month, hijriMonthName: hijri.monthName, hijriYear: hijri.year, adjustment, boundary: 'tabular-estimate' };
    }
  });

  function calculate(engine, input) {
    const calculator = calculators[engine];
    if (!calculator) return failure('UNKNOWN_ENGINE', 'engine');
    try {
      return success(calculator(Object.assign({}, input)));
    } catch (error) {
      if (error && error.ok === false) return error;
      return failure('CALCULATION_ERROR', null);
    }
  }

  return Object.freeze({
    calculate,
    calculators: Object.freeze(Object.keys(calculators)),
    fixtures: Object.freeze({
      prayerPresets: PRAYER_PRESETS,
      proverbs: PROVERBS,
      akanNames: AKAN_NAMES
    })
  });
});
