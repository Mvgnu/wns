# Reliability Runbooks

## Feature Flags
- Source: `lib/featureFlags.ts`
- Toggle via environment variables prefixed with `FEATURE_` (e.g., `FEATURE_GROUPCHAT=false`).
- Runtime overrides for emergency mitigation can be applied through `setFeatureOverride` in server utilities/tests.
- Documented flags:
  - `eventLifecycle`
  - `personalizedHome`
  - `organizerConsole`
  - `groupChat`
  - `geoDiscovery`
  - `growthOnboarding`
  - `analyticsDashboards`
  - `resilienceCircuitBreakers`
  - `smokeTests`

## Circuit Breaker Recovery
- Module: `lib/circuitBreaker.ts` with `withCircuitBreaker` helper.
- Inspect logs for `[CircuitBreaker:*]` entries to identify tripped breakers.
- Reset a breaker by calling `resetCircuitBreaker('name')` via `node` REPL or admin console.
- Default policy: 3 consecutive failures, 4s timeout, 30s cool-off.
- Authentication breaker is stricter (2 failures, 15s reset) to protect session lookups.

## Smoke Test Execution
- Command: `npm run test:e2e:smoke`
- Ensures homepage, group discovery, and map rendering work without console errors.
- Controlled by `FEATURE_SMOKETESTS` flag for CI gating.

## Performance Sweep
- Command: `npm run test:performance`
- Targets: `/`, `/groups`, `/locations`
- Environment variables:
  - `PERF_BASE_URL` – base URL (defaults to `http://localhost:3000`).
  - `PERF_ITERATIONS` – total requests per endpoint (default 10).
  - `PERF_CONCURRENCY` – concurrent workers (default 3).
- Output: console table with average and p95 response times.

## Incident Escalation
1. Verify feature flag status for impacted capability.
2. Check circuit breaker logs; reset if safe.
3. Run smoke tests to confirm primary surfaces.
4. Capture performance run to benchmark recovery.
5. Update this runbook with post-incident learnings.
