# Meta-Studien Pipeline — Architektur

## Übersicht

Automatische Erstellung von Meta-Studien/Systematic Reviews basierend auf vielversprechenden Hypothesen. Iterativer Prozess: **Schreiben → Reviewen → Korrigieren** nach akademischen Standards (PRISMA-Richtlinien).

## Flow

```
Hypothese (status: "open", ≥3 Papers)
  → Meta-Study Writer Agent erstellt Draft
    → Academic Reviewer Agent prüft
      → Writer überarbeitet (max 3 Runden)
        → Status: "published" oder "needs_human"
```

## Firestore Collection: `meta_studies`

```typescript
interface MetaStudy {
  id: string
  hypothesisId: string           // Referenz zur Ursprungs-Hypothese
  title: string                  // Akademischer Titel
  status: "draft" | "in_review" | "revision" | "published" | "needs_human"
  currentRound: number           // 1-3
  maxRounds: 3

  // Akademische Struktur (PRISMA-angelehnt)
  sections: {
    abstract: string             // Strukturiertes Abstract
    introduction: string         // Hintergrund, Forschungsfrage, Relevanz
    methods: string              // Suchstrategie, Ein-/Ausschlusskriterien
    results: string              // Zusammenfassung der Evidenz
    discussion: string           // Interpretation, Limitationen
    conclusion: string           // Kernaussagen, Forschungsbedarf
  }

  references: Reference[]
  paperIds: string[]
  searchStrategy: string
  inclusionCriteria: string[]
  exclusionCriteria: string[]
  reviews: ReviewRound[]

  createdAt: Timestamp
  updatedAt: Timestamp
  publishedAt: Timestamp | null
  generatedBy: "meta-study-writer"
  wordCount: number
  language: "de"
}

interface ReviewRound {
  round: number
  reviewedAt: Timestamp
  verdict: "revision_needed" | "approved" | "major_issues"
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  methodologyCritique: string
  statisticalCritique: string
  citationCheck: string
}
```

## Agents

### 1. Meta-Study Writer (alle 12h)
- Model: claude-opus-4-5
- Input: Offene Hypothesen mit ≥3 Papers, keine existierende Meta-Studie
- Oder: Revision-Drafts überarbeiten
- Output: PRISMA-konformer Draft (~3000-5000 Wörter)
- Akademische Anforderungen: Strukturiertes Abstract, PICO-Kriterien, Vancouver-Zitierung, Evidenzgrad nach Oxford CEBM, Limitationen, kein "proves" sondern "suggests"

### 2. Academic Reviewer (alle 12h, +6h versetzt)
- Model: claude-opus-4-5
- Review-Kriterien: Methodologie, Statistik, Zitationen, Logik, Sprache, Vollständigkeit
- Max 3 Runden, danach needs_human

## API Endpoints
- GET /public/meta-studies (Liste)
- GET /public/meta-studies/:id (Detail)

## Frontend
- /meta-studien (Übersicht)
- /meta-studien/:id (Volltext + Review-Historie + Disclaimer)
- Navbar: "Meta-Studien" zwischen Research und Hypothesen

## Implementierungsreihenfolge
1. Firestore Collection + Rules + Indexes
2. API Endpoints (public read)
3. Meta-Study Writer Agent
4. Academic Reviewer Agent
5. Frontend (Liste + Detail)
6. Navbar + i18n
7. GitHub Actions Workflows
