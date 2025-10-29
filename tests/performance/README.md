# Performance Test Suite

This directory houses lightweight load and latency checks that can be executed locally or in CI before major releases.

## Running the suite

```bash
npm run test:performance
```

Set `PERF_BASE_URL` to point at a running environment (defaults to `http://localhost:3000`).

## Structure

- `scenarios/` – individual scenarios encapsulating request logic.
- `run.ts` – orchestrator that executes enabled scenarios and prints a summary table.
