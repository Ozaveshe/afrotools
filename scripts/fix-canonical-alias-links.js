#!/usr/bin/env node
"use strict";

const routeApi = require("./lib/route-contract");

const graph = routeApi.buildRouteGraph();
const result = routeApi.syncInternalLinks(graph, { write: true });

console.log(`Canonical alias href replacements: ${result.replacements}`);
console.log(`Files patched: ${result.changedFiles.length}`);
result.changedFiles.slice(0, 30).forEach((file) => console.log(`  ${file}`));
if (result.changedFiles.length > 30) console.log(`  ... and ${result.changedFiles.length - 30} more`);
