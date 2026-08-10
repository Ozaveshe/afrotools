const { test, expect } = require("@playwright/test");

const route = "/sw/zana/kirekodi-skrini/";
const localOrigin = new URL(process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:4173").origin;

async function installSyntheticMedia(page) {
  await page.addInitScript(() => {
    const NativeMediaRecorder = window.MediaRecorder;
    window.__recorderOptions = [];
    window.MediaRecorder = new Proxy(NativeMediaRecorder, {
      construct(Target, args) {
        window.__recorderOptions.push(args[1] || {});
        return Reflect.construct(Target, args);
      },
    });
    const makeVideo = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 360;
      const context = canvas.getContext("2d");
      let frame = 0;
      const draw = () => {
        context.fillStyle = frame % 2 ? "#0ea5e9" : "#0f172a";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#ffffff";
        context.font = "32px sans-serif";
        context.fillText(`AfroTools synthetic frame ${frame++}`, 32, 72);
      };
      draw();
      const timer = setInterval(draw, 80);
      const stream = canvas.captureStream(24);
      stream.getTracks().forEach((track) => track.addEventListener("ended", () => clearInterval(timer), { once: true }));
      return stream;
    };
    const makeAudio = () => {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return new MediaStream();
      const context = new AudioCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const destination = context.createMediaStreamDestination();
      gain.gain.value = 0.02;
      oscillator.connect(gain).connect(destination);
      oscillator.start();
      destination.stream.getTracks().forEach((track) => track.addEventListener("ended", () => {
        oscillator.stop();
        context.close();
      }, { once: true }));
      return destination.stream;
    };
    const streamFor = (constraints = {}) => {
      const tracks = [];
      if (constraints.video) tracks.push(...makeVideo().getVideoTracks());
      if (constraints.audio) tracks.push(...makeAudio().getAudioTracks());
      return new MediaStream(tracks);
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        enumerateDevices: async () => [{ kind: "videoinput", deviceId: "synthetic", label: "Kamera ya majaribio" }],
        getDisplayMedia: async () => {
          if (window.__rejectNextCapture) {
            window.__rejectNextCapture = false;
            throw new DOMException("synthetic denial", "NotAllowedError");
          }
          return streamFor({ video: true, audio: true });
        },
        getUserMedia: async (constraints) => streamFor(constraints),
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

function parseWebM(buffer, kind = "video") {
  expect(buffer.length).toBeGreaterThan(500);
  expect(buffer.subarray(0, 4)).toEqual(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  const binary = buffer.toString("latin1");
  expect(binary).toContain("webm");
  const codecPool = kind === "audio" ? ["A_OPUS", "A_VORBIS"] : ["V_VP8", "V_VP9", "V_AV1"];
  const codecs = codecPool.filter((codec) => binary.includes(codec));
  expect(codecs.length, `WebM must expose a parsed ${kind} codec id`).toBeGreaterThan(0);
  return codecs;
}

test("Swahili CreatorRecord uses the real MediaRecorder path and reopens its WebM export", async ({ page }) => {
  const seen = diagnostics(page);
  await installSyntheticMedia(page);
  await page.setViewportSize({ width: 375, height: 820 });
  const response = await page.goto(route, { waitUntil: "domcontentloaded" });
  expect(response && response.ok()).toBeTruthy();
  await expect(page.locator("html")).toHaveAttribute("lang", "sw");
  await expect(page.locator('meta[name="afrotools-sw-source-owner"]')).toHaveAttribute("content", "scripts/build-sw-creator-record-final.js");
  await expect(page.locator(".crd-mode-card")).toHaveCount(4);
  await page.locator('.crd-mode-card[data-mode="webcam"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('.crd-mode-card[data-mode="webcam"]')).toHaveClass(/active/);
  await page.locator('.crd-pip-pos[data-pos="tr"]').focus();
  await page.keyboard.press("Space");
  await expect(page.locator('.crd-pip-pos[data-pos="tr"]')).toHaveClass(/active/);
  await page.locator('.crd-mode-card[data-mode="screen"]').focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('.crd-mode-card[data-mode="screen"]')).toHaveClass(/active/);

  const overflow375 = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(overflow375.scroll).toBeLessThanOrEqual(overflow375.client + 1);
  await page.setViewportSize({ width: 320, height: 820 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  const overflow320 = await page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
  expect(overflow320.scroll).toBeLessThanOrEqual(overflow320.client + 1);
  await page.evaluate(() => { document.documentElement.style.fontSize = "100%"; });

  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => document.documentElement.setAttribute("data-theme", value), theme);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("#recordBtn")).toBeVisible();
  }

  await page.locator("#recordBtn").focus();
  expect(await page.locator("#recordBtn").evaluate((node) => document.activeElement === node)).toBeTruthy();
  await page.evaluate(() => { window.__rejectNextCapture = true; });
  await page.locator("#recordBtn").click();
  await expect(page.locator("#toast")).toContainText("Ruhusa imekataliwa");

  await page.locator("#countdownToggle").click();
  await expect(page.locator("#countdownToggle")).toHaveAttribute("aria-pressed", "false");
  await page.locator("#micToggle").click();
  await page.locator("#recordBtn").click();
  await expect(page.locator("#recordBtn")).toHaveClass(/recording/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#toast")).toContainText("Rekodi imeghairiwa");

  await page.locator("#recordBtn").click();
  await expect(page.locator("#recordBtn")).toHaveClass(/recording/);
  await page.waitForTimeout(900);
  await page.locator("#pauseBtn").click();
  await page.waitForTimeout(120);
  await page.locator("#pauseBtn").click();
  await page.waitForTimeout(350);
  await page.locator("#stopBtn").click();
  await expect(page.locator("#exportPanel")).toHaveClass(/visible/);
  expect(await page.evaluate(() => window.__recorderOptions.at(-1).videoBitsPerSecond)).toBe(4000000);
  await expect(page.locator("#playbackVideo")).toBeVisible();
  const reopened = await page.locator("#playbackVideo").evaluate(async (video) => {
    if (video.readyState < 1) await new Promise((resolve, reject) => {
      video.addEventListener("loadedmetadata", resolve, { once: true });
      video.addEventListener("error", reject, { once: true });
    });
    const blob = await fetch(video.src).then((response) => response.blob());
    return { readyState: video.readyState, type: blob.type, size: blob.size };
  });
  expect(reopened.readyState).toBeGreaterThanOrEqual(1);
  expect(reopened.type).toBe("video/webm");
  expect(reopened.size).toBeGreaterThan(500);

  const pending = page.waitForEvent("download");
  await page.locator("#downloadBtn").click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/^Rekodi-\d{8}-\d{4}\.webm$/);
  parseWebM(await readDownload(download), "video");

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#historyToggleBtn").click();
  await expect(page.locator(".crd-history-item")).toHaveCount(1);
  await expect(page.locator(".preview-btn")).toHaveText("Hakiki");
  await page.locator(".preview-btn").click();
  await expect(page.locator("#playbackVideo")).toBeVisible();
  await page.locator('[data-action="delete"]').click();
  await expect(page.locator(".crd-history-empty")).toHaveText("Bado hakuna rekodi");

  expect(seen.writes).toEqual([]);
  expect(seen.external).toEqual([]);
  expect(seen.errors).toEqual([]);
});

for (const mode of ["webcam", "both", "audio"]) {
  test(`Swahili CreatorRecord ${mode} mode produces a parseable local WebM`, async ({ page }) => {
    await installSyntheticMedia(page);
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.locator(`.crd-mode-card[data-mode="${mode}"]`).click();
    await page.locator("#countdownToggle").click();
    if (mode !== "audio") await page.locator("#micToggle").click();
    await page.locator("#recordBtn").click();
    await expect(page.locator("#recordBtn")).toHaveClass(/recording/);
    await page.waitForTimeout(650);
    await page.locator("#stopBtn").click();
    await expect(page.locator("#exportPanel")).toHaveClass(/visible/);
    const selectedOptions = await page.evaluate(() => window.__recorderOptions.at(-1));
    if (mode === "audio") expect(selectedOptions.videoBitsPerSecond).toBeUndefined();
    else expect(selectedOptions.videoBitsPerSecond).toBe(4000000);
    const blob = await page.locator("#playbackVideo").evaluate(async (video) => {
      if (video.readyState < 1) await new Promise((resolve, reject) => {
        video.addEventListener("loadedmetadata", resolve, { once: true });
        video.addEventListener("error", reject, { once: true });
      });
      const value = await fetch(video.src).then((response) => response.blob());
      return { type: value.type, size: value.size };
    });
    expect(blob.type).toBe(mode === "audio" ? "audio/webm" : "video/webm");
    expect(blob.size).toBeGreaterThan(500);
    const pending = page.waitForEvent("download");
    await page.locator("#downloadBtn").click();
    parseWebM(await readDownload(await pending), mode === "audio" ? "audio" : "video");
  });
}

test("English CreatorRecord keeps its exact labels and workspace controls", async ({ page }) => {
  await installSyntheticMedia(page);
  await page.goto("/tools/creator-record/app", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator(".crd-mode-label")).toHaveText(["Screen Only", "Webcam Only", "Screen + Webcam", "Audio Only"]);
  await expect(page.locator("#downloadBtn")).toContainText("Download WebM");
  await expect(page.locator("#historyList")).toContainText("No recordings yet");
});
