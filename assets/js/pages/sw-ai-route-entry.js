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
    var input = root.document && root.document.getElementById("aiSwQuery");
    if (input && !input.value && !root.AfroToolsAISwEntryQueue) input.value = params.get("q") || "";
    var form = input && input.form;
    var lastQuery = null;
    function submit(event) {
      event.preventDefault();
      var query = input.value.trim();
      if (!query) {
        lastQuery = null;
        var previous = root.document.getElementById("aiSwResult");
        if (previous) {
          previous.replaceChildren();
          previous.textContent = "Andika unachotaka kufanya, kisha tafuta zana.";
        }
        input.focus();
        return;
      }
      if (query === lastQuery && root.document.getElementById("aiSwResult")) return;
      var router = root.AfroToolsAIIntentRouter;
      var manifest = root.AfroToolsAIToolManifest;
      var decision = null;
      try {
        if (router && manifest) decision = router.routeDeterministically(query, {
          locale: "sw", manifest: manifest.getToolManifestForRouter()
        });
      } catch (error) {
        // Keep discovery usable if a cached dependency or local router fails.
      }
      lastQuery = decision ? query : null;
      var route = decision && resolveToolRoute(decision.selectedToolId, root.AfroToolsAISwahiliRouteMap);
      var result = root.document.getElementById("aiSwResult");
      if (!result) {
        result = root.document.createElement("div");
        result.id = "aiSwResult";
        result.setAttribute("role", "status");
        result.setAttribute("aria-live", "polite");
        form.appendChild(result);
      }
      result.replaceChildren();
      var detail = root.document.createElement("p");
      detail.textContent = route
        ? "Fungua zana hapa chini, kisha hakiki nchi na ujaze taarifa zako ndani ya zana."
        : "Vinjari zana za Kiswahili au tafuta kwa jina la zana, kama PAYE, CV au PDF.";
      result.appendChild(detail);
      if (route && decision.clarificationQuestion) {
        var clarification = root.document.createElement("p");
        clarification.textContent = decision.clarificationQuestion;
        result.appendChild(clarification);
      }
      var link = root.document.createElement("a");
      link.className = "ai-local-button";
      link.href = route || "/sw/zana-zote/";
      var tool = route && (root.AFRO_TOOLS || []).find(function (item) {
        return String(item.href || "").replace(/\/$/, "") === route.replace(/\/$/, "");
      });
      link.textContent = route ? "Fungua: " + (tool ? tool.name : "zana ya Kiswahili") : "Vinjari zana za Kiswahili";
      result.appendChild(link);
    }
    if (form) {
      form.addEventListener("submit", submit);
      form.dataset.aiRouterReady = "true";
      var queue = root.AfroToolsAISwEntryQueue;
      if (queue && queue.take()) submit({ preventDefault: function () {} });
    }
    var toolId = params.get("tool");
    if (!toolId) return;
    var routeMap = root.AfroToolsAISwahiliRouteMap;
    var route = resolveToolRoute(toolId, routeMap);
    if (route) {
      root.location.replace(route + "?source=sw-ai-tool");
      return;
    }
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
