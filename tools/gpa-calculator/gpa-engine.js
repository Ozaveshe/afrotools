(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AfroGpaEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var templates = {
    "direct-points": {
      id: "direct-points",
      name: "Enter transcript grade points directly",
      kind: "points",
      scale: 5,
      note: "Best when your transcript already shows the grade point for each course."
    },
    "example-5": {
      id: "example-5",
      name: "Example letter table — 5.0 maximum",
      kind: "grade",
      scale: 5,
      grades: { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 },
      note: "Example only: A=5, B=4, C=3, D=2, E=1, F=0."
    },
    "example-4": {
      id: "example-4",
      name: "Example letter table — 4.0 maximum",
      kind: "grade",
      scale: 4,
      grades: { A: 4, B: 3, C: 2, D: 1, F: 0 },
      note: "Example only: A=4, B=3, C=2, D=1, F=0."
    },
    "example-4-plus": {
      id: "example-4-plus",
      name: "Example +/- letter table — 4.0 maximum",
      kind: "grade",
      scale: 4,
      grades: {
        A: 4,
        "A-": 3.7,
        "B+": 3.3,
        B: 3,
        "B-": 2.7,
        "C+": 2.3,
        C: 2,
        "C-": 1.7,
        D: 1,
        F: 0
      },
      note: "Example only. Plus/minus point values vary by institution."
    },
    percentage: {
      id: "percentage",
      name: "Weighted percentage average",
      kind: "score",
      scale: 100,
      note: "Calculates a credit-weighted percentage; it does not convert the result to GPA."
    },
    "score-20": {
      id: "score-20",
      name: "Weighted score out of 20",
      kind: "score",
      scale: 20,
      note: "Calculates a credit-weighted /20 score; it does not assign an official classification."
    }
  };

  function number(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getTemplate(templateId, customScale) {
    var base = templates[templateId] || templates["direct-points"];
    var copy = {
      id: base.id,
      name: base.name,
      kind: base.kind,
      scale: base.scale,
      note: base.note,
      grades: base.grades ? Object.assign({}, base.grades) : null
    };
    if (copy.kind === "points") {
      var requestedScale = number(customScale);
      copy.scale =
        requestedScale !== null && requestedScale > 0 && requestedScale <= 100
          ? requestedScale
          : 5;
    }
    return copy;
  }

  function valueForCourse(course, template) {
    if (!course || !template) {
      return null;
    }
    if (template.kind === "grade") {
      var grade = String(course.value || course.grade || "")
        .trim()
        .toUpperCase();
      return Object.prototype.hasOwnProperty.call(template.grades, grade)
        ? template.grades[grade]
        : null;
    }
    var value = number(
      course.value !== undefined ? course.value : course.grade
    );
    if (value === null || value < 0 || value > template.scale) {
      return null;
    }
    return value;
  }

  function calculateSemester(courses, template) {
    var totalCredits = 0;
    var totalPoints = 0;
    var validCourses = 0;
    var invalidCourses = [];

    (courses || []).forEach(function (course, index) {
      var credits = number(course && course.credits);
      var hasAnyValue =
        course &&
        (String(course.name || "").trim() ||
          String(course.value || course.grade || "").trim() ||
          String(course.credits || "").trim());
      if (!hasAnyValue) {
        return;
      }
      var value = valueForCourse(course, template);
      if (credits === null || credits <= 0 || credits > 100 || value === null) {
        invalidCourses.push(index);
        return;
      }
      totalCredits += credits;
      totalPoints += value * credits;
      validCourses += 1;
    });

    return {
      average: totalCredits > 0 ? totalPoints / totalCredits : 0,
      totalCredits: totalCredits,
      totalPoints: totalPoints,
      validCourses: validCourses,
      invalidCourses: invalidCourses
    };
  }

  function calculateAll(semesters, template) {
    var semesterResults = (semesters || []).map(function (semester) {
      return calculateSemester(semester.courses, template);
    });
    var totalCredits = semesterResults.reduce(function (sum, result) {
      return sum + result.totalCredits;
    }, 0);
    var totalPoints = semesterResults.reduce(function (sum, result) {
      return sum + result.totalPoints;
    }, 0);
    var invalidCourses = semesterResults.reduce(function (sum, result) {
      return sum + result.invalidCourses.length;
    }, 0);
    var validCourses = semesterResults.reduce(function (sum, result) {
      return sum + result.validCourses;
    }, 0);

    return {
      average: totalCredits > 0 ? totalPoints / totalCredits : 0,
      totalCredits: totalCredits,
      totalPoints: totalPoints,
      validCourses: validCourses,
      invalidCourses: invalidCourses,
      semesters: semesterResults
    };
  }

  function requiredAverage(currentAverage, completedCredits, targetAverage, upcomingCredits) {
    var current = number(currentAverage);
    var completed = number(completedCredits);
    var target = number(targetAverage);
    var upcoming = number(upcomingCredits);
    if (
      current === null ||
      completed === null ||
      target === null ||
      upcoming === null ||
      current < 0 ||
      completed < 0 ||
      target < 0 ||
      upcoming <= 0
    ) {
      return null;
    }
    return (target * (completed + upcoming) - current * completed) / upcoming;
  }

  function replacementAverage(totalPoints, totalCredits, oldValue, newValue, credits) {
    var points = number(totalPoints);
    var total = number(totalCredits);
    var oldPoints = number(oldValue);
    var newPoints = number(newValue);
    var courseCredits = number(credits);
    if (
      points === null ||
      total === null ||
      oldPoints === null ||
      newPoints === null ||
      courseCredits === null ||
      total <= 0 ||
      courseCredits <= 0
    ) {
      return null;
    }
    return (points - oldPoints * courseCredits + newPoints * courseCredits) / total;
  }

  function normalizeScale(value, fromMaximum, toMaximum) {
    var sourceValue = number(value);
    var sourceMaximum = number(fromMaximum);
    var targetMaximum = number(toMaximum);
    if (
      sourceValue === null ||
      sourceMaximum === null ||
      targetMaximum === null ||
      sourceMaximum <= 0 ||
      targetMaximum <= 0 ||
      sourceValue < 0 ||
      sourceValue > sourceMaximum
    ) {
      return null;
    }
    return {
      position: sourceValue / sourceMaximum,
      normalizedValue: (sourceValue / sourceMaximum) * targetMaximum
    };
  }

  function bucketCourseCount(count) {
    var value = number(count) || 0;
    if (value === 0) return "0";
    if (value <= 3) return "1-3";
    if (value <= 6) return "4-6";
    if (value <= 12) return "7-12";
    return "13+";
  }

  return {
    templates: templates,
    getTemplate: getTemplate,
    valueForCourse: valueForCourse,
    calculateSemester: calculateSemester,
    calculateAll: calculateAll,
    requiredAverage: requiredAverage,
    replacementAverage: replacementAverage,
    normalizeScale: normalizeScale,
    bucketCourseCount: bucketCourseCount
  };
});
