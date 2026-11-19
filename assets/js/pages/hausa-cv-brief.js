(function () {
  'use strict';
  const originalFields = ['name', 'role', 'skills', 'education'];
  const fields = [...originalFields, 'email', 'phone'];
  const jobFields = ['title', 'employer', 'period', 'details'];
  const jobs = document.getElementById('cvWorkRows');
  const addJob = document.getElementById('cvAddJob');
  const maxJobs = 50;
  var result = document.getElementById('cvResult');
  function updateJobLabels() {
    Array.from(jobs.children).forEach((row, index) => {
      row.querySelector('legend').textContent = 'Aiki na ' + (index + 1);
      row.querySelector('[data-remove-job]').setAttribute('aria-label', 'Cire aiki na ' + (index + 1));
    });
    addJob.disabled = jobs.children.length >= maxJobs;
  }
  function appendJob(values = {}) {
    const row = document.getElementById('cvJobTemplate').content.firstElementChild.cloneNode(true);
    jobFields.forEach(key => { row.querySelector('[data-job="' + key + '"]').value = values[key] || ''; });
    row.querySelector('[data-remove-job]').addEventListener('click', () => {
      if (Array.from(row.querySelectorAll('[data-job]')).some(input => input.value) &&
          !window.confirm('A cire wannan aikin daga daftarin da ke shafin?')) return;
      const next = row.nextElementSibling || row.previousElementSibling;
      row.remove();
      updateJobLabels();
      (next ? next.querySelector('input') : addJob).focus();
    });
    jobs.appendChild(row);
    return row;
  }
  addJob.addEventListener('click', () => {
    const row = appendJob();
    updateJobLabels();
    row.querySelector('input').focus();
  });
  function documentSections(state) {
    const sections = [[state.name, state.role]];
    if (state.email || state.phone) sections.push(['HANYAR TUNTUƁA', state.email, state.phone]);
    const history = state.jobs.map(job => [job.title, job.employer, job.period, job.details]
      .map(value => value.trim()).filter(Boolean).join('\n')).filter(Boolean);
    if (history.length) sections.push(['TARIHIN AIKI', history.join('\n\n')]);
    if (state.skills) sections.push(['ƘWAREWA', state.skills]);
    if (state.education) sections.push(['ILIMI KO HORO', state.education]);
    return sections.map(lines => lines.filter(Boolean).join('\n'));
  }
  function draft() {
    const state = snapshot();
    fields.forEach(id => { state[id] = state[id].trim(); });
    result.style.display = 'block';
    result.replaceChildren();
    if (!state.name || !state.role) {
      result.textContent = !state.name ? 'Saka sunanka kafin gina daftarin CV.' : 'Saka aikin da kake nema kafin gina daftarin CV.';
      document.getElementById(!state.name ? 'name' : 'role').focus();
      return null;
    }
    documentSections(state).forEach((text, index) => {
      const block = document.createElement(index === 0 ? 'strong' : 'p');
      block.style.whiteSpace = 'pre-line';
      block.textContent = text;
      result.appendChild(block);
    });
    return state;
  }
  const storageKey = 'afrotools.ha.cv-brief.v1';
  const limit = 256 * 1024;
  const status = document.getElementById('cvDraftStatus');
  function snapshot() {
    const state = Object.fromEntries(fields.map(id => [id, document.getElementById(id).value]));
    state.jobs = Array.from(jobs.children, row => Object.fromEntries(jobFields.map(
      key => [key, row.querySelector('[data-job="' + key + '"]').value]
    )));
    return state;
  }
  function encode() {
    const json = JSON.stringify({format: 'afrotools-ha-cv', version: 2, fields: snapshot()}, null, 2);
    if (new Blob([json]).size > limit) throw new Error('size');
    return json;
  }
  function decode(json) {
    const data = JSON.parse(json);
    if (!data || data.format !== 'afrotools-ha-cv' || !data.fields ||
        !originalFields.every(id => typeof data.fields[id] === 'string')) throw new Error('format');
    if (data.version === 1) return Object.assign({}, data.fields, {email: '', phone: '', jobs: []});
    if (data.version !== 2 || !fields.every(id => typeof data.fields[id] === 'string') ||
        !Array.isArray(data.fields.jobs) || data.fields.jobs.length > maxJobs ||
        !data.fields.jobs.every(job => job && jobFields.every(key => typeof job[key] === 'string'))) {
      throw new Error('format');
    }
    return data.fields;
  }
  function apply(values) {
    fields.forEach(id => { document.getElementById(id).value = values[id] || ''; });
    jobs.replaceChildren();
    (values.jobs || []).forEach(appendJob);
    updateJobLabels();
    result.replaceChildren();
    result.style.display = 'none';
  }
  function replace(values) {
    if (!window.confirm('A maye gurbin bayanan da ke shafin da wannan daftarin?')) return;
    apply(values);
    status.textContent = 'An dawo da daftarin. Za ka iya ci gaba da gyarawa.';
  }
  document.getElementById('cvSave').addEventListener('click', () => {
    try {
      const json = encode();
      if (localStorage.getItem(storageKey) !== null &&
          !window.confirm('A maye gurbin daftarin da aka riga aka ajiye a wannan burauzar?')) return;
      localStorage.setItem(storageKey, json);
      status.textContent = 'An ajiye daftarin a wannan burauzar.';
    } catch {
      status.textContent = 'Ba a iya ajiye daftarin ba. Duba sararin ajiya ko gwada sauke JSON.';
    }
  });
  document.getElementById('cvRestore').addEventListener('click', () => {
    try {
      const json = localStorage.getItem(storageKey);
      if (json === null) { status.textContent = 'Babu daftarin da aka ajiye a wannan burauzar.'; return; }
      replace(decode(json));
    } catch {
      status.textContent = 'Ba a iya karanta daftarin ba. Bayanan da ke shafin suna nan.';
    }
  });
  document.getElementById('cvExport').addEventListener('click', () => {
    let json;
    try { json = encode(); } catch { status.textContent = 'Daftarin ya fi girman 256 KB. Rage tsawon rubutun.'; return; }
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([json], {type: 'application/json;charset=utf-8'}));
    link.href = url;
    link.download = 'daftarin-cv-hausa.json';
    link.dataset.noPdfGate = 'true';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'An shirya fayil ɗin JSON. Ajiye shi a wuri mai aminci.';
  });
  let importRequest = 0;
  document.getElementById('cvImport').addEventListener('change', async event => {
    const input = event.currentTarget;
    const file = input.files[0];
    const request = ++importRequest;
    input.value = '';
    if (!file) return;
    try {
      if (file.size > limit) throw new Error('size');
      const values = decode(await file.text());
      if (request === importRequest) replace(values);
    } catch {
      if (request === importRequest) status.textContent = 'Ba a iya buɗe fayil ɗin ba. Zaɓi daftarin JSON na wannan shafin da bai fi 256 KB ba. Bayanan da ke shafin suna nan.';
    }
  });
  document.getElementById('cvClear').addEventListener('click', () => {
    if (!window.confirm('A goge bayanan da ke shafin da daftarin CV da aka ajiye a wannan burauzar?')) return;
    importRequest++;
    apply({});
    const attachment = document.getElementById('cvUpload');
    if (attachment) { attachment.value = ''; attachment.dispatchEvent(new Event('change')); }
    try {
      localStorage.removeItem(storageKey);
      status.textContent = 'An goge bayanan shafin da daftarin da aka ajiye a wannan burauzar.';
    } catch {
      status.textContent = 'An goge bayanan shafin. Ba a iya goge ajiyar burauzar ba. Yi amfani da saitunan burauzar don goge bayanan shafin.';
    }
  });
  const pdfButton = document.getElementById('cvPdf');
  const pdfStatus = document.getElementById('cvPdfStatus');
  pdfButton.addEventListener('click', async () => {
    const state = draft();
    pdfStatus.textContent = '';
    if (!state) return;
    const sections = documentSections(state);
    pdfButton.disabled = true;
    pdfStatus.textContent = 'Ana shirya PDF…';
    try {
      const bytes = await window.CareerDocumentPdf.buildPdf(sections.join('\n\n'), 'cv');
      const link = document.createElement('a');
      const url = URL.createObjectURL(new Blob([bytes], {type: 'application/pdf'}));
      link.href = url;
      link.download = 'cv-hausa.pdf';
      link.dataset.noPdfGate = 'true';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      pdfStatus.textContent = 'An shirya PDF ɗinka don saukewa.';
    } catch (error) {
      pdfStatus.textContent = error && error.code === 'CAREER_PDF_UNSUPPORTED_CHARACTER'
        ? 'Wasu haruffa ba su samuwa a rubutun PDF. Sauke TXT don kiyaye duk abin da ka rubuta.'
        : 'Ba a iya shirya PDF ba. Sake gwadawa ko sauke TXT.';
    } finally {
      pdfButton.disabled = false;
    }
  });
  window.draftCv = draft;
  window.downloadCvBrief = function () {
    var state = draft();
    if (!state) return;
    const text = documentSections(state).join('\n\n');
    var link = document.createElement('a');
    var url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    link.href = url;
    link.download = 'ha-cv-brief.txt';
    link.dataset.noPdfGate = 'true';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };
})();
