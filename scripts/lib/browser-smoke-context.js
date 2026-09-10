'use strict';

// Playwright's serviceWorkers:block init script reads navigator.serviceWorker
// unguarded in every frame. Opaque-origin sandbox frames throw SecurityError.
// Use its same registration suppression with only that getter exception handled.
async function createSmokeContext(browser, options = {}) {
  const context = await browser.newContext({ ...options, serviceWorkers: 'allow' });
  await context.addInitScript(() => {
    let serviceWorker;
    try { serviceWorker = navigator.serviceWorker; }
    catch (error) {
      if (error.name === 'SecurityError') return;
      throw error;
    }
    if (serviceWorker) serviceWorker.register = async () => {
      console.warn('Service Worker registration blocked by reliability smoke');
    };
  });
  return context;
}
module.exports = { createSmokeContext };
