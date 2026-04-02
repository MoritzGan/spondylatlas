# Contributing to SpondylAtlas

Thank you for your interest in contributing. SpondylAtlas is an open-source project built for people living with Ankylosing Spondylitis — every contribution, however small, matters.

---

## Language

- **Code, commits, PR descriptions, documentation:** English
- **User-facing strings:** Always via i18next — add to both `src/i18n/locales/de.json` and `src/i18n/locales/en.json`

---

## Getting Started

See [SETUP.md](SETUP.md) for local development setup.

---

## Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Ensure the build passes: `npm run build && npx tsc -b`
5. Open a pull request against `main`

PRs get a Firebase Hosting preview URL automatically.

---

## Code Standards

- TypeScript strict mode — no `any` without justification
- No `console.log` in production code
- Components in `src/components/`, pages in `src/pages/`
- All new user-facing text in both i18n files
- Keep PRs focused — one feature or fix per PR

---

## Areas Where Help is Welcome

- **Translations** — additional languages beyond DE/EN
- **Forum UI** — thread creation, replies, categories
- **Research Hub** — filtering by evidence level, trial detail pages
- **Accessibility** — screen reader support, keyboard navigation
- **Medical accuracy review** — if you have a clinical background
- **Agent improvements** — better prompts, additional data sources

---

## Reporting Issues

Open a GitHub issue with:
- A clear description of the problem
- Steps to reproduce
- Expected vs. actual behaviour
- Browser and OS (for UI issues)

---

## Medical Content

SpondylAtlas surfaces AI-generated summaries of real research. If you notice a factually incorrect summary or a paper that has been miscategorised, please open an issue with the paper title and the specific error. We take medical accuracy seriously.

---

## Code of Conduct

This community exists for people affected by a serious illness and their loved ones. Be kind. Be patient. Assume good intent.
