# SpondylAtlas Paper Search Agent

Automated agent that searches PubMed and Europe PMC for new axial spondyloarthritis research papers, generates German-language summaries via Claude, and stores them in Firestore.

## How it works

1. **Search** — queries PubMed (last 30 days, max 50) and Europe PMC (25 newest) for ankylosing spondylitis / axSpA papers
2. **Deduplicate** — skips papers already in Firestore (matched by DOI or PubMed ID)
3. **Summarize** — generates a 3-4 sentence German summary using Claude (claude-3-5-haiku) aimed at non-medical readers
4. **Store** — saves paper metadata + summary to the `papers` Firestore collection
5. **Limit** — max 10 new papers per run for cost control

## Setup

### Prerequisites

- Node.js 20+
- Firebase project with Firestore enabled
- Anthropic API key
- Google Cloud service account credentials available through ADC or OIDC

### Install

```bash
cd agents
npm ci
```

### Environment variables

Copy `.env.example` to `.env` and fill in:

```
ANTHROPIC_API_KEY=sk-ant-xxxxx
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Run locally

```bash
cd agents
npm run paper-search
```

## Run via GitHub Actions

The workflow at `.github/workflows/paper-search-agent.yml` runs daily at 06:00 UTC.

Required GitHub secrets:
- `ANTHROPIC_API_KEY`
- `FIREBASE_PROJECT_ID`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_AGENT_SERVICE_ACCOUNT`

## Cost estimate

- **Anthropic**: ~$0.01-0.05 per run (10 papers × ~300 input + 300 output tokens with Haiku)
- **PubMed / Europe PMC**: free, no API key required
- **Firebase**: minimal reads/writes within free tier
