import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { getPost, getComments, addComment, formatDate } from '../lib/forum'
import type { ForumPost, ForumComment } from '../types/forum'

export default function ForumThread() {
  const { category, postId } = useParams<{ category: string; postId: string }>()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [post, setPost] = useState<ForumPost | null>(null)
  const [comments, setComments] = useState<ForumComment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!postId) return
    Promise.all([getPost(postId), getComments(postId)])
      .then(([p, c]) => {
        setPost(p)
        setComments(c)
      })
      .finally(() => setLoading(false))
  }, [postId])

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !postId || !replyText.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await addComment(
        postId,
        replyText.trim(),
        user.uid,
        user.displayName ?? user.email ?? 'Anonym',
      )
      const updated = await getComments(postId)
      setComments(updated)
      setReplyText('')
      if (post) setPost({ ...post, replyCount: post.replyCount + 1 })
    } catch {
      setError(t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 text-gray-500">
        {t('common.loading')}
      </div>
    )
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-gray-500">{t('forum.post_not_found')}</p>
        <Link to="/forum" className="mt-4 inline-block text-primary-600 hover:underline">
          ← {t('forum.back_to_forum')}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to={`/forum/${category}`} className="text-sm text-primary-600 hover:underline">
        ← {t(`forum.categories.${category}`)}
      </Link>

      {/* Original post */}
      <article className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
          <span>{post.authorName}</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
        <div className="mt-4 whitespace-pre-wrap text-gray-700">{post.content}</div>
      </article>

      {/* Comments */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('forum.replies', { count: comments.length })}
        </h2>

        {comments.length === 0 && (
          <p className="mt-4 text-gray-500">{t('forum.no_posts')}</p>
        )}

        <div className="mt-4 space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-gray-100 bg-gray-50 p-5"
            >
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="font-medium text-gray-800">{comment.authorName}</span>
                <span>{formatDate(comment.createdAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reply form */}
      <section className="mt-8">
        {user ? (
          <form onSubmit={handleReply} className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-base font-semibold text-gray-900">{t('forum.write_reply')}</h3>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
              maxLength={3000}
              placeholder={t('forum.reply_placeholder')}
              className="mt-3 w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">{replyText.length}/3000</span>
              <button
                type="submit"
                disabled={submitting || !replyText.trim()}
                className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? t('common.loading') : t('forum.submit_reply')}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
            {t('forum.login_to_reply')}{' '}
            <Link to="/login" className="text-primary-600 hover:underline">
              {t('auth.login_button')}
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
