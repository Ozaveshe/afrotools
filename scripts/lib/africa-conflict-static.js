"use strict";

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const ROOT = path.resolve(__dirname, "..", "..");
const TOOL_DIR = path.join(ROOT, "tools", "africa-conflict");
const CONFLICTS_DIR = path.join(TOOL_DIR, "conflicts");
const MANIFEST_PATH = path.join(TOOL_DIR, "seo-manifest.json");
const ROUTES_PATH = path.join(TOOL_DIR, "static-routes.js");
const SITE_ORIGIN = "https://afrotools.com";
const TOOL_OG_IMAGE = `${SITE_ORIGIN}/assets/img/og-default.png`;
const SUPABASE_URL =
  process.env.SUPABASE_AUTH_URL || "https://zpclagtgczsygrgztlts.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwY2xhZ3RnY3pzeWdyZ3p0bHRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NTg4MzIsImV4cCI6MjA4OTAzNDgzMn0._G-677vi2UTAhcU3t0aquvmd8lnQUBil53ok_Z623F0";

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function excerpt(value, limit) {
  const input = normalizeText(value);
  if (!input) return "";
  if (input.length <= limit) return input;
  return `${input.slice(0, Math.max(0, limit - 3)).trim()}...`;
}

function humanize(value) {
  return normalizeText(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanList(values, limit) {
  const items = (values || []).filter(Boolean).slice(0, limit || values.length);
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function conflictRoutePath(slug) {
  return `/tools/africa-conflict/conflicts/${slug}/`;
}

function conflictUrl(slug) {
  return `${SITE_ORIGIN}${conflictRoutePath(slug)}`;
}

function fallbackConflictPath(slug) {
  return `/tools/africa-conflict/detail.html?id=${encodeURIComponent(slug || "")}`;
}

function fallbackConflictUrl(slug) {
  return `${SITE_ORIGIN}${fallbackConflictPath(slug)}`;
}

function buildSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function fetchAllRows(makeQuery, pageSize) {
  const rows = [];
  const size = pageSize || 1000;
  let start = 0;

  while (true) {
    const query = makeQuery().range(start, start + size - 1);
    const { data, error } = await query;
    if (error) throw error;
    if (!data || !data.length) break;
    rows.push(...data);
    if (data.length < size) break;
    start += size;
  }

  return rows;
}

async function countTable(supabase, tableName) {
  const { count, error } = await supabase
    .from(tableName)
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count || 0;
}

function groupRowsBy(rows, key) {
  const grouped = new Map();
  (rows || []).forEach((row) => {
    const value = row[key];
    if (!grouped.has(value)) grouped.set(value, []);
    grouped.get(value).push(row);
  });
  return grouped;
}

function compareConflicts(left, right) {
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3, minimal: 4 };
  const leftRisk = Object.prototype.hasOwnProperty.call(riskOrder, left.escalation_risk)
    ? riskOrder[left.escalation_risk]
    : 5;
  const rightRisk = Object.prototype.hasOwnProperty.call(riskOrder, right.escalation_risk)
    ? riskOrder[right.escalation_risk]
    : 5;

  return (
    Number(Boolean(right.is_featured)) - Number(Boolean(left.is_featured)) ||
    leftRisk - rightRisk ||
    (Number(right.fatalities_max) || 0) - (Number(left.fatalities_max) || 0) ||
    String(left.name || "").localeCompare(String(right.name || "")) ||
    String(left.slug || "").localeCompare(String(right.slug || ""))
  );
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function collectStaticBlockers(conflict) {
  const blockers = [];

  if (!normalizeText(conflict.id)) blockers.push("missing id");
  if (!normalizeText(conflict.slug)) blockers.push("missing slug");
  if (!normalizeText(conflict.name)) blockers.push("missing title/name");
  if (!normalizeText(conflict.summary)) blockers.push("missing summary");
  if (!normalizeText(conflict.primary_country)) blockers.push("missing primary_country");
  if (!normalizeText(conflict.status)) blockers.push("missing status");
  if (conflict.is_published !== true) blockers.push("not published");
  if (conflict.is_african !== true) blockers.push("not African/public scope");

  return blockers;
}

function normalizeConflict(conflict, relatedData) {
  const conflictActors = relatedData.conflictActorsByConflict.get(conflict.id) || [];
  const displacementRows = relatedData.displacementByConflict.get(conflict.id) || [];
  const economicRows = relatedData.economicByConflict.get(conflict.id) || [];
  const economyActors = relatedData.economyActorsByConflict.get(conflict.id) || [];
  const forecasts = relatedData.forecastsByConflict.get(conflict.id) || [];
  const timeline = relatedData.timelineByConflict.get(conflict.id) || [];
  const events = relatedData.eventsByConflict.get(conflict.id) || [];
  const monthlyStats = relatedData.monthlyStatsByConflict.get(conflict.id) || [];
  const blockers = collectStaticBlockers(conflict);
  const routePath = conflictRoutePath(conflict.slug);

  return {
    ...conflict,
    countries_involved: normalizeArray(conflict.countries_involved),
    regions: normalizeArray(conflict.regions),
    key_triggers: normalizeArray(conflict.key_triggers),
    resource_links: normalizeArray(conflict.resource_links),
    spillover_countries: normalizeArray(conflict.spillover_countries),
    fatalities_min: normalizeNumber(conflict.fatalities_min),
    fatalities_max: normalizeNumber(conflict.fatalities_max),
    idps_count: normalizeNumber(conflict.idps_count),
    refugees_count: normalizeNumber(conflict.refugees_count),
    returnees_count: normalizeNumber(conflict.returnees_count),
    military_spend_usd_m: normalizeNumber(conflict.military_spend_usd_m),
    economic_loss_min_usd_b: normalizeNumber(conflict.economic_loss_min_usd_b),
    economic_loss_max_usd_b: normalizeNumber(conflict.economic_loss_max_usd_b),
    gdp_drag_pct: normalizeNumber(conflict.gdp_drag_pct),
    route_path: routePath,
    route_url: conflictUrl(conflict.slug),
    fallback_path: fallbackConflictPath(conflict.slug),
    fallback_url: fallbackConflictUrl(conflict.slug),
    generated_in_wave: blockers.length === 0,
    excluded_from_static: blockers.length > 0,
    exclusion_reasons: blockers,
    related_counts: {
      conflict_actors: conflictActors.length,
      displacement_rows: displacementRows.length,
      economic_impact_rows: economicRows.length,
      economy_actor_rows: economyActors.length,
      forecast_rows: forecasts.length,
      timeline_rows: timeline.length,
      event_rows: events.length,
      monthly_stat_rows: monthlyStats.length
    },
    related_data: {
      conflict_actors: conflictActors,
      displacement: displacementRows,
      economic_impact: economicRows,
      economy_actors: economyActors,
      latest_forecast: forecasts
        .slice()
        .sort((left, right) => String(right.forecast_date).localeCompare(String(left.forecast_date)))[0] || null,
      timeline: timeline
        .slice()
        .sort((left, right) => String(right.event_date).localeCompare(String(left.event_date)))
        .slice(0, 8)
    },
    field_coverage: {
      has_id: Boolean(normalizeText(conflict.id)),
      has_slug: Boolean(normalizeText(conflict.slug)),
      has_title_or_name: Boolean(normalizeText(conflict.name)),
      has_summary: Boolean(normalizeText(conflict.summary)),
      has_country_geography: Boolean(
        normalizeText(conflict.primary_country) ||
        normalizeArray(conflict.countries_involved).length ||
        normalizeArray(conflict.regions).length
      ),
      has_status: Boolean(normalizeText(conflict.status)),
      has_actor_fields: conflictActors.length > 0,
      has_displacement_fields:
        conflict.idps_count !== null ||
        conflict.refugees_count !== null ||
        conflict.returnees_count !== null ||
        displacementRows.length > 0,
      has_economic_fields:
        conflict.military_spend_usd_m !== null ||
        conflict.economic_loss_min_usd_b !== null ||
        conflict.economic_loss_max_usd_b !== null ||
        conflict.gdp_drag_pct !== null ||
        economicRows.length > 0 ||
        economyActors.length > 0,
      has_outlook_fields: Boolean(
        normalizeText(conflict.escalation_risk) ||
        normalizeText(conflict.spillover_risk) ||
        forecasts.length
      )
    }
  };
}

function buildInventorySummary(conflicts) {
  return conflicts.map((conflict) => ({
    id: conflict.id,
    slug: conflict.slug,
    name: conflict.name,
    is_african: conflict.is_african,
    is_published: conflict.is_published,
    status: conflict.status,
    primary_country: conflict.primary_country,
    countries_involved: conflict.countries_involved,
    regions: conflict.regions,
    field_coverage: conflict.field_coverage,
    related_counts: conflict.related_counts,
    generated_in_wave: conflict.generated_in_wave,
    exclusion_reasons: conflict.exclusion_reasons
  }));
}

async function buildManifest() {
  const supabase = buildSupabaseClient();

  const [
    conflictRows,
    conflictActors,
    displacement,
    economicImpact,
    economyActors,
    forecasts,
    timeline,
    events,
    monthlyStats
  ] = await Promise.all([
    fetchAllRows(() =>
      supabase
        .from("ac_conflicts")
        .select("*")
        .eq("is_published", true)
        .order("is_african", { ascending: false })
        .order("name", { ascending: true })
    ),
    fetchAllRows(() => supabase.from("ac_conflict_actors").select("*, ac_actors(*)")),
    fetchAllRows(() =>
      supabase
        .from("ac_displacement")
        .select("*")
        .order("record_date", { ascending: false })
    ),
    fetchAllRows(() =>
      supabase
        .from("ac_economic_impact")
        .select("*")
        .order("year", { ascending: false })
    ),
    fetchAllRows(() =>
      supabase
        .from("ac_economy_actors")
        .select("*")
        .order("confidence_score", { ascending: false })
    ),
    fetchAllRows(() =>
      supabase
        .from("ac_forecasts")
        .select("*")
        .order("forecast_date", { ascending: false })
    ),
    fetchAllRows(() =>
      supabase
        .from("ac_timeline")
        .select("*")
        .order("event_date", { ascending: false })
    ),
    fetchAllRows(() =>
      supabase
        .from("ac_events")
        .select("id,conflict_id,event_date,event_type,country,fatalities,source")
        .order("event_date", { ascending: false })
        .limit(1000)
    ),
    fetchAllRows(() => supabase.from("ac_monthly_stats").select("*"))
  ]);

  const relatedData = {
    conflictActorsByConflict: groupRowsBy(conflictActors, "conflict_id"),
    displacementByConflict: groupRowsBy(displacement, "conflict_id"),
    economicByConflict: groupRowsBy(economicImpact, "conflict_id"),
    economyActorsByConflict: groupRowsBy(economyActors, "conflict_id"),
    forecastsByConflict: groupRowsBy(forecasts, "conflict_id"),
    timelineByConflict: groupRowsBy(timeline, "conflict_id"),
    eventsByConflict: groupRowsBy(events, "conflict_id"),
    monthlyStatsByConflict: groupRowsBy(monthlyStats, "conflict_id")
  };

  const conflicts = conflictRows
    .map((conflict) => normalizeConflict(conflict, relatedData))
    .sort(compareConflicts);
  const generatedConflicts = conflicts.filter((conflict) => conflict.generated_in_wave);
  const excludedConflicts = conflicts.filter((conflict) => conflict.excluded_from_static);
  const tableCounts = {};

  for (const tableName of [
    "ac_conflicts",
    "ac_actors",
    "ac_conflict_actors",
    "ac_events",
    "ac_displacement",
    "ac_economic_impact",
    "ac_economy_actors",
    "ac_forecasts",
    "ac_timeline",
    "ac_monthly_stats"
  ]) {
    tableCounts[tableName] = await countTable(supabase, tableName);
  }

  return {
    generated_at: new Date().toISOString(),
    source: {
      dataset: "supabase.public.ac_conflicts",
      public_filter: "is_published = true",
      static_filter: "is_published = true and is_african = true plus required slug/name/summary/geography/status fields",
      conflict_count: conflicts.length,
      published_count: conflicts.length,
      published_african_count: conflicts.filter((conflict) => conflict.is_african === true).length,
      published_non_african_count: conflicts.filter((conflict) => conflict.is_african !== true).length,
      static_eligible_conflict_count: generatedConflicts.length,
      excluded_conflict_count: excludedConflicts.length,
      table_counts: tableCounts,
      field_coverage_counts: {
        slug: conflicts.filter((conflict) => conflict.field_coverage.has_slug).length,
        title_or_name: conflicts.filter((conflict) => conflict.field_coverage.has_title_or_name).length,
        summary: conflicts.filter((conflict) => conflict.field_coverage.has_summary).length,
        country_geography: conflicts.filter((conflict) => conflict.field_coverage.has_country_geography).length,
        status: conflicts.filter((conflict) => conflict.field_coverage.has_status).length,
        actors: conflicts.filter((conflict) => conflict.field_coverage.has_actor_fields).length,
        displacement: conflicts.filter((conflict) => conflict.field_coverage.has_displacement_fields).length,
        economics: conflicts.filter((conflict) => conflict.field_coverage.has_economic_fields).length,
        outlook: conflicts.filter((conflict) => conflict.field_coverage.has_outlook_fields).length
      }
    },
    wave: {
      strategy: "published_african_static_eligible",
      description: "All published African-scope conflicts with slug, name, summary, geography, and status.",
      conflict_count: generatedConflicts.length,
      exclusion_count: excludedConflicts.length
    },
    routes: {
      generated_conflict_slugs: generatedConflicts.map((conflict) => conflict.slug)
    },
    inventory: buildInventorySummary(conflicts),
    exclusions: excludedConflicts.map((conflict) => ({
      id: conflict.id,
      slug: conflict.slug,
      name: conflict.name,
      is_african: conflict.is_african,
      is_published: conflict.is_published,
      blockers: conflict.exclusion_reasons
    })),
    conflicts
  };
}

function writeManifest(manifest, targetPath) {
  const outputPath = targetPath || MANIFEST_PATH;
  ensureDir(path.dirname(outputPath));
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return outputPath;
}

function loadManifest(targetPath) {
  return JSON.parse(fs.readFileSync(targetPath || MANIFEST_PATH, "utf8"));
}

function writeStaticRoutes(manifest, targetPath) {
  const outputPath = targetPath || ROUTES_PATH;
  const routes = {};

  manifest.conflicts.forEach((conflict) => {
    if (conflict.generated_in_wave) {
      routes[conflict.slug] = conflict.route_path;
    }
  });

  const output = `(function (window) {
  'use strict';

  var conflictRoutes = ${safeJson(routes)};

  function fallbackConflictUrl(slug) {
    return '/tools/africa-conflict/detail.html?id=' + encodeURIComponent(slug || '');
  }

  function conflictUrl(slug) {
    return conflictRoutes[slug] || fallbackConflictUrl(slug);
  }

  function rewriteLegacyDetailLinks(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var links = scope.querySelectorAll('a[href*="/tools/africa-conflict/detail.html?id="], a[href*="detail.html?id="]');
    links.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var match = href.match(/[?&]id=([^&#]+)/);
      if (!match) return;
      var slug = decodeURIComponent(match[1] || '');
      if (Object.prototype.hasOwnProperty.call(conflictRoutes, slug)) {
        link.setAttribute('href', conflictRoutes[slug]);
      }
    });
  }

  window.AfroConflictStaticRoutes = {
    conflicts: conflictRoutes,
    hasConflict: function (slug) {
      return Object.prototype.hasOwnProperty.call(conflictRoutes, slug);
    },
    conflict: conflictUrl,
    fallbackConflict: fallbackConflictUrl,
    rewriteLegacyDetailLinks: rewriteLegacyDetailLinks
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        rewriteLegacyDetailLinks(document);
      });
    } else {
      rewriteLegacyDetailLinks(document);
    }

    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function (records) {
        records.forEach(function (record) {
          record.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) rewriteLegacyDetailLinks(node);
          });
        });
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  }
})(window);
`;

  fs.writeFileSync(outputPath, output, "utf8");
  return outputPath;
}

module.exports = {
  ROOT,
  TOOL_DIR,
  CONFLICTS_DIR,
  MANIFEST_PATH,
  ROUTES_PATH,
  SITE_ORIGIN,
  TOOL_OG_IMAGE,
  escapeHtml,
  safeJson,
  ensureDir,
  normalizeText,
  excerpt,
  humanize,
  humanList,
  conflictRoutePath,
  conflictUrl,
  fallbackConflictPath,
  fallbackConflictUrl,
  buildManifest,
  writeManifest,
  loadManifest,
  writeStaticRoutes
};
