import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: { label: string; to: string }
}

/** Consistent empty state for list pages. */
export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-stone-200 p-10 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <p className="font-medium text-stone-700">{title}</p>
      {description && <p className="mt-1 text-sm text-stone-400">{description}</p>}
      {action && (
        <Link
          to={action.to}
          className="mt-4 inline-block rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
