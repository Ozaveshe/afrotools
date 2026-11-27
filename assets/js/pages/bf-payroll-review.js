(function () {
  'use strict';
  const form = document.getElementById('bf-sheet');
  if (!form) return;
  const labels = JSON.parse(document.getElementById('bf-sheet-labels').textContent);
  const output = document.getElementById('bf-output');
  const status = document.getElementById('bf-status');
  const method = form.elements.method;
  const format = new Intl.NumberFormat(document.documentElement.lang, {maximumFractionDigits: 0});
  let documentText = '';
  const value = key => Number(form.elements[key].value);
  const money = n => format.format(n) + ' XOF';
  const range = (a,b) => Math.round(a) === Math.round(b) ? money(a) : money(a) + ' – ' + money(b);

  function resetOutput() {
    output.hidden = true;
    status.textContent = '';
    documentText = '';
    for (const fields of form.querySelectorAll('[data-mode]')) {
      fields.disabled = fields.dataset.mode !== method.value;
      fields.hidden = fields.disabled;
    }
  }
  function bracketTax(base) {
    let lower = 0;
    let tax = 0;
    for (const [upper, rate] of [[30000,0],[50000,.121],[80000,.139],[120000,.157],[170000,.184],[250000,.217],[Infinity,.25]]) {
      tax += Math.max(0, Math.min(base,upper) - lower) * rate;
      if (base <= upper) break;
      lower = upper;
    }
    return tax;
  }
  function payrollRows() {
    const gross = value('basic');
    if (gross < 45000) {
      status.textContent = labels.minimum;
      return null;
    }
    const socialBase = Math.min(gross, 800000);
    const pension = socialBase * .055;
    const health = form.elements.ramu.value === 'active' ? gross * .025 : 0;
    const professional = gross * (form.elements.category.value === 'upper' ? .20 : .25);
    const taxBase = gross - professional - Math.min(pension, gross * .08);
    const relief = [0,.08,.10,.12,.14][value('family')];
    const taxLow = bracketTax(Math.floor(taxBase / 100) * 100) * (1-relief);
    const taxHigh = bracketTax(Math.ceil(taxBase / 100) * 100) * (1-relief);
    const beforeTax = gross - pension - health - value('other');
    return [['basic',money(gross)],['category',labels[form.elements.category.value]],['family',String(value('family'))],
      ['familyRelief',Math.round(relief*100)+'%'],['ramu',labels[form.elements.ramu.value]],['socialBase',money(socialBase)],
      ['professional',money(professional)],['base',money(taxBase)],['cnss',money(pension)],['health',money(health)],
      ['tax',range(taxLow,taxHigh)],['other',money(value('other'))],['net',range(beforeTax-taxHigh,beforeTax-taxLow)],
      ['employerCNSS',money(socialBase*.16)],['employerRAMU',money(health)]];
  }
  function recordedRows() {
    const net = value('gross') + value('credits') - value('tax') - value('cnss') - value('health') - value('other');
    const rows = ['gross','credits','tax','cnss','health','other'].map(key=>[key,money(value(key))]);
    return rows.concat([['net',money(net)],['paid',money(value('paid'))],['delta',money(net-value('paid'))]]);
  }
  form.addEventListener('input',resetOutput);
  form.addEventListener('change',resetOutput);
  form.addEventListener('submit',function(event) {
    event.preventDefault();
    resetOutput();
    const estimate = method.value === 'estimate';
    const rows = estimate ? payrollRows() : recordedRows();
    if (!rows) return;
    const heading = labels[method.value];
    const note = labels[estimate ? 'estimateNote' : 'manualNote'];
    const list = output.querySelector('dl');
    list.replaceChildren();
    for (const [key, amount] of rows) {
      const dt=document.createElement('dt'), dd=document.createElement('dd');
      dt.textContent=labels[key]; dd.textContent=amount;
      list.append(dt,dd);
    }
    output.querySelector('h3').textContent=heading;
    output.querySelector('p').textContent=note;
    output.hidden=false;
    const sources=Array.from(document.querySelectorAll('#sources-verification li a'),a=>a.textContent+' '+a.href);
    documentText=[labels.title,heading,...rows.map(([key,amount])=>labels[key]+': '+amount),note,...(estimate?[labels.scope,labels.recovery,labels.source,...sources]:[])].join('\n');
  });
  let pdfLibrary;
  function loadPdfLibrary() {
    if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
    if (!pdfLibrary) {
      pdfLibrary = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = '/assets/vendor/jspdf/jspdf.umd.min.js';
        script.onload = () => window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject();
        script.onerror = reject;
        document.head.appendChild(script);
      }).catch(error => { pdfLibrary = null; throw error; });
    }
    return pdfLibrary;
  }
  const pdfButton = document.getElementById('bf-pdf');
  pdfButton.addEventListener('click', async function () {
    if (!documentText) return;
    const snapshot = documentText;
    const mode = method.value;
    pdfButton.disabled = true;
    try {
      const Pdf = await loadPdfLibrary();
      if (snapshot !== documentText || mode !== method.value) return;
      const doc = new Pdf({unit: 'mm', format: 'a4'});
      doc.setFontSize(11);
      let y = 18;
      for (const paragraph of snapshot.replace(/[\u202f\u00a0]/g, ' ').split('\n')) {
        for (const line of doc.splitTextToSize(paragraph, 176)) {
          if (y > 277) { doc.addPage(); y = 18; }
          doc.text(line, 17, y);
          y += 5.5;
        }
        y += 2;
      }
      doc.save('burkina-faso-' + mode + '.pdf');
    } catch {
      if (snapshot === documentText) status.textContent = labels.pdfError;
    } finally {
      pdfButton.disabled = false;
    }
  });
  document.getElementById('bf-txt').addEventListener('click',function(){
    if (!documentText) return;
    const url=URL.createObjectURL(new Blob([documentText],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='burkina-faso-'+method.value+'.txt';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  resetOutput();
})();
