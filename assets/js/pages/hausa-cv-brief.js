(function () {
  'use strict';
  var fields = ['name', 'role', 'skills', 'education'];
  var result = document.getElementById('cvResult');
  function read() {
    var state = {};
    fields.forEach(function (id) { state[id] = document.getElementById(id).value.trim(); });
    return state;
  }
  function draft() {
    var state = read();
    result.style.display = 'block';
    result.replaceChildren();
    if (!state.name || !state.role) {
      result.textContent = !state.name ? 'Saka sunanka kafin gina daftarin CV.' : 'Saka aikin da kake nema kafin gina daftarin CV.';
      document.getElementById(!state.name ? 'name' : 'role').focus();
      return null;
    }
    var title = document.createElement('strong');
    title.textContent = state.name;
    result.appendChild(title);
    [state.role, 'Ƙwarewa: ' + state.skills, 'Ilimi ko horo: ' + state.education].forEach(function (text) {
      var paragraph = document.createElement('p');
      paragraph.textContent = text;
      result.appendChild(paragraph);
    });
    return state;
  }
  const storageKey = 'afrotools.ha.cv-brief.v1';
  const limit = 256 * 1024;
  const status = document.getElementById('cvDraftStatus');
  function snapshot() {
    return Object.fromEntries(fields.map(id => [id, document.getElementById(id).value]));
  }
  function encode() {
    const json = JSON.stringify({format: 'afrotools-ha-cv', version: 1, fields: snapshot()}, null, 2);
    if (new Blob([json]).size > limit) throw new Error('size');
    return json;
  }
  function decode(json) {
    const data = JSON.parse(json);
    if (!data || data.format !== 'afrotools-ha-cv' || data.version !== 1 ||
        !data.fields || !fields.every(id => typeof data.fields[id] === 'string')) {
      throw new Error('format');
    }
    return data.fields;
  }
  function apply(values) {
    fields.forEach(id => { document.getElementById(id).value = values[id]; });
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
    apply(Object.fromEntries(fields.map(id => [id, ''])));
    const attachment = document.getElementById('cvUpload');
    if (attachment) { attachment.value = ''; attachment.dispatchEvent(new Event('change')); }
    try {
      localStorage.removeItem(storageKey);
      status.textContent = 'An goge bayanan shafin da daftarin da aka ajiye a wannan burauzar.';
    } catch {
      status.textContent = 'An goge bayanan shafin. Ba a iya goge ajiyar burauzar ba. Yi amfani da saitunan burauzar don goge bayanan shafin.';
    }
  });
  window.draftCv = draft;
  window.downloadCvBrief = function () {
    var state = draft();
    if (!state) return;
    var text = 'Takaitaccen CV\n\nSuna: ' + state.name + '\nAiki: ' + state.role +
      '\nƘwarewa: ' + state.skills + '\nIlimi ko horo: ' + state.education +
      '\n\nSirri: an shirya wannan a cikin burauza.';
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
