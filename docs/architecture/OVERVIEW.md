# Architecture Overview

## System Design

SpondylAtlas is structured as a static single-page application backed by Firebase, with an autonomous AI agent pipeline running outside the browser.

```
┌─────────────────────────────────────────────────────────────┐
│                        USER LAYER                           │
│   Browser (React SPA)  ←→  Firebase Auth + Firestore        │
└───────────────────────────┬─────────────────────────────────┘
                            │ reads
┌───────────────────────────▼─────────────────────────────────┐
│                      DATA LAYER                             │
│              Cloud Firestore (europe-west)                  │
│   papers │ trials │ forum_posts │ forum_comments │ users    │
└───────────────────────────▲─────────────────────────────────┘
                            │ writes
┌───────────────────────────┴─────────────────────────────────┐
│                     AGENT LAYER                             │
│                                                             │
│  paper-search  →  evidence-grader  →  summary-writer        │
│                                                             │
│  trial-tracker (independent)                                │
│  forum-moderator (independent)                              │
│                                                             │
│  Runtime: OpenClaw scheduler + GitHub Actions               │
│  AI: Anthropic Claude (claude-3-haiku-20240307)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Language | TypeScript (strict) |
| Build tool | Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| State | React Context (Auth) |
| i18n | i18next (DE, EN) |
| Hosting | Firebase Hosting |

The frontend is a pure SPA with client-side routing. All data is fetched directly from Firestore via the Firebase JS SDK. There is no custom backend server — security is enforced entirely through Firestore Rules.

---

## Backend (Firebase)

### Firestore
The primary database. All collections are in `europe-west` region. See [DATA-MODEL.md](DATA-MODEL.md) for the full schema.

### Authentication
Firebase Auth handles identity. Supported providers:
- Email + Password
- Google OAuth

User roles (`user`, `moderator`, `admin`) are stored in the `/users/{uid}` document and enforced in Firestore Rules.

### Hosting
Static assets are deployed via Firebase Hosting with a single rewrite rule (`** → /index.html`) for SPA routing.

---

## Agent Layer

AI agents run as scheduled processes outside the browser, using the Firebase Admin SDK with a service account. They bypass Firestore client-side rules and write directly to the database.

Agents are scheduled two ways:
- **GitHub Actions** — for the daily paper search (reliable, version-controlled)
- **OpenClaw cron** — for grading, summarising, trial tracking, and moderation (flexible, operator-controlled)

See [AGENTS.md](../agents/AGENTS.md) for the full agent reference.

---

## Data Flow: Research Pipeline

```
PubMed API ──┐
             ├──► paper-search-agent ──► Firestore /papers (status: published)
Europe PMC ──┘         (daily, GH Actions)
                                │
                                ▼
                    evidence-grader ──► adds evidenceLevel, studyType, tags
                        (every 6h)
                                │
                                ▼
                    summary-writer ──► adds patientSummary.de / .en
                        (every 8h)
                                │
                                ▼
                    Frontend Research Hub ──► readable by all users
```

```
ClinicalTrials.gov ──► trial-tracker ──► Firestore /trials
                           (daily)
```

```
Forum post created ──► status: pending_moderation
                                │
                    forum-moderator ──► status: published / flagged / removed
                        (every 2h)
```
