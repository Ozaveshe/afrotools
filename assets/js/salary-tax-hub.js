(function () {
  "use strict";

  var INITIAL_RENDER_COUNT = 12;
  var lang = (document.documentElement.lang || "en").toLowerCase();
  var isSw = lang.indexOf("sw") === 0;

  var copy = {
    clearSearch: isSw ? "Futa utafutaji" : "Clear search",
    calculate: isSw ? "Kokotoa" : "Calculate",
    comingSoon: isSw ? "Inakuja hivi karibuni" : "Coming soon",
    live: isSw ? "● Inapatikana" : "● Live",
    soon: isSw ? "Inakuja" : "Soon",
    tool: isSw ? "zana" : "tool",
    tools: isSw ? "zana" : "tools",
    noToolsFound: isSw
      ? "Hakuna zana zilizopatikana — jaribu neno lingine."
      : "No tools found — try a different search term.",
    showMore: isSw ? "Onyesha" : "Show",
    moreRemaining: isSw ? "zimebaki" : "remaining",
  };

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getCountLabel(count) {
    if (isSw) {
      return count + " " + copy.tools;
    }
    return count + " " + (count === 1 ? copy.tool : copy.tools);
  }

  function createToolCard(tool, index, animate) {
    var isLive = tool.status === "live" || tool.status === "new";
    var imageWebp = "/assets/img/tools/" + tool.id + ".webp";
    var imageSvg = "/assets/img/tools/" + tool.id + ".svg";
    var classes = "htc" + (isLive ? "" : " htc--coming") + (animate ? " htc-animate" : "");
    var animationStyle = animate
      ? ' style="animation-delay:' + (Math.min(index, 11) * 0.035).toFixed(3) + 's"'
      : "";
    var badgeHtml = tool.status === "new"
      ? '<span class="htc-badge badge-new">New</span>'
      : isLive
        ? '<span class="htc-badge badge-live">' + copy.live + "</span>"
        : '<span class="htc-badge badge-soon">' + copy.soon + "</span>";

    var imageHtml =
      '<div class="htc-img" aria-hidden="true">' +
        '<img src="' + escapeHtml(imageWebp) + '" alt="" loading="lazy" decoding="async" onerror="this.src=\'' + escapeHtml(imageSvg) + "';this.onerror=function(){this.style.display='none';};\">" +
        '<span class="htc-img-ph">' + escapeHtml(tool.icon || "Tool") + "</span>" +
        '<div class="htc-img-chips">' +
          '<span class="htc-flag" aria-hidden="true">' + escapeHtml(tool.icon || "") + "</span>" +
          badgeHtml +
        "</div>" +
      "</div>";

    var bodyHtml =
      '<div class="htc-body">' +
        '<div class="htc-name">' + escapeHtml(tool.name) + "</div>" +
        '<div class="htc-desc">' + escapeHtml(tool.desc || "") + "</div>" +
      "</div>" +
      '<div class="htc-foot">' +
        '<span class="htc-cta">' +
          (isLive ? copy.calculate : copy.comingSoon) +
          (isLive
            ? '<svg class="htc-arrow" viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>'
            : "") +
        "</span>" +
      "</div>";

    if (isLive) {
      return '<a href="' + escapeHtml(tool.href || "#") + '" class="' + classes + '"' + animationStyle + ">" + imageHtml + bodyHtml + "</a>";
    }

    return '<div class="' + classes + '"' + animationStyle + ' role="article" aria-label="' + escapeHtml(tool.name) + " — " + escapeHtml(copy.comingSoon) + '">' + imageHtml + bodyHtml + "</div>";
  }

  function initHub() {
    var config = window.HUB_CONFIG;
    if (!config) {
      return;
    }

    var grid = document.getElementById("tool-grid");
    var countBadge = document.getElementById("tool-count");
    var searchInput = document.getElementById("hub-search");

    if (!grid) {
      return;
    }

    var order = new Map();
    (config.toolIds || []).forEach(function (toolId, index) {
      if (!order.has(toolId)) {
        order.set(toolId, index);
      }
    });

    var statusRank = { live: 0, new: 1 };
    var tools = (window.AFRO_TOOLS || [])
      .filter(function (tool) {
        return tool.category === "financial" && order.has(tool.id);
      })
      .sort(function (a, b) {
        var aRank = Object.prototype.hasOwnProperty.call(statusRank, a.status) ? statusRank[a.status] : 2;
        var bRank = Object.prototype.hasOwnProperty.call(statusRank, b.status) ? statusRank[b.status] : 2;
        if (aRank !== bRank) {
          return aRank - bRank;
        }
        return (order.get(a.id) || 0) - (order.get(b.id) || 0);
      });

    var clearButton = null;

    function removeLoadMore() {
      var existing = grid.querySelector(".shub-load-more-wrap");
      if (existing) {
        existing.remove();
      }
    }

    function renderLoadMore(allTools, offset) {
      var remaining = allTools.length - offset;
      if (remaining <= 0) {
        return;
      }

      var chunk = Math.min(remaining, INITIAL_RENDER_COUNT);
      var wrapper = document.createElement("div");
      wrapper.className = "shub-load-more-wrap";
      wrapper.innerHTML =
        '<button class="shub-load-more" type="button">' +
          copy.showMore +
          " " +
          chunk +
          " " +
          copy.tools +
          '<span class="shub-lm-rest"> — ' +
          remaining +
          " " +
          copy.moreRemaining +
          "</span>" +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>' +
        "</button>";

      grid.appendChild(wrapper);
      wrapper.querySelector(".shub-load-more").addEventListener("click", function () {
        wrapper.remove();
        var nextBatch = allTools.slice(offset, offset + INITIAL_RENDER_COUNT);
        grid.insertAdjacentHTML(
          "beforeend",
          nextBatch.map(function (tool, index) {
            return createToolCard(tool, offset + index, false);
          }).join("")
        );
        renderLoadMore(allTools, offset + INITIAL_RENDER_COUNT);
      });
    }

    function renderTools(filteredTools, animate) {
      removeLoadMore();

      if (countBadge) {
        countBadge.textContent = getCountLabel(filteredTools.length);
      }

      if (!filteredTools.length) {
        grid.innerHTML =
          '<div class="shub-empty">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            "<p>" + copy.noToolsFound + "</p>" +
          "</div>";
        return;
      }

      var initialSet = animate ? filteredTools.slice(0, INITIAL_RENDER_COUNT) : filteredTools;
      grid.innerHTML = initialSet.map(function (tool, index) {
        return createToolCard(tool, index, animate);
      }).join("");

      if (animate && filteredTools.length > INITIAL_RENDER_COUNT) {
        renderLoadMore(filteredTools, INITIAL_RENDER_COUNT);
      }
    }

    function filterTools(query) {
      var normalized = query.trim().toLowerCase();
      if (!normalized) {
        return tools;
      }

      return tools.filter(function (tool) {
        var countries = Array.isArray(tool.countries) ? tool.countries.join(" ").toLowerCase() : "";
        return (
          (tool.name || "").toLowerCase().indexOf(normalized) !== -1 ||
          (tool.desc || "").toLowerCase().indexOf(normalized) !== -1 ||
          countries.indexOf(normalized) !== -1 ||
          (tool.id || "").toLowerCase().indexOf(normalized) !== -1
        );
      });
    }

    if (searchInput) {
      var searchWrap = searchInput.closest(".shub-hero-search");
      if (searchWrap) {
        clearButton = document.createElement("button");
        clearButton.className = "shub-search-clear";
        clearButton.type = "button";
        clearButton.setAttribute("aria-label", copy.clearSearch);
        clearButton.innerHTML =
          '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        searchWrap.appendChild(clearButton);
        clearButton.addEventListener("click", function () {
          searchInput.value = "";
          searchInput.dispatchEvent(new Event("input"));
          searchInput.focus();
        });
      }

      searchInput.addEventListener("input", function () {
        var query = this.value.trim();
        if (clearButton) {
          clearButton.classList.toggle("visible", !!query);
        }

        var hasExactChip = false;
        document.querySelectorAll(".shub-country-chip").forEach(function (chip) {
          if ((chip.getAttribute("data-search") || "").toLowerCase() === query.toLowerCase()) {
            hasExactChip = true;
          }
        });

        if (!hasExactChip) {
          document.querySelectorAll(".shub-country-chip").forEach(function (chip) {
            chip.classList.remove("active");
          });
        }

        renderTools(filterTools(query), false);
      });
    }

    document.querySelectorAll(".shub-country-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var wasActive = this.classList.contains("active");
        document.querySelectorAll(".shub-country-chip").forEach(function (item) {
          item.classList.remove("active");
        });

        if (wasActive) {
          if (searchInput) {
            searchInput.value = "";
            searchInput.dispatchEvent(new Event("input"));
          } else {
            renderTools(tools, false);
          }
          return;
        }

        this.classList.add("active");
        var chipQuery = this.getAttribute("data-search") || "";
        if (searchInput) {
          searchInput.value = chipQuery;
          searchInput.dispatchEvent(new Event("input"));
        } else {
          renderTools(filterTools(chipQuery), false);
        }
      });
    });

    renderTools(tools, true);
  }

  if (typeof onRegistryReady === "function") {
    onRegistryReady(initHub);
  } else {
    document.addEventListener("DOMContentLoaded", function () {
      if (typeof AFRO_TOOLS !== "undefined") {
        initHub();
      } else {
        document.addEventListener("afrotools:registry-ready", initHub);
      }
    });
  }
})();
