(function () {
  'use strict';

  var MAX_CANVAS_PIXELS = 16000000;
  var LARGE_FILE_BYTES = 50 * 1024 * 1024;
  var ZIP_NAME = 'compressed_pdfs.zip';
  var state = {
    files: [],
    preset: 'screen',
    busy: false,
    results: [],
    download: null
  };
  var els = {};

  // Only compressor-owned display text is localized; filenames and PDF contents are not translated.
  var stageCopy = {
    'Starting compression...': ['Démarrage de la compression…', 'Inaanza kubana…'],
    'Preparing local browser memory; no upload is happening': ['Préparation de la mémoire locale ; aucun téléversement', 'Inaandaa kumbukumbu ya kivinjari; hakuna upakiaji'],
    'Analyzing PDF structure...': ['Analyse de la structure du PDF…', 'Inachanganua muundo wa PDF…'],
    'Checking pages, objects, and existing compression': ['Vérification des pages, objets et de la compression existante', 'Inakagua kurasa, vipengele na ubanaji uliopo'],
    'Rewriting PDF efficiently...': ['Réécriture optimisée du PDF…', 'Inaandika PDF upya kwa ufanisi…'],
    'Repacking the PDF while preserving its document structure': ['Réorganisation du PDF en conservant sa structure', 'Inapanga PDF upya huku ikihifadhi muundo wake'],
    'Clean pass complete': ['Nettoyage terminé', 'Hatua safi imekamilika'],
    'The local rewrite finished; preparing the result': ['Réécriture locale terminée ; préparation du résultat', 'Uandishi wa ndani umekamilika; inaandaa matokeo'],
    'Opening pages for image compression...': ['Ouverture des pages pour la compression en images…', 'Inafungua kurasa kwa ubanaji wa picha…'],
    'Preparing the local PDF renderer': ['Préparation du moteur de rendu PDF local', 'Inaandaa uonyeshaji wa PDF kwenye kifaa'],
    'Compressing page images locally': ['Compression des images de pages sur cet appareil', 'Inabana picha za kurasa kwenye kifaa'],
    'Releasing page memory before continuing': ['Libération de la mémoire de la page avant de continuer', 'Inaachia kumbukumbu ya ukurasa kabla ya kuendelea'],
    'Packing compressed PDF...': ['Assemblage du PDF compressé…', 'Inaunganisha PDF iliyobanwa…'],
    'Writing the rebuilt pages into one local PDF': ['Écriture des pages reconstruites dans un PDF local', 'Inaandika kurasa zilizoundwa upya katika PDF moja ya ndani'],
    'Image compression pass complete': ['Compression en images terminée', 'Ubanaji wa picha umekamilika'],
    'The rebuilt PDF is ready for size comparison': ['Le PDF reconstruit est prêt pour la comparaison des tailles', 'PDF iliyoundwa upya iko tayari kulinganishwa ukubwa'],
    'Reading the PDF on this device; no upload is happening': ['Lecture du PDF sur cet appareil ; aucun téléversement', 'Inasoma PDF kwenye kifaa hiki; hakuna upakiaji'],
    'Preparing clean result...': ['Préparation du résultat du nettoyage…', 'Inaandaa matokeo ya hatua safi…'],
    'Comparing the rewritten PDF with the original size': ['Comparaison du PDF réécrit avec la taille d’origine', 'Inalinganisha ukubwa wa PDF iliyoandikwa upya na asili'],
    'The clean rewrite met the size goal and preserved selectable text': ['Le nettoyage a atteint la taille visée et conservé le texte sélectionnable', 'Hatua safi imefikia ukubwa uliolengwa na kuhifadhi maandishi yanayochagulika'],
    'Preparing download...': ['Préparation du téléchargement…', 'Inaandaa upakuaji…'],
    'Building the final local PDF or ZIP result': ['Création du PDF ou ZIP final sur cet appareil', 'Inaunda PDF au ZIP ya mwisho kwenye kifaa'],
    'Compression complete': ['Compression terminée', 'Ubanaji umekamilika'],
    'Compression failed': ['Échec de la compression', 'Ubanaji umeshindikana'],
    'Waiting to start': ['En attente du démarrage', 'Inasubiri kuanza'],
    'DPI, quality, target': ['PPP, qualité, taille cible', 'DPI, ubora, ukubwa lengwa'],
    'Processing locally': ['Traitement local', 'Inachakata kwenye kifaa'],
    'Compressing...': ['Compression en cours…', 'Inabana…'],
    'Compress PDF': ['Compresser un PDF', 'Bana PDF'],
    'Download compressed PDF': ['Télécharger le PDF compressé', 'Pakua PDF iliyobanwa'],
    'Download ZIP': ['Télécharger le ZIP', 'Pakua ZIP'],
    'Grayscale was applied. The converted PDF is not smaller than the original.': ['Le PDF a été converti en niveaux de gris. Il n’est pas plus petit que l’original.', 'PDF imebadilishwa kuwa kijivu. Ukubwa wake haujapungua ikilinganishwa na asili.'],
    'Clean': ['Nettoyage', 'Safi'], 'Balanced': ['Équilibré', 'Wastani'], 'Strong': ['Fort', 'Nguvu'],
    'High quality': ['Haute qualité', 'Ubora wa juu'], 'Custom': ['Personnalisé', 'Maalum'],
    'Clean fallback': ['Repli vers le nettoyage', 'Imetumia hatua safi'], 'Original kept': ['Original conservé', 'Asili imehifadhiwa'],
    'Already optimized; original kept because clean rewrite was larger.': ['Déjà optimisé ; original conservé car la réécriture était plus volumineuse.', 'Tayari imeboreshwa; asili imehifadhiwa kwa sababu uandishi mpya ulikuwa mkubwa zaidi.'],
    'No smaller output was produced; original kept.': ['Aucun résultat plus petit n’a été produit ; original conservé.', 'Hakuna matokeo madogo zaidi yaliyopatikana; asili imehifadhiwa.'],
    'Clean rewrite was enough, so selectable text was preserved.': ['Le nettoyage a suffi ; le texte sélectionnable a été conservé.', 'Hatua safi ilitosha; maandishi yanayochagulika yamehifadhiwa.'],
    'Raster output was larger; clean PDF output used instead.': ['Le résultat en images était plus volumineux ; le PDF nettoyé a été retenu.', 'Matokeo ya picha yalikuwa makubwa zaidi; PDF ya hatua safi imetumika.'],
    'File was already compact; output may not be smaller.': ['Le fichier était déjà compact ; le résultat peut ne pas être plus petit.', 'Faili ilikuwa tayari ndogo; matokeo huenda yasiwe madogo zaidi.'],
    'Target size could not be reached without going below safe quality limits.': ['La taille cible n’a pas été atteinte dans les limites de qualité prévues.', 'Ukubwa uliolengwa haukufikiwa ndani ya mipaka ya ubora iliyowekwa.'],
    'Raster mode keeps the page appearance but may remove selectable text.': ['Le mode en images conserve l’apparence, mais peut supprimer le texte sélectionnable.', 'Hali ya picha huhifadhi mwonekano lakini inaweza kuondoa maandishi yanayochagulika.'],
    'Ready for browser-only processing. The PDF is read and compressed on this device; nothing is uploaded.': ['Prêt pour le traitement dans le navigateur. Le PDF est lu et compressé sur cet appareil ; rien n’est téléversé.', 'Iko tayari kuchakatwa kwenye kivinjari. PDF inasomwa na kubanwa kwenye kifaa hiki; hakuna kinachopakiwa.'],
    'Large PDF selected. Browser-only processing may take several minutes and use significant device memory. Keep this tab open; nothing is uploaded.': ['PDF volumineux sélectionné. Le traitement local peut prendre plusieurs minutes et utiliser beaucoup de mémoire. Gardez cet onglet ouvert ; rien n’est téléversé.', 'PDF kubwa imechaguliwa. Uchakataji wa ndani unaweza kuchukua dakika kadhaa na kutumia kumbukumbu nyingi. Acha kichupo hiki wazi; hakuna kinachopakiwa.']
  };

  function nativeUi(value) {
    var locale = document.documentElement.lang.split('-')[0], index = locale === 'fr' ? 0 : locale === 'sw' ? 1 : -1;
    if (index < 0 || !value) return value;
    if (stageCopy[value]) return stageCopy[value][index];
    var match = value.match(/^Reading (\d+)\/(\d+): ([\s\S]*)$/);
    if (match) return (index === 0 ? 'Lecture ' : 'Inasoma ') + match[1] + '/' + match[2] + ': ' + match[3];
    match = value.match(/^(Rendering|Rendered) page (\d+) of (\d+)(\.\.\.)?$/);
    if (match) return (index === 0 ? (match[1] === 'Rendering' ? 'Rendu de la page ' : 'Page rendue ') : (match[1] === 'Rendering' ? 'Inaonyesha ukurasa ' : 'Ukurasa umeonyeshwa ')) + match[2] + '/' + match[3];
    match = value.match(/^Attempt (\d+)\/(\d+): ([\s\S]*)$/);
    if (match) return (index === 0 ? 'Tentative ' : 'Jaribio ') + match[1] + '/' + match[2] + ': ' + nativeUi(match[3]);
    match = value.match(/^(.+) of (.+) read locally$/);
    if (match) return match[1] + '/' + match[2] + (index === 0 ? ' lus localement' : ' zimesomwa kwenye kifaa');
    return value;
  }

  function feedback(key, count) {
    var locale = document.documentElement.lang.split('-')[0];
    var messages = {
      rejected: ['Skipped {n} non-PDF file(s). Choose a PDF file.', '{n} fichier(s) non PDF ignoré(s). Choisissez un fichier PDF.', 'Faili {n} zisizo PDF zimerukwa. Chagua faili ya PDF.'],
      failed: ['Unable to read or compress this PDF.', 'Impossible de lire ou de compresser ce PDF.', 'Haiwezekani kusoma au kubana PDF hii.'],
      retry: ['Check that the file is a valid, unlocked PDF. Try Clean mode or a smaller batch. The source file stays on this device.', 'Vérifiez que le fichier est un PDF valide et déverrouillé. Essayez le mode nettoyage ou un lot plus petit. Le fichier source reste sur cet appareil.', 'Hakikisha faili ni PDF halali isiyofungwa. Jaribu hali safi au kundi dogo. Faili asili inabaki kwenye kifaa hiki.']
    };
    return messages[key][{ en: 0, fr: 1, sw: 2 }[locale] || 0].replace('{n}', String(count));
  }

  var PRESETS = {
    screen: { label: 'Clean', mode: 'clean' },
    web: { label: 'Balanced', mode: 'raster', dpi: 110, quality: 0.72, grayscale: false, cleanFirst: true },
    ebook: { label: 'Strong', mode: 'raster', dpi: 96, quality: 0.58, grayscale: false, cleanFirst: false },
    print: { label: 'High quality', mode: 'raster', dpi: 150, quality: 0.82, grayscale: false, cleanFirst: true },
    custom: { label: 'Custom', mode: 'raster', dpi: 110, quality: 0.7, grayscale: false, cleanFirst: true }
  };

  function $(id) {
    return document.getElementById(id);
  }

  function getPdfLib() {
    if (!window.PDFLib || !window.PDFLib.PDFDocument) {
      throw new Error('PDF library failed to load. Please refresh the page.');
    }
    return window.PDFLib;
  }

  function getPdfJs() {
    if (!window.pdfjsLib) return null;
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.min.js';
    return window.pdfjsLib;
  }

  function isPdfFile(file) {
    return !!(file && ((file.type && file.type === 'application/pdf') || /\.pdf$/i.test(file.name || '')));
  }

  function fileKey(file) {
    return [file.name, file.size, file.lastModified].join(':');
  }

  function cleanBaseName(name) {
    return String(name || 'document').replace(/\.pdf$/i, '').replace(/[^a-z0-9._-]+/gi, '_').replace(/^_+|_+$/g, '') || 'document';
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var value = bytes;
    var unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit++;
    }
    return (unit === 0 ? Math.round(value) : value.toFixed(value >= 10 ? 1 : 2)) + ' ' + units[unit];
  }

  function savingsText(original, compressed) {
    var saved = original - compressed;
    var percentage = saved <= 0 ? 0 : Math.round((saved / original) * 100);
    var locale = document.documentElement.lang.split('-')[0];
    if (saved < 0) return '+' + Math.round((-saved / original) * 100) + (locale === 'fr' ? ' % plus volumineux' : locale === 'sw' ? '% kubwa zaidi' : '% larger');
    return percentage + (locale === 'fr' ? ' % économisés' : locale === 'sw' ? '% imeokolewa' : '% saved');
  }

  function waitForPaint() {
    return new Promise(function (resolve) {
      var schedule = window.requestAnimationFrame || function (callback) { return setTimeout(callback, 0); };
      schedule(function () { schedule(resolve); });
    });
  }

  function showProcessing(message, detail, isError) {
    message = nativeUi(message);
    detail = nativeUi(detail);
    els.resultCard.classList.add('on');
    els.resultContent.style.display = 'none';
    els.processingText.style.display = 'block';
    if (els.processingLabel) {
      els.processingLabel.textContent = message;
      els.processingLabel.style.color = isError ? '#b91c1c' : '#334155';
    }
    if (els.processingDetail) els.processingDetail.textContent = detail || '';
  }

  function setProgress(percent, detail) {
    detail = nativeUi(detail);
    var rounded = Math.max(0, Math.min(100, Math.round(percent)));
    els.progressFill.style.width = rounded + '%';
    if (els.progressBar) {
      els.progressBar.setAttribute('aria-valuenow', String(rounded));
      els.progressBar.setAttribute('aria-valuetext', rounded + '%: ' + (detail || nativeUi('Processing locally')));
    }
    if (els.progressPercent) els.progressPercent.textContent = rounded + '%';
    if (detail && els.processingDetail) els.processingDetail.textContent = detail;
  }

  function reportProgress(ratio, message, detail) {
    var bounded = Math.max(0, Math.min(1, ratio));
    showProcessing(message, detail, false);
    setProgress(bounded * 100, detail);
  }

  function setBusy(value) {
    state.busy = value;
    els.compressBtn.disabled = value || state.files.length === 0;
    els.compressBtn.textContent = nativeUi(value ? 'Compressing...' : 'Compress PDF');
    els.pdfFileInput.disabled = value;
    els.fileInputLabel.setAttribute('aria-disabled', value ? 'true' : 'false');
    els.resultCard.setAttribute('aria-busy', value ? 'true' : 'false');
    document.querySelectorAll('.preset-btn').forEach(function (button) {
      button.disabled = value;
    });
    [els.dpiSlider, els.qualitySlider, els.targetSizeInput, els.grayscaleToggle, els.keepTextToggle].forEach(function (input) { input.disabled = value; });
  }

  function addFiles(fileList) {
    if (state.busy) return;
    var next = [];
    var seen = {};
    var rejected = 0;
    Array.from(fileList || []).forEach(function (file) {
      if (!isPdfFile(file)) {
        rejected++;
        return;
      }
      var key = fileKey(file);
      if (seen[key]) return;
      seen[key] = true;
      next.push(file);
    });
    state.files = next;
    state.results = [];
    state.download = null;
    renderFiles();
    resetResult('');
    if (rejected) showProcessing(feedback('rejected', rejected), '', true);
  }

  function renderFiles() {
    els.batchBadge.style.display = state.files.length > 1 ? 'inline' : 'none';
    els.fileInfo.style.display = state.files.length ? 'block' : 'none';
    els.batchFileList.style.display = state.files.length ? 'grid' : 'none';
    els.compressBtn.disabled = state.busy || state.files.length === 0;
    if (!state.files.length) {
      els.fileName.textContent = '';
      els.fileSize.textContent = '';
      if (els.fileAdvice) {
        els.fileAdvice.textContent = '';
        els.fileAdvice.style.display = 'none';
      }
      els.batchFileList.innerHTML = '';
      return;
    }
    var total = state.files.reduce(function (sum, file) { return sum + file.size; }, 0);
    var largest = state.files.reduce(function (max, file) { return Math.max(max, file.size); }, 0);
    var locale = document.documentElement.lang.split('-')[0];
    els.fileName.textContent = state.files.length === 1 ? state.files[0].name : state.files.length + (locale === 'fr' ? ' PDF sélectionnés' : locale === 'sw' ? ' PDF zimechaguliwa' : ' PDFs selected');
    els.fileSize.textContent = formatBytes(total);
    if (els.fileAdvice) {
      els.fileAdvice.style.display = 'block';
      els.fileAdvice.dataset.sizeState = largest >= LARGE_FILE_BYTES ? 'large' : 'ready';
      els.fileAdvice.textContent = largest >= LARGE_FILE_BYTES
        ? 'Large PDF selected. Browser-only processing may take several minutes and use significant device memory. Keep this tab open; nothing is uploaded.'
        : 'Ready for browser-only processing. The PDF is read and compressed on this device; nothing is uploaded.';
      els.fileAdvice.textContent = nativeUi(els.fileAdvice.textContent);
    }
    els.batchFileList.innerHTML = '';
    state.files.forEach(function (file) {
      var row = document.createElement('div');
      row.className = 'file-row';
      row.innerHTML = '<div class="file-row-name"></div><div class="file-row-meta"></div>';
      row.querySelector('.file-row-name').textContent = file.name;
      row.querySelector('.file-row-meta').textContent = formatBytes(file.size);
      els.batchFileList.appendChild(row);
    });
  }

  function resetResult(note) {
    state.results = [];
    state.download = null;
    els.resultCard.classList.remove('on');
    els.resultContent.style.display = 'none';
    els.processingText.style.display = 'none';
    els.resultRows.innerHTML = '';
    els.resultNote.style.display = note ? 'block' : 'none';
    els.resultNote.textContent = note || '';
    setProgress(0, 'Waiting to start');
  }

  function activeSettings() {
    var base = Object.assign({}, PRESETS[state.preset] || PRESETS.screen);
    if (state.preset === 'custom') {
      base.dpi = Number(els.dpiSlider.value) || 110;
      base.quality = (Number(els.qualitySlider.value) || 70) / 100;
      base.grayscale = !!els.grayscaleToggle.checked;
      base.cleanFirst = !!els.keepTextToggle.checked;
      var targetKb = Number(els.targetSizeInput.value);
      base.targetBytes = targetKb > 0 ? targetKb * 1024 : 0;
    }
    return base;
  }

  function readFileBuffer(file, onProgress) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onprogress = function (event) {
        if (!event.lengthComputable || !event.total) return;
        onProgress(event.loaded / event.total, event.loaded, event.total);
      };
      reader.onerror = function () {
        reject(reader.error || new Error('Could not read the PDF on this device.'));
      };
      reader.onabort = function () {
        reject(new Error('PDF reading was cancelled.'));
      };
      reader.onload = function () {
        if (!(reader.result instanceof ArrayBuffer)) {
          reject(new Error('Could not read the PDF on this device.'));
          return;
        }
        onProgress(1, file.size, file.size);
        resolve(reader.result);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  async function cleanPdf(sourceBytes, onStage) {
    var PDFDocument = getPdfLib().PDFDocument;
    onStage(0.08, 'Analyzing PDF structure...', 'Checking pages, objects, and existing compression');
    await waitForPaint();
    var pdf = await PDFDocument.load(new Uint8Array(sourceBytes), { ignoreEncryption: true, updateMetadata: false });
    onStage(0.48, 'Rewriting PDF efficiently...', 'Repacking the PDF while preserving its document structure');
    await waitForPaint();
    var bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
    onStage(1, 'Clean pass complete', 'The local rewrite finished; preparing the result');
    return {
      bytes: bytes,
      pageCount: pdf.getPageCount()
    };
  }

  function fitScale(width, height, scale) {
    var pixels = width * scale * height * scale;
    if (pixels <= MAX_CANVAS_PIXELS) return scale;
    return Math.sqrt(MAX_CANVAS_PIXELS / (width * height));
  }

  function blobFromCanvas(canvas, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) {
          reject(new Error('Could not encode a page image.'));
          return;
        }
        blob.arrayBuffer().then(resolve, reject);
      }, 'image/jpeg', quality);
    });
  }

  function applyGrayscale(canvas) {
    var ctx = canvas.getContext('2d');
    var image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = image.data;
    for (var i = 0; i < data.length; i += 4) {
      var gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }
    ctx.putImageData(image, 0, 0);
  }

  async function rasterizePdf(sourceBytes, settings, onStage) {
    var pdfjs = getPdfJs();
    if (!pdfjs) throw new Error('PDF rendering library failed to load. Please refresh the page.');
    var PDFDocument = getPdfLib().PDFDocument;
    var pdf = null;
    try {
      onStage(0.02, 'Opening pages for image compression...', 'Preparing the local PDF renderer');
      await waitForPaint();
      pdf = await pdfjs.getDocument({ data: new Uint8Array(sourceBytes.slice(0)) }).promise;
      var output = await PDFDocument.create();
      for (var i = 1; i <= pdf.numPages; i++) {
        onStage(0.06 + ((i - 1) / pdf.numPages) * 0.82, 'Rendering page ' + i + ' of ' + pdf.numPages + '...', 'Compressing page images locally');
        await waitForPaint();
        var page = await pdf.getPage(i);
        var baseViewport = page.getViewport({ scale: 1 });
        var scale = fitScale(baseViewport.width, baseViewport.height, (settings.dpi || 110) / 72);
        var viewport = page.getViewport({ scale: scale });
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        var ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) throw new Error('Could not create a canvas for page ' + i + '.');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: viewport, background: 'white' }).promise;
        if (settings.grayscale) applyGrayscale(canvas);
        var jpgBytes = await blobFromCanvas(canvas, settings.quality || 0.7);
        var image = await output.embedJpg(jpgBytes);
        var newPage = output.addPage([baseViewport.width, baseViewport.height]);
        newPage.drawImage(image, { x: 0, y: 0, width: baseViewport.width, height: baseViewport.height });
        page.cleanup();
        canvas.width = 1;
        canvas.height = 1;
        onStage(0.06 + (i / pdf.numPages) * 0.82, 'Rendered page ' + i + ' of ' + pdf.numPages, 'Releasing page memory before continuing');
      }
      onStage(0.92, 'Packing compressed PDF...', 'Writing the rebuilt pages into one local PDF');
      await waitForPaint();
      var outputBytes = await output.save({ useObjectStreams: true, addDefaultPage: false });
      onStage(1, 'Image compression pass complete', 'The rebuilt PDF is ready for size comparison');
      return { bytes: outputBytes, pageCount: pdf.numPages };
    } finally {
      if (pdf) {
        try { pdf.cleanup(); } catch (cleanupError) {}
        try { await pdf.destroy(); } catch (destroyError) {}
      }
    }
  }

  async function compressOne(file, settings, fileIndex, fileCount) {
    var progressBase = fileIndex / fileCount;
    var progressSpan = 1 / fileCount;
    function report(localRatio, message, detail) {
      reportProgress((progressBase + Math.max(0, Math.min(1, localRatio)) * progressSpan) * 0.96, message, detail);
    }

    report(0.01, 'Reading ' + (fileIndex + 1) + '/' + fileCount + ': ' + file.name, 'Reading the PDF on this device; no upload is happening');
    await waitForPaint();
    var sourceBytes = await readFileBuffer(file, function (ratio, loaded, total) {
      report(0.02 + ratio * 0.16, 'Reading ' + (fileIndex + 1) + '/' + fileCount + ': ' + file.name, formatBytes(loaded) + ' of ' + formatBytes(total) + ' read locally');
    });
    var originalSize = file.size;
    var clean = await cleanPdf(sourceBytes, function (ratio, message, detail) {
      report(0.2 + ratio * 0.28, message, detail);
    });
    var warnings = [];

    if (settings.mode === 'clean') {
      report(0.94, 'Preparing clean result...', 'Comparing the rewritten PDF with the original size');
      await waitForPaint();
      if (clean.bytes.length <= originalSize) {
        return resultFor(file, clean.bytes, originalSize, clean.pageCount, 'Clean', warnings);
      }
      warnings.push('Already optimized; original kept because clean rewrite was larger.');
      return resultFor(file, new Uint8Array(sourceBytes), originalSize, clean.pageCount, 'Original kept', warnings);
    }

    if (!settings.grayscale && settings.cleanFirst && clean.bytes.length <= originalSize * 0.97 && (!settings.targetBytes || clean.bytes.length <= settings.targetBytes)) {
      report(0.94, 'Preparing clean result...', 'The clean rewrite met the size goal and preserved selectable text');
      await waitForPaint();
      warnings.push('Clean rewrite was enough, so selectable text was preserved.');
      return resultFor(file, clean.bytes, originalSize, clean.pageCount, 'Clean', warnings);
    }

    var attempt = Object.assign({}, settings);
    var best = null;
    var attempts = settings.targetBytes ? 4 : 1;
    for (var i = 0; i < attempts; i++) {
      var attemptStart = 0.5 + (i / attempts) * 0.44;
      var attemptSpan = 0.44 / attempts;
      var attemptNumber = i + 1;
      var raster = await rasterizePdf(sourceBytes, attempt, function (ratio, message, detail) {
        var prefix = attempts > 1 ? 'Attempt ' + attemptNumber + '/' + attempts + ': ' : '';
        report(attemptStart + ratio * attemptSpan, prefix + message, detail);
      });
      if (!best || raster.bytes.length < best.bytes.length) best = raster;
      if (!settings.targetBytes || raster.bytes.length <= settings.targetBytes) break;
      attempt = Object.assign({}, attempt, {
        dpi: Math.max(60, Math.round((attempt.dpi || 110) * 0.84)),
        quality: Math.max(0.25, (attempt.quality || 0.7) * 0.78)
      });
    }

    if (!best) throw new Error('Compression failed before output was created.');
    if (!settings.grayscale && best.bytes.length >= originalSize && clean.bytes.length < originalSize) {
      best = clean;
      warnings.push('Raster output was larger; clean PDF output used instead.');
      if (settings.targetBytes && best.bytes.length > settings.targetBytes) warnings.push('Target size could not be reached without going below safe quality limits.');
      return resultFor(file, best.bytes, originalSize, best.pageCount, 'Clean fallback', warnings);
    }
    if (!settings.grayscale && best.bytes.length >= originalSize) {
      warnings.push('No smaller output was produced; original kept.');
      if (settings.targetBytes && originalSize > settings.targetBytes) warnings.push('Target size could not be reached without going below safe quality limits.');
      return resultFor(file, new Uint8Array(sourceBytes), originalSize, clean.pageCount, 'Original kept', warnings);
    }
    if (settings.targetBytes && best.bytes.length > settings.targetBytes) warnings.push('Target size could not be reached without going below safe quality limits.');
    if (settings.grayscale && best.bytes.length >= originalSize) warnings.push('Grayscale was applied. The converted PDF is not smaller than the original.');
    if (settings.mode === 'raster') warnings.push('Raster mode keeps the page appearance but may remove selectable text.');
    return resultFor(file, best.bytes, originalSize, best.pageCount, settings.label || 'Compressed', warnings);
  }

  function resultFor(file, bytes, originalSize, pageCount, mode, warnings) {
    return {
      name: cleanBaseName(file.name) + '_compressed.pdf',
      sourceName: file.name,
      bytes: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
      originalSize: originalSize,
      compressedSize: bytes.length,
      pageCount: pageCount,
      mode: mode,
      warnings: warnings || []
    };
  }

  function renderResults() {
    var totalOriginal = state.results.reduce(function (sum, item) { return sum + item.originalSize; }, 0);
    var totalCompressed = state.results.reduce(function (sum, item) { return sum + item.compressedSize; }, 0);
    els.originalSize.textContent = formatBytes(totalOriginal);
    els.compressedSize.textContent = formatBytes(totalCompressed);
    els.savingsBadge.textContent = savingsText(totalOriginal, totalCompressed);
    els.savingsBadge.style.background = totalCompressed < totalOriginal ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.16)';
    els.savingsBadge.style.color = totalCompressed < totalOriginal ? '#047857' : '#92400e';
    els.resultRows.innerHTML = '';
    var notes = [];
    state.results.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'result-row';
      row.innerHTML = '<div><div class="result-row-name"></div><div class="result-row-meta"></div></div><div class="result-row-meta"></div>';
      row.querySelector('.result-row-name').textContent = item.sourceName;
      row.querySelectorAll('.result-row-meta')[0].textContent = nativeUi(item.mode) + ' | ' + item.pageCount + (document.documentElement.lang === 'sw' ? ' kurasa' : ' page' + (item.pageCount === 1 ? '' : 's'));
      row.querySelectorAll('.result-row-meta')[1].textContent = formatBytes(item.originalSize) + ' -> ' + formatBytes(item.compressedSize);
      els.resultRows.appendChild(row);
      item.warnings.forEach(function (warning) { notes.push(item.sourceName + ': ' + nativeUi(warning)); });
    });
    els.resultNote.style.display = notes.length ? 'block' : 'none';
    els.resultNote.textContent = notes.join(' ');
    els.processingText.style.display = 'none';
    els.resultContent.style.display = 'block';
    els.resultCard.classList.add('on');
    var single = state.results.length === 1;
    var blob = single
      ? new Blob([state.results[0].bytes], { type: 'application/pdf' })
      : buildZip(state.results.map(function (item) { return { name: item.name, data: item.bytes }; }));
    state.download = { blob: blob, filename: single ? state.results[0].name : ZIP_NAME };
    els.downloadBtn.textContent = nativeUi(single ? 'Download compressed PDF' : 'Download ZIP');
  }

  async function compressSelected() {
    if (!state.files.length || state.busy) return;
    setBusy(true);
    state.results = [];
    state.download = null;
    reportProgress(0.01, 'Starting compression...', 'Preparing local browser memory; no upload is happening');
    await waitForPaint();
    var settings = activeSettings();
    try {
      for (var i = 0; i < state.files.length; i++) {
        state.results.push(await compressOne(state.files[i], settings, i, state.files.length));
      }
      reportProgress(0.98, 'Preparing download...', 'Building the final local PDF or ZIP result');
      await waitForPaint();
      renderResults();
      setProgress(100, 'Compression complete');
    } catch (err) {
      // Library errors may contain document fragments or implementation details.
      showProcessing(feedback('failed'), feedback('retry'), true);
      els.resultContent.style.display = 'none';
      if (els.progressBar) els.progressBar.setAttribute('aria-valuetext', nativeUi('Compression failed'));
    } finally {
      setBusy(false);
    }
  }

  function downloadBlob(blob, filename) {
    function runDownload() {
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
    }
    var gate = document.querySelector('email-gate-modal');
    if (gate && typeof gate.show === 'function') gate.show(runDownload);
    else runDownload();
  }

  function crc32(data) {
    var table = crc32.table;
    if (!table) {
      table = crc32.table = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        table[n] = c >>> 0;
      }
    }
    var value = 0xffffffff;
    for (var i = 0; i < data.length; i++) value = table[(value ^ data[i]) & 0xff] ^ (value >>> 8);
    return (value ^ 0xffffffff) >>> 0;
  }

  function buildZip(files) {
    var encoder = new TextEncoder();
    var parts = [];
    var central = [];
    var offset = 0;
    files.forEach(function (file) {
      var name = encoder.encode(file.name);
      var data = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
      var local = new Uint8Array(30 + name.length);
      var localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint32(14, crc32(data), true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, name.length, true);
      local.set(name, 30);

      var entry = new Uint8Array(46 + name.length);
      var entryView = new DataView(entry.buffer);
      entryView.setUint32(0, 0x02014b50, true);
      entryView.setUint16(4, 20, true);
      entryView.setUint16(6, 20, true);
      entryView.setUint32(16, crc32(data), true);
      entryView.setUint32(20, data.length, true);
      entryView.setUint32(24, data.length, true);
      entryView.setUint16(28, name.length, true);
      entryView.setUint32(38, 32, true);
      entryView.setUint32(42, offset, true);
      entry.set(name, 46);

      central.push(entry);
      parts.push(local, data);
      offset += local.length + data.length;
    });
    var centralOffset = offset;
    var centralSize = 0;
    central.forEach(function (entry) {
      parts.push(entry);
      centralSize += entry.length;
    });
    var end = new Uint8Array(22);
    var endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralSize, true);
    endView.setUint32(16, centralOffset, true);
    parts.push(end);
    return new Blob(parts, { type: 'application/zip' });
  }

  function bindEvents() {
    document.querySelectorAll('.preset-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        state.preset = button.dataset.preset;
        document.querySelectorAll('.preset-btn').forEach(function (item) { item.classList.remove('on'); });
        button.classList.add('on');
        els.customPanel.style.display = state.preset === 'custom' ? 'block' : 'none';
        resetResult('');
      });
    });

    els.pdfFileInput.addEventListener('change', function (event) {
      addFiles(event.target.files);
      event.target.value = '';
    });
    els.fileInputLabel.addEventListener('dragover', function (event) {
      if (state.busy) return;
      event.preventDefault();
      els.fileInputLabel.classList.add('dragover');
    });
    els.fileInputLabel.addEventListener('dragleave', function () {
      els.fileInputLabel.classList.remove('dragover');
    });
    els.fileInputLabel.addEventListener('drop', function (event) {
      if (state.busy) return;
      event.preventDefault();
      els.fileInputLabel.classList.remove('dragover');
      addFiles(event.dataTransfer.files);
    });
    els.dpiSlider.addEventListener('input', function () { els.dpiVal.textContent = els.dpiSlider.value; });
    els.qualitySlider.addEventListener('input', function () { els.qualityVal.textContent = els.qualitySlider.value; });
    [els.dpiSlider, els.qualitySlider, els.targetSizeInput, els.grayscaleToggle, els.keepTextToggle].forEach(function (input) {
      input.addEventListener('input', function () { if (!state.busy) resetResult(''); });
      input.addEventListener('change', function () { if (!state.busy) resetResult(''); });
    });
    els.compressBtn.addEventListener('click', compressSelected);
    els.downloadBtn.addEventListener('click', function () {
      if (state.download) downloadBlob(state.download.blob, state.download.filename);
    });
  }

  function init() {
    els.pdfFileInput = $('pdfFileInput');
    els.fileInputLabel = document.querySelector('.file-input-label');
    els.fileInfo = $('fileInfo');
    els.fileName = $('fileName');
    els.fileSize = $('fileSize');
    els.fileAdvice = $('fileAdvice');
    els.batchFileList = $('batchFileList');
    els.batchBadge = $('batchBadge');
    els.compressBtn = $('compressBtn');
    els.resultCard = $('resultCard');
    els.resultContent = $('resultContent');
    els.processingText = $('processingText');
    els.processingLabel = $('processingLabel') || els.processingText.querySelector('div:first-child');
    els.processingDetail = $('processingDetail');
    els.progressBar = $('progressBar') || els.processingText.querySelector('.progress-bar');
    els.progressFill = $('progressFill');
    els.progressPercent = $('progressPercent');
    els.originalSize = $('originalSize');
    els.compressedSize = $('compressedSize');
    els.savingsBadge = $('savingsBadge');
    els.resultRows = $('resultRows');
    els.resultNote = $('resultNote');
    els.downloadBtn = $('downloadBtn');
    els.customPanel = $('customPanel');
    els.dpiSlider = $('dpiSlider');
    els.qualitySlider = $('qualitySlider');
    els.dpiVal = $('dpiVal');
    els.qualityVal = $('qualityVal');
    els.targetSizeInput = $('targetSizeInput');
    els.grayscaleToggle = $('grayscaleToggle');
    els.keepTextToggle = $('keepTextToggle');
    getPdfJs();
    document.querySelectorAll('.preset-desc').forEach(function (element) { element.textContent = nativeUi(element.textContent.trim()); });
    bindEvents();
    renderFiles();
    setProgress(0, 'Waiting to start');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
