
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
    (puzzle.extra || []).forEach(e => s.add(e));
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
  // Knowledge survives swaps: a verified pair stays green for as long as the same two words stay linked.
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
  function swap(arr, i, j) { const a = arr.slice(); [a[i], a[j]] = [a[j], a[i]]; return a; }

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
    validWordleGuess, connectionsCheck, connectionsBoard, validateConnections, pyraLinks, pyraSolved,
    pyraScramble, pyraRecord, pyraStatus, validSet, swap, updateStats, shareWordle, shareConnections, sharePyra };
});
