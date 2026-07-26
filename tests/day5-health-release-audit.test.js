const assert = require("assert");
const audit = require("../scripts/audit-day5-health-release.js");

const routes = audit.registryHealthRoutes();
assert.strictEqual(routes.length, 42);
assert.strictEqual(new Set(routes.map(row => row.id)).size, 42);
assert.strictEqual(new Set(routes.map(row => row.route)).size, 42);
assert.strictEqual(audit.ACCEPTED_ROUTES.size, 42);
for (const route of audit.ACCEPTED_ROUTES) {
  assert.ok(routes.some(row => row.route === route), "accepted route remains in English Health registry: " + route);
}

const staticResults = routes.map(audit.staticAudit);
assert.strictEqual(staticResults.length, 42);
for (const result of staticResults) {
  assert.ok(Array.isArray(result.failures));
  for (const failure of result.failures) {
    assert.match(failure.code, /^STATIC_/);
    assert.ok(failure.message);
  }
}

const report = audit.finalize(routes, staticResults, [], "static-only-test");
assert.strictEqual(report.summary.registryRoutes, 42);
assert.strictEqual(report.summary.acceptedRoutes, 42);
assert.strictEqual(report.summary.unreviewedRoutes, 0);
assert.match(report.genericAuditBoundary, /does not accept an unreviewed app/i);
assert.match(audit.markdown(report), /expected-unreviewed-gap/);

console.log("day5 Health release audit harness tests passed");
