'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const SHARED_FONT_SURFACES = [
  'assets/css/navbar.css',
  'assets/css/navbar.min.css',
  'assets/js/components/africa-map.js',
  'assets/js/components/api-cta.js',
  'assets/js/components/footer.js',
  'assets/js/components/footer.min.js',
  'assets/js/components/newsletter-cta.js',
  'assets/js/components/newsletter-cta.min.js',
  'assets/js/components/rate-ticker.js',
];

const EDUCATION_FONT_ROUTES = [
  'tools/waec-calculator/index.html',
  'tools/jamb-aggregate/index.html',
  'tools/matric-points/index.html',
  'tools/gpa-calculator/index.html',
  'tools/exam-countdown/index.html',
  'tools/flashcard-maker/index.html',
  'tools/word-counter/index.html',
];

test('shared navigation and injected components do not compete with self-hosted fonts', () => {
  for (const relativePath of SHARED_FONT_SURFACES) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    assert.doesNotMatch(
      source,
      /fonts\.(?:googleapis|gstatic)\.com/i,
      `${relativePath} must use the canonical self-hosted font delivery`,
    );
  }
});

test('reviewed Education routes inherit canonical self-hosted font delivery', () => {
  for (const relativePath of EDUCATION_FONT_ROUTES) {
    const source = fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
    assert.doesNotMatch(
      source,
      /fonts\.(?:googleapis|gstatic)\.com/i,
      `${relativePath} must not request a competing remote font`,
    );
    assert.match(
      source,
      /\/assets\/css\/design-system(?:\.min)?\.css/i,
      `${relativePath} must retain the design system that imports canonical typography`,
    );
  }
});
