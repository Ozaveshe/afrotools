#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const replacements = new Map([
  ['cabo-verde/index.html', [
    ['<html>', '<html lang="en">'],
    ['<html data-chat-bundle=', '<html lang="en" data-chat-bundle='],
  ]],
  ['sw/zana/hariri-pdf/index.html', [
    ['<button type="button" id="zo">', '<button type="button" id="zo" aria-label="Punguza ukubwa">'],
    ['<button type="button" class="tb-close" id="tbX">', '<button type="button" class="tb-close" id="tbX" aria-label="Funga zana">'],
    ['<button type="button" class="sb-toggle" id="sbTog">', '<button type="button" class="sb-toggle" id="sbTog" aria-label="Fungua menyu ya kurasa">'],
    ['<button type="button" class="mob-dl" id="mobDl">', '<button type="button" class="mob-dl" id="mobDl" aria-label="Pakua faili">'],
  ]],
  ['sw/zana/nafasi-pdf/index.html', [
    ['<button type="button" id="zo">', '<button type="button" id="zo" aria-label="Punguza ukubwa">'],
    ['<button type="button" class="tb-close" id="tbX">', '<button type="button" class="tb-close" id="tbX" aria-label="Funga zana">'],
    ['<button type="button" class="sb-toggle" id="sbTog">', '<button type="button" class="sb-toggle" id="sbTog" aria-label="Fungua menyu ya kurasa">'],
    ['<button type="button" id="mzo">', '<button type="button" id="mzo" aria-label="Punguza ukubwa">'],
    ['<button type="button" id="mzi">', '<button type="button" id="mzi" aria-label="Ongeza ukubwa">'],
    ['<button type="button" class="mob-dl" id="mobDl">', '<button type="button" class="mob-dl" id="mobDl" aria-label="Pakua faili">'],
    ['<button type="button" class="m-close" id="mC">', '<button type="button" class="m-close" id="mC" aria-label="Funga">'],
  ]],
  ['tools/pdf-editor/index.html', [
    ['<button type="button" id="zo">', '<button type="button" id="zo" aria-label="Zoom out">'],
    ['<button type="button" class="tb-close" id="tbX">', '<button type="button" class="tb-close" id="tbX" aria-label="Close toolbar">'],
    ['<button type="button" class="sb-toggle" id="sbTog">', '<button type="button" class="sb-toggle" id="sbTog" aria-label="Open page sidebar">'],
    ['<button type="button" class="mob-dl" id="mobDl">', '<button type="button" class="mob-dl" id="mobDl" aria-label="Download file">'],
  ]],
  ['tools/creator-captions/app.html', [
    ['<button type="button" class="ccr-toggle-v2 on" data-field="cta">', '<button type="button" class="ccr-toggle-v2 on" data-field="cta" aria-label="Include call to action">'],
    ['<button type="button" class="ccr-toggle-v2 on" data-field="hashtags">', '<button type="button" class="ccr-toggle-v2 on" data-field="hashtags" aria-label="Include hashtags">'],
    ['<button type="button" class="ccr-toggle-v2 on" data-field="emoji">', '<button type="button" class="ccr-toggle-v2 on" data-field="emoji" aria-label="Include emojis">'],
    ['<button type="button" class="ccr-toggle-v2" data-field="question">', '<button type="button" class="ccr-toggle-v2" data-field="question" aria-label="Include a question">'],
    ['<button type="button" class="ccr-toggle-v2 on" data-field="hook">', '<button type="button" class="ccr-toggle-v2 on" data-field="hook" aria-label="Include a hook">'],
  ]],
  ['tools/creator-club/app.html', [
    ['<button type="button" class="ccb-toggle on" id="testModeToggle">', '<button type="button" class="ccb-toggle on" id="testModeToggle" aria-label="Toggle test mode">'],
    ['<button type="button" class="ccb-modal-close" onclick="CCB.closeTierModal()">', '<button type="button" class="ccb-modal-close" onclick="CCB.closeTierModal()" aria-label="Close tier modal">'],
    ['<button type="button" class="ccb-toggle" id="tierLimitToggle">', '<button type="button" class="ccb-toggle" id="tierLimitToggle" aria-label="Toggle tier limits">'],
    ['<button type="button" class="ccb-modal-close" onclick="CCB.closeContentModal()">', '<button type="button" class="ccb-modal-close" onclick="CCB.closeContentModal()" aria-label="Close content modal">'],
  ]],
  ['tools/creator-record/app.html', [
    ['<button type="button" class="crd-toggle on" id="sysAudioToggle">', '<button type="button" class="crd-toggle on" id="sysAudioToggle" aria-label="Toggle system audio">'],
    ['<button type="button" class="crd-toggle on" id="micToggle">', '<button type="button" class="crd-toggle on" id="micToggle" aria-label="Toggle microphone">'],
    ['<button type="button" class="crd-toggle" id="noiseToggle">', '<button type="button" class="crd-toggle" id="noiseToggle" aria-label="Toggle noise reduction">'],
    ['<button type="button" class="crd-toggle on" id="mirrorToggle">', '<button type="button" class="crd-toggle on" id="mirrorToggle" aria-label="Toggle mirror preview">'],
    ['<button type="button" class="crd-toggle on" id="countdownToggle">', '<button type="button" class="crd-toggle on" id="countdownToggle" aria-label="Toggle countdown">'],
  ]],
  ['tools/creator-schedule/app.html', [
    ['<button type="button" class="csc-cal-nav-btn" id="calPrev">', '<button type="button" class="csc-cal-nav-btn" id="calPrev" aria-label="Previous month">'],
    ['<button type="button" class="csc-cal-nav-btn" id="calNext">', '<button type="button" class="csc-cal-nav-btn" id="calNext" aria-label="Next month">'],
    ['<button type="button" class="csc-toggle" id="recurringToggle">', '<button type="button" class="csc-toggle" id="recurringToggle" aria-label="Toggle recurring schedule">'],
    ['<button type="button" class="csc-day-modal-close" id="dayModalClose">', '<button type="button" class="csc-day-modal-close" id="dayModalClose" aria-label="Close day details">'],
  ]],
  ['tools/creator-stock/app.html', [
    ['<button type="button" class="csk-search-clear" id="searchClear">', '<button type="button" class="csk-search-clear" id="searchClear" aria-label="Clear search">'],
    ['<button type="button" class="csk-toggle on" id="safeToggle">', '<button type="button" class="csk-toggle on" id="safeToggle" aria-label="Toggle safe results">'],
    ['<button type="button" class="csk-modal-close" id="modalClose">', '<button type="button" class="csk-modal-close" id="modalClose" aria-label="Close image details">'],
    ['<button type="button" class="csk-collections-close" id="collectionsClose">', '<button type="button" class="csk-collections-close" id="collectionsClose" aria-label="Close collections panel">'],
  ]],
  ['tools/idea-board/index.html', [
    ['<button type="button" id="btn-send">', '<button type="button" id="btn-send" aria-label="Send idea">'],
    ['<button type="button" class="modal-close" id="modal-close">', '<button type="button" class="modal-close" id="modal-close" aria-label="Close idea details">'],
  ]],
]);

let filesChanged = 0;
let replacementsApplied = 0;

for (const [relativeFile, pairs] of replacements) {
  const file = path.join(ROOT, relativeFile);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;

  for (const [from, to] of pairs) {
    if (html.includes(to)) continue;
    const next = html.replace(from, to);
    if (next !== html) {
      replacementsApplied += 1;
      html = next;
    }
  }

  if (html !== before) {
    writeFileWithRetry(file, html);
    filesChanged += 1;
  }
}

console.log(`Files changed: ${filesChanged}`);
console.log(`Accessible names/lang fixes applied: ${replacementsApplied}`);

function writeFileWithRetry(file, content) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, content);
  let lastError = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      fs.renameSync(tmp, file);
      return;
    } catch (error) {
      lastError = error;
      const waitUntil = Date.now() + 80 * (attempt + 1);
      while (Date.now() < waitUntil) {}
    }
  }
  try {
    fs.unlinkSync(tmp);
  } catch (_) {}
  throw lastError;
}
