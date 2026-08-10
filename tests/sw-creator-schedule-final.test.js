"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "engines/src/creator-schedule-engine.js"), "utf8"), context);
const engine = context.window.AfroTools.CreatorScheduleEngine;
const later = engine.createPost({ title: 'English "quoted" post', platform: "instagram", scheduledAt: "2026-08-02T10:00", note: "Final, reviewed" });
const earlier = engine.createPost({ title: "Earlier post", platform: "linkedin", scheduledAt: "2026-08-01T09:00", note: "" });
assert.deepEqual(JSON.parse(JSON.stringify(engine.sortPosts([later, earlier]).map((post) => post.title))), ["Earlier post", 'English "quoted" post']);
assert.equal(engine.toCsv([later]), 'title,platform,scheduled_at,status,note\r\n"English ""quoted"" post","instagram","2026-08-02T10:00","planned","Final, reviewed"');
assert.deepEqual(JSON.parse(JSON.stringify(engine.platforms)), ["instagram", "tiktok", "youtube", "linkedin", "facebook", "x", "whatsapp"]);
assert.throws(() => engine.createPost({ title: "", platform: "x", scheduledAt: "2026-08-01" }), /title/);
assert.throws(() => engine.createPost({ title: "Post", platform: "bad", scheduledAt: "2026-08-01" }), /Platform/);
assert.throws(() => engine.createPost({ title: "Post", platform: "x", scheduledAt: "bad" }), /date/);

const controller = fs.readFileSync(path.join(root, "assets/js/pages/creative/creator-schedule-native.js"), "utf8");
assert.match(controller, /Post added to the local plan/);
assert.match(controller, /Local plan only; no automatic publishing/);
assert.match(controller, /Ratiba ya kifaa chako pekee/);
const html = fs.readFileSync(path.join(root, "sw/zana/ratiba-ya-mtayarishi/index.html"), "utf8");
assert.match(html, /data-creator-schedule-native data-lang="sw"/);
assert.match(html, /creator-schedule\.webp/);
assert.doesNotMatch(html, /Fungua zana kamili ya Kiingereza/);
console.log("Swahili creator-schedule final: 12 assertions passed");
