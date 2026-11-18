const paths = {
  'ethiopia/et-paye': ['Éthiopie', 'ETB'],
  'sierra-leone/sl-paye': ['Sierra Leone', 'SLE']
};

// This function is embedded in the two localized calculator pages.
async function shareFrenchResult(country, currency, url) {
  if (!RESULT) {
    document.getElementById('grossSalary').focus();
    return;
  }
  const status = document.getElementById('shareResultStatus');
  status.textContent = '';
  const annual = PERIOD === 'annual';
  const period = annual ? 'annuel' : 'mensuel';
  const money = value => Math.round(value).toLocaleString('fr-FR') + ' ' + currency;
  const title = 'Simulation de salaire — ' + country;
  const gross = annual ? RESULT.gross * 12 : RESULT.gross;
  const net = annual ? RESULT.annualNet : RESULT.netMonthly;
  const tax = annual ? RESULT.annualTax : RESULT.monthlyPAYE;
  const rate = RESULT.effectiveRate.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 2 });
  const text = [title, 'Salaire brut ' + period + ' : ' + money(gross),
    'Salaire net ' + period + ' : ' + money(net), 'PAYE ' + period + ' : ' + money(tax),
    'Taux effectif : ' + rate].join('\n');
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (error) {
      if (error.name === 'AbortError') return;
    }
  }
  const copy = text + '\n' + url;
  try {
    await navigator.clipboard.writeText(copy);
    status.textContent = 'Résultat copié.';
  } catch {
    window.prompt('Copiez le résultat de la simulation.', copy);
  }
}

function refreshFrenchSalarySharing(html, route) {
  if (!Object.hasOwn(paths, route)) return html;
  const [country, currency] = paths[route];
  const args = [country, currency, 'https://afrotools.com/fr/' + route].map(value => JSON.stringify(value)).join(', ');
  const handler = 'function shareResult() {\n  return shareFrenchResult(' + args + ');\n}\n\n' + shareFrenchResult.toString();
  const pattern = /function shareResult\(\) \{[\s\S]*?\n\}(?:\s*async function shareFrenchResult\([^)]*\) \{[\s\S]*?\n\})?/;
  if (!pattern.test(html)) throw new Error('Missing share action on ' + route);
  let result = html.replace(pattern, () => handler);
  if (!result.includes('id="shareResultStatus"')) {
    result = result.replace(/(<button\b[^>]*class="[^"]*\bact-share\b[^"]*"[\s\S]*?<\/button>)/, '$1<span id="shareResultStatus" role="status"></span>');
  }
  if (route === 'ethiopia/et-paye') {
    result = result.replace(/`(?:Brut annuel|Annual Gross) Salary\$\{lbl\}`/, "isAnnual ? 'Salaire brut annuel' : 'Salaire brut mensuel'")
      .replace('Pension Fund (' + '$' + '{pct(R.pensionRate)})', 'Cotisation de retraite du salarié (' + '$' + '{R.pensionRate.toLocaleString(\'fr-FR\', { style: \'percent\' })})');
  }
  return result;
}

module.exports = { refreshFrenchSalarySharing };

