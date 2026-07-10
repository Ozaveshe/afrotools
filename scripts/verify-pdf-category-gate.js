#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const registryPath = path.join(root, 'assets/js/components/tool-registry.js');
const hubPath = path.join(root, 'document-pdf/index.html');
const workflowPath = path.join(root, 'docs/PDF-CATEGORY-WORKFLOW.md');

const failures = [];
const warnings = [];
const localFirstSensitiveGateExemptions = new Set([
  'cv-builder',
  'cover-letter-generator',
  'meeting-minutes',
  'receipt-generator',
  'business-plan',
  'freelance-invoice',
]);

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function rel(file) {
  return path.relative(root, file).replace(/\\/g, '/');
}

function parseRegistryTools() {
  const registry = read(registryPath);
  const tools = [];
  registry.split(/\r?\n/).forEach((line, index) => {
    if (!line.includes("category: 'document-pdf'")) return;
    if (!line.includes("href: '/tools/")) return;
    const id = /id: '([^']+)'/.exec(line)?.[1];
    const name = /name: '([^']+)'/.exec(line)?.[1];
    const href = /href: '([^']+)'/.exec(line)?.[1];
    const slug = /\/tools\/([^/]+)\//.exec(href || '')?.[1];
    if (!id || !href || !slug) {
      failures.push(`Could not parse document-pdf registry entry on ${rel(registryPath)}:${index + 1}`);
      return;
    }
    tools.push({ id, name, href, slug });
  });
  return tools;
}

function verifyWorkflowDoc() {
  if (!fs.existsSync(workflowPath)) {
    failures.push(`${rel(workflowPath)} is missing.`);
    return;
  }
  const text = read(workflowPath);
  ['pdf-download-gate.js', 'AfroPdfDownloadGate.guard', 'registered'].forEach((needle) => {
    if (!text.includes(needle)) failures.push(`${rel(workflowPath)} does not document ${needle}.`);
  });
}

function verifyTesseractVendor() {
  const requiredFiles = [
    'assets/vendor/tesseract/tesseract.min.js',
    'assets/vendor/tesseract/worker.min.js',
    'assets/vendor/tesseract/core/tesseract-core.wasm.js',
    'assets/vendor/tesseract/core/tesseract-core.wasm',
    'assets/vendor/tesseract/core/tesseract-core-simd.wasm.js',
    'assets/vendor/tesseract/core/tesseract-core-simd.wasm',
    'assets/vendor/tesseract/core/tesseract-core-lstm.wasm.js',
    'assets/vendor/tesseract/core/tesseract-core-lstm.wasm',
    'assets/vendor/tesseract/core/tesseract-core-simd-lstm.wasm.js',
    'assets/vendor/tesseract/core/tesseract-core-simd-lstm.wasm',
    'assets/vendor/tesseract/lang/eng.traineddata.gz',
    'assets/vendor/tesseract/lang/fra.traineddata.gz',
    'assets/vendor/tesseract/lang/ara.traineddata.gz',
    'assets/vendor/tesseract/lang/swa.traineddata.gz',
    'assets/vendor/tesseract/lang/por.traineddata.gz',
    'assets/vendor/tesseract/licenses/tesseract.js-LICENSE.md',
    'assets/vendor/tesseract/licenses/tesseract.js-core-LICENSE',
  ];
  requiredFiles.forEach((file) => {
    const absolute = path.join(root, file);
    if (!fs.existsSync(absolute)) failures.push(`Missing Tesseract OCR vendor asset ${file}.`);
  });
}

function verifyToolPages(tools) {
  const checked = [];
  tools.forEach((tool) => {
    ['index.html', 'app.html'].forEach((name) => {
      const file = path.join(root, 'tools', tool.slug, name);
      if (!fs.existsSync(file)) return;
      const html = read(file);
      checked.push(file);
      const gateCount = (html.match(/pdf-download-gate\.js/g) || []).length;
      const modalCount = (html.match(/<email-gate-modal/g) || []).length;
      const oldGateCount = (html.match(/auto-email-gate\.js/g) || []).length;
      const gateExempt = localFirstSensitiveGateExemptions.has(tool.slug);
      if (!gateExempt && gateCount !== 1) failures.push(`${rel(file)} should load pdf-download-gate.js exactly once, found ${gateCount}.`);
      if (!gateExempt && modalCount < 1) failures.push(`${rel(file)} is missing <email-gate-modal>.`);
      if (gateExempt && (gateCount > 0 || modalCount > 0)) failures.push(`${rel(file)} is local-first and should not load the PDF/email gate.`);
      if (oldGateCount > 0) failures.push(`${rel(file)} still loads auto-email-gate.js.`);
      [...html.matchAll(/["'](\/assets\/vendor\/[^"']+)["']/g)].forEach((match) => {
        const cleanRef = match[1].split('?')[0].split('#')[0];
        const assetPath = path.join(root, cleanRef.replace(/^\//, ''));
        if (!fs.existsSync(assetPath)) failures.push(`${rel(file)} references missing vendor asset ${match[1]}.`);
      });
      if (/https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com)\/[^"']*(pdf|jspdf|jszip|qpdf)/i.test(html)) {
        warnings.push(`${rel(file)} still references an external PDF runtime CDN; prefer local vendor assets when touching it next.`);
      }
      if (/https:\/\/(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com)\/[^"']*tesseract/i.test(html)) {
        warnings.push(`${rel(file)} still references an external OCR runtime CDN; vendor Tesseract assets before making OCR offline-critical.`);
      }
    });
  });
  return checked;
}

function jsonLdBlocks(html) {
  return [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => {
      try {
        return JSON.parse(match[1].trim());
      } catch (err) {
        failures.push(`${rel(hubPath)} has invalid JSON-LD: ${err.message}`);
        return null;
      }
    })
    .filter(Boolean);
}

function verifyHubJsonLd(tools) {
  if (!fs.existsSync(hubPath)) {
    failures.push(`${rel(hubPath)} is missing.`);
    return;
  }
  const html = read(hubPath);
  const itemList = jsonLdBlocks(html).find((block) => block['@type'] === 'ItemList');
  if (!itemList) {
    failures.push(`${rel(hubPath)} is missing ItemList JSON-LD.`);
    return;
  }
  const items = Array.isArray(itemList.itemListElement) ? itemList.itemListElement : [];
  if (Number(itemList.numberOfItems) !== tools.length) {
    failures.push(`${rel(hubPath)} ItemList numberOfItems is ${itemList.numberOfItems}, expected ${tools.length}.`);
  }
  if (items.length !== tools.length) {
    failures.push(`${rel(hubPath)} ItemList has ${items.length} entries, expected ${tools.length}.`);
  }
  const itemUrls = new Set(items.map((item) => String(item.url || '').replace(/^https:\/\/afrotools\.com/, '')));
  tools.forEach((tool) => {
    if (!itemUrls.has(tool.href)) failures.push(`${rel(hubPath)} ItemList is missing ${tool.href}.`);
  });
}

function main() {
  const tools = parseRegistryTools();
  const uniqueSlugs = new Set(tools.map((tool) => tool.slug));
  if (uniqueSlugs.size !== tools.length) failures.push(`Document-pdf registry has duplicate /tools/ slugs: ${tools.length - uniqueSlugs.size}.`);
  verifyWorkflowDoc();
  verifyTesseractVendor();
  const checked = verifyToolPages(tools);
  verifyHubJsonLd(tools);

  if (warnings.length) {
    console.warn('PDF category warnings:');
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }

  if (failures.length) {
    console.error('PDF category verification failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`PDF category verification passed: ${tools.length} registry tools, ${checked.length} HTML/app surfaces, gate coverage OK.`);
}

main();
