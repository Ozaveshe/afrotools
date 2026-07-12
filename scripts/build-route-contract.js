#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const routeApi = require("./lib/route-contract");
const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const GRAPH_PATH = path.join(ROOT, "data", "registry", "route-graph.json");
const REPORT_JSON_PATH = path.join(ROOT, "reports", "route-contract-report.json");
const REPORT_MD_PATH = path.join(ROOT, "reports", "route-contract-report.md");

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function reportMarkdown(report) {
  const lines = [
    "# Route Contract Report",
    "",
    "Generated from public HTML, `_redirects`, `netlify.toml`, locale metadata, and `data/registry/route-policy.json`.",
    "",
    "## Summary",
    "",
    "| State | Count |",
    "|---|---:|",
    `| Public pages | ${report.summary.pages} |`,
    `| Indexable pages | ${report.summary.indexable} |`,
    `| Permanent and temporary redirects | ${report.summary.redirects} |`,
    `| Rewrites | ${report.summary.rewrites} |`,
    `| Conditional redirects | ${report.summary.conditionalRedirects} |`,
    `| Gone routes | ${report.summary.gone} |`,
    `| Dynamic route patterns | ${report.summary.patterns} |`,
    `| Genuine equivalence groups | ${report.summary.equivalenceGroups} |`,
    `| Documented fallbacks | ${report.summary.fallbacks} |`,
    `| Routes eligible for primary sitemaps | ${report.summary.sitemapEntries} |`,
    "",
    "## Locale Coverage",
    ""
  ];
  Object.entries(report.byLocale).sort().forEach(([locale, count]) => lines.push(`- ${locale}: ${count} page records`));
  lines.push("", "## Page Types", "");
  Object.entries(report.byPageType).sort().forEach(([pageType, count]) => lines.push(`- ${pageType}: ${count}`));
  lines.push("", "## Canonical Migrations", "");
  for (const migration of report.canonicalMigrations) {
    lines.push(`- \`${migration.route}\` -> \`${migration.finalTarget}\` (${migration.statusCode}, owner: ${migration.owner})`);
  }
  lines.push("", "## Genuine Locale Equivalence Groups", "");
  for (const group of report.equivalenceGroups) {
    const routes = Object.entries(group.routes).map(([locale, route]) => `${locale}=\`${route}\``).join(", ");
    lines.push(`- ${group.id}: ${routes}; x-default=\`${group.xDefault}\``);
  }
  lines.push("", "## Shadowed Routing Rules", "");
  if (!report.shadowedRules.length) lines.push("- None.");
  else report.shadowedRules.forEach((rule) => lines.push(`- \`${rule.route}\` -> \`${rule.target}\` (${rule.owner}:${rule.line})${rule.shadowedByFile ? ` shadowed by \`${rule.shadowedByFile}\`` : ""}`));
  lines.push("", "## Conflicting Later Rules", "");
  if (!report.ruleConflicts.length) lines.push("- None.");
  else report.ruleConflicts.forEach((rule) => lines.push(`- \`${rule.route}\`: effective \`${rule.effectiveTarget}\` (${rule.effectiveOwner}), later \`${rule.shadowedTarget}\` (${rule.shadowedOwner})`));
  lines.push("");
  return lines.join("\n");
}

function expectedArtifacts(graph) {
  const report = routeApi.buildRouteReport(graph);
  return {
    graph: stableJson(graph),
    reportJson: stableJson(report),
    reportMarkdown: reportMarkdown(report)
  };
}

function compareFile(filePath, expected, stale) {
  const actual = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
  if (actual !== expected) stale.push(path.relative(ROOT, filePath).replace(/\\/g, "/"));
}

function run(options = {}) {
  const write = Boolean(options.write);
  let graph = routeApi.buildRouteGraph();
  const sync = { redirects: null, metadata: null, links: null };

  if (write) {
    sync.redirects = routeApi.syncRedirectContract(graph, { write: true });
    const redirectsChangedInitially = sync.redirects.changed;
    graph = routeApi.buildRouteGraph();
    sync.metadata = routeApi.syncRouteMetadata(graph, { write: true });
    graph = routeApi.buildRouteGraph();
    sync.links = routeApi.syncInternalLinks(graph, { write: true });
    graph = routeApi.buildRouteGraph();
    const finalRedirectSync = routeApi.syncRedirectContract(graph, { write: true });
    sync.redirects = { ...finalRedirectSync, changed: redirectsChangedInitially || finalRedirectSync.changed };
    if (finalRedirectSync.changed) graph = routeApi.buildRouteGraph();
  } else {
    sync.redirects = routeApi.syncRedirectContract(graph, { write: false });
    sync.metadata = routeApi.syncRouteMetadata(graph, { write: false });
    sync.links = routeApi.syncInternalLinks(graph, { write: false });
  }

  const validation = routeApi.validateRouteGraph(graph, { checkArtifacts: !write });
  const artifacts = expectedArtifacts(graph);
  const stale = [];

  if (write) {
    fs.mkdirSync(path.dirname(GRAPH_PATH), { recursive: true });
    fs.mkdirSync(path.dirname(REPORT_JSON_PATH), { recursive: true });
    writeFileSyncWithRetry(GRAPH_PATH, artifacts.graph, "utf8");
    writeFileSyncWithRetry(REPORT_JSON_PATH, artifacts.reportJson, "utf8");
    writeFileSyncWithRetry(REPORT_MD_PATH, artifacts.reportMarkdown, "utf8");
  } else {
    compareFile(GRAPH_PATH, artifacts.graph, stale);
    compareFile(REPORT_JSON_PATH, artifacts.reportJson, stale);
    compareFile(REPORT_MD_PATH, artifacts.reportMarkdown, stale);
    if (sync.redirects.changed) stale.push("_redirects (route-contract block or normalized self-redirect cleanup)");
    if (sync.metadata.changed) stale.push(`${sync.metadata.changedFiles.length} HTML metadata file(s)`);
    if (sync.links.changed) stale.push(`${sync.links.changedFiles.length} HTML internal-link file(s)`);
  }

  return { graph, validation, stale, sync };
}

function main(argv = process.argv.slice(2)) {
  const write = argv.includes("--write");
  const check = argv.includes("--check");
  if (write === check) throw new Error("Choose exactly one of --write or --check.");
  const result = run({ write });

  result.validation.warnings.slice(0, 50).forEach((warning) => console.warn(`WARN ${routeApi.formatIssue(warning)}`));
  if (result.validation.warnings.length > 50) console.warn(`WARN ... ${result.validation.warnings.length - 50} more warning(s)`);
  if (!result.validation.ok) {
    result.validation.errors.slice(0, 200).forEach((error) => console.error(routeApi.formatIssue(error)));
    if (result.validation.errors.length > 200) console.error(`... ${result.validation.errors.length - 200} more error(s)`);
    process.exitCode = 1;
    return;
  }
  if (check && result.stale.length) {
    result.stale.forEach((item) => console.error(`STALE ${item}`));
    process.exitCode = 1;
    return;
  }

  const summary = result.graph.summary;
  console.log(`Route contract valid: ${summary.pages} pages, ${summary.redirects} redirects, ${summary.equivalenceGroups} locale groups, ${summary.sitemapEntries} sitemap-eligible routes.`);
  if (write) {
    console.log(`Synchronized redirects=${result.sync.redirects.changed ? 1 : 0}, metadataFiles=${result.sync.metadata.changedFiles.length}, linkFiles=${result.sync.links.changedFiles.length}, linkReplacements=${result.sync.links.replacements}.`);
  } else {
    console.log("Generated route artifacts and public route surfaces are current.");
  }
}

if (require.main === module) main();

module.exports = { expectedArtifacts, main, reportMarkdown, run };
