const { test, expect } = require('@playwright/test');

async function installSyntheticDevices(page) {
  await page.addInitScript(() => {
    const retained = [];

    function audioStream() {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContextCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      oscillator.frequency.value = 440;
      gain.gain.value = 0.08;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      retained.push({ context, oscillator });
      return destination.stream;
    }

    function videoStream(withAudio) {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const context = canvas.getContext('2d');
      let frame = 0;
      const paint = () => {
        context.fillStyle = frame % 2 ? '#0057b8' : '#f4a261';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#fff';
        context.font = '24px sans-serif';
        context.fillText(`AfroTools ${frame}`, 48, 96);
        frame += 1;
      };
      paint();
      const timer = setInterval(paint, 60);
      const stream = canvas.captureStream(15);
      if (withAudio) {
        audioStream().getAudioTracks().forEach((track) => stream.addTrack(track));
      }
      stream.getVideoTracks()[0].addEventListener('ended', () => clearInterval(timer), { once: true });
      retained.push({ canvas, timer });
      return stream;
    }

    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        enumerateDevices: async () => [
          { kind: 'audioinput', deviceId: 'synthetic-mic', label: 'Synthetic microphone' },
          { kind: 'videoinput', deviceId: 'synthetic-camera', label: 'Synthetic camera' },
        ],
        getUserMedia: async (constraints) =>
          constraints && constraints.video ? videoStream(Boolean(constraints.audio)) : audioStream(),
        getDisplayMedia: async () => videoStream(true),
      },
    });
    window.__day9SyntheticMedia = retained;
    localStorage.setItem('afrotools_cookie_consent', 'declined');
  });
}

async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function reopenMedia(page, bytes, kind, mimeType) {
  const base64 = bytes.toString('base64');
  return page.evaluate(
    async ({ payload, elementKind, type }) => {
      const binary = atob(payload);
      const data = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) data[index] = binary.charCodeAt(index);
      const media = document.createElement(elementKind);
      media.preload = 'metadata';
      const url = URL.createObjectURL(new Blob([data], { type }));
      media.src = url;
      document.body.appendChild(media);
      const result = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('codec metadata timeout')), 8000);
        media.onloadedmetadata = () => {
          clearTimeout(timer);
          resolve({
            duration: media.duration,
            width: media.videoWidth || 0,
            height: media.videoHeight || 0,
          });
        };
        media.onerror = () => {
          clearTimeout(timer);
          reject(new Error(`codec reopen failed: ${media.error && media.error.message}`));
        };
      });
      URL.revokeObjectURL(url);
      media.remove();
      return result;
    },
    { payload: base64, elementKind: kind, type: mimeType },
  );
}

async function makeSyntheticWebm(page) {
  const base64 = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext('2d');
    const stream = canvas.captureStream(15);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    recorder.start(100);
    for (let frame = 0; frame < 18; frame += 1) {
      context.fillStyle = frame % 2 ? '#0057b8' : '#f4a261';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#fff';
      context.font = '24px sans-serif';
      context.fillText(`Clip ${frame}`, 90, 96);
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result).split(',')[1]);
      reader.readAsDataURL(new Blob(chunks, { type: 'video/webm' }));
    });
  });
  return Buffer.from(base64, 'base64');
}

test('CreatorRecord captures, downloads, and reopens synthetic device audio', async ({ page }) => {
  test.setTimeout(45_000);
  await installSyntheticDevices(page);
  await page.goto('/tools/creator-record/app', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-mode="audio"]').click();
  await page.locator('#countdownToggle').click();
  await page.locator('#recordBtn').click();
  await expect(page.locator('#stopBtn')).toBeEnabled();
  await page.waitForTimeout(900);
  await page.locator('#stopBtn').click();
  await expect(page.locator('#exportPanel')).toHaveClass(/visible/);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#downloadBtn').click();
  const download = await downloadPromise;
  const bytes = await readDownload(download);
  expect(bytes.length).toBeGreaterThan(1_000);
  expect(bytes.subarray(0, 4).toString('hex')).toBe('1a45dfa3');
  const reopened = await reopenMedia(page, bytes, 'audio', 'audio/webm');
  expect(reopened.duration).toBeGreaterThan(0);
});

test('CreatorVoice captures synthetic microphone audio and exports a valid WAV', async ({ page }) => {
  test.setTimeout(45_000);
  await installSyntheticDevices(page);
  await page.goto('/tools/creator-voice/app', { waitUntil: 'domcontentloaded' });
  await page.locator('#recordBtn').click();
  await expect(page.locator('#stopBtn')).toBeEnabled();
  await page.waitForTimeout(900);
  await page.locator('#stopBtn').click();
  await expect(page.locator('#editView')).toHaveClass(/active/);
  await page.locator('#exportFormat').selectOption('wav');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#exportBtn').click();
  const download = await downloadPromise;
  const bytes = await readDownload(download);
  expect(bytes.length).toBeGreaterThan(1_000);
  expect(bytes.subarray(0, 4).toString()).toBe('RIFF');
  expect(bytes.subarray(8, 12).toString()).toBe('WAVE');
  const reopened = await reopenMedia(page, bytes, 'audio', 'audio/wav');
  expect(reopened.duration).toBeGreaterThan(0);
});

test('CreatorClip imports, exports, and reopens a synthetic WebM clip', async ({ page }) => {
  test.setTimeout(60_000);
  await installSyntheticDevices(page);
  await page.goto('/tools/creator-clip/app', { waitUntil: 'domcontentloaded' });
  const inputBytes = await makeSyntheticWebm(page);
  await page.locator('#fileInput').setInputFiles({
    name: 'synthetic-clip.webm',
    mimeType: 'video/webm',
    buffer: inputBytes,
  });
  await expect(page.locator('#editor')).toHaveClass(/active/);
  await page.locator('[data-tab="export"]').click();
  const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
  await page.locator('#exportBtn').click();
  const download = await downloadPromise;
  const bytes = await readDownload(download);
  expect(bytes.length).toBeGreaterThan(1_000);
  expect(bytes.subarray(0, 4).toString('hex')).toBe('1a45dfa3');
  const reopened = await reopenMedia(page, bytes, 'video', 'video/webm');
  expect(reopened.duration).toBeGreaterThan(0);
  expect(reopened.width).toBeGreaterThan(0);
  expect(reopened.height).toBeGreaterThan(0);
});
