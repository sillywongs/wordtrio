# WordTrio project notes
Live: https://sillywongs.github.io/wordtrio/ . Modes #wordle #conn #pyra #circuit. Version tag wt-9 (core.js VERSION, index.html guard, ?v= on script URLs; bump together).
- Pyramid: 15 words, heap order. Marked links are locked: Core.pyraMove refuses any move that breaks one (group links must still run downward; other groups must survive). Group search enumerates valid placements, then fills the vacated spots, trying other fillings if needed.
- Wordle: Data.VALID (about 3,400 words, built from the textblob lexicon plus hand additions, junk removed) + online fallback (api.dictionaryapi.dev, cached in localStorage 'wt:dict'). Not testable offline in the sandbox, so the browser test mocks it.
- Circuit: 12 words, 9 puzzles, four checks. Puzzles are heavily overlapping (same hub endings: es, ed, er, re). Needs more variety.
- Tests: node test.js (19), python3 browser-test.py (15).
- Open: more Circuit variety; more Pyramid puzzles; the answer list for Word is only 153 words.
