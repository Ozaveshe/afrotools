/**
 * fp-ai.js — AI module for AfroPlan Floor Planner
 * Lazy-loaded IIFE. Exports FPAi.
 */
(function (global) {
  'use strict';

  const AI_ENDPOINT = '/.netlify/functions/ai-advisor';
  const TOOL_NAME = 'floor-planner';

  // ─────────────────────────────────────────────
  // System prompts
  // ─────────────────────────────────────────────

  const FLOOR_PLAN_SYSTEM_PROMPT = `You are an expert African residential architect.
Your task is to generate a valid floor plan JSON object from a user's description.

RESPOND WITH ONLY A VALID JSON OBJECT — no explanations, no markdown, no code fences.
If you must wrap in code fences, use triple backticks with "json" language tag.

=== PLOT STANDARDS ===
- Nigerian standard plot: 60x120 ft (18.3 x 36.6 m)
- Nigerian half plot: 9.15 x 36.6 m
- Nigerian corner plot: usually 18.3 x 36.6 m with two road frontages
- Kenyan standard plot: 50x100 ft (15.2 x 30.5 m); 1/8 acre = ~50x100 ft
- South African erf: variable, typically 200–1000 m²

=== HOUSING TYPES ===
- Bungalow: single-storey detached dwelling
- Duplex: two-storey with separate or shared entry
- Self-contain: single unit with private bedroom, kitchen, bath (bedsitter variant has combined living/sleeping)
- Face-me-I-face-you: rows of rooms facing each other along shared corridor, shared facilities
- Compound house: multiple units around a central courtyard
- Block of flats: multi-unit stacked apartments
- Maisonette: two-storey unit within a larger building

=== NIGERIAN RESIDENTIAL SETBACKS ===
- Front setback: 3 m minimum from road boundary
- Side setbacks: 1.5 m minimum each side
- Rear setback: 3 m minimum

=== SPECIAL ROOMS ===
- BQ (Boys' Quarters): always located at the rear of the plot
- Security post / gatehouse: at the front gate, near the plot entrance
- Parlour = living room (Nigerian usage)

=== WALL THICKNESSES ===
- External walls: 0.225 m (9 inches / 225 mm)
- Internal walls: 0.15 m (6 inches / 150 mm)

=== STANDARD ROOM SIZES (metres) ===
- Master bedroom: 4 x 4.5 m
- Standard bedroom: 3 x 3.5 m
- Parlour / living room: 4 x 5 m
- Dining room: 3 x 4 m
- Kitchen: 2.5 x 3 m
- Bathroom / WC: 2 x 2.5 m
- Corridor / passage: 1.2 m wide minimum
- Store: 1.5 x 2 m
- BQ room: 2.5 x 3 m
- Security post: 1.5 x 1.5 m

=== COORDINATE SYSTEM ===
- Origin (0, 0) is at the TOP-LEFT corner of the plot
- X increases to the right (east)
- Y increases downward (south)
- All values in metres

=== OUTPUT JSON SCHEMA ===
{
  "walls": [
    { "x1": <number>, "y1": <number>, "x2": <number>, "y2": <number>, "thickness": <0.15|0.225> }
  ],
  "doors": [
    { "x": <number>, "y": <number>, "width": <number>, "angle": <0|90|180|270>, "subtype": <"single"|"double"|"sliding"> }
  ],
  "windows": [
    { "x": <number>, "y": <number>, "width": <number>, "angle": <0|90|180|270>, "subtype": <"single"|"double"|"louvre"|"casement"> }
  ],
  "rooms": [
    { "name": <string>, "points": [{"x":<number>,"y":<number>},...], "area": <number> }
  ],
  "furniture": [
    { "x": <number>, "y": <number>, "w": <number>, "h": <number>, "label": <string>, "subtype": <string> }
  ],
  "plotWidth": <number>,
  "plotDepth": <number>
}

Notes:
- "rooms[].points" must be an array of at least 3 {x,y} objects forming a closed polygon (do NOT repeat the first point at the end)
- "rooms[].area" is in square metres (pre-calculated)
- "doors[].angle" / "windows[].angle": 0 = horizontal wall (top/bottom), 90 = vertical wall (right side), 180 = bottom, 270 = left
- furniture subtypes: sofa, bed, dining-table, chair, wardrobe, tv-unit, desk, kitchen-counter, toilet, bathtub, sink
- Include all external walls of the building footprint
- Include room-dividing internal walls
- Respect setbacks — building must not touch plot boundary`;

  const OPTIMIZE_SYSTEM_PROMPT = `You are an expert African residential architect specialising in tropical climate design.
Analyse the provided floor plan data and give practical layout optimisation suggestions.

Consider the following priorities in your suggestions:
1. TRAFFIC FLOW — minimise cross-circulation; bedrooms should not be accessed through living areas
2. CROSS-VENTILATION — critical in tropical climates; rooms should have openings on at least two sides where possible; align windows/doors to prevailing winds
3. BEDROOM PRIVACY — master bedroom furthest from entrance; children's rooms separate from guest rooms
4. KITCHEN PROXIMITY — kitchen should be adjacent to or directly accessible from dining room
5. NATURAL LIGHT — living areas and kitchens benefit from east/south-facing windows; avoid west sun in bedrooms
6. SERVICE AREAS — BQ, utility, store at rear; security post at front
7. ACCESSIBILITY — 1.2 m minimum corridors; consider future wheelchair access
8. AFRICAN CONTEXT — compound privacy, veranda/balcony for outdoor living, generator/tank room placement

Respond in clear, numbered paragraphs. Reference specific rooms by name.
Be concise but actionable — give specific relocations or adjustments, not generic advice.`;

  const PHOTO_PLAN_SYSTEM_PROMPT = `You are an expert architectural drafter.
The user has provided an image of a hand-drawn or printed floor plan sketch.
Interpret the sketch and convert it to a precise JSON floor plan object.

Follow the same coordinate system and JSON schema as described:
- Origin (0,0) at top-left
- All measurements in metres
- Estimate dimensions from proportions in the sketch; if scale is unknown, assume a typical Nigerian residential bungalow (18.3 x 36.6 m plot)
- Identify rooms by labels in the sketch; if unlabelled, infer from shape and context
- External walls: 0.225 m thick; internal walls: 0.15 m thick

RESPOND WITH ONLY A VALID JSON OBJECT matching this schema:
{
  "walls": [{"x1":0,"y1":0,"x2":10,"y2":0,"thickness":0.225}],
  "doors": [{"x":5,"y":0,"width":0.9,"angle":0,"subtype":"single"}],
  "windows": [{"x":3,"y":0,"width":1.2,"angle":0,"subtype":"double"}],
  "rooms": [{"name":"Parlour","points":[{"x":0,"y":0},{"x":5,"y":0},{"x":5,"y":4},{"x":0,"y":4}],"area":20}],
  "furniture": [],
  "plotWidth": 18.3,
  "plotDepth": 36.6
}`;

  // ─────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────

  /**
   * POST to AI endpoint.
   * @param {Array<{role:string,content:string}>} messages
   * @returns {Promise<string>} reply text
   */
  async function _callAI(messages) {
    const response = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: TOOL_NAME, messages }),
    });

    if (!response.ok) {
      let errMsg = `AI request failed (${response.status})`;
      try {
        const errBody = await response.json();
        if (errBody && errBody.error) errMsg = errBody.error;
      } catch (_) { /* ignore parse errors */ }
      throw new Error(errMsg);
    }

    const data = await response.json();
    if (!data || typeof data.reply !== 'string') {
      throw new Error('Invalid response from AI advisor: missing "reply" field.');
    }
    return data.reply;
  }

  /**
   * Strips markdown code fences and parses JSON from an AI response string.
   * @param {string} text
   * @returns {Object} parsed floor plan object
   */
  function _parseFloorPlanJSON(text) {
    if (!text || typeof text !== 'string') {
      throw new Error('AI returned an empty response.');
    }

    let cleaned = text.trim();

    // Strip ```json ... ``` or ``` ... ```
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fenceMatch) {
      cleaned = fenceMatch[1].trim();
    }

    // Find the first { and last } to isolate JSON object
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      throw new Error('AI response did not contain a valid JSON object.');
    }
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`Failed to parse AI floor plan JSON: ${e.message}`);
    }

    // Basic schema validation
    const required = ['walls', 'doors', 'windows', 'rooms', 'plotWidth', 'plotDepth'];
    for (const key of required) {
      if (!(key in parsed)) {
        throw new Error(`AI floor plan JSON is missing required field: "${key}"`);
      }
    }
    if (!Array.isArray(parsed.walls)) throw new Error('"walls" must be an array.');
    if (!Array.isArray(parsed.rooms)) throw new Error('"rooms" must be an array.');

    // Ensure furniture array exists
    if (!Array.isArray(parsed.furniture)) parsed.furniture = [];

    return parsed;
  }

  /**
   * Generates a human-readable text summary of the current plan for AI context.
   * @param {Object} planData
   * @returns {string}
   */
  function _planSummary(planData) {
    if (!planData || typeof planData !== 'object') {
      return 'No floor plan data available.';
    }

    const lines = [];

    if (typeof planData.plotWidth === 'number' && typeof planData.plotDepth === 'number') {
      lines.push(`Plot size: ${planData.plotWidth} m wide x ${planData.plotDepth} m deep (${(planData.plotWidth * planData.plotDepth).toFixed(1)} m²)`);
    }

    const rooms = Array.isArray(planData.rooms) ? planData.rooms : [];
    if (rooms.length > 0) {
      lines.push(`Rooms (${rooms.length} total):`);
      rooms.forEach((r) => {
        const area = typeof r.area === 'number' ? ` — ${r.area.toFixed(1)} m²` : '';
        lines.push(`  - ${r.name || 'Unnamed'}${area}`);
      });
    } else {
      lines.push('Rooms: none defined yet.');
    }

    const walls = Array.isArray(planData.walls) ? planData.walls : [];
    lines.push(`Walls: ${walls.length}`);

    const doors = Array.isArray(planData.doors) ? planData.doors : [];
    lines.push(`Doors: ${doors.length}`);

    const windows = Array.isArray(planData.windows) ? planData.windows : [];
    lines.push(`Windows: ${windows.length}`);

    const furniture = Array.isArray(planData.furniture) ? planData.furniture : [];
    if (furniture.length > 0) {
      lines.push(`Furniture items: ${furniture.length}`);
    }

    return lines.join('\n');
  }

  /**
   * Shows a simple loading overlay inside a target element, or a global one.
   * Returns a function to remove the indicator.
   * @param {string} [message]
   * @returns {{ remove: Function }}
   */
  function _showLoading(message) {
    const msg = message || 'AI is thinking…';
    let overlay = null;

    try {
      overlay = document.createElement('div');
      overlay.id = 'fp-ai-loading-overlay';
      overlay.setAttribute('role', 'status');
      overlay.setAttribute('aria-live', 'polite');
      overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'background:rgba(0,0,0,0.45)',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'z-index:99999',
        'font-family:sans-serif',
      ].join(';');

      const box = document.createElement('div');
      box.style.cssText = [
        'background:#1a1a2e',
        'color:#e2b96f',
        'border:1px solid #e2b96f',
        'border-radius:10px',
        'padding:28px 40px',
        'text-align:center',
        'max-width:320px',
      ].join(';');

      const spinner = document.createElement('div');
      spinner.style.cssText = [
        'width:36px',
        'height:36px',
        'border:3px solid rgba(226,185,111,0.25)',
        'border-top-color:#e2b96f',
        'border-radius:50%',
        'animation:fp-ai-spin 0.8s linear infinite',
        'margin:0 auto 14px',
      ].join(';');

      // Inject keyframes once
      if (!document.getElementById('fp-ai-spin-style')) {
        const style = document.createElement('style');
        style.id = 'fp-ai-spin-style';
        style.textContent = '@keyframes fp-ai-spin{to{transform:rotate(360deg)}}';
        document.head.appendChild(style);
      }

      const label = document.createElement('p');
      label.style.cssText = 'margin:0;font-size:14px;line-height:1.5';
      label.textContent = msg;

      box.appendChild(spinner);
      box.appendChild(label);
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    } catch (_) {
      // Non-browser environment — ignore
      overlay = null;
    }

    return {
      remove() {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      },
    };
  }

  // ─────────────────────────────────────────────
  // Chat history
  // ─────────────────────────────────────────────
  let _chatHistory = [];

  // ─────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────

  const FPAi = {
    /**
     * Generate a floor plan JSON object from a plain-text description.
     * @param {string} description — user's natural language description
     * @returns {Promise<Object>} floor plan object
     */
    async generateFloorPlan(description) {
      if (!description || !description.trim()) {
        throw new Error('Please provide a description for the floor plan.');
      }

      const loading = _showLoading('Generating your floor plan…');

      try {
        const messages = [
          { role: 'system', content: FLOOR_PLAN_SYSTEM_PROMPT },
          { role: 'user', content: description.trim() },
        ];

        const reply = await _callAI(messages);
        const planData = _parseFloorPlanJSON(reply);
        return planData;
      } finally {
        loading.remove();
      }
    },

    /**
     * Analyse the current floor plan and return optimisation suggestions as text.
     * @param {Object} planData — current floor plan object
     * @returns {Promise<string>} suggestions text
     */
    async optimizeLayout(planData) {
      const loading = _showLoading('Analysing your layout…');

      try {
        const summary = _planSummary(planData);
        const planJson = JSON.stringify(planData, null, 2);

        const userContent = [
          'Please analyse the following floor plan and provide layout optimisation suggestions.',
          '',
          '=== PLAN SUMMARY ===',
          summary,
          '',
          '=== FULL PLAN DATA ===',
          planJson,
        ].join('\n');

        const messages = [
          { role: 'system', content: OPTIMIZE_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ];

        const reply = await _callAI(messages);
        return reply;
      } finally {
        loading.remove();
      }
    },

    /**
     * Send a chat message with optional floor plan context.
     * Maintains conversation history internally.
     * @param {string} message — user's message
     * @param {Object|null} [planData] — current plan for context
     * @returns {Promise<string>} AI reply text
     */
    async chat(message, planData) {
      if (!message || !message.trim()) {
        throw new Error('Message cannot be empty.');
      }

      const loading = _showLoading('');

      try {
        // Build system context
        const planContext = planData
          ? `\n\nCurrent floor plan context:\n${_planSummary(planData)}`
          : '';

        const systemContent = [
          'You are AfroPlan AI, an expert African residential architect and building advisor.',
          'Help the user design, refine, and understand their floor plan.',
          'Be concise, practical, and culturally aware of African housing conventions.',
          'Reference Nigerian, Kenyan, South African, and broader African standards where relevant.',
          'If the user asks to modify the plan, describe the changes clearly.',
          planContext,
        ].join('\n');

        // Append user message to history
        _chatHistory.push({ role: 'user', content: message.trim() });

        const messages = [
          { role: 'system', content: systemContent },
          ..._chatHistory,
        ];

        const reply = await _callAI(messages);

        // Append assistant reply to history
        _chatHistory.push({ role: 'assistant', content: reply });

        return reply;
      } finally {
        loading.remove();
      }
    },

    /**
     * Clear the chat conversation history.
     */
    clearChat() {
      _chatHistory = [];
    },

    /**
     * (Stretch) Interpret a sketch image and return a floor plan JSON object.
     * @param {string} imageDataUrl — base64 data URL (e.g. "data:image/png;base64,...")
     * @returns {Promise<Object>} floor plan object
     */
    async photoToPlan(imageDataUrl) {
      if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
        throw new Error('Invalid image data URL.');
      }

      const loading = _showLoading('Interpreting your sketch…');

      try {
        const userContent = [
          'Please interpret this floor plan sketch and convert it to the required JSON format.',
          'Image (base64):',
          imageDataUrl,
        ].join('\n');

        const messages = [
          { role: 'system', content: PHOTO_PLAN_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ];

        const reply = await _callAI(messages);
        const planData = _parseFloorPlanJSON(reply);
        return planData;
      } finally {
        loading.remove();
      }
    },

    // Expose helpers for testing / extension
    _callAI,
    _parseFloorPlanJSON,
    _planSummary,
  };

  // ─────────────────────────────────────────────
  // Export
  // ─────────────────────────────────────────────
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = FPAi;
  } else {
    global.FPAi = FPAi;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);
