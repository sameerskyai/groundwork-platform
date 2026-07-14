# Checkr Integration Plan (#21)

## Overview

Checkr is a background check and verification platform. For Groundwork, we'll use it to verify contractors before they can access the platform and accept jobs.

**Reference:** https://checkr.com/developers

## Authentication

- **API Key:** Bearer token in Authorization header
- **Environment:** Test (sandbox) mode for development; production mode for live verification
- **Endpoint:** `https://api.checkr.com/v1/` (test and production use same endpoint; API key determines mode)

## Required Data for Contractor Verification

When creating a verification check via Checkr, we need:
- **Legal name** (first + last)
- **Email** (must be the contractor's email)
- **Phone** (optional but recommended for SMS updates)
- **Date of birth** (YYYY-MM-DD format)
- **Social Security Number (SSN)** (last 4 digits minimum; full SSN for background checks)
- **Driver's license number + state** (optional; used for identity verification)

Example request body:
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1-555-0123",
  "dob": "1990-01-15",
  "ssn": "123456789",
  "driver_license_number": "D123456789",
  "driver_license_state": "CA"
}
```

## Check Types

1. **Offender Search** — Criminal record check (fastest, ~30 seconds)
2. **Motor Vehicle Report (MVR)** — Driving record check (useful for contractor vetting)
3. **Sex Offender Registry** — National sex offender search
4. **County Criminal Search** — State/county level criminal checks (slower, 5-48 hours)

For contractors, recommended stack:
- Offender Search (instant)
- County Criminal Search (5-48 hours)
- Motor Vehicle Report (instant for licensed drivers)

## API Response & Status

### After Creating a Check

```json
{
  "id": "check_abc123def456",
  "status": "pending",
  "package": "standard",
  "created_at": "2026-01-15T10:30:00Z",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "reports": []
}
```

**Status values:**
- `pending` — Check in progress
- `clear` — No issues found
- `consider` — Issues found; manual review needed
- `suspended` — Unable to verify (missing data, identity mismatch)
- `adverse_action_initiated` — Potential legal flag found; requires disclosure

### Polling vs. Webhooks

**Polling approach:** Query `/checks/{id}` endpoint every 30-60 seconds until `status` != `pending`
**Webhook approach:** Checkr posts updates to a pre-configured webhook URL when status changes

Webhooks are preferred for production; polling for testing/development.

## Webhook Structure

Checkr POSTs to your configured webhook URL when check status changes:

```json
{
  "id": "check_abc123def456",
  "type": "check.completed",
  "created_at": "2026-01-15T11:45:00Z",
  "data": {
    "id": "check_abc123def456",
    "status": "clear",
    "reports": [
      {
        "id": "report_xyz789",
        "type": "offender_search",
        "status": "clear"
      }
    ]
  }
}
```

**Webhook signature verification:**
- Headers include `X-Checkr-Signature` (HMAC-SHA256)
- Signature format: `sha256={hex_digest_of_request_body}`
- Verify using your API key as the HMAC secret

## Integration Points

### 1. Contractor Onboarding
- During contractor signup/profile completion, collect SSN, DOB, license info
- Create Checkr check via API
- Store `check_id` in `contractor_profiles.checkr_check_id` column
- Show UI message: "Verification in progress — this typically takes 24-48 hours"

### 2. Database Schema Update Needed
```sql
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS checkr_check_id TEXT;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS checkr_status TEXT; -- 'pending', 'clear', 'consider', 'suspended'
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS checkr_reports JSONB; -- Store report details
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
```

### 3. Webhook Handler
- Endpoint: `/api/contractors/verify/webhook` (POST)
- Verify Checkr signature
- Update `contractor_profiles` with new status
- If status = 'clear', allow contractor to start accepting jobs
- If status = 'consider', flag for manual review
- If status = 'suspended', prevent contractor access

### 4. Admin Dashboard
- Show verification status per contractor
- Flag contractors with 'consider' status for manual review
- Display reason if available from Checkr reports

## Test Mode

**Test credentials for development:**
```
Name: John Doe
DOB: 1990-01-15
SSN: 123-45-6789 (test SSN)
Email: john@example.com
```

**Test API key format:**
- Test: `sk_test_...`
- Live: `sk_live_...`

Test mode checks return instant results.

## Implementation Roadmap

### Phase 1 (Issue #21 — Research)
- [x] Document Checkr API
- [ ] Set up Checkr sandbox account
- [ ] Test API credentials with sample request

### Phase 2 (Issue #6 — Build)
- [ ] Add schema columns for check tracking
- [ ] Create contractor verification initiation flow
- [ ] Build webhook handler for status updates
- [ ] Add manual review UI for 'consider' status

### Phase 3 (Post-launch)
- [ ] Migrate to production API keys
- [ ] Implement compliance documentation (CRA, FCRA)
- [ ] Add dispute resolution for adverse actions

## Compliance Notes

- **FCRA (Fair Credit Reporting Act):** Checkr handles compliance; ensure we get proper contractor consent before running checks
- **State-specific rules:** Some states require written notice before credit/background checks
- **Adverse action disclosure:** If a contractor is denied based on Checkr results, legal requirements apply

Checkr provides templates; review with legal counsel.

## Cost

- Offender Search: ~$0-2 per check
- County Criminal Search: ~$5-15 per check
- MVR: ~$3-5 per check
- Bundled packages: ~$15-30 per contractor

**Estimate for beta:** 100 contractors x $20/avg = $2,000

## Next Steps

1. Create Checkr sandbox account (free tier available)
2. Retrieve test API key
3. Write schema migration (#21)
4. Create `/api/contractors/verify/` POST endpoint for initiating checks
5. Create `/api/contractors/verify/webhook` handler for Checkr callbacks
6. Test with sample contractor profile
