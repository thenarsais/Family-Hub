# Family Hub - Requirements & Status

## Current Phase: Phase 8 (Active Development)

### Completed ✅

#### 1. Gujarati Learning Module
- [x] Curriculum design (158 lessons across 3 phases)
  - Phase 1: Alphabet (48 letters - vowels + consonants)
  - Phase 2: Numbers (30 numerals 0-100)
  - Phase 3: Vocabulary (80 words across 6 categories)
- [x] Curriculum data verified against authoritative sources (LearnGujarati.net, Shabdkosh.com)
- [x] Interactive HTML learning module with three modes:
  - Learn: Daily word/letter display with TTS
  - Quiz: 4-option multiple choice with scoring
  - Trace: Canvas-based letter/number/word tracing with visual guides
- [x] Multi-user support (Krish, Karishma separate profiles)
- [x] Progress tracking (points, accuracy, streaks)
- [x] LocalStorage persistence
- [x] Mobile-responsive design
- [x] GitHub repository created with curriculum and module files

### In Progress 🔄

#### 2. Home Assistant Integration
- [ ] Embed Gujarati module as HA Webpage card
- [ ] Multi-user profile system (Priya admin, Krish, Karishma kids)
- [ ] Dashboard configuration

### Pending ⏳

#### Phase 8 Features (Original Roadmap)

**Karishma's Chore System**
- [ ] YAML configuration for chore tracking
- [ ] Daily/monthly point systems (0-100 / 0-300)
- [ ] Morning, afternoon, evening chore blocks
- [ ] Automations for point updates and resets

**Bambu Lab A1 Integration**
- [ ] Local API connection
- [ ] Print status monitoring (progress %, temps, time remaining)
- [ ] Home Assistant integration
- [ ] Dashboard card with live printer status

**Shopping List Barcode Scanner**
- [ ] Mobile barcode detection (ZXing or similar)
- [ ] Mealie integration
- [ ] Add-to-list functionality
- [ ] Manual entry fallback

**Additional Features**
- [ ] HVAC filter tracking
- [ ] Car start reminders (temperature-based)
- [ ] Laundry monitoring (washer/dryer cycles)
- [ ] Gift & Wish List Manager
- [ ] Family announcement banner
- [ ] Dashboard theming

### Future Phases ⭐

**Phase 9: Content Expansion**
- Spanish learning module (replicating Gujarati architecture)
- Hindi learning module
- Additional Gujarati phases (4-5: Verbs, Adjectives, Sentences)

**Phase 10: Family Automation**
- Advanced scheduling
- Smart home routines
- Family calendar integration
- Meal planning

---

## Technical Stack

**Current:**
- HTML5/CSS3/JavaScript (client-side)
- JSON (curriculum data)
- LocalStorage (progress persistence)
- Home Assistant (target deployment)

**Infrastructure:**
- GitHub (version control)
- Docker (Home Assistant)

---

## Known Limitations

1. Tracing accuracy detection not yet implemented
2. TTS limited to browser Web Speech API
3. No backend persistence (localStorage only)
4. No parental controls/content filtering
5. Curriculum limited to 158 lessons (Phase 3 incomplete)

---

## Success Metrics

- [ ] Krish & Karishma complete Phase 1 (Alphabet) - 8-10 weeks daily practice
- [ ] Quiz accuracy >80% on learned material
- [ ] 15+ minutes daily engagement
- [ ] Home Assistant dashboard fully functional
- [ ] Bambu Lab integration live
- [ ] Karishma chore system active

---

**Last Updated:** June 1, 2026
**Owner:** Priya
