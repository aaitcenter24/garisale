---
name: /run-security-tests
description: Run when validating security controls, testing RLS, or checking the 25 multi-tenant penetration scenarios.
---

# Workflow: /run-security-tests

### Workflow: /run-security-tests

This workflow verifies the security posture of the Garisale platform.

#### Execution Steps:
1. Run database integration security tests checking RLS enforcement.
2. Verify all 25 multi-tenant penetration scenarios (e.g., UUID substitution, JWT manipulation).
3. Validate that admin panel endpoints block requests from non-allowlisted IPs.
4. Ensure no stack traces are leaked in production error responses.
