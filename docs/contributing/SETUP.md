# Local Development Setup

## Prerequisites

- Node.js 20+
- npm
- A Firebase project (or access to the existing `spondylatlas` project)
- An Anthropic API key (only needed to run agents locally)

---

## 1. Clone and install

```bash
git clone https://github.com/MoritzGan/spondylatlas.git
cd spondylatlas
npm install
```

---

## 2. Configure Firebase

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Fill in your Firebase config values (found in the Firebase console under **Project Settings → Your apps**):

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 3. Start the development server

```bash
npm run dev
```

The app is available at `http://localhost:5173`.

---

## 4. Run agents locally (optional)

```bash
cd agents
cp .env.example .env
```

Fill in:
```env
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

Download your Firebase service account key from **Firebase console → Project Settings → Service accounts → Generate new private key** and save it as `agents/firebase-service-account.json`.

Then run any agent:
```bash
npx tsx paper-search-agent.ts
npx tsx evidence-grader.ts
npx tsx summary-writer.ts
npx tsx trial-tracker.ts
npx tsx forum-moderator.ts
```

---

## 5. Useful commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Run ESLint
npx tsc -b         # TypeScript type check
```
