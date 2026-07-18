# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: gate-4-walkthrough.spec.ts >> Gate 4: Founder Walkthrough >> J3: Matches page displays 3 seeded matches (80% gate excludes 0.65)
- Location: tests/e2e/gate-4-walkthrough.spec.ts:14:7

# Error details

```
TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('text=Your Matches') to be visible

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [active]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - generic [ref=e6]:
          - navigation [ref=e7]:
            - button "previous" [disabled] [ref=e8]:
              - img "previous" [ref=e9]
            - generic [ref=e11]:
              - generic [ref=e12]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e13]:
              - img "next" [ref=e14]
          - img
        - generic [ref=e16]:
          - generic [ref=e17]:
            - img [ref=e18]
            - generic "Latest available version is detected (16.2.10)." [ref=e20]: Next.js 16.2.10
            - generic [ref=e21]: Turbopack
          - img
      - dialog "Runtime TypeError" [ref=e23]:
        - generic [ref=e26]:
          - generic [ref=e27]:
            - generic [ref=e28]:
              - generic [ref=e30]: Runtime TypeError
              - generic [ref=e31]:
                - button "Copy Error Info" [ref=e32] [cursor=pointer]:
                  - img [ref=e33]
                - button "No related documentation found" [disabled] [ref=e35]:
                  - img [ref=e36]
                - button "Attach Node.js inspector" [ref=e38] [cursor=pointer]:
                  - img [ref=e39]
            - generic [ref=e48]: Cannot read properties of null (reading 'profiles')
          - generic [ref=e49]:
            - generic [ref=e50]:
              - paragraph [ref=e52]:
                - img [ref=e54]
                - generic [ref=e57]: app/(dashboard)/homeowner/matches/swipe-card.tsx (72:31) @ SwipeCard
                - button "Open in editor" [ref=e58] [cursor=pointer]:
                  - img [ref=e60]
              - generic [ref=e63]:
                - generic [ref=e64]: "70 | {/* Avatar + Name + Match Score */}"
                - generic [ref=e65]: 71 | <div className="flex gap-4">
                - generic [ref=e66]: "> 72 | {match.contractor.profiles?.avatar_url && ("
                - generic [ref=e67]: "| ^"
                - generic [ref=e68]: 73 | <img
                - generic [ref=e69]: "74 | src={match.contractor.profiles.avatar_url}"
                - generic [ref=e70]: "75 | alt={match.contractor.business_name}"
            - generic [ref=e71]:
              - generic [ref=e72]:
                - paragraph [ref=e73]:
                  - text: Call Stack
                  - generic [ref=e74]: "15"
                - button "Show 12 ignore-listed frame(s)" [ref=e75] [cursor=pointer]:
                  - text: Show 12 ignore-listed frame(s)
                  - img [ref=e76]
              - generic [ref=e78]:
                - generic [ref=e79]:
                  - text: SwipeCard
                  - button "Open SwipeCard in editor" [ref=e80] [cursor=pointer]:
                    - img [ref=e81]
                - text: app/(dashboard)/homeowner/matches/swipe-card.tsx (72:31)
              - generic [ref=e83]:
                - generic [ref=e84]:
                  - text: MatchesContent
                  - button "Open MatchesContent in editor" [ref=e85] [cursor=pointer]:
                    - img [ref=e86]
                - text: app/(dashboard)/homeowner/matches/page.tsx (253:7)
              - generic [ref=e88]:
                - generic [ref=e89]:
                  - text: MatchesPage
                  - button "Open MatchesPage in editor" [ref=e90] [cursor=pointer]:
                    - img [ref=e91]
                - text: app/(dashboard)/homeowner/matches/page.tsx (272:7)
        - generic [ref=e93]: "1"
        - generic [ref=e94]: "2"
    - generic [ref=e99] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e100]:
        - img [ref=e101]
      - generic [ref=e104]:
        - button "Open issues overlay" [ref=e105]:
          - generic [ref=e106]:
            - generic [ref=e107]: "0"
            - generic [ref=e108]: "1"
          - generic [ref=e109]: Issue
        - button "Collapse issues badge" [ref=e110]:
          - img [ref=e111]
  - generic [ref=e114]:
    - img [ref=e115]
    - heading "This page couldn’t load" [level=1] [ref=e117]
    - paragraph [ref=e118]: Reload to try again, or go back.
    - generic [ref=e119]:
      - button "Reload" [ref=e121] [cursor=pointer]
      - button "Back" [ref=e122] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | import { authenticateAsFounderDemo, getFounderProjectId } from '../helpers/auth'
  3   | import * as fs from 'fs'
  4   | import * as path from 'path'
  5   | 
  6   | const SCREENSHOTS_DIR = '/tmp/e2e-screenshots'
  7   | 
  8   | // Ensure screenshots directory exists
  9   | if (!fs.existsSync(SCREENSHOTS_DIR)) {
  10  |   fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  11  | }
  12  | 
  13  | test.describe('Gate 4: Founder Walkthrough', () => {
  14  |   test('J3: Matches page displays 3 seeded matches (80% gate excludes 0.65)', async ({ page }) => {
  15  |     // Authenticate
  16  |     await authenticateAsFounderDemo(page)
  17  |     const projectId = await getFounderProjectId()
  18  | 
  19  |     // Navigate to matches page
  20  |     await page.goto(`http://localhost:3000/homeowner/matches?project=${projectId}`)
  21  | 
  22  |     // Wait for content to load
> 23  |     await page.waitForSelector('text=Your Matches', { timeout: 10000 })
      |                ^ TimeoutError: page.waitForSelector: Timeout 10000ms exceeded.
  24  | 
  25  |     // Verify we see match count "1 of 3" (3 matches pass 80% gate, 0.65 is excluded)
  26  |     const matchCounter = await page.textContent('text=/\\d+ of 3/')
  27  |     expect(matchCounter).toContain('of 3')
  28  | 
  29  |     // Verify match cards are visible with correct scores
  30  |     const pageContent = await page.content()
  31  |     expect(pageContent).toContain('0.92') // First match (highest score)
  32  |     expect(pageContent).toContain('0.85') // Second match
  33  |     expect(pageContent).toContain('0.81') // Third match
  34  |     expect(pageContent).not.toContain('0.65') // Excluded by 80% gate
  35  | 
  36  |     // Screenshot: matches page with first card
  37  |     await page.screenshot({
  38  |       path: path.join(SCREENSHOTS_DIR, '01-matches-loaded.png'),
  39  |       fullPage: true
  40  |     })
  41  | 
  42  |     // Navigate through matches
  43  |     const heartButton = await page.locator('button:has-text("Heart"), button:has-text("Like")')
  44  |     if (await heartButton.isVisible()) {
  45  |       await heartButton.click()
  46  |       await page.waitForTimeout(500)
  47  |       await page.screenshot({
  48  |         path: path.join(SCREENSHOTS_DIR, '02-matches-second-card.png'),
  49  |         fullPage: true
  50  |       })
  51  |     }
  52  |   })
  53  | 
  54  |   test('Dashboard displays real estimate and match count', async ({ page }) => {
  55  |     await authenticateAsFounderDemo(page)
  56  | 
  57  |     // Navigate to dashboard
  58  |     await page.goto('http://localhost:3000/homeowner')
  59  | 
  60  |     // Wait for dashboard content
  61  |     await page.waitForSelector('text=Dashboard', { timeout: 10000 }).catch(() => {})
  62  | 
  63  |     // Verify estimate shows (not "—")
  64  |     const pageContent = await page.content()
  65  | 
  66  |     // Look for estimate display - should show budget range
  67  |     const hasEstimate = pageContent.includes('25') || pageContent.includes('budget') || pageContent.includes('$')
  68  |     expect(hasEstimate).toBeTruthy()
  69  | 
  70  |     // Verify match count shows (not "0")
  71  |     const hasMatchCount = pageContent.includes('3') && pageContent.includes('match')
  72  |     expect(hasMatchCount || pageContent.includes('Matches')).toBeTruthy()
  73  | 
  74  |     // Screenshot: dashboard
  75  |     await page.screenshot({
  76  |       path: path.join(SCREENSHOTS_DIR, '03-dashboard.png'),
  77  |       fullPage: true
  78  |     })
  79  |   })
  80  | 
  81  |   test('J4: Messages nav links to inbox (not empty chat)', async ({ page }) => {
  82  |     await authenticateAsFounderDemo(page)
  83  | 
  84  |     // Look for Messages nav link
  85  |     const messagesNav = await page.locator('nav a, aside a, header a').filter({ hasText: /Messages/i })
  86  |     expect(await messagesNav.count()).toBeGreaterThan(0)
  87  | 
  88  |     // Click Messages nav
  89  |     await messagesNav.first().click()
  90  | 
  91  |     // Should land on /homeowner/messages (inbox, not detail)
  92  |     await page.waitForURL('**/homeowner/messages', { timeout: 5000 })
  93  | 
  94  |     // Verify we see conversation list (not empty detail page)
  95  |     const pageContent = await page.content()
  96  |     const hasConversation = pageContent.includes('conversation') || pageContent.includes('message') || pageContent.includes('contractor')
  97  |     expect(hasConversation || (await page.locator('text=/[A-Z][a-z]+ Contractors?/').count()) > 0).toBeTruthy()
  98  | 
  99  |     // Screenshot: messages inbox
  100 |     await page.screenshot({
  101 |       path: path.join(SCREENSHOTS_DIR, '04-messages-inbox.png'),
  102 |       fullPage: true
  103 |     })
  104 |   })
  105 | 
  106 |   test('Navigation: Neighborhood links to authenticated communities (not /feed)', async ({ page }) => {
  107 |     await authenticateAsFounderDemo(page)
  108 | 
  109 |     // Look for Neighborhood nav link
  110 |     const neighborhoodNav = await page.locator('nav a, aside a, header a').filter({ hasText: /Neighborhood|Communities?/i })
  111 | 
  112 |     if (await neighborhoodNav.count() === 0) {
  113 |       test.skip()
  114 |       return
  115 |     }
  116 | 
  117 |     // Click Neighborhood nav
  118 |     await neighborhoodNav.first().click()
  119 | 
  120 |     // Should NOT show "Get started free" (logged-out header)
  121 |     const pageContent = await page.content()
  122 |     expect(pageContent).not.toContain('Get started free')
  123 | 
```