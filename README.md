# Devereux 64 — Harbor Night

N64-style first-person spy shooter. Static HTML/CSS/JS — no backend.

Hostiles are articulated tuxedo rigs (painted portraits as heads) that walk, aim, shoot visible tracers, and dodge when you draw a bead on them.

## Play

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Open [http://localhost:8080](http://localhost:8080) and leave that tab open — the page reloads itself when `index.html`, `game.js`, `data.js`, or `style.css` change.

| Control | Action |
| --- | --- |
| WASD | Move |
| Arrow keys | Look (left/right turn, up/down pitch) |
| Mouse (optional) | Look if the pointer is locked |
| LMB / Space | Fire |
| R | Reload |
| Shift | Run |
| Esc | Pause |

## Files

| File | Role |
| --- | --- |
| `data.js` | Map, weapon, enemies, `checkMission` |
| `game.js` | Raycaster, AI, shooting, HUD |
| `index.html` / `style.css` | Canvas view and N64-style chrome |

## Data contract

- `checkMission({ targetDown, playerDead })` → `"complete"` \| `"failed"` \| `"active"`
- Target id: `marcus-vale`
- Weapon id: `ppk-64`
- Full yacht map (`44×30`) with hostiles in aft, galley, salon, cabins, ballroom, starboard hall, and bow

```bash
node test-contract.js
```
