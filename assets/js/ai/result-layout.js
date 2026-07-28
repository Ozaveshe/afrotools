/*
 * AfroTools AI — result-surface progressive disclosure.
 *
 * WHY
 *
 * A single query rendered ~7,900px. The direct answer — the only part that
 * answers the question — was 206px of it. Between the answer and the one
 * button worth pressing sat 2,387px: prefill chips, "you'll get", "before you
 * act", four EMPTY metric cards ("Quote needed", "Needs classification"), a
 * nine-item verification checklist, four more tool cards, seven export
 * buttons, a Pro upsell and a consent panel. Below that, 2,272px of
 * browse-the-directory content that has no reason to be on screen once the
 * user has already asked something.
 *
 * WHAT THIS DOES, AND DELIBERATELY DOES NOT
 *
 * Layout only. It does not touch what the orchestrator renders, so the router
 * contract and every existing behaviour are untouched — this moves nodes that
 * already exist into a <details>, and sets a body class. If it throws or never
 * runs, the page degrades to exactly its previous behaviour: everything
 * visible, nothing lost. That is why the primary/secondary split is expressed
 * as selectors rather than a rewrite of the renderer.
 *
 * Empty metric cards are hidden rather than removed, because the renderer owns
 * them and will rewrite them on the next run.
 */
(function (win, doc) {
  "use strict";

  // Stays visible: what it found, how sure it is, the one detail it needs,
  // and the button that continues. Everything else is reference material.
  var PRIMARY = [".ai-card-head", ".ai-result-summary", ".ai-actions.is-primary", ".ai-clarification"];

  function isPrimary(node) {
    return PRIMARY.some(function (selector) {
      return node.matches && node.matches(selector);
    });
  }

  /** A metric card with no value is worse than no card — it reads as a result. */
  var EMPTY_VALUE = /^(add |needs |quote needed|not available|—|-)?$|^(add|needs|quote|check)\b/i;

  function hideEmptyMetrics(root) {
    var cards = root.querySelectorAll(".ai-import-plan [class*='metric'], .ai-energy-metrics > *, .ai-finance-metrics > *, .ai-local-life-metrics > *");
    [].forEach.call(cards, function (card) {
      var value = card.querySelector("strong, .ai-metric-value, b");
      if (!value) return;
      var text = String(value.textContent || "").trim();
      if (text && EMPTY_VALUE.test(text)) card.hidden = true;
    });
  }

  function collapseCard(card) {
    if (!card || card.dataset.afroCollapsed === "1") return;

    var secondary = [].filter.call(card.children, function (node) {
      return !isPrimary(node) && node.nodeType === 1;
    });
    // Nothing worth hiding, or the card is already minimal.
    if (secondary.length < 3) return;

    var details = doc.createElement("details");
    details.className = "ai-more";
    var summary = doc.createElement("summary");
    summary.textContent = "Details, checks and export options";
    details.appendChild(summary);
    var body = doc.createElement("div");
    body.className = "ai-more-body";
    details.appendChild(body);

    // The disclosure lives in a full-width row below the columns, so opening it
    // never reflows the card. Fall back to the card itself if the shell is
    // missing, which keeps this working on any page that lacks the two-column
    // layout rather than dropping the content entirely.
    var host = detailsHost();
    (host || card).appendChild(details);
    secondary.forEach(function (node) { body.appendChild(node); });

    hideEmptyMetrics(body);
    card.dataset.afroCollapsed = "1";
  }

  /*
   * The detail opens in its own full-width row, below the two columns.
   *
   * The first attempt collapsed the shell to one column when the disclosure
   * opened. It did give the detail the full width, but measured at 1440px the
   * card jumped 546px to the left and grew 406px wider on a single click, while
   * the answer — which has its own max-width — stayed 540px and re-centred,
   * leaving big margins on both sides. Expanding a section should not move the
   * thing you were reading.
   *
   * Hosting the <details> in a sibling row means opening it moves nothing: the
   * columns keep their geometry and the detail simply appears underneath at
   * full width. The renderer still owns the card; the host is cleared and
   * refilled on every render, so a new query cannot leave stale detail behind.
   */
  function detailsHost() {
    var shell = doc.getElementById("aiAnswerShell");
    if (!shell || !shell.parentNode) return null;
    var host = doc.getElementById("aiDetailsHost");
    if (!host) {
      host = doc.createElement("div");
      host.id = "aiDetailsHost";
      host.className = "ai-details-host";
      shell.parentNode.insertBefore(host, shell.nextSibling);
    }
    return host;
  }

  function scrollToAnswer() {
    var shell = doc.getElementById("aiAnswerShell");
    if (!shell || typeof shell.scrollIntoView !== "function") return;
    // Wait a frame so the card has laid out and the target is where we think.
    (win.requestAnimationFrame || function (fn) { setTimeout(fn, 16); })(function () {
      try {
        var reduce = win.matchMedia && win.matchMedia("(prefers-reduced-motion: reduce)").matches;
        shell.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      } catch (err) {
        shell.scrollIntoView();
      }
    });
  }

  function syncResultState() {
    try {
      var state = doc.getElementById("aiResultState");
      var answer = doc.getElementById("aiDirectAnswer");
      var hasResult = (state && !state.hidden) || (answer && !answer.hidden);
      var appeared = !!hasResult && !doc.body.classList.contains("ai-has-result");
      doc.body.classList.toggle("ai-has-result", !!hasResult);
      /* Take the user to their answer.
       * The composer stack ran 1,037px tall, so on a laptop the result rendered
       * entirely below the fold and the page looked like nothing had happened.
       * Only on the transition into a result — never on a re-render — so this
       * cannot yank the page while someone is reading or scrolling. */
      if (appeared) scrollToAnswer();
      if (state && !state.hidden) {
        // A card the renderer has just rewritten has lost its marker, which is
        // the signal that the hosted detail belongs to the previous query.
        var fresh = state.querySelector('.ai-workflow-card:not([data-afro-collapsed="1"])');
        var host = doc.getElementById("aiDetailsHost");
        if (fresh && host) host.innerHTML = "";
        [].forEach.call(state.querySelectorAll(".ai-workflow-card"), collapseCard);
      }
      if (!hasResult) {
        var idleHost = doc.getElementById("aiDetailsHost");
        if (idleHost) idleHost.innerHTML = "";
      }
    } catch (err) { /* layout enhancement only — never block the router */ }
  }

  function init() {
    syncResultState();
    var host = doc.getElementById("aiAnswerShell") || doc.body;
    if (!win.MutationObserver) return;
    // The orchestrator re-renders on every query and follow-up.
    var observer = new win.MutationObserver(function () { syncResultState(); });
    observer.observe(host, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})(window, document);
