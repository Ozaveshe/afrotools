!function(e, t) {
    "use strict";
    function n(t) {
        e.CVExportUpgrade && e.CVExportUpgrade.status && e.CVExportUpgrade.status(t);
    }
    function r(t) {
        e.CVExportUpgrade && e.CVExportUpgrade.toast ? e.CVExportUpgrade.toast(t) : e.CVApp && e.CVApp.showToast && e.CVApp.showToast(t);
    }
    var helperPromise;
    function helper() {
        if (e.CareerDocumentPdf) return Promise.resolve(e.CareerDocumentPdf);
        if (!helperPromise) helperPromise = new Promise(function(resolve, reject) {
            var script = t.createElement("script");
            script.src = "/assets/js/pages/career-document-pdf.js";
            script.onload = function() { e.CareerDocumentPdf ? resolve(e.CareerDocumentPdf) : reject(new Error("PDF helper unavailable")); };
            script.onerror = reject;
            t.head.appendChild(script);
        }).catch(function(failure) { helperPromise = null; throw failure; });
        return helperPromise;
    }
    async function o(text) { return (await helper()).buildPdf(text, "cv"); }
    async function p(a) {
        n("Generating ATS PDF...");
        try {
            var p = await o(a || (e.CVExportUpgrade && e.CVExportUpgrade.buildAtsPlainText ? e.CVExportUpgrade.buildAtsPlainText() : ""));
            !function(n, r) {
                if (e.CVExportUpgrade && e.CVExportUpgrade.downloadBlob) e.CVExportUpgrade.downloadBlob(n, r); else {
                    var a = URL.createObjectURL(n), o = t.createElement("a");
                    o.href = a, o.download = r, o.dataset.noPdfGate = "true", t.body.appendChild(o),
                    o.click(), o.remove(), setTimeout(function() {
                        URL.revokeObjectURL(a);
                    }, 1200);
                }
            }(new Blob([ p ], {
                type: "application/pdf"
            }), e.CVExportUpgrade && e.CVExportUpgrade.filename ? e.CVExportUpgrade.filename("pdf", "ATS") : "AfroTools-CV-ATS.pdf"),
            n("ATS Plain PDF exported"), r("ATS Plain PDF downloaded"), d = {
                template: (e.CVApp && e.CVApp.getState ? e.CVApp.getState() : {}).template || "",
                format: "pdf",
                renderer: "ats-plain-text-pdf"
            }, e.CVExportUpgrade && e.CVExportUpgrade.track && e.CVExportUpgrade.track("cv_plain_ats_exported", d || {});
        } catch (e) {
            var message = window.CareerDocumentPdf ? window.CareerDocumentPdf.message(e, t.documentElement.lang, "cv") : "PDF unavailable. Export DOCX or TXT.";
            n(message), r(message);
        }
        var d;
    }
    function d() {
        e.CVExportAtsPlainPdf = {
            buildPdf: o,
            exportAtsPdf: p
        }, e.CVExportPdfQuality && (e.CVExportPdfQuality.exportAtsPdf = p), e.CVExportUpgrade && (e.CVExportUpgrade.exportAtsPdf = p);
    }
    "loading" === t.readyState ? t.addEventListener("DOMContentLoaded", d) : d(), setTimeout(d, 900);
}(window, document);