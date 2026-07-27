import { test, expect } from '@playwright/test'

test.describe('Phase 2: Waitlist Flow', () => {
  test('signup → position number → referral link', async ({ page }) => {
    // Navigate to waitlist page
    await page.goto('http://localhost:3000/waitlist')
    await page.waitForLoadState('networkidle')

    // Take initial screenshot
    await page.screenshot({ path: 'tests/e2e-screenshots/phase2-waitlist-page.png' })

    // Fill form
    const randomEmail = `test-${Date.now()}@example.com`
    const randomPhone = `555${Math.floor(Math.random() * 9000000)}`

    await page.fill('input[placeholder="Sarah Johnson"]', 'Test User')
    await page.fill('input[placeholder="sarah@example.com"]', randomEmail)
    await page.fill('input[placeholder="(555) 123-4567"]', randomPhone)

    // Check SMS consent
    await page.click('input[type="checkbox"]')

    // Submit
    await page.click('button:has-text("Join the Waitlist")')

    // Wait for navigation or response
    await page.waitForTimeout(3000)

    // Debug: take screenshot of what we see
    await page.screenshot({ path: 'tests/e2e-screenshots/phase2-waitlist-debug.png' })
    console.log('Page content after submit:', await page.content().then(h => h.substring(0, 500)))

    // Wait for success state
    try {
      await page.waitForSelector('text=/You\'re #/', { timeout: 5000 })
    } catch {
      console.log('Timeout waiting for success. Page text:', await page.locator('body').textContent())
      throw new Error('Waitlist submission failed or UI not updated')
    }

    // Verify position number appears
    const positionText = await page.locator('text=/You\'re #/').first().textContent()
    expect(positionText).toMatch(/You're #\d+/)

    // Verify referral link is displayed
    const referralInput = page.locator('input[readonly]').first()
    await expect(referralInput).toBeVisible()
    const referralLink = await referralInput.inputValue()
    expect(referralLink).toContain('/waitlist?ref=')

    // Take success screenshot
    await page.screenshot({ path: 'tests/e2e-screenshots/phase2-waitlist-success.png' })

    console.log('✓ Waitlist signup flow verified')
    console.log(`  Position: ${positionText}`)
    console.log(`  Referral link: ${referralLink}`)
  })
})
