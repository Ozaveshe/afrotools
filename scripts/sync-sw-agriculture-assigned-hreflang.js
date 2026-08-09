#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,".."),CHECK=process.argv.includes("--check");
const {apps}=require("./build-sw-agriculture-assigned-apps.js");
function fileFor(route){const clean=route.replace(/^\//,"");return path.join(ROOT,clean.endsWith(".html")?clean:path.join(clean,"index.html"));}
function sync(html,route){const link=`<link rel="alternate" hreflang="sw" href="https://afrotools.com${route}">`;if(/<link rel="alternate" hreflang="sw" href="[^"]+">/.test(html))return html.replace(/<link rel="alternate" hreflang="sw" href="[^"]+">/,link);return html.replace(/(<link rel="canonical" href="[^"]+">)/,`$1\n${link}`);}
const stale=[];for(const app of apps){const swFile=fileFor(`/sw/zana/${app.slug}/`),sw=fs.readFileSync(swFile,"utf8");for(const match of sw.matchAll(/<link rel="alternate" hreflang="(?!sw)([^"]+)" href="https:\/\/afrotools\.com([^\"]+)">/g)){const target=fileFor(match[2]);if(!fs.existsSync(target))continue;const current=fs.readFileSync(target,"utf8"),next=sync(current,`/sw/zana/${app.slug}/`);if(next!==current){stale.push(path.relative(ROOT,target));if(!CHECK)fs.writeFileSync(target,next);}}}
if(CHECK&&stale.length){console.error(`Agriculture reciprocal metadata stale (${stale.length}):\n${stale.join("\n")}`);process.exitCode=1;}else console.log(`${CHECK?"Checked":"Synchronized"} assigned Agriculture reciprocal metadata; ${stale.length} ${CHECK?"stale":"updated"}.`);
