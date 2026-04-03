import { useEffect, useState } from 'react'
import { Link, useParams, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPostsByCategory, formatDate } from '../lib/forum'
import type { ForumPost, ForumCategory } from '../types/forum'
import { CardListSkeleton } from '../components/Skeleton'
import EmptyState from '../components/EmptyState'

export default function ForumCategory() {
  const { category } = useParams<{ category: string }>()
  const { t } = useTranslation()
  const location = useLocation()
  const pendingModeration = (location.state as { pendingModeration?: boolean } | null)?.pendingModeration
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!category) return
    getPostsByCategory(category as ForumCategory)
      .then(setPosts)
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div>
        <Link to="/forum" className="text-sm text-primary-600 hover:underline">
          ← {t('forum.back_to_forum')}
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-stone-900">
            {t(`forum.categories.${category}`)}
          </h1>
          <Link
            to={`/forum/${category}/new`}
            className="shrink-0 rounded-lg bg-primary-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-700"
          >
            {t('forum.new_post')}
          </Link>
        </div>
      </div>

      {pendingModeration && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
           {t('forum.post_submitted')}
        </div>
      )}

      <div className="mt-8 space-y-3">
        {loading && <CardListSkeleton count={3} />}
        {!loading && posts.length === 0 && (
          <EmptyState
            icon=""
            title={t('forum.no_threads')}
            action={{ label: t('forum.be_first'), to: `/forum/${category}/new` }}
          />
        )}
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/forum/${category}/${post.id}`}
            className="block rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md"
          >
            <h2 className="text-base font-semibold text-stone-900">{post.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm text-stone-500">{post.content}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-stone-400">
              <span>{post.authorName}</span>
              <span>{formatDate(post.createdAt)}</span>
              <span>{t('forum.replies', { count: post.replyCount })}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
