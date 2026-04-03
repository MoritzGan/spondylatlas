# SpondylAtlas Security Audit Report

Date: 2026-04-03

## Executive Summary

The dominant security risk is a critical authorization flaw in Firestore: any authenticated user can update their own `/users/{uid}` document, while moderator/admin checks trust the mutable `role` field in that same document. In practice, this allows self-service privilege escalation to `admin`, which then unlocks broad read/write/delete access across the platform.

The second major theme is control drift between policy, UI, and enforcement. The codebase and compliance docs state that the community is protected by email verification and explicit health-data consent, but the actual routes and Firestore rules only require authentication. Users can still access and use community features after skipping verification or withdrawing consent.

The third major theme is the admin-capable agent layer. Agents run with the Firebase Admin SDK, bypass Firestore rules by design, and accept user-controlled or third-party content directly into LLM prompts without deterministic validation or human approval gates. This is most acute in the moderation agent, where attacker-controlled forum content can influence privileged publish/reject decisions.

## Fix First

1. Move role enforcement off the mutable `/users/{uid}.role` field. At minimum, make `role` immutable for self-updates; ideally move elevated roles to Firebase custom claims or a separate admin-only record.
2. Enforce community entry requirements in the actual trust boundary. Verified email and health-data consent must be checked in Firestore rules for forum reads/writes, not only described in UI or legal copy.
3. Put guardrails around the admin agent pipeline. Add schema validation and allowlists for LLM outputs, reduce public visibility of operational collections, and add human review or deterministic fallbacks for moderation actions.

## Code-Backed Vulnerabilities

### SA-001
- Rule ID: `SA-001`
- Severity: `Critical`
- Type: `Code-backed vulnerability`
- Location: `firestore.rules:17-27`, `firestore.rules:34-38`, `src/lib/compliance.ts:25-34`
- Evidence:
  - `isAdmin()` and `isModerator()` trust `get(.../users/$(request.auth.uid)).data.role`.
  - `/users/{userId}` allows `update` if `isOwner(userId) || isAdmin()`.
  - Client registration seeds `role: 'user'` into the same document from the browser.
- Exploit path:
  - Register or sign in as a normal user.
  - Update `/users/{yourUid}` and set `role` to `admin` or `moderator`.
  - Subsequent Firestore rule checks now treat the attacker as privileged.
- Impact:
  - Full browser-side privilege escalation to admin.
  - Admin-only writes become available for `/papers`, `/trials`, `/hypotheses`, `/research_tasks`, `/agent_events`, `/agent_runs`, `/legal_document_versions`, and privileged moderation paths.
  - Admin-only reads/deletes over user and compliance data become reachable.
- Confidence: `High`
- Recommended remediation:
  - Remove self-service writes to the `role` field immediately.
  - Prefer Firebase custom claims or a separate admin-controlled authorization record.
  - Add field immutability checks for `role`, `email`, and other security-relevant fields in `/users/{uid}`.
- Mitigation if immediate fix is hard:
  - Freeze privileged actions behind a temporary server-side/admin-only path and alert on all `/users/{uid}` role changes.
- False positive notes:
  - None. The privilege chain is directly visible in the rules.

### SA-002
- Rule ID: `SA-002`
- Severity: `High`
- Type: `Code-backed vulnerability`
- Location: `src/components/ProtectedRoute.tsx:6-12`, `src/components/ProtectedRoute.tsx:29-51`, `src/App.tsx:35-45`, `src/App.tsx:58-64`, `firestore.rules:107-137`, `src/pages/Profile.tsx:118-149`, `src/lib/legal.ts:115-126`, `src/lib/legal.ts:210-212`
- Evidence:
  - `ProtectedRoute` supports `requireVerifiedEmail`, but the forum and profile routes do not pass it.
  - Firestore forum rules only require `isSignedIn()`.
  - Legal copy states the community is available only after email verification and explicit consent.
  - Profile copy states community access is blocked without active health-data consent.
- Exploit path:
  - Register a new account and never verify the email.
  - Or withdraw health-data consent from the profile.
  - Continue reading, posting, and commenting anywhere allowed by the forum rules because only authentication is enforced.
- Impact:
  - The effective access model is materially weaker than the platform’s stated privacy and community controls.
  - This undermines the consent posture for special-category health data and weakens abuse resistance for throwaway accounts.
- Confidence: `High`
- Recommended remediation:
  - Enforce verified-email and consent state in Firestore rules for community reads and writes.
  - Apply `requireVerifiedEmail` where the UI intends community gating, but treat that only as UX.
  - Add a real consent-grant flow before first community use.
- Mitigation if immediate fix is hard:
  - Disable community write paths for unverified users at minimum while the rules are corrected.
- False positive notes:
  - None on the access-control drift. Whether this is also a regulatory issue depends on the final operating model.

### SA-003
- Rule ID: `SA-003`
- Severity: `High`
- Type: `Code-backed vulnerability`
- Location: `agents/forum-moderator.ts:49-85`, `agents/forum-moderator.ts:89-123`, `agents/forum-moderator.ts:159-179`, `docs/architecture/OVERVIEW.md:68-76`
- Evidence:
  - The moderation prompt interpolates attacker-controlled `title` and `content` directly into the LLM request.
  - The returned JSON is trusted to set `status`, `moderationReason`, and `moderationDecision`.
  - Architecture docs explicitly state agents use the Firebase Admin SDK and bypass Firestore rules.
- Exploit path:
  - Submit forum content crafted to steer the model toward `approve`, `escalate`, or misleading rationale output.
  - The agent executes the resulting decision with admin privileges.
- Impact:
  - Untrusted user content can influence privileged moderation outcomes.
  - Harmful content may be auto-published or reports may be mishandled without a deterministic safety layer or human checkpoint.
- Confidence: `Medium-High`
- Recommended remediation:
  - Treat forum content as adversarial prompt input.
  - Add strict schema validation, bounded allowlists for decisions, and a human-review path for borderline or high-risk cases.
  - Prefer deterministic rules for obvious abuse classes before invoking the model.
- Mitigation if immediate fix is hard:
  - Force non-approve outcomes to human review until the moderation path is hardened.
- False positive notes:
  - The exact success rate of prompt injection is model-dependent, but the privileged trust boundary is real.

### SA-004
- Rule ID: `SA-004`
- Severity: `Medium`
- Type: `Code-backed vulnerability`
- Location: `src/lib/forum.ts:77-96`, `firestore.rules:119-137`, `src/pages/ForumThread.tsx:29-49`
- Evidence:
  - Comment creation is a standalone `addDoc()` call.
  - The follow-up post counter update is a separate `updateDoc()` against `/forum_posts/{postId}`.
  - Forum post updates are allowed only for the owner or a moderator/admin, not for an arbitrary commenter.
- Exploit path:
  - A normal signed-in user submits a reply.
  - The comment write succeeds, then the post counter update fails.
  - The UI surfaces an error, but the comment may already exist, leaving partial state.
- Impact:
  - Non-atomic writes create integrity drift between comments and counters.
  - This also increases ambiguity for moderation and incident review because the client reports failure while data may already be persisted.
- Confidence: `High`
- Recommended remediation:
  - Replace the two-step client flow with a server-side/admin function or a transactionally safe design.
  - Do not let commenters update post metadata directly from the client.
- Mitigation if immediate fix is hard:
  - Remove client-side counter updates and derive reply counts server-side or by query until a trusted write path exists.
- False positive notes:
  - The exact partial-write outcome depends on client retry behavior, but the authorization mismatch is definite.

### SA-005
- Rule ID: `SA-005`
- Severity: `Medium`
- Type: `Code-backed vulnerability`
- Location: `firestore.rules:128-132`, `src/lib/forum.ts:77-90`, `src/pages/ForumThread.tsx:21-25`
- Evidence:
  - `/forum_comments/{commentId}` creation checks only `isSignedIn()`, `authorId`, and `content.size()`.
  - The rule does not validate the target `postId`, the post’s visibility state, or even that the post exists.
  - The client fetches comments by arbitrary `postId`.
- Exploit path:
  - A signed-in user can write comments tied to hidden, rejected, or nonexistent post IDs.
  - If a user learns or guesses a post ID, comment queries are not constrained by the target post’s moderation state.
- Impact:
  - Comment activity is not actually bound to the intended post visibility model.
  - Hidden discussion threads can accumulate unauthorized comments or leak partial state.
- Confidence: `Medium`
- Recommended remediation:
  - In rules, validate that the target post exists and is commentable by the current user.
  - Consider moving comment creation behind a trusted server/admin path if moderation-state joins become too complex for rules alone.
- Mitigation if immediate fix is hard:
  - Deny comment creation unless the post’s status is `published` and readable by the requester.
- False positive notes:
  - Post IDs are not easily enumerable, so exploitation depends on disclosure or observation of an ID.

### SA-006
- Rule ID: `SA-006`
- Severity: `Medium`
- Type: `Code-backed vulnerability`
- Location: `src/pages/ReportContent.tsx:41-49`, `src/lib/compliance.ts:148-157`, `firestore.rules:82-95`, `agents/forum-moderator.ts:129-180`, `firestore.rules:139-143`
- Evidence:
  - The public reporting page submits to `content_reports`.
  - The moderator agent only processes the separate `reports` collection.
  - Firestore rules define both collections independently.
- Exploit path:
  - A user submits a report through the live reporting page.
  - The report is stored, but the moderator agent never reads that collection.
- Impact:
  - The report workflow is effectively dead for the primary in-app reporting path.
  - Abuse, illegal content, and privacy complaints can be recorded without entering the moderation pipeline users are promised.
- Confidence: `High`
- Recommended remediation:
  - Consolidate on one reporting collection and make the UI, rules, and moderation agent use the same path.
  - Add a test that proves a report submitted from the UI is visible to the moderation worker.
- Mitigation if immediate fix is hard:
  - Redirect or disable the reporting page until moderation consumes the same collection.
- False positive notes:
  - None in repo scope. An out-of-band processor could exist, but none is visible here.

## Architecture / Control Weaknesses

### SA-007
- Rule ID: `SA-007`
- Severity: `Medium`
- Type: `Architecture/control weakness`
- Location: `firestore.rules:149-182`, `agents/lib/logger.ts:22-37`, `agents/lib/logger.ts:43-72`
- Evidence:
  - `/hypotheses`, `/research_tasks`, `/agent_events`, and `/agent_runs` are publicly readable.
  - The logger persists run summaries, step details, and error strings into those public collections.
- Exploit path:
  - Any unauthenticated user can enumerate operational events, run status, and internal workflow metadata.
- Impact:
  - Internal workflow state, failures, and execution detail are exposed for reconnaissance.
  - Error messages and task summaries may disclose implementation detail or future product direction.
- Confidence: `High`
- Recommended remediation:
  - Make operational collections private by default.
  - Publish a filtered public view only if there is a deliberate product need.
  - Avoid logging raw error strings or sensitive detail into user-readable collections.
- Mitigation if immediate fix is hard:
  - Minimize public fields immediately and move errors/details into admin-only logs.
- False positive notes:
  - The exposed data is visible in rules even if current contents are benign.

### SA-008
- Rule ID: `SA-008`
- Severity: `Medium`
- Type: `Architecture/control weakness`
- Location: `.github/workflows/deploy.yml:47-57`, `.github/workflows/paper-search-agent.yml:27-40`, `.github/workflows/evidence-grader.yml:13-24`, `.github/workflows/summary-writer.yml:13-24`, `.github/workflows/forum-moderator.yml:13-24`, `.github/workflows/trial-tracker.yml:13-24`, `.github/workflows/hypothesis-generator.yml:13-24`, `.github/workflows/hypothesis-critic.yml:13-24`, `agents/README.md:50-53`
- Evidence:
  - Workflows write a full Firebase service-account JSON secret to disk.
  - The deploy workflow also uses a long-lived `FIREBASE_TOKEN`.
  - The repo documentation explicitly expects full service-account JSON content in GitHub secrets.
- Exploit path:
  - Any compromise of the GitHub Actions environment or misuse of repository secrets yields high-value, reusable cloud credentials.
- Impact:
  - Credential blast radius is larger than necessary.
  - Service-account JSON keys and CLI tokens are harder to rotate and constrain than workload identity or purpose-scoped identities.
- Confidence: `High`
- Recommended remediation:
  - Replace long-lived JSON keys and `FIREBASE_TOKEN` with GitHub OIDC workload identity where possible.
  - Split identities by purpose with least privilege.
  - Remove or sharply narrow any secret that can deploy both hosting and Firestore rules.
- Mitigation if immediate fix is hard:
  - Reduce service-account permissions and rotate existing keys and tokens on a defined schedule.
- False positive notes:
  - This is an ops hardening issue, not evidence of an active compromise.

### SA-009
- Rule ID: `SA-009`
- Severity: `Low`
- Type: `Architecture/control weakness`
- Location: `.github/workflows/paper-search-agent.yml:23-25`, `.github/workflows/evidence-grader.yml:13-14`, `.github/workflows/summary-writer.yml:13-14`, `.github/workflows/forum-moderator.yml:13-14`, `.github/workflows/trial-tracker.yml:13-14`, `.github/workflows/hypothesis-generator.yml:13-14`, `.github/workflows/hypothesis-critic.yml:13-14`
- Evidence:
  - Agent workflows use `npm install` instead of lockfile-enforcing `npm ci`.
- Exploit path:
  - CI can resolve unexpected package versions or install-time behavior if the lockfile and package metadata drift.
- Impact:
  - This weakens build reproducibility and slightly increases supply-chain exposure for jobs that also receive sensitive credentials.
- Confidence: `High`
- Recommended remediation:
  - Use `npm ci` in CI for both root and `agents/`.
  - Fail builds on lockfile drift.
- Mitigation if immediate fix is hard:
  - At minimum, pin install behavior and review lockfile changes aggressively.
- False positive notes:
  - This is a hardening issue; it is not a direct application exploit by itself.

### SA-010
- Rule ID: `SA-010`
- Severity: `Low`
- Type: `Architecture/control weakness`
- Location: `docs/security/FIRESTORE-RULES.md:37-71`, `firestore.rules:34-38`, `firestore.rules:107-143`
- Evidence:
  - The security documentation says `/users/{userId}` is readable by any signed-in user, forum posts are readable by anyone when published, and forum comments are readable by anyone.
  - The actual rules are different.
- Exploit path:
  - Operators, reviewers, or future contributors may rely on the documented model and make unsafe decisions based on false assumptions.
- Impact:
  - Security-review drift increases the chance of future misconfiguration and incorrect compliance claims.
- Confidence: `High`
- Recommended remediation:
  - Treat the rules file as source of truth and update docs in the same change whenever rules change.
  - Add emulator-based rule tests so docs and behavior cannot silently diverge.
- Mitigation if immediate fix is hard:
  - Mark the existing document as stale until it is corrected.
- False positive notes:
  - None. The mismatch is explicit.

## Dependency Posture

- Root app:
  - `npm audit --omit=dev --json` returned no production vulnerabilities.
- `agents/` workspace:
  - `npm audit --omit=dev --json` returned 8 low-severity transitive findings, all under the `firebase-admin` dependency chain.
  - Current dependency risk is materially lower than the authorization and architecture issues above.

## Validation Outcomes

- Normal authenticated user can self-assign elevated role:
  - `Confirmed`
- Forum comments can be created outside intended post-visibility checks:
  - `Confirmed`
- Unverified or consent-withdrawn users can still access community features:
  - `Confirmed`
- User-controlled forum content is fed directly into a privileged moderation agent:
  - `Confirmed`
- Publicly readable operational collections leak internal workflow data:
  - `Confirmed`
- CI/CD uses broad long-lived secrets rather than narrower ephemeral identity:
  - `Confirmed`

## Residual Risk / Not Fully Verifiable From Repo

- OpenClaw runtime hardening is not visible here. The agent architecture review assumes the same service-account and secret-handling posture described in repo docs.
- Runtime Firebase project IAM, secret rotation, and environment segmentation are not visible here and should be verified separately.
