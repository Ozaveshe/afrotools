"use strict";

const { getAllowedOrigin } = require("./utils/cors");
const { getUserFromEvent } = require("./_shared/browser-session-auth");

const SUPABASE_URL = process.env.SUPABASE_AUTH_URL || process.env.SUPABASE_URL || "https://zpclagtgczsygrgztlts.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_AUTH_SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY;

function headers(event) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(event),
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "private, no-store, max-age=0",
    "Vary": "Origin, Authorization, Cookie"
  };
}

function reply(statusCode, body, responseHeaders) {
  return { statusCode, headers: responseHeaders, body: JSON.stringify(body) };
}

async function fetchProfile(userId) {
  const response = await fetch(SUPABASE_URL + "/rest/v1/profiles?id=eq." + encodeURIComponent(userId) + "&select=*", {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: "Bearer " + SUPABASE_SERVICE_KEY,
      Accept: "application/json"
    }
  });
  const data = await response.json().catch(function () { return []; });
  if (!response.ok) throw new Error("Profile lookup failed");
  return Array.isArray(data) && data[0] ? data[0] : null;
}

async function paystackGet(path) {
  if (!process.env.PAYSTACK_SECRET_KEY) return null;
  const response = await fetch("https://api.paystack.co" + path, {
    headers: {
      Authorization: "Bearer " + process.env.PAYSTACK_SECRET_KEY,
      Accept: "application/json"
    }
  });
  const data = await response.json().catch(function () { return null; });
  if (!response.ok || !data || data.status !== true) {
    const message = data && data.message ? data.message : "Paystack request failed";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return data.data || null;
}

function cardLast4(subscription) {
  const authorization = subscription && (subscription.authorization || subscription.last_payment && subscription.last_payment.authorization);
  return authorization && authorization.last4 ? authorization.last4 : null;
}

function invoiceRows(subscription) {
  const invoices = subscription && Array.isArray(subscription.invoices) ? subscription.invoices : [];
  return invoices.slice(0, 10).map(function (invoice) {
    return {
      id: invoice.id || invoice.invoice_code || invoice.transaction || "",
      status: invoice.status || "",
      amount: invoice.amount || invoice.amount_paid || 0,
      currency: invoice.currency || "",
      paidAt: invoice.paid_at || invoice.created_at || ""
    };
  });
}

exports.handler = async function (event) {
  const responseHeaders = headers(event);
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: responseHeaders, body: "" };
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") return reply(405, { error: "Method not allowed" }, responseHeaders);

  const authResult = await getUserFromEvent(event);
  const user = authResult && authResult.user ? authResult.user : null;
  if (!user) return reply(401, { error: "Unauthorized" }, responseHeaders);
  if (!SUPABASE_SERVICE_KEY) return reply(500, { error: "Server config error" }, responseHeaders);

  try {
    const profile = await fetchProfile(user.id);
    if (!profile) return reply(404, { error: "Profile not found" }, responseHeaders);

    const subscriptionCode = profile.paystack_subscription_code || null;
    let subscription = null;
    if (subscriptionCode && process.env.PAYSTACK_SECRET_KEY) {
      subscription = await paystackGet("/subscription/" + encodeURIComponent(subscriptionCode));
    }

    if (event.httpMethod === "POST") {
      let body = {};
      try { body = JSON.parse(event.body || "{}"); } catch (error) { return reply(400, { error: "Invalid JSON" }, responseHeaders); }
      if (body.action === "cancel") {
        if (!subscriptionCode || !process.env.PAYSTACK_SECRET_KEY) return reply(409, { error: "No Paystack subscription is connected yet" }, responseHeaders);
        return reply(202, { ok: false, manualReview: true, message: "Cancellation requires owner review until the Paystack disable flow is approved." }, responseHeaders);
      }
      if (body.action === "change_email") {
        return reply(202, { ok: false, manualReview: true, message: "Email changes require account support review." }, responseHeaders);
      }
      return reply(400, { error: "Unknown billing action" }, responseHeaders);
    }

    return reply(200, {
      ok: true,
      billing: {
        plan: profile.subscription_tier || profile.tier || "free",
        renewalDate: subscription && subscription.next_payment_date ? subscription.next_payment_date : profile.subscription_expires_at || null,
        subscriptionCode: subscriptionCode,
        customerCode: profile.paystack_customer_id || null,
        cardLast4: cardLast4(subscription),
        status: subscription && subscription.status ? subscription.status : (profile.subscription_tier || profile.tier || "free"),
        invoices: invoiceRows(subscription)
      }
    }, responseHeaders);
  } catch (error) {
    console.error("Pro billing API failed:", error);
    return reply(error.status || 500, { error: error.message || "Billing lookup failed" }, responseHeaders);
  }
};
