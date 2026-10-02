const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const manifest = JSON.parse(fs.readFileSync('tools/afrokitchen/seo-manifest.json', 'utf8'));
test('old query recipe links reach the published canvas and retain planned servings', async ({ page }) => {
  await page.goto('/tools/afrokitchen/recipe.html?slug=jollof-rice-ng&plan_servings=4');
  await expect(page).toHaveURL(/\/recipes\/jollof-rice-ng\/\?plan_servings=4$/);
  await expect(page.locator('.ak-visual-recipe')).toBeVisible();
  await expect(page.locator('#ak-static-servings')).toHaveText('4');
});
test('all published recipe pages contain the visual canvas and retain recipe data', async () => {
  for (const recipe of manifest.recipes.filter(recipe => recipe.generated_in_wave)) {
    const html = fs.readFileSync(`tools/afrokitchen/recipes/${recipe.slug}/index.html`, 'utf8');
    expect(html).toContain('ak-visual-recipe');
    expect(html).toContain('/tools/afrokitchen/visual-recipe.js');
    expect(html).not.toContain('<section class="ak-hero" style="background-image:');
    const payload = JSON.parse(html.match(/window\.__AK_STATIC_RECIPE = (.*?);<\/script>/)[1]);
    expect(payload.slug).toBe(recipe.slug);
    expect((html.match(/class="ak-ing-art"/g)||[]).length).toBe(payload.ingredients.length);
    expect((html.match(/class="ak-step"/g)||[]).length).toBe(payload.steps.length);
  }
});
for (const variant of [{width:320,theme:'light'},{width:390,theme:'dark'},{width:1280,theme:'light'}]) {
  test.describe(`${variant.width} ${variant.theme}`, () => {
    test.use({ viewport:{width:variant.width,height:900},colorScheme:variant.theme });
    test('ingredient cards, serving changes, independent timers and full method', async ({ page }) => {
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(theme=>{localStorage.setItem('aft_theme',theme);localStorage.setItem('afrotools_cookie_consent','declined');},variant.theme);
      await page.goto('/tools/afrokitchen/recipes/jollof-rice-ng/');
      await expect(page.locator('.ak-ing-art')).toHaveCount(14);
      const checkbox=page.locator('#ak-static-ingredients input').first();
      await checkbox.check();
      await page.getByRole('button',{name:'Increase servings',exact:true}).click();
      await expect(page.locator('#ak-static-servings')).toHaveText('7');
      await expect(page.locator('.ak-ing-art')).toHaveCount(14);
      await expect(checkbox).toBeChecked();
      await expect(page.locator('#ak-static-ingredients .ak-ing-item').nth(1)).toContainText('7 medium');
      await page.clock.install();
      await page.locator('#ak-timer-toggle-1').click();
      await page.locator('[data-ak-visual-next]').click();
      await expect(page.locator('#step-1')).toBeHidden();
      await expect(page.locator('#step-2')).toBeVisible();
      await page.clock.runFor(2000);
      await expect(page.locator('.ak-running-timers')).toContainText('29:58');
      await page.locator('.ak-running-timers button').click();
      await expect(page.locator('#step-1')).toBeVisible();
      await page.locator('#ak-timer-toggle-1').click();
      const pausedTime = await page.locator('#ak-timer-display-1').textContent();
      await page.clock.runFor(2000);
      await expect(page.locator('#ak-timer-display-1')).toHaveText(pausedTime);
      await page.locator('[data-ak-full-method]').click();
      await expect(page.locator('.ak-step:visible')).toHaveCount(6);
      await page.locator('[data-ak-cook-mode]').click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.ak-step:visible')).toHaveCount(6);
      const geometry=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,background:getComputedStyle(document.querySelector('.ak-hero')).backgroundImage}));
      expect(geometry.overflow).toBeLessThanOrEqual(1);expect(geometry.background).toBe('none');expect(errors).toEqual([]);
    });
  });
}
test('no JavaScript still exposes ingredients and every cooking step', async ({ browser }) => {
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('http://127.0.0.1:'+(process.env.PORT||4173)+'/tools/afrokitchen/recipes/jollof-rice-ng/');
  await expect(page.locator('.ak-ing-art')).toHaveCount(14);await expect(page.locator('.ak-step:visible')).toHaveCount(6);await context.close();
});
