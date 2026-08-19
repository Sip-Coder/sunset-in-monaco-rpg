#!/usr/bin/env node
/**
 * Contract tests for checkEnding(accusedSuspect, clues).
 * Loads data.js, then reimplements the resolver identically to game.js
 * so the IDs and branching rules can be verified without a browser.
 */
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const context = { console };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(__dirname + "/data.js", "utf8") +
    "\n;this.__export = { CLUES, ENDINGS, KILLER_ID, SUSPECTS, getClue, getSuspect, checkEnding };",
  context
);

const { CLUES, ENDINGS, KILLER_ID, SUSPECTS, getClue, getSuspect, checkEnding } =
  context.__export;

const allClues = CLUES.map((c) => c.id);
const others = SUSPECTS.filter((s) => s.id !== KILLER_ID).map((s) => s.id);

assert.strictEqual(CLUES.length, 5, "five clues");
assert.strictEqual(SUSPECTS.length, 4, "four suspects");
assert.strictEqual(KILLER_ID, "marcus-vale");
assert.ok(getSuspect(KILLER_ID).isKiller);
assert.ok(getClue("champagne-flute") && !getClue("champagne-flute").isRedHerring);
assert.ok(getClue("timeline-note") && !getClue("timeline-note").isRedHerring);
assert.ok(getClue("torn-dress").isRedHerring);
assert.ok(getClue("phone").isRedHerring);
assert.ok(getClue("love-letter").isRedHerring);

assert.strictEqual(checkEnding("marcus-vale", allClues), "correct");
assert.strictEqual(checkEnding(null, allClues), "timeout");
assert.strictEqual(checkEnding(undefined, []), "timeout");
assert.strictEqual(checkEnding("marcus-vale", ["champagne-flute"]), "timeout");

for (const id of others) {
  assert.strictEqual(checkEnding(id, allClues), "wrong", id);
}

assert.strictEqual(typeof checkEnding, "function", "checkEnding lives in data.js");
const gameSrc = fs.readFileSync(__dirname + "/game.js", "utf8");
assert.ok(gameSrc.includes("checkEnding("), "game.js calls checkEnding");
assert.ok(gameSrc.includes("window.GAME_CONTRACT"), "contract exposed for playtest");

const html = fs.readFileSync(__dirname + "/index.html", "utf8");
assert.ok(html.includes('id="hotspots"'));
assert.ok(html.includes("data.js"));
assert.ok(html.includes("game.js"));

console.log("contract ok");
console.log("  killer:", KILLER_ID);
console.log("  clues:", allClues.join(", "));
console.log("  endings: correct / wrong / timeout");
