(function () {
  "use strict";

  var configNode = document.getElementById("fr-travel-config");
  if (!configNode) return;
  var config = JSON.parse(configNode.textContent);
  var form = document.querySelector("[data-fr-travel-form]");
  var resultBox = document.querySelector("[data-fr-travel-result]");
  var output = document.querySelector("[data-fr-travel-output]");
  var errorBox = document.querySelector("[data-fr-travel-error]");
  var status = document.querySelector("[data-fr-travel-status]");
  var state = { result: null };

  function field(name) { return form.elements[name]; }
  function text(name) { var node = field(name); return node ? String(node.value || "").trim() : ""; }
  function number(name, minimum) {
    var value = Number(text(name));
    if (!Number.isFinite(value) || value < minimum) throw new Error("Vérifiez le champ « " + ((field(name) && field(name).closest("label").childNodes[0].textContent) || name).trim() + " ».");
    return value;
  }
  function checked(name) { var node = field(name); return Boolean(node && node.checked); }
  function requireText(name) { var value = text(name); if (!value) throw new Error("Complétez tous les champs obligatoires."); return value; }
  function money(value, currency) {
    try { return new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency, maximumFractionDigits: 2 }).format(value); }
    catch (_) { return currency + " " + Math.round(value * 100) / 100; }
  }
  function line(label, value) { return { label: label, value: value }; }
  function result(title, lines, notes) { return { title: title, lines: lines, notes: notes || [] }; }
  function currency() { return text("currency") || "XOF"; }
  function atLeastOnePositive(values) { return values.filter(function (value) { return value > 0; }).length > 0; }
  function budgetWithBuffer(subtotal, percent) { return { reserve: subtotal * percent / 100, total: subtotal * (1 + percent / 100) }; }

  function calculate() {
    var id = config.toolId;
    var cur = currency();
    if (id === "africa-flight") {
      var origin = requireText("origin"), destination = requireText("destination");
      if (origin === destination) throw new Error("Choisissez deux aéroports différents.");
      var travellers = number("travellers", 1), low = number("quoteLow", 0), high = number("quoteHigh", 0), baggage = number("baggage", 0);
      if (low <= 0 || high <= 0) throw new Error("Saisissez une fourchette de devis actuelle; AfroTools n’invente aucun tarif.");
      if (high < low) throw new Error("Le devis haut doit être supérieur ou égal au devis bas.");
      return result("Fourchette de vol à vérifier", [
        line("Trajet", origin + " → " + destination), line("Voyageurs", String(travellers)),
        line("Total bas avec bagages", money((low + baggage) * travellers, cur)),
        line("Total haut avec bagages", money((high + baggage) * travellers, cur)),
      ], ["Vérifiez horaires, escales, bagages, taxes, visa/transit et disponibilité auprès du transporteur."]);
    }
    if (id === "airbnb-vs-hotel") {
      var nights = number("nights", 1), people = number("people", 1), rooms = number("rooms", 1);
      var hotel = number("hotelNight", 0) * rooms * nights + number("hotelFees", 0);
      var rental = Math.max(0, number("rentalNight", 0) * nights + number("rentalFees", 0) - number("foodSavings", 0));
      if (!atLeastOnePositive([hotel, rental])) throw new Error("Saisissez au moins un devis d’hébergement.");
      return result("Comparaison des deux devis", [
        line("Ville", requireText("city")), line("Hôtel au total", money(hotel, cur)),
        line("Location au total", money(rental, cur)), line("Écart", money(Math.abs(hotel - rental), cur)),
        line("Option la moins chère sur ces saisies", hotel === rental ? "Égalité" : hotel < rental ? "Hôtel" : "Location"),
        line("Coût par voyageur — option basse", money(Math.min(hotel, rental) / people, cur)),
      ], ["Comparez aussi annulation, sécurité, emplacement, taxes et services réellement inclus."]);
    }
    if (id === "airport-transfer") {
      var count = number("people", 1);
      var choices = [
        ["Taxi", number("taxi", 0)], ["VTC", number("rideHail", 0)],
        ["Navette", number("shuttleEach", 0) * count], ["Voiture privée", number("privateCar", 0)],
      ].filter(function (item) { return item[1] > 0; }).sort(function (a, b) { return a[1] - b[1]; });
      if (choices.length < 2) throw new Error("Saisissez au moins deux devis disponibles pour comparer.");
      return result("Transferts saisis", choices.map(function (item) {
        return line(item[0], money(item[1], cur) + " · " + money(item[1] / count, cur) + " par personne");
      }), ["Moins cher sur ces devis: " + choices[0][0] + ". Confirmez le point de prise en charge et le fournisseur."]);
    }
    if (id === "beach-holiday-budget") {
      var days = number("days", 1), guests = number("people", 1);
      var subtotal = number("lodgingNight", 0) * Math.max(0, days - 1) + number("mealsDayEach", 0) * days * guests +
        number("localTransport", 0) + number("activitiesEach", 0) * guests + number("flightsEach", 0) * guests;
      if (subtotal <= 0) throw new Error("Saisissez au moins un coût vérifié.");
      var beach = budgetWithBuffer(subtotal, number("bufferPercent", 0));
      return result("Budget plage modifiable", [
        line("Destination", requireText("destination")), line("Sous-total", money(subtotal, cur)),
        line("Réserve", money(beach.reserve, cur)), line("Total", money(beach.total, cur)),
        line("Par voyageur", money(beach.total / guests, cur)),
      ], ["Aucune météo, activité, frontière, sécurité ou disponibilité n’est garantie."]);
    }
    if (id === "festival-travel-budget") {
      if (!checked("scheduleConfirmed")) throw new Error("Confirmez d’abord la source organisateur pour la date et le canal de vente.");
      var festivalPeople = number("people", 1), festivalNights = number("nights", 0);
      var festivalSubtotal = number("ticketEach", 0) * festivalPeople + number("transportEach", 0) * festivalPeople +
        number("lodgingNight", 0) * festivalNights + number("mealsDayEach", 0) * Math.max(1, festivalNights + 1) * festivalPeople +
        number("localTransport", 0);
      if (festivalSubtotal <= 0) throw new Error("Saisissez au moins un coût vérifié.");
      var festival = budgetWithBuffer(festivalSubtotal, number("bufferPercent", 0));
      return result("Scénario de voyage événementiel", [
        line("Événement", requireText("eventName")), line("Lieu et date saisis", requireText("destination") + " · " + requireText("eventDate")),
        line("Sous-total", money(festivalSubtotal, cur)), line("Réserve", money(festival.reserve, cur)),
        line("Total", money(festival.total, cur)), line("Par voyageur", money(festival.total / festivalPeople, cur)),
      ], ["La confirmation de source n’est pas une garantie de tenue, de billet ou d’entrée. Revérifiez avant paiement et départ."]);
    }
    if (id === "hotel-star-guide") {
      var hotelNights = number("nights", 1), hotelRooms = number("rooms", 1);
      var a = number("offerANight", 0) * hotelNights * hotelRooms + number("offerAFees", 0);
      var b = number("offerBNight", 0) * hotelNights * hotelRooms + number("offerBFees", 0);
      if (a <= 0 || b <= 0) throw new Error("Saisissez deux devis complets pour comparer.");
      return result("Comparaison de devis d’hôtel", [
        line(requireText("offerAName"), money(a, cur)), line(requireText("offerBName"), money(b, cur)),
        line("Écart", money(Math.abs(a - b), cur)), line("Moins cher sur ces saisies", a <= b ? requireText("offerAName") : requireText("offerBName")),
        line("Inclusions / annulation", text("terms") || "À vérifier"),
      ], ["Les étoiles déclarées ne garantissent pas un standard identique entre pays ou établissements."]);
    }
    if (id === "safari-cost") {
      if (!checked("officialFeesConfirmed")) throw new Error("Confirmez la vérification des droits auprès de l’autorité du parc.");
      var safariDays = number("days", 1), safariPeople = number("people", 1), operator = number("operatorDayEach", 0);
      if (operator <= 0) throw new Error("Saisissez un devis opérateur daté; AfroTools n’invente aucun forfait.");
      var safariSubtotal = operator * safariDays * safariPeople + number("parkFees", 0) + number("transfers", 0) +
        number("flightsEach", 0) * safariPeople + number("adminCosts", 0) + number("tips", 0);
      var safari = budgetWithBuffer(safariSubtotal, number("bufferPercent", 0));
      return result("Budget safari à revérifier", [
        line("Destination", requireText("destination")), line("Sous-total", money(safariSubtotal, cur)),
        line("Réserve", money(safari.reserve, cur)), line("Total", money(safari.total, cur)),
        line("Par voyageur", money(safari.total / safariPeople, cur)),
      ], ["Aucun permis, visa, statut de résident, droit d’entrée ou créneau n’est confirmé par ce résultat."]);
    }
    if (id === "travel-packing-list") {
      if (!checked("documentsChecked")) throw new Error("Confirmez la vérification séparée des documents, de la santé et des bagages.");
      var trip = text("tripType"), climate = text("climate"), packDays = number("days", 1), laundry = text("laundry") === "oui";
      var clothing = Math.min(packDays, laundry ? 4 : 8);
      var items = ["Passeport et copies séparées — validité à vérifier", "Billets et réservations confirmés", "Moyen de paiement et secours", clothing + " hauts", Math.max(2, Math.ceil(clothing / 2)) + " bas", "Sous-vêtements pour " + Math.min(packDays, laundry ? 5 : 9) + " jours", "Chargeur et adaptateur vérifié"];
      var byTrip = { safari: ["Couleurs sobres", "Jumelles si utiles"], plage: ["Protection solaire adaptée", "Tenue de baignade"], affaires: ["Tenue professionnelle", "Documents de réunion"], ville: ["Chaussures de marche", "Petit sac sécurisé"], aventure: ["Équipement technique validé avec l’opérateur", "Couche de secours"] };
      var byClimate = { chaud: ["Vêtements respirants", "Gourde réutilisable"], pluie: ["Veste imperméable", "Protection étanche"], desert: ["Couche contre poussière et soleil", "Couche chaude pour le soir"], frais: ["Couche chaude", "Protection pluie et vent"] };
      items = items.concat(byTrip[trip] || [], byClimate[climate] || []);
      return result("Checklist locale", [
        line("Type et climat", trip + " · " + climate), line("Durée", packDays + " jours"),
        line("Franchise saisie", number("baggageKg", 0) + " kg"), line("Règle transporteur", text("carrierRule") || "À vérifier"),
      ], items.concat(["Aucun médicament n’est recommandé: préparez cette question avec un professionnel de santé."]));
    }
    if (id === "travel-vaccination-cost") {
      if (!checked("clinicalBoundaryConfirmed")) throw new Error("Confirmez la limite clinique et la revérification des règles officielles.");
      var healthDays = number("days", 1), healthPeople = number("people", 1);
      return result("Brief pour rendez-vous santé-voyage", [
        line("Trajet à discuter", requireText("origin") + " → " + requireText("destination")),
        line("Transits", text("transit") || "Aucun déclaré"), line("Départ", requireText("departureDate")),
        line("Durée et voyageurs", healthDays + " jours · " + healthPeople + " voyageur(s)"),
        line("Questions privées", text("healthNotes") || "À préparer avec le professionnel"),
      ], ["Apportez carnet vaccinal, historique pertinent et liste des médicaments au professionnel.", "Revérifiez passeport, visa, transit et santé dans IATA Travel Centre et auprès de l’autorité de destination.", "Ce brief ne recommande ni vaccin, ni traitement, ni prix."]);
    }
    throw new Error("Application non reconnue.");
  }

  function render(value) {
    output.innerHTML = "<h3>" + escapeHtml(value.title) + "</h3><dl>" + value.lines.map(function (item) {
      return "<dt>" + escapeHtml(item.label) + "</dt><dd>" + escapeHtml(item.value) + "</dd>";
    }).join("") + "</dl>" + (value.notes.length ? "<ul>" + value.notes.map(function (note) { return "<li>" + escapeHtml(note) + "</li>"; }).join("") + "</ul>" : "");
    resultBox.hidden = false;
    status.textContent = "Résultat créé localement.";
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, function (char) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]; }); }
  function values() {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (node) {
      if (!node.name || node.type === "submit") return;
      data[node.name] = node.type === "checkbox" ? node.checked : node.value;
    });
    return data;
  }
  function summaryText() {
    if (!state.result) return "";
    return [config.name, ""].concat(state.result.lines.map(function (item) { return item.label + ": " + item.value; }), ["",].concat(state.result.notes)).join("\n");
  }
  function slugFile(extension) { return "afrotools-" + config.frSlug + "-" + new Date().toISOString().slice(0, 10) + "." + extension; }
  function download(blob, filename) {
    var url = URL.createObjectURL(blob), anchor = document.createElement("a");
    anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try { state.result = calculate(); errorBox.textContent = ""; render(state.result); }
    catch (error) { state.result = null; resultBox.hidden = true; errorBox.textContent = error.message; }
  });
  form.addEventListener("input", function () { errorBox.textContent = ""; });
  document.querySelector("[data-fr-travel-reset]").addEventListener("click", function () {
    form.reset(); state.result = null; resultBox.hidden = true; errorBox.textContent = ""; status.textContent = "";
    syncCurrency(); var first = form.querySelector("input:not([type=checkbox]),select,textarea"); if (first) first.focus();
  });
  function syncCurrency() {
    var source = form.querySelector("[data-currency-source]"), target = field("currency");
    if (!source || !target) return;
    var selected = source.options[source.selectedIndex];
    if (selected && selected.dataset.currency) target.value = selected.dataset.currency;
  }
  Array.prototype.forEach.call(form.querySelectorAll("[data-currency-source]"), function (node) { node.addEventListener("change", syncCurrency); });
  syncCurrency();
  document.querySelector("[data-copy]").addEventListener("click", function () {
    if (!state.result) return;
    var value = summaryText();
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(value).then(function () { status.textContent = "Résumé copié."; }).catch(function () { status.textContent = "Copiez le résumé manuellement."; });
    else status.textContent = value;
  });
  document.querySelector("[data-export-json]").addEventListener("click", function () {
    if (!state.result) return;
    var payload = { schemaVersion: 1, locale: "fr", toolId: config.toolId, exportedAt: new Date().toISOString(), fields: values(), result: state.result };
    download(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), slugFile("json"));
    status.textContent = "JSON créé localement.";
  });
  var importFile = document.querySelector("[data-import-file]");
  document.querySelector("[data-import-json]").addEventListener("click", function () { importFile.click(); });
  importFile.addEventListener("change", function () {
    var file = importFile.files && importFile.files[0]; if (!file) return;
    file.text().then(function (value) {
      var payload = JSON.parse(value);
      if (payload.schemaVersion !== 1 || payload.toolId !== config.toolId || !payload.fields) throw new Error("Fichier incompatible avec cette application.");
      Object.keys(payload.fields).forEach(function (name) {
        var node = field(name); if (!node) return;
        if (node.type === "checkbox") node.checked = Boolean(payload.fields[name]); else node.value = String(payload.fields[name]);
      });
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      status.textContent = "Scénario rouvert depuis le JSON local.";
    }).catch(function (error) { status.textContent = error.message || "JSON invalide."; }).finally(function () { importFile.value = ""; });
  });
  document.querySelector("[data-export-pdf]").addEventListener("click", function () {
    if (!state.result) return;
    try {
      var Pdf = window.jspdf && window.jspdf.jsPDF; if (!Pdf) throw new Error("Bibliothèque PDF locale indisponible.");
      var doc = new Pdf({ unit: "mm", format: "a4" }), y = 18;
      doc.setProperties({ title: config.name, subject: config.boundary, creator: "AfroTools" });
      doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.text("AfroTools", 16, y); y += 10;
      doc.setFontSize(13); doc.text(doc.splitTextToSize(config.name, 178), 16, y); y += 14;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      state.result.lines.forEach(function (item) { var rows = doc.splitTextToSize(item.label + ": " + item.value, 178); doc.text(rows, 16, y); y += rows.length * 5 + 2; });
      y += 3; state.result.notes.forEach(function (note) { var rows = doc.splitTextToSize("- " + note, 178); doc.text(rows, 16, y); y += rows.length * 5 + 2; });
      var boundaryRows = doc.splitTextToSize("Limite: " + config.boundary + " Sources vérifiées le " + config.checked + ".", 178);
      doc.text(boundaryRows, 16, Math.min(270, y + 5));
      var blob = doc.output("blob"); download(blob, slugFile("pdf"));
      window.dispatchEvent(new CustomEvent("afro-pdf-generated", { detail: { blob: blob, fileName: slugFile("pdf"), toolSlug: config.toolId } }));
      status.textContent = "PDF créé localement.";
    } catch (error) { status.textContent = error.message; }
  });
  var consent = document.querySelector("[data-ai-consent]"), promptButton = document.querySelector("[data-ai-prompt]"), aiOutput = document.querySelector("[data-ai-output]");
  consent.addEventListener("change", function () { promptButton.disabled = !consent.checked; if (!consent.checked) aiOutput.textContent = ""; });
  promptButton.addEventListener("click", function () {
    if (!consent.checked) return;
    aiOutput.textContent = "Question préparée localement — relisez et retirez toute donnée personnelle avant de la transmettre:\n« Aidez-moi à vérifier les hypothèses de ce scénario " + config.name + " sans inventer de prix, règle, horaire, disponibilité, visa ni conseil médical. Indiquez les sources officielles à consulter. »";
  });
}());
