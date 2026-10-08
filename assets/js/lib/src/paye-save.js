!function() {
    "use strict";
    function copy(key) {
        var language=(document.documentElement.lang||'en').split('-')[0];
        var values={save:['Save This Calculation','Enregistrer ce calcul','Hifadhi hesabu hii'],saved:['Saved!','Enregistré !','Imehifadhiwa!'],name:['Name this calculation:','Nommez ce calcul :','Ipe hesabu hii jina:'],heading:['Your Saved Calculations','Vos calculs enregistrés','Hesabu zako zilizohifadhiwa'],open:['Open','Ouvrir','Fungua'],remove:['Delete','Supprimer','Futa'],confirm:['Delete this saved calculation?','Supprimer ce calcul enregistré ?','Ufute hesabu hii iliyohifadhiwa?'],invalid:['This saved calculation cannot be opened. Your current inputs are unchanged.','Ce calcul ne peut pas être ouvert. Les valeurs actuelles sont conservées.','Hesabu hii haiwezi kufunguliwa. Ingizo lako la sasa halijabadilishwa.']};
        return values[key][language==='fr'?1:language==='sw'?2:0];
    }
    function report(error) {
        var save=document.getElementById('payeSaveBtn');if(save){save.textContent=copy('save');save.style.background='#fff';save.style.color='#0062CC';}
        var section=document.getElementById('paye-saved-section');if(section)section.style.display='';
        var status=document.getElementById('payeStorageStatus');
        if(!status){status=document.createElement('p');status.id='payeStorageStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');(section||document.body).appendChild(status);}
        status.textContent=error&&error.code==='INVALID_PAYLOAD'?copy('invalid'):window.SaveState.message(error,document.documentElement.lang);
    }
    function clearFailure(){var status=document.getElementById('payeStorageStatus');if(status)status.remove();}
    function validPayload(value){
        if(!value||typeof value!=='object'||Array.isArray(value))return false;
        var fields=0;
        return Object.keys(value).every(function(key){
            var v=value[key],control=document.getElementById(key);
            if(['__proto__','constructor','prototype'].includes(key))return false;
            if(key==='summary'||key==='_mode')return typeof v==='string';
            if(!['string','number','boolean'].includes(typeof v)||(typeof v==='number'&&!Number.isFinite(v)))return false;
            if(control&&/^(INPUT|SELECT|TEXTAREA)$/.test(control.tagName)){
                fields++;
                if(control.type==='checkbox')return typeof v==='boolean';
                return typeof v==='string'||typeof v==='number';
            }
            return true;
        })&&fields>0;
    }
    function e() {
        var e = window.PAYE_SAVE_SLUG;
        if (e && "undefined" != typeof SaveState) {
            var o = new SaveState(e, {
                maxFree: 20
            });
            !function(e, n) {
                var o = document.querySelector(".tool-page .container, .paye-page .container, main .container, .crumb");
                if (o || (o = document.querySelector(".card, .calc-card")), o) {
                    var a = document.createElement("div");
                    a.id = "paye-saved-section", a.style.cssText = "max-width:900px;margin:0 auto;padding:20px 20px 0;", 
                    o.classList.contains("crumb") ? o.parentNode.insertBefore(a, o.nextSibling) : o.parentNode.insertBefore(a, o), 
                    t(e, n, a);
                }
            }(o, e), function(e, n) {
                var o = document.getElementById("calcBtn") || document.querySelector('.calc-btn');
                if (o) {
                    var a = document.createElement("div");
                    a.style.cssText = "display:none;margin-top:12px;text-align:center;", a.id = "paye-save-wrapper", 
                    a.innerHTML = '<button id="payeSaveBtn" style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px;background:#fff;border:1.5px solid #0062CC;border-radius:10px;color:#0062CC;font-family:inherit;font-size:.8rem;font-weight:700;cursor:pointer;transition:background .15s,color .15s;"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 1v12M1 7h12"/></svg>Save This Calculation</button>', 
                    o.parentElement.insertBefore(a, o.nextSibling);
                    document.getElementById('payeSaveBtn').type='button';
                    document.getElementById('payeSaveBtn').textContent=copy('save');
                    o.addEventListener('click',function(){setTimeout(function(){a.style.display='';},0);});
                    var r = window.calculate;
                    "function" == typeof r && (window.calculate = function() {
                        r.apply(this, arguments), a.style.display = "";
                    }), document.getElementById("payeSaveBtn").addEventListener("click", function() {
                        var o = prompt(copy('name'));
                        if (o) {
                            var a, r = function() {
                                var e = {};
                                document.querySelectorAll('.card input[type="text"], .card input[type="number"], .card input[type="range"], .card select, .card input[type="checkbox"], .card input[type="radio"], .calc-card input[type="text"], .calc-card input[type="number"], .calc-card input[type="range"], .calc-card select, .calc-card input[type="checkbox"], .calc-card input[type="radio"]').forEach(function(t) {
                                    t.id && ("checkbox" === t.type ? e[t.id] = t.checked : "radio" === t.type ? t.checked && (e[t.name || t.id] = t.value) : e[t.id] = t.value);
                                });
                                var t = document.querySelector(".mode-btn.on");
                                return t && (e._mode = t.textContent.trim()), e;
                            }();
                            r.summary = (a = document.getElementById("resAmount") || document.querySelector(".res-hero-amount")) ? a.textContent.trim() : "";
                            try { e.save({
                                title: o,
                                data: r
                            }); } catch(error) { report(error);return; }
                            clearFailure();
                            var i = document.getElementById("payeSaveBtn"), d = copy('save');
                            i.textContent = copy('saved'), i.style.background = "#0062CC", i.style.color = "#fff", 
                            setTimeout(function() {
                                i.innerHTML = d, i.style.background = "#fff", i.style.color = "#0062CC";
                            }, 1500);
                            var c = document.getElementById("paye-saved-section");
                            c && t(e, n, c);
                        }
                    });
                }
            }(o, e);
            var a = new URLSearchParams(window.location.search).get("id");
            a && setTimeout(function() {
                n(o, a);
            }, 500);
        }
    }
    function t(e, a, r) {
        var i;
        try { i=e.getAll(); } catch(error) { report(error);return; }
        clearFailure();
        if (i.length) {
            r.style.display = "";
            var d = '<div style="background:#fff;border:1.5px solid #e5e7eb;border-radius:14px;padding:20px;margin-bottom:16px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;"><h3 style="font-size:.95rem;font-weight:800;color:#111827;margin:0;">Your Saved Calculations</h3></div><div style="display:flex;flex-wrap:wrap;gap:10px;">';
            i.forEach(function(e) {
                var t = e.data && e.data.summary ? e.data.summary : "";
                d += '<div class="paye-saved-card" data-id="' + o(e.id) + '" style="flex:1;min-width:200px;max-width:280px;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:10px;padding:14px;cursor:pointer;transition:border-color .15s,box-shadow .15s;"><div style="font-size:.82rem;font-weight:700;color:#111827;margin-bottom:4px;">' + o(e.title) + "</div>" + (t ? '<div style="font-size:.72rem;color:#6b7280;margin-bottom:6px;">' + o(t) + "</div>" : "") + '<div style="display:flex;align-items:center;justify-content:space-between;"><span style="font-size:.65rem;color:#9ca3af;">' + function(e) {
                    var t = Math.floor((Date.now() - e) / 1e3);
                    if (t < 60) return "just now";
                    if (t < 3600) return Math.floor(t / 60) + "m ago";
                    if (t < 86400) return Math.floor(t / 3600) + "h ago";
                    var n = Math.floor(t / 86400);
                    return n < 30 ? n + "d ago" : new Date(e).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    });
                }(e.updatedAt) + '</span><button class="paye-del-btn" data-del="' + o(e.id) + '" style="background:none;border:none;color:#ef4444;font-size:.68rem;font-weight:700;cursor:pointer;padding:2px 6px;">Delete</button></div></div>';
            }), d += "</div></div>", r.innerHTML = d, r.querySelectorAll(".paye-saved-card").forEach(function(t) {
                t.addEventListener("click", function(o) {
                    if (!o.target.classList.contains("paye-del-btn")) {
                        var a = t.getAttribute("data-id");
                        n(e, a);
                    }
                }), t.addEventListener("mouseenter", function() {
                    t.style.borderColor = "#0062CC", t.style.boxShadow = "0 2px 8px rgba(0,98,204,.1)";
                }), t.addEventListener("mouseleave", function() {
                    t.style.borderColor = "#e5e7eb", t.style.boxShadow = "none";
                });
            }), r.querySelectorAll(".paye-del-btn").forEach(function(n) {
                n.addEventListener("click", function(o) {
                    o.stopPropagation();
                    var a = n.getAttribute("data-del");
                    if(confirm(copy('confirm'))){
                        try { e.delete(a); } catch(error) { report(error);return; }
                        t(e,window.PAYE_SAVE_SLUG,r);
                        var next=r.querySelector('button')||document.getElementById('payeSaveBtn')||document.querySelector('.calc-btn');if(next)next.focus();
                    }
                });
            });
            r.querySelector('h3').textContent=copy('heading');
            r.querySelectorAll('.paye-del-btn').forEach(function(button){button.type='button';button.textContent=copy('remove');button.style.minHeight='44px';button.style.minWidth='44px';});
            r.querySelectorAll('.paye-saved-card').forEach(function(card){var button=document.createElement('button');button.type='button';button.className='paye-open-btn';button.textContent=copy('open');button.style.minHeight='44px';button.style.minWidth='44px';card.appendChild(button);});
        } else { r.replaceChildren();r.style.display = "none"; }
    }
    function n(e, t) {
        var n;
        try { n=e.load(t); } catch(error) { report(error);return; }
        if (n && n.data) {
            var o = n.data;
            if(!validPayload(o)){report({code:'INVALID_PAYLOAD'});return;}
            clearFailure();
            // Mode handlers may prefill from the current result. Select the mode
            // first so the saved fields remain authoritative afterward.
            if(o._mode)document.querySelectorAll('.mode-btn').forEach(function(button){
                if(button.textContent.trim()===o._mode&&!button.classList.contains('on'))button.click();
            });
            Object.keys(o).forEach(function(e) {
                if ("summary" !== e && "_mode" !== e) {
                    var t = document.getElementById(e);
                    t && ("checkbox" === t.type ? (t.checked = !!o[e], t.dispatchEvent(new Event("change", {
                        bubbles: !0
                    }))) : (t.value = o[e], t.dispatchEvent(new Event("input", {
                        bubbles: !0
                    }))));
                }
            }), setTimeout(function() {
                "function" == typeof window.calculate && window.calculate();
            }, 200), setTimeout(function() {
                var e = document.getElementById("resultsCard") || document.querySelector(".results-card");
                e && e.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 500);
        }
    }
    function o(e) {
        return e ? String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;") : "";
    }
    "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", e) : e();
}();
