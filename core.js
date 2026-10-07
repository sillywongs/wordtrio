
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const EPOCH = Date.UTC(2026, 0, 1);
  const EDGES = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];

  function dateKey(d) {
    d = d || new Date();
    const p = n => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function dayIndex(d) {
    d = d || new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000);
  }
  function prevKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return dateKey(new Date(y, m - 1, d - 1));
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, seed) {
    const r = mulberry32(seed), a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function pick(list, idx) { return list[((idx % list.length) + list.length) % list.length]; }

  // ---- Wordle ----
  function wordleEval(guess, answer) {
    guess = guess.toLowerCase(); answer = answer.toLowerCase();
    const n = answer.length, res = Array(n).fill('absent'), left = {};
    for (let i = 0; i < n; i++) {
      if (guess[i] === answer[i]) res[i] = 'correct';
      else left[answer[i]] = (left[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < n; i++) {
      if (res[i] === 'correct') continue;
      if (left[guess[i]] > 0) { res[i] = 'present'; left[guess[i]]--; }
    }
    return res;
  }
  function keyboardState(guesses, answer) {
    const rank = { absent: 1, present: 2, correct: 3 }, st = {};
    guesses.forEach(g => wordleEval(g, answer).forEach((r, i) => {
      const c = g[i].toLowerCase();
      if (!st[c] || rank[r] > rank[st[c]]) st[c] = r;
    }));
    return st;
  }
  function validWordleGuess(g, words, strict) {
    if (!/^[a-z]{5}$/i.test(g)) return false;
    return strict ? words.includes(g.toLowerCase()) : true;
  }

  // ---- Connections ----
  function connectionsCheck(sel, puzzle) {
    if (sel.length !== 4) return { result: 'invalid' };
    let best = 0;
    for (let gi = 0; gi < puzzle.groups.length; gi++) {
      const hit = sel.filter(w => puzzle.groups[gi].words.includes(w)).length;
      if (hit === 4) return { result: 'correct', group: gi };
      best = Math.max(best, hit);
    }
    return { result: best === 3 ? 'one-away' : 'wrong' };
  }
  function connectionsBoard(puzzle, seed) {
    return shuffle(puzzle.groups.flatMap(g => g.words), seed);
  }
  function validateConnections(p) {
    const all = p.groups.flatMap(g => g.words);
    return p.groups.length === 4 && p.groups.every(g => g.words.length === 4) &&
      new Set(all).size === 16;
  }

  // ---- Pyralinks ----
  // Links are directional: the upper word comes first, so parent + child must make a word (FIRE + WORK).
  const pairKey = (a, b) => a + '|' + b;
  function validSet(puzzle) {
    const s = new Set(EDGES.map(([a, b]) => pairKey(puzzle.nodes[a], puzzle.nodes[b])));
    (puzzle.extra || []).forEach(x => s.add(x));
    return s;
  }
  function pyraLinks(arr, puzzle) {
    const ok = validSet(puzzle);
    return EDGES.map(([a, b]) => ok.has(pairKey(arr[a], arr[b])));
  }
  const pyraSolved = (arr, p) => pyraLinks(arr, p).every(Boolean);
  function pyraScramble(puzzle, seed) {
    let s = seed, arr;
    do { arr = shuffle(puzzle.nodes, s++); } while (pyraSolved(arr, puzzle) || pyraLinks(arr, puzzle).filter(Boolean).length > 1);
    return arr;
  }
  // Verified knowledge survives swaps: a pair stays green or red for as long as the same two words stay linked.
  function pyraRecord(arr, puzzle, known) {
    const k = { green: (known && known.green || []).slice(), red: (known && known.red || []).slice() };
    const res = pyraLinks(arr, puzzle);
    EDGES.forEach(([a, b], i) => {
      const key = pairKey(arr[a], arr[b]);
      const list = res[i] ? k.green : k.red;
      if (!list.includes(key)) list.push(key);
    });
    return k;
  }
  function pyraStatus(arr, known) {
    const g = (known && known.green) || [], r = (known && known.red) || [];
    return EDGES.map(([a, b]) => { const key = pairKey(arr[a], arr[b]); return g.includes(key) ? 'good' : r.includes(key) ? 'bad' : ''; });
  }

  // ---- Pyramid marks and groups ----
  // Marks are word pairs ("UPPER|LOWER"), so they stay put when other words are swapped elsewhere.
  const markedEdges = (arr, marks) => EDGES.map(([a, b]) => (marks || []).includes(pairKey(arr[a], arr[b])));
  function groupOf(arr, marks, i) {
    const me = markedEdges(arr, marks), g = [i];
    let grew = true;
    while (grew) {
      grew = false;
      EDGES.forEach(([a, b], e) => {
        if (me[e] && g.includes(a) !== g.includes(b)) { g.push(g.includes(a) ? b : a); grew = true; }
      });
    }
    return g.sort((x, y) => x - y);
  }
  const adjacent = (a, b) => EDGES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  function connected(set) {
    const seen = [set[0]], stack = [set[0]];
    while (stack.length) { const c = stack.pop(); set.forEach(n => { if (!seen.includes(n) && adjacent(c, n)) { seen.push(n); stack.push(n); } }); }
    return seen.length === set.length;
  }
  function combos(n, k, from = 0) {
    if (k === 0) return [[]];
    const out = [];
    for (let i = from; i <= n - k; i++) combos(n, k - 1, i + 1).forEach(r => out.push([i, ...r]));
    return out;
  }
  function perms(a) {
    return a.length < 2 ? [a] : a.flatMap((x, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).map(p => [x, ...p]));
  }
  // Move a marked group to any level. The dragged word lands on `to`.
  // The candidate that preserves the most downward tree links wins. A group may cross levels.
  function pyraMove(arr, marks, from, to) {
    if (from === to) return { arr, moved: false };
    const G = groupOf(arr, marks, from);
    if (G.length === 1) return { arr: swap(arr, from, to), moved: true };
    const rest = G.filter(g => g !== from);
    const pool = arr.map((_, i) => i).filter(i => i !== to);
    const edge = (a, b) => EDGES.some(([x, y]) => x === a && y === b);
    const permsOf = a => a.length < 2 ? [a] : a.flatMap((x, i) => permsOf(a.slice(0, i).concat(a.slice(i + 1))).map(p => [x, ...p]));
    let best = null;
    permsOf(pool).forEach(p => {
      const f = new Map([[from, to]]);
      rest.forEach((g, i) => f.set(g, p[i]));
      const kept = EDGES.filter(([a, b]) => f.has(a) && f.has(b) && edge(f.get(a), f.get(b))).length;
      const distance = G.reduce((sum, g) => sum + Math.abs(f.get(g) - g), 0);
      if (!best || kept > best.kept || (kept === best.kept && distance < best.distance)) best = { f, kept, distance };
    });
    const out = arr.slice();
    const destinations = G.map(g => best.f.get(g));
    const displaced = destinations.filter(d => !G.includes(d)).sort((a, b) => a - b);
    const vacancies = G.filter(g => !destinations.includes(g)).sort((a, b) => a - b);
    G.forEach(g => { out[best.f.get(g)] = arr[g]; });
    displaced.forEach((d, i) => { out[vacancies[i]] = arr[d]; });
    return { arr: out, moved: true, note: best.kept < EDGES.filter(([a, b]) => G.includes(a) && G.includes(b)).length ? 'Group moved, but its links now cross levels' : '' };
  }
  function swap(arr, i, j) { const a = arr.slice(); [a[i], a[j]] = [a[j], a[i]]; return a; }



  // ---- Circuit ----
  function circuitLinks(arr, overlap) {
    const k = overlap || 2;
    return arr.map((word, i) => word.slice(-k) === arr[(i + 1) % arr.length].slice(0, k));
  }
  const circuitSolved = (arr, puzzle) => circuitLinks(arr, puzzle.overlap).every(Boolean);
  function circuitBoard(puzzle, seed) { return shuffle(puzzle.words, seed); }
  function circuitCheck(arr, puzzle) {
    const links = circuitLinks(arr, puzzle.overlap);
    return { links, correct: links.filter(Boolean).length, solved: links.every(Boolean) };
  }

  // ---- Waffle ----
  function waffleEval(guess, answer) { return wordleEval(guess, answer); }
  function waffleSolved(guesses, answers) { return answers.every((a, i) => guesses[i] === a); }
  function waffleCheck(guesses, answers) {
    return answers.map((a, i) => guesses[i] ? waffleEval(guesses[i], a) : []);
  }
  function waffleBoard(puzzle, seed) { return shuffle(puzzle.answers, seed); }
  // ---- Stats ----
  function updateStats(stats, won, key) {
    const s = Object.assign({ played: 0, wins: 0, streak: 0, best: 0, last: null }, stats);
    if (s.last === key) return s;
    s.played++;
    if (won) {
      s.streak = (s.last && prevKey(key) === s.last && s.lastWon) ? s.streak + 1 : 1;
      s.wins++; s.best = Math.max(s.best, s.streak);
    } else s.streak = 0;
    s.last = key; s.lastWon = won;
    return s;
  }

  // ---- Share text ----
  const SQ = { correct: '🟩', present: '🟨', absent: '⬛' };
  function shareWordle(guesses, answer, key, won) {
    const rows = guesses.map(g => wordleEval(g, answer).map(r => SQ[r]).join(''));
    return 'WordTrio Wordle ' + key + ' ' + (won ? guesses.length : 'X') + '/6\n' + rows.join('\n');
  }
  const CSQ = ['🟨', '🟩', '🟦', '🟪'];
  function shareConnections(history, puzzle, key) {
    const rows = history.map(h => h.map(w => CSQ[puzzle.groups.findIndex(g => g.words.includes(w))]).join(''));
    return 'WordTrio Connections ' + key + '\n' + rows.join('\n');
  }
  function sharePyra(history, key, won) {
    return 'WordTrio Pyramid ' + key + ' ' + (won ? history.length : 'X') + '/4\n' +
      history.map(h => h.map(b => b ? '🟩' : '🟥').join('')).join('\n');
  }

  return { EDGES, dateKey, dayIndex, prevKey, mulberry32, shuffle, pick, wordleEval, keyboardState,
    validWordleGuess, circuitLinks, circuitSolved, circuitBoard, circuitCheck, waffleEval, waffleSolved, waffleCheck, waffleBoard, connectionsCheck, connectionsBoard, validateConnections, pyraLinks, pyraSolved,
    pyraScramble, pyraRecord, pyraStatus, validSet, pairKey, markedEdges, groupOf, pyraMove, swap, updateStats, shareWordle, shareConnections, sharePyra };
});
