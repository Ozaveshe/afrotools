const fs=require('fs');
const src=require('C:/Users/Oza/Downloads/afrotools-270-master-data.js');
const C=src.COUNTRIES;
const ER=src.ENTRY_REQUIREMENTS;
let count=0;

// Build origin options HTML (all 54 countries)
const ccKeys=Object.keys(C);

for(const cc of ccKeys){
  const c=C[cc];
  const entry=ER[cc]||{};
  const title=c.name+' Visa Requirements for African Travelers | AfroTools';
  const desc='Do you need a visa to visit '+c.name+'? Check visa requirements for all 53 African nationalities. Visa-free, visa-on-arrival, e-visa, and visa-required statuses.';
  const url='https://afrotools.com/tools/visa-checker/'+c.slug;

  // Build origin dropdown options (exclude self)
  let opts='<option value="">-- Select your nationality --</option>';
  for(const oc of ccKeys){
    if(oc===cc)continue;
    opts+='<option value="'+oc+'">'+C[oc].flag+' '+C[oc].name+'</option>';
  }

  const schema1=JSON.stringify({
    '@context':'https://schema.org','@type':'WebApplication',
    name:title,description:desc,url:url,
    applicationCategory:'TravelApplication',
    provider:{'@type':'Organization',name:'AfroTools',url:'https://afrotools.com'},
    offers:{'@type':'Offer',price:'0',priceCurrency:'USD'}
  });
  const schema2=JSON.stringify({
    '@context':'https://schema.org','@type':'BreadcrumbList',
    itemListElement:[
      {'@type':'ListItem',position:1,name:'Home',item:'https://afrotools.com/'},
      {'@type':'ListItem',position:2,name:'Government & Civic',item:'https://afrotools.com/government/'},
      {'@type':'ListItem',position:3,name:'Visa Requirement Checker',item:'https://afrotools.com/tools/visa-checker/'},
      {'@type':'ListItem',position:4,name:c.name,item:url}
    ]
  });

  const seo1='Planning to visit '+c.name+'? This page shows visa requirements for citizens of all 53 other African countries. '+
    c.name+' requires a valid passport with at least '+(entry.passportValidity||'6 months')+' validity. '+
    (entry.yellowFever||'Yellow fever certificate may be required')+'. '+
    'The official language'+(c.officialLanguages.length>1?'s are ':'  is ')+c.officialLanguages.join(', ')+' and the local currency is the '+c.currencyName+' ('+c.currencySymbol+').';

  const seo2=c.name+' is a member of '+(c.recs&&c.recs.length?c.recs.join(', '):'the African Union')+
    '. Citizens of member states of these regional economic communities may enjoy visa-free or facilitated entry. '+
    'Always check with the nearest '+c.name+' embassy or consulate for the most current visa requirements before traveling, as policies change frequently.';

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
<link rel="stylesheet" href="/assets/css/global.min.css?v=b8aa6b54">
<script src="/assets/js/components/navbar.min.js?v=cd2d4746" defer><\/script><script src="/assets/js/components/footer.min.js?v=f68d6568" defer><\/script>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'DM Sans',system-ui,sans-serif;background:#F8FAFD;color:#0f172a;-webkit-font-smoothing:antialiased}a{text-decoration:none;color:inherit}
.visa-hero{background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 50%,#1d4ed8 100%);color:#fff;padding:3rem 1.5rem 2.5rem}
.visa-hero .container{max-width:900px;margin:0 auto}
.visa-hero .breadcrumb{margin-bottom:1rem;font-size:.85rem;opacity:.8}.visa-hero .breadcrumb a{color:#fff;opacity:.8}.visa-hero .breadcrumb a:hover{opacity:1}
.visa-hero h1{font-size:clamp(1.6rem,4vw,2.2rem);font-weight:800;margin-bottom:.5rem}
.visa-hero p{font-size:1rem;opacity:.9;max-width:650px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin:1.5rem 0 0}
@media(max-width:768px){.stats{grid-template-columns:1fr}}
.stat{text-align:center;padding:.75rem;border-radius:10px;background:rgba(255,255,255,.1)}
.stat .val{font-size:1.5rem;font-weight:800}.stat .lbl{font-size:.72rem;text-transform:uppercase;letter-spacing:.04em;opacity:.8}
.stat.free .val{color:#4ade80}.stat.voa .val{color:#60a5fa}.stat.evisa .val{color:#fbbf24}.stat.req .val{color:#f87171}
.main{max-width:900px;margin:0 auto;padding:1.5rem}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:1.5rem;margin-bottom:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,.06)}
.card h2{font-size:1.1rem;font-weight:700;margin-bottom:1rem;color:#1e3a5f}
.sel{width:100%;padding:.65rem .75rem;border:1.5px solid #cbd5e1;border-radius:7px;font-size:.95rem;background:#f8fafc;font-family:inherit}
.sel:focus{outline:none;border-color:#1d4ed8;box-shadow:0 0 0 3px rgba(29,78,216,.15)}
.matrix-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.seo{max-width:800px;margin:2rem auto;padding:0 1.5rem}
.seo h2{font-size:1.3rem;font-weight:800;color:#1e3a5f;margin-bottom:1rem}
.seo p{color:#475569;margin-bottom:1rem;font-size:.95rem}
</style>
<meta name="twitter:image" content="https://afrotools.com/assets/img/og-default.png">
</head>
<body>
<a href="#main-content" class="skip-link">Skip to main content</a>
<afro-navbar theme="dark" active="government"></afro-navbar>
<section class="visa-hero"><div class="container">
<nav class="breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> <span>\u203A</span> <a href="/government/">Government & Civic</a> <span>\u203A</span> <a href="/tools/visa-checker/">Visa Checker</a> <span>\u203A</span> ${c.name}</nav>
<h1>${c.flag} ${c.name} Visa Requirements for African Travelers</h1>
<p>Check if you need a visa to visit ${c.name} from any of 53 other African countries.</p>
<div class="stats">
<div class="stat free"><div class="val" id="statFree">-</div><div class="lbl">Visa Free</div></div>
<div class="stat voa"><div class="val" id="statVoa">-</div><div class="lbl">Visa on Arrival</div></div>
<div class="stat evisa"><div class="val" id="statEvisa">-</div><div class="lbl">E-Visa</div></div>
<div class="stat req"><div class="val" id="statReq">-</div><div class="lbl">Visa Required</div></div>
</div>
</div></section>

<div class="main" id="main-content" role="main">
<div class="card"><h2>\u{1F50D} Check Your Nationality</h2>
<label for="originSelect" style="font-size:.85rem;font-weight:600;color:#475569;display:block;margin-bottom:.4rem">I am a citizen of...</label>
<select id="originSelect" class="sel">${opts}</select>
<div id="visaResult"></div>
</div>

<div class="card"><h2>\u{1F30D} Entry Requirements</h2>
<div id="entryInfo"></div>
</div>

<div class="card"><h2>\u{1F6A8} Emergency Numbers</h2>
<div id="emergencyInfo"></div>
</div>

<div class="card"><h2>\u{1F4CA} Full Visa Matrix — All 53 African Countries</h2>
<div class="matrix-wrap" id="visaMatrix"><p style="color:#94a3b8;text-align:center;padding:2rem">Loading...</p></div>
</div>

<div class="card"><h2>\u{2139}\uFE0F Useful Info</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;font-size:.88rem">
<div><strong>Capital:</strong> ${c.capital}</div>
<div><strong>Timezone:</strong> ${c.timezone}</div>
<div><strong>Languages:</strong> ${c.officialLanguages.join(', ')}</div>
<div><strong>Currency:</strong> ${c.currencyName} (${c.currencySymbol})</div>
<div><strong>Calling code:</strong> ${c.callingCode}</div>
<div><strong>Region:</strong> ${c.region}</div>
</div>
</div>
</div>

<section class="seo">
<h2>Traveling to ${c.name} \u2014 Visa Requirements for African Citizens</h2>
<p>${seo1}</p>
<p>${seo2}</p>
<p><strong>Disclaimer:</strong> Visa requirements change frequently. This tool provides general guidance based on publicly available data. Always verify with the relevant embassy or consulate before traveling.</p>
</section>
<afro-footer></afro-footer>
<script src="/data/travel/visa-matrix.js?v=1"><\/script>
<script src="/engines/visa-checker-engine.js?v=1"><\/script>
<script>
!function(){"use strict";
var DEST='${cc}';
var E=window.AfroTools.VisaCheckerEngine;
if(E)E.initPage(DEST);
}();
<\/script>
</body>
</html>`;

  fs.writeFileSync('tools/visa-checker/'+c.slug+'.html', html);
  count++;
}
console.log('Created '+count+' Visa Checker country pages');
