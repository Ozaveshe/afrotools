const { test, expect } = require("@playwright/test");

const route = "/sw/zana/rekodi-na-hariri-sauti/";
const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173").origin;

async function installSyntheticMicrophone(page) {
  await page.addInitScript(() => {
    const NativeMediaRecorder = window.MediaRecorder;
    window.__voiceRecorderOptions = [];
    window.MediaRecorder = new Proxy(NativeMediaRecorder, {
      construct(Target, args) {
        window.__voiceRecorderOptions.push(args[1] || {});
        return Reflect.construct(Target, args);
      },
    });
    const makeAudio = () => {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      const context = new AudioCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      oscillator.frequency.value = 440;
      gain.gain.value = 0.08;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      destination.stream.getTracks().forEach((track) => track.addEventListener("ended", () => {
        try { oscillator.stop(); } catch (_) {}
        context.close();
      }, { once: true }));
      return destination.stream;
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: async () => [{ kind: "audioinput", deviceId: "synthetic-mic", label: "Maikrofoni ya majaribio" }],
        getUserMedia: async () => {
          if (window.__rejectNextMic) {
            window.__rejectNextMic = false;
            throw new DOMException("synthetic permission denial", "NotAllowedError");
          }
          return makeAudio();
        },
      },
    });
  });
}

function diagnostics(page) {
  const errors = [];
  const writes = [];
  const external = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    const target = new URL(request.url());
    if (target.origin !== localOrigin) external.push(request.url());
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) writes.push(`${request.method()} ${request.url()}`);
  });
  return { errors, writes, external };
}

async function readDownload(download) {
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function parseWebM(buffer) {
  expect(buffer.length).toBeGreaterThan(300);
  expect(buffer.subarray(0, 4)).toEqual(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  const binary = buffer.toString("latin1");
  expect(binary).toContain("webm");
  expect(["A_OPUS", "A_VORBIS"].some((codec) => binary.includes(codec))).toBeTruthy();
}

function parseWav(buffer) {
  expect(buffer.length).toBeGreaterThan(44);
  expect(buffer.subarray(0, 4).toString()).toBe("RIFF");
  expect(buffer.subarray(8, 12).toString()).toBe("WAVE");
  expect(buffer.readUInt32LE(4) + 8).toBe(buffer.length);
}

test("Swahili CreatorVoice records, reopens, edits, exports and restores a local project", async ({ page }) => {
  const seen = diagnostics(page);
  await installSyntheticMicrophone(page);
  await page.setViewportSize({ width: 375, height: 820 });
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response && response.ok()).toBeTruthy();
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('meta[name="afrotools-sw-source-owner"]')).toHaveAttribute("content", "scripts/build-sw-creator-voice-final.js");
  await expect(page.locator(".cvo-mode-tab")).toHaveText(["Rekodi", "Hariri", "Maktaba"]);
  await expect(page.locator("#exportFormat option[value=mp3]")).toBeDisabled();

  await page.evaluate(() => {
    window.__voiceBlob = null;
    window.addEventListener("creatorvoice:recording-ready", (event) => { window.__voiceBlob = event.detail.blob; }, { once: true });
  });
  await page.locator("#recordBtn").click();
  await page.waitForTimeout(750);
  await page.locator("#pauseBtn").click();
  await page.waitForTimeout(120);
  await page.locator("#pauseBtn").click();
  await page.waitForTimeout(350);
  await page.locator("#stopBtn").click();
  await expect(page.locator("#editorPanel")).toBeVisible();
  await expect(page.locator("#toast")).toContainText("Rekodi iko tayari kuhaririwa");
  expect(await page.evaluate(() => window.__voiceRecorderOptions[0].mimeType)).toMatch(/^audio\/webm/);

  const recorded = await page.evaluate(async () => {
    const blob = window.__voiceBlob;
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.src = url;
    await new Promise((resolve, reject) => {
      audio.addEventListener("loadedmetadata", resolve, { once: true });
      audio.addEventListener("error", reject, { once: true });
    });
    const bytes = Array.from(new Uint8Array(await blob.arrayBuffer()));
    const result = { bytes, type: blob.type, duration: audio.duration, readyState: audio.readyState };
    URL.revokeObjectURL(url);
    return result;
  });
  expect(recorded.type).toMatch(/^audio\/webm/);
  expect(recorded.readyState).toBeGreaterThanOrEqual(1);
  expect(recorded.duration).toBeGreaterThan(0);
  parseWebM(Buffer.from(recorded.bytes));

  await page.locator("#normalizeBtn").click();
  await expect(page.locator("#toast")).toContainText(/Sauti (ime|tayari)/);
  await page.locator("#reverseBtn").click();
  await expect(page.locator("#toast")).toContainText("Sauti imegeuzwa");
  await page.locator("#undoBtn").click();
  await expect(page.locator("#toast")).toHaveText("Imetenduliwa");
  await page.locator("#redoBtn").click();
  await expect(page.locator("#toast")).toHaveText("Imerudiwa");
  await page.locator('[data-track="0"] [data-action="mute"]').click();
  await expect(page.locator('[data-track="0"] [data-action="mute"]')).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-track="0"] [data-action="mute"]').click();

  await page.locator("#projectName").fill("Mradi wa majaribio");
  await page.locator("#saveBtn").click();
  await expect(page.locator("#toast")).toContainText("Mradi umehifadhiwa:");

  await page.locator("#exportFormat").selectOption("wav");
  let pending = page.waitForEvent("download");
  await page.locator("#exportBtn").click();
  let download = await pending;
  expect(download.suggestedFilename()).toBe("Mradi wa majaribio.wav");
  parseWav(await readDownload(download));

  await page.locator("#exportFormat").selectOption("webm");
  pending = page.waitForEvent("download", { timeout: 10000 });
  await page.locator("#exportBtn").click();
  download = await pending;
  expect(download.suggestedFilename()).toBe("Mradi wa majaribio.webm");
  const webm = await readDownload(download);
  parseWebM(webm);

  const oggSupported = await page.evaluate(() => MediaRecorder.isTypeSupported("audio/ogg;codecs=opus") || MediaRecorder.isTypeSupported("audio/ogg"));
  await page.locator("#exportFormat").selectOption("ogg");
  pending = page.waitForEvent("download", { timeout: 10000 });
  await page.locator("#exportBtn").click();
  download = await pending;
  const oggOrFallback = await readDownload(download);
  if (oggSupported) {
    expect(download.suggestedFilename()).toBe("Mradi wa majaribio.ogg");
    expect(oggOrFallback.subarray(0, 4).toString()).toBe("OggS");
  } else {
    expect(download.suggestedFilename()).toBe("Mradi wa majaribio.wav");
    parseWav(oggOrFallback);
  }

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#projectsBtn").click();
  await expect(page.locator(".cvo-project-item")).toHaveCount(1);
  await page.locator(".cvo-project-item").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#editorPanel")).toBeVisible();
  await expect(page.locator("#projectName")).toHaveValue("Mradi wa majaribio");
  await page.locator("#projectsBtn").click();
  await page.locator(".cvo-project-item-del").click();
  await expect(page.locator("#toast")).toHaveText("Mradi umefutwa");

  expect(seen.writes).toEqual([]);
  expect(seen.external).toEqual([]);
  expect(seen.errors).toEqual([]);
});

test("Swahili CreatorVoice fails closed and reflows at small widths", async ({ page }) => {
  await installSyntheticMicrophone(page);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => { document.getElementById("exportBtn").click(); });
  await expect(page.locator("#toast")).toHaveText("Hakuna sauti ya kupakua");
  await page.evaluate(() => { window.__rejectNextMic = true; });
  await page.locator("#recordBtn").click();
  await expect(page.locator("#toast")).toContainText("Ruhusa ya maikrofoni imekataliwa:");

  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 820 });
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    const overflow = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client + 1);
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = "100%"; });
  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
    await expect(page.locator("#recordBtn")).toBeVisible();
  }
  await page.locator('[data-view="edit"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#editView")).toHaveClass(/active/);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#recordView")).toHaveClass(/active/);
  await expect(page.locator("#timer")).toHaveText("00:00");
});

test("English CreatorVoice retains its workspace fixtures", async ({ page }) => {
  await installSyntheticMicrophone(page);
  await page.goto("/tools/creator-voice/app", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".cvo-mode-tab")).toHaveText(["Record", "Edit", "Library"]);
  await expect(page.locator("#saveBtn")).toContainText("Save");
  await expect(page.locator("#exportBtn")).toHaveText("Export & Download");
  await expect(page.locator(".cvo-track-lane")).toHaveCount(3);
});
