
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
console.log('\n' + n + ' tests passed');
