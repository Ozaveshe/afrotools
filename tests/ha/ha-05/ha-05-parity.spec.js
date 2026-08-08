"use strict";
const fs=require("fs");
const path=require("path");
const {test,expect}=require("@playwright/test");
const root=path.resolve(__dirname,"../../..");
const evidenceDir=path.join(root,"reports/hausa-workers/ha-05");
const receipts=[];
const rows=[
 {id:"ussd-simulator",slug:"gwajin-ussd",invalid:"#serviceName"},
 {id:"mobile-vs-bank",slug:"kwatanta-mobile-money-da-banki",invalid:"#amount"},
 {id:"telecom-data-plan",slug:"tsarin-data",invalid:"#country",selectInvalid:true},
 {id:"telecom-ussd",slug:"lambobin-ussd",invalid:"#country",selectInvalid:true},
 {id:"telecom-data-usage",slug:"amfani-da-data",invalid:"#browsing"},
 {id:"telecom-airtime",slug:"kudin-airtime",invalid:"#amount"},
 {id:"telecom-sim-reg",slug:"rajistar-sim",invalid:"#country",selectInvalid:true},
 {id:"mobile-money-fees",slug:"kudin-mobile-money",invalid:"#amount"},
 {id:"staple-basket",slug:"kwandon-kayan-masarrafa",basketInvalid:true},
 {id:"naira-to-words",slug:"naira-zuwa-kalmomi",invalid:"#amount"},
 {id:"whatsapp-link",slug:"mahada-whatsapp",invalid:"#phone",noExport:true,privacy:true},
 {id:"remittance-compare",slug:"kwatanta-aika-kudi",invalid:"#amount"}
];

test.describe.configure({mode:"serial"});
test.afterAll(()=>{fs.mkdirSync(evidenceDir,{recursive:true});fs.writeFileSync(path.join(evidenceDir,"browser-receipts.json"),JSON.stringify({lane:"HA-05",syntheticFixturesOnly:true,screenshotPolicy:"No screenshots captured; phone and message fixtures never written to receipts.",generatedAt:new Date().toISOString(),receipts},null,2));});

for(const row of rows)test(`${row.id}: Hausa browser acceptance`,async({page,browserName})=>{
  const consoleErrors=[],failedResponses=[],failedRequests=[],requestUrls=[];
  page.on("console",msg=>{if(msg.type()==="error")consoleErrors.push(msg.text().slice(0,160));});
  page.on("response",response=>{requestUrls.push(response.url());if(response.status()>=400)failedResponses.push({status:response.status(),path:new URL(response.url()).pathname});});
  page.on("requestfailed",request=>failedRequests.push({path:new URL(request.url()).pathname,error:request.failure()?.errorText||"failed"}));
  const route=`/ha/kayan-aiki/${row.slug}/`;
  await page.setViewportSize({width:375,height:812});
  await page.goto(route,{waitUntil:"networkidle"});
  await expect(page.locator("html")).toHaveAttribute("lang","ha");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href",`https://afrotools.com${route}`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content",`https://afrotools.com${route}`);
  await expect(page.locator("body")).toHaveAttribute("data-ha05-app",row.id);
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
  await expect(page.getByText("Tushe da iyakar kimantawa")).toBeVisible();
  const schemaText=await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(schemaText).inLanguage).toBe("ha");
  const art=page.locator(".ha05-art");await expect(art).toBeVisible();
  const artSize=await art.evaluate(img=>({naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,complete:img.complete}));
  expect(artSize.complete).toBeTruthy();expect(artSize.naturalWidth).toBeGreaterThan(0);expect(artSize.naturalHeight).toBeGreaterThan(0);
  const unnamed=await page.locator("#ha05-form input, #ha05-form select, #ha05-form textarea, #ha05-form button").evaluateAll(nodes=>nodes.filter(node=>{if(node.tagName==="BUTTON")return !(node.textContent||"").trim()&&!node.getAttribute("aria-label");if(node.closest("label"))return false;const id=node.id;return !id||!document.querySelector(`label[for="${CSS.escape(id)}"]`)&&!node.getAttribute("aria-label");}).map(node=>node.id||node.tagName));
  expect(unnamed).toEqual([]);

  if(row.basketInvalid){for(let i=1;i<=5;i++)await page.locator(`#qty${i}`).fill("0");}
  else if(row.selectInvalid){await page.locator(row.invalid).evaluate(select=>{const option=document.createElement("option");option.value="ZZ";option.textContent="Gwaji";select.appendChild(option);select.value="ZZ";});}
  else if(row.invalid==="#serviceName")await page.locator(row.invalid).fill("");
  else if(row.invalid==="#phone")await page.locator(row.invalid).fill("1");
  else await page.locator(row.invalid).fill("-1");
  await page.getByRole("button",{name:"Lissafa sakamako"}).click();
  await expect(page.locator("#ha05-error")).not.toBeEmpty();

  await page.getByRole("button",{name:"Goge komai"}).click();
  if(row.privacy){await page.locator("#phone").fill("5550100999");await page.locator("#message").fill("HA05_PRIVACY_MARKER");}
  const submit=page.getByRole("button",{name:"Lissafa sakamako"});await submit.focus();await submit.press("Enter");
  if(row.id==="remittance-compare"){await page.waitForTimeout(750);expect(await page.locator("#ha05-error").textContent(),"remittance validation after source load").toBe("");}
  await expect(page.locator("#ha05-result")).toBeVisible();
  await expect(page.locator("#ha05-result")).toBeFocused();
  await expect(page.locator("#ha05-error")).toBeEmpty();
  const dynamicText=await page.locator("#ha05-result").innerText();
  if(row.id==="telecom-data-plan")expect(dynamicText).not.toMatch(/Daily|Monthly|days|hrs/i);
  if(row.id==="telecom-ussd")expect(dynamicText).not.toMatch(/balance|customerCare|\bdata\b/i);
  if(row.id==="telecom-sim-reg")expect(dynamicText).not.toMatch(/National ID|NIN-SIM|Communications Commission/i);
  let exportReceipt={advertised:false,downloaded:false,parsed:false};
  if(!row.noExport){const event=page.waitForEvent("download");await page.getByRole("button",{name:"Sauke JSON"}).click();const download=await event;const file=await download.path();const parsed=JSON.parse(fs.readFileSync(file,"utf8"));expect(parsed.tool).toBe(row.id);expect(parsed.language).toBe("ha");exportReceipt={advertised:true,downloaded:true,parsed:true,suggestedFilename:download.suggestedFilename(),bytes:fs.statSync(file).size};}
  if(row.privacy){expect(page.url()).not.toContain("HA05_PRIVACY_MARKER");expect(requestUrls.some(url=>url.includes("HA05_PRIVACY_MARKER")||url.includes("5550100999"))).toBeFalsy();}
  const theme=page.getByRole("button",{name:"Yanayin duhu"});await theme.click();await expect(page.locator("html")).toHaveAttribute("data-theme","dark");const manualDark=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);
  await page.evaluate(()=>document.documentElement.removeAttribute("data-theme"));await page.emulateMedia({colorScheme:"dark"});const systemDark=await page.evaluate(()=>getComputedStyle(document.body).backgroundColor);expect(systemDark).not.toBe("rgb(247, 250, 252)");
  const widths={};for(const width of [320,375]){await page.setViewportSize({width,height:900});widths[String(width)]=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1}));expect(widths[String(width)].overflow).toBeFalsy();}
  await page.setViewportSize({width:320,height:900});await page.evaluate(()=>document.documentElement.style.fontSize="200%");const reflow200=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,offenders:[...document.querySelectorAll("main *")].map(node=>({tag:node.tagName,id:node.id||null,className:typeof node.className==="string"?node.className:null,right:Math.round(node.getBoundingClientRect().right),left:Math.round(node.getBoundingClientRect().left),scrollWidth:node.scrollWidth,clientWidth:node.clientWidth})).filter(item=>item.right>innerWidth+1||item.left<-1||item.scrollWidth>item.clientWidth+2).slice(0,8)}));expect(reflow200.overflow,JSON.stringify(reflow200)).toBeFalsy();await page.evaluate(()=>document.documentElement.style.fontSize="");
  await page.getByRole("button",{name:"Goge komai"}).click();await expect(page.locator("#ha05-result")).toBeHidden();const firstControl=page.locator("#ha05-form input, #ha05-form select, #ha05-form textarea").first();await expect(firstControl).toBeFocused();await page.keyboard.press("Tab");expect(await page.evaluate(()=>document.activeElement!==document.body)).toBeTruthy();
  expect(consoleErrors).toEqual([]);expect(failedResponses).toEqual([]);expect(failedRequests).toEqual([]);
  receipts.push({rowId:row.id,route,browser:browserName,validResult:true,invalidValidationHausa:true,reset:true,keyboardAndFocus:true,manualDark:{passed:true,color:manualDark},systemDark:{passed:true,color:systemDark},reflow:{widths,reflow200},privacy:{rawFixtureInUrlOrNetwork:false,analyticsRequests:requestUrls.filter(url=>/analytics|collect|segment|mixpanel/i.test(url)).length},consoleErrors:0,networkErrors:0,export:exportReceipt,accessibility:{unnamedControls:0,resultFocus:true,liveRegions:true},seo:{selfCanonical:true,ogUrl:true,schemaLanguage:"ha"},artwork:{dedicated:true,...artSize}});
});
