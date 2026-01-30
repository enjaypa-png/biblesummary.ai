# Package Updates Required

## Dependencies to Add

Run these commands to install the required dependencies:

```bash
npm install framer-motion@^11.0.0
npm install react-use@^17.5.0
npm install --save-dev next-pwa@^5.6.0
```

## Updated package.json

Your `package.json` should include these additions:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.7",
    "next": "^14.2.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.0.0",
    "react-use": "^17.5.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.20",
    "dotenv": "^17.2.3",
    "eslint": "^8",
    "eslint-config-next": "^14.2.18",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "tsx": "^4.7.0",
    "typescript": "^5",
    "next-pwa": "^5.6.0"
  }
}
```

## Dependency Explanations

### framer-motion
- **Purpose:** Smooth animations for opening transition
- **Size:** ~50KB gzipped
- **Usage:** Page-turning animation, smooth transitions

### react-use
- **Purpose:** Useful React hooks including audio/media hooks
- **Size:** ~20KB gzipped (tree-shakeable)
- **Usage:** Audio playback state management

### next-pwa (dev dependency)
- **Purpose:** Progressive Web App support
- **Size:** 0KB (build-time only)
- **Usage:** Generate service worker, manifest, offline caching

## Optional: PWA Configuration

If you want to enable PWA features, create `next.config.mjs` with PWA support:

```javascript
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your existing config
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
```

## Alternative: Minimal Implementation

If you want to avoid adding dependencies, you can:

1. **Skip framer-motion:** Use pure CSS animations (already implemented in components)
2. **Skip react-use:** Use native React hooks (useEffect, useState)
3. **Skip next-pwa:** Manually create service worker later

The components are written to work with or without these dependencies.
