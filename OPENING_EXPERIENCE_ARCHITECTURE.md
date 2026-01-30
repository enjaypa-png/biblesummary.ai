# Opening Experience Architecture

**Senior Developer Analysis & Implementation Plan**  
**Date:** January 29, 2026  
**Project:** BibleSummary.ai PWA Opening Experience

---

## Executive Summary

After reviewing the existing codebase, I've architected a complete solution for implementing the cinematic opening experience described in the handoff documents. This plan integrates seamlessly with your current Next.js + Supabase + Tailwind stack without disrupting existing functionality.

---

## Current State Analysis

### What's Already Built ✅

1. **Core Infrastructure**
   - Next.js 14 (App Router) with TypeScript
   - Supabase integration (auth + database)
   - Tailwind CSS with custom design tokens
   - Bottom tab navigation
   - Bible reading interface (books list + chapter view)
   - Complete database schema with RLS policies

2. **Design System**
   - iOS-inspired design tokens (colors, spacing)
   - Dark mode support
   - Serif font for Bible text (Source Serif 4)
   - Sans-serif for UI (Inter)
   - Mobile-first responsive layout

3. **Data Layer**
   - Books table (66 books with metadata)
   - Verses table (KJV text)
   - User authentication ready
   - Reading progress tracking schema

### What's Missing ❌

1. **Opening Experience Components**
   - Bible cover animation
   - Audio narration system
   - Opening transition
   - First-time user experience (FTUE) flow
   - State management for `hasSeenIntro`

2. **PWA Features**
   - Service worker
   - Offline caching
   - Add-to-home-screen support
   - Web app manifest

3. **Audio Infrastructure**
   - Audio player component
   - Autoplay handling (iOS/Android)
   - Captions/fallback system
   - Audio file hosting

4. **Animation Assets**
   - Bible cover image/animation
   - Page-turning animation
   - Lottie files or WebGL setup

---

## Architecture Design

### High-Level Flow

```
User First Visit
    ↓
Check localStorage: hasSeenIntro
    ↓
[FALSE] → Opening Experience Flow
    ↓
1. Bible Cover Screen (3-5s)
    ↓
2. Audio Welcome Message (auto-play with fallback)
    ↓
3. Opening Transition Animation (4-6s)
    ↓
4. Genesis 1:1 Display + Scripture Reading
    ↓
5. Set hasSeenIntro = true
    ↓
6. Redirect to /bible (normal app)

[TRUE] → Skip to /bible (normal app)
```

### Component Architecture

```
app/
├── intro/                          # NEW: Opening experience
│   ├── page.tsx                    # Main intro orchestrator
│   ├── layout.tsx                  # Clean layout (no tab bar)
│   └── components/
│       ├── BibleCover.tsx          # Screen 1: Bible cover
│       ├── AudioWelcome.tsx        # Screen 2: Audio intro
│       ├── OpeningTransition.tsx   # Screen 3: Bible opening
│       └── GenesisReading.tsx      # Screen 4: Genesis 1:1
│
├── page.tsx                        # MODIFY: Check hasSeenIntro
│   └── → /intro (first visit)
│   └── → /bible (returning)
│
components/
├── IntroAudioPlayer.tsx            # NEW: Audio player with fallback
├── IntroStateManager.tsx           # NEW: localStorage + Supabase sync
└── BottomTabBar.tsx                # MODIFY: Hide on /intro route

lib/
├── intro-state.ts                  # NEW: hasSeenIntro logic
└── audio-utils.ts                  # NEW: Autoplay detection

public/
├── audio/
│   ├── welcome-message.mp3         # NEW: Welcome narration
│   └── genesis-1-reading.mp3       # NEW: Scripture reading
├── animations/
│   └── bible-cover.json            # NEW: Lottie animation (optional)
└── images/
    └── bible-cover.jpg             # NEW: Fallback static image
```

---

## Implementation Strategy

### Phase 1: Foundation (Core Infrastructure)

**Goal:** Set up state management and routing logic

**Tasks:**
1. Create `/app/intro` route with clean layout (no tab bar)
2. Implement `hasSeenIntro` localStorage utility
3. Modify root `/app/page.tsx` to check intro state
4. Add Supabase user metadata sync (optional, for cross-device)

**Files to Create:**
- `lib/intro-state.ts`
- `app/intro/layout.tsx`
- `app/intro/page.tsx`

**Files to Modify:**
- `app/page.tsx`
- `components/BottomTabBar.tsx`

---

### Phase 2: Bible Cover Screen

**Goal:** Create the opening Bible cover with subtle animation

**Approach Options:**

**Option A: Lightweight CSS Animation (Recommended)**
- Use a high-quality Bible cover image
- CSS keyframes for subtle breathing effect
- CSS filters for lighting effects
- No external dependencies

**Option B: Lottie Animation**
- More cinematic but requires animation file
- Use `lottie-react` package
- Larger bundle size

**Option C: Three.js WebGL**
- Most realistic but heaviest
- Only if performance isn't a concern
- Requires 3D model or advanced setup

**Recommendation:** Start with Option A (CSS), upgrade later if needed.

**Files to Create:**
- `app/intro/components/BibleCover.tsx`
- `public/images/bible-cover.jpg`

---

### Phase 3: Audio System

**Goal:** Implement audio narration with autoplay handling

**Technical Challenges:**
- iOS Safari blocks autoplay without user interaction
- Need fallback to text captions
- Audio preloading for smooth experience

**Solution Architecture:**

```typescript
// Audio Player Component
interface AudioPlayerProps {
  src: string;
  captions: string;
  autoPlay: boolean;
  onComplete: () => void;
}

// Features:
- Detect autoplay support
- Show captions if audio blocked
- Provide manual play button
- Track playback progress
```

**Files to Create:**
- `components/IntroAudioPlayer.tsx`
- `lib/audio-utils.ts`
- `app/intro/components/AudioWelcome.tsx`

**Audio Files Needed:**
- `public/audio/welcome-message.mp3` (~30-45 seconds)
- `public/audio/genesis-1-reading.mp3` (~2-3 minutes)

---

### Phase 4: Opening Transition

**Goal:** Animate Bible opening with page-turning effect

**Approach:**
- CSS 3D transforms for page-turning
- Framer Motion for smooth transitions
- Page-turn sound effect
- Light spilling effect (CSS gradient overlay)

**Files to Create:**
- `app/intro/components/OpeningTransition.tsx`
- `public/audio/page-turn.mp3`

**Dependencies to Add:**
- `framer-motion` (already common in Next.js projects)

---

### Phase 5: Genesis 1:1 Display

**Goal:** Show Genesis 1:1 with Scripture audio reading

**Features:**
- Fetch Genesis 1:1 from Supabase
- Display with serif typography (existing styles)
- Audio reading with text highlighting
- Smooth transition to main app

**Files to Create:**
- `app/intro/components/GenesisReading.tsx`

**Database Query:**
```sql
SELECT verse, text FROM verses
WHERE book_id = (SELECT id FROM books WHERE slug = 'genesis')
AND chapter = 1
ORDER BY verse
LIMIT 1;
```

---

### Phase 6: PWA Setup

**Goal:** Enable offline access and add-to-home-screen

**Tasks:**
1. Create `manifest.json` with app metadata
2. Set up service worker for offline caching
3. Cache Bible cover, audio files, and Genesis 1
4. Add PWA meta tags to layout

**Files to Create:**
- `public/manifest.json`
- `public/sw.js` (service worker)
- `app/layout.tsx` (add PWA meta tags)

**Next.js PWA Plugin:**
- Use `next-pwa` package for easy setup
- Configure caching strategies

---

## Technical Specifications

### Dependencies to Add

```json
{
  "dependencies": {
    "framer-motion": "^11.0.0",        // Smooth animations
    "react-use": "^17.5.0"             // Hooks for audio/media
  },
  "devDependencies": {
    "next-pwa": "^5.6.0"               // PWA support
  }
}
```

### Environment Variables

No new environment variables needed. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Performance Targets

- **First Contentful Paint:** < 1.5s
- **Bible Cover Load:** < 2s
- **Audio Preload:** Background (non-blocking)
- **Total Intro Duration:** 15-30s (user can skip)
- **Bundle Size Impact:** < 100KB (without audio files)

---

## State Management

### localStorage Schema

```typescript
interface IntroState {
  hasSeenIntro: boolean;
  lastSeenAt: string; // ISO timestamp
  skipped: boolean;   // Track if user skipped
}

// Key: 'biblesummary_intro_state'
```

### Supabase User Metadata (Optional)

```typescript
// auth.users.user_metadata
{
  has_seen_intro: boolean,
  intro_completed_at: string
}
```

**Sync Strategy:**
- Check localStorage first (fast)
- Sync to Supabase on completion (cross-device)
- Fallback to localStorage if offline

---

## Design Tokens (Additions)

```css
/* Add to globals.css */
:root {
  --intro-bg: #1a1a1a;           /* Dark background for intro */
  --intro-text: #f5f5dc;         /* Cream/parchment for Scripture */
  --intro-accent: #d4af37;       /* Gold for embossing */
}
```

---

## Accessibility Requirements

1. **Captions for All Audio**
   - Display text captions if audio fails
   - Provide "Read Instead" option

2. **Skip Button**
   - Allow users to skip intro
   - Accessible via keyboard (Tab + Enter)

3. **Reduced Motion**
   - Detect `prefers-reduced-motion`
   - Disable animations if preferred
   - Show static screens with fade transitions

4. **Screen Reader Support**
   - ARIA labels for all interactive elements
   - Announce screen transitions

---

## Testing Strategy

### Unit Tests
- `lib/intro-state.ts`: localStorage operations
- `lib/audio-utils.ts`: Autoplay detection

### Integration Tests
- Intro flow from start to finish
- Skip functionality
- State persistence

### Manual Testing Checklist
- [ ] iOS Safari (autoplay blocked)
- [ ] Android Chrome (autoplay allowed)
- [ ] Desktop browsers (all major)
- [ ] Dark mode
- [ ] Reduced motion
- [ ] Offline mode (PWA)
- [ ] Slow 3G network

---

## Rollout Plan

### Soft Launch (Testing)
1. Deploy to staging environment
2. Test on real devices (iOS/Android)
3. Gather feedback from 5-10 beta users
4. Iterate on animation timing and audio

### Production Release
1. Feature flag: `ENABLE_INTRO_EXPERIENCE`
2. Enable for 10% of new users
3. Monitor analytics:
   - Completion rate
   - Skip rate
   - Time spent
4. Roll out to 100% if metrics are positive

### Rollback Plan
- Feature flag can disable intro instantly
- Users fall back to direct `/bible` redirect
- No data loss or breaking changes

---

## Future Enhancements

### V2 Features (Post-Launch)
1. **Multiple Narrator Options**
   - Male/female voices
   - Different accents
   - Adjustable speed

2. **Replay Intro**
   - Add option in settings
   - "Replay Welcome Experience"

3. **Localization**
   - Translate audio and captions
   - Support multiple Bible versions

4. **Advanced Animations**
   - Upgrade to Lottie or Three.js
   - More realistic page-turning

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Audio autoplay blocked | High | High | Fallback captions + manual play button |
| Slow loading on mobile | Medium | Medium | Optimize images, lazy load audio |
| Animation performance issues | Medium | Low | Use CSS over JS, test on low-end devices |
| User skips intro immediately | Low | Medium | Track skip rate, improve if > 50% |
| Cross-browser compatibility | Medium | Low | Test on all major browsers |

---

## Success Metrics

### Quantitative
- **Completion Rate:** > 70% of users complete intro
- **Skip Rate:** < 30% of users skip
- **Average Time:** 20-25 seconds
- **Error Rate:** < 1% (audio/animation failures)

### Qualitative
- Users describe experience as "calm" and "reverent"
- Positive feedback on audio narration
- No complaints about forced intro (can skip)

---

## Next Steps

1. **Review this architecture** with stakeholders
2. **Gather audio assets** (narration recordings)
3. **Design Bible cover image** (or source high-quality photo)
4. **Begin Phase 1 implementation** (foundation)
5. **Set up staging environment** for testing

---

## Questions for Product Team

1. **Audio Narration:** Do we have a narrator lined up? Budget for professional recording?
2. **Bible Cover Image:** Do we have a specific Bible in mind for the cover photo?
3. **Intro Duration:** Is 20-30 seconds acceptable, or should it be shorter?
4. **Skip Button:** Should it be visible immediately, or appear after 5 seconds?
5. **Analytics:** What specific events should we track?

---

**Prepared by:** Manus (Senior Developer)  
**For:** Nick (Product Owner)  
**Handoff to:** Claude (Junior Developer)
