(function () {
  'use strict';

  var SETTINGS_KEY = 'afro_background_remover_settings_v2';
  var HISTORY_KEY = 'afro_background_remover_history_v1';
  var CHECK_KEY = 'afro_background_remover_checklist_v1';
  var MAX_WORKING_SIDE = 2200;
  var MAX_HISTORY = 8;
  var MAX_UNDO = 12;

  var PRESETS = {
    product: {
      label: 'Product',
      mode: 'edge',
      tolerance: 42,
      feather: 1,
      background: 'white',
      format: 'image/png',
      cropSubject: true,
      padding: 28,
      suffix: 'product-cutout'
    },
    portrait: {
      label: 'Portrait',
      mode: 'person',
      tolerance: 38,
      feather: 2,
      background: 'transparent',
      format: 'image/png',
      cropSubject: true,
      padding: 34,
      suffix: 'portrait-cutout'
    },
    signature: {
      label: 'Signature',
      mode: 'color',
      tolerance: 70,
      feather: 0,
      background: 'transparent',
      format: 'image/png',
      cropSubject: true,
      padding: 18,
      suffix: 'signature-transparent'
    },
    creator: {
      label: 'Creator asset',
      mode: 'edge',
      tolerance: 48,
      feather: 2,
      background: 'transparent',
      format: 'image/webp',
      cropSubject: true,
      padding: 42,
      suffix: 'creator-cutout'
    }
  };

  var BACKGROUNDS = {
    white: '#ffffff',
    charcoal: '#0f172a',
    'brand-blue': '#1d4ed8',
    'soft-grey': '#f1f5f9'
  };

  var els = {};
  var state = {
    preset: 'product',
    mode: 'edge',
    tolerance: 42,
    feather: 1,
    brushMode: 'erase',
    brushSize: 34,
    background: 'white',
    customBackground: '#ffffff',
    sampleColor: { r: 243, g: 244, b: 246 },
    format: 'image/png',
    quality: 0.92,
    maxWidth: 1600,
    cropSubject: true,
    padding: 28,
    suffix: 'product-cutout'
  };

  var queue = [];
  var activeQueueIndex = -1;
  var sourceRecord = null;
  var maskCanvas = null;
  var outputBlob = null;
  var outputUrl = '';
  var lastExportMeta = null;
  var history = [];
  var undoStack = [];
  var pickingColor = false;
  var painting = false;
  var bodyPixModel = null;
  var modelLoading = null;

  function init() {
    cacheElements();
    if (!els.input || !els.resultCanvas) return;
    loadSettings();
    loadHistory();
    loadChecklist();
    applyStateToControls();
    bindEvents();
    renderQueue();
    renderHistory();
    updateControlLabels();
    updateStats();
    updateButtons();
    setStatus('Ready. Add an image, choose a recipe, then remove the background.');
  }

  function cacheElements() {
    els.status = document.getElementById('brStatus');
    els.dropZone = document.getElementById('brDropZone');
    els.input = document.getElementById('brInput');
    els.queue = document.getElementById('brQueue');
    els.presetButtons = Array.prototype.slice.call(document.querySelectorAll('[data-br-preset]'));
    els.mode = document.getElementById('brMode');
    els.sampleColor = document.getElementById('brSampleColor');
    els.pickColor = document.getElementById('brPickColor');
    els.tolerance = document.getElementById('brTolerance');
    els.toleranceValue = document.getElementById('brToleranceValue');
    els.feather = document.getElementById('brFeather');
    els.featherValue = document.getElementById('brFeatherValue');
    els.process = document.getElementById('brProcessBtn');
    els.batch = document.getElementById('brBatchBtn');
    els.resetMask = document.getElementById('brResetMaskBtn');
    els.undo = document.getElementById('brUndoBtn');
    els.brushButtons = Array.prototype.slice.call(document.querySelectorAll('[data-br-brush]'));
    els.brushSize = document.getElementById('brBrushSize');
    els.brushSizeValue = document.getElementById('brBrushSizeValue');
    els.originalCanvas = document.getElementById('brOriginalCanvas');
    els.resultCanvas = document.getElementById('brResultCanvas');
    els.originalEmpty = document.getElementById('brOriginalEmpty');
    els.resultEmpty = document.getElementById('brResultEmpty');
    els.originalMeta = document.getElementById('brOriginalMeta');
    els.resultMeta = document.getElementById('brResultMeta');
    els.background = document.getElementById('brBackground');
    els.customBackground = document.getElementById('brCustomBackground');
    els.format = document.getElementById('brFormat');
    els.quality = document.getElementById('brQuality');
    els.qualityValue = document.getElementById('brQualityValue');
    els.maxWidth = document.getElementById('brMaxWidth');
    els.suffix = document.getElementById('brSuffix');
    els.cropSubject = document.getElementById('brCropSubject');
    els.padding = document.getElementById('brPadding');
    els.paddingValue = document.getElementById('brPaddingValue');
    els.render = document.getElementById('brRenderBtn');
    els.download = document.getElementById('brDownloadBtn');
    els.copyBrief = document.getElementById('brCopyBriefBtn');
    els.sourceStat = document.getElementById('brSourceStat');
    els.removedStat = document.getElementById('brRemovedStat');
    els.exportStat = document.getElementById('brExportStat');
    els.recipeStat = document.getElementById('brRecipeStat');
    els.checks = Array.prototype.slice.call(document.querySelectorAll('[data-br-check]'));
    els.history = document.getElementById('brHistoryList');
  }

  function bindEvents() {
    els.dropZone.addEventListener('click', function () {
      els.input.click();
    });
    els.dropZone.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        els.input.click();
      }
    });
    els.dropZone.addEventListener('dragover', function (event) {
      event.preventDefault();
      els.dropZone.classList.add('dragover');
    });
    els.dropZone.addEventListener('dragleave', function () {
      els.dropZone.classList.remove('dragover');
    });
    els.dropZone.addEventListener('drop', function (event) {
      event.preventDefault();
      els.dropZone.classList.remove('dragover');
      handleFiles(event.dataTransfer.files);
    });
    els.input.addEventListener('change', function () {
      handleFiles(els.input.files);
      els.input.value = '';
    });
    document.addEventListener('paste', function (event) {
      if (!event.clipboardData || !event.clipboardData.files.length) return;
      var files = Array.prototype.filter.call(event.clipboardData.files, function (file) {
        return file.type && file.type.indexOf('image/') === 0;
      });
      if (files.length) handleFiles(files);
    });

    els.presetButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyPreset(button.getAttribute('data-br-preset'), true);
      });
    });
    els.brushButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        state.brushMode = button.getAttribute('data-br-brush') || 'erase';
        updateBrushButtons();
        saveSettings();
      });
    });

    els.mode.addEventListener('change', function () {
      state.mode = els.mode.value;
      invalidateExport();
      saveSettings();
      updateStats();
      setStatus(methodStatus());
    });
    els.sampleColor.addEventListener('input', function () {
      state.sampleColor = hexToRgb(els.sampleColor.value);
      invalidateExport();
      saveSettings();
    });
    els.pickColor.addEventListener('click', function () {
      if (!sourceRecord) {
        setStatus('Load an image before picking a background sample.');
        return;
      }
      pickingColor = true;
      els.pickColor.textContent = 'Click preview';
      setStatus('Click a background area in either preview to sample that color.');
    });
    els.tolerance.addEventListener('input', function () {
      state.tolerance = numberValue(els.tolerance.value, 42);
      updateControlLabels();
      invalidateExport();
      saveSettings();
    });
    els.feather.addEventListener('input', function () {
      state.feather = numberValue(els.feather.value, 1);
      updateControlLabels();
      renderPreview();
      invalidateExport();
      saveSettings();
    });
    els.brushSize.addEventListener('input', function () {
      state.brushSize = numberValue(els.brushSize.value, 34);
      updateControlLabels();
      saveSettings();
    });
    els.background.addEventListener('change', function () {
      state.background = els.background.value;
      renderPreview();
      invalidateExport();
      saveSettings();
    });
    els.customBackground.addEventListener('input', function () {
      state.customBackground = els.customBackground.value || '#ffffff';
      if (state.background === 'custom') renderPreview();
      invalidateExport();
      saveSettings();
    });
    els.format.addEventListener('change', function () {
      state.format = els.format.value;
      invalidateExport();
      saveSettings();
      updateStats();
    });
    els.quality.addEventListener('input', function () {
      state.quality = numberValue(els.quality.value, 92) / 100;
      updateControlLabels();
      invalidateExport();
      saveSettings();
    });
    els.maxWidth.addEventListener('input', function () {
      state.maxWidth = Math.max(0, numberValue(els.maxWidth.value, 0));
      invalidateExport();
      saveSettings();
    });
    els.suffix.addEventListener('input', function () {
      state.suffix = cleanSuffix(els.suffix.value || 'cutout');
      invalidateExport();
      saveSettings();
    });
    els.cropSubject.addEventListener('change', function () {
      state.cropSubject = !!els.cropSubject.checked;
      invalidateExport();
      saveSettings();
    });
    els.padding.addEventListener('input', function () {
      state.padding = numberValue(els.padding.value, 24);
      updateControlLabels();
      invalidateExport();
      saveSettings();
    });

    els.process.addEventListener('click', function () {
      processCurrent();
    });
    els.batch.addEventListener('click', processQueue);
    els.resetMask.addEventListener('click', function () {
      if (!sourceRecord) return;
      pushUndo();
      resetMask(true);
      setStatus('Mask reset. Run a cutout recipe or refine manually.');
    });
    els.undo.addEventListener('click', undoMask);
    els.render.addEventListener('click', function () {
      renderExport();
    });
    els.download.addEventListener('click', downloadExport);
    els.copyBrief.addEventListener('click', copyBrief);

    [els.originalCanvas, els.resultCanvas].forEach(function (canvas) {
      canvas.addEventListener('click', handleCanvasClick);
    });
    els.resultCanvas.addEventListener('pointerdown', startBrush);
    els.resultCanvas.addEventListener('pointermove', moveBrush);
    els.resultCanvas.addEventListener('pointerup', stopBrush);
    els.resultCanvas.addEventListener('pointercancel', stopBrush);
    els.resultCanvas.addEventListener('pointerleave', stopBrush);

    els.checks.forEach(function (check) {
      check.addEventListener('change', saveChecklist);
    });
  }

  function handleFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []).filter(function (file) {
      return file.type && file.type.indexOf('image/') === 0;
    });
    if (!files.length) {
      setStatus('Choose a JPG, PNG, WebP, SVG, or browser-supported image file.');
      return;
    }
    files.forEach(function (file) {
      queue.push({
        file: file,
        name: file.name || 'image',
        size: file.size || 0,
        processed: false
      });
    });
    renderQueue();
    if (activeQueueIndex < 0) {
      loadQueueItem(0);
    } else {
      setStatus(files.length + ' image' + (files.length === 1 ? '' : 's') + ' added to the queue.');
      updateButtons();
    }
  }

  function renderQueue() {
    if (!els.queue) return;
    els.queue.innerHTML = '';
    queue.forEach(function (item, index) {
      var row = document.createElement('div');
      row.className = 'br-queue-item' + (index === activeQueueIndex ? ' active' : '');
      var meta = item.processed ? 'Processed' : formatBytes(item.size);
      row.innerHTML = '<div><strong></strong><span></span></div><button type="button">Load</button>';
      row.querySelector('strong').textContent = item.name;
      row.querySelector('span').textContent = meta;
      row.querySelector('button').addEventListener('click', function () {
        loadQueueItem(index);
      });
      els.queue.appendChild(row);
    });
  }

  async function loadQueueItem(index, options) {
    var item = queue[index];
    if (!item) return;
    options = options || {};
    try {
      setStatus(options.silent ? 'Loading queued image...' : 'Loading ' + item.name + '...');
      var loaded = await loadImageFromFile(item.file);
      activeQueueIndex = index;
      sourceRecord = {
        name: item.name,
        size: item.size,
        sourceCanvas: loaded.canvas,
        originalWidth: loaded.originalWidth,
        originalHeight: loaded.originalHeight,
        workingWidth: loaded.canvas.width,
        workingHeight: loaded.canvas.height,
        maskReady: false,
        removedRatio: null
      };
      sampleDefaultColor();
      resetMask(false);
      undoStack = [];
      lastExportMeta = null;
      invalidateExport();
      drawOriginal();
      renderPreview();
      renderQueue();
      updateStats();
      updateButtons();
      setStatus('Loaded ' + item.name + '. Choose a recipe and remove the background.');
    } catch (error) {
      setStatus('This image could not be decoded by the browser. Try JPG, PNG, or WebP.');
    }
  }

  function loadImageFromFile(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        try {
          var canvas = normalizeImage(image);
          URL.revokeObjectURL(url);
          resolve({
            canvas: canvas,
            originalWidth: image.naturalWidth || image.width,
            originalHeight: image.naturalHeight || image.height
          });
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('decode failed'));
      };
      image.src = url;
    });
  }

  function normalizeImage(image) {
    var width = image.naturalWidth || image.width;
    var height = image.naturalHeight || image.height;
    if (!width || !height) throw new Error('empty image');
    var scale = Math.min(1, MAX_WORKING_SIDE / Math.max(width, height));
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('canvas unavailable');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  function drawOriginal() {
    if (!sourceRecord) return;
    setCanvasSize(els.originalCanvas, sourceRecord.workingWidth, sourceRecord.workingHeight);
    var ctx = els.originalCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, els.originalCanvas.width, els.originalCanvas.height);
    ctx.drawImage(sourceRecord.sourceCanvas, 0, 0);
    els.originalCanvas.hidden = false;
    els.originalEmpty.hidden = true;
    els.originalMeta.textContent = sourceRecord.workingWidth + ' x ' + sourceRecord.workingHeight;
  }

  function resetMask(markReady) {
    if (!sourceRecord) return;
    maskCanvas = document.createElement('canvas');
    maskCanvas.width = sourceRecord.workingWidth;
    maskCanvas.height = sourceRecord.workingHeight;
    var ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    sourceRecord.maskReady = !!markReady;
    sourceRecord.removedRatio = markReady ? 0 : null;
    renderPreview();
    invalidateExport();
    updateStats();
    updateButtons();
  }

  async function processCurrent(options) {
    options = options || {};
    if (!sourceRecord) {
      setStatus('Load an image before removing a background.');
      return;
    }
    pushUndo();
    setBusy(true);
    invalidateExport();
    try {
      if (state.mode === 'person') {
        await buildPersonMask();
      } else if (state.mode === 'color') {
        buildColorMask();
      } else {
        buildEdgeMask();
      }
      sourceRecord.maskReady = true;
      renderPreview();
      updateStats();
      updateButtons();
      if (!options.batch) {
        setStatus('Background removed. Refine the edge or render an export.');
      }
    } catch (error) {
      if (state.mode === 'person') {
        buildEdgeMask();
        sourceRecord.maskReady = true;
        renderPreview();
        updateStats();
        updateButtons();
        setStatus('AI model was not available, so smart edge cleanup was applied instead.');
      } else {
        setStatus('Could not process this image. Try a lower-resolution image or another method.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function processQueue() {
    if (!queue.length) return;
    setBusy(true);
    var completed = 0;
    for (var index = 0; index < queue.length; index += 1) {
      await loadQueueItem(index, { silent: true });
      await processCurrent({ batch: true });
      await renderExport({ batch: true });
      queue[index].processed = true;
      completed += 1;
    }
    renderQueue();
    setBusy(false);
    setStatus('Processed ' + completed + ' queued image' + (completed === 1 ? '' : 's') + '. The last result is ready to download.');
  }

  function buildColorMask() {
    var src = getSourceImageData();
    var mask = createFullMask(src.width, src.height);
    var srcData = src.data;
    var maskData = mask.data;
    var threshold = state.tolerance;
    var sample = state.sampleColor;
    var removed = 0;
    for (var index = 0; index < src.width * src.height; index += 1) {
      var offset = index * 4;
      var alpha = srcData[offset + 3];
      if (alpha < 12 || colorDistance(srcData[offset], srcData[offset + 1], srcData[offset + 2], sample) <= threshold) {
        maskData[offset + 3] = 0;
        removed += 1;
      }
    }
    putMask(mask, removed);
  }

  function buildEdgeMask() {
    var src = getSourceImageData();
    var total = src.width * src.height;
    var mask = createFullMask(src.width, src.height);
    var maskData = mask.data;
    var visited = new Uint8Array(total);
    var queuePixels = new Int32Array(total);
    var head = 0;
    var tail = 0;
    var removed = 0;
    var threshold = state.tolerance;
    var sample = state.sampleColor;
    var srcData = src.data;

    function isBackground(pixelIndex) {
      var offset = pixelIndex * 4;
      return srcData[offset + 3] < 12 || colorDistance(srcData[offset], srcData[offset + 1], srcData[offset + 2], sample) <= threshold;
    }

    function seed(pixelIndex) {
      if (visited[pixelIndex]) return;
      visited[pixelIndex] = 1;
      if (isBackground(pixelIndex)) {
        queuePixels[tail] = pixelIndex;
        tail += 1;
        maskData[pixelIndex * 4 + 3] = 0;
        removed += 1;
      }
    }

    var x;
    var y;
    var width = src.width;
    var height = src.height;
    for (x = 0; x < width; x += 1) {
      seed(x);
      seed((height - 1) * width + x);
    }
    for (y = 1; y < height - 1; y += 1) {
      seed(y * width);
      seed(y * width + width - 1);
    }

    while (head < tail) {
      var current = queuePixels[head];
      head += 1;
      var cx = current % width;
      var top = current - width;
      var bottom = current + width;
      var left = current - 1;
      var right = current + 1;
      if (top >= 0) seed(top);
      if (bottom < total) seed(bottom);
      if (cx > 0) seed(left);
      if (cx < width - 1) seed(right);
    }
    putMask(mask, removed);
  }

  async function buildPersonMask() {
    setStatus('Loading the in-browser person model...');
    var model = await ensureBodyPix();
    setStatus('Running person cutout on this device...');
    var segmentation = await model.segmentPerson(sourceRecord.sourceCanvas, {
      flipHorizontal: false,
      internalResolution: 'medium',
      segmentationThreshold: 0.55
    });
    var mask = createFullMask(sourceRecord.workingWidth, sourceRecord.workingHeight);
    var data = mask.data;
    var removed = 0;
    for (var index = 0; index < segmentation.data.length; index += 1) {
      if (!segmentation.data[index]) {
        data[index * 4 + 3] = 0;
        removed += 1;
      }
    }
    putMask(mask, removed);
  }

  function ensureBodyPix() {
    if (bodyPixModel) return Promise.resolve(bodyPixModel);
    if (modelLoading) return modelLoading;
    modelLoading = Promise.resolve()
      .then(function () {
        if (window.tf) return null;
        return loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js');
      })
      .then(function () {
        if (window.bodyPix) return null;
        return loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.2.0/dist/body-pix.min.js');
      })
      .then(function () {
        if (!window.bodyPix) throw new Error('BodyPix unavailable');
        return window.bodyPix.load({
          architecture: 'MobileNetV1',
          outputStride: 16,
          multiplier: 0.75,
          quantBytes: 2
        });
      })
      .then(function (model) {
        bodyPixModel = model;
        return bodyPixModel;
      });
    return modelLoading;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error('script failed: ' + src));
      };
      document.head.appendChild(script);
    });
  }

  function createFullMask(width, height) {
    var ctx = getMaskContext(width, height);
    var mask = ctx.createImageData(width, height);
    for (var index = 3; index < mask.data.length; index += 4) {
      mask.data[index] = 255;
    }
    return mask;
  }

  function getSourceImageData() {
    var ctx = sourceRecord.sourceCanvas.getContext('2d', { willReadFrequently: true });
    return ctx.getImageData(0, 0, sourceRecord.workingWidth, sourceRecord.workingHeight);
  }

  function putMask(maskData, removed) {
    var ctx = getMaskContext(maskData.width, maskData.height);
    ctx.putImageData(maskData, 0, 0);
    sourceRecord.removedRatio = removed / Math.max(1, maskData.width * maskData.height);
  }

  function getMaskContext(width, height) {
    if (!maskCanvas) {
      maskCanvas = document.createElement('canvas');
    }
    maskCanvas.width = width;
    maskCanvas.height = height;
    var ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('mask unavailable');
    return ctx;
  }

  function renderPreview() {
    if (!sourceRecord) return;
    var composed = composeCanvas({ crop: false, format: state.format });
    setCanvasSize(els.resultCanvas, composed.width, composed.height);
    var ctx = els.resultCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, composed.width, composed.height);
    ctx.drawImage(composed, 0, 0);
    els.resultCanvas.hidden = false;
    els.resultCanvas.classList.toggle('br-brushable', !!sourceRecord.maskReady);
    els.resultEmpty.hidden = true;
    els.resultMeta.textContent = sourceRecord.maskReady ? 'Brush ready' : 'Mask not cut';
    updateRemovedRatioFromMask();
    updateStats();
  }

  function composeCanvas(options) {
    options = options || {};
    var width = sourceRecord.workingWidth;
    var height = sourceRecord.workingHeight;
    var feathered = getFeatheredMaskData();
    var cutout = document.createElement('canvas');
    cutout.width = width;
    cutout.height = height;
    var cutoutCtx = cutout.getContext('2d', { willReadFrequently: true });
    cutoutCtx.drawImage(sourceRecord.sourceCanvas, 0, 0);
    var imageData = cutoutCtx.getImageData(0, 0, width, height);
    var sourceData = imageData.data;
    var maskData = feathered.data;
    for (var index = 0; index < width * height; index += 1) {
      var offset = index * 4;
      sourceData[offset + 3] = Math.round(sourceData[offset + 3] * (maskData[offset + 3] / 255));
    }
    cutoutCtx.putImageData(imageData, 0, 0);

    var composed = document.createElement('canvas');
    composed.width = width;
    composed.height = height;
    var composedCtx = composed.getContext('2d', { willReadFrequently: true });
    var fill = getBackgroundFill(options.format);
    if (fill) {
      composedCtx.fillStyle = fill;
      composedCtx.fillRect(0, 0, width, height);
    }
    composedCtx.drawImage(cutout, 0, 0);

    if (options.crop && state.cropSubject) {
      composed = cropCanvasToMask(composed, feathered);
    }
    composed = scaleCanvasToMaxWidth(composed);
    return composed;
  }

  function getFeatheredMaskData() {
    var ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    var data = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    var radius = Math.max(0, Math.min(8, state.feather));
    if (radius > 0 && sourceRecord.maskReady) {
      blurAlpha(data, maskCanvas.width, maskCanvas.height, radius);
    }
    return data;
  }

  function cropCanvasToMask(canvas, maskData) {
    var bounds = findMaskBounds(maskData);
    if (!bounds) return canvas;
    var padding = Math.max(0, state.padding);
    var x = Math.max(0, bounds.x - padding);
    var y = Math.max(0, bounds.y - padding);
    var right = Math.min(canvas.width, bounds.x + bounds.width + padding);
    var bottom = Math.min(canvas.height, bounds.y + bounds.height + padding);
    var crop = document.createElement('canvas');
    crop.width = Math.max(1, right - x);
    crop.height = Math.max(1, bottom - y);
    var ctx = crop.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(canvas, x, y, crop.width, crop.height, 0, 0, crop.width, crop.height);
    return crop;
  }

  function findMaskBounds(maskData) {
    var data = maskData.data;
    var width = maskData.width;
    var height = maskData.height;
    var minX = width;
    var minY = height;
    var maxX = -1;
    var maxY = -1;
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        var alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 18) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return null;
    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  function scaleCanvasToMaxWidth(canvas) {
    var maxWidth = Math.max(0, Number(state.maxWidth) || 0);
    if (!maxWidth || canvas.width <= maxWidth) return canvas;
    var scale = maxWidth / canvas.width;
    var next = document.createElement('canvas');
    next.width = Math.max(1, Math.round(canvas.width * scale));
    next.height = Math.max(1, Math.round(canvas.height * scale));
    var ctx = next.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, next.width, next.height);
    return next;
  }

  async function renderExport(options) {
    options = options || {};
    if (!sourceRecord || !sourceRecord.maskReady) {
      setStatus('Remove the background before rendering an export.');
      return;
    }
    setBusy(true);
    try {
      var canvas = composeCanvas({ crop: true, format: state.format });
      var type = state.format;
      var quality = type === 'image/png' ? undefined : state.quality;
      var blob = await canvasToBlob(canvas, type, quality);
      if (!blob && type !== 'image/png') {
        type = 'image/png';
        blob = await canvasToBlob(canvas, type);
      }
      if (!blob) throw new Error('blob failed');
      setOutputBlob(blob);
      lastExportMeta = {
        width: canvas.width,
        height: canvas.height,
        type: type,
        size: blob.size
      };
      addHistory(lastExportMeta);
      updateStats();
      updateButtons();
      if (!options.batch) {
        setStatus('Export rendered. Download or copy the handoff brief.');
      }
    } catch (error) {
      setStatus('Export failed. Try a smaller max width or PNG format.');
    } finally {
      setBusy(false);
    }
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve) {
      canvas.toBlob(resolve, type, quality);
    });
  }

  function setOutputBlob(blob) {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputBlob = blob;
    outputUrl = URL.createObjectURL(blob);
  }

  function downloadExport() {
    if (!outputBlob || !outputUrl || !sourceRecord) return;
    var anchor = document.createElement('a');
    anchor.href = outputUrl;
    anchor.download = buildFileName(lastExportMeta ? lastExportMeta.type : state.format);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function buildFileName(type) {
    var base = (sourceRecord.name || 'image').replace(/\.[^.]+$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'image';
    var suffix = cleanSuffix(state.suffix || 'cutout');
    var extension = type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png';
    return base + '-' + suffix + '.' + extension;
  }

  function copyBrief() {
    if (!sourceRecord) return;
    var lines = [
      'Background Remover Studio handoff',
      'Source: ' + sourceRecord.name + ' (' + sourceRecord.workingWidth + ' x ' + sourceRecord.workingHeight + ' working px)',
      'Recipe: ' + getPresetLabel() + ' using ' + methodLabel(state.mode),
      'Background: ' + backgroundLabel(),
      'Export: ' + (lastExportMeta ? lastExportMeta.width + ' x ' + lastExportMeta.height + ', ' + typeLabel(lastExportMeta.type) + ', ' + formatBytes(lastExportMeta.size) : 'not rendered yet'),
      'Crop to subject: ' + (state.cropSubject ? 'yes, ' + state.padding + ' px padding' : 'no'),
      'Images stayed in this browser session. AI person mode, when used, downloads a browser model but does not upload the photo.'
    ];
    copyText(lines.join('\n')).then(function () {
      setStatus('Handoff brief copied.');
    }, function () {
      setStatus('Could not copy automatically. Select the brief from the browser permission prompt if shown.');
    });
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        textarea.remove();
        resolve();
      } catch (error) {
        textarea.remove();
        reject(error);
      }
    });
  }

  function startBrush(event) {
    if (!sourceRecord || !sourceRecord.maskReady || pickingColor) return;
    event.preventDefault();
    painting = true;
    pushUndo();
    els.resultCanvas.setPointerCapture(event.pointerId);
    paintAtEvent(event);
  }

  function moveBrush(event) {
    if (!painting) return;
    event.preventDefault();
    paintAtEvent(event);
  }

  function stopBrush(event) {
    if (!painting) return;
    painting = false;
    try {
      els.resultCanvas.releasePointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture may already be released by the browser.
    }
    renderPreview();
    invalidateExport();
    updateButtons();
  }

  function paintAtEvent(event) {
    var point = canvasPointFromEvent(els.resultCanvas, event);
    if (!point) return;
    var ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    ctx.save();
    ctx.globalCompositeOperation = state.brushMode === 'erase' ? 'destination-out' : 'source-over';
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(point.x, point.y, state.brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    renderPreview();
  }

  function handleCanvasClick(event) {
    if (!pickingColor || !sourceRecord) return;
    var canvas = event.currentTarget;
    var point = canvasPointFromEvent(canvas, event);
    if (!point) return;
    sampleAt(point.x, point.y);
    pickingColor = false;
    els.pickColor.textContent = 'Pick from image';
    setStatus('Background sample updated. Run the cutout recipe again for the new color.');
  }

  function canvasPointFromEvent(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    return {
      x: clamp(Math.round((event.clientX - rect.left) * (canvas.width / rect.width)), 0, canvas.width - 1),
      y: clamp(Math.round((event.clientY - rect.top) * (canvas.height / rect.height)), 0, canvas.height - 1)
    };
  }

  function sampleAt(x, y) {
    var ctx = sourceRecord.sourceCanvas.getContext('2d', { willReadFrequently: true });
    var pixel = ctx.getImageData(x, y, 1, 1).data;
    state.sampleColor = { r: pixel[0], g: pixel[1], b: pixel[2] };
    els.sampleColor.value = rgbToHex(state.sampleColor);
    saveSettings();
  }

  function sampleDefaultColor() {
    var canvas = sourceRecord.sourceCanvas;
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var points = [
      [2, 2],
      [canvas.width - 3, 2],
      [2, canvas.height - 3],
      [canvas.width - 3, canvas.height - 3]
    ];
    var total = { r: 0, g: 0, b: 0 };
    points.forEach(function (point) {
      var pixel = ctx.getImageData(clamp(point[0], 0, canvas.width - 1), clamp(point[1], 0, canvas.height - 1), 1, 1).data;
      total.r += pixel[0];
      total.g += pixel[1];
      total.b += pixel[2];
    });
    state.sampleColor = {
      r: Math.round(total.r / points.length),
      g: Math.round(total.g / points.length),
      b: Math.round(total.b / points.length)
    };
    els.sampleColor.value = rgbToHex(state.sampleColor);
  }

  function pushUndo() {
    if (!maskCanvas) return;
    var ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    undoStack.push(ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    updateButtons();
  }

  function undoMask() {
    if (!undoStack.length || !maskCanvas) return;
    var previous = undoStack.pop();
    var ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    ctx.putImageData(previous, 0, 0);
    sourceRecord.maskReady = true;
    renderPreview();
    invalidateExport();
    updateButtons();
    setStatus('Refine step undone.');
  }

  function applyPreset(key, updateUi) {
    var preset = PRESETS[key] || PRESETS.product;
    state.preset = key;
    state.mode = preset.mode;
    state.tolerance = preset.tolerance;
    state.feather = preset.feather;
    state.background = preset.background;
    state.format = preset.format;
    state.cropSubject = preset.cropSubject;
    state.padding = preset.padding;
    state.suffix = preset.suffix;
    applyStateToControls();
    updatePresetButtons();
    renderPreview();
    invalidateExport();
    saveSettings();
    if (updateUi) setStatus(preset.label + ' recipe loaded. Run background removal to apply it.');
  }

  function applyStateToControls() {
    if (!els.mode) return;
    els.mode.value = state.mode;
    els.sampleColor.value = rgbToHex(state.sampleColor);
    els.tolerance.value = state.tolerance;
    els.feather.value = state.feather;
    els.brushSize.value = state.brushSize;
    els.background.value = state.background;
    els.customBackground.value = state.customBackground;
    els.format.value = state.format;
    els.quality.value = Math.round(state.quality * 100);
    els.maxWidth.value = state.maxWidth;
    els.suffix.value = state.suffix;
    els.cropSubject.checked = !!state.cropSubject;
    els.padding.value = state.padding;
    updatePresetButtons();
    updateBrushButtons();
    updateControlLabels();
  }

  function updatePresetButtons() {
    els.presetButtons.forEach(function (button) {
      var active = button.getAttribute('data-br-preset') === state.preset;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateBrushButtons() {
    els.brushButtons.forEach(function (button) {
      var active = button.getAttribute('data-br-brush') === state.brushMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateControlLabels() {
    els.toleranceValue.textContent = String(state.tolerance);
    els.featherValue.textContent = state.feather + ' px';
    els.brushSizeValue.textContent = state.brushSize + ' px';
    els.qualityValue.textContent = Math.round(state.quality * 100) + '%';
    els.paddingValue.textContent = state.padding + ' px';
  }

  function updateStats() {
    if (!sourceRecord) {
      els.sourceStat.textContent = '-';
      els.removedStat.textContent = '-';
      els.exportStat.textContent = '-';
      els.recipeStat.textContent = getPresetLabel();
      return;
    }
    els.sourceStat.textContent = sourceRecord.workingWidth + ' x ' + sourceRecord.workingHeight;
    els.removedStat.textContent = sourceRecord.removedRatio === null ? 'Not processed' : Math.round(sourceRecord.removedRatio * 100) + '%';
    els.exportStat.textContent = lastExportMeta ? lastExportMeta.width + ' x ' + lastExportMeta.height + ', ' + formatBytes(lastExportMeta.size) : typeLabel(state.format);
    els.recipeStat.textContent = getPresetLabel() + ', ' + methodLabel(state.mode);
  }

  function updateRemovedRatioFromMask() {
    if (!sourceRecord || !maskCanvas) return;
    var ctx = maskCanvas.getContext('2d', { willReadFrequently: true });
    var data = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
    var removed = 0;
    var total = maskCanvas.width * maskCanvas.height;
    for (var index = 3; index < data.length; index += 4) {
      if (data[index] < 128) removed += 1;
    }
    sourceRecord.removedRatio = sourceRecord.maskReady ? removed / Math.max(1, total) : null;
  }

  function updateButtons() {
    var hasSource = !!sourceRecord;
    var hasMask = !!(sourceRecord && sourceRecord.maskReady);
    els.process.disabled = !hasSource;
    els.batch.disabled = queue.length < 2;
    els.resetMask.disabled = !hasSource;
    els.undo.disabled = !undoStack.length;
    els.render.disabled = !hasMask;
    els.download.disabled = !outputBlob;
    els.copyBrief.disabled = !sourceRecord;
  }

  function setBusy(isBusy) {
    els.process.disabled = isBusy || !sourceRecord;
    els.batch.disabled = isBusy || queue.length < 2;
    els.render.disabled = isBusy || !(sourceRecord && sourceRecord.maskReady);
    if (isBusy) {
      els.process.textContent = 'Working...';
      els.batch.textContent = 'Working...';
      els.render.textContent = 'Rendering...';
    } else {
      els.process.textContent = 'Remove background';
      els.batch.textContent = 'Process queue';
      els.render.textContent = 'Render export';
      updateButtons();
    }
  }

  function invalidateExport() {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = '';
    outputBlob = null;
    lastExportMeta = null;
    updateButtons();
    updateStats();
  }

  function setStatus(message) {
    if (els.status) els.status.textContent = message;
  }

  function methodStatus() {
    if (state.mode === 'person') {
      return 'AI person cutout selected. The model downloads only when you run it.';
    }
    if (state.mode === 'color') {
      return 'Color key selected. Pick a background sample or use the corner sample.';
    }
    return 'Smart edge cleanup selected. Best for a clear subject against a plain background.';
  }

  function addHistory(meta) {
    if (!sourceRecord || !meta) return;
    history.unshift({
      name: sourceRecord.name,
      preset: getPresetLabel(),
      method: methodLabel(state.mode),
      background: backgroundLabel(),
      width: meta.width,
      height: meta.height,
      type: typeLabel(meta.type),
      size: meta.size,
      at: new Date().toISOString()
    });
    history = history.slice(0, MAX_HISTORY);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      // Local storage can be disabled or full.
    }
    renderHistory();
  }

  function renderHistory() {
    if (!els.history) return;
    els.history.innerHTML = '';
    if (!history.length) {
      var empty = document.createElement('div');
      empty.className = 'br-history-empty';
      empty.textContent = 'Rendered exports will appear here without storing the image itself.';
      els.history.appendChild(empty);
      return;
    }
    history.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'br-history-item';
      var date = new Date(item.at);
      row.innerHTML = '<strong></strong><span></span>';
      row.querySelector('strong').textContent = item.name;
      row.querySelector('span').textContent = item.width + ' x ' + item.height + ', ' + item.type + ', ' + formatBytes(item.size) + ' - ' + item.preset + ' - ' + readableDate(date);
      els.history.appendChild(row);
    });
  }

  function loadSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      Object.keys(saved).forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(state, key)) {
          state[key] = saved[key];
        }
      });
      if (!PRESETS[state.preset]) state.preset = 'product';
      if (!state.sampleColor || typeof state.sampleColor.r !== 'number') {
        state.sampleColor = { r: 243, g: 244, b: 246 };
      }
    } catch (error) {
      // Keep defaults when local storage is unavailable.
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
    } catch (error) {
      // Local storage can be disabled or full.
    }
  }

  function loadHistory() {
    try {
      var saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      history = Array.isArray(saved) ? saved.slice(0, MAX_HISTORY) : [];
    } catch (error) {
      history = [];
    }
  }

  function loadChecklist() {
    try {
      var saved = JSON.parse(localStorage.getItem(CHECK_KEY) || '{}');
      els.checks.forEach(function (check) {
        check.checked = !!saved[check.getAttribute('data-br-check')];
      });
    } catch (error) {
      // Ignore invalid local state.
    }
  }

  function saveChecklist() {
    var payload = {};
    els.checks.forEach(function (check) {
      payload[check.getAttribute('data-br-check')] = !!check.checked;
    });
    try {
      localStorage.setItem(CHECK_KEY, JSON.stringify(payload));
    } catch (error) {
      // Local storage can be disabled or full.
    }
  }

  function getBackgroundFill(format) {
    if (state.background === 'transparent') {
      return format === 'image/jpeg' ? '#ffffff' : null;
    }
    if (state.background === 'custom') return state.customBackground || '#ffffff';
    return BACKGROUNDS[state.background] || '#ffffff';
  }

  function backgroundLabel() {
    if (state.background === 'transparent') return state.format === 'image/jpeg' ? 'white for JPG export' : 'transparent';
    if (state.background === 'custom') return state.customBackground || 'custom';
    return state.background.replace(/-/g, ' ');
  }

  function methodLabel(mode) {
    if (mode === 'person') return 'AI person cutout';
    if (mode === 'color') return 'color key cleanup';
    return 'smart edge cleanup';
  }

  function getPresetLabel() {
    return (PRESETS[state.preset] && PRESETS[state.preset].label) || 'Product';
  }

  function typeLabel(type) {
    if (type === 'image/jpeg') return 'JPG';
    if (type === 'image/webp') return 'WebP';
    return 'PNG';
  }

  function setCanvasSize(canvas, width, height) {
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
  }

  function colorDistance(r, g, b, sample) {
    var dr = r - sample.r;
    var dg = g - sample.g;
    var db = b - sample.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function blurAlpha(imageData, width, height, radius) {
    var size = width * height;
    var alpha = new Uint8ClampedArray(size);
    var temp = new Uint8ClampedArray(size);
    var out = new Uint8ClampedArray(size);
    var data = imageData.data;
    var index;
    for (index = 0; index < size; index += 1) {
      alpha[index] = data[index * 4 + 3];
    }
    var windowSize = radius * 2 + 1;
    var x;
    var y;
    for (y = 0; y < height; y += 1) {
      var row = y * width;
      var sum = 0;
      for (x = -radius; x <= radius; x += 1) {
        sum += alpha[row + clamp(x, 0, width - 1)];
      }
      for (x = 0; x < width; x += 1) {
        temp[row + x] = Math.round(sum / windowSize);
        sum -= alpha[row + clamp(x - radius, 0, width - 1)];
        sum += alpha[row + clamp(x + radius + 1, 0, width - 1)];
      }
    }
    for (x = 0; x < width; x += 1) {
      var columnSum = 0;
      for (y = -radius; y <= radius; y += 1) {
        columnSum += temp[clamp(y, 0, height - 1) * width + x];
      }
      for (y = 0; y < height; y += 1) {
        out[y * width + x] = Math.round(columnSum / windowSize);
        columnSum -= temp[clamp(y - radius, 0, height - 1) * width + x];
        columnSum += temp[clamp(y + radius + 1, 0, height - 1) * width + x];
      }
    }
    for (index = 0; index < size; index += 1) {
      data[index * 4 + 3] = out[index];
    }
    return imageData;
  }

  function cleanSuffix(value) {
    return String(value || 'cutout').replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'cutout';
  }

  function numberValue(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rgbToHex(rgb) {
    return '#' + [rgb.r, rgb.g, rgb.b].map(function (part) {
      var hex = clamp(Math.round(part), 0, 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  function hexToRgb(hex) {
    var clean = String(hex || '').replace('#', '');
    if (clean.length === 3) {
      clean = clean.split('').map(function (part) {
        return part + part;
      }).join('');
    }
    var value = parseInt(clean, 16);
    if (!Number.isFinite(value)) return { r: 255, g: 255, b: 255 };
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }

  function formatBytes(bytes) {
    var value = Number(bytes) || 0;
    if (value < 1024) return Math.round(value) + ' B';
    if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
    return (value / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function readableDate(date) {
    if (!date || Number.isNaN(date.getTime())) return 'recently';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
