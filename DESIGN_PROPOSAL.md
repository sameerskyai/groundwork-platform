# Design Direction Proposal — Three Options

**Context:** Home services marketplace connecting homeowners (35–60) with contractors. Trust-heavy, premium polish (Airbnb/Linear). Real users, real stakes.

**Available for review:** localhost:3000 (dev server running)
- **Estimate page:** http://localhost:3000/homeowner/estimate
- **Matches page:** http://localhost:3000/homeowner/matches
- **Contractor profile:** http://localhost:3000/contractor/profile

---

## Design Option A: Modern Premium (Current Implementation)

**Brand Direction:** Deep purple-blue + serif headlines + intentional hierarchy  
**Status:** Fully implemented in design-tokens.css

### Color Palette
```css
--color-brand: oklch(58% 0.25 265);      /* Deep purple-blue — authority, trust */
--color-brand-light: oklch(72% 0.18 265);
--color-surface-primary: oklch(98% 0 0);  /* Warm off-white */
--color-text-primary: oklch(18% 0 0);     /* Near-black */
```

### Typography
- **Serif:** Crimson Text (headings) — editorial credibility
- **Sans:** System font stack — clean, modern
- **Approach:** Clear contrast between formal (headings) and approachable (body)

### Spacing & Motion
- Fluid clamp() scales responsive to viewport
- 150ms/300ms/500ms motion with purpose
- Shadows: 5 levels, subtle to pronounced

### Why This Direction
- **Trust signals:** Serif + purple reads "established, premium"
- **Contractor appeal:** Professional, not startup-ish
- **Homeowner appeal:** Editorial quality, not corporate
- **Neutral:** Works equally in light mode (no dark mode yet)

### Weaknesses
- Purple is less common in home services (warm copper is industry standard)
- Serif might feel formal to younger contractors

---

## Design Option B: Design System Skill Recommendation

**TBD after skill evaluation — would recommend:**

### Likely Direction
- Modern sans-only (Typography: Inter or Helvetica Neue)
- Neutral grays + single accent (teal or green)
- Highly scalable, Figma-friendly
- Less opinionated than Option A

### Why Consider It
- Skill trained on SaaS best practices
- Neutral enough for B2B + B2C
- Easier design handoff to non-designer team

### Weaknesses
- May feel "generic SaaS"
- Less differentiated in crowded marketplace

---

## Design Option C: Warm Copper + Dark Rust

**Brand Direction:** Industry-standard warm palette (#BF7A3A family) + earthiness  
**Palette Source:** Existing usage in previous designs

### Color Palette
```
Primary: #BF7A3A (warm copper — confidence, craft)
Dark: #0A0908 (near-black rust)
Light: #F4F0E8 (cream)
Accent: #FF6B35 (brighter orange — actions)
```

### Typography
- **Sans-only:** No serif (faster to market, less design overhead)
- **Weights:** Regular, semi-bold, bold (minimal hierarchy)
- **Approach:** Friendly, approachable, craft-forward

### Spacing & Motion
- Rounded corners (0.5rem default)
- Warmer shadows with orange tint
- 150ms transitions (fast, responsive)

### Why This Direction
- **Industry standard:** Warm metals = contractor trust
- **Warm tones:** More friendly than cool brand
- **Speed:** No serif font licensing/loading complexity
- **Existing implementation:** Partially built already

### Weaknesses
- May read as "construction company" vs. "premium marketplace"
- Less differentiated in warm-palette-heavy market
- Rounded aesthetic less "Airbnb/Linear" polish

---

## Recommendation

**Go with Option A (Modern Premium)** for the following reasons:

1. **Differentiation:** Purple-blue + serif stands out in warm-copper-dominated market
2. **Trust signals:** Editorial quality appeals to older homeowner demographic (35–60)
3. **Sustainability:** Intentional system (tokens, clamp scales) supports growth
4. **Implementation:** Fully built, tested, and committed

**Alternative:** If speed to market is critical, **Option C** (warm copper) reduces design friction and uses existing color infrastructure.

**Do not:** Choose Option B (generic SaaS) without seeing actual renders — it may not differentiate.

---

## Screenshot Intent

- **Estimate page:** Shows form clarity + hierarchy + token application
- **Matches page:** Shows interactive states + card polish + trust signals
- **Locked state:** Shows upgrade moment styling (for T5)

*Screenshots not available in CLI; recommend viewing live at localhost:3000 after founder approval.*

---

## Next Steps (Founder Decision)

1. **Approve or redirect** on one of these three directions
2. Once approved: proceed with T4–T13 using chosen palette
3. Design system is CSS-variable-only → palette swap = CSS changes only

**Design direction:** PENDING FOUNDER REVIEW
