'use strict';

// Only the two optional resources from an unloading French homepage qualify.
// Missing assets, HTTP errors and failures in the destination document stay failures.
function isExpectedHomepageNavigationAbort({ url, error, requestDocumentUrl, navigation }) {
  if (!navigation || !['NS_BINDING_ABORTED', 'Load request cancelled'].includes(error)) return false;
  try {
    const resource = new URL(url);
    const from = new URL(navigation.from);
    const to = new URL(navigation.to);
    const documentUrl = new URL(requestDocumentUrl);
    return from.origin === to.origin && resource.origin === from.origin
      && documentUrl.href === from.href
      && from.pathname === '/fr/' && to.pathname === '/fr/all-tools/'
      && (resource.pathname === '/fr/manifest.json'
        || /^\/assets\/js\/bundles\/chat\.[a-f0-9]+\.min\.js$/.test(resource.pathname));
  } catch (_) { return false; }
}

module.exports = { isExpectedHomepageNavigationAbort };
