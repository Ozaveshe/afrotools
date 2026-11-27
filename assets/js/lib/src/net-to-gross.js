// Source owner for assets/js/lib/net-to-gross.js; regenerate with scripts/minify.js --only=net-to-gross.
!function() {
    "use strict";
    var e = function() {
        return (document.documentElement.lang || "").toLowerCase().startsWith("fr");
    };
    function isSwahili() {
        return (document.documentElement.lang || "").toLowerCase().startsWith("sw");
    }
    function localizeSwahili() {
        if (!isSwahili()) return;
        const labels = {
            "Gross → Net": "Ghafi → Halisi", "Net → Gross": "Halisi → Ghafi",
            "Monthly Take-Home Pay": "Mshahara Halisi wa Mwezi", "Annual Take-Home Pay": "Mshahara Halisi wa Mwaka",
            "Required Monthly Gross": "Mshahara Ghafi wa Mwezi Unaohitajika", "Required Annual Gross": "Mshahara Ghafi wa Mwaka Unaohitajika",
            "Desired Monthly Take-Home": "Mshahara Halisi wa Mwezi Unaolengwa", "Desired take-home amount": "Kiasi cha Mshahara Halisi Kinacholengwa"
        };
        document.querySelectorAll('.mode-btn, #resLabel, .res-hero-label, .slider-label, #sliderLabelText, [data-net-to-gross-label]').forEach(function(node) {
            const text = node.textContent.trim();
            if (labels[text]) node.textContent = labels[text];
        });
        const line = document.getElementById('resGross') || document.querySelector('.res-hero-gross');
        if (line) line.textContent = line.textContent.replace(/Gross:/g, 'Ghafi:').replace(/Take-home:/g, 'Halisi:').replace(/\/month/g, '/mwezi').replace(/\/year/g, '/mwaka');
        const period = document.querySelector('.res-hero-period');
        if (period) period.textContent = window.CALC_MODE === 'net' ? 'Kabla ya PAYE na michango uliyochagua' : 'Baada ya PAYE na michango uliyochagua';
    }
    function hasAnnualSalaryInput() {
        return Boolean(document.querySelector('#grossSalary[data-net-to-gross-period="annual"]'));
    }
    function renderAnnualSalary() {
        if (!hasAnnualSalaryInput() || !window.RESULT) return false;
        const result = window.RESULT;
        const monthly = Boolean(document.querySelector('.per-btn.on[onclick*="monthly"]'));
        const divisor = monthly ? 12 : 1;
        const gross = result.gross / divisor;
        const net = (result.netAnnual ?? result.net) / divisor;
        const reverse = window.CALC_MODE === 'net';
        let unit = monthly ? 'month' : 'year';
        let heading = reverse ? (monthly ? 'Required Monthly Gross' : 'Required Annual Gross') : (monthly ? 'Monthly Take-Home Pay' : 'Annual Take-Home Pay');
        let grossLabel = 'Gross: ', netLabel = 'Take-home: ';
        if (e()) {
            unit = monthly ? 'mois' : 'an';
            heading = reverse ? (monthly ? 'Brut mensuel requis' : 'Brut annuel requis') : (monthly ? 'Salaire net mensuel' : 'Salaire net annuel');
            grossLabel = 'Brut : '; netLabel = 'Net : ';
        } else if (isSwahili()) {
            unit = monthly ? 'mwezi' : 'mwaka';
            heading = reverse ? (monthly ? 'Mshahara Ghafi wa Mwezi Unaohitajika' : 'Mshahara Ghafi wa Mwaka Unaohitajika') : (monthly ? 'Mshahara Halisi wa Mwezi' : 'Mshahara Halisi wa Mwaka');
            grossLabel = 'Ghafi: '; netLabel = 'Halisi: ';
        }
        const label = document.getElementById('resLabel') || document.querySelector('.res-hero-label');
        label.textContent = heading;
        (document.getElementById('resAmount') || document.querySelector('.res-hero-amount')).textContent = fmt(reverse ? gross : net);
        (document.getElementById('resGross') || document.querySelector('.res-hero-gross')).textContent = grossLabel + fmt(gross) + '/' + unit
            + (reverse ? ' · ' + netLabel + fmt(net) + '/' + unit : '');
        return true;
    }
    function wholeGrossForTarget(estimate, target) {
        const forward = window._grossToNet;
        const candidate = Math.max(0, Math.ceil(estimate));
        if (!forward) return candidate;
        let high = candidate;
        if (forward(high) < target) {
            let step = 1;
            high += step;
            for (let attempt = 0; attempt < 32 && forward(high) < target; attempt++) {
                step *= 2;
                high += step;
            }
        }
        if (forward(high) < target) return candidate;
        const rawBreakpoints = typeof window._grossToNetBreakpoints === 'function'
            ? window._grossToNetBreakpoints() : window._grossToNetBreakpoints;
        const breakpoints = Array.isArray(rawBreakpoints) ? rawBreakpoints
            .filter(function(point) { return Number.isSafeInteger(point) && point >= 0 && point < high; })
            .sort(function(a, b) { return a - b; }) : [];
        let start = 0;
        for (const end of breakpoints.concat(high)) {
            if (end < start) continue;
            if (forward(end) >= target) {
                let left = start, right = end;
                while (left < right) {
                    const middle = Math.floor((left + right) / 2);
                    if (forward(middle) >= target) right = middle;
                    else left = middle + 1;
                }
                return left;
            }
            start = end + 1;
        }
        return high;
    }
    function t() {
        window._grossToNet ? (function() {
            const t = document.querySelector(".calc-btn");
            if (!t || !window._grossToNet) return;
            if (document.querySelector(".mode-toggle")) return;
            var n = e();
            const o = document.createElement("div");
            o.className = "mode-toggle", o.innerHTML = '\n      <button class="mode-btn on" onclick="setCalcMode(\'gross\',this)">' + (n ? "Brut → Net" : "Gross &rarr; Net") + '</button>\n      <button class="mode-btn" onclick="setCalcMode(\'net\',this)">' + (n ? "Net → Brut" : "Net &rarr; Gross") + "</button>\n    ", 
            t.parentNode.insertBefore(o, t);
            o.querySelectorAll('button').forEach(function(button) { button.type = 'button'; button.setAttribute('aria-pressed', String(button.classList.contains('on'))); });
            localizeSwahili();
        }(), function() {
            if (window._grossToNet) {
                var t = window.calculate;
                t && !t._hooked && (window.calculate = function() {
                    var n = e();
                    if ("net" === window.CALC_MODE) {
                        var o = document.getElementById("grossSalary"), r = parseFloat(o.value) || 0;
                        if (r <= 0) return void t();
                        var a = function(e) {
                            const t = window._grossToNet;
                            if (!t) return e;
                            let n = e, o = 3 * e;
                            for (let r = 0; r < 60; r++) {
                                const r = (n + o) / 2, a = t(r);
                                if (Math.abs(a - e) < 1) return r;
                                a < e ? n = r : o = r;
                            }
                            return (n + o) / 2;
                        }(r);
                        o.value = wholeGrossForTarget(a, r);
                        var u = document.getElementById("salarySlider");
                        u && (u.value = o.value);
                        var s = document.getElementById("sliderVal");
                        s && window.fmt && (s.textContent = window.fmt(Number(o.value))), t(), function(e) {
                            var t = window.RESULT;
                            if (t && !renderAnnualSalary()) {
                                var o = window.fmt || function(e) {
                                    return Math.round(e).toLocaleString();
                                }, r = "monthly" === (window.PERIOD || "monthly"), a = t.annualGross && !t.monthly && t.gross === t.annualGross, u = document.getElementById("resLabel") || document.querySelector(".res-hero-label"), s = document.getElementById("resAmount") || document.querySelector(".res-hero-amount"), l = document.getElementById("resGross") || document.querySelector(".res-hero-gross");
                                if (u && (u.textContent = n ? r ? "Brut mensuel requis" : "Brut annuel requis" : "Required " + (r ? "Monthly" : "Annual") + " Gross"), 
                                s) {
                                    var d = a || r ? e : 12 * e;
                                    s.textContent = o(d);
                                }
                                var i = t.netMonthly || t.net || 0, c = t.annualNet || 12 * i || 0, m = r ? i : c, w = a || r ? e : 12 * e, y = n ? r ? "mois" : "an" : r ? "month" : "year";
                                l && (l.textContent = (n ? "Brut : " : "Gross: ") + o(w) + "/" + y + (n ? " · Net : " : " · Take-home: ") + o(m) + "/" + y);
                            }
                        }(isSwahili() && window.RESULT ? window.RESULT.gross : Number(o.value));
                        // Preserve the requested net in every locale so repeated calculations keep the same target.
                        o.value = r;
                        if (u) u.value = r;
                        if (s && window.fmt) s.textContent = window.fmt(r);
                    } else {
                        t();
                        var l = document.getElementById("resLabel") || document.querySelector(".res-hero-label");
                        if (l && window.RESULT && !renderAnnualSalary()) {
                            var d = window.PERIOD || "monthly";
                            l.textContent = n ? "monthly" === d ? "Salaire net mensuel" : "Salaire net annuel" : ("monthly" === d ? "Monthly" : "Annual") + " Take-Home Pay";
                        }
                    }
                    localizeSwahili();
                }, window.calculate._hooked = !0);
            }
        }(), function() {
            if (window._grossToNet) {
                var t = window.setPeriod;
                t && !t._hooked && (window.setPeriod = function(n, o) {
                    var r = e();
                    t(n, o);
                    if (renderAnnualSalary()) return;
                    if ("net" === window.CALC_MODE && window.RESULT) {
                        var a = window.RESULT, u = window.fmt || function(e) {
                            return Math.round(e).toLocaleString();
                        }, s = "monthly" === n, l = a.gross || a.annualGross || 0, d = a.annualGross && !a.monthly, i = document.getElementById("resLabel") || document.querySelector(".res-hero-label"), c = document.getElementById("resAmount") || document.querySelector(".res-hero-amount"), m = document.getElementById("resGross") || document.querySelector(".res-hero-gross");
                        if (i && (i.textContent = r ? s ? "Brut mensuel requis" : "Brut annuel requis" : "Required " + (s ? "Monthly" : "Annual") + " Gross"), 
                        c) {
                            var w = d || s ? 1 : 12;
                            c.textContent = u(l * (d ? s ? 1 / 12 : 1 : w));
                        }
                        var y = a.netMonthly || a.net || 0, h = s ? y : a.annualNet || 12 * y, f = d ? s ? l / 12 : l : s ? l : 12 * l, g = r ? s ? "mois" : "an" : s ? "month" : "year";
                        m && (m.textContent = (r ? "Brut : " : "Gross: ") + u(f) + "/" + g + (r ? " · Net : " : " · Take-home: ") + u(h) + "/" + g);
                    }
                    localizeSwahili();
                }, window.setPeriod._hooked = !0);
            }
        }()) : setTimeout(t, 200);
    }
    window.CALC_MODE = window.CALC_MODE || "gross", window.setCalcMode = function(t, n) {
        window.CALC_MODE = t, document.querySelectorAll(".mode-toggle .mode-btn").forEach(function(e) {
            e.classList.remove("on");
        }), n && n.classList.add("on");
        document.querySelectorAll('.mode-btn').forEach(function(button) { button.setAttribute('aria-pressed', String(button.classList.contains('on'))); });
        const o = "net" === t;
        var r = e(), a = document.querySelector(".slider-label") || document.querySelector("#sliderLabelText"), u = document.querySelector("[data-net-to-gross-label]") || document.querySelector(".f-label-text");
        if (a && !a.hasAttribute('data-orig')) a.setAttribute('data-orig', a.textContent);
        if (isSwahili()) {
            const input = document.getElementById('grossSalary');
            if (input) {
                input.setAttribute('aria-label', o ? (hasAnnualSalaryInput() ? 'Mshahara Halisi wa Mwaka Unaolengwa' : 'Mshahara Halisi wa Mwezi Unaolengwa') : 'Mshahara Ghafi');
                if (window.RESULT) input.value = o ? (hasAnnualSalaryInput() ? (window.RESULT.netAnnual ?? window.RESULT.net) : (window.RESULT.netMonthly || window.RESULT.net || 0)) : window.RESULT.gross;
            }
        }
        a && (a.textContent = o ? r ? (hasAnnualSalaryInput() ? "Salaire net annuel souhaité" : "Salaire net souhaité") : hasAnnualSalaryInput() ? (isSwahili() ? "Mshahara Halisi wa Mwaka Unaolengwa" : "Desired Annual Take-Home") : "Desired Monthly Take-Home" : a.getAttribute("data-orig") || a.textContent),
        u && (u.getAttribute("data-orig") || u.setAttribute("data-orig", u.textContent), 
        u.textContent = o ? r ? "Montant net souhaité" : "Desired take-home amount" : u.getAttribute("data-orig")), 
        window.RESULT && "function" == typeof window.calculate && window.calculate();
        localizeSwahili();
    }, "loading" === document.readyState ? document.addEventListener("DOMContentLoaded", function() {
        setTimeout(t, 100);
    }) : setTimeout(t, 100);
}();
