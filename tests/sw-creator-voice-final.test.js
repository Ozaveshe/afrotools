"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const childProcess = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const target = "sw/zana/rekodi-na-hariri-sauti/index.html";
const english = read("tools/creator-voice/app.html");
const sw = read(target);
const controller = read("assets/js/pages/creative/creator-voice-app-controller.js");
const family = read("scripts/build-sw-creative-parity.js");

for (const pattern of [
  /<html\b[^>]*lang="sw"/, /afrotools-sw-native-owner" content="creator-voice"/,
  /afrotools-sw-source-owner" content="scripts\/build-sw-creator-voice-final\.js"/,
  /canonical" href="https:\/\/afrotools\.com\/sw\/zana\/rekodi-na-hariri-sauti\/"/,
  /hreflang="en" href="https:\/\/afrotools\.com\/tools\/creator-voice\/"/,
  /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/voix-de-marque-du-createur\/"/,
  /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/rekodi-na-hariri-sauti\/"/,
  /assets\/img\/tools\/creator-voice\.webp/, /"@type":"FAQPage"/,
]) assert.match(sw, pattern);
assert.ok(fs.existsSync(path.join(ROOT, "assets/img/tools/creator-voice.webp")));
assert.doesNotMatch(sw, /<iframe\b|analytics-bootstrap|supabase-auth|lazy-analytics|cdn\.jsdelivr|lame\.min\.js/i);
assert.match(sw, /<option value="mp3" disabled>MP3 \(inahitaji encoder ya ndani; haipatikani\)<\/option>/);
assert.match(sw, /id="toast" role="status" aria-live="polite"/);

const ids = [
  "projectName", "projectsBtn", "saveBtn", "recordView", "editView", "libraryView", "micSelect",
  "recordBtn", "pauseBtn", "stopBtn", "timer", "levelFill", "liveWaveform", "uploadArea", "fileInput",
  "editorPanel", "zoomOutBtn", "zoomInBtn", "editorCanvas", "playBtn", "trimBtn", "cutBtn", "splitBtn",
  "fadeInBtn", "fadeOutBtn", "normalizeBtn", "noiseBtn", "reverseBtn", "silenceBtn", "reverbBtn", "eqBtn",
  "compressorBtn", "pitchBtn", "speedSelect", "undoBtn", "redoBtn", "trackWave0", "trackWave1", "trackWave2",
  "exportFormat", "exportQuality", "exportTitle", "exportArtist", "exportBtn", "sfxGrid", "projectsPanel", "projectList", "toast",
];
for (const id of ids) {
  assert.match(english, new RegExp(`id=["']${id}["']`), `English fixture missing #${id}`);
  assert.match(sw, new RegExp(`id=["']${id}["']`), `Swahili parity missing #${id}`);
}
assert.equal((sw.match(/class="cvo-mode-tab(?: active)?"/g) || []).length, 3);
assert.equal((sw.match(/class="cvo-track-lane/g) || []).length, 3);
assert.equal((sw.match(/class="cvo-tool-btn/g) || []).length, 15);

for (const feature of [
  /getUserMedia/, /new MediaRecorder/, /audio\/webm;codecs=opus/, /mediaRecorder\.pause\(\)/,
  /mediaRecorder\.resume\(\)/, /decodeAudioData/, /exportWav/, /exportViaMediaRecorder/,
  /audio\/ogg;codecs=opus/, /audio\/webm;codecs=opus/, /indexedDB\.open/, /saveProject/,
  /loadProject/, /deleteProject/, /creatorvoice:recording-ready/,
]) assert.match(controller, feature);
for (const fallback of ["Recording ready for editing", "Mic access denied:", "No audio to export", "Project saved:", "Project deleted"]) assert.match(controller, new RegExp(fallback));
for (const leak of ["Untitled Project", "Loading microphones", "Drag & drop audio", "Multi-Track Mixer", "Export Audio", "Saved Projects", "No saved projects"]) assert.doesNotMatch(sw, new RegExp(leak, "i"));
assert.match(sw, /Sauti, uhariri na miradi hubaki kwenye kivinjari hiki/);
assert.match(sw, /Hakuna rekodi ghafi, faili lililopakiwa au mradi unaotumwa kwenye mtandao/);
assert.match(family, /"creator-voice": "scripts\/build-sw-creator-voice-final\.js"/);
assert.match(family, /row\.englishId === "creator-voice" \? "\/assets\/js\/pages\/creative\/creator-voice-app-controller\.js"/);

const before = crypto.createHash("sha256").update(read(target)).digest("hex");
childProcess.execFileSync(process.execPath, [path.join(ROOT, "scripts/build-sw-creator-voice-final.js")], { cwd: ROOT, stdio: "pipe" });
const after = crypto.createHash("sha256").update(read(target)).digest("hex");
assert.equal(after, before, "CreatorVoice generator must be idempotent");
console.log("Swahili CreatorVoice static parity passed: full English workspace, native copy, honest local exports and source ownership.");
