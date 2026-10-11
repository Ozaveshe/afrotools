'use strict';
const freshness = require('./ai-tool-context-freshness.generated.js');
const FX_KEYS = new Set(['currency-converter', 'convertisseur-devises-fr', 'zana-kibadilishaji-sarafu-sw']);
const FALLBACK = 'The committed foreign-exchange snapshot is unavailable or outside its permitted freshness window. Do not quote or infer any exchange rate. Route the user to the currency converter to enter a current provider rate. Ask them to confirm fees and the executable payout with their provider. Do not request or transmit their amount.';
function guardForexContext(tool, context, now = Date.now(), records = freshness) {
  if (!FX_KEYS.has(tool)) return context;
  const record = records && Object.prototype.hasOwnProperty.call(records, tool) ? records[tool] : null;
  const asOf = record && typeof record.asOf === 'string' ? Date.parse(record.asOf) : NaN;
  const ageDays = Math.floor((now - asOf) / 86400000);
  if (!Number.isFinite(now) || !Number.isFinite(asOf) || record.maxAgeDays !== 7 || ageDays < 0 || ageDays > 7) return FALLBACK;
  return context;
}
module.exports = { guardForexContext };
