import { decodeHtml, stripAiPromptPrefix } from './textUtils'

describe('textUtils', () => {
  it('decodes common html entities', () => {
    expect(decodeHtml('A &amp; B &lt; C &#39;test&#39;')).toBe("A & B < C 'test'")
  })

  it('removes nested AI prompt prefixes', () => {
    expect(stripAiPromptPrefix('Summary: Analysis: This study helps.')).toBe('This study helps.')
  })
})
