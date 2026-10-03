const { test, expect } = require('@playwright/test');

async function protect(page, baseURL) {
  const origin = new URL(baseURL).origin;
  const errors = [], writes = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      writes.push({path: url.pathname, method: request.method()});
      return route.abort();
    }
    if (url.origin === origin && !/^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname)) return route.continue();
    return route.fulfill({status:204, body:'', contentType: /\.js$/.test(url.pathname) ? 'application/javascript' : 'text/plain'});
  });
  await page.addInitScript(() => {
    localStorage.setItem('afrotools_cookie_consent','declined');
    localStorage.setItem('aft_theme','dark');
    window.AFROTOOLS_TEST_DISABLE_ANALYTICS = true;
  });
  return {errors, writes};
}

async function geometry(page, label, heading) {
  return page.evaluate(({label, heading}) => {
    const element = document.querySelector(label), title = document.querySelector(heading);
    const a = element.getBoundingClientRect(), b = title.getBoundingClientRect(), css = getComputedStyle(element);
    return {label:element.textContent.trim(), className:element.className, labelBottom:a.bottom, titleTop:b.top,
      opacity:css.opacity, transform:css.transform, width:innerWidth, documentWidth:document.documentElement.scrollWidth};
  }, {label, heading});
}

async function readableLabel(page, route, testInfo, phase) {
  await page.locator(route.label).scrollIntoViewIfNeeded();
  await expect.poll(async () => {
    const g = await geometry(page, route.label, route.heading);
    return Number(g.opacity) === 1 && g.labelBottom <= g.titleTop;
  }).toBe(true);
  const result = await geometry(page, route.label, route.heading);
  await testInfo.attach(phase, {body:JSON.stringify(result,null,2),contentType:'application/json'});
  expect(result.documentWidth).toBeLessThanOrEqual(result.width + 1);
}

const routes = [
  {name:'Contact', path:'/contact/', label:'.hero-inner .eyebrow', heading:'.hero h1'},
  {name:'Uganda', path:'/uganda/ug-paye', label:'.ng-faq-header .eyebrow', heading:'.ng-faq-title'}
];

for (const route of routes) {
  test(`${route.name} desktop loaded reveal label stays above its heading after phone resize`, async ({page,baseURL},testInfo) => {
    await page.setViewportSize({width:1280,height:900});
    await page.emulateMedia({reducedMotion:'no-preference'});
    const guard = await protect(page,baseURL);
    await page.goto(route.path);
    await expect(page.locator('#afro-animations-js')).toBeAttached();
    await expect(page.locator(route.label)).toHaveClass(/\brv\b/);
    await testInfo.attach('before-settling',{body:JSON.stringify(await geometry(page,route.label,route.heading)),contentType:'application/json'});
    await readableLabel(page,route,testInfo,'desktop');
    await expect(page.locator(route.label)).toHaveClass(/\bin\b/);
    await page.setViewportSize({width:320,height:800});
    await readableLabel(page,route,testInfo,'phone-after-desktop');
    await page.screenshot({path:testInfo.outputPath(`${route.name.toLowerCase()}-phone.png`)});
    expect(guard).toEqual({errors:[],writes:[]});
  });

  for (const [name,width,motion] of [['initial phone',320,'no-preference'],['reduced motion desktop',1280,'reduce']]) {
    test(`${route.name} label is readable on ${name}`, async ({page,baseURL},testInfo) => {
      await page.setViewportSize({width,height:900});
      await page.emulateMedia({reducedMotion:motion});
      const guard = await protect(page,baseURL);
      await page.goto(route.path);
      await expect(page.locator('afro-navbar #themeToggle')).toBeAttached();
      await readableLabel(page,route,testInfo,name);
      expect(guard).toEqual({errors:[],writes:[]});
    });
  }
}

for (const [name,path] of [['Home','/'],['AfroKitchen','/tools/afrokitchen/']]) {
  test(`${name} existing reveal targets still settle in view`, async ({page,baseURL},testInfo) => {
    await page.setViewportSize({width:1280,height:900});
    await page.emulateMedia({reducedMotion:'no-preference'});
    const guard = await protect(page,baseURL);
    await page.goto(path);
    await expect(page.locator('#afro-animations-js')).toBeAttached();
    const targets = page.locator('.rv, .rv-scale');
    expect(await targets.count()).toBeGreaterThan(2);
    for (let i=0;i<3;i+=1) {
      const target=targets.nth(i);
      await target.scrollIntoViewIfNeeded();
      await expect.poll(()=>target.evaluate(e=>{
        const css=getComputedStyle(e),rect=e.getBoundingClientRect();
        const settled=css.transform==='none' || new DOMMatrixReadOnly(css.transform).isIdentity;
        return Number(css.opacity)===1 && settled && rect.width>0 && rect.height>0;
      })).toBe(true);
    }
    await testInfo.attach('existing-target-count',{body:String(await targets.count()),contentType:'text/plain'});
    expect(guard).toEqual({errors:[],writes:[]});
  });
}
