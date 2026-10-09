// Netlify verifies its platform-event signature before invoking this function.
// Existing Forms spam filtering and the public newsletter form remain intact.
const { captureSubscription } = require('./_shared/newsletter');
exports.handler = async function (event) {
  const { payload } = JSON.parse(event.body || '{}');
  const result = await captureSubscription(payload);
  console.log('[newsletter-subscription]', result.status);
  return { statusCode: 200, body: result.status };
};
