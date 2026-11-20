window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.workingDays = function(e, t) {
  if (!window.AfroTools?.leaveHolidayReference) {
    const url = new URL("https://afrotools.com/widgets/iframe/data-productivity-working-days.html");
    if (location.origin === url.origin && location.pathname.replace(/\.html$/, "") === url.pathname.replace(/\.html$/, "")) {
      const link = document.createElement("a");
      const inFrench = new URLSearchParams(location.search).get("lang") === "fr";
      link.href = inFrench ? "/fr/tools/jours-ouvrables/" : "/tools/working-days/";
      link.textContent = inFrench ? "Ouvrir le calculateur de jours ouvrés" : "Open the working days calculator";
      e.replaceChildren(link);
      return;
    }
    if (t && t.theme === "dark") url.searchParams.set("theme", "dark");
    const frame = document.createElement("iframe");
    frame.src = url.href;
    frame.title = "Working days calculator";
    frame.style.cssText = "width:100%;height:560px;border:0";
    e.replaceChildren(frame);
    return;
  }
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    "Working Days Calculator": "Calculateur de jours ouvrés",
    "Start Date": "Date de début",
    "End Date": "Date de fin",
    "Country (for public holidays)": "Pays du calendrier",
    Nigeria: "Nigéria",
    Kenya: "Kenya",
    "South Africa": "Afrique du Sud",
    Ghana: "Ghana",
    "No holidays (weekends only)": "Aucun calendrier (week-ends uniquement)",
    Calculate: "Calculer",
    "Working Days": "Jours ouvrés",
    Calendar: "Jours calendaires",
    Weekends: "Jours de week-end",
    Holidays: "Jours de fermeture en semaine",
    "New Year's Day": "Jour de l’an",
    "Good Friday": "Vendredi saint",
    "Easter Monday": "Lundi de Pâques",
    "Christmas Day": "Noël",
    "Boxing Day": "Lendemain de Noël",
    "Workers' Day": "Fête du Travail",
    "Labour Day": "Fête du Travail",
    "Democracy Day": "Journée de la démocratie",
    "Independence Day": "Fête de l’indépendance",
    "Human Rights Day": "Journée des droits humains",
    "Human Rights Day (observed)": "Journée des droits humains (report)",
    "Family Day": "Journée de la famille",
    "Freedom Day": "Journée de la liberté",
    "Youth Day": "Journée de la jeunesse",
    "National Women's Day": "Journée nationale des femmes",
    "National Women's Day (observed)": "Journée nationale des femmes (report)",
    "Heritage Day": "Journée du patrimoine",
    "Day of Reconciliation": "Journée de la réconciliation",
    "Day of Goodwill": "Journée de la bienveillance",
    "Day of Goodwill (observed)": "Journée de la bienveillance (report)",
    "May Day": "Fête du Travail",
    "Farmers' Day": "Journée des agriculteurs",
    "Constitution Day": "Journée de la Constitution"
  };
  var n = (t = t || {}).theme || "light", a = "dark" === n ? "#1a1a2e" : "#fff", o = "dark" === n ? "#e2e8f0" : "#0f1419", d = "dark" === n ? "#94a3b8" : "#64748b", i = "dark" === n ? "rgba(255,255,255,.12)" : "#e2e8f0", r = "dark" === n ? "rgba(255,255,255,.06)" : "#f8fafc", l = t.accent || "#0071e3", s = "aw-wd-" + Math.random().toString(36).slice(2, 8), p = "width:100%;padding:9px 10px;border:1.5px solid " + i + ";border-radius:7px;font-size:.9rem;font-weight:600;background:" + r + ";color:" + o + ";outline:none;font-family:inherit;", y = new Date, g = new Date;
  g.setMonth(g.getMonth() + 3);
  var f = y.toISOString().split("T")[0], c = g.toISOString().split("T")[0];
  let note, extraDates, sourceLink;
  const sourceUrls = {
    ng: "https://interior.gov.ng/",
    gh: "https://mint.gov.gh/documents/statutory-holidays-commemorative-days-in-the-republic-of-ghana-for-the-year-2026",
    ke: "https://new.kenyalaw.org/akn/ke/act/1912/21",
    za: "https://www.gov.za/about-sa/public-holidays"
  };
  function b() {
    const input = id => document.getElementById(s + "-" + id);
    const start = input("start").value, end = input("end").value, country = input("country").value;
    const result = input("results"), list = input("holList"), fr = locale === "fr-FR";
    list.replaceChildren();
    result.style.display = "none";
    sourceLink.hidden = country === "none";
    if (!sourceLink.hidden) sourceLink.href = sourceUrls[country];
    if (!start || !end || end < start) {
      note.textContent = fr ? "Saisissez une période avec une fin égale ou postérieure au début." : "Enter a range ending on or after its start.";
      return;
    }
    const manual = extraDates.value.trim().split(/[\s,;]+/).filter(Boolean);
    if (manual.some(date => !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
      note.textContent = fr ? "Saisissez chaque date au format AAAA-MM-JJ." : "Enter each extra date as YYYY-MM-DD.";
      return;
    }
    const reference = window.AfroTools?.leaveHolidayReference?.[country.toUpperCase()] || {};
    const all = new Map;
    for (const year of Object.keys(reference)) {
      for (const day of reference[year]) all.set(day.d, day.n);
    }
    if (country === "za") {
      all.set("2026-08-10", "National Women's Day (observed)");
      for (const [date, title] of Object.entries({
        "01-01": "New Year's Day",
        "03-21": "Human Rights Day",
        "03-22": "Human Rights Day (observed)",
        "03-26": "Good Friday",
        "03-29": "Family Day",
        "04-27": "Freedom Day",
        "05-01": "Workers' Day",
        "06-16": "Youth Day",
        "08-09": "National Women's Day",
        "09-24": "Heritage Day",
        "12-16": "Day of Reconciliation",
        "12-25": "Christmas Day",
        "12-26": "Day of Goodwill",
        "12-27": "Day of Goodwill (observed)"
      })) all.set("2027-" + date, title);
    }
    if (country === "ke") {
      for (const year of [ "2025", "2026" ]) if (all.has(year + "-10-10")) all.set(year + "-10-10", "Mazingira Day");
    }
    for (const date of manual) if (!all.has(date)) all.set(date, fr ? "Date ajoutée" : "Added date");
    const first = new Date(start + "T00:00:00Z"), last = new Date(end + "T00:00:00Z");
    const total = Math.round((last - first) / 864e5) + 1;
    const fullWeeks = Math.floor(total / 7);
    let weekend = fullWeeks * 2;
    for (let i = 0; i < total % 7; i++) {
      const day = (first.getUTCDay() + i) % 7;
      if (day === 0 || day === 6) weekend++;
    }
    const excluded = Array.from(all).filter(([date]) => {
      if (date < start || date > end) return false;
      const day = new Date(date + "T00:00:00Z").getUTCDay();
      return day !== 0 && day !== 6;
    }).sort(([a], [b]) => a.localeCompare(b));
    input("cal").textContent = total;
    input("we").textContent = weekend;
    input("hol").textContent = excluded.length;
    input("work").textContent = total - weekend - excluded.length;
    const years = Object.keys(reference);
    if (country === "za" && !years.includes("2027")) years.push("2027");
    if (country === "none") note.textContent = fr ? "Les samedis, dimanches et dates ajoutées sont exclus. Les deux bornes sont incluses." : "Both endpoints are included. Saturdays, Sundays and added dates are excluded."; else note.textContent = (fr ? "Estimation à partir des dates de référence pour " : "Planning count using reference dates for ") + (years.sort().join(", ") || (fr ? "aucune année disponible" : "no available years")) + (fr ? ". Ajoutez les jours de fermeture ou fêtes annoncées manquantes. Hors de ces années, seules vos dates et les fins de semaine sont exclues." : ". Add missing proclaimed holidays or local closures. Outside these years only weekends and your dates are excluded.");
    if (excluded.length) {
      const title = document.createElement("strong");
      title.textContent = fr ? "Dates de semaine exclues" : "Excluded weekday dates";
      list.append(title);
    }
    for (const [date, name] of excluded) {
      const row = document.createElement("div");
      row.textContent = new Date(date + "T00:00:00Z").toLocaleDateString(locale, {
        dateStyle: "medium",
        timeZone: "UTC"
      }) + " · " + translate(name);
      list.append(row);
    }
    result.style.display = "block";
  }
  function begin() {
    const button = document.getElementById(s + "-btn");
    const fr = locale === "fr-FR", label = document.createElement("label");
    label.style.display = "block";
    label.textContent = fr ? "Autres dates de fermeture (AAAA-MM-JJ, séparées par des virgules)" : "Additional closure dates (YYYY-MM-DD, separated by commas)";
    extraDates = document.createElement("textarea");
    extraDates.rows = 2;
    extraDates.style.width = "100%";
    label.append(extraDates);
    note = document.createElement("p");
    note.setAttribute("role", "status");
    sourceLink = document.createElement("a");
    sourceLink.target = "_blank";
    sourceLink.rel = "noopener noreferrer";
    sourceLink.textContent = fr ? "Consulter la source officielle" : "Open the official holiday source";
    button.before(label);
    button.after(note, sourceLink);
    button.addEventListener("click", b);
    for (const element of [ extraDates, document.getElementById(s + "-start"), document.getElementById(s + "-end"), document.getElementById(s + "-country") ]) element.addEventListener("input", b);
    b();
  }
  e.innerHTML = '<div id="' + s + "\" style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:" + a + ";color:" + o + ";border:1px solid " + i + ';border-radius:12px;overflow:hidden;max-width:480px;"><div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + i + ';">' + translate("Working Days Calculator") + '</div><div style="padding:16px 18px;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;"><div><label style="font-size:.7rem;font-weight:700;color:' + d + ';display:block;margin-bottom:4px;">' + translate("Start Date") + '</label><input type="date" id="' + s + '-start" value="' + f + '" style="' + p + '"></div><div><label style="font-size:.7rem;font-weight:700;color:' + d + ';display:block;margin-bottom:4px;">' + translate("End Date") + '</label><input type="date" id="' + s + '-end" value="' + c + '" style="' + p + '"></div></div><div style="margin-bottom:12px;"><label style="font-size:.7rem;font-weight:700;color:' + d + ';display:block;margin-bottom:4px;">' + translate("Country (for public holidays)") + '</label><select id="' + s + '-country" style="' + p + '"><option value="ng">' + translate("Nigeria") + '</option><option value="ke">' + translate("Kenya") + '</option><option value="za">' + translate("South Africa") + '</option><option value="gh">' + translate("Ghana") + '</option><option value="none">' + translate("No holidays (weekends only)") + '</option></select></div><button id="' + s + '-btn" style="width:100%;padding:11px;background:' + l + ';color:#fff;border:none;border-radius:8px;font-size:.88rem;font-weight:700;cursor:pointer;">' + translate("Calculate") + '</button><div id="' + s + '-results" style="display:none;margin-top:16px;background:' + ("dark" === n ? "rgba(255,255,255,.04)" : "linear-gradient(135deg,#0f172a,#1e293b)") + ';border-radius:10px;padding:22px;text-align:center;"><div style="font-size:.68rem;font-weight:700;color:rgba(255,255,255,.4);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">' + translate("Working Days") + '</div><div id="' + s + '-work" style="font-size:2.6rem;font-weight:800;color:#38bdf8;line-height:1;">0</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px;"><div style="padding:10px;background:rgba(255,255,255,.06);border-radius:6px;"><div style="font-size:.58rem;font-weight:600;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:2px;">' + translate("Calendar") + '</div><div id="' + s + '-cal" style="font-size:1.1rem;font-weight:800;color:#fff;">0</div></div><div style="padding:10px;background:rgba(255,255,255,.06);border-radius:6px;"><div style="font-size:.58rem;font-weight:600;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:2px;">' + translate("Weekends") + '</div><div id="' + s + '-we" style="font-size:1.1rem;font-weight:800;color:#fff;">0</div></div><div style="padding:10px;background:rgba(255,255,255,.06);border-radius:6px;"><div style="font-size:.58rem;font-weight:600;color:rgba(255,255,255,.35);text-transform:uppercase;margin-bottom:2px;">' + translate("Holidays") + '</div><div id="' + s + '-hol" style="font-size:1.1rem;font-weight:800;color:#fff;">0</div></div></div></div><div id="' + s + '-holList" style="margin-top:10px;"></div></div>' + (t.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + i + ";font-size:.72rem;color:" + d + ';">' + t.footerHTML + "</div>" : "") + "</div>",
  begin();
};
