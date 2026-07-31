(function initSwTradeUtility(root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root && root.document) api.boot(root);
})(typeof globalThis !== "undefined" ? globalThis : this, function createSwTradeUtility() {
  "use strict";

  var COUNTRIES = ["Nigeria", "Kenya", "Ghana", "South Africa", "Tanzania", "Rwanda", "Uganda", "Ethiopia", "Egypt", "Senegal", "Morocco", "Mauritius"];
  var CUSTOMS = {
    nigeria:{name:"Nigeria",port:"Apapa Port, Lagos",min:15,typ:25,max:45,agent:.015,storage:50,inspection:300,handling:400,source:"https://customs.gov.ng/",tip:"Tumia wakala mwenye leseni ya Nigeria Customs Service. Hakiki vibali vya NAFDAC na SON kwa bidhaa zinazodhibitiwa na thibitisha taratibu za sasa kabla ya kusafirisha."},
    kenya:{name:"Kenya",port:"Mombasa Port",min:5,typ:10,max:20,agent:.012,storage:35,inspection:200,handling:250,source:"https://www.kra.go.ke/individual/importing",tip:"Wasilisha SAD kupitia mfumo wa KRA na uhakiki ukaguzi wa KEBS kwa bidhaa zinazodhibitiwa. Thibitisha free time na Kenya Ports Authority."},
    kenya_icd:{name:"Kenya",port:"Nairobi ICD",min:3,typ:6,max:12,agent:.012,storage:30,inspection:180,handling:200,source:"https://infotradekenya.go.ke/",tip:"Pre-arrival processing inaweza kupunguza storage. Hakiki muda wa reli na transfer kutoka Mombasa kwa maandishi."},
    southafrica:{name:"South Africa",port:"Durban / Cape Town",min:3,typ:7,max:15,agent:.01,storage:25,inspection:150,handling:200,source:"https://www.sars.gov.za/customs-and-excise/duties-and-taxes/",tip:"Tumia SARS Trade Partners Portal na uthibitishe kama importer registration au AEO inahitajika kwa shipment yako."},
    ghana:{name:"Ghana",port:"Tema Port",min:10,typ:18,max:35,agent:.015,storage:40,inspection:250,handling:300,source:"https://gra.gov.gh/customs/",tip:"Hakiki taratibu za GRA Customs, permit za Ghana.GOV na masharti maalumu ya magari, chakula au electronics."},
    ethiopia:{name:"Ethiopia",port:"Djibouti → Addis Ababa",min:14,typ:30,max:60,agent:.02,storage:60,inspection:400,handling:600,source:"https://www.ecc.gov.et/",tip:"Ongeza muda wa transit ya Djibouti na barabara au reli hadi Addis Ababa. Pata quote ya corridor kutoka freight forwarder mwenye uzoefu."},
    tanzania:{name:"Tanzania",port:"Dar es Salaam Port",min:5,typ:12,max:25,agent:.013,storage:38,inspection:220,handling:280,source:"https://www.tra.go.tz/",tip:"Hakiki pre-clearance, masharti ya TBS na permit za bidhaa na Tanzania Revenue Authority kabla ya shipment."},
    rwanda:{name:"Rwanda",port:"Kigali Dry Port",min:3,typ:6,max:10,agent:.01,storage:20,inspection:120,handling:150,source:"https://rwandatrade.rw/",tip:"Tumia Rwanda Trade Portal kuthibitisha nyaraka na taratibu za One Stop Border Post; jumuisha transit kutoka bandari ya bahari."},
    egypt:{name:"Egypt",port:"Port Said / Alexandria",min:5,typ:12,max:25,agent:.013,storage:35,inspection:200,handling:280,source:"https://www.nafeza.gov.eg/",tip:"Thibitisha ACID na pre-arrival data kwenye NAFEZA kabla ya kupakia bidhaa."},
    senegal:{name:"Senegal",port:"Dakar Port",min:7,typ:14,max:28,agent:.015,storage:40,inspection:220,handling:300,source:"https://www.douanes.sn/",tip:"Hakiki GAINDE/ORBUS, phytosanitary clearance kwa mazao na uthibitisho wa upendeleo wa ECOWAS kabla ya kutegemea makisio."}
  };
  var DOCUMENTS = {
    commercial:["Bill of Lading / Airway Bill","Commercial Invoice","Packing List","Certificate of Origin","Import Declaration Form","Customs Bond / Security"],
    personal:["Packing List","Personal Effects Declaration","Passport Copy","Proof of Residence Abroad","Import Permit (ikihitajika)"],
    vehicles:["Original Title / V5 Document","Bill of Lading","Commercial Invoice","Certificate of Origin","Import Declaration","Customs Bond","Road Worthiness Certificate"],
    food:["Bill of Lading","Commercial Invoice","Packing List","Certificate of Origin","Phytosanitary Certificate","Fumigation Certificate","Health Certificate","Import Permit"],
    pharma:["Bill of Lading","Commercial Invoice","Certificate of Analysis","Good Manufacturing Practice (GMP) Certificate","Import Permit","Product Registration Certificate"],
    electronics:["Bill of Lading","Commercial Invoice","Packing List","Certificate of Origin","Type Approval Certificate","Standards Certificate (KEBS/NAFDAC/SABS)"]
  };
  var PROFILES = [
    ["NG","Nigeria","Nigeria Data Protection Act 2023","Nigeria Data Protection Commission","https://ndpc.gov.ng/"],
    ["KE","Kenya","Data Protection Act 2019","Office of the Data Protection Commissioner","https://www.odpc.go.ke/"],
    ["GH","Ghana","Data Protection Act 2012 (Act 843)","Data Protection Commission","https://dataprotection.org.gh/"],
    ["ZA","South Africa","POPIA 2013","Information Regulator","https://inforegulator.org.za/"],
    ["RW","Rwanda","Law 058/2021","National Cyber Security Authority","https://cyber.gov.rw/"],
    ["MA","Morocco","Law 09-08","CNDP","https://www.cndp.ma/"],
    ["MU","Mauritius","Data Protection Act 2017","Data Protection Office","https://dataprotection.govmu.org/"],
    ["EG","Egypt","Law 151/2020","Personal Data Protection Centre","https://mcit.gov.eg/"],
    ["UG","Uganda","Data Protection and Privacy Act 2019","Personal Data Protection Office","https://www.pdpo.go.ug/"],
    ["TZ","Tanzania","Personal Data Protection Act 2022","Personal Data Protection Commission","https://www.pdpc.go.tz/"],
    ["SN","Senegal","Law 2008-12","Commission de Protection des Données Personnelles","https://www.cdp.sn/"],
    ["CI","Côte d’Ivoire","Law 2013-450","ARTCI","https://www.artci.ci/"],
    ["AO","Angola","Data Protection Law 22/11","Data Protection Agency","https://apd.ao/"],
    ["BW","Botswana","Data Protection Act 2018","Information and Data Protection Commission","https://www.gov.bw/"],
    ["ZM","Zambia","Data Protection Act 2021","Office of the Data Protection Commissioner","https://www.dataprotection.gov.zm/"],
    ["ZW","Zimbabwe","Cyber and Data Protection Act 2021","POTRAZ","https://www.potraz.gov.zw/"]
  ].map(function (row) { return {code:row[0],name:row[1],law:row[2],regulator:row[3],source:row[4]}; });

  var FIELD_MATRICES = {
    "proforma-invoice":["sellerName","sellerAddress","sellerCountry","sellerPhone","sellerEmail","sellerRegistration","sellerExportLicense","buyerName","buyerAddress","buyerCountry","buyerPhone","buyerEmail","buyerImportLicense","documentNumber","date","validUntil","incoterm","portOfLoading","portOfDischarge","originCountry","currency","paymentTerms","deliveryTime","packaging","inspection","shippingMarks","specialConditions","freight","insurance","items.description","items.hsCode","items.quantity","items.unit","items.unitPrice"],
    "packing-list":["shipperName","shipperAddress","shipperCountry","consigneeName","consigneeAddress","consigneeCountry","notifyName","notifyAddress","documentNumber","date","invoiceReference","vesselVoyage","portOfLoading","portOfDischarge","originCountry","packages.marks","packages.packageNumber","packages.type","packages.description","packages.quantity","packages.netKg","packages.grossKg","packages.lengthCm","packages.widthCm","packages.heightCm"],
    "bol-generator":["blType","documentNumber","bookingReference","shipperName","shipperAddress","shipperCountry","consigneeName","consigneeAddress","notifyName","notifyPhone","notifyAddress","vessel","voyage","portOfLoading","portOfDischarge","placeOfReceipt","placeOfDelivery","onBoardDate","freightMode","freightAmount","freightCurrency","originals","governingLaw","cargo.containerNumber","cargo.sealNumber","cargo.marks","cargo.packages","cargo.packageType","cargo.description","cargo.grossKg","cargo.cbm"],
    "customs-time":["country","goodsType","documentStatus","cargoValue"],
    "shipping-weight":["lengthCm","widthCm","heightCm","actualKg","shippingType"],
    "cross-border-data":["matter","country","targetDate","status","legalBasis","contract","riskAssessment","security","processors","retention","rights","incident","sensitive","children","largeScale","privateNotes"]
  };

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char];
    });
  }
  function options(values, selected) {
    return values.map(function (value) {
      var key = Array.isArray(value) ? value[0] : value;
      var label = Array.isArray(value) ? value[1] : value;
      return '<option value="' + esc(key) + '"' + (key === selected ? " selected" : "") + ">" + esc(label) + "</option>";
    }).join("");
  }
  function field(name, label, type, value, extra) {
    var attrs = extra || "";
    var control = type === "textarea"
      ? '<textarea name="' + name + '" ' + attrs + ">" + esc(value || "") + "</textarea>"
      : '<input name="' + name + '" type="' + type + '" value="' + esc(value || "") + '" ' + attrs + ">";
    return '<label class="swtu-field"><span>' + label + "</span>" + control + "</label>";
  }
  function select(name, label, values, selected, extra) {
    return '<label class="swtu-field"><span>' + label + '</span><select name="' + name + '" ' + (extra || "") + ">" + options(values, selected) + "</select></label>";
  }
  function section(title, content) {
    return '<fieldset class="swtu-section"><legend>' + title + '</legend><div class="swtu-grid">' + content + "</div></fieldset>";
  }
  function exportButtons(formats) {
    return formats.map(function (format) {
      return '<button type="button" data-export="' + format + '" disabled>' + (format === "pdf" ? "Pakua PDF" : "Pakua " + format.toUpperCase()) + "</button>";
    }).join("");
  }
  function rowTable(kind, headers, cells, count) {
    var rows = "";
    for (var index = 0; index < (count || 1); index += 1) rows += tableRow(kind, cells);
    return '<div class="swtu-table-wrap"><table class="swtu-table"><thead><tr>' +
      headers.map(function (header) { return "<th>" + header + "</th>"; }).join("") +
      '<th>Ondoa</th></tr></thead><tbody data-rows="' + kind + '">' + rows +
      '</tbody></table></div><button class="swtu-add" type="button" data-add-row="' + kind + '">Ongeza mstari</button>';
  }
  function tableRow(kind, cells) {
    return '<tr>' + cells.map(function (cell) {
      if (cell.type === "select") return '<td><select data-cell="' + cell.name + '" aria-label="' + esc(cell.label) + '">' + options(cell.values, cell.value) + "</select></td>";
      return '<td><input data-cell="' + cell.name + '" type="' + (cell.type || "text") + '" min="' + (cell.min == null ? "" : cell.min) + '" step="' + (cell.step || "any") + '" value="' + esc(cell.value || "") + '" aria-label="' + esc(cell.label) + '"></td>';
    }).join("") + '<td><button class="swtu-remove" type="button" data-remove-row aria-label="Ondoa mstari">Ondoa</button></td></tr>';
  }
  var ROWS = {
    items:[
      {name:"description",label:"Maelezo ya bidhaa"},{name:"hsCode",label:"HS code"},
      {name:"quantity",label:"Idadi",type:"number",min:0,value:1},{name:"unit",label:"Kipimo",type:"select",values:["pcs","kg","MT","CBM","Cartons"]},
      {name:"unitPrice",label:"Bei kwa kipimo",type:"number",min:0,value:0}
    ],
    packages:[
      {name:"marks",label:"Alama"},{name:"packageNumber",label:"Namba ya kifurushi"},
      {name:"type",label:"Aina",type:"select",values:["Carton","Crate","Pallet","Bag","Drum","Bundle"]},
      {name:"description",label:"Maelezo"},{name:"quantity",label:"Idadi",type:"number",min:0,value:1},
      {name:"netKg",label:"Net kg",type:"number",min:0,value:0},{name:"grossKg",label:"Gross kg",type:"number",min:0,value:0},
      {name:"lengthCm",label:"Urefu cm",type:"number",min:0,value:0},{name:"widthCm",label:"Upana cm",type:"number",min:0,value:0},
      {name:"heightCm",label:"Kimo cm",type:"number",min:0,value:0}
    ],
    cargo:[
      {name:"containerNumber",label:"Namba ya kontena"},{name:"sealNumber",label:"Seal"},
      {name:"marks",label:"Alama"},{name:"packages",label:"Vifurushi",type:"number",min:0,value:1},
      {name:"packageType",label:"Aina",type:"select",values:["x20GP","x40GP","x40HC","Cartons","Pallets","Bags"]},
      {name:"description",label:"Maelezo ya mzigo"},{name:"grossKg",label:"Gross kg",type:"number",min:0,value:0},
      {name:"cbm",label:"CBM",type:"number",min:0,value:0}
    ]
  };

  function formHtml(id) {
    var body = "";
    var formats = [];
    if (id === "proforma-invoice") {
      body = section("Muuzaji / exporter",
        field("sellerName","Jina la kampuni","text","", "required") + field("sellerAddress","Anwani","textarea","", "required") +
        select("sellerCountry","Nchi",COUNTRIES,"Nigeria") + field("sellerPhone","Simu","tel","") +
        field("sellerEmail","Barua pepe","email","") + field("sellerRegistration","Namba ya usajili","text","") +
        field("sellerExportLicense","Leseni ya export","text","")) +
        section("Mnunuzi / importer",
          field("buyerName","Jina la kampuni","text","", "required") + field("buyerAddress","Anwani","textarea","", "required") +
          select("buyerCountry","Nchi",COUNTRIES,"Kenya") + field("buyerPhone","Simu","tel","") +
          field("buyerEmail","Barua pepe","email","") + field("buyerImportLicense","Leseni ya import","text","")) +
        section("Masharti ya hati",
          field("documentNumber","Namba ya proforma","text","PI-2026-001","required") + field("date","Tarehe","date","2026-07-31","required") +
          field("validUntil","Halali hadi","date","2026-08-30","required") +
          select("incoterm","Incoterm",["EXW","FCA","FOB","CFR","CIF","CPT","CIP","DAP","DPU","DDP"],"CIF") +
          field("portOfLoading","Bandari ya kupakia","text","","required") + field("portOfDischarge","Bandari ya kushusha","text","","required") +
          select("originCountry","Nchi ya asili",COUNTRIES,"Nigeria") +
          select("currency","Sarafu",["USD","EUR","GBP","NGN","KES","GHS","ZAR","TZS","RWF","UGX"],"USD") +
          select("paymentTerms","Masharti ya malipo",["Letter of Credit","Advance payment","Documents against payment","Open account"],"Letter of Credit") +
          field("deliveryTime","Muda wa delivery","text","") + field("packaging","Ufungashaji","text","") +
          field("inspection","Ukaguzi","text","") + field("shippingMarks","Shipping marks","text","") +
          field("specialConditions","Masharti maalumu","textarea","")) +
        '<fieldset class="swtu-section"><legend>Bidhaa</legend>' +
        rowTable("items",["Bidhaa","HS code","Idadi","Kipimo","Bei"],ROWS.items,1) + "</fieldset>" +
        section("Gharama", field("freight","Freight","number","0",'min="0" step="0.01"') + field("insurance","Insurance","number","0",'min="0" step="0.01"'));
      formats = ["pdf","csv","json"];
    } else if (id === "packing-list") {
      body = section("Shipper / exporter",
        field("shipperName","Jina","text","","required") + field("shipperAddress","Anwani","textarea","", "required") + select("shipperCountry","Nchi",COUNTRIES,"Nigeria")) +
        section("Consignee na notify party",
          field("consigneeName","Consignee","text","","required") + field("consigneeAddress","Anwani ya consignee","textarea","", "required") +
          select("consigneeCountry","Nchi ya consignee",COUNTRIES,"South Africa") + field("notifyName","Notify party","text","") +
          field("notifyAddress","Anwani ya notify party","text","")) +
        section("Shipment",
          field("documentNumber","Namba ya packing list","text","PL-2026-001","required") + field("date","Tarehe","date","2026-07-31","required") +
          field("invoiceReference","Rejea ya invoice","text","") + field("vesselVoyage","Vessel / voyage","text","") +
          field("portOfLoading","Bandari ya kupakia","text","","required") + field("portOfDischarge","Bandari ya kushusha","text","","required") +
          select("originCountry","Nchi ya asili",COUNTRIES,"Nigeria")) +
        '<fieldset class="swtu-section"><legend>Vifurushi</legend>' +
        rowTable("packages",["Alama","Namba","Aina","Maelezo","Idadi","Net","Gross","L","W","H"],ROWS.packages,1) + "</fieldset>";
      formats = ["pdf","csv","json"];
    } else if (id === "bol-generator") {
      body = section("Aina na rejea",
        select("blType","Aina ya B/L",[["original","Original B/L"],["seawaybill","Sea Waybill"],["combined","Combined Transport B/L"],["multimodal","Multimodal B/L"],["straight","Straight B/L"],["order","Order B/L"]],"original") +
        field("documentNumber","Namba ya B/L","text","BL-2026-001","required") + field("bookingReference","Booking reference","text","")) +
        section("Wahusika",
          field("shipperName","Shipper","text","","required") + field("shipperAddress","Anwani ya shipper","textarea","", "required") +
          select("shipperCountry","Nchi ya shipper",COUNTRIES,"Nigeria") + field("consigneeName","Consignee / TO ORDER","text","","required") +
          field("consigneeAddress","Anwani ya consignee","textarea","") + field("notifyName","Notify party","text","") +
          field("notifyPhone","Simu ya notify party","tel","") + field("notifyAddress","Anwani ya notify party","text","")) +
        section("Safari",
          field("vessel","Vessel","text","") + field("voyage","Voyage","text","") +
          field("portOfLoading","Bandari ya kupakia","text","","required") + field("portOfDischarge","Bandari ya kushusha","text","","required") +
          field("placeOfReceipt","Mahali pa kupokea","text","") + field("placeOfDelivery","Mahali pa kuwasilisha","text","") +
          field("onBoardDate","Tarehe on-board","date","2026-07-31","required")) +
        '<fieldset class="swtu-section"><legend>Mizigo na kontena</legend>' +
        rowTable("cargo",["Kontena","Seal","Alama","Idadi","Aina","Mzigo","Gross kg","CBM"],ROWS.cargo,2) + "</fieldset>" +
        section("Freight na sheria",
          select("freightMode","Freight payable",[["prepaid","Prepaid"],["collect","Collect"]],"prepaid") +
          field("freightAmount","Kiasi cha freight","number","0",'min="0" step="0.01"') +
          select("freightCurrency","Sarafu",["USD","EUR","GBP","NGN","KES","GHS","ZAR"],"USD") +
          select("originals","Originals",["0","1","2","3"],"3") + field("governingLaw","Sheria inayotumika","text","English Law"));
      formats = ["pdf","txt"];
    } else if (id === "customs-time") {
      body = section("Shipment",
        select("country","Nchi / bandari",Object.keys(CUSTOMS).map(function(key){return [key,CUSTOMS[key].name+" — "+CUSTOMS[key].port];}),"nigeria") +
        select("goodsType","Aina ya bidhaa",[["commercial","Bidhaa za biashara"],["personal","Mali binafsi"],["vehicles","Magari"],["food","Chakula na kilimo"],["pharma","Dawa / medical"],["electronics","Electronics"]],"commercial") +
        select("documentStatus","Hali ya nyaraka",[["complete","Kamili"],["partial","Baadhi hazipo"],["incomplete","Nyingi hazipo"]],"complete") +
        field("cargoValue","Thamani ya mzigo (USD)","number","10000",'min="0" step="0.01" required'));
      formats = ["csv"];
    } else if (id === "shipping-weight") {
      body = section("Kifurushi",
        field("lengthCm","Urefu (cm)","number","",'min="0.01" step="0.01" required') +
        field("widthCm","Upana (cm)","number","",'min="0.01" step="0.01" required') +
        field("heightCm","Kimo (cm)","number","",'min="0.01" step="0.01" required') +
        field("actualKg","Uzito halisi (kg)","number","",'min="0.01" step="0.01" required') +
        select("shippingType","Njia",[["air","Air freight (÷5000)"],["courier","Express courier (÷5000)"],["road","Road freight (÷4000)"],["sea","Sea reference (÷6000)"]],"air"));
      formats = ["txt"];
    } else {
      body = section("Matter na nchi",
        field("matter","Matter au project","text","","required") +
        select("country","Nchi / regime",PROFILES.map(function(profile){return [profile.code,profile.name+" — "+profile.law];}),"NG") +
        field("targetDate","Tarehe lengwa","date","2026-08-31") +
        select("status","Hali",["Kukagua ushahidi","Tayari kuthibitisha","Kusubiri chanzo rasmi","Peleka kwa mtaalamu kabla ya hatua"],"Kukagua ushahidi")) +
        '<fieldset class="swtu-section"><legend>Ushahidi uliokaguliwa</legend><div class="swtu-checks">' +
        checkboxes([["legalBasis","Msingi wa kisheria"],["contract","DPA / transfer clauses"],["riskAssessment","DPIA / risk assessment"],["security","Security controls"],["processors","Processor na sub-processor map"],["retention","Retention na deletion"],["rights","Data-subject rights"],["incident","Incident response"]]) +
        '</div></fieldset><fieldset class="swtu-section"><legend>Risk flags</legend><div class="swtu-checks">' +
        checkboxes([["sensitive","Data nyeti"],["children","Data ya watoto"],["largeScale","Processing ya kiwango kikubwa"]]) +
        "</div></fieldset>" + field("privateNotes","Maelezo binafsi","textarea","",'class="full"') +
        '<div class="swtu-actions"><button type="button" data-save-local>Hifadhi kwenye kifaa</button><button type="button" data-load-local>Pakia iliyohifadhiwa</button><a href="/dashboard/">Fungua dashboard</a></div>';
      formats = ["pdf","json"];
    }
    return '<div class="swtu-app"><section class="swtu-card"><h2>Ingiza taarifa</h2><form data-tool-form novalidate>' +
      body + '<div class="swtu-actions"><button class="primary" type="submit">Tengeneza matokeo</button>' +
      exportButtons(formats) + '</div><p class="swtu-status" data-status role="status" aria-live="polite"></p></form></section>' +
      '<section class="swtu-card"><h2>Matokeo</h2><div class="swtu-result-empty" data-empty>Jaza taarifa, kisha tengeneza matokeo.</div><article class="swtu-result" data-result hidden aria-live="polite"></article><div class="swtu-source" data-source></div></section></div>';
  }
  function checkboxes(values) {
    return values.map(function(row){return '<label class="swtu-check"><input type="checkbox" name="'+row[0]+'"><span>'+row[1]+"</span></label>";}).join("");
  }
  function values(form) {
    var result = {};
    new FormData(form).forEach(function(value,key){result[key]=value;});
    form.querySelectorAll('input[type="checkbox"]').forEach(function(input){result[input.name]=input.checked;});
    return result;
  }
  function rows(form, kind) {
    return Array.from(form.querySelectorAll('[data-rows="'+kind+'"] tr')).map(function(tr){
      var result={};
      tr.querySelectorAll("[data-cell]").forEach(function(control){result[control.dataset.cell]=control.type==="number"?Number(control.value):control.value.trim();});
      return result;
    });
  }
  function missing(data,names) {
    return names.filter(function(name){return !String(data[name] == null ? "" : data[name]).trim();});
  }
  function calculation(id, form, engine) {
    var data = values(form);
    if (id === "proforma-invoice") {
      var items = rows(form,"items");
      var required = missing(data,["sellerName","sellerAddress","buyerName","buyerAddress","documentNumber","date","portOfLoading","portOfDischarge"]);
      var goodItems = items.filter(function(item){return item.description && item.quantity>0 && item.unitPrice>=0;});
      if (required.length || !goodItems.length) throw new Error("Jaza wahusika, rejea, route na angalau bidhaa moja yenye idadi na bei.");
      var totals = engine.proformaTotals({items:goodItems,freight:data.freight,insurance:data.insurance});
      return {tool:id,data:data,items:goodItems,totals:totals};
    }
    if (id === "packing-list") {
      var packages = rows(form,"packages");
      var requiredPacking = missing(data,["shipperName","shipperAddress","consigneeName","consigneeAddress","documentNumber","date","portOfLoading","portOfDischarge"]);
      var invalidWeight = packages.some(function(item){return item.quantity>0 && item.grossKg<item.netKg;});
      var goodPackages = packages.filter(function(item){return item.description && item.quantity>0 && item.lengthCm>0 && item.widthCm>0 && item.heightCm>0;});
      if (requiredPacking.length || !goodPackages.length) throw new Error("Jaza wahusika, route na angalau kifurushi kimoja chenye maelezo na vipimo.");
      if (invalidWeight) throw new Error("Gross weight haiwezi kuwa chini ya net weight.");
      goodPackages.forEach(function(item){item.cbm=item.quantity*item.lengthCm*item.widthCm*item.heightCm/1000000;});
      var packing = engine.packingTotals({weightsAreTotals:true,packages:goodPackages.map(function(item){return {count:item.quantity,netWeight:item.netKg,grossWeight:item.grossKg,cbm:item.cbm};})});
      return {tool:id,data:data,packages:goodPackages,totals:packing,utilization:{ft20:packing.cbm/33*100,ft40:packing.cbm/67*100,ft40hc:packing.cbm/76*100},airVolumetricKg:packing.cbm*167};
    }
    if (id === "bol-generator") {
      var cargo = rows(form,"cargo").filter(function(item){return item.description || item.containerNumber;});
      var requiredBol = missing(data,["documentNumber","shipperName","shipperAddress","consigneeName","portOfLoading","portOfDischarge","onBoardDate"]);
      if (requiredBol.length || !cargo.length || cargo.some(function(item){return !item.description || item.packages<=0;})) throw new Error("Jaza wahusika, route, tarehe on-board na angalau mstari mmoja kamili wa mzigo.");
      var total={packages:0,grossKg:0,cbm:0};
      cargo.forEach(function(item){total.packages+=item.packages;total.grossKg+=item.grossKg;total.cbm+=item.cbm;});
      var draft=engine.billOfLadingDraft({shipper:data.shipperName,consignee:data.consigneeName,cargo:cargo.map(function(item){return item.description;}).join("; "),loadPort:data.portOfLoading,dischargePort:data.portOfDischarge,grossWeight:total.grossKg,volume:total.cbm,freight:data.freightAmount});
      if(!draft.valid) throw new Error("Shipper, consignee na maelezo ya mzigo yanahitajika.");
      return {tool:id,data:data,cargo:cargo,totals:total,draft:draft};
    }
    if (id === "customs-time") {
      if (!(Number(data.cargoValue)>0)) throw new Error("Weka thamani ya mzigo iliyo juu ya sifuri.");
      var base=CUSTOMS[data.country], docs=DOCUMENTS[data.goodsType];
      var model=engine.customsClearanceModel({minimumDays:base.min,typicalDays:base.typ,maximumDays:base.max,documentStatus:data.documentStatus,goodsType:data.goodsType,cargoValue:data.cargoValue,agentRate:base.agent,storagePerDay:base.storage});
      return {tool:id,data:data,port:base,documents:docs,model:model};
    }
    if (id === "shipping-weight") {
      if (["lengthCm","widthCm","heightCm","actualKg"].some(function(key){return !(Number(data[key])>0);})){throw new Error("Vipimo vyote na uzito halisi lazima viwe juu ya sifuri.");}
      var divisors={air:5000,courier:5000,road:4000,sea:6000}, divisor=divisors[data.shippingType];
      var modelWeight=engine.shippingWeight({packages:1,actualWeight:data.actualKg,length:data.lengthCm,width:data.widthCm,height:data.heightCm,divisor:divisor});
      var comparisons=[
        {service:"DHL Express",divisor:5000},{service:"FedEx International",divisor:5000},
        {service:"EMS / Post",divisor:6000},{service:"Road courier",divisor:4000},{service:"Sea reference",divisor:6000}
      ].map(function(item){var vol=Number(data.lengthCm)*Number(data.widthCm)*Number(data.heightCm)/item.divisor;return {service:item.service,divisor:item.divisor,volumetricKg:vol,chargeableKg:Math.max(Number(data.actualKg),vol)};});
      return {tool:id,data:data,divisor:divisor,model:modelWeight,comparisons:comparisons,recommendation:modelWeight.volumetricWeight>modelWeight.actualWeight?"Punguza ukubwa wa boksi ikiwa carrier anakubali; volume ndiyo inaongeza chargeable weight.":"Boksi ni compact; uzito halisi ndio unaongoza. Thibitisha rounding na minimum charge."};
    }
    var profile=PROFILES.find(function(item){return item.code===data.country;});
    if(!data.matter.trim()) throw new Error("Weka jina la matter au project.");
    var checklist=engine.crossBorderChecklist(data);
    return {tool:id,data:data,profile:profile,checklist:checklist,risks:[data.sensitive&&"Data nyeti",data.children&&"Data ya watoto",data.largeScale&&"Processing ya kiwango kikubwa"].filter(Boolean)};
  }
  function money(value,currency){return currency+" "+Number(value).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});}
  function resultHtml(result) {
    var d=result.data;
    if(result.tool==="proforma-invoice"){
      return "<h3>PROFORMA INVOICE — "+esc(d.documentNumber)+"</h3><dl><dt>Muuzaji</dt><dd>"+esc(d.sellerName)+", "+esc(d.sellerAddress)+", "+esc(d.sellerCountry)+" · "+esc(d.sellerPhone)+" · "+esc(d.sellerEmail)+" · Reg "+esc(d.sellerRegistration)+" · Export licence "+esc(d.sellerExportLicense)+"</dd><dt>Mnunuzi</dt><dd>"+esc(d.buyerName)+", "+esc(d.buyerAddress)+", "+esc(d.buyerCountry)+" · "+esc(d.buyerPhone)+" · "+esc(d.buyerEmail)+" · Import licence "+esc(d.buyerImportLicense)+"</dd><dt>Route</dt><dd>"+esc(d.portOfLoading)+" → "+esc(d.portOfDischarge)+" · Origin "+esc(d.originCountry)+"</dd><dt>Masharti</dt><dd>"+esc(d.incoterm)+" · "+esc(d.paymentTerms)+" · delivery "+esc(d.deliveryTime)+" · valid "+esc(d.validUntil)+"</dd><dt>Ufungashaji / ukaguzi</dt><dd>"+esc(d.packaging)+" · "+esc(d.inspection)+" · "+esc(d.shippingMarks)+" · "+esc(d.specialConditions)+"</dd></dl>"+table(["Bidhaa","HS","Idadi","Unit","Bei","Jumla"],result.items.map(function(item){return [item.description,item.hsCode,item.quantity,item.unit,money(item.unitPrice,d.currency),money(item.quantity*item.unitPrice,d.currency)];}))+"<h3>FOB "+money(result.totals.fob,d.currency)+" · CFR "+money(result.totals.cfr,d.currency)+" · CIF "+money(result.totals.cif,d.currency)+"</h3>";
    }
    if(result.tool==="packing-list"){
      return "<h3>PACKING LIST — "+esc(d.documentNumber)+"</h3><dl><dt>Shipper</dt><dd>"+esc(d.shipperName)+", "+esc(d.shipperAddress)+", "+esc(d.shipperCountry)+"</dd><dt>Consignee</dt><dd>"+esc(d.consigneeName)+", "+esc(d.consigneeAddress)+", "+esc(d.consigneeCountry)+"</dd><dt>Notify party</dt><dd>"+esc(d.notifyName)+", "+esc(d.notifyAddress)+"</dd><dt>Safari</dt><dd>"+esc(d.vesselVoyage)+" · "+esc(d.portOfLoading)+" → "+esc(d.portOfDischarge)+" · origin "+esc(d.originCountry)+"</dd></dl>"+table(["Alama","Namba","Aina","Maelezo","Idadi","Net","Gross","CBM"],result.packages.map(function(item){return [item.marks,item.packageNumber,item.type,item.description,item.quantity,item.netKg,item.grossKg,item.cbm.toFixed(3)];}))+"<h3>Jumla: "+result.totals.packageCount+" packages · "+result.totals.netWeight.toFixed(3)+" net kg · "+result.totals.grossWeight.toFixed(3)+" gross kg · "+result.totals.cbm.toFixed(3)+" CBM</h3><p>Matumizi: 20ft "+result.utilization.ft20.toFixed(1)+"% · 40ft "+result.utilization.ft40.toFixed(1)+"% · 40ft HC "+result.utilization.ft40hc.toFixed(1)+"% · Air volumetric "+result.airVolumetricKg.toFixed(2)+" kg.</p>";
    }
    if(result.tool==="bol-generator"){
      return '<p class="swtu-warning"><strong>RASIMU ISIYO RASMI:</strong> carrier au wakala wake pekee anaweza kutoa Bill of Lading halali.</p><h3>'+esc(d.blType)+" — "+esc(d.documentNumber)+"</h3><dl><dt>Shipper</dt><dd>"+esc(d.shipperName)+", "+esc(d.shipperAddress)+", "+esc(d.shipperCountry)+"</dd><dt>Consignee</dt><dd>"+esc(d.consigneeName)+", "+esc(d.consigneeAddress)+"</dd><dt>Notify party</dt><dd>"+esc(d.notifyName)+" · "+esc(d.notifyPhone)+" · "+esc(d.notifyAddress)+"</dd><dt>Safari</dt><dd>"+esc(d.vessel)+" / "+esc(d.voyage)+" · "+esc(d.placeOfReceipt)+" · "+esc(d.portOfLoading)+" → "+esc(d.portOfDischarge)+" · "+esc(d.placeOfDelivery)+" · on-board "+esc(d.onBoardDate)+"</dd><dt>Freight</dt><dd>"+esc(d.freightMode)+" · "+money(d.freightAmount,d.freightCurrency)+" · originals "+esc(d.originals)+" · "+esc(d.governingLaw)+"</dd></dl>"+table(["Kontena","Seal","Alama","Vifurushi","Aina","Mzigo","Gross kg","CBM"],result.cargo.map(function(item){return [item.containerNumber,item.sealNumber,item.marks,item.packages,item.packageType,item.description,item.grossKg,item.cbm];}))+"<h3>Jumla: "+result.totals.packages+" packages · "+result.totals.grossKg.toFixed(3)+" kg · "+result.totals.cbm.toFixed(3)+" CBM</h3>";
    }
    if(result.tool==="customs-time"){
      return "<h3>"+esc(result.port.port)+"</h3><dl><dt>Muda</dt><dd>"+result.model.minimumDays+"–"+result.model.maximumDays+" siku; kawaida "+result.model.typicalDays+"</dd><dt>Ada ya wakala</dt><dd>USD "+result.model.agentFee.toLocaleString()+"</dd><dt>Storage</dt><dd>USD "+result.model.storageCost.toLocaleString()+"</dd><dt>Inspection</dt><dd>USD "+result.port.inspection+"</dd><dt>Port handling</dt><dd>USD "+result.port.handling+"</dd></dl><h3>Nyaraka</h3><ul>"+result.documents.map(function(doc){return "<li>"+esc(doc)+"</li>";}).join("")+"</ul><h3>Kidokezo cha nchi</h3><p>"+esc(result.port.tip)+'</p><p><a href="'+esc(result.port.source)+'" target="_blank" rel="noopener">Chanzo rasmi cha kuthibitisha</a></p>';
    }
    if(result.tool==="shipping-weight"){
      return "<h3>Chargeable weight: "+result.model.chargeableWeight.toFixed(2)+" kg</h3><dl><dt>Uzito halisi</dt><dd>"+result.model.actualWeight.toFixed(2)+" kg</dd><dt>Volumetric</dt><dd>"+result.model.volumetricWeight.toFixed(2)+" kg</dd><dt>Divisor</dt><dd>÷"+result.divisor+"</dd><dt>Volume</dt><dd>"+(Number(d.lengthCm)*Number(d.widthCm)*Number(d.heightCm)/1000000).toFixed(4)+" m³</dd></dl>"+table(["Service","Divisor","Volumetric kg","Chargeable kg"],result.comparisons.map(function(item){return [item.service,"÷"+item.divisor,item.volumetricKg.toFixed(2),item.chargeableKg.toFixed(2)];}))+"<h3>Mapendekezo</h3><p>"+esc(result.recommendation)+"</p>";
    }
    return "<h3>"+esc(d.matter)+" — "+esc(result.profile.name)+"</h3><dl><dt>Sheria</dt><dd>"+esc(result.profile.law)+"</dd><dt>Regulator</dt><dd>"+esc(result.profile.regulator)+'</dd><dt>Hali</dt><dd>'+esc(d.status)+" · target "+esc(d.targetDate)+"</dd><dt>Ushahidi</dt><dd>"+result.checklist.completed+"/"+result.checklist.total+" ("+result.checklist.completionRate.toFixed(0)+"%)</dd><dt>Risk flags</dt><dd>"+esc(result.risks.join(", ")||"Hakuna iliyowekwa")+"</dd><dt>Private notes</dt><dd>"+esc(d.privateNotes)+"</dd></dl><p><a href=\""+esc(result.profile.source)+'" target="_blank" rel="noopener">Chanzo cha regulator</a></p><p class="'+(result.checklist.highRisk?"swtu-warning":"swtu-ok")+'">'+(result.checklist.highRisk?"Peleka kwa DPO au mtaalamu kabla ya transfer.":"Endelea kukusanya evidence na kuthibitisha masharti rasmi.")+"</p>";
  }
  function table(headers,data){
    return '<div class="swtu-table-wrap"><table><thead><tr>'+headers.map(function(item){return "<th>"+esc(item)+"</th>";}).join("")+"</tr></thead><tbody>"+data.map(function(row){return "<tr>"+row.map(function(item){return "<td>"+esc(item)+"</td>";}).join("")+"</tr>";}).join("")+"</tbody></table></div>";
  }
  function textResult(result){
    var node={innerHTML:resultHtml(result)};
    if(typeof document!=="undefined"){var div=document.createElement("div");div.innerHTML=node.innerHTML;return div.innerText.replace(/\n{3,}/g,"\n\n").trim();}
    return JSON.stringify(result);
  }
  function csvResult(result){
    var rows=[];
    if(result.tool==="proforma-invoice"){
      rows.push(["description","hs_code","quantity","unit","unit_price","line_total"]);
      result.items.forEach(function(item){rows.push([item.description,item.hsCode,item.quantity,item.unit,item.unitPrice,item.quantity*item.unitPrice]);});
      rows.push([],["field","value"],["document_number",result.data.documentNumber],["seller",result.data.sellerName],["buyer",result.data.buyerName],["currency",result.data.currency],["fob",result.totals.fob],["freight",result.totals.freight],["insurance",result.totals.insurance],["cif",result.totals.cif],["packaging",result.data.packaging],["inspection",result.data.inspection],["shipping_marks",result.data.shippingMarks]);
    }else if(result.tool==="packing-list"){
      rows.push(["marks","package_number","type","description","quantity","net_kg","gross_kg","length_cm","width_cm","height_cm","cbm"]);
      result.packages.forEach(function(item){rows.push([item.marks,item.packageNumber,item.type,item.description,item.quantity,item.netKg,item.grossKg,item.lengthCm,item.widthCm,item.heightCm,item.cbm.toFixed(3)]);});
      rows.push([],["field","value"],["packing_list_number",result.data.documentNumber],["notify_party",result.data.notifyName],["vessel_voyage",result.data.vesselVoyage],["origin",result.data.originCountry],["total_packages",result.totals.packageCount],["total_net_kg",result.totals.netWeight.toFixed(3)],["total_gross_kg",result.totals.grossWeight.toFixed(3)],["total_cbm",result.totals.cbm.toFixed(3)],["20ft_utilization_pct",result.utilization.ft20.toFixed(1)]);
    }else{
      rows=[["metric","value"],["country",result.port.name],["port",result.port.port],["goods_type",result.data.goodsType],["document_status",result.data.documentStatus],["cargo_value_usd",result.data.cargoValue],["min_days",result.model.minimumDays],["typical_days",result.model.typicalDays],["max_days",result.model.maximumDays],["agent_fee_usd",result.model.agentFee],["storage_usd",result.model.storageCost],["inspection_fee_usd",result.port.inspection],["port_handling_usd",result.port.handling],["documents",result.documents.join("; ")],["official_source",result.port.source]];
    }
    return rows.map(function(row){return row.map(function(cell){return '"'+String(cell==null?"":cell).replace(/"/g,'""')+'"';}).join(",");}).join("\n");
  }
  function filename(id,format){return "afrotools-"+id+"."+format;}
  function download(root,id,format,result){
    var blob;
    if(format==="pdf"){
      var Pdf=root.jspdf&&root.jspdf.jsPDF;
      if(!Pdf) throw new Error("PDF library haikupatikana.");
      var pdf=new Pdf({unit:"pt",format:"a4"}),lines=pdf.splitTextToSize(textResult(result),500),y=48;
      pdf.setFont("helvetica","normal");pdf.setFontSize(10);
      lines.forEach(function(line){if(y>790){pdf.addPage();y=48;}pdf.text(line,46,y);y+=14;});
      blob=pdf.output("blob");
    }else if(format==="json"){blob=new Blob([JSON.stringify(result,null,2)],{type:"application/json"});}
    else if(format==="csv"){blob=new Blob([csvResult(result)],{type:"text/csv;charset=utf-8"});}
    else{blob=new Blob([textResult(result)],{type:"text/plain;charset=utf-8"});}
    var link=root.document.createElement("a"),url=root.URL.createObjectURL(blob);
    link.href=url;link.download=filename(id,format);link.dataset.localExport="true";root.document.body.appendChild(link);link.click();link.remove();
    root.setTimeout(function(){root.URL.revokeObjectURL(url);},0);
  }
  function sourceHtml(id,result){
    if(id==="customs-time") return "<strong>Chanzo na freshness:</strong> model ya English product pamoja na "+esc(result.port.name)+" authority. Ledger ya transport ilikaguliwa 2026-07-29; si data live. Thibitisha nyaraka, congestion na fees kwa authority, port na wakala mwenye leseni.";
    if(id==="shipping-weight") return '<strong>Chanzo na freshness:</strong> kanuni ya English product; marejeo ya operator <a href="https://www.dhl.com/" target="_blank" rel="noopener">DHL</a> na <a href="https://www.fedex.com/" target="_blank" rel="noopener">FedEx</a>. Ledger ilikaguliwa 2026-07-29; divisor si quote live.';
    if(id==="cross-border-data") return "<strong>Chanzo na freshness:</strong> regulator na sheria ya nchi iliyochaguliwa; marejeo ya page yalipitiwa 2026-04-28. Sheria na approvals hubadilika—thibitisha kwenye link rasmi kabla ya transfer.";
    return "<strong>Chanzo na freshness:</strong> taarifa za user na formula ya English product ya ndani. Hakuna rates, quote, filing au submission live. Thibitisha mahitaji ya buyer, carrier, bank, customs na regulator.";
  }
  function boot(root){
    var mount=root.document.querySelector("[data-sw-trade-app]");
    if(!mount) return;
    var id=mount.dataset.swTradeApp,engine=root.TradeUtilityEngine;
    if(!FIELD_MATRICES[id]||!engine) return;
    mount.innerHTML=formHtml(id);
    var form=mount.querySelector("[data-tool-form]"),resultNode=mount.querySelector("[data-result]"),empty=mount.querySelector("[data-empty]"),status=mount.querySelector("[data-status]"),source=mount.querySelector("[data-source]");
    var current=null,cleanSnapshot="";
    function exportControls(){return Array.from(form.querySelectorAll("[data-export]"));}
    function setDirty(message){
      current=null;cleanSnapshot="";resultNode.hidden=true;resultNode.innerHTML="";empty.hidden=false;
      exportControls().forEach(function(button){button.disabled=true;});
      status.classList.remove("error");status.textContent=message||"Mabadiliko yamefuta matokeo. Tengeneza tena kabla ya export.";
      source.innerHTML="";
    }
    function snapshot(){return JSON.stringify({data:values(form),items:rows(form,"items"),packages:rows(form,"packages"),cargo:rows(form,"cargo")});}
    form.addEventListener("input",function(event){if(event.target.closest("[data-tool-form]")&&current)setDirty();});
    form.addEventListener("change",function(event){if(event.target.closest("[data-tool-form]")&&current)setDirty();});
    form.addEventListener("click",function(event){
      var add=event.target.closest("[data-add-row]");
      if(add){form.querySelector('[data-rows="'+add.dataset.addRow+'"]').insertAdjacentHTML("beforeend",tableRow(add.dataset.addRow,ROWS[add.dataset.addRow]));setDirty("Mstari umeongezwa. Tengeneza matokeo baada ya kukamilisha.");return;}
      var remove=event.target.closest("[data-remove-row]");
      if(remove){var tbody=remove.closest("tbody");if(tbody.rows.length>1)remove.closest("tr").remove();else Array.from(remove.closest("tr").querySelectorAll("input")).forEach(function(input){input.value=input.type==="number"?(input.min==="0"?"0":""):"";});setDirty("Mstari umeondolewa. Tengeneza matokeo tena.");return;}
      var exportButton=event.target.closest("[data-export]");
      if(exportButton){if(!current||cleanSnapshot!==snapshot()){setDirty("Export imezuiwa kwa sababu taarifa zimebadilika.");return;}try{download(root,id,exportButton.dataset.export,current);status.textContent=exportButton.dataset.export.toUpperCase()+" imepakuliwa ndani ya kifaa.";}catch(error){status.classList.add("error");status.textContent=error.message;}return;}
      if(event.target.closest("[data-save-local]")){var save=values(form);root.localStorage.setItem("afrotools-sw-cross-border-data",JSON.stringify(save));status.textContent="Matter imehifadhiwa kwenye kifaa hiki pekee.";return;}
      if(event.target.closest("[data-load-local]")){var saved=root.localStorage.getItem("afrotools-sw-cross-border-data");if(!saved){status.textContent="Hakuna matter iliyohifadhiwa kwenye kifaa hiki.";return;}var parsed=JSON.parse(saved);Object.keys(parsed).forEach(function(key){var control=form.elements[key];if(!control)return;if(control.type==="checkbox")control.checked=Boolean(parsed[key]);else control.value=parsed[key];});setDirty("Matter ya ndani imepakiwa. Tengeneza matokeo tena.");}
    });
    form.addEventListener("submit",function(event){
      event.preventDefault();
      try{
        current=calculation(id,form,engine);cleanSnapshot=snapshot();resultNode.innerHTML=resultHtml(current);resultNode.hidden=false;empty.hidden=true;source.innerHTML=sourceHtml(id,current);
        exportControls().forEach(function(button){button.disabled=false;});
        status.classList.remove("error");status.textContent="Matokeo yako tayari. Export zinahusiana na hali hii ya fomu.";
      }catch(error){setDirty("");status.classList.add("error");status.textContent=error.message;}
    });
    setDirty("");
  }
  return {CUSTOMS:CUSTOMS,DOCUMENTS:DOCUMENTS,FIELD_MATRICES:FIELD_MATRICES,PROFILES:PROFILES,boot:boot,calculation:calculation,csvResult:csvResult,formHtml:formHtml,resultHtml:resultHtml};
});
