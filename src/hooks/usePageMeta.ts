import { useEffect } from 'react'

type PageMetaOptions = {
  title: string
  description?: string
  robots?: string
}

function upsertMeta(name: string, content: string) {
  let node = document.head.querySelector(`meta[name="${name}"]`)
  if (!node) {
    node = document.createElement('meta')
    node.setAttribute('name', name)
    document.head.appendChild(node)
  }
  node.setAttribute('content', content)
}

export function usePageMeta({ title, description, robots }: PageMetaOptions) {
  useEffect(() => {
    document.title = title

    if (description) {
      upsertMeta('description', description)
    }

    if (robots) {
      upsertMeta('robots', robots)
    }

    return () => {
      if (robots) {
        const node = document.head.querySelector('meta[name="robots"]')
        if (node) {
          node.remove()
        }
      }
    }
  }, [description, robots, title])
}
