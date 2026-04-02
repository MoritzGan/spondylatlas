# SpondylAtlas 🧭

**The open research and community platform for Ankylosing Spondylitis (axSpA)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red)](https://github.com/MoritzGan/spondylatlas)
[![Built with Claude](https://img.shields.io/badge/Built%20with-Claude%20%26%20OpenClaw-orange)]()
[![Firebase](https://img.shields.io/badge/Firebase-Hosting%20%7C%20Firestore%20%7C%20Auth-yellow)](https://firebase.google.com)

---

## What is SpondylAtlas?

SpondylAtlas is an open, community-driven platform that gives patients, caregivers, and researchers structured access to current scientific literature on **Ankylosing Spondylitis** (AS, also known as axial Spondyloarthritis / axSpA) — combined with a multilingual forum for direct exchange.

**This project does not replace medical advice.** It is a tool for orientation and connection — an atlas in a complex landscape.

### Why this exists

This platform was built for a friend living with Ankylosing Spondylitis. The goal is simple: make the science accessible, and make sure that nobody has to navigate this alone.

---

## Features

| Feature | Description |
|---|---|
| 📚 Research Hub | Curated AS papers from PubMed & Europe PMC, graded by evidence level |
| 🤖 AI Agents | Automated pipeline: search → grade → summarise → track trials |
| 💬 Community Forum | Moderated space for patients, caregivers, and researchers |
| 🌍 Multilingual | Full DE / EN support via i18next |
| 🔓 Open Source | MIT licensed, transparent, no ads |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/MoritzGan/spondylatlas.git
cd spondylatlas

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# → Fill in your Firebase config values

# Start development server
npm run dev
```

See [docs/contributing/SETUP.md](docs/contributing/SETUP.md) for the full local setup guide.

---

## Documentation

| Document | Description |
|---|---|
| [Architecture Overview](docs/architecture/OVERVIEW.md) | Tech stack, system design, data flow |
| [AI Agent Pipeline](docs/agents/PIPELINE.md) | How the research automation works |
| [Agent Reference](docs/agents/AGENTS.md) | All agents: what they do, how often, how to run them |
| [Firestore Data Model](docs/architecture/DATA-MODEL.md) | Collections, fields, relationships |
| [Security & Rules](docs/security/FIRESTORE-RULES.md) | Firestore security rules explained |
| [CI/CD](docs/architecture/CICD.md) | GitHub Actions workflows |
| [Local Setup](docs/contributing/SETUP.md) | Getting started for contributors |
| [Contributing Guide](docs/contributing/CONTRIBUTING.md) | How to contribute |

---

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Firebase (Firestore, Auth, Hosting)
- **AI:** Anthropic Claude (claude-3-haiku) via API
- **Automation:** OpenClaw agent scheduler + GitHub Actions
- **i18n:** i18next (DE, EN)

---

## Project Status

> 🟡 Early development — core pipeline running, UI in progress.

- [x] Research pipeline (paper search + evidence grading + patient summaries)
- [x] Clinical trial tracker
- [x] Forum foundation
- [x] Firebase Auth (Email + Google)
- [x] Firestore security rules
- [ ] Full forum UI
- [ ] User profiles
- [ ] Trial detail pages
- [ ] Pattern recognition across papers

---

## License

MIT — see [LICENSE](LICENSE).

**Medical disclaimer:** SpondylAtlas is an informational resource only. Nothing on this platform constitutes medical advice. Always consult a qualified healthcare professional.
