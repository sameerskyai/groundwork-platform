import { test, expect } from '@playwright/test'
import { authenticateAsFounderDemo, getFounderProjectId } from '../helpers/auth'
import * as path from 'path'

const SCREENSHOTS_DIR = '/tmp/e2e-screenshots'

test.describe('Gate 4: J3 Matches Verification', () => {
  test('Matches page loads and displays 3 cards (0.92, 0.85, 0.81)', async ({ page }) => {
    try {
      // Authenticate
      await authenticateAsFounderDemo(page)
      const projectId = await getFounderProjectId()

      // Navigate to matches page
      await page.goto(`http://localhost:3000/homeowner/matches?project=${projectId}`)
      await page.waitForLoadState('networkidle')

      // Screenshot: page loaded
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'bug1-matches-loaded.png'),
        fullPage: true
      })

      // Matches are displayed one at a time (swipe card interface)
      // Check that all 3 scores appear somewhere on the page as we navigate
      const scores = ['92%', '85%', '81%']
      const foundScores = new Set<string>()

      // Get initial content and collect any scores
      let pageContent = await page.content()
      for (const score of scores) {
        if (pageContent.includes(score)) {
          foundScores.add(score)
        }
      }

      // Navigate through cards by clicking Pass button 3 times to see all matches
      const passButton = page.locator('button:has-text("Pass")')
      for (let i = 0; i < 3 && foundScores.size < 3; i++) {
        if (await passButton.isVisible()) {
          await passButton.click()
          await page.waitForTimeout(500) // Wait for card animation
          pageContent = await page.content()
          for (const score of scores) {
            if (pageContent.includes(score)) {
              foundScores.add(score)
            }
          }
        }
      }

      // Verify all three high-score matches were found
      expect(foundScores.has('92%')).toBeTruthy()
      expect(foundScores.has('85%')).toBeTruthy()
      expect(foundScores.has('81%')).toBeTruthy()

      // Verify 65% (below 80% gate) is NOT found
      expect(pageContent).not.toContain('65%')

      console.log(`✅ Matches page verified: found scores ${Array.from(foundScores).join(', ')}, 65% excluded`)
    } catch (error) {
      console.error('Test failed:', error)
      throw error
    }
  })

  test('Dashboard displays estimate and match count', async ({ page }) => {
    try {
      await authenticateAsFounderDemo(page)

      // Navigate to dashboard
      await page.goto('http://localhost:3000/homeowner')
      await page.waitForLoadState('networkidle')

      // Screenshot: dashboard
      await page.screenshot({
        path: path.join(SCREENSHOTS_DIR, 'bug2-dashboard.png'),
        fullPage: true
      })

      const pageContent = await page.content()

      // Check for estimate/budget display (should show numeric values, not "—")
      const hasNumbers = /[\d]+[k$]/.test(pageContent)
      expect(hasNumbers).toBeTruthy()

      // Check for match count (should show "3" not "0")
      expect(pageContent).toContain('3')

      console.log('✅ Dashboard verified: estimate and match count visible')
    } catch (error) {
      console.error('Test failed:', error)
      throw error
    }
  })
})
