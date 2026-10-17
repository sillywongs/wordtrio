
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Core = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // index.html checks this so a mix of old and new files is reported instead of leaving a blank board.
  const VERSION = 'wt-10';
  const EPOCH = Date.UTC(2026, 0, 1);
  // Pyramid: 15 words in a full binary tree, four layers deep (1 + 2 + 4 + 8). Node i has children 2i+1 and 2i+2.
  const PYRA_N = 15, PYRA_GUESSES = 6;
  // Circuit: checks allowed per day.
  const CIRCUIT_CHECKS = 4;
  const EDGES = [];
  for (let i = 0; i < 7; i++) { EDGES.push([i, 2 * i + 1]); EDGES.push([i, 2 * i + 2]); }

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
  // true when the guess is a five-letter word found in `known` (a Set of lower-case words).
  function isKnownWord(g, known) {
    return /^[a-z]{5}$/i.test(g) && known.has(g.toLowerCase());
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
    do { arr = shuffle(puzzle.nodes, s++); } while (pyraSolved(arr, puzzle) || pyraLinks(arr, puzzle).filter(Boolean).length > 2);
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
  const childrenOf = i => [2 * i + 1, 2 * i + 2].filter(x => x < PYRA_N);
  const parentOf = i => (i > 0 ? (i - 1) >> 1 : -1);
  const layerOf = i => Math.floor(Math.log2(i + 1));
  // Marked links are locked: no move may break one. A marked link is broken when its two words are no longer
  // joined by a downward line (upper word, lower word).
  const markedKeys = (arr, marks) => EDGES.filter((_, e) => markedEdges(arr, marks)[e]).map(([a, b]) => pairKey(arr[a], arr[b]));
  const linksIntact = (before, out) => {
    const now = new Set(EDGES.map(([a, b]) => pairKey(out[a], out[b])));
    return before.every(k => now.has(k));
  };
  function permutations(a) {
    return a.length < 2 ? [a] : a.flatMap((x, i) => permutations(a.slice(0, i).concat(a.slice(i + 1))).map(p => [x, ...p]));
  }
  // How many layers a locked group spans (a chain of 3 linked words spans 3 layers).
  function groupSpan(arr, marks, i) {
    const me = markedEdges(arr, marks), depth = new Map([[i, 0]]), queue = [i];
    for (let q = 0; q < queue.length; q++) {
      const u = queue[q];
      EDGES.forEach(([a, b], e) => {
        if (!me[e]) return;
        if (a === u && !depth.has(b)) { depth.set(b, depth.get(u) + 1); queue.push(b); }
        else if (b === u && !depth.has(a)) { depth.set(a, depth.get(u) - 1); queue.push(a); }
      });
    }
    const ds = [...depth.values()];
    return Math.max(...ds) - Math.min(...ds) + 1;
  }
  // Move the word at `from` onto position `to`. Returns { arr, moved } or { arr, moved: false, error }.
  // A lone word swaps with the word it lands on. A marked group moves as one piece, to any layer, and only to a
  // spot where every one of its links still runs downward (a child sits in a child spot of its parent's new spot).
  // The words that were in the way fill the places the group left. If a move would break any marked link, in the
  // group or in another group, it is refused.
  function pyraMove(arr, marks, from, to) {
    if (from === to) return { arr, moved: false };
    const G = groupOf(arr, marks, from), keys = markedKeys(arr, marks);
    if (G.length === 1) {
      const out = swap(arr, from, to);
      return linksIntact(keys, out) ? { arr: out, moved: true } : { arr, moved: false, error: 'That would break a marked link. Unmark it first.' };
    }
    const me = markedEdges(arr, marks);
    const order = [from], anchor = new Map(), seen = new Set([from]);
    for (let q = 0; q < order.length; q++) {
      const u = order[q];
      EDGES.forEach(([a, b], e) => {
        if (!me[e]) return;
        const v = a === u ? b : b === u ? a : -1;
        if (v >= 0 && !seen.has(v)) { seen.add(v); order.push(v); anchor.set(v, { u, down: a === u }); }
      });
    }
    const places = [], f = new Map([[from, to]]), used = new Set([to]);
    (function dfs(k, dist) {
      if (places.length >= 4000) return;
      if (k === order.length) { places.push({ f: new Map(f), dist }); return; }
      const v = order[k], { u, down } = anchor.get(v), pu = f.get(u);
      (down ? childrenOf(pu) : (pu > 0 ? [parentOf(pu)] : [])).filter(p => !used.has(p)).forEach(p => {
        f.set(v, p); used.add(p); dfs(k + 1, dist + Math.abs(p - v)); used.delete(p); f.delete(v);
      });
    })(1, 0);
    if (!places.length) return { arr, moved: false, error: 'That locked group (' + G.length + ' words, ' + groupSpan(arr, marks, from) + ' layers) does not fit there.' };
    places.sort((x, y) => x.dist - y.dist);
    const fillings = p => {
      const dest = G.map(g => p.f.get(g));
      const displaced = dest.filter(d => !G.includes(d)), vacated = G.filter(g => !dest.includes(g));
      const swapped = [], rest = vacated.slice(), left = [];
      displaced.forEach(d => {
        const g = G.find(x => p.f.get(x) === d), at = rest.indexOf(g);
        if (at >= 0) { swapped.push([g, d]); rest.splice(at, 1); } else left.push(d);
      });
      const build = o2 => {
        const out = arr.slice();
        G.forEach(g => { out[p.f.get(g)] = arr[g]; });
        swapped.forEach(([g, d]) => { out[g] = arr[d]; });
        left.forEach((d, i) => { out[o2[i]] = arr[d]; });
        return out;
      };
      const res = [build(rest)];
      if (left.length > 1 && left.length <= 5) permutations(rest).forEach(pm => res.push(build(pm)));
      return res;
    };
    for (const p of places) for (const out of fillings(p)) if (linksIntact(keys, out)) return { arr: out, moved: true };
    return { arr, moved: false, error: 'That would break another locked group. Unmark it first.' };
  }
  // For the word at `from`: which positions it (and its locked group) may be dropped on. Used to light up legal spots.
  function pyraTargets(arr, marks, from) {
    return arr.map((_, to) => to !== from && pyraMove(arr, marks, from, to).moved);
  }
  function swap(arr, i, j) { const a = arr.slice(); [a[i], a[j]] = [a[j], a[i]]; return a; }



  // ---- Circuit ----
  function circuitLinks(arr, overlap) {
    const k = overlap || 2;
    return arr.map((word, i) => word.toUpperCase().slice(-k) === arr[(i + 1) % arr.length].toUpperCase().slice(0, k));
  }
  const circuitSolved = (arr, puzzle) => circuitLinks(arr, puzzle.overlap).every(Boolean);
  function circuitBoard(puzzle, seed) {
    let s = seed, arr = shuffle(puzzle.words, s), tries = 0;
    while ((circuitSolved(arr, puzzle) || circuitLinks(arr, puzzle.overlap).filter(Boolean).length > 1) && tries++ < 500) arr = shuffle(puzzle.words, ++s);
    return arr;
  }
  // How many different rings the words can form (counted from the first word, so rotations are not repeated).
  function circuitCycleCount(words, overlap) {
    const k = overlap || 2, n = words.length;
    const nxt = words.map((w, i) => words.map((x, j) => j !== i && w.slice(-k) === x.slice(0, k) ? j : -1).filter(j => j >= 0));
    let count = 0;
    (function walk(path, used) {
      if (path.length === n) { if (nxt[path[n - 1]].includes(0)) count++; return; }
      nxt[path[path.length - 1]].forEach(j => { if (!(used >> j & 1)) walk(path.concat(j), used | (1 << j)); });
    })([0], 1);
    return count;
  }
  // Average number of words that could follow each word: a rough measure of how many wrong joins look right.
  function circuitBranching(words, overlap) {
    const k = overlap || 2;
    return words.reduce((s, w) => s + words.filter(x => x !== w && w.slice(-k) === x.slice(0, k)).length, 0) / words.length;
  }
  function circuitCheck(arr, puzzle) {
    const links = circuitLinks(arr, puzzle.overlap);
    return { links, correct: links.filter(Boolean).length, solved: links.every(Boolean) };
  }

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
    return 'WordTrio Pyramid ' + key + ' ' + (won ? history.length : 'X') + '/' + PYRA_GUESSES + '\n' +
      history.map(h => h.map(b => b ? '🟩' : '🟥').join('')).join('\n');
  }

  return { VERSION, EDGES, PYRA_N, PYRA_GUESSES, CIRCUIT_CHECKS, childrenOf, parentOf, layerOf, groupSpan, pyraTargets, circuitCycleCount, circuitBranching, isKnownWord, dateKey, dayIndex, prevKey, mulberry32, shuffle, pick, wordleEval, keyboardState,
    validWordleGuess, circuitLinks, circuitSolved, circuitBoard, circuitCheck, connectionsCheck, connectionsBoard, validateConnections, pyraLinks, pyraSolved,
    pyraScramble, pyraRecord, pyraStatus, validSet, pairKey, markedEdges, groupOf, pyraMove, swap, updateStats, shareWordle, shareConnections, sharePyra };
});
