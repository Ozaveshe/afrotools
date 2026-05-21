const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const trust = require(path.join(root, 'tools/scholarship-finder/scholarship-deadline-trust.js'));
const { loadScholarshipFeed } = require(path.join(root, 'netlify/functions/_shared/scholarship-platform.js'));

const outDir = path.join(root, 'audit-results');
const csvPath = path.join(outDir, 'scholarship-deadline-enrichment-priority.csv');
const jsonPath = path.join(outDir, 'scholarship-deadline-enrichment-priority.json');
const reportPath = path.join(outDir, 'scholarship-deadline-quality-audit.md');
const generatedAt = new Date().toISOString();

const HERO_DESTINATIONS = new Set(['uk', 'united kingdom', 'canada', 'australia', 'us', 'usa', 'united states', 'germany', 'eu', 'europe']);
const STRONG_PROVIDER_PATTERNS = [
  /government/i,
  /commonwealth/i,
  /mastercard/i,
  /world bank/i,
  /daad/i,
  /fulbright/i,
  /chevening/i,
  /rhodes/i,
  /gates/i,
  /erasmus/i,
  /university/i,
  /cambridge/i,
  /oxford/i,
  /stanford/i,
  /warwick/i,
  /melbourne/i
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function csvEscape(value) {
  const text = String(value == null ? '' : value);
  if (/[",\n\r]/.test(text)) return '"' + text.replace(/"/g, '""') + '"';
  return text;
}

function clean(value) {
  return String(value == null ? '' : value).trim();
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  return String(value).split(/[;,|]/).map(clean).filter(Boolean);
}

function firstValue(values) {
  for (let index = 0; index < values.length; index += 1) {
    const value = clean(values[index]);
    if (value) return value;
  }
  return '';
}

function scholarshipId(item) {
  return firstValue([item.id, item.scholarshipId, item.slug, trust.scholarshipKey(item)]);
}

function scholarshipName(item) {
  return firstValue([item.name, item.title]);
}

function sourceUrl(item) {
  return firstValue([
    item.deadlineSourceUrl,
    item.deadline_source_url,
    item.source_url,
    item.sourceUrl,
    item.official_url,
    item.officialUrl,
    item.application_url,
    item.applicationUrl,
    item.info_url,
    item.infoUrl
  ]);
}

function lastChecked(item) {
  return firstValue([
    item.deadlineLastChecked,
    item.deadline_last_checked,
    item.last_verified_at,
    item.lastVerifiedAt,
    item.last_checked,
    item.lastChecked,
    item.last_seen_at,
    item.updated_at,
    item.updatedAt
  ]);
}

function destinationList(item) {
  return toArray(item.destinations || item.destination_countries || item.destination || item.country);
}

function levelList(item) {
  return toArray(item.levels || item.study_levels || item.level || item.studyLevel);
}

function fieldList(item) {
  return toArray(item.fields || item.field || item.discipline);
}

function hasHeroDestination(item) {
  return destinationList(item).some((destination) => HERO_DESTINATIONS.has(destination.toLowerCase()));
}

function isFullyFunded(item) {
  return /full|fully/i.test(clean(item.funding || item.funding_type || item.fundingType));
}

function hasStrongProvider(item) {
  const haystack = [scholarshipName(item), item.provider].map(clean).join(' ');
  return STRONG_PROVIDER_PATTERNS.some((pattern) => pattern.test(haystack));
}

function isSourceBlockedOrManual(item) {
  return /blocked|manual_review|needs_review/i.test(clean(item.proof_level || item.parser_key || item.source_type || item.trust_level));
}

function priorityScore(item, normalized) {
  let score = 0;
  if (normalized.deadlineStatus === 'unclear') score += 45;
  if (normalized.deadlineStatus === 'upcoming') score += 30;
  if (normalized.deadlineStatus === 'closed') score += 20;
  if (sourceUrl(item)) score += 20;
  if (lastChecked(item)) score += 10;
  if (hasHeroDestination(item)) score += 15;
  if (isFullyFunded(item)) score += 15;
  if (hasStrongProvider(item)) score += 12;
  if (isSourceBlockedOrManual(item)) score += 8;
  if (normalized.deadlineConfidence === 'verified') score -= 40;
  return Math.max(0, score);
}

function suggestedAction(item, normalized) {
  if (normalized.deadlineStatus === 'open' || normalized.deadlineStatus === 'urgent' || normalized.deadlineStatus === 'closing_soon') {
    return normalized.deadlineConfidence === 'verified'
      ? 'Keep monitoring source before the next cycle.'
      : 'Verify the exact date against the official source and add deadlineLastChecked.';
  }
  if (normalized.deadlineStatus === 'rolling') {
    return 'Confirm rolling-deadline wording on the official provider page and add deadlineNotes.';
  }
  if (normalized.deadlineStatus === 'upcoming') {
    return 'Verify the exact cycle date when published; do not convert month-only text into a date.';
  }
  if (normalized.deadlineStatus === 'closed') {
    return 'Confirm whether the cycle is closed or reopened, then update status and source date.';
  }
  if (sourceUrl(item)) {
    return 'Open official/source URL and verify whether a 2026 deadline is published.';
  }
  return 'Find an official provider URL before adding any deadline.';
}

function sourceKey(item) {
  return firstValue([item.source_key, item.sourceName, item.source_name, item.provider, 'unknown']);
}

function sourceLabel(item) {
  return firstValue([item.source_name, item.sourceName, item.source_key, item.provider, 'Unknown source']);
}

function buildRows(items) {
  return items.map((item) => {
    const normalized = trust.normalizeDeadline(item);
    return {
      scholarship_id: scholarshipId(item),
      name: scholarshipName(item),
      provider: clean(item.provider),
      destination: destinationList(item).join('; '),
      level: levelList(item).join('; '),
      field: fieldList(item).join('; '),
      current_deadline_status: normalized.deadlineStatus,
      current_deadline_date: normalized.deadlineDate || '',
      deadline_text: normalized.deadlineText || '',
      deadline_confidence: normalized.deadlineConfidence,
      source_url: sourceUrl(item),
      last_checked: lastChecked(item),
      priority_score: priorityScore(item, normalized),
      suggested_action: suggestedAction(item, normalized),
      source_key: sourceKey(item),
      source_name: sourceLabel(item),
      funding_type: clean(item.funding || item.funding_type || item.fundingType)
    };
  }).sort((left, right) => {
    return right.priority_score - left.priority_score || left.name.localeCompare(right.name);
  });
}

function countWhere(items, predicate) {
  return items.reduce((count, item) => count + (predicate(item) ? 1 : 0), 0);
}

function buildSourceSummary(items) {
  const summary = new Map();
  items.forEach((item) => {
    const normalized = trust.normalizeDeadline(item);
    const key = sourceKey(item);
    const row = summary.get(key) || {
      sourceKey: key,
      sourceName: sourceLabel(item),
      activeCount: 0,
      realDeadlineDate: 0,
      unclearDeadline: 0,
      sourceUrl: 0,
      lastChecked: 0,
      reliability: 'needs_review'
    };
    row.activeCount += 1;
    if (normalized.deadlineDate) row.realDeadlineDate += 1;
    if (normalized.deadlineStatus === 'unclear') row.unclearDeadline += 1;
    if (sourceUrl(item)) row.sourceUrl += 1;
    if (lastChecked(item)) row.lastChecked += 1;
    summary.set(key, row);
  });

  return Array.from(summary.values()).map((row) => {
    if (row.activeCount > 0 && row.realDeadlineDate === row.activeCount && row.sourceUrl === row.activeCount && row.lastChecked === row.activeCount) {
      row.reliability = 'strong';
    } else if (row.sourceUrl === row.activeCount && row.lastChecked === row.activeCount) {
      row.reliability = 'source-linked_deadline-weak';
    } else if (row.sourceUrl > 0) {
      row.reliability = 'partial';
    }
    return row;
  }).sort((left, right) => right.activeCount - left.activeCount || left.sourceName.localeCompare(right.sourceName));
}

function buildCounts(items) {
  const normalized = items.map((item) => trust.normalizeDeadline(item));
  return {
    totalActiveScholarships: items.length,
    realDeadlineDate: countWhere(normalized, (row) => !!row.deadlineDate),
    unclearDeadline: countWhere(normalized, (row) => row.deadlineStatus === 'unclear'),
    deadlineMonthOnly: countWhere(items, (item) => !trust.normalizeDeadline(item).deadlineDate && clean(item.deadlineMonth || item.deadline_month)),
    deadlineMonthOrAnnualTextOnly: countWhere(normalized, (row) => row.deadlineStatus === 'upcoming'),
    rollingDeadline: countWhere(normalized, (row) => row.deadlineStatus === 'rolling'),
    closedOrPastDeadline: countWhere(normalized, (row) => row.deadlineStatus === 'closed'),
    sourceUrl: countWhere(items, sourceUrl),
    lastChecked: countWhere(items, lastChecked),
    verifiedDeadlineConfidence: countWhere(normalized, (row) => row.deadlineConfidence === 'verified'),
    inferredDeadlineConfidence: countWhere(normalized, (row) => row.deadlineConfidence === 'inferred'),
    unclearDeadlineConfidence: countWhere(normalized, (row) => row.deadlineConfidence === 'unclear')
  };
}

function buildJson(items, feedMeta, rows, sourceSummary, counts) {
  return {
    generatedAt,
    feedMode: feedMeta.mode || 'unknown',
    feedLabel: feedMeta.label || '',
    counts,
    deadlineModel: {
      fields: [
        'deadlineDate',
        'deadlineText',
        'deadlineStatus',
        'deadlineConfidence',
        'deadlineSourceUrl',
        'deadlineLastChecked',
        'deadlineNotes'
      ],
      safeRules: [
        'Only structured future deadline_date values receive days-left calculations.',
        'Rolling deadlines do not calculate days left.',
        'Month-only deadlines are shown as month-only or annual-cycle guidance.',
        'Unclear deadlines always require official-provider confirmation.',
        'Past dates are marked closed or needs review, never urgent.'
      ]
    },
    sourceSummary,
    priorityRows: rows,
    top30: rows.slice(0, 30)
  };
}

function formatSourceSummary(sourceSummary) {
  return sourceSummary.map((row) => {
    return '| ' + [
      row.sourceName,
      row.sourceKey,
      row.activeCount,
      row.realDeadlineDate,
      row.unclearDeadline,
      row.sourceUrl,
      row.lastChecked,
      row.reliability
    ].map(csvEscape).join(' | ') + ' |';
  }).join('\n');
}

function formatTopRows(rows) {
  return rows.slice(0, 30).map((row, index) => {
    return '| ' + [
      index + 1,
      row.name,
      row.provider,
      row.destination,
      row.current_deadline_status,
      row.current_deadline_date || row.deadline_text || 'not published',
      row.priority_score,
      row.suggested_action
    ].map(csvEscape).join(' | ') + ' |';
  }).join('\n');
}

function buildMarkdown(counts, sourceSummary, rows, feedMeta) {
  return [
    '# Scholarship Deadline Quality Audit',
    '',
    'Generated: ' + generatedAt,
    '',
    '## Verdict',
    '',
    counts.realDeadlineDate >= Math.max(10, Math.round(counts.totalActiveScholarships * 0.25))
      ? '**Ready with warnings.** Deadline quality is improving, but unclear deadlines still require official-source confirmation.'
      : '**Not ready for heavy paid ads.** The UI is safe, but deadline quality remains weak because most active scholarships do not have exact source-backed dates.',
    '',
    '## Current Counts',
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    '| Active scholarships in feed | ' + counts.totalActiveScholarships + ' |',
    '| Real structured deadline_date | ' + counts.realDeadlineDate + ' |',
    '| Deadline unclear | ' + counts.unclearDeadline + ' |',
    '| Structured deadline_month only | ' + counts.deadlineMonthOnly + ' |',
    '| Month-only / annual text only | ' + counts.deadlineMonthOrAnnualTextOnly + ' |',
    '| Rolling deadline | ' + counts.rollingDeadline + ' |',
    '| Closed or past deadline | ' + counts.closedOrPastDeadline + ' |',
    '| Source URL present | ' + counts.sourceUrl + ' |',
    '| Last checked date present | ' + counts.lastChecked + ' |',
    '| Verified deadline confidence | ' + counts.verifiedDeadlineConfidence + ' |',
    '| Inferred deadline confidence | ' + counts.inferredDeadlineConfidence + ' |',
    '| Unclear deadline confidence | ' + counts.unclearDeadlineConfidence + ' |',
    '',
    'Feed mode: `' + (feedMeta.mode || 'unknown') + '`.',
    '',
    '## Safe Display Logic',
    '',
    '- Future `deadline_date` values show days left only when the date parses as a real exact date.',
    '- Rolling deadlines show `Rolling deadline` and do not calculate urgency.',
    '- Month-only or annual cycle text shows `Deadline month only` or `Annual cycle expected`; it does not calculate days left.',
    '- Unclear deadlines show `Deadline unclear` and force official-provider confirmation.',
    '- Past dates show `Currently closed` or needs review language, not urgency.',
    '',
    '## Source Reliability',
    '',
    '| Source | Source key | Active | Real date | Unclear | Source URL | Last checked | Reliability |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |',
    formatSourceSummary(sourceSummary),
    '',
    '## Top 30 Manual Enrichment Priorities',
    '',
    '| # | Scholarship | Provider | Destination | Deadline status | Current deadline | Priority | Suggested action |',
    '| ---: | --- | --- | --- | --- | --- | ---: | --- |',
    formatTopRows(rows),
    '',
    '## Backend/Admin Workflow Recommendation',
    '',
    'Add nullable enrichment fields to `scholarships` when the backend migration window opens:',
    '',
    '- `deadline_status`: open, closing_soon, urgent, closed, rolling, unclear, upcoming',
    '- `deadline_confidence`: verified, inferred, unclear',
    '- `deadline_source_url`: official provider or scholarship deadline page',
    '- `deadline_last_checked`: date the exact deadline was manually or automatically checked',
    '- `deadline_notes`: short explanation for rolling, month-only, closed, or source-gapped deadlines',
    '',
    'Suggested admin/import workflow:',
    '',
    '1. Start from `audit-results/scholarship-deadline-enrichment-priority.csv`.',
    '2. Verify top-priority rows against official provider pages.',
    '3. Update exact `deadline_date` only when the official source publishes a real date.',
    '4. Use `deadline_text` plus `deadline_status=rolling` for rolling admissions.',
    '5. Use `deadline_text` plus `deadline_status=upcoming` for month-only or annual-cycle notices.',
    '6. Keep `deadline_status=unclear` when the source does not publish a reliable deadline.',
    '7. Re-run this script after each enrichment batch and compare counts.',
    '',
    '## Frontend Trust Workflow',
    '',
    '- Scholarship cards use a deadline normalization layer that reads existing API fields first and future `deadline_*` fields when available.',
    '- The card trust row shows deadline status, confidence, last checked, source link, and official provider link.',
    '- Unclear, month-only, closed, or otherwise suspicious deadlines expose `Report deadline` and `Submit official deadline source` actions.',
    '- Report actions are stored in localStorage under `afro-scholarship-deadline-reports-v1` unless a live review endpoint is added.',
    '',
    'Analytics events added:',
    '',
    '- `scholarship_deadline_source_opened`',
    '- `scholarship_deadline_report_clicked`',
    '- `scholarship_deadline_report_submitted`',
    '- `scholarship_unclear_deadline_viewed`',
    '- `scholarship_verified_deadline_viewed`',
    '',
    '## Fields Needing Enrichment',
    '',
    '- `deadline_date` for exact source-backed dates.',
    '- `deadline_text` for source wording when exact dates are absent.',
    '- `deadline_status` for rolling, upcoming, closed, and unclear states.',
    '- `deadline_confidence` so UI can separate verified from inferred.',
    '- `deadline_source_url` when the general scholarship page differs from the deadline page.',
    '- `deadline_last_checked` for trust and stale-source review.',
    '- `deadline_notes` for annual cycles, programme-specific dates, and manual review warnings.',
    '',
    '## Guardrails',
    '',
    '- Do not invent deadlines.',
    '- Do not turn month-only text into an exact date.',
    '- Do not show urgent or closing-soon badges for unclear deadlines.',
    '- Keep official provider links prominent on every card.',
    '- Treat user-submitted deadline reports as local feedback unless a live review endpoint is added.'
  ].join('\n');
}

function writeCsv(rows) {
  const headers = [
    'scholarship id',
    'name',
    'provider',
    'destination',
    'level',
    'field',
    'current deadline status',
    'current deadline date',
    'source URL',
    'last checked',
    'priority score',
    'suggested action'
  ];
  const lines = [headers.map(csvEscape).join(',')];
  rows.forEach((row) => {
    lines.push([
      row.scholarship_id,
      row.name,
      row.provider,
      row.destination,
      row.level,
      row.field,
      row.current_deadline_status,
      row.current_deadline_date,
      row.source_url,
      row.last_checked,
      row.priority_score,
      row.suggested_action
    ].map(csvEscape).join(','));
  });
  fs.writeFileSync(csvPath, lines.join('\n') + '\n');
}

async function main() {
  ensureDir(outDir);
  const feed = await loadScholarshipFeed();
  const items = Array.isArray(feed.scholarships) ? feed.scholarships : [];
  const rows = buildRows(items);
  const counts = buildCounts(items);
  const sourceSummary = buildSourceSummary(items);
  const json = buildJson(items, feed.meta || {}, rows, sourceSummary, counts);

  writeCsv(rows);
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n');
  fs.writeFileSync(reportPath, buildMarkdown(counts, sourceSummary, rows, feed.meta || {}) + '\n');

  console.log(JSON.stringify({
    generatedAt,
    totalActiveScholarships: counts.totalActiveScholarships,
    realDeadlineDate: counts.realDeadlineDate,
    unclearDeadline: counts.unclearDeadline,
    csv: path.relative(root, csvPath),
    json: path.relative(root, jsonPath),
    report: path.relative(root, reportPath)
  }, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  buildCounts,
  buildRows,
  priorityScore,
  suggestedAction
};
