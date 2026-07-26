(function () {
  "use strict";

  var engine = window.AfroGpaEngine;
  if (!engine) return;

  var state = {
    templateId: "direct-points",
    nextSemesterId: 2,
    semesters: [
      {
        id: 1,
        label: "Semester 1",
        courses: [
          { name: "", credits: "", value: "" },
          { name: "", credits: "", value: "" },
          { name: "", credits: "", value: "" },
          { name: "", credits: "", value: "" }
        ]
      }
    ],
    result: null,
    trackedResult: false
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function template() {
    return engine.getTemplate(
      state.templateId,
      (byId("customScale") || {}).value
    );
  }

  function track(name, details) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", name, details || {});
  }

  function status(message) {
    var target = byId("gpaStatus");
    if (target) target.textContent = message || "";
  }

  function toast(message) {
    status(message);
    if (typeof window.AfroToast === "function") window.AfroToast(message);
  }

  function format(value) {
    return Number(value || 0).toFixed(2);
  }

  function addCourse(semesterIndex) {
    state.semesters[semesterIndex].courses.push({
      name: "",
      credits: "",
      value: ""
    });
    renderSemesters();
    calculate();
  }

  function removeCourse(semesterIndex, courseIndex) {
    var courses = state.semesters[semesterIndex].courses;
    if (courses.length === 1) {
      courses[0] = { name: "", credits: "", value: "" };
    } else {
      courses.splice(courseIndex, 1);
    }
    renderSemesters();
    calculate();
  }

  function removeSemester(semesterIndex) {
    if (state.semesters.length === 1) {
      state.semesters[0].courses = [{ name: "", credits: "", value: "" }];
    } else {
      state.semesters.splice(semesterIndex, 1);
      state.semesters.forEach(function (semester, index) {
        semester.label = "Semester " + (index + 1);
      });
    }
    renderSemesters();
    calculate();
  }

  function gradeControl(currentTemplate, course, semesterIndex, courseIndex) {
    var common =
      ' data-course-field="value" data-semester="' +
      semesterIndex +
      '" data-course="' +
      courseIndex +
      '" aria-label="Grade value for course ' +
      (courseIndex + 1) +
      '"';
    if (currentTemplate.kind === "grade") {
      var options = '<option value="">Select grade</option>';
      Object.keys(currentTemplate.grades).forEach(function (grade) {
        options +=
          '<option value="' +
          escapeHtml(grade) +
          '"' +
          (String(course.value) === grade ? " selected" : "") +
          ">" +
          escapeHtml(grade) +
          " (" +
          currentTemplate.grades[grade].toFixed(1) +
          ")</option>";
      });
      return '<select class="gpa-grade-select"' + common + ">" + options + "</select>";
    }
    return (
      '<input class="gpa-course-input" type="number" min="0" max="' +
      currentTemplate.scale +
      '" step="0.01" value="' +
      escapeHtml(course.value) +
      '" placeholder="' +
      (currentTemplate.kind === "points" ? "Points" : "Score") +
      '"' +
      common +
      ">"
    );
  }

  function renderSemesters() {
    var container = byId("semestersContainer");
    if (!container) return;
    var currentTemplate = template();
    container.innerHTML = state.semesters
      .map(function (semester, semesterIndex) {
        var courses = semester.courses
          .map(function (course, courseIndex) {
            return (
              '<div class="gpa-course-card">' +
              '<input class="gpa-course-input" type="text" data-course-field="name" data-semester="' +
              semesterIndex +
              '" data-course="' +
              courseIndex +
              '" value="' +
              escapeHtml(course.name) +
              '" placeholder="Course name or code" aria-label="Course name ' +
              (courseIndex + 1) +
              '">' +
              '<input class="gpa-course-input" type="number" min="0.01" max="100" step="0.5" data-course-field="credits" data-semester="' +
              semesterIndex +
              '" data-course="' +
              courseIndex +
              '" value="' +
              escapeHtml(course.credits) +
              '" placeholder="Credits" aria-label="Credits for course ' +
              (courseIndex + 1) +
              '">' +
              gradeControl(currentTemplate, course, semesterIndex, courseIndex) +
              '<button type="button" class="gpa-course-delete" data-remove-course="' +
              semesterIndex +
              ":" +
              courseIndex +
              '" aria-label="Remove course ' +
              (courseIndex + 1) +
              '">&times;</button>' +
              "</div>"
            );
          })
          .join("");
        return (
          '<section class="gpa-semester" aria-labelledby="semester-title-' +
          semester.id +
          '">' +
          '<div class="gpa-semester-header"><h3 id="semester-title-' +
          semester.id +
          '">' +
          escapeHtml(semester.label) +
          ' <span class="sem-gpa" id="semGpa-' +
          semesterIndex +
          '"></span></h3>' +
          (state.semesters.length > 1
            ? '<button type="button" class="gpa-course-delete" data-remove-semester="' +
              semesterIndex +
              '" aria-label="Remove ' +
              escapeHtml(semester.label) +
              '">&times;</button>'
            : "") +
          "</div>" +
          '<div class="gpa-semester-body"><div class="gpa-course-labels"><span>Course</span><span>Credits</span><span>' +
          (currentTemplate.kind === "grade"
            ? "Grade"
            : currentTemplate.kind === "points"
              ? "Grade points"
              : "Score") +
          "</span><span></span></div>" +
          courses +
          '<button type="button" class="gpa-add-course" data-add-course="' +
          semesterIndex +
          '">+ Add course</button></div></section>'
        );
      })
      .join("");
  }

  function updateCourse(event) {
    var field = event.target.getAttribute("data-course-field");
    if (!field) return;
    var semesterIndex = Number(event.target.getAttribute("data-semester"));
    var courseIndex = Number(event.target.getAttribute("data-course"));
    var course =
      state.semesters[semesterIndex] &&
      state.semesters[semesterIndex].courses[courseIndex];
    if (!course) return;
    course[field] = event.target.value;
    calculate();
  }

  function calculate() {
    var currentTemplate = template();
    var result = engine.calculateAll(state.semesters, currentTemplate);
    state.result = result;

    result.semesters.forEach(function (semesterResult, index) {
      var target = byId("semGpa-" + index);
      if (target) {
        target.textContent =
          semesterResult.totalCredits > 0 ? format(semesterResult.average) : "";
      }
    });

    var resultAverage = byId("resultCgpa");
    var resultScale = byId("resultScale");
    var resultCredits = byId("resultCredits");
    var resultPoints = byId("resultPoints");
    var classBadge = byId("classBadge");
    var mobileAverage = byId("mobileGpa");
    var mobileScale = byId("mobileScale");
    var mobileClass = byId("mobileClass");
    var verified = !!(byId("gradingVerified") || {}).checked;

    if (resultAverage) resultAverage.textContent = format(result.average);
    if (resultScale) resultScale.textContent = "/ " + format(currentTemplate.scale);
    if (resultCredits) resultCredits.textContent = result.totalCredits.toFixed(1);
    if (resultPoints) resultPoints.textContent = result.totalPoints.toFixed(2);
    if (mobileAverage) mobileAverage.textContent = format(result.average);
    if (mobileScale) mobileScale.textContent = "/ " + format(currentTemplate.scale);

    var badgeText = !result.totalCredits
      ? "Add valid courses to calculate"
      : verified
        ? "Institution table checked by you"
        : "Planning result — verify the grade table";
    if (classBadge) classBadge.textContent = badgeText;
    if (mobileClass) mobileClass.textContent = verified ? "Table checked" : "Verify table";

    var ratio =
      currentTemplate.scale > 0 ? result.average / currentTemplate.scale : 0;
    var gauge = byId("gaugeFill");
    if (gauge) {
      var length = 80 * Math.PI;
      gauge.style.strokeDasharray = length;
      gauge.style.strokeDashoffset = length * (1 - Math.max(0, Math.min(1, ratio)));
      gauge.style.stroke = verified ? "#059669" : "#D97706";
    }

    if (result.invalidCourses > 0) {
      status(
        result.invalidCourses +
          " incomplete or out-of-range course row" +
          (result.invalidCourses === 1 ? " is" : "s are") +
          " excluded."
      );
    } else if (result.totalCredits > 0) {
      status(
        "Weighted result ready. " +
          (verified
            ? "You confirmed the table against your institution."
            : "Check the selected example against your institution before relying on it.")
      );
    } else {
      status("Enter at least one course, a positive credit value, and a valid grade or score.");
    }

    renderTrend(result, currentTemplate.scale);
    renderReplacementOptions();
    if (result.totalCredits > 0 && !state.trackedResult) {
      state.trackedResult = true;
      track("calculation_completed", {
        template_kind: currentTemplate.kind,
        course_count_bucket: engine.bucketCourseCount(result.validCourses),
        institution_table_confirmed: verified
      });
    }
  }

  function renderTrend(result, scale) {
    var wrapper = byId("semesterTrend");
    var bars = byId("trendBars");
    var usable = result.semesters.filter(function (item) {
      return item.totalCredits > 0;
    });
    if (!wrapper || !bars) return;
    wrapper.style.display = usable.length > 1 ? "" : "none";
    bars.innerHTML = usable
      .map(function (item, index) {
        var height = Math.max(5, Math.min(100, (item.average / scale) * 100));
        return (
          '<div class="gpa-trend-bar" style="height:' +
          height +
          '%"><span class="tip">S' +
          (index + 1) +
          ": " +
          format(item.average) +
          "</span></div>"
        );
      })
      .join("");
  }

  function renderTemplateBoundary() {
    var currentTemplate = template();
    var note = byId("gradingTemplateNote");
    var scaleGroup = byId("customScaleGroup");
    if (note) note.textContent = currentTemplate.note;
    if (scaleGroup) {
      scaleGroup.hidden = currentTemplate.kind !== "points";
    }
    var transcriptDescription = byId("transcriptFormatNote");
    if (transcriptDescription) {
      transcriptDescription.textContent =
        currentTemplate.kind === "grade"
          ? "Use Course, Credits, Grade. Grades must match the selected example table."
          : "Use Course, Credits, " +
            (currentTemplate.kind === "points" ? "Grade points" : "Score") +
            ". Values must be within 0 and " +
            currentTemplate.scale +
            ".";
    }
  }

  function setTemplate(templateId) {
    state.templateId = templateId;
    state.semesters.forEach(function (semester) {
      semester.courses.forEach(function (course) {
        course.value = "";
      });
    });
    state.trackedResult = false;
    renderTemplateBoundary();
    renderSemesters();
    calculate();
  }

  function activateTab(tabId) {
    document.querySelectorAll(".gpa-tab").forEach(function (button) {
      var active = button.getAttribute("data-tab") === tabId;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
      button.setAttribute("tabindex", active ? "0" : "-1");
    });
    document.querySelectorAll(".gpa-tab-content").forEach(function (panel) {
      panel.classList.toggle("active", panel.id === tabId);
    });
    if (tabId === "tab-whatif" && state.result && state.result.totalCredits > 0) {
      [
        ["wfCurrentCgpa", state.result.average.toFixed(2)],
        ["wfCurrentCredits", state.result.totalCredits.toFixed(1)]
      ].forEach(function (item) {
        var field = byId(item[0]);
        if (field && !field.value) field.value = item[1];
      });
    }
  }

  function splitCsvLine(line) {
    var values = [];
    var value = "";
    var quoted = false;
    for (var index = 0; index < line.length; index += 1) {
      var char = line[index];
      if (char === '"') {
        if (quoted && line[index + 1] === '"') {
          value += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        values.push(value.trim());
        value = "";
      } else {
        value += char;
      }
    }
    values.push(value.trim());
    return values;
  }

  function parseRows(text) {
    var rows = [];
    String(text || "")
      .split(/\r?\n/)
      .forEach(function (line, lineIndex) {
        var trimmed = line.trim();
        if (!trimmed) return;
        var values = trimmed.indexOf(",") >= 0
          ? splitCsvLine(trimmed)
          : trimmed.indexOf("\t") >= 0
            ? trimmed.split("\t").map(function (value) { return value.trim(); })
            : null;
        if (!values || values.length < 3) {
          var match = trimmed.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s+([A-Za-z][+-]?|\d+(?:\.\d+)?)$/);
          values = match ? [match[1], match[2], match[3]] : [];
        }
        if (
          lineIndex === 0 &&
          values.some(function (value) {
            return /course|credit|grade|point|score/i.test(value);
          })
        ) {
          return;
        }
        if (values.length >= 3) {
          rows.push({
            name: values.slice(0, values.length - 2).join(" ").trim(),
            credits: values[values.length - 2].trim(),
            value: values[values.length - 1].trim()
          });
        }
      });
    return rows;
  }

  function previewRows(rows, targetId) {
    var target = byId(targetId);
    if (!target) return;
    var currentTemplate = template();
    var checked = rows.map(function (row) {
      return {
        row: row,
        valid:
          engine.calculateSemester([row], currentTemplate).validCourses === 1
      };
    });
    var validRows = checked.filter(function (item) { return item.valid; });
    if (!rows.length) {
      target.innerHTML =
        '<p class="gpa-inline-error" role="alert">No rows were detected. Use Course, Credits, Grade or Score.</p>';
      return;
    }
    target.innerHTML =
      '<div class="gpa-import-preview"><p><strong>' +
      validRows.length +
      " of " +
      rows.length +
      " rows are valid for this template.</strong> Invalid rows will not be imported.</p>" +
      '<div class="gpa-preview-scroll"><table class="gpa-preview-table"><thead><tr><th>Course</th><th>Credits</th><th>Grade or score</th><th>Status</th></tr></thead><tbody>' +
      checked
        .map(function (item) {
          return (
            "<tr><td>" +
            escapeHtml(item.row.name || "Unnamed") +
            "</td><td>" +
            escapeHtml(item.row.credits) +
            "</td><td>" +
            escapeHtml(item.row.value) +
            "</td><td>" +
            (item.valid ? "Valid" : "Check row") +
            "</td></tr>"
          );
        })
        .join("") +
      '</tbody></table></div><button type="button" class="gpa-btn gpa-btn-primary" data-import-preview="' +
      targetId +
      '"' +
      (validRows.length ? "" : " disabled") +
      ">Add valid rows as a semester</button></div>";
    target._validRows = validRows.map(function (item) { return item.row; });
  }

  function importPreview(targetId) {
    var target = byId(targetId);
    var rows = (target && target._validRows) || [];
    if (!rows.length) return;
    state.semesters.push({
      id: state.nextSemesterId++,
      label: "Imported semester",
      courses: rows
    });
    renderSemesters();
    calculate();
    activateTab("tab-semester");
    toast(rows.length + " valid course rows imported locally.");
  }

  function populateNormalizer() {
    var options = [
      { value: 4, label: "Maximum 4.0" },
      { value: 5, label: "Maximum 5.0" },
      { value: 20, label: "Maximum 20" },
      { value: 100, label: "Maximum 100" }
    ];
    ["convertFrom", "convertTo"].forEach(function (id) {
      var select = byId(id);
      if (!select) return;
      select.innerHTML = options
        .map(function (option) {
          return '<option value="' + option.value + '">' + option.label + "</option>";
        })
        .join("");
    });
    if (byId("convertFrom")) byId("convertFrom").value = "5";
    if (byId("convertTo")) byId("convertTo").value = "4";
    var table = byId("referenceTable");
    if (table) {
      table.innerHTML =
        "<thead><tr><th>Input</th><th>Position in scale</th><th>Planning output</th><th>Not supplied</th></tr></thead>" +
        "<tbody><tr><td>4.0 / 5.0</td><td>80%</td><td>3.2 / 4.0</td><td>Credential equivalence</td></tr>" +
        "<tr><td>15 / 20</td><td>75%</td><td>75 / 100</td><td>Degree classification</td></tr></tbody>";
    }
  }

  function normalize() {
    var value = (byId("convertFromValue") || {}).value;
    var from = (byId("convertFrom") || {}).value;
    var to = (byId("convertTo") || {}).value;
    var output = byId("conversionOutput");
    var result = engine.normalizeScale(value, from, to);
    if (!output) return;
    output.style.display = "";
    output.innerHTML = result
      ? '<div class="from-val">' +
        escapeHtml(value) +
        " / " +
        escapeHtml(from) +
        '</div><div aria-hidden="true">&darr;</div><div class="to-val">' +
        result.normalizedValue.toFixed(2) +
        " / " +
        escapeHtml(to) +
        '</div><p class="gpa-normalizer-warning">Same relative position (' +
        (result.position * 100).toFixed(1) +
        "%), not an official GPA, credential, admission, or scholarship equivalence.</p>"
      : '<p class="gpa-inline-error" role="alert">Enter a value from 0 to the selected source maximum.</p>';
  }

  function calculateTarget() {
    var currentTemplate = template();
    var required = engine.requiredAverage(
      (byId("wfCurrentCgpa") || {}).value,
      (byId("wfCurrentCredits") || {}).value,
      (byId("wfTargetCgpa") || {}).value,
      (byId("wfUpcomingCredits") || {}).value
    );
    var target = byId("whatifResult");
    if (!target) return;
    if (required === null) {
      target.innerHTML =
        '<div class="gpa-whatif-result impossible" role="alert">Enter valid non-negative averages and credits. Upcoming credits must be greater than zero.</div>';
      return;
    }
    if (required > currentTemplate.scale) {
      target.innerHTML =
        '<div class="gpa-whatif-result impossible"><strong>Not reachable in the entered credits.</strong><p>You would need ' +
        required.toFixed(2) +
        " on a " +
        currentTemplate.scale.toFixed(2) +
        " maximum.</p></div>";
    } else if (required <= 0) {
      target.innerHTML =
        '<div class="gpa-whatif-result possible"><strong>The entered target is already secured mathematically.</strong><p>Confirm your institution’s progression and repeat-course rules separately.</p></div>';
    } else {
      target.innerHTML =
        '<div class="gpa-whatif-result possible"><strong>Required upcoming weighted average: ' +
        required.toFixed(2) +
        " / " +
        currentTemplate.scale.toFixed(2) +
        "</strong><p>This assumes every entered credit contributes exactly as shown.</p></div>";
    }
  }

  function renderReplacementOptions() {
    var select = byId("wfReplaceCourse");
    if (!select) return;
    var options = '<option value="">Choose a completed course</option>';
    state.semesters.forEach(function (semester, semesterIndex) {
      semester.courses.forEach(function (course, courseIndex) {
        if (course.name && course.credits && String(course.value).trim()) {
          options +=
            '<option value="' +
            semesterIndex +
            ":" +
            courseIndex +
            '">' +
            escapeHtml(course.name) +
            " (" +
            escapeHtml(course.value) +
            ")</option>";
        }
      });
    });
    select.innerHTML = options;
  }

  function calculateReplacement() {
    var selected = (byId("wfReplaceCourse") || {}).value;
    var newRaw = (byId("wfReplaceGrade") || {}).value;
    var target = byId("whatifResult");
    if (!selected || !target || !state.result) {
      if (target) target.innerHTML = '<div class="gpa-whatif-result impossible">Choose a completed course and enter the replacement grade or score.</div>';
      return;
    }
    var parts = selected.split(":").map(Number);
    var course =
      state.semesters[parts[0]] &&
      state.semesters[parts[0]].courses[parts[1]];
    var currentTemplate = template();
    var oldValue = engine.valueForCourse(course, currentTemplate);
    var newValue = engine.valueForCourse({ value: newRaw }, currentTemplate);
    var next = engine.replacementAverage(
      state.result.totalPoints,
      state.result.totalCredits,
      oldValue,
      newValue,
      course && course.credits
    );
    target.innerHTML =
      next === null
        ? '<div class="gpa-whatif-result impossible">The replacement grade or score is invalid for the selected template.</div>'
        : '<div class="gpa-whatif-result possible"><strong>Planning CGPA after replacement: ' +
          next.toFixed(2) +
          " / " +
          currentTemplate.scale.toFixed(2) +
          "</strong><p>This assumes the institution replaces the old contribution completely. Confirm its repeat-course policy.</p></div>";
  }

  function sampleCsv() {
    var currentTemplate = template();
    var sampleValue =
      currentTemplate.kind === "grade"
        ? Object.keys(currentTemplate.grades)[0]
        : currentTemplate.kind === "points"
          ? Math.min(currentTemplate.scale, 4).toFixed(1)
          : (currentTemplate.scale * 0.75).toFixed(1);
    var content =
      "Course,Credits,Grade or score\nExample course,3," + sampleValue + "\n";
    var url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = "gpa-import-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function copyResult() {
    var currentTemplate = template();
    var result = state.result || engine.calculateAll([], currentTemplate);
    var text =
      "AfroTools GPA worksheet\nWeighted result: " +
      result.average.toFixed(2) +
      " / " +
      currentTemplate.scale.toFixed(2) +
      "\nCredits: " +
      result.totalCredits.toFixed(1) +
      "\nTemplate: " +
      currentTemplate.name +
      "\nVerification: " +
      ((byId("gradingVerified") || {}).checked
        ? "User confirmed the table against their institution."
        : "Example table not confirmed.") +
      "\n\nPlanning worksheet only. Confirm official transcript, classification, repeat-course, admission and scholarship rules.";
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast("Result copied. It was not placed in a share URL.");
      });
    }
  }

  function shareRoute(network) {
    var url = "https://afrotools.com/tools/gpa-calculator/";
    var target =
      network === "whatsapp"
        ? "https://wa.me/?text=" + encodeURIComponent("Private GPA worksheet: " + url)
        : "https://twitter.com/intent/tweet?text=" +
          encodeURIComponent("Private GPA and CGPA worksheet " + url);
    window.open(target, "_blank", "noopener,noreferrer");
    track("result_shared", { method: network, payload: "route_only" });
  }

  function bind() {
    byId("gradingSystem").addEventListener("change", function () {
      setTemplate(this.value);
    });
    byId("customScale").addEventListener("input", function () {
      renderTemplateBoundary();
      renderSemesters();
      calculate();
    });
    byId("gradingVerified").addEventListener("change", calculate);
    byId("semestersContainer").addEventListener("input", updateCourse);
    byId("semestersContainer").addEventListener("change", updateCourse);
    byId("semestersContainer").addEventListener("click", function (event) {
      var add = event.target.getAttribute("data-add-course");
      var remove = event.target.getAttribute("data-remove-course");
      var removeSem = event.target.getAttribute("data-remove-semester");
      if (add !== null) addCourse(Number(add));
      if (remove) {
        var parts = remove.split(":").map(Number);
        removeCourse(parts[0], parts[1]);
      }
      if (removeSem !== null) removeSemester(Number(removeSem));
    });
    document.querySelectorAll(".gpa-tab").forEach(function (button) {
      button.addEventListener("click", function () {
        activateTab(this.getAttribute("data-tab"));
      });
    });
    document.querySelectorAll(".gpa-whatif-mode").forEach(function (button) {
      button.addEventListener("click", function () {
        var mode = this.getAttribute("data-mode");
        document.querySelectorAll(".gpa-whatif-mode").forEach(function (item) {
          item.classList.toggle("active", item === button);
        });
        document.querySelectorAll(".gpa-whatif-form").forEach(function (form) {
          form.classList.toggle("active", form.id === "whatif-" + mode);
        });
        byId("whatifResult").innerHTML = "";
      });
    });
    document.querySelectorAll(".gpa-faq-q").forEach(function (button) {
      button.setAttribute("role", "button");
      button.setAttribute("tabindex", "0");
      button.setAttribute("aria-expanded", "false");
      function toggle() {
        var item = button.closest(".gpa-faq-item");
        var open = !item.classList.contains("open");
        item.classList.toggle("open", open);
        button.setAttribute("aria-expanded", open ? "true" : "false");
      }
      button.addEventListener("click", toggle);
      button.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      });
    });
    byId("addSemesterBtn").addEventListener("click", function () {
      state.semesters.push({
        id: state.nextSemesterId++,
        label: "Semester " + (state.semesters.length + 1),
        courses: [{ name: "", credits: "", value: "" }]
      });
      renderSemesters();
      calculate();
    });
    byId("clearAllBtn").addEventListener("click", function () {
      if (!window.confirm("Clear the current worksheet? Nothing has been sent or automatically saved.")) return;
      state.semesters = [{
        id: state.nextSemesterId++,
        label: "Semester 1",
        courses: [
          { name: "", credits: "", value: "" },
          { name: "", credits: "", value: "" },
          { name: "", credits: "", value: "" },
          { name: "", credits: "", value: "" }
        ]
      }];
      state.trackedResult = false;
      renderSemesters();
      calculate();
    });
    byId("parseTranscriptBtn").addEventListener("click", function () {
      previewRows(parseRows((byId("transcriptText") || {}).value), "transcriptPreview");
    });
    byId("downloadSampleBtn").addEventListener("click", sampleCsv);
    byId("transcriptPreview").addEventListener("click", function (event) {
      if (event.target.hasAttribute("data-import-preview")) importPreview("transcriptPreview");
    });
    byId("csvPreview").addEventListener("click", function (event) {
      if (event.target.hasAttribute("data-import-preview")) importPreview("csvPreview");
    });
    var dropZone = byId("csvDropZone");
    var fileInput = byId("csvFileInput");
    dropZone.addEventListener("click", function () { fileInput.click(); });
    dropZone.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fileInput.click();
      }
    });
    ["dragover", "drop"].forEach(function (eventName) {
      dropZone.addEventListener(eventName, function (event) {
        event.preventDefault();
      });
    });
    dropZone.addEventListener("drop", function (event) {
      var file = event.dataTransfer.files[0];
      if (file) readCsv(file);
    });
    fileInput.addEventListener("change", function () {
      if (this.files[0]) readCsv(this.files[0]);
    });
    byId("convertBtn").addEventListener("click", normalize);
    byId("convertFromValue").addEventListener("input", normalize);
    byId("calcTargetGpaBtn").addEventListener("click", calculateTarget);
    byId("calcReplaceBtn").addEventListener("click", calculateReplacement);
    byId("shareWhatsapp").addEventListener("click", function () { shareRoute("whatsapp"); });
    byId("shareTwitter").addEventListener("click", function () { shareRoute("twitter"); });
    byId("shareCopy").addEventListener("click", copyResult);
    byId("sharePdf").addEventListener("click", function () {
      window.print();
      track("result_exported", { format: "print_pdf", contains_academic_data: true });
    });
  }

  function readCsv(file) {
    if (!/\.csv$/i.test(file.name)) {
      toast("Choose a CSV file.");
      return;
    }
    var reader = new FileReader();
    reader.addEventListener("load", function () {
      previewRows(parseRows(reader.result), "csvPreview");
    });
    reader.readAsText(file);
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderTemplateBoundary();
    renderSemesters();
    populateNormalizer();
    bind();
    calculate();
    var scholarshipList = byId("scholarshipsList");
    if (scholarshipList) {
      scholarshipList.innerHTML =
        '<ol class="gpa-check-list"><li>Open the opportunity’s current official page.</li><li>Check degree, country, experience, language, deadline, and document rules.</li><li>Use any published GPA threshold in the institution’s own scale; do not rely on proportional conversion.</li></ol><a class="gpa-source-link" href="/tools/scholarship-finder/">Open the source-linked Scholarship Finder</a>';
    }
    var boundary = byId("dykText");
    if (boundary) {
      boundary.textContent =
        "The worksheet multiplies each valid course value by its credits, totals those products, then divides by total credits. It does not decide an official class, admission result, scholarship eligibility, or credential equivalence.";
    }
    track("tool_opened", { template_kind: "points", privacy_mode: "local_only" });
  });
})();
