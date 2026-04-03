import { useTranslation } from 'react-i18next'
import { useInView } from '../hooks/useInView'
import { StepIcon } from './StepIcon'

const steps = [
  { number: '01', titleKey: 'landing.how_step1_title', textKey: 'landing.how_step1_text', step: 1 as const },
  { number: '02', titleKey: 'landing.how_step2_title', textKey: 'landing.how_step2_text', step: 2 as const },
  { number: '03', titleKey: 'landing.how_step3_title', textKey: 'landing.how_step3_text', step: 3 as const },
  { number: '04', titleKey: 'landing.how_step4_title', textKey: 'landing.how_step4_text', step: 4 as const },
]

export function HowItWorks() {
  const { t } = useTranslation()

  return (
    <section className="px-4 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        {/* Badge */}
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-sm font-medium text-primary-800">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            {t('landing.how_badge')}
          </span>
        </div>

        {/* Title & Intro */}
        <h2 className="text-center font-serif text-3xl font-semibold text-stone-800 md:text-4xl">
          {t('landing.how_title')}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-lg leading-relaxed text-stone-600">
          {t('landing.how_intro')}
        </p>

        {/* Timeline */}
        <ol className="relative mt-16 list-none pl-0">
          {/* Vertical line — left on mobile, center on desktop */}
          <div
            aria-hidden="true"
            className="absolute top-0 bottom-0 left-6 w-px bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200 md:left-1/2 md:-translate-x-px"
          />

          {steps.map((s, i) => (
            <TimelineStep
              key={s.number}
              index={i}
              number={s.number}
              title={t(s.titleKey)}
              text={t(s.textKey)}
              step={s.step}
              accent={s.step === 4}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}

function TimelineStep({
  index,
  number,
  title,
  text,
  step,
  accent,
}: {
  index: number
  number: string
  title: string
  text: string
  step: 1 | 2 | 3 | 4
  accent: boolean
}) {
  const [ref, isInView] = useInView(0.2)
  const isLeft = index % 2 === 0
  const delay = `${index * 150}ms`

  return (
    <li
      ref={ref as React.RefObject<HTMLLIElement>}
      className={`relative mb-12 last:mb-0 ${
        isInView ? 'timeline-step-visible' : 'timeline-step-hidden'
      } ${isLeft ? 'timeline-from-left' : 'timeline-from-right'}`}
      style={{ '--step-delay': delay } as React.CSSProperties}
    >
      {/* Mobile: card right of line. Desktop: alternating via grid */}
      <div className="grid grid-cols-[48px_1fr] items-start md:grid-cols-[1fr_48px_1fr]">
        {/* Desktop left card (even steps) */}
        <div className="hidden md:block">
          {isLeft && (
            <div className="pr-8 text-right">
              <CardContent number={number} title={title} text={text} step={step} accent={accent} alignRight />
            </div>
          )}
        </div>

        {/* Dot on the line */}
        <div className="flex justify-center pt-1">
          <div
            className={`timeline-dot relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-sm ${
              accent
                ? 'border-primary-300 bg-primary-100 text-primary-700'
                : 'border-stone-200 bg-white text-stone-600'
            }`}
          >
            <StepIcon step={step} />
          </div>
        </div>

        {/* Desktop right card (odd steps) / Mobile: always show */}
        <div>
          {/* Mobile card (always visible) */}
          <div className="pl-4 md:hidden">
            <CardContent number={number} title={title} text={text} step={step} accent={accent} />
          </div>
          {/* Desktop right card */}
          <div className="hidden md:block">
            {!isLeft && (
              <div className="pl-8">
                <CardContent number={number} title={title} text={text} step={step} accent={accent} />
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

function CardContent({
  number,
  title,
  text,
  step: _step, // eslint-disable-line @typescript-eslint/no-unused-vars
  accent,
  alignRight,
}: {
  number: string
  title: string
  text: string
  step: 1 | 2 | 3 | 4
  accent: boolean
  alignRight?: boolean
}) {
  return (
    <div
      className={`rounded-2xl p-6 shadow-sm transition-shadow hover:shadow-md ${
        accent
          ? 'border border-primary-200 bg-primary-50'
          : 'border border-stone-100 bg-stone-50'
      } ${alignRight ? 'text-right' : ''}`}
    >
      <span
        className={`text-sm font-semibold tracking-widest ${
          accent ? 'text-primary-600' : 'text-stone-400'
        }`}
      >
        {number}
      </span>
      <h3 className="mt-2 font-serif text-xl font-semibold text-stone-800">{title}</h3>
      <p className="mt-2 leading-relaxed text-stone-600">{text}</p>
    </div>
  )
}
