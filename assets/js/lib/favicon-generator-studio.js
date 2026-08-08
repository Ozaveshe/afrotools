(function () {
  'use strict';

  const sw = document.documentElement.lang === 'sw';
  const copy = {
    choose: sw ? 'Chagua faili ya picha ya PNG, JPG au WebP.' : 'Choose a PNG, JPG, or WebP image.',
    invalid: sw ? 'Chagua faili halali ya picha ya PNG, JPG au WebP.' : 'Choose a valid PNG, JPG, or WebP image file.',
    decoded: sw ? 'Picha hii haikuweza kufunguliwa. Chagua PNG, JPG au WebP nyingine.' : 'This image could not be decoded. Choose another PNG, JPG, or WebP file.',
    unreadable: sw ? 'Picha hii haikuweza kusomwa. Chagua faili nyingine.' : 'This image could not be read. Choose another file.',
    ready: name => sw ? `${name} iko tayari. Tengeneza saizi za favicon.` : `${name} is ready. Generate your favicon sizes.`,
    generated: sw ? 'Favicon zimetengenezwa kwa saizi nne. ZIP yenye PNG, ICO na manifest iko tayari.' : 'Favicons generated in four sizes. Your PNG, ICO, and manifest ZIP is ready to download.',
    reset: sw ? 'Studio imerejeshwa. Chagua picha au tumia maandishi/emoji.' : 'Studio reset. Choose an image or use text/emoji.',
    failed: sw ? 'Imeshindwa kutengeneza ZIP ya favicon. Jaribu tena.' : 'Failed to generate favicon ZIP. Please try again.'
  };
  const modeButtons = [...document.querySelectorAll('.mode-btn')];
  const imageMode = document.getElementById('imageMode');
  const textMode = document.getElementById('textMode');
  const uploadArea = document.getElementById('uploadArea');
  const imageInput = document.getElementById('imageInput');
  const textInput = document.getElementById('textInput');
  const bgColor = document.getElementById('bgColor');
  const textColor = document.getElementById('textColor');
  const generateBtn = document.getElementById('generateBtn');
  const resetBtn = document.getElementById('resetBtn');
  const previewCard = document.getElementById('previewCard');
  const faviconGrid = document.getElementById('faviconGrid');
  const downloadBtn = document.getElementById('downloadBtn');
  const faviconStatus = document.getElementById('faviconStatus');
  const sizes = [16, 32, 48, 64];
  const canvases = new Map();
  let currentMode = 'image';
  let sourceImage = null;

  function setStatus(value) { faviconStatus.textContent = value; }
  function clearOutput() {
    canvases.clear();
    faviconGrid.replaceChildren();
    previewCard.classList.remove('on');
  }
  function setMode(mode) {
    currentMode = mode;
    modeButtons.forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('on', active);
      button.setAttribute('aria-pressed', String(active));
    });
    imageMode.hidden = mode !== 'image';
    textMode.hidden = mode !== 'text';
    imageMode.style.display = mode === 'image' ? 'block' : 'none';
    textMode.style.display = mode === 'text' ? 'block' : 'none';
    generateBtn.disabled = mode === 'image' ? !sourceImage : !textInput.value.trim();
    clearOutput();
  }
  function handleImageUpload() {
    const file = imageInput.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      sourceImage = null;
      generateBtn.disabled = true;
      setStatus(copy.invalid);
      return;
    }
    const reader = new FileReader();
    reader.onload = event => {
      const image = new Image();
      image.onload = () => {
        sourceImage = image;
        generateBtn.disabled = false;
        setStatus(copy.ready(file.name));
      };
      image.onerror = () => {
        sourceImage = null;
        generateBtn.disabled = true;
        setStatus(copy.decoded);
      };
      image.src = event.target.result;
    };
    reader.onerror = () => {
      sourceImage = null;
      generateBtn.disabled = true;
      setStatus(copy.unreadable);
    };
    reader.readAsDataURL(file);
  }
  function paint(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    if (!context) throw new Error(`No 2D canvas context for ${size}`);
    if (currentMode === 'image' && sourceImage) context.drawImage(sourceImage, 0, 0, size, size);
    else {
      context.fillStyle = bgColor.value;
      context.fillRect(0, 0, size, size);
      context.fillStyle = textColor.value;
      context.font = `bold ${size * 0.6}px Arial`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(textInput.value, size / 2, size / 2);
    }
    return canvas;
  }
  function canvasBlob(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encode failed')), 'image/png'));
  }
  async function buildIco(entries) {
    const pngs = await Promise.all(entries.map(async ([size, canvas]) => ({ size, bytes: new Uint8Array(await (await canvasBlob(canvas)).arrayBuffer()) })));
    const headerLength = 6 + pngs.length * 16;
    const total = headerLength + pngs.reduce((sum, item) => sum + item.bytes.length, 0);
    const bytes = new Uint8Array(total);
    const view = new DataView(bytes.buffer);
    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true);
    view.setUint16(4, pngs.length, true);
    let offset = headerLength;
    pngs.forEach((item, index) => {
      const entry = 6 + index * 16;
      bytes[entry] = item.size === 256 ? 0 : item.size;
      bytes[entry + 1] = item.size === 256 ? 0 : item.size;
      bytes[entry + 2] = 0;
      bytes[entry + 3] = 0;
      view.setUint16(entry + 4, 1, true);
      view.setUint16(entry + 6, 32, true);
      view.setUint32(entry + 8, item.bytes.length, true);
      view.setUint32(entry + 12, offset, true);
      bytes.set(item.bytes, offset);
      offset += item.bytes.length;
    });
    return new Blob([bytes], { type: 'image/x-icon' });
  }
  function manifest() {
    return JSON.stringify({
      name: 'Website favicon',
      short_name: 'Favicon',
      icons: sizes.map(size => ({ src: `favicon-${size}x${size}.png`, sizes: `${size}x${size}`, type: 'image/png' })),
      theme_color: bgColor.value,
      background_color: bgColor.value,
      display: 'standalone'
    }, null, 2);
  }
  function generate() {
    clearOutput();
    sizes.forEach(size => {
      const canvas = paint(size);
      canvases.set(size, canvas);
      const item = document.createElement('div');
      item.className = 'favicon-item';
      const preview = document.createElement('canvas');
      preview.width = 80;
      preview.height = 80;
      preview.setAttribute('aria-label', `${size} x ${size}`);
      preview.getContext('2d').drawImage(canvas, 0, 0, 80, 80);
      const label = document.createElement('div');
      label.className = 'favicon-size';
      label.textContent = `${size}x${size}`;
      item.append(preview, label);
      faviconGrid.appendChild(item);
    });
    previewCard.classList.add('on');
    setStatus(copy.generated);
  }
  async function downloadArchive() {
    const zip = new JSZip();
    const entries = [...canvases.entries()];
    if (!entries.length) return;
    try {
      await Promise.all(entries.map(async ([size, canvas]) => zip.file(`favicon-${size}x${size}.png`, await canvasBlob(canvas))));
      zip.file('favicon.ico', await buildIco(entries));
      zip.file('site.webmanifest', manifest());
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'favicons.zip';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url));
    } catch (error) {
      console.error('Error creating favicon ZIP:', error);
      setStatus(copy.failed);
    }
  }
  function reset() {
    sourceImage = null;
    imageInput.value = '';
    textInput.value = '';
    bgColor.value = '#0062cc';
    textColor.value = '#ffffff';
    setMode('image');
    setStatus(copy.reset);
  }

  modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  uploadArea.addEventListener('click', () => imageInput.click());
  uploadArea.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); imageInput.click(); } });
  uploadArea.addEventListener('dragover', event => { event.preventDefault(); uploadArea.classList.add('active'); });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('active'));
  uploadArea.addEventListener('drop', event => {
    event.preventDefault();
    uploadArea.classList.remove('active');
    if (event.dataTransfer.files.length) { imageInput.files = event.dataTransfer.files; handleImageUpload(); }
  });
  imageInput.addEventListener('change', handleImageUpload);
  textInput.addEventListener('input', () => { generateBtn.disabled = !textInput.value.trim(); clearOutput(); });
  generateBtn.addEventListener('click', generate);
  downloadBtn.addEventListener('click', downloadArchive);
  resetBtn.addEventListener('click', reset);
  setStatus(copy.choose);
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.faviconStudio = { generate, reset, getSizes: () => [...sizes], manifest };
}());
