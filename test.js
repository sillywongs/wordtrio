const assert = require('assert');
const fs = require('fs');
const C = require('./core.js'), D = require('./data.js');
let n = 0; const t = (name, f) => { f(); n++; console.log('ok -', name); };
const solved = (p, arr) => C.pyraSolved(arr, p);

t('core and index.html agree on the version, and the scripts carry it', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.strictEqual(C.VERSION, 'wt-8');
  assert(html.includes("Core.VERSION !== '" + C.VERSION + "'") && html.includes('core.js?v=' + C.VERSION) && html.includes('data.js?v=' + C.VERSION));
});
t('pyramid shape: 15 words, 4 layers, 14 downward links', () => {
  assert.strictEqual(C.PYRA_N, 15); assert.strictEqual(C.EDGES.length, 14);
  assert.deepStrictEqual(C.childrenOf(0), [1, 2]); assert.deepStrictEqual(C.childrenOf(3), [7, 8]); assert.deepStrictEqual(C.childrenOf(6), [13, 14]);
  assert.deepStrictEqual(C.childrenOf(7), []); assert.strictEqual(C.parentOf(14), 6); assert.strictEqual(C.parentOf(0), -1);
  const layers = i => Math.floor(Math.log2(i + 1));
  assert.strictEqual(layers(14), 3); assert.strictEqual(new Set(C.EDGES.flat().map(layers)).size, 4);
});
t('every pyramid puzzle: 15 distinct words, canonical order solves it, and the tree is unique up to mirror swaps (128)', () => {
  assert(D.PYRA.length >= 6);
  D.PYRA.forEach((p, k) => {
    assert.strictEqual(p.nodes.length, 15, 'puzzle ' + k); assert.strictEqual(new Set(p.nodes).size, 15, 'puzzle ' + k);
    assert(solved(p, p.nodes));
    (p.extra || []).forEach(e => e.split('|').forEach(w => assert(p.nodes.includes(w), e)));
    const ok = C.validSet(p), asg = Array(15), used = Array(15).fill(false); let count = 0;
    (function place(pos) {
      if (pos === 15) { count++; return; }
      for (let w = 0; w < 15; w++) {
        if (used[w]) continue;
        if (pos > 0 && !ok.has(p.nodes[asg[(pos - 1) >> 1]] + '|' + p.nodes[w])) continue;
        used[w] = true; asg[pos] = w; place(pos + 1); used[w] = false;
      }
    })(0);
    assert.strictEqual(count, 128, 'puzzle ' + k + ' has ' + count + ' solutions');
  });
});
t('pyramid links are directional, and a mirrored subtree still solves it', () => {
  const p = D.PYRA[0], n = p.nodes.slice();
  const bad = n.slice(); [bad[0], bad[1]] = [bad[1], bad[0]];
  assert(!C.pyraLinks(bad, p)[0]);
  const m = n.slice(); [m[1], m[2]] = [m[2], m[1]]; [m[3], m[5]] = [m[5], m[3]]; [m[4], m[6]] = [m[6], m[4]];
  [m[7], m[11]] = [m[11], m[7]]; [m[8], m[12]] = [m[12], m[8]]; [m[9], m[13]] = [m[13], m[9]]; [m[10], m[14]] = [m[14], m[10]];
  assert(solved(p, m));
});
t('pyramid scramble: never solved, at most two links right, deterministic, a permutation', () => {
  D.PYRA.forEach(p => { for (let s = 0; s < 40; s++) {
    const a = C.pyraScramble(p, s);
    assert(!solved(p, a)); assert(C.pyraLinks(a, p).filter(Boolean).length <= 2);
    assert.deepStrictEqual(a.slice().sort(), p.nodes.slice().sort()); assert.deepStrictEqual(a, C.pyraScramble(p, s));
  } });
});
t('pyramid: green knowledge follows the word pair across swaps', () => {
  const p = D.PYRA[0], a = C.swap(p.nodes.slice(), 13, 14);
  const k = C.pyraRecord(a, p, null);
  assert.strictEqual(C.pyraStatus(a, k)[0], 'good'); assert.strictEqual(C.pyraStatus(C.swap(a, 13, 14), k)[0], 'good');
});
t('pyramid marks and groups: marks follow the word pair, groups follow marked links', () => {
  const p = D.PYRA[0], arr = p.nodes, M = ['WORK|SHOP', 'WORK|BOOK'];
  assert.deepStrictEqual(C.groupOf(arr, M, 1), [1, 3, 4]); assert.deepStrictEqual(C.groupOf(arr, M, 4), [1, 3, 4]); assert.deepStrictEqual(C.groupOf(arr, M, 2), [2]);
  const e = C.markedEdges(arr, M); assert.strictEqual(e.filter(Boolean).length, 2);
  assert.deepStrictEqual(C.markedEdges(C.swap(arr, 13, 14), M), e);
});
t('pyramid move: a lone word swaps; a marked group moves whole, across layers, keeping its shape', () => {
  const p = D.PYRA[0], n = p.nodes, M = ['WORK|SHOP', 'WORK|BOOK', 'SHOP|KEEPER', 'SHOP|LIFT'];
  assert.deepStrictEqual(C.pyraMove(n, [], 7, 9).arr, C.swap(n, 7, 9));
  const up = C.pyraMove(n, M, 1, 0);
  assert(up.moved); assert.strictEqual(up.arr[0], 'WORK'); assert.deepStrictEqual(up.arr.slice().sort(), n.slice().sort());
  assert.strictEqual(C.groupOf(up.arr, M, 0).length, 5); assert.strictEqual(up.note, '');
  const F = ['FLY|PAPER', 'FLY|WHEEL', 'PAPER|CLIP', 'PAPER|WEIGHT'];
  const side = C.pyraMove(n, F, 2, 1);
  assert(side.moved); assert.strictEqual(side.arr[1], 'FLY'); assert.deepStrictEqual(side.arr.slice().sort(), n.slice().sort());
  assert.strictEqual(C.groupOf(side.arr, F, 1).length, 5);
});
t('pyramid move: every move from every spot keeps the same 15 words, and is quick', () => {
  const start = Date.now();
  D.PYRA.forEach(p => {
    const n = p.nodes, groups = [[], [n[0] + '|' + n[1], n[1] + '|' + n[3]], [n[1] + '|' + n[3], n[1] + '|' + n[4], n[3] + '|' + n[7], n[3] + '|' + n[8]], C.EDGES.map(([a, b]) => n[a] + '|' + n[b])];
    groups.forEach(marks => { for (let f = 0; f < 15; f++) for (let to = 0; to < 15; to++) assert.deepStrictEqual(C.pyraMove(n, marks, f, to).arr.slice().sort(), n.slice().sort()); });
  });
  assert(Date.now() - start < 8000, 'moves took ' + (Date.now() - start) + 'ms');
});
t('pyramid share text shows guesses out of six', () => {
  assert(C.sharePyra([Array(14).fill(false), Array(14).fill(true)], '2026-10-17', true).includes('2/6'));
  assert(C.sharePyra([Array(14).fill(false)], 'k', false).includes('X/6'));
});
t('circuit: every loop is a valid ring that uses exactly its words, with 8 to 10 words and a unique id', () => {
  assert.strictEqual(new Set(D.CIRCUIT.map(p => p.id)).size, D.CIRCUIT.length);
  D.CIRCUIT.forEach(p => {
    assert(p.words.length >= 8 && p.words.length <= 10, p.id); assert.strictEqual(new Set(p.words).size, p.words.length, p.id);
    assert.deepStrictEqual(p.solution.slice().sort(), p.words.slice().sort(), p.id);
    p.solution.forEach((w, i) => assert.strictEqual(w.slice(-p.overlap), p.solution[(i + 1) % p.solution.length].slice(0, p.overlap), p.id + ' ' + w));
    assert(C.circuitSolved(p.solution, p), p.id); assert(C.circuitCycleCount(p.words, p.overlap) >= 1, p.id);
  });
});
t('circuit: any valid ring wins, and a broken ring is reported link by link', () => {
  D.CIRCUIT.forEach(p => assert(C.circuitSolved(p.solution.slice(3).concat(p.solution.slice(0, 3)), p), p.id));
  const p = D.CIRCUIT[7], r = C.circuitCheck(C.swap(p.solution, 0, 4), p);
  assert(!r.solved && r.correct < p.solution.length && r.links.length === p.solution.length);
});
t('circuit: the board starts unsolved with at most one accidental link, for two years of days, deterministically', () => {
  for (let i = 0; i < 730; i++) {
    const p = C.pick(D.CIRCUIT, i), b = C.circuitBoard(p, i);
    assert.deepStrictEqual(b.slice().sort(), p.words.slice().sort()); assert(!C.circuitSolved(b, p));
    assert(C.circuitLinks(b, p.overlap).filter(Boolean).length <= 1); assert.deepStrictEqual(b, C.circuitBoard(p, i));
  }
});
t('daily puzzles exist for every mode for two years; Wordle and Connections data are intact', () => {
  for (let i = 0; i < 730; i++) { assert(C.pick(D.LIST, i)); assert(C.pick(D.CONNECTIONS, i)); assert(C.pick(D.PYRA, i)); assert(C.pick(D.CIRCUIT, i)); }
  D.CONNECTIONS.forEach(p => assert(C.validateConnections(p)));
  assert.deepStrictEqual(C.wordleEval('speed', 'abide'), ['absent', 'absent', 'present', 'absent', 'present']);
  assert.strictEqual(C.dayIndex(new Date(2026, 9, 7)), 279);
});
console.log('\n' + n + ' tests passed');
