---
name: Vite test runner blocked
description: vitest is blocked by Replit's security policy in this project, so an alternative test runner is needed for tests.
---

# Vite test runner blocked

During project setup, `npm install` failed because `vitest` (v1.6.x) was blocked by Replit's security policy with a 403 Forbidden from `package-firewall.replit.local`.

**Why:** The package version is forbidden by the environment's security policy.

**How to apply:** If you need to restore test coverage, remove `vitest` from `devDependencies` and install a compatible alternative (e.g., `jest`, `@web/test-runner`, or a newer vitest version that is not blocked). Update `tsconfig.json` to remove `vitest/globals` from `types` if you drop vitest.
