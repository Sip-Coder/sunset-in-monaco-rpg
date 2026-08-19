/**
 * Death at the Devereux Gala — game logic (Partner A)
 * ---------------------------------------------------
 * State machine: title → briefing → investigate → accuse → ending
 *
 * DATA CONTRACT (shared with Partner B via data.js)
 *   clues = []                          // collected clue IDs
 *   checkEnding(accusedSuspect, clues)  // → "correct" | "wrong" | "timeout"
 *
 * Hotspots are rendered from CLUES[].id / CLUES[].hotspot so HTML/CSS never
 * duplicate the clue objects.
 */

/* ------------------------------------------------------------------ */
/* Runtime state                                                       */
/* ------------------------------------------------------------------ */

/** @type {string[]} collected clue IDs — the contract array */
let clues = [];

/** @type {"title"|"briefing"|"investigate"|"accuse"|"ending"} */
let currentScreen = "title";

let remainingSeconds = GAME.investigationSeconds;
let timerId = null;
let modalOpen = false;
let lastFocused = null;

/* checkEnding(accusedSuspect, clues) lives in data.js — do not duplicate. */

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", boot);

function boot() {
  document.getElementById("game-title").textContent = GAME.title;
  document.getElementById("game-tagline").textContent = GAME.tagline;
  document.getElementById("briefing-time").textContent = GAME.time;
  document.getElementById("briefing-headline").textContent = BRIEFING.headline;
  document.getElementById("briefing-copy").innerHTML = BRIEFING.paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");

  renderBriefingSuspects();
  renderHotspots();
  renderDossier();
  bindControls();
  showScreen("title");
}

function bindControls() {
  document.getElementById("btn-enter").addEventListener("click", () => showScreen("briefing"));
  document.getElementById("btn-begin").addEventListener("click", startInvestigation);
  document.getElementById("btn-accuse").addEventListener("click", goToAccusation);
  document.getElementById("btn-close-modal").addEventListener("click", closeModal);
  document.getElementById("btn-restart").addEventListener("click", restart);
  document.getElementById("clue-modal").addEventListener("click", (e) => {
    if (e.target.id === "clue-modal") closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOpen) closeModal();
  });
}

/* ------------------------------------------------------------------ */
/* Screens                                                             */
/* ------------------------------------------------------------------ */

function showScreen(name) {
  currentScreen = name;
  document.querySelectorAll(".screen").forEach((el) => {
    const active = el.dataset.screen === name;
    el.classList.toggle("is-active", active);
    el.hidden = !active;
  });
}

function startInvestigation() {
  clues = [];
  remainingSeconds = GAME.investigationSeconds;
  renderDossier();
  updateProgress();
  showScreen("investigate");
  startTimer("investigate");
}

function goToAccusation() {
  if (clues.length < CLUES.length) return;
  closeModal();
  remainingSeconds = GAME.accusationSeconds;
  renderAccusation();
  showScreen("accuse");
  startTimer("accuse");
}

function restart() {
  stopTimer();
  clues = [];
  remainingSeconds = GAME.investigationSeconds;
  modalOpen = false;
  document.getElementById("clue-modal").hidden = true;
  document.getElementById("ending-card").dataset.ending = "";
  renderHotspots();
  renderDossier();
  updateProgress();
  showScreen("title");
  document.getElementById("btn-enter").focus();
}

/* ------------------------------------------------------------------ */
/* Investigation                                                       */
/* ------------------------------------------------------------------ */

function renderHotspots() {
  const mount = document.getElementById("hotspots");
  mount.innerHTML = "";
  CLUES.forEach((clue) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hotspot";
    btn.id = `hotspot-${clue.id}`;
    btn.dataset.clueId = clue.id;
    btn.style.left = clue.hotspot.left;
    btn.style.top = clue.hotspot.top;
    btn.setAttribute("aria-label", `Inspect ${clue.name}. ${clue.sceneHint}`);
    btn.innerHTML = `<span class="hotspot-ring"></span><span class="hotspot-label">${escapeHtml(
      clue.shortLabel
    )}</span>`;
    btn.addEventListener("click", () => inspectClue(clue.id));
    mount.appendChild(btn);
  });
}

function inspectClue(id) {
  const clue = getClue(id);
  if (!clue) return;
  collectClue(id);
  lastFocused = document.getElementById(`hotspot-${id}`);
  document.getElementById("modal-kicker").textContent = clue.isRedHerring
    ? "Evidence — handle with doubt"
    : "Evidence — it names a method";
  document.getElementById("modal-title").textContent = clue.title;
  document.getElementById("modal-inspection").textContent = clue.inspection;
  document.getElementById("modal-analysis").textContent = clue.analysis;
  document.getElementById("clue-modal").hidden = false;
  modalOpen = true;
  document.getElementById("btn-close-modal").focus();
  renderDossier();
  updateProgress();
}

function collectClue(id) {
  if (!clues.includes(id)) {
    clues.push(id);
  }
  const hotspot = document.getElementById(`hotspot-${id}`);
  if (hotspot) hotspot.classList.add("is-found");
}

function closeModal() {
  document.getElementById("clue-modal").hidden = true;
  modalOpen = false;
  if (lastFocused) lastFocused.focus();
}

function updateProgress() {
  const n = clues.length;
  const total = CLUES.length;
  document.getElementById("hud-progress").textContent = `${n} / ${total} clues`;
  const accuseBtn = document.getElementById("btn-accuse");
  const ready = n >= total;
  accuseBtn.disabled = !ready;
  accuseBtn.textContent = ready ? "Confront the suspects" : `Find ${total - n} more`;
}

/* ------------------------------------------------------------------ */
/* Dossier                                                             */
/* ------------------------------------------------------------------ */

function portraitTag(suspect, extraClass) {
  const cls = ["portrait"].concat(extraClass ? [extraClass] : []).join(" ");
  if (suspect.portrait) {
    return `<span class="${cls}" style="--accent:${suspect.accent}"><img src="${escapeHtml(
      suspect.portrait
    )}" alt="${escapeHtml(suspect.name)}" loading="lazy" /></span>`;
  }
  return `<span class="${cls}" style="--accent:${suspect.accent}">${escapeHtml(
    suspect.initials
  )}</span>`;
}

function renderDossier() {
  document.getElementById("dossier-victim").textContent = `${VICTIM.name} — ${VICTIM.role}`;

  const list = document.getElementById("clue-list");
  list.innerHTML = "";
  CLUES.forEach((clue) => {
    const li = document.createElement("li");
    const found = clues.includes(clue.id);
    li.className = found ? "is-found" : "is-locked";
    li.innerHTML = found
      ? `<strong>${escapeHtml(clue.name)}</strong><span>${escapeHtml(clue.analysis)}</span>`
      : `<strong>— — —</strong><span>Not yet examined</span>`;
    list.appendChild(li);
  });

  const suspects = document.getElementById("suspect-list");
  suspects.innerHTML = "";
  SUSPECTS.forEach((s) => {
    const li = document.createElement("li");
    li.innerHTML = `${portraitTag(s)}<div><strong>${escapeHtml(
      s.name
    )}</strong><em>${escapeHtml(s.role)} · ${escapeHtml(s.motive)}</em></div>`;
    suspects.appendChild(li);
  });
}

function renderBriefingSuspects() {
  const row = document.getElementById("briefing-suspects");
  row.innerHTML = "";
  SUSPECTS.forEach((s) => {
    const card = document.createElement("div");
    card.className = "mini-suspect";
    card.innerHTML = `${portraitTag(s)}<strong>${escapeHtml(s.name)}</strong><span>${escapeHtml(
      s.role
    )}</span>`;
    row.appendChild(card);
  });
}

/* ------------------------------------------------------------------ */
/* Accusation                                                          */
/* ------------------------------------------------------------------ */

function renderAccusation() {
  const grid = document.getElementById("accuse-grid");
  grid.innerHTML = "";
  SUSPECTS.forEach((s) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "suspect-card";
    btn.dataset.suspectId = s.id;
    btn.style.setProperty("--accent", s.accent);
    btn.innerHTML = `
      ${portraitTag(s, "lg")}
      <h3>${escapeHtml(s.name)}</h3>
      <p class="role">${escapeHtml(s.role)} — ${escapeHtml(s.motive)}</p>
      <p class="dossier-text">${escapeHtml(s.dossier)}</p>
      <p class="alibi">${escapeHtml(s.alibi)}</p>
      <span class="accuse-cta">Accuse ${escapeHtml(s.name.split(" ")[0])}</span>
    `;
    btn.addEventListener("click", () => makeAccusation(s.id));
    grid.appendChild(btn);
  });
}

function makeAccusation(suspectId) {
  stopTimer();
  const endingId = checkEnding(suspectId, clues);
  showEnding(endingId, suspectId);
}

/* ------------------------------------------------------------------ */
/* Timer                                                               */
/* ------------------------------------------------------------------ */

function startTimer(phase) {
  stopTimer();
  tickClock(phase);
  timerId = window.setInterval(() => {
    remainingSeconds -= 1;
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      tickClock(phase);
      onTimeout();
      return;
    }
    tickClock(phase);
  }, 1000);
}

function tickClock(phase) {
  const text = formatTime(remainingSeconds);
  if (phase === "investigate") {
    const el = document.getElementById("timer-display");
    el.textContent = text;
    el.classList.toggle("is-urgent", remainingSeconds <= 30);
  } else if (phase === "accuse") {
    const el = document.getElementById("accuse-timer-display");
    el.textContent = text;
    el.classList.toggle("is-urgent", remainingSeconds <= 10);
  }
}

function stopTimer() {
  if (timerId) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

function onTimeout() {
  stopTimer();
  closeModal();
  const endingId = checkEnding(null, clues);
  showEnding(endingId, null);
}

function formatTime(total) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Endings                                                             */
/* ------------------------------------------------------------------ */

function showEnding(endingId, accusedSuspect) {
  stopTimer();
  showScreen("ending");
  const ending = ENDINGS[endingId] || ENDINGS.timeout;
  const card = document.getElementById("ending-card");
  card.dataset.ending = ending.id;
  document.getElementById("ending-kicker").textContent = ending.kicker;
  document.getElementById("ending-title").textContent = ending.title;

  const extras = [];
  if (ending.id === "wrong" && accusedSuspect) {
    const named = getSuspect(accusedSuspect);
    if (named) {
      extras.push(`You named ${named.name}.`);
    }
    const specific = WRONG_ENDING_BY_SUSPECT[accusedSuspect];
    if (specific) extras.push(specific);
  }

  const paragraphs = extras.concat(ending.body);
  document.getElementById("ending-body").innerHTML = paragraphs
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join("");

  const label = document.getElementById("ending-id-label");
  label.hidden = false;
  label.textContent = `Ending ID: ${ending.id}`;
  document.getElementById("btn-restart").focus();
}

/* ------------------------------------------------------------------ */
/* Utils                                                               */
/* ------------------------------------------------------------------ */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Expose contract on window for playtesting / partner handoff */
window.GAME_CONTRACT = {
  get clues() {
    return clues;
  },
  checkEnding,
  KILLER_ID,
  CLUES,
  SUSPECTS,
  ENDINGS,
};
