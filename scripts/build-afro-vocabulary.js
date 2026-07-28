#!/usr/bin/env node
/*
 * Afro 1.3 — give every tool the words users actually type.
 *
 * THE PROBLEM
 *
 * Only 94 of 1,252 tools (8%) carry hand-authored vocabulary. The other 92%
 * are findable only by the words already in their own title and description,
 * which are written in institutional register. Measured on the 52-case holdout,
 * the right tool is retrieved for 90% of prompts but picked first for 65% —
 * ranking, not retrieval, is the ceiling, and the losses look like this:
 *
 *   "what is 500 dollars in Kenyan shillings today"
 *     -> seed-rate-ke   fit  0.66
 *        currency-converter  fit -0.05   <-- the obvious answer, scored NEGATIVE
 *
 * currency-converter contains neither "dollars" nor "shillings". It was reached
 * only through synonym expansion of the query, and expansion-only matches carry
 * a -0.45 precision penalty by design — that penalty exists so expansion widens
 * the pool without winning the ranking. So the correct tool was punished for not
 * containing the user's words.
 *
 * THE FIX, AND WHY IT IS THE SAME DATA FROM THE OTHER SIDE
 *
 * The synonym groups already encode "users say X where the manifest says Y".
 * Used on the QUERY they trigger the precision penalty. Used on the TOOL they
 * do not: the tool now literally contains the user's word, so the match is a
 * real one and scores as such. Nothing about the scoring rules changes.
 *
 * This is mechanical and auditable — no invented vocabulary. A term is only
 * added to a tool when that tool's own text already contains a sibling term
 * from the same group, so the tool has effectively opted in.
 *
 * Generated output; edit data/ai/afro-synonyms.json, not the emitted pack.
 */
const fs = require("fs");
const path = require("path");
const { writeFileSyncWithRetry } = require("./lib/safe-write");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "data", "ai", "afro-vocabulary.json");

/*
 * The first version of this was measured and REJECTED. Enriching every tool
 * that shared any synonym term dropped holdout accuracy 65% -> 62% and, worse,
 * cut retrieval@8 from 90% to 85%: added noise pushed correct tools out of the
 * candidate set entirely. rent-affordability had gained "loan", "borrow" and
 * "lend"; currency-converter had gained "apr", "fee", "levy" and "cost".
 *
 * The failure was indiscriminate breadth, so both gates are now about rarity:
 *  - a term is only ADDED if it is distinctive across the corpus (low document
 *    frequency). Generic words like "cost", "fee", "plan" or "price" carry
 *    almost no ranking signal and appear in hundreds of tools, so they can only
 *    dilute.
 *  - a tool only OPTS IN through a distinctive term of its own. Sharing the
 *    word "cost" must not enrol a tool in the entire lending vocabulary.
 */
const MAX_TERMS_PER_TOOL = 4;
const MIN_TERM_LENGTH = 4;
// A term appearing in more than this share of tools is too common to help.
const MAX_DOC_FREQUENCY = 0.02;

/*
 * Synonym groups describe two different things, and only one of them belongs on
 * a tool.
 *
 * TOPIC groups say what a tool is about — {pension, gratuity, provident} or
 * {dollar, birr, dirham}. Those make a tool findable by the words users type.
 *
 * SHAPE groups say what form the QUESTION takes — {versus, which is better,
 * cheapest, against} or {how much, what does it cost}. They are valuable for
 * expanding a query and actively harmful on a tool, because every tool that
 * gains them matches every question of that shape. Measured: hotel-star-guide
 * absorbed the comparison group and then won "cheapest flight from lagos to
 * nairobi" and "hotel or apartment, which one cheaper" — two tools' worth of
 * queries, on words that say nothing about hotels.
 *
 * A group is treated as shape if any of these operators appear in it.
 */
const SHAPE_OPERATORS = [
  "versus", "vs", "against", "which is better", "better than", "compare", "comparison",
  "cheapest", "cheaper", "best", "worth it", "how much", "how many", "what does it cost",
  "should i", "difference between", "or"
];

function isShapeGroup(terms) {
  return terms.some((term) => SHAPE_OPERATORS.indexOf(term) !== -1);
}

function norm(value) {
  return String(value == null ? "" : value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Does `haystack` contain `term` as a whole word (or phrase)? */
function containsTerm(haystack, term) {
  return (" " + haystack + " ").indexOf(" " + term + " ") !== -1;
}

function main() {
  const directory = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "tool-directory.json"), "utf8"));
  const synonyms = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "ai", "afro-synonyms.json"), "utf8"));
  const allGroups = (synonyms.groups || []).map((group) => (group.terms || []).map(norm).filter(Boolean));
  // Shape groups expand queries well and poison tools; keep them out of the pack.
  const groups = allGroups.filter((terms) => !isShapeGroup(terms));
  const droppedShape = allGroups.length - groups.length;

  // Corpus text per tool, used both for the opt-in test and to measure how
  // common each candidate term already is.
  const texts = directory.map((tool) =>
    norm([tool.name, tool.description, tool.id.replace(/-/g, " "), (tool.aliases || []).join(" ")].join(" ")));

  const everyTerm = new Set();
  groups.forEach((terms) => terms.forEach((term) => {
    if (term.length >= MIN_TERM_LENGTH) everyTerm.add(term);
  }));

  const docFrequency = {};
  everyTerm.forEach((term) => {
    let hits = 0;
    for (let i = 0; i < texts.length; i += 1) if (containsTerm(texts[i], term)) hits += 1;
    docFrequency[term] = hits / texts.length;
  });
  const distinctive = (term) => docFrequency[term] !== undefined && docFrequency[term] <= MAX_DOC_FREQUENCY;

  const pack = {};
  let toolsTouched = 0;
  let termsAdded = 0;

  directory.forEach((tool, index) => {
    const own = texts[index];
    const existing = new Set((tool.aliases || []).map(norm));
    const additions = [];

    groups.forEach((terms) => {
      // Opt-in must be earned by a DISTINCTIVE shared term, not a generic one.
      const speaks = terms.some((term) =>
        term.length >= MIN_TERM_LENGTH && distinctive(term) && containsTerm(own, term));
      if (!speaks) return;
      terms.forEach((term) => {
        if (term.length < MIN_TERM_LENGTH || !distinctive(term)) return;
        if (containsTerm(own, term) || existing.has(term)) return;
        if (additions.indexOf(term) !== -1) return;
        additions.push(term);
      });
    });

    if (!additions.length) return;
    // Rarest first — the most discriminating words earn the few available slots.
    additions.sort((a, b) => docFrequency[a] - docFrequency[b] || a.localeCompare(b));
    const kept = additions.slice(0, MAX_TERMS_PER_TOOL);
    pack[tool.id] = kept;
    toolsTouched += 1;
    termsAdded += kept.length;
  });

  const payload = {
    name: "afro-vocabulary",
    version: "afro-1.3",
    generatedFrom: "data/ai/afro-synonyms.json + data/tool-directory.json",
    rule: "a term is added to a tool only when that tool's own text already contains a sibling term from the same synonym group",
    maxTermsPerTool: MAX_TERMS_PER_TOOL,
    tools: pack
  };
  writeFileSyncWithRetry(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");

  const total = directory.length;
  console.log("Wrote data/ai/afro-vocabulary.json");
  console.log("  synonym groups used: " + groups.length + " (" + droppedShape + " question-shape groups excluded)");
  console.log("  tools enriched: " + toolsTouched + " of " + total + " (" + Math.round(toolsTouched / total * 100) + "%)");
  console.log("  terms added:    " + termsAdded + " (avg " + (termsAdded / (toolsTouched || 1)).toFixed(1) + " per enriched tool)");
}

main();
