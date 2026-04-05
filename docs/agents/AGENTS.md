# Agent Reference

All agents live in `/agents/` and share the same `package.json` and Firebase service account.

---

## paper-search-agent.ts

**Schedule:** Daily at 06:00 UTC (GitHub Actions)  
**Runtime:** GitHub Actions  
**Timeout:** 10 minutes  

Searches PubMed and Europe PMC for new AS papers. Deduplicates against existing Firestore records using `pubmedId` and `doi`. Stores each new paper with a Claude-generated German summary.

**Run manually:**
```bash
cd agents && npx tsx paper-search-agent.ts
```

---

## evidence-grader.ts

**Schedule:** Every 6 hours (OpenClaw)  
**Runtime:** OpenClaw isolated session  
**Timeout:** 5 minutes  
**Batch size:** 20 papers per run  

Reads papers without an `evidenceLevel` field and classifies them using the Oxford CEBM scale. Merges new tags into the existing tag array.

**Run manually:**
```bash
cd agents && npx tsx evidence-grader.ts
```

---

## summary-writer.ts

**Schedule:** Every 8 hours (OpenClaw)  
**Runtime:** OpenClaw isolated session  
**Timeout:** 5 minutes  
**Batch size:** 15 papers per run  

Reads graded papers (with `evidenceLevel`) that have no `patientSummary`. Writes 2–3 sentence plain-language summaries in both German and English.

**Run manually:**
```bash
cd agents && npx tsx summary-writer.ts
```

---

## trial-tracker.ts

**Schedule:** Every 24 hours (OpenClaw)  
**Runtime:** OpenClaw isolated session  
**Timeout:** 5 minutes  

Queries the ClinicalTrials.gov v2 API for actively recruiting AS trials. Deduplicates by NCT ID. Stores the full trial record with a German patient summary.

**Run manually:**
```bash
cd agents && npx tsx trial-tracker.ts
```

---

## forum-moderator.ts

**Schedule:** Every 2 hours (OpenClaw)  
**Runtime:** OpenClaw isolated session  
**Timeout:** 3 minutes  
**Batch size:** 30 posts per run  

Reads forum posts with `status: "pending_moderation"`. Asks Claude to evaluate each post and sets status to `published`, `flagged`, or `removed`. Escalates to Telegram only for posts with clear medical misinformation risk.

**Run manually:**
```bash
cd agents && npx tsx forum-moderator.ts
```

---

## hypothesis-generator.ts

**Schedule:** Every 6 hours (GitHub Actions)
**Runtime:** GitHub Actions
**Timeout:** 10 minutes
**Batch size:** 30 papers input, up to 5 hypotheses per run

Reads recent graded papers and generates bilingual (DE/EN) research hypotheses using Claude. Each hypothesis links back to the papers that inspired it.

**Run manually:**
```bash
cd agents && npx tsx hypothesis-generator.ts
```

---

## hypothesis-critic.ts

**Schedule:** Every 6 hours, offset by 30 min (GitHub Actions)
**Runtime:** GitHub Actions
**Timeout:** 10 minutes

Reviews generated hypotheses for scientific soundness. Assigns a verdict (`challenged`, `open`, or `needs_research`) with a bilingual argument and optional follow-up research query.

**Run manually:**
```bash
cd agents && npx tsx hypothesis-critic.ts
```

---

## meta-study-writer.ts

**Schedule:** Every 12 hours (GitHub Actions)
**Runtime:** GitHub Actions
**Timeout:** 10 minutes

Generates structured meta-analysis documents from clusters of related papers. Outputs sections: abstract, introduction, methods, results, discussion, conclusion.

**Run manually:**
```bash
cd agents && npx tsx meta-study-writer.ts
```

---

## meta-study-reviewer.ts

**Schedule:** Twice daily at 06:00 and 18:00 UTC (GitHub Actions)
**Runtime:** GitHub Actions
**Timeout:** 10 minutes
**Max revision rounds:** 3

Reviews generated meta-studies for quality. Assigns a verdict (`approved`, `revision_needed`, or `major_issues`) with strengths and weaknesses. Can trigger iterative revision rounds.

**Run manually:**
```bash
cd agents && npx tsx meta-study-reviewer.ts
```

---

## Local Setup for Agents

```bash
cd agents
cp .env.example .env
# Fill in ANTHROPIC_API_KEY and GOOGLE_APPLICATION_CREDENTIALS
npm ci
```

The `.env` file needs:
```
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
```

For local runs, `GOOGLE_APPLICATION_CREDENTIALS` may point to a short-lived ADC credentials file or, if no better option exists, a local service-account JSON that is kept out of the repository.
