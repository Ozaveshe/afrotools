#!/usr/bin/env node
'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'audit-results');
const SHOT_DIR = path.join(OUT_DIR, 'dark-mode-screenshots');
const labelArg = process.argv.find((arg) => arg.startsWith('--label='));
const LABEL = labelArg ? labelArg.split('=')[1].trim() || 'audit' : 'audit';

const SAMPLE_ROUTES = [
  { template: 'homepage', route: '/' },
  { template: 'tool', route: '/tools/unit-converter/' },
  { template: 'vat calculator', route: '/tools/vat-calculator/' },
  { template: 'salary calculator', route: '/nigeria/ng-salary-tax' },
  { template: 'category', route: '/salary-tax/' },
  { template: 'country', route: '/nigeria/' },
  { template: 'blog', route: '/blog/african-startup-funding-2026/' },
  { template: 'search', route: '/search/' },
  { template: 'localized swahili', route: '/sw/zana/kubadilisha-vipimo/' },
  { template: 'localized french', route: '/fr/tools/assurance-auto/' },
  { template: 'policy', route: '/privacy/' },
  { template: '404', route: '/404.html' },
];

const VIEWPORTS = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 960 },
];

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const server = await startServer();
  const baseURL = `http://127.0.0.1:${server.port}`;
  const browser = await chromium.launch();
  const results = [];

  try {
    for (const sample of SAMPLE_ROUTES) {
      for (const viewport of VIEWPORTS) {
        for (const mode of ['light', 'dark']) {
          const context = await browser.newContext({
            viewport: { width: viewport.width, height: viewport.height },
            colorScheme: mode,
          });
          await context.addInitScript((theme) => {
            try {
              localStorage.setItem('aft_theme', theme);
            } catch (_) {}
            document.documentElement.setAttribute('data-theme', theme);
            document.documentElement.setAttribute('data-theme-choice', theme);
          }, mode);
          const page = await context.newPage();
          const url = new URL(sample.route, baseURL).toString();
          const entry = {
            template: sample.template,
            route: sample.route,
            viewport: viewport.name,
            mode,
            status: 'unknown',
            issues: [],
            screenshot: '',
          };
          page.on('console', (message) => {
            if (message.type() === 'error') {
              entry.issues.push({ type: 'console_error', detail: message.text().slice(0, 240) });
            }
          });
          try {
            const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
            entry.status = response ? response.status() : 0;
            await page.evaluate((theme) => {
              document.documentElement.setAttribute('data-theme', theme);
              document.documentElement.setAttribute('data-theme-choice', theme);
              document.documentElement.style.colorScheme = theme;
            }, mode);
            await page.waitForTimeout(250);
            entry.issues.push(...await page.evaluate(analyzeDarkModePage, mode));
            const fileName = `${slug(sample.route)}-${viewport.name}-${mode}.png`;
            const absShot = path.join(SHOT_DIR, fileName);
            await page.screenshot({ path: absShot, fullPage: false });
            entry.screenshot = path.relative(ROOT, absShot).replace(/\\/g, '/');
          } catch (error) {
            entry.status = 'error';
            entry.issues.push({ type: 'navigation_error', detail: error.message.slice(0, 240) });
          } finally {
            results.push(entry);
            await context.close();
          }
        }
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  const summary = buildSummary(results);
  const report = {
    generatedAt: new Date().toISOString(),
    label: LABEL,
    baseURL,
    samples: SAMPLE_ROUTES,
    viewports: VIEWPORTS,
    summary,
    results,
  };

  fs.writeFileSync(path.join(OUT_DIR, `dark-mode-${LABEL}-v2.json`), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(OUT_DIR, `dark-mode-${LABEL}-v2.md`), renderMarkdown(report));
  console.log(`Dark mode visual audit ${LABEL}: ${summary.totalRuns} runs, ${summary.runsWithIssues} runs with issues, ${summary.totalIssues} total issues`);
}

function analyzeDarkModePage(mode) {
  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden' && style.display !== 'none';
  }

  function hasReadableText(element) {
    const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
    return text.length > 1;
  }

  function describeElement(element) {
    const id = element.id ? `#${element.id}` : '';
    const className = String(element.className || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((name) => `.${name}`)
      .join('');
    return `${element.tagName.toLowerCase()}${id}${className}`;
  }

  function parseColor(value) {
    const match = String(value || '').match(/rgba?\(([^)]+)\)/i);
    if (!match) return null;
    const parts = match[1].split(',').map((part) => part.trim());
    const rgb = parts.slice(0, 3).map(Number);
    if (rgb.some((part) => !Number.isFinite(part))) return null;
    return { r: rgb[0], g: rgb[1], b: rgb[2], alpha: parts[3] === undefined ? 1 : Number(parts[3]) };
  }

  function luminance(color) {
    const channels = [color.r, color.g, color.b].map((channel) => {
      const value = channel / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  }

  function contrast(a, b) {
    const l1 = luminance(a);
    const l2 = luminance(b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function dedupeIssues(issues) {
    const seen = new Set();
    const out = [];
    for (const issue of issues) {
      const key = `${issue.type}:${issue.detail}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(issue);
    }
    return out;
  }

  const issues = [];
  const bodyStyle = getComputedStyle(document.body);
  const bodyBg = parseColor(bodyStyle.backgroundColor);
  const bodyText = parseColor(bodyStyle.color);

  if (mode === 'dark') {
    if (bodyBg && luminance(bodyBg) > 0.28) {
      issues.push({ type: 'dark_body_background', detail: `Body background is too light: ${bodyStyle.backgroundColor}` });
    }
    if (bodyText && bodyBg && contrast(bodyText, bodyBg) < 4.5) {
      issues.push({ type: 'dark_body_contrast', detail: `Body text contrast is ${contrast(bodyText, bodyBg).toFixed(2)}` });
    }
  }

  const selectors = [
    'main',
    'section',
    '.card',
    '.tool-card',
    '.country-card',
    '.result',
    '.result-box',
    '.summary',
    '.calculator',
    '.form-card',
    'input',
    'select',
    'textarea',
    'button',
    'table',
    'thead',
    'tbody',
    'footer',
    'nav',
    '[class*="card"]',
    '[class*="result"]',
    '[class*="alert"]',
    '[class*="badge"]',
  ];

  const elements = Array.from(document.querySelectorAll(selectors.join(',')))
    .filter((element) => isVisible(element))
    .slice(0, 180);

  let lightSurfaceCount = 0;
  for (const element of elements) {
    const style = getComputedStyle(element);
    const bg = parseColor(style.backgroundColor);
    const color = parseColor(style.color);
    const tag = describeElement(element);

    if (mode === 'dark' && bg && bg.alpha > 0.6 && luminance(bg) > 0.86) {
      lightSurfaceCount += 1;
      if (lightSurfaceCount <= 8) {
        issues.push({ type: 'light_surface_in_dark', detail: `${tag} has light background ${style.backgroundColor}` });
      }
    }

    if (mode === 'dark' && color && bg && bg.alpha > 0.6) {
      const ratio = contrast(color, bg);
      if (ratio < 3 && hasReadableText(element)) {
        issues.push({ type: 'low_contrast_dark', detail: `${tag} contrast ${ratio.toFixed(2)} (${style.color} on ${style.backgroundColor})` });
      }
    }

    if (mode === 'dark' && /^(input|select|textarea)$/i.test(element.tagName)) {
      const border = parseColor(style.borderColor);
      if (bg && luminance(bg) > 0.5) {
        issues.push({ type: 'form_control_surface', detail: `${tag} uses light form background ${style.backgroundColor}` });
      }
      if (border && bg && contrast(border, bg) < 1.35) {
        issues.push({ type: 'weak_form_border', detail: `${tag} border may disappear (${style.borderColor})` });
      }
    }
  }

  const textElements = Array.from(document.querySelectorAll('h1,h2,h3,h4,p,li,a,label,button,th,td,small,span'))
    .filter((element) => isVisible(element) && hasReadableText(element))
    .slice(0, 220);
  for (const element of textElements) {
    const style = getComputedStyle(element);
    const fg = parseColor(style.color);
    const bg = findEffectiveBackground(element);
    if (!fg || !bg) continue;
    const ratio = contrast(fg, bg);
    const fontSize = Number.parseFloat(style.fontSize) || 16;
    const threshold = fontSize >= 18 ? 3 : 4.5;
    if (ratio < threshold) {
      issues.push({
        type: mode === 'dark' ? 'text_contrast_dark' : 'text_contrast_light',
        detail: `${describeElement(element)} contrast ${ratio.toFixed(2)} against ${bg.css}`,
      });
      if (issues.length > 60) break;
    }
  }

  return dedupeIssues(issues).slice(0, 80);

  function findEffectiveBackground(element) {
    let node = element;
    while (node && node.nodeType === Node.ELEMENT_NODE) {
      const bg = parseColor(getComputedStyle(node).backgroundColor);
      if (bg && bg.alpha > 0.6) {
        bg.css = getComputedStyle(node).backgroundColor;
        return bg;
      }
      node = node.parentElement;
    }
    if (bodyBg) bodyBg.css = bodyStyle.backgroundColor;
    return bodyBg;
  }
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return rect.width > 1 && rect.height > 1 && style.visibility !== 'hidden' && style.display !== 'none';
}

function hasReadableText(element) {
  const text = (element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
  return text.length > 1;
}

function describeElement(element) {
  const id = element.id ? `#${element.id}` : '';
  const className = String(element.className || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => `.${name}`)
    .join('');
  return `${element.tagName.toLowerCase()}${id}${className}`;
}

function parseColor(value) {
  const match = String(value || '').match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const parts = match[1].split(',').map((part) => part.trim());
  const rgb = parts.slice(0, 3).map(Number);
  if (rgb.some((part) => !Number.isFinite(part))) return null;
  return { r: rgb[0], g: rgb[1], b: rgb[2], alpha: parts[3] === undefined ? 1 : Number(parts[3]) };
}

function luminance(color) {
  const channels = [color.r, color.g, color.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function dedupeIssues(issues) {
  const seen = new Set();
  const out = [];
  for (const issue of issues) {
    const key = `${issue.type}:${issue.detail}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(issue);
  }
  return out;
}

function buildSummary(results) {
  const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
  const byType = {};
  for (const result of results) {
    for (const issue of result.issues) {
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    }
  }
  return {
    totalRuns: results.length,
    runsWithIssues: results.filter((result) => result.issues.length).length,
    totalIssues,
    byType,
  };
}

function renderMarkdown(report) {
  const lines = [];
  lines.push(`# Dark Mode Visual Audit V2 (${report.label})`);
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Runs: ${report.summary.totalRuns}`);
  lines.push(`- Runs with issues: ${report.summary.runsWithIssues}`);
  lines.push(`- Total issues: ${report.summary.totalIssues}`);
  lines.push(`- Screenshots: audit-results/dark-mode-screenshots/`);
  lines.push('');
  lines.push('## Issue Types');
  lines.push('');
  lines.push('| Type | Count |');
  lines.push('|---|---:|');
  for (const [type, count] of Object.entries(report.summary.byType).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${type} | ${count} |`);
  }
  lines.push('');
  lines.push('## Sample Results');
  lines.push('');
  lines.push('| Route | Template | Viewport | Mode | Status | Issues | Screenshot |');
  lines.push('|---|---|---|---|---:|---:|---|');
  for (const result of report.results) {
    lines.push(`| \`${result.route}\` | ${result.template} | ${result.viewport} | ${result.mode} | ${result.status} | ${result.issues.length} | ${result.screenshot} |`);
    for (const issue of result.issues.slice(0, 8)) {
      lines.push(`|  |  |  |  |  | ${issue.type} | ${escapePipe(issue.detail)} |`);
    }
  }
  lines.push('');
  return lines.join('\n');
}

function escapePipe(value) {
  return String(value || '').replace(/\|/g, '\\|');
}

function slug(route) {
  return route.replace(/^\/$/, 'home').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'route';
}

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://local.test');
    const resolved = resolveRequestPath(decodeURIComponent(url.pathname));
    if (!resolved || !resolved.startsWith(ROOT) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'content-type': contentType(resolved) });
    fs.createReadStream(resolved).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      server.port = server.address().port;
      resolve(server);
    });
  });
}

function resolveRequestPath(pathname) {
  const clean = pathname.replace(/^\/+/, '');
  const candidates = [];
  if (!clean) {
    candidates.push(path.join(ROOT, 'index.html'));
  } else {
    candidates.push(path.join(ROOT, clean));
    if (pathname.endsWith('/')) candidates.push(path.join(ROOT, clean, 'index.html'));
    if (!path.extname(clean)) {
      candidates.push(path.join(ROOT, `${clean}.html`));
      candidates.push(path.join(ROOT, clean, 'index.html'));
    }
  }
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) || candidates[0];
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
  }[ext] || 'application/octet-stream';
}
