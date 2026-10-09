'use strict';

// Pure reference conversion. Provider observations and reference-price review are separate.
// These are the exact provider identifiers and currency set owned by the native
// forex collector. Registration is not a claim of official rate authority.
const REGISTERED_PROVIDERS = Object.freeze(['exchangerate-api', 'frankfurter', 'fawazahmed']);
const SUPPORTED_CURRENCIES = Object.freeze([
  'USD', 'NGN', 'KES', 'ZAR', 'GHS', 'EGP', 'TZS', 'UGX', 'RWF', 'ETB',
  'XOF', 'XAF', 'MAD', 'TND', 'DZD', 'LYD', 'SDG', 'SSP', 'MZN', 'MGA',
  'ZMW', 'ZWL', 'MWK', 'BWP', 'NAD', 'LSL', 'SZL', 'MUR', 'SCR', 'DJF',
  'KMF', 'ERN', 'SOS', 'BIF', 'GMD', 'GNF', 'LRD', 'SLE', 'CVE', 'STN',
  'MRU', 'AOA', 'CDF', 'EUR', 'GBP', 'CNY', 'AED', 'INR', 'CAD', 'AUD', 'JPY'
]);
const registeredProviders = new Set(REGISTERED_PROVIDERS);
const supportedCurrencies = new Set(SUPPORTED_CURRENCIES);
function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const calendar = new Date(value.slice(0, 10) + 'T00:00:00Z');
  if (!Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== value.slice(0, 10)) return null;
  const hours = Number(value.slice(11, 13)), minutes = Number(value.slice(14, 16)), seconds = Number(value.slice(17, 19));
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  const result = Date.parse(value);
  return Number.isFinite(result) ? new Date(result).toISOString() : null;
}

function unavailable(reason, observedAt = null, source = null) {
  return { status: 'unavailable', rate: null, observed_at: observedAt, source, reason };
}

function quoteUsdToLocal(snapshot, currency, options) {
  const source = registeredProviders.has(snapshot?.source) ? snapshot.source : null;
  const retained = Array.isArray(snapshot?.retained_rate_codes) && snapshot.retained_rate_codes.includes(currency);
  const retainedObservation = retained && snapshot.rate_observations && Object.hasOwn(snapshot.rate_observations, currency)
    ? snapshot.rate_observations[currency] : null;
  // Even an early snapshot/age rejection must not attribute a retained rate to
  // the latest collection. Preserve only its own known observation metadata.
  const fail = (reason, observedAt = null) => retained
    ? unavailable(reason, timestamp(retainedObservation?.observed_at),
      registeredProviders.has(retainedObservation?.source) ? retainedObservation.source : null)
    : unavailable(reason, observedAt, source);
  if (!options || !Number.isFinite(options.maxAgeMs) || options.maxAgeMs <= 0) return fail('invalid-age-policy');
  const now = timestamp(options.now);
  if (!now) return fail('invalid-evaluation-time');
  if (!supportedCurrencies.has(currency)) return fail('invalid-currency');
  if (!snapshot || snapshot.schemaVersion !== 1) return fail('unsupported-fx-schema');
  if (snapshot.base !== 'USD') return fail('wrong-fx-base');
  if (typeof snapshot.source !== 'string' || !snapshot.source.trim()) return fail('missing-fx-source');
  if (!source) return fail('unregistered-fx-source');
  const observed = timestamp(snapshot.timestamp);
  if (!observed) return fail('invalid-fx-observation');
  const age = Date.parse(now) - Date.parse(observed);
  if (age < 0) return fail('future-fx-observation', observed);
  if (age > options.maxAgeMs) return fail('expired-fx-observation', observed);
  // Native snapshots identify retained values. A snapshot timestamp cannot
  // independently date one of those values. Do not infer per-currency dates.
  if (snapshot.retained_rate_codes === undefined) return fail('missing-retained-rate-metadata', observed);
  if (!Array.isArray(snapshot.retained_rate_codes) || snapshot.retained_rate_codes.some(code => !supportedCurrencies.has(code))) {
    return fail('invalid-retained-rate-metadata', observed);
  }
  if (snapshot.retained_rate_codes.includes(currency)) {
    const prior = retainedObservation;
    if (!prior || prior.rate !== snapshot.rates?.[currency]) return unavailable('retained-rate-unverified',
      timestamp(prior?.observed_at), registeredProviders.has(prior?.source) ? prior.source : null);
    // A retained rate is usable only with its own original observation. Never
    // inherit the new snapshot's provider or date for a retained value.
    return quoteUsdToLocal({schemaVersion:1, base:'USD', source:prior.source,
      timestamp:prior.observed_at, rates:{[currency]:prior.rate}, retained_rate_codes:[]}, currency, options);
  }
  const rate = currency === 'USD' ? 1 : snapshot.rates && Object.hasOwn(snapshot.rates, currency) ? snapshot.rates[currency] : null;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return fail('invalid-fx-rate', observed);
  return { status: 'available', rate, observed_at: observed, source, reason: null };
}

function convertReferenceAmount(amount, currency, snapshot, options) {
  const fx = quoteUsdToLocal(snapshot, currency, options);
  const originalValid = typeof amount === 'number' && Number.isFinite(amount) && amount >= 0 && amount <= Number.MAX_SAFE_INTEGER;
  const reference = originalValid ? amount : null;
  const fail = reason => ({ reference_amount: reference, converted_amount: null, status: 'unavailable', reason, conversion: fx });
  if (!originalValid) return fail('invalid-reference-amount');
  if (!['usd-to-local', 'local-to-usd'].includes(options?.direction)) return fail('invalid-direction');
  const decimals = options?.decimals;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 6) return fail('invalid-rounding-policy');
  if (fx.status !== 'available') return fail(fx.reason);
  const [amountN, amountD] = decimalFraction(amount);
  const [rateN, rateD] = decimalFraction(fx.rate);
  const numerator = options.direction === 'usd-to-local' ? amountN * rateN : amountN * rateD;
  const denominator = options.direction === 'usd-to-local' ? amountD * rateD : amountD * rateN;
  const scaled = numerator * (10n ** BigInt(decimals));
  // Nonnegative decimal amounts use explicit half-up rounding; BigInt avoids
  // binary midpoint errors (for example 100.5 / 100 -> 1.005 -> 1.01).
  const rounded = scaled / denominator + (2n * (scaled % denominator) >= denominator ? 1n : 0n);
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER)) return fail('unsafe-converted-amount');
  const converted = Number(rounded) / (10 ** decimals);
  const [outputN, outputD] = decimalFraction(converted);
  if (outputN * (10n ** BigInt(decimals)) !== rounded * outputD) return fail('converted-precision-loss');
  return { reference_amount: reference, converted_amount: converted, status: 'available', reason: null, conversion: fx };
}

// Treat the canonical JSON-number decimal spelling as the input amount/rate.
// This cannot recover precision already lost before the caller supplied a Number.
function decimalFraction(value) {
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/.exec(String(value));
  const fractional = match[2] || '';
  const exponent = Number(match[3] || 0) - fractional.length;
  const digits = BigInt(match[1] + fractional);
  return exponent >= 0 ? [digits * (10n ** BigInt(exponent)), 1n] : [digits, 10n ** BigInt(-exponent)];
}

// Receipts bind qualification to one currency; read paths recheck age. Older
// conversion objects without this contract cannot be silently upgraded.
function conversionReceipt(snapshot, currency, options) {
  return {...quoteUsdToLocal(snapshot, currency, options), qualification_version:1, base:'USD', currency};
}

function receiptSnapshot(receipt, currency) {
  if (!receipt || receipt.qualification_version !== 1 || receipt.base !== 'USD' ||
      receipt.currency !== currency || receipt.status !== 'available' || receipt.reason !== null) return null;
  return {schemaVersion:1, base:'USD', source:receipt.source, timestamp:receipt.observed_at,
    rates:{[currency]:receipt.rate}, retained_rate_codes:[]};
}

function revalidateReceipt(receipt, currency, options) {
  if (receipt?.qualification_version === 1 && receipt.base === 'USD' && receipt.currency === currency &&
      receipt.status === 'unavailable') {
    const reasons = ['invalid-age-policy','invalid-evaluation-time','invalid-currency','unsupported-fx-schema',
      'wrong-fx-base','missing-fx-source','unregistered-fx-source','invalid-fx-observation','future-fx-observation',
      'expired-fx-observation','missing-retained-rate-metadata','invalid-retained-rate-metadata','retained-rate-unverified','invalid-fx-rate'];
    return {...unavailable(reasons.includes(receipt.reason) ? receipt.reason : 'unqualified-conversion-receipt',
      timestamp(receipt.observed_at),registeredProviders.has(receipt.source) ? receipt.source : null),
      qualification_version:1,base:'USD',currency};
  }
  return conversionReceipt(receiptSnapshot(receipt,currency),currency,options);
}

function quotePair(snapshot, from, to, options) {
  const base = quoteUsdToLocal(snapshot, from, options);
  const target = quoteUsdToLocal(snapshot, to, options);
  const rate = base.status === 'available' && target.status === 'available' ? target.rate / base.rate : null;
  const valid = typeof rate === 'number' && Number.isFinite(rate) && rate > 0;
  return {status:valid ? 'available' : 'unavailable', rate:valid ? rate : null,
    reason:base.reason || target.reason || (valid ? null : 'invalid-cross-rate'), base, target};
}

module.exports = { timestamp, quoteUsdToLocal, convertReferenceAmount, conversionReceipt, receiptSnapshot, revalidateReceipt,
  quotePair, REGISTERED_PROVIDERS, SUPPORTED_CURRENCIES };
