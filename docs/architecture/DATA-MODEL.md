# Firestore Data Model

All collections are in the `europe-west` Firestore region.

---

## `/papers/{paperId}`

Research papers collected by the paper-search agent.

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Paper title |
| `abstract` | `string` | Full abstract |
| `summary` | `string` | AI-generated German summary (legacy, see patientSummary) |
| `authors` | `string[]` | Author names |
| `publishedAt` | `Timestamp` | Publication date |
| `tags` | `string[]` | Keywords / MeSH terms, extended by grader |
| `url` | `string` | Link to original paper |
| `source` | `"pubmed" \| "europepmc"` | Data source |
| `pubmedId` | `string?` | PubMed ID |
| `doi` | `string?` | DOI |
| `lang` | `"de"` | Language of summary |
| `status` | `"published"` | Publication status |
| `createdAt` | `Timestamp` | When the agent added the paper |
| `evidenceLevel` | `"1a"\|"1b"\|"2a"\|"2b"\|"3"\|"4"\|"5"` | Oxford CEBM level (added by grader) |
| `studyType` | `string` | e.g. "RCT", "Cohort Study" (added by grader) |
| `evidenceConfidence` | `"high"\|"medium"\|"low"` | Grader confidence |
| `evidenceRationale` | `string` | Short reasoning in German |
| `gradedAt` | `Timestamp` | When evidence-grader processed this paper |
| `patientSummary` | `{ de: string, en: string }` | Patient-friendly summary (added by summary-writer) |
| `summarizedAt` | `Timestamp` | When summary-writer processed this paper |

---

## `/trials/{nctId}`

Clinical trials from ClinicalTrials.gov, keyed by NCT ID.

| Field | Type | Description |
|---|---|---|
| `nctId` | `string` | ClinicalTrials.gov identifier (document ID) |
| `title` | `string` | Study title |
| `status` | `string` | e.g. "RECRUITING" |
| `phase` | `string` | e.g. "PHASE3" |
| `conditions` | `string[]` | Always includes "Ankylosing Spondylitis" |
| `interventions` | `string[]` | Drugs, devices, or procedures being studied |
| `locations` | `string[]` | Up to 5 study sites |
| `enrollmentCount` | `number?` | Target enrollment |
| `startDate` | `string?` | Trial start date |
| `completionDate` | `string?` | Expected completion date |
| `url` | `string` | Link to ClinicalTrials.gov |
| `summaryDe` | `string` | German patient summary (AI-generated) |
| `fetchedAt` | `Timestamp` | When the trial-tracker added this record |

---

## `/users/{userId}`

User profiles. Document ID equals Firebase Auth UID.

| Field | Type | Description |
|---|---|---|
| `displayName` | `string` | User's display name |
| `email` | `string` | Email address |
| `role` | `"user"\|"moderator"\|"admin"` | Access level |
| `lang` | `"de"\|"en"` | Preferred language |
| `createdAt` | `Timestamp` | Account creation date |

---

## `/forum_posts/{postId}`

Forum threads.

| Field | Type | Description |
|---|---|---|
| `title` | `string` | Thread title (max 300 chars) |
| `content` | `string` | Post body (max 10,000 chars) |
| `authorId` | `string` | Firebase Auth UID |
| `authorName` | `string` | Display name at time of posting |
| `category` | `string` | One of: general, symptoms, treatment, exercise, mental_health, research_discussion |
| `status` | `"pending_moderation"\|"published"\|"flagged"\|"removed"` | Moderation state |
| `createdAt` | `Timestamp` | Post creation time |
| `moderatedAt` | `Timestamp?` | When forum-moderator processed this post |
| `moderationDecision` | `"approve"\|"flag"\|"remove"?` | Moderator decision |
| `moderationReason` | `string?` | Reasoning |
| `flagCategory` | `"misinformation"\|"spam"\|"offtopic"\|"harmful"\|"duplicate"?` | Flag type |

---

## `/forum_comments/{commentId}`

Replies to forum posts.

| Field | Type | Description |
|---|---|---|
| `postId` | `string` | Parent post document ID |
| `content` | `string` | Comment body (max 3,000 chars) |
| `authorId` | `string` | Firebase Auth UID |
| `authorName` | `string` | Display name |
| `createdAt` | `Timestamp` | Comment creation time |

---

## `/content_reports/{reportId}`

User-submitted content reports. Browser creation happens through the trusted backend path, not via direct Firestore writes.

| Field | Type | Description |
|---|---|---|
| `reporterUserId` | `string?` | UID of reporting user when authenticated |
| `reporterEmail` | `string?` | Optional contact email |
| `targetType` | `"forum_post"\|"forum_reply"\|"profile"\|"other"` | What was reported |
| `targetId` | `string?` | Normalized document/content identifier when derivable |
| `reason` | `string` | Structured report reason |
| `details` | `string` | Free-text description |
| `processingStatus` | `"pending_review"\|"closed"\|"needs_human_review"` | Moderation workflow state |
| `createdAt` | `Timestamp` | Submission time |

---

## External Agent Collections

The following collections support the external agent SDK. See [Agent SDK Data Model](../agent-sdk/DATA-MODEL.md) for the full schema.

- **`/agent_credentials/{agentId}`** — Registered external agent identities (Admin SDK only)
- **`/agent_submissions/{submissionId}`** — Papers submitted by external agents (staging queue)
- **`/agent_reviews/{reviewId}`** — Supplementary reviews by external agents
