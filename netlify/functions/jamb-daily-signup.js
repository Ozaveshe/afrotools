/**
 * jamb-daily-signup - Daily Question signup + channel capabilities.
 *
 * GET  -> returns which delivery channels are currently live.
 * GET  -> with ?unsubscribe=<contact>, disables Daily Question for that contact.
 * POST -> stores a subscriber row in jamb_daily_subscribers.
 *
 * Body:
 *   { channel: 'whatsapp'|'email', contact: '...', subjects: [...], send_hour: 8 }
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL_DATA || "https://jbmhfpkzbgyeodsqhprx.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_DATA_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  "";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const ALLOWED_CHANNELS = ["whatsapp", "email"];
const ALLOWED_SUBJECTS = ["english", "mathematics", "physics", "chemistry", "biology", "government", "economics", "literature", "crk", "commerce", "accounts"];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: Object.assign({}, corsHeaders(), {
      "Content-Type": "application/json; charset=utf-8",
    }),
    body: JSON.stringify(body),
  };
}

function html(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: Object.assign({}, corsHeaders(), {
      "Content-Type": "text/html; charset=utf-8",
    }),
    body: body,
  };
}

function getChannelCapabilities() {
  return {
    email: !!(SUPABASE_SERVICE_KEY && RESEND_API_KEY),
    whatsapp: false,
  };
}

function normalizeContact(channel, contact) {
  var normalized = String(contact || "").trim();
  if (channel === "email") return normalized.toLowerCase();
  var digits = normalized.replace(/\D/g, "");
  return digits ? "+" + digits : "";
}

function guessChannel(contact) {
  return String(contact || "").indexOf("@") !== -1 ? "email" : "whatsapp";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderMessagePage(title, message, accent) {
  var safeTitle = escapeHtml(title);
  var safeMessage = escapeHtml(message);
  var tone = accent || "#0f172a";
  return "<!DOCTYPE html>" +
    "<html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<title>" + safeTitle + " | AfroJAMB</title></head>" +
    "<body style=\"margin:0;background:#eff6ff;font-family:DM Sans,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:#0f172a;\">" +
      "<div style=\"min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;\">" +
        "<div style=\"max-width:560px;width:100%;background:#ffffff;border:1px solid #dbeafe;border-radius:20px;padding:32px;box-shadow:0 24px 64px rgba(15,23,42,.12);\">" +
          "<div style=\"font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;margin-bottom:10px;\">AfroJAMB Daily Question</div>" +
          "<h1 style=\"margin:0 0 12px;font-size:28px;line-height:1.15;letter-spacing:-.03em;color:" + tone + ";\">" + safeTitle + "</h1>" +
          "<p style=\"margin:0;font-size:16px;line-height:1.7;color:#475569;\">" + safeMessage + "</p>" +
          "<div style=\"margin-top:22px;\"><a href=\"https://afrotools.com/jamb/\" style=\"display:inline-block;background:#007AFF;color:#ffffff;text-decoration:none;padding:13px 20px;border-radius:999px;font-size:14px;font-weight:700;\">Back to AfroJAMB</a></div>" +
        "</div>" +
      "</div>" +
    "</body></html>";
}

async function handleUnsubscribe(rawContact) {
  var channel = guessChannel(rawContact);
  var normalized = normalizeContact(channel, rawContact);

  if (!normalized) {
    return html(400, renderMessagePage("Invalid unsubscribe link", "That Daily Question unsubscribe link is incomplete. Please use the link from your email.", "#b91c1c"));
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return html(503, renderMessagePage("Daily Question is unavailable", "We could not update your preference right now because the delivery service is not configured on this deploy.", "#b91c1c"));
  }

  try {
    var supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    var result = await supabase
      .from("jamb_daily_subscribers")
      .update({ active: false })
      .eq("contact", normalized);

    if (result.error) {
      console.warn("[jamb-daily-signup] unsubscribe error:", result.error.message);
      return html(500, renderMessagePage("Could not unsubscribe yet", "We hit a problem while updating your Daily Question preference. Please try the link again in a moment.", "#b91c1c"));
    }

    return html(200, renderMessagePage("You are unsubscribed", "Daily Question has been turned off for " + normalized + ". You will not receive more daily emails unless you sign up again.", "#166534"));
  } catch (error) {
    console.warn("[jamb-daily-signup] unsubscribe exception:", error.message);
    return html(500, renderMessagePage("Could not unsubscribe yet", "We hit a problem while updating your Daily Question preference. Please try the link again in a moment.", "#b91c1c"));
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod === "GET") {
    var query = event.queryStringParameters || {};
    if (query.unsubscribe) {
      return handleUnsubscribe(query.unsubscribe);
    }

    return json(200, {
      ok: true,
      capabilities: getChannelCapabilities(),
      timezone: "Africa/Lagos",
      notes: {
        email: RESEND_API_KEY ? "Email delivery is live." : "Email delivery is not configured yet.",
        whatsapp: "WhatsApp daily delivery stays hidden until an approved Meta template flow is connected.",
      },
    });
  }

  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  var body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return json(400, { error: "Invalid JSON" });
  }

  var channel = body.channel;
  var contact = body.contact;
  var subjects = body.subjects;
  var sendHour = body.send_hour;

  if (!channel || !contact || !Array.isArray(subjects) || subjects.length === 0) {
    return json(400, { error: "Missing fields" });
  }
  if (ALLOWED_CHANNELS.indexOf(channel) === -1) {
    return json(400, { error: "Invalid channel" });
  }

  var cleanSubjects = subjects
    .filter(function (subject) {
      return typeof subject === "string" && ALLOWED_SUBJECTS.indexOf(subject) !== -1;
    })
    .slice(0, 4);
  if (cleanSubjects.length === 0) {
    return json(400, { error: "No valid subjects" });
  }

  var capabilities = getChannelCapabilities();
  if (!capabilities[channel]) {
    return json(409, {
      error: channel === "email" ? "Email delivery is not configured yet." : "WhatsApp delivery is not live yet.",
    });
  }

  var normalized = normalizeContact(channel, contact);
  if (normalized.length > 120) {
    return json(400, { error: "Contact too long" });
  }
  if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return json(400, { error: "Invalid email" });
  }
  if (channel === "whatsapp" && normalized.replace(/\D/g, "").length < 10) {
    return json(400, { error: "Invalid phone" });
  }

  var hour = 8;
  if (sendHour !== undefined && sendHour !== null) {
    var parsedHour = Number(sendHour);
    if (!Number.isInteger(parsedHour) || parsedHour < 0 || parsedHour > 23) {
      return json(400, { error: "Invalid send_hour (0-23)" });
    }
    hour = parsedHour;
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return json(503, { error: "Daily Question storage is not configured yet." });
  }

  try {
    var supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    var row = {
      contact: normalized,
      channel: channel,
      subjects: cleanSubjects,
      send_hour: hour,
      active: true,
    };
    var result = await supabase
      .from("jamb_daily_subscribers")
      .upsert(row, { onConflict: "contact" });

    if (result.error) {
      console.warn("[jamb-daily-signup] insert error:", result.error.message);
      return json(503, { error: "Could not save your signup yet." });
    }

    return json(200, {
      ok: true,
      persisted: true,
      channel: channel,
      send_hour: hour,
      timezone: "Africa/Lagos",
    });
  } catch (error) {
    console.warn("[jamb-daily-signup] exception:", error.message);
    return json(503, { error: "Could not save your signup yet." });
  }
};
