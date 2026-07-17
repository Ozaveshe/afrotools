const fs=require('fs');
const master=require('C:/Users/Oza/Downloads/afrotools-270-master-data.js');
const pack2=require('C:/Users/Oza/Downloads/afrotools-data-pack-2.js');
const C=master.COUNTRIES;
const B=pack2.BUSINESS_LICENSE_DATA;
let count=0;

for(const cc in B){
  const c=C[cc];
  if(!c)continue;
  const title=c.name+' Business Licenses & Permits \u2014 Complete Directory | AfroTools';
  const desc='Find all business licenses and permits required in '+c.name+'. 12 industries covered: retail, food, construction, healthcare, financial, education, manufacturing, transport, technology, mining, agriculture, hospitality.';
  const url='https://afrotools.com/tools/business-license/'+c.slug;

  const schema1=JSON.stringify({'@context':'https://schema.org','@type':'WebApplication',name:title,description:desc,url:url,applicationCategory:'BusinessApplication',provider:{'@type':'Organization',name:'AfroTools',url:'https://afrotools.com'},offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}});
  const schema2=JSON.stringify({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:'https://afrotools.com/'},{'@type':'ListItem',position:2,name:'Legal & Compliance',item:'https://afrotools.com/legal/'},{'@type':'ListItem',position:3,name:'Business License Requirements',item:'https://afrotools.com/tools/business-license/'},{'@type':'ListItem',position:4,name:c.name,item:url}]});

  // Count total licenses
  const indKeys=Object.keys(B[cc]);
  let totalLic=0;
  indKeys.forEach(k=>{totalLic+=B[cc][k].length;});

  const seo1='Starting a business in '+c.name+'? This directory lists all licenses and permits required across 12 major industries. '+
    'We cover '+totalLic+'+ license requirements from regulatory authorities including business registration, sector-specific permits, environmental clearances, and operational licenses.';
  const seo2='Every business in '+c.name+' needs at minimum: a business registration certificate, tax identification number (TIN), and local government trade license. '+
    'Industry-specific licenses vary by sector \u2014 select your industry above to see the exact requirements, costs, issuing authorities, and processing times.';

  const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc.replace(/"/g,'&quot;')}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc.replace(/"/g,'&quot;')}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website"><meta property="og:site_name" content="AfroTools">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${schema1}<\/script>
<script type="application/ld+json">${schema2}<\/script>
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/tokens.min.css?v=6977389f"><link rel="stylesheet" href="/assets/css/multi-country.css?v=1">
<link rel="stylesheet" href="/assets/css/global.min.css?v=1eef2cf2"><link rel="stylesheet" href="/assets/css/legal.css?v=af6e9e60">
<script src="/assets/js/components/navbar.min.js?v=43e4d9b2" defer><\/script><script src="/assets/js/components/footer.min.js?v=0f040e13" defer><\/script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}</style>
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>
<afro-navbar theme="dark" active="legal"></afro-navbar>
<section class="leg-tool-hero"><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>\u203A</span> <a href="/legal/">Legal & Compliance</a> <span>\u203A</span> <a href="/tools/business-license/">Business License Requirements</a> <span>\u203A</span> ${c.name}</nav>
<h1>${c.flag} ${c.name} <em>Business Licenses & Permits</em></h1>
<p class="leg-tool-hero-sub">Complete directory of business licenses and permits required in ${c.name}. Select your industry to see requirements, costs, and authorities.</p>
<div class="leg-badges"><span class="leg-badge">${c.flag} ${c.name}</span><span class="leg-badge">\u{1F3ED} 12 Industries</span><span class="leg-badge">\u{1F4CB} ${totalLic}+ Licenses</span></div>
</div></section>
<main class="leg-main" id="main-content" role="main">
<div class="leg-card"><div class="leg-card-head"><span>\u{1F3ED}</span><h2>Select Your Industry</h2></div>
<div class="leg-card-body" id="licTabs"></div></div>

<div id="licCards"><p style="color:#94a3b8;text-align:center;padding:2rem">Loading...</p></div>

<section class="leg-seo" style="margin-top:2rem">
<h2>Business Licenses & Permits in ${c.name} \u2014 Complete Guide</h2>
<p>${seo1}</p>
<p>${seo2}</p>
<div class="leg-disclaimer" style="margin-top:1rem"><strong>\u26A0\uFE0F Disclaimer</strong> License requirements change. Additional state/municipal permits may apply. Always verify with the relevant authority before starting operations.</div>
</section>
</main>
<afro-footer></afro-footer>
<script src="/data/legal/business-license-data.js?v=1"><\/script>
<script src="/engines/business-license-engine.js?v=1"><\/script>
<script>
!function(){"use strict";
var CC='${cc}';
var E=window.AfroTools.BusinessLicenseEngine;
if(E)E.initPage(CC);
}();
<\/script>
</body>
</html>`;

  fs.writeFileSync('tools/business-license/'+c.slug+'.html', html);
  count++;
}
console.log('Created '+count+' Business License country pages');
