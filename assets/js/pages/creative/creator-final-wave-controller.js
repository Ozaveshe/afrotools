(function () {
  "use strict";

  var configNode = document.getElementById("creator-final-config");
  if (!configNode || !window.AfroTools || !window.AfroTools.creatorFinalWave) return;

  var config = JSON.parse(configNode.textContent);
  var engine = window.AfroTools.creatorFinalWave;
  var form = document.getElementById("creatorFinalForm");
  var fieldsNode = document.getElementById("creatorFinalFields");
  var resultNode = document.getElementById("creatorFinalResult");
  var exportNode = document.getElementById("creatorFinalExports");
  var statusNode = document.getElementById("creatorFinalStatus");
  var lastResult = null;

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function fieldMarkup(field) {
    var id = "cf-" + field.name;
    var common =
      ' id="' + id + '" name="' + escapeHtml(field.name) + '"' +
      (field.required ? " required" : "") +
      (field.min != null ? ' min="' + field.min + '"' : "") +
      (field.max != null ? ' max="' + field.max + '"' : "") +
      (field.step != null ? ' step="' + field.step + '"' : "");
    var control;
    if (field.type === "textarea") {
      control = "<textarea" + common + ' rows="' + (field.rows || 4) + '" placeholder="' +
        escapeHtml(field.placeholder || "") + '">' + escapeHtml(field.value || "") + "</textarea>";
    } else if (field.type === "select") {
      control = "<select" + common + ">" + field.options.map(function (option) {
        return '<option value="' + escapeHtml(option.value) + '"' +
          (option.value === field.value ? " selected" : "") + ">" +
          escapeHtml(option.label) + "</option>";
      }).join("") + "</select>";
    } else {
      control = '<input type="' + escapeHtml(field.type || "text") + '"' + common +
        ' value="' + escapeHtml(field.value || "") + '" placeholder="' +
        escapeHtml(field.placeholder || "") + '">';
    }
    return '<div class="cf-field"><label for="' + id + '">' + escapeHtml(field.label) +
      (field.required ? ' <span aria-hidden="true">*</span>' : "") + "</label>" +
      control + (field.help ? '<p class="cf-help">' + escapeHtml(field.help) + "</p>" : "") + "</div>";
  }

  function values() {
    var data = {};
    config.fields.forEach(function (field) {
      var control = form.elements[field.name];
      data[field.name] = control ? control.value : "";
    });
    return data;
  }

  function formatValue(value) {
    if (typeof value === "number") {
      return new Intl.NumberFormat(config.locale === "fr" ? "fr-FR" : "en", {
        maximumFractionDigits: 2,
      }).format(value);
    }
    return String(value == null ? "" : value);
  }

  function resultMarkup(result) {
    var excluded = new Set(["owner", "colours", "slides", "modules", "links", "sources", "verificationChecklist"]);
    var rows = Object.keys(result).filter(function (key) {
      return !excluded.has(key) && typeof result[key] !== "object";
    }).map(function (key) {
      return '<div class="cf-metric"><span>' + escapeHtml(config.labels[key] || key) +
        "</span><strong>" + escapeHtml(formatValue(result[key])) + "</strong></div>";
    }).join("");
    var lists = "";
    ["slides", "modules", "links", "sources", "verificationChecklist"].forEach(function (key) {
      if (!Array.isArray(result[key]) || !result[key].length) return;
      lists += '<section class="cf-result-list"><h3>' + escapeHtml(config.labels[key] || key) + "</h3><ol>" +
        result[key].map(function (item) {
          if (typeof item === "string") return "<li>" + escapeHtml(item) + "</li>";
          var title = item.title || item.heading || item.name || item.url || "";
          var detail = item.body || item.url || "";
          return "<li><strong>" + escapeHtml(title) + "</strong>" +
            (detail && detail !== title ? "<span>" + escapeHtml(detail) + "</span>" : "") + "</li>";
        }).join("") + "</ol></section>";
    });
    return '<div class="cf-metrics">' + rows + "</div>" + lists;
  }

  function blobDownload(filename, type, content) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function resultText(result) {
    var lines = [config.title, ""];
    Object.keys(result).forEach(function (key) {
      var value = result[key];
      if (Array.isArray(value)) {
        lines.push((config.labels[key] || key) + ":");
        value.forEach(function (item, index) {
          if (typeof item === "string") lines.push("- " + item);
          else lines.push("- " + (item.title || item.heading || item.name || item.url || ("Item " + (index + 1))) +
            (item.body ? ": " + item.body : item.url && item.title ? ": " + item.url : ""));
        });
      } else if (value && typeof value === "object") {
        lines.push((config.labels[key] || key) + ": " + JSON.stringify(value));
      } else {
        lines.push((config.labels[key] || key) + ": " + formatValue(value));
      }
    });
    return lines.join("\n");
  }

  function drawWrapped(context, text, x, y, maxWidth, lineHeight, maxLines) {
    var words = String(text).split(/\s+/);
    var line = "";
    var lines = [];
    words.forEach(function (word) {
      var candidate = line ? line + " " + word : word;
      if (context.measureText(candidate).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    });
    if (line) lines.push(line);
    lines.slice(0, maxLines || lines.length).forEach(function (value, index) {
      context.fillText(value, x, y + index * lineHeight);
    });
  }

  function canvasForSlide(result, slide) {
    var canvas = document.createElement("canvas");
    canvas.width = result.dimensions.width;
    canvas.height = result.dimensions.height;
    var context = canvas.getContext("2d");
    context.fillStyle = result.colours.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = result.colours.accent;
    context.fillRect(0, 0, 26, canvas.height);
    context.fillStyle = "#ffffff";
    context.font = "900 86px sans-serif";
    context.textBaseline = "top";
    drawWrapped(context, slide.heading, 100, 150, canvas.width - 200, 102, 5);
    context.fillStyle = "#dbeafe";
    context.font = "500 46px sans-serif";
    drawWrapped(context, slide.body, 100, 760, canvas.width - 200, 62, 6);
    context.fillStyle = result.colours.accent;
    context.font = "700 30px sans-serif";
    context.fillText(String(result.slides.indexOf(slide) + 1).padStart(2, "0"), 100, 1230);
    return canvas;
  }

  function canvasForThumb(result) {
    var canvas = document.createElement("canvas");
    canvas.width = result.width;
    canvas.height = result.height;
    var context = canvas.getContext("2d");
    context.fillStyle = result.colours.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = result.colours.accent;
    context.fillRect(0, 0, Math.max(20, canvas.width * 0.025), canvas.height);
    var unit = Math.min(canvas.width, canvas.height);
    context.fillStyle = result.colours.text;
    context.textBaseline = "top";
    context.font = "900 " + Math.round(unit * 0.12) + "px sans-serif";
    drawWrapped(context, result.headline, canvas.width * 0.09, canvas.height * 0.18, canvas.width * 0.8, unit * 0.145, 4);
    if (result.kicker) {
      context.fillStyle = result.colours.accent;
      context.font = "800 " + Math.round(unit * 0.045) + "px sans-serif";
      context.fillText(result.kicker.toUpperCase(), canvas.width * 0.09, canvas.height * 0.08);
    }
    return canvas;
  }

  function renderVisual(result) {
    var preview = document.getElementById("creatorFinalPreview");
    preview.innerHTML = "";
    if (result.owner === "creator-carousel") {
      result.slides.forEach(function (slide) {
        var canvas = canvasForSlide(result, slide);
        canvas.className = "cf-canvas";
        canvas.dataset.slide = String(result.slides.indexOf(slide) + 1);
        preview.appendChild(canvas);
      });
    } else if (result.owner === "creator-thumb") {
      var canvas = canvasForThumb(result);
      canvas.className = "cf-canvas";
      preview.appendChild(canvas);
    }
  }

  function pageHtml(result) {
    var links = result.links.map(function (link) {
      return '<li><a href="' + escapeHtml(link.url) + '" rel="noopener noreferrer">' +
        escapeHtml(link.title) + "</a></li>";
    }).join("");
    return "<!doctype html><html lang=\"" + config.locale + "\"><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" +
      escapeHtml(result.displayName) + "</title><style>body{font:16px system-ui;max-width:680px;margin:0 auto;padding:48px 20px;color:#172033}" +
      "a{display:block;padding:14px 16px;border:2px solid " + escapeHtml(result.accent) +
      ";border-radius:12px;color:#172033;text-decoration:none}li{list-style:none;margin:12px 0}ul{padding:0}</style></head><body><h1>" +
      escapeHtml(result.displayName) + "</h1><p>" + escapeHtml(result.bio) + "</p><ul>" + links +
      "</ul></body></html>";
  }

  function exportButtons(result) {
    exportNode.innerHTML = "";
    function add(label, action) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "cf-btn cf-btn-secondary";
      button.textContent = label;
      button.addEventListener("click", action);
      exportNode.appendChild(button);
    }
    add(config.exportLabels.json, function () {
      blobDownload(config.owner + ".json", "application/json;charset=utf-8", JSON.stringify(result, null, 2));
    });
    add(config.exportLabels.text, function () {
      blobDownload(config.owner + ".txt", "text/plain;charset=utf-8", resultText(result));
    });
    if (result.owner === "creator-club") {
      add(config.exportLabels.csv, function () {
        var csv = "metric,value\n" + [
          ["members", result.members], ["grossMonthly", result.grossMonthly],
          ["platformFees", result.platformFees], ["monthlyCosts", result.monthlyCosts],
          ["netMonthly", result.netMonthly], ["annualNet", result.annualNet],
        ].map(function (row) { return row.map(function (cell) {
          return '"' + String(cell).replace(/"/g, '""') + '"';
        }).join(","); }).join("\n");
        blobDownload("creator-club.csv", "text/csv;charset=utf-8", "\ufeff" + csv);
      });
    }
    if (result.owner === "creator-page") {
      add(config.exportLabels.html, function () {
        blobDownload("creator-page.html", "text/html;charset=utf-8", pageHtml(result));
      });
    }
    if (result.owner === "creator-thumb") {
      add(config.exportLabels.png, function () {
        canvasForThumb(result).toBlob(function (blob) {
          blobDownload("creator-thumbnail-" + result.width + "x" + result.height + ".png", "image/png", blob);
        }, "image/png");
      });
    }
    if (result.owner === "creator-carousel") {
      add(config.exportLabels.zip, function () {
        if (!window.JSZip) {
          statusNode.textContent = config.messages.zipUnavailable;
          return;
        }
        var zip = new window.JSZip();
        var pending = result.slides.length;
        result.slides.forEach(function (slide, index) {
          canvasForSlide(result, slide).toBlob(function (blob) {
            zip.file("slide-" + String(index + 1).padStart(2, "0") + ".png", blob);
            pending -= 1;
            if (!pending) {
              zip.generateAsync({ type: "blob" }).then(function (blobValue) {
                blobDownload("creator-carousel-slides.zip", "application/zip", blobValue);
              });
            }
          }, "image/png");
        });
      });
    }
  }

  fieldsNode.innerHTML = config.fields.map(fieldMarkup).join("");

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      lastResult = engine.calculate(config.owner, values());
      resultNode.innerHTML = resultMarkup(lastResult);
      renderVisual(lastResult);
      exportButtons(lastResult);
      statusNode.textContent = config.messages.ready;
      document.getElementById("creatorFinalOutput").hidden = false;
      document.getElementById("creatorFinalOutput").focus();
    } catch (error) {
      lastResult = null;
      document.getElementById("creatorFinalOutput").hidden = true;
      statusNode.textContent = config.messages.error + " " + error.message;
      statusNode.focus();
    }
  });
})();
