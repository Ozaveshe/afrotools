'use strict';
const fx = require('./reference-fx');
const {FX_MAX_AGE_MS} = require('./reference-feeds');
// Matches the existing crypto live freshness threshold (120 minutes).
const CRYPTO_MAX_AGE_MS = 120 * 60000;
const ASSETS = Object.freeze({BTC_USD:'bitcoin',ETH_USD:'ethereum',USDT_USD:'tether'});
function cryptoResponse(payload,now) {
  const quotes = {}, observations = {};
  for (const [key,asset] of Object.entries(ASSETS)) {
    const row = payload?.schemaVersion === 1 && Object.hasOwn(payload.quotes || {},key) ? payload.quotes[key] : null;
    const observed = fx.timestamp(row?.observed_at), evaluated = fx.timestamp(now);
    const age = observed && evaluated ? Date.parse(evaluated)-Date.parse(observed) : null;
    const source = row?.source === 'coingecko' ? row.source : null;
    const valid = row?.asset === asset && row.currency === 'USD' && source && age !== null && age >= 0 &&
      age <= CRYPTO_MAX_AGE_MS && typeof row.price === 'number' && Number.isFinite(row.price) && row.price > 0;
    quotes[key] = valid ? row.price : null;
    observations[key] = {status:valid ? 'available' : 'unavailable',source,observed_at:observed,
      reason:valid ? null : 'unqualified-crypto-observation'};
  }
  return {quotes,observations};
}
function pairResponse(data,from,to,now) {
  const quote = fx.quotePair(data,from,to,{now,maxAgeMs:FX_MAX_AGE_MS});
  const rounded = quote.rate === null ? null : Math.round(quote.rate*1000000)/1000000;
  if (rounded !== null && (!Number.isFinite(rounded) || rounded <= 0 || rounded > Number.MAX_SAFE_INTEGER)) {
    return {...quote,rate:null,status:'unavailable',reason:'unrepresentable-cross-rate'};
  }
  return {...quote,rate:rounded};
}
function ratesResponse(data,base,now) {
  const rates = {}, qualification = {};
  for (const code of fx.SUPPORTED_CURRENCIES) {
    if (code === base) continue;
    const quote = pairResponse(data,base,code,now);
    rates[code] = quote.rate;
    qualification[code] = {status:quote.status,reason:quote.reason,base:quote.base,target:quote.target};
  }
  return {rates,qualification};
}
module.exports = {CRYPTO_MAX_AGE_MS,cryptoResponse,pairResponse,ratesResponse};
