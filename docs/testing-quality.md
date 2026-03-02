# Testing and Quality

## Commands
```bash
npm run typecheck
npm run lint:check
npm run test
npm run test:e2e
npm run build:app
```

## Build Guard
`prebuild` runs:
```bash
npm run quality:check
```
This includes typecheck, lint check, and test.

## Recommended Development Loop
1. Implement one logical unit
2. Run `npm run typecheck`
3. Run `npm run lint:check`
4. Run `npm run test`
5. Run `npm run build:app` before finalizing

## Test Scope Guidance
- Unit tests for service logic and guards
- E2E for endpoint behavior and guard integration
- Add negative-path tests for auth, throttling, and validation
