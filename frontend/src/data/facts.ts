/**
 * Fact of the day (FR-154) — a small curated set of kid-friendly facts, cycled
 * by day-of-year so everyone in the house sees the same one each day. No API.
 * Grow this list over time; `factOfDay` just needs it non-empty.
 */
export const FACTS: string[] = [
  'An octopus has three hearts and blue blood.',
  'Honey never spoils — archaeologists have found 3,000-year-old honey that was still edible.',
  'A group of flamingos is called a "flamboyance."',
  'Bananas are berries, but strawberries are not.',
  'The Eiffel Tower can be about 15 cm taller in summer, because heat makes the iron expand.',
  'Wombat poop is cube-shaped.',
  'A day on Venus is longer than its year.',
  'Sea otters hold hands while they sleep so they do not drift apart.',
  'The shortest war in history lasted about 38 minutes.',
  'Sharks existed before trees did.',
  'A bolt of lightning is about five times hotter than the surface of the Sun.',
  'Cows have best friends and get stressed when they are separated.',
  'The dot over a lowercase "i" or "j" is called a tittle.',
  'Octopuses can taste with their arms.',
  'Butterflies taste with their feet.',
  'There are more stars in the universe than grains of sand on all of Earth’s beaches.',
  'A snail can sleep for up to three years.',
  'The human nose can remember about 50,000 different scents.',
  'Hummingbirds are the only birds that can fly backwards.',
  'Some turtles can breathe through their back ends.',
  'The Great Wall of China is not actually visible from space with the naked eye.',
  'A "jiffy" is an actual unit of time: 1/100th of a second.',
  'Polar bear skin is black, and their fur is see-through, not white.',
  'The longest hiccuping spell lasted 68 years.',
  'Your body has enough carbon to make about 900 pencils.',
  'A cloud can weigh more than a million pounds.',
  'Elephants are the only animals that cannot jump.',
  'The unicorn is the national animal of Scotland.',
  'Rats laugh when they are tickled.',
  'A hard-boiled egg spins, a raw egg wobbles.',
  'The heart of a shrimp is located in its head.',
  'Peanuts are not nuts — they are legumes, like peas and beans.',
  'A group of crows is called a "murder."',
  'The tongue is the strongest muscle in the body for its size.',
  'Slugs have four noses.',
  'Kangaroos cannot walk backwards.',
  'A teaspoon of neutron star would weigh about 6 billion tons.',
  'The moon has moonquakes.',
  'Frogs cannot swallow with their eyes open.',
  'The average person walks about 75,000 miles in a lifetime — three times around the Earth.',
  'Carrots were originally purple.',
  'A shrimp’s favourite way to travel is backwards.',
  'Dolphins have names for each other.',
  'The wood frog can hold its pee for up to eight months over winter.',
  'Venus is the only planet that spins clockwise.',
  'Your fingernails grow faster on your dominant hand.',
  'A blue whale’s heart is about the size of a small car.',
  'Ketchup was sold as medicine in the 1830s.',
  'There is a planet made largely of diamond, called 55 Cancri e.',
  'Goats have rectangular pupils.',
];

export function factOfDay(date: Date = new Date()): string {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const diff = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start;
  const dayOfYear = Math.floor(diff / 86_400_000);
  return FACTS[dayOfYear % FACTS.length];
}
