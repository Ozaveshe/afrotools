!function() {
  "use strict";
  window.AfroTools = window.AfroTools || {};
  var e = null;
  function o(e) {
    return e ? new Date(e).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }) : "_____________";
  }
  function t(e) {
    return e ? e.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
  }
  window.AfroTools.EmploymentContractEngine = {
    getCountryData: function(o) {
      var t = (e || (e = window.AfroTools.employmentContractData), e);
      if (!t) {
        return null;
      }
      var n = t.countries[o], r = t.employment[o];
      return n && r ? {
        country: n,
        employment: r
      } : null;
    },
    checkMinWage: function(e, o) {
      var t = this.getCountryData(e);
      if (!t) {
        return null;
      }
      var n = t.employment, r = t.country;
      if (!n.minimumWage || !n.minimumWage.amount) {
        return {
          ok: !0,
          msg: "No statutory minimum wage in " + r.name
        };
      }
      var a = n.minimumWage.amount, i = n.minimumWage.period, m = "day" === i ? 22 * a : "hour" === i ? 176 * a : a;
      return o < m ? {
        ok: !1,
        msg: "Below minimum wage (" + r.currencySymbol + m.toLocaleString() + "/mo)",
        min: m
      } : {
        ok: !0,
        msg: "Above minimum wage (" + r.currencySymbol + m.toLocaleString() + "/mo)",
        min: m
      };
    },
    generate: function(e, n) {
      var r = this.getCountryData(n);
      if (!r) {
        return {
          error: "Country not found"
        };
      }
      var a = r.country, i = r.employment, m = a.currencySymbol, s = 0;
      function l(e) {
        return '<div class="clause"><strong>' + ++s + ".</strong> " + e + "</div>";
      }
      var p = "<h1>EMPLOYMENT CONTRACT</h1>";
      p += '<p style="text-align:center;font-size:.9rem;color:#64748b;margin-bottom:1.5rem">Governed by ' + i.labourLaw + "</p>",
      p += '<p>This Employment Contract ("Agreement") is entered into on <strong>' + o(e.startDate) + "</strong> between:</p>",
      p += "<p><strong>The Employer:</strong> " + t(e.compName || "[Company Name]") + ", having its registered address at " + t(e.compAddr || "[Address]") + ' ("the Employer")</p>',
      p += "<p><strong>The Employee:</strong> " + t(e.empName || "[Employee Name]") + ", residing at " + t(e.empAddr || "[Address]") + ' ("the Employee")</p>',
      p += "<h2>Terms and Conditions</h2>", p += l("The Employee is appointed to the position of <strong>" + t(e.jobTitle || "[Job Title]") + "</strong> in the <strong>" + t(e.dept || "[Department]") + "</strong> department, reporting to <strong>" + t(e.reportsTo || "[Supervisor]") + "</strong>."),
      p += l("This appointment is effective from <strong>" + o(e.startDate) + "</strong> and is on a <strong>" + t(e.empType || "Full-Time Permanent") + "</strong> basis.");
      var y = parseInt(e.probation) || 0;
      if (y > 0) {
        var c = i.probation || 6;
        p += l("The Employee shall serve a probationary period of " + y + " months" + (y > c ? " (note: maximum statutory probation in " + a.name + " is " + c + " months)" : "") + ". During probation, either party may terminate with 2 weeks' written notice. Confirmation is subject to satisfactory performance.");
      }
      if (p += l("The Employee's gross monthly salary shall be <strong>" + m + (parseFloat(e.salary) || 0).toLocaleString() + "</strong>, payable on or before the last working day of each month, subject to statutory deductions."),
      i.minimumWage && i.minimumWage.amount) {
        var u = "day" === i.minimumWage.period ? 22 * i.minimumWage.amount : "hour" === i.minimumWage.period ? 176 * i.minimumWage.amount : i.minimumWage.amount;
        p += '<p style="font-size:.85rem;color:#6b7280;margin-left:1.5rem"><em>Statutory minimum wage in ' + a.name + ": " + m + u.toLocaleString() + "/month" + (i.minimumWage.notes ? " (" + i.minimumWage.notes + ")" : "") + "</em></p>";
      }
      return p += l("The following mandatory deductions shall apply:"), p += '<ul style="margin-left:2rem;margin-bottom:.75rem;font-size:.92rem">',
      i.pension && "None formal" !== i.pension.name && "N/A" !== i.pension.employeeRate && (p += "<li><strong>" + i.pension.name + ":</strong> Employee " + i.pension.employeeRate + ", Employer " + i.pension.employerRate + "</li>"),
      p += "<li>Income tax as per applicable tax law</li>", p += "</ul>", p += l("The Employee's normal working hours shall be " + (e.hours || i.workingHours) + " hours per week. Overtime shall be compensated at " + i.overtimeRate + "x the normal hourly rate in accordance with " + i.labourLaw + "."),
      p += l("The Employee is entitled to " + (e.leave || i.annualLeave) + " working days of paid annual leave per year (statutory minimum: " + i.annualLeave + " days)."),
      i.maternityLeave && (p += '<p style="margin-left:1.5rem;font-size:.92rem">Maternity leave: ' + i.maternityLeave.weeks + " weeks (" + i.maternityLeave.pay + "). " + (i.paternityLeave && i.paternityLeave.days > 0 ? "Paternity leave: " + i.paternityLeave.days + " days (" + i.paternityLeave.pay + ")." : "") + "</p>"),
      p += l("Either party may terminate this Agreement by giving written notice as follows: " + i.noticePeriod + ". Payment in lieu of notice may be made. The Employer shall comply with all termination provisions of " + i.labourLaw + "."),
      i.severance && "Per contract" !== i.severance && "Per employment contract" !== i.severance && (p += '<p style="margin-left:1.5rem;font-size:.92rem"><em>Severance: ' + i.severance + "</em></p>"),
      e.clPension && (p += l("Pension contributions shall be made in accordance with the " + i.pension.name + " requirements.")),
      e.clHmo && (p += l("The Employer shall provide health insurance coverage for the Employee and immediate dependants as per company policy.")),
      e.clTransport && (p += l("A transport allowance shall be paid monthly as per the company's approved rates.")),
      e.clHousing && (p += l("A housing allowance shall be paid monthly as per the company's approved rates.")),
      e.clMeal && (p += l("A meal subsidy shall be provided as per company policy.")),
      e.cl13th && (p += l("A 13th month salary (annual bonus) shall be paid in December each year, prorated for partial years of service.")),
      e.clNda && (p += l("The Employee shall not, during or after employment, disclose any confidential information, trade secrets, or proprietary data belonging to the Employer without prior written consent.")),
      e.clNonCompete && (p += l("For a period of 12 months following termination, the Employee shall not engage in any business that directly competes with the Employer within " + a.name + ". This restriction is subject to enforceability under " + i.labourLaw + ".")),
      e.clIp && (p += l("All intellectual property, inventions, and work product created by the Employee in the course of employment shall be the exclusive property of the Employer.")),
      e.clRemote && (p += l("The Employee may work remotely subject to the Employer's remote work policy. The Employer shall provide necessary equipment and connectivity support.")),
      p += l("Any dispute arising from this Agreement shall be referred to the " + i.disputeBody + " in accordance with " + i.labourLaw + "."),
      p += l("This Agreement shall be governed by and construed in accordance with " + i.labourLaw + "."),
      p += '<div class="signatures">', p += '<div class="sig-block"><div class="sig-line"></div><strong>' + t(e.compSig || "[Employer Representative]") + '</strong><br><span style="font-size:.85rem;color:#64748b">For and on behalf of ' + t(e.compName || "[Company]") + '</span><br><span style="font-size:.82rem;color:#94a3b8">Date: ____________</span></div>',
      p += '<div class="sig-block"><div class="sig-line"></div><strong>' + t(e.empName || "[Employee]") + '</strong><br><span style="font-size:.85rem;color:#64748b">Employee</span><br><span style="font-size:.82rem;color:#94a3b8">Date: ____________</span></div>',
      {
        html: p += "</div>"
      };
    }
  };
}();
