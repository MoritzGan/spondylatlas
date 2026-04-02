import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Paper } from '../lib/types'

export default function Research() {
  const { t } = useTranslation()
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const q = query(collection(db, 'papers'), orderBy('publishedAt', 'desc'))
        const snapshot = await getDocs(q)
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Paper[]
        setPapers(docs)
      } catch (err) {
        console.error('Failed to fetch papers:', err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    fetchPapers()
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return papers
    const term = search.toLowerCase()
    return papers.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.tags.some((tag) => tag.toLowerCase().includes(term))
    )
  }, [papers, search])

  const formatDate = (paper: Paper) => {
    try {
      return paper.publishedAt.toDate().toLocaleDateString()
    } catch {
      return '—'
    }
  }

  const sourceLabel = (source: string) => {
    if (source === 'pubmed') return 'PubMed'
    if (source === 'europepmc') return 'Europe PMC'
    return source
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">{t('research.title')}</h1>
      <p className="mt-2 text-gray-600">{t('research.subtitle')}</p>

      <div className="mt-6">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('research.search_placeholder')}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {loading && (
        <div className="mt-12 text-center text-gray-500">{t('common.loading')}</div>
      )}

      {error && (
        <div className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t('common.error')}: {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="mt-12 text-center text-gray-500">
          {search.trim() ? t('research.no_results') : t('research.no_papers')}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="mt-4 text-sm text-gray-500">
            {t('research.paper_count', { count: filtered.length })}
          </p>

          <div className="mt-4 space-y-4">
            {filtered.map((paper) => (
              <Link
                key={paper.id}
                to={`/research/${paper.id}`}
                className="block rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">{paper.title}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      paper.source === 'pubmed'
                        ? 'bg-accent-100 text-accent-800'
                        : 'bg-primary-100 text-primary-800'
                    }`}
                  >
                    {sourceLabel(paper.source)}
                  </span>
                </div>

                {paper.authors.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    {paper.authors.slice(0, 3).join(', ')}
                    {paper.authors.length > 3 && ' et al.'}
                  </p>
                )}

                <p className="mt-2 line-clamp-3 text-gray-600">
                  {paper.summary || paper.abstract}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {paper.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-800"
                    >
                      {tag}
                    </span>
                  ))}
                  <span className="ml-auto text-xs text-gray-400">{formatDate(paper)}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
