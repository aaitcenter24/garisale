---
name: /run-rbac-tests
description: Run when validating role-based access control, field masking, or running the 90 RBAC test scenarios.
---

# Workflow: /run-rbac-tests

### Workflow: /run-rbac-tests

This workflow validates role-based access control and field masking.

#### Execution Steps:
1. Execute the 90 role-based test scenarios spanning Inventory, CRM, Sales, and Expense modules.
2. Verify that financial fields return \
ull\ (not undefined) for Managers and Salespersons to prevent UI crashes.
3. Test permission boundary enforcement on admin roles.
