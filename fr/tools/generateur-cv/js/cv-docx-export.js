"use strict";

!function(e, t) {
    var localeCopy = {
  "en": {
    "invalidText": "DOCX cannot contain an invalid text character. Remove it or keep a JSON backup; your saved CV is unchanged.",
    "name": "Your Name",
    "target": "Target role",
    "present": "Present",
    "to": " to ",
    "summary": "Summary",
    "experience": "Experience",
    "education": "Education",
    "skills": "Skills",
    "projects": "Projects",
    "certifications": "Certifications",
    "languages": "Languages",
    "references": "References",
    "role": "Role",
    "qualification": "Qualification",
    "technical": "Technical",
    "workplace": "Workplace",
    "tools": "Tools",
    "project": "Project",
    "certification": "Certification",
    "reference": "Reference",
    "downloaded": "DOCX downloaded",
    "failure": "DOCX export failed. Use PDF, TXT, or JSON backup.",
    "designed": "Designed PDF",
    "ats": "ATS Plain PDF",
    "backup": "JSON backup",
    "editable": "Télécharger un document Word modifiable",
    "unavailable": "DOCX export is unavailable in this browser"
  },
  "fr": {
    "invalidText": "Un caractère de texte invalide empêche l’export DOCX. Supprimez-le ou conservez une sauvegarde JSON ; votre CV enregistré reste inchangé.",
    "name": "Votre nom",
    "target": "Poste visé",
    "present": "Aujourd’hui",
    "to": " à ",
    "summary": "Profil",
    "experience": "Expérience",
    "education": "Formation",
    "skills": "Compétences",
    "projects": "Projets",
    "certifications": "Certifications",
    "languages": "Langues",
    "references": "Références",
    "role": "Poste",
    "qualification": "Diplôme",
    "technical": "Techniques",
    "workplace": "Professionnelles",
    "tools": "Outils",
    "project": "Projet",
    "certification": "Certification",
    "reference": "Référence",
    "downloaded": "DOCX téléchargé",
    "failure": "Échec de l’export DOCX. Utilisez PDF, TXT ou une sauvegarde JSON.",
    "designed": "PDF mis en page",
    "ats": "PDF simple pour ATS",
    "backup": "Sauvegarde JSON",
    "editable": "Télécharger un document Word modifiable",
    "unavailable": "L’export DOCX est indisponible dans ce navigateur"
  },
  "sw": {
    "invalidText": "Herufi batili inazuia uhamishaji wa DOCX. Iondoe au hifadhi nakala ya JSON; CV yako iliyohifadhiwa haijabadilishwa.",
    "name": "Jina lako",
    "target": "Nafasi lengwa",
    "present": "Sasa",
    "to": " hadi ",
    "summary": "Muhtasari",
    "experience": "Uzoefu",
    "education": "Elimu",
    "skills": "Ujuzi",
    "projects": "Miradi",
    "certifications": "Vyeti",
    "languages": "Lugha",
    "references": "Wadhamini",
    "role": "Nafasi",
    "qualification": "Sifa ya elimu",
    "technical": "Kiufundi",
    "workplace": "Kazini",
    "tools": "Zana",
    "project": "Mradi",
    "certification": "Cheti",
    "reference": "Mdhamini",
    "downloaded": "DOCX imepakuliwa",
    "failure": "Uhamishaji wa DOCX umeshindikana. Tumia PDF, TXT au nakala ya JSON.",
    "designed": "PDF yenye mpangilio",
    "ats": "PDF rahisi ya ATS",
    "backup": "Nakala ya JSON",
    "editable": "Pakua hati ya Word inayoweza kuhaririwa",
    "unavailable": "Uhamishaji wa DOCX haupatikani kwenye kivinjari hiki"
  }
};
    var copy = localeCopy[String(t.documentElement.lang || "en").split("-")[0]] || localeCopy.en;

    function n(e) {
        return String(e || "").replace(/\s+/g, " ").trim();
    }
    function r(e) {
        return String(e == null ? "" : e).replace(/\r\n?/g, "\n").replace(/[&<>"']/g, function(e) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&apos;"
            }[e];
        });
    }
    function o(e) {
        return Array.isArray(e) ? e.filter(Boolean) : [];
    }
    function a(e, t) {
        return e.map(n).filter(Boolean).join(t || " | ");
    }
    function l(t) {
        return e.CVApp && "function" == typeof e.CVApp.fmtMonth ? n(e.CVApp.fmtMonth(t)) : n(t);
    }
    function c(e) {
        return a([ l(e.s || e.start || e.y1), e.cur ? copy.present : l(e.e || e.end || e.y2) ], copy.to);
    }
    function i() {
        return e.CVApp && "function" == typeof e.CVApp.getState ? e.CVApp.getState() : {};
    }
    function p(t) {
        e.CVExportUpgrade && "function" == typeof e.CVExportUpgrade.status && e.CVExportUpgrade.status(t),
        e.CVApp && "function" == typeof e.CVApp.showToast && e.CVApp.showToast(t);
    }
    function s(e, t, n) {
        return "<w:p><w:pPr>" + (t ? '<w:pStyle w:val="' + t + '"/>' : "") + (n || "") + "</w:pPr>" + e.join("") + "</w:p>";
    }
    function d(e, t) {
        var n = "";
        return (t = t || {}).bold && (n += "<w:b/>"), t.italic && (n += "<w:i/>"), t.color && (n += '<w:color w:val="' + function(e) {
            return r(e).replace(/"/g, "&quot;");
        }(t.color) + '"/>'), "<w:r>" + (n ? "<w:rPr>" + n + "</w:rPr>" : "") + '<w:t xml:space="preserve">' + r(e).replace(/\n/g, '</w:t><w:br/><w:t xml:space="preserve">').replace(/\t/g, '</w:t><w:tab/><w:t xml:space="preserve">') + "</w:t></w:r>";
    }
    function u(e, t) {
        return e ? s([ d(e) ], t) : "";
    }
    function m(e) {
        return e ? s([ d(e) ], null, '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>') : "";
    }
    function f(e, t) {
        return s([ d(e, {
            bold: !0
        }), t ? d("    " + t) : "" ].filter(Boolean));
    }
    function w(e, t) {
        return t ? u(e, "Heading2") + t : "";
    }
    function x(e, t) {
        var r = t && t.colorAccent ? t.colorAccent.replace("#", "") : "0B63CE", l = [];
        return l.push(s([ d(a([ e.fn, e.ln ], " ") || e.name || copy.name, {
            bold: !0,
            color: r
        }) ], "Title")), l.push(u(e.title || copy.target)), l.push(u(a([ e.email, a([ e.phoneCode, e.phone ], " "), e.altPhone, e.loc, e.linkedin || e.li, e.github, e.web, e.portfolio ], " | "))),
        l.push(w(copy.summary, u(e.summary))), l.push(w(copy.experience, o(e.exps || e.experience).map(function(e) {
            return n([ e.t, e.c, e.l, e.s, e.e, e.d ].join(" ")) ? [ f(e.t || copy.role, c(e)), u(a([ e.c, e.l ], " - ")), (t = e.d,
            String(t || "").split(/\n+/).map(function(e) {
                return n(e.replace(/^\s*(?:[-*]|\u2022|\d+\.)\s*/, ""));
            }).filter(Boolean)).map(m).join("") ].join("") : "";
            var t;
        }).join(""))), o(e.exps || e.experience).length >= 3 && l.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>'),
        l.push(w(copy.education, function(e) {
            return o(e).map(function(e) {
                return n([ e.deg, e.sch, e.loc, e.y1, e.y2, e.g, e.d ].join(" ")) ? [ f(e.deg || copy.qualification, c(e)), u(a([ e.sch, e.loc, e.g ], " - ")), e.d ? u(e.d) : "" ].join("") : "";
            }).join("");
        }(e.edus || e.education))), l.push(w(copy.skills, function(e) {
            var t = [];
            return e && e.h && t.push([ copy.technical, e.h ]), e && e.s && t.push([ copy.workplace, e.s ]),
            e && e.t && t.push([ copy.tools, e.t ]), t.map(function(e) {
                return f(e[0], (t = e[1], String(t || "").split(/[,;\n]+/).map(n).filter(Boolean)).join(", "));
                var t;
            }).join("");
        }(e.skills))), l.push(w(copy.projects, function(e) {
            return o(e).map(function(e) {
                return n([ e.n, e.name, e.url, e.tech, e.d, e.desc ].join(" ")) ? [ f(e.n || e.name || copy.project, e.tech || ""), u(e.url || ""), u(e.d || e.desc || "") ].join("") : "";
            }).join("");
        }(e.showProjs ? (e.projs || e.projects) : []))), l.push(w(copy.certifications, function(e) {
            return o(e).map(function(e) {
                return f(e.n || e.name || copy.certification, a([ e.i || e.issuer, e.y || e.year ], " - "));
            }).join("");
        }(e.certs || e.certifications))), l.push(w(copy.languages, function(e) {
            return o(e).map(function(e) {
                return u("string" == typeof e ? e : a([ e.l || e.name, e.lv || e.level ], " - "));
            }).join("");
        }(e.langs || e.languages))), e.showRefs && l.push(w(copy.references, function(e) {
            return o(e).map(function(e) {
                return "string" == typeof e ? u(e) : [ f(e.n || e.name || copy.reference, e.t || e.title || ""), u(a([ e.org, e.e, e.p, e.rel ], " | ")) ].join("");
            }).join("");
        }(e.refs || e.references))), (e && window.CVDocumentModel && window.CVDocumentModel.portableSections ? window.CVDocumentModel.portableSections(e, i().template) : []).forEach(function(section){l.push(w(section.title, section.text.split(/\n/).map(function(line){return u(line);}).join("")));}), l.push('<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1008" w:right="1008" w:bottom="1008" w:left="1008" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>'),
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + l.join("") + "</w:body></w:document>";
    }
    function g(e) {
        for (var t = g.table || (g.table = Array.from({
            length: 256
        }, function(e, t) {
            for (var n = 0; n < 8; n += 1) t = 1 & t ? 3988292384 ^ t >>> 1 : t >>> 1;
            return t >>> 0;
        })), n = -1, r = 0; r < e.length; r += 1) n = n >>> 8 ^ t[255 & (n ^ e[r])];
        return (-1 ^ n) >>> 0;
    }
    function h(e) {
        return [ 255 & e, e >>> 8 & 255 ];
    }
    function y(e) {
        return [ 255 & e, e >>> 8 & 255, e >>> 16 & 255, e >>> 24 & 255 ];
    }
    function v(e) {
        for(var character of String(e)){var cp=character.codePointAt(0);if(!(cp===9||cp===10||cp===13||(cp>=32&&cp<=55295)||(cp>=57344&&cp<=65533)||(cp>=65536&&cp<=1114111))){var error=new Error("Invalid DOCX XML character");error.code="CV_DOCX_INVALID_TEXT";throw error;}}
        return (new TextEncoder).encode(e);
    }
    function C() {
        var t, n = i();
        return function(e) {
            var t = [], n = [], r = 0;
            e.forEach(function(e) {
                var o = v(e.name), a = v(e.content), l = g(a), c = [].concat(y(67324752), h(20), h(0), h(0), h(0), h(0), y(l), y(a.length), y(a.length), h(o.length), h(0));
                t.push(new Uint8Array(c), o, a), n.push({
                    file: e,
                    name: o,
                    crc: l,
                    size: a.length,
                    offset: r
                }), r += c.length + o.length + a.length;
            });
            var o = r;
            n.forEach(function(e) {
                var n = [].concat(y(33639248), h(20), h(20), h(0), h(0), h(0), h(0), y(e.crc), y(e.size), y(e.size), h(e.name.length), h(0), h(0), h(0), h(0), y(0), y(e.offset));
                t.push(new Uint8Array(n), e.name), r += n.length + e.name.length;
            });
            var a = r - o;
            return t.push(new Uint8Array([].concat(y(101010256), h(0), h(0), h(n.length), h(n.length), y(a), y(o), h(0)))),
            new Blob(t, {
                type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            });
        }([ {
            name: "[Content_Types].xml",
            content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>'
        }, {
            name: "_rels/.rels",
            content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>'
        }, {
            name: "word/document.xml",
            content: x(n.data || {}, e.CVTemplateRegistry && e.CVTemplateRegistry.get ? e.CVTemplateRegistry.get(n.template || "ats-plain") : null)
        }, {
            name: "word/_rels/document.xml.rels",
            content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/></Relationships>'
        }, {
            name: "word/styles.xml",
            content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="100" w:line="276" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos"/><w:sz w:val="21"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="34"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="Heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="180" w:after="80"/><w:keepNext/></w:pPr><w:rPr><w:b/><w:sz w:val="23"/></w:rPr></w:style></w:styles>'
        }, {
            name: "word/numbering.xml",
            content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="•"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num></w:numbering>'
        }, {
            name: "docProps/core.xml",
            content: (t = (new Date).toISOString(), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>AfroTools CV</dc:title><dc:creator>AfroTools CV Builder</dc:creator><cp:lastModifiedBy>AfroTools CV Builder</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">' + t + '</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">' + t + "</dcterms:modified></cp:coreProperties>")
        }, {
            name: "docProps/app.xml",
            content: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>AfroTools CV Builder</Application></Properties>'
        } ]);
    }
    function b() {
        return !!(e.Blob && e.URL && e.TextEncoder && t && t.createElement);
    }
    function T() {
        if (!b()) return p(copy.unavailable), !1;
        try {
            return function(n, r) {
                if (e.CVExportUpgrade && "function" == typeof e.CVExportUpgrade.downloadBlob) return e.CVExportUpgrade.downloadBlob(n, r);
                var o = URL.createObjectURL(n), a = t.createElement("a");
                a.href = o, a.download = r, a.dataset.noPdfGate = "true", t.body.appendChild(a),
                a.click(), a.remove(), setTimeout(function() {
                    URL.revokeObjectURL(o);
                }, 1200);
            }(C(), function() {
                if (e.CVExportUpgrade && "function" == typeof e.CVExportUpgrade.filename) return e.CVExportUpgrade.filename("docx");
                var t, n = (t = i()) && t.data ? t.data : {};
                return (a([ n.fn, n.ln, n.title || "CV" ], "-") || "AfroTools-CV").replace(/&/g, " and ").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-") + ".docx";
            }()), p(copy.downloaded), n = "cv_export_docx", r = {
                template: i().template || "",
                country: i().country || ""
            }, e.CVExportUpgrade && "function" == typeof e.CVExportUpgrade.track ? e.CVExportUpgrade.track(n, r || {}) : e.CVAnalytics && "function" == typeof e.CVAnalytics.track && e.CVAnalytics.track(n, r || {}),
            !0;
        } catch (e) {
            return p(e && e.code === "CV_DOCX_INVALID_TEXT" ? copy.invalidText : copy.failure),
            !1;
        }
        var n, r;
    }
    function P() {
        function n(e, t) {
            e.textContent !== t && (e.textContent = t);
        }
        !function() {
            if (e.CVExportUpgrade && !e.CVExportUpgrade.__docxReady) {
                var t = e.CVExportUpgrade.handleExport;
                e.CVExportUpgrade.exportDocx = T, e.CVExportUpgrade.docxAvailable = b, e.CVExportUpgrade.handleExport = function(e) {
                    return "docx" === e ? T() : t ? t.apply(this, arguments) : void 0;
                }, e.CVExportUpgrade.__docxReady = !0;
            }
        }(), t.querySelectorAll('[data-cv-export="pdf"]').forEach(function(e) {
            n(e, copy.designed);
        }), t.querySelectorAll('[data-cv-export="ats-pdf"]').forEach(function(e) {
            n(e, copy.ats);
        }), t.querySelectorAll('[data-cv-export="text"]').forEach(function(e) {
            n(e, "TXT");
        }), t.querySelectorAll('[data-cv-export="json"]').forEach(function(e) {
            n(e, copy.backup);
        }), t.querySelectorAll(".cv-export-actions").forEach(function(e) {
            if (!e.querySelector('[data-cv-export="docx"]')) {
                var n = e.querySelector('[data-cv-export="json"]'), r = t.createElement("button");
                r.type = "button", r.className = "cv-export-btn", r.dataset.cvExport = "docx", r.textContent = "DOCX",
                e.insertBefore(r, n || null);
            }
            e.querySelectorAll('[data-cv-export="docx"]').forEach(function(e) {
                var t = b(), n = t ? copy.editable : copy.unavailable;
                e.disabled !== !t && (e.disabled = !t), e.getAttribute("aria-disabled") !== (t ? "false" : "true") && e.setAttribute("aria-disabled", t ? "false" : "true"),
                e.title !== n && (e.title = n);
            });
        });
    }
    function E() {
        P(), setTimeout(P, 500);
        try {
            new MutationObserver(P).observe(t.documentElement, {
                childList: !0,
                subtree: !0
            });
        } catch (e) {}
    }
    t.addEventListener("click", function(e) {
        e.target.closest && e.target.closest('[data-cv-export="docx"]') && (e.preventDefault(),
        e.stopImmediatePropagation(), T());
    }, !0), e.CVDocxExport = {
        isAvailable: b,
        buildBlob: C,
        exportDocx: T,
        enhanceExportPanel: P
    }, "loading" === t.readyState ? t.addEventListener("DOMContentLoaded", E) : E();
}(window, document);
