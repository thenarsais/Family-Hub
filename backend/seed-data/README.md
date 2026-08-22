# Seed data

Content for features whose schema/seed script doesn't exist yet — staged here so it's found
when the corresponding feature actually gets built, instead of living in an unrelated prototype
directory.

## gujarati-curriculum.json

158 lessons for the Gujarati learning module: Phase 1 Alphabet (48 letters), Phase 2 Numbers (30
numerals 0-100), Phase 3 Vocabulary (80 words across 6 categories). Each entry has the Gujarati
script, romanization, a pronunciation guide, and an English gloss. Verified against
LearnGujarati.net and Shabdkosh.com.

Matches `backend/src/routes/learning.ts`'s existing `alphabet`/`numbers`/`vocabulary` category
validation — that route currently has no seed data behind it. When the Learning module's schema
and seed script get built (see the Chores/Learning domain decision in
`.claude/projects/.../memory/rebuild-decisions.md`), this file is the source to seed from,
replacing the route's current empty-table state.

Originally shipped as part of a standalone HTML prototype (`gujarati-learning/` — since removed);
this JSON was the only part of that prototype worth keeping, since the feature itself will live
in the real React frontend and call the real backend, not a static page.

## trivia-questions-phase1.json / trivia-questions-expanded.json

Trivia content salvaged from `modules/krish-tasks/` (since removed — a 9,704-line HTML app meant
to run as a Home Assistant iframe panel, `localStorage`-only state, not reusable architecture).
**Correcting an earlier estimate**: this is not ~224 distinct questions. `-expanded.json` (113
questions, 12 categories, schema: `id`/`answer`/`funFact`/`learnMore`/`resources`) is a superset
of `-phase1.json` (111 questions, schema: `uuid`/`legacyId`/`correct`/`options`/`hint`/
`enhancedFunFact`/`source`/`tags`) — every `legacyId` in phase1 matches an `id` in expanded.
**113 distinct questions total.** Phase1 has the richer metadata (multiple-choice options, cited
sources, tags) for 111 of them; only 2 questions (`gen_009`, `gen_010`) exist solely in the
expanded file. Whoever builds the real trivia feature should treat phase1 as primary and pull in
just those 2 from expanded, rather than concatenating both files.

Far better than the live app's current `trivia_questions` table, which has 14 generic placeholder
rows (`backend/src/seed.ts`).

## mini-games-design-reference.txt

Game design reference (unlock thresholds, 4 game specs — Wordle variant/Quick-Fire/Word
Scramble/Hangman, power-up system, scoring) from the same `modules/krish-tasks/` prototype, where
these 4 games were reportedly built and working (client-side, against `localStorage`). Kept as a
design reference only — the code itself was embedded in the removed HTML file and isn't portable;
a real implementation would be a fresh React build against this design, not a port.
