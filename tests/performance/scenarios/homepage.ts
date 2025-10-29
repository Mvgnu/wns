// meta: module=performance.homepage purpose="Baseline load checks for homepage and discovery endpoints"
import { performance } from 'node:perf_hooks';

const DEFAULT_ITERATIONS = Number(process.env.PERF_ITERATIONS ?? '10');
const DEFAULT_CONCURRENCY = Number(process.env.PERF_CONCURRENCY ?? '3');
const BASE_URL = process.env.PERF_BASE_URL ?? 'http://localhost:3000';

type Metrics = {
  readonly endpoint: string;
  readonly requests: number;
  readonly averageMs: number;
  readonly p95Ms: number;
};

async function hitEndpoint(path: string) {
  const url = `${BASE_URL}${path}`;
  const start = performance.now();
  const response = await fetch(url, { redirect: 'manual' });
  const end = performance.now();

  return {
    duration: end - start,
    status: response.status,
    ok: response.ok
  };
}

async function executeBatch(path: string, iterations: number, concurrency: number) {
  const durations: number[] = [];
  let completed = 0;

  async function worker() {
    while (completed < iterations) {
      const current = completed;
      completed += 1;
      if (current >= iterations) return;
      const result = await hitEndpoint(path);
      durations.push(result.duration);
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  durations.sort((a, b) => a - b);

  const total = durations.reduce((sum, value) => sum + value, 0);
  const average = durations.length ? total / durations.length : 0;
  const p95 = durations.length ? durations[Math.floor(durations.length * 0.95) - 1] ?? durations.at(-1)! : 0;

  return {
    averageMs: Number(average.toFixed(2)),
    p95Ms: Number(p95.toFixed(2)),
    requests: durations.length
  };
}

export async function runHomepageScenario(): Promise<Metrics[]> {
  const iterations = Math.max(DEFAULT_ITERATIONS, 1);
  const concurrency = Math.max(DEFAULT_CONCURRENCY, 1);

  const targets = ['/', '/groups', '/locations'];

  const results: Metrics[] = [];
  for (const path of targets) {
    const metrics = await executeBatch(path, iterations, concurrency);
    results.push({ endpoint: path, ...metrics });
  }

  return results;
}
