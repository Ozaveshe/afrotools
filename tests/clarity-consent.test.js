"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const claritySource = fs.readFileSync(path.join(ROOT, "assets", "js", "lib", "clarity.js"), "utf8");
const bundleSource = fs.readFileSync(path.join(ROOT, "scripts", "bundle.js"), "utf8");

function createSandbox(consentValue) {
  const inserted = [];
  const listeners = {};
  const firstScript = {
    parentNode: {
      insertBefore(node) {
        inserted.push(node);
      }
    }
  };
  const document = {
    readyState: "loading",
    head: {
      appendChild(node) {
        inserted.push(node);
      }
    },
    createElement(tagName) {
      return { tagName: tagName.toUpperCase(), async: false, src: "" };
    },
    getElementsByTagName(tagName) {
      return tagName === "script" ? [firstScript] : [];
    },
    querySelector() {
      return null;
    }
  };
  const window = {
    AfroTools: {},
    localStorage: {
      getItem(key) {
        return key === "afrotools_cookie_consent" ? consentValue : null;
      }
    },
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    setTimeout(handler) {
      return handler();
    },
    setInterval() {
      return 1;
    },
    clearInterval() {}
  };

  return {
    sandbox: { window, document, Date, console },
    inserted,
    listeners,
    setConsent(value) {
      consentValue = value;
    }
  };
}

function run(consentValue) {
  const context = createSandbox(consentValue);
  vm.runInNewContext(claritySource, context.sandbox, { filename: "clarity.js" });
  return context;
}

const declined = run("declined");
assert.strictEqual(declined.inserted.length, 0, "Clarity must not load when cookie consent is declined");

const unset = run(null);
assert.strictEqual(unset.inserted.length, 0, "Clarity must not load before cookie consent");
assert.strictEqual(typeof unset.sandbox.window.AfroTools.clarity.load, "function", "Clarity loader API is exposed");

unset.setConsent("accepted");
assert.strictEqual(unset.sandbox.window.AfroTools.clarity.load(), true, "Clarity loads after consent changes to accepted");
assert.strictEqual(unset.inserted.length, 1, "Accepted consent inserts exactly one Clarity script");
assert.strictEqual(unset.inserted[0].src, "https://www.clarity.ms/tag/wz74o0pctq", "Clarity project id matches provided snippet");

const accepted = run("accepted");
assert.strictEqual(accepted.inserted.length, 0, "Accepted consent waits for page load before injecting");
accepted.listeners.load();
assert.strictEqual(accepted.inserted.length, 1, "Existing accepted consent injects Clarity on load");

assert.ok(bundleSource.includes("'assets/js/lib/clarity.js'"), "Core bundle includes the Clarity loader");
assert.ok(bundleSource.includes("'core.52693c87.min.js'"), "Current core bundle alias is preserved for existing pages");

console.log("clarity-consent.test.js passed");
