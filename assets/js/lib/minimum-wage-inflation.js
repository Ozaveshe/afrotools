(function (global) {
  'use strict';
  function summarize(series) {
    if (!series || !Array.isArray(series.points) || series.points.length < 2) return null;
    const first = series.points[0], last = series.points[series.points.length - 1];
    if (![first.nominal, first.cpi, last.nominal, last.cpi].every(Number.isFinite) || first.nominal <= 0 || first.cpi <= 0 || last.cpi <= 0 || last.nominal < 0) return null;
    const real = last.nominal * first.cpi / last.cpi;
    const change = (real / first.nominal - 1) * 100;
    return { firstYear:first.year, lastYear:last.year, nominal:last.nominal, real, change, direction:Math.abs(change) < 1e-9 ? 'unchanged' : change > 0 ? 'gain' : 'loss' };
  }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.minimumWageInflation = { summarize };
  if (!global.document || typeof global.renderInflationChart !== 'function') return;
  const original = global.renderInflationChart;
  global.renderInflationChart = function (series, country) {
    original(series, country);
    const target = document.getElementById('r-inflation-stat');
    if (!target) return;
    const sw = document.documentElement.lang === 'sw', result = summarize(series);
    if (!result) { target.textContent = sw ? 'Hakuna mfululizo halali wa kulinganisha nguvu ya manunuzi.' : 'No valid series is available for a purchasing-power comparison.'; return; }
    const fmt = value => new Intl.NumberFormat(sw ? 'sw' : 'en', {maximumFractionDigits:2}).format(value);
    const change = result.direction === 'unchanged' ? (sw ? 'hakuna mabadiliko ya nguvu ya manunuzi' : 'no change in purchasing power') : (sw ? (result.direction === 'gain' ? 'ongezeko la nguvu ya manunuzi la ' : 'upungufu wa nguvu ya manunuzi wa ') : (result.direction === 'gain' ? 'a purchasing-power gain of ' : 'a purchasing-power loss of ')) + fmt(Math.abs(result.change)) + '%';
    target.textContent = sw ? 'Rekodi ya ' + result.lastYear + ': ' + fmt(result.nominal) + ' ' + country.currency + ', sawa na ' + fmt(result.real) + ' kwa bei za ' + result.firstYear + ' — ' + change + ' ikilinganishwa na ' + result.firstYear + '. Chanzo na tarehe ya uhakiki wa CPI havijaainishwa katika mfululizo huu. Huu ni ulinganisho wa rekodi zilizopo, si kipimo kilichothibitishwa cha gharama za maisha za sasa.' : 'Recorded observation for ' + result.lastYear + ': ' + fmt(result.nominal) + ' ' + country.currency + ', equivalent to ' + fmt(result.real) + ' at ' + result.firstYear + ' prices — ' + change + ' compared with ' + result.firstYear + '. CPI source and verification date are not specified for this series. This compares the stored observations, not verified current living costs.';
  };
})(typeof window !== 'undefined' ? window : globalThis);
