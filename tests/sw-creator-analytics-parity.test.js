"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const engine = require("../engines/src/creator-analytics-engine.js");
const swIndex = fs.readFileSync(path.join(ROOT, "sw/zana/takwimu-za-mtayarishi/index.html"), "utf8");
const swApp = fs.readFileSync(path.join(ROOT, "sw/zana/takwimu-za-mtayarishi/app.html"), "utf8");
const enApp = fs.readFileSync(path.join(ROOT, "tools/creator-analytics/app.html"), "utf8");
const frApp = fs.readFileSync(path.join(ROOT, "fr/tools/stats-createur/app.html"), "utf8");
const enIndex = fs.readFileSync(path.join(ROOT, "tools/creator-analytics/index.html"), "utf8");
const frIndex = fs.readFileSync(path.join(ROOT, "fr/tools/stats-createur/index.html"), "utf8");

assert.match(swIndex, /href="\/sw\/zana\/takwimu-za-mtayarishi\/app"/);
assert.match(swApp, /<html\b[^>]*\blang="sw"/i);
assert.match(swApp, /name="afrotools-sw-native-owner" content="creator-analytics"/i);
assert.match(swApp, /name="afrotools-sw-source-owner" content="engines\/src\/creator-analytics-engine\.js"/i);
assert.match(swApp, /rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/takwimu-za-mtayarishi\/app"/i);
assert.match(swApp, /name="robots" content="noindex, follow"/i);
for (const app of [swApp, enApp, frApp]) assert.doesNotMatch(app, /hreflang=/i);
assert.match(swIndex, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/creator-analytics\/"/i);
assert.match(swIndex, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/stats-createur\/"/i);
assert.match(enIndex, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/takwimu-za-mtayarishi\/"/i);
assert.match(frIndex, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/takwimu-za-mtayarishi\/"/i);
assert.doesNotMatch(swApp, /<iframe\b/i);
assert.doesNotMatch(swApp, /(?:open|use|continue in) (?:the )?english/i);
assert.ok(fs.existsSync(path.join(ROOT, "assets/img/tools/creator-analytics.webp")), "creator analytics artwork missing");

const input = {
  id: "sw-fixture",
  date: "2026-08-09",
  platform: "instagram",
  format: "reel",
  label: "Jaribio la kampeni",
  impressions: 15000,
  reach: 10000,
  likes: 600,
  comments: 50,
  shares: 30,
  saves: 120,
  followers: 18
};
const checked = engine.validatePost(input);
assert.equal(checked.valid, true);
assert.equal(checked.post.interactions, 800);
assert.equal(checked.post.engagementRate, 8);
assert.deepEqual(engine.validatePost({ date: "", reach: 0 }).errors, ["date", "reach"]);

const summary = engine.summarize([input]);
assert.equal(summary.totalPosts, 1);
assert.equal(summary.totalReach, 10000);
assert.equal(summary.totalImpressions, 15000);
assert.equal(summary.totalInteractions, 800);
assert.equal(summary.followersGained, 18);
assert.equal(summary.engagementRate, 8);
assert.equal(summary.bestPlatform.name, "instagram");
assert.equal(summary.bestFormat.name, "reel");
assert.match(engine.brief(summary, "sw"), /1 chapisho/);
assert.match(engine.brief(summary, "sw"), /engagement 8\.00%/);

const csv = engine.toCsv([input]);
const lines = csv.split(/\r?\n/);
assert.equal(lines.length, 2);
assert.equal(lines[0], "date,platform,format,label,impressions,reach,likes,comments,shares,saves,followers_gained,interactions,engagement_rate_percent");
assert.match(lines[1], /^2026-08-09,instagram,reel,Jaribio la kampeni,15000,10000,600,50,30,120,18,800,8\.00$/);

console.log("Swahili creator analytics static and engine parity passed.");
