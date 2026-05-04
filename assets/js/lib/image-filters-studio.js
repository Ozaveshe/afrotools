(function () {
  'use strict';

  var SETTINGS_KEY = 'afro_image_filters_settings_v2';
  var HISTORY_KEY = 'afro_image_filters_history_v1';

  var FORMAT_OPTIONS = [
    { mime: 'image/jpeg', label: 'JPG', ext: 'jpg', lossy: true },
    { mime: 'image/png', label: 'PNG', ext: 'png', lossy: false },
    { mime: 'image/webp', label: 'WebP', ext: 'webp', lossy: true }
  ];

  var LOOKS = {
    neutral: {
      label: 'Clean photo',
      copy: 'A balanced starting point for everyday images.',
      values: { brightness: 0, contrast: 0, saturation: 0, warmth: 0, hue: 0, grayscale: 0, sepia: 0, blur: 0, sharpen: 8, vignette: 0, grain: 0 },
      guide: ['Use this before making manual edits.', 'Keeps color and contrast close to the source.', 'Good for documents, product photos, and neutral handoffs.']
    },
    market: {
      label: 'Warm market',
      copy: 'Rich warmth and color for food, fashion, and outdoor retail shots.',
      values: { brightness: 6, contrast: 12, saturation: 24, warmth: 22, hue: 0, grayscale: 0, sepia: 6, blur: 0, sharpen: 14, vignette: 10, grain: 4 },
      guide: ['Use for market stalls, food, clothing, and sunny outdoor images.', 'Adds warmth without crushing shadows.', 'Export as WebP or JPG for social posts and listings.']
    },
    dusk: {
      label: 'Cool dusk',
      copy: 'Cooler shadows and a restrained cinematic look.',
      values: { brightness: -4, contrast: 12, saturation: 8, warmth: -18, hue: -4, grayscale: 0, sepia: 0, blur: 0, sharpen: 10, vignette: 18, grain: 6 },
      guide: ['Useful for evening scenes and moody event photos.', 'The vignette keeps attention near the subject.', 'Reduce warmth if skin tones become too cool.']
    },
    vintage: {
      label: 'Vintage print',
      copy: 'Soft contrast, sepia, light grain, and edge falloff.',
      values: { brightness: 4, contrast: -8, saturation: -12, warmth: 26, hue: 0, grayscale: 0, sepia: 30, blur: 0, sharpen: 6, vignette: 22, grain: 14 },
      guide: ['Good for heritage, music, event, and editorial images.', 'Uses grain and sepia, so keep quality above 80 percent.', 'Avoid this for ID, product accuracy, or legal documents.']
    },
    mono: {
      label: 'Mono newsprint',
      copy: 'Strong black-and-white contrast for editorial use.',
      values: { brightness: 2, contrast: 24, saturation: -100, warmth: 0, hue: 0, grayscale: 100, sepia: 0, blur: 0, sharpen: 20, vignette: 15, grain: 10 },
      guide: ['Works well for portraits and documentary-style photos.', 'High contrast can hide shadow detail.', 'Use PNG when you need crisp text or linework.']
    },
    portrait: {
      label: 'Soft portrait',
      copy: 'A gentler correction for profile photos and people.',
      values: { brightness: 8, contrast: -4, saturation: 8, warmth: 12, hue: 0, grayscale: 0, sepia: 0, blur: 0, sharpen: 4, vignette: 8, grain: 0 },
      guide: ['Keeps skin tones warmer and less harsh.', 'Use light sharpening for profile and team photos.', 'Pair with the crop tool for square or passport output.']
    },
    product: {
      label: 'Product clarity',
      copy: 'Sharper, brighter output for listings, catalogs, and shop images.',
      values: { brightness: 10, contrast: 18, saturation: 12, warmth: 3, hue: 0, grayscale: 0, sepia: 0, blur: 0, sharpen: 28, vignette: 0, grain: 0 },
      guide: ['Best for marketplace, product, and menu images.', 'Keeps edges crisp and backgrounds clean.', 'Use a JPG background color when the source has transparency.']
    },
    food: {
      label: 'Food pop',
      copy: 'Punchy color and warmth for meals, menus, and recipe photos.',
      values: { brightness: 8, contrast: 14, saturation: 34, warmth: 16, hue: 0, grayscale: 0, sepia: 0, blur: 0, sharpen: 18, vignette: 6, grain: 2 },
      guide: ['Designed for food, drinks, and hospitality photos.', 'Saturation is intentionally higher, so check reds and greens.', 'Use WebP for fast web menus and recipe pages.']
    },
    document: {
      label: 'Document scan',
      copy: 'High contrast monochrome output for receipts and text captures.',
      values: { brightness: 18, contrast: 42, saturation: -100, warmth: 0, hue: 0, grayscale: 100, sepia: 0, blur: 0, sharpen: 36, vignette: 0, grain: 0 },
      guide: ['Useful for receipts, handwritten notes, and scanned forms.', 'High contrast can remove faint marks.', 'Use PNG when the destination accepts larger files.']
    }
  };

  var DEFAULT_SETTINGS = {
    look: 'product',
    format: 'image/jpeg',
    quality: 86,
    maxWidth: '',
    maxHeight: '',
    background: '#ffffff',
    suffix: 'filtered',
    values: LOOKS.product.values
  };

  var els = {};
  var controls = {};
  var records = [];
  var currentIndex = 0;
  var activeLook = DEFAULT_SETTINGS.look;
  var renderTimer = 0;
  var history = [];
  var encoderSupport = {};
  var filterSupport = true;
  var currentExport = null;
  var batchExport = null;

  function init() {
    cacheElements();
    if (!els.input || !els.drop || !els.previewCanvas) {
      return;
    }

    filterSupport = detectFilterSupport();
    loadSettings();
    loadHistory();
    bindEvents();
    renderHistory();
    updateRangeLabels();
    updateActiveLook();
    updateGuide();
    updateStats();
    updateButtons();
    setCompare();
    renderEmptyPreview();
    setStatus('Checking browser image encoders...');
    probeEncoders().then(function () {
      updateSupportList();
      updateFormatSupport();
      saveSettings();
      setStatus('Ready. Drop, paste, or choose photos to filter locally.');
    });
  }

  function cacheElements() {
    els.status = byId('filtersStatus');
    els.drop = byId('filtersDropZone');
    els.input = byId('filtersInput');
    els.queue = byId('filtersQueue');
    els.lookButtons = Array.prototype.slice.call(document.querySelectorAll('[data-filters-look]'));
    els.controlInputs = Array.prototype.slice.call(document.querySelectorAll('[data-filter-control]'));
    els.format = byId('filtersFormat');
    els.quality = byId('filtersQuality');
    els.qualityValue = byId('filtersQualityValue');
    els.maxWidth = byId('filtersMaxWidth');
    els.maxHeight = byId('filtersMaxHeight');
    els.background = byId('filtersBackground');
    els.suffix = byId('filtersSuffix');
    els.compareRange = byId('filtersCompareRange');
    els.compareFrame = byId('filtersCompareFrame');
    els.originalImage = byId('filtersOriginalImage');
    els.previewCanvas = byId('filtersPreviewCanvas');
    els.previewEmpty = byId('filtersPreviewEmpty');
    els.exportCurrent = byId('filtersExportCurrent');
    els.downloadCurrent = byId('filtersDownloadCurrent');
    els.buildBatch = byId('filtersBuildBatch');
    els.downloadBatch = byId('filtersDownloadBatch');
    els.copyRecipe = byId('filtersCopyRecipe');
    els.reset = byId('filtersReset');
    els.sourceTotal = byId('filtersSourceTotal');
    els.outputSize = byId('filtersOutputSize');
    els.recipeName = byId('filtersRecipeName');
    els.lastExport = byId('filtersLastExport');
    els.supportList = byId('filtersSupportList');
    els.historyList = byId('filtersHistoryList');
    els.guideTitle = byId('filtersGuideTitle');
    els.guideIntro = byId('filtersGuideIntro');
    els.guideList = byId('filtersGuideList');

    els.controlInputs.forEach(function (input) {
      controls[input.dataset.filterControl] = input;
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
      acceptFiles(event.dataTransfer.files);
    });
    document.addEventListener('paste', function (event) {
      if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length) {
        acceptFiles(event.clipboardData.files);
      }
    });
    els.input.addEventListener('change', function () {
      acceptFiles(els.input.files);
    });
    els.queue.addEventListener('click', function (event) {
      var item = event.target.closest('[data-filters-index]');
      if (!item) {
        return;
      }
      currentIndex = Number(item.dataset.filtersIndex);
      renderQueue();
      schedulePreview();
      setStatus('Previewing ' + records[currentIndex].name + '.');
    });
    els.lookButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        applyLook(button.dataset.filtersLook, true);
      });
    });
    els.controlInputs.forEach(function (input) {
      input.addEventListener('input', function () {
        activeLook = 'custom';
        handleSettingsChanged('Custom recipe updated.');
      });
    });
    [els.format, els.maxWidth, els.maxHeight, els.background, els.suffix].forEach(function (input) {
      input.addEventListener('input', function () {
        handleSettingsChanged('Output settings updated.');
      });
    });
    els.quality.addEventListener('input', function () {
      handleSettingsChanged('Output quality updated.');
    });
    els.compareRange.addEventListener('input', setCompare);
    els.exportCurrent.addEventListener('click', exportCurrent);
    els.downloadCurrent.addEventListener('click', downloadCurrent);
    els.buildBatch.addEventListener('click', buildBatchZip);
    els.downloadBatch.addEventListener('click', downloadBatch);
    els.copyRecipe.addEventListener('click', copyRecipe);
    els.reset.addEventListener('click', function () {
      applyLook('neutral', true);
    });
    window.addEventListener('beforeunload', function () {
      clearExports();
      records.forEach(function (record) {
        if (record.previewUrl) {
          URL.revokeObjectURL(record.previewUrl);
        }
      });
    });
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function detectFilterSupport() {
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      return !!ctx && 'filter' in ctx;
    } catch (error) {
      return false;
    }
  }

  function probeEncoders() {
    return Promise.all(FORMAT_OPTIONS.map(function (format) {
      return canEncode(format.mime).then(function (supported) {
        encoderSupport[format.mime] = supported;
      });
    }));
  }

  function canEncode(mime) {
    return new Promise(function (resolve) {
      try {
        var canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 2;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0f766e';
        ctx.fillRect(0, 0, 2, 2);
        canvas.toBlob(function (blob) {
          resolve(!!blob && (mime === 'image/png' ? blob.type === 'image/png' : blob.type === mime));
        }, mime, 0.82);
      } catch (error) {
        resolve(false);
      }
    });
  }

  function updateSupportList() {
    var rows = [
      '<div class="filters-support-row"><strong>Canvas filter stack</strong><span>' + (filterSupport ? 'Supported' : 'Basic fallback') + '</span></div>'
    ];
    FORMAT_OPTIONS.forEach(function (format) {
      rows.push('<div class="filters-support-row"><strong>' + esc(format.label) + ' export</strong><span>' + (encoderSupport[format.mime] ? 'Supported' : 'Not available') + '</span></div>');
    });
    els.supportList.innerHTML = rows.join('');
  }

  function updateFormatSupport() {
    Array.prototype.slice.call(els.format.options).forEach(function (option) {
      option.disabled = !encoderSupport[option.value];
    });
    if (!encoderSupport[els.format.value]) {
      var fallback = FORMAT_OPTIONS.find(function (format) {
        return encoderSupport[format.mime];
      });
      els.format.value = fallback ? fallback.mime : 'image/png';
    }
  }

  function loadSettings() {
    var settings = DEFAULT_SETTINGS;
    try {
      var stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (stored && typeof stored === 'object') {
        settings = Object.assign({}, DEFAULT_SETTINGS, stored);
        settings.values = Object.assign({}, DEFAULT_SETTINGS.values, stored.values || {});
      }
    } catch (error) {
      settings = DEFAULT_SETTINGS;
    }

    activeLook = settings.look || DEFAULT_SETTINGS.look;
    Object.keys(controls).forEach(function (key) {
      if (settings.values[key] !== undefined) {
        controls[key].value = settings.values[key];
      }
    });
    els.format.value = settings.format || DEFAULT_SETTINGS.format;
    els.quality.value = settings.quality || DEFAULT_SETTINGS.quality;
    els.maxWidth.value = settings.maxWidth || '';
    els.maxHeight.value = settings.maxHeight || '';
    els.background.value = settings.background || DEFAULT_SETTINGS.background;
    els.suffix.value = settings.suffix || DEFAULT_SETTINGS.suffix;
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(getSettings()));
    } catch (error) {
      /* localStorage can be unavailable in private or restricted contexts. */
    }
  }

  function loadHistory() {
    try {
      history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      if (!Array.isArray(history)) {
        history = [];
      }
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
      /* localStorage can be unavailable in private or restricted contexts. */
    }
    renderHistory();
  }

  function renderHistory() {
    if (!history.length) {
      els.historyList.innerHTML = '<div class="filters-history-item">Recent filter exports will appear here.</div>';
      return;
    }
    els.historyList.innerHTML = history.map(function (item) {
      return '<div class="filters-history-item"><strong>' + esc(item.label) + '</strong><br>' + esc(item.details) + '</div>';
    }).join('');
  }

  function getSettings() {
    var values = {};
    Object.keys(controls).forEach(function (key) {
      values[key] = Number(controls[key].value || 0);
    });
    return {
      look: activeLook,
      format: els.format.value,
      quality: Number(els.quality.value || 86),
      maxWidth: els.maxWidth.value,
      maxHeight: els.maxHeight.value,
      background: els.background.value || '#ffffff',
      suffix: els.suffix.value || 'filtered',
      values: values
    };
  }

  function applyLook(name, announce) {
    var look = LOOKS[name] || LOOKS.neutral;
    activeLook = LOOKS[name] ? name : 'neutral';
    Object.keys(look.values).forEach(function (key) {
      if (controls[key]) {
        controls[key].value = look.values[key];
      }
    });
    if (activeLook !== 'neutral') {
      els.suffix.value = slug(activeLook);
    }
    handleSettingsChanged(look.label + ' look applied.', announce !== false);
  }

  function handleSettingsChanged(message, announce) {
    updateRangeLabels();
    updateActiveLook();
    updateGuide();
    saveSettings();
    clearExports();
    updateStats();
    updateButtons();
    schedulePreview();
    if (announce) {
      setStatus(message);
    }
  }

  function updateRangeLabels() {
    Object.keys(controls).forEach(function (key) {
      var value = Number(controls[key].value || 0);
      var label = byId('filters' + capitalize(key) + 'Value');
      if (!label) {
        return;
      }
      if (key === 'blur') {
        label.textContent = value.toFixed(1).replace(/\.0$/, '') + ' px';
      } else if (key === 'hue') {
        label.textContent = value + ' deg';
      } else {
        label.textContent = value > 0 ? '+' + value : String(value);
      }
    });
    els.qualityValue.textContent = els.quality.value + '%';
  }

  function updateActiveLook() {
    els.lookButtons.forEach(function (button) {
      var active = button.dataset.filtersLook === activeLook;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateGuide() {
    var look = LOOKS[activeLook];
    if (look) {
      els.guideTitle.textContent = look.label;
      els.guideIntro.textContent = look.copy;
      els.guideList.innerHTML = look.guide.map(function (line) {
        return '<li>' + esc(line) + '</li>';
      }).join('');
      return;
    }
    els.guideTitle.textContent = 'Custom recipe';
    els.guideIntro.textContent = 'Your current sliders create a reusable local filter recipe.';
    els.guideList.innerHTML = ['Copy the recipe for repeat work across devices or teammates.', 'Export one image first to confirm color and sharpness.', 'Use batch zip after the first preview looks right.'].map(function (line) {
      return '<li>' + line + '</li>';
    }).join('');
  }

  function acceptFiles(fileList) {
    var files = Array.prototype.slice.call(fileList || []).filter(isImageFile);
    if (!files.length) {
      setStatus('Choose JPG, PNG, WebP, AVIF, SVG, GIF, or other browser-supported image files.');
      return;
    }
    records.forEach(function (record) {
      if (record.previewUrl) {
        URL.revokeObjectURL(record.previewUrl);
      }
    });
    records = files.map(function (file, index) {
      return {
        id: Date.now() + '-' + index,
        file: file,
        name: file.name || 'image-' + (index + 1),
        size: file.size || 0,
        type: file.type || guessMime(file.name),
        previewUrl: URL.createObjectURL(file),
        image: null,
        width: 0,
        height: 0,
        error: ''
      };
    });
    currentIndex = 0;
    clearExports();
    renderQueue();
    updateStats();
    updateButtons();
    schedulePreview();
    setStatus(records.length + ' image' + (records.length === 1 ? '' : 's') + ' ready for filters.');
  }

  function isImageFile(file) {
    return !!file && ((file.type && file.type.indexOf('image/') === 0) || /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic|heif)$/i.test(file.name || ''));
  }

  function guessMime(name) {
    var ext = String(name || '').split('.').pop().toLowerCase();
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'avif') return 'image/avif';
    if (ext === 'svg') return 'image/svg+xml';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'bmp') return 'image/bmp';
    return 'image';
  }

  function renderQueue() {
    if (!records.length) {
      els.queue.innerHTML = '';
      return;
    }
    els.queue.innerHTML = records.map(function (record, index) {
      return '<button class="filters-file ' + (index === currentIndex ? 'active' : '') + '" type="button" data-filters-index="' + index + '"><span>' + esc(record.name) + '</span><small>' + formatBytes(record.size) + '</small></button>';
    }).join('');
  }

  function loadRecord(record) {
    if (record.image) {
      return Promise.resolve(record);
    }
    if (window.createImageBitmap) {
      return createImageBitmap(record.file, { imageOrientation: 'from-image' }).then(function (bitmap) {
        record.image = bitmap;
        record.width = bitmap.width;
        record.height = bitmap.height;
        return record;
      }).catch(function () {
        return loadRecordWithImage(record);
      });
    }
    return loadRecordWithImage(record);
  }

  function loadRecordWithImage(record) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        record.image = img;
        record.width = img.naturalWidth || img.width;
        record.height = img.naturalHeight || img.height;
        resolve(record);
      };
      img.onerror = function () {
        record.error = 'This browser could not decode the image.';
        reject(new Error(record.error));
      };
      img.src = record.previewUrl;
    });
  }

  function schedulePreview() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(renderPreview, 70);
  }

  function renderPreview() {
    var record = records[currentIndex];
    if (!record) {
      renderEmptyPreview();
      return;
    }
    loadRecord(record).then(function () {
      els.originalImage.src = record.previewUrl;
      els.originalImage.alt = record.name;
      els.originalImage.hidden = false;
      els.previewCanvas.hidden = false;
      els.previewEmpty.hidden = true;
      els.compareFrame.classList.add('ready');
      els.compareFrame.style.setProperty('--preview-ratio', record.width + ' / ' + record.height);
      return drawFilteredCanvas(record, els.previewCanvas, { preview: true, flatten: false });
    }).then(function () {
      updateStats();
      updateButtons();
    }).catch(function () {
      renderEmptyPreview('This source could not be decoded in this browser.');
      setStatus('Preview failed. Try a different image format.');
    });
  }

  function renderEmptyPreview(message) {
    els.originalImage.hidden = true;
    els.previewCanvas.hidden = true;
    els.previewEmpty.hidden = false;
    els.previewEmpty.textContent = message || 'Upload an image to compare the original and edited result.';
    els.compareFrame.classList.remove('ready');
  }

  function drawFilteredCanvas(record, canvas, options) {
    options = options || {};
    return loadRecord(record).then(function () {
      var settings = getSettings();
      var dims = options.preview ? fitDimensions(record.width, record.height, 1100, 760) : getOutputDimensions(record, settings);
      canvas.width = dims.width;
      canvas.height = dims.height;
      var ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.clearRect(0, 0, dims.width, dims.height);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (options.flatten || settings.format === 'image/jpeg') {
        ctx.fillStyle = settings.background || '#ffffff';
        ctx.fillRect(0, 0, dims.width, dims.height);
      }

      if (filterSupport) {
        ctx.filter = buildFilter(settings.values);
      }
      ctx.drawImage(record.image, 0, 0, dims.width, dims.height);
      if (filterSupport) {
        ctx.filter = 'none';
      }

      applyWarmth(ctx, dims.width, dims.height, settings.values.warmth);
      applySharpen(ctx, dims.width, dims.height, settings.values.sharpen);
      applyGrain(ctx, dims.width, dims.height, settings.values.grain);
      applyVignette(ctx, dims.width, dims.height, settings.values.vignette);
      return dims;
    });
  }

  function buildFilter(values) {
    var brightness = clamp(100 + Number(values.brightness || 0), 20, 180);
    var contrast = clamp(100 + Number(values.contrast || 0), 20, 210);
    var saturate = clamp(100 + Number(values.saturation || 0), 0, 260);
    var grayscale = clamp(Number(values.grayscale || 0), 0, 100);
    var sepia = clamp(Number(values.sepia || 0), 0, 100);
    var hue = clamp(Number(values.hue || 0), -180, 180);
    var blur = clamp(Number(values.blur || 0), 0, 8);
    return [
      'brightness(' + brightness + '%)',
      'contrast(' + contrast + '%)',
      'saturate(' + saturate + '%)',
      'grayscale(' + grayscale + '%)',
      'sepia(' + sepia + '%)',
      'hue-rotate(' + hue + 'deg)',
      'blur(' + blur + 'px)'
    ].join(' ');
  }

  function applyWarmth(ctx, width, height, warmth) {
    warmth = clamp(Number(warmth || 0), -50, 50);
    if (!warmth) {
      return;
    }
    var alpha = Math.abs(warmth) / 50 * 0.22;
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = warmth > 0 ? 'rgba(245, 124, 48, ' + alpha.toFixed(3) + ')' : 'rgba(37, 99, 235, ' + alpha.toFixed(3) + ')';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function applyVignette(ctx, width, height, amount) {
    amount = clamp(Number(amount || 0), 0, 80);
    if (!amount) {
      return;
    }
    var radius = Math.max(width, height) * 0.72;
    var gradient = ctx.createRadialGradient(width / 2, height / 2, radius * 0.12, width / 2, height / 2, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, ' + (amount / 80 * 0.55).toFixed(3) + ')');
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function applyGrain(ctx, width, height, amount) {
    amount = clamp(Number(amount || 0), 0, 40);
    if (!amount) {
      return;
    }
    var imageData;
    try {
      imageData = ctx.getImageData(0, 0, width, height);
    } catch (error) {
      return;
    }
    var data = imageData.data;
    var strength = amount * 1.8;
    for (var i = 0; i < data.length; i += 4) {
      var noise = (Math.random() - 0.5) * strength;
      data[i] = clamp(data[i] + noise, 0, 255);
      data[i + 1] = clamp(data[i + 1] + noise, 0, 255);
      data[i + 2] = clamp(data[i + 2] + noise, 0, 255);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function applySharpen(ctx, width, height, amount) {
    amount = clamp(Number(amount || 0), 0, 80);
    if (!amount || width < 3 || height < 3) {
      return;
    }
    var imageData;
    try {
      imageData = ctx.getImageData(0, 0, width, height);
    } catch (error) {
      return;
    }
    var src = imageData.data;
    var out = ctx.createImageData(width, height);
    var dst = out.data;
    dst.set(src);
    var weight = amount / 100;
    var center = 1 + 4 * weight;
    var side = -weight;

    for (var y = 1; y < height - 1; y += 1) {
      for (var x = 1; x < width - 1; x += 1) {
        var idx = (y * width + x) * 4;
        var top = ((y - 1) * width + x) * 4;
        var bottom = ((y + 1) * width + x) * 4;
        var left = (y * width + x - 1) * 4;
        var right = (y * width + x + 1) * 4;
        for (var c = 0; c < 3; c += 1) {
          dst[idx + c] = clamp(src[idx + c] * center + src[top + c] * side + src[bottom + c] * side + src[left + c] * side + src[right + c] * side, 0, 255);
        }
      }
    }
    ctx.putImageData(out, 0, 0);
  }

  function getOutputDimensions(record, settings) {
    var width = record.width;
    var height = record.height;
    var maxWidth = Number(settings.maxWidth || 0);
    var maxHeight = Number(settings.maxHeight || 0);
    var scale = 1;
    if (maxWidth > 0 && width > maxWidth) {
      scale = Math.min(scale, maxWidth / width);
    }
    if (maxHeight > 0 && height > maxHeight) {
      scale = Math.min(scale, maxHeight / height);
    }
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }

  function fitDimensions(width, height, maxWidth, maxHeight) {
    var scale = Math.min(1, maxWidth / width, maxHeight / height);
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }

  function exportCurrent() {
    var record = records[currentIndex];
    if (!record) {
      setStatus('Upload an image first.');
      return;
    }
    clearCurrentExport();
    setStatus('Rendering current image...');
    exportRecord(record).then(function (result) {
      currentExport = result;
      currentExport.url = URL.createObjectURL(result.blob);
      saveHistory({
        label: 'Current image export',
        details: recipeLabel() + ' | ' + formatDimensions(result.width, result.height) + ' | ' + formatBytes(result.blob.size)
      });
      updateStats(result);
      updateButtons();
      setStatus('Current filtered image is ready to download.');
    }).catch(function (error) {
      setStatus(error.message || 'Export failed. Try another format.');
      updateButtons();
    });
  }

  function exportRecord(record) {
    var settings = getSettings();
    var canvas = document.createElement('canvas');
    return drawFilteredCanvas(record, canvas, { preview: false, flatten: settings.format === 'image/jpeg' }).then(function (dims) {
      return new Promise(function (resolve, reject) {
        canvas.toBlob(function (blob) {
          if (!blob) {
            reject(new Error('This browser could not export the selected format.'));
            return;
          }
          var format = getFormat(settings.format);
          if (settings.format !== 'image/png' && blob.type !== settings.format) {
            reject(new Error(format.label + ' export is not available in this browser.'));
            return;
          }
          resolve({
            record: record,
            blob: blob,
            mime: settings.format,
            ext: format.ext,
            label: format.label,
            width: dims.width,
            height: dims.height,
            name: buildFileName(record.name, format.ext, settings.suffix)
          });
        }, settings.format, settings.quality / 100);
      });
    });
  }

  function buildBatchZip() {
    if (!records.length) {
      setStatus('Upload images before building a batch.');
      return;
    }
    if (!window.JSZip) {
      setStatus('Zip packaging is not available on this page.');
      return;
    }
    clearBatchExport();
    updateButtons();
    var zip = new JSZip();
    var settings = getSettings();
    var manifest = {
      tool: 'AfroTools Photo Filter Studio',
      createdAt: new Date().toISOString(),
      settings: settings,
      files: []
    };
    var chain = Promise.resolve();
    records.forEach(function (record, index) {
      chain = chain.then(function () {
        setStatus('Filtering ' + (index + 1) + ' of ' + records.length + '...');
        return exportRecord(record).then(function (result) {
          zip.file(result.name, result.blob);
          manifest.files.push({
            source: record.name,
            sourceBytes: record.size,
            sourceDimensions: record.width + 'x' + record.height,
            output: result.name,
            outputBytes: result.blob.size,
            outputDimensions: result.width + 'x' + result.height,
            type: result.mime
          });
        });
      });
    });
    chain.then(function () {
      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      return zip.generateAsync({ type: 'blob' });
    }).then(function (blob) {
      batchExport = {
        blob: blob,
        url: URL.createObjectURL(blob),
        name: 'afrotools-filter-pack-' + Date.now() + '.zip'
      };
      saveHistory({
        label: 'Batch filter zip',
        details: records.length + ' image' + (records.length === 1 ? '' : 's') + ' | ' + recipeLabel() + ' | ' + formatBytes(blob.size)
      });
      els.lastExport.textContent = formatBytes(blob.size);
      updateButtons();
      setStatus('Batch filter zip is ready.');
    }).catch(function (error) {
      setStatus(error.message || 'Batch export failed.');
      updateButtons();
    });
  }

  function downloadCurrent() {
    if (currentExport && currentExport.url) {
      downloadUrl(currentExport.url, currentExport.name);
    }
  }

  function downloadBatch() {
    if (batchExport && batchExport.url) {
      downloadUrl(batchExport.url, batchExport.name);
    }
  }

  function copyRecipe() {
    var record = records[currentIndex];
    var settings = getSettings();
    var payload = {
      tool: 'AfroTools Photo Filter Studio',
      look: recipeLabel(),
      source: record ? { name: record.name, dimensions: record.width + 'x' + record.height } : null,
      settings: settings
    };
    var text = JSON.stringify(payload, null, 2);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setStatus('Filter recipe copied.');
      }).catch(function () {
        setStatus('Clipboard copy failed.');
      });
    } else {
      setStatus('Clipboard is not available in this browser.');
    }
  }

  function updateButtons() {
    var hasRecords = records.length > 0;
    els.exportCurrent.disabled = !hasRecords;
    els.buildBatch.disabled = !hasRecords;
    els.copyRecipe.disabled = !hasRecords;
    els.downloadCurrent.disabled = !currentExport;
    els.downloadBatch.disabled = !batchExport;
  }

  function updateStats(latest) {
    var sourceBytes = records.reduce(function (sum, record) {
      return sum + (record.size || 0);
    }, 0);
    var record = records[currentIndex];
    var settings = getSettings();
    els.sourceTotal.textContent = records.length ? records.length + ' file' + (records.length === 1 ? '' : 's') + ' / ' + formatBytes(sourceBytes) : '-';
    if (latest) {
      els.outputSize.textContent = formatDimensions(latest.width, latest.height);
      els.lastExport.textContent = formatBytes(latest.blob.size);
    } else if (record && record.width && record.height) {
      var dims = getOutputDimensions(record, settings);
      els.outputSize.textContent = formatDimensions(dims.width, dims.height);
    } else {
      els.outputSize.textContent = '-';
    }
    els.recipeName.textContent = recipeLabel();
    if (!latest && !batchExport) {
      els.lastExport.textContent = currentExport ? formatBytes(currentExport.blob.size) : '-';
    }
  }

  function clearExports() {
    clearCurrentExport();
    clearBatchExport();
  }

  function clearCurrentExport() {
    if (currentExport && currentExport.url) {
      URL.revokeObjectURL(currentExport.url);
    }
    currentExport = null;
  }

  function clearBatchExport() {
    if (batchExport && batchExport.url) {
      URL.revokeObjectURL(batchExport.url);
    }
    batchExport = null;
  }

  function setCompare() {
    var value = Number(els.compareRange.value || 50);
    els.compareFrame.style.setProperty('--compare', clamp(value, 0, 100) + '%');
  }

  function recipeLabel() {
    return LOOKS[activeLook] ? LOOKS[activeLook].label : 'Custom recipe';
  }

  function getFormat(mime) {
    return FORMAT_OPTIONS.find(function (format) {
      return format.mime === mime;
    }) || FORMAT_OPTIONS[0];
  }

  function buildFileName(name, ext, suffix) {
    var base = slug(String(name || 'image').replace(/\.[^.]+$/, ''));
    var cleanSuffix = slug(suffix || 'filtered');
    return base + '-' + cleanSuffix + '.' + ext;
  }

  function downloadUrl(url, name) {
    var link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function capitalize(value) {
    return String(value).charAt(0).toUpperCase() + String(value).slice(1);
  }

  function clamp(value, min, max) {
    value = Number(value);
    if (Number.isNaN(value)) {
      value = min;
    }
    return Math.min(max, Math.max(min, value));
  }

  function slug(value) {
    return String(value || 'image')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 70) || 'image';
  }

  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) {
      return '-';
    }
    if (bytes < 1024) {
      return bytes + ' B';
    }
    if (bytes < 1048576) {
      return (bytes / 1024).toFixed(1) + ' KB';
    }
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function formatDimensions(width, height) {
    return Math.round(width).toLocaleString() + ' x ' + Math.round(height).toLocaleString() + ' px';
  }

  function esc(value) {
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
