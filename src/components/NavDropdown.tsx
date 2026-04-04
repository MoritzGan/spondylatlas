import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

type NavDropdownProps = {
  label: string
  items: Array<{ to: string; label: string; end?: boolean }>
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export default function NavDropdown({ label, items, isOpen, onToggle, onClose }: NavDropdownProps) {
  const location = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  const isChildActive = items.some((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  )

  // close on click-outside
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen, onClose])

  // close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // close on route change
  useEffect(() => {
    onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
          isOpen || isChildActive
            ? 'bg-primary-100 text-primary-800 shadow-sm'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
        }`}
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 min-w-[180px] rounded-2xl border border-stone-200/80 bg-white p-1.5 shadow-lg ring-1 ring-stone-900/5"
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              role="menuitem"
              className={({ isActive }) =>
                `block rounded-xl px-4 py-2.5 text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                  isActive
                    ? 'bg-primary-50 text-primary-800'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}
