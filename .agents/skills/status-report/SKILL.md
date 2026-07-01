---
name: /status-report
description: Run when summarizing build progress, completed steps, current test coverage, and upcoming tasks.
---

# Workflow: /status-report

### Workflow: /status-report

This workflow compiles the current status report of the Garisale monorepo build.

#### Execution Steps:
1. Query the current step of the build plan.
2. List completed items and pending acceptance criteria.
3. Report test coverage status.
4. Note any open questions or escalations.
