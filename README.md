# Death at the Devereux Gala

Point-and-click murder mystery. Static HTML/CSS/JS — no backend.

Simone Vale is found dead in the coat cabin of Adrienne Devereux's black-and-gold yacht, moored in Monaco Harbor at sunset. Inspect five hotspots, then accuse one of four suspects before the night closes.

## Play

A local static server is the working preview while we build:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Then visit [http://localhost:8080](http://localhost:8080). Refresh after HTML/CSS edits — there is no build step.

## Files

| File | Owner | Role |
| --- | --- | --- |
| `data.js` | Partner A | Suspects, clues, endings. Single source of truth. |
| `game.js` | Partner A | State machine, timer, `checkEnding`. |
| `index.html` | Partner B | Screens, scene structure, dossier chrome. |
| `style.css` | Partner B | Noir visuals and hotspot styling. |

## Data contract

Do not duplicate suspect/clue objects. Both partners read `data.js`.

- `clues` — array of collected clue IDs (runtime, in `game.js`)
- `checkEnding(accusedSuspect, clues)` → `"correct"` | `"wrong"` | `"timeout"`
- Clue hotspot IDs: `champagne-flute`, `torn-dress`, `phone`, `love-letter`, `timeline-note`
- Suspect IDs: `julian-cross`, `adrienne-devereux`, `marcus-vale`, `lila-chen`
- Killer: `marcus-vale` (`KILLER_ID`)

Linear loop: click all five hotspots → accusation screen → one of three endings (correct / wrong name / no accusation).

Playtest the contract without a browser:

```bash
node test-contract.js
```
