# Handoff: Implementing the Opening Experience

**To:** Claude (Junior Developer)  
**From:** Manus (Senior Developer)  
**Date:** January 29, 2026  
**Project:** ClearBible.ai - Cinematic First-Time User Experience (FTUE)

---

## 1. Objective

Your task is to integrate the new cinematic opening experience into the existing Next.js application. This will create a reverent, immersive introduction for first-time users, as detailed in the product handoff documents.

This guide provides the step-by-step instructions and all the necessary code. For a deeper understanding of the architecture, please refer to the `OPENING_EXPERIENCE_ARCHITECTURE.md` document in the project root.

---

## 2. Prerequisites (Assets Needed)

Before you begin, you will need the following media assets. Place them in the `public/` directory as specified:

- **Audio Files:**
  - `public/audio/welcome-message.mp3`: The main welcome narration.
  - `public/audio/genesis-1-reading.mp3`: The narration for Genesis 1:1.
  - `public/audio/page-turn.mp3`: A subtle page-turning sound effect.

- **Image/Animation Assets:**
  - `public/images/bible-cover.jpg`: A high-quality image of a leather Bible cover. (Used as a fallback).
  - `public/animations/bible-cover.json`: (Optional) A Lottie file for the Bible cover animation if a more advanced animation is desired.

*Note: The components are currently built to use a CSS-based animation and do not require the Lottie file, but the architecture supports it as a future enhancement.* 

---

## 3. Implementation Steps

Follow these steps in order to integrate the new feature.

### Step 3.1: Add New Files

Place the following new files into the specified directories. These files contain all the logic and components for the intro sequence.

1.  **Create the `intro` route:**
    - `app/intro/layout.tsx`
    - `app/intro/page.tsx`

2.  **Add the intro components:**
    - `app/intro/components/BibleCover.tsx`
    - `app/intro/components/AudioWelcome.tsx`
    - `app/intro/components/OpeningTransition.tsx`
    - `app/intro/components/GenesisReading.tsx`

3.  **Add the new library utilities:**
    - `lib/intro-state.ts`
    - `lib/audio-utils.ts`

*All of these files have been prepared and are ready to be placed in the project.* 

### Step 3.2: Update Existing Files

Next, you need to modify two existing files to enable the intro routing logic.

1.  **Replace `app/page.tsx`:**
    - **Action:** Replace the entire content of `app/page.tsx` with the content from `app/page-new.tsx`.
    - **Reason:** This changes the root page from a direct redirect to a component that checks if the user has seen the intro before routing them to either `/intro` or `/bible`.

2.  **Replace `components/BottomTabBar.tsx`:**
    - **Action:** Replace the entire content of `components/BottomTabBar.tsx` with the content from `components/BottomTabBar-new.tsx`.
    - **Reason:** This adds logic to the tab bar to automatically hide itself when the user is on the `/intro` route, providing a clean, immersive experience.

After replacing the files, you can delete `page-new.tsx` and `BottomTabBar-new.tsx`.

### Step 3.3: Install Dependencies

Open your terminal and run the following commands to add the necessary packages for animations and PWA support.

```bash
npm install framer-motion@^11.0.0
npm install react-use@^17.5.0
npm install --save-dev next-pwa@^5.6.0
```

*For more details on these packages, see `PACKAGE_UPDATES.md`.* 

### Step 3.4: Configure PWA (Optional)

To enable Progressive Web App features like offline caching, you need to update your Next.js configuration.

1.  **Rename `next.config.mjs` to `next.config.js`** if it isn't already.
2.  **Update `next.config.js`** to include the PWA plugin:

```javascript
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Your existing Next.js config can go here
};

module.exports = withPWA(nextConfig);
```

---

## 4. Testing Checklist

After completing the steps above, run the app in development mode (`npm run dev`) and perform the following checks:

-   [ ] **First Visit:**
    -   Clear your browser's localStorage for `localhost`.
    -   Navigate to `http://localhost:3000`.
    -   **Expected:** You should be redirected to `/intro` and see the Bible cover animation.

-   [ ] **Intro Flow:**
    -   Verify the Bible cover appears and fades out.
    -   Verify the audio welcome screen appears. If audio doesn't autoplay, check that captions are visible and the manual play button works.
    -   Verify the Bible opening transition plays.
    -   Verify the Genesis 1:1 screen appears.
    -   Verify that after the final screen, you are redirected to `/bible`.

-   [ ] **Returning Visit:**
    -   Refresh the page at `http://localhost:3000`.
    -   **Expected:** You should be redirected directly to `/bible`, skipping the intro sequence entirely.

-   [ ] **Skip Functionality:**
    -   Clear localStorage again and go to the intro.
    -   Click the "Skip" button.
    -   **Expected:** You should be immediately redirected to `/bible`.

-   [ ] **Accessibility:**
    -   Test with your browser's developer tools set to "Reduced Motion". The animations should be disabled and replaced with simple fades.

---

## 5. Conclusion

This integration will bring the product's vision for a reverent opening experience to life. The architecture is designed to be robust and scalable.

If you encounter any issues or have questions about the implementation, please don't hesitate to reach out.

Good luck!
