import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, collection, addDoc } from 'firebase/firestore'

let testEnv: RulesTestEnvironment

function authedDb(uid: string, claims: Record<string, unknown> = {}) {
  return testEnv.authenticatedContext(uid, claims).firestore()
}

function anonDb() {
  return testEnv.unauthenticatedContext().firestore()
}

async function seedDoc(path: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data)
  })
}

describe('firestore rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-no-project',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    })
  })

  afterAll(async () => {
    await testEnv.cleanup()
  })

  beforeEach(async () => {
    await testEnv.clearFirestore()
    await Promise.all([
      seedDoc('users/user-1', { role: 'user', email: 'user@example.com' }),
      seedDoc('users/mod-1', { role: 'moderator', email: 'mod@example.com' }),
      seedDoc('users/admin-1', { role: 'admin', email: 'admin@example.com' }),
      seedDoc('health_data_consents/user-1', { userId: 'user-1', granted: true, version: '2026-04-02' }),
      seedDoc('forum_posts/post-1', {
        authorId: 'user-1',
        authorName: 'Alex',
        title: 'Visible thread',
        content: 'Body',
        category: 'general',
        status: 'published',
        createdAt: new Date(),
      }),
      seedDoc('forum_comments/comment-1', {
        postId: 'post-1',
        authorId: 'user-1',
        authorName: 'Alex',
        content: 'Reply',
        createdAt: new Date(),
      }),
      seedDoc('reports/report-1', {
        reporterId: 'user-1',
        targetId: 'post-1',
        targetType: 'post',
        reason: 'issue',
        createdAt: new Date(),
        reviewed: false,
      }),
      seedDoc('papers/paper-1', { title: 'Paper' }),
      seedDoc('trials/trial-1', { nctId: 'trial-1' }),
      seedDoc('agent_events/event-1', { agent: 'paper-search', runId: 'run-1', timestamp: new Date() }),
      seedDoc('agent_runs/run-1', { agent: 'paper-search', runId: 'run-1', status: 'complete' }),
      seedDoc('hypotheses/h-1', { status: 'open' }),
      seedDoc('hypothesis_comments/hc-1', { hypothesisId: 'h-1', authorId: 'user-1', content: 'Hi' }),
    ])
  })

  it('enforces user document ownership and admin access', async () => {
    await assertSucceeds(getDoc(doc(authedDb('user-1'), 'users/user-1')))
    await assertFails(getDoc(doc(authedDb('user-2'), 'users/user-1')))
    await assertSucceeds(getDoc(doc(authedDb('admin-1'), 'users/user-1')))
    await assertSucceeds(setDoc(doc(authedDb('user-2'), 'users/user-2'), { email: 'new@example.com' }))
  })

  it('allows public research reads and blocks non-admin writes', async () => {
    await assertSucceeds(getDoc(doc(anonDb(), 'papers/paper-1')))
    await assertSucceeds(getDoc(doc(anonDb(), 'trials/trial-1')))
    await assertFails(setDoc(doc(authedDb('user-1'), 'papers/paper-2'), { title: 'Nope' }))
    await assertSucceeds(setDoc(doc(authedDb('admin-1'), 'papers/paper-2'), { title: 'Allowed' }))
  })

  it('enforces consent and verified email for forum reads and writes', async () => {
    await assertFails(getDoc(doc(anonDb(), 'forum_posts/post-1')))
    await assertFails(getDoc(doc(authedDb('user-1'), 'forum_posts/post-1')))
    await assertSucceeds(getDoc(doc(authedDb('user-1', { email_verified: true }), 'forum_posts/post-1')))

    await assertFails(addDoc(collection(authedDb('user-2', { email_verified: true }), 'forum_posts'), {
      authorId: 'user-2',
      authorName: 'No consent',
      title: 'Blocked',
      content: 'Blocked',
      category: 'general',
      status: 'pending_moderation',
    }))

    await seedDoc('health_data_consents/user-2', { userId: 'user-2', granted: true, version: '2026-04-02' })

    await assertSucceeds(addDoc(collection(authedDb('user-2', { email_verified: true }), 'forum_posts'), {
      authorId: 'user-2',
      authorName: 'Allowed',
      title: 'Allowed',
      content: 'Allowed',
      category: 'general',
      status: 'pending_moderation',
    }))

    await assertFails(updateDoc(doc(authedDb('user-1', { email_verified: true }), 'forum_posts/post-1'), {
      status: 'flagged',
    }))
  })

  it('allows moderators to review forum content using canonical statuses', async () => {
    await assertSucceeds(getDoc(doc(authedDb('mod-1'), 'forum_posts/post-1')))
    await assertSucceeds(updateDoc(doc(authedDb('mod-1'), 'forum_posts/post-1'), {
      authorId: 'user-1',
      authorName: 'Alex',
      title: 'Visible thread',
      content: 'Body',
      category: 'general',
      status: 'flagged',
      createdAt: new Date(),
    }))
    await assertFails(updateDoc(doc(authedDb('mod-1'), 'forum_posts/post-1'), {
      status: 'rejected',
    }))
  })

  it('protects compliance collections and reports', async () => {
    await assertSucceeds(setDoc(doc(authedDb('user-1'), 'health_data_consents/user-1'), {
      userId: 'user-1',
      granted: true,
      version: '2026-04-02',
    }))
    await assertFails(setDoc(doc(authedDb('user-2'), 'health_data_consents/user-1'), {
      userId: 'user-1',
      granted: true,
      version: '2026-04-02',
    }))

    await assertSucceeds(addDoc(collection(authedDb('user-1'), 'account_requests'), {
      userId: 'user-1',
      type: 'export',
      status: 'requested',
    }))
    await assertFails(addDoc(collection(authedDb('user-1'), 'account_requests'), {
      userId: 'user-1',
      type: 'delete',
      status: 'done',
    }))

    await assertSucceeds(getDoc(doc(authedDb('mod-1'), 'reports/report-1')))
    await assertFails(getDoc(doc(authedDb('user-1', { email_verified: true }), 'reports/report-1')))
  })

  it('allows content reports with validated payloads and blocks unknown collections', async () => {
    await assertSucceeds(addDoc(collection(anonDb(), 'content_reports'), {
      reporterUserId: null,
      reporterEmail: 'anon@example.com',
      contentUrl: 'https://example.com/forum/post-1',
      contentType: 'post',
      reason: 'harmful',
      details: 'details',
    }))

    await assertFails(addDoc(collection(anonDb(), 'content_reports'), {
      reporterUserId: null,
      reporterEmail: 'anon@example.com',
      contentUrl: 'x'.repeat(600),
      contentType: 'post',
      reason: 'harmful',
      details: 'details',
    }))

    await assertSucceeds(getDoc(doc(anonDb(), 'agent_events/event-1')))
    await assertFails(setDoc(doc(authedDb('user-1'), 'unknown/path'), { nope: true }))
  })

  it('keeps hypothesis content public but author-restricted on comments', async () => {
    await assertSucceeds(getDoc(doc(anonDb(), 'hypotheses/h-1')))
    await assertSucceeds(getDoc(doc(anonDb(), 'hypothesis_comments/hc-1')))
    await assertFails(addDoc(collection(anonDb(), 'hypothesis_comments'), {
      hypothesisId: 'h-1',
      authorId: 'anon',
      content: 'no',
    }))
  })
})
