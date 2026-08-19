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
  pitch: 0,
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
  bullets: [],
  zbuf: new Float32Array(W),
  last: 0,
  ended: false,
  time: 0,
};

const TEX = 64;
const textures = {};
const frame = ctx.createImageData(W, H);

function hash(n) {
  n = Math.imul(n ^ 61, 0x27d4eb2d);
  n = (n ^ (n >>> 15)) >>> 0;
  return n / 4294967296;
}

function setTex(id, fn) {
  const data = new Uint8ClampedArray(TEX * TEX * 4);
  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const c = fn(x, y);
      const i = (y * TEX + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  }
  textures[id] = data;
}

const artPixels = {};

function loadImage(src) {
  return new Promise(function (resolve) {
    const img = new Image();
    img.onload = function () {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g.drawImage(img, 0, 0);
      artPixels[src] = {
        w: img.width,
        h: img.height,
        data: g.getImageData(0, 0, img.width, img.height).data,
        img: img,
      };
      resolve(img);
    };
    img.onerror = function () {
      resolve(null);
    };
    img.src = src;
  });
}

function sampleArt(src, u01, v01) {
  const p = artPixels[src];
  if (!p) return null;
  const x = ((((u01 % 1) + 1) % 1) * (p.w - 1)) | 0;
  const y = Math.max(0, Math.min(p.h - 1, v01 * (p.h - 1))) | 0;
  const i = (y * p.w + x) * 4;
  return [p.data[i], p.data[i + 1], p.data[i + 2]];
}

function loadArt() {
  const paths = [ART.sceneImage, ART.backdropImage].concat(
    ENEMY_TEMPLATES.map(function (e) {
      return e.portrait;
    })
  );
  const unique = [];
  for (let i = 0; i < paths.length; i++) {
    if (paths[i] && unique.indexOf(paths[i]) === -1) unique.push(paths[i]);
  }
  return Promise.all(unique.map(loadImage));
}

function sampleTex(id, u, v) {
  const x = ((u % TEX) + TEX) % TEX | 0;
  const y = ((v % TEX) + TEX) % TEX | 0;
  const d = textures[id];
  const i = (y * TEX + x) * 4;
  return [d[i], d[i + 1], d[i + 2]];
}

function buildTextures() {
  setTex(1, function (x, y) {
    const panel = (x / 12) | 0;
    let r = 16 + (panel % 2) * 10 + hash(x + y * 90) * 8;
    let g = 16 + (panel % 2) * 8 + hash(y * 7) * 6;
    let b = 18 + hash(x * 3) * 6;
    if (x % 12 === 0) {
      r = 8;
      g = 8;
      b = 10;
    }
    if (y > 6 && y < 11) {
      r = 38;
      g = 32;
      b = 28;
    }
    if (y > 42 && y < 47) {
      r = 212;
      g = 175;
      b = 55;
    }
    if (y > 47 && y < 49) {
      r = 120;
      g = 90;
      b = 30;
    }
    if (x % 6 === 2 && y % 8 === 3) {
      r = g = b = 90;
    }
    return [r, g, b];
  });
  setTex(2, function (x, y) {
    const grain = Math.sin(x * 0.7 + y * 0.15) * 18;
    let r = 200 + grain + hash(x * y) * 20;
    let g = 160 + grain * 0.7;
    let b = 40 + hash(y) * 20;
    if (y % 16 < 2) {
      r = 255;
      g = 230;
      b = 140;
    }
    if (x % 8 === 0) {
      r *= 0.75;
      g *= 0.75;
    }
    return [r, g, b];
  });
  setTex(3, function (x, y) {
    let r = 92 + Math.sin(x * 0.4) * 12;
    let g = 32 + Math.sin(y * 0.2) * 8;
    let b = 38;
    if (y < 14) {
      r = 28;
      g = 18;
      b = 22;
    }
    if (y > 18 && y < 50 && x > 10 && x < 54) {
      const tuft = ((x / 8) | 0) + ((y / 8) | 0);
      r = 90 + (tuft % 2) * 20;
      g = 18;
      b = 32;
      if (x % 8 === 0 || y % 8 === 0) {
        r = 50;
        g = 10;
        b = 18;
      }
    }
    if (y > 52) {
      r = 180;
      g = 140;
      b = 70;
    }
    return [r, g, b];
  });
  setTex(4, function (x, y) {
    const plank = (y / 8) | 0;
    let r = 110 + (plank % 2) * 20 + hash(x + plank) * 18;
    let g = 72 + hash(y) * 12;
    let b = 36;
    if (y % 8 === 0 || x === 0 || x === 63) {
      r = 50;
      g = 30;
      b = 16;
    }
    if (x > 20 && x < 44 && y > 20 && y < 28) {
      r = 200;
      g = 170;
      b = 90;
    }
    return [r, g, b];
  });
  setTex(5, function (x, y) {
    const wave = Math.sin(x * 0.4 + y * 0.2) * 20;
    return [4, 22 + wave * 0.3, 70 + wave];
  });
  setTex("floor", function (x, y) {
    const plank = (x / 6) | 0;
    let r = 86 + (plank % 3) * 14 + hash(y + plank * 9) * 16;
    let g = 54 + hash(x) * 10;
    let b = 28;
    if (x % 6 === 0) {
      r = 42;
      g = 28;
      b = 16;
    }
    if (y % 32 === 4) {
      r = 160;
      g = 120;
      b = 60;
    }
    return [r, g, b];
  });
  setTex("sky", function (x, y) {
    const t = y / TEX;
    let r = 43 + t * 200;
    let g = 16 + t * 90;
    let b = 85 - t * 40;
    if (t > 0.55) {
      r = 242;
      g = 153 - (t - 0.55) * 80;
      b = 74;
    }
    if (Math.hypot(x - 48, y - 38) < 7) {
      r = 255;
      g = 230;
      b = 160;
    }
    if (y > 50) {
      const sil = hash((x / 3) | 0) > 0.45 && y > 50 + hash(x) * 8;
      if (sil) {
        r = 8;
        g = 8;
        b = 14;
      }
    }
    return [r, g, b];
  });
}

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
  document.documentElement.style.setProperty("--backdrop", "url('" + ART.backdropImage + "')");
  buildTextures();
  loadArt().then(function () {
    requestAnimationFrame(loop);
  });
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
  state.pitch = 0;
  state.hp = 100;
  state.armor = 40;
  state.mag = WEAPON.magSize;
  state.reserve = WEAPON.reserve;
  state.fireCd = 0;
  state.reload = 0;
  state.enemies = cloneEnemies();
  state.bullets = [];
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
  if (
    e.code === "ArrowUp" ||
    e.code === "ArrowDown" ||
    e.code === "ArrowLeft" ||
    e.code === "ArrowRight"
  ) {
    e.preventDefault();
  }
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
  state.pitch = Math.max(-0.45, Math.min(0.45, state.pitch - e.movementY * 0.002));
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
  spawnBullet(state.px, state.py, state.dir, true, WEAPON.damage);
}

function spawnBullet(x, y, ang, friendly, dmg) {
  const spd = friendly ? 34 : 12;
  state.bullets.push({
    x: x + Math.cos(ang) * 0.35,
    y: y + Math.sin(ang) * 0.35,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    life: friendly ? 0.5 : 0.85,
    friendly: friendly,
    dmg: dmg,
    hit: false,
  });
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
  state.time += dt;
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

  if (state.keys.ArrowLeft) state.dir -= 2.1 * dt;
  if (state.keys.ArrowRight) state.dir += 2.1 * dt;
  if (state.keys.ArrowUp) {
    state.pitch = Math.min(0.45, state.pitch + 1.6 * dt);
  }
  if (state.keys.ArrowDown) {
    state.pitch = Math.max(-0.45, state.pitch - 1.6 * dt);
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
    if (e.phase == null) {
      e.phase = Math.random() * 12;
      e.pose = "idle";
      e.dodgeT = 0;
      e.shootT = 0;
      e.dodgeDir = 1;
    }
    e.cooldown = Math.max(0, e.cooldown - dt);
    e.hurt = Math.max(0, e.hurt - dt);
    e.dodgeT = Math.max(0, e.dodgeT - dt);
    e.shootT = Math.max(0, e.shootT - dt);
    const dist = Math.hypot(e.x - state.px, e.y - state.py);
    if (dist > 16) {
      e.pose = "idle";
      continue;
    }
    const ang = Math.atan2(state.py - e.y, state.px - e.x);
    let da = ang - state.dir;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    const spotted = dist < 12 && hasLos(e.x, e.y, state.px, state.py);
    const aimedAt = spotted && Math.abs(da) < 0.16;
    if (aimedAt && e.dodgeT <= 0) {
      e.dodgeT = 0.42;
      e.dodgeDir = da >= 0 ? 1 : -1;
      e.pose = "dodge";
    }
    if (e.dodgeT > 0 && spotted) {
      e.pose = "dodge";
      e.phase += dt * 14;
      const side = ang + (Math.PI / 2) * e.dodgeDir;
      tryMoveEntity(e, e.x + Math.cos(side) * 5.2 * dt, e.y + Math.sin(side) * 5.2 * dt);
    } else if (spotted && dist > 2.1) {
      e.pose = "walk";
      e.phase += dt * 9;
      const sp = (e.kind === "elite" ? 1.7 : 1.35) * dt;
      tryMoveEntity(e, e.x + Math.cos(ang) * sp, e.y + Math.sin(ang) * sp);
    } else if (spotted) {
      e.pose = e.shootT > 0 ? "shoot" : "aim";
      e.phase += dt * 4;
      if (e.cooldown <= 0) {
        e.cooldown = e.kind === "target" ? 0.7 : 0.95;
        e.shootT = 0.16;
        e.pose = "shoot";
        spawnBullet(e.x, e.y, ang, false, e.kind === "target" ? 14 : 8);
        blip(420, 0.05);
      }
    } else {
      e.pose = "idle";
      e.phase += dt * 2;
    }
  }

  updateBullets(dt);

  const targetAlive = state.enemies.some(function (e) {
    return e.kind === "target" && e.alive;
  });
  const status = checkMission({
    targetDown: !targetAlive,
    playerDead: state.hp <= 0,
  });
  if (status !== "active") endMission(status);
}

function updateBullets(dt) {
  const next = [];
  for (let i = 0; i < state.bullets.length; i++) {
    const b = state.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || isSolid(b.x | 0, b.y | 0)) continue;
    if (b.friendly && !b.hit) {
      for (let j = 0; j < state.enemies.length; j++) {
        const e = state.enemies[j];
        if (!e.alive) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) < 0.42) {
          e.hp -= b.dmg;
          e.hurt = 0.12;
          b.hit = true;
          if (e.hp <= 0) {
            e.alive = false;
            blip(140, 0.1);
          }
          break;
        }
      }
    } else if (!b.friendly && !b.hit) {
      if (Math.hypot(state.px - b.x, state.py - b.y) < 0.38) {
        playerHurt(b.dmg);
        b.hit = true;
      }
    }
    if (!b.hit || b.life > 0.04) next.push(b);
  }
  state.bullets = next;
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

function putPx(x, y, r, g, b, shade) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 4;
  const s = shade == null ? 1 : shade;
  const d = frame.data;
  d[i] = r * s;
  d[i + 1] = g * s;
  d[i + 2] = b * s;
  d[i + 3] = 255;
}

function draw() {
  const data = frame.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i + 3] = 255;
  }

  const horizon = Math.max(1, Math.min(H - 1, ((H / 2) + state.pitch * H) | 0));
  const dirX = Math.cos(state.dir);
  const dirY = Math.sin(state.dir);
  const planeX = Math.cos(state.dir + Math.PI / 2) * 0.72;
  const planeY = Math.sin(state.dir + Math.PI / 2) * 0.72;

  for (let y = 0; y < H; y++) {
    if (y < horizon) {
      const v = (y / horizon) * (TEX - 1);
      for (let x = 0; x < W; x++) {
        const u = ((x / W) * TEX + state.dir * 8 + 64) % TEX;
        const painted = sampleArt(ART.backdropImage, x / W + state.dir * 0.05, y / horizon);
        const c = painted || sampleTex("sky", u, v);
        putPx(x, y, c[0], c[1], c[2], 1);
      }
    } else {
      const p = y - horizon;
      const rowDist = H / (2 * p);
      const stepX = (rowDist * planeX * 2) / W;
      const stepY = (rowDist * planeY * 2) / W;
      let floorX = state.px + rowDist * (dirX - planeX);
      let floorY = state.py + rowDist * (dirY - planeY);
      const fog = Math.max(0.22, 1 - rowDist / 14);
      for (let x = 0; x < W; x++) {
        const c = sampleTex("floor", floorX * TEX, floorY * TEX);
        putPx(x, y, c[0], c[1], c[2], fog);
        floorX += stepX;
        floorY += stepY;
      }
    }
  }

  for (let x = 0; x < W; x++) {
    const cam = (2 * x) / W - 1;
    const rdx = dirX + planeX * cam;
    const rdy = dirY + planeY * cam;
    const hit = cast(state.px, state.py, rdx, rdy);
    state.zbuf[x] = hit.dist;
    const lineH = Math.min(H * 3, (H / hit.dist) | 0);
    const y0 = (horizon - lineH / 2) | 0;
    const shade = Math.max(0.16, 1 - hit.dist / 15) * (hit.side ? 0.62 : 1);
    let texU = (hit.wallX * TEX) | 0;
    if ((hit.side === 0 && rdx > 0) || (hit.side === 1 && rdy < 0)) {
      texU = TEX - texU - 1;
    }
    const texId = hit.tile === 5 ? 5 : hit.tile;
    for (let y = 0; y < lineH; y++) {
      const yy = y0 + y;
      if (yy < 0 || yy >= H) continue;
      let c = null;
      if (hit.tile !== 5 && hit.tile !== 2) {
        c = sampleArt(ART.sceneImage, hit.wallX, y / lineH);
      }
      if (!c) {
        let tv = ((y / lineH) * TEX) | 0;
        if (hit.tile === 5) tv = (tv + ((state.time * 12) | 0)) % TEX;
        c = sampleTex(texId, texU, tv);
      }
      putPx(x, yy, c[0], c[1], c[2], shade);
    }
  }

  const sprites = [];
  for (let i = 0; i < state.enemies.length; i++) {
    if (state.enemies[i].alive) sprites.push(state.enemies[i]);
  }
  for (let i = 0; i < PROPS.length; i++) sprites.push(PROPS[i]);
  sprites.sort(function (a, b) {
    const da = Math.hypot(a.x - state.px, a.y - state.py);
    const db = Math.hypot(b.x - state.px, b.y - state.py);
    return db - da;
  });
  for (let i = 0; i < sprites.length; i++) {
    const dist = Math.hypot(sprites[i].x - state.px, sprites[i].y - state.py);
    if (dist > 18) continue;
    const kind = sprites[i].kind;
    if (kind === "guard" || kind === "elite" || kind === "target") continue;
    drawProp(sprites[i]);
  }

  ctx.putImageData(frame, 0, 0);
  ctx.imageSmoothingEnabled = true;
  for (let i = 0; i < sprites.length; i++) {
    const dist = Math.hypot(sprites[i].x - state.px, sprites[i].y - state.py);
    if (dist > 18) continue;
    const kind = sprites[i].kind;
    if (kind === "guard" || kind === "elite" || kind === "target") {
      drawRig(sprites[i]);
    }
  }
  drawWorldBullets();
  drawGun();
}

function projectSprite(x, y) {
  const spriteX = x - state.px;
  const spriteY = y - state.py;
  const dirX = Math.cos(state.dir);
  const dirY = Math.sin(state.dir);
  const planeX = Math.cos(state.dir + Math.PI / 2) * 0.72;
  const planeY = Math.sin(state.dir + Math.PI / 2) * 0.72;
  const invDet = 1 / (planeX * dirY - dirX * planeY);
  const tx = invDet * (dirY * spriteX - dirX * spriteY);
  const ty = invDet * (-planeY * spriteX + planeX * spriteY);
  return { tx: tx, ty: ty };
}

function drawRig(e) {
  const p = projectSprite(e.x, e.y);
  if (p.ty <= 0.12) return;
  const sx = ((W / 2) * (1 + p.tx / p.ty)) | 0;
  const col = Math.max(0, Math.min(W - 1, sx));
  if (p.ty >= state.zbuf[col] + 0.15) return;
  const h = Math.min(H * 2.1, Math.abs(H / p.ty));
  const feetY = H / 2 + h * 0.5 + state.pitch * H;
  const walk = e.pose === "walk" ? Math.sin(e.phase) : e.pose === "dodge" ? Math.sin(e.phase * 1.4) * 0.35 : 0;
  const dodgeLean = e.pose === "dodge" ? 0.42 * (e.dodgeDir || 1) : 0;
  const aim = e.pose === "aim" || e.pose === "shoot";
  const shootKick = e.pose === "shoot" ? 0.35 : 0;
  ctx.save();
  ctx.translate(sx + dodgeLean * h * 0.12, feetY);
  ctx.rotate(dodgeLean * 0.25);
  const sc = h / 150;
  ctx.scale(sc, sc);
  if (e.hurt > 0) ctx.globalAlpha = 0.85;

  const jacket = e.kind === "target" ? "#8a1c28" : "#141418";
  const pant = "#0c0c10";
  const gold = "#d4af37";
  const skin = "#c4a07a";

  function limb(x1, y1, x2, y2, w, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  const hipY = -52;
  const lLeg = walk * 26;
  const rLeg = -walk * 26;
  limb(-8, hipY, -10 + lLeg * 0.15, -28, 9, pant);
  limb(-10 + lLeg * 0.15, -28, -8 + lLeg, 0, 8, pant);
  limb(8, hipY, 10 + rLeg * 0.15, -28, 9, pant);
  limb(10 + rLeg * 0.15, -28, 8 + rLeg, 0, 8, pant);
  ctx.fillStyle = "#07070a";
  ctx.beginPath();
  ctx.ellipse(-8 + lLeg, 2, 8, 3.5, 0, 0, Math.PI * 2);
  ctx.ellipse(8 + rLeg, 2, 8, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = jacket;
  ctx.fillRect(-16, -108, 32, 58);
  ctx.fillStyle = gold;
  ctx.fillRect(-16, -78, 32, 3);
  ctx.fillStyle = e.kind === "target" ? "#efe2c4" : "#ece6dc";
  ctx.fillRect(-4, -108, 8, 36);

  const armSwing = aim ? 0 : -walk * 22;
  const lArmY = -98;
  limb(-15, lArmY, -28, -78 + armSwing * 0.3, 7, jacket);
  limb(-28, -78 + armSwing * 0.3, -30, -58 + armSwing, 6, skin);

  const gunAng = aim ? -1.25 - shootKick : -0.4 + walk * 0.2;
  const ax = 16;
  const ay = -98;
  const hx = ax + Math.cos(gunAng) * 34;
  const hy = ay + Math.sin(gunAng) * 34;
  limb(ax, ay, hx, hy, 7, jacket);
  limb(hx, hy, hx + Math.cos(gunAng) * 16, hy + Math.sin(gunAng) * 16, 5, skin);
  const gx = hx + Math.cos(gunAng) * 22;
  const gy = hy + Math.sin(gunAng) * 22;
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(gunAng);
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, -3, 22, 6);
  ctx.fillStyle = gold;
  ctx.fillRect(2, -4, 8, 2);
  if (e.pose === "shoot") {
    ctx.fillStyle = "#fff4c2";
    ctx.beginPath();
    ctx.arc(26, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2994a";
    ctx.beginPath();
    ctx.arc(30, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const headImg = artPixels[e.portrait] && artPixels[e.portrait].img;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, -124, 16, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (headImg) {
    ctx.drawImage(headImg, -18, -142, 36, 36);
  } else {
    ctx.fillStyle = skin;
    ctx.fillRect(-16, -140, 32, 32);
  }
  ctx.restore();
  ctx.strokeStyle = gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -124, 16.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawWorldBullets() {
  for (let i = 0; i < state.bullets.length; i++) {
    const b = state.bullets[i];
    const p = projectSprite(b.x, b.y);
    if (p.ty <= 0.08) continue;
    const sx = ((W / 2) * (1 + p.tx / p.ty)) | 0;
    const col = Math.max(0, Math.min(W - 1, sx));
    if (p.ty >= state.zbuf[col] + 0.2) continue;
    const sy = ((H / 2) + state.pitch * H) | 0;
    const len = Math.max(6, 18 / p.ty);
    const ang = Math.atan2(b.vy, b.vx) - state.dir;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ang);
    const grd = ctx.createLinearGradient(-len, 0, len, 0);
    if (b.friendly) {
      grd.addColorStop(0, "rgba(255,244,180,0)");
      grd.addColorStop(0.5, "#fff7c2");
      grd.addColorStop(1, "#f2994a");
    } else {
      grd.addColorStop(0, "rgba(255,80,80,0)");
      grd.addColorStop(0.5, "#ffd0a0");
      grd.addColorStop(1, "#ff4a3a");
    }
    ctx.fillStyle = grd;
    ctx.fillRect(-len, -1.5, len * 2, 3);
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(len, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPerson(e) {
  drawRig(e);
}

function personPixel(u, v, target, hurt) {
  if (hurt) return [255, 255, 255];
  const jacket = target ? [140, 24, 36] : [18, 18, 22];
  const shirt = target ? [240, 220, 170] : [235, 230, 220];
  if (v > 0.08 && v < 0.28 && u > 0.32 && u < 0.68) {
    if (v < 0.14 && u > 0.42 && u < 0.58) return [28, 20, 18];
    return [210, 170, 130];
  }
  if (v > 0.26 && v < 0.34 && u > 0.36 && u < 0.64) return [12, 12, 14];
  if (v > 0.32 && v < 0.72 && u > 0.22 && u < 0.78) {
    if (u > 0.44 && u < 0.56 && v < 0.55) return shirt;
    if ((u > 0.34 && u < 0.4) || (u > 0.6 && u < 0.66)) return [200, 160, 50];
    return jacket;
  }
  if (v > 0.7 && v < 0.92) {
    if (u > 0.3 && u < 0.48) return [20, 20, 24];
    if (u > 0.52 && u < 0.7) return [20, 20, 24];
  }
  if (v > 0.9 && ((u > 0.3 && u < 0.46) || (u > 0.54 && u < 0.7))) return [8, 8, 10];
  if (v > 0.4 && v < 0.48 && u > 0.78 && u < 0.92) return [40, 40, 44];
  return null;
}

function drawProp(p) {
  const pr = projectSprite(p.x, p.y);
  if (pr.ty <= 0.12) return;
  const sx = ((W / 2) * (1 + pr.tx / pr.ty)) | 0;
  const size = Math.min(H, Math.abs((H * 0.55) / pr.ty)) | 0;
  const x0 = (sx - size / 2) | 0;
  const y0 = ((H - size) / 2 + size * 0.35 + state.pitch * H) | 0;
  for (let x = 0; x < size; x++) {
    const cx = x0 + x;
    if (cx < 0 || cx >= W) continue;
    if (pr.ty >= state.zbuf[cx]) continue;
    const u = x / size;
    for (let y = 0; y < size; y++) {
      const cy = y0 + y;
      if (cy < 0 || cy >= H) continue;
      const v = y / size;
      const col = propPixel(p.kind, u, v);
      if (col) putPx(cx, cy, col[0], col[1], col[2], 1);
    }
  }
}

function propPixel(kind, u, v) {
  if (kind === "lantern") {
    if (v > 0.15 && v < 0.55 && u > 0.3 && u < 0.7) return [255, 210, 90];
    if (v > 0.5 && v < 0.85 && u > 0.38 && u < 0.62) return [40, 30, 20];
    if (v > 0.1 && v < 0.2 && u > 0.25 && u < 0.75) return [180, 140, 50];
    return null;
  }
  if (kind === "flute") {
    if (v > 0.2 && v < 0.7 && u > 0.44 && u < 0.56) return [220, 200, 120];
    if (v > 0.68 && v < 0.78 && u > 0.3 && u < 0.7) return [200, 160, 50];
    if (v > 0.15 && v < 0.28 && u > 0.38 && u < 0.62) return [255, 240, 180];
    return null;
  }
  if (kind === "ring") {
    const d = Math.hypot(u - 0.5, v - 0.5);
    if (d > 0.22 && d < 0.38) return [200, 40, 50];
    if (d > 0.18 && d < 0.22) return [240, 200, 80];
    return null;
  }
  if (kind === "plant") {
    if (v > 0.55 && u > 0.35 && u < 0.65) return [90, 40, 30];
    if (v < 0.6 && Math.abs(u - 0.5) < 0.28 - v * 0.15) return [30, 90, 50];
    return null;
  }
  if (kind === "crate-deco") {
    if (v > 0.35 && v < 0.95 && u > 0.2 && u < 0.8) {
      if (v < 0.45) return [200, 160, 70];
      return [120, 80, 40];
    }
    return null;
  }
  return null;
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
  for (let i = 0; i < 72; i++) {
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
      const safe = Math.max(0.08, dist);
      let wallX = side === 0 ? py + safe * rdy : px + safe * rdx;
      wallX -= Math.floor(wallX);
      return { dist: safe, tile: tile, side: side, wallX: wallX };
    }
  }
  return { dist: 24, tile: 5, side: 0, wallX: 0 };
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
    return e.alive && e.kind !== "target";
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
  ART: ART,
  WEAPON: WEAPON,
  ENEMY_TEMPLATES: ENEMY_TEMPLATES,
  spawnBullet: spawnBullet,
  get state() {
    return state;
  },
};

document.addEventListener("DOMContentLoaded", boot);
