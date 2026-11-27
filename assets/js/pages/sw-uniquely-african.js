(function initSwUniquelyAfrican(root) {
  "use strict";
  var contractNode = document.getElementById("uaContract");
  var form = document.querySelector("[data-ua-form]");
  var engine = root.AfroToolsUniquelyAfricanEngine;
  if (!contractNode || !form || !engine) return;

  var contract = JSON.parse(contractNode.textContent);
  var lastPayload = null;
  var kitchenCopyRevision = 0;
  var delegateState = {};

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
      return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[character];
    });
  }

  function collectInput() {
    var input = {};
    contract.fields.forEach(function (field) {
      var node = document.querySelector('[data-ua-field="' + field.key + '"]');
      if (!node) return;
      input[field.key] = field.type === "number" ? Number(node.value) : node.value;
    });
    return input;
  }

  function formatValue(key, value, input) {
    if (typeof value === "boolean") return value ? "Ndiyo" : "Hapana";
    if (value == null) return "—";
    if (typeof value !== "number") return String(value);
    var digits = /Pct$|weightedSeverity|scaleFactor|Kwh|Litres|Months/i.test(key) ? 2 : Math.abs(value) < 10 ? 2 : 0;
    var formatted = value.toLocaleString("sw-TZ", { maximumFractionDigits: digits, minimumFractionDigits: digits });
    if (/Pct$|weightedSeverity/i.test(key)) return formatted + "%";
    if (/(?:cost|fee|value|profit|revenue|price|total|gap|secured|remittance|material|quote|expenses|difference|spread)$/i.test(key)) {
      return (input.currency || "") + " " + formatted;
    }
    return formatted;
  }

  function clearInvalid() {
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (node) { node.removeAttribute("aria-invalid"); });
  }

  function renderMetrics(result, input) {
    var target = document.querySelector("[data-ua-metrics]");
    if (contract.id === "afrokitchen") target.classList.add("ua-metrics");
    target.innerHTML = Object.keys(contract.metrics).filter(function (key) {
      return Object.prototype.hasOwnProperty.call(result.values, key);
    }).map(function (key) {
      return '<article class="ua-metric"><span>' + escapeHtml(contract.metrics[key]) + '</span><strong>' + escapeHtml(formatValue(key, result.values[key], input)) + "</strong></article>";
    }).join("");
  }

  function renderRows(result) {
    var table = document.querySelector("[data-ua-table]");
    if (!result.rows || !result.rows.length) { table.innerHTML = ""; table.hidden = true; return; }
    if (contract.id === "afrokitchen") {
      table.hidden = false;
      table.innerHTML = "<thead><tr><th scope=\"col\">Kiungo</th><th scope=\"col\">Kiasi</th><th scope=\"col\">Kipimo</th></tr></thead><tbody>" + result.rows.map(function (row) {
        var amount = Number.isFinite(row.scaledAmount) ? row.scaledAmount.toLocaleString("sw-TZ", { maximumFractionDigits: 2 }) : "Kulingana na ladha";
        return "<tr><td>" + escapeHtml(row.name) + "</td><td>" + escapeHtml(amount) + "</td><td>" + escapeHtml(row.unit) + "</td></tr>";
      }).join("") + "</tbody>";
      return;
    }
    var keys = Object.keys(result.rows[0]).slice(0, 6);
    table.hidden = false;
    table.innerHTML = "<thead><tr>" + keys.map(function (key) { return "<th>" + escapeHtml(key) + "</th>"; }).join("") + "</tr></thead><tbody>" + result.rows.slice(0, 50).map(function (row) {
      return "<tr>" + keys.map(function (key) { return "<td>" + escapeHtml(row[key] == null ? "—" : row[key]) + "</td>"; }).join("") + "</tr>";
    }).join("") + "</tbody>";
  }

  function invalidMessage(result) {
    var field = contract.fields.find(function (item) { return item.key === result.field; });
    var label = field ? field.label : "Taarifa";
    var messages = {
      positive_required: label + " lazima iwe kubwa kuliko sifuri.",
      distinct_supported_cities_required: "Chagua miji miwili tofauti iliyopo kwenye orodha.",
      distinct_supported_countries_required: "Chagua nchi mbili tofauti zilizopo kwenye orodha.",
      ingredient_required: "Chagua mapishi yenye viungo vinavyopatikana.",
      records_required: "Rekodi za kusoma hazipatikani sasa. Jaribu tena au tumia zana nyingine ya ndani.",
      numeric_prices_required: "Hakuna bei za namba zinazoweza kulinganishwa.",
      days_out_of_range: "Siku lazima ziwe kati ya 0 na 366."
    };
    return messages[result.code] || "Kagua taarifa ulizoingiza kisha jaribu tena.";
  }

  function payloadText(payload) {
    var lines = [contract.title, "Imeundwa ndani ya kivinjari", ""];
    Object.keys(contract.metrics).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(payload.result.values, key)) lines.push(contract.metrics[key] + ": " + formatValue(key, payload.result.values[key], payload.input));
    });
    if (contract.id === "afrokitchen") {
      var recipes = root.AfroKitchenEngine && root.AfroKitchenEngine.SEED_RECIPES || [];
      var recipe = recipes.find(function (item) { return item.slug === payload.input.recipe; });
      lines.push("", "Mapishi: " + (payload.method ? payload.method.title : payload.input.recipe), "Viungo vilivyorekebishwa");
      payload.result.rows.forEach(function (row) {
        var amount = Number.isFinite(row.scaledAmount) ? row.scaledAmount.toLocaleString("sw-TZ", { maximumFractionDigits: 2 }) : "Kulingana na ladha";
        lines.push(row.name + ": " + amount + (row.unit ? " " + row.unit : ""));
      });
      if (payload.method) {
        lines.push("", "Jinsi ya kupika — " + payload.method.title, methodContext(payload.method));
        payload.method.steps.forEach(function (step, index) { lines.push((index + 1) + ". " + step); });
        lines.push("Jina katika orodha ya Kiingereza: " + recipe.name, "https://afrotools.com" + payload.method.source);
      }
    }
    lines.push("", "Chanzo: " + contract.source, "Upya wa taarifa: " + contract.freshness, "Mipaka: " + contract.limitations);
    return lines.join("\n");
  }

  function download(name, type, content) {
    var blob = content instanceof Blob ? content : new Blob([content], { type:type });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url; anchor.download = name; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
  }

  function copyText(text, button) {
    var done = function () { button.textContent = "Imenakiliwa"; setTimeout(function () { button.textContent = "Nakili"; }, 1200); };
    var fallback = function () {
      var area = document.createElement("textarea"); area.value = text; area.style.position = "fixed"; area.style.left = "-9999px"; document.body.appendChild(area); area.select(); document.execCommand("copy"); area.remove(); done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
    else fallback();
  }

  function copyKitchenPayload(payload, button) {
    if (contract.id !== "afrokitchen" || payload !== lastPayload || !button.isConnected) return;
    var attempt = ++kitchenCopyRevision;
    var text = payloadText(payload);
    function activeFocus() {
      var node = document.activeElement;
      while (node && node.shadowRoot && node.shadowRoot.activeElement) node = node.shadowRoot.activeElement;
      return node;
    }
    var focusAtRequest = activeFocus();
    function current() {
      return attempt === kitchenCopyRevision && payload === lastPayload && button.isConnected;
    }
    function feedback(copied) {
      if (!current()) return;
      button.textContent = copied ? "Imenakiliwa" : "Kunakili kumeshindikana";
      var status = document.querySelector("[data-ua-status]");
      if (status) status.textContent = copied ? "Mapishi yamenakiliwa." : "Kunakili kumeshindikana. Tumia Pakua TXT kuhifadhi mapishi kamili.";
    }
    function fallback() {
      if (!current()) return;
      var restoreFocus = activeFocus();
      if (!restoreFocus || restoreFocus === focusAtRequest || restoreFocus === document.body || restoreFocus === document.documentElement) restoreFocus = button;
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      var copied = false;
      try {
        document.body.appendChild(textarea);
        textarea.focus({ preventScroll: true });
        textarea.select();
        copied = document.execCommand("copy") === true;
      } catch (error) {
        copied = false;
      } finally {
        textarea.remove();
        if (current() && restoreFocus.isConnected) revealKitchenControl(restoreFocus);
      }
      feedback(copied);
    }
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        Promise.resolve(navigator.clipboard.writeText(text)).then(function () { feedback(true); }, fallback);
      } else fallback();
    } catch (error) {
      fallback();
    }
  }

  function renderExports(payload) {
    var target = document.querySelector("[data-ua-exports]");
    var labels = { copy:"Nakili", json:"Pakua JSON", txt:"Pakua TXT", pdf:"Pakua PDF", print:"Chapisha" };
    target.innerHTML = contract.outputs.map(function (kind) { return '<button type="button" data-ua-export="' + kind + '">' + labels[kind] + "</button>"; }).join("");
    if (contract.id === "afrokitchen" && delegateState.recipe && delegateState.recipe.method_url) {
      var method = document.createElement("a");
      method.href = delegateState.recipe.method_url;
      method.hreflang = "en";
      method.target = "_blank";
      method.rel = "noopener";
      method.textContent = "Hatua za kupika kwa Kiingereza (kichupo kipya)";
      target.prepend(method);
    }
    target.querySelectorAll("[data-ua-export]").forEach(function (button) {
      button.addEventListener("click", async function () {
        var kind = button.getAttribute("data-ua-export");
        var basename = "afrotools-" + contract.id + "-sw";
        var text = payloadText(payload);
        if (kind === "copy") {
          if (contract.id === "afrokitchen") copyKitchenPayload(payload, button);
          else copyText(text, button);
        }
        else if (kind === "json") download(basename + ".json", "application/json", JSON.stringify(payload, null, 2) + "\n");
        else if (kind === "txt") download(basename + ".txt", "text/plain;charset=utf-8", text + "\n");
        else if (kind === "print") root.print();
        else if (kind === "pdf") {
          var pdf = root.AfroTools && root.AfroTools.SwahiliLocalPdf;
          if (!pdf) throw new Error("Maktaba ya PDF ya ndani haipatikani.");
          var bytes = await pdf.create(contract.title, text.split("\n").filter(Boolean));
          download(basename + ".pdf", "application/pdf", new Blob([bytes], { type:"application/pdf" }));
        }
      });
    });
  }

  function countryCode(country) { return country.slug || country.code || country.iso2 || country.id; }

  function prepareAtlas(input) {
    var atlas = root.AfroAtlas;
    if (!atlas || typeof atlas.getAllCountries !== "function") return { error:{ status:"invalid", field:"countryA", code:"records_required" } };
    input.countries = atlas.getAllCountries().map(function (country) { return { id:countryCode(country), name:country.name, gdp:country.gdp, population:country.population, resources:country.resources }; });
    return { input:input };
  }

  function preparePoints(input) {
    var points = root.AfroPointsEngine;
    if (!points || typeof points.getSubmissionPoints !== "function") return { error:{ status:"invalid", field:"category", code:"records_required" } };
    input.pointsPerRecord = points.getSubmissionPoints(input.category);
    var node = document.querySelector('[data-ua-field="pointsPerRecord"]'); if (node) node.value = input.pointsPerRecord;
    return { input:input };
  }

  var ingredientNames = {
    "long-grain parboiled rice": "mchele mrefu uliochemshwa kwa mvuke kabla ya kukobolewa",
    "fresh Roma tomatoes": "nyanya safi za Roma",
    "red bell peppers (tatashe)": "pilipili hoho nyekundu (tatashe)",
    "scotch bonnet peppers (ata rodo)": "pilipili za Scotch Bonnet (ata rodo)",
    "onion": "kitunguu maji",
    "tomato paste": "nyanya zilizokolezwa",
    "vegetable oil or groundnut oil": "mafuta ya mboga au ya karanga",
    "bay leaves": "majani ya laureli",
    "dried thyme": "majani ya taim yaliyokaushwa",
    "curry powder": "unga wa kari",
    "seasoning cubes (Maggi/Knorr)": "vibonge vya mchuzi (Maggi/Knorr)",
    "salt": "chumvi",
    "chicken stock or water": "mchuzi wa kuku au maji",
    "butter": "siagi",
    "white maize flour (unga)": "unga wa mahindi meupe",
    "water": "maji",
    "sukuma wiki (collard greens)": "sukuma wiki",
    "vegetable oil or cooking fat": "mafuta ya mboga au mafuta mengine ya kupikia",
    "tomatoes": "nyanya",
    "Royco seasoning": "kiungo cha Royco",
    "chicken": "kuku",
    "red onions": "vitunguu maji vyekundu",
    "berbere spice blend": "mchanganyiko wa viungo vya berbere",
    "niter kibbeh (Ethiopian spiced butter)": "niter kibbeh (siagi ya Ethiopia yenye viungo)",
    "garlic": "kitunguu saumu",
    "fresh ginger": "tangawizi mbichi",
    "hard-boiled eggs": "mayai yaliyochemshwa hadi kuiva",
    "water or chicken stock": "maji au mchuzi wa kuku",
    "lemon juice": "maji ya limau",
    "black pepper": "pilipili manga nyeusi",
    "minced beef or lamb": "nyama ya ng’ombe au kondoo iliyosagwa",
    "onions": "vitunguu maji",
    "turmeric": "manjano",
    "white bread": "mkate mweupe",
    "apricot jam": "jamu ya aprikoti",
    "vinegar": "siki",
    "raisins or sultanas": "zabibu kavu au sultana",
    "eggs": "mayai",
    "milk": "maziwa",
    "whole white fish (thiof/grouper)": "samaki mzima mwenye nyama nyeupe (thiof/chewa)",
    "parsley": "parsili",
    "scotch bonnet pepper": "pilipili aina ya Scotch Bonnet",
    "vegetable oil": "mafuta ya mboga",
    "dried fish (gédj)": "samaki waliokaushwa (gédj)",
    "tamarind ball": "donge la ukwaju",
    "cassava": "muhogo",
    "carrots": "karoti",
    "cabbage": "kabichi",
    "eggplant": "bilinganya",
    "broken rice (riz brisé)": "mchele uliovunjika (riz brisé)",
    "Egyptian rice": "mchele wa Misri",
    "brown lentils": "dengu za kahawia",
    "elbow macaroni": "makaroni yaliyopinda",
    "chickpeas (canned)": "njegere aina ya chana za koponi",
    "crushed tomatoes": "nyanya zilizopondwa",
    "white vinegar": "siki nyeupe",
    "cumin": "jira",
    "chili flakes": "vipande vidogo vya pilipili kavu",
    "vegetable oil for frying": "mafuta ya mboga ya kukaangia",
    "preserved lemons": "malimau yaliyohifadhiwa kwa chumvi",
    "green olives": "zeituni za kijani",
    "ground ginger": "unga wa tangawizi",
    "saffron threads": "nyuzi za zafarani",
    "olive oil": "mafuta ya zeituni",
    "fresh coriander": "dhania mbichi",
    "rice": "mchele",
    "black-eyed peas or red beans": "kunde au maharagwe mekundu",
    "dried sorghum leaf stalks (waakye leaves)": "mabua yaliyokaushwa ya majani ya mtama (majani ya waakye)",
    "baking soda": "bikaribonati ya sodiamu"
  };
  var ingredientUnits = {
    "cup": ["kikombe", "vikombe"],
    "cups": ["kikombe", "vikombe"],
    "piece": ["kipande", "vipande"],
    "pieces": ["kipande", "vipande"],
    "large": "ukubwa mkubwa",
    "medium": "ukubwa wa kati",
    "teaspoon": ["kijiko cha chai", "vijiko vya chai"],
    "tablespoon": ["kijiko cha chakula", "vijiko vya chakula"],
    "tablespoons": ["kijiko cha chakula", "vijiko vya chakula"],
    "large bunch": ["fungu kubwa", "mafungu makubwa"],
    "bunch": ["fungu", "mafungu"],
    "cubes": ["kibonge", "vibonge"],
    "whole": ["mzima", "wazima"],
    "cloves": "punje",
    "slices": ["kipande", "vipande"]
  };

  function kitchenUnit(unit, amount) {
    var label = ingredientUnits[unit];
    if (!label) return unit;
    if (!Array.isArray(label)) return label;
    return label[Math.abs(amount) <= 1 ? 0 : 1];
  }

  function prepareKitchen(input) {
    var kitchen = root.AfroKitchenEngine;
    if (!kitchen || !Array.isArray(kitchen.SEED_RECIPES)) return { error:{ status:"invalid", field:"recipe", code:"records_required" } };
    var recipe = kitchen.SEED_RECIPES.find(function (item) { return item.slug === input.recipe; });
    if (!recipe) return { error:{ status:"invalid", field:"recipe", code:"ingredient_required" } };
    delegateState.recipe = recipe; input.originalServings = recipe.default_servings;
    input.ingredients = (recipe.ingredients || []).map(function (ingredient) {
      var name = ingredientNames[ingredient.name] || ingredient.name;
      if (recipe.slug === "ugali-sukuma-wiki" && ingredient.name === "salt") {
        var components = { "For ugali": "kwa ugali", "For sukuma wiki": "kwa sukuma wiki" };
        if (components[ingredient.group_name]) name += " (" + components[ingredient.group_name] + ")";
      }
      return {
        name: name,
        amount: ingredient.amount,
        unit: kitchenUnit(ingredient.unit, ingredient.amount)
      };
    });
    var node = document.querySelector('[data-ua-field="originalServings"]'); if (node) node.value = recipe.default_servings;
    return { input:input };
  }

  var kitchenMethods = {
    "nigerian-jollof-rice": {
      "title": "Wali wa jollof wa Nigeria",
      "country": "Nigeria",
      "region": "Afrika Magharibi",
      "steps": [
        "Saga nyanya, pilipili hoho, pilipili kali na kitunguu kilichokatwa vipande vikubwa hadi upate mchanganyiko laini.",
        "Kaanga kitunguu kilichokatwa vipande vyembamba katika mafuta kwa dakika 3. Ongeza nyanya ya kopo iliyokolea na ukoroge kwa dakika 2–3.",
        "Mimina mchanganyiko uliosaga. Ongeza majani ya bay, taim, unga wa kari na viungo vya mchuzi. Chemsha, kisha pika kwa moto wa wastani kwa dakika 20–30 hadi mchuzi upungue na mafuta yaonekane juu.",
        "Ongeza mchele uliooshwa, mchuzi wa kuku au maji, na chumvi. Ukichemka, funika sufuria vizuri na upike kwa moto mdogo kwa dakika 30 bila kufunua.",
        "Onja punje moja. Ikiwa bado ni ngumu, nyunyiza maji kidogo, funika na upike dakika 5 zaidi. Ondoa majani ya bay, ongeza siagi ukipenda, kisha chokoa wali kwa uma."
      ]
    },
    "ugali-sukuma-wiki": {
      "title": "Ugali na sukuma wiki",
      "country": "Kenya",
      "region": "Afrika Mashariki",
      "steps": [
        "Chemsha maji ya ugali na chumvi yake katika sufuria nzito. Mimina robo ya unga wa mahindi huku ukikoroga kwa mwiko. Pika kwa dakika 2, kisha ongeza unga uliobaki taratibu.",
        "Songa ugali kwa kuukandamiza ukutani mwa sufuria. Funika kwa dakika 5 kwa moto mdogo, songa tena, kisha funika kwa dakika 3–5 hadi uachane na sufuria.",
        "Katika sufuria nyingine, kaanga kitunguu katika mafuta kwa dakika 3. Ongeza nyanya zilizokatwa na uzipike kwa dakika 2–3 hadi zilainike.",
        "Ongeza sukuma wiki zilizokatwa, chumvi ya mboga na Royco ukipenda. Geuzageuza kwa dakika 3–5 hadi majani yalainike kidogo. Pakua kando ya ugali."
      ]
    },
    "ethiopian-doro-wat": {
      "title": "Doro wat ya kuku na mayai",
      "country": "Ethiopia",
      "region": "Afrika Mashariki",
      "steps": [
        "Pika vitunguu vyekundu vilivyokatwa kwenye sufuria nzito bila mafuta. Koroga kwa takribani dakika 20 hadi viwe vya kahawia na vipungue.",
        "Ongeza siagi ya niter kibbeh, kitunguu saumu na tangawizi. Baada ya dakika 2 ongeza berbere na nyanya iliyokolea. Koroga kwa dakika 5.",
        "Geuza vipande vya kuku kwenye viungo. Ongeza maji au mchuzi, funika na upike kwa moto mdogo kwa dakika 35–40 hadi kuku aive kabisa na mchuzi unene.",
        "Chanja mayai yaliyochemshwa na kumenywa, kisha yaweke kwenye mchuzi. Ongeza limau na chumvi, rekebisha pilipili manga, upike bila kifuniko kwa dakika 10. Pakua pamoja na injera."
      ]
    },
    "south-african-bobotie": {
      "title": "Bobotie ya nyama ya kusaga",
      "country": "Afrika Kusini",
      "region": "Kusini mwa Afrika",
      "steps": [
        "Washa oveni hadi 180 °C. Loweka mkate kisha ukamue. Kaanga vitunguu kwa siagi kwa dakika 5, ongeza kari na manjano na ukoroge kwa dakika 1.",
        "Ongeza nyama ya kusaga na ukaange hadi iwe ya kahawia. Changanya mkate, jamu ya aprikoti, siki, zabibu kavu na chumvi.",
        "Sambaza mchanganyiko kwenye chombo cha kuokea kilichopakwa mafuta. Ingiza majani ya bay. Piga mayai, maziwa na chumvi kidogo kisha umimine juu.",
        "Oka kwa dakika 35–40 hadi tabaka la mayai ligande na kupata rangi ya dhahabu. Iache kwa dakika 5 kabla ya kukata na kupakua."
      ]
    },
    "senegalese-thieboudienne": {
      "title": "Thiéboudienne — wali wa samaki",
      "country": "Senegali",
      "region": "Afrika Magharibi",
      "steps": [
        "Changanya majani ya paseli, kitunguu saumu na pilipili kali. Chanja samaki na utie mchanganyiko ndani ya mikato. Kaanga kwa takribani dakika 4 kila upande kisha utoe.",
        "Kaanga vitunguu katika mafuta yale yale. Ongeza nyanya iliyokolea na upike dakika 5. Ongeza samaki mkavu, ukwaju na maji ya kutosha kufunika mboga.",
        "Mchuzi ukichemka, anza na muhogo na karoti, kisha ongeza bilinganya na kabichi. Toa mboga zinapoiva.",
        "Weka mchele uliovunjika kwenye mchuzi. Mchuzi ufunike mchele kwa karibu sentimita 1. Rudisha samaki juu, funika na upike kwa moto mdogo hadi mchele ufyonze mchuzi na samaki aive kabisa.",
        "Pakua wali, panga samaki na mboga juu yake na umimine mchuzi uliobaki."
      ]
    },
    "egyptian-koshari": {
      "title": "Koshari ya wali, dengu na tambi",
      "country": "Misri",
      "region": "Afrika Kaskazini",
      "steps": [
        "Chemsha dengu za kahawia kwa dakika 15 hadi zikaribie kuiva. Ongeza mchele na maji safi ya kutosha kupikia wali. Pika hadi dengu na wali viive.",
        "Chemsha tambi katika sufuria nyingine hadi ziive lakini zisilainike sana. Chuja maji na uchanganye tambi na mafuta kidogo.",
        "Kaanga kitunguu saumu kwa mafuta kidogo. Ongeza nyanya zilizopondwa, siki, bizari jira na pilipili. Pika kwa moto mdogo kwa dakika 15 hadi mchuzi unene.",
        "Kaanga vitunguu vilivyokatwa vipande vyembamba hadi viwe vya dhahabu na vikauke. Pakua wali na dengu kwanza, kisha tambi na dengu aina ya kabuli (chana) zilizoiva. Mimina mchuzi na uweke vitunguu juu."
      ]
    },
    "moroccan-chicken-tagine": {
      "title": "Tajini ya kuku na malimau ya chumvi",
      "country": "Moroko",
      "region": "Afrika Kaskazini",
      "steps": [
        "Paka kuku kitunguu kilichokunwa, tangawizi, manjano, zafarani, pilipili manga, mafuta ya zeituni na nusu ya majani ya giligilani. Weka kuku kwenye jokofu kwa angalau dakika 30.",
        "Weka kuku na viungo vyake kwenye tajini au sufuria nzito. Ongeza maji, funika na upike kwa moto mdogo kwa dakika 45. Geuza kuku katikati ya muda huo.",
        "Ongeza maganda ya malimau yaliyohifadhiwa kwa chumvi na zeituni za kijani. Pika bila kifuniko kwa dakika 10 hadi mchuzi upungue na kuku aive kabisa.",
        "Nyunyiza giligilani iliyobaki. Pakua pamoja na mkate au kuskusi."
      ]
    },
    "ghanaian-waakye": {
      "title": "Waakye ya wali na kunde",
      "country": "Ghana",
      "region": "Afrika Magharibi",
      "steps": [
        "Loweka kunde au maharagwe mekundu usiku kucha. Mwaga maji ya kulowekea, ongeza maji safi, mashina ya majani ya mtama na soda ya kuokea.",
        "Chemsha hadi maharagwe yaanze kulainika, takribani dakika 25. Ongeza mchele uliooshwa na chumvi. Maji yazidi mchele kwa takribani sentimita 2.5.",
        "Funika na upike kwa moto wa wastani. Maji yanapokaribia kukauka, punguza moto, funika vizuri na uache wali uive kwa mvuke kwa dakika 10. Hakikisha kunde au maharagwe yameiva kabisa.",
        "Ondoa mashina ya mtama na upakue. Unaweza kuandamana na shito, mayai yaliyochemshwa au samaki wa kukaanga."
      ]
    }
  };

  function kitchenMethod(recipe) {
    var entry = recipe && kitchenMethods[recipe.slug];
    if (!entry) return null;
    return {
      title: entry.title, localName: recipe.name_local, country: entry.country, region: entry.region,
      baseServings: recipe.default_servings, prepMinutes: recipe.prep_time_minutes,
      cookMinutes: recipe.cook_time_minutes, steps: entry.steps, source: recipe.method_url
    };
  }

  function methodContext(method) {
    return 'Sehemu za mapishi ya awali: ' + method.baseServings + ' · Maandalizi: ' + method.prepMinutes + ' dakika · Kupika: ' + method.cookMinutes + ' dakika';
  }

  function displayKitchenMethod(recipe) {
    var method = kitchenMethod(recipe);
    var panel = document.getElementById('kitchen-method');
    if (!method) { if (panel) panel.remove(); return; }
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'kitchen-method';
      panel.className = 'ua-card';
      panel.setAttribute('aria-labelledby', 'kitchen-method-title');
      form.after(panel);
    }
    panel.innerHTML = '<h2 id="kitchen-method-title">Jinsi ya kupika — ' + escapeHtml(method.title) + '</h2><p>' +
      escapeHtml(methodContext(method)) + '</p><ol>' + method.steps.map(function (step) {
        return '<li>' + escapeHtml(step) + '</li>';
      }).join('') + '</ol><p>Mpangaji huu una mapishi manane kwa Kiswahili. Muda ni wa kukadiria; ukibadilisha sehemu, kagua chakula kinapoiva.</p><p><a href="/tools/afrokitchen/" hreflang="en">Tazama orodha kamili ya mapishi (Kiingereza)</a></p>';
  }

  function syncKitchenRecipe() {
    if (contract.id !== "afrokitchen") return;
    var original = form.querySelector('[data-ua-field="originalServings"]');
    var selected = form.querySelector('[data-ua-field="recipe"]');
    var recipes = root.AfroKitchenEngine && root.AfroKitchenEngine.SEED_RECIPES || [];
    var recipe = recipes.find(function (item) { return selected && item.slug === selected.value; });
    displayKitchenMethod(recipe);
    var photo = form.querySelector("[data-ua-recipe-photo]");
    if (recipe && recipe.image_url) {
      if (!photo) {
        photo = document.createElement("img");
        photo.setAttribute("data-ua-recipe-photo", "");
        photo.width = 320;
        photo.style.cssText = "display:block;max-width:100%;height:auto;margin-top:0.75rem";
        selected.closest(".ua-fields").after(photo);
      }
      photo.alt = "Sahani ya " + recipe.name_local;
      photo.src = recipe.image_url;
    } else if (photo) {
      photo.remove();
    }
    if (original) {
      original.readOnly = true;
      original.value = recipe ? recipe.default_servings : "";
    }
  }

  function clearKitchenOutput() {
    if (contract.id !== "afrokitchen") return;
    kitchenCopyRevision += 1;
    lastPayload = null;
    ["[data-ua-metrics]", "[data-ua-table]", "[data-ua-exports]"].forEach(function (selector) {
      var node = document.querySelector(selector);
      if (node) node.innerHTML = "";
    });
    clearInvalid();
  }

  function invalidateKitchenResult() {
    if (contract.id !== "afrokitchen") return;
    clearKitchenOutput();
    var section = document.querySelector("[data-ua-result]");
    var status = document.querySelector("[data-ua-status]");
    status.className = "";
    status.removeAttribute("tabindex");
    status.textContent = section.hidden ? "" : "Mapishi au sehemu zimebadilika. Kokotoa tena kupata viungo na faili zilizosasishwa.";
  }

  function revealKitchenControl(node) {
    if (contract.id !== "afrokitchen" || !node) return;
    node.focus({ preventScroll: true });
    node.scrollIntoView({ block: "center", behavior: "instant" });
  }

  async function prepareConflict(input) {
    var conflict = root.AfroConflict;
    if (!conflict || typeof conflict.getConflicts !== "function") return { error:{ status:"invalid", field:"records", code:"records_required" } };
    try { var response = await conflict.getConflicts({}); input.records = Array.isArray(response) ? response : response && (response.conflicts || response.rows) || []; return { input:input }; }
    catch (error) { return { error:{ status:"invalid", field:"records", code:"records_required" } }; }
  }

  async function preparePrices(input) {
    var prices = root.AfroPricesEngine;
    if (!prices || typeof prices.searchProducts !== "function") return { error:{ status:"invalid", field:"records", code:"records_required" } };
    try {
      var response = await prices.searchProducts(input.query, input.country || "NG");
      var rows = [];
      ((response && response.results) || []).forEach(function (product) {
        (product.listings || product.prices || []).forEach(function (listing) {
          rows.push({ country:listing.country || product.country || response.country && response.country.name || input.country, city:listing.city || listing.platform_name || listing.store_name || "", currency:listing.currency_code || listing.currency || "", unit:listing.unit || "kipimo", price:listing.price, observed_at:listing.observed_at || listing.updated_at || listing.lastVerified, source:listing.source_url || listing.platform_name || listing.source });
        });
      });
      input.records = rows; return { input:input };
    } catch (error) { return { error:{ status:"invalid", field:"records", code:"records_required" } }; }
  }

  async function calculate(input) {
    var prepared = { input:input };
    if (contract.id === "afroatlas") prepared = prepareAtlas(input);
    else if (contract.id === "afropoints") prepared = preparePoints(input);
    else if (contract.id === "afrokitchen") prepared = prepareKitchen(input);
    else if (contract.id === "africa-conflict") prepared = await prepareConflict(input);
    else if (contract.id === "afroprices") prepared = await preparePrices(input);
    if (prepared.error) return prepared.error;
    var result = engine.calculate(contract.id, prepared.input);
    if (contract.id === "afrokitchen" && result.status === "ok") {
      result.rows.forEach(function (row, index) {
        row.unit = kitchenUnit(delegateState.recipe.ingredients[index].unit, row.scaledAmount);
      });
    }
    return result;
  }

  function populateSelect(key, items, valueKey, labelKey) {
    var select = document.querySelector('[data-ua-field="' + key + '"]'); if (!select) return;
    select.innerHTML = items.map(function (item) { var value = typeof valueKey === "function" ? valueKey(item) : item[valueKey]; var label = typeof labelKey === "function" ? labelKey(item) : item[labelKey]; return '<option value="' + escapeHtml(value) + '">' + escapeHtml(label) + "</option>"; }).join("");
  }

  function initializeDelegates() {
    if (contract.id === "afroatlas" && root.AfroAtlas) { var countries = root.AfroAtlas.getAllCountries(); populateSelect("countryA", countries, countryCode, "name"); populateSelect("countryB", countries, countryCode, "name"); document.querySelector('[data-ua-field="countryA"]').value = "nigeria"; document.querySelector('[data-ua-field="countryB"]').value = "ghana"; }
    else if (contract.id === "afropoints" && root.AfroPointsEngine) { populateSelect("category", root.AfroPointsEngine.CATEGORIES, "id", "label"); var category = document.querySelector('[data-ua-field="category"]'); if (category) category.value = "staple_price"; }
    else if (contract.id === "afrokitchen" && root.AfroKitchenEngine) { populateSelect("recipe", root.AfroKitchenEngine.SEED_RECIPES, "slug", function (recipe) { var method = kitchenMethod(recipe); return method ? method.title + " — " + method.country : recipe.name_local; }); var recipe = document.querySelector('[data-ua-field="recipe"]'); if (recipe) recipe.value = "nigerian-jollof-rice"; }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault(); clearInvalid();
    if (contract.id === "afrokitchen") clearKitchenOutput();
    var submit = form.querySelector('button[type="submit"]'); submit.disabled = true;
    var input = collectInput(); var result = await calculate(input); submit.disabled = false;
    var section = document.querySelector("[data-ua-result]"); var status = document.querySelector("[data-ua-status]");
    if (!result || result.status !== "ok") {
      status.textContent = invalidMessage(result || {}); status.className = "ua-error";
      document.querySelector("[data-ua-metrics]").innerHTML = ""; document.querySelector("[data-ua-table]").innerHTML = ""; document.querySelector("[data-ua-exports]").innerHTML = "";
      var invalid = result && result.field && document.querySelector('[data-ua-field="' + result.field + '"]');
      if (contract.id === "afrokitchen") {
        section.hidden = false;
        lastPayload = null;
        if (invalid) invalid.setAttribute("aria-invalid", "true");
        else status.setAttribute("tabindex", "-1");
        revealKitchenControl(invalid || status);
        return;
      }
      if (invalid) { invalid.setAttribute("aria-invalid", "true"); invalid.focus(); }
      else { status.setAttribute("tabindex", "-1"); status.focus(); }
      section.hidden = false; lastPayload = null; return;
    }
    status.textContent = "Hesabu imekamilika kwenye kivinjari hiki."; status.className = "ua-ready";
    renderMetrics(result, input); renderRows(result); lastPayload = { schemaVersion:1, toolId:contract.id, locale:"sw", input:input, result:result, source:contract.source, freshness:contract.freshness, limitations:contract.limitations };
    if (contract.id === "afrokitchen") lastPayload.method = kitchenMethod(delegateState.recipe);
    renderExports(lastPayload); section.hidden = false; section.focus();
  });

  form.querySelector("[data-ua-reset]").addEventListener("click", function () {
    form.reset(); clearInvalid(); lastPayload = null; var section = document.querySelector("[data-ua-result]"); section.hidden = true; var status = document.querySelector("[data-ua-status]"); status.textContent = ""; status.removeAttribute("tabindex");
    if (contract.id === "afrokitchen") {
      clearKitchenOutput();
      syncKitchenRecipe();
      revealKitchenControl(form.querySelector("[data-ua-field]"));
    }
  });

  initializeDelegates();
  if (contract.id === "afrokitchen") {
    syncKitchenRecipe();
    var original = form.querySelector('[data-ua-field="originalServings"]');
    original.addEventListener("focus", function () {
      root.requestAnimationFrame(function () {
        if (document.activeElement !== original) return;
        var bounds = original.getBoundingClientRect();
        var host = document.querySelector("afro-navbar");
        var nav = host && host.shadowRoot && host.shadowRoot.querySelector("nav") || host;
        var headerBottom = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
        if (bounds.top < headerBottom || bounds.bottom > root.innerHeight) revealKitchenControl(original);
      });
    });
    form.querySelector('[data-ua-field="recipe"]').addEventListener("change", function () {
      syncKitchenRecipe();
      invalidateKitchenResult();
    });
    form.querySelector('[data-ua-field="targetServings"]').addEventListener("input", invalidateKitchenResult);
  }
}(window));
