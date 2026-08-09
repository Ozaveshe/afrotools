(function () {
  "use strict";
  var root = document.querySelector("[data-swfa-afrostream]"),
    engine = window.AfroStreamEngine;
  if (!root || !engine) return;
  var status = root.querySelector("[data-status]"),
    freshness = root.querySelector("[data-freshness]"),
    search = root.querySelector("[data-search]"),
    country = root.querySelector("[data-country]"),
    grid = root.querySelector("[data-results]"),
    exportsNode = root.querySelector("[data-exports]"),
    creators = [],
    visible = [],
    sourceState = "";
  function text(v) {
    return String(v == null ? "" : v);
  }
  function normalizeFallback(item) {
    return {
      name: text(item.name),
      country: text(item.country) || "Afrika",
      type: text(item.categories) || "Mtayarishi",
      followers: Number(item.total_followers || item.subscribers) || 0,
      score: Number(item.afro_score) || 0,
      slug: text(item.slug),
      avatar: text(item.avatar_url),
      _raw: item,
    };
  }
  function csv(rows) {
    return (
      "\ufeff" +
      rows
        .map(function (row) {
          return row
            .map(function (cell) {
              return '"' + text(cell).replace(/"/g, '""') + '"';
            })
            .join(",");
        })
        .join("\r\n")
    );
  }
  function download(name, type, body) {
    var url = URL.createObjectURL(new Blob([body], { type: type })),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 100);
  }
  function safeImage(value) {
    return /^\//.test(value) || /^https:\/\//.test(value)
      ? value
      : "/assets/img/tools/afrostream.webp";
  }
  function render() {
    var q = search.value.trim().toLocaleLowerCase("sw"),
      selected = country.value;
    visible = creators.filter(function (item) {
      return (
        (!q ||
          [item.name, item.country, item.type].some(function (v) {
            return text(v).toLocaleLowerCase("sw").includes(q);
          })) &&
        (!selected || item.country === selected)
      );
    });
    grid.replaceChildren();
    visible.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "swfa-result";
      card.innerHTML =
        '<img src="' +
        safeImage(item.avatar) +
        '" alt="" width="64" height="64" loading="lazy"><div><strong>' +
        text(item.name).replace(/[<>&]/g, "") +
        "</strong><span>" +
        text(item.country) +
        " · " +
        text(item.type) +
        " · " +
        new Intl.NumberFormat("sw-KE", { notation: "compact" }).format(
          item.followers,
        ) +
        " wafuasi</span></div>";
      grid.appendChild(card);
    });
    if (!visible.length) {
      var empty = document.createElement("p");
      empty.className = "swfa-status error";
      empty.textContent =
        "Hakuna wasifu katika data iliyopakiwa unaolingana na vichujio hivi.";
      grid.appendChild(empty);
    }
    status.textContent =
      visible.length + " wasifu unaoonyeshwa · " + sourceState + ".";
    exportsNode.hidden = !visible.length;
  }
  function countries() {
    Array.from(
      new Set(
        creators.map(function (item) {
          return item.country;
        }),
      ),
    )
      .sort()
      .forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        country.appendChild(option);
      });
  }
  function ready(list, state, fresh) {
    creators = list;
    sourceState = state;
    countries();
    render();
    freshness.textContent = fresh;
  }
  function loadFallback() {
    return fetch("/data/afrostream/creators-fallback.json", {
      credentials: "same-origin",
    })
      .then(function (response) {
        if (!response.ok) throw new Error("fallback");
        return response.json();
      })
      .then(function (data) {
        if (!Array.isArray(data.creators) || !data.creators.length)
          throw new Error("fallback");
        var meta = data.source || {};
        ready(
          data.creators.map(normalizeFallback),
          "snapshot ya kumbukumbu",
          "Hali: fallback iliyohifadhiwa. " +
            text(meta.snapshot_label) +
            "; ilikaguliwa " +
            text(meta.reviewed_at) +
            "; freshness ya vipimo: " +
            text(meta.metrics_freshness) +
            ". Thibitisha kwenye jukwaa asili kabla ya uamuzi.",
        );
      });
  }
  status.textContent = "Inapakia data ya umma ya AfroStream…";
  engine
    .loadAll()
    .then(function (data) {
      if (!Array.isArray(data.creators) || !data.creators.length)
        throw new Error("live-empty");
      var dates = data.creators
          .map(function (item) {
            return Date.parse((item._raw || {}).updated_at || "");
          })
          .filter(Number.isFinite),
        latest = dates.length
          ? new Date(Math.max.apply(Math, dates)).toISOString().slice(0, 10)
          : "haikutolewa";
      ready(
        data.creators,
        "data ya API ya umma",
        "Tarehe mpya zaidi iliyorudishwa na rekodi: " +
          latest +
          ". Hii haithibitishi kuwa kila wasifu ni wa sasa.",
      );
    })
    .catch(function () {
      loadFallback().catch(function () {
        sourceState = "hakuna data";
        status.textContent =
          "Data ya AfroStream haipatikani. Hakuna wasifu wa kubuni unaoonyeshwa.";
        freshness.textContent =
          "Freshness haiwezi kuthibitishwa. Jaribu tena baadaye.";
        grid.innerHTML =
          '<p class="swfa-status error">Njia za API na snapshot ya ndani hazikupatikana.</p>';
        exportsNode.hidden = true;
      });
    });
  search.addEventListener("input", render);
  country.addEventListener("change", render);
  exportsNode.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-export]");
    if (!button) return;
    var rows = visible.map(function (item) {
      return {
        name: item.name,
        country: item.country,
        categories: item.type,
        followers: item.followers,
        afroScore: item.score,
        sourceSlug: item.slug,
        sourceState: sourceState,
      };
    });
    if (button.dataset.export === "json")
      download(
        "afrostream-watayarishi-sw.json",
        "application/json;charset=utf-8",
        JSON.stringify(
          {
            sourceState: sourceState,
            exportedAt: new Date().toISOString(),
            creators: rows,
          },
          null,
          2,
        ),
      );
    else
      download(
        "afrostream-watayarishi-sw.csv",
        "text/csv;charset=utf-8",
        csv(
          [
            [
              "name",
              "country",
              "categories",
              "followers",
              "afroScore",
              "sourceSlug",
              "sourceState",
            ],
          ].concat(
            rows.map(function (row) {
              return [
                row.name,
                row.country,
                row.categories,
                row.followers,
                row.afroScore,
                row.sourceSlug,
                row.sourceState,
              ];
            }),
          ),
        ),
      );
  });
  window.__SwAfroStream = {
    visible: function () {
      return visible.slice();
    },
    source: function () {
      return sourceState;
    },
  };
})();
