(function initSwahiliAiRouteEntry(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else factory().boot(root);
})(typeof globalThis !== "undefined" ? globalThis : this, function createSwahiliAiRouteEntry() {
  "use strict";

  function resolveToolRoute(toolId, routeMap) {
    var cleanId = String(toolId || "").trim();
    var ids = routeMap && routeMap.ids;
    return cleanId && ids && typeof ids[cleanId] === "string" ? ids[cleanId] : null;
  }

  function boot(root) {
    if (!root || !root.location || typeof root.URLSearchParams !== "function") return;
    var params = new root.URLSearchParams(root.location.search || "");
    var toolId = params.get("tool");
    if (!toolId) return;
    var routeMap = root.AfroToolsAISwahiliRouteMap;
    var route = resolveToolRoute(toolId, routeMap);
    if (route) {
      root.location.replace(route + "?source=sw-ai-tool");
      return;
    }
    var input = root.document && root.document.getElementById("aiSwQuery");
    if (input && !input.value) input.value = toolId.replace(/[-_]+/g, " ");
    var note = root.document && root.document.querySelector(".ai-local-note");
    if (note) {
      note.dataset.aiToolStatus = "not-accepted";
      note.textContent = "Zana hii bado haijathibitishwa kwa Kiswahili. Tumia utafutaji kupata zana ya Kiswahili iliyokaguliwa.";
    }
  }

  return {
    boot: boot,
    resolveToolRoute: resolveToolRoute
  };
});
