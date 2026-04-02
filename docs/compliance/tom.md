# Technical and Organisational Measures

Version: `2026-04-02`

## Technical
- HTTPS-only deployment
- HSTS enabled at reverse proxy / CDN layer before production
- CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`
- Protected routes for forum and profile
- Search-engine blocking for community, login, and registration pages
- Email verification before community access
- Explicit documented health-data consent before community entry
- Minimal client-side storage: language preference plus auth/session artefacts
- Logged compliance actions for registration, consent, withdrawal, and rights requests

## Organisational
- Adult-only community policy
- Plain-language legal documents in German and English
- Notice-and-action workflow for reported content
- Moderation decisions documented with timestamp and actor
- Manual fulfilment path for export and deletion requests
- Placeholder operator and DPO details must be completed before launch

## Open items before production
- MFA for admin/moderator accounts
- Rate limiting and abuse protection at edge/backend layer
- Encrypted EU-only backups
- Formal deletion automation
