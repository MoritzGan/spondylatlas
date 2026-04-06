# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| main    | Yes       |
| staging | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in SpondylAtlas, please report it responsibly.

**Contact:** info@zechware.de

**Please include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Response time:** We aim to acknowledge reports within 48 hours and provide a fix timeline within 7 days.

**Scope:**
- Web application (spondylatlas.web.app)
- Firebase Functions API
- Firestore security rules
- Agent pipeline and SDK

**Out of scope:**
- Social engineering attacks
- Denial of service (DoS/DDoS)
- Issues in third-party dependencies (report upstream)
- Vulnerabilities requiring physical access

## Disclosure

We follow coordinated disclosure. Please do not publish vulnerabilities before we have released a fix. We credit reporters in our release notes unless anonymity is requested.

## Security Updates

Security patches are released as soon as possible and deployed automatically via CI/CD. Watch the repository for release notifications.
