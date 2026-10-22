const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

test('Text QR starts consistently and edited or empty content cannot export an old code',async({page})=>{
 await page.goto('/tools/qr-generator/');
 await expect(page.locator('#guideTitle')).toHaveText('Plain Text QR');
 await expect(page.locator('#guideFilename')).toHaveText('text-qr');
 await expect(page.locator('[data-starter].active')).toHaveCount(0);
 await page.locator('#textInput').fill('Synthetic original QR');
 await page.locator('#generateBtn').click();
 await expect(page.locator('#previewCard')).toBeVisible();
 await expect(page.locator('#downloadPNG')).toBeEnabled();
 await page.locator('#textInput').fill('');
 await expect(page.locator('#previewCard')).toBeHidden();
 await expect(page.locator('#qrcode canvas')).toHaveCount(0);
 await expect(page.locator('#downloadPNG')).toBeDisabled();
 await expect(page.locator('#downloadSVG')).toBeDisabled();
 await page.locator('#generateBtn').click();
 await expect(page.locator('#qrStatus')).toContainText('required content');
 await page.locator('#textInput').fill('Synthetic replacement QR');
 await page.locator('#generateBtn').click();
 const download=page.waitForEvent('download');
 await page.locator('#downloadPNG').click();
 const saved=await download;
 expect(saved.suggestedFilename()).toBe('text-qr.png');
 const png=fs.readFileSync(await saved.path());
 expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');
 expect(png.readUInt32BE(16)).toBeGreaterThan(256);
 const edge=await page.evaluate(async base64=>{
  const image=await createImageBitmap(new Blob([Uint8Array.from(atob(base64),c=>c.charCodeAt(0))],{type:'image/png'}));
  const canvas=new OffscreenCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
  const pixels=ctx.getImageData(0,0,image.width,1).data;
  return [...pixels].every((value,index)=>value===255);
 },png.toString('base64'));
 expect(edge).toBe(true);
});

test('Mode, starter and colour edits require regeneration and preserve the chosen QR type',async({page})=>{
 await page.goto('/tools/qr-generator/');
 await page.locator('[data-starter="wifi"]').click();
 await expect(page.locator('[data-mode="wifi"]')).toHaveClass(/on/);
 await page.locator('#generateBtn').click();
 await expect(page.locator('#downloadSVG')).toBeEnabled();
 await page.locator('#wifiPassword').fill('new-test-password');
 await expect(page.locator('#previewCard')).toBeHidden();
 await page.locator('#generateBtn').click();
 await page.locator('[data-mode="url"]').click();
 await expect(page.locator('#previewCard')).toBeHidden();
 await expect(page.locator('#guideFilename')).toHaveText('link-qr');
 await page.locator('#urlInput').fill('https://example.test/qr');
 await page.locator('#generateBtn').click();
 await page.locator('#darkColor').evaluate(n=>{n.value='#123456';n.dispatchEvent(new Event('input',{bubbles:true}));});
 await expect(page.locator('#downloadSVG')).toBeDisabled();
 await page.locator('#generateBtn').click();
 const download=page.waitForEvent('download');
 await page.locator('#downloadSVG').click();
 expect((await download).suggestedFilename()).toBe('link-qr.svg');
 await page.locator('[data-starter="contact"]').click();
 await expect(page.locator('#previewCard')).toBeHidden();
 await page.locator('#generateBtn').click();
 await expect(page.locator('#downloadPNG')).toBeEnabled();
 await expect(page.locator('#guideFilename')).toHaveText('business-contact-qr');
});

test('An unannounced payload change is still rejected by the export boundary',async({page})=>{
 await page.goto('/tools/qr-generator/');
 await page.locator('#textInput').fill('Synthetic original QR');
 await page.locator('#generateBtn').click();
 // Models a programmatic form restoration that does not dispatch an input event.
 await page.locator('#textInput').evaluate(n=>{n.value='Different restored QR';});
 let downloads=0;page.on('download',()=>downloads++);
 await page.locator('#downloadPNG').click();
 await expect(page.locator('#previewCard')).toBeHidden();
 await expect(page.locator('#downloadPNG')).toBeDisabled();
 await expect(page.locator('#qrStatus')).toContainText('Generate a new QR');
 expect(downloads).toBe(0);
});
