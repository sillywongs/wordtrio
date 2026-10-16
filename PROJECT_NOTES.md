# WordTrio project notes
Live: https://sillywongs.github.io/wordtrio/ . Modes #wordle #conn #pyra #circuit.
- Pyramid: 15 words, heap order, EDGES i -> 2i+1, 2i+2. Six guesses. Orange marks, selection and group state are cleared when the game ends. Old saves with a different word set are discarded. Bottom row drawn in two staggered rows (SVG 340x232).
- Circuit: numbered list; drag and drop swap with a ghost copy and highlighted target, tap-tap fallback. Colours only after Check; a swap clears them. Saves keyed by puzzle id.
- Startup safety: core.js VERSION (wt-8) must match index.html; script URLs carry ?v=wt-8. Bump together.
- Tests: node test.js (14).
- Open: 6 Pyramid and 8 Circuit puzzles only; Wordle has no dictionary.
