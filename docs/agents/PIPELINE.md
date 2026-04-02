# AI Agent Pipeline

SpondylAtlas uses an autonomous AI agent pipeline to continuously collect, evaluate, and explain research on Ankylosing Spondylitis. The agents are built with TypeScript and use Anthropic's Claude model via the API.

---

## Why agents?

Medical research on AS is published continuously across dozens of journals and databases. Manually keeping up is impractical. The agent pipeline solves this by:

- Running automatically on a schedule
- Deduplicating against existing Firestore records
- Applying consistent evidence evaluation criteria
- Writing patient-friendly summaries in both German and English
- Tracking active clinical trials

Over time, the accumulated data is the foundation for a second goal: **pattern recognition** — finding connections across hundreds of papers that no single study explicitly describes.

---

## Pipeline Overview

```
PubMed + Europe PMC
        │
        ▼
 paper-search-agent          (daily, GitHub Actions)
 ├─ Searches for AS papers
 ├─ Deduplicates against Firestore
 └─ Stores: title, abstract, authors, URL, source, tags
        │
        ▼
 evidence-grader              (every 6h, OpenClaw)
 ├─ Reads papers without evidenceLevel
 ├─ Asks Claude to classify by Oxford CEBM level
 └─ Stores: evidenceLevel, studyType, confidence, rationale, tags (merged)
        │
        ▼
 summary-writer               (every 8h, OpenClaw)
 ├─ Reads graded papers without patientSummary
 ├─ Asks Claude to write in plain language (DE + EN)
 └─ Stores: patientSummary.de, patientSummary.en
```

```
ClinicalTrials.gov
        │
        ▼
 trial-tracker                (daily, OpenClaw)
 ├─ Queries /api/v2/studies for recruiting AS trials
 ├─ Deduplicates against /trials collection
 ├─ Asks Claude for a German patient summary
 └─ Stores full trial record in /trials/{nctId}
```

```
New forum post (status: pending_moderation)
        │
        ▼
 forum-moderator              (every 2h, OpenClaw)
 ├─ Reads pending posts
 ├─ Asks Claude to evaluate: approve / flag / remove
 └─ Updates status + stores moderation metadata
```

---

## Evidence Levels (Oxford CEBM)

The evidence-grader uses the Oxford Centre for Evidence-Based Medicine levels:

| Level | Study type |
|---|---|
| 1a | Systematic review of RCTs |
| 1b | Individual RCT |
| 2a | Systematic review of cohort studies |
| 2b | Individual cohort study |
| 3 | Case-control study |
| 4 | Case series / cross-sectional study |
| 5 | Expert opinion / case report |

Higher levels (1a, 1b) carry more weight in the Research Hub UI.

---

## Claude Model

All agents use `claude-3-haiku-20240307` — chosen for its speed and cost efficiency for classification and summarisation tasks. Prompts are designed to return structured JSON directly, avoiding markdown-wrapped responses.

---

## Rate Limiting

Each agent includes a 300–500ms delay between Firestore writes to avoid hitting Anthropic API rate limits. Batch sizes per run:

| Agent | Max per run |
|---|---|
| paper-search | unlimited (deduped) |
| evidence-grader | 20 papers |
| summary-writer | 15 papers |
| trial-tracker | 20 trials |
| forum-moderator | 30 posts |

---

## Future: Pattern Recognition

The current pipeline is the data collection phase. The next step is cross-paper analysis:

- Which interventions appear most frequently in high-evidence studies?
- Are there comorbidity patterns that appear across multiple cohort studies but are never named as a primary outcome?
- What does the body of evidence say about a specific drug class, aggregated?

This will be implemented as a separate agent that queries the full `/papers` collection and asks Claude to reason across the dataset.
