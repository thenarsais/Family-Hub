/**
 * FR-156 — the "learn more" blurbs for the fact of the day, indexed to match
 * FACTS in `facts.ts`. Loaded on demand (dynamic import) so this text stays out
 * of the first-paint bundle. An empty string means "no blurb for this fact".
 */
export const FACT_MORE: string[] = [
  // 0
  'Two hearts pump blood to the gills and one pumps it to the rest of the body. The blood is blue because it carries oxygen with a copper-based molecule called hemocyanin instead of the iron-based hemoglobin that makes our blood red. The body heart actually stops beating when an octopus swims, which is one reason they prefer to crawl.',
  // 1
  'Honey is very low in water and slightly acidic, and bees add an enzyme that produces a tiny amount of hydrogen peroxide. Together that makes it almost impossible for bacteria or mould to grow. Sealed jars of honey found in ancient Egyptian tombs were still good to eat.',
  // 2
  'English has lots of playful collective nouns for animals — a "parliament" of owls, a "tower" of giraffes, a "murder" of crows. Many were coined in the 1400s in a book about hunting and just stuck around.',
  // 3
  'To a botanist, a berry is a fruit that grows from one flower with one ovary and has its seeds on the inside — so bananas, tomatoes, and watermelons all count. A strawberry grows from a flower with many ovaries, and the little "seeds" on the outside are actually the true fruits.',
  // 4
  'When metal warms up, its atoms vibrate more and push each other slightly further apart, so the whole structure grows. On a hot day the sun-facing side of the tower also expands more than the shaded side, making the top lean a few centimetres away from the sun.',
  // 5
  'Wombats are the only animals known to make cube-shaped droppings. The last part of their intestine has stiff and stretchy sections that shape the poo as it dries out over about two weeks. The cubes do not roll away, which helps wombats stack them on rocks and logs to mark their territory.',
  // 6
  'Venus spins so slowly that one full turn takes about 243 Earth days, while it orbits the Sun in about 225 Earth days. It also spins backwards compared with most planets, so on Venus the Sun would rise in the west.',
  // 7
  'Sea otters rest floating on their backs at the surface. Holding paws — sometimes in big groups called rafts — keeps the family together in the current. They also wrap themselves in kelp like a seatbelt for the same reason.',
  // 8
  'The Anglo-Zanzibar War of 1896 ended almost as soon as it began when British warships bombarded the palace. Records disagree on the exact length, but every account puts it under about 45 minutes.',
  // 9
  'The earliest sharks appear in the fossil record around 450 million years ago. The first plants that we would recognise as trees, with wood and deep roots, showed up roughly 390 million years ago. Sharks have outlasted several mass extinctions since.',
  // 10
  'A lightning channel can reach around 30,000°C for a tiny fraction of a second, while the Sun’s surface is about 5,500°C. That sudden heat makes the air explode outward, and the shockwave is what we hear as thunder.',
  // 11
  'Studies that put cows with a preferred partner versus a random cow found lower heart rates and calmer behaviour when they were with their friend. Cows form lasting bonds and will groom and graze near the same companions.',
  // 12
  'The word comes from the Latin "titulus", meaning a small mark or label. It is the same root as the phrase "to a T", which may originally have been "to a tittle" — meaning exact down to the smallest mark.',
  // 13
  'The suckers on an octopus’s arms are covered in receptors that sense chemicals, so the animal can taste whatever it touches. Each arm also has its own bundle of nerve cells and can explore and grab things without waiting for instructions from the brain.',
  // 14
  'Butterflies have taste sensors on their feet that let them tell within a step whether a leaf is the right plant to lay eggs on. Once they land, they may "drum" the leaf with their legs to release its juices and check.',
  // 15
  'Astronomers estimate the observable universe holds something like 10^22 to 10^24 stars. Careful guesses at the number of sand grains on every beach and desert on Earth come out lower, around 10^18 to 10^19.',
  // 16
  'When it is too dry or too cold, a snail can seal itself inside its shell with dried mucus and drop into a deep, slowed-down state called estivation or hibernation. If conditions stay bad, some land snails can stay that way for a couple of years, living off stored energy.',
  // 17
  'Smell is closely wired to the parts of the brain that handle memory and emotion, which is why a particular smell can suddenly bring back a place or a person. Some research suggests the nose can actually distinguish far more than 50,000 combinations of odours.',
  // 18
  'Most birds only push air downward and back. A hummingbird rotates its wing almost in a figure-eight, getting lift on both the forward and backward stroke, so it can hover in place or reverse. Their wings beat roughly 50 times a second.',
  // 19
  'A few freshwater turtles have a well-supplied sac near the tail that can pull oxygen straight out of the water. This lets them stay underwater for months while hibernating in cold ponds without coming up for air.',
  // 20
  'The wall is long but only a few metres wide and roughly the same colour as the land around it. Astronauts in low Earth orbit generally cannot pick it out without a camera zoom, and from the Moon no human-made object is visible at all.',
  // 21
  'In everyday speech a jiffy just means "very soon", but engineers and scientists have used it as a real measurement. In electronics it often means one cycle of the power supply — 1/60th or 1/50th of a second — and in physics it can mean the time light takes to travel a tiny distance.',
  // 22
  'Each hair is a hollow, colourless tube. It scatters sunlight so the coat looks white, while the black skin underneath soaks up the warmth that gets through. In very humid zoos the fur can even turn slightly green when algae grows inside the hollow hairs.',
  // 23
  'An American farmer named Charles Osborne started hiccuping in 1922 after an accident and did not stop until 1990. He still married, raised a family, and lived to 96 — the hiccups just faded away on their own a year before he died.',
  // 24
  'Carbon is the backbone of almost every molecule in living things, and it makes up around 18% of your body weight. Pencil "lead" is really graphite, a form of carbon, so the comparison is a fun way to picture how much of that element you are carrying around.',
  // 25
  'A medium fluffy cumulus cloud holds a huge number of tiny water droplets spread through about a cubic kilometre of air. Add up all those droplets and the water alone can weigh around 500,000 kilograms. It stays up because the droplets are so small they fall extremely slowly and the rising air holds them.',
  // 26
  'An elephant’s legs are built as thick pillars to hold up its weight, and it always keeps at least one foot on the ground when it moves. It has no springy tendons or crouching ability to launch itself upward, and it simply does not need to.',
  // 27
  'Scotland officially adopted the unicorn as a royal symbol in the 1300s. In old stories the unicorn stood for purity and untamed strength, and it was seen as the natural rival of the lion, England’s symbol.',
  // 28
  'Tickled rats make rapid high-pitched chirps, far above what people can hear, that scientists link to play and happiness. They will also chase a hand that has tickled them, asking for more.',
  // 29
  'Inside a raw egg the liquid sloshes around and drags against the spin, so the egg wobbles and slows quickly. A cooked egg is solid all the way through, so it spins smoothly. Give a spinning egg a quick touch to stop it, then let go: a raw one will start turning again because the liquid inside is still moving.',
  // 30
  'A shrimp’s body plan puts its heart, stomach, and much of its nervous system in the front section called the cephalothorax, which is roughly its "head". The tail is mostly muscle for that fast backward flick when it needs to escape.',
  // 31
  'Peanuts grow in pods underground on a leafy plant in the pea family, not on a tree. True nuts like walnuts and hazelnuts grow on trees inside a hard shell. That is why some people allergic to tree nuts are fine with peanuts, and the other way around.',
  // 32
  'It is another of those medieval collective nouns. Nobody is certain why "murder" was chosen — it may come from old folklore that linked crows and ravens to death, or from stories of crows gathering around a dead bird.',
  // 33
  'The tongue is actually a bundle of eight muscles working together, and it never really gets tired because it keeps working all day and night to help you swallow, talk, and keep your mouth clean. For its small size it is remarkably strong and precise, though muscles like the jaw or calf produce far more raw force.',
  // 34
  'A slug has two upper tentacles that carry its eyes and pick up smells, and two shorter lower tentacles used mainly for smell and taste as it moves. If a slug loses one, it can slowly regrow it.',
  // 35
  'Their huge back feet and thick tail are built for hopping forward, and the tail gets in the way of stepping back. That one-way design is part of why a kangaroo and an emu — which also struggles to move backward — appear on Australia’s coat of arms, as a symbol of always moving forward.',
  // 36
  'A neutron star is what is left after a giant star collapses: a ball about the size of a city packed with more mass than the Sun. The matter is squeezed so tightly that a sugar-cube-sized piece would outweigh a mountain.',
  // 37
  'Instruments left by the Apollo astronauts recorded the ground shaking on the Moon. Some moonquakes come from the Moon being squeezed by Earth’s gravity, some from big temperature swings between lunar day and night, and some from meteorite impacts. Because the Moon is dry and rigid, the shaking can ring on for many minutes.',
  // 38
  'A frog uses its eyeballs to help eat. When it swallows, muscles pull the eyes down into the head, and the bulges press on the roof of the mouth to push food down the throat.',
  // 39
  'That works out to very roughly 5,000 to 7,000 steps a day over 80 years. The exact number depends a lot on the person, but even a modest daily walk adds up to a distance most people never picture themselves covering.',
  // 40
  'The first cultivated carrots, grown around Afghanistan about a thousand years ago, were purple and yellow. Dutch growers in the 1600s bred the sweet orange carrot we know today, and there is a popular but unproven story that it was done to honour the royal House of Orange.',
  // 41
  'When a shrimp needs to escape, it snaps its tail forward under its body, which shoots it rapidly backward away from danger. For normal cruising it uses tiny leg-like swimmerets and moves forward slowly.',
  // 42
  'Each bottlenose dolphin invents its own "signature whistle" early in life and uses it like a name. Other dolphins can copy that whistle to call a specific individual, even one they have not seen in years.',
  // 43
  'Wood frogs in the far north freeze almost solid every winter, with no heartbeat. Recycling the urea from urine helps protect their cells like a natural antifreeze, so holding it in is part of how they survive being frozen and then thaw back to life in spring.',
  // 44
  'Seen from above the Sun’s north pole, the other planets spin counter-clockwise, the same way they orbit. Venus turns the opposite way, very slowly. The leading idea is that a colossal ancient collision flipped it almost upside down.',
  // 45
  'Nails grow a little quicker where there is more blood flow and gentle use, so the hand you write and grab with, and your longer fingers, tend to be ahead. Nails also grow faster in summer than in winter, and fingernails grow about four times faster than toenails.',
  // 46
  'The blue whale is the largest animal that has ever lived. Its heart can weigh close to 180 kilograms, and each slow beat pushes enough blood that you could almost crawl through the main artery. At rest its heart may beat only a couple of times a minute.',
  // 47
  'An American doctor claimed tomato ketchup could cure things like indigestion and diarrhoea, and it was sold as "tomato pills". The fad collapsed once copycats sold pills with no tomato in them at all, and ketchup went back to being a condiment.',
  // 48
  'This planet orbits a star about 40 light-years away and is roughly twice the size of Earth. Early studies suggested it is very rich in carbon, so under its intense heat and pressure a large part of the interior could be graphite and diamond. Newer data is less certain, but it remains one of the strangest known worlds.',
  // 49
  'Many grazing animals — goats, sheep, horses, deer — have wide, roughly rectangular pupils. The horizontal slit gives them a broad, panoramic view of the ground and the horizon so they can spot predators, and their eyes rotate to keep that slit level even when the head tilts down to eat.',
];
