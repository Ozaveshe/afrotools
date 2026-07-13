!function() {
  "use strict";
  var e = [ "#0EA5E9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#f97316", "#06b6d4", "#6366f1", "#84cc16" ];
  window.AfroTools = window.AfroTools || {}, window.AfroTools.CreatorDeskEngine = {
    STATUSES: [ {
      id: "lead",
      label: "Lead",
      color: "#94a3b8",
      desc: "Potential projects, inquiries"
    }, {
      id: "quoted",
      label: "Quoted",
      color: "#f59e0b",
      desc: "Quote sent, awaiting response"
    }, {
      id: "active",
      label: "Active",
      color: "#0EA5E9",
      desc: "Work in progress"
    }, {
      id: "review",
      label: "Review",
      color: "#8b5cf6",
      desc: "Delivered, awaiting feedback"
    }, {
      id: "completed",
      label: "Completed",
      color: "#10b981",
      desc: "Done, invoiced or paid"
    }, {
      id: "on_hold",
      label: "On Hold",
      color: "#9ca3af",
      desc: "Paused projects"
    } ],
    PRIORITY_LEVELS: [ {
      id: "low",
      label: "Low",
      color: "transparent"
    }, {
      id: "medium",
      label: "Medium",
      color: "#f59e0b"
    }, {
      id: "high",
      label: "High",
      color: "#ef4444"
    } ],
    getInitials: function(e) {
      return e ? e.split(/\s+/).map(function(e) {
        return e[0];
      }).join("").toUpperCase().slice(0, 2) : "?";
    },
    getAvatarColor: function(t) {
      for (var n = 0, a = 0; a < (t || "").length; a++) {
        n = t.charCodeAt(a) + ((n << 5) - n);
      }
      return e[Math.abs(n) % e.length];
    },
    getDueUrgency: function(e) {
      if (!e) {
        return {
          class: "none",
          label: "",
          daysLeft: null
        };
      }
      var t = new Date;
      t.setHours(0, 0, 0, 0);
      var n = new Date(e + "T00:00:00"), a = Math.ceil((n - t) / 864e5);
      return a < 0 ? {
        class: "overdue",
        label: Math.abs(a) + "d overdue",
        daysLeft: a
      } : 0 === a ? {
        class: "overdue",
        label: "Due today",
        daysLeft: 0
      } : a <= 3 ? {
        class: "overdue",
        label: "Due in " + a + "d",
        daysLeft: a
      } : a <= 7 ? {
        class: "soon",
        label: "Due in " + a + "d",
        daysLeft: a
      } : {
        class: "safe",
        label: n.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short"
        }),
        daysLeft: a
      };
    },
    getTaskProgress: function(e) {
      if (!e || !e.length) {
        return {
          total: 0,
          done: 0,
          pct: 0
        };
      }
      var t = e.filter(function(e) {
        return e.done;
      }).length;
      return {
        total: e.length,
        done: t,
        pct: Math.round(t / e.length * 100)
      };
    },
    getPipelineStats: function(e) {
      var t = new Date;
      t.setHours(0, 0, 0, 0);
      var n = new Date(t);
      n.setDate(n.getDate() + 7);
      var a = e.filter(function(e) {
        return "completed" !== e.status && "on_hold" !== e.status && "cancelled" !== e.status;
      });
      return {
        active: e.filter(function(e) {
          return "active" === e.status;
        }).length,
        dueThisWeek: a.filter(function(e) {
          if (!e.due) {
            return !1;
          }
          var a = new Date(e.due + "T00:00:00");
          return a >= t && a <= n;
        }).length,
        overdue: a.filter(function(e) {
          return !!e.due && new Date(e.due + "T00:00:00") < t;
        }).length,
        totalValue: a.reduce(function(e, t) {
          return e + (parseInt((t.value || "0").toString().replace(/[^0-9]/g, ""), 10) || 0);
        }, 0),
        totalProjects: e.length,
        completedProjects: e.filter(function(e) {
          return "completed" === e.status;
        }).length
      };
    },
    getClientAnalytics: function(e, t) {
      var n = t.filter(function(t) {
        return t.client === e;
      }), a = n.filter(function(e) {
        return "completed" === e.status;
      }), r = a.reduce(function(e, t) {
        return e + (parseInt((t.value || "0").toString().replace(/[^0-9]/g, ""), 10) || 0);
      }, 0), o = n.filter(function(e) {
        return "active" === e.status || "review" === e.status;
      }).length;
      return {
        totalProjects: n.length,
        activeProjects: o,
        completedProjects: a.length,
        totalRevenue: r,
        averageValue: a.length ? Math.round(r / a.length) : 0,
        lastProjectDate: n.length ? Math.max.apply(null, n.map(function(e) {
          return e.createdAt || 0;
        })) : null
      };
    },
    createProject: function(e) {
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: e.name || "",
        client: e.client || "",
        status: e.status || "lead",
        priority: e.priority || "medium",
        value: e.value || "",
        currency: e.currency || "NGN",
        due: e.due || "",
        tasks: e.tasks || [],
        notes: [ {
          text: "Project created",
          type: "system",
          time: Date.now()
        } ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    },
    createClient: function(e) {
      return {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: e.name || "",
        company: e.company || "",
        email: e.email || "",
        phone: e.phone || "",
        whatsapp: e.whatsapp || "",
        country: e.country || "",
        notes: e.notes || "",
        createdAt: Date.now()
      };
    }
  };
}();
