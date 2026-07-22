// Daily rotating cooking tip.
//
// Rotation rules:
//   • One tip per calendar day — it stays the same all day and flips to the
//     next at LOCAL midnight (a new tip every 24h), so `getDailyTip()` is
//     stable for everyone viewing on the same date.
//   • The walk order is a fixed, seeded shuffle of the whole list, so
//     consecutive days jump around (categories interleaved) instead of
//     marching straight down the array — it feels randomized.
//   • Because that order is a full permutation, no tip repeats until every
//     other tip has been shown. With 250 tips that's ~8 months — comfortably
//     no repeats within any one-month window.
//
// The shuffle uses a seeded PRNG (not Math.random) so the order is identical
// across users, sessions, and reloads.

export const COOKING_TIPS = [
  // ── Knife skills & prep (30) ──────────────────────────────────────────
  { emoji: "🔪", text: "A sharp knife is safer than a dull one — it needs less force and slips less" },
  { emoji: "✋", text: "Curl your fingertips into a claw so the flat of the blade rides your knuckles, not your nails" },
  { emoji: "🧅", text: "Leave the root end on an onion while you slice — it holds the layers together" },
  { emoji: "🪵", text: "Put a damp paper towel under your cutting board so it can't slide" },
  { emoji: "🔪", text: "Let the knife do the work — long slicing strokes beat downward chopping for clean cuts" },
  { emoji: "🧄", text: "Smash a garlic clove with the flat of your knife and the skin slips right off" },
  { emoji: "🥕", text: "Cut a thin slice off a round vegetable to make a flat, stable base before dicing" },
  { emoji: "🌿", text: "Roll herbs into a tight bundle and slice across for a quick chiffonade" },
  { emoji: "🔪", text: "Hone your knife on a steel before each use; sharpen on a stone every few months" },
  { emoji: "🍅", text: "Use a serrated knife for tomatoes and bread — it saws instead of crushing" },
  { emoji: "🧊", text: "Chill soft cheese or raw bacon briefly in the freezer for cleaner cuts" },
  { emoji: "🥣", text: "Keep a scrap bowl on the counter so peelings don't pile up on your board" },
  { emoji: "🥑", text: "Tap the pit with the heel of the blade, twist, and lift — safer than digging with a spoon" },
  { emoji: "🧅", text: "Cut onions from tip to root, with the grain, for pieces that hold their shape when cooked" },
  { emoji: "🔪", text: "Wipe the blade with a towel between sticky cuts so food stops dragging" },
  { emoji: "🥒", text: "Cut into batons first, then cross-cut — that's how you get an even dice" },
  { emoji: "🫚", text: "Peel ginger with the edge of a spoon to save the flesh just under the skin" },
  { emoji: "🧂", text: "A pinch of salt on the board keeps garlic from sliding around as you mince" },
  { emoji: "🔪", text: "Keep the tip down and rock the blade for fast, controlled mincing" },
  { emoji: "🍋", text: "Roll citrus firmly on the counter before juicing to break the pulp and free more juice" },
  { emoji: "🥩", text: "Slice meat against the grain to shorten the fibers and keep every bite tender" },
  { emoji: "🧊", text: "Partly freeze meat for 20 minutes before slicing it paper-thin" },
  { emoji: "😢", text: "Chill onions for 15 minutes before cutting to cut down on the tears" },
  { emoji: "🔪", text: "Never try to catch a falling knife — step back and let it drop" },
  { emoji: "🥔", text: "Soak cut potatoes in cold water to rinse off surface starch before cooking" },
  { emoji: "🧺", text: "Mise en place: measure and cut everything before you turn on a single burner" },
  { emoji: "➡️", text: "Cut away from your body and keep your guiding hand tucked behind the blade" },
  { emoji: "🥬", text: "Stack and roll leafy greens before slicing to get through them fast" },
  { emoji: "🧀", text: "A vegetable peeler makes quick shavings of hard cheese and chocolate too" },
  { emoji: "🧼", text: "Wash knives by hand right away — the dishwasher dulls and pits the edge" },

  // ── Heat & cooking techniques (30) ────────────────────────────────────
  { emoji: "🔥", text: "Heat the pan, then the oil, then the food — that order stops sticking" },
  { emoji: "🍳", text: "Don't move food the instant it hits the pan; let a crust form and it releases on its own" },
  { emoji: "💧", text: "A drop of water should skitter and dance when the pan is hot enough to sear" },
  { emoji: "🥘", text: "Don't crowd the pan — too much food drops the heat and steams instead of browning" },
  { emoji: "🔥", text: "Medium heat cooks most things better than high, which just burns the outside" },
  { emoji: "🍖", text: "Sear thick cuts, then finish them in the oven so the inside cooks without scorching" },
  { emoji: "🍷", text: "Deglaze with a splash of wine, stock, or water to lift the browned flavor off the pan" },
  { emoji: "🧈", text: "Add a knob of butter at the end of a sear and baste by spooning it over the food" },
  { emoji: "♨️", text: "Carryover heat keeps cooking food after it leaves the pan — pull it just shy of done" },
  { emoji: "🥩", text: "Rest meat off the heat so the juices settle back in instead of running out" },
  { emoji: "🥦", text: "Steaming keeps more nutrients than boiling for most vegetables" },
  { emoji: "🍚", text: "A tight lid and low heat are the whole secret to fluffy rice" },
  { emoji: "🥡", text: "Get the pan screaming hot for stir-fries and keep the food moving" },
  { emoji: "🫧", text: "A gentle simmer makes tender stews; a hard boil makes the meat tough" },
  { emoji: "🥓", text: "Start bacon in a cold pan so the fat renders slowly and it crisps evenly" },
  { emoji: "🍳", text: "Low heat and constant stirring give you creamy, custardy scrambled eggs" },
  { emoji: "🌡️", text: "An instant-read thermometer beats guessing — 165°F for chicken, every time" },
  { emoji: "🔥", text: "Roast at 425°F or higher to caramelize; low heat just dries food out" },
  { emoji: "🍲", text: "Brown the meat and vegetables before adding liquid — that fond is pure flavor" },
  { emoji: "🧊", text: "Blanch, then shock vegetables in ice water to lock in bright color and crunch" },
  { emoji: "🧅", text: "Sauté aromatics like onion and garlic first to build a base of flavor" },
  { emoji: "🥩", text: "Don't flip constantly — one good sear per side beats endless fiddling" },
  { emoji: "🍤", text: "Pat food bone-dry before it hits hot oil to avoid dangerous splattering" },
  { emoji: "🌡️", text: "Keep frying oil at 350–375°F; too cool and the food turns greasy" },
  { emoji: "🌀", text: "Convection ovens cook faster — drop the temperature about 25°F" },
  { emoji: "🐟", text: "Use nonstick for eggs and delicate fish; cast iron or stainless for a hard sear" },
  { emoji: "🌰", text: "Toast nuts and spices in a dry pan until fragrant to wake up their oils" },
  { emoji: "💨", text: "Turn on the vent and cook hot — a little smoke means you're getting a real sear" },
  { emoji: "🥩", text: "Reverse-sear thick steaks: low oven first, hot pan last, for edge-to-edge pink" },
  { emoji: "🥔", text: "Parboil potatoes and rough up the edges before roasting for maximum crunch" },

  // ── Seasoning & flavor building (30) ──────────────────────────────────
  { emoji: "🧂", text: "Season in layers as you cook, not all at the end — it tastes fuller and rounder" },
  { emoji: "🥄", text: "Taste constantly and adjust; your own palate is the most important tool you own" },
  { emoji: "🍋", text: "If a dish tastes flat, it usually needs acid — lemon, vinegar, or a tomato" },
  { emoji: "🧂", text: "A tiny pinch of salt makes sweet things taste sweeter, not salty" },
  { emoji: "⚖️", text: "Balance the tastes: salty, sweet, sour, bitter, and savory umami" },
  { emoji: "🧈", text: "Fat carries flavor — a little butter or oil helps seasonings spread across the dish" },
  { emoji: "🍯", text: "A touch of sugar or honey tames a sauce that's gone too sour or bitter" },
  { emoji: "🍅", text: "Bloom garlic, spices, and tomato paste in oil to deepen and round their flavor" },
  { emoji: "🧂", text: "Salt from up high so it scatters evenly instead of landing in one spot" },
  { emoji: "🌿", text: "Add hardy herbs like rosemary early and delicate ones like basil at the very end" },
  { emoji: "🐟", text: "A splash of fish sauce adds deep savory backbone without tasting fishy" },
  { emoji: "🧀", text: "Simmer a parmesan rind in soup or sauce for rich umami — don't toss it" },
  { emoji: "🥄", text: "Under-salted food tastes boring; taste before you add more, not after" },
  { emoji: "🍋", text: "Zest carries more punch than juice — use both for the brightest citrus flavor" },
  { emoji: "🥩", text: "Salt meat well ahead so the seasoning works its way all the way through" },
  { emoji: "🧅", text: "Caramelized onions add sweet, savory depth to almost anything you cook" },
  { emoji: "🫙", text: "Toast whole spices and grind them fresh — pre-ground fades fast" },
  { emoji: "🍄", text: "Dried mushrooms and their soaking liquid are an umami bomb for sauces and stews" },
  { emoji: "🧂", text: "Finish with flaky salt right before serving for a pop of crunch and seasoning" },
  { emoji: "🍶", text: "Miso, soy, anchovy, and tomato paste are your umami cheat codes" },
  { emoji: "🧊", text: "Season cold foods like dressings harder — cold mutes flavor" },
  { emoji: "🍷", text: "A splash of wine or vinegar added early cooks off its harshness and leaves depth" },
  { emoji: "🧄", text: "Roasted garlic is mellow and sweet; raw garlic is sharp — pick one on purpose" },
  { emoji: "🌿", text: "Save herb stems for stocks and sauces — they're packed with flavor" },
  { emoji: "🥜", text: "A spoonful of nut butter or tahini adds body and richness to a sauce" },
  { emoji: "☕", text: "A little cocoa or coffee deepens the flavor of chili and beef stews" },
  { emoji: "🍆", text: "Salt eggplant and cucumber and let them weep to draw out bitterness and water" },
  { emoji: "🍊", text: "Grate a little orange or lemon zest into savory dishes to lift them" },
  { emoji: "🌶️", text: "Add heat gradually — you can always add more chili but can't take it out" },
  { emoji: "🥗", text: "Rub a cut garlic clove around the salad bowl for a whisper of flavor" },

  // ── Baking & pastry (25) ──────────────────────────────────────────────
  { emoji: "⚖️", text: "Weigh your ingredients — baking is chemistry, and a scooped cup of flour varies wildly" },
  { emoji: "🧈", text: "Room-temperature butter creams into fluffy peaks; cold butter just won't" },
  { emoji: "🧊", text: "Cold butter makes flaky pastry — keep it chilled right until it hits the oven" },
  { emoji: "🥣", text: "Stop mixing the moment the flour disappears, or you'll build tough, chewy gluten" },
  { emoji: "🌡️", text: "Room-temperature eggs and dairy blend into smoother, more even batters" },
  { emoji: "🍞", text: "Let dough rise until doubled, not by the clock — the room's temperature changes timing" },
  { emoji: "🧁", text: "Fill muffin and cake tins two-thirds full to leave room to rise" },
  { emoji: "🔥", text: "Fully preheat the oven — the first blast of heat sets the structure" },
  { emoji: "🍪", text: "Chill cookie dough so it spreads less and bakes up thicker and chewier" },
  { emoji: "🧂", text: "A pinch of salt sharpens the sweetness in every dessert" },
  { emoji: "🎂", text: "Tap filled cake pans on the counter to knock out big air bubbles" },
  { emoji: "🥄", text: "Spoon flour into the cup and level it — scooping packs in far too much" },
  { emoji: "🍰", text: "A toothpick with a few moist crumbs, not wet batter, means the cake is done" },
  { emoji: "🧻", text: "Line pans with parchment — it's cheap insurance against sticking" },
  { emoji: "❄️", text: "Cool cakes completely before frosting or the icing will slide right off" },
  { emoji: "🥧", text: "Blind-bake pie crust with weights so the bottom doesn't turn out soggy" },
  { emoji: "🍫", text: "Chop a chocolate bar instead of using chips for melty pools in your cookies" },
  { emoji: "💦", text: "A pan of water in the oven adds steam for a crackly bread crust" },
  { emoji: "🥐", text: "Rest laminated dough between folds so the butter stays in distinct layers" },
  { emoji: "🧊", text: "Ice-cold water brings pie dough together without melting the butter" },
  { emoji: "🍮", text: "Bake custards in a water bath for gentle, even, crack-free cooking" },
  { emoji: "🍫", text: "Sift cocoa and powdered sugar to break up lumps before you mix" },
  { emoji: "🍯", text: "Grease the measuring spoon before honey or syrup so it slides right off" },
  { emoji: "🌡️", text: "Bloom yeast in warm liquid, never hot — above 130°F kills it" },
  { emoji: "🔄", text: "Rotate your pans halfway through baking for even browning" },

  // ── Meat & seafood (25) ───────────────────────────────────────────────
  { emoji: "🧻", text: "Pat meat bone-dry before searing — surface moisture blocks browning" },
  { emoji: "🧂", text: "Salt meat at least 40 minutes ahead or right before cooking — never in between" },
  { emoji: "🌡️", text: "Cook to temperature, not time: 130°F for medium-rare beef, 165°F for chicken" },
  { emoji: "⏲️", text: "Rest steak 5–10 minutes so the juices stay in the meat, not on the plate" },
  { emoji: "🔪", text: "Always slice cooked meat against the grain for tenderness" },
  { emoji: "🐟", text: "Fish is done when it flakes and turns opaque — it cooks fast, so watch closely" },
  { emoji: "🍤", text: "Buy shrimp shell-on and save the shells to simmer into a quick seafood stock" },
  { emoji: "🧊", text: "Thaw meat in the fridge, not on the counter, to stay out of the danger zone" },
  { emoji: "🌡️", text: "Let meat come to room temperature before cooking so it cooks evenly" },
  { emoji: "🐔", text: "Spatchcock a chicken by removing the backbone so it roasts faster and more evenly" },
  { emoji: "🧂", text: "Dry-brine poultry uncovered in the fridge overnight for extra-crispy skin" },
  { emoji: "🍲", text: "A cheap, tough cut turns meltingly tender with low, slow, moist cooking" },
  { emoji: "🐟", text: "Cook fish skin-side down first and press gently for crisp, flat skin" },
  { emoji: "🍗", text: "Dark meat is forgiving — it stays juicy even if you slightly overcook it" },
  { emoji: "🦐", text: "Pull shrimp the moment they curl into a loose C, not a tight O, or they turn rubbery" },
  { emoji: "🥓", text: "Save your bacon grease in a jar — it's liquid gold for frying and roasting" },
  { emoji: "⛺", text: "Tent resting meat loosely with foil; wrapping it tight steams the crust soft" },
  { emoji: "🐠", text: "Buy the freshest fish you can find — it should smell like the sea, not fishy" },
  { emoji: "🔥", text: "Sear first for color and flavor, then finish gently to your target temperature" },
  { emoji: "🍔", text: "Season ground meat, fry a tiny test patty, taste, then adjust before shaping the rest" },
  { emoji: "🍋", text: "Acidic marinades work fast — leave meat in too long and the surface turns mushy" },
  { emoji: "🥣", text: "Freeze chicken carcasses until you have enough for a big pot of stock" },
  { emoji: "🦑", text: "Cook squid and octopus either fast and hot or long and slow — the middle is rubbery" },
  { emoji: "🦞", text: "Devein shrimp along the back for a cleaner look and taste" },
  { emoji: "🍖", text: "Score the fat cap on pork or duck so it renders and crisps instead of curling" },

  // ── Vegetables & produce (20) ─────────────────────────────────────────
  { emoji: "🍅", text: "Store tomatoes on the counter — the fridge kills their flavor and turns them mealy" },
  { emoji: "🥔", text: "Keep potatoes and onions apart; stored together they spoil each other faster" },
  { emoji: "🥬", text: "Wrap leafy greens in a paper towel to soak up moisture and stay crisp longer" },
  { emoji: "🧅", text: "Store onions and garlic somewhere cool, dark, and dry — never the fridge" },
  { emoji: "🥕", text: "Cut the leafy tops off carrots and beets so they don't pull moisture from the roots" },
  { emoji: "🍌", text: "Keep bananas away from other fruit — they release gas that ripens everything nearby" },
  { emoji: "🥦", text: "Roast broccoli and cauliflower until the edges char for a nutty, sweet flavor" },
  { emoji: "🍄", text: "Don't soak mushrooms; wipe them clean so they don't get waterlogged" },
  { emoji: "🥑", text: "Store a cut avocado with a slice of onion to slow the browning" },
  { emoji: "🌽", text: "Cook corn the day you buy it — its sugars turn to starch fast" },
  { emoji: "🧊", text: "Revive wilted greens and herbs in a bowl of ice water" },
  { emoji: "🧄", text: "Pull the green shoot from old garlic cloves — it tastes bitter" },
  { emoji: "🍎", text: "A squeeze of lemon keeps cut apples, avocados, and potatoes from browning" },
  { emoji: "🌶️", text: "Char peppers over a flame, then steam them in a covered bowl to slip off the skins" },
  { emoji: "🥔", text: "Store potatoes in the dark — light turns them green and bitter" },
  { emoji: "🥕", text: "Roast vegetables cut-side down with space between them for real caramelization" },
  { emoji: "🍆", text: "Salt eggplant and let it drain to pull out bitterness and excess water" },
  { emoji: "🧊", text: "Freeze leftover herbs in olive oil in an ice cube tray for instant flavor bombs" },
  { emoji: "🥗", text: "Dry your greens thoroughly — wet leaves can't hold onto dressing" },
  { emoji: "🫛", text: "Frozen peas and corn are often fresher than fresh — they're frozen at peak ripeness" },

  // ── Pasta, rice & grains (20) ─────────────────────────────────────────
  { emoji: "🧂", text: "Salt pasta water heavily — it should taste like the sea to season the noodles from within" },
  { emoji: "🍝", text: "Save a cup of starchy pasta water to loosen and bind your sauce" },
  { emoji: "🚫", text: "Skip the oil in pasta water; it just makes the sauce slide off the noodles" },
  { emoji: "🍝", text: "Finish pasta in the sauce for the last minute so it soaks up the flavor" },
  { emoji: "🍚", text: "Rinse rice until the water runs clear for fluffy, separate grains" },
  { emoji: "🍳", text: "Toast rice in a little oil before adding liquid for nuttier, firmer grains" },
  { emoji: "⏲️", text: "Let rice rest off the heat with the lid on for 10 minutes before fluffing" },
  { emoji: "🍝", text: "Cook pasta a minute short of the package time and let it finish in the sauce" },
  { emoji: "🌾", text: "Rinse quinoa well to wash off its bitter natural coating" },
  { emoji: "🙈", text: "Get the water ratio right and resist lifting the lid to peek at your rice" },
  { emoji: "🥣", text: "Toss pasta with just enough sauce to coat; don't drown it in a puddle" },
  { emoji: "🍲", text: "Cook grains in stock instead of water for a big, free flavor upgrade" },
  { emoji: "🍚", text: "Day-old cold rice makes the best fried rice — fresh rice turns to mush" },
  { emoji: "🥄", text: "Stir pasta in the first two minutes so it doesn't clump or stick together" },
  { emoji: "❄️", text: "Batch-cook grains and freeze them in portions for fast weeknight meals" },
  { emoji: "🍜", text: "Slightly undercook noodles headed into soup, since they keep cooking in the broth" },
  { emoji: "🧈", text: "A pat of butter or splash of oil stirred through cooked grains keeps them loose" },
  { emoji: "🌿", text: "A bay leaf or cardamom pod in the pot quietly perfumes plain rice" },
  { emoji: "🍝", text: "Match sauce to shape: thin sauces cling to long pasta, chunky ones to ridged shapes" },
  { emoji: "🫘", text: "Soak dried beans overnight with a pinch of salt for even, creamy cooking" },

  // ── Storage & food safety (20) ────────────────────────────────────────
  { emoji: "🌡️", text: "Keep your fridge at or below 40°F to slow bacterial growth" },
  { emoji: "🧊", text: "Cool leftovers and refrigerate them within two hours to stay safe" },
  { emoji: "🔥", text: "Reheat leftovers to 165°F all the way through, not just warm on the outside" },
  { emoji: "🧼", text: "Wash hands, boards, and knives after raw meat to avoid cross-contamination" },
  { emoji: "🥩", text: "Store raw meat on the bottom shelf so drips can't reach other food" },
  { emoji: "📅", text: "Best-by dates are about quality — use your nose and eyes to judge actual safety" },
  { emoji: "❄️", text: "Freeze food flat in bags — it stacks neatly and thaws much faster" },
  { emoji: "🏷️", text: "Label and date everything in the freezer; mystery bags never get eaten" },
  { emoji: "🚫", text: "Never refreeze meat that's fully thawed at room temperature" },
  { emoji: "🥚", text: "Fresh eggs sink and old ones float — a quick freshness test in a bowl of water" },
  { emoji: "🍚", text: "Don't leave cooked rice sitting out — it can grow harmful bacteria surprisingly fast" },
  { emoji: "🌬️", text: "Don't overpack the fridge, or cold air can't circulate to keep food safe" },
  { emoji: "🫙", text: "Store dry goods in airtight containers to keep out moisture and pantry pests" },
  { emoji: "🌸", text: "Store fresh herbs like flowers — stems in a jar of water, loosely covered" },
  { emoji: "🍞", text: "Freeze bread you won't finish soon; it toasts perfectly straight from frozen" },
  { emoji: "⚠️", text: "The danger zone is 40–140°F — don't let food linger there for long" },
  { emoji: "🥛", text: "Store milk on a shelf, not the door, where it's coldest and most stable" },
  { emoji: "🧀", text: "Wrap cheese in parchment rather than plastic so it can breathe" },
  { emoji: "🍲", text: "Split big batches into shallow containers so they cool quickly and evenly" },
  { emoji: "🧄", text: "Homemade garlic-in-oil must be refrigerated and used quickly — real botulism risk" },

  // ── Kitchen equipment & tools (20) ────────────────────────────────────
  { emoji: "🍳", text: "A heavy pan spreads heat evenly; thin pans scorch in random hot spots" },
  { emoji: "🔪", text: "Keep one knife genuinely sharp — it's the tool you reach for most" },
  { emoji: "🪵", text: "Wood and plastic boards protect your edge; glass and stone dull it fast" },
  { emoji: "🔥", text: "Season cast iron and never soak it — a quick scrub and dry keeps it nonstick" },
  { emoji: "🌡️", text: "A cheap instant-read thermometer removes all the guesswork from cooking" },
  { emoji: "⚖️", text: "A digital scale is the single best upgrade for consistent baking" },
  { emoji: "🥄", text: "Metal utensils scratch nonstick pans — reach for wood or silicone" },
  { emoji: "🧊", text: "Chill the bowl and beaters before whipping cream so it comes together faster" },
  { emoji: "🍴", text: "Tongs are an extension of your hand — grab, flip, and plate with control" },
  { emoji: "♨️", text: "Dry cast iron on the hot burner and rub with a little oil to keep rust away" },
  { emoji: "🧲", text: "Store knives on a magnetic strip or in a block, not loose in a drawer" },
  { emoji: "🥖", text: "A bench scraper moves food, scrapes the board clean, and portions dough" },
  { emoji: "⭕", text: "Match the pan size to the burner so heat doesn't crawl up the empty sides" },
  { emoji: "🛡️", text: "A splatter screen keeps the stovetop clean while letting steam escape" },
  { emoji: "🧀", text: "A microplane turns garlic, ginger, zest, and hard cheese into fine fluff" },
  { emoji: "🌡️", text: "An oven thermometer reveals that most ovens run hotter or cooler than the dial says" },
  { emoji: "🥄", text: "Keep a spoon rest by the stove so you always taste with a clean spoon" },
  { emoji: "🔪", text: "Sharpen with a stone, straighten with a honing steel — they do two different jobs" },
  { emoji: "🍲", text: "A Dutch oven goes from stovetop sear to oven braise in one heavy pot" },
  { emoji: "🥬", text: "A salad spinner dries greens and herbs so dressing actually clings to them" },

  // ── General chef secrets & pro tricks (30) ────────────────────────────
  { emoji: "🧺", text: "Mise en place: prep everything before you cook and the rest goes smoothly" },
  { emoji: "🧽", text: "Clean as you go so you're not buried under a mountain of dishes at the end" },
  { emoji: "🥄", text: "Taste at every stage — the best cooks are the ones adjusting constantly" },
  { emoji: "🍋", text: "Keep acid nearby; a few drops of lemon or vinegar fixes a flat dish instantly" },
  { emoji: "🧂", text: "If something tastes not-quite-right, it usually needs salt or acid" },
  { emoji: "📖", text: "Read the whole recipe before you start so nothing catches you off guard" },
  { emoji: "🧈", text: "Finish a sauce off the heat with cold butter for a glossy, rich shine" },
  { emoji: "🥣", text: "Save every scrap — bones, peels, and stems — in a freezer bag for stock" },
  { emoji: "🍽️", text: "Warm your plates so hot food doesn't go cold the second it's served" },
  { emoji: "🧂", text: "Under-salt, taste, then correct — you can always add more but can't take it back" },
  { emoji: "💧", text: "A splash of pasta water, stock, or cream loosens a sauce that's gotten too thick" },
  { emoji: "🍽️", text: "Let food settle before plating — rushing the plate ruins the presentation" },
  { emoji: "🌡️", text: "Trust a thermometer over the clock; every oven and every cut is a little different" },
  { emoji: "🫙", text: "Keep flaky salt, good olive oil, and a lemon on hand to finish almost any plate" },
  { emoji: "🍯", text: "A pinch of sugar balances an overly acidic tomato sauce" },
  { emoji: "🧊", text: "Shock blanched greens in ice water to keep them vividly green" },
  { emoji: "🔥", text: "When in doubt, lower the heat — most home cooks burn things by rushing" },
  { emoji: "🥘", text: "Build flavor in layers: sear, sauté aromatics, deglaze, then simmer" },
  { emoji: "🧄", text: "Double the garlic the recipe calls for — it rarely does any harm" },
  { emoji: "🍷", text: "Only cook with wine you'd actually drink; bad wine makes a bad sauce" },
  { emoji: "⏳", text: "Season braises and soups early so the flavor has time to develop" },
  { emoji: "🪵", text: "A wobbly cutting board is dangerous — anchor it with a damp towel" },
  { emoji: "🌡️", text: "Bring cold ingredients to room temperature before combining for smoother results" },
  { emoji: "🍜", text: "When you have time, reduce a watery sauce instead of thickening it with starch" },
  { emoji: "🧈", text: "Brown your butter for a nutty upgrade in sauces, cookies, and vegetables" },
  { emoji: "🌶️", text: "Cool a too-spicy dish with dairy, sugar, or acid — not more of everything else" },
  { emoji: "🥔", text: "Rescue an over-salted soup with more liquid, a raw potato, or a splash of acid" },
  { emoji: "🥨", text: "Contrast textures on the plate — pair something crisp against something soft" },
  { emoji: "🧑‍🍳", text: "Cook a recipe as written once, then start making it your own" },
  { emoji: "⏲️", text: "Give food space and time — walking away and letting it brown is a real skill" },
];

// Deterministic PRNG (mulberry32) so the shuffle below is identical for every
// user and every session. Never uses Math.random.
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A fixed, shuffled walk order over the tips. Because it's a full permutation,
// stepping one index per day visits every tip once before any repeat — so with
// 250 tips there are no repeats for months, comfortably clearing a one-month
// window. The seeded shuffle interleaves the categories so it feels random.
const TIP_ORDER = (() => {
  const order = COOKING_TIPS.map((_, i) => i);
  const rand = mulberry32(0x5eed1234);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
})();

// Whole-day count in the user's LOCAL timezone. It ticks up by one at local
// midnight, so a new tip appears every 24h at 00:00 local time.
function localDayNumber(date) {
  const localMidnight = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  return Math.floor(localMidnight.getTime() / 86400000);
}

// The tip for `date` (defaults to now). Same calendar day → same tip, for
// everyone. Advances to the next tip in the shuffled order each local midnight.
export function getDailyTip(date = new Date()) {
  const n = COOKING_TIPS.length;
  const idx = ((localDayNumber(date) % n) + n) % n;
  return COOKING_TIPS[TIP_ORDER[idx]];
}
