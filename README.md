# Family Hub 🏠

A comprehensive home automation and family management system built on Home Assistant, with integrated educational modules, smart home controls, and family coordination tools.

## Project Overview

**Family Hub** is a modular platform designed to centralize family activities, learning, and smart home management. Currently in **Phase 8** with a focus on language education and household automation.

### Current Residents
- **Priya** (Admin) - Denver, CO
- **Krish** (10 years old)
- **Karishma** (8 years old)

---

## 🎓 Current Features

### Gujarati Learning Module ✅ (Live)
Interactive learning platform for children with 158 verified lessons.

**Three Progressive Phases:**
- **Phase 1:** Gujarati Alphabet (48 letters - vowels + consonants)
- **Phase 2:** Numbers 0-100 (30 Gujarati numerals)
- **Phase 3:** Vocabulary (80 essential words across 6 categories)

**Three Learning Modes:**
1. **Learn** - Daily words/letters with pronunciation (TTS)
2. **Quiz** - 4-option multiple choice with instant feedback
3. **Trace** - Canvas-based letter tracing with visual guides

**Key Features:**
- ✅ Multi-user profiles (Krish & Karishma)
- ✅ Progress tracking & points system
- ✅ Curriculum verified against authoritative sources
- ✅ Mobile-responsive, kid-friendly interface
- ✅ LocalStorage persistence
- ✅ Web Speech API TTS support

**Live Demo:** Open `gujarati-learning-module.html` in any modern browser

**Repository:** `gujarati-learning/` directory

---

## 📋 Architecture & Stack

### Current Tech
- **Frontend:** HTML5, CSS3, JavaScript (vanilla)
- **Data:** JSON (curriculum)
- **Persistence:** LocalStorage (browser)
- **Deployment:** GitHub, Home Assistant
- **Infrastructure:** Docker (HA), Home Assistant Core

### Planned
- Backend API (Node.js/Python)
- Database (PostgreSQL)
- Mobile app (React Native)
- Server-side progress sync
- OAuth authentication

---

## 🚀 Getting Started

### Local Development

**1. Clone the repo:**
```bash
git clone https://github.com/thenarsais/Family-Hub.git
cd Family-Hub
```

**2. Gujarati Module:**
```bash
cd gujarati-learning
# Open gujarati-learning-module.html in a browser
```

**3. Home Assistant Deployment:**
- Copy `gujarati-learning-module.html` to HA config
- Add Webpage card to dashboard
- Configure multi-user access via profiles

---

## 📁 Repository Structure

```
Family-Hub/
├── gujarati-learning/              # Language learning module
│   ├── gujarati-learning-module.html
│   ├── gujarati-curriculum-final-verified.json
│   └── README.md
├── REQUIREMENTS.md                 # Project requirements & status
├── FEATURES.md                     # Current feature list
└── README.md                       # This file
```

---

## 🎯 Project Phases

### ✅ Phase 8 (Current - June 2026)

**Completed:**
- [x] Gujarati curriculum design (158 lessons)
- [x] Interactive learning module (Learn/Quiz/Trace modes)
- [x] Multi-user support
- [x] GitHub repository setup

**In Progress:**
- [ ] Home Assistant integration
- [ ] Dashboard embedding

**Pending:**
- [ ] Karishma's chore system
- [ ] Bambu Lab A1 printer integration
- [ ] Shopping list barcode scanner
- [ ] HVAC filter tracking
- [ ] Family announcement banner

### 📅 Phase 9 (Q3 2026)
- Spanish learning module (replicating Gujarati architecture)
- Advanced dashboard customization
- Mobile app wrapper

### 🎨 Phase 10 (Q4 2026+)
- Hindi learning module
- Family automation workflows
- Expanded smart home controls
- Analytics & insights

---

## 👥 User Roles

| Role | Access | Capabilities |
|------|--------|--------------|
| **Priya (Admin)** | Full | All features, configuration, settings |
| **Krish (Child)** | Limited | Learning modules, chores, clock, weather |
| **Karishma (Child)** | Limited | Learning modules, chores, clock, weather |

---

## 🔐 Privacy & Data

- ✅ No cloud sync (yet) - all data local
- ✅ No tracking/analytics collection
- ✅ Progress stored in browser LocalStorage
- ✅ No account creation required (standalone mode)
- 📅 Backend sync planned for Phase 9

---

## 📊 Current Metrics

| Metric | Value |
|--------|-------|
| Total Lessons | 158 |
| Curriculum Hours | ~8-10 weeks (daily practice) |
| Target Accuracy | >80% |
| Daily Target | 15+ minutes |
| Multi-user Profiles | 2 active (Krish, Karishma) |
| Supported Languages | 1 (Gujarati) |

---

## 🤝 Contributing

Currently a private family project. Structure allows future expansion:

**To add a new language module:**
1. Create curriculum JSON following `gujarati-curriculum-final-verified.json` schema
2. Replicate HTML module structure
3. Add to `/[language]/` directory

**Sources for curriculum verification:**
- LearnGujarati.net (exemplary for language design)
- Shabdkosh.com (vocabulary reference)
- Native speaker review recommended

---

## 🐛 Known Issues & Limitations

### Current
1. Tracing accuracy detection not implemented
2. TTS limited to browser Web Speech API
3. No backend persistence
4. Curriculum incomplete (Phase 3 partial)
5. Home Assistant integration pending

### Resolved ✅
- ~~Gujarati vs. Hindi word mixing~~ (Fixed with authoritative sources)
- ~~Curriculum phase ordering~~ (Reordered: Alphabet → Numbers → Vocabulary)

---

## 🗺️ Roadmap

### Phase 8 (June 2026) - Learning Foundation
- [x] Gujarati curriculum
- [ ] Home Assistant dashboard
- [ ] Multi-user profiles

### Phase 9 (Q3 2026) - Expansion
- [ ] Spanish module
- [ ] Mobile app
- [ ] Backend persistence
- [ ] Chore system

### Phase 10+ (Q4 2026)
- [ ] Hindi module
- [ ] Advanced automation
- [ ] Analytics dashboard
- [ ] Family calendar

---

## 📚 References & Sources

**Gujarati Learning:**
- [LearnGujarati.net](https://www.learngujarati.net) - Alphabet, numbers
- [Shabdkosh.com](https://shabdkosh.com) - Vocabulary verification

**Technology:**
- [Home Assistant](https://www.home-assistant.io/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [HTML5 Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

---

## 📞 Contact

**Project Owner:** Priya  
**Email:** thenarsais@gmail.com  
**Repository:** https://github.com/thenarsais/Family-Hub

---

## 📄 License

Private project - family use only.

---

**Last Updated:** June 1, 2026  
**Current Version:** Phase 8.0  
**Status:** Active Development
