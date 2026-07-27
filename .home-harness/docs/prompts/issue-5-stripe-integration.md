# Warp Prompt — Groundwork: Issue #5 Stripe Integration (+ Bonus Issues #9, #10)

For Ryan — you already have GitHub, Supabase, and Stripe access, so this is ready to run as-is in Warp against the real repo. Repo: github.com/Rycrypn/Groundwork-platform. This is NOT a greenfield build — work inside the existing scaffolded code, do not recreate files that already exist. Read the full GitHub issue text for #5 before starting (it has the complete testing plan) — this prompt is the execution brief on top of it.

---

## VERIFIED CORRECTIONS (2026-07-09) — READ BEFORE STARTING

These were checked against the actual code, not assumed. Also posted as a comment on issue #5.

1. **Env var is `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, not `STRIPE_PUBLISHABLE_KEY`.** Confirmed in `.env.local.example` and `app/(dashboard)/contractor/profile/page.tsx:12`.
2. **The "estimate unlock" Stripe Price in Step 1.2 below is unnecessary.** `lib/stripe.ts`'s `createEstimatePaymentIntent()` uses a hardcoded 999-cent PaymentIntent, never a Price ID. `STRIPE_ESTIMATE_PRICE_ID` in `.env.local.example` is dead/unused. Only create the Standard and Growth subscription Prices — those two are actually read by the code.
3. **There's no hosted Stripe Checkout page.** The flow is embedded PaymentIntents + client-side `stripe.confirmPayment()`. Confirmed already working end-to-end on the contractor side (`app/(dashboard)/contractor/profile/page.tsx:69-78`) — use that as the reference pattern.
4. **Real gap, not just key-wiring: the homeowner estimate-unlock button does nothing yet.** `app/(dashboard)/homeowner/estimate/page.tsx:187` ("Unlock for $9.99") is a static `<Button>` with no `onClick`, no fetch call, no Stripe wiring. Step 3.4 below ("test the homeowner estimate-unlock flow... confirm it actually unlocks") **cannot be tested until this frontend logic is built** — mirror the pattern already working on the contractor profile page: fetch `/api/stripe` with `{ type: 'estimate_unlock', projectId }` → get `clientSecret` back → call `stripe.confirmPayment()` → on success, the page should reflect `projects.estimate_paid = true` and reveal the itemized breakdown that's currently gated. This is new frontend work, budget time for it.

---

## CONTEXT — DO NOT SKIP

- Confirm `.env.local` exists (copied from `.env.local.example`) with real Supabase URL/keys filled in before doing anything else — Stripe work is meaningless if the app can't run locally.
- Confirm `npm run dev` actually loads the app at localhost:3000 with no console errors before touching Stripe code.
- The existing files to work in — do not create new ones with different names:
  - `lib/stripe.ts`
  - `app/api/stripe/route.ts`
  - `app/api/stripe/webhook/route.ts`

---

## PRIMARY TASK — ISSUE #5: STRIPE INTEGRATION

### Step 1 — Stripe account & products (test mode)
1. Log into the Stripe test-mode dashboard.
2. Create 2 Prices (see Correction #2 above — skip the estimate-unlock Price, it's unused):
   - **Standard subscription** — recurring, $79/month
   - **Growth subscription** — recurring, $149/month
3. Copy the Price IDs and the test-mode Secret Key + Publishable Key.

### Step 2 — Wire real keys
1. Replace the placeholder keys in `.env.local` with the real test-mode keys (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — see Correction #1 — and the 2 Price IDs: `STRIPE_STANDARD_PRICE_ID`, `STRIPE_GROWTH_PRICE_ID`).
2. Do NOT commit `.env.local` — confirm it's still in `.gitignore`.
3. Once verified working locally, add the same keys to Vercel's environment variables (Project Settings → Environment Variables) so the deployed app at renova-platform.vercel.app also works — but only after local testing passes.

### Step 3 — Checkout flow
1. In `app/api/stripe/route.ts`, confirm checkout session creation is wired to the correct Price ID depending on which tier/product is being purchased (Standard, Growth, or estimate unlock).
2. Test contractor signup → Standard checkout using Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC. Confirm checkout completes without error.
3. Repeat for Growth tier.
4. **Build then test** the homeowner estimate-unlock flow with the same test card (see Correction #4 — this needs frontend work first). Confirm the itemized breakdown actually unlocks after payment — check this against the real estimate data, not a placeholder.

### Step 4 — Webhook handling
1. Use the Stripe CLI locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
2. Confirm the webhook secret this generates is placed in `.env.local` as `STRIPE_WEBHOOK_SECRET` (the exact name `app/api/stripe/webhook/route.ts` expects) — do not leave `whsec_placeholder` in place.
3. Trigger a real test payment and confirm in the webhook handler logs:
   - The webhook signature verifies successfully (no signature errors).
   - On a successful contractor subscription payment, `contractor_profiles.subscription_active` flips to `true` in Supabase, and `subscription_tier` is set to the correct value (`standard` or `growth`).
   - Check this by querying the Supabase table directly after the test payment, not just trusting the logs.

### Step 5 — Failure handling
1. Test a declined card (Stripe test card `4000 0000 0000 0002`).
2. Confirm the app shows a clear, user-facing error — not a silent failure, not a blank screen, not a generic 500.
3. Confirm a declined payment does NOT flip `subscription_active` to true.

### Step 6 — Acceptance criteria (verify every one before marking Issue #5 done)
- [ ] Contractor signup completes Standard checkout in test mode
- [ ] Contractor signup completes Growth checkout in test mode
- [ ] On success, `subscription_active` flips true and `subscription_tier` is set correctly
- [ ] Homeowner estimate-unlock frontend is built, payment completes, and unlocks the itemized breakdown
- [ ] Webhook signature verification passes — no `whsec_placeholder` errors anywhere in logs
- [ ] Declined test cards are handled gracefully with a visible error, not a silent failure
- [ ] Same flows re-tested against the deployed Vercel app after env vars are added there, not just locally

---

## IF TIME REMAINS — TWO INDEPENDENT QUICK WINS (no dependency on Issue #5 or on each other)

### Issue #9 — Contractor Waitlist (~half a day)
1. Create a new Supabase table `contractor_waitlist` with columns: business name, trade, ZIP, email (no password field — this is a pre-launch capture form, not a real account).
2. Build a simple form on `/for-contractors` collecting those 4 fields.
3. Build a submission API route that inserts into `contractor_waitlist`.
4. Confirm a test submission actually lands in the Supabase table.

### Issue #10 — Forgot Password / Account Recovery (~2-3 hours)
1. Use Supabase Auth's standard pattern: `resetPasswordForEmail`.
2. Build a reset callback page that lets a user set a new password after clicking the email link.
3. Do not build custom cryptography or a custom token system — Supabase Auth already handles this securely.
4. Test the full loop: request reset → receive email → click link → set new password → log in with the new password successfully.

---

## NOTE FOR SAMEER'S TRACK
Sameer has GitHub admin access as of 2026-07-09 (invite may still be pending acceptance — check `github.com/Rycrypn/Groundwork-platform/invitations` if unsure). This prompt is written for whoever actually runs Issue #5 — Ryan or Sameer, either works.

Do not guess at env var names, table names, or file structure not listed above — check the actual files/repo/issue for anything ambiguous rather than assuming, since this is an existing codebase with real conventions already in place.
