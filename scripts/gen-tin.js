const fs=require('fs');
const src=require('C:/Users/Oza/Downloads/afrotools-270-master-data.js');
const C=src.COUNTRIES;
const T=src.TIN_DATA;
let count=0;

for(const cc in C){
  const c=C[cc], t=T[cc];
  if(!t)continue;
  const title=c.name+' TIN Registration Guide — '+t.tinName.split('(')[0].trim()+' | AfroTools';
  const desc='How to get your '+t.tinName+' from '+t.authority+' ('+t.authorityAbbr+'). Free guide: cost, documents, steps, timeline, and penalties for '+c.name+'.';
  const url='https://afrotools.com/tools/tin-guide/'+c.slug;
  const shortTin=t.tinName.split('(')[0].trim();

  const faq=[
    {q:'How much does '+shortTin+' registration cost in '+c.name+'?',a:t.cost+'. Registration is processed by '+t.authorityAbbr+' and typically takes '+t.processingTime+'.'},
    {q:'What documents do I need for '+shortTin+' in '+c.name+'?',a:'Individuals need: '+t.docs.individual.slice(0,3).join(', ')+'. Businesses need: '+t.docs.business.slice(0,3).join(', ')+'.'},
    {q:'What is the penalty for not registering for '+shortTin+' in '+c.name+'?',a:t.penalties.noRegistration}
  ];

  const schema1=JSON.stringify({
    '@context':'https://schema.org','@type':'WebApplication',
    name:title,description:desc,url:url,
    applicationCategory:'GovernmentApplication',
    provider:{'@type':'Organization',name:'AfroTools',url:'https://afrotools.com'},
    offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}
  });
  const schema2=JSON.stringify({
    '@context':'https://schema.org','@type':'BreadcrumbList',
    itemListElement:[
      {'@type':'ListItem',position:1,name:'Home',item:'https://afrotools.com/'},
      {'@type':'ListItem',position:2,name:'Legal & Compliance',item:'https://afrotools.com/legal/'},
      {'@type':'ListItem',position:3,name:'TIN Registration Guide',item:'https://afrotools.com/tools/tin-guide/'},
      {'@type':'ListItem',position:4,name:c.name,item:url}
    ]
  });
  const schema3=JSON.stringify({
    '@context':'https://schema.org','@type':'FAQPage',
    mainEntity:faq.map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}}))
  });

  const seo1='The '+t.tinName+' is issued by the '+t.authority+' ('+t.authorityAbbr+') in '+c.name+'. Registration is '+t.cost.toLowerCase()+' and typically takes '+t.processingTime+'. '+
    (t.onlinePortal?c.name+' offers online TIN registration through the '+t.authorityAbbr+' portal, making the process accessible from anywhere.':'Registration is currently available in person at '+t.authorityAbbr+' offices.')+
    ' The TIN is governed by the '+t.relatedLaw+' and administered by the '+t.ministry+'.';

  const seo2='All businesses operating in '+c.name+' and individuals in formal employment are required to register for a '+shortTin+'. '+
    'The '+shortTin+' is a '+t.tinFormat+' identifier needed for tax filing, business bank accounts, government contracts, and customs clearance. '+
    'Failure to register carries penalties: '+t.penalties.noRegistration.charAt(0).toLowerCase()+t.penalties.noRegistration.slice(1)+'.';

  const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc.replace(/"/g,'&quot;')}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${title.replace(/"/g,'&quot;')}">
<meta property="og:description" content="${desc.replace(/"/g,'&quot;')}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${schema1}<\/script>
<script type="application/ld+json">${schema2}<\/script>
<script type="application/ld+json">${schema3}<\/script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f"><link rel="stylesheet" href="/assets/css/global.min.css?v=1eef2cf2"><link rel="stylesheet" href="/assets/css/legal.css?v=af6e9e60">
<script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer><\/script><script src="/assets/js/components/footer.min.js?v=0f040e13" defer><\/script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}
.tin-detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem}
.tin-detail-card{background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:1.25rem;text-align:center}
.tin-detail-card .val{font-size:1.1rem;font-weight:800;color:var(--leg);margin-bottom:.25rem}
.tin-detail-card .lbl{font-size:.75rem;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.tin-steps-list{list-style:none;padding:0;margin:1rem 0 0;counter-reset:tsteps}
.tin-steps-list li{display:flex;align-items:flex-start;gap:.75rem;padding:.75rem 0;border-bottom:1px solid #f1f5f9;counter-increment:tsteps;font-size:.88rem;color:#1a1a2e}
.tin-steps-list li:last-child{border-bottom:none}
.tin-steps-list li::before{content:counter(tsteps);width:24px;height:24px;border-radius:50%;background:var(--leg-l);color:var(--leg);font-size:.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px}
</style>
</head>
<body>
<afro-navbar theme="dark" active="legal"></afro-navbar>
<section class="leg-tool-hero"><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>›</span> <a href="/legal/">Legal &amp; Compliance</a> <span>›</span> <a href="/tools/tin-guide/">TIN Registration Guide</a> <span>›</span> ${c.name}</nav>
<h1>${c.flag} ${c.name} <em>TIN Registration Guide</em></h1>
<p class="leg-tool-hero-sub">Complete guide to ${t.tinName} registration in ${c.name}. Authority, process, cost, timeline, required documents, and penalties.</p>
<div class="leg-badges"><span class="leg-badge">${c.flag} ${c.name}</span><span class="leg-badge">\u{1F4B0} ${t.cost}</span><span class="leg-badge">\u{231B} ${t.processingTime}</span></div>
</div></section>
<main class="leg-main">
<div class="leg-card"><div class="leg-card-head"><span>\u{1F3E6}</span><h2>${t.authorityAbbr} \u2014 Quick Reference</h2></div>
<div class="leg-card-body" id="tinInfoCards"></div></div>

<div class="leg-card"><div class="leg-card-head"><span>\u{1F4C4}</span><h2>Required Documents</h2></div>
<div class="leg-card-body" id="tinDocs"></div></div>

<div class="leg-card"><div class="leg-card-head"><span>\u{1F4CB}</span><h2>Registration Process</h2></div>
<div class="leg-card-body" id="tinSteps"></div></div>

<div id="tinVerify"></div>
<div id="tinPenalties"></div>

<section class="leg-seo" style="margin-top:2rem">
<h2>TIN Registration in ${c.name} \u2014 Complete Guide</h2>
<p>${seo1}</p>
<p>${seo2}</p>
<div class="leg-disclaimer" style="margin-top:1rem"><strong>\u26A0\uFE0F Disclaimer</strong> This tool provides general information only. Tax laws and registration requirements change frequently. Always verify with ${t.authorityAbbr} or a qualified tax advisor for the latest requirements.</div>
</section>
</main>
<afro-footer></afro-footer>
<script src="/data/legal/tin-guide-data.js?v=1"><\/script>
<script src="/engines/tin-guide-engine.js?v=1"><\/script>
<script>
!function(){"use strict";
var CC='${cc}';
var E=window.AfroTools.TinGuideEngine;
if(E)E.initPage(CC);
}();
<\/script>
</body>
</html>`;

  fs.writeFileSync('tools/tin-guide/'+c.slug+'.html', html);
  count++;
}
console.log('Created '+count+' TIN country pages');
