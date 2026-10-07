# WordTrio

Three daily word puzzles in one static web app. No build step, no server, no dependencies.

| Mode | Style | Rules |
|---|---|---|
| Word | Wordle | Guess a 5-letter word in 6 tries. Green = right spot, yellow = wrong spot, grey = absent. |
| Groups | Connections | Sort 16 words into 4 hidden groups. 4 mistakes allowed. "One away" hint. |
| Pyramid | Pyralinks | Swap words in a 7-node tree so each linked pair forms a compound word. 4 guesses. |

## Run
Open `index.html` in a browser, or serve the folder: `python3 -m http.server`.

## Test
`node test.js` (Node 16+). 18 tests cover scoring, duplicate letters, date and streak maths, scrambling, share text and data integrity.

## How daily puzzles work
`Core.dayIndex()` counts local days since 2026-01-01. Each mode picks `list[dayIndex % list.length]`, so every player sees the same puzzle with no backend. The Wordle answer list is shuffled once with a fixed seed so the order is not alphabetical. Board scrambles use the day index as the RNG seed.

## Add content
Edit `data.js`.
- `CONNECTIONS`: four groups of four unique words, ordered easy to hard (yellow, green, blue, purple).
- `PYRA`: seven words in solved order `[root, L, R, LL, LR, RL, RR]`. Every parent+child pair must be valid. Mirrored subtrees also count as solved.
- `LIST`: 5-letter lowercase words. Set `STRICT = true` in `index.html` and load a full dictionary to reject non-words.

## Ship to mobile
- PWA: add a manifest and service worker, then "Add to Home Screen".
- Native: wrap with Capacitor (`npx cap add android`) and publish through Google Play.
- Streaks and stats live in `localStorage`. Add a backend only for leaderboards or cross-device sync.

## Known limits
The starter lists hold about 6 days of Connections and Pyramid puzzles and roughly 200 Wordle words, so puzzles repeat. Writing new puzzles is the main ongoing work.
