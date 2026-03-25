'use strict';
const fs = require('fs');

const pages = [
  {
    file: 'agriculture/crop-yield/index.html',
    faq: [
      { q: 'How accurate are the yield estimates?', a: 'Estimates are based on national average yields from FAOSTAT adjusted by research-backed multipliers for region, soil, irrigation, fertilizer, and seed type. They provide a reasonable range but actual yields depend on many factors including weather, pests, and management practices.' },
      { q: 'What crops are covered?', a: 'Over 40 crop types are covered, including cereals (maize, rice, sorghum, millet, wheat, teff), roots and tubers (cassava, yam, sweet potato), legumes (cowpea, groundnut, soybean), cash crops (cocoa, coffee, tea, cotton), fruits, and vegetables.' },
      { q: 'Where does the data come from?', a: 'Primary sources include FAOSTAT (FAO), HarvestStat Africa, World Bank, national statistics bureaus, and CGIAR research centers. Yield data uses 3-5 year averages to smooth out weather variability.' },
      { q: 'Can I use this for farm planning?', a: 'Yes. The tool is designed to help with pre-season planning, input budgeting, and revenue forecasting. Consult your local agricultural extension office for specific advice on your farm conditions.' }
    ],
    breadcrumb: [
      { name: 'AfroTools', url: 'https://afrotools.com/' },
      { name: 'Agriculture', url: 'https://afrotools.com/agriculture/' },
      { name: 'Crop Yield Estimators', url: 'https://afrotools.com/agriculture/crop-yield/' }
    ]
  },
  {
    file: 'agriculture/fertilizer/index.html',
    faq: [
      { q: 'What is NPK and why does it matter?', a: 'NPK stands for Nitrogen (N), Phosphorus (P), and Potassium (K) - the three primary nutrients plants need. Nitrogen promotes leafy growth, phosphorus supports roots and flowering, and potassium strengthens overall plant health.' },
      { q: 'Do I need a soil test?', a: 'A soil test is recommended but not required. Without one, the calculator uses standard estimates for your region. With soil test results, recommendations become much more precise, potentially saving you money on fertilizer you do not need.' },
      { q: 'Are fertilizer subsidies included?', a: 'Yes. For countries with active fertilizer subsidy programs, the calculator shows both market prices and subsidized prices, along with program details and eligibility requirements.' }
    ],
    breadcrumb: [
      { name: 'AfroTools', url: 'https://afrotools.com/' },
      { name: 'Agriculture', url: 'https://afrotools.com/agriculture/' },
      { name: 'Fertilizer Calculators', url: 'https://afrotools.com/agriculture/fertilizer/' }
    ]
  },
  {
    file: 'agriculture/seed-rate/index.html',
    faq: [
      { q: 'What is a seed rate?', a: 'Seed rate is the quantity of seed (in kg per hectare) needed to achieve a target plant population. It accounts for seed weight, germination rate, and expected field establishment losses due to pests, poor soil contact, or weather.' },
      { q: 'Why does seed quality matter?', a: 'Certified seed (90% germination) produces more plants per kg than old or farm-saved seed (50-68% germination). Poor-quality seed means you need more seed per hectare to achieve the same plant stand.' },
      { q: 'What is the field establishment factor?', a: 'Even seeds that germinate may fail to establish due to birds, soil crust, pests, or drought. The field establishment factor (50-90%) accounts for these losses. In harsh conditions, you need more seed to achieve your target plant stand.' },
      { q: 'How are vegetative crops handled?', a: 'Crops like cassava, yam, sweet potato, potato, banana, and sugar cane are propagated from cuttings, tubers, suckers, or setts - not seeds. The calculator shows the number of planting units needed and the total weight of seed material required.' }
    ],
    breadcrumb: [
      { name: 'AfroTools', url: 'https://afrotools.com/' },
      { name: 'Agriculture', url: 'https://afrotools.com/agriculture/' },
      { name: 'Seed Rate Calculators', url: 'https://afrotools.com/agriculture/seed-rate/' }
    ]
  },
  {
    file: 'agriculture/irrigation/index.html',
    faq: [
      { q: 'How accurate are the irrigation estimates?', a: 'Estimates use FAO-standard methods with region-specific climate data. They provide a good planning baseline, but actual water needs depend on local soil conditions, weather variability, and management practices.' },
      { q: 'What irrigation methods are compared?', a: 'The calculator compares flood (40% efficient), furrow (55%), bucket/manual (60%), sprinkler (75%), and drip irrigation (90%). Efficiency represents the percentage of applied water that actually reaches crop roots.' },
      { q: 'What is the FAO Penman-Monteith method?', a: 'It is the international standard for estimating crop water requirements. Reference evapotranspiration (ETo) measures baseline water loss from a reference grass surface. Multiplying ETo by a crop-specific coefficient (Kc) gives the actual crop water demand (ETc) at each growth stage.' },
      { q: 'Can I use this for rainfed farming?', a: 'Yes. Even for rainfed agriculture, the calculator shows how much water crops need versus what rainfall provides. This helps identify water deficit months, plan supplemental irrigation, and choose optimal planting dates.' }
    ],
    breadcrumb: [
      { name: 'AfroTools', url: 'https://afrotools.com/' },
      { name: 'Agriculture', url: 'https://afrotools.com/agriculture/' },
      { name: 'Irrigation Calculators', url: 'https://afrotools.com/agriculture/irrigation/' }
    ]
  },
  {
    file: 'agriculture/farm-profit/index.html',
    faq: [
      { q: 'What costs does the calculator include?', a: 'Seeds, fertilizer, herbicides/pesticides/fungicides, labor (hired and family), land (rent or opportunity cost), mechanization (tractor hire or animal traction), irrigation, transport to market, market fees, middleman commission, storage, loan interest, and crop insurance.' },
      { q: 'What is post-harvest loss and why does it matter?', a: 'Post-harvest losses occur between harvest and sale - from spoilage, pests, improper storage, and handling. In Africa, these losses average 20-40% for roots and vegetables, and 15-25% for cereals.' },
      { q: 'Can I see what-if scenarios?', a: 'Yes. After calculating, you can see the impact of increasing yield by 25%, raising your selling price by 20%, halving post-harvest losses, switching to 100% family labor, and processing your crop before selling.' },
      { q: 'How is family labor valued?', a: 'Family labor is valued at 50% of the hired labor daily wage rate, representing the opportunity cost. It is counted as a real cost because it is a real economic sacrifice, even if no cash changes hands.' },
      { q: 'What data sources are used?', a: 'Labor wage rates from ILO and national labor ministries. Land rental rates from country agricultural surveys. Post-harvest loss rates from APHLIS (African Postharvest Losses Information System). Market prices from FAO GIEWS and national commodity boards.' }
    ],
    breadcrumb: [
      { name: 'AfroTools', url: 'https://afrotools.com/' },
      { name: 'Agriculture', url: 'https://afrotools.com/agriculture/' },
      { name: 'Farm Profit/Loss Calculator', url: 'https://afrotools.com/agriculture/farm-profit/' }
    ]
  }
];

let updated = 0;

for (var i = 0; i < pages.length; i++) {
  var page = pages[i];
  var html = fs.readFileSync(page.file, 'utf8');

  // 1. Upgrade WebPage -> CollectionPage in first ld+json block
  html = html.replace(
    /(<script type="application\/ld\+json">[\s\S]*?"@type":\s*"WebPage"[\s\S]*?<\/script>)/,
    function(match) { return match.replace(/"@type":\s*"WebPage"/, '"@type": "CollectionPage"'); }
  );

  // 2. FAQ schema
  var faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": page.faq.map(function(f) {
      return { "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } };
    })
  };

  // 3. Breadcrumb schema
  var breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": page.breadcrumb.map(function(b, idx) {
      return { "@type": "ListItem", "position": idx + 1, "name": b.name, "item": b.url };
    })
  };

  var newSchemas = '\n<script type="application/ld+json">\n' + JSON.stringify(faqSchema, null, 2) + '\n</script>\n<script type="application/ld+json">\n' + JSON.stringify(breadcrumbSchema, null, 2) + '\n</script>';

  if (html.indexOf('"@type": "FAQPage"') === -1) {
    html = html.replace('</head>', newSchemas + '\n</head>');
  }

  fs.writeFileSync(page.file, html, 'utf8');
  console.log('Updated: ' + page.file);
  updated++;
}

console.log('Done. Updated ' + updated + ' pages.');
