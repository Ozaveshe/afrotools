!function(e, t) {
    "use strict";
    function n(t) {
        e.CVExportUpgrade && e.CVExportUpgrade.status && e.CVExportUpgrade.status(t);
    }
    function r(t) {
        e.CVExportUpgrade && e.CVExportUpgrade.toast ? e.CVExportUpgrade.toast(t) : e.CVApp && e.CVApp.showToast && e.CVApp.showToast(t);
    }
    var copies = {
  "en": {
    "generating": "Generating ATS PDF...",
    "exported": "ATS Plain PDF exported",
    "downloaded": "ATS Plain PDF downloaded",
    "stale": "CV changed. Review it and export again.",
    "failed": "PDF unavailable. Export DOCX or TXT."
  },
  "fr": {
    "generating": "Création du PDF ATS…",
    "exported": "PDF ATS exporté",
    "downloaded": "PDF ATS téléchargé",
    "stale": "Le CV a changé. Vérifiez-le puis relancez l’exportation.",
    "failed": "PDF indisponible. Exportez en DOCX ou TXT."
  },
  "sw": {
    "generating": "PDF ya ATS inatengenezwa…",
    "exported": "PDF ya ATS imehamishwa",
    "downloaded": "PDF ya ATS imepakuliwa",
    "stale": "CV imebadilika. Ikague kisha uhamishe tena.",
    "failed": "PDF haipatikani. Hamisha kama DOCX au TXT."
  }
};
    function copy() { return copies[(t.documentElement && t.documentElement.lang || "en").split("-")[0]] || copies.en; }
    function snapshot() { var state = e.CVApp && e.CVApp.getState ? e.CVApp.getState() : {}; return {data: state.data, template: state.template || "", country: state.country}; }
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
        n(copy().generating);
        try {
            var state = snapshot(), fingerprint = JSON.stringify(state);
            var filename = e.CVExportUpgrade && e.CVExportUpgrade.filename ? e.CVExportUpgrade.filename("pdf", "ATS") : "AfroTools-CV-ATS.pdf";
            var p = await o(a || (e.CVExportUpgrade && e.CVExportUpgrade.buildAtsPlainText ? e.CVExportUpgrade.buildAtsPlainText() : ""));
            if (fingerprint !== JSON.stringify(snapshot())) { n(copy().stale); r(copy().stale); return; }
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
            }), filename),
            n(copy().exported), r(copy().downloaded), d = {
                template: state.template,
                format: "pdf",
                renderer: "ats-plain-text-pdf"
            }, e.CVExportUpgrade && e.CVExportUpgrade.track && e.CVExportUpgrade.track("cv_plain_ats_exported", d || {});
        } catch (e) {
            var message = window.CareerDocumentPdf ? window.CareerDocumentPdf.message(e, t.documentElement.lang, "cv") : copy().failed;
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