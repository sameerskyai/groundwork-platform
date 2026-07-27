/**
 * Gate 4 / P6 verification: drives the real authenticated UI with the repo's
 * Playwright and captures desktop + mobile evidence for each fix.
 *
 * Usage: node scripts/_p6shots.mjs [baseUrl]
 */
import { chromium } from '@playwright/test'
import fs from 'fs'
import path from 'path'

const BASE = process.argv[2] || 'http://localhost:3000'
const OUT = path.join(process.cwd(), 'tests/e2e-screenshots/drawingset')
fs.mkdirSync(OUT, { recursive: true })

const EMAIL = 'founder.demo@example.com'
const PASSWORD = 'FounderDemo123!'
const PROJECT = '610c1a13-a8cb-4dfb-be00-be4488beb04b'

const VIEWPORTS = [
  { tag: 'desktop', width: 1440, height: 900 },
  { tag: 'mobile', width: 390, height: 844 }
]

const log = (...a) => console.log('[p6]', ...a)

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.locator('input[type="email"]').first().fill(EMAIL)
  await page.locator('input[type="password"]').first().fill(PASSWORD)
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL(u => !u.pathname.includes('/login'), { timeout: 60000 })
  log('authenticated ->', page.url())
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  log('shot', file)
  return file
}

async function settle(page, ms = 2500) {
  await page.waitForTimeout(ms)
}

const results = []

for (const vp of VIEWPORTS) {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } })
  const page = await ctx.newPage()
  page.on('pageerror', e => log('PAGE ERROR', vp.tag, e.message))

  try {
    await login(page)

    // ---- dashboard (single primary CTA)
    await page.goto(`${BASE}/homeowner`, { waitUntil: 'domcontentloaded', timeout: 120000 })
    await settle(page, 5000)
    await shot(page, `p6-dashboard-${vp.tag}`)

    // ---- BUG #3: communities list, then detail LOADED
    await page.goto(`${BASE}/homeowner/communities`, { waitUntil: 'domcontentloaded' })
    await settle(page, 4000)
    await shot(page, `p6-communities-list-${vp.tag}`)

    const openBtn = page.getByRole('link', { name: /open the discussion/i }).first()
    if (await openBtn.count()) {
      await openBtn.click()
      await page.waitForURL(/\/homeowner\/communities\/[0-9a-f-]{36}/, { timeout: 30000 })
    }
    await settle(page, 4000)
    const detailUrl = page.url()
    const detailBody = await page.locator('body').innerText()
    results.push({ vp: vp.tag, check: 'community detail loaded', url: detailUrl, hasFailure: /Failed to load community/i.test(detailBody) })
    await shot(page, `p6-community-detail-${vp.tag}`)

    // empty state #1: no discussions yet
    await shot(page, `p6-empty-community-${vp.tag}`)

    // ---- BUG #5: matches reached via a back link, and with NO param at all
    await page.goto(`${BASE}/homeowner/matches`, { waitUntil: 'domcontentloaded' })
    await settle(page, 5000)
    results.push({ vp: vp.tag, check: 'matches with NO param does not bounce', url: page.url(), bounced: /\/homeowner$/.test(new URL(page.url()).pathname) })
    await shot(page, `p6-matches-noparam-${vp.tag}`)

    // now: land on matches via the dashboard's own back/nav link
    await page.goto(`${BASE}/homeowner`, { waitUntil: 'domcontentloaded' })
    await settle(page, 4000)
    const matchesNav = page.getByRole('link', { name: /^Matches$/ }).first()
    if (await matchesNav.count()) {
      await matchesNav.click()
      await settle(page, 5000)
    }
    results.push({ vp: vp.tag, check: 'nav Matches lands on matches', url: page.url() })
    await shot(page, `p6-matches-via-backlink-${vp.tag}`)

    // and the reverse: the matches page "Dashboard" back link
    const backLink = page.getByRole('link', { name: /Dashboard/ }).first()
    if (await backLink.count()) {
      await backLink.click()
      await settle(page, 3000)
      results.push({ vp: vp.tag, check: 'matches back link lands on dashboard', url: page.url() })
    }

    // ---- BUG #4: messages inbox, open a thread, send, RELOAD, still there
    await page.goto(`${BASE}/homeowner/messages`, { waitUntil: 'domcontentloaded' })
    await settle(page, 4000)
    await shot(page, `p6-messages-inbox-${vp.tag}`)

    const thread = page.locator('a[href*="/homeowner/messages/"]').first()
    if (await thread.count()) {
      await thread.click()
      await page.waitForURL(/\/homeowner\/messages\/[0-9a-f-]{36}/, { timeout: 30000 })
      await settle(page, 4000)
      await shot(page, `p6-conversation-open-${vp.tag}`)

      const stamp = `P6 persistence proof ${vp.tag} ${Date.now()}`
      const input = page.locator('#message-input')
      await input.fill(stamp)
      await page.getByRole('button', { name: /send message/i }).click()
      await settle(page, 5000)
      const afterSend = await page.locator('body').innerText()
      await shot(page, `p6-message-sent-${vp.tag}`)

      const threadUrl = page.url()
      await page.reload({ waitUntil: 'domcontentloaded' })
      await settle(page, 5000)
      const afterReload = await page.locator('body').innerText()
      await shot(page, `p6-message-after-reload-${vp.tag}`)

      results.push({
        vp: vp.tag,
        check: 'message persists across reload',
        url: threadUrl,
        stamp,
        presentAfterSend: afterSend.includes(stamp),
        presentAfterReload: afterReload.includes(stamp)
      })
    } else {
      results.push({ vp: vp.tag, check: 'message persists across reload', error: 'no thread link found' })
    }

    // ---- empty state #2: saved contractors
    await page.goto(`${BASE}/homeowner/saved`, { waitUntil: 'domcontentloaded' })
    await settle(page, 4000)
    await shot(page, `p6-empty-saved-${vp.tag}`)

    // ---- empty state #3: project checklist
    await page.goto(`${BASE}/homeowner/project?project=${PROJECT}`, { waitUntil: 'domcontentloaded' })
    await settle(page, 4000)
    await shot(page, `p6-empty-project-${vp.tag}`)
  } catch (err) {
    log('FAILED', vp.tag, err.message)
    results.push({ vp: vp.tag, fatal: err.message })
    try { await shot(page, `p6-FAILURE-${vp.tag}`) } catch {}
  } finally {
    await browser.close()
  }
}

console.log('\n===== P6 RESULTS =====')
console.log(JSON.stringify(results, null, 2))
