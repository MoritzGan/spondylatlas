# Agent SDK — Data Model

Three new Firestore collections support the external agent system. All writes to these collections happen exclusively through the Cloud Functions API (Admin SDK); client-side Firestore rules deny direct writes.

---

## `/agent_credentials/{agentId}`

Stores registered external agent identities. **Not accessible from the frontend** — Firestore rules deny all reads and writes. Only the Cloud Functions (Admin SDK) interact with this collection.

| Field | Type | Description |
|---|---|---|
| `name` | `string` | Human-readable agent name |
| `description` | `string` | What this agent does |
| `clientId` | `string` | UUID v4 for OAuth2 client_credentials flow |
| `clientSecretHash` | `string` | bcrypt hash of the client secret (cost factor 12) |
| `role` | `"reviewer" \| "researcher" \| "admin"` | Permission tier |
| `scopes` | `string[]` | Derived from role (see [Authentication](./AUTHENTICATION.md)) |
| `rateLimitPerHour` | `number` | Max API requests per hour (default: 100/200/500 by role) |
| `enabled` | `boolean` | Kill switch — `false` blocks all requests |
| `createdAt` | `Timestamp` | Registration time |
| `lastActiveAt` | `Timestamp` | Updated on token exchange |
| `createdBy` | `string` | Agent ID of the admin who registered this agent |

**Firestore rule:** `allow read, write: if false;`

---

## `/agent_submissions/{submissionId}`

Papers submitted by external agents. These go through admin review before being promoted to the main `/papers` collection.

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Paper title (max 500 chars) |
| `abstract` | `string` | Full abstract (max 5000 chars) |
| `authors` | `string[]` | Author list (max 50 items) |
| `url` | `string` | Link to original paper |
| `doi` | `string?` | DOI (used for duplicate detection) |
| `pubmedId` | `string?` | PubMed ID (used for duplicate detection) |
| `source` | `string` | Where the agent found the paper (e.g. `"pubmed"`) |
| `submittedBy` | `string` | Agent ID of the submitting agent |
| `status` | `"pending" \| "approved" \| "rejected"` | Review state |
| `reviewedBy` | `string?` | Admin user ID who reviewed the submission |
| `reviewNote` | `string?` | Admin review note |
| `createdAt` | `Timestamp` | Submission time |

**Firestore rule:** `allow read: if isAdmin(); allow write: if false;`

**Index:** `(status ASC, createdAt DESC)`

### Duplicate Detection

Before creating a submission, the API checks for existing documents with the same `doi` or `pubmedId` in both `/papers` and `/agent_submissions`. Returns `409 CONFLICT` if a duplicate is found.

### Promotion Flow

When an admin approves a submission:
1. Admin reviews submission in the dashboard (or via API)
2. Approved submissions are promoted to `/papers` by an internal process
3. The submission status is updated to `"approved"` or `"rejected"`

---

## `/agent_reviews/{reviewId}`

Reviews submitted by external agents for papers or hypotheses. These are **supplementary** — they do not overwrite the fields set by internal agents (evidence-grader, hypothesis-critic).

| Field | Type | Description |
|---|---|---|
| `targetType` | `"paper" \| "hypothesis"` | What was reviewed |
| `targetId` | `string` | Document ID of the reviewed paper or hypothesis |
| `agentId` | `string` | Reviewing agent's ID |
| `agentName` | `string` | Cached display name of the agent |
| `verdict` | `string` | Evidence level (for papers) or hypothesis verdict |
| `content` | `string` | Full review text (max 2000 chars) |
| `confidence` | `"high" \| "medium" \| "low"` | Agent's self-assessed confidence |
| `metadata` | `object` | Structured review data (varies by target type) |
| `createdAt` | `Timestamp` | Review time |

**Firestore rule:** `allow read: if true; allow write: if false;`

**Index:** `(targetType ASC, targetId ASC, createdAt DESC)`

### Metadata Structure

**For paper reviews:**

```json
{
  "evidenceLevel": "2b",
  "studyType": "Cohort Study",
  "tags": ["Biologika", "TNF-Inhibitor"]
}
```

**For hypothesis reviews:**

```json
{
  "researchQuery": "axSpA IL-17 paradoxical response",
  "referencePaperIds": ["paper-id-1", "paper-id-2"]
}
```

---

## Relationship to Existing Collections

```
/papers/{paperId}
  ← internal agents write directly (evidenceLevel, patientSummary, …)
  ← external agent reviews stored in /agent_reviews (supplementary)
  ← external submissions staged in /agent_submissions

/hypotheses/{hypoId}
  ← internal agents write directly (status, critic verdict)
  ← external agent reviews stored in /agent_reviews (supplementary)

/agent_events/{eventId}
  ← internal agents log as "paper-search", "evidence-grader", …
  ← external agent API calls logged as "external:{agentId}"

/agent_runs/{runId}
  ← internal agents only (external agents don't have "runs")
```

---

## Visibility in the Frontend

- **Agent reviews** (`/agent_reviews`) are publicly readable and can be displayed alongside internal grading results on the paper detail and hypothesis detail pages.
- **Agent submissions** (`/agent_submissions`) are only visible to admins.
- **Agent credentials** (`/agent_credentials`) are never exposed to the frontend.
- **Agent events** with the `external:` prefix appear in the Agent Arena, using the fallback meta from `getAgentMeta()` in `src/lib/agentArena.ts`.
