/**
 * AfroJAMB CBT Engine
 * Pixel-perfect-feeling CBT mock test runner.
 *
 * Public API (window.AfroJAMB.CBT):
 *   init(config)            -> initialize a session
 *   getCurrentQuestion()    -> {q, index, total, subject}
 *   selectAnswer(letter)
 *   markForReview()
 *   next() / prev() / goto(index)
 *   switchSubject(key)
 *   submit()                -> {score, breakdown, ...}
 *   timeRemainingSeconds()
 *
 * Storage:
 *   - In-memory state during session
 *   - Snapshot to localStorage every 15s for resume
 *   - Final attempt POST to /.netlify/functions/jamb-attempt (or skip if local-only)
 */
(function (global) {
  "use strict";

  var STORAGE_KEY = "afrojamb-cbt-state";

  var state = null;
  var timerInterval = null;
  var snapshotInterval = null;

  function uuid() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c){
      return (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c/4)).toString(16);
    });
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function buildSubjectIndex(subjects, questions) {
    var index = {};
    subjects.forEach(function (subj) {
      var start = -1;
      var end = -1;
      questions.forEach(function (q, idx) {
        if (q.subject !== subj) return;
        if (start === -1) start = idx;
        end = idx + 1;
      });
      if (start !== -1) {
        index[subj] = [start, end];
      }
    });
    return index;
  }

  /**
   * config:
   *   subjects: ['english','mathematics','physics','biology']
   *   mode: 'cbt-full' | 'subject' | 'quick' | 'past-paper'
   *   year: optional, locks to a specific year (past-paper mode)
   *   questionsPerSubject: default 40 (10 for quick)
   *   durationMinutes: default 120 (30 for quick)
   *   pool: array of question objects (loaded externally)
   *   answeredOnly: boolean (default true) — only use questions with confirmed answers
   */
  function init(config) {
    config = config || {};
    if (!Array.isArray(config.pool)) {
      throw new Error("CBT.init requires config.pool (question array)");
    }
    var subjects = config.subjects && config.subjects.length ? config.subjects : ["english","mathematics","physics","biology"];
    var qPerSubj = config.questionsPerSubject || (config.mode === "quick" ? 10 : 40);
    var durationMin = config.durationMinutes || (config.mode === "quick" ? 30 : 120);
    // Default to false: include all questions, score only answered ones.
    // This guarantees enough Qs per subject even if answer keys are missing.
    var answeredOnly = config.answeredOnly === true;

    // Build per-subject question lists from pool
    // Strategy: prefer answered + 4-option, fall back to unanswered if needed.
    var sessionQuestions = [];
    subjects.forEach(function (subj) {
      var available = config.pool.filter(function (q) {
        if (q.subject !== subj) return false;
        if (answeredOnly && !q.answer) return false;
        if (config.year && q.year !== config.year) return false;
        return true;
      });
      // Tier 1: answered + 4-option (best quality)
      var tier1 = available.filter(function (q) {
        return q.answer && (q.format === 4 || Object.keys(q.options || {}).length === 4);
      });
      // Tier 2: any answered
      var tier2 = available.filter(function (q) { return q.answer && tier1.indexOf(q) === -1; });
      // Tier 3: unanswered (fallback)
      var tier3 = available.filter(function (q) { return !q.answer; });

      shuffle(tier1); shuffle(tier2); shuffle(tier3);
      var picked = tier1.concat(tier2).concat(tier3).slice(0, qPerSubj);
      sessionQuestions.push.apply(sessionQuestions, picked);
    });

    if (sessionQuestions.length === 0) {
      throw new Error("CBT.init: no questions found for given config");
    }

    state = {
      sessionId: uuid(),
      mode: config.mode || "cbt-full",
      subjects: subjects,
      subjectIndex: buildSubjectIndex(subjects, sessionQuestions),
      questions: sessionQuestions,
      answers: {}, // qIndex -> letter
      marked: {}, // qIndex -> bool
      currentIndex: 0,
      currentSubject: subjects[0],
      startedAt: Date.now(),
      durationMs: durationMin * 60 * 1000,
      submitted: false,
      score: null,
    };

    persist();
    startTimer(config.onTick, config.onTimeout);
    startAutoSave();
    return state;
  }

  function restore(config, snapshot) {
    config = config || {};
    if (!snapshot || !Array.isArray(snapshot.questionIds) || !snapshot.questionIds.length) {
      throw new Error("CBT.restore: invalid snapshot");
    }
    if (!Array.isArray(config.pool)) {
      throw new Error("CBT.restore requires config.pool (question array)");
    }

    var poolById = {};
    config.pool.forEach(function (q) {
      if (q && q.id) poolById[q.id] = q;
    });

    var sessionQuestions = snapshot.questionIds.map(function (id) {
      return poolById[id] || null;
    }).filter(Boolean);

    if (sessionQuestions.length === 0) {
      throw new Error("CBT.restore: saved questions are no longer available");
    }

    var subjects = Array.isArray(snapshot.subjects) && snapshot.subjects.length
      ? snapshot.subjects.slice()
      : sessionQuestions.reduce(function (list, q) {
          if (list.indexOf(q.subject) === -1) list.push(q.subject);
          return list;
        }, []);

    state = {
      sessionId: snapshot.sessionId || uuid(),
      mode: snapshot.mode || config.mode || "cbt-full",
      subjects: subjects,
      subjectIndex: buildSubjectIndex(subjects, sessionQuestions),
      questions: sessionQuestions,
      answers: snapshot.answers || {},
      marked: snapshot.marked || {},
      currentIndex: Math.max(0, Math.min(snapshot.currentIndex || 0, sessionQuestions.length - 1)),
      currentSubject: snapshot.currentSubject || subjects[0],
      startedAt: snapshot.startedAt || Date.now(),
      durationMs: snapshot.durationMs || ((config.durationMinutes || 120) * 60 * 1000),
      submitted: false,
      score: null,
    };

    syncSubjectFromIndex();
    persist();
    startTimer(config.onTick, config.onTimeout);
    startAutoSave();
    return state;
  }

  function persist() {
    try {
      // Don't save full question text — just IDs to keep small
      var snap = {
        sessionId: state.sessionId,
        mode: state.mode,
        subjects: state.subjects,
        subjectIndex: state.subjectIndex,
        questionIds: state.questions.map(function (q) { return q.id; }),
        answers: state.answers,
        marked: state.marked,
        currentIndex: state.currentIndex,
        currentSubject: state.currentSubject,
        startedAt: state.startedAt,
        durationMs: state.durationMs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
    } catch (e) { /* ignore quota */ }
  }

  function clearPersist() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function startTimer(onTick, onTimeout) {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      var remaining = timeRemainingSeconds();
      if (typeof onTick === "function") onTick(remaining);
      if (remaining <= 0) {
        clearInterval(timerInterval);
        if (typeof onTimeout === "function") onTimeout();
      }
    }, 1000);
  }

  function startAutoSave() {
    if (snapshotInterval) clearInterval(snapshotInterval);
    snapshotInterval = setInterval(persist, 15000);
  }

  function timeRemainingSeconds() {
    if (!state) return 0;
    var elapsed = Date.now() - state.startedAt;
    return Math.max(0, Math.floor((state.durationMs - elapsed) / 1000));
  }

  function getCurrentQuestion() {
    if (!state) return null;
    var q = state.questions[state.currentIndex];
    return {
      question: q,
      index: state.currentIndex,
      total: state.questions.length,
      currentSubject: state.currentSubject,
      indexInSubject: state.currentIndex - state.subjectIndex[state.currentSubject][0] + 1,
      subjectTotal: state.subjectIndex[state.currentSubject][1] - state.subjectIndex[state.currentSubject][0],
      isAnswered: !!state.answers[state.currentIndex],
      isMarked: !!state.marked[state.currentIndex],
      selectedAnswer: state.answers[state.currentIndex] || null,
    };
  }

  function selectAnswer(letter) {
    if (!state || state.submitted) return;
    state.answers[state.currentIndex] = letter;
    persist();
  }

  function markForReview() {
    if (!state) return;
    state.marked[state.currentIndex] = !state.marked[state.currentIndex];
    persist();
  }

  function next() {
    if (!state) return;
    if (state.currentIndex < state.questions.length - 1) {
      state.currentIndex++;
      syncSubjectFromIndex();
      persist();
    }
  }

  function prev() {
    if (!state) return;
    if (state.currentIndex > 0) {
      state.currentIndex--;
      syncSubjectFromIndex();
      persist();
    }
  }

  function goto(idx) {
    if (!state) return;
    if (idx >= 0 && idx < state.questions.length) {
      state.currentIndex = idx;
      syncSubjectFromIndex();
      persist();
    }
  }

  function syncSubjectFromIndex() {
    var idx = state.currentIndex;
    for (var subj in state.subjectIndex) {
      var range = state.subjectIndex[subj];
      if (idx >= range[0] && idx < range[1]) {
        state.currentSubject = subj;
        return;
      }
    }
  }

  function switchSubject(key) {
    if (!state || !state.subjectIndex[key]) return;
    state.currentSubject = key;
    state.currentIndex = state.subjectIndex[key][0];
    persist();
  }

  function submit() {
    if (!state) return null;
    state.submitted = true;
    if (timerInterval) clearInterval(timerInterval);
    if (snapshotInterval) clearInterval(snapshotInterval);

    var totalCorrect = 0;
    var totalGraded = 0;
    var subjectScores = {};
    var subjectCorrect = {};
    var subjectGraded = {};   // questions that have answer keys
    var subjectTotal = {};    // total questions in subject (for display)

    state.subjects.forEach(function (s) {
      subjectCorrect[s] = 0;
      subjectGraded[s] = 0;
      subjectTotal[s] = 0;
    });

    state.questions.forEach(function (q, idx) {
      var subj = q.subject;
      subjectTotal[subj] = (subjectTotal[subj] || 0) + 1;
      if (!q.answer) return; // ungraded question — skip in scoring
      subjectGraded[subj]++;
      totalGraded++;
      var picked = state.answers[idx];
      if (picked && picked === q.answer) {
        totalCorrect++;
        subjectCorrect[subj] = (subjectCorrect[subj] || 0) + 1;
      }
    });

    // Convert to JAMB-style 0-100 per subject (graded only)
    state.subjects.forEach(function (s) {
      var g = subjectGraded[s];
      subjectScores[s] = g > 0 ? Math.round((subjectCorrect[s] / g) * 100) : null;
    });

    // Aggregate (0-400 for full CBT) — only across subjects with graded Qs
    var gradedSubjects = state.subjects.filter(function (s) { return subjectGraded[s] > 0; });
    var aggregate = 0;
    if (gradedSubjects.length > 0) {
      var aggregateRaw = gradedSubjects.reduce(function (sum, s) { return sum + (subjectScores[s] || 0); }, 0);
      aggregate = Math.round((aggregateRaw / (gradedSubjects.length * 100)) * 400);
    }

    // Build per-question review data so the results screen can walk through wrong answers
    var reviewItems = state.questions.map(function (q, idx) {
      var picked = state.answers[idx] || null;
      var graded = !!q.answer;
      var correct = graded && picked === q.answer;
      return {
        index: idx,
        subject: q.subject,
        year: q.year,
        num: q.num,
        question: q.question,
        options: q.options,
        correctAnswer: q.answer,
        pickedAnswer: picked,
        graded: graded,
        correct: correct,
        wrong: graded && picked && picked !== q.answer,
        skipped: !picked,
      };
    });

    state.score = {
      total: totalCorrect,
      outOf: totalGraded,
      ungraded: state.questions.length - totalGraded,
      pctCorrect: totalGraded > 0 ? Math.round((totalCorrect / totalGraded) * 100) : 0,
      subjectScores: subjectScores,
      subjectCorrect: subjectCorrect,
      subjectGraded: subjectGraded,
      subjectTotal: subjectTotal,
      aggregate: aggregate, // 0-400
      gradedSubjects: gradedSubjects,
      durationSeconds: Math.floor((Date.now() - state.startedAt) / 1000),
      reviewItems: reviewItems,
      wrongCount: reviewItems.filter(function(r){ return r.wrong; }).length,
      skippedCount: reviewItems.filter(function(r){ return r.skipped; }).length,
    };

    clearPersist();

    // Best-effort POST to attempt logger (safe if endpoint missing)
    try {
      fetch("/.netlify/functions/jamb-attempt", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          session_id: state.sessionId,
          mode: state.mode,
          subjects: state.subjects,
          score: state.score.aggregate,
          subject_scores: subjectScores,
          duration_seconds: state.score.durationSeconds,
          answers: state.answers,
          question_ids: state.questions.map(function(q){return q.id;}),
        }),
      }).catch(function(){});
    } catch(e){}

    return state.score;
  }

  function getNavGrid() {
    if (!state) return [];
    return state.questions.map(function (q, i) {
      return {
        index: i,
        num: i + 1,
        subject: q.subject,
        answered: !!state.answers[i],
        marked: !!state.marked[i],
        current: i === state.currentIndex,
      };
    });
  }

  function getCurrentSubjectGrid() {
    if (!state) return [];
    var range = state.subjectIndex[state.currentSubject];
    return getNavGrid().slice(range[0], range[1]);
  }

  function tryRestore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  global.AfroJAMB = global.AfroJAMB || {};
  global.AfroJAMB.CBT = {
    init: init,
    getCurrentQuestion: getCurrentQuestion,
    selectAnswer: selectAnswer,
    markForReview: markForReview,
    next: next,
    prev: prev,
    goto: goto,
    switchSubject: switchSubject,
    submit: submit,
    timeRemainingSeconds: timeRemainingSeconds,
    getNavGrid: getNavGrid,
    getCurrentSubjectGrid: getCurrentSubjectGrid,
    tryRestore: tryRestore,
    restore: restore,
    clearSession: function () { state = null; clearPersist(); },
    getState: function () { return state; },
  };
})(typeof window !== "undefined" ? window : globalThis);
