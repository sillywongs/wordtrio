# WordTrio

Four daily word puzzles in one static web app: Word, Groups, Pyramid and Circuit. No build step, no server.

Live site: https://sillywongs.github.io/wordtrio/

| Mode | Link | Rules |
|---|---|---|
| Word | `#wordle` | Guess a five-letter word in six tries. Guesses must be real words. |
| Groups | `#conn` | Sort 16 words into four hidden groups. Four mistakes allowed. |
| Pyramid | `#pyra` | Arrange 15 words in a four-layer pyramid (1, 2, 4 and 8 words) so each upper word plus the word below it makes one word. Six guesses. |
| Circuit | `#circuit` | Arrange 12 words in a ring. Each word's last two letters must equal the next word's first two letters, and the last word must link back to the first. Drag a word onto another to swap them. Four checks. |

## Word
- A guess is accepted if it is in the built-in list (`VALID` in `data.js`, about 3,400 everyday words plus every possible answer).
- Otherwise the game asks an online dictionary once and remembers the answer. If the device is offline, the word is refused with a message.

## Pyramid
- Drag a word onto another to swap, or tap one and then the other. Finger drags work on phones.
- Tap a line to mark it orange. Marked words move together as a group, to any layer.
- Marked links are locked. A move is refused (the words snap back and a message explains) if it would break a marked link, either in the group being moved or in another marked group. A group can only land where all its links still run downward.
- After a guess, correct links turn green and stay green while those two words stay together. Solving it clears every orange mark.
- Every puzzle has exactly one tree, so only mirror images of the same layout count as correct.

## Circuit
- 12 words per puzzle, picked so that several words can follow each word. Wrong joins look right, and only a full loop works.
- Press and drag a word onto another to swap. Nothing is coloured until Check loop. Four checks (`CIRCUIT_CHECKS` in `core.js`).
- Any ring that satisfies the rule wins, not only the stored one.

## Files
`index.html`, `core.js` and `data.js` must come from the same version. If they differ, WordTrio says so in red. `node test.js` runs the logic tests. `python3 browser-test.py` runs real-browser checks (needs Playwright).

## Add content
- Pyramid: add an entry to `PYRA` in `data.js` (15 words in heap order). `node test.js` checks each puzzle has exactly one tree.
- Circuit: add a 12-word ring to `CIRCUIT`. `node test.js` checks the ring, the joins and that all words are accepted Word guesses.
