(function () {
  'use strict';

  var SETTINGS_KEY = 'afro_image_format_convert_settings_v2';
  var HISTORY_KEY = 'afro_image_format_convert_history_v1';

  var FORMATS = [
    { mime: 'image/jpeg', ext: 'jpg', label: 'JPG', lossy: true, fallback: true },
    { mime: 'image/png', ext: 'png', label: 'PNG', lossy: false, fallback: true },
    { mime: 'image/webp', ext: 'webp', label: 'WebP', lossy: true, fallback: false },
    { mime: 'image/avif', ext: 'avif', label: 'AVIF', lossy: true, fallback: false }
  ];

  var PRESETS = {
    portal: {
      label: 'Portal-safe JPG',
      copy: 'Job, visa, school, and form uploads.',
      formats: ['image/jpeg'],
      quality: 82,
      maxWidth: 1600,
      maxHeight: 1600,
      scale: 100,
      suffix: 'portal',
      guide: [
        'JPG is the safest upload target for older form systems.',
        'Keep faces, document text, and product details readable.',
        'Use this when a portal rejects WebP, AVIF, or very large files.'
      ]
    },
    web: {
      label: 'Web delivery pack',
      copy: 'WebP plus JPG fallback for sites and CMS uploads.',
      formats: ['image/webp', 'image/jpeg'],
      quality: 78,
      maxWidth: 1920,
      maxHeight: 1280,
      scale: 100,
      suffix: 'web',
      guide: [
        'WebP is a good default for modern websites.',
        'A JPG fallback keeps older upload flows covered.',
        'Copy the picture markup after conversion for a quick handoff.'
      ]
    },
    modern: {
      label: 'Modern bundle',
      copy: 'AVIF, WebP, and JPG when the browser can encode them.',
      formats: ['image/avif', 'image/webp', 'image/jpeg'],
      quality: 74,
      maxWidth: 1920,
      maxHeight: 1280,
      scale: 100,
      suffix: 'modern',
      guide: [
        'Use this for performance tests and modern web delivery.',
        'Unsupported browser encoders are skipped automatically.',
        'Keep the JPG fallback if clients or CMS tools are unpredictable.'
      ]
    },
    transparent: {
      label: 'Transparent PNG',
      copy: 'Logos, screenshots, stickers, and sharp UI graphics.',
      formats: ['image/png'],
      quality: 100,
      maxWidth: '',
      maxHeight: '',
      scale: 100,
      suffix: 'transparent',
      guide: [
        'PNG preserves transparency and crisp edges.',
        'Use it for logos, screenshots, signatures, and brand assets.',
        'Expect larger files than JPG or WebP for photos.'
      ]
    },
    data: {
      label: 'Data saver',
      copy: 'Smaller sharing files for slower connections.',
      formats: ['image/webp', 'image/jpeg'],
      quality: 58,
      maxWidth: 1280,
      maxHeight: 1280,
      scale: 85,
      suffix: 'data-saver',
      guide: [
        'Good for quick approvals, drafts, and chat sharing.',
        'Quality is lower on purpose to reduce data use.',
        'Preview before using this for important product or ID photos.'
      ]
    },
    archive: {
      label: 'Clean archive',
      copy: 'PNG plus WebP copy, no aggressive shrinking.',
      formats: ['image/png', 'image/webp'],
      quality: 90,
      maxWidth: '',
      maxHeight: '',
      scale: 100,
      suffix: 'archive',
      guide: [
        'Useful when you need an editing-safe copy and a smaller web copy.',
        'Canvas export removes most original metadata from the new files.',
        'Keep originals separately if legal or camera metadata matters.'
      ]
    }
  };

  var els = {};
  var files = [];
  var activeIndex = 0;
  var activePreset = 'web';
  var support = {};
  var currentOutputs = [];
  var zipOutput = null;
  var history = [];

  function $(id) {
    return document.getElementById(id);
  }

  function init() {
    els = {
      status: $('ifcStatus'),
      drop: $('ifcDropZone'),
      input: $('ifcInput'),
      queue: $('ifcQueue'),
      targetButtons: Array.prototype.slice.call(document.querySelectorAll('[data-ifc-preset]')),
      formatInputs: Array.prototype.slice.call(document.querySelectorAll('[data-ifc-format]')),
      quality: $('ifcQuality'),
      qualityValue: $('ifcQualityValue'),
      maxWidth: $('ifcMaxWidth'),
      maxHeight: $('ifcMaxHeight'),
      scale: $('ifcScale'),
      scaleValue: $('ifcScaleValue'),
      background: $('ifcBackground'),
      suffix: $('ifcSuffix'),
      originalBox: $('ifcOriginalBox'),
      outputBox: $('ifcOutputBox'),
      convertCurrent: $('ifcConvertCurrent'),
      convertAll: $('ifcConvertAll'),
      downloadCurrent: $('ifcDownloadCurrent'),
      downloadZip: $('ifcDownloadZip'),
      copyMarkup: $('ifcCopyMarkup'),
      sourceTotal: $('ifcSourceTotal'),
      outputTotal: $('ifcOutputTotal'),
      savings: $('ifcSavings'),
      outputCount: $('ifcOutputCount'),
      supportList: $('ifcSupportList'),
      historyList: $('ifcHistoryList'),
      guideTitle: $('ifcGuideTitle'),
      guideIntro: $('ifcGuideIntro'),
      guideList: $('ifcGuideList')
    };

    if (!els.input || !els.drop) return;

    loadSettings();
    loadHistory();
    bindEvents();
    updateRangeLabels();
    renderPresetButtons();
    renderGuide();
    renderQueue();
    renderHistory();
    updateStats();
    updateActions();
    detectSupport().then(function () {
      applyPreset(activePreset, false);
      setStatus('Ready. Choose images to convert locally.');
    });
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

    document.addEventListener('paste', function (event) {
      if (event.clipboardData && event.clipboardData.files.length) {
        handleFiles(event.clipboardData.files);
      }
    });

    els.input.addEventListener('change', function () {
      handleFiles(els.input.files);
    });

    els.queue.addEventListener('click', function (event) {
      var button = event.target.closest('[data-ifc-index]');
      if (!button) return;
      activeIndex = Number(button.dataset.ifcIndex);
      revokeOutputs();
      renderQueue();
      renderOriginal();
      renderEmptyOutput('Convert this file to preview the result.');
      updateActions();
    });

    els.targetButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyPreset(button.dataset.ifcPreset, true);
      });
    });

    els.formatInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        activePreset = '';
        ensureOneFormat();
        saveSettings();
        renderPresetButtons();
        renderGuide();
      });
    });

    [els.maxWidth, els.maxHeight, els.background, els.suffix].forEach(function (field) {
      field.addEventListener('input', function () {
        activePreset = '';
        saveSettings();
        renderPresetButtons();
        renderGuide();
      });
    });

    els.quality.addEventListener('input', function () {
      activePreset = '';
      updateRangeLabels();
      saveSettings();
      renderPresetButtons();
      renderGuide();
    });

    els.scale.addEventListener('input', function () {
      activePreset = '';
      updateRangeLabels();
      saveSettings();
      renderPresetButtons();
      renderGuide();
    });

    els.convertCurrent.addEventListener('click', convertCurrent);
    els.convertAll.addEventListener('click', convertAll);
    els.downloadCurrent.addEventListener('click', downloadCurrent);
    els.downloadZip.addEventListener('click', downloadZip);
    els.copyMarkup.addEventListener('click', copyMarkup);

    window.addEventListener('beforeunload', function () {
      files.forEach(function (record) {
        if (record.previewUrl) URL.revokeObjectURL(record.previewUrl);
      });
      revokeOutputs();
      revokeZip();
    });
  }

  function detectSupport() {
    setStatus('Checking browser encoders...');
    return Promise.all(FORMATS.map(function (format) {
      return canEncode(format.mime).then(function (ok) {
        support[format.mime] = ok;
      });
    })).then(function () {
      renderSupport();
      syncFormatAvailability();
    });
  }

  function canEncode(mime) {
    return new Promise(function (resolve) {
      var canvas = document.createElement('canvas');
      canvas.width = 2;
      canvas.height = 2;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, 0, 2, 2);
      canvas.toBlob(function (blob) {
        resolve(!!blob && (mime === 'image/png' ? blob.type === 'image/png' : blob.type === mime));
      }, mime, .8);
    });
  }

  function syncFormatAvailability() {
    els.formatInputs.forEach(function (input) {
      var isSupported = !!support[input.value];
      input.disabled = !isSupported;
      var label = input.closest('.ifc-format');
      if (label) label.classList.toggle('unsupported', !isSupported);
      if (!isSupported) input.checked = false;
    });
    ensureOneFormat();
  }

  function renderSupport() {
    els.supportList.innerHTML = FORMATS.map(function (format) {
      var state = support[format.mime] ? 'Supported' : 'Not available';
      return '<div class="ifc-support-row"><strong>' + format.label + '</strong><span>' + state + '</span></div>';
    }).join('');
  }

  function loadSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      activePreset = saved.preset || 'web';
      els.quality.value = saved.quality || 78;
      els.scale.value = saved.scale || 100;
      els.maxWidth.value = saved.maxWidth || '';
      els.maxHeight.value = saved.maxHeight || '';
      els.background.value = saved.background || '#ffffff';
      els.suffix.value = saved.suffix || 'web';
      if (Array.isArray(saved.formats)) {
        setSelectedFormats(saved.formats);
      }
    } catch (error) {
      activePreset = 'web';
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        preset: activePreset,
        formats: getSelectedFormats(),
        quality: els.quality.value,
        scale: els.scale.value,
        maxWidth: els.maxWidth.value,
        maxHeight: els.maxHeight.value,
        background: els.background.value,
        suffix: els.suffix.value
      }));
    } catch (error) {
      /* Local storage may be unavailable. */
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
      /* Ignore quota issues. */
    }
    renderHistory();
  }

  function renderHistory() {
    if (!history.length) {
      els.historyList.innerHTML = '<div class="ifc-history-item">Recent conversion packs will appear here.</div>';
      return;
    }
    els.historyList.innerHTML = history.map(function (item) {
      return '<div class="ifc-history-item"><strong>' + escapeHtml(item.label) + '</strong><br>' +
        escapeHtml(item.details) + '</div>';
    }).join('');
  }

  function renderPresetButtons() {
    els.targetButtons.forEach(function (button) {
      var active = button.dataset.ifcPreset === activePreset;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyPreset(key, announce) {
    var preset = PRESETS[key] || PRESETS.web;
    activePreset = key && PRESETS[key] ? key : 'web';
    setSelectedFormats(preset.formats);
    els.quality.value = preset.quality;
    els.scale.value = preset.scale;
    els.maxWidth.value = preset.maxWidth;
    els.maxHeight.value = preset.maxHeight;
    els.suffix.value = preset.suffix;
    syncFormatAvailability();
    updateRangeLabels();
    renderPresetButtons();
    renderGuide();
    saveSettings();
    if (announce) setStatus(preset.label + ' recipe applied.');
  }

  function renderGuide() {
    var preset = PRESETS[activePreset];
    if (preset) {
      els.guideTitle.textContent = preset.label;
      els.guideIntro.textContent = preset.copy;
      els.guideList.innerHTML = preset.guide.map(function (item) {
        return '<li>' + escapeHtml(item) + '</li>';
      }).join('');
      return;
    }

    els.guideTitle.textContent = 'Custom format recipe';
    els.guideIntro.textContent = selectedLabels().join(', ') + ' output with your current sizing and quality controls.';
    els.guideList.innerHTML = [
      'Keep JPG in the pack when upload compatibility matters.',
      'Use WebP or AVIF when the destination supports modern image formats.',
      'Preview one file before building a full batch zip.'
    ].map(function (item) {
      return '<li>' + item + '</li>';
    }).join('');
  }

  function setSelectedFormats(formats) {
    els.formatInputs.forEach(function (input) {
      input.checked = formats.indexOf(input.value) !== -1;
    });
  }

  function getSelectedFormats() {
    return els.formatInputs
      .filter(function (input) { return input.checked && !input.disabled; })
      .map(function (input) { return input.value; });
  }

  function ensureOneFormat() {
    if (getSelectedFormats().length) return;
    var fallback = els.formatInputs.find(function (input) {
      return !input.disabled && (input.value === 'image/jpeg' || input.value === 'image/png');
    }) || els.formatInputs.find(function (input) { return !input.disabled; });
    if (fallback) fallback.checked = true;
  }

  function selectedLabels() {
    var selected = getSelectedFormats();
    return FORMATS
      .filter(function (format) { return selected.indexOf(format.mime) !== -1; })
      .map(function (format) { return format.label; });
  }

  function updateRangeLabels() {
    els.qualityValue.textContent = els.quality.value + '%';
    els.scaleValue.textContent = els.scale.value + '%';
  }

  function handleFiles(fileList) {
    var incoming = Array.prototype.slice.call(fileList || []).filter(isImageFile);
    if (!incoming.length) {
      setStatus('Choose image files that your browser can decode.');
      return;
    }

    cleanupFileRecords();
    files = incoming.map(function (file, index) {
      return {
        id: Date.now() + '-' + index,
        file: file,
        name: file.name,
        size: file.size,
        type: file.type || guessType(file.name),
        previewUrl: URL.createObjectURL(file),
        image: null,
        width: 0,
        height: 0,
        error: ''
      };
    });
    activeIndex = 0;
    revokeOutputs();
    revokeZip();
    renderQueue();
    renderOriginal();
    renderEmptyOutput('Convert this file to preview the result.');
    updateStats();
    updateActions();
    setStatus(files.length + ' image' + (files.length === 1 ? '' : 's') + ' ready.');
  }

  function cleanupFileRecords() {
    files.forEach(function (record) {
      if (record.previewUrl) URL.revokeObjectURL(record.previewUrl);
    });
    files = [];
  }

  function isImageFile(file) {
    return file && (
      (file.type && file.type.indexOf('image/') === 0) ||
      /\.(png|jpe?g|webp|bmp|gif|svg|avif|heic|heif)$/i.test(file.name)
    );
  }

  function guessType(name) {
    var ext = String(name || '').split('.').pop().toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'avif') return 'image/avif';
    if (ext === 'svg') return 'image/svg+xml';
    if (ext === 'bmp') return 'image/bmp';
    return 'image';
  }

  function renderQueue() {
    if (!files.length) {
      els.queue.innerHTML = '';
      return;
    }

    els.queue.innerHTML = files.map(function (record, index) {
      return '<button class="ifc-file ' + (index === activeIndex ? 'active' : '') + '" type="button" data-ifc-index="' + index + '">' +
        '<span>' + escapeHtml(record.name) + '</span><small>' + formatBytes(record.size) + '</small></button>';
    }).join('');
  }

  function loadRecord(record) {
    if (record.image) return Promise.resolve(record);
    if (window.createImageBitmap) {
      return createImageBitmap(record.file, { imageOrientation: 'from-image' })
        .then(function (bitmap) {
          record.image = bitmap;
          record.width = bitmap.width;
          record.height = bitmap.height;
          return record;
        })
        .catch(function () {
          return loadWithImageElement(record);
        });
    }
    return loadWithImageElement(record);
  }

  function loadWithImageElement(record) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.onload = function () {
        record.image = image;
        record.width = image.naturalWidth || image.width;
        record.height = image.naturalHeight || image.height;
        resolve(record);
      };
      image.onerror = function () {
        record.error = 'This browser cannot decode the source file.';
        reject(new Error(record.error));
      };
      image.src = record.previewUrl;
    });
  }

  function renderOriginal() {
    var record = files[activeIndex];
    if (!record) {
      els.originalBox.innerHTML = '<div class="ifc-preview-empty">Upload an image to see the original.</div>';
      return;
    }

    loadRecord(record)
      .then(function () {
        els.originalBox.innerHTML = '<img src="' + record.previewUrl + '" alt="">' +
          '<div class="ifc-preview-meta">Original: ' + formatPixels(record.width, record.height) +
          ' | ' + escapeHtml(record.type || 'image') + ' | ' + formatBytes(record.size) + '</div>';
        updateStats();
      })
      .catch(function () {
        els.originalBox.innerHTML = '<div class="ifc-preview-empty">This source could not be decoded in this browser.</div>';
      });
  }

  function renderEmptyOutput(message) {
    els.outputBox.innerHTML = '<div class="ifc-preview-empty">' + escapeHtml(message) + '</div>';
  }

  function getOutputDimensions(record) {
    var scale = clamp(Number(els.scale.value || 100), 1, 300) / 100;
    var width = Math.max(1, Math.round(record.width * scale));
    var height = Math.max(1, Math.round(record.height * scale));
    var maxWidth = Number(els.maxWidth.value || 0);
    var maxHeight = Number(els.maxHeight.value || 0);
    var bounds = 1;

    if (maxWidth > 0 && width > maxWidth) {
      bounds = Math.min(bounds, maxWidth / width);
    }
    if (maxHeight > 0 && height > maxHeight) {
      bounds = Math.min(bounds, maxHeight / height);
    }

    width = Math.max(1, Math.round(width * bounds));
    height = Math.max(1, Math.round(height * bounds));
    return { width: width, height: height };
  }

  function drawRecordToCanvas(record) {
    var dims = getOutputDimensions(record);
    var canvas = document.createElement('canvas');
    canvas.width = dims.width;
    canvas.height = dims.height;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.clearRect(0, 0, dims.width, dims.height);
    ctx.drawImage(record.image, 0, 0, dims.width, dims.height);
    return { canvas: canvas, width: dims.width, height: dims.height };
  }

  function encodeCanvas(canvas, mime) {
    return new Promise(function (resolve, reject) {
      var exportCanvas = canvas;
      if (mime === 'image/jpeg') {
        exportCanvas = document.createElement('canvas');
        exportCanvas.width = canvas.width;
        exportCanvas.height = canvas.height;
        var ctx = exportCanvas.getContext('2d');
        ctx.fillStyle = els.background.value || '#ffffff';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        ctx.drawImage(canvas, 0, 0);
      }

      exportCanvas.toBlob(function (blob) {
        if (!blob || blob.type !== mime) {
          reject(new Error('unsupported format'));
          return;
        }
        resolve(blob);
      }, mime, Number(els.quality.value || 80) / 100);
    });
  }

  function convertRecord(record) {
    var formats = getSelectedFormats();
    if (!formats.length) {
      return Promise.reject(new Error('No output formats selected'));
    }

    return loadRecord(record)
      .then(function () {
        var rendered = drawRecordToCanvas(record);
        return Promise.all(formats.map(function (mime) {
          return encodeCanvas(rendered.canvas, mime).then(function (blob) {
            var format = getFormat(mime);
            return {
              record: record,
              blob: blob,
              mime: mime,
              ext: format.ext,
              label: format.label,
              width: rendered.width,
              height: rendered.height,
              name: buildOutputName(record.name, format.ext)
            };
          });
        }));
      });
  }

  function convertCurrent() {
    var record = files[activeIndex];
    if (!record) {
      setStatus('Upload an image first.');
      return;
    }

    revokeOutputs();
    revokeZip();
    setStatus('Converting current image...');
    convertRecord(record)
      .then(function (outputs) {
        currentOutputs = outputs;
        renderOutput(record, outputs);
        updateStats(outputs);
        updateActions();
        saveHistory({
          label: 'Current image export',
          details: outputs.length + ' output' + (outputs.length === 1 ? '' : 's') + ' | ' + selectedLabels().join(', ')
        });
        setStatus('Current image converted.');
      })
      .catch(function (error) {
        renderEmptyOutput('Conversion failed. Try JPG, PNG, or WebP.');
        setStatus(error.message || 'Conversion failed.');
      });
  }

  function convertAll() {
    if (!files.length) {
      setStatus('Upload images before building a batch.');
      return;
    }
    if (!window.JSZip) {
      setStatus('Zip packaging is not available on this page.');
      return;
    }

    revokeOutputs();
    revokeZip();
    updateActions();
    var zip = new JSZip();
    var manifest = {
      tool: 'AfroTools Image Format Converter Studio',
      createdAt: new Date().toISOString(),
      settings: collectSettings(),
      files: []
    };

    var chain = Promise.resolve();
    files.forEach(function (record, index) {
      chain = chain.then(function () {
        setStatus('Converting ' + (index + 1) + ' of ' + files.length + '...');
        return convertRecord(record).then(function (outputs) {
          var manifestItem = {
            source: record.name,
            sourceBytes: record.size,
            sourceDimensions: record.width + 'x' + record.height,
            outputs: []
          };
          outputs.forEach(function (output) {
            zip.file(output.ext + '/' + output.name, output.blob);
            manifestItem.outputs.push({
              name: output.ext + '/' + output.name,
              type: output.mime,
              bytes: output.blob.size,
              dimensions: output.width + 'x' + output.height
            });
          });
          manifest.files.push(manifestItem);
        });
      });
    });

    chain
      .then(function () {
        zip.file('manifest.json', JSON.stringify(manifest, null, 2));
        return zip.generateAsync({ type: 'blob' });
      })
      .then(function (blob) {
        zipOutput = {
          blob: blob,
          url: URL.createObjectURL(blob),
          name: 'afrotools-image-format-pack-' + Date.now() + '.zip'
        };
        saveHistory({
          label: 'Batch zip export',
          details: files.length + ' source file' + (files.length === 1 ? '' : 's') + ' | ' + selectedLabels().join(', ') + ' | ' + formatBytes(blob.size)
        });
        updateActions();
        updateStats();
        setStatus('Batch zip is ready.');
      })
      .catch(function () {
        setStatus('At least one image could not be converted. Check source format support.');
      });
  }

  function renderOutput(record, outputs) {
    var primary = outputs[0];
    primary.url = URL.createObjectURL(primary.blob);
    var change = record.size ? Math.round((1 - primary.blob.size / record.size) * 100) : 0;
    var note = change > 0 ? change + '% smaller' : change < 0 ? Math.abs(change) + '% larger' : 'same size';
    var list = outputs.map(function (output) {
      return output.label + ' ' + formatBytes(output.blob.size);
    }).join(' | ');
    els.outputBox.innerHTML = '<img src="' + primary.url + '" alt="">' +
      '<div class="ifc-preview-meta">Preview: ' + formatPixels(primary.width, primary.height) +
      ' | ' + list + ' | first output is ' + note + '</div>';
  }

  function downloadCurrent() {
    if (!currentOutputs.length) return;
    if (currentOutputs.length === 1) {
      var output = currentOutputs[0];
      var url = output.url || URL.createObjectURL(output.blob);
      downloadUrl(url, output.name);
      return;
    }
    if (!window.JSZip) {
      setStatus('Zip packaging is not available.');
      return;
    }
    var zip = new JSZip();
    currentOutputs.forEach(function (output) {
      zip.file(output.name, output.blob);
    });
    zip.generateAsync({ type: 'blob' }).then(function (blob) {
      var url = URL.createObjectURL(blob);
      downloadUrl(url, cleanName(files[activeIndex].name.replace(/\.[^.]+$/, '')) + '-formats.zip');
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 1600);
    });
  }

  function downloadZip() {
    if (!zipOutput) return;
    downloadUrl(zipOutput.url, zipOutput.name);
  }

  function copyMarkup() {
    if (!currentOutputs.length) {
      setStatus('Convert the current image first.');
      return;
    }
    var outputs = currentOutputs.slice().sort(function (a, b) {
      var order = { 'image/avif': 1, 'image/webp': 2, 'image/jpeg': 3, 'image/png': 4 };
      return (order[a.mime] || 9) - (order[b.mime] || 9);
    });
    var fallback = outputs.find(function (output) { return output.mime === 'image/jpeg'; }) || outputs[outputs.length - 1];
    var sources = outputs
      .filter(function (output) { return output !== fallback; })
      .map(function (output) {
        return '  <source srcset="' + output.name + '" type="' + output.mime + '">';
      });
    var markup = ['<picture>']
      .concat(sources)
      .concat(['  <img src="' + fallback.name + '" alt="">', '</picture>'])
      .join('\n');

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      setStatus('Clipboard is not available in this browser.');
      return;
    }
    navigator.clipboard.writeText(markup)
      .then(function () {
        setStatus('Picture markup copied.');
      })
      .catch(function () {
        setStatus('Clipboard copy failed.');
      });
  }

  function updateActions() {
    var hasFiles = files.length > 0;
    els.convertCurrent.disabled = !hasFiles;
    els.convertAll.disabled = !hasFiles;
    els.downloadCurrent.disabled = currentOutputs.length === 0;
    els.copyMarkup.disabled = currentOutputs.length === 0;
    els.downloadZip.disabled = !zipOutput;
  }

  function updateStats(outputs) {
    var sourceBytes = files.reduce(function (sum, record) { return sum + record.size; }, 0);
    var outputBytes = outputs ? outputs.reduce(function (sum, output) { return sum + output.blob.size; }, 0) : 0;
    els.sourceTotal.textContent = files.length ? formatBytes(sourceBytes) : '-';
    els.outputTotal.textContent = outputBytes ? formatBytes(outputBytes) : (zipOutput ? formatBytes(zipOutput.blob.size) : '-');
    els.outputCount.textContent = outputs ? String(outputs.length) : (zipOutput ? 'Zip ready' : '-');
    if (sourceBytes && outputBytes) {
      var savings = Math.round((1 - outputBytes / sourceBytes) * 100);
      els.savings.textContent = savings > 0 ? savings + '% smaller' : savings < 0 ? Math.abs(savings) + '% larger' : 'same size';
    } else {
      els.savings.textContent = '-';
    }
  }

  function collectSettings() {
    return {
      preset: activePreset || 'custom',
      formats: getSelectedFormats(),
      quality: Number(els.quality.value || 80),
      scalePercent: Number(els.scale.value || 100),
      maxWidth: els.maxWidth.value || '',
      maxHeight: els.maxHeight.value || '',
      background: els.background.value,
      suffix: els.suffix.value
    };
  }

  function revokeOutputs() {
    currentOutputs.forEach(function (output) {
      if (output.url) URL.revokeObjectURL(output.url);
    });
    currentOutputs = [];
  }

  function revokeZip() {
    if (zipOutput && zipOutput.url) URL.revokeObjectURL(zipOutput.url);
    zipOutput = null;
  }

  function getFormat(mime) {
    return FORMATS.find(function (format) { return format.mime === mime; }) || FORMATS[0];
  }

  function buildOutputName(originalName, ext) {
    var base = cleanName(String(originalName || 'image').replace(/\.[^.]+$/, ''));
    var suffix = cleanName(els.suffix.value || 'converted');
    return base + '-' + suffix + '.' + ext;
  }

  function cleanName(value) {
    return String(value || 'image')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'image';
  }

  function downloadUrl(url, name) {
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  function setStatus(message) {
    els.status.textContent = message;
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

  function clamp(value, min, max) {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
