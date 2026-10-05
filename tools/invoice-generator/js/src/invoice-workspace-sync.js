// Invoice workspace source. Generate with node scripts/minify.js --only=invoice-workspace-sync
!function(e, t) {
    "use strict";
    var n = "invoice-draft", a = "afro_invoice_draft", i = null, o = null, r = "", c = !1, u = !1;
    function s() {
        return e.AfroWorkspace || null;
    }
    function l() {
        return e.AfroInvoiceState || null;
    }
    function d(e) {
        var t = s();
        t && t.writeJson(a, e);
    }
    function f(e) {
        return e ? s().getTimestamp(e.updatedAt || e.savedAt) : 0;
    }
    function v() {
        var e = l();
        return e && "function" == typeof e.gatherState ? {
            state: e.gatherState(),
            updatedAt: (new Date).toISOString()
        } : null;
    }
    function y(e) {
        var t = e || v();
        if (!t || !t.state) return null;
        var a = t.state, i = a.in || a.cn || "Invoice Draft", o = [];
        return a.cl && o.push(a.cl), a.cu && o.push(a.cu), a.id && o.push(a.id), {
            itemType: n,
            itemKey: "current",
            toolSlug: "invoice-generator",
            title: i,
            summary: o.join(" | "),
            href: "/tools/invoice-generator/",
            payload: t,
            meta: {
                currency: a.cu || "",
                invoiceNumber: a.in || ""
            }
        };
    }
    function p(e) {
        var t = l();
        if (!t || !e || !e.state || typeof t.restoreState !== "function" || !t.restoreState(e.state)) return false;
        if (typeof t.updatePreview === "function") t.updatePreview();
        d(e);
        return true;
    }
    function g() {
        clearTimeout(i), i = setTimeout(function() {
            var e = v();
            e && (d(e), clearTimeout(o), o = setTimeout(m, 1200));
        }, 800);
    }
    async function m() {
        if (c && !u && s() && s().isSignedIn()) {
            var e = y();
            if (e) {
                var t = JSON.stringify(e.payload);
                if (t !== r) {
                    u = !0;
                    try {
                        await s().upsert(e), r = t;
                    } catch (e) {
                        console.warn("[InvoiceWorkspaceSync] Sync failed", { code: "operation_failed" });
                    } finally {
                        u = !1;
                    }
                }
            }
        }
    }
    async function S() {
        if (!c && s() && s().isSignedIn() && l()) {
            var e, t = (e = s()) ? e.readJson(a, null) : null, i = null;
            try {
                i = await s().get(n, "current");
            } catch (e) {
                console.warn("[InvoiceWorkspaceSync] Remote bootstrap failed", { code: "operation_failed" });
            }
            var o = i && i.payload ? i.payload : null;
            if (o && f(o) >= f(t)) p(o), r = JSON.stringify(o); else if (t) {
                p(t);
                try {
                    await s().upsert(y(t)), r = JSON.stringify(t);
                } catch (e) {
                    console.warn("[InvoiceWorkspaceSync] Failed to upload local draft", { code: "operation_failed" });
                }
            } else {
                var u = v();
                if (u) {
                    d(u);
                    try {
                        await s().upsert(y(u)), r = JSON.stringify(u);
                    } catch (e) {
                        console.warn("[InvoiceWorkspaceSync] Failed to seed remote draft", { code: "operation_failed" });
                    }
                }
            }
            c = !0;
        }
    }
    function w() {
        // Local recovery also works while signed out. An explicit shared invoice
        // takes priority over the draft already on this browser.
        if (s() && l() && !s().isSignedIn()) {
            var shared = new URLSearchParams(e.location.search);
            if (t.body.dataset.invoiceSharedRestored !== "1" && !shared.has("cn")) p(s().readJson(a, null));
        }
        s() && l() && (function() {
            if ("1" !== t.body.dataset.invoiceWorkspaceBound) {
                t.body.dataset.invoiceWorkspaceBound = "1";
                var n = t.querySelector(".inv-page");
                n && (n.addEventListener("input", g), n.addEventListener("change", g));
                t.addEventListener("afro-invoice-restored", g);
                var a = t.getElementById("btnNewInvoice");
                a && a.addEventListener("click", function() {
                    setTimeout(g, 0);
                }), e.addEventListener("beforeunload", function() {
                    var e = v();
                    e && d(e);
                });
            }
        }(), S().then(function() {
            c && (g(), e.setInterval(m, 5e3), e.addEventListener("focus", function() {
                c = !1, S();
            }));
        }));
    }
    // Deferred scripts can execute at interactive before the enhancement's
    // DOMContentLoaded wrapper is installed. Restore the complete state after it.
    "complete" !== t.readyState ? t.addEventListener("DOMContentLoaded", w) : w();
}(window, document);
