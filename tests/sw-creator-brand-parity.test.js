"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const ROOT=path.resolve(__dirname,".."),engine=require("../engines/src/creator-brand-engine.js");
const sw=fs.readFileSync(path.join(ROOT,"sw/zana/brand-kit-ya-mtayarishi/app.html"),"utf8");
assert.match(sw,/lang="sw"/);assert.match(sw,/data-creator-brand-app data-locale="sw"/);assert.match(sw,/afrotools-sw-native-owner" content="creator-brand"/);assert.doesNotMatch(sw,/<iframe\b/i);assert.ok(fs.existsSync(path.join(ROOT,"assets/img/tools/creator-brand.webp")));
for(const file of ["tools/creator-brand/app.html","fr/tools/kit-de-marque-pour-createur/app.html"]){assert.match(fs.readFileSync(path.join(ROOT,file),"utf8"),/hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/brand-kit-ya-mtayarishi\/app"/)}
const kit=engine.buildKit({name:"Nia Studio",tagline:"Hadithi zenye matumizi.",industry:"creative",audience:"Biashara za Afrika",mission:"Rahisisha mawasiliano ya picha.",primaryColor:"#0F766E",secondaryColor:"#F59E0B",textColor:"#FFFFFF",headingFont:"Sora",bodyFont:"DM Sans",tone:"bold",keywords:"wazi, muhimu, wazi"},"sw");
assert.equal(kit.colors.primary,"#0F766E");assert.equal(kit.colors.primaryTextContrast,5.47);assert.equal(kit.colors.primaryTextWcagAA,true);assert.deepEqual(kit.voice.keywords,["wazi","muhimu"]);assert.match(kit.voice.samplePosts[1],/Imeundwa kwa/);
const json=JSON.parse(JSON.stringify(kit));assert.equal(json.tool,"creator-brand");assert.match(engine.toText(kit,"sw"),/MWONGOZO WA BRAND/);const html=engine.toGuideHtml(kit,"sw");assert.match(html,/<html lang="sw">/);assert.match(html,/<h2>Rangi<\/h2>/);
console.log("Swahili creator brand static and engine parity passed.");
