"use strict";

!function(e) {
    var i = e.CVTemplates = typeof CVTemplates !== "undefined" ? CVTemplates : (e.CVTemplates || {});
    var nativeLabels={"Profile": {"fr": "Profil", "sw": "Wasifu"}, "Summary": {"fr": "Résumé", "sw": "Muhtasari"}, "Professional Summary": {"fr": "Profil professionnel", "sw": "Muhtasari wa kitaaluma"}, "Professional Statement": {"fr": "Présentation professionnelle", "sw": "Maelezo ya kitaaluma"}, "Experience": {"fr": "Expérience", "sw": "Uzoefu"}, "Work Experience": {"fr": "Expérience professionnelle", "sw": "Uzoefu wa kazi"}, "Work History": {"fr": "Parcours professionnel", "sw": "Historia ya kazi"}, "Education": {"fr": "Formation", "sw": "Elimu"}, "Skills": {"fr": "Compétences", "sw": "Ujuzi"}, "Core Skills": {"fr": "Compétences clés", "sw": "Ujuzi mkuu"}, "Projects": {"fr": "Projets", "sw": "Miradi"}, "Certifications": {"fr": "Certifications", "sw": "Vyeti"}, "Languages": {"fr": "Langues", "sw": "Lugha"}, "References": {"fr": "Références", "sw": "Wadhamini"}, "Present": {"fr": "En cours", "sw": "Sasa"}, "Your Name": {"fr": "Votre nom", "sw": "Jina lako"}, "Target role": {"fr": "Poste visé", "sw": "Nafasi unayolenga"}, "Role": {"fr": "Poste", "sw": "Nafasi"}, "Qualification": {"fr": "Diplôme", "sw": "Sifa ya elimu"}, "Project": {"fr": "Projet", "sw": "Mradi"}, "Certification": {"fr": "Certification", "sw": "Cheti"}, "Academic Objective": {"fr": "Objectif universitaire", "sw": "Lengo la kitaaluma"}, "Academic Profile": {"fr": "Profil universitaire", "sw": "Wasifu wa masomo"}, "Appointment": {"fr": "Fonction", "sw": "Wadhifa"}, "Awards / Certifications": {"fr": "Distinctions et certifications", "sw": "Tuzo na vyeti"}, "Builds / Repositories": {"fr": "Réalisations et dépôts de code", "sw": "Programu na hifadhi za msimbo"}, "Business Profile": {"fr": "Profil professionnel", "sw": "Wasifu wa biashara"}, "Career Profile": {"fr": "Profil professionnel", "sw": "Wasifu wa kazi"}, "Clinical Experience": {"fr": "Expérience clinique", "sw": "Uzoefu wa kliniki"}, "Clinical Profile": {"fr": "Profil clinique", "sw": "Wasifu wa kliniki"}, "Consulting Profile": {"fr": "Profil de conseil", "sw": "Wasifu wa ushauri"}, "Creative Profile": {"fr": "Profil créatif", "sw": "Wasifu wa ubunifu"}, "Curriculum / Activities": {"fr": "Programmes et activités pédagogiques", "sw": "Mitaala na shughuli"}, "Customer Experience": {"fr": "Expérience du service client", "sw": "Uzoefu wa huduma kwa wateja"}, "Developer Summary": {"fr": "Profil de développement logiciel", "sw": "Muhtasari wa utengenezaji programu"}, "Driving and Logistics Experience": {"fr": "Expérience de conduite et logistique", "sw": "Uzoefu wa udereva na usafirishaji"}, "Executive Profile": {"fr": "Profil de direction", "sw": "Wasifu wa uongozi"}, "Finance / Admin Profile": {"fr": "Profil financier et administratif", "sw": "Wasifu wa fedha na utawala"}, "Finance and Administration Experience": {"fr": "Expérience financière et administrative", "sw": "Uzoefu wa fedha na utawala"}, "Graduate Profile": {"fr": "Profil de jeune diplômé", "sw": "Wasifu wa mhitimu"}, "Guest Service Profile": {"fr": "Profil du service aux clients", "sw": "Wasifu wa huduma kwa wageni"}, "Hospitality Experience": {"fr": "Expérience dans l’hôtellerie", "sw": "Uzoefu wa ukarimu"}, "Impact Summary": {"fr": "Bilan des résultats", "sw": "Muhtasari wa matokeo"}, "Indicators / Evaluation Projects": {"fr": "Indicateurs et projets d’évaluation", "sw": "Viashiria na miradi ya tathmini"}, "International Profile": {"fr": "Profil international", "sw": "Wasifu wa kimataifa"}, "Leadership Experience": {"fr": "Expérience de direction", "sw": "Uzoefu wa uongozi"}, "Logistics Profile": {"fr": "Profil logistique", "sw": "Wasifu wa usafirishaji"}, "Monitoring and Evaluation Experience": {"fr": "Expérience de suivi et évaluation", "sw": "Uzoefu wa ufuatiliaji na tathmini"}, "Portfolio Projects": {"fr": "Projets du portfolio", "sw": "Miradi ya kuonyesha kazi"}, "Projects / Grants": {"fr": "Projets et subventions", "sw": "Miradi na ruzuku"}, "Projects / Sites": {"fr": "Projets et chantiers", "sw": "Miradi na maeneo ya kazi"}, "Remote Work Profile": {"fr": "Profil de travail à distance", "sw": "Wasifu wa kazi za mbali"}, "Research / Projects": {"fr": "Recherche et projets", "sw": "Utafiti na miradi"}, "Sales Profile": {"fr": "Profil commercial", "sw": "Wasifu wa mauzo"}, "Sales and Retail Experience": {"fr": "Expérience commerciale et de vente", "sw": "Uzoefu wa mauzo na rejareja"}, "Selected Engagements": {"fr": "Missions sélectionnées", "sw": "Kazi zilizochaguliwa"}, "Site Experience": {"fr": "Expérience sur chantier", "sw": "Uzoefu wa eneo la kazi"}, "Site and HSE Profile": {"fr": "Profil chantier, hygiène et sécurité", "sw": "Wasifu wa eneo la kazi, afya na usalama"}, "Support Profile": {"fr": "Profil d’assistance", "sw": "Wasifu wa usaidizi"}, "Teaching Experience": {"fr": "Expérience pédagogique", "sw": "Uzoefu wa kufundisha"}, "Teaching Profile": {"fr": "Profil pédagogique", "sw": "Wasifu wa mwalimu"}, "Technical Experience": {"fr": "Expérience technique", "sw": "Uzoefu wa kiufundi"}, "Technical Profile": {"fr": "Profil technique", "sw": "Wasifu wa kiufundi"}, "Technical Projects": {"fr": "Projets techniques", "sw": "Miradi ya kiufundi"}, "Technical Summary": {"fr": "Profil technique", "sw": "Muhtasari wa kiufundi"}, "Trade Profile": {"fr": "Profil de métier", "sw": "Wasifu wa ufundi"}, "Trade role": {"fr": "Métier", "sw": "Kazi ya ufundi"}, "Competences": {"fr": "Compétences", "sw": "Ujuzi"}, "Formation": {"fr": "Formation", "sw": "Elimu"}, "Experience professionnelle": {"fr": "Expérience", "sw": "Uzoefu"}, "Projets": {"fr": "Projets", "sw": "Miradi"}, "Profil professionnel": {"fr": "Profil professionnel", "sw": "Muhtasari wa kitaaluma"}, "Profil / Resume bilingue": {"fr": "Profil professionnel", "sw": "Muhtasari wa kitaaluma"}, "Profile / Arabic-ready summary": {"fr": "Profil professionnel", "sw": "Muhtasari wa kitaaluma"}};
    nativeLabels["Professional CV"]={fr:"CV professionnel",sw:"Wasifu wa kitaaluma"};
    nativeLabels["Programme Experience"]={fr:"Expérience des programmes",sw:"Uzoefu wa programu"};
    function label(value){var lang=String(e.document && e.document.documentElement.lang || "en").split("-")[0];return nativeLabels[value] && nativeLabels[value][lang] || value;}
    function t(i) {
        return e.CVApp && "function" == typeof e.CVApp.esc ? e.CVApp.esc(i || "") : String(i || "").replace(/[&<>"']/g, function(e) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[e];
        });
    }
    // Project the actual saved form schema before any layout consumes it.
    function r(value) {
        var source = value && value.data ? value.data : value || {};
        var model = e.CVDocumentModel.normalize(source);
        return Object.assign({},source,{
            __model:model,
            projects:model.projects.map(function(p){return Object.assign({},p,{name:p.n,desc:p.d});}),
            certs:model.certs.map(function(p){return Object.assign({},p,{name:p.n,issuer:p.i,year:p.y});}),
            languages:model.languages.map(function(p){return {name:p.l,level:p.lv};}),
            refs:model.refs.map(function(p){return {name:p.n,level:[p.t,p.org,p.e,p.p,p.rel].filter(Boolean).join(" | ")};})
        });
    }
    function c(e) {
        return Array.isArray(e) ? e.filter(Boolean) : [];
    }
    function n(e, i) {
        return e.filter(function(e) {
            return String(e || "").trim();
        }).join(i || " | ");
    }
    function a(e) {
        return n([ e.s || e.start || e.from, e.cur ? label("Present") : (e.e || e.end || e.to || "") ], " - ");
    }
    function o(e) {
        return e ? "string" == typeof e ? e : n([ e.h, e.s, e.t, e.lang, e.tools ], ", ") : "";
    }
    function l(e, i, r) {
        return i ? '<section class="cvx-section" data-cv-section="' + t(r || "") + '"><h2>' + t(label(e)) + "</h2>" + i + "</section>" : "";
    }
    function s(e) {
        return String(e || "").split(/[,;]+/).map(function(e) {
            return e.trim();
        }).filter(Boolean).map(function(e) {
            return "<span>" + t(e) + "</span>";
        }).join("");
    }
    function p(e, i) {
        return c(e).map(function(e) {
            var r, c, o = (r = e.d || e.desc || e.description, (c = String(r || "").trim()) ? c.split(/\n+/).filter(Boolean).map(function(e) {
                return "<li>" + t(e.replace(/^[*-]\s*/, "")) + "</li>";
            }).join("") : "");
            return [ '<article class="cvx-item">', '<div class="cvx-row"><strong>' + t(e.t || e.title || label(i || "Role")) + "</strong><span>" + t(a(e)) + "</span></div>", '<div class="cvx-muted">' + t(n([ e.c || e.company || e.org, e.l || e.loc || e.location ], " - ")) + "</div>", o ? "<ul>" + o + "</ul>" : "", "</article>" ].join("");
        }).join("");
    }
    function d(e) {
        return c(e).map(function(e) {
            return [ '<article class="cvx-item compact">', '<div class="cvx-row"><strong>' + t(e.deg || e.degree || e.t || label("Qualification")) + "</strong><span>" + t(n([e.y1,e.y2]," - ")) + "</span></div>", '<div class="cvx-muted">' + t(n([ e.sch || e.school || e.c, e.loc || e.l || e.location,e.g ], " - ")) + "</div>", e.d ? "<p>" + t(e.d) + "</p>" : "", "</article>" ].join("");
        }).join("");
    }
    function f(e) {
        return c(e).map(function(e) {
            return '<article class="cvx-item compact"><strong>' + t(e.name || e.t || label("Project")) + "</strong><p>" + t(n([e.tech,e.url,e.desc || e.d]," | ")) + "</p></article>";
        }).join("");
    }
    function u(e) {
        return c(e).map(function(e) {
            return '<article class="cvx-item compact"><strong>' + t(e.name || e.t || label("Certification")) + "</strong><p>" + t(n([ e.issuer || e.c, e.year || e.s ], " - ")) + "</p></article>";
        }).join("");
    }
    function x(e) {
        return c(e).map(function(e) {
            return "<p>" + t("string" == typeof e ? e : n([ e.name || e.t, e.level || e.note ], " - ")) + "</p>";
        }).join("");
    }
    function v(e) {
        return e.summary ? "<p>" + t(e.summary) + "</p>" : "";
    }
    function g(e) {
        return '<div class="cvx-contact">' + e.__model.contact.join(" | ") + "</div>";
    }
    function m(e, i) {
        return [ "cv-expanded-template", "cvx-" + e, i && i.rtl ? "cvx-rtl" : "", i && i.lessAts ? "cvx-less-ats" : "" ].filter(Boolean).join(" ");
    }
    function b(e, i) {
        return [ "width:595px;min-height:841px;box-sizing:border-box;background:#fff;color:#111827;", "font-family:'DM Sans',Arial,sans-serif;font-size:9.8px;line-height:1.42;", "padding:34px;overflow:visible;overflow-wrap:anywhere;word-break:normal;", "--cvx-accent:" + (e || "#0b63ce") + ";--cvx-second:" + (i && i.secondary ? i.secondary : "#0f172a") + ";", i && i.border ? "border-top:8px solid var(--cvx-accent);" : "", i && i.rtl ? "direction:rtl;text-align:right;" : "" ].join("");
    }
    function h() {
        return [ "<style>", ".cv-expanded-template *{box-sizing:border-box}.cv-expanded-template h1{margin:0;color:#0b1220;font-size:25px;line-height:1.05;font-weight:950;letter-spacing:0;overflow-wrap:anywhere}.cv-expanded-template h2{margin:0 0 6px;color:#0b1220;font-size:10px;line-height:1.1;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.cv-expanded-template p{margin:0 0 5px}.cv-expanded-template ul{margin:5px 0 0 15px;padding:0}.cv-expanded-template li{margin:0 0 3px;padding-left:2px}.cvx-contact,.cvx-muted{color:#4b5563;font-size:8.8px;line-height:1.35;overflow-wrap:anywhere}.cvx-role{margin-top:4px;color:var(--cvx-accent);font-size:11px;font-weight:900}.cvx-section{break-inside:avoid;margin-top:13px}.cvx-item{break-inside:avoid;margin-top:8px}.cvx-item:first-child{margin-top:0}.cvx-item.compact{margin-top:6px}.cvx-row{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.cvx-row strong{font-size:10px}.cvx-row span{flex:0 0 auto;color:#64748b;font-size:8.2px}.cvx-chips{display:flex;flex-wrap:wrap;gap:5px}.cvx-chips span{color:#0b1220;padding:3px 6px;border:1px solid #d9e2ec;border-radius:5px;background:#f8fafc;font-size:8.5px;font-weight:800}.cvx-header-line{height:2px;margin:12px 0;background:var(--cvx-accent)}.cvx-main-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,.85fr)!important;gap:20px;align-items:start}.cvx-sidebar-grid{display:grid;grid-template-columns:minmax(0,.78fr) minmax(0,1.35fr)!important;gap:20px;align-items:start}.cvx-sidebar{padding:16px;border-radius:8px;background:#f4f7fb}.cvx-sidebar.dark{background:#0f172a;color:#fff}.cvx-sidebar.dark h2,.cvx-sidebar.dark h1{color:#fff}.cvx-sidebar.dark .cvx-muted,.cvx-sidebar.dark .cvx-contact{color:#dbe4ef}.cvx-accent-block{padding:14px 16px;background:var(--cvx-accent);color:#fff;border-radius:8px}.cvx-accent-block h1,.cvx-accent-block .cvx-role,.cvx-accent-block .cvx-contact{color:#fff}.cvx-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;margin-top:12px}.cvx-strip span{padding:7px;border:1px solid #dbe4ef;border-radius:7px;font-weight:850;color:#334155}.cvx-formal h1{font-size:23px}.cvx-formal .cvx-header-line{height:1px;background:#111827}.cvx-impact .cvx-section h2{color:#166534}.cvx-academic h1{font-size:24px}.cvx-academic .cvx-section{border-top:1px solid #dbe4ef;padding-top:9px}.cvx-creative{padding-left:54px;position:relative}.cvx-creative:before{content:'';position:absolute;left:0;top:0;bottom:0;width:30px;background:var(--cvx-accent)}.cvx-less-ats .cvx-contact:after{content:' Less ATS-safe';display:inline-block;margin-left:6px;padding:1px 5px;border-radius:999px;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;font-weight:900}.cvx-rtl .cvx-row{flex-direction:row-reverse}.cvx-rtl ul{margin:5px 15px 0 0}", "</style>" ].join("");
    }
    function T(e, i) {
        i = i || {};
        var t = o(e.skills);
        return [ l(i.profileTitle || "Profile", v(e), "summary"), l(i.experienceTitle || "Experience", p(e.exps || e.experience, i.roleLabel), "experience"), l(i.educationTitle || "Education", d(e.edus || e.education), "education"), l(i.skillsTitle || "Skills", t ? '<div class="cvx-chips">' + s(t) + "</div>" : "", "skills"), l(i.projectsTitle || "Projects", f(e.projects), "projects"), l(i.certsTitle || "Certifications", u(e.certs || e.certifications), "certifications"), l("Languages", x(e.languages), "languages"), l("References", x(e.refs || e.references), "references") ].join("");
    }
    function j(e, i) {
        return [ e.showPhoto && e.photo ? '<img src="'+t(e.photo)+'" alt="" style="width:64px;height:64px;object-fit:cover">' : "", i && i.badge ? '<div class="cvx-muted" style="font-weight:950;text-transform:uppercase;letter-spacing:.08em;color:var(--cvx-accent)">' + t(i.badge) + "</div>" : "", "<h1>" + t(n([ e.fn, e.ln ], " ") || e.name || label("Your Name")) + "</h1>", '<div class="cvx-role">' + t(e.title || label(i.role || "Target role")) + "</div>", g(e) ].join("");
    }
    function y(e, i) {
        var t = r(e);
        return '<article class="' + m("text", i = i || {}) + '" data-layout="text-first" style="' + b(i.accent, i) + '">' + h() + j(t, i) + '<div class="cvx-header-line"></div>' + T(t, i) + "</article>";
    }
    function k(e, i) {
        var t = r(e);
        i = i || {};
        var c = [ l("Core Skills", o(t.skills) ? '<div class="cvx-chips">' + s(o(t.skills)) + "</div>" : "", "skills"), l("Education", d(t.edus || t.education), "education"), l("Certifications", u(t.certs || t.certifications), "certifications"), l("Languages", x(t.languages), "languages") ].join(""), n = [ l(i.profileTitle || "Profile", v(t), "summary"), l(i.experienceTitle || "Experience", p(t.exps || t.experience, i.roleLabel), "experience"), l(i.projectsTitle || "Projects", f(t.projects), "projects"), l("Languages",x(t.languages), "languages"), l("References", x(t.refs || t.references), "references") ].join("");
        return '<article class="' + m("split", i) + '" data-layout="two-column" style="' + b(i.accent, i) + '">' + h() + j(t, i) + '<div class="cvx-header-line"></div><div class="cvx-main-grid"><main>' + n + "</main><aside>" + c + "</aside></div></article>";
    }
    function P(e, i) {
        var t = r(e), c = '<aside class="cvx-sidebar ' + ((i = i || {}).dark ? "dark" : "") + '">' + j(t, i) + l("Skills", o(t.skills) ? '<div class="cvx-chips">' + s(o(t.skills)) + "</div>" : "", "skills") + l("Education", d(t.edus || t.education), "education") + l("Languages", x(t.languages), "languages") + "</aside>", n = "<main>" + l(i.profileTitle || "Profile", v(t), "summary") + l(i.experienceTitle || "Experience", p(t.exps || t.experience, i.roleLabel), "experience") + l(i.projectsTitle || "Projects", f(t.projects), "projects") + l(i.certsTitle || "Certifications", u(t.certs || t.certifications), "certifications") + l("References", x(t.refs || t.references), "references") + "</main>";
        return '<article class="' + m("sidebar", i) + '" data-layout="sidebar" style="' + b(i.accent, i) + '">' + h() + '<div class="cvx-sidebar-grid">' + c + n + "</div></article>";
    }
    function w(e, i) {
        return (i = i || {}).border = !0, y(e, Object.assign({
            profileTitle: "Professional Statement",
            roleLabel: "Appointment"
        }, i));
    }
    function C(e, i) {
        var t = r(e);
        return '<article class="' + m("academic", i = i || {}) + '" data-layout="academic" style="' + b(i.accent, i) + '">' + h() + j(t, i) + '<div class="cvx-header-line"></div>' + [ l("Academic Profile", v(t), "summary"), l("Education", d(t.edus || t.education), "education"), l("Research / Projects", f(t.projects), "projects"), l("Experience", p(t.exps || t.experience), "experience"), l("Awards / Certifications", u(t.certs || t.certifications), "certifications"), l("Skills", o(t.skills) ? '<div class="cvx-chips">' + s(o(t.skills)) + "</div>" : "", "skills"), l("Languages",x(t.languages), "languages"), l("References", x(t.refs || t.references), "references") ].join("") + "</article>";
    }
    function S(e, i) {
        var t = r(e);
        return '<article class="' + m("impact", i = i || {}) + '" data-layout="impact" style="' + b(i.accent || "#15803d", i) + '">' + h() + '<div class="cvx-accent-block">' + j(t, i) + '</div>' + T(t, Object.assign({
            profileTitle: "Impact Summary",
            experienceTitle: i.experienceTitle || "Programme Experience",
            projectsTitle: "Projects / Grants"
        }, i)) + "</article>";
    }
    function E(e, i) {
        return i = i || {}, k(e, Object.assign({
            profileTitle: "Trade Profile",
            experienceTitle: "Work History",
            projectsTitle: "Projects / Sites",
            roleLabel: "Trade role"
        }, i));
    }
    var A = {
        panAfricanMinimal: function(e) {
            return y(e, {
                accent: "#087f5b",
                badge: "Pan-African Minimal",
                role: "Professional CV"
            });
        },
        atsPlain: function(e) {
            return y(e, {
                accent: "#111827",
                badge: "ATS Plain",
                profileTitle: "Summary",
                experienceTitle: "Work Experience"
            });
        },
        globalCompact: function(e) {
            return y(e, {
                accent: "#334155",
                badge: "Global Compact",
                profileTitle: "Professional Summary"
            });
        },
        lagosCorporate: function(e) {
            return k(e, {
                accent: "#0b63ce",
                badge: "Lagos Corporate",
                profileTitle: "Business Profile"
            });
        },
        nairobiTech: function(e) {
            return P(e, {
                accent: "#2563eb",
                badge: "Nairobi Tech",
                profileTitle: "Technical Summary",
                projectsTitle: "Technical Projects"
            });
        },
        accraGraduate: function(e) {
            return C(e, {
                accent: "#0062cc",
                badge: "Accra Graduate",
                profileTitle: "Graduate Profile"
            });
        },
        capeTownModern: function(e) {
            return k(e, {
                accent: "#0f766e",
                badge: "Cape Town Modern",
                profileTitle: "Career Profile"
            });
        },
        abujaGovernment: function(e) {
            return w(e, {
                accent: "#14532d",
                badge: "Abuja Government"
            });
        },
        kigaliDeveloper: function(e) {
            return P(e, {
                accent: "#1d4ed8",
                badge: "Kigali Developer",
                profileTitle: "Developer Summary",
                projectsTitle: "Builds / Repositories",
                dark: !0
            });
        },
        cairoBilingual: function(e) {
            return k(e, {
                accent: "#7c2d12",
                badge: "Cairo Bilingual",
                profileTitle: "Profile / Arabic-ready summary"
            });
        },
        francophoneStandard: function(e) {
            return y(e, {
                accent: "#1e40af",
                badge: "Francophone Standard",
                profileTitle: "Profil professionnel",
                experienceTitle: "Experience professionnelle",
                educationTitle: "Formation",
                skillsTitle: "Competences"
            });
        },
        moroccoFrenchArabic: function(e) {
            return P(e, {
                accent: "#991b1b",
                badge: "Morocco French-Arabic",
                profileTitle: "Profil / Resume bilingue",
                projectsTitle: "Projets",
                rtl: !1
            });
        },
        boardroomExecutive: function(e) {
            return w(e, {
                accent: "#0f172a",
                badge: "Boardroom Executive",
                profileTitle: "Executive Profile",
                experienceTitle: "Leadership Experience"
            });
        },
        ngoImpact: function(e) {
            return S(e, {
                accent: "#15803d",
                badge: "NGO Impact"
            });
        },
        meOfficer: function(e) {
            return S(e, {
                accent: "#047857",
                badge: "M&E Officer",
                experienceTitle: "Monitoring and Evaluation Experience",
                projectsTitle: "Indicators / Evaluation Projects"
            });
        },
        teacherEducation: function(e) {
            return k(e, {
                accent: "#0369a1",
                badge: "Teacher / Education",
                profileTitle: "Teaching Profile",
                experienceTitle: "Teaching Experience",
                projectsTitle: "Curriculum / Activities"
            });
        },
        healthcareClinical: function(e) {
            return w(e, {
                accent: "#0f766e",
                badge: "Healthcare Clinical",
                profileTitle: "Clinical Profile",
                experienceTitle: "Clinical Experience"
            });
        },
        financeAdmin: function(e) {
            return k(e, {
                accent: "#1e3a8a",
                badge: "Finance & Admin",
                profileTitle: "Finance / Admin Profile",
                experienceTitle: "Finance and Administration Experience"
            });
        },
        salesRetail: function(e) {
            return k(e, {
                accent: "#c2410c",
                badge: "Sales / Retail",
                profileTitle: "Sales Profile",
                experienceTitle: "Sales and Retail Experience"
            });
        },
        customerSupport: function(e) {
            return k(e, {
                accent: "#0891b2",
                badge: "Customer Support",
                profileTitle: "Support Profile",
                experienceTitle: "Customer Experience"
            });
        },
        hospitality: function(e) {
            return P(e, {
                accent: "#92400e",
                badge: "Hospitality",
                profileTitle: "Guest Service Profile",
                experienceTitle: "Hospitality Experience"
            });
        },
        tradeSkills: function(e) {
            return E(e, {
                accent: "#475569",
                badge: "Trade Skills"
            });
        },
        driverLogistics: function(e) {
            return E(e, {
                accent: "#1f2937",
                badge: "Driver / Logistics",
                profileTitle: "Logistics Profile",
                experienceTitle: "Driving and Logistics Experience"
            });
        },
        constructionHse: function(e) {
            return E(e, {
                accent: "#b45309",
                badge: "Construction / HSE",
                profileTitle: "Site and HSE Profile",
                experienceTitle: "Site Experience"
            });
        },
        oilGasTechnical: function(e) {
            return P(e, {
                accent: "#334155",
                badge: "Oil & Gas Technical",
                profileTitle: "Technical Profile",
                experienceTitle: "Technical Experience",
                dark: !0
            });
        },
        remoteAssistant: function(e) {
            return y(e, {
                accent: "#2563eb",
                badge: "Remote Assistant",
                profileTitle: "Remote Work Profile"
            });
        },
        scholarshipAcademic: function(e) {
            return C(e, {
                accent: "#4f46e5",
                badge: "Scholarship / Academic CV",
                profileTitle: "Academic Objective"
            });
        },
        creativePortfolio: function(e) {
            return i = {
                accent: "#be123c",
                badge: "Creative Portfolio"
            }, k(e, i = Object.assign({
                lessAts: !0,
                profileTitle: "Creative Profile",
                projectsTitle: "Portfolio Projects"
            }, i || {})).replace("cvx-split", "cvx-creative").replace('data-layout="two-column"', 'data-layout="creative"');
            var i;
        },
        founderConsultant: function(e) {
            return w(e, {
                accent: "#111827",
                badge: "Founder / Consultant",
                profileTitle: "Consulting Profile",
                experienceTitle: "Selected Engagements"
            });
        },
        diasporaRelocation: function(e) {
            return y(e, {
                accent: "#0f766e",
                badge: "Diaspora Relocation",
                profileTitle: "International Profile"
            });
        }
    };
    Object.keys(A).forEach(function(key) {
        if (typeof i[key] === "function") return;
        i[key] = function(data,country,accent){
            var source=Object.assign({},data||{});
            var metadata=e.CVTemplateRegistry && e.CVTemplateRegistry.all().find(function(row){return row.rendererId===key;});
            if(metadata && !metadata.photoSupport)source.showPhoto=false;
            if(key==='diasporaRelocation')source.sp=false;
            var html=A[key](source);if(/^#[0-9a-f]{3,8}$/i.test(String(accent||"")))html=html.replace(/--cvx-accent:[^;]+;/,"--cvx-accent:"+accent+";");var model=e.CVDocumentModel.normalize(source);
            var tail=e.CVDocumentModel.renderSensitive(model)+e.CVDocumentModel.renderExtras(model);
            var end=html.lastIndexOf('</article>');
            return html.slice(0,end)+tail+html.slice(end);
        };
    });
    var R = {
        "pan-african-minimal": "panAfricanMinimal",
        "ats-plain": "atsPlain",
        "global-compact": "globalCompact",
        "lagos-corporate": "lagosCorporate",
        "nairobi-tech": "nairobiTech",
        "accra-graduate": "accraGraduate",
        "cape-town-modern": "capeTownModern",
        "abuja-government": "abujaGovernment",
        "kigali-developer": "kigaliDeveloper",
        "cairo-bilingual": "cairoBilingual",
        "francophone-standard": "francophoneStandard",
        "morocco-french-arabic": "moroccoFrenchArabic",
        "boardroom-executive": "boardroomExecutive",
        "ngo-impact": "ngoImpact",
        "me-officer": "meOfficer",
        "teacher-education": "teacherEducation",
        "healthcare-clinical": "healthcareClinical",
        "finance-admin": "financeAdmin",
        "sales-retail": "salesRetail",
        "customer-support": "customerSupport",
        hospitality: "hospitality",
        "trade-skills": "tradeSkills",
        "driver-logistics": "driverLogistics",
        "construction-hse": "constructionHse",
        "oil-gas-technical": "oilGasTechnical",
        "remote-assistant": "remoteAssistant",
        "scholarship-academic": "scholarshipAcademic",
        "creative-portfolio": "creativePortfolio",
        "founder-consultant": "founderConsultant",
        "diaspora-relocation": "diasporaRelocation"
    };
    Object.keys(R).forEach(function(e) {
        if (typeof i[e] !== "function") i[e] = i[R[e]];
    });
}("undefined" != typeof window ? window : globalThis);