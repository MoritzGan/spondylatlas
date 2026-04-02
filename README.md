# SpondylAtlas

Private research and community platform for people affected by Ankylosing Spondylitis / Morbus Bechterew.

## Current stack

- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- Firebase Auth + Firestore

## Compliance-oriented changes in this branch

- public research area remains accessible
- forum and profile are protected routes
- email verification is required before community access
- explicit health-data consent is required before entering the community
- Google sign-in has been removed
- language persistence uses a first-party cookie instead of `localStorage`
- legal pages were added:
  - `/impressum`
  - `/datenschutz`
  - `/nutzungsbedingungen`
  - `/community-regeln`
  - `/cookies-und-speicherungen`
  - `/meldung`
  - `/kontakt-datenschutz`
- robots and hosting headers now block indexing of community and auth routes
- governance docs were added under [docs/compliance](docs/compliance/README.md)

## Important limitation

The repo now reflects a privacy-first frontend and compliance structure, but it still contains Firebase-based infrastructure. A fully EU-only self-hosted server/session architecture is not completed in this repository yet and must be implemented separately before production if that is the target operating model.

## Local development

```bash
npm install
npm run build
npm run dev
```

## Environment

Create `.env` with the Firebase client values used by the frontend:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## Compliance documents

See:

- [docs/compliance/ropa.md](docs/compliance/ropa.md)
- [docs/compliance/tom.md](docs/compliance/tom.md)
- [docs/compliance/vendor-register.md](docs/compliance/vendor-register.md)
- [docs/compliance/retention-matrix.md](docs/compliance/retention-matrix.md)
- [docs/compliance/incident-runbook.md](docs/compliance/incident-runbook.md)
- [docs/compliance/dpia-checklist.md](docs/compliance/dpia-checklist.md)
- [docs/compliance/dpo-assessment.md](docs/compliance/dpo-assessment.md)
