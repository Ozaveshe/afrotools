"use strict";

const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const {
  EXPECTED,
  OWNER_ISOLATION_SPEC,
  PRODUCTION_BOUNDARY_SPECS,
  ROOT,
  ROUTE_CONTRACT_SPEC,
  buildCategoryRows,
  coverageDigest,
  normalizeRoute,
  ownerSpecsForRows,
  routeTestTitle,
} = require("./lib/french-vat-business-tax-live-contract");

const RESULT_FILE = path.join(
  ROOT,
  "reports",
  "french-wave2-owner-suite-result.json",
);

function argument(name, fallback) {
  const prefix = `--${name}=`;
  const raw = process.argv.find((item) => item.startsWith(prefix));
  return raw ? raw.slice(prefix.length) : fallback;
}

function playwrightCli() {
  try {
    return require.resolve("@playwright/test/cli");
  } catch (error) {
    throw new Error(
      "Playwright is unavailable. Run npm ci or expose the repository node_modules through NODE_PATH.",
      { cause: error },
    );
  }
}

function runProcess(args, env, outputFile) {
  return new Promise((resolve) => {
    const stdout = fs.openSync(outputFile, "w");
    const child = childProcess.spawn(process.execPath, args, {
      cwd: ROOT,
      env,
      stdio: ["ignore", stdout, "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on("close", (code) => {
      fs.closeSync(stdout);
      resolve({ code, stderr, outputFile });
    });
  });
}

function walkSuites(suites, output) {
  for (const suite of suites || []) {
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const results = test.results || [];
        const final = results[results.length - 1] || {};
        output.push({
          file: String(spec.file || suite.file || "").replace(/\\/g, "/"),
          title: spec.title,
          projectName: test.projectName || "",
          expectedStatus: test.expectedStatus || "passed",
          status: final.status || test.status || "unknown",
          attempts: results.length,
          annotations: test.annotations || [],
          errors: final.errors || [],
        });
      }
    }
    walkSuites(suite.suites, output);
  }
}

function readPlaywrightReport(file) {
  const report = JSON.parse(fs.readFileSync(file, "utf8"));
  const tests = [];
  walkSuites(report.suites, tests);
  return { report, tests };
}

function passed(test) {
  return (
    test.status === "passed" ||
    (test.status === "skipped" && test.expectedStatus === "skipped")
  );
}

async function runShards(specs, options) {
  const temp = fs.mkdtempSync(
    path.join(os.tmpdir(), `afrotools-fr-vat-${options.label}-`),
  );
  const shardCount = Math.min(options.shards, specs.length);
  const allocations = Array.from({ length: shardCount }, () => []);
  const dedicated = [ROUTE_CONTRACT_SPEC, OWNER_ISOLATION_SPEC].filter(
    (spec) => specs.includes(spec) && allocations.length > 2,
  );
  dedicated.forEach((spec, index) => allocations[index].push(spec));
  const remaining = specs.filter((spec) => !dedicated.includes(spec));
  const firstSharedShard = dedicated.length;
  const sharedShardCount = shardCount - firstSharedShard;
  remaining.forEach((spec, index) => {
    allocations[firstSharedShard + (index % sharedShardCount)].push(spec);
  });
  const jobs = [];
  for (let shard = 1; shard <= shardCount; shard += 1) {
    const port = options.basePort + shard - 1;
    const outputFile = path.join(temp, `shard-${shard}.json`);
    const outputDir = path.join(temp, `test-results-${shard}`);
    const env = {
      ...process.env,
      PORT: String(port),
      PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${port}`,
      AFROTOOLS_TEST_DISABLE_ANALYTICS: options.disableAnalytics ? "1" : "0",
    };
    jobs.push(
      runProcess(
        [
          playwrightCli(),
          "test",
          ...allocations[shard - 1],
          "--project=chromium",
          `--workers=${options.workers}`,
          `--retries=${options.retries || 0}`,
          "--reporter=json",
          `--output=${outputDir}`,
        ],
        env,
        outputFile,
      ).then((result) => ({
        ...result,
        port,
        shard,
        assignedSpecs: allocations[shard - 1],
      })),
    );
  }
  const completed = await Promise.all(jobs);
  const tests = [];
  const shards = [];
  for (const result of completed) {
    let parsed = { tests: [] };
    try {
      parsed = readPlaywrightReport(result.outputFile);
    } catch (error) {
      result.stderr += `\nUnable to parse JSON reporter: ${error.message}`;
    }
    tests.push(...parsed.tests);
    shards.push({
      shard: result.shard,
      port: result.port,
      exitCode: result.code,
      passed: parsed.tests.filter(passed).length,
      failed: parsed.tests.filter((test) => !passed(test)).length,
      total: parsed.tests.length,
      retried: parsed.tests.filter((test) => test.attempts > 1).length,
      assignedSpecs: result.assignedSpecs,
      stderr: result.stderr.trim(),
    });
  }
  fs.rmSync(temp, { recursive: true, force: true });
  return { tests, shards };
}

function relativeFile(file) {
  const normalized = String(file || "").replace(/\\/g, "/");
  const root = ROOT.replace(/\\/g, "/");
  return normalized.startsWith(`${root}/`)
    ? normalized.slice(root.length + 1)
    : normalized.replace(/^\.\//, "");
}

function summarizeTests(tests, expectedSpecs) {
  const expectedByBaseName = new Map(
    expectedSpecs.map((spec) => [path.posix.basename(spec), spec]),
  );
  const normalized = tests.map((test) => ({
    ...test,
    file:
      expectedByBaseName.get(path.posix.basename(relativeFile(test.file))) ||
      relativeFile(test.file),
  }));
  const missingSpecs = expectedSpecs.filter(
    (spec) => !normalized.some((test) => test.file === spec),
  );
  const failed = normalized.filter((test) => !passed(test));
  return {
    passed: normalized.filter(passed).length,
    failed: failed.length,
    total: normalized.length,
    retried: normalized.filter((test) => test.attempts > 1).length,
    specFiles: [...new Set(normalized.map((test) => test.file))].sort(),
    missingSpecs,
    failures: failed.map((test) => ({
      file: test.file,
      title: test.title,
      status: test.status,
      errors: test.errors,
    })),
  };
}

function routeResult(test, row) {
  if (!test || !passed(test)) return null;
  const annotation = (test.annotations || []).find(
    (item) => item.type === "fr-vat-route-contract",
  );
  if (!annotation || !annotation.description) return null;
  try {
    const parsed = JSON.parse(annotation.description);
    if (normalizeRoute(parsed.route) !== normalizeRoute(row.primaryFrenchRoute)) {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

async function main() {
  const rows = buildCategoryRows();
  const ownerSpecs = ownerSpecsForRows(rows);
  const expectedOwnerSpecs = [
    ...new Set([...ownerSpecs.values()].flat()),
  ].sort();
  if (expectedOwnerSpecs.length !== 62) {
    throw new Error(`Expected 62 owner spec files, found ${expectedOwnerSpecs.length}.`);
  }

  const shards = Number(argument("shards", "4"));
  const workers = Number(argument("workers", "2"));
  const basePort = Number(argument("base-port", "4310"));
  if (!Number.isInteger(shards) || shards < 1) throw new Error("Invalid shards.");
  if (!Number.isInteger(workers) || workers < 1) throw new Error("Invalid workers.");
  if (!Number.isInteger(basePort) || basePort < 1024) {
    throw new Error("Invalid base port.");
  }

  const ownerCoreRun = await runShards(
    [...expectedOwnerSpecs, OWNER_ISOLATION_SPEC],
    {
      label: "owner-core",
      shards: Math.max(1, shards - 1),
      workers,
      retries: 1,
      basePort,
      disableAnalytics: true,
    },
  );
  const routeContractRun = await runShards([ROUTE_CONTRACT_SPEC], {
    label: "route-contract",
    shards: 1,
    workers,
    retries: 0,
    basePort: basePort + Math.max(1, shards - 1),
    disableAnalytics: true,
  });
  const ownerRun = {
    tests: [...ownerCoreRun.tests, ...routeContractRun.tests],
    shards: [
      ...ownerCoreRun.shards.map((shard) => ({
        ...shard,
        phase: "owner-core",
      })),
      ...routeContractRun.shards.map((shard, index) => ({
        ...shard,
        shard: ownerCoreRun.shards.length + index + 1,
        phase: "route-contract",
      })),
    ],
  };
  const productionRun = await runShards(PRODUCTION_BOUNDARY_SPECS, {
    label: "production-boundary",
    shards: 1,
    workers: 1,
    retries: 0,
    basePort: basePort + shards + 10,
    disableAnalytics: false,
  });

  const ownerSummary = summarizeTests(ownerRun.tests, [
    ...expectedOwnerSpecs,
    ROUTE_CONTRACT_SPEC,
    OWNER_ISOLATION_SPEC,
  ]);
  const productionSummary = summarizeTests(
    productionRun.tests,
    PRODUCTION_BOUNDARY_SPECS,
  );
  const routeTests = new Map(
    ownerRun.tests
      .filter((test) => String(test.title).startsWith("FRVAT::"))
      .map((test) => [test.title, test]),
  );
  const normalizedOwnerTests = ownerRun.tests.map((test) => ({
    ...test,
    file:
      [
        ...expectedOwnerSpecs,
        ROUTE_CONTRACT_SPEC,
        OWNER_ISOLATION_SPEC,
      ].find(
        (spec) =>
          path.posix.basename(spec) ===
          path.posix.basename(relativeFile(test.file)),
      ) || relativeFile(test.file),
  }));

  const rowResults = rows.map((row) => {
    const specs = ownerSpecs.get(row.englishId) || [];
    const specTests = normalizedOwnerTests.filter((test) =>
      specs.includes(test.file),
    );
    const contract = routeResult(routeTests.get(routeTestTitle(row)), row);
    const ownerSpecsPassed =
      specs.length > 0 &&
      specs.every(
        (spec) =>
          normalizedOwnerTests.some((test) => test.file === spec) &&
          normalizedOwnerTests
            .filter((test) => test.file === spec)
            .every(passed),
      );
    const requiredContract =
      contract &&
      contract.seo === true &&
      contract.reciprocalHreflang === true &&
      contract.mobile320 === true &&
      contract.reflow200 === true &&
      contract.systemDark === true &&
      contract.manualDark === true &&
      contract.keyboard === true &&
      contract.accessibleNames === true &&
      contract.privacy === true &&
      contract.noNetworkWrites === true &&
      contract.exportAdvertised === contract.exportsParsed;
    return {
      englishId: row.englishId,
      frenchRoute: normalizeRoute(row.primaryFrenchRoute),
      ownerSpecs: specs,
      ownerTestCount: specTests.length,
      ownerSpecsPassed,
      routeContractPassed: Boolean(requiredContract),
      contract,
      accepted: ownerSpecsPassed && Boolean(requiredContract),
    };
  });

  const digest = coverageDigest(rows, ownerSpecs);
  const accepted =
    ownerRun.shards.every((shard) => shard.exitCode === 0) &&
    ownerRun.shards.every(
      (shard) => shard.total > 0 && shard.assignedSpecs.length > 0,
    ) &&
    productionRun.shards.every((shard) => shard.exitCode === 0) &&
    productionRun.shards.every(
      (shard) => shard.total > 0 && shard.assignedSpecs.length > 0,
    ) &&
    ownerSummary.failed === 0 &&
    ownerSummary.missingSpecs.length === 0 &&
    productionSummary.failed === 0 &&
    productionSummary.missingSpecs.length === 0 &&
    rowResults.length === EXPECTED &&
    rowResults.every((row) => row.accepted);
  const result = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    source: "live isolated Playwright JSON reports",
    worktreeRoot: ROOT,
    staticServerRoot: ROOT,
    command: `node scripts/run-french-vat-business-tax-live-suite.js --write --shards=${shards} --workers=${workers} --base-port=${basePort}`,
    coverageDigest: digest,
    isolatedPorts: {
      owner: ownerRun.shards.map((shard) => shard.port),
      productionBoundary: productionRun.shards.map((shard) => shard.port),
    },
    ownerSuite: {
      ...ownerSummary,
      shards: ownerRun.shards,
    },
    productionBoundarySuites: {
      ...productionSummary,
      shards: productionRun.shards,
    },
    rows: rowResults,
    acceptance: {
      accepted: accepted ? EXPECTED : rowResults.filter((row) => row.accepted).length,
      blocked: rowResults.filter((row) => !row.accepted).length,
      complete: accepted,
    },
  };

  if (process.argv.includes("--write")) {
    fs.writeFileSync(RESULT_FILE, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  console.log(
    `French VAT live suite: ${result.acceptance.accepted}/${EXPECTED} accepted; ` +
      `${ownerSummary.passed}/${ownerSummary.total} owner tests passed; ` +
      `${productionSummary.passed}/${productionSummary.total} production-boundary tests passed.`,
  );
  if (!accepted) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
