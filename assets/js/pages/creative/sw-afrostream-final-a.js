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
  function normalizeFallback(item, meta) {
    return {
      name: text(item.name),
      country: text(item.country) || "Afrika",
      type: text(item.categories) || "Mtayarishi",
      followers: Number(item.total_followers || item.subscribers) || 0,
      score: Number(item.afro_score) || 0,
      slug: text(item.slug),
      avatar: text(item.avatar_url),
      _raw: Object.assign({}, item, {
        source_state: "fallback",
        source_snapshot_label: text(meta.snapshot_label),
        source_reviewed_at: text(meta.reviewed_at),
        source_metrics_freshness: text(meta.metrics_freshness),
      }),
    };
  }
  function normalizeCreator(item) {
    var countryName = item.country;
    if (typeof countryName === "number") {
      countryName = Object.keys(engine.COUNTRY_MAP || {})[countryName] || "Afrika";
    }
    return {
      name: text(item.name),
      country: text(countryName) || "Afrika",
      type: text(item.type || item.categories) || "Mtayarishi",
      followers: Number(item.followers || item.subscribers) || 0,
      score: Number(item.score || item.afro_score) || 0,
      slug: text(item.slug),
      avatar: text(item.avatar || item.avatar_url),
      _raw: item._raw || item,
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
  function sourceProvenance(item) {
    var raw = item._raw || item;
    return {
      source_state: text(raw.source_state) || "api",
      source_snapshot_label: text(raw.source_snapshot_label) || "unknown",
      source_reviewed_at: text(raw.source_reviewed_at) || "unknown",
      source_metrics_freshness: text(raw.source_metrics_freshness) || "unknown",
      recordUpdatedAt: text(raw.updated_at) || "unknown",
    };
  }
  function isArchived(item) {
    return /^(fallback|archived)$/.test(sourceProvenance(item).source_state);
  }
  function datasetSourceState(list) {
    var count = list.filter(isArchived).length;
    return count ? (count === list.length ? "snapshot ya kumbukumbu" : "data ya API na kumbukumbu") : "data ya API ya umma";
  }
  function archiveNotice(list) {
    var archived = list.filter(isArchived);
    if (!archived.length) return "";
    var notes = archived.map(function (item) {
      var source = sourceProvenance(item);
      return "Kumbukumbu: " + (source.source_snapshot_label === "unknown" ? "tarehe haikutolewa" : source.source_snapshot_label) +
        "; tarehe ya mapitio: " + (source.source_reviewed_at === "unknown" ? "haikutolewa" : source.source_reviewed_at) +
        "; freshness ya vipimo: " + source.source_metrics_freshness + ".";
    });
    return Array.from(new Set(notes)).join(" ") + " Takwimu za hadhira hazijathibitishwa kuwa za sasa.";
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
      var card = document.createElement("article"),
        avatar = document.createElement("img"),
        copy = document.createElement("div"),
        name = document.createElement("strong"),
        detail = document.createElement("span");
      card.className = "swfa-result";
      avatar.src = safeImage(item.avatar);
      avatar.alt = "";
      avatar.width = 64;
      avatar.height = 64;
      avatar.loading = "lazy";
      name.textContent = item.name;
      detail.textContent =
        item.country +
        " · " +
        item.type +
        " · " +
        new Intl.NumberFormat("sw-KE", { notation: "compact" }).format(
          item.followers,
        ) +
        " wafuasi";
      copy.append(name, detail);
      if (isArchived(item)) {
        var provenance = document.createElement("span");
        provenance.textContent = archiveNotice([item]);
        copy.appendChild(provenance);
      }
      card.append(avatar, copy);
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
    creators = list.map(normalizeCreator);
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
          data.creators.map(function (item) { return normalizeFallback(item, meta); }),
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
        datasetSourceState(data.creators),
        (archiveNotice(data.creators) ? archiveNotice(data.creators) + " Tarehe hii ni ya rekodi, si kipimo cha sasa cha hadhira. " : "") +
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
      return Object.assign({
        name: item.name,
        country: item.country,
        categories: item.type,
        followers: item.followers,
        afroScore: item.score,
        sourceSlug: item.slug,
        sourceState: isArchived(item) ? "snapshot ya kumbukumbu" : "data ya API ya umma",
      }, sourceProvenance(item));
    });
    if (button.dataset.export === "json")
      download(
        "afrostream-watayarishi-sw.json",
        "application/json;charset=utf-8",
        JSON.stringify(
          {
            sourceState: datasetSourceState(visible),
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
              "source_state",
              "source_snapshot_label",
              "source_reviewed_at",
              "source_metrics_freshness",
              "recordUpdatedAt",
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
                row.source_state,
                row.source_snapshot_label,
                row.source_reviewed_at,
                row.source_metrics_freshness,
                row.recordUpdatedAt,
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
