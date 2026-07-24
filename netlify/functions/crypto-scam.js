"use strict";

const { getAllowedOrigin } = require("./utils/cors");

function headers(event) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(event),
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Cache-Control": "no-store",
    "Content-Type": "application/json"
  };
}

exports.handler = async function handler(event) {
  const responseHeaders = headers(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: responseHeaders, body: "" };
  }
  return {
    statusCode: 410,
    headers: responseHeaders,
    body: JSON.stringify({
      error: "crypto_scam_endpoint_retired",
      status: "retired",
      replacement: "/crypto/scam-checker/",
      message: "The former lookup and report endpoint is retired. The replacement is a browser-local evidence organizer and does not accept or return incident data."
    })
  };
};
