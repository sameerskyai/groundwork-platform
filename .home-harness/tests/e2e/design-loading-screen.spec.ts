import { test, expect, devices, type Page } from '@playwright/test'

const URL = 'http://localhost:3000/dev/loading-preview'

// The exit transition is only 550ms -- Playwright's waitForSelector polling
// interval is too coarse to reliably land inside that window, so poll the
// attribute directly via evaluate() for tighter round-trip latency.
async function waitForLoadingState(page: Page, state: string, timeoutMs = 5000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const current = await page.evaluate(
      () => document.querySelector('[data-loading-state]')?.getAttribute('data-loading-state')
    )
    if (current === state) return
  }
  throw new Error(`Timed out waiting for data-loading-state="${state}"`)
}

test.describe('Design: Loading Screen', () => {
  test('desktop — 4-point sequence + measured duration', async ({ page }) => {
    const start = Date.now()
    await page.goto(URL)

    // Point 1: start (immediately after load, before drawing progresses).
    await page.screenshot({ path: 'tests/e2e-screenshots/loading-1-start-desktop.png' })

    // Point 2: mid-draw.
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'tests/e2e-screenshots/loading-2-mid-draw-desktop.png' })

    // Point 3: wordmark visible.
    await page.waitForSelector('[data-loading-state="wordmark-visible"]', { timeout: 5000 })
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'tests/e2e-screenshots/loading-3-wordmark-desktop.png' })

    // Point 4: exit in progress.
    await waitForLoadingState(page, 'exiting')
    await page.waitForTimeout(150)
    await page.screenshot({ path: 'tests/e2e-screenshots/loading-4-exit-desktop.png' })

    await page.waitForSelector('[data-loading-state="complete"]', { timeout: 5000 })
    const totalMs = Date.now() - start
    console.log(`MEASURED total sequence duration (desktop): ${totalMs}ms`)
    expect(totalMs).toBeLessThan(3500) // entrance 1.8s + hold 0.3s + exit 0.55s + test overhead
  })

  test('mobile — 4-point sequence', async ({ browser }) => {
    const context = await browser.newContext({ ...devices['iPhone 14'] })
    const page = await context.newPage()

    await page.goto(URL)
    await page.screenshot({ path: 'tests/e2e-screenshots/loading-1-start-mobile.png' })

    await page.waitForTimeout(500)
    await page.screenshot({ path: 'tests/e2e-screenshots/loading-2-mid-draw-mobile.png' })

    await page.waitForSelector('[data-loading-state="wordmark-visible"]', { timeout: 5000 })
    await page.waitForTimeout(200)
    await page.screenshot({ path: 'tests/e2e-screenshots/loading-3-wordmark-mobile.png' })

    await waitForLoadingState(page, 'exiting')
    await page.waitForTimeout(150)
    await page.screenshot({ path: 'tests/e2e-screenshots/loading-4-exit-mobile.png' })

    await page.waitForSelector('[data-loading-state="complete"]', { timeout: 5000 })
    await context.close()
  })

  test('reduced motion — static blueprint, fades at 400ms', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()

    const start = Date.now()
    await page.goto(URL)
    await page.screenshot({ path: 'tests/e2e-screenshots/loading-reduced-motion-static.png' })

    await page.waitForSelector('[data-loading-state="complete"]', { timeout: 3000 })
    const totalMs = Date.now() - start
    console.log(`MEASURED reduced-motion duration: ${totalMs}ms`)
    expect(totalMs).toBeLessThan(1200)

    await context.close()
  })

  test('isolation — existing routes unaffected', async ({ page }) => {
    const homeRes = await page.goto('http://localhost:3000/waitlist')
    expect(homeRes?.status()).toBeLessThan(400)
    // LoadingScreen must not be present on an existing route.
    await expect(page.locator('[data-loading-state]')).toHaveCount(0)
  })
})
