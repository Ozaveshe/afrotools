#!/usr/bin/env node
"use strict";

// Compatibility entry point. Hreflang is now owned by the route contract so
// direct invocations cannot recreate inferred or one-way locale relationships.
const routeContract = require("./lib/route-contract");

const graph = routeContract.buildRouteGraph();
const validation = routeContract.validateRouteGraph(graph);
if (!validation.ok) {
  validation.errors.forEach((entry) => console.error(routeContract.formatIssue(entry)));
  process.exitCode = 1;
} else {
  const result = routeContract.syncRouteMetadata(graph, { write: true });
  console.log(`Route-contract hreflang sync complete: ${result.changedFiles.length} file(s) updated.`);
}
