import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Catches render errors in lazy-loaded pages so the Layout (navbar, footer)
 * stays visible instead of the entire screen going blank.
 */
class ErrorBoundaryInner extends Component<Props & { fallback: (error: Error, reset: () => void) => ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, this.reset)
    }
    return this.props.children
  }
}

function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="rounded-xl border border-red-200 bg-red-50 p-8">
        <p className="text-lg font-semibold text-red-800">
          {t('error_boundary.title', 'Seite konnte nicht geladen werden')}
        </p>
        <p className="mt-2 text-sm text-red-600">
          {t('error_boundary.text', 'Beim Laden dieser Seite ist ein Fehler aufgetreten.')}
        </p>
        <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 font-mono text-xs text-red-700">
          {error.message}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
        >
          {t('error_boundary.retry', 'Erneut versuchen')}
        </button>
      </div>
    </div>
  )
}

export default function ErrorBoundary({ children }: Props) {
  return (
    <ErrorBoundaryInner fallback={(error, reset) => <ErrorFallback error={error} onReset={reset} />}>
      {children}
    </ErrorBoundaryInner>
  )
}
