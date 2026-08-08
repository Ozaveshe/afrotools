(function () {
    'use strict';

    const STORAGE_KEY = 'afro_image_compress_settings_v2';
    const HISTORY_KEY = 'afro_image_compress_history_v1';
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    const $ = (id) => document.getElementById(id);

    const dropZone = $('dropZone');
    const fileInput = $('fileInput');
    const qualitySlider = $('qualitySlider');
    const qualityValue = $('qualityValue');
    const formatSelect = $('formatSelect');
    const targetKb = $('targetKb');
    const maxWidth = $('maxWidth');
    const maxHeight = $('maxHeight');
    const nameSuffix = $('nameSuffix');
    const backgroundColor = $('backgroundColor');
    const noUpscale = $('noUpscale');
    const autoRun = $('autoRun');
    const compressBtn = $('compressBtn');
    const downloadAllBtn = $('downloadAllBtn');
    const clearQueueBtn = $('clearQueueBtn');
    const queueList = $('queueList');
    const studioStatus = $('studioStatus');
    const presetNote = $('presetNote');
    const presetButtons = Array.from(document.querySelectorAll('[data-preset]'));
    const compareSlider = $('compareSlider');
    const compareLine = $('compareLine');
    const beforeImage = $('beforeImage');
    const afterImage = $('afterImage');
    const compareEmpty = $('compareEmpty');
    const compareLabels = $('compareLabels');
    const historyList = $('historyList');

    let queue = [];
    let selectedId = '';
    let busy = false;
    let debounceTimer = 0;

    const PRESETS = {
      whatsapp: { quality: 72, format: 'jpeg', target: '', maxW: 1600, maxH: 1600, suffix: '-whatsapp', note: 'WhatsApp Share keeps images light for chats, statuses, and community updates on limited data.' },
      portal: { quality: 78, format: 'jpeg', target: 500, maxW: 1800, maxH: 1800, suffix: '-portal', note: 'Portal Upload aims for a practical size limit while keeping faces, text, and document details readable.' },
      marketplace: { quality: 84, format: 'jpeg', target: '', maxW: 1600, maxH: 1600, suffix: '-listing', note: 'Marketplace preserves product clarity for shops, menus, seller catalogs, and listing photos.' },
      website: { quality: 68, format: 'webp', target: '', maxW: 1400, maxH: 1400, suffix: '-web', note: 'Fast Website creates lighter WebP exports for pages, blogs, and low-bandwidth browsing.' }
    };

    function setStatus(message) {
      studioStatus.textContent = message;
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
      return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    }

    function baseName(name) {
      return String(name || 'image').replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'image';
    }

    function mimeFor(format) {
      if (format === 'webp') return 'image/webp';
      if (format === 'png') return 'image/png';
      return 'image/jpeg';
    }

    function extForMime(mime) {
      if (mime === 'image/webp') return 'webp';
      if (mime === 'image/png') return 'png';
      return 'jpg';
    }

    function getSettings() {
      return {
        quality: Math.max(10, Math.min(100, Number(qualitySlider.value) || 76)) / 100,
        format: formatSelect.value || 'auto',
        targetBytes: Math.max(0, Number(targetKb.value) || 0) * 1024,
        maxW: Math.max(0, Number(maxWidth.value) || 0),
        maxH: Math.max(0, Number(maxHeight.value) || 0),
        suffix: nameSuffix.value || '-compressed',
        bg: backgroundColor.value || '#ffffff',
        noUpscale: !!noUpscale.checked,
        autoRun: !!autoRun.checked
      };
    }

    function saveSettings() {
      try {
        const settings = getSettings();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
          quality: Math.round(settings.quality * 100),
          format: settings.format,
          targetKb: targetKb.value || '',
          maxW: maxWidth.value || '',
          maxH: maxHeight.value || '',
          suffix: settings.suffix,
          bg: settings.bg,
          noUpscale: settings.noUpscale,
          autoRun: settings.autoRun
        }));
      } catch (error) {}
    }

    function loadSettings() {
      try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
        if (saved.quality) qualitySlider.value = saved.quality;
        if (saved.format) formatSelect.value = saved.format;
        if (saved.targetKb !== undefined) targetKb.value = saved.targetKb;
        if (saved.maxW !== undefined) maxWidth.value = saved.maxW;
        if (saved.maxH !== undefined) maxHeight.value = saved.maxH;
        if (saved.suffix) nameSuffix.value = saved.suffix;
        if (saved.bg) backgroundColor.value = saved.bg;
        if (saved.noUpscale !== undefined) noUpscale.checked = !!saved.noUpscale;
        if (saved.autoRun !== undefined) autoRun.checked = !!saved.autoRun;
      } catch (error) {}
      qualityValue.textContent = qualitySlider.value;
    }

    function scheduleAutoProcess() {
      saveSettings();
      window.clearTimeout(debounceTimer);
      if (!autoRun.checked || !queue.length) return;
      debounceTimer = window.setTimeout(() => processQueue(), 450);
    }

    function addFiles(files) {
      const accepted = Array.from(files || []).filter((file) => {
        if (!file.type || !file.type.startsWith('image/')) return false;
        if (file.size > MAX_FILE_SIZE) {
          setStatus(file.name + ' is over 50MB.');
          return false;
        }
        return true;
      });

      accepted.forEach((file) => {
        const id = 'img-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
        const url = URL.createObjectURL(file);
        queue.push({
          id,
          file,
          url,
          name: file.name,
          status: 'queued',
          statusText: 'Queued',
          originalBytes: file.size,
          outputBytes: 0,
          outputBlob: null,
          outputUrl: '',
          outputName: '',
          outputMime: '',
          width: 0,
          height: 0,
          outputWidth: 0,
          outputHeight: 0,
          qualityUsed: 0,
          error: ''
        });
        if (!selectedId) selectedId = id;
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

    function canvasFor(image, settings, mime) {
      const sourceW = image.width;
      const sourceH = image.height;
      let ratio = 1;
      if (settings.maxW || settings.maxH) {
        const ratios = [];
        if (settings.maxW) ratios.push(settings.maxW / sourceW);
        if (settings.maxH) ratios.push(settings.maxH / sourceH);
        ratio = Math.min.apply(Math, ratios);
        if (settings.noUpscale) ratio = Math.min(1, ratio);
      }
      if (!isFinite(ratio) || ratio <= 0) ratio = 1;
      const width = Math.max(1, Math.round(sourceW * ratio));
      const height = Math.max(1, Math.round(sourceH * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: mime !== 'image/jpeg' });
      if (!ctx) throw new Error('Canvas is not available in this browser.');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      if (mime === 'image/jpeg') {
        ctx.fillStyle = settings.bg;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(image, 0, 0, width, height);
      return { canvas, width, height, sourceW, sourceH };
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

    async function encodeWithTarget(canvas, mime, settings) {
      if (mime === 'image/png') {
        const png = await encode(canvas, mime, settings.quality);
        return { blob: png, quality: 1 };
      }

      if (!settings.targetBytes) {
        const blob = await encode(canvas, mime, settings.quality);
        return { blob, quality: settings.quality };
      }

      let low = 0.1;
      let high = settings.quality;
      let bestUnder = null;
      let smallest = null;
      for (let i = 0; i < 7; i += 1) {
        const mid = (low + high) / 2;
        const blob = await encode(canvas, mime, mid);
        if (!blob) break;
        const candidate = { blob, quality: mid };
        if (!smallest || blob.size < smallest.blob.size) smallest = candidate;
        if (blob.size <= settings.targetBytes) {
          bestUnder = candidate;
          low = mid;
        } else {
          high = mid;
        }
      }
      return bestUnder || smallest || { blob: null, quality: settings.quality };
    }

    async function processItem(item, settings) {
      item.status = 'processing';
      item.statusText = 'Processing';
      item.error = '';
      renderQueue();
      const image = await decodeImage(item.file);
      const requested = settings.format === 'auto' ? ['image/webp', 'image/jpeg', 'image/png'] : [mimeFor(settings.format)];
      const candidates = [];
      for (const mime of requested) {
        const built = canvasFor(image, settings, mime);
        const encoded = await encodeWithTarget(built.canvas, mime, settings);
        if (encoded.blob) {
          candidates.push({ mime, blob: encoded.blob, quality: encoded.quality, width: built.width, height: built.height, sourceW: built.sourceW, sourceH: built.sourceH });
        }
      }
      if (image.close) image.close();
      if (!candidates.length) throw new Error('This browser could not encode the requested format.');
      let winner = candidates[0];
      if (settings.targetBytes) {
        const under = candidates.filter((candidate) => candidate.blob.size <= settings.targetBytes).sort((a, b) => b.quality - a.quality || a.blob.size - b.blob.size)[0];
        winner = under || candidates.sort((a, b) => a.blob.size - b.blob.size)[0];
      } else {
        winner = candidates.sort((a, b) => a.blob.size - b.blob.size)[0];
      }
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      item.outputBlob = winner.blob;
      item.outputUrl = URL.createObjectURL(winner.blob);
      item.outputBytes = winner.blob.size;
      item.outputMime = winner.mime;
      item.outputName = baseName(item.name) + settings.suffix + '.' + extForMime(winner.mime);
      item.width = winner.sourceW;
      item.height = winner.sourceH;
      item.outputWidth = winner.width;
      item.outputHeight = winner.height;
      item.qualityUsed = Math.round(winner.quality * 100);
      item.status = 'done';
      item.statusText = 'Done';
    }

    async function processQueue() {
      if (busy || !queue.length) return;
      busy = true;
      compressBtn.disabled = true;
      setStatus('Compressing ' + queue.length + ' image' + (queue.length === 1 ? '' : 's') + '...');
      const settings = getSettings();
      saveSettings();
      for (const item of queue) {
        try {
          await processItem(item, settings);
        } catch (error) {
          item.status = 'error';
          item.statusText = 'Needs attention';
          item.error = error.message || 'Compression failed.';
        }
      }
      busy = false;
      compressBtn.disabled = false;
      setStatus('Queue complete.');
      renderAll();
      saveHistory();
    }

    function renderMetrics() {
      const original = queue.reduce((sum, item) => sum + item.originalBytes, 0);
      const output = queue.reduce((sum, item) => sum + (item.outputBytes || 0), 0);
      const done = queue.filter((item) => item.status === 'done').length;
      $('metricFiles').textContent = queue.length;
      $('metricOriginal').textContent = formatBytes(original);
      $('metricOutput').textContent = output ? formatBytes(output) : '0 KB';
      $('metricSaved').textContent = original && output ? Math.max(0, (100 - output / original * 100)).toFixed(0) + '%' : '0%';
      downloadAllBtn.disabled = done === 0;
    }

    function renderQueue() {
      if (!queue.length) {
        queueList.innerHTML = '<div class="queue-empty">No images yet. Add files above to start.</div>';
        renderMetrics();
        renderCompare();
        return;
      }
      queueList.innerHTML = queue.map((item) => {
        const saved = item.outputBytes ? Math.max(0, (100 - item.outputBytes / item.originalBytes * 100)).toFixed(1) + '% saved' : 'Waiting';
        const detail = item.error || [formatBytes(item.originalBytes), item.outputBytes ? formatBytes(item.outputBytes) : '', item.outputWidth ? item.outputWidth + 'x' + item.outputHeight : ''].filter(Boolean).join(' -> ');
        return '<article class="queue-card' + (item.id === selectedId ? ' is-active' : '') + '" data-id="' + item.id + '">' +
          '<img class="queue-thumb" src="' + item.url + '" alt="">' +
          '<div><h3 class="queue-name">' + escapeHtml(item.name) + '</h3><div class="queue-meta">' + escapeHtml(detail) + '</div></div>' +
          '<div class="queue-actions"><span class="queue-badge ' + (item.status === 'done' ? 'done' : item.status === 'error' ? 'error' : '') + '">' + escapeHtml(item.status === 'done' ? saved : item.statusText) + '</span>' +
          '<button type="button" class="mini-btn" data-action="select" data-id="' + item.id + '">View</button>' +
          '<button type="button" class="mini-btn primary" data-action="download" data-id="' + item.id + '"' + (!item.outputBlob ? ' disabled' : '') + '>Save</button>' +
          '<button type="button" class="mini-btn" data-action="remove" data-id="' + item.id + '">Remove</button></div></article>';
      }).join('');
      renderMetrics();
      renderCompare();
    }

    function renderCompare() {
      const item = queue.find((entry) => entry.id === selectedId && entry.status === 'done');
      const hasItem = !!item;
      compareEmpty.hidden = hasItem;
      beforeImage.hidden = !hasItem;
      afterImage.hidden = !hasItem;
      compareLabels.hidden = !hasItem;
      compareLine.hidden = !hasItem;
      compareSlider.hidden = !hasItem;
      if (!hasItem) {
        $('detailDimensions').textContent = '-';
        $('detailFormat').textContent = '-';
        $('detailSaved').textContent = '-';
        return;
      }
      beforeImage.src = item.url;
      afterImage.src = item.outputUrl;
      $('detailDimensions').textContent = item.outputWidth + 'x' + item.outputHeight;
      $('detailFormat').textContent = extForMime(item.outputMime).toUpperCase() + ' q' + item.qualityUsed;
      $('detailSaved').textContent = Math.max(0, (100 - item.outputBytes / item.originalBytes * 100)).toFixed(1) + '%';
      updateCompare();
    }

    function updateCompare() {
      const value = Number(compareSlider.value) || 50;
      afterImage.style.clipPath = 'inset(0 0 0 ' + value + '%)';
      compareLine.style.left = value + '%';
    }

    function renderAll() {
      renderQueue();
      renderHistory();
    }

    function downloadItem(item) {
      if (!item || !item.outputBlob) return;
      const link = document.createElement('a');
      link.href = item.outputUrl;
      link.download = item.outputName;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }

    function saveHistory() {
      const done = queue.filter((item) => item.status === 'done');
      if (!done.length) return;
      const original = done.reduce((sum, item) => sum + item.originalBytes, 0);
      const output = done.reduce((sum, item) => sum + item.outputBytes, 0);
      const entry = {
        date: new Date().toISOString(),
        count: done.length,
        original,
        output,
        saved: original && output ? Math.max(0, 100 - output / original * 100) : 0
      };
      try {
        const history = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]');
        history.unshift(entry);
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 5)));
      } catch (error) {}
      renderHistory();
    }

    function renderHistory() {
      let history = [];
      try {
        history = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || '[]');
      } catch (error) {}
      if (!history.length) {
        historyList.innerHTML = '<div class="history-item">No local run history yet.</div>';
        return;
      }
      historyList.innerHTML = history.slice(0, 5).map((entry) => {
        const date = new Date(entry.date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return '<div class="history-item"><strong>' + escapeHtml(date) + '</strong><br>' + entry.count + ' file' + (entry.count === 1 ? '' : 's') + ', ' + formatBytes(entry.original) + ' to ' + formatBytes(entry.output) + ', ' + entry.saved.toFixed(0) + '% saved.</div>';
      }).join('');
    }

    function applyPreset(key) {
      const preset = PRESETS[key];
      if (!preset) return;
      qualitySlider.value = preset.quality;
      qualityValue.textContent = preset.quality;
      formatSelect.value = preset.format;
      targetKb.value = preset.target;
      maxWidth.value = preset.maxW;
      maxHeight.value = preset.maxH;
      nameSuffix.value = preset.suffix;
      presetNote.textContent = preset.note;
      presetButtons.forEach((button) => button.classList.toggle('active', button.dataset.preset === key));
      scheduleAutoProcess();
    }

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
    presetButtons.forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
    [qualitySlider, formatSelect, targetKb, maxWidth, maxHeight, nameSuffix, backgroundColor, noUpscale, autoRun].forEach((control) => {
      control.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value;
        scheduleAutoProcess();
      });
      control.addEventListener('change', scheduleAutoProcess);
    });
    compressBtn.addEventListener('click', processQueue);
    clearQueueBtn.addEventListener('click', () => {
      queue.forEach((item) => {
        URL.revokeObjectURL(item.url);
        if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      });
      queue = [];
      selectedId = '';
      setStatus('Queue cleared.');
      renderAll();
    });
    downloadAllBtn.addEventListener('click', () => {
      queue.filter((item) => item.outputBlob).forEach((item, index) => {
        window.setTimeout(() => downloadItem(item), index * 150);
      });
    });
    queueList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      const card = event.target.closest('.queue-card');
      const id = (button && button.dataset.id) || (card && card.dataset.id);
      if (!id) return;
      if (!button || button.dataset.action === 'select') {
        selectedId = id;
        renderQueue();
        return;
      }
      const item = queue.find((entry) => entry.id === id);
      if (button.dataset.action === 'download') downloadItem(item);
      if (button.dataset.action === 'remove') {
        if (item) {
          URL.revokeObjectURL(item.url);
          if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
        }
        queue = queue.filter((entry) => entry.id !== id);
        if (selectedId === id) selectedId = queue[0] ? queue[0].id : '';
        renderAll();
      }
    });
    compareSlider.addEventListener('input', updateCompare);

    loadSettings();
    renderAll();
  })();
