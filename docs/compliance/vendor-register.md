# Vendor and Subprocessor Register

Version: `2026-04-02`

## Current technical footprint in this repo
- Firebase client SDK
  - Role: authentication and Firestore access
  - Status: present in codebase, requires replacement or formal transfer assessment for EU-only target architecture
- Firebase Admin in agent scripts
  - Role: background data ingestion and writes
  - Status: present in `agents/`, not suitable as final proof of EU-only self-hosting

## Planned target state
- EU-hosted application server
- EU-hosted relational or document database
- EU-hosted mail provider for verification and legal contact
- EU-only backup provider

## Required documentation before production
- Signed processor contracts
- Security review and TOM alignment
- Transfer assessment where any third-country exposure remains
