/**
 * AfroTools — Recent Tools Tracker
 * Stores recently visited tools in localStorage for "My Tools" section
 */
var STORAGE_KEY = 'afrotools-recent-tools';
var MAX_RECENT = 10;

function addRecent(slug, name, url, icon) {
  var recents = getRecents();
  recents = recents.filter(function(r) { return r.slug !== slug; });
  recents.unshift({ slug: slug, name: name, url: url, icon: icon, visitedAt: new Date().toISOString() });
  recents = recents.slice(0, MAX_RECENT);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recents)); } catch(e) {}
}

function getRecents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch(e) { return []; }
}

function clearRecents() {
  try { localStorage.removeItem(STORAGE_KEY); } catch(e) {}
}

// ES module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addRecent: addRecent, getRecents: getRecents, clearRecents: clearRecents };
}

// Also expose globally for non-module pages
window.AfroRecent = { add: addRecent, get: getRecents, clear: clearRecents };
