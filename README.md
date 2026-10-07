# WordTrio

A static daily word-puzzle site built with HTML, CSS and JavaScript.

## Modes

| Mode | Rules |
|---|---|
| Word | Guess a five-letter answer in six tries. |
| Groups | Sort 16 words into four hidden groups. Four mistakes allowed. |
| Pyramid | Arrange seven words in a compound-word tree. Tap or drag to swap; orange marks move linked groups. |
| Circuit | Arrange nine words in a ring. The last two letters of each word must match the first two of the next. Tap two words to swap them, then press Check loop. |

## Links

- `#wordle`
- `#conn`
- `#pyra`
- `#circuit`

## Run locally

Open `index.html`, or run `python3 -m http.server` in the folder.

## Test

Run `node test.js`. The suite covers the four live modes, Pyramid group movement, Circuit validation, deterministic daily selection, dates, streaks and share text.

## Daily puzzles

`Core.dayIndex()` counts local calendar days since 2026-01-01. Every player receives the same puzzle for a given local day. Puzzle content lives in `data.js`.

## Storage

Progress is stored in browser local storage. It survives closing the browser on the same device and browser. Clearing site data removes it. There is no cross-device sync.

## PWA files

Keep `manifest.webmanifest`, `sw.js` and the icon files beside `index.html` for Add to Home Screen support.

## Known limits

The starter content repeats after four Circuit puzzles and six Connections or Pyramid puzzles. Add more curated content in `data.js` before public launch.
