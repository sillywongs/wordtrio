
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Data = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const WORDS = [
    'crane slate pilot brave ocean tiger flame chair plant stone river cloud smile mango',
    'lemon peach grape bread honey sugar spice pasta pizza salad toast olive onion berry cream candy',
    'train plane truck horse sheep zebra camel eagle shark whale koala panda snake mouse robot piano',
    'music dance party movie story novel poems paint brush craft shape light night sleep dream early',
    'happy angry quiet noisy heavy sharp sweet sour fresh clean dirty empty quick brain heart skill',
    'trust truth faith peace power money price trade stock share bonus yield asset value event beach',
    'coast shore ridge field forest grove trail path bridge tower castle house hotel cabin lodge suite',
    'lobby route visit tours fares miles lands wings clock watch phone cable video audio glass metal',
    'wheel tires cargo depot ports ships sails coral reefs dunes cliff peaks lakes ponds creek brook',
    'marsh swamp woods farms crops grain wheat maize beans herbs thyme basil mints cumin clove tapas'
  ].join(' ');
  const LIST = Array.from(new Set(WORDS.split(/\s+/).filter(w => /^[a-z]{5}$/.test(w))));

  const CONNECTIONS = [
    { groups: [
      { name: 'Shades of blue', words: ['NAVY','TEAL','AZURE','COBALT'] },
      { name: 'Kitchen tools', words: ['WHISK','LADLE','TONGS','GRATER'] },
      { name: '___ bank', words: ['RIVER','PIGGY','BLOOD','SNOW'] },
      { name: 'Hidden body parts', words: ['CHAIR','ALARM','CHINA','PEARL'] } ] },
    { groups: [
      { name: 'Poker actions', words: ['FLUSH','RAISE','CALL','FOLD'] },
      { name: '___fish', words: ['STAR','SWORD','CAT','JELLY'] },
      { name: 'Sydney suburbs', words: ['MANLY','BONDI','RYDE','CRONULLA'] },
      { name: 'Things with keys', words: ['PIANO','MAP','LOCK','KEYBOARD'] } ] },
    { groups: [
      { name: 'Australian animals', words: ['KOALA','WOMBAT','QUOKKA','DINGO'] },
      { name: 'Asian currencies', words: ['YEN','WON','BAHT','DONG'] },
      { name: 'Chess pieces', words: ['ROOK','BISHOP','PAWN','KING'] },
      { name: 'Taiwanese cities', words: ['TAIPEI','TAINAN','HUALIEN','KAOHSIUNG'] } ] },
    { groups: [
      { name: '___ball', words: ['FOOT','BASKET','SNOW','EYE'] },
      { name: 'Teas', words: ['OOLONG','CHAI','JASMINE','ASSAM'] },
      { name: 'Planets', words: ['VENUS','EARTH','SATURN','URANUS'] },
      { name: 'Chocolate bars', words: ['MARS','TWIX','SNICKERS','BOUNTY'] } ] },
    { groups: [
      { name: 'Ways to sleep lightly', words: ['NAP','DOZE','SNOOZE','SLUMBER'] },
      { name: 'Australian airlines', words: ['QANTAS','JETSTAR','REX','VIRGIN'] },
      { name: 'Hotel groups', words: ['HYATT','HILTON','MARRIOTT','ACCOR'] },
      { name: 'Frequent flyer programs', words: ['AVIOS','KRISFLYER','ASIAMILES','VELOCITY'] } ] },
    { groups: [
      { name: '___stone', words: ['LIME','SAND','GRAVE','KEY'] },
      { name: 'Palindromes', words: ['LEVEL','RADAR','CIVIC','KAYAK'] },
      { name: 'One in other languages', words: ['UNO','DEUX','DREI','ICHI'] },
      { name: 'Sound like letters', words: ['SEA','TEA','BEE','PEA'] } ] }
  ];

  // Each Pyramid puzzle: 15 words in heap order, a full binary tree four layers deep.
  // nodes[0] is the top word, nodes[1] and nodes[2] its children, nodes[3..6] the next layer, nodes[7..14] the bottom layer.
  // Node i has children 2i+1 and 2i+2. A link reads downward: upper word + lower word = one compound word (FIRE + WORK = FIREWORK).
  // 'extra' lists other real compounds that use only words in the puzzle, so valid alternatives are never rejected.
  const PYRA = [
    { hint: 'Parent word first, then child', nodes: ['FIRE', 'WORK', 'FLY', 'SHOP', 'BOOK', 'PAPER', 'WHEEL', 'KEEPER', 'LIFT', 'MARK', 'WORM', 'CLIP', 'WEIGHT', 'CHAIR', 'BARROW'], extra: ['PAPER|WORK', 'BOOK|SHOP', 'BOOK|WORK', 'BOOK|KEEPER', 'CHAIR|LIFT'] },
    { hint: 'Parent word first, then child', nodes: ['SUN', 'LIGHT', 'FLOWER', 'HOUSE', 'SHIP', 'POT', 'BED', 'BOAT', 'KEEPER', 'YARD', 'WRECK', 'HOLE', 'LUCK', 'ROOM', 'TIME'], extra: ['BOAT|YARD', 'BOAT|HOUSE', 'SUN|BED', 'SUN|ROOM'] },
    { hint: 'Parent word first, then child', nodes: ['BLACK', 'BIRD', 'OUT', 'BATH', 'SONG', 'SIDE', 'DOOR', 'TUB', 'ROBE', 'BOOK', 'WRITER', 'WALK', 'SHOW', 'BELL', 'MAT'], extra: ['SONG|BIRD', 'WALK|OUT'] },
    { hint: 'Parent word first, then child', nodes: ['DAY', 'BREAK', 'TIME', 'WATER', 'OUT', 'TABLE', 'PIECE', 'FALL', 'MELON', 'SIDE', 'LINE', 'CLOTH', 'SPOON', 'WORK', 'MEAL'], extra: ['TIME|OUT', 'FALL|OUT', 'TIME|LINE', 'SIDE|LINE', 'MEAL|TIME', 'WATER|SIDE', 'WATER|LINE', 'WORK|OUT'] },
    { hint: 'Parent word first, then child', nodes: ['SAND', 'BOX', 'PAPER', 'CAR', 'WOOD', 'BACK', 'WORK', 'PORT', 'POOL', 'LAND', 'PILE', 'PACK', 'YARD', 'SHOP', 'LOAD'], extra: ['WOOD|WORK', 'WOOD|SHOP', 'CAR|LOAD', 'SAND|PILE', 'YARD|WORK'] },
    { hint: 'Parent word first, then child', nodes: ['WALL', 'PAPER', 'FLOWER', 'WORK', 'BACK', 'POT', 'BED', 'SHOP', 'LOAD', 'PACK', 'YARD', 'HOLE', 'LUCK', 'ROOM', 'TIME'], extra: ['WORK|ROOM', 'BACK|ROOM', 'YARD|WORK'] }
  ];

  // Circuit puzzles. Every loop is checked by test.js. 'solution' is one valid ring; any arrangement where each word's
  // last two letters equal the next word's first two letters (last word back to the first) also wins.
  const CIRCUIT = [
    {
      "id": "loop-01",
      "overlap": 2,
      "words": [
        "APPLE",
        "CHEST",
        "EXIST",
        "INDEX",
        "LEAST",
        "REACH",
        "RESIN",
        "STARE",
        "STORE",
        "STRAP"
      ],
      "solution": [
        "STRAP",
        "APPLE",
        "LEAST",
        "STARE",
        "REACH",
        "CHEST",
        "STORE",
        "RESIN",
        "INDEX",
        "EXIST"
      ]
    },
    {
      "id": "loop-02",
      "overlap": 2,
      "words": [
        "CHASE",
        "CHEST",
        "RANCH",
        "REACH",
        "SEIZE",
        "SENSE",
        "SERVE",
        "STORE",
        "VERSE",
        "ZEBRA"
      ],
      "solution": [
        "VERSE",
        "SENSE",
        "SEIZE",
        "ZEBRA",
        "RANCH",
        "CHEST",
        "STORE",
        "REACH",
        "CHASE",
        "SERVE"
      ]
    },
    {
      "id": "loop-03",
      "overlap": 2,
      "words": [
        "ANNEX",
        "CHEST",
        "ERROR",
        "EXIST",
        "LEAST",
        "ORGAN",
        "STATE",
        "STEER",
        "STYLE",
        "TEACH"
      ],
      "solution": [
        "CHEST",
        "STEER",
        "ERROR",
        "ORGAN",
        "ANNEX",
        "EXIST",
        "STYLE",
        "LEAST",
        "STATE",
        "TEACH"
      ]
    },
    {
      "id": "loop-04",
      "overlap": 2,
      "words": [
        "ANKLE",
        "ERROR",
        "LEASE",
        "ORGAN",
        "RAISE",
        "SEIZE",
        "SENSE",
        "SETUP",
        "UPPER",
        "ZEBRA"
      ],
      "solution": [
        "ZEBRA",
        "RAISE",
        "SETUP",
        "UPPER",
        "ERROR",
        "ORGAN",
        "ANKLE",
        "LEASE",
        "SENSE",
        "SEIZE"
      ]
    },
    {
      "id": "loop-05",
      "overlap": 2,
      "words": [
        "ANNEX",
        "ENTER",
        "ERROR",
        "EXTRA",
        "ORGAN",
        "RAISE",
        "SENSE",
        "SERVE",
        "SEVEN",
        "VERSE"
      ],
      "solution": [
        "VERSE",
        "SEVEN",
        "ENTER",
        "ERROR",
        "ORGAN",
        "ANNEX",
        "EXTRA",
        "RAISE",
        "SENSE",
        "SERVE"
      ]
    },
    {
      "id": "loop-06",
      "overlap": 2,
      "words": [
        "CHAIN",
        "ELITE",
        "EXIST",
        "INDEX",
        "REACH",
        "REBEL",
        "STARE",
        "TENTH",
        "THERE"
      ],
      "solution": [
        "REBEL",
        "ELITE",
        "TENTH",
        "THERE",
        "REACH",
        "CHAIN",
        "INDEX",
        "EXIST",
        "STARE"
      ]
    },
    {
      "id": "loop-07",
      "overlap": 2,
      "words": [
        "ARENA",
        "CHAIN",
        "EXTRA",
        "INDEX",
        "NAIVE",
        "RADAR",
        "RANCH",
        "SEIZE",
        "VERSE",
        "ZEBRA"
      ],
      "solution": [
        "RADAR",
        "ARENA",
        "NAIVE",
        "VERSE",
        "SEIZE",
        "ZEBRA",
        "RANCH",
        "CHAIN",
        "INDEX",
        "EXTRA"
      ]
    },
    {
      "id": "loop-08",
      "overlap": 2,
      "words": [
        "APPLE",
        "CYCLE",
        "ELITE",
        "LEAST",
        "LEVEL",
        "MERCY",
        "STRAP",
        "TENTH",
        "THEME"
      ],
      "solution": [
        "APPLE",
        "LEVEL",
        "ELITE",
        "TENTH",
        "THEME",
        "MERCY",
        "CYCLE",
        "LEAST",
        "STRAP"
      ]
    }
  ];

  return { LIST, CONNECTIONS, PYRA, CIRCUIT };
});
