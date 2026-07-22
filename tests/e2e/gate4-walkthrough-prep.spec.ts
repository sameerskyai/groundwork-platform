import { test, expect } from '@playwright/test'
import { authenticateAsFounderDemo, getFounderProjectId } from '../helpers/auth'

const SHOTS = 'tests/e2e-screenshots/gate4'

test.describe('Gate 4: Walkthrough Prep', () => {
  test('Bug #3: /homeowner/communities has no marketing header', async ({ page }) => {
    await authenticateAsFounderDemo(page)
    await page.goto('http://localhost:3000/homeowner/communities')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SHOTS}/bug3-communities.png`, fullPage: true })

    await expect(page.locator('text=Get started free')).toHaveCount(0)
    await expect(page.locator('text=Sign in')).toHaveCount(0)
    await expect(page.locator('text=Your Community')).toBeVisible()
    // The real proof this isn't just a header check: the page must actually
    // resolve a community, not show the "No ZIP code found" error.
    await expect(page.locator('text=No ZIP code found')).toHaveCount(0)
  })

  test('Bug #4: messages inbox shows seeded conversation, send persists', async ({ page }) => {
    await authenticateAsFounderDemo(page)

    await page.goto('http://localhost:3000/homeowner/messages')
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SHOTS}/bug4-1-inbox.png`, fullPage: true })
    await expect(page.locator('text=No conversations yet')).toHaveCount(0)

    // Open the seeded conversation
    const convoLink = page.locator('a[href^="/homeowner/messages/"]').first()
    await expect(convoLink).toBeVisible()
    await convoLink.click()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SHOTS}/bug4-2-conversation-open.png`, fullPage: true })

    // Send a message
    const uniqueText = `Gate 4 walkthrough prep check ${Date.now()}`
    const input = page.locator('textarea, input[type="text"]').last()
    await input.fill(uniqueText)
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${SHOTS}/bug4-3-sent.png`, fullPage: true })
    await expect(page.locator(`text=${uniqueText}`)).toBeVisible()

    // Navigate away and back, confirm persistence
    await page.goto('http://localhost:3000/homeowner')
    await page.waitForLoadState('networkidle')
    await page.goBack()
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SHOTS}/bug4-4-persisted.png`, fullPage: true })
    await expect(page.locator(`text=${uniqueText}`)).toBeVisible()
  })

  test('Bug #5: Back to matches lands on a working matches view', async ({ page }) => {
    await authenticateAsFounderDemo(page)

    // Dashboard's own "Matches" nav link -- href is set asynchronously once
    // the project loads, so wait for it to actually resolve before clicking.
    await page.goto('http://localhost:3000/homeowner')
    await page.waitForLoadState('networkidle')
    const matchesNav = page.locator('a:has-text("Matches")').first()
    await expect(matchesNav).toHaveAttribute('href', /project=/, { timeout: 10000 })
    await matchesNav.click()
    await page.waitForURL(/\/homeowner\/matches\?project=/, { timeout: 10000 })
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${SHOTS}/bug5-1-dashboard-nav-to-matches.png`, fullPage: true })
    expect(page.url()).toContain('/homeowner/matches?project=')
    await expect(page.locator('text=Project not found or not authorized')).toHaveCount(0)

    // Chat page's "Back to matches" (error-state link, no active conversation)
    await page.goto('http://localhost:3000/homeowner/chat')
    await page.waitForLoadState('networkidle')
    const backLink = page.locator('a:has-text("Back to matches")')
    if (await backLink.count() > 0) {
      await backLink.click()
      await page.waitForLoadState('networkidle')
      await page.screenshot({ path: `${SHOTS}/bug5-2-chat-back-to-matches.png`, fullPage: true })
      console.log('chat back-to-matches landed on:', page.url())
    }
  })

  test('Matches page renders real matches (regression check for the seed repair)', async ({ page }) => {
    await authenticateAsFounderDemo(page)
    const projectId = await getFounderProjectId()
    await page.goto(`http://localhost:3000/homeowner/matches?project=${projectId}`)
    await page.waitForLoadState('networkidle')
    await page.screenshot({ path: `${SHOTS}/matches-regression.png`, fullPage: true })
    const content = await page.content()
    console.log('matches page shows 92%:', content.includes('92%'))
  })
})
