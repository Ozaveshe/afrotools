(function () {
  'use strict';

  var TARGETS = {
    free: { label: 'Free', ratio: null, width: null, height: null },
    square: { label: 'Square', ratio: 1, width: 1080, height: 1080 },
    portrait: { label: 'Portrait', ratio: 4 / 5, width: 1080, height: 1350 },
    story: { label: 'Story', ratio: 9 / 16, width: 1080, height: 1920 },
    landscape: { label: 'Landscape', ratio: 16 / 9, width: 1600, height: 900 },
    photo: { label: 'Photo', ratio: 3 / 2, width: 1500, height: 1000 },
    passport: { label: 'Passport', ratio: 35 / 45, width: 700, height: 900 },
    banner: { label: 'Banner', ratio: 4, width: 1600, height: 400 }
  };

  var SETTINGS_KEY = 'afro_image_crop_settings_v2';
  var HISTORY_KEY = 'afro_image_crop_history_v1';
  var MIN_CROP = 24;
  var els = {};
  var source = null;
  var sourceFile = null;
  var sourceName = 'image';
  var transformedCanvas = null;
  var crop = null;
  var rotation = 0;
  var flipH = false;
  var flipV = false;
  var activeTarget = 'free';
  var drag = null;
  var lastOutput = null;
  var history = [];

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    els = {
      status: $('cropStudioStatus'),
      drop: $('cropDropZone'),
      input: $('cropInput'),
      targetButtons: Array.prototype.slice.call(document.querySelectorAll('[data-crop-target]')),
      stage: $('cropStage'),
      stageCanvas: $('cropStageCanvas'),
      stageEmpty: $('cropStageEmpty'),
      exportWidth: $('cropExportWidth'),
      exportHeight: $('cropExportHeight'),
      format: $('cropFormat'),
      quality: $('cropQuality'),
      qualityValue: $('cropQualityValue'),
      background: $('cropBackground'),
      suffix: $('cropSuffix'),
      rotateLeft: $('cropRotateLeft'),
      rotateRight: $('cropRotateRight'),
      flipH: $('cropFlipH'),
      flipV: $('cropFlipV'),
      reset: $('cropReset'),
      nudgeButtons: Array.prototype.slice.call(document.querySelectorAll('[data-crop-nudge]')),
      selectionX: $('cropSelectionX'),
      selectionY: $('cropSelectionY'),
      selectionW: $('cropSelectionW'),
      selectionH: $('cropSelectionH'),
      applySelection: $('cropApplySelection'),
      exportBtn: $('cropExportBtn'),
      downloadBtn: $('cropDownloadBtn'),
      copyRecipeBtn: $('cropCopyRecipeBtn'),
      previewEmpty: $('cropPreviewEmpty'),
      previewCanvas: $('cropPreviewCanvas'),
      detailSelection: $('cropDetailSelection'),
      detailOutput: $('cropDetailOutput'),
      detailTransform: $('cropDetailTransform'),
      historyList: $('cropHistoryList')
    };

    if (!els.stageCanvas || !els.input) return;

    loadSettings();
    loadHistory();
    bindEvents();
    applyTarget(activeTarget, false);
    updateQualityLabel();
    updateButtons();
    updateDetails();
    syncSelectionInputs(true);
    renderHistory();
    setStatus('Choose an image to begin.');
  }

  function bindEvents() {
    els.drop.addEventListener('click', function () {
      els.input.click();
    });
    els.drop.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        els.input.click();
      }
    });
    els.drop.addEventListener('dragover', function (event) {
      event.preventDefault();
      els.drop.classList.add('dragover');
    });
    els.drop.addEventListener('dragleave', function () {
      els.drop.classList.remove('dragover');
    });
    els.drop.addEventListener('drop', function (event) {
      event.preventDefault();
      els.drop.classList.remove('dragover');
      handleFiles(event.dataTransfer.files);
    });
    els.input.addEventListener('change', function () {
      handleFiles(els.input.files);
    });
    document.addEventListener('paste', function (event) {
      if (event.clipboardData && event.clipboardData.files.length) {
        handleFiles(event.clipboardData.files);
      }
    });

    els.targetButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyTarget(button.dataset.cropTarget, true);
      });
    });
    els.rotateLeft.addEventListener('click', function () { rotate(-90); });
    els.rotateRight.addEventListener('click', function () { rotate(90); });
    els.flipH.addEventListener('click', function () {
      flipH = !flipH;
      syncTransformState();
    });
    els.flipV.addEventListener('click', function () {
      flipV = !flipV;
      syncTransformState();
    });
    els.reset.addEventListener('click', function () {
      rotation = 0;
      flipH = false;
      flipV = false;
      resetCropForTarget(activeTarget);
      syncTransformState();
      setStatus('Transform reset.');
    });
    els.nudgeButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        nudgeCrop(button.dataset.cropNudge);
      });
    });

    [els.exportWidth, els.exportHeight, els.format, els.background, els.suffix].forEach(function (field) {
      field.addEventListener('input', function () {
        saveSettings();
        renderPreview();
        updateDetails();
      });
      field.addEventListener('change', function () {
        saveSettings();
        renderPreview();
        updateDetails();
      });
    });
    els.quality.addEventListener('input', function () {
      updateQualityLabel();
      saveSettings();
      renderPreview();
    });

    [els.selectionX, els.selectionY, els.selectionW, els.selectionH].forEach(function (input) {
      if (!input) return;
      input.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') applyManualSelection();
      });
      input.addEventListener('change', applyManualSelection);
    });
    if (els.applySelection) els.applySelection.addEventListener('click', applyManualSelection);

    els.exportBtn.addEventListener('click', exportCrop);
    els.downloadBtn.addEventListener('click', downloadOutput);
    els.copyRecipeBtn.addEventListener('click', copyRecipe);
    els.stageCanvas.addEventListener('pointerdown', onPointerDown);
    els.stageCanvas.addEventListener('pointermove', onPointerMove);
    els.stageCanvas.addEventListener('pointerup', endPointer);
    els.stageCanvas.addEventListener('pointercancel', endPointer);
    els.stageCanvas.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('resize', renderStage);

    document.addEventListener('keydown', function (event) {
      if (!source || isTyping(event.target)) return;
      var direction = null;
      if (event.key === 'ArrowUp') direction = 'up';
      if (event.key === 'ArrowDown') direction = 'down';
      if (event.key === 'ArrowLeft') direction = 'left';
      if (event.key === 'ArrowRight') direction = 'right';
      if (!direction) return;
      event.preventDefault();
      nudgeCrop(direction, event.shiftKey ? 20 : 5);
    });
  }

  function isTyping(target) {
    if (!target) return false;
    var tag = target.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
  }

  function loadSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      activeTarget = saved.target && TARGETS[saved.target] ? saved.target : 'free';
      els.format.value = saved.format || 'same';
      els.quality.value = saved.quality || '88';
      els.background.value = saved.background || '#ffffff';
      els.suffix.value = saved.suffix || 'cropped';
      els.exportWidth.value = saved.exportWidth || '';
      els.exportHeight.value = saved.exportHeight || '';
    } catch (error) {
      activeTarget = 'free';
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        target: activeTarget,
        format: els.format.value,
        quality: els.quality.value,
        background: els.background.value,
        suffix: els.suffix.value,
        exportWidth: els.exportWidth.value,
        exportHeight: els.exportHeight.value
      }));
    } catch (error) {
      /* Storage can be unavailable in private contexts. */
    }
  }

  function loadHistory() {
    try {
      history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (!Array.isArray(history)) history = [];
    } catch (error) {
      history = [];
    }
  }

  function saveHistory(item) {
    history.unshift(item);
    history = history.slice(0, 5);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      /* Ignore storage quota issues. */
    }
    renderHistory();
  }

  function renderHistory() {
    if (!els.historyList) return;
    if (!history.length) {
      els.historyList.innerHTML = '<div class="crop-history-item">Recent exports will appear here after your first crop.</div>';
      return;
    }
    els.historyList.innerHTML = history.map(function (item) {
      return '<div class="crop-history-item"><strong>' + escapeHtml(item.name) + '</strong><br>' +
        escapeHtml(item.dimensions) + ' - ' + escapeHtml(item.format) + ' - ' + escapeHtml(item.size) + '</div>';
    }).join('');
  }

  function handleFiles(fileList) {
    var file = Array.prototype.find.call(fileList || [], function (item) {
      return item && item.type && item.type.indexOf('image/') === 0;
    });
    if (!file) {
      setStatus('Choose a valid image file.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setStatus('Try an image under 25 MB for this browser editor.');
      return;
    }
    sourceFile = file;
    sourceName = cleanName(file.name.replace(/\.[^.]+$/, '') || 'image');
    setStatus('Loading image...');
    loadImage(file)
      .then(function (image) {
        source = image;
        rotation = 0;
        flipH = false;
        flipV = false;
        crop = null;
        lastOutput = null;
        resetCropForTarget(activeTarget);
        syncTransformState();
        updateButtons();
        setStatus(formatPixels(source.width, source.height) + ' loaded.');
      })
      .catch(function () {
        setStatus('This image could not be loaded.');
      });
  }

  function loadImage(file) {
    if (window.createImageBitmap) {
      return createImageBitmap(file, { imageOrientation: 'from-image' }).catch(function () {
        return loadImageElement(file);
      });
    }
    return loadImageElement(file);
  }

  function loadImageElement(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var image = new Image();
      image.onload = function () {
        URL.revokeObjectURL(url);
        resolve(image);
      };
      image.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error('Image load failed'));
      };
      image.src = url;
    });
  }

  function applyTarget(key, resetCrop) {
    if (!TARGETS[key]) key = 'free';
    activeTarget = key;
    els.targetButtons.forEach(function (button) {
      var active = button.dataset.cropTarget === key;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    var target = TARGETS[key];
    if (resetCrop && target.width && target.height) {
      els.exportWidth.value = target.width;
      els.exportHeight.value = target.height;
    }
    if (resetCrop && !target.width) {
      els.exportWidth.value = '';
      els.exportHeight.value = '';
    }
    if (source && resetCrop) {
      resetCropForTarget(key);
      renderAll(true);
    }
    saveSettings();
    updateDetails();
  }

  function rotate(delta) {
    rotation = (rotation + delta + 360) % 360;
    if (source) resetCropForTarget(activeTarget);
    syncTransformState();
  }

  function syncTransformState() {
    els.flipH.classList.toggle('active', flipH);
    els.flipV.classList.toggle('active', flipV);
    buildTransformedCanvas();
    renderAll(true);
  }

  function resetCropForTarget(key) {
    if (!source) return;
    buildTransformedCanvas();
    var width = transformedCanvas.width;
    var height = transformedCanvas.height;
    var ratio = TARGETS[key].ratio;
    var cropWidth = width * 0.82;
    var cropHeight = height * 0.82;
    if (ratio) {
      if (cropWidth / cropHeight > ratio) cropWidth = cropHeight * ratio;
      else cropHeight = cropWidth / ratio;
    }
    crop = {
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
      w: cropWidth,
      h: cropHeight
    };
    clampCrop();
  }

  function buildTransformedCanvas() {
    if (!source) {
      transformedCanvas = null;
      return null;
    }
    var rotated = rotation === 90 || rotation === 270;
    var width = rotated ? source.height : source.width;
    var height = rotated ? source.width : source.height;
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    var ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(source, -source.width / 2, -source.height / 2);
    ctx.restore();
    transformedCanvas = canvas;
    return canvas;
  }

  function renderAll(forceSelectionSync) {
    renderStage();
    renderPreview();
    updateDetails();
    syncSelectionInputs(!!forceSelectionSync);
    updateButtons();
  }

  function renderStage() {
    var canvas = els.stageCanvas;
    var ctx = canvas.getContext('2d');
    if (!source || !transformedCanvas || !crop) {
      canvas.hidden = true;
      els.stage.classList.remove('has-image');
      if (els.stageEmpty) els.stageEmpty.hidden = false;
      return;
    }
    canvas.hidden = false;
    els.stage.classList.add('has-image');
    if (els.stageEmpty) els.stageEmpty.hidden = true;
    canvas.width = transformedCanvas.width;
    canvas.height = transformedCanvas.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(transformedCanvas, 0, 0);
    ctx.save();
    ctx.fillStyle = 'rgba(2, 6, 23, 0.58)';
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.rect(crop.x, crop.y, crop.w, crop.h);
    ctx.fill('evenodd');
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = Math.max(2, Math.round(canvas.width / 520));
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.lineWidth = Math.max(1, Math.round(canvas.width / 900));
    for (var i = 1; i < 3; i += 1) {
      var vx = crop.x + crop.w * i / 3;
      var hy = crop.y + crop.h * i / 3;
      ctx.beginPath();
      ctx.moveTo(vx, crop.y);
      ctx.lineTo(vx, crop.y + crop.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(crop.x, hy);
      ctx.lineTo(crop.x + crop.w, hy);
      ctx.stroke();
    }
    drawHandles(ctx);
    ctx.restore();
  }

  function drawHandles(ctx) {
    var rect = els.stageCanvas.getBoundingClientRect();
    var scale = rect.width ? els.stageCanvas.width / rect.width : 1;
    var size = Math.max(14 * scale, Math.min(36, els.stageCanvas.width * 0.04));
    var half = size / 2;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = Math.max(1, scale);
    getHandlePoints().forEach(function (point) {
      ctx.beginPath();
      ctx.rect(point.x - half, point.y - half, size, size);
      ctx.fill();
      ctx.stroke();
    });
  }

  function renderPreview() {
    if (!source || !transformedCanvas || !crop) {
      els.previewCanvas.hidden = true;
      if (els.previewEmpty) els.previewEmpty.hidden = false;
      return;
    }
    var dims = getExportDimensions();
    els.previewCanvas.hidden = false;
    if (els.previewEmpty) els.previewEmpty.hidden = true;
    drawCroppedToCanvas(els.previewCanvas, dims.width, dims.height);
  }

  function drawCroppedToCanvas(canvas, width, height) {
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    if (getOutputMime() === 'image/jpeg') {
      ctx.fillStyle = els.background.value || '#ffffff';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(transformedCanvas, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);
  }

  function getExportDimensions() {
    var widthValue = Math.round(Number(els.exportWidth.value) || 0);
    var heightValue = Math.round(Number(els.exportHeight.value) || 0);
    var ratio = crop && crop.h ? crop.w / crop.h : 1;
    var width = widthValue;
    var height = heightValue;
    if (width && !height) height = Math.round(width / ratio);
    else if (!width && height) width = Math.round(height * ratio);
    else if (!width && !height) {
      width = Math.round(crop ? crop.w : 1);
      height = Math.round(crop ? crop.h : 1);
    }
    return { width: clampNumber(width, 1, 12000), height: clampNumber(height, 1, 12000) };
  }

  function getOutputMime() {
    var selected = els.format.value;
    if (selected === 'jpeg') return 'image/jpeg';
    if (selected === 'png') return 'image/png';
    if (selected === 'webp') return 'image/webp';
    if (sourceFile && sourceFile.type === 'image/png') return 'image/png';
    if (sourceFile && sourceFile.type === 'image/webp') return 'image/webp';
    return 'image/jpeg';
  }

  function getOutputExtension(mime) {
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    return 'jpg';
  }

  function applyManualSelection() {
    if (!source || !transformedCanvas || !crop) {
      setStatus('Load an image before applying a selection.');
      return;
    }
    var next = {
      x: Number(els.selectionX.value),
      y: Number(els.selectionY.value),
      w: Number(els.selectionW.value),
      h: Number(els.selectionH.value)
    };
    if ([next.x, next.y, next.w, next.h].some(function (value) { return !Number.isFinite(value); })) {
      setStatus('Enter valid crop coordinates.');
      return;
    }
    var ratio = TARGETS[activeTarget].ratio;
    if (ratio) next.h = next.w / ratio;
    crop = next;
    clampCrop();
    renderAll(true);
    setStatus('Exact crop selection applied.');
  }

  function syncSelectionInputs(force) {
    var inputs = [els.selectionX, els.selectionY, els.selectionW, els.selectionH].filter(Boolean);
    if (!inputs.length) return;
    if (!force && inputs.indexOf(document.activeElement) !== -1) return;
    if (!source || !transformedCanvas || !crop) {
      inputs.forEach(function (input) { input.value = ''; });
      return;
    }
    els.selectionX.value = Math.round(crop.x);
    els.selectionY.value = Math.round(crop.y);
    els.selectionW.value = Math.round(crop.w);
    els.selectionH.value = Math.round(crop.h);
    els.selectionX.max = Math.max(0, Math.round(transformedCanvas.width - MIN_CROP));
    els.selectionY.max = Math.max(0, Math.round(transformedCanvas.height - MIN_CROP));
    els.selectionW.max = Math.round(transformedCanvas.width);
    els.selectionH.max = Math.round(transformedCanvas.height);
  }

  function exportCrop() {
    if (!source || !crop) {
      setStatus('Load an image before exporting.');
      return;
    }
    var dims = getExportDimensions();
    var canvas = document.createElement('canvas');
    drawCroppedToCanvas(canvas, dims.width, dims.height);
    var mime = getOutputMime();
    var quality = Number(els.quality.value || 88) / 100;
    canvas.toBlob(function (blob) {
      if (!blob) {
        setStatus('Export failed in this browser.');
        return;
      }
      if (lastOutput && lastOutput.url) URL.revokeObjectURL(lastOutput.url);
      var extension = getOutputExtension(mime);
      var suffix = cleanName(els.suffix.value || 'cropped');
      var fileName = sourceName + '-' + suffix + '.' + extension;
      lastOutput = {
        blob: blob,
        url: URL.createObjectURL(blob),
        name: fileName,
        width: dims.width,
        height: dims.height,
        mime: mime,
        size: blob.size
      };
      els.downloadBtn.disabled = false;
      els.copyRecipeBtn.disabled = false;
      saveHistory({
        name: fileName,
        dimensions: formatPixels(dims.width, dims.height),
        format: extension.toUpperCase(),
        size: formatBytes(blob.size)
      });
      setStatus('Crop exported.');
      updateDetails();
    }, mime, mime === 'image/png' ? undefined : quality);
  }

  function downloadOutput() {
    if (!lastOutput) return;
    var link = document.createElement('a');
    link.href = lastOutput.url;
    link.download = lastOutput.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function copyRecipe() {
    if (!source || !crop) return;
    var dims = getExportDimensions();
    var recipe = [
      'AfroTools Image Crop Studio',
      'Preset: ' + TARGETS[activeTarget].label,
      'Selection: ' + formatPixels(Math.round(crop.w), Math.round(crop.h)) + ' at ' + Math.round(crop.x) + ',' + Math.round(crop.y),
      'Export: ' + formatPixels(dims.width, dims.height) + ' as ' + getOutputExtension(getOutputMime()).toUpperCase(),
      'Transform: rotate ' + rotation + 'deg, flip H ' + (flipH ? 'on' : 'off') + ', flip V ' + (flipV ? 'on' : 'off')
    ].join('\n');
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setStatus('Copy is unavailable in this browser.');
      return;
    }
    navigator.clipboard.writeText(recipe)
      .then(function () { setStatus('Crop recipe copied.'); })
      .catch(function () { setStatus('Copy is unavailable in this browser.'); });
  }

  function onPointerDown(event) {
    if (!source || !crop) return;
    var point = getCanvasPoint(event);
    var handle = getHandleAt(point.x, point.y);
    var mode = handle || (insideCrop(point.x, point.y) ? 'move' : 'new');
    drag = {
      mode: mode,
      startX: point.x,
      startY: point.y,
      startCrop: { x: crop.x, y: crop.y, w: crop.w, h: crop.h }
    };
    els.stageCanvas.setPointerCapture(event.pointerId);
    if (mode === 'new') {
      crop = { x: point.x, y: point.y, w: MIN_CROP, h: MIN_CROP };
      drag.startCrop = { x: point.x, y: point.y, w: MIN_CROP, h: MIN_CROP };
    }
  }

  function onPointerMove(event) {
    if (!source || !crop) return;
    var point = getCanvasPoint(event);
    if (!drag) {
      var handle = getHandleAt(point.x, point.y);
      els.stageCanvas.style.cursor = getCursor(handle || (insideCrop(point.x, point.y) ? 'move' : 'crosshair'));
      return;
    }
    if (drag.mode === 'move') moveCrop(point);
    else if (drag.mode === 'new') newCrop(point);
    else resizeCrop(point);
    clampCrop();
    renderAll(true);
  }

  function onPointerLeave() {
    if (!drag) els.stageCanvas.style.cursor = 'crosshair';
  }

  function endPointer(event) {
    if (!drag) return;
    try {
      els.stageCanvas.releasePointerCapture(event.pointerId);
    } catch (error) {
      /* Pointer may already be released. */
    }
    drag = null;
    renderAll(true);
  }

  function moveCrop(point) {
    crop.x = drag.startCrop.x + (point.x - drag.startX);
    crop.y = drag.startCrop.y + (point.y - drag.startY);
  }

  function newCrop(point) {
    var ratio = TARGETS[activeTarget].ratio;
    var x1 = drag.startX;
    var y1 = drag.startY;
    var x2 = point.x;
    var y2 = point.y;
    if (ratio) {
      var signX = x2 >= x1 ? 1 : -1;
      var signY = y2 >= y1 ? 1 : -1;
      var width = Math.abs(x2 - x1);
      var height = width / ratio;
      if (height > Math.abs(y2 - y1)) {
        height = Math.abs(y2 - y1);
        width = height * ratio;
      }
      x2 = x1 + width * signX;
      y2 = y1 + height * signY;
    }
    crop.x = Math.min(x1, x2);
    crop.y = Math.min(y1, y2);
    crop.w = Math.max(MIN_CROP, Math.abs(x2 - x1));
    crop.h = Math.max(MIN_CROP, Math.abs(y2 - y1));
  }

  function resizeCrop(point) {
    var original = drag.startCrop;
    var anchor = getAnchorForHandle(drag.mode, original);
    var ratio = TARGETS[activeTarget].ratio;
    var x = point.x;
    var y = point.y;
    if (ratio) {
      var signX = x >= anchor.x ? 1 : -1;
      var signY = y >= anchor.y ? 1 : -1;
      var width = Math.max(MIN_CROP, Math.abs(x - anchor.x));
      var height = width / ratio;
      if (height > Math.abs(y - anchor.y)) {
        height = Math.max(MIN_CROP, Math.abs(y - anchor.y));
        width = height * ratio;
      }
      x = anchor.x + width * signX;
      y = anchor.y + height * signY;
    }
    crop.x = Math.min(anchor.x, x);
    crop.y = Math.min(anchor.y, y);
    crop.w = Math.max(MIN_CROP, Math.abs(x - anchor.x));
    crop.h = Math.max(MIN_CROP, Math.abs(y - anchor.y));
  }

  function getAnchorForHandle(handle, item) {
    var map = {
      nw: { x: item.x + item.w, y: item.y + item.h },
      ne: { x: item.x, y: item.y + item.h },
      sw: { x: item.x + item.w, y: item.y },
      se: { x: item.x, y: item.y }
    };
    return map[handle] || { x: item.x, y: item.y };
  }

  function nudgeCrop(direction, amount) {
    if (!source || !crop) return;
    var step = amount || 10;
    if (direction === 'up') crop.y -= step;
    if (direction === 'down') crop.y += step;
    if (direction === 'left') crop.x -= step;
    if (direction === 'right') crop.x += step;
    clampCrop();
    renderAll(true);
  }

  function clampCrop() {
    if (!crop || !transformedCanvas) return;
    crop.w = clampNumber(crop.w, MIN_CROP, transformedCanvas.width);
    crop.h = clampNumber(crop.h, MIN_CROP, transformedCanvas.height);
    crop.x = clampNumber(crop.x, 0, transformedCanvas.width - crop.w);
    crop.y = clampNumber(crop.y, 0, transformedCanvas.height - crop.h);
  }

  function getCanvasPoint(event) {
    var rect = els.stageCanvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * els.stageCanvas.width / rect.width,
      y: (event.clientY - rect.top) * els.stageCanvas.height / rect.height
    };
  }

  function getHandlePoints() {
    return [
      { id: 'nw', x: crop.x, y: crop.y },
      { id: 'ne', x: crop.x + crop.w, y: crop.y },
      { id: 'sw', x: crop.x, y: crop.y + crop.h },
      { id: 'se', x: crop.x + crop.w, y: crop.y + crop.h }
    ];
  }

  function getHandleAt(x, y) {
    var rect = els.stageCanvas.getBoundingClientRect();
    var scale = rect.width ? els.stageCanvas.width / rect.width : 1;
    var threshold = 16 * scale;
    var points = getHandlePoints();
    for (var i = 0; i < points.length; i += 1) {
      if (Math.abs(points[i].x - x) <= threshold && Math.abs(points[i].y - y) <= threshold) return points[i].id;
    }
    return null;
  }

  function insideCrop(x, y) {
    return x >= crop.x && x <= crop.x + crop.w && y >= crop.y && y <= crop.y + crop.h;
  }

  function getCursor(mode) {
    var cursors = {
      nw: 'nwse-resize',
      se: 'nwse-resize',
      ne: 'nesw-resize',
      sw: 'nesw-resize',
      move: 'move',
      new: 'crosshair'
    };
    return cursors[mode] || 'crosshair';
  }

  function updateQualityLabel() {
    if (els.qualityValue) els.qualityValue.textContent = (els.quality.value || 88) + '%';
  }

  function updateButtons() {
    var hasSource = !!source;
    [els.rotateLeft, els.rotateRight, els.flipH, els.flipV, els.reset, els.exportBtn, els.applySelection].forEach(function (button) {
      if (button) button.disabled = !hasSource;
    });
    els.nudgeButtons.forEach(function (button) { button.disabled = !hasSource; });
    els.downloadBtn.disabled = !lastOutput;
    els.copyRecipeBtn.disabled = !source;
  }

  function updateDetails() {
    if (!source || !crop) {
      els.detailSelection.textContent = 'No image';
      els.detailOutput.textContent = '-';
      els.detailTransform.textContent = '-';
      return;
    }
    var dims = getExportDimensions();
    els.detailSelection.textContent = formatPixels(Math.round(crop.w), Math.round(crop.h)) + ' @ ' + Math.round(crop.x) + ',' + Math.round(crop.y);
    els.detailOutput.textContent = formatPixels(dims.width, dims.height) + ' ' + getOutputExtension(getOutputMime()).toUpperCase();
    els.detailTransform.textContent = rotation + 'deg' + (flipH ? ' H' : '') + (flipV ? ' V' : '');
  }

  function setStatus(message) {
    if (els.status) els.status.textContent = message;
  }

  function cleanName(value) {
    return String(value || 'image')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'image';
  }

  function formatPixels(width, height) {
    return Math.round(width).toLocaleString() + ' x ' + Math.round(height).toLocaleString() + ' px';
  }

  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  window.addEventListener('beforeunload', function () {
    if (lastOutput && lastOutput.url) URL.revokeObjectURL(lastOutput.url);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
