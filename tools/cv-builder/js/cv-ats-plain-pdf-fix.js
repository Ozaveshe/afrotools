!function(e, t) {
    "use strict";
    function n(t) {
        e.CVExportUpgrade && e.CVExportUpgrade.status && e.CVExportUpgrade.status(t);
    }
    function r(t) {
        e.CVExportUpgrade && e.CVExportUpgrade.toast ? e.CVExportUpgrade.toast(t) : e.CVApp && e.CVApp.showToast && e.CVApp.showToast(t);
    }
    // PDF standard fonts use Windows-1252, not Unicode code points or ASCII.
    var winAnsi = {8364:128,8218:130,402:131,8222:132,8230:133,8224:134,8225:135,710:136,8240:137,352:138,8249:139,338:140,381:142,8216:145,8217:146,8220:147,8221:148,8226:149,8211:150,8212:151,732:152,8482:153,353:154,8250:155,339:156,382:158,376:159};
    function a(text) {
        return String(text || "").replace(/\r\n?/g, "\n").normalize("NFC").replace(/[ \t]+/g, " ").trim();
    }
    function pdfText(text) {
        return Array.from(a(text)).map(function(character) {
            var code = character.codePointAt(0);
            if (code >= 32 && code <= 126 || code >= 160 && code <= 255) return character;
            if (winAnsi[code]) return String.fromCharCode(winAnsi[code]);
            var error = new Error("The ATS PDF font cannot represent every character.");
            error.code = "CV_PDF_UNSUPPORTED_CHARACTER";
            throw error;
        }).join("").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    }
    function unsupportedMessage() {
        var lang = (t.documentElement.lang || "en").split("-")[0];
        return lang === "fr" ? "Certaines lettres ne sont pas prises en charge par la police du PDF ATS. Exportez en DOCX ou TXT pour conserver tout votre texte." : lang === "sw" ? "Fonti ya PDF ya ATS haiauni baadhi ya herufi. Hamisha kama DOCX au TXT ili kuhifadhi maandishi yako yote." : "The ATS PDF font does not support some characters. Export DOCX or TXT to preserve all your text.";
    }
    function o(e) {
        var t, n, r, o, p = function(e) {
            var t = [], n = [], r = 790;
            return e.forEach(function(e) {
                var a = e.text ? e.heading ? 16 : 13 : 8;
                r - a < 54 && n.length && (t.push(n), n = [], r = 790), n.push(e), r -= a;
            }), n.length && t.push(n), t.length ? t : [ [ {
                text: "ATS PLAIN CV",
                heading: !0
            } ] ];
        }(function(e) {
            var t = [];
            return a(e).split("\n").forEach(function(e) {
                var n = a(e), r = !!n && /^[A-Z0-9 &/-]{4,}$/.test(n) && n.length < 44;
                (function(e, t) {
                    var n = a(e);
                    if (!n) return [ "" ];
                    var r = n.split(/\s+/), o = [], p = "";
                    return r.forEach(function(e) {
                        var n = p ? p + " " + e : e;
                        n.length > t && p ? (o.push(p), p = e) : p = n;
                    }), p && o.push(p), o;
                })(n, r ? 58 : 82).forEach(function(e) {
                    t.push({
                        text: e,
                        heading: r
                    });
                });
            }), t;
        }(e)), d = [], i = [], l = 3;
        p.forEach(function(e) {
            var t = l++, n = l++;
            i.push(t + " 0 R");
            var r = 790, o = "";
            e.forEach(function(e) {
                e.text ? (o += "BT " + (e.heading ? "/F2 11 Tf " : "/F1 10 Tf ") + "54 " + r.toFixed(2) + " Td (" + pdfText(e.text) + ") Tj ET\n",
                r -= e.heading ? 16 : 13) : r -= 8;
            }), d[t] = "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /ProcSet [/PDF /Text] /Font << /F1 FONT_REGULAR 0 R /F2 FONT_BOLD 0 R >> >> /Contents " + n + " 0 R >>",
            d[n] = "<< /Length " + o.length + " >>\nstream\n" + o + "endstream";
        }), t = l++, n = l++, r = l++, o = l++, d[1] = "<< /Type /Catalog /Pages 2 0 R /Metadata " + r + " 0 R >>",
        d[2] = "<< /Type /Pages /Kids [" + i.join(" ") + "] /Count " + p.length + " >>",
        d[t] = "<< /Type /Font /Subtype /Type1 /Name /F1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        d[n] = "<< /Type /Font /Subtype /Type1 /Name /F2 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
        for (var f = 3; f < t; f += 1) d[f] = d[f].replace(/FONT_REGULAR/g, t).replace(/FONT_BOLD/g, n);
        var c = '<?xpacket begin="" id="AfroToolsCV"?>\n<x:xmpmeta xmlns:x="adobe:ns:meta/">\n<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">\n<rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/" pdf:Producer="AfroTools CV Builder ATS Plain PDF"/>\n</rdf:RDF>\n\x3c!-- ' + new Array(9500).join(" ") + ' --\x3e\n</x:xmpmeta>\n<?xpacket end="w"?>';
        d[r] = "<< /Type /Metadata /Subtype /XML /Length " + c.length + " >>\nstream\n" + c + "\nendstream",
        d[o] = "<< /Producer (AfroTools CV Builder) /Creator (AfroTools CV Builder) /Title (ATS Plain CV) >>";
        for (var g = "%PDF-1.4\n%ºß¬à\n", s = [ 0 ], u = 1; u < l; u += 1) s[u] = g.length,
        g += u + " 0 obj\n" + d[u] + "\nendobj\n";
        var x = g.length;
        g += "xref\n0 " + l + "\n0000000000 65535 f \n";
        for (var C = 1; C < l; C += 1) g += String(s[C]).padStart(10, "0") + " 00000 n \n";
        return function(e) {
            for (var t = new Uint8Array(e.length), n = 0; n < e.length; n += 1) t[n] = 255 & e.charCodeAt(n);
            return t;
        }(g += "trailer\n<< /Size " + l + " /Root 1 0 R /Info " + o + " 0 R >>\nstartxref\n" + x + "\n%%EOF\n");
    }
    async function p(a) {
        n("Generating ATS PDF...");
        try {
            var p = o(a || (e.CVExportUpgrade && e.CVExportUpgrade.buildAtsPlainText ? e.CVExportUpgrade.buildAtsPlainText() : ""));
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
            var message = e.code === "CV_PDF_UNSUPPORTED_CHARACTER" ? unsupportedMessage() : "ATS Plain PDF export failed.";
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