---
name: typescript-review
description: Run a strict TypeScript code review on current changes with focus on correctness, architecture, maintainability, and test quality.
---

Review target: $ARGUMENTS

If no target is provided, review the current working diff.

## Goal

Deliver a high-signal review for TypeScript/NestJS code that prioritizes:

- bugs and behavioral regressions
- unsafe type usage and design leaks
- architecture and layering violations
- missing or weak test coverage

## Review Procedure

### Step 1 - Collect Scope

- Read `git status` and `git diff`.
- If files are provided as arguments, restrict to those files.
- Identify touched modules and their dependencies.

### Step 2 - Functional Correctness

Check for:

- null/undefined paths and unhandled branches
- async/await misuse, promise leaks, race conditions
- broken DTO validation or serialization paths
- incorrect HTTP status handling and error propagation

### Step 3 - TypeScript Quality

Check for:

- `any` usage or implicit weak typing without reason
- incorrect unions, unsafe casts, non-null assertions
- exported types that leak implementation details
- mismatch between runtime behavior and declared types

### Step 4 - NestJS and Architecture

Check for:

- controller/service/repository boundary violations
- direct data-layer access from controller
- missing guards/decorators on protected routes
- duplicated business logic that should be centralized
- config/env usage that is hardcoded or brittle

### Step 5 - Tests and Verification

Check for:

- missing tests for critical logic and edge cases
- fragile tests that overfit internals
- lack of negative-path assertions
- missing integration/e2e coverage where behavior changed

### Step 6 - Severity and Output

Report findings in this order:

1. `High`: correctness, security, data loss, auth bypass, runtime crash
2. `Medium`: likely bug, significant maintainability risk
3. `Low`: style/readability/minor improvements

For each finding include:

- severity
- file path and line
- issue summary
- why it matters
- concrete fix recommendation

If no findings exist, explicitly state: `No critical findings.` and list residual risks/testing gaps.

