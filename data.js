
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

  // Circuit puzzles: 12 words each, chosen so several words can follow each other (wrong joins look right).
  // test.js checks every ring. 'solution' is one valid ring; any arrangement where each word's last two letters equal
  // the next word's first two letters (last word back to the first) also wins.
  const CIRCUIT = [
    {
      "id": "loop-01",
      "overlap": 2,
      "words": [
        "alive",
        "dense",
        "edema",
        "edged",
        "marsh",
        "sense",
        "serve",
        "sewed",
        "shade",
        "venal",
        "verse",
        "verve"
      ],
      "solution": [
        "sewed",
        "edged",
        "edema",
        "marsh",
        "shade",
        "dense",
        "serve",
        "verve",
        "venal",
        "alive",
        "verse",
        "sense"
      ]
    },
    {
      "id": "loop-02",
      "overlap": 2,
      "words": [
        "delve",
        "dense",
        "erase",
        "erode",
        "genre",
        "geode",
        "refer",
        "sense",
        "serge",
        "sever",
        "verge",
        "verve"
      ],
      "solution": [
        "delve",
        "verve",
        "verge",
        "genre",
        "refer",
        "erase",
        "sever",
        "erode",
        "dense",
        "sense",
        "serge",
        "geode"
      ]
    },
    {
      "id": "loop-03",
      "overlap": 2,
      "words": [
        "alive",
        "chive",
        "geese",
        "genre",
        "reach",
        "sense",
        "serge",
        "serve",
        "venal",
        "verge",
        "verse",
        "verve"
      ],
      "solution": [
        "venal",
        "alive",
        "verse",
        "sense",
        "serve",
        "verve",
        "verge",
        "geese",
        "serge",
        "genre",
        "reach",
        "chive"
      ]
    },
    {
      "id": "loop-04",
      "overlap": 2,
      "words": [
        "defer",
        "delve",
        "erase",
        "erode",
        "geese",
        "geode",
        "sense",
        "serge",
        "serve",
        "sever",
        "verge",
        "verse"
      ],
      "solution": [
        "erode",
        "defer",
        "erase",
        "sense",
        "serge",
        "geode",
        "delve",
        "verge",
        "geese",
        "serve",
        "verse",
        "sever"
      ]
    },
    {
      "id": "loop-05",
      "overlap": 2,
      "words": [
        "alive",
        "edema",
        "edged",
        "erase",
        "manse",
        "sense",
        "serve",
        "sever",
        "sewed",
        "venal",
        "verse",
        "verve"
      ],
      "solution": [
        "sever",
        "erase",
        "sewed",
        "edged",
        "edema",
        "manse",
        "serve",
        "venal",
        "alive",
        "verve",
        "verse",
        "sense"
      ]
    },
    {
      "id": "loop-06",
      "overlap": 2,
      "words": [
        "chute",
        "edema",
        "edged",
        "matte",
        "sense",
        "serve",
        "sewed",
        "teach",
        "teeth",
        "these",
        "verse",
        "verve"
      ],
      "solution": [
        "teeth",
        "these",
        "serve",
        "verve",
        "verse",
        "sense",
        "sewed",
        "edged",
        "edema",
        "matte",
        "teach",
        "chute"
      ]
    },
    {
      "id": "loop-07",
      "overlap": 2,
      "words": [
        "defer",
        "delve",
        "erase",
        "erode",
        "geese",
        "geode",
        "sense",
        "serge",
        "serve",
        "sewer",
        "verge",
        "verse"
      ],
      "solution": [
        "erode",
        "defer",
        "erase",
        "sense",
        "serge",
        "geode",
        "delve",
        "verge",
        "geese",
        "serve",
        "verse",
        "sewer"
      ]
    },
    {
      "id": "loop-08",
      "overlap": 2,
      "words": [
        "alive",
        "chive",
        "geese",
        "genre",
        "retch",
        "sense",
        "serge",
        "serve",
        "venal",
        "verge",
        "verse",
        "verve"
      ],
      "solution": [
        "venal",
        "alive",
        "verse",
        "sense",
        "serve",
        "verve",
        "verge",
        "geese",
        "serge",
        "genre",
        "retch",
        "chive"
      ]
    },
    {
      "id": "loop-09",
      "overlap": 2,
      "words": [
        "alive",
        "edema",
        "edged",
        "erase",
        "manse",
        "sense",
        "serve",
        "sewed",
        "sewer",
        "venal",
        "verse",
        "verve"
      ],
      "solution": [
        "sewer",
        "erase",
        "sewed",
        "edged",
        "edema",
        "manse",
        "serve",
        "venal",
        "alive",
        "verve",
        "verse",
        "sense"
      ]
    }
  ];

  // Words accepted as Wordle guesses (3386 everyday words, including every possible answer).
  // A guess not in this list is checked once against an online dictionary.
  const VALID = (
    'aback abate abbey abbot abhor abide abler abode abort about above abuse abuzz abyss ' +
    'ached aches acids acres acrid acted actor acute adage adapt added adept adman admen ' +
    'admit adobe adopt adore adorn adult aegis affix afire afoot afoul after again agave ' +
    'agent agile aging agony agree ahead aided aides aimed aired aisle alarm album alert ' +
    'algae alias alibi alien align alike alive allay alley allot allow alloy aloes aloft ' +
    'alone along aloof aloud alpha altar alter amahs amass amaze amber amble amend amide ' +
    'amigo amino amiss amity among ample amply amuse angel anger angle angry angst anime ' +
    'anion anise ankle annex annoy annum anode antic antsy anvil aorta apace apart aping ' +
    'apple apply apron apses aptly arcus ardor areas arena argon argot argue arias arise ' +
    'armed armor aroma arose array arrow arson artsy ashen ashes aside asked askew aspen ' +
    'assay asses asset astir atoms atone attic audio audit augur aunts aural autos avail ' +
    'avant avert avian avoid await awake award aware awash awful awoke axial axiom axles ' +
    'azure babel babes backs bacon badge badly bagel baggy baked baker bakes bales balks ' +
    'balls balmy banal bands bangs banjo banks barbs bards bared barge barks barns baron ' +
    'based baser bases basic basil basin basis basso batch bated bathe baths baton bawdy ' +
    'bayed beach beads beady beams beans beard bears beast beats bebop beech beefs beefy ' +
    'beeps beers beets began begat beget begin begot begun beige being belch belie bells ' +
    'belly below belts bench bends beret bergs berms berry berth beset betas bevel bevor ' +
    'bible bicep bided biker bikes bilge bills binds binge bingo biped birch birds birth ' +
    'bison bitch biter bites blabs black blade blame bland blank blase blast blaze bleak ' +
    'bleat blebs bleed blend bless blest blind blini blink blips bliss blitz bloat block ' +
    'blocs bloke blond blood bloom blots blown blows blues bluff blunt blurt blush board ' +
    'boast boats boded bodes bogey bogus boies boils bolts bombs bonds boned bones bongo ' +
    'bonus booby booed books booms boors boost booth boots booty booze borax bored borer ' +
    'bores borne bosom bough bound bouts bowed bowel bower bowls boxed boxer boxes brace ' +
    'brags brain brake brand brash brass brats brave brawl bread break breed brews bribe ' +
    'brick bride brief brine bring brink briny brisk broad broil broke bronc brood brook ' +
    'broom broth brown brows brunt brush brute bucks buddy budge buffs buggy bugle build ' +
    'built bulbs bulge bulks bulky bulls bully bumps bumpy bunch bunco bunko bunks bunny ' +
    'buoys burgs burly burns burnt burrs burst bused buses bushy busts butts buxom buyer ' +
    'bylaw bytes byway cabal cabin cable cacao cache cacti cadet cadge cadre cafes caged ' +
    'cages cagey caked cakes calls camel cameo camps canal candy canny canoe canon canto ' +
    'caper capes capos carat cards cared cares cargo carob carol carps carry carte carts ' +
    'carve cased cases casks caste casts catch cater catty cause caved caves cease cedar ' +
    'ceded cells cents chafe chaff chain chair chalk champ chant chaos chaps charm chart ' +
    'chary chase chasm chats cheap cheat check cheek cheer chefs chess chest chews chick ' +
    'chide chief child chili chill chimp china chins chips chirp chive choir choke chomp ' +
    'chops chord chore chose chuck chugs chump chums chunk churn chute cider cigar cilia ' +
    'cinch circa cited cites civic civil claim clamp clams clang claps clash clasp class ' +
    'claws clays clean clear cleat cleft clerk click cliff climb clime cling clips cloak ' +
    'clock clods clogs clone close cloth clots cloud clout clove clown clubs cluck clues ' +
    'clump clung coach coals coast coats cobra cocky cocoa coded codes coeds coils coily ' +
    'coins colas colds colon color colts comas combo comer comes comet comfy comic comma ' +
    'condo cones conic cooks cools cooly coops copes copra coral cords cores corks corns ' +
    'corny corps costs couch cough could count coupe coups court cover coves covet cowed ' +
    'cower coyly crabs crack craft crags cramp crams crane crank crash crass crate crave ' +
    'crawl craze crazy creak cream credo creed creek creep crepe crept crest crews cribs ' +
    'cried cries crime crimp crisp croak crone crony crook croon crops cross crowd crown ' +
    'crows crude cruel crumb crush crust crypt cubed cubes cubic cuffs culpa cults cumin ' +
    'cupid curbs curds cured cures curio curls curly curry curse curve curvy cuter cycle ' +
    'cynic cysts czars daddy daily dairy daisy dales dally damed damps dance dandy dared ' +
    'dares darts dated dates datum daunt dawns dazed deals dealt deans death debit debts ' +
    'debut decal decay decks decor decoy decry deeds deems deeps defer delay delta delve ' +
    'demon demur dense dents depot depth derby desks deter devil dials diary diets digit ' +
    'dimes dimly dined diner dines dingo dingy dippy dirge dirty disco discs disks ditch ' +
    'ditto ditty divan dived diver dives dizzy docks dodge doers dogma doing dolce doled ' +
    'doles dolls domed domes donna donor donut dooms doors doped doper dosed doses doted ' +
    'doubt dough douse doves dowdy dowel dower downs dowry dozed dozen draft drags drain ' +
    'drake drama drams drank drape drawl drawn draws dread dream dregs dress dried drier ' +
    'dries drift drill drink drips drive drone drool droop drops dross drove drown drugs ' +
    'drums drunk dryer dryly duces ducks ducts duels duets dukes dulls dully dummy dumps ' +
    'dumpy dunes duped dupes dusks dusky dusts dusty dwarf dwell dwelt dying eager eagle ' +
    'eared early earns earth eased easel eases eaten ebbed ebony eclat edema edged edges ' +
    'edict edits eerie egged eight eject eking elbow elder elect elegy elfin elide elite ' +
    'elope email ember emcee emits emote empty enact ended endow enemy enjoy ennui ensue ' +
    'enter entre entry envoy epics epoch epoxy equal equip erase erect erode erred error ' +
    'erupt essay ether ethic ethos ethyl evade evens event every evict evils evoke exact ' +
    'exalt exams excel execs exert exile exist exits expel extra exude eying fable faced ' +
    'faces facet facts faded fades faery fails faint fairs fairy faith faked faker fakes ' +
    'falls false famed fames fancy fangs fanny farce fared fares farms fatal fates fatty ' +
    'fault fauna favor faxed faxes fazed fears feast feats fecal feeds feels feint fella ' +
    'felon fence ferns ferry fetal fetch feted fetes fetid fetus feuds fever fewer fiber ' +
    'ficus field fiend fiery fifth fifty fight filed files filet fills filly films filmy ' +
    'filth final finch finds fined finer fines fired fires firms first fishy fists fives ' +
    'fixed fixes fizzy fjord flags flail flair flake flaky flame flank flaps flare flash ' +
    'flask flats flaws fleas fleck flees fleet flesh flick flied flier flies fling flint ' +
    'flips flirt float flock floes flood floor flops flora flour flout flown flows fluff ' +
    'fluid fluke flung flunk flush flute flyer foals foams foamy focal focus foggy folds ' +
    'folio folks folly fonts foods fools foray force fords forge forgo forks forms forte ' +
    'forth forts forty forum found fours foxes foyer frail frame franc frank fraud freak ' +
    'freed freer frees fresh frets friar fried fries frill frock frogs front frost froth ' +
    'frown froze fruit fudge fuels fully fumed fumes funds fungi funky funny furor furry ' +
    'fused fuses fussy fusty fuzzy gable gages gaily gains gaits galls gamer games gamma ' +
    'gamut gangs gaped gases gasps gassy gates gaudy gauge gaunt gauss gauze gavel gawky ' +
    'gazed gazer gazes gears geeks geese genes genie genii genre genus geode germs ghost ' +
    'ghoul giant gibes giddy gifts gilts girds girls girth given giver gives gizmo glade ' +
    'gland glare glass glaze gleam glean glees glide glint glitz gloat globe gloom glory ' +
    'gloss glove glows glued glues gluey gluts gnash gnome goals goats going golds golfs ' +
    'golly goods goody gooey goofy goons goose gored gorge gouge gourd gouty gowns grabs ' +
    'grace grade grads graft grail grain grams grand grant grape graph grasp grass grata ' +
    'grate grave gravy grays graze great greed green greet grief grill grime grimy grind ' +
    'grins gripe grips grist grits groan groin groom grope gross group grove growl grown ' +
    'grows grubs gruel gruff grunt guard guava guess guest guide guild guile guilt guise ' +
    'gulag gully gulps gumbo gummy gunny gurus gushy gusto gusts gusty gutsy gypsy gyros ' +
    'habit hacks hails hairs hairy halls halos halts halve hands handy hangs hanky happy ' +
    'hardy harem hares harms harps harpy harry harsh hasps haste hasty hatch hated hates ' +
    'hauls haunt haven haves havin havoc hawks hazel hazes heads heady heals heaps heard ' +
    'hears heart heath heats heave heavy hedge heeds heels hefty heirs heist helix hello ' +
    'hells helps hence herbs herds hewed hides highs hiked hiker hikes hilar hills hilly ' +
    'hilum hinge hints hippo hired hires hitch hives hoard hobby hobos hoist hokey holds ' +
    'holed holes holly homer homes homey homie honed honey honor hooch hoods hoofs hooks ' +
    'hoops hoots hoped hopes horde horns horse hoses hosts hotel hotly hound hours house ' +
    'hovel hover howdy howls hubby human humid humor hunch hunts hurls hurry hurts husks ' +
    'husky hutch hyena hymen hymns hyped hyper icing icons ideal ideas idiom idiot idled ' +
    'idler idols idyll igloo ileum iliac image imply inane inapt inbox incur index inept ' +
    'inert infer ingot inlay inlet inner input inset inure ionic irate irked irons irony ' +
    'issue itchy items ivory jacks jaded jails jakes jazzy jeans jeers jelly jerks jerky ' +
    'jests jetty jewel jibes jiffy jihad jinks jocks joins joint joked joker jokes jolly ' +
    'jolts joust jowls jowly judge juice juicy julep jumbo jumps jumpy junks junta juror ' +
    'kanji karma kayak kazoo kebab kebob keeps keyed khaki kicks kills kilns kilts kinds ' +
    'kings kiosk kitty knack knead kneel knees knell knelt knife knobs knock knoll knots ' +
    'known knows koala kooky kraft krona kudos kylix label labor laced laces lacks laden ' +
    'ladle lairs laity lakes lambs lamps lance lands lanes lanky lapel lapse large larks ' +
    'larva laser lasso lasts latch later latex lathe laugh lawns layer leach leads leafy ' +
    'leaks leaky leans leaps leapt learn lease leash least leave ledge leech leery legal ' +
    'leggy lemon lends letup levee level lever liars libel licit licks liens lifer lifes ' +
    'lifts light liked likee liken likes lilac limbo limbs limes limit limos limps lined ' +
    'linen liner lines lingo links lints lions lipid liras lists liter lithe lived liver ' +
    'lives livid llama loads loans loath lobby lobes local locks locus lodge lofts lofty ' +
    'logic logos loins loner longs looks looms loony loops loopy loose loped lopes lords ' +
    'loser loses lotus louse lousy loved lover loves lovin lower lowly loyal lucid lucks ' +
    'lucky lulls lumen lumps lumpy lunar lunch lunge lungs lurch lured lures lurid lurks ' +
    'lusts lusty lying lymph lynch lyric macaw macho madam madly mafia magic maids mails ' +
    'mains maize major maker makes males malls manes mango mania manic manly manna manor ' +
    'manse maple march mares maria marks marry marsh marts masks mason masts match mated ' +
    'mater mates matte mauve maven maxim maybe mayor mazes meals mealy means meant meats ' +
    'meaty mecca medal media meets melds melee melon melts memos menus mercy merge merit ' +
    'merry messy metal meted meter metre metro mewed mezzo micro midst might miles milks ' +
    'milky mills mimic mince minds mined miner mines minor mints minus mired mirth miser ' +
    'missy mists misty miter mites mitre mixed mixer mixes moans modal model modem modes ' +
    'modus mogul moire moist molal molar molds moldy moles money monic monks month moods ' +
    'moody mooed moons moors moose moral mores morph mosey mossy motel motet moths motif ' +
    'motor motto mould mound mount mourn mouse mousy mouth moved mover moves movie mowed ' +
    'mower moxie mucky mucus muddy muffs mufti muggy mulch mules mulls multi mumbo mummy ' +
    'munch mural murky mused muses mushy music musts musty muted mutts myrrh myths nadir ' +
    'nails naive naked named names nanny narco nasal nasty natal natch natty naval navel ' +
    'nears necks needs needy nerds nerdy nerve nervy nests never newel newer newly nexus ' +
    'nicer niche niece nifty night ninja ninth nixed noble nobly nodes noise noisy nomad ' +
    'nonce nooks noons noose norms north nosed noses notch noted notes nouns novel nudes ' +
    'nudge nukes nurse nutty nylon nymph oaken oases oasis oaths obese obeys occur ocean ' +
    'ocher ochre oddly odors offal offer often ogled ogles ohmic oiled oiler olden older ' +
    'olive omens omits onion onset oomph oozed opens opera opium opted optic orate orbit ' +
    'order organ other otter ought ounce outdo outer ovals ovens overt owing owned owner ' +
    'oxide ozone paced pacer paces packs pacts paddy paean pagan pager pages pails pains ' +
    'paint pairs paled paleo paler pales palms palsy panda panel panes pangs panic pansy ' +
    'pants papal paper pared parka parks parry parts party pasha passe pasta paste pasty ' +
    'patch pater paths patio patsy pause paved paves pawed pawns payer peace peach peaks ' +
    'peaky peals pearl pears pecan pecks pedal peels peers pelts penal pence penny peppy ' +
    'perch peril perks perky pesky pesos pests petal peter petty phase phone phony photo ' +
    'phyla piano picks picky piece piers piety piggy piker piled piles pills pilot pimps ' +
    'pinch pines pinks pinto pints pious piped piper pipes pique pitch pithy pivot pixel ' +
    'pizza place plaid plain plane plank plans plant plasm plate plays plaza plead pleas ' +
    'pleat plied plies plods plots plows ploys pluck plugs plumb plume plump plush poach ' +
    'poems poets point poise poked poker pokes pokey polar poles polio polka polls ponds ' +
    'pooch pools popes poppy porch pored pores ports posed poser poses posse posts potty ' +
    'pouch pound pours power prams prank prawn prays preen press price prick pride pries ' +
    'prima prime print prior prism privy prize probe prods profs prone proof props prose ' +
    'prosy proud prove prowl proxy prude prune psalm puffs puffy pulls pulse pumas pumps ' +
    'punch punks punky punts pupil puppy purge purrs purse pushy putty quack quail quake ' +
    'qualm quart quash queen queer quell query quest queue quick quiet quill quilt quips ' +
    'quirk quirt quite quits quota quote rabbi rabid raced races racks radar radii radio ' +
    'radon rafts raged rages raids rails rains rainy raise rajah raked rally ramps ranch ' +
    'range rangy ranks raped rapes rapid rarer rasps raspy rated rates ratio ratty raved ' +
    'raven raves rayon razed razor reach react reads ready realm reams reaps rearm rears ' +
    'rebel rebut recap recur recut reeds reedy reefs refer regal reign reins relax relay ' +
    'relic remit renal renew rents repay repel reply rerun reset resin rests retch retro ' +
    'retry reuse revel rheum rhino rhyme rider rides ridge riffs rifle rifts right rigid ' +
    'rigor riled riles rinds rings rinse riots ripen risen rises risks risky rites ritzy ' +
    'rival riven river rivet roach roads roams roars roast robed robes robin robot rocks ' +
    'rocky rodeo rogue roles rolls romps roofs rooks rooms roomy roost roots roped ropes ' +
    'roses rotor rouge rough round rouse route roved rowdy rowed royal ruble ruddy rugby ' +
    'ruins ruled ruler rules rumen rummy rumor runes runny rupee rural russe rusty saber ' +
    'sable sabre sacks sadly safer sages saggy sails saint salad sales sally salon salsa ' +
    'salts salty salve salvo sands sandy saner sappy sassy satin sauce saucy sauna saute ' +
    'saved saver saves savor savvy sayed scabs scads scald scale scalp scamp scams scans ' +
    'scant scape scare scarf scars scary scene scent scion scoff scold scoop scope score ' +
    'scorn scour scout scowl scram scrap screw scrim scrub scuba scuff seals seams seamy ' +
    'seats sects sedan seeds seedy seeks seems seers segue seize sells semen sends sense ' +
    'sepia septa serfs serge serum serve servo setup seven sever sewed sewer sexes shack ' +
    'shade shady shaft shags shake shaky shale shall shalt shame shams shank shape shard ' +
    'share shark sharp shave shawl sheaf shear sheds sheen sheep sheer sheet sheik shelf ' +
    'shell shied shies shift shill shims shine shins shiny ships shirk shirt shoal shock ' +
    'shoes shoji shone shook shoot shops shore shorn short shots shout shove shown shows ' +
    'showy shred shrew shrub shrug shtik shuck shuns shunt shush shuts shyly sided sides ' +
    'sidle siege sieve sighs sight signs silks silky sills silly silos since sings sinks ' +
    'sinus sired siren sites situs sixth sixty sized sizes skate skeet skein skids skier ' +
    'skies skiff skill skimp skims skins skips skirt skits skulk skull skunk slabs slack ' +
    'slain slams slang slant slaps slash slate slats slave sleek sleep sleet slept slice ' +
    'slick slide slime slimy sling slink slips slits slogs sloop slope slosh sloth slots ' +
    'slows slugs slump slums slung slunk slurp slurs slush slyly smack small smart smash ' +
    'smear smell smelt smile smirk smock smoke smoky snack snafu snags snail snake snaps ' +
    'snare snarl sneak sneer snick snide sniff snipe snips snobs snoop snore snort snout ' +
    'snows snowy snuck snuff soaps soapy soars sober socks sodas sofas softy soggy soils ' +
    'solar soles solid solos solve sonar songs sonic sooty sores sorry sorts souls sound ' +
    'soups soupy sours south sowed space spade spans spare spark spasm spate spats spawn ' +
    'speak spear speck specs speed spell spend spent sperm spice spicy spied spiel spies ' +
    'spike spill spine spins spiny spire spite spits splat split spoil spoke spoof spook ' +
    'spool spoon spore sport spots spout spray spree sprig sprue spuds spume spunk spurn ' +
    'spurs spurt squad squat squaw squid stabs stack staff stage stags staid stain stair ' +
    'stake stale stalk stall stamp stand stank staph stare stark stars start stash state ' +
    'stats stave stays stead steak steal steam steed steel steep steer stein stems steps ' +
    'stern stews stick stiff still sting stink stint stirs stock stoic stoke stole stomp ' +
    'stone stony stood stool stoop stops store storm story stout stove strap straw stray ' +
    'strip strum strut stubs stuck studs study stuff stump stung stunk stunt style suave ' +
    'sucks suede sugar suing suite suits sulks sulky sumac sunny super supra surge surly ' +
    'sushi swami swamp swank swans swaps swarm swart swath swear sweat sweep sweet swell ' +
    'swept swift swims swine swing swipe swirl swoon swoop sword swore sworn swung syrup ' +
    'tabby table taboo tacit tacks tacky tacos taffy tails taint taken taker takes tales ' +
    'talks talky tally talon tamer tango tangy tanks tansy tapas taped taper tapes tapir ' +
    'tapis tardy tarot tarry tasks taste tasty taunt tawny taxed taxes taxis teach teams ' +
    'tears tease teats teddy teems teens teeth telex tells tempo temps tempt tends tenet ' +
    'tenor tense tenth tents tepid terms terra terry terse tests testy texts thank thats ' +
    'thaws theft their theme there these thick thief thigh thine thing think third thong ' +
    'thorn those three threw throw thuds thugs thumb thump thunk thyme tiara ticks tidal ' +
    'tides tiers tiffs tiger tight tilde tiled tiles tilth tilts timed timer times timid ' +
    'tines tinny tints tipsy tired tires titan titer title titre toady toast today toils ' +
    'token tolls tombs tomes tonal toned toner tones tongs tonic tools tooth topaz topic ' +
    'torch torso torts total toted totem touch tough tours touts towed towel tower towns ' +
    'toxic toxin trace track tract trade trail train trait tramp traps trash trawl trays ' +
    'tread treat trees treks trend triad trial tribe trice trick tried tries trill trims ' +
    'tripe trips trite troll troop trots trout trove truce truck truer truly trump trunk ' +
    'trust truth tryst tubes tufts tulip tulle tummy tumor tuned tunes tunic turbo turns ' +
    'tusks tutor twang tweak tweed tweet twice twigs twine twins twirl twist tying typed ' +
    'types udder ulcer ultra umber umbra unagi uncap uncle uncut under undid undue unfit ' +
    'unify union unite units unity unlit unmet untie until unwed unzip upped upper upset ' +
    'urban urged urges urine usage users usher using usual usurp utero utter vague valet ' +
    'valid valor value valve vapor vases vault vaunt veers vegan veils veins veldt venal ' +
    'venom vents venue verbs verge versa verse verso verve vests vexed vexes vibes vicar ' +
    'vices video views vigil vigor villa vines vinyl viola viper viral virus visas visit ' +
    'visor vista vital vitro vivid vixen vocal vodka vogue voice voids volts vomit voted ' +
    'voter votes vouch vowed vowel vying wacky waded wafer waged wager wages wagon wails ' +
    'waist waits waive waked wakes wales walks walls waltz waned wanes wants wards wares ' +
    'warms warns warts warty warys waste watch water watts waved waver waves waxed waxen ' +
    'wears weary weave wedge weeds weeks weeps weigh weird weirs wells welts wetly whack ' +
    'whale wharf wheat wheel whelk whelp where which whiff while whims whine whips whirl ' +
    'whisk white whole whoop whose widen wider widow width wield wiles wills wince winds ' +
    'windy wined wines wings winks winos wiped wipes wired wires wiser wisps wispy witch ' +
    'witty wives wizen woken woman wombs women woods woody wooed wools woozy words wordy ' +
    'works world worms wormy worry worse worst worth would wound woven wowed wrack wraps ' +
    'wrath wreak wreck wrest wring wrist write writs wrong wrote wrung wryly xenon xylem ' +
    'yacht yards yarns yawns yearn years yeast yells yelps yenta yield yodel yokel young ' +
    'yours youth yucca yummy zeals zebra zeros zesty zilch zoned zones zooms '
  ).trim().split(/\s+/);

  return { LIST, VALID, CONNECTIONS, PYRA, CIRCUIT };
});
