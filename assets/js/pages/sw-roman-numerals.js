(function () {
  "use strict";

  var engine = window.AfroTools && window.AfroTools.romanNumerals;
  if (!engine) return;

  var current = null;
  var batchText = "";
  var quiz = {
    number: 0,
    direction: "toRoman",
    score: 0,
    total: 0,
    streak: 0,
    answered: false
  };

  function id(name) {
    return document.getElementById(name);
  }

  function setStatus(targetId, text, isError) {
    var target = id(targetId);
    if (!target) return;
    target.textContent = text || "";
    target.classList.toggle("is-error", Boolean(isError));
  }

  function status(text, isError) {
    setStatus("romanStatus", text, isError);
  }

  function setActions(enabled) {
    ["copyResultButton", "swapResultButton", "downloadResultButton", "printResultButton"].forEach(function (name) {
      id(name).disabled = !enabled;
    });
  }

  function invalidateSingle() {
    current = null;
    id("singleResult").hidden = true;
    setActions(false);
    id("singleError").textContent = "";
    id("romanInput").removeAttribute("aria-invalid");
    status(id("romanInput").value.trim() ? "Thamani imebadilika. Badilisha tena ili kupata jibu jipya." : "", false);
  }

  function swError(result) {
    if (result.empty) return "Weka namba kamili 1–3999 au namba ya Kirumi.";
    if (result.inputType === "decimal") return "Namba ya kawaida lazima iwe kamili kati ya 1 na 3999.";
    if (result.inputType === "roman") return "Huo si mwandiko wa kawaida. Tumia mfano IV, XL au MCMXCIX.";
    return "Tumia tarakimu pekee au herufi I, V, X, L, C, D na M.";
  }

  function renderSteps(result) {
    id("singleSteps").textContent = "";
    result.steps.forEach(function (step) {
      var row = document.createElement("li");
      row.textContent = step.value + " = " + step.symbols;
      id("singleSteps").appendChild(row);
    });
  }

  function convert() {
    var result = engine.convert(id("romanInput").value);
    if (!result.ok) {
      current = null;
      id("singleResult").hidden = true;
      setActions(false);
      id("singleError").textContent = swError(result);
      id("romanInput").setAttribute("aria-invalid", "true");
      status("", false);
      id("romanInput").focus();
      return null;
    }

    id("romanInput").removeAttribute("aria-invalid");
    id("singleError").textContent = "";
    current = result;
    id("singleEquation").textContent = result.equation;
    renderSteps(result);
    id("singleResult").hidden = false;
    setActions(true);
    status("Ubadilishaji umekamilika.", false);
    return result;
  }

  function swapResult() {
    if (!current) {
      status("Badilisha thamani halali kwanza.", true);
      return;
    }
    id("romanInput").value = current.output;
    convert();
    id("romanInput").focus();
  }

  function singleReport() {
    return current ? [
      "Namba za Kirumi — AfroTools",
      current.equation,
      "",
      "Mwandiko: wa kisasa wa kawaida, 1–3999.",
      "Mapitio: 31 Julai 2026.",
      "Faragha: ingizo halitumwi wala kuhifadhiwa."
    ].join("\n") : "";
  }

  function makeDownload(text, name) {
    var url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function fallbackCopy(text, targetId, successMessage) {
    var textarea = document.createElement("textarea");
    var copied = false;
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.className = "clipboard-fallback";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      copied = typeof document.execCommand === "function" && document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    textarea.remove();
    setStatus(
      targetId,
      copied ? successMessage : "Kunakili kumezuiwa. Chagua matokeo na unakili mwenyewe.",
      !copied
    );
  }

  function copy(text, targetId, successMessage) {
    if (!text) {
      setStatus(targetId, "Badilisha thamani halali kwanza.", true);
      return;
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        var pending = navigator.clipboard.writeText(text);
        if (pending && typeof pending.then === "function") {
          pending.then(function () {
            setStatus(targetId, successMessage, false);
          }).catch(function () {
            fallbackCopy(text, targetId, successMessage);
          });
          return;
        }
      }
    } catch (error) {
      fallbackCopy(text, targetId, successMessage);
      return;
    }

    fallbackCopy(text, targetId, successMessage);
  }

  function runBatch() {
    var output = engine.convertBatch(id("batchInput").value);
    if (!output.rows.length) {
      batchText = "";
      id("batchResult").hidden = true;
      id("batchError").textContent = "Weka angalau mstari mmoja.";
      setStatus("batchStatus", "", false);
      ["copyBatchButton", "downloadBatchButton"].forEach(function (name) { id(name).disabled = true; });
      return;
    }

    batchText = output.rows.map(function (row) {
      return row.input + " → " + (row.result.ok ? row.result.output : swError(row.result));
    }).join("\n");
    if (output.truncated) batchText += "\nOrodha imekatwa baada ya mistari " + output.limit + ".";

    var invalid = output.rows.filter(function (row) { return !row.result.ok; }).length;
    id("batchError").textContent = "";
    id("batchResult").textContent = batchText;
    id("batchResult").hidden = false;
    ["copyBatchButton", "downloadBatchButton"].forEach(function (name) { id(name).disabled = false; });
    setStatus(
      "batchStatus",
      output.rows.length + " imekaguliwa; " + invalid + " si halali." +
        (output.truncated ? " Mistari " + output.limit + " ya kwanza pekee imechakatwa." : ""),
      invalid > 0 || output.truncated
    );
  }

  function invalidateBatch() {
    batchText = "";
    id("batchResult").hidden = true;
    id("batchError").textContent = "";
    setStatus("batchStatus", "", false);
    ["copyBatchButton", "downloadBatchButton"].forEach(function (name) { id(name).disabled = true; });
  }

  function quizRange() {
    var difficulty = id("quizDifficulty").value;
    if (difficulty === "easy") return [1, 99];
    if (difficulty === "medium") return [1, 499];
    if (difficulty === "large") return [1000, 3999];
    return [1, 3999];
  }

  function newQuiz(shouldFocus) {
    var range = quizRange();
    quiz.number = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
    quiz.direction = Math.random() >= 0.5 ? "toRoman" : "toDecimal";
    quiz.answered = false;

    id("quizDirection").textContent = quiz.direction === "toRoman" ? "Badilisha kuwa ya Kirumi" : "Badilisha kuwa namba ya kawaida";
    id("quizPrompt").textContent = quiz.direction === "toRoman" ? String(quiz.number) : engine.toRoman(quiz.number);
    id("quizAnswer").value = "";
    id("quizAnswer").disabled = false;
    id("quizAnswer").removeAttribute("aria-invalid");
    id("checkQuizButton").disabled = false;
    id("nextQuizButton").hidden = true;
    id("quizFeedback").textContent = "";
    id("quizFeedback").className = "quiz-feedback";
    if (shouldFocus !== false) id("quizAnswer").focus();
  }

  function checkQuiz() {
    var answer = id("quizAnswer").value.trim();
    if (quiz.answered) return;
    if (!answer) {
      id("quizAnswer").setAttribute("aria-invalid", "true");
      id("quizFeedback").textContent = "Weka jibu kabla ya kulikagua.";
      id("quizFeedback").className = "quiz-feedback wrong";
      return;
    }

    id("quizAnswer").removeAttribute("aria-invalid");
    quiz.answered = true;
    quiz.total += 1;
    var correct = engine.checkQuizAnswer(quiz.direction, quiz.number, answer);
    if (correct) {
      quiz.score += 1;
      quiz.streak += 1;
    } else {
      quiz.streak = 0;
    }

    var expected = quiz.direction === "toRoman" ? engine.toRoman(quiz.number) : String(quiz.number);
    id("quizFeedback").textContent = correct ? "Sahihi." : "Bado. Jibu ni " + expected + ".";
    id("quizFeedback").className = "quiz-feedback " + (correct ? "correct" : "wrong");
    id("quizScore").textContent = quiz.score;
    id("quizTotal").textContent = quiz.total;
    id("quizStreak").textContent = quiz.streak;
    id("quizAnswer").disabled = true;
    id("checkQuizButton").disabled = true;
    id("nextQuizButton").hidden = false;
    id("nextQuizButton").focus();
  }

  id("convertButton").addEventListener("click", convert);
  id("romanInput").addEventListener("input", invalidateSingle);
  id("romanInput").addEventListener("keydown", function (event) {
    if (event.key === "Enter") convert();
  });
  id("copyResultButton").addEventListener("click", function () {
    copy(singleReport(), "romanStatus", "Ubadilishaji umenakiliwa.");
  });
  id("swapResultButton").addEventListener("click", swapResult);
  id("downloadResultButton").addEventListener("click", function () {
    if (current) makeDownload(singleReport(), "namba-za-kirumi.txt");
  });
  id("printResultButton").addEventListener("click", function () {
    if (!current) return;
    window.print();
    status("Kidirisha cha kuchapa kimefunguliwa. Chagua kuhifadhi kama PDF.", false);
  });
  id("batchButton").addEventListener("click", runBatch);
  id("batchInput").addEventListener("input", invalidateBatch);
  id("copyBatchButton").addEventListener("click", function () {
    copy(batchText, "batchStatus", "Majibu ya orodha yamenakiliwa.");
  });
  id("downloadBatchButton").addEventListener("click", function () {
    if (batchText) makeDownload(batchText, "orodha-ya-namba-za-kirumi.txt");
  });
  id("quizDifficulty").addEventListener("change", function () { newQuiz(true); });
  id("checkQuizButton").addEventListener("click", checkQuiz);
  id("nextQuizButton").addEventListener("click", function () { newQuiz(true); });
  id("skipQuizButton").addEventListener("click", function () { newQuiz(true); });
  id("quizAnswer").addEventListener("input", function () {
    id("quizAnswer").removeAttribute("aria-invalid");
    if (!quiz.answered) {
      id("quizFeedback").textContent = "";
      id("quizFeedback").className = "quiz-feedback";
    }
  });
  id("quizAnswer").addEventListener("keydown", function (event) {
    if (event.key === "Enter") checkQuiz();
  });

  newQuiz(false);
  document.documentElement.setAttribute("data-sw-roman-ready", "true");
  window.AFROTOOLS_SW_ROMAN_OWNER = {
    convert: convert,
    swapResult: swapResult,
    runBatch: runBatch,
    newQuiz: newQuiz,
    checkQuiz: checkQuiz,
    getQuizState: function () {
      return {
        number: quiz.number,
        direction: quiz.direction,
        score: quiz.score,
        total: quiz.total,
        streak: quiz.streak,
        answered: quiz.answered
      };
    }
  };
}());
