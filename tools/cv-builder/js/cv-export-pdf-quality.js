"use strict";

!function(t, e) {
    var r = !1, a = 96 / 25.4;
    function o() {
        return t.CVApp && t.CVApp.getState ? t.CVApp.getState() : {};
    }
    function i() {
        return t.CVExportUpgrade && t.CVExportUpgrade.getOptions ? t.CVExportUpgrade.getOptions() : {
            density: "comfortable",
            avoidSplits: !0
        };
    }
    function n(e) {
        t.CVExportUpgrade && t.CVExportUpgrade.status && t.CVExportUpgrade.status(e);
    }
    function d(e) {
        t.CVExportUpgrade && t.CVExportUpgrade.toast ? t.CVExportUpgrade.toast(e) : t.CVApp && t.CVApp.showToast && t.CVApp.showToast(e);
    }
    function p(e, r) {
        t.CVExportUpgrade && t.CVExportUpgrade.track && t.CVExportUpgrade.track(e, r || {});
    }
    function l(e, r) {
        return t.CVExportUpgrade && t.CVExportUpgrade.filename ? t.CVExportUpgrade.filename(e, r) : r ? "AfroTools-CV-" + r + "." + e : "AfroTools-CV." + e;
    }
    function s(r, a) {
        if (t.CVExportUpgrade && t.CVExportUpgrade.downloadBlob) return t.CVExportUpgrade.downloadBlob(r, a);
        var o = URL.createObjectURL(r), i = e.createElement("a");
        i.href = o, i.download = a, i.dataset.noPdfGate = "true", e.body.appendChild(i),
        i.click(), e.body.removeChild(i), setTimeout(function() {
            URL.revokeObjectURL(o);
        }, 1200);
    }
    function c(t) {
        Array.prototype.forEach.call(e.querySelectorAll("[data-cv-export], [data-action='pdf'], [data-action='print']"), function(e) {
            e.disabled = t;
        });
    }
    function f(t, e) {
        t.removeAttribute("style"), t.style.width = "595px", t.style.minHeight = "841px",
        t.style.boxShadow = "none", t.style.borderRadius = "0", t.style.overflow = "visible",
        t.style.background = "#ffffff", t.classList.add("cv-export-document", "cv-export-density-" + (e.density || "comfortable")),
        e.avoidSplits && Array.prototype.forEach.call(t.querySelectorAll("section, article, .prod-section, [class*='section'], [class*='card']"), function(t) {
            var e = t.textContent.replace(/\s+/g, " ").trim();
            e.length > 30 && e.length < 1100 && t.classList.add("cv-export-avoid-break");
         }), [[e.breakExp,"experience"],[e.breakEdu,"education"],[e.breakProjects,"projects"],[e.breakRefs,"references"]].forEach(function(entry) {
            if(entry[0]) Array.prototype.forEach.call(t.querySelectorAll('[data-cv-section="'+entry[1]+'"]'),function(section){section.classList.add("cv-export-break-before");});
        }), "one-page" === e.density && e.hideOptionalForOnePage && function(t) {
            var optional = ["references","awards","volunteering","interests","memberships","custom"];
            Array.prototype.forEach.call(t.querySelectorAll("[data-cv-section]"),function(section){
                if(optional.indexOf(section.dataset.cvSection)>=0) section.classList.add("cv-export-hide-optional");
            });
        }(t);
    }
    function confirmOptionalSections(options) {
        options.hideOptionalForOnePage = false;
        if(options.density !== "one-page") return;
        var lang=String(e.documentElement.lang||"en").split("-")[0];
        var messages={
            en:"For this export, hide references, awards, volunteering, interests, memberships and custom sections to try fitting one page? Cancel keeps every section. Your saved CV stays unchanged; the export may still need several pages.",
            fr:"Pour cet export, masquer les références, distinctions, bénévolat, centres d’intérêt, affiliations et sections personnalisées afin d’essayer de tenir sur une page ? Annuler conserve toutes les sections. Votre CV enregistré reste inchangé ; plusieurs pages peuvent rester nécessaires.",
            sw:"Kwa uhamishaji huu, ficha wadhamini, tuzo, kujitolea, mapendeleo, uanachama na sehemu maalum ili kujaribu kutoshea ukurasa mmoja? Ghairi huhifadhi sehemu zote. CV iliyohifadhiwa haibadiliki; bado inaweza kuhitaji kurasa kadhaa."
        };
        options.hideOptionalForOnePage=t.confirm(messages[lang]||messages.en);
    }
    function h() {
        return t.loadPdfLibs ? t.loadPdfLibs() : Promise.resolve();
    }
    function u(t, e, r) {
        var a;
        try {
            a = t.getImageData(0, e, r, 1).data;
        } catch (t) {
            return !1;
        }
        for (var o = 0, i = 0, n = 0; n < r; n += 12) {
            var d = 4 * n, p = a[d + 3], l = a[d] > 246 && a[d + 1] > 246 && a[d + 2] > 246;
            (p < 10 || l) && (o += 1), i += 1;
        }
        return i > 0 && o / i > .96;
    }
    function g(t, e, r) {
        var a;
        try {
            a = t.getImageData(0, e, r, 1).data;
        } catch (t) {
            return !0;
        }
        for (var o = 0, i = 0; i < r; i += 10) {
            var n = 4 * i, d = a[n + 3], p = a[n] < 242 || a[n + 1] < 242 || a[n + 2] < 242;
            d > 10 && p && (o += 1);
        }
        return o > 1;
    }
    function v(t, e, r, o, i) {
        if (r >= o) return o;
        for (var n = Math.max(e + Math.round(120 * a), r - Math.round(34 * a)), d = r; d >= n; d -= 2) if (u(t, d, i) && u(t, Math.max(0, d - 2), i)) return d;
        return r;
    }
    // Move a cut before fitting blocks, including overlapping columns. Oversized
    // blocks and blocks already continued from a prior page cannot be kept whole.
    function avoidBlockSplit(start, candidate, pageHeight, blocks) {
        var cut=candidate;
        for(var pass=0;pass<blocks.length;pass++) {
            var crossings=blocks.filter(function(block){return block.bottom-block.top<=pageHeight && block.top>start+1 && block.top<cut-1 && block.bottom>cut+1;});
            if(!crossings.length) break;
            cut=Math.min.apply(null,crossings.map(function(block){return block.top;}));
        }
        return Math.max(start+1,Math.min(candidate,Math.floor(cut)));
    }
    function m(t, r, a) {
        var o = e.createElement("canvas");
        return o.width = t.width, o.height = a, o.getContext("2d").drawImage(t, 0, r, t.width, a, 0, 0, t.width, a),
        o;
    }
    async function x(r) {
        var o = function(t) {
            var r = e.getElementById("cvpreview");
            if (!r) return null;
            var a = e.createElement("div");
            a.className = "cv-export-clone-wrap";
            var o = r.cloneNode(!0);
            return f(o, t), a.appendChild(o), a;
        }(r);
        if (!o) throw new Error("CV preview is not available");
        e.body.appendChild(o);
        try {
            var i = o.querySelector("#cvpreview"), n = Math.min(2.4, Math.max(2, t.devicePixelRatio || 2));
            var captured = function(t) {
                for (var r = t.getContext("2d", {
                    willReadFrequently: !0
                }), o = t.height - 1; o > 0 && !g(r, o, t.width); o -= 2) ;
                var i = Math.min(t.height, o + Math.round(18 * a));
                if (t.height - i < Math.round(6 * a)) return t;
                var n = e.createElement("canvas");
                return n.width = t.width, n.height = Math.max(1, i), n.getContext("2d").drawImage(t, 0, 0, t.width, i, 0, 0, t.width, i),
                n;
            }(await t.html2canvas(i, {
                scale: n,
                useCORS: !0,
                allowTaint: !0,
                logging: !1,
                backgroundColor: "#ffffff",
                windowWidth: 595,
                width: i.scrollWidth,
                height: i.scrollHeight
            }));
            var origin=i.getBoundingClientRect().top, ratio=captured.width/i.scrollWidth;
            captured.cvManualBreaks=Array.prototype.map.call(i.querySelectorAll(".cv-export-break-before"),function(section){return Math.round((section.getBoundingClientRect().top-origin)*ratio);}).filter(function(y){return y>0&&y<captured.height;}).sort(function(a,b){return a-b;});
            captured.cvAvoidBlocks=r.avoidSplits ? Array.prototype.map.call(i.querySelectorAll(".cv-export-avoid-break"),function(block){var rect=block.getBoundingClientRect();return {top:(rect.top-origin)*ratio,bottom:(rect.bottom-origin)*ratio};}).filter(function(block){return block.bottom>block.top;}) : [];
            return captured;
        } finally {
            o.parentNode && o.parentNode.removeChild(o);
        }
    }
    async function y() {
        if (!r) {
            r = !0, n("Generating PDF..."), c(!0);
            var e = Object.assign({}, i());
            try {
                confirmOptionalSections(e);
                if (await h(), !t.html2canvas || !t.jspdf || !t.jspdf.jsPDF) throw new Error("PDF libraries unavailable");
                for (var f = await x(e), u = new t.jspdf.jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4",
                    compress: !0
                }), g = u.internal.pageSize.getWidth(), y = u.internal.pageSize.getHeight(), C = g - 12, w = y - 16, b = f.width / C, E = Math.floor(w * b), P = f.getContext("2d", {
                    willReadFrequently: !0
                }), V = 0, U = 0; V < f.height - 1; ) {
                    var limit=Math.min(f.height,V+E), forced=(f.cvManualBreaks||[]).find(function(point){return point>V+1&&point<=limit;});
                    var A = forced || avoidBlockSplit(V,v(P, V, limit, f.height, f.width),E,f.cvAvoidBlocks||[]), F = Math.max(1, A - V);
                    U > 0 && u.addPage();
                    var D = m(f, V, F), S = F / b;
                    u.addImage(D.toDataURL("image/jpeg", .96), "JPEG", 6, 8, C, S, void 0, "FAST"),
                    V = A, U += 1;
                }
                s(u.output("blob"), l("pdf")), n(U > 1 ? "PDF exported, " + U + " pages" : "PDF exported"),
                d("PDF downloaded"), p("cv_pdf_exported", {
                    template: o().template || "",
                    pages: U,
                    density: e.density || "comfortable"
                });
            } catch (t) {
                console.error("CV PDF export failed:", t), n("PDF failed"), d("PDF export failed. Try Print or ATS Plain PDF.");
            } finally {
                r = !1, c(!1);
            }
        }
    }
    async function C(e) {
        if (!r) {
            r = !0, n("Generating ATS PDF..."), c(!0);
            try {
                if (await h(), !t.jspdf || !t.jspdf.jsPDF) throw new Error("PDF library unavailable");
                var a = new t.jspdf.jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4",
                    compress: !0
                }), i = a.internal.pageSize.getWidth(), f = a.internal.pageSize.getHeight(), u = 18, g = i - 36;
                (e || (t.CVExportUpgrade && t.CVExportUpgrade.buildAtsPlainText ? t.CVExportUpgrade.buildAtsPlainText() : "")).split(/\n/).forEach(function(t) {
                    var e = t.trim(), r = e && /^[A-Z0-9 &\/-]{4,}$/.test(e) && e.length < 44;
                    e ? (a.setFont("helvetica", r ? "bold" : "normal"), a.setFontSize(r ? 10.5 : 9.7),
                    r && u > 20 && (u += 2.4), a.splitTextToSize(e, g).forEach(function(t) {
                        u > f - 16 && (a.addPage(), u = 18), a.text(t, 18, u), u += 5.1;
                    })) : u += 2.6;
                }), s(a.output("blob"), l("pdf", "ATS")), n("ATS Plain PDF exported"), d("ATS Plain PDF downloaded"),
                p("cv_plain_ats_exported", {
                    template: o().template || "",
                    format: "pdf"
                });
            } catch (t) {
                console.error("ATS PDF export failed:", t), n("ATS PDF failed"), d("ATS Plain PDF export failed.");
            } finally {
                r = !1, c(!1);
            }
        }
    }
    function w() {
        var r = e.getElementById("cvpreview");
        if (r) {
            var a = t.open("", "_blank");
            if (a) {
                var s = Object.assign({},i()), c = r.cloneNode(!0);
                confirmOptionalSections(s);
                f(c, s), a.document.write([ "<!DOCTYPE html><html><head><title>" + l("pdf").replace(/\.pdf$/i, "") + "</title>", '<link rel="stylesheet" href="/assets/css/design-system.css">', '<link rel="stylesheet" href="/tools/cv-builder/css/cv-builder.css">', '<link rel="stylesheet" href="/tools/cv-builder/css/cv-export-upgrade.css">', '<link rel="stylesheet" href="/tools/cv-builder/css/cv-export-polish.css">', "<style>@page{size:A4;margin:8mm}html,body{margin:0;background:#fff}.cv-print-document{width:194mm;margin:0 auto}#cvpreview{width:595px!important;min-height:841px!important;box-shadow:none!important;border-radius:0!important;overflow:visible!important;background:#fff!important}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>", '</head><body class="cv-export-print-body"><main class="cv-print-document">', c.outerHTML, "</main></body></html>" ].join("")),
                a.document.close(), n("Print opened"), p("cv_pdf_exported", {
                    template: o().template || "",
                    format: "print",
                    density: s.density || "comfortable"
                }), a.onload = function() {
                    setTimeout(function() {
                        a.focus(), a.print();
                    }, 250);
                };
            } else d("Popup blocked. Allow popups to print this CV.");
        }
    }
    function b(e) {
        var r = e.target.closest("[data-cv-export]");
        if (r) {
            e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation();
            var a = r.dataset.cvExport;
            t.CVExportUpgrade && t.CVExportUpgrade.handleExport && t.CVExportUpgrade.handleExport(a);
        } else e.target.closest("[data-action='print']") && (e.preventDefault(), e.stopPropagation(),
        e.stopImmediatePropagation(), w());
    }
    function E() {
        t.CVExportUpgrade && (t.CVExportUpgrade.exportPdf = y, t.CVExportUpgrade.printCv = w,
        t.CVExportUpgrade.exportAtsPdf = C), t.CVApp && (t.CVApp.downloadPDF = y);
    }
    function P() {
        E(), e.addEventListener("click", b, !0), setTimeout(E, 800);
    }
    "loading" === e.readyState ? e.addEventListener("DOMContentLoaded", P) : P(), t.CVExportPdfQuality = {
        exportPdf: y,
        exportAtsPdf: C,
        printCv: w,
        renderPreviewCanvas: x,
        avoidBlockSplit: avoidBlockSplit
    };
}(window, document);
