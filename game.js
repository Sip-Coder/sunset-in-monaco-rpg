/**
 * Devereux 64 — first-person spy shooter (N64-era presentation).
 */

const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d", { alpha: false });
const W = canvas.width;
const H = canvas.height;

const state = {
  screen: "title",
  px: PLAYER_START.x,
  py: PLAYER_START.y,
  dir: PLAYER_START.dir,
  hp: 100,
  armor: 40,
  mag: WEAPON.magSize,
  reserve: WEAPON.reserve,
  fireCd: 0,
  reload: 0,
  bob: 0,
  muzzle: 0,
  keys: Object.create(null),
  enemies: cloneEnemies(),
  zbuf: new Float32Array(W),
  last: 0,
  ended: false,
};

function hideOverlays() {
  document.querySelectorAll(".overlay").forEach((el) => {
    el.hidden = true;
    el.classList.remove("is-active");
  });
}

function showOverlay(id) {
  hideOverlays();
  const el = document.getElementById(id);
  el.hidden = false;
  el.classList.add("is-active");
}

function boot() {
  document.getElementById("brief-title").textContent = MISSION.title;
  document.getElementById("brief-copy").textContent = MISSION.copy;
  document.getElementById("brief-objectives").innerHTML =
    "<li>PRIMARY — " +
    MISSION.primary +
    "</li><li>SECONDARY — " +
    MISSION.secondary +
    "</li>";
  document.getElementById("weapon-name").textContent = WEAPON.name;
  document.getElementById("objective").textContent = "PRIMARY: " + MISSION.primary;

  document.getElementById("btn-brief").addEventListener("click", function () {
    state.screen = "brief";
    showOverlay("screen-brief");
  });
  document.getElementById("btn-start").addEventListener("click", startMission);
  document.getElementById("btn-resume").addEventListener("click", resume);
  document.getElementById("btn-restart").addEventListener("click", function () {
    location.reload();
  });

  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", function (e) {
    state.keys[e.code] = false;
  });
  canvas.addEventListener("click", onCanvasClick);
  window.addEventListener("mousemove", onMouse);

  showOverlay("screen-title");
  requestAnimationFrame(loop);
}

function startMission() {
  resetPlay();
  state.screen = "play";
  hideOverlays();
  canvas.focus();
  canvas.requestPointerLock();
}

function resetPlay() {
  state.px = PLAYER_START.x;
  state.py = PLAYER_START.y;
  state.dir = PLAYER_START.dir;
  state.hp = 100;
  state.armor = 40;
  state.mag = WEAPON.magSize;
  state.reserve = WEAPON.reserve;
  state.fireCd = 0;
  state.reload = 0;
  state.enemies = cloneEnemies();
  state.ended = false;
}

function pause() {
  if (state.screen !== "play") return;
  state.screen = "pause";
  showOverlay("screen-pause");
}

function resume() {
  state.screen = "play";
  hideOverlays();
  canvas.requestPointerLock();
}

function onKey(e) {
  state.keys[e.code] = true;
  if (e.code === "Escape" && state.screen === "play") {
    pause();
  }
  if (e.code === "KeyR" && state.screen === "play") {
    startReload();
  }
  if (e.code === "Space" && state.screen === "play") {
    e.preventDefault();
    fire();
  }
}

function onCanvasClick() {
  if (state.screen !== "play") return;
  if (document.pointerLockElement !== canvas) {
    canvas.requestPointerLock();
  }
  fire();
}

function onMouse(e) {
  if (state.screen !== "play") return;
  if (document.pointerLockElement !== canvas) return;
  state.dir += e.movementX * 0.0024;
}

function startReload() {
  if (state.reload > 0 || state.mag === WEAPON.magSize || state.reserve <= 0) return;
  state.reload = WEAPON.reloadTime;
}

function fire() {
  if (state.screen !== "play" || state.reload > 0 || state.fireCd > 0) return;
  if (state.mag <= 0) {
    startReload();
    return;
  }
  state.mag -= 1;
  state.fireCd = WEAPON.fireCooldown;
  state.muzzle = 0.08;
  blip(880, 0.04);
  const hit = hitscan();
  if (hit) {
    hit.hp -= WEAPON.damage;
    hit.hurt = 0.15;
    if (hit.hp <= 0) {
      hit.alive = false;
      blip(140, 0.1);
    }
  }
}

function hitscan() {
  let best = null;
  let bestD = WEAPON.range;
  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (!e.alive) continue;
    const vx = e.x - state.px;
    const vy = e.y - state.py;
    const dist = Math.hypot(vx, vy);
    if (dist > WEAPON.range) continue;
    let da = Math.atan2(vy, vx) - state.dir;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    if (Math.abs(da) > 0.14) continue;
    if (!hasLos(state.px, state.py, e.x, e.y)) continue;
    if (dist < bestD) {
      bestD = dist;
      best = e;
    }
  }
  return best;
}

function hasLos(ax, ay, bx, by) {
  for (let i = 1; i < 18; i++) {
    const t = i / 18;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    if (isSolid(Math.floor(x), Math.floor(y))) return false;
  }
  return true;
}

function loop(t) {
  const dt = Math.min(0.05, (t - (state.last || t)) / 1000);
  state.last = t;
  if (state.screen === "play") {
    update(dt);
    draw();
    hud();
  }
  requestAnimationFrame(loop);
}

function update(dt) {
  state.fireCd = Math.max(0, state.fireCd - dt);
  state.muzzle = Math.max(0, state.muzzle - dt);
  if (state.reload > 0) {
    state.reload -= dt;
    if (state.reload <= 0) {
      const need = WEAPON.magSize - state.mag;
      const take = Math.min(need, state.reserve);
      state.mag += take;
      state.reserve -= take;
      state.reload = 0;
    }
  }

  let mx = 0;
  let my = 0;
  if (state.keys.KeyW) {
    mx += Math.cos(state.dir);
    my += Math.sin(state.dir);
  }
  if (state.keys.KeyS) {
    mx -= Math.cos(state.dir);
    my -= Math.sin(state.dir);
  }
  if (state.keys.KeyA) {
    mx += Math.cos(state.dir - Math.PI / 2);
    my += Math.sin(state.dir - Math.PI / 2);
  }
  if (state.keys.KeyD) {
    mx += Math.cos(state.dir + Math.PI / 2);
    my += Math.sin(state.dir + Math.PI / 2);
  }
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my);
    const speed = (state.keys.ShiftLeft || state.keys.ShiftRight ? 4.2 : 2.6) * dt;
    tryMove(state.px + (mx / len) * speed, state.py + (my / len) * speed);
    state.bob += dt * 10;
  }

  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (!e.alive) continue;
    e.cooldown = Math.max(0, e.cooldown - dt);
    e.hurt = Math.max(0, e.hurt - dt);
    const dist = Math.hypot(e.x - state.px, e.y - state.py);
    if (dist < 10 && hasLos(e.x, e.y, state.px, state.py)) {
      const ang = Math.atan2(state.py - e.y, state.px - e.x);
      if (dist > 1.4) {
        const sp = 1.35 * dt;
        tryMoveEntity(e, e.x + Math.cos(ang) * sp, e.y + Math.sin(ang) * sp);
      }
      if (dist < 9 && e.cooldown <= 0) {
        e.cooldown = 0.9;
        playerHurt(e.kind === "target" ? 14 : 8);
      }
    }
  }

  const targetAlive = state.enemies.some(function (e) {
    return e.kind === "target" && e.alive;
  });
  const status = checkMission({
    targetDown: !targetAlive,
    playerDead: state.hp <= 0,
  });
  if (status !== "active") endMission(status);
}

function tryMove(nx, ny) {
  if (!isSolid(Math.floor(nx), Math.floor(state.py))) state.px = nx;
  if (!isSolid(Math.floor(state.px), Math.floor(ny))) state.py = ny;
}

function tryMoveEntity(e, nx, ny) {
  if (!isSolid(Math.floor(nx), Math.floor(e.y))) e.x = nx;
  if (!isSolid(Math.floor(e.x), Math.floor(ny))) e.y = ny;
}

function playerHurt(dmg) {
  let rest = dmg;
  const soak = Math.min(state.armor, rest);
  state.armor -= soak;
  rest -= soak;
  state.hp -= rest;
  if (state.hp < 0) state.hp = 0;
}

function endMission(id) {
  if (state.ended) return;
  state.ended = true;
  state.screen = "end";
  if (document.exitPointerLock) document.exitPointerLock();
  const ending = ENDINGS[id];
  document.getElementById("end-kicker").textContent = ending.kicker;
  document.getElementById("end-title").textContent = ending.title;
  document.getElementById("end-body").textContent = ending.body;
  showOverlay("screen-end");
}

function draw() {
  const horizon = (H / 2) | 0;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#2b1055");
  sky.addColorStop(0.45, "#d9534f");
  sky.addColorStop(1, "#f2994a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, horizon);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, horizon, W, H - horizon);

  for (let x = 0; x < W; x += 2) {
    const cam = (2 * x) / W - 1;
    const rayDirX = Math.cos(state.dir) + Math.cos(state.dir + Math.PI / 2) * 0.66 * cam;
    const rayDirY = Math.sin(state.dir) + Math.sin(state.dir + Math.PI / 2) * 0.66 * cam;
    const hit = cast(state.px, state.py, rayDirX, rayDirY);
    state.zbuf[x] = hit.dist;
    if (x + 1 < W) state.zbuf[x + 1] = hit.dist;
    const lineH = Math.min(H * 2, (H / hit.dist) | 0);
    const y0 = ((H - lineH) / 2) | 0;
    const shade = Math.max(0.18, 1 - hit.dist / 16) * (hit.side ? 0.65 : 1);
    const base = TILE[hit.tile].color;
    ctx.fillStyle =
      "rgb(" +
      ((base[0] * shade) | 0) +
      "," +
      ((base[1] * shade) | 0) +
      "," +
      ((base[2] * shade) | 0) +
      ")";
    ctx.fillRect(x, y0, 2, lineH);
    if (hit.tile === 2) {
      ctx.fillStyle = "rgba(240,215,140," + 0.25 * shade + ")";
      ctx.fillRect(x, y0, 2, 3);
    }
  }

  const sprites = state.enemies
    .filter(function (e) {
      return e.alive;
    })
    .map(function (e) {
      return { e: e, dist: Math.hypot(e.x - state.px, e.y - state.py) };
    })
    .sort(function (a, b) {
      return b.dist - a.dist;
    });

  for (let i = 0; i < sprites.length; i++) {
    drawSprite(sprites[i].e);
  }
  drawGun();
}

function cast(px, py, rdx, rdy) {
  let mapX = px | 0;
  let mapY = py | 0;
  const deltaX = Math.abs(1 / rdx);
  const deltaY = Math.abs(1 / rdy);
  const stepX = rdx < 0 ? -1 : 1;
  const stepY = rdy < 0 ? -1 : 1;
  let sideX = rdx < 0 ? (px - mapX) * deltaX : (mapX + 1 - px) * deltaX;
  let sideY = rdy < 0 ? (py - mapY) * deltaY : (mapY + 1 - py) * deltaY;
  let side = 0;
  for (let i = 0; i < 48; i++) {
    if (sideX < sideY) {
      sideX += deltaX;
      mapX += stepX;
      side = 0;
    } else {
      sideY += deltaY;
      mapY += stepY;
      side = 1;
    }
    const tile = tileAt(mapX + 0.01, mapY + 0.01);
    if (TILE[tile].solid) {
      const dist =
        side === 0
          ? (mapX - px + (1 - stepX) / 2) / rdx
          : (mapY - py + (1 - stepY) / 2) / rdy;
      return { dist: Math.max(0.08, dist), tile: tile, side: side };
    }
  }
  return { dist: 24, tile: 5, side: 0 };
}

function drawSprite(e) {
  const spriteX = e.x - state.px;
  const spriteY = e.y - state.py;
  const dirX = Math.cos(state.dir);
  const dirY = Math.sin(state.dir);
  const planeX = Math.cos(state.dir + Math.PI / 2) * 0.66;
  const planeY = Math.sin(state.dir + Math.PI / 2) * 0.66;
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  const tx = invDet * (dirY * spriteX - dirX * spriteY);
  const ty = invDet * (-planeY * spriteX + planeX * spriteY);
  if (ty <= 0.12) return;
  const sx = ((W / 2) * (1 + tx / ty)) | 0;
  const size = Math.min(H * 1.6, Math.abs(H / ty)) | 0;
  const x0 = (sx - size / 2) | 0;
  const y0 = ((H - size) / 2) | 0;
  const col = e.kind === "target" ? [180, 40, 50] : [28, 28, 32];
  for (let x = 0; x < size; x += 2) {
    const cx = x0 + x;
    if (cx < 0 || cx >= W) continue;
    if (ty >= state.zbuf[cx]) continue;
    const u = x / size;
    ctx.fillStyle = e.hurt > 0 ? "#ffffff" : "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")";
    ctx.fillRect(cx, y0 + size * 0.22, 2, size * 0.55);
    ctx.fillStyle = "#d4af37";
    ctx.fillRect(cx, y0 + size * 0.34, 2, 3);
    if (u > 0.3 && u < 0.7) {
      ctx.fillStyle = e.kind === "target" ? "#f0d78c" : "#c4a882";
      ctx.fillRect(cx, y0, 2, size * 0.22);
    }
  }
}

function drawGun() {
  const kick = state.muzzle * 40;
  const bobx = Math.sin(state.bob) * 6;
  const boby = Math.abs(Math.cos(state.bob)) * 4;
  const gx = W * 0.58 + bobx;
  const gy = H * 0.62 + boby + kick;
  ctx.fillStyle = "#111111";
  ctx.fillRect(gx, gy, 54, 70);
  ctx.fillStyle = "#d4af37";
  ctx.fillRect(gx + 6, gy + 8, 42, 6);
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(gx + 22, gy - 28, 10, 36);
  if (state.muzzle > 0) {
    ctx.fillStyle = "#fff3c4";
    ctx.fillRect(gx + 18, gy - 44, 18, 16);
  }
}

function hud() {
  document.getElementById("health-bar").style.width = state.hp + "%";
  document.getElementById("armor-bar").style.width = state.armor + "%";
  document.getElementById("ammo-count").textContent =
    state.reload > 0 ? "RELOAD" : state.mag + " / " + state.reserve;
  const guards = state.enemies.filter(function (e) {
    return e.kind === "guard" && e.alive;
  }).length;
  const targetAlive = state.enemies.some(function (e) {
    return e.kind === "target" && e.alive;
  });
  document.getElementById("objective").textContent = targetAlive
    ? "PRIMARY: " + MISSION.primary + "   ·   GUARDS " + guards
    : "PRIMARY COMPLETE";
}

function blip(freq, dur) {
  try {
    const ac = blip.ac || (blip.ac = new AudioContext());
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.frequency.value = freq;
    o.type = "square";
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + dur);
  } catch (err) {
    /* audio optional */
  }
}

window.GAME_CONTRACT = {
  checkMission: checkMission,
  MISSION: MISSION,
  WEAPON: WEAPON,
  ENEMY_TEMPLATES: ENEMY_TEMPLATES,
  get state() {
    return state;
  },
};

document.addEventListener("DOMContentLoaded", boot);
