#!/usr/bin/env node
const fs = require("fs");
const vm = require("vm");
const assert = require("assert");

const context = { console };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(__dirname + "/data.js", "utf8") +
    "\n;this.__export = { MAP, TILE, WEAPON, MISSION, ENEMY_TEMPLATES, PLAYER_START, ENDINGS, isSolid, checkMission, cloneEnemies };",
  context
);

const {
  MAP,
  TILE,
  WEAPON,
  MISSION,
  ENEMY_TEMPLATES,
  PLAYER_START,
  ENDINGS,
  isSolid,
  checkMission,
  cloneEnemies,
} = context.__export;

assert.ok(MAP.length >= 10, "map rows");
assert.ok(MAP[0].length >= 10, "map cols");
assert.strictEqual(TILE[0].solid, false);
assert.ok(TILE[1].solid);
assert.ok(!isSolid(PLAYER_START.x | 0, PLAYER_START.y | 0), "spawn walkable");
assert.ok(WEAPON.magSize >= 1);
assert.ok(WEAPON.damage > 0);
assert.ok(MISSION.primary.includes("Marcus Vale"));

const target = ENEMY_TEMPLATES.find((e) => e.kind === "target");
assert.ok(target && target.id === "marcus-vale");
assert.ok(ENEMY_TEMPLATES.filter((e) => e.kind === "guard").length >= 3);

assert.strictEqual(checkMission({ targetDown: true, playerDead: false }), "complete");
assert.strictEqual(checkMission({ targetDown: false, playerDead: true }), "failed");
assert.strictEqual(checkMission({ targetDown: false, playerDead: false }), "active");
assert.ok(ENDINGS.complete && ENDINGS.failed);

const clones = cloneEnemies();
assert.strictEqual(clones.length, ENEMY_TEMPLATES.length);
assert.ok(clones[0].alive);

const html = fs.readFileSync(__dirname + "/index.html", "utf8");
assert.ok(html.includes('id="view"'));
assert.ok(html.includes("data.js"));
assert.ok(html.includes("game.js"));

const gameSrc = fs.readFileSync(__dirname + "/game.js", "utf8");
assert.ok(gameSrc.includes("checkMission("));
assert.ok(gameSrc.includes("window.GAME_CONTRACT"));

console.log("contract ok");
console.log("  mission:", MISSION.id);
console.log("  weapon:", WEAPON.name);
console.log("  hostiles:", ENEMY_TEMPLATES.length);
