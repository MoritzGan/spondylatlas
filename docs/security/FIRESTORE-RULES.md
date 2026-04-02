# Firestore Security Rules

Rules are defined in `/firestore.rules` and deployed automatically on every push to `main`.

---

## Design Principles

1. **Default deny** — a catch-all rule at the bottom blocks everything not explicitly allowed.
2. **Agents bypass rules** — AI agents use the Firebase Admin SDK with a service account, which bypasses all client-side rules. Rule enforcement applies to browser clients only.
3. **Roles are stored in Firestore** — the `users/{uid}.role` field controls moderator and admin access. Role checks require a Firestore read on each request (handled by Firebase's rule evaluation).

---

## Helper Functions

```javascript
isSignedIn()       // request.auth != null
isOwner(userId)    // signed in AND uid matches
isAdmin()          // role == "admin"
isModerator()      // role in ["admin", "moderator"]
notChanging(field) // field not in request or value unchanged
```

---

## Rules by Collection

### `/papers` and `/trials`
```
read:  anyone (public, no auth required)
write: admin only (via browser client)
       agents: unrestricted via Admin SDK
```
Research content is intentionally public. The platform's goal is accessibility.

### `/users/{userId}`
```
read:  any signed-in user
create: own document only
update: own document OR admin
delete: admin only
```

### `/forum_posts/{postId}`
```
read:   published posts → anyone
        own draft/flagged posts → owner
        all posts → moderators and admins
create: signed-in users only
        authorId must equal request.auth.uid
        status must be "pending_moderation" (not self-published)
        title ≤ 300 chars, content ≤ 10,000 chars
update: owner can edit content/title (status unchanged)
        moderators can change status
delete: owner or admin
```

### `/forum_comments/{commentId}`
```
read:   anyone
create: signed-in, authorId must match uid, content ≤ 3,000 chars
update: owner only, cannot change authorId or postId
delete: owner or admin
```

### `/reports/{reportId}`
```
read:   moderators and admins only
create: signed-in users, reporterId must match uid
update/delete: admin only
```

---

## Deploying Rules

Rules are deployed automatically by CI. To deploy manually:

```bash
npx firebase-tools deploy --only firestore:rules
```

To test rules locally:
```bash
npx firebase-tools emulators:start --only firestore
```
