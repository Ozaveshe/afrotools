/**
 * AFROTOOLS TAX CALENDAR
 * Filing deadlines and regulatory alerts for African countries.
 */
(function(window) {
  'use strict';

  const TAX_DEADLINES = {
    "NG": [
      { name: "PAYE Monthly Remittance", date: "10", recurrence: "monthly", authority: "FIRS" },
      { name: "Annual Tax Returns (Individuals)", date: "31", month: 3, recurrence: "yearly", authority: "FIRS" },
      { name: "WHT Monthly Remittance", date: "21", recurrence: "monthly", authority: "FIRS" },
      { name: "VAT Monthly Returns", date: "21", recurrence: "monthly", authority: "FIRS" },
      { name: "Company Income Tax Returns", date: "30", month: 6, recurrence: "yearly", authority: "FIRS" }
    ],
    "KE": [
      { name: "PAYE Monthly Filing", date: "9", recurrence: "monthly", authority: "KRA" },
      { name: "Individual Tax Returns", date: "30", month: 6, recurrence: "yearly", authority: "KRA" },
      { name: "VAT Monthly Returns", date: "20", recurrence: "monthly", authority: "KRA" },
      { name: "Installment Tax (Corporate)", date: "20", month: 4, recurrence: "quarterly", authority: "KRA" }
    ],
    "ZA": [
      { name: "PAYE Monthly (EMP201)", date: "7", recurrence: "monthly", authority: "SARS" },
      { name: "Individual Tax Season Opens", date: "1", month: 7, recurrence: "yearly", authority: "SARS" },
      { name: "Individual Filing Deadline (eFiling)", date: "23", month: 10, recurrence: "yearly", authority: "SARS" },
      { name: "Provisional Tax (1st Period)", date: "31", month: 8, recurrence: "yearly", authority: "SARS" },
      { name: "Provisional Tax (2nd Period)", date: "28", month: 2, recurrence: "yearly", authority: "SARS" }
    ],
    "GH": [
      { name: "PAYE Monthly Remittance", date: "15", recurrence: "monthly", authority: "GRA" },
      { name: "Individual Tax Returns", date: "30", month: 4, recurrence: "yearly", authority: "GRA" },
      { name: "VAT Monthly Returns", date: "15", recurrence: "monthly", authority: "GRA" }
    ],
    "EG": [
      { name: "PAYE Monthly Withholding", date: "15", recurrence: "monthly", authority: "ETA" },
      { name: "Individual Tax Returns", date: "31", month: 3, recurrence: "yearly", authority: "ETA" }
    ],
    "TZ": [
      { name: "PAYE Monthly Filing", date: "7", recurrence: "monthly", authority: "TRA" },
      { name: "Individual Tax Returns", date: "30", month: 6, recurrence: "yearly", authority: "TRA" }
    ],
    "RW": [
      { name: "PAYE Monthly Remittance", date: "15", recurrence: "monthly", authority: "RRA" },
      { name: "Annual Tax Returns", date: "31", month: 3, recurrence: "yearly", authority: "RRA" }
    ],
    "UG": [
      { name: "PAYE Monthly Filing", date: "15", recurrence: "monthly", authority: "URA" },
      { name: "Individual Tax Returns", date: "30", month: 6, recurrence: "yearly", authority: "URA" }
    ]
  };

  const TAX_ALERTS = [
    { country: "KE", date: "2024-10-01", title: "SHIF replaces NHIF", desc: "Social Health Insurance Fund replaced the National Hospital Insurance Fund. Rate is 2.75% of gross.", severity: "high" },
    { country: "KE", date: "2024-12-01", title: "SHIF & AHL tax relief repealed", desc: "SHIF relief and Affordable Housing Levy tax relief were repealed effective December 2024.", severity: "high" },
    { country: "NG", date: "2025-01-01", title: "Nigeria Tax Act 2026 enacted", desc: "New NTA regime with different deductions vs PITA. Both regimes available for comparison.", severity: "high" },
    { country: "ZA", date: "2025-03-01", title: "2025/26 tax tables updated", desc: "New brackets, primary rebate R17,235, medical credits updated.", severity: "medium" },
    { country: "EG", date: "2024-07-01", title: "New NOSI ceiling EGP 14,500/month", desc: "Social insurance ceiling raised to EGP 14,500/month for employee contributions.", severity: "medium" }
  ];

  // Get upcoming deadlines for a country within the next N days
  function getUpcomingDeadlines(countryCode, days = 30) {
    const deadlines = TAX_DEADLINES[countryCode] || [];
    const now = new Date();
    const results = [];

    deadlines.forEach(d => {
      if (d.recurrence === 'monthly') {
        // Next occurrence of this day in the current or next month
        let next = new Date(now.getFullYear(), now.getMonth(), parseInt(d.date));
        if (next <= now) next.setMonth(next.getMonth() + 1);
        const diffDays = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= days) {
          results.push({ ...d, nextDate: next, daysUntil: diffDays });
        }
      } else if (d.recurrence === 'yearly' && d.month) {
        let next = new Date(now.getFullYear(), d.month - 1, parseInt(d.date));
        if (next <= now) next.setFullYear(next.getFullYear() + 1);
        const diffDays = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= days) {
          results.push({ ...d, nextDate: next, daysUntil: diffDays });
        }
      }
    });

    return results.sort((a, b) => a.daysUntil - b.daysUntil);
  }

  // Get alerts for a country
  function getAlerts(countryCode) {
    return TAX_ALERTS.filter(a => a.country === countryCode).sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  window.AfroTaxCalendar = { TAX_DEADLINES, TAX_ALERTS, getUpcomingDeadlines, getAlerts };
})(window);
