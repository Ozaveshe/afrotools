(function () {
  'use strict';
  const root = document.querySelector('[data-relocation-budget]');
  if (!root || !window.RelocationBudgetEngine) return;
  const form = document.getElementById('jb-form');
  const out = document.getElementById('jb-result-list');
  const status = document.getElementById('jb-status');
  const error = document.getElementById('jb-error');
  let last = null;
  const labels = {
    invalid: 'Complétez chaque champ avec une valeur valide.',
    total: 'Budget total', base: 'Coûts avant marge', runway: 'Réserve d’installation',
    buffer: 'Marge de sécurité', gap: 'Écart de financement', target: 'Épargne mensuelle cible',
    updated: 'Budget calculé sur cet appareil.', copied: 'Résumé copié.',
    json: 'JSON téléchargé.', txt: 'TXT téléchargé.', pdf: 'PDF téléchargé.',
    boundary: 'Budget fondé uniquement sur vos montants vérifiés; aucun conseil de visa, immigration, fiscalité ou droit.'
  };
  function value(id) { return document.getElementById(id).value.trim(); }
  function clear() {
    last = null;
    out.replaceChildren();
    document.getElementById('jb-primary-value').textContent = '—';
    status.textContent = '';
    form.querySelectorAll('[aria-invalid="true"]').forEach((node) => node.removeAttribute('aria-invalid'));
  }
  function format(number, currency) {
    return `${Number(number).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${currency}`;
  }
  function input() {
    return {
      currency: value('jb-currency'), preDeparture: value('jb-pre'),
      verifiedOfficialFees: value('jb-official'), travel: value('jb-travel'),
      housing: value('jb-housing'), arrivalSetup: value('jb-arrival'),
      monthlyLiving: value('jb-monthly'), runwayMonths: value('jb-runway'),
      bufferPercent: value('jb-buffer'), availableSavings: value('jb-savings'),
      savingMonths: value('jb-saving-months')
    };
  }
  function render(result) {
    document.getElementById('jb-primary-value').textContent = format(result.total, result.currency);
    out.replaceChildren();
    [[labels.base, result.base], [labels.runway, result.runwayCost], [labels.buffer, result.buffer],
      [labels.gap, result.gap], [labels.target, result.monthlySavingsTarget]].forEach(([name, amount]) => {
      const box = document.createElement('div'); box.className = 'rm-result';
      const span = document.createElement('span'); span.textContent = name;
      const strong = document.createElement('strong'); strong.textContent = format(amount, result.currency);
      box.append(span, strong); out.appendChild(box);
    });
  }
  function calculate(event) {
    if (event) event.preventDefault();
    clear();
    if (!form.checkValidity()) {
      const field = form.querySelector(':invalid');
      if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
      error.textContent = labels.invalid; status.textContent = labels.invalid; form.reportValidity(); return null;
    }
    try { last = window.RelocationBudgetEngine.calculate(input()); }
    catch (_) {
      const field = form.querySelector('input');
      if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
      error.textContent = labels.invalid; status.textContent = labels.invalid; return null;
    }
    error.textContent = ''; render(last); status.textContent = labels.updated; return last;
  }
  function summary(result) {
    return [`${labels.total}: ${format(result.total, result.currency)}`,
      `${labels.gap}: ${format(result.gap, result.currency)}`,
      `${labels.target}: ${format(result.monthlySavingsTarget, result.currency)}`, labels.boundary].join('\n');
  }
  function ensure() { return last || calculate(); }
  function download(name, type, body) {
    const url = URL.createObjectURL(new Blob([body], { type }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function loadPdf() {
    if (window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
      script.onload = () => resolve(window.jspdf.jsPDF); script.onerror = reject; document.head.appendChild(script);
    });
  }
  document.getElementById('jb-copy').addEventListener('click', () => {
    const result = ensure(); if (!result) return;
    const text = summary(result);
    const copied = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text) : Promise.reject();
    copied.catch(() => { const area = document.createElement('textarea'); area.value = text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); }).finally(() => { status.textContent = labels.copied; });
  });
  document.getElementById('jb-json').addEventListener('click', () => { const result = ensure(); if (!result) return; download('budget-relocalisation-japa.json', 'application/json', JSON.stringify({ schemaVersion: 1, methodology: result.methodology, result }, null, 2)); status.textContent = labels.json; });
  document.getElementById('jb-txt').addEventListener('click', () => { const result = ensure(); if (!result) return; download('budget-relocalisation-japa.txt', 'text/plain;charset=utf-8', summary(result)); status.textContent = labels.txt; });
  document.getElementById('jb-pdf').addEventListener('click', async () => {
    const result = ensure(); if (!result) return;
    const JsPDF = await loadPdf(); const doc = new JsPDF();
    doc.setFontSize(16); doc.text('Planificateur de budget Japa', 16, 20);
    doc.setFontSize(10); const lines = summary(result).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\u00a0\u202f]/g, ' ').replace(/[’‘]/g, "'").replace(/[–—]/g, '-').replace(/[^\x20-\x7e\n]/g, '').split('\n');
    lines.forEach((line, index) => doc.text(line, 16, 34 + index * 7));
    doc.save('budget-relocalisation-japa.pdf'); status.textContent = labels.pdf;
  });
  form.addEventListener('submit', calculate);
  form.addEventListener('input', clear);
  form.addEventListener('reset', () => setTimeout(clear, 0));
}());
