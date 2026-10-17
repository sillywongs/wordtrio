const assert = require('assert');
const fs = require('fs');
const C = require('./core.js'), D = require('./data.js');
let n = 0; const t = (name, f) => { f(); n++; console.log('ok -', name); };
const solved = (p, arr) => C.pyraSolved(arr, p);
const sorted = a => a.slice().sort();
t('core and index.html agree on the version, and the scripts carry it', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.strictEqual(C.VERSION, 'wt-9');
  assert(html.includes("Core.VERSION !== '" + C.VERSION + "'") && html.includes('core.js?v=' + C.VERSION) && html.includes('data.js?v=' + C.VERSION));
});
t('pyramid shape: 15 words, 4 layers, 14 downward links', () => {
  assert.strictEqual(C.PYRA_N, 15); assert.strictEqual(C.EDGES.length, 14);
  assert.deepStrictEqual(C.childrenOf(0), [1, 2]); assert.deepStrictEqual(C.childrenOf(6), [13, 14]); assert.deepStrictEqual(C.childrenOf(7), []);
  assert.strictEqual(C.parentOf(14), 6); assert.strictEqual(C.parentOf(0), -1);
  const layers = i => Math.floor(Math.log2(i + 1));
  assert.strictEqual(new Set(C.EDGES.flat().map(layers)).size, 4);
});
t('every pyramid puzzle: 15 distinct words, canonical order solves it, and the tree is unique up to mirror swaps (128)', () => {
  D.PYRA.forEach((p, k) => {
    assert.strictEqual(p.nodes.length, 15); assert.strictEqual(new Set(p.nodes).size, 15); assert(solved(p, p.nodes));
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
  const bad = n.slice(); [bad[0], bad[1]] = [bad[1], bad[0]]; assert(!C.pyraLinks(bad, p)[0]);
  const m = n.slice(); [m[1], m[2]] = [m[2], m[1]]; [m[3], m[5]] = [m[5], m[3]]; [m[4], m[6]] = [m[6], m[4]];
  [m[7], m[11]] = [m[11], m[7]]; [m[8], m[12]] = [m[12], m[8]]; [m[9], m[13]] = [m[13], m[9]]; [m[10], m[14]] = [m[14], m[10]];
  assert(solved(p, m));
});
t('pyramid scramble: never solved, at most two links right, deterministic, a permutation', () => {
  D.PYRA.forEach(p => { for (let s = 0; s < 40; s++) {
    const a = C.pyraScramble(p, s);
    assert(!solved(p, a)); assert(C.pyraLinks(a, p).filter(Boolean).length <= 2);
    assert.deepStrictEqual(sorted(a), sorted(p.nodes)); assert.deepStrictEqual(a, C.pyraScramble(p, s));
  } });
});
t('pyramid marks and groups follow the word pair; green knowledge follows it across swaps', () => {
  const p = D.PYRA[0], arr = p.nodes, M = ['WORK|SHOP', 'WORK|BOOK'];
  assert.deepStrictEqual(C.groupOf(arr, M, 1), [1, 3, 4]); assert.deepStrictEqual(C.groupOf(arr, M, 2), [2]);
  assert.deepStrictEqual(C.markedEdges(C.swap(arr, 13, 14), M), C.markedEdges(arr, M));
  const a = C.swap(arr.slice(), 13, 14), k = C.pyraRecord(a, p, null);
  assert.strictEqual(C.pyraStatus(C.swap(a, 13, 14), k)[0], 'good');
});
const keysOf = (arr, marks) => C.EDGES.filter((_, e) => C.markedEdges(arr, marks)[e]).map(([a, b]) => arr[a] + '|' + arr[b]);
const edgeSet = arr => new Set(C.EDGES.map(([a, b]) => arr[a] + '|' + arr[b]));
t('pyramid move: a group that fits moves whole to another layer, and every marked link survives', () => {
  const p = D.PYRA[0], n = p.nodes, M = ['WORK|SHOP', 'WORK|BOOK', 'SHOP|KEEPER', 'SHOP|LIFT'];
  assert.deepStrictEqual(C.pyraMove(n, [], 7, 9).arr, C.swap(n, 7, 9));
  const up = C.pyraMove(n, M, 1, 0);
  assert(up.moved && up.arr[0] === 'WORK'); assert.deepStrictEqual(sorted(up.arr), sorted(n));
  const es = edgeSet(up.arr); M.forEach(k => assert(es.has(k), k));
  const F = ['FLY|PAPER', 'FLY|WHEEL', 'PAPER|CLIP', 'PAPER|WEIGHT'], side = C.pyraMove(n, F, 2, 1);
  assert(side.moved && side.arr[1] === 'FLY'); const es2 = edgeSet(side.arr); F.forEach(k => assert(es2.has(k), k));
});
t('pyramid move: a move that would break a link is refused and changes nothing', () => {
  const p = D.PYRA[0], n = p.nodes, M = ['WORK|SHOP', 'WORK|BOOK'];
  const r1 = C.pyraMove(n, M, 1, 7);
  assert.strictEqual(r1.moved, false); assert(r1.error); assert.deepStrictEqual(r1.arr, n);
  const r2 = C.pyraMove(n, M, 7, 3);
  assert.strictEqual(r2.moved, false); assert(r2.error); assert.deepStrictEqual(r2.arr, n);
  const r3 = C.pyraMove(n, ['FIRE|WORK', 'WORK|SHOP'], 1, 14);
  assert.strictEqual(r3.moved, false); assert(r3.error);
});
t('pyramid move: for every puzzle, mark set, start and target, a move is either refused or breaks no marked link', () => {
  const rng = C.mulberry32(99); let moved = 0, refused = 0;
  D.PYRA.forEach(p => {
    for (let trial = 0; trial < 60; trial++) {
      const arr = C.pyraScramble(p, trial), marks = [];
      C.EDGES.forEach(([a, b]) => { if (rng() < 0.35) marks.push(arr[a] + '|' + arr[b]); });
      for (let f = 0; f < 15; f++) for (let to = 0; to < 15; to++) {
        const before = keysOf(arr, marks), r = C.pyraMove(arr, marks, f, to);
        assert.deepStrictEqual(sorted(r.arr), sorted(arr));
        if (r.moved) { moved++; const es = edgeSet(r.arr); before.forEach(k => assert(es.has(k), 'broke ' + k)); }
        else if (f !== to) { refused++; assert(r.error); assert.deepStrictEqual(r.arr, arr); }
      }
    }
  });
  assert(moved > 1000 && refused > 1000, moved + ' moved, ' + refused + ' refused');
});
t('pyramid move is quick even with the whole tree marked', () => {
  const start = Date.now();
  D.PYRA.forEach(p => { const n = p.nodes, M = C.EDGES.map(([a, b]) => n[a] + '|' + n[b]);
    for (let f = 0; f < 15; f++) for (let to = 0; to < 15; to++) C.pyraMove(n, M, f, to); });
  assert(Date.now() - start < 6000, (Date.now() - start) + 'ms');
});
t('pyramid share text shows guesses out of six', () => {
  assert(C.sharePyra([Array(14).fill(false), Array(14).fill(true)], '2026-10-17', true).includes('2/6'));
  assert(C.sharePyra([Array(14).fill(false)], 'k', false).includes('X/6'));
});
t('wordle: the guess list is clean, lower-case five-letter words, and holds every possible answer', () => {
  assert(D.VALID.length > 3000); assert.strictEqual(new Set(D.VALID).size, D.VALID.length);
  D.VALID.forEach(w => assert(/^[a-z]{5}$/.test(w), w)); D.LIST.forEach(w => assert(D.VALID.includes(w), w));
});
t('wordle: real words are accepted and made-up ones are not', () => {
  const known = new Set([...D.LIST, ...D.VALID]);
  'crane slate hoped trees baked about ghost zesty stoic cacti fjord tacos pizza'.split(' ').forEach(w => assert(C.isKnownWord(w, known), w));
  'qzxjk asdfg poark abcde zzzzz hdhdh xxxxx fghij'.split(' ').forEach(w => assert(!C.isKnownWord(w, known), w));
  assert(!C.isKnownWord('four', known)); assert(!C.isKnownWord('sixsix', known)); assert(C.isKnownWord('CRANE', known));
});
t('circuit: every loop is a valid 12-word ring, unique words, unique id, and checks are limited to four', () => {
  assert.strictEqual(C.CIRCUIT_CHECKS, 4); assert.strictEqual(new Set(D.CIRCUIT.map(p => p.id)).size, D.CIRCUIT.length);
  D.CIRCUIT.forEach(p => {
    assert.strictEqual(p.words.length, 12, p.id); assert.strictEqual(new Set(p.words).size, 12, p.id);
    assert.deepStrictEqual(sorted(p.solution), sorted(p.words), p.id);
    p.solution.forEach((w, i) => assert.strictEqual(w.slice(-p.overlap), p.solution[(i + 1) % 12].slice(0, p.overlap), p.id + ' ' + w));
    assert(C.circuitSolved(p.solution, p), p.id); assert(C.circuitCycleCount(p.words, p.overlap) >= 1, p.id);
  });
});
t('circuit is harder: several words can follow each word, so wrong joins look right', () => {
  D.CIRCUIT.forEach(p => assert(C.circuitBranching(p.words, p.overlap) >= 1.7, p.id + ' ' + C.circuitBranching(p.words, p.overlap)));
});
t('circuit: every word is also an accepted real word', () => {
  const known = new Set([...D.LIST, ...D.VALID]);
  D.CIRCUIT.forEach(p => p.words.forEach(w => assert(known.has(w), w)));
});
t('circuit: any valid ring wins, and a broken ring is reported link by link', () => {
  D.CIRCUIT.forEach(p => assert(C.circuitSolved(p.solution.slice(3).concat(p.solution.slice(0, 3)), p)));
  const p = D.CIRCUIT[3], r = C.circuitCheck(C.swap(p.solution, 0, 4), p);
  assert(!r.solved && r.correct < 12 && r.links.length === 12);
});
t('circuit: the board starts unsolved with at most one accidental link, for two years of days', () => {
  for (let i = 0; i < 730; i++) {
    const p = C.pick(D.CIRCUIT, i), b = C.circuitBoard(p, i);
    assert.deepStrictEqual(sorted(b), sorted(p.words)); assert(!C.circuitSolved(b, p));
    assert(C.circuitLinks(b, p.overlap).filter(Boolean).length <= 1); assert.deepStrictEqual(b, C.circuitBoard(p, i));
  }
});
t('daily puzzles exist for every mode for two years; Connections data intact', () => {
  for (let i = 0; i < 730; i++) { assert(C.pick(D.LIST, i)); assert(C.pick(D.CONNECTIONS, i)); assert(C.pick(D.PYRA, i)); assert(C.pick(D.CIRCUIT, i)); }
  D.CONNECTIONS.forEach(p => assert(C.validateConnections(p)));
  assert.deepStrictEqual(C.wordleEval('speed', 'abide'), ['absent', 'absent', 'present', 'absent', 'present']);
});
console.log('\n' + n + ' tests passed');
