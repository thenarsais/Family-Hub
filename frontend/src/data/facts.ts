/**
 * Fact of the day (FR-154) — a small curated set of kid-friendly facts, cycled
 * by day-of-year so everyone in the house sees the same one each day. No API.
 *
 * FR-156: the "learn more" blurbs live in `factDetails.ts`, indexed to match
 * this list, and are loaded on demand so they stay out of the first-paint
 * bundle. `factOfDay` returns the fact plus its `index` so the band can fetch
 * the matching blurb. Grow this list over time; keep `factDetails` in sync.
 */

export interface Fact {
  text: string;
  sourceLabel?: string;
}

export const FACTS: Fact[] = [
  { text: 'An octopus has three hearts and blue blood.' },
  { text: 'Honey never spoils — archaeologists have found 3,000-year-old honey that was still edible.' },
  { text: 'A group of flamingos is called a "flamboyance."' },
  { text: 'Bananas are berries, but strawberries are not.' },
  { text: 'The Eiffel Tower can be about 15 cm taller in summer, because heat makes the iron expand.' },
  { text: 'Wombat poop is cube-shaped.', sourceLabel: 'Ig Nobel Prize, 2019' },
  { text: 'A day on Venus is longer than its year.' },
  { text: 'Sea otters hold hands while they sleep so they do not drift apart.' },
  { text: 'The shortest war in history lasted about 38 minutes.' },
  { text: 'Sharks existed before trees did.' },
  { text: 'A bolt of lightning is about five times hotter than the surface of the Sun.' },
  { text: 'Cows have best friends and get stressed when they are separated.' },
  { text: 'The dot over a lowercase "i" or "j" is called a tittle.' },
  { text: 'Octopuses can taste with their arms.' },
  { text: 'Butterflies taste with their feet.' },
  { text: 'There are more stars in the universe than grains of sand on all of Earth’s beaches.' },
  { text: 'A snail can sleep for up to three years.' },
  { text: 'The human nose can remember about 50,000 different scents.' },
  { text: 'Hummingbirds are the only birds that can fly backwards.' },
  { text: 'Some turtles can breathe through their back ends.' },
  { text: 'The Great Wall of China is not actually visible from space with the naked eye.' },
  { text: 'A "jiffy" is an actual unit of time: 1/100th of a second.' },
  { text: 'Polar bear skin is black, and their fur is see-through, not white.' },
  { text: 'The longest hiccuping spell lasted 68 years.', sourceLabel: 'Guinness World Records' },
  { text: 'Your body has enough carbon to make about 900 pencils.' },
  { text: 'A cloud can weigh more than a million pounds.' },
  { text: 'Elephants are the only animals that cannot jump.' },
  { text: 'The unicorn is the national animal of Scotland.' },
  { text: 'Rats laugh when they are tickled.' },
  { text: 'A hard-boiled egg spins, a raw egg wobbles.' },
  { text: 'The heart of a shrimp is located in its head.' },
  { text: 'Peanuts are not nuts — they are legumes, like peas and beans.' },
  { text: 'A group of crows is called a "murder."' },
  { text: 'The tongue is the strongest muscle in the body for its size.' },
  { text: 'Slugs have four noses.' },
  { text: 'Kangaroos cannot walk backwards.' },
  { text: 'A teaspoon of neutron star would weigh about 6 billion tons.' },
  { text: 'The moon has moonquakes.', sourceLabel: 'NASA / Apollo' },
  { text: 'Frogs cannot swallow with their eyes open.' },
  { text: 'The average person walks about 75,000 miles in a lifetime — three times around the Earth.' },
  { text: 'Carrots were originally purple.' },
  { text: 'A shrimp’s favourite way to travel is backwards.' },
  { text: 'Dolphins have names for each other.' },
  { text: 'The wood frog can hold its pee for up to eight months over winter.' },
  { text: 'Venus is the only planet that spins clockwise.' },
  { text: 'Your fingernails grow faster on your dominant hand.' },
  { text: 'A blue whale’s heart is about the size of a small car.' },
  { text: 'Ketchup was sold as medicine in the 1830s.' },
  { text: 'There is a planet made largely of diamond, called 55 Cancri e.' },
  { text: 'Goats have rectangular pupils.' },
];

export function factOfDay(date: Date = new Date()): Fact & { index: number } {
  // Day-of-year from the local calendar fields, compared in UTC so the result
  // is immune to DST offsets and rolls over at the household's local midnight.
  const startOfYear = Date.UTC(date.getFullYear(), 0, 0);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfYear = Math.round((today - startOfYear) / 86_400_000);
  const index = ((dayOfYear % FACTS.length) + FACTS.length) % FACTS.length;
  return { ...FACTS[index], index };
}
