#!/usr/bin/env node
"use strict";

var policy = require("../tools/afrostream/afrostream-media-policy.js");

function argValue(name, fallback) {
  var prefix = "--" + name + "=";
  var hit = process.argv.find(function (arg) { return arg.indexOf(prefix) === 0; });
  return hit ? hit.slice(prefix.length) : fallback;
}

function hasArg(name) {
  return process.argv.indexOf("--" + name) !== -1;
}

function safeUrl(value) {
  var text = String(value || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text) || text.charAt(0) === "/") return text;
  return "";
}

function mediaUrl(row) {
  return safeUrl(row.thumbnail || row.thumbnail_url || row.image_url || row.cover_url || row.avatar_url);
}

function label(row) {
  return [row.creator_name || row.name || "Unknown", row.platform || "", row.title || ""].filter(Boolean).join(" | ");
}

async function fetchJson(endpoint) {
  var res = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "AfroTools live media audit"
    }
  });
  if (!res.ok) throw new Error("Endpoint returned HTTP " + res.status + ": " + endpoint);
  return res.json();
}

async function checkImage(url) {
  if (url.charAt(0) === "/" || url.indexOf("data:") === 0) return { ok: true, status: "local" };

  var ctrl = new AbortController();
  var timer = setTimeout(function () { ctrl.abort(); }, 8000);
  try {
    var res = await fetch(url, {
      method: "GET",
      headers: {
        Range: "bytes=0-0",
        "User-Agent": "AfroTools live media audit"
      },
      signal: ctrl.signal
    });
    clearTimeout(timer);
    return { ok: res.status >= 200 && res.status < 400, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, status: err.name === "AbortError" ? "timeout" : err.message };
  }
}

async function main() {
  var endpoint = argValue("endpoint", process.env.AFROSTREAM_STREAMS_ENDPOINT || "http://127.0.0.1:4177/api/afrostream/streams?limit=500");
  var strict = hasArg("strict");
  var skipImageCheck = hasArg("skip-image-check");
  var payload = await fetchJson(endpoint);
  var rows = Array.isArray(payload && payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
  var published = rows.filter(function (row) { return row && row.is_published !== false; });
  var missing = [];
  var hidden = [];
  var generated = [];
  var broken = [];

  for (var i = 0; i < published.length; i++) {
    var row = published[i];
    var url = mediaUrl(row);
    var mediaPolicy = policy.evaluate(row);
    if (mediaPolicy.hidden) {
      hidden.push({ label: label(row), reason: mediaPolicy.reason, term: mediaPolicy.term, thumbnail: url });
      continue;
    }
    if (mediaPolicy.generated) {
      generated.push({ label: label(row), reason: mediaPolicy.reason, term: mediaPolicy.term, thumbnail: url });
      continue;
    }
    if (!url) {
      missing.push({ label: label(row) });
      continue;
    }
    if (!skipImageCheck) {
      var image = await checkImage(url);
      if (!image.ok) broken.push({ label: label(row), status: image.status, thumbnail: url });
    }
  }

  var summary = {
    endpoint: endpoint,
    streams: published.length,
    withThumbnail: published.length - missing.length,
    policyHidden: hidden.length,
    generatedPreview: generated.length,
    missingThumbnail: missing.length,
    brokenThumbnail: broken.length
  };

  console.log("AfroStream live media audit");
  console.log(JSON.stringify(summary, null, 2));
  if (hidden.length) {
    console.log("\nPolicy-hidden previews:");
    hidden.slice(0, 10).forEach(function (item) {
      console.log("- " + item.label + " [" + item.reason + ": " + item.term + "]");
    });
  }
  if (generated.length) {
    console.log("\nGenerated preview replacements:");
    generated.slice(0, 10).forEach(function (item) {
      console.log("- " + item.label + " [" + item.reason + "]");
    });
  }
  if (missing.length) {
    console.log("\nMissing thumbnails:");
    missing.slice(0, 10).forEach(function (item) {
      console.log("- " + item.label);
    });
  }
  if (broken.length) {
    console.log("\nBroken thumbnail URLs:");
    broken.slice(0, 10).forEach(function (item) {
      console.log("- " + item.label + " [" + item.status + "] " + item.thumbnail);
    });
  }

  if (strict && (missing.length || broken.length)) process.exit(1);
}

main().catch(function (err) {
  console.error("AfroStream live media audit failed:", err.message);
  process.exit(1);
});
