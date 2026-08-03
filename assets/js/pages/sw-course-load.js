(function () {
  "use strict";

  var engine = window.CourseLoadEngine;
  var current = null;
  var rowCount = 0;
  var $ = function (id) { return document.getElementById(id); };
  var AUDIT = [
    "Kila kozi ya sasa inahesabiwa kwenye jumla ya programu hii",
    "Masharti ya awali na masharti sambamba yametimizwa",
    "Kozi za lazima, makundi ya hiari na kanuni za kutorudia zimetimizwa",
    "Krediti zilizorudiwa na zilizohamishwa zimetendewa kwa usahihi",
    "Masharti ya muda wa masomo na krediti za kiwango maalumu yametimizwa",
    "GPA, mradi wa mwisho, mafunzo kwa vitendo na vibali vimekaguliwa"
  ];

  function element(tag, attributes) {
    var node = document.createElement(tag);
    Object.keys(attributes || {}).forEach(function (key) {
      if (key === "text") node.textContent = attributes[key];
      else node.setAttribute(key, attributes[key]);
    });
    return node;
  }

  function setExports(enabled) {
    document.querySelectorAll("[data-export]").forEach(function (button) {
      button.disabled = !enabled;
    });
  }

  function clearInvalid() {
    document.querySelectorAll('[aria-invalid="true"]').forEach(function (control) {
      control.setAttribute("aria-invalid", "false");
      control.removeAttribute("aria-describedby");
    });
    $("formError").textContent = "";
  }

  function status(message, failed) {
    var node = $("actionStatus");
    node.textContent = message || "";
    node.classList.toggle("error", Boolean(failed));
  }

  function invalidate() {
    var hadResult = Boolean(current);
    current = null;
    $("resultCard").hidden = true;
    setExports(false);
    clearInvalid();
    status(hadResult ? "Matokeo ya zamani yamefutwa. Tengeneza mpango tena baada ya mabadiliko." : "", false);
  }

  function addCourse(name, credits) {
    rowCount += 1;
    var row = element("div", { "class": "course-row", "data-course-row": String(rowCount) });
    var nameWrap = element("div");
    var nameId = "courseName" + rowCount;
    var nameLabel = element("label", { "for": nameId, text: "Jina au msimbo wa kozi" });
    var nameInput = element("input", {
      id: nameId, type: "text", maxlength: "80", autocomplete: "off",
      placeholder: "kwa mfano BIO 201", "class": "control course-name"
    });
    nameInput.value = name || "";
    nameWrap.append(nameLabel, nameInput);

    var creditWrap = element("div");
    var creditId = "courseCredits" + rowCount;
    var creditLabel = element("label", { "for": creditId, text: "Krediti" });
    var creditInput = element("input", {
      id: creditId, type: "number", min: "0.01", max: "100", step: "0.01",
      inputmode: "decimal", placeholder: "kwa mfano 3", "class": "control course-credits"
    });
    creditInput.value = credits || "";
    creditWrap.append(creditLabel, creditInput);

    var remove = element("button", { type: "button", text: "Ondoa kozi", "aria-label": "Ondoa kozi hii" });
    remove.className = "remove-course";
    remove.addEventListener("click", function () {
      row.remove();
      invalidate();
      $("addCourse").focus();
    });
    [nameInput, creditInput].forEach(function (input) { input.addEventListener("input", invalidate); });
    row.append(nameWrap, creditWrap, remove);
    $("courseList").appendChild(row);
    return nameInput;
  }

  function value(id) { return $(id).value.trim(); }

  function courses() {
    return Array.from(document.querySelectorAll(".course-row")).map(function (row) {
      return {
        name: row.querySelector(".course-name").value,
        credits: row.querySelector(".course-credits").value
      };
    }).filter(function (course) { return course.name.trim() || course.credits !== ""; });
  }

  function input() {
    return {
      required: value("programmeCredits"), earned: value("earnedCredits"),
      min: value("minimumCredits"), max: value("maximumCredits"), courses: courses(),
      contact: value("contactHours"), study: value("studyHours"), work: value("workHours"),
      commute: value("commuteHours"), sleepNight: value("sleepHours"), personal: value("personalHours")
    };
  }

  function number(value) {
    return Number(value.toFixed(2)).toLocaleString("sw-TZ", { maximumFractionDigits: 2 });
  }

  function courseName(name) {
    return String(name).replace(/^Course (\d+)$/, "Kozi $1");
  }

  function metric(parent, title, result, note) {
    var card = element("div", { "class": "metric" });
    card.append(element("span", { text: title }), element("strong", { text: result }), element("small", { text: note }));
    parent.appendChild(card);
  }

  function bandCopy(plan) {
    if (plan.band === "below") {
      return ["Chini ya kiwango cha chini ulichoweka", "Jumla iliyoorodheshwa ni krediti " + number(plan.min - plan.registered) + " chini ya kiwango cha chini cha taasisi ulichoingiza. Thibitisha kanuni ya mzigo uliopunguzwa au kibali kinachohusika."];
    }
    if (plan.band === "above") {
      return ["Juu ya kiwango cha juu ulichoweka", "Jumla iliyoorodheshwa ni krediti " + number(plan.registered - plan.max) + " juu ya kiwango cha juu cha taasisi ulichoingiza. Thibitisha mchakato wa sasa wa mzigo wa ziada kabla ya usajili."];
    }
    return ["Ndani ya kiwango ulichoingiza", "Jumla iliyoorodheshwa iko kati ya kiwango cha chini na juu ulichoingiza. Hii haithibitishi masharti ya awali wala kuidhinisha usajili."];
  }

  function render(plan) {
    var copy = bandCopy(plan);
    $("ruleResult").replaceChildren(element("strong", { text: copy[0] }), element("span", { text: copy[1] }));
    var metrics = $("metricGrid");
    metrics.replaceChildren();
    metric(metrics, "Krediti zilizoandikishwa", number(plan.registered), "Jumla ya kozi ulizoorodhesha");
    metric(metrics, "Maendeleo ya krediti zilizopatikana", plan.progress.toFixed(1) + "%", number(plan.earned) + " kati ya " + number(plan.required) + " ulizoingiza");
    metric(metrics, "Zilizobaki kabla ya za sasa", number(plan.remainingBefore), "Utoaji wa krediti pekee");
    metric(metrics, "Zilizobaki ikiwa za sasa zitahesabiwa", number(plan.remainingIfCompleted), "Hudhania kukamilisha na kuhesabiwa kwenye programu");
    metric(metrics, "Saa za wiki zilizoorodheshwa", number(plan.accounted), "Kati ya saa 168 za kalenda");
    metric(metrics, plan.unallocated >= 0 ? "Saa za wiki ambazo hazijagawiwa" : "Saa zinazozidi 168", number(Math.abs(plan.unallocated)), plan.unallocated >= 0 ? "Hakuna uamuzi wa uwezo wa mzigo" : "Shughuli ulizoingiza zinaingiliana au kuzidi wiki");

    var body = $("courseResults");
    body.replaceChildren();
    plan.courses.forEach(function (course) {
      var row = document.createElement("tr");
      row.append(element("td", { text: courseName(course.name) }), element("td", { text: number(course.credits) }));
      body.appendChild(row);
    });
    $("courseTotal").textContent = number(plan.registered);

    var audit = $("auditList");
    audit.replaceChildren();
    AUDIT.forEach(function (text, index) {
      var label = element("label", { "class": "audit-item" });
      var checkbox = element("input", { type: "checkbox", "data-audit": String(index), "aria-label": text });
      label.append(checkbox, element("span", { text: text }));
      audit.appendChild(label);
    });
    $("resultCard").hidden = false;
    setExports(true);
    $("resultCard").focus();
  }

  function errorDetails(message) {
    var course = message.match(/^Course (\d+) credits/);
    if (course) return { control: document.querySelectorAll(".course-credits")[Number(course[1]) - 1], text: "Weka krediti za kozi ya " + course[1] + " kati ya 0.01 na 100." };
    var map = [
      [/^Programme credits/, "programmeCredits", "Weka jumla ya krediti za programu kati ya 1 na 1000."],
      [/^Earned credits/, "earnedCredits", "Weka krediti ulizopata kati ya 0 na 1000."],
      [/^Minimum credits cannot/, "minimumCredits", "Kiwango cha chini hakiwezi kuzidi kiwango cha juu."],
      [/^Minimum credits/, "minimumCredits", "Weka kiwango cha chini kati ya 0 na 100."],
      [/^Maximum credits/, "maximumCredits", "Weka kiwango cha juu kati ya 0.01 na 100."],
      [/^Class and placement hours/, "contactHours", "Weka saa za darasa kati ya 0 na 168."],
      [/^Independent study hours/, "studyHours", "Weka saa za kujisomea kati ya 0 na 168."],
      [/^Work and caregiving hours/, "workHours", "Weka saa za kazi na malezi kati ya 0 na 168."],
      [/^Commute hours/, "commuteHours", "Weka saa za usafiri kati ya 0 na 168."],
      [/^Sleep per night/, "sleepHours", "Weka usingizi kwa usiku kati ya saa 0 na 24."],
      [/^Personal hours/, "personalHours", "Weka saa binafsi kati ya 0 na 168."]
    ];
    for (var index = 0; index < map.length; index += 1) {
      if (map[index][0].test(message)) return { control: $(map[index][1]), text: map[index][2] };
    }
    if (/^Add at least one course/.test(message)) return { control: $("addCourse"), text: "Ongeza angalau kozi moja yenye krediti." };
    return { control: $("courseLoadForm"), text: "Kagua thamani ulizoingiza na ujaribu tena." };
  }

  function calculate(event) {
    if (event) event.preventDefault();
    clearInvalid();
    status("", false);
    try {
      current = engine.calculate(input());
      render(current);
    } catch (error) {
      current = null;
      $("resultCard").hidden = true;
      setExports(false);
      var details = errorDetails(error.message || "");
      $("formError").textContent = details.text;
      if (details.control) {
        details.control.setAttribute("aria-invalid", "true");
        details.control.setAttribute("aria-describedby", "formError");
        details.control.focus();
      }
    }
  }

  function report() {
    if (!current) return "";
    var source = value("ruleSource") || "haikuandikwa";
    var checked = value("ruleChecked") || "haikuandikwa";
    var band = bandCopy(current)[0];
    var lines = [
      "Mpango wa ukaguzi wa mzigo wa kozi - AfroTools",
      "Chanzo cha kanuni: " + source,
      "Tarehe ya ukaguzi wa kanuni: " + checked,
      "Krediti za programu zilizoingizwa: " + number(current.required),
      "Krediti zilizopatikana rasmi: " + number(current.earned),
      "Kiwango cha muhula kilichoingizwa: " + number(current.min) + " hadi " + number(current.max),
      "", "Kozi zilizoorodheshwa"
    ];
    current.courses.forEach(function (course) { lines.push("- " + courseName(course.name) + ": krediti " + number(course.credits)); });
    lines.push(
      "Jumla iliyoandikishwa: " + number(current.registered),
      "Ulinganisho wa kiwango: " + band,
      "Zilizobaki kabla ya za sasa: " + number(current.remainingBefore),
      "Zilizobaki ikiwa kozi zote za sasa zitakamilika na kuhesabiwa: " + number(current.remainingIfCompleted),
      "", "Orodha ya muda wa wiki",
      "- Darasa, maabara na mafunzo kwa vitendo: " + number(current.time.contact),
      "- Kujisomea: " + number(current.time.study),
      "- Kazi na malezi: " + number(current.time.work),
      "- Usafiri: " + number(current.time.commute),
      "- Usingizi: " + number(current.time.sleepNight) + " kwa usiku / " + number(current.time.sleepNight * 7) + " kwa wiki",
      "- Chakula, afya na muda binafsi: " + number(current.time.personal),
      "- Jumla iliyoorodheshwa: " + number(current.accounted),
      current.unallocated >= 0 ? "- Saa ambazo hazijagawiwa kati ya 168: " + number(current.unallocated) : "- Saa zinazozidi 168: " + number(Math.abs(current.unallocated)),
      "", "Ukaguzi wa masharti ya taasisi"
    );
    document.querySelectorAll("[data-audit]").forEach(function (box, index) { lines.push((box.checked ? "[x] " : "[ ] ") + AUDIT[index]); });
    lines.push("", "Hii ni hesabu, si idhini ya usajili, uamuzi wa mzigo mzito, hukumu ya muda wa wiki au utabiri wa kuhitimu. Thibitisha kila sharti na chanzo cha sasa cha taasisi.", "Taarifa zinabaki kwenye kivinjari hiki; hakuna utumaji kwa seva au AI.");
    return lines.join("\n");
  }

  function copyPlan() {
    var text = report();
    if (!text) return;
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      status("Kunakili hakupatikani. Pakua faili ya TXT badala yake.", true);
      return;
    }
    navigator.clipboard.writeText(text).then(function () {
      status("Mpango wa ukaguzi umenakiliwa.", false);
    }).catch(function () {
      status("Kunakili hakupatikani. Pakua faili ya TXT badala yake.", true);
    });
  }

  function downloadTxt() {
    var text = report();
    if (!text) return;
    var url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = "ukaguzi-wa-mzigo-wa-kozi.txt";
    link.click();
    URL.revokeObjectURL(url);
    status("Mpango wa TXT umepakuliwa.", false);
  }

  function clearTool() {
    $("courseLoadForm").reset();
    $("courseList").replaceChildren();
    rowCount = 0;
    addCourse();
    addCourse();
    current = null;
    $("resultCard").hidden = true;
    clearInvalid();
    status("", false);
    setExports(false);
    $("programmeCredits").focus();
  }

  function toggleTheme() {
    var root = document.documentElement;
    var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    root.style.colorScheme = next;
    $("themeToggle").setAttribute("aria-pressed", String(next === "dark"));
    $("themeToggle").textContent = next === "dark" ? "Mandhari angavu" : "Mandhari ya giza";
  }

  function hardenNavbarContrast() {
    if (!window.customElements || typeof window.customElements.whenDefined !== "function") return;
    window.customElements.whenDefined("afro-navbar").then(function () {
      var navbar = document.querySelector("afro-navbar");
      if (!navbar || !navbar.shadowRoot) return;
      var applyContrast = function () {
        if (navbar.shadowRoot.querySelector("[data-course-load-contrast]")) return;
        var style = document.createElement("style");
        style.setAttribute("data-course-load-contrast", "");
        style.textContent = ":host(.theme-dark) .logo-name b{color:#93c5fd}:host(.theme-dark) .lang-btn,:host(.theme-dark) .btn-login{background:#122033;border-color:#64748b;color:#eef5ff}@media(prefers-color-scheme:dark){.logo-name b{color:#93c5fd}.lang-btn,.btn-login{background:#122033;border-color:#64748b;color:#eef5ff}}";
        navbar.shadowRoot.appendChild(style);
      };
      new MutationObserver(applyContrast).observe(navbar.shadowRoot, { childList: true });
      applyContrast();
    }).catch(function () {});
  }

  if (!engine || typeof engine.calculate !== "function") {
    $("formError").textContent = "Kikokotoo hakikupakiwa. Pakia ukurasa upya bila kutuma taarifa zako.";
    return;
  }
  $("courseLoadForm").addEventListener("submit", calculate);
  $("addCourse").addEventListener("click", function () { var control = addCourse(); invalidate(); control.focus(); });
  $("clearTool").addEventListener("click", clearTool);
  $("copyPlan").addEventListener("click", copyPlan);
  $("downloadTxt").addEventListener("click", downloadTxt);
  $("printPdf").addEventListener("click", function () { if (report()) window.print(); });
  $("themeToggle").addEventListener("click", toggleTheme);
  document.querySelectorAll("#courseLoadForm > fieldset:first-of-type input, #courseLoadForm > fieldset:nth-of-type(3) input").forEach(function (control) {
    control.addEventListener("input", invalidate);
  });
  addCourse();
  addCourse();
  setExports(false);
  hardenNavbarContrast();
  document.documentElement.setAttribute("data-sw-course-load-ready", "true");
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.swCourseLoad = { calculate: calculate, report: report, invalidate: invalidate };
}());
