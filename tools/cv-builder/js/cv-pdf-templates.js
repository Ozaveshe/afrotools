"use strict";

!function(e) {
    var localeCopy = {
  "en": {
    "section0": "Awards",
    "section1": "Volunteering",
    "section2": "Memberships",
    "section3": "Service",
    "section4": "National Service",
    "section5": "Professional Summary",
    "section6": "Experience",
    "section7": "Education",
    "section8": "Skills",
    "section9": "Projects",
    "section10": "Certifications",
    "section11": "Languages",
    "section12": "References",
    "section13": "Corporate Profile",
    "section14": "Professional Experience",
    "section15": "Business Skills",
    "section16": "Tools",
    "section17": "Country Details",
    "section18": "Technical Summary",
    "section19": "Languages & Tools",
    "section20": "Product Strengths",
    "section21": "Career Objective",
    "section22": "Internships & Experience",
    "section23": "Leadership Experience",
    "section24": "Selected Achievements",
    "section25": "Executive Strengths",
    "section26": "Development Profile",
    "section27": "Programme & Field Experience",
    "section28": "Projects, Grants & Field Work",
    "section29": "Sector Skills",
    "section30": "Technical Skills",
    "section31": "Core Strengths",
    "section32": "Creative Skills",
    "section33": "Details",
    "section34": "Profile",
    "section35": "Portfolio Projects",
    "name": "Your Name",
    "title": "Professional Title",
    "role": "Role",
    "qualification": "Qualification",
    "project": "Project",
    "present": "Present"
  },
  "fr": {
    "section0": "Distinctions",
    "section1": "Bénévolat",
    "section2": "Affiliations",
    "section3": "Service",
    "section4": "Service national",
    "section5": "Profil professionnel",
    "section6": "Expérience",
    "section7": "Formation",
    "section8": "Compétences",
    "section9": "Projets",
    "section10": "Certifications",
    "section11": "Langues",
    "section12": "Références",
    "section13": "Profil professionnel",
    "section14": "Expérience professionnelle",
    "section15": "Compétences professionnelles",
    "section16": "Outils",
    "section17": "Informations nationales",
    "section18": "Profil technique",
    "section19": "Langages et outils",
    "section20": "Compétences produit",
    "section21": "Objectif professionnel",
    "section22": "Stages et expérience",
    "section23": "Expérience de direction",
    "section24": "Réalisations marquantes",
    "section25": "Compétences de direction",
    "section26": "Profil en développement",
    "section27": "Expérience des programmes et du terrain",
    "section28": "Projets, subventions et travail de terrain",
    "section29": "Compétences sectorielles",
    "section30": "Compétences techniques",
    "section31": "Compétences clés",
    "section32": "Compétences créatives",
    "section33": "Informations",
    "section34": "Profil",
    "section35": "Projets du portfolio",
    "name": "Votre nom",
    "title": "Titre professionnel",
    "role": "Poste",
    "qualification": "Diplôme",
    "project": "Projet",
    "present": "Aujourd’hui"
  },
  "sw": {
    "section0": "Tuzo",
    "section1": "Kujitolea",
    "section2": "Uanachama",
    "section3": "Huduma",
    "section4": "Huduma ya taifa",
    "section5": "Muhtasari wa kitaaluma",
    "section6": "Uzoefu",
    "section7": "Elimu",
    "section8": "Ujuzi",
    "section9": "Miradi",
    "section10": "Vyeti",
    "section11": "Lugha",
    "section12": "Wadhamini",
    "section13": "Wasifu wa kitaaluma",
    "section14": "Uzoefu wa kitaaluma",
    "section15": "Ujuzi wa biashara",
    "section16": "Zana",
    "section17": "Taarifa za nchi",
    "section18": "Muhtasari wa kiufundi",
    "section19": "Lugha za programu na zana",
    "section20": "Ujuzi wa bidhaa",
    "section21": "Lengo la kazi",
    "section22": "Mafunzo kazini na uzoefu",
    "section23": "Uzoefu wa uongozi",
    "section24": "Mafanikio yaliyochaguliwa",
    "section25": "Ujuzi wa uongozi",
    "section26": "Wasifu wa maendeleo",
    "section27": "Uzoefu wa programu na kazi za uwandani",
    "section28": "Miradi, ruzuku na kazi za uwandani",
    "section29": "Ujuzi wa sekta",
    "section30": "Ujuzi wa kiufundi",
    "section31": "Ujuzi mkuu",
    "section32": "Ujuzi wa ubunifu",
    "section33": "Taarifa",
    "section34": "Wasifu",
    "section35": "Miradi ya kuonyesha kazi",
    "name": "Jina lako",
    "title": "Cheo cha kitaaluma",
    "role": "Nafasi",
    "qualification": "Sifa ya elimu",
    "project": "Mradi",
    "present": "Sasa"
  }
};
    var copy = localeCopy[String(e.document && e.document.documentElement.lang || "en").split("-")[0]] || localeCopy.en;

    var t = "undefined" != typeof CVTemplates ? CVTemplates : e.CVTemplates || {}, i = e.CVApp || {}, o = i.esc || function(t) {
        var i = e.document ? e.document.createElement("div") : null;
        return i ? (i.textContent = t || "", i.innerHTML) : String(t || "").replace(/[&<>"']/g, function(e) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[e];
        });
    }, n = i.fmtMonth || function(e) {
        return e || "";
    }, r = i.descToHTML || function(e) {
        return e ? "<p>" + o(e).replace(/\n+/g, "<br>") + "</p>" : "";
    }, a = i.toArr || function(e) {
        return e ? String(e).split(/[,;\n]/).map(function(e) {
            return e.trim();
        }).filter(Boolean) : [];
    };
    function s(e) {
        return r(e).replace(/<p>/g, '<p style="margin:0">').replace(/<ul>/g, '<ul style="margin:0;padding-left:12px">').replace(/<li>/g, '<li style="margin:0 0 1px">');
    }
    function l(e) {
        return String(e || "").replace(/\s+/g, " ").trim();
    }
    function c(e) {
        return o(l(e));
    }
    function d(e, t) {
        return (e || []).filter(Boolean);
    }
    function countryLabel(key){var values={"Nationality": ["Nationalité", "Uraia"], "Date of birth": ["Date de naissance", "Tarehe ya kuzaliwa"], "Marital status": ["État civil", "Hali ya ndoa"], "Origin": ["Origine", "Asili"], "LGA": ["Collectivité locale", "Eneo la serikali za mitaa"], "ID": ["Identifiant", "Kitambulisho"], "Licence": ["Permis", "Leseni"], "Gender": ["Genre", "Jinsia"], "Health": ["Santé", "Afya"], "Military service": ["Service militaire", "Huduma ya kijeshi"], "Religion": ["Religion", "Dini"]};var lang=String(e.document && e.document.documentElement.lang || "en").split("-")[0];return (values[key] && values[key][lang==="fr"?0:lang==="sw"?1:2] || key)+": ";}
    function p(e) {
        var t = (e = e || {}).skills || {}, o = a(t.h), n = a(t.s), r = a(t.t), s = l([ e.fn, e.ln ].filter(Boolean).join(" ")) || copy.name, d = l(e.title) || copy.title, p = [ e.email, [ e.phoneCode, e.phone ].filter(Boolean).join(" "), e.altPhone, e.loc, e.linkedin, e.github, e.web, e.portfolio ].map(l).filter(Boolean), g = e.sp ? [ e.nat && countryLabel("Nationality") + e.nat, e.dob && countryLabel("Date of birth") + (i.fmtDOB ? i.fmtDOB(e.dob) : e.dob), e.mar && countryLabel("Marital status") + e.mar, e.so && countryLabel("Origin") + e.so, e.lga && countryLabel("LGA") + e.lga, e.idNumber && countryLabel("ID") + e.idNumber, e.dlStatus && countryLabel("Licence") + e.dlStatus,e.gen && countryLabel("Gender")+e.gen,e.healthStatus && countryLabel("Health")+e.healthStatus,e.milStatus && countryLabel("Military service")+e.milStatus,e.religion && countryLabel("Religion")+e.religion ].filter(Boolean) : [];
        return {
            data: e,
            name: c(s),
            title: c(d),
            contact: p.map(c),
            hard: o,
            soft: n,
            tools: r,
            allSkills: o.concat(n),
            sensitive: g.map(c),
            experience: (e.exps || []).filter(function(e) {
                return [e.t,e.c,e.l,e.s,e.e,e.d].some(l);
            }),
            education: (e.edus || []).filter(function(e) {
                return [e.deg,e.sch,e.loc,e.y1,e.y2,e.g,e.d].some(l);
            }),
            projects: e.showProjs ? (e.projs || []).filter(function(e) {
                return [e.n,e.url,e.tech,e.d].some(l);
            }) : [],
            certs: (e.certs || []).filter(function(e) {
                return [e.n,e.i,e.y,e.t,e.org,e.e,e.p,e.rel].some(l);
            }),
            languages: (e.langs || []).filter(function(e) {
                return [e.l,e.lv].some(l);
            }),
            refs: e.showRefs ? (e.refs || []).filter(function(e) {
                return [e.n,e.i,e.y,e.t,e.org,e.e,e.p,e.rel].some(l);
            }) : [],
            extras: Object.assign({}, e.extras || {}, {hobbies:Array.from(new Set([(e.extras || {}).hobbies,(e.extras || {}).interests].filter(Boolean))).join("\n")}),
            customSections: (e.customSections || []).filter(function(e) {
                return l(e.title || e.content);
            })
        };
    }
    function g(e) {
        return [ "font-family:'DM Sans',Arial,sans-serif", "font-size:9.4px", "line-height:1.32", "color:#111827", "background:#fff", "box-sizing:border-box", "min-height:841px", "width:595px", "position:relative", "overflow:hidden", e || "" ].filter(Boolean).join(";");
    }
    function sectionKind(title) {
        var groups = {summary:[5,13,18,21,24,26,34],experience:[6,14,22,23,27],education:[7],skills:[8,15,16,19,20,25,29,30,31,32],projects:[9,28,35],certifications:[10],languages:[11],references:[12],awards:[0],volunteering:[1],memberships:[2],service:[3,4],country:[17,33]};
        for (var key in groups) if (groups[key].some(function(id){return copy["section"+id]===title;})) return key;
        return ["Interests","Centres d’intérêt","Mapendeleo"].indexOf(title)>=0 ? "interests" : "custom";
    }
    function f(e, t, i) {
        i = i || {};
        return l(t) ? [ '<section class="prod-section" data-cv-section="' + (i.sectionKind || sectionKind(e)) + '" style="margin:0 0 ' + (i.tight ? "6px" : "8px") + ';break-inside:avoid;page-break-inside:avoid">', '<h2 style="margin:0 0 3px;color:' + (i.color || "#111827") + ";font-size:" + (i.size || "8px") + ";font-weight:900;letter-spacing:" + (i.letter || ".08em") + ";text-transform:uppercase;" + (i.rule ? "padding-bottom:3px;border-bottom:" + i.rule : "") + '">' + c(e) + "</h2>", '<div style="color:' + (i.bodyColor || "#334155") + '">' + t + "</div>", "</section>" ].join("") : "";
    }
    function h(e, t) {
        return e ? '<div style="font-size:' + (t || "9.2px") + ';line-height:1.42;color:#263244">' + c(e) + "</div>" : "";
    }
    function x(e, t) {
        return t = t || {}, e.map(function(e) {
            var i = c(e.t || copy.role), o = [ e.c, e.l ].filter(Boolean).map(c).join(" | "), r = c(function(e) {
                return [ n(e.s), e.cur ? copy.present : n(e.e) ].filter(Boolean).join(" - ");
            }(e));
            return [ '<article style="margin:0 0 ' + (t.compact ? "8px" : "10px") + ';break-inside:avoid;page-break-inside:avoid">', '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">', '<div style="font-weight:900;font-size:' + (t.titleSize || "10.3px") + ';color:#111827">' + i + "</div>", r ? '<div style="font-size:8px;color:#64748b;font-weight:800;text-align:right;white-space:nowrap">' + r + "</div>" : "", "</div>", o ? '<div style="font-size:8.8px;color:' + (t.accent || "#475569") + ';font-weight:750;margin:1px 0 3px">' + o + "</div>" : "", e.d ? '<div style="font-size:8.2px;line-height:1.32;color:#334155">' + s(e.d) + "</div>" : "", "</article>" ].join("");
        }).join("");
    }
    function u(e, t) {
        return t = t || {}, e.map(function(e) {
            return [ '<article style="margin:0 0 ' + (t.compact ? "6px" : "8px") + ';break-inside:avoid;page-break-inside:avoid">', '<div style="font-size:9.5px;color:#111827;font-weight:900">' + c(e.deg || copy.qualification) + "</div>", '<div style="font-size:8.6px;color:#475569;font-weight:700">' + [ e.sch, e.loc ].filter(Boolean).map(c).join(" | ") + "</div>", [ e.y1, e.y2, e.g ].filter(Boolean).length ? '<div style="font-size:8px;color:#64748b">' + [ [ e.y1, e.y2 ].filter(Boolean).join(" - "), e.g ].filter(Boolean).map(c).join(" | ") + "</div>" : "", e.d ? '<div style="font-size:8.2px;line-height:1.32;color:#334155;margin-top:3px">' + s(e.d) + "</div>" : "", "</article>" ].join("");
        }).join("");
    }
    function m(e, t) {
        return t = t || {}, e.map(function(e) {
            return [ '<article style="margin:0 0 8px;padding:' + (t.box ? "7px 8px" : "0") + ";border:" + (t.box ? "1px solid #dbe3ef" : "0") + ";border-radius:" + (t.box ? "8px" : "0") + ";background:" + (t.box ? t.bg || "#f8fafc" : "transparent") + ';break-inside:avoid;page-break-inside:avoid">', '<div style="font-size:9.5px;font-weight:900;color:#111827">' + c(e.n || copy.project) + (e.url ? '<span style="font-size:7.5px;font-weight:700;color:' + (t.accent || "#2563eb") + ';margin-left:6px">' + c(e.url) + "</span>" : "") + "</div>", e.tech ? '<div style="font-size:7.8px;color:' + (t.accent || "#2563eb") + ';font-weight:800;margin:2px 0">' + c(e.tech) + "</div>" : "", e.d ? '<div style="font-size:8.7px;color:#334155;line-height:1.4">' + c(e.d) + "</div>" : "", "</article>" ].join("");
        }).join("");
    }
    function v(e) {
        return e.map(function(e) {
            return '<div style="font-size:8.8px;margin-bottom:4px"><strong>' + c(e.n) + "</strong>" + (e.i ? " | " + c(e.i) : "") + (e.y ? " | " + c(e.y) : "") + "</div>";
        }).join("");
    }
    function b(e) {
        return e.map(function(e) {
            return '<div style="display:flex;justify-content:space-between;gap:8px;font-size:8.8px;margin-bottom:3px"><strong>' + c(e.l) + "</strong><span>" + c(e.lv || "") + "</span></div>";
        }).join("");
    }
    function y(e) {
        return e.length ? e.map(function(e) {
            return '<div style="font-size:8.4px;margin-bottom:5px"><strong>' + c(e.n) + "</strong>" + (e.t ? " | " + c(e.t) : "") + (e.org ? ", " + c(e.org) : "") + '<div style="color:#64748b">' + [ e.e, e.p, e.rel ].filter(Boolean).map(c).join(" | ") + "</div></div>";
        }).join("") : '<div style="font-size:8.8px;color:#475569">Available on request.</div>';
    }
    function j(e, t) {
        return d(e, (t = t || {}).limit || 18).map(function(e) {
            return '<span style="display:inline-flex;align-items:center;min-height:' + (t.height || "17px") + ";padding:" + (t.pad || "3px 6px") + ";border-radius:" + (t.radius || "5px") + ";background:" + (t.bg || "#eef6ff") + ";color:" + (t.color || "#1e3a8a") + ";font-size:" + (t.size || "7.8px") + ';font-weight:850;margin:0 4px 4px 0;line-height:1.1">' + c(e) + "</span>";
        }).join("");
    }
    function z(e, t) {
        return d(e, 24).map(c).join(t || " | ");
    }
    function w(e, t) {
        t = t || {};
        var i = e.data, o = [];
        return e.extras.awards && o.push(f(copy.section0, '<div style="font-size:8.2px;line-height:1.32">' + s(e.extras.awards) + "</div>", t)),
        e.extras.volunteer && o.push(f(copy.section1, '<div style="font-size:8.2px;line-height:1.32">' + s(e.extras.volunteer) + "</div>", t)),
        e.extras.hobbies && o.push(f(({fr:"Centres d’intérêt",sw:"Mapendeleo"}[String(window.document && window.document.documentElement.lang || "en").split("-")[0]] || "Interests"), h(e.extras.hobbies), t)),
        e.extras.memberships && o.push(f(copy.section2, '<div style="font-size:8.2px;line-height:1.32">' + s(e.extras.memberships) + "</div>", t)),
        e.customSections.forEach(function(e) {
            o.push(f(e.title || ({fr:"Informations complémentaires",sw:"Maelezo ya ziada"}[String(window.document.documentElement.lang || "en").split("-")[0]] || "Additional"), '<div style="font-size:8.2px;line-height:1.32">' + s(e.content || "") + "</div>", Object.assign({},t,{sectionKind:"custom"})));
        }), i.nyscStatus && o.push(f(copy.section3, '<div style="font-size:8.8px">' + [ i.nyscStatus, i.nyscYear, i.nyscState, i.nyscPPA ].filter(Boolean).map(c).join(" | ") + "</div>", t)),
        (i.nsYear || i.nsOrg) && o.push(f(copy.section4, '<div style="font-size:8.8px">' + [ i.nsYear, i.nsOrg ].filter(Boolean).map(c).join(" | ") + "</div>", t)),
        o.join("");
    }
    // The editor uses the lexical CVTemplates object; the expanded gallery uses
    // window.CVTemplates. Register this reviewed renderer in both owners.
    t.panAfricanMinimal = function(data, country, accent) {
        var model = p(data), rule = "1px solid #cbd5e1";
        return [
            '<article class="cv-prod cv-prod-pan-african-minimal" data-layout="text-first" style="' + g("padding:30px 36px;overflow-wrap:anywhere") + '">',
            '<header style="margin-bottom:14px;padding-bottom:10px;border-bottom:3px solid ' + c(accent || "#087f5b") + '">',
            '<h1 style="margin:0;color:#111827;font-size:25px;line-height:1.15;font-weight:900">' + model.name + '</h1>',
            '<div style="margin-top:5px;color:#334155;font-size:11px;font-weight:800">' + model.title + '</div>',
            model.contact.length ? '<div style="margin-top:8px;color:#475569;font-size:8.8px;line-height:1.5">' + model.contact.join(" | ") + '</div>' : '',
            '</header>',
            f(copy.section5, h(data.summary), {rule:rule}),
            f(copy.section6, x(model.experience), {rule:rule}),
            f(copy.section7, u(model.education), {rule:rule}),
            f(copy.section8, '<div style="font-size:9px;line-height:1.5">' + model.hard.concat(model.soft, model.tools).map(c).join(" | ") + '</div>', {rule:rule}),
            f(copy.section9, m(model.projects), {rule:rule}),
            f(copy.section10, v(model.certs), {rule:rule}),
            f(copy.section11, b(model.languages), {rule:rule}),
            model.sensitive.length ? f(copy.section17, model.sensitive.join(" | "), {rule:rule}) : '',
            w(model, {rule:rule}),
            model.refs.length ? f(copy.section12, y(model.refs), {rule:rule}) : '',
            '</article>'
        ].join('');
    };
    t["pan-african-minimal"] = t.panAfricanMinimal;
    if (e.CVTemplates && e.CVTemplates !== t) {
        e.CVTemplates.panAfricanMinimal = t.panAfricanMinimal;
        e.CVTemplates["pan-african-minimal"] = t.panAfricanMinimal;
    }
    t.atsClassic = function(e, t, i) {
        var o = p(Object.assign({}, e, {
            showPhoto: !1,
            sp: !1
        })), n = "1px solid #111827";
        return [ '<div class="cv-prod cv-prod-ats-classic" style="' + g("padding:28px 38px") + '">', '<header style="text-align:center;margin-bottom:12px;padding-bottom:9px;border-bottom:1.5px solid #111827">', '<h1 style="color:inherit;margin:0;color:#111827;font-size:24px;line-height:1.05;font-weight:900;letter-spacing:.02em;text-transform:uppercase">' + o.name + "</h1>", '<div style="margin-top:4px;color:#334155;font-size:10.5px;font-weight:850">' + o.title + "</div>", o.contact.length ? '<div style="margin-top:7px;color:#475569;font-size:8.8px">' + o.contact.join(" | ") + "</div>" : "", "</header>", f(copy.section5, h(e.summary), {
            rule: n,
            tight: !0
        }), f(copy.section6, x(o.experience, {
            compact: !0
        }), {
            rule: n,
            tight: !0
        }), f(copy.section7, u(o.education, {
            compact: !0
        }), {
            rule: n,
            tight: !0
        }), f(copy.section8, '<div style="font-size:9px;line-height:1.5">' + z(o.hard.concat(o.soft).concat(o.tools), " | ") + "</div>", {
            rule: n,
            tight: !0
        }), f(copy.section9, m(o.projects), {
            rule: n,
            tight: !0
        }), f(copy.section10, v(o.certs), {
            rule: n,
            tight: !0
        }), f(copy.section11, b(o.languages), {
            rule: n,
            tight: !0
        }), w(o, {
            rule: n,
            tight: !0
        }), o.refs.length ? f(copy.section12, y(o.refs), {
            rule: n,
            tight: !0
        }) : "", "</div>" ].join("");
    }, t.lagosCorporate = function(e, t, i) {
        var o = p(e), n = "#0b1f3a", r = i || "#d89b18";
        return [ '<div class="cv-prod cv-prod-lagos" style="' + g("padding:0") + '">', '<header style="background:' + n + ";color:#fff;padding:31px 36px 22px;border-bottom:5px solid " + r + '">', (e.showPhoto && e.photo ? '<img src="'+c(e.photo)+'" alt="" style="float:right;width:64px;height:64px;object-fit:cover;border-radius:8px;margin:0 0 10px 14px">' : '') + '<h1 style="color:inherit;margin:0;font-size:28px;line-height:1.02;font-weight:950;letter-spacing:.01em">' + o.name + "</h1>", '<div style="margin-top:5px;color:#dbeafe;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em">' + o.title + "</div>", o.contact.length ? '<div style="margin-top:12px;color:#dbeafe;font-size:8.7px">' + o.contact.join(" | ") + "</div>" : "", "</header>", '<main style="padding:24px 34px 30px">', f(copy.section13, h(e.summary), {
            color: n,
            rule: "2px solid " + r
        }), '<div style="display:grid;grid-template-columns:1.55fr .85fr;gap:22px">', "<div>", f(copy.section14, x(o.experience, {
            accent: n
        }), {
            color: n
        }), f(copy.section7, u(o.education), {
            color: n
        }), f(copy.section9, m(o.projects, {
            box: !0,
            accent: n
        }), {
            color: n
        }), w(o, {
            color: n
        }), "</div>", '<aside style="border-left:1px solid #dbe3ef;padding-left:17px">', f(copy.section15, j(o.hard.concat(o.soft), {
            bg: "#eff6ff",
            color: n,
            limit: 16
        }), {
            color: n,
            tight: !0
        }), f(copy.section16, '<div style="font-size:8.8px;line-height:1.6">' + z(o.tools, "<br>") + "</div>", {
            color: n,
            tight: !0
        }), f(copy.section10, v(o.certs), {
            color: n,
            tight: !0
        }), f(copy.section11, b(o.languages), {
            color: n,
            tight: !0
        }), o.sensitive.length ? f(copy.section17, '<div style="font-size:8.4px;line-height:1.45">' + o.sensitive.join("<br>") + "</div>", {
            color: n,
            tight: !0
        }) : "", f(copy.section12, y(o.refs), {
            color: n,
            tight: !0
        }), "</aside>", "</div>", "</main>", "</div>" ].join("");
    }, t.nairobiTech = function(e, t, i) {
        var o = p(e), n = i || "#2563eb";
        return [ '<div class="cv-prod cv-prod-nairobi-tech" style="' + g("padding:25px 28px;background:#f8fafc") + '">', '<header style="background:#0f172a;color:#fff;border-radius:13px;padding:18px 20px;margin-bottom:14px">', '<div style="font-family:Consolas,monospace;color:#93c5fd;font-size:7.6px;font-weight:800;text-transform:uppercase;letter-spacing:.12em">candidate.profile</div>', '<h1 style="color:inherit;margin:4px 0 0;font-size:24px;line-height:1.02;font-weight:950">' + o.name + "</h1>", '<div style="margin-top:4px;color:#bfdbfe;font-size:10px;font-weight:900">' + o.title + "</div>", o.contact.length ? '<div style="margin-top:9px;color:#cbd5e1;font-size:8px">' + o.contact.join(" | ") + "</div>" : "", "</header>", '<main style="display:grid;grid-template-columns:1.35fr .78fr;gap:12px">', "<div>", f(copy.section18, h(e.summary, "9.5px"), {
            color: n,
            tight: !0
        }), f(copy.section9, m(o.projects, {
            box: !0,
            bg: "#fff",
            accent: n
        }), {
            color: n,
            tight: !0
        }), f(copy.section6, x(o.experience, {
            compact: !0,
            accent: n
        }), {
            color: n,
            tight: !0
        }), f(copy.section7, u(o.education, {
            compact: !0
        }), {
            color: n,
            tight: !0
        }), "</div>", "<aside>", f(copy.section19, j(o.hard.concat(o.tools), {
            bg: "#dbeafe",
            color: "#1e3a8a",
            limit: 22,
            size: "7.4px",
            pad: "3px 5px"
        }), {
            color: n,
            tight: !0
        }), f(copy.section20, j(o.soft, {
            bg: "#ecfeff",
            color: "#155e75",
            limit: 12,
            size: "7.4px",
            pad: "3px 5px"
        }), {
            color: n,
            tight: !0
        }), f(copy.section10, v(o.certs), {
            color: n,
            tight: !0
        }), f(copy.section11, b(o.languages), {
            color: n,
            tight: !0
        }), (o.sensitive.length ? f(copy.section17,o.sensitive.join(" | ")) : "") + w(o, {
            color: n,
            tight: !0
        }), f(copy.section12, y(o.refs), {
            color: n,
            tight: !0
        }), "</aside>", "</main>", "</div>" ].join("");
    }, t.accraGraduate = function(e, t, i) {
        var o = p(e), n = i || "#b45309";
        return [ '<div class="cv-prod cv-prod-accra-graduate" style="' + g("padding:30px 34px;background:#fffdf7") + '">', '<header style="display:grid;grid-template-columns:1fr auto;gap:16px;align-items:end;margin-bottom:16px;padding-bottom:13px;border-bottom:3px solid ' + n + '">', '<div>' + (e.showPhoto && e.photo ? '<img src="'+c(e.photo)+'" alt="" style="float:right;width:64px;height:64px;object-fit:cover;border-radius:8px;margin-left:12px">' : '') + '<h1 style="color:inherit;margin:0;font-size:26px;line-height:1.02;font-weight:950;color:#1c1007">' + o.name + '</h1><div style="margin-top:5px;color:' + n + ';font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em">' + o.title + "</div></div>", o.contact.length ? '<div style="font-size:8.2px;color:#57402a;text-align:right;max-width:220px">' + o.contact.join("<br>") + "</div>" : "", "</header>", '<main style="display:grid;grid-template-columns:.9fr 1.15fr;gap:18px">', "<aside>", f(copy.section7, u(o.education), {
            color: n,
            tight: !0
        }), f(copy.section8, j(o.hard.concat(o.soft).concat(o.tools), {
            bg: "#fef3c7",
            color: "#78350f",
            limit: 18,
            size: "7.6px"
        }), {
            color: n,
            tight: !0
        }), f(copy.section10, v(o.certs), {
            color: n,
            tight: !0
        }), f(copy.section11, b(o.languages), {
            color: n,
            tight: !0
        }), "</aside>", "<div>", f(copy.section21, h(e.summary), {
            color: n,
            rule: "1px solid #fcd34d"
        }), f(copy.section22, x(o.experience, {
            compact: !0,
            accent: n
        }), {
            color: n,
            tight: !0
        }), f(copy.section9, m(o.projects, {
            box: !0,
            bg: "#fffbeb",
            accent: n
        }), {
            color: n,
            tight: !0
        }), (o.sensitive.length ? f(copy.section17,o.sensitive.join(" | ")) : "") + w(o, {color:n,tight:!0}), f(copy.section12, y(o.refs), {
            color: n,
            tight: !0
        }), "</div>", "</main>", "</div>" ].join("");
    }, t.capeTownExecutive = function(e, t, i) {
        var o = p(Object.assign({}, e, {
            showPhoto: !1
        })), n = "#111827", r = i || "#0f766e";
        return [ '<div class="cv-prod cv-prod-cape-executive" style="' + g("padding:34px 36px") + '">', '<header style="display:grid;grid-template-columns:1.25fr .75fr;gap:24px;align-items:end;margin-bottom:20px">', '<div><h1 style="color:inherit;margin:0;color:' + n + ';font-size:30px;line-height:.98;font-weight:950">' + o.name + '</h1><div style="margin-top:7px;color:' + r + ';font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:.12em">' + o.title + "</div></div>", o.contact.length ? '<div style="font-size:8.5px;color:#475569;text-align:right;line-height:1.55">' + o.contact.join("<br>") + "</div>" : "", "</header>", '<section style="border-top:4px solid ' + n + ';border-bottom:1px solid #d1d5db;padding:14px 0;margin-bottom:17px">', h(e.summary, "12px"), "</section>", '<main style="display:grid;grid-template-columns:1.5fr .82fr;gap:22px">', "<div>", f(copy.section23, x(o.experience, {
            titleSize: "10.6px",
            accent: r
        }), {
            color: n
        }), f(copy.section24, o.extras.awards ? '<div style="font-size:8.2px;line-height:1.32">' + s(o.extras.awards) + "</div>" : m(o.projects, {
            box: !0,
            accent: r
        }), {
            color: n
        }), f(copy.section7, u(o.education), {
            color: n
        }), "</div>", '<aside style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px">', f(copy.section25, j(o.soft.concat(o.hard), {
            bg: "#ecfdf5",
            color: "#14532d",
            limit: 14
        }), {
            color: r,
            tight: !0
        }), f(copy.section16, '<div style="font-size:8.8px;line-height:1.6">' + z(o.tools, "<br>") + "</div>", {
            color: r,
            tight: !0
        }), f(copy.section10, v(o.certs), {
            color: r,
            tight: !0
        }), f(copy.section11, b(o.languages), {
            color: r,
            tight: !0
        }), f(copy.section12, y(o.refs), {
            color: r,
            tight: !0
        }), "</aside>", "</main>", "</div>" ].join("");
    }, t.ngoDevelopment = function(e, t, i) {
        for (var o = p(e), n = i || "#15803d", r = (o.experience.map(function(e) {
            return e.d;
        }).join("\n").match(/\b(?:\d+[%+]?\+?|[0-9,.]+\s?(?:people|students|farmers|households|communities|projects|sites|countries|grants|partners))\b/gi) || []).slice(0, 3); r.length < 3; ) r.push([ "Field delivery", "Stakeholder coordination", "Evidence reporting" ][r.length]);
        return [ '<div class="cv-prod cv-prod-ngo" style="' + g("padding:0;background:#ffffff") + '">', '<header style="background:#0b2e1c;color:#ecfdf5;padding:28px 34px 20px">', '<h1 style="color:inherit;margin:0;font-size:27px;line-height:1.02;font-weight:950">' + o.name + "</h1>", '<div style="margin-top:5px;color:#bbf7d0;font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:.09em">' + o.title + "</div>", o.contact.length ? '<div style="margin-top:10px;color:#d1fae5;font-size:8.5px">' + o.contact.join(" | ") + "</div>" : "", "</header>", '<main style="padding:20px 32px 28px">', '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:15px">' + r.map(function(e) {
            return '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;color:#14532d;font-size:8px;font-weight:900;min-height:42px;padding:8px">' + c(e) + "</div>";
        }).join("") + "</div>", '<div style="display:grid;grid-template-columns:1.25fr .78fr;gap:18px">', "<div>", f(copy.section26, h(e.summary), {
            color: n,
            rule: "1px solid #bbf7d0"
        }), f(copy.section27, x(o.experience, {
            accent: n
        }), {
            color: n
        }), f(copy.section28, m(o.projects, {
            box: !0,
            bg: "#f7fef9",
            accent: n
        }), {
            color: n
        }), w(o, {
            color: n
        }), "</div>", "<aside>", f(copy.section29, j(o.hard.concat(o.soft), {
            bg: "#dcfce7",
            color: "#14532d",
            limit: 16
        }), {
            color: n,
            tight: !0
        }), f(copy.section10, v(o.certs), {
            color: n,
            tight: !0
        }), f(copy.section11, b(o.languages), {
            color: n,
            tight: !0
        }), f(copy.section7, u(o.education, {
            compact: !0
        }), {
            color: n,
            tight: !0
        }), f(copy.section12, y(o.refs), {
            color: n,
            tight: !0
        }), "</aside>", "</div>", "</main>", "</div>" ].join("");
    }, t.diasporaInternational = function(e, t, i) {
        var o = p(Object.assign({}, e, {
            showPhoto: !1,
            sp: !1
        })), n = i || "#2563eb";
        return [ '<div class="cv-prod cv-prod-diaspora" style="' + g("padding:28px 36px") + '">', '<header style="margin-bottom:12px;padding-bottom:9px;border-bottom:2px solid #111827">', '<h1 style="color:inherit;margin:0;font-size:25px;line-height:1.05;font-weight:950;color:#111827">' + o.name + "</h1>", '<div style="margin-top:4px;color:#111827;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.12em">' + o.title + "</div>", o.contact.length ? '<div style="margin-top:8px;color:#475569;font-size:8.6px">' + o.contact.join(" | ") + "</div>" : "", "</header>", f(copy.section5, h(e.summary), {
            color: n,
            tight: !0
        }), f(copy.section14, x(o.experience, {
            compact: !0,
            accent: n
        }), {
            color: n,
            tight: !0
        }), f(copy.section7, u(o.education, {
            compact: !0
        }), {
            color: n,
            tight: !0
        }), '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">', "<div>", f(copy.section30, '<div style="font-size:8.8px;line-height:1.55">' + z(o.hard.concat(o.tools), "<br>") + "</div>", {
            color: n,
            tight: !0
        }), f(copy.section9, m(o.projects, {
            accent: n
        }), {
            color: n,
            tight: !0
        }), "</div>", "<div>", f(copy.section31, '<div style="font-size:8.8px;line-height:1.55">' + z(o.soft, "<br>") + "</div>", {
            color: n,
            tight: !0
        }), f(copy.section10, v(o.certs), {
            color: n,
            tight: !0
        }), f(copy.section11, b(o.languages), {
            color: n,
            tight: !0
        }), "</div>", "</div>", w(o, {
            color: n,
            tight: !0
        }), o.refs.length ? f(copy.section12, y(o.refs), {
            color: n,
            tight: !0
        }) : "", "</div>" ].join("");
    }, t.creativePortfolio = function(e, t, i) {
        var o = p(e), n = i || "#1d4ed8", r = e.showPhoto && e.photo ? '<img src="' + e.photo + '" alt="" style="width:72px;height:72px;object-fit:cover;border-radius:18px;border:3px solid rgba(255,255,255,.2);margin-bottom:14px">' : "";
        return [ '<div class="cv-prod cv-prod-creative" style="' + g("padding:0;display:grid;grid-template-columns:34% 66%") + '">', '<aside style="background:#102033;color:#e2e8f0;min-height:841px;padding:30px 18px">', r, '<h1 style="color:inherit;margin:0;color:#fff;font-size:25px;line-height:1;font-weight:950">' + o.name + "</h1>", '<div style="margin-top:6px;color:#bfdbfe;font-size:9.4px;font-weight:900;text-transform:uppercase;letter-spacing:.08em">' + o.title + "</div>", o.contact.length ? '<div style="margin-top:14px;color:#cbd5e1;font-size:8px;line-height:1.55">' + o.contact.join("<br>") + "</div>" : "", f(copy.section32, j(o.hard.concat(o.soft).concat(o.tools), {
            bg: "rgba(255,255,255,.1)",
            color: "#fff",
            limit: 16,
            size: "7.5px"
        }), {
            color: "#bfdbfe",
            bodyColor: "#cbd5e1",
            tight: !0
        }), f(copy.section11, b(o.languages), {
            color: "#bfdbfe",
            bodyColor: "#cbd5e1",
            tight: !0
        }), o.sensitive.length ? f(copy.section33, '<div style="font-size:8px;line-height:1.45">' + o.sensitive.join("<br>") + "</div>", {
            color: "#bfdbfe",
            bodyColor: "#cbd5e1",
            tight: !0
        }) : "", "</aside>", '<main style="padding:30px 26px">', f(copy.section34, h(e.summary, "10.4px"), {
            color: n,
            rule: "2px solid #dbeafe"
        }), f(copy.section6, x(o.experience, {
            compact: !0,
            accent: n
        }), {
            color: n
        }), f(copy.section35, m(o.projects, {
            box: !0,
            bg: "#f8fafc",
            accent: n
        }), {
            color: n
        }), f(copy.section7, u(o.education, {
            compact: !0
        }), {
            color: n,
            tight: !0
        }), f(copy.section10, v(o.certs), {
            color: n,
            tight: !0
        }), w(o, {
            color: n,
            tight: !0
        }), f(copy.section12, y(o.refs), {
            color: n,
            tight: !0
        }), "</main>", "</div>" ].join("");
    }, t["ats-classic"] = t.atsClassic, t["lagos-corporate"] = t.lagosCorporate, t["nairobi-tech"] = t.nairobiTech;
    // Portable exports follow the same enabled supplemental fields as the document model.
    function portableSections(data, template) {
        data = data || {};
        var model = p(data), sections = [], lang = String(e.document.documentElement.lang || "en").split("-")[0];
        function add(title, value) { if (value && String(value).trim()) sections.push({title:title, text:String(value)}); }
        add(copy.section0, model.extras.awards);
        add(copy.section1, model.extras.volunteer);
        add(({fr:"Centres d’intérêt",sw:"Mapendeleo"}[lang] || "Interests"), model.extras.hobbies);
        add(copy.section2, model.extras.memberships);
        model.customSections.forEach(function(section) { add(section.title || ({fr:"Informations complémentaires",sw:"Maelezo ya ziada"}[lang] || "Additional"), section.content); });
        if (data.nyscStatus) add(copy.section3, [data.nyscStatus,data.nyscYear,data.nyscState,data.nyscPPA].filter(Boolean).join(" | "));
        add(copy.section4, [data.nsYear,data.nsOrg].filter(Boolean).join(" | "));
        if (data.sp && template !== "diaspora-relocation") {
            var fields = [["nat","Nationality"],["dob","Date of birth"],["mar","Marital status"],["so","Origin"],["lga","LGA"],["idNumber","ID"],["dlStatus","Licence"],["gen","Gender"],["healthStatus","Health"],["milStatus","Military service"],["religion","Religion"]];
            add(copy.section17, fields.filter(function(field){return data[field[0]];}).map(function(field){return countryLabel(field[1]) + data[field[0]];}).join(" | "));
        }
        return sections;
    }
    e.CVDocumentModel = {portableSections:portableSections, normalize:p, renderExtras:w, renderSensitive:function(model){return model.sensitive.length ? f(copy.section17,model.sensitive.join(" | ")) : "";}};
    t["accra-graduate"] = t.accraGraduate, t["cape-town-executive"] = t.capeTownExecutive,
    t["ngo-development"] = t.ngoDevelopment, t["diaspora-international"] = t.diasporaInternational,
    t["creative-portfolio"] = t.creativePortfolio, e.CVProductionTemplates = {
        ids: [ "panAfricanMinimal", "atsClassic", "lagosCorporate", "nairobiTech", "accraGraduate", "capeTownExecutive", "ngoDevelopment", "diasporaInternational", "creativePortfolio" ]
    };
}("undefined" != typeof window ? window : globalThis);
