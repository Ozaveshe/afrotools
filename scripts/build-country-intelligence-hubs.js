#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, 'data', 'registry', 'country-intelligence-hubs.json');
const DIRECTORY_PATH = path.join(ROOT, 'data', 'tool-directory.json');
const REPORT_JSON_PATH = path.join(ROOT, 'reports', 'country-intelligence-hubs.json');
const REPORT_MD_PATH = path.join(ROOT, 'reports', 'country-intelligence-hubs.md');
const START = '<!-- country-intelligence-hub:start -->';
const END = '<!-- country-intelligence-hub:end -->';
const CSS_START = '<!-- country-intelligence-hub:styles:start -->';
const CSS_END = '<!-- country-intelligence-hub:styles:end -->';
const CSS_BLOCK = `${CSS_START}\n<link rel="stylesheet" href="/assets/css/country-intelligence-hub.css">\n${CSS_END}`;
const CHECK = process.argv.includes('--check');
const LEVEL_WEIGHTS = { strong: 100, useful: 70, shared: 40 };
const LEVEL_LABELS = { strong: 'Country depth', useful: 'Useful coverage', shared: 'Shared tools' };

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function routeCandidates(href) {
  const url = new URL(href, 'https://afrotools.com');
  const route = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  if (!route) return [path.join(ROOT, 'index.html')];
  if (route.endsWith('/')) return [path.join(ROOT, route, 'index.html')];
  if (path.extname(route)) return [path.join(ROOT, route)];
  return [path.join(ROOT, `${route}.html`), path.join(ROOT, route, 'index.html')];
}

function routeExists(href) {
  return routeCandidates(href).some((candidate) => fs.existsSync(candidate));
}

function validateConfig(config) {
  const errors = [];
  const codes = new Set();
  if (config.version !== 1) errors.push('Config version must be 1.');
  if (!Array.isArray(config.countries) || config.countries.length !== 5) {
    errors.push('Wave 1 must contain exactly five country hubs.');
  }

  for (const country of config.countries || []) {
    if (codes.has(country.code)) errors.push(`Duplicate country code: ${country.code}`);
    codes.add(country.code);
    const areaIds = Object.keys(country.areas || {});
    for (const areaId of config.areaOrder) {
      const area = country.areas && country.areas[areaId];
      if (!area) {
        errors.push(`${country.code}: missing ${areaId} area.`);
        continue;
      }
      if (!LEVEL_WEIGHTS[area.level]) errors.push(`${country.code}/${areaId}: invalid level ${area.level}.`);
      if (!Array.isArray(area.links) || area.links.length === 0) {
        errors.push(`${country.code}/${areaId}: empty areas are not allowed.`);
        continue;
      }
      if (!area.links.some((link) => link.type === 'tool' || link.type === 'data')) {
        errors.push(`${country.code}/${areaId}: requires a real tool or data route.`);
      }
      for (const link of area.links) {
        if (!/^\//.test(link.href || '')) errors.push(`${country.code}/${areaId}: only internal routes are allowed (${link.href}).`);
        else if (!routeExists(link.href)) errors.push(`${country.code}/${areaId}: route does not exist (${link.href}).`);
        if (!link.freshness) errors.push(`${country.code}/${areaId}: ${link.href} is missing freshness copy.`);
      }
    }
    for (const extra of areaIds.filter((id) => !config.areaOrder.includes(id))) {
      errors.push(`${country.code}: unknown area ${extra}.`);
    }
    const allLinks = Object.values(country.areas || {}).flatMap((area) => area.links || []);
    if (!allLinks.some((link) => link.type === 'guide')) errors.push(`${country.code}: requires at least one real guide.`);
    if (!allLinks.some((link) => link.type === 'data')) errors.push(`${country.code}: requires at least one real data route.`);
    if (!allLinks.some((link) => link.scope === 'country')) errors.push(`${country.code}: requires country-specific evidence.`);
  }

  if (errors.length) throw new Error(`Country intelligence validation failed:\n- ${errors.join('\n- ')}`);
}

function scoreCountry(country, areaOrder) {
  const levels = { strong: 0, useful: 0, shared: 0 };
  let total = 0;
  for (const areaId of areaOrder) {
    const level = country.areas[areaId].level;
    levels[level] += 1;
    total += LEVEL_WEIGHTS[level];
  }
  return { score: Math.round(total / areaOrder.length), levels };
}

function renderLink(link) {
  return `<li><a class="country-intelligence__link" href="${esc(link.href)}">` +
    `<span class="country-intelligence__link-type">${esc(link.type)}</span>` +
    `<span class="country-intelligence__link-label">${esc(link.label)}</span>` +
    `<span class="country-intelligence__link-freshness">${esc(link.freshness)}</span>` +
    '</a></li>';
}

function renderHub(config, country) {
  const result = scoreCountry(country, config.areaOrder);
  const areaHtml = config.areaOrder.map((areaId) => {
    const meta = config.areas[areaId];
    const area = country.areas[areaId];
    return `      <article class="country-intelligence__area" id="${esc(country.slug)}-${esc(areaId)}">\n` +
      '        <div class="country-intelligence__area-head">\n' +
      `          <h3>${esc(meta.label)}</h3>\n` +
      `          <span class="country-intelligence__status country-intelligence__status--${esc(area.level)}">${esc(LEVEL_LABELS[area.level])}</span>\n` +
      '        </div>\n' +
      `        <p>${esc(meta.description)}</p>\n` +
      `        <ul class="country-intelligence__links">${area.links.map(renderLink).join('')}</ul>\n` +
      '      </article>';
  }).join('\n');

  const next = country.nextExpansion.map((item) => `<li>${esc(item)}</li>`).join('');
  return `${START}\n` +
    `<section class="country-intelligence" aria-labelledby="${esc(country.slug)}-intelligence-title" data-country-intelligence="${esc(country.code)}">\n` +
    '  <div class="country-intelligence__inner">\n' +
    '    <p class="country-intelligence__eyebrow">Country utility map</p>\n' +
    '    <div class="country-intelligence__header">\n' +
    '      <div>\n' +
    `        <h2 class="country-intelligence__title" id="${esc(country.slug)}-intelligence-title">What AfroTools has for ${esc(country.name)}</h2>\n` +
    `        <p class="country-intelligence__summary">${esc(country.summary)}</p>\n` +
    '      </div>\n' +
    `      <div class="country-intelligence__score" aria-label="${result.score} percent coverage score"><strong>${result.score}%</strong><span>${result.levels.strong} strong, ${result.levels.useful} useful, ${result.levels.shared} shared-only areas</span></div>\n` +
    '    </div>\n' +
    '    <dl class="country-intelligence__freshness">\n' +
    `      <div class="country-intelligence__freshness-item"><dt>Live market data</dt><dd>FX, policy-rate, inflation, fuel, and price tools show their own source status. If a feed is unavailable, the hub says so.</dd></div>\n` +
    `      <div class="country-intelligence__freshness-item"><dt>Tax reference</dt><dd>${esc(country.taxReference)} · ${esc(country.taxAuthority)}. Planning estimate, not filing advice.</dd></div>\n` +
    `      <div class="country-intelligence__freshness-item"><dt>Hub review</dt><dd>Links and coverage reviewed ${esc(config.reviewedOn)}. Each item below states whether it is live, dated, or evergreen.</dd></div>\n` +
    '    </dl>\n' +
    '    <div class="country-intelligence__legend" aria-label="Coverage legend"><span>Country depth = local tool plus guide or data</span><span>Useful = mixed local and shared coverage</span><span>Shared tools = works here, local depth needed</span></div>\n' +
    `    <div class="country-intelligence__grid">\n${areaHtml}\n    </div>\n` +
    '    <aside class="country-intelligence__next" aria-label="Missing areas and next expansion">\n' +
    '      <div><h3>What is still missing</h3><p>These are the highest-value gaps for the next country-depth pass. Shared tools remain usable while local source coverage is built.</p></div>\n' +
    `      <ul>${next}</ul>\n` +
    '    </aside>\n' +
    '  </div>\n' +
    `</section>\n${END}`;
}

function replaceMarked(source, start, end, replacement) {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex === -1 && endIndex === -1) return null;
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Unbalanced generated markers: ${start} / ${end}`);
  }
  return source.slice(0, startIndex) + replacement + source.slice(endIndex + end.length);
}

function buildPage(config, country) {
  const pagePath = path.join(ROOT, country.slug, 'index.html');
  let source = fs.readFileSync(pagePath, 'utf8');
  const hub = renderHub(config, country);
  const markedHub = replaceMarked(source, START, END, hub);
  if (markedHub !== null) {
    source = markedHub;
  } else {
    const toolGrid = source.indexOf('<div id="tool-grid"></div>');
    if (toolGrid === -1) throw new Error(`${country.slug}: missing #tool-grid anchor.`);
    const sectionStart = source.lastIndexOf('<section', toolGrid);
    if (sectionStart === -1) throw new Error(`${country.slug}: missing tool-grid section.`);
    source = source.slice(0, sectionStart) + hub + '\n\n' + source.slice(sectionStart);
  }

  const markedCss = replaceMarked(source, CSS_START, CSS_END, CSS_BLOCK);
  if (markedCss !== null) {
    source = markedCss;
  } else {
    const headEnd = source.indexOf('</head>');
    if (headEnd === -1) throw new Error(`${country.slug}: missing </head>.`);
    source = source.slice(0, headEnd) + CSS_BLOCK + '\n' + source.slice(headEnd);
  }
  return { pagePath, source };
}

function localToolCount(directory, countryName) {
  return directory.filter((tool) =>
    Array.isArray(tool.countries) &&
    tool.countries.includes(countryName) &&
    (tool.status === 'Live' || tool.status === 'New')
  ).length;
}

function buildReport(config, directory) {
  const implemented = config.countries.map((country) => {
    const result = scoreCountry(country, config.areaOrder);
    const sharedOnlyAreas = config.areaOrder.filter((id) => country.areas[id].level === 'shared');
    const usefulAreas = config.areaOrder.filter((id) => country.areas[id].level === 'useful');
    return {
      code: country.code,
      name: country.name,
      route: `/${country.slug}/`,
      countryTaggedLiveTools: localToolCount(directory, country.name),
      coverageScore: result.score,
      strongAreas: result.levels.strong,
      usefulAreas,
      sharedOnlyAreas,
      nextExpansion: country.nextExpansion
    };
  });
  const queue = config.expansionQueue.map((country) => ({
    ...country,
    route: `/${country.slug}/`,
    countryTaggedLiveTools: localToolCount(directory, country.name)
  }));
  return {
    schemaVersion: 1,
    reviewedOn: config.reviewedOn,
    selectionMethod: 'Five highest country-tagged live-tool counts among the eight requested priority countries, with practical cross-area evidence checked before inclusion.',
    areaCount: config.areaOrder.length,
    implemented,
    expansionQueue: queue
  };
}

function renderReportMarkdown(report) {
  const lines = [
    '# Country Intelligence Hubs — Wave 1',
    '',
    `Reviewed: ${report.reviewedOn}`,
    '',
    report.selectionMethod,
    '',
    '## Implemented hubs',
    '',
    '| Country | Country-tagged live tools | Coverage | Strong areas | Useful areas | Shared-only areas |',
    '| --- | ---: | ---: | ---: | --- | --- |'
  ];
  for (const item of report.implemented) {
    lines.push(`| ${item.name} | ${item.countryTaggedLiveTools} | ${item.coverageScore}% | ${item.strongAreas}/10 | ${item.usefulAreas.join(', ') || 'None'} | ${item.sharedOnlyAreas.join(', ') || 'None'} |`);
  }
  lines.push('', '## Next expansion', '');
  for (const item of report.expansionQueue) {
    lines.push(`- **${item.name}** (${item.countryTaggedLiveTools} country-tagged live tools): ${item.focus}`);
  }
  lines.push('', '## Measurement notes', '',
    '- `Country depth` scores 100 for an area with local tools plus local guide/data evidence.',
    '- `Useful coverage` scores 70 for a mixed country-specific and shared workflow.',
    '- `Shared tools` scores 40 where a real pan-African tool works but local depth is still missing.',
    '- Empty areas are rejected by the builder; route existence and freshness labels are build-checked.',
    '');
  return lines.join('\n');
}

function checkOrWrite(file, content, changed) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  if (current === content) return;
  changed.push(path.relative(ROOT, file).replace(/\\/g, '/'));
  if (!CHECK) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content, 'utf8');
  }
}

function main() {
  const config = readJson(CONFIG_PATH);
  const directory = readJson(DIRECTORY_PATH);
  validateConfig(config);
  const changed = [];
  for (const country of config.countries) {
    const page = buildPage(config, country);
    checkOrWrite(page.pagePath, page.source, changed);
  }
  const report = buildReport(config, directory);
  checkOrWrite(REPORT_JSON_PATH, `${JSON.stringify(report, null, 2)}\n`, changed);
  checkOrWrite(REPORT_MD_PATH, renderReportMarkdown(report), changed);

  if (CHECK && changed.length) {
    console.error(`Country intelligence output is stale:\n- ${changed.join('\n- ')}`);
    process.exit(1);
  }
  console.log(`${CHECK ? 'Checked' : 'Built'} ${config.countries.length} country intelligence hubs.`);
  console.log(`Coverage report: ${path.relative(ROOT, REPORT_JSON_PATH)}`);
}

main();
