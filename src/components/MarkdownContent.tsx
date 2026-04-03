import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

interface MarkdownContentProps {
  children: string
  className?: string
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-4 text-xl font-bold text-stone-900 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-lg font-semibold text-stone-900 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-3 text-base font-semibold text-stone-800 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal pl-5">{children}</ol>,
  li: ({ children }) => <li className="my-0.5 leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-stone-900">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
}

/**
 * Rendert Markdown-Text als formatiertes HTML mit Tailwind-Stilen.
 */
export default function MarkdownContent({ children, className = '' }: MarkdownContentProps) {
  return (
    <div className={`text-stone-700 ${className}`.trim()}>
      <ReactMarkdown components={components}>{children}</ReactMarkdown>
    </div>
  )
}
