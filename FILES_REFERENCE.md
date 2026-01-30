# Files Reference - Opening Experience Implementation

Quick reference for all files created and modified for the opening experience.

---

## New Files Created

### Core Routing & Pages

| File | Purpose | Size |
|------|---------|------|
| `app/intro/layout.tsx` | Clean layout for intro (no tab bar) | 0.5 KB |
| `app/intro/page.tsx` | Main orchestrator for all intro phases | 3.5 KB |

### Intro Components

| File | Purpose | Size |
|------|---------|------|
| `app/intro/components/BibleCover.tsx` | Phase 1: Bible cover with breathing animation | 4.2 KB |
| `app/intro/components/AudioWelcome.tsx` | Phase 2: Audio welcome with fallback captions | 6.6 KB |
| `app/intro/components/OpeningTransition.tsx` | Phase 3: Bible opening animation | 4.5 KB |
| `app/intro/components/GenesisReading.tsx` | Phase 4: Genesis 1:1 display with audio | 7.5 KB |

### Library Utilities

| File | Purpose | Size |
|------|---------|------|
| `lib/intro-state.ts` | localStorage management for intro state | 3.8 KB |
| `lib/audio-utils.ts` | Audio playback utilities and autoplay detection | 2.5 KB |

### Documentation

| File | Purpose | Size |
|------|---------|------|
| `OPENING_EXPERIENCE_ARCHITECTURE.md` | Complete technical architecture | 12 KB |
| `JUNIOR_DEVELOPER_HANDOFF.md` | Step-by-step implementation guide | 6 KB |
| `IMPLEMENTATION_SUMMARY.md` | Executive summary for product owner | 15 KB |
| `PACKAGE_UPDATES.md` | Dependencies and installation instructions | 2 KB |
| `FILES_REFERENCE.md` | This file - quick reference | 2 KB |

---

## Files to Modify

### Existing Files That Need Updates

| File | Action | What Changes |
|------|--------|--------------|
| `app/page.tsx` | **Replace** with content from `app/page-new.tsx` | Add intro routing logic |
| `components/BottomTabBar.tsx` | **Replace** with content from `components/BottomTabBar-new.tsx` | Hide tab bar on `/intro` route |

### Temporary Files (Delete After Replacement)

- `app/page-new.tsx` - Delete after replacing `app/page.tsx`
- `components/BottomTabBar-new.tsx` - Delete after replacing `components/BottomTabBar.tsx`

---

## Assets Needed (Not Included)

### Audio Files (Place in `public/audio/`)

| File | Duration | Description |
|------|----------|-------------|
| `welcome-message.mp3` | 30-45s | Main welcome narration |
| `genesis-1-reading.mp3` | 10-15s | Genesis 1:1 reading |
| `page-turn.mp3` | 1-2s | Page-turning sound effect |

### Image Files (Place in `public/images/`)

| File | Dimensions | Description |
|------|-----------|-------------|
| `bible-cover.jpg` | 1200x1600px | Leather Bible cover photo |

---

## Dependencies to Install

```bash
npm install framer-motion@^11.0.0
npm install react-use@^17.5.0
npm install --save-dev next-pwa@^5.6.0
```

---

## File Locations Summary

```
biblesummary.ai/
├── app/
│   ├── intro/                          ← NEW DIRECTORY
│   │   ├── components/                 ← NEW DIRECTORY
│   │   │   ├── AudioWelcome.tsx        ← NEW
│   │   │   ├── BibleCover.tsx          ← NEW
│   │   │   ├── GenesisReading.tsx      ← NEW
│   │   │   └── OpeningTransition.tsx   ← NEW
│   │   ├── layout.tsx                  ← NEW
│   │   └── page.tsx                    ← NEW
│   ├── page.tsx                        ← MODIFY (replace with page-new.tsx)
│   └── page-new.tsx                    ← TEMPORARY (delete after use)
│
├── components/
│   ├── BottomTabBar.tsx                ← MODIFY (replace with BottomTabBar-new.tsx)
│   └── BottomTabBar-new.tsx            ← TEMPORARY (delete after use)
│
├── lib/
│   ├── audio-utils.ts                  ← NEW
│   └── intro-state.ts                  ← NEW
│
├── public/                             ← ASSETS NEEDED
│   ├── audio/                          ← CREATE THIS DIRECTORY
│   │   ├── welcome-message.mp3         ← ADD THIS FILE
│   │   ├── genesis-1-reading.mp3       ← ADD THIS FILE
│   │   └── page-turn.mp3               ← ADD THIS FILE
│   └── images/                         ← CREATE THIS DIRECTORY
│       └── bible-cover.jpg             ← ADD THIS FILE
│
└── Documentation/
    ├── OPENING_EXPERIENCE_ARCHITECTURE.md  ← NEW
    ├── JUNIOR_DEVELOPER_HANDOFF.md         ← NEW
    ├── IMPLEMENTATION_SUMMARY.md           ← NEW
    ├── PACKAGE_UPDATES.md                  ← NEW
    └── FILES_REFERENCE.md                  ← NEW (this file)
```

---

## Total Code Statistics

- **New TypeScript/TSX files:** 8 files
- **Total new code:** ~35 KB
- **Modified files:** 2 files
- **Documentation:** 5 files (~37 KB)
- **Dependencies added:** 3 packages (~70 KB gzipped)

---

## Quick Start for Claude

1. Install dependencies: `npm install framer-motion react-use && npm install --save-dev next-pwa`
2. Copy all NEW files to their locations
3. Replace `app/page.tsx` with `app/page-new.tsx`
4. Replace `components/BottomTabBar.tsx` with `components/BottomTabBar-new.tsx`
5. Delete temporary files: `page-new.tsx` and `BottomTabBar-new.tsx`
6. Add audio and image assets to `public/` directory
7. Test: `npm run dev` and visit `http://localhost:3000`

---

## Verification Checklist

After implementation, verify these files exist:

- [ ] `app/intro/layout.tsx`
- [ ] `app/intro/page.tsx`
- [ ] `app/intro/components/BibleCover.tsx`
- [ ] `app/intro/components/AudioWelcome.tsx`
- [ ] `app/intro/components/OpeningTransition.tsx`
- [ ] `app/intro/components/GenesisReading.tsx`
- [ ] `lib/intro-state.ts`
- [ ] `lib/audio-utils.ts`
- [ ] `app/page.tsx` (updated with intro routing)
- [ ] `components/BottomTabBar.tsx` (updated to hide on /intro)
- [ ] `public/audio/welcome-message.mp3`
- [ ] `public/audio/genesis-1-reading.mp3`
- [ ] `public/audio/page-turn.mp3`
- [ ] `public/images/bible-cover.jpg`

---

**All files are ready for implementation. No code has been pushed to the repository.**
