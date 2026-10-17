// Checks for the Word freeze fix and the Pyramid locked-group rules. Run: node test-fixes.js
const assert = require('assert');
const C = require('./core.js'), D = require('./data.js');
let n = 0; const t = (name, f) => { f(); n++; console.log('ok -', name); };
t('a locked group of three layers can only have its top word in the top two layers', () => {
  D.PYRA.forEach(p => {
    const arr = p.nodes, M = [arr[0] + '|' + arr[1], arr[1] + '|' + arr[3]];       // chain: layer 1 -> 2 -> 3
    assert.strictEqual(C.groupSpan(arr, M, 0), 3);
    const ok = C.pyraTargets(arr, M, 0);
    for (let to = 0; to < 15; to++) assert.strictEqual(ok[to], to === 1 || to === 2, 'drop on ' + to);
    for (let to = 3; to < 15; to++) { const r = C.pyraMove(arr, M, 0, to); assert(!r.moved && r.error && r.arr === arr, 'moved to ' + to); }
  });
});
t('a locked chain of four layers can only sit with its top word at the very top', () => {
  const p = D.PYRA[0], a = p.nodes, M = [a[0] + '|' + a[1], a[1] + '|' + a[3], a[3] + '|' + a[7]];
  assert.strictEqual(C.groupSpan(a, M, 0), 4);
  const ok = C.pyraTargets(a, M, 0);
  assert(ok.every(x => !x), 'nowhere to go: ' + ok.join());
});
t('a locked group in the middle of the pyramid cannot be dragged down past where it fits', () => {
  const p = D.PYRA[1], a = p.nodes, M = [a[1] + '|' + a[3], a[3] + '|' + a[7]];       // layers 2 -> 3 -> 4
  assert.strictEqual(C.groupSpan(a, M, 1), 3);
  const ok = C.pyraTargets(a, M, 1);
  for (let to = 3; to < 15; to++) assert(!ok[to], 'top word allowed on ' + to);
  assert(ok[2], 'sideways to the other second-layer spot is fine');
});
t('a lone word cannot land on a locked word, and lights up everywhere else', () => {
  const a = D.PYRA[0].nodes, M = [a[0] + '|' + a[1], a[1] + '|' + a[3]];
  const ok = C.pyraTargets(a, M, 9);
  [0, 1, 3].forEach(i => assert(!ok[i], 'allowed onto locked ' + i));
  [2, 4, 5, 6, 7, 8, 10, 11, 12, 13, 14].forEach(i => assert(ok[i], 'blocked on free ' + i));
});
t('whatever is highlighted really moves, and whatever is not is refused', () => {
  const rng = C.mulberry32(5);
  D.PYRA.forEach(p => { for (let k = 0; k < 40; k++) {
    const arr = C.pyraScramble(p, k), marks = [];
    C.EDGES.forEach(([x, y]) => { if (rng() < 0.3) marks.push(arr[x] + '|' + arr[y]); });
    for (let f = 0; f < 15; f++) { const ok = C.pyraTargets(arr, marks, f); ok.forEach((v, to) => { if (to !== f) assert.strictEqual(C.pyraMove(arr, marks, f, to).moved, v); }); }
  } });
});
t('the error says how big the locked group is', () => {
  const a = D.PYRA[0].nodes, M = [a[0] + '|' + a[1], a[1] + '|' + a[3]];
  assert(/3 words, 3 layers/.test(C.pyraMove(a, M, 0, 9).error));
});
t('Wordle word check: known words pass, made-up words do not', () => {
  const known = new Set([...D.LIST, ...D.VALID]);
  assert(C.isKnownWord('crane', known)); assert(!C.isKnownWord('qzxjk', known)); assert(!C.isKnownWord('four', known));
});
console.log('\n' + n + ' tests passed');
