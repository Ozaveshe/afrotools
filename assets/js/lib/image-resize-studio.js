(function () {
  'use strict';

  const STORAGE_KEY = 'afro_image_resize_settings_v2';
  const HISTORY_KEY = 'afro_image_resize_history_v1';
  const MAX_FILE_SIZE = 50 * 1024 * 1024;
  const $ = (id) => document.getElementById(id);

  const dropZone = $('resizeDropZone');
  const fileInput = $('resizeInput');
  const studioStatus = $('resizeStudioStatus');
  const customWidth = $('resizeCustomWidth');
  const customHeight = $('resizeCustomHeight');
  const modeSelect = $('resizeMode');
  const formatSelect = $('resizeFormat');
  const qualitySlider = $('resizeQuality');
  const qualityValue = $('resizeQualityValue');
  const backgroundColor = $('resizeBackground');
  const focalX = $('resizeFocalX');
  const focalY = $('resizeFocalY');
  const focalXValue = $('resizeFocalXValue');
  const focalYValue = $('resizeFocalYValue');
  const suffixInput = $('resizeSuffix');
  const noUpscale = $('resizeNoUpscale');
  const autoRun = $('resizeAutoRun');
  const processBtn = $('resizeProcessBtn');
  const downloadAllBtn = $('resizeDownloadAllBtn');
  const clearBtn = $('resizeClearBtn');
  const fileList = $('resizeFileList');
  const outputList = $('resizeOutputList');
  const historyList = $('resizeHistoryList');
  const previewEmpty = $('resizePreviewEmpty');
  const beforeImage = $('resizeBeforeImage');
  const afterImage = $('resizeAfterImage');
  const previewLabels = $('resizePreviewLabels');
  const compareLine = $('resizeCompareLine');
  const compareSlider = $('resizeCompareSlider');
  const detailDimensions = $('resizeDetailDimensions');
  const detailFormat = $('resizeDetailFormat');
  const detailMode = $('resizeDetailMode');
  const targetButtons = Array.from(document.querySelectorAll('[data-resize-target]'));

  let files = [];
  let outputs = [];
  let selectedOutputId = '';
  let busy = false;
  let debounceTimer = 0;

  const TARGETS = {
    custom: { label: 'Custom', w: 1200, h: 800, suffix: 'custom' },
    square: { label: 'Square Post', w: 1080, h: 1080, suffix: 'square' },
    story: { label: 'Story', w: 1080, h: 1920, suffix: 'story' },
    landscape: { label: 'Social Landscape', w: 1600, h: 900, suffix: 'landscape' },
    listing: { label: 'Marketplace', w: 1600, h: 1600, suffix: 'listing' },
    hero: { label: 'Website Hero', w: 1920, h: 1080, suffix: 'hero' },
    thumb: { label: 'Thumbnail', w: 512, h: 512, suffix: 'thumb' },
    banner: { label: 'LinkedIn Banner', w: 1584, h: 396, suffix: 'banner' }
  };

  function setStatus(message) {
    if (studioStatus) studioStatus.textContent = message;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 KB';
    const units = ['B', 'KB', 'MB'];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return value.toFixed(value >= 10 || unit === 0 ? 0 : 1) + ' ' + units[unit];
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function baseName(name) {
    return String(name || 'image')
      .replace(/\.[^.]+$/, '')
      .replace(/[^\w.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'image';
  }

  function sourceExt(file) {
    if (!file || !file.type) return 'jpg';
    if (file.type === 'image/png') return 'png';
    if (file.type === 'image/webp') return 'webp';
    return 'jpg';
  }

  function mimeFor(format, file) {
    if (format === 'same') {
      if (file && file.type === 'image/png') return 'image/png';
      if (file && file.type === 'image/webp') return 'image/webp';
      return 'image/jpeg';
    }
    if (format === 'png') return 'image/png';
    if (format === 'webp') return 'image/webp';
    return 'image/jpeg';
  }

  function extForMime(mime, file) {
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    if (mime === 'same') return sourceExt(file);
    return 'jpg';
  }

  function getActiveTargetKeys() {
    return targetButtons
      .filter((button) => button.classList.contains('active'))
      .map((button) => button.dataset.resizeTarget)
      .filter(Boolean);
  }

  function getTargets() {
    const keys = getActiveTargetKeys();
    return keys.map((key) => {
      const preset = TARGETS[key] || TARGETS.custom;
      const width = key === 'custom' ? Math.max(1, Number(customWidth.value) || preset.w) : preset.w;
      const height = key === 'custom' ? Math.max(1, Number(customHeight.value) || preset.h) : preset.h;
      return {
        key,
        label: preset.label,
        width,
        height,
        suffix: preset.suffix
      };
    });
  }

  function getSettings() {
    return {
      targets: getTargets(),
      mode: modeSelect.value || 'fit',
      format: formatSelect.value || 'same',
      quality: Math.max(10, Math.min(100, Number(qualitySlider.value) || 86)) / 100,
      bg: backgroundColor.value || '#ffffff',
      focalX: Math.max(0, Math.min(100, Number(focalX.value) || 50)) / 100,
      focalY: Math.max(0, Math.min(100, Number(focalY.value) || 50)) / 100,
      suffix: suffixInput.value || '-resized',
      noUpscale: !!noUpscale.checked,
      autoRun: !!autoRun.checked
    };
  }

  function saveSettings() {
    try {
      const settings = getSettings();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        activeTargets: getActiveTargetKeys(),
        width: customWidth.value || '',
        height: customHeight.value || '',
        mode: settings.mode,
        format: settings.format,
        quality: Math.round(settings.quality * 100),
        bg: settings.bg,
        focalX: Math.round(settings.focalX * 100),
        focalY: Math.round(settings.focalY * 100),
        suffix: settings.suffix,
        noUpscale: settings.noUpscale,
        autoRun: settings.autoRun
      }));
    } catch (error) {}
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
      if (Array.isArray(saved.activeTargets) && saved.activeTargets.length) {
        targetButtons.forEach((button) => {
          button.classList.toggle('active', saved.activeTargets.includes(button.dataset.resizeTarget));
          button.setAttribute('aria-pressed', saved.activeTargets.includes(button.dataset.resizeTarget) ? 'true' : 'false');
        });
      }
      if (saved.width) customWidth.value = saved.width;
      if (saved.height) customHeight.value = saved.height;
      if (saved.mode) modeSelect.value = saved.mode;
      if (saved.format) formatSelect.value = saved.format;
      if (saved.quality) qualitySlider.value = saved.quality;
      if (saved.bg) backgroundColor.value = saved.bg;
      if (saved.focalX !== undefined) focalX.value = saved.focalX;
      if (saved.focalY !== undefined) focalY.value = saved.focalY;
      if (saved.suffix) suffixInput.value = saved.suffix;
      if (saved.noUpscale !== undefined) noUpscale.checked = !!saved.noUpscale;
      if (saved.autoRun !== undefined) autoRun.checked = !!saved.autoRun;
    } catch (error) {}
    updateControlReadouts();
  }

  function updateControlReadouts() {
    qualityValue.textContent = qualitySlider.value;
    focalXValue.textContent = focalX.value + '%';
    focalYValue.textContent = focalY.value + '%';
  }

  function scheduleAutoProcess() {
    saveSettings();
    window.clearTimeout(debounceTimer);
    if (!autoRun.checked || !files.length || !getTargets().length) {
      renderAll();
      return;
    }
    debounceTimer = window.setTimeout(() => processQueue(), 450);
  }

  function addFiles(fileListInput) {
    const accepted = Array.from(fileListInput || []).filter((file) => {
      if (!file.type || !file.type.startsWith('image/')) return false;
      if (file.size > MAX_FILE_SIZE) {
        setStatus(file.name + ' is over 50MB.');
        return false;
      }
      return true;
    });

    accepted.forEach((file) => {
      const id = 'file-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
      files.push({
        id,
        file,
        url: URL.createObjectURL(file),
        name: file.name,
        originalBytes: file.size,
        width: 0,
        height: 0,
        status: 'queued',
        statusText: 'Queued',
        error: ''
      });
    });

    if (!accepted.length) {
      setStatus('No supported image files found.');
      return;
    }

    setStatus(accepted.length + ' image' + (accepted.length === 1 ? '' : 's') + ' added.');
    renderAll();
    processQueue();
  }

  async function decodeImage(file) {
    if (window.createImageBitmap) {
      try {
        return await createImageBitmap(file, { imageOrientation: 'from-image' });
      } catch (error) {}
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('The browser could not decode this image.'));
      };
      img.src = url;
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function buildCanvas(image, target, settings, mime) {
    const sourceW = image.width;
    const sourceH = image.height;
    const targetW = Math.max(1, Math.round(target.width));
    const targetH = Math.max(1, Math.round(target.height));
    const mode = settings.mode;
    const alpha = mime !== 'image/jpeg';
    let canvasW = targetW;
    let canvasH = targetH;
    let dx = 0;
    let dy = 0;
    let dw = targetW;
    let dh = targetH;
    let sx = 0;
    let sy = 0;
    let sw = sourceW;
    let sh = sourceH;

    if (mode === 'fit') {
      let scale = Math.min(targetW / sourceW, targetH / sourceH);
      if (settings.noUpscale) scale = Math.min(1, scale);
      if (!isFinite(scale) || scale <= 0) scale = 1;
      canvasW = Math.max(1, Math.round(sourceW * scale));
      canvasH = Math.max(1, Math.round(sourceH * scale));
      dw = canvasW;
      dh = canvasH;
    } else if (mode === 'pad') {
      let scale = Math.min(targetW / sourceW, targetH / sourceH);
      if (settings.noUpscale) scale = Math.min(1, scale);
      if (!isFinite(scale) || scale <= 0) scale = 1;
      dw = Math.max(1, Math.round(sourceW * scale));
      dh = Math.max(1, Math.round(sourceH * scale));
      dx = Math.round((targetW - dw) / 2);
      dy = Math.round((targetH - dh) / 2);
    } else if (mode === 'fill') {
      let scale = Math.max(targetW / sourceW, targetH / sourceH);
      if (settings.noUpscale) scale = Math.min(1, scale);
      if (!isFinite(scale) || scale <= 0) scale = 1;
      sw = Math.min(sourceW, targetW / scale);
      sh = Math.min(sourceH, targetH / scale);
      sx = clamp((sourceW - sw) * settings.focalX, 0, sourceW - sw);
      sy = clamp((sourceH - sh) * settings.focalY, 0, sourceH - sh);
      if (settings.noUpscale && scale < Math.max(targetW / sourceW, targetH / sourceH)) {
        dw = Math.round(sourceW * scale);
        dh = Math.round(sourceH * scale);
        dx = Math.round((targetW - dw) / 2);
        dy = Math.round((targetH - dh) / 2);
        sx = 0;
        sy = 0;
        sw = sourceW;
        sh = sourceH;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d', { alpha });
    if (!ctx) throw new Error('Canvas is not available in this browser.');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (mime === 'image/jpeg' || mode === 'pad') {
      ctx.fillStyle = settings.bg;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }
    ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
    return { canvas, width: canvasW, height: canvasH, sourceW, sourceH };
  }

  function encode(canvas, mime, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob || (mime !== 'image/png' && blob.type && blob.type !== mime)) {
          resolve(null);
          return;
        }
        resolve(blob);
      }, mime, mime === 'image/png' ? undefined : quality);
    });
  }

  async function processFile(item, settings) {
    item.status = 'processing';
    item.statusText = 'Processing';
    item.error = '';
    renderFiles();

    const image = await decodeImage(item.file);
    item.width = image.width;
    item.height = image.height;
    const newOutputs = [];

    for (const target of settings.targets) {
      const mime = mimeFor(settings.format, item.file);
      const built = buildCanvas(image, target, settings, mime);
      const blob = await encode(built.canvas, mime, settings.quality);
      if (!blob) throw new Error('This browser could not export ' + target.label + '.');
      const id = 'out-' + item.id + '-' + target.key;
      const existing = outputs.find((entry) => entry.id === id);
      if (existing && existing.url) URL.revokeObjectURL(existing.url);
      newOutputs.push({
        id,
        fileId: item.id,
        name: item.name,
        targetKey: target.key,
        targetLabel: target.label,
        mode: settings.mode,
        sourceUrl: item.url,
        url: URL.createObjectURL(blob),
        blob,
        outputName: baseName(item.name) + settings.suffix + '-' + target.suffix + '.' + extForMime(mime, item.file),
        originalBytes: item.originalBytes,
        outputBytes: blob.size,
        sourceWidth: built.sourceW,
        sourceHeight: built.sourceH,
        outputWidth: built.width,
        outputHeight: built.height,
        mime,
        quality: Math.round(settings.quality * 100)
      });
    }

    outputs = outputs.filter((entry) => entry.fileId !== item.id).concat(newOutputs);
    if (!selectedOutputId && newOutputs[0]) selectedOutputId = newOutputs[0].id;
    if (!outputs.find((entry) => entry.id === selectedOutputId) && outputs[0]) selectedOutputId = outputs[0].id;
    item.status = 'done';
    item.statusText = 'Done';
    if (image.close) image.close();
  }

  async function processQueue() {
    if (busy || !files.length) return;
    const settings = getSettings();
    if (!settings.targets.length) {
      setStatus('Choose at least one target size.');
      return;
    }

    busy = true;
    processBtn.disabled = true;
    setStatus('Resizing ' + files.length + ' image' + (files.length === 1 ? '' : 's') + '...');
    saveSettings();

    for (const item of files) {
      try {
        await processFile(item, settings);
      } catch (error) {
        item.status = 'error';
        item.statusText = 'Needs attention';
        item.error = error.message || 'Resize failed.';
      }
    }

    busy = false;
    processBtn.disabled = false;
    setStatus('Resize queue complete.');
    renderAll();
    saveHistory();
  }

  function renderMetrics() {
    const original = files.reduce((sum, item) => sum + item.originalBytes, 0);
    const output = outputs.reduce((sum, item) => sum + item.outputBytes, 0);
    $('resizeMetricFiles').textContent = files.length;
    $('resizeMetricOutputs').textContent = outputs.length;
    $('resizeMetricInput').textContent = formatBytes(original);
    $('resizeMetricOutput').textContent = output ? formatBytes(output) : '0 KB';
    processBtn.disabled = busy || !files.length || !getTargets().length;
    downloadAllBtn.disabled = outputs.length === 0;
  }

  function renderFiles() {
    if (!files.length) {
      fileList.innerHTML = '<div class="resize-empty">No images yet. Add files above to start.</div>';
      return;
    }
    fileList.innerHTML = files.map((item) => {
      const dims = item.width ? item.width + 'x' + item.height : 'Decoding after resize';
      const detail = item.error || [formatBytes(item.originalBytes), dims].join(' - ');
      return '<article class="resize-file-row" data-id="' + item.id + '">' +
        '<img class="resize-thumb" src="' + item.url + '" alt="">' +
        '<div><h3 class="resize-row-title">' + escapeHtml(item.name) + '</h3><div class="resize-row-meta">' + escapeHtml(detail) + '</div></div>' +
        '<div class="resize-row-actions"><span class="resize-badge ' + (item.status === 'done' ? 'done' : item.status === 'error' ? 'error' : '') + '">' + escapeHtml(item.statusText) + '</span>' +
        '<button type="button" class="resize-mini-btn" data-action="remove-file" data-id="' + item.id + '">Remove</button></div></article>';
    }).join('');
  }

  function renderOutputs() {
    if (!outputs.length) {
      outputList.innerHTML = '<div class="resize-empty">Processed exports appear here.</div>';
      return;
    }
    outputList.innerHTML = outputs.map((item) => {
      const label = item.targetLabel + ' - ' + item.outputWidth + 'x' + item.outputHeight;
      const saving = item.outputBytes && item.originalBytes ? Math.max(0, 100 - item.outputBytes / item.originalBytes * 100).toFixed(0) + '% smaller' : formatBytes(item.outputBytes);
      return '<article class="resize-output-row' + (item.id === selectedOutputId ? ' active' : '') + '" data-id="' + item.id + '">' +
        '<img class="resize-thumb" src="' + item.url + '" alt="">' +
        '<div><h3 class="resize-row-title">' + escapeHtml(item.outputName) + '</h3><div class="resize-row-meta">' + escapeHtml(label + ' - ' + saving) + '</div></div>' +
        '<div class="resize-row-actions"><button type="button" class="resize-mini-btn" data-action="select-output" data-id="' + item.id + '">View</button>' +
        '<button type="button" class="resize-mini-btn primary" data-action="download-output" data-id="' + item.id + '">Save</button></div></article>';
    }).join('');
  }

  function renderPreview() {
    const item = outputs.find((entry) => entry.id === selectedOutputId);
    const hasItem = !!item;
    previewEmpty.hidden = hasItem;
    beforeImage.hidden = !hasItem;
    afterImage.hidden = !hasItem;
    previewLabels.hidden = !hasItem;
    compareLine.hidden = !hasItem;
    compareSlider.hidden = !hasItem;
    if (!hasItem) {
      detailDimensions.textContent = '-';
      detailFormat.textContent = '-';
      detailMode.textContent = '-';
      return;
    }
    beforeImage.src = item.sourceUrl;
    afterImage.src = item.url;
    detailDimensions.textContent = item.sourceWidth + 'x' + item.sourceHeight + ' to ' + item.outputWidth + 'x' + item.outputHeight;
    detailFormat.textContent = extForMime(item.mime).toUpperCase() + ' q' + item.quality;
    detailMode.textContent = item.mode + ' - ' + item.targetLabel;
    updateCompare();
  }

  function updateCompare() {
    const value = Number(compareSlider.value) || 50;
    afterImage.style.clipPath = 'inset(0 0 0 ' + value + '%)';
    compareLine.style.left = value + '%';
  }

  function renderHistory() {
    let history = [];
    try {
      history = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (error) {}
    if (!history.length) {
      historyList.innerHTML = '<div class="resize-history-item">No local run history yet.</div>';
      return;
    }
    historyList.innerHTML = history.slice(0, 5).map((entry) => {
      const date = new Date(entry.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      return '<div class="resize-history-item"><strong>' + escapeHtml(date) + '</strong><br>' + entry.files + ' file' + (entry.files === 1 ? '' : 's') + ', ' + entry.outputs + ' export' + (entry.outputs === 1 ? '' : 's') + ', ' + formatBytes(entry.outputBytes) + ' total.</div>';
    }).join('');
  }

  function renderAll() {
    renderMetrics();
    renderFiles();
    renderOutputs();
    renderPreview();
    renderHistory();
  }

  function saveHistory() {
    if (!outputs.length) return;
    const entry = {
      date: new Date().toISOString(),
      files: files.length,
      outputs: outputs.length,
      outputBytes: outputs.reduce((sum, item) => sum + item.outputBytes, 0)
    };
    try {
      const history = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]');
      history.unshift(entry);
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
    } catch (error) {}
    renderHistory();
  }

  function downloadOutput(item) {
    if (!item || !item.blob) return;
    const link = document.createElement('a');
    link.href = item.url;
    link.download = item.outputName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function removeFile(id) {
    const item = files.find((entry) => entry.id === id);
    if (item) URL.revokeObjectURL(item.url);
    outputs
      .filter((entry) => entry.fileId === id)
      .forEach((entry) => URL.revokeObjectURL(entry.url));
    files = files.filter((entry) => entry.id !== id);
    outputs = outputs.filter((entry) => entry.fileId !== id);
    if (!outputs.find((entry) => entry.id === selectedOutputId)) {
      selectedOutputId = outputs[0] ? outputs[0].id : '';
    }
    renderAll();
  }

  targetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const activeCount = getActiveTargetKeys().length;
      const willDeactivate = button.classList.contains('active');
      if (willDeactivate && activeCount <= 1) {
        setStatus('Keep at least one target active.');
        return;
      }
      button.classList.toggle('active');
      button.setAttribute('aria-pressed', button.classList.contains('active') ? 'true' : 'false');
      scheduleAutoProcess();
    });
  });

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    fileInput.click();
  });
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    addFiles(event.dataTransfer.files);
  });
  fileInput.addEventListener('change', (event) => {
    addFiles(event.target.files);
    fileInput.value = '';
  });
  document.addEventListener('paste', (event) => {
    if (!event.clipboardData || !event.clipboardData.files || !event.clipboardData.files.length) return;
    addFiles(event.clipboardData.files);
  });

  [customWidth, customHeight, modeSelect, formatSelect, qualitySlider, backgroundColor, focalX, focalY, suffixInput, noUpscale, autoRun].forEach((control) => {
    control.addEventListener('input', () => {
      updateControlReadouts();
      scheduleAutoProcess();
    });
    control.addEventListener('change', () => {
      updateControlReadouts();
      scheduleAutoProcess();
    });
  });

  processBtn.addEventListener('click', processQueue);
  clearBtn.addEventListener('click', () => {
    files.forEach((item) => URL.revokeObjectURL(item.url));
    outputs.forEach((item) => URL.revokeObjectURL(item.url));
    files = [];
    outputs = [];
    selectedOutputId = '';
    setStatus('Queue cleared.');
    renderAll();
  });
  downloadAllBtn.addEventListener('click', () => {
    outputs.forEach((item, index) => {
      window.setTimeout(() => downloadOutput(item), index * 150);
    });
  });
  fileList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove-file"]');
    if (!button) return;
    removeFile(button.dataset.id);
  });
  outputList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    const row = event.target.closest('.resize-output-row');
    const id = (button && button.dataset.id) || (row && row.dataset.id);
    if (!id) return;
    if (!button || button.dataset.action === 'select-output') {
      selectedOutputId = id;
      renderAll();
      return;
    }
    if (button.dataset.action === 'download-output') {
      downloadOutput(outputs.find((entry) => entry.id === id));
    }
  });
  compareSlider.addEventListener('input', updateCompare);

  loadSettings();
  renderAll();
}());
