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

  // Each puzzle: 7 words in solved tree order [root, L, R, LL, LR, RL, RR].
  // A link reads downward: upper word + lower word = one compound word (FIRE + WORK = FIREWORK).
  // 'extra' lists other real compounds that use only words in the puzzle, so valid alternatives are never rejected.
  const PYRA = [
    { hint: 'Parent word first, then child', nodes: ['FIRE','WORK','FLY','SHOP','BOOK','PAPER','WHEEL'], extra: ['PAPER|WORK', 'BOOK|SHOP', 'BOOK|WORK'] },
    { hint: 'Parent word first, then child', nodes: ['SUN','FLOWER','LIGHT','POT','BED','HOUSE','BULB'], extra: ['FLOWER|BULB', 'SUN|BED'] },
    { hint: 'Parent word first, then child', nodes: ['BLACK','BIRD','BOARD','SONG','CAGE','WALK','ROOM'], extra: ['SONG|BIRD'] },
    { hint: 'Parent word first, then child', nodes: ['RAIN','COAT','DROP','RACK','TAIL','OUT','KICK'], extra: ['RAIN|OUT', 'TAIL|COAT'] },
    { hint: 'Parent word first, then child', nodes: ['HOT','DOG','SPOT','HOUSE','FIGHT','LIGHT','CHECK'], extra: ['HOT|HOUSE', 'LIGHT|HOUSE'] },
    { hint: 'Parent word first, then child', nodes: ['SAND','PAPER','BOX','WEIGHT','CLIP','CAR','OFFICE'], extra: ['PAPER|BOX'] }
  ];


  // Each Circuit puzzle is a closed loop. Words are deliberately chosen with repeated 2-letter joins.
  const CIRCUIT = [
    { overlap: 2, words: ['CARGO','GOTHIC','ICING','NGOMA','MASON','ONSET','ETUDE','DEALER','ERICA'] },
    { overlap: 2, words: ['BRAIN','INLET','ETUDE','DEBUT','UTTER','TERMS','MSDOS','DOSSIER'] },
    { overlap: 2, words: ['CLOUD','ODDLY','LYRIC','ICONS','ONION','ONSET','SETTLE','LEMON'] },
    { overlap: 2, words: ['TRAIL','ILLICIT','ITSELF','ELFIN','INBOX','OXIDE','DEALER','ERODE'] }
  ];

// Sparse Waffle: only rows/cols 0,2,4 are words. H = [H0,H2,H4], V = [V0,V2,V4].
  const WAFFLE = [
    { H: ['marsh','river','horse'], V: ['marsh','river','horse'] },
    { H: ['lobby','brave','yield'], V: ['lobby','brave','yield'] }
  ];
  return { LIST, CONNECTIONS, PYRA, CIRCUIT, WAFFLE };
});
