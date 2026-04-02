# SpondylAtlas 🧭

**Die offene Forschungs- und Community-Plattform für Morbus Bechterew (axiale Spondyloarthritis)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red)](https://github.com/MoritzGan/spondylatlas)
[![Language](https://img.shields.io/badge/Sprache-DE%20%7C%20EN-green)]()

---

## 🎯 Was ist SpondylAtlas?

SpondylAtlas ist eine offene, community-getriebene Plattform, die Betroffenen, Angehörigen und Forschern einen strukturierten Zugang zur aktuellen wissenschaftlichen Literatur über **Morbus Bechterew** (auch: axiale Spondyloarthritis / axSpA) bietet — kombiniert mit einem Forum für den direkten Austausch.

**Dieses Projekt ersetzt keine medizinische Beratung.** Es ist ein Werkzeug zur Orientierung und Vernetzung — ein Atlas in einer komplexen Landschaft.

---

## 💡 Warum SpondylAtlas?

Morbus Bechterew ist eine chronisch-entzündliche Erkrankung der Wirbelsäule, die weltweit Millionen Menschen betrifft. Die Forschung schreitet stetig voran — doch aktuelle Studienergebnisse sind für Betroffene oft schwer zugänglich:

- Verstreut über dutzende Fachzeitschriften
- Hinter Paywalls versteckt
- In medizinischem Fachjargon verfasst
- Ohne Kontext oder Einordnung

SpondylAtlas löst dieses Problem durch **automatisierte Forschungsagenten**, die kontinuierlich neue Paper suchen, zusammenfassen und verständlich aufbereiten — kombiniert mit einem **mehrsprachigen Forum** für den Austausch unter Gleichgesinnten.

---

## ✨ Funktionen

### 📚 Research Hub
- Automatisch kuratierte Sammlung aktueller wissenschaftlicher Paper
- KI-generierte Zusammenfassungen der wichtigsten Erkenntnisse
- Filterung nach Tags, Datum, Themengebiet
- Direkte Links zu Original-Quellen (PubMed, Europe PMC, Semantic Scholar)
- Vollständig durchsuchbar

### 💬 Community Forum
- Mehrsprachig (Deutsch & Englisch)
- Kategorien: Diagnose, Therapie, Alltag, Forschung, Fragen & Antworten
- Benutzerprofile mit Sprach- und Benachrichtigungseinstellungen
- Automatische KI-Moderation für respektvollen Umgang
- Upvote-System für hilfreiche Beiträge

### 🤖 Automatisierte Forschungsagenten (Hintergrund)
- **Search-Agent**: Durchsucht täglich PubMed, Europe PMC und Semantic Scholar nach neuen Bechterew-relevanten Studien
- **Summary-Agent**: Erstellt verständliche Zusammenfassungen mit den wichtigsten Erkenntnissen (via Anthropic Claude)
- **Dedup-Agent**: Verhindert doppelte Einträge durch intelligenten Abgleich
- **Moderation-Agent**: Überprüft Forum-Beiträge auf Regelkonformität

### 🌐 Mehrsprachigkeit
- Vollständig auf Deutsch und Englisch verfügbar
- Automatische Spracherkennung per Browser-Einstellung
- Manueller Sprachwechsel jederzeit möglich

---

## 🏗️ Technische Architektur

### Frontend
```
React 19 + Vite + TypeScript
Tailwind CSS v4
React Router v7
i18next (DE/EN)
```

### Backend & Datenbank
```
Firebase Authentication  →  Nutzer-Login (Email + Google OAuth)
Firebase Firestore       →  Datenbank (NoSQL, Echtzeit)
Firebase Hosting         →  Deployment
Firebase Storage         →  Datei-Uploads (optional)
```

### Firestore Datenmodell

```
/papers/{paperId}
  ├── title: string
  ├── abstract: string
  ├── summary: string          # KI-generierte Zusammenfassung
  ├── authors: string[]
  ├── publishedAt: timestamp
  ├── tags: string[]
  ├── url: string              # Link zum Original
  ├── source: string           # "pubmed" | "europepmc" | "semanticscholar"
  └── lang: "de" | "en"

/forum_threads/{threadId}
  ├── title: string
  ├── body: string
  ├── authorId: string
  ├── category: string
  ├── lang: "de" | "en"
  ├── createdAt: timestamp
  └── updatedAt: timestamp

/forum_posts/{postId}
  ├── threadId: string
  ├── body: string
  ├── authorId: string
  ├── createdAt: timestamp
  └── moderation_status: "approved" | "pending" | "rejected"

/users/{userId}
  ├── displayName: string
  ├── lang: "de" | "en"
  ├── role: "user" | "moderator" | "admin"
  └── createdAt: timestamp
```

### Seiten & Routing

| Route | Beschreibung |
|---|---|
| `/` | Landing Page — Mission, Features, Einstieg |
| `/forum` | Forum-Übersicht mit Kategorien |
| `/forum/:threadId` | Einzelner Thread mit Antworten |
| `/research` | Research Hub — Paper-Liste mit Suche & Filter |
| `/research/:paperId` | Paper-Detailseite mit vollständiger Zusammenfassung |
| `/login` | Anmeldung (Email oder Google) |
| `/register` | Registrierung |
| `/profile` | Nutzerprofil (geschützt) |

### Agenten-Pipeline

```
┌─────────────────────────────────────────────────────┐
│                  Täglicher Cron-Job                  │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────▼────────┐
              │  Search-Agent   │
              │  PubMed API     │
              │  Europe PMC     │
              │  Semantic Scholar│
              └────────┬────────┘
                       │ Neue Paper
              ┌────────▼────────┐
              │  Dedup-Agent    │
              │  Abgleich mit   │
              │  Firestore      │
              └────────┬────────┘
                       │ Unbekannte Paper
              ┌────────▼────────┐
              │  Summary-Agent  │
              │  Anthropic API  │
              │  → Zusammen-    │
              │    fassung (DE) │
              └────────┬────────┘
                       │
              ┌────────▼────────┐
              │   Firestore     │
              │  papers/{id}    │
              └─────────────────┘
```

---

## 🚀 Lokale Entwicklung

### Voraussetzungen
- Node.js 20+
- npm oder pnpm
- Firebase CLI (`npm install -g firebase-tools`)
- Ein Firebase-Projekt ([console.firebase.google.com](https://console.firebase.google.com))

### Setup

```bash
# Repository klonen
git clone https://github.com/MoritzGan/spondylatlas.git
cd spondylatlas

# Dependencies installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env mit eigenen Firebase-Werten befüllen

# Entwicklungsserver starten
npm run dev
```

### Umgebungsvariablen (`.env`)

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Verfügbare Befehle

```bash
npm run dev        # Entwicklungsserver (localhost:5173)
npm run build      # Produktions-Build
npm run preview    # Build lokal vorschauen
npm run lint       # ESLint
npm run typecheck  # TypeScript-Prüfung
```

---

## 🤝 Mitmachen

SpondylAtlas ist ein Community-Projekt und lebt von Beiträgen. Ob Code, Übersetzungen, Design oder Dokumentation — jede Hilfe ist willkommen.

**Bitte lies [`CONTRIBUTING.md`](CONTRIBUTING.md) bevor du einen Pull Request öffnest.**

### Schnellstart für Contributor

1. Fork erstellen
2. Feature-Branch anlegen: `git checkout -b feature/mein-feature`
3. Änderungen committen: `git commit -m 'feat: mein feature'`
4. Branch pushen: `git push origin feature/mein-feature`
5. Pull Request öffnen

---

## 🗺️ Roadmap

- [x] Projektstruktur & Tech-Stack
- [ ] Firebase Auth (Email + Google)
- [ ] Forum-Grundstruktur
- [ ] Research Hub UI
- [ ] PubMed Search-Agent
- [ ] KI-Zusammenfassungen (Anthropic)
- [ ] Forum-Moderation-Agent
- [ ] Mobile Optimierung
- [ ] E-Mail-Benachrichtigungen
- [ ] Erweiterte Paper-Suche & Filter
- [ ] Benutzerabonnements für Themengebiete
- [ ] API für externe Entwickler

---

## ⚠️ Medizinischer Hinweis

SpondylAtlas ist **kein medizinisches Produkt** und ersetzt keine ärztliche Beratung oder Behandlung. Die Plattform dient ausschließlich der Information und dem Austausch. Bei gesundheitlichen Fragen wende dich immer an qualifiziertes medizinisches Fachpersonal.

---

## 📄 Lizenz

MIT License — siehe [`LICENSE`](LICENSE)

---

## 💙 Hintergrund

Dieses Projekt entstand aus dem Wunsch, einem guten Freund und allen anderen Betroffenen zu helfen, die täglich mit Morbus Bechterew leben. Es ist nicht kommerziell, nicht akademisch — es ist persönlich.

---

*Made with ❤️ for the Bechterew community*

---

## English Summary

**SpondylAtlas** is an open-source research and community platform for people affected by Ankylosing Spondylitis (axSpA / Morbus Bechterew). It combines an automatically curated research hub (powered by AI agents scanning PubMed, Europe PMC, and Semantic Scholar daily) with a multilingual community forum. Built with React, Vite, TypeScript, Tailwind CSS, and Firebase. Available in German and English.

> This project does not provide medical advice. Always consult a qualified healthcare professional.
