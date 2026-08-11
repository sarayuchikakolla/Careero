# 🎯 Prep Mate

An AI-powered interview and exam preparation web app. Practice answers out loud, get instant feedback, and track your progress — all in the browser.

---

## ✨ Features

- **AI voice practice** — Speak your answers aloud using ElevenLabs-powered voice interaction
- **Smart feedback** — Real-time analysis and suggestions on your responses
- **Progress tracking** — Charts and stats to monitor improvement over sessions
- **Markdown support** — Rich text rendering for questions, tips, and explanations
- **Smooth animations** — Polished experience built with Framer Motion
- **Supabase backend** — Persistent sessions, user data, and history
- **Test coverage** — Unit tests with Vitest and React Testing Library

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Build Tool | Vite |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| AI Voice | ElevenLabs (`@elevenlabs/react`) |
| Backend / Realtime | Supabase |
| Data Fetching | TanStack React Query |
| Forms | React Hook Form + Zod |
| Routing | React Router DOM v6 |
| Markdown | react-markdown |
| Testing | Vitest + React Testing Library |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (or Bun)
- A [Supabase](https://supabase.com) project
- An [ElevenLabs](https://elevenlabs.io) API key

### Installation

```bash
# Clone the repository
git clone https://github.com/sarayuchikakolla/prep_mate.git
cd prep_mate

# Install dependencies
npm install
# or
bun install
```

### Environment Setup

A `.env` file is included in the repo — fill in your credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

You can find the Supabase values under **Settings → API** in your project dashboard.

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## 🧪 Testing

```bash
# Run tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

---

## 📁 Project Structure

```
prep_mate/
├── public/             # Static assets
├── src/                # Application source code
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level page components
│   ├── hooks/          # Custom React hooks
│   └── lib/            # Utilities and Supabase client
├── supabase/           # Supabase config and migrations
├── index.html
├── vite.config.ts
├── vitest.config.ts
└── tailwind.config.ts
```

---

## 📖 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run build:dev` | Development build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests once |
| `npm run test:watch` | Run tests in watch mode |
