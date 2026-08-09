(function () {
  "use strict";
  var root = document.querySelector("[data-swfa]");
  if (!root) return;
  var config = JSON.parse(document.getElementById("swfaConfig").textContent),
    form = root.querySelector("form"),
    fields = root.querySelector("[data-fields]"),
    results = root.querySelector("[data-results]"),
    status = root.querySelector("[data-status]"),
    exportsNode = root.querySelector("[data-exports]"),
    last = null,
    collection = [];
  function esc(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      function (char) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[char];
      },
    );
  }
  function setStatus(message, error) {
    status.textContent = message;
    status.classList.toggle("error", !!error);
  }
  function download(name, type, body) {
    var blob = body instanceof Blob ? body : new Blob([body], { type: type }),
      url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
    return blob;
  }
  function csv(rows) {
    return (
      "\ufeff" +
      rows
        .map(function (row) {
          return row
            .map(function (cell) {
              return (
                '"' + String(cell == null ? "" : cell).replace(/"/g, '""') + '"'
              );
            })
            .join(",");
        })
        .join("\r\n")
    );
  }
  function money(value, currency) {
    return new Intl.NumberFormat("sw-KE", {
      style: "currency",
      currency: currency || "KES",
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  }
  function values() {
    var data = {};
    config.fields.forEach(function (field) {
      var node = form.elements[field.name];
      data[field.name] =
        field.type === "number" ? Number(node.value) : node.value;
    });
    return data;
  }
  function clearResult() {
    last = null;
    collection = [];
    results.replaceChildren();
    results.hidden = true;
    exportsNode.hidden = true;
    setStatus("Jaza sehemu zinazohitajika kisha tengeneza matokeo.");
  }
  function add(label, value) {
    var card = document.createElement("article");
    card.className = "swfa-result";
    card.innerHTML =
      "<strong>" + esc(label) + "</strong><span>" + esc(value) + "</span>";
    results.appendChild(card);
  }
  function drawWrapped(context, value, x, y, maxWidth, lineHeight, maxLines) {
    var words = String(value).split(/\s+/),
      lines = [],
      line = "";
    words.forEach(function (word) {
      var next = line ? line + " " + word : word;
      if (line && context.measureText(next).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = next;
    });
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach(function (item, index) {
      context.fillText(item, x, y + index * lineHeight);
    });
  }
  function carouselCanvas(result, slide, index) {
    var canvas = document.createElement("canvas"),
      context;
    canvas.width = result.dimensions.width;
    canvas.height = result.dimensions.height;
    canvas.className = "swfa-carousel-canvas";
    canvas.dataset.slide = String(index + 1);
    context = canvas.getContext("2d");
    context.fillStyle = result.colours.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = result.colours.accent;
    context.fillRect(0, 0, 26, canvas.height);
    context.fillStyle = "#ffffff";
    context.textBaseline = "top";
    context.font = "900 86px sans-serif";
    drawWrapped(context, slide.heading, 100, 150, canvas.width - 200, 102, 5);
    context.fillStyle = "#dbeafe";
    context.font = "500 46px sans-serif";
    drawWrapped(context, slide.body, 100, 760, canvas.width - 200, 62, 6);
    context.fillStyle = result.colours.accent;
    context.font = "700 30px sans-serif";
    context.fillText(String(index + 1).padStart(2, "0"), 100, 1230);
    return canvas;
  }
  function canvasBlob(canvas) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error("png"));
      }, "image/png");
    });
  }
  function carouselZip() {
    if (!last || !window.JSZip) {
      setStatus("ZIP haipatikani katika kivinjari hiki.", true);
      return;
    }
    var zip = new window.JSZip();
    Promise.all(
      last.slides.map(function (slide, index) {
        return canvasBlob(carouselCanvas(last, slide, index)).then(function (blob) {
          zip.file("slaidi-" + String(index + 1).padStart(2, "0") + ".png", blob);
        });
      }),
    )
      .then(function () {
        return zip.generateAsync({ type: "blob" });
      })
      .then(function (blob) {
        download("carousel-slaidi-sw.zip", "application/zip", blob);
        setStatus("PNG zote zimepakiwa ndani ya ZIP.");
      })
      .catch(function () {
        setStatus("PNG za carousel hazikuweza kupakiwa.", true);
      });
  }
  function renderGeneric(result) {
    results.replaceChildren();
    if (config.owner === "creator-carousel") {
      result.slides.forEach(function (slide, index) {
        var wrap = document.createElement("article"),
          heading = document.createElement("strong");
        wrap.className = "swfa-result swfa-carousel-result";
        heading.textContent = "Slaidi " + (index + 1);
        wrap.append(heading, carouselCanvas(result, slide, index));
        results.appendChild(wrap);
      });
    } else if (config.owner === "creator-desk") {
      var wrap = document.createElement("div");
      wrap.className = "swfa-table-wrap";
      wrap.innerHTML =
        '<table class="swfa-table"><thead><tr><th>Mradi</th><th>Mteja</th><th>Hali</th><th>Thamani</th><th>Tarehe</th></tr></thead><tbody>' +
        collection
          .map(function (item) {
            return (
              "<tr><td>" +
              esc(item.name) +
              "</td><td>" +
              esc(item.client) +
              "</td><td>" +
              esc(item.status) +
              "</td><td>" +
              esc(item.currency + " " + item.value.toLocaleString("sw-KE")) +
              "</td><td>" +
              esc(item.due || "—") +
              "</td></tr>"
            );
          })
          .join("") +
        "</tbody></table>";
      results.appendChild(wrap);
    } else if (config.owner === "creator-hashtags") {
      var names = ["Ufikiaji mpana", "Nafasi maalumu", "Jumuiya ya Afrika"];
      result.sets.forEach(function (set, index) {
        add(
          names[index],
          set.tags
            .map(function (tag) {
              return tag.tag;
            })
            .join(" "),
        );
      });
    } else if (config.owner === "creator-hooks") {
      result.hooks.forEach(function (hook, index) {
        add(
          "Hook " + (index + 1),
          hook.text + " (sekunde " + hook.readTimeSeconds + ")",
        );
      });
    } else if (config.owner === "creator-invoice") {
      add("Jumla ndogo", money(result.subtotal / 100, result.currency));
      add(
        result.taxLabel + " (" + result.taxRate + "%)",
        money(result.tax / 100, result.currency),
      );
      add("Jumla ya kulipwa", money(result.total / 100, result.currency));
    } else if (config.owner === "creator-kit") {
      add(result.name, result.tagline || "Media kit ya mtayarishi");
      add(
        result.services[0].name,
        result.currency +
          " " +
          result.services[0].price.toLocaleString("sw-KE") +
          " — " +
          result.services[0].description,
      );
    } else if (config.owner === "creator-mail") {
      add("Mada", result.subject);
      add(result.headline, result.body);
      if (result.cta) add("Mwito wa hatua", result.cta + " — " + result.url);
    } else if (config.owner === "creator-mind") {
      result.ideas.forEach(function (idea) {
        add("Wazo " + idea.id, idea.title);
      });
    } else if (config.owner === "creator-money") {
      add(
        "Faida ya uendeshaji",
        money(result.operatingProfit, result.currency),
      );
      add("Akiba ya kodi", money(result.taxReserve, result.currency));
      add("Malipo ya mmiliki", money(result.ownerPay, result.currency));
      add("Uwekezaji upya", money(result.reinvestment, result.currency));
      add("Akiba ya fedha", money(result.cashBuffer, result.currency));
    } else if (config.owner === "creator-page") {
      add(result.displayName, result.bio);
      result.links.forEach(function (link) {
        add(link.title, link.url);
      });
    } else if (config.owner === "creator-polish") {
      add("Maneno", result.metrics.words);
      add("Sentensi", result.metrics.sentences);
      add("Sentensi ndefu", result.metrics.longSentences);
      add(
        "Maneno yanayorudiwa",
        result.repeatedWords.join(", ") || "Hakuna ishara kubwa",
      );
      add("Nakala iliyosafishwa", result.cleaned);
    }
    results.hidden = false;
    exportsNode.hidden = false;
  }
  function swHooks(input) {
    var topic = String(input.topic || "").trim(),
      platform = input.platform;
    if (topic.length < 3) throw new Error("topic");
    var base = window.AfroTools.engines.creatorHooks.generateLocalHooks(
      topic,
      platform,
      "en",
    );
    var texts = [
      "Subiri — jambo hili kuhusu " + topic + " hubadilisha kila kitu.",
      "Je, unajua kosa kubwa zaidi katika " + topic + "?",
      "Ukweli usiopendeza kuhusu " + topic + " ni huu.",
      "Nilipoanza na " + topic + ", nilifanya kosa hili.",
      "Watu wengi hutaja takwimu za " + topic + " bila kuthibitisha chanzo.",
      "Kama unafanya " + topic + ", hatua hii ni yako.",
    ];
    return {
      owner: "creator-hooks",
      topic: topic,
      platform: platform,
      language: "sw",
      source: "local-deterministic",
      hooks: texts.map(function (text, index) {
        var words = text.split(/\s+/).length;
        return {
          category: base.hooks[index].category,
          text: text,
          wordCount: words,
          readTimeSeconds: Number((words / 2.5).toFixed(1)),
        };
      }),
    };
  }
  function swIdeas(input) {
    var topic = String(input.topic || "").trim(),
      audience = String(input.audience || "").trim();
    if (topic.length < 3) throw new Error("topic");
    if (audience.length < 3) throw new Error("audience");
    window.AfroTools.CreatorMindEngine.generateLocalIdeas(
      { topic: topic, audience: audience, platform: input.platform },
      "en",
    );
    var patterns = [
      "Hatua 5 za {topic} kwa {audience}",
      "Kosa linalozuia {audience} kufanikiwa na {topic}",
      "Mfano halisi wa {topic}",
      "Kabla na baada: {topic}",
      "Maswali 3 kuhusu {topic}",
      "Jinsi ya kuanza {topic} kwa bajeti ndogo",
      "Mambo ambayo ningependa kujua kuhusu {topic}",
      "Hadithi fupi ya {topic}",
      "Orodha ya kukagua {topic}",
      "Vyanzo vya kuthibitisha mada ya {topic}",
    ];
    return {
      owner: "creator-mind",
      topic: topic,
      audience: audience,
      platform: input.platform,
      language: "sw",
      source: "local-deterministic",
      ideas: patterns.map(function (pattern, index) {
        return {
          id: index + 1,
          title: pattern
            .replace(/\{topic\}/g, topic)
            .replace(/\{audience\}/g, audience),
        };
      }),
    };
  }
  function build() {
    var input = values(),
      owner = config.owner,
      engine,
      result;
    if (owner === "creator-carousel") {
      engine = window.AfroTools.creatorFinalWave;
      result = engine.calculate(owner, input);
      result.boundary =
        "Rasimu ya slaidi ya ndani; hakiki kabla ya kuchapisha.";
      return result;
    }
    if (owner === "creator-desk") {
      engine = window.AfroTools.CreatorDeskEngine;
      var item = engine.buildProjectRecord({
        name: input.project,
        client: input.client,
        status: input.status,
        value: input.value,
        currency: input.currency,
        due: input.due,
        notes: input.notes,
      });
      collection.push(item);
      return item;
    }
    if (owner === "creator-hashtags") {
      engine = window.AfroTools.TagWaveEngine;
      result = engine.generateLocal(input.topic, input.platform, "en");
      result.language = "sw";
      result.sets.forEach(function (set, index) {
        set.name = ["UFIKIAJI MPANA", "NAFASI MAALUMU", "JUMUIYA YA AFRIKA"][
          index
        ];
      });
      return result;
    }
    if (owner === "creator-hooks") return swHooks(input);
    if (owner === "creator-invoice") {
      engine = window.AfroTools.engines.creatorInvoice;
      var invoice = engine.createInvoice({
        issuerName: input.issuer,
        clientName: input.client,
        invoiceNumber: input.invoiceNumber,
        currency: input.currency,
        taxLabel: "Kodi",
        taxRate: input.taxRate,
        items: [
          {
            description: input.description,
            quantity: input.quantity,
            unitPrice: input.unitPrice,
          },
        ],
      });
      if (!invoice.valid) throw new Error(invoice.errors.join(","));
      invoice.locale = "sw-KE";
      return invoice;
    }
    if (owner === "creator-kit") {
      engine = window.AfroTools.CreatorKitEngine;
      return engine.buildLocalRateCard({
        name: input.creator,
        tagline: input.tagline,
        service: input.service,
        price: input.price,
        currency: input.currency,
        description: input.description,
        contactEmail: input.email,
        contactWhatsapp: input.whatsapp,
      });
    }
    if (owner === "creator-mail") {
      engine = window.AfroTools.CreatorMailEngine;
      return engine.buildNewsletter(input);
    }
    if (owner === "creator-mind") return swIdeas(input);
    if (owner === "creator-money") {
      engine = window.CreatorMoneyEngine;
      var plan = engine.calculatePlan(input);
      if (!plan.valid) throw new Error(plan.errors.join(","));
      return plan;
    }
    if (owner === "creator-page") {
      engine = window.AfroTools.creatorFinalWave;
      result = engine.calculate(owner, input);
      result.boundary = "Rasimu ya ukurasa wa ndani; AfroTools haiuchapishi.";
      return result;
    }
    if (owner === "creator-polish") {
      engine = window.AfroTools.CreatorPolishEngine;
      result = engine.analyze({ text: input.text, lang: "en" });
      result.language = "sw";
      result.suggestions = [];
      if (result.metrics.longSentences)
        result.suggestions.push("Gawa sentensi zenye maneno zaidi ya 25.");
      if (result.repeatedWords.length)
        result.suggestions.push(
          "Kagua maneno yanayorudiwa: " + result.repeatedWords.join(", ") + ".",
        );
      if (result.cleaned !== result.original)
        result.suggestions.push(
          "Kagua nakala yenye nafasi na punctuation iliyosafishwa.",
        );
      if (!result.suggestions.length)
        result.suggestions.push(
          "Hakuna ishara kubwa ya kimakanika; hakiki maana na ukweli.",
        );
      result.boundary =
        "Uchambuzi wa kanuni za ndani; hauhakiki ukweli, sauti ya kitamaduni wala sarufi yote.";
      return result;
    }
    throw new Error("owner");
  }
  function textExport() {
    if (config.owner === "creator-carousel")
      return last.slides
        .map(function (slide, index) {
          return "SLAIDI " + (index + 1) + "\n" + slide.heading + "\n" + slide.body;
        })
        .join("\n\n");
    if (config.owner === "creator-mail")
      return [
        last.subject,
        last.preheader,
        last.headline,
        last.body,
        last.cta,
        last.url,
        last.sender,
      ]
        .filter(Boolean)
        .join("\n\n");
    if (config.owner === "creator-polish")
      return (
        "MAPITIO YA MAUDHUI\n\n" +
        last.suggestions.join("\n") +
        "\n\nNAKALA ILIYOSAFISHWA\n" +
        last.cleaned
      );
    if (config.owner === "creator-hashtags")
      return last.sets
        .map(function (set, index) {
          return [
            "KUNDI " + (index + 1),
            set.tags
              .map(function (tag) {
                return tag.tag;
              })
              .join(" "),
          ].join("\n");
        })
        .join("\n\n");
    if (config.owner === "creator-hooks")
      return last.hooks
        .map(function (hook, index) {
          return index + 1 + ". " + hook.text;
        })
        .join("\n");
    if (config.owner === "creator-mind")
      return last.ideas
        .map(function (idea) {
          return idea.id + ". " + idea.title;
        })
        .join("\n");
    if (config.owner === "creator-invoice")
      return [
        "ANKARA " + last.invoiceNumber,
        "Kutoka: " + last.issuerName,
        "Kwa: " + last.clientName,
        "Jumla: " + money(last.total / 100, last.currency),
      ].join("\n");
    if (config.owner === "creator-money")
      return [
        "MPANGO WA MAPATO",
        "Faida: " + money(last.operatingProfit, last.currency),
        "Akiba ya kodi: " + money(last.taxReserve, last.currency),
        "Malipo ya mmiliki: " + money(last.ownerPay, last.currency),
        "Uwekezaji upya: " + money(last.reinvestment, last.currency),
        "Akiba: " + money(last.cashBuffer, last.currency),
      ].join("\n");
    return JSON.stringify(
      config.owner === "creator-desk" ? { projects: collection } : last,
      null,
      2,
    );
  }
  function pageHtml() {
    if (config.owner === "creator-mail") {
      var item = last,
        paragraphs = item.body
          .split(/\n+/)
          .filter(Boolean)
          .map(function (p) {
            return "<p>" + esc(p) + "</p>";
          })
          .join("");
      return (
        '<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' +
        esc(item.subject) +
        "</title></head><body><main><h1>" +
        esc(item.headline) +
        "</h1>" +
        paragraphs +
        (item.cta && item.url
          ? '<p><a href="' + esc(item.url) + '">' + esc(item.cta) + "</a></p>"
          : "") +
        "<p>" +
        esc(item.sender) +
        "</p><hr><p>Ongeza anwani ya mtumaji na kiungo cha kujiondoa kabla ya kutuma.</p></main></body></html>"
      );
    }
    if (config.owner === "creator-page") {
      return (
        '<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' +
        esc(last.displayName) +
        '</title></head><body style="font-family:system-ui;max-width:640px;margin:40px auto;padding:20px"><main><h1>' +
        esc(last.displayName) +
        "</h1><p>" +
        esc(last.bio) +
        "</p><nav>" +
        last.links
          .map(function (link) {
            return (
              '<p><a href="' +
              esc(link.url) +
              '">' +
              esc(link.title) +
              "</a></p>"
            );
          })
          .join("") +
        "</nav></main></body></html>"
      );
    }
    if (config.owner === "creator-carousel") {
      return (
        '<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>' +
        esc(last.headline) +
        "</title></head><body>" +
        last.slides
          .map(function (slide) {
            return (
              '<section style="width:1080px;min-height:1350px;box-sizing:border-box;padding:100px;background:' +
              esc(last.colours.background) +
              ';color:white"><h1>' +
              esc(slide.heading) +
              "</h1><p>" +
              esc(slide.body) +
              "</p></section>"
            );
          })
          .join("") +
        "</body></html>"
      );
    }
    return "";
  }
  function invoicePdf() {
    var jsPDF = window.jspdf && window.jspdf.jsPDF;
    if (!jsPDF) throw new Error("pdf");
    var doc = new jsPDF(),
      lines = [
        "ANKARA " + last.invoiceNumber,
        "Kutoka: " + last.issuerName,
        "Kwa: " + last.clientName,
        "Jumla: " + last.currency + " " + (last.total / 100).toFixed(2),
        "Rasimu ya ndani. Thibitisha kodi na masharti kabla ya kutuma.",
      ].map(function (line) {
        return String(line)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^\x20-\x7e]/g, "?");
      });
    doc.setFont("helvetica", "normal");
    lines.forEach(function (line, index) {
      doc.setFontSize(index ? 11 : 18);
      doc.text(line, 20, 24 + index * 16);
    });
    doc.save("ankara-ya-mtayarishi.pdf");
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!form.reportValidity()) {
      clearResult();
      setStatus("Kagua sehemu zilizoangaziwa.", true);
      return;
    }
    try {
      last = build();
      renderGeneric(last);
      setStatus(
        config.owner === "creator-desk"
          ? "Mradi umeongezwa kwenye kikao hiki cha ndani."
          : "Matokeo yametengenezwa ndani ya kivinjari.",
      );
    } catch (error) {
      last = null;
      results.hidden = true;
      exportsNode.hidden = true;
      setStatus(
        "Kagua taarifa ulizoingiza. Matokeo ya zamani yamefutwa.",
        true,
      );
    }
  });
  form.addEventListener("input", function () {
    if (!last && !collection.length) return;
    last = null;
    results.replaceChildren();
    results.hidden = true;
    exportsNode.hidden = true;
    setStatus("Maingizo yamebadilika. Tengeneza matokeo mapya kabla ya kupakua.");
  });
  root.querySelector("[data-reset]").addEventListener("click", function () {
    form.reset();
    clearResult();
  });
  exportsNode.addEventListener("click", function (event) {
    var button = event.target.closest("button[data-export]");
    if (!button || (!last && config.owner !== "creator-desk")) return;
    var kind = button.dataset.export,
      payload =
        config.owner === "creator-desk" ? { projects: collection } : last;
    if (kind === "json")
      download(
        config.owner + "-sw.json",
        "application/json;charset=utf-8",
        JSON.stringify(payload, null, 2),
      );
    if (kind === "txt")
      download(
        config.owner + "-sw.txt",
        "text/plain;charset=utf-8",
        textExport(),
      );
    if (kind === "csv")
      download(
        config.owner + "-sw.csv",
        "text/csv;charset=utf-8",
        csv(
          [
            [
              "project",
              "client",
              "status",
              "value",
              "currency",
              "due",
              "notes",
            ],
          ].concat(
            collection.map(function (p) {
              return [
                p.name,
                p.client,
                p.status,
                p.value,
                p.currency,
                p.due,
                p.notes,
              ];
            }),
          ),
        ),
      );
    if (kind === "html")
      download(
        config.owner + "-sw.html",
        "text/html;charset=utf-8",
        pageHtml(),
      );
    if (kind === "pdf") invoicePdf();
    if (kind === "zip") carouselZip();
  });
  function fieldHtml(field) {
    var attrs =
      ' name="' +
      esc(field.name) +
      '" id="swfa-' +
      esc(field.name) +
      '"' +
      (field.required ? " required" : "") +
      (field.min != null ? ' min="' + field.min + '"' : "") +
      (field.max != null ? ' max="' + field.max + '"' : "") +
      (field.step ? ' step="' + field.step + '"' : "");
    var control;
    if (field.type === "textarea")
      control =
        "<textarea" + attrs + ">" + esc(field.value || "") + "</textarea>";
    else if (field.type === "select")
      control =
        "<select" +
        attrs +
        ">" +
        field.options
          .map(function (option) {
            var item =
              typeof option === "string"
                ? { value: option, label: option }
                : option;
            return (
              '<option value="' +
              esc(item.value) +
              '"' +
              (item.value === field.value ? " selected" : "") +
              ">" +
              esc(item.label) +
              "</option>"
            );
          })
          .join("") +
        "</select>";
    else
      control =
        '<input type="' +
        esc(field.type || "text") +
        '"' +
        attrs +
        ' value="' +
        esc(field.value == null ? "" : field.value) +
        '" autocomplete="off">';
    return (
      '<div class="swfa-field' +
      (field.wide ? " wide" : "") +
      '"><label for="swfa-' +
      esc(field.name) +
      '">' +
      esc(field.label) +
      "</label>" +
      control +
      "</div>"
    );
  }
  fields.innerHTML = config.fields.map(fieldHtml).join("");
  clearResult();
  function initAi() {
    var panel = root.querySelector("[data-ai-panel]");
    if (!panel) return;
    var consent = panel.querySelector("[data-ai-consent]"),
      preview = panel.querySelector("[data-ai-preview]"),
      run = panel.querySelector("[data-ai-run]");
    function payload() {
      var input = values();
      return (
        "Boresha media kit hii kwa Kiswahili. Usibuni takwimu, wateja au mafanikio.\n\n" +
        JSON.stringify(
          {
            creator: input.creator,
            tagline: input.tagline,
            service: input.service,
            description: input.description,
          },
          null,
          2,
        )
      );
    }
    panel.querySelector("[data-ai-refresh]").onclick = function () {
      preview.value = payload();
      setStatus("Onyesho la taarifa limesasishwa. Hakuna kilichotumwa.");
    };
    run.onclick = function () {
      if (!consent.checked) {
        setStatus("Kagua taarifa na ukubali wazi kabla ya kutumia AI.", true);
        return;
      }
      var body = payload();
      run.disabled = true;
      fetch("/.netlify/functions/ai-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-AfroTools-AI-Consent": "accepted",
        },
        body: JSON.stringify({
          tool: "creator-kit",
          message: body,
          aiConsent: "accepted",
          lang: "sw",
        }),
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { response: response, data: data };
          });
        })
        .then(function (bundle) {
          var text = bundle.data.reply || bundle.data.text || "";
          if (!bundle.response.ok || !text) throw new Error("unavailable");
          add("Pendekezo la AI — hakiki kabla ya kutumia", text);
          setStatus("Pendekezo la AI limepatikana. Hakiki kila dai.");
        })
        .catch(function () {
          setStatus(
            "AI haipatikani sasa. Media kit ya ndani na export bado zinafanya kazi.",
            true,
          );
        })
        .finally(function () {
          run.disabled = false;
        });
    };
    preview.value = payload();
  }
  initAi();
  window.__SwCreatorFinalA = {
    owner: config.owner,
    build: build,
    textExport: textExport,
    pageHtml: pageHtml,
  };
})();
