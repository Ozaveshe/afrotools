/**
 * jamb-attempt — log a completed CBT attempt to Supabase.
 *
 * Anonymous-friendly. No auth required. Best-effort persistence.
 *
 * Body:
 *   {
 *     session_id: string (uuid from frontend),
 *     mode: 'cbt-full' | 'subject' | 'quick',
 *     subjects: string[],
 *     score: number (0-400 aggregate),
 *     subject_scores: { english: 65, ... },
 *     duration_seconds: number,
 *     answers: { qIndex: 'A' },
 *     question_ids: string[]
 *   }
 *
 * Writes to public.jamb_attempts. Failures are silent (frontend doesn't depend on success).
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL_DATA || "https://zpclagtgczsygrgztlts.supabase.co";
const SUPABASE_ANON = process.env.SUPABASE_ANON_KEY_DATA || process.env.SUPABASE_ANON_KEY || "";

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  // ───────── Validation ─────────
  if (!body.session_id || typeof body.session_id !== "string" || body.session_id.length > 64) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid session_id" }) };
  }

  const ALLOWED_MODES = ["cbt-full", "subject", "quick", "topic-drill", "past-paper"];
  if (!body.mode || ALLOWED_MODES.indexOf(body.mode) === -1) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid mode" }) };
  }

  const ALLOWED_SUBJECTS = ["english","mathematics","physics","chemistry","biology","government","economics","literature","crk","commerce","accounts"];
  if (!Array.isArray(body.subjects) || body.subjects.length === 0 || body.subjects.length > 5) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Invalid subjects" }) };
  }
  const cleanSubjects = body.subjects.filter(
    (s) => typeof s === "string" && ALLOWED_SUBJECTS.indexOf(s) !== -1
  );
  if (cleanSubjects.length === 0) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "No valid subjects" }) };
  }

  // Clamp score to 0-400 (JAMB UTME aggregate range) — also rejects NaN/strings
  const rawScore = Number(body.score);
  const score = Number.isFinite(rawScore) ? Math.max(0, Math.min(400, Math.round(rawScore))) : 0;

  // Clamp duration 0..7200s (2 hours max, the full CBT)
  const rawDur = Number(body.duration_seconds);
  const durationSec = Number.isFinite(rawDur) ? Math.max(0, Math.min(7200, Math.round(rawDur))) : 0;

  // Sanity-check subject_scores: object with only allowed subject keys → numeric 0-100
  const cleanSubjectScores = {};
  if (body.subject_scores && typeof body.subject_scores === "object") {
    Object.keys(body.subject_scores).forEach((k) => {
      if (ALLOWED_SUBJECTS.indexOf(k) === -1) return;
      const v = Number(body.subject_scores[k]);
      if (Number.isFinite(v)) cleanSubjectScores[k] = Math.max(0, Math.min(100, Math.round(v)));
    });
  }

  // Bound question_ids and answers to reasonable sizes
  const cleanQuestionIds = Array.isArray(body.question_ids) ? body.question_ids.slice(0, 200).filter((x) => typeof x === "string") : [];
  const cleanAnswers = (body.answers && typeof body.answers === "object") ? body.answers : {};

  // If we have no Supabase creds, just return ok (logging is best-effort)
  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, persisted: false }) };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const row = {
      anon_session: body.session_id,
      mode: body.mode,
      subjects: cleanSubjects,
      question_ids: cleanQuestionIds,
      answers: cleanAnswers,
      score: score,
      subject_scores: cleanSubjectScores,
      duration_seconds: durationSec,
      finished_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("jamb_attempts").insert(row);
    if (error) {
      console.warn("[jamb-attempt] insert error:", error.message);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, persisted: false, warn: error.message }) };
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, persisted: true }) };
  } catch (e) {
    console.warn("[jamb-attempt] exception:", e.message);
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, persisted: false }) };
  }
};
