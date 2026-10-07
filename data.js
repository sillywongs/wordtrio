
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

  // Each puzzle: 7 words in solved tree order [root, L, R, LL, LR, RL, RR]. Every parent+child forms a compound or phrase.
  const PYRA = [
    { hint: 'Compound words', nodes: ['FIRE','WORK','FLY','SHOP','BOOK','PAPER','WHEEL'] },
    { hint: 'Compound words', nodes: ['SUN','FLOWER','LIGHT','POT','BED','HOUSE','BULB'] },
    { hint: 'Compound words', nodes: ['BLACK','BIRD','BOARD','SONG','CAGE','WALK','ROOM'] },
    { hint: 'Compound words', nodes: ['RAIN','COAT','DROP','RACK','TAIL','OUT','KICK'] },
    { hint: 'Compound words', nodes: ['HOT','DOG','SPOT','HOUSE','FIGHT','LIGHT','CHECK'] },
    { hint: 'Compound words', nodes: ['SAND','PAPER','BOX','WEIGHT','CLIP','CAR','OFFICE'] }
  ];
  return { LIST, CONNECTIONS, PYRA };
});
