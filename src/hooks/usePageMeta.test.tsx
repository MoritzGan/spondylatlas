import { render } from '@testing-library/react'
import { usePageMeta } from './usePageMeta'

function TestPageMeta() {
  usePageMeta({
    title: 'Meta Title',
    description: 'Description',
    robots: 'noindex, nofollow',
  })

  return <div>meta</div>
}

describe('usePageMeta', () => {
  it('updates title and meta tags and cleans up robots on unmount', () => {
    const { unmount } = render(<TestPageMeta />)

    expect(document.title).toBe('Meta Title')
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('Description')
    expect(document.head.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')

    unmount()

    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
  })
})
