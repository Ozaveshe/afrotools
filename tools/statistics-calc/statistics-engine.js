(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.statisticsEngine = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parseInput(input) {
    var raw = String(input || '').trim();
    if (!raw) return { values: [], invalidTokens: [] };
    var tokens = raw.split(/[\s,;]+/u).filter(Boolean);
    var values = [];
    var invalidTokens = [];
    tokens.forEach(function (token) {
      var value = Number(token);
      if (!Number.isFinite(value)) invalidTokens.push(token);
      else values.push(value);
    });
    return { values: values, invalidTokens: invalidTokens };
  }

  function kahanSum(values) {
    var sum = 0;
    var correction = 0;
    values.forEach(function (value) {
      var adjusted = value - correction;
      var next = sum + adjusted;
      correction = (next - sum) - adjusted;
      sum = next;
    });
    return sum;
  }

  function quantileInclusive(sorted, q) {
    if (!sorted.length) return null;
    var position = (sorted.length - 1) * q;
    var lower = Math.floor(position);
    var fraction = position - lower;
    if (sorted[lower + 1] === undefined) return sorted[lower];
    return sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]);
  }

  function modesOf(values) {
    var frequencies = new Map();
    values.forEach(function (value) {
      frequencies.set(value, (frequencies.get(value) || 0) + 1);
    });
    var maximum = Math.max.apply(null, Array.from(frequencies.values()));
    if (maximum <= 1) return [];
    return Array.from(frequencies.entries())
      .filter(function (entry) { return entry[1] === maximum; })
      .map(function (entry) { return entry[0]; })
      .sort(function (a, b) { return a - b; });
  }

  function analyse(values) {
    if (!Array.isArray(values) || values.length < 2 || values.some(function (value) {
      return !Number.isFinite(value);
    })) return null;

    var data = values.slice();
    var sorted = data.slice().sort(function (a, b) { return a - b; });
    var count = data.length;
    var sum = kahanSum(data);
    var mean = sum / count;
    var squaredDeviations = kahanSum(data.map(function (value) {
      var delta = value - mean;
      return delta * delta;
    }));
    var sampleVariance = squaredDeviations / (count - 1);
    var populationVariance = squaredDeviations / count;
    var sampleSd = Math.sqrt(sampleVariance);
    var populationSd = Math.sqrt(populationVariance);
    var median = count % 2
      ? sorted[Math.floor(count / 2)]
      : (sorted[(count / 2) - 1] + sorted[count / 2]) / 2;
    var q1 = quantileInclusive(sorted, 0.25);
    var q3 = quantileInclusive(sorted, 0.75);
    var skewness = null;
    if (count >= 3 && sampleSd > 0) {
      var standardizedCubeSum = kahanSum(data.map(function (value) {
        return Math.pow((value - mean) / sampleSd, 3);
      }));
      skewness = (count / ((count - 1) * (count - 2))) * standardizedCubeSum;
    }
    return {
      count: count,
      sum: sum,
      mean: mean,
      median: median,
      modes: modesOf(data),
      minimum: sorted[0],
      maximum: sorted[count - 1],
      range: sorted[count - 1] - sorted[0],
      sampleVariance: sampleVariance,
      populationVariance: populationVariance,
      sampleSd: sampleSd,
      populationSd: populationSd,
      q1: q1,
      q3: q3,
      iqr: q3 - q1,
      coefficientOfVariation: mean === 0 ? null : (sampleSd / Math.abs(mean)) * 100,
      skewness: skewness,
      sorted: sorted
    };
  }

  function histogram(values, requestedBins) {
    if (!Array.isArray(values) || !values.length) return [];
    var minimum = Math.min.apply(null, values);
    var maximum = Math.max.apply(null, values);
    if (minimum === maximum) return [{ lower: minimum, upper: maximum, count: values.length }];
    var bins = Math.max(1, Math.min(20, Math.round(requestedBins || Math.sqrt(values.length))));
    var width = (maximum - minimum) / bins;
    var output = Array.from({ length: bins }, function (_, index) {
      return { lower: minimum + (index * width), upper: minimum + ((index + 1) * width), count: 0 };
    });
    values.forEach(function (value) {
      var index = Math.min(bins - 1, Math.floor((value - minimum) / width));
      output[index].count += 1;
    });
    return output;
  }

  return {
    parseInput: parseInput,
    quantileInclusive: quantileInclusive,
    modesOf: modesOf,
    analyse: analyse,
    histogram: histogram
  };
}));
