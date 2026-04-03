import type { ReactElement, ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render } from '@testing-library/react'

export function renderWithRouter(
  ui: ReactElement,
  { route = '/', wrapper }: { route?: string; wrapper?: ({ children }: { children: ReactNode }) => ReactNode } = {},
) {
  window.history.pushState({}, 'Test', route)

  const RouterWrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[route]}>
      {wrapper ? wrapper({ children }) : children}
    </MemoryRouter>
  )

  return render(ui, { wrapper: RouterWrapper })
}
