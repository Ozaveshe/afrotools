(function () {
  "use strict";

  function words(value) {
    return String(value || "").trim().match(/[\p{L}\p{N}'’'-]+/gu) || [];
  }

  function sentences(value) {
    return String(value || "").split(/[.!?]+/).map(function (item) {
      return item.trim();
    }).filter(Boolean);
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/[ \t]+/g, " ")
      .replace(/ *([,;:!?]) */g, "$1 ")
      .replace(/ *\. */g, ". ")
      .replace(/\s*\n\s*/g, "\n")
      .replace(/([!?.,])\1+/g, "$1")
      .trim();
  }

  function analyze(input) {
    var source = input || {};
    var text = String(source.text || "").trim();
    var lang = source.lang === "fr" ? "fr" : "en";
    if (text.length < 20) throw new Error("Text must contain at least 20 characters.");
    var list = words(text);
    var sentenceList = sentences(text);
    var counts = {};
    list.forEach(function (word) {
      var key = word.toLocaleLowerCase(lang);
      if (key.length >= 5) counts[key] = (counts[key] || 0) + 1;
    });
    var repeated = Object.keys(counts).filter(function (key) {
      return counts[key] >= 3;
    }).sort(function (a, b) {
      return counts[b] - counts[a] || a.localeCompare(b);
    }).slice(0, 8);
    var longSentences = sentenceList.filter(function (sentence) {
      return words(sentence).length > 25;
    }).length;
    var average = sentenceList.length ? list.length / sentenceList.length : list.length;
    var cleaned = cleanText(text);
    var suggestions = [];
    if (longSentences) suggestions.push(lang === "fr" ? "Scindez les phrases de plus de 25 mots." : "Split sentences longer than 25 words.");
    if (repeated.length) suggestions.push((lang === "fr" ? "Vérifiez les répétitions : " : "Review repeated words: ") + repeated.join(", ") + ".");
    if (average > 20) suggestions.push(lang === "fr" ? "Raccourcissez la longueur moyenne des phrases." : "Shorten the average sentence length.");
    if (cleaned !== text) suggestions.push(lang === "fr" ? "Vérifiez la version aux espaces et à la ponctuation normalisés." : "Review the version with normalized spacing and punctuation.");
    if (!suggestions.length) suggestions.push(lang === "fr" ? "Aucun signal mécanique majeur détecté. Relisez le sens et les faits." : "No major mechanical signal detected. Review meaning and facts.");
    return {
      language: lang,
      original: text,
      cleaned: cleaned,
      metrics: {
        characters: text.length,
        words: list.length,
        sentences: sentenceList.length,
        averageWordsPerSentence: Number(average.toFixed(1)),
        longSentences: longSentences
      },
      repeatedWords: repeated,
      suggestions: suggestions,
      boundary: lang === "fr"
        ? "Analyse locale fondée sur des règles. Elle ne vérifie ni les faits, ni le ton culturel, ni toute la grammaire."
        : "Local rules-based analysis. It does not verify facts, cultural tone, or every grammar issue."
    };
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.CreatorPolishEngine = {
    analyze: analyze,
    cleanText: cleanText
  };
}());
