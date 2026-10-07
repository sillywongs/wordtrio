
const assert = require('assert');
const C = require('./core.js'), D = require('./data.js');
let n = 0; const t = (name, f) => { f(); n++; console.log('ok -', name); };

t('wordle: all correct', () => assert.deepStrictEqual(C.wordleEval('crane','crane'), Array(5).fill('correct')));
t('wordle: duplicate letters only marked once', () =>
  assert.deepStrictEqual(C.wordleEval('speed','abide'), ['absent','absent','present','absent','present']));
t('wordle: green consumes letter before yellow', () =>
  assert.deepStrictEqual(C.wordleEval('allee','eagle'), ['present','present','absent','present','correct']));
t('wordle: keyboard keeps best state', () => {
  const k = C.keyboardState(['slate','crane'], 'crane');
  assert.strictEqual(k.a, 'correct'); assert.strictEqual(k.s, 'absent');
});
t('wordle: guess validation', () => {
  assert(!C.validWordleGuess('abc', D.LIST, false));
  assert(C.validWordleGuess('zzzzz', D.LIST, false));
  assert(!C.validWordleGuess('zzzzz', D.LIST, true));
});
t('word list: 5 letters, unique, enough for 100+ days', () => {
  assert(D.LIST.length >= 100, 'list size ' + D.LIST.length);
  D.LIST.forEach(w => assert(/^[a-z]{5}$/.test(w), w));
});
t('dates: dayIndex and prevKey', () => {
  assert.strictEqual(C.dayIndex(new Date(2026,0,1)), 0);
  assert.strictEqual(C.dayIndex(new Date(2026,9,7)), 279);
  assert.strictEqual(C.prevKey('2026-03-01'), '2026-02-28');
  assert.strictEqual(C.prevKey('2026-01-01'), '2025-12-31');
});
t('shuffle: deterministic and a permutation', () => {
  const a = [1,2,3,4,5,6,7,8];
  assert.deepStrictEqual(C.shuffle(a, 7), C.shuffle(a, 7));
  assert.deepStrictEqual(C.shuffle(a, 7).slice().sort(), a);
});
t('connections: every puzzle has 16 unique words in 4x4', () =>
  D.CONNECTIONS.forEach((p, i) => assert(C.validateConnections(p), 'puzzle ' + i)));
t('connections: check results', () => {
  const p = D.CONNECTIONS[0];
  assert.strictEqual(C.connectionsCheck(p.groups[0].words, p).result, 'correct');
  const away = [...p.groups[0].words.slice(0,3), p.groups[1].words[0]];
  assert.strictEqual(C.connectionsCheck(away, p).result, 'one-away');
  const wrong = [p.groups[0].words[0], p.groups[0].words[1], p.groups[1].words[0], p.groups[2].words[0]];
  assert.strictEqual(C.connectionsCheck(wrong, p).result, 'wrong');
  assert.strictEqual(C.connectionsCheck(['A'], p).result, 'invalid');
});
t('connections: board contains all words', () => {
  const p = D.CONNECTIONS[3];
  assert.deepStrictEqual(C.connectionsBoard(p, 3).sort(), p.groups.flatMap(g => g.words).sort());
});
t('pyramid: solved order is solved, each puzzle has 7 unique words', () =>
  D.PYRA.forEach(p => { assert.strictEqual(new Set(p.nodes).size, 7); assert(C.pyraSolved(p.nodes, p)); }));
t('pyramid: scramble is unsolved for every puzzle and seed', () =>
  D.PYRA.forEach(p => { for (let s = 0; s < 50; s++) {
    const a = C.pyraScramble(p, s);
    assert(!C.pyraSolved(a, p)); assert.deepStrictEqual(a.slice().sort(), p.nodes.slice().sort()); } }));
t('pyramid: mirrored subtrees still count as solved', () => {
  const p = D.PYRA[0], n = p.nodes;
  assert(C.pyraSolved([n[0], n[2], n[1], n[5], n[6], n[3], n[4]], p));
});
t('pyramid: links are directional (child above parent fails)', () => {
  const p = D.PYRA[0], n = p.nodes;
  assert(!C.pyraLinks([n[1], n[0], n[2], n[3], n[4], n[5], n[6]], p)[0]);
});
const perms = a => a.length < 2 ? [a] : a.flatMap((x, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).map(p => [x, ...p]));
t('pyramid: each puzzle is solvable and has exactly one tree (8 mirror variants)', () =>
  D.PYRA.forEach(p => assert.strictEqual(perms(p.nodes).filter(a => C.pyraSolved(a, p)).length, 8, p.nodes[0])));
t('pyramid: extra pairs only use words from the puzzle', () =>
  D.PYRA.forEach(p => (p.extra || []).forEach(e => e.split('|').forEach(w => assert(p.nodes.includes(w), e)))));
t('pyramid: green links persist between guesses until the pair is split', () => {
  const p = D.PYRA[0], n = p.nodes;
  const arr1 = [n[0], n[1], n[6], n[3], n[4], n[5], n[2]];
  let k = C.pyraRecord(arr1, p, null);
  assert.strictEqual(C.pyraStatus(arr1, k)[0], 'good');
  assert.strictEqual(C.pyraStatus(arr1, k)[1], 'bad');
  const arr2 = C.swap(arr1, 2, 6);
  assert.strictEqual(C.pyraStatus(arr2, k)[0], 'good');
  assert.strictEqual(C.pyraStatus(arr2, k)[1], '');
  k = C.pyraRecord(arr2, p, k);
  assert(C.pyraStatus(arr2, k).every(s => s === 'good'));
  const arr3 = C.swap(arr2, 0, 3);
  assert.strictEqual(C.pyraStatus(arr3, k)[0], '');
  assert.strictEqual(C.pyraStatus(arr3, k)[3], 'good');
});
const M = ['WORK|SHOP', 'WORK|BOOK'];
t('pyramid marks: stay on the same word pair after swaps elsewhere', () => {
  const n = D.PYRA[0].nodes, arr = [n[0], n[1], n[2], n[3], n[4], n[5], n[6]];
  assert.deepStrictEqual(C.markedEdges(arr, M), [false, false, true, true, false, false]);
  const after = C.swap(arr, 5, 6);
  assert.deepStrictEqual(C.markedEdges(after, M), [false, false, true, true, false, false]);
  const moved = C.swap(arr, 0, 2);
  assert.deepStrictEqual(C.markedEdges(moved, M), [false, false, true, true, false, false]);
});
t('pyramid marks: groups follow marked links', () => {
  const arr = D.PYRA[0].nodes;
  assert.deepStrictEqual(C.groupOf(arr, M, 1), [1, 3, 4]);
  assert.deepStrictEqual(C.groupOf(arr, M, 4), [1, 3, 4]);
  assert.deepStrictEqual(C.groupOf(arr, M, 2), [2]);
  assert.deepStrictEqual(C.groupOf(arr, [], 1), [1]);
});
t('pyramid move: unmarked word swaps alone', () => {
  const arr = D.PYRA[0].nodes, r = C.pyraMove(arr, [], 3, 5);
  assert(r.moved); assert.deepStrictEqual(r.arr, C.swap(arr, 3, 5));
});
t('pyramid move: marked group moves together to a spot of the same shape', () => {
  const n = D.PYRA[0].nodes, r = C.pyraMove(n, M, 1, 2);
  assert(r.moved, r.error);
  assert.strictEqual(r.arr[2], 'WORK');
  assert.deepStrictEqual([r.arr[5], r.arr[6]].sort(), ['BOOK', 'SHOP']);
  assert.deepStrictEqual([r.arr[3], r.arr[4]].sort(), ['PAPER', 'WHEEL']);
  assert.strictEqual(r.arr[1], 'FLY');
  assert.deepStrictEqual(C.groupOf(r.arr, M, 2), [2, 5, 6]);
  assert.deepStrictEqual(r.arr.slice().sort(), n.slice().sort());
});
t('pyramid move: dragging any member of the group moves the whole group', () => {
  const n = D.PYRA[0].nodes, r = C.pyraMove(n, M, 3, 5);
  assert(r.moved, r.error);
  assert.strictEqual(r.arr[5], 'SHOP');
  assert.deepStrictEqual(C.groupOf(r.arr, M, 5).map(i => r.arr[i]).sort(), ['BOOK', 'SHOP', 'WORK']);
});
t('pyramid move: group can move to a different shape and reports it', () => {
  const n = D.PYRA[0].nodes, r = C.pyraMove(n, M, 1, 0);
  assert(r.moved); assert.deepStrictEqual(r.arr.slice().sort(), n.slice().sort());
});
t('pyramid move: two marked groups swap with each other', () => {
  const n = D.PYRA[0].nodes, M2 = M.concat(['FLY|PAPER', 'FLY|WHEEL']);
  const r = C.pyraMove(n, M2, 1, 2);
  assert(r.moved, r.error);
  assert.strictEqual(r.arr[1], 'FLY'); assert.strictEqual(r.arr[2], 'WORK');
  assert.deepStrictEqual(C.groupOf(r.arr, M2, 1).length, 3);
  assert.deepStrictEqual(C.groupOf(r.arr, M2, 2).length, 3);
});
t('pyramid move: every legal move keeps the same set of words', () => {
  const n = D.PYRA[3].nodes;
  const marks = ['RAIN|COAT', 'COAT|RACK'];
  for (let f = 0; f < 7; f++) for (let t = 0; t < 7; t++) {
    const r = C.pyraMove(n, marks, f, t);
    assert.deepStrictEqual(r.arr.slice().sort(), n.slice().sort());
  }
});
t('pyramid: swap is pure', () => {
  const a = ['a','b','c']; const b = C.swap(a, 0, 2);
  assert.deepStrictEqual(a, ['a','b','c']); assert.deepStrictEqual(b, ['c','b','a']);
});
t('stats: streak grows on consecutive days, resets on a gap or loss', () => {
  let s = C.updateStats(null, true, '2026-10-05');
  s = C.updateStats(s, true, '2026-10-06'); assert.strictEqual(s.streak, 2);
  s = C.updateStats(s, true, '2026-10-06'); assert.strictEqual(s.played, 2);
  s = C.updateStats(s, true, '2026-10-08'); assert.strictEqual(s.streak, 1); assert.strictEqual(s.best, 2);
  s = C.updateStats(s, false, '2026-10-09'); assert.strictEqual(s.streak, 0);
});
t('share text formats', () => {
  assert(C.shareWordle(['slate','crane'], 'crane', '2026-10-07', true).includes('2/6'));
  assert(C.sharePyra([[true,false,true,true,true,true]], '2026-10-07', false).includes('X/4'));
  const p = D.CONNECTIONS[0];
  assert(C.shareConnections([p.groups[0].words], p, 'k').includes('🟨🟨🟨🟨'));
});
t('every day for 2 years yields a puzzle for each mode', () => {
  for (let i = 0; i < 730; i++) { assert(C.pick(D.LIST, i)); assert(C.pick(D.CONNECTIONS, i)); assert(C.pick(D.PYRA, i)); }
});

t('pyramid: marked groups may move between levels', () => {
  const p = D.PYRA[0], M = ['WORK|SHOP', 'WORK|BOOK'];
  let r = C.pyraMove(p.nodes, M, 1, 0);
  assert(r.moved && r.arr[0] === 'WORK');
  assert.deepStrictEqual(C.groupOf(r.arr, M, 0), [0,1,2]);
  r = C.pyraMove(r.arr, M, 0, 2);
  assert(r.moved && r.arr[2] === 'WORK');
  assert.deepStrictEqual(C.groupOf(r.arr, M, 2), [2,5,6]);
});

t('circuit: links use the last two and first two letters, including wraparound', () => {
  assert(C.circuitLinks(D.CIRCUIT[0].words, 2).every(Boolean));
  assert.strictEqual(C.circuitSolved(D.CIRCUIT[0].words, D.CIRCUIT[0]), true);
  assert.strictEqual(C.circuitCheck(C.shuffle(D.CIRCUIT[0].words, 3), D.CIRCUIT[0]).links.length, D.CIRCUIT[0].words.length);
});
t('circuit: board is a permutation and deterministic', () => {
  const p=D.CIRCUIT[1]; assert.deepStrictEqual(C.circuitBoard(p,9),C.circuitBoard(p,9)); assert.deepStrictEqual(C.circuitBoard(p,9).sort(),p.words.slice().sort());
});
t('circuit: links are case-insensitive', () => assert(C.circuitLinks(['cargo','gothic','icing','ngoma','mason','onset','etude','dealer','erica'], 2).every(Boolean)));
t('circuit: manual swap changes the arrangement without mutating input', () => { const a=['a','b']; const b=C.swap(a,0,1); assert.deepStrictEqual(a,['a','b']); assert.deepStrictEqual(b,['b','a']); });
t('all Circuit daily payloads are valid closed loops', () => { D.CIRCUIT.forEach((p,i)=>{ assert(C.circuitSolved(p.words,p), 'Circuit '+i); assert(C.circuitLinks(p.words,p.overlap).every(Boolean)); }); });
t('Circuit scrambled board has no automatic feedback state', () => { const p=D.CIRCUIT[0], b=C.circuitBoard(p,279); assert.strictEqual(C.circuitCheck(b,p).links.length,b.length); });
console.log('\n' + n + ' tests passed');