# LEGAL & COMPLIANCE TODO

**Status:** Not started | **Blocker:** Yes (before real users, before fundraising)  
**Owner:** Sameer (founder) — these need attorney review  
**Last Updated:** 2026-07-17

---

## BEFORE REAL USERS (Critical Path)

### [ ] 1. Terms of Service
**What:** Legal document governing user agreement  
**Why:** Liability shield, feature terms, IP ownership, dispute resolution  
**Scope:** 
- User obligations (no fraud, no harassment, etc.)
- Groundwork IP ownership + license grant to users
- Limitation of liability (contractor quality NOT guaranteed)
- Indemnification clause for contractor-homeowner disputes
- Modification/termination rights

**Timeline:** Required before any real user signups  
**Attorney:** [ ] assigned

---

### [ ] 2. Privacy Policy
**What:** How user data is collected, stored, used, shared  
**Why:** GDPR/CCPA compliance, user trust, data handling disclosure  
**Scope:**
- Data we collect (profiles, location, chat history, API costs)
- How long we retain it (deletion policy after account close)
- Who we share with (contractors when matched, Supabase, Stripe)
- User rights (access, deletion, portability)
- Security practices (encryption, RLS policies)
- Cookie/tracking policy

**Timeline:** Required before any real user signups  
**Attorney:** [ ] assigned

---

### [ ] 3. Contractor Scoring & Recommendation Fairness
**What:** Legal audit of AI-driven matching algorithm  
**Why:** Defamation/discrimination exposure — contractors could sue if match score feels arbitrary or biased  
**Scope:**
- Does the 80%+ threshold discriminate against any protected class?
- Can contractors request match score explanation/appeal?
- Does the algorithm explain its reasoning to homeowners?
- Is the scoring audited for bias (gender, race, age, disability)?
- What's Groundwork's liability if a "matched" contractor does poor work?

**Timeline:** Required before contractor-facing features  
**Attorney:** [ ] assigned

---

### [ ] 4. Personality Questions — Discrimination Audit
**What:** Legal review of the 5 personality questions for homeowners  
**Why:** Employment discrimination law applies to certain hiring contexts; personality testing can expose protected-class bias  
**Scope:**
- Do any questions elicit protected-class info (disability, age, gender, national origin)?
- Could answers be used to discriminate against contractors?
- Are results explained to contractors (i.e., is it a "black box")?
- Should there be a way to opt out or re-test?

**Timeline:** Required before matching goes live  
**Attorney:** [ ] assigned

---

### [ ] 5. Delaware C-Corp Setup
**What:** Corporate formation documents  
**Why:** Liability protection, fundraising readiness, founder IP assignment  
**Scope:**
- Certificate of Incorporation
- Bylaws
- Stock ledger
- Founder IP assignment agreement (all prior work assigned to corp)
- 409A valuation (if stock options planned)

**Timeline:** Required before any outside investment  
**Attorney:** [ ] assigned  
**Status:** Not started

---

## BEFORE CONTRACTOR PAYMENTS (Critical Path)

### [ ] 6. Payment Terms & Dispute Resolution
**What:** Legal framework for contractor payment  
**Why:** Prevents contractor chargeback claims, defines dispute process  
**Scope:**
- Payment timing (when homeowner pays, when Groundwork pays contractor)
- Refund policy if work is unsatisfactory
- What happens if contractor abandons job?
- Dispute resolution process (arbitration vs. court)
- Fee structure (% of project, flat fee, commission?)

**Timeline:** Required before enabling contractor payments  
**Attorney:** [ ] assigned

---

### [ ] 7. Contractor T&Cs (separate from homeowner T&Cs)
**What:** Terms specific to contractors  
**Why:** Define contractor responsibilities, rating/review policies, suspension/termination  
**Scope:**
- Code of conduct (no discrimination, no shoddy work)
- Review policy (can contractors dispute negative reviews?)
- Suspension/termination conditions (fraud, bad ratings)
- Insurance requirements (licensing, bonding)
- 1099 vs. W2 classification
- IP ownership of photos/work samples

**Timeline:** Required before contractor signup goes live  
**Attorney:** [ ] assigned

---

## BEFORE SMS/CALLS (Future, Not Blocking MVP)

### [ ] 8. TCPA Compliance
**What:** Telephone Consumer Protection Act compliance for SMS/calls  
**Why:** $500-$1500 per violation, treble damages class action risk  
**Scope:**
- Express written consent before any SMS
- Opt-out mechanism (STOP reply)
- Calling hours (no calls before 8am or after 9pm)
- Do-not-call registry check
- Autodialer/prerecorded disclaimer

**Timeline:** Only if adding SMS notifications  
**Attorney:** [ ] assigned

---

## BEFORE FUNDRAISING

### [ ] 9. IP Assignment & Founder Agreements
**What:** Documented proof Groundwork owns all code + ideas  
**Why:** Investors won't fund if IP ownership is unclear  
**Scope:**
- Founder IP assignment agreement (you assign all prior work to corp)
- Employee IP assignment templates (if hiring)
- Third-party contractor IP assignment (if outsourced code)
- Clear ownership of AI-generated code (who owns Claude output?)
- Patent strategy (file? not file? publish?)

**Timeline:** Required before any investor conversations  
**Attorney:** [ ] assigned

---

### [ ] 10. Fundraising Documents (optional, only if raising)
**What:** Series A/Seed term sheet templates, cap table management  
**Why:** Streamline fundraising conversations  
**Scope:**
- SAFE or term sheet template
- Stockholders' agreement template
- Option pool guidelines
- Information rights template
- Anti-dilution policy

**Timeline:** Only if pursuing institutional capital  
**Attorney:** [ ] assigned

---

## STATUS TRACKER

| Item | Done | Attorney Assigned | Notes |
|------|------|---|---|
| ToS | ❌ | ❌ | Critical path |
| Privacy Policy | ❌ | ❌ | Critical path |
| Contractor Scoring Audit | ❌ | ❌ | Critical path |
| Personality Q Audit | ❌ | ❌ | Critical path |
| DE C-Corp | ❌ | ❌ | Recommended before raising |
| Payment T&Cs | ❌ | ❌ | Blocking contractor pay |
| Contractor T&Cs | ❌ | ❌ | Blocking contractor signup |
| TCPA Compliance | ⏳ | ❌ | Only if SMS enabled |
| IP Assignment | ❌ | ❌ | Blocking fundraising |
| Fundraising Templates | ⏳ | ❌ | Only if raising |

---

## NEXT STEP

**Action:** Sameer + Ryan schedule intro call with attorney (recommend: founder-friendly tech lawyer familiar with marketplaces).  
**Cost Estimate:** $2K-$5K for critical path review (ToS, Privacy, C-Corp, IP)  
**Timeline:** Should be done before real user beta (4-6 week lead time for attorney)

**Do not deploy to real users until critical path items are reviewed & approved.**
