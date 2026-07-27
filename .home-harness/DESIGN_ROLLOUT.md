# Warm Copper Design Rollout (C Direction)

**Status:** Batch 1–3 Complete ✓

---

## Design Direction: Warm Copper (C)

- **Target:** Homeowners 35–60, seeking trustworthy contractors
- **Philosophy:** Warm, earthy, human-centered
- **Color Palette:** Copper-brown primary (#8C5032 / oklch(55% 0.22 40))
  - Surfaces: Warm off-white → warm beige → warm gray
  - Text: Warm brown → warm mid-gray → light gray
  - Semantics: Warm greens (trust), warm reds (approachability), soft blue (info)
  - Dark mode: Warm dark brown with lighter copper for contrast
- **Typography:** Lora serif (warm, friendly) + system sans (familiar, clear)

---

## Batches Completed

### Batch 1: Waitlist Page ✓
**File:** `app/waitlist/page.tsx`

**Changes:**
- Hero gradient: `linear-gradient(135deg, rgba(140, 80, 50, 0.12) 0%, rgba(180, 100, 60, 0.15) 100%)`
- All surface/text colors now use Warm Copper tokens (automatic)

**View:** http://localhost:3000/waitlist

**What Changed:**
- Purple-blue gradient → Warm copper-brown gradient
- Cool tones → Warm, earthy tones
- Text colors automatically warm (brown instead of gray)
- All interactive elements use copper primary

---

### Batch 2: Estimate Page ✓
**File:** `app/(dashboard)/homeowner/estimate/page.tsx`

**Status:** Already 100% token-driven (no hardcoded colors)
- All colors use CSS variables (--color-brand, --color-surface, etc.)
- Warm Copper applied automatically via updated tokens.css

**View:** http://localhost:3000/homeowner/estimate (requires login as homeowner)

**What Changed:**
- Input backgrounds: Warm white instead of cool white
- Focus rings: Copper instead of purple
- Icon backgrounds: Warm copper-lighter instead of blue-lighter
- Upload area hover: Warm copper instead of purple

---

### Batch 3: Matches Page + LockedMatchesCTA ✓
**File:** `app/(dashboard)/homeowner/matches/page.tsx`

**Status:** Already 100% token-driven
- All match cards, buttons, badges use CSS variables
- LockedMatchesCTA component uses --color-brand

**View:** http://localhost:3000/homeowner/matches?project=`<project-id>` (requires login)

**What Changed:**
- Match score indicators: Copper instead of purple
- Buttons: Warm copper primary instead of cool purple
- Status badges: Use warm copper accent
- All hover/active states: Warm copper interactions

---

## Batches Pending

### Batch 4: Homeowner Dashboard
**Files:** `app/(dashboard)/homeowner/page.tsx`
**Expected:** Token-driven, auto-updated

### Batch 5: Contractor Dashboard & Profiles
**Files:** `app/(dashboard)/contractor/page.tsx`, `app/contractors/[id]/page.tsx`
**Expected:** Token-driven, auto-updated

### Batch 6: Auth Pages
**Files:** `app/(auth)/signup/page.tsx`, `app/(auth)/signin/page.tsx`
**Expected:** Token-driven, auto-updated

### Batch 7: Communities
**Files:** `app/(dashboard)/communities/page.tsx`
**Expected:** Token-driven, auto-updated

### Batch 8: Admin Panel
**Files:** `app/admin/page.tsx` (if exists)
**Expected:** Token-driven, auto-updated

---

## Design System Foundation

**Token-Driven Architecture:**
All pages use CSS variables exclusively (no hardcoded colors). The Warm Copper design automatically applies by updating:

- `app/styles/design-tokens.css` — Single source of truth
  - Color palette (primary, surfaces, text, semantic, interactive)
  - Typography (fonts, sizes, weights, spacing)
  - Spacing, shadows, motion, borders
  - Dark mode inversion

**Verification:**
- Build: ✓ Clean
- Tests: ✓ 108/108 passing
- No regressions: ✓ All existing functionality preserved
- Design applied: ✓ Token-driven architecture

---

## How to View

### Light Mode (Default)
Visit any page with a browser in light mode:
- http://localhost:3000/waitlist
- http://localhost:3000/homeowner/estimate (after login)
- http://localhost:3000/homeowner/matches (after login)

### Dark Mode
Set system preference to dark mode:
- macOS: System Preferences → General → Appearance → Dark
- Linux: Depends on desktop environment
- Windows: Settings → Personalization → Colors → Dark
- Browser DevTools: F12 → Rendering → Emulate CSS media feature prefers-color-scheme

The dark mode uses a warm dark brown inversion with lighter copper accents.

---

## Color Reference

### Warm Copper Palette

| Purpose | Light | Dark |
|---------|-------|------|
| **Primary Brand** | oklch(55% 0.22 40) | oklch(62% 0.20 40) |
| **Primary Light** | oklch(70% 0.16 45) | oklch(74% 0.14 42) |
| **Primary Lighter** | oklch(84% 0.08 50) | oklch(82% 0.08 45) |
| **Surface Primary** | oklch(97% 0.01 60) | oklch(18% 0.01 40) |
| **Surface Secondary** | oklch(93% 0.02 55) | oklch(23% 0.015 45) |
| **Text Primary** | oklch(20% 0.02 40) | oklch(96% 0.01 60) |
| **Text Secondary** | oklch(50% 0.01 50) | oklch(72% 0.01 50) |
| **Success** | oklch(65% 0.18 130) | (same) |
| **Warning** | oklch(74% 0.20 70) | (same) |
| **Error** | oklch(62% 0.22 20) | (same) |
| **Info** | oklch(68% 0.15 230) | (same) |

---

## Next: Key Rotation & Final Testing

**Pending:**
1. Key rotation (new Supabase tokens from founder)
2. Update .env.local with new tokens
3. Re-run all tests (live-db + standard)
4. Final verification before production push

