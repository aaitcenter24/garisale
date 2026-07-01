---
name: /run-load-tests
description: Run when executing load tests (k6), checking p95/p99 latency, or verifying sync queue throughput.
---

# Workflow: /run-load-tests

### Workflow: /run-load-tests

This workflow measures platform performance under load.

#### Execution Steps:
1. Execute k6 load tests against search, listing, and lead endpoints.
2. Verify that p95/p99 targets are met (e.g., \GET /marketplace/search\ p95 < 200ms at 100 RPS).
3. Check the \sync-vehicle\ queue depth and verify processing times.
