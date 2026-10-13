(function () {
  "use strict";

  var engine = window.AfroStreamEngine;
  if (!engine) return;

  var creators = [];
  var visibleCreators = [];
  var news = [];
  var status = document.getElementById("afsStatus");
  var grid = document.getElementById("afsCreators");
  var newsNode = document.getElementById("afsNews");
  var search = document.getElementById("afsSearch");
  var country = document.getElementById("afsCountry");
  var freshness = document.getElementById("afsFreshness");
  var exportJson = document.getElementById("afsExportJson");
  var exportCsv = document.getElementById("afsExportCsv");

  function text(value) {
    return String(value == null ? "" : value);
  }

  function countryName(creator) {
    return text(creator && creator._raw && creator._raw.country) || "Afrique";
  }

  function safeImage(value) {
    var url = text(value).trim();
    return /^https?:\/\/\S+$/i.test(url) || /^\//.test(url) ? url : "/assets/img/tools/afrostream.webp";
  }

  function dateValue(value) {
    var time = Date.parse(value || "");
    return Number.isFinite(time) ? time : 0;
  }

  function sourceProvenance(creator) {
    var raw = creator._raw || {};
    return {
      source_state: text(raw.source_state) || "api",
      source_snapshot_label: text(raw.source_snapshot_label) || "unknown",
      source_reviewed_at: text(raw.source_reviewed_at) || "unknown",
      source_metrics_freshness: text(raw.source_metrics_freshness) || "unknown",
      recordUpdatedAt: text(raw.updated_at) || "unknown",
    };
  }

  function isArchived(creator) {
    return /^(fallback|archived)$/.test(sourceProvenance(creator).source_state);
  }

  function datasetSourceState(list) {
    var archivedCount = list.filter(isArchived).length;
    return archivedCount ? (archivedCount === list.length ? "archived" : "mixed") : "api";
  }

  function archiveNotice(list) {
    var archived = list.filter(isArchived);
    if (!archived.length) return "";
    var notes = archived.map(function (creator) {
      var source = sourceProvenance(creator);
      return "Archive : " + (source.source_snapshot_label === "unknown" ? "date non fournie" : source.source_snapshot_label) +
        "; revue de l’archive : " + (source.source_reviewed_at === "unknown" ? "non fournie" : source.source_reviewed_at) +
        "; fraîcheur des métriques : " + source.source_metrics_freshness + ".";
    });
    return (datasetSourceState(list) === "mixed" ? "Sources API et archives. " : "Données archivées. ") +
      Array.from(new Set(notes)).join(" ") + " Les chiffres d’audience ne sont pas confirmés comme actuels.";
  }

  function newestSourceDate(allCreators, allNews) {
    var timestamps = [];
    allCreators.forEach(function (creator) {
      var raw = creator._raw || {};
      timestamps.push(dateValue(raw.updated_at), dateValue(raw.last_checked_at), dateValue(raw.created_at));
    });
    allNews.forEach(function (item) {
      var raw = item._raw || {};
      timestamps.push(dateValue(raw.updated_at), dateValue(raw.published_at));
    });
    var latest = Math.max.apply(Math, timestamps.concat([0]));
    return latest ? new Date(latest) : null;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 })
      .format(Number(value) || 0);
  }

  function creatorCard(creator) {
    var article = document.createElement("article");
    article.className = "afs-creator";
    var image = document.createElement("img");
    image.src = safeImage(creator.avatar);
    image.alt = "";
    image.width = 72;
    image.height = 72;
    image.loading = "lazy";
    image.addEventListener("error", function () {
      image.src = "/assets/img/tools/afrostream.webp";
    }, { once: true });
    var body = document.createElement("div");
    var heading = document.createElement("h3");
    heading.textContent = text(creator.name) || "Créateur";
    var meta = document.createElement("p");
    meta.textContent = countryName(creator) + " · " + text(creator.type || "Créateur");
    var stats = document.createElement("p");
    stats.className = "afs-stats";
    stats.textContent = formatNumber(creator.followers) + " abonnés · score AfroStream " +
      formatNumber(creator.score);
    body.append(heading, meta, stats);
    if (isArchived(creator)) {
      var provenance = document.createElement("p");
      provenance.textContent = archiveNotice([creator]);
      body.appendChild(provenance);
    }
    article.append(image, body);
    return article;
  }

  function renderCreators() {
    var query = search.value.trim().toLocaleLowerCase("fr");
    var selectedCountry = country.value;
    visibleCreators = creators.filter(function (creator) {
      var matchesQuery = !query || [creator.name, creator.type, countryName(creator)]
        .some(function (value) { return text(value).toLocaleLowerCase("fr").includes(query); });
      var matchesCountry = !selectedCountry || countryName(creator) === selectedCountry;
      return matchesQuery && matchesCountry;
    });
    grid.replaceChildren();
    visibleCreators.forEach(function (creator) {
      grid.appendChild(creatorCard(creator));
    });
    if (!visibleCreators.length) {
      var empty = document.createElement("p");
      empty.className = "afs-empty";
      empty.textContent = "Aucun profil chargé ne correspond à ces filtres.";
      grid.appendChild(empty);
    }
    status.textContent = visibleCreators.length + " profil" +
      (visibleCreators.length === 1 ? " affiché." : "s affichés.") +
      (archiveNotice(creators) ? " " + archiveNotice(creators) : "");
  }

  function renderCountries() {
    var values = Array.from(new Set(creators.map(countryName))).sort(function (a, b) {
      return a.localeCompare(b, "fr");
    });
    values.forEach(function (value) {
      var option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      country.appendChild(option);
    });
  }

  function renderNews() {
    newsNode.replaceChildren();
    news.slice(0, 6).forEach(function (item) {
      var article = document.createElement("article");
      article.className = "afs-news-item";
      var heading = document.createElement("h3");
      heading.textContent = text(item.title);
      var meta = document.createElement("p");
      meta.textContent = text(item.cat || "Actualité") + " · " + text(item.date);
      var excerpt = document.createElement("p");
      excerpt.textContent = text(item.excerpt);
      article.append(heading, meta, excerpt);
      newsNode.appendChild(article);
    });
    if (!news.length) {
      var empty = document.createElement("p");
      empty.textContent = "Aucune actualité n’a été renvoyée par l’API.";
      newsNode.appendChild(empty);
    }
  }

  function exportRows() {
    return visibleCreators.map(function (creator) {
      return Object.assign({
        name: text(creator.name),
        country: countryName(creator),
        categories: text(creator.type),
        followers: Number(creator.followers) || 0,
        afroScore: Number(creator.score) || 0,
        sourceSlug: text(creator.slug),
      }, sourceProvenance(creator));
    });
  }

  function download(filename, type, content) {
    var blob = new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  exportJson.addEventListener("click", function () {
    download("afrostream-createurs-fr.json", "application/json;charset=utf-8", JSON.stringify({
      source: "/api/afrostream/creators",
      exportedAt: new Date().toISOString(),
      sourceState: datasetSourceState(visibleCreators),
      creators: exportRows(),
    }, null, 2));
  });

  exportCsv.addEventListener("click", function () {
    var rows = [["name", "country", "categories", "followers", "afroScore", "sourceSlug", "source_state", "source_snapshot_label", "source_reviewed_at", "source_metrics_freshness", "recordUpdatedAt"]]
      .concat(exportRows().map(function (row) {
        return [row.name, row.country, row.categories, row.followers, row.afroScore, row.sourceSlug, row.source_state, row.source_snapshot_label, row.source_reviewed_at, row.source_metrics_freshness, row.recordUpdatedAt];
      }));
    var csv = rows.map(function (row) {
      return row.map(function (cell) {
        return '"' + text(cell).replace(/"/g, '""') + '"';
      }).join(",");
    }).join("\n");
    download("afrostream-createurs-fr.csv", "text/csv;charset=utf-8", "\ufeff" + csv);
  });

  search.addEventListener("input", renderCreators);
  country.addEventListener("change", renderCreators);

  status.textContent = "Chargement des données publiques AfroStream…";
  engine.loadAll().then(function (data) {
    if (!Array.isArray(data.creators)) {
      throw new Error("Creator dataset unavailable");
    }
    creators = Array.isArray(data.creators) ? data.creators : [];
    news = Array.isArray(data.news) ? data.news : [];
    renderCountries();
    renderCreators();
    renderNews();
    var latest = newestSourceDate(creators, news);
    var recordDate = latest
      ? "Dernière date publiée dans les enregistrements chargés : " +
        new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" })
          .format(latest) + " UTC."
      : "Aucune date de mise à jour n’a été fournie par les enregistrements chargés.";
    freshness.textContent = archiveNotice(creators)
      ? archiveNotice(creators) + " " + recordDate + " Cette date décrit le dossier chargé, pas une mesure récente de l’audience."
      : recordDate;
    exportJson.disabled = !creators.length;
    exportCsv.disabled = !creators.length;
  }).catch(function () {
    status.textContent = "Les données AfroStream sont indisponibles. Aucun profil fictif n’est affiché.";
    grid.innerHTML = '<p class="afs-empty">Réessayez plus tard ou ouvrez la version anglaise pour vérifier l’état du service.</p>';
    newsNode.innerHTML = "<p>Aucune actualité chargée.</p>";
    freshness.textContent = "Fraîcheur non vérifiable pendant cette indisponibilité.";
  });
})();
