(() => {
  'use strict';
  const root = document.querySelector('[data-tool="agric-profit"]');
  const cfg = window.__SW_AGRI_CONFIG__;
  if (!root || !cfg || !window.AGRIC_PROFIT_DATA || !window.AfroTools?.AgricProfitEngine) return;
  const form = root.querySelector('form');
  const controls = [...form.querySelectorAll('[data-key]')];
  const status = root.querySelector('[data-status]');
  const box = root.querySelector('[data-result]');
  const output = root.querySelector('[data-output]');
  const format = new Intl.NumberFormat('sw-KE', { maximumFractionDigits: 2 });
  const currency = { KE:'KES', NG:'NGN', GH:'GHS', TZ:'TZS', UG:'UGX', ZA:'ZAR', ET:'ETB', EG:'EGP' };
  let latest = null;
  let rows = [];

  function read() {
    const input = { costs:{} };
    for (const c of controls) {
      const target = c.closest('fieldset') ? input.costs : input;
      target[c.dataset.key] = c.type === 'number' ? c.valueAsNumber : c.value;
    }
    return input;
  }
  function run(input) {
    return window.AfroTools.AgricProfitEngine.calculate(input, window.AGRIC_PROFIT_DATA);
  }
  function clear(message) {
    latest = null;
    box.hidden = true;
    output.replaceChildren();
    status.textContent = message;
  }
  function calculate() {
    const input = read();
    latest = run(input);
    const n = format.format;
    const money = value => n(value) + ' ' + currency[input.country];
    const available = 'Haiwezi kukokotolewa';
    rows = [
      ['Eneo na misimu', n(input.area)+' ha × '+n(input.seasons)],
      ['Mavuno yanayoweza kuuzwa', n(latest.totalYield)+' kg'],
      ['Mapato ya mauzo', money(latest.totalRevenue)],
      ['Jumla ya gharama', money(latest.totalCost)],
      [latest.profit < 0 ? 'Hasara' : 'Faida', money(Math.abs(latest.profit))],
      ['Faida kama asilimia ya gharama', latest.totalCost ? n(latest.roi)+'%' : available],
      ['Bei ya kufidia gharama kwa kilo', latest.totalYield ? money(latest.breakEvenPrice) : available],
      ['Mavuno ya kufidia gharama baada ya upotevu (kg/ha kwa msimu)', input.pricePerKg ? n(latest.breakEvenYield) : available]
    ];
    if (![latest.totalCost,latest.totalYield,latest.totalRevenue,latest.profit,latest.breakEvenPrice,latest.breakEvenYield,latest.roi].every(Number.isFinite)) {
      clear('Thamani ni kubwa mno. Punguza kiasi kisha ukokotoe tena.');
      return;
    }
    output.replaceChildren();
    for (const [label,value] of rows) {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label;
      dd.textContent = value;
      output.append(dt, dd);
    }
    box.hidden = false;
    status.textContent = 'Hesabu imekamilika.';
    box.focus();
  }
  function report() {
    return {schemaVersion:1,tool:cfg.id,locale:'sw',generatedAt:new Date().toISOString(),source:cfg.source,input:read(),result:latest,privacy:'local-only'};
  }
  form.addEventListener('submit', e => { e.preventDefault(); calculate(); });
  form.addEventListener('input', () => clear('Kokotoa tena baada ya kubadili taarifa.'));
  form.addEventListener('reset', () => clear('Fomu imerudishwa kwenye mfano wa mwanzo.'));
  for (const c of controls) {
    c.addEventListener('invalid', () => {
      const range = c.type === 'number' ? ' Kiwango cha chini: '+c.min+(c.max ? ', cha juu: '+c.max : '')+'.' : '';
      status.textContent = c.labels[0].textContent + ': ingiza thamani halali.' + range + (c.step === '1' ? ' Tumia namba kamili.' : '');
    });
  }
  root.querySelector('[data-import]').addEventListener('change', async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const saved = JSON.parse(await file.text());
      if (saved.tool !== cfg.id || saved.locale !== 'sw' || !saved.input || !saved.result) throw Error();
      const values = controls.map(c => {
        const v = (c.closest('fieldset') ? saved.input.costs : saved.input)?.[c.dataset.key];
        if ((typeof v !== 'number' && typeof v !== 'string') || String(v).trim() === '') throw Error();
        const test = c.cloneNode(true);
        test.value = String(v);
        if (test.value === '' || !test.validity.valid) throw Error();
        return test.value;
      });
      controls.forEach((c,i) => { c.value = values[i]; });
      calculate();
      if (latest) status.textContent = 'JSON imefunguliwa na matokeo yamekokotolewa tena.';
    } catch {
      status.textContent = 'Faili halina taarifa halali za kikokotoo hiki. Kagua faili la JSON.';
    } finally {
      e.target.value = '';
    }
  });
  function save(content, mime, ext) {
    const url = URL.createObjectURL(new Blob([content], {type:mime}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'afrotools-agric-profit.' + ext;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
  root.addEventListener('click', e => {
    const button = e.target.closest('[data-export]');
    if (!button || !latest) return;
    const type = button.dataset.export;
    const text = [cfg.name, ...rows.map(([key,value]) => key + ': ' + value)].join('\n');
    if (type === 'json') save(JSON.stringify(report(),null,2),'application/json','json');
    if (type === 'txt') save(text,'text/plain;charset=utf-8','txt');
    if (type === 'csv') {
      const table = [['Kipimo','Thamani'], ...rows];
      save(table.map(row => row.map(s => '"'+s.replaceAll('"','""')+'"').join(',')).join('\r\n'),'text/csv;charset=utf-8','csv');
    }
    if (type === 'pdf') {
      if (!window.jspdf?.jsPDF) { status.textContent = 'Moduli ya PDF haikupatikana.'; return; }
      const pdf = new window.jspdf.jsPDF({unit:'pt',format:'a4'});
      pdf.text(pdf.splitTextToSize(text,500),48,58);
      pdf.save('afrotools-agric-profit.pdf');
    }
  });
  window.__SW_AGRI_TEST__ = { run, getLatest:() => latest, report };
})();
