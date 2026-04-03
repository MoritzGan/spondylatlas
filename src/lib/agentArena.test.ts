import { Timestamp } from 'firebase/firestore'
import { durationSec, formatRelative } from './agentArena'

describe('agent arena helpers', () => {
  it('formats relative times and durations', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    expect(formatRelative(Timestamp.fromMillis(now - 30_000))).toBe('gerade eben')
    expect(formatRelative(Timestamp.fromMillis(now - 5 * 60_000))).toBe('vor 5 Min')
    expect(durationSec(Timestamp.fromMillis(now), Timestamp.fromMillis(now + 65_000))).toBe('1m 5s')
  })
})
