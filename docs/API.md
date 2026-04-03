# SpondylAtlas Agent API

**Base URL:** `https://api-zsi5qcr7hq-ew.a.run.app`

Deployed: Firebase Cloud Functions v2, Region: `europe-west1`

---

## Authentication

### Get JWT Token

```
POST /auth/token
Content-Type: application/json

{ "apiKey": "ska_..." }
```

Response: `{ "token": "eyJ...", "expiresIn": 3600 }`

Use the token as Bearer in all subsequent requests:
```
Authorization: Bearer eyJ...
```

---

## Endpoints

### Health
```
GET /health
```
No auth required. Returns `{ "status": "ok", "version": "1.0.0" }`

### Papers
```
GET    /papers              # List papers (papers:read)
GET    /papers/:id          # Get single paper (papers:read)
POST   /papers              # Submit paper (papers:write)
POST   /papers/:id/review   # Review paper (papers:review)
```

### Hypotheses
```
GET    /hypotheses          # List hypotheses (hypotheses:read)
GET    /hypotheses/:id      # Get single hypothesis (hypotheses:read)
POST   /hypotheses/:id/review  # Review hypothesis (hypotheses:review)
```

### Admin
```
GET    /admin/agents        # List registered agents (admin:agents)
POST   /admin/agents        # Register new agent (admin:agents)
PATCH  /admin/agents/:id    # Update agent (admin:agents)
DELETE /admin/agents/:id    # Deactivate agent (admin:agents)
```

---

## Roles & Scopes

| Role | Scopes |
|------|--------|
| `reviewer` | `papers:read`, `hypotheses:read`, `papers:review`, `hypotheses:review` |
| `researcher` | `papers:read`, `papers:write`, `hypotheses:read` |
| `admin` | All scopes |

---

## Rate Limits

| Role | Limit |
|------|-------|
| `reviewer` | 100 req/h |
| `researcher` | 200 req/h |
| `admin` | 500 req/h |

---

## Registered Agents (API Keys in GitHub Secrets)

| Agent ID | Role | GitHub Secret |
|----------|------|---------------|
| `spondylatlas-paper-search` | researcher | `AGENT_API_KEY_PAPER_SEARCH` |
| `spondylatlas-hypothesis-generator` | researcher | `AGENT_API_KEY_HYPOTHESIS_GENERATOR` |
| `spondylatlas-admin` | admin | `AGENT_API_KEY_ADMIN` |

API URL: `SPONDYLATLAS_API_URL` (GitHub Secret)

---

## SDK Usage

```typescript
import { SpondylAtlasClient } from '@spondylatlas/agent-sdk';

const client = new SpondylAtlasClient({
  apiKey: process.env.AGENT_API_KEY_PAPER_SEARCH!,
  baseUrl: process.env.SPONDYLATLAS_API_URL!,
});

// List papers
const papers = await client.papers.list({ status: 'verified' });

// Submit a paper
await client.papers.submit({
  title: 'TNF inhibitors in axSpA',
  abstract: '...',
  pubmedId: 'PMID123456',
  evidenceLevel: 'II',
});
```

---

## Infrastructure

- **Secret Manager:** `JWT_SIGNING_SECRET` (GCP project: `spondylatlas`)
- **Service Account:** `287356745658-compute@developer.gserviceaccount.com` hat `secretmanager.secretAccessor`
- **Cloud Run IAM:** `allUsers` hat `roles/run.invoker` (public API)
