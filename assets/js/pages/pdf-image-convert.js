(function () {
  'use strict';

  var MAX_CANVAS_PIXELS = 36000000;
  var DEFAULT_OUTPUT_NAME = 'images_combined.pdf';
  var PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792],
    legal: [612, 1008],
    square: [612, 612]
  };
  var state = {
    mode: 'pdf2img',
    pdfDoc: null,
    pdfFile: null,
    pdfBytes: null,
    convertedImages: [],
    imageItems: [],
    pdfDownload: null,
    busy: false,
    dragIndex: null,
    nextImageId: 1
  };
  var els = {};

  function native(en, fr, sw) {
    var locale = document.documentElement.lang.toLowerCase().split('-')[0];
    return locale === 'fr' ? fr : locale === 'sw' ? sw : en;
  }

  function $(id) {
    return document.getElementById(id);
  }

  function getPdfJs() {
    if (!window.pdfjsLib) throw new Error('PDF renderer failed to load. Please refresh the page.');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/vendor/pdfjs/pdf.worker.min.js';
    return window.pdfjsLib;
  }

  function getPdfLib() {
    if (!window.PDFLib || !window.PDFLib.PDFDocument) throw new Error('PDF library failed to load. Please refresh the page.');
    return window.PDFLib;
  }

  function isPdfFile(file) {
    return !!(file && ((file.type === 'application/pdf') || /\.pdf$/i.test(file.name || '')));
  }

  function isImageFile(file) {
    return !!(file && (/^image\/(png|jpe?g|webp)$/i.test(file.type || '') || /\.(png|jpe?g|webp)$/i.test(file.name || '')));
  }

  function cleanBaseName(name, fallback) {
    return String(name || fallback || 'file')
      .replace(/\.[^.]+$/i, '')
      .replace(/[^a-z0-9._-]+/gi, '_')
      .replace(/^_+|_+$/g, '') || fallback || 'file';
  }

  function cleanPdfName(name) {
    var base = cleanBaseName(name || DEFAULT_OUTPUT_NAME, 'images_combined');
    return /\.pdf$/i.test(base) ? base : base + '.pdf';
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

  function setText(el, text) {
    if (el) el.textContent = text || '';
  }

  function setProgress(prefix, value, message) {
    var fill = els[prefix + 'ProgressFill'];
    var bar = els[prefix + 'Progress'];
    var label = els[prefix + 'ProgressText'];
    if (bar) bar.style.display = 'block';
    if (label) label.style.display = 'block';
    if (fill) fill.style.width = Math.max(0, Math.min(100, value || 0)) + '%';
    if (message && label) label.textContent = message;
  }

  function clearProgress(prefix) {
    if (els[prefix + 'Progress']) els[prefix + 'Progress'].style.display = 'none';
    if (els[prefix + 'ProgressText']) {
      els[prefix + 'ProgressText'].style.display = 'none';
      els[prefix + 'ProgressText'].textContent = '';
    }
    if (els[prefix + 'ProgressFill']) els[prefix + 'ProgressFill'].style.width = '0%';
  }

  function setBusy(value, active) {
    state.busy = value;
    document.querySelectorAll('#pdf2img-panel input, #pdf2img-panel select, #img2pdf-panel input, #img2pdf-panel select, #imgFileList button').forEach(function (control) { control.disabled = value; });
    if (!value) updateQualityControls();
    els.p2iConvertBtn.disabled = value || !state.pdfDoc;
    els.i2pConvertBtn.disabled = value || state.imageItems.length === 0;
    if (active === 'pdf2img') {
      els.p2iConvertBtn.textContent = value
        ? (els.p2iMode && els.p2iMode.value === 'extract' ? native("Extracting...","Extraction…","Inatoa picha…") : native("Converting...","Conversion…","Inabadilisha…"))
        : (els.p2iMode && els.p2iMode.value === 'extract' ? native("Extract Images from PDF","Extraire les images du PDF","Toa picha kwenye PDF") : native("Convert PDF to Images","Convertir le PDF en images","Badilisha PDF kuwa picha"));
    }
    if (active === 'img2pdf') els.i2pConvertBtn.textContent = value ? native("Creating PDF...","Création du PDF…","Inaunda PDF…") : native("Create PDF from Images","Créer un PDF à partir des images","Unda PDF kutoka picha");
    els.modePdfToImg.disabled = value;
    els.modeImgToPdf.disabled = value;
  }

  function invalidateImages() {
    if (state.busy) return;
    revokeConvertedImages();
    els.p2iThumbGrid.innerHTML = '';
    els.p2iResultCard.classList.add('hidden');
  }

  function invalidatePdf() {
    if (state.busy) return;
    state.pdfDownload = null;
    els.i2pResultCard.classList.add('hidden');
  }

  function revokeConvertedImages() {
    state.convertedImages.forEach(function (item) {
      if (item.url) URL.revokeObjectURL(item.url);
    });
    state.convertedImages = [];
  }

  function revokeImageItems() {
    state.imageItems.forEach(function (item) {
      if (item.url) URL.revokeObjectURL(item.url);
    });
    state.imageItems = [];
  }

  function switchMode(mode) {
    if (state.busy) return;
    state.mode = mode;
    els.modePdfToImg.classList.toggle('on', mode === 'pdf2img');
    els.modeImgToPdf.classList.toggle('on', mode === 'img2pdf');
    els.pdf2imgPanel.classList.toggle('hidden', mode !== 'pdf2img');
    els.img2pdfPanel.classList.toggle('hidden', mode !== 'img2pdf');
  }

  function updateQualityControls() {
    var format = els.p2iFormat.value;
    var p2iMode = els.p2iMode.value;
    var showP2i = format === 'jpeg' || format === 'webp';
    els.p2iQualityWrap.style.display = showP2i ? 'block' : 'none';
    els.p2iQualityLabel.textContent = format === 'webp' ? native("WebP Quality","Qualité WebP","Ubora wa WebP") : native("JPG Quality","Qualité JPG","Ubora wa JPG");
    els.p2iQualityVal.textContent = els.p2iQuality.value;
    els.p2iScale.disabled = p2iMode === 'extract';
    els.p2iConvertBtn.textContent = p2iMode === 'extract' ? native("Extract Images from PDF","Extraire les images du PDF","Toa picha kwenye PDF") : native("Convert PDF to Images","Convertir le PDF en images","Badilisha PDF kuwa picha");
    els.p2iPagesHint.textContent = p2iMode === 'extract' ? native("Optional page filter for image extraction.","Filtre de pages facultatif pour extraire les images.","Chagua kurasa za kutoa picha ukihitaji.") : native("Leave blank for every page.","Laissez vide pour toutes les pages.","Acha wazi kwa kurasa zote.");

    var showI2p = els.i2pImageMode.value === 'jpeg';
    els.i2pQualityWrap.classList.toggle('hidden', !showI2p);
    els.i2pQualityVal.textContent = els.i2pQuality.value;
    els.i2pMarginVal.textContent = els.i2pMargin.value + ' mm';
  }

  function parsePageRanges(raw, total) {
    var text = String(raw || '').trim();
    if (!text || /^all$/i.test(text)) {
      return Array.from({ length: total }, function (_, i) { return i + 1; });
    }
    var selected = [];
    var seen = {};
    text.split(',').forEach(function (part) {
      var piece = part.trim();
      if (!piece) return;
      var range = piece.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        var start = Number(range[1]);
        var end = Number(range[2]);
        if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > total) {
          throw new Error('Page range "' + piece + '" is outside this PDF.');
        }
        for (var p = start; p <= end; p++) {
          if (!seen[p]) {
            seen[p] = true;
            selected.push(p);
          }
        }
        return;
      }
      var page = Number(piece);
      if (!Number.isInteger(page) || page < 1 || page > total) throw new Error('Page "' + piece + '" is outside this PDF.');
      if (!seen[page]) {
        seen[page] = true;
        selected.push(page);
      }
    });
    if (!selected.length) throw new Error('Enter a page range such as 1-3, 5 or leave it blank.');
    return selected;
  }

  function fitRenderScale(width, height, requestedScale) {
    var pixels = width * requestedScale * height * requestedScale;
    if (pixels <= MAX_CANVAS_PIXELS) return requestedScale;
    return Math.max(0.2, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
  }

  function canvasToBlob(canvas, mimeType, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (!blob) reject(new Error('Could not encode the rendered image.'));
        else resolve(blob);
      }, mimeType, quality);
    });
  }

  function canvasToJpegBytes(canvas, quality) {
    return canvasToBlob(canvas, 'image/jpeg', quality).then(function (blob) {
      return blob.arrayBuffer();
    }).then(function (buffer) {
      return new Uint8Array(buffer);
    });
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

  async function handlePdfFile(file) {
    if (state.busy) return;
    invalidateImages();
    if (!isPdfFile(file)) {
      setText(els.p2iStatus, native("Please choose a PDF file.","Choisissez un fichier PDF.","Chagua faili la PDF."));
      return;
    }
    setBusy(true, 'pdf2img');
    try {
      clearProgress('p2i');
      revokeConvertedImages();
      state.pdfFile = file;
      state.pdfBytes = await file.arrayBuffer();
      var pdfjs = getPdfJs();
      state.pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(state.pdfBytes.slice(0)) }).promise;
      setText(els.pdfFileName, file.name);
      setText(els.pdfFileSize, formatBytes(file.size));
      setText(els.pdfPageCount, native('Pages: ', 'Pages : ', 'Kurasa: ') + state.pdfDoc.numPages);
      els.pdfFileInfo.classList.remove('hidden');
      els.pdfDropZone.style.display = 'none';
      els.p2iConvertBtn.disabled = false;
      els.p2iResultCard.classList.add('hidden');
      els.p2iThumbGrid.innerHTML = '';
      setText(els.p2iStatus, '');
    } catch (err) {
      state.pdfDoc = null;
      state.pdfBytes = null;
      setText(els.p2iStatus, native('Could not read this PDF. Choose a valid, unlocked PDF and try again.', 'Impossible de lire ce PDF. Choisissez un PDF valide et non verrouillé, puis réessayez.', 'PDF hii haisomeki. Chagua PDF halali isiyofungwa, kisha ujaribu tena.'));
      els.p2iConvertBtn.disabled = true;
    } finally {
      setBusy(false, 'pdf2img');
    }
  }

  function resetPdf2Img() {
    if (state.busy) return;
    state.pdfDoc = null;
    state.pdfFile = null;
    state.pdfBytes = null;
    revokeConvertedImages();
    els.pdfFileInput.value = '';
    els.pdfFileInfo.classList.add('hidden');
    els.pdfDropZone.style.display = '';
    els.p2iConvertBtn.disabled = true;
    els.p2iResultCard.classList.add('hidden');
    els.p2iThumbGrid.innerHTML = '';
    els.p2iPages.value = '';
    setText(els.p2iStatus, '');
    setText(els.p2iResultNote, '');
    clearProgress('p2i');
  }

  async function convertPdfToImages() {
    if (!state.pdfDoc || state.busy) return;
    var conversionMode = els.p2iMode.value;
    var format = els.p2iFormat.value;
    var mimeType = format === 'jpeg' ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
    var ext = format === 'jpeg' ? 'jpg' : format;
    var quality = (format === 'jpeg' || format === 'webp') ? Number(els.p2iQuality.value) / 100 : undefined;
    var requestedScale = Number(els.p2iScale.value) || 2;
    var pages;
    try {
      pages = parsePageRanges(els.p2iPages.value, state.pdfDoc.numPages);
    } catch (err) {
      setText(els.p2iStatus, native('Enter valid pages within this PDF, for example 1-3, 5.', 'Saisissez des pages présentes dans ce PDF, par exemple 1-3, 5.', 'Weka kurasa zilizopo kwenye PDF hii, kwa mfano 1-3, 5.'));
      return;
    }

    setBusy(true, 'pdf2img');
    setText(els.p2iStatus, '');
    revokeConvertedImages();
    els.p2iThumbGrid.innerHTML = '';
    els.p2iResultCard.classList.add('hidden');
    var baseName = cleanBaseName(state.pdfFile && state.pdfFile.name, 'document');
    var digits = String(state.pdfDoc.numPages).length;
    var scaleWarnings = 0;

    try {
      if (conversionMode === 'extract') {
        await extractEmbeddedImages(pages, format, mimeType, quality, baseName);
        if (!state.convertedImages.length) {
          setProgress('p2i', 100, native("No embedded images found in the selected pages.","Aucune image intégrée dans les pages sélectionnées.","Hakuna picha zilizopachikwa kwenye kurasa zilizochaguliwa."));
          setText(els.p2iStatus, native("No embedded images were found. Try Render pages to export each page as an image.","Aucune image intégrée trouvée. Choisissez le rendu des pages pour exporter chaque page en image.","Hakuna picha zilizopachikwa. Chagua kutengeneza picha za kurasa ili kutoa kila ukurasa kama picha."));
          return;
        }
        setProgress('p2i', 100, native('Images extracted: ', 'Images extraites : ', 'Picha zilizotolewa: ') + state.convertedImages.length);
        els.p2iResultCard.classList.remove('hidden');
        setText(els.p2iResultNote, native('Embedded images extracted: ', 'Images intégrées extraites : ', 'Picha zilizopachikwa zilizotolewa: ') + state.convertedImages.length + ' (' + ext.toUpperCase() + ').');
        return;
      }

      for (var i = 0; i < pages.length; i++) {
        var pageNumber = pages[i];
        setProgress('p2i', (i / pages.length) * 95, native('Rendering page ', 'Rendu de la page ', 'Inachora ukurasa ') + pageNumber + ' / ' + state.pdfDoc.numPages);
        var page = await state.pdfDoc.getPage(pageNumber);
        var baseViewport = page.getViewport({ scale: 1 });
        var renderScale = fitRenderScale(baseViewport.width, baseViewport.height, requestedScale);
        if (renderScale < requestedScale) scaleWarnings++;
        var viewport = page.getViewport({ scale: renderScale });
        var canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        var ctx = canvas.getContext('2d', { alpha: format === 'png' });
        if (!ctx) throw new Error('Could not create a canvas for page ' + pageNumber + '.');
        if (format !== 'png') {
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        await page.render({ canvasContext: ctx, viewport: viewport, background: format === 'png' ? undefined : 'white' }).promise;
        var blob = await canvasToBlob(canvas, mimeType, quality);
        if (format === 'webp' && (!blob.type || blob.type.indexOf('webp') === -1)) {
          throw new Error('This browser could not create WebP output. Choose PNG or JPG instead.');
        }
        var url = URL.createObjectURL(blob);
        var name = baseName + '_page_' + String(pageNumber).padStart(digits, '0') + '.' + ext;
        var item = { name: name, blob: blob, url: url, pageNumber: pageNumber, label: native('Page ', 'Page ', 'Ukurasa ') + pageNumber, size: blob.size };
        state.convertedImages.push(item);
        renderThumb(item, i);
        canvas.width = 1;
        canvas.height = 1;
      }
      setProgress('p2i', 100, native('Images created: ', 'Images créées : ', 'Picha zilizoundwa: ') + state.convertedImages.length);
      els.p2iResultCard.classList.remove('hidden');
      var note = native('Pages exported: ', 'Pages exportées : ', 'Kurasa zilizotolewa: ') + state.convertedImages.length + ' (' + ext.toUpperCase() + ').';
      if (scaleWarnings) note += native(' Very large pages were capped to protect browser memory.', ' La taille des très grandes pages a été limitée pour préserver la mémoire du navigateur.', ' Kurasa kubwa sana zimepunguzwa ili kulinda kumbukumbu ya kivinjari.');
      setText(els.p2iResultNote, note);
    } catch (err) {
      setText(els.p2iStatus, native('Conversion failed. Try fewer pages or PNG output.', 'La conversion a échoué. Essayez moins de pages ou le format PNG.', 'Ubadilishaji umeshindikana. Jaribu kurasa chache au umbizo la PNG.'));
    } finally {
      setBusy(false, 'pdf2img');
    }
  }

  async function extractEmbeddedImages(pages, format, mimeType, quality, baseName) {
    var pdfjs = getPdfJs();
    var imageOps = {};
    imageOps[pdfjs.OPS.paintImageXObject] = true;
    imageOps[pdfjs.OPS.paintJpegXObject] = true;
    imageOps[pdfjs.OPS.paintImageXObjectRepeat] = true;
    imageOps[pdfjs.OPS.paintInlineImageXObject] = true;
    imageOps[pdfjs.OPS.paintInlineImageXObjectGroup] = true;
    var ext = format === 'jpeg' ? 'jpg' : format;
    var imageCount = 0;
    for (var p = 0; p < pages.length; p++) {
      var pageNumber = pages[p];
      setProgress('p2i', (p / pages.length) * 95, native('Scanning page ', 'Recherche des images, page ', 'Inatafuta picha, ukurasa ') + pageNumber);
      var page = await state.pdfDoc.getPage(pageNumber);
      var opList = await page.getOperatorList();
      for (var i = 0; i < opList.fnArray.length; i++) {
        if (!imageOps[opList.fnArray[i]]) continue;
        var image = await imageFromOperator(page, opList.fnArray[i], opList.argsArray[i]);
        if (!image) continue;
        var canvas = canvasFromPdfImage(image);
        if (!canvas) continue;
        var blob = await canvasToOutputBlob(canvas, format, mimeType, quality);
        imageCount++;
        var name = baseName + '_image_' + String(imageCount).padStart(3, '0') + '_p' + pageNumber + '.' + ext;
        var url = URL.createObjectURL(blob);
        var item = {
          name: name,
          blob: blob,
          url: url,
          pageNumber: pageNumber,
          label: native('Image ', 'Image ', 'Picha ') + imageCount + native(' (page ', ' (page ', ' (ukurasa ') + pageNumber + ')',
          size: blob.size
        };
        state.convertedImages.push(item);
        renderThumb(item, state.convertedImages.length - 1);
        canvas.width = 1;
        canvas.height = 1;
      }
    }
  }

  async function imageFromOperator(page, fn, args) {
    var pdfjs = getPdfJs();
    if (!args || !args.length) return null;
    if (fn === pdfjs.OPS.paintInlineImageXObject) return args[0];
    if (fn === pdfjs.OPS.paintInlineImageXObjectGroup) {
      return args[0] && args[0].length ? args[0][0] : null;
    }
    return getPdfObject(typeof args[0] === 'string' && args[0].indexOf('g_') === 0 ? page.commonObjs : page.objs, args[0]);
  }

  function getPdfObject(objects, id) {
    return new Promise(function (resolve) {
      try {
        var value = objects.get(id, function (obj) { resolve(obj); });
        if (value) resolve(value);
      } catch (err) {
        resolve(null);
      }
    });
  }

  function canvasFromPdfImage(image) {
    var width = image && (image.width || image.bitmap && image.bitmap.width);
    var height = image && (image.height || image.bitmap && image.bitmap.height);
    if (!width || !height) return null;
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    if (image.bitmap) {
      ctx.drawImage(image.bitmap, 0, 0);
      return canvas;
    }
    var data = image.data;
    if (!data) return null;
    var out = ctx.createImageData(width, height);
    var expectedRgba = width * height * 4;
    var expectedRgb = width * height * 3;
    var expectedGray = width * height;
    if (data.length === expectedRgba) {
      out.data.set(data);
    } else if (data.length === expectedRgb) {
      for (var i = 0, j = 0; i < data.length; i += 3, j += 4) {
        out.data[j] = data[i];
        out.data[j + 1] = data[i + 1];
        out.data[j + 2] = data[i + 2];
        out.data[j + 3] = 255;
      }
    } else if (data.length === expectedGray) {
      for (var g = 0, k = 0; g < data.length; g++, k += 4) {
        out.data[k] = data[g];
        out.data[k + 1] = data[g];
        out.data[k + 2] = data[g];
        out.data[k + 3] = 255;
      }
    } else {
      return null;
    }
    ctx.putImageData(out, 0, 0);
    return canvas;
  }

  function canvasToOutputBlob(canvas, format, mimeType, quality) {
    if (format === 'png') return canvasToBlob(canvas, mimeType, quality);
    var flat = document.createElement('canvas');
    flat.width = canvas.width;
    flat.height = canvas.height;
    var ctx = flat.getContext('2d', { alpha: false });
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, flat.width, flat.height);
    ctx.drawImage(canvas, 0, 0);
    return canvasToBlob(flat, mimeType, quality).then(function (blob) {
      flat.width = 1;
      flat.height = 1;
      return blob;
    });
  }

  function renderThumb(item, index) {
    var card = document.createElement('div');
    card.className = 'thumb-card';
    var labelText = item.label || ('Page ' + item.pageNumber);

    var wrap = document.createElement('div');
    wrap.className = 'thumb-img-wrap';
    var img = document.createElement('img');
    img.src = item.url;
    img.alt = labelText;
    img.loading = 'lazy';
    wrap.appendChild(img);

    var info = document.createElement('div');
    info.className = 'thumb-info';
    var label = document.createElement('span');
    label.className = 'thumb-label';
    label.textContent = labelText + ' (' + formatBytes(item.size) + ')';
    var button = document.createElement('button');
    button.className = 'thumb-dl';
    button.type = 'button';
    button.title = native('Download ', 'Télécharger ', 'Pakua ') + labelText;
    button.textContent = native("Download","Télécharger","Pakua");
    button.addEventListener('click', function () {
      downloadSingleImage(index);
    });
    info.appendChild(label);
    info.appendChild(button);
    card.appendChild(wrap);
    card.appendChild(info);
    els.p2iThumbGrid.appendChild(card);
  }

  function downloadSingleImage(index) {
    var item = state.convertedImages[index];
    if (item) downloadBlob(item.blob, item.name);
  }

  async function downloadImagesZip() {
    if (!state.convertedImages.length || state.busy) return;
    var oldText = els.p2iZipBtn.textContent;
    els.p2iZipBtn.disabled = true;
    els.p2iZipBtn.textContent = native("Creating ZIP...","Création du ZIP…","Inaunda ZIP…");
    try {
      var files = [];
      for (var i = 0; i < state.convertedImages.length; i++) {
        var item = state.convertedImages[i];
        files.push({ name: item.name, data: new Uint8Array(await item.blob.arrayBuffer()) });
      }
      var baseName = cleanBaseName(state.pdfFile && state.pdfFile.name, 'document');
      downloadBlob(buildZip(files), baseName + '_images.zip');
    } catch (err) {
      setText(els.p2iStatus, native('Could not create ZIP. Download images individually or try again.', 'Impossible de créer le ZIP. Téléchargez les images séparément ou réessayez.', 'ZIP haikuundwa. Pakua picha moja moja au ujaribu tena.'));
    } finally {
      els.p2iZipBtn.textContent = oldText;
      els.p2iZipBtn.disabled = false;
    }
  }

  async function addImageFiles(fileList) {
    if (state.busy) return;
    invalidatePdf();
    var files = Array.from(fileList || []);
    var accepted = files.filter(isImageFile);
    var rejected = files.length - accepted.length;
    for (var i = 0; i < accepted.length; i++) {
      var file = accepted[i];
      var url = URL.createObjectURL(file);
      try {
        var dims = await getImageDimensions(url);
        state.imageItems.push({
          id: state.nextImageId++,
          file: file,
          url: url,
          width: dims.width,
          height: dims.height,
          type: normalizeImageType(file)
        });
      } catch (err) {
        URL.revokeObjectURL(url);
        rejected++;
      }
    }
    renderImageList();
    els.i2pConvertBtn.disabled = state.imageItems.length === 0;
    els.i2pResultCard.classList.add('hidden');
    setText(els.i2pStatus, rejected ? native('Unsupported or unreadable images skipped: ', 'Images non prises en charge ou illisibles ignorées : ', 'Picha zisizotumika au zisizosomeka zilizoachwa: ') + rejected : '');
  }

  function normalizeImageType(file) {
    var type = String(file.type || '').toLowerCase();
    if (type === 'image/jpg') return 'image/jpeg';
    if (type) return type;
    if (/\.png$/i.test(file.name || '')) return 'image/png';
    if (/\.webp$/i.test(file.name || '')) return 'image/webp';
    return 'image/jpeg';
  }

  function getImageDimensions(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height }); };
      img.onerror = function () { reject(new Error('Image could not be read.')); };
      img.src = src;
    });
  }

  function renderImageList() {
    els.imgFileList.innerHTML = '';
    state.imageItems.forEach(function (item, index) {
      var row = document.createElement('div');
      row.className = 'file-item';
      row.draggable = true;
      row.dataset.index = String(index);

      var info = document.createElement('div');
      info.className = 'file-item-info';
      var order = document.createElement('span');
      order.style.cssText = 'font-size:0.72rem;color:#6B8CAE;font-weight:700;min-width:20px;';
      order.textContent = String(index + 1);
      var thumb = document.createElement('img');
      thumb.className = 'file-item-thumb';
      thumb.src = item.url;
      thumb.alt = '';
      var nameWrap = document.createElement('div');
      nameWrap.style.minWidth = '0';
      var name = document.createElement('div');
      name.className = 'file-item-name';
      name.setAttribute('translate', 'no');
      name.textContent = item.file.name;
      var meta = document.createElement('div');
      meta.className = 'file-item-size';
      meta.textContent = item.width + ' x ' + item.height + ' px - ' + formatBytes(item.file.size);
      nameWrap.appendChild(name);
      nameWrap.appendChild(meta);
      info.appendChild(order);
      info.appendChild(thumb);
      info.appendChild(nameWrap);

      var actions = document.createElement('div');
      actions.className = 'file-actions';
      var up = document.createElement('button');
      up.className = 'mini-btn';
      up.type = 'button';
      up.textContent = native("Up","Monter","Juu");
      up.disabled = index === 0;
      up.addEventListener('click', function () { moveImage(index, -1); });
      var down = document.createElement('button');
      down.className = 'mini-btn';
      down.type = 'button';
      down.textContent = native("Down","Descendre","Chini");
      down.disabled = index === state.imageItems.length - 1;
      down.addEventListener('click', function () { moveImage(index, 1); });
      var remove = document.createElement('button');
      remove.className = 'file-item-remove';
      remove.type = 'button';
      remove.textContent = native("Remove","Supprimer","Ondoa");
      remove.addEventListener('click', function () { removeImage(index); });
      actions.appendChild(up);
      actions.appendChild(down);
      actions.appendChild(remove);

      row.addEventListener('dragstart', function () {
        state.dragIndex = Number(row.dataset.index);
        row.classList.add('dragging');
      });
      row.addEventListener('dragend', function () {
        state.dragIndex = null;
        row.classList.remove('dragging');
      });
      row.addEventListener('dragover', function (event) {
        event.preventDefault();
      });
      row.addEventListener('drop', function (event) {
        event.preventDefault();
        if (state.busy) return;
        invalidatePdf();
        var from = state.dragIndex;
        var to = Number(row.dataset.index);
        if (Number.isInteger(from) && Number.isInteger(to) && from !== to) {
          var moved = state.imageItems.splice(from, 1)[0];
          state.imageItems.splice(to, 0, moved);
          renderImageList();
        }
      });

      row.appendChild(info);
      row.appendChild(actions);
      els.imgFileList.appendChild(row);
    });
  }

  function moveImage(index, delta) {
    if (state.busy) return;
    invalidatePdf();
    var target = index + delta;
    if (target < 0 || target >= state.imageItems.length) return;
    var item = state.imageItems[index];
    state.imageItems[index] = state.imageItems[target];
    state.imageItems[target] = item;
    renderImageList();
  }

  function removeImage(index) {
    if (state.busy) return;
    invalidatePdf();
    var item = state.imageItems.splice(index, 1)[0];
    if (item && item.url) URL.revokeObjectURL(item.url);
    renderImageList();
    els.i2pConvertBtn.disabled = state.imageItems.length === 0;
    els.i2pResultCard.classList.add('hidden');
    setText(els.i2pStatus, '');
  }

  function resetImg2Pdf() {
    if (state.busy) return;
    revokeImageItems();
    state.pdfDownload = null;
    els.imgFileInput.value = '';
    els.imgFileList.innerHTML = '';
    els.i2pConvertBtn.disabled = true;
    els.i2pResultCard.classList.add('hidden');
    els.i2pFileName.value = '';
    setText(els.i2pStatus, '');
    clearProgress('i2p');
  }

  function marginPoints() {
    return (Number(els.i2pMargin.value) || 0) * 72 / 25.4;
  }

  function pageDimensionsFor(item, margin) {
    var pageSize = els.i2pPageSize.value;
    var dims;
    if (pageSize === 'fit') {
      dims = [item.width * 72 / 96 + margin * 2, item.height * 72 / 96 + margin * 2];
    } else {
      dims = (PAGE_SIZES[pageSize] || PAGE_SIZES.a4).slice();
    }
    var orientation = els.i2pOrientation.value;
    if (orientation === 'auto') orientation = item.width >= item.height ? 'landscape' : 'portrait';
    if (orientation === 'landscape' && dims[0] < dims[1]) dims = [dims[1], dims[0]];
    if (orientation === 'portrait' && dims[0] > dims[1]) dims = [dims[1], dims[0]];
    return dims;
  }

  function fitRectangle(imgW, imgH, areaW, areaH, mode) {
    if (mode === 'stretch') return { width: areaW, height: areaH, x: 0, y: 0 };
    var imgAspect = imgW / imgH;
    var areaAspect = areaW / areaH;
    var width;
    var height;
    if (mode === 'cover') {
      if (imgAspect > areaAspect) {
        height = areaH;
        width = areaH * imgAspect;
      } else {
        width = areaW;
        height = areaW / imgAspect;
      }
    } else if (imgAspect > areaAspect) {
      width = areaW;
      height = areaW / imgAspect;
    } else {
      height = areaH;
      width = areaH * imgAspect;
    }
    return {
      width: width,
      height: height,
      x: (areaW - width) / 2,
      y: (areaH - height) / 2
    };
  }

  async function imageBytesForPdf(item, quality) {
    var mode = els.i2pImageMode.value;
    if (mode === 'auto' && item.type === 'image/png') {
      return { type: 'png', bytes: new Uint8Array(await item.file.arrayBuffer()) };
    }
    if (mode === 'auto' && item.type === 'image/jpeg') {
      return { type: 'jpg', bytes: new Uint8Array(await item.file.arrayBuffer()) };
    }
    return { type: 'jpg', bytes: await imageToJpegBytes(item, quality) };
  }

  async function imageToJpegBytes(item, quality) {
    var img = await loadImageElement(item.url);
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, item.width);
    canvas.height = Math.max(1, item.height);
    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not create image canvas.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    var bytes = await canvasToJpegBytes(canvas, quality);
    canvas.width = 1;
    canvas.height = 1;
    return bytes;
  }

  function loadImageElement(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('Image could not be decoded.')); };
      img.src = src;
    });
  }

  async function convertImagesToPdf() {
    if (!state.imageItems.length || state.busy) return;
    var pdfLib = getPdfLib();
    var PDFDocument = pdfLib.PDFDocument;
    var margin = marginPoints();
    var quality = Number(els.i2pQuality.value) / 100;
    var fitMode = els.i2pFit.value;
    var outputName = cleanPdfName(els.i2pFileName.value || DEFAULT_OUTPUT_NAME);

    setBusy(true, 'img2pdf');
    setText(els.i2pStatus, '');
    els.i2pResultCard.classList.add('hidden');
    state.pdfDownload = null;

    try {
      var pdfDoc = await PDFDocument.create();
      pdfDoc.setTitle(outputName.replace(/\.pdf$/i, ''));
      pdfDoc.setProducer('AfroTools PDF Image Converter');
      for (var i = 0; i < state.imageItems.length; i++) {
        var item = state.imageItems[i];
        setProgress('i2p', (i / state.imageItems.length) * 96, native('Adding image ', 'Ajout de l’image ', 'Inaongeza picha ') + (i + 1) + ' / ' + state.imageItems.length);
        var prepared = await imageBytesForPdf(item, quality);
        var embedded = prepared.type === 'png'
          ? await pdfDoc.embedPng(prepared.bytes)
          : await pdfDoc.embedJpg(prepared.bytes);
        var dims = pageDimensionsFor(item, margin);
        var page = pdfDoc.addPage(dims);
        var areaW = Math.max(1, dims[0] - margin * 2);
        var areaH = Math.max(1, dims[1] - margin * 2);
        var rect = fitRectangle(embedded.width, embedded.height, areaW, areaH, fitMode);
        page.pushOperators(PDFLib.pushGraphicsState(), PDFLib.rectangle(margin, margin, areaW, areaH), PDFLib.clip(), PDFLib.endPath());
        page.drawImage(embedded, {
          x: margin + rect.x,
          y: margin + rect.y,
          width: rect.width,
          height: rect.height
        });
        page.pushOperators(PDFLib.popGraphicsState());
      }
      var bytes = await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
      var blob = new Blob([bytes], { type: 'application/pdf' });
      state.pdfDownload = { blob: blob, filename: outputName };
      setProgress('i2p', 100, native("Done. PDF created.","Terminé. PDF créé.","Imekamilika. PDF imeundwa."));
      setText(els.i2pResultName, outputName);
      setText(els.i2pResultInfo, native('Pages: ', 'Pages : ', 'Kurasa: ') + state.imageItems.length + ' - ' + formatBytes(blob.size));
      var note = native('Source images: ', 'Images sources : ', 'Picha za chanzo: ') + state.imageItems.length + ' (' + els.i2pPageSize.selectedOptions[0].textContent + ').';
      if (els.i2pImageMode.value === 'auto') note += native(' PNG and JPG originals were preserved where PDF-compatible.', ' Les originaux PNG et JPG ont été conservés lorsque le PDF le permet.', ' Picha asili za PNG na JPG zimehifadhiwa zinapolingana na PDF.');
      else note += native(' JPG quality: ', ' Qualité JPG : ', ' Ubora wa JPG: ') + els.i2pQuality.value + '%.';
      setText(els.i2pResultNote, note);
      els.i2pResultCard.classList.remove('hidden');
    } catch (err) {
      setText(els.i2pStatus, native('Could not create the PDF. Check the images and try again.', 'Impossible de créer le PDF. Vérifiez les images et réessayez.', 'PDF haikuundwa. Kagua picha kisha ujaribu tena.'));
    } finally {
      setBusy(false, 'img2pdf');
    }
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
      var checksum = crc32(data);
      var local = new Uint8Array(30 + name.length);
      var localView = new DataView(local.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint32(14, checksum, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, name.length, true);
      local.set(name, 30);

      var entry = new Uint8Array(46 + name.length);
      var entryView = new DataView(entry.buffer);
      entryView.setUint32(0, 0x02014b50, true);
      entryView.setUint16(4, 20, true);
      entryView.setUint16(6, 20, true);
      entryView.setUint32(16, checksum, true);
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

  function bindDropZone(zone, input, handler) {
    zone.addEventListener('click', function () { input.click(); });
    zone.addEventListener('dragover', function (event) {
      event.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('dragover');
    });
    zone.addEventListener('drop', function (event) {
      event.preventDefault();
      zone.classList.remove('dragover');
      handler(event.dataTransfer.files);
    });
  }

  function bindEvents() {
    ['p2iMode','p2iFormat','p2iScale','p2iPages','p2iQuality'].forEach(function (id) { els[id].addEventListener('input', invalidateImages); els[id].addEventListener('change', invalidateImages); });
    ['i2pPageSize','i2pOrientation','i2pFit','i2pImageMode','i2pFileName','i2pMargin','i2pQuality'].forEach(function (id) { els[id].addEventListener('input', invalidatePdf); els[id].addEventListener('change', invalidatePdf); });
    els.modePdfToImg.addEventListener('click', function () { switchMode('pdf2img'); });
    els.modeImgToPdf.addEventListener('click', function () { switchMode('img2pdf'); });
    els.p2iMode.addEventListener('change', updateQualityControls);
    els.p2iFormat.addEventListener('change', updateQualityControls);
    els.p2iQuality.addEventListener('input', updateQualityControls);
    els.i2pImageMode.addEventListener('change', updateQualityControls);
    els.i2pQuality.addEventListener('input', updateQualityControls);
    els.i2pMargin.addEventListener('input', updateQualityControls);
    els.pdfRemoveBtn.addEventListener('click', resetPdf2Img);
    els.p2iResetBtn.addEventListener('click', resetPdf2Img);
    els.p2iConvertBtn.addEventListener('click', convertPdfToImages);
    els.p2iZipBtn.addEventListener('click', downloadImagesZip);
    els.i2pConvertBtn.addEventListener('click', convertImagesToPdf);
    els.i2pResetBtn.addEventListener('click', resetImg2Pdf);
    els.i2pDownloadBtn.addEventListener('click', function () {
      if (state.pdfDownload) downloadBlob(state.pdfDownload.blob, state.pdfDownload.filename);
    });
    els.pdfFileInput.addEventListener('change', function (event) {
      var file = event.target.files && event.target.files[0];
      if (file) handlePdfFile(file);
      event.target.value = '';
    });
    els.imgFileInput.addEventListener('change', function (event) {
      addImageFiles(event.target.files);
      event.target.value = '';
    });
    bindDropZone(els.pdfDropZone, els.pdfFileInput, function (files) {
      if (files && files[0]) handlePdfFile(files[0]);
    });
    bindDropZone(els.imgDropZone, els.imgFileInput, addImageFiles);
  }

  function cacheElements() {
    els.modePdfToImg = $('modePdfToImg');
    els.modeImgToPdf = $('modeImgToPdf');
    els.pdf2imgPanel = $('pdf2img-panel');
    els.img2pdfPanel = $('img2pdf-panel');
    els.pdfDropZone = $('pdfDropZone');
    els.pdfFileInput = $('pdfFileInput');
    els.pdfFileInfo = $('pdfFileInfo');
    els.pdfFileName = $('pdfFileName');
    els.pdfFileSize = $('pdfFileSize');
    els.pdfPageCount = $('pdfPageCount');
    els.pdfRemoveBtn = $('pdfRemoveBtn');
    els.p2iFormat = $('p2iFormat');
    els.p2iMode = $('p2iMode');
    els.p2iScale = $('p2iScale');
    els.p2iPages = $('p2iPages');
    els.p2iPagesHint = $('p2iPagesHint');
    els.p2iQualityWrap = $('p2iQualityWrap');
    els.p2iQualityLabel = $('p2iQualityLabel');
    els.p2iQuality = $('p2iQuality');
    els.p2iQualityVal = $('p2iQualityVal');
    els.p2iConvertBtn = $('p2iConvertBtn');
    els.p2iProgress = $('p2iProgress');
    els.p2iProgressFill = $('p2iProgressFill');
    els.p2iProgressText = $('p2iProgressText');
    els.p2iStatus = $('p2iStatus');
    els.p2iResultCard = $('p2iResultCard');
    els.p2iThumbGrid = $('p2iThumbGrid');
    els.p2iResultNote = $('p2iResultNote');
    els.p2iZipBtn = $('p2iZipBtn');
    els.p2iResetBtn = $('p2iResetBtn');
    els.imgDropZone = $('imgDropZone');
    els.imgFileInput = $('imgFileInput');
    els.imgFileList = $('imgFileList');
    els.i2pPageSize = $('i2pPageSize');
    els.i2pOrientation = $('i2pOrientation');
    els.i2pFit = $('i2pFit');
    els.i2pImageMode = $('i2pImageMode');
    els.i2pFileName = $('i2pFileName');
    els.i2pMargin = $('i2pMargin');
    els.i2pMarginVal = $('i2pMarginVal');
    els.i2pQualityWrap = $('i2pQualityWrap');
    els.i2pQuality = $('i2pQuality');
    els.i2pQualityVal = $('i2pQualityVal');
    els.i2pConvertBtn = $('i2pConvertBtn');
    els.i2pProgress = $('i2pProgress');
    els.i2pProgressFill = $('i2pProgressFill');
    els.i2pProgressText = $('i2pProgressText');
    els.i2pStatus = $('i2pStatus');
    els.i2pResultCard = $('i2pResultCard');
    els.i2pResultName = $('i2pResultName');
    els.i2pResultInfo = $('i2pResultInfo');
    els.i2pResultNote = $('i2pResultNote');
    els.i2pDownloadBtn = $('i2pDownloadBtn');
    els.i2pResetBtn = $('i2pResetBtn');
  }

  function init() {
    cacheElements();
    [els.pdfFileName, els.i2pResultName].forEach(function (el) { el.setAttribute('translate', 'no'); });
    getPdfJs();
    updateQualityControls();
    bindEvents();
    switchMode('pdf2img');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
