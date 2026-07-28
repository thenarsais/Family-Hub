# Browser Compatibility Matrix
**Status:** Locked ✅ | Date: 2026-06-11

---

## Primary Browsers

| Browser | Priority | Use Case | Version Target |
|---------|----------|----------|----------------|
| Chrome | PRIMARY | Family Hub touchscreen, parent laptop | Latest - 2 versions |
| Safari | SECONDARY | iPad (future-proofing) | Latest - 1 version |
| Firefox | TERTIARY | Alternative desktop | Latest - 2 versions |
| Edge | NOT TARGETED | Windows default, may work but not tested | — |

---

## Device Matrix

| Device | Browser | User | Priority |
|--------|---------|------|----------|
| Windows laptop | Chrome | Parent (primary) | HIGH |
| Family Hub touchscreen | Chrome | Krish (primary) | HIGH |
| iPad (future) | Safari | Krish | MEDIUM |
| Android tablet (future) | Chrome | Krish | LOW |

---

## Feature Compatibility Checklist

### IndexedDB
| Feature | Chrome | Safari | Firefox | Notes |
|---------|--------|--------|---------|-------|
| IndexedDB v2 | ✅ | ✅ (iOS 10+) | ✅ | All supported |
| Blob storage | ✅ | ✅ | ✅ | For future images |
| Quota (50MB+) | ✅ | ⚠️ (variable) | ✅ | Safari may prompt |
| Persistent storage | ✅ | ⚠️ | ✅ | Safari may clear |

> **Safari Note:** Safari may ask user for storage permission if >50MB. Plan fallback prompt.

### CSS Features
| Feature | Chrome | Safari | Firefox | Notes |
|---------|--------|--------|---------|-------|
| CSS Grid | ✅ | ✅ | ✅ | Safe to use |
| CSS Flexbox | ✅ | ✅ | ✅ | Safe to use |
| CSS Variables | ✅ | ✅ | ✅ | Safe for theming |
| CSS Animations | ✅ | ✅ (-webkit-) | ✅ | Add -webkit- prefix |
| CSS Custom Props | ✅ | ✅ | ✅ | Safe for 15 themes |

### JavaScript APIs
| Feature | Chrome | Safari | Firefox | Notes |
|---------|--------|--------|---------|-------|
| ES6+ (const/let/arrow) | ✅ | ✅ | ✅ | Safe to use |
| Async/Await | ✅ | ✅ | ✅ | Safe to use |
| Web Speech API (TTS) | ✅ | ✅ (-webkit-) | ⚠️ | Firefox limited |
| localStorage | ✅ | ✅ | ✅ | Fallback only |
| Crypto.randomUUID() | ✅ | ✅ (15.4+) | ✅ | For UUID generation |
| ResizeObserver | ✅ | ✅ | ✅ | Responsive design |

### Text-to-Speech (Accessibility)
| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Use `speechSynthesis` API |
| Safari | ✅ With prefix | Use `webkitSpeechSynthesis` fallback |
| Firefox | ⚠️ Partial | May not work, show text fallback |

> **TTS Strategy:** TTS is enhancement only. If unavailable, show text normally (no error).

---

## Safari-Specific Considerations

### IndexedDB Storage Persistence
- Safari may clear IndexedDB under storage pressure
- **Mitigation:** Request persistent storage on first load
```javascript
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then(granted => {
    if (!granted) showStorageWarning();
  });
}
```

### Safari CSS Prefixes Required
```css
/* Animations */
-webkit-animation: fadeIn 0.3s ease;
animation: fadeIn 0.3s ease;

/* Transitions */
-webkit-transition: all 0.2s;
transition: all 0.2s;
```

### Safari TTS Fallback
```javascript
const synth = window.speechSynthesis || window.webkitSpeechSynthesis;
if (!synth) {
  // Show text only, no TTS button
}
```

---

## Testing Requirements

### Before Phase 1 Launch
- [ ] Test IndexedDB read/write in Chrome
- [ ] Test IndexedDB read/write in Safari (if available)
- [ ] Test localStorage fallback in Chrome
- [ ] Test CSS animations in Chrome + Safari
- [ ] Test TTS in Chrome

### Before Phase 3 Launch (Accessibility)
- [ ] Test TTS in all 3 browsers
- [ ] Test dyslexia font rendering (Chrome/Safari/Firefox)
- [ ] Test high contrast mode (Chrome/Safari/Firefox)
- [ ] Test keyboard navigation (Tab/Enter/Spacebar)
- [ ] Test touch targets (≥48px) on touchscreen

### Before Phase 8 Launch
- [ ] Full cross-browser regression test
- [ ] iPad Safari testing (if device available)
- [ ] Parent dashboard in Chrome + Firefox
- [ ] Performance test (question load <2s across browsers)

---

## Polyfills & Libraries

| Library | Purpose | Needed? |
|---------|---------|---------|
| idb (Jake Archibald) | Simplified IndexedDB API | ✅ RECOMMENDED |
| OpenDyslexic font | Dyslexia-friendly font | ✅ NEEDED (Phase 3) |
| No jQuery | Not needed | ❌ Avoid |
| No React/Vue | Overkill for single file | ❌ Avoid |

> **idb library:** Wraps IndexedDB in Promises, much cleaner code. ~3KB gzipped.

---

## Known Issues & Workarounds

| Issue | Browser | Workaround |
|-------|---------|------------|
| TTS voices may differ | Safari | Test voice list, use first available |
| Storage may be cleared | Safari | Request persistent storage |
| CSS animation flicker | Safari | Add `-webkit-transform: translateZ(0)` |
| UUID generation | Old Safari (<15.4) | Use crypto fallback polyfill |

---

**Summary:** Build for Chrome first, test Safari before iPad launch, Firefox as stretch goal.
