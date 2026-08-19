/**
 * Devereux 64 — mission data (shared contract)
 * Original spy-FPS set on the Devereux yacht. N64-era feel, original fiction.
 */

const MISSION = {
  id: "harbor-night",
  title: "Harbor Night",
  kicker: "Background",
  copy: "Infiltrate the afterparty yacht. Neutralize Marcus Vale. Do not fall overboard.",
  primary: "Neutralize Marcus Vale",
  secondary: "Clear the deck guards",
};

/** Painted art from Partner A's branch — paths only, no duplicated pixels. */
const ART = {
  sceneImage: "assets/scene-coatroom.jpg",
  backdropImage: "assets/backdrop-ballroom.jpg",
};

const WEAPON = {
  id: "ppk-64",
  name: "PPK-64",
  magSize: 7,
  reserve: 21,
  damage: 34,
  fireCooldown: 0.28,
  reloadTime: 1.15,
  range: 18,
};

const PLAYER_START = { x: 3.5, y: 12.5, dir: 0 };

/** 0 empty, 1 hull, 2 gold, 3 cabin, 4 crate, 5 water (solid) */
const MAP = [
  [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
  [5, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 5],
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5],
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5],
  [5, 1, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 1, 5],
  [5, 1, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 5],
  [5, 2, 0, 0, 0, 0, 0, 0, 4, 0, 0, 4, 0, 0, 0, 0, 0, 0, 2, 5],
  [5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 5],
  [5, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 5],
  [5, 1, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 1, 5],
  [5, 1, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 3, 3, 0, 0, 0, 1, 5],
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5],
  [5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 5],
  [5, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 5],
  [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
];

const TILE = {
  0: { solid: false, name: "deck" },
  1: { solid: true, name: "hull", color: [18, 18, 18] },
  2: { solid: true, name: "gold", color: [212, 175, 55] },
  3: { solid: true, name: "cabin", color: [72, 28, 36] },
  4: { solid: true, name: "crate", color: [48, 40, 32] },
  5: { solid: true, name: "water", color: [0, 18, 51] },
};

const PROPS = [
  { x: 5.4, y: 6.4, kind: "lantern" },
  { x: 9.5, y: 7.2, kind: "flute" },
  { x: 11.6, y: 5.5, kind: "lantern" },
  { x: 7.2, y: 10.6, kind: "ring" },
  { x: 13.5, y: 10.2, kind: "crate-deco" },
  { x: 4.6, y: 8.8, kind: "plant" },
  { x: 15.2, y: 8.4, kind: "flute" },
  { x: 10.2, y: 11.4, kind: "lantern" },
];

const ENEMY_TEMPLATES = [
  { id: "guard-aft", x: 6.5, y: 7.5, hp: 70, kind: "guard", portrait: "assets/portraits/julian-cross.jpg" },
  { id: "guard-port", x: 8.5, y: 4.5, hp: 70, kind: "guard", portrait: "assets/portraits/adrienne-devereux.jpg" },
  { id: "guard-starboard", x: 12.5, y: 8.5, hp: 70, kind: "guard", portrait: "assets/portraits/lila-chen.jpg" },
  { id: "guard-bow", x: 15.5, y: 6.5, hp: 80, kind: "guard", portrait: "assets/portraits/julian-cross.jpg" },
  { id: "marcus-vale", x: 16.2, y: 11.2, hp: 120, kind: "target", portrait: "assets/portraits/marcus-vale.jpg" },
];

const ENDINGS = {
  complete: {
    id: "complete",
    kicker: "Mission complete",
    title: "Vale is down",
    body: "The yacht goes quiet. Harbor lights smear on black water. Primary objective complete.",
  },
  failed: {
    id: "failed",
    kicker: "Mission failed",
    title: "You are down",
    body: "The deck takes you. The afterparty continues without an inspector.",
  },
};

function isSolid(tx, ty) {
  if (ty < 0 || tx < 0 || ty >= MAP.length || tx >= MAP[0].length) return true;
  return TILE[MAP[ty][tx]].solid;
}

function tileAt(x, y) {
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  if (ty < 0 || tx < 0 || ty >= MAP.length || tx >= MAP[0].length) return 5;
  return MAP[ty][tx];
}

/**
 * @param {{targetDown:boolean, playerDead:boolean}} state
 * @returns {"complete"|"failed"|"active"}
 */
function checkMission(state) {
  if (!state || state.playerDead) return "failed";
  if (state.targetDown) return "complete";
  return "active";
}

function cloneEnemies() {
  return ENEMY_TEMPLATES.map((e) => ({
    ...e,
    alive: true,
    cooldown: 0,
    hurt: 0,
  }));
}
