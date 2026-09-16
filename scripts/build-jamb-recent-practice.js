#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),path=require('node:path');
const bank=require('../assets/js/lib/jamb-recent-written-bank');
const {stableId}=require('./lib/content-integrity');
const {earlyBootstrapTag,bootstrapVersion,analyticsVersion}=require('./inject-analytics-loader');
const route='/jamb/mathematics/recent-practice/';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(){
 const title='JAMB Mathematics: 2023 source-linked revision | AfroTools',description='Work through five checked Mathematics tasks from a publisher-labelled 2023 JAMB collection. Save your reasoning, reveal worked solutions and export a backup.';
 return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
${earlyBootstrapTag(bootstrapVersion(),analyticsVersion())}
<meta name="afrotools-source-owner" content="scripts/build-jamb-recent-practice.js"><meta name="afrotools-content-id" content="${stableId(route)}">
<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index, follow">
<link rel="canonical" href="https://afrotools.com${route}"><link rel="alternate" hreflang="en" href="https://afrotools.com${route}"><link rel="alternate" hreflang="x-default" href="https://afrotools.com${route}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="https://afrotools.com${route}"><meta property="og:type" content="website"><meta property="og:image" content="https://afrotools.com/assets/img/og-default.png"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}">
<link rel="stylesheet" href="/assets/css/design-system.css"><link rel="stylesheet" href="/assets/css/ssce-practice.css"><link rel="stylesheet" href="/assets/css/ssce-written.css">
<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:'JAMB Mathematics source-linked revision',url:'https://afrotools.com'+route,applicationCategory:'EducationalApplication',operatingSystem:'Web',inLanguage:'en',description})}</script>
${['components/navbar.min.js','components/footer.min.js','lib/jamb-recent-written-bank.js','lib/ssce-written.js','pages/ssce-written.js'].map(s=>`<script src="/assets/js/${s}" defer></script>`).join('\n')}
</head><body><afro-navbar active="education"></afro-navbar><main class="practice-shell">
<nav aria-label="Breadcrumb"><a href="/tools/education-hub/">Education Hub</a> / <a href="/jamb/">AfroJAMB</a> / <a href="/jamb/mathematics/">Mathematics</a></nav>
<header class="page-header"><h1>JAMB Mathematics revision</h1><p>Five source-linked tasks from Myschool’s 2023 collection. Write your reasoning, then open the worked solution.</p></header>
<p>The year is the publisher’s collection label. These adapted tasks are a selected revision set, not a complete authenticated exam sitting or an official marking scheme.</p>
<nav aria-label="Revision topics"><ul>${bank.items.map(q=>`<li><a href="#written=${encodeURIComponent(q.id)}">${esc(q.title)}</a></li>`).join('')}</ul></nav>
<section id="written-practice" aria-labelledby="written-heading"><h2 id="written-heading">Work through a question</h2><p>Your responses stay on this device and are saved only when you choose Save response. You can download a backup or report without an account.</p>
<div class="written-setup"><div class="form-field"><label class="form-label" for="written-collection">Collection</label><select class="form-select" id="written-collection"></select></div><div class="form-field"><label class="form-label" for="written-task">Task</label><select class="form-select" id="written-task"></select></div></div>
<p id="written-status" role="status" aria-live="polite"></p><div id="written-editor"></div>
<div class="form-field"><label class="form-label" for="written-import">Open a revision backup</label><input id="written-import" type="file" accept=".json,application/json"></div></section>
<noscript><p>Enable JavaScript to write and save responses. You can still use the source links and worked guides below.</p></noscript>
<section aria-labelledby="reference-heading"><h2 id="reference-heading">Question sources and worked guides</h2>${bank.items.map(q=>`<details><summary>${esc(q.title)}</summary><p>${esc(q.prompt)}</p><p><a href="${esc(q.source)}" rel="noopener noreferrer" target="_blank">Source item ${q.sourceItem}: Myschool’s JAMB 2023 collection</a></p><details><summary>Show worked solution</summary><p>${esc(q.answer)}</p><ol>${q.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol></details></details>`).join('\n')}</section>
<nav class="practice-actions" aria-label="Continue studying"><a href="/tools/education-hub/#daily-study">My study day</a><a href="/tools/study-planner/">Study planner</a><a href="/jamb/mathematics/">Browse Mathematics years</a><a href="/tools/ssce-practice/">WAEC and NECO practice</a></nav>
</main><afro-footer></afro-footer></body></html>\n`;
}
function build(root=path.resolve(__dirname,'..')){const file=path.join(root,route,'index.html');fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,render());return file;}
if(require.main===module)console.log(build());
module.exports={render,build,route};
