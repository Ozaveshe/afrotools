#!/usr/bin/env node
"use strict";

/**
 * Validates native locale equivalence against the canonical route graph.
 * Redirects, fallbacks, noindex pages, and aliases are never valid hreflang targets.
 */

const routeApi = require("./lib/route-contract");

function main() {
  const graph = routeApi.buildRouteGraph();
  const result = routeApi.validateEquivalenceGroups(graph.equivalenceGroups, graph.routes);
  const pagesWithHreflang = graph.routes.filter((record) => (
    record.state === "page" && Object.keys(record.declaredHreflangs || {}).length > 0
  ));
  const totalPairs = pagesWithHreflang.reduce((sum, record) => sum + Object.keys(record.declaredHreflangs || {}).length, 0);

  console.log("\nHreflang Route-Contract Validation");
  console.log("=".repeat(60));
  console.log(`${graph.routes.filter((record) => record.state === "page").length} public pages represented`);
  console.log(`${pagesWithHreflang.length} pages with declared hreflang`);
  console.log(`${totalPairs} declared hreflang relationships`);
  console.log(`${graph.equivalenceGroups.length} validated equivalence groups`);

  if (result.errors.length) {
    result.errors.forEach((error) => console.error(routeApi.formatIssue(error)));
    process.exitCode = 1;
    return;
  }
  console.log("All native equivalents are indexable, self-canonical, locale-correct, and reciprocal.");
}

if (require.main === module) main();

module.exports = { main };
