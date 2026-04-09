/**
 * jamb-daily-signup — capture WhatsApp/email subscribers for the daily JAMB question.
 * Stores into Supabase table jamb_daily_subscribers (see supabase/jamb-schema.sql).
 *
 * Body:
 *   { channel: 'whatsapp'|'email', contact: '...', subjects: [...], send_hour: 8 }
 *
 * Best-effort write — returns ok even if persistence fails so the user UX
 * continues smoothly.
 */
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL_DATA || "https://jbmhfpkzbgyeodsqhprx.supabase.co";
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY_DATA || process.env.SUPABASE_ANON_KEY || "";

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };
  if (event.httpMethod !== "POST")
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "Method not allowed" }) };

  let body;
  try { body = JSON.parse(event.body || "{}"); }
  catch (e) { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) }; }

  const { channel, contact, subjects, send_hour } = body;
  if (!channel || !contact || !Array.isArray(subjects) || subjects.length === 0) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Missing fields" }) };
  }

  // Whitelist channels — reject anything that isn't explicitly supported
  const ALLOWED_CHANNELS = ["whatsapp", "email"];
  if (ALLOWED_CHANNELS.indexOf(channel) === -1) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid channel" }) };
  }

  // Whitelist subject keys (must match AfroJAMB subject list)
  const ALLOWED_SUBJECTS = ["english","mathematics","physics","chemistry","biology","government","economics","literature","crk","commerce","accounts"];
  const cleanSubjects = subjects
    .filter((s) => typeof s === "string" && ALLOWED_SUBJECTS.indexOf(s) !== -1)
    .slice(0, 4);
  if (cleanSubjects.length === 0) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "No valid subjects" }) };
  }

  // Validate contact length and format
  const normalized = String(contact).trim();
  if (normalized.length > 120) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Contact too long" }) };
  }
  if (channel === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid email" }) };
  }
  if (channel === "whatsapp" && normalized.replace(/\D/g, "").length < 10) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid phone" }) };
  }

  // Validate send_hour (optional, default 8)
  let hour = 8;
  if (send_hour !== undefined && send_hour !== null) {
    const h = Number(send_hour);
    if (!Number.isInteger(h) || h < 0 || h > 23) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid send_hour (0-23)" }) };
    }
    hour = h;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    // Best-effort: still return ok (user will see success screen)
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, persisted: false }) };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const row = {
      contact: normalized,
      channel: channel,
      subjects: cleanSubjects,
      send_hour: hour,
      active: true,
    };

    const { error } = await supabase
      .from("jamb_daily_subscribers")
      .upsert(row, { onConflict: "contact" });

    if (error) {
      console.warn("[jamb-daily-signup] insert error:", error.message);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, persisted: false, warn: error.message }) };
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, persisted: true }) };
  } catch (e) {
    console.warn("[jamb-daily-signup] exception:", e.message);
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, persisted: false }) };
  }
};
