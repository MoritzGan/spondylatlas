import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { createPost } from '../lib/forum'
import type { ForumCategory } from '../types/forum'

export default function NewPost() {
  const { category } = useParams<{ category: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-center text-stone-500">
        {t('forum.login_to_post')}{' '}
        <Link to="/login" className="text-primary-600 hover:underline">
          {t('auth.login_button')}
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !category || !title.trim() || !content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await createPost(
        title.trim(),
        content.trim(),
        category as ForumCategory,
        user.uid,
        user.displayName ?? user.email ?? 'Anonym',
      )
      navigate(`/forum/${category}`, { state: { pendingModeration: true } })
    } catch {
      setError(t('common.error'))
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link to={`/forum/${category}`} className="text-sm text-primary-600 hover:underline">
        ← {t(`forum.categories.${category}`)}
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-stone-900">{t('forum.new_post')}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-700">
            {t('forum.post_title')}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            required
            className="mt-1 w-full rounded-lg border border-stone-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <p className="mt-1 text-right text-xs text-stone-400">{title.length}/300</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">
            {t('forum.post_content')}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            maxLength={10000}
            required
            className="mt-1 w-full rounded-lg border border-stone-300 p-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <p className="mt-1 text-right text-xs text-stone-400">{content.length}/10000</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? t('common.loading') : t('forum.submit_post')}
          </button>
        </div>
      </form>
    </div>
  )
}
