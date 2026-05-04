(function () {
  'use strict';

  var SETTINGS_KEY = 'afro_image_to_text_settings_v2';
  var HISTORY_KEY = 'afro_image_to_text_history_v1';
  var CHECK_KEY = 'afro_image_to_text_checklist_v1';
  var MAX_WORKING_SIDE = 2200;
  var MAX_PREPARED_SIDE = 3200;
  var MAX_HISTORY = 10;
  var TESSERACT_SRC = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';

  var PRESETS = {
    receipt: {
      label: 'Receipt',
      language: 'eng',
      view: 'fields',
      grayscale: true,
      invert: false,
      contrast: 34,
      threshold: 150,
      scale: 1.5,
      suffix: 'receipt-ocr'
    },
    school: {
      label: 'School notice',
      language: 'eng',
      view: 'lines',
      grayscale: true,
      invert: false,
      contrast: 18,
      threshold: 0,
      scale: 1,
      suffix: 'school-notice-ocr'
    },
    invoice: {
      label: 'Invoice',
      language: 'eng',
      view: 'fields',
      grayscale: true,
      invert: false,
      contrast: 28,
      threshold: 130,
      scale: 1.5,
      suffix: 'invoice-ocr'
    },
    multilingual: {
      label: 'Multilingual',
      language: 'eng+fra',
      view: 'clean',
      grayscale: true,
      invert: false,
      contrast: 18,
      threshold: 0,
      scale: 1,
      suffix: 'multilingual-ocr'
    },
    signage: {
      label: 'Sign or menu',
      language: 'eng+swa',
      view: 'clean',
      grayscale: false,
      invert: false,
      contrast: 26,
      threshold: 0,
      scale: 1.5,
      suffix: 'signage-ocr'
    }
  };

  var LANGUAGE_LABELS = {
    eng: 'English',
    fra: 'French',
    ara: 'Arabic',
    swa: 'Swahili',
    por: 'Portuguese',
    amh: 'Amharic',
    'eng+fra': 'English + French',
    'eng+swa': 'English + Swahili',
    'eng+ara': 'English + Arabic',
    'fra+ara': 'French + Arabic'
  };

  var VIEW_LABELS = {
    clean: 'Clean text',
    raw: 'Raw OCR',
    lines: 'Line list',
    fields: 'Structured fields',
    markdown: 'Markdown notes'
  };

  var els = {};
  var state = {
    preset: 'receipt',
    language: 'eng',
    view: 'fields',
    rotate: 0,
    scale: 1.5,
    grayscale: true,
    invert: false,
    contrast: 34,
    threshold: 150,
    suffix: 'receipt-ocr'
  };
  var queue = [];
  var activeQueueIndex = -1;
  var sourceRecord = null;
  var currentResult = null;
  var history = [];
  var tesseractLoading = null;

  function init() {
    cacheElements();
    if (!els.input || !els.textArea) return;
    loadSettings();
    loadHistory();
    loadChecklist();
    applyStateToControls();
    bindEvents();
    renderQueue();
    renderHistory();
    renderFields(null);
    updateStats();
    updateButtons();
    saveSettings();
    setStatus('Ready. Add an image, choose a language, then extract text.');
  }

  function cacheElements() {
    els.status = document.getElementById('ocrStatus');
    els.dropZone = document.getElementById('ocrDropZone');
    els.input = document.getElementById('ocrInput');
    els.queue = document.getElementById('ocrQueue');
    els.presetButtons = Array.prototype.slice.call(document.querySelectorAll('[data-ocr-preset]'));
    els.language = document.getElementById('ocrLanguage');
    els.view = document.getElementById('ocrView');
    els.rotate = document.getElementById('ocrRotate');
    els.scale = document.getElementById('ocrScale');
    els.grayscale = document.getElementById('ocrGrayscale');
    els.invert = document.getElementById('ocrInvert');
    els.contrast = document.getElementById('ocrContrast');
    els.contrastValue = document.getElementById('ocrContrastValue');
    els.threshold = document.getElementById('ocrThreshold');
    els.thresholdValue = document.getElementById('ocrThresholdValue');
    els.originalCanvas = document.getElementById('ocrOriginalCanvas');
    els.preparedCanvas = document.getElementById('ocrPreparedCanvas');
    els.originalEmpty = document.getElementById('ocrOriginalEmpty');
    els.preparedEmpty = document.getElementById('ocrPreparedEmpty');
    els.originalMeta = document.getElementById('ocrOriginalMeta');
    els.preparedMeta = document.getElementById('ocrPreparedMeta');
    els.run = document.getElementById('ocrRunBtn');
    els.batch = document.getElementById('ocrBatchBtn');
    els.resetImage = document.getElementById('ocrResetImageBtn');
    els.progress = document.getElementById('ocrProgress');
    els.progressFill = document.getElementById('ocrProgressFill');
    els.progressText = document.getElementById('ocrProgressText');
    els.viewButtons = Array.prototype.slice.call(document.querySelectorAll('[data-ocr-view]'));
    els.find = document.getElementById('ocrFind');
    els.textArea = document.getElementById('ocrTextArea');
    els.copy = document.getElementById('ocrCopyBtn');
    els.txt = document.getElementById('ocrDownloadTxtBtn');
    els.md = document.getElementById('ocrDownloadMdBtn');
    els.json = document.getElementById('ocrDownloadJsonBtn');
    els.csv = document.getElementById('ocrDownloadCsvBtn');
    els.copyBrief = document.getElementById('ocrCopyBriefBtn');
    els.sourceStat = document.getElementById('ocrSourceStat');
    els.confidenceStat = document.getElementById('ocrConfidenceStat');
    els.textStat = document.getElementById('ocrTextStat');
    els.languageStat = document.getElementById('ocrLanguageStat');
    els.fieldsList = document.getElementById('ocrFieldsList');
    els.checks = Array.prototype.slice.call(document.querySelectorAll('[data-ocr-check]'));
    els.history = document.getElementById('ocrHistoryList');
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
        applyPreset(button.getAttribute('data-ocr-preset'), true);
      });
    });
    els.language.addEventListener('change', function () {
      state.language = els.language.value;
      saveSettings();
      updateStats();
    });
    els.view.addEventListener('change', function () {
      setView(els.view.value);
    });
    els.rotate.addEventListener('change', function () {
      state.rotate = numberValue(els.rotate.value, 0);
      renderPreparedPreview();
      saveSettings();
    });
    els.scale.addEventListener('change', function () {
      state.scale = numberValue(els.scale.value, 1);
      renderPreparedPreview();
      saveSettings();
    });
    els.grayscale.addEventListener('change', function () {
      state.grayscale = !!els.grayscale.checked;
      renderPreparedPreview();
      saveSettings();
    });
    els.invert.addEventListener('change', function () {
      state.invert = !!els.invert.checked;
      renderPreparedPreview();
      saveSettings();
    });
    els.contrast.addEventListener('input', function () {
      state.contrast = numberValue(els.contrast.value, 0);
      updateControlLabels();
      renderPreparedPreview();
      saveSettings();
    });
    els.threshold.addEventListener('input', function () {
      state.threshold = numberValue(els.threshold.value, 0);
      updateControlLabels();
      renderPreparedPreview();
      saveSettings();
    });
    els.run.addEventListener('click', function () {
      runOcrForActive();
    });
    els.batch.addEventListener('click', processQueue);
    els.resetImage.addEventListener('click', function () {
      applyPreset(state.preset, false);
      setStatus('Cleanup controls reset for the current recipe.');
    });
    els.viewButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        setView(button.getAttribute('data-ocr-view'));
      });
    });
    els.find.addEventListener('input', updateFindStatus);
    els.textArea.addEventListener('input', function () {
      if (currentResult) {
        currentResult.editedText = els.textArea.value;
        currentResult.editedView = state.view;
        updateStats();
        updateButtons();
      }
    });
    els.copy.addEventListener('click', copyCurrentText);
    els.txt.addEventListener('click', function () {
      downloadText('txt');
    });
    els.md.addEventListener('click', function () {
      downloadText('md');
    });
    els.json.addEventListener('click', downloadJson);
    els.csv.addEventListener('click', downloadCsv);
    els.copyBrief.addEventListener('click', copyBrief);
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
        processed: false,
        result: null
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
    els.queue.innerHTML = '';
    queue.forEach(function (item, index) {
      var row = document.createElement('div');
      row.className = 'ocr-queue-item' + (index === activeQueueIndex ? ' active' : '');
      var meta = item.processed && item.result ? confidenceLabel(item.result.confidence) + ' OCR' : formatBytes(item.size);
      row.innerHTML = '<div><strong></strong><span></span></div><button type="button">Load</button>';
      row.querySelector('strong').textContent = item.name;
      row.querySelector('span').textContent = meta;
      row.querySelector('button').addEventListener('click', function () {
        loadQueueItem(index);
      });
      els.queue.appendChild(row);
    });
  }

  async function loadQueueItem(index) {
    var item = queue[index];
    if (!item) return;
    try {
      setStatus('Loading ' + item.name + '...');
      var loaded = await loadImageFromFile(item.file);
      activeQueueIndex = index;
      sourceRecord = {
        name: item.name,
        size: item.size,
        sourceCanvas: loaded.canvas,
        originalWidth: loaded.originalWidth,
        originalHeight: loaded.originalHeight,
        workingWidth: loaded.canvas.width,
        workingHeight: loaded.canvas.height
      };
      currentResult = item.result || null;
      drawOriginal();
      renderPreparedPreview();
      setView(state.view, true);
      renderFields(currentResult ? currentResult.fields : null);
      renderQueue();
      updateStats();
      updateButtons();
      setStatus('Loaded ' + item.name + '. Adjust cleanup or run OCR.');
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

  function buildPreparedCanvas() {
    if (!sourceRecord) return null;
    var radians = state.rotate * Math.PI / 180;
    var swap = state.rotate === 90 || state.rotate === 270;
    var baseWidth = swap ? sourceRecord.workingHeight : sourceRecord.workingWidth;
    var baseHeight = swap ? sourceRecord.workingWidth : sourceRecord.workingHeight;
    var requestedScale = Math.max(1, numberValue(state.scale, 1));
    var scale = Math.min(requestedScale, MAX_PREPARED_SIDE / Math.max(baseWidth, baseHeight));
    var canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(baseWidth * scale));
    canvas.height = Math.max(1, Math.round(baseHeight * scale));
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      sourceRecord.sourceCanvas,
      -sourceRecord.workingWidth * scale / 2,
      -sourceRecord.workingHeight * scale / 2,
      sourceRecord.workingWidth * scale,
      sourceRecord.workingHeight * scale
    );
    ctx.restore();
    applyImageCleanup(canvas);
    return canvas;
  }

  function applyImageCleanup(canvas) {
    var ctx = canvas.getContext('2d', { willReadFrequently: true });
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    var contrast = numberValue(state.contrast, 0);
    var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    var threshold = numberValue(state.threshold, 0);
    for (var index = 0; index < data.length; index += 4) {
      var r = data[index];
      var g = data[index + 1];
      var b = data[index + 2];
      if (state.grayscale) {
        var gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        r = gray;
        g = gray;
        b = gray;
      }
      r = clamp(Math.round(factor * (r - 128) + 128), 0, 255);
      g = clamp(Math.round(factor * (g - 128) + 128), 0, 255);
      b = clamp(Math.round(factor * (b - 128) + 128), 0, 255);
      if (threshold > 0) {
        var level = Math.round((r + g + b) / 3) >= threshold ? 255 : 0;
        r = level;
        g = level;
        b = level;
      }
      if (state.invert) {
        r = 255 - r;
        g = 255 - g;
        b = 255 - b;
      }
      data[index] = r;
      data[index + 1] = g;
      data[index + 2] = b;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function renderPreparedPreview() {
    if (!sourceRecord) return;
    var canvas = buildPreparedCanvas();
    if (!canvas) return;
    setCanvasSize(els.preparedCanvas, canvas.width, canvas.height);
    var ctx = els.preparedCanvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);
    els.preparedCanvas.hidden = false;
    els.preparedEmpty.hidden = true;
    els.preparedMeta.textContent = canvas.width + ' x ' + canvas.height;
    updateButtons();
  }

  async function runOcrForActive(options) {
    options = options || {};
    if (!sourceRecord) {
      setStatus('Load an image before running OCR.');
      return;
    }
    setBusy(true);
    showProgress(true);
    updateProgress(0.08, 'Preparing image...');
    try {
      var canvas = buildPreparedCanvas();
      var dataUrl = canvas.toDataURL('image/png');
      var Tesseract = await ensureTesseract();
      updateProgress(0.22, 'Loading OCR engine and language data...');
      var result = await Tesseract.recognize(dataUrl, state.language, {
        logger: function (message) {
          if (message && typeof message.progress === 'number') {
            updateProgress(message.progress, message.status || 'Recognizing text...');
          } else if (message && message.status) {
            updateProgress(null, message.status);
          }
        }
      });
      var data = result && result.data ? result.data : {};
      currentResult = makeResult(data, canvas);
      queue[activeQueueIndex].processed = true;
      queue[activeQueueIndex].result = currentResult;
      addHistory(currentResult);
      renderQueue();
      setView(state.view, true);
      renderFields(currentResult.fields);
      updateStats();
      updateButtons();
      updateProgress(1, 'OCR complete.');
      if (!options.batch) setStatus('OCR complete. Edit, copy, or export the result.');
    } catch (error) {
      setStatus('OCR engine could not run. Check your connection for the first model download, then try again.');
      updateProgress(0, 'OCR failed.');
    } finally {
      setBusy(false);
      window.setTimeout(function () {
        showProgress(false);
      }, 600);
    }
  }

  async function processQueue() {
    if (!queue.length) return;
    setBusy(true);
    var completed = 0;
    try {
      for (var index = 0; index < queue.length; index += 1) {
        await loadQueueItem(index);
        setStatus('Processing queue image ' + (index + 1) + ' of ' + queue.length + '...');
        await runOcrForActive({ batch: true });
        completed += 1;
      }
      setStatus('Processed ' + completed + ' queued image' + (completed === 1 ? '' : 's') + '.');
    } finally {
      setBusy(false);
      updateButtons();
    }
  }

  function ensureTesseract() {
    if (window.Tesseract && typeof window.Tesseract.recognize === 'function') {
      return Promise.resolve(window.Tesseract);
    }
    if (tesseractLoading) return tesseractLoading;
    tesseractLoading = loadScript(TESSERACT_SRC).then(function () {
      if (!window.Tesseract || typeof window.Tesseract.recognize !== 'function') {
        throw new Error('Tesseract unavailable');
      }
      return window.Tesseract;
    });
    return tesseractLoading;
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error('script failed'));
      };
      document.head.appendChild(script);
    });
  }

  function makeResult(data, preparedCanvas) {
    var raw = String(data.text || '');
    var words = normalizeWords(data.words);
    var fields = extractFields(raw, words);
    return {
      name: sourceRecord.name,
      language: state.language,
      languageLabel: LANGUAGE_LABELS[state.language] || state.language,
      preset: getPresetLabel(),
      rawText: raw,
      editedText: '',
      editedView: '',
      confidence: typeof data.confidence === 'number' ? data.confidence : null,
      words: words,
      fields: fields,
      chars: raw.length,
      wordsCount: countWords(raw),
      preparedWidth: preparedCanvas.width,
      preparedHeight: preparedCanvas.height,
      at: new Date().toISOString()
    };
  }

  function normalizeWords(words) {
    if (!Array.isArray(words)) return [];
    return words.slice(0, 200).map(function (word) {
      return {
        text: String(word.text || '').trim(),
        confidence: typeof word.confidence === 'number' ? word.confidence : null
      };
    }).filter(function (word) {
      return word.text;
    });
  }

  function setView(view, silent) {
    state.view = VIEW_LABELS[view] ? view : 'clean';
    els.view.value = state.view;
    els.viewButtons.forEach(function (button) {
      var active = button.getAttribute('data-ocr-view') === state.view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    els.textArea.value = currentResult ? buildViewText(state.view, currentResult) : '';
    if (!silent) saveSettings();
    updateFindStatus();
    updateButtons();
  }

  function buildViewText(view, result) {
    if (!result) return '';
    if (result.editedText && result.editedView === view) return result.editedText;
    if (view === 'raw') return result.rawText.trim();
    if (view === 'lines') {
      var lines = cleanText(result.rawText).split('\n').filter(Boolean);
      return lines.map(function (line, index) {
        return String(index + 1).padStart(2, '0') + '. ' + line;
      }).join('\n');
    }
    if (view === 'fields') return fieldsToText(result.fields);
    if (view === 'markdown') return resultToMarkdown(result);
    return cleanText(result.rawText);
  }

  function cleanText(text) {
    return String(text || '')
      .replace(/\r/g, '')
      .replace(/-\n(?=\w)/g, '')
      .split('\n')
      .map(function (line) {
        return line.replace(/[ \t]+/g, ' ').trim();
      })
      .filter(Boolean)
      .join('\n');
  }

  function extractFields(text, words) {
    var source = String(text || '');
    var lines = source.split(/\r?\n/).map(function (line) {
      return line.replace(/[ \t]+/g, ' ').trim();
    }).filter(Boolean);
    var amounts = uniqueMatches(source, /\b(?:NGN|GHS|KES|KSH|UGX|TZS|RWF|ZAR|NAD|BWP|USD|EUR|GBP|XOF|XAF|MAD|EGP|ETB|MZN|AOA|MWK|ZMW|Shs|USh|KSh|R)\s?[-+]?\d[\d,]*(?:\.\d{1,2})?\b|\b[-+]?\d[\d,]*\.\d{2}\b/g);
    var dates = uniqueMatches(source, /\b(?:\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}|\d{4}[\/.-]\d{1,2}[\/.-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b/gi);
    var phones = uniqueMatches(source, /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/g)
      .filter(function (value) { return value.replace(/\D/g, '').length >= 7; });
    var emails = uniqueMatches(source, /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
    var urls = uniqueMatches(source, /\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+/gi);
    var totals = lines.filter(function (line) {
      return /(total|balance|amount due|grand total|subtotal|paid|change|vat|tax)/i.test(line);
    }).slice(0, 12);
    var lowConfidence = Array.isArray(words) ? words.filter(function (word) {
      return typeof word.confidence === 'number' && word.confidence < 65;
    }).slice(0, 12).map(function (word) { return word.text; }) : [];
    return {
      amounts: amounts.slice(0, 40),
      dates: dates.slice(0, 30),
      phones: phones.slice(0, 20),
      emails: emails.slice(0, 20),
      urls: urls.slice(0, 20),
      totals: totals,
      lowConfidence: lowConfidence
    };
  }

  function uniqueMatches(source, regex) {
    var matches = String(source || '').match(regex) || [];
    var seen = {};
    return matches.map(function (value) {
      return value.trim().replace(/[.,;:]$/, '');
    }).filter(function (value) {
      var key = value.toLowerCase();
      if (!value || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function fieldsToText(fields) {
    if (!fields) return '';
    var groups = [
      ['Possible totals / tax lines', fields.totals],
      ['Amounts', fields.amounts],
      ['Dates', fields.dates],
      ['Phones', fields.phones],
      ['Emails', fields.emails],
      ['Links', fields.urls],
      ['Low-confidence words to check', fields.lowConfidence]
    ];
    return groups.map(function (group) {
      var values = group[1] || [];
      return '## ' + group[0] + '\n' + (values.length ? values.map(function (value) { return '- ' + value; }).join('\n') : '- None found');
    }).join('\n\n');
  }

  function resultToMarkdown(result) {
    var lines = [
      '# OCR Notes',
      '',
      '- Source: ' + result.name,
      '- Language: ' + result.languageLabel,
      '- Confidence: ' + confidenceLabel(result.confidence),
      '- Recipe: ' + result.preset,
      '',
      '## Clean Text',
      '',
      cleanText(result.rawText) || '_No text extracted._',
      '',
      '## Structured Fields',
      '',
      fieldsToText(result.fields)
    ];
    return lines.join('\n');
  }

  function renderFields(fields) {
    els.fieldsList.innerHTML = '';
    var data = fields || { amounts: [], dates: [], phones: [], emails: [], urls: [], totals: [], lowConfidence: [] };
    var groups = [
      ['Totals and tax lines', data.totals],
      ['Amounts', data.amounts],
      ['Dates', data.dates],
      ['Contacts', data.emails.concat(data.phones)],
      ['Links', data.urls],
      ['Check manually', data.lowConfidence]
    ];
    groups.forEach(function (group) {
      var row = document.createElement('div');
      row.className = 'ocr-field-group';
      row.innerHTML = '<strong></strong><span></span>';
      row.querySelector('strong').textContent = group[0];
      row.querySelector('span').textContent = group[1] && group[1].length ? group[1].slice(0, 8).join(' · ') : 'None found yet';
      els.fieldsList.appendChild(row);
    });
  }

  function applyPreset(key, announce) {
    var preset = PRESETS[key] || PRESETS.receipt;
    state.preset = key;
    state.language = preset.language;
    state.view = preset.view;
    state.grayscale = preset.grayscale;
    state.invert = preset.invert;
    state.contrast = preset.contrast;
    state.threshold = preset.threshold;
    state.scale = preset.scale;
    state.suffix = preset.suffix;
    applyStateToControls();
    renderPreparedPreview();
    if (currentResult) setView(state.view, true);
    saveSettings();
    if (announce) setStatus(preset.label + ' OCR recipe loaded.');
  }

  function applyStateToControls() {
    els.language.value = state.language;
    els.view.value = state.view;
    els.rotate.value = String(state.rotate);
    els.scale.value = String(state.scale);
    els.grayscale.checked = !!state.grayscale;
    els.invert.checked = !!state.invert;
    els.contrast.value = state.contrast;
    els.threshold.value = state.threshold;
    updatePresetButtons();
    updateViewButtons();
    updateControlLabels();
  }

  function updatePresetButtons() {
    els.presetButtons.forEach(function (button) {
      var active = button.getAttribute('data-ocr-preset') === state.preset;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateViewButtons() {
    els.viewButtons.forEach(function (button) {
      var active = button.getAttribute('data-ocr-view') === state.view;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateControlLabels() {
    els.contrastValue.textContent = String(state.contrast);
    els.thresholdValue.textContent = state.threshold > 0 ? String(state.threshold) : 'Off';
  }

  function updateStats() {
    if (!sourceRecord) {
      els.sourceStat.textContent = '-';
      els.confidenceStat.textContent = '-';
      els.textStat.textContent = '-';
      els.languageStat.textContent = LANGUAGE_LABELS[state.language] || state.language;
      return;
    }
    els.sourceStat.textContent = sourceRecord.workingWidth + ' x ' + sourceRecord.workingHeight;
    els.confidenceStat.textContent = currentResult ? confidenceLabel(currentResult.confidence) : 'Not run';
    var text = els.textArea.value || (currentResult ? currentResult.rawText : '');
    els.textStat.textContent = countWords(text) + ' words, ' + String(text || '').length + ' chars';
    els.languageStat.textContent = LANGUAGE_LABELS[state.language] || state.language;
  }

  function updateButtons() {
    var hasSource = !!sourceRecord;
    var hasText = !!(els.textArea.value && els.textArea.value.trim());
    els.run.disabled = !hasSource;
    els.batch.disabled = queue.length < 2;
    els.resetImage.disabled = !hasSource;
    els.copy.disabled = !hasText;
    els.txt.disabled = !hasText;
    els.md.disabled = !hasText;
    els.json.disabled = !currentResult;
    els.csv.disabled = !currentResult;
    els.copyBrief.disabled = !currentResult;
  }

  function setBusy(isBusy) {
    els.run.disabled = isBusy || !sourceRecord;
    els.batch.disabled = isBusy || queue.length < 2;
    els.run.textContent = isBusy ? 'Reading...' : 'Extract text';
    els.batch.textContent = isBusy ? 'Working...' : 'Process queue';
    if (!isBusy) updateButtons();
  }

  function showProgress(show) {
    els.progress.hidden = !show;
    if (!show) {
      els.progressFill.style.width = '0%';
      els.progressText.textContent = 'Waiting...';
    }
  }

  function updateProgress(progress, text) {
    if (typeof progress === 'number') {
      var value = progress > 1 ? progress : progress * 100;
      els.progressFill.style.width = clamp(Math.round(value), 0, 100) + '%';
    }
    if (text) els.progressText.textContent = text;
  }

  function updateFindStatus() {
    var query = els.find.value.trim().toLowerCase();
    if (!query || !els.textArea.value) {
      updateStats();
      return;
    }
    var count = els.textArea.value.toLowerCase().split(query).length - 1;
    setStatus(count ? count + ' match' + (count === 1 ? '' : 'es') + ' found in current result.' : 'No matches in current result.');
    updateStats();
  }

  function copyCurrentText() {
    var text = els.textArea.value || '';
    copyText(text).then(function () {
      setStatus('Current OCR view copied.');
    }, function () {
      setStatus('Could not copy automatically. Select the text and copy it manually.');
    });
  }

  function downloadText(kind) {
    var text = els.textArea.value || '';
    if (!text) return;
    var type = kind === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8';
    var ext = kind === 'md' ? 'md' : 'txt';
    downloadBlob(new Blob([text], { type: type }), buildFileName(ext));
  }

  function downloadJson() {
    if (!currentResult) return;
    var payload = {
      source: currentResult.name,
      language: currentResult.language,
      confidence: currentResult.confidence,
      preset: currentResult.preset,
      text: els.textArea.value,
      rawText: currentResult.rawText,
      fields: currentResult.fields,
      processedAt: currentResult.at
    };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' }), buildFileName('json'));
  }

  function downloadCsv() {
    if (!currentResult) return;
    var rows = [['type', 'value']];
    var fields = currentResult.fields || {};
    Object.keys(fields).forEach(function (key) {
      if (!Array.isArray(fields[key])) return;
      fields[key].forEach(function (value) {
        rows.push([key, value]);
      });
    });
    var csv = rows.map(function (row) {
      return row.map(csvEscape).join(',');
    }).join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), buildFileName('csv'));
  }

  function copyBrief() {
    if (!currentResult) return;
    var text = [
      'Image to Text OCR Studio handoff',
      'Source: ' + currentResult.name,
      'Language: ' + currentResult.languageLabel,
      'Recipe: ' + currentResult.preset,
      'Confidence: ' + confidenceLabel(currentResult.confidence),
      'Words: ' + countWords(els.textArea.value),
      'Fields found: ' + Object.keys(currentResult.fields).map(function (key) {
        return key + '=' + (currentResult.fields[key] || []).length;
      }).join(', '),
      'Images stayed in this browser session. OCR model files may have been downloaded by the browser, but the image was not uploaded to AfroTools.'
    ].join('\n');
    copyText(text).then(function () {
      setStatus('OCR handoff brief copied.');
    }, function () {
      setStatus('Could not copy the brief automatically.');
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

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function buildFileName(ext) {
    var base = sourceRecord ? sourceRecord.name.replace(/\.[^.]+$/, '') : 'image';
    base = base.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'image';
    var suffix = (PRESETS[state.preset] && PRESETS[state.preset].suffix) || state.suffix || 'ocr';
    return base + '-' + suffix + '.' + ext;
  }

  function addHistory(result) {
    if (!result) return;
    history.unshift({
      name: result.name,
      language: result.languageLabel,
      confidence: result.confidence,
      words: result.wordsCount,
      chars: result.chars,
      at: result.at
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
    els.history.innerHTML = '';
    if (!history.length) {
      var empty = document.createElement('div');
      empty.className = 'ocr-history-empty';
      empty.textContent = 'OCR runs will appear here without storing source images.';
      els.history.appendChild(empty);
      return;
    }
    history.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'ocr-history-item';
      row.innerHTML = '<strong></strong><span></span>';
      row.querySelector('strong').textContent = item.name;
      row.querySelector('span').textContent = item.language + ' - ' + confidenceLabel(item.confidence) + ' - ' + item.words + ' words - ' + readableDate(new Date(item.at));
      els.history.appendChild(row);
    });
  }

  function loadSettings() {
    try {
      var saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      Object.keys(saved).forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(state, key)) state[key] = saved[key];
      });
      if (!PRESETS[state.preset]) state.preset = 'receipt';
      if (!LANGUAGE_LABELS[state.language]) state.language = 'eng';
      if (!VIEW_LABELS[state.view]) state.view = 'clean';
    } catch (error) {
      // Keep defaults.
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
        check.checked = !!saved[check.getAttribute('data-ocr-check')];
      });
    } catch (error) {
      // Ignore invalid local state.
    }
  }

  function saveChecklist() {
    var payload = {};
    els.checks.forEach(function (check) {
      payload[check.getAttribute('data-ocr-check')] = !!check.checked;
    });
    try {
      localStorage.setItem(CHECK_KEY, JSON.stringify(payload));
    } catch (error) {
      // Local storage can be disabled or full.
    }
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  function getPresetLabel() {
    return (PRESETS[state.preset] && PRESETS[state.preset].label) || 'Receipt';
  }

  function confidenceLabel(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'Unknown';
    return Math.round(value) + '%';
  }

  function setCanvasSize(canvas, width, height) {
    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
  }

  function countWords(text) {
    var words = String(text || '').trim().match(/\S+/g);
    return words ? words.length : 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function numberValue(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
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

  function csvEscape(value) {
    var text = String(value == null ? '' : value);
    if (/[",\n\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
    return text;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
