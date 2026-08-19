/**
 * Devereux 64 — mission data (shared contract)
 * Original spy-FPS set on the Devereux yacht. N64-era feel, original fiction.
 */

const MISSION = {
  id: "harbor-night",
  title: "Harbor Night",
  kicker: "Background",
  copy: "Board at the aft ramp. Sweep galley, cabins, ballroom, starboard hall, and bow. Neutralize Marcus Vale.",
  primary: "Neutralize Marcus Vale",
  secondary: "Clear every deck of hostiles",
};

/** Painted art from Partner A's branch — paths only, no duplicated pixels. */
const ART = {
  sceneImage: "assets/scene-coatroom.jpg",
  backdropImage: "assets/backdrop-ballroom.jpg",
};

const PORTRAITS = {
  julian: "assets/portraits/julian-cross.jpg",
  adrienne: "assets/portraits/adrienne-devereux.jpg",
  lila: "assets/portraits/lila-chen.jpg",
  marcus: "assets/portraits/marcus-vale.jpg",
};

const WEAPON = {
  id: "ppk-64",
  name: "PPK-64",
  magSize: 12,
  reserve: 96,
  damage: 34,
  fireCooldown: 0.26,
  reloadTime: 1.05,
  range: 20,
};

const PLAYER_START = { x: 3.5, y: 14.5, dir: 0 };

const TILE = {
  0: { solid: false, name: "deck" },
  1: { solid: true, name: "hull", color: [18, 18, 18] },
  2: { solid: true, name: "gold", color: [212, 175, 55] },
  3: { solid: true, name: "cabin", color: [72, 28, 36] },
  4: { solid: true, name: "crate", color: [48, 40, 32] },
  5: { solid: true, name: "water", color: [0, 18, 51] },
};

function fillRect(m, x0, y0, x1, y1, t) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (m[y] && m[y][x] !== undefined) m[y][x] = t;
    }
  }
}

function door(m, x, y) {
  if (m[y] && m[y][x] !== undefined) m[y][x] = 0;
}

function makeYachtMap() {
  const w = 44;
  const h = 30;
  const m = [];
  for (let y = 0; y < h; y++) {
    m[y] = [];
    for (let x = 0; x < w; x++) m[y][x] = 5;
  }
  fillRect(m, 1, 1, w - 2, h - 2, 1);
  fillRect(m, 2, 2, w - 3, h - 3, 0);

  fillRect(m, 12, 2, 13, 10, 1);
  door(m, 12, 6);
  door(m, 13, 6);
  door(m, 12, 9);
  door(m, 13, 9);

  fillRect(m, 22, 2, 23, 9, 1);
  door(m, 22, 5);
  door(m, 23, 5);

  fillRect(m, 29, 2, 29, 10, 1);
  door(m, 29, 7);
  fillRect(m, 35, 2, 35, 10, 1);
  door(m, 35, 7);

  fillRect(m, 2, 11, 41, 11, 1);
  door(m, 4, 11);
  door(m, 5, 11);
  door(m, 18, 11);
  door(m, 19, 11);
  door(m, 32, 11);
  door(m, 33, 11);

  fillRect(m, 2, 19, 41, 19, 1);
  door(m, 8, 19);
  door(m, 9, 19);
  door(m, 24, 19);
  door(m, 25, 19);
  door(m, 36, 19);
  door(m, 37, 19);

  fillRect(m, 16, 3, 18, 4, 3);
  fillRect(m, 24, 3, 26, 4, 3);
  fillRect(m, 31, 4, 33, 5, 3);
  fillRect(m, 37, 3, 39, 4, 3);
  fillRect(m, 6, 21, 8, 22, 3);
  fillRect(m, 20, 22, 22, 23, 3);

  m[8][17] = 2;
  m[8][20] = 2;
  m[14][16] = 2;
  m[14][24] = 2;
  m[16][30] = 2;
  m[22][28] = 2;

  m[4][5] = 4;
  m[4][6] = 4;
  m[9][8] = 4;
  m[14][7] = 4;
  m[15][8] = 4;
  m[13][26] = 4;
  m[9][32] = 4;
  m[22][18] = 4;
  m[22][19] = 4;
  m[24][34] = 4;

  return m;
}

const MAP = makeYachtMap();

function g(id, x, y, face, kind, hp) {
  const k = kind || "guard";
  return {
    id: id,
    x: x,
    y: y,
    hp: hp || (k === "elite" ? 110 : k === "target" ? 160 : 70),
    kind: k,
    portrait: PORTRAITS[face],
  };
}

function collectFloor(x0, y0, x1, y1) {
  const spots = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (MAP[y] && MAP[y][x] === 0) spots.push({ x: x + 0.5, y: y + 0.5 });
    }
  }
  return spots;
}

function takeSpawns(spots, count, skipNearStart) {
  const picked = [];
  if (!spots.length) return picked;
  const step = Math.max(1, Math.floor(spots.length / count));
  for (let i = 0; i < spots.length && picked.length < count; i += step) {
    const s = spots[i];
    if (skipNearStart && Math.hypot(s.x - PLAYER_START.x, s.y - PLAYER_START.y) < 4) continue;
    picked.push(s);
  }
  return picked;
}

const FACE = ["julian", "adrienne", "lila"];

function roster() {
  const rooms = [
    { name: "aft", box: [2, 12, 11, 18], n: 5 },
    { name: "galley", box: [2, 2, 11, 10], n: 4 },
    { name: "salon", box: [14, 2, 21, 10], n: 4 },
    { name: "cabins", box: [24, 2, 41, 10], n: 6 },
    { name: "ballroom", box: [14, 12, 28, 18], n: 6 },
    { name: "starboard", box: [30, 12, 41, 18], n: 5 },
    { name: "bow", box: [2, 20, 34, 26], n: 7 },
  ];
  const list = [];
  let n = 0;
  rooms.forEach(function (room) {
    const spots = takeSpawns(collectFloor(room.box[0], room.box[1], room.box[2], room.box[3]), room.n, true);
    spots.forEach(function (s, i) {
      n += 1;
      const elite = i === spots.length - 1 && room.n >= 5;
      list.push(g(room.name + "-" + n, s.x, s.y, FACE[n % 3], elite ? "elite" : "guard"));
    });
  });
  const bow = collectFloor(35, 20, 41, 26);
  const vale = bow[bow.length - 1] || { x: 38.5, y: 24.5 };
  list.push(g("marcus-vale", vale.x, vale.y, "marcus", "target", 160));
  return list;
}

const ENEMY_TEMPLATES = roster();

const PROPS = [
  { x: 6.4, y: 13.5, kind: "lantern" },
  { x: 8.5, y: 16.5, kind: "flute" },
  { x: 10.5, y: 14.5, kind: "plant" },
  { x: 7.5, y: 4.5, kind: "crate-deco" },
  { x: 15.5, y: 6.5, kind: "lantern" },
  { x: 19.5, y: 8.5, kind: "flute" },
  { x: 17.5, y: 14.5, kind: "ring" },
  { x: 21.5, y: 16.5, kind: "lantern" },
  { x: 26.5, y: 6.5, kind: "plant" },
  { x: 32.5, y: 8.5, kind: "flute" },
  { x: 38.5, y: 6.5, kind: "lantern" },
  { x: 33.5, y: 14.5, kind: "crate-deco" },
  { x: 38.5, y: 16.5, kind: "ring" },
  { x: 10.5, y: 22.5, kind: "lantern" },
  { x: 16.5, y: 24.5, kind: "flute" },
  { x: 27.5, y: 22.5, kind: "plant" },
  { x: 34.5, y: 24.5, kind: "lantern" },
  { x: 38.5, y: 22.5, kind: "flute" },
].filter(function (p) {
  return MAP[p.y | 0] && MAP[p.y | 0][p.x | 0] === 0;
});

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
