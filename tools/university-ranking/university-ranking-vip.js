(function () {
  "use strict";

  const engine = window.AfroTools && window.AfroTools.universityComparisonEngine;
  if (!engine) return;

  const list = document.getElementById("candidateList");
  const template = document.getElementById("candidateTemplate");
  const error = document.getElementById("comparisonError");
  const results = document.getElementById("comparisonResults");
  const status = document.getElementById("exportStatus");
  let lastComparison = null;
  let nextId = 1;

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function todayIso() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function addCandidate() {
    if (list.children.length >= 5) {
      error.textContent = "This focused comparison supports up to five candidates.";
      return;
    }
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".uv-candidate");
    const id = nextId++;
    card.dataset.id = String(id);
    card.querySelector("[data-number]").textContent = String(list.children.length + 1);
    card.querySelectorAll("[data-field]").forEach(field => {
      const name = field.dataset.field;
      field.id = `candidate-${id}-${name}`;
      field.closest("label").setAttribute("for", field.id);
    });
    card.querySelector("[data-field=name]").addEventListener("input", event => {
      card.querySelector("[data-heading]").textContent = event.target.value.trim() || "University candidate";
    });
    card.querySelector("[data-remove]").addEventListener("click", () => {
      if (list.children.length <= 2) {
        error.textContent = "Keep at least two candidate forms for a comparison.";
        return;
      }
      card.remove();
      renumber();
    });
    list.appendChild(fragment);
  }

  function renumber() {
    Array.from(list.children).forEach((card, index) => {
      card.querySelector("[data-number]").textContent = String(index + 1);
    });
  }

  function readCandidates() {
    return Array.from(list.querySelectorAll(".uv-candidate")).map(card => {
      const candidate = {};
      card.querySelectorAll("[data-field]").forEach(field => {
        candidate[field.dataset.field] = field.value;
      });
      return candidate;
    });
  }

  function formatMoney(value) {
    const currency = document.getElementById("comparisonCurrency").value;
    if (value === null) return "Not fully entered";
    try {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency,
        maximumFractionDigits: 0
      }).format(value).replace(/\u00a0/g, " ");
    } catch (_error) {
      return `${currency} ${Math.round(value).toLocaleString()}`;
    }
  }

  function deadlineLabel(candidate) {
    if (!candidate.deadline) return "Not entered";
    if (candidate.deadlineDays < 0) return `${candidate.deadline} — passed`;
    if (candidate.deadlineDays === 0) return `${candidate.deadline} — today`;
    return `${candidate.deadline} — ${candidate.deadlineDays} days`;
  }

  function accreditationLabel(value) {
    return {
      confirmed: "Confirmed on regulator source",
      unclear: "Unclear — follow up",
      "not-checked": "Not checked"
    }[value] || "Not checked";
  }

  function compare() {
    const comparison = engine.compare(readCandidates(), todayIso());
    if (!comparison.valid) {
      error.textContent = comparison.error;
      results.hidden = true;
      lastComparison = null;
      return;
    }
    error.textContent = "";
    lastComparison = comparison;
    document.getElementById("comparisonBody").innerHTML = comparison.candidates.map(candidate => `
      <tr>
        <td><strong>${escapeHtml(candidate.name)}</strong>${candidate.country ? `<br>${escapeHtml(candidate.country)}` : ""}${candidate.url ? `<br><a href="${escapeHtml(candidate.url)}" target="_blank" rel="noopener">Official programme source</a>` : ""}</td>
        <td>${formatMoney(candidate.costComplete ? candidate.firstYearCost : null)}${candidate.isLowestEnteredCost ? `<br><span class="uv-tag">Lowest complete entered cost</span>` : ""}</td>
        <td>${escapeHtml(deadlineLabel(candidate))}</td>
        <td>${escapeHtml(accreditationLabel(candidate.accreditation))}</td>
        <td>${candidate.gaps.length ? escapeHtml(candidate.gaps.join(", ")) : "No worksheet gaps"}</td>
      </tr>`).join("");
    document.getElementById("comparisonNotes").textContent =
      comparison.comparableCostCount < 2
        ? "Fewer than two candidates have complete tuition, living and other first-year costs, so no cost comparison is reliable yet."
        : "Cost totals are comparable only if every amount was converted into the selected currency using the same dated rate and refers to the same period.";
    results.hidden = false;
    results.focus();
  }

  function buildSummary() {
    if (!lastComparison) return "";
    const currency = document.getElementById("comparisonCurrency").value;
    const lines = [
      "University comparison worksheet — AfroTools",
      `Comparison currency: ${currency}`,
      "Currency conversion: supplied by the user; AfroTools did not fetch exchange rates.",
      ""
    ];
    lastComparison.candidates.forEach((candidate, index) => {
      lines.push(`${index + 1}. ${candidate.name}${candidate.country ? ` — ${candidate.country}` : ""}`);
      lines.push(`Official programme source: ${candidate.url || "Not entered"}`);
      lines.push(`Entered first-year cost: ${formatMoney(candidate.costComplete ? candidate.firstYearCost : null)}`);
      lines.push(`Deadline: ${deadlineLabel(candidate)}`);
      lines.push(`Accreditation check: ${accreditationLabel(candidate.accreditation)}`);
      lines.push(`Evidence gaps: ${candidate.gaps.length ? candidate.gaps.join(", ") : "None recorded in worksheet"}`);
      lines.push(`Notes: ${candidate.notes || "Not entered"}`, "");
    });
    lines.push(
      "Limits",
      "This worksheet does not rank quality or predict admission, scholarships, employment, salary, visas or professional recognition.",
      "Verify every decision with the university and relevant regulator before applying or paying."
    );
    return lines.join("\n");
  }

  document.getElementById("addCandidate").addEventListener("click", addCandidate);
  document.getElementById("compareCandidates").addEventListener("click", compare);
  document.getElementById("copyComparison").addEventListener("click", async () => {
    if (!lastComparison) return;
    try {
      await navigator.clipboard.writeText(buildSummary());
      status.textContent = "Comparison copied.";
    } catch (_error) {
      status.textContent = "Copy failed. Download the TXT summary instead.";
    }
  });
  document.getElementById("downloadComparison").addEventListener("click", () => {
    if (!lastComparison) return;
    const url = URL.createObjectURL(new Blob([buildSummary()], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "university-comparison-worksheet.txt";
    link.click();
    URL.revokeObjectURL(url);
    status.textContent = "TXT worksheet downloaded.";
  });
  document.getElementById("printComparison").addEventListener("click", () => {
    if (!lastComparison) return;
    status.textContent = "Opening print. Choose Save as PDF to create a PDF.";
    window.print();
  });

  addCandidate();
  addCandidate();
  window.AFROTOOLS_UNIVERSITY_VIP = true;
})();
