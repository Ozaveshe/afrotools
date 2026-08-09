"use strict";

const assert = require("node:assert/strict");

function normalizeRoute(route) {
  return `/${String(route || "").replace(/^\/+|\/+$/g, "")}/`;
}

function assertEvidence(entry, id) {
  assert.ok(entry.evidence && typeof entry.evidence === "object", `${id}: acceptance evidence object`);
  const values = Object.values(entry.evidence);
  assert.ok(values.length > 0, `${id}: acceptance evidence is not empty`);
  for (const value of values) {
    assert.ok(typeof value === "string" && value.trim(), `${id}: acceptance evidence values are non-empty strings`);
  }
}

function assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps }) {
  const acceptedById = new Map(
    (acceptance.entries || [])
      .filter((entry) => entry.status === "accepted")
      .map((entry) => [entry.englishId, entry])
  );

  for (const app of apps) {
    const id = app.id;
    const expectedRoute = app.swahiliRoute == null ? null : normalizeRoute(app.swahiliRoute);
    const row = inventory.rows.find((candidate) => candidate.englishId === id);
    assert.ok(row, `${id}: authoritative inventory row`);
    if (expectedRoute == null) {
      assert.equal(row.primarySwahiliRoute, null, `${id}: immutable missing Swahili route`);
    } else {
      assert.equal(normalizeRoute(row.primarySwahiliRoute), expectedRoute, `${id}: immutable Swahili route`);
    }

    const acceptedEntry = acceptedById.get(id);
    const aiRoute = routeEntry.resolveToolRoute(id, routeMap);
    if (row.accepted) {
      assert.ok(expectedRoute, `${id}: accepted row must have an expected route`);
      assert.ok(acceptedEntry, `${id}: accepted inventory row exists in the central ledger`);
      assert.equal(normalizeRoute(acceptedEntry.swahiliRoute), expectedRoute, `${id}: accepted ledger route`);
      assertEvidence(acceptedEntry, id);
      assert.equal(normalizeRoute(aiRoute), expectedRoute, `${id}: accepted AI route`);
    } else {
      assert.equal(acceptedEntry, undefined, `${id}: pending row is absent from the accepted ledger`);
      assert.equal(aiRoute, null, `${id}: pending row is absent from the AI route map`);
    }
  }
}

module.exports = {
  assertLifecycle,
  normalizeRoute,
};
