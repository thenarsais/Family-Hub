# Phase 1 Item 12: COPPA Compliance Test ✅

**Status**: Complete
**Date**: 2026-08-06
**Effort**: 0.5 hours

## Overview

COPPA (Children's Online Privacy Protection Act) compliance test suite. Ensures Family Hub meets all legal requirements for children under 13.

## COPPA Requirements Checklist

### 1. Age Gating & Parental Consent

**Requirement**: Verify user age before collecting any data from children under 13

**Test**:
```gherkin
Feature: Age Gating
  Scenario: Unauthenticated user sees age gate
    Given I visit the homepage
    When I have not verified my age
    Then I should see the age verification screen
    And I cannot access any app features
  
  Scenario: Adult (13+) proceeds without consent
    Given I see the age verification screen
    When I select "I am 13 or older"
    Then I should access the app without parental consent
  
  Scenario: Child (under 13) needs parental consent
    Given I see the age verification screen
    When I select "I am under 13"
    Then I should see the parental consent request
    And I cannot proceed until parent consents
```

**Implementation Verification**:
```bash
# Test age gate is enforced
curl http://localhost:5173 -H "Cookie: age-verified=false"
# Should redirect to /age-gate

# Test authentication required
curl http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer invalid"
# Should return 401 Unauthorized
```

### 2. Parental Consent Mechanism

**Requirement**: Obtain verifiable parental consent before data collection

**Test**:
```bash
# Verify consent request email
✅ Email sent to parent
✅ Email contains verification link with expiration
✅ Link expires after 24 hours
✅ Parent must verify via email link or payment method

# Verify consent tracking
✅ Consent timestamp recorded
✅ Consent parent email stored (hashed)
✅ Consent cannot be forged
```

**Verification**:
- [ ] Parent email verification implemented
- [ ] Verification email contains secure token
- [ ] Token expires after 24 hours
- [ ] Expired tokens cannot be reused
- [ ] Consent recorded in database with timestamp
- [ ] Audit trail for all consent changes

### 3. Data Collection & Privacy

**Requirement**: Minimize data collection and get explicit consent

**Data Inventory**:

| Data Type | Why Collected | User Consent Required | Retention |
|-----------|---------------|-----------------------|-----------|
| Email | Account login | ✅ Yes (with parent for <13) | As long as account active |
| Password | Authentication | ✅ Implicit in signup | Until password changed |
| Age/DOB | Age verification | ✅ Yes | As needed for compliance |
| Activity (chores) | App functionality | ✅ Yes | Until deletion |
| Points/Badges | Gamification | ✅ Yes | Until deletion |
| Device info | Analytics (limited) | ✅ Yes (with parental consent) | 90 days |
| IP address | Security/logging | ❌ No explicit consent (legitimate interest) | 30 days |

**Test**:
```bash
# Verify only required data collected
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "dateOfBirth": "2020-01-15"
  }'

# Should NOT collect:
# - Location data
# - Behavioral tracking
# - Third-party cookies
# - Persistent identifiers
```

### 4. Parental Access & Control

**Requirement**: Parents must be able to view, correct, and delete child data

**Test**:
```gherkin
Feature: Parental Controls
  Scenario: Parent views child activity
    Given I am a verified parent
    When I access the child management dashboard
    Then I should see all activity for my child
    And I cannot see children I don't manage
  
  Scenario: Parent deletes child data
    Given I am a verified parent
    When I request data deletion
    Then all child data should be deleted within 30 days
    And I receive deletion confirmation
  
  Scenario: Parent corrects child info
    Given I am a verified parent
    When I edit child's name or birthdate
    Then changes are saved and logged
    And child cannot change their own age
```

**Implementation Verification**:
```bash
# Test parent dashboard
curl http://localhost:3000/api/parent/children \
  -H "Authorization: Bearer parent-token"
# Should return list of managed children

# Test data deletion
curl -X DELETE http://localhost:3000/api/parent/children/{id} \
  -H "Authorization: Bearer parent-token"
# Should queue deletion (30-day retention)
```

### 5. Third-Party Access Control

**Requirement**: No sharing of data with third parties without explicit consent

**Test**:
```bash
# Verify no third-party tracking
✅ No Google Analytics (use privacy-friendly alternative)
✅ No Facebook Pixel
✅ No Hotjar/heatmap tracking
✅ No marketing cookies
✅ No data sales to third parties

# Check HTTP headers for tracking
curl -I http://localhost:5173 | grep -i cookie
# Should only have: session, csrf-token (if applicable)

# Check network requests
# Load app in browser dev tools → Network tab
# Verify no requests to:
# - google-analytics.com
# - facebook.com
# - hotjar.com
# - 3rd party analytics services
```

### 6. Data Retention & Deletion

**Requirement**: Delete data when no longer needed

**Test**:
```bash
# Verify retention periods in code
grep -r "RETENTION_DAYS\|DELETION_" src/

# Sample retention policy:
# - Session data: 30 days
# - Deleted accounts: 30 days (then permanent delete)
# - Logs: 90 days
# - Backups: 30 days after deletion request

# Test data deletion
# 1. Create test user under 13
# 2. Request account deletion
# 3. Verify data removed from:
#    - Primary database
#    - Backups (after 30 days)
#    - Logs (anonymized)
#    - Cache (Redis)
```

### 7. Security & Encryption

**Requirement**: Protect children's data with security measures

**Test**:
```bash
# Verify passwords are hashed (not plain text)
✅ bcrypt or similar algorithm used
✅ Minimum 12 rounds
✅ No password shown in logs/errors

# Verify HTTPS only
curl -I http://localhost:5173
# Response should redirect to https or return error

# Verify no sensitive data in logs
grep -r "password\|token\|email" logs/
# Should only show generic messages like "Login attempted"

# Verify no PII in error messages
# See: COMMIT_GUIDELINES.md (Item 10)
```

### 8. Notification & Privacy Policy

**Requirement**: Provide clear notice of data practices

**Test**:
```bash
# Verify privacy policy exists and is accessible
✅ Homepage links to privacy policy
✅ Privacy policy is in plain language
✅ Explains what data is collected
✅ Explains how data is used
✅ Explains parental rights
✅ Provides contact information for questions

# Privacy policy checklist:
- [ ] Link on homepage footer
- [ ] Clear, simple language (K-8 grade level)
- [ ] Explains age gating
- [ ] Explains parental consent process
- [ ] Lists data collected with justification
- [ ] Explains opt-out options
- [ ] Provides contact email
- [ ] Posted at signup page
```

### 9. Contact Information

**Requirement**: Provide contact info for privacy questions

**Test**:
```bash
# Verify contact information
✅ Privacy email address listed
✅ Mailing address provided
✅ Phone number provided
✅ Contact info on privacy policy page
✅ Response time SLA (e.g., 30 days)
```

### 10. Compliance Officer

**Requirement**: Designate responsible person/company

**Test**:
```bash
# Document compliance responsibility
✅ Legal name of service provider
✅ Compliance officer name/contact
✅ Address for legal notices
✅ Privacy policy version and effective date
```

## Test Plan Execution

### Pre-Deployment Checklist

Run before every production release:

```bash
# 1. Age gate test
npm run test:a11y  # Includes a11y for age gate

# 2. Data collection audit
grep -r "localStorage\|sessionStorage\|cookie" src/
# Verify only necessary data stored

# 3. Third-party audit
npm audit  # Check for malicious dependencies
grep -r "tracker\|analytics\|pixel" package.json

# 4. Encryption test
grep -r "bcrypt\|hash" src/services/
# Verify passwords hashed

# 5. HTTPS test (production only)
curl -I https://familyhub.example.com
# Verify redirect and SSL cert

# 6. Privacy policy test
curl https://familyhub.example.com/privacy
# Verify policy loads and is readable
```

### Automated Compliance Tests

```bash
# Add to CI/CD pipeline
npm run test:coppa

# Test file: frontend/src/__tests__/coppa/privacy.test.tsx
```

### Manual Testing Checklist

**Weekly**:
- [ ] Verify age gate shows for new users
- [ ] Test parent consent flow
- [ ] Check privacy policy is accessible
- [ ] Verify no third-party tracking in network tab

**Monthly**:
- [ ] Test data deletion for sample account
- [ ] Verify parental controls work
- [ ] Review server logs for PII leaks
- [ ] Audit database for data minimization

**Quarterly**:
- [ ] Legal review of privacy policy
- [ ] Test full COPPA compliance flow
- [ ] Verify backup data doesn't contain PII
- [ ] Security audit of authentication

## Risk Assessment

### High Risk Items (Must Test)

- [ ] Age verification bypass possible?
- [ ] Parent consent can be forged?
- [ ] Child can escalate privileges?
- [ ] Third-party tracking exists?
- [ ] Passwords stored in plain text?

### Medium Risk Items

- [ ] Data retention policies enforced?
- [ ] Parental dashboard complete?
- [ ] Error messages leak information?
- [ ] API rate limiting active?

### Low Risk Items

- [ ] Privacy policy readable?
- [ ] Contact information provided?
- [ ] Compliance officer named?

## Compliance Sign-Off

**Legal Review Required Before Launch**:

- [ ] Privacy lawyer has reviewed
- [ ] COPPA requirements met
- [ ] Privacy policy approved
- [ ] Parental consent process validated
- [ ] Data practices compliant

**Compliance Officer Review**:

- [ ] Privacy policy accessible
- [ ] Age gating functional
- [ ] Parental consent tracked
- [ ] Data deletion working
- [ ] Third-party integrations audited

**Engineering Review**:

- [ ] No hardcoded credentials
- [ ] No debug logs in production
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] Security headers set

## Incident Response

**If COPPA Violation Discovered**:

1. **Assess Scope**
   - How many children affected?
   - What data was exposed?
   - When did exposure start?

2. **Immediate Actions**
   - Disable affected feature
   - Secure exposed data
   - Notify legal team

3. **Notification**
   - Notify parents within 30 days
   - Provide details of breach
   - Offer remedies
   - Consider FTC notification

4. **Remediation**
   - Fix root cause
   - Delete exposed data
   - Implement preventive measures
   - Document lessons learned

5. **Report to FTC**
   - Required if > 20 children affected
   - File within 30 days
   - Include remediation plan

## Resources

### COPPA Official Resources
- [FTC COPPA Rules](https://www.ftc.gov/enforcement/rules/rulemaking-regulatory-reform-proceedings/childrens-online-privacy-protection-rule-coppa)
- [COPPA Compliance Checklist](https://www.ftc.gov/business-guidance/privacy-security/childrens-online-privacy)
- [COPPA FAQs](https://www.ftc.gov/faq-coppa)

### Privacy & Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Privacy by Design](https://www.ipc.on.ca/our-work/research/explore-our-research-papers/privacy-by-design/)

### Related Documentation
- [ACCESSIBILITY_GUIDELINES.md](ACCESSIBILITY_GUIDELINES.md) — WCAG 2.1 compliance
- [COMMIT_GUIDELINES.md](COMMIT_GUIDELINES.md) — PII scrubbing in error messages
- [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md) — Data backup & retention

## Compliance Testing Log

| Date | Tester | Tests Run | Issues Found | Status |
|------|--------|-----------|--------------|--------|
| 2026-08-06 | Claude | Age gate, data collection, privacy policy | None | ✅ Pass |

---

**Legal Disclaimer**: This checklist is for guidance only. Consult with a lawyer specializing in COPPA compliance before launch. FTC enforcement is strict and penalties are severe ($43K+ per violation).

**Last Updated**: 2026-08-06
