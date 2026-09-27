'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const jambRoot = path.join(__dirname, '..', 'jamb');

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.isFile() && entry.name.endsWith('.html') ? [file] : [];
  });
}

test('every JAMB HTML route omits Meta Pixel scripts, calls and noscript beacons', () => {
  const files = htmlFiles(jambRoot);
  assert.ok(files.length >= 13, 'scan must include the JAMB hub, CBT and companion routes');
  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const route = path.relative(jambRoot, file);
    assert.doesNotMatch(html, /connect\.facebook\.net|facebook\.com\/tr|(?:window\.)?fbq\s*\(|Meta Pixel Code/i, route);
  }
});

test('the edited JAMB routes retain the existing consent-aware analytics loader', () => {
  const routes = [
    'index.html', 'cbt/index.html', 'past-questions/index.html', 'daily/index.html',
    'cram/index.html', 'exam-day-kit/index.html', 'flashcards/index.html',
    'history/index.html', 'patterns/index.html', 'score-predictor/index.html',
    'study-plan/index.html', 'tutor/index.html', 'universities/index.html'
  ];
  for (const route of routes) {
    const html = fs.readFileSync(path.join(jambRoot, route), 'utf8');
    assert.match(html, /assets\/js\/analytics-bootstrap\.js/, route);
    assert.match(html, /assets\/js\/lazy-analytics\.js/, route);
  }
});
