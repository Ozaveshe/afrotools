#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const {
  TOOL_DIR,
  CONFLICTS_DIR,
  MANIFEST_PATH,
  SITE_ORIGIN,
  TOOL_OG_IMAGE,
  escapeHtml,
  safeJson,
  ensureDir,
  excerpt,
  humanize,
  humanList,
  buildManifest,
  writeManifest,
  writeStaticRoutes
} = require("./lib/africa-conflict-static");

const LANDING_PATH = path.join(TOOL_DIR, "index.html");
const CONFLICTS_PAGE_PATH = path.join(TOOL_DIR, "conflicts.html");
const AC_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;0,9..40,800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500;700&display=swap";

const CONFLICT_TYPE_LABELS = {
  civil_war: "Civil War",
  insurgency: "Insurgency",
  interstate: "Interstate",
  proxy_war: "Proxy War",
  coup: "Coup/Post-Coup",
  communal: "Communal Violence",
  separatist: "Separatist",
  foreign_intervention: "Foreign Intervention",
  hybrid: "Hybrid",
  frozen: "Frozen Conflict",
  criminal_violence: "Criminal Violence"
};

const SECTION_LINKS = [
  ["/tools/africa-conflict/conflicts/", "Conflicts"],
  ["/tools/africa-conflict/map/", "Map"],
  ["/tools/africa-conflict/actors/", "Actors"],
  ["/tools/africa-conflict/displacement/", "Displacement"],
  ["/tools/africa-conflict/economy/", "Economy"],
  ["/tools/africa-conflict/forecasts/", "Forecasts"],
  ["/tools/africa-conflict/methodology/", "Methodology"]
];

function formatNumber(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return "0";
  if (number >= 1000000000) return `${(number / 1000000000).toFixed(1)}B`;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${Math.round(number / 1000)}K`;
  return number.toLocaleString("en-US");
}

function formatRange(min, max) {
  if (!min && !max) return "Not available";
  const left = formatNumber(min || max);
  const right = formatNumber(max || min);
  return left === right ? left : `${left}-${right}`;
}

function formatCurrencyMillions(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number <= 0) return "Not available";
  if (number >= 1000) return `USD ${(number / 1000).toFixed(1)}B`;
  return `USD ${Math.round(number).toLocaleString("en-US")}M`;
}

function formatCurrencyBillions(min, max) {
  if (!min && !max) return "Not available";
  if (min && max && Number(min) !== Number(max)) return `USD ${min}-${max}B`;
  return `USD ${max || min}B`;
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function statusLabel(value) {
  return humanize(value || "unknown");
}

function conflictTypeLabel(value) {
  return CONFLICT_TYPE_LABELS[value] || humanize(value || "Conflict");
}

function regionLabel(value) {
  return humanize(value || "Region");
}

function metaDescription(conflict) {
  const geography =
    humanList(conflict.regions.map(regionLabel), 2) || conflict.primary_country || "Africa";
  return excerpt(
    `${conflict.summary || conflict.name} Status: ${statusLabel(conflict.status)}. Primary geography: ${geography}.`,
    158
  );
}

function tagsHtml(values) {
  const items = (values || []).filter(Boolean);
  if (!items.length) return '<span class="acd-static-muted">Not available</span>';
  return items
    .map((value) => `<span class="acd-tag">${escapeHtml(humanize(value))}</span>`)
    .join("");
}

function metricCard(label, value, source) {
  return `<div class="acd-static-metric">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    ${source ? `<small>${escapeHtml(source)}</small>` : ""}
  </div>`;
}

function findRelatedConflicts(conflict, manifest) {
  const generated = manifest.conflicts.filter(
    (entry) => entry.generated_in_wave && entry.slug !== conflict.slug
  );
  const conflictRegions = new Set(conflict.regions || []);
  const conflictCountries = new Set([
    ...(conflict.countries_involved || []),
    ...(conflict.spillover_countries || [])
  ]);

  return generated
    .map((entry) => {
      const regionOverlap = (entry.regions || []).filter((region) => conflictRegions.has(region)).length;
      const countryOverlap = [
        ...(entry.countries_involved || []),
        ...(entry.spillover_countries || [])
      ].filter((country) => conflictCountries.has(country)).length;
      const typeMatch = entry.conflict_type === conflict.conflict_type ? 1 : 0;
      const riskMatch = entry.escalation_risk === conflict.escalation_risk ? 1 : 0;
      const score = regionOverlap * 4 + countryOverlap * 3 + typeMatch * 2 + riskMatch;
      return { entry, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.entry.name.localeCompare(right.entry.name))
    .slice(0, 4)
    .map((item) => item.entry);
}

function buildSchemas(conflict, description) {
  const pageUrl = conflict.route_url;
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: `${conflict.name} | Timeline, Actors, Displacement & Outlook | AfroTools`,
    description,
    isPartOf: {
      "@type": "WebSite",
      name: "AfroTools",
      url: `${SITE_ORIGIN}/`
    },
    about: [
      conflict.name,
      conflictTypeLabel(conflict.conflict_type),
      statusLabel(conflict.status),
      ...(conflict.regions || []).map(regionLabel)
    ].filter(Boolean),
    dateModified: conflict.updated_at || conflict.created_at || new Date().toISOString()
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AfroTools",
        item: `${SITE_ORIGIN}/`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Africa Conflict",
        item: `${SITE_ORIGIN}/tools/africa-conflict/`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Conflicts",
        item: `${SITE_ORIGIN}/tools/africa-conflict/conflicts/`
      },
      {
        "@type": "ListItem",
        position: 4,
        name: conflict.name,
        item: pageUrl
      }
    ]
  };

  return { webPageSchema, breadcrumbSchema };
}

function renderSectionLinks() {
  return SECTION_LINKS.map(
    ([href, label]) => `<a class="acd-static-link" href="${href}">${escapeHtml(label)}</a>`
  ).join("");
}

function renderRelatedLinks(conflict, manifest) {
  const related = findRelatedConflicts(conflict, manifest);
  if (!related.length) return "";

  return `<section class="acd-static-section">
    <div class="acd-static-section-head">
      <p class="acd-section-kicker">Related dossiers</p>
      <h2>Nearby pressure points</h2>
    </div>
    <div class="acd-static-related-grid">
      ${related
        .map(
          (entry) => `<a class="acd-static-related-card" href="${entry.route_path}">
            <span>${escapeHtml(statusLabel(entry.status))} | ${escapeHtml(conflictTypeLabel(entry.conflict_type))}</span>
            <strong>${escapeHtml(entry.name)}</strong>
            <p>${escapeHtml(excerpt(entry.summary, 130))}</p>
          </a>`
        )
        .join("")}
    </div>
  </section>`;
}

function renderTimeline(conflict) {
  const timeline = conflict.related_data.timeline || [];
  if (!timeline.length) return "";

  return `<section class="acd-static-section">
    <div class="acd-static-section-head">
      <p class="acd-section-kicker">Timeline</p>
      <h2>Recorded milestones</h2>
    </div>
    <div class="acd-static-timeline">
      ${timeline
        .map(
          (item) => `<article class="acd-static-timeline-item">
            <span>${escapeHtml(formatDate(item.event_date))} | ${escapeHtml(humanize(item.category || "event"))}</span>
            <strong>${escapeHtml(item.title)}</strong>
            ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
          </article>`
        )
        .join("")}
    </div>
  </section>`;
}

function buildDossierPageHtml(conflict, manifest) {
  const title = `${conflict.name} | Timeline, Actors, Displacement & Outlook | AfroTools`;
  const description = metaDescription(conflict);
  const { webPageSchema, breadcrumbSchema } = buildSchemas(conflict, description);
  const displacedTotal = Number(conflict.idps_count || 0) + Number(conflict.refugees_count || 0);
  const regions = humanList(conflict.regions.map(regionLabel), 3) || "Africa";
  const countries = humanList(conflict.countries_involved, 5) || conflict.primary_country;
  const hasSideTables = Object.values(conflict.related_counts || {}).some((count) => count > 0);
  const relatedSection = renderRelatedLinks(conflict, manifest);
  const timelineSection = renderTimeline(conflict);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${conflict.route_url}">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${TOOL_OG_IMAGE}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${conflict.route_url}">
  <meta property="og:site_name" content="AfroTools">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${TOOL_OG_IMAGE}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="${AC_FONT_HREF}" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="${AC_FONT_HREF}"></noscript>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=c94dde91">
  <link rel="stylesheet" href="/tools/africa-conflict/style.css?v=4260f20e">
  <style>
    .acd-static-dossier { background: var(--acd-bg, #070b16); color: var(--acd-text, #f8fafc); }
    .acd-static-hero { padding: 72px 24px 48px; background: radial-gradient(circle at 20% 0%, rgba(37,99,235,.18), transparent 32%), linear-gradient(135deg, #07111f, #140d13); border-bottom: 1px solid rgba(148,163,184,.18); }
    .acd-static-inner { width: min(1160px, calc(100% - 32px)); margin: 0 auto; }
    .acd-static-breadcrumb { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 24px; color: rgba(226,232,240,.72); font-size: .86rem; }
    .acd-static-breadcrumb a { color: #bfdbfe; text-decoration: none; }
    .acd-static-kicker { display: inline-flex; gap: 8px; align-items: center; margin-bottom: 14px; color: #93c5fd; text-transform: uppercase; letter-spacing: .08em; font-size: .72rem; font-weight: 800; }
    .acd-static-hero h1 { max-width: 900px; margin: 0; font-family: var(--font-display, Georgia, serif); font-size: clamp(2.6rem, 8vw, 5.8rem); line-height: .92; letter-spacing: 0; }
    .acd-static-lede { max-width: 760px; margin: 22px 0 0; color: rgba(226,232,240,.86); line-height: 1.75; font-size: 1.04rem; }
    .acd-static-badges { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
    .acd-static-badge { border: 1px solid rgba(147,197,253,.28); background: rgba(15,23,42,.72); color: #dbeafe; border-radius: 999px; padding: 8px 12px; font-size: .8rem; font-weight: 800; }
    .acd-static-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 26px; }
    .acd-static-main { padding: 42px 24px 72px; }
    .acd-static-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(280px, .75fr); gap: 24px; }
    .acd-static-panel, .acd-static-section, .acd-static-related-card, .acd-static-metric, .acd-static-link-panel { background: rgba(15,23,42,.78); border: 1px solid rgba(148,163,184,.18); border-radius: 8px; box-shadow: 0 20px 60px rgba(0,0,0,.22); }
    .acd-static-panel, .acd-static-section, .acd-static-link-panel { padding: 24px; }
    .acd-static-section { margin-top: 24px; }
    .acd-static-section-head { display: grid; gap: 6px; margin-bottom: 18px; }
    .acd-static-section-head h2, .acd-static-link-panel h2 { margin: 0; color: #f8fafc; font-size: clamp(1.35rem, 3vw, 2rem); }
    .acd-static-copy { color: rgba(226,232,240,.78); line-height: 1.75; margin: 0; }
    .acd-static-metric-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .acd-static-metric { padding: 16px; display: grid; gap: 6px; }
    .acd-static-metric span, .acd-static-metric small, .acd-static-related-card span, .acd-static-timeline-item span, .acd-static-muted { color: rgba(148,163,184,.9); font-size: .78rem; }
    .acd-static-metric strong { color: #fff; font-size: 1.25rem; }
    .acd-static-tags { display: flex; flex-wrap: wrap; gap: 10px; }
    .acd-static-link-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 16px; }
    .acd-static-link { display: block; border: 1px solid rgba(147,197,253,.24); background: rgba(30,41,59,.68); color: #bfdbfe; border-radius: 8px; padding: 12px 14px; text-decoration: none; font-weight: 800; }
    .acd-static-related-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .acd-static-related-card { display: grid; gap: 8px; padding: 18px; color: inherit; text-decoration: none; }
    .acd-static-related-card strong { color: #fff; }
    .acd-static-related-card p { margin: 0; color: rgba(226,232,240,.72); line-height: 1.55; }
    .acd-static-timeline { display: grid; gap: 12px; }
    .acd-static-timeline-item { padding-left: 16px; border-left: 2px solid rgba(96,165,250,.42); display: grid; gap: 6px; }
    .acd-static-timeline-item strong { color: #fff; }
    .acd-static-data-note { margin-top: 18px; color: rgba(226,232,240,.72); line-height: 1.65; font-size: .92rem; }
    @media (max-width: 920px) {
      .acd-static-grid, .acd-static-metric-grid, .acd-static-link-grid, .acd-static-related-grid { grid-template-columns: 1fr; }
      .acd-static-hero { padding-top: 48px; }
    }
  </style>
  <script type="application/ld+json">${safeJson(webPageSchema)}</script>
  <script type="application/ld+json">${safeJson(breadcrumbSchema)}</script>
</head>
<body>
<afro-navbar></afro-navbar>
<main class="acd-static-dossier">
  <section class="acd-static-hero">
    <div class="acd-static-inner">
      <nav class="acd-static-breadcrumb" aria-label="breadcrumb">
        <a href="/">AfroTools</a><span>/</span><a href="/tools/">Tools</a><span>/</span><a href="/tools/africa-conflict/">Africa Conflict</a><span>/</span><a href="/tools/africa-conflict/conflicts/">Conflicts</a><span>/</span><span>${escapeHtml(conflict.name)}</span>
      </nav>
      <div class="acd-static-kicker">Static conflict dossier</div>
      <h1>${escapeHtml(conflict.name)}</h1>
      <p class="acd-static-lede">${escapeHtml(conflict.summary)}</p>
      <div class="acd-static-badges">
        <span class="acd-static-badge">${escapeHtml(statusLabel(conflict.status))}</span>
        <span class="acd-static-badge">${escapeHtml(conflictTypeLabel(conflict.conflict_type))}</span>
        <span class="acd-static-badge">${escapeHtml(regions)}</span>
        <span class="acd-static-badge">Updated ${escapeHtml(formatDate(conflict.updated_at || conflict.created_at))}</span>
      </div>
      <div class="acd-static-actions">
        <a class="acd-btn acd-btn-primary" href="/tools/africa-conflict/conflicts/">All conflicts</a>
        <a class="acd-btn acd-btn-outline" href="/tools/africa-conflict/map/">Open map</a>
        <a class="acd-btn acd-btn-outline" href="/tools/africa-conflict/methodology/">Methodology</a>
      </div>
    </div>
  </section>

  <section class="acd-static-main">
    <div class="acd-static-inner acd-static-grid">
      <div>
        <section class="acd-static-panel">
          <div class="acd-static-section-head">
            <p class="acd-section-kicker">Dossier summary</p>
            <h2>Current conflict profile</h2>
          </div>
          <p class="acd-static-copy">${escapeHtml(conflict.summary)}</p>
          ${conflict.why_persists ? `<div class="acd-static-section">
            <div class="acd-static-section-head">
              <p class="acd-section-kicker">Persistence drivers</p>
              <h2>Why this conflict persists</h2>
            </div>
            <p class="acd-static-copy">${escapeHtml(conflict.why_persists)}</p>
          </div>` : ""}
        </section>

        <section class="acd-static-section">
          <div class="acd-static-section-head">
            <p class="acd-section-kicker">Human and economic impact</p>
            <h2>Displacement, fatalities, and economic pressure</h2>
          </div>
          <div class="acd-static-metric-grid">
            ${metricCard("Estimated fatalities", formatRange(conflict.fatalities_min, conflict.fatalities_max), conflict.fatalities_source)}
            ${metricCard("Total displaced", formatNumber(displacedTotal), conflict.displacement_source)}
            ${metricCard("IDPs", formatNumber(conflict.idps_count), conflict.displacement_date ? `As of ${formatDate(conflict.displacement_date)}` : "")}
            ${metricCard("Refugees", formatNumber(conflict.refugees_count), conflict.displacement_source)}
            ${metricCard("Military spend per year", formatCurrencyMillions(conflict.military_spend_usd_m), conflict.military_spend_source)}
            ${metricCard("Estimated economic loss", formatCurrencyBillions(conflict.economic_loss_min_usd_b, conflict.economic_loss_max_usd_b), conflict.economic_source)}
          </div>
          <p class="acd-static-data-note">${hasSideTables ? "This dossier includes static summary fields plus linked live conflict tables where the export found related rows." : "The live side tables for actors, displacement timeseries, economy rows, forecasts, events, and timeline are currently empty for this conflict, so this static dossier uses the verified inline conflict record."}</p>
        </section>

        <section class="acd-static-section">
          <div class="acd-static-section-head">
            <p class="acd-section-kicker">Outlook</p>
            <h2>Risk and spillover assessment</h2>
          </div>
          <div class="acd-static-metric-grid">
            ${metricCard("Escalation risk", statusLabel(conflict.escalation_risk), "")}
            ${metricCard("Spillover risk", statusLabel(conflict.spillover_risk), "")}
            ${metricCard("Spillover exposure", conflict.spillover_countries.length ? humanList(conflict.spillover_countries, 6) : "Contained or not recorded", "")}
            ${metricCard("Conflict stage", conflict.conflict_stage ? `Stage ${conflict.conflict_stage}` : "Not available", "")}
          </div>
          ${conflict.related_data.latest_forecast ? `<p class="acd-static-copy" style="margin-top:16px">${escapeHtml(conflict.related_data.latest_forecast.base_outcome || conflict.related_data.latest_forecast.analyst_notes || "A forecast record exists for this conflict.")}</p>` : ""}
        </section>

        ${timelineSection}
        ${relatedSection}
      </div>

      <aside>
        <section class="acd-static-link-panel">
          <h2>Dossier navigation</h2>
          <div class="acd-static-link-grid">
            ${renderSectionLinks()}
          </div>
        </section>

        <section class="acd-static-section">
          <div class="acd-static-section-head">
            <p class="acd-section-kicker">Geography</p>
            <h2>Countries and regions</h2>
          </div>
          <p class="acd-static-copy"><strong>Primary country:</strong> ${escapeHtml(conflict.primary_country || "Not available")}</p>
          <p class="acd-static-copy"><strong>Countries involved:</strong> ${escapeHtml(countries || "Not available")}</p>
          <p class="acd-static-copy"><strong>Regions:</strong> ${escapeHtml(regions)}</p>
        </section>

        <section class="acd-static-section">
          <div class="acd-static-section-head">
            <p class="acd-section-kicker">Drivers</p>
            <h2>Triggers and resource links</h2>
          </div>
          <div class="acd-static-tags">${tagsHtml(conflict.key_triggers)}</div>
          <div class="acd-static-tags" style="margin-top:14px">${tagsHtml(conflict.resource_links)}</div>
        </section>
      </aside>
    </div>
  </section>
</main>
<afro-footer></afro-footer>
<script src="/assets/js/components/navbar.js?v=8486e8e9" defer></script>
<script src="/assets/js/components/footer.js?v=b612b5b2" defer></script>
</body>
</html>
`;
}

function buildConflictHubIndexHtml(manifest) {
  const title = "Africa Conflict Dossiers | AfroTools";
  const description = excerpt(
    `${manifest.wave.conflict_count} static Africa Conflict dossier routes backed by the live Supabase conflict inventory.`,
    158
  );
  const pageUrl = `${SITE_ORIGIN}/tools/africa-conflict/conflicts/`;
  const conflicts = manifest.conflicts.filter((conflict) => conflict.generated_in_wave);
  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: title,
    description,
    isPartOf: {
      "@type": "WebSite",
      name: "AfroTools",
      url: `${SITE_ORIGIN}/`
    },
    dateModified: manifest.generated_at
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "AfroTools",
        item: `${SITE_ORIGIN}/`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Africa Conflict",
        item: `${SITE_ORIGIN}/tools/africa-conflict/`
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Conflicts",
        item: pageUrl
      }
    ]
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${pageUrl}">
  <link rel="icon" type="image/svg+xml" href="/assets/img/logo-mark.svg">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${TOOL_OG_IMAGE}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:site_name" content="AfroTools">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${TOOL_OG_IMAGE}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="preload" as="style" href="${AC_FONT_HREF}" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="${AC_FONT_HREF}"></noscript>
  <link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f">
  <link rel="stylesheet" href="/assets/css/global.min.css?v=c94dde91">
  <link rel="stylesheet" href="/tools/africa-conflict/style.css?v=4260f20e">
  <style>
    .acd-static-hub { background: #f8fafd; color: #0f172a; min-height: 100vh; font-family: 'DM Sans', -apple-system, sans-serif; }
    .acd-static-hub-hero { padding: 56px 24px 36px; background: linear-gradient(135deg, #0a1628, #111d30); color: #f8fafc; }
    .acd-static-hub-inner { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
    .acd-static-hub-breadcrumb { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; color: rgba(226,232,240,.76); font-size: .86rem; }
    .acd-static-hub-breadcrumb a { color: #bfdbfe; text-decoration: none; }
    .acd-static-hub h1 { margin: 0; font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(2.4rem, 7vw, 4.8rem); line-height: .95; letter-spacing: 0; }
    .acd-static-hub-lede { max-width: 760px; margin: 16px 0 0; color: rgba(226,232,240,.82); line-height: 1.75; }
    .acd-static-hub-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
    .acd-static-hub-main { padding: 32px 24px 64px; }
    .acd-static-hub-toolbar { display: flex; justify-content: space-between; gap: 16px; align-items: flex-end; margin-bottom: 20px; flex-wrap: wrap; }
    .acd-static-hub-toolbar h2 { margin: 0; font-size: clamp(1.4rem, 3vw, 2rem); }
    .acd-static-hub-toolbar p { margin: 6px 0 0; color: #475569; line-height: 1.6; }
    .acd-static-hub-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .acd-static-hub-card { display: grid; gap: 8px; padding: 18px; border: 1px solid #e2e8f0; border-left: 4px solid #007aff; border-radius: 8px; background: #fff; color: inherit; text-decoration: none; }
    .acd-static-hub-card span, .acd-static-hub-card small { color: #64748b; font-size: .78rem; }
    .acd-static-hub-card strong { font-size: 1rem; color: #0f172a; }
    .acd-static-hub-card p { margin: 0; color: #475569; line-height: 1.55; }
  </style>
  <script type="application/ld+json">${safeJson(webPageSchema)}</script>
  <script type="application/ld+json">${safeJson(breadcrumbSchema)}</script>
</head>
<body>
<afro-navbar></afro-navbar>
<main class="acd-static-hub">
  <section class="acd-static-hub-hero">
    <div class="acd-static-hub-inner">
      <nav class="acd-static-hub-breadcrumb" aria-label="breadcrumb">
        <a href="/">AfroTools</a><span>/</span><a href="/tools/">Tools</a><span>/</span><a href="/tools/africa-conflict/">Africa Conflict</a><span>/</span><span>Conflicts</span>
      </nav>
      <h1>Africa Conflict Dossiers</h1>
      <p class="acd-static-hub-lede">${escapeHtml(description)} Query detail pages remain noindex fallbacks for unknown or excluded records.</p>
      <div class="acd-static-hub-actions">
        <a class="acd-btn acd-btn-primary" href="/tools/africa-conflict/">Dashboard</a>
        <a class="acd-btn acd-btn-outline" href="/tools/africa-conflict/map/">Map</a>
        <a class="acd-btn acd-btn-outline" href="/tools/africa-conflict/methodology/">Methodology</a>
      </div>
    </div>
  </section>
  <section class="acd-static-hub-main">
    <div class="acd-static-hub-inner">
      <div class="acd-static-hub-toolbar">
        <div>
          <h2>Generated dossier routes</h2>
          <p>Static routes use live Supabase conflict records with slug, title, summary, geography, status, impact, and outlook fields.</p>
        </div>
        <strong>${conflicts.length} dossiers</strong>
      </div>
      <div class="acd-static-hub-grid">
        ${conflicts
          .map(
            (conflict) => `<a class="acd-static-hub-card" href="${conflict.route_path}">
          <span>${escapeHtml(statusLabel(conflict.status))} | ${escapeHtml(conflictTypeLabel(conflict.conflict_type))}</span>
          <strong>${escapeHtml(conflict.name)}</strong>
          <p>${escapeHtml(excerpt(conflict.summary, 145))}</p>
          <small>${escapeHtml(conflict.primary_country || "Africa")} | ${escapeHtml(humanList((conflict.regions || []).map(regionLabel), 2) || "Region not recorded")}</small>
        </a>`
          )
          .join("\n")}
      </div>
    </div>
  </section>
</main>
<afro-footer></afro-footer>
<script src="/assets/js/components/navbar.js?v=8486e8e9" defer></script>
<script src="/assets/js/components/footer.js?v=b612b5b2" defer></script>
</body>
</html>
`;
}

function writeHtmlPage(outputDir, html) {
  ensureDir(outputDir);
  fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
}

function syncGeneratedDirectory(baseDir, keepSlugs) {
  ensureDir(baseDir);
  const resolvedBase = path.resolve(baseDir);
  const keep = new Set(keepSlugs);

  fs.readdirSync(resolvedBase, { withFileTypes: true }).forEach((entry) => {
    if (!entry.isDirectory()) return;
    if (keep.has(entry.name)) return;

    const fullPath = path.join(resolvedBase, entry.name);
    if (!path.resolve(fullPath).startsWith(resolvedBase)) {
      throw new Error(`Refusing to remove path outside generator root: ${fullPath}`);
    }
    fs.rmSync(fullPath, { recursive: true, force: true });
  });
}

function buildDiscoveryMarkup(manifest, options) {
  const settings = options || {};
  const conflicts = manifest.conflicts
    .filter((conflict) => conflict.generated_in_wave)
    .slice(0, settings.limit || manifest.conflicts.length);

  return `<section class="acd-static-discovery" aria-labelledby="${settings.id || "acd-static-dossiers-title"}">
  <div class="acd-section-header">
    <div>
      <p class="acd-section-kicker">Static dossiers</p>
      <h2 id="${settings.id || "acd-static-dossiers-title"}">${escapeHtml(settings.title || "Clean Africa Conflict dossier routes")}</h2>
      <p class="acd-section-sub">${escapeHtml(settings.description || `${conflicts.length} generated conflict dossiers now use clean, crawlable URLs backed by the live Supabase inventory.`)}</p>
    </div>
  </div>
  <div class="acd-static-discovery-grid">
    ${conflicts
      .map(
        (conflict) => `<a class="acd-static-discovery-card" href="${conflict.route_path}">
          <span>${escapeHtml(statusLabel(conflict.status))} | ${escapeHtml(conflictTypeLabel(conflict.conflict_type))}</span>
          <strong>${escapeHtml(conflict.name)}</strong>
          <small>${escapeHtml(excerpt(conflict.summary, 120))}</small>
        </a>`
      )
      .join("\n")}
  </div>
</section>`;
}

function upsertMarkedBlock(filePath, startMarker, endMarker, replacement) {
  let html = fs.readFileSync(filePath, "utf8");
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  const block = `${startMarker}\n${replacement}\n${endMarker}`;

  if (start !== -1 && end !== -1 && end > start) {
    html = `${html.slice(0, start)}${block}${html.slice(end + endMarker.length)}`;
  } else {
    const mainEnd = html.lastIndexOf("</main>");
    if (mainEnd === -1) {
      throw new Error(`Unable to place discovery block in ${filePath}`);
    }
    html = `${html.slice(0, mainEnd)}${block}\n${html.slice(mainEnd)}`;
  }

  html = html.replace(
    /<li><a href="\/tools\/africa-conflict\/detail">Africa Conflict [^<]*Detail<\/a><\/li>/g,
    ""
  );

  fs.writeFileSync(filePath, html, "utf8");
}

function updateDiscoverySources(manifest) {
  const startMarker = "<!-- ac-static-dossiers:start -->";
  const endMarker = "<!-- ac-static-dossiers:end -->";

  upsertMarkedBlock(
    LANDING_PATH,
    startMarker,
    endMarker,
    buildDiscoveryMarkup(manifest, {
      limit: 8,
      id: "acd-static-dossiers-title",
      title: "Clean static dossiers for high-signal conflicts",
      description: `${manifest.wave.conflict_count} Africa-scope dossiers now resolve through /tools/africa-conflict/conflicts/<slug>/ routes. Query detail pages remain noindex fallbacks.`
    })
  );

  upsertMarkedBlock(
    CONFLICTS_PAGE_PATH,
    startMarker,
    endMarker,
    buildDiscoveryMarkup(manifest, {
      id: "acd-static-conflict-routes-title",
      title: "All generated Africa Conflict dossiers",
      description: "Use these static dossier URLs for public discovery; excluded global-impact records continue through the safe query fallback."
    })
  );
}

async function main() {
  const manifest = await buildManifest();
  writeManifest(manifest, MANIFEST_PATH);
  writeStaticRoutes(manifest);
  updateDiscoverySources(manifest);

  const keepSlugs = manifest.routes.generated_conflict_slugs;
  syncGeneratedDirectory(CONFLICTS_DIR, keepSlugs);
  fs.writeFileSync(path.join(CONFLICTS_DIR, "index.html"), buildConflictHubIndexHtml(manifest), "utf8");

  manifest.conflicts
    .filter((conflict) => conflict.generated_in_wave)
    .forEach((conflict) => {
      writeHtmlPage(path.join(CONFLICTS_DIR, conflict.slug), buildDossierPageHtml(conflict, manifest));
    });

  console.log("Generated Africa Conflict static dossiers.");
  console.log(`Manifest path: ${MANIFEST_PATH}`);
  console.log(`Published conflicts: ${manifest.source.published_count}`);
  console.log(`Published African conflicts: ${manifest.source.published_african_count}`);
  console.log(`Dossier pages generated: ${manifest.wave.conflict_count}`);
  console.log(`Excluded records: ${manifest.wave.exclusion_count}`);
}

main().catch((error) => {
  console.error("Failed to generate Africa Conflict static dossiers.");
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
