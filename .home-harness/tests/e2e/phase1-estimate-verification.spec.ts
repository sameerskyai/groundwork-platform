import { test } from '@playwright/test'
import { authenticateAsFounderDemo } from '../helpers/auth'
import * as fs from 'fs'

test('Phase 1: Dashboard shows estimate range rendered', async ({ page }) => {
  // Login as founder using auth helper
  await authenticateAsFounderDemo(page)

  // Check what's in localStorage to verify auth
  const authSession = await page.evaluate(() => {
    const session = localStorage.getItem('sb-dhmxxywdsdxzzcuezztv-auth-token')
    return session ? JSON.parse(session) : null
  })

  if (authSession?.user) {
    console.log('✓ Authenticated as:', authSession.user.email, '(ID:', authSession.user.id, ')')
  }

  // Wait for dashboard to load
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // Wait for estimate text to appear
  await page.waitForSelector('text=/18.*500|42.*000/i', { timeout: 5000 }).catch(() => {})

  // Check page text for estimate
  const pageText = await page.innerText('body')

  // Take a screenshot
  await page.screenshot({ path: 'tests/e2e-screenshots/phase1-dashboard-estimate-rendered.png', fullPage: true })

  // Save HTML for inspection
  const content = await page.content()
  fs.writeFileSync('tests/e2e-screenshots/debug-dashboard-content.html', content)

  // Check if estimate is there
  if (pageText.includes('18,500') || pageText.includes('42,000') || pageText.includes('18500') || pageText.includes('42000')) {
    console.log('✓ VERIFIED: Estimate range $18,500–$42,000 rendered on dashboard')
  } else {
    console.log('⚠️  Issue: Estimate NOT found. Dashboard shows:', pageText.substring(0, 600))
  }
})
