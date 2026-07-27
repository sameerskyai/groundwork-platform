# Legal Documents - Draft Templates

**⚠️ IMPORTANT:** These are working drafts. Before deploying or collecting user data, have a licensed attorney review and finalize these documents for your jurisdiction.

---

## Terms of Service (Draft)

### 1. Services

Groundwork ("Platform") provides two-sided marketplace services:
- **For Homeowners:** Free cost estimates, contractor matching, job completion tracking
- **For Contractors:** Subscription access to job requests, messaging with homeowners
- **For Property Managers/Realtors:** Portfolio management and contractor access

### 2. User Roles & Eligibility

**Homeowners:**
- Must be 18+ years old
- Provide accurate project information
- Responsible for accuracy of project descriptions and photos
- May not use Platform for commercial projects (unless PM tier)

**Contractors:**
- Must be 18+ years old
- Must carry valid business license + liability insurance
- Pass background verification (Checkr) before accepting jobs
- Subject to compliance with all trade-specific regulations
- Cannot fabricate or manipulate reviews

**Property Managers/Realtors:**
- Must be licensed professionals (verified)
- Responsible for tenant/property data security
- Cannot access homeowner personal details beyond project info

### 3. Estimate Accuracy & AI Disclaimers

- Estimates are **AI-generated approximations**, not binding quotes
- Actual costs depend on site inspection, material prices, scope changes
- Homeowners should obtain multiple quotes before committing
- Contractors are not bound by AI estimates; final pricing determined at site visit
- Groundwork is not liable for estimate accuracy discrepancies

### 4. Contractor Verification

- Background checks via Checkr include criminal history, sex offender registry
- License verification is automated; users responsible for maintaining current licenses
- Insurance verification occurs at signup; users must maintain coverage
- Trust scores are calculated from completed job reviews (not self-reported)
- Suspension for trust score < 50 or license/insurance lapse

### 5. Review & Trust Scores

- Reviews must be submitted by homeowners only (after job completion)
- Contractors cannot write their own reviews or ask homeowners to adjust ratings
- Duplicate review attempts are blocked (one review per match)
- Fraudulent reviews subject to removal and account suspension
- Trust scores = average rating + on-time % + dispute-free %

### 6. Communities & Anti-Poaching

- Communities are **homeowner-only spaces** (contractors cannot view/post)
- Contractors accessing community data illegally may face legal action
- Homeowners retain full control over who sees neighborhood/address info
- Contractors may not cold-contact homeowners outside Platform
- Violations subject to immediate suspension

### 7. Messaging & Communication

- All messages flow through Platform (no direct contact info sharing until matched)
- Contractors may not share personal phone/email until homeowner initiates
- Platform may scan messages for safety (spam/harassment filtering)
- Violation of messaging policies (harassment, spamming) = suspension

### 8. Payments & Subscriptions

**Homeowners:**
- $9.99 one-time unlock for detailed cost breakdown (non-refundable)
- $20/mo Communities subscription (7-day free trial)
- Subscriptions auto-renew; cancel anytime in account settings
- Refunds only if billed in error (within 30 days)

**Contractors:**
- $79/mo Standard (5 job requests/day)
- $149/mo Growth (20 job requests/day, priority placement)
- Billed monthly; cancellation effective end of billing period
- No refunds for partial months (but suspension removes access immediately)
- Payment via Stripe; tax calculated automatically per location

### 9. Liability Limitations

Groundwork is a platform, not a contractor. We do not:
- Perform work ourselves
- Guarantee contractor quality or completion
- Warrant estimate accuracy
- Guarantee job completion within timeline
- Handle disputes or payment between parties

**Homeowners:** Use Platform "as-is"; Platform not liable for contractor performance, injury, property damage, or financial loss beyond refund of Platform fees.

**Contractors:** Use Platform "as-is"; Platform not liable for job loss, account suspension, or payment collection issues.

**Maximum liability:** Refund of fees paid to Groundwork in past 30 days.

### 10. Account Termination

Grounds for immediate suspension:
- License/insurance expiration (contractors)
- Trust score < 50 (contractors)
- Fraudulent reviews or profile info
- Harassment or threatening language
- Unauthorized contractor contact with homeowners
- Payment failure (unpaid invoices > 30 days)

Homeowners can delete accounts anytime; data retained 90 days (GDPR compliance).

---

## Privacy Policy (Draft)

### 1. Data We Collect

**From Homeowners:**
- Name, email, phone, address/ZIP code
- Project descriptions, photos, budget, timeline
- Geolocation (if browser permission granted)
- Payment info (Stripe handles directly)
- Preferences (budget, timeline, style, experience level)
- Behavior (swipes, matches, messages, reviews)

**From Contractors:**
- Business name, owner name, email, phone
- License number, state, expiration
- Service radius, working areas (ZIP codes)
- Trust score, rating, job history
- Payment info (Stripe handles directly)
- Insurance details (for verification only; not stored beyond verification)

**From All:**
- IP address, browser type, device type
- Pages visited, time spent, clicks
- Cookies & identifiers (via Vercel Analytics)

### 2. How We Use Data

**Matching & Scoring:**
- Use project + contractor data to calculate compatibility percentages
- Store scores to improve matching algorithm over time
- Use completed job costs to generate better estimates (cost_data moat)

**Communication:**
- Route messages through Platform
- Scan for harmful content (automated, then human review if flagged)
- Retain messages while match is active; delete after 1 year

**Safety & Verification:**
- Share data with Checkr for background checks
- Use Stripe for payment processing (PCI-DSS compliant)
- Track fraud patterns, suspicious accounts

**Analytics & Improvement:**
- Aggregate data (no personal identifiers) for product insights
- Use to improve estimates, matching, UI/UX

### 3. Data We Do NOT Share

❌ We do NOT sell personal data to third parties.
❌ We do NOT share contractor contact info with homeowners before matching.
❌ We do NOT give contractors access to homeowner personal details beyond project scope.
❌ We do NOT sell email lists, profiles, or contact directories.

### 4. Data Retention

| Data | Retention |
|------|-----------|
| Active account data | Until account deleted |
| Messages | 1 year after match ends |
| Reviews/feedback | Indefinite (public record) |
| Payment records | 7 years (tax compliance) |
| Background checks | Per Checkr retention policy |
| Deleted account data | 90 days (GDPR right to deletion) |

### 5. GDPR, CCPA, FCRA Compliance

**GDPR (EU users):**
- Right to access all personal data
- Right to delete account (after 90 days)
- Right to data portability (download CSV export)
- Data Processing Agreement available upon request

**CCPA (California users):**
- Right to know what data we collect
- Right to opt-out of sales (we don't sell anyway)
- Right to delete personal info
- Privacy notice in Settings

**FCRA (Fair Credit Reporting Act):**
- Background checks conducted by Checkr (third-party consumer reporting agency)
- Contractors have right to dispute inaccurate reports
- Adverse action notification if denied based on check
- Dispute process handled by Checkr

### 6. Security

- Data encrypted in transit (TLS 1.3)
- Data encrypted at rest (Supabase encryption)
- Access controlled via role-based security (RLS policies)
- Regular security audits (quarterly minimum)
- Breach notification within 72 hours (GDPR requirement)

### 7. Third-Party Integrations

- **Stripe:** Payment processing, PCI-DSS certified
- **Supabase:** Database hosting, open-source, SOC 2 compliant
- **Mapbox:** Geolocation/reverse geocoding
- **Checkr:** Background verification, FCRA-compliant
- **Vercel:** Hosting, edge functions

### 8. Children's Privacy

Platform is for 18+ only. We do not knowingly collect data from minors. If we discover a minor user, we'll delete their account.

### 9. Policy Changes

We may update this Privacy Policy with 30 days notice. Continued use = acceptance of new terms. Significant changes require opt-in consent.

### 10. Contact

**Privacy inquiries:** privacy@groundwork.com
**Data deletion requests:** delete-my-data@groundwork.com
**DPA/legal requests:** legal@groundwork.com

---

## SMS Consent & Anti-Poaching (Draft)

### SMS Opt-In & 10DLC Carrier Approval

Groundwork uses SMS for:
- Match notifications ("You have a new match!")
- Message notifications
- Account alerts (suspension, expiration)
- Marketing (with separate opt-in)

**User Consent:**
- SMS opt-in shown during signup, not required for core features
- Checkbox: "I consent to receive SMS from Groundwork via [carrier]"
- Users can opt-out anytime via `STOP` text reply or account settings
- Carrier compliance: Follow Twilio + 10DLC rules

### Anti-Poaching Language

**Contractors may NOT:**
- Request homeowner's personal phone/email before Platform match
- Contact homeowner outside Platform after match ends
- Solicit homeowner for projects off-Platform
- Share contractor names/referrals within homeowner communities

**Homeowners may NOT:**
- Share contractor details with other homeowners for free jobs
- Encourage contractor to work off-Platform to avoid Groundwork fees

**Violations:**
- First: Warning + account review
- Second: Temporary suspension (7 days)
- Third: Permanent suspension

---

## Dispute Resolution (Draft)

### Mediation (Required Before Litigation)

If contractor-homeowner dispute occurs (payment, quality, scope):
1. Parties attempt to resolve via messaging (7 days)
2. Either party can escalate to Groundwork support (submit evidence)
3. Groundwork mediates (5 days) — non-binding recommendation
4. If unresolved, proceed to arbitration

### Arbitration

- **Venue:** Binding arbitration, not court
- **Arbitrator:** JAMS or AAA (mutually selected)
- **Costs:** Each party pays own attorney; arbitration fees split
- **Opt-out:** User can opt-out within 30 days of first use

### No Class Actions

Users agree not to bring class action suits. Disputes must be individual arbitration.

---

## To-Do Before Launch

- [ ] Have attorney review all documents for your state/jurisdiction
- [ ] Add specific company name, addresses, contact info
- [ ] Confirm FCRA compliance (Checkr agreement finalized)
- [ ] Add specific SMS carrier requirements (10DLC approved)
- [ ] Implement "Agree to Terms" checkbox during signup
- [ ] Add "Privacy" link to homepage + app
- [ ] Set up legal@groundwork.com email
- [ ] Add dispute resolution contact form
- [ ] Create GDPR Data Subject Request process (automated email → export)
- [ ] Document all data flows for DPA requirements
- [ ] Insurance policy review (E&O, cyber liability)

