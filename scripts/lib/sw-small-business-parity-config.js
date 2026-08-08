"use strict";

// The field shapes and default numeric fixtures are inherited from the maintained
// locale-neutral SME engine contract. Every user-facing string is replaced below
// with a reviewed Kiswahili owner; a missing translation fails the build closed.
const { routes: semanticRoutes } = require("./fr-small-business-parity-config");

const metadata = {
  "startup-runway": ["startup-runway", "Kikokotoo cha muda wa fedha za startup", "Kokotoa matumizi halisi ya fedha, muda wa fedha uliobaki na pengo la kila mwezi kwa makisio uliyoingiza."],
  "tam-sam-som": ["tam-sam-som", "Kikokotoo cha TAM, SAM na SOM", "Pima ukubwa wa soko kwa sehemu, wateja, mapato ya kila mteja na makisio yaliyo wazi."],
  "unit-economics": ["unit-economics", "Kikokotoo cha unit economics", "Pima mchango kwa kila bidhaa, kiwango cha kutofanya hasara, faida ya mwezi na uwiano wa LTV kwa CAC."],
  "churn-rate": ["kikokotoo-churn-rate", "Kikokotoo cha churn rate", "Linganisha wateja waliopotea, churn ya mapato na retention halisi ndani ya kipindi kimoja."],
  "burn-rate": ["kikokotoo-burn-rate", "Kikokotoo cha kiwango cha matumizi", "Kokotoa matumizi ghafi, matumizi halisi na muda wa fedha kutoka mtiririko uliyoingiza."],
  "cash-flow-forecast": ["makisio-mtiririko-wa-fedha", "Makisio ya mtiririko wa fedha wa miezi 12", "Kadiria mapato, gharama zinazobadilika, gharama za kudumu, akiba ya kodi na salio la kila mwezi."],
  "pos-agent": ["faida-ya-wakala-pos", "Faida ya wakala wa POS", "Kadiria kamisheni, gharama za uendeshaji, faida na muda wa kurudisha mtaji wa wakala wa POS."],
  "mini-importation": ["faida-ya-mini-importation", "Kikokotoo cha faida ya mini-importation", "Kokotoa gharama iliyofika, ushuru, faida na ROI kwa quotation na kiwango cha FX ulichohakiki."],
  "mama-put": ["faida-ya-mama-put", "Faida ya biashara ya chakula cha mtaani", "Jaribu bei, sehemu, viungo, gharama za siku na faida ya mwezi ya chakula unachouza."],
  "marketplace-fees": ["ada-soko-mtandaoni", "Kilinganisha ada za marketplace", "Linganisha mapato halisi baada ya kamisheni, ada tambarare, matangazo, usafirishaji na makato mengine."],
  "brand-collab-roi": ["roi-ya-brand-collab", "ROI ya ushirikiano wa chapa", "Linganisha bajeti, mapato yanayohusishwa, margin, impressions na conversions bila kudai uhusiano wa moja kwa moja."],
  "business-continuity": ["mwendelezo-wa-biashara", "Mpango wa mwendelezo wa biashara", "Tengeneza rasimu ya ndani yenye RTO, RPO, vitisho na hatua za kuthibitisha."],
  "event-decoration-cost": ["gharama-ya-mapambo-ya-tukio", "Bajeti ya mapambo ya tukio", "Jumlisha idadi, bei za kila kipengele, kazi, usafiri na akiba ya dharura ya mapambo."],
  "factory-setup-cost": ["gharama-ya-kuanzisha-kiwanda", "Gharama ya kuanzisha kiwanda", "Jenga makisio ya CAPEX kwa eneo, ujenzi, mashine, huduma na mtaji wa uendeshaji."],
  "fashion-brand-startup": ["kuanzisha-chapa-ya-mitindo", "Gharama ya kuanzisha chapa ya mitindo", "Kadiria mkusanyiko, akiba ya kwanza, gharama za chapa, mchango na kiwango cha kurudisha mtaji."],
  "freelance-contract": ["mkataba-wa-freelance", "Jenereta ya mkataba wa freelance", "Andaa rasimu ya ndani yenye wahusika, kazi, ratiba, malipo na umiliki wa kazi."],
  "freelancer-rate": ["viwango-vya-freelancer", "Kikokotoo cha bei ya freelancer", "Geuza lengo la mapato, gharama, akiba na siku za kulipisha kuwa bei ya mwezi, siku na saa."],
  "graphic-design-pricing": ["bei-ya-ubunifu-wa-picha", "Bei ya kazi ya graphic design", "Jenga quotation kwa saa, kiwango cha chini, gharama na akiba ya mabadiliko ya scope."],
  "guard-service-cost": ["gharama-ya-huduma-ya-ulinzi", "Kilinganisha gharama ya huduma ya ulinzi", "Linganisha quotation ya kampuni na kuajiri moja kwa moja huku ukiorodhesha ukaguzi wa kufuata sheria."],
  "influencer-rate": ["bei-za-influencer", "Jenereta ya bei ya influencer", "Jenga rate card kwa muda, uzalishaji, haki za matumizi na exclusivity uliyoingiza."],
  "made-in-africa-label": ["ukaguzi-wa-lebo-made-in-africa", "Ukaguzi wa maandalizi ya lebo Made in Africa", "Andaa ushahidi wa asili kwa nchi, HS code, kanuni iliyotajwa na sehemu ya malighafi bila kutoa uamuzi rasmi."],
  "nafdac-registration": ["usajili-wa-bidhaa", "Bajeti ya usajili wa bidhaa", "Jumlisha ada rasmi yenye tarehe, vipimo, ukaguzi, lebo na ushauri bila kutabiri idhini."],
  "oee-calculator": ["kikokotoo-oee", "Kikokotoo cha OEE", "Kokotoa availability, performance, quality na OEE kwa kipindi cha uzalishaji kilichodhibitiwa."],
  "packaging-cost": ["gharama-ya-ufungashaji", "Kikokotoo cha gharama ya ufungashaji", "Kokotoa gharama kamili kwa kila bidhaa kutoka quotation yenye tarehe, carton, freight, vifaa na upotevu."],
  "production-cost": ["gharama-ya-uzalishaji", "Kikokotoo cha gharama ya uzalishaji", "Kokotoa COGM, gharama kwa bidhaa nzuri, margin na faida kwa wigo wa uzalishaji uliyoingiza."],
  "quality-sampling": ["sampuli-ya-ubora", "Ukaguzi wa sampuli ya ubora", "Linganisha kasoro ulizoona na mipaka ya Ac/Re ya mpango wa sampuli wenye rejea na tarehe."],
  "tailoring-pricing": ["bei-ya-ushonaji", "Kikokotoo cha quotation ya ushonaji", "Jenga quotation kwa muda, vifaa, gharama, akiba ya scope, markup na ada ya haraka."],
  "youtube-revenue": ["mapato-ya-youtube", "Ulinganisho wa mapato ya YouTube", "Linganisha ushahidi wa Analytics, RPM, mapato mengine, gharama na akiba bila kubuni kiwango cha jukwaa."]
};

const formulas = {
  "startup-runway":"Matumizi halisi = gharama za mwezi - mapato ya mwezi; muda wa fedha = fedha zilizopo / matumizi halisi.",
  "tam-sam-som":"TAM = wateja × ARPU; SAM = TAM × asilimia inayofikiwa; SOM = SAM × sehemu inayolengwa.",
  "unit-economics":"Bei halisi = bei × (1 - refund%); mchango = bei halisi - gharama zinazobadilika; break-even = gharama za kudumu / mchango.",
  "churn-rate":"Churn ya wateja = waliopotea / wateja wa mwanzo; NRR = (MRR ya mwanzo - churn - contraction + expansion) / MRR ya mwanzo.",
  "burn-rate":"Matumizi halisi = gharama za mwezi - mapato ya mwezi; runway hutumia salio lililopo na matumizi halisi chanya.",
  "cash-flow-forecast":"Kila mwezi: mapato hukua kwa kiwango ulichoingiza; salio la kufunga = salio la kufungua + mapato - gharama - akiba ya kodi.",
  "pos-agent":"Mapato = kamisheni kwa muamala × miamala iliyokamilika × siku; faida = mapato - gharama za mwezi.",
  "mini-importation":"Landed cost = bidhaa kwa FX + usafiri + ushuru + clearing + gharama nyingine; ROI = faida / landed cost.",
  "mama-put":"Faida ya siku = bei × sehemu - viungo × sehemu - gharama za siku; break-even hutumia mchango kwa sehemu.",
  "marketplace-fees":"Mapato halisi = bei - (kamisheni ya asilimia + ada tambarare + usafiri + matangazo + makato mengine).",
  "brand-collab-roi":"Gross profit = mapato yanayohusishwa × margin; ROI = (gross profit - bajeti) / bajeti.",
  "business-continuity":"Rasimu hupanga RTO, RPO na vitisho ulivyoingiza; haitoi tathmini ya hatari kiotomatiki.",
  "event-decoration-cost":"Jumla ndogo = idadi × bei za vipengele + kazi + usafiri; jumla = jumla ndogo × (1 + contingency%).",
  "factory-setup-cost":"CAPEX = ardhi + jengo + mashine + huduma + vibali + mtaji wa uendeshaji; contingency huongezwa juu yake.",
  "fashion-brand-startup":"Gharama kwa bidhaa = kitambaa + kazi + vifaa + ufungashaji; break-even = gharama za setup / mchango kwa bidhaa.",
  "freelance-contract":"Rasimu huunganisha masharti uliyoingiza bila kubuni kifungu au uamuzi wa kisheria.",
  "freelancer-rate":"Malipo yanayohitajika = (lengo la mapato + overhead) / (1 - reserve%); bei ya siku na saa hugawanywa kwa muda wa kulipisha.",
  "graphic-design-pricing":"Quotation = saa × kiwango cha chini + gharama + scope buffer.",
  "guard-service-cost":"Kampuni = quotation kwa mlinzi × walinzi + gharama nyingine; direct = (mshahara + on-cost) × walinzi + gharama nyingine.",
  "influencer-rate":"Quotation = saa × kiwango cha chini + uzalishaji + haki za matumizi + exclusivity.",
  "made-in-africa-label":"Asilimia ya asili = (ex-works - malighafi zisizo za asili) / ex-works; matokeo ni maandalizi, si uamuzi rasmi.",
  "nafdac-registration":"Bajeti = maombi × ada rasmi + vipimo + ukaguzi + lebo + ushauri + gharama nyingine.",
  "oee-calculator":"OEE = availability × performance × quality; kila kipengele hutokana na muda na bidhaa ulizoingiza.",
  "packaging-cost":"Gharama kwa bidhaa = primary + print + closure + mgao wa carton/freight/setup + gharama ya upotevu.",
  "production-cost":"COGM = malighafi + ufungashaji + kazi + nishati + overhead + depreciation; gharama nzuri = COGM / bidhaa nzuri.",
  "quality-sampling":"Kasoro hulinganishwa na Ac na Re za mpango ulioweka; hakuna mpango rasmi unaobuniwa na zana.",
  "tailoring-pricing":"Cost floor = kazi + vifaa + overhead + scope buffer; quotation huongeza markup na rush fee.",
  "youtube-revenue":"Mapato ya YouTube = views / 1,000 × RPM uliyoingiza; tofauti hulinganisha ushahidi uliorekodiwa na makisio hayo."
};

const labels = {
  currency:"Sarafu",cashBalance:"Fedha zilizopo",monthlyRevenue:"Mapato ya kila mwezi",monthlyCosts:"Gharama za fedha za kila mwezi",segment:"Sehemu ya soko",customers:"Wateja wanaoweza kufikiwa",arpu:"Mapato ya mwaka kwa kila mteja",accessiblePct:"Sehemu inayoweza kufikiwa (%)",sharePct:"Sehemu ya soko inayolengwa (%)",growthPct:"Ukuaji wa mwaka (%)",price:"Bei ya kuuza kwa kila bidhaa",variableCost:"Gharama kuu inayobadilika",otherVariableCost:"Gharama nyingine zinazobadilika",fixedCosts:"Gharama za kudumu za mwezi",units:"Bidhaa zinazouzwa kwa mwezi",refundPct:"Kiwango cha kurejesha fedha (%)",cac:"Gharama ya kupata mteja (CAC)",lifetimeUnits:"Bidhaa kwa maisha ya mteja",method:"Njia ya kuhesabu wateja waliopotea",customersStart:"Wateja mwanzoni",customersAdded:"Wateja wapya",customersEnd:"Wateja mwishoni",customersChurned:"Wateja waliopotea (moja kwa moja)",mrrStart:"Mapato yanayojirudia mwanzoni",mrrChurned:"Mapato yaliyopotea",mrrContraction:"Upungufu wa mapato",mrrExpansion:"Ongezeko la mapato",openingBalance:"Salio la kuanzia",month1Revenue:"Mapato ya mwezi wa 1",monthlyGrowthPct:"Ukuaji wa mwezi (%)",cogsPct:"Gharama zinazobadilika (%)",fixedMonthly:"Gharama za kudumu za mwezi",taxRatePct:"Akiba ya kodi (%)",oneTimeCost:"Gharama ya mara moja mwezi wa 1",provider:"Mtoa huduma au mtandao",dailyTransactions:"Miamala kwa siku",averageTransaction:"Thamani ya wastani ya muamala",failurePct:"Miamala iliyoshindikana au kufutwa (%)",operatingDays:"Siku za kazi kwa mwezi",commissionPct:"Kamisheni (%)",commissionCap:"Kikomo cha kamisheni kwa muamala",deviceCost:"Gharama ya kifaa",floatCapital:"Mtaji wa float",monthlyRent:"Kodi ya mwezi",otherMonthlyCosts:"Gharama nyingine za mwezi",product:"Bidhaa",supplierPriceUsd:"Bei ya msambazaji kwa bidhaa (USD)",fxRate:"Kiwango cha FX kilichotekelezwa",shipping:"Usafirishaji kwa sarafu ya eneo",dutyPct:"Ushuru wa forodha (%)",otherCharges:"Gharama nyingine za uagizaji",clearingFee:"Ada ya clearing",sellingPrice:"Bei ya kuuza kwa bidhaa",dish:"Chakula",dishPrice:"Bei kwa sehemu",portions:"Sehemu zinazouzwa kwa siku",ingredientCost:"Viungo kwa sehemu",rent:"Kodi iliyogawiwa",staff:"Wafanyakazi kwa siku",utilities:"Nishati na maji",otherCosts:"Gharama nyingine",workingDays:"Siku za kazi kwa mwezi",marketplace:"Marketplace",salePrice:"Bei ya kuuza",feePct:"Kamisheni (%)",fixedFee:"Ada tambarare",ads:"Matangazo kwa mauzo",otherFees:"Makato mengine",campaign:"Kampeni",budget:"Bajeti",impressions:"Impressions zinazohusishwa",revenue:"Mapato yanayohusishwa",grossMarginPct:"Gross margin (%)",conversions:"Conversions zinazohusishwa",businessName:"Jina la biashara",country:"Nchi",sector:"Sekta",staffBand:"Idadi ya wafanyakazi",rto:"RTO",rpo:"RPO",threats:"Vitisho, kimoja kwa kila mstari",guests:"Wageni wanaotarajiwa",balloonArches:"Tao za puto",balloonUnitCost:"Gharama kwa tao",floral:"Mapambo ya maua",floralUnitCost:"Gharama kwa pambo la maua",centerpieces:"Mapambo ya mezani",centerpieceUnitCost:"Gharama kwa pambo la mezani",draping:"Vitambaa vya mapambo",lighting:"Mwangaza",signage:"Ishara na mandhari",chairs:"Vifuniko vya viti",chairUnitCost:"Gharama kwa kiti",setupLabour:"Ufungaji na kazi",transport:"Usafiri",contingencyPct:"Akiba ya dharura (%)",area:"Eneo (m²)",land:"Ardhi na eneo",building:"Jengo au marekebisho",machinery:"Mashine",permits:"Vibali na ada za kitaalamu",monthlyOperatingCash:"Fedha za uendeshaji kwa mwezi",workingCapitalMonths:"Miezi ya mtaji wa uendeshaji",pieces:"Bidhaa za mkusanyiko wa kwanza",retailPrice:"Bei ya rejareja kwa bidhaa",monthlyUnits:"Bidhaa zinazouzwa kwa mwezi",fabricCost:"Kitambaa kwa bidhaa",labourCost:"Kazi kwa bidhaa",notionsCost:"Vifaa vidogo kwa bidhaa",packagingCost:"Ufungashaji kwa bidhaa",brandingCost:"Utambulisho wa chapa",websiteCost:"Tovuti",photoCost:"Picha",showCost:"Uzinduzi",marketingCost:"Masoko ya mwanzo",equipmentCost:"Vifaa",freelancerName:"Jina la freelancer",clientName:"Mteja",clientContact:"Mwakilishi wa mteja",projectTitle:"Mradi",projectDescription:"Maelezo ya mradi",deliverables:"Kazi zitakazokabidhiwa",startDate:"Tarehe ya kuanza",deliveryDate:"Tarehe ya kukabidhi",totalFee:"Ada yote",paymentSchedule:"Ratiba ya malipo",revisions:"Mizunguko ya marekebisho",ipOwner:"Umiliki wa kazi",jurisdiction:"Sheria inayokusudiwa",income:"Lengo la mapato halisi ya mwezi",overhead:"Gharama za mwezi",reservePct:"Akiba (%)",billableDays:"Siku za kulipisha",hoursPerDay:"Saa kwa siku",projectType:"Aina ya mradi",experience:"Kiwango cha uzoefu",concepts:"Dhana",timeline:"Muda wa kukamilisha",license:"Haki za matumizi",hours:"Saa zinazokadiriwa",hourlyFloor:"Kiwango cha chini kwa saa",expenses:"Gharama za mradi",scopeBufferPct:"Akiba ya scope (%)",propertyType:"Aina ya eneo",coverage:"Muda wa ulinzi",posts:"Vituo vya ulinzi",guardsPerPost:"Walinzi kwa kituo",guardType:"Aina ya mlinzi",companyQuote:"Quotation ya kampuni kwa mlinzi",directWage:"Mshahara wa moja kwa moja kwa mlinzi",directOncost:"Gharama za mwajiri na zamu kwa mlinzi",platform:"Jukwaa",followers:"Followers waliorekodiwa",engagementPct:"Engagement iliyorekodiwa (%)",niche:"Niche",production:"Gharama za uzalishaji",usageRights:"Haki za matumizi",exclusivity:"Exclusivity",dealsPerMonth:"Ushirikiano kwa mwezi",originCountry:"Nchi ya uzalishaji",destinationCountry:"Nchi ya mwisho",hsCode:"HS code kamili",ruleReference:"Rejea ya kanuni ya bidhaa",ruleDate:"Tarehe ya uhakiki",exWorks:"Bei ya ex-works",nonOriginating:"Malighafi zisizo za asili",criterion:"Kigezo kinachokusudiwa",evidence:"Ushahidi uliopo",category:"Kategoria",origin:"Asili",applications:"Idadi ya maombi",officialFee:"Ada rasmi kwa ombi",source:"Rejea ya chanzo",sourceDate:"Tarehe ya kuangalia chanzo",testing:"Vipimo",facility:"Ukaguzi wa eneo",labels:"Lebo",adviser:"Ushauri",other:"Gharama nyingine",scheduledMinutes:"Dakika zilizopangwa",excludedMinutes:"Dakika za kusimama zilizotengwa",downtimeMinutes:"Dakika za kusimama bila mpango",idealCycleSeconds:"Mzunguko bora (sekunde)",producedUnits:"Bidhaa zilizozalishwa",rejectUnits:"Bidhaa zilizokataliwa",contributionPerUnit:"Mchango kwa bidhaa (hiari)",packagingType:"Aina ya ufungashaji",size:"Vipimo",volume:"Kiasi cha mwezi",primaryUnit:"Ufungashaji mkuu kwa bidhaa",printUnit:"Uchapishaji kwa bidhaa",closureUnit:"Kifungio kwa bidhaa",cartonQuote:"Bei ya carton",unitsPerCarton:"Bidhaa kwa carton",freight:"Freight ya mzigo",setup:"Vifaa au plates",setupAllocationUnits:"Bidhaa za kugawia gharama ya setup",wastePct:"Upotevu (%)",unitsPerMonth:"Bidhaa kwa mwezi",rawMaterials:"Malighafi",packaging:"Ufungashaji",labour:"Kazi ya moja kwa moja",energy:"Nishati",depreciation:"Depreciation",lotSize:"Ukubwa wa lot",planReference:"Rejea ya mpango",planDate:"Tarehe ya mpango",sampleSize:"Ukubwa wa sampuli",acceptNumber:"Kikomo cha kukubali Ac",rejectNumber:"Kikomo cha kukataa Re",defects:"Kasoro zilizoonekana",costPerUnit:"Gharama ya ukaguzi kwa bidhaa",garment:"Vazi",complexity:"Ugumu",labourRate:"Bei kwa saa",overheadCost:"Gharama zilizogawiwa",markupPct:"Markup (%)",rushFee:"Ada ya haraka",monthlyOrders:"Oda kwa mwezi (makisio)",period:"Kipindi",views:"Views zilizorekodiwa",analyticsRpm:"RPM ya Analytics uliyoingiza",recordedYoutube:"Mapato ya YouTube yaliyorekodiwa",sponsorship:"Udhamini",memberships:"Memberships",affiliate:"Affiliate",otherRevenue:"Mapato mengine",channelCosts:"Gharama za channel",checkedDate:"Tarehe ya uhakiki",evidenceReference:"Rejea ya ushahidi"
};

const optionLabels = {
  "Début + nouveaux − fin":"Mwanzo + wapya − mwisho","Saisie directe":"Ingiza moja kwa moja",
  "4 heures":"Saa 4","24 heures":"Saa 24","72 heures":"Saa 72","1 heure":"Saa 1",
  "Transformation suffisante":"Mabadiliko yanayotosha","Entièrement obtenu":"Imepatikana kabisa"
};

const textDefaults = {
  "tam-sam-som.segment":"SME za huduma","pos-agent.provider":"Mtandao ulioingizwa","mini-importation.product":"Bidhaa ya majaribio","mama-put.dish":"Chakula kikuu","marketplace-fees.marketplace":"Jukwaa A","brand-collab-roi.campaign":"Kampeni ya majaribio","business-continuity.businessName":"SME ya mfano","business-continuity.country":"Kenya","business-continuity.sector":"Huduma","business-continuity.staffBand":"11–50","business-continuity.threats":"Kukatika kwa umeme\nHitilafu ya mfumo","factory-setup-cost.sector":"Usindikaji wa chakula","freelance-contract.freelancerName":"Amina Juma","freelance-contract.businessName":"Studio Amina","freelance-contract.clientName":"Biashara ya Mfano","freelance-contract.clientContact":"Mwakilishi wa mteja","freelance-contract.projectTitle":"Utambulisho wa chapa","freelance-contract.projectDescription":"Kubuni utambulisho wa chapa.","freelance-contract.deliverables":"Nembo, mwongozo na faili chanzo","freelance-contract.paymentSchedule":"50% mwanzoni, 50% wakati wa kukabidhi","freelance-contract.ipOwner":"Uhamisho baada ya malipo kamili","freelance-contract.jurisdiction":"Thibitisha kwa sheria ya eneo","graphic-design-pricing.projectType":"Utambulisho wa chapa","graphic-design-pricing.experience":"Mzoefu","graphic-design-pricing.timeline":"Siku 14","graphic-design-pricing.license":"Matumizi ya kibiashara yaliyofafanuliwa","guard-service-cost.propertyType":"Eneo la biashara","guard-service-cost.coverage":"Saa 24","guard-service-cost.guardType":"Asiye na silaha","influencer-rate.platform":"Instagram","influencer-rate.niche":"Biashara","made-in-africa-label.originCountry":"Kenya","made-in-africa-label.destinationCountry":"Tanzania","made-in-africa-label.hsCode":"0000.00","made-in-africa-label.ruleReference":"Kanuni rasmi ya bidhaa iliyohakikiwa","made-in-africa-label.evidence":"Invoice ya malighafi\nRekodi ya uzalishaji","nafdac-registration.product":"Bidhaa ya mfano","nafdac-registration.category":"Chakula kilichofungashwa","nafdac-registration.origin":"Ndani","nafdac-registration.source":"Ratiba rasmi ya ada iliyohakikiwa","packaging-cost.product":"Bidhaa ya mfano","packaging-cost.packagingType":"Carton iliyochapishwa","packaging-cost.size":"Kubwa","packaging-cost.source":"Quotation ya msambazaji iliyohakikiwa","quality-sampling.planReference":"Mpango wa sampuli uliothibitishwa","tailoring-pricing.garment":"Vazi maalum","tailoring-pricing.complexity":"Kati","youtube-revenue.period":"Julai 2026","youtube-revenue.evidenceReference":"Export ya Analytics iliyohakikiwa"
};

function translateField(routeId, field) {
  const overrides = {
    "mini-importation.units":"Idadi ya bidhaa",
    "production-cost.units":"Bidhaa zilizoanzishwa",
    "mama-put.rent":"Kodi iliyogawiwa kwa siku",
    "factory-setup-cost.utilities":"Miundombinu ya huduma"
  };
  const label = overrides[`${routeId}.${field.name}`] || labels[field.name];
  if (!label) throw new Error(`${routeId}.${field.name}: missing Kiswahili field label`);
  const translated = { ...field, label };
  const defaultKey = `${routeId}.${field.name}`;
  if (Object.prototype.hasOwnProperty.call(textDefaults, defaultKey)) translated.value = textDefaults[defaultKey];
  if (field.options) {
    translated.options = field.options.map((option) => ({
      ...option,
      label: optionLabels[option.label] || option.label,
      value: optionLabels[option.value] || option.value
    }));
    if (optionLabels[translated.value]) translated.value = optionLabels[translated.value];
  }
  return translated;
}

const routes = semanticRoutes.map((route) => {
  const meta = metadata[route.id];
  if (!meta) throw new Error(`${route.id}: missing Kiswahili route metadata`);
  if (!formulas[route.id]) throw new Error(`${route.id}: missing Kiswahili formula trace`);
  return { ...route, slug: meta[0], title: meta[1], description: meta[2], formula: formulas[route.id], fields: route.fields.map((field) => translateField(route.id, field)) };
});

module.exports = { routes };
