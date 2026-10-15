'use strict';

// Playwright1.59.1 registers the native chooser subscription asynchronously.
// Await its actual response before the original keyboard activation. Requalify
// this test-only bridge when changing SDK versions; never replace it with delay.
async function keyboardFileChooser(page, key) {
  if (require('playwright-core/package.json').version !== '1.59.1') {
    throw new Error('Native file chooser readiness requires reviewed Playwright1.59.1');
  }
  const connection = page && page._connection;
  if (!connection || typeof connection.sendMessageToServer !== 'function' ||
      typeof page.waitForEvent !== 'function' || typeof page.keyboard?.press !== 'function') {
    throw new Error('Native file chooser readiness interface changed');
  }
  if (key !== 'Enter' && key !== 'Space') throw new Error('Expected native chooser keyboard key');
  const originalSend = connection.sendMessageToServer;
  let subscription, chooser;
  connection.sendMessageToServer = function(object, method, params, options) {
    const response = originalSend.call(this, object, method, params, options);
    if (object === page && method === 'updateSubscription' && params?.event === 'fileChooser' && params.enabled === true) {
      subscription = response;
    }
    return response;
  };
  try {
    chooser = page.waitForEvent('filechooser');
  } finally {
    connection.sendMessageToServer = originalSend;
  }
  // Keep the native waiter's close/crash/timeout disposal. Observe its rejection
  // if readiness/activation fails first; do not replace or suppress that failure.
  chooser.catch(() => {});
  if (!subscription || typeof subscription.then !== 'function') {
    throw new Error('Native file chooser subscription was not captured synchronously');
  }
  await subscription;
  await page.keyboard.press(key);
  return await chooser;
}

module.exports = { keyboardFileChooser };
