"use strict";

const { createClient } = require("@supabase/supabase-js");
const { getAllowedOrigin } = require("./utils/cors");
const { getUserFromEvent } = require("./_shared/browser-session-auth");
const { _private: webhook } = require("./paystack-webhook");

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

function headers(event) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(event),
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "private, no-store, max-age=0",
    "Vary": "Origin, Authorization, Cookie"
  };
}

function reply(statusCode, body, responseHeaders) {
  return { statusCode, headers: responseHeaders, body: JSON.stringify(body) };
}

function cleanReference(value) {
  const text = String(value || "").trim();
  return /^[A-Za-z0-9._=-]{6,120}$/.test(text) ? text : "";
}

function paymentBelongsToUser(payment, user) {
  const data = payment && payment.data ? payment.data : {};
  const metadata = data.metadata || {};
  const customer = data.customer || {};
  const paymentUserId = metadata.user_id || metadata.userId || null;
  const paymentEmail = String(customer.email || "").trim().toLowerCase();
  const userEmail = String(user.email || "").trim().toLowerCase();
  return paymentUserId === user.id || (paymentEmail && userEmail && paymentEmail === userEmail);
}

async function verifyPaystack(reference) {
  const response = await fetch("https://api.paystack.co/transaction/verify/" + encodeURIComponent(reference), {
    headers: {
      Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY,
      Accept: "application/json"
    }
  });
  const data = await response.json().catch(function () { return null; });
  if (!response.ok || !data || data.status !== true) {
    const message = data && data.message ? data.message : "Paystack verification failed";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data;
}

exports.handler = async function (event) {
  const responseHeaders = headers(event);
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: responseHeaders, body: "" };
  if (event.httpMethod !== "POST") return reply(405, { error: "Method not allowed" }, responseHeaders);

  const authResult = await getUserFromEvent(event);
  const user = authResult && authResult.user ? authResult.user : null;
  if (!user) return reply(401, { error: "Unauthorized" }, responseHeaders);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !process.env.PAYSTACK_SECRET_KEY) {
    return reply(500, { error: "Server config error" }, responseHeaders);
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    return reply(400, { error: "Invalid JSON" }, responseHeaders);
  }

  const reference = cleanReference(body.reference);
  if (!reference) return reply(400, { error: "Payment reference is required" }, responseHeaders);

  try {
    const payment = await verifyPaystack(reference);
    if (!paymentBelongsToUser(payment, user)) {
      return reply(403, { error: "Payment reference does not match this account" }, responseHeaders);
    }
    if (!payment.data || payment.data.status !== "success") {
      return reply(409, { error: "Payment is not successful yet", paystackStatus: payment.data && payment.data.status }, responseHeaders);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    await webhook.updateProfileStatus(supabase, payment.data, "active", new Date());
    return reply(200, { ok: true, status: "active" }, responseHeaders);
  } catch (error) {
    console.error("Paystack activation replay failed:", error);
    return reply(error.status || 500, { error: error.message || "Activation replay failed" }, responseHeaders);
  }
};
