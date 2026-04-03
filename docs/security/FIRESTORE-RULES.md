# Firestore Security Rules

Rules are defined in `/firestore.rules` and should be treated as the source of truth for browser access.

---

## Design Principles

1. **Default deny** — the catch-all rule at the bottom blocks everything not explicitly allowed.
2. **Agents bypass rules** — internal agents use the Firebase Admin SDK and therefore bypass Firestore Rules.
3. **Community access is policy-backed** — forum reads and writes require authentication, verified email, and an active health-data consent.
4. **Trusted writes moved server-side** — browser clients no longer write directly to `content_reports`, `forum_comments`, or `hypothesis_comments`.
5. **Operational collections are private** — `agent_events`, `agent_runs`, `research_tasks`, and `hypotheses` are not directly browser-readable.

---

## Browser-Facing Collections

### `/users/{userId}`
```text
read:   own document or admin
create: own document only, with tightly constrained fields
update: own profile fields only (`displayName`, `lang`, `updatedAt`) or admin
delete: admin only
```

Security-sensitive fields such as `role`, `email`, `ageConfirmed`, and `legalVersion` are immutable for self-updates.

### `/forum_posts/{postId}`
```text
read:   community members only
create: community members only
update: owner may edit title/content only; moderators may moderate
delete: owner or admin
```

Community member means:
- signed in
- `request.auth.token.email_verified == true`
- active `health_data_consents/{uid}.granted == true`

### `/forum_comments/{commentId}`
```text
read:   community members only, and only when the parent post is readable
write:  denied from browser clients
```

Comment creation now goes through the trusted `/api/community/forum/comments` backend path.

### `/content_reports/{reportId}`
```text
read:   moderators, or the original signed-in reporter
write:  denied from browser clients
```

Content reports are created via the trusted `/api/public/reports` endpoint.

### `/health_data_consents/{userId}`
```text
read:   own document or admin
write:  own document only, constrained to valid consent fields
delete: denied
```

### `/hypotheses/{hypoId}` and `/hypothesis_comments/{commentId}`
```text
read:   denied from browser clients
write:  denied from browser clients (except admin writes to `/hypotheses`)
```

Public hypothesis reads now flow through `/api/public/hypotheses`, and user comments through `/api/community/hypotheses/:id/comments`.

---

## Operational Collections

### `/agent_events/{eventId}`, `/agent_runs/{runId}`, `/research_tasks/{taskId}`
```text
read:  denied from browser clients
write: admin only (agents use Admin SDK)
```

If a public transparency view is needed, it must be published through a filtered backend response instead of raw collection access.
