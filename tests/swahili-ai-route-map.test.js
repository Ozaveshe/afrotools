"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const acceptance = require("../data/audits/swahili-free-app-acceptance.json");
const directory = require("../data/tool-directory.json");
const inventory = require("../reports/swahili-free-app-parity-inventory.json");
const routeMap = require("../assets/js/ai/swahili-route-map.generated.js");
const routeEntry = require("../assets/js/pages/sw-ai-route-entry.js");
const router = require("../assets/js/ai/intent-router.js");

const directoryById = new Map(directory.map((row) => [row.id, row]));
const accepted = acceptance.entries.filter((entry) => entry.status === "accepted" && directoryById.has(entry.englishId));
const archivedAccepted = [
  ...(acceptance.archivedEntries || []).filter((entry) => entry.status === "accepted"),
  ...acceptance.entries.filter((entry) => entry.status === "accepted" && !directoryById.has(entry.englishId))
].filter((entry, index, entries) => (
  entries.findIndex((candidate) => candidate.englishId === entry.englishId) === index
));
const blocked = acceptance.entries.filter((entry) => entry.status !== "accepted" && directoryById.has(entry.englishId));

assert.equal(routeMap.acceptedRoutes, accepted.length);
assert.equal(Object.keys(routeMap.ids).length, accepted.length);
assert.deepEqual(routeMap.archivedAcceptedIds, archivedAccepted.map((entry) => entry.englishId).sort());

for (const entry of accepted) {
  const english = directoryById.get(entry.englishId);
  assert.ok(english, `missing English directory row for ${entry.englishId}`);
  assert.equal(routeEntry.resolveToolRoute(entry.englishId, routeMap), `${entry.swahiliRoute.replace(/\/+$/, "")}/`);
  assert.equal(routeMap.routes[`${english.url.replace(/\/+$/, "")}/`], `${entry.swahiliRoute.replace(/\/+$/, "")}/`);
  const file = path.join(ROOT, ...entry.swahiliRoute.split("/").filter(Boolean), "index.html");
  assert.ok(fs.existsSync(file), `missing physical Swahili route for ${entry.englishId}`);
}

for (const entry of blocked) {
  assert.equal(routeEntry.resolveToolRoute(entry.englishId, routeMap), null);
}
for (const entry of archivedAccepted) {
  assert.equal(routeEntry.resolveToolRoute(entry.englishId, routeMap), null);
}

const angolaPaye = router.routeDeterministically("PAYE Angola", { locale: "sw" });
assert.equal(angolaPaye.selectedToolId, "ao-paye");
assert.equal(angolaPaye.selectedRoute, `${routeMap.ids["ao-paye"]}?source=ask`);
assert.equal(angolaPaye._meta.localeRoute.status, "mapped");

assert.equal(inventory.totals.remainingUnaccepted, 1, "the new PAYE authority finder remains unavailable until a native Swahili owner is accepted");
assert.equal(inventory.rows.find((row) => row.englishId === "paye-authority-finder").state, "missing");
assert.equal(routeEntry.resolveToolRoute("paye-authority-finder", routeMap), null);
const unavailableId = "__sw-unavailable-contract-fixture__";
const unavailable = router.normalizeDecision({
  selectedToolId: unavailableId
}, "Unaccepted Swahili tool", { locale: "sw" });
assert.equal(unavailable.selectedToolId, "tool-search");
assert.match(unavailable.selectedRoute, /^\/sw\/zana-zote\/\?source=ask$/);
assert.equal(unavailable._meta.localeRoute.status, "unavailable");

console.log(`Swahili AI route map verified for ${accepted.length} current accepted apps; ${archivedAccepted.length} retired and ${blocked.length} blocked rows stay fail closed.`);
