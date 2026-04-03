import '@testing-library/jest-dom/vitest'
import i18n from '../../src/i18n'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

beforeEach(async () => {
  await i18n.changeLanguage('de')
  document.head.innerHTML = ''
  document.body.innerHTML = ''
})
