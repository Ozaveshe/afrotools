window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.StakingRewards = function(e, t) {
  const fr = e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr";
  const words = {
    "Staking Rewards Calculator": "Estimation des récompenses de staking",
    "Amount Staked": "Quantité de jetons placés",
    "Token Price ($)": "Prix supposé du jeton (USD)",
    "Nominal annual reward rate (%)": "Taux annuel nominal de récompense (%)",
    "Staking Duration": "Durée du placement",
    "Compounding Frequency": "Fréquence de réinvestissement",
    Daily: "Chaque jour",
    Weekly: "Chaque semaine",
    "Every 30 days": "Tous les 30 jours",
    "No reinvestment": "Sans réinvestissement",
    "Calculate Rewards": "Estimer les récompenses",
    "Estimated token rewards": "Récompenses estimées en jetons",
    "Rewards in USD": "Valeur estimée en USD",
    "Total After Staking": "Capital final en jetons",
    "Average per day": "Moyenne par jour",
    "Average per 30 days": "Moyenne sur 30 jours",
    "30 Days": "30 jours",
    "90 Days": "90 jours",
    "180 Days": "180 jours",
    "1 Year": "1 an",
    "2 Years": "2 ans",
    "3 Years": "3 ans"
  };
  const tr = key => fr ? words[key] || key : key;
  var o = "dark" === ((t = t || {}).theme || "light"), i = o ? "#1a1a2e" : "#fff", r = o ? "#e2e8f0" : "#0f1419", d = o ? "#334155" : "#e2e8f0", n = "#8b5cf6", a = o ? "#0f172a" : "#f8fafc", l = o ? "#0f172a" : "#f8fafc";
  e.innerHTML = '<div class="aw-staking" style="font-family:\'Inter\',system-ui,sans-serif;background:' + i + ";color:" + r + ";border:1px solid " + d + ';border-radius:10px;overflow:hidden"><div style="padding:15px 22px;border-bottom:1px solid ' + d + ";background:" + l + '"><span style="font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase">' + tr("Staking Rewards Calculator") + '</span></div><div style="padding:22px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px"><div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">' + tr("Amount Staked") + '</label><input type="number" id="aw-stk-amount" value="1000" min="0" step="10" style="width:100%;padding:9px 12px;border:1.5px solid ' + d + ";border-radius:7px;font-size:.82rem;background:" + a + ";color:" + r + ';font-family:inherit;box-sizing:border-box"></div><div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">' + tr("Token Price ($)") + '</label><input type="number" id="aw-stk-price" value="1" min="0.0001" step="0.01" style="width:100%;padding:9px 12px;border:1.5px solid ' + d + ";border-radius:7px;font-size:.82rem;background:" + a + ";color:" + r + ';font-family:inherit;box-sizing:border-box"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px"><div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">' + tr("Nominal annual reward rate (%)") + '</label><input type="number" id="aw-stk-apy" value="12" min="0" max="1000" step="0.1" style="width:100%;padding:9px 12px;border:1.5px solid ' + d + ";border-radius:7px;font-size:.82rem;background:" + a + ";color:" + r + ';font-family:inherit;box-sizing:border-box"></div><div><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">' + tr("Staking Duration") + '</label><select id="aw-stk-duration" style="width:100%;padding:9px 12px;border:1.5px solid ' + d + ";border-radius:7px;font-size:.82rem;background:" + a + ";color:" + r + ';font-family:inherit"><option value="30">' + tr("30 Days") + '</option><option value="90">' + tr("90 Days") + '</option><option value="180">' + tr("180 Days") + '</option><option value="365" selected>' + tr("1 Year") + '</option><option value="730">' + tr("2 Years") + '</option><option value="1095">' + tr("3 Years") + '</option></select></div></div><div style="margin-bottom:14px"><label style="display:block;font-size:.72rem;font-weight:600;color:#64748b;margin-bottom:5px">' + tr("Compounding Frequency") + '</label><select id="aw-stk-compound" style="width:100%;padding:9px 12px;border:1.5px solid ' + d + ";border-radius:7px;font-size:.82rem;background:" + a + ";color:" + r + ';font-family:inherit"><option value="1">' + tr("Daily") + '</option><option value="7">' + tr("Weekly") + '</option><option value="30" selected>' + tr("Every 30 days") + '</option><option value="365">' + tr("No reinvestment") + '</option></select></div><button id="aw-stk-btn" style="display:block;width:100%;padding:12px;border:none;border-radius:8px;font-size:.82rem;font-weight:700;cursor:pointer;background:linear-gradient(135deg,#6d28d9,' + n + ');color:#fff;font-family:inherit">' + tr("Calculate Rewards") + '</button><div id="aw-stk-result" style="display:none;margin-top:14px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><div style="text-align:center;padding:16px;background:' + (o ? "#2e1065" : "#f5f3ff") + ";border:1px solid " + (o ? "#6d28d9" : "#ddd6fe") + ';border-radius:8px;grid-column:1/-1"><div id="aw-stk-rewards" style="font-size:1.8rem;font-weight:800;color:' + n + '"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">' + tr("Estimated token rewards") + '</div></div><div style="text-align:center;padding:14px;background:' + l + ";border:1px solid " + d + ';border-radius:8px"><div id="aw-stk-rewards-usd" style="font-size:1.3rem;font-weight:800;color:' + n + '"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">' + tr("Rewards in USD") + '</div></div><div style="text-align:center;padding:14px;background:' + l + ";border:1px solid " + d + ';border-radius:8px"><div id="aw-stk-total" style="font-size:1.3rem;font-weight:800;color:' + r + '"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">' + tr("Total After Staking") + '</div></div><div style="text-align:center;padding:14px;background:' + l + ";border:1px solid " + d + ';border-radius:8px"><div id="aw-stk-daily" style="font-size:1.3rem;font-weight:800;color:' + r + '"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">' + tr("Average per day") + '</div></div><div style="text-align:center;padding:14px;background:' + l + ";border:1px solid " + d + ';border-radius:8px"><div id="aw-stk-monthly" style="font-size:1.3rem;font-weight:800;color:' + r + '"></div><div style="font-size:.68rem;color:#64748b;font-weight:600;text-transform:uppercase;margin-top:3px">' + tr("Average per 30 days") + "</div></div></div></div>" + (t.footerHTML ? '<div style="margin-top:14px">' + t.footerHTML + "</div>" : "") + "</div></div>",
  (() => {
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    e.querySelector("#aw-stk-btn").after(status);
    e.addEventListener("input", () => {
      e.querySelector("#aw-stk-result").style.display = "none";
      status.textContent = "";
    });
  })(), e.querySelector("#aw-stk-btn").addEventListener("click", function() {
    var t = parseFloat(e.querySelector("#aw-stk-amount").value) || 0, o = parseFloat(e.querySelector("#aw-stk-price").value) || 1, i = parseFloat(e.querySelector("#aw-stk-apy").value) / 100 || 0, r = parseInt(e.querySelector("#aw-stk-duration").value) || 365, d = parseInt(e.querySelector("#aw-stk-compound").value) || 30;
    const status = e.querySelector("[role=status]");
    if (Array.from(e.querySelectorAll("input")).some(input => input.value.trim() === "" || Number(input.value) < 0) || t <= 0 || i > 10) {
      status.textContent = fr ? "Vérifiez le nombre de jetons, le taux et le prix." : "Check the token amount, rate and price.";
      return;
    }
    o = Number(e.querySelector("#aw-stk-price").value);
    {
      var n = Math.floor(r / d), a = i * d / 365, l = d === 365 ? t * (1 + i * r / 365) : t * Math.pow(1 + a, n) * (1 + i * (r % d) / 365), s = l - t, p = s * o, f = s / r, u = s / (r / 30), c = function(e, t) {
        return e.toLocaleString(fr ? "fr" : "en", {
          minimumFractionDigits: t || 2,
          maximumFractionDigits: t || 2
        });
      };
      e.querySelector("#aw-stk-rewards").textContent = c(s, 4) + (fr ? " jetons" : " tokens"),
      e.querySelector("#aw-stk-rewards-usd").textContent = "$" + c(p), e.querySelector("#aw-stk-total").textContent = c(l, 4) + (fr ? " jetons" : " tokens"),
      e.querySelector("#aw-stk-daily").textContent = c(f, 6) + " / $" + c(f * o), e.querySelector("#aw-stk-monthly").textContent = c(u, 4) + " / $" + c(u * o),
      e.querySelector("#aw-stk-result").style.display = "block", status.textContent = fr ? "Simulation à taux et prix constants, avant frais." : "Estimate at a constant rate and price, before fees.";
    }
  });
};
