const {test,expect}=require('@playwright/test');
for(const width of [320,390])test(`recovered common-factor answer is optional and usable at ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:900});
 await page.goto('/jamb/mathematics/1984/');
 const card=page.locator('[data-reviewed-question="mathematics-1984-24-693441758bb1"]');
 await expect(card).toContainText('a³ + 27b³');
 await expect(card.locator('details')).not.toHaveAttribute('open','');
 await card.locator('summary').focus();await page.keyboard.press('Enter');
 await expect(card.locator('details')).toHaveAttribute('open','');
 await expect(card.locator('details > p').first()).toHaveText('E: none');
 await expect(card.locator('details > p').last()).toContainText('which is not divisible by 2a + 3b');
 await expect(card).not.toContainText('Private:');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 await page.keyboard.press('Enter');await expect(card.locator('details')).not.toHaveAttribute('open','');
});
