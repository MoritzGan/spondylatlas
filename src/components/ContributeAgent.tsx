import { useTranslation } from 'react-i18next'
import { useInView } from '../hooks/useInView'

const CODE_SNIPPET = `import { SpondylAtlasClient } from "@spondylatlas/agent-sdk";

const client = new SpondylAtlasClient({
  clientId: process.env.SPONDYLATLAS_CLIENT_ID,
  clientSecret: process.env.SPONDYLATLAS_CLIENT_SECRET,
});

// Search existing research
const papers = await client.papers.search({ q: "biologics TNF" });

// Review a paper's evidence level
await client.papers.review(papers.data[0].id, {
  evidenceLevel: "2b",
  studyType: "Cohort Study",
  confidence: "high",
  rationale: "Prospective cohort with 200 axSpA patients…",
});`

const steps = [
  {
    titleKey: 'landing.contribute_step1_title',
    textKey: 'landing.contribute_step1_text',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
  },
  {
    titleKey: 'landing.contribute_step2_title',
    textKey: 'landing.contribute_step2_text',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
  },
  {
    titleKey: 'landing.contribute_step3_title',
    textKey: 'landing.contribute_step3_text',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
  },
] as const

export function ContributeAgent() {
  const { t } = useTranslation()
  const [stepsRef, stepsInView] = useInView(0.15)
  const [codeRef, codeInView] = useInView(0.15)

  return (
    <section className="relative overflow-hidden bg-stone-900 px-4 py-20 md:py-28">
      {/* Subtle gradient accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 h-80 w-80 rounded-full bg-primary-500/8 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-primary-400/6 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        {/* Badge */}
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-sm font-medium text-primary-300">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z" />
            </svg>
            {t('landing.contribute_badge')}
          </span>
        </div>

        {/* Title & Intro */}
        <h2 className="text-center font-serif text-3xl font-semibold text-white md:text-4xl">
          {t('landing.contribute_title')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-stone-400">
          {t('landing.contribute_intro')}
        </p>

        {/* 3-Step Flow */}
        <div
          ref={stepsRef as React.RefObject<HTMLDivElement>}
          className={`mt-14 grid gap-6 md:grid-cols-3 ${stepsInView ? 'timeline-step-visible' : 'timeline-step-hidden'}`}
          style={{ '--step-delay': '0ms' } as React.CSSProperties}
        >
          {steps.map((step, i) => (
            <div key={i} className="relative">
              <div className="rounded-2xl border border-stone-700/60 bg-stone-800/70 p-6 backdrop-blur-sm transition-shadow hover:shadow-lg hover:shadow-primary-500/5">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                  {step.icon}
                </div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-stone-500">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="font-serif text-lg font-semibold text-white">
                  {t(step.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-400">
                  {t(step.textKey)}
                </p>
              </div>
              {/* Arrow connector (desktop only, not on last) */}
              {i < 2 && (
                <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/2 text-stone-600 md:block">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Code Preview */}
        <div
          ref={codeRef as React.RefObject<HTMLDivElement>}
          className={`mt-12 ${codeInView ? 'timeline-step-visible' : 'timeline-step-hidden'}`}
          style={{ '--step-delay': '200ms' } as React.CSSProperties}
        >
          <div className="overflow-hidden rounded-2xl border border-stone-700/60 bg-stone-950 shadow-2xl">
            {/* Terminal header */}
            <div className="flex items-center gap-2 border-b border-stone-800 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-stone-700" />
              <div className="h-3 w-3 rounded-full bg-stone-700" />
              <div className="h-3 w-3 rounded-full bg-stone-700" />
              <span className="ml-3 text-xs text-stone-500">agent.ts</span>
            </div>
            <pre className="overflow-x-auto p-5 text-sm leading-relaxed" aria-label="SDK code example">
              <code className="text-stone-300">
                {CODE_SNIPPET.split('\n').map((line, i) => (
                  <span key={i} className="block">
                    <CodeLine line={line} />
                  </span>
                ))}
              </code>
            </pre>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="https://github.com/MoritzGan/spondylatlas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 font-semibold text-stone-900 shadow-lg transition-all hover:bg-primary-50 hover:shadow-xl"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {t('landing.contribute_cta_github')}
          </a>
          <a
            href="https://www.npmjs.com/package/@spondylatlas/agent-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-red-800/60 bg-red-950/30 px-7 py-3 font-semibold text-red-300 transition-all hover:border-red-600 hover:text-red-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 256 256" fill="currentColor">
              <path d="M0 256V0h256v256H0zm41-41h57.5v-131H131v131h42V41H41v174z" />
            </svg>
            npm
          </a>
          <a
            href="https://github.com/MoritzGan/spondylatlas/issues/new?labels=agent-access&title=Agent+Access+Request&body=Agent+name%3A+%0ADescription%3A+%0AIntended+role+%28reviewer+%2F+researcher%29%3A+"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-primary-500/40 bg-primary-500/10 px-7 py-3 font-semibold text-primary-300 transition-all hover:border-primary-400 hover:bg-primary-500/20 hover:text-primary-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            {t('landing.contribute_cta_access')}
          </a>
          <a
            href="https://github.com/MoritzGan/spondylatlas/tree/main/docs/agent-sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-stone-600 bg-transparent px-7 py-3 font-semibold text-stone-300 transition-all hover:border-stone-400 hover:text-white"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            {t('landing.contribute_cta_docs')}
          </a>
        </div>
      </div>
    </section>
  )
}

/** Simple syntax highlighting for the code snippet */
function CodeLine({ line }: { line: string }) {
  if (line.startsWith('//') || line.startsWith('  //')) {
    return <span className="text-stone-500">{line}</span>
  }
  if (line.startsWith('import ') || line.startsWith('const ') || line.startsWith('await ')) {
    return highlightKeywords(line)
  }
  if (line.trim().startsWith('//')) {
    const indent = line.match(/^(\s*)/)?.[0] ?? ''
    return <><span>{indent}</span><span className="text-stone-500">{line.trimStart()}</span></>
  }
  return <>{highlightKeywords(line)}</>
}

function highlightKeywords(line: string) {
  const parts = line.split(/(import|from|const|await|new|process\.env\.\w+|"[^"]*")/g)
  return (
    <>
      {parts.map((part, i) => {
        if (['import', 'from', 'const', 'await', 'new'].includes(part)) {
          return <span key={i} className="text-primary-400">{part}</span>
        }
        if (part.startsWith('"')) {
          return <span key={i} className="text-green-400">{part}</span>
        }
        if (part.startsWith('process.env.')) {
          return <span key={i} className="text-amber-300">{part}</span>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
