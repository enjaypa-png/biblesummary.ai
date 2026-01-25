# BibleSummary.ai

A modern Bible reading web app with AI-powered summaries and insights.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (Database and Authentication)
- **Vercel** (Deployment)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and add your Supabase credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Supabase project URL and anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these values in your [Supabase Dashboard](https://supabase.com/dashboard) under Settings > API.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app.

## Project Structure

```
biblesummary.ai/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Homepage
│   ├── login/               # Login page
│   ├── signup/              # Sign up page
│   └── bible/[book]/[chapter]/  # Dynamic Bible chapter routes
├── components/              # Reusable React components
│   └── Navigation.tsx       # Navigation bar component
├── lib/                     # Utility functions and configurations
│   └── supabase.ts         # Supabase client setup
├── public/                  # Static assets
└── .env.example            # Example environment variables

```

## Features

### Current Features

- Clean, responsive homepage with navigation
- User authentication (sign up / sign in) using Supabase Auth
- Dynamic Bible chapter routing (`/bible/[book]/[chapter]`)
- Mobile-friendly design with dark mode support

### Upcoming Features

- Bible text data integration
- AI-powered chapter summaries
- Verse highlighting and bookmarking
- Reading plans and progress tracking
- Search functionality

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

This project is configured for automatic deployment on Vercel. Every push to the main branch will trigger a new deployment.

1. Connect your GitHub repository to Vercel
2. Add your environment variables in Vercel project settings
3. Deploy!

## License

MIT

---

Built with ❤️ to help you understand Scripture.
