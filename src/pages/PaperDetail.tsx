import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Paper } from '../lib/types'
import { usePageMeta } from '../hooks/usePageMeta'
import { decodeHtml, stripAiPromptPrefix } from '../lib/textUtils'
import { DetailSkeleton } from '../components/Skeleton'
import MarkdownContent from '../components/MarkdownContent'

export default function PaperDetail() {
  const { paperId } = useParams<{ paperId: string }>()
  const { t, i18n } = useTranslation()
  const [paper, setPaper] = useState<Paper | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!paperId) return

    const fetchPaper = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'papers', paperId))
        if (snapshot.exists()) {
          setPaper({ id: snapshot.id, ...snapshot.data() } as Paper)
        }
      } catch (fetchError) {
        console.error('Failed to fetch paper:', fetchError)
        setError((fetchError as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void fetchPaper()
  }, [paperId])

  usePageMeta({
    title: paper ? `${paper.title} | SpondylAtlas` : `${t('research.title')} | SpondylAtlas`,
    description: i18n.language.startsWith('de')
      ? 'Öffentliche Detailansicht einer Forschungszusammenfassung.'
      : 'Public detail view for a research summary.',
  })

  const formatDate = (paperEntry: Paper) => {
    try {
      return paperEntry.publishedAt.toDate().toLocaleDateString()
    } catch {
      return '-'
    }
  }

  const sourceLabel = (source: string) => {
    if (source === 'pubmed') return 'PubMed'
    if (source === 'europepmc') return 'Europe PMC'
    return source
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <DetailSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/research" className="text-sm text-primary-600 hover:underline">
          &larr; {t('research.back_to_research')}
        </Link>
        <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {t('common.error')}: {error}
        </div>
      </div>
    )
  }

  if (!paper) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/research" className="text-sm text-primary-600 hover:underline">
          &larr; {t('research.back_to_research')}
        </Link>
        <div className="mt-6 text-center text-stone-500">{t('research.paper_not_found')}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/research" className="text-sm text-primary-600 hover:underline">
        &larr; {t('research.back_to_research')}
      </Link>

      <article className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <div className="rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-6 text-stone-600">
          {i18n.language.startsWith('de')
            ? 'Diese Detailseite ist öffentlich. Es werden nur die für den Forschungsbereich erforderlichen Daten geladen.'
            : 'This detail page is public. Only the data required for the research area is loaded.'}
        </div>

        <div className="mt-5 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-stone-900">{paper.title}</h1>
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

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-500">
          {paper.authors.length > 0 && (
            <div>
              <span className="font-medium text-stone-700">{t('research.authors')}:</span>{' '}
              {paper.authors.join(', ')}
            </div>
          )}
          <div>
            <span className="font-medium text-stone-700">{t('research.published')}:</span>{' '}
            {formatDate(paper)}
          </div>
          <div>
            <span className="font-medium text-stone-700">{t('research.source')}:</span>{' '}
            {sourceLabel(paper.source)}
          </div>
        </div>

        {paper.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {paper.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-medium text-primary-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {paper.summary && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-stone-900">{t('research.summary')}</h2>
            <MarkdownContent className="mt-2">{stripAiPromptPrefix(decodeHtml(paper.summary))}</MarkdownContent>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-stone-900">{t('research.abstract')}</h2>
          <MarkdownContent className="mt-2">{decodeHtml(paper.abstract)}</MarkdownContent>
        </section>

        {paper.url && (
          <div className="mt-8 border-t border-stone-100 pt-6">
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
            >
              {t('research.view_original')}
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                />
              </svg>
            </a>
          </div>
        )}
      </article>
    </div>
  )
}
