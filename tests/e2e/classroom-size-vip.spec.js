const{test,expect}=require("@playwright/test");const fs=require("node:fs"),route="/tools/classroom-size/";
async function fill(page){await page.locator("#roomName").fill("Private Room 39217");await page.locator("#checkedOn").fill("2026-07-26");for(const [id,value] of Object.entries({roomLength:"9",roomWidth:"7",fixedArea:"2",frontDepth:"1.5",rearDepth:".8",sideClearance:".5",aisleCount:"1",aisleWidth:".9",deskWidth:"1.2",rowPitch:"1.1",seatsPerUnit:"2",areaPerLearner:"1.5",administrativeMax:"30",actualLearners:"32"}))await page.locator(`#${id}`).fill(value)}
test.describe("Classroom size VIP",()=>{
test("uses only entered geometry and planning limits",async({page})=>{const errors=[];page.on("pageerror",error=>errors.push(error.message));await page.goto(route,{waitUntil:"commit"});await page.waitForFunction(()=>window.AFROTOOLS_CLASSROOM_VIP===true);await fill(page);await page.getByRole("button",{name:"Calculate planning capacity"}).click();await expect(page.locator("#metricGrid")).toContainText("21 learners");await expect(page.locator("#metricGrid")).toContainText("32.17 m²");await expect(page.locator("#layoutSummary")).toContainText("Area per learner");await expect(page.locator("body")).not.toContainText("UBEC Primary Standard");fs.mkdirSync("artifacts/day5-classroom-size-vip",{recursive:true});await page.screenshot({path:"artifacts/day5-classroom-size-vip/desktop-calculated.png",fullPage:true});expect(errors).toEqual([])});
test("rejects impossible clearance geometry",async({page})=>{await page.goto(route,{waitUntil:"commit"});await page.waitForFunction(()=>window.AFROTOOLS_CLASSROOM_VIP===true);await fill(page);await page.locator("#frontDepth").fill("5");await page.locator("#rearDepth").fill("5");await page.getByRole("button",{name:"Calculate planning capacity"}).click();await expect(page.locator("#classroomError")).toContainText("no positive furniture footprint");await expect(page.locator("#classroomResults")).toBeHidden()});
test("exports and prints without transmitting room entries",async({page})=>{const writes=[];page.on("request",request=>{if(!["GET","HEAD","OPTIONS"].includes(request.method()))writes.push(`${request.url()} ${request.postData()||""}`)});await page.goto(route,{waitUntil:"commit"});await page.waitForFunction(()=>window.AFROTOOLS_CLASSROOM_VIP===true);await fill(page);await page.getByRole("button",{name:"Calculate planning capacity"}).click();const downloadPromise=page.waitForEvent("download");await page.getByRole("button",{name:"Download TXT"}).click();const download=await downloadPromise,text=fs.readFileSync(await download.path(),"utf8");expect(text).toContain("Private Room 39217");expect(text).toContain("not a fire, building");await page.evaluate(()=>{window.__classroomPrint=false;window.print=()=>window.__classroomPrint=true});await page.getByRole("button",{name:"Print / save PDF"}).click();await expect.poll(()=>page.evaluate(()=>window.__classroomPrint)).toBe(true);const pdf=await page.pdf({format:"A4",printBackground:true});expect(pdf.subarray(0,4).toString()).toBe("%PDF");expect(pdf.length).toBeGreaterThan(20000);expect(writes.every(value=>!decodeURIComponent(value).includes("39217"))).toBe(true)});
for(const width of[320,360])test(`has no overflow at ${width}px`,async({page})=>{await page.setViewportSize({width,height:850});await page.goto(route,{waitUntil:"commit"});await page.waitForFunction(()=>window.AFROTOOLS_CLASSROOM_VIP===true);await fill(page);await page.getByRole("button",{name:"Calculate planning capacity"}).click();const size=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);expect(size[0]).toBeLessThanOrEqual(size[1]+1);if(width===360){fs.mkdirSync("artifacts/day5-classroom-size-vip",{recursive:true});await page.screenshot({path:"artifacts/day5-classroom-size-vip/mobile-360-calculated.png",fullPage:true})}});
test("keeps dark 375px layout readable at 200 percent",async({page})=>{await page.setViewportSize({width:375,height:900});await page.goto(route,{waitUntil:"commit"});await page.waitForFunction(()=>window.AFROTOOLS_CLASSROOM_VIP===true);await page.waitForFunction(()=>window.AfroTools&&window.AfroTools.darkMode);await page.evaluate(()=>{window.AfroTools.darkMode.set("dark");document.documentElement.style.fontSize="200%"});const state=await page.evaluate(()=>{const panel=document.querySelector(".cv-panel");return[document.documentElement.scrollWidth,document.documentElement.clientWidth,getComputedStyle(panel).backgroundColor,getComputedStyle(panel.querySelector("h2")).color]});expect(state[0]).toBeLessThanOrEqual(state[1]+1);expect(state[2]).not.toBe(state[3]);fs.mkdirSync("artifacts/day5-classroom-size-vip",{recursive:true});await page.screenshot({path:"artifacts/day5-classroom-size-vip/mobile-dark-375-200.png",fullPage:true})});
test("gives every control an accessible name",async({page})=>{await page.goto(route,{waitUntil:"commit"});await page.waitForFunction(()=>window.AFROTOOLS_CLASSROOM_VIP===true);const unnamed=await page.evaluate(()=>Array.from(document.querySelectorAll("main input,main textarea,main button")).filter(element=>!element.closest("label")&&!element.getAttribute("aria-label")&&!element.textContent.trim()).length);expect(unnamed).toBe(0)});
});

test("Swahili classroom downloads preserve the constraint key and match the displayed label", async ({ page }) => {
  await page.goto("/sw/zana/ukubwa-wa-darasa/");
  const form = page.locator("[data-education-form]");
  for (const [area, key, label, capacity] of [
    ["1.5", "areaCapacity", "Eneo kwa mwanafunzi", 24],
    ["0.5", "layoutCapacity", "Mpangilio wa samani", 56],
  ]) {
    await form.locator('[name="areaPerLearner"]').fill(area);
    await form.locator('[type="submit"]').click();
    await expect(page.locator("[data-education-metrics]")).toContainText(label);
    const pending = page.waitForEvent("download");
    await page.locator('[data-action="json"]').click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe("classroom-size-sw.json");
    const report = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
    expect(report.locale).toBe("sw");
    expect(report.result).toMatchObject({
      planningCapacity: capacity, difference: capacity - 32, limitingFactorKey: key, limitingFactor: label
    });
  }
});
