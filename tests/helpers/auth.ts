import { Page } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const DEBUG_DIR = '/tmp/e2e-debug'
if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true })
}

export async function authenticateAsFounderDemo(page: Page) {
  // Navigate to login
  await page.goto('http://localhost:3000/login')
  await page.waitForLoadState('networkidle')

  // DEBUG: Save login page HTML
  const loginContent = await page.content()
  fs.writeFileSync(path.join(DEBUG_DIR, '01-login-page.html'), loginContent)
  await page.screenshot({ path: path.join(DEBUG_DIR, '01-login-page.png'), fullPage: true })

  // Find input fields by looking at actual HTML
  const inputs = await page.locator('input').all()
  console.log(`Found ${inputs.length} input elements`)

  // Try to identify email/password fields
  let emailField = null
  let passwordField = null

  for (const input of await page.locator('input').all()) {
    const type = await input.getAttribute('type')
    const name = await input.getAttribute('name')
    const id = await input.getAttribute('id')
    console.log(`Input: type=${type}, name=${name}, id=${id}`)

    if (type === 'email' || type === 'text' && (name?.includes('email') || id?.includes('email'))) {
      emailField = input
    }
    if (type === 'password' || name?.includes('password') || id?.includes('password')) {
      passwordField = input
    }
  }

  if (!emailField) emailField = await page.locator('input[type="email"], input[type="text"]:first-of-type').first()
  if (!passwordField) passwordField = await page.locator('input[type="password"]').first()

  if (!await emailField.isVisible() || !await passwordField.isVisible()) {
    const pageContent = await page.content()
    fs.writeFileSync(path.join(DEBUG_DIR, 'login-page-content.txt'), pageContent)
    throw new Error('Email or password field not found. Debug HTML saved.')
  }

  // Fill credentials
  await emailField.fill('founder.demo@example.com')
  await passwordField.fill('FounderDemo123!')

  // DEBUG: Screenshot after fill
  await page.screenshot({ path: path.join(DEBUG_DIR, '02-login-filled.png'), fullPage: true })

  // Find submit button
  const buttons = await page.locator('button').all()
  let submitButton = null

  for (const btn of buttons) {
    const text = await btn.textContent()
    if (text?.toLowerCase().includes('sign') || text?.toLowerCase().includes('log')) {
      submitButton = btn
      break
    }
  }

  if (!submitButton) {
    submitButton = await page.locator('button[type="submit"]').first()
  }

  if (!await submitButton.isVisible()) {
    throw new Error('Submit button not found')
  }

  await submitButton.click()

  // DEBUG: Wait and screenshot after submit
  await page.waitForTimeout(2000)
  await page.screenshot({ path: path.join(DEBUG_DIR, '03-after-submit.png'), fullPage: true })

  // Wait for navigation (more lenient)
  try {
    await page.waitForURL('**/homeowner', { timeout: 10000 })
  } catch {
    const currentUrl = page.url()
    const finalContent = await page.content()
    fs.writeFileSync(path.join(DEBUG_DIR, 'final-page-content.txt'), finalContent)
    fs.writeFileSync(path.join(DEBUG_DIR, 'final-url.txt'), currentUrl)

    // If still on login after 10s, auth failed
    if (currentUrl.includes('login')) {
      throw new Error(`Auth failed, still on login. Debug files in ${DEBUG_DIR}`)
    }
  }

  await page.screenshot({ path: path.join(DEBUG_DIR, '04-authenticated.png'), fullPage: true })
  return page
}

export async function getFounderProjectId() {
  return '469d18b1-9725-48b9-a33a-722dda804fea'
}
