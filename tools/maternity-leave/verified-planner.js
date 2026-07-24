(function () {
  "use strict";
  window.AFROTOOLS_VERIFIED_LEAVE_PLANNER = true;

  var byId = function (id) {
    return document.getElementById(id);
  };
  var country = byId("countrySelect");
  var compareCountry = byId("compareCountry");
  var result = byId("leaveResults");
  var status = byId("leaveStatus");
  var actionIds = ["copySummary", "exportSummary", "printLeave"];
  var summary = "";
  if (!country || !compareCountry || !result) return;

  var countries = Array.prototype.map
    .call(document.querySelectorAll(".hr-country-card"), function (card) {
      var name = card.querySelector(".hr-country-name");
      return {
        name: name ? name.textContent.trim() : "",
        value: card.getAttribute("href") || "",
      };
    })
    .filter(function (item) {
      return item.name && item.value;
    });
  countries.forEach(function (item) {
    country.add(new Option(item.name, item.value));
    compareCountry.add(new Option(item.name, item.value));
  });

  function number(id) {
    return Number(byId(id).value);
  }
  function escape(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[character];
    });
  }
  function money(value, currency) {
    return (
      currency +
      " " +
      Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }
  function endDate(start, days) {
    var date = new Date(start + "T00:00:00");
    date.setDate(date.getDate() + days - 1);
    return date.toISOString().slice(0, 10);
  }
  function setEnabled(enabled) {
    actionIds.forEach(function (id) {
      byId(id).disabled = !enabled;
    });
  }
  function invalidate(message) {
    summary = "";
    result.innerHTML =
      '<div class="hr-warn">No current result. Enter verified rule and payroll values, then calculate.</div>';
    setEnabled(false);
    status.textContent =
      message || "Values changed. Calculate again before exporting.";
  }

  byId("leaveForm").addEventListener("input", function () {
    if (summary) invalidate();
  });
  byId("leaveForm").addEventListener("change", function () {
    if (summary) invalidate();
  });
  byId("calculateLeave").addEventListener("click", function () {
    var salary = number("monthlySalary");
    var currency = byId("currencyLabel").value.trim().toUpperCase();
    var start = byId("startDate").value;
    var officialDays = number("plannedDays");
    var requestedDays = number("requestedDays");
    var officialRate = number("payRate");
    var companyDays = number("companyDays");
    var companyRate = number("companyRate");
    var sourceLabel = byId("leaveSource").value.trim();
    var sourceDate = byId("leaveSourceDate").value;
    var sourceTime = sourceDate
      ? new Date(sourceDate + "T00:00:00").getTime()
      : NaN;
    var values = [
      salary,
      officialDays,
      requestedDays,
      officialRate,
      companyDays,
      companyRate,
    ];
    if (
      !currency ||
      !start ||
      !sourceLabel ||
      !sourceDate ||
      !Number.isFinite(sourceTime) ||
      sourceTime > Date.now() ||
      values.some(function (value) {
        return !Number.isFinite(value) || value < 0;
      }) ||
      salary <= 0 ||
      officialDays < 1 ||
      requestedDays < 1 ||
      officialDays > 365 ||
      requestedDays > 365 ||
      companyDays > 365 ||
      officialRate > 100 ||
      companyRate > 100 ||
      !Number.isInteger(officialDays) ||
      !Number.isInteger(requestedDays) ||
      !Number.isInteger(companyDays)
    ) {
      invalidate(
        "Enter positive salary, currency, start date, whole leave days, 0-100 pay rates, and a non-future official source label and checked date.",
      );
      return;
    }
    var daily = salary / 30.4375;
    var officialValue = (daily * officialDays * officialRate) / 100;
    var requestedValue = (daily * requestedDays * officialRate) / 100;
    var companyValue = (daily * companyDays * companyRate) / 100;
    var countryName = country.selectedOptions[0]
      ? country.selectedOptions[0].textContent
      : "Selected country";
    var compareName = compareCountry.selectedOptions[0]
      ? compareCountry.selectedOptions[0].textContent
      : "Not selected";
    var typeName = byId("leaveType").selectedOptions[0].textContent;
    var ageDays = Math.max(0, Math.floor((Date.now() - sourceTime) / 86400000));
    var freshness =
      ageDays > 90
        ? "Source check is more than 90 days old; confirm no newer rule applies."
        : "Source checked " +
          ageDays +
          " days ago; confirm it remains effective.";
    summary = [
      "Parental leave pay planning summary",
      "Country: " + countryName,
      "Leave type: " + typeName,
      "Verified minimum: " +
        officialDays +
        " days at " +
        officialRate +
        "% = " +
        money(officialValue, currency),
      "Employee request: " +
        requestedDays +
        " days = " +
        money(requestedValue, currency),
      "Employer policy: " +
        companyDays +
        " days at " +
        companyRate +
        "% = " +
        money(companyValue, currency),
      "Leave dates: " + start + " to " + endDate(start, requestedDays),
      "Official rule source: " + sourceLabel + " (" + sourceDate + ")",
      freshness,
      "Country route to compare later: " + compareName,
      "Planning estimate only. Verify eligibility, payer, caps, tax, social-insurance steps, contract, collective agreement, and employer policy.",
    ].join("\n");
    result.innerHTML =
      '<div class="hr-res-hero"><div class="hr-res-hero-label">Verified minimum planning value</div><div class="hr-res-hero-amount">' +
      escape(money(officialValue, currency)) +
      '</div><div class="hr-res-hero-sub">Based only on the official-rule values entered above.</div></div><table class="hr-summary-table"><thead><tr><th>Scenario</th><th>Days</th><th>Rate</th><th>Planning value</th></tr></thead><tbody><tr><td>Verified minimum</td><td>' +
      officialDays +
      "</td><td>" +
      officialRate +
      "%</td><td>" +
      escape(money(officialValue, currency)) +
      "</td></tr><tr><td>Employee request</td><td>" +
      requestedDays +
      "</td><td>" +
      officialRate +
      "%</td><td>" +
      escape(money(requestedValue, currency)) +
      "</td></tr><tr><td>Employer policy</td><td>" +
      companyDays +
      "</td><td>" +
      companyRate +
      "%</td><td>" +
      escape(money(companyValue, currency)) +
      '</td></tr></tbody></table><pre class="leave-output">' +
      escape(summary) +
      "</pre>";
    setEnabled(true);
    status.textContent = "Leave plan calculated locally from entered values.";
  });

  byId("copySummary").addEventListener("click", function () {
    if (!summary) return;
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      status.textContent = "Copy is unavailable.";
      return;
    }
    navigator.clipboard
      .writeText(summary)
      .then(function () {
        status.textContent = "Leave summary copied.";
      })
      .catch(function () {
        status.textContent = "Copy failed. Select the summary manually.";
      });
  });
  byId("exportSummary").addEventListener("click", function () {
    if (!summary) return;
    var url = URL.createObjectURL(
      new Blob([summary], { type: "text/plain;charset=utf-8" }),
    );
    var link = document.createElement("a");
    link.href = url;
    link.download = "parental-leave-planning-summary.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = "Text summary downloaded.";
  });
  byId("printLeave").addEventListener("click", function () {
    if (!summary) return;
    status.textContent =
      "Opening the browser print dialog. Choose Save as PDF to create a local PDF.";
    window.print();
  });

  invalidate(
    "Enter a dated official rule and payroll assumptions to calculate.",
  );
})();
