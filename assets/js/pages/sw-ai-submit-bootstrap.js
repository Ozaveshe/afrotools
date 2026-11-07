(function initSwahiliAiSubmitBootstrap(root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else factory().boot(root);
})(typeof globalThis !== "undefined" ? globalThis : this, function createSwahiliAiSubmitBootstrap() {
  "use strict";

  function boot(root) {
    var input = root.document && root.document.getElementById("aiSwQuery");
    var form = input && input.form;
    if (!form || typeof root.URLSearchParams !== "function") return;
    if (!input.value) input.value = new root.URLSearchParams(root.location.search || "").get("q") || "";
    var pending = false;
    var timer = null;
    var loadingComplete = false;
    function clearTimer() {
      if (timer !== null) root.clearTimeout(timer);
      timer = null;
    }
    function showProgress(waiting) {
      var result = root.document.getElementById("aiSwResult");
      if (!result) {
        result = root.document.createElement("div");
        result.id = "aiSwResult";
        result.setAttribute("role", "status");
        result.setAttribute("aria-live", "polite");
        form.appendChild(result);
      }
      result.replaceChildren();
      var message = root.document.createElement("p");
      message.textContent = waiting ? "Inapakia utafutaji wa zana…" : "Unaweza kujaribu tena au kufungua katalogi ya zana za Kiswahili.";
      result.appendChild(message);
      var link = root.document.createElement("a");
      link.href = "/sw/zana-zote/";
      link.textContent = "Vinjari zana za Kiswahili";
      result.appendChild(link);
    }
    root.AfroToolsAISwEntryQueue = {
      take: function () {
        var submitted = pending;
        pending = false;
        clearTimer();
        return submitted;
      }
    };
    form.addEventListener("submit", function (event) {
      if (form.dataset.aiRouterReady === "true") return;
      event.preventDefault();
      if (!input.value.trim()) {
        pending = false;
        clearTimer();
        if (root.document.getElementById("aiSwResult")) showProgress(false);
        input.focus();
        return;
      }
      pending = true;
      showProgress(!loadingComplete);
      if (!loadingComplete && timer === null) timer = root.setTimeout(function () {
        timer = null;
        if (pending) showProgress(false);
      }, 8000);
    });
    root.document.addEventListener("DOMContentLoaded", function () {
      loadingComplete = true;
      if (pending && form.dataset.aiRouterReady !== "true") {
        clearTimer();
        showProgress(false);
      }
    }, { once: true });
  }

  return { boot: boot };
});
