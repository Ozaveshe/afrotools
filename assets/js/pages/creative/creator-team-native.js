(function () {
  "use strict";
  var root = document.querySelector("[data-creator-team-native]");
  var engine = window.AfroTools && window.AfroTools.CreatorTeamEngine;
  if (!root || !engine) return;
  var fr = root.getAttribute("data-lang") === "fr";
  var form = root.querySelector("form");
  var listNode = root.querySelector("[data-list]");
  var summaryNode = root.querySelector("[data-summary]");
  var actions = root.querySelector("[data-actions]");
  var statusNode = root.querySelector("[data-status]");
  var tasks = [];
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (char) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]; });
  }
  function download(name, type, body) {
    var url = URL.createObjectURL(new Blob([body], { type: type }));
    var link = document.createElement("a");
    link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    statusNode.textContent = fr ? "Fichier téléchargé." : "File downloaded.";
  }
  function render() {
    var summary = engine.summarize(tasks);
    listNode.innerHTML = tasks.map(function (task, index) {
      return '<article class="ctn-result crn-result"><small>' + esc(task.status) + '</small><span><strong>' + esc(task.title) + '</strong><br>' + esc(task.project + (task.owner ? " · " + task.owner : "") + (task.dueDate ? " · " + task.dueDate : "")) + (task.note ? "<br>" + esc(task.note) : "") + '</span><button type="button" data-remove="' + index + '">' + (fr ? "Retirer" : "Remove") + '</button></article>';
    }).join("");
    summaryNode.textContent = (fr ? "Tâches : " : "Tasks: ") + summary.total + " · " + (fr ? "À faire " : "Backlog ") + summary.counts.backlog + " · " + (fr ? "En cours " : "Doing ") + summary.counts.doing + " · " + (fr ? "Relecture " : "Review ") + summary.counts.review + " · " + (fr ? "Terminées " : "Done ") + summary.counts.done;
    actions.hidden = !tasks.length;
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    try {
      tasks.push(engine.createTask({ project: form.elements.project.value, title: form.elements.title.value, owner: form.elements.owner.value, status: form.elements.taskStatus.value, dueDate: form.elements.due.value, note: form.elements.note.value }));
      statusNode.textContent = fr ? "Tâche ajoutée dans cette session." : "Task added for this session.";
      form.elements.title.value = ""; form.elements.note.value = "";
      render();
    } catch (_) {
      statusNode.textContent = fr ? "Ajoutez le projet et la tâche." : "Add the project and task.";
    }
  });
  listNode.addEventListener("click", function (event) {
    var button = event.target.closest("[data-remove]");
    if (!button) return;
    tasks.splice(Number(button.getAttribute("data-remove")), 1);
    render();
  });
  root.querySelector("[data-json]").onclick = function () { if (tasks.length) download("creator-team-board.json", "application/json", JSON.stringify({ tasks: tasks, summary: engine.summarize(tasks) }, null, 2)); };
  root.querySelector("[data-csv]").onclick = function () { if (tasks.length) download("creator-team-board.csv", "text/csv;charset=utf-8", engine.toCsv(tasks)); };
  render();
}());
