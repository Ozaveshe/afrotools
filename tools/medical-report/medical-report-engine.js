(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MedicalReportEngine = api;
})(typeof window !== "undefined" ? window : this, function () {
  "use strict";

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function finiteNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function parseReferenceRange(remainder) {
    var text = String(remainder || "").replace(/,/g, "");
    var number = "(-?\\d+(?:\\.\\d+)?)";
    var labelled = new RegExp("(?:reference(?:\\s+range)?|ref(?:\\.?\\s*range)?|normal(?:\\s+range)?|range)\\s*[:=]?\\s*" + number + "\\s*(?:-|–|—|to)\\s*" + number, "i");
    var parenthesized = new RegExp("\\(\\s*" + number + "\\s*(?:-|–|—|to)\\s*" + number + "\\s*\\)");
    var unlabelled = new RegExp("(?:^|\\s)" + number + "\\s*(?:-|–|—|to)\\s*" + number + "(?:\\s|$)");
    var match = text.match(labelled) || text.match(parenthesized) || text.match(unlabelled);
    if (match) {
      var low = finiteNumber(match[1]);
      var high = finiteNumber(match[2]);
      if (low != null && high != null && low <= high) {
        return { low: low, high: high, source: "lab", raw: match[0].trim() };
      }
    }
    var oneSided = text.match(new RegExp("(?:reference(?:\\s+range)?|ref(?:\\.?\\s*range)?|normal(?:\\s+range)?|range)\\s*[:=]?\\s*([<>])\\s*" + number, "i"));
    if (oneSided) {
      var limit = finiteNumber(oneSided[2]);
      if (limit != null) {
        return oneSided[1] === "<"
          ? { low: 0, high: limit, source: "lab", raw: oneSided[0].trim(), oneSided: "upper" }
          : { low: limit, high: 999, source: "lab", raw: oneSided[0].trim(), oneSided: "lower" };
      }
    }
    return null;
  }

  function detectUnit(remainder, fallback) {
    var beforeRange = String(remainder || "").split(/(?:reference|ref\.?|normal|range|\()/i)[0];
    var match = beforeRange.match(/(?:^|\s)([%a-zA-Zµμ][%a-zA-Z0-9µμ^./-]{0,18})(?:\s|$)/);
    return match ? match[1] : String(fallback || "");
  }

  function statusFor(value, range, key) {
    if (String(key).toUpperCase() === "HDL" && range.source !== "lab") {
      return value < range.low ? "low" : "normal";
    }
    if (value < range.low) return "low";
    if (value > range.high) return "high";
    return "normal";
  }

  function markerLineMatch(line, key, biomarker) {
    var names = [key, biomarker && biomarker.name].filter(Boolean).sort(function (a, b) {
      return String(b).length - String(a).length;
    });
    for (var index = 0; index < names.length; index += 1) {
      var pattern = new RegExp("(^|[^a-z0-9])(" + escapeRegExp(names[index]) + ")\\s*[:=]?\\s*(-?\\d+(?:\\.\\d+)?)", "i");
      var match = String(line || "").match(pattern);
      if (match) {
        var valueIndex = match.index + match[0].lastIndexOf(match[3]) + match[3].length;
        return {
          value: finiteNumber(match[3]),
          remainder: line.slice(valueIndex),
          matchedName: match[2],
        };
      }
    }
    return null;
  }

  function parse(text, biomarkers, categoryOrder) {
    var results = [];
    var seen = {};
    var lines = String(text || "").split(/\r?\n/).map(function (line) {
      return line.replace(/\s+/g, " ").trim();
    }).filter(Boolean);
    Object.keys(biomarkers || {}).forEach(function (key) {
      var biomarker = biomarkers[key];
      var displayKey = biomarker.alias || key;
      if (seen[displayKey]) return;
      for (var lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        var line = lines[lineIndex];
        var matched = markerLineMatch(line, key, biomarker);
        if (!matched || matched.value == null) continue;
        var labRange = parseReferenceRange(matched.remainder);
        var range = labRange || {
          low: Number(biomarker.low),
          high: Number(biomarker.high),
          source: "general",
          raw: "",
        };
        var effectiveBiomarker = Object.assign({}, biomarker, {
          low: range.low,
          high: range.high,
          unit: detectUnit(matched.remainder, biomarker.unit),
        });
        var labFlag = /\b(?:critical|panic|urgent)\b|(?:^|\s)(?:HH|LL)(?:\s|$)|!!/i.test(line)
          ? "critical"
          : "";
        results.push({
          key: displayKey,
          biomarker: effectiveBiomarker,
          value: matched.value,
          status: statusFor(matched.value, range, key),
          category: biomarker.category,
          referenceSource: range.source,
          referenceRaw: range.raw,
          labFlag: labFlag,
        });
        seen[displayKey] = true;
        break;
      }
    });
    var order = Array.isArray(categoryOrder) ? categoryOrder : [];
    results.sort(function (a, b) {
      return order.indexOf(a.category) - order.indexOf(b.category);
    });
    return results;
  }

  function aiMarkers(results) {
    return (Array.isArray(results) ? results : []).slice(0, 40).map(function (result) {
      return {
        marker: String(result.key || "").slice(0, 80),
        value: finiteNumber(result.value),
        unit: String(result.biomarker && result.biomarker.unit || "").slice(0, 24),
        status: ["normal", "low", "high"].indexOf(result.status) >= 0 ? result.status : "unknown",
        referenceLow: finiteNumber(result.biomarker && result.biomarker.low),
        referenceHigh: finiteNumber(result.biomarker && result.biomarker.high),
        referenceSource: result.referenceSource === "lab" ? "lab-report" : "general-fallback",
        labFlag: result.labFlag === "critical" ? "critical" : "",
      };
    }).filter(function (marker) {
      return marker.marker && marker.value != null;
    });
  }

  return {
    parseReferenceRange: parseReferenceRange,
    parse: parse,
    aiMarkers: aiMarkers,
  };
});
