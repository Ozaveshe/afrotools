// Readable owner for the shared AI consent runtime. Build through scripts/minify.js.
!function(t, n) {
    "object" == typeof module && module.exports ? module.exports = n("undefined" != typeof globalThis ? globalThis : {}) : (t.AfroTools = t.AfroTools || {},
    t.AfroTools.AIConsent = n(t));
}("undefined" != typeof window ? window : this, function(t) {
    "use strict";
    var n = "afrotools_ai_advisor_consent", e = "afrotools_ai_consent_events", o = "accepted", i = {
        browser_local_only: {
            title: "Browser-local tool",
            copy: "This tool runs in your browser. AfroTools does not need to send this content to an AI model.",
            sends: "Nothing is sent to a model.",
            button: "Continue locally",
            requiresConsent: !1
        },
        ai_optional_prompt_only: {
            title: "Optional AI assist",
            copy: "AfroTools can use AI for this step only after you choose it. Send prompts only; avoid private documents, CVs, PDFs, financial records, profile data, or identifiers.",
            sends: "Your current prompt may be sent to AfroTools servers and a configured model provider.",
            button: "Use AI assist",
            requiresConsent: !0
        },
        ai_optional_content_included: {
            title: "AI assist with private content",
            copy: "This action may include document, CV, profile, education, legal, or financial content. Review it first and continue only if you want that content sent for AI help.",
            sends: "Selected private content may be sent to AfroTools servers and a configured model provider.",
            button: "Allow AI with this content",
            requiresConsent: !0,
            contentIncluded: !0
        },
        account_sync_optional: {
            title: "Optional account sync",
            copy: "You can keep working locally, or sign in to sync selected metadata and saved items. Account sync is separate from AI consent.",
            sends: "Only the fields you choose to save or sync are sent to AfroTools account services.",
            button: "Continue with sync",
            requiresConsent: !0
        },
        sponsor_lead_opt_in: {
            title: "Optional partner handoff",
            copy: "Sponsor or partner follow-up is separate from AI consent. AfroTools calculations and recommendations stay independent of sponsor placement.",
            sends: "Contact details are sent only if you explicitly opt in to the handoff.",
            button: "Opt in to handoff",
            requiresConsent: !0
        }
    }, a = [ "cvText", "resumeText", "coverLetterText", "jobDescription", "documentContent", "documentText", "pdfText", "fileText", "profileData", "educationProfile", "financialData", "legalFacts", "healthData", "personalProfile" ];
    var cvConsentCopy = {
        en: {
            title: "Optional AI help for your CV",
            copy: "Build, edit, save and export locally. AI help is optional. Cancel to keep using local tools and templates.",
            sends: "The CV text or job-description text supplied for this action, together with the action instructions, will be sent to AfroTools servers and the configured model provider.",
            button: "Allow AI with this content", continuePrompt: "Send this content for AI help?",
            sendsLabel: "What will be sent:", decline: "Continue without AI",
            blocked: "Nothing was sent for AI help. Continue with local tools or give permission for this action."
        },
        fr: {
            title: "Aide facultative par IA pour votre CV",
            copy: "Créez, modifiez, enregistrez et exportez votre CV dans ce navigateur. L’aide par intelligence artificielle (IA) est facultative. Vous pouvez continuer sans IA avec les outils locaux et les modèles de documents.",
            sends: "Les textes fournis pour cette action (CV, fiche de poste et autres textes de candidature, selon l’action choisie), ainsi que votre demande et les consignes nécessaires, seront transmis aux serveurs d’AfroTools et à son prestataire d’IA.",
            button: "Autoriser l’envoi de ce contenu à l’IA", continuePrompt: "Autoriser l’envoi de ce contenu pour obtenir une aide par IA ?",
            sendsLabel: "Ce qui sera envoyé :", decline: "Continuer sans IA",
            blocked: "Aucun contenu n’a été envoyé à l’IA pour cette action. Continuez avec les outils locaux ou autorisez l’envoi de ce contenu."
        },
        sw: {
            title: "Msaada wa AI kwa CV yako (hiari)",
            copy: "Unda, hariri, hifadhi na pakua CV yako katika kivinjari chako. Msaada wa AI ni wa hiari; unaweza kuendelea kutumia zana na violezo bila AI.",
            sends: "Maandishi ya CV, maelezo ya nafasi ya kazi au maandishi mengine ya maombi yanayotumiwa katika hatua hii, pamoja na ombi lako na maelekezo ya hatua hii, yatatumwa kwa seva za AfroTools na mtoa huduma ya AI anayetumiwa na AfroTools.",
            button: "Ruhusu kutuma maudhui haya kwa AI", continuePrompt: "Kutuma maudhui haya kwa AI?",
            sendsLabel: "Taarifa zitakazotumwa:", decline: "Endelea bila AI",
            blocked: "Hakuna maudhui yaliyotumwa kwa AI katika hatua hii. Endelea kutumia zana katika kivinjari chako, au ruhusu kutuma maudhui haya kwa hatua hii."
        },
        ha: {
            title: "Taimakon AI na zaɓi don CV ɗinka",
            copy: "Gina, gyara, ajiye da sauke fayil a burauzarka. Taimakon AI na zaɓi ne. Soke don ci gaba da amfani da kayan aiki da samfuran da ke na'urarka.",
            sends: "Za a aika rubutun CV ko bayanin aikin da aka bayar don wannan mataki, tare da umarnin matakin, zuwa sabobin AfroTools da mai samar da samfurin AI da aka saita.",
            button: "Ba AI izinin amfani da waɗannan bayanan", continuePrompt: "A aika waɗannan bayanan don taimakon AI?",
            sendsLabel: "Abin da za a aika:", decline: "Ci gaba ba tare da AI ba",
            blocked: "Ba a aika bayanai don taimakon AI ba. Ci gaba da kayan aikin na'urarka ko ba da izini don wannan mataki."
        }
    };
    function cvCopy() {
        var lang = String(t.document && t.document.documentElement && t.document.documentElement.lang || "en").toLowerCase().split("-")[0];
        return cvConsentCopy[lang] || cvConsentCopy.en;
    }
    function cvMode(config, toolId) {
        return toolId === "cv-builder" && config.mode === "ai_optional_content_included"
            ? Object.assign({}, config, cvCopy()) : config;
    }
    function isCvContentRequest(payload) {
        return Boolean(payload && payload.tool === "cv-builder"
            && (Array.isArray(payload.messages) || typeof payload.message === "string"));
    }
    function r() {
        try {
            return t.localStorage || null;
        } catch (t) {
            return null;
        }
    }
    function c(t) {
        return String(t || "").replace(/[&<>"']/g, function(t) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[t];
        });
    }
    function s(t) {
        return i[t] ? t : "ai_optional_prompt_only";
    }
    function d(t, n) {
        return "afrotools_ai_consent_" + s(t) + "_" + String(n || "global").replace(/[^a-z0-9_-]/gi, "-");
    }
    function l(t) {
        var n = s(t);
        return Object.assign({
            mode: n
        }, i[n]);
    }
    function u(t, e) {
        var i = r();
        return !!i && (t && "ai_optional_prompt_only" !== t ? i.getItem(d(t, e)) === o : i.getItem(n) === o || i.getItem(d("ai_optional_prompt_only", e)) === o);
    }
    function f(n) {
        var o, i, a = {
            mode: s(n && n.mode),
            tool_id: String(n && (n.toolId || n.tool_id) || "unknown").slice(0, 80),
            action: String(n && n.action || "unknown").slice(0, 80),
            consented: Boolean(n && n.consented),
            content_included: Boolean(n && n.contentIncluded),
            account_sync: Boolean(n && n.accountSync),
            sponsor_lead_opt_in: Boolean(n && n.sponsorLeadOptIn),
            query_length_bucket: (o = n && n.queryLength, i = Number(o || 0), i <= 0 ? "0" : i <= 20 ? "1-20" : i <= 60 ? "21-60" : i <= 140 ? "61-140" : i <= 280 ? "141-280" : "281+"),
            created_at: (new Date).toISOString()
        }, r = function() {
            try {
                return t.sessionStorage || null;
            } catch (t) {
                return null;
            }
        }();
        if (r) try {
            var c = JSON.parse(r.getItem(e) || "[]");
            Array.isArray(c) || (c = []), c.push(a), r.setItem(e, JSON.stringify(c.slice(-30)));
        } catch (t) {}
        return t.AfroTools && t.AfroTools.analytics && "function" == typeof t.AfroTools.analytics.track ? t.AfroTools.analytics.track(a.consented ? "ai_consent_accepted" : "ai_consent_declined", a) : "function" == typeof t.gtag && t.gtag("event", a.consented ? "ai_consent_accepted" : "ai_consent_declined", a),
        a;
    }
    function p(t, e) {
        var i = r();
        i && (i.setItem(d(t, e), o), "ai_optional_prompt_only" !== t && "ai_optional_content_included" !== t || i.setItem(n, o));
    }
    function y(n) {
        var e = n || {}, o = s(e.mode), i = l(o), a = e.toolId || e.tool_id || "global";
        i = cvMode(i, a);
        if (a === "gh-paye" && e.payload && Array.isArray(e.payload.messages)) {
            var french = String(t.document && t.document.documentElement.lang || "").split("-")[0] === "fr";
            i = Object.assign({}, i, {
                title: french ? "Analyse fiscale facultative par IA" : "Optional AI tax analysis",
                copy: french ? "Ce contenu sera envoyé aux serveurs AfroTools et au prestataire IA configuré. Annulez pour continuer avec le calculateur local, sans envoi." : "This content will be sent to AfroTools servers and the configured AI provider. Cancel to continue with the local calculator without sending it.",
                sends: JSON.stringify(e.payload, null, 2),
                continuePrompt: french ? "Autoriser cet envoi précis ?" : "Allow this specific send?"
            });
        }
        if (!i.requiresConsent) return f(Object.assign({}, e, {
            mode: o,
            toolId: a,
            consented: !0
        })), !0;
        if (!e.requireFresh && u(o, a)) return !0;
        if ("function" != typeof t.confirm) return !1;
        var r = t.confirm(function(t) {
            return [ t.title, t.copy, t.sends, t.continuePrompt || "Continue?" ].join("\n\n");
        }(i));
        return f(Object.assign({}, e, {
            mode: o,
            toolId: a,
            consented: r,
            contentIncluded: i.contentIncluded || e.contentIncluded
        })), r && p(o, a), r;
    }
    function m(t, n) {
        // CV assistants send private text inside chat messages as well as named
        // CV fields. General prompt consent must never authorize those sends.
        if (isCvContentRequest(t)) return true;
        if (t && t.tool === "gh-paye" && Array.isArray(t.messages)) return true;
        return !(!t || n > 4) && (Array.isArray(t) ? t.some(function(t) {
            return m(t, n + 1);
        }) : "object" == typeof t && Object.keys(t).some(function(e) {
            return -1 !== a.indexOf(e) || m(t[e], n + 1);
        }));
    }
    function g(n, e) {
        if (!n) return null;
        !function() {
            if (t.document && !t.document.getElementById("afrotools-ai-consent-style")) {
                var n = t.document.createElement("style");
                n.id = "afrotools-ai-consent-style", n.textContent = [ ".ai-consent-notice{border:1px solid #c7d2fe;border-radius:12px;background:#f8fbff;color:#334155;padding:12px 14px;display:grid;gap:8px;font-family:inherit;margin:12px 0}", ".ai-consent-notice[data-consent-mode='browser_local_only']{border-color:#bbf7d0;background:#f0fdf4}", ".ai-consent-notice h3{margin:0;color:#0f172a;font-size:.92rem;line-height:1.25}", ".ai-consent-notice p{margin:0;color:#475569;font-size:.8rem;line-height:1.5}", ".ai-consent-notice strong{color:#0f172a}", ".ai-consent-actions{display:flex;flex-wrap:wrap;gap:8px}", ".ai-consent-actions button,.ai-consent-actions a{display:inline-flex;align-items:center;justify-content:center;min-height:38px;border-radius:10px;border:1px solid #c7d2fe;background:#fff;color:#0057b8;font:inherit;font-size:.78rem;font-weight:900;padding:0 12px;text-decoration:none;cursor:pointer}", ".ai-consent-actions button[data-ai-consent-accept]{background:#0057b8;border-color:#0057b8;color:#fff}", "@media(max-width:700px){.ai-consent-actions{display:grid}.ai-consent-actions button,.ai-consent-actions a{width:100%}}" ].join(""),
                t.document.head.appendChild(n);
            }
        }();
        var o = e || {}, i = s(o.mode || n.getAttribute("data-consent-mode")), r = o.toolId || n.getAttribute("data-tool-id") || "global", a = cvMode(l(i), r), d = o.action || n.getAttribute("data-consent-action") || l(i).button, u = !0 === o.showAction || "true" === n.getAttribute("data-consent-action-button"), y = o.continueHref || n.getAttribute("data-continue-href") || "";
        var nativeCv = r === "cv-builder" && i === "ai_optional_content_included" && cvCopy() !== cvConsentCopy.en;
        n.classList.add("ai-consent-notice"), n.setAttribute("data-ai-consent-notice", ""),
        n.setAttribute("data-consent-mode", i), n.innerHTML = [ "<h3>" + c(nativeCv ? a.title : o.title || n.getAttribute("data-consent-title") || a.title) + "</h3>", "<p>" + c(nativeCv ? a.copy : o.copy || n.getAttribute("data-consent-copy") || a.copy) + "</p>", "<p><strong>" + c(a.sendsLabel || "What may be sent:") + "</strong> " + c(nativeCv ? a.sends : o.sends || a.sends) + "</p>", u ? '<div class="ai-consent-actions"><button type="button" data-ai-consent-accept>' + c(nativeCv ? a.button : d) + "</button>" + (y ? '<a href="' + c(y) + '" data-ai-consent-decline>' : '<button type="button" data-ai-consent-decline>') + c(a.decline || "Continue without AI") + (y ? "</a>" : "</button>") + "</div>" : "" ].join("");
        var m = n.querySelector("[data-ai-consent-accept]"), g = n.querySelector("[data-ai-consent-decline]");
        return m && m.addEventListener("click", function() {
            p(i, r), f({
                mode: i,
                toolId: r,
                action: d,
                consented: !0,
                contentIncluded: a.contentIncluded
            }), n.dispatchEvent(new CustomEvent("afrotools:ai-consent-accepted", {
                bubbles: !0,
                detail: {
                    mode: i,
                    toolId: r
                }
            }));
        }), g && g.addEventListener("click", function() {
            f({
                mode: i,
                toolId: r,
                action: d,
                consented: !1,
                contentIncluded: a.contentIncluded
            }), n.dispatchEvent(new CustomEvent("afrotools:ai-consent-declined", {
                bubbles: !0,
                detail: {
                    mode: i,
                    toolId: r
                }
            }));
        }), n;
    }
    function b() {
        t.document && Array.prototype.forEach.call(t.document.querySelectorAll("[data-ai-consent-notice]"), function(t) {
            "true" !== t.getAttribute("data-ai-consent-enhanced") && (t.setAttribute("data-ai-consent-enhanced", "true"),
            g(t, {}));
        });
    }
    return t.document && ("loading" === t.document.readyState ? t.document.addEventListener("DOMContentLoaded", b, {
        once: !0
    }) : b()), function() {
        if (t && !t.AfroTools.aiConsentV2FetchWrapped && "function" == typeof t.fetch) {
            var n = t.fetch.bind(t);
            t.fetch = function(e, i) {
                if (!function(t) {
                    var n = "";
                    return "string" == typeof t ? n = t : t && "string" == typeof t.url && (n = t.url),
                    -1 !== n.indexOf("/.netlify/functions/ai-advisor") || -1 !== n.indexOf("/api/ai-advisor");
                }(e)) return n(e, i);
                var a, r, c = function(t) {
                    if (!t || !t.body || "string" != typeof t.body) return null;
                    try {
                        return JSON.parse(t.body);
                    } catch (t) {
                        return null;
                    }
                }(i), s = m(c, 0);
                return y({
                    mode: s ? "ai_optional_content_included" : "ai_optional_prompt_only",
                    toolId: c && c.tool || "ai-advisor",
                    action: "ai-advisor",
                    contentIncluded: s,
                    requireFresh: Boolean(c && (c.tool === "cv-builder" || c.tool === "gh-paye") && s),
                    payload: c
                }) ? n.apply(t, function(t, n, e) {
                    var i = Object.assign({}, n || {}), a = i.headers || (t && "string" != typeof t ? t.headers : void 0), r = new Headers(a || {});
                    return r.set("x-afrotools-ai-consent", o), e && r.set("x-afrotools-ai-content-consent", o),
                    i.headers = r, t && "string" != typeof t && "undefined" != typeof Request && t instanceof Request ? [ new Request(t, i) ] : [ t, i ];
                }(e, i, s)) : (a = s ? "ai_content_consent_required" : "ai_consent_required", r = c && c.tool === "cv-builder" && s ? cvCopy().blocked : s ? "AI Advisor was not contacted. This action includes private content and needs explicit AI content consent." : "AI Advisor was not contacted. Review the AI data notice and continue only if you agree.",
                Promise.resolve(new Response(JSON.stringify({
                    error: a,
                    reply: r,
                    text: r
                }), {
                    status: 428,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8"
                    }
                })));
            }, t.AfroTools.aiConsentV2FetchWrapped = !0, t.AfroTools.aiConsentFetchWrapped = !0;
        }
    }(), {
        MODES: i,
        getModeConfig: l,
        hasConsent: u,
        reset: function(t, e) {
            var o = r();
            if (o) {
                if (!t) return o.removeItem(n), void Object.keys(i).forEach(function(t) {
                    o.removeItem(d(t, e));
                });
                o.removeItem(d(t, e)), "ai_optional_prompt_only" === t && o.removeItem(n);
            }
        },
        recordConsent: f,
        ensureConsent: y,
        renderNotice: g,
        enhanceAll: b,
        containsSensitivePayload: function(t) {
            return m(t, 0);
        }
    };
});
