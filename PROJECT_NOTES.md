# WordTrio project notes
Live site: https://sillywongs.github.io/wordtrio/  (GitHub Pages, repo sillywongs/wordtrio, branch main, root)

## Files
index.html  UI for all three games, tabs, stats dialog, share, hash routing, PWA tags, service worker registration, Pyramid drag/tap input
core.js     Pure logic: scoring, seeded shuffle, date/streak maths, Pyramid link checks, marks, groups and moves, share text
data.js     Word list (153), 6 Connections puzzles, 6 Pyramid puzzles (each with 'extra' valid compounds)
test.js     37 node tests: `node test.js`
smoke.js    Fake-DOM run of the Pyramid screen (marks, drag, tap): `node smoke.js`
manifest.webmanifest, sw.js, icon-*.png, apple-touch-icon.png   PWA files, uploaded separately (cache name wordtrio-v1)

## Rules and decisions
- Daily puzzle = list[dayIndex % length], dayIndex = local days since 2026-01-01.
- Progress is in localStorage (wt:wordle, wt:conn, wt:pyra, *:stats). No backend.
- Pyramid links are directional: upper + lower = one compound. Edges [0,1],[0,2],[1,3],[1,4],[2,5],[2,6]. Tests require exactly 8 solutions per puzzle (mirror variants only).
- Pyramid greens/reds are stored as word pairs ("UPPER|LOWER") in P.known and stay while the same two words stay linked. 4 guesses. Repeat layouts do not cost a guess.
- Pyramid marks (orange) are word pairs in P.marks, so they survive swaps elsewhere. Marked words form a group. Moving a group (drag or tap-tap) can move it between levels; the dragged word determines the destination and the best available placement preserves the most downward links. A lone word swaps with whatever it lands on. Orange dashed = marked but known wrong.
- Drag uses pointer events on the SVG with a tap fallback (moved < 8px counts as a tap). Dragging a leaf of a group must land on a spot where that leaf fits the shape.
- Wordle accepts any 5 letters (STRICT = false). Connections: 4 mistakes, one-away hint.
- Share text ends with the site link plus #<game>.

## Open items
- Drag and drop is tested through a fake DOM only. Needs a real phone check.
- Only 6 Connections and 6 Pyramid puzzles (repeat every 6 days). Needs more content.
- No full Wordle dictionary. No cross-device sync. Capacitor/Play Store not started.

## Changelog
2026-10-07  v1 three games, tests
2026-10-07  PWA add-on
2026-10-07  Share link, hash routing, Pyramid rewrite (directional, extras, persistent greens)
2026-10-07  Pyramid: persistent orange marks, marked groups move together, drag and drop with tap fallback, 31 tests


## New modes
- Circuit: arrange eight words in a closed ring. The final two letters of each word must equal the first two letters of the next. Five checks; all links show green when correct.

2026-10-07 Circuit redesigned as neutral two-column swap tiles. Feedback is saved only after Check loop. Circuit payloads replaced with validated cycles. Pyramid clears marks and feedback for saved solved games.
