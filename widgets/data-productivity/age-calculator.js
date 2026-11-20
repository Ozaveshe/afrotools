window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.ageCalculator = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    "Age Calculator": "Calculateur d’âge",
    "Date of Birth": "Date de naissance",
    "Calculate At (default: today)": "Date de référence (aujourd’hui par défaut)",
    "Calculate Age": "Calculer l’âge",
    Years: "Ans",
    Months: "Mois",
    Days: "Jours",
    "Total Months": "Total en mois",
    "Total Weeks": "Total en semaines",
    "Total Days": "Total en jours",
    "Total Hours": "Total en heures",
    "Next Birthday": "Prochain anniversaire",
    Zodiac: "Signe astrologique",
    Generation: "Génération",
    "Day Born": "Jour de naissance",
    "Today!": "Aujourd’hui !",
    Unknown: "Inconnu",
    "Silent Gen": "Génération silencieuse",
    "Baby Boomer": "Baby-boomer",
    "Gen X": "Génération X",
    Millennial: "Génération Y",
    "Gen Z": "Génération Z",
    "Gen Alpha": "Génération Alpha",
    Capricorn: "Capricorne",
    Aquarius: "Verseau",
    Pisces: "Poissons",
    Aries: "Bélier",
    Taurus: "Taureau",
    Gemini: "Gémeaux",
    Cancer: "Cancer",
    Leo: "Lion",
    Virgo: "Vierge",
    Libra: "Balance",
    Scorpio: "Scorpion",
    Sagittarius: "Sagittaire"
  };
  var o = (t = t || {}).theme || "light", i = "dark" === o ? "#1a1a2e" : "#fff", r = "dark" === o ? "#e2e8f0" : "#0f1419", d = "dark" === o ? "#94a3b8" : "#64748b", n = "dark" === o ? "rgba(255,255,255,.12)" : "#e2e8f0", a = "dark" === o ? "rgba(255,255,255,.06)" : "#f8fafc", l = t.accent || "#0071e3", s = "aw-age-" + Math.random().toString(36).slice(2, 8);
  e.innerHTML = '<div id="' + s + "\" style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:" + i + ";color:" + r + ";border:1px solid " + n + ';border-radius:12px;overflow:hidden;max-width:480px;"><div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + n + ';">' + translate("Age Calculator") + '</div><div style="padding:16px 18px;"><div style="margin-bottom:12px;"><label style="font-size:.7rem;font-weight:700;color:' + d + ';display:block;margin-bottom:4px;">' + translate("Date of Birth") + '</label><input type="date" id="' + s + '-dob" value="1995-06-15" style="width:100%;padding:9px 10px;border:1.5px solid ' + n + ";border-radius:7px;font-size:.9rem;font-weight:600;background:" + a + ";color:" + r + ';outline:none;"></div><div style="margin-bottom:12px;"><label style="font-size:.7rem;font-weight:700;color:' + d + ';display:block;margin-bottom:4px;">' + translate("Calculate At (default: today)") + '</label><input type="date" id="' + s + '-at" style="width:100%;padding:9px 10px;border:1.5px solid ' + n + ";border-radius:7px;font-size:.9rem;font-weight:600;background:" + a + ";color:" + r + ';outline:none;"></div><button id="' + s + '-btn" style="width:100%;padding:11px;background:' + l + ';color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;">' + translate("Calculate Age") + '</button><div id="' + s + '-results" style="display:none;margin-top:16px;"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;"><div style="background:' + a + ";border:1px solid " + n + ';border-radius:8px;padding:12px;text-align:center;"><div id="' + s + '-yrs" style="font-size:1.6rem;font-weight:800;color:' + l + ';">0</div><div style="font-size:.6rem;font-weight:700;color:' + d + ';text-transform:uppercase;">' + translate("Years") + '</div></div><div style="background:' + a + ";border:1px solid " + n + ';border-radius:8px;padding:12px;text-align:center;"><div id="' + s + '-mos" style="font-size:1.6rem;font-weight:800;color:' + l + ';">0</div><div style="font-size:.6rem;font-weight:700;color:' + d + ';text-transform:uppercase;">' + translate("Months") + '</div></div><div style="background:' + a + ";border:1px solid " + n + ';border-radius:8px;padding:12px;text-align:center;"><div id="' + s + '-dys" style="font-size:1.6rem;font-weight:800;color:' + l + ';">0</div><div style="font-size:.6rem;font-weight:700;color:' + d + ';text-transform:uppercase;">' + translate("Days") + '</div></div></div><div id="' + s + '-details" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;"></div><div id="' + s + '-bday" style="display:none;background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px;text-align:center;font-size:.82rem;font-weight:700;color:#92400e;margin-top:10px;"></div></div></div>' + (t.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + n + ";font-size:.72rem;color:" + d + ';">' + t.footerHTML + "</div>" : "") + "</div>",
  document.getElementById(s);
  var g = document.getElementById(s + "-dob"), p = document.getElementById(s + "-at"), f = document.getElementById(s + "-btn"), c = document.getElementById(s + "-results");
  function y(e, t) {
    e = translate(e);
    return '<div style="background:' + a + ";border:1px solid " + n + ';border-radius:6px;padding:8px;"><div style="font-size:.6rem;font-weight:700;color:' + d + ';text-transform:uppercase;">' + e + '</div><div style="font-size:.88rem;font-weight:800;color:' + r + ';margin-top:2px;">' + t + "</div></div>";
  }
  var ageStatus = document.createElement("p");
  ageStatus.setAttribute("role", "status");
  c.before(ageStatus);
  function localToday() {
    const date = new Date;
    return [ date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0") ].join("-");
  }
  function anniversary(birth, months) {
    const target = new Date(birth);
    target.setUTCDate(1);
    target.setUTCMonth(target.getUTCMonth() + months);
    const last = new Date(target);
    last.setUTCMonth(last.getUTCMonth() + 1);
    last.setUTCDate(0);
    target.setUTCDate(Math.min(birth.getUTCDate(), last.getUTCDate()));
    return target;
  }
  function u() {
    var e = g.value, t = p.value || localToday();
    ageStatus.textContent = "";
    if (!e || t < e) {
      c.style.display = "none";
      ageStatus.textContent = locale === "fr-FR" ? "Saisissez une naissance à la date de référence ou avant." : "Enter a birth date on or before the reference date.";
      return;
    }
    var o = new Date(e + "T00:00:00Z"), i = new Date(t + "T00:00:00Z");
    var totalMonths = (i.getUTCFullYear() - o.getUTCFullYear()) * 12 + i.getUTCMonth() - o.getUTCMonth();
    if (anniversary(o, totalMonths) > i) totalMonths--;
    var r = Math.floor(totalMonths / 12), d = totalMonths % 12, n = Math.round((i - anniversary(o, totalMonths)) / 864e5), l = Math.round((i - o) / 864e5), f = Math.floor(l / 7), u = totalMonths, m = l * 24;
    document.getElementById(s + "-yrs").textContent = r, document.getElementById(s + "-mos").textContent = d,
    document.getElementById(s + "-dys").textContent = n;
    var elapsedYears = i.getUTCFullYear() - o.getUTCFullYear(), x = anniversary(o, elapsedYears * 12), v = x.getTime() === i.getTime();
    if (x < i) x = anniversary(o, (elapsedYears + 1) * 12);
    var b = Math.round((x - i) / 864e5), h = o.getUTCMonth() + 1, w = o.getUTCDate(), k = "Unknown";
    [ {
      s: "Capricorn",
      e: "♑",
      f: [ 12, 22 ],
      t: [ 1, 19 ]
    }, {
      s: "Aquarius",
      e: "♒",
      f: [ 1, 20 ],
      t: [ 2, 18 ]
    }, {
      s: "Pisces",
      e: "♓",
      f: [ 2, 19 ],
      t: [ 3, 20 ]
    }, {
      s: "Aries",
      e: "♈",
      f: [ 3, 21 ],
      t: [ 4, 19 ]
    }, {
      s: "Taurus",
      e: "♉",
      f: [ 4, 20 ],
      t: [ 5, 20 ]
    }, {
      s: "Gemini",
      e: "♊",
      f: [ 5, 21 ],
      t: [ 6, 20 ]
    }, {
      s: "Cancer",
      e: "♋",
      f: [ 6, 21 ],
      t: [ 7, 22 ]
    }, {
      s: "Leo",
      e: "♌",
      f: [ 7, 23 ],
      t: [ 8, 22 ]
    }, {
      s: "Virgo",
      e: "♍",
      f: [ 8, 23 ],
      t: [ 9, 22 ]
    }, {
      s: "Libra",
      e: "♎",
      f: [ 9, 23 ],
      t: [ 10, 22 ]
    }, {
      s: "Scorpio",
      e: "♏",
      f: [ 10, 23 ],
      t: [ 11, 21 ]
    }, {
      s: "Sagittarius",
      e: "♐",
      f: [ 11, 22 ],
      t: [ 12, 21 ]
    } ].forEach(function(e) {
      e.f[0] > e.t[0] ? (h === e.f[0] && w >= e.f[1] || h === e.t[0] && w <= e.t[1]) && (k = e.e + " " + translate(e.s)) : (h === e.f[0] && w >= e.f[1] || h === e.t[0] && w <= e.t[1] || h > e.f[0] && h < e.t[0]) && (k = e.e + " " + translate(e.s));
    });
    var D = o.getUTCFullYear(), M = D <= 1945 ? "Silent Gen" : D <= 1964 ? "Baby Boomer" : D <= 1980 ? "Gen X" : D <= 1996 ? "Millennial" : D <= 2012 ? "Gen Z" : "Gen Alpha";
    document.getElementById(s + "-details").innerHTML = y("Total Months", u.toLocaleString()) + y("Total Weeks", f.toLocaleString()) + y("Total Days", l.toLocaleString()) + y("Total Hours", m.toLocaleString()) + y("Next Birthday", v ? translate("Today!") : b + (locale === "fr-FR" ? " jours" : " days")) + y("Zodiac", k) + y("Generation", translate(M)) + y("Day Born", o.toLocaleDateString(locale, {
      weekday: "long",
      timeZone: "UTC"
    }));
    var B = document.getElementById(s + "-bday");
    v ? (B.textContent = locale === "fr-FR" ? "Bon anniversaire ! Vous avez " + r + " ans aujourd’hui." : "Happy Birthday! You were born exactly " + r + " years ago today.",
    B.style.display = "block") : B.style.display = "none", c.style.display = "block";
    if (o.getUTCMonth() === 1 && o.getUTCDate() === 29) {
      ageStatus.textContent = locale === "fr-FR" ? "Pour cet affichage, un anniversaire du 29 février tombe le 28 février les années non bissextiles." : "This calendar counts a 29 February birthday on 28 February in non-leap years.";
    }
  }
  [ g, p ].forEach(field => field.addEventListener("input", () => {
    c.style.display = "none";
    ageStatus.textContent = "";
  }));
  p.value = localToday(), f.addEventListener("click", u), u();
};
