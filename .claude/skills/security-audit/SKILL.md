---
name: security-audit
description: Audit changed code for security vulnerabilities in TypeScript/NestJS services and propose practical fixes, including patch-ready remediations when requested.
---

Audit target: $ARGUMENTS

If no target is provided, audit the current diff.

## Goal

Identify exploitable weaknesses early and provide actionable remediations for NestJS/TypeScript projects.

## Security Audit Procedure

### Step 1 - Scope and Entry Points

- Read changed files and map external entry points:
  - controllers/routes
  - DTO validation
  - authentication and authorization guards
  - file uploads and storage
  - external HTTP calls
  - SQL/ORM and migrations

### Step 2 - Threat Checks

Review for:

- authz bypass, missing role/permission checks
- insecure auth defaults, weak secrets, token misuse
- injection risk (SQL, command, template, path traversal)
- insecure file handling (mime spoofing, oversized payloads, unsafe temp files)
- SSRF/open redirect/proxy abuse
- sensitive-data exposure in logs/errors/responses
- insecure CORS, headers, rate limits, API key handling
- unsafe crypto usage (custom crypto, weak algorithms, bad key handling)

### Step 3 - Configuration and Dependency Risk

Check:

- hardcoded secrets or unsafe fallback defaults
- env validation gaps for security-critical values
- optional package risk signals and insecure defaults
- known vulnerable patterns from dependencies in use

### Step 4 - Remediation Design

For each issue propose:

- minimal-risk fix
- stronger hardening option (if applicable)
- test cases to prevent regression

When user asks to fix, implement secure-by-default changes and keep behavior compatible unless explicitly approved otherwise.

### Step 5 - Output Format

Provide:

1. Findings ordered by severity (`Critical`, `High`, `Medium`, `Low`)
2. Affected files and lines
3. Exploit scenario in one sentence
4. Recommended fix
5. Verification steps (automated + manual)

If no findings are detected, respond with `No critical vulnerabilities found in reviewed scope.` and include residual risk notes.

