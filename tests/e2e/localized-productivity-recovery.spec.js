const { test, expect } = require('@playwright/test');
const locales = [{lang:'fr',pomodoro:'/fr/tools/minuteur-pomodoro/',countdown:'/fr/tools/compte-a-rebours/'},{lang:'sw',pomodoro:'/sw/zana/pomodoro/',countdown:'/sw/zana/hesabu-siku-za-tukio/'}];
for (const locale of locales) for (const width of [390,1280]) {
 test(`${locale.lang} ${width}: Pomodoro configuration survives focus, pause and invalidation`, async ({page})=>{
  await page.setViewportSize({width,height:900});await page.clock.install({time:new Date('2026-07-29T12:00:00Z')});
  await page.goto(locale.pomodoro);await page.clock.pauseAt(new Date("2026-07-29T12:01:00Z"));await page.locator('[name="focusMinutes"]').fill('1');
  await page.locator('[data-business-form]').evaluate(form=>form.requestSubmit());
  const start=page.locator('[data-pomodoro-role="start"]'),display=page.locator('[data-pomodoro-role="clock"]');
  await expect(start).toBeEnabled();await expect(display).toHaveText('1:00');await start.click();await page.clock.fastForward(20000);await expect(display).toHaveText('0:40');
  await start.click();await page.clock.fastForward(90000);await expect(display).toHaveText('0:40');
  await page.locator('[name="focusMinutes"]').fill('2');await expect(start).toBeDisabled();await page.clock.fastForward(90000);await expect(display).toHaveText('--:--');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 });
 test(`${locale.lang} ${width}: countdown remains live after configuration and stops on edit`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.clock.install({time:new Date('2026-07-29T12:00:00Z')});await page.goto(locale.countdown);await page.clock.pauseAt(new Date("2026-07-29T12:01:00Z"));
  await page.locator('[name="eventName"]').fill('Synthetic countdown');await page.locator('[name="eventDate"]').fill('2026-07-29');await page.locator('[name="eventTime"]').fill('12:02');
  await page.locator('[data-business-form]').evaluate(form=>form.requestSubmit());const save=page.locator('[data-countdown-role="save"]');await expect(save).toBeEnabled();
  await page.clock.fastForward(20000);await expect(page.locator('[data-result-metrics] strong').nth(3)).toHaveText('40');
  await page.locator('[name="eventTime"]').fill('12:03');await expect(save).toBeDisabled();await expect(page.locator('[data-business-result]')).toBeHidden();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
 });
}
