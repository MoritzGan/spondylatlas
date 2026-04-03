import { test, expect } from '@playwright/test'

test('landing page renders core navigation', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Research' })).toBeVisible()
})

test('research hub is publicly reachable', async ({ page }) => {
  await page.goto('/research')
  await expect(page.getByRole('heading', { name: /Forschungs-Hub|Research Hub/i })).toBeVisible()
})

test.fixme('forum path stays protected for anonymous visitors', async ({ page }) => {
  await page.goto('/forum')
  await expect(page).toHaveURL(/\/login$/)
})

test('legal pages are routable', async ({ page }) => {
  await page.goto('/impressum')
  await expect(page.getByText(/Impressum|Imprint/i)).toBeVisible()
})
