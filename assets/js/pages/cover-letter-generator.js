!function() {
    "use strict";
    var e = "afrotools-cover-letter-current-v2", t = "letter", n = null, r = !1, o = window.SaveState ? new window.SaveState("cover-letter") : null, a = [ {
        id: "technology",
        name: "Technology",
        focus: "shipping reliable digital products",
        opener: "technical delivery, product thinking, and practical problem solving",
        proofHint: "engineering, product, data, cybersecurity, IT support, or cloud work"
    }, {
        id: "finance",
        name: "Finance and Banking",
        focus: "accuracy, trust, compliance, and measurable commercial outcomes",
        opener: "financial analysis, controls, customer trust, and operational discipline",
        proofHint: "banking, fintech, audit, credit, reconciliation, treasury, or risk work"
    }, {
        id: "healthcare",
        name: "Healthcare",
        focus: "patient-centered service, safe operations, and clear communication",
        opener: "clinical awareness, empathy, compliance, and operational follow-through",
        proofHint: "clinical, hospital operations, public health, insurance, or health-tech work"
    }, {
        id: "education",
        name: "Education",
        focus: "learning outcomes, student support, and structured program delivery",
        opener: "teaching, curriculum support, mentoring, and learner engagement",
        proofHint: "school, university, edtech, tutoring, training, or program coordination work"
    }, {
        id: "engineering",
        name: "Engineering and Construction",
        focus: "safe execution, technical judgement, cost control, and site discipline",
        opener: "technical delivery, site coordination, quality control, and safety awareness",
        proofHint: "civil, mechanical, electrical, project, facilities, or construction work"
    }, {
        id: "ngo",
        name: "NGO and Development",
        focus: "community impact, donor accountability, and field execution",
        opener: "program delivery, stakeholder coordination, reporting, and measurable impact",
        proofHint: "development, grant, M&E, field operations, community, or donor work"
    }, {
        id: "government",
        name: "Government and Public Sector",
        focus: "public service, policy execution, compliance, and citizen outcomes",
        opener: "administration, policy support, compliance, and service delivery",
        proofHint: "public administration, policy, procurement, compliance, or records work"
    }, {
        id: "sales",
        name: "Sales and Customer Success",
        focus: "revenue growth, customer trust, and disciplined follow-up",
        opener: "relationship management, pipeline ownership, negotiation, and service recovery",
        proofHint: "sales, account management, support, operations, or customer success work"
    }, {
        id: "creative",
        name: "Creative and Media",
        focus: "clear storytelling, campaign results, and audience understanding",
        opener: "content strategy, design judgement, campaign execution, and audience insight",
        proofHint: "brand, content, design, marketing, media, or creator work"
    }, {
        id: "graduate",
        name: "Graduate or Internship",
        focus: "learning speed, initiative, and evidence of potential",
        opener: "academic projects, internships, volunteer work, and a strong learning curve",
        proofHint: "coursework, internships, volunteer work, campus leadership, or portfolio projects"
    } ], i = [ {
        id: "professional",
        name: "Professional",
        intro: "I am pleased to apply",
        close: "I would welcome the opportunity"
    }, {
        id: "confident",
        name: "Confident",
        intro: "I am excited to apply",
        close: "I am ready to discuss"
    }, {
        id: "warm",
        name: "Warm",
        intro: "I am delighted to apply",
        close: "I would be grateful for the opportunity"
    }, {
        id: "concise",
        name: "Concise",
        intro: "I am applying",
        close: "I would welcome a conversation"
    }, {
        id: "executive",
        name: "Senior or Executive",
        intro: "I am writing to express my interest",
        close: "I would value the opportunity"
    } ], l = [ {
        id: "concise",
        name: "Concise",
        target: "180 to 260 words",
        extra: !1
    }, {
        id: "standard",
        name: "Standard",
        target: "260 to 380 words",
        extra: !0
    }, {
        id: "detailed",
        name: "Detailed",
        target: "380 to 520 words",
        extra: !0
    } ], c = [ "Pan-African", "Nigeria", "Kenya", "Ghana", "South Africa", "Rwanda", "Uganda", "Tanzania", "Ethiopia", "Remote or global role" ], s = [ "templateId", "toneId", "market", "lengthId", "fullName", "email", "phone", "city", "portfolio", "jobTitle", "company", "hiringManager", "source", "jobDescription", "years", "skills", "achievement", "whyCompany", "resumeSummary", "availability", "referral", "contextNote" ], d = {
        and: !0,
        the: !0,
        for: !0,
        with: !0,
        from: !0,
        that: !0,
        this: !0,
        your: !0,
        will: !0,
        have: !0,
        role: !0,
        work: !0,
        team: !0,
        job: !0,
        are: !0,
        you: !0,
        our: !0,
        their: !0,
        candidate: !0,
        experience: !0,
        skills: !0,
        ability: !0,
        across: !0,
        into: !0,
        about: !0,
        more: !0,
        using: !0,
        including: !0,
        responsible: !0,
        responsibilities: !0,
        required: !0,
        preferred: !0,
        years: !0
    };
    function u(e) {
        return document.getElementById(e);
    }
    function p(e) {
        return String(e || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function m(e, t) {
        return (String(e || t || "cover-letter").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || t || "cover-letter").toLowerCase();
    }
    function nativeMessage(message) {
        var locale=String(document.documentElement.lang||"en").split("-")[0], copy={
            "Draft created from your form. You can edit the text directly before exporting.":["Brouillon créé à partir du formulaire. Vous pouvez modifier le texte avant de l’exporter.","Rasimu imeundwa kutoka kwa fomu yako. Unaweza kuhariri maandishi kabla ya kuyahamisha."],
            "Manual edits are preserved. Use Create cover letter only when you want a fresh draft.":["Vos modifications sont conservées. Utilisez Créer une lettre de motivation uniquement pour produire un nouveau brouillon.","Mabadiliko yako yamehifadhiwa. Tumia Unda barua ya maombi ikiwa unataka rasimu mpya."],
            "Form changed after manual edits. Click Create cover letter to regenerate from the form.":["Le formulaire a changé après vos modifications. Cliquez sur Créer une lettre de motivation pour générer un nouveau brouillon.","Fomu imebadilika baada ya uhariri wako. Bofya Unda barua ya maombi ili kutengeneza rasimu mpya."],
            "PDF downloaded.":["PDF téléchargé.","PDF imepakuliwa."],"TXT downloaded.":["TXT téléchargé.","TXT imepakuliwa."],"JSON downloaded.":["JSON téléchargé.","JSON imepakuliwa."],"Word-compatible document downloaded.":["Document compatible avec Word téléchargé.","Hati inayotumika katika Word imepakuliwa."],"Saved.":["Enregistré.","Imehifadhiwa."],"Deleted.":["Supprimé.","Imefutwa."],"Loaded saved letter.":["Lettre enregistrée chargée.","Barua iliyohifadhiwa imefunguliwa."],"Saved letter not found.":["Lettre enregistrée introuvable.","Barua iliyohifadhiwa haijapatikana."],"Copied to clipboard.":["Copié dans le presse-papiers.","Imenakiliwa."],"Nothing to copy yet.":["Aucun texte à copier.","Hakuna maandishi ya kunakili bado."],"Select the text and copy manually.":["Sélectionnez le texte et copiez-le manuellement.","Chagua maandishi kisha unakili mwenyewe."],"Saving is not available in this browser.":["L’enregistrement n’est pas disponible dans ce navigateur.","Kuhifadhi hakupatikani katika kivinjari hiki."],"Letter changed. Review the final preview again before export.":["La lettre a changé. Vérifiez de nouveau l’aperçu avant l’exportation.","Barua imebadilika. Kagua tena mwonekano wa mwisho kabla ya kuhamisha."]
        };return copy[message]&&(locale==="fr"||locale==="sw")?copy[message][locale==="fr"?0:1]:message;
    }
    function h(e) {
        var t = u("toast");
        t && (t.textContent = nativeMessage(e), t.classList.add("show"), clearTimeout(h._timer), h._timer = setTimeout(function() {
            t.classList.remove("show");
        }, 2600));
    }
    function f(e, t, n) {
        var r = u(e);
        r && (r.innerHTML = "", t.forEach(function(e) {
            var t = document.createElement("option");
            "string" == typeof e ? (t.value = e, t.textContent = e) : (t.value = e.id, t.textContent = e.name),
            t.textContent = nativeOption(t.value,t.textContent);
            r.appendChild(t);
        }), n && (r.value = n));
    }
    function g(e) {
        var t = u(e);
        return t ? String(t.value || "").trim() : "";
    }
    function v(e, t) {
        var n = u(e);
        n && (n.value = null == t ? "" : t);
    }
    function y() {
        var e = {};
        return s.forEach(function(t) {
            e[t] = g(t);
        }), e.letterText = g("letterText"), e.selectedId = n, e.updatedAt = Date.now(),
        e;
    }
    function w(e, t) {
        e && (s.forEach(function(t) {
            Object.prototype.hasOwnProperty.call(e, t) && v(t, e[t]);
        }), n = e.selectedId || n || null, !t && Object.prototype.hasOwnProperty.call(e, "letterText") && (v("letterText", e.letterText),
        r = !0), Object.prototype.hasOwnProperty.call(e, "letterText") || g("letterText") ? x() : k(), C());
    }
    function validateBackup(value) {
        if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error("Invalid backup");
        if (value.schemaVersion !== undefined && value.schemaVersion !== 1) throw new Error("Unsupported backup");
        if (value.selectedId != null && typeof value.selectedId !== "string") throw new Error("Invalid saved ID");
        if (value.updatedAt !== undefined && (typeof value.updatedAt !== "number" || !Number.isFinite(value.updatedAt))) throw new Error("Invalid timestamp");
        if (typeof value.fullName !== "string" || typeof value.letterText !== "string") throw new Error("Missing letter fields");
        var allowed = s.concat(["letterText", "selectedId", "updatedAt", "schemaVersion"]);
        Object.keys(value).forEach(function(key) {
            if (allowed.indexOf(key) === -1) throw new Error("Unknown backup field");
            if ((s.indexOf(key) !== -1 || key === "letterText") && (typeof value[key] !== "string" || value[key].length > 200000)) throw new Error("Invalid text field");
        });
        var defaults = {templateId:"technology",toneId:"professional",market:"Pan-African",lengthId:"standard"}, result = {};
        s.forEach(function(key) { result[key] = Object.prototype.hasOwnProperty.call(value,key) ? value[key] : defaults[key] || ""; });
        [["templateId",a.map(function(row){return row.id;})],["toneId",i.map(function(row){return row.id;})],["market",c],["lengthId",l.map(function(row){return row.id;})]].forEach(function(entry){if(entry[1].indexOf(result[entry[0]]) === -1) throw new Error("Unknown option");});
        result.letterText = value.letterText; result.selectedId = null;
        return result;
    }
    function importMessage(ok) {
        var locale=String(document.documentElement.lang||"en").split("-")[0];
        return ({fr:ok?"Lettre importée comme nouveau brouillon local.":"Fichier JSON invalide ou non compatible. Le brouillon actuel est conservé.",sw:ok?"Barua imeingizwa kama rasimu mpya kwenye kifaa hiki.":"Faili ya JSON si sahihi au haitumiki. Rasimu ya sasa imehifadhiwa."})[locale] || (ok?"Letter imported as a new local draft.":"Invalid or unsupported JSON file. Current draft preserved.");
    }
    function b(e, t) {
        var n = String(e || "").trim();
        return n ? n.replace(/\s+/g, " ").replace(/[.]+$/, "") : t || "";
    }
    function x() {
        var e = y(), t = e.letterText;
        !function(e) {
            var t = u("paperPreview");
            if (t) {
                t.innerHTML = "";
                var n = String(e || "").split(/\n{2,}/).map(function(e) {
                    return e.trim();
                }).filter(Boolean);
                if (!n.length) {
                    var r = document.createElement("p");
                    return r.textContent = "Your cover letter preview will appear here.", void t.appendChild(r);
                }
                n.forEach(function(e, n) {
                    var r = document.createElement("p");
                    r.setAttribute("data-cover-letter-user-content",""), r.setAttribute("translate","no"), r.textContent = e, 0 === n && (r.className = "paper-name"), t.appendChild(r);
                });
            }
        }(t), function(e) {
            var t = u("scoreValue"), n = u("scoreRing"), r = u("scoreCopy");
            if (t && (t.textContent = String(e.score)), n && n.style.setProperty("--score-deg", Math.round(3.6 * e.score) + "deg"),
            r) {
                var o = e.score >= 85 ? "Strong draft. Do a final human read before sending." : e.score >= 65 ? "Good base. Close the warnings below for a sharper letter." : "Needs more role-specific proof before applying.";
                r.textContent = o + " Word count: " + e.words + ".";
            }
            var a = u("checksList");
            a && (a.innerHTML = e.checks.map(function(e) {
                return '<div class="check ' + (e.good ? "good" : "warn") + '"><strong>' + p(e.label) + "</strong><br>" + p(e.good ? "Looks good." : e.detail) + "</div>";
            }).join(""));
            var i = u("keywordChips");
            if (i) if (e.keywords.length) {
                var l = e.matched.map(function(e) {
                    return '<span class="chip hit" data-cover-letter-user-content translate="no">' + p(e) + "</span>";
                }), c = e.missing.map(function(e) {
                    return '<span class="chip miss" data-cover-letter-user-content translate="no">' + p(e) + "</span>";
                });
                i.innerHTML = l.concat(c).join("");
            } else i.innerHTML = '<span class="chip">Paste a job description</span>';
        }(function(e, t) {
            var n = function(e) {
                var t = {};
                return String(e || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/).forEach(function(e) {
                    var n = e.replace(/^-+|-+$/g, "");
                    n.length < 4 || d[n] || (t[n] = (t[n] || 0) + 1);
                }), Object.keys(t).sort(function(e, n) {
                    return t[n] - t[e] || e.localeCompare(n);
                }).slice(0, 18);
            }(e.jobDescription), r = (t + " " + e.skills + " " + e.resumeSummary).toLowerCase(), o = n.filter(function(e) {
                return -1 !== r.indexOf(e);
            }), a = n.filter(function(e) {
                return -1 === r.indexOf(e);
            }).slice(0, 10), i = function(e) {
                var t = String(e || "").trim().match(/\b[\w'-]+\b/g);
                return t ? t.length : 0;
            }(t), l = [], c = 0;
            function s(e, t, n, r) {
                n && (c += t), l.push({
                    label: e,
                    good: n,
                    detail: r,
                    points: t
                });
            }
            return s("Contact details", 10, Boolean(e.fullName && (e.email || e.phone)), "Add name plus email or phone."),
            s("Role and company", 12, Boolean(e.jobTitle && e.company), "Name the exact role and employer."),
            s("Skills", 10, Boolean(e.skills && e.skills.split(",").filter(Boolean).length >= 2), "Add at least two relevant skills."),
            s("Proof with result", 14, /\d|percent|increase|reduced|saved|grew|delivered|launched/i.test(e.achievement), "Use a result, metric, or concrete outcome."),
            s("Company motivation", 10, e.whyCompany.length > 35, "Explain why this company, not just any job."),
            s("Job keywords", 18, n.length ? o.length >= Math.min(4, Math.ceil(.35 * n.length)) : Boolean(e.jobTitle), "Paste a job description and cover the important terms."),
            s("Letter length", 10, i >= 180 && i <= 520, "Aim for 180 to 520 words."), s("Professional structure", 8, /Dear /.test(t) && /Yours sincerely/.test(t), "Keep greeting and sign-off clear."),
            s("No placeholders", 8, !/\[[^\]]+\]|your organization|the advertised role/i.test(t), "Replace generic fallback text."),
            {
                score: c = Math.max(0, Math.min(100, c)),
                checks: l,
                keywords: n,
                matched: o,
                missing: a,
                words: i
            };
        }(e, t)), S(e);
    }
    function nativeOption(value, fallback) {
        var locale=String(document.documentElement.lang||"en").split("-")[0], labels={
            fr:{technology:"Technologie",finance:"Finance et banque",healthcare:"Santé",education:"Éducation",engineering:"Ingénierie et construction",ngo:"ONG et développement",government:"Administration publique",sales:"Vente et relation client",creative:"Création et médias",graduate:"Premier emploi ou stage",professional:"Professionnel",confident:"Assuré",warm:"Chaleureux",concise:"Concis",executive:"Cadre expérimenté",standard:"Standard",detailed:"Détaillé","Pan-African":"Panafricain","South Africa":"Afrique du Sud",Uganda:"Ouganda",Tanzania:"Tanzanie",Ethiopia:"Éthiopie","Remote or global role":"Poste à distance ou international"},
            sw:{technology:"Teknolojia",finance:"Fedha na benki",healthcare:"Afya",education:"Elimu",engineering:"Uhandisi na ujenzi",ngo:"Mashirika yasiyo ya kiserikali na maendeleo",government:"Utumishi wa umma",sales:"Mauzo na huduma kwa wateja",creative:"Ubunifu na vyombo vya habari",graduate:"Ajira ya kwanza au mafunzo kazini",professional:"Kitaalamu",confident:"Kujiamini",warm:"Kirafiki",concise:"Fupi",executive:"Uongozi wa juu",standard:"Kawaida",detailed:"Ya kina","Pan-African":"Afrika nzima","South Africa":"Afrika Kusini","Remote or global role":"Kazi ya mbali au ya kimataifa"}
        };return (labels[locale]||{})[value]||fallback;
    }
    function nativeDraft(data, locale) {
        if (locale !== "fr" && locale !== "sw") return null;
        var fr = locale === "fr", clean = function(value){return String(value || "").trim();};
        var sectors = {
            technology:["Technologie","Teknolojia","la réalisation de produits numériques fiables","kutengeneza bidhaa za kidijitali zinazotegemeka"],
            finance:["Finance et banque","Fedha na benki","la rigueur financière et la confiance des clients","usahihi wa fedha na imani ya wateja"],
            healthcare:["Santé","Afya","la qualité des soins et la sécurité des patients","ubora wa huduma za afya na usalama wa wagonjwa"],
            education:["Éducation","Elimu","la réussite des apprenants et la qualité de la formation","mafanikio ya wanafunzi na ubora wa mafunzo"],
            engineering:["Ingénierie et construction","Uhandisi na ujenzi","la qualité technique et la sécurité des travaux","ubora wa kiufundi na usalama wa kazi"],
            ngo:["ONG et développement","Mashirika yasiyo ya kiserikali na maendeleo","les résultats des programmes et les besoins des communautés","matokeo ya programu na mahitaji ya jamii"],
            government:["Administration publique","Utumishi wa umma","la qualité du service public et le respect des procédures","ubora wa huduma za umma na kufuata taratibu"],
            sales:["Vente et relation client","Mauzo na huduma kwa wateja","la relation client et le suivi commercial","mahusiano na wateja na ufuatiliaji wa mauzo"],
            creative:["Création et médias","Ubunifu na vyombo vya habari","la clarté des messages et la compréhension des publics","ujumbe ulio wazi na kuelewa hadhira"],
            graduate:["Premier emploi ou stage","Ajira ya kwanza au mafunzo kazini","l’apprentissage, l’initiative et la mise en pratique des connaissances","kujifunza, kuchukua hatua na kutumia maarifa"]
        };
        var sector=sectors[data.templateId]||sectors.technology, name=clean(data.fullName)||(fr?"[Votre nom]":"[Jina lako]"), role=clean(data.jobTitle)||(fr?"[Poste visé]":"[Nafasi unayoomba]"), company=clean(data.company)||(fr?"[Organisation]":"[Shirika]"), manager=clean(data.hiringManager);
        var tones = fr ? {professional:"Je vous présente ma candidature",confident:"Je souhaite mettre mes compétences au service de votre équipe",warm:"C’est avec intérêt que je vous adresse ma candidature",concise:"Je postule",executive:"Je souhaite vous proposer mon expérience"} : {professional:"Ninawasilisha ombi langu",confident:"Ningependa kutumia ujuzi wangu katika timu yenu",warm:"Ninafurahi kuwasilisha ombi langu",concise:"Ninaomba nafasi hii",executive:"Ningependa kuchangia uzoefu wangu"};
        var lines=[name], contact=[data.email,data.phone,data.city,data.portfolio].map(clean).filter(Boolean).join(" | ");
        if(contact)lines.push(contact);
        lines.push("",new Date().toLocaleDateString(fr?"fr-FR":"sw-TZ",{day:"numeric",month:"long",year:"numeric"}),"",manager||(fr?"À l’attention du service de recrutement":"Kwa kitengo cha uajiri"),company,"",manager?(fr?"À l’attention de ":"Kwa ")+manager+",":fr?"Madame, Monsieur,":"Ndugu waajiri,","");
        lines.push((tones[data.toneId]||tones.professional)+(fr?" pour le poste suivant : ":" kwa nafasi ifuatayo: ")+role+(fr?", au sein de ":", katika ")+company+".");
        var experience=clean(data.years),skills=clean(data.skills);
        if(experience)lines.push(fr?"Mon expérience professionnelle : "+experience+(experience==="1"?" an.":" ans."):"Uzoefu wangu wa kazi: "+(experience==="1"?"mwaka ":"miaka ")+experience+".");
        if(skills)lines.push((fr?"Mes compétences pertinentes : ":"Ujuzi wangu unaohusiana na nafasi hii: ")+skills);
        lines.push(fr?"Ce poste m’intéresse notamment pour sa contribution à "+sector[2]+".":"Ninavutiwa na nafasi hii hasa kwa mchango wake katika "+sector[3]+".");
        if(clean(data.source))lines.push((fr?"J’ai trouvé cette offre par le biais de : ":"Nilipata tangazo la nafasi hii kupitia: ")+clean(data.source));
        lines.push("");
        if(clean(data.achievement))lines.push((fr?"Un exemple concret de mon travail : ":"Mfano halisi wa kazi yangu: ")+clean(data.achievement));
        else lines.push(fr?"[Ajoutez un résultat concret de votre parcours.]":"[Ongeza matokeo halisi ya kazi au masomo yako.]");
        if(data.lengthId!=="concise"&&clean(data.resumeSummary))lines.push((fr?"Éléments complémentaires de mon parcours : ":"Maelezo ya ziada kuhusu uzoefu wangu: ")+clean(data.resumeSummary));
        if(clean(data.whyCompany))lines.push("",(fr?"Les raisons de mon intérêt pour votre organisation : ":"Sababu zinazonivutia katika shirika lenu: ")+clean(data.whyCompany));
        {
            var markets={"Nigeria":["le Nigeria","Nigeria"],"Kenya":["le Kenya","Kenya"],"Ghana":["le Ghana","Ghana"],"South Africa":["l’Afrique du Sud","Afrika Kusini"],"Rwanda":["le Rwanda","Rwanda"],"Uganda":["l’Ouganda","Uganda"],"Tanzania":["la Tanzanie","Tanzania"],"Ethiopia":["l’Éthiopie","Ethiopia"]};
            var market=markets[data.market];
            lines.push("",data.market==="Remote or global role"?(fr?"Je souhaite échanger sur les modalités de collaboration à distance et les besoins de votre équipe.":"Ningependa kujadili namna ya kufanya kazi kwa mbali na mahitaji ya timu yenu."):market?(fr?"Je souhaite contribuer aux activités de votre équipe en lien avec "+market[0]+".":"Ningependa kuchangia shughuli za timu yenu zinazohusiana na "+market[1]+"."):(fr?"Je souhaite contribuer aux projets de votre équipe dans le contexte africain.":"Ningependa kuchangia miradi ya timu yenu katika mazingira ya Afrika."));
        }
        if(clean(data.contextNote))lines.push("",clean(data.contextNote));
        if(clean(data.referral))lines.push((fr?"Personne ou relation à l’origine de ma candidature : ":"Mtu au uhusiano ulionihamasisha kuomba: ")+clean(data.referral));
        if(clean(data.availability))lines.push((fr?"Ma disponibilité : ":"Upatikanaji wangu: ")+clean(data.availability));
        if(data.lengthId==="detailed")lines.push("",fr?"Je serais heureux de préciser les exemples ci-dessus et leur pertinence pour les priorités de ce poste lors d’un entretien.":"Ningefurahi kueleza zaidi mifano iliyo hapo juu na jinsi inavyohusiana na vipaumbele vya nafasi hii katika usaili.");
        lines.push("",fr?"Je vous remercie de l’attention portée à ma candidature. Je reste à votre disposition pour échanger sur le poste et sur ma contribution à votre équipe.":"Asanteni kwa kuzingatia ombi langu. Niko tayari kujadiliana kuhusu nafasi hii na mchango wangu katika timu yenu.","",fr?"Cordialement,":"Wenu mwaminifu,",name);
        return lines.join("\n");
    }
    function k() {
        v("letterText", function(e) {
            var localized = nativeDraft(e, String(document.documentElement.lang||"en").split("-")[0]);
            if(localized !== null)return localized;
            var t, n = (t = e.templateId, a.find(function(e) {
                return e.id === t;
            }) || a[0]), r = function(e) {
                return i.find(function(t) {
                    return t.id === e;
                }) || i[0];
            }(e.toneId), o = function(e) {
                return l.find(function(t) {
                    return t.id === e;
                }) || l[1];
            }(e.lengthId), c = b(e.fullName, "Your Name"), s = b(e.jobTitle, "the advertised role"), d = b(e.company, "your organization"), u = b(e.hiringManager, "Hiring Manager"), p = e.years ? e.years + " years of experience" : "relevant professional experience", m = b(e.skills, n.opener), h = b(e.achievement, "My work has consistently combined ownership, follow-through, and measurable delivery."), f = b(e.whyCompany, "your mission, your growth plans, and the standard of work your team is building"), g = b(e.resumeSummary, ""), v = b(e.availability, ""), y = b(e.referral, ""), w = b(e.contextNote, ""), x = b(e.source, ""), k = function(e) {
                return [ e.email, e.phone, e.city, e.portfolio ].filter(Boolean).join(" | ");
            }(e), S = [];
            S.push(c), k && S.push(k), S.push(""), S.push((new Date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric"
            })), S.push(""), S.push(u), S.push(d), S.push(""), S.push("Dear " + u + ","), S.push("");
            var T = r.intro + " for the " + s + " position at " + d + ". With " + p + " in " + m + ", I bring a practical record of " + n.focus + ".";
            x && (T += " I found the opportunity through " + x + ", and the role stood out because it connects directly with the work I do best."),
            S.push(T), S.push("");
            var C = "In my recent work, " + h + " This experience has strengthened my ability to turn requirements into clear execution, work with different stakeholders, and keep quality high under pressure.";
            g && o.extra && (C += " My background also includes " + g + ", which gives me useful context for the priorities described in this role."),
            S.push(C), S.push("");
            var I, j = "What attracts me to " + d + " is " + f + ". " + ((I = e.market) && "Pan-African" !== I ? "Remote or global role" === I ? "I am comfortable working across time zones and communicating clearly in distributed teams." : "I also understand the local expectations of the " + I + " market while keeping international standards in view." : "I understand the pace, resourcefulness, and cross-market collaboration expected across African teams.") + " I would bring a steady, evidence-led approach and a willingness to learn the details that matter to your customers, users, or communities.";
            if (S.push(j), S.push(""), w || y || v || "detailed" === o.id) {
                var L = [];
                w && L.push(w), y && L.push("I was encouraged to apply by " + y + "."), v && L.push("My availability is " + v + "."),
                L.length || L.push("I am especially interested in roles where I can combine ownership, collaboration, and measurable delivery."),
                S.push(L.join(" ")), S.push("");
            }
            return S.push("Thank you for considering my application. " + r.close + " to discuss how my experience can support " + d + " and the goals of the " + s + " role."),
            S.push(""), S.push("Yours sincerely,"), S.push(c), S.join("\n");
        }(y())), r = !1;
        var e = u("editState");
        e && (e.textContent = nativeMessage("Draft created from your form. You can edit the text directly before exporting.")),
        x();
    }
    function S(t) {
        try {
            localStorage.setItem(e, JSON.stringify(t || y()));
        } catch (e) {}
    }
    function T(e) {
        var locale=String(document.documentElement.lang||"en").split("-")[0];
        return (e.jobTitle || ({fr:"Lettre de motivation",sw:"Barua ya maombi"}[locale]||"Cover letter")) + (e.company ? ({fr:" — ",sw:" — "}[locale]||" at ") + e.company : "");
    }
    function C() {
        var e = u("savedList");
        if (e) if (o) {
            var t = o.getAll();
            t.length ? e.innerHTML = t.map(function(e) {
                var t = e.updatedAt ? new Date(e.updatedAt).toLocaleDateString(({fr:"fr-FR",sw:"sw-TZ"})[String(document.documentElement.lang||"en").split("-")[0]]||"en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                }) : "";
                return '<div class="saved-item" data-id="' + p(e.id) + '"><div class="saved-title" data-cover-letter-user-content translate="no">' + p(e.title || "Untitled letter") + '</div><div class="saved-meta">' + p(t) + '</div><div class="saved-actions"><button class="btn btn-soft" type="button" data-load="' + p(e.id) + '">Load</button><button class="btn btn-danger" type="button" data-delete="' + p(e.id) + '">Delete</button></div></div>';
            }).join("") : e.innerHTML = '<div class="helper">No saved letters yet.</div>';
        } else e.innerHTML = '<div class="helper">Saved letters are not available in this browser.</div>';
    }
    function I(e, t, n) {
        var r = new Blob([ n ], {
            type: t
        }), o = URL.createObjectURL(r), a = document.createElement("a");
        a.href = o, a.download = e, document.body.appendChild(a), a.click(), a.remove(),
        setTimeout(function() {
            URL.revokeObjectURL(o);
        }, 5e3);
    }
    function j(e) {
        var t = u("letterText");
        if (t) {
            t.focus(), t.select();
            try {
                document.execCommand("copy"), h("Copied to clipboard.");
            } catch (e) {
                h("Select the text and copy manually.");
            }
        }
    }
    function L() {
        var e = function(e) {
            var n = JSON.stringify(e), r = btoa(unescape(encodeURIComponent(n))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""), o = new URL(window.location.href);
            return o.search = "", o.searchParams.set(t, r), o.toString();
        }(y());
        navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(e).then(function() {
            h("Share link copied.");
        }).catch(function() {
            h("Could not copy share link.");
        }) : h("Clipboard unavailable.");
    }
    function E() {
        if (r) {
            var e = u("editState");
            return e && (e.textContent = nativeMessage("Form changed after manual edits. Click Create cover letter to regenerate from the form.")),
            void x();
        }
        k();
    }
    function N() {
        document.addEventListener("click",function(event){
            var action=event.target.closest&&event.target.closest("[data-action]");
            if(!action||["pdf","word","txt","json","print"].indexOf(action.dataset.action)===-1)return;
            if(/\[(?:Votre nom|Poste visé|Organisation|Ajoutez un résultat concret de votre parcours\.|Jina lako|Nafasi unayoomba|Shirika|Ongeza matokeo halisi ya kazi au masomo yako\.)\]/.test(g("letterText"))){
                event.preventDefault();event.stopImmediatePropagation();
                var message=String(document.documentElement.lang||"").startsWith("sw")?"Kamilisha sehemu zilizo kwenye mabano kabla ya kuhamisha barua.":"Complétez les éléments entre crochets avant d’exporter la lettre.";
                var status=u("exportReviewStatus");if(status)status.textContent=message;h(message);u("letterText").focus();
            }
        },true);
        f("templateId", a, "technology"), f("toneId", i, "professional"), f("market", c, "Pan-African"),
        f("lengthId", l, "standard"), v("years", "3"), function() {
            s.forEach(function(e) {
                var t = u(e);
                t && (t.addEventListener("input", E), t.addEventListener("change", E));
            });
            var e = u("letterText");
            e && e.addEventListener("input", function() {
                r = !0;
                var e = u("editState");
                e && (e.textContent = nativeMessage("Manual edits are preserved. Use Create cover letter only when you want a fresh draft.")),
                x();
            }), document.addEventListener("click", function(e) {
                var t, r, a = e.target.closest("[data-action]");
                if (a) {
                    var i = a.getAttribute("data-action");
                    "rebuild" === i && k(), "save" === i && function() {
                        if (o) {
                            var e = y(), t = o.save({
                                id: n || void 0,
                                title: T(e),
                                data: e,
                                thumbnail: null
                            });
                            n = t.id, e.selectedId = n, S(e), history.replaceState(null, "", "?id=" + encodeURIComponent(n)),
                            C(), h("Saved.");
                        } else h("Saving is not available in this browser.");
                    }(), "copy" === i && ((r = g("letterText")) ? navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(r).then(function() {
                        h("Copied to clipboard.");
                    }).catch(function() {
                        j();
                    }) : j() : h("Nothing to copy yet.")), "share" === i && L(), "pdf" === i && async function() {
                        var snapshot = y();
                        try {
                            if (!window.CareerDocumentPdf) await new Promise(function(resolve, reject) {
                                var script = document.createElement("script");
                                script.src = "/assets/js/pages/career-document-pdf.js";
                                script.onload = resolve; script.onerror = reject;
                                document.head.appendChild(script);
                            });
                            var bytes = await window.CareerDocumentPdf.buildPdf(snapshot.letterText, "cover-letter");
                            var latest = y();
                            if (Object.keys(snapshot).some(function(key) { return key !== "updatedAt" && latest[key] !== snapshot[key]; }) || !document.getElementById("exportReviewConfirm").checked) {
                                h("Letter changed. Review the final preview again before export."); return;
                            }
                            I(m(T(snapshot), "cover-letter") + ".pdf", "application/pdf", bytes);
                            h("PDF downloaded.");
                        } catch (failure) {
                            h(window.CareerDocumentPdf ? window.CareerDocumentPdf.message(failure, document.documentElement.lang, "cover-letter") : document.documentElement.lang === "fr" ? "PDF indisponible. Exportez en Word ou TXT." : document.documentElement.lang === "sw" ? "PDF haipatikani. Hamisha kama Word au TXT." : "PDF unavailable. Export Word or TXT.");
                        }
                    }(), "txt" === i && (I(m(T(t = y()), "cover-letter") + ".txt", "text/plain;charset=utf-8", t.letterText),
                    h("TXT downloaded.")), "word" === i && function() {
                        var e = y(), t = String(e.letterText || "").split(/\n{2,}/).map(function(e) {
                            return "<p>" + p(e).replace(/\n/g, "<br>") + "</p>";
                        }).join(""), n = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' + p(T(e)) + "</title><style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.6;margin:54pt;}p{margin:0 0 12pt;}</style></head><body>" + t + "</body></html>";
                        I(m(T(e), "cover-letter") + ".doc", "application/msword;charset=utf-8", n), h("Word-compatible document downloaded.");
                    }(), "json" === i && function() {
                        var e = y();
                        I(m(T(e), "cover-letter") + ".json", "application/json;charset=utf-8", JSON.stringify(Object.assign({schemaVersion:1},e), null, 2)),
                        h("JSON downloaded.");
                    }(), "import" === i && u("importInput").click(), "print" === i && window.print();
                }
                var l = e.target.closest("[data-load]");
                l && function(e) {
                    if (o) {
                        var t = o.load(e);
                        t && t.data ? (n = t.id, w(t.data, !1), history.replaceState(null, "", "?id=" + encodeURIComponent(t.id)),
                        h("Loaded saved letter.")) : h("Saved letter not found.");
                    }
                }(l.getAttribute("data-load"));
                var c, s = e.target.closest("[data-delete]");
                s && (c = s.getAttribute("data-delete"), o && (o.delete(c), n === c && (n = null),
                C(), h("Deleted.")));
            });
            var t = u("importInput");
            t && t.addEventListener("change", function() {
                !function(e) {
                    if (e) {
                        if(e.size > 2000000) { h(importMessage(false)); return; }
                        var t = new FileReader;
                        t.onerror=function(){h(importMessage(false));};
                        t.onload = function() {
                            try {
                                var e = validateBackup(JSON.parse(String(t.result || "{}")));
                                n = null, w(e, !1), history.replaceState(null, "", window.location.pathname),
                                h(importMessage(true));
                            } catch (e) {
                                h(importMessage(false));
                            }
                        }, t.readAsText(e);
                    }
                }(t.files && t.files[0]), t.value = "";
            });
        }(), function() {
            var r = new URLSearchParams(window.location.search), a = r.get(t);
            if (a) {
                var i = function(e) {
                    try {
                        for (var t = String(e || "").replace(/-/g, "+").replace(/_/g, "/"); t.length % 4; ) t += "=";
                        return JSON.parse(decodeURIComponent(escape(atob(t))));
                    } catch (e) {
                        return null;
                    }
                }(a);
                if (i) return n = null, w(i, !1), h("Shared letter loaded."), !0;
            }
            var l = r.get("id");
            if (l && o) {
                var c = o.load(l);
                if (c && c.data) return n = l, w(c.data, !1), !0;
            }
            var s = function() {
                try {
                    return JSON.parse(localStorage.getItem(e) || "null");
                } catch (e) {
                    return null;
                }
            }();
            return !(!s || !(s.fullName || s.jobTitle || s.company || s.letterText) || (n = s.selectedId || null,
            w(s, !1), 0));
        }() || k(), C();
    }
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", N) : N();
}();