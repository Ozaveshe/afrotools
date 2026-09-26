!function() {
    "use strict";
    var e = {
        files: [],
        reports: [],
        outputs: [],
        activeRun: !1
    }, t = {}, r = [ "pdfFileInput", "dropLabel", "fileInfo", "fileName", "fileSize", "queueList", "repairMode", "rasterScale", "openPassword", "reportFormat", "repairBtn", "clearBtn", "progressBar", "progressFill", "progressText", "resultCard", "statusBadge", "reportRows", "errorList", "errorListInner", "actionRow", "downloadBtn", "downloadZipBtn", "downloadReportBtn", "reviewConfirm" ];
    // Every run owns a source/settings revision. Invalidated work may finish privately,
    // but cannot publish reports or downloads for the previous input.
    var revision = 0, activeRevision = 0, downloadRevision = 0;
    var locale = (document.documentElement.lang || 'en').split('-')[0];
    var translations = {
        'Repaired': ['Réparé', 'Imerekebishwa'],
        'Partial': ['Partiel', 'Kwa sehemu'],
        'Failed': ['Échec', 'Imeshindikana'],
        'Working': ['En cours', 'Inaendelea'],
        'Queued': ['En attente', 'Inasubiri'],
        'Mixed': ['Partiel', 'Kwa sehemu'],
        'Recovered': ['Récupérés', 'Zimerejeshwa'],
        'Pages': ['Pages', 'Kurasa'],
        'Method': ['Méthode', 'Njia'],
        'Pages recovered': ['Pages récupérées', 'Kurasa zilizorejeshwa'],
        'Repaired size': ['Taille après réparation', 'Ukubwa baada ya urekebishaji'],
        '{count} PDF(s) selected': ['{count} PDF sélectionné(s)', 'PDF {count} zimechaguliwa'],
        '{count} pages': ['{count} pages', 'Kurasa {count}'],
        'Reading {name}...': ['Lecture de {name}…', 'Inasoma {name}…'],
        'Repairing {name}...': ['Réparation de {name}…', 'Inarekebisha {name}…'],
        'Salvaging page {page} of {total}...': ['Récupération de la page {page} sur {total}…', 'Inarejesha ukurasa {page} kati ya {total}…'],
        'Validating repaired PDF...': ['Vérification du PDF réparé…', 'Inakagua PDF iliyorekebishwa…'],
        'Done': ['Terminé', 'Imekamilika'],
        'qpdf structural rebuild': ['Reconstruction de la structure avec qpdf', 'Ujenzi upya wa muundo kwa qpdf'],
        'pdf-lib compatibility normalization': ['Normalisation de compatibilité avec pdf-lib', 'Urekebishaji wa uoanifu kwa pdf-lib'],
        'raster page salvage': ['Récupération des pages en images', 'Urejeshaji wa kurasa kama picha'],
        'Raster recovery creates image-only pages. Selectable text, links, forms and accessibility tags are not preserved.': ['La récupération en images ne conserve pas le texte sélectionnable, les liens, les formulaires ni les balises d’accessibilité.', 'Urejeshaji huu huunda kurasa za picha pekee. Maandishi yanayochagulika, viungo, fomu na lebo za ufikivu hazihifadhiwi.'],
        'No %PDF header was found.': ['En-tête %PDF introuvable.', 'Kichwa cha %PDF hakikupatikana.'],
        'PDF header starts after {count} extra byte(s).': ['L’en-tête PDF commence après {count} octet(s) superflu(s).', 'Kichwa cha PDF kinaanza baada ya baiti {count} za ziada.'],
        'Header starts at byte 0.': ['L’en-tête commence à l’octet 0.', 'Kichwa kinaanza kwenye baiti 0.'],
        'EOF marker is missing.': ['Marqueur de fin de fichier absent.', 'Alama ya mwisho wa faili haipo.'],
        'EOF marker found.': ['Marqueur de fin de fichier trouvé.', 'Alama ya mwisho wa faili imepatikana.'],
        'Large trailing data exists after EOF.': ['Des données supplémentaires suivent la fin du fichier.', 'Kuna data ya ziada baada ya mwisho wa faili.'],
        'startxref marker is missing.': ['Marqueur startxref absent.', 'Alama ya startxref haipo.'],
        'xref table marker was not found.': ['Marqueur de table xref introuvable.', 'Alama ya jedwali la xref haikupatikana.'],
        'trailer marker was not found.': ['Marqueur de fin de structure introuvable.', 'Alama ya mwisho wa muundo haikupatikana.'],
        'File appears encrypted. Enter its open password if repair fails.': ['Ce fichier semble chiffré. Saisissez son mot de passe d’ouverture si la réparation échoue.', 'Faili inaonekana imesimbwa. Weka nenosiri lake la kufungua ikiwa urekebishaji unashindwa.'],
        'Linearized PDF detected.': ['PDF linéarisé détecté.', 'PDF iliyopangwa kwa usomaji wa mtandaoni imegunduliwa.'],
        'File is unusually small for a PDF.': ['Ce fichier est anormalement petit pour un PDF.', 'Faili hii ni ndogo isivyo kawaida kwa PDF.'],
        'Structural rebuilding could not recover this file.': ['La reconstruction de la structure n’a pas pu récupérer ce fichier.', 'Ujenzi upya wa muundo haukuweza kurejesha faili hii.'],
        'Compatibility normalization could not recover this file.': ['La normalisation de compatibilité n’a pas pu récupérer ce fichier.', 'Urekebishaji wa uoanifu haukuweza kurejesha faili hii.'],
        'Image recovery could not recover this file.': ['La récupération en images n’a pas pu récupérer ce fichier.', 'Urejeshaji wa picha haukuweza kurejesha faili hii.'],
        'Repair failed. The file may be incomplete, unsupported, or require its correct open password. Try another strategy or obtain the original PDF again.': ['La réparation a échoué. Le fichier peut être incomplet, non pris en charge ou nécessiter son mot de passe d’ouverture. Essayez une autre méthode ou récupérez à nouveau le PDF original.', 'Urekebishaji umeshindikana. Faili inaweza kuwa haijakamilika, haitumiki hapa, au inahitaji nenosiri sahihi la kufungua. Jaribu njia nyingine au upate PDF asili tena.'],
        'Review the repair report, recovered-page count, warnings, and output method before downloading.': ['Vérifiez le rapport, le nombre de pages récupérées, les avertissements et la méthode avant le téléchargement.', 'Kagua ripoti, idadi ya kurasa zilizorejeshwa, maonyo na njia ya matokeo kabla ya kupakua.'],
        'Repair settings changed. Run the repair again before downloading.': ['Les réglages ont changé. Relancez la réparation avant de télécharger.', 'Mipangilio imebadilika. Endesha urekebishaji tena kabla ya kupakua.'],
        'Download Repaired PDF': ['Télécharger le PDF réparé', 'Pakua PDF iliyorekebishwa'],
        'Download ZIP': ['Télécharger le ZIP', 'Pakua ZIP'],
        'Download report': ['Télécharger le rapport', 'Pakua ripoti'],
        'Engine missing': ['Moteur indisponible', 'Mfumo haujapakiwa'],
        'Error': ['Erreur', 'Hitilafu'],
        'PDF repair libraries did not load. Refresh the page and try again.': ['Les bibliothèques de réparation PDF n’ont pas été chargées. Actualisez la page et réessayez.', 'Maktaba za urekebishaji wa PDF hazijapakiwa. Onyesha ukurasa upya na ujaribu tena.']
    };
    function text(key, values) {
        var row = translations[key], result = row && (locale === 'fr' || locale === 'sw') ? row[locale === 'fr' ? 0 : 1] : key;
        return result.replace(/\{(\w+)\}/g, function(match, name) { return values && values[name] !== undefined ? String(values[name]) : match; });
    }
    function nativeDiagnostic(value) {
        var extra = value.match(/^PDF header starts after (\d+) extra bytes?\.$/);
        return extra ? text('PDF header starts after {count} extra byte(s).', {count: extra[1]}) : text(value);
    }
    function n(e) {
        return Number.isFinite(e) ? 0 === e ? "0 B" : e < 1024 ? e + " B" : e < 1048576 ? (e / 1024).toFixed(1) + " KB" : e < 1073741824 ? (e / 1048576).toFixed(1) + " MB" : (e / 1073741824).toFixed(1) + " GB" : "";
    }
    function a(e) {
        return function(e) {
            return String(e || "document.pdf").replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, " ").trim() || "document.pdf";
        }(String(e || "document.pdf").replace(/\.pdf$/i, "")) || "document";
    }
    function s(e) {
        return e ? e instanceof Uint8Array ? new Uint8Array(e) : e instanceof ArrayBuffer ? new Uint8Array(e.slice(0)) : new Uint8Array(e) : null;
    }
    function i(e) {
        return !(!e || !(e.type && "application/pdf" === e.type || /\.pdf$/i.test(e.name || "")));
    }
    function o(e) {
        var t = document.createElement("div");
        return t.textContent = String(null == e ? "" : e), t.innerHTML;
    }
    function d(e, r) {
        if (activeRevision !== revision) return;
        t.progressBar && t.progressBar.classList.add("on"), t.progressText && (t.progressText.classList.add("on"),
        r && (t.progressText.textContent = text(r))), t.progressFill && (t.progressFill.style.width = Math.max(0, Math.min(100, e)) + "%");
    }
    function l() {
        t.progressBar && t.progressBar.classList.remove("on"), t.progressText && t.progressText.classList.remove("on"),
        t.progressFill && (t.progressFill.style.width = "0%");
    }
    function u() {
        var r = e.files.length > 0;
        t.repairBtn && (t.repairBtn.disabled = !r || e.activeRun), t.clearBtn && (t.clearBtn.disabled = !r || e.activeRun);
    }
    function p(e) {
        return text("success" === e ? "Repaired" : "partial" === e ? "Partial" : "failed" === e ? "Failed" : "working" === e ? "Working" : "Queued");
    }
    function c() {
        if (t.queueList) {
            if (t.queueList.textContent = "", !e.files.length) return t.fileInfo && t.fileInfo.classList.remove("on"),
            void u();
            if (t.fileInfo && t.fileInfo.classList.add("on"), t.fileName && (t.fileName.textContent = text("{count} PDF(s) selected", {count: e.files.length})),
            t.fileSize) {
                var r = e.files.reduce(function(e, t) {
                    return e + t.file.size;
                }, 0);
                t.fileSize.textContent = n(r);
            }
            e.files.forEach(function(e) {
                var r = document.createElement("div");
                r.className = "queue-row";
                var a = document.createElement("div"), s = document.createElement("div");
                s.className = "queue-name", s.textContent = e.file.name;
                var i = document.createElement("div");
                i.className = "queue-meta", i.textContent = n(e.file.size) + (e.report && e.report.pages ? " | " + text("{count} pages", {count: e.report.pages}) : ""),
                a.appendChild(s), a.appendChild(i);
                var o = document.createElement("span");
                o.className = "queue-state", o.textContent = p(e.status), r.appendChild(a), r.appendChild(o),
                t.queueList.appendChild(r);
            }), u();
        }
    }
    function f() {
        V(false);
        e.files = [], e.reports = [], e.outputs = [], t.pdfFileInput && (t.pdfFileInput.value = ""),
        t.resultCard && t.resultCard.classList.remove("on"), t.actionRow && (t.actionRow.style.display = "none"),
        t.downloadZipBtn && (t.downloadZipBtn.style.display = "none"), t.reviewConfirm && (t.reviewConfirm.checked = !1),
        l(), c();
    }
    function g(r) {
        var n = Array.prototype.slice.call(r || []).filter(i);
        n.length && (V(false), n.forEach(function(t) {
            e.files.push({
                id: Date.now() + "-" + Math.random().toString(16).slice(2),
                file: t,
                status: "queued",
                report: null,
                output: null
            });
        }), e.reports = [], e.outputs = [], t.resultCard && t.resultCard.classList.remove("on"),
        t.actionRow && (t.actionRow.style.display = "none"), t.reviewConfirm && (t.reviewConfirm.checked = !1),
        c());
    }
    function w(e) {
        for (var t = [], r = 0; r < e.length; r += 1) t.push(255 & e.charCodeAt(r));
        return t;
    }
    function h(e, t) {
        for (var r = e.length - t.length; r >= 0; r -= 1) {
            for (var n = !0, a = 0; a < t.length; a += 1) if (e[r + a] !== t[a]) {
                n = !1;
                break;
            }
            if (n) return r;
        }
        return -1;
    }
    function m(e, t) {
        for (var r = Math.min(e.length, t || 9e5), n = [], a = 0; a < r; a += 16384) {
            var s = e.subarray(a, Math.min(a + 16384, r));
            n.push(String.fromCharCode.apply(null, Array.prototype.slice.call(s)));
        }
        return n.join("");
    }
    function v(e) {
        var t = w("%PDF-"), r = w("%%EOF"), n = w("startxref"), a = w("xref"), s = w("trailer"), i = function(e, t) {
            for (var r = Math.max(0, 0); r <= e.length - t.length; r += 1) {
                for (var n = !0, a = 0; a < t.length; a += 1) if (e[r + a] !== t[a]) {
                    n = !1;
                    break;
                }
                if (n) return r;
            }
            return -1;
        }(e, t), o = h(e, r), d = h(e, n), l = h(e, a), u = h(e, s), p = m(e, 12e5), c = [], f = [], g = p.match(/\b\d+\s+\d+\s+obj\b/g) || [], v = "unknown", y = (i >= 0 ? m(e.subarray(i, Math.min(i + 16, e.length)), 16) : "").match(/%PDF-(\d\.\d)/);
        return y && (v = y[1]), i < 0 ? c.push("No %PDF header was found.") : i > 0 ? c.push("PDF header starts after " + i + " extra byte" + (1 === i ? "" : "s") + ".") : f.push("Header starts at byte 0."),
        o < 0 ? c.push("EOF marker is missing.") : (f.push("EOF marker found."), e.length - o > 2048 && c.push("Large trailing data exists after EOF.")),
        d < 0 && c.push("startxref marker is missing."), l < 0 && c.push("xref table marker was not found."),
        u < 0 && c.push("trailer marker was not found."), /\/Encrypt\b/.test(p) && c.push("File appears encrypted. Enter its open password if repair fails."),
        /\/Linearized\b/.test(p) && f.push("Linearized PDF detected."), e.length < 256 && c.push("File is unusually small for a PDF."),
        {
            version: v,
            headerOffset: i,
            eofOffset: o,
            startXrefOffset: d,
            xrefOffset: l,
            trailerOffset: u,
            objectCountHint: g.length,
            encryptedHint: /\/Encrypt\b/.test(p),
            linearizedHint: /\/Linearized\b/.test(p),
            issues: c,
            hints: f
        };
    }
    async function y(e, t, r) {
        var n = await async function(e) {
            if (!window.QPDF) throw new Error("qpdf repair engine did not load.");
            return window.QPDF.path = "/assets/vendor/qpdf/", new Promise(function(t, r) {
                var n = setTimeout(function() {
                    r(new Error("qpdf engine timed out while starting."));
                }, 2e4);
                window.QPDF({
                    keepAlive: !0,
                    // Engine logs can include document bytes and WASM heap dumps.
                    logger: function() {},
                    ready: function(e) {
                        clearTimeout(n), t(e);
                    }
                });
            });
        }(r);
        try {
            await function(e, t, r) {
                return new Promise(function(t, n) {
                    e.save("input.pdf", s(r), function(e) {
                        e ? n(e) : t();
                    });
                });
            }(n, 0, e);
            var a = [ "--warning-exit-0", "--object-streams=disable" ];
            t && a.push("--password=" + t, "--decrypt"), a.push("input.pdf", "output.pdf"),
            await function(e, t) {
                return new Promise(function(r, n) {
                    e.execute(t, function(e) {
                        e ? n(e) : r();
                    });
                });
            }(n, a);
            var i = await function(e) {
                return new Promise(function(t, r) {
                    e.load("output.pdf", function(e, n) {
                        e ? r(e) : t(s(n));
                    });
                });
            }(n);
            return {
                bytes: i,
                method: "qpdf structural rebuild"
            };
        } finally {
            n && n.terminate && n.terminate();
        }
    }
    async function L(e, t) {
        if (!window.PDFLib) throw new Error("pdf-lib did not load.");
        if (t) throw new Error("pdf-lib normalization cannot open password-protected PDFs in this browser.");
        var r = window.PDFLib, n = await r.PDFDocument.load(s(e), {
            ignoreEncryption: !1,
            parseSpeed: r.ParseSpeeds ? r.ParseSpeeds.Fastest : void 0,
            updateMetadata: !1
        });
        if (!n.getPageCount()) throw new Error("No recoverable pages were found.");
        return n.setProducer("AfroTools PDF Repair"), n.setModificationDate(new Date), {
            bytes: s(await n.save({
                useObjectStreams: !1,
                addDefaultPage: !1
            })),
            method: "pdf-lib compatibility normalization"
        };
    }
    function b(e) {
        return new Promise(function(t, r) {
            e.toBlob(function(e) {
                e ? e.arrayBuffer().then(function(e) {
                    t(new Uint8Array(e));
                }).catch(r) : r(new Error("Could not render page image."));
            }, "image/png");
        });
    }
    async function F(bytes, password, quality, run) {
        var pdfjs = await window.PdfUtils.ensurePdfJs();
        var source = await pdfjs.getDocument({data: s(bytes), password: password || undefined}).promise;
        try {
            if (!source.numPages) throw new Error('No renderable pages');
            var output = await window.PDFLib.PDFDocument.create();
            var scale = Math.max(.75, Math.min(2, parseFloat(quality) || 1.25));
            for (var pageNumber = 1; pageNumber <= source.numPages; pageNumber++) {
                if (run !== revision) throw new Error('Superseded');
                d(55 + Math.round(pageNumber / source.numPages * 30), text('Salvaging page {page} of {total}...', {page: pageNumber, total: source.numPages}));
                var page = await source.getPage(pageNumber);
                // PDF.js applies CropBox, UserUnit and rotation. Resolution changes only
                // image pixels; the output retains the physical visible page size.
                var physical = page.getViewport({scale: 1});
                var viewport = page.getViewport({scale: scale});
                var canvas = document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                try {
                    // Fit fractional viewport dimensions to the full bitmap, avoiding
                    // a white rounding strip when the image is placed back in points.
                    await page.render({canvasContext: canvas.getContext('2d'), viewport: viewport,
                        transform: [canvas.width / viewport.width, 0, 0, canvas.height / viewport.height, 0, 0]}).promise;
                    var png = await output.embedPng(await b(canvas));
                    output.addPage([physical.width, physical.height]).drawImage(png,
                        {x: 0, y: 0, width: physical.width, height: physical.height});
                } finally {
                    canvas.width = canvas.height = 0;
                    page.cleanup();
                }
            }
            output.setProducer('AfroTools PDF Repair raster salvage');
            return {bytes: s(await output.save({useObjectStreams: false})), method: 'raster page salvage', rasterized: true};
        } finally {
            await source.destroy();
        }
    }
    async function P(item, index, count, settings, run) {
        var file = item.file;
        var report = {file: file.name, originalSize: file.size, startedAt: new Date().toISOString(),
            finishedAt: null, status: 'failed', method: '', pages: 0, repairedSize: 0,
            diagnostics: null, warnings: [], errors: [], qpdfLog: []};
        item.status = 'working'; item.output = null; item.report = null;
        c(); d(Math.round(index / count * 100), text('Reading {name}...', {name: file.name}));
        try {
            var bytes = new Uint8Array(await file.arrayBuffer());
            if (run !== revision) return null;
            report.diagnostics = v(bytes);
            report.diagnostics.issues = report.diagnostics.issues.map(nativeDiagnostic);
            report.diagnostics.hints = report.diagnostics.hints.map(nativeDiagnostic);
            report.warnings = report.diagnostics.issues.slice();
            d(Math.round(index / count * 100) + 8, text('Repairing {name}...', {name: file.name}));
            var recovered;
            var methods = settings.mode === 'auto' ? ['qpdf', 'normalize', 'raster'] : [settings.mode];
            var failures = [];
            for (var method of methods) {
                if (run !== revision) return null;
                try {
                    recovered = method === 'qpdf' ? await y(bytes, settings.password, []) :
                        method === 'normalize' ? await L(bytes, settings.password) :
                        await F(bytes, settings.password, settings.quality, run);
                    break;
                } catch (_) {
                    failures.push(text(method === 'qpdf' ? 'Structural rebuilding could not recover this file.' :
                        method === 'normalize' ? 'Compatibility normalization could not recover this file.' :
                        'Image recovery could not recover this file.'));
                }
            }
            if (run !== revision) return null;
            if (!recovered) { report.errors = failures; throw new Error('Recovery failed'); }
            report.method = text(recovered.method);
            if (recovered.rasterized) report.warnings.push(text('Raster recovery creates image-only pages. Selectable text, links, forms and accessibility tags are not preserved.'));
            d(Math.round(index / count * 100) + 18, 'Validating repaired PDF...');
            var pdfjs = await window.PdfUtils.ensurePdfJs();
            var checked = await pdfjs.getDocument({data: s(recovered.bytes)}).promise;
            try {
                if (!checked.numPages) throw new Error('No pages');
                report.pages = checked.numPages;
                // Open every recovered page, not just the first page count.
                for (var pageNumber = 1; pageNumber <= checked.numPages; pageNumber++) {
                    if (run !== revision) return null;
                    await checked.getPage(pageNumber);
                }
            } finally { await checked.destroy(); }
            if (run !== revision) return null;
            report.repairedSize = recovered.bytes.length;
            report.status = report.warnings.length || recovered.rasterized ? 'partial' : 'success';
            item.output = {name: a(file.name) + '_repaired.pdf', bytes: recovered.bytes, method: report.method};
        } catch (_) {
            if (run !== revision) return null;
            report.errors.push(text('Repair failed. The file may be incomplete, unsupported, or require its correct open password. Try another strategy or obtain the original PDF again.'));
        } finally {
            if (run === revision) {
                report.finishedAt = new Date().toISOString();
                item.status = report.status; item.report = report; c();
            }
        }
        return report;
    }
    async function E() {
        if (e.files.length && !e.activeRun) {
            var run = ++revision;
            activeRevision = run;
            var files = e.files.slice();
            var usedNames = new Set();
            var settings = {mode: t.repairMode.value, quality: t.rasterScale.value, password: t.openPassword.value};
            e.activeRun = !0, e.reports = [], e.outputs = [], t.reviewConfirm && (t.reviewConfirm.checked = !1),
            t.resultCard && t.resultCard.classList.remove("on"), t.actionRow && (t.actionRow.style.display = "none"),
            u();
            try {
                for (var r = 0; r < files.length; r += 1) {
                    var a = await P(files[r], r, files.length, settings, run);
                    if (run !== revision || !a) return;
                    if (files[r].output) {
                        var output = files[r].output, baseName = output.name.replace(/\.pdf$/i, ''), suffix = 1;
                        // ZIP entries overwrite by name. Also avoid names that collide
                        // on case-insensitive filesystems after the archive is extracted.
                        while (usedNames.has(output.name.normalize('NFC').toLowerCase())) {
                            suffix += 1;
                            output.name = baseName + '_' + suffix + '.pdf';
                        }
                        usedNames.add(output.name.normalize('NFC').toLowerCase());
                        a.outputFile = output.name;
                        e.outputs.push(output);
                    }
                    e.reports.push(a);
                }
                if (run !== revision) return;
                d(100, "Done"), setTimeout(function() { if (run === revision) l(); }, 450), function() {
                    var r = e.reports.filter(function(e) {
                        return "success" === e.status || "partial" === e.status;
                    }).length, a = e.reports.filter(function(e) {
                        return "failed" === e.status;
                    }).length, s = e.reports.filter(function(e) {
                        return "partial" === e.status;
                    }).length, i = a && !r ? "failed" : s || a ? "partial" : "success";
                    if (t.resultCard && t.resultCard.classList.add("on"), t.statusBadge && (t.statusBadge.textContent = text("success" === i ? "Repaired" : "partial" === i ? "Mixed" : "Failed"),
                    t.statusBadge.className = "status-badge " + ("success" === i ? "status-success" : "partial" === i ? "status-partial" : "status-failed")),
                    t.reportRows) {
                        var d = e.reports.reduce(function(e, t) {
                            return e + (t.pages || 0);
                        }, 0), l = [ '<div class="summary-grid">', '<div class="summary-stat"><strong>' + r + "</strong><span>" + o(text("Recovered")) + "</span></div>", '<div class="summary-stat"><strong>' + a + "</strong><span>" + o(text("Failed")) + "</span></div>", '<div class="summary-stat"><strong>' + d + "</strong><span>" + o(text("Pages")) + "</span></div>", "</div>" ];
                        e.reports.forEach(function(e) {
                            l.push(B(e.file, p(e.status))), e.method && l.push(B(text("Method"), e.method)), e.pages && l.push(B(text("Pages recovered"), e.pages)),
                            e.repairedSize && l.push(B(text("Repaired size"), n(e.repairedSize)));
                        }), t.reportRows.innerHTML = l.join("");
                    }
                    var u = [];
                    e.reports.forEach(function(e) {
                        e.warnings.forEach(function(t) {
                            u.push(e.file + ": " + t);
                        }), e.errors.forEach(function(t) {
                            u.push(e.file + ": " + t);
                        });
                    }), t.errorList && t.errorListInner && (u.length ? (t.errorList.style.display = "block",
                    t.errorListInner.innerHTML = u.map(function(e) {
                        return '<div style="padding:4px 0;border-bottom:1px solid #f3f4f6;">' + o(e) + "</div>";
                    }).join("")) : (t.errorList.style.display = "none", t.errorListInner.textContent = ""));
                    var c = [];
                    e.reports.forEach(function(e) {
                        e.qpdfLog && e.qpdfLog.length && (c.push(e.file), c = c.concat(e.qpdfLog.slice(-6)));
                    }), t.errorListInner && c.length && u.length && t.errorListInner.insertAdjacentHTML("beforeend", '<div class="repair-log">' + o(c.join("\n")) + "</div>"),
                    t.actionRow && (t.actionRow.style.display = e.reports.length ? "grid" : "none"),
                    t.downloadBtn && (t.downloadBtn.style.display = 1 === e.outputs.length ? "flex" : "none"),
                    t.downloadZipBtn && (t.downloadZipBtn.style.display = e.outputs.length > 1 ? "flex" : "none"),
                    t.downloadReportBtn && (t.downloadReportBtn.style.display = e.reports.length ? "flex" : "none"),
                    t.reviewConfirm && (t.reviewConfirm.checked = !1);
                }();
            } finally {
                e.activeRun = !1, u();
            }
        }
    }
    function B(e, t) {
        return '<div class="report-row"><span class="report-label">' + o(e) + '</span><span class="report-value">' + o(t) + "</span></div>";
    }
    function x(e, t) {
        var r = URL.createObjectURL(e), n = document.createElement("a");
        n.href = r, n.download = t, document.body.appendChild(n), n.click(), n.remove(),
        setTimeout(function() {
            URL.revokeObjectURL(r);
        }, 5e3);
    }
    function D() {
        if (t.reviewConfirm && t.reviewConfirm.checked) return !0;
        t.progressText && (t.progressText.textContent = text("Review the repair report, recovered-page count, warnings, and output method before downloading."),
        t.progressText.classList.add("on")), t.reviewConfirm && t.reviewConfirm.focus();
        return !1;
    }
    function R() {
        if (e.outputs.length && D()) {
            var t = e.outputs[0];
            x(new Blob([ t.bytes ], {
                type: "application/pdf"
            }), t.name);
        }
    }
    async function S() {
        if (e.outputs.length && window.JSZip && D()) {
            var run = revision, formatRevision = downloadRevision, r = new window.JSZip;
            e.outputs.forEach(function(e) {
                r.file(e.name, e.bytes);
            }), r.file("pdf-repair-report." + (t.reportFormat && "csv" === t.reportFormat.value ? "csv" : "json"), q());
            var blob = await r.generateAsync({type: "blob"});
            if (run === revision && formatRevision === downloadRevision && e.outputs.length && t.reviewConfirm.checked) x(blob, "afrotools-pdf-repair.zip");
        }
    }
    function C(e) {
        var t = String(null == e ? "" : e);
        return /[",\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
    }
    function q() {
        if ("csv" === (t.reportFormat && t.reportFormat.value || "json")) {
            var r = [ "file,status,method,original_size,repaired_size,pages,issues,errors,finished_at" ];
            return e.reports.forEach(function(e) {
                r.push([ C(e.file), e.status, C(e.method), e.originalSize, e.repairedSize, e.pages, C(e.warnings.join(" | ")), C(e.errors.join(" | ")), e.finishedAt ].join(","));
            }), r.join("\r\n");
        }
        return JSON.stringify({
            tool: "AfroTools PDF Repair",
            createdAt: (new Date).toISOString(),
            reports: e.reports
        }, null, 2);
    }
    function M() {
        if (e.reports.length && D()) {
            var r = t.reportFormat && t.reportFormat.value || "json", n = "csv" === r ? "text/csv;charset=utf-8" : "application/json";
            x(new Blob([ q() ], {
                type: n
            }), "pdf-repair-report." + r);
        }
    }
    function V(r) {
        revision += 1;
        l();
        if (t.reviewConfirm) t.reviewConfirm.checked = !1;
        e.reports = [], e.outputs = [], e.files.forEach(function(e) {
            e.status = "queued", e.report = null, e.output = null;
        }), t.resultCard && t.resultCard.classList.remove("on"), t.actionRow && (t.actionRow.style.display = "none"),
        t.downloadBtn && (t.downloadBtn.style.display = "none"), t.downloadZipBtn && (t.downloadZipBtn.style.display = "none"),
        t.downloadReportBtn && (t.downloadReportBtn.style.display = "none"), c(), r && t.progressText && (t.progressText.textContent = text("Repair settings changed. Run the repair again before downloading."),
        t.progressText.classList.add("on"));
    }
    function z() {
        // The runtime owns native dynamic text; broad locale observers must not
        // translate user filenames or rewrite these messages a second time.
        ['queueList', 'fileName', 'fileSize', 'progressText', 'statusBadge', 'reportRows', 'errorListInner', 'downloadBtn', 'downloadZipBtn', 'downloadReportBtn'].forEach(function(id) {
            var node = document.getElementById(id);
            if (node) node.setAttribute('translate', 'no');
        });
        [['downloadBtn', 'Download Repaired PDF'], ['downloadZipBtn', 'Download ZIP'], ['downloadReportBtn', 'Download report']].forEach(function(pair) {
            var node = document.getElementById(pair[0]);
            if (node) node.textContent = text(pair[1]);
        });
        r.forEach(function(e) {
            t[e] = function(e) {
                return document.getElementById(e);
            }(e);
        }), t.pdfFileInput && t.pdfFileInput.addEventListener("change", function() {
            g(t.pdfFileInput.files);
            t.pdfFileInput.value = "";
        }), t.dropLabel && (t.dropLabel.addEventListener("dragover", function(e) {
            e.preventDefault(), t.dropLabel.classList.add("dragover");
        }), t.dropLabel.addEventListener("dragleave", function() {
            t.dropLabel.classList.remove("dragover");
        }), t.dropLabel.addEventListener("drop", function(e) {
            e.preventDefault(), t.dropLabel.classList.remove("dragover"), g(e.dataTransfer && e.dataTransfer.files);
        })), t.repairBtn && t.repairBtn.addEventListener("click", E), t.clearBtn && t.clearBtn.addEventListener("click", f),
        [ "repairMode", "rasterScale" ].forEach(function(e) {
            t[e] && t[e].addEventListener("change", function() {
                V(!0);
            });
        }), t.openPassword && t.openPassword.addEventListener("input", function() {
            V(!0);
        }), t.reportFormat && t.reportFormat.addEventListener("change", function() {
            t.reviewConfirm && (t.reviewConfirm.checked = !1);
            downloadRevision += 1;
        }), t.downloadBtn && t.downloadBtn.addEventListener("click", function() {
            R();
        }), t.downloadZipBtn && t.downloadZipBtn.addEventListener("click", function() {
            S();
        }), t.downloadReportBtn && t.downloadReportBtn.addEventListener("click", M), document.querySelectorAll(".faq-q").forEach(function(e) {
            e.addEventListener("click", function() {
                var t = e.nextElementSibling, r = e.classList.contains("open");
                document.querySelectorAll(".faq-q").forEach(function(e) {
                    e.classList.remove("open"), e.setAttribute("aria-expanded", "false");
                }), document.querySelectorAll(".faq-a").forEach(function(e) {
                    e.classList.remove("open");
                }), !r && t && (e.classList.add("open"), e.setAttribute("aria-expanded", "true"),
                t.classList.add("open"));
            });
        }), t.actionRow && (t.actionRow.style.display = "none"), c(), window.PDFLib && window.PdfUtils && window.QPDF || (t.resultCard && t.resultCard.classList.add("on"),
        t.statusBadge && (t.statusBadge.textContent = text("Engine missing"), t.statusBadge.className = "status-badge status-failed"),
        t.reportRows && (t.reportRows.innerHTML = B(text("Error"), text("PDF repair libraries did not load. Refresh the page and try again."))));
    }
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", z) : z();
}();
