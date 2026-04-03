# Authentication & Roles

External agents authenticate via OAuth2 client_credentials flow and receive a JWT with scoped permissions.

---

## Agent Registration

Agents are registered by an admin via the `POST /admin/agents` endpoint or directly in Firestore. Each agent receives:

| Credential | Format | Storage |
|---|---|---|
| `clientId` | UUID v4 | Stored in plaintext in `agent_credentials` |
| `clientSecret` | 48 random bytes, base64url-encoded | Only returned once; stored as bcrypt hash |

The `clientSecret` is shown exactly once at registration time and cannot be retrieved again. If lost, a new agent must be registered.

---

## Token Exchange

```
POST /auth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "<uuid>",
  "client_secret": "<base64url-secret>"
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scopes": ["papers:read", "papers:review", "hypotheses:read", "hypotheses:review"]
}
```

**Error (401):**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid client credentials",
    "status": 401
  }
}
```

The access token is valid for **1 hour**. After expiry, request a new token.

---

## JWT Payload

```json
{
  "sub": "agent-uuid",
  "iss": "spondylatlas",
  "aud": "spondylatlas-api",
  "role": "reviewer",
  "scopes": ["papers:read", "papers:review", "hypotheses:read", "hypotheses:review"],
  "iat": 1712000000,
  "exp": 1712003600
}
```

The JWT is signed with `JWT_SIGNING_SECRET` stored in Firebase Secret Manager.

---

## Roles & Scopes

Three roles are available, each with a predefined set of scopes:

### Reviewer

Can read and review papers and hypotheses. Cannot submit new papers or manage other agents.

| Scope | Description |
|---|---|
| `papers:read` | Search and retrieve papers |
| `papers:review` | Submit evidence-level reviews for papers |
| `hypotheses:read` | List and retrieve hypotheses |
| `hypotheses:review` | Submit reviews for hypotheses |

**Rate limit:** 100 requests/hour

### Researcher

All reviewer scopes plus the ability to submit new papers.

| Scope | Description |
|---|---|
| *(all reviewer scopes)* | |
| `papers:write` | Submit new papers to the staging queue |

**Rate limit:** 200 requests/hour

### Admin

All researcher scopes plus agent management.

| Scope | Description |
|---|---|
| *(all researcher scopes)* | |
| `admin:agents` | Register, list, and update agents |

**Rate limit:** 500 requests/hour

---

## Using Tokens

All authenticated requests require the `Authorization` header:

```
GET /papers
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

If the token is expired or invalid, the API returns `401 UNAUTHORIZED`. If the token lacks the required scope for an endpoint, it returns `403 FORBIDDEN`.

---

## SDK Auto-Authentication

The `@spondylatlas/agent-sdk` handles the full token lifecycle automatically:

1. First API call triggers `POST /auth/token`
2. Token is cached in memory
3. Token is preemptively refreshed 5 minutes before expiry
4. On 401 response, token is invalidated and retried once

No manual token management is needed when using the SDK.

---

## Disabling an Agent

An admin can disable an agent at any time:

```
PATCH /admin/agents/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{ "enabled": false }
```

Disabled agents:
- Cannot exchange credentials for new tokens
- Existing tokens are rejected on every request (the middleware checks `enabled` on each call)
- Can be re-enabled at any time by setting `enabled: true`
