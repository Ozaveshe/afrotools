!function() {
    "use strict";
    // Native workflow messages are owned here; filenames and passwords are never translated.
    var language = (document.documentElement.lang || 'en').slice(0, 2);
    var COPY = {
    "Skipped {0} non-PDF files.": {"fr":"Fichiers ignorés (hors PDF) : {0}.","sw":"Faili {0} zisizo PDF zimerukwa."},
    "Protected {0} PDF.": {
        "fr": "Protection terminée : {0} PDF.",
        "sw": "PDF {0} zimelindwa."
    },
    "Unlocked {0} PDF.": {
        "fr": "Déverrouillage terminé : {0} PDF.",
        "sw": "PDF {0} zimefunguliwa."
    },
    "Protecting {0}/{1}: {2}": {
        "fr": "Protection {0}/{1} : {2}",
        "sw": "Inalinda {0}/{1}: {2}"
    },
    "Unlocking {0}/{1}: {2}": {
        "fr": "Déverrouillage {0}/{1} : {2}",
        "sw": "Inafungua {0}/{1}: {2}"
    },
    "{0} PDF selected, {1} total.": {
        "fr": "{0} PDF sélectionnés, {1} au total.",
        "sw": "PDF {0} zimechaguliwa, jumla {1}."
    },
    "{0} files could not be processed.": {
        "fr": "{0} fichiers n’ont pas pu être traités.",
        "sw": "Faili {0} hazikuweza kuchakatwa."
    },
    "Total: {0} -> {1}.": {
        "fr": "Total : {0} → {1}.",
        "sw": "Jumla: {0} → {1}."
    },
    "Password accepted": {
        "fr": "Mot de passe accepté",
        "sw": "Nenosiri limekubaliwa"
    },
    "Restricted": {
        "fr": "Restrictions :",
        "sw": "Vizuizi:"
    },
    "All permissions allowed": {
        "fr": "Toutes les autorisations sont accordées",
        "sw": "Ruhusa zote zimeruhusiwa"
    },
    "printing": {
        "fr": "impression",
        "sw": "uchapishaji"
    },
    "copying": {
        "fr": "copie",
        "sw": "kunakili"
    },
    "editing": {
        "fr": "modification",
        "sw": "uhariri"
    },
    "annotations": {
        "fr": "annotations",
        "sw": "maelezo"
    },
    "form filling": {
        "fr": "remplissage de formulaires",
        "sw": "kujaza fomu"
    },
    "page assembly": {
        "fr": "assemblage de pages",
        "sw": "kuunganisha kurasa"
    },
    "No files were processed.": {
        "fr": "Aucun fichier n’a été traité.",
        "sw": "Hakuna faili zilizochakatwa."
    },
    "No PDFs selected.": {
        "fr": "Aucun PDF sélectionné.",
        "sw": "Hakuna PDF zilizochaguliwa."
    },
    "Loading PDF security engine...": {
        "fr": "Chargement du moteur de sécurité PDF…",
        "sw": "Inapakia injini ya usalama wa PDF…"
    },
    "Protection complete.": {
        "fr": "Protection terminée.",
        "sw": "Ulinzi umekamilika."
    },
    "Unlock complete.": {
        "fr": "Déverrouillage terminé.",
        "sw": "Ufunguaji umekamilika."
    },
    "New files use PDF AES-256 encryption. Permission restrictions are honored by compliant PDF viewers, but they are not DRM.": {
        "fr": "Les nouveaux fichiers utilisent le chiffrement PDF AES-256. Les lecteurs PDF compatibles respectent les restrictions d’autorisation, mais celles-ci ne constituent pas une gestion des droits numériques (DRM).",
        "sw": "Faili mpya hutumia usimbaji fiche wa PDF AES-256. Visomaji vya PDF vinavyofuata kiwango huheshimu vizuizi vya ruhusa, lakini vizuizi hivi si DRM."
    },
    "Unlocked files are unencrypted copies created only after the supplied password was accepted.": {
        "fr": "Les fichiers déverrouillés sont des copies non chiffrées, créées uniquement après acceptation du mot de passe fourni.",
        "sw": "Faili zilizofunguliwa ni nakala zisizosimbwa fiche, zilizoundwa baada ya nenosiri lililotolewa kukubaliwa."
    },
    "Check the password and try again. Unlock cannot bypass an unknown open password.": {
        "fr": "Vérifiez le mot de passe et réessayez. Cet outil ne peut pas contourner un mot de passe d’ouverture inconnu.",
        "sw": "Kagua nenosiri na ujaribu tena. Zana hii haiwezi kukwepa nenosiri la kufungua lisilojulikana."
    },
    "The password was not accepted. Check it and try again.": {
        "fr": "Le mot de passe a été refusé. Vérifiez-le et réessayez.",
        "sw": "Nenosiri halikukubaliwa. Likague kisha ujaribu tena."
    },
    "This PDF could not be processed. Check the file and password, then try again.": {
        "fr": "Ce PDF n’a pas pu être traité. Vérifiez le fichier et le mot de passe, puis réessayez.",
        "sw": "PDF hii haikuweza kuchakatwa. Kagua faili na nenosiri, kisha ujaribu tena."
    },
    "PDF processing failed. Refresh the page and try again.": {
        "fr": "Le traitement PDF a échoué. Actualisez la page et réessayez.",
        "sw": "Uchakataji wa PDF umeshindikana. Pakia ukurasa upya kisha ujaribu tena."
    },
    "Refresh the page and try again. If the PDF uses unusual security, it may not be supported by the browser engine.": {
        "fr": "Actualisez la page et réessayez. Le moteur du navigateur peut ne pas prendre en charge certains types de sécurité PDF.",
        "sw": "Pakia ukurasa upya kisha ujaribu tena. Injini ya kivinjari huenda isitumike kwa baadhi ya aina za usalama wa PDF."
    },
    "Choose at least one PDF file.": {
        "fr": "Choisissez au moins un fichier PDF.",
        "sw": "Chagua angalau faili moja ya PDF."
    },
    "Enter the password people will use to open the PDF.": {
        "fr": "Saisissez le mot de passe qui permettra d’ouvrir le PDF.",
        "sw": "Weka nenosiri litakalotumika kufungua PDF."
    },
    "Use a password with at least 8 characters.": {
        "fr": "Utilisez un mot de passe d’au moins 8 caractères.",
        "sw": "Tumia nenosiri lenye angalau herufi 8."
    },
    "Password confirmation does not match.": {
        "fr": "La confirmation du mot de passe ne correspond pas.",
        "sw": "Uthibitisho wa nenosiri haulingani."
    },
    "Use a different owner password, or leave it blank so AfroTools can generate one.": {
        "fr": "Utilisez un autre mot de passe propriétaire ou laissez ce champ vide pour en générer un.",
        "sw": "Tumia nenosiri tofauti la mmiliki, au acha sehemu hii wazi ili AfroTools itengeneze moja."
    },
    "Enter the known PDF password.": {
        "fr": "Saisissez le mot de passe connu du PDF.",
        "sw": "Weka nenosiri la PDF unalolijua."
    },
    "Generated a strong password. Keep a copy because AfroTools cannot recover it later.": {
        "fr": "Un mot de passe fort a été généré. Conservez-le : AfroTools ne pourra pas le récupérer.",
        "sw": "Nenosiri imara limetengenezwa. Lihifadhi kwa sababu AfroTools haiwezi kulirejesha baadaye."
    },
    "Download PDF": {
        "fr": "Télécharger le PDF",
        "sw": "Pakua PDF"
    },
    "Download ZIP": {
        "fr": "Télécharger le ZIP",
        "sw": "Pakua ZIP"
    },
    "Protecting...": {
        "fr": "Protection…",
        "sw": "Inalinda…"
    },
    "Unlocking...": {
        "fr": "Déverrouillage…",
        "sw": "Inafungua…"
    },
    "Protect PDF": {
        "fr": "Protéger le PDF",
        "sw": "Linda PDF"
    },
    "Unlock PDF": {
        "fr": "Déverrouiller le PDF",
        "sw": "Fungua PDF"
    }
};
    function message(key, values) {
        var template = COPY[key] && COPY[key][language] || key;
        return values && values.length ? template.replace(/\{(\d+)\}/g, function(_, i) { return values[i]; }) : template;
    }
    var e = {
        mode: "protect",
        files: [],
        results: [],
        download: null,
        busy: !1
    }, t = {};
    function n(e) {
        return document.getElementById(e);
    }
    function o(e, t) {
        e && (e.textContent = message(t || "", []));
    }
    function r(e) {
        return [ e.name, e.size, e.lastModified ].join(":");
    }
    function s(e) {
        if (!e) return "0 B";
        for (var t = [ "B", "KB", "MB", "GB" ], n = e, o = 0; n >= 1024 && o < t.length - 1; ) n /= 1024,
        o++;
        return (0 === o ? Math.round(n) : n.toFixed(n >= 10 ? 1 : 2)) + " " + t[o];
    }
    function a(e, t) {
        return String(e || t || "document").replace(/\.pdf$/i, "").replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "") || t || "document";
    }
    function l() {
        return [ t.processBtn, t.unlockProcessBtn ].filter(Boolean);
    }
    function i(t) {
        var n = "protect" === e.mode ? t ? "Protecting..." : "Protect PDF" : t ? "Unlocking..." : "Unlock PDF";
        l().forEach(function(e) {
            e.textContent = message(n, []);
        });
    }
    function d() {
        l().forEach(function(t) {
            t.disabled = e.busy || 0 === e.files.length;
        });
    }
    function c(n) {
        e.busy = n, d(), i(n), [ t.modeProtect, t.modeUnlock, t.clearFilesBtn, t.generatePassword ].forEach(function(e) {
            e && (e.disabled = n);
        }), document.querySelectorAll(".mini-btn,.toggle-password").forEach(function(e) {
            e.disabled = n;
        });
    }
    function u(e, n) {
        t.progressBar.classList.add("on"), t.progressFill.style.width = Math.max(0, Math.min(100, e || 0)) + "%",
        n && o(t.resultText, n);
    }
    function f(n) {
        e.results = [], e.download = null, t.resultCard.classList.remove("on"), t.resultRows.innerHTML = "",
        t.resultNote.classList.toggle("on", !!n), o(t.resultNote, n || ""), t.actionRow.classList.remove("on"),
        t.progressBar.classList.remove("on"), t.progressFill.style.width = "0%", o(t.resultText, "");
    }
    function p() {
        if (t.fileList.innerHTML = "", t.fileSummary.classList.toggle("on", e.files.length > 0),
        t.clearFilesBtn.style.display = e.files.length ? "inline-flex" : "none", e.files.length) {
            var n = e.files.reduce(function(e, t) {
                return e + t.file.size;
            }, 0);
            o(t.fileSummaryText, message("{0} PDF selected, {1} total.", [e.files.length, s(n)])),
            e.files.forEach(function(n, o) {
                var r = document.createElement("div");
                r.className = "file-row";
                var a = document.createElement("div");
                a.className = "file-info";
                var l = document.createElement("div");
                l.className = "file-name", l.setAttribute("translate", "no"), l.textContent = n.file.name;
                var i = document.createElement("div");
                i.className = "file-meta", i.textContent = s(n.file.size), a.appendChild(l), a.appendChild(i);
                var d = document.createElement("button");
                d.type = "button", d.className = "mini-btn", d.textContent = "Remove", d.addEventListener("click", function() {
                    e.busy || (e.files.splice(o, 1), f(""), p());
                }), r.appendChild(a), r.appendChild(d), t.fileList.appendChild(r);
            });
        } else o(t.fileSummaryText, "No PDFs selected.");
        d();
    }
    function w(t) {
        if (!e.busy) {
            var n = {}, o = 0;
            e.files.forEach(function(e) {
                n[r(e.file)] = !0;
            }), Array.from(t || []).forEach(function(t) {
                if (function(e) {
                    return !!e && ("application/pdf" === e.type || /\.pdf$/i.test(e.name || ""));
                }(t)) {
                    var s = r(t);
                    n[s] || (n[s] = !0, e.files.push({
                        file: t
                    }));
                } else o++;
            }), f(o ? message("Skipped {0} non-PDF files.", [o]) : ""), p();
        }
    }
    function m(n) {
        e.busy || (e.mode = n, t.modeProtect.classList.toggle("on", "protect" === n), t.modeUnlock.classList.toggle("on", "unlock" === n),
        t.modeProtect.setAttribute("aria-pressed", String("protect" === n)), t.modeUnlock.setAttribute("aria-pressed", String("unlock" === n)),
        t.protectPanel.classList.toggle("hidden", "protect" !== n), t.unlockPanel.classList.toggle("hidden", "unlock" !== n),
        t.fileModeLabel.textContent = "protect" === n ? "Upload PDFs to protect" : "Upload protected PDFs to unlock",
        t.dropTitle.textContent = "protect" === n ? "Choose PDFs to password-protect" : "Choose password-protected PDFs",
        t.dropHint.textContent = "protect" === n ? "Single PDF downloads as a PDF. Multiple PDFs download as a ZIP." : "Enter the known password and export unencrypted copies.",
        i(!1), f(""), d());
    }
    function h() {
        var e, n, r, s = (e = t.openPassword.value, r = 0, (n = String(e || "")).length >= 8 && r++,
        n.length >= 14 && r++, /[a-z]/.test(n) && /[A-Z]/.test(n) && r++, /\d/.test(n) && r++,
        /[^a-zA-Z0-9]/.test(n) && r++, /(.)\1{2,}/.test(n) && (r = Math.max(0, r - 1)),
        /password|123456|qwerty|letmein/i.test(n) && (r = 0), {
            score: r = Math.max(0, Math.min(5, r)),
            label: [ "Empty", "Very weak", "Weak", "Good", "Strong", "Excellent" ][r] || "Empty"
        });
        t.strength.classList.toggle("on", !!t.openPassword.value), t.strengthMeter.dataset.score = String(s.score),
        o(t.strengthLabel, s.label), o(t.strengthHint, s.score < 3 && t.openPassword.value.length ? "Use a longer password with mixed letters, numbers, and symbols." : "Long unique passphrases are safest.");
    }
    function g(e) {
        var t = [];
        return e.allowPrint || t.push("printing"), e.allowCopy || t.push("copying"), e.allowEdit || t.push("editing"),
        e.allowAnnotate || t.push("annotations"), e.allowForm || t.push("form filling"),
        e.allowAssemble || t.push("page assembly"), t.length ? message("Restricted", []) + " " + t.map(function(x) { return message(x, []); }).join(", ") : message("All permissions allowed", []);
    }
    async function v() {
        if (!e.busy) {
            try {
                !function() {
                    if (!e.files.length) throw new Error("Choose at least one PDF file.");
                    if ("unlock" !== e.mode) {
                        var n = t.openPassword.value || "";
                        if (!n) throw new Error("Enter the password people will use to open the PDF.");
                        if (n.length < 8) throw new Error("Use a password with at least 8 characters.");
                        if (n !== t.confirmPassword.value) throw new Error("Password confirmation does not match.");
                        if (t.ownerPassword.value && t.ownerPassword.value === n) throw new Error("Use a different owner password, or leave it blank so AfroTools can generate one.");
                    } else if (!t.unlockPassword.value) throw new Error("Enter the known PDF password.");
                }();
            } catch (e) {
                return t.resultCard.classList.add("on"), t.resultRows.innerHTML = "", t.actionRow.classList.remove("on"),
                t.progressBar.classList.remove("on"), o(t.resultText, e.message || "Check your settings."),
                void t.resultNote.classList.remove("on");
            }
            c(!0), e.results = [], e.download = null, t.resultCard.classList.add("on"), t.resultRows.innerHTML = "",
            t.actionRow.classList.remove("on"), t.resultNote.classList.remove("on"), u(4, "Loading PDF security engine...");
            try {
                if (!window.AfroQPDF || !window.AfroQPDF.ensure) throw new Error("PDF security engine failed to load.");
                await window.AfroQPDF.ensure();
                for (var n = "protect" === e.mode ? {
                    userPassword: t.openPassword.value,
                    ownerPassword: t.ownerPassword.value,
                    allowPrint: t.allowPrint.checked,
                    allowCopy: t.allowCopy.checked,
                    allowEdit: t.allowEdit.checked,
                    allowAnnotate: t.allowAnnotate.checked,
                    allowForm: t.allowForm.checked,
                    allowAssemble: t.allowAssemble.checked
                } : null, r = 0; r < e.files.length; r++) {
                    var l = e.files[r].file;
                    u(8 + r / e.files.length * 82, message("protect" === e.mode ? "Protecting {0}/{1}: {2}" : "Unlocking {0}/{1}: {2}", [r + 1, e.files.length, l.name]));
                    try {
                        var i, d, f, p = await l.arrayBuffer();
                        if ("protect" === e.mode) {
                            var w = await window.AfroQPDF.encrypt(p, n);
                            i = w.bytes, d = a(l.name, "document") + "_protected.pdf", f = g(w.permissions) + " - " + s(l.size) + " -> " + s(i.length);
                        } else i = await window.AfroQPDF.decrypt(p, t.unlockPassword.value), d = a(l.name, "document") + "_unlocked.pdf",
                        f = message("Password accepted", []) + " - " + s(l.size) + " -> " + s(i.length);
                        e.results.push({
                            ok: !0,
                            sourceName: l.name,
                            name: d,
                            bytes: i,
                            originalSize: l.size,
                            outputSize: i.length,
                            meta: f
                        });
                    } catch (t) {
                        e.results.push({
                            ok: !1,
                            sourceName: l.name,
                            error: message(/invalid password/i.test(t && t.message || "") ? "The password was not accepted. Check it and try again." : "This PDF could not be processed. Check the file and password, then try again.", [])
                        });
                    }
                }
                var m = e.results.filter(function(e) {
                    return e.ok;
                });
                1 === m.length ? e.download = {
                    blob: new Blob([ m[0].bytes ], {
                        type: "application/pdf"
                    }),
                    filename: m[0].name
                } : m.length > 1 && (e.download = {
                    blob: y(m.map(function(e) {
                        return {
                            name: e.name,
                            data: e.bytes
                        };
                    })),
                    filename: "protect" === e.mode ? "protected_pdfs.zip" : "unlocked_pdfs.zip"
                }), u(100, "protect" === e.mode ? "Protection complete." : "Unlock complete."),
                function() {
                    t.resultRows.innerHTML = "";
                    var n = e.results.filter(function(e) {
                        return e.ok;
                    }), r = e.results.filter(function(e) {
                        return !e.ok;
                    });
                    if (e.results.forEach(function(e) {
                        var n = document.createElement("div");
                        n.className = "result-row" + (e.ok ? "" : " error");
                        var o = document.createElement("div");
                        o.className = "result-name", o.textContent = e.ok ? e.name : e.sourceName;
                        o.setAttribute("translate", "no");
                        var r = document.createElement("div");
                        r.className = "result-meta", r.textContent = e.ok ? e.meta : e.error, n.appendChild(o),
                        n.appendChild(r), t.resultRows.appendChild(n);
                    }), n.length) {
                        var a = n.reduce(function(e, t) {
                            return e + t.originalSize;
                        }, 0), l = n.reduce(function(e, t) {
                            return e + t.outputSize;
                        }, 0), i = "protect" === e.mode ? "New files use PDF AES-256 encryption. Permission restrictions are honored by compliant PDF viewers, but they are not DRM." : "Unlocked files are unencrypted copies created only after the supplied password was accepted.";
                        i = message(i, []),
                        r.length && (i += " " + message("{0} files could not be processed.", [r.length])),
                        i += " " + message("Total: {0} -> {1}.", [s(a), s(l)]), o(t.resultText, message("protect" === e.mode ? "Protected {0} PDF." : "Unlocked {0} PDF.", [n.length])),
                        t.resultNote.classList.add("on"), o(t.resultNote, i), t.actionRow.classList.add("on"),
                        t.downloadBtn.textContent = message(e.download && /\.zip$/i.test(e.download.filename) ? "Download ZIP" : "Download PDF", []);
                    } else o(t.resultText, "No files were processed."), t.resultNote.classList.toggle("on", !!r.length),
                    o(t.resultNote, r.length ? "Check the password and try again. Unlock cannot bypass an unknown open password." : ""),
                    t.actionRow.classList.remove("on");
                    t.resultCard.classList.add("on");
                }();
            } catch (e) {
                t.resultCard.classList.add("on"), o(t.resultText, "PDF processing failed. Refresh the page and try again."),
                t.actionRow.classList.remove("on"), t.resultNote.classList.add("on"), o(t.resultNote, "Refresh the page and try again. If the PDF uses unusual security, it may not be supported by the browser engine.");
            } finally {
                c(!1);
            }
        }
    }
    function P(e) {
        var t = P.table;
        if (!t) {
            t = P.table = new Uint32Array(256);
            for (var n = 0; n < 256; n++) {
                for (var o = n, r = 0; r < 8; r++) o = 1 & o ? 3988292384 ^ o >>> 1 : o >>> 1;
                t[n] = o >>> 0;
            }
        }
        for (var s = 4294967295, a = 0; a < e.length; a++) s = t[255 & (s ^ e[a])] ^ s >>> 8;
        return (4294967295 ^ s) >>> 0;
    }
    function y(e) {
        var t = new TextEncoder, n = [], o = [], r = 0;
        e.forEach(function(e) {
            var s = t.encode(e.name), a = e.data instanceof Uint8Array ? e.data : new Uint8Array(e.data), l = P(a), i = new Uint8Array(30 + s.length), d = new DataView(i.buffer);
            d.setUint32(0, 67324752, !0), d.setUint16(4, 20, !0), d.setUint32(14, l, !0), d.setUint32(18, a.length, !0),
            d.setUint32(22, a.length, !0), d.setUint16(26, s.length, !0), i.set(s, 30);
            var c = new Uint8Array(46 + s.length), u = new DataView(c.buffer);
            u.setUint32(0, 33639248, !0), u.setUint16(4, 20, !0), u.setUint16(6, 20, !0), u.setUint32(16, l, !0),
            u.setUint32(20, a.length, !0), u.setUint32(24, a.length, !0), u.setUint16(28, s.length, !0),
            u.setUint32(38, 32, !0), u.setUint32(42, r, !0), c.set(s, 46), n.push(i, a), o.push(c),
            r += i.length + a.length;
        });
        var s = r, a = 0;
        o.forEach(function(e) {
            n.push(e), a += e.length;
        });
        var l = new Uint8Array(22), i = new DataView(l.buffer);
        return i.setUint32(0, 101010256, !0), i.setUint16(8, e.length, !0), i.setUint16(10, e.length, !0),
        i.setUint32(12, a, !0), i.setUint32(16, s, !0), n.push(l), new Blob(n, {
            type: "application/zip"
        });
    }
    function k() {
        if (e.download) {
            var t = document.querySelector("email-gate-modal");
            t && "function" == typeof t.show ? t.show(n) : n();
        }
        function n() {
            var t = URL.createObjectURL(e.download.blob), n = document.createElement("a");
            n.href = t, n.download = e.download.filename, document.body.appendChild(n), n.click(),
            document.body.removeChild(n), setTimeout(function() {
                URL.revokeObjectURL(t);
            }, 5e3);
        }
    }
    function L() {
        t.modeProtect = n("modeProtect"), t.modeUnlock = n("modeUnlock"), t.fileModeLabel = n("fileModeLabel"),
        t.dropZone = n("dropZone"), t.dropTitle = n("dropTitle"), t.dropHint = n("dropHint"),
        t.pdfFileInput = n("pdfFileInput"), t.fileSummary = n("fileSummary"), t.fileSummaryText = n("fileSummaryText"),
        t.fileList = n("fileList"), t.clearFilesBtn = n("clearFilesBtn"), t.protectPanel = n("protectPanel"),
        t.unlockPanel = n("unlockPanel"), t.openPassword = n("openPassword"), t.confirmPassword = n("confirmPassword"),
        t.ownerPassword = n("ownerPassword"), t.unlockPassword = n("unlockPassword"), t.generatePassword = n("generatePassword"),
        t.strength = n("passwordStrength"), t.strengthMeter = n("strengthMeter"), t.strengthLabel = n("strengthLabel"),
        t.strengthHint = n("strengthHint"), t.allowPrint = n("allowPrint"), t.allowCopy = n("allowCopy"),
        t.allowEdit = n("allowEdit"), t.allowAnnotate = n("allowAnnotate"), t.allowForm = n("allowForm"),
        t.allowAssemble = n("allowAssemble"), t.processBtn = n("processBtn"), t.unlockProcessBtn = n("unlockProcessBtn"),
        t.resultCard = n("resultCard"), t.resultText = n("resultText"), t.resultRows = n("resultRows"),
        t.resultNote = n("resultNote"), t.progressBar = n("progressBar"), t.progressFill = n("progressFill"),
        t.actionRow = n("actionRow"), t.downloadBtn = n("downloadBtn"), [t.resultText, t.resultRows, t.resultNote, t.fileSummaryText, t.downloadBtn, t.processBtn, t.unlockProcessBtn].forEach(function(el) { el.setAttribute("translate", "no"); }), t.dropZone.addEventListener("click", function() {
            e.busy || t.pdfFileInput.click();
        }), t.dropZone.addEventListener("keydown", function(e) {
            "Enter" !== e.key && " " !== e.key || (e.preventDefault(), t.pdfFileInput.click());
        }), t.dropZone.addEventListener("dragover", function(e) {
            e.preventDefault(), t.dropZone.classList.add("dragover");
        }), t.dropZone.addEventListener("dragleave", function() {
            t.dropZone.classList.remove("dragover");
        }), t.dropZone.addEventListener("drop", function(e) {
            e.preventDefault(), t.dropZone.classList.remove("dragover"), w(e.dataTransfer.files);
        }), t.pdfFileInput.addEventListener("change", function(e) {
            w(e.target.files), e.target.value = "";
        }), t.modeProtect.addEventListener("click", function() {
            m("protect");
        }), t.modeUnlock.addEventListener("click", function() {
            m("unlock");
        }), t.clearFilesBtn.addEventListener("click", function() {
            e.busy || (e.files = [], f(""), p());
        }), t.generatePassword.addEventListener("click", function() {
            var e = function() {
                var e = new Uint8Array(22);
                crypto.getRandomValues(e);
                for (var t = "", n = 0; n < e.length; n++) t += "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*-_=+?"[e[n] % 68];
                return t;
            }();
            t.openPassword.value = e, t.confirmPassword.value = e, h(), f("Generated a strong password. Keep a copy because AfroTools cannot recover it later.");
        }), [ t.openPassword, t.confirmPassword, t.ownerPassword, t.unlockPassword ].forEach(function(e) {
            e.addEventListener("input", function() {
                e === t.openPassword && h(), f("");
            });
        }), document.querySelectorAll(".toggle-password").forEach(function(e) {
            e.addEventListener("click", function() {
                !function(e) {
                    var t = n(e.getAttribute("data-target"));
                    t && (t.type = "password" === t.type ? "text" : "password", e.textContent = "password" === t.type ? "Show" : "Hide");
                }(e);
            });
        }), [ t.allowPrint, t.allowCopy, t.allowEdit, t.allowAnnotate, t.allowForm, t.allowAssemble ].forEach(function(e) {
            e.addEventListener("change", function() {
                f("");
            });
        }), l().forEach(function(e) {
            e.addEventListener("click", v);
        }), t.downloadBtn.addEventListener("click", k), h(), p(), m("protect");
    }
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", L) : L();
}();
