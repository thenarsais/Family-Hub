// trivia-questions.js — Trivia Question Bank (Phase 1)
// Multiple choice format, 4 options per question
// Options are shuffled at display time — correct answer stored separately

const TRIVIA_QUESTION_BANK = [

  // ══════════════ SCIENCE (15) ══════════════
  {
    uuid:'q-sci-001', legacyId:'sci_001', version:1,
    category:'Science', difficulty:'easy',
    question:'What is the largest planet in our solar system?',
    options:['Jupiter','Saturn','Uranus','Neptune'], correct:'Jupiter',
    hint:'Starts with J',
    funFact:'Jupiter is so large that over 1,300 Earths could fit inside it!',
    enhancedFunFact:'Jupiter has at least 95 known moons. Its largest moon Ganymede is bigger than Mercury. The Great Red Spot is a storm that has been raging for over 300 years and is twice the size of Earth.',
    learningLink:'https://spaceplace.nasa.gov/all-about-jupiter/en/',
    source:'NASA Space Place', tags:['planets','solar system'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-002', legacyId:'sci_002', version:1,
    category:'Science', difficulty:'easy',
    question:'What gas do plants absorb from the air to make food?',
    options:['Carbon dioxide','Oxygen','Nitrogen','Hydrogen'], correct:'Carbon dioxide',
    hint:'What we breathe out',
    funFact:'Plants convert CO₂ into oxygen through photosynthesis. One large tree can produce oxygen for 2 people per year!',
    enhancedFunFact:'Photosynthesis is the process where plants use sunlight, water, and carbon dioxide to produce sugar (glucose) and oxygen. The equation is: 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. Without this process, most life on Earth could not exist.',
    learningLink:'https://www.khanacademy.org/science/biology/photosynthesis-and-cellular-respiration/photosynthesis/a/intro-to-photosynthesis',
    source:'Khan Academy', tags:['photosynthesis','plants','gases'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-003', legacyId:'sci_003', version:1,
    category:'Science', difficulty:'easy',
    question:'What is the hardest natural substance on Earth?',
    options:['Diamond','Ruby','Granite','Gold'], correct:'Diamond',
    hint:'A precious gemstone',
    funFact:'Diamonds are made of carbon atoms in a crystal structure. They form deep underground under extreme heat and pressure!',
    enhancedFunFact:'Diamonds score 10 on the Mohs hardness scale — the maximum. They form about 100 miles underground at temperatures over 2,000°F. The only thing that can scratch a diamond is another diamond.',
    learningLink:'https://www.usgs.gov/faqs/what-diamond',
    source:'USGS', tags:['minerals','hardness'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-004', legacyId:'sci_004', version:1,
    category:'Science', difficulty:'medium',
    question:'How many bones does an adult human body have?',
    options:['206','195','213','248'], correct:'206',
    hint:'Between 200 and 210',
    funFact:'Babies are born with about 270 bones, but many fuse together as they grow. Adults end up with exactly 206!',
    enhancedFunFact:'At birth, babies have about 270 bones — many are cartilage that harden and fuse over time. By age 25, the skeleton is fully fused. The smallest bone is the stapes in your ear (3mm), and the largest is the femur (thigh bone).',
    learningLink:'https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/skeletal-system/a/skeleton-anatomy-and-physiology',
    source:'Khan Academy', tags:['skeleton','human body'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-005', legacyId:'sci_005', version:1,
    category:'Science', difficulty:'easy',
    question:'What is the smallest unit of life?',
    options:['Cell','Atom','Molecule','Nucleus'], correct:'Cell',
    hint:'All living things are made of these',
    funFact:'Your body has about 37.2 trillion cells! They are the building blocks of all life.',
    enhancedFunFact:'Cells are the basic structural and functional units of life. There are two types: prokaryotic (no nucleus, like bacteria) and eukaryotic (with nucleus, like human cells). The largest human cell is the egg cell, visible to the naked eye.',
    learningLink:'https://www.khanacademy.org/science/biology/cell-biology/intro-to-cells/a/what-is-a-cell',
    source:'Khan Academy', tags:['cells','biology'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-006', legacyId:'sci_006', version:1,
    category:'Science', difficulty:'easy',
    question:'What is the process by which liquid water changes to water vapor?',
    options:['Evaporation','Condensation','Precipitation','Sublimation'], correct:'Evaporation',
    hint:'When wet clothes dry in the sun',
    funFact:"Evaporation drives the water cycle! The sun's heat causes water to evaporate, forming clouds that produce rain.",
    enhancedFunFact:'Evaporation is one of 4 stages in the water cycle: evaporation → condensation → precipitation → collection. About 90% of water that evaporates comes from oceans. Plants also release water vapor through their leaves — this is called transpiration.',
    learningLink:'https://www.usgs.gov/faqs/what-water-cycle',
    source:'USGS', tags:['water cycle','states of matter'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-007', legacyId:'sci_007', version:1,
    category:'Science', difficulty:'medium',
    question:'What do bees do that helps flowers reproduce?',
    options:['Pollinate','Germinate','Fertilize','Cultivate'], correct:'Pollinate',
    hint:'They carry pollen from flower to flower',
    funFact:'About 1 in 3 food items we eat depends on bee pollination. Bees help pollinate 300 million flowers in a single day!',
    enhancedFunFact:'Pollination happens when bees collect nectar and pollen sticks to their fuzzy bodies. When they visit the next flower, pollen transfers to the stigma, enabling fertilization. Without bees, many fruits, vegetables, and nuts would disappear from our diet.',
    learningLink:'https://www.britannica.com/animal/bee/Pollination',
    source:'Britannica', tags:['pollination','bees','ecology'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-008', legacyId:'sci_008', version:1,
    category:'Science', difficulty:'medium',
    question:'What is the second most abundant gas in Earth\'s atmosphere?',
    options:['Oxygen','Carbon dioxide','Nitrogen','Argon'], correct:'Oxygen',
    hint:'What we breathe in',
    funFact:"Oxygen makes up 21% of the atmosphere. Nitrogen is most abundant at 78%.",
    enhancedFunFact:"Earth's atmosphere is 78% nitrogen, 21% oxygen, 0.93% argon, and 0.04% carbon dioxide. The oxygen we breathe was mostly produced by ancient cyanobacteria 2.4 billion years ago — an event called the Great Oxidation Event.",
    learningLink:'https://www.britannica.com/science/atmosphere-of-earth',
    source:'Britannica', tags:['atmosphere','gases'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-009', legacyId:'sci_009', version:1,
    category:'Science', difficulty:'easy',
    question:'What force pulls objects toward the center of Earth?',
    options:['Gravity','Magnetism','Friction','Electromagnetism'], correct:'Gravity',
    hint:'Why things fall down',
    funFact:"The Moon's gravity causes ocean tides. Without the Moon, our tides would be much weaker!",
    enhancedFunFact:"Gravity is one of the four fundamental forces of nature. Isaac Newton described it in 1687. Albert Einstein later explained it as the curvature of space-time. The Moon's gravity pulls on Earth's oceans, creating the high and low tides we see twice each day.",
    learningLink:'https://www.khanacademy.org/science/physics/forces-newtons-laws/newtons-law-universal-gravitation/a/gravitational-force',
    source:'Khan Academy', tags:['gravity','forces'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-010', legacyId:'sci_010', version:1,
    category:'Science', difficulty:'easy',
    question:'What is the scientific study of rocks and minerals called?',
    options:['Geology','Biology','Meteorology','Astronomy'], correct:'Geology',
    hint:'Contains the word "geo" meaning Earth',
    funFact:'Geologists use radiometric dating to determine rock age. The oldest rocks on Earth are about 4 billion years old!',
    enhancedFunFact:"Geology studies Earth's solid materials — rocks, minerals, and the processes that shape them. Geologists use radiometric dating (measuring radioactive decay) to date rocks. Earth formed 4.5 billion years ago. The oldest known rocks are from Canada, dating to 4.03 billion years.",
    learningLink:'https://www.britannica.com/science/geology',
    source:'Britannica', tags:['geology','earth science'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-011', legacyId:'sci_011', version:1,
    category:'Science', difficulty:'easy',
    question:'What gas do animals breathe out that plants need?',
    options:['Carbon dioxide','Oxygen','Methane','Nitrogen'], correct:'Carbon dioxide',
    hint:'We breathe it out',
    funFact:"There's a beautiful cycle: animals breathe out CO₂, plants absorb it and make oxygen — then we breathe that oxygen!",
    enhancedFunFact:"The carbon cycle connects all living things. Animals eat plants, respire (releasing CO₂), and plants absorb that CO₂ to photosynthesize. This cycle has been running for hundreds of millions of years. Burning fossil fuels is disrupting this balance by adding extra CO₂.",
    learningLink:'https://www.khanacademy.org/science/biology/ecology/energy-flow-through-ecosystems/a/the-carbon-cycle',
    source:'Khan Academy', tags:['carbon cycle','respiration'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-012', legacyId:'sci_012', version:1,
    category:'Science', difficulty:'medium',
    question:'What is the process of breaking down food for energy in the body?',
    options:['Digestion','Metabolism','Respiration','Absorption'], correct:'Digestion',
    hint:'Happens in your stomach and intestines',
    funFact:"Your digestive system is about 30 feet long! Food takes 24–72 hours to travel all the way through it.",
    enhancedFunFact:"Digestion begins in the mouth with chewing and saliva, continues in the stomach with acid and enzymes, then in the small intestine where nutrients are absorbed. The large intestine absorbs water. The entire digestive tract, if laid out straight, would be about 30 feet long.",
    learningLink:'https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/digestive-system/a/digestive-system-introduction',
    source:'Khan Academy', tags:['digestion','human body'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-013', legacyId:'sci_013', version:1,
    category:'Science', difficulty:'easy',
    question:'How many chambers does a human heart have?',
    options:['4','2','3','6'], correct:'4',
    hint:'Think: two on the top, two on the bottom',
    funFact:"Your heart beats about 100,000 times per day and pumps blood through 60,000 miles of blood vessels!",
    enhancedFunFact:"The heart has 4 chambers: 2 atria (upper) and 2 ventricles (lower). The right side pumps blood to the lungs; the left side pumps oxygenated blood to the body. The heart begins beating just 22 days after conception and beats about 3 billion times in a lifetime.",
    learningLink:'https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/circulatory-system/a/heart-anatomy-and-function',
    source:'Khan Academy', tags:['heart','circulatory system'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-014', legacyId:'sci_014', version:1,
    category:'Science', difficulty:'medium',
    question:'What is the term for the slow movement of continents over millions of years?',
    options:['Continental drift','Plate rotation','Tectonic shift','Crustal wander'], correct:'Continental drift',
    hint:'Continents slowly move apart or together',
    funFact:'Continents move at about the same speed as your fingernails grow — around 2 cm per year!',
    enhancedFunFact:"Alfred Wegener proposed continental drift in 1912. About 200 million years ago, all continents were joined in one supercontinent called Pangaea. The continents separated over millions of years. Evidence includes matching fossils and rock formations on different continents.",
    learningLink:'https://www.britannica.com/science/continental-drift',
    source:'Britannica', tags:['plate tectonics','earth science'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sci-015', legacyId:'sci_015', version:1,
    category:'Science', difficulty:'easy',
    question:'What process do plants use to make food from sunlight?',
    options:['Photosynthesis','Respiration','Metabolism','Osmosis'], correct:'Photosynthesis',
    hint:'Photo = light, synthesis = making',
    funFact:'Photosynthesis is essential for life! Without it, most living things on Earth would not exist.',
    enhancedFunFact:"Photosynthesis occurs in chloroplasts, which contain chlorophyll — the green pigment that captures light. Plants use light energy to convert CO₂ and water into glucose (sugar) and oxygen. Algae and cyanobacteria also photosynthesize and produce most of Earth's oxygen.",
    learningLink:'https://www.khanacademy.org/science/biology/photosynthesis-and-cellular-respiration/photosynthesis/a/intro-to-photosynthesis',
    source:'Khan Academy', tags:['photosynthesis','plants'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },

  // ══════════════ HISTORY (15) ══════════════
  {
    uuid:'q-hist-001', legacyId:'hist_001', version:1,
    category:'History', difficulty:'medium',
    question:'In what year did Christopher Columbus first sail to the Americas?',
    options:['1492','1607','1776','1438'], correct:'1492',
    hint:'Fourteen ninety-two',
    funFact:'Vikings actually arrived 500 years earlier! But Columbus led to the lasting European settlement of the Americas.',
    enhancedFunFact:"Columbus made four voyages to the Americas (1492–1504). He was trying to reach Asia by sailing west. He actually landed in the Bahamas, Cuba, and Hispaniola. His voyages opened lasting contact between Europe and the Americas, changing world history forever.",
    learningLink:'https://www.britannica.com/biography/Christopher-Columbus',
    source:'Britannica', tags:['exploration','Americas'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-002', legacyId:'hist_002', version:1,
    category:'History', difficulty:'easy',
    question:'Who was the first President of the United States?',
    options:['George Washington','Thomas Jefferson','Benjamin Franklin','John Adams'], correct:'George Washington',
    hint:'His face is on the one-dollar bill',
    funFact:'George Washington had false teeth made from hippopotamus ivory and gold — not wood as often believed!',
    enhancedFunFact:"Washington served two terms (1789–1797) and set the precedent of a peaceful transfer of power. He was unanimously elected by the Electoral College — something no other president has achieved. He refused a third term, establishing the two-term tradition that lasted until FDR.",
    learningLink:'https://www.whitehouse.gov/about-the-white-house/presidents/george-washington/',
    source:'White House', tags:['presidents','founding fathers'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-003', legacyId:'hist_003', version:1,
    category:'History', difficulty:'medium',
    question:'In what year did the Titanic sink?',
    options:['1912','1905','1918','1921'], correct:'1912',
    hint:'Early 1900s',
    funFact:'The Titanic sank after hitting an iceberg on April 15, 1912. Over 1,500 people lost their lives.',
    enhancedFunFact:"The RMS Titanic hit an iceberg at 11:40 PM on April 14, 1912, and sank at 2:20 AM. It was on its maiden voyage from Southampton to New York. The ship was considered unsinkable. Only 710 of the 2,224 passengers and crew survived. The wreck was not found until 1985.",
    learningLink:'https://www.britannica.com/event/Sinking-of-the-Titanic',
    source:'Britannica', tags:['disasters','ships'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-004', legacyId:'hist_004', version:1,
    category:'History', difficulty:'medium',
    question:'Which ancient wonder of the world is still standing today?',
    options:['Great Pyramid of Giza','Hanging Gardens of Babylon','Colossus of Rhodes','Temple of Artemis'], correct:'Great Pyramid of Giza',
    hint:'It is in Egypt and was built as a tomb',
    funFact:'The Great Pyramid was the tallest man-made structure for 3,800 years! Built with 2.3 million stone blocks.',
    enhancedFunFact:"The Great Pyramid of Giza was built around 2560 BCE as a tomb for Pharaoh Khufu. It originally stood 481 feet tall (now 455 feet due to erosion). It contains about 2.3 million blocks of stone, each weighing 2.5–15 tons. How it was built remains one of history's greatest mysteries.",
    learningLink:'https://www.britannica.com/technology/Seven-Wonders-of-the-Ancient-World',
    source:'Britannica', tags:['ancient world','Egypt'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-005', legacyId:'hist_005', version:1,
    category:'History', difficulty:'medium',
    question:'Who was the primary author of the Declaration of Independence?',
    options:['Thomas Jefferson','Benjamin Franklin','John Adams','James Madison'], correct:'Thomas Jefferson',
    hint:'His face is on the nickel',
    funFact:'Jefferson wrote the Declaration at just 33 years old. He also designed his famous home, Monticello!',
    enhancedFunFact:"Jefferson wrote the Declaration in 17 days in June 1776. It was adopted on July 4, 1776. Franklin and Adams made some edits, but 80% of Jefferson's original wording survived. Jefferson and John Adams both died on July 4, 1826 — exactly 50 years after the Declaration.",
    learningLink:'https://www.britannica.com/biography/Thomas-Jefferson',
    source:'Britannica', tags:['founding fathers','declaration'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-006', legacyId:'hist_006', version:1,
    category:'History', difficulty:'easy',
    question:'What war did American colonies fight to gain independence from Britain?',
    options:['American Revolution','American Civil War','French and Indian War','War of 1812'], correct:'American Revolution',
    hint:'Against British rule',
    funFact:'The American Revolution lasted 8 years (1775–1783) and inspired revolutions around the world!',
    enhancedFunFact:"The American Revolution began on April 19, 1775 at Lexington and Concord. The Declaration of Independence was signed July 4, 1776. The war ended with the Treaty of Paris in 1783. France was a crucial ally — without their support, the colonists may not have won.",
    learningLink:'https://www.britannica.com/event/American-Revolution',
    source:'Britannica', tags:['American Revolution','independence'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-007', legacyId:'hist_007', version:1,
    category:'History', difficulty:'medium',
    question:'In what year did World War II end?',
    options:['1945','1943','1947','1950'], correct:'1945',
    hint:'In the 1940s — the second half of the decade',
    funFact:'WWII was the deadliest conflict in human history. It lasted 6 years and involved most of the world.',
    enhancedFunFact:"WWII ended in two stages: V-E Day (Victory in Europe) on May 8, 1945 when Germany surrendered, and V-J Day (Victory over Japan) on September 2, 1945. The US dropped atomic bombs on Hiroshima (Aug 6) and Nagasaki (Aug 9), leading to Japan's surrender. About 70–85 million people died.",
    learningLink:'https://www.britannica.com/event/World-War-II',
    source:'Britannica', tags:['WWII','world wars'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-008', legacyId:'hist_008', version:1,
    category:'History', difficulty:'easy',
    question:'Who was the first person to walk on the Moon?',
    options:['Neil Armstrong','Buzz Aldrin','John Glenn','Yuri Gagarin'], correct:'Neil Armstrong',
    hint:'Last name is a tool + clothing (arm + strong)',
    funFact:'Neil Armstrong said "That\'s one small step for man, one giant leap for mankind" on July 20, 1969.',
    enhancedFunFact:"Apollo 11 launched July 16, 1969. Armstrong and Buzz Aldrin walked on the Moon while Michael Collins orbited above. Armstrong stepped onto the lunar surface at 10:56 PM EDT on July 20. They collected 47.5 lbs of lunar samples. The mission fulfilled JFK's 1961 goal of landing on the Moon.",
    learningLink:'https://www.britannica.com/biography/Neil-Armstrong',
    source:'Britannica', tags:['space','Moon landing'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-009', legacyId:'hist_009', version:1,
    category:'History', difficulty:'medium',
    question:'Which civilization primarily built the Great Wall of China?',
    options:['Chinese Empire','Mongol Empire','Roman Empire','Ottoman Empire'], correct:'Chinese Empire',
    hint:'It is named after the country it protects',
    funFact:'The Great Wall stretches over 13,000 miles! Construction spanned more than 2,000 years.',
    enhancedFunFact:"The Great Wall was built over many dynasties starting around 7th century BCE. The most famous sections were built during the Ming Dynasty (1368–1644 CE). It was built to protect against northern invaders. Contrary to myth, it is NOT visible from space with the naked eye.",
    learningLink:'https://www.britannica.com/structure/Great-Wall-of-China',
    source:'Britannica', tags:['China','ancient structures'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-010', legacyId:'hist_010', version:1,
    category:'History', difficulty:'hard',
    question:'In what year is the Western Roman Empire generally considered to have fallen?',
    options:['476','395','553','410'], correct:'476',
    hint:'In the 400s CE',
    funFact:'The fall marked the end of ancient times and the beginning of the Middle Ages in Western Europe.',
    enhancedFunFact:"In 476 CE, the Germanic chieftain Odoacer deposed the last Western Roman Emperor, Romulus Augustulus. The Eastern Roman Empire (Byzantine Empire) continued for another 1,000 years until 1453 CE. Rome's fall was a gradual process — economic troubles, military pressure, and political instability all contributed.",
    learningLink:'https://www.britannica.com/event/fall-of-Rome',
    source:'Britannica', tags:['Roman Empire','ancient history'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-011', legacyId:'hist_011', version:1,
    category:'History', difficulty:'medium',
    question:'Who invented the printing press around 1440?',
    options:['Johannes Gutenberg','Leonardo da Vinci','Isaac Newton','Marco Polo'], correct:'Johannes Gutenberg',
    hint:'His first name is Johannes, a German name',
    funFact:"The printing press revolutionized the world! It's considered one of history's most important inventions.",
    enhancedFunFact:"Gutenberg's printing press used movable metal type and an oil-based ink. His first major printed work was the Gutenberg Bible (1455). Before the press, books were copied by hand — it could take a monk years to copy one book. The press made books affordable and spread literacy across Europe.",
    learningLink:'https://www.britannica.com/biography/Johannes-Gutenberg',
    source:'Britannica', tags:['inventions','printing'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-012', legacyId:'hist_012', version:1,
    category:'History', difficulty:'easy',
    question:'Which US president issued the Emancipation Proclamation to end slavery?',
    options:['Abraham Lincoln','Ulysses S. Grant','Andrew Johnson','Thomas Jefferson'], correct:'Abraham Lincoln',
    hint:'His face is on the penny and the $5 bill',
    funFact:'Lincoln issued the Emancipation Proclamation in 1863. He is consistently rated as one of the greatest US presidents.',
    enhancedFunFact:"The Emancipation Proclamation took effect January 1, 1863, freeing slaves in Confederate states. It was a wartime measure that shifted the Civil War's purpose to ending slavery. The 13th Amendment (1865) formally abolished slavery everywhere in the US. Lincoln was assassinated just 5 days after the war ended.",
    learningLink:'https://www.britannica.com/biography/Abraham-Lincoln',
    source:'Britannica', tags:['presidents','Civil War'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-013', legacyId:'hist_013', version:1,
    category:'History', difficulty:'medium',
    question:'What year did the American Civil War begin?',
    options:['1861','1855','1863','1857'], correct:'1861',
    hint:'In the 1860s — near the start of the decade',
    funFact:'The Civil War lasted 4 years with over 620,000 deaths — more Americans than in any other war.',
    enhancedFunFact:"The Civil War began April 12, 1861 when Confederate forces fired on Fort Sumter, South Carolina. It was fought over slavery and states' rights. The war ended April 9, 1865 when Lee surrendered to Grant at Appomattox Court House. It remains the deadliest war in American history.",
    learningLink:'https://www.britannica.com/event/American-Civil-War',
    source:'Britannica', tags:['Civil War','US history'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-014', legacyId:'hist_014', version:1,
    category:'History', difficulty:'medium',
    question:'Which Greek philosopher was the teacher of Aristotle?',
    options:['Plato','Socrates','Homer','Pythagoras'], correct:'Plato',
    hint:'Sounds like "play-toe"',
    funFact:'Plato founded the Academy, one of the first institutions of higher learning in the Western world!',
    enhancedFunFact:"The chain of great teachers: Socrates taught Plato, and Plato taught Aristotle. Plato wrote dialogues presenting Socrates' ideas, since Socrates wrote nothing himself. Plato's Academy in Athens operated for over 900 years until 529 CE. His ideas on ideal government and truth still influence us today.",
    learningLink:'https://www.britannica.com/biography/Plato',
    source:'Britannica', tags:['Greek philosophy','ancient Greece'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-hist-015', legacyId:'hist_015', version:1,
    category:'History', difficulty:'medium',
    question:'In what year did the Berlin Wall fall?',
    options:['1989','1991','1985','1979'], correct:'1989',
    hint:'Near the end of the 1980s',
    funFact:'The Berlin Wall had divided East and West Berlin for 28 years before its fall on November 9, 1989!',
    enhancedFunFact:"The Berlin Wall was built by East Germany in 1961 to stop people fleeing to the West. On November 9, 1989, an announcement that borders were open led to crowds tearing it down. German reunification followed on October 3, 1990. The fall symbolized the end of the Cold War.",
    learningLink:'https://www.britannica.com/event/Berlin-Wall',
    source:'Britannica', tags:['Cold War','Germany'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },

  // ══════════════ GEOGRAPHY (15) ══════════════
  {
    uuid:'q-geo-001', legacyId:'geo_001', version:1,
    category:'Geography', difficulty:'easy',
    question:'What is the capital city of France?',
    options:['Paris','Lyon','Marseille','Bordeaux'], correct:'Paris',
    hint:'City of Light',
    funFact:'Paris is built along the Seine River and is home to the Eiffel Tower, built in 1889.',
    enhancedFunFact:"Paris has been France's capital for over 1,000 years. The Eiffel Tower was originally a temporary structure built for the 1889 World's Fair. Paris has about 2.2 million people in the city proper but 12 million in the greater metro area. It's known as the 'City of Light' for its early use of street lighting.",
    learningLink:'https://www.britannica.com/place/Paris',
    source:'Britannica', tags:['Europe','capitals'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-002', legacyId:'geo_002', version:1,
    category:'Geography', difficulty:'easy',
    question:'Which is the largest country in the world by land area?',
    options:['Russia','Canada','China','United States'], correct:'Russia',
    hint:'The largest country',
    funFact:'Russia covers 17.1 million km² and stretches across 11 time zones!',
    enhancedFunFact:"Russia spans 11 time zones — so when it's noon in Moscow, it's 10 PM in the Far East. It covers 1/8 of Earth's total land area. Russia borders 14 countries. Despite its size, much of Siberia is uninhabitable due to permafrost. About 80% of Russians live in the European part.",
    learningLink:'https://www.britannica.com/place/Russia',
    source:'Britannica', tags:['countries','area'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-003', legacyId:'geo_003', version:1,
    category:'Geography', difficulty:'easy',
    question:'What is the capital city of Japan?',
    options:['Tokyo','Osaka','Kyoto','Hiroshima'], correct:'Tokyo',
    hint:'The most populous metropolitan area in the world',
    funFact:'The Tokyo metro area has over 37 million people — the largest urban area on Earth!',
    enhancedFunFact:"Tokyo became Japan's capital in 1869 when Emperor Meiji moved there from Kyoto. The name means 'Eastern Capital.' It sits on Honshu, Japan's main island. Despite being one of the world's most densely populated cities, Tokyo has very low crime rates and is famous for its cleanliness and efficiency.",
    learningLink:'https://www.britannica.com/place/Tokyo',
    source:'Britannica', tags:['Asia','capitals','Japan'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-004', legacyId:'geo_004', version:1,
    category:'Geography', difficulty:'medium',
    question:'Which is the smallest continent by land area?',
    options:['Australia','Europe','Antarctica','South America'], correct:'Australia',
    hint:'It is also a country',
    funFact:'Australia is home to kangaroos, koalas, and platypuses — animals found nowhere else on Earth!',
    enhancedFunFact:"Australia is both a continent and a country — the only place in the world where this is true. It's about the size of the contiguous United States. Because it separated from other continents 50 million years ago, its wildlife evolved separately. About 80% of its plants and animals are found nowhere else.",
    learningLink:'https://www.britannica.com/place/Australia',
    source:'Britannica', tags:['continents','Australia'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-005', legacyId:'geo_005', version:1,
    category:'Geography', difficulty:'easy',
    question:'What is the longest river in the world?',
    options:['Nile River','Amazon River','Mississippi River','Congo River'], correct:'Nile River',
    hint:'Flows through Egypt and northeastern Africa',
    funFact:'The Nile is about 4,135 miles long! Ancient Egyptian civilization was built along its banks.',
    enhancedFunFact:"The Nile flows north through 11 countries before emptying into the Mediterranean Sea. Ancient Egypt depended on its annual floods to deposit rich soil for farming. The Nile has two main tributaries: the White Nile (from Uganda) and the Blue Nile (from Ethiopia). Note: some scientists debate whether the Amazon is longer.",
    learningLink:'https://www.britannica.com/place/Nile-River',
    source:'Britannica', tags:['rivers','Africa'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-006', legacyId:'geo_006', version:1,
    category:'Geography', difficulty:'easy',
    question:'Which ocean is the largest in the world?',
    options:['Pacific Ocean','Atlantic Ocean','Indian Ocean','Arctic Ocean'], correct:'Pacific Ocean',
    hint:'Located between Asia/Australia and the Americas',
    funFact:"The Pacific Ocean is so large that all the world's land could fit inside it! It covers 46% of Earth's ocean surface.",
    enhancedFunFact:"The Pacific covers about 165 million km² — more than all land on Earth combined. It contains the Mariana Trench, the deepest point on Earth at about 36,000 feet. The Ring of Fire — a zone of active volcanoes and earthquakes — circles the Pacific. It was named by Magellan in 1520.",
    learningLink:'https://www.britannica.com/place/Pacific-Ocean',
    source:'Britannica', tags:['oceans','geography'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-007', legacyId:'geo_007', version:1,
    category:'Geography', difficulty:'easy',
    question:'What is the capital city of India?',
    options:['New Delhi','Mumbai','Kolkata','Chennai'], correct:'New Delhi',
    hint:'Located in northern India',
    funFact:"New Delhi was built in the early 1900s as a planned capital. It's home to over 25 million people in its metro area!",
    enhancedFunFact:"New Delhi became India's capital in 1911 when the British moved it from Calcutta. It sits within the larger Delhi region. India has 28 states and 8 union territories. Mumbai (formerly Bombay) is India's financial capital and largest city by population with about 20 million people.",
    learningLink:'https://www.britannica.com/place/New-Delhi',
    source:'Britannica', tags:['Asia','capitals','India'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-008', legacyId:'geo_008', version:1,
    category:'Geography', difficulty:'easy',
    question:'Which mountain is the highest in the world?',
    options:['Mount Everest','K2','Kangchenjunga','Mont Blanc'], correct:'Mount Everest',
    hint:'Located in the Himalayas between Nepal and Tibet',
    funFact:'Mount Everest is 29,032 feet tall. Climbing it is extremely challenging — over 300 people have died attempting it.',
    enhancedFunFact:"Everest was first summited by Edmund Hillary and Tenzing Norgay on May 29, 1953. Its Nepali name is 'Sagarmatha' (goddess of the sky). The mountain grows about 4mm per year due to tectonic uplift. At the summit, oxygen levels are only 1/3 of sea level — climbers often need supplemental oxygen.",
    learningLink:'https://www.britannica.com/place/Mount-Everest',
    source:'Britannica', tags:['mountains','Asia'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-009', legacyId:'geo_009', version:1,
    category:'Geography', difficulty:'medium',
    question:'What is the capital city of Brazil?',
    options:['Brasília','Rio de Janeiro','São Paulo','Manaus'], correct:'Brasília',
    hint:'It was specially built as a new capital in the 1960s',
    funFact:"Brasília is a UNESCO World Heritage site known for its modernist architecture — it was designed from scratch!",
    enhancedFunFact:"Brasília was built in just 41 months and became Brazil's capital on April 21, 1960. It was designed by urban planner Lúcio Costa and architect Oscar Niemeyer. When viewed from above, the city is shaped like a bird or airplane. Many people incorrectly guess Rio de Janeiro is the capital.",
    learningLink:'https://www.britannica.com/place/Brasilia',
    source:'Britannica', tags:['South America','capitals','Brazil'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-010', legacyId:'geo_010', version:1,
    category:'Geography', difficulty:'hard',
    question:'Which is technically the largest desert in the world?',
    options:['Antarctica','Sahara','Arabian Desert','Gobi Desert'], correct:'Antarctica',
    hint:'A desert is defined by low precipitation — not temperature',
    funFact:"Antarctica is officially a cold desert! It receives less than 2 inches of precipitation per year — making it the driest continent.",
    enhancedFunFact:"A desert is defined as any area receiving less than 10 inches of precipitation per year. Antarctica receives less than 2 inches — making it a polar desert covering 5.5 million sq miles. The Sahara (the largest hot desert) covers 3.3 million sq miles. Antarctica also holds 70% of Earth's fresh water as ice.",
    learningLink:'https://www.britannica.com/place/Antarctica',
    source:'Britannica', tags:['deserts','Antarctica'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-011', legacyId:'geo_011', version:1,
    category:'Geography', difficulty:'easy',
    question:'How many continents are there on Earth?',
    options:['7','5','6','8'], correct:'7',
    hint:'Between 6 and 8',
    funFact:'The 7 continents are: North America, South America, Europe, Africa, Asia, Australia, and Antarctica.',
    enhancedFunFact:"Some countries teach 6 continents (combining Europe and Asia as Eurasia, or North and South America as America). The 7-continent model is most common in English-speaking countries. Asia is the largest continent (44 million km²) and Australia is the smallest. All 7 continents except Antarctica have permanent human populations.",
    learningLink:'https://www.britannica.com/topic/continent',
    source:'Britannica', tags:['continents'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-012', legacyId:'geo_012', version:1,
    category:'Geography', difficulty:'easy',
    question:'What is the capital city of Egypt?',
    options:['Cairo','Alexandria','Luxor','Giza'], correct:'Cairo',
    hint:'The largest city in Africa',
    funFact:"Cairo is home to over 20 million people and is located close to the Great Pyramids of Giza!",
    enhancedFunFact:"Cairo sits at the southern tip of the Nile Delta. The city was founded in 969 CE by the Fatimid dynasty. Greater Cairo is Africa's largest urban area. The Giza Pyramids are on the outskirts of modern Cairo. Cairo means 'The Victorious' in Arabic.",
    learningLink:'https://www.britannica.com/place/Cairo',
    source:'Britannica', tags:['Africa','capitals','Egypt'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-013', legacyId:'geo_013', version:1,
    category:'Geography', difficulty:'medium',
    question:'Which country recently became the most populous in the world?',
    options:['India','China','United States','Indonesia'], correct:'India',
    hint:'Located in South Asia',
    funFact:'India surpassed China in 2023 to become the most populous country with over 1.4 billion people!',
    enhancedFunFact:"India surpassed China as the world's most populous country in 2023. India has about 1.43 billion people versus China's 1.41 billion. India's population is younger and growing faster. India is also the world's largest democracy. It is projected to reach 1.67 billion people by 2050.",
    learningLink:'https://www.britannica.com/place/India',
    source:'Britannica', tags:['population','Asia'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-014', legacyId:'geo_014', version:1,
    category:'Geography', difficulty:'medium',
    question:'What is the capital city of Australia?',
    options:['Canberra','Sydney','Melbourne','Brisbane'], correct:'Canberra',
    hint:"It's not Sydney or Melbourne — it was chosen as a compromise",
    funFact:'Canberra was chosen as capital because Sydney and Melbourne could not agree on which city should be the capital!',
    enhancedFunFact:"Canberra was purpose-built as Australia's capital, with construction beginning in 1913. It is located between Sydney and Melbourne to avoid rivalry. The name comes from an Aboriginal word meaning 'meeting place.' Despite being the capital, Canberra has only about 450,000 people — Sydney and Melbourne are both much larger.",
    learningLink:'https://www.britannica.com/place/Canberra',
    source:'Britannica', tags:['Australia','capitals'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-geo-015', legacyId:'geo_015', version:1,
    category:'Geography', difficulty:'easy',
    question:'Which country contains the majority of the Amazon Rainforest?',
    options:['Brazil','Peru','Colombia','Venezuela'], correct:'Brazil',
    hint:'The largest country in South America',
    funFact:"The Amazon covers 5.5 million km² and is home to 10% of all species on Earth. It produces 20% of the world's oxygen!",
    enhancedFunFact:"About 60% of the Amazon is in Brazil, with the rest in 8 other countries. The Amazon River discharges 20% of all fresh water flowing into the world's oceans. The rainforest is home to 10% of all species on Earth, including 40,000 plant species, 1,300 bird species, and 3,000 types of fish.",
    learningLink:'https://www.britannica.com/place/Amazon-Rainforest',
    source:'Britannica', tags:['South America','rainforest'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },

  // ══════════════ TECHNOLOGY (12) ══════════════
  {
    uuid:'q-tech-001', legacyId:'tech_001', version:1,
    category:'Technology', difficulty:'easy',
    question:'What does "AI" stand for?',
    options:['Artificial Intelligence','Automated Interface','Algorithmic Innovation','Applied Intelligence'], correct:'Artificial Intelligence',
    hint:'Starts with A and I',
    funFact:'AI systems can now write essays, create images, compose music, and even help scientists discover new medicines!',
    enhancedFunFact:"AI refers to machines performing tasks that typically require human intelligence — learning, reasoning, problem-solving, perception. Modern AI uses neural networks inspired by the human brain. Large Language Models (like those used in chatbots) are trained on billions of text examples. AI is rapidly changing medicine, science, and everyday life.",
    learningLink:'https://www.britannica.com/technology/artificial-intelligence',
    source:'Britannica', tags:['AI','technology'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-002', legacyId:'tech_002', version:1,
    category:'Technology', difficulty:'medium',
    question:'What does "HTML" stand for?',
    options:['HyperText Markup Language','High Text Meta Language','Hyper Transfer Markup Language','Hybrid Tool Meta Language'], correct:'HyperText Markup Language',
    hint:'Used to create web pages — describes the structure of web content',
    funFact:"HTML was created by Tim Berners-Lee in 1989. It's the foundation of every website on the internet!",
    enhancedFunFact:"HTML uses tags like <h1>, <p>, and <img> to structure web content. The current version is HTML5 (2014). Tim Berners-Lee invented HTML while working at CERN to help scientists share research. CSS adds styling and JavaScript adds interactivity — together they power the entire web.",
    learningLink:'https://www.w3schools.com/whatis/whatis_html.asp',
    source:'W3Schools', tags:['web','programming'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-003', legacyId:'tech_003', version:1,
    category:'Technology', difficulty:'easy',
    question:'What does "CPU" stand for?',
    options:['Central Processing Unit','Computer Performance Unit','Core Programming Unit','Central Program Utility'], correct:'Central Processing Unit',
    hint:'The "brain" of a computer',
    funFact:"Modern CPUs perform billions of operations per second! Your phone's CPU is more powerful than the computers that sent Apollo to the Moon.",
    enhancedFunFact:"The CPU executes instructions from programs — doing arithmetic, logic, and controlling other hardware. Modern CPUs have multiple cores (mini-CPUs on one chip). Apple's M-series chips and Intel/AMD processors race to add more cores and speed. The first CPUs (like the Intel 4004, 1971) processed just 90,000 operations per second.",
    learningLink:'https://www.britannica.com/technology/CPU',
    source:'Britannica', tags:['computer hardware','CPU'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-004', legacyId:'tech_004', version:1,
    category:'Technology', difficulty:'medium',
    question:'Who invented the World Wide Web?',
    options:['Tim Berners-Lee','Bill Gates','Steve Jobs','Vint Cerf'], correct:'Tim Berners-Lee',
    hint:'His last name is hyphenated',
    funFact:"Tim Berners-Lee invented the web at CERN in 1989 and made it free and open to everyone — no patents!",
    enhancedFunFact:"Tim Berners-Lee invented the Web as a way for CERN scientists to share information. He wrote the first web browser AND web server. He proposed the Web in March 1989, and the first website went live on August 6, 1991. He deliberately gave it away for free. He still advocates for an open, equal web today.",
    learningLink:'https://www.britannica.com/biography/Tim-Berners-Lee',
    source:'Britannica', tags:['internet','inventors'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-005', legacyId:'tech_005', version:1,
    category:'Technology', difficulty:'medium',
    question:'What does "WiFi" stand for?',
    options:['Wireless Fidelity','Wide Frequency Integration','Wireless Frequency Interface','Web Interface Format'], correct:'Wireless Fidelity',
    hint:'Used for wireless internet connection',
    funFact:"WiFi revolutionized how we access the internet — now you can connect from almost anywhere without cables!",
    enhancedFunFact:"WiFi uses radio waves to transmit data wirelessly. The technology was based on IEEE 802.11 standard. WiFi 6 (released 2019) can reach speeds of 9.6 Gbps. An Australian team led by John O'Sullivan invented the key technology in the 1990s while trying to detect exploding black holes. They received a $430 million patent settlement.",
    learningLink:'https://www.britannica.com/technology/Wi-Fi',
    source:'Britannica', tags:['wireless','networking'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-006', legacyId:'tech_006', version:1,
    category:'Technology', difficulty:'medium',
    question:'What does "USB" stand for?',
    options:['Universal Serial Bus','Unified System Bridge','Universal Storage Base','Unified Signal Bus'], correct:'Universal Serial Bus',
    hint:'Used to connect devices like keyboards, phones, and drives to a computer',
    funFact:'The first USB standard was released in 1996. It was designed to replace the confusing variety of different connector types!',
    enhancedFunFact:"USB was developed by a group of companies including Intel, Microsoft, IBM, and Compaq. Before USB, computers had dozens of different ports (serial, parallel, PS/2). USB standardized connections and allowed 'plug and play' — no restart needed. USB-C (introduced 2014) is now universal for most devices.",
    learningLink:'https://www.britannica.com/technology/USB',
    source:'Britannica', tags:['hardware','connectivity'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-007', legacyId:'tech_007', version:1,
    category:'Technology', difficulty:'easy',
    question:'What does "RAM" stand for?',
    options:['Random Access Memory','Read Access Memory','Rapid Application Module','Random Application Memory'], correct:'Random Access Memory',
    hint:'A type of fast, temporary computer memory',
    funFact:"RAM is much faster than a hard drive but loses all data when powered off — it's your computer's short-term memory!",
    enhancedFunFact:"RAM stores data that the CPU is actively using. More RAM means you can run more programs at once. RAM is volatile — data disappears when power is cut. ROM (Read-Only Memory) is non-volatile. Modern smartphones have 8–16GB of RAM. In 1981, IBM's first PC had just 16KB — about 500,000 times less than a modern phone.",
    learningLink:'https://www.britannica.com/technology/RAM',
    source:'Britannica', tags:['memory','hardware'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-008', legacyId:'tech_008', version:1,
    category:'Technology', difficulty:'medium',
    question:'Who is known as the "father of computers" for designing the first mechanical computer?',
    options:['Charles Babbage','Alan Turing','Ada Lovelace','Bill Gates'], correct:'Charles Babbage',
    hint:'His last name is Babbage — a 19th century English mathematician',
    funFact:"Babbage designed the Analytical Engine in the 1800s — the first concept of a general-purpose computer. He never finished building it!",
    enhancedFunFact:"Charles Babbage designed the Difference Engine (1822) and the Analytical Engine (1837). The Analytical Engine had an arithmetic logic unit, control flow, and memory — conceptually identical to modern computers. Ada Lovelace wrote the first algorithm for it, making her the first programmer. The machines were never built in his lifetime.",
    learningLink:'https://www.britannica.com/biography/Charles-Babbage',
    source:'Britannica', tags:['computer history','inventors'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-009', legacyId:'tech_009', version:1,
    category:'Technology', difficulty:'easy',
    question:'What does "GPU" stand for?',
    options:['Graphics Processing Unit','General Program Unit','Grid Processing Utility','Global Processing Unit'], correct:'Graphics Processing Unit',
    hint:'The chip that handles graphics and visuals in computers and phones',
    funFact:"GPUs were designed for video games but now power AI, cryptocurrency mining, and scientific simulations!",
    enhancedFunFact:"GPUs process thousands of small tasks simultaneously (parallel processing), unlike CPUs which do a few complex tasks. This makes GPUs perfect for AI training, which requires massive parallel computations. NVIDIA's A100 GPU has 54 billion transistors. Modern AI breakthroughs were largely enabled by GPU computing.",
    learningLink:'https://www.britannica.com/technology/GPU',
    source:'Britannica', tags:['hardware','graphics','AI'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-010', legacyId:'tech_010', version:1,
    category:'Technology', difficulty:'medium',
    question:'What does "SSD" stand for?',
    options:['Solid State Drive','Static Storage Device','Secure System Disk','System Storage Drive'], correct:'Solid State Drive',
    hint:'A type of modern storage device with no moving parts',
    funFact:'SSDs have no moving parts — they use flash memory chips. They are much faster and more durable than old hard drives!',
    enhancedFunFact:"Traditional hard disk drives (HDDs) store data on spinning magnetic platters. SSDs use NAND flash memory chips — the same type used in USB drives and memory cards. SSDs are 5–10x faster than HDDs, use less power, and are silent. The tradeoff is cost — SSDs still cost more per GB than HDDs.",
    learningLink:'https://www.britannica.com/technology/SSD',
    source:'Britannica', tags:['storage','hardware'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-011', legacyId:'tech_011', version:1,
    category:'Technology', difficulty:'medium',
    question:'In what year was the first iPhone released?',
    options:['2007','2005','2009','2003'], correct:'2007',
    hint:'In the mid-2000s',
    funFact:"Steve Jobs introduced the iPhone on January 9, 2007, calling it 'an iPod, a phone, and an internet communicator' in one device.",
    enhancedFunFact:"The first iPhone had a 3.5-inch screen, 2 megapixel camera, and 4–8GB storage. It had no App Store (that came in 2008) and couldn't copy and paste text. It cost $499–$599. Steve Jobs called it '5 years ahead of any other phone.' It fundamentally changed how we interact with technology.",
    learningLink:'https://www.britannica.com/technology/iPhone',
    source:'Britannica', tags:['smartphones','Apple'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-tech-012', legacyId:'tech_012', version:1,
    category:'Technology', difficulty:'easy',
    question:'Who co-founded Microsoft in 1975?',
    options:['Bill Gates','Steve Jobs','Jeff Bezos','Elon Musk'], correct:'Bill Gates',
    hint:'His first name is Bill',
    funFact:"Bill Gates co-founded Microsoft with Paul Allen. Microsoft Windows now runs on about 72% of the world's desktop computers!",
    enhancedFunFact:"Bill Gates and Paul Allen founded Microsoft in Albuquerque, New Mexico in 1975. Their first product was a version of BASIC for the Altair microcomputer. Gates dropped out of Harvard to start the company. Microsoft's big break came when IBM chose them to supply the operating system for the first IBM PC in 1981.",
    learningLink:'https://www.britannica.com/biography/Bill-Gates',
    source:'Britannica', tags:['tech companies','founders'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },

  // ══════════════ ANIMALS (12) ══════════════
  {
    uuid:'q-animal-001', legacyId:'animal_001', version:1,
    category:'Animals', difficulty:'easy',
    question:'What is the fastest land animal on Earth?',
    options:['Cheetah','Lion','Leopard','Jaguar'], correct:'Cheetah',
    hint:'A big spotted cat from Africa',
    funFact:"Cheetahs can run up to 70 mph (112 km/h)! They have non-retractable claws that grip the ground like running cleats.",
    enhancedFunFact:"Cheetahs can accelerate from 0–60 mph in just 3 seconds — faster than most sports cars! But they can only maintain top speed for about 30 seconds before overheating. After a chase, they need 15–30 minutes to recover before eating. They are the only big cat that cannot roar — instead they purr and chirp.",
    learningLink:'https://www.britannica.com/animal/cheetah',
    source:'Britannica', tags:['big cats','speed'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-002', legacyId:'animal_002', version:1,
    category:'Animals', difficulty:'easy',
    question:'How many arms does an octopus have?',
    options:['8','6','10','12'], correct:'8',
    hint:"The name 'octo-pus' means eight feet",
    funFact:'Each arm has up to 300 suckers! Octopuses are highly intelligent and can solve puzzles and open jars.',
    enhancedFunFact:"Octopuses have three hearts, blue blood, and a brain that extends into each of their eight arms. They can change color in milliseconds using chromatophores. They are the most intelligent invertebrates. Some species can carry coconut shells for shelter. They live only 1–2 years.",
    learningLink:'https://www.britannica.com/animal/octopus',
    source:'Britannica', tags:['ocean animals','invertebrates'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-003', legacyId:'animal_003', version:1,
    category:'Animals', difficulty:'easy',
    question:'What is the largest animal that has ever lived on Earth?',
    options:['Blue Whale','African Elephant','Whale Shark','Giant Squid'], correct:'Blue Whale',
    hint:"It's a whale",
    funFact:'Blue whales can weigh up to 200 tons — larger than even the biggest dinosaurs ever discovered!',
    enhancedFunFact:"Blue whales grow up to 100 feet long and weigh up to 200 tons. Their hearts are the size of a small car, weighing about 400 pounds. A baby blue whale gains about 200 pounds per day. Their calls can be heard 1,000 miles away. Despite their size, they eat tiny krill — up to 40 million per day.",
    learningLink:'https://www.britannica.com/animal/blue-whale',
    source:'Britannica', tags:['whales','ocean animals'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-004', legacyId:'animal_004', version:1,
    category:'Animals', difficulty:'medium',
    question:'How many stomach chambers does a cow have?',
    options:['4','2','3','5'], correct:'4',
    hint:'More than 2',
    funFact:'Cows are ruminants with 4 stomach chambers. They swallow grass, then regurgitate and chew it again — called chewing cud!',
    enhancedFunFact:"The 4 chambers are: rumen (largest, ferments food), reticulum (filters debris), omasum (absorbs water), and abomasum (true stomach, like ours). This complex digestion allows cows to extract nutrients from tough grass. A cow produces about 100 lbs of waste per day, which is rich in methane — a greenhouse gas.",
    learningLink:'https://www.britannica.com/animal/cow',
    source:'Britannica', tags:['farm animals','digestion'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-005', legacyId:'animal_005', version:1,
    category:'Animals', difficulty:'easy',
    question:'Which bird is the only one that can fly backwards?',
    options:['Hummingbird','Parrot','Eagle','Sparrow'], correct:'Hummingbird',
    hint:'It drinks nectar from flowers and flaps its wings very fast',
    funFact:'Hummingbirds beat their wings 50–80 times per second — so fast their wings make a humming sound!',
    enhancedFunFact:"Hummingbirds are the only birds that can fly forwards, backwards, sideways, and hover in place. They consume half their body weight in sugar each day. Their hearts beat 1,200 times per minute in flight. The bee hummingbird is the world's smallest bird at just 2 inches long. There are over 360 species.",
    learningLink:'https://www.britannica.com/animal/hummingbird',
    source:'Britannica', tags:['birds','flight'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-006', legacyId:'animal_006', version:1,
    category:'Animals', difficulty:'hard',
    question:'How many consecutive days can a polar bear swim without stopping?',
    options:['6 days','2 days','1 day','3 days'], correct:'6 days',
    hint:'Measured in days — more than you might expect',
    funFact:'Polar bears are incredible swimmers and have been tracked traveling hundreds of miles across open ocean!',
    enhancedFunFact:"Scientists tracked a female polar bear who swam for 9 consecutive days covering 426 miles across the Beaufort Sea. Polar bears have a layer of fat 4 inches thick plus a water-repellent outer coat. They are classified as marine mammals. Melting sea ice is making their long swims more frequent and dangerous.",
    learningLink:'https://www.britannica.com/animal/polar-bear',
    source:'Britannica', tags:['polar animals','swimming'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-007', legacyId:'animal_007', version:1,
    category:'Animals', difficulty:'easy',
    question:'What is the slowest mammal in the world?',
    options:['Sloth','Koala','Panda','Wombat'], correct:'Sloth',
    hint:'Lives in South American rainforests and hangs upside down',
    funFact:'Sloths move so slowly that algae actually grows on their fur — providing camouflage and extra nutrients!',
    enhancedFunFact:"Sloths move at about 0.15 mph on land. They sleep 15–20 hours per day. Their slow metabolism means they only need to eat small amounts of leaves. They descend from trees about once a week to go to the bathroom. Despite being slow, they are excellent swimmers! They can hold their breath for 40 minutes.",
    learningLink:'https://www.britannica.com/animal/sloth',
    source:'Britannica', tags:['slow animals','rainforest'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-008', legacyId:'animal_008', version:1,
    category:'Animals', difficulty:'medium',
    question:'How many eyes do most spiders have?',
    options:['8','4','6','2'], correct:'8',
    hint:'More than most animals',
    funFact:'Most spiders have 8 eyes, though some cave spiders have no eyes at all. Jumping spiders have excellent vision!',
    enhancedFunFact:"Spiders typically have 8 eyes arranged in 2 rows, though their arrangement varies by species. Jumping spiders have large forward-facing eyes for accurate depth perception — like binoculars. Most spiders have poor vision and rely on vibrations in their webs. Cave-dwelling spiders have evolved to have no eyes at all.",
    learningLink:'https://www.britannica.com/animal/spider',
    source:'Britannica', tags:['spiders','arachnids'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-009', legacyId:'animal_009', version:1,
    category:'Animals', difficulty:'easy',
    question:'Which animal can change its skin color to blend with surroundings?',
    options:['Chameleon','Gecko','Iguana','Salamander'], correct:'Chameleon',
    hint:"It's a reptile that's famous for color-changing",
    funFact:"Chameleons change color for communication and mood — not just camouflage! An angry chameleon turns dark.",
    enhancedFunFact:"Chameleons change color using layers of cells called chromatophores and iridophores that contain pigments and reflect light. Their color changes signal mood, temperature, and social status more than camouflage. They also have 360° vision (each eye moves independently) and a tongue 1.5x their body length.",
    learningLink:'https://www.britannica.com/animal/chameleon',
    source:'Britannica', tags:['reptiles','camouflage'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-010', legacyId:'animal_010', version:1,
    category:'Animals', difficulty:'medium',
    question:'How many months can bears spend in hibernation?',
    options:['7 months','3 months','5 months','9 months'], correct:'7 months',
    hint:'More than half the year',
    funFact:"Bears don't eat, drink, or go to the bathroom during hibernation! They survive entirely on stored fat.",
    enhancedFunFact:"Bears can hibernate 5–7 months, depending on climate. During hibernation, their heart rate drops from 40–50 beats per minute to just 8 beats. Body temperature drops only slightly (from 100°F to 88°F). Female bears give birth during hibernation! Cubs are born tiny (1 pound) and nurse while the mother sleeps.",
    learningLink:'https://www.britannica.com/animal/bear',
    source:'Britannica', tags:['bears','hibernation'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-011', legacyId:'animal_011', version:1,
    category:'Animals', difficulty:'medium',
    question:'What is the only mammal known for laying eggs AND having a duck-like bill?',
    options:['Platypus','Koala','Echidna','Kangaroo'], correct:'Platypus',
    hint:'From Australia — it looks like several animals mixed together',
    funFact:"The platypus is venomous, lays eggs, produces milk, has a duck bill, and has a beaver tail — nature's strangest creature!",
    enhancedFunFact:"The platypus was so unusual that when British scientists first saw a specimen in 1799, they thought it was a fake. Males have venomous spurs on their hind legs. They use electroreception (sensing electric fields) to find prey underwater with their eyes and ears closed. They're one of only 5 egg-laying mammal species (monotremes).",
    learningLink:'https://www.britannica.com/animal/platypus',
    source:'Britannica', tags:['Australia','unusual animals'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-animal-012', legacyId:'animal_012', version:1,
    category:'Animals', difficulty:'medium',
    question:'Approximately how many bones does a snake\'s body contain?',
    options:['300','50','100','500'], correct:'300',
    hint:'More than 200',
    funFact:"Snakes have incredible flexibility because of their many vertebrae and ribs. Some large constrictors have over 400 bones!",
    enhancedFunFact:"The number of bones varies by species — from about 200 in small species to over 400 in large pythons. Most bones are vertebrae and pairs of ribs. Snakes have no limbs, though some (like pythons) retain tiny vestigial hip bones — evidence of their four-legged ancestors. They move by muscular contractions against surfaces.",
    learningLink:'https://www.britannica.com/animal/snake',
    source:'Britannica', tags:['reptiles','snakes'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },

  // ══════════════ SPORTS (10) ══════════════
  {
    uuid:'q-sport-001', legacyId:'sport_001', version:1,
    category:'Sports', difficulty:'easy',
    question:'In basketball, how many points is a shot worth from behind the three-point line?',
    options:['3','2','4','1'], correct:'3',
    hint:"It's in the name — three-point line",
    funFact:"Three-pointers have become increasingly important in modern basketball — teams now attempt far more than in earlier decades!",
    enhancedFunFact:"The three-point line was introduced to the NBA in 1979–80. Stephen Curry of the Golden State Warriors revolutionized the game with his three-point shooting. In the 1980s, teams averaged about 3 three-point attempts per game. Today, teams average over 35 attempts per game.",
    learningLink:'https://www.britannica.com/sports/basketball',
    source:'Britannica', tags:['basketball','scoring'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sport-002', legacyId:'sport_002', version:1,
    category:'Sports', difficulty:'easy',
    question:'How many players from each team are on the field during a soccer match?',
    options:['11','9','10','13'], correct:'11',
    hint:'More than 10',
    funFact:"Soccer is the world's most popular sport with over 4 billion fans globally — more than half the world's population!",
    enhancedFunFact:"A soccer team has 11 players: 1 goalkeeper, 4 defenders, 3–4 midfielders, and 2–3 forwards (depending on formation). The 4-4-2 formation (4 defenders, 4 midfielders, 2 forwards) was dominant for decades. Up to 3 substitutions are typically allowed per match. The FIFA World Cup is watched by over 3.5 billion viewers.",
    learningLink:'https://www.britannica.com/sports/soccer',
    source:'Britannica', tags:['soccer','team sports'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sport-003', legacyId:'sport_003', version:1,
    category:'Sports', difficulty:'easy',
    question:'Which combat sport takes place in a boxing ring?',
    options:['Boxing','Wrestling','Kickboxing','MMA'], correct:'Boxing',
    hint:'A combat sport with gloves and a referee',
    funFact:"Boxing dates back thousands of years — evidence of boxing gloves has been found in ancient Minoan Crete from 1500 BCE!",
    enhancedFunFact:"Boxing became an Olympic sport in 688 BCE. Modern boxing rules were codified in the Marquess of Queensberry Rules (1867), which introduced padded gloves and 3-minute rounds. The heaviest heavyweight champion ever was Nikolai Valuev at 7 feet tall and 320 pounds. Muhammad Ali is widely considered the greatest boxer of all time.",
    learningLink:'https://www.britannica.com/sports/boxing',
    source:'Britannica', tags:['combat sports','boxing'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sport-004', legacyId:'sport_004', version:1,
    category:'Sports', difficulty:'easy',
    question:'In American football, how many points does a touchdown score?',
    options:['6','4','7','3'], correct:'6',
    hint:'More than a field goal (3 points)',
    funFact:'After a touchdown, teams can attempt an extra point kick (1 pt) or a two-point conversion by running/passing!',
    enhancedFunFact:"A touchdown scores 6 points. After the touchdown, teams can kick for 1 extra point (very common) or attempt a 2-point conversion by getting the ball into the end zone again from the 2-yard line. A field goal scores 3 points. A safety (tackling the ball carrier in their own end zone) scores 2 points.",
    learningLink:'https://www.britannica.com/sports/American-football',
    source:'Britannica', tags:['American football','scoring'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sport-005', legacyId:'sport_005', version:1,
    category:'Sports', difficulty:'easy',
    question:'What sport combines swimming, cycling, and running in a single race?',
    options:['Triathlon','Biathlon','Pentathlon','Decathlon'], correct:'Triathlon',
    hint:'Tri = three',
    funFact:"The Ironman Triathlon requires swimming 2.4 miles, cycling 112 miles, then running a full 26.2-mile marathon!",
    enhancedFunFact:"The first modern triathlon was held in San Diego in 1974. The Ironman World Championship in Kailua-Kona, Hawaii, is the most famous event. A Biathlon involves cross-country skiing and rifle shooting. A Pentathlon has 5 events. A Decathlon has 10 events. The Olympic triathlon is shorter: 1.5 km swim, 40 km bike, 10 km run.",
    learningLink:'https://www.britannica.com/sports/triathlon',
    source:'Britannica', tags:['endurance sports','triathlon'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sport-006', legacyId:'sport_006', version:1,
    category:'Sports', difficulty:'easy',
    question:'How many innings are in a standard baseball game?',
    options:['9','7','8','12'], correct:'9',
    hint:'A single digit number',
    funFact:"If the score is tied after 9 innings, the game goes to extra innings — games can go on indefinitely until someone wins!",
    enhancedFunFact:"A baseball game has 9 innings, each with two halves (top and bottom). The visiting team bats in the top half, home team in the bottom. If tied after 9, extra innings continue until someone wins. The longest professional game lasted 33 innings (1981, Pawtucket vs. Rochester, spanning two days).",
    learningLink:'https://www.britannica.com/sports/baseball',
    source:'Britannica', tags:['baseball','innings'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sport-007', legacyId:'sport_007', version:1,
    category:'Sports', difficulty:'medium',
    question:'Which tennis Grand Slam tournament is played on clay courts?',
    options:['French Open','Wimbledon','US Open','Australian Open'], correct:'French Open',
    hint:"It's held in France — also called Roland Garros",
    funFact:'The French Open is one of four Grand Slam tournaments and is the only major played on clay!',
    enhancedFunFact:"The four Grand Slams and their surfaces: French Open (clay), Wimbledon (grass), US Open (hard court), Australian Open (hard court). Rafael Nadal won the French Open a record 14 times, earning the nickname 'King of Clay.' Clay courts are slower, making rallies longer and favoring baseline players.",
    learningLink:'https://www.britannica.com/sports/French-Open',
    source:'Britannica', tags:['tennis','Grand Slam'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sport-008', legacyId:'sport_008', version:1,
    category:'Sports', difficulty:'medium',
    question:'What is the highest possible score in a single game of bowling?',
    options:['300','200','250','360'], correct:'300',
    hint:'A perfect game requires 12 consecutive strikes',
    funFact:"A perfect 300 game requires 12 strikes in a row! In the 10th frame, you get a bonus ball for each strike.",
    enhancedFunFact:"A bowling game has 10 frames. A strike (knocking all 10 pins on first ball) scores 10 plus the next two balls. A spare (knocking all pins in 2 balls) scores 10 plus next ball. In the 10th frame, you can bowl up to 3 times. Getting 12 consecutive strikes gives the maximum score of 300.",
    learningLink:'https://www.britannica.com/sports/bowling',
    source:'Britannica', tags:['bowling','scoring'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sport-009', legacyId:'sport_009', version:1,
    category:'Sports', difficulty:'easy',
    question:'How many holes are on a standard golf course?',
    options:['18','9','12','27'], correct:'18',
    hint:'More than 9',
    funFact:'Golf courses started with 9 holes, but 18 became the standard in the 1700s when the Royal and Ancient Golf Club of St Andrews standardized it!',
    enhancedFunFact:"The 18-hole standard was established at St Andrews in Scotland in 1764. Before that, courses had varying numbers of holes — some had 22! A standard round of golf takes about 4 hours. Par for a full course is typically 72 (averaging par 4 per hole). Golf was banned by Scottish kings in the 1400s for distracting soldiers from archery practice.",
    learningLink:'https://www.britannica.com/sports/golf',
    source:'Britannica', tags:['golf'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-sport-010', legacyId:'sport_010', version:1,
    category:'Sports', difficulty:'medium',
    question:'How many players from each team are on the court during a volleyball game?',
    options:['6','4','7','9'], correct:'6',
    hint:'Less than 11',
    funFact:'Beach volleyball has only 2 players per side — but indoor volleyball has 6!',
    enhancedFunFact:"Indoor volleyball teams have 6 players: 3 front row and 3 back row. One player (the libero, wearing a different jersey) specializes in defense and cannot attack the ball. Teams rotate positions clockwise each time they win the serve. A match is typically best of 5 sets (first to 25 points, final set to 15).",
    learningLink:'https://www.britannica.com/sports/volleyball',
    source:'Britannica', tags:['volleyball','team sports'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },

  // ══════════════ MATHEMATICS (12) ══════════════
  {
    uuid:'q-math-001', legacyId:'math_001', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'What is 2 + 2?',
    options:['4','3','5','6'], correct:'4',
    hint:'A small number greater than 3',
    funFact:"This is the foundation of arithmetic! Mathematics builds from these basic operations to calculus, statistics, and beyond.",
    enhancedFunFact:"Addition is the most fundamental arithmetic operation. The number 4 is the first non-prime composite number. In binary (the language computers use), 4 is written as '100'. Fun fact: 4 is the only number that has the same number of letters as its value in English!",
    learningLink:'https://www.khanacademy.org/math/arithmetic/add-subtract',
    source:'Khan Academy', tags:['arithmetic','addition'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-002', legacyId:'math_002', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'What is the square root of 16?',
    options:['4','2','6','8'], correct:'4',
    hint:'What number times itself equals 16?',
    funFact:'Square roots and squares are inverses. 4² = 16, so √16 = 4. Powers show repeated multiplication!',
    enhancedFunFact:"The square root of a number x is a value that, when multiplied by itself, gives x. Perfect squares (1, 4, 9, 16, 25, 36...) have whole number square roots. Irrational numbers like √2 = 1.41421... go on forever without repeating. The square root symbol (√) was first used in 1525 by Christoph Rudolff.",
    learningLink:'https://www.khanacademy.org/math/pre-algebra/exponents-radicals',
    source:'Khan Academy', tags:['square roots','powers'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-003', legacyId:'math_003', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'How many degrees are there in a complete circle?',
    options:['360','180','270','90'], correct:'360',
    hint:'A large number — also used in navigational directions',
    funFact:"Ancient Babylonians chose 360 because it's divisible by many numbers (2, 3, 4, 5, 6, 8, 9, 10, 12...)!",
    enhancedFunFact:"The Babylonians divided a circle into 360° because it was close to the 365-day year and highly divisible. A right angle is 90°, a straight line is 180°, and a full rotation is 360°. Radians are another way to measure angles: 2π radians = 360°. Radians are preferred in advanced mathematics.",
    learningLink:'https://www.khanacademy.org/math/geometry/gg-angles',
    source:'Khan Academy', tags:['geometry','angles'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-004', legacyId:'math_004', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'What is the value of Pi (π) rounded to two decimal places?',
    options:['3.14','3.12','3.16','2.72'], correct:'3.14',
    hint:'Used to calculate the circumference of a circle',
    funFact:'Pi is irrational and goes on forever! Mathematicians have calculated it to over 100 trillion decimal places!',
    enhancedFunFact:"Pi (π) = 3.14159265358979... and never repeats or ends. It's the ratio of a circle's circumference to its diameter. Pi Day is March 14 (3/14). In 2022, a team calculated pi to 100 trillion digits using a computer over 157 days. There is a pi memorization record of 70,000 decimal places!",
    learningLink:'https://www.khanacademy.org/math/geometry/gg-circles',
    source:'Khan Academy', tags:['pi','circles'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-005', legacyId:'math_005', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'What is 10% of 50?',
    options:['5','10','50','25'], correct:'5',
    hint:'10% means one-tenth',
    funFact:'Percentages mean "per hundred." To find 10%, just move the decimal point one place to the left!',
    enhancedFunFact:"'Percent' comes from Latin 'per centum' meaning 'per hundred.' To find 10%: divide by 10. To find 1%: divide by 100. To find 50%: divide by 2. To find 25%: divide by 4. Percentages are used everywhere: sales tax, interest rates, tips, grades, and statistics.",
    learningLink:'https://www.khanacademy.org/math/pre-algebra/ratios-rates',
    source:'Khan Academy', tags:['percentages','arithmetic'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-006', legacyId:'math_006', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'What is 5 × 6?',
    options:['30','25','35','11'], correct:'30',
    hint:'In the 20s or 30s',
    funFact:'Multiplication is repeated addition. 5 × 6 is the same as 5 + 5 + 5 + 5 + 5 + 5 = 30!',
    enhancedFunFact:"Multiplication tables have been taught since ancient Babylon (1800 BCE). The commutative property means 5 × 6 = 6 × 5. Knowing multiplication tables up to 12×12 builds the foundation for algebra, fractions, and beyond. A trick: any number times 5 ends in 5 or 0; any number times 9 has digits summing to 9.",
    learningLink:'https://www.khanacademy.org/math/arithmetic/multiply-divide',
    source:'Khan Academy', tags:['multiplication','arithmetic'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-007', legacyId:'math_007', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'How many sides does a hexagon have?',
    options:['6','5','7','8'], correct:'6',
    hint:"'Hex' is Greek for six",
    funFact:'Hexagons are incredibly efficient in nature! Honeycomb cells are hexagons because they pack together with no wasted space.',
    enhancedFunFact:"Hexagons tile a flat surface perfectly (like honeycomb or a bathroom floor). Bees build hexagonal cells because hexagons use 15% less wax than circular cells for the same storage. Giant's Causeway in Ireland has thousands of natural hexagonal basalt columns. Snowflakes always have six-sided (hexagonal) symmetry.",
    learningLink:'https://www.khanacademy.org/math/geometry/gg-polygons',
    source:'Khan Academy', tags:['polygons','geometry'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-008', legacyId:'math_008', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'What is the area of a square with sides of 4 cm?',
    options:['16 sq cm','8 sq cm','12 sq cm','20 sq cm'], correct:'16 sq cm',
    hint:'Area = side × side',
    funFact:'Area tells you how much flat surface is covered. For squares: Area = side². So 4 × 4 = 16!',
    enhancedFunFact:"Area is measured in square units (cm², m², km²). For a square: A = s². For a rectangle: A = l × w. For a triangle: A = ½ × base × height. For a circle: A = πr². A 4cm square has perimeter = 4 × 4 = 16 cm AND area = 4² = 16 cm² — a fun coincidence when side = 4!",
    learningLink:'https://www.khanacademy.org/math/geometry/gg-area-perimeter',
    source:'Khan Academy', tags:['area','geometry'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-009', legacyId:'math_009', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'What is 100 ÷ 5?',
    options:['20','10','25','50'], correct:'20',
    hint:'In the 15–25 range',
    funFact:'Division splits things into equal groups. 100 ÷ 5 = 20 means 100 can be divided into 5 equal groups of 20!',
    enhancedFunFact:"Division and multiplication are inverse operations: 20 × 5 = 100, so 100 ÷ 5 = 20. The ÷ symbol is called an obelus. In most of the world, ÷ means divide in everyday math, but in formal mathematics, a fraction bar (100/5) or slash is preferred. Division by zero is undefined — it breaks mathematics!",
    learningLink:'https://www.khanacademy.org/math/arithmetic/multiply-divide',
    source:'Khan Academy', tags:['division','arithmetic'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-010', legacyId:'math_010', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'What is 3² (three squared)?',
    options:['9','6','12','16'], correct:'9',
    hint:'It means 3 × 3',
    funFact:'Squaring a number means multiplying it by itself. 3² = 3 × 3 = 9. This shows up everywhere in geometry and physics!',
    enhancedFunFact:"Exponents represent repeated multiplication: 3² = 9, 3³ = 27, 3⁴ = 81. The Pythagorean theorem uses squares: a² + b² = c². E = mc² uses the square of the speed of light. Squaring is the inverse of square roots. 1² = 1, 2² = 4, 3² = 9, 4² = 16, 5² = 25, 10² = 100.",
    learningLink:'https://www.khanacademy.org/math/pre-algebra/exponents-radicals',
    source:'Khan Academy', tags:['exponents','powers'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-011', legacyId:'math_011', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'What is 50% of 200?',
    options:['100','50','150','200'], correct:'100',
    hint:"50% means one-half",
    funFact:'50% means exactly half! To find 50% of any number, just divide by 2. Easy!',
    enhancedFunFact:"50% = 1/2 = 0.5. To find any percentage: multiply by the decimal form (50% → ×0.5, 25% → ×0.25, 75% → ×0.75). Understanding percentages helps with shopping (20% off!), investing (5% interest), and understanding statistics (85% of people...).",
    learningLink:'https://www.khanacademy.org/math/pre-algebra/ratios-rates',
    source:'Khan Academy', tags:['percentages'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-math-012', legacyId:'math_012', version:1,
    category:'Mathematics', difficulty:'easy',
    question:'How many millimeters are in 1 centimeter?',
    options:['10','5','100','1000'], correct:'10',
    hint:'A small number',
    funFact:"The metric system uses powers of 10, making conversions simple. Milli = 1/1000, Centi = 1/100, Kilo = 1000!",
    enhancedFunFact:"Metric prefixes: milli (1/1000), centi (1/100), deci (1/10), [base], deca (10), hecto (100), kilo (1000). So: 1 cm = 10 mm, 1 m = 100 cm = 1000 mm, 1 km = 1000 m. The metric system was created during the French Revolution in 1795 and is now used by nearly every country except the US.",
    learningLink:'https://www.khanacademy.org/math/pre-algebra/measurement',
    source:'Khan Academy', tags:['measurement','metric'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },

  // ══════════════ LITERATURE (12) ══════════════
  {
    uuid:'q-lit-001', legacyId:'lit_001', version:1,
    category:'Literature', difficulty:'easy',
    question:'Who wrote the play "Romeo and Juliet"?',
    options:['William Shakespeare','Charles Dickens','Jane Austen','Leo Tolstoy'], correct:'William Shakespeare',
    hint:'Famous English playwright from the 1600s',
    funFact:"Shakespeare wrote 39 plays and 154 sonnets! His works are performed more often than any other playwright's.",
    enhancedFunFact:"William Shakespeare (1564–1616) wrote Romeo and Juliet around 1595. It was based on an older Italian story. Shakespeare invented over 1,700 words we still use today: 'bedroom,' 'lonely,' 'generous,' 'obscene.' Romeo and Juliet has been adapted into countless films, musicals, and operas.",
    learningLink:'https://www.britannica.com/biography/William-Shakespeare',
    source:'Britannica', tags:['Shakespeare','plays'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-002', legacyId:'lit_002', version:1,
    category:'Literature', difficulty:'medium',
    question:'Who wrote the novel "The Great Gatsby"?',
    options:['F. Scott Fitzgerald','Ernest Hemingway','Mark Twain','John Steinbeck'], correct:'F. Scott Fitzgerald',
    hint:'Initials F.S.F. — an American writer of the Jazz Age',
    funFact:'"The Great Gatsby" is considered one of the greatest American novels. It captures the excess of the 1920s!',
    enhancedFunFact:"The Great Gatsby was published in 1925 and initially sold poorly. Fitzgerald died in 1940 thinking it was a failure. The novel became famous after WWII when the Army distributed it to soldiers. It sold only 20,000 copies in Fitzgerald's lifetime but now sells over 500,000 copies per year.",
    learningLink:'https://www.britannica.com/biography/F-Scott-Fitzgerald',
    source:'Britannica', tags:['American literature','novels'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-003', legacyId:'lit_003', version:1,
    category:'Literature', difficulty:'medium',
    question:'In Harry Potter, which spell creates light from the tip of a wand?',
    options:['Lumos','Expecto Patronum','Alohomora','Wingardium Leviosa'], correct:'Lumos',
    hint:"Sounds like 'loom-us' — related to the Latin word for light",
    funFact:"Harry Potter has sold over 500 million copies worldwide, making it one of the best-selling book series ever!",
    enhancedFunFact:"'Lumos' comes from the Latin 'lumen' meaning light. J.K. Rowling based many spells on Latin and other classical languages. The counter-spell is 'Nox' (Latin for night/darkness). Other notable spells: Expecto Patronum (conjures guardian), Alohomora (unlocks doors), Avada Kedavra (based on Aramaic, originally meant 'let the thing be destroyed').",
    learningLink:'https://www.britannica.com/topic/Harry-Potter',
    source:'Britannica', tags:['Harry Potter','fantasy'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-004', legacyId:'lit_004', version:1,
    category:'Literature', difficulty:'medium',
    question:'Who wrote the novel "To Kill a Mockingbird"?',
    options:['Harper Lee','Maya Angelou','Toni Morrison','Flannery O\'Connor'], correct:'Harper Lee',
    hint:'First name is Harper — published in 1960',
    funFact:'"To Kill a Mockingbird" won the Pulitzer Prize in 1961 and addressed racial injustice in the American South.',
    enhancedFunFact:"Harper Lee published 'To Kill a Mockingbird' in 1960 and won the Pulitzer Prize in 1961. It was her first novel and she never expected it to succeed. The character of Dill is based on her childhood friend Truman Capote. Lee published just one other novel ('Go Set a Watchman,' 2015) before her death in 2016.",
    learningLink:'https://www.britannica.com/biography/Harper-Lee',
    source:'Britannica', tags:['American literature','Pulitzer'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-005', legacyId:'lit_005', version:1,
    category:'Literature', difficulty:'medium',
    question:'Who wrote the classic novel "Jane Eyre" (1847)?',
    options:['Charlotte Brontë','Emily Brontë','Mary Shelley','Jane Austen'], correct:'Charlotte Brontë',
    hint:'Last name is Brontë — she had famous writer sisters',
    funFact:'Many female authors in the 1800s used male pen names to be taken seriously. Charlotte Brontë published as "Currer Bell."',
    enhancedFunFact:"Charlotte Brontë published 'Jane Eyre' under the male pen name 'Currer Bell' in 1847. Her sister Emily published 'Wuthering Heights' the same year. Their sister Anne published 'Agnes Grey.' Their identities were revealed in 1848. Charlotte's other novels include 'Shirley' and 'Villette.'",
    learningLink:'https://www.britannica.com/biography/Charlotte-Bronte',
    source:'Britannica', tags:['British literature','Brontë'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-006', legacyId:'lit_006', version:1,
    category:'Literature', difficulty:'easy',
    question:'In "The Lord of the Rings," who is tasked with destroying the One Ring?',
    options:['Frodo Baggins','Gandalf','Aragorn','Bilbo Baggins'], correct:'Frodo Baggins',
    hint:'First name is Frodo — a hobbit from the Shire',
    funFact:'Tolkien spent over 10 years writing LOTR! It was published in three volumes between 1954–1955.',
    enhancedFunFact:"J.R.R. Tolkien (1892–1973) created an entire mythology with multiple languages he invented (Elvish, Dwarvish). 'The Lord of the Rings' began as a sequel to 'The Hobbit.' Tolkien was a professor of Anglo-Saxon at Oxford. His books have sold over 150 million copies and inspired the modern fantasy genre.",
    learningLink:'https://www.britannica.com/topic/The-Lord-of-the-Rings',
    source:'Britannica', tags:['fantasy','Tolkien'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-007', legacyId:'lit_007', version:1,
    category:'Literature', difficulty:'hard',
    question:'Who wrote the novel "The Catcher in the Rye"?',
    options:['J.D. Salinger','John Steinbeck','Truman Capote','Norman Mailer'], correct:'J.D. Salinger',
    hint:'Initials J.D. — a famously reclusive American author',
    funFact:'"The Catcher in the Rye" captures teenage alienation. Salinger became so famous he eventually hid from the world!',
    enhancedFunFact:"Published in 1951, 'The Catcher in the Rye' follows 16-year-old Holden Caulfield over three days in New York after being expelled from school. Salinger was so disturbed by the book's notoriety that he became a recluse in rural New Hampshire. He continued writing but published nothing after 1965.",
    learningLink:'https://www.britannica.com/biography/J-D-Salinger',
    source:'Britannica', tags:['American literature','20th century'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-008', legacyId:'lit_008', version:1,
    category:'Literature', difficulty:'medium',
    question:'Who wrote the dystopian novel "1984"?',
    options:['George Orwell','Aldous Huxley','Ray Bradbury','H.G. Wells'], correct:'George Orwell',
    hint:"George Orwell was a pen name — his real name was Eric Blair",
    funFact:'"1984" coined terms like "Big Brother," "doublethink," and "Newspeak" that are still used today!',
    enhancedFunFact:"George Orwell wrote '1984' while dying of tuberculosis, finishing it in 1948 (reverse the last two digits: 1984). It depicts a totalitarian state where the government controls all information and thought. Orwell also wrote 'Animal Farm' (1945). His writing was heavily influenced by his experiences in the Spanish Civil War and his disgust with Stalinist Russia.",
    learningLink:'https://www.britannica.com/biography/George-Orwell',
    source:'Britannica', tags:['dystopia','20th century'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-009', legacyId:'lit_009', version:1,
    category:'Literature', difficulty:'easy',
    question:'In "Alice\'s Adventures in Wonderland," which rabbit does Alice follow down the hole?',
    options:['White Rabbit','Mad Hatter','Cheshire Cat','Red Queen'], correct:'White Rabbit',
    hint:'Its color is white — Alice notices it checking a pocket watch',
    funFact:'Written by Lewis Carroll in 1865, this classic children\'s story was first told to Alice Liddell, the daughter of a colleague.',
    enhancedFunFact:"Lewis Carroll's real name was Charles Lutwidge Dodgson — a mathematics professor at Oxford. He first told the story on a boat trip on July 4, 1862, to entertain Alice Liddell and her sisters. He wrote it down at Alice's request. The book is famous for its wordplay, logic puzzles, and nonsense — all reflections of Carroll's mathematical mind.",
    learningLink:'https://www.britannica.com/topic/Alices-Adventures-in-Wonderland',
    source:'Britannica', tags:['classic literature','fantasy'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-010', legacyId:'lit_010', version:1,
    category:'Literature', difficulty:'medium',
    question:'Who wrote the classic romance novel "Pride and Prejudice"?',
    options:['Jane Austen','Charlotte Brontë','Mary Shelley','Emily Brontë'], correct:'Jane Austen',
    hint:'First name is Jane — an English author of the early 1800s',
    funFact:"Jane Austen wrote 6 major novels. All are still widely read and adapted into films and TV shows today!",
    enhancedFunFact:"Jane Austen (1775–1817) published 'Pride and Prejudice' in 1813. She originally titled it 'First Impressions.' The novel features Elizabeth Bennet and Mr. Darcy in one of literature's most famous love stories. Austen published anonymously — her books said 'By a Lady.' Her identity only became widely known after her death.",
    learningLink:'https://www.britannica.com/biography/Jane-Austen',
    source:'Britannica', tags:['British literature','romance'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-011', legacyId:'lit_011', version:1,
    category:'Literature', difficulty:'easy',
    question:'What genre is J.R.R. Tolkien\'s "The Hobbit"?',
    options:['Fantasy','Historical Fiction','Science Fiction','Mystery'], correct:'Fantasy',
    hint:'Contains magic, fictional worlds, and mythical creatures',
    funFact:'"The Hobbit" is often considered the book that launched the modern fantasy genre!',
    enhancedFunFact:"'The Hobbit' was published in 1937 and follows Bilbo Baggins on a quest with 13 dwarves and the wizard Gandalf. Tolkien began it as a story for his children. The book contains a map of Middle-earth — Tolkien's hand-drawn world that he had developed for decades. It was an immediate bestseller and led directly to 'The Lord of the Rings.'",
    learningLink:'https://www.britannica.com/topic/The-Hobbit',
    source:'Britannica', tags:['fantasy','Tolkien'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-lit-012', legacyId:'lit_012', version:1,
    category:'Literature', difficulty:'medium',
    question:'Who wrote the gothic novel "Frankenstein" (1818)?',
    options:['Mary Shelley','Charlotte Brontë','Emily Brontë','Jane Austen'], correct:'Mary Shelley',
    hint:'First name is Mary — she wrote it when she was just 18!',
    funFact:"Mary Shelley wrote 'Frankenstein' at age 18 during a ghost story contest with friends — it's considered the first science fiction novel!",
    enhancedFunFact:"Mary Shelley wrote 'Frankenstein' in 1816 during 'the year without a summer' — a volcanic eruption had caused global cooling. She and her companions (including Lord Byron and Percy Shelley) were stuck indoors and held a ghost story contest. The novel asks deep questions about creation, responsibility, and what it means to be human.",
    learningLink:'https://www.britannica.com/biography/Mary-Shelley',
    source:'Britannica', tags:['science fiction','gothic'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },

  // ══════════════ GENERAL KNOWLEDGE (8) ══════════════
  {
    uuid:'q-gen-001', legacyId:'gen_001', version:1,
    category:'General Knowledge', difficulty:'medium',
    question:'What is the smallest country in the world by area?',
    options:['Vatican City','Monaco','San Marino','Liechtenstein'], correct:'Vatican City',
    hint:"It's located inside Rome, Italy — home of the Catholic Church",
    funFact:'Vatican City is only 0.44 km² — smaller than most city parks! Yet it is a fully independent nation.',
    enhancedFunFact:"Vatican City has its own bank, post office, newspaper, radio station, and police force. It became an independent state in 1929 through the Lateran Treaty with Italy. About 800 people live there. The Vatican Museums attract 6 million visitors per year. The Sistine Chapel ceiling was painted by Michelangelo between 1508–1512.",
    learningLink:'https://www.britannica.com/place/Vatican-City',
    source:'Britannica', tags:['countries','world records'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-gen-002', legacyId:'gen_002', version:1,
    category:'General Knowledge', difficulty:'easy',
    question:'How many strings does a standard guitar have?',
    options:['6','4','5','8'], correct:'6',
    hint:'Less than 10',
    funFact:"Some guitars have 7, 8, or even 12 strings! Bass guitars typically have 4 strings.",
    enhancedFunFact:"A standard guitar has 6 strings tuned E-A-D-G-B-E (from lowest to highest). The guitar evolved from ancient stringed instruments. Classical guitars use nylon strings; acoustic and electric guitars use steel strings. A 12-string guitar has pairs of strings tuned to the same notes, creating a fuller, richer sound.",
    learningLink:'https://www.britannica.com/technology/guitar',
    source:'Britannica', tags:['music','instruments'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-gen-003', legacyId:'gen_003', version:1,
    category:'General Knowledge', difficulty:'medium',
    question:'What language has the most native speakers in the world?',
    options:['Mandarin Chinese','Spanish','English','Hindi'], correct:'Mandarin Chinese',
    hint:'An Asian language — spoken in the most populous country',
    funFact:'Mandarin Chinese has over 900 million native speakers — more than twice the native speakers of English!',
    enhancedFunFact:"Mandarin is a tonal language — the same word with different tones has completely different meanings. It uses thousands of characters (about 3,500 for daily use, 50,000+ total). English has the most total speakers (native + second language) at about 1.5 billion. The UN has 6 official languages: Arabic, Chinese, English, French, Russian, Spanish.",
    learningLink:'https://www.britannica.com/topic/Mandarin-Chinese',
    source:'Britannica', tags:['languages'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-gen-004', legacyId:'gen_004', version:1,
    category:'General Knowledge', difficulty:'easy',
    question:'How many sides does a pentagon have?',
    options:['5','6','4','8'], correct:'5',
    hint:"'Penta' is Greek for five",
    funFact:'"Penta" means five and "gonia" means angle in Greek. A regular pentagon has all equal sides and angles!',
    enhancedFunFact:"Polygons by number of sides: triangle (3), quadrilateral (4), pentagon (5), hexagon (6), heptagon (7), octagon (8), nonagon (9), decagon (10). The US Department of Defense building is called 'The Pentagon' because of its 5-sided shape. A regular pentagon has internal angles of 108° each.",
    learningLink:'https://www.britannica.com/topic/polygon',
    source:'Britannica', tags:['geometry','polygons'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-gen-005', legacyId:'gen_005', version:1,
    category:'General Knowledge', difficulty:'medium',
    question:'What is the chemical symbol for gold on the periodic table?',
    options:['Au','Go','Gd','Gl'], correct:'Au',
    hint:"Comes from the Latin word 'aurum'",
    funFact:"Gold's symbol Au comes from 'aurum,' the Latin word for gold. Gold has been valued by civilizations for thousands of years!",
    enhancedFunFact:"Gold (Au, atomic number 79) is so chemically stable it almost never reacts — gold artifacts from 3,000 years ago look exactly like new gold. All the gold ever mined would fill about 3.5 Olympic swimming pools. Gold is so malleable that 1 ounce can be hammered into a sheet covering 300 square feet. Other symbols from Latin: Fe (ferrum=iron), Cu (cuprum=copper), Pb (plumbum=lead).",
    learningLink:'https://www.britannica.com/science/gold',
    source:'Britannica', tags:['chemistry','elements'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-gen-006', legacyId:'gen_006', version:1,
    category:'General Knowledge', difficulty:'easy',
    question:'At what temperature in Celsius does water boil?',
    options:['100°C','90°C','80°C','120°C'], correct:'100°C',
    hint:'A round number',
    funFact:"The Celsius scale was designed around water: 0°C is freezing point, 100°C is boiling point. Very logical!",
    enhancedFunFact:"Water boils at 100°C (212°F) at sea level. At higher altitudes (lower pressure), it boils at a lower temperature — on Mount Everest, water boils at about 70°C (158°F), not hot enough to cook pasta properly! Adding salt raises the boiling point slightly. The Celsius scale was created by Anders Celsius in 1742.",
    learningLink:'https://www.britannica.com/science/water',
    source:'Britannica', tags:['science','temperature'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-gen-007', legacyId:'gen_007', version:1,
    category:'General Knowledge', difficulty:'medium',
    question:'How many stripes are on the American flag?',
    options:['13','50','7','10'], correct:'13',
    hint:'Represents the original states',
    funFact:'The 13 stripes represent the original 13 colonies. There are 50 stars for the current 50 states!',
    enhancedFunFact:"The 13 stripes alternate 7 red and 6 white. The 50 stars represent the current states, arranged in 9 rows alternating 6 and 5 stars. The flag has been changed 27 times as new states joined. The current 50-star flag was designed by 17-year-old Bob Heft as a school project in 1958 — he received a B-. When it was adopted, his teacher changed his grade to an A.",
    learningLink:'https://www.britannica.com/topic/United-States-flag',
    source:'Britannica', tags:['American symbols'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  },
  {
    uuid:'q-gen-008', legacyId:'gen_008', version:1,
    category:'General Knowledge', difficulty:'easy',
    question:'How many colors are in a rainbow?',
    options:['7','5','6','8'], correct:'7',
    hint:'Same number as continents',
    funFact:'ROYGBIV: Red, Orange, Yellow, Green, Blue, Indigo, Violet — the seven colors of the rainbow!',
    enhancedFunFact:"Rainbows form when sunlight enters water droplets, refracts, reflects inside, and refracts again. Each color bends at a slightly different angle — red (42°) to violet (40°). You see a rainbow when the sun is behind you and rain is in front. A double rainbow has the second arc with colors reversed. Full-circle rainbows exist but you need to be in an airplane to see one.",
    learningLink:'https://www.britannica.com/science/rainbow',
    source:'Britannica', tags:['light','optics'], createdAt:'2026-06-11', updatedAt:'2026-06-11'
  }

]; // end TRIVIA_QUESTION_BANK

// Helper: get questions by category
function getQuestionsByCategory(category) {
  return TRIVIA_QUESTION_BANK.filter(q => q.category === category);
}

// Helper: get questions by difficulty
function getQuestionsByDifficulty(difficulty) {
  return TRIVIA_QUESTION_BANK.filter(q => q.difficulty === difficulty);
}

// Helper: get question by UUID
function getQuestionByUUID(uuid) {
  return TRIVIA_QUESTION_BANK.find(q => q.uuid === uuid);
}

// Stats: question count by category
const TRIVIA_CATEGORY_STATS = TRIVIA_QUESTION_BANK.reduce((acc, q) => {
  acc[q.category] = (acc[q.category] || 0) + 1;
  return acc;
}, {});

console.log('[TriviaDB] Question bank loaded:', TRIVIA_QUESTION_BANK.length, 'questions');
console.log('[TriviaDB] Categories:', TRIVIA_CATEGORY_STATS);
