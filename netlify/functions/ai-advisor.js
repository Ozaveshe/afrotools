// netlify/functions/ai-advisor.js
// Universal AI advisor for all AfroTools calculators
// Proxies requests to Anthropic API using server-side key

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async function(event) {
  // CORS headers — restrict to our domain to prevent abuse
  const allowedOrigins = [
    "https://afrotools.com",
    "https://www.afrotools.com",
  ];
  const origin = event.headers?.origin || event.headers?.Origin || "";
  const corsOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

  const headers = {
    "Access-Control-Allow-Origin": corsOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: "API key not configured", reply: "The AI advisor is not yet configured. Please add the ANTHROPIC_API_KEY environment variable in your Netlify dashboard." })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { system, message, messages, tool } = body;

    // Build system prompt based on tool context
    let systemPrompt = system || "You are the AfroTools AI Advisor, a helpful expert on African financial and immigration matters.";
    
    // Add tool-specific context if tool param provided
    if (tool === "ng-paye") {
      systemPrompt += " You are specifically helping with Nigeria PAYE (Pay As You Earn) tax calculations. You know FIRS tax bands, CRA relief, NHF, pension contributions, and the differences between PITA 2025 and NTA 2026. Give specific, actionable tax advice for Nigerian employees and employers.";
    } else if (tool === "ke-paye") {
      systemPrompt += " You are specifically helping with Kenya PAYE tax calculations. You know KRA tax bands, NSSF Tier I/II, SHIF at 2.75%, Affordable Housing Levy at 1.5%, and the Tax Laws Amendment Act 2024 which repealed SHIF relief and AHL tax relief. Give specific advice for Kenyan taxpayers.";
    } else if (tool === "japa") {
      systemPrompt += " You are the Japa Advisor, an expert on African emigration and immigration pathways to Canada, UK, US, Australia, Germany, Ireland, and New Zealand. Help users plan their relocation with practical, specific advice on visa pathways, costs, timelines, and tips for reducing expenses.";
    }

    systemPrompt += " Keep responses concise (under 250 words). Be specific with numbers. Use the user's local currency where relevant. Be encouraging but honest. No markdown formatting, no asterisks, no dashes as bullets.";

    // Support both formats: {message: "string"} and {messages: [{role,content}]}
    let apiMessages;
    if (messages && Array.isArray(messages)) {
      apiMessages = messages;
    } else if (message) {
      apiMessages = [{ role: "user", content: message }];
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "No message provided" }) };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        system: systemPrompt,
        messages: apiMessages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return {
        statusCode: response.status, headers,
        body: JSON.stringify({ error: "AI service error", reply: "The AI advisor is temporarily unavailable. Please try again in a moment." })
      };
    }

    const data = await response.json();
    const reply = data.content && data.content[0] && data.content[0].text 
      ? data.content[0].text 
      : "I couldn't generate a response. Please try again.";

    return {
      statusCode: 200, headers,
      body: JSON.stringify({ reply })
    };

  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: "Internal error", reply: "Something went wrong. Please try again." })
    };
  }
};
