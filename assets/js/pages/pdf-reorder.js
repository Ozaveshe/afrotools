(function() {
  'use strict';

  /* ── DOM refs ── */
  const fileInput     = document.getElementById('fileInput');
  const dropZone      = document.getElementById('dropZone');
  const uploadCard    = document.getElementById('uploadCard');
  const workspaceCard = document.getElementById('workspaceCard');
  const fileNameEl    = document.getElementById('fileName');
  const pageGrid      = document.getElementById('pageGrid');
  const pageInfoEl    = document.getElementById('pageInfo');
  const selInfoEl     = document.getElementById('selectionInfo');
  const progressBar   = document.getElementById('progressBar');
  const progressFill  = document.getElementById('progressFill');
  const resultBar     = document.getElementById('resultBar');
  const resultMsg     = document.getElementById('resultMsg');

  const btnSelectAll  = document.getElementById('btnSelectAll');
  const btnDeselectAll= document.getElementById('btnDeselectAll');
  const btnRotateCW   = document.getElementById('btnRotateCW');
  const btnRotateCCW  = document.getElementById('btnRotateCCW');
  const btnDelete     = document.getElementById('btnDelete');
  const btnReset      = document.getElementById('btnReset');
  const btnDownload   = document.getElementById('btnDownload');
  const btnNewFile    = document.getElementById('btnNewFile');
  const btnAddPdf     = document.getElementById('btnAddPdf');
  const btnUndo       = document.getElementById('btnUndo');
  const btnDuplicate  = document.getElementById('btnDuplicate');
  const btnReverse    = document.getElementById('btnReverse');
  const btnExtract    = document.getElementById('btnExtract');
  const btnSelectRange= document.getElementById('btnSelectRange');
  const insertFileInput = document.getElementById('insertFileInput');
  const pageRangeInput = document.getElementById('pageRangeInput');

  const deleteModal   = document.getElementById('deleteModal');
  const deleteDesc    = document.getElementById('deleteModalDesc');
  const btnCancelDel  = document.getElementById('btnCancelDelete');
  const btnConfirmDel = document.getElementById('btnConfirmDelete');
  const reviewConfirm = document.getElementById('reviewConfirm');

  const locale = (document.documentElement.lang || 'en').slice(0, 2);
  const COPY = {
  "Review required: tick the checkbox after checking the visible page order before downloading.": {
    "fr": "Vérifiez l’ordre affiché des pages, puis cochez la case avant de télécharger.",
    "sw": "Kagua mpangilio wa kurasa unaoonekana, kisha weka tiki kabla ya kupakua."
  },
  "Review the visible page order, then tick the checkbox before download.": {
    "fr": "Vérifiez l’ordre des pages, puis cochez la case avant de télécharger.",
    "sw": "Kagua mpangilio wa kurasa, kisha weka tiki kabla ya kupakua."
  },
  "Loading thumbnails...": {
    "fr": "Chargement des aperçus…",
    "sw": "Inapakia vijipicha…"
  },
  "Loading PDF...": {
    "fr": "Chargement du PDF…",
    "sw": "Inapakia PDF…"
  },
  "Ready: {0} pages loaded. Review the order before downloading.": {
    "fr": "Prêt : {0} pages chargées. Vérifiez l’ordre avant de télécharger.",
    "sw": "Tayari: kurasa {0} zimepakiwa. Kagua mpangilio kabla ya kupakua."
  },
  "This PDF could not be opened. Choose a readable PDF and try again.": {
    "fr": "Ce PDF ne peut pas être ouvert. Choisissez un PDF lisible et réessayez.",
    "sw": "PDF hii haiwezi kufunguliwa. Chagua PDF inayosomeka kisha ujaribu tena."
  },
  "The PDF could not be exported. Review the pages and try again.": {
    "fr": "Le PDF n’a pas pu être exporté. Vérifiez les pages et réessayez.",
    "sw": "PDF haikuweza kupakuliwa. Kagua kurasa kisha ujaribu tena."
  },
  "Pages could not be added. Check the PDF files and try again.": {
    "fr": "Les pages n’ont pas pu être ajoutées. Vérifiez les fichiers PDF et réessayez.",
    "sw": "Kurasa hazikuweza kuongezwa. Kagua faili za PDF kisha ujaribu tena."
  },
  "Page {0}": {
    "fr": "Page {0}",
    "sw": "Ukurasa {0}"
  },
  "{0} pages": {
    "fr": "{0} pages",
    "sw": "Kurasa {0}"
  },
  "{0} selected": {
    "fr": "{0} sélectionnées",
    "sw": "{0} zimechaguliwa"
  },
  " from {0} PDFs": {
    "fr": " de {0} PDF",
    "sw": " kutoka PDF {0}"
  },
  "Enter a valid range, for example 1-3, 7.": {
    "fr": "Saisissez des pages valides, par exemple 1-3, 7, dans les limites du document.",
    "sw": "Weka kurasa halali, kwa mfano 1-3, 7, ndani ya mipaka ya hati."
  },
  "{0} pages duplicated": {
    "fr": "Pages dupliquées : {0}",
    "sw": "Kurasa {0} zimenakiliwa"
  },
  "Extracting...": {
    "fr": "Extraction…",
    "sw": "Inatoa kurasa…"
  },
  "Extracted {0} pages ({1})": {
    "fr": "Pages extraites : {0} ({1})",
    "sw": "Kurasa {0} zimetolewa ({1})"
  },
  "Extract": {
    "fr": "Extraire",
    "sw": "Toa kurasa"
  },
  "Adding PDF pages...": {
    "fr": "Ajout des pages PDF…",
    "sw": "Inaongeza kurasa za PDF…"
  },
  "Added {0} pages.": {
    "fr": "Pages ajoutées : {0}.",
    "sw": "Kurasa {0} zimeongezwa."
  },
  "Keep at least one page in the PDF.": {
    "fr": "Conservez au moins une page dans le PDF.",
    "sw": "Hifadhi angalau ukurasa mmoja katika PDF."
  },
  "Delete {0} pages? Use Reset to restore all pages.": {
    "fr": "Supprimer {0} pages ? Utilisez Réinitialiser pour rétablir toutes les pages.",
    "sw": "Futa kurasa {0}? Tumia Weka upya kurejesha kurasa zote."
  },
  "{0} pages deleted": {
    "fr": "Pages supprimées : {0}",
    "sw": "Kurasa {0} zimefutwa"
  },
  "Reset to the original uploaded PDF.": {
    "fr": "Le PDF d’origine a été rétabli.",
    "sw": "PDF ya awali imewekwa upya."
  },
  "Reset to original page order": {
    "fr": "Ordre initial rétabli",
    "sw": "Mpangilio wa awali umerejeshwa"
  },
  "Building PDF...": {
    "fr": "Création du PDF…",
    "sw": "Inatengeneza PDF…"
  },
  "PDF downloaded: {0} pages ({1})": {
    "fr": "PDF téléchargé : {0} pages ({1})",
    "sw": "PDF imepakuliwa: kurasa {0} ({1})"
  },
  "Upload a PDF to start organizing pages.": {
    "fr": "Importez un PDF pour organiser ses pages.",
    "sw": "Pakia PDF ili kupanga kurasa."
  },
  "Download PDF": {
    "fr": "Télécharger le PDF",
    "sw": "Pakua PDF"
  },
  "Last edit restored.": {
    "fr": "La dernière modification a été annulée.",
    "sw": "Badiliko la mwisho limetenguliwa."
  },
  "Rotate CCW": {
    "fr": "Tourner à gauche",
    "sw": "Zungusha kushoto"
  },
  "Rotate CW": {
    "fr": "Tourner à droite",
    "sw": "Zungusha kulia"
  },
  "Delete page": {
    "fr": "Supprimer la page",
    "sw": "Futa ukurasa"
  }
};
  function tr(key, values) {
    const text = COPY[key] && COPY[key][locale] || key;
    return values ? text.replace(/\{(\d+)\}/g, (_, i) => values[i]) : text;
  }
  function toast(text, error) {
    PdfUtils.showToast(text, error);
    const node = document.getElementById('pu-toast');
    if (node) node.setAttribute('translate', 'no');
  }

  [resultMsg, pageInfoEl, selInfoEl, deleteDesc, fileNameEl].forEach(el => el.setAttribute('translate', 'no'));
  /* ── State ── */
  let currentFile     = null;   // original File
  let originalBytes   = null;   // ArrayBuffer of original
  let pdfJsDoc        = null;   // pdf.js document (for rendering)
  let documents       = [];     // [{id, name, bytes, pageCount}]
  let nextDocId       = 1;
  let pages           = [];     // [{docId, origIndex, rotation, thumbDataUrl}]
  let originalPages   = [];     // clone for reset
  let selectedSet     = new Set();
  let dragSrcIdx      = null;
  let lastClickIdx    = null;
  let historyStack    = [];
  let lastModalFocus  = null;

  function isPdfFile(file) {
    return !!(file && ((file.type && file.type === 'application/pdf') || /\.pdf$/i.test(file.name || '')));
  }

  function clonePage(page) {
    return {
      docId: page.docId,
      origIndex: page.origIndex,
      rotation: page.rotation || 0,
      thumbDataUrl: page.thumbDataUrl || null
    };
  }

  function clonePageList(list) {
    return list.map(clonePage);
  }

  function selectedIndices() {
    return Array.from(selectedSet).sort((a, b) => a - b);
  }

  function resetReview() {
    if (reviewConfirm) reviewConfirm.checked = false;
  }

  function requireReview() {
    if (!reviewConfirm || reviewConfirm.checked) return true;
    resultBar.classList.remove('error');
    resultBar.classList.add('on');
    resultMsg.textContent = tr('Review required: tick the checkbox after checking the visible page order before downloading.');
    if (window.PdfUtils) toast(tr('Review the visible page order, then tick the checkbox before download.'), true);
    reviewConfirm.focus();
    return false;
  }

  function pushHistory(label) {
    resetReview();
    historyStack.push({
      label: label || 'Edit',
      pages: clonePageList(pages),
      selected: selectedIndices()
    });
    if (historyStack.length > 30) historyStack.shift();
    btnUndo.disabled = historyStack.length === 0;
  }

  function restoreSnapshot(snapshot) {
    pages = clonePageList(snapshot.pages);
    selectedSet = new Set(snapshot.selected.filter(idx => idx >= 0 && idx < pages.length));
    resultBar.classList.remove('error');
    resultBar.classList.add('on');
    resultMsg.textContent = tr('Last edit restored.');
    renderGrid();
    updateToolbar();
  }

  function parsePageRange(input, total) {
    const clean = (input || '').trim();
    if (!clean) return [];
    const selected = new Set();
    for (const part of clean.split(',')) {
      const match = part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) return [];
      const start = Number(match[1]);
      const end = match[2] === undefined ? start : Number(match[2]);
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start || end > total) return [];
      for (let page = start; page <= end; page++) selected.add(page - 1);
    }
    return Array.from(selected).sort((a, b) => a - b);
  }

  function sourceLabel(page) {
    const doc = documents.find(d => d.id === page.docId);
    if (!doc) return 'Source page ' + (page.origIndex + 1);
    return doc.name + ' · ' + tr('Page {0}', [page.origIndex + 1]);
  }

  async function loadPdfFileAsPages(file, docId) {
    const result = await PdfUtils.loadPdf(file);
    const docRecord = {
      id: docId,
      name: file.name,
      bytes: result.arrayBuffer.slice(0),
      pageCount: result.pageCount
    };
    const importedPages = [];
    for (let i = 0; i < result.pageCount; i++) {
      const page = { docId: docId, origIndex: i, rotation: 0, thumbDataUrl: null };
      try {
        const canvas = await PdfUtils.renderThumb(result.pdfDoc, i + 1);
        page.thumbDataUrl = canvas.toDataURL('image/jpeg', 0.6);
      } catch (e) { /* thumbnail fallback is handled by renderGrid */ }
      importedPages.push(page);
      progressFill.style.width = ((i + 1) / result.pageCount * 100) + '%';
    }
    return { doc: docRecord, pages: importedPages, pdfDoc: result.pdfDoc };
  }

  async function buildPdfBytes(pageList) {
    if (!window.PDFLib) throw new Error('PDF library failed to load. Please refresh the page.');
    const { PDFDocument, degrees } = window.PDFLib;
    const outDoc = await PDFDocument.create();
    const cache = new Map();

    for (const pg of pageList) {
      const docRecord = documents.find(d => d.id === pg.docId);
      if (!docRecord) throw new Error('Missing source PDF for page ' + (pg.origIndex + 1));
      if (!cache.has(pg.docId)) {
        cache.set(pg.docId, await PDFDocument.load(docRecord.bytes.slice(0)));
      }
      const srcDoc = cache.get(pg.docId);
      const [copied] = await outDoc.copyPages(srcDoc, [pg.origIndex]);
      if (pg.rotation) {
        const currentRot = copied.getRotation().angle || 0;
        copied.setRotation(degrees((currentRot + pg.rotation) % 360));
      }
      outDoc.addPage(copied);
    }

    return outDoc.save();
  }

  /* ── Drag-drop upload ── */
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('dragover'); });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(isPdfFile);
    if (files.length) loadFile(files[0]);
  });
  fileInput.addEventListener('change', () => { if (isPdfFile(fileInput.files[0])) loadFile(fileInput.files[0]); });

  /* ── Load PDF ── */
  async function loadFile(file) {
    currentFile = file;
    documents = [];
    nextDocId = 1;
    historyStack = [];
    uploadCard.style.display = 'none';
    workspaceCard.style.display = '';
    fileNameEl.textContent = file.name;
    resultBar.classList.remove('error');
    resultBar.classList.add('on');
    resultMsg.textContent = tr('Loading thumbnails...');
    selectedSet.clear();
    pageGrid.innerHTML = '<div class="loading-overlay" style="position:relative;padding:60px 0;"><div class="loading-spinner"></div><div class="loading-text">' + tr('Loading PDF...') + '</div></div>';

    progressBar.style.display = 'block';
    progressFill.style.width = '0%';

    try {
      const imported = await loadPdfFileAsPages(file, 'doc0');
      originalBytes = imported.doc.bytes;
      pdfJsDoc = imported.pdfDoc;
      documents = [imported.doc];
      pages = clonePageList(imported.pages);
      originalPages = clonePageList(pages);
      progressBar.style.display = 'none';
      resultMsg.textContent = tr('Ready: {0} pages loaded. Review the order before downloading.', [pages.length]);
      renderGrid();
      updateToolbar();
    } catch (err) {
      pageGrid.innerHTML = '';
      progressBar.style.display = 'none';
      toast(tr('This PDF could not be opened. Choose a readable PDF and try again.'), true);
      resetToUpload();
    }
  }

  /* ── Render Grid ── */
  function renderGrid() {
    pageGrid.innerHTML = '';
    lastClickIdx = null;
    pages.forEach((pg, idx) => {
      const card = document.createElement('div');
      card.setAttribute('translate', 'no');
      card.className = 'page-card' + (selectedSet.has(idx) ? ' selected' : '');
      card.draggable = true;
      card.dataset.idx = idx;
      card.title = sourceLabel(pg);
      card.setAttribute('role', 'checkbox');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-checked', selectedSet.has(idx) ? 'true' : 'false');
      card.setAttribute('aria-label', tr('Page {0}', [idx + 1]) + ': ' + sourceLabel(pg));

      // Check indicator
      const check = document.createElement('div');
      check.className = 'page-check';
      card.appendChild(check);

      // Per-page action buttons
      const actions = document.createElement('div');
      actions.className = 'page-actions';
      actions.innerHTML =
        '<button type="button" class="pa-btn" data-action="rotateCCW" title="Rotate CCW"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></button>' +
        '<button type="button" class="pa-btn" data-action="rotateCW" title="Rotate CW"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></button>' +
        '<button type="button" class="pa-btn pa-del" data-action="deletePage" title="Delete page"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
      actions.querySelectorAll('button').forEach(button => { button.title = tr(button.title); button.setAttribute('aria-label', button.title); });
      card.appendChild(actions);

      // Thumbnail
      const thumb = document.createElement('div');
      thumb.className = 'page-thumb';
      if (pg.thumbDataUrl) {
        const img = document.createElement('img');
        img.src = pg.thumbDataUrl;
        img.alt = tr('Page {0}', [idx + 1]);
        img.draggable = false;
        if (pg.rotation) img.style.transform = 'rotate(' + pg.rotation + 'deg)';
        thumb.appendChild(img);
      } else {
        const ph = document.createElement('div');
        ph.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:12px;color:#9ca3af;font-weight:700;';
        ph.textContent = tr('Page {0}', [idx + 1]);
        thumb.appendChild(ph);
      }
      card.appendChild(thumb);

      // Label
      const label = document.createElement('div');
      label.className = 'page-label';
      const pageNum = document.createElement('span');
      pageNum.className = 'page-num';
      pageNum.textContent = tr('Page {0}', [idx + 1]);
      label.appendChild(pageNum);
      if (pg.rotation) {
        const rotation = document.createElement('span');
        rotation.className = 'page-rotation';
        rotation.textContent = pg.rotation + '°';
        label.appendChild(rotation);
      }
      card.appendChild(label);

      // Click to select
      card.addEventListener('click', e => {
        if (e.target.closest('.page-actions')) return;
        handleSelect(idx, e);
      });
      card.addEventListener('keydown', e => {
        if (e.target !== card) return; // Nested action buttons retain native keyboard activation.
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          handleSelect(idx, e);
          return;
        }
        if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          e.preventDefault();
          const target = e.key === 'ArrowLeft' ? idx - 1 : idx + 1;
          if (target < 0 || target >= pages.length) return;
          pushHistory('Keyboard reorder');
          const moved = pages.splice(idx, 1)[0];
          pages.splice(target, 0, moved);
          selectedSet = new Set([target]);
          renderGrid();
          updateToolbar();
          const movedCard = pageGrid.querySelector('[data-idx="' + target + '"]');
          if (movedCard) movedCard.focus();
        }
      });

      // Per-page actions
      actions.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === 'rotateCW') { rotatePage(idx, 90); }
        else if (action === 'rotateCCW') { rotatePage(idx, -90); }
        else if (action === 'deletePage') {
          selectedSet.clear();
          selectedSet.add(idx);
          showDeleteModal();
        }
        if (e.detail === 0 && (action === 'rotateCW' || action === 'rotateCCW')) {
          const replacement = pageGrid.querySelector('[data-idx="' + idx + '"] [data-action="' + action + '"]');
          if (replacement) replacement.focus();
        }
      });

      // Drag events
      card.addEventListener('dragstart', e => {
        dragSrcIdx = idx;
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', idx);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        document.querySelectorAll('.page-card.drag-over').forEach(c => c.classList.remove('drag-over'));
        dragSrcIdx = null;
      });
      card.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragSrcIdx !== null && dragSrcIdx !== idx) {
          card.classList.add('drag-over');
        }
      });
      card.addEventListener('dragleave', () => { card.classList.remove('drag-over'); });
      card.addEventListener('drop', e => {
        e.preventDefault();
        card.classList.remove('drag-over');
        if (dragSrcIdx === null || dragSrcIdx === idx) return;
        pushHistory('Reorder pages');
        const moved = pages.splice(dragSrcIdx, 1)[0];
        pages.splice(idx, 0, moved);
        // Remap selected set
        selectedSet.clear();
        renderGrid();
        updateToolbar();
      });

      pageGrid.appendChild(card);
    });
  }

  /* ── Selection ── */
  function handleSelect(idx, e) {
    resetReview();
    if (e.shiftKey && lastClickIdx !== null) {
      // Range select
      const start = Math.min(lastClickIdx, idx);
      const end = Math.max(lastClickIdx, idx);
      for (let i = start; i <= end; i++) selectedSet.add(i);
    } else if (e.ctrlKey || e.metaKey) {
      // Toggle
      if (selectedSet.has(idx)) selectedSet.delete(idx);
      else selectedSet.add(idx);
    } else {
      // Single click
      if (selectedSet.size === 1 && selectedSet.has(idx)) {
        selectedSet.clear();
      } else {
        selectedSet.clear();
        selectedSet.add(idx);
      }
    }
    lastClickIdx = idx;
    renderGrid();
    updateToolbar();
  }

  function updateToolbar() {
    const sel = selectedSet.size;
    const total = pages.length;
    pageInfoEl.textContent = tr('{0} pages', [total]) + (documents.length > 1 ? tr(' from {0} PDFs', [documents.length]) : '');

    if (sel > 0) {
      selInfoEl.style.display = '';
      selInfoEl.textContent = tr('{0} selected', [sel]);
    } else {
      selInfoEl.style.display = 'none';
    }

    btnDeselectAll.disabled = sel === 0;
    btnRotateCW.disabled = sel === 0;
    btnRotateCCW.disabled = sel === 0;
    btnDelete.disabled = sel === 0 || total <= 1 || sel >= total;
    btnDuplicate.disabled = sel === 0;
    btnExtract.disabled = sel === 0;
    btnReverse.disabled = total < 2 || (sel === 1);
    btnSelectRange.disabled = total === 0;
    btnDownload.disabled = total === 0;
    btnUndo.disabled = historyStack.length === 0;
  }

  /* ── Select / Deselect All ── */
  btnSelectAll.addEventListener('click', () => {
    resetReview();
    for (let i = 0; i < pages.length; i++) selectedSet.add(i);
    renderGrid();
    updateToolbar();
  });
  btnDeselectAll.addEventListener('click', () => {
    resetReview();
    selectedSet.clear();
    renderGrid();
    updateToolbar();
  });
  btnSelectRange.addEventListener('click', () => {
    const range = parsePageRange(pageRangeInput.value, pages.length);
    if (!range.length) {
      toast(tr('Enter a valid range, for example 1-3, 7.'), true);
      return;
    }
    resetReview();
    selectedSet = new Set(range);
    renderGrid();
    updateToolbar();
  });
  pageRangeInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') btnSelectRange.click();
  });

  /* ── Rotate ── */
  function rotatePage(idx, deg) {
    pushHistory('Rotate page');
    pages[idx].rotation = ((pages[idx].rotation || 0) + deg + 360) % 360;
    renderGrid();
    updateToolbar();
  }

  btnRotateCW.addEventListener('click', () => {
    pushHistory('Rotate selected pages');
    selectedSet.forEach(idx => { pages[idx].rotation = ((pages[idx].rotation || 0) + 90) % 360; });
    renderGrid();
    updateToolbar();
  });
  btnRotateCCW.addEventListener('click', () => {
    pushHistory('Rotate selected pages');
    selectedSet.forEach(idx => { pages[idx].rotation = ((pages[idx].rotation || 0) + 270) % 360; });
    renderGrid();
    updateToolbar();
  });

  btnUndo.addEventListener('click', () => {
    const snapshot = historyStack.pop();
    if (!snapshot) return;
    restoreSnapshot(snapshot);
    btnUndo.disabled = historyStack.length === 0;
  });

  btnDuplicate.addEventListener('click', () => {
    const indices = selectedIndices();
    if (!indices.length) return;
    pushHistory('Duplicate pages');
    let offset = 0;
    indices.forEach(idx => {
      const sourceIdx = idx + offset;
      const insertAt = sourceIdx + 1;
      pages.splice(insertAt, 0, clonePage(pages[sourceIdx]));
      offset += 1;
    });
    selectedSet = new Set(indices.map((idx, i) => idx + i + 1));
    renderGrid();
    updateToolbar();
    toast(tr('{0} pages duplicated', [indices.length]));
  });

  btnReverse.addEventListener('click', () => {
    if (pages.length < 2) return;
    pushHistory(selectedSet.size >= 2 ? 'Reverse selected pages' : 'Reverse all pages');
    if (selectedSet.size >= 2) {
      const indices = selectedIndices();
      const reversed = indices.map(idx => clonePage(pages[idx])).reverse();
      indices.forEach((idx, i) => { pages[idx] = reversed[i]; });
    } else {
      pages.reverse();
      selectedSet.clear();
    }
    renderGrid();
    updateToolbar();
  });

  btnExtract.addEventListener('click', async () => {
    const indices = selectedIndices();
    if (!indices.length) return;
    if (!requireReview()) return;
    btnExtract.disabled = true;
    btnExtract.textContent = tr('Extracting...');
    try {
      const extractedPages = indices.map(idx => pages[idx]);
      const pdfBytes = await buildPdfBytes(extractedPages);
      const baseName = (currentFile ? currentFile.name : 'document').replace(/\.pdf$/i, '');
      PdfUtils.downloadPdf(pdfBytes, baseName + '_selected_pages.pdf');
      resultBar.classList.remove('error');
      resultBar.classList.add('on');
      resultMsg.textContent = tr('Extracted {0} pages ({1})', [indices.length, PdfUtils.formatSize(pdfBytes.byteLength)]);
    } catch (err) {
      resultBar.classList.add('on', 'error');
      resultMsg.textContent = tr('The PDF could not be exported. Review the pages and try again.');
    }
    btnExtract.disabled = false;
    btnExtract.textContent = tr('Extract');
  });

  btnAddPdf.addEventListener('click', () => {
    insertFileInput.value = '';
    insertFileInput.click();
  });

  insertFileInput.addEventListener('change', async () => {
    const files = Array.from(insertFileInput.files || []).filter(isPdfFile);
    if (!files.length) return;
    pushHistory('Add pages');
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';
    resultBar.classList.remove('error');
    resultBar.classList.add('on');
    resultMsg.textContent = tr('Adding PDF pages...');
    try {
      const insertAt = selectedSet.size === 1 ? selectedIndices()[0] + 1 : pages.length;
      const importedPages = [];
      for (const file of files) {
        const docId = 'doc' + nextDocId++;
        const imported = await loadPdfFileAsPages(file, docId);
        documents.push(imported.doc);
        importedPages.push(...imported.pages);
      }
      pages.splice(insertAt, 0, ...clonePageList(importedPages));
      selectedSet = new Set(importedPages.map((_, i) => insertAt + i));
      progressBar.style.display = 'none';
      resultMsg.textContent = tr('Added {0} pages.', [importedPages.length]);
      renderGrid();
      updateToolbar();
    } catch (err) {
      progressBar.style.display = 'none';
      resultBar.classList.add('on', 'error');
      resultMsg.textContent = tr('Pages could not be added. Check the PDF files and try again.');
    }
  });

  /* ── Delete ── */
  function showDeleteModal() {
    const count = selectedSet.size;
    if (count === 0) return;
    if (count >= pages.length) {
      toast(tr('Keep at least one page in the PDF.'), true);
      return;
    }
    deleteDesc.textContent = tr('Delete {0} pages? Use Reset to restore all pages.', [count]);
    lastModalFocus = document.activeElement;
    deleteModal.classList.add('on');
    btnCancelDel.focus();
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('on');
    if (lastModalFocus && typeof lastModalFocus.focus === 'function') lastModalFocus.focus();
    lastModalFocus = null;
  }

  btnDelete.addEventListener('click', showDeleteModal);
  btnCancelDel.addEventListener('click', closeDeleteModal);
  btnConfirmDel.addEventListener('click', () => {
    deleteModal.classList.remove('on');
    pushHistory('Delete pages');
    // Delete selected pages (in reverse order to keep indices stable)
    const toDelete = Array.from(selectedSet).sort((a, b) => b - a);
    toDelete.forEach(idx => pages.splice(idx, 1));
    selectedSet.clear();
    renderGrid();
    updateToolbar();
    lastModalFocus = null;
    const firstRemainingPage = pageGrid.querySelector('.page-card');
    if (firstRemainingPage) firstRemainingPage.focus();
    toast(tr('{0} pages deleted', [toDelete.length]));
  });

  // Close modal on overlay click
  deleteModal.addEventListener('click', e => { if (e.target === deleteModal) closeDeleteModal(); });
  deleteModal.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDeleteModal();
    }
  });

  /* ── Reset ── */
  btnReset.addEventListener('click', () => {
    pushHistory('Reset workspace');
    pages = clonePageList(originalPages);
    selectedSet.clear();
    resultBar.classList.remove('error');
    resultBar.classList.add('on');
    resultMsg.textContent = tr('Reset to the original uploaded PDF.');
    renderGrid();
    updateToolbar();
    toast(tr('Reset to original page order'));
  });

  /* ── Download ── */
  btnDownload.addEventListener('click', async () => {
    if (pages.length === 0) return;
    if (!requireReview()) return;

    btnDownload.disabled = true;
    btnDownload.textContent = tr('Building PDF...');
    resultBar.classList.remove('error');
    resultBar.classList.add('on');
    resultMsg.textContent = tr('Building PDF...');

    try {
      const pdfBytes = await buildPdfBytes(pages);
      const baseName = currentFile.name.replace(/\.pdf$/i, '');
      PdfUtils.downloadPdf(pdfBytes, baseName + '_managed.pdf');

      resultBar.classList.remove('error');
      resultBar.classList.add('on');
      resultMsg.textContent = tr('PDF downloaded: {0} pages ({1})', [pages.length, PdfUtils.formatSize(pdfBytes.byteLength)]);
    } catch (err) {
      resultBar.classList.add('on', 'error');
      resultMsg.textContent = tr('The PDF could not be exported. Review the pages and try again.');
    }

    btnDownload.disabled = false;
    btnDownload.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> ' + tr('Download PDF');
  });

  /* ── New File ── */
  btnNewFile.addEventListener('click', resetToUpload);

  function resetToUpload() {
    currentFile = null;
    originalBytes = null;
    pdfJsDoc = null;
    documents = [];
    nextDocId = 1;
    pages = [];
    originalPages = [];
    selectedSet.clear();
    historyStack = [];
    pageRangeInput.value = '';
    fileInput.value = '';
    uploadCard.style.display = '';
    workspaceCard.style.display = 'none';
    resultBar.classList.remove('on', 'error');
    resultMsg.textContent = tr('Upload a PDF to start organizing pages.');
    updateToolbar();
  }

  /* ── Touch drag support (mobile) ── */
  let touchSrcIdx = null;
  let touchClone = null;
  let touchTarget = null;

  pageGrid.addEventListener('touchstart', e => {
    const card = e.target.closest('.page-card');
    if (!card || e.target.closest('.page-actions')) return;

    // Long-press to start drag
    const timer = setTimeout(() => {
      touchSrcIdx = parseInt(card.dataset.idx);
      card.classList.add('dragging');

      touchClone = card.cloneNode(true);
      touchClone.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;opacity:0.8;width:' + card.offsetWidth + 'px;transform:rotate(3deg);';
      document.body.appendChild(touchClone);

      const touch = e.touches[0];
      touchClone.style.left = (touch.clientX - card.offsetWidth / 2) + 'px';
      touchClone.style.top = (touch.clientY - 30) + 'px';
    }, 300);

    const startX = e.touches[0].clientX;
    const startY = e.touches[0].clientY;

    const onMove = (me) => {
      const dx = me.touches[0].clientX - startX;
      const dy = me.touches[0].clientY - startY;
      // Only cancel if moved more than 10px (prevents accidental cancellation)
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        clearTimeout(timer);
        card.removeEventListener('touchmove', onMove);
        card.removeEventListener('touchend', onEnd);
      }
    };
    const onEnd = () => {
      clearTimeout(timer);
      card.removeEventListener('touchmove', onMove);
      card.removeEventListener('touchend', onEnd);
    };

    card.addEventListener('touchmove', onMove);
    card.addEventListener('touchend', onEnd, { once: true });
  }, { passive: true });

  pageGrid.addEventListener('touchmove', e => {
    if (touchSrcIdx === null || !touchClone) return;
    e.preventDefault();

    const touch = e.touches[0];
    touchClone.style.left = (touch.clientX - touchClone.offsetWidth / 2) + 'px';
    touchClone.style.top = (touch.clientY - 30) + 'px';

    // Find target card
    const elem = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetCard = elem ? elem.closest('.page-card') : null;

    document.querySelectorAll('.page-card.drag-over').forEach(c => c.classList.remove('drag-over'));
    if (targetCard && parseInt(targetCard.dataset.idx) !== touchSrcIdx) {
      targetCard.classList.add('drag-over');
      touchTarget = parseInt(targetCard.dataset.idx);
    } else {
      touchTarget = null;
    }
  }, { passive: false });

  pageGrid.addEventListener('touchend', () => {
    if (touchSrcIdx !== null && touchTarget !== null && touchSrcIdx !== touchTarget) {
      pushHistory('Reorder pages');
      const moved = pages.splice(touchSrcIdx, 1)[0];
      pages.splice(touchTarget, 0, moved);
      selectedSet.clear();
      renderGrid();
      updateToolbar();
    }

    document.querySelectorAll('.page-card.dragging').forEach(c => c.classList.remove('dragging'));
    document.querySelectorAll('.page-card.drag-over').forEach(c => c.classList.remove('drag-over'));
    if (touchClone) { touchClone.remove(); touchClone = null; }
    touchSrcIdx = null;
    touchTarget = null;
  });

})();
