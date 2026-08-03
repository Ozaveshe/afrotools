const { test, expect } = require("@playwright/test");
const pdfParse = require("pdf-parse");

const routes = {
  proforma: "/sw/zana/ankara-proforma/",
  packing: "/sw/zana/orodha-ya-kupakia/",
  bol: "/sw/zana/bill-of-lading/",
  customs: "/sw/zana/muda-wa-kupitisha-forodha/",
  shipping: "/sw/zana/uzito-wa-usafirishaji/",
  crossBorder: "/sw/zana/uhamishaji-data-mpaka/"
};

async function downloadText(page, format) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator(`[data-export="${format}"]`).click()
  ]);
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function pdfText(page) {
  const buffer = await downloadText(page, "pdf");
  const parsed = await pdfParse(buffer);
  return parsed.text.replace(/\s+/g, " ");
}

async function fill(page, values) {
  for (const [name, value] of Object.entries(values)) {
    const control = page.locator(`[name="${name}"]`);
    if (typeof value === "boolean") {
      if (value) await control.check();
      else await control.uncheck();
    } else if (await control.evaluate((node) => node.tagName === "SELECT")) {
      await control.selectOption(String(value));
    } else {
      await control.fill(String(value));
    }
  }
}

async function fillRow(page, kind, index, values) {
  const row = page.locator(`[data-rows="${kind}"] tr`).nth(index);
  for (const [name, value] of Object.entries(values)) {
    const control = row.locator(`[data-cell="${name}"]`);
    if (await control.evaluate((node) => node.tagName === "SELECT")) await control.selectOption(String(value));
    else await control.fill(String(value));
  }
}

async function submit(page) {
  await page.locator("[data-tool-form] button[type=submit]").click();
  await expect(page.locator("[data-result]")).toBeVisible();
  const exports = page.locator("[data-export]");
  for (let index = 0; index < await exports.count(); index += 1) await expect(exports.nth(index)).toBeEnabled();
}

async function proveDirtyLock(page, fieldName, replacement) {
  const control = page.locator(`[name="${fieldName}"]`);
  if (await control.evaluate((node) => node.tagName === "SELECT")) await control.selectOption(replacement);
  else await control.fill(replacement);
  await expect(page.locator("[data-result]")).toBeHidden();
  const exports = page.locator("[data-export]");
  await expect(exports).toHaveCount(await exports.count());
  for (let index = 0; index < await exports.count(); index += 1) await expect(exports.nth(index)).toBeDisabled();
}

test("proforma restores the complete invoice contract, clears dirty results, and exports parsed PDF/CSV/JSON", async ({ page }) => {
  await page.goto(routes.proforma);
  await fill(page, {
    sellerName:"Kahawa Bora Ltd",sellerAddress:"Arusha Road",sellerCountry:"Tanzania",sellerPhone:"+255700111222",
    sellerEmail:"sales@example.test",sellerRegistration:"TZ-REG-77",sellerExportLicense:"EXP-009",
    buyerName:"Nairobi Beans Ltd",buyerAddress:"Industrial Area",buyerCountry:"Kenya",buyerPhone:"+254700333444",
    buyerEmail:"buy@example.test",buyerImportLicense:"IMP-331",documentNumber:"PI-TEST-900",date:"2026-07-31",
    validUntil:"2026-08-30",incoterm:"CIF",portOfLoading:"Dar es Salaam",portOfDischarge:"Mombasa",
    originCountry:"Tanzania",currency:"USD",paymentTerms:"Letter of Credit",deliveryTime:"30 days",
    packaging:"24 bags per pallet",inspection:"SGS at origin",shippingMarks:"NB/MBA/01",specialConditions:"Subject to export permit",
    freight:120,insurance:30
  });
  await fillRow(page,"items",0,{description:"Arabica coffee",hsCode:"0901.11",quantity:12,unit:"kg",unitPrice:80});
  await submit(page);
  await expect(page.locator("[data-result]")).toContainText("CIF USD 1,110.00");
  await expect(page.locator("[data-result]")).toContainText("EXP-009");
  await expect(page.locator("[data-result]")).toContainText("NB/MBA/01");
  const csv = (await downloadText(page,"csv")).toString("utf8");
  expect(csv).toContain('"Arabica coffee","0901.11","12","kg","80","960"');
  expect(csv).toContain('"cif","1110"');
  const json = JSON.parse((await downloadText(page,"json")).toString("utf8"));
  expect(json.data.buyerImportLicense).toBe("IMP-331");
  expect(json.totals.cif).toBe(1110);
  expect(await pdfText(page)).toContain("PI-TEST-900");
  await proveDirtyLock(page,"sellerName","Kahawa Bora Exporters");
  await page.locator("[data-tool-form] button[type=submit]").click();
  await expect(page.locator("[data-result]")).toBeVisible();
  await page.locator('[name="sellerName"]').fill("");
  await page.locator("[data-tool-form] button[type=submit]").click();
  await expect(page.locator("[data-result]")).toBeHidden();
  await expect(page.locator("[data-status]")).toContainText("Jaza wahusika");
});

test("packing list preserves notify/voyage/marks/container use and exports exact parsed values", async ({ page }) => {
  await page.goto(routes.packing);
  await fill(page, {
    shipperName:"Lake Exporters",shipperAddress:"Mwanza",shipperCountry:"Tanzania",
    consigneeName:"Cape Retail",consigneeAddress:"Cape Town",consigneeCountry:"South Africa",
    notifyName:"Harbour Brokers",notifyAddress:"Durban",documentNumber:"PL-440",date:"2026-07-31",
    invoiceReference:"INV-440",vesselVoyage:"MV Umoja / 18S",portOfLoading:"Dar es Salaam",
    portOfDischarge:"Durban",originCountry:"Tanzania"
  });
  await fillRow(page,"packages",0,{marks:"CR/DUR/01",packageNumber:"1 of 2",type:"Carton",description:"Textiles",quantity:2,netKg:20,grossKg:24,lengthCm:100,widthCm:50,heightCm:40});
  await submit(page);
  await expect(page.locator("[data-result]")).toContainText("0.400 CBM");
  await expect(page.locator("[data-result]")).toContainText("20ft 1.2%");
  await expect(page.locator("[data-result]")).toContainText("Harbour Brokers");
  const csv = (await downloadText(page,"csv")).toString("utf8");
  expect(csv).toContain('"CR/DUR/01","1 of 2","Carton","Textiles","2","20","24","100","50","40","0.400"');
  expect(csv).toContain('"vessel_voyage","MV Umoja / 18S"');
  const json = JSON.parse((await downloadText(page,"json")).toString("utf8"));
  expect(json.totals.cbm).toBeCloseTo(0.4);
  expect(json.data.notifyName).toBe("Harbour Brokers");
  expect(await pdfText(page)).toContain("PL-440");
  await proveDirtyLock(page,"notifyName","New Broker");
  await fill(page,{notifyName:"Harbour Brokers"});
  await fillRow(page,"packages",0,{grossKg:19});
  await page.locator("[data-tool-form] button[type=submit]").click();
  await expect(page.locator("[data-status]")).toContainText("Gross weight");
  const exports = page.locator("[data-export]");
  for (let index = 0; index < await exports.count(); index += 1) await expect(exports.nth(index)).toBeDisabled();
});

test("BOL preserves type, on-board, freight, originals, law and multi-row cargo in PDF/TXT", async ({ page }) => {
  await page.goto(routes.bol);
  await fill(page, {
    blType:"order",documentNumber:"BL-778",bookingReference:"BOOK-778",shipperName:"Cocoa Export Ghana",
    shipperAddress:"Tema",shipperCountry:"Ghana",consigneeName:"TO ORDER OF TEST BANK",consigneeAddress:"London",
    notifyName:"Buyer Agent",notifyPhone:"+44201111",notifyAddress:"Felixstowe",vessel:"MV Sankofa",voyage:"77N",
    portOfLoading:"Tema",portOfDischarge:"Felixstowe",placeOfReceipt:"Kumasi",placeOfDelivery:"London",
    onBoardDate:"2026-07-30",freightMode:"prepaid",freightAmount:4500,freightCurrency:"USD",originals:"3",governingLaw:"English Law"
  });
  await fillRow(page,"cargo",0,{containerNumber:"TCKU1234567",sealNumber:"SL111",marks:"COCOA/01",packages:50,packageType:"Bags",description:"Cocoa beans grade A",grossKg:3250,cbm:12.5});
  await fillRow(page,"cargo",1,{containerNumber:"TCKU7654321",sealNumber:"SL222",marks:"COCOA/02",packages:25,packageType:"Bags",description:"Cocoa beans grade B",grossKg:1600,cbm:6.2});
  await submit(page);
  await expect(page.locator("[data-result]")).toContainText("75 packages");
  await expect(page.locator("[data-result]")).toContainText("TO ORDER OF TEST BANK");
  await expect(page.locator("[data-result]")).toContainText("3 · English Law");
  const txt=(await downloadText(page,"txt")).toString("utf8").replace(/\s+/g," ");
  expect(txt).toContain("TCKU1234567");
  expect(txt).toContain("Cocoa beans grade B");
  expect(txt).toContain("4850.000 kg");
  expect(await pdfText(page)).toContain("BL-778");
  await proveDirtyLock(page,"governingLaw","Ghanaian Law");
  await page.locator('[data-rows="cargo"] tr').nth(0).locator('[data-cell="description"]').fill("");
  await page.locator('[data-rows="cargo"] tr').nth(1).locator('[data-cell="description"]').fill("");
  await page.locator("[data-tool-form] button[type=submit]").click();
  await expect(page.locator("[data-status]")).toContainText("mstari mmoja");
});

test("customs country model exposes exact documents/tip/source, clears invalid state, and exports CSV", async ({ page }) => {
  await page.goto(routes.customs);
  await fill(page,{country:"kenya",goodsType:"food",documentStatus:"partial",cargoValue:10000});
  await submit(page);
  await expect(page.locator("[data-result]")).toContainText("kawaida 20");
  await expect(page.locator("[data-result]")).toContainText("Phytosanitary Certificate");
  await expect(page.locator("[data-result]")).toContainText("Kenya Ports Authority");
  const csv=(await downloadText(page,"csv")).toString("utf8");
  expect(csv).toContain('"typical_days","20"');
  expect(csv).toContain('"agent_fee_usd","120"');
  expect(csv).toContain("Phytosanitary Certificate");
  await proveDirtyLock(page,"cargoValue","12000");
  await page.locator('[name="cargoValue"]').fill("0");
  await page.locator("[data-tool-form] button[type=submit]").click();
  await expect(page.locator("[data-status]")).toContainText("juu ya sifuri");
});

test("shipping uses English air/courier/road/sea divisors with comparisons, recommendation, and parsed TXT", async ({ page }) => {
  await page.goto(routes.shipping);
  await fill(page,{lengthCm:50,widthCm:40,heightCm:30,actualKg:8,shippingType:"air"});
  await submit(page);
  await expect(page.locator("[data-result]")).toContainText("12.00 kg");
  await expect(page.locator("[data-result]")).toContainText("÷5000");
  await expect(page.locator("[data-result]")).toContainText("Road courier");
  const txt=(await downloadText(page,"txt")).toString("utf8").replace(/\s+/g," ");
  expect(txt).toContain("Chargeable weight: 12.00 kg");
  expect(txt).toContain("Punguza ukubwa wa boksi");
  await proveDirtyLock(page,"shippingType","road");
  await page.locator('[name="lengthCm"]').fill("0");
  await page.locator("[data-tool-form] button[type=submit]").click();
  await expect(page.locator("[data-status]")).toContainText("juu ya sifuri");
});

test("cross-border data restores matter/evidence/risk/private notes/save/dashboard/regulator and parsed exports", async ({ page }) => {
  await page.goto(routes.crossBorder);
  await fill(page,{matter:"Supplier DPA review",country:"KE",targetDate:"2026-08-20",status:"Tayari kuthibitisha",legalBasis:true,contract:true,riskAssessment:true,security:true,processors:true,retention:true,rights:true,incident:true,sensitive:true,children:false,largeScale:true,privateNotes:"Cloud support in Germany; confirm sub-processors."});
  await submit(page);
  await expect(page.locator("[data-result]")).toContainText("8/8");
  await expect(page.locator("[data-result]")).toContainText("Office of the Data Protection Commissioner");
  await expect(page.locator("[data-result]")).toContainText("Data nyeti, Processing ya kiwango kikubwa");
  await expect(page.locator('a[href="/dashboard/"]')).toBeVisible();
  const json=JSON.parse((await downloadText(page,"json")).toString("utf8"));
  expect(json.data.privateNotes).toContain("Germany");
  expect(json.checklist.highRisk).toBe(true);
  expect(await pdfText(page)).toContain("Supplier DPA review");
  await page.locator("[data-save-local]").click();
  await expect(page.locator("[data-status]")).toContainText("kifaa hiki pekee");
  await proveDirtyLock(page,"matter","Edited matter");
  await page.locator("[data-load-local]").click();
  await expect(page.locator('[name="matter"]')).toHaveValue("Supplier DPA review");
  await page.locator('[name="matter"]').fill("");
  await page.locator("[data-tool-form] button[type=submit]").click();
  await expect(page.locator("[data-status]")).toContainText("matter");
});

test("all six routes pass privacy, metadata, artwork, shared AI handoff, reflow, themes, keyboard and console checks", async ({ page }) => {
  const failures=[];
  const pageErrors=[];
  page.on("requestfailed",request=>failures.push(request.url()));
  page.on("pageerror",error=>pageErrors.push(error.message));
  for(const route of Object.values(routes)){
    const external=[];
    const writes=[];
    const listener=request=>{
      const url=new URL(request.url());
      if(url.hostname!=="127.0.0.1"&&url.hostname!=="localhost")external.push(request.url());
      if(!["GET","HEAD"].includes(request.method()))writes.push(`${request.method()} ${request.url()}`);
    };
    page.on("request",listener);
    await page.setViewportSize({width:320,height:900});
    await page.goto(route,{waitUntil:"networkidle"});
    await expect(page.locator("html")).toHaveAttribute("lang","sw");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href",/^https:\/\/afrotools\.com\/sw\//);
    await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);
    await expect(page.locator('link[hreflang="sw"]')).toHaveCount(1);
    await expect(page.locator(".swtu-hero img")).toHaveJSProperty("complete",true);
    await expect(page.locator("[data-shared-ai-handoff]")).toHaveAttribute("href","/sw/ai/");
    for(const theme of ["light","dark","system"]){
      await page.locator("html").evaluate((node,value)=>node.dataset.theme=value,theme);
      await expect(page.locator(".swtu-card").first()).toBeVisible();
    }
    const layout=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
      offenders:Array.from(document.querySelectorAll("body *")).filter(node=>node.getBoundingClientRect().right>document.documentElement.clientWidth+1).slice(0,8).map(node=>({tag:node.tagName,cls:node.className,right:Math.round(node.getBoundingClientRect().right),width:Math.round(node.getBoundingClientRect().width)}))
    }));
    expect(layout.overflow, `${route}: ${JSON.stringify(layout.offenders)}`).toBeLessThanOrEqual(1);
    await page.setViewportSize({width:375,height:900});
    await page.addStyleTag({content:"html{font-size:200%!important}"});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    const unnamed=await page.locator("[data-sw-trade-app] input,[data-sw-trade-app] select,[data-sw-trade-app] textarea,[data-sw-trade-app] button,[data-sw-trade-app] a").evaluateAll(nodes=>nodes.filter(node=>{
      if(node.tagName==="A")return !node.textContent.trim()&&!node.getAttribute("aria-label");
      if(node.tagName==="BUTTON")return !node.textContent.trim()&&!node.getAttribute("aria-label");
      return !node.labels?.length&&!node.getAttribute("aria-label");
    }).map(node=>node.outerHTML.slice(0,180)));
    expect(unnamed, `${route}: ${JSON.stringify(unnamed)}`).toEqual([]);
    await page.keyboard.press("Tab");
    expect(await page.evaluate(()=>document.activeElement!==document.body)).toBe(true);
    page.off("request",listener);
    expect(external).toEqual([]);
    expect(writes).toEqual([]);
  }
  expect(failures).toEqual([]);
  expect(pageErrors).toEqual([]);
  const response=await page.request.get("/sw/ai/");
  expect(response.ok()).toBe(true);
  const aiHtml=await response.text();
  expect(aiHtml).toContain("/assets/js/pages/sw-ai-route-entry.js");
});
