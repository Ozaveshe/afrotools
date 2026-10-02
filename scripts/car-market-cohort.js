// Comparable price groups use reviewed market, trim and engine facts.
// Normalization changes case/spacing only; it never guesses trim aliases.
const unknownLabels = ['unknown', 'unspecified', 'other', 'n/a', 'na', 'not specified', 'not provided'];

function label(value, name) {
  if (typeof value !== 'string' || value.length > 120 || /[<>\u0000-\u001f]/.test(value)) throw Error('Missing or unknown ' + name);
  const normalized = value.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalized || unknownLabels.includes(normalized)) throw Error('Missing or unknown ' + name);
  return normalized;
}

function cohort({ market, trim_label, engine_cc }) {
  const marketKey = label(market, 'market'), trimKey = label(trim_label, 'trim label');
  if (!Number.isSafeInteger(engine_cc) || engine_cc < 100 || engine_cc > 12000) throw Error('Missing or invalid engine displacement');
  return { key: JSON.stringify([marketKey, trimKey, engine_cc]), market: market.trim(), trimLabel: trim_label.trim(), engineCc: engine_cc };
}

function labelSql(column) {
  if (!/^[a-z_][a-z_0-9.]*$/.test(column)) throw Error('Invalid SQL column');
  return "lower(regexp_replace(btrim(" + column + "), '[[:space:]]+', ' ', 'g'))";
}

module.exports = { cohort, labelSql, unknownLabels };
