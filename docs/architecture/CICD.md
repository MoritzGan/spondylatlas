# CI/CD

SpondylAtlas uses GitHub Actions for all automated deployments.

---

## Workflows

### `deploy.yml` — Firebase Deploy (on push to `main`)

Triggered on every push to `main` and on pull requests targeting `main`.

**On push to `main`:**
1. Install dependencies (`npm ci`)
2. Build the React app (`npm run build`) — injects `VITE_FIREBASE_*` secrets
3. Deploy to Firebase Hosting (production / `live` channel)
4. Deploy Firestore Rules and Indexes (`firestore:rules`, `firestore:indexes`)

**On pull request:**
1. Install + build
2. Deploy a preview channel to Firebase Hosting (temporary URL, linked in PR)

### `paper-search.yml` — Daily Research Agent

Runs daily at **06:00 UTC** and can be triggered manually via `workflow_dispatch`.

1. Checks out the repo
2. Sets up Node 20
3. Installs agent dependencies (`agents/package.json`)
4. Writes the Firebase service account key from `FIREBASE_SERVICE_ACCOUNT_KEY` secret
5. Runs `npx tsx paper-search-agent.ts`

---

## Required GitHub Secrets

| Secret | Used by | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | deploy.yml | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | deploy.yml | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | deploy.yml | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | deploy.yml | Firebase Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | deploy.yml | FCM sender ID |
| `VITE_FIREBASE_APP_ID` | deploy.yml | Firebase App ID |
| `FIREBASE_SERVICE_ACCOUNT` | deploy.yml | Service account JSON for Hosting deploy action |
| `FIREBASE_TOKEN` | deploy.yml | CI token for `firebase deploy` (Firestore rules) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | paper-search.yml | Service account JSON for Admin SDK |
| `ANTHROPIC_API_KEY` | paper-search.yml | Anthropic API key for Claude |

---

## Generating `FIREBASE_TOKEN`

```bash
npx firebase-tools login:ci
```

Copy the printed token and set it as the `FIREBASE_TOKEN` secret in your repository settings.

> Note: Firebase CI tokens are deprecated in favour of service account keys. This will be migrated in a future update.

---

## Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — every push triggers a full deploy |
| Feature branches | Development — open a PR to `main` for a preview deploy |

Direct pushes to `main` are allowed for the maintainer. Contributors should open pull requests.
