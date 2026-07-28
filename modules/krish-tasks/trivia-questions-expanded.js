/**
 * EXPANDED TRIVIA QUESTION BANK
 * 130+ questions across 12 categories
 * Age-appropriate for middle school learners
 * Includes fun facts and learning resources
 */

const TRIVIA_QUESTIONS_EXPANDED = [
  // ==================== SCIENCE (15 questions) ====================
  {
    id: 'sci_001',
    question: 'What is the largest planet in our solar system?',
    answer: 'Jupiter',
    category: 'Space',
    difficulty: 'easy',
    hint: 'It starts with J and is named after a Roman god',
    funFact: 'Jupiter is so large that over 1,300 Earths could fit inside it! It also has a massive storm called the Great Red Spot that has been raging for over 350 years.',
    learnMore: 'https://spaceplace.nasa.gov/all-about-jupiter/en/',
    resources: {
      correct: 'https://spaceplace.nasa.gov/all-about-jupiter/en/',
      incorrect: 'https://spaceplace.nasa.gov/all-about-planets/en/'
    }
  },
  {
    id: 'sci_002',
    question: 'What gas do plants absorb from the air?',
    answer: 'Carbon dioxide',
    category: 'Science',
    difficulty: 'easy',
    hint: 'It starts with C and is what we breathe out',
    funFact: 'Plants convert carbon dioxide into oxygen through photosynthesis, which is why we call them the "lungs of the Earth." One large tree can produce enough oxygen for 2 people in a year!',
    learnMore: 'https://www.khanacademy.org/science/biology/photosynthesis-and-cellular-respiration/photosynthesis/a/intro-to-photosynthesis',
    resources: {
      correct: 'https://www.khanacademy.org/science/biology/photosynthesis-and-cellular-respiration/photosynthesis/a/intro-to-photosynthesis',
      incorrect: 'https://www.bozeman science.com/blogs/photosynthesis-video'
    }
  },
  {
    id: 'sci_003',
    question: 'What is the hardest natural substance on Earth?',
    answer: 'Diamond',
    category: 'Science',
    difficulty: 'medium',
    hint: 'It\'s a precious gem used in rings and it sparkles',
    funFact: 'Diamonds are made of carbon atoms arranged in a special crystal structure. They form deep underground under extreme heat and pressure, then erupt to the surface during volcanic eruptions.',
    learnMore: 'https://www.usgs.gov/faqs/what-diamond',
    resources: {
      correct: 'https://www.usgs.gov/faqs/what-diamond',
      incorrect: 'https://geology.com/diamonds/'
    }
  },
  {
    id: 'sci_004',
    question: 'How many bones does an adult human have?',
    answer: '206',
    category: 'Science',
    difficulty: 'hard',
    hint: 'It\'s between 200 and 210',
    funFact: 'Babies are born with about 270 bones, but many of them are made of cartilage. As they grow, some bones fuse together, resulting in fewer but stronger bones by adulthood.',
    learnMore: 'https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/skeletal-system/a/skeleton-anatomy-and-physiology',
    resources: {
      correct: 'https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/skeletal-system/a/skeleton-anatomy-and-physiology',
      incorrect: 'https://www.britannica.com/science/human-skeleton'
    }
  },
  {
    id: 'sci_005',
    question: 'What is the smallest unit of life?',
    answer: 'Cell',
    category: 'Science',
    difficulty: 'easy',
    hint: 'All living things are made of these tiny structures',
    funFact: 'Your body is made of about 37.2 trillion cells! Some cells in your body are bacteria-sized, while others (like egg cells) are visible to the naked eye.',
    learnMore: 'https://www.khanacademy.org/science/biology/cell-biology/intro-to-cells/a/what-is-a-cell',
    resources: {
      correct: 'https://www.khanacademy.org/science/biology/cell-biology/intro-to-cells/a/what-is-a-cell',
      incorrect: 'https://www.bozeman science.com/blogs/cell-structure-and-function'
    }
  },
  {
    id: 'sci_006',
    question: 'What is the process by which water changes from liquid to gas?',
    answer: 'Evaporation',
    category: 'Science',
    difficulty: 'medium',
    hint: 'It\'s when wet clothes dry in the sun',
    funFact: 'Evaporation is key to the water cycle! The sun\'s heat causes water from oceans, lakes, and rivers to evaporate, forming clouds that eventually bring rain.',
    learnMore: 'https://www.usgs.gov/faqs/what-water-cycle',
    resources: {
      correct: 'https://www.usgs.gov/faqs/what-water-cycle',
      incorrect: 'https://www.khanacademy.org/science/earth-science/weather-and-climate/weather/v/water-cycle'
    }
  },
  {
    id: 'sci_007',
    question: 'What do bees do that helps flowers?',
    answer: 'Pollinate',
    category: 'Nature',
    difficulty: 'medium',
    hint: 'They carry pollen from flower to flower',
    funFact: 'Bees are essential to our food supply! About 1 out of every 3 food items we eat depends on pollination by bees. A bee colony can pollinate 300 million flowers in a single day!',
    learnMore: 'https://www.britannica.com/animal/bee/Pollination',
    resources: {
      correct: 'https://www.britannica.com/animal/bee/Pollination',
      incorrect: 'https://www.khanacademy.org/science/biology/ecology/pollination/a/pollination-and-seed-dispersal'
    }
  },
  {
    id: 'sci_008',
    question: 'What is the second most abundant element in Earth\'s atmosphere?',
    answer: 'Oxygen',
    category: 'Science',
    difficulty: 'easy',
    hint: 'It\'s what we breathe to survive',
    funFact: 'Oxygen makes up about 21% of Earth\'s atmosphere. Nitrogen is the most abundant at 78%. Without oxygen, most life as we know it couldn\'t exist!',
    learnMore: 'https://www.britannica.com/science/atmosphere-of-earth',
    resources: {
      correct: 'https://www.britannica.com/science/atmosphere-of-earth',
      incorrect: 'https://www.usgs.gov/faqs/what-composition-earths-atmosphere'
    }
  },
  {
    id: 'sci_009',
    question: 'What force pulls objects toward the center of Earth?',
    answer: 'Gravity',
    category: 'Science',
    difficulty: 'easy',
    hint: 'It\'s why things fall down, not up',
    funFact: 'Gravity isn\'t just on Earth! The Moon\'s gravity is what causes ocean tides. If the Moon disappeared, we\'d lose our tides!',
    learnMore: 'https://www.khanacademy.org/science/physics/forces-newtons-laws/newtons-law-universal-gravitation/a/gravitational-force',
    resources: {
      correct: 'https://www.khanacademy.org/science/physics/forces-newtons-laws/newtons-law-universal-gravitation/a/gravitational-force',
      incorrect: 'https://www.britannica.com/science/gravity'
    }
  },
  {
    id: 'sci_010',
    question: 'What is the study of rocks and minerals called?',
    answer: 'Geology',
    category: 'Science',
    difficulty: 'hard',
    hint: 'It contains the word "geo" which means Earth',
    funFact: 'Geologists use techniques like radiometric dating to determine the age of rocks. The oldest rocks on Earth are about 4 billion years old!',
    learnMore: 'https://www.britannica.com/science/geology',
    resources: {
      correct: 'https://www.britannica.com/science/geology',
      incorrect: 'https://www.usgs.gov/products/publications/geology'
    }
  },
  {
    id: 'sci_011',
    question: 'What gas do animals produce that plants need?',
    answer: 'Carbon dioxide',
    category: 'Science',
    difficulty: 'easy',
    hint: 'It\'s what we breathe out',
    funFact: 'There\'s a beautiful cycle: Animals breathe out CO2, plants absorb it and make oxygen, animals breathe in oxygen. This has been happening for millions of years!',
    learnMore: 'https://www.khanacademy.org/science/biology/ecology/energy-flow-through-ecosystems/a/the-carbon-cycle',
    resources: {
      correct: 'https://www.khanacademy.org/science/biology/ecology/energy-flow-through-ecosystems/a/the-carbon-cycle',
      incorrect: 'https://www.bozeman science.com/blogs/carbon-cycle'
    }
  },
  {
    id: 'sci_012',
    question: 'What is the process of breaking down food for energy called?',
    answer: 'Digestion',
    category: 'Science',
    difficulty: 'medium',
    hint: 'It happens in your stomach and intestines',
    funFact: 'Your digestive system is about 30 feet long! It takes about 24-72 hours for food to travel through your entire digestive system.',
    learnMore: 'https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/digestive-system/a/digestive-system-introduction',
    resources: {
      correct: 'https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/digestive-system/a/digestive-system-introduction',
      incorrect: 'https://www.bozeman science.com/blogs/digestion-and-nutrition'
    }
  },
  {
    id: 'sci_013',
    question: 'How many chambers does a human heart have?',
    answer: '4',
    category: 'Science',
    difficulty: 'medium',
    hint: 'It\'s between 2 and 6',
    funFact: 'Your heart beats about 100,000 times per day, pumping blood through 60,000 miles of blood vessels. That\'s enough to wrap around Earth 2.5 times!',
    learnMore: 'https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/circulatory-system/a/heart-anatomy-and-function',
    resources: {
      correct: 'https://www.khanacademy.org/science/health-and-medicine/human-anatomy-and-physiology/circulatory-system/a/heart-anatomy-and-function',
      incorrect: 'https://www.bozeman science.com/blogs/human-heart'
    }
  },
  {
    id: 'sci_014',
    question: 'What do we call the movement of continents over time?',
    answer: 'Continental drift',
    category: 'Geography',
    difficulty: 'hard',
    hint: 'The continents are slowly moving',
    funFact: 'Continents move at about the same speed your fingernails grow! Africa is moving away from Europe at about 2 centimeters per year.',
    learnMore: 'https://www.britannica.com/science/continental-drift',
    resources: {
      correct: 'https://www.britannica.com/science/continental-drift',
      incorrect: 'https://www.usgs.gov/faqs/what-plate-tectonics'
    }
  },
  {
    id: 'sci_015',
    question: 'What is the process of plants making food from sunlight called?',
    answer: 'Photosynthesis',
    category: 'Science',
    difficulty: 'medium',
    hint: 'It comes from "photo" (light) and "synthesis" (making)',
    funFact: 'Photosynthesis is one of the most important processes on Earth. Without it, most life forms would not exist because they depend on the oxygen and food it produces.',
    learnMore: 'https://www.khanacademy.org/science/biology/photosynthesis-and-cellular-respiration/photosynthesis/a/intro-to-photosynthesis',
    resources: {
      correct: 'https://www.khanacademy.org/science/biology/photosynthesis-and-cellular-respiration/photosynthesis/a/intro-to-photosynthesis',
      incorrect: 'https://www.bozeman science.com/blogs/photosynthesis-video'
    }
  },

  // ==================== HISTORY (15 questions) ====================
  {
    id: 'hist_001',
    question: 'In what year did Christopher Columbus sail to America?',
    answer: '1492',
    category: 'History',
    difficulty: 'easy',
    hint: 'It\'s the number that rhymes with "fourteen ninety-two"',
    funFact: 'Columbus wasn\'t the first European to reach America - Vikings had arrived about 500 years earlier! But his voyage led to lasting European settlement.',
    learnMore: 'https://www.britannica.com/biography/Christopher-Columbus',
    resources: {
      correct: 'https://www.britannica.com/biography/Christopher-Columbus',
      incorrect: 'https://www.history.com/topics/exploration/christopher-columbus'
    }
  },
  {
    id: 'hist_002',
    question: 'Who was the first President of the United States?',
    answer: 'George Washington',
    category: 'History',
    difficulty: 'easy',
    hint: 'His face is on the dollar bill',
    funFact: 'George Washington had false teeth made from hippopotamus ivory, gold, and human teeth! He was also an accomplished horseback rider and loved ice cream.',
    learnMore: 'https://www.whitehouse.gov/about-the-white-house/presidents/george-washington/',
    resources: {
      correct: 'https://www.whitehouse.gov/about-the-white-house/presidents/george-washington/',
      incorrect: 'https://www.britannica.com/biography/George-Washington'
    }
  },
  {
    id: 'hist_003',
    question: 'What year did the Titanic sink?',
    answer: '1912',
    category: 'History',
    difficulty: 'medium',
    hint: 'It\'s in the early 1900s',
    funFact: 'The Titanic was considered "unsinkable" because of its advanced safety features. It sank after hitting an iceberg in the Atlantic Ocean, resulting in over 1,500 deaths.',
    learnMore: 'https://www.britannica.com/event/Sinking-of-the-Titanic',
    resources: {
      correct: 'https://www.britannica.com/event/Sinking-of-the-Titanic',
      incorrect: 'https://www.history.com/topics/early-20th-century-us/titanic'
    }
  },
  {
    id: 'hist_004',
    question: 'Which ancient wonder of the world still stands today?',
    answer: 'Great Pyramid of Giza',
    category: 'History',
    difficulty: 'hard',
    hint: 'It\'s in Egypt and was built as a tomb',
    funFact: 'The Great Pyramid was the tallest man-made structure for 3,800 years! It contains about 2.3 million stone blocks, each weighing an average of 2.5 tons.',
    learnMore: 'https://www.britannica.com/technology/Seven-Wonders-of-the-Ancient-World',
    resources: {
      correct: 'https://www.britannica.com/technology/Seven-Wonders-of-the-Ancient-World',
      incorrect: 'https://www.history.com/topics/ancient-rome/seven-wonders-of-the-ancient-world'
    }
  },
  {
    id: 'hist_005',
    question: 'Who wrote the Declaration of Independence?',
    answer: 'Thomas Jefferson',
    category: 'History',
    difficulty: 'medium',
    hint: 'He\'s also on the nickel',
    funFact: 'Thomas Jefferson wrote the Declaration at age 33. He also designed his own home, Monticello, which is now a UNESCO World Heritage site.',
    learnMore: 'https://www.britannica.com/biography/Thomas-Jefferson',
    resources: {
      correct: 'https://www.britannica.com/biography/Thomas-Jefferson',
      incorrect: 'https://www.history.com/topics/early-us/thomas-jefferson'
    }
  },
  {
    id: 'hist_006',
    question: 'What war did the American colonies fight to gain independence?',
    answer: 'American Revolution',
    category: 'History',
    difficulty: 'easy',
    hint: 'It was against British rule',
    funFact: 'The American Revolution lasted 8 years (1775-1783) and helped inspire other independence movements around the world, including the French Revolution.',
    learnMore: 'https://www.britannica.com/event/American-Revolution',
    resources: {
      correct: 'https://www.britannica.com/event/American-Revolution',
      incorrect: 'https://www.history.com/topics/american-revolution/american-revolution-history'
    }
  },
  {
    id: 'hist_007',
    question: 'In what year did World War II end?',
    answer: '1945',
    category: 'History',
    difficulty: 'medium',
    hint: 'It\'s in the 1940s',
    funFact: 'World War II lasted 6 years and involved most of the world\'s nations. It was the deadliest conflict in human history.',
    learnMore: 'https://www.britannica.com/event/World-War-II',
    resources: {
      correct: 'https://www.britannica.com/event/World-War-II',
      incorrect: 'https://www.history.com/topics/world-war-ii'
    }
  },
  {
    id: 'hist_008',
    question: 'Who was the first person to walk on the Moon?',
    answer: 'Neil Armstrong',
    category: 'History',
    difficulty: 'easy',
    hint: 'His last name is a tool and a type of clothing',
    funFact: 'Neil Armstrong said "That\'s one small step for man, one giant leap for mankind" when he stepped onto the Moon on July 20, 1969.',
    learnMore: 'https://www.britannica.com/biography/Neil-Armstrong',
    resources: {
      correct: 'https://www.britannica.com/biography/Neil-Armstrong',
      incorrect: 'https://www.nasa.gov/about-nasa/astronauts/'
    }
  },
  {
    id: 'hist_009',
    question: 'Which empire built the Great Wall of China?',
    answer: 'Chinese Empire',
    category: 'History',
    difficulty: 'hard',
    hint: 'It\'s in Asia',
    funFact: 'The Great Wall of China is about 13,000 miles long! Construction took over 2,000 years and involved millions of workers.',
    learnMore: 'https://www.britannica.com/structure/Great-Wall-of-China',
    resources: {
      correct: 'https://www.britannica.com/structure/Great-Wall-of-China',
      incorrect: 'https://www.history.com/topics/ancient-asia/great-wall-of-china'
    }
  },
  {
    id: 'hist_010',
    question: 'What year did the Roman Empire fall?',
    answer: '476',
    category: 'History',
    difficulty: 'hard',
    hint: 'It\'s in the 400s',
    funFact: 'The fall of the Roman Empire marked the end of the ancient world and the beginning of the Middle Ages in Europe.',
    learnMore: 'https://www.britannica.com/event/fall-of-Rome',
    resources: {
      correct: 'https://www.britannica.com/event/fall-of-Rome',
      incorrect: 'https://www.history.com/topics/ancient-rome/roman-empire'
    }
  },
  {
    id: 'hist_011',
    question: 'Who invented the printing press?',
    answer: 'Johannes Gutenberg',
    category: 'History',
    difficulty: 'hard',
    hint: 'His first name is Johannes',
    funFact: 'The printing press revolutionized the world by making books affordable and available to common people. It\'s considered one of the most important inventions in history.',
    learnMore: 'https://www.britannica.com/biography/Johannes-Gutenberg',
    resources: {
      correct: 'https://www.britannica.com/biography/Johannes-Gutenberg',
      incorrect: 'https://www.history.com/topics/inventions/printing-press'
    }
  },
  {
    id: 'hist_012',
    question: 'Which president ended slavery in the United States?',
    answer: 'Abraham Lincoln',
    category: 'History',
    difficulty: 'medium',
    hint: 'His face is on the penny',
    funFact: 'Abraham Lincoln issued the Emancipation Proclamation in 1863, which declared slaves in rebel states to be free. He\'s one of the most respected presidents in American history.',
    learnMore: 'https://www.britannica.com/biography/Abraham-Lincoln',
    resources: {
      correct: 'https://www.britannica.com/biography/Abraham-Lincoln',
      incorrect: 'https://www.history.com/topics/american-civil-war/abraham-lincoln'
    }
  },
  {
    id: 'hist_013',
    question: 'What year did the American Civil War begin?',
    answer: '1861',
    category: 'History',
    difficulty: 'medium',
    hint: 'It\'s in the 1800s',
    funFact: 'The Civil War lasted 4 years and resulted in over 600,000 deaths. It was fought between the Union (North) and the Confederacy (South).',
    learnMore: 'https://www.britannica.com/event/American-Civil-War',
    resources: {
      correct: 'https://www.britannica.com/event/American-Civil-War',
      incorrect: 'https://www.history.com/topics/american-civil-war'
    }
  },
  {
    id: 'hist_014',
    question: 'Which ancient Greek philosopher taught Aristotle?',
    answer: 'Plato',
    category: 'History',
    difficulty: 'hard',
    hint: 'His name sounds like "play-toe"',
    funFact: 'Plato founded the Academy in Athens, one of the first institutions of higher learning. He taught that true knowledge comes through reasoning, not just sensory experience.',
    learnMore: 'https://www.britannica.com/biography/Plato',
    resources: {
      correct: 'https://www.britannica.com/biography/Plato',
      incorrect: 'https://www.history.com/topics/ancient-greece/plato'
    }
  },
  {
    id: 'hist_015',
    question: 'In what year did the Berlin Wall fall?',
    answer: '1989',
    category: 'History',
    difficulty: 'medium',
    hint: 'It\'s in the 1980s',
    funFact: 'The fall of the Berlin Wall symbolized the end of the Cold War. It had divided East and West Berlin for 28 years!',
    learnMore: 'https://www.britannica.com/event/Berlin-Wall',
    resources: {
      correct: 'https://www.britannica.com/event/Berlin-Wall',
      incorrect: 'https://www.history.com/topics/cold-war/berlin-wall'
    }
  },

  // ==================== GEOGRAPHY (15 questions) ====================
  {
    id: 'geo_001',
    question: 'What is the capital of France?',
    answer: 'Paris',
    category: 'Geography',
    difficulty: 'easy',
    hint: 'It\'s known as the City of Light',
    funFact: 'Paris is built on the Seine River and is home to the Eiffel Tower, which was built in 1889 for the World Fair.',
    learnMore: 'https://www.britannica.com/place/Paris',
    resources: {
      correct: 'https://www.britannica.com/place/Paris',
      incorrect: 'https://www.britannica.com/place/France'
    }
  },
  {
    id: 'geo_002',
    question: 'Which is the largest country in the world by area?',
    answer: 'Russia',
    category: 'Geography',
    difficulty: 'medium',
    hint: 'It\'s the world\'s largest country',
    funFact: 'Russia covers an area of about 17.1 million square kilometers and stretches across 11 time zones! It spans from Europe to the Pacific Ocean.',
    learnMore: 'https://www.britannica.com/place/Russia',
    resources: {
      correct: 'https://www.britannica.com/place/Russia',
      incorrect: 'https://www.britannica.com/place/Canada'
    }
  },
  {
    id: 'geo_003',
    question: 'What is the capital of Japan?',
    answer: 'Tokyo',
    category: 'Geography',
    difficulty: 'easy',
    hint: 'It\'s the largest city in the world by population',
    funFact: 'Tokyo is one of the most densely populated cities in the world with over 37 million people in the metropolitan area. It\'s known for its advanced technology and culture.',
    learnMore: 'https://www.britannica.com/place/Tokyo',
    resources: {
      correct: 'https://www.britannica.com/place/Tokyo',
      incorrect: 'https://www.britannica.com/place/Japan'
    }
  },
  {
    id: 'geo_004',
    question: 'Which is the smallest continent by area?',
    answer: 'Australia',
    category: 'Geography',
    difficulty: 'medium',
    hint: 'It\'s also a country',
    funFact: 'Australia is the only place where you can find kangaroos, koalas, and platypuses in the wild. It\'s often called "the land down under."',
    learnMore: 'https://www.britannica.com/place/Australia',
    resources: {
      correct: 'https://www.britannica.com/place/Australia',
      incorrect: 'https://www.britannica.com/place/Antarctica'
    }
  },
  {
    id: 'geo_005',
    question: 'What is the longest river in the world?',
    answer: 'Nile River',
    category: 'Geography',
    difficulty: 'medium',
    hint: 'It flows through Egypt',
    funFact: 'The Nile River is about 4,135 miles long and flows through 11 countries. Ancient Egypt was built along this river, which provided water and fertile land.',
    learnMore: 'https://www.britannica.com/place/Nile-River',
    resources: {
      correct: 'https://www.britannica.com/place/Nile-River',
      incorrect: 'https://www.britannica.com/place/Amazon-River'
    }
  },
  {
    id: 'geo_006',
    question: 'Which ocean is the largest?',
    answer: 'Pacific Ocean',
    category: 'Geography',
    difficulty: 'easy',
    hint: 'It\'s the one between Asia and America',
    funFact: 'The Pacific Ocean is so large that all of Earth\'s land area could fit inside it! It covers about 46% of the world\'s ocean surface.',
    learnMore: 'https://www.britannica.com/place/Pacific-Ocean',
    resources: {
      correct: 'https://www.britannica.com/place/Pacific-Ocean',
      incorrect: 'https://www.britannica.com/place/Atlantic-Ocean'
    }
  },
  {
    id: 'geo_007',
    question: 'What is the capital of India?',
    answer: 'New Delhi',
    category: 'Geography',
    difficulty: 'medium',
    hint: 'It\'s in the northern part of India',
    funFact: 'New Delhi was built in the early 1900s as the capital of India. It\'s home to over 25 million people in its metropolitan area.',
    learnMore: 'https://www.britannica.com/place/New-Delhi',
    resources: {
      correct: 'https://www.britannica.com/place/New-Delhi',
      incorrect: 'https://www.britannica.com/place/India'
    }
  },
  {
    id: 'geo_008',
    question: 'Which mountain is the highest in the world?',
    answer: 'Mount Everest',
    category: 'Geography',
    difficulty: 'easy',
    hint: 'It\'s in the Himalayas',
    funFact: 'Mount Everest is about 29,032 feet tall! Climbing it is one of the most challenging adventures, with climbers facing extreme cold and lack of oxygen.',
    learnMore: 'https://www.britannica.com/place/Mount-Everest',
    resources: {
      correct: 'https://www.britannica.com/place/Mount-Everest',
      incorrect: 'https://www.britannica.com/place/K2'
    }
  },
  {
    id: 'geo_009',
    question: 'What is the capital of Brazil?',
    answer: 'Brasília',
    category: 'Geography',
    difficulty: 'hard',
    hint: 'It\'s a planned city built in the 1960s',
    funFact: 'Brasília is a UNESCO World Heritage site and was purpose-built as a new capital. It\'s known for its unique modernist architecture.',
    learnMore: 'https://www.britannica.com/place/Brasilia',
    resources: {
      correct: 'https://www.britannica.com/place/Brasilia',
      incorrect: 'https://www.britannica.com/place/Rio-de-Janeiro'
    }
  },
  {
    id: 'geo_010',
    question: 'Which desert is the largest in the world?',
    answer: 'Antarctica',
    category: 'Geography',
    difficulty: 'hard',
    hint: 'It\'s at the South Pole',
    funFact: 'Antarctica is officially classified as a desert because it receives very little precipitation! It\'s also the coldest place on Earth.',
    learnMore: 'https://www.britannica.com/place/Antarctica',
    resources: {
      correct: 'https://www.britannica.com/place/Antarctica',
      incorrect: 'https://www.britannica.com/place/Sahara'
    }
  },
  {
    id: 'geo_011',
    question: 'How many continents are there?',
    answer: '7',
    category: 'Geography',
    difficulty: 'easy',
    hint: 'It\'s between 5 and 9',
    funFact: 'The 7 continents are: North America, South America, Europe, Africa, Asia, Australia, and Antarctica. Some people count them differently!',
    learnMore: 'https://www.britannica.com/topic/continent',
    resources: {
      correct: 'https://www.britannica.com/topic/continent',
      incorrect: 'https://www.britannica.com/place/Earth'
    }
  },
  {
    id: 'geo_012',
    question: 'What is the capital of Egypt?',
    answer: 'Cairo',
    category: 'Geography',
    difficulty: 'easy',
    hint: 'It\'s the largest city in Africa',
    funFact: 'Cairo is home to over 20 million people! It\'s located on the Nile River and is close to the Great Pyramids of Giza.',
    learnMore: 'https://www.britannica.com/place/Cairo',
    resources: {
      correct: 'https://www.britannica.com/place/Cairo',
      incorrect: 'https://www.britannica.com/place/Egypt'
    }
  },
  {
    id: 'geo_013',
    question: 'Which country is the most populous in the world?',
    answer: 'India',
    category: 'Geography',
    difficulty: 'medium',
    hint: 'It\'s in South Asia',
    funFact: 'India has a population of over 1.4 billion people and recently became the most populous country, surpassing China!',
    learnMore: 'https://www.britannica.com/place/India',
    resources: {
      correct: 'https://www.britannica.com/place/India',
      incorrect: 'https://www.britannica.com/place/China'
    }
  },
  {
    id: 'geo_014',
    question: 'What is the capital of Australia?',
    answer: 'Canberra',
    category: 'Geography',
    difficulty: 'hard',
    hint: 'It\'s not Sydney or Melbourne',
    funFact: 'Canberra was chosen as a compromise between the cities of Sydney and Melbourne, which couldn\'t agree on which should be the capital.',
    learnMore: 'https://www.britannica.com/place/Canberra',
    resources: {
      correct: 'https://www.britannica.com/place/Canberra',
      incorrect: 'https://www.britannica.com/place/Sydney'
    }
  },
  {
    id: 'geo_015',
    question: 'Which country is home to the Amazon Rainforest?',
    answer: 'Brazil',
    category: 'Geography',
    difficulty: 'medium',
    hint: 'It\'s in South America',
    funFact: 'The Amazon Rainforest covers about 5.5 million square kilometers and is home to 10% of all species on Earth! It produces about 20% of the world\'s oxygen.',
    learnMore: 'https://www.britannica.com/place/Amazon-Rainforest',
    resources: {
      correct: 'https://www.britannica.com/place/Amazon-Rainforest',
      incorrect: 'https://www.britannica.com/place/Brazil'
    }
  },

  // ==================== MATHEMATICS (12 questions) ====================
  {
    id: 'math_001',
    question: 'What is 2 + 2?',
    answer: '4',
    category: 'Mathematics',
    difficulty: 'easy',
    hint: 'It\'s a small number',
    funFact: 'This simple equation is the foundation of arithmetic! Mathematics builds upon basic operations like addition to create complex formulas.',
    learnMore: 'https://www.khanacademy.org/math/arithmetic/add-subtract',
    resources: {
      correct: 'https://www.khanacademy.org/math/arithmetic/add-subtract',
      incorrect: 'https://www.khanacademy.org/math/arithmetic'
    }
  },
  {
    id: 'math_002',
    question: 'What is the square root of 16?',
    answer: '4',
    category: 'Mathematics',
    difficulty: 'medium',
    hint: 'It\'s a small number',
    funFact: 'Square roots are the opposite of squaring a number. If 4 × 4 = 16, then the square root of 16 is 4.',
    learnMore: 'https://www.khanacademy.org/math/pre-algebra/exponents-radicals',
    resources: {
      correct: 'https://www.khanacademy.org/math/pre-algebra/exponents-radicals',
      incorrect: 'https://www.khanacademy.org/math/pre-algebra'
    }
  },
  {
    id: 'math_003',
    question: 'How many degrees are in a circle?',
    answer: '360',
    category: 'Mathematics',
    difficulty: 'medium',
    hint: 'It\'s a large number',
    funFact: 'The choice of 360 degrees for a circle comes from ancient Babylonians, who used a 60-based number system. 360 is divisible by many numbers!',
    learnMore: 'https://www.khanacademy.org/math/geometry/gg-angles',
    resources: {
      correct: 'https://www.khanacademy.org/math/geometry/gg-angles',
      incorrect: 'https://www.khanacademy.org/math/geometry'
    }
  },
  {
    id: 'math_004',
    question: 'What is the value of Pi (π) rounded to 2 decimal places?',
    answer: '3.14',
    category: 'Mathematics',
    difficulty: 'medium',
    hint: 'It\'s used to calculate circumference',
    funFact: 'Pi is an irrational number, meaning it goes on forever without repeating! Mathematicians have calculated it to over 1 trillion decimal places.',
    learnMore: 'https://www.khanacademy.org/math/geometry/gg-circles',
    resources: {
      correct: 'https://www.khanacademy.org/math/geometry/gg-circles',
      incorrect: 'https://www.khanacademy.org/math/geometry'
    }
  },
  {
    id: 'math_005',
    question: 'What is 10% of 50?',
    answer: '5',
    category: 'Mathematics',
    difficulty: 'easy',
    hint: 'It\'s a small number',
    funFact: 'Percentages are used everywhere - from sales discounts to test scores! 10% means 10 out of 100 parts.',
    learnMore: 'https://www.khanacademy.org/math/pre-algebra/ratios-rates',
    resources: {
      correct: 'https://www.khanacademy.org/math/pre-algebra/ratios-rates',
      incorrect: 'https://www.khanacademy.org/math/pre-algebra'
    }
  },
  {
    id: 'math_006',
    question: 'What is 5 × 6?',
    answer: '30',
    category: 'Mathematics',
    difficulty: 'easy',
    hint: 'It\'s in the 20s or 30s',
    funFact: 'Multiplication is repeated addition. 5 × 6 means adding 5 six times: 5+5+5+5+5+5 = 30.',
    learnMore: 'https://www.khanacademy.org/math/arithmetic/multiply-divide',
    resources: {
      correct: 'https://www.khanacademy.org/math/arithmetic/multiply-divide',
      incorrect: 'https://www.khanacademy.org/math/arithmetic'
    }
  },
  {
    id: 'math_007',
    question: 'How many sides does a hexagon have?',
    answer: '6',
    category: 'Mathematics',
    difficulty: 'easy',
    hint: 'It starts with H',
    funFact: 'Hexagons are found in nature! Honeycomb cells are hexagons because it\'s the most efficient shape for storing maximum volume with minimum material.',
    learnMore: 'https://www.khanacademy.org/math/geometry/gg-polygons',
    resources: {
      correct: 'https://www.khanacademy.org/math/geometry/gg-polygons',
      incorrect: 'https://www.khanacademy.org/math/geometry'
    }
  },
  {
    id: 'math_008',
    question: 'What is the area of a square with sides of 4 cm?',
    answer: '16 square cm',
    category: 'Mathematics',
    difficulty: 'medium',
    hint: 'Area = side × side',
    funFact: 'Area tells you how much space is covered. A square with 4 cm sides covers 16 square centimeters!',
    learnMore: 'https://www.khanacademy.org/math/geometry/gg-area-perimeter',
    resources: {
      correct: 'https://www.khanacademy.org/math/geometry/gg-area-perimeter',
      incorrect: 'https://www.khanacademy.org/math/geometry'
    }
  },
  {
    id: 'math_009',
    question: 'What is 100 ÷ 5?',
    answer: '20',
    category: 'Mathematics',
    difficulty: 'easy',
    hint: 'It\'s in the 15-25 range',
    funFact: 'Division is splitting something into equal groups. 100 ÷ 5 means splitting 100 into 5 equal groups of 20.',
    learnMore: 'https://www.khanacademy.org/math/arithmetic/multiply-divide',
    resources: {
      correct: 'https://www.khanacademy.org/math/arithmetic/multiply-divide',
      incorrect: 'https://www.khanacademy.org/math/arithmetic'
    }
  },
  {
    id: 'math_010',
    question: 'What is 3²? (3 squared)',
    answer: '9',
    category: 'Mathematics',
    difficulty: 'medium',
    hint: 'It\'s 3 × 3',
    funFact: 'Squaring a number means multiplying it by itself. Powers are a shorthand way to show repeated multiplication!',
    learnMore: 'https://www.khanacademy.org/math/pre-algebra/exponents-radicals',
    resources: {
      correct: 'https://www.khanacademy.org/math/pre-algebra/exponents-radicals',
      incorrect: 'https://www.khanacademy.org/math/pre-algebra'
    }
  },
  {
    id: 'math_011',
    question: 'What is 50% of 200?',
    answer: '100',
    category: 'Mathematics',
    difficulty: 'easy',
    hint: 'It\'s half of 200',
    funFact: 'Percent means "per hundred." 50% literally means 50 out of 100, or half!',
    learnMore: 'https://www.khanacademy.org/math/pre-algebra/ratios-rates',
    resources: {
      correct: 'https://www.khanacademy.org/math/pre-algebra/ratios-rates',
      incorrect: 'https://www.khanacademy.org/math/pre-algebra'
    }
  },
  {
    id: 'math_012',
    question: 'How many millimeters are in 1 centimeter?',
    answer: '10',
    category: 'Mathematics',
    difficulty: 'easy',
    hint: 'It\'s a small number',
    funFact: 'The metric system makes conversions easy! Each unit is based on powers of 10, making math much simpler than older systems.',
    learnMore: 'https://www.khanacademy.org/math/pre-algebra/measurement',
    resources: {
      correct: 'https://www.khanacademy.org/math/pre-algebra/measurement',
      incorrect: 'https://www.khanacademy.org/math/pre-algebra'
    }
  },

  // ==================== LITERATURE (12 questions) ====================
  {
    id: 'lit_001',
    question: 'Who wrote "Romeo and Juliet"?',
    answer: 'William Shakespeare',
    category: 'Literature',
    difficulty: 'easy',
    hint: 'He\'s a famous English playwright',
    funFact: 'Shakespeare wrote 39 plays and 154 sonnets. His works are still performed more often than any other playwright\'s!',
    learnMore: 'https://www.britannica.com/biography/William-Shakespeare',
    resources: {
      correct: 'https://www.britannica.com/biography/William-Shakespeare',
      incorrect: 'https://www.britannica.com/topic/Romeo-and-Juliet'
    }
  },
  {
    id: 'lit_002',
    question: 'Who wrote "The Great Gatsby"?',
    answer: 'F. Scott Fitzgerald',
    category: 'Literature',
    difficulty: 'medium',
    hint: 'His initials are F.S.',
    funFact: '"The Great Gatsby" is considered one of the greatest American novels. It captures the excitement and excess of the 1920s.',
    learnMore: 'https://www.britannica.com/biography/F-Scott-Fitzgerald',
    resources: {
      correct: 'https://www.britannica.com/biography/F-Scott-Fitzgerald',
      incorrect: 'https://www.britannica.com/topic/The-Great-Gatsby'
    }
  },
  {
    id: 'lit_003',
    question: 'In "Harry Potter," what is the name of the spell that creates light?',
    answer: 'Lumos',
    category: 'Literature',
    difficulty: 'medium',
    hint: 'It sounds like "loom-us"',
    funFact: 'The Harry Potter series has sold over 500 million copies worldwide! It\'s one of the most successful book series ever written.',
    learnMore: 'https://www.britannica.com/topic/Harry-Potter',
    resources: {
      correct: 'https://www.britannica.com/topic/Harry-Potter',
      incorrect: 'https://www.britannica.com/biography/J-K-Rowling'
    }
  },
  {
    id: 'lit_004',
    question: 'Who wrote "To Kill a Mockingbird"?',
    answer: 'Harper Lee',
    category: 'Literature',
    difficulty: 'easy',
    hint: 'Her first name is Harper',
    funFact: '"To Kill a Mockingbird" won the Pulitzer Prize and is often taught in schools. It addresses important themes like racism and injustice.',
    learnMore: 'https://www.britannica.com/biography/Harper-Lee',
    resources: {
      correct: 'https://www.britannica.com/biography/Harper-Lee',
      incorrect: 'https://www.britannica.com/topic/To-Kill-a-Mockingbird'
    }
  },
  {
    id: 'lit_005',
    question: 'Who wrote "Jane Eyre"?',
    answer: 'Charlotte Brontë',
    category: 'Literature',
    difficulty: 'hard',
    hint: 'Her last name is Brontë',
    funFact: 'Charlotte Brontë wrote "Jane Eyre" under the pen name Currer Bell. Many female authors of that era used male pen names to be taken seriously.',
    learnMore: 'https://www.britannica.com/biography/Charlotte-Bronte',
    resources: {
      correct: 'https://www.britannica.com/biography/Charlotte-Bronte',
      incorrect: 'https://www.britannica.com/topic/Jane-Eyre'
    }
  },
  {
    id: 'lit_006',
    question: 'In "The Lord of the Rings," what is the name of the hobbit who must destroy the ring?',
    answer: 'Frodo Baggins',
    category: 'Literature',
    difficulty: 'medium',
    hint: 'His first name is Frodo',
    funFact: 'J.R.R. Tolkien spent over 10 years writing "The Lord of the Rings." The book was first published in three volumes between 1954-1955.',
    learnMore: 'https://www.britannica.com/topic/The-Lord-of-the-Rings',
    resources: {
      correct: 'https://www.britannica.com/topic/The-Lord-of-the-Rings',
      incorrect: 'https://www.britannica.com/biography/J-R-R-Tolkien'
    }
  },
  {
    id: 'lit_007',
    question: 'Who wrote "The Catcher in the Rye"?',
    answer: 'J.D. Salinger',
    category: 'Literature',
    difficulty: 'medium',
    hint: 'His initials are J.D.',
    funFact: '"The Catcher in the Rye" is narrated by a teenager named Holden Caulfield. The book captures teenage angst and alienation perfectly.',
    learnMore: 'https://www.britannica.com/biography/J-D-Salinger',
    resources: {
      correct: 'https://www.britannica.com/biography/J-D-Salinger',
      incorrect: 'https://www.britannica.com/topic/The-Catcher-in-the-Rye'
    }
  },
  {
    id: 'lit_008',
    question: 'Who wrote "1984"?',
    answer: 'George Orwell',
    category: 'Literature',
    difficulty: 'easy',
    hint: 'His pen name is George Orwell',
    funFact: '"1984" is a dystopian novel depicting a totalitarian society. Words from the book like "Big Brother" and "doublethink" are still used today.',
    learnMore: 'https://www.britannica.com/biography/George-Orwell',
    resources: {
      correct: 'https://www.britannica.com/biography/George-Orwell',
      incorrect: 'https://www.britannica.com/topic/1984'
    }
  },
  {
    id: 'lit_009',
    question: 'In "Alice\'s Adventures in Wonderland," what is the name of the rabbit Alice follows?',
    answer: 'White Rabbit',
    category: 'Literature',
    difficulty: 'medium',
    hint: 'His color is white',
    funFact: '"Alice\'s Adventures in Wonderland" was written by Lewis Carroll and published in 1865. It remains a classic of children\'s literature.',
    learnMore: 'https://www.britannica.com/topic/Alices-Adventures-in-Wonderland',
    resources: {
      correct: 'https://www.britannica.com/topic/Alices-Adventures-in-Wonderland',
      incorrect: 'https://www.britannica.com/biography/Lewis-Carroll'
    }
  },
  {
    id: 'lit_010',
    question: 'Who wrote "Pride and Prejudice"?',
    answer: 'Jane Austen',
    category: 'Literature',
    difficulty: 'easy',
    hint: 'Her first name is Jane',
    funFact: 'Jane Austen wrote six major novels, all of which are still widely read and adapted for film and television today.',
    learnMore: 'https://www.britannica.com/biography/Jane-Austen',
    resources: {
      correct: 'https://www.britannica.com/biography/Jane-Austen',
      incorrect: 'https://www.britannica.com/topic/Pride-and-Prejudice'
    }
  },
  {
    id: 'lit_011',
    question: 'What genre does "The Hobbit" belong to?',
    answer: 'Fantasy',
    category: 'Literature',
    difficulty: 'easy',
    hint: 'It contains magic and fictional worlds',
    funFact: '"The Hobbit" is considered one of the first modern fantasy novels. It inspired countless fantasy authors who came after.',
    learnMore: 'https://www.britannica.com/topic/The-Hobbit',
    resources: {
      correct: 'https://www.britannica.com/topic/The-Hobbit',
      incorrect: 'https://www.britannica.com/topic/fantasy-literature'
    }
  },
  {
    id: 'lit_012',
    question: 'Who wrote "Frankenstein"?',
    answer: 'Mary Shelley',
    category: 'Literature',
    difficulty: 'hard',
    hint: 'Her first name is Mary',
    funFact: 'Mary Shelley wrote "Frankenstein" when she was only 18 years old! It\'s considered the first science fiction novel.',
    learnMore: 'https://www.britannica.com/biography/Mary-Shelley',
    resources: {
      correct: 'https://www.britannica.com/biography/Mary-Shelley',
      incorrect: 'https://www.britannica.com/topic/Frankenstein'
    }
  },

  // ==================== TECHNOLOGY (12 questions) ====================
  {
    id: 'tech_001',
    question: 'What does "AI" stand for?',
    answer: 'Artificial Intelligence',
    category: 'Technology',
    difficulty: 'easy',
    hint: 'It starts with A and I',
    funFact: 'Artificial Intelligence is rapidly changing how we live and work. AI systems can now do things like write essays, create images, and play games better than humans!',
    learnMore: 'https://www.britannica.com/technology/artificial-intelligence',
    resources: {
      correct: 'https://www.britannica.com/technology/artificial-intelligence',
      incorrect: 'https://en.wikipedia.org/wiki/Artificial_intelligence'
    }
  },
  {
    id: 'tech_002',
    question: 'What does "HTML" stand for?',
    answer: 'HyperText Markup Language',
    category: 'Technology',
    difficulty: 'hard',
    hint: 'It\'s used to create web pages',
    funFact: 'HTML was created by Tim Berners-Lee in 1989. It\'s the foundation of all websites and is one of the most important technologies on the internet.',
    learnMore: 'https://www.britannica.com/technology/HTML',
    resources: {
      correct: 'https://www.w3schools.com/whatis/whatis_html.asp',
      incorrect: 'https://developer.mozilla.org/en-US/docs/Web/HTML'
    }
  },
  {
    id: 'tech_003',
    question: 'What does "CPU" stand for?',
    answer: 'Central Processing Unit',
    category: 'Technology',
    difficulty: 'medium',
    hint: 'It\'s the brain of a computer',
    funFact: 'The CPU executes instructions and performs calculations. Modern CPUs can perform billions of operations per second!',
    learnMore: 'https://www.britannica.com/technology/CPU',
    resources: {
      correct: 'https://www.britannica.com/technology/CPU',
      incorrect: 'https://en.wikipedia.org/wiki/Central_processing_unit'
    }
  },
  {
    id: 'tech_004',
    question: 'Who invented the World Wide Web?',
    answer: 'Tim Berners-Lee',
    category: 'Technology',
    difficulty: 'medium',
    hint: 'His last name is Berners-Lee',
    funFact: 'Tim Berners-Lee invented the World Wide Web at CERN in 1989. He made the web open to everyone for free, allowing it to grow into what it is today.',
    learnMore: 'https://www.britannica.com/biography/Tim-Berners-Lee',
    resources: {
      correct: 'https://www.britannica.com/biography/Tim-Berners-Lee',
      incorrect: 'https://en.wikipedia.org/wiki/Tim_Berners-Lee'
    }
  },
  {
    id: 'tech_005',
    question: 'What does "WiFi" stand for?',
    answer: 'Wireless Fidelity',
    category: 'Technology',
    difficulty: 'medium',
    hint: 'It\'s used for wireless internet',
    funFact: 'WiFi allows devices to connect to the internet without wires. It revolutionized how we access the internet at home and work!',
    learnMore: 'https://www.britannica.com/technology/Wi-Fi',
    resources: {
      correct: 'https://www.britannica.com/technology/Wi-Fi',
      incorrect: 'https://en.wikipedia.org/wiki/Wi-Fi'
    }
  },
  {
    id: 'tech_006',
    question: 'What does "USB" stand for?',
    answer: 'Universal Serial Bus',
    category: 'Technology',
    difficulty: 'hard',
    hint: 'It\'s used to connect devices',
    funFact: 'USB allows for the transfer of data and power between devices. The first USB standard was released in 1996 and has been improved many times since.',
    learnMore: 'https://www.britannica.com/technology/USB',
    resources: {
      correct: 'https://www.britannica.com/technology/USB',
      incorrect: 'https://en.wikipedia.org/wiki/USB'
    }
  },
  {
    id: 'tech_007',
    question: 'What does "RAM" stand for?',
    answer: 'Random Access Memory',
    category: 'Technology',
    difficulty: 'medium',
    hint: 'It\'s a type of computer memory',
    funFact: 'RAM is much faster than storage but loses all data when the computer is turned off. This is why we have both RAM and storage drives.',
    learnMore: 'https://www.britannica.com/technology/RAM',
    resources: {
      correct: 'https://www.britannica.com/technology/RAM',
      incorrect: 'https://en.wikipedia.org/wiki/Random-access_memory'
    }
  },
  {
    id: 'tech_008',
    question: 'Who is often called the father of computers?',
    answer: 'Charles Babbage',
    category: 'Technology',
    difficulty: 'hard',
    hint: 'His last name is Babbage',
    funFact: 'Charles Babbage designed the Analytical Engine in the 1800s, which is considered the first general-purpose computer. Ada Lovelace wrote the first computer algorithm for it!',
    learnMore: 'https://www.britannica.com/biography/Charles-Babbage',
    resources: {
      correct: 'https://www.britannica.com/biography/Charles-Babbage',
      incorrect: 'https://en.wikipedia.org/wiki/Charles_Babbage'
    }
  },
  {
    id: 'tech_009',
    question: 'What does "GPU" stand for?',
    answer: 'Graphics Processing Unit',
    category: 'Technology',
    difficulty: 'medium',
    hint: 'It\'s specialized for processing graphics',
    funFact: 'GPUs are now used not just for graphics but also for AI, cryptocurrency mining, and scientific simulations. They excel at parallel processing!',
    learnMore: 'https://www.britannica.com/technology/GPU',
    resources: {
      correct: 'https://www.britannica.com/technology/GPU',
      incorrect: 'https://en.wikipedia.org/wiki/Graphics_processing_unit'
    }
  },
  {
    id: 'tech_010',
    question: 'What does "SSD" stand for?',
    answer: 'Solid State Drive',
    category: 'Technology',
    difficulty: 'medium',
    hint: 'It\'s a type of storage device',
    funFact: 'SSDs have no moving parts, making them faster and more durable than hard disk drives (HDDs). They\'re becoming the standard storage device in modern computers.',
    learnMore: 'https://www.britannica.com/technology/SSD',
    resources: {
      correct: 'https://www.britannica.com/technology/SSD',
      incorrect: 'https://en.wikipedia.org/wiki/Solid-state_drive'
    }
  },
  {
    id: 'tech_011',
    question: 'What year was the first iPhone released?',
    answer: '2007',
    category: 'Technology',
    difficulty: 'easy',
    hint: 'It\'s in the 2000s',
    funFact: 'Steve Jobs introduced the iPhone on January 9, 2007. It revolutionized mobile technology and changed how we use phones forever!',
    learnMore: 'https://www.britannica.com/technology/iPhone',
    resources: {
      correct: 'https://www.britannica.com/technology/iPhone',
      incorrect: 'https://en.wikipedia.org/wiki/IPhone'
    }
  },
  {
    id: 'tech_012',
    question: 'Who founded Microsoft?',
    answer: 'Bill Gates',
    category: 'Technology',
    difficulty: 'easy',
    hint: 'His first name is Bill',
    funFact: 'Bill Gates founded Microsoft in 1975 and became the world\'s richest person. He now focuses on philanthropy through the Bill & Melinda Gates Foundation.',
    learnMore: 'https://www.britannica.com/biography/Bill-Gates',
    resources: {
      correct: 'https://www.britannica.com/biography/Bill-Gates',
      incorrect: 'https://en.wikipedia.org/wiki/Bill_Gates'
    }
  },

  // ==================== ANIMALS (12 questions) ====================
  {
    id: 'animal_001',
    question: 'What is the fastest land animal?',
    answer: 'Cheetah',
    category: 'Animals',
    difficulty: 'easy',
    hint: 'It\'s a big cat',
    funFact: 'Cheetahs can run up to 70 mph (112 km/h)! They have special claws that don\'t retract, like cleats on running shoes.',
    learnMore: 'https://www.britannica.com/animal/cheetah',
    resources: {
      correct: 'https://www.britannica.com/animal/cheetah',
      incorrect: 'https://www.britannica.com/animal/Lion'
    }
  },
  {
    id: 'animal_002',
    question: 'How many legs does an octopus have?',
    answer: '8',
    category: 'Animals',
    difficulty: 'easy',
    hint: 'The name says it',
    funFact: 'Each tentacle has 200-300 suckers! Octopuses can taste with their suckers and are highly intelligent creatures.',
    learnMore: 'https://www.britannica.com/animal/octopus',
    resources: {
      correct: 'https://www.britannica.com/animal/octopus',
      incorrect: 'https://www.britannica.com/animal/squid'
    }
  },
  {
    id: 'animal_003',
    question: 'What is the largest animal in the world?',
    answer: 'Blue Whale',
    category: 'Animals',
    difficulty: 'easy',
    hint: 'It\'s a whale',
    funFact: 'Blue whales can weigh up to 200 tons and are the largest animals ever known to exist! Even larger than the biggest dinosaurs.',
    learnMore: 'https://www.britannica.com/animal/blue-whale',
    resources: {
      correct: 'https://www.britannica.com/animal/blue-whale',
      incorrect: 'https://www.britannica.com/animal/African-elephant'
    }
  },
  {
    id: 'animal_004',
    question: 'How many chambers does a cow\'s stomach have?',
    answer: '4',
    category: 'Animals',
    difficulty: 'medium',
    hint: 'It\'s more than 2',
    funFact: 'Cows are ruminants with a special 4-chambered stomach that allows them to digest tough plant material. They regurgitate food and chew it again!',
    learnMore: 'https://www.britannica.com/animal/cow',
    resources: {
      correct: 'https://www.britannica.com/animal/cow',
      incorrect: 'https://www.britannica.com/animal/sheep'
    }
  },
  {
    id: 'animal_005',
    question: 'What bird can fly backwards?',
    answer: 'Hummingbird',
    category: 'Animals',
    difficulty: 'easy',
    hint: 'It drinks nectar from flowers',
    funFact: 'Hummingbirds are the only birds that can fly backwards! Their wings beat 50-80 times per second.',
    learnMore: 'https://www.britannica.com/animal/hummingbird',
    resources: {
      correct: 'https://www.britannica.com/animal/hummingbird',
      incorrect: 'https://www.britannica.com/animal/dove'
    }
  },
  {
    id: 'animal_006',
    question: 'How long can a polar bear swim without stopping?',
    answer: '6 days',
    category: 'Animals',
    difficulty: 'hard',
    hint: 'It\'s measured in days',
    funFact: 'Polar bears are incredible swimmers and can travel hundreds of miles across open ocean looking for ice floes to rest on.',
    learnMore: 'https://www.britannica.com/animal/polar-bear',
    resources: {
      correct: 'https://www.britannica.com/animal/polar-bear',
      incorrect: 'https://www.britannica.com/animal/walrus'
    }
  },
  {
    id: 'animal_007',
    question: 'What is the slowest mammal in the world?',
    answer: 'Sloth',
    category: 'Animals',
    difficulty: 'medium',
    hint: 'It lives in rainforests',
    funFact: 'Sloths move so slowly that algae grows on their fur! They only come down from trees about once a week.',
    learnMore: 'https://www.britannica.com/animal/sloth',
    resources: {
      correct: 'https://www.britannica.com/animal/sloth',
      incorrect: 'https://www.britannica.com/animal/tortoise'
    }
  },
  {
    id: 'animal_008',
    question: 'How many eyes does a spider have?',
    answer: '8',
    category: 'Animals',
    difficulty: 'medium',
    hint: 'It\'s more than most animals',
    funFact: 'Most spiders have 8 eyes, but they see the world very differently from humans. Some spiders are nearly blind while others have excellent vision!',
    learnMore: 'https://www.britannica.com/animal/spider',
    resources: {
      correct: 'https://www.britannica.com/animal/spider',
      incorrect: 'https://www.britannica.com/animal/insect'
    }
  },
  {
    id: 'animal_009',
    question: 'What animal can change color to match its surroundings?',
    answer: 'Chameleon',
    category: 'Animals',
    difficulty: 'easy',
    hint: 'It\'s a reptile',
    funFact: 'Chameleons change color not just for camouflage but also to communicate emotions and regulate temperature!',
    learnMore: 'https://www.britannica.com/animal/chameleon',
    resources: {
      correct: 'https://www.britannica.com/animal/chameleon',
      incorrect: 'https://www.britannica.com/animal/gecko'
    }
  },
  {
    id: 'animal_010',
    question: 'How long can a bear sleep in hibernation?',
    answer: '7 months',
    category: 'Animals',
    difficulty: 'medium',
    hint: 'It\'s measured in months',
    funFact: 'Bears don\'t eat, drink, or go to the bathroom during hibernation! They survive on stored body fat accumulated during summer and fall.',
    learnMore: 'https://www.britannica.com/animal/bear',
    resources: {
      correct: 'https://www.britannica.com/animal/bear',
      incorrect: 'https://www.britannica.com/animal/squirrel'
    }
  },
  {
    id: 'animal_011',
    question: 'What is the only mammal that lays eggs?',
    answer: 'Platypus',
    category: 'Animals',
    difficulty: 'hard',
    hint: 'It\'s from Australia',
    funFact: 'The platypus is one of nature\'s most unusual animals! It\'s venomous, lays eggs, has a duck-like bill, and produces milk without nipples.',
    learnMore: 'https://www.britannica.com/animal/platypus',
    resources: {
      correct: 'https://www.britannica.com/animal/platypus',
      incorrect: 'https://www.britannica.com/animal/echidna'
    }
  },
  {
    id: 'animal_012',
    question: 'How many bones does a snake have?',
    answer: '300',
    category: 'Animals',
    difficulty: 'hard',
    hint: 'It\'s more than 200',
    funFact: 'Snakes have incredible flexibility because of their many vertebrae and ribs! Their skeleton is perfectly adapted for slithering.',
    learnMore: 'https://www.britannica.com/animal/snake',
    resources: {
      correct: 'https://www.britannica.com/animal/snake',
      incorrect: 'https://www.britannica.com/animal/lizard'
    }
  },

  // ==================== SPORTS (10 questions) ====================
  {
    id: 'sport_001',
    question: 'In basketball, how many points is a three-pointer worth?',
    answer: '3',
    category: 'Sports',
    difficulty: 'easy',
    hint: 'It\'s in the name',
    funFact: 'Three-pointers have become increasingly important in basketball. Some teams take as many three-pointers as two-pointers!',
    learnMore: 'https://www.britannica.com/sports/basketball',
    resources: {
      correct: 'https://www.britannica.com/sports/basketball',
      incorrect: 'https://www.britannica.com/sports/American-football'
    }
  },
  {
    id: 'sport_002',
    question: 'How many players are on a soccer team on the field?',
    answer: '11',
    category: 'Sports',
    difficulty: 'easy',
    hint: 'It\'s more than 10',
    funFact: 'Soccer (football) is the most popular sport in the world! Over 4 billion people watch it worldwide.',
    learnMore: 'https://www.britannica.com/sports/soccer',
    resources: {
      correct: 'https://www.britannica.com/sports/soccer',
      incorrect: 'https://www.britannica.com/sports/American-football'
    }
  },
  {
    id: 'sport_003',
    question: 'What sport takes place in a boxing ring?',
    answer: 'Boxing',
    category: 'Sports',
    difficulty: 'easy',
    hint: 'It\'s a combat sport',
    funFact: 'Boxing has been around for thousands of years! The earliest evidence of boxing comes from a Sumerian relief dating to 3000 BC.',
    learnMore: 'https://www.britannica.com/sports/boxing',
    resources: {
      correct: 'https://www.britannica.com/sports/boxing',
      incorrect: 'https://www.britannica.com/sports/wrestling'
    }
  },
  {
    id: 'sport_004',
    question: 'In American football, how many points is a touchdown worth?',
    answer: '6',
    category: 'Sports',
    difficulty: 'medium',
    hint: 'It\'s more than 3',
    funFact: 'After scoring a touchdown, teams can kick for 1 extra point or run/pass for 2 extra points.',
    learnMore: 'https://www.britannica.com/sports/American-football',
    resources: {
      correct: 'https://www.britannica.com/sports/American-football',
      incorrect: 'https://www.britannica.com/sports/rugby'
    }
  },
  {
    id: 'sport_005',
    question: 'What sport involves swimming, cycling, and running?',
    answer: 'Triathlon',
    category: 'Sports',
    difficulty: 'easy',
    hint: 'It\'s three sports in one',
    funFact: 'Triathlons vary in distance, with the Ironman being the most famous - competitors swim 2.4 miles, bike 112 miles, and run 26.2 miles!',
    learnMore: 'https://www.britannica.com/sports/triathlon',
    resources: {
      correct: 'https://www.britannica.com/sports/triathlon',
      incorrect: 'https://www.britannica.com/sports/marathon'
    }
  },
  {
    id: 'sport_006',
    question: 'How many innings are in a baseball game?',
    answer: '9',
    category: 'Sports',
    difficulty: 'easy',
    hint: 'It\'s a single digit number',
    funFact: 'If the score is tied after 9 innings, the game goes into extra innings until one team wins!',
    learnMore: 'https://www.britannica.com/sports/baseball',
    resources: {
      correct: 'https://www.britannica.com/sports/baseball',
      incorrect: 'https://www.britannica.com/sports/cricket'
    }
  },
  {
    id: 'sport_007',
    question: 'Which famous tennis tournament is played on clay courts?',
    answer: 'French Open',
    category: 'Sports',
    difficulty: 'medium',
    hint: 'It\'s in France',
    funFact: 'The French Open is one of the four Grand Slam tennis tournaments. The others are Wimbledon, the Australian Open, and the US Open.',
    learnMore: 'https://www.britannica.com/sports/French-Open',
    resources: {
      correct: 'https://www.britannica.com/sports/French-Open',
      incorrect: 'https://www.britannica.com/sports/Wimbledon'
    }
  },
  {
    id: 'sport_008',
    question: 'What is the highest score you can get in a single frame of bowling?',
    answer: '300',
    category: 'Sports',
    difficulty: 'hard',
    hint: 'It\'s a perfect game',
    funFact: 'A perfect 300 score in bowling requires 12 consecutive strikes (all pins knocked down on the first roll)!',
    learnMore: 'https://www.britannica.com/sports/bowling',
    resources: {
      correct: 'https://www.britannica.com/sports/bowling',
      incorrect: 'https://www.britannica.com/sports/golf'
    }
  },
  {
    id: 'sport_009',
    question: 'How many holes are on a standard golf course?',
    answer: '18',
    category: 'Sports',
    difficulty: 'easy',
    hint: 'It\'s more than 9',
    funFact: 'Golf courses started with 9 holes, but 18 holes became the standard in the 1700s.',
    learnMore: 'https://www.britannica.com/sports/golf',
    resources: {
      correct: 'https://www.britannica.com/sports/golf',
      incorrect: 'https://www.britannica.com/sports/tennis'
    }
  },
  {
    id: 'sport_010',
    question: 'How many players are on a volleyball team on the court?',
    answer: '6',
    category: 'Sports',
    difficulty: 'medium',
    hint: 'It\'s less than 11',
    funFact: 'Volleyball is played both indoors and on the beach. The beach version has only 2 players per side!',
    learnMore: 'https://www.britannica.com/sports/volleyball',
    resources: {
      correct: 'https://www.britannica.com/sports/volleyball',
      incorrect: 'https://www.britannica.com/sports/badminton'
    }
  },

  // ==================== GENERAL KNOWLEDGE (10 questions) ====================
  {
    id: 'gen_001',
    question: 'How many continents are there?',
    answer: '7',
    category: 'General Knowledge',
    difficulty: 'easy',
    hint: 'It\'s between 5 and 9',
    funFact: 'The exact number depends on your definition! Some countries teach 5 or 6 continents instead of 7.',
    learnMore: 'https://www.britannica.com/topic/continent',
    resources: {
      correct: 'https://www.britannica.com/topic/continent',
      incorrect: 'https://www.britannica.com/place/Earth'
    }
  },
  {
    id: 'gen_002',
    question: 'How many colors are in a rainbow?',
    answer: '7',
    category: 'General Knowledge',
    difficulty: 'easy',
    hint: 'It\'s the same as continents',
    funFact: 'The seven colors are: Red, Orange, Yellow, Green, Blue, Indigo, and Violet (ROYGBIV).',
    learnMore: 'https://www.britannica.com/science/light',
    resources: {
      correct: 'https://www.britannica.com/science/rainbow',
      incorrect: 'https://www.britannica.com/science/light'
    }
  },
  {
    id: 'gen_003',
    question: 'What is the smallest country in the world by area?',
    answer: 'Vatican City',
    category: 'General Knowledge',
    difficulty: 'medium',
    hint: 'It\'s in Europe',
    funFact: 'Vatican City is only about 0.44 square kilometers! Despite its size, it\'s an independent nation with its own government.',
    learnMore: 'https://www.britannica.com/place/Vatican-City',
    resources: {
      correct: 'https://www.britannica.com/place/Vatican-City',
      incorrect: 'https://www.britannica.com/place/Monaco'
    }
  },
  {
    id: 'gen_004',
    question: 'How many strings does a standard guitar have?',
    answer: '6',
    category: 'General Knowledge',
    difficulty: 'easy',
    hint: 'It\'s less than 10',
    funFact: 'While standard guitars have 6 strings, there are also 7-string, 8-string, and 12-string guitars!',
    learnMore: 'https://www.britannica.com/technology/guitar',
    resources: {
      correct: 'https://www.britannica.com/technology/guitar',
      incorrect: 'https://www.britannica.com/technology/violin'
    }
  },
  {
    id: 'gen_005',
    question: 'What is the most spoken language in the world by native speakers?',
    answer: 'Mandarin Chinese',
    category: 'General Knowledge',
    difficulty: 'medium',
    hint: 'It\'s an Asian language',
    funFact: 'Mandarin Chinese has over 900 million native speakers! English is the most spoken language overall when including non-native speakers.',
    learnMore: 'https://www.britannica.com/topic/Mandarin-Chinese',
    resources: {
      correct: 'https://www.britannica.com/topic/Mandarin-Chinese',
      incorrect: 'https://www.britannica.com/topic/English-language'
    }
  },
  {
    id: 'gen_006',
    question: 'How many sides does a pentagon have?',
    answer: '5',
    category: 'General Knowledge',
    difficulty: 'easy',
    hint: 'It\'s in the name',
    funFact: 'Pentagon comes from the Greek words "penta" (five) and "gonia" (angle). The Pentagon building in Washington D.C. is shaped like a pentagon!',
    learnMore: 'https://www.britannica.com/topic/polygon',
    resources: {
      correct: 'https://www.britannica.com/topic/polygon',
      incorrect: 'https://www.britannica.com/topic/polygon'
    }
  },
  {
    id: 'gen_007',
    question: 'What is the symbol for the element gold on the periodic table?',
    answer: 'Au',
    category: 'General Knowledge',
    difficulty: 'medium',
    hint: 'It\'s from the Latin word "aurum"',
    funFact: 'Gold has been valued by humans for thousands of years. It\'s one of the few elements that doesn\'t tarnish or corrode.',
    learnMore: 'https://www.britannica.com/science/gold',
    resources: {
      correct: 'https://www.britannica.com/science/gold',
      incorrect: 'https://www.britannica.com/science/element'
    }
  },
  {
    id: 'gen_008',
    question: 'How many chambers does a human heart have?',
    answer: '4',
    category: 'General Knowledge',
    difficulty: 'easy',
    hint: 'Two and two',
    funFact: 'The four chambers are: left atrium, right atrium, left ventricle, and right ventricle. They work together to pump blood throughout the body.',
    learnMore: 'https://www.britannica.com/science/heart',
    resources: {
      correct: 'https://www.britannica.com/science/heart',
      incorrect: 'https://www.britannica.com/science/organ'
    }
  },
  {
    id: 'gen_009',
    question: 'What is the boiling point of water in Celsius?',
    answer: '100',
    category: 'General Knowledge',
    difficulty: 'easy',
    hint: 'It\'s a round number',
    funFact: 'The freezing point of water is 0°C and the boiling point is 100°C. This is why the Celsius scale is perfect for water!',
    learnMore: 'https://www.britannica.com/science/water',
    resources: {
      correct: 'https://www.britannica.com/science/water',
      incorrect: 'https://www.britannica.com/science/temperature'
    }
  },
  {
    id: 'gen_010',
    question: 'How many stripes are on the American flag?',
    answer: '13',
    category: 'General Knowledge',
    difficulty: 'easy',
    hint: 'It represents the original 13 states',
    funFact: 'The 13 stripes represent the 13 original colonies. There are 50 stars for the 50 states.',
    learnMore: 'https://www.britannica.com/topic/United-States-flag',
    resources: {
      correct: 'https://www.britannica.com/topic/United-States-flag',
      incorrect: 'https://www.britannica.com/place/United-States'
    }
  }
];

// Export for use in Activity Board
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRIVIA_QUESTIONS_EXPANDED };
}
