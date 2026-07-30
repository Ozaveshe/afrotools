(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.BusinessRoiEngine = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : (fallback || 0);
  }

  function dateOnly(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ""));
    if (!match) return null;
    var date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
    return date.getUTCFullYear() === +match[1] &&
      date.getUTCMonth() === +match[2] - 1 &&
      date.getUTCDate() === +match[3] ? date : null;
  }

  function pomodoro(input) {
    var focus = Math.max(1, Math.round(finite(input.focusMinutes, 25)));
    var shortBreak = Math.max(1, Math.round(finite(input.shortBreakMinutes, 5)));
    var longBreak = Math.max(1, Math.round(finite(input.longBreakMinutes, 15)));
    var sessions = Math.max(1, Math.round(finite(input.sessions, 4)));
    return {
      focusSeconds: focus * 60,
      shortBreakSeconds: shortBreak * 60,
      longBreakSeconds: longBreak * 60,
      cycleSeconds: sessions * focus * 60 + Math.max(0, sessions - 1) * shortBreak * 60 + longBreak * 60,
      sessions: sessions
    };
  }

  var UNIT_GROUPS = {
    length: { m: 1, km: 1000, cm: .01, mm: .001, ft: .3048, in: .0254, yd: .9144, mi: 1609.344 },
    mass: { kg: 1, g: .001, lb: .45359237, oz: .028349523125, tonne: 1000 },
    area: { sqm: 1, hectare: 10000, acre: 4046.8564224, sqft: .09290304, plot_ng: 464.5152, morgen_za: 8565.32 },
    data: { byte: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776 }
  };

  function convertUnit(input) {
    var group = UNIT_GROUPS[input.group];
    var value = finite(input.value);
    if (!group || !group[input.from] || !group[input.to]) throw new Error("unsupported-unit");
    return value * group[input.from] / group[input.to];
  }

  function linearConversion(input) {
    var fromFactor = finite(input.fromFactor);
    var toFactor = finite(input.toFactor);
    if (!toFactor) throw new Error("invalid-conversion-factor");
    return finite(input.value) * fromFactor / toFactor;
  }

  function convertTemperature(input) {
    var value = finite(input.value);
    var kelvin = input.from === "C" ? value + 273.15 :
      input.from === "F" ? (value - 32) * 5 / 9 + 273.15 : value;
    return input.to === "C" ? kelvin - 273.15 :
      input.to === "F" ? (kelvin - 273.15) * 9 / 5 + 32 : kelvin;
  }

  function budget(input) {
    var income = (input.income || []).reduce(function (sum, item) {
      return sum + Math.max(0, finite(item.amount === undefined ? item : item.amount));
    }, 0);
    var categories = (input.categories || []).map(function (category) {
      var total = (category.items || []).reduce(function (sum, item) {
        return sum + Math.max(0, finite(item.amount === undefined ? item : item.amount));
      }, 0);
      return { key: category.key, name: category.name, kind: category.kind || "wants", total: total };
    });
    var expenses = categories.reduce(function (sum, category) { return sum + category.total; }, 0);
    var balance = income - expenses;
    var needs = categories.filter(function (category) { return category.kind === "needs"; })
      .reduce(function (sum, category) { return sum + category.total; }, 0);
    var plannedSavings = categories.filter(function (category) { return category.kind === "savings"; })
      .reduce(function (sum, category) { return sum + category.total; }, 0);
    var wants = expenses - needs - plannedSavings;
    var savings = plannedSavings + Math.max(0, balance);
    return {
      income: income,
      expenses: expenses,
      balance: balance,
      savingsRate: income > 0 ? balance / income * 100 : 0,
      needsRate: income > 0 ? needs / income * 100 : 0,
      wantsRate: income > 0 ? wants / income * 100 : 0,
      savingsAllocationRate: income > 0 ? savings / income * 100 : 0,
      categories: categories
    };
  }

  function countdown(input) {
    var from = new Date(input.from);
    var to = new Date(input.to);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw new Error("invalid-date");
    var milliseconds = to.getTime() - from.getTime();
    var remaining = Math.max(0, milliseconds);
    return {
      complete: milliseconds <= 0,
      milliseconds: milliseconds,
      days: Math.floor(remaining / 86400000),
      hours: Math.floor(remaining % 86400000 / 3600000),
      minutes: Math.floor(remaining % 3600000 / 60000),
      seconds: Math.floor(remaining % 60000 / 1000)
    };
  }

  function zonedInputToDate(input, timeZone) {
    var match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(input || ""));
    if (!match) throw new Error("invalid-date");
    var desired = Date.UTC(+match[1], +match[2] - 1, +match[3], +match[4], +match[5]);
    var formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    });
    function displayedUtc(timestamp) {
      var parts = {};
      formatter.formatToParts(new Date(timestamp)).forEach(function (part) {
        if (part.type !== "literal") parts[part.type] = part.value;
      });
      return Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
    }
    var instant = desired - (displayedUtc(desired) - desired);
    instant -= displayedUtc(instant) - desired;
    return new Date(instant);
  }

  function timeZone(input) {
    var instant = zonedInputToDate(input.localDateTime, input.fromZone);
    var options = { timeZone: input.toZone, hour: "2-digit", minute: "2-digit", hour12: false };
    return {
      iso: instant.toISOString(),
      from: new Intl.DateTimeFormat("fr-FR", {
        timeZone: input.fromZone, dateStyle: "full", timeStyle: "short"
      }).format(instant),
      to: new Intl.DateTimeFormat("fr-FR", {
        timeZone: input.toZone, dateStyle: "full", timeStyle: "short"
      }).format(instant),
      toTime: new Intl.DateTimeFormat("fr-FR", options).format(instant)
    };
  }

  var HOLIDAY_SOURCES = {
    ZA: ["Afrique du Sud", "Gouvernement sud-africain", "https://www.gov.za/about-sa/public-holidays"],
    KE: ["Kenya", "Ministère de l’Intérieur", "https://www.interior.go.ke/"],
    GH: ["Ghana", "Ministry of the Interior", "https://www.mint.gov.gh/"],
    NG: ["Nigeria", "Federal Ministry of Interior", "https://interior.gov.ng/"]
  };

  function escapeIcs(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  function holidayEntry(input) {
    var source = HOLIDAY_SOURCES[input.country];
    var date = dateOnly(input.date);
    if (!source || !date || !String(input.name || "").trim() || !input.confirmed) {
      throw new Error("incomplete-confirmation");
    }
    var next = new Date(date.getTime());
    next.setUTCDate(next.getUTCDate() + 1);
    var compact = String(input.date).replace(/-/g, "");
    var nextCompact = next.toISOString().slice(0, 10).replace(/-/g, "");
    var english = input.locale === "en";
    var description = (english ? "User-confirmed from " : "Entrée confirmée par l’utilisateur depuis ") +
      source[1] + ". " + (String(input.note || "").trim() ||
        (english ? "Recheck the official notice before relying on this entry." :
          "Revérifiez l’avis officiel avant de vous fier à cette entrée."));
    var boundary = english
      ? "User-confirmed entry; unofficial calendar"
      : "Entree confirmee par utilisateur; calendrier non officiel";
    var ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0",
      "PRODID:-//AfroTools//User Confirmed Holiday Entry//" + (english ? "EN" : "FR"),
      "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      "UID:" + compact + "-" + input.country.toLowerCase() + "@afrotools.local",
      "DTSTART;VALUE=DATE:" + compact, "DTEND;VALUE=DATE:" + nextCompact,
      "SUMMARY:" + escapeIcs(String(input.name).trim()),
      "DESCRIPTION:" + escapeIcs(description),
      "X-AFROTOOLS-SOURCE-URL:" + source[2],
      "X-AFROTOOLS-BOUNDARY:" + boundary,
      "END:VEVENT", "END:VCALENDAR", ""
    ].join("\r\n");
    return { country: source[0], authority: source[1], sourceUrl: source[2], description: description, ics: ics };
  }

  function workingDays(input) {
    var start = dateOnly(input.start);
    var end = dateOnly(input.end);
    if (!start || !end || start > end) throw new Error("invalid-range");
    var holidays = {};
    (input.holidays || []).forEach(function (value) { holidays[value] = true; });
    var calendarDays = 0;
    var weekendDays = 0;
    var holidayDays = 0;
    var workDays = 0;
    var cursor = new Date(start.getTime());
    while (cursor <= end) {
      calendarDays += 1;
      var day = cursor.getUTCDay();
      var key = cursor.toISOString().slice(0, 10);
      if (day === 0 || day === 6) weekendDays += 1;
      else if (holidays[key]) holidayDays += 1;
      else workDays += 1;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return { workDays: workDays, calendarDays: calendarDays, weekendDays: weekendDays, holidayDays: holidayDays };
  }

  function age(input) {
    var dob = dateOnly(input.birthDate);
    var at = dateOnly(input.atDate);
    if (!dob || !at || dob > at) throw new Error("invalid-age-range");
    var years = at.getUTCFullYear() - dob.getUTCFullYear();
    var months = at.getUTCMonth() - dob.getUTCMonth();
    var days = at.getUTCDate() - dob.getUTCDate();
    if (days < 0) {
      months -= 1;
      var previousMonthDays = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 0)).getUTCDate();
      if (dob.getUTCDate() > previousMonthDays) previousMonthDays = dob.getUTCDate();
      days += previousMonthDays;
    }
    if (months < 0) { years -= 1; months += 12; }
    var totalDays = Math.floor((at - dob) / 86400000);
    var nextBirthday = new Date(Date.UTC(at.getUTCFullYear(), dob.getUTCMonth(), dob.getUTCDate()));
    if (nextBirthday <= at) nextBirthday.setUTCFullYear(nextBirthday.getUTCFullYear() + 1);
    return {
      years: years, months: months, days: days,
      totalMonths: years * 12 + months,
      totalWeeks: Math.floor(totalDays / 7),
      totalDays: totalDays,
      daysUntilBirthday: Math.ceil((nextBirthday - at) / 86400000)
    };
  }

  function grade(input) {
    var courses = (input.courses || []).map(function (course) {
      var credits = Math.max(0, finite(course.credits));
      var points = Math.max(0, finite(course.points));
      return {
        name: String(course.name || "Matière"),
        credits: credits,
        points: points,
        qualityPoints: credits * points
      };
    }).filter(function (course) { return course.credits > 0; });
    var credits = courses.reduce(function (sum, course) { return sum + course.credits; }, 0);
    if (!credits) throw new Error("no-credits");
    var qualityPoints = courses.reduce(function (sum, course) { return sum + course.qualityPoints; }, 0);
    var gpa = qualityPoints / credits;
    var previousCredits = Math.max(0, finite(input.previousCredits));
    var previousGpa = Math.max(0, finite(input.previousGpa));
    var cgpa = previousCredits > 0 ?
      (previousCredits * previousGpa + qualityPoints) / (previousCredits + credits) : gpa;
    var futureCredits = Math.max(0, finite(input.futureCredits));
    var target = Math.max(0, finite(input.targetGpa));
    var requiredFutureGpa = futureCredits > 0 ?
      (target * (previousCredits + credits + futureCredits) -
        (previousCredits * previousGpa + qualityPoints)) / futureCredits : null;
    return {
      courses: courses, credits: credits, qualityPoints: qualityPoints,
      gpa: gpa, cgpa: cgpa, requiredFutureGpa: requiredFutureGpa
    };
  }

  function pick(input) {
    var items = (input.items || []).map(function (item) { return String(item).trim(); }).filter(Boolean);
    if (!items.length) throw new Error("no-items");
    var random = Math.min(.999999999, Math.max(0, finite(input.random)));
    return { index: Math.floor(random * items.length), value: items[Math.floor(random * items.length)], items: items };
  }

  function teams(input) {
    var items = (input.items || []).map(function (item) { return String(item).trim(); }).filter(Boolean);
    var count = Math.max(2, Math.min(items.length, Math.round(finite(input.teamCount, 2))));
    if (items.length < 2) throw new Error("not-enough-items");
    var randomValues = input.randomValues || [];
    var shuffled = items.slice();
    for (var index = shuffled.length - 1; index > 0; index -= 1) {
      var random = finite(randomValues[shuffled.length - 1 - index], .5);
      var swapIndex = Math.floor(Math.min(.999999, Math.max(0, random)) * (index + 1));
      var temporary = shuffled[index];
      shuffled[index] = shuffled[swapIndex];
      shuffled[swapIndex] = temporary;
    }
    var result = Array.from({ length: count }, function () { return []; });
    shuffled.forEach(function (item, index) { result[index % count].push(item); });
    return result;
  }

  function meetingCost(input) {
    var attendees = Math.max(0, Math.round(finite(input.attendees)));
    var salary = Math.max(0, finite(input.annualSalary));
    var duration = Math.max(0, finite(input.durationMinutes));
    var overhead = Math.max(0, finite(input.overhead, 1));
    var frequency = Math.max(0, finite(input.annualFrequency, 1));
    var workHours = finite(input.workHoursPerYear, 2080);
    if (workHours <= 0) throw new Error("invalid-work-hours");
    var hourlyRate = salary / workHours * overhead;
    var totalHourlyRate = hourlyRate * attendees;
    var cost = totalHourlyRate * duration / 60;
    return {
      hourlyRate: hourlyRate,
      totalHourlyRate: totalHourlyRate,
      meetingCost: cost,
      perMinute: totalHourlyRate / 60,
      annualCost: cost * frequency,
      personHours: duration / 60 * attendees * frequency
    };
  }

  function tip(input) {
    var bill = Math.max(0, finite(input.bill));
    var tipRate = Math.max(0, finite(input.tipRate));
    var taxRate = Math.max(0, finite(input.taxRate));
    var people = Math.max(1, Math.round(finite(input.people, 1)));
    var roundTo = Math.max(0, finite(input.roundTo));
    var tax = bill * taxRate / 100;
    var tipAmount = bill * tipRate / 100;
    var rawTotal = bill + tax + tipAmount;
    var total = roundTo > 0 ? Math.ceil(rawTotal / roundTo) * roundTo : rawTotal;
    return {
      bill: bill, tax: tax, billWithTax: bill + tax, tip: tipAmount,
      rawTotal: rawTotal, total: total, roundingExtra: total - rawTotal,
      people: people, perPerson: total / people, tipPerPerson: tipAmount / people
    };
  }

  return {
    pomodoro: pomodoro,
    convertUnit: convertUnit,
    linearConversion: linearConversion,
    convertTemperature: convertTemperature,
    budget: budget,
    countdown: countdown,
    zonedInputToDate: zonedInputToDate,
    timeZone: timeZone,
    holidaySources: HOLIDAY_SOURCES,
    holidayEntry: holidayEntry,
    workingDays: workingDays,
    age: age,
    grade: grade,
    pick: pick,
    teams: teams,
    meetingCost: meetingCost,
    tip: tip
  };
});
