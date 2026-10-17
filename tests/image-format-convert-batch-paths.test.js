const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const JSZip = require('jszip');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/lib/image-format-convert-studio.js'), 'utf8');

// Exercise the actual owner through its UI handlers. Only DOM/codec/URL/storage
// are simulated: archive creation and reopened entries use the installed JSZip.
class Element {
  constructor(value = '') {
    this.value = value; this.listeners = {}; this.dataset = {};
    this.classList = { add() {}, remove() {}, toggle() {} };
    this.textContent = ''; this.innerHTML = ''; this.disabled = false; this.checked = false;
  }
  addEventListener(type, callback) { (this.listeners[type] ||= []).push(callback); }
  setAttribute() {} closest() { return null; } remove() {}
  fire(type) { for (const fn of this.listeners[type] || []) fn({}); }
  click() { this.fire('click'); }
}
const tick = () => new Promise(resolve => setImmediate(resolve));
async function until(check) {
  for (let count = 0; count < 1000; count++) {
    if (check()) return;
    await tick();
  }
  throw new Error('Bounded synthetic UI operation did not finish');
}
async function studio(names, selectedFormats = ['image/png'], suffix = 'test') {
  const ids = new Map();
  const get = id => { if (!ids.has(id)) ids.set(id, new Element()); return ids.get(id); };
  const formats = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].map(value => new Element(value));
  const init = [], downloads = [];
  let zipBlob, nextUrl = 0;
  function LocalZip() {
    const zip = new JSZip(), generate = zip.generateAsync.bind(zip);
    zip.generateAsync = options => generate(options).then(blob => { zipBlob = blob; return blob; });
    return zip;
  }
  const document = {
    readyState: 'loading', getElementById: get,
    querySelectorAll: selector => selector === '[data-ifc-format]' ? formats : [],
    addEventListener: (type, fn) => { if (type === 'DOMContentLoaded') init.push(fn); },
    body: { appendChild() {} },
    createElement: tag => {
      if (tag !== 'canvas') {
        const element = new Element();
        element.click = () => downloads.push({ name: element.download, href: element.href });
        return element;
      }
      const canvas = {
        width: 0, height: 0, marker: 'capability',
        getContext() {
          return { fillRect() {}, clearRect() {}, drawImage(image) { canvas.marker = image.marker; } };
        },
        toBlob(callback, mime) {
          const bytes = Buffer.from(JSON.stringify({ marker: canvas.marker, mime, width: canvas.width, height: canvas.height }));
          bytes.type = mime; bytes.size = bytes.length; callback(bytes);
        }
      };
      return canvas;
    }
  };
  const storage = new Map();
  const context = {
    document, localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    navigator: {}, URL: { createObjectURL: () => 'blob:synthetic-' + (++nextUrl), revokeObjectURL() {} },
    JSZip: LocalZip, createImageBitmap: file => Promise.resolve({ width: 4, height: 4, marker: file.marker }),
    Promise, Date, Buffer, setTimeout
  };
  context.window = context; context.addEventListener = () => {};
  vm.runInNewContext(source, context, { filename: 'actual-image-format-convert-studio.js', timeout: 1000 });
  assert.equal(init.length, 1); init[0]();
  await until(() => get('ifcStatus').textContent === 'Ready. Choose images to convert locally.');
  for (const input of formats) input.checked = selectedFormats.includes(input.value);
  formats.find(input => input.checked).fire('change');
  get('ifcScale').value = '100'; get('ifcMaxWidth').value = ''; get('ifcMaxHeight').value = ''; get('ifcSuffix').value = suffix;
  get('ifcInput').files = names.map((name, index) => ({ name, type: 'image/png', size: 20, marker: 'SOURCE-' + (index + 1) }));
  get('ifcInput').fire('change');
  return {
    async batch() {
      get('ifcStatus').textContent = ''; zipBlob = null;
      get('ifcConvertAll').click();
      await until(() => get('ifcStatus').textContent === 'Batch zip is ready.');
      return JSZip.loadAsync(await zipBlob.arrayBuffer());
    },
    async currentDownload() {
      get('ifcConvertCurrent').click();
      await until(() => get('ifcStatus').textContent === 'Current image converted.');
      get('ifcDownloadCurrent').click();
      return downloads.at(-1);
    }
  };
}
async function verifyArchive(zip, names, mimeTypes) {
  const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  assert.equal(manifest.files.length, names.length);
  assert.deepEqual(manifest.files.map(file => file.source), names);
  const paths = manifest.files.flatMap(file => file.outputs.map(output => output.name));
  assert.equal(paths.length, names.length * mimeTypes.length);
  assert.equal(new Set(paths).size, paths.length, 'Every manifest output needs its own archive path');
  const actualPaths = Object.keys(zip.files).filter(name => !zip.files[name].dir && name !== 'manifest.json');
  assert.deepEqual(actualPaths.sort(), paths.slice().sort(), 'No overwritten or orphaned image entries');
  for (const [index, file] of manifest.files.entries()) {
    assert.deepEqual(file.outputs.map(output => output.type).sort(), mimeTypes.slice().sort());
    for (const output of file.outputs) {
      const bytes = await zip.file(output.name).async('nodebuffer');
      assert.equal(bytes.length, output.bytes);
      assert.deepEqual(JSON.parse(bytes.toString()), { marker: 'SOURCE-' + (index + 1), mime: output.type, width: 4, height: 4 });
    }
  }
  return paths;
}

test('distinct batch paths and standalone filename remain unchanged', async () => {
  const ui = await studio(['one.png', 'two.png']);
  assert.deepEqual(await verifyArchive(await ui.batch(), ['one.png', 'two.png'], ['image/png']), ['png/one-test.png', 'png/two-test.png']);
  assert.equal((await ui.currentDownload()).name, 'one-test.png');
});
test('same source basenames retain every distinct payload and manifest join', async () => {
  const names = ['photo.png', 'photo.png'];
  assert.deepEqual(await verifyArchive(await (await studio(names)).batch(), names, ['image/png']), ['png/photo-test.png', 'png/photo-test-2.png']);
});
test('case and punctuation normalization collisions retain every payload', async () => {
  const names = ['Photo A.png', 'photo-A.png', 'photo_a.png'];
  await verifyArchive(await (await studio(names)).batch(), names, ['image/png']);
});
test('already numbered source bases cannot overwrite allocated paths', async () => {
  const names = ['photo.png', 'photo.png', 'photo-2.png', 'photo-2.png', 'photo.png'];
  // Numeric suffix makes an original numbered base collide with an allocated name.
  await verifyArchive(await (await studio(names, ['image/png'], '2')).batch(), names, ['image/png']);
});
test('repeated collisions remain unique independently in each format folder', async () => {
  const names = ['Photo A.png', 'photo-A.png', 'photo_a.png', 'Photo A.png'];
  const mimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  await verifyArchive(await (await studio(names, mimeTypes)).batch(), names, mimeTypes);
});
test('archive reservations reset for a repeated batch invocation', async () => {
  const names = ['photo.png', 'photo.png'], ui = await studio(names);
  const first = await verifyArchive(await ui.batch(), names, ['image/png']);
  const second = await verifyArchive(await ui.batch(), names, ['image/png']);
  assert.deepEqual(second, first);
});
