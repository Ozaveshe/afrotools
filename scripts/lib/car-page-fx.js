function createFxSnapshot(snapshot) {
  const valid = snapshot && snapshot.base === "USD"
    && typeof snapshot.timestamp === "string" && Number.isFinite(Date.parse(snapshot.timestamp))
    && typeof snapshot.source === "string" && snapshot.source.length > 0;
  const rates = valid ? Object.fromEntries(Object.entries(snapshot.rates || {})
    .filter(([code, rate]) => /^[A-Z]{3}$/.test(code) && Number.isFinite(rate) && rate > 0)) : {};
  function rateFor(currency) {
    if (!valid) return null;
    return currency === "USD" ? 1 : rates[currency] || null;
  }
  return {
    rates,
    timestamp: valid ? snapshot.timestamp : "",
    source: valid ? snapshot.source : "",
    rateFor,
    convert(valueUsd, currency) {
      const rate = rateFor(currency);
      return rate != null && Number.isFinite(valueUsd) ? valueUsd * rate : null;
    }
  };
}
module.exports = { createFxSnapshot };
