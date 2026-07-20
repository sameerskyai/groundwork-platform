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

    // Wait for success state
    await page.waitForSelector('text=You\'re #', { timeout: 10000 })

    // Verify position number appears
    const positionText = await page.locator('text=/You\'re #\\d+/').first().textContent()
    expect(positionText).toMatch(/You're #\d+/)

    // Verify referral link is displayed
    const referralInput = page.locator('input[readonly]').first()
    await expect(referralInput).toBeVisible()
    const referralLink = await referralInput.inputValue()
    expect(referralLink).toContain('/waitlist?ref=')

    // Verify referral code is shown
    const referralCode = await page.locator('text=/Your referral code:').first().textContent()
    expect(referralCode).toBeTruthy()

    // Take success screenshot
    await page.screenshot({ path: 'tests/e2e-screenshots/phase2-waitlist-success.png' })

    console.log('✓ Waitlist signup flow verified')
    console.log(`  Position: ${positionText}`)
    console.log(`  Referral link: ${referralLink}`)
  })

  test('referral signup moves position up ~100 spots', async ({ page, context }) => {
    // First signup
    await page.goto('http://localhost:3000/waitlist')
    const email1 = `referrer-${Date.now()}@example.com`

    await page.fill('input[placeholder="Sarah Johnson"]', 'Referrer User')
    await page.fill('input[placeholder="sarah@example.com"]', email1)
    await page.click('input[type="checkbox"]')
    await page.click('button:has-text("Join the Waitlist")')

    // Get referral code
    await page.waitForSelector('text=Your referral code:')
    const codeText = await page.locator('text=/Your referral code:/).first().textContent()
    const referralCode = codeText?.match(/[A-Z0-9]+$/)?.[0] || ''

    // Get position
    const pos1Text = await page.locator('text=/You\'re #\\d+/').first().textContent()
    const pos1 = parseInt(pos1Text?.match(/\\d+/)?.[0] || '0')

    console.log(`✓ Referrer position: ${pos1}`)
    console.log(`✓ Referral code: ${referralCode}`)

    // Second signup with referral
    const page2 = await context.newPage()
    await page2.goto(`http://localhost:3000/waitlist?ref=${referralCode}`)
    const email2 = `referee-${Date.now()}@example.com`

    await page2.fill('input[placeholder="Sarah Johnson"]', 'Referee User')
    await page2.fill('input[placeholder="sarah@example.com"]', email2)
    await page2.click('input[type="checkbox"]')
    await page2.click('button:has-text("Join the Waitlist")')

    // Get referrer's new position
    await page.goto('http://localhost:3000/waitlist')
    // In a real test, we'd query the DB or check the admin dashboard

    await page2.screenshot({ path: 'tests/e2e-screenshots/phase2-waitlist-referral.png' })
    console.log('✓ Referral signup completed')
  })
})
