# WordTrio

Four daily word puzzles in one static web app: Word, Groups, Pyramid and Circuit. No build step, no server.

Live site: https://sillywongs.github.io/wordtrio/

| Mode | Link | Rules |
|---|---|---|
| Word | `#wordle` | Guess a five-letter word in six tries. |
| Groups | `#conn` | Sort 16 words into four hidden groups. Four mistakes allowed. |
| Pyramid | `#pyra` | Arrange 15 words in a four-layer pyramid (1, 2, 4 and 8 words) so each upper word plus the word below it makes one word. Six guesses. |
| Circuit | `#circuit` | Arrange 8 to 10 words in a ring. Each word's last two letters must equal the next word's first two letters, and the last word must link back to the first. Drag a word onto another to swap them. Nothing is coloured until you press Check loop. Five checks. |

## Pyramid
- 15 words, 4 layers, 14 downward links. FIRE above WORK works (FIREWORK). WORK above FIRE does not.
- Drag a word onto another to swap, or tap one and then the other. Finger drags work on phones.
- Tap a line to mark it orange. Marked words move together as a group, to any layer.
- After a guess, correct links turn green and stay green while those two words stay together.
- Solving it, or running out of guesses, clears every orange mark.
- Every puzzle has exactly one tree, so only mirror images of the same layout count as correct.

## Circuit
- Press and drag a word, drop it on another word, and the two swap. A copy follows your finger and the target lights up. Tapping one word then another also works.
- Any ring that satisfies the rule wins, not only the stored one.

## Files
`index.html`, `core.js` and `data.js` must come from the same version. If they differ, WordTrio says so in red on screen. `test.js` runs the logic tests (`node test.js`).

## Add content
- Pyramid: add an entry to `PYRA` in `data.js`: 15 words in heap order (top, its two children, the next four, the bottom eight). Node i's children are 2i+1 and 2i+2. List extra valid compounds in `extra`. `node test.js` checks each puzzle has exactly one tree.
- Circuit: add a ring to `CIRCUIT`. `node test.js` checks the ring and the joins.
