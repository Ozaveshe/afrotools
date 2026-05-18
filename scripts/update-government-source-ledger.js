const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const manifestPath = path.join(root, 'data/government/official-sources.json');
const statusPath = path.join(root, 'data/government/source-status.json');
const reportPath = path.join(root, 'reports/government-source-ledger.md');
const hubPath = path.join(root, 'government/index.html');

const args = new Set(process.argv.slice(2));
const isCheck = args.has('--check');
const dryRun = args.has('--dry-run') || isCheck;
const noFetch = args.has('--no-fetch');
const resetBaseline = args.has('--baseline');
const timeoutMs = Number(process.env.GOVERNMENT_SOURCE_TIMEOUT_MS || 12000);
const maxBodyBytes = Number(process.env.GOVERNMENT_SOURCE_MAX_BODY_BYTES || 240000);
const concurrency = Number(process.env.GOVERNMENT_SOURCE_CONCURRENCY || 6);

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    if (fallback !== undefined) return fallback;
    throw error;
  }
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function hashText(value) {
  return crypto.createHash('sha256').update(value || '').digest('hex');
}

function normalizeText(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxBodyBytes);
}

function titleFromHtml(value) {
  const match = String(value || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1].replace(/\s+/g, ' ').trim()) : '';
}

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeMarkdownCell(value) {
  return String(value || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function statusLabel(sourceStatus) {
  if (sourceStatus === 'ok') return 'OK';
  if (sourceStatus === 'changed') return 'Changed';
  if (sourceStatus === 'blocked') return 'Manual review';
  if (sourceStatus === 'manual') return 'Manual';
  return 'Broken';
}

function classifyHttpStatus(httpStatus) {
  if (httpStatus >= 200 && httpStatus < 400) return 'ok';
  if ([401, 403, 405, 429].includes(httpStatus)) return 'blocked';
  return 'broken';
}

async function fetchSource(source, previousById) {
  const checkedAt = new Date().toISOString();
  if (source.probe === false || noFetch) {
    return {
      id: source.id,
      country: source.country,
      authority: source.authority,
      title: source.title,
      url: source.url,
      sourceType: source.sourceType,
      watch: source.watch,
      status: 'manual',
      httpStatus: null,
      checkedAt,
      changedSinceLastRun: false,
      contentHash: null,
      note: noFetch ? 'Fetch skipped by --no-fetch.' : 'Manual review source.'
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(source.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'AfroToolsGovernmentSourceMonitor/1.0 (+https://afrotools.com/government/)',
        'accept': 'text/html,application/xhtml+xml,application/pdf,text/plain,*/*;q=0.8'
      }
    });
    clearTimeout(timer);

    const contentType = response.headers.get('content-type') || '';
    const etag = response.headers.get('etag') || '';
    const lastModified = response.headers.get('last-modified') || '';
    const contentLength = Number(response.headers.get('content-length') || 0);
    let bodyText = '';
    let derivedTitle = '';

    if (contentType.includes('text') || contentType.includes('html') || contentType.includes('json') || contentLength < maxBodyBytes) {
      try {
        bodyText = normalizeText(await response.text());
        derivedTitle = contentType.includes('html') ? titleFromHtml(bodyText) : '';
      } catch (error) {
        bodyText = '';
      }
    }

    const fingerprintBase = [
      response.status,
      response.url,
      contentType,
      etag,
      lastModified,
      bodyText || `content-length:${contentLength}`
    ].join('\n');
    const contentHash = hashText(fingerprintBase);
    const comparisonBase = [
      response.status,
      response.url,
      contentType,
      etag,
      lastModified,
      derivedTitle || source.title || '',
      (!etag && !lastModified && !derivedTitle) ? bodyText.slice(0, 12000) : ''
    ].join('\n');
    const changeHash = hashText(comparisonBase);
    const previous = previousById.get(source.id);
    const previousHash = previous && (previous.changeHash || previous.contentHash);
    const changedSinceLastRun = Boolean(previousHash && previousHash !== changeHash);
    const baseStatus = classifyHttpStatus(response.status);
    const status = baseStatus === 'broken' && source.manualReviewOnFailure ? 'manual' : baseStatus;

    return {
      id: source.id,
      country: source.country,
      authority: source.authority,
      title: derivedTitle || source.title,
      url: source.url,
      finalUrl: response.url,
      sourceType: source.sourceType,
      watch: source.watch,
      httpStatus: response.status,
      contentType,
      etag,
      lastModified,
      contentHash,
      changeHash,
      checkedAt,
      changedSinceLastRun,
      note: status === 'manual' && baseStatus === 'broken'
        ? `Returned HTTP ${response.status}; manual review required before updating public facts.`
        : undefined,
      status: changedSinceLastRun && status === 'ok' ? 'changed' : status
    };
  } catch (error) {
    clearTimeout(timer);
    const isNetworkReview = error.name === 'AbortError' || /fetch failed/i.test(error.message || '');
    return {
      id: source.id,
      country: source.country,
      authority: source.authority,
      title: source.title,
      url: source.url,
      sourceType: source.sourceType,
      watch: source.watch,
      status: isNetworkReview ? 'blocked' : 'broken',
      httpStatus: null,
      contentHash: null,
      checkedAt,
      changedSinceLastRun: false,
      error: error.name === 'AbortError' ? `Timed out after ${timeoutMs}ms` : error.message
    };
  }
}

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await worker(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

function validateManifest(manifest) {
  const sourceIds = new Set(manifest.sources.map((source) => source.id));
  const errors = [];

  manifest.tools.forEach((tool) => {
    if (!tool.id || !tool.route) errors.push(`Tool is missing id or route: ${JSON.stringify(tool)}`);
    (tool.sourceIds || []).forEach((sourceId) => {
      if (!sourceIds.has(sourceId)) errors.push(`${tool.id} references missing source ${sourceId}`);
    });
  });

  manifest.sources.forEach((source) => {
    if (!source.id || !source.url || !source.authority) {
      errors.push(`Source is missing id, authority, or url: ${JSON.stringify(source)}`);
    }
    if (source.url && !/^https:\/\//i.test(source.url)) {
      errors.push(`${source.id} must use an https official source URL`);
    }
  });

  const hub = fs.readFileSync(hubPath, 'utf8');
  manifest.tools.forEach((tool) => {
    if (!hub.includes(`href="${tool.route}"`)) {
      errors.push(`government/index.html does not link ${tool.route} for ${tool.id}`);
    }
  });

  if (errors.length) {
    throw new Error(errors.join('\n'));
  }
}

function summarize(manifest, sourceResults) {
  const totals = sourceResults.reduce((acc, source) => {
    acc.total += 1;
    acc[source.status] = (acc[source.status] || 0) + 1;
    if (source.changedSinceLastRun) acc.changed += 1;
    return acc;
  }, { total: 0, ok: 0, changed: 0, blocked: 0, broken: 0, manual: 0, changed: 0 });

  const highRiskTools = manifest.tools.filter((tool) => tool.priority === 'high').length;
  return {
    generatedAt: new Date().toISOString(),
    manifestVersion: manifest.version,
    category: manifest.category,
    toolCount: manifest.tools.length,
    highRiskTools,
    sourceCount: totals.total,
    okSources: totals.ok,
    changedSources: totals.changed,
    blockedSources: totals.blocked || 0,
    brokenSources: totals.broken || 0,
    manualSources: totals.manual || 0
  };
}

function buildStatus(manifest, sourceResults) {
  const summary = summarize(manifest, sourceResults);
  const bySource = new Map(sourceResults.map((source) => [source.id, source]));
  const tools = manifest.tools.map((tool) => {
    const sources = (tool.sourceIds || []).map((sourceId) => bySource.get(sourceId)).filter(Boolean);
    const statusRank = ['broken', 'changed', 'blocked', 'manual', 'ok'];
    const worst = statusRank.find((status) => sources.some((source) => source.status === status)) || 'ok';
    return {
      id: tool.id,
      route: tool.route,
      lane: tool.lane,
      priority: tool.priority,
      status: worst,
      sourceIds: tool.sourceIds || []
    };
  });

  return {
    summary,
    tools,
    sources: sourceResults,
    manualReviewRules: manifest.manualReviewRules
  };
}

function buildReport(status) {
  const lines = [
    '# Government Source Ledger',
    '',
    `Generated: ${status.summary.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Tools mapped: ${status.summary.toolCount}`,
    `- Official sources checked: ${status.summary.sourceCount}`,
    `- OK sources: ${status.summary.okSources}`,
    `- Changed sources: ${status.summary.changedSources}`,
    `- Manual-review or blocked sources: ${status.summary.blockedSources + status.summary.manualSources}`,
    `- Broken sources: ${status.summary.brokenSources}`,
    '',
    '## Sources',
    '',
    '| Status | Country | Authority | Source | HTTP | URL |',
    '| --- | --- | --- | --- | --- | --- |'
  ];

  status.sources.forEach((source) => {
    lines.push(`| ${statusLabel(source.status)} | ${escapeMarkdownCell(source.country)} | ${escapeMarkdownCell(source.authority)} | ${escapeMarkdownCell(source.title || source.id)} | ${source.httpStatus || ''} | ${escapeMarkdownCell(source.url)} |`);
  });

  lines.push('', '## Tool Review Queue', '');
  status.tools
    .filter((tool) => tool.status !== 'ok')
    .forEach((tool) => {
      lines.push(`- ${tool.id} (${tool.route}): ${statusLabel(tool.status)}`);
    });

  if (!status.tools.some((tool) => tool.status !== 'ok')) {
    lines.push('- No tool-specific source review queue.');
  }

  lines.push('', '## Manual Review Rules', '');
  status.manualReviewRules.forEach((rule) => lines.push(`- ${rule}`));
  lines.push('');

  return lines.join('\n');
}

function buildHubSummaryHtml(status) {
  const generated = new Date(status.summary.generatedAt);
  const dateLabel = generated.toISOString().slice(0, 10);
  return [
    '<div class="gov-source-stats" aria-label="Government source guidance summary">',
    `  <div class="gov-source-stat"><strong>${escapeHtml(dateLabel)}</strong><span>Last source review</span></div>`,
    `  <div class="gov-source-stat"><strong>${status.summary.sourceCount}</strong><span>Official sources referenced</span></div>`,
    `  <div class="gov-source-stat"><strong>${status.summary.highRiskTools}</strong><span>High-priority workflows</span></div>`,
    `  <div class="gov-source-stat"><strong>${status.summary.toolCount}</strong><span>Linked workflows</span></div>`,
    '</div>'
  ].join('\n');
}

function updateHubSummary(status) {
  const html = fs.readFileSync(hubPath, 'utf8');
  const start = '<!-- GOVERNMENT_SOURCE_SUMMARY_START -->';
  const end = '<!-- GOVERNMENT_SOURCE_SUMMARY_END -->';
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error('government/index.html is missing source summary markers.');
  }

  const next = [
    html.slice(0, startIndex + start.length),
    '\n',
    buildHubSummaryHtml(status),
    '\n    ',
    html.slice(endIndex)
  ].join('');

  if (next !== html) {
    fs.writeFileSync(hubPath, next);
  }
}

async function main() {
  const manifest = readJson(manifestPath);
  validateManifest(manifest);

  const previous = resetBaseline ? { sources: [] } : readJson(statusPath, { sources: [] });
  const previousById = new Map((previous.sources || []).map((source) => [source.id, source]));
  const sourceResults = await mapLimit(manifest.sources, concurrency, (source) => fetchSource(source, previousById));

  const status = buildStatus(manifest, sourceResults);
  const brokenRequired = status.sources.filter((source) => source.status === 'broken' && source.required !== false);

  if (!dryRun) {
    ensureDir(statusPath);
    ensureDir(reportPath);
    fs.writeFileSync(statusPath, `${JSON.stringify(status, null, 2)}\n`);
    fs.writeFileSync(reportPath, buildReport(status));
    updateHubSummary(status);
  }

  console.log(`Government source ledger: ${status.summary.sourceCount} sources, ${status.summary.changedSources} changed, ${status.summary.blockedSources} blocked/manual, ${status.summary.brokenSources} broken.`);
  if (brokenRequired.length) {
    brokenRequired.slice(0, 10).forEach((source) => {
      console.log(`BROKEN ${source.id}: ${source.error || source.httpStatus || 'unknown'} ${source.url}`);
    });
  }

  if (isCheck && brokenRequired.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
