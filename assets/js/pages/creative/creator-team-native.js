(function () {
  "use strict";
  var root = document.querySelector("[data-creator-team-native]");
  var engine = window.AfroTools && window.AfroTools.CreatorTeamEngine;
  if (!root || !engine) return;
  var lang = root.getAttribute("data-lang") || "en";
  var fr = lang === "fr";
  var sw = lang === "sw";
  var form = root.querySelector("form");
  var listNode = root.querySelector("[data-list]");
  var summaryNode = root.querySelector("[data-summary]");
  var actions = root.querySelector("[data-actions]");
  var statusNode = root.querySelector("[data-status]");
  var tasks = [];
  var copy = sw ? {
    downloaded: "Faili imepakuliwa.", remove: "Ondoa", tasks: "Majukumu: ", backlog: "Yaliyosubiri ", doing: "Yanayofanywa ", review: "Yanayokaguliwa ", done: "Yaliyokamilika ",
    added: "Jukumu limeongezwa kwa kipindi hiki.", invalid: "Weka mradi na jukumu.", reset: "Ubao umefutwa.",
    statuses: { backlog: "Linasubiri", doing: "Linafanywa", review: "Linakaguliwa", done: "Limekamilika" }
  } : fr ? {
    downloaded: "Fichier téléchargé.", remove: "Retirer", tasks: "Tâches : ", backlog: "À faire ", doing: "En cours ", review: "Relecture ", done: "Terminées ",
    added: "Tâche ajoutée dans cette session.", invalid: "Ajoutez le projet et la tâche.", reset: "Tableau effacé.",
    statuses: { backlog: "À faire", doing: "En cours", review: "Relecture", done: "Terminée" }
  } : {
    downloaded: "File downloaded.", remove: "Remove", tasks: "Tasks: ", backlog: "Backlog ", doing: "Doing ", review: "Review ", done: "Done ",
    added: "Task added for this session.", invalid: "Add the project and task.", reset: "Board cleared.",
    statuses: { backlog: "Backlog", doing: "Doing", review: "Review", done: "Done" }
  };
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (char) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]; });
  }
  function download(name, type, body) {
    var url = URL.createObjectURL(new Blob([body], { type: type }));
    var link = document.createElement("a");
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    statusNode.textContent = copy.downloaded;
  }
  function render() {
    var summary = engine.summarize(tasks);
    listNode.innerHTML = tasks.map(function (task, index) {
      return '<article class="ctn-result crn-result"><small>' + esc(copy.statuses[task.status] || task.status) + '</small><span><strong>' + esc(task.title) + '</strong><br>' + esc(task.project + (task.owner ? " · " + task.owner : "") + (task.dueDate ? " · " + task.dueDate : "")) + (task.note ? "<br>" + esc(task.note) : "") + '</span><button type="button" data-remove="' + index + '">' + copy.remove + '</button></article>';
    }).join("");
    summaryNode.textContent = copy.tasks + summary.total + " · " + copy.backlog + summary.counts.backlog + " · " + copy.doing + summary.counts.doing + " · " + copy.review + summary.counts.review + " · " + copy.done + summary.counts.done;
    actions.hidden = !tasks.length;
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      tasks.push(engine.createTask({ project: form.elements.project.value, title: form.elements.title.value, owner: form.elements.owner.value, status: form.elements.taskStatus.value, dueDate: form.elements.due.value, note: form.elements.note.value }));
      statusNode.textContent = copy.added;
      form.elements.title.value = ""; form.elements.note.value = "";
      render();
    } catch (_) {
      statusNode.textContent = copy.invalid;
    }
  });
  listNode.addEventListener("click", function (event) {
    var button = event.target.closest("[data-remove]");
    if (!button) return;
    tasks.splice(Number(button.getAttribute("data-remove")), 1);
    render();
  });
  var resetButton = root.querySelector("[data-reset]");
  if (resetButton) resetButton.addEventListener("click", function () {
    tasks = []; form.reset(); statusNode.textContent = copy.reset; render(); form.elements.project.focus();
  });
  root.querySelector("[data-json]").onclick = function () {
    if (!tasks.length) return;
    var payload = { tasks: tasks, summary: engine.summarize(tasks) };
    if (sw) payload.language = "sw";
    download("creator-team-board.json", "application/json", JSON.stringify(payload, null, 2));
  };
  root.querySelector("[data-csv]").onclick = function () {
    if (!tasks.length) return;
    var csvOptions = sw ? { headers: ["mradi", "jukumu", "mhusika", "hali", "tarehe_ya_mwisho", "maelezo"], statusLabels: copy.statuses } : null;
    download("creator-team-board.csv", "text/csv;charset=utf-8", engine.toCsv(tasks, csvOptions));
  };
  render();
}());
