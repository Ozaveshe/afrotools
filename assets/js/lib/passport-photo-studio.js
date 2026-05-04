(function () {
  'use strict';

  var SETTINGS_KEY = 'afro_passport_photo_settings_v2';
  var HISTORY_KEY = 'afro_passport_photo_history_v1';
  var CHECK_KEY = 'afro_passport_photo_checklist_v1';
  var DPI = 300;
  var PX_PER_MM = DPI / 25.4;

  var SPECS = [
    {
      id: 'za-passport',
      group: 'African passports',
      label: 'South Africa passport / ID',
      country: 'South Africa',
      widthMm: 35,
      heightMm: 45,
      headMinMm: 31.5,
      headMaxMm: 36,
      background: '#f3f4f6',
      backgroundLabel: 'Light grey, cream, or white',
      copies: '2 passport photos, office may capture biometrics',
      confidence: 'Official size and framing',
      sourceLabel: 'DIRCO / Department of Home Affairs photo specification',
      sourceUrl: 'https://www.dirco.gov.za/uk/wp-content/uploads/sites/5/2024/04/Passport_Photo_Requirements.pdf',
      notes: ['35 x 45 mm print.', 'Face should take about 70 to 80 percent of the photo.', 'Use a recent, clear photo with no shadows or glare.']
    },
    {
      id: 'ng-passport',
      group: 'African passports',
      label: 'Nigeria passport packet',
      country: 'Nigeria',
      widthMm: 35,
      heightMm: 45,
      headMinMm: 31,
      headMaxMm: 36,
      background: '#ffffff',
      backgroundLabel: 'Plain white',
      copies: 'NIS asks for passport-sized photos; count varies by application type',
      confidence: 'Official photo requirement, common 35 x 45 mm crop',
      sourceLabel: 'Nigeria Immigration Service passport requirements',
      sourceUrl: 'https://immigration.gov.ng/passports/',
      notes: ['NIS lists passport-sized photographs in the application packet.', 'Use a conservative 35 x 45 mm print unless the passport office gives a different local size.', 'Bring extra copies for guarantor or age-declaration paperwork when requested.']
    },
    {
      id: 'gh-passport',
      group: 'African passports',
      label: 'Ghana passport embassy packet',
      country: 'Ghana',
      widthMm: 35,
      heightMm: 45,
      headMinMm: 31,
      headMaxMm: 36,
      background: '#ffffff',
      backgroundLabel: 'Plain white',
      copies: '4 photos in the referenced embassy form',
      confidence: 'Official background and recency, common passport-size crop',
      sourceLabel: 'Ghana Embassy passport application form',
      sourceUrl: 'https://ghanaembassy.com.tr/files/passport_form.pdf',
      notes: ['The form asks for full-face passport-size photos on a plain white background.', 'Photos should be within 6 months and without dark glasses or hat.', 'Exact millimetre size is not printed on the referenced form, so confirm with the mission if strict sizing is required.']
    },
    {
      id: 'ke-passport',
      group: 'African passports',
      label: 'Kenya passport packet',
      country: 'Kenya',
      widthMm: 35,
      heightMm: 45,
      headMinMm: 31,
      headMaxMm: 36,
      background: '#ffffff',
      backgroundLabel: 'Plain white',
      copies: '3 current passport-size photos in eCitizen passport instructions',
      confidence: 'Official packet requirement, common 35 x 45 mm crop',
      sourceLabel: 'Kenya eCitizen passport application instructions',
      sourceUrl: 'https://immigration.ecitizen.go.ke/index.php?id=4',
      notes: ['eCitizen asks for three current passport-size photos during submission.', 'Passport processing centres also capture biometrics.', 'Use a clean 35 x 45 mm print for physical packets unless the office asks for another size.']
    },
    {
      id: 'ke-visa',
      group: 'African visa and ID',
      label: 'Kenya eCitizen visa photo',
      country: 'Kenya',
      widthMm: 55,
      heightMm: 55,
      pixelWidth: 207,
      pixelHeight: 207,
      headMinMm: 38.5,
      headMaxMm: 44,
      background: '#ffffff',
      backgroundLabel: 'Plain white',
      copies: 'Digital upload guidance',
      confidence: 'Official eCitizen photo-upload guidance',
      sourceLabel: 'Kenya eCitizen photo requirements',
      sourceUrl: 'https://immigration.ecitizen.go.ke/index.php?id=9',
      notes: ['Photo should be colour with a white background.', 'Face should occupy about 70 to 80 percent of the photo.', 'The page states 5.5 cm x 5.5 cm and 207 px x 207 px.']
    },
    {
      id: 'africa-common-35x45',
      group: 'African passports',
      label: 'Africa common passport print',
      country: 'Multiple African offices',
      widthMm: 35,
      heightMm: 45,
      headMinMm: 31,
      headMaxMm: 36,
      background: '#ffffff',
      backgroundLabel: 'Plain white or light background',
      copies: 'Use when your office says passport-size photo only',
      confidence: 'Common studio fallback',
      sourceLabel: 'Common 35 x 45 mm fallback, verify with issuing office',
      sourceUrl: '',
      notes: ['Use this only when the issuing office says passport-size and does not publish exact dimensions.', 'Confirm size before printing if rejection would be costly.', 'White background is the safest general choice.']
    },
    {
      id: 'us-passport',
      group: 'Popular destinations',
      label: 'United States passport / visa',
      country: 'United States',
      widthMm: 51,
      heightMm: 51,
      headMinMm: 25,
      headMaxMm: 35,
      background: '#ffffff',
      backgroundLabel: 'White or off-white',
      copies: '1 photo for many passport applications',
      confidence: 'Official size and head range',
      sourceLabel: 'U.S. Department of State photo requirements',
      sourceUrl: 'https://travel.state.gov/content/travel/en/passports/how-apply/photos.html',
      notes: ['2 x 2 inch photo, which is about 51 x 51 mm.', 'Head height should be 25 to 35 mm from chin to top of head.', 'Do not use filters, AI, or retouching for official submission.']
    },
    {
      id: 'uk-passport',
      group: 'Popular destinations',
      label: 'United Kingdom passport',
      country: 'United Kingdom',
      widthMm: 35,
      heightMm: 45,
      headMinMm: 29,
      headMaxMm: 34,
      background: '#eeeeee',
      backgroundLabel: 'Plain light grey or cream',
      copies: '2 identical printed photos for paper forms',
      confidence: 'Official printed photo size',
      sourceLabel: 'GOV.UK passport photo requirements',
      sourceUrl: 'https://www.gov.uk/photos-for-passports/photo-requirements',
      notes: ['Printed UK passport photos are 35 mm wide by 45 mm high.', 'Use a plain light grey or cream background with no shadows.', 'Digital UK passport photos should be checked through the official passport flow.']
    },
    {
      id: 'schengen-visa',
      group: 'Popular destinations',
      label: 'Schengen visa / Netherlands checklist',
      country: 'Schengen area',
      widthMm: 35,
      heightMm: 45,
      headMinMm: 26,
      headMaxMm: 30,
      background: '#ffffff',
      backgroundLabel: 'White or light-coloured',
      copies: 'Usually 1 photo unless centre captures digital photo',
      confidence: 'Official Dutch Schengen checklist size',
      sourceLabel: 'NetherlandsWorldwide Schengen visa checklist',
      sourceUrl: 'https://www.netherlandsworldwide.nl/visa-the-netherlands/checklist-schengen-visa-tourism',
      notes: ['Checklist states colour photo, no more than 6 months old, 3.5 x 4.5 cm.', 'External service providers may capture a digital photo at the appointment.', 'Use destination consulate instructions when a national checklist differs.']
    },
    {
      id: 'nl-passport',
      group: 'Popular destinations',
      label: 'Netherlands passport / ID',
      country: 'Netherlands',
      widthMm: 35,
      heightMm: 45,
      headMinMm: 26,
      headMaxMm: 30,
      background: '#eef2ff',
      backgroundLabel: 'Light grey, light blue, or white',
      copies: 'Passport, ID, and driving licence standard',
      confidence: 'Official Dutch passport/ID requirements',
      sourceLabel: 'NetherlandsWorldwide photo requirements',
      sourceUrl: 'https://www.netherlandsworldwide.nl/passport-id-card/photo-requirements',
      notes: ['Standard format is 35 x 45 mm.', 'Face length for ages 11 and above is 26 to 30 mm from chin to crown.', 'Background may be light grey, light blue, or white.']
    },
    {
      id: 'canada-passport',
      group: 'Popular destinations',
      label: 'Canada passport',
      country: 'Canada',
      widthMm: 50,
      heightMm: 70,
      headMinMm: 31,
      headMaxMm: 36,
      background: '#f8fafc',
      backgroundLabel: 'White or light-coloured',
      copies: '2 identical photos for paper applications',
      confidence: 'Official size and head range',
      sourceLabel: 'Government of Canada passport photo requirements',
      sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html',
      notes: ['Canada uses 50 x 70 mm, which differs from many countries.', 'Face height should be 31 to 36 mm from chin to crown.', 'Canada requires commercial photographer details for many workflows.']
    },
    {
      id: 'australia-passport',
      group: 'Popular destinations',
      label: 'Australia passport',
      country: 'Australia',
      widthMm: 35,
      heightMm: 45,
      headMinMm: 32,
      headMaxMm: 36,
      background: '#ffffff',
      backgroundLabel: 'Plain white or light background',
      copies: '2 good-quality photos',
      confidence: 'Official size range, 35 x 45 mm working crop',
      sourceLabel: 'Australian Passport Office photo guidelines',
      sourceUrl: 'https://www.passports.gov.au/help/passport-photos',
      notes: ['Australian photos must be 35 to 40 mm wide and 45 to 50 mm high.', 'This studio outputs a 35 x 45 mm crop inside the accepted range.', 'Face height should be 32 to 36 mm from chin to crown.']
    },
    {
      id: 'generic-2x2',
      group: 'Common sizes',
      label: '2 x 2 inch square',
      country: 'Common square photo',
      widthMm: 51,
      heightMm: 51,
      headMinMm: 25,
      headMaxMm: 35,
      background: '#ffffff',
      backgroundLabel: 'White or off-white',
      copies: 'Digital or print as requested',
      confidence: 'Common size preset',
      sourceLabel: 'Use only when the destination explicitly asks for 2 x 2 inches',
      sourceUrl: '',
      notes: ['Good for U.S.-style document workflows.', 'Do not use this for Canada, UK, South Africa, or Schengen unless the authority asks for it.', 'Check the target portal before upload.']
    }
  ];

  var els = {};
  var sourceRecord = null;
  var outputBlob = null;
  var outputUrl = '';
  var history = [];
  var activeGroup = 'all';

  function init() {
    cacheElements();
    if (!els.input || !els.previewCanvas) return;
    buildSpecSelect();
    loadSettings();
    loadHistory();
    loadChecklist();
    bindEvents();
    updateRequirement();
    updateControls();
    updateChecklistScore();
    updateHistory();
    updateButtons();
    renderEmpty();
    setStatus('Ready. Choose a requirement, upload a photo, then align the face manually.');
  }

  function cacheElements() {
    els.status = byId('ppStatus');
    els.drop = byId('ppDropZone');
    els.input = byId('ppInput');
    els.groupButtons = Array.prototype.slice.call(document.querySelectorAll('[data-pp-group]'));
    els.search = byId('ppSearch');
    els.specSelect = byId('ppSpecSelect');
    els.background = byId('ppBackground');
    els.zoom = byId('ppZoom');
    els.zoomValue = byId('ppZoomValue');
    els.offsetX = byId('ppOffsetX');
    els.offsetXValue = byId('ppOffsetXValue');
    els.offsetY = byId('ppOffsetY');
    els.offsetYValue = byId('ppOffsetYValue');
    els.rotation = byId('ppRotation');
    els.rotationValue = byId('ppRotationValue');
    els.showGuides = byId('ppShowGuides');
    els.layout = byId('ppLayout');
    els.format = byId('ppFormat');
    els.quality = byId('ppQuality');
    els.qualityValue = byId('ppQualityValue');
    els.previewFrame = byId('ppPreviewFrame');
    els.previewCanvas = byId('ppPreviewCanvas');
    els.previewEmpty = byId('ppPreviewEmpty');
    els.renderBtn = byId('ppRenderBtn');
    els.downloadBtn = byId('ppDownloadBtn');
    els.copyBtn = byId('ppCopyBtn');
    els.resetBtn = byId('ppResetBtn');
    els.specTitle = byId('ppSpecTitle');
    els.specSize = byId('ppSpecSize');
    els.specHead = byId('ppSpecHead');
    els.specBackground = byId('ppSpecBackground');
    els.specCopies = byId('ppSpecCopies');
    els.specConfidence = byId('ppSpecConfidence');
    els.sourceBox = byId('ppSourceBox');
    els.notesList = byId('ppNotesList');
    els.sourceFile = byId('ppSourceFile');
    els.outputType = byId('ppOutputType');
    els.outputDimensions = byId('ppOutputDimensions');
    els.outputBytes = byId('ppOutputBytes');
    els.checkRows = Array.prototype.slice.call(document.querySelectorAll('[data-pp-check]'));
    els.scoreText = byId('ppScoreText');
    els.scoreBar = byId('ppScoreBar');
    els.historyList = byId('ppHistoryList');
  }

  function bindEvents() {
    els.drop.addEventListener('click', function () { els.input.click(); });
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
    els.drop.addEventListener('dragleave', function () { els.drop.classList.remove('dragover'); });
    els.drop.addEventListener('drop', function (event) {
      event.preventDefault();
      els.drop.classList.remove('dragover');
      acceptFile(event.dataTransfer.files && event.dataTransfer.files[0]);
    });
    document.addEventListener('paste', function (event) {
      if (event.clipboardData && event.clipboardData.files && event.clipboardData.files.length) {
        acceptFile(event.clipboardData.files[0]);
      }
    });
    els.input.addEventListener('change', function () {
      acceptFile(els.input.files && els.input.files[0]);
    });
    els.groupButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        activeGroup = button.dataset.ppGroup;
        buildSpecSelect();
      });
    });
    els.search.addEventListener('input', buildSpecSelect);
    els.specSelect.addEventListener('change', function () {
      updateRequirement();
      handleSettingsChanged('Requirement changed.');
    });
    [els.background, els.zoom, els.offsetX, els.offsetY, els.rotation, els.showGuides, els.layout, els.format, els.quality].forEach(function (input) {
      input.addEventListener('input', function () {
        handleSettingsChanged('Preview updated.');
      });
      input.addEventListener('change', function () {
        handleSettingsChanged('Preview updated.');
      });
    });
    els.renderBtn.addEventListener('click', exportOutput);
    els.downloadBtn.addEventListener('click', downloadOutput);
    els.copyBtn.addEventListener('click', copyBrief);
    els.resetBtn.addEventListener('click', function () {
      els.zoom.value = '100';
      els.offsetX.value = '0';
      els.offsetY.value = '0';
      els.rotation.value = '0';
      handleSettingsChanged('Crop reset.');
    });
    els.checkRows.forEach(function (row) {
      row.addEventListener('change', function () {
        saveChecklist();
        updateChecklistScore();
      });
    });
    window.addEventListener('beforeunload', clearObjectUrls);
  }

  function buildSpecSelect() {
    var selected = els.specSelect.value || 'za-passport';
    var q = String(els.search.value || '').trim().toLowerCase();
    var groups = {};
    SPECS.forEach(function (spec) {
      var matchGroup = activeGroup === 'all' || spec.group === activeGroup;
      var matchSearch = !q || (spec.label + ' ' + spec.country + ' ' + spec.group).toLowerCase().indexOf(q) !== -1;
      if (matchGroup && matchSearch) {
        groups[spec.group] = groups[spec.group] || [];
        groups[spec.group].push(spec);
      }
    });
    var html = Object.keys(groups).map(function (group) {
      return '<optgroup label="' + esc(group) + '">' + groups[group].map(function (spec) {
        return '<option value="' + esc(spec.id) + '">' + esc(spec.label) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
    els.specSelect.innerHTML = html || '<option value="africa-common-35x45">No match, use common 35 x 45 mm</option>';
    if (SPECS.some(function (spec) { return spec.id === selected; }) && Array.prototype.some.call(els.specSelect.options, function (option) { return option.value === selected; })) {
      els.specSelect.value = selected;
    }
    updateGroupButtons();
    updateRequirement();
  }

  function updateGroupButtons() {
    els.groupButtons.forEach(function (button) {
      var active = button.dataset.ppGroup === activeGroup;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function getSpec() {
    return SPECS.find(function (spec) { return spec.id === els.specSelect.value; }) || SPECS[0];
  }

  function updateRequirement() {
    var spec = getSpec();
    els.specTitle.textContent = spec.label;
    els.specSize.textContent = spec.pixelWidth && spec.pixelHeight
      ? spec.widthMm + ' x ' + spec.heightMm + ' mm / ' + spec.pixelWidth + ' x ' + spec.pixelHeight + ' px'
      : spec.widthMm + ' x ' + spec.heightMm + ' mm';
    els.specHead.textContent = spec.headMinMm && spec.headMaxMm ? spec.headMinMm + ' to ' + spec.headMaxMm + ' mm' : 'Check authority';
    els.specBackground.textContent = spec.backgroundLabel;
    els.specCopies.textContent = spec.copies;
    els.specConfidence.textContent = spec.confidence;
    els.background.value = spec.background || '#ffffff';
    els.sourceBox.innerHTML = spec.sourceUrl
      ? '<strong>Source note:</strong> ' + esc(spec.confidence) + '<br><a href="' + esc(spec.sourceUrl) + '" target="_blank" rel="noopener">' + esc(spec.sourceLabel) + '</a>'
      : '<strong>Source note:</strong> ' + esc(spec.sourceLabel);
    els.notesList.innerHTML = spec.notes.map(function (note) {
      return '<div class="pp-source-box">' + esc(note) + '</div>';
    }).join('');
  }

  function acceptFile(file) {
    if (!file) return;
    if (!((file.type && file.type.indexOf('image/') === 0) || /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic|heif)$/i.test(file.name || ''))) {
      setStatus('Choose a browser-supported image file.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setStatus('Choose an image under 15 MB for this browser editor.');
      return;
    }
    if (sourceRecord && sourceRecord.url) {
      URL.revokeObjectURL(sourceRecord.url);
    }
    clearOutput();
    var record = {
      file: file,
      name: file.name || 'passport-photo-source',
      size: file.size || 0,
      url: URL.createObjectURL(file),
      image: null,
      width: 0,
      height: 0
    };
    loadImage(record).then(function () {
      sourceRecord = record;
      els.sourceFile.textContent = record.name + ' / ' + formatBytes(record.size);
      renderPreview();
      updateButtons();
      setStatus('Photo loaded. Align the crown and chin inside the guide before export.');
    }).catch(function () {
      URL.revokeObjectURL(record.url);
      setStatus('This image could not be decoded by the browser.');
    });
  }

  function loadImage(record) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () {
        record.image = img;
        record.width = img.naturalWidth || img.width;
        record.height = img.naturalHeight || img.height;
        resolve(record);
      };
      img.onerror = reject;
      img.src = record.url;
    });
  }

  function handleSettingsChanged(message) {
    updateControls();
    saveSettings();
    clearOutput();
    renderPreview();
    updateButtons();
    if (message) setStatus(message);
  }

  function updateControls() {
    els.zoomValue.textContent = els.zoom.value + '%';
    els.offsetXValue.textContent = Number(els.offsetX.value) > 0 ? '+' + els.offsetX.value : els.offsetX.value;
    els.offsetYValue.textContent = Number(els.offsetY.value) > 0 ? '+' + els.offsetY.value : els.offsetY.value;
    els.rotationValue.textContent = els.rotation.value + ' deg';
    els.qualityValue.textContent = els.quality.value + '%';
  }

  function renderPreview() {
    if (!sourceRecord) {
      renderEmpty();
      return;
    }
    var spec = getSpec();
    var preview = makeSingleCanvas(spec, { preview: true, guides: els.showGuides.checked });
    els.previewCanvas.width = preview.width;
    els.previewCanvas.height = preview.height;
    var ctx = els.previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, preview.width, preview.height);
    ctx.drawImage(preview, 0, 0);
    els.previewCanvas.hidden = false;
    els.previewEmpty.hidden = true;
    els.outputType.textContent = spec.label;
    els.outputDimensions.textContent = spec.widthMm + ' x ' + spec.heightMm + ' mm at 300 DPI';
    if (!outputBlob) els.outputBytes.textContent = '-';
  }

  function renderEmpty() {
    els.previewCanvas.hidden = true;
    els.previewEmpty.hidden = false;
    els.previewEmpty.textContent = 'Upload a front-facing photo to start framing.';
    els.sourceFile.textContent = '-';
    els.outputType.textContent = '-';
    els.outputDimensions.textContent = '-';
    els.outputBytes.textContent = '-';
  }

  function makeSingleCanvas(spec, options) {
    options = options || {};
    var scale = options.preview ? Math.min(1, 720 / mmToPx(spec.heightMm)) : 1;
    var width = Math.max(1, Math.round(mmToPx(spec.widthMm) * scale));
    var height = Math.max(1, Math.round(mmToPx(spec.heightMm) * scale));
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = els.background.value || spec.background || '#ffffff';
    ctx.fillRect(0, 0, width, height);
    if (sourceRecord && sourceRecord.image) {
      drawSource(ctx, width, height);
    }
    if (options.guides) {
      drawGuides(ctx, spec, width, height, scale);
    }
    return canvas;
  }

  function drawSource(ctx, width, height) {
    var img = sourceRecord.image;
    var baseScale = Math.max(width / img.width, height / img.height);
    var userScale = Number(els.zoom.value || 100) / 100;
    var drawW = img.width * baseScale * userScale;
    var drawH = img.height * baseScale * userScale;
    var offsetX = Number(els.offsetX.value || 0) / 100 * width;
    var offsetY = Number(els.offsetY.value || 0) / 100 * height;
    var angle = Number(els.rotation.value || 0) * Math.PI / 180;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(angle);
    ctx.drawImage(img, -drawW / 2 + offsetX, -drawH / 2 + offsetY, drawW, drawH);
    ctx.restore();
  }

  function drawGuides(ctx, spec, width, height, scale) {
    var headMin = spec.headMinMm ? spec.headMinMm * PX_PER_MM * scale : height * 0.65;
    var headMax = spec.headMaxMm ? spec.headMaxMm * PX_PER_MM * scale : height * 0.8;
    var targetHead = (headMin + headMax) / 2;
    var crownY = Math.max(height * 0.08, (height - targetHead) / 2 - height * 0.04);
    var chinY = crownY + targetHead;
    var faceW = width * 0.54;
    var left = (width - faceW) / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(29, 78, 216, 0.9)';
    ctx.lineWidth = Math.max(2, width / 180);
    ctx.setLineDash([Math.max(8, width / 28), Math.max(5, width / 55)]);
    roundRect(ctx, left, crownY, faceW, targetHead, width * 0.25);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.62)';
    ctx.beginPath();
    ctx.moveTo(width * 0.08, crownY);
    ctx.lineTo(width * 0.92, crownY);
    ctx.moveTo(width * 0.08, chinY);
    ctx.lineTo(width * 0.92, chinY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    ctx.font = Math.max(12, width / 34) + 'px sans-serif';
    ctx.fillText('crown', width * 0.1, crownY - 6);
    ctx.fillText('chin', width * 0.1, chinY + Math.max(16, width / 32));
    ctx.restore();
  }

  function roundRect(ctx, x, y, width, height, radius) {
    radius = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  }

  function exportOutput() {
    if (!sourceRecord) {
      setStatus('Upload a photo first.');
      return;
    }
    clearOutput();
    var spec = getSpec();
    var single = makeSingleCanvas(spec, { preview: false, guides: false });
    var canvas = makeOutputCanvas(single, spec);
    canvasToBlob(canvas).then(function (blob) {
      outputBlob = blob;
      outputUrl = URL.createObjectURL(blob);
      els.outputType.textContent = spec.label + ' / ' + layoutLabel();
      els.outputDimensions.textContent = canvas.width + ' x ' + canvas.height + ' px';
      els.outputBytes.textContent = formatBytes(blob.size);
      saveHistory({
        label: spec.label,
        details: layoutLabel() + ' / ' + getFormatExt() + ' / ' + formatBytes(blob.size)
      });
      updateButtons();
      setStatus('Export ready. Download the file or copy the requirement brief.');
    }).catch(function () {
      setStatus('Export failed in this browser. Try PNG or JPG.');
    });
  }

  function makeOutputCanvas(single, spec) {
    var layout = els.layout.value;
    if (layout === 'single') return single;
    var sheet = layout === 'a4'
      ? { width: mmToPx(210), height: mmToPx(297), name: 'A4' }
      : { width: 6 * DPI, height: 4 * DPI, name: '4 x 6 in' };
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(sheet.width);
    canvas.height = Math.round(sheet.height);
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    var gap = Math.round(mmToPx(3));
    var cols = Math.max(1, Math.floor((canvas.width + gap) / (single.width + gap)));
    var rows = Math.max(1, Math.floor((canvas.height + gap) / (single.height + gap)));
    var count = Math.min(cols * rows, layout === 'sheet-4x6' ? 8 : 40);
    var usedCols = Math.min(cols, count);
    var usedRows = Math.ceil(count / cols);
    var gridW = usedCols * single.width + (usedCols - 1) * gap;
    var gridH = usedRows * single.height + (usedRows - 1) * gap;
    var startX = Math.max(gap, Math.floor((canvas.width - gridW) / 2));
    var startY = Math.max(gap, Math.floor((canvas.height - gridH) / 2));
    for (var i = 0; i < count; i += 1) {
      var col = i % cols;
      var row = Math.floor(i / cols);
      var x = startX + col * (single.width + gap);
      var y = startY + row * (single.height + gap);
      ctx.drawImage(single, x, y);
      drawCutMarks(ctx, x, y, single.width, single.height);
    }
    ctx.fillStyle = '#475569';
    ctx.font = '24px sans-serif';
    ctx.fillText(spec.label + ' - ' + spec.widthMm + 'x' + spec.heightMm + 'mm - 300 DPI', gap, canvas.height - gap);
    return canvas;
  }

  function drawCutMarks(ctx, x, y, width, height) {
    var m = 18;
    ctx.save();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    [[x, y], [x + width, y], [x, y + height], [x + width, y + height]].forEach(function (point) {
      var px = point[0];
      var py = point[1];
      ctx.beginPath();
      ctx.moveTo(px - m, py);
      ctx.lineTo(px + m, py);
      ctx.moveTo(px, py - m);
      ctx.lineTo(px, py + m);
      ctx.stroke();
    });
    ctx.restore();
  }

  function canvasToBlob(canvas) {
    return new Promise(function (resolve, reject) {
      var mime = els.format.value;
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('No blob'));
      }, mime, Number(els.quality.value || 92) / 100);
    });
  }

  function downloadOutput() {
    if (!outputUrl) return;
    var link = document.createElement('a');
    link.href = outputUrl;
    link.download = 'afrotools-' + slug(getSpec().label) + '-' + slug(els.layout.value) + '.' + getFormatExt();
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function copyBrief() {
    var spec = getSpec();
    var brief = [
      'AfroTools Passport Photo Studio',
      'Requirement: ' + spec.label,
      'Size: ' + spec.widthMm + ' x ' + spec.heightMm + ' mm',
      'Head range: ' + (spec.headMinMm && spec.headMaxMm ? spec.headMinMm + ' to ' + spec.headMaxMm + ' mm' : 'check authority'),
      'Background: ' + spec.backgroundLabel,
      'Copies: ' + spec.copies,
      'Source: ' + spec.sourceLabel + (spec.sourceUrl ? ' - ' + spec.sourceUrl : ''),
      'Output: ' + layoutLabel() + ', ' + getFormatExt().toUpperCase() + ', 300 DPI',
      'Reminder: verify current official guidance before submitting passport or visa photos.'
    ].join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(brief).then(function () {
        setStatus('Requirement brief copied.');
      }).catch(function () {
        setStatus('Clipboard copy failed.');
      });
    } else {
      setStatus('Clipboard is not available in this browser.');
    }
  }

  function updateButtons() {
    var hasPhoto = !!sourceRecord;
    els.renderBtn.disabled = !hasPhoto;
    els.copyBtn.disabled = !hasPhoto;
    els.downloadBtn.disabled = !outputBlob;
  }

  function loadSettings() {
    var settings = {};
    try { settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') || {}; } catch (error) { settings = {}; }
    els.specSelect.value = settings.spec || 'za-passport';
    els.background.value = settings.background || '#ffffff';
    els.zoom.value = settings.zoom || '100';
    els.offsetX.value = settings.offsetX || '0';
    els.offsetY.value = settings.offsetY || '0';
    els.rotation.value = settings.rotation || '0';
    els.showGuides.checked = settings.showGuides !== false;
    els.layout.value = settings.layout || 'sheet-4x6';
    els.format.value = settings.format || 'image/jpeg';
    els.quality.value = settings.quality || '92';
  }

  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        spec: els.specSelect.value,
        background: els.background.value,
        zoom: els.zoom.value,
        offsetX: els.offsetX.value,
        offsetY: els.offsetY.value,
        rotation: els.rotation.value,
        showGuides: els.showGuides.checked,
        layout: els.layout.value,
        format: els.format.value,
        quality: els.quality.value
      }));
    } catch (error) {}
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
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (error) {}
    updateHistory();
  }

  function updateHistory() {
    if (!history.length) {
      els.historyList.innerHTML = '<div class="pp-history-item">Recent passport photo exports will appear here.</div>';
      return;
    }
    els.historyList.innerHTML = history.map(function (item) {
      return '<div class="pp-history-item"><strong>' + esc(item.label) + '</strong><br>' + esc(item.details) + '</div>';
    }).join('');
  }

  function loadChecklist() {
    var checked = {};
    try { checked = JSON.parse(localStorage.getItem(CHECK_KEY) || '{}') || {}; } catch (error) { checked = {}; }
    els.checkRows.forEach(function (input) {
      input.checked = !!checked[input.value];
    });
  }

  function saveChecklist() {
    var checked = {};
    els.checkRows.forEach(function (input) {
      checked[input.value] = input.checked;
    });
    try { localStorage.setItem(CHECK_KEY, JSON.stringify(checked)); } catch (error) {}
  }

  function updateChecklistScore() {
    var total = els.checkRows.length || 1;
    var done = els.checkRows.filter(function (input) { return input.checked; }).length;
    var pct = Math.round(done / total * 100);
    els.scoreText.textContent = done + ' of ' + total + ' checks complete';
    els.scoreBar.style.setProperty('--score', pct + '%');
  }

  function clearOutput() {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = '';
    outputBlob = null;
    els.outputBytes.textContent = '-';
  }

  function clearObjectUrls() {
    clearOutput();
    if (sourceRecord && sourceRecord.url) URL.revokeObjectURL(sourceRecord.url);
  }

  function layoutLabel() {
    var option = els.layout.options[els.layout.selectedIndex];
    return option ? option.textContent : els.layout.value;
  }

  function getFormatExt() {
    return els.format.value === 'image/png' ? 'png' : els.format.value === 'image/webp' ? 'webp' : 'jpg';
  }

  function mmToPx(mm) {
    return Math.round(mm * PX_PER_MM);
  }

  function formatBytes(bytes) {
    if (!bytes && bytes !== 0) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function slug(value) {
    return String(value || 'photo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'photo';
  }

  function esc(value) {
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function setStatus(message) {
    els.status.textContent = message;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
