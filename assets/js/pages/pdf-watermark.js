!function() {
    "use strict";
    var e = {
        files: [],
        type: "text",
        position: "center",
        imageFile: null,
        imageSource: null,
        results: [],
        download: null,
        busy: !1,
        previewToken: 0
    }, t = {}, a = {
        Helvetica: "Helvetica",
        HelveticaBold: "HelveticaBold",
        TimesRoman: "TimesRoman",
        CourierBold: "CourierBold"
    };

    // Readable owner recovered from the previously sole, minified runtime.
    // PDF drawing/serialization functions are retained; generations own async publication.
    var revision = 0, imageRevision = 0;
    var locale = /^(fr|sw)$/.test(document.documentElement.lang) ? document.documentElement.lang : 'en';
    function native(en, fr, sw) { return locale === 'fr' ? fr : locale === 'sw' ? sw : en; }
    function invalidate() {
        revision++; e.previewToken++; e.results = []; e.download = null;
        if (t.actionRow) { p(''); c(t.resultNote, native('Settings changed. Apply the watermark again.', 'Réglages modifiés. Appliquez de nouveau le filigrane.', 'Mipangilio imebadilika. Weka alama ya maji tena.')); }
    }
    function message(text) {
        var fixed = {
            'Remove': ['Retirer', 'Ondoa'],
            'Applying Watermark...': ['Application du filigrane…', 'Inaweka alama ya maji…'],
            'Apply Watermark': ['Appliquer le filigrane', 'Weka alama ya maji'],
            'Preparing watermark...': ['Préparation du filigrane…', 'Inaandaa alama ya maji…'],
            'Download PDF': ['Télécharger le PDF', 'Pakua PDF'], 'Download ZIP': ['Télécharger le ZIP', 'Pakua ZIP'],
            'Upload a PDF to preview the first selected page.': ['Choisissez un PDF pour afficher la première page sélectionnée.', 'Chagua PDF ili kuona ukurasa wa kwanza uliochaguliwa.'],
            'Keep your original PDF if you need a clean version later.': ['Conservez le PDF original pour garder une version sans filigrane.', 'Hifadhi PDF asili ili ubaki na nakala isiyo na alama ya maji.'],
            'Tiled mode repeats the watermark across each selected page.': ['Le mode mosaïque répète le filigrane sur chaque page sélectionnée.', 'Hali ya kurudia huweka alama ya maji mara kadhaa kwenye kila ukurasa uliochaguliwa.'],
            'Behind-content output rebuilds the visual pages so the watermark sits below the original page artwork.': ['Le mode arrière-plan reconstruit les pages visuelles pour placer le filigrane sous le contenu original.', 'Hali ya nyuma huunda upya mwonekano wa kurasa ili alama ya maji iwe chini ya maudhui asili.'],
            'Choose a PNG, JPG, JPEG, or WebP image.': ['Choisissez une image PNG, JPG, JPEG ou WebP.', 'Chagua picha ya PNG, JPG, JPEG au WebP.']
        };
        if (fixed[text]) return native(text, fixed[text][0], fixed[text][1]);
        return text;
    }
    function failure(error) {
        if (error && error.code === 'PAGE_RANGE') return native('Check the page range: use whole page numbers, for example 1-3, 5.', 'Vérifiez les pages : utilisez des numéros entiers, par exemple 1-3, 5.', 'Kagua kurasa: tumia namba kamili za kurasa, kwa mfano 1-3, 5.');
        return native('The watermark could not be applied. Choose a readable PDF and a valid watermark image or text, then try again.', 'Impossible d’appliquer le filigrane. Choisissez un PDF lisible et une image ou un texte valide, puis réessayez.', 'Alama ya maji haikuwekwa. Chagua PDF inayosomeka na picha au maandishi halali, kisha ujaribu tena.');
    }
    function i(e) {
        return document.getElementById(e);
    }
    function n() {
        if (!window.PDFLib || !window.PDFLib.PDFDocument) throw new Error("PDF library failed to load. Please refresh the page.");
        return window.PDFLib;
    }
    function r() {
        if (!window.pdfjsLib) throw new Error("PDF preview renderer failed to load. Please refresh the page.");
        return window.pdfjsLib.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdfjs/pdf.worker.min.js",
        window.pdfjsLib;
    }
    function o(e) {
        return !(!e || !/^image\/(png|jpe?g|webp)$/i.test(e.type || "") && !/\.(png|jpe?g|webp)$/i.test(e.name || ""));
    }
    function l(e) {
        return [ e.name, e.size, e.lastModified ].join(":");
    }
    function s(e) {
        if (!e) return "0 B";
        for (var t = [ "B", "KB", "MB", "GB" ], a = e, i = 0; a >= 1024 && i < t.length - 1; ) a /= 1024,
        i++;
        return (0 === i ? Math.round(a) : a.toFixed(a >= 10 ? 1 : 2)) + " " + t[i];
    }
    function u(e) {
        return 72 * Number(e || 0) / 25.4;
    }
    function c(e, t) {
        e && (e.textContent = message(t || ""));
    }
    function f(e) {
        var t = /^#[0-9a-f]{6}$/i.test(e || "") ? e : "#000000";
        return {
            r: parseInt(t.slice(1, 3), 16) / 255,
            g: parseInt(t.slice(3, 5), 16) / 255,
            b: parseInt(t.slice(5, 7), 16) / 255,
            hex: t.toUpperCase()
        };
    }
    function g(value, count) {
        var text = String(value || '').trim();
        if (!text || /^all$/i.test(text)) return Array.from({length: count}, function(_, i) { return i + 1; });
        var pages = [];
        text.split(',').forEach(function(token) {
            var match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(token.trim());
            var from = match && Number(match[1]), to = match && Number(match[2] || match[1]);
            if (!match || !Number.isSafeInteger(from) || !Number.isSafeInteger(to) || from < 1 || to < from || to > count) {
                var error = new Error('Invalid page range'); error.code = 'PAGE_RANGE'; throw error;
            }
            for (var page = from; page <= to; page++) if (pages.indexOf(page) < 0) pages.push(page);
        });
        return pages;
    }
    function d(e) {
        var t = {};
        return e.forEach(function(e) {
            t[e] = !0;
        }), t;
    }
    function m(t) {
        invalidate();
        {
            var a = {};
            e.files.forEach(function(e) {
                a[l(e.file)] = !0;
            });
            var i = 0;
            Array.from(t || []).forEach(function(t) {
                if (function(e) {
                    return !(!e || "application/pdf" !== e.type && !/\.pdf$/i.test(e.name || ""));
                }(t)) {
                    var n = l(t);
                    a[n] || (a[n] = !0, e.files.push({
                        file: t
                    }));
                } else i++;
            }), e.results = [], e.download = null, h(), p(i ? native("Non-PDF files skipped: ", "Fichiers non PDF ignorés : ", "Faili zisizo PDF zimerukwa: ") + i : ""),
            k();
        }
    }
    function updateApply() {
        t.watermarkBtn.disabled = e.busy || !e.files.length || (e.type === 'image' && !e.imageSource);
    }
    function h() {
        updateApply(), t.fileList.innerHTML = "",
        e.files.forEach(function(a, i) {
            var n = document.createElement("div");
            n.className = "file-row";
            var r = document.createElement("div");
            r.style.minWidth = "0";
            var o = document.createElement("div");
            o.className = "file-name", o.setAttribute("translate", "no"), o.textContent = a.file.name;
            var l = document.createElement("div");
            l.className = "file-meta", l.textContent = s(a.file.size), r.appendChild(o), r.appendChild(l);
            var u = document.createElement("button");
            u.className = "mini-btn", u.type = "button", u.textContent = message("Remove"), u.addEventListener("click", function() {
                !function(t) {
                    e.busy || (invalidate(), e.files.splice(t, 1), e.results = [], e.download = null, h(), p(""),
                    k());
                }(i);
            }), n.appendChild(r), n.appendChild(u), t.fileList.appendChild(n);
        });
    }
    function p(e) {
        t.resultCard.classList.remove("on"), c(t.resultText, ""), c(t.resultNote, e || ""),
        t.resultRows.innerHTML = "", t.actionRow.classList.remove("on"), t.progressBar.style.display = "none",
        t.progressFill.style.width = "0%";
    }
    function w(e) {
        t.progressBar.style.display = "block", t.progressFill.style.width = Math.max(0, Math.min(100, e || 0)) + "%";
    }
    function v(a) {
        e.busy = a, updateApply(), t.watermarkBtn.textContent = message(a ? "Applying Watermark..." : "Apply Watermark"),
        document.querySelectorAll(".choice-btn, .mini-btn").forEach(function(e) {
            e.disabled = a;
        });
    }
    function y() {
        var i = f(t.customColor.value || t.textColor.value);
        return {
            type: e.type,
            text: (t.watermarkText.value || "WATERMARK").trim() || "WATERMARK",
            fontName: a[t.fontSelect.value] || "HelveticaBold",
            color: i,
            textOpacity: Math.max(.01, Math.min(1, Number(t.textOpacity.value) / 100 || .3)),
            imageOpacity: Math.max(.01, Math.min(1, Number(t.imageOpacity.value) / 100 || .3)),
            fontSize: Math.max(1, Number(t.fontSize.value) || 60),
            imageScale: Math.max(.01, Number(t.imageScale.value) / 100 || .3),
            rotation: Number(t.rotation.value) || 0,
            tileGap: Math.max(5, Number(t.tileGap.value) || 110),
            offsetX: u(t.offsetX.value),
            offsetY: u(t.offsetY.value),
            position: e.position,
            pattern: t.patternSelect.value,
            layer: t.layerSelect.value,
            pageRange: t.pageRange.value.trim(),
            imageSource: e.imageSource
        };
    }
    async function x(e) {
        if (!e || !o(e)) throw new Error("Please choose a PNG, JPG, JPEG, or WebP watermark image.");
        var t = function(e) {
            var t = String(e && e.type || "").toLowerCase();
            return "image/jpg" === t ? "image/jpeg" : t || (/\.png$/i.test(e.name || "") ? "image/png" : /\.webp$/i.test(e.name || "") ? "image/webp" : "image/jpeg");
        }(e), a = new Uint8Array(await e.arrayBuffer()), i = await function(e) {
            return new Promise(function(t, a) {
                var i = URL.createObjectURL(e), n = new Image;
                n.onload = function() {
                    var e = {
                        width: n.naturalWidth || n.width,
                        height: n.naturalHeight || n.height
                    };
                    URL.revokeObjectURL(i), t(e);
                }, n.onerror = function() {
                    URL.revokeObjectURL(i), a(new Error("Could not read watermark image."));
                }, n.src = i;
            });
        }(e);
        if ("image/webp" === t) {
            var n = await function(e) {
                return new Promise(function(t, a) {
                    var i = URL.createObjectURL(e), n = new Image;
                    n.onload = function() {
                        var e = document.createElement("canvas");
                        e.width = n.naturalWidth || n.width, e.height = n.naturalHeight || n.height;
                        var r = e.getContext("2d");
                        if (!r) return URL.revokeObjectURL(i), void a(new Error("Could not create image conversion canvas."));
                        r.drawImage(n, 0, 0), e.toBlob(function(n) {
                            URL.revokeObjectURL(i), n ? n.arrayBuffer().then(function(a) {
                                t({
                                    bytes: new Uint8Array(a),
                                    type: "image/png",
                                    width: e.width,
                                    height: e.height
                                }), e.width = 1, e.height = 1;
                            }, a) : a(new Error("Could not convert WebP image for PDF output."));
                        }, "image/png");
                    }, n.onerror = function() {
                        URL.revokeObjectURL(i), a(new Error("Could not decode watermark image."));
                    }, n.src = i;
                });
            }(e);
            return {
                bytes: n.bytes,
                type: "image/png",
                width: n.width,
                height: n.height
            };
        }
        return {
            bytes: a,
            type: "image/png" === t ? "image/png" : "image/jpeg",
            width: i.width,
            height: i.height
        };
    }
    async function b(e, t) {
        var a = n();
        if ("image" === t.type) {
            if (!t.imageSource) throw new Error("Please select a watermark image.");
            return {
                type: "image",
                image: "image/png" === t.imageSource.type ? await e.embedPng(t.imageSource.bytes) : await e.embedJpg(t.imageSource.bytes)
            };
        }
        return {
            type: "text",
            font: await e.embedFont(a.StandardFonts[t.fontName] || a.StandardFonts.HelveticaBold)
        };
    }
    function S(e, t, a, i, n, r) {
        var o = 36, l = (t - i) / 2, s = (a - n) / 2;
        return -1 !== e.indexOf("left") && (l = o), -1 !== e.indexOf("right") && (l = t - i - o),
        -1 !== e.indexOf("top") && (s = a - n - o), -1 !== e.indexOf("bottom") && (s = o),
        "top-center" === e && (s = a - n - o), "bottom-center" === e && (s = o), "middle-left" === e && (l = o),
        "middle-right" === e && (l = t - i - o), {
            x: l + r.offsetX,
            y: s + r.offsetY
        };
    }
    function C(e, t, a) {
        var i = n(), r = e.getSize(), o = "image" === t.type ? function(e, t, a, i) {
            var n = Math.max(1, e * a.imageScale), r = n * i.image.height / i.image.width, o = .92 * t;
            return r > o && (n = (r = o) * i.image.width / i.image.height), {
                width: n,
                height: r
            };
        }(r.width, r.height, t, a) : function(e, t) {
            var a = e.text.split(/\r?\n/), i = 0;
            return a.forEach(function(a) {
                i = Math.max(i, t.font.widthOfTextAtSize(a || " ", e.fontSize));
            }), {
                width: i,
                height: a.length * e.fontSize * 1.16,
                lineHeight: 1.16 * e.fontSize
            };
        }(t, a);
        if ("tile" !== t.pattern) {
            var l = S(t.position, r.width, r.height, o.width, o.height, t);
            if ("image" === t.type) e.drawImage(a.image, {
                x: l.x,
                y: l.y,
                width: o.width,
                height: o.height,
                opacity: t.imageOpacity,
                rotate: i.degrees(t.rotation)
            }); else {
                var s = i.rgb(t.color.r, t.color.g, t.color.b);
                e.drawText(t.text, {
                    x: l.x,
                    y: l.y,
                    size: t.fontSize,
                    font: a.font,
                    color: s,
                    opacity: t.textOpacity,
                    rotate: i.degrees(t.rotation),
                    lineHeight: o.lineHeight
                });
            }
        } else !function(e, t, a, i) {
            for (var r = n(), o = e.getSize(), l = Math.max(25, i.width + t.tileGap), s = Math.max(25, i.height + t.tileGap), u = 0, c = -i.height; c < o.height + i.height; c += s) for (var f = -i.width; f < o.width + i.width; f += l) {
                if (u++ > 600) return;
                var g = f + t.offsetX, d = c + t.offsetY;
                "image" === t.type ? e.drawImage(a.image, {
                    x: g,
                    y: d,
                    width: i.width,
                    height: i.height,
                    opacity: t.imageOpacity,
                    rotate: r.degrees(t.rotation)
                }) : e.drawText(t.text, {
                    x: g,
                    y: d,
                    size: t.fontSize,
                    font: a.font,
                    color: r.rgb(t.color.r, t.color.g, t.color.b),
                    opacity: t.textOpacity,
                    rotate: r.degrees(t.rotation),
                    lineHeight: i.lineHeight
                });
            }
        }(e, t, a, o);
    }
    async function E(e, t, a, i) {
        var r = a / i * 92, o = 92 / i, l = "under" === t.layer ? await async function(e, t, a, i) {
            for (var r = n(), o = await r.PDFDocument.load(await e.arrayBuffer(), {
                ignoreEncryption: !0,
                updateMetadata: !1
            }), l = await r.PDFDocument.create(), s = o.getPages(), u = g(t.pageRange, s.length), c = d(u), f = await b(l, t), m = 0; m < s.length; m++) {
                var h = s[m], p = h.getSize(), v = l.addPage([ p.width, p.height ]);
                c[m + 1] && C(v, t, f);
                var y = await l.embedPage(h);
                v.drawPage(y, {
                    x: 0,
                    y: 0,
                    width: p.width,
                    height: p.height
                }), w(a + (m + 1) / s.length * i);
            }
            return {
                bytes: await l.save({
                    useObjectStreams: !0,
                    addDefaultPage: !1
                }),
                pageCount: s.length,
                selectedCount: u.length,
                note: "Behind-content output rebuilds the visual pages so the watermark sits below the original page artwork."
            };
        }(e.file, t, r, o) : await async function(e, t, a, i) {
            var r = n(), o = await r.PDFDocument.load(await e.arrayBuffer(), {
                ignoreEncryption: !0,
                updateMetadata: !1
            }), l = o.getPages(), s = g(t.pageRange, l.length), u = d(s), c = await b(o, t);
            return l.forEach(function(e, n) {
                u[n + 1] && C(e, t, c), w(a + (n + 1) / l.length * i);
            }), {
                bytes: await o.save({
                    useObjectStreams: !0,
                    addDefaultPage: !1
                }),
                pageCount: l.length,
                selectedCount: s.length,
                note: ""
            };
        }(e.file, t, r, o);
        return {
            name: function(e, t) {
                return String(e || t || "document").replace(/\.pdf$/i, "").replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "") || t || "document";
            }(e.file.name, "document") + "_watermarked.pdf",
            bytes: l.bytes,
            originalSize: e.file.size,
            outputSize: l.bytes.length,
            pageCount: l.pageCount,
            selectedCount: l.selectedCount,
            note: l.note
        };
    }
    async function L() {
        if (e.files.length && !e.busy && (e.type !== 'image' || e.imageSource)) {
            v(!0), e.results = [], e.download = null, t.resultCard.classList.add("on"), c(t.resultText, "Preparing watermark..."),
            c(t.resultNote, ""), t.resultRows.innerHTML = "", t.actionRow.classList.remove("on"),
            w(0);
            var version = revision, files = e.files.slice(), results = [];
            try {
                var a = y();
                if (a.type === 'image') {
                    a.imageSource = e.imageSource;
                    if (version !== revision) return;
                    e.imageSource = a.imageSource;
                }
                for (var i = 0; i < files.length; i++) {
                    if (version !== revision) return;
                    c(t.resultText, native('Watermarking ', 'Application du filigrane ', 'Inaweka alama ya maji ') + (i + 1) + '/' + files.length + ': ' + files[i].file.name);
                    results.push(await E(files[i], a, i, files.length));
                }
                if (version !== revision) return;
                // Sanitized or case-equivalent source names must not overwrite ZIP members.
                var outputNames = Object.create(null);
                results.forEach(function(result) {
                    var originalName = result.name, suffix = 2;
                    while (outputNames[result.name.toLowerCase()]) {
                        result.name = originalName.replace(/\.pdf$/i, '_' + suffix + '.pdf');
                        suffix++;
                    }
                    outputNames[result.name.toLowerCase()] = true;
                });
                e.results = results;
                w(100), function(a) {
                    var i = 1 === e.results.length;
                    t.resultRows.innerHTML = "";
                    var n = "";
                    e.results.forEach(function(e) {
                        var a = document.createElement("div");
                        a.className = "result-row", a.setAttribute("translate", "no"), a.textContent = e.name + " - " + e.selectedCount + "/" + e.pageCount + native(" pages watermarked - ", " pages avec filigrane - ", " kurasa zimewekewa alama ya maji - ") + s(e.outputSize),
                        t.resultRows.appendChild(a), e.note && (n = e.note);
                    });
                    var r = e.results.reduce(function(e, t) {
                        return e + t.selectedCount;
                    }, 0);
                    c(t.resultText, native("Done. Watermarked pages: ", "Terminé. Pages avec filigrane : ", "Imekamilika. Kurasa zenye alama ya maji: ") + r + "."),
                    c(t.resultNote, n || ("tile" === a.pattern ? "Tiled mode repeats the watermark across each selected page." : "Keep your original PDF if you need a clean version later.")),
                    e.download = i ? {
                        blob: new Blob([ e.results[0].bytes ], {
                            type: "application/pdf"
                        }),
                        filename: e.results[0].name
                    } : {
                        blob: P(e.results.map(function(e) {
                            return {
                                name: e.name,
                                data: e.bytes
                            };
                        })),
                        filename: "watermarked_pdfs.zip"
                    }, t.downloadBtn.textContent = message(i ? "Download PDF" : "Download ZIP"), t.actionRow.classList.add("on");
                }(a);
            } catch (e) {
                if (version === revision) { c(t.resultText, failure(e)); t.actionRow.classList.remove("on"); }
            } finally {
                v(!1), k();
            }
        }
    }
    function U(e) {
        var t = U.table;
        if (!t) {
            t = U.table = new Uint32Array(256);
            for (var a = 0; a < 256; a++) {
                for (var i = a, n = 0; n < 8; n++) i = 1 & i ? 3988292384 ^ i >>> 1 : i >>> 1;
                t[a] = i >>> 0;
            }
        }
        for (var r = 4294967295, o = 0; o < e.length; o++) r = t[255 & (r ^ e[o])] ^ r >>> 8;
        return (4294967295 ^ r) >>> 0;
    }
    function P(e) {
        var t = new TextEncoder, a = [], i = [], n = 0;
        e.forEach(function(e) {
            var r = t.encode(e.name), o = e.data instanceof Uint8Array ? e.data : new Uint8Array(e.data), l = U(o), s = new Uint8Array(30 + r.length), u = new DataView(s.buffer);
            u.setUint32(0, 67324752, !0), u.setUint16(4, 20, !0), u.setUint32(14, l, !0), u.setUint32(18, o.length, !0),
            u.setUint32(22, o.length, !0), u.setUint16(26, r.length, !0), s.set(r, 30);
            var c = new Uint8Array(46 + r.length), f = new DataView(c.buffer);
            f.setUint32(0, 33639248, !0), f.setUint16(4, 20, !0), f.setUint16(6, 20, !0), f.setUint32(16, l, !0),
            f.setUint32(20, o.length, !0), f.setUint32(24, o.length, !0), f.setUint16(28, r.length, !0),
            f.setUint32(38, 32, !0), f.setUint32(42, n, !0), c.set(r, 46), i.push(c), a.push(s, o),
            n += s.length + o.length;
        });
        var r = n, o = 0;
        i.forEach(function(e) {
            a.push(e), o += e.length;
        });
        var l = new Uint8Array(22), s = new DataView(l.buffer);
        return s.setUint32(0, 101010256, !0), s.setUint16(8, e.length, !0), s.setUint16(10, e.length, !0),
        s.setUint32(12, o, !0), s.setUint32(16, r, !0), a.push(l), new Blob(a, {
            type: "application/zip"
        });
    }
    // Render the selected page with the same PDF drawing primitives as the export.
    // A private canvas prevents a slow previous render from overwriting newer work.
    async function previewPDF(file, settings) {
        var lib = n(), source = await lib.PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
        var chosen = g(settings.pageRange, source.getPageCount())[0], doc = await lib.PDFDocument.create();
        var sourcePage = source.getPage(chosen - 1), page;
        if (settings.layer === 'under') {
            var size = sourcePage.getSize();
            page = doc.addPage([size.width, size.height]);
            C(page, settings, await b(doc, settings));
            page.drawPage(await doc.embedPage(sourcePage), { x: 0, y: 0, width: size.width, height: size.height });
        } else {
            page = doc.addPage((await doc.copyPages(source, [chosen - 1]))[0]);
            C(page, settings, await b(doc, settings));
        }
        return { bytes: await doc.save(), chosen: chosen, count: source.getPageCount() };
    }
    function clearPreview() {
        var context = t.previewCanvas.getContext('2d');
        context.fillStyle = '#fff'; context.fillRect(0, 0, t.previewCanvas.width, t.previewCanvas.height);
    }
    function k() {
        var token = ++e.previewToken, file = e.files[0] && e.files[0].file, settings = y();
        window.clearTimeout(k.timer); clearPreview();
        if (!file) { c(t.previewStatus, 'Upload a PDF to preview the first selected page.'); return; }
        if (settings.type === 'image' && !settings.imageSource) {
            c(t.previewStatus, 'Choose a PNG, JPG, JPEG, or WebP image.'); return;
        }
        c(t.previewStatus, native('Preparing preview…', 'Préparation de l’aperçu…', 'Inaandaa hakikisho…'));
        k.timer = window.setTimeout(async function() {
            var loaded;
            try {
                var generated = await previewPDF(file, settings);
                if (token !== e.previewToken) return;
                loaded = await r().getDocument({ data: generated.bytes }).promise;
                var page = await loaded.getPage(1), full = page.getViewport({ scale: 1 });
                var view = page.getViewport({ scale: Math.min(340 / full.width, 460 / full.height, 1.3) });
                var canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.floor(view.width)); canvas.height = Math.max(1, Math.floor(view.height));
                await page.render({ canvasContext: canvas.getContext('2d'), viewport: view, background: 'white' }).promise;
                if (token !== e.previewToken) return;
                t.previewCanvas.width = canvas.width; t.previewCanvas.height = canvas.height;
                t.previewCanvas.getContext('2d').drawImage(canvas, 0, 0);
                c(t.previewStatus, native('Preview page ', 'Aperçu de la page ', 'Hakiki ukurasa ') + generated.chosen + ' / ' + generated.count);
            } catch (error) {
                if (token === e.previewToken) {
                    clearPreview(); c(t.previewStatus, failure(error));
                }
            } finally {
                if (loaded) await loaded.destroy();
            }
        }, 150);
    }
    function O() {
        c(t.fontSizeValue, t.fontSize.value + " pt"), c(t.textOpacityValue, t.textOpacity.value + "%"),
        c(t.imageOpacityValue, t.imageOpacity.value + "%"), c(t.imageScaleValue, t.imageScale.value + "%"),
        c(t.rotationValue, t.rotation.value + " deg"), c(t.tileGapValue, t.tileGap.value + " pt"),
        c(t.offsetXValue, t.offsetX.value + " mm"), c(t.offsetYValue, t.offsetY.value + " mm");
        var e = f(t.customColor.value || t.textColor.value);
        t.textColor.value = e.hex, t.customColor.value = e.hex, c(t.textColorHex, e.hex);
    }
    function F(e, t, a) {
        e.addEventListener("click", function() {
            t.click();
        }), e.addEventListener("dragover", function(t) {
            t.preventDefault(), e.classList.add("dragover");
        }), e.addEventListener("dragleave", function() {
            e.classList.remove("dragover");
        }), e.addEventListener("drop", function(t) {
            t.preventDefault(), e.classList.remove("dragover"), a(t.dataTransfer.files);
        });
    }
    async function D(file) {
        invalidate();
        var imageVersion = ++imageRevision;
        e.imageFile = null; e.imageSource = null; updateApply(); k();
        c(t.imageFileName, 'Choose a PNG, JPG, JPEG, or WebP image.');
        if (!o(file)) return;
        c(t.imageFileName, native('Loading image…', 'Chargement de l’image…', 'Inapakia picha…'));
        try {
            var source = await x(file);
            if (imageVersion !== imageRevision) return;
            e.imageFile = file; e.imageSource = source;
            c(t.imageFileName, file.name + ' - ' + s(file.size));
        } catch (error) {
            if (imageVersion !== imageRevision) return;
            c(t.imageFileName, 'Choose a PNG, JPG, JPEG, or WebP image.');
        }
        updateApply(); k();
    }
    function M() {
        t.pdfDropZone = i("pdfDropZone"), t.pdfFileInput = i("pdfFileInput"), t.fileList = i("fileList"),
        t.textPanel = i("textPanel"), t.imagePanel = i("imagePanel"), t.watermarkText = i("watermarkText"),
        t.fontSelect = i("fontSelect"), t.textColor = i("textColor"), t.customColor = i("customColor"),
        t.textColorHex = i("textColorHex"), t.fontSize = i("fontSize"), t.fontSizeValue = i("fontSizeValue"),
        t.imageDropZone = i("imageDropZone"), t.imageFileInput = i("imageFileInput"), t.imageFileName = i("imageFileName"),
        t.imageScale = i("imageScale"), t.imageScaleValue = i("imageScaleValue"), t.imageOpacity = i("imageOpacity"),
        t.imageOpacityValue = i("imageOpacityValue"), t.pageRange = i("pageRange"), t.layerSelect = i("layerSelect"),
        t.patternSelect = i("patternSelect"), t.textOpacity = i("textOpacity"), t.textOpacityValue = i("textOpacityValue"),
        t.rotation = i("rotation"), t.rotationValue = i("rotationValue"), t.tileGap = i("tileGap"),
        t.tileGapValue = i("tileGapValue"), t.offsetX = i("offsetX"), t.offsetXValue = i("offsetXValue"),
        t.offsetY = i("offsetY"), t.offsetYValue = i("offsetYValue"), t.watermarkBtn = i("watermarkBtn"),
        t.previewCanvas = i("previewCanvas"), t.previewStatus = i("previewStatus"), t.resultCard = i("resultCard"),
        t.resultText = i("resultText"), t.progressBar = i("progressBar"), t.progressFill = i("progressFill"),
        t.resultRows = i("resultRows"), t.resultNote = i("resultNote"), t.actionRow = i("actionRow"),
        t.downloadBtn = i("downloadBtn"), r(), O(), F(t.pdfDropZone, t.pdfFileInput, m),
        F(t.imageDropZone, t.imageFileInput, function(e) {
            e && e[0] && D(e[0]);
        }), t.pdfFileInput.addEventListener("change", function(e) {
            m(e.target.files), e.target.value = "";
        }), t.imageFileInput.addEventListener("change", function(e) {
            e.target.files && e.target.files[0] && D(e.target.files[0]), e.target.value = "";
        }), document.querySelectorAll("[data-type]").forEach(function(a) {
            a.addEventListener("click", function() {
                invalidate();
                e.type = a.dataset.type, document.querySelectorAll("[data-type]").forEach(function(e) {
                    e.classList.remove("on");
                }), a.classList.add("on"), t.textPanel.classList.toggle("hidden", "text" !== e.type),
                t.imagePanel.classList.toggle("hidden", "image" !== e.type), updateApply(), k();
            });
        }), document.querySelectorAll("[data-position]").forEach(function(t) {
            t.addEventListener("click", function() {
                invalidate();
                e.position = t.dataset.position, document.querySelectorAll("[data-position]").forEach(function(e) {
                    e.classList.remove("on");
                }), t.classList.add("on"), k();
            });
        }), [ t.watermarkText, t.fontSelect, t.textColor, t.customColor, t.fontSize, t.textOpacity, t.imageOpacity, t.imageScale, t.rotation, t.tileGap, t.offsetX, t.offsetY, t.pageRange, t.layerSelect, t.patternSelect ].forEach(function(e) {
            e.addEventListener("input", function() {
                invalidate();
                e === t.textColor && (t.customColor.value = t.textColor.value), e === t.customColor && /^#[0-9a-f]{6}$/i.test(t.customColor.value) && (t.textColor.value = t.customColor.value),
                O(), k();
            }), e.addEventListener("change", function() {
                invalidate(); O(), k();
            });
        }), t.watermarkBtn.addEventListener("click", L), t.downloadBtn.addEventListener("click", function() {
            e.download && function(e, t) {
                function a() {
                    var a = URL.createObjectURL(e), i = document.createElement("a");
                    i.href = a, i.download = t, document.body.appendChild(i), i.click(), document.body.removeChild(i),
                    setTimeout(function() {
                        URL.revokeObjectURL(a);
                    }, 5e3);
                }
                var i = document.querySelector("email-gate-modal");
                i && "function" == typeof i.show ? i.show(a) : a();
            }(e.download.blob, e.download.filename);
        });
        [t.resultText, t.resultNote, t.previewStatus, t.fileList, t.resultRows, t.imageFileName, t.watermarkBtn, t.downloadBtn].forEach(function(node) { node.setAttribute('translate', 'no'); });
        t.resultText.setAttribute('role', 'status'); t.previewStatus.setAttribute('role', 'status');
        // The sticky preview overlapped its sibling download controls on desktop.
        var previewCard = t.previewCanvas.closest('.preview-card');
        if (previewCard) previewCard.style.position = 'static';
        h(); k();
    }
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", M) : M();
}();
