/**
 * AfroTools Global Error Reporter + Feedback Widget
 * ===================================================
 * Drop this script into every AfroTools page via the global header.
 * Captures JS errors, unhandled promise rejections, and user feedback.
 * Sends to a lightweight endpoint (Google Forms or Supabase).
 *
 * Usage: <script src="/assets/js/afrotools-reporter.js"></script>
 */

(function () {
  "use strict";

  // ==================== CONFIGURATION ====================
  
  const CONFIG = {
    // Google Form for error reports (replace with your actual form)
    errorFormUrl: "https://docs.google.com/forms/d/e/YOUR_ERROR_FORM_ID/formResponse",
    errorFields: {
      toolId: "entry.XXXXXXX",
      errorType: "entry.XXXXXXX",
      errorMessage: "entry.XXXXXXX",
      url: "entry.XXXXXXX",
      userAgent: "entry.XXXXXXX",
      timestamp: "entry.XXXXXXX",
    },
    // Google Form for user feedback
    feedbackFormUrl: "https://docs.google.com/forms/d/e/YOUR_FEEDBACK_FORM_ID/formResponse",
    feedbackFields: {
      rating: "entry.XXXXXXX",
      comment: "entry.XXXXXXX",
      toolId: "entry.XXXXXXX",
      url: "entry.XXXXXXX",
    },
    // Throttle: max 5 error reports per page session
    maxErrors: 5,
    // Don't report these (noisy, non-actionable)
    ignorePatterns: [
      /ResizeObserver/,
      /extension/i,
      /chrome-extension/,
      /moz-extension/,
      /Script error/,
    ],
    // Feedback widget enabled
    feedbackEnabled: true,
  };

  // ==================== ERROR CAPTURE ====================

  let errorCount = 0;

  function getToolId() {
    // Extract tool ID from URL path
    const path = window.location.pathname;
    return path.replace(/^\/|\/$/g, "").replace(/\//g, "-") || "homepage";
  }

  function shouldIgnore(message) {
    return CONFIG.ignorePatterns.some((p) => p.test(message));
  }

  function reportError(type, message, source, line, col) {
    if (errorCount >= CONFIG.maxErrors) return;
    if (shouldIgnore(message)) return;
    errorCount++;

    const data = new URLSearchParams();
    data.append(CONFIG.errorFields.toolId, getToolId());
    data.append(CONFIG.errorFields.errorType, type);
    data.append(
      CONFIG.errorFields.errorMessage,
      `${message} | ${source || ""}:${line || ""}:${col || ""}`
    );
    data.append(CONFIG.errorFields.url, window.location.href);
    data.append(CONFIG.errorFields.userAgent, navigator.userAgent.slice(0, 200));
    data.append(CONFIG.errorFields.timestamp, new Date().toISOString());

    // Fire-and-forget POST to Google Form
    if (navigator.sendBeacon) {
      navigator.sendBeacon(CONFIG.errorFormUrl, data);
    } else {
      fetch(CONFIG.errorFormUrl, {
        method: "POST",
        body: data,
        mode: "no-cors",
      }).catch(() => {});
    }
  }

  // Global error handler
  window.addEventListener("error", function (e) {
    reportError(
      "js-error",
      e.message || "Unknown error",
      e.filename,
      e.lineno,
      e.colno
    );
  });

  // Unhandled promise rejection
  window.addEventListener("unhandledrejection", function (e) {
    reportError(
      "promise-rejection",
      e.reason?.message || String(e.reason) || "Unhandled rejection"
    );
  });

  // ==================== FEEDBACK WIDGET ====================

  if (!CONFIG.feedbackEnabled) return;

  function createFeedbackWidget() {
    // Don't show on print or if already exists
    if (window.matchMedia("print").matches) return;
    if (document.getElementById("afrotools-feedback")) return;

    const widget = document.createElement("div");
    widget.id = "afrotools-feedback";
    widget.innerHTML = `
      <style>
        #afrotools-feedback {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        #afrotools-feedback .fb-trigger {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #008751;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #afrotools-feedback .fb-trigger:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        #afrotools-feedback .fb-panel {
          display: none;
          position: absolute;
          bottom: 60px;
          right: 0;
          width: 280px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.15);
          padding: 16px;
          animation: fbSlideUp 0.2s ease-out;
        }
        @keyframes fbSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        #afrotools-feedback .fb-panel.active { display: block; }
        #afrotools-feedback .fb-title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }
        #afrotools-feedback .fb-emojis {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 12px;
        }
        #afrotools-feedback .fb-emoji {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          border: 2px solid #e0e0e0;
          background: white;
          cursor: pointer;
          font-size: 24px;
          transition: border-color 0.15s, transform 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        #afrotools-feedback .fb-emoji:hover,
        #afrotools-feedback .fb-emoji.selected {
          border-color: #008751;
          transform: scale(1.1);
        }
        #afrotools-feedback .fb-comment {
          width: 100%;
          height: 60px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 8px;
          font-size: 13px;
          resize: none;
          font-family: inherit;
          margin-bottom: 8px;
        }
        #afrotools-feedback .fb-comment:focus {
          outline: none;
          border-color: #008751;
        }
        #afrotools-feedback .fb-submit {
          width: 100%;
          padding: 8px;
          background: #008751;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        #afrotools-feedback .fb-submit:hover { background: #006b41; }
        #afrotools-feedback .fb-submit:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        #afrotools-feedback .fb-thanks {
          text-align: center;
          padding: 20px;
          color: #008751;
          font-size: 14px;
          font-weight: 600;
        }
        #afrotools-feedback .fb-report {
          text-align: center;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
        }
        #afrotools-feedback .fb-report a {
          font-size: 12px;
          color: #999;
          text-decoration: none;
        }
        #afrotools-feedback .fb-report a:hover { color: #008751; }
        @media print {
          #afrotools-feedback { display: none !important; }
        }
      </style>
      <button class="fb-trigger" aria-label="Send feedback" title="Send feedback">💬</button>
      <div class="fb-panel">
        <div class="fb-title">How was this tool?</div>
        <div class="fb-emojis">
          <button class="fb-emoji" data-rating="good" aria-label="Good">😊</button>
          <button class="fb-emoji" data-rating="ok" aria-label="Okay">😐</button>
          <button class="fb-emoji" data-rating="bad" aria-label="Bad">😞</button>
        </div>
        <textarea class="fb-comment" placeholder="Any details? (optional)" maxlength="500"></textarea>
        <button class="fb-submit" disabled>Send Feedback</button>
        <div class="fb-report">
          <a href="#" class="fb-report-link">Report incorrect data</a>
        </div>
      </div>
    `;

    document.body.appendChild(widget);

    // Wire up interactions
    const trigger = widget.querySelector(".fb-trigger");
    const panel = widget.querySelector(".fb-panel");
    const emojis = widget.querySelectorAll(".fb-emoji");
    const comment = widget.querySelector(".fb-comment");
    const submit = widget.querySelector(".fb-submit");
    const reportLink = widget.querySelector(".fb-report-link");

    let selectedRating = null;

    trigger.addEventListener("click", () => {
      panel.classList.toggle("active");
    });

    emojis.forEach((emoji) => {
      emoji.addEventListener("click", () => {
        emojis.forEach((e) => e.classList.remove("selected"));
        emoji.classList.add("selected");
        selectedRating = emoji.dataset.rating;
        submit.disabled = false;
      });
    });

    submit.addEventListener("click", () => {
      if (!selectedRating) return;

      const data = new URLSearchParams();
      data.append(CONFIG.feedbackFields.rating, selectedRating);
      data.append(CONFIG.feedbackFields.comment, comment.value.trim());
      data.append(CONFIG.feedbackFields.toolId, getToolId());
      data.append(CONFIG.feedbackFields.url, window.location.href);

      if (navigator.sendBeacon) {
        navigator.sendBeacon(CONFIG.feedbackFormUrl, data);
      } else {
        fetch(CONFIG.feedbackFormUrl, {
          method: "POST",
          body: data,
          mode: "no-cors",
        }).catch(() => {});
      }

      // Show thanks
      panel.innerHTML =
        '<div class="fb-thanks">Thank you for your feedback! 🙏</div>';
      setTimeout(() => {
        panel.classList.remove("active");
      }, 2000);
    });

    reportLink.addEventListener("click", (e) => {
      e.preventDefault();
      // Open a pre-filled Google Form for data correction reports
      const reportUrl = `https://docs.google.com/forms/d/e/YOUR_DATA_REPORT_FORM_ID/viewform?usp=pp_url&entry.TOOL=${encodeURIComponent(getToolId())}&entry.URL=${encodeURIComponent(window.location.href)}`;
      window.open(reportUrl, "_blank");
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!widget.contains(e.target)) {
        panel.classList.remove("active");
      }
    });
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createFeedbackWidget);
  } else {
    createFeedbackWidget();
  }

  // ==================== CALCULATION COUNTER ====================
  // Lightweight counter that increments on every "calculate" action
  
  window.afroToolsTrack = function(event, data) {
    // GA4 custom event
    if (window.gtag) {
      window.gtag("event", event, {
        tool_id: getToolId(),
        ...data,
      });
    }
    
    // If we have a Supabase or Netlify Function endpoint for counters:
    // fetch('/api/track', { method: 'POST', body: JSON.stringify({ event, tool: getToolId(), ...data }), headers: { 'Content-Type': 'application/json' } }).catch(() => {});
  };

  // ==================== LOCALSTORAGE STANDARDIZATION ====================
  // Shared user data across all AfroTools tools
  
  window.afroToolsUser = {
    get() {
      try {
        return JSON.parse(localStorage.getItem("afrotools_user")) || {};
      } catch {
        return {};
      }
    },
    set(data) {
      try {
        const current = this.get();
        localStorage.setItem(
          "afrotools_user",
          JSON.stringify({ ...current, ...data })
        );
      } catch {}
    },
    getEmail() {
      return this.get().email || "";
    },
    getName() {
      return this.get().name || "";
    },
  };
})();
