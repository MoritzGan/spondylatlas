/** Reusable skeleton loading components with pulse animation. */

function Bone({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-stone-200 ${className}`} />
}

/** Skeleton for a list of cards (e.g. papers, forum posts, hypotheses). */
export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" role="status" aria-label="Loading" aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-stone-200 bg-white p-6">
          <Bone className="h-5 w-3/4" />
          <Bone className="mt-3 h-4 w-1/2" />
          <Bone className="mt-4 h-3 w-full" />
          <Bone className="mt-2 h-3 w-5/6" />
          <div className="mt-4 flex gap-2">
            <Bone className="h-5 w-16 rounded-full" />
            <Bone className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading content…</span>
    </div>
  )
}

/** Skeleton for a detail page (heading + content blocks). */
export function DetailSkeleton() {
  return (
    <div role="status" aria-label="Loading" aria-busy="true">
      <Bone className="h-4 w-24" />
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <Bone className="h-7 w-4/5" />
        <Bone className="mt-3 h-4 w-1/3" />
        <Bone className="mt-6 h-3 w-full" />
        <Bone className="mt-2 h-3 w-full" />
        <Bone className="mt-2 h-3 w-3/4" />
        <Bone className="mt-6 h-3 w-full" />
        <Bone className="mt-2 h-3 w-5/6" />
      </div>
      <span className="sr-only">Loading content…</span>
    </div>
  )
}
