(function() {
  'use strict';

  const locale = document.documentElement.lang.split('-')[0];
  const messages = {
    invalid: {en:'This PDF could not be opened. Choose a readable PDF with interactive form fields and try again.',fr:'Ce PDF ne peut pas être ouvert. Choisissez un PDF lisible contenant des champs de formulaire interactifs et réessayez.',sw:'PDF hii haiwezi kufunguliwa. Chagua PDF inayosomeka yenye sehemu za fomu zinazojazwa kisha ujaribu tena.'},
    required: {en:'Complete the required fields before downloading.',fr:'Remplissez les champs obligatoires avant de télécharger.',sw:'Jaza sehemu za lazima kabla ya kupakua.'},
    failed: {en:'The filled PDF could not be created. Check the field values and try again.',fr:'Le PDF rempli ne peut pas être créé. Vérifiez les valeurs des champs et réessayez.',sw:'PDF iliyojazwa haikuweza kutengenezwa. Kagua thamani za sehemu kisha ujaribu tena.'},
    download: {en:'Download Filled PDF',fr:'Télécharger le PDF rempli',sw:'Pakua PDF iliyojazwa'},
    processing: {en:'Processing...',fr:'Traitement en cours…',sw:'Inachakata...'}
  };
  const message = key => messages[key][locale] || messages[key].en;
  let sourceVersion = 0;
  // State
  function getPDFLib() {
    if (!window.PDFLib) throw new Error('PDF library failed to load. Please refresh the page.');
    return window.PDFLib;
  }
  let pdfBytes = null;
  let pdfDoc = null;       // pdf-lib doc
  let pdfJsDoc = null;     // pdf.js doc
  let currentPage = 1;
  let totalPages = 0;
  let formFields = [];     // parsed field info
  let fieldElements = {};  // DOM input references keyed by field name

  // DOM refs
  const uploadCard = document.getElementById('uploadCard');
  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const uploadStatus = document.getElementById('uploadStatus');
  const workspace = document.getElementById('workspace');
  const fileInfo = document.getElementById('fileInfo');
  const loadNewBtn = document.getElementById('loadNewBtn');
  const pdfCanvas = document.getElementById('pdfCanvas');
  const prevPageBtn = document.getElementById('prevPage');
  const nextPageBtn = document.getElementById('nextPage');
  const pageInfoSpan = document.getElementById('pageInfo');
  const fieldsPanel = document.getElementById('fieldsPanel');
  const noFieldsMsg = document.getElementById('noFieldsMsg');
  const fieldCountBadge = document.getElementById('fieldCountBadge');
  const fieldCountBar = document.getElementById('fieldCountBar');
  const completionMeter = document.getElementById('completionMeter');
  const completionFill = document.getElementById('completionFill');
  const completionText = document.getElementById('completionText');
  const requiredText = document.getElementById('requiredText');
  const btnRow = document.getElementById('btnRow');
  const flattenRow = document.getElementById('flattenRow');
  const downloadWrap = document.getElementById('downloadWrap');
  const downloadBtn = document.getElementById('downloadBtn');
  const fillAllBtn = document.getElementById('fillAllBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const flattenCheck = document.getElementById('flattenCheck');
  const statusMsg = document.getElementById('statusMsg');
  const reviewNote = document.getElementById('reviewNote');

  function isPdfFile(file) {
    return !!(file && ((file.type && file.type === 'application/pdf') || /\.pdf$/i.test(file.name || '')));
  }

  function showUploadStatus(message, type) {
    uploadStatus.textContent = message || '';
    uploadStatus.className = 'status-msg ' + (type === 'error' ? 'status-error' : 'status-success');
    uploadStatus.style.display = message ? 'block' : 'none';
  }

  function showStatus(message, type) {
    statusMsg.innerHTML = message ? '<div class="status-msg ' + (type === 'error' ? 'status-error' : 'status-success') + '">' + escHtml(message) + '</div>' : '';
  }

  function getFieldElementValue(info) {
    const el = fieldElements[info.name];
    if (!el) return '';
    if (info.kind === 'text') return el.value.trim();
    if (info.kind === 'checkbox') return el.checked ? 'checked' : '';
    if (info.kind === 'dropdown') return Array.from(el.selectedOptions).some(o => o.value) ? 'selected' : '';
    if (info.kind === 'radio') return el.querySelector('input[type="radio"]:checked') ? 'selected' : '';
    return '';
  }

  function updateCompletion() {
    const total = formFields.length;
    const complete = formFields.filter(info => !!getFieldElementValue(info)).length;
    const requiredTotal = formFields.filter(info => info.required).length;
    const requiredMissing = formFields.filter(info => info.required && !getFieldElementValue(info)).length;
    const pct = total ? Math.round((complete / total) * 100) : 0;
    completionText.textContent = complete + ' of ' + total + ' fields complete';
    requiredText.textContent = requiredTotal ? requiredMissing + ' required left' : 'Required fields: 0';
    completionFill.style.width = pct + '%';
    completionMeter.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(pct));
    formFields.forEach(info => {
      if (info.groupEl) info.groupEl.classList.toggle('is-empty-required', !!(info.required && !getFieldElementValue(info)));
    });
    reviewNote.textContent = requiredMissing
      ? 'Required fields are still empty. Review highlighted fields before downloading.'
      : 'Review names, dates, checkboxes, and page count before sending the completed form.';
  }

  function invalidateSource() {
    sourceVersion++;
    pdfBytes = null; pdfDoc = null; pdfJsDoc = null;
    formFields = []; fieldElements = {};
    fieldsPanel.innerHTML = ''; statusMsg.innerHTML = '';
    downloadWrap.classList.remove('on'); downloadBtn.disabled = true;
    workspace.style.display = 'none'; uploadCard.style.display = 'block';
    completionMeter.style.display = 'none';
    downloadBtn.textContent = message('download');
  }
  // Upload handling
  uploadZone.tabIndex = 0;
  uploadZone.setAttribute('role', 'button');
  uploadZone.setAttribute('aria-label', fileInput.getAttribute('aria-label'));
  uploadZone.addEventListener('keydown', e => {
    if (e.target === uploadZone && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); fileInput.click(); }
  });
  uploadZone.addEventListener('click', () => fileInput.click());
  uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('dragover'); });
  uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
  uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  fileInput.addEventListener('change', e => {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  });
  loadNewBtn.addEventListener('click', () => {
    invalidateSource();
    fileInput.value = '';
    showUploadStatus('', 'success');
    uploadZone.focus();
  });

  async function handleFile(file) {
    if (!isPdfFile(file)) {
      invalidateSource();
      showUploadStatus('Please choose a PDF file with interactive form fields.', 'error');
      return;
    }
    invalidateSource();
    const version = sourceVersion;
    try {
      showUploadStatus('Loading PDF locally...', 'success');
      const ab = await file.arrayBuffer();
      if (version !== sourceVersion) return;
      const bytes = new Uint8Array(ab);
      const loaded = await getPDFLib().PDFDocument.load(bytes, { ignoreEncryption: true });
      if (version !== sourceVersion) return;
      pdfBytes = bytes; pdfDoc = loaded;
      fileInfo.textContent = file.name + ' (' + formatSize(file.size) + ')';
      uploadCard.style.display = 'none';
      workspace.style.display = 'block';

      // Load with pdf-lib
      // Parsing succeeded before exposing the replacement workspace.
      totalPages = pdfDoc.getPageCount();

      // Load with pdf.js for preview
      await loadPdfJsPreview(pdfBytes, version);
      if (version !== sourceVersion) return;

      // Detect fields
      detectFields();

      // Render first page
      currentPage = 1;
      await renderPage(currentPage);
      if (version !== sourceVersion) return;
      showUploadStatus('', 'success');
    } catch (err) {
      if (version !== sourceVersion) return;
      invalidateSource();
      showUploadStatus(message('invalid'), 'error');
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  // pdf.js preview
  let pdfjsLib = null;
  let pdfjsLoaded = false;

  async function loadPdfJs() {
    if (pdfjsLoaded) return;
    if (!window.pdfjsLib) throw new Error('PDF preview library failed to load. Please refresh the page.');
    pdfjsLib = window.pdfjsLib;
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.min.js?v=a53a71a2';
    pdfjsLoaded = true;
  }

  async function loadPdfJsPreview(bytes, version) {
    await loadPdfJs();
    const loadingTask = pdfjsLib.getDocument({ data: bytes.slice() });
    const loaded = await loadingTask.promise;
    if (version !== sourceVersion) { await loaded.destroy(); return; }
    pdfJsDoc = loaded;
    totalPages = pdfJsDoc.numPages;
  }

  async function renderPage(num) {
    if (!pdfJsDoc) return;
    const page = await pdfJsDoc.getPage(num);
    const baseViewport = page.getViewport({ scale: 1 });
    const panelWidth = Math.max(280, pdfCanvas.parentElement.clientWidth - 8);
    const scale = Math.min(1.5, panelWidth / baseViewport.width);
    const viewport = page.getViewport({ scale });
    const ctx = pdfCanvas.getContext('2d');
    pdfCanvas.width = viewport.width;
    pdfCanvas.height = viewport.height;
    await page.render({ canvasContext: ctx, viewport }).promise;
    pageInfoSpan.textContent = 'Page ' + num + ' / ' + totalPages;
    prevPageBtn.disabled = num <= 1;
    nextPageBtn.disabled = num >= totalPages;
  }

  prevPageBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(currentPage); } });
  nextPageBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderPage(currentPage); } });

  // Field detection
  function detectFields() {
    formFields = [];
    fieldElements = {};

    let form;
    try {
      form = pdfDoc.getForm();
    } catch (e) {
      showNoFields();
      return;
    }

    const fields = form.getFields();
    if (!fields || fields.length === 0) {
      showNoFields();
      return;
    }

    let textCount = 0, checkCount = 0, dropCount = 0, radioCount = 0;

    fields.forEach(field => {
      const name = field.getName();
      const info = { name, field };
      try { info.required = typeof field.isRequired === 'function' ? field.isRequired() : false; } catch(e) { info.required = false; }

      if (field instanceof PDFLib.PDFTextField) {
        textCount++;
        info.type = 'PDFTextField';
        info.kind = 'text';
        try { info.currentValue = field.getText() || ''; } catch(e) { info.currentValue = ''; }
        try { info.isMultiline = field.isMultiline(); } catch(e) { info.isMultiline = false; }
      } else if (field instanceof PDFLib.PDFCheckBox) {
        checkCount++;
        info.type = 'PDFCheckBox';
        info.kind = 'checkbox';
        try { info.currentValue = field.isChecked(); } catch(e) { info.currentValue = false; }
      } else if (field instanceof PDFLib.PDFDropdown) {
        dropCount++;
        info.type = 'PDFDropdown';
        info.kind = 'dropdown';
        try { info.options = field.getOptions(); } catch(e) { info.options = []; }
        try { info.currentValue = field.getSelected(); } catch(e) { info.currentValue = []; }
      } else if (field instanceof PDFLib.PDFRadioGroup) {
        radioCount++;
        info.type = 'PDFRadioGroup';
        info.kind = 'radio';
        try { info.options = field.getOptions(); } catch(e) { info.options = []; }
        try { info.currentValue = field.getSelected(); } catch(e) { info.currentValue = ''; }
      } else if (field instanceof PDFLib.PDFOptionList) {
        dropCount++;
        info.type = 'PDFOptionList';
        info.kind = 'dropdown';
        try { info.options = field.getOptions(); } catch(e) { info.options = []; }
        try { info.currentValue = field.getSelected(); } catch(e) { info.currentValue = []; }
      } else {
        // Unknown type, skip
        return;
      }

      if (info.kind === 'dropdown') info.multiple = field.isMultiselect();
      formFields.push(info);
    });

    if (formFields.length === 0) {
      showNoFields();
      return;
    }

    // Show count bar
    fieldCountBadge.textContent = formFields.length + ' field' + (formFields.length !== 1 ? 's' : '');
    fieldCountBar.style.display = 'flex';
    fieldCountBar.innerHTML = '';
    if (textCount) fieldCountBar.innerHTML += '<span class="fc-item"><strong>' + textCount + '</strong> Text</span>';
    if (checkCount) fieldCountBar.innerHTML += '<span class="fc-item"><strong>' + checkCount + '</strong> Checkbox</span>';
    if (dropCount) fieldCountBar.innerHTML += '<span class="fc-item"><strong>' + dropCount + '</strong> Dropdown</span>';
    if (radioCount) fieldCountBar.innerHTML += '<span class="fc-item"><strong>' + radioCount + '</strong> Radio</span>';

    // Build field inputs
    fieldsPanel.innerHTML = '';
    formFields.forEach((info, idx) => {
      const group = document.createElement('div');
      group.className = 'field-group';
      info.groupEl = group;

      const label = document.createElement('div');
      label.className = 'field-label';

      const badgeClass = { text: 'ftb-text', checkbox: 'ftb-check', dropdown: 'ftb-drop', radio: 'ftb-radio' }[info.kind] || 'ftb-text';
      const kindLabel = { text: 'Text', checkbox: 'Check', dropdown: 'Dropdown', radio: 'Radio' }[info.kind] || 'Field';
      label.innerHTML = '<span class="field-type-badge ' + badgeClass + '">' + kindLabel + '</span> ' + '<span translate="no">' + escHtml(info.name) + '</span>';
      if (info.required) {
        const required = document.createElement('span');
        required.className = 'field-required';
        required.textContent = 'Required';
        label.appendChild(required);
      }
      group.appendChild(label);

      if (info.kind === 'text') {
        let el;
        if (info.isMultiline) {
          el = document.createElement('textarea');
        } else {
          el = document.createElement('input');
          el.type = 'text';
        }
        el.id = 'pdf-form-field-' + idx;
        label.id = 'pdf-form-label-' + idx;
        el.setAttribute('aria-labelledby', label.id);
        el.value = info.currentValue || '';
        el.placeholder = 'Enter value...';
        el.dataset.fieldIdx = idx;
        el.addEventListener('input', updateCompletion);
        group.appendChild(el);
        fieldElements[info.name] = el;

      } else if (info.kind === 'checkbox') {
        const lbl = document.createElement('label');
        lbl.className = 'check-label';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = 'pdf-form-field-' + idx;
        cb.setAttribute('aria-label', info.name);
        cb.checked = info.currentValue || false;
        cb.dataset.fieldIdx = idx;
        cb.addEventListener('change', updateCompletion);
        lbl.appendChild(cb);
        lbl.appendChild(document.createTextNode('Checked'));
        group.appendChild(lbl);
        fieldElements[info.name] = cb;

      } else if (info.kind === 'dropdown') {
        const sel = document.createElement('select');
        sel.multiple = !!info.multiple;
        sel.id = 'pdf-form-field-' + idx;
        label.id = 'pdf-form-label-' + idx;
        sel.setAttribute('aria-labelledby', label.id);
        sel.dataset.fieldIdx = idx;
        const defOpt = document.createElement('option');
        defOpt.value = '';
        defOpt.textContent = '-- Select --';
        sel.appendChild(defOpt);
        (info.options || []).forEach(opt => {
          const o = document.createElement('option');
          o.value = opt;
          o.textContent = opt;
          o.setAttribute('translate', 'no');
          if (Array.isArray(info.currentValue) ? info.currentValue.includes(opt) : info.currentValue === opt) o.selected = true;
          sel.appendChild(o);
        });
        sel.addEventListener('change', updateCompletion);
        group.appendChild(sel);
        fieldElements[info.name] = sel;

      } else if (info.kind === 'radio') {
        const rg = document.createElement('div');
        rg.className = 'radio-group';
        rg.setAttribute('role', 'radiogroup');
        rg.setAttribute('aria-label', info.name);
        const radioName = 'radio_' + idx;
        (info.options || []).forEach(opt => {
          const rl = document.createElement('label');
          const rb = document.createElement('input');
          rb.type = 'radio';
          rb.name = radioName;
          rb.value = opt;
          rb.dataset.fieldIdx = idx;
          rb.addEventListener('change', updateCompletion);
          if (info.currentValue === opt) rb.checked = true;
          rl.appendChild(rb);
          const optionLabel = document.createElement('span');
          optionLabel.setAttribute('translate', 'no'); optionLabel.textContent = opt;
          rl.appendChild(optionLabel);
          rg.appendChild(rl);
        });
        group.appendChild(rg);
        fieldElements[info.name] = rg;
      }

      fieldsPanel.appendChild(group);
    });

    noFieldsMsg.style.display = 'none';
    btnRow.style.display = 'flex';
    flattenRow.style.display = 'flex';
    completionMeter.style.display = 'block';
    downloadWrap.classList.add('on');
    downloadBtn.disabled = false;
    updateCompletion();
  }

  function showNoFields() {
    fieldsPanel.innerHTML = '';
    noFieldsMsg.style.display = 'block';
    fieldsPanel.appendChild(noFieldsMsg);
    noFieldsMsg.querySelector('.nf-icon').textContent = '';
    noFieldsMsg.querySelector('div:last-child').textContent = 'No interactive form fields detected. Use this tool for PDFs with real AcroForm fields.';
    btnRow.style.display = 'none';
    flattenRow.style.display = 'none';
    completionMeter.style.display = 'none';
    downloadWrap.classList.remove('on');
    downloadBtn.disabled = true;
    fieldCountBadge.textContent = '0 fields';
    fieldCountBar.style.display = 'none';
  }

  // Fill All / Clear All
  fillAllBtn.addEventListener('click', () => {
    formFields.forEach((info) => {
      const el = fieldElements[info.name];
      if (!el) return;
      if (info.kind === 'text') {
        el.value = 'Sample ' + info.name;
      } else if (info.kind === 'checkbox') {
        el.checked = true;
      } else if (info.kind === 'dropdown') {
        if (el.options.length > 1) el.selectedIndex = 1;
      } else if (info.kind === 'radio') {
        const radios = el.querySelectorAll('input[type="radio"]');
        if (radios.length > 0) radios[0].checked = true;
      }
    });
    updateCompletion();
  });

  clearAllBtn.addEventListener('click', () => {
    formFields.forEach((info) => {
      const el = fieldElements[info.name];
      if (!el) return;
      if (info.kind === 'text') {
        el.value = '';
      } else if (info.kind === 'checkbox') {
        el.checked = false;
      } else if (info.kind === 'dropdown') {
        Array.from(el.options).forEach(o => { o.selected = false; });
        if (!el.multiple) el.selectedIndex = 0;
      } else if (info.kind === 'radio') {
        const radios = el.querySelectorAll('input[type="radio"]');
        radios.forEach(r => r.checked = false);
      }
    });
    updateCompletion();
  });

  // Download filled PDF
  async function doFormDownload() {
    if (!pdfBytes || !formFields.length) return;
    updateCompletion();
    const missing = formFields.find(info => info.required && !getFieldElementValue(info));
    if (missing) {
      showStatus(message('required'), 'error');
      const el = fieldElements[missing.name];
      (missing.kind === 'radio' ? el.querySelector('input') : el).focus();
      return;
    }
    const version = sourceVersion;
    downloadBtn.disabled = true;
    downloadBtn.textContent = message('processing');
    showStatus('', 'success');

    try {
      // Reload doc fresh from original bytes to avoid mutation issues
      const freshDoc = await getPDFLib().PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      if (version !== sourceVersion) return;
      const form = freshDoc.getForm();

      formFields.forEach((info) => {
        const el = fieldElements[info.name];
        if (!el) return;

        try {
          if (info.kind === 'text') {
            const tf = form.getTextField(info.name);
            tf.setText(el.value || '');
          } else if (info.kind === 'checkbox') {
            const cb = form.getCheckBox(info.name);
            if (el.checked) cb.check(); else cb.uncheck();
          } else if (info.kind === 'dropdown') {
            const dd = info.type === 'PDFOptionList' ? form.getOptionList(info.name) : form.getDropdown(info.name);
            const values = Array.from(el.selectedOptions, o => o.value).filter(Boolean);
            if (values.length) dd.select(values); else dd.clear();
          } else if (info.kind === 'radio') {
            const rg = form.getRadioGroup(info.name);
            const selected = el.querySelector('input[type="radio"]:checked');
            if (selected) rg.select(selected.value); else rg.clear();
          }
        } catch (fieldErr) {
          throw fieldErr;
        }
      });

      if (flattenCheck.checked) {
        form.flatten();
      }

      const filledBytes = await freshDoc.save();
      if (version !== sourceVersion) return;

      // Trigger download
      const blob = new Blob([filledBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'filled-form.pdf';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      showStatus('PDF downloaded successfully' + (flattenCheck.checked ? ' (flattened)' : '') + '.', 'success');
    } catch (err) {
      if (version !== sourceVersion) return;
      showStatus(message('failed'), 'error');
    }

    if (version !== sourceVersion) return;
    downloadBtn.disabled = false;
    downloadBtn.textContent = message('download');
  }

  downloadBtn.addEventListener('click', () => {
    const gate = document.querySelector('email-gate-modal');
    if (gate) { gate.show(doFormDownload); } else { doFormDownload(); }
  });

  // Helpers
  function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

})();
