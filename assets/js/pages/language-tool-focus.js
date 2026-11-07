!function() {
    "use strict";
    var e = window.location.pathname;
    "/" !== e.slice(-1) && (e += "/");
    var t = {
        "/tools/swahili-translator/": {
            id: "swahili-translator",
            title: "Swahili phrase handoff",
            lead: "Package the selected phrase, category, pronunciation note, and local confirmation step before travel, school, or customer use.",
            checks: [ "Confirm country or dialect context for public-facing copy.", "Keep important phrases simple and polite.", "Ask a fluent speaker to check pronunciation before printing or recording." ]
        },
        "/tools/yoruba-translator/": {
            id: "yoruba-translator",
            title: "Yoruba tone and phrase handoff",
            lead: "Capture the phrase, tone-mark caution, pronunciation note, and where the wording will be used.",
            checks: [ "Tone marks can change meaning; verify them locally.", "Use respectful forms for elders, customers, and formal settings.", "Do not treat phrasebook output as certified translation." ]
        },
        "/tools/pidgin-translator/": {
            id: "pidgin-translator",
            title: "Pidgin message handoff",
            lead: "Turn a casual translation or phrasebook result into a shareable note with audience, tone, and fallback wording.",
            checks: [ "Match the wording to the audience and country context.", "Keep customer-support copy clear, not overly slang-heavy.", "Use plain English fallback for contracts, safety, health, or payments." ]
        },
        "/tools/transliterate/": {
            id: "transliterate",
            title: "Script transliteration handoff",
            lead: "Save the source text, target script, output, and proofread checklist before signage, publishing, or classroom use.",
            checks: [ "Treat transliteration as a draft until proofread by a fluent reader.", "Check right-to-left rendering for N Ko and Ajami-style use.", "Confirm public names and sacred text before printing." ]
        },
        "/tools/african-name-meaning/": {
            id: "african-name-meaning",
            title: "Name meaning handoff",
            lead: "Keep spelling, origin, meaning, tone or dialect caveats, and family confirmation in one local note.",
            checks: [ "Meanings can shift by spelling, tone, dialect, and family usage.", "Confirm with fluent speakers or elders before registration or publication.", "Keep legal-document spelling clear if home spelling differs." ]
        }
    }[e];
    function a() {
        document.querySelectorAll(".tab-icon").forEach(function(e) {
            var t = o(e.parentNode ? e.parentNode.textContent : e.textContent);
            e.setAttribute("data-mark", String(t || "").replace(/[^A-Za-z0-9\s]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map(function(e) {
                return e.charAt(0).toUpperCase();
            }).join("").slice(0, 2) || "L"), e.setAttribute("aria-hidden", "true");
        });
    }
    function n(e) {
        var t = getComputedStyle(e), a = e.getBoundingClientRect();
        return "none" !== t.display && "hidden" !== t.visibility && a.width > 0 && a.height > 0;
    }
    function o(e) {
        return String(e || "").replace(/\s+/g, " ").trim();
    }
    function r(e) {
        var t = Object.create(null);
        return e.filter(function(e) {
            return !t[e] && (t[e] = !0, !0);
        });
    }
    function i(e) {
        var t = document.createElement("textarea");
        t.value = e, t.setAttribute("readonly", ""), t.style.position = "fixed", t.style.left = "-9999px",
        document.body.appendChild(t), t.select(), document.execCommand("copy"), t.remove();
    }
    function l(e, t) {
        e && (e.textContent = t);
    }
    function s(e) {
        return String(e || "").replace(/[&<>"']/g, function(e) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[e];
        });
    }
    function currentBriefResults(tool) {
        var pidgin = tool.id === 'pidgin-translator';
        var cloudInput = document.querySelector(pidgin ? '#srcText' : '#translateInput');
        var cloudOutput = document.querySelector(pidgin ? '#tgtOutput' : '#translateOutput');
        var translateButton = document.querySelector('#translateBtn');
        var label = document.querySelector(pidgin ? '#tgtLabel' : '#translateOutputLabel');
        var search = document.querySelector('#search');
        if (cloudInput && o(cloudInput.value)) {
            if (!cloudOutput || !n(cloudOutput)) return ['No current translation is visible. Your original text is included above.'];
            var result = o(cloudOutput.textContent);
            if (translateButton && /^Translating/i.test(o(translateButton.textContent))) {
                return ['Translation is still pending. No previous result is included. Your original text is included above.'];
            }
            if (!result || /^(?:Translation (?:will appear|not available)|Cloud translation (?:appears|is unavailable)|Translating)/i.test(result)) {
                return ['No current translation is available. Your original text is included above.'];
            }
            // Pidgin's legacy controller can display a late response for edited text.
            // Only its controller can attest successful output ownership; never infer
            // freshness merely because some text is visible in its output region.
            if (pidgin && (cloudOutput.getAttribute('data-translation-state') !== 'ready'
                || cloudOutput.getAttribute('data-translation-input') !== cloudInput.value
                || cloudOutput.getAttribute('data-translation-output') !== cloudOutput.textContent
                || cloudOutput.getAttribute('data-translation-target-label') !== o(label && label.textContent))) {
                return ['The visible Pidgin translation could not be matched to the current text. It is omitted; your original text is included above.'];
            }
            return [(o(label && label.textContent) || 'Translation') + ': ' + result];
        }
        if (tool.id === 'transliterate') {
            var source = document.querySelector('#input');
            var mapped = document.querySelector('#output');
            return source && o(source.value) && mapped && n(mapped) && o(mapped.textContent)
                ? ['Mapped script output: ' + o(mapped.textContent)]
                : ['No mapped script output yet. Enter supported Latin mapping tokens in the tool.'];
        }
        var selectors = tool.id === 'african-name-meaning' ? ['.name-card']
            : search && o(search.value) ? ['.phrase:not([style*="display: none"])'] : [];
        var results = [];
        selectors.forEach(function(selector) {
            document.querySelectorAll(selector).forEach(function(node) {
                if (n(node) && o(node.textContent)) results.push(o(node.textContent));
            });
        });
        results = r(results);
        if (results.length) return [tool.id === 'african-name-meaning'
            ? 'Visible name matches (up to 8):' : 'Current phrase search matches (up to 8):'].concat(results.slice(0, 8));
        return [search && o(search.value) ? 'No visible phrase matches for the current search.'
            : 'No custom-text translation or phrase search selected. Enter text to translate or search the local phrasebook.'];
    }
    t && document.addEventListener("DOMContentLoaded", function() {
        document.body.classList.add("language-tool-focus"), document.querySelectorAll(".script-card .sample").forEach(function(e) {
            e.textContent = e.textContent.replace(/\\u([0-9a-fA-F]{4})/g, function(e, t) {
                return String.fromCharCode(parseInt(t, 16));
            });
        }), a(), function(e) {
            if (!document.querySelector('[data-language-handoff="' + e.id + '"]')) {
                var t = document.createElement("section");
                t.className = "language-handoff", t.setAttribute("data-language-handoff", e.id),
                t.innerHTML = [ '<details class="language-handoff-card"><summary>Copy or download current result</summary>', '<div class="language-handoff-head">', '<div><p class="language-kicker">Local-first language brief</p>', "<h2>" + s(e.title) + "</h2>", "<p>" + s(e.lead) + "</p></div>", "</div>", '<div class="language-grid">', "<div>", '<output class="language-output" data-language-output aria-live="polite"></output>', '<div class="language-actions">', '<button type="button" data-language-primary data-language-action="refresh">Refresh brief</button>', '<button type="button" data-language-action="copy">Copy</button>', '<button type="button" data-language-action="download">Download TXT</button>', '<button type="button" data-language-action="save">Save locally</button>', "</div>", '<div class="language-status" data-language-status role="status" aria-live="polite"></div>', "</div>", "<div>", '<ul class="language-checks">' + e.checks.map(function(e) {
                    return "<li>" + s(e) + "</li>";
                }).join("") + "</ul>", "<p><strong>Privacy:</strong> creating this brief does not send text. Optional cloud translation is a separate action that sends the text you choose after consent. Copy and download are your actions; Save locally retains this brief on this device.</p>", "</div>", "</div>", "</details>" ].join("");
                function mountBrief() {
                    var host = null;
                    if (e.id === 'pidgin-translator') host = document.querySelector('#panel-translate');
                    else if (e.id === 'swahili-translator' || e.id === 'yoruba-translator') host = document.querySelector('#liveTranslateCard');
                    else if (e.id === 'transliterate') {
                        var mappedOutput = document.querySelector('#output');
                        host = mappedOutput && mappedOutput.closest ? mappedOutput.closest('.card') : null;
                    } else if (e.id === 'african-name-meaning') host = document.querySelector('#panel-search .card-body');
                    if (host && t.parentNode !== host) { host.appendChild(t); return true; }
                    return false;
                }
                mountBrief();
                var u = t.querySelector("[data-language-output]"), d = t.querySelector("[data-language-status]");
                t.addEventListener("click", function(t) {
                    var a = t.target.closest("[data-language-action]");
                    if (a) {
                        var n, o, r, s, c, f = a.getAttribute("data-language-action");
                        if ([ "refresh", "copy", "download", "save" ].indexOf(f) > -1 && p(), "copy" === f && function(e, t) {
                            navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(e).then(t).catch(function() {
                                i(e), t();
                            }) : (i(e), t());
                        }(u.textContent, function() {
                            l(d, "Copied language brief.");
                        }), "download" === f && (n = e.id + "-language-brief.txt", o = u.textContent, r = new Blob([ o ], {
                            type: "text/plain;charset=utf-8"
                        }), s = URL.createObjectURL(r), (c = document.createElement("a")).href = s, c.download = n,
                        document.body.appendChild(c), c.click(), c.remove(), setTimeout(function() {
                            URL.revokeObjectURL(s);
                        }, 500), l(d, "Downloaded a local text brief.")), "save" === f) try {
                            localStorage.setItem("afrotools:language-brief:" + e.id, JSON.stringify({
                                savedAt: (new Date).toISOString(),
                                brief: u.textContent
                            })), l(d, "Saved locally in this browser.");
                        } catch (e) {
                            l(d, "Local save was blocked by this browser.");
                        }
                    }
                });
                var refreshQueued = false;
                function queueRefresh() {
                    if (refreshQueued) return;
                    refreshQueued = true;
                    window.setTimeout(function() { refreshQueued = false; p(); }, 0);
                }
                document.addEventListener('input', queueRefresh);
                document.addEventListener('change', queueRefresh);
                document.addEventListener('afrotools:external-translation-consent-change', queueRefresh);
                if (typeof MutationObserver === 'function') {
                    var resultSelector = '#translateOutput, #tgtOutput, #output, #translateStatus, .phrase, .name-card';
                    new MutationObserver(function(records) {
                        if (mountBrief()) queueRefresh();
                        if (records.some(function(record) {
                            var node = record.target.nodeType === 1 ? record.target : record.target.parentElement;
                            if (!node || node.closest('[data-language-handoff]')) return false;
                            return node.matches(resultSelector) || node.closest(resultSelector) || node.querySelector(resultSelector);
                        })) queueRefresh();
                    }).observe(document.body, { childList: true, subtree: true, characterData: true,
                        attributes: true, attributeFilter: ['style', 'hidden', 'aria-hidden', 'data-translation-state'] });
                }
                p();
                window.setTimeout(p, 150);
            }
            function p() {
                a(), u.textContent = function(e) {
                    var t, a = [];
                    a.push(((t = document.querySelector("h1")) ? o(t.innerText || t.textContent) : "") || e.title),
                    a.push("Generated: " + (new Date).toLocaleString()), a.push(""), a.push("Visible inputs");
                    var i = r(Array.prototype.slice.call(document.querySelectorAll("input, select, textarea")).map(function(e) {
                        if (e.disabled || "hidden" === e.type || "radio" === e.type && !e.checked || !n(e)) return "";
                        var t = function(e) {
                            var t = e.closest("label");
                            if (t) return o(t.textContent);
                            var a = e.getAttribute("id"), n = a ? document.querySelector('label[for="' + function(e) {
                                return window.CSS && CSS.escape ? CSS.escape(e) : String(e).replace(/"/g, '\\"');
                            }(a) + '"]') : null;
                            return o(n && n.textContent || e.getAttribute("aria-label") || e.getAttribute("placeholder") || e.name || e.id || "Field");
                        }(e), a = "checkbox" === e.type ? e.checked ? "Checked" : "Not checked" : "SELECT" === e.tagName && e.options[e.selectedIndex] ? e.options[e.selectedIndex].text : e.value;
                        return a = o(a), t && a ? t + ": " + a : "";
                    }).filter(Boolean)).slice(0, 18);
                    return a.push(i.length ? i.map(function(e) {
                        return "- " + e;
                    }).join("\n") : "- Use the search, phrasebook, translator, name, or transliteration field, then refresh this brief."),
                    a.push(""), a.push("Current task result"), currentBriefResults(e).forEach(function(e) {
                        a.push("- " + e);
                    }), a.push(""), a.push("Checks before sharing"), e.checks.forEach(function(e) {
                        a.push("- " + e);
                    }), a.push(""), a.push("Privacy and confidence"), a.push("- Creating or refreshing this brief makes no translation request. Optional cloud translation is separate and sends chosen text after consent. Save locally keeps the brief on this device."),
                    a.push("- Phrasebook, name-meaning, and transliteration results are drafts, not certified translation or official cultural authority."),
                    a.join("\n");
                }(e), l(d, "Brief refreshed from visible fields and current result.");
            }
        }(t);
    });
}();
