(function (root, factory) {
  'use strict';
  const engine = typeof module === 'object' && module.exports
    ? require('../../../tools/nysc-allowance/nysc-budget-engine.js')
    : root.AfroTools && root.AfroTools.nyscBudgetEngine;
  const api = factory(engine);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root.document) api.mount(root.document, root);
})(typeof window !== 'undefined' ? window : globalThis, function (engine) {
  'use strict';
  const fields = {
    planMonths: ['Iye oṣù nínú ètò', 1, 12],
    federalMonthly: ['Aláwùsì ìjọba àpapọ̀ lóṣù', 0, 10000000],
    federalMonths: ['Oṣù tí àpapọ̀ yóò san', 0, 12],
    stateMonthly: ['Ìrànwọ́ ìpínlẹ̀ lóṣù', 0, 10000000],
    stateMonths: ['Oṣù tí ìpínlẹ̀ yóò san', 0, 12],
    ppaMonthly: ['Ìrànwọ́ PPA lóṣù', 0, 10000000],
    ppaMonths: ['Oṣù tí PPA yóò san', 0, 12],
    otherMonthly: ['Owó mìíràn lóṣù', 0, 10000000],
    otherMonths: ['Oṣù tí owó mìíràn yóò wọlé', 0, 12],
    oneTimeIncome: ['Owó tí yóò wọlé lẹ́ẹ̀kan', 0, 100000000],
    housingMonthly: ['Owó ilé lóṣù', 0, 10000000],
    foodMonthly: ['Owó oúnjẹ lóṣù', 0, 10000000],
    transportMonthly: ['Owó ìrìnàjò lóṣù', 0, 10000000],
    dataMonthly: ['Owó fóònù àti dátà lóṣù', 0, 10000000],
    otherCostMonthly: ['Ìnáwó pàtàkì mìíràn lóṣù', 0, 10000000],
    oneTimeCosts: ['Ìnáwó ìbẹ̀rẹ̀ lẹ́ẹ̀kan', 0, 100000000]
  };
  const costKeys = ['housingMonthly', 'foodMonthly', 'transportMonthly', 'dataMonthly', 'otherCostMonthly', 'oneTimeCosts'];
  const monthKeys = ['planMonths', 'federalMonths', 'stateMonths', 'ppaMonths', 'otherMonths'];
  const sourceUrl = 'https://yid.fmyd.gov.ng/nysc-monthly-allowance-increased-to-%E2%82%A677000-a-milestone-in-youth-empowerment/';
  const limitation = 'Èyí jẹ́ ètò ìṣúná, kì í ṣe ìlérí owó, ọjọ́ ìsanwó, owó àfikún tí kò tíì dé tàbí ìjẹ́rìí pé o lẹ́tọ̀ọ́ sí owó. Jẹ́rìí iye àti oṣù kọ̀ọ̀kan pẹ̀lú NYSC, ìpínlẹ̀ tàbí PPA tó yẹ.';
  const money = value => new Intl.NumberFormat('yo-NG', {style: 'currency', currency: 'NGN', maximumFractionDigits: 0}).format(value).replace(/\u00a0/g, ' ');
  const label = key => fields[key][0];

  function calculate(input, badInput = {}) {
    const normalized = {};
    for (const [key, spec] of Object.entries(fields)) {
      const raw = input[key] == null ? '' : String(input[key]).trim();
      normalized[key] = raw;
      if (badInput[key]) return {valid: false, field: key, error: `${spec[0]}: tẹ nọ́ńbà tó péye síbí.`};
      if (!raw && monthKeys.includes(key)) return {valid: false, field: key, error: `${spec[0]}: tẹ iye oṣù síbí.`};
      // Blank money inputs retain the maintained engine's semantics: zero income,
      // but a blank cost is unconfirmed and keeps the result provisional.
      if (!raw) continue;
      const value = Number(raw);
      if (!/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw) || !Number.isFinite(value) || !Number.isInteger(value) || value < spec[1] || value > spec[2]) {
        return {valid: false, field: key, error: `${spec[0]}: tẹ odidi nọ́ńbà láti ${spec[1].toLocaleString('yo-NG')} sí ${spec[2].toLocaleString('yo-NG')}; má fi àmì owó tàbí kọ́mà kún un.`};
      }
    }
    for (const key of monthKeys.slice(1)) {
      if (Number(input[key]) > Number(input.planMonths)) return {valid: false, field: key, error: `${label(key)}: kò gbọdọ̀ ju iye oṣù nínú ètò lọ.`};
    }
    if (!engine) return {valid: false, error: 'Ẹ̀rọ ìṣirò kò tíì ṣí. Tún ojú-ìwé ṣí; má ṣe lo àbájáde àtijọ́.'};
    const result = engine.calculate(normalized);
    return result.valid ? result : {valid: false, error: 'Ṣàyẹ̀wò iye owó àti oṣù tí o tẹ, kí o sì tún ṣe ìṣirò.'};
  }

  function makeReport(result, context) {
    if (!result || !result.valid) return '';
    const lines = ['Ètò ìṣúná iṣẹ́ NYSC — AfroTools', `Orúkọ ètò: ${context.planName || 'A kò sọ orúkọ'}`, `Àkókò ètò: oṣù ${result.planMonths}`, `Ọjọ́ tí o jẹ́rìí àwọn iye: ${context.checkedOn || 'A kò tẹ ọjọ́'}`, `Àkọsílẹ̀ orísun ìpínlẹ̀ / PPA: ${context.sourceNotes || 'A kò tẹ àkọsílẹ̀'}`, '', 'Àwọn iye tí o tẹ (náírà)'];
    for (const key of Object.keys(fields)) lines.push(`${label(key)}: ${costKeys.includes(key) && result.missingCosts.includes(key) ? 'A kò tíì jẹ́rìí iye yìí' : monthKeys.includes(key) ? result[key] : money(result[key])}`);
    lines.push('', 'Àpapọ̀ owó tí a ń retí', `Ìjọba àpapọ̀: ${money(result.federalTotal)}`, `Ìpínlẹ̀: ${money(result.stateTotal)}`, `PPA: ${money(result.ppaTotal)}`, `Owó mìíràn àti owó ẹ̀ẹ̀kan: ${money(result.otherTotal)}`, `Àpapọ̀ owó wọlé: ${money(result.totalIncome)}`, '', 'Ètò ìnáwó', `Ìnáwó pàtàkì lóṣù: ${money(result.monthlyEssentials)}`, `Àpapọ̀ ìnáwó tí o tẹ: ${money(result.totalCosts)}`, `${result.budgetComplete ? result.remainder < 0 ? 'Àìpé tí ètò fi hàn' : 'Ìyókù tí ètò fi hàn' : 'Ìyàtọ̀ àkọ́kọ́; ìnáwó kò tíì pé'}: ${money(result.budgetComplete ? Math.abs(result.remainder) : result.remainder)}`);
    lines.push(result.budgetComplete ? 'O ti jẹ́rìí gbogbo ààyè ìnáwó, pẹ̀lú 0 níbi tí kò ti kan ọ.' : `Àwọn ìnáwó tí kò tíì pé: ${result.missingCosts.map(label).join('; ')}. Tẹ 0 bí kò bá sí ìnáwó náà.`);
    lines.push('', 'Orísun àti ààlà', 'Ìkéde àpapọ̀: 25 Oṣù Kẹta 2025; ₦77,000 bẹ̀rẹ̀ láti Oṣù Kẹta 2025. Èyí kì í jẹ́rìí ìsanwó rẹ lónìí.', sourceUrl, limitation, '', 'Àṣírí: a ṣe ètò yìí nínú aṣàwákiri rẹ. A kò fi ohun tí o tẹ sínú àdírẹ́sì ojú-ìwé tàbí rán an sí ẹ̀rọ ìpamọ́ lórí ayélujára.');
    return lines.join('\n');
  }

  function mount(doc, win) {
    const id = key => doc.getElementById(key), form = id('nyscBudgetForm');
    if (!form) return;
    let current = null, context = null, revision = 0;
    function clearErrors() {
      id('nyscError').textContent = '';
      for (const key of Object.keys(fields)) { id(key).removeAttribute('aria-invalid'); id(key).setAttribute('aria-describedby', 'amountHelp'); }
    }
    function invalidate() {
      revision++; current = null; context = null; id('nyscResults').hidden = true; id('nyscPrintWorksheet').textContent = '';
      clearErrors(); id('exportStatus').textContent = 'Àwọn iye ti yí padà. Tún ṣe ìṣirò kí o tó ṣe ẹ̀dà, gba TXT tàbí tẹ̀ jáde.';
    }
    function row(labelText, value, unconfirmed) { const r = doc.createElement('div'), l = doc.createElement('span'), v = doc.createElement('strong'); l.textContent = labelText; v.textContent = unconfirmed ? 'A kò tíì jẹ́rìí iye' : money(value); r.append(l, v); return r; }
    function render(result) {
      id('resultContext').textContent = `${context.planName || 'Ètò tí kò ní orúkọ'} · oṣù ${result.planMonths}. ` + (result.budgetComplete ? 'O ti jẹ́rìí gbogbo ìnáwó tí o tẹ.' : `Ìnáwó kò tíì pé: ${result.missingCosts.map(label).join('; ')}. Ìyàtọ̀ yìí jẹ́ àkọ́kọ́ nìkan.`);
      const metrics = [['Àpapọ̀ owó tí a ń retí', money(result.totalIncome)], ['Àpapọ̀ ìnáwó tí o tẹ', money(result.totalCosts)], [result.budgetComplete ? result.remainder < 0 ? 'Àìpé tí ètò fi hàn' : 'Ìyókù tí ètò fi hàn' : 'Ìyàtọ̀ àkọ́kọ́', money(result.budgetComplete ? Math.abs(result.remainder) : result.remainder)], ['Àárín owó wọlé lóṣù', money(result.averageMonthlyIncome)], ['Oṣù tí ìyókù lè gbé', !result.budgetComplete ? 'Kọ́kọ́ jẹ́rìí ìnáwó' : result.bufferMonths === null ? 'A kò tẹ ìnáwó lóṣù' : `Oṣù ${result.bufferMonths.toFixed(1)}`]];
      id('metricGrid').replaceChildren(...metrics.map(([l, v]) => { const e = doc.createElement('article'), a = doc.createElement('span'), b = doc.createElement('strong'); a.textContent = l; b.textContent = v; e.append(a, b); return e; }));
      id('incomeBreakdown').replaceChildren(row(`Ìjọba àpapọ̀ · oṣù ${result.federalMonths}`, result.federalTotal), row(`Ìpínlẹ̀ · oṣù ${result.stateMonths}`, result.stateTotal), row(`PPA · oṣù ${result.ppaMonths}`, result.ppaTotal), row('Owó mìíràn àti ẹ̀ẹ̀kan', result.otherTotal));
      id('costBreakdown').replaceChildren(...costKeys.map(key => row(key === 'oneTimeCosts' ? label(key) : `${label(key).replace(/ lóṣù$/, '')} · àpapọ̀ fún ètò oṣù ${result.planMonths}`, key === 'oneTimeCosts' ? result[key] : result[key] * result.planMonths, result.missingCosts.includes(key))));
      id('nyscPrintWorksheet').textContent = makeReport(result, context);
      id('nyscResults').hidden = false; id('nyscResults').focus();
    }
    form.addEventListener('submit', event => {
      event.preventDefault(); clearErrors(); revision++; current = null; id('nyscPrintWorksheet').textContent = '';
      const input = {}, bad = {};
      for (const key of Object.keys(fields)) { input[key] = id(key).value; bad[key] = Boolean(id(key).validity && id(key).validity.badInput); }
      const result = calculate(input, bad);
      if (!result.valid) {
        id('nyscResults').hidden = true; id('exportStatus').textContent = ''; id('nyscError').textContent = result.error;
        if (result.field) { id(result.field).setAttribute('aria-invalid', 'true'); id(result.field).setAttribute('aria-describedby', 'amountHelp nyscError'); id(result.field).focus(); }
        return;
      }
      context = {planName: id('planName').value.trim(), checkedOn: id('checkedOn').value, sourceNotes: id('sourceNotes').value.trim()};
      current = result; id('exportStatus').textContent = ''; render(result);
    });
    form.addEventListener('input', invalidate); form.addEventListener('change', invalidate);
    const report = () => current ? makeReport(current, context) : '';
    function exportable() { if (current) return true; id('exportStatus').textContent = 'Kọ́kọ́ ṣe ìṣirò pẹ̀lú àwọn iye tó péye.'; return false; }
    id('copyNysc').addEventListener('click', async () => {
      if (!exportable()) return;
      const version = revision;
      try { await win.navigator.clipboard.writeText(report()); if (version === revision) id('exportStatus').textContent = 'A ti ṣe ẹ̀dà ètò náà.'; }
      catch (_) { if (version === revision) id('exportStatus').textContent = 'A kò lè ṣe ẹ̀dà ètò náà. Gba TXT dípò rẹ̀.'; }
    });
    id('downloadNysc').addEventListener('click', () => {
      if (!exportable()) return;
      let url;
      try {
        url = win.URL.createObjectURL(new win.Blob([report()], {type: 'text/plain;charset=utf-8'}));
        const link = doc.createElement('a'); link.href = url; link.download = 'afrotools-eto-nysc-yoruba.txt'; doc.body.appendChild(link); link.click(); link.remove();
        id('exportStatus').textContent = 'A ti fi TXT ránṣẹ́ sí aṣàwákiri fún gbígbà.';
      } catch (_) { id('exportStatus').textContent = 'A kò lè pèsè TXT. Gbìyànjú ṣíṣe ẹ̀dà ètò náà.'; }
      finally { if (url) win.setTimeout(() => win.URL.revokeObjectURL(url), 1000); }
    });
    id('printNysc').addEventListener('click', () => { if (exportable()) { id('exportStatus').textContent = 'À ń ṣí títẹ̀ jáde. Yan ìpamọ́ PDF bí o bá fẹ́.'; win.print(); } });
    win.AFROTOOLS_NYSC_YORUBA = true;
  }
  return {fields, costKeys, monthKeys, calculate, makeReport, mount};
});
