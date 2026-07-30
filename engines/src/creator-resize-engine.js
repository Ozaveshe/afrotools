!function() {
  "use strict";
  var e = [ {
    id: "ig-square",
    name: "IG Square",
    nameFr: "Carré Instagram",
    w: 1080,
    h: 1080,
    group: "instagram",
    slug: "instagram-square"
  }, {
    id: "ig-portrait",
    name: "IG Portrait",
    nameFr: "Portrait Instagram",
    w: 1080,
    h: 1350,
    group: "instagram",
    slug: "instagram-portrait"
  }, {
    id: "ig-story",
    name: "IG Story",
    nameFr: "Story Instagram",
    w: 1080,
    h: 1920,
    group: "instagram",
    slug: "instagram-story"
  }, {
    id: "x-post",
    name: "X Post",
    nameFr: "Publication X",
    w: 1200,
    h: 675,
    group: "x",
    slug: "x-post"
  }, {
    id: "x-header",
    name: "X Header",
    nameFr: "Bannière X",
    w: 1500,
    h: 500,
    group: "x",
    slug: "x-header"
  }, {
    id: "yt-thumb",
    name: "YT Thumbnail",
    nameFr: "Miniature YouTube",
    w: 1280,
    h: 720,
    group: "youtube",
    slug: "youtube-thumbnail"
  }, {
    id: "yt-banner",
    name: "YT Banner",
    nameFr: "Bannière YouTube",
    w: 2560,
    h: 1440,
    group: "youtube",
    slug: "youtube-banner"
  }, {
    id: "li-post",
    name: "LinkedIn Post",
    nameFr: "Publication LinkedIn",
    w: 1200,
    h: 627,
    group: "linkedin",
    slug: "linkedin-post"
  }, {
    id: "fb-cover",
    name: "FB Cover",
    nameFr: "Couverture Facebook",
    w: 820,
    h: 312,
    group: "facebook",
    slug: "facebook-cover"
  }, {
    id: "fb-post",
    name: "FB Post",
    nameFr: "Publication Facebook",
    w: 1200,
    h: 630,
    group: "facebook",
    slug: "facebook-post"
  }, {
    id: "pin",
    name: "Pinterest Pin",
    nameFr: "Épingle Pinterest",
    w: 1e3,
    h: 1500,
    group: "pinterest",
    slug: "pinterest-pin"
  }, {
    id: "wa-status",
    name: "WA Status",
    nameFr: "Statut WhatsApp",
    w: 1080,
    h: 1920,
    group: "whatsapp",
    slug: "whatsapp-status"
  } ], t = {
    all: e.map(function(e) {
      return e.id;
    }),
    instagram: [ "ig-square", "ig-portrait", "ig-story" ],
    youtube: [ "yt-thumb", "yt-banner" ],
    x: [ "x-post", "x-header" ],
    custom: []
  }, a = {
    en: {
      imageTooLarge: "Image too large. Max 10MB.",
      unsupportedImage: "Choose a PNG, JPEG, or WebP image.",
      unreadableImage: "This image could not be opened.",
      focalPoint: "Focal point: {x}%, {y}%",
      download: "Download {name}",
      downloaded: "Downloaded {name}",
      sizeCount: "{count} size",
      sizesCount: "{count} sizes",
      ready: "{count} ready",
      generatingZip: "Generating ZIP...",
      downloadedZip: "Downloaded {count} sizes as ZIP",
      noSizes: "Choose at least one size to download.",
      zipLoading: "ZIP library unavailable. Reload and try again.",
      resized: "resized",
      chooseSize: "Include {name}",
      removeSize: "Remove {name}"
    },
    fr: {
      imageTooLarge: "Image trop volumineuse. Maximum : 10 Mo.",
      unsupportedImage: "Choisissez une image PNG, JPEG ou WebP.",
      unreadableImage: "Impossible d’ouvrir cette image.",
      focalPoint: "Point focal : {x} %, {y} %",
      download: "Télécharger {name}",
      downloaded: "{name} téléchargé",
      sizeCount: "{count} format",
      sizesCount: "{count} formats",
      ready: "{count} prêts",
      generatingZip: "Création du ZIP…",
      downloadedZip: "{count} formats téléchargés dans le ZIP",
      noSizes: "Choisissez au moins un format à télécharger.",
      zipLoading: "Bibliothèque ZIP indisponible. Rechargez puis réessayez.",
      resized: "redimensionne",
      chooseSize: "Inclure {name}",
      removeSize: "Retirer {name}"
    }
  }, n = {
    sourceImage: null,
    sourceFile: null,
    focalPoint: {
      x: .5,
      y: .5
    },
    fillMode: "blur",
    activePreset: "all",
    activeSizeIds: t.all.slice(),
    canvases: {},
    blobs: {},
    sizes: e,
    presets: t,
    locale: /^fr\b/i.test(document.documentElement.lang || "") ? "fr" : "en",
    text: function(e, t) {
      var n = (a[this.locale] && a[this.locale][e]) || a.en[e] || e;
      return Object.keys(t || {}).reduce(function(e, a) {
        return e.split("{" + a + "}").join(String(t[a]));
      }, n);
    },
    sizeName: function(e) {
      return "fr" === this.locale ? e.nameFr : e.name;
    },
    init: function() {
      var e = this, n = localStorage.getItem("crz-fill-mode");
      n && (e.fillMode = n);
      var a = localStorage.getItem("crz-preset");
      a && t[a] && (e.activePreset = a, e.activeSizeIds = t[a].slice()), e.bindUpload(),
      e.bindPresets(), e.bindFillMode(), e.bindFocalPoint(), e.bindDownload(), e.bindModal(),
      e.syncUI();
    },
    bindUpload: function() {
      var e = this, t = document.getElementById("crzDropZone"), n = document.getElementById("crzFileInput"), a = document.getElementById("crzNewImage");
      t.addEventListener("click", function() {
        n.click();
      }), t.addEventListener("keydown", function(e) {
        ("Enter" === e.key || " " === e.key) && (e.preventDefault(), n.click());
      }), n.addEventListener("change", function() {
        if (n.files && n.files[0]) {
          var a = n.files[0];
          e.loadImage(a);
          (!/^image\/(?:png|jpeg|webp)$/i.test(a.type || "") || a.size > 10485760) && (n.value = "");
        }
      }), t.addEventListener("dragover", function(e) {
        e.preventDefault(), t.classList.add("dragover");
      }), t.addEventListener("dragleave", function() {
        t.classList.remove("dragover");
      }), t.addEventListener("drop", function(n) {
        n.preventDefault(), t.classList.remove("dragover");
        var a = n.dataTransfer.files;
        a && a[0] && e.loadImage(a[0]);
      }), a.addEventListener("click", function() {
        e.resetToUpload();
      });
    },
    loadImage: function(e) {
      var t = this;
      if (!e || !/^image\/(?:png|jpeg|webp)$/i.test(e.type || "")) {
        t.toast(t.text("unsupportedImage"), "error");
      } else if (e.size > 10485760) {
        t.toast(t.text("imageTooLarge"), "error");
      } else {
        t.sourceFile = e;
        var n = new FileReader;
        n.onload = function(e) {
          var n = new Image;
          n.onload = function() {
            t.sourceImage = n, t.focalPoint = {
              x: .5,
              y: .5
            }, document.getElementById("crzUploadState").style.display = "none", document.getElementById("crzEditor").style.display = "flex",
            document.getElementById("crzBottomBar").style.display = "flex", document.getElementById("crzDownloadAll").disabled = !1,
            document.getElementById("crzOriginalImg").src = e.target.result, t.updateFocalMarker(),
            t.renderAllSizes(), t.updateSizeCount();
            var a = parseInt(localStorage.getItem("crz-upload-count") || "0", 10);
            localStorage.setItem("crz-upload-count", String(a + 1));
          }, n.onerror = function() {
            t.toast(t.text("unreadableImage"), "error");
          }, n.src = e.target.result;
        }, n.onerror = function() {
          t.toast(t.text("unreadableImage"), "error");
        }, n.readAsDataURL(e);
      }
    },
    resetToUpload: function() {
      this.sourceImage = null, this.sourceFile = null, this.canvases = {}, this.blobs = {},
      this.focalPoint = {
        x: .5,
        y: .5
      }, document.getElementById("crzUploadState").style.display = "", document.getElementById("crzEditor").style.display = "none",
      document.getElementById("crzBottomBar").style.display = "none", document.getElementById("crzDownloadAll").disabled = !0,
      document.getElementById("crzFileInput").value = "", document.getElementById("crzSizeGrid").innerHTML = "";
    },
    bindPresets: function() {
      var e = this, n = document.querySelectorAll(".crz-preset-btn");
      n.forEach(function(a) {
        a.addEventListener("click", function() {
          var i = a.dataset.preset;
          n.forEach(function(e) {
            e.classList.remove("active"), e.setAttribute("aria-pressed", "false");
          }), a.classList.add("active"), a.setAttribute("aria-pressed", "true"), e.activePreset = i, "custom" !== i && (e.activeSizeIds = t[i].slice()),
          localStorage.setItem("crz-preset", i), e.sourceImage && (e.renderAllSizes(), e.updateSizeCount());
        });
      });
    },
    bindFillMode: function() {
      var e = this, t = document.getElementById("crzFillSelect");
      t.value = e.fillMode, t.addEventListener("change", function() {
        e.setFillMode(t.value);
      });
      var n = document.querySelectorAll(".crz-fill-btn");
      n.forEach(function(a) {
        a.dataset.fill === e.fillMode && a.classList.add("active"), a.addEventListener("click", function() {
          n.forEach(function(e) {
            e.classList.remove("active");
          }), a.classList.add("active"), e.setFillMode(a.dataset.fill), t.value = a.dataset.fill;
        });
      });
    },
    setFillMode: function(e) {
      this.fillMode = e, localStorage.setItem("crz-fill-mode", e), document.querySelectorAll(".crz-fill-btn").forEach(function(t) {
        t.classList.toggle("active", t.dataset.fill === e), t.setAttribute("aria-pressed", t.dataset.fill === e ? "true" : "false");
      }), this.sourceImage && this.renderAllSizes();
    },
    bindFocalPoint: function() {
      var e = this, t = document.getElementById("crzOriginalImg");
      t.addEventListener("click", function(n) {
        var a = t.getBoundingClientRect();
        e.focalPoint.x = Math.max(0, Math.min(1, (n.clientX - a.left) / a.width)), e.focalPoint.y = Math.max(0, Math.min(1, (n.clientY - a.top) / a.height)),
        e.updateFocalMarker(), e.renderAllSizes();
      }), document.getElementById("crzFocalReset").addEventListener("click", function() {
        e.focalPoint = {
          x: .5,
          y: .5
        }, e.updateFocalMarker(), e.renderAllSizes();
      });
    },
    updateFocalMarker: function() {
      var e = document.getElementById("crzFocalMarker");
      e.style.left = 100 * this.focalPoint.x + "%", e.style.top = 100 * this.focalPoint.y + "%";
      var t = document.getElementById("crzFocalLabel"), n = Math.round(100 * this.focalPoint.x), a = Math.round(100 * this.focalPoint.y);
      t.textContent = this.text("focalPoint", {
        x: n,
        y: a
      });
    },
    renderAllSizes: function() {
      var t = this, n = document.getElementById("crzSizeGrid");
      n.innerHTML = "", t.canvases = {}, t.blobs = {};
      var a = t.activeSizeIds;
      e.forEach(function(e) {
        var i = -1 !== a.indexOf(e.id), o = document.createElement("div");
        o.className = "crz-size-card" + (i ? " active" : " disabled"), o.dataset.sizeId = e.id;
        var l = document.createElement("div");
        if (l.className = "crz-size-preview", i && t.sourceImage) {
          var d = t.renderSize(e);
          t.canvases[e.id] = d;
          var r = document.createElement("canvas"), c = Math.min(260 / e.w, 260 / e.h, 1);
          r.width = Math.round(e.w * c), r.height = Math.round(e.h * c), r.getContext("2d").drawImage(d, 0, 0, r.width, r.height),
          l.appendChild(r), d.toBlob(function(n) {
            t.blobs[e.id] = n;
          }, "image/png");
        } else {
          var s = document.createElement("span");
          s.className = "crz-placeholder", s.textContent = e.w + "×" + e.h, l.appendChild(s);
        }
        var u = document.createElement("div");
        u.className = "crz-size-meta";
        var m = document.createElement("div");
        var p = t.sizeName(e);
        m.innerHTML = '<div class="crz-size-name">' + p + '</div><div class="crz-size-dims">' + e.w + "×" + e.h + "</div>";
        var g = document.createElement("button");
        g.className = "crz-size-dl", g.innerHTML = "&#8595;", g.title = t.text("download", {
          name: p
        }), g.setAttribute("aria-label", g.title),
        g.addEventListener("click", function(n) {
          n.stopPropagation(), t.downloadSingle(e.id);
        }), u.appendChild(m);
        if ("custom" === t.activePreset) {
          var f = document.createElement("button");
          f.className = "crz-size-dl crz-size-toggle", f.textContent = i ? "✓" : "+", f.title = t.text(i ? "removeSize" : "chooseSize", {
            name: p
          }), f.setAttribute("aria-label", f.title), f.addEventListener("click", function(n) {
            n.stopPropagation(), t.toggleSize(e.id);
          }), u.appendChild(f), o.className = "crz-size-card" + (i ? " active" : ""), o.style.opacity = i ? "" : ".55";
        } else {
          i && u.appendChild(g);
        }
        o.appendChild(l), o.appendChild(u),
        i && "custom" !== t.activePreset && o.addEventListener("click", function() {
          t.openModal(e.id);
        }), i && "custom" !== t.activePreset && (o.tabIndex = 0, o.setAttribute("role", "button"), o.setAttribute("aria-label", t.sizeName(e) + " " + e.w + "×" + e.h),
        o.addEventListener("keydown", function(n) {
          ("Enter" === n.key || " " === n.key) && (n.preventDefault(), t.openModal(e.id));
        })), n.appendChild(o);
      });
    },
    renderSize: function(e) {
      var t = document.createElement("canvas");
      t.width = e.w, t.height = e.h;
      var n = t.getContext("2d"), a = this.sourceImage, i = this.focalPoint;
      if ("crop" === this.fillMode) {
        this.cropToSize(n, a, e.w, e.h, i.x, i.y);
      } else if ("blur" === this.fillMode) {
        n.save(), n.filter = "blur(40px)", n.drawImage(a, -20, -20, e.w + 40, e.h + 40),
        n.restore(), n.fillStyle = "rgba(0,0,0,0.15)", n.fillRect(0, 0, e.w, e.h), this.drawFocalCentered(n, a, e.w, e.h);
      } else if ("solid" === this.fillMode) {
        var o = this.getEdgeColor(a);
        n.fillStyle = o, n.fillRect(0, 0, e.w, e.h), this.drawFocalCentered(n, a, e.w, e.h);
      } else if ("gradient" === this.fillMode) {
        var l = this.getDominantColors(a), d = n.createLinearGradient(0, 0, e.w, e.h);
        d.addColorStop(0, l[0]), d.addColorStop(1, l[1]), n.fillStyle = d, n.fillRect(0, 0, e.w, e.h),
        this.drawFocalCentered(n, a, e.w, e.h);
      } else {
        "extend" === this.fillMode && (n.drawImage(a, 0, 0, e.w, e.h), this.drawFocalCentered(n, a, e.w, e.h));
      }
      return t;
    },
    cropToSize: function(e, t, n, a, i, o) {
      var l, d, r, c, s = n / a;
      t.width / t.height > s ? (l = (d = t.height) * s, r = Math.max(0, Math.min(i * t.width - l / 2, t.width - l)),
      c = 0) : (d = (l = t.width) / s, r = 0, c = Math.max(0, Math.min(o * t.height - d / 2, t.height - d))),
      e.drawImage(t, r, c, l, d, 0, 0, n, a);
    },
    drawFocalCentered: function(e, t, n, a) {
      var i, o, l = t.width / t.height;
      l > n / a ? (i = n, o = n / l) : (o = a, i = a * l);
      var d = (n - i) / 2, r = (a - o) / 2;
      e.drawImage(t, d, r, i, o);
    },
    getEdgeColor: function(e) {
      var t = document.createElement("canvas");
      t.width = 1, t.height = 1;
      var n = t.getContext("2d");
      n.drawImage(e, 0, 0, 1, 1);
      var a = n.getImageData(0, 0, 1, 1).data;
      return "rgb(" + a[0] + "," + a[1] + "," + a[2] + ")";
    },
    getDominantColors: function(e) {
      var t = document.createElement("canvas");
      t.width = 2, t.height = 1;
      var n = t.getContext("2d");
      n.drawImage(e, 0, 0, 2, 1);
      var a = n.getImageData(0, 0, 2, 1).data;
      return [ "rgb(" + a[0] + "," + a[1] + "," + a[2] + ")", "rgb(" + a[4] + "," + a[5] + "," + a[6] + ")" ];
    },
    toggleSize: function(e) {
      var t = this.activeSizeIds.indexOf(e);
      -1 === t ? this.activeSizeIds.push(e) : this.activeSizeIds.splice(t, 1), this.renderAllSizes(),
      this.updateSizeCount();
    },
    updateSizeCount: function() {
      var e = this.activeSizeIds.length;
      var t = this.text(1 === e ? "sizeCount" : "sizesCount", {
        count: e
      });
      document.getElementById("crzSizeCount").textContent = t,
      document.getElementById("crzBottomInfo").textContent = this.text("ready", {
        count: t
      });
    },
    bindDownload: function() {
      var e = this;
      document.getElementById("crzDownloadAll").addEventListener("click", function() {
        e.downloadAll();
      }), document.getElementById("crzDownloadAllBottom").addEventListener("click", function() {
        e.downloadAll();
      });
    },
    downloadSingle: function(t) {
      var n = this, a = n.canvases[t];
      if (a) {
        var i = e.find(function(e) {
          return e.id === t;
        });
        i && a.toBlob(function(e) {
          var t = URL.createObjectURL(e), a = document.createElement("a");
          a.href = t, a.download = i.slug + ".png", document.body.appendChild(a), a.click(),
          document.body.removeChild(a), URL.revokeObjectURL(t), n.toast(n.text("downloaded", {
            name: n.sizeName(i)
          }), "success");
        }, "image/png");
      }
    },
    downloadAll: function() {
      var t = this;
      if ("undefined" != typeof JSZip) {
        var n = [];
        if (t.activeSizeIds.forEach(function(a) {
          var i = t.canvases[a], o = e.find(function(e) {
            return e.id === a;
          });
          i && o && n.push({
            canvas: i,
            size: o
          });
        }), 0 !== n.length) {
          t.toast(t.text("generatingZip"), "success");
          var a = new JSZip, i = t.sourceFile ? t.sourceFile.name.replace(/\.[^.]+$/, "") : t.text("resized"), o = n.length;
          n.forEach(function(e) {
            e.canvas.toBlob(function(l) {
              a.file(i + "/" + e.size.slug + ".png", l), 0 === --o && a.generateAsync({
                type: "blob"
              }).then(function(e) {
                var a = URL.createObjectURL(e), o = document.createElement("a");
                o.href = a, o.download = i + "-all-sizes.zip", document.body.appendChild(o), o.click(),
                document.body.removeChild(o), URL.revokeObjectURL(a), t.toast(t.text("downloadedZip", {
                  count: n.length
                }), "success");
              });
            }, "image/png");
          });
        } else {
          t.toast(t.text("noSizes"), "error");
        }
      } else {
        t.toast(t.text("zipLoading"), "error");
      }
    },
    bindModal: function() {
      var e = this, t = document.getElementById("crzModal");
      document.getElementById("crzModalClose").addEventListener("click", function() {
        e.closeModal();
      }), t.addEventListener("click", function(t) {
        t.target === document.getElementById("crzModal") && e.closeModal();
      }), document.getElementById("crzModalDownload").addEventListener("click", function() {
        e._modalSizeId && e.downloadSingle(e._modalSizeId);
      }), document.addEventListener("keydown", function(t) {
        "Escape" === t.key && e.closeModal();
      });
    },
    openModal: function(t) {
      var n = this.canvases[t], a = e.find(function(e) {
        return e.id === t;
      });
      if (n && a) {
        this._modalSizeId = t;
        var i = document.getElementById("crzModalCanvas");
        i.width = n.width, i.height = n.height, i.getContext("2d").drawImage(n, 0, 0), document.getElementById("crzModalLabel").textContent = this.sizeName(a),
        document.getElementById("crzModalDims").textContent = a.w + "×" + a.h + " px", this._modalReturnFocus = document.activeElement;
        var o = document.getElementById("crzModal");
        o.classList.add("open"), o.setAttribute("aria-hidden", "false"), document.getElementById("crzModalClose").focus();
      }
    },
    closeModal: function() {
      var e = document.getElementById("crzModal");
      e && (e.classList.remove("open"), e.setAttribute("aria-hidden", "true")), this._modalReturnFocus && "function" == typeof this._modalReturnFocus.focus && this._modalReturnFocus.focus(),
      this._modalReturnFocus = null;
    },
    syncUI: function() {
      var e = this;
      document.querySelectorAll(".crz-preset-btn").forEach(function(t) {
        t.classList.toggle("active", t.dataset.preset === e.activePreset), t.setAttribute("aria-pressed", t.dataset.preset === e.activePreset ? "true" : "false");
      }), document.querySelectorAll(".crz-fill-btn").forEach(function(t) {
        t.classList.toggle("active", t.dataset.fill === e.fillMode), t.setAttribute("aria-pressed", t.dataset.fill === e.fillMode ? "true" : "false");
      });
      var t = document.getElementById("crzFillSelect");
      t && (t.value = e.fillMode);
    },
    toast: function(e, t) {
      var n = document.getElementById("crzToast");
      n.textContent = e, n.className = "crz-toast " + (t || "") + " show", clearTimeout(this._toastTimer),
      this._toastTimer = setTimeout(function() {
        n.classList.remove("show");
      }, 2500);
    }
  };
  window.AfroTools = window.AfroTools || {}, window.AfroTools.engines = window.AfroTools.engines || {},
  window.AfroTools.engines.creatorResize = n, "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", function() {
    n.init();
  }) : n.init();
}();
