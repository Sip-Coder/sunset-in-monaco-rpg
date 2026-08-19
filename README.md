# Devereux 64 — Harbor Night

N64-style first-person spy shooter. Static HTML/CSS/JS — no backend.

Sunset, Monaco Harbor. Infiltrate Adrienne Devereux’s black-and-gold yacht and neutralize Marcus Vale. Original mission with chunky 64-bit presentation (homage, not a licensed clone).

## Play

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Open [http://localhost:8080](http://localhost:8080). Click the view to lock the mouse.

| Control | Action |
| --- | --- |
| WASD | Move |
| Mouse | Look |
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

```bash
node test-contract.js
```
