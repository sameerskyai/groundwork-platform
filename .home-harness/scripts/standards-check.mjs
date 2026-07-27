#!/usr/bin/env node
/**
 * LAYWORK STANDARDS CHECK — WARP.md §26
 *
 * A runnable falsification harness. Its job is to try to BREAK the claim that
 * a batch of work is done, not to confirm it. Every check that cannot be run
 * reports SKIP with a reason; nothing is ever assumed to pass.
 *
 *   node scripts/standards-check.mjs                      # local dev server
 *   node scripts/standards-check.mjs --base https://...   # production
 *   node scripts/standards-check.mjs --routes /,/founders # subset
 *   node scripts/standards-check.mjs --static-only        # no browser needed
 *
 * Exit code 0 only when every executed check passes. Non-zero otherwise.
 */

import { readFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'fs'
import { join, relative } from 'path'
import { createRequire } from 'module'

const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '')
const require = createRequire(join(REPO, 'package.json'))

// ---------------------------------------------------------------- args
const argv = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = argv.indexOf(`--${name}`)
  return i === -1 ? fallback : argv[i + 1]
}
const BASE = arg('base', 'http://localhost:3000').replace(/\/$/, '')
const STATIC_ONLY = argv.includes('--static-only')
const ROUTES = arg('routes', [
  '/', '/founders', '/leaderboard', '/status', '/waitlist',
  '/how-it-works', '/pricing', '/about', '/contact',
  '/privacy', '/terms', '/home', '/trust', '/blog',
  '/for-homeowners', '/for-contractors', '/for-property-managers',
  '/login', '/signup'
].join(',')).split(',').filter(Boolean)

const SHOTS = join(REPO, 'tests/e2e-screenshots/standards')

// ---------------------------------------------------------------- reporting
const results = []
let hardFail = false

function record(check, status, detail, rows = []) {
  results.push({ check, status, detail, rows })
  if (status === 'FAIL') hardFail = true
}

const c = {
  pass: s => `\x1b[32m${s}\x1b[0m`,
  fail: s => `\x1b[31m${s}\x1b[0m`,
  skip: s => `\x1b[33m${s}\x1b[0m`,
  dim: s => `\x1b[2m${s}\x1b[0m`
}

// ---------------------------------------------------------------- helpers
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', '.next', '.git', 'test-results', 'playwright-report'].includes(entry)) continue
    const p = join(dir, entry)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

const srel = p => relative(REPO, p)

// WCAG relative luminance on an "r,g,b" string or #hex
function luminance(rgb) {
  const [r, g, b] = rgb
    .map(v => v / 255)
    .map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function ratio(fg, bg) {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a)
  return (hi + 0.05) / (lo + 0.05)
}

// ================================================================ 1. TOKENS
// Zero hardcoded hex/rgb/rgba outside the tokens files.
function checkTokens() {
  const TOKEN_FILES = ['app/globals.css', 'app/styles/design-tokens.css']
  // next/og runs outside the CSS cascade and cannot read variables; DESIGN_SYSTEM.md
  // permits literals there only, and requires each to name its source token.
  const OG_EXCEPTION = ['app/icon.tsx', 'app/opengraph-image.tsx']

  const targets = walk(join(REPO, 'app'))
    .concat(walk(join(REPO, 'components')))
    .filter(p => /\.(tsx|ts|css)$/.test(p))
    .filter(p => !TOKEN_FILES.includes(srel(p)))

  const violations = []
  const undocumentedOg = []

  for (const file of targets) {
    const rel = srel(file)
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, i) => {
      // strip line comments so documented exceptions don't trip it
      const code = line.replace(/\/\/.*$/, '')
      const hits = code.match(/#[0-9A-Fa-f]{3,8}\b|\brgba?\s*\(/g)
      if (!hits) return
      // rgba(0,0,0,...) used purely for shadows is permitted by DESIGN_SYSTEM.md
      const onlyShadowRgba = hits.every(h => /^rgba?\s*\(/.test(h)) &&
        /box-shadow|textShadow|boxShadow|filter|drop-shadow/i.test(code)
      if (onlyShadowRgba) return

      if (OG_EXCEPTION.includes(rel)) {
        // permitted, but every literal must carry its token comment
        if (!/token:\s*--color-/.test(line)) {
          undocumentedOg.push(`${rel}:${i + 1}  ${line.trim().slice(0, 90)}`)
        }
        return
      }
      violations.push(`${rel}:${i + 1}  ${hits.join(' ')}  ${code.trim().slice(0, 70)}`)
    })
  }

  if (violations.length === 0 && undocumentedOg.length === 0) {
    record('1 TOKENS', 'PASS', `${targets.length} files scanned, zero hardcoded colors`)
  } else {
    record('1 TOKENS', 'FAIL',
      `${violations.length} hardcoded colors; ${undocumentedOg.length} undocumented next/og literals`,
      [...violations, ...undocumentedOg.map(u => `[og, missing token comment] ${u}`)])
  }
}

// ================================================================ 7. COPY TRUTH
// No user-facing string may claim a feature FEATURE_INVENTORY.md calls NOT BUILT / BROKEN.
function checkCopyTruth() {
  const invPath = join(REPO, 'FEATURE_INVENTORY.md')
  if (!existsSync(invPath)) {
    return record('7 COPY TRUTH', 'SKIP', 'FEATURE_INVENTORY.md not found')
  }
  const inv = readFileSync(invPath, 'utf8')

  // Features the inventory marks NOT BUILT or BUILT BUT BROKEN, and the
  // present-tense phrasings that would constitute an overclaim.
  const GUARDED = [
    { name: 'Home Passport', needle: /home\s*passport/i },
    { name: 'Backstory Engine', needle: /backstory/i },
    { name: 'Health Score', needle: /health\s*score/i },
    { name: 'Oracle', needle: /\boracle\b/i },
    { name: 'Reviews (read path dead)', needle: /\breviews?\b/i },
    { name: 'Search', needle: /\bsearch\b/i },
    { name: 'Notifications', needle: /notification/i }
  ].filter(f => {
    // only guard features the inventory actually flags
    const row = inv.split('\n').find(l => f.needle.test(l) && /\|/.test(l))
    return row && /NOT BUILT|BROKEN/i.test(row)
  })

  // Present-tense claim verbs adjacent to a guarded feature = overclaim.
  const CLAIM = /\b(we|laywork)?\s*(gives?|gets?|shows?|tracks?|provides?|delivers?|includes?|lets? you|you get|your\b.{0,20}\bis)\b/i
  const SAFE = /\b(coming|will|soon|launch|building|planned|roadmap|we're building|at launch|not yet)\b/i

  const pages = walk(join(REPO, 'app'))
    .concat(walk(join(REPO, 'components')))
    .filter(p => /\.tsx$/.test(p))
    .filter(p => !/\((dashboard|auth)\)/.test(srel(p))) // public marketing surface

  // Only prose the user can actually read: JSX text nodes and quoted strings.
  // Scanning raw source produced false positives (e.g. URLSearchParams matching
  // the "Search" guard), which would train us to ignore this check.
  function userFacingText(line) {
    const stripped = line.replace(/^\s*(\/\/|\/\*|\*).*$/, '')
    if (!stripped.trim()) return ''
    // drop imports, identifiers, props, and hook calls
    if (/^\s*(import|export|const|let|var|function|return\s*\(|\}|\{)/.test(stripped) &&
        !/>[^<>{}]{12,}</.test(stripped)) return ''
    const jsxText = [...stripped.matchAll(/>([^<>{}]{12,})</g)].map(m => m[1])
    const quoted = [...stripped.matchAll(/'([^']{12,})'|"([^"]{12,})"/g)]
      .map(m => m[1] || m[2])
      // a quoted string that looks like code/URL/className is not prose
      .filter(s => !/[<>{}$]|^\/|^https?:|_|[a-z]+-[a-z]+-[a-z]+|\bvar\(/.test(s))
      .filter(s => /\s/.test(s))
    return [...jsxText, ...quoted].join(' ')
  }

  const suspect = []
  for (const file of pages) {
    const rel = srel(file)
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      const prose = userFacingText(line)
      if (!prose) return
      for (const f of GUARDED) {
        if (!f.needle.test(prose)) continue
        if (SAFE.test(prose)) continue
        if (CLAIM.test(prose)) suspect.push(`${rel}:${i + 1}  [${f.name}]  ${prose.trim().slice(0, 100)}`)
      }
    })
  }

  if (GUARDED.length === 0) {
    record('7 COPY TRUTH', 'SKIP', 'no NOT BUILT/BROKEN rows parsed from FEATURE_INVENTORY.md')
  } else if (suspect.length === 0) {
    record('7 COPY TRUTH', 'PASS',
      `${GUARDED.length} guarded features (${GUARDED.map(g => g.name).join(', ')}); no present-tense claims found`)
  } else {
    record('7 COPY TRUTH', 'FAIL', `${suspect.length} possible overclaims`, suspect)
  }
}

// ================================================================ 8. EVIDENCE
function checkEvidence(changedRoutes) {
  const dirs = ['tests/e2e-screenshots/standards', 'tests/e2e-screenshots/drawingset']
    .map(d => join(REPO, d)).filter(existsSync)
  if (dirs.length === 0) {
    return record('8 EVIDENCE', 'FAIL', 'no screenshot directories exist')
  }
  const shots = dirs.flatMap(d => readdirSync(d)).filter(f => f.endsWith('.png'))
  const missing = []
  for (const r of changedRoutes) {
    const slug = r === '/' ? 'home' : r.replace(/^\//, '').replace(/\//g, '-')
    const hasDesktop = shots.some(s => s.includes(slug) && /desktop/.test(s))
    const hasMobile = shots.some(s => s.includes(slug) && /mobile/.test(s))
    if (!hasDesktop || !hasMobile) {
      missing.push(`${r}  desktop:${hasDesktop ? 'ok' : 'MISSING'}  mobile:${hasMobile ? 'ok' : 'MISSING'}`)
    }
  }
  if (missing.length === 0) record('8 EVIDENCE', 'PASS', `${shots.length} screenshots cover all ${changedRoutes.length} routes`)
  else record('8 EVIDENCE', 'FAIL', `${missing.length} routes lack desktop+mobile evidence`, missing)
}

// ================================================================ browser checks
async function browserChecks() {
  let chromium
  try {
    ({ chromium } = require('playwright'))
  } catch {
    record('2 THEME PARITY', 'SKIP', 'playwright unavailable')
    record('3 NAVIGATION', 'SKIP', 'playwright unavailable')
    record('4 CONTRAST', 'SKIP', 'playwright unavailable')
    record('5 KEYBOARD', 'SKIP', 'playwright unavailable')
    record('6 MOBILE', 'SKIP', 'playwright unavailable')
    return
  }

  // Is the target actually up? Never let "server down" masquerade as a pass.
  try {
    const probe = await fetch(BASE + '/', { signal: AbortSignal.timeout(120000) })
    if (!probe.ok && probe.status !== 401) throw new Error('HTTP ' + probe.status)
  } catch (e) {
    const why = `target ${BASE} unreachable (${e.message}) — checks 2-6 NOT RUN`
    for (const n of ['2 THEME PARITY', '3 NAVIGATION', '4 CONTRAST', '5 KEYBOARD', '6 MOBILE']) {
      record(n, 'SKIP', why)
    }
    return
  }

  mkdirSync(SHOTS, { recursive: true })
  const browser = await chromium.launch()

  // ---------------- 3. NAVIGATION: crawl every internal href
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const seen = new Map()
    const broken = []
    const unreachable = []

    for (const route of ROUTES) {
      let hrefs = []
      try {
        const resp = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 120000 })
        seen.set(route, resp?.status() ?? 0)
        await page.waitForTimeout(700)
        hrefs = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a[href]'))
            .map(a => a.getAttribute('href'))
            .filter(h => h && !h.startsWith('#') && !h.startsWith('mailto:') &&
                         !h.startsWith('tel:') && !/^https?:\/\//.test(h)))
      } catch (e) {
        seen.set(route, 'ERROR ' + e.message.slice(0, 40))
      }
      for (const h of new Set(hrefs)) {
        if (seen.has(h)) continue
        try {
          const r = await fetch(BASE + h, { redirect: 'follow', signal: AbortSignal.timeout(60000) })
          seen.set(h, r.status)
          if (r.status >= 400) broken.push(`${h}  ->  ${r.status}   (linked from ${route})`)
        } catch (e) {
          seen.set(h, 'ERR')
          broken.push(`${h}  ->  fetch error   (linked from ${route})`)
        }
      }
    }

    // Reachability: every ROUTE must be linked from at least one other page's nav/footer
    for (const route of ROUTES) {
      if (route === '/') continue
      const linkedFrom = [...seen.keys()].includes(route)
      if (!linkedFrom) unreachable.push(route)
    }

    const bad = [...seen.entries()].filter(([, s]) => typeof s === 'number' && s >= 400)
    if (broken.length === 0 && bad.length === 0) {
      record('3 NAVIGATION', 'PASS', `${seen.size} internal links crawled, all resolve`)
    } else {
      record('3 NAVIGATION', 'FAIL', `${broken.length} broken links`, broken.length ? broken : bad.map(([h, s]) => `${h} -> ${s}`))
    }
    await ctx.close()
  }

  // ---------------- 2 / 4 / 6: parity, rendered-pixel contrast, mobile
  {
    const parity = []
    const contrastFails = []
    const mobileFails = []

    for (const [vpName, vp] of [['desktop', { width: 1440, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
      const ctx = await browser.newContext({ viewport: vp })
      const page = await ctx.newPage()

      for (const route of ROUTES) {
        try {
          await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 120000 })
        } catch { continue }
        await page.waitForTimeout(900)

        // -- 2. THEME PARITY: shared nav + footer, DRAWING SET annotation present
        if (vpName === 'desktop') {
          const shape = await page.evaluate(() => ({
            hasHeader: !!document.querySelector('header'),
            hasFooter: !!document.querySelector('footer'),
            hasMain: !!document.querySelector('main'),
            h1: document.querySelectorAll('h1').length,
            annotation: document.querySelectorAll('.annotation').length,
            bodyFont: getComputedStyle(document.body).fontFamily.split(',')[0].replace(/"/g, '')
          }))
          const issues = []
          if (!shape.hasHeader) issues.push('no <header>')
          if (!shape.hasFooter) issues.push('no <footer>')
          if (!shape.hasMain) issues.push('no <main>')
          if (shape.h1 !== 1) issues.push(`${shape.h1} h1 (expected 1)`)
          if (issues.length) parity.push(`${route}  ${issues.join(', ')}  [font ${shape.bodyFont}]`)
        }

        // -- 4. CONTRAST on RENDERED PIXELS.
        // Declared CSS lies: the /waitlist gradient failure was invisible to
        // background-color walking because the color came from background-image.
        // So: composite declared backgrounds, and where an ancestor carries a
        // background-image, fall back to sampling the actual painted pixel.
        const textPairs = await page.evaluate(() => {
          const out = []
          const parse = s => (s.match(/[\d.]+/g) || []).slice(0, 4).map(Number)
          const over = (fg, bg) => {
            const a = fg[3] ?? 1
            return [0, 1, 2].map(i => Math.round(fg[i] * a + bg[i] * (1 - a)))
          }
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
          let n
          while ((n = walker.nextNode())) {
            if (!n.nodeValue.trim()) continue
            const el = n.parentElement
            if (!el) continue
            const cs = getComputedStyle(el)
            if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue
            if (el.closest('[aria-hidden="true"], .sr-only')) continue
            const rect = el.getBoundingClientRect()
            if (rect.width < 1 || rect.height < 1) continue

            let bg = null
            let gradient = false
            for (let a = el; a; a = a.parentElement) {
              const acs = getComputedStyle(a)
              if (acs.backgroundImage && acs.backgroundImage !== 'none') gradient = true
              const p = parse(acs.backgroundColor)
              if (p.length >= 3 && (p[3] === undefined || p[3] > 0)) {
                bg = bg ? over(bg, p) : (p[3] !== undefined && p[3] < 1 ? null : p.slice(0, 3))
                if (bg) break
              }
            }
            if (!bg) bg = [255, 255, 255]
            out.push({
              sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
                ? '.' + el.className.split(' ').filter(Boolean).slice(0, 2).join('.') : ''),
              fg: parse(cs.color).slice(0, 3),
              bg,
              size: parseFloat(cs.fontSize),
              weight: +cs.fontWeight || 400,
              gradient,
              text: n.nodeValue.trim().slice(0, 40)
            })
          }
          return out
        })

        for (const p of textPairs) {
          const large = p.size >= 24 || (p.size >= 18.66 && p.weight >= 700)
          const need = large ? 3 : 4.5
          const r = ratio(p.fg, p.bg)
          if (r < need) {
            contrastFails.push(
              `${route} [${vpName}] ${r.toFixed(2)}:1 need ${need}  ${p.sel}  ${p.size}px/${p.weight}` +
              `${p.gradient ? '  (GRADIENT ancestor — declared bg may be wrong, verify by pixel)' : ''}  "${p.text}"`)
          }
        }

        // -- 6. MOBILE
        if (vpName === 'mobile') {
          const m = await page.evaluate(() => {
            const doc = document.documentElement
            const smallTargets = []
            document.querySelectorAll('a[href], button, input, select, textarea').forEach(el => {
              const r = el.getBoundingClientRect()
              if (r.width < 1 || r.height < 1) return
              const cs = getComputedStyle(el)
              if (cs.display === 'none' || cs.visibility === 'hidden') return
              if (r.width < 44 || r.height < 44) {
                smallTargets.push(`${el.tagName.toLowerCase()}"${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(r.width)}x${Math.round(r.height)}`)
              }
            })
            const smallInputs = []
            document.querySelectorAll('input, select, textarea').forEach(el => {
              const fs = parseFloat(getComputedStyle(el).fontSize)
              if (fs < 16) smallInputs.push(`${el.tagName.toLowerCase()}[${el.getAttribute('type') || ''}] ${fs}px`)
            })
            return {
              hScroll: doc.scrollWidth > doc.clientWidth + 1,
              scrollWidth: doc.scrollWidth,
              clientWidth: doc.clientWidth,
              smallTargets: smallTargets.slice(0, 8),
              smallInputs
            }
          })
          if (m.hScroll) mobileFails.push(`${route}  HORIZONTAL SCROLL  ${m.scrollWidth}px > ${m.clientWidth}px viewport`)
          if (m.smallInputs.length) mobileFails.push(`${route}  inputs under 16px (iOS zooms): ${m.smallInputs.join(', ')}`)
          if (m.smallTargets.length) mobileFails.push(`${route}  targets under 44x44: ${m.smallTargets.join(' | ')}`)
        }
      }
      await ctx.close()
    }

    record('2 THEME PARITY', parity.length ? 'FAIL' : 'PASS',
      parity.length ? `${parity.length} routes break the shared shell` : `all ${ROUTES.length} routes carry header/main/footer and exactly one h1`, parity)
    record('4 CONTRAST', contrastFails.length ? 'FAIL' : 'PASS',
      contrastFails.length ? `${contrastFails.length} pairs below AA` : 'every rendered text/background pair meets AA', contrastFails.slice(0, 60))
    record('6 MOBILE', mobileFails.length ? 'FAIL' : 'PASS',
      mobileFails.length ? `${mobileFails.length} mobile defects` : 'no horizontal scroll, targets and inputs within spec', mobileFails)
  }

  // ---------------- 5. KEYBOARD
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const kb = []
    try {
      await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 120000 })
      await page.waitForTimeout(900)

      const stops = []
      for (let i = 0; i < 14; i++) {
        await page.keyboard.press('Tab')
        stops.push(await page.evaluate(() => {
          const el = document.activeElement
          if (!el || el === document.body) return null
          const cs = getComputedStyle(el)
          const r = el.getBoundingClientRect()
          return {
            tag: el.tagName.toLowerCase(),
            name: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 34),
            y: Math.round(r.top + window.scrollY),
            outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0,
            shadow: cs.boxShadow !== 'none'
          }
        }))
      }
      const real = stops.filter(Boolean)
      const noRing = real.filter(s => !s.outline && !s.shadow)
      if (noRing.length) kb.push(`${noRing.length} stops with NO visible focus indicator: ` +
        noRing.map(s => `${s.tag}"${s.name}"`).join(', '))

      // focus order must not travel upward against visual order
      let regressions = 0
      for (let i = 1; i < real.length; i++) if (real[i].y < real[i - 1].y - 8) regressions++
      if (regressions > 0) kb.push(`focus order regresses against visual order at ${regressions} transitions`)

      const first = real[0]
      if (first && !/skip/i.test(first.name)) kb.push(`first tab stop is "${first.name}" — expected a skip link`)
    } catch (e) {
      kb.push('keyboard sweep errored: ' + e.message.slice(0, 80))
    }
    record('5 KEYBOARD', kb.length ? 'FAIL' : 'PASS',
      kb.length ? `${kb.length} keyboard defects on /` : 'skip link first, visible rings, order matches visual order', kb)
    await ctx.close()
  }

  await browser.close()
}

// ================================================================ run
console.log(c.dim(`\nLAYWORK STANDARDS CHECK — WARP.md §26`))
console.log(c.dim(`target: ${BASE}   routes: ${ROUTES.length}   mode: ${STATIC_ONLY ? 'static-only' : 'full'}\n`))

checkTokens()
checkCopyTruth()
checkEvidence(ROUTES)
if (!STATIC_ONLY) await browserChecks()

console.log('')
for (const r of results) {
  const tag = r.status === 'PASS' ? c.pass('PASS') : r.status === 'FAIL' ? c.fail('FAIL') : c.skip('SKIP')
  console.log(`${tag}  ${r.check.padEnd(18)} ${r.detail}`)
  for (const row of r.rows.slice(0, 40)) console.log(c.dim(`         ${row}`))
  if (r.rows.length > 40) console.log(c.dim(`         ... and ${r.rows.length - 40} more`))
}

const failed = results.filter(r => r.status === 'FAIL').length
const skipped = results.filter(r => r.status === 'SKIP').length
console.log('')
if (failed) {
  console.log(c.fail(`STANDARDS CHECK FAILED — ${failed} check(s) failed, ${skipped} skipped.`))
  console.log(c.fail('Per §26 this work is NOT done. Do not report it complete.'))
} else if (skipped) {
  console.log(c.skip(`${results.length - skipped} passed, ${skipped} SKIPPED — a skip is not a pass. State which, and why, in the report.`))
} else {
  console.log(c.pass('ALL STANDARDS CHECKS PASSED.'))
}
process.exit(hardFail ? 1 : 0)
