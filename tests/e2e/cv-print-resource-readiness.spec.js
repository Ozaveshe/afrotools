const {test,expect}=require('@playwright/test');
const http=require('http'),fs=require('fs');
test.use({trace:'off',screenshot:'off',video:'off'});
test('automatic print waits for delayed local font and stylesheet',async({page})=>{
 const font=fs.readFileSync('assets/fonts/noto-sans/NotoSans-Regular.ttf'),css=fs.readFileSync('assets/css/design-system.css');let requests=0,styleRequests=0;
 const server=http.createServer((req,res)=>{const isCss=req.url.includes('style.css');if(isCss)styleRequests++;else requests++;setTimeout(()=>{res.writeHead(200,{'Content-Type':isCss?'text/css':'font/ttf','Access-Control-Allow-Origin':'*','Cache-Control':'no-store'});res.end(isCss?css:font);},isCss?1200:1800);});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try{await page.goto('/tools/cv-builder/');await page.waitForFunction(()=>window.CVExportPdfQuality);await page.waitForTimeout(1100);
 await page.evaluate(port=>{Object.assign(CVApp.getState().data,{fn:'Élodie',ln:'Mwang’ombe',summary:'Synthetic local print readiness fixture'});CVApp.renderAll();const nativeOpen=window.open;window.open=function(){const popup=nativeOpen.apply(window,arguments);const write=popup.document.write.bind(popup.document);popup.document.write=function(html){return write(html.replace('/assets/css/design-system.css',`http://127.0.0.1:${port}/style.css`).replace('</head>',`<style>@font-face{font-family:DelayedCV;src:url(http://127.0.0.1:${port}/font.ttf)}#cvpreview *{font-family:DelayedCV!important}</style></head>`));};popup.print=function(){popup.printObservation={status:popup.document.fonts.status,fontLoaded:popup.document.fonts.check('12px DelayedCV'),styles:[...popup.document.querySelectorAll('link[rel=stylesheet]')].every(n=>n.sheet)};};return popup;};},server.address().port);
 const pending=page.waitForEvent('popup');await page.evaluate(()=>CVExportUpgrade.printCv());const popup=await pending;await popup.waitForFunction(()=>window.printObservation);expect(requests).toBeGreaterThan(0);expect(styleRequests).toBe(1);expect(await popup.evaluate(()=>printObservation)).toEqual({status:'loaded',fontLoaded:true,styles:true});await popup.close();
 }finally{await new Promise(r=>server.close(r));}
});
