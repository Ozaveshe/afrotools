const { test, expect } = require('@playwright/test');

const MEDIA_ROUTES = process.env.FR_CREATIVE_MEDIA === '1'
  ? {
      record: '/fr/tools/enregistrement-pour-createur/app',
      voice: '/fr/tools/voix-de-marque-du-createur/app',
      clip: '/fr/tools/decoupe-de-video-pour-createur/app',
    }
  : {
      record: '/tools/creator-record/app',
      voice: '/tools/creator-voice/app',
      clip: '/tools/creator-clip/app',
    };

async function installSyntheticDevices(page) {
  await page.addInitScript(() => {
    const retained = [];

    async function audioStream() {
      const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContextCtor();
      if (context.state === 'suspended') await context.resume();
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

    async function videoStream(withAudio) {
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
        const audio = await audioStream();
        audio.getAudioTracks().forEach((track) => stream.addTrack(track));
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
          constraints && constraints.video
            ? await videoStream(Boolean(constraints.audio))
            : await audioStream(),
        getDisplayMedia: async () => await videoStream(true),
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
    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve;
    });
    let resolveFirstChunk;
    const firstChunk = new Promise((resolve) => {
      resolveFirstChunk = resolve;
    });
    recorder.ondataavailable = (event) => {
      if (!event.data.size) return;
      chunks.push(event.data);
      resolveFirstChunk();
    };
    recorder.start(200);
    for (let frame = 0; frame < 30; frame += 1) {
      context.fillStyle = frame % 2 ? '#0057b8' : '#f4a261';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#fff';
      context.font = '24px sans-serif';
      context.fillText(`Clip ${frame}`, 90, 96);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    recorder.requestData();
    await Promise.race([
      firstChunk,
      new Promise((_, reject) => setTimeout(
        () => reject(new Error('synthetic WebM produced no data')),
        8_000,
      )),
    ]);
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
  test.setTimeout(90_000);
  await installSyntheticDevices(page);
  await page.goto(MEDIA_ROUTES.record, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-mode="audio"]').click();
  await page.locator('#countdownToggle').click();
  await page.locator('#recordBtn').click();
  await expect(page.locator('#stopBtn')).toBeEnabled();
  await page.waitForTimeout(1_800);
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
  test.setTimeout(90_000);
  await installSyntheticDevices(page);
  await page.goto(MEDIA_ROUTES.voice, { waitUntil: 'domcontentloaded' });
  await page.locator('#recordBtn').click();
  await expect(page.locator('#stopBtn')).toBeEnabled();
  await page.waitForTimeout(1_800);
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
  test.setTimeout(90_000);
  await installSyntheticDevices(page);
  await page.goto(MEDIA_ROUTES.clip, { waitUntil: 'domcontentloaded' });
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

if (process.env.FR_CREATIVE_MEDIA === '1') {
  for (const [id, route] of Object.entries(MEDIA_ROUTES)) {
    test(`French Creator ${id} workspace has native locale, privacy, and reflow`, async ({ page }) => {
      const errors = [];
      const unsafeRequests = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (request.method() !== 'GET' && /supabase|capture-lead|\/api\//i.test(request.url())) {
          unsafeRequests.push(`${request.method()} ${request.url()}`);
        }
      });
      await installSyntheticDevices(page);
      await page.setViewportSize({ width: id === 'voice' ? 320 : 375, height: 844 });
      await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/fr\/tools\/.+\/app$/);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
      await expect(page.locator('body')).toContainText(/Enregistrer|Exporter|Modifier|Nouvelle vidéo/i);
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.style.fontSize = '200%';
      });
      const audit = await page.evaluate(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const controls = Array.from(document.querySelectorAll('button,input,select,textarea')).filter(visible);
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          unnamed: controls.filter((control) => !(
            (control.textContent || '').trim()
            || control.getAttribute('aria-label')
            || control.getAttribute('title')
            || (control.labels && Array.from(control.labels).some((label) => label.textContent.trim()))
          )).length,
        };
      });
      expect(audit.overflow).toBeLessThanOrEqual(1);
      expect(audit.unnamed).toBe(0);
      expect(unsafeRequests).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}
