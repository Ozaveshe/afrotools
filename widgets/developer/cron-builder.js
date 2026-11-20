window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.cronBuilder = function(e, r) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    "Cron Expression": "Expression cron",
    Copy: "Copier",
    Minute: "Minute",
    Hour: "Heure",
    Day: "Jour du mois",
    Month: "Mois",
    Weekday: "Jour de la semaine",
    "Every minute": "Chaque minute",
    "Copied!": "Copié !",
    "Every hour": "Chaque heure",
    "Daily midnight": "Chaque jour à minuit",
    "Weekdays 9am": "Du lundi au vendredi à 9 h",
    Monthly: "Chaque mois",
    "Next 5 Runs": "Cinq prochaines exécutions"
  };
  var t = "dark" === ((r = r || {}).theme || "light"), o = t ? "#1a1a2e" : "#fff", n = t ? "#e0e0e0" : "#333", a = t ? "#16213e" : "#f5f7fa", i = t ? "#333" : "#ddd";
  e.innerHTML = '<div class="aw-cron-builder" style="font-family:\'Inter\',sans-serif;background:' + o + ";color:" + n + ";padding:20px;border-radius:10px;border:1px solid " + i + '"><div class="aw-field" style="margin-bottom:12px"><label class="aw-label" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">' + translate("Cron Expression") + '</label><div style="display:flex;gap:8px"><input type="text" class="aw-input aw-cron-expr" value="* * * * *" style="flex:1;padding:10px;border:1px solid ' + i + ";border-radius:6px;font-family:'Courier New',monospace;font-size:15px;background:" + a + ";color:" + n + ';box-sizing:border-box;text-align:center;letter-spacing:2px"><button class="aw-btn aw-cron-copy" style="padding:8px 12px;background:' + a + ";color:" + n + ";border:1px solid " + i + ';border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit">' + translate("Copy") + '</button></div></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(4.4rem,1fr));gap:8px;margin-bottom:12px">' + [ {
    label: "Minute",
    id: "min",
    placeholder: "0-59 or *"
  }, {
    label: "Hour",
    id: "hour",
    placeholder: "0-23 or *"
  }, {
    label: "Day",
    id: "dom",
    placeholder: "1-31 or *"
  }, {
    label: "Month",
    id: "mon",
    placeholder: "1-12 or *"
  }, {
    label: "Weekday",
    id: "dow",
    placeholder: "0-6 or *"
  } ].map(function(e) {
    return '<div class="aw-field"><label class="aw-label" style="display:block;font-size:11px;font-weight:600;margin-bottom:4px">' + translate(e.label) + '</label><input type="text" class="aw-input aw-cron-' + e.id + '" value="*" style="width:100%;padding:6px;border:1px solid ' + i + ";border-radius:4px;font-family:'Courier New',monospace;font-size:13px;background:" + a + ";color:" + n + ';box-sizing:border-box;text-align:center" placeholder="' + (locale === "fr-FR" ? e.placeholder.replace(" or ", " ou ") : e.placeholder) + '"></div>';
  }).join("") + '</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"><button class="aw-btn aw-cron-preset" data-val="* * * * *" style="padding:4px 10px;background:' + a + ";color:" + n + ";border:1px solid " + i + ';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">' + translate("Every minute") + '</button><button class="aw-btn aw-cron-preset" data-val="0 * * * *" style="padding:4px 10px;background:' + a + ";color:" + n + ";border:1px solid " + i + ';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">' + translate("Every hour") + '</button><button class="aw-btn aw-cron-preset" data-val="0 0 * * *" style="padding:4px 10px;background:' + a + ";color:" + n + ";border:1px solid " + i + ';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">' + translate("Daily midnight") + '</button><button class="aw-btn aw-cron-preset" data-val="0 9 * * 1-5" style="padding:4px 10px;background:' + a + ";color:" + n + ";border:1px solid " + i + ';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">' + translate("Weekdays 9am") + '</button><button class="aw-btn aw-cron-preset" data-val="0 0 1 * *" style="padding:4px 10px;background:' + a + ";color:" + n + ";border:1px solid " + i + ';border-radius:4px;cursor:pointer;font-size:11px;font-family:inherit">' + translate("Monthly") + '</button></div><div class="aw-result-box aw-cron-desc" style="padding:10px;background:' + a + ";border:1px solid " + i + ';border-radius:6px;font-size:13px;margin-bottom:10px"></div><div class="aw-field"><label class="aw-label" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px">' + translate("Next 5 Runs") + '</label><div class="aw-cron-next" style="font-size:12px;font-family:\'Courier New\',monospace"></div></div>' + (r.footerHTML ? '<div style="margin-top:12px">' + r.footerHTML + "</div>" : "") + "</div>";
  var l = e.querySelector(".aw-cron-expr"), d = e.querySelector(".aw-cron-desc"), s = e.querySelector(".aw-cron-next"), p = {
    min: e.querySelector(".aw-cron-min"),
    hour: e.querySelector(".aw-cron-hour"),
    dom: e.querySelector(".aw-cron-dom"),
    mon: e.querySelector(".aw-cron-mon"),
    dow: e.querySelector(".aw-cron-dow")
  };
  function c() {
    const french = locale === "fr-FR";
    const fields = l.value.trim().split(/\s+/);
    const ranges = [ [ 0, 59 ], [ 0, 23 ], [ 1, 31 ], [ 1, 12 ], [ 0, 7 ] ];
    function parseField(text, min, max) {
      const values = new Set;
      for (const part of text.split(",")) {
        const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
        if (!match) return null;
        const step = Number(match[2] || 1);
        const bounds = match[1] === "*" ? [ min, max ] : match[1].split("-").map(Number);
        const start = bounds[0], end = bounds[1] === undefined ? match[2] ? max : start : bounds[1];
        if (start < min || end > max || start > end || !Number.isSafeInteger(step) || step < 1) return null;
        for (let value = start; value <= end; value += step) values.add(value);
      }
      return values;
    }
    const numeric = fields.length === 5 && fields.map((field, i) => parseField(field, ...ranges[i]));
    s.replaceChildren();
    if (!numeric || numeric.some(field => !field)) {
      d.textContent = french ? "Vérifiez les cinq champs numériques : minutes (0–59), heures (0–23), jour (1–31), mois (1–12) et jour de semaine (0–7)." : "Check five numeric fields: minute (0–59), hour (0–23), day (1–31), month (1–12) and weekday (0–7).";
      return;
    }
    Object.values(p).forEach((field, i) => {
      field.value = fields[i];
    });
    const [minute, hour, dayOfMonth, month, dayOfWeek] = fields;
    let explanation;
    if (minute === "*" && hour === "*") explanation = french ? "Chaque minute" : "Every minute"; else if (hour === "*" && /^\d+$/.test(minute)) explanation = french ? "À la minute " + minute + " de chaque heure" : "At minute " + minute + " of each hour"; else if (/^\d+$/.test(minute) && /^\d+$/.test(hour)) explanation = (french ? "À " : "At ") + hour.padStart(2, "0") + ":" + minute.padStart(2, "0"); else explanation = (french ? "Minutes : " : "Minutes: ") + minute + (french ? " · heures : " : " · hours: ") + hour;
    if (month !== "*") explanation += (french ? " · mois : " : " · months: ") + month;
    if (dayOfMonth !== "*") explanation += (french ? " · jour du mois : " : " · day of month: ") + dayOfMonth;
    if (dayOfWeek !== "*") explanation += (!dayOfMonth.includes("*") && !dayOfWeek.includes("*") ? french ? " ou " : " or " : " · ") + (french ? "jour de semaine : " : "weekday: ") + dayOfWeek;
    d.textContent = explanation + " · " + Intl.DateTimeFormat().resolvedOptions().timeZone;
    const format = new Intl.DateTimeFormat(french ? "fr-FR" : undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    });
    const cursor = new Date;
    cursor.setSeconds(0, 0);
    cursor.setMinutes(cursor.getMinutes() + 1);
    const limit = cursor.getFullYear() + 8;
    let count = 0;
    while (cursor.getFullYear() < limit && count < 5) {
      const day = numeric[2].has(cursor.getDate()), weekday = numeric[4].has(cursor.getDay()) || cursor.getDay() === 0 && numeric[4].has(7);
      const daysMatch = fields[2].includes("*") || fields[4].includes("*") ? day && weekday : day || weekday;
      if (!numeric[3].has(cursor.getMonth() + 1) || !daysMatch) {
        cursor.setDate(cursor.getDate() + 1);
        cursor.setHours(0, 0, 0, 0);
        continue;
      }
      if (!numeric[1].has(cursor.getHours())) {
        cursor.setTime(cursor.getTime() + (60 - cursor.getMinutes()) * 6e4);
        continue;
      }
      if (numeric[0].has(cursor.getMinutes())) {
        const row = document.createElement("div");
        const time = document.createElement("time");
        time.dateTime = cursor.toISOString();
        time.textContent = format.format(cursor);
        row.append(time);
        s.append(row);
        count++;
      }
      cursor.setTime(cursor.getTime() + 6e4);
    }
    if (!count) s.textContent = french ? "Aucune exécution dans les huit prochaines années." : "No runs in the next eight years.";
  }
  function f() {
    l.value = [ p.min.value, p.hour.value, p.dom.value, p.mon.value, p.dow.value ].join(" "),
    c();
  }
  l.addEventListener("input", c), Object.keys(p).forEach(function(e) {
    p[e].addEventListener("input", f);
  }), e.querySelectorAll(".aw-cron-preset").forEach(function(e) {
    e.addEventListener("click", function() {
      l.value = this.dataset.val, c();
    });
  }), e.querySelector(".aw-cron-copy").addEventListener("click", function() {
    var e = this;
    (async function() {
      try {
        await navigator.clipboard.writeText(l.value);
        e.textContent = translate("Copied!");
      } catch {
        l.focus();
        l.select();
        e.textContent = locale === "fr-FR" ? "Expression sélectionnée : utilisez la commande Copier" : "Expression selected: use your Copy command";
      }
      setTimeout(function() {
        e.textContent = translate("Copy");
      }, 3e3);
    })();
  }), c();
};
