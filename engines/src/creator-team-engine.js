(function () {
  "use strict";
  var statuses = ["backlog", "doing", "review", "done"];
  function createTask(input) {
    var source = input || {};
    var project = String(source.project || "").trim();
    var title = String(source.title || "").trim();
    var owner = String(source.owner || "").trim();
    var status = String(source.status || "backlog").toLowerCase();
    if (!project) throw new Error("Project is required.");
    if (!title) throw new Error("Task is required.");
    if (!statuses.includes(status)) throw new Error("Status is invalid.");
    return {
      project: project,
      title: title,
      owner: owner,
      status: status,
      dueDate: String(source.dueDate || "").trim(),
      note: String(source.note || "").trim()
    };
  }
  function summarize(tasks) {
    var list = Array.isArray(tasks) ? tasks : [];
    var counts = { backlog: 0, doing: 0, review: 0, done: 0 };
    list.forEach(function (task) {
      if (counts[task.status] !== undefined) counts[task.status] += 1;
    });
    return { total: list.length, counts: counts };
  }
  function csvCell(value) {
    return '"' + String(value == null ? "" : value).replace(/"/g, '""') + '"';
  }
  function toCsv(tasks) {
    return ["project,title,owner,status,due_date,note"].concat((tasks || []).map(function (task) {
      return [task.project, task.title, task.owner, task.status, task.dueDate, task.note].map(csvCell).join(",");
    })).join("\r\n");
  }
  window.AfroTools = window.AfroTools || {};
  window.AfroTools.CreatorTeamEngine = { createTask: createTask, summarize: summarize, toCsv: toCsv, statuses: statuses.slice() };
}());
