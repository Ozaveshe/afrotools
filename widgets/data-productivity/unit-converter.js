window.AfroWidgets = window.AfroWidgets || {}, window.AfroWidgets.unitConverter = function(e, t) {
  var locale = e && e.ownerDocument.documentElement.dataset.afroWidgetLocale === "fr" ? "fr-FR" : "en";
  function translate(label) {
    return locale === "fr-FR" && french[label] || label;
  }
  var french = {
    "Unit Converter": "Convertisseur d’unités",
    From: "Unité de départ",
    To: "Unité d’arrivée",
    Length: "Longueur",
    Weight: "Masse",
    Volume: "Volume",
    Temperature: "Température",
    Speed: "Vitesse",
    Area: "Surface",
    Data: "Données",
    "Kilometre (km)": "Kilomètre (km)",
    "Metre (m)": "Mètre (m)",
    "Centimetre (cm)": "Centimètre (cm)",
    "Millimetre (mm)": "Millimètre (mm)",
    Mile: "Mile terrestre",
    Yard: "Yard",
    Foot: "Pied",
    Inch: "Pouce",
    "Nautical Mile": "Mille marin",
    Micrometre: "Micromètre",
    "Tonne (t)": "Tonne (t)",
    "Kilogram (kg)": "Kilogramme (kg)",
    "Gram (g)": "Gramme (g)",
    "Milligram (mg)": "Milligramme (mg)",
    "Pound (lb)": "Livre (lb)",
    "Ounce (oz)": "Once (oz)",
    "Stone (st)": "Stone (st)",
    "Troy Ounce": "Once troy",
    "Litre (L)": "Litre (L)",
    "Millilitre (mL)": "Millilitre (mL)",
    "Cubic Metre": "Mètre cube",
    "US Gallon": "Gallon américain",
    "US Quart": "Quart de gallon américain",
    "US Pint": "Pinte américaine",
    "US Cup": "Tasse américaine",
    "US Fluid Oz": "Once liquide américaine",
    "UK Gallon": "Gallon impérial",
    "UK Pint": "Pinte impériale",
    "Celsius (°C)": "Degré Celsius (°C)",
    "Fahrenheit (°F)": "Degré Fahrenheit (°F)",
    "Kelvin (K)": "Kelvin (K)",
    Knot: "Nœud",
    "Square Kilometre": "Kilomètre carré",
    "Hectare (ha)": "Hectare (ha)",
    "Square Metre": "Mètre carré",
    Acre: "Acre",
    "Square Foot": "Pied carré",
    "Nigerian Plot (648m²)": "Parcelle modèle de 648 m² (Nigéria)",
    "SA Morgen": "Morgen sud-africain",
    "Ghana Acra Plot": "Parcelle modèle de 2 023,43 m² (Ghana)",
    "Terabyte (TB)": "Téraoctet (To)",
    "Gigabyte (GB)": "Gigaoctet (Go)",
    "Megabyte (MB)": "Mégaoctet (Mo)",
    "Kilobyte (KB)": "Kilooctet (ko)",
    "Byte (B)": "Octet (o)",
    "Bit (b)": "Bit (b)"
  };
  var o = (t = t || {}).theme || "light", r = "dark" === o ? "#1a1a2e" : "#fff", i = "dark" === o ? "#e2e8f0" : "#1a1a2e", l = "dark" === o ? "#94a3b8" : "#64748b", n = "dark" === o ? "rgba(255,255,255,.12)" : "#e2e8f0", a = "dark" === o ? "rgba(255,255,255,.06)" : "#f8fafc", d = t.accent || "#0071e3", s = "aw-uc-" + Math.random().toString(36).slice(2, 8), u = {
    length: {
      label: translate("Length"),
      icon: "📏",
      units: [ {
        l: translate("Kilometre (km)"),
        v: 1e3
      }, {
        l: translate("Metre (m)"),
        v: 1
      }, {
        l: translate("Centimetre (cm)"),
        v: .01
      }, {
        l: translate("Millimetre (mm)"),
        v: .001
      }, {
        l: translate("Mile"),
        v: 1609.34
      }, {
        l: translate("Yard"),
        v: .9144
      }, {
        l: translate("Foot"),
        v: .3048
      }, {
        l: translate("Inch"),
        v: .0254
      }, {
        l: translate("Nautical Mile"),
        v: 1852
      }, {
        l: translate("Micrometre"),
        v: 1e-6
      } ],
      fromIdx: 1,
      toIdx: 4
    },
    weight: {
      label: translate("Weight"),
      icon: "⚖️",
      units: [ {
        l: translate("Tonne (t)"),
        v: 1e3
      }, {
        l: translate("Kilogram (kg)"),
        v: 1
      }, {
        l: translate("Gram (g)"),
        v: .001
      }, {
        l: translate("Milligram (mg)"),
        v: 1e-6
      }, {
        l: translate("Pound (lb)"),
        v: .453592
      }, {
        l: translate("Ounce (oz)"),
        v: .0283495
      }, {
        l: translate("Stone (st)"),
        v: 6.35029
      }, {
        l: translate("Troy Ounce"),
        v: .0311035
      } ],
      fromIdx: 1,
      toIdx: 4
    },
    volume: {
      label: translate("Volume"),
      icon: "🧪",
      units: [ {
        l: translate("Litre (L)"),
        v: 1
      }, {
        l: translate("Millilitre (mL)"),
        v: .001
      }, {
        l: translate("Cubic Metre"),
        v: 1e3
      }, {
        l: translate("US Gallon"),
        v: 3.78541
      }, {
        l: translate("US Quart"),
        v: .946353
      }, {
        l: translate("US Pint"),
        v: .473176
      }, {
        l: translate("US Cup"),
        v: .236588
      }, {
        l: translate("US Fluid Oz"),
        v: .0295735
      }, {
        l: translate("UK Gallon"),
        v: 4.54609
      }, {
        l: translate("UK Pint"),
        v: .568261
      } ],
      fromIdx: 0,
      toIdx: 3
    },
    temperature: {
      label: translate("Temperature"),
      icon: "🌡️",
      units: [ {
        l: translate("Celsius (°C)"),
        v: "C"
      }, {
        l: translate("Fahrenheit (°F)"),
        v: "F"
      }, {
        l: translate("Kelvin (K)"),
        v: "K"
      } ],
      fromIdx: 0,
      toIdx: 1,
      special: !0
    },
    speed: {
      label: translate("Speed"),
      icon: "🚀",
      units: [ {
        l: "km/h",
        v: 1
      }, {
        l: "m/s",
        v: 3.6
      }, {
        l: "mph",
        v: 1.60934
      }, {
        l: translate("Knot"),
        v: 1.852
      } ],
      fromIdx: 0,
      toIdx: 2
    },
    area: {
      label: translate("Area"),
      icon: "🗺️",
      units: [ {
        l: translate("Square Kilometre"),
        v: 1e6
      }, {
        l: translate("Hectare (ha)"),
        v: 1e4
      }, {
        l: translate("Square Metre"),
        v: 1
      }, {
        l: translate("Acre"),
        v: 4046.86
      }, {
        l: translate("Square Foot"),
        v: .092903
      }, {
        l: translate("Nigerian Plot (648m²)"),
        v: 648
      }, {
        l: translate("SA Morgen"),
        v: 8564.7
      }, {
        l: translate("Ghana Acra Plot"),
        v: 2023.43
      } ],
      fromIdx: 2,
      toIdx: 3
    },
    data: {
      label: translate("Data"),
      icon: "💾",
      units: [ {
        l: translate("Terabyte (TB)"),
        v: 1e12
      }, {
        l: translate("Gigabyte (GB)"),
        v: 1e9
      }, {
        l: translate("Megabyte (MB)"),
        v: 1e6
      }, {
        l: translate("Kilobyte (KB)"),
        v: 1e3
      }, {
        l: translate("Byte (B)"),
        v: 1
      }, {
        l: translate("Bit (b)"),
        v: .125
      } ],
      fromIdx: 1,
      toIdx: 2
    }
  }, v = Object.keys(u).map(function(e) {
    return '<button class="aw-uc-tab" data-cat="' + e + '">' + u[e].icon + " " + u[e].label + "</button>";
  }).join("");
  e.innerHTML = '<div id="' + s + "\" style=\"font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:" + r + ";color:" + i + ";border:1px solid " + n + ';border-radius:12px;overflow:hidden;max-width:520px;"><div style="padding:14px 18px;font-size:.85rem;font-weight:800;border-bottom:1px solid ' + n + ';">' + translate("Unit Converter") + '</div><div style="padding:10px 14px;overflow-x:auto;white-space:nowrap;display:flex;gap:6px;" class="aw-uc-tabs">' + v + '</div><div style="padding:16px 18px;"><div style="display:grid;grid-template-columns:1fr 40px 1fr;gap:10px;align-items:end;"><div><label style="font-size:.7rem;font-weight:700;color:' + l + ';display:block;margin-bottom:4px;">' + translate("From") + '</label><input type="number" id="' + s + '-fromVal" value="1" style="width:100%;padding:9px 10px;border:1.5px solid ' + n + ";border-radius:7px;font-size:.95rem;font-weight:600;background:" + a + ";color:" + i + ';outline:none;"><select id="' + s + '-fromU" style="width:100%;padding:8px 10px;border:1.5px solid ' + n + ";border-radius:7px;font-size:.8rem;background:" + a + ";color:" + i + ';margin-top:6px;outline:none;"></select></div><button id="' + s + '-swap" style="width:36px;height:36px;border-radius:50%;background:' + d + ';color:#fff;border:none;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;margin-bottom:30px;">⇄</button><div><label style="font-size:.7rem;font-weight:700;color:' + l + ';display:block;margin-bottom:4px;">' + translate("To") + '</label><input type="number" id="' + s + '-toVal" readonly style="width:100%;padding:9px 10px;border:1.5px solid ' + n + ";border-radius:7px;font-size:.95rem;font-weight:600;background:" + a + ";color:" + d + ';outline:none;"><select id="' + s + '-toU" style="width:100%;padding:8px 10px;border:1.5px solid ' + n + ";border-radius:7px;font-size:.8rem;background:" + a + ";color:" + i + ';margin-top:6px;outline:none;"></select></div></div><div id="' + s + '-formula" style="text-align:center;font-size:.75rem;color:' + l + ';margin-top:10px;"></div></div>' + (t.footerHTML ? '<div style="padding:10px 18px;border-top:1px solid ' + n + ";font-size:.72rem;color:" + l + ';">' + t.footerHTML + "</div>" : "") + "</div>";
  var c = e.querySelector("#" + s).querySelectorAll(".aw-uc-tab"), p = e.querySelector("#" + s + "-fromVal"), f = e.querySelector("#" + s + "-toVal"), m = e.querySelector("#" + s + "-fromU"), x = e.querySelector("#" + s + "-toU"), b = e.querySelector("#" + s + "-formula"), g = e.querySelector("#" + s + "-swap"), y = "length", h = "padding:6px 12px;border-radius:6px;font-size:.72rem;font-weight:700;border:1.5px solid " + n + ";background:transparent;color:" + l + ";cursor:pointer;white-space:nowrap;", w = "padding:6px 12px;border-radius:6px;font-size:.72rem;font-weight:700;border:1.5px solid " + d + ";background:" + d + ";color:#fff;cursor:pointer;white-space:nowrap;";
  function k(e) {
    y = e, c.forEach(function(t) {
      t.setAttribute("style", t.dataset.cat === e ? w : h);
    });
    var t = u[e], o = t.units.map(function(e, t) {
      return '<option value="' + t + '">' + e.l + "</option>";
    }).join("");
    m.innerHTML = o, x.innerHTML = o, m.selectedIndex = t.fromIdx, x.selectedIndex = t.toIdx,
    p.value = 1, I();
  }
  function I() {
    var e = u[y], t = parseFloat(p.value);
    if (isNaN(t)) return f.value = "", void (b.textContent = "");
    var o, r, i, l = parseInt(m.value), n = parseInt(x.value);
    if (e.special) {
      var a = e.units[l].v, d = e.units[n].v;
      r = function(e, t) {
        return "C" === t ? e + 273.15 : "F" === t ? 5 * (e - 32) / 9 + 273.15 : e;
      }(t, a), o = "C" === (i = d) ? r - 273.15 : "F" === i ? 9 * (r - 273.15) / 5 + 32 : r;
    } else o = t * e.units[l].v / e.units[n].v;
    if (f.value = isNaN(o) ? "" : +o.toPrecision(8), e.special) b.textContent = t.toLocaleString(locale, {
      maximumSignificantDigits: 8
    }) + " " + e.units[l].l + " = " + o.toLocaleString(locale, {
      maximumSignificantDigits: 7
    }) + " " + e.units[n].l; else {
      var s = e.units[l].v / e.units[n].v;
      b.textContent = "1 " + e.units[l].l + " = " + s.toLocaleString(locale, {
        maximumSignificantDigits: 7
      }) + " " + e.units[n].l;
    }
  }
  c.forEach(function(e) {
    e.setAttribute("style", h);
  }), c.forEach(function(e) {
    e.addEventListener("click", function() {
      k(e.dataset.cat);
    });
  }), p.addEventListener("input", I), m.addEventListener("change", I), x.addEventListener("change", I),
  g.addEventListener("click", function() {
    var e = m.value;
    m.value = x.value, x.value = e, p.value = f.value || "", I();
  }), k("length");
};
