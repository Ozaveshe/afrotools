window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.timeZone = function(e, t) {
  if (!window.BusinessRoiEngine) {
    const url = new URL("https://afrotools.com/widgets/iframe/data-productivity-time-zone.html");
    if (location.origin === url.origin && location.pathname.replace(/\.html$/, "") === url.pathname.replace(/\.html$/, "")) {
      const link = document.createElement("a");
      const inFrench = new URLSearchParams(location.search).get("lang") === "fr";
      link.href = inFrench ? "/fr/tools/fuseaux-horaires/" : "/tools/time-zone/";
      link.textContent = inFrench ? "Ouvrir le convertisseur de fuseaux horaires" : "Open the full time zone converter";
      e.replaceChildren(link);
      return;
    }
    if (t && t.theme === "dark") url.searchParams.set("theme", "dark");
    const frame = document.createElement("iframe");
    frame.src = url.href;
    frame.title = "Time zone converter";
    frame.style.cssText = "width:100%;height:560px;border:0";
    e.replaceChildren(frame);
    return;
  }
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    Africa: "Afrique", Cairo: "Le Caire", London: "Londres", Dubai: "Dubaï", Beijing: "Pékin", "Addis Ababa": "Addis-Abeba",
    From: "Départ",
    To: "Arrivée",
    "Time Zone Converter": "Convertisseur de fuseaux horaires",
    "Live Clocks": "Heure actuelle",
    "Same day": "Même jour",
    "Next day": "Jour suivant",
    "Previous day": "Jour précédent"
  };
  var o, i = (t = t || {}).theme || "light", a = "dark" === i ? "#1a1a2e" : "#fff", n = "dark" === i ? "#e2e8f0" : "#0f1419", r = "dark" === i ? "#94a3b8" : "#64748b", d = "dark" === i ? "rgba(255,255,255,.12)" : "#e2e8f0", l = "dark" === i ? "rgba(255,255,255,.06)" : "#f8fafc", s = t.accent || "#0071e3", c = "aw-tz-" + Math.random().toString(36).slice(2, 8), m = [ {
    name: "Lagos",
    tz: "Africa/Lagos"
  }, {
    name: "Nairobi",
    tz: "Africa/Nairobi"
  }, {
    name: "Johannesburg",
    tz: "Africa/Johannesburg"
  }, {
    name: "Accra",
    tz: "Africa/Accra"
  }, {
    name: "Cairo",
    tz: "Africa/Cairo"
  }, {
    name: "London",
    tz: "Europe/London"
  }, {
    name: "New York",
    tz: "America/New_York"
  }, {
    name: "Dubai",
    tz: "Asia/Dubai"
  }, {
    name: "Tokyo",
    tz: "Asia/Tokyo"
  }, {
    name: "Sydney",
    tz: "Australia/Sydney"
  } ], g = (o = "", [ {
    g: "Africa",
    opts: [ {
      v: "Africa/Lagos",
      l: "Lagos (WAT, UTC+1)"
    }, {
      v: "Africa/Nairobi",
      l: "Nairobi (EAT, UTC+3)"
    }, {
      v: "Africa/Johannesburg",
      l: "Johannesburg (SAST, UTC+2)"
    }, {
      v: "Africa/Accra",
      l: "Accra (GMT, UTC+0)"
    }, {
      v: "Africa/Cairo",
      l: "Cairo (EET, UTC+2)"
    }, {
      v: "Africa/Casablanca",
      l: "Casablanca (WET, UTC+1)"
    }, {
      v: "Africa/Addis_Ababa",
      l: "Addis Ababa (EAT, UTC+3)"
    }, {
      v: "Africa/Dar_es_Salaam",
      l: "Dar es Salaam (EAT, UTC+3)"
    }, {
      v: "Africa/Kigali",
      l: "Kigali (CAT, UTC+2)"
    }, {
      v: "Africa/Kampala",
      l: "Kampala (EAT, UTC+3)"
    }, {
      v: "Africa/Kinshasa",
      l: "Kinshasa (WAT, UTC+1)"
    } ]
  }, {
    g: "International",
    opts: [ {
      v: "Europe/London",
      l: "London (GMT/BST)"
    }, {
      v: "America/New_York",
      l: "New York (EST/EDT)"
    }, {
      v: "America/Los_Angeles",
      l: "Los Angeles (PST/PDT)"
    }, {
      v: "Europe/Paris",
      l: "Paris (CET/CEST)"
    }, {
      v: "Asia/Dubai",
      l: "Dubai (GST, UTC+4)"
    }, {
      v: "Asia/Shanghai",
      l: "Beijing (CST, UTC+8)"
    }, {
      v: "Asia/Tokyo",
      l: "Tokyo (JST, UTC+9)"
    }, {
      v: "Asia/Kolkata",
      l: "Mumbai (IST, UTC+5:30)"
    }, {
      v: "Australia/Sydney",
      l: "Sydney (AEST/AEDT)"
    } ]
  } ].forEach(function(e) {
    o += '<optgroup label="' + translate(e.g) + '">', e.opts.forEach(function(e) {
      o += '<option value="' + e.v + '">' + translate(e.l.split(" (")[0]) + "</option>";
    }), o += "</optgroup>";
  }), o), p = new Date, f = new Date(p.getTime() - 6e4 * p.getTimezoneOffset()).toISOString().slice(0, 16);
  e.innerHTML = '<div id="' + c + "\" style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:" + a + ";color:" + n + ";border:1px solid " + d + ';border-radius:12px;overflow:hidden;max-width:560px;"><div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + d + ';">' + translate("Time Zone Converter") + '</div><div style="padding:16px 18px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;"><div><label style="font-size:.7rem;font-weight:700;color:' + r + ';display:block;margin-bottom:4px;">' + translate("From") + '</label><select id="' + c + '-fromTz" style="width:100%;padding:8px;border:1.5px solid ' + d + ";border-radius:7px;font-size:.78rem;background:" + l + ";color:" + n + ';outline:none;">' + g + '</select><input type="datetime-local" id="' + c + '-fromTime" value="' + f + '" style="width:100%;padding:8px;border:1.5px solid ' + d + ";border-radius:7px;font-size:.8rem;background:" + l + ";color:" + n + ';margin-top:6px;outline:none;"><div id="' + c + '-fromDisplay" style="font-size:1.6rem;font-weight:800;text-align:center;margin-top:8px;color:' + s + ';">--:--</div><div id="' + c + '-fromDate" style="font-size:.75rem;color:' + r + ';text-align:center;">--</div></div><div><label style="font-size:.7rem;font-weight:700;color:' + r + ';display:block;margin-bottom:4px;">' + translate("To") + '</label><select id="' + c + '-toTz" style="width:100%;padding:8px;border:1.5px solid ' + d + ";border-radius:7px;font-size:.78rem;background:" + l + ";color:" + n + ';outline:none;">' + g + '</select><div style="text-align:center;margin-top:14px;"><button id="' + c + '-swap" style="padding:6px 14px;background:' + s + ';color:#fff;border:none;border-radius:6px;font-size:.75rem;font-weight:700;cursor:pointer;">⇄ Swap</button></div><div id="' + c + '-toDisplay" style="font-size:1.6rem;font-weight:800;text-align:center;margin-top:8px;color:' + s + ';">--:--</div><div id="' + c + '-toDate" style="font-size:.75rem;color:' + r + ';text-align:center;">--</div><div style="text-align:center;"><span id="' + c + '-dayInd" style="font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:4px;display:inline-block;margin-top:4px;"></span></div></div></div><div style="margin-top:16px;border-top:1px solid ' + d + ';padding-top:12px;"><div style="font-size:.68rem;font-weight:700;color:' + r + ';text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">' + translate("Live Clocks") + '</div><div id="' + c + '-clocks" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;"></div></div></div>' + (t.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + d + ";font-size:.72rem;color:" + r + ';">' + t.footerHTML + "</div>" : "") + "</div>",
  document.getElementById(c);
  var u = document.getElementById(c + "-fromTz"), v = document.getElementById(c + "-toTz"), y = document.getElementById(c + "-fromTime"), b = document.getElementById(c + "-fromDisplay"), x = document.getElementById(c + "-fromDate"), T = document.getElementById(c + "-toDisplay"), A = document.getElementById(c + "-toDate"), h = document.getElementById(c + "-dayInd"), S = document.getElementById(c + "-clocks"), C = document.getElementById(c + "-swap");
  C.setAttribute("aria-label",locale==="fr-FR"?"Permuter les fuseaux horaires":"Swap time zones");
  const frenchOutput = locale === "fr-FR";
  const occurrence = document.createElement("select");
  occurrence.setAttribute("aria-label", frenchOutput ? "Occurrence de l’heure répétée" : "Occurrence of the repeated time");
  for (const [value, label] of [ [ "", frenchOutput ? "Choisir l’occurrence" : "Choose occurrence" ], [ "earlier", frenchOutput ? "Première occurrence" : "First occurrence" ], [ "later", frenchOutput ? "Deuxième occurrence" : "Second occurrence" ] ]) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    occurrence.append(option);
  }
  occurrence.hidden = true;
  y.after(occurrence);
  h.setAttribute("role", "status");
  function wallTime(value, zone) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).formatToParts(value).map(part => [ part.type, part.value ]));
    return parts.year + "-" + parts.month + "-" + parts.day + "T" + parts.hour + ":" + parts.minute;
  }
  let lastInstant;
  function w() {
    lastInstant = null;
    try {
      const result = window.BusinessRoiEngine.timeZone({
        localDateTime: y.value,
        fromZone: u.value,
        toZone: v.value,
        locale: frenchOutput ? "fr" : "en",
        occurrence: occurrence.value || undefined
      });
      const instant = new Date(result.iso);
      lastInstant = instant;
      for (const [zone, clock, date] of [ [ u.value, b, x ], [ v.value, T, A ] ]) {
        clock.textContent = instant.toLocaleTimeString(locale, {
          timeZone: zone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: !frenchOutput
        });
        date.textContent = instant.toLocaleDateString(locale, {
          timeZone: zone,
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric"
        });
      }
      const from = wallTime(instant, u.value).slice(0, 10), to = wallTime(instant, v.value).slice(0, 10);
      h.textContent = from === to ? translate("Same day") : to > from ? translate("Next day") : translate("Previous day");
    } catch (error) {
      b.textContent = T.textContent = "--:--";
      x.textContent = A.textContent = "";
      const ambiguous = error.message.includes("ambiguous-local-time");
      occurrence.hidden = !ambiguous;
      h.textContent = ambiguous ? frenchOutput ? "Cette heure se produit deux fois. Choisissez la première ou la deuxième occurrence." : "This local time occurs twice. Choose the first or second occurrence." : error.message.includes("nonexistent-local-time") ? frenchOutput ? "Cette heure locale n’existe pas lors du changement d’heure. Choisissez une autre heure." : "This local time is skipped by the clock change. Choose another time." : frenchOutput ? "Saisissez une date et une heure locales valides." : "Enter a valid local date and time.";
    }
  }
  function resetOccurrence() {
    occurrence.value = "";
    occurrence.hidden = true;
    w();
  }
  occurrence.addEventListener("change", w);
  function E() {
    var e = new Date;
    S.innerHTML = "", m.forEach(function(t) {
      try {
        var o = e.toLocaleString(locale, {
          timeZone: t.tz,
          hour: "2-digit",
          minute: "2-digit",
          hour12: !frenchOutput
        }), i = document.createElement("div");
        i.style.cssText = "background:" + l + ";border:1px solid " + d + ";border-radius:6px;padding:8px;text-align:center;",
        i.innerHTML = '<div style="font-size:.68rem;font-weight:700;color:' + n + ';">' + translate(t.name) + '</div><div style="font-size:.95rem;font-weight:800;color:' + s + ';">' + o + "</div>",
        S.appendChild(i);
      } catch (e) {}
    });
  }
  y.value = wallTime(new Date, u.value), v.value = "Africa/Nairobi", u.addEventListener("change", resetOccurrence),
  v.addEventListener("change", w), y.addEventListener("change", resetOccurrence),
  C.addEventListener("click", function() {
    var instant = lastInstant, e = u.value;
    u.value = v.value;
    v.value = e;
    if (instant) y.value = wallTime(instant, u.value);
    resetOccurrence();
  }), w(), E(), setInterval(E, 6e4);
};
