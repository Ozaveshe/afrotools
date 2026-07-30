"use strict";

const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const E2E_DIR = path.join(ROOT, "tests", "e2e");
const EXPECTED_FILES = 29;
const SCOPED_SPEC = /^(creator-(bios|hashtags)-fr-parity|day9-creative-|fr-creative-|fr-creator-).*\.spec\.js$/;

function scopedFiles() {
  const files = fs.readdirSync(E2E_DIR)
    .filter((name) => SCOPED_SPEC.test(name))
    .sort()
    .map((name) => `tests/e2e/${name}`);

  if (files.length !== EXPECTED_FILES) {
    throw new Error(
      `French Creative proof inventory changed: expected ${EXPECTED_FILES} files, found ${files.length}.`
    );
  }
  return files;
}

function reserveFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = address && typeof address === "object" ? address.port : 0;
      server.close((error) => {
        if (error) reject(error);
        else resolve(port);
      });
    });
  });
}

async function main() {
  const files = scopedFiles();
  const requestedPort = Number(process.env.FR_CREATIVE_PROOF_PORT || 0);
  const port = requestedPort || await reserveFreePort();
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid French Creative proof port: ${process.env.FR_CREATIVE_PROOF_PORT}`);
  }

  const executable = process.execPath;
  const args = [
    require.resolve("@playwright/test/cli"),
    "test",
    ...files,
    "--config=playwright.fr-creative-proof.config.js",
    ...process.argv.slice(2),
  ];
  const child = spawn(executable, args, {
    cwd: ROOT,
    env: {
      ...process.env,
      FR_CREATIVE_PROOF_PORT: String(port),
    },
    stdio: "inherit",
  });

  const result = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
  if (result.signal) {
    process.stderr.write(`French Creative proof stopped by ${result.signal}.\n`);
    process.exitCode = 1;
  } else {
    process.exitCode = result.code === null ? 1 : result.code;
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
